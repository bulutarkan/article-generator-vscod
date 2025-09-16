import React from 'react';
import { Helmet } from 'react-helmet-async';

interface PageTitleProps {
  title: string;
  suffix?: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({
  title,
  suffix = 'AIrticle'
}) => {
  const fullTitle = suffix ? `${title} - ${suffix}` : title;

  return (
    <Helmet>
      <title>{fullTitle}</title>
    </Helmet>
  );
};

// Predefined title components for common pages
export const LandingPageTitle: React.FC = () => (
  <PageTitle title="AIrticle - SEO Optimized Articles" suffix="" />
);

export const StaticPageTitle: React.FC<{ pageName: string }> = ({ pageName }) => (
  <PageTitle title={pageName} />
);

export const ArticlePageTitle: React.FC<{ articleTitle: string }> = ({ articleTitle }) => (
  <PageTitle title={articleTitle} />
);

export const AuthPageTitle: React.FC<{ type: 'login' | 'signup' | 'register' }> = ({ type }) => (
  <PageTitle title={type === 'login' ? 'Sign In' : 'Sign Up'} />
);

export const AppPageTitle: React.FC<{ pageName: string }> = ({ pageName }) => (
  <PageTitle title={pageName} />
);
