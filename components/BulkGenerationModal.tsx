import React, { useState, useRef, useEffect } from 'react';
import { useBulkGeneration } from './BulkGenerationContext';
import { BulkGenerationRequest } from '../types';
import { countries } from '../data/countries';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { GeoIcon } from './icons/GeoIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { TopicIcon } from './icons/TopicIcon';
import { ToggleSwitch } from './ToggleSwitch';

interface BulkGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkGenerationModal({ isOpen, onClose }: BulkGenerationModalProps) {
  const { startBulkGeneration, state } = useBulkGeneration();
  const [isExpanded, setIsExpanded] = useState(false);
  const [topics, setTopics] = useState<string[]>(['']);
  const [location, setLocation] = useState('');
  const [tone, setTone] = useState('');
  const [count, setCount] = useState(1);
  const [contentQuality, setContentQuality] = useState<string[]>(['Comprehensive', 'SEO-Optimized']);
  const [enableInternalLinks, setEnableInternalLinks] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown states
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isToneOpen, setIsToneOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const toneDropdownRef = useRef<HTMLDivElement>(null);

  const tones = ['Authoritative', 'Formal', 'Professional', 'Casual', 'Funny'];

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

  const handleAddTopic = () => {
    if (topics.length >= 8) {
      alert('Maximum 8 topics allowed');
      return;
    }
    setTopics([...topics, '']);
  };

  const handleRemoveTopic = (index: number) => {
    if (topics.length > 1) {
      setTopics(topics.filter((_, i) => i !== index));
    }
  };

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  const handleTopicPaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    // Sadece ilk input'a paste yapıldığında çalış
    if (index !== 0) return;

    event.preventDefault();
    const pasteData = event.clipboardData.getData('text');

    if (!pasteData.trim()) return;

    // Satırlara böl ve temizle
    const lines = pasteData
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length <= 1) {
      // Tek satır ise normal paste işlemi
      handleTopicChange(index, pasteData.trim());
      return;
    }

    // Çoklu satır ise tüm topic'leri güncelle ama maksimum 8'e sınırla
    let newTopics = [...lines];

    // Maksimum 8 topic limiti uygula
    if (newTopics.length > 8) {
      newTopics = newTopics.slice(0, 8);
      alert('Maximum 8 topics allowed. Only first 8 topics were added.');
    }

    // İlk topic için mevcut değeri koru, diğerleri için yeni satırları ekle
    if (topics.length > 1) {
      // Eğer zaten birden fazla topic varsa, sadece ilkini güncelle
      newTopics[0] = pasteData.split('\n')[0].trim();
    }

    setTopics(newTopics);
  };

  const handleLocationSelect = (country: string) => {
    setLocation(country);
    setLocationSearch('');
    setIsLocationOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const validTopics = topics.filter(topic => topic.trim() !== '');
    if (validTopics.length === 0) {
      alert('Please enter at least one topic');
      return;
    }

    if (!location.trim()) {
      alert('Please enter a location');
      return;
    }

    if (!tone.trim()) {
      alert('Please enter a tone');
      return;
    }

    // Internal links validation
    if (enableInternalLinks && !websiteUrl.trim()) {
      alert('Please enter a website URL for internal linking');
      return;
    }

    setIsSubmitting(true);

    try {
      const request: BulkGenerationRequest = {
        topics: validTopics,
        location: location.trim(),
        tone: tone.trim(),
        contentQuality,
        count,
        enableInternalLinks,
        websiteUrl: enableInternalLinks ? websiteUrl.trim() : undefined,
      };

      // Note: userId will be passed from the context, so we don't need to pass it here
      await startBulkGeneration(request);
      onClose();
    } catch (error) {
      console.error('Failed to start bulk generation:', error);
      alert('Failed to start bulk generation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const filteredCountries = countries.filter(c => c.toLowerCase().includes(locationSearch.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-slate-100">Bulk Article Generation</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Topics Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-slate-300 flex items-center">
                <TopicIcon className="w-4 h-4 mr-2 text-sky-400" />
                Topics ({topics.filter(t => t.trim()).length}/8)
              </label>
              <button
                type="button"
                onClick={handleAddTopic}
                disabled={topics.length >= 8}
                className="inline-flex items-center px-3 py-1 text-sm text-sky-400 hover:text-sky-300 hover:bg-slate-700/50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Topic
              </button>
            </div>

            <div className="space-y-3">
              {topics.map((topic, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => handleTopicChange(index, e.target.value)}
                      onPaste={(e) => handleTopicPaste(index, e)}
                      placeholder={`Enter topic ${index + 1}`}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-md px-4 py-2 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
                      required
                    />
                  </div>
                  {topics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(index)}
                      className="text-red-400 hover:text-red-300 transition-colors p-2"
                      title="Remove topic"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location Searchable Dropdown */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center">
                <GeoIcon className="w-4 h-4 mr-2 text-sky-400" />
                Target Location
              </label>
              <div className="relative transition-all duration-300" ref={locationDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                  className="relative w-full cursor-default rounded-md bg-slate-900/80 border border-slate-700 py-2 pl-3 pr-10 text-left text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm transition-all duration-300"
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
            </div>

            {/* Tone of Voice Dropdown */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center">
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

          {/* Advanced Settings */}
          <div>
            <button
              type="button"
              onClick={toggleExpanded}
              className="flex items-center text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors mb-4"
            >
              {isExpanded ? (
                <>
                  <ChevronUpIcon className="w-4 h-4 mr-1" />
                  Hide Advanced Settings
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-4 h-4 mr-1" />
                  Show Advanced Settings
                </>
              )}
            </button>

            {isExpanded && (
              <div className="space-y-4 p-4 bg-slate-900/50 rounded-md border border-slate-700">
                {/* Internal Links Section */}
                <div>
                  <div className="flex items-center space-x-3 mb-3">
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
                    <div className="space-y-2 ml-12">
                      <label htmlFor="websiteUrl" className="text-sm font-medium text-slate-300 block">
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
                      <p className="text-xs text-slate-500">
                        We'll analyze your website and add relevant internal links to improve SEO.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700">
            <h3 className="text-sm font-medium text-sky-400 mb-2">Generation Summary</h3>
            <div className="text-sm text-slate-300 space-y-1">
              <p>• Topics: {topics.filter(t => t.trim()).length}</p>
              <p>• Total Articles: {topics.filter(t => t.trim()).length}</p>
              <p>• Target Location: {location}</p>
              <p>• Tone: {tone}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 border border-slate-600 rounded-md hover:bg-slate-600/50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-sky-600 border border-transparent rounded-md hover:bg-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isSubmitting || state.isGenerating}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Starting...
                </>
              ) : (
                'Start Generation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
