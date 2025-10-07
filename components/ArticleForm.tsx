import React, { useState, useRef, useEffect, useCallback } from 'react';
import { countries } from '../data/countries';
import { GeoIcon } from './icons/GeoIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { TopicIcon } from './icons/TopicIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ToggleSwitch } from './ToggleSwitch';

import { Globe, FileText, X, Upload, Mic, MicOff, Square, ChevronDown, Paperclip, Wand2 } from 'lucide-react'; // Import additional icons
import { Loader } from './Loader'; // Import Loader component
import { refineDictationText, suggestTone } from '../services/geminiService';
import VoiceIdeaModal from './VoiceIdeaModal';
import type { SuggestedKeyword } from '../types'; // Import SuggestedKeyword type

// File parsing imports
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { CopyIcon } from './icons/CopyIcon';
import { EyeIcon } from './icons/EyeIcon';

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
  userWebsiteUrls?: Array<{ id: string; url: string; name?: string }>;
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
  userWebsiteUrls = [],
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
  // Initialize contenteditable with existing brief content
  useEffect(() => {
    if (briefRef.current && briefRef.current.textContent !== brief) {
      briefRef.current.textContent = brief;
    }
  }, [brief]);
  const tones = ['Authoritative', 'Formal', 'Professional', 'Casual', 'Funny'];

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isToneOpen, setIsToneOpen] = useState(false);
  const [isToneSuggesting, setIsToneSuggesting] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const toneDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const aiMenuRef = useRef<HTMLDivElement>(null);
  const websiteUrlDropdownRef = useRef<HTMLDivElement>(null);

  // File upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [showContentPreview, setShowContentPreview] = useState<boolean>(false);
  const [expandedPreview, setExpandedPreview] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerFileInputRef = useRef<HTMLInputElement>(null);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState<boolean>(false);

  // Brief contenteditable state
  const briefRef = useRef<HTMLDivElement>(null);
  const [isBriefDragOver, setIsBriefDragOver] = useState<boolean>(false);

  // Voice input (Web Speech API)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [supportsSpeech, setSupportsSpeech] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const languageOptions = [
    { code: 'tr-TR', label: 'Türkçe' },
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'de-DE', label: 'Deutsch' },
    { code: 'fr-FR', label: 'Français' },
    { code: 'es-ES', label: 'Español' },
    { code: 'it-IT', label: 'Italiano' },
    { code: 'ru-RU', label: 'Русский' },
    { code: 'ar-SA', label: 'العربية' },
  ];
  const [speechLang, setSpeechLang] = useState<string>('tr-TR');
  const [isLangOpen, setIsLangOpen] = useState<boolean>(false);
  const [isWebsiteUrlOpen, setIsWebsiteUrlOpen] = useState<boolean>(false);

  useEffect(() => {
    const w = window as any;
    const supported = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
    setSupportsSpeech(supported);
  }, []);

  const insertTextAtCursor = (text: string) => {
    if (!briefRef.current) return;
    const editor = briefRef.current;

    const placeCaretAtEnd = () => {
      const selection = window.getSelection();
      if (!selection) return;
      const range = document.createRange();
      if (editor.childNodes.length > 0) {
        const lastNode = editor.childNodes[editor.childNodes.length - 1];
        range.selectNodeContents(editor);
        range.collapse(false);
      } else {
        const emptyText = document.createTextNode('');
        editor.appendChild(emptyText);
        range.setStartAfter(emptyText);
        range.setEndAfter(emptyText);
      }
      selection.removeAllRanges();
      selection.addRange(range);
    };

    const selection = window.getSelection();
    const selectionInsideEditor = (() => {
      if (!selection || selection.rangeCount === 0) return false;
      const range = selection.getRangeAt(0);
      return editor.contains(range.commonAncestorContainer);
    })();

    if (!selectionInsideEditor) {
      // Ensure caret is in the editor (end) before inserting
      editor.focus();
      placeCaretAtEnd();
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editor.appendChild(document.createTextNode(text));
    }

    const newContent = editor.textContent || '';
    setBrief(newContent);
  };

  const startVoice = () => {
    setSpeechError(null);
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setSpeechError('Browser does not support speech recognition.');
      return;
    }
    // Focus editor and place caret at end to ensure text goes to brief
    if (briefRef.current) {
      briefRef.current.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(briefRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    const recognition = new SR();
    recognition.lang = speechLang;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = async (event: any) => {
      let finalText = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
        } else {
          interim += transcript + ' ';
        }
      }
      if (interim) setInterimTranscript(interim.trim());
      if (finalText) {
        // Add a space before final text if needed
        const prefix = briefRef.current && (briefRef.current.textContent || '').endsWith(' ') ? '' : ' ';
        let cleaned = finalText.trim();
        try {
          cleaned = await refineDictationText(cleaned, speechLang);
        } catch (e) {
          // fall back silently
        }
        insertTextAtCursor(prefix + cleaned + ' ');
        setInterimTranscript('');
      }
    };

    recognition.onerror = (e: any) => {
      setSpeechError(e?.error === 'not-allowed' ? 'Microphone permission denied.' : 'Speech recognition error.');
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      setSpeechError('Unable to start speech recognition.');
      setIsListening(false);
    }
  };

  const stopVoice = () => {
    try {
      recognitionRef.current?.stop?.();
    } finally {
      setIsListening(false);
      setInterimTranscript('');
    }
  };

  // Heading extraction state
  const [extractedHeadings, setExtractedHeadings] = useState<{level: number, text: string, slug: string}[]>([]);
  const [showUploadSection, setShowUploadSection] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [voiceModalKey, setVoiceModalKey] = useState<number>(0);

  // Slug generation function - creates readable slugs from headings
  const generateSlug = (text: string): string => {
    return text
      .replace(/^[\d\s\.]+\s*/, '') // Remove leading numbers, dots, and spaces
      .replace(/[^\w\sğüşöçıİĞÜŞÖÇı\/,&\(\)-:]/g, '') // Keep Turkish characters and specific special chars: / , & ( ) - :
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/^[\d\s]+/, ''); // Additional cleanup for any remaining leading numbers
  };

  const extractHeadingsFromContent = (content: string): {level: number, text: string, slug: string}[] => {
    const headings: {level: number, text: string, slug: string}[] = [];
    const lines = content.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2].trim();
          const slug = generateSlug(text);
          headings.push({ level, text, slug });
        }
      }
    });

    return headings;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
      if (toneDropdownRef.current && !toneDropdownRef.current.contains(event.target as Node)) {
        setIsToneOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (websiteUrlDropdownRef.current && !websiteUrlDropdownRef.current.contains(event.target as Node)) {
        setIsWebsiteUrlOpen(false);
      }
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
        setIsAiMenuOpen(false);
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

  const handleWebsiteUrlSelect = (url: string) => {
    setWebsiteUrl(url);
    setIsWebsiteUrlOpen(false);
  };

  const handleWebsiteUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWebsiteUrl(e.target.value);
  };

  const websiteOptions = [
    ...(userWebsiteUrls || []),
    ...(websiteUrl && !userWebsiteUrls?.find(u => u.url === websiteUrl) ? [{ id: 'custom', url: websiteUrl, name: 'Custom URL' }] : [])
  ];

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

      // Use HTML conversion to detect Word heading styles (Başlık 1, Başlık 2, etc.)
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      const htmlContent = htmlResult.value;

      // Extract headings from HTML with proper levels
      const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
      let match;
      let processedContent = htmlContent;
      const headings: Array<{ level: number, text: string }> = [];

      while ((match = headingRegex.exec(htmlContent)) !== null) {
        const level = parseInt(match[1]);
        let text = match[2]
          .replace(/<[^>]*>/g, '') // Remove any nested tags in heading text
          .trim();

        headings.push({ level, text: text });

        // Replace HTML heading with markdown equivalent
        const hashes = '#'.repeat(level);
        processedContent = processedContent.replace(match[0], `\n${hashes} ${text}\n`);
      }

      let content = '';
      if (headings.length > 0) {
        // If headings found, strip other HTML tags from content
        content = processedContent.replace(/<[^>]*>/g, '').trim();
      } else {
        // Fallback: extract raw text if no headings found
        const rawResult = await mammoth.extractRawText({ arrayBuffer });
        content = rawResult.value.trim();

        // Apply basic pattern detection for unstyled documents
        const lines = content.split('\n');
        let processedLines: string[] = [];
        let detectedHeadings: string[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (line.length < 10 || line.length > 150) {
            processedLines.push(line);
            continue;
          }

          // Basic heading pattern detection for Turkish text
          const isPotentialHeading =
            /^[A-ZĞÜŞİÖÇ][A-Za-zğüşöçıİĞÜŞÖÇ\s]/.test(line.trim()) &&
            line.split(/\s+/).length >= 2 && line.split(/\s+/).length <= 12 &&
            !line.match(/[.!?]\s*$/) &&
            !line.toLowerCase().includes(' ve ') &&
            !line.toLowerCase().includes(' ile ') &&
            !line.toLowerCase().includes(' için ') &&
            /[aeıioöuü]/i.test(line) &&
            line.length >= 3;

          if (isPotentialHeading && !detectedHeadings.includes(line)) {
            detectedHeadings.push(line);
            processedLines.push(`## ${line}`);
            processedLines.push('');
          } else {
            processedLines.push(line);
          }
        }

        if (detectedHeadings.length > 0) {
          content = processedLines.join('\n');
        }
      }

      // Clean up the content
      content = content
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // Extract headings for reference system
      const rawHeadings = extractHeadingsFromContent(content);
      setExtractedHeadings(rawHeadings);

      // Add file info
      const fileInfo = `DOCX File: ${file.name}\nDocument Content:\n\n`;

      return fileInfo + content;
    } catch (error) {
      console.error('DOCX parsing error:', error);
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

      // Start the loading animation for 1 second before showing the file
      setIsUploadingFile(true);
      setTimeout(() => {
        setIsUploadingFile(false);
        setShowContentPreview(true);
      }, 1000);
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
    setExtractedHeadings([]); // Clear headings when file is removed
    setParsingError(null);
    setShowContentPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (headerFileInputRef.current) {
      headerFileInputRef.current.value = '';
    }
  }, []);

  // Brief with @ reference support
  const [showReferenceSuggestions, setShowReferenceSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [expandedHeadings, setExpandedHeadings] = useState<Set<string>>(new Set());

  const insertHeadingReference = (headingSlug: string) => {
    if (briefRef.current) {
      // Find the heading to get its level and color
      const heading = extractedHeadings.find(h => h.slug === headingSlug);
      if (!heading) return;

      const editor = briefRef.current;
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);

      if (!range) return;

      // Create main span container
      const span = document.createElement('span');
      span.className = `inline-flex items-center px-2 py-1 mx-1 text-xs font-medium rounded ${getHeadingColor(heading.level)} cursor-pointer hover:scale-105 transition-all duration-200`;
      span.title = `Heading reference: ${headingSlug}`;
      span.contentEditable = 'false'; // Make it non-editable

      // Create X button container
      const xButton = document.createElement('span');
      xButton.className = 'mr-1 cursor-pointer hover:bg-red-500/50 rounded border border-red-500/30 flex items-center justify-center w-5 h-5 flex-shrink-0';
      xButton.title = 'Click to remove this reference';
      xButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (span.parentNode) {
          span.parentNode.removeChild(span);
          // Update brief state after removal
          const newContent = editor.textContent || '';
          setBrief(newContent);
        }
      });

      // Create X text (simpler than SVG)
      xButton.textContent = '×';
      xButton.style.fontSize = '12px';
      xButton.style.fontWeight = 'bold';
      xButton.style.lineHeight = '1';
      xButton.style.color = '#fbbf24'; // amber-400

      // Create text span
      const textSpan = document.createElement('span');
      textSpan.textContent = headingSlug;

      // Assemble the structure
      span.appendChild(xButton);
      span.appendChild(textSpan);

      // Check if user typed @ before cursor - if so, replace the @
      const content = editor.textContent || '';
      const cursorPos = range.startOffset;
      const textBeforeCursor = content.slice(0, cursorPos);
      const atIndex = textBeforeCursor.lastIndexOf('@');

      if (atIndex !== -1) {
        // Find the content up to next space or end after @
        const textAfterAt = content.slice(atIndex + 1);
        const spaceAfterAt = textAfterAt.indexOf(' ');
        const replaceLength = spaceAfterAt === -1 ? textAfterAt.length : spaceAfterAt;

        // Set range to cover from @ to end of word
        range.setStart(range.startContainer, atIndex);
        range.setEnd(range.startContainer, cursorPos + replaceLength);
        range.deleteContents();
      }

      // Insert the span at cursor
      range.insertNode(span);

      // Move cursor after the span
      const newRange = document.createRange();
      newRange.setStartAfter(span);
      newRange.setEndAfter(span);
      selection.removeAllRanges();
      selection.addRange(newRange);

      editor.focus();

      setShowReferenceSuggestions(false);
    }
  };

  const getHeadingColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-500/20 border-red-500/40 text-red-200';
      case 2: return 'bg-orange-500/20 border-orange-500/40 text-orange-200';
      case 3: return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-200';
      case 4: return 'bg-green-500/20 border-green-500/40 text-green-200';
      case 5: return 'bg-blue-500/20 border-blue-500/40 text-blue-200';
      case 6: return 'bg-purple-500/20 border-purple-500/40 text-purple-200';
      default: return 'bg-gray-500/20 border-gray-500/40 text-gray-200';
    }
  };

  // Organize headings hierarchically
  const organizeHeadingsHierarchically = (headings: {level: number, text: string, slug: string}[]) => {
    const root: any[] = [];
    const stack: any[] = [{ children: root, level: 0 }];

    headings.forEach(heading => {
      // Find the right parent level
      while (stack.length > 1 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      const parent = stack[stack.length - 1];
      const newNode = { ...heading, children: [] };
      parent.children.push(newNode);

      stack.push(newNode);
    });

    return root;
  };

  const toggleExpansion = (headingSlug: string) => {
    const newExpanded = new Set(expandedHeadings);
    if (newExpanded.has(headingSlug)) {
      newExpanded.delete(headingSlug);
    } else {
      newExpanded.add(headingSlug);
    }
    setExpandedHeadings(newExpanded);
  };

  const hasChildren = (heading: {level: number, children: any[]}) => {
    return heading.children && heading.children.length > 0;
  };

  const renderHeadingTree = (headings: any[], level = 1): React.ReactNode => {
    const marginLeft = (level - 1) * 16; // 16px indentation per level

    return headings.map((heading, index) => (
      <div key={`${heading.level}-${heading.slug}-${index}`}>
          <button
          onClick={(e) => {
            e.preventDefault();
            insertHeadingReference(heading.slug);
          }}
          className={`w-full text-left px-2 py-2 text-sm rounded border transition-all duration-150 flex items-center ${
            suggestionIndex === index
              ? `${getHeadingColor(heading.level)} scale-[1.01]`
              : `hover:bg-slate-700 bg-slate-900/50 border-slate-600 text-slate-300 hover:border-slate-500`
          }`}
          title={`Click to insert reference to: ${heading.text}`}
          style={{ paddingLeft: `${marginLeft}px` }}
        >
          <div className="flex items-center flex-1 min-w-0">
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren(heading)) {
                  toggleExpansion(heading.slug);
                }
              }}
              className={`flex items-center mr-2 ${hasChildren(heading) ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {hasChildren(heading) && (
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${expandedHeadings.has(heading.slug) ? 'rotate-90' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
            <div className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${getHeadingColor(heading.level)} border mr-3`}>
              H{heading.level}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-slate-200 font-medium truncate">{heading.slug}</div>
            </div>
          </div>
        </button>

        {/* Render children if expanded */}
        {expandedHeadings.has(heading.slug) && hasChildren(heading) && (
          <div>
            {renderHeadingTree(heading.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const renderBriefContent = () => {
    if (!brief) return null;

    const parts: React.ReactNode[] = [];

    // Find all @ references and highlight them
    const regex = /(@[^\s]+)/g;
    let match;
    let hasReferences = false;

    while ((match = regex.exec(brief)) !== null) {
      const referenceText = match[1];
      const fullText = match[0];

      // Find if this reference matches any extracted heading
      const matchedHeading = extractedHeadings.find(
        heading => referenceText === `@${heading.slug}`
      );

      hasReferences = true;

      // Add the highlighted reference with H tag
      parts.push(
        <span
          key={match.index}
          className={`inline-flex items-center px-3 py-1.5 mx-1 text-xs font-medium rounded-md border transition-all duration-200 ${
            matchedHeading
              ? `${getHeadingColor(matchedHeading.level)} cursor-pointer hover:scale-105`
              : 'bg-gray-500/20 border-gray-500/40 text-gray-200'
          }`}
          title={matchedHeading ? `Heading: ${matchedHeading.text}` : 'Reference not found'}
        >
          <span className="font-bold mr-1">
            {matchedHeading ? `H${matchedHeading.level}` : '?'}
          </span>
          {referenceText}
        </span>
      );
    }

    if (!hasReferences) {
      return null;
    }

    return (
      <div className="flex flex-wrap items-center gap-1">
        {parts}
      </div>
    );
  };

  // Get file type icon
  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') return '📄';
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '📝';
    if (fileType === 'text/csv') return '📊';
    if (fileType.includes('spreadsheetml') || fileType === 'application/vnd.ms-excel') return '📈';
    return '📄';
  };

  // Get file type color
  const getFileTypeColor = (fileType: string) => {
    if (fileType === 'application/pdf') return 'from-red-500/20 to-red-600/20 border-red-500/30';
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
    if (fileType === 'text/csv') return 'from-green-500/20 to-green-600/20 border-green-500/30';
    if (fileType.includes('spreadsheetml') || fileType === 'application/vnd.ms-excel') return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
    return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
  };

  // Copy content to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const openPreview = () => {
    setShowUploadSection(true);
    setShowContentPreview(true);
    // Try to scroll the preview into view smoothly
    requestAnimationFrame(() => {
      const el = document.getElementById('upload-preview');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const openVoiceModalFromMenu = () => {
    // Close menu first, then force a fresh mount of the modal with a new key
    setIsAiMenuOpen(false);
    setVoiceModalKey((k) => k + 1);
    setShowVoiceModal(true);
  };

  // Calculate content stats
  const getContentStats = (content: string) => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const chars = content.length;
    const lines = content.split('\n').length;
    return { words, chars, lines };
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

      {/* Voice Idea Modal */}
      <VoiceIdeaModal
        key={voiceModalKey}
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        defaultLocation={location}
        onApply={(suggestedTopic, suggestedPrompt, chosenLocation) => {
          const sanitizeKeyword = (s: string) => {
            // Keep Turkish letters and basic punctuation, remove other special chars
            const allowedPunct = '.,!?;:\\-()';
            // First, remove characters not in allowed sets (Turkish + ASCII letters/digits/space + allowed punctuation)
            const cleaned = s.replace(new RegExp(`[^A-Za-z0-9ğüşöçıİĞÜŞÖÇ\\s${allowedPunct.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}]`, 'g'), ' ');
            // Lowercase and fix dotted i issue
            const lower = cleaned.toLowerCase().replace(/\u0307/g, '');
            return lower.replace(/\s+/g, ' ').trim();
          };
          if (suggestedTopic) setTopic(sanitizeKeyword(suggestedTopic));
          if (chosenLocation && chosenLocation.trim()) setLocation(chosenLocation);
          if (suggestedPrompt) {
            const prefix = 'AI Focus: ';
            const newBrief = brief && brief.trim().length > 0 ? `${brief}\n\n${prefix}${suggestedPrompt}` : `${prefix}${suggestedPrompt}`;
            setBrief(newBrief);
          }
        }}
      />

      {/* Brief Textarea */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="brief" className="text-sm font-medium text-slate-300 flex items-center">
            <svg className="w-4 h-4 mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Brief Text (Optional)
          </label>
        <div className="flex items-center gap-2">
            {supportsSpeech ? (
              <button
                type="button"
                onClick={isListening ? stopVoice : startVoice}
                className={`inline-flex items-center px-3 py-1.5 rounded-md border transition-colors text-xs ${
                  isListening
                    ? 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
                    : 'bg-slate-700/60 border-slate-600 text-slate-200 hover:bg-slate-600'
                }`}
                title={'Voice-to-text'}
                aria-label="Voice-to-text"
              >
                {isListening ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center px-3 py-1.5 rounded-md border bg-slate-800/60 border-slate-700 text-slate-500 cursor-not-allowed text-xs"
                title="Speech recognition not supported in this browser"
              >
                <MicOff className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangOpen(v => !v)}
                className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-md border text-[11px] transition-colors ${
                  isLangOpen
                    ? 'bg-slate-700/60 border-slate-600 text-slate-100'
                    : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
                title="Recognition language"
                aria-haspopup="listbox"
                aria-expanded={isLangOpen}
              >
                <span>{languageOptions.find(l => l.code === speechLang)?.label || 'Language'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLangOpen && (
                <ul
                  role="listbox"
                  className="absolute right-0 mt-2 w-40 max-h-56 overflow-auto bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50 text-[12px] py-1"
                >
                  {languageOptions.map((opt) => (
                    <li
                      key={opt.code}
                      role="option"
                      aria-selected={opt.code === speechLang}
                      onClick={() => { setSpeechLang(opt.code); setIsLangOpen(false); }}
                      className={`px-3 py-1.5 cursor-pointer flex items-center justify-between hover:bg-sky-500/20 text-slate-200 ${opt.code === speechLang ? 'bg-slate-700/40' : ''}`}
                    >
                      <span>{opt.label}</span>
                      {opt.code === speechLang && (
                        <span className="text-sky-400"><CheckIcon className="w-4 h-4" /></span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {isListening && (
              <span className="inline-flex items-center text-[11px] text-red-300">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                Listening...
              </span>
            )}
            {/* Compact Attachment Button */}
            <div className="relative">
              <input
                ref={headerFileInputRef}
                type="file"
                accept=".pdf,.docx,.csv,.xlsx"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <button
                type="button"
                onClick={() => headerFileInputRef.current?.click()}
                className="inline-flex items-center px-3 py-1.5 rounded-md border bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800 text-xs"
                title="Attach document"
                aria-label="Attach document"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* AI Suggestions dropdown */}
            <div className="relative" ref={aiMenuRef}>
              <button
                type="button"
                onClick={() => setIsAiMenuOpen(v => !v)}
                className="inline-flex items-center px-3 py-1.5 rounded-md border bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800 text-xs"
                title="AI Suggestions"
              >
                <Wand2 className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
                <span className="hidden sm:inline">AI Suggestions</span>
                <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform ${isAiMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAiMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50 py-1">
                  <button
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-sky-500/20 flex items-center gap-2"
                    onClick={openVoiceModalFromMenu}
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Suggest Topic
                  </button>
                  <button
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-sky-500/20 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isToneSuggesting || (!topic.trim() && !brief.trim())}
                    onClick={async () => {
                      setIsAiMenuOpen(false);
                      if (isToneSuggesting || (!topic.trim() && !brief.trim())) return;
                      setIsToneSuggesting(true);
                      try {
                        const t = await suggestTone(topic, brief);
                        setTone(t);
                      } finally {
                        setIsToneSuggesting(false);
                      }
                    }}
                  >
                    <Wand2 className="w-3.5 h-3.5" /> {isToneSuggesting ? 'Suggesting…' : 'Suggest Tone'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warning message when file is uploaded but brief is empty */}
        {fileContent && (!brief || brief.trim().length === 0) && (
          <div className="mb-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-orange-400 text-xs">⚠️</span>
              <span className="text-orange-300 text-xs">You must tell AI what to do with brief documents.</span>
            </div>
          </div>
        )}

        <div className="relative">
          <div
            ref={briefRef}
            contentEditable
            title="Tip: Drag & drop files here to attach"
            onPaste={(e) => {
              e.preventDefault();
              const cd = e.clipboardData || (window as any).clipboardData;
              let text = (cd && cd.getData && cd.getData('text/plain')) || '';

              // Fallback: strip HTML to text if plain text is missing
              if (!text && cd && cd.getData) {
                const html = cd.getData('text/html');
                if (html) {
                  const tmp = document.createElement('div');
                  tmp.innerHTML = html;
                  text = tmp.textContent || tmp.innerText || '';
                }
              }

              // Normalize newlines
              text = text.replace(/\r\n/g, '\n');

              try {
                // Prefer execCommand to let browser handle caret, fall back otherwise
                if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
                  document.execCommand('insertText', false, text);
                } else {
                  insertTextAtCursor(text);
                }
              } catch {
                insertTextAtCursor(text);
              }

              // Ensure state reflects the new plain text
              const newContent = briefRef.current?.textContent || '';
              setBrief(newContent);
            }}
            onInput={(e) => {
              const newValue = e.currentTarget.textContent || '';
              setBrief(newValue);

              // Check if user typed @ for showing suggestions
              const lastAtIndex = newValue.lastIndexOf('@');
              if (lastAtIndex !== -1 && extractedHeadings.length > 0) {
                const textAfterAt = newValue.slice(lastAtIndex + 1);
                // Show suggestions if @ is followed by optional text but no space
                if (!textAfterAt.includes(' ') && textAfterAt.length < 20) {
                  setShowReferenceSuggestions(true);
                  setSuggestionIndex(0);
                } else {
                  setShowReferenceSuggestions(false);
                }
              } else {
                setShowReferenceSuggestions(false);
              }
            }}
            onKeyDown={(e) => {
              if (showReferenceSuggestions && extractedHeadings.length > 0) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSuggestionIndex(prev =>
                    prev < extractedHeadings.slice(0, 8).length - 1 ? prev + 1 : prev
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSuggestionIndex(prev => prev > 0 ? prev - 1 : prev);
                } else if (e.key === 'Enter' && suggestionIndex >= 0) {
                  e.preventDefault();
                  const heading = extractedHeadings.slice(0, 8)[suggestionIndex];
                  if (heading) {
                    insertHeadingReference(heading.slug);
                  }
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setShowReferenceSuggestions(false);
                }
              }
            }}
            onDragOver={(e) => {
              if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
                setIsBriefDragOver(true);
              }
            }}
            onDragLeave={() => setIsBriefDragOver(false)}
            onDrop={(e) => {
              if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                e.preventDefault();
                setIsBriefDragOver(false);
                handleFileUpload(e.dataTransfer.files);
              }
            }}
            className={`w-full text-sm bg-slate-900/80 border rounded-md px-4 py-3 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 min-h-[80px] outline-none ${
              fileContent && (!brief || brief.trim().length === 0)
                ? 'border-2 border-orange-500/50'
                : isBriefDragOver
                  ? 'border-2 border-dashed border-sky-400 bg-sky-500/10 shadow-[0_0_0_3px_rgba(56,189,248,0.25)]'
                  : 'border border-slate-700'
            }`}
            suppressContentEditableWarning={true}
            data-placeholder={brief.trim() === '' ? "Add any specific requirements, focus areas, or additional context for your article..." : undefined}
            style={{ minHeight: '80px' }}
          />

          {isBriefDragOver && (
            <div className="pointer-events-none absolute inset-0 rounded-md border-2 border-dashed border-sky-400/70 bg-sky-500/10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sky-300 text-xs font-medium bg-slate-900/70 border border-slate-700 px-3 py-1.5 rounded-md shadow">
                <Upload className="w-4 h-4" />
                <span>Drop files to attach</span>
              </div>
            </div>
          )}

          {interimTranscript && (
            <div
              className="mt-2 text-[11px] text-slate-400 italic truncate"
              aria-live="polite"
            >
              {interimTranscript}
            </div>
          )}

          {/* Reference suggestions dropdown */}
          {showReferenceSuggestions && extractedHeadings.length > 0 && (
            <div className="absolute top-full left-4 mt-2 w-full sm:w-80 md:w-96 max-h-80 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
              <div className="p-2">
                <div className="text-xs font-medium text-slate-300 mb-3">Select heading reference:</div>
                <div className="space-y-1">
                  {renderHeadingTree(organizeHeadingsHierarchically(extractedHeadings.slice(0, 20)))}
                </div>
              </div>
            </div>
          )}
        </div>

        {speechError && (
          <p className="text-xs text-red-400 mt-1">{speechError}</p>
        )}

        {/* Hint message for DOCX @ reference feature */}
        {uploadedFile?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && extractedHeadings.length > 0 && (
          <p className="text-xs text-blue-400 mt-1">
            💡 Use "<strong>@</strong>" in the brief field to reference headings from the uploaded document. Press Enter to insert them as styled blocks.
          </p>
        )}

        <p className="text-xs text-slate-500 mt-1">
          You can request comparison tables, mention specific brands, or add any other details you'd like included in the article.
        </p>

        {/* Attachment chip row below brief */}
        {uploadedFile && (
          <div className="mt-2 flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2">
            <div className="flex items-center gap-2 text-slate-200 text-xs">
              <Paperclip className="w-4 h-4 text-sky-400" />
              <span className="truncate max-w-[240px] sm:max-w-[360px] md:max-w-[480px]">{uploadedFile.name}</span>
              <span className="text-slate-400">· {(uploadedFile.size/1024/1024).toFixed(2)} MB</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="text-[11px] px-2 py-1 rounded border border-slate-600 text-slate-200 hover:bg-slate-700"
                onClick={copyToClipboard}
                title="Copy parsed content"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                className="text-[11px] px-2 py-1 rounded border border-slate-600 text-slate-200 hover:bg-slate-700"
                onClick={openPreview}
                title="Open preview"
              >
                Preview
              </button>
              <button
                className="text-[11px] px-2 py-1 rounded border border-slate-600 text-slate-200 hover:bg-slate-700"
                onClick={() => setShowUploadSection(v => !v)}
                title={showUploadSection ? 'Hide details' : 'Show details'}
              >
                {showUploadSection ? 'Hide' : 'Details'}
              </button>
              <button
                className="text-[11px] px-2 py-1 rounded border border-red-600/60 text-red-300 hover:bg-red-600/20"
                onClick={handleFileRemove}
                title="Remove attachment"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File Upload Section (collapsible to save space) */}
      {showUploadSection && (
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
              <Upload className="w-7 h-7 text-slate-500 mx-auto mb-3" />
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
            <div
              className={`bg-slate-700/50 rounded-lg p-4 transition-all duration-500 ease-out transform ${
                isUploadingFile
                  ? 'opacity-50 scale-95'
                  : 'opacity-100 scale-100'
              }`}
            >
              {isUploadingFile ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <p className="text-slate-100 font-medium">File uploaded successfully</p>
                    <p className="text-slate-400 text-sm">Analyzing content...</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-l">{getFileIcon(uploadedFile.type)}</div>
                    <div>
                      <p className="text-slate-100 text-sm">{uploadedFile.name}</p>
                      <p className="text-slate-400 text-xs">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
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

        {/* Enhanced Content Preview */}
        {fileContent && showContentPreview && uploadedFile && (
          <div id="upload-preview" className={`mt-6 transition-all duration-700 ease-out ${
            showContentPreview ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {/* Header with icon, title and stats */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getFileTypeColor(uploadedFile.type)} flex items-center justify-center border border-opacity-30`}>
                  <span className="text-lg">{getFileIcon(uploadedFile.type)}</span>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-slate-200">Extracted Content Preview</h4>
                  <p className="text-xs text-slate-400">Ready to include in your article brief</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors text-sm"
                  title="Copy all content to clipboard"
                >
                  <CopyIcon className="w-4 h-4" />
                  <span className={copied ? 'text-green-400' : ''}>
                    {copied ? 'Copied!' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Content stats */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              <div className="flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-md">
                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span className="text-slate-300">{getContentStats(fileContent).words} words</span>
              </div>
              <div className="flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-md">
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-slate-300">{getContentStats(fileContent).chars} chars</span>
              </div>
              <div className="flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-md">
                <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="text-slate-300">{getContentStats(fileContent).lines} lines</span>
              </div>
              <div className="flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-md">
                <svg className="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-slate-300">{(uploadedFile.size / 1024).toFixed(0)} KB</span>
              </div>
            </div>

            {/* Content display area */}
            <div className={`bg-gradient-to-br ${getFileTypeColor(uploadedFile.type)} border rounded-lg p-4 transition-all duration-300 ${
              expandedPreview ? 'max-h-96 overflow-y-auto' : 'max-h-48 overflow-hidden'
            }`}>
              <div className="prose prose-sm max-w-none">
                <pre className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-slate-900/50 p-3 rounded border border-slate-700/50">
                  {expandedPreview
                    ? fileContent
                    : `${fileContent.slice(0, 800)}${fileContent.length > 800 ? '\n\n...\n\n' : ''}`
                  }
                </pre>
              </div>

              {/* Expand/collapse button */}
              {fileContent.length > 800 && (
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => setExpandedPreview(!expandedPreview)}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 rounded-md transition-colors text-sm border border-slate-600"
                  >
                    <span>{expandedPreview ? 'Show Less' : 'Show More'}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${expandedPreview ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Info message */}
            <div className="mt-3 flex items-center space-x-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-blue-300">
                Uploaded document will be automatically included in your brief after you fill the brief text.
                {fileContent.length > 2000 && (
                  <span className="block text-amber-300 mt-1">
                    ⚠️ Large content detected - AI may summarize for optimal results.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
      )}

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
            <div className="relative" ref={websiteUrlDropdownRef}>
              <label htmlFor="websiteUrl" className="text-sm font-medium text-slate-300 mb-2 block">
                Website URL
              </label>

              {/* Main input/combobox */}
              <div className="relative">
                <input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={handleWebsiteUrlInputChange}
                  onFocus={() => setIsWebsiteUrlOpen(true)}
                  placeholder="https://... or select from your saved URLs"
                  className="w-full text-sm bg-slate-900/80 border border-slate-700 rounded-md px-4 py-2 pr-10 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setIsWebsiteUrlOpen(!isWebsiteUrlOpen)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-300"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${isWebsiteUrlOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown menu */}
              {isWebsiteUrlOpen && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-slate-700">
                  {/* Free text input in dropdown */}
                  {websiteUrl && !websiteOptions.some(u => u.url === websiteUrl) && (
                    <div className="p-2 border-b border-slate-700 bg-slate-750/50">
                      <div className="text-xs text-slate-400 mb-1">Custom URL:</div>
                      <div className="flex items-center gap-2 px-3 py-1.5 text-slate-200 bg-slate-900/80 rounded-md text-sm">
                        <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                        {websiteUrl}
                      </div>
                    </div>
                  )}

                  {/* Profile URLs section */}
                  {websiteOptions.length > 0 && (
                    <div>
                      {websiteOptions.map((url) => (
                        <button
                          key={url.id}
                          type="button"
                          onClick={() => handleWebsiteUrlSelect(url.url)}
                          className={`w-full text-left hover:bg-sky-500/30 py-2 pl-3 pr-4 flex items-center justify-between ${
                            websiteUrl === url.url ? 'bg-sky-500/20' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-slate-200 text-sm truncate">
                              {url.name || url.url}
                            </div>
                            <div className="text-slate-400 text-xs truncate">
                              {url.url}
                            </div>
                          </div>
                          {websiteUrl === url.url && (
                            <CheckIcon className="w-4 h-4 text-sky-400 flex-shrink-0 ml-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {websiteOptions.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-sm">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      No saved URLs yet.<br/>
                      <span className="text-xs">Add URLs in your Profile page for quick access.</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-500 mt-1">
                We'll analyze your website and add relevant internal links to improve SEO. Select from your saved profile URLs or enter a custom one.
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
          disabled={isLoading || !topic || !location || !tone || (fileContent && (!brief || brief.trim().length === 0))}
          className="flex items-center justify-center bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-500/50"
        >
          {isLoading ? 'Generating...' : 'Generate Article'}
        </button>
      </div>
    </div>
  );
};
