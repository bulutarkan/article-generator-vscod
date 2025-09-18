import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
import { Tooltip } from './Tooltip';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface DashboardProps {
  articles: Article[];
  isLoading: boolean;
  onDeleteArticle: (id: string) => void;
  onViewArticle: (id: string) => void;
  onNavigate: (page: 'generator' | 'calendar' | 'statistics') => void;
}

const StatCard: React.FC<{ icon: React.FC<React.SVGProps<SVGSVGElement>>; label: string; value: string | number; }> = ({ icon: Icon, label, value }) => (
  <motion.div
    className="flex flex-row items-center card h-full min-h-[80px]"
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2 }}
  >
    <div className="flex items-start gap-2 p-2 sm:p-3">
      <motion.div
        className="p-1 sm:p-2 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-lg border border-primary-500/30 flex-shrink-0"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-neutral-400 font-body line-clamp-1">{label}</p>
        <p className="text-sm font-semibold text-white mt-1 font-heading">{value}</p>
      </div>
    </div>
  </motion.div>
);

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
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterTone, setFilterTone] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

    return filtered;
  }, [articles, searchTerm, filterKeyword, filterTone, filterLocation]);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterKeyword, filterTone, filterLocation]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
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
      <div className="flex flex-row items-center gap-2 mb-10">
        <Tooltip
          content={
            <div className="flex flex-row flex-wrap gap-4 sm:gap-6">
              {stats && (
                <>
                  <StatCard icon={FilesIcon} label="Total Articles" value={stats.totalArticles} />
                  <StatCard icon={FileTextIcon} label="Total Words" value={stats.totalWords} />
                  <StatCard icon={BarChartIcon} label="Avg. KW Difficulty" value={stats.avgDifficulty} />
                  <div
                    className="cursor-pointer"
                    onClick={() => onNavigate('calendar')}
                  >
                    <StatCard icon={CalendarIcon} label="Content Calendar" value="Plan" />
                  </div>
                   <div
                    className="cursor-pointer"
                    onClick={() => onNavigate('statistics')}
                  >
                    <StatCard icon={BarChartIcon} label="More statistics" value="View" />
                  </div>
                </>
              )}
            </div>
          }
        >
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <BarChartIcon className="h-5 w-5" />
            <span>Statistics</span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </Tooltip>
        {/* Search Toggle Button - Placed next to Statistics button */}
        <button
          onClick={() => setShowSearchBar(!showSearchBar)}
          className={`p-3 rounded-lg transition-all duration-200 ${showSearchBar
            ? 'bg-indigo-500 text-white'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          title="Toggle search and filters"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Compact Search and Filter Section */}
      <div className="mb-6">
        {/* The search input and filters UI will be shown/hidden based on showSearchBar state */}

        {/* Compact Search and Filter Section - Show all when toggled */}
        {showSearchBar && (
          <div className="bg-slate-800/50 p-3 sm:p-4 rounded-lg border border-slate-600 animate-fade-in-up max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3">
              {/* Search Input */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-3 sm:w-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>

              {/* Keyword Filter */}
              <div className="relative">
                <HashIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-3 sm:w-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Keyword"
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Tone Filter */}
              <div className="relative">
                <MegaphoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-3 sm:w-3 text-slate-400" />
                <select
                  value={filterTone}
                  onChange={(e) => setFilterTone(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.25em 1.25em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">All Tones</option>
                  {uniqueTones.map(tone => (
                    <option key={tone} value={tone} className="bg-slate-700 text-white">{tone}</option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div className="relative">
                <GeoIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-3 sm:w-3 text-slate-400" />
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.25em 1.25em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map(location => (
                    <option key={location} value={location} className="bg-slate-700 text-white">{location}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters and Results Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                {(searchTerm || filterKeyword || filterTone || filterLocation) && (
                  <>
                    <span className="text-xs text-slate-400">Active:</span>
                    {searchTerm && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-xs">
                        "{searchTerm}"
                        <button
                          onClick={() => setSearchTerm('')}
                          className="hover:text-indigo-200 ml-1 text-xs"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {filterKeyword && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded-md text-xs">
                        "{filterKeyword}"
                        <button
                          onClick={() => setFilterKeyword('')}
                          className="hover:text-green-200 ml-1 text-xs"
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
                      }}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-md text-xs hover:bg-red-500/30 transition-colors"
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
          </div>
        )}
      </div>

      {/* Articles Grid */}
      <div className="animate-fade-in-up mt-[-1rem]" style={{ animationDelay: '0.1s' }}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {currentPageArticles.map((article) => (
                <ArticleCard key={article.id} article={article} onDelete={onDeleteArticle} onView={onViewArticle} />
              ))}
            </div>

            {/* Pagination Buttons - Below Articles */}
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
