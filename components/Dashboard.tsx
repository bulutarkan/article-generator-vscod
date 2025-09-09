import React, { useMemo, useState } from 'react';
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

interface DashboardProps {
  articles: Article[];
  onDeleteArticle: (id: string) => void;
  onViewArticle: (id: string) => void;
  onNavigate: (page: 'generator' | 'calendar') => void;
}

const StatCard: React.FC<{ icon: React.FC<React.SVGProps<SVGSVGElement>>; label: string; value: string | number; }> = ({ icon: Icon, label, value }) => (
  <div className="bg-slate-800/70 p-5 rounded-xl border border-slate-700 flex items-start gap-4 h-full">
    <div className="p-3 bg-indigo-500/10 rounded-lg">
      <Icon className="h-6 w-6 text-indigo-400" />
    </div>
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  </div>
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
    <div className="flex items-center justify-center gap-2 mt-6 mb-6">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          currentPage === 1
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
        }`}
      >
        ‹ Previous
      </button>

      {/* Page Numbers */}
      {getVisiblePages().map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-2 py-2 text-slate-500">...</span>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === page
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
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          currentPage === totalPages
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
        }`}
      >
        Next ›
      </button>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ articles, onDeleteArticle, onViewArticle, onNavigate }) => {
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

  if (articles.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-white mb-4">Dashboard is Empty</h2>
        <p>You haven't generated any articles yet.</p>
        <button onClick={() => onNavigate('generator')} className="mt-6 inline-block bg-indigo-500 px-4 py-2 rounded-md text-white hover:bg-indigo-400 transition-colors">
          Generate Your First Article
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        {stats && (
          <>
            <StatCard icon={FilesIcon} label="Total Articles" value={stats.totalArticles} />
            <StatCard icon={FileTextIcon} label="Total Words" value={stats.totalWords} />
            <StatCard icon={BarChartIcon} label="Avg. KW Difficulty" value={stats.avgDifficulty} />
            <div onClick={() => onNavigate('calendar')} className="cursor-pointer hover:scale-105 transition-transform duration-200">
              <StatCard icon={CalendarIcon} label="Content Calendar" value="Plan" />
            </div>
          </>
        )}
      </div>

      {/* Compact Search and Filter Section */}
      <div className="mb-6">
        {/* Search Toggle Button - Always visible */}
        <div className="flex justify-center mb-3">
          <button
            onClick={() => setShowSearchBar(!showSearchBar)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              showSearchBar
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Toggle search and filters"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Compact Search and Filter Section - Show all when toggled */}
        {showSearchBar && (
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              {/* Search Input */}
              <div className="relative">
                <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-xs"
                  autoFocus
                />
              </div>

              {/* Keyword Filter */}
              <div className="relative">
                <HashIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Keyword..."
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-xs"
                />
              </div>

              {/* Tone Filter */}
              <div className="relative">
                <MegaphoneIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                <select
                  value={filterTone}
                  onChange={(e) => setFilterTone(e.target.value)}
                  className="w-full pl-7 pr-6 py-1.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-xs appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.25rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1em 1em',
                    paddingRight: '1.75rem'
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
                <GeoIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full pl-7 pr-6 py-1.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-xs appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.25rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1em 1em',
                    paddingRight: '1.75rem'
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
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {(searchTerm || filterKeyword || filterTone || filterLocation) && (
                  <>
                    <span className="text-xs text-slate-400">Active:</span>
                    {searchTerm && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                        "{searchTerm}"
                        <button
                          onClick={() => setSearchTerm('')}
                          className="hover:text-indigo-200 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {filterKeyword && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs">
                        "{filterKeyword}"
                        <button
                          onClick={() => setFilterKeyword('')}
                          className="hover:text-green-200 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {filterTone && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                        {filterTone}
                        <button
                          onClick={() => setFilterTone('')}
                          className="hover:text-purple-200 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {filterLocation && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded text-xs">
                        {filterLocation}
                        <button
                          onClick={() => setFilterLocation('')}
                          className="hover:text-orange-200 ml-1"
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
                      className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30"
                    >
                      Clear All
                    </button>
                  </>
                )}
              </div>
              <div className="text-xs text-slate-400">
                {filteredArticles.length} of {articles.length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Articles Grid */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <SearchIcon className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
            <p className="mb-4">Try adjusting your search or filter criteria.</p>
            {(searchTerm || filterKeyword || filterTone || filterLocation) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterKeyword('');
                  setFilterTone('');
                  setFilterLocation('');
                }}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPageArticles.map((article) => (
                <ArticleCard key={article.id} article={article} onDelete={onDeleteArticle} onView={onViewArticle} />
              ))}
            </div>

            {/* Pagination Buttons - Below Articles */}
            <PaginationButtons
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
};
