import React from 'react';
import { CheckIcon } from './icons/CheckIcon';
import { Footer } from './Footer';

interface PricingPageProps {
  onNavigateToAuth: () => void;
  onNavigateToApp?: () => void;
  isLoggedIn: boolean;
  onNavigateToFeatures: () => void;
  onNavigateToContact: () => void;
  onNavigateToTerms: () => void;
  onNavigateToPrivacy: () => void;
}

const PricingCard: React.FC<{
  plan: string;
  price: string;
  description: string;
  features: string[];
  isFeatured?: boolean;
}> = ({ plan, price, description, features, isFeatured }) => {
  return (
    <div className={`relative p-8 rounded-2xl border transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/10 cursor-pointer group ${isFeatured ? 'bg-indigo-500/10 border-indigo-500 pricing-card-glow hover:bg-indigo-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/50'}`}>
      {isFeatured && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
          <span className="bg-indigo-500 text-white px-3 py-1 text-sm font-semibold rounded-full uppercase tracking-wider pricing-badge-glow">Most Popular</span>
        </div>
      )}
      <h3 className="text-2xl font-bold text-white">{plan}</h3>
      <p className="mt-2 text-slate-400">{description}</p>
      <p className="mt-6 text-5xl font-extrabold text-white">{price}<span className="text-base font-medium text-slate-400">/mo</span></p>
      <button className={`w-full mt-8 py-3 rounded-lg font-semibold transition-colors ${isFeatured ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}>
        Get Started
      </button>
      <ul className="mt-8 space-y-4 text-slate-300">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <CheckIcon className="h-5 w-5 text-indigo-400 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigateToAuth, onNavigateToApp, isLoggedIn, onNavigateToFeatures, onNavigateToContact, onNavigateToTerms, onNavigateToPrivacy }) => {
  const handleHeaderClick = isLoggedIn && onNavigateToApp ? onNavigateToApp : onNavigateToAuth;

  return (
    <>
      <header className="py-8 px-4">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
          <button onClick={() => window.location.href = '/'} className="text-3xl sm:text-4xl font-bold tracking-tight text-white inline-block font-montserrat">
              <span className="inline-block px-2 py-1 bg-purple-600 text-black rounded">AI</span>rticle
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={onNavigateToFeatures} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Features</button>
            <button onClick={onNavigateToContact} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Contact</button>
            <button onClick={handleHeaderClick} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-colors">
                {isLoggedIn ? 'Back to App' : 'Sign In'} &rarr;
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-16 flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight animate-fade-in-up">Pricing Plans</h1>
          <p className="mt-4 text-lg text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Choose the plan that fits your content generation needs.
          </p>
        </div>
        
        <div className="mt-16 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <PricingCard
            plan="Starter"
            price="$9.99"
            description="For individuals and small teams getting started."
            features={[
              "20 Articles per month",
              "Basic AI Article Generation",
              "Keyword Suggestions",
              "Basic SEO Analytics",
              "Article Storage & Management",
              "Export Options",
              "Community Support"
            ]}
          />
          <PricingCard
            plan="Pro"
            price="$29.99"
            description="For growing businesses and content professionals."
            features={[
              "50 Articles per month",
              "Advanced AI Article Generation",
              "Comprehensive Keyword Research",
              "Full Content Analysis & SEO",
              "Google Trends Integration",
              "AI Assistant Access",
              "Export Options",
              "Priority Support"
            ]}
            isFeatured={true}
          />
          <PricingCard
            plan="Enterprise"
            price="Contact Us"
            description="For large organizations with custom needs."
            features={[
              "Unlimited Articles",
              "Custom AI Models",
              "Advanced Analytics & Reporting",
              "Team Collaboration Features",
              "API Access",
              "White-label Options",
              "Dedicated Account Manager"
            ]}
          />
        </div>
      </main>
      
      <Footer onNavigateToTerms={onNavigateToTerms} onNavigateToPrivacy={onNavigateToPrivacy} />
    </>
  );
};
