import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { SparkleIcon } from './icons/SparkleIcon';
import { SendIcon } from './icons/SendIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import type { Article, KeywordSuggestion } from '../types';
import { countries } from '../data/countries';
import { generateKeywordSuggestions, getKeywordVolume } from '../services/geminiService';
import { GeoIcon } from './icons/GeoIcon';
import { TopicIcon } from './icons/TopicIcon';
import { TrendIcon } from './icons/TrendIcon';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

// --- Skeleton Loader for Suggestions ---
const SuggestionSkeleton: React.FC = () => (
  <div className="space-y-2 animate-pulse">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center justify-between p-3 rounded-md bg-slate-700/50">
        <div className="h-4 bg-slate-600 rounded w-3/5"></div>
        <div className="h-4 bg-slate-600 rounded w-1/5"></div>
      </div>
    ))}
  </div>
);


// --- Keyword Generator View ---
const KeywordGeneratorView: React.FC<{
  setTopic: (topic: string) => void;
  setLocation: (location: string) => void;
  closeAssistant: () => void;
}> = ({ setTopic, setLocation, closeAssistant }) => {
  const [keyword, setKeyword] = useState('');
  const [internalLocation, setInternalLocation] = useState('');
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [baseKeywordVolume, setBaseKeywordVolume] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  const fetchKeywordData = useCallback(async (currentKeyword: string, currentLocation: string) => {
    if (!currentKeyword.trim() || !currentLocation) {
      setSuggestions([]);
      setBaseKeywordVolume(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [suggestionsResult, volumeResult] = await Promise.all([
        generateKeywordSuggestions(currentKeyword, currentLocation),
        getKeywordVolume(currentKeyword, currentLocation)
      ]);
      setSuggestions(suggestionsResult);
      setBaseKeywordVolume(volumeResult);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to get keyword data. ${errorMessage}`);
      setSuggestions([]);
      setBaseKeywordVolume(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = window.setTimeout(() => {
      fetchKeywordData(keyword, internalLocation);
    }, 500);
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [keyword, internalLocation, fetchKeywordData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationSelect = (country: string) => {
    setInternalLocation(country);
    setLocationSearch('');
    setIsLocationOpen(false);
  };

  const filteredCountries = countries.filter(c => c.toLowerCase().includes(locationSearch.toLowerCase()));

  const handleSuggestionClick = (suggestion: KeywordSuggestion) => {
    setTopic(suggestion.keyword);
    setLocation(internalLocation);
    closeAssistant();
  };

  return (
    <div className="p-4 flex flex-col flex-1 min-h-0">
      <p className="text-center text-slate-400 mb-4 text-sm">Which keywords do you want to generate content about?</p>
      <div className="space-y-4 mb-4 shrink-0">
        {/* Keyword Input */}
        <div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <TopicIcon className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., 'cosmetic surgery'"
              className="block w-full rounded-md border-0 bg-slate-900/80 py-3 pl-10 pr-28 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
              autoFocus
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              {isLoading && keyword.trim() && internalLocation ? (
                <div className="h-4 bg-slate-600 rounded w-16 animate-pulse"></div>
              ) : baseKeywordVolume !== null && keyword.trim() && internalLocation ? (
                <span className="flex items-center gap-2 text-sm text-slate-400">
                  <TrendIcon className="h-4 w-4" />
                  {baseKeywordVolume.toLocaleString()}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        {/* Location Dropdown */}
        <div className="relative" ref={locationDropdownRef}>
          <button type="button" onClick={() => setIsLocationOpen(!isLocationOpen)} className="relative w-full cursor-default rounded-md bg-slate-900/80 py-3 pl-10 pr-10 text-left text-white shadow-sm ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><GeoIcon className="h-5 w-5 text-slate-500" /></span>
            <span className="block truncate">{internalLocation || 'Select a Country...'}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <svg className={`h-5 w-5 text-gray-400 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </span>
          </button>
          <div className={`absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-slate-700 transition-all ${isLocationOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="p-2"><input type="text" placeholder="Search..." value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} className="block w-full rounded-md border-0 bg-slate-900/80 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm" /></div>
            <ul role="listbox">{filteredCountries.map(c => <li key={c} className="text-white relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-indigo-500/30" onClick={() => handleLocationSelect(c)}><span className="font-normal block truncate">{c}</span>{internalLocation === c && <span className="text-indigo-400 absolute inset-y-0 right-0 flex items-center pr-4"><CheckIcon className="h-5 w-5" /></span>}</li>)}</ul>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto rounded-lg bg-slate-900/50 p-2 border border-slate-700/50">
        {isLoading && <SuggestionSkeleton />}
        {error && <div className="flex justify-center items-center h-full text-red-400 p-4 text-center">{error}</div>}
        {!isLoading && !error && suggestions.length === 0 && <div className="flex justify-center items-center h-full text-slate-500 px-4 text-center">Enter a keyword and select a location to see suggestions.</div>}
        {!isLoading && !error && suggestions.length > 0 && (
          <ul className="space-y-1">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button onClick={() => handleSuggestionClick(s)} className="w-full flex items-center justify-between text-left p-3 rounded-md hover:bg-indigo-500/20 group transition-colors">
                  <span className="text-slate-200 group-hover:text-indigo-300">{s.keyword}</span>
                  <span className="flex items-center gap-2 text-sm text-slate-400 group-hover:text-slate-200">
                    <TrendIcon className="h-4 w-4" />
                    {s.volume.toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// --- Chatbot View ---
interface Message { role: 'user' | 'model'; text: string; }
interface ChatSession { chat: Chat; messages: Message[]; headings: string[]; }
const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(textToCopy).then(() => { setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }); };
  return <button onClick={handleCopy} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-600" aria-label="Copy message">{isCopied ? <CheckIcon className="h-4 w-4 text-green-400" /> : <CopyIcon className="h-4 w-4" />}</button>;
};
const ChatView: React.FC<{ article: Article | null }> = ({ article }) => {
  const [currentSessionId, setCurrentSessionId] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [headings, setHeadings] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sessionsRef = useRef<Record<string, ChatSession>>({});
  const [showHeadings, setShowHeadings] = useState(false);
  const [filteredHeadings, setFilteredHeadings] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headingsRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (headingsRef.current && !headingsRef.current.contains(event.target as Node) && inputRef.current && !inputRef.current.contains(event.target as Node)) { setShowHeadings(false); } };
    if (showHeadings) { document.addEventListener('mousedown', handleClickOutside); }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHeadings]);

  useEffect(() => {
    const sessionId = article ? article.id : 'general';
    setCurrentSessionId(sessionId);
    if (!sessionsRef.current[sessionId]) {
      let systemInstruction: string, initialMessage: Message, extractedHeadings: string[] = [];
      if (article) {
        systemInstruction = `You are an expert assistant for content analysis. You will answer questions based *only* on the provided article context. The article is titled: "${article.title}". Here is the full content:\n\n${article.articleContent}\n\nDo not use any external knowledge. If the answer is not in the article, state that the information is not available in the provided text. Keep your answers concise and directly related to the user's question about the article. When a user refers to a heading with a '#', understand they are referring to that specific section of the article.`;
        initialMessage = { role: 'model', text: `Hello! I'm ready to answer your questions about the article: "${article.title}".\n\nType '#' to quickly reference a section heading.` };
        extractedHeadings = [...article.articleContent.matchAll(/^##\s(.*)/gm)].map(match => match[1].trim());
      } else {
        systemInstruction = "You are an AI assistant focused on content creation and writing assistance. You help with article writing, keyword research, content analysis, and writing-related tasks. Keep your answers focused on these topics and avoid general conversation. If a question is not related to content creation or writing tasks, politely redirect to relevant topics.";
        initialMessage = { role: 'model', text: 'Hello! I\'m here to help with content creation, article writing, keyword research, and writing-related tasks. How can I assist you today?' };
      }
      sessionsRef.current[sessionId] = { chat: ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } }), messages: [initialMessage], headings: extractedHeadings };
    }
    setMessages(sessionsRef.current[sessionId].messages);
    setHeadings(sessionsRef.current[sessionId].headings);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [article]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const session = sessionsRef.current[currentSessionId];
    if (!input.trim() || isLoading || !session) return;
    const userMessage: Message = { role: 'user', text: input };
    const updatedMessages = [...session.messages, userMessage];
    setMessages(updatedMessages); session.messages = updatedMessages;
    const currentInput = input; setInput(''); setShowHeadings(false); setIsLoading(true);
    try {
      const response = await session.chat.sendMessage({ message: currentInput });
      const finalMessages: Message[] = [...updatedMessages, { role: 'model', text: response.text }];
      setMessages(finalMessages); session.messages = finalMessages;
    } catch (err) {
      const errorResponseMessage: Message = { role: 'model', text: `Sorry, I couldn't get a response. Please try again.` };
      const finalMessages = [...updatedMessages, errorResponseMessage];
      setMessages(finalMessages); session.messages = finalMessages;
    } finally { setIsLoading(false); }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; setInput(value);
    if (article && headings.length > 0) {
      const lastHashIndex = value.lastIndexOf('#');
      if (lastHashIndex !== -1) {
        const query = value.substring(lastHashIndex + 1);
        const filtered = headings.filter(h => h.toLowerCase().includes(query.toLowerCase()));
        setFilteredHeadings(filtered); setShowHeadings(filtered.length > 0);
      } else { setShowHeadings(false); }
    }
  };
  const handleHeadingSelect = (heading: string) => { setInput(`${input.substring(0, input.lastIndexOf('#'))}#${heading} `); setShowHeadings(false); inputRef.current?.focus(); };
  return <>
    <div className="flex-1 p-4 space-y-4 overflow-y-auto relative">
      {article && <div className="p-3 bg-slate-700/50 rounded-lg text-sm text-slate-400 border border-slate-700 mb-2 sticky top-0 backdrop-blur-sm z-10"><p><strong className="text-slate-300">Context:</strong> Asking about "{article.title}"</p></div>}
      {messages.map((msg, index) => <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>{msg.role === 'model' && <div className="shrink-0 h-8 w-8 rounded-full bg-indigo-500/50 flex items-center justify-center"><SparkleIcon className="h-5 w-5 text-indigo-300" /></div>}<div className={`max-w-md p-3 rounded-2xl group relative ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-lg' : 'bg-slate-700 text-slate-200 rounded-bl-lg'}`}>{msg.role === 'user' ? <p className="whitespace-pre-wrap">{msg.text}</p> : <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{msg.text}</ReactMarkdown></div>}{msg.role === 'model' && <div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100"><CopyButton textToCopy={msg.text} /></div>}</div></div>)}
      {isLoading && <div className="flex items-start gap-3"><div className="shrink-0 h-8 w-8 rounded-full bg-indigo-500/50 flex items-center justify-center"><SparkleIcon className="h-5 w-5 text-indigo-300" /></div><div className="max-w-md p-3 rounded-2xl bg-slate-700 text-slate-200 rounded-bl-lg flex items-center gap-2"><span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span><span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span><span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span></div></div>}
      <div ref={chatEndRef} />
    </div>
    <div className="p-4 border-t border-slate-700 shrink-0 relative">
      {showHeadings && filteredHeadings.length > 0 && <div ref={headingsRef} className="absolute bottom-full left-4 right-4 mb-2 bg-slate-900 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10 animate-fade-in-up" style={{ animationDuration: '0.2s' }}><ul className="p-1">{filteredHeadings.map((h, i) => <li key={i}><button onClick={() => handleHeadingSelect(h)} className="w-full text-left px-3 py-2 text-sm text-slate-300 rounded-md hover:bg-indigo-500/30">{h}</button></li>)}</ul></div>}
      <form onSubmit={handleSendMessage} className="relative"><input ref={inputRef} type="text" value={input} onChange={handleInputChange} placeholder={article ? "Ask about the article or type '#'..." : "Ask me anything..."} className="w-full bg-slate-700/80 text-white rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={isLoading} /><button type="submit" disabled={!input.trim() || isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-500 text-white disabled:bg-slate-600 hover:bg-indigo-400" aria-label="Send message"><SendIcon className="h-5 w-5" /></button></form>
    </div>
  </>;
};

// --- Main Assistant Component ---
interface AiAssistantProps {
  article: Article | null;
  currentPage: 'generator' | 'dashboard' | 'article' | 'profile' | 'calendar';
  setTopic: (topic: string) => void;
  setLocation: (location: string) => void;
}
export const AiAssistant: React.FC<AiAssistantProps> = ({ article, currentPage, setTopic, setLocation }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getTitle = () => {
    if (currentPage === 'generator') return 'Keyword Idea Generator';
    return 'AI Assistant';
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-indigo-500 text-white p-4 rounded-full shadow-lg hover:bg-indigo-400 transition-all transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-indigo-500 z-40" aria-label="Open AI Assistant"><SparkleIcon className="h-6 w-6" /></button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center animate-fade-in" onClick={() => setIsOpen(false)}>
          <div className="bg-slate-800/90 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] sm:h-[70vh] flex flex-col animate-fade-in-up" style={{ animationDelay: '0.1s' }} role="dialog" aria-modal="true" aria-labelledby="ai-assistant-title" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between p-4 border-b border-slate-700 shrink-0">
              <h2 id="ai-assistant-title" className="text-lg font-semibold text-white flex items-center gap-2"><SparkleIcon className="h-5 w-5 text-indigo-400" /> {getTitle()}</h2>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white" aria-label="Close AI Assistant"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </header>
            {currentPage === 'generator' ? (
              <KeywordGeneratorView setTopic={setTopic} setLocation={setLocation} closeAssistant={() => setIsOpen(false)} />
            ) : (
              <ChatView article={article} />
            )}
          </div>
        </div>
      )}
    </>
  );
};
