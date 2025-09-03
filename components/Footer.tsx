import React from 'react';

interface FooterProps {
  onNavigateToPricing?: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onNavigateToPricing,
  onNavigateToTerms,
  onNavigateToPrivacy
}) => {
  return (
    <footer className="w-full text-center py-6 px-4 text-slate-500 text-sm border-t border-white/10 mt-auto shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="font-montserrat"><span className="inline-block px-1 py-0.5 bg-purple-600 text-black font-bold rounded text-xs">AI</span><span className="font-bold">rticle</span>&copy; {new Date().getFullYear()}. All rights reserved.</p>
        <div className="flex items-center gap-6">
          {onNavigateToPricing && (
             <button onClick={onNavigateToPricing} className="hover:text-slate-300 transition-colors">Pricing</button>
          )}
          <button 
            onClick={onNavigateToTerms} 
            className="hover:text-slate-300 transition-colors"
          >
            Terms of Service
          </button>
          <button 
            onClick={onNavigateToPrivacy} 
            className="hover:text-slate-300 transition-colors"
          >
            Privacy Policy
          </button>
        </div>
      </div>
    </footer>
  );
};
