import React, { useState, useEffect } from 'react';

const steps = [
  'Analyzing search intent...',
  'Generating compelling headlines...',
  'Weaving in keywords naturally...',
  'Structuring headline tags...',
  'Optimizing for SEO...',
  'Finding relevant research...',
  'Creating description and keywords...',
  'Creating FAQs...',
  'Almost there, polishing the final draft...'
];

const stepDetails = [
  'Understanding user intent and market research',
  'Crafting attention-grabbing title options',
  'Integrating keywords seamlessly into content',
  'Organizing H1, H2, H3 structure effectively',
  'Enhancing visibility and search ranking',
  'Researching latest studies and data',
  'Building meta description and keyword list',
  'Compiling frequently asked questions',
  'Final review and content optimization'
];

interface StepProgressProps {
  message?: string;
  // If provided, progress resumes based on when generation started
  startedAt?: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({ message: customMessage, startedAt }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (customMessage) {
      // If custom message is provided, don't show steps
      setCurrentStep(steps.length - 1);
      return;
    }

    const stepMs = 4000;
    // Resume from elapsed time if provided
    let stepIndex = 0;
    if (startedAt) {
      const elapsed = Date.now() - startedAt;
      stepIndex = Math.min(steps.length - 1, Math.floor(elapsed / stepMs));
      setCurrentStep(stepIndex);
    }

    const intervalId = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex = stepIndex + 1;
        setCurrentStep(stepIndex);
      } else {
        // Stay on the last step
        clearInterval(intervalId);
      }
    }, stepMs);

    console.log('StepProgress: Using 4s intervals, initial step', stepIndex);

    return () => clearInterval(intervalId);
  }, [customMessage, startedAt]);

  if (customMessage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up">
        <div role="status" className="flex justify-center">
          <svg aria-hidden="true" className="w-12 h-12 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
        <div className="w-full max-w-md mx-auto bg-slate-700/50 rounded-full h-2 mt-8 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full animate-progress"></div>
        </div>
        <p className="mt-4 text-slate-400 h-6 animate-fade-in-up" style={{ animationDuration: '0.5s' }}>{customMessage}</p>
      </div>
    );
  }

  const progress = currentStep / (steps.length - 1);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up">
      <div className="max-w-md w-full overflow-hidden">
        {/* Horizontal Slider Steps */}
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentStep * 100}%)` }}
        >
          {steps.map((step, index) => {
            const isCompleted = index <= currentStep;
            const isActive = index === currentStep;

            return (
              <div
                key={index}
                className="w-full flex-shrink-0 flex items-center justify-center"
              >
                <div className={`flex items-center space-x-4 p-6 rounded-xl border transition-all duration-300 w-full max-w-xs ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 shadow-lg shadow-blue-500/10 scale-105'
                    : isCompleted
                      ? 'bg-green-500/10 border-green-500/20 scale-95'
                      : 'bg-gray-500/10 border-gray-600/20 scale-95'
                }`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white scale-110'
                      : isActive
                        ? 'bg-blue-500 animate-pulse text-white scale-125'
                        : 'bg-gray-600 text-gray-300 scale-100'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : isActive ? (
                      <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <span className={`text-sm font-semibold text-center ${
                      isActive
                        ? 'text-blue-200'
                        : isCompleted
                          ? 'text-green-200'
                          : 'text-gray-400'
                    }`}>
                      {step}
                    </span>
                    <span className={`text-xs text-center text-gray-400 ${
                      isActive ? 'text-blue-100' : isCompleted ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {stepDetails[index]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-8 mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
          </svg>
          <span className="sr-only">Generating article...</span>
        </div>
      </div>
    </div>
  );
};
