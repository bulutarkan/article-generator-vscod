import React, { useState, useEffect } from 'react';
import type { Article, PriceComparisonItem } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CodeIcon } from './icons/CodeIcon';
import { SEOMetricsBox } from './SEOMetricsBox';
import { searchImages, type ImageResult } from '../services/imageService';



const renderWithBoldAndLinks = (text: string): React.ReactNode => {
  if (!text) return null;

  // HTML linklerini parse et: <a href="URL">TEXT</a>
  const linkRegex = /<a href="([^"]+)">([^<]+)<\/a>/g;
  const parts = text.split(linkRegex);

  return parts.map((part, i) => {
    if (i % 3 === 1) { // URL kısmı - bu kısım link içinde olduğu için null döndür
      return null;
    }
    if (i % 3 === 2) { // Link text kısmı
      const url = parts[i - 1];
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline transition-colors"
        >
          {part}
        </a>
      );
    }
    // Normal text kısmı - bold parse et
    const boldParts = part.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((boldPart, j) => {
      if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
        return <strong key={`${i}-${j}`}>{boldPart.slice(2, -2).trim()}</strong>;
      }
      return boldPart;
    });
  });
};

const CopyButton: React.FC<{ textToCopy: string; className?: string; label?: string; }> = ({ textToCopy, className = '', label = 'Copy' }) => {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = () => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex shrink-0 items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all ${isCopied ? 'bg-green-500/30' : 'bg-white/10 hover:bg-white/20'
        } ${className}`}
      aria-label={`Copy ${label}`}
    >
      {isCopied ? (
        <CheckIcon className="h-4 w-4 text-green-400" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
      <span>{isCopied ? 'Copied!' : label}</span>
    </button>
  );
};


const PriceComparisonTable: React.FC<{ data: PriceComparisonItem[], location: string }> = ({ data, location }) => {
  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4 text-slate-100 pb-2">
        Price Comparison
      </h2>
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/10">
            <tr>
              <th scope="col" className="p-4 text-sm font-semibold text-slate-200">Service</th>
              <th scope="col" className="p-4 text-sm font-semibold text-slate-200">Typical Price (Turkey)</th>
              <th scope="col" className="p-4 text-sm font-semibold text-slate-200">Typical Price ({location})</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-t border-slate-700/80">
                <td className="p-4 text-slate-300 font-medium">{item.service}</td>
                <td className="p-4 text-slate-300">{item.turkeyPrice}</td>
                <td className="p-4 text-slate-300">{item.locationPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FaqHtmlDisplay: React.FC<{ html: string }> = ({ html }) => {
  if (!html) return null;
  return (
    <div className="mt-6 animate-fade-in-up" style={{ animationDuration: '0.4s' }}>
      <div className="bg-slate-900/70 border border-slate-700 rounded-lg shadow-lg">
        <header className="flex items-center justify-between p-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">FAQ HTML Snippet</h3>
          <CopyButton textToCopy={html} label="Copy Code" />
        </header>
        <div className="p-2">
          <pre className="bg-slate-800 p-4 rounded-lg text-sm text-slate-300 font-mono whitespace-pre-wrap break-words overflow-x-auto">
            <code>{html}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};


interface ArticleContentProps {
  content: string;
  priceComparison?: PriceComparisonItem[];
  location: string;
  onShowFaqHtml: () => void;
  showFaqHtml: boolean;
  faqHtml: string;
}

const ArticleContent: React.FC<ArticleContentProps> = ({
  content,
  priceComparison,
  location,
  onShowFaqHtml,
  showFaqHtml,
  faqHtml,
}) => {
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return <p className="text-slate-300">No content available.</p>;
  }

  // Developer-friendly styling helpers
  const CalloutBox = ({ type, children }: { type: 'tip' | 'important' | 'keypoint' | 'warning', children: React.ReactNode }) => {
    const config = {
      tip: { icon: '💡', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-300' },
      important: { icon: '⚡', bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-300' },
      keypoint: { icon: '🎯', bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-300' },
      warning: { icon: '⚠️', bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-300' }
    };

    const { icon, bg, text } = config[type];

    return (
      <div className={`${bg} border-l-4 ${text.replace('text-', 'border-')} p-4 rounded-r-md mb-4 bg-white/5 backdrop-blur-sm`}>
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">{icon}</span>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    );
  };

  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let inFaqSection = false;
  let inList = false;
  let currentListItems: JSX.Element[] = [];
  let currentFaq: { question: string; answer: string[] } | null = null;
  let paragraphBuffer: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];
  let sectionCounter = 0;

  const parseTableRow = (line: string): string[] => {
    // Remove leading/trailing | and split by |
    const cells = line.trim().replace(/^|\s*$/g, '').split('|').map(cell => cell.trim());
    return cells.filter(cell => cell !== '');
  };

  const isTableRow = (line: string): boolean => {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length > 2;
  };

  const isTableSeparator = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return false;
    const cells = trimmed.split('|').slice(1, -1);
    return cells.length > 0 && cells.every(cell => {
      const cellTrimmed = cell.trim();
      return cellTrimmed.length > 0 && /^-+$/.test(cellTrimmed);
    });
  };

  const renderMarkdownTable = (headers: string[], rows: string[][]): JSX.Element => {
    return (
      <div className="my-8">
        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/30">
          <table className="w-full text-left border-collapse font-mono">
            <thead className="bg-indigo-500/10 border-b border-slate-700">
              <tr>
                {headers.map((header, index) => (
                  <th key={index} scope="col" className="p-4 text-sm font-bold text-slate-100 border-r border-slate-700/50 last:border-r-0 bg-slate-900/50 animate-fade-in-stagger">
                    {renderWithBoldAndLinks(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-slate-700/50 last:border-b-0 hover:bg-slate-900/20 transition-colors animate-fade-in-stagger" style={{ animationDelay: `${rowIndex * 0.1}s` }}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="p-4 text-sm text-slate-300 font-mono border-r border-slate-700/30 last:border-r-0">
                      {renderWithBoldAndLinks(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const flushTable = () => {
    if (inTable && tableHeaders.length > 0) {
      elements.push(renderMarkdownTable(tableHeaders, tableRows));
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const paragraphText = paragraphBuffer.join(' ');
      elements.push(
        <p key={`p-${elements.length}`} className="text-slate-300 leading-relaxed mb-4 font-mono text-sm bg-slate-900/20 px-3 py-2 rounded-md border-l-2 border-indigo-500/30 animate-fade-in-stagger hover:bg-slate-900/30 transition-colors terminal-cursor">
          {renderWithBoldAndLinks(paragraphText)}
        </p>
      );
      paragraphBuffer = [];
    }
  };

  const flushList = () => {
    if (inList) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="pl-0 space-y-1 mb-6 text-slate-300">
          {currentListItems}
        </ul>
      );
      currentListItems = [];
      inList = false;
    }
  };

  const flushFaq = () => {
    if (currentFaq) {
      elements.push(
        <details key={`faq-${elements.length}`} className="mb-2 last:mb-0 bg-white/10 p-4 rounded-lg border border-white/10 group transition-all duration-300 ease-in-out">
          <summary className="font-semibold text-slate-200 cursor-pointer list-none flex justify-between items-center">
            <span className="flex-grow pr-4">{renderWithBoldAndLinks(currentFaq.question)}</span>
            <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-3 pt-3 pl-4 border-l-2 border-slate-600">
            {currentFaq.answer.map((p, i) => (
              <p key={i} className="text-slate-300 leading-relaxed mb-4 last:mb-0">
                {renderWithBoldAndLinks(p)}
              </p>
            ))}
          </div>
        </details>
      );
      currentFaq = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (trimmedLine === '[PRICE_COMPARISON_TABLE]') {
      flushParagraph();
      flushList();
      flushFaq();
      flushTable();
      if (priceComparison && priceComparison.length > 0) {
        elements.push(<PriceComparisonTable key={`price-table-${index}`} data={priceComparison} location={location} />);
      }
      return;
    }

    if (trimmedLine.startsWith('##') && trimmedLine.substring(3).trim().toLowerCase().includes('faq')) {
      flushParagraph();
      flushList();
      flushFaq();
      flushTable();
      inFaqSection = true;
      elements.push(
        <div key={`header-faq-container-${index}`} className="flex justify-between items-center border-b border-slate-700 mb-4 mt-8 animate-fade-in-stagger">
          <h2 className="text-2xl font-bold text-slate-100 pb-2 flex items-center gap-2">
            <span className="text-blue-400 text-lg">❓</span>
            Frequently Asked Questions (FAQs)
          </h2>
          <button
            onClick={onShowFaqHtml}
            className="flex shrink-0 items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-300 bg-white/10 hover:bg-white/20 transition-colors hover:scale-105"
            aria-label="Get FAQ HTML"
          >
            <CodeIcon className="h-4 w-4" />
            <span>{showFaqHtml ? 'Hide HTML' : 'Get HTML'}</span>
          </button>
        </div>
      );
      return;
    }

    if (trimmedLine === '') {
      flushParagraph();
      flushList();
      flushTable();
      return;
    }

    // Handle table separator first (must come before table row check)
    if (isTableSeparator(trimmedLine)) {
      // Skip the separator line, it's just formatting
      return;
    }

    // Handle table rows
    if (isTableRow(trimmedLine)) {
      flushParagraph();
      flushList();
      flushFaq();

      if (!inTable) {
        // This is the first row, treat as headers
        tableHeaders = parseTableRow(trimmedLine);
        inTable = true;
      } else {
        // This is a data row
        tableRows.push(parseTableRow(trimmedLine));
      }
      return;
    }

    // If we were in a table but hit a non-table line, flush the table
    if (inTable && !isTableRow(trimmedLine) && !isTableSeparator(trimmedLine)) {
      flushTable();
    }

    if (inFaqSection) {
      if (trimmedLine.startsWith('* ')) {
        flushFaq();
        currentFaq = { question: trimmedLine.substring(2).trim(), answer: [] };
      } else if (currentFaq) {
        currentFaq.answer.push(trimmedLine);
      }
    } else {
      // Developer-friendly content detection and callout creation
      const content = trimmedLine.toLowerCase();

      if (trimmedLine.startsWith('##### ')) {
        flushParagraph();
        flushList();
        flushTable();
        elements.push(<h5 key={index} className="text-base font-semibold mt-4 mb-2 text-slate-200 flex items-center gap-2">
          <span className="text-slate-500 text-xs">○</span>{renderWithBoldAndLinks(trimmedLine.substring(6))}
        </h5>);
      } else if (trimmedLine.startsWith('#### ')) {
        flushParagraph();
        flushList();
        flushTable();
        sectionCounter++;
        elements.push(<h4 key={index} className="text-lg font-semibold mt-5 mb-3 text-slate-200 flex items-center gap-3 group animate-fade-in-stagger hover:translate-x-1 transition-transform cursor-default">
          <span className="text-indigo-400 font-mono text-sm bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/30">{sectionCounter}</span>
          {renderWithBoldAndLinks(trimmedLine.substring(5))}
        </h4>);
      } else if (trimmedLine.startsWith('### ')) {
        flushParagraph();
        flushList();
        flushTable();
        sectionCounter++;
        elements.push(<h3 key={index} className="text-xl font-bold mt-6 mb-4 text-slate-100 border-l-4 border-indigo-400 pl-4 bg-gradient-to-r from-indigo-500/5 to-transparent animate-fade-in-stagger hover:border-indigo-300 transition-colors">
          <span className="inline-flex items-center gap-2">
            <span className="text-indigo-400">▶</span>
            {renderWithBoldAndLinks(trimmedLine.substring(4))}
          </span>
        </h3>);
      } else if (trimmedLine.startsWith('## ')) {
        flushParagraph();
        flushList();
        flushTable();
        sectionCounter++;
        elements.push(<h2 key={index} className="text-2xl font-bold mt-10 mb-6 text-slate-100 pb-3 border-b-2 border-slate-700/50 bg-gradient-to-r from-purple-500/5 to-blue-500/5 px-4 -mx-4 animate-fade-in-stagger hover:border-slate-600/70 transition-colors">
          <span className="inline-flex items-center gap-3">
            <span className="text-purple-400 text-3xl">✦</span>
            {renderWithBoldAndLinks(trimmedLine.substring(3))}
          </span>
        </h2>);
      } else if (content.includes('tip:') || content.includes('💡') || content.includes('pro tip')) {
        // Extract tip content
        flushParagraph();
        flushList();
        flushTable();
        elements.push(<CalloutBox key={index} type="tip">
          <span className="font-medium">{renderWithBoldAndLinks(trimmedLine)}</span>
        </CalloutBox>);
      } else if (content.includes('important:') || content.includes('⚡') || content.includes('warning') || content.includes('note:')) {
        flushParagraph();
        flushList();
        flushTable();
        elements.push(<CalloutBox key={index} type="important">
          <span className="font-medium">{renderWithBoldAndLinks(trimmedLine)}</span>
        </CalloutBox>);
      } else if (content.includes('key point') || content.includes('🎯') || content.includes('key takeaway')) {
        flushParagraph();
        flushList();
        flushTable();
        elements.push(<CalloutBox key={index} type="keypoint">
          <span className="font-medium">{renderWithBoldAndLinks(trimmedLine)}</span>
        </CalloutBox>);
      } else if (trimmedLine.startsWith('* ')) {
        flushParagraph();
        flushTable();
        inList = true;
        currentListItems.push(<li key={index} className="text-slate-300 font-mono text-sm bg-slate-900/20 px-3 py-2 rounded-md border-l-2 border-indigo-500/30 mb-2 hover:bg-slate-900/30 animate-fade-in-stagger flex items-start gap-2 transition-colors">
          <span className="text-indigo-400 mt-1 text-sm font-bold">▸</span>
          <span className="flex-1">{renderWithBoldAndLinks(trimmedLine.substring(2))}</span>
        </li>);
      } else {
        flushList();
        flushTable();
        paragraphBuffer.push(trimmedLine);
      }
    }
  });

  flushParagraph();
  flushList();
  flushFaq();
  flushTable();

  if (inFaqSection && showFaqHtml) {
    elements.push(<FaqHtmlDisplay key="faq-html-display" html={faqHtml} />);
  }

  return <>{elements}</>;
};

interface ArticleDisplayProps {
  article: Article;
  hideTitleAndMeta?: boolean;
}

type Tab = 'article' | 'metadata' | 'images';

// Image Modal Component
const ImageModal: React.FC<{
  image: ImageResult | null;
  onClose: () => void;
}> = ({ image, onClose }) => {
  const [isConverting, setIsConverting] = React.useState(false);
  const [webpSize, setWebpSize] = React.useState<number | null>(null);

  if (!image) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // WebP conversion function
  const convertToWebP = async (imageUrl: string, quality: number = 0.2): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(null);
          return;
        }

        // Set canvas dimensions to match image (limit max size for better compression)
        const maxWidth = 1000;
        const maxHeight = 700;

        let { width, height } = img;

        // Resize if image is too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Use better image smoothing for quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP with aggressive compression
        canvas.toBlob(
          (blob) => {
            // If file is still too large, try with even lower quality
            if (blob && blob.size > 200 * 1024) { // If > 200KB
              canvas.toBlob(
                (compressedBlob) => {
                  resolve(compressedBlob);
                },
                'image/webp',
                0.1 // Even lower quality for large files (10%)
              );
            } else {
              resolve(blob);
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => {
        resolve(null);
      };

      img.src = imageUrl;
    });
  };

  // Download WebP function
  const downloadWebP = async () => {
    if (!image) return;

    setIsConverting(true);
    setWebpSize(null);

    try {
      const webpBlob = await convertToWebP(image.url);

      if (webpBlob) {
        // Create download link
        const url = URL.createObjectURL(webpBlob);
        const link = document.createElement('a');
        link.href = url;

        // Generate filename
        const filename = image.alt
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase()
          .substring(0, 50);
        link.download = `${filename}.webp`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);

        // Store WebP size for display
        setWebpSize(webpBlob.size);
      } else {
        console.error('Failed to convert image to WebP');
      }
    } catch (error) {
      console.error('Error converting to WebP:', error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-10 shadow-lg"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image container */}
        <div className="relative bg-black/20 rounded-xl overflow-hidden shadow-2xl w-full max-w-4xl">
          <img
            src={image.url}
            alt={image.alt}
            className="w-full h-auto max-h-[80vh] object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = image.thumbnail;
            }}
          />

          {/* Image info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6">
            <div className="text-white">
              <p className="text-lg font-semibold mb-2 leading-tight">{image.alt}</p>
              <p className="text-sm text-slate-300 mb-2">{image.source}</p>

              {/* SEO Recommendation */}
              <p className="text-xs text-slate-400 mb-4 italic">
                💡 We recommend WebP format for better SEO performance
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <CopyButton
                  textToCopy={image.url}
                  label="Copy URL"
                  className="text-sm px-3 py-2 bg-white/20 hover:bg-white/30"
                />
                <a
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
                >
                  View Original
                </a>
                <button
                  onClick={downloadWebP}
                  disabled={isConverting}
                  className="text-sm px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  {isConverting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Converting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download WebP
                    </>
                  )}
                </button>
              </div>

              {/* WebP size info */}
              {webpSize && (
                <div className="mt-3 text-xs text-green-400">
                  ✅ WebP file downloaded ({(webpSize / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ArticleDisplay: React.FC<ArticleDisplayProps> = ({
  article,
}) => {
  const [activeTab, setActiveTab] = React.useState<Tab>('article');
  const [showFaqHtml, setShowFaqHtml] = React.useState(false);
  const [faqHtml, setFaqHtml] = React.useState('');
  const [images, setImages] = useState<ImageResult[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(9);

  // Fetch images when Images tab is selected
  useEffect(() => {
    if (activeTab === 'images' && images.length === 0 && !imagesLoading) {
      fetchImages();
    }
  }, [activeTab, images.length, imagesLoading]);

  const fetchImages = async (page = currentPage, clearExisting = false) => {
    setImagesLoading(true);
    setImagesError(null);

    if (clearExisting) {
      setImages([]); // Clear existing images for refresh
    }

    try {
      const result = await searchImages(article.topic, 4, page);
      setImages(result.images);
    } catch (error) {
      console.error('Error fetching images:', error);
      setImagesError('Failed to load images. Please try again.');
    } finally {
      setImagesLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchImages(page, true);
  };

  const generateAndToggleFaqHtml = () => {
    if (showFaqHtml) {
      setShowFaqHtml(false);
      return;
    }

    // Generate HTML if it's not already there
    if (!faqHtml && article.articleContent) {
      const lines = article.articleContent.split('\n');
      let htmlString = '';
      let inFaq = false;
      let currentDetails = { summary: '', content: [] as string[] };

      const flushDetails = () => {
        if (currentDetails.summary) {
          const paragraphs = currentDetails.content.map(p => `    <p>${p}</p>`).join('\n');
          htmlString +=
            `<details>
    <summary>${currentDetails.summary}</summary>
    <div>
  ${paragraphs}
    </div>
  </details>\n\n`;
          currentDetails = { summary: '', content: [] };
        }
      };

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('##') && trimmed.toLowerCase().includes('faq')) {
          inFaq = true;
          continue;
        }
        if (!inFaq) continue;

        if (trimmed.startsWith('* ')) {
          flushDetails();
          currentDetails.summary = trimmed.substring(2).trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        } else if (currentDetails.summary && trimmed) {
          currentDetails.content.push(trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'));
        }
      }
      flushDetails();

      setFaqHtml(htmlString.trim());
    }
    setShowFaqHtml(true);
  };

  const calculateWordCount = (text: string): number => {
    if (!text || text.trim() === '') {
      return 0;
    }
    return text.trim().split(/\s+/).length;
  };

  const generatePriceTableHtml = (data: PriceComparisonItem[]): string => {
    if (!data || data.length === 0) return '';
    const header = `<thead><tr><th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f7fafc;">Service</th><th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f7fafc;">Typical Price (Turkey)</th><th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f7fafc;">Typical Price (${article.location})</th></tr></thead>`;
    const body = data.map(item => `<tr><td style="border: 1px solid #ddd; padding: 12px;">${item.service}</td><td style="border: 1px solid #ddd; padding: 12px;">${item.turkeyPrice}</td><td style="border: 1px solid #ddd; padding: 12px;">${item.locationPrice}</td></tr>`).join('');
    return `<table style="width: 100%; border-collapse: collapse; font-family: sans-serif; margin-top: 1.5em; margin-bottom: 1.5em;">${header}<tbody>${body}</tbody></table>`;
  };

  const wordCount = calculateWordCount(article.articleContent || '');
  const contentToCopy = (article.articleContent || '').replace(
    /\[PRICE_COMPARISON_TABLE\]/g,
    article.priceComparison ? generatePriceTableHtml(article.priceComparison) : ''
  );

  const TabButton: React.FC<{ tabName: Tab, label: string }> = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-5 py-3 text-sm font-medium rounded-md transition-colors ${activeTab === tabName
        ? 'bg-indigo-500 text-white'
        : 'text-slate-300 hover:bg-white/10'
        }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="relative bg-white/5 p-6 sm:p-8 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
        <div className="mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start gap-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                {article.title}
              </h1>
              <CopyButton textToCopy={article.title} className="mt-1" />
            </div>
            <p className="text-slate-400">
              For <span className="font-semibold text-slate-300">{article.topic}</span> in <span className="font-semibold text-slate-300">{article.location}</span>
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-1 pb-2 border-b border-slate-700 mb-6">
          <div className="flex items-center gap-2 p-1 bg-white/5 rounded-lg w-fit">
            <TabButton tabName="article" label="Article" />
            <TabButton tabName="metadata" label="Metadata" />
            <TabButton tabName="images" label="Images" />
          </div>

          <SEOMetricsBox
            seoMetrics={article.seoMetrics}
            articleTitle={article.title}
            articleContent={article.articleContent}
          />
        </div>

        <div key={activeTab} className="animate-fade-in-up" style={{ animationDuration: '0.4s' }}>
          {activeTab === 'article' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-slate-400 bg-white/5 px-3 py-1.5 rounded-md border border-white/10">
                  Word Count: <span className="font-semibold text-slate-200">{wordCount}</span>
                </div>
                <CopyButton textToCopy={contentToCopy} label="Copy Content" />
              </div>
              <article className="prose prose-invert max-w-none">
                <ArticleContent
                  content={article.articleContent}
                  priceComparison={article.priceComparison}
                  location={article.location}
                  onShowFaqHtml={generateAndToggleFaqHtml}
                  showFaqHtml={showFaqHtml}
                  faqHtml={faqHtml}
                />
              </article>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-6">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-200">Excerpt (SEO Description)</h2>
                    <p className="mt-2 text-slate-400">{article.metaDescription || 'No description available'}</p>
                  </div>
                  <CopyButton textToCopy={article.metaDescription || ''} className="mt-1" />
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-200 mb-3">Keywords</h2>
                    <div className="flex flex-wrap gap-2">
                      {article.keywords && article.keywords.length > 0 ? article.keywords.map((keyword, index) => (
                        <span key={index} className="bg-indigo-500/20 text-indigo-300 text-xs font-medium px-2.5 py-1 rounded-full">
                          {keyword}
                        </span>
                      )) : (
                        <span className="text-slate-400 text-sm">No keywords available</span>
                      )}
                    </div>
                  </div>
                  <CopyButton textToCopy={article.keywords ? article.keywords.join(', ') : ''} className="mt-1" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-200">
                  Images for "{article.topic}"
                </h2>
                <button
                  onClick={() => fetchImages(currentPage, true)}
                  disabled={imagesLoading}
                  className="px-3 py-2 rounded-md text-sm text-slate-300 bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  {imagesLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {imagesError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400">{imagesError}</p>
                </div>
              )}

              {imagesLoading && images.length === 0 && (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading images...</p>
                  </div>
                </div>
              )}

              {images.length > 0 && (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="group relative bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                      >
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={image.thumbnail}
                            alt={image.alt}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          <CopyButton
                            textToCopy={image.alt}
                            label="Copy Alt"
                            className="px-2 py-1 text-xs"
                          />
                        </div>
                        <div className="p-3">
                          <p className="text-sm text-slate-300 line-clamp-2">
                            {image.alt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination controls */}
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || imagesLoading}
                      className="px-4 py-2 rounded-md bg-white/10 text-slate-300 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || imagesLoading}
                      className="px-4 py-2 rounded-md bg-white/10 text-slate-300 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>
      <ImageModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
};
