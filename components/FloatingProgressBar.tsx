import React, { useState, useEffect, useRef } from 'react';
import { useBulkGeneration } from './BulkGenerationContext';
import { PlayIcon, PauseIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

export function FloatingProgressBar() {
  const { state, pauseBulkGeneration, resumeBulkGeneration, cancelBulkGeneration } = useBulkGeneration();
  const [showCompletion, setShowCompletion] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [manuallyClosed, setManuallyClosed] = useState(() => {
    // Initialize from localStorage
    try {
      const saved = localStorage.getItem('progressBarManuallyClosed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const lastShouldShowRef = useRef<boolean | null>(null);
  const lastStateRef = useRef<any>(null);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Very strict conditions for showing progress bar
  const totalProcessed = state.progress.completed + state.progress.failed;
  const isComplete = totalProcessed === state.progress.total && state.progress.total > 0;
  const hasActiveGeneration = state.isGenerating || state.items.some(item => item.status === 'processing');
  const hasAnyItems = state.items.length > 0;

  // Only log when state actually changes
  const currentState = {
    hasAnyItems,
    hasActiveGeneration,
    isComplete,
    showCompletion,
    totalItems: state.items.length,
    isGenerating: state.isGenerating,
    totalProcessed,
    total: state.progress.total
  };

  const stateChanged = JSON.stringify(currentState) !== JSON.stringify(lastStateRef.current);
  if (stateChanged) {
    console.log('🔄 Progress bar state changed:', currentState);
    lastStateRef.current = currentState;
  }

  // Show completion message for 3 seconds before auto-hiding
  useEffect(() => {
    // Clear any existing timer
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }

    if (isComplete && !hasActiveGeneration && !manuallyClosed) {
      if (!showCompletion) {
        console.log('✅ Generation completed, showing completion message');
        setShowCompletion(true);
        // Auto-hide after 3 seconds with smooth transition
        autoHideTimerRef.current = setTimeout(() => {
          console.log('⏰ Auto-hiding progress bar');
          setIsVisible(false);
          // Wait for transition to complete before unmounting
          setTimeout(() => {
            setShowCompletion(false);
            setIsVisible(true); // Reset for next use
          }, 500); // Match transition duration
          autoHideTimerRef.current = null;
        }, 3000);
      }
    } else if (!isComplete && showCompletion) {
      setShowCompletion(false);
      setIsVisible(true);
    }

    // Cleanup function
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
    };
  }, [isComplete, hasActiveGeneration, showCompletion, manuallyClosed]);

  // Save manuallyClosed to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('progressBarManuallyClosed', JSON.stringify(manuallyClosed));
    } catch (error) {
      console.error('Failed to save manuallyClosed to localStorage:', error);
    }
  }, [manuallyClosed]);

  // Reset manuallyClosed flag when new generation starts
  useEffect(() => {
    if (hasActiveGeneration && manuallyClosed) {
      console.log('🔄 New generation started, resetting manuallyClosed flag');
      setManuallyClosed(false);
    }
  }, [hasActiveGeneration, manuallyClosed]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
        console.log('🧹 Cleaned up auto-hide timer on unmount');
      }
    };
  }, []);

  // EXTREMELY STRICT conditions - only show if:
  // 1. There are items AND
  // 2. Either there's active generation OR it's complete and showing completion message
  const shouldShow = hasAnyItems && (hasActiveGeneration || (isComplete && showCompletion));

  // Only log when shouldShow changes
  if (shouldShow !== lastShouldShowRef.current) {
    if (shouldShow) {
      console.log('📊 Progress bar shown');
    } else {
      console.log('📊 Progress bar hidden');
    }
    lastShouldShowRef.current = shouldShow;
  }

  if (!shouldShow) {
    return null;
  }

  const { progress, items } = state;
  const completed = items.filter(item => item.status === 'completed').length;
  const failed = items.filter(item => item.status === 'failed').length;
  const processing = items.filter(item => item.status === 'processing').length;

  const handleAction = () => {
    if (progress.isActive) {
      pauseBulkGeneration();
    } else {
      resumeBulkGeneration();
    }
  };

  const handleClose = () => {
    if (isComplete) {
      // For completed generation, just hide the progress bar
      console.log('❌ Manual close: hiding completed progress bar');
      // Clear any pending auto-hide timer
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
        console.log('⏰ Cleared auto-hide timer due to manual close');
      }
      setManuallyClosed(true);
      setIsVisible(false);
      setTimeout(() => {
        setShowCompletion(false);
        setIsVisible(true);
      }, 500);
    } else {
      // For active generation, cancel it
      console.log('❌ Manual close: canceling active generation');
      cancelBulkGeneration();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[320px] max-w-[400px] transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-900">
              Bulk Generation
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title={isComplete ? "Close progress bar" : "Cancel generation"}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{completed + failed} / {progress.total}</span>
            <span>{Math.round(((completed + failed) / progress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((completed + failed) / progress.total) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div className="flex items-center space-x-1">
            <CheckCircleIcon className="w-3 h-3 text-green-500" />
            <span className="text-gray-600">{completed}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">{processing}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />
            <span className="text-gray-600">{failed}</span>
          </div>
        </div>

        {/* Time Remaining */}
        {progress.estimatedTimeRemaining > 0 && (
          <div className="text-xs text-gray-500 mb-3">
            Est. time: {formatTime(progress.estimatedTimeRemaining)}
          </div>
        )}

        {/* Current Item */}
        {processing > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-1">Processing:</div>
            {items
              .filter(item => item.status === 'processing')
              .slice(0, 1)
              .map(item => (
                <div key={item.id} className="text-xs text-gray-800 truncate">
                  {item.topic}
                </div>
              ))}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAction}
          className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
        >
          {progress.isActive ? (
            <>
              <PauseIcon className="w-4 h-4" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4" />
              <span>Resume</span>
            </>
          )}
        </button>

        {/* Completion Message */}
        {!progress.isActive && completed + failed === progress.total && (
          <div className="mt-3 text-center">
            {completed > 0 ? (
              <>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Generation Complete!</span>
                </div>
                <div className="text-xs text-gray-500">
                  {completed} article{completed !== 1 ? 's' : ''} generated successfully
                  {failed > 0 && `, ${failed} failed`}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-red-600 font-medium">Generation Failed</span>
                </div>
                <div className="text-xs text-gray-500">
                  {failed} article{failed !== 1 ? 's' : ''} failed to generate
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
