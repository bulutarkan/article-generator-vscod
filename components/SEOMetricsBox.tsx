import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SEOMetrics } from '../types';
import {
  getMetricColorClass,
  detectContentCategory,
  getContextualReadabilityMessage,
  type ContentCategory,
  generateActionableSuggestions,
  applySuggestionFix,
} from '../services/seoAnalysisService';

interface SEOMetricsBoxProps {
  seoMetrics?: SEOMetrics;
  articleTitle?: string;
  articleContent?: string;
  keywords?: string[];
  primaryKeyword?: string;
  onMutateContent?: (next: { content: string; title?: string }) => void;
}

export const SEOMetricsBox: React.FC<SEOMetricsBoxProps> = ({
  seoMetrics,
  articleTitle = '',
  articleContent = '',
  keywords = [],
  primaryKeyword = '',
  onMutateContent,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showReadabilityTooltip, setShowReadabilityTooltip] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get contextual readability message
  const contentCategory = detectContentCategory(articleTitle, articleContent);
  const contextualMessage = getContextualReadabilityMessage(
    contentCategory,
    seoMetrics?.readabilityScore || 0,
    articleContent?.length || 0
  );

  const suggestions = useMemo(() => (
    generateActionableSuggestions(articleTitle, articleContent, keywords, primaryKeyword)
  ), [articleTitle, articleContent, keywords, primaryKeyword]);

  if (!seoMetrics) {
    return (
      <div className="inline-flex items-center gap-4 ml-6 p-4 bg-gray-100/80 backdrop-blur-xl border border-gray-200 rounded-lg shadow-lg animate-fade-in-up">
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium mb-1">SEO Analysis</div>
          <div className="text-sm text-gray-500">Not Available</div>
          <div className="text-xs text-gray-400 mt-1">Generate new articles to see metrics</div>
        </div>
      </div>
    );
  }

  const { readabilityScore, keywordDensity, seoScore, subMetrics } = seoMetrics;

  return (
    <div className="shadow-lg backdrop-blur-xl border border-white/10 rounded-lg w-max inline-flex items-center gap-2 p-2 shadow-lg animate-fade-in-up">
      {/* Readability Score */}
      <div className="text-center relative">
        <div className="text-xs text-slate-400 font-medium mb-1">Readability</div>
        <div
          className={`px-2 py-1 rounded-md text-sm font-semibold cursor-pointer ${getMetricColorClass('readabilityScore', readabilityScore)}`}
          onClick={() => setShowReadabilityTooltip(true)}
        >
          {readabilityScore}
        </div>

        {/* Contextual Readability Tooltip */}
        {showReadabilityTooltip && (
          createPortal(
            <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-16">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowReadabilityTooltip(false)} />
              <div className="relative bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 max-w-[360px] mx-4 z-[10001]">
                <div className="text-xs font-semibold text-slate-300 mb-2">Readability Insights</div>
                <div className="text-xs text-slate-300 leading-relaxed">{contextualMessage}</div>
                <div className="mt-3 text-right">
                  <button className="text-xs text-slate-300 bg-white/10 hover:bg-white/20 border border-white/10 px-2 py-1 rounded" onClick={() => setShowReadabilityTooltip(false)}>Close</button>
                </div>
              </div>
            </div>,
            document.body
          )
        )}
      </div>

      {/* Separator */}
      <div className="w-px h-8 bg-slate-500/30"></div>

      {/* Keyword Density */}
      <div className="text-center">
        <div className="text-xs text-slate-400 font-medium mb-1">Keyword D.</div>
        <div className={`px-2 py-1 rounded-md text-sm font-semibold ${getMetricColorClass('keywordDensity', keywordDensity)}`}>
          {keywordDensity}%
        </div>
      </div>

      {/* Separator */}
      <div className="w-px h-8 bg-slate-500/30"></div>

      {/* SEO Score with Tooltip */}
      <div className="text-center relative">
        <div className="text-xs text-slate-400 font-medium mb-1">SEO Score</div>
        <div
          className={`px-2 py-1 rounded-md text-sm font-semibold cursor-pointer ${getMetricColorClass('seoScore', seoScore)}`}
          onClick={() => setShowTooltip(true)}
        >
          {seoScore}
        </div>

        {/* Tooltip */}
        {showTooltip && (
          createPortal(
            <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-16">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowTooltip(false)} />
              <div className="relative bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 min-w-[300px] mx-4 z-[10001]">
                <div className="text-xs font-semibold text-slate-300 mb-3">SEO Score Breakdown</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Content Quality</span>
                    <span className="text-xs font-medium text-slate-300">{subMetrics.contentQuality}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Target Keywords</span>
                    <span className="text-xs font-medium text-slate-300">{subMetrics.targetKeywords}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Technical SEO</span>
                    <span className="text-xs font-medium text-slate-300">{subMetrics.technicalSeo}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Engagement</span>
                    <span className="text-xs font-medium text-slate-300">{subMetrics.engagement}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Structure</span>
                    <span className="text-xs font-medium text-slate-300">{subMetrics.structure}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Originality</span>
                    <span className="text-xs font-medium text-slate-300">{subMetrics.originality}%</span>
                  </div>
                  <div className="mt-3 text-right">
                    <button className="text-xs text-slate-300 bg-white/10 hover:bg-white/20 border border-white/10 px-2 py-1 rounded" onClick={() => setShowTooltip(false)}>Close</button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        )}
      </div>

      {/* Separator */}
      <div className="w-px h-8 bg-slate-500/30"></div>

      {/* Suggestions trigger */}
      <div className="text-center relative">
        <div className="text-xs text-slate-400 font-medium mb-1">Checklist</div>
        <button
          className={`px-2 py-1 rounded-md text-sm font-semibold ${suggestions.length > 0 ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'}`}
          onClick={() => setShowSuggestions(true)}
        >
          {suggestions.length > 0 ? `${suggestions.length} suggestions` : 'No issues'}
        </button>

        {showSuggestions && (
          createPortal(
            <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-16">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSuggestions(false)} />
              <div className="relative bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 w-[360px] max-w-[90vw] mx-4 z-[10001]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-slate-300">Live SEO Checklist</div>
                  <button className="text-xs text-slate-400 hover:text-slate-200" onClick={() => setShowSuggestions(false)}>Close</button>
                </div>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {suggestions.length === 0 && (
                    <div className="text-xs text-emerald-300">Great! No major issues found.</div>
                  )}
                  {suggestions.map((s) => (
                    <div key={s.id} className="rounded-md border border-white/10 bg-white/5 p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-medium text-slate-200">{s.label}</div>
                          <div className="text-[11px] text-slate-400">{s.message}</div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.severity === 'high' ? 'bg-red-500/20 text-red-300' : s.severity === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'}`}>{s.severity}</span>
                          <button
                            disabled={!s.canFix || !onMutateContent}
                            className={`text-[11px] px-2 py-1 rounded border ${(!s.canFix || !onMutateContent) ? 'opacity-50 cursor-not-allowed border-white/10 text-slate-400' : 'border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10'}`}
                            onClick={() => {
                              if (!onMutateContent) return;
                              const next = applySuggestionFix(articleContent, articleTitle, s, primaryKeyword);
                              onMutateContent(next);
                              setShowSuggestions(false);
                            }}
                          >
                            Fix
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          )
        )}
      </div>
    </div>
  );
};

// Metric Legend Component (optional, for future use)
export const SEOMetricsLegend: React.FC = () => {
  return (
    <div className="mt-4 p-4 bg-white/5 rounded-lg">
      <div className="text-sm font-semibold text-slate-300 mb-3">SEO Metrics Guide</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <div className="font-medium text-slate-400 mb-2">Readability Score</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100"></div>
              <span className="text-slate-500">Less than 30: Poor readability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-100"></div>
              <span className="text-slate-500">30-60: Good readability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100"></div>
              <span className="text-slate-500">More than 60: Excellent readability</span>
            </div>
          </div>
        </div>
        <div>
          <div className="font-medium text-slate-400 mb-2">Keyword Density</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100"></div>
              <span className="text-slate-500">Less than 0.5% or more than 4%: Poor density</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-100"></div>
              <span className="text-slate-500">0.5-3%: Good density</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100"></div>
              <span className="text-slate-500">3-4%: Ideal density</span>
            </div>
          </div>
        </div>
        <div>
          <div className="font-medium text-slate-400 mb-2">Overall SEO Score</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100"></div>
              <span className="text-slate-500">Less than 50: Needs improvement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-100"></div>
              <span className="text-slate-500">50-70: Good</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100"></div>
              <span className="text-slate-500">More than 70: Excellent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
