import React from 'react';
import SkeletonLoader from './SkeletonLoader';
import { ArticleCardSkeleton } from './ArticleCardSkeleton';

// Skeleton for Dashboard header controls, quick chips, stats and cards
export const DashboardSkeleton: React.FC<{ cardCount?: number }> = ({ cardCount = 6 }) => {
  return (
    <div className="animate-fade-in">
      {/* Header controls skeleton */}
      <div className="relative mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filters button */}
          <SkeletonLoader height={36} width={100} className="rounded-lg" />
          {/* Search input */}
          <div className="flex-1 min-w-[220px] max-w-sm">
            <SkeletonLoader height={40} className="rounded-lg" />
          </div>
          {/* Right side buttons */}
          <SkeletonLoader height={36} width={110} className="rounded-lg" />
          <SkeletonLoader height={36} width={110} className="rounded-lg" />
        </div>
      </div>

      {/* Top Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-3 mb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass p-4">
            <div className="flex items-center gap-3">
              <SkeletonLoader height={36} width={36} className="rounded-lg" />
              <div className="flex-1">
                <SkeletonLoader height={14} width={90} className="mb-2" />
                <SkeletonLoader height={16} width={70} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick filter chips skeleton */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLoader key={i} height={28} width={100} className="rounded-full" />
        ))}
      </div>

      {/* Article cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: cardCount }).map((_, index) => (
          <ArticleCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export default DashboardSkeleton;

