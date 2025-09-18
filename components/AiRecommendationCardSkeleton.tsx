import React from 'react';
import { motion } from 'framer-motion';

export const AiRecommendationCardSkeleton: React.FC = () => {
  return (
    <motion.div
      className="card p-6 flex flex-col gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-700 h-10 w-10 animate-pulse flex-shrink-0"></div>
        <div className="h-6 bg-slate-700 rounded w-3/4 animate-pulse"></div>
      </div>
      <div className="h-4 bg-slate-700 rounded w-full animate-pulse"></div>
      <div className="h-4 bg-slate-700 rounded w-5/6 animate-pulse"></div>
    </motion.div>
  );
};
