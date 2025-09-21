import React, { useState, useRef, useEffect } from 'react';
import { countries } from '../data/countries';
import { GeoIcon } from './icons/GeoIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { TopicIcon } from './icons/TopicIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ToggleSwitch } from './ToggleSwitch';

import { Globe } from 'lucide-react'; // Import Globe icon
import { Loader } from './Loader'; // Import Loader component
import type { SuggestedKeyword } from '../types'; // Import SuggestedKeyword type

interface ArticleFormProps {
  topic: string;
  setTopic: (topic: string) => void;
  location: string;
  setLocation: (location: string) => void;
  tone: string;
  setTone: (tone: string) => void;
  brief: string;
  setBrief: (brief: string) => void;
  enableInternalLinks: boolean;
  setEnableInternalLinks: (enabled: boolean) => void;
  websiteUrl: string;
  setWebsiteUrl: (url: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onAnalyzeContent?: () => void;
  isAnalyzing?: boolean;
  // New props for keyword suggestions
  isCrawling: boolean;
  suggestedKeywords: SuggestedKeyword[];
  handleCrawlWebsite: () => Promise<void>;
  handleKeywordToggle: (keyword: string) => void;
  crawlingError: string | null;
}

export const ArticleForm: React.FC<ArticleFormProps> = ({
  topic,
  setTopic,
  location,
  setLocation,
  tone,
  setTone,
  brief,
  setBrief,
  enableInternalLinks,
  setEnableInternalLinks,
  websiteUrl,
  setWebsiteUrl,
  onSubmit,
  isLoading,
  onAnalyzeContent,
  isAnalyzing = false,
  // Destructure new props
  isCrawling,
  suggestedKeywords,
  handleCrawlWebsite,
  handleKeywordToggle,
  crawlingError,
}) => {
  const tones = ['Authoritative', 'Formal', 'Professional', 'Casual', 'Funny'];

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isToneOpen, setIsToneOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const toneDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
      if (toneDropdownRef.current && !toneDropdownRef.current.contains(event.target as Node)) {
        setIsToneOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationSelect = (country: string) => {
    setLocation(country);
    setLocationSearch('');
    setIsLocationOpen(false);
  };

  const filteredCountries = countries.filter(c => c.toLowerCase().includes(locationSearch.toLowerCase()));

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 shadow-lg backdrop-blur-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Topic Input */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="topic" className="text-sm font-medium text-slate-300 flex items-center">
            <TopicIcon className="w-4 h-4 mr-2 text-sky-400" />
            Article Topic
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 'Best coffee shops'"
            className="text-sm bg-slate-900/80 border border-slate-700 rounded-md px-4 py-2 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
          />
        </div>

        {/* Location Searchable Dropdown with AI Analysis Icon */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="location" className="text-sm font-medium text-slate-300 flex items-center">
            <GeoIcon className="w-4 h-4 mr-2 text-sky-400" />
            Target Location
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 transition-all duration-300" ref={locationDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className={`relative w-full cursor-default rounded-md bg-slate-900/80 border border-slate-700 py-2 pl-3 pr-10 text-left text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm transition-all duration-300 ${topic.trim() && location.trim() ? 'pr-16' : 'pr-10'
                  }`}
              >
                <span className="block truncate">{location || 'Select a Country...'}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <svg className={`h-5 w-5 text-gray-400 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                </span>
              </button>
              {isLocationOpen && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-slate-700">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="block w-full rounded-md border-0 bg-slate-900/80 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm"
                    />
                  </div>
                  <ul role="listbox">
                    {filteredCountries.map(c => (
                      <li key={c} className="text-white relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-sky-500/30" onClick={() => handleLocationSelect(c)}>
                        <span className="font-normal block truncate">{c}</span>
                        {location === c && (
                          <span className="text-sky-400 absolute inset-y-0 right-0 flex items-center pr-4">
                            <CheckIcon className="h-5 w-5" />
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* AI Analysis Lightning Icon */}
            {topic.trim() && location.trim() && onAnalyzeContent && (
              <button
                onClick={onAnalyzeContent}
                disabled={isAnalyzing}
                className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all duration-300 transform hover:scale-110 disabled:hover:scale-100 shadow-lg disabled:cursor-not-allowed flex items-center justify-center border border-white/20"
                title="Analyze Content Opportunity"
              >
                {isAnalyzing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tone of Voice Dropdown */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="tone" className="text-sm font-medium text-slate-300 flex items-center">
            <MegaphoneIcon className="w-4 h-4 mr-2 text-sky-400" />
            Tone of Voice
          </label>
          <div className="relative" ref={toneDropdownRef}>
            <button type="button" onClick={() => setIsToneOpen(!isToneOpen)} className="relative w-full cursor-default rounded-md bg-slate-900/80 border border-slate-700 py-2 pl-3 pr-10 text-left text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm">
              <span className="block truncate">{tone || 'Select a Tone...'}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <svg className={`h-5 w-5 text-gray-400 transition-transform ${isToneOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd"></path></svg>
              </span>
            </button>
            {isToneOpen && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-slate-700">
                <ul role="listbox">
                  {tones.map(t => (
                    <li key={t} className="text-white relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-sky-500/30" onClick={() => { setTone(t); setIsToneOpen(false); }}>
                      <span className="font-normal block truncate">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brief Textarea */}
      <div className="mt-6">
        <label htmlFor="brief" className="text-sm font-medium text-slate-300 flex items-center mb-2">
          <svg className="w-4 h-4 mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Brief (Optional)
        </label>
        <textarea
          id="brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Add any specific requirements, focus areas, or additional context for your article..."
          rows={3}
          className="text-sm w-full bg-slate-900/80 border border-slate-700 rounded-md px-4 py-3 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">
          You can request comparison tables, mention specific brands, or add any other details you'd like included in the article.
        </p>
      </div>

      {/* Internal Links Section */}
      <div className="mt-6">
        <div className="flex items-center space-x-3 mb-4">
          <ToggleSwitch
            id="enableInternalLinks"
            checked={enableInternalLinks}
            onChange={setEnableInternalLinks}
          />
          <label htmlFor="enableInternalLinks" className="text-sm font-medium text-slate-300 flex items-center cursor-pointer">
            <svg className="w-4 h-4 mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Add Internal Links (SEO Boost)
          </label>
        </div>

        {enableInternalLinks && (
          <div className="space-y-3">
            <div>
              <label htmlFor="websiteUrl" className="text-sm font-medium text-slate-300 mb-2 block">
                Website URL
              </label>
              <input
                id="websiteUrl"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-900/80 border border-slate-700 rounded-md px-4 py-2 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
              />
              <p className="text-xs text-slate-500 mt-1">
                We'll analyze your website and add relevant internal links to improve SEO.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Keyword Suggestion Section */}
      <div className="mt-8 mb-6 p-4 bg-gray-800 rounded-lg shadow-lg border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
          <Globe className="w-4 h-4 mr-2 text-blue-400" />
          SEO Keyword Suggestions (Web Crawling)
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Crawl the specified website (from "Add Internal Links" section) to identify relevant keywords for your article's topic.
        </p>

        {enableInternalLinks && ( // Only show if internal links are enabled
          <div className="mb-4">
            <button
              onClick={handleCrawlWebsite}
              disabled={isCrawling || !websiteUrl.trim() || !topic.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isCrawling ? (
                <>
                  <Loader message="Crawling website for SEO keywords..." />
                  <span>Crawling...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Crawl Keywords</span>
                </>
              )}
            </button>
            {crawlingError && (
              <div className="mt-4 text-red-400 text-sm">
                Error crawling website: {crawlingError}
              </div>
            )}
          </div>
        )}

        {suggestedKeywords.length > 0 && (
          <div className="mt-6">
            <h4 className="text-base font-medium text-white mb-3">Suggested Keywords (Top 10)</h4>
            <div className="flex flex-wrap gap-2">
              {suggestedKeywords.map((sk, index) => (
                <button
                  key={index}
                  onClick={() => handleKeywordToggle(sk.keyword)}
                  className={`px-3 py-1 rounded-full text-sm transition-all duration-200
                    ${sk.selected
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    }`}
                >
                  {sk.keyword}
                </button>
              ))}
            </div>
            <div className="mt-4 text-gray-400 text-sm">
              Selected keywords will be passed to the AI for SEO optimization.
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onSubmit}
          disabled={isLoading || !topic || !location || !tone}
          className="flex items-center justify-center bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-500/50"
        >
          {isLoading ? 'Generating...' : 'Generate Article'}
        </button>
      </div>
    </div>
  );
};
