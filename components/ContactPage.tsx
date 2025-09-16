import React from 'react';
import { Footer } from './Footer';
import type { User } from '../types';
import { StaticPageTitle } from './PageTitle';

interface ContactPageProps {
  onNavigateToAuth: () => void;
  onNavigateToApp?: () => void;
  isLoggedIn: boolean;
  onNavigateToPricing: () => void;
  onNavigateToFeatures: () => void;
  onNavigateToTerms: () => void;
  onNavigateToPrivacy: () => void;
  user?: User | null;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigateToAuth, onNavigateToApp, isLoggedIn, onNavigateToPricing, onNavigateToFeatures, onNavigateToTerms, onNavigateToPrivacy, user }) => {
  const handleHeaderClick = isLoggedIn && onNavigateToApp ? onNavigateToApp : onNavigateToAuth;

  return (
    <>
      <StaticPageTitle pageName="Contact" />
      <header className="py-8 px-4">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
          <button onClick={() => window.location.href = '/'} className="text-3xl sm:text-4xl font-bold tracking-tight text-white inline-block font-montserrat">
            <span className="inline-block px-2 py-1 bg-purple-600 text-black rounded">AI</span>rticle
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={onNavigateToFeatures} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Features</button>
            <button onClick={onNavigateToPricing} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Pricing</button>
            <button onClick={handleHeaderClick} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-colors">
              {isLoggedIn ? 'Back to App' : 'Sign In'} &rarr;
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight animate-fade-in-up">Get in Touch</h1>
          <p className="mt-4 text-lg text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            We'd love to hear from you. Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.
          </p>
        </div>

        <div className="mt-16 max-w-2xl mx-auto bg-white/5 p-8 rounded-2xl border border-white/10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input type="text" id="name" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input type="email" id="email" defaultValue={user?.email || ''} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
              </div>
            </div>
            <div className="mt-6">
              <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
              <input type="text" id="subject" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
            </div>
            <div className="mt-6">
              <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">Message</label>
              <textarea id="message" rows={5} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"></textarea>
            </div>
            <div className="mt-8 text-right">
              <button type="submit" className="bg-indigo-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-400 transition-colors">
                Send Message
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer onNavigateToTerms={onNavigateToTerms} onNavigateToPrivacy={onNavigateToPrivacy} />
    </>
  );
};
