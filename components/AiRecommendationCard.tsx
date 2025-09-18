import React from 'react';
import { motion } from 'framer-motion';
import type { AiRecommendation } from '../types';
import { SparkleIcon } from './icons/SparkleIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { BarChartIcon } from './icons/BarChartIcon';
import { InfoIcon } from './icons/InfoIcon';
import { TrendingUpIcon } from '@/components/icons/TrendingUpIcon'; // Assuming this icon exists or will be created
import { TrendingDownIcon } from '@/components/icons/TrendingDownIcon'; // Assuming this icon exists or will be created

interface AiRecommendationCardProps {
  recommendation: AiRecommendation;
}

const iconMap: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  "sparkle": SparkleIcon,
  "calendar": CalendarIcon,
  "file-text": FileTextIcon,
  "bar-chart": BarChartIcon,
  "info": InfoIcon,
  "trend-up": TrendingUpIcon,
  "trend-down": TrendingDownIcon,
  // Add more icon mappings as needed based on what Gemini might return
};

const getColorClasses = (color?: string) => {
  let baseColorClass = '';
  let hoverBorderClass = '';
  let groupHoverTextColorClass = '';

  switch (color) {
    case 'green':
      baseColorClass = 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400';
      hoverBorderClass = 'hover:border-green-500/50';
      groupHoverTextColorClass = 'group-hover:text-green-400';
      break;
    case 'blue':
      baseColorClass = 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400';
      hoverBorderClass = 'hover:border-blue-500/50';
      groupHoverTextColorClass = 'group-hover:text-blue-400';
      break;
    case 'orange':
      baseColorClass = 'from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-400';
      hoverBorderClass = 'hover:border-orange-500/50';
      groupHoverTextColorClass = 'group-hover:text-orange-400';
      break;
    case 'red':
      baseColorClass = 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400';
      hoverBorderClass = 'hover:border-red-500/50';
      groupHoverTextColorClass = 'group-hover:text-red-400';
      break;
    case 'purple':
      baseColorClass = 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400';
      hoverBorderClass = 'hover:border-purple-500/50';
      groupHoverTextColorClass = 'group-hover:text-purple-400';
      break;
    case 'gray':
      baseColorClass = 'from-neutral-500/20 to-neutral-600/20 border-neutral-500/30 text-neutral-400';
      hoverBorderClass = 'hover:border-neutral-500/50';
      groupHoverTextColorClass = 'group-hover:text-neutral-400';
      break;
    default:
      baseColorClass = 'from-primary-500/20 to-accent-500/20 border-primary-500/30 text-primary-400';
      hoverBorderClass = 'hover:border-primary-500/50';
      groupHoverTextColorClass = 'group-hover:text-primary-400';
      break;
  }
  return { baseColorClass, hoverBorderClass, groupHoverTextColorClass };
};

export const AiRecommendationCard: React.FC<AiRecommendationCardProps> = ({ recommendation }) => {
  const IconComponent = recommendation.icon ? iconMap[recommendation.icon] : SparkleIcon;
  const { baseColorClass, hoverBorderClass, groupHoverTextColorClass } = getColorClasses(recommendation.color);

  return (
    <motion.div
      className={`cursor-pointer block group bg-slate-800/70 p-3 rounded-xl border border-slate-700 ${hoverBorderClass} transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/10`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <div className="flex flex-col h-full p-4 gap-2">
        <div className="flex items-center gap-3">
          <motion.div
            className={`p-2 rounded-lg bg-gradient-to-br ${baseColorClass} flex-shrink-0`}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <IconComponent className="h-6 w-6" />
          </motion.div>
          <h4 className={`text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 ${groupHoverTextColorClass} flex-1`}>{recommendation.title}</h4>
          {recommendation.value && (
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${baseColorClass.replace(/from-|to-|border-|text-/g, 'bg-').replace(/\/\d+/g, '')} bg-opacity-70`}>
              {recommendation.value}
            </span>
          )}
        </div>
        <p className="text-neutral-300 text-sm mt-4 break-words whitespace-normal">{recommendation.description}</p>
      </div>
    </motion.div>
  );
};
