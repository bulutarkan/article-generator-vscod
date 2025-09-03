import React from 'react';

interface SkeletonLoaderProps {
    width?: number;
    height?: number;
    className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width = 200,
    height = 20,
    className = '',
}) => {
    return (
        <div
            className={`animate-pulse bg-gray-300 rounded ${className}`}
            style={{ width, height }}
        />
    );
};

export default SkeletonLoader;
