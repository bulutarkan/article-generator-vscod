import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Article, PriceComparisonItem } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CodeIcon } from './icons/CodeIcon';
import { SEOMetricsBox } from './SEOMetricsBox';
import { searchImages, type ImageResult } from '../services/imageService';
import { calculateSEOMetrics, analyzeHeadingStructure, analyzeLinkDensity } from '../services/seoAnalysisService';
import { BarChartIcon } from './icons/BarChartIcon';
import { FilesIcon } from './icons/FilesIcon';
import { InfoIcon } from './icons/InfoIcon';
import { TargetIcon } from './icons/TargetIcon';
import { rewriteParagraphQuick, rewriteParagraphWithPrompt, rewriteListQuick, rewriteListWithPrompt, rewriteTableQuick, rewriteTableWithPrompt } from '../services/geminiService';
import { TrashIcon } from './icons/TrashIcon';
import { updateArticle } from '../services/supabase';
import { AISummaryModal } from './AISummaryModal';



const ExtractHeadings = (content: string): Array<{id: string, text: string, level: number}> => {
  const headings: Array<{id: string, text: string, level: number}> = [];
  const lines = content.split('\n');
  let headingIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (match && match[2].trim()) {
      const level = match[1].length;
      const text = match[2].trim();
      headings.push({
        id: `heading-${headingIndex}`,
        text: text,
        level: level
      });
      headingIndex++;
    }
  }
  return headings;
};

const TOC: React.FC<{ headings: Array<{id: string, text: string, level: number}> }> = ({ headings }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Mobile'de scroll sonrası otomatik collapse
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const collapseIcon = '⋮⋮';

  return (
    <div className="sticky top-6 h-fit">
      {/* Round purple button - top of TOC */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={scrollToTop}
          className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-purple-600 transition-all duration-200 hover:scale-105"
          aria-label="Scroll to top"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>

        {/* TOC toggle button for mobile */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden w-12 h-12 bg-white/10 text-slate-300 rounded-full flex items-center justify-center shadow-lg hover:bg-white/20 transition-all duration-200 hover:scale-105"
          aria-label="Toggle table of contents"
        >
          <span className="text-sm font-bold">{collapseIcon}</span>
        </button>
      </div>

      {/* TOC content */}
      <div className={`mt-4 w-56 bg-slate-800/70 backdrop-blur-sm p-4 rounded-lg border border-slate-700 shadow-xl ${isExpanded || window.innerWidth >= 768 ? 'block' : 'hidden md:block'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">Table of Contents</h3>
          <button
            onClick={() => setIsExpanded(false)}
            className="md:hidden w-6 h-6 text-slate-400 hover:text-slate-200 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Close TOC"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-600">
          <ul className="space-y-1">
            {headings.map((heading, index) => (
              <li key={heading.id} className="text-sm hover:text-indigo-300 cursor-pointer transition-colors group">
                <div
                  className="flex items-start gap-2 py-1 px-2 rounded hover:bg-white/5 transition-colors"
                  onClick={() => scrollToHeading(heading.id)}
                >
                  <span className="text-indigo-400 font-mono text-xs flex-shrink-0 mt-0.5">
                    {heading.level}.
                  </span>
                  <span className="text-slate-300 group-hover:text-indigo-300 leading-tight flex-shrink-0" style={{ paddingLeft: `${(heading.level - 1) * 8}px` }}>
                    {heading.text}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {headings.length === 0 && (
          <div className="text-slate-400 text-sm text-center py-4">
            No headings found
          </div>
        )}
      </div>
    </div>
  );
};

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
  article?: Article;
  onMutateContent?: (nextContent: string) => void;
}

const ArticleContent: React.FC<ArticleContentProps> = ({
  content,
  priceComparison,
  location,
  onShowFaqHtml,
  showFaqHtml,
  faqHtml,
  article,
  onMutateContent,
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
  const [busyIdx, setBusyIdx] = React.useState<number | null>(null);
  const [menuOpenIdx, setMenuOpenIdx] = React.useState<number | null>(null);
  const [promptIdx, setPromptIdx] = React.useState<number | null>(null);
  const [promptText, setPromptText] = React.useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragHoverStart, setDragHoverStart] = useState<number | null>(null);
  const dragSessionRef = React.useRef<{ handled: boolean } | null>(null);
  type RangeEntry = {
    index: number;
    start: number;
    end: number;
    text: string;
    prefix: string;
    block?: 'p' | 'li' | 'list' | 'table' | 'faq';
    listStyle?: 'ordered' | 'unordered';
    itemCount?: number;
  };
  const paragraphRangesRef = React.useRef<Array<RangeEntry>>([]);
  paragraphRangesRef.current = [];
  const elements: React.ReactNode[] = [];
  let inFaqSection = false;
  let inList = false;
  let currentListItems: React.ReactNode[] = [];
  let currentFaq: { question: string; answer: string[] } | null = null;
  let currentFaqStart = -1;
  let currentFaqEnd = -1;
  let paragraphBuffer: string[] = [];
  let paragraphBufferRaw: string[] = [];
  let paragraphStartLine = -1;
  let lastNonEmptyLineInBuffer = -1;
  let paragraphIndexCounter = 0;
  let listStartIndex = -1;
  let currentListStyle: 'ordered' | 'unordered' | null = null;
  let currentListCount = 0;
  let lastListLineIndex = -1;
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];
  let tableStartIndex = -1;
  let tableEndIndex = -1;
  let sectionCounter = 0;
  let headingIndex = 0;

  // H2 section drag-and-drop helpers
  const sectionRangesRef = React.useRef<Array<{ id: number; start: number; end: number }>>([]);
  const dragBlockRef = React.useRef<{ start: number; end: number } | null>(null);

  const computeSectionRanges = (arr: string[]) => {
    const ranges: Array<{ id: number; start: number; end: number }> = [];
    let currentStart: number | null = null;
    for (let i = 0; i < arr.length; i++) {
      const t = arr[i].trim();
      if (t.startsWith('## ')) {
        if (currentStart !== null) {
          ranges.push({ id: currentStart, start: currentStart, end: i - 1 });
        }
        currentStart = i;
      }
    }
    if (currentStart !== null) {
      ranges.push({ id: currentStart, start: currentStart, end: arr.length - 1 });
    }
    sectionRangesRef.current = ranges;
  };

  // Generic slice move helper used by all DnD
  const performMove = (targetStart: number) => {
    const src = dragBlockRef.current;
    if (!src) return;
    const arr = content.split('\n');
    // Guard: dropping into same slice does nothing
    if (targetStart >= src.start && targetStart <= src.end) { dragBlockRef.current = null; return; }
    const slice = arr.slice(src.start, src.end + 1);
    const sliceLen = slice.length;
    // Remove source
    const arrWithout = [...arr.slice(0, src.start), ...arr.slice(src.end + 1)];
    // Adjust target index if source was before target
    let insertAt = targetStart;
    if (src.start < targetStart) insertAt = Math.max(0, targetStart - sliceLen);
    // Build insertion with safe blank-line separation to prevent paragraph merging
    const beforeIns = arrWithout.slice(0, insertAt);
    const afterIns = arrWithout.slice(insertAt);

    const needsBlankBefore = beforeIns.length > 0 && beforeIns[beforeIns.length - 1].trim() !== '';
    const needsBlankAfter = afterIns.length > 0 && afterIns[0].trim() !== '';

    const segment: string[] = [];
    if (needsBlankBefore) segment.push('');
    segment.push(...slice);
    if (needsBlankAfter) segment.push('');

    // Compose and normalize excessive blank lines to max two
    const nextArr = [...beforeIns, ...segment, ...afterIns];
    for (let i = nextArr.length - 2; i >= 1; i--) {
      if (nextArr[i] === '' && nextArr[i - 1] === '' && nextArr[i + 1] === '') {
        nextArr.splice(i, 1);
      }
    }
    dragBlockRef.current = null;
    dragSessionRef.current = null;
    setDragging(false);
    setDragHoverStart(null);
    persistContent(nextArr.join('\n'));
  };

  async function deleteRange(start: number, end: number) {
    const arr = content.split('\n');
    const before = arr.slice(0, Math.max(0, start));
    const after = arr.slice(Math.min(arr.length, end + 1));
    // Ensure we don't leave 3+ blank lines when concatenating
    const merged = [...before, ...after];
    for (let i = merged.length - 2; i >= 1; i--) {
      if (merged[i] === '' && merged[i - 1] === '' && merged[i + 1] === '') {
        merged.splice(i, 1);
      }
    }
    await persistContent(merged.join('\n'));
  }

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

  // Heading helpers for DnD boundaries
  const headingLevel = (trimmed: string): number => {
    const m = trimmed.match(/^(#{2,6})\s/);
    return m ? m[1].length : 0;
  };
  const findHeadingEnd = (arr: string[], start: number, level: number): number => {
    let end = arr.length - 1;
    for (let j = start + 1; j < arr.length; j++) {
      const t = arr[j].trim();
      const lvl = headingLevel(t);
      if (lvl > 0 && lvl <= level) { end = j - 1; break; }
    }
    return end;
  };

  const renderMarkdownTable = (headers: string[], rows: string[][]): React.ReactElement => {
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
      const blockIndex = paragraphIndexCounter++;
      // Register table range for editing, deletion and DnD
      const tblStart = tableStartIndex < 0 ? 0 : tableStartIndex;
      const tblEnd = tableEndIndex < 0 ? (tableStartIndex < 0 ? 0 : tableStartIndex) : tableEndIndex;
      paragraphRangesRef.current.push({ index: blockIndex, start: tblStart, end: tblEnd, text: '', prefix: '', block: 'table' });

      elements.push(
        <div
          key={`tablewrap-${elements.length}`}
          className="group relative"
          onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDragHoverStart(tblStart); } }}
          onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(tblStart); }}
        >
          {dragging && dragHoverStart === tblStart && (
            <div className="h-6 my-2 rounded-md border-2 border-dashed border-indigo-500/60 bg-indigo-500/10" />
          )}
          {/* Drag handle + actions */}
          <div
            className="absolute -top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-[1000] flex items-center gap-1 bg-slate-900/95 border border-slate-700 rounded-full shadow-lg px-2.5 py-1.5 backdrop-blur-sm ring-1 ring-indigo-400/30"
            onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); setDragHoverStart(tblStart); } }}
            onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(tblStart); }}
          >
            <button
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${busyIdx === blockIndex ? 'bg-indigo-600/60 text-white cursor-wait' : 'bg-white/10 hover:bg-white/20 text-slate-200'}`}
              onClick={(e) => { e.preventDefault(); handleQuickChange(blockIndex); }}
              disabled={busyIdx === blockIndex}
            >
              {busyIdx === blockIndex ? 'Working…' : 'Quick Change'}
            </button>
            <button
              className="text-xs px-2.5 py-1 rounded-full hover:bg-white/10 text-slate-300 transition-all duration-200"
              onClick={(e) => { e.preventDefault(); setPromptIdx(blockIndex); setMenuOpenIdx(null); }}
              aria-label="Change table with prompt"
            >
              Prompt…
            </button>
            <button
              className="p-1 rounded-full text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
              onClick={(e) => { e.preventDefault(); deleteBlockAt(blockIndex); }}
              aria-label="Delete table"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
            {/* Drag handle */}
            <div
              draggable
              onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'move'); } catch {} e.stopPropagation(); dragBlockRef.current = { start: tblStart, end: tblEnd }; setDragging(true); setDragHoverStart(null); dragSessionRef.current = { handled: false }; }}
              onDragEnd={() => {
                // finalize move to last hovered target
                const target = dragHoverStart;
                if (target != null && dragBlockRef.current) {
                  performMove(target);
                } else {
                  setDragging(false);
                  setDragHoverStart(null);
                  dragBlockRef.current = null;
                  dragSessionRef.current = null;
                }
              }}
              className="ml-1 cursor-grab text-slate-400 hover:text-slate-200"
              title="Drag to move table"
            >
              ⋮⋮
            </div>
          </div>
          {renderMarkdownTable(tableHeaders, tableRows)}
        </div>
      );

      tableHeaders = [];
      tableRows = [];
      inTable = false;
      tableStartIndex = -1;
      tableEndIndex = -1;
    }
  };

  // --- Paragraph AI edit helpers ---
  const isControlsActive = (idx: number) => busyIdx === idx || menuOpenIdx === idx || promptIdx === idx;
  async function persistContent(nextContent: string) {
    try {
      if (onMutateContent) onMutateContent(nextContent);
      if (article?.id) {
        await updateArticle(article.id, { articleContent: nextContent });
      }
    } catch (e) {
      console.error('Auto-save to Supabase failed:', e);
    }
  }

  async function replaceParagraphAt(index: number, nextParagraph: string) {
    const entry = paragraphRangesRef.current.find(e => e.index === index);
    if (!entry) return;
    const arr = content.split('\n');
    const before = arr.slice(0, entry.start);
    const after = arr.slice(entry.end + 1);
    const nextLine = `${entry.prefix || ''}${nextParagraph}`;
    const nextContent = [...before, nextLine, ...after].join('\n');
    await persistContent(nextContent);
  }

  async function replaceListBlockAt(index: number, nextItems: string[]) {
    const entry = paragraphRangesRef.current.find(e => e.index === index);
    if (!entry) return;
    const arr = content.split('\n');
    const before = arr.slice(0, entry.start);
    const after = arr.slice(entry.end + 1);
    const styled = (entry.listStyle === 'ordered')
      ? nextItems.map((t, i) => `${i + 1}. ${t}`)
      : nextItems.map((t) => `* ${t}`);
    const nextContent = [...before, ...styled, ...after].join('\n');
    await persistContent(nextContent);
  }

  function parseTableFromSlice(start: number, end: number): { headers: string[]; rows: string[][] } | null {
    const arr = content.split('\n').slice(start, end + 1);
    const rows: string[][] = [];
    let headers: string[] | null = null;
    for (const ln of arr) {
      const t = ln.trim();
      if (isTableSeparator(t)) continue;
      if (isTableRow(t)) {
        const cells = parseTableRow(t);
        if (!headers) headers = cells; else rows.push(cells);
      }
    }
    if (!headers) return null;
    return { headers, rows };
  }

  async function replaceTableBlockAt(index: number, headers: string[], nextRows: string[][]) {
    const entry = paragraphRangesRef.current.find(e => e.index === index);
    if (!entry) return;
    const arr = content.split('\n');
    const before = arr.slice(0, entry.start);
    const after = arr.slice(entry.end + 1);

    const headerLine = `| ${headers.join(' | ')} |`;
    const sepLine = `|${headers.map(() => '---').join('|')}|`;
    const rowLines = nextRows.map(r => `| ${r.join(' | ')} |`);
    const tableLines = [headerLine, sepLine, ...rowLines];
    const nextContent = [...before, ...tableLines, ...after].join('\n');
    await persistContent(nextContent);
  }

  async function handleQuickChange(index: number) {
    const entry = paragraphRangesRef.current.find(e => e.index === index);
    if (!entry) return;
    setBusyIdx(index);
    try {
      if (entry.block === 'list') {
        // Build items from current content slice
        const slice = content.split('\n').slice(entry.start, entry.end + 1);
        const items = slice.map((ln) => ln.replace(/^\*\s+/, '').replace(/^\d+[\.)]\s+/, '').trim());
        const rewrittenItems = await rewriteListQuick({
          items,
          style: entry.listStyle || 'unordered',
          topic: article?.topic,
          tone: article?.tone,
          location: article?.location,
        });
        await replaceListBlockAt(index, rewrittenItems);
      } else if (entry.block === 'table') {
        const parsed = parseTableFromSlice(entry.start, entry.end);
        if (parsed) {
          const rewritten = await rewriteTableQuick({
            headers: parsed.headers,
            rows: parsed.rows,
            topic: article?.topic,
            tone: article?.tone,
            location: article?.location,
          });
          await replaceTableBlockAt(index, parsed.headers, rewritten);
        }
      } else {
        const candidate = entry.text.replace(/\s+/g, ' ').trim();
        const rewritten = await rewriteParagraphQuick({
          paragraph: candidate,
          topic: article?.topic,
          tone: article?.tone,
          location: article?.location,
        });
        await replaceParagraphAt(index, rewritten);
      }
    } catch (e) {
      console.error('Quick change failed:', e);
    } finally {
      setBusyIdx(null);
    }
  }

  async function handlePromptChange(index: number) {
    const entry = paragraphRangesRef.current.find(e => e.index === index);
    if (!entry || !promptText.trim()) return;
    setBusyIdx(index);
    try {
      if (entry.block === 'list') {
        const slice = content.split('\n').slice(entry.start, entry.end + 1);
        const items = slice.map((ln) => ln.replace(/^\*\s+/, '').replace(/^\d+[\.)]\s+/, '').trim());
        const rewritten = await rewriteListWithPrompt({
          items,
          style: entry.listStyle || 'unordered',
          userPrompt: promptText.trim(),
          topic: article?.topic,
          tone: article?.tone,
          location: article?.location,
        });
        await replaceListBlockAt(index, rewritten);
      } else if (entry.block === 'table') {
        const parsed = parseTableFromSlice(entry.start, entry.end);
        if (parsed) {
          const rewritten = await rewriteTableWithPrompt({
            headers: parsed.headers,
            rows: parsed.rows,
            userPrompt: promptText.trim(),
            topic: article?.topic,
            tone: article?.tone,
            location: article?.location,
          });
          await replaceTableBlockAt(index, parsed.headers, rewritten);
        }
      } else {
        const candidate = entry.text.replace(/\s+/g, ' ').trim();
        const rewritten = await rewriteParagraphWithPrompt({
          paragraph: candidate,
          userPrompt: promptText.trim(),
          topic: article?.topic,
          tone: article?.tone,
          location: article?.location,
        });
        await replaceParagraphAt(index, rewritten);
      }
    } catch (e) {
      console.error('Prompted change failed:', e);
    } finally {
      setPromptIdx(null);
      setPromptText('');
      setBusyIdx(null);
    }
  }

  async function deleteBlockAt(index: number) {
    const entry = paragraphRangesRef.current.find(e => e.index === index);
    if (!entry) return;
    const arr = content.split('\n');
    const before = arr.slice(0, entry.start);
    const after = arr.slice(entry.end + 1);
    const next = [...before, ...after].join('\n').replace(/\n{3,}/g, '\n\n');
    await persistContent(next);
  }

  // Apply one of the preset prompt actions without echoing into the textarea
  async function handlePresetPromptChange(index: number, instruction: string) {
    const entry = paragraphRangesRef.current.find(e => e.index === index);
    if (!entry || !instruction.trim()) return;
    setBusyIdx(index);
    try {
      if (entry.block === 'list') {
        const slice = content.split('\n').slice(entry.start, entry.end + 1);
        const items = slice.map((ln) => ln.replace(/^\*\s+/, '').replace(/^\d+[\.)]\s+/, '').trim());
        const rewritten = await rewriteListWithPrompt({
          items,
          style: entry.listStyle || 'unordered',
          userPrompt: instruction.trim(),
          topic: article?.topic,
          tone: article?.tone,
          location: article?.location,
        });
        await replaceListBlockAt(index, rewritten);
      } else {
        const candidate = entry.text.replace(/\s+/g, ' ').trim();
        const rewritten = await rewriteParagraphWithPrompt({
          paragraph: candidate,
          userPrompt: instruction.trim(),
          topic: article?.topic,
          tone: article?.tone,
          location: article?.location,
        });
        await replaceParagraphAt(index, rewritten);
      }
    } catch (e) {
      console.error('Preset prompted change failed:', e);
    } finally {
      setPromptIdx(null);
      setPromptText('');
      setBusyIdx(null);
    }
  }

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const paragraphText = paragraphBuffer.join(' ');
      const myIndex = paragraphIndexCounter++;
      const start = paragraphStartLine < 0 ? 0 : paragraphStartLine;
      const end = lastNonEmptyLineInBuffer < 0 ? start : lastNonEmptyLineInBuffer;
      paragraphRangesRef.current.push({ index: myIndex, start, end, text: paragraphBufferRaw.join('\n'), prefix: '' });

      elements.push(
        <div
          key={`pwrap-${elements.length}`}
          className="group relative mb-4"
          onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDragHoverStart(start); } }}
          onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(start); }}
        >
          {dragging && dragHoverStart === start && (
            <div className="h-5 my-2 rounded-md border-2 border-dashed border-indigo-500/60 bg-indigo-500/10" />
          )}
          <p className="text-slate-300 leading-relaxed font-mono text-sm bg-slate-900/20 px-3 py-2 rounded-md border-l-2 border-indigo-500/30 animate-fade-in-stagger hover:bg-slate-900/30 transition-colors terminal-cursor ring-0 group-hover:ring-2 group-hover:ring-indigo-500/40">
            {renderWithBoldAndLinks(paragraphText)}
          </p>
          <div
            className={`absolute -top-8 right-0 z-[1000] ${isControlsActive(myIndex) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
            onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); setDragHoverStart(start); } }}
            onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(start); }}
          >
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 rounded-md shadow px-2 py-1">
              <button
                className={`text-xs px-2 py-1 rounded-md transition-colors ${busyIdx === myIndex ? 'bg-indigo-600/60 text-white cursor-wait' : 'bg-white/10 hover:bg-white/20 text-slate-200'}`}
                onClick={(e) => { e.preventDefault(); handleQuickChange(myIndex); }}
                disabled={busyIdx === myIndex}
              >
                {busyIdx === myIndex ? 'Working…' : 'Quick Change'}
              </button>
              <div
                className="cursor-grab text-slate-400 hover:text-slate-200 px-1"
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'move'); } catch {} e.stopPropagation(); dragBlockRef.current = { start, end }; setDragging(true); setDragHoverStart(null); dragSessionRef.current = { handled: false }; }}
                onDragEnd={() => {
                  const target = dragHoverStart;
                  if (target != null && dragBlockRef.current) {
                    performMove(target);
                  } else {
                    setDragging(false);
                    setDragHoverStart(null);
                    dragBlockRef.current = null;
                    dragSessionRef.current = null;
                  }
                }}
                title="Drag paragraph"
              >
                ⋮⋮
              </div>
              <button
                className="p-1 rounded-md text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
                onClick={(e) => { e.preventDefault(); deleteBlockAt(myIndex); }}
                aria-label="Delete paragraph"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <button
                className="text-sm px-2 py-1 rounded-md hover:bg-white/10 text-slate-300 transition-all duration-200 hover:scale-105"
                onClick={(e) => { e.preventDefault(); setMenuOpenIdx(menuOpenIdx === myIndex ? null : myIndex); }}
                aria-label="More paragraph actions"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${menuOpenIdx === myIndex ? 'rotate-180' : 'rotate-0'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            {menuOpenIdx === myIndex && (
              <div className="mt-1 w-full bg-slate-900/95 border border-slate-700 rounded-md shadow-lg p-2 z-[1001]">
                <button
                  className="text-left text-xs px-2 py-1.5 rounded hover:bg-white/10 text-slate-200"
                  onClick={(e) => { e.preventDefault(); setPromptIdx(myIndex); setMenuOpenIdx(null); }}
                >
                  Change with prompt…
                </button>
              </div>
            )}
          </div>
        </div>
      );
      paragraphBuffer = [];
      paragraphBufferRaw = [];
      paragraphStartLine = -1;
      lastNonEmptyLineInBuffer = -1;
    }
  };

  const flushList = () => {
    if (inList) {
      const blockIndex = paragraphIndexCounter++;
      // Register the whole list block range
      paragraphRangesRef.current.push({
        index: blockIndex,
        start: listStartIndex < 0 ? 0 : listStartIndex,
        end: lastListLineIndex < 0 ? (listStartIndex < 0 ? 0 : listStartIndex) : lastListLineIndex,
        text: '',
        prefix: '',
        block: 'list',
        listStyle: currentListStyle || 'unordered',
        itemCount: currentListCount,
      });

      const startL = listStartIndex < 0 ? 0 : listStartIndex;
      const endL = lastListLineIndex < 0 ? (listStartIndex < 0 ? 0 : listStartIndex) : lastListLineIndex;
      elements.push(
        <div
          key={`ulwrap-${elements.length}`}
          className="group relative mb-6"
          onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDragHoverStart(startL); } }}
          onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(startL); }}
        >
          {dragging && dragHoverStart === startL && (
            <div className="h-6 my-2 rounded-md border-2 border-dashed border-indigo-500/60 bg-indigo-500/10" />
          )}
          <ul className="pl-0 space-y-1 text-slate-300">
            {currentListItems}
          </ul>
          <div
            className="absolute -top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-[1000]"
            onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); setDragHoverStart(startL); } }}
            onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(startL); }}
          >
            <div className="flex items-center gap-1 bg-slate-900/95 border border-slate-700 rounded-full shadow-lg px-2.5 py-1.5 backdrop-blur-sm ring-1 ring-indigo-400/30">
              <button
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${busyIdx === blockIndex ? 'bg-indigo-600/60 text-white cursor-wait' : 'bg-white/10 hover:bg-white/20 text-slate-200'}`}
                onClick={(e) => { e.preventDefault(); handleQuickChange(blockIndex); }}
                disabled={busyIdx === blockIndex}
              >
                {busyIdx === blockIndex ? 'Working…' : 'Quick Change All'}
              </button>
              <button
                className="text-sm px-3 py-2 rounded-full hover:bg-white/10 text-slate-300 transition-all duration-200 hover:scale-105"
                onClick={(e) => { e.preventDefault(); setPromptIdx(blockIndex); setMenuOpenIdx(null); }}
                aria-label="Change list with prompt"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${promptIdx === blockIndex ? 'rotate-180' : 'rotate-0'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                className="p-1 rounded-full text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
                onClick={(e) => { e.preventDefault(); deleteBlockAt(blockIndex); }}
                aria-label="Delete list"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              {/* Drag handle */}
              <div
                className="ml-1 cursor-grab text-slate-400 hover:text-slate-200"
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'move'); } catch {} e.stopPropagation(); dragBlockRef.current = { start: startL, end: endL }; setDragging(true); setDragHoverStart(null); dragSessionRef.current = { handled: false }; }}
                onDragEnd={() => {
                  const target = dragHoverStart;
                  if (target != null && dragBlockRef.current) {
                    performMove(target);
                  } else {
                    setDragging(false);
                    setDragHoverStart(null);
                    dragBlockRef.current = null;
                    dragSessionRef.current = null;
                  }
                }}
                title="Drag list block"
              >
                ⋮⋮
              </div>
            </div>
          </div>
        </div>
      );

      // Reset list state
      currentListItems = [];
      inList = false;
      listStartIndex = -1;
      currentListStyle = null;
      currentListCount = 0;
      lastListLineIndex = -1;
    }
  };

  const flushFaq = () => {
    if (currentFaq) {
      const faqStart = currentFaqStart < 0 ? 0 : currentFaqStart;
      const faqEnd = currentFaqEnd < 0 ? faqStart : currentFaqEnd;
      const blockIndex = paragraphIndexCounter++;
      paragraphRangesRef.current.push({ index: blockIndex, start: faqStart, end: faqEnd, text: '', prefix: '', block: 'faq' });
      elements.push(
        <div
          key={`faq-${elements.length}`}
          className="relative group"
          onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDragHoverStart(faqStart); } }}
          onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(faqStart); }}
        >
          {dragging && dragHoverStart === faqStart && (
            <div className="h-6 my-2 rounded-md border-2 border-dashed border-indigo-500/60 bg-indigo-500/10" />
          )}
          <div
            className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-[1000] flex items-center gap-1 bg-slate-900/95 border border-slate-700 rounded-full shadow-lg px-2.5 py-1.5 backdrop-blur-sm ring-1 ring-indigo-400/30"
            onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); setDragHoverStart(faqStart); } }}
            onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(faqStart); }}
          >
            <div
              className="cursor-grab text-slate-400 hover:text-slate-200"
              draggable
              onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'move'); } catch {} e.stopPropagation(); dragBlockRef.current = { start: faqStart, end: faqEnd }; setDragging(true); setDragHoverStart(null); }}
              onDragEnd={() => {
                const target = dragHoverStart;
                if (target != null && dragBlockRef.current) {
                  performMove(target);
                } else {
                  setDragging(false);
                  setDragHoverStart(null);
                  dragBlockRef.current = null;
                  dragSessionRef.current = null;
                }
              }}
              title="Drag FAQ item"
            >
              ⋮⋮
            </div>
            <button
              className="p-1 rounded-full text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteBlockAt(blockIndex); }}
              aria-label="Delete FAQ"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
          <details className="mb-2 last:mb-0 bg-white/10 p-4 rounded-lg border border-white/10 group transition-all duration-300 ease-in-out">
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
        </div>
      );
      currentFaq = null;
      currentFaqStart = -1;
      currentFaqEnd = -1;
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
        tableStartIndex = index;
        tableEndIndex = index;
      } else {
        // This is a data row
        tableRows.push(parseTableRow(trimmedLine));
        tableEndIndex = index;
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
        currentFaqStart = index;
        currentFaqEnd = index;
      } else if (currentFaq) {
        currentFaq.answer.push(trimmedLine);
        currentFaqEnd = index;
      }
    } else {
      // Developer-friendly content detection and callout creation
      const lower = trimmedLine.toLowerCase();

      if (trimmedLine.startsWith('###### ')) {
        flushParagraph();
        flushList();
        flushTable();
        const arr = content.split('\n');
        const start = index;
        const end = findHeadingEnd(arr, start, 6);
        elements.push(
          <div key={`h6wrap-${index}`} className="relative group"
               onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDragHoverStart(start); } }}
               onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(start); }}
          >
            {dragging && dragHoverStart === start && (
              <div className="h-4 my-1 rounded-md border-2 border-dashed border-indigo-500/60 bg-indigo-500/10" />
            )}
            <div
              className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 bg-slate-900/90 border border-slate-700 rounded-md px-2 py-1 flex items-center gap-1"
              onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); setDragHoverStart(start); } }}
              onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(start); }}
            >
              <button
                className="p-1 rounded-full text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); const a = content.split('\n'); const s = start; const eIdx = findHeadingEnd(a, s, 6); deleteRange(s, eIdx); }}
                aria-label="Delete H6 section"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <div
                 className="cursor-grab"
                 draggable
                 onDragStart={(e) => { const a = content.split('\n'); const s = start; const eIdx = findHeadingEnd(a, s, 6); dragBlockRef.current = { start: s, end: eIdx }; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'move'); } catch {}; e.stopPropagation(); setDragging(true); setDragHoverStart(null); dragSessionRef.current = { handled: false }; }}
                 onDragEnd={() => { const target = dragHoverStart; if (target != null && dragBlockRef.current) { performMove(target); } else { setDragging(false); setDragHoverStart(null); dragBlockRef.current = null; dragSessionRef.current = null; } }}
                 title="Drag this H6 section"
              >⋮⋮</div>
            </div>
            <h6 className="text-sm font-semibold mt-3 mb-1 text-slate-200 flex items-center gap-2">
              <span className="text-slate-500 text-xs">•</span>{renderWithBoldAndLinks(trimmedLine.substring(7))}
            </h6>
          </div>
        );
      } else if (trimmedLine.startsWith('##### ')) {
        flushParagraph();
        flushList();
        flushTable();
        const arr = content.split('\n');
        const start = index;
        const end = findHeadingEnd(arr, start, 5);
        elements.push(
          <div key={`h5wrap-${index}`} className="relative group"
               onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDragHoverStart(start); } }}
               onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(start); }}
          >
            {dragging && dragHoverStart === start && (
              <div className="h-5 my-2 rounded-md border-2 border-dashed border-indigo-500/60 bg-indigo-500/10" />
            )}
            <div
              className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 bg-slate-900/90 border border-slate-700 rounded-md px-2 py-1 flex items-center gap-1"
              onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); setDragHoverStart(start); } }}
              onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(start); }}
            >
              <button
                className="p-1 rounded-full text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); const a = content.split('\n'); const s = start; const eIdx = findHeadingEnd(a, s, 5); deleteRange(s, eIdx); }}
                aria-label="Delete H5 section"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <div
                 className="cursor-grab"
                 draggable
                 onDragStart={(e) => { const a = content.split('\n'); const s = start; const eIdx = findHeadingEnd(a, s, 5); dragBlockRef.current = { start: s, end: eIdx }; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'move'); } catch {}; e.stopPropagation(); setDragging(true); setDragHoverStart(null); dragSessionRef.current = { handled: false }; }}
                 onDragEnd={() => { const target = dragHoverStart; if (target != null && dragBlockRef.current) { performMove(target); } else { setDragging(false); setDragHoverStart(null); dragBlockRef.current = null; dragSessionRef.current = null; } }}
                 title="Drag this H5 section"
              >⋮⋮</div>
            </div>
            <h5 className="text-base font-semibold mt-4 mb-2 text-slate-200 flex items-center gap-2">
              <span className="text-slate-500 text-xs">○</span>{renderWithBoldAndLinks(trimmedLine.substring(6))}
            </h5>
          </div>
        );
      } else if (trimmedLine.startsWith('#### ')) {
        flushParagraph();
        flushList();
        flushTable();
        sectionCounter++;
        const arr = content.split('\n');
        const start = index;
        const end = findHeadingEnd(arr, start, 4);
        elements.push(
          <div key={`h4wrap-${index}`} className="relative group"
               onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDragHoverStart(start); } }}
               onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(start); }}
          >
            {dragging && dragHoverStart === start && (
              <div className="h-6 my-2 rounded-md border-2 border-dashed border-indigo-500/60 bg-indigo-500/10" />
            )}
            <div
              className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 bg-slate-900/90 border border-slate-700 rounded-md px-2 py-1 flex items-center gap-1"
              onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); setDragHoverStart(start); } }}
              onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(start); }}
            >
              <button
                className="p-1 rounded-full text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); const a = content.split('\n'); const s = start; const eIdx = findHeadingEnd(a, s, 4); deleteRange(s, eIdx); }}
                aria-label="Delete H4 section"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <div
                 className="cursor-grab"
                 draggable
                 onDragStart={(e) => { const a = content.split('\n'); const s = start; const eIdx = findHeadingEnd(a, s, 4); dragBlockRef.current = { start: s, end: eIdx }; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'move'); } catch {}; e.stopPropagation(); setDragging(true); setDragHoverStart(null); dragSessionRef.current = { handled: false }; }}
                 onDragEnd={() => { const target = dragHoverStart; if (target != null && dragBlockRef.current) { performMove(target); } else { setDragging(false); setDragHoverStart(null); dragBlockRef.current = null; dragSessionRef.current = null; } }}
                 title="Drag this H4 section"
              >⋮⋮</div>
            </div>
            <h4 className="text-lg font-semibold mt-5 mb-3 text-slate-200 flex items-center gap-3 group animate-fade-in-stagger hover:translate-x-1 transition-transform cursor-default">
              <span className="text-indigo-400 font-mono text-sm bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/30">{sectionCounter}</span>
              {renderWithBoldAndLinks(trimmedLine.substring(5))}
            </h4>
          </div>
        );
      } else if (trimmedLine.startsWith('### ')) {
        flushParagraph();
        flushList();
        flushTable();
        sectionCounter++;
        const arr = content.split('\n');
        const start = index;
        const end = findHeadingEnd(arr, start, 3);
        elements.push(
          <div key={`h3wrap-${index}`} className="relative group"
               onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDragHoverStart(start); } }}
               onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(index); }}
          >
            {dragging && dragHoverStart === start && (
              <div className="h-6 my-2 rounded-md border-2 border-dashed border-indigo-500/60 bg-indigo-500/10" />
            )}
            <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 bg-slate-900/90 border border-slate-700 rounded-md px-2 py-1 flex items-center gap-1">
              <button
                className="p-1 rounded-full text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); const a = content.split('\n'); const s = start; const eIdx = findHeadingEnd(a, s, 3); deleteRange(s, eIdx); }}
                aria-label="Delete H3 section"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <div
                 className="cursor-grab"
                 draggable
                 onDragStart={(e) => { const a = content.split('\n'); const s = start; const eIdx = findHeadingEnd(a, s, 3); dragBlockRef.current = { start: s, end: eIdx }; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'move'); } catch {}; e.stopPropagation(); setDragging(true); setDragHoverStart(null); dragSessionRef.current = { handled: false }; }}
                 onDragEnd={() => {
                   const target = dragHoverStart;
                   if (target != null && dragBlockRef.current) {
                     performMove(target);
                   } else {
                     setDragging(false);
                     setDragHoverStart(null);
                     dragBlockRef.current = null;
                     dragSessionRef.current = null;
                   }
                 }}
                 title="Drag this H3 section"
              >⋮⋮</div>
            </div>
            <h3 className="text-xl font-bold mt-6 mb-4 text-slate-100 border-l-4 border-indigo-400 pl-4 bg-gradient-to-r from-indigo-500/5 to-transparent animate-fade-in-stagger hover:border-indigo-300 transition-colors">
              <span className="inline-flex items-center gap-2">
                <span className="text-indigo-400">▶</span>
                {renderWithBoldAndLinks(trimmedLine.substring(4))}
              </span>
            </h3>
          </div>
        );
      } else if (trimmedLine.startsWith('## ')) {
        flushParagraph();
        flushList();
        flushTable();
        sectionCounter++;
        // Drag-enabled H2 container
        const h2Start = index;
        const h2End = findHeadingEnd(content.split('\n'), h2Start, 2);
        elements.push(
          <div key={`h2wrap-${index}`} className="relative group"
               onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDragHoverStart(h2Start); } }}
               onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(h2Start); }}
          >
            {dragging && dragHoverStart === h2Start && (
              <div className="h-6 my-2 rounded-md border-2 border-dashed border-indigo-500/60 bg-indigo-500/10" />
            )}
            <div
              className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 bg-slate-900/90 border border-slate-700 rounded-md px-2 py-1 flex items-center gap-1"
              onDragOver={(e) => { if (dragBlockRef.current) { e.preventDefault(); e.stopPropagation(); setDragHoverStart(h2Start); } }}
              onDrop={(e) => { if (!dragBlockRef.current) return; e.preventDefault(); e.stopPropagation(); if (dragSessionRef.current?.handled) return; dragSessionRef.current = { handled: true }; performMove(h2Start); }}
            >
              <button
                className="p-1 rounded-full text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteRange(h2Start, h2End); }}
                aria-label="Delete H2 section"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <div
                 className="cursor-grab"
                 draggable
                 onDragStart={(e) => {
                   dragBlockRef.current = { start: h2Start, end: h2End };
                   e.dataTransfer.effectAllowed = 'move';
                   try { e.dataTransfer.setData('text/plain', 'move'); } catch {}
                   e.stopPropagation();
                   setDragging(true);
                   setDragHoverStart(null);
                   dragSessionRef.current = { handled: false };
                  }}
                 onDragEnd={() => {
                   const target = dragHoverStart;
                   if (target != null && dragBlockRef.current) {
                     performMove(target);
                   } else {
                     setDragging(false);
                     setDragHoverStart(null);
                     dragBlockRef.current = null;
                     dragSessionRef.current = null;
                   }
                 }}
                 title="Drag this section"
              >⋮⋮</div>
            </div>
            <h2
              id={`heading-${headingIndex++}`}
              className="text-2xl font-bold mt-10 mb-6 text-slate-100 pb-3 border-b-2 border-slate-700/50 bg-gradient-to-r from-purple-500/5 to-blue-500/5 px-4 -mx-4 animate-fade-in-stagger hover:border-slate-600/70 transition-colors"
            >
              <span className="inline-flex items-center gap-3">
                <span className="text-purple-400 text-3xl">✦</span>
                {renderWithBoldAndLinks(trimmedLine.substring(3))}
              </span>
            </h2>
          </div>
        );
      } else if (lower.includes('tip:') || lower.includes('💡') || lower.includes('pro tip')) {
        // Extract tip content
        flushParagraph();
        flushList();
        flushTable();
        elements.push(<CalloutBox key={index} type="tip">
          <span className="font-medium">{renderWithBoldAndLinks(trimmedLine)}</span>
        </CalloutBox>);
      } else if (lower.includes('important:') || lower.includes('⚡') || lower.includes('warning') || lower.includes('note:')) {
        flushParagraph();
        flushList();
        flushTable();
        elements.push(<CalloutBox key={index} type="important">
          <span className="font-medium">{renderWithBoldAndLinks(trimmedLine)}</span>
        </CalloutBox>);
      } else if (lower.includes('key point') || lower.includes('🎯') || lower.includes('key takeaway')) {
        flushParagraph();
        flushList();
        flushTable();
        elements.push(<CalloutBox key={index} type="keypoint">
          <span className="font-medium">{renderWithBoldAndLinks(trimmedLine)}</span>
        </CalloutBox>);
      } else if (trimmedLine.startsWith('* ') || /^\d+[\.)]\s/.test(trimmedLine)) {
        flushParagraph();
        flushTable();
        if (!inList) {
          inList = true;
          listStartIndex = index;
          currentListStyle = /^\d+[\.)]\s/.test(trimmedLine) ? 'ordered' : 'unordered';
        }
        const isOrdered = currentListStyle === 'ordered';
        const matchPrefix = trimmedLine.match(/^(\d+[\.)]\s)/);
        const prefix = isOrdered ? (matchPrefix ? matchPrefix[1] : '') : '* ';
        const itemText = isOrdered ? trimmedLine.replace(/^(\d+[\.)]\s)/, '').trim() : trimmedLine.substring(2);
        const liIndex = paragraphIndexCounter++;
        paragraphRangesRef.current.push({ index: liIndex, start: index, end: index, text: itemText, prefix, block: 'li', listStyle: currentListStyle || undefined });
        currentListCount++;
        lastListLineIndex = index;

        currentListItems.push(
          <li key={index} className="relative group text-slate-300 font-mono text-sm bg-slate-900/20 px-3 py-2 rounded-md border-l-2 border-indigo-500/30 mb-2 hover:bg-slate-900/30 animate-fade-in-stagger transition-colors">
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 mt-1 text-sm font-bold">{isOrdered ? prefix.trim() : '▸'}</span>
              <span className="flex-1">{renderWithBoldAndLinks(itemText)}</span>
            </div>
            <div className={`absolute -top-3 right-2 z-[1000] ${isControlsActive(liIndex) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 rounded-md shadow px-2 py-1">
                <button
                  className={`text-xs px-3 py-1 rounded-md transition-colors ${busyIdx === liIndex ? 'bg-indigo-600/60 text-white cursor-wait' : 'bg-white/10 hover:bg-white/20 text-slate-200'}`}
                  onClick={(e) => { e.preventDefault(); handleQuickChange(liIndex); }}
                  disabled={busyIdx === liIndex}
                >
                  {busyIdx === liIndex ? 'Working…' : 'Quick Change'}
                </button>
                <button
                  className="p-1 rounded-md text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
                  onClick={(e) => { e.preventDefault(); deleteBlockAt(liIndex); }}
                  aria-label="Delete list item"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
                <button
                  className="text-sm px-3 py-2 rounded-md hover:bg-white/10 text-slate-300 transition-all duration-200 hover:scale-105"
                  onClick={(e) => { e.preventDefault(); setMenuOpenIdx(menuOpenIdx === liIndex ? null : liIndex); }}
                  aria-label="More item actions"
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${menuOpenIdx === liIndex ? 'rotate-180' : 'rotate-0'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {menuOpenIdx === liIndex && (
                <div className="mt-1 w-full bg-slate-900/95 border border-slate-700 rounded-md shadow-lg p-2 z-[1001]">
                  <button
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-white/10 text-slate-200"
                    onClick={(e) => { e.preventDefault(); setPromptIdx(liIndex); setMenuOpenIdx(null); }}
                  >
                    Change with prompt…
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      } else {
        flushList();
        flushTable();
        if (paragraphBuffer.length === 0) {
          paragraphStartLine = index;
        }
        paragraphBuffer.push(trimmedLine);
        paragraphBufferRaw.push(line.replace(/\s+$/, ''));
        lastNonEmptyLineInBuffer = index;
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

  // Central prompt modal (prevents hover-close, adds overlay + transitions)
  useEffect(() => {
    if (promptIdx !== null) {
      setIsModalVisible(false);
      setIsFadingOut(false);
      // Small delay to trigger fade-in
      setTimeout(() => setIsModalVisible(true), 10);
    }
  }, [promptIdx]);

  const handleCloseModal = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setPromptIdx(null);
      setPromptText('');
      setIsModalVisible(false);
      setIsFadingOut(false);
    }, 200);
  };

  const renderPromptModal = () => {
    if (promptIdx === null) return null;
    // Preset prompt actions (label + instruction + description for tooltip)
    const presets: Array<{ key: string; label: string; instruction: string; description: string }> = [
      {
        key: 'shorter',
        label: 'Shorter',
        instruction: 'Keep the semantic integrity and make it 25% shorter.',
        description: 'Reduce length ~25% while preserving meaning.'
      },
      {
        key: 'longer',
        label: 'Longer',
        instruction: 'Keep the semantic integrity and make it 25% longer.',
        description: 'Expand content ~25% without adding new facts.'
      },
      {
        key: 'concise',
        label: 'Concise',
        instruction: 'Keep the semantic integrity, make it more concise and brief.',
        description: 'Tighten wording; remove redundancy; keep meaning.'
      },
      {
        key: 'simplify',
        label: 'Simplify',
        instruction: 'Rewrite in simpler, plain language without losing key information.',
        description: 'Use plain language and shorter sentences.'
      },
      {
        key: 'polish',
        label: 'Fluent Polish',
        instruction: 'Enhance flow, transitions, and readability without changing meaning.',
        description: 'Improve flow and readability; keep content the same.'
      },
      {
        key: 'casual',
        label: 'Casual',
        instruction: 'Make it more conversational and reader-friendly.',
        description: 'Loosen tone slightly; sound friendly and natural.'
      },
      {
        key: 'formal',
        label: 'Formalize',
        instruction: 'Adjust tone to a more formal and professional style.',
        description: 'More formal, precise tone without changing meaning.'
      },
    ];
    return createPortal(
      <div className={`fixed inset-0 z-[10010] transition-opacity duration-200 ${isModalVisible && !isFadingOut ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-black/20 transition-opacity duration-200" onClick={handleCloseModal} />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className={`w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 text-slate-200 transform transition-all duration-200 ease-out ${isModalVisible && !isFadingOut ? 'scale-100' : 'scale-95'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Change with prompt</div>
              <button
                className="w-6 h-6 text-slate-400 hover:text-slate-200 transition-colors duration-200 hover:scale-110 rounded-md flex items-center justify-center hover:bg-white/10"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-[11px] text-slate-300 mb-1">Instruction for this text</div>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g., Make it more concise and persuasive"
              className="w-full text-sm bg-slate-800/70 border border-slate-700 rounded px-2 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[120px]"
            />
            {/* Preset prompt actions (compact, scrollable row) */}
            <div className="mt-2 -mx-2 px-2 overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-600">
              <div className="flex items-center gap-2 whitespace-nowrap py-1 pr-2">
                {presets.map((p) => (
                  <div key={p.key} className="relative group">
                    <button
                      className={`text-xs px-3 py-1.5 rounded-md transition-colors ${busyIdx === promptIdx ? 'bg-indigo-600/60 text-white cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                      title={p.instruction}
                      disabled={busyIdx === promptIdx}
                      onClick={async (e) => { e.preventDefault(); if (promptIdx !== null) { await handlePresetPromptChange(promptIdx, p.instruction); } }}
                    >
                      {p.label}
                    </button>
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-60 px-3 py-2 text-[11px] text-white bg-accent-700 border border-accent-500/40 rounded-md shadow opacity-0 group-hover:opacity-100 group-hover:-translate-y-[110%] transition-all duration-200 ease-out">
                      {p.instruction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button className="text-xs text-slate-400 hover:text-slate-200 transition-colors" onClick={handleCloseModal}>Cancel</button>
              <button
                className={`text-xs px-3 py-1.5 rounded transition-colors ${busyIdx === promptIdx ? 'bg-indigo-600/60 text-white cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                disabled={busyIdx === promptIdx || !promptText.trim()}
                onClick={async (e) => { e.preventDefault(); const idx = promptIdx; await handlePromptChange(idx!); }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return <>{elements}{renderPromptModal()}</>;
};

interface ArticleDisplayProps {
  article: Article;
  hideTitleAndMeta?: boolean;
  onMutateContent?: (nextContent: string, nextTitle?: string) => void;
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

const NavigationSlider: React.FC = () => {
  const [headings, setHeadings] = useState<Array<{id: string, text: string, top: number, level: number}>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inactivityTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const SCROLLBAR_HEIGHT = 300;

  // Activity management for fade out
  const startInactivityTimer = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    inactivityTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 1000); // 2 seconds
  };

  const resetActivity = () => {
    setIsVisible(true);
    startInactivityTimer();
  };

  // Event handlers for activity
  const handleMouseEnter = () => resetActivity();
  const handleMouseLeave = () => startInactivityTimer();
  const handleScroll = () => resetActivity();

  useEffect(() => {
    // Find all headings and their positions
    const updateHeadings = () => {
      const headingElements = document.querySelectorAll('h2[id], h3[id]');
      const headingPositions = Array.from(headingElements).map(el => {
        const tagName = el.tagName.toLowerCase();
        return {
          id: el.id,
          text: el.textContent || '',
          top: el.getBoundingClientRect().top + window.scrollY,
          level: tagName === 'h2' ? 2 : 3
        };
      });
      setHeadings(headingPositions);
    };

    // Initial update and on resize
    updateHeadings();
    window.addEventListener('resize', updateHeadings);
    return () => window.removeEventListener('resize', updateHeadings);
  }, []);

  // Snap to heading with proper positioning
  const snapToHeading = (index: number) => {
    if (headings[index]) {
      // Position heading at top of viewport with small offset
      const targetTop = Math.max(0, headings[index].top - 60); // 60px offset for header
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
      setCurrentIndex(index);
    }
  };

  // Find closest heading based on current scroll
  const findClosestHeading = () => {
    const scrollTop = window.scrollY;
    if (headings.length === 0) return 0;

    let closestIndex = 0;
    let minDistance = Math.abs(headings[0].top - scrollTop);

    for (let i = 1; i < headings.length; i++) {
      const distance = Math.abs(headings[i].top - scrollTop);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    return closestIndex;
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!isDragging) {
        const closestIndex = findClosestHeading();
        setCurrentIndex(closestIndex);
      }
      resetActivity();
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings, isDragging]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
    }
    return () => {
      if (container) {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    resetActivity();
    setIsDragging(true);
    setDragStartY(e.clientY);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || headings.length === 0) return;

    const deltaY = e.clientY - dragStartY;
    const sensitivity = 0.5; // Adjust sensitivity
    const rawIndex = currentIndex + (deltaY * sensitivity) / 50;
    const newIndex = Math.max(0, Math.min(headings.length - 1, Math.round(rawIndex)));

    if (newIndex !== currentIndex) {
      snapToHeading(newIndex);
      setDragStartY(e.clientY); // Reset drag start to prevent stepping
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Calculate positions for markers and thumb
  const getThumbPosition = () => {
    if (headings.length === 0) return 0;
    const progress = currentIndex / Math.max(1, headings.length - 1);
    return progress * SCROLLBAR_HEIGHT;
  };

  return createPortal(
    <div
      ref={containerRef}
      className="fixed left-5 top-1/2 -translate-y-1/2 z-[9998] flex flex-col items-center transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {/* Vertical line with markers */}
      <div className="relative h-96" style={{ height: `${SCROLLBAR_HEIGHT}px` }}>
        {/* Markers for each heading */}
        {headings.map((heading, index) => {
          const isH2 = heading.level === 2;
          const isActive = index === currentIndex;
          const position = (index / Math.max(1, headings.length - 1)) * SCROLLBAR_HEIGHT;

          return (
            <div
              key={`marker-${index}`}
              className={`absolute w-4 h-0.5 cursor-pointer transition-all duration-200 ${
                isH2 ? 'bg-purple-400' : 'bg-slate-400'
              } ${isActive ? 'bg-purple-500 scale-110' : 'hover:bg-slate-300'}`}
              style={{
                opacity: 0.5,
                height: '5px',
                borderRadius: '20px',
                left: isH2 ? '-8px' : '-4px',
                width: isH2 ? '16px' : '8px',
                top: `${position}px`,
                transform: isActive ? 'scaleY(1.5)' : 'scaleY(1)'
              }}
              onClick={() => snapToHeading(index)}
              title={heading.text}
            />
          );
        })}

        {/* Main vertical line */}
        <div className="absolute left-0 top-0 w-px bg-slate-600 opacity-50" style={{ height: `${SCROLLBAR_HEIGHT}px` }} />

        {/* Current position indicator (purple button) */}
        <div
          className="absolute -right-2 -top-3 w-4 h-4 bg-purple-500 rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-110 active:scale-95 border border-white"
          style={{ top: `${getThumbPosition() - 5}px` }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>,
    document.body
  );
};

export const ArticleDisplay: React.FC<ArticleDisplayProps> = ({
  article,
  onMutateContent,
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

  // Local content override so paragraph edits reflect immediately
  const [contentOverride, setContentOverride] = React.useState<string | null>(null);
  useEffect(() => { setContentOverride(null); }, [article.id]);
  const effectiveContent = contentOverride ?? article.articleContent;

  // Extract headings for TOC
  const headings = ExtractHeadings(effectiveContent);

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
    if (!faqHtml && effectiveContent) {
      const lines = effectiveContent.split('\n');
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

  const wordCount = calculateWordCount(effectiveContent || '');
  const contentToCopy = (effectiveContent || '').replace(
    /\[PRICE_COMPARISON_TABLE\]/g,
    article.priceComparison ? generatePriceTableHtml(article.priceComparison) : ''
  );

  // AI Summary & Insights modal state
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiDefaultTab, setAiDefaultTab] = useState<'summary' | 'insights'>('summary');

  const computedMetrics = useMemo(() => {
    try {
      return calculateSEOMetrics(
        effectiveContent || '',
        article.keywords || [],
        article.primaryKeyword || ''
      );
    } catch {
      return article.seoMetrics;
    }
  }, [effectiveContent, article.keywords, article.primaryKeyword, article.seoMetrics]);

  const headingAnalysis = useMemo(() => {
    try {
      return analyzeHeadingStructure(effectiveContent || '', article.title);
    } catch {
      return null;
    }
  }, [effectiveContent, article.title]);

  const linkAnalysis = useMemo(() => {
    try {
      return analyzeLinkDensity(effectiveContent || '');
    } catch {
      return null;
    }
  }, [effectiveContent]);

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
      {activeTab === 'article' && <NavigationSlider />}
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

        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center pt-1 pb-2 border-b border-slate-700 mb-6">
          <div className="flex items-center gap-2 p-1 bg-white/5 rounded-lg w-full md:w-fit flex-wrap">
            <TabButton tabName="article" label="Article" />
            <TabButton tabName="metadata" label="Metadata" />
            <TabButton tabName="images" label="Images" />
          </div>

          <SEOMetricsBox
            seoMetrics={computedMetrics || article.seoMetrics}
            articleTitle={article.title}
            articleContent={effectiveContent}
            keywords={article.keywords}
            primaryKeyword={article.primaryKeyword}
            onMutateContent={onMutateContent ? (next) => onMutateContent(next.content, next.title) : undefined}
          />
        </div>

        <div key={activeTab} className="animate-fade-in-up" style={{ animationDuration: '0.4s' }}>
          {activeTab === 'article' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-slate-400 bg-white/5 px-3 py-1.5 rounded-md border border-white/10">
                  Word Count: <span className="font-semibold text-slate-200">{wordCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton textToCopy={contentToCopy} label="Copy Content" />
                  <button
                    onClick={() => { setAiDefaultTab('summary'); setShowAISummary(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-300 bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                    aria-label="Summarize"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.95 6.95l-2.12-2.12M7.17 7.17L5.05 5.05m12.02 0l-2.12 2.12M7.17 16.83l-2.12 2.12" />
                    </svg>
                    Summarize
                  </button>
                  <button
                    onClick={() => { setAiDefaultTab('insights'); setShowAISummary(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-300 bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                    aria-label="AI Insights"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18h6m-7-2a7 7 0 1 1 8 0l-.5 1a2 2 0 0 1-1.5 1H10a2 2 0 0 1-1.5-1L8 16z" />
                    </svg>
                    AI Insights
                  </button>
                </div>
              </div>
              <div className="mb-3 text-xs text-slate-400">
                Tip: Hover the text you'd like to change with AI.
              </div>
              <article className="prose prose-invert max-w-none">
                <ArticleContent
                  content={effectiveContent}
                  priceComparison={article.priceComparison}
                  location={article.location}
                  onShowFaqHtml={generateAndToggleFaqHtml}
                  showFaqHtml={showFaqHtml}
                  faqHtml={faqHtml}
                  article={article}
                  onMutateContent={(next: string) => {
                    setContentOverride(next);
                    if (onMutateContent) onMutateContent(next, undefined);
                  }}
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

              {/* Heading Structure Analysis */}
              {headingAnalysis && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                      <BarChartIcon className="h-5 w-5 text-blue-400" />
                      Heading Structure Analysis
                    </h2>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      headingAnalysis.hierarchyScore >= 80 ? 'bg-green-500/20 text-green-300' :
                      headingAnalysis.hierarchyScore >= 60 ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      Score: {headingAnalysis.hierarchyScore}%
                    </div>
                  </div>

                  {/* Heading Counts */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <div className={`text-2xl font-bold ${
                        headingAnalysis.h1 === 1 ? 'text-green-400' :
                        headingAnalysis.h1 === 0 ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {headingAnalysis.h1}
                      </div>
                      <div className="text-xs text-slate-400">H1 Headings</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <div className={`text-2xl font-bold ${
                        headingAnalysis.h2 >= 3 && headingAnalysis.h2 <= 7 ? 'text-green-400' :
                        headingAnalysis.h2 >= 1 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {headingAnalysis.h2}
                      </div>
                      <div className="text-xs text-slate-400">H2 Headings</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <div className={`text-2xl font-bold ${
                        headingAnalysis.h3 >= Math.ceil(headingAnalysis.h2 / 2) ? 'text-green-400' :
                        headingAnalysis.h3 >= headingAnalysis.h2 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {headingAnalysis.h3}
                      </div>
                      <div className="text-xs text-slate-400">H3 Headings</div>
                    </div>
                  </div>

                  {/* Distribution Indicator */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-300">Structure Balance</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        headingAnalysis.idealDistribution ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {headingAnalysis.idealDistribution ? 'Balanced' : 'Adjustable'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          headingAnalysis.idealDistribution ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${Math.min(100, headingAnalysis.hierarchyScore)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {headingAnalysis.suggestions.length > 0 && (
                    <div className="border-t border-slate-700 pt-3">
                      <h3 className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                        <InfoIcon className="h-4 w-4 text-amber-400" />
                        Suggestions
                      </h3>
                      <ul className="space-y-1">
                        {headingAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-xs text-slate-400 flex items-start gap-2">
                            <span className="text-slate-500 mt-1">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Link Density Analysis */}
              {linkAnalysis && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                      <FilesIcon className="h-5 w-5 text-purple-400" />
                      Link Density Analysis
                    </h2>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      linkAnalysis.linkQuality === 'high' ? 'bg-green-500/20 text-green-300' :
                      linkAnalysis.linkQuality === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {linkAnalysis.linkQuality.charAt(0).toUpperCase() + linkAnalysis.linkQuality.slice(1)} Quality
                    </div>
                  </div>

                  {/* Link Counts */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">
                        {linkAnalysis.internalLinks}
                      </div>
                      <div className="text-xs text-slate-400">Internal Links</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {linkAnalysis.internalDensity}% density
                      </div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">
                        {linkAnalysis.externalLinks}
                      </div>
                      <div className="text-xs text-slate-400">External Links</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {linkAnalysis.externalDensity}% density
                      </div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">
                        {linkAnalysis.totalLinks}
                      </div>
                      <div className="text-xs text-slate-400">Total Links</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {(linkAnalysis.totalLinks > 0 ? ((linkAnalysis.internalLinks + linkAnalysis.externalLinks * 2) / linkAnalysis.totalLinks).toFixed(1) : '0.0')} avg quality
                      </div>
                    </div>
                  </div>

                  {/* Quality Indicator */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-300">SEO Link Health</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        linkAnalysis.linkQuality === 'high' ? 'bg-green-500/20 text-green-300' :
                        linkAnalysis.linkQuality === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {linkAnalysis.linkQuality === 'high' ? 'Excellent' :
                         linkAnalysis.linkQuality === 'medium' ? 'Good' : 'Needs Attention'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          linkAnalysis.linkQuality === 'high' ? 'bg-green-500' :
                          linkAnalysis.linkQuality === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: linkAnalysis.linkQuality === 'high' ? '90%' :
                                 linkAnalysis.linkQuality === 'medium' ? '65%' : '40%'
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {linkAnalysis.suggestions.length > 0 && (
                    <div className="border-t border-slate-700 pt-3">
                      <h3 className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                        <TargetIcon className="h-4 w-4 text-blue-400" />
                        Recommendations
                      </h3>
                      <ul className="space-y-1">
                        {linkAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-xs text-slate-400 flex items-end gap-2">
                            <span className="text-slate-500 mt-1">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
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
      <AISummaryModal
        isOpen={showAISummary}
        onClose={() => setShowAISummary(false)}
        defaultTab={aiDefaultTab}
        articleTitle={article.title}
        articleContent={effectiveContent}
        location={article.location}
        keywords={article.keywords}
        primaryKeyword={article.primaryKeyword}
        seoMetrics={computedMetrics || article.seoMetrics}
      />
      <ImageModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
};
