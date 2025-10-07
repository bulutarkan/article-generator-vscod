import React, { useState, useEffect, useRef } from 'react';
import type { Article, PriceComparisonItem } from '../types';
import { ArticleDisplay } from './ArticleDisplay';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ShareIcon } from './icons/ShareIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { TwitterIcon } from './icons/TwitterIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { CopyIcon } from './icons/CopyIcon';
import { SendIcon } from './icons/SendIcon';
import { PublishModal } from './PublishModal';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { ArticlePageTitle } from './PageTitle';
import { SEO } from './SEO';
import { webCrawlerService } from '../services/webCrawlerService';

interface ArticleDetailProps {
  article: Article;
  onUpdateArticle: (id: string, updates: { title: string; articleContent: string; }) => void;
  onDeleteArticle: (id: string) => void;
  onBackToDashboard: () => void;
}

const ActionDropdown: React.FC<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  buttonContent: React.ReactNode;
  children: React.ReactNode;
}> = ({ isOpen, setIsOpen, buttonContent, children }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-300 bg-white/10 hover:bg-white/20 transition-colors"
      >
        {buttonContent}
        <svg className={`-mr-1 h-5 w-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      <div
        className={`absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-700 transition-all duration-200 ease-in-out ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="py-1" role="menu" aria-orientation="vertical">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onUpdateArticle, onDeleteArticle, onBackToDashboard }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(article.title);
  const [editedContent, setEditedContent] = useState(article.articleContent);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [saveToast, setSaveToast] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const contentEditorRef = useRef<HTMLTextAreaElement>(null);

  // Internal links UI state
  const [websiteUrlForLinks, setWebsiteUrlForLinks] = useState<string>(() => localStorage.getItem('internalLinksWebsiteUrl') || '');
  const [isFetchingLinks, setIsFetchingLinks] = useState<boolean>(false);
  const [linkSuggestions, setLinkSuggestions] = useState<Array<{ url: string; title: string }>>([]);
  const [showLinkPanel, setShowLinkPanel] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditedTitle(article.title);
      setEditedContent(article.articleContent);
    }
  }, [article, isEditing]);

  const hasChanges = () =>
    editedTitle.trim() !== article.title.trim() ||
    editedContent.trim() !== article.articleContent.trim();

  const handleSave = async () => {
    if (!hasChanges()) return;
    try {
      setIsSaving(true);
      await Promise.resolve(
        onUpdateArticle(article.id, {
          title: editedTitle.trim(),
          articleContent: editedContent.trim(),
        }) as any
      );
      setIsEditing(false);
      setSaveToast('Changes saved');
      setTimeout(() => setSaveToast(''), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedTitle(article.title);
    setEditedContent(article.articleContent);
    setIsEditing(false);
  };

  const handleFetchInternalLinks = async () => {
    if (!websiteUrlForLinks.trim()) {
      setLinkError('Please enter your website URL.');
      setShowLinkPanel(true);
      return;
    }
    setLinkError(null);
    setIsFetchingLinks(true);
    try {
      localStorage.setItem('internalLinksWebsiteUrl', websiteUrlForLinks.trim());
      const suggestions = await webCrawlerService.getInternalLinkSuggestions(websiteUrlForLinks.trim(), article.topic || editedTitle || '');
      setLinkSuggestions(suggestions);
      setShowLinkPanel(true);
    } catch (e: any) {
      console.error('Failed to fetch internal links:', e);
      setLinkError(e?.message || 'Failed to fetch internal links.');
      setShowLinkPanel(true);
    } finally {
      setIsFetchingLinks(false);
    }
  };

  const insertLinkAtCursor = (link: { url: string; title: string }) => {
    const textarea = contentEditorRef.current;
    const content = editedContent || '';
    if (!textarea) {
      const anchor = `<a href="${link.url}">${link.title}</a>`;
      setEditedContent(content + (content.endsWith('\n') ? '' : '\n') + anchor);
      return;
    }

    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const selectedText = start !== end ? content.slice(start, end) : '';
    const anchorText = (selectedText && selectedText.trim().length > 0) ? selectedText : link.title;
    const anchor = `<a href="${link.url}">${anchorText}</a>`;

    const before = content.slice(0, start);
    const after = content.slice(end);
    const next = `${before}${anchor}${after}`;
    setEditedContent(next);

    // Restore caret after inserted anchor
    requestAnimationFrame(() => {
      if (contentEditorRef.current) {
        const pos = start + anchor.length;
        contentEditorRef.current.focus();
        contentEditorRef.current.selectionStart = pos;
        contentEditorRef.current.selectionEnd = pos;
      }
    });
  };

  const notifyCopy = (type: string) => {
    setCopySuccess(type);
    setTimeout(() => setCopySuccess(''), 2000);
  };
  
  const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

  const generatePriceTableHtml = (data: PriceComparisonItem[], location: string): string => {
    if (!data || data.length === 0) return '';
    const header = `<thead><tr><th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f7fafc;">Service</th><th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f7fafc;">Typical Price (Turkey)</th><th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f7fafc;">Typical Price (${location})</th></tr></thead>`;
    const body = data.map(item => `<tr><td style="border: 1px solid #ddd; padding: 12px;">${item.service}</td><td style="border: 1px solid #ddd; padding: 12px;">${item.turkeyPrice}</td><td style="border: 1px solid #ddd; padding: 12px;">${item.locationPrice}</td></tr>`).join('');
    return `<table style="width: 100%; border-collapse: collapse; font-family: sans-serif; margin-top: 1.5em; margin-bottom: 1.5em;">${header}<tbody>${body}</tbody></table>`;
  };
  
  const generatePriceTableMarkdown = (data: PriceComparisonItem[], location: string): string => {
    if (!data || data.length === 0) return '';
    const header = `| Service | Typical Price (Turkey) | Typical Price (${location}) |\n|---|---|---|`;
    const body = data.map(item => `| ${item.service} | ${item.turkeyPrice} | ${item.locationPrice} |`).join('\n');
    return `${header}\n${body}`;
  };

  const handleExport = (format: 'html' | 'md' | 'txt' | 'docx') => {
    setIsExportOpen(false);
    let fileContent = '';
    let mimeType = 'text/plain';
    let fileExtension = 'txt';

    const priceTableMd = generatePriceTableMarkdown(article.priceComparison || [], article.location);
    const contentWithMdTable = article.articleContent.replace('[PRICE_COMPARISON_TABLE]', priceTableMd);
    
    switch (format) {
      case 'html':
        const priceTableHtml = generatePriceTableHtml(article.priceComparison || [], article.location);
        const contentWithHtmlTable = article.articleContent.replace(/\[PRICE_COMPARISON_TABLE\]/g, priceTableHtml);
        const html = contentWithHtmlTable
            .replace(/^#+\s*(.*)/gm, (match, p1) => {
                const level = match.match(/^#+/)?.[0].length || 1;
                return `<h${level}>${p1.trim()}</h${level}>`;
            })
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br />');
        navigator.clipboard.writeText(html).then(() => notifyCopy('HTML'));
        return;

      case 'md':
        fileContent = `# ${article.title}\n\n${contentWithMdTable}`;
        mimeType = 'text/markdown';
        fileExtension = 'md';
        break;

      case 'txt':
        fileContent = `${article.title}\n\n${contentWithMdTable.replace(/(\*\*|## |### |#### |##### |\* )/g, '')}`;
        break;

      case 'docx':
        handleExportDocx();
        return;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${slugify(article.title)}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDocx = async () => {
    const titleParagraph = new Paragraph({
      children: [new TextRun({ text: article.title, bold: true, size: 32 })],
      spacing: { after: 400 },
    });

    const paragraphs: Paragraph[] = [titleParagraph];

    // Price comparison table'ı markdown formatına çevir
    const priceTableMd = generatePriceTableMarkdown(article.priceComparison || [], article.location);
    const contentWithMdTable = article.articleContent.replace('[PRICE_COMPARISON_TABLE]', priceTableMd);

    const lines = contentWithMdTable.split('\n');

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine === '') {
        paragraphs.push(new Paragraph({}));
        return;
      }

      // Başlık tespit
      if (trimmedLine.startsWith('## ')) {
        const level = 2; // Sadece H2 desteği
        const titleText = trimmedLine.substring(3).trim();
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: titleText, bold: true, size: 26 })],
            spacing: { after: 200 },
          })
        );
        return;
      }

      // Normal paragraflar için bold işaretleme
      const textRuns: TextRun[] = [];
      const parts = trimmedLine.split(/(\*\*.*?\*\*)/g);

      parts.forEach(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
          textRuns.push(new TextRun({ text: part.slice(2, -2), bold: true }));
        } else if (part.length > 0) {
          textRuns.push(new TextRun({ text: part }));
        }
      });

      if (textRuns.length > 0) {
        paragraphs.push(new Paragraph({ children: textRuns }));
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slugify(article.title)}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };
  
  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    setIsShareOpen(false);
    const shareText = `Check out this article I generated: "${article.title}"\n\n${article.metaDescription}`;
    const encodedText = encodeURIComponent(shareText);
    const placeholderUrl = 'https://ai.google.dev/edge';
    
    switch(platform) {
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
            break;
        case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${placeholderUrl}&quote=${encodedText}`, '_blank');
            break;
        case 'linkedin':
             navigator.clipboard.writeText(shareText).then(() => notifyCopy('Share Text'));
            break;
    }
  };

  const previewArticle = { ...article, title: editedTitle, articleContent: editedContent };

  return (
    <div className="animate-fade-in-up max-w-7xl mx-auto flex flex-col h-full">
      <SEO
        title={article.title}
        description={article.metaDescription || article.excerpt || article.title}
        path={`/app/articles/${article.id}`}
        type="article"
        keywords={article.keywords}
        publishedTime={article.createdAt}
        modifiedTime={article.created_at || article.createdAt}
      />
      <ArticlePageTitle articleTitle={article.title} />
      <div className="flex-shrink-0">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isEditing}
          >
            <span aria-hidden="true">&larr;</span>
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-300 bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
                  aria-label="Cancel editing"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges() || isSaving}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-white transition-colors shadow ${
                    !hasChanges() || isSaving
                      ? 'bg-green-600/50 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-500'
                  }`}
                  aria-label="Save changes"
                >
                  {isSaving ? (
                    <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>Saving…</span>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <ActionDropdown isOpen={isShareOpen} setIsOpen={setIsShareOpen} buttonContent={<><ShareIcon className="h-4 w-4" /> Share</>}>
                  <a onClick={() => handleShare('twitter')} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-indigo-500/30 cursor-pointer" role="menuitem">
                      <TwitterIcon className="h-5 w-5"/><span>Share on X</span>
                  </a>
                  <a onClick={() => handleShare('facebook')} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-indigo-500/30 cursor-pointer" role="menuitem">
                      <FacebookIcon className="h-5 w-5"/><span>Share on Facebook</span>
                  </a>
                  <a onClick={() => handleShare('linkedin')} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-indigo-500/30 cursor-pointer" role="menuitem">
                      <LinkedInIcon className="h-5 w-5"/><span>Copy for LinkedIn</span>
                  </a>
                </ActionDropdown>
                <ActionDropdown isOpen={isExportOpen} setIsOpen={setIsExportOpen} buttonContent={<><DownloadIcon className="h-4 w-4" /> Export</>}>
                  <a onClick={() => handleExport('html')} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-indigo-500/30 cursor-pointer" role="menuitem">
                      <CopyIcon className="h-5 w-5"/><span>Copy as HTML</span>
                  </a>
                  <a onClick={() => handleExport('md')} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-indigo-500/30 cursor-pointer" role="menuitem">
                      <DownloadIcon className="h-5 w-5"/><span>Download as .md</span>
                  </a>
                  <a onClick={() => handleExport('txt')} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-indigo-500/30 cursor-pointer" role="menuitem">
                      <DownloadIcon className="h-5 w-5"/><span>Download as .txt</span>
                  </a>
                  <a onClick={() => handleExport('docx')} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-indigo-500/30 cursor-pointer" role="menuitem">
                      <DownloadIcon className="h-5 w-5"/><span>Download as .docx</span>
                  </a>
                </ActionDropdown>
                <button
                  onClick={() => setIsPublishModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                  aria-label="Publish article"
                >
                  <SendIcon className="h-4 w-4" />
                  Publish
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                  aria-label="Edit article"
                >
                  <EditIcon className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDeleteArticle(article.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  aria-label="Delete article"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {(copySuccess || saveToast) && (
        <div className="fixed bottom-5 right-5 bg-slate-900/90 backdrop-blur text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-up z-50 border border-white/10">
          {copySuccess ? `Copied ${copySuccess} to clipboard!` : saveToast}
        </div>
      )}

      <PublishModal 
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        article={article}
      />

      <div className="flex-1 overflow-y-auto min-h-0 pr-4 -mr-4">
        {isEditing ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor Column */}
            <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/40 p-6 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10 space-y-6">
              <div>
                <label htmlFor="title-editor" className="block text-sm font-medium text-slate-300 mb-2">
                  Article Title
                </label>
                <input
                  id="title-editor"
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Enter a compelling title…"
                  className="block w-full rounded-lg border-0 bg-white/5 py-3 px-4 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-lg sm:leading-6 transition-all shadow-inner"
                  aria-label="Article title editor"
                />
              </div>
              <div>
                <label htmlFor="content-editor" className="block text-sm font-medium text-slate-300 mb-2">
                  Article Content (Markdown)
                </label>
                {/* Internal Links helper */}
                <div className="mb-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://your-site.com"
                      value={websiteUrlForLinks}
                      onChange={(e) => setWebsiteUrlForLinks(e.target.value)}
                      className="flex-1 rounded-md border-0 bg-white/5 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-sm shadow-inner"
                      aria-label="Website URL for internal links"
                    />
                    <button
                      type="button"
                      onClick={handleFetchInternalLinks}
                      disabled={isFetchingLinks}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm text-indigo-300 transition-colors border border-white/10 ${isFetchingLinks ? 'bg-indigo-500/20 cursor-not-allowed' : 'bg-indigo-500/10 hover:bg-indigo-500/20'}`}
                    >
                      {isFetchingLinks ? (
                        <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300/30 border-t-indigo-300"></span>Fetching…</span>
                      ) : (
                        'Insert Internal Links'
                      )}
                    </button>
                  </div>
                  {(showLinkPanel || linkError) && (
                    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                      {linkError && (
                        <div className="mb-2 text-xs text-red-300">{linkError}</div>
                      )}
                      {!linkError && linkSuggestions.length === 0 && (
                        <div className="text-xs text-slate-400">No relevant internal links found yet. Try another topic or ensure the URL is correct.</div>
                      )}
                      {linkSuggestions.length > 0 && (
                        <div className="max-h-56 overflow-y-auto divide-y divide-slate-800">
                          {linkSuggestions.map((l, idx) => (
                            <div key={`${l.url}-${idx}`} className="py-2 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm text-slate-200 truncate">{l.title}</div>
                                <div className="text-xs text-slate-400 truncate">{l.url}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => insertLinkAtCursor(l)}
                                className="shrink-0 px-3 py-1.5 rounded-md text-xs text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-white/10"
                              >
                                Insert
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 text-right">
                        <button type="button" onClick={() => setShowLinkPanel(false)} className="text-xs text-slate-400 hover:text-slate-200">Close</button>
                      </div>
                    </div>
                  )}
                </div>
                <textarea
                  id="content-editor"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  ref={contentEditorRef}
                  className="block w-full rounded-lg border-0 bg-slate-950/60 py-4 px-4 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all min-h-[70vh] font-mono shadow-inner resize-y"
                  aria-label="Article content editor"
                  spellCheck="false"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{editedContent.trim().split(/\s+/).filter(Boolean).length} words</span>
                  <span className={`${hasChanges() ? 'text-amber-300' : 'text-slate-500'}`}>{hasChanges() ? 'Unsaved changes' : 'All changes saved'}</span>
                </div>
              </div>
            </div>
            {/* Preview Column */}
            <div className="relative h-full">
              <div className="sticky top-0">
                <div className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 text-center">Live Preview</div>
                <div className="max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900/40">
                  <ArticleDisplay 
                    article={previewArticle}
                    onMutateContent={(nextContent, nextTitle) => {
                      if (typeof nextContent === 'string') setEditedContent(nextContent);
                      if (typeof nextTitle === 'string') setEditedTitle(nextTitle);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ArticleDisplay 
            article={article}
          />
        )}
      </div>
    </div>
  );
};
