import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SEOMetrics } from '../types';
import { summarizeArticleAndInsights } from '../services/geminiService';

interface InsightItem { id: string; label: string; tip?: string }

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'summary' | 'insights';
  articleTitle: string;
  articleContent: string;
  location?: string;
  keywords?: string[];
  primaryKeyword?: string;
  seoMetrics?: SEOMetrics;
}

export const AISummaryModal: React.FC<AISummaryModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'summary',
  articleTitle,
  articleContent,
  location,
  keywords = [],
  primaryKeyword = '',
  seoMetrics,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'insights'>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullSummary, setFullSummary] = useState('');
  const [typedSummary, setTypedSummary] = useState('');
  const [insights, setInsights] = useState<InsightItem[]>([]);

  useEffect(() => { setActiveTab(defaultTab); }, [defaultTab, isOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Local heuristics disabled per request (no mock/dummy suggestions)
  const localInsights = useMemo<InsightItem[]>(() => {
    return [];
  }, [articleContent, seoMetrics]);

  const run = async () => {
    setLoading(true); setError(null);
    setFullSummary(''); setTypedSummary(''); setInsights([]);
    try {
      const res = await summarizeArticleAndInsights({
        title: articleTitle,
        content: articleContent,
        location,
        keywords,
        primaryKeyword,
      });
      const summary = (res?.summary || '').trim();
      const aiInsights: InsightItem[] = Array.isArray(res?.insights) ? res.insights.map((i: any, idx: number) => ({ id: i.id || `ai-${idx}`, label: i.label || String(i), tip: i.tip })) : [];
      setFullSummary(summary);
      // Use only AI insights (no local heuristics)
      setInsights(aiInsights);
    } catch (e: any) {
      setError(e?.message || 'Failed to get AI response.');
      // No local fallback insights
      setInsights([]);
      // Fallback summary: first 2 sentences
      const s = (articleContent || '').split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
      setFullSummary(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Typewriter effect when fullSummary changes
  useEffect(() => {
    if (!fullSummary) return;
    setTypedSummary('');
    let i = 0; const step = Math.max(1, Math.ceil(fullSummary.length / 600));
    const id = window.setInterval(() => {
      i = Math.min(fullSummary.length, i + step);
      setTypedSummary(fullSummary.slice(0, i));
      if (i >= fullSummary.length) window.clearInterval(id);
    }, 12);
    return () => window.clearInterval(id);
  }, [fullSummary]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 bg-gradient-to-r from-indigo-900/30 to-purple-900/30">
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${activeTab === 'summary' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${activeTab === 'insights' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}
              onClick={() => setActiveTab('insights')}
            >
              AI Insights
            </button>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>

        {/* Body */}
        <div className="p-5">
          {activeTab === 'summary' && (
            <div>
              <div className="mb-3 text-xs text-slate-400">{articleTitle}</div>
              <div className="min-h-[120px] rounded-lg border border-white/10 bg-white/5 p-4">
                {loading ? (
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="text-sm w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    Generating summary…
                  </div>
                ) : (
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {typedSummary}
                  </p>
                )}
              </div>
              {error && <div className="mt-2 text-sm text-red-300">{error}</div>}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(fullSummary || typedSummary)}
                    className="px-3 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10"
                  >
                    Copy Summary
                  </button>
                  <button
                    onClick={run}
                    className="px-3 py-1.5 text-sm rounded-md bg-indigo-500 hover:bg-indigo-600 text-white"
                  >
                    Regenerate
                  </button>
                </div>
                <button onClick={() => setActiveTab('insights')} className="text-sm text-indigo-300 hover:text-indigo-200">
                  View Insights →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div>
              {loading && (
                <div className="flex items-center gap-3 text-slate-300 mb-4">
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                  Preparing insights…
                </div>
              )}

              {insights.length === 0 && !loading && (
                <div className="p-6 text-center bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300">
                  You are all set ✨
                </div>
              )}

              {insights.length > 0 && (
                <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-600/60">
                  {insights.map((s) => (
                    <li key={s.id} className="p-3 rounded-lg border border-white/10 bg-white/5">
                      <div className="text-slate-200 text-sm font-medium">{s.label}</div>
                      {s.tip && <div className="text-xs text-slate-400 mt-1">{s.tip}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
