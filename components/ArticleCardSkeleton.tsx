import React from 'react';
import SkeletonLoader from './SkeletonLoader';

export const ArticleCardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-800/70 p-5 rounded-xl border border-slate-700 shadow-lg">
      <div className="flex flex-col h-full">
        {/* Title */}
        <SkeletonLoader height={28} width={200} className="mb-4" />

        {/* Stats */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <SkeletonLoader height={16} width={20} />
            <SkeletonLoader height={16} width={150} />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonLoader height={16} width={20} />
            <SkeletonLoader height={16} width={180} />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonLoader height={16} width={20} />
            <SkeletonLoader height={16} width={120} />
          </div>
        </div>

        {/* Tags and Actions */}
        <div className="mt-auto pt-5">
          <div className="flex justify-between items-end">
            <div className="flex flex-wrap gap-2">
              <SkeletonLoader height={24} width={80} />
              <SkeletonLoader height={24} width={90} />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonLoader height={32} width={32} className="rounded-full" />
              <SkeletonLoader height={32} width={70} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
