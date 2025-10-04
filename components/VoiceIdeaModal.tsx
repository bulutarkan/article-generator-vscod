import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, Square, ChevronDown, Wand2, Check } from 'lucide-react';
import { refineDictationText, analyzeVoiceForTopic } from '../services/geminiService';
import { countries } from '../data/countries';
import { Loader } from './Loader';

interface VoiceIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLocation?: string;
  onApply: (topic: string, prompt: string, chosenLocation?: string) => void;
}

const languageOptions = [
  { code: 'tr-TR', label: 'Türkçe' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'es-ES', label: 'Español' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'ru-RU', label: 'Русский' },
  { code: 'ar-SA', label: 'العربية' },
];

export const VoiceIdeaModal: React.FC<VoiceIdeaModalProps> = ({ isOpen, onClose, defaultLocation, onApply }) => {
  const [location, setLocation] = useState<string>(defaultLocation || '');
  const [transcript, setTranscript] = useState<string>('');
  const [interim, setInterim] = useState<string>('');
  const [listening, setListening] = useState<boolean>(false);
  const [supportsSpeech, setSupportsSpeech] = useState<boolean>(false);
  const [speechLang, setSpeechLang] = useState<string>('tr-TR');
  const [langOpen, setLangOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [resultTopic, setResultTopic] = useState<string>('');
  const [resultPrompt, setResultPrompt] = useState<string>('');
  const recRef = useRef<any>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const locDropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [locOpen, setLocOpen] = useState<boolean>(false);
  const [locSearch, setLocSearch] = useState<string>('');
  const [animIn, setAnimIn] = useState<boolean>(false);

  useEffect(() => {
    const w = window as any;
    setSupportsSpeech(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    setLocation(defaultLocation || '');
  }, [defaultLocation]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (locDropdownRef.current && !locDropdownRef.current.contains(e.target as Node)) {
        setLocOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    // play enter animation on mount
    setAnimIn(false);
    const id = requestAnimationFrame(() => setAnimIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setAnimIn(false);
    setTimeout(() => onClose(), 180);
  };

  const insertText = (text: string) => {
    setTranscript(prev => (prev ? prev + ' ' : '') + text);
  };

  const startVoice = () => {
    setError(null);
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    const recognition = new SR();
    recognition.lang = speechLang;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = async (event: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t + ' ';
        else interimText += t + ' ';
      }
      setInterim(interimText.trim());
      if (finalText) {
        let cleaned = finalText.trim();
        try {
          cleaned = await refineDictationText(cleaned, recognition.lang);
        } catch {}
        insertText(cleaned);
        setInterim('');
      }
    };
    recognition.onerror = (e: any) => {
      setError(e?.error === 'not-allowed' ? 'Microphone permission denied.' : 'Speech recognition error.');
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
      recRef.current = recognition;
      setListening(true);
      // Focus transcript box for visual cue
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      setError('Unable to start speech recognition.');
      setListening(false);
    }
  };

  const stopVoice = () => {
    try { recRef.current?.stop?.(); } finally { setListening(false); setInterim(''); }
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setResultTopic('');
    setResultPrompt('');
    try {
      // We already refine chunks during dictation; one more global refine helps
      const refined = await refineDictationText(transcript, speechLang);
      const res = await analyzeVoiceForTopic(refined, location || '', speechLang);
      setResultTopic(res.topic || '');
      setResultPrompt(res.prompt || '');
    } catch (e: any) {
      setError(e?.message || 'Failed to analyze with AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${animIn ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />
      <div className={`relative w-full max-w-2xl mx-4 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-5 transform-gpu transition-all duration-200 ${animIn ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-100 font-semibold">
            <Wand2 className="w-5 h-5 text-sky-400" />
            <span>Let AI Do This</span>
          </div>
          <button onClick={handleClose} className="p-1 hover:bg-slate-800 rounded" title="Close">
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs text-slate-300">Target Location</label>
            <div className="relative mt-1" ref={locDropdownRef}>
              <button
                type="button"
                onClick={() => setLocOpen(v => !v)}
                className="relative w-full cursor-default rounded-md bg-slate-900/80 border border-slate-700 py-2 pl-3 pr-10 text-left text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm"
              >
                <span className="block truncate">{location || 'Select a Country...'}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${locOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {locOpen && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-slate-700">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={locSearch}
                      onChange={(e) => setLocSearch(e.target.value)}
                      className="block w-full rounded-md border-0 bg-slate-900/80 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm"
                    />
                  </div>
                  <ul role="listbox">
                    {countries
                      .filter(c => c.toLowerCase().includes(locSearch.toLowerCase()))
                      .map(c => (
                        <li key={c} className="text-white relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-sky-500/30" onClick={() => { setLocation(c); setLocOpen(false); setLocSearch(''); }}>
                          <span className="font-normal block truncate">{c}</span>
                          {location === c && (
                            <span className="text-sky-400 absolute inset-y-0 right-0 flex items-center pr-4">
                              <Check className="h-5 w-5" />
                            </span>
                          )}
                        </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300">Tell AI what you want (voice)</label>
              <div className="flex items-center gap-2">
                <div className="relative" ref={langDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setLangOpen(v => !v)}
                    className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-md border text-[11px] transition-colors ${
                      langOpen ? 'bg-slate-700/60 border-slate-600 text-slate-100' : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                    }`}
                    title="Recognition language"
                  >
                    <span>{languageOptions.find(l => l.code === speechLang)?.label || 'Language'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {langOpen && (
                    <ul className="absolute right-0 mt-2 w-40 max-h-56 overflow-auto bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50 text-[12px] py-1">
                      {languageOptions.map(opt => (
                        <li key={opt.code} onClick={() => { setSpeechLang(opt.code); setLangOpen(false); }} className={`px-3 py-1.5 cursor-pointer hover:bg-sky-500/20 ${opt.code === speechLang ? 'bg-slate-700/40' : ''}`}>
                          {opt.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {supportsSpeech ? (
                  <button
                    type="button"
                    onClick={listening ? stopVoice : startVoice}
                    className={`inline-flex items-center px-3 py-1.5 rounded-md border transition-colors text-xs ${
                      listening ? 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30' : 'bg-slate-700/60 border-slate-600 text-slate-200 hover:bg-slate-600'
                    }`}
                    title="Voice-to-text"
                    aria-label="Voice-to-text"
                  >
                    {listening ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                ) : (
                  <button type="button" disabled className="inline-flex items-center px-3 py-1.5 rounded-md border bg-slate-800/60 border-slate-700 text-slate-500 cursor-not-allowed text-xs" title="Speech recognition not supported">
                    <MicOff className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div ref={inputRef} className={`mt-2 rounded-md border ${listening ? 'border-sky-500/60' : 'border-slate-700'} bg-slate-900/70` }>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Start speaking or type your brief here..."
                className="w-full p-3 min-h-[120px] text-sm text-slate-100 bg-transparent outline-none resize-y"
              />
              {interim && (
                <div className="px-3 pb-3 text-[11px] text-slate-400 italic truncate" aria-live="polite">{interim}</div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button onClick={() => setTranscript('')} className="text-[11px] px-2 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-700" title="Clear">Clear</button>
              <button onClick={handleAnalyze} disabled={!transcript.trim() || isAnalyzing} className="text-[12px] px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white">
                {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
              </button>
            </div>
          </div>

          {error && <div className="text-xs text-red-400">{error}</div>}

          {(resultTopic || resultPrompt) && (
            <div className="mt-2 p-3 rounded-md border border-slate-700 bg-slate-800/60">
              <div className="text-xs text-slate-400 mb-1">Suggested Topic</div>
              <div className="text-sm text-slate-100 font-medium mb-2">{resultTopic || '-'}</div>
              <div className="text-xs text-slate-400 mb-1">Suggested Prompt for Generator</div>
              <div className="text-sm text-slate-100 whitespace-pre-wrap">{resultPrompt || '-'}</div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 mt-1">
            <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Cancel</button>
            <button
              onClick={() => {
                onApply(resultTopic || '', resultPrompt || '', location || undefined);
                onClose();
              }}
              disabled={!resultTopic}
              className="px-3 py-1.5 text-sm rounded-md bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white"
            >
              Use This
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceIdeaModal;
