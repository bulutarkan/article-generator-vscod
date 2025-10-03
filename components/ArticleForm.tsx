import React, { useState, useRef, useEffect, useCallback } from 'react';
import { countries } from '../data/countries';
import { GeoIcon } from './icons/GeoIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { TopicIcon } from './icons/TopicIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ToggleSwitch } from './ToggleSwitch';

import { Globe, FileText, X, Upload } from 'lucide-react'; // Import additional icons
import { Loader } from './Loader'; // Import Loader component
import type { SuggestedKeyword } from '../types'; // Import SuggestedKeyword type

// File parsing imports
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

interface ArticleFormProps {
  topic: string;
  setTopic: (topic: string) => void;
  location: string;
  setLocation: (location: string) => void;
  tone: string;
  setTone: (tone: string) => void;
  brief: string;
  setBrief: (brief: string) => void;
  enableInternalLinks: boolean;
  setEnableInternalLinks: (enabled: boolean) => void;
  websiteUrl: string;
  setWebsiteUrl: (url: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onAnalyzeContent?: () => void;
  isAnalyzing?: boolean;
  // New props for keyword suggestions
  isCrawling: boolean;
  suggestedKeywords: SuggestedKeyword[];
  handleCrawlWebsite: () => Promise<void>;
  handleKeywordToggle: (keyword: string) => void;
  crawlingError: string | null;
}

export const ArticleForm: React.FC<ArticleFormProps> = ({
  topic,
  setTopic,
  location,
  setLocation,
  tone,
  setTone,
  brief,
  setBrief,
  enableInternalLinks,
  setEnableInternalLinks,
  websiteUrl,
  setWebsiteUrl,
  onSubmit,
  isLoading,
  onAnalyzeContent,
  isAnalyzing = false,
  // Destructure new props
  isCrawling,
  suggestedKeywords,
  handleCrawlWebsite,
  handleKeywordToggle,
  crawlingError,
}) => {
  const tones = ['Authoritative', 'Formal', 'Professional', 'Casual', 'Funny'];

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isToneOpen, setIsToneOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const toneDropdownRef = useRef<HTMLDivElement>(null);

  // File upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
      if (toneDropdownRef.current && !toneDropdownRef.current.contains(event.target as Node)) {
        setIsToneOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationSelect = (country: string) => {
    setLocation(country);
    setLocationSearch('');
    setIsLocationOpen(false);
  };

  const filteredCountries = countries.filter(c => c.toLowerCase().includes(locationSearch.toLowerCase()));

  // File parsing functions
  const parsePDFFile = async (file: File): Promise<string> => {
    try {
      // Configure PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      // Load the PDF document
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Extract text items and join them
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();

        if (pageText) {
          fullText += pageText + '\n\n';
        }
      }

      // Clean up the extracted text
      fullText = fullText
        .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
        .trim();

      // Add file info header
      const fileInfo = `PDF File: ${file.name}\nDocument Content:\n\n`;

      return fileInfo + fullText;
    } catch (error) {
      console.error('PDF parsing error:', error);
      // Fallback message in case PDF parsing fails
      const message = `PDF File: ${file.name}\nDocument Content:

PDF file "${file.name}" has been successfully loaded, but automatic text extraction failed.

To use the PDF content:
1. Open the PDF file in a PDF viewer or browser
2. Select all content (Ctrl+A or Cmd+A)
3. Copy the content (Ctrl+C or Cmd+C)
4. Paste into the "Brief" field above

This will ensure the AI can use your research data in the article.

File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB

Error: ${error instanceof Error ? error.message : 'Unknown error'}`;

      return message;
    }
  };

  const parseDOCXFile = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      let content = result.value.trim();

      // Clean up the content
      content = content
        .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
        .replace(/^\s+|\s+$/g, ''); // Trim whitespace

      // Add file info
      const fileInfo = `DOCX File: ${file.name}\nDocument Content:\n\n`;

      return fileInfo + content;
    } catch (error) {
      console.error('DOCX parsing error:', error);
      // Fallback to basic file info
      return `DOCX File: ${file.name}\n\nUnable to extract full content from DOCX file. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  const parseCSVFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;

          // Simple CSV parsing - improve delimiter detection
          let delimiter = ',';
          const lines = csv.split('\n').filter(line => line.trim());

          if (lines.length < 1) {
            resolve(`CSV File: ${file.name}\n\nCSV file appears to be empty.\n\nFile Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            return;
          }

          // Try to detect delimiter by counting occurrences in first few lines
          const firstLine = lines[0];
          const delimiters = [',', ';', '\t', '|'];
          let maxCount = 0;

          for (const d of delimiters) {
            const count = (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length;
            if (count > maxCount) {
              maxCount = count;
              delimiter = d;
            }
          }

          // Parse data with detected delimiter
          const data = lines.map(line => line.split(delimiter).map(cell => cell.trim()));

          if (data.length === 0) {
            reject(new Error('CSV file appears to be empty'));
            return;
          }

          // Detect if first row is header (simple heuristic)
          let isHeaderRow = false;
          const firstRow = data[0];
          const secondRow = data[1];

          if (secondRow && firstRow.some(cell => isNaN(Number(cell)) && cell.length > 0)) {
            const stringCellsInHeader = firstRow.filter(cell => isNaN(Number(cell)) && cell.length > 0).length;
            const dataCells = secondRow.filter(cell => cell.length > 0).length;
            isHeaderRow = stringCellsInHeader / firstRow.length > 0.6 && dataCells > 0;
          }

          const result = [
            `CSV File: ${file.name}`,
            `Total Rows: ${data.length}`,
            `File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
            `Detected Delimiter: ${delimiter === '\t' ? 'TAB' : delimiter}`,
            `Has Header Row: ${isHeaderRow ? 'Yes' : 'No'}`,
            '',
            'CSV Preview:'
          ].join('\n');

          let content = result + '\n\n';

          // Show preview of data
          const previewRows = data.slice(0, Math.min(10, data.length));
          previewRows.forEach((row, index) => {
            const rowLabel = isHeaderRow && index === 0 ? 'Headers' : `Row ${isHeaderRow ? index : index + 1}`;
            content += `${rowLabel}: ${row.join(' | ')}\n`;
          });

          if (data.length > 10) {
            content += `\n[...showing first 10 rows of ${data.length} total rows...]`;
          }

          resolve(content);
        } catch (error) {
          reject(new Error(`Failed to parse CSV: ${error}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
  };

  const parseXLSXFile = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      let result = 'Excel Content:\n\n';

      workbook.SheetNames.forEach((sheetName, index) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        result += `Sheet ${index + 1}: ${sheetName}\n`;
        jsonData.slice(0, 50).forEach((row: any, rowIndex: number) => {
          result += `Row ${rowIndex + 1}: ${Array.isArray(row) ? row.join(' | ') : row}\n`;
        });
        result += '\n';
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to parse XLSX: ${error}`);
    }
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    console.log('📎 FILE UPLOAD STARTED');
    console.log('📄 File:', file.name, `(${file.size} bytes)`);
    console.log('🔧 File type:', file.type);

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setParsingError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      setParsingError('Only PDF, DOCX, CSV, and XLSX files are supported');
      return;
    }

    setIsParsing(true);
    setParsingError(null);
    setUploadedFile(file);

    try {
      let content = '';

      if (file.type === 'application/pdf') {
        content = await parsePDFFile(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        content = await parseDOCXFile(file);
      } else if (file.type === 'text/csv') {
        content = await parseCSVFile(file);
      } else if (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        content = await parseXLSXFile(file);
      }

      setFileContent(content);
      setParsingError(null);
      console.log('✅ FILE PARSING COMPLETE');
      console.log('📄 Extracted content length:', content.length, 'characters');
      console.log('📋 Content preview:', content.slice(0, 150) + '...');
    } catch (error: any) {
      console.error('File parsing error:', error);
      setParsingError(error.message || 'Failed to parse file');
      setFileContent('');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleFileRemove = useCallback(() => {
    setUploadedFile(null);
    setFileContent('');
    setParsingError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Get file type icon
  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') return '📄';
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '📝';
    if (fileType === 'text/csv') return '📊';
    if (fileType.includes('spreadsheetml') || fileType === 'application/vnd.ms-excel') return '📈';
    return '📄';
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 shadow-lg backdrop-blur-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Topic Input */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="topic" className="text-sm font-medium text-slate-300 flex items-center">
            <TopicIcon className="w-4 h-4 mr-2 text-sky-400" />
            Article Topic
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 'Best coffee shops'"
            className="text-sm bg-slate-900/80 border border-slate-700 rounded-md px-4 py-2 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
          />
        </div>

        {/* Location Searchable Dropdown with AI Analysis Icon */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="location" className="text-sm font-medium text-slate-300 flex items-center">
            <GeoIcon className="w-4 h-4 mr-2 text-sky-400" />
            Target Location
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 transition-all duration-300" ref={locationDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className={`relative w-full cursor-default rounded-md bg-slate-900/80 border border-slate-700 py-2 pl-3 pr-10 text-left text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm transition-all duration-300 ${topic.trim() && location.trim() ? 'pr-16' : 'pr-10'
                  }`}
              >
                <span className="block truncate">{location || 'Select a Country...'}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <svg className={`h-5 w-5 text-gray-400 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                </span>
              </button>
              {isLocationOpen && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-slate-700">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="block w-full rounded-md border-0 bg-slate-900/80 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm"
                    />
                  </div>
                  <ul role="listbox">
                    {filteredCountries.map(c => (
                      <li key={c} className="text-white relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-sky-500/30" onClick={() => handleLocationSelect(c)}>
                        <span className="font-normal block truncate">{c}</span>
                        {location === c && (
                          <span className="text-sky-400 absolute inset-y-0 right-0 flex items-center pr-4">
                            <CheckIcon className="h-5 w-5" />
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* AI Analysis Lightning Icon */}
            {topic.trim() && location.trim() && onAnalyzeContent && (
              <button
                onClick={onAnalyzeContent}
                disabled={isAnalyzing}
                className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all duration-300 transform hover:scale-110 disabled:hover:scale-100 shadow-lg disabled:cursor-not-allowed flex items-center justify-center border border-white/20"
                title="Analyze Content Opportunity"
              >
                {isAnalyzing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tone of Voice Dropdown */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="tone" className="text-sm font-medium text-slate-300 flex items-center">
            <MegaphoneIcon className="w-4 h-4 mr-2 text-sky-400" />
            Tone of Voice
          </label>
          <div className="relative" ref={toneDropdownRef}>
            <button type="button" onClick={() => setIsToneOpen(!isToneOpen)} className="relative w-full cursor-default rounded-md bg-slate-900/80 border border-slate-700 py-2 pl-3 pr-10 text-left text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm">
              <span className="block truncate">{tone || 'Select a Tone...'}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <svg className={`h-5 w-5 text-gray-400 transition-transform ${isToneOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd"></path></svg>
              </span>
            </button>
            {isToneOpen && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-slate-700">
                <ul role="listbox">
                  {tones.map(t => (
                    <li key={t} className="text-white relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-sky-500/30" onClick={() => { setTone(t); setIsToneOpen(false); }}>
                      <span className="font-normal block truncate">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brief Textarea */}
      <div className="mt-6">
        <label htmlFor="brief" className="text-sm font-medium text-slate-300 flex items-center mb-2">
          <svg className="w-4 h-4 mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Brief (Optional)
        </label>
        <textarea
          id="brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Add any specific requirements, focus areas, or additional context for your article..."
          rows={3}
          className="text-sm w-full bg-slate-900/80 border border-slate-700 rounded-md px-4 py-3 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">
          You can request comparison tables, mention specific brands, or add any other details you'd like included in the article.
        </p>
      </div>

      {/* File Upload Section */}
      <div className="mt-6">
        <label className="text-sm font-medium text-slate-300 flex items-center mb-2">
          <FileText className="w-4 h-4 mr-2 text-sky-400" />
          Brieft Documents (Optional)
        </label>
        <p className="text-xs text-slate-500 mb-4">
          Upload your research & brief files (PDF, DOCX, CSV, XLSX) to help AI understand your brief efficiently and enrich your brief with data and context.
        </p>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
            isDragActive ? 'border-sky-400 bg-slate-800/40' : 'border-slate-600 hover:border-sky-400 hover:bg-slate-800/30'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDragActive(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragActive(false);
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
              handleFileUpload(files);
            }
          }}
        >
          {!uploadedFile ? (
            <div className="text-center">
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-1">Drag and drop your research files here</p>
              <p className="text-slate-500 text-xs mb-3">or</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.csv,.xlsx"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="text-xs inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Supports: PDF, DOCX, CSV, XLSX (up to 10MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getFileIcon(uploadedFile.type)}</div>
                <div>
                  <p className="text-slate-100 font-medium">{uploadedFile.name}</p>
                  <p className="text-slate-400 text-sm">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={handleFileRemove}
                className="p-1 hover:bg-slate-600 rounded transition-colors"
                title="Remove file"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          )}
        </div>

        {/* Parsing Status & Error */}
        {isParsing && (
          <div className="mt-4 flex items-center space-x-2 text-sky-400">
            <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Parsing file content...</span>
          </div>
        )}

        {parsingError && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{parsingError}</p>
          </div>
        )}

        {/* Parsed Content Preview */}
        {fileContent && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Extracted Content Preview:</h4>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 max-h-40 overflow-y-auto">
              <pre className="text-slate-400 text-xs whitespace-pre-wrap">{fileContent.slice(0, 1000)}{fileContent.length > 1000 ? '\n\n[...content truncated for preview...]' : ''}</pre>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              This content will be automatically included in your brief when generating the article.
            </p>
          </div>
        )}
      </div>

      {/* Internal Links Section */}
      <div className="mt-6">
        <div className="flex items-center space-x-3 mb-4">
          <ToggleSwitch
            id="enableInternalLinks"
            checked={enableInternalLinks}
            onChange={setEnableInternalLinks}
          />
          <label htmlFor="enableInternalLinks" className="text-sm font-medium text-slate-300 flex items-center cursor-pointer">
            <svg className="w-4 h-4 mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Add Internal Links (SEO Boost)
          </label>
        </div>

        {enableInternalLinks && (
          <div className="space-y-3">
            <div>
              <label htmlFor="websiteUrl" className="text-sm font-medium text-slate-300 mb-2 block">
                Website URL
              </label>
              <input
                id="websiteUrl"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-sm bg-slate-900/80 border border-slate-700 rounded-md px-4 py-2 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
              />
              <p className="text-xs text-slate-500 mt-1">
                We'll analyze your website and add relevant internal links to improve SEO.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Keyword Suggestion Section */}
      <div className="mt-8 mb-6 p-4 bg-gray-800 rounded-lg shadow-lg border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
          <Globe className="w-4 h-4 mr-2 text-blue-400" />
          SEO Keyword Suggestions (Web Crawling)
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Crawl the specified website (from "Add Internal Links" section) to identify relevant keywords for your article's topic.
        </p>

        {enableInternalLinks && ( // Only show if internal links are enabled
          <div className="mb-4">
            <button
              onClick={handleCrawlWebsite}
              disabled={isCrawling || !websiteUrl.trim() || !topic.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isCrawling ? (
                <>
                  <Loader message="Crawling website for SEO keywords..." />
                  <span>Crawling...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Crawl Keywords</span>
                </>
              )}
            </button>
            {crawlingError && (
              <div className="mt-4 text-red-400 text-sm">
                Error crawling website: {crawlingError}
              </div>
            )}
          </div>
        )}

        {suggestedKeywords.length > 0 && (
          <div className="mt-6">
            <h4 className="text-base font-medium text-white mb-3">Suggested Keywords (Top 10)</h4>
            <div className="flex flex-wrap gap-2">
              {suggestedKeywords.map((sk, index) => (
                <button
                  key={index}
                  onClick={() => handleKeywordToggle(sk.keyword)}
                  className={`px-3 py-1 rounded-full text-sm transition-all duration-200
                    ${sk.selected
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    }`}
                >
                  {sk.keyword}
                </button>
              ))}
            </div>
            <div className="mt-4 text-gray-400 text-sm">
              Selected keywords will be passed to the AI for SEO optimization.
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onSubmit}
          disabled={isLoading || !topic || !location || !tone}
          className="flex items-center justify-center bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-500/50"
        >
          {isLoading ? 'Generating...' : 'Generate Article'}
        </button>
      </div>
    </div>
  );
};
