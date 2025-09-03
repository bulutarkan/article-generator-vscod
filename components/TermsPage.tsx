import React, { useState } from 'react';
import { Footer } from './Footer';

interface TermsPageProps {
  onNavigateToAuth: () => void;
  onNavigateToApp?: () => void;
  isLoggedIn: boolean;
  onNavigateToPrivacy: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigateToAuth, onNavigateToApp, isLoggedIn, onNavigateToPrivacy }) => {
  const [activeSection, setActiveSection] = useState<string | null>('introduction');
  const handleHeaderClick = isLoggedIn && onNavigateToApp ? onNavigateToApp : onNavigateToAuth;

  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      content: `Welcome to our platform. These Terms of Service govern your use of our software development tools and services. By accessing or using our services, you agree to be bound by these terms.`
    },
    {
      id: 'accounts',
      title: 'Accounts',
      content: `You must provide accurate information when creating an account. You are responsible for maintaining the security of your account and for all activities that occur under it.`
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      content: `All content and software provided through our services are protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without permission.`
    },
    {
      id: 'api-usage',
      title: 'API Usage',
      content: `Our API is provided for developers to integrate with our services. You agree to use it responsibly and not to attempt to circumvent rate limits or security measures.`
    },
    {
      id: 'termination',
      title: 'Termination',
      content: `We may terminate or suspend your account immediately if you violate these terms. You may also terminate your account at any time by contacting us.`
    }
  ];

  return (
    <>
      <header className="py-8 px-4">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
          <button onClick={() => window.location.href = '/'} className="text-3xl sm:text-4xl font-bold tracking-tight text-white inline-block font-montserrat">
            <span className="inline-block px-2 py-1 bg-purple-600 text-black rounded">AI</span>rticle
          </button>
          <button onClick={handleHeaderClick} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-colors">
            {isLoggedIn ? 'Back to App' : 'Sign In'} &rarr;
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight animate-fade-in-up">Terms of Service</h1>
          <p className="mt-4 text-lg text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Last Updated: {new Date().toLocaleDateString()}
          </p>
          <button 
            onClick={onNavigateToPrivacy}
            className="mt-4 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View our Privacy Policy →
          </button>
        </div>

        <div className="mt-16 max-w-3xl mx-auto bg-white/5 rounded-2xl border border-white/10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {sections.map((section) => (
            <div key={section.id} className="border-b border-white/10 last:border-b-0">
              <button
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-white/5 transition-colors"
              >
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                <span className="text-slate-400">
                  {activeSection === section.id ? '−' : '+'}
                </span>
              </button>
              {activeSection === section.id && (
                <div className="px-6 pb-4 pt-2 text-slate-300">
                  <p>{section.content}</p>
                  {section.id === 'api-usage' && (
                    <div className="mt-4 p-4 bg-white/10 rounded-lg">
                      <h3 className="font-medium mb-2">API Rate Limits</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-indigo-500/10 p-3 rounded-lg">
                          <div className="text-indigo-400">Free Tier</div>
                          <div>100 req/hour</div>
                        </div>
                        <div className="bg-indigo-500/10 p-3 rounded-lg">
                          <div className="text-indigo-400">Pro Tier</div>
                          <div>1000 req/hour</div>
                        </div>
                        <div className="bg-indigo-500/10 p-3 rounded-lg">
                          <div className="text-indigo-400">Enterprise</div>
                          <div>Custom limits</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
};
