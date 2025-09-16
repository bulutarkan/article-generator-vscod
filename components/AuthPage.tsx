import React, { useState, FormEvent, useEffect } from 'react';
import type { User } from '../types';
import * as supabaseService from '../services/supabase';
import { UserIcon } from './icons/UserIcon';
import { LockIcon } from './icons/LockIcon';
import { GoogleIcon } from './icons/GoogleIcon';
import { GithubIcon } from './icons/GithubIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { MailIcon } from './icons/MailIcon';
import { Footer } from './Footer';
import { AuthPageTitle } from './PageTitle';

interface AuthPageProps {
  onLogin: (user: User) => void;
  onNavigateToPricing: () => void;
  onNavigateToFeatures: () => void;
  onNavigateToContact: () => void;
}

type AuthMode = 'login' | 'register';

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onNavigateToPricing, onNavigateToFeatures, onNavigateToContact }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Rotating content state
  const [keywordGroupIndex, setKeywordGroupIndex] = useState(0);
  const [countryGroupIndex, setCountryGroupIndex] = useState(0);

  // Transition states
  const [keywordTransitioning, setKeywordTransitioning] = useState(false);
  const [countryTransitioning, setCountryTransitioning] = useState(false);
  const [keywordOpacity, setKeywordOpacity] = useState(1);
  const [countryOpacity, setCountryOpacity] = useState(1);
  const [keywordBlur, setKeywordBlur] = useState(0);
  const [countryBlur, setCountryBlur] = useState(0);

  // Keyword groups (4 groups of 8 keywords each)
  const keywordGroups = [
    [
      'best coffee shops', 'vegan recipes', 'smart home gadgets', 'travel backpacks',
      'urban gardening', 'fitness trackers', 'online courses', 'sustainable fashion'
    ],
    [
      'cryptocurrency guide', 'remote work tools', 'electric vehicles', 'meditation apps',
      'plant-based diets', 'productivity hacks', 'language learning', 'eco-friendly products'
    ],
    [
      'artificial intelligence', 'blockchain technology', 'renewable energy', 'mental health apps',
      'healthy meal prep', 'home automation', 'coding bootcamps', 'zero waste living'
    ],
    [
      'gaming accessories', 'educational platforms', 'luxury travel', 'fitness nutrition',
      'mobile photography', 'smart wearables', 'virtual reality', 'digital marketing'
    ]
  ];

  // Country groups (4 groups of 8 countries each)
  const countryGroups = [
    [
      'Japan', 'Brazil', 'Germany', 'Australia', 'France', 'Canada', 'United Kingdom', 'Italy'
    ],
    [
      'Spain', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Portugal', 'Ireland'
    ],
    [
      'Mexico', 'Argentina', 'South Korea', 'Singapore', 'New Zealand', 'Switzerland', 'Austria', 'Belgium'
    ],
    [
      'Turkey', 'India', 'China', 'Russia', 'Egypt', 'South Africa', 'Thailand', 'Indonesia'
    ]
  ];

  const resetFormState = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setError(null);
    setSuccess(null);
    setIsLoading(false);
  }

  const handleModeChange = (newMode: AuthMode) => {
    resetFormState();
    setMode(newMode);
  }

  const handleLogin = async () => {
    await supabaseService.signIn(email, password);
    const user = await supabaseService.getCurrentUser();
    if (user) onLogin(user);
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) throw new Error("Passwords do not match.");
    await supabaseService.signUp(email, password, firstName, lastName);
    const user = await supabaseService.getCurrentUser();
    if (user) onLogin(user);
  };

  const handleGoogleSignIn = async () => {
    try {
      await supabaseService.signInWithGoogle();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      await supabaseService.signInWithGithub();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (mode === 'login') await handleLogin();
      else if (mode === 'register') await handleRegister();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTitle = () => {
    switch (mode) {
      case 'login': return { title: 'Sign in to continue', cta: 'Sign In' };
      case 'register': return { title: 'Create an account to get started', cta: 'Create Account' };
      default: return { title: '', cta: '' };
    }
  };

  const { title, cta } = renderTitle();

  // Smooth transition effect for keywords with blur
  useEffect(() => {
    const keywordInterval = setInterval(() => {
      // Start fade out with blur
      setKeywordTransitioning(true);
      setKeywordOpacity(0);
      setKeywordBlur(2);

      // After fade out completes, change group and fade in
      setTimeout(() => {
        setKeywordGroupIndex((prev) => (prev + 1) % keywordGroups.length);
        setKeywordOpacity(1);
        setKeywordBlur(0);
        setKeywordTransitioning(false);
      }, 1000); // 1 second for fade out with blur
    }, 6000); // 6 seconds total cycle

    return () => clearInterval(keywordInterval);
  }, []);

  // Smooth transition effect for countries with blur
  useEffect(() => {
    const countryInterval = setInterval(() => {
      // Start fade out with blur
      setCountryTransitioning(true);
      setCountryOpacity(0);
      setCountryBlur(2);

      // After fade out completes, change group and fade in
      setTimeout(() => {
        setCountryGroupIndex((prev) => (prev + 1) % countryGroups.length);
        setCountryOpacity(1);
        setCountryBlur(0);
        setCountryTransitioning(false);
      }, 1000); // 1 second for fade out with blur
    }, 6000); // 6 seconds total cycle

    return () => clearInterval(countryInterval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <AuthPageTitle type={mode} />
      <header className="py-8 px-4">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
          <button onClick={() => window.location.href = '/'} className="text-3xl sm:text-4xl font-bold tracking-tight text-white inline-block font-montserrat">
            <span className="inline-block px-2 py-1 bg-purple-600 text-black rounded">AI</span>rticle
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={onNavigateToFeatures} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Features</button>
            <button onClick={onNavigateToPricing} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Pricing</button>
            <button onClick={onNavigateToContact} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Contact</button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-8">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-6xl">

            {/* Main Layout: Keywords | Sign-in Form | Countries */}
            <div className={`grid gap-8 items-center ${mode === 'login' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {/* Left Column - Keywords */}
              {mode === 'login' && (
                <div className="lg:col-span-1 flex flex-col items-center">
                  <div className="w-full max-w-xs">
                    <div
                      className="flex flex-wrap gap-2 justify-center transition-all duration-1000 ease-in-out"
                      style={{
                        opacity: keywordOpacity,
                        filter: `blur(${keywordBlur}px)`
                      }}
                    >
                      {keywordGroups[keywordGroupIndex].map((keyword, index) => (
                        <div
                          key={`${keywordGroupIndex}-${keyword}`}
                          className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-slate-300 transition-all duration-300 cursor-pointer animate-fade-in-up"
                          style={{
                            animation: 'float-example 3s ease-in-out infinite',
                            animationDelay: `${index * 0.2}s`
                          }}
                        >
                          {keyword}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Center Column - Sign-in Form */}
              <div className={`${mode === 'login' ? 'lg:col-span-1' : ''} flex justify-center`}>
                <div className="w-full max-w-md">
                  <div className="bg-white/5 p-8 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* First Name and Last Name Fields for Register */}
                      {mode === 'register' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                            <input
                              type="text"
                              id="firstName"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-all"
                              required
                              autoComplete="given-name"
                            />
                          </div>
                          <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                            <input
                              type="text"
                              id="lastName"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-all"
                              required
                              autoComplete="family-name"
                            />
                          </div>
                        </div>
                      )}

                      {/* Email Field */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <UserIcon className="h-5 w-5 text-slate-500" />
                          </div>
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-md border-0 bg-white/5 py-3 pl-10 pr-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-all"
                            required
                            autoComplete="email"
                          />
                        </div>
                      </div>

                      {/* Password Field */}
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <LockIcon className="h-5 w-5 text-slate-500" />
                          </div>
                          <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full rounded-md border-0 bg-white/5 py-3 pl-10 pr-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-all"
                            required
                            autoComplete={mode === 'login' ? "current-password" : "new-password"}
                          />
                        </div>
                      </div>

                      {/* Confirm Password Field */}
                      {mode === 'register' && (
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <LockIcon className="h-5 w-5 text-slate-500" />
                            </div>
                            <input
                              type="password"
                              id="confirmPassword"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="block w-full rounded-md border-0 bg-white/5 py-3 pl-10 pr-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-all"
                              required
                              autoComplete="new-password"
                            />
                          </div>
                        </div>
                      )}

                      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full justify-center items-center rounded-md bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-all"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : cta}
                      </button>
                    </form>

                    <div className="mt-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white/5 text-slate-400">Or continue with</span>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <button
                          onClick={handleGoogleSignIn}
                          className="flex w-full justify-center items-center rounded-md bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all"
                        >
                          <GoogleIcon className="h-5 w-5 mr-2" />
                          Google
                        </button>
                        <button
                          onClick={handleGithubSignIn}
                          className="flex w-full justify-center items-center rounded-md bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all"
                        >
                          <GithubIcon className="h-5 w-5 mr-2" />
                          GitHub
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 text-center text-sm text-slate-400">
                      {mode === 'login' && (
                        <>
                          Don't have an account?{' '}
                          <button
                            onClick={() => handleModeChange('register')}
                            className="font-semibold text-indigo-400 hover:text-indigo-300 ml-2"
                          >
                            Sign up
                          </button>
                        </>
                      )}
                      {mode === 'register' && (
                        <>
                          Already have an account?{' '}
                          <button
                            onClick={() => handleModeChange('login')}
                            className="font-semibold text-indigo-400 hover:text-indigo-300 ml-2"
                          >
                            Sign in
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <button
                      onClick={onNavigateToPricing}
                      className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      View Pricing Plans
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Countries */}
              {mode === 'login' && (
                <div className="lg:col-span-1 flex flex-col items-center">
                  <div className="w-full max-w-xs">
                    <div
                      className="flex flex-wrap gap-3 justify-center transition-all duration-1000 ease-in-out"
                      style={{
                        opacity: countryOpacity,
                        filter: `blur(${countryBlur}px)`
                      }}
                    >
                      {countryGroups[countryGroupIndex].map((country, index) => (
                        <div
                          key={`${countryGroupIndex}-${country}`}
                          className="bg-slate-700/30 border border-slate-600 rounded-md px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-600/40 hover:text-slate-300 transition-all duration-300 cursor-pointer animate-fade-in-up"
                          style={{
                            animation: 'float-example 4s ease-in-out infinite',
                            animationDelay: `${2 + index * 0.3}s`
                          }}
                        >
                          {country}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style dangerouslySetInnerHTML={{
        __html: `
            @keyframes float-example {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-3px);
              }
            }
          `
      }} />
    </div>
  );
};
