import React from 'react';
import { CheckIcon } from './icons/CheckIcon';
import { Footer } from './Footer';
import { StaticPageTitle } from './PageTitle';
import { useAuth } from './AuthContext';
import { SiteHeader } from './SiteHeader';

interface PricingPageProps {
  onNavigateToAuth: () => void;
  onNavigateToApp?: () => void;
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
    <div className={`relative p-6 rounded-xl border transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/10 cursor-pointer group ${isFeatured ? 'bg-indigo-500/10 border-indigo-500 pricing-card-glow hover:bg-indigo-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/50'}`}>
      {isFeatured && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
          <span className="bg-indigo-500 text-white px-3 py-1 text-sm font-semibold rounded-full uppercase tracking-wider pricing-badge-glow">Most Popular</span>
        </div>
      )}
      <h3 className="text-xl font-bold text-white">{plan}</h3>
      <p className="mt-2 text-slate-400">{description}</p>
      <p className="mt-5 text-4xl font-extrabold text-white">{price}<span className="text-sm font-medium text-slate-400">/mo</span></p>
      <button className={`w-full mt-6 py-3 rounded-lg font-semibold transition-colors ${isFeatured ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}>
        Get Started
      </button>
      <ul className="mt-6 space-y-3 text-slate-300">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <CheckIcon className="h-4 w-4 text-indigo-400 shrink-0" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Typewriter Hook
const useTypewriter = (texts: string[], typingSpeed: number = 100, pauseTime: number = 2000) => {
  const [currentTextIndex, setCurrentTextIndex] = React.useState(0);
  const [currentText, setCurrentText] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [charIndex, setCharIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const currentFullText = texts[currentTextIndex];

      if (isDeleting) {
        setCurrentText(currentFullText.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);

        if (charIndex === 0) {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }
      } else {
        setCurrentText(currentFullText.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);

        if (charIndex === currentFullText.length - 1) {
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      }
    }, isDeleting ? typingSpeed / 2 : typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, texts, currentTextIndex, typingSpeed, pauseTime]);

  return currentText;
};

const HowToStart: React.FC<{
  onNavigateToAuth: () => void;
  onNavigateToGenerator?: () => void;
}> = ({ onNavigateToAuth, onNavigateToGenerator }) => {
  const { user } = useAuth();
  const actualLoggedIn = !!user;
  const typewriterTexts = [
    "Create account & sign in",
    "Generate your first article",
    "Publish & share with audience",
    "Analyze & optimize performance",
    "Scale & grow your content"
  ];

  const currentText = useTypewriter(typewriterTexts, 80, 3000);

  const steps = [
    {
      number: 1,
      title: "Create Account",
      description: "Sign up for free and explore our powerful AI writing platform with no credit card required.",
      icon: "👤",
      highlight: "Free forever"
    },
    {
      number: 2,
      title: "Generate Content",
      description: "Use our advanced AI to create high-quality, SEO-optimized articles in seconds with smart suggestions.",
      icon: "✨",
      highlight: "AI-powered"
    },
    {
      number: 3,
      title: "Publish & Grow",
      description: "Export your content and share it across platforms to reach your audience and drive traffic.",
      icon: "🚀",
      highlight: "Multi-platform"
    },
    {
      number: 4,
      title: "Analyze Results",
      description: "Track performance with detailed analytics to understand what works and optimize your strategy.",
      icon: "📊",
      highlight: "Data-driven"
    }
  ];

  const handleGetStarted = () => {
    if (actualLoggedIn && onNavigateToGenerator) {
      onNavigateToGenerator();
    } else {
      onNavigateToAuth();
    }
  };

  return (
    <section className="mt-20 py-20 bg-gradient-to-br from-slate-900/50 to-indigo-900/20 rounded-2xl border border-slate-700/50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Start Creating Amazing Content Today</h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Join thousands of content creators who trust our AI to generate high-quality articles
          </p>
        </div>

        <div className="h-16 flex items-center justify-center mb-12">
          <div className="text-lg sm:text-xl text-indigo-400 font-medium min-h-[2rem] flex items-center">
            <span className="inline-block min-w-[4px] h-6 bg-indigo-400 mr-2 animate-pulse rounded-sm"></span>
            {currentText}
            <span className="inline-block w-[2px] h-6 bg-indigo-400 ml-1 animate-blink"></span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          {steps.map((step, index) => (
            <div key={step.number} className="flex-1 group relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform duration-300 shadow-lg">
                {step.number}
              </div>
              <div className="h-full bg-slate-800/50 p-8 rounded-xl border border-slate-600 group-hover:border-indigo-500/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-indigo-500/10">
                <div className="flex flex-col h-full">
                  <div>
                    <div className="text-3xl mb-4">{step.icon}</div>
                    <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>

                    {step.highlight && (
                      <div className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-medium mb-3">
                        {step.highlight}
                      </div>
                    )}
                  </div>

                  <p className="text-slate-400 flex-grow">{step.description}</p>

                  {index === steps.length - 1 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-center space-x-4 text-sm text-slate-500">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                          Live Analytics
                        </span>
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                          Real-time Data
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white px-10 py-5 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-1"
          >
            {actualLoggedIn ? 'Start Creating →' : 'Get Started Now →'}
          </button>

          {!actualLoggedIn && (
            <p className="mt-4 text-slate-400">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          )}

          {actualLoggedIn && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-800/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-white">30 seconds</div>
                <div className="text-slate-400">for an Article</div>
              </div>
              <div className="bg-slate-800/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-white">AI-Powered</div>
                <div className="text-slate-400">Content Generation</div>
              </div>
              <div className="bg-slate-800/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-slate-400">Support Available</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigateToAuth, onNavigateToApp, onNavigateToFeatures, onNavigateToContact, onNavigateToTerms, onNavigateToPrivacy }) => {
  const { user } = useAuth();
  const actualLoggedIn = !!user;

  return (
    <>
      <StaticPageTitle pageName="Pricing" />
      <SiteHeader
        onNavigateToAuth={onNavigateToAuth}
        onNavigateToApp={onNavigateToApp}
        onNavigateToFeatures={onNavigateToFeatures}
        onNavigateToPricing={() => {}}
        onNavigateToContact={onNavigateToContact}
      />

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
              "GPT-5 Mini & Gemini 2.5 Flash",
              "Community support",
              "Basic AI article generation",
              "Keyword suggestions",
              "Basic SEO analytics",
              "Article storage & management",
              "Export options"
            ]}
          />
          <PricingCard
            plan="Pro"
            price="$29.99"
            description="For growing businesses and content professionals."
            features={[
              "100 Articles per month",
              "Claude 3.5 & Grok 4",
              "Advanced AI article generation",
              "Calendar for workflow",
              "Comprehensive keyword research",
              "Full content analysis & SEO",
              "Google Trends integration",
              "AI assistant access",
              "Export options",
              "Content calendar access",
              "WordPress/Medium publishing",
              "Priority support"
            ]}
            isFeatured={true}
          />
          <PricingCard
            plan="Enterprise"
            price="$99.99"
            description="For agencies and enterprises with advanced needs."
            features={[
              "500 Articles per month",
              "GPT 5 & Gemini 2.5 Pro",
              "Custom AI models with API keys",
              "Advanced analytics & reporting",
              "Team collaboration workspaces",
              "White-label options",
              "Dedicated account manager",
              "All platform features unlocked",
              "Priority support"
            ]}
          />
        </div>

        <div className="mt-16 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-600/50">
            <div className="text-center">
              <div className="text-indigo-400 text-2xl mb-2">💫</div>
              <p className="text-slate-300 text-sm font-medium">
                <strong className="text-white">Starter Plan:</strong><br />
                Best for everyone to try out our AI writing platform and experience the power of automated content generation.
              </p>
            </div>
          </div>

          <div className="bg-indigo-500/10 p-6 rounded-xl border border-indigo-500/30 relative">
            <div className="absolute top-2 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-500 text-white px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider">Most Popular</span>
            </div>
            <div className="text-center mt-8">
              <div className="text-purple-400 text-2xl mb-2">🚀</div>
              <p className="text-slate-300 text-sm font-medium">
                <strong className="text-white">Pro Plan:</strong><br />
                Best for individual content managers, digital marketers, and professionals who need advanced features and priority support.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-600/50">
            <div className="text-center">
              <div className="text-emerald-400 text-2xl mb-2">🏢</div>
              <p className="text-slate-300 text-sm font-medium">
                <strong className="text-white">Enterprise Plan:</strong><br />
                Best for agencies and enterprises that require custom AI models, team collaboration, and dedicated account management.
              </p>
            </div>
          </div>
        </div>

        <HowToStart
          onNavigateToAuth={onNavigateToAuth}
          onNavigateToGenerator={onNavigateToApp}
        />
      </main>

      <Footer onNavigateToTerms={onNavigateToTerms} onNavigateToPrivacy={onNavigateToPrivacy} />
    </>
  );
};
