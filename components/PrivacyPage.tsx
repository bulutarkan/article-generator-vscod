import React, { useState } from 'react';
import { Footer } from './Footer';

interface PrivacyPageProps {
  onNavigateToAuth: () => void;
  onNavigateToApp?: () => void;
  isLoggedIn: boolean;
  onNavigateToTerms: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigateToAuth, onNavigateToApp, isLoggedIn, onNavigateToTerms }) => {
  const [activeSection, setActiveSection] = useState<string | null>('overview');
  const handleHeaderClick = isLoggedIn && onNavigateToApp ? onNavigateToApp : onNavigateToAuth;

  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      content: `We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information when you use our developer tools and services.`
    },
    {
      id: 'data-collection',
      title: 'Data We Collect',
      content: `We collect information necessary to provide our services, including account details, usage data, and technical information about your development environment. We minimize data collection to what's essential.`
    },
    {
      id: 'data-usage',
      title: 'How We Use Data',
      content: `Your data helps us improve our services, provide support, and ensure security. We analyze usage patterns to enhance performance and develop new features for developers.`
    },
    {
      id: 'cookies',
      title: 'Cookies & Tracking',
      content: `We use cookies and similar technologies for authentication, analytics, and service functionality. You can control cookies through your browser settings.`
    },
    {
      id: 'security',
      title: 'Security Measures',
      content: `We implement industry-standard security measures including encryption, access controls, and regular audits to protect your data.`
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
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight animate-fade-in-up">Privacy Policy</h1>
          <p className="mt-4 text-lg text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Effective Date: {new Date().toLocaleDateString()}
          </p>
          <button 
            onClick={onNavigateToTerms}
            className="mt-4 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View our Terms of Service →
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
                  {section.id === 'data-collection' && (
                    <div className="mt-4 p-4 bg-white/10 rounded-lg">
                      <h3 className="font-medium mb-2">Data Collection Types</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="text-indigo-400 mr-2">•</span>
                          <span>Account information (email, name)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-indigo-400 mr-2">•</span>
                          <span>Usage metrics (API calls, feature usage)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-indigo-400 mr-2">•</span>
                          <span>Technical details (browser, OS, IP)</span>
                        </li>
                      </ul>
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
