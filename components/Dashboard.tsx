import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Article } from '../types';
import { ArticleCard } from './ArticleCard';
import { FilesIcon } from './icons/FilesIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { BarChartIcon } from './icons/BarChartIcon';
import { HashIcon } from './icons/HashIcon';
import { SearchIcon } from './icons/SearchIcon';
import { SlidersIcon } from './icons/SlidersIcon';
import { GeoIcon } from './icons/GeoIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { AppPageTitle } from './PageTitle';
import { ArticleCardSkeleton } from './ArticleCardSkeleton';
import DashboardSkeleton from './DashboardSkeleton';
 
// import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface DashboardProps {
  articles: Article[];
  isLoading: boolean;
  onDeleteArticle: (id: string) => void;
  onViewArticle: (id: string) => void;
  onNavigate: (page: 'generator' | 'calendar' | 'statistics') => void;
}



const PaginationButtons: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mt-6 mb-6">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 ${currentPage === 1
          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
          }`}
      >
        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Numbers */}
      {getVisiblePages().map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-2 py-2 text-slate-500 text-xs sm:text-sm">...</span>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-w-[2rem] ${currentPage === page
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                }`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 ${currentPage === totalPages
          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
          }`}
      >
        <span className="hidden sm:inline">Next</span>
        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ articles, isLoading, onDeleteArticle, onViewArticle, onNavigate }) => {
  const prefersReducedMotion = useReducedMotion();
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterTone, setFilterTone] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDateRange, setFilterDateRange] = useState<'all' | '7d' | '30d'>('all');
  const [difficultyRange, setDifficultyRange] = useState<'all' | 'low' | 'high'>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const USE_INFINITE_SCROLL = false;

  // Filtered articles based on search and filters
  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Search filter - search in title, topic, and content
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.articleContent.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Keyword filter
    if (filterKeyword) {
      filtered = filtered.filter(article =>
        article.primaryKeyword?.toLowerCase().includes(filterKeyword.toLowerCase()) ||
        article.keywords?.some(keyword => keyword.toLowerCase().includes(filterKeyword.toLowerCase()))
      );
    }

    // Tone filter
    if (filterTone) {
      filtered = filtered.filter(article => article.tone === filterTone);
    }

    // Location filter
    if (filterLocation) {
      filtered = filtered.filter(article =>
        article.location.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    // Date range filter
    if (filterDateRange !== 'all') {
      const now = new Date();
      const threshold = new Date(now);
      threshold.setDate(now.getDate() - (filterDateRange === '7d' ? 7 : 30));
      filtered = filtered.filter(article => new Date(article.createdAt) >= threshold);
    }

    // Difficulty range filter
    if (difficultyRange !== 'all') {
      filtered = filtered.filter(article => {
        const kd = article.keywordDifficulty || 0;
        return difficultyRange === 'high' ? kd >= 60 : kd <= 30;
      });
    }

    return filtered;
  }, [articles, searchTerm, filterKeyword, filterTone, filterLocation, filterDateRange, difficultyRange]);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterKeyword, filterTone, filterLocation, filterDateRange, difficultyRange]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageArticles = filteredArticles.slice(startIndex, endIndex);

  // Get unique values for filter dropdowns
  const uniqueTones = useMemo(() => {
    const tones = new Set(articles.map(a => a.tone).filter(Boolean));
    return Array.from(tones);
  }, [articles]);

  const uniqueLocations = useMemo(() => {
    const locations = new Set(articles.map(a => a.location).filter(Boolean));
    return Array.from(locations);
  }, [articles]);

  const stats = useMemo(() => {
    if (articles.length === 0) {
      return null;
    }

    const totalWords = articles.reduce((sum, article) => {
      if (!article.articleContent || article.articleContent.trim() === '') {
        return sum;
      }
      return sum + article.articleContent.trim().split(/\s+/).length;
    }, 0);

    const totalDifficulty = articles.reduce((sum, article) => sum + (article.keywordDifficulty || 0), 0);
    const avgDifficulty = articles.length > 0 ? (totalDifficulty / articles.length).toFixed(1) : '0';

    const uniqueKeywords = new Set(articles.map(a => a.primaryKeyword)).size;

    return {
      totalArticles: articles.length,
      totalWords: totalWords.toLocaleString(),
      avgDifficulty,
      uniqueKeywords
    };
  }, [articles]);

  if (isLoading) {
    return (
      <div>
        <AppPageTitle pageName="Dashboard" />
        <DashboardSkeleton cardCount={6} />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <motion.div
        className="text-center py-16 text-neutral-500"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="p-8 bg-neutral-800/50 rounded-2xl border border-neutral-700/50 inline-block mb-6"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <FilesIcon className="h-16 w-16 mx-auto mb-4 text-neutral-600" />
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-4 font-heading">Dashboard is Empty</h2>
        <p className="text-lg text-neutral-400 mb-8 font-body max-w-md mx-auto">You haven't generated any articles yet. Start creating content with AI-powered assistance!</p>
        <motion.button
          onClick={() => onNavigate('generator')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-accent-500 px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 font-body"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Generate Your First Article
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div>
      <AppPageTitle pageName="Dashboard" />
      {/* Decorative gradient backdrop */}
      <div className="relative mb-4">
        <div className="pointer-events-none absolute -top-10 left-0 h-40 w-40 rounded-full bg-primary-500/30 gradient-blob" />
        <div className="pointer-events-none absolute -top-6 right-0 h-40 w-40 rounded-full bg-accent-500/30 gradient-blob" />

        {/* Primary controls */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className="text-sm flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors focus-visible:ring-2 focus-visible:ring-accent-500/30"
            aria-haspopup="dialog"
            aria-expanded={isFilterPanelOpen}
            aria-controls="filter-panel"
          >
            <SlidersIcon className="h-5 w-5" />
            <span>Filters</span>
          </button>
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              aria-label="Search articles"
            />
          </div>
          <button
            onClick={() => onNavigate('statistics')}
            className="text-sm flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            <BarChartIcon className="h-5 w-5" />
            <span>Statistics</span>
          </button>
          <button
            onClick={() => onNavigate('calendar')}
            className="text-sm flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            <CalendarIcon className="h-5 w-5" />
            <span>Calendar</span>
          </button>
        </div>
      </div>

      {/* Top Stats - prominent */}
      {stats && (
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-3 mb-2"
        >
          <div className="glass p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success-500/15 border border-success-500/30">
                <FilesIcon className="h-5 w-5 text-success-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Total Articles</div>
                <div className="text-sm font-semibold text-white">{stats.totalArticles}</div>
              </div>
            </div>
          </div>
          <div className="glass p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30">
                <FileTextIcon className="h-5 w-5 text-indigo-300" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Total Words</div>
                <div className="text-sm font-semibold text-white">{stats.totalWords}</div>
              </div>
            </div>
          </div>
          <div className="glass p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning-500/15 border border-warning-500/30">
                <BarChartIcon className="h-5 w-5 text-warning-300" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Avg. KW Difficulty</div>
                <div className="text-sm font-semibold text-white">{stats.avgDifficulty}</div>
              </div>
            </div>
          </div>
          <div className="glass p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent-500/15 border border-accent-500/30">
                <HashIcon className="h-5 w-5 text-accent-300" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Unique Keywords</div>
                <div className="text-sm font-semibold text-white">{stats.uniqueKeywords}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick filter chips */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${filterDateRange === '7d' ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}
          onClick={() => setFilterDateRange(filterDateRange === '7d' ? 'all' : '7d')}
        >
          Last 7 days
        </button>
        <button
          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${filterDateRange === '30d' ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}
          onClick={() => setFilterDateRange(filterDateRange === '30d' ? 'all' : '30d')}
        >
          Last 30 days
        </button>
        <button
          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${difficultyRange === 'low' ? 'bg-success-500/20 text-success-200 border-success-400/30' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}
          onClick={() => setDifficultyRange(difficultyRange === 'low' ? 'all' : 'low')}
        >
          Low difficulty
        </button>
        <button
          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${difficultyRange === 'high' ? 'bg-warning-500/20 text-warning-200 border-warning-400/30' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}
          onClick={() => setDifficultyRange(difficultyRange === 'high' ? 'all' : 'high')}
        >
          High difficulty
        </button>
        {uniqueTones.slice(0, 4).map((tone) => (
          <button
            key={tone}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${filterTone === tone ? 'bg-purple-500/20 text-purple-200 border-purple-400/30' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}
            onClick={() => setFilterTone(filterTone === tone ? '' : tone)}
          >
            Tone: {tone}
          </button>
        ))}
      </div>

      {/* Active Filters and Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-1 mb-2">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {(searchTerm || filterKeyword || filterTone || filterLocation || filterDateRange !== 'all' || difficultyRange !== 'all') && (
            <>
              <span className="text-xs text-slate-400">Active:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-xs">
                  "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="hover:text-indigo-200 ml-1 text-xs"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterKeyword && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-success-500/20 text-success-300 rounded-md text-xs">
                  "{filterKeyword}"
                  <button
                    onClick={() => setFilterKeyword('')}
                    className="hover:text-success-200 ml-1 text-xs"
                    aria-label="Clear keyword filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterTone && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md text-xs">
                  {filterTone}
                  <button
                    onClick={() => setFilterTone('')}
                    className="hover:text-purple-200 ml-1 text-xs"
                    aria-label="Clear tone filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterLocation && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-300 rounded-md text-xs">
                  {filterLocation}
                  <button
                    onClick={() => setFilterLocation('')}
                    className="hover:text-orange-200 ml-1 text-xs"
                    aria-label="Clear location filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterDateRange !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-xs">
                  {filterDateRange === '7d' ? 'Last 7 days' : 'Last 30 days'}
                  <button
                    onClick={() => setFilterDateRange('all')}
                    className="hover:text-indigo-200 ml-1 text-xs"
                    aria-label="Clear date filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {difficultyRange !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-slate-200 rounded-md text-xs border border-white/10">
                  {difficultyRange === 'high' ? 'High difficulty' : 'Low difficulty'}
                  <button
                    onClick={() => setDifficultyRange('all')}
                    className="hover:text-white ml-1 text-xs"
                    aria-label="Clear difficulty filter"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterKeyword('');
                  setFilterTone('');
                  setFilterLocation('');
                  setFilterDateRange('all');
                  setDifficultyRange('all');
                }}
                className="px-3 py-1 bg-red-500/20 text-red-300 rounded-md text-xs hover:bg-red-500/30 transition-colors"
              >
                Clear All
              </button>
            </>
          )}
        </div>
        <div className="text-xs text-slate-400 text-center sm:text-right">
          {filteredArticles.length} of {articles.length}
        </div>
      </div>

      {/* Slide-over Filter Panel */}
      <AnimatePresence>
        {isFilterPanelOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterPanelOpen(false)}
            />
            <motion.aside
              id="filter-panel"
              role="dialog"
              aria-modal="true"
              className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-slate-900/95 backdrop-blur-md border-l border-white/10 z-50 p-5 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-white">Filters</div>
                <button className="text-slate-300 hover:text-white" onClick={() => setIsFilterPanelOpen(false)} aria-label="Close filters">×</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400">Search</label>
                  <div className="relative mt-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Keyword</label>
                  <input
                    type="text"
                    value={filterKeyword}
                    onChange={(e) => setFilterKeyword(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="text-xs text-slate-400">Tone</label>
                    <div className="relative mt-1">
                      <MegaphoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select
                        value={filterTone}
                        onChange={(e) => setFilterTone(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")`,
                          backgroundPosition: 'right 0.75rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.25em 1.25em',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option value="">All Tones</option>
                        {uniqueTones.map(tone => (
                          <option key={tone} value={tone} className="bg-slate-800 text-white">{tone}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="text-xs text-slate-400">Location</label>
                    <div className="relative mt-1">
                      <GeoIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")`,
                          backgroundPosition: 'right 0.75rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.25em 1.25em',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option value="">All Locations</option>
                        {uniqueLocations.map(location => (
                          <option key={location} value={location} className="bg-slate-800 text-white">{location}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Date range</div>
                  <div className="flex flex-wrap gap-2">
                    {(['all','7d','30d'] as const).map((opt) => (
                      <button key={opt} onClick={() => setFilterDateRange(opt)} className={`px-3 py-1.5 rounded-full text-xs border ${filterDateRange === opt ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}>{opt === 'all' ? 'All time' : opt === '7d' ? 'Last 7 days' : 'Last 30 days'}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Keyword difficulty</div>
                  <div className="flex flex-wrap gap-2">
                    {(['all','low','high'] as const).map((opt) => (
                      <button key={opt} onClick={() => setDifficultyRange(opt)} className={`px-3 py-1.5 rounded-full text-xs border ${difficultyRange === opt ? (opt === 'low' ? 'bg-success-500/20 text-success-200 border-success-400/30' : opt === 'high' ? 'bg-warning-500/20 text-warning-200 border-warning-400/30' : 'bg-white/10 text-slate-200 border-white/20') : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}>{opt === 'all' ? 'All' : opt === 'low' ? 'Low' : 'High'}</button>
                    ))}
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <button
                    className="px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterKeyword('');
                      setFilterTone('');
                      setFilterLocation('');
                      setFilterDateRange('all');
                      setDifficultyRange('all');
                    }}
                  >
                    Reset
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm bg-indigo-500 hover:bg-indigo-400 text-white"
                    onClick={() => setIsFilterPanelOpen(false)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Articles Grid */}
      <div className="mt-1">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 sm:py-16 text-slate-500">
            <SearchIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No articles found</h3>
            <p className="mb-4 text-sm sm:text-base">Try adjusting your search or filter criteria.</p>
            {(searchTerm || filterKeyword || filterTone || filterLocation) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterKeyword('');
                  setFilterTone('');
                  setFilterLocation('');
                }}
                className="px-4 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch gap-8">
              {currentPageArticles.map((article, idx) => (
                <motion.div
                  key={article.id}
                  initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut', delay: prefersReducedMotion ? 0 : idx * 0.03 }}
                  className="col-span-1 h-full"
                >
                  <ArticleCard article={article} onDelete={onDeleteArticle} onView={onViewArticle} />
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <PaginationButtons
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
