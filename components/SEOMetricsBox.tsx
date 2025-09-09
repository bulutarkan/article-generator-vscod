import React, { useState } from 'react';
import type { SEOMetrics } from '../types';
import {
  getMetricColorClass,
  detectContentCategory,
  getContextualReadabilityMessage,
  type ContentCategory
} from '../services/seoAnalysisService';

interface SEOMetricsBoxProps {
  seoMetrics?: SEOMetrics;
  articleTitle?: string;
  articleContent?: string;
}

export const SEOMetricsBox: React.FC<SEOMetricsBoxProps> = ({
  seoMetrics,
  articleTitle = '',
  articleContent = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showReadabilityTooltip, setShowReadabilityTooltip] = useState(false);

  // Get contextual readability message
  const contentCategory = detectContentCategory(articleTitle, articleContent);
  const contextualMessage = getContextualReadabilityMessage(
    contentCategory,
    seoMetrics?.readabilityScore || 0,
    articleContent?.length || 0
  );

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
          className={`px-2 py-1 rounded-md text-sm font-semibold cursor-help ${getMetricColorClass('readabilityScore', readabilityScore)}`}
          onMouseEnter={() => setShowReadabilityTooltip(true)}
          onMouseLeave={() => setShowReadabilityTooltip(false)}
        >
          {readabilityScore}
        </div>

        {/* Contextual Readability Tooltip */}
        {showReadabilityTooltip && (
          <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-90">
            {/* Backdrop für Complete Coverage */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]" onClick={() => setShowReadabilityTooltip(false)}></div>

            {/* Tooltip Content */}
            <div className="relative bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 max-w-[320px] z-[9999]">
              <div className="text-xs font-semibold text-slate-300 mb-2">Contextual Readability Analysis</div>
              <div className="text-xs text-slate-300 leading-relaxed">
                {contextualMessage}
              </div>

              {/* Triangle pointer */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
                <div className="border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-600 z-[9999]"></div>
              </div>
            </div>
          </div>
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
          className={`px-2 py-1 rounded-md text-sm font-semibold cursor-help ${getMetricColorClass('seoScore', seoScore)}`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {seoScore}
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-[9999]">
            {/* Backdrop for Complete Coverage */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]" onClick={() => setShowTooltip(false)}></div>

            {/* Tooltip Content */}
            <div className="relative bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 min-w-[280px] z-[9999]">
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
              </div>

              {/* Triangle pointer */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
                <div className="border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-600 z-[9999]"></div>
              </div>
            </div>
          </div>
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
