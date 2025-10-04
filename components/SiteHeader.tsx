import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface SiteHeaderProps {
  onNavigateToAuth: () => void;
  onNavigateToApp?: () => void;
  onNavigateToFeatures?: () => void;
  onNavigateToPricing?: () => void;
  onNavigateToContact?: () => void;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  onNavigateToAuth,
  onNavigateToApp,
  onNavigateToFeatures,
  onNavigateToPricing,
  onNavigateToContact,
}) => {
  const { user } = useAuth();
  const actualLoggedIn = !!user;
  const { pathname } = useLocation();
  const [open, setOpen] = React.useState(false);

  const handleCta = () => {
    if (actualLoggedIn && onNavigateToApp) return onNavigateToApp();
    return onNavigateToAuth();
  };

  const navItems = [
    { label: 'Features', onClick: onNavigateToFeatures, path: '/features' },
    { label: 'Pricing', onClick: onNavigateToPricing, path: '/pricing' },
    { label: 'Contact', onClick: onNavigateToContact, path: '/contact' },
  ].filter(item => !!item.onClick);

  return (
    <header className="sticky top-0 z-[100] bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => (window.location.href = '/')}
          className="text-2xl sm:text-3xl font-bold tracking-tight text-white inline-flex items-baseline font-montserrat"
          aria-label="Go to home"
        >
          <span className="inline-block px-1.5 py-1 bg-purple-600 text-black rounded-md mr-1">AI</span>
          <span>rticle</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1 sm:gap-2 md:gap-4">
          {navItems.map((item) => {
            const active = pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'text-white bg-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            onClick={handleCta}
            className="ml-2 px-4 py-2 rounded-md text-sm font-medium text-slate-900 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 transition-colors"
          >
            {actualLoggedIn ? 'Back to App →' : 'Sign In →'}
          </button>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            {open ? (
              <path
                fillRule="evenodd"
                d="M6.225 4.811a1 1 0 011.414 0L12 9.172l4.361-4.361a1 1 0 011.414 1.414L13.414 10.586l4.361 4.361a1 1 0 01-1.414 1.414L12 12l-4.361 4.361a1 1 0 01-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M3.75 6.75A.75.75 0 014.5 6h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zM3.75 12a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15A.75.75 0 013.75 12zm0 5.25A.75.75 0 014.5 16.5h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z"
                clipRule="evenodd"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="sm:hidden border-t border-white/10 bg-slate-900/90 backdrop-blur">
          <div className="px-4 py-3 flex flex-col gap-2">
            {navItems.map((item) => {
              const active = pathname === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setOpen(false);
                    item.onClick && item.onClick();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'text-white bg-white/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                setOpen(false);
                handleCta();
              }}
              className="mt-1 px-4 py-2 rounded-md text-sm font-medium text-slate-900 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 transition-colors"
            >
              {actualLoggedIn ? 'Back to App →' : 'Sign In →'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

