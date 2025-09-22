import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GithubIcon } from './icons/GithubIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { DashboardIcon } from './icons/DashboardIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { MailIcon } from './icons/MailIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { UserCogIcon } from './icons/UserCogIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { TwitterIcon } from './icons/TwitterIcon';
import type { User, Article } from '../types';

interface HeaderProps {
  currentPage: 'generator' | 'dashboard' | 'article' | 'profile' | 'calendar' | 'statistics' | 'admin';
  onNavigate: (page: 'generator' | 'dashboard' | 'profile' | 'calendar' | 'statistics' | 'admin') => void;
  user: User | null;
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToPricing?: () => void;
  onNavigateToFeatures?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToCalendar?: () => void;
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
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium text-neutral-300 bg-neutral-800/50 hover:bg-primary-500/10 border border-neutral-700/50 transition-all duration-200 font-body"
      >
        {/* Desktop ve tablet için text */}
        <span className="hidden sm:inline-block">{user.username || user.email}</span>

        {/* Mobile için profile icon */}
        <div className="sm:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-neutral-300"
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
      </motion.button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        className="absolute right-0 z-30 mt-2 w-48 origin-top-right rounded-xl bg-neutral-800/95 backdrop-blur-md shadow-lg ring-1 ring-neutral-700/50 border border-neutral-700/50 focus:outline-none"
      >
        <div className="py-1">
          {onNavigateToProfile && (
            <motion.a 
              onClick={() => handleSelect(onNavigateToProfile)} 
              whileHover={{ x: 4 }}
              className="flex items-center gap-3 px-4 py-3 text-sm text-neutral-300 hover:bg-primary-500/20 cursor-pointer font-body transition-all duration-200"
            >
              <UserCogIcon className="h-5 w-5 text-primary-400" /> Profile
            </motion.a>
          )}

          <motion.a 
            onClick={() => handleSelect(onLogout)} 
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/20 cursor-pointer font-body transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
            Logout
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, user, onLogout, onNavigateToAdmin, onNavigateToProfile, onNavigateToPricing, onNavigateToFeatures, onNavigateToContact, onNavigateToCalendar, articles, onDeleteArticle, onViewArticle, onUpdateArticle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const NavLink: React.FC<{ page: 'generator' | 'dashboard' | 'calendar'; label: string; isActive: boolean; children: React.ReactNode }> = ({ page, label, isActive, children }) => (
    <motion.button
      onClick={() => onNavigate(page)}
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium font-body transition-all duration-200 shadow-sm border ${isActive ? 'bg-primary-500 text-white shadow-md border-blue-300' : 'text-neutral-300 hover:bg-primary-500/10 hover:text-primary-300 border-transparent'}`}
    >
      {children}
      {label}
    </motion.button>
  );

  // Filter articles based on search term
  const filteredArticles = searchTerm
    ? articles.filter(article =>
      article.primaryKeyword.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : articles;

  return (
    <header className="py-4 sm:py-6 text-center px-4">
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
            <motion.a href="#" whileHover={{ scale: 1.1, rotate: 5 }} className="text-neutral-400 hover:text-primary-400 transition-all duration-200 p-2 rounded-lg hover:bg-primary-500/10">
              <TwitterIcon className="h-6 w-6" />
            </motion.a>
            <motion.a href="#" whileHover={{ scale: 1.1, rotate: -5 }} className="text-neutral-400 hover:text-accent-400 transition-all duration-200 p-2 rounded-lg hover:bg-accent-500/10">
              <FacebookIcon className="h-6 w-6" />
            </motion.a>
            <motion.a href="#" whileHover={{ scale: 1.1 }} className="text-neutral-400 hover:text-neutral-300 transition-all duration-200 p-2 rounded-lg hover:bg-neutral-700/50">
              <GithubIcon className="h-6 w-6" />
            </motion.a>
          </div>
        </div>

        {/* Center Section - Logo */}
        <div className="flex-1 flex justify-center px-4">
          <motion.button 
            onClick={() => onNavigate('generator')} 
            whileHover={{ scale: 1.05 }}
            className="font-bold tracking-tight animate-fade-in-up inline-flex items-baseline font-heading hover:scale-105 transition-all duration-300"
            style={{
              backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            <span className="inline-block px-1.5 py-1.5 border-2 border-blue-300 rounded-md bg-gradient-to-r from-primary-500 to-accent-500 text-gray-900 text-3xl font-bold">AI</span>
            <span className="text-2xl sm:text-3xl md:text-4xl ml-1">rticle</span>
          </motion.button>
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
      <nav className="hidden lg:flex justify-center items-center gap-2 p-1 bg-neutral-800/30 rounded-xl w-fit mx-auto animate-fade-in-up mt-4 backdrop-blur-sm border border-neutral-700/50" style={{ animationDelay: '0.2s' }}>
        <motion.button
          onClick={() => window.location.href = '/'}
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:bg-primary-500/10 font-body transition-all duration-200 shadow-sm border border-transparent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L2 12.414V19a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-9-9z" />
          </svg>
          Home
        </motion.button>
        <NavLink page="generator" label="Generator" isActive={currentPage === 'generator'}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        </NavLink>
        <NavLink page="dashboard" label="Dashboard" isActive={currentPage === 'dashboard' || currentPage === 'article'}>
          <DashboardIcon className="h-5 w-5" />
        </NavLink>
        <NavLink page="calendar" label="Calendar" isActive={currentPage === 'calendar'}>
          <CalendarIcon className="h-5 w-5" />
        </NavLink>
        {onNavigateToProfile && (
          <motion.button
            onClick={() => onNavigate('profile')}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium font-body transition-all duration-200 shadow-sm border ${currentPage === 'profile' ? 'bg-primary-500 text-white shadow-md border-blue-300' : 'text-neutral-300 hover:bg-primary-500/10 hover:text-primary-300 border-transparent'}`}
          >
            <UserCogIcon className="h-5 w-5" />
            Profile
          </motion.button>
        )}
        <motion.button
          onClick={onNavigateToFeatures}
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:bg-accent-500/10 hover:text-accent-300 font-body transition-all duration-200 shadow-sm border border-transparent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Features
        </motion.button>
        <motion.button
          onClick={onNavigateToPricing}
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:bg-primary-500/10 hover:text-primary-300 font-body transition-all duration-200 shadow-sm border border-transparent"
        >
          <CreditCardIcon className="h-5 w-5 text-neutral-400" />
          Pricing
        </motion.button>
        <motion.button
          onClick={onNavigateToContact}
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:bg-accent-500/10 hover:text-accent-300 font-body transition-all duration-200 shadow-sm border border-transparent"
        >
          <MailIcon className="h-5 w-5 text-neutral-400" />
          Contact
        </motion.button>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden mt-4 flex justify-center">
        <div className="flex gap-1 p-1 bg-neutral-800/30 rounded-xl animate-fade-in-up backdrop-blur-sm border border-neutral-700/50" style={{ animationDelay: '0.2s' }}>
          <motion.button
            onClick={() => onNavigate('generator')}
            whileTap={{ scale: 0.95 }}
            className={`p-3 rounded-lg transition-all duration-200 shadow-sm ${currentPage === 'generator' ? 'bg-primary-500 text-white shadow-md' : 'text-neutral-400 hover:text-primary-300 hover:bg-primary-500/10'}`}
            title="Generator"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </motion.button>
          <motion.button
            onClick={() => onNavigate('dashboard')}
            whileTap={{ scale: 0.95 }}
            className={`p-3 rounded-lg transition-all duration-200 shadow-sm ${currentPage === 'dashboard' || currentPage === 'article' ? 'bg-primary-500 text-white shadow-md' : 'text-neutral-400 hover:text-primary-300 hover:bg-primary-500/10'}`}
            title="Dashboard"
          >
            <DashboardIcon className="h-5 w-5" />
          </motion.button>
          <motion.button
            onClick={() => onNavigate('calendar')}
            whileTap={{ scale: 0.95 }}
            className={`p-3 rounded-lg transition-all duration-200 shadow-sm ${currentPage === 'calendar' ? 'bg-primary-500 text-white shadow-md' : 'text-neutral-400 hover:text-primary-300 hover:bg-primary-500/10'}`}
            title="Calendar"
          >
            <CalendarIcon className="h-5 w-5" />
          </motion.button>
          <motion.button
            onClick={() => window.location.href = '/'}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-lg text-neutral-400 hover:text-primary-300 hover:bg-primary-500/10 transition-all duration-200 shadow-sm"
            title="Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L2 12.414V19a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-9-9z" />
            </svg>
          </motion.button>
          <motion.button
            onClick={onNavigateToFeatures}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-lg text-neutral-400 hover:text-accent-300 hover:bg-accent-500/10 transition-all duration-200 shadow-sm"
            title="Features"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </motion.button>
          <motion.button
            onClick={onNavigateToPricing}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-lg text-neutral-400 hover:text-primary-300 hover:bg-primary-500/10 transition-all duration-200 shadow-sm"
            title="Pricing"
          >
            <CreditCardIcon className="h-5 w-5" />
          </motion.button>
          <motion.button
            onClick={onNavigateToContact}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-lg text-neutral-400 hover:text-accent-300 hover:bg-accent-500/10 transition-all duration-200 shadow-sm"
            title="Contact"
          >
            <MailIcon className="h-5 w-5" />
          </motion.button>
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
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-6 border-b border-neutral-700/50 bg-neutral-800/80 backdrop-blur-sm rounded-t-xl"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-2 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl shadow-lg"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </motion.div>
              <h2 className="text-lg font-semibold text-white font-heading">Recent Articles</h2>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setSearchOpen(!searchOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-neutral-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all duration-200"
                title="Search articles"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.button>
              <motion.button
                onClick={() => setSidebarOpen(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50 rounded-lg transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </motion.div>

          {/* Search Input */}
          {searchOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-6 py-4 border-b border-neutral-700/50 bg-neutral-800/50 overflow-hidden"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles by keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field"
                />
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-neutral-400 absolute left-3 top-3" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  animate={{ scale: searchTerm ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </motion.svg>
              </div>
            </motion.div>
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
                    <motion.div
                      key={article.id}
                      className="card overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                      <div className="flex items-center justify-between">
                        <motion.button
                          onClick={() => {
                            onViewArticle(article.id);
                            setSidebarOpen(false);
                          }}
                          className="text-left flex-1 transition-transform duration-200 flex flex-col items-start justify-between"
                          whileHover={{ scale: 1.02 }}
                        >
                          <h3 className="text-sm font-medium text-white line-clamp-1 leading-tight font-body">
                            {article.primaryKeyword}
                          </h3>
                          <div className="mt-2">
                            <p className="text-xs text-neutral-400 font-body">
                              Created: {formatDate(article.createdAt)}
                            </p>
                          </div>
                        </motion.button>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                          <motion.button
                            onClick={() => {
                              onViewArticle(article.id);
                              setSidebarOpen(false);
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-neutral-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all duration-200"
                            title="View Article"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              onViewArticle(article.id);
                              setSidebarOpen(false);
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-neutral-400 hover:text-accent-400 hover:bg-accent-500/10 rounded-lg transition-all duration-200"
                            title="Edit Article"
                          >
                            <EditIcon className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this article?')) {
                                onDeleteArticle(article.id);
                              }
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            title="Delete Article"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
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
