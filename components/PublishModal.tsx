import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Article, UserIntegration } from '../types';
import { getIntegrations } from '../services/supabase';
import { publishToWordPress, publishToMedium } from '../services/publishingService';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, article }) => {
  const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState<string | null>(null); // provider name
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchIntegrations = async () => {
        try {
          setIsLoading(true);
          setError(null);
          setSuccess(null);
          const data = await getIntegrations();
          setIntegrations(data || []);
        } catch (e: any) {
          setError('Failed to load integrations. Check your profile settings.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchIntegrations();
    }
  }, [isOpen]);

  const handlePublish = async (provider: 'wordpress' | 'medium') => {
    setIsPublishing(provider);
    setError(null);
    setSuccess(null);
    try {
      let result;
      if (provider === 'wordpress') {
        result = await publishToWordPress(article);
      } else {
        result = await publishToMedium(article);
      }
      setSuccess(`Successfully published to ${provider} as a draft!`);
      console.log('Publishing result:', result);
    } catch (e: any) {
      if (e.response && e.response.status === 401) {
        setError(`Authentication failed for ${provider}. Please check the credentials in your profile settings.`);
      } else {
        setError(e.message || `An unknown error occurred while publishing to ${provider}.`);
      }
    } finally {
      setIsPublishing(null);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div 
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md m-4 p-6 relative animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors">&times;</button>
        <h2 className="text-xl font-bold text-white mb-4">Publish Article</h2>
        <p className="text-slate-400 mb-6">Choose a platform to publish "{article.title}" as a draft.</p>

        {isLoading && <div className="text-center text-slate-300">Loading integrations...</div>}
        
        <div className="space-y-3">
          {integrations.map(int => (
            <button 
              key={int.id}
              onClick={() => handlePublish(int.provider)}
              disabled={isPublishing !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:bg-indigo-500/50 disabled:cursor-wait"
            >
              {isPublishing === int.provider ? `Publishing to ${int.provider}...` : `Publish to ${int.provider}`}
            </button>
          ))}
        </div>

        {!isLoading && integrations.length === 0 && (
            <div className="text-center text-slate-400 border border-dashed border-slate-600 p-6 rounded-lg">
                <p>No publishing integrations found.</p>
                <p className="text-sm mt-2">Please add WordPress or Medium in your profile settings.</p>
            </div>
        )}

        {error && <p className="text-sm text-red-400 text-center mt-4">{error}</p>}
        {success && <p className="text-sm text-green-400 text-center mt-4">{success}</p>}

      </div>
    </div>,
    document.body
  );
};
