import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: number | string;
  suffix?: string;
  label: string;
  color: string;
  duration?: number;
  isText?: boolean;
  delay?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  suffix = '',
  label,
  color,
  duration = 2500,
  isText = false,
  delay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [displayValue, setDisplayValue] = useState(isText ? value : '0');

  useEffect(() => {
    if (!isInView || isText) return;

    const numValue = Number(value);
    let start = 0;
    const end = numValue;
    const increment = end / (duration / 16); // Approximate 60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end.toString());
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start).toString());
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, value, duration, isText]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      const formatted = (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1);
      return formatted + 'K';
    }
    return num.toString();
  };

  const getFormattedValue = () => {
    if (isText) {
      return value + suffix;
    }
    const num = Number(displayValue);
    const formatted = formatNumber(num);
    return suffix ? `${formatted}${suffix}` : formatted;
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      className="text-center"
      aria-live="polite"
    >
      <div className={`text-4xl sm:text-5xl font-bold mb-2 font-mono text-${color}-400 transition-all duration-300`}>
        {getFormattedValue()}
      </div>
      <div className="text-slate-400">{label}</div>
    </motion.div>
  );
};
