import React from 'react';

interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  borderRadius?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ width = '100%', height = '20px', borderRadius = '4px' }) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#e0e0e0',
        borderRadius,
        animation: 'pulse 2s infinite',
      }}
    ></div>
  );
};

export default SkeletonLoader;
