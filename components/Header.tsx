import React, { useState, useEffect, useRef } from 'react';
import { DashboardIcon } from './icons/DashboardIcon';
import { UserCogIcon } from './icons/UserCogIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { MailIcon } from './icons/MailIcon';
import { TwitterIcon } from './icons/TwitterIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { GithubIcon } from './icons/GithubIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import type { User, Article } from '../types';

interface HeaderProps {
  currentPage: 'generator' | 'dashboard' | 'article' | 'profile';
  onNavigate: (page: 'generator' | 'dashboard' | 'profile') => void;
  user: User | null;
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToPricing?: () => void;
  onNavigateToFeatures?: () => void;
  onNavigateToContact?: () => void;
  articles: Article[];
  onDeleteArticle: (id: string) => void;
  onViewArticle: (id: string) => void;
  onUpdateArticle: (id: string, updates: Partial<Omit<Article, 'id'>>) => void;
}

const UserMenu: React.FC<{ user: User; onLogout: () => void; onNavigateToAdmin?: () => void; onNavigateToProfile?: () => void; }> = ({ user, onLogout, onNavigateToAdmin, onNavigateToProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (action: (() => void) | undefined) => {
    if (action) action();
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 600px altı için profile icon, üstü için text */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-md text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
      >
        {/* Desktop ve tablet için text */}
        <span className="hidden sm:inline-block">{user.username || user.email}</span>

        {/* Mobile için profile icon */}
        <div className="sm:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div
        className={`absolute right-0 z-30 mt-2 w-48 origin-top-right rounded-md bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-700 transition-all duration-200 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        <div className="py-1">
          {onNavigateToProfile && (
            <a onClick={() => handleSelect(onNavigateToProfile)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-indigo-500/30 cursor-pointer">
              <UserCogIcon className="h-5 w-5" /> Profile
            </a>
          )}

          <a onClick={() => handleSelect(onLogout)} className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
             Logout
          </a>
        </div>
      </div>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, user, onLogout, onNavigateToAdmin, onNavigateToProfile, onNavigateToPricing, onNavigateToFeatures, onNavigateToContact, articles, onDeleteArticle, onViewArticle, onUpdateArticle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const NavLink: React.FC<{ page: 'generator' | 'dashboard'; label: string; isActive: boolean; children: React.ReactNode }> = ({ page, label, isActive, children }) => (
    <button
      onClick={() => onNavigate(page)}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-300 hover:bg-white/10'}`}
    >
      {children}
      {label}
    </button>
  );

  // Filter articles based on search term
  const filteredArticles = searchTerm
    ? articles.filter(article =>
      article.primaryKeyword.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : articles;

  return (
    <header className="py-4 sm:py-8 text-center px-4">
      {/* Center Layout - Hamburger + Logo + User Menu always centered */}
      <div className="flex justify-center items-center w-full max-w-7xl mx-auto">
        {/* Left Section - Hamburger Menu */}
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-300 hover:text-indigo-400 transition-colors p-2 rounded-md hover:bg-white/10"
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop Social Icons */}
          <div className="hidden lg:flex gap-3 ml-2">
            <a href="#" className="text-slate-300 hover:text-indigo-400 transition-colors">
              <TwitterIcon className="h-6 w-6" />
            </a>
            <a href="#" className="text-slate-300 hover:text-indigo-400 transition-colors">
              <FacebookIcon className="h-6 w-6" />
            </a>
            <a href="#" className="text-slate-300 hover:text-indigo-400 transition-colors">
              <GithubIcon className="h-6 w-6" />
            </a>
          </div>
        </div>

        {/* Center Section - Logo */}
        <div className="flex-1 flex justify-center px-4">
          <button onClick={() => onNavigate('generator')} className="font-bold tracking-tight text-white animate-fade-in-up inline-flex items-baseline font-montserrat hover:scale-105 transition-transform duration-300">
            <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-600 text-black rounded text-xs sm:text-sm font-raleway">AI</span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-raleway">rticle</span>
          </button>
        </div>

        {/* Right Section - User Menu */}
        <div className="flex items-center">
          {user && (
            <UserMenu
              user={user}
              onLogout={onLogout}
              onNavigateToAdmin={onNavigateToAdmin}
              onNavigateToProfile={onNavigateToProfile}
            />
          )}
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex justify-center items-center gap-2 p-1 bg-white/5 rounded-lg w-fit mx-auto animate-fade-in-up mt-6" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L2 12.414V19a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-9-9z" />
          </svg>
          Home
        </button>
        <NavLink page="generator" label="Generator" isActive={currentPage === 'generator'}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        </NavLink>
        <NavLink page="dashboard" label="Dashboard" isActive={currentPage === 'dashboard' || currentPage === 'article'}>
          <DashboardIcon className="h-5 w-5" />
        </NavLink>
        {onNavigateToProfile && (
          <button
            onClick={() => onNavigate('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === 'profile' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-300 hover:bg-white/10'}`}
          >
            <UserCogIcon className="h-5 w-5" />
            Profile
          </button>
        )}
        <button
          onClick={onNavigateToFeatures}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Features
        </button>
        <button
          onClick={onNavigateToPricing}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
        >
          <CreditCardIcon className="h-5 w-5" />
          Pricing
        </button>
        <button
          onClick={onNavigateToContact}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
        >
          <MailIcon className="h-5 w-5" />
          Contact
        </button>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden mt-4 flex justify-center">
        <div className="flex gap-1 p-1 bg-white/5 rounded-lg animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => onNavigate('generator')}
            className={`p-3 rounded-md transition-colors ${currentPage === 'generator' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-300 hover:bg-white/10'}`}
            title="Generator"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className={`p-3 rounded-md transition-colors ${currentPage === 'dashboard' || currentPage === 'article' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-300 hover:bg-white/10'}`}
            title="Dashboard"
          >
            <DashboardIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="p-3 rounded-md text-slate-400 hover:text-slate-300 hover:bg-white/10 transition-colors"
            title="Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L2 12.414V19a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-9-9z" />
            </svg>
          </button>
          <button
            onClick={onNavigateToFeatures}
            className="p-3 rounded-md text-slate-400 hover:text-slate-300 hover:bg-white/10 transition-colors"
            title="Features"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
          <button
            onClick={onNavigateToPricing}
            className="p-3 rounded-md text-slate-400 hover:text-slate-300 hover:bg-white/10 transition-colors"
            title="Pricing"
          >
            <CreditCardIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onNavigateToContact}
            className="p-3 rounded-md text-slate-400 hover:text-slate-300 hover:bg-white/10 transition-colors"
            title="Contact"
          >
            <MailIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-0 z-50 flex transition-all duration-300 ease-in-out ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
        />
        <div className={`relative flex flex-col w-full sm:max-w-sm bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl border-r border-slate-700 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">Recent Articles</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                title="Search articles"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Input */}
          {searchOpen && (
            <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles by keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {articles.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-slate-700/30 rounded-full w-fit mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">No articles yet</p>
                <p className="text-slate-500 text-xs mt-1">Generate your first article to get started!</p>
              </div>
            ) : filteredArticles.length === 0 && searchTerm ? (
              <div className="text-center py-12">
                <div className="p-4 bg-slate-700/30 rounded-full w-fit mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">No articles found</p>
                <p className="text-slate-500 text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredArticles.slice(0, 10).map((article, index) => {
                  const formatDate = (dateString: string) => {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  };

                  return (
                    <div
                      key={article.id}
                      className="group bg-slate-700/30 hover:bg-slate-700/50 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10 hover:py-6"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            onViewArticle(article.id);
                            setSidebarOpen(false);
                          }}
                          className="text-left flex-1 group-hover:scale-[0.98] transition-transform duration-200 flex flex-col items-start justify-between"
                        >
                          <h3 className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors line-clamp-1 leading-tight">
                            {article.primaryKeyword}
                          </h3>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-2">
                            <p className="text-xs text-slate-400">
                              Created: {formatDate(article.createdAt)}
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              onViewArticle(article.id);
                              setSidebarOpen(false);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all duration-200"
                            title="View Article"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              onViewArticle(article.id);
                              setSidebarOpen(false);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                            title="Edit Article"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this article?')) {
                                onDeleteArticle(article.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            title="Delete Article"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {articles.length > 0 && (
            <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
              <p className="text-xs text-slate-500 text-center">
                {searchTerm
                  ? `Found ${filteredArticles.length} of ${articles.length} articles`
                  : `Showing ${Math.min(filteredArticles.length, 10)} of ${articles.length} articles`}
              </p>
            </div>
          )}
          <SidebarFooter onNavigateToProfile={onNavigateToProfile} />
        </div>
      </div>
    </header>
  );
};

const SidebarFooter: React.FC<{ onNavigateToProfile?: () => void }> = ({ onNavigateToProfile }) => (
  <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
    {onNavigateToProfile && (
      <button
        onClick={onNavigateToProfile}
        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors w-full justify-start"
      >
        <UserCogIcon className="h-5 w-5" />
        Settings
      </button>
    )}
  </div>
);
