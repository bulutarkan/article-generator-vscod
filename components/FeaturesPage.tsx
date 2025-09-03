import React from 'react';
import { TargetIcon } from './icons/TargetIcon';
import { BarChartIcon } from './icons/BarChartIcon';
import { MailIcon } from './icons/MailIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { Footer } from './Footer';

interface FeaturesPageProps {
  onNavigateToAuth: () => void;
  onNavigateToApp?: () => void;
  isLoggedIn: boolean;
  onNavigateToPricing: () => void;
  onNavigateToContact: () => void;
  onNavigateToTerms: () => void;
  onNavigateToPrivacy: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col items-start transform hover:-translate-y-1 transition-transform duration-300">
    <div className="bg-indigo-500/20 text-indigo-400 p-3 rounded-lg mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400">{description}</p>
  </div>
);

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigateToAuth, onNavigateToApp, isLoggedIn, onNavigateToPricing, onNavigateToContact, onNavigateToTerms, onNavigateToPrivacy }) => {
  const features = [
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l.707-.707m2.828 9.9a5 5 0 117.072 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      title: "AI-Powered Content",
      description: "Leverage the power of advanced AI to generate high-quality, relevant, and engaging articles in minutes."
    },
    {
      icon: <TargetIcon className="h-6 w-6" />,
      title: "Geographic Targeting",
      description: "Optimize your content for local search by specifying a target country, city, or region for each article."
    },
    {
      icon: <BarChartIcon className="h-6 w-6" />,
      title: "SEO Optimization",
      description: "Articles are structured with SEO best practices in mind to help you rank higher in search engine results."
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
      title: "Customizable Tone",
      description: "Choose from a variety of tones of voice to match your brand's personality and connect with your audience."
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10m16-5H4m16 5H4M4 7h16v10H4V7z" /></svg>,
      title: "Content Dashboard",
      description: "Manage all your generated articles in one place. Edit, review, and delete content with ease."
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V8z" /></svg>,
      title: "AI Assistant",
      description: "Get help and suggestions from our integrated AI assistant to refine your articles and improve your content strategy."
    }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="py-8 px-4">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
          <button onClick={() => window.location.href = '/'} className="text-3xl sm:text-4xl font-bold tracking-tight text-white inline-block font-montserrat">
            <span className="inline-block px-2 py-1 bg-purple-600 text-black rounded">AI</span>rticle
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={onNavigateToPricing} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Pricing</button>
            <button onClick={onNavigateToContact} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Contact</button>
            <button onClick={isLoggedIn ? onNavigateToApp : onNavigateToAuth} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-colors">
              {isLoggedIn ? 'Back to App' : 'Sign In'} &rarr;
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Powerful Features to Supercharge Your Content
            </h1>
            <p className="mt-4 text-lg text-slate-400 max-w-3xl mx-auto">
              Our AI-powered platform is packed with tools designed to make content creation faster, smarter, and more effective.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />
            ))}
          </div>

          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
            <p className="mt-3 text-slate-400">Generate your first article for free.</p>
            <button onClick={isLoggedIn ? onNavigateToApp : onNavigateToAuth} className="mt-6 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
              Start Generating
            </button>
          </div>
        </div>
      </main>
      <Footer onNavigateToTerms={onNavigateToTerms} onNavigateToPrivacy={onNavigateToPrivacy} />
    </div>
  );
};
