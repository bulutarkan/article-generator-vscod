import React from 'react';
import { Footer } from './Footer';
import type { User } from '../types';
import { StaticPageTitle } from './PageTitle';
import { SEO } from './SEO';
import { useAuth } from './AuthContext';
import { SiteHeader } from './SiteHeader';

interface ContactPageProps {
  onNavigateToAuth: () => void;
  onNavigateToApp?: () => void;
  onNavigateToPricing: () => void;
  onNavigateToFeatures: () => void;
  onNavigateToTerms: () => void;
  onNavigateToPrivacy: () => void;
  user?: User | null;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigateToAuth, onNavigateToApp, onNavigateToPricing, onNavigateToFeatures, onNavigateToTerms, onNavigateToPrivacy, user }) => {
  const { user: authUser } = useAuth();
  const actualLoggedIn = !!authUser;
  const handleHeaderClick = actualLoggedIn && onNavigateToApp ? onNavigateToApp : onNavigateToAuth;

  return (
    <>
      <SEO
        title="Contact - AIrticle"
        description="AIrticle ekibine ulaşın. Sorularınız, geri bildirimleriniz ve iş birlikleri için iletişime geçin."
        path="/contact"
      />
      <StaticPageTitle pageName="Contact" />
      <SiteHeader
        onNavigateToAuth={onNavigateToAuth}
        onNavigateToApp={onNavigateToApp}
        onNavigateToFeatures={onNavigateToFeatures}
        onNavigateToPricing={onNavigateToPricing}
        onNavigateToContact={() => {}}
      />

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
                <input type="text" id="name" defaultValue={`${authUser?.firstName || ''} ${authUser?.lastName || ''}`.trim() || ''} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input type="email" id="email" defaultValue={authUser?.email || ''} readOnly={!!authUser?.email} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
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
