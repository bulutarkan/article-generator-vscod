import React from 'react';

export const UserCogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <circle cx="18" cy="15" r="3" />
    <circle cx="9" cy="7" r="4" />
    <path d="M12 15h1.5a3 3 0 0 1 3 3v1" />
    <path d="M21.7 16.4a2 2 0 1 1-2.8-2.8" />
    <path d="M2.5 21.4a7 7 0 0 1 13 0" />
    <path d="m14.3 16.4 2.9-.4-2.9-.4" />
    <path d="M14.3 13.6 17.2 13l-2.9.4" />
    <path d="M18.4 12.1a3 3 0 1 1-4.2-4.2" />
  </svg>
);
