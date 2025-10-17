import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateSeoGeoArticle } from '../services/geminiService';
import { webCrawlerService } from '../services/webCrawlerService';
import * as supabaseService from '../services/supabase';
import type { Article } from '../types';
import { useAuth } from './AuthContext';

type SingleGenStatus = 'idle' | 'running' | 'success' | 'error';

interface SingleGenState {
  status: SingleGenStatus;
  topic: string;
  location: string;
  tone: string;
  startedAt: number | null;
  articleId?: string;
  articleTitle?: string;
  error?: string;
}

interface StartParams {
  topic: string;
  location: string;
  tone: string;
  brief: string;
  enableInternalLinks?: boolean;
  websiteUrl?: string;
  selectedKeywords?: string[];
}

interface SingleGenerationContextType {
  state: SingleGenState;
  start: (params: StartParams) => Promise<Article>;
  clear: () => void;
}

const initialState: SingleGenState = {
  status: 'idle',
  topic: '',
  location: '',
  tone: '',
  startedAt: null,
};

const STORAGE_KEY = 'singleGenerationJob';

const SingleGenerationContext = createContext<SingleGenerationContextType | undefined>(undefined);

export const SingleGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SingleGenState>(initialState);
  const runningRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Persist minimal state for UX continuity across route changes
  useEffect(() => {
    try {
      if (state.status === 'running') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            status: state.status,
            topic: state.topic,
            location: state.location,
            tone: state.tone,
            startedAt: state.startedAt,
          })
        );
      } else if (state.status === 'success') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            status: state.status,
            topic: state.topic,
            location: state.location,
            tone: state.tone,
            startedAt: state.startedAt,
            articleId: state.articleId,
            articleTitle: state.articleTitle,
          })
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, [state]);

  // Restore if needed (route change won't unmount provider, but keep for safety)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.status === 'running' || parsed.status === 'success')) {
          setState(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch {}
  }, []);

  const clear = useCallback(() => {
    setState(initialState);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const start = useCallback(async (params: StartParams): Promise<Article> => {
    if (runningRef.current) {
      throw new Error('Another generation is already running');
    }

    const {
      topic,
      location: targetLocation,
      tone,
      brief,
      enableInternalLinks = false,
      websiteUrl,
      selectedKeywords = []
    } = params;

    if (!user?.id) {
      throw new Error('You must be logged in to generate and save an article.');
    }

    if (!topic.trim() || !targetLocation.trim() || !tone) {
      throw new Error('Topic, location and tone are required.');
    }

    runningRef.current = true;
    setState({ status: 'running', topic, location: targetLocation, tone, startedAt: Date.now() });

    try {
      // Prepare internal links context if requested
      let internalLinksContext = '';
      if (enableInternalLinks && websiteUrl) {
        try {
          const crawlResult = await webCrawlerService.getSuggestedKeywords(websiteUrl, topic);
          internalLinksContext = crawlResult.internalLinksContext || '';
        } catch (err) {
          console.warn('Internal links crawling failed, proceeding without it:', err);
        }
      }

      // Generate article via Gemini
      const generated = await generateSeoGeoArticle(
        topic,
        targetLocation,
        tone,
        brief,
        enableInternalLinks,
        websiteUrl,
        internalLinksContext,
        selectedKeywords
      );

      // Save to Supabase
      const saved = await supabaseService.addArticle({
        ...generated,
        user_id: user.id,
        topic,
        location: targetLocation,
        tone,
      });

      // Update state as success
      setState(prev => ({
        ...prev,
        status: 'success',
        articleId: saved.id,
        articleTitle: saved.title,
      }));

      // If user is still on generator screen, auto-navigate like before
      const onGeneratorPage = window.location.pathname.includes('/app/generator');
      if (onGeneratorPage) {
        navigate(`/app/article/${saved.id}`);
        // After navigating to article page, clear overlay state to avoid duplicate UI
        setTimeout(() => clear(), 0);
      }

      return saved;
    } catch (err: any) {
      const msg = err?.message || 'Generation failed';
      setState(prev => ({ ...prev, status: 'error', error: msg }));
      throw err;
    } finally {
      runningRef.current = false;
    }
  }, [user?.id, navigate]);

  const value = useMemo<SingleGenerationContextType>(() => ({ state, start, clear }), [state, start, clear]);

  return (
    <SingleGenerationContext.Provider value={value}>
      {children}
    </SingleGenerationContext.Provider>
  );
};

export function useSingleGeneration(): SingleGenerationContextType {
  const ctx = useContext(SingleGenerationContext);
  if (!ctx) throw new Error('useSingleGeneration must be used within SingleGenerationProvider');
  return ctx;
}

