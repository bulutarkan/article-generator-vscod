import React from 'react';
import { useSingleGeneration } from './SingleGenerationContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe, Hash, FileText } from 'lucide-react';

export const SingleGenerationWidget: React.FC = () => {
  const { state, clear } = useSingleGeneration();
  const navigate = useNavigate();
  const location = useLocation();

  const isGeneratorPage = location.pathname.includes('/app/generator');

  // Only show on non-generator pages
  const shouldShow = !isGeneratorPage && (state.status === 'running' || state.status === 'success');
  if (!shouldShow) return null;

  const handleSeeArticle = () => {
    if (state.articleId) {
      navigate(`/app/article/${state.articleId}`);
      clear();
    }
  };

  const Chip: React.FC<{ children: React.ReactNode; color?: 'default' | 'indigo'; icon?: React.ReactNode; title?: string }>
    = ({ children, color = 'default', icon, title }) => (
      <span
        title={typeof children === 'string' ? children : title}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium truncate max-w-[220px] ${
          color === 'indigo'
            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
      </span>
    );

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[280px] max-w-[90vw] w-full sm:min-w-[340px] sm:max-w-[420px]">
        {state.status === 'running' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <div className="text-sm font-semibold text-gray-900">Generating article…</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Chip icon={<Hash className="w-3.5 h-3.5 text-slate-500" />}>
                {state.topic}
              </Chip>
              <Chip color="indigo" icon={<Globe className="w-3.5 h-3.5" />}>
                {state.location}
              </Chip>
            </div>
          </div>
        )}
        {state.status === 'success' && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">Article ready</div>
            <div className="flex items-center gap-2">
              <Chip icon={<FileText className="w-3.5 h-3.5 text-slate-500" />} title={state.articleTitle}>
                {state.articleTitle || 'Untitled'}
              </Chip>
            </div>
            <button
              onClick={handleSeeArticle}
              className="w-full inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              See the article
            </button>
          </div>
        )}
        {state.status === 'error' && (
          <div className="text-sm text-red-600">{state.error || 'Generation failed'}</div>
        )}
      </div>
    </div>
  );
};
