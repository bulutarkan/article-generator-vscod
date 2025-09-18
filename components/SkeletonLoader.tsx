import React from 'react';

interface SkeletonLoaderProps {
    width?: number;
    height?: number;
    className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width,
    height,
    className = '',
}) => {
    const style = {
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
    };

    return (
        <div
            className={`animate-pulse bg-slate-700 rounded ${className}`}
            style={style}
        />
    );
};

export default SkeletonLoader;
