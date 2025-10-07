import React, { useState, useEffect, FormEvent, useRef } from 'react';
import moment from 'moment';
import { createPortal } from 'react-dom';
import { CalendarEvent, CalendarEventStatus } from '../types';
import { generateSeoGeoArticle } from '../services/geminiService';
import { addArticle } from '../services/supabase';
import { getCurrentUser } from '../services/supabase';
import { webCrawlerService } from '../services/webCrawlerService';
import { countries } from '../data/countries';
import { ToggleSwitch } from './ToggleSwitch';
import { GeoIcon } from './icons/GeoIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { CheckIcon } from './icons/CheckIcon';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Partial<CalendarEvent> | null;
  onSave: (event: Omit<CalendarEvent, 'id' | 'user_id'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onArticleGenerated?: (articleId: string) => void;
  onNavigateToArticle?: (articleId: string) => void;
}

const statuses: CalendarEventStatus[] = ['planned', 'in_progress', 'completed', 'cancelled'];

const statusColors: Record<CalendarEventStatus, string> = {
  planned: 'text-gray-400',
  in_progress: 'text-blue-400',
  completed: 'text-green-400',
  cancelled: 'text-red-400',
};

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ isOpen, onClose, event, onSave, onUpdate, onDelete, onArticleGenerated, onNavigateToArticle }) => {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<CalendarEventStatus>('planned');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'event' | 'generate'>('event');
  const [startDateStr, setStartDateStr] = useState<string>('');
  const [endDateStr, setEndDateStr] = useState<string>('');

  // Generation form states
  const [tone, setTone] = useState<string>('Authoritative');
  const [location, setLocation] = useState<string>('');
  const [brief, setBrief] = useState<string>('');
  const [enableInternalLinks, setEnableInternalLinks] = useState<boolean>(false);
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Dropdown states
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isToneOpen, setIsToneOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const toneDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setStatus(event.status || 'planned');
      setNotes(event.notes || '');
      const initStart = event.start_date ? moment(event.start_date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
      const initEnd = event.end_date ? moment(event.end_date).format('YYYY-MM-DD') : initStart;
      setStartDateStr(initStart);
      setEndDateStr(initEnd);
    } else {
      // Reset for new event
      setTitle('');
      setStatus('planned');
      setNotes('');
      const today = moment().format('YYYY-MM-DD');
      setStartDateStr(today);
      setEndDateStr(today);
    }
  }, [event]);

  // Click outside handling for dropdowns
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (event?.id) {
        // Update existing event
        await onUpdate(event.id, {
          title,
          status,
          notes,
          start_date: moment(startDateStr, 'YYYY-MM-DD').toDate(),
          end_date: moment(endDateStr, 'YYYY-MM-DD').toDate(),
        });
      } else {
        // Create new event
        const newEvent: Omit<CalendarEvent, 'id' | 'user_id'> = {
          title,
          status,
          notes,
          start_date: moment(startDateStr, 'YYYY-MM-DD').toDate(),
          end_date: moment(endDateStr, 'YYYY-MM-DD').toDate(),
        };
        await onSave(newEvent);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save event', error);
      // TODO: Show error to user
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (event?.id && window.confirm('Are you sure you want to delete this event?')) {
        try {
            await onDelete(event.id);
            onClose();
        } catch (error) {
            console.error('Failed to delete event', error);
        }
    }
  }

  const handleGenerateArticle = async () => {
    if (!title.trim() || !location.trim() || !tone) {
      setGenerationError('Please provide a topic, location, and tone of voice.');
      return;
    }

    // Internal links için validasyon
    if (enableInternalLinks && !websiteUrl.trim()) {
      setGenerationError('Please provide a website URL for internal linking.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const user = await getCurrentUser();
      if (!user) {
        setGenerationError('User not authenticated. Please log in to generate articles.');
        return;
      }

      let internalLinksContext = '';

      // Internal links aktifse crawler'ı çalıştır
      if (enableInternalLinks && websiteUrl) {
        try {
          console.log('Starting web crawler for internal links...');
          internalLinksContext = await webCrawlerService.getWebsiteContext(websiteUrl, title);
          console.log('Web crawler completed successfully');
        } catch (crawlerError) {
          console.warn('Web crawler failed, proceeding without internal links:', crawlerError);
        }
      }

      const result = await generateSeoGeoArticle(
        title,
        location,
        tone,
        brief,
        enableInternalLinks,
        websiteUrl,
        internalLinksContext
      );

      // Add the article to database
      const articleData = {
        ...result,
        user_id: user.id,
        location: location,
        topic: title,
        tone: tone,
      };

      const savedArticle = await addArticle(articleData);

      // Update the event to completed status and link to article
      if (event?.id) {
        await onUpdate(event.id, {
          status: 'completed' as CalendarEventStatus,
          article_id: savedArticle.id
        });
      }

      // Call callback if provided
      if (onArticleGenerated) {
        onArticleGenerated(savedArticle.id);
      }

      // Navigate to the article page using callback
      onNavigateToArticle?.(savedArticle.id);

    } catch (error: any) {
      console.error('Failed to generate article:', error);

      let errorMessage = 'Failed to generate the article.';
      if (error?.status === 503 || error?.message?.includes('overloaded')) {
        errorMessage = 'AI service is currently overloaded. Please wait a few minutes and try again.';
      } else if (error?.status === 429 || error?.message?.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setGenerationError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }

  if (!isOpen) return null;

  const tones = ['Authoritative', 'Formal', 'Professional', 'Casual', 'Funny'];

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-4 relative animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">{event?.id ? 'Edit Event' : 'New Event'}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('event')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'event'
                ? 'text-white border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Event Details
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'generate'
                ? 'text-white border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Generate Article
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {activeTab === 'event' ? (
          /* Event Edit Tab */
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">Topic</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDateStr}
                    onChange={e => setStartDateStr(e.target.value)}
                    className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDateStr}
                    onChange={e => setEndDateStr(e.target.value)}
                    className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select
                  id="status"
                  value={status}
                    onChange={e => setStatus(e.target.value as CalendarEventStatus)}
                    className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  >
                    {statuses.map(s => (
                      <option key={s} value={s} className={`capitalize bg-slate-800 ${statusColors[s]}`}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={4}
                    className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                <div>
                  {event?.id && (
                    <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-500/50 transition-colors">
                    {isSaving ? 'Saving...' : 'Save Event'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Article Generation Tab */
            <div className="space-y-6">
              {/* Generation Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="gen-location" className="text-sm font-medium text-slate-300 flex items-center">
                    <GeoIcon className="w-4 h-4 mr-2 text-sky-400" />
                    Target Location
                  </label>
                  <div className="relative transition-all duration-300" ref={locationDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsLocationOpen(!isLocationOpen)}
                      className="relative w-full cursor-pointer rounded-md bg-slate-900/80 border border-slate-700 py-2 pl-3 pr-10 text-left text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm transition-all duration-300 pr-10"
                    >
                      <span className="block truncate">{location || 'Select a Country...'}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg className={`h-5 w-5 text-gray-400 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
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
                </div>

                <div className="flex flex-col space-y-2">
                  <label htmlFor="gen-tone" className="text-sm font-medium text-slate-300 flex items-center">
                    <MegaphoneIcon className="w-4 h-4 mr-2 text-sky-400" />
                    Tone of Voice
                  </label>
                  <div className="relative" ref={toneDropdownRef}>
                    <button type="button" onClick={() => setIsToneOpen(!isToneOpen)} className="relative w-full cursor-default rounded-md bg-slate-900/80 border border-slate-700 py-2 pl-3 pr-10 text-left text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm">
                      <span className="block truncate">{tone || 'Select a Tone...'}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg className={`h-5 w-5 text-gray-400 transition-transform ${isToneOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
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

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h5a1 1 0 011 1v2m2 0H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2z" />
                    </svg>
                    Topic
                  </label>
                  <div className="block w-full rounded-md border-0 bg-slate-900/80 py-2 px-3 text-slate-100 ring-1 ring-inset ring-white/10">
                    {title || 'Enter topic in Event Details tab'}
                  </div>
                </div>
              </div>

              {/* Brief */}
              <div>
                <label htmlFor="gen-brief" className="block text-sm font-medium text-slate-300 mb-2">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Brief (Optional)
                </label>
                <textarea
                  id="gen-brief"
                  value={brief}
                  onChange={e => setBrief(e.target.value)}
                  rows={3}
                  placeholder="Add specific requirements or focus areas for your article..."
                  className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Internal Links */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <ToggleSwitch
                    id="enable-links"
                    checked={enableInternalLinks}
                    onChange={setEnableInternalLinks}
                  />
                  <label htmlFor="enable-links" className="text-sm font-medium text-slate-300 flex items-center cursor-pointer">
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Add Internal Links (SEO Boost)
                  </label>
                </div>

                {enableInternalLinks && (
                  <div className="ml-7">
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={e => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      We'll analyze your website and add relevant internal links to improve SEO.
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {generationError && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg">
                  <p>{generationError}</p>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleGenerateArticle}
                  disabled={isGenerating || !title.trim() || !location.trim() || !tone}
                  className="flex items-center justify-center px-6 py-3 rounded-full text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating Article...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Article
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
