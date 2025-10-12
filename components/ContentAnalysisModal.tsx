import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { ContentAnalysis } from '../types';

interface ContentAnalysisModalProps {
  analysis: ContentAnalysis;
  topic: string;
  location: string;
  onClose: () => void;
  onProceedToGeneration: () => void;
  isLoading?: boolean;
}

const MetricCard: React.FC<{
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
}> = ({ title, value, subtitle, color = 'blue', icon }) => (
  <div className={`bg-slate-800/50 border border-slate-700 rounded-lg p-4 ${color === 'green' ? 'border-green-500/30' : color === 'red' ? 'border-red-500/30' : 'border-blue-500/30'}`}>
    <div className="flex items-center gap-2 mb-2">
      {icon && <div className="text-slate-400">{icon}</div>}
      <h3 className="text-sm font-medium text-slate-300">{title}</h3>
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
  </div>
);

const ProgressBar: React.FC<{ value: number; label: string; color?: string }> = ({ value, label, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-medium text-white">{value}/100</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

const TrendIndicator: React.FC<{ trend: string }> = ({ trend }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'Rising':
        return <span className="text-green-400">📈</span>;
      case 'Falling':
        return <span className="text-red-400">📉</span>;
      default:
        return <span className="text-slate-400">➡️</span>;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'Rising':
        return 'text-green-400';
      case 'Falling':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className={`flex items-center gap-1 ${getTrendColor()}`}>
      {getTrendIcon()}
      <span className="text-sm font-medium">{trend}</span>
    </div>
  );
};

export const ContentAnalysisModal: React.FC<ContentAnalysisModalProps> = ({
  analysis,
  topic,
  location,
  onClose,
  onProceedToGeneration,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'competitors' | 'suggestions'>('overview');
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [showLoading, setShowLoading] = useState<boolean>(false);

  // Prevent body scroll when mounted + ESC to close
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, []);

  // Handle loading animation
  React.useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
    } else {
      // Delay hiding loading to allow exit animation
      setTimeout(() => setShowLoading(false), 300);
    }
  }, [isLoading]);

  // Handle modal closing animation
  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300); // Match transition duration
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'Low':
        return 'green';
      case 'High':
        return 'red';
      default:
        return 'yellow';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  if (isLoading || showLoading) {
    const loadingNode = (
      <>
        <div className="fixed inset-0 z-[20000] bg-black/40 backdrop-blur-sm" />
        <div className="fixed inset-0 z-[20001] flex items-center justify-center p-4">
          <div
            className={`bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transition-all duration-200 transform ${
              isLoading ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-2'
            }`}
          >
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-base font-semibold text-white mb-2">Analyzing Content Opportunity</h3>
              <p className="text-slate-400 text-sm">Gathering insights for "{topic}" in {location}...</p>
            </div>
          </div>
        </div>
      </>
    );
    return ReactDOM.createPortal(loadingNode, document.body);
  }

  // Don't render if not visible
  if (!isVisible) return null;

  const node = (
    <>
      {/* Full page overlay - blur effect without darkening */}
      <div
        className="fixed inset-0 z-[300] backdrop-blur-sm transition-all duration-500"
        onClick={handleClose}
      />

      {/* Modal container with smooth animations */}
      <div className="fixed inset-0 z-[301] flex items-center justify-center p-4">
        <div
          className={`bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden transition-all duration-500 transform ${
            isAnimating
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-95 opacity-0 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()} // Prevent overlay click when clicking modal
        >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Content Analysis Results</h2>
            <p className="text-slate-400 mt-1">
              Analysis for "{topic}" targeting {location}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'competitors', label: 'Competitors', icon: '🏆' },
            { id: 'suggestions', label: 'Suggestions', icon: '💡' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Search Volume"
                  value={
                    <div className="flex flex-col">
                      <span>{analysis.keywordMetrics.searchVolume.toLocaleString()}</span>
                      <span className="text-xs text-slate-400">(estimated)</span>
                    </div>
                  }
                  subtitle="Monthly searches"
                  icon={<span className="text-lg">🔍</span>}
                />
                <MetricCard
                  title="Competition"
                  value={
                    <div className="flex flex-col">
                      <span>{analysis.keywordMetrics.competition}</span>
                      <span className="text-xs text-slate-400">(estimated)</span>
                    </div>
                  }
                  subtitle="Difficulty level"
                  color={getCompetitionColor(analysis.keywordMetrics.competition)}
                  icon={<span className="text-lg">⚡</span>}
                />
                <MetricCard
                  title="Trend"
                  value={<TrendIndicator trend={analysis.keywordMetrics.trend} />}
                  subtitle="Search direction"
                />
                <MetricCard
                  title="Est. CPC"
                  value={`$${analysis.keywordMetrics.cpc.toFixed(2)}`}
                  subtitle="Cost per click"
                  icon={<span className="text-lg">💰</span>}
                />
              </div>

              {/* SEO Scores */}
              <div className="bg-slate-800/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">SEO Performance Scores</h3>
                <div className="space-y-3">
                  <ProgressBar
                    value={analysis.seoScore.overall}
                    label="Overall SEO Score"
                    color={getScoreColor(analysis.seoScore.overall)}
                  />
                  <ProgressBar
                    value={analysis.seoScore.keywordOptimization}
                    label="Keyword Optimization"
                    color={getScoreColor(analysis.seoScore.keywordOptimization)}
                  />
                  <ProgressBar
                    value={analysis.seoScore.contentQuality}
                    label="Content Quality"
                    color={getScoreColor(analysis.seoScore.contentQuality)}
                  />
                  <ProgressBar
                    value={analysis.seoScore.titleOptimization}
                    label="Title Optimization"
                    color={getScoreColor(analysis.seoScore.titleOptimization)}
                  />
                  <ProgressBar
                    value={analysis.seoScore.technicalSEO}
                    label="Technical SEO"
                    color={getScoreColor(analysis.seoScore.technicalSEO)}
                  />
                </div>
              </div>

              {/* Market Insights */}
              <div className="bg-slate-800/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Market Insights</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">User Intent</h4>
                    <p className="text-white bg-slate-700/50 px-3 py-2 rounded">{analysis.marketInsights.userIntent}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Content Type</h4>
                    <p className="text-white bg-slate-700/50 px-3 py-2 rounded">{analysis.marketInsights.contentType}</p>
                  </div>
                </div>
                {analysis.marketInsights.seasonalTrends.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Seasonal Trends</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.marketInsights.seasonalTrends.map((trend, index) => (
                        <span key={index} className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">
                          {trend}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'competitors' && (
            <div className="space-y-6">
              {/* Average Stats */}
              <div className="bg-slate-800/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Competitor Overview</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <MetricCard
                    title="Avg Word Count"
                    value={analysis.competitorAnalysis.averageWordCount.toLocaleString()}
                    subtitle="Top competing pages"
                  />
                  <MetricCard
                    title="Top Pages"
                    value={analysis.competitorAnalysis.topPages.length}
                    subtitle="Analyzed competitors"
                  />
                </div>
              </div>

              {/* Top Pages (Backlinks removed; DA shown as AI Relevance) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Top Competing Pages</h3>
                {analysis.competitorAnalysis.topPages.map((page, index) => (
                  <div key={index} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(page.domain)}&sz=32`}
                          alt=""
                          className="w-4 h-4 rounded-sm opacity-90"
                          loading="lazy"
                        />
                        <h4 className="text-white font-medium text-sm line-clamp-2">{page.title}</h4>
                      </div>
                      <span className="text-xs bg-blue-500/20 border border-blue-500/30 px-2 py-1 rounded text-blue-300 ml-2">
                        AI Relevance: {Math.round(Number((page as any).daScore || 0))}/100
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{page.domain}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        View Page →
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Common Headings */}
              {analysis.competitorAnalysis.commonHeadings.length > 0 && (
                <div className="bg-slate-800/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Common Heading Patterns</h3>
                  <div className="space-y-2">
                    {analysis.competitorAnalysis.commonHeadings.map((heading, index) => (
                      <div key={index} className="text-slate-300 text-sm bg-slate-700/30 px-3 py-2 rounded">
                        {heading}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="space-y-6">
              {/* Content Recommendations */}
              <div className="bg-slate-800/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Content Recommendations</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <MetricCard
                    title="Recommended Length"
                    value={`${analysis.contentSuggestions.recommendedWordCount.toLocaleString()} words`}
                    subtitle="Optimal article length"
                    icon={<span className="text-lg">📏</span>}
                  />
                  <MetricCard
                    title="Target Keywords"
                    value={analysis.contentSuggestions.targetKeywords.length}
                    subtitle="Keywords to include"
                    icon={<span className="text-lg">🎯</span>}
                  />
                </div>
              </div>

              {/* Suggested Headings */}
              <div className="bg-slate-800/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Suggested Article Structure</h3>
                <div className="space-y-2">
                  {analysis.contentSuggestions.suggestedHeadings.map((heading, index) => (
                    <div key={index} className="flex items-center gap-3 text-slate-300">
                      <span className="text-slate-500 text-sm w-6">{index + 1}.</span>
                      <span className="bg-slate-700/50 px-3 py-2 rounded text-sm flex-1">{heading}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Gaps */}
              {analysis.contentSuggestions.contentGaps.length > 0 && (
                <div className="bg-slate-800/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Content Gaps to Address</h3>
                  <div className="space-y-3">
                    {analysis.contentSuggestions.contentGaps.map((gap, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-yellow-400 text-lg mt-0.5">⚠️</span>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex-1">
                          <p className="text-slate-300 text-sm">{gap}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Keywords */}
              <div className="bg-slate-800/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recommended Keywords</h3>
                  <button
                    onClick={() => {
                      const kw = Array.from(new Set(analysis.contentSuggestions.targetKeywords.map(k => k.trim()).filter(Boolean)));
                      const event = new CustomEvent('addSuggestedKeywords', { detail: { source: 'contentAnalysis', keywords: kw } });
                      window.dispatchEvent(event);
                    }}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md"
                  >
                    Add All Keywords
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.contentSuggestions.targetKeywords.map((keyword, index) => (
                    <span key={index} className="bg-blue-500/20 text-blue-300 text-sm px-3 py-1 rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={onProceedToGeneration}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Proceed to Generation
          </button>
        </div>
      </div>
    </div>
    </>
  );

  // Render into body to avoid parent stacking/overflow issues
  return ReactDOM.createPortal(node, document.body);
};
