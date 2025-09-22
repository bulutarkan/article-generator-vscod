import React from 'react';
import type { Article } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import { TrashIcon } from './icons/TrashIcon';
import { TrendIcon } from './icons/TrendIcon';
import { HashIcon } from './icons/HashIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { SlidersIcon } from './icons/SlidersIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';

interface ArticleCardProps {
  article: Article;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const tagIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  Authoritative: ChatBubbleIcon,
  Extended: SlidersIcon,
  Comprehensive: SlidersIcon,
  Standard: ChatBubbleIcon,
};

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onDelete, onView }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(article.id);
  };

  const formattedDate = new Date(article.createdAt).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div 
      onClick={() => onView(article.id)}
      className="cursor-pointer block group bg-slate-800/70 p-5 rounded-xl border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/10"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onView(article.id); }}
    >
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors duration-300 leading-tight">
          {article.title}
        </h3>
        
        <div className="mt-4 space-y-3 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <TrendIcon className="h-4 w-4 text-slate-500" />
            <span>{article.monthlySearches ? article.monthlySearches.toLocaleString() : '0'} monthly searches</span>
          </div>
          <div className="flex items-center gap-2">
            <HashIcon className="h-4 w-4 text-slate-500" />
            <span className="truncate">{article.primaryKeyword || 'N/A'} <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded-full text-slate-300">{article.keywordDifficulty || '0'}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-slate-500" />
            <span>{formattedDate}</span>
          </div>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex justify-between items-end">
            <div>
              <div className="flex flex-wrap gap-2">
                {article.tone && (
                  <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300">
                    <MegaphoneIcon className="h-3 w-3" />
                    {article.tone}
                  </span>
                )}
                {article.content_quality && article.content_quality.map(tag => {
                  const Icon = tagIcons[tag] || ChatBubbleIcon;
                  return (
                    <span key={tag} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-300">
                      <Icon className="h-3 w-3" />
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDelete}
                className="p-2 rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors duration-200"
                aria-label="Delete article"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-white/10 text-slate-300 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors duration-300">
                <EyeIcon className="h-4 w-4" />
                <span>View</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
