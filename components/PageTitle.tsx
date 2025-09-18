import React from 'react';
import { Helmet } from 'react-helmet-async';

interface PageTitleProps {
  title: string;
  suffix?: string;
  description?: string;
  keywords?: string;
  ogImageUrl?: string;
  ogUrl?: string;
  children?: React.ReactNode;
}

export const PageTitle: React.FC<PageTitleProps> = ({
  title,
  suffix = 'AIrticle',
  description,
  keywords,
  ogImageUrl,
  ogUrl,
  children,
}) => {
  const finalSuffix = (suffix && !title.includes(suffix)) ? ` - ${suffix}` : '';
  const fullTitle = `${title}${finalSuffix}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      {description && <meta property="og:description" content={description} />}
      {fullTitle && <meta property="og:title" content={fullTitle} />}
      {children}
    </Helmet>
  );
};

// Predefined title components for common pages
export const LandingPageTitle: React.FC = () => (
  <PageTitle
    title="AIrticle - AI-Powered Article Generation"
    description="Generate high-quality, SEO-optimized articles in minutes with AIrticle. Transform your content creation process and boost your online presence."
    keywords="AI article generator, content creation, SEO optimization, AI writing tool, article writer"
    ogImageUrl="https://www.airticle.com/og-image.jpg"
    ogUrl="https://www.airticle.com/"
  />
);

export const StaticPageTitle: React.FC<{ pageName: string }> = ({ pageName }) => (
  <PageTitle title={pageName} />
);

export const PricingPageTitle: React.FC = () => (
  <PageTitle
    title="Pricing & Plans"
    description="Choose from AIrticle's flexible pricing plans for AI-powered article generation. Start free or upgrade for advanced features and bulk content creation."
    keywords="AI writing pricing, article generator cost, content creation plans, AIrticle pricing, subscription"
    ogImageUrl="https://www.airticle.com/pricing-og-image.jpg"
    ogUrl="https://www.airticle.com/pricing"
  />
);

export const FeaturesPageTitle: React.FC = () => (
  <PageTitle
    title="Features - AI-Powered Content Creation Tools"
    description="Explore AIrticle's powerful features: AI content generation, SEO optimization, geographic targeting, bulk article creation, and more. Supercharge your content strategy."
    keywords="AI features, content creation tools, SEO tools, AI writing features, article generator features"
    ogImageUrl="https://www.airticle.com/features-og-image.jpg"
    ogUrl="https://www.airticle.com/features"
  />
);

export const ContactPageTitle: React.FC = () => (
  <PageTitle
    title="Contact & Support"
    description="Have questions about AIrticle's features, pricing, or need support? Contact our team for assistance. We're here to help you with your content generation needs."
    keywords="contact AIrticle, AI writing support, content generator contact, AI tool help, customer service"
    ogImageUrl="https://www.airticle.com/contact-og-image.jpg"
    ogUrl="https://www.airticle.com/contact"
  />
);

export const TermsPageTitle: React.FC = () => (
  <PageTitle
    title="AIrticle Terms of Service - Legal Agreement"
    description="Read AIrticle's Terms of Service to understand the legal agreement governing your use of our AI-powered article generation platform. Learn about accounts, intellectual property, and API usage."
    keywords="terms of service, legal agreement, AIrticle terms, user agreement, API terms, intellectual property"
    ogImageUrl="https://www.airticle.com/terms-og-image.jpg"
    ogUrl="https://www.airticle.com/terms"
  />
);

export const PrivacyPageTitle: React.FC = () => (
  <PageTitle
    title="AIrticle Privacy Policy - Data Protection & Security"
    description="Understand AIrticle's Privacy Policy. Learn how we collect, use, and protect your personal data with industry-standard security measures for our AI content generation platform."
    keywords="privacy policy, data protection, AIrticle privacy, data security, personal data, GDPR compliant"
    ogImageUrl="https://www.airticle.com/privacy-og-image.jpg"
    ogUrl="https://www.airticle.com/privacy"
  />
);

export const DashboardPageTitle: React.FC = () => (
  <PageTitle
    title="Dashboard"
    suffix="AIrticle"
    description="Your personal AIrticle dashboard to manage articles, view statistics, and generate new content. Access all your AI-powered tools in one place."
    keywords="AIrticle dashboard, content management, AI tools, article generation, user statistics"
    ogImageUrl="https://www.airticle.com/dashboard-og-image.jpg"
    ogUrl="https://www.airticle.com/app/dashboard"
  >
    <meta name="robots" content="noindex, nofollow" />
  </PageTitle>
);

export const ArticlePageTitle: React.FC<{
  articleTitle: string;
  articleDescription?: string;
  articleKeywords?: string;
  articleOgImageUrl?: string;
  articleOgUrl?: string;
}> = ({ articleTitle, articleDescription, articleKeywords, articleOgImageUrl, articleOgUrl }) => (
  <PageTitle
    title={articleTitle}
    description={articleDescription || `Read "${articleTitle}" on AIrticle, an AI-generated article. Discover high-quality content on various topics.`}
    keywords={articleKeywords || `AIrticle, ${articleTitle.toLowerCase()}, AI generated article, content, blog`}
    ogImageUrl={articleOgImageUrl || 'https://www.airticle.com/default-article-og-image.jpg'}
    ogUrl={articleOgUrl || `https://www.airticle.com/articles/${articleTitle.toLowerCase().replace(/\s+/g, '-')}`}
    suffix="AIrticle"
  />
);

export const AuthPageTitle: React.FC<{ type: 'login' | 'signup' | 'register' }> = ({ type }) => {
  const isLogin = type === 'login';
  const title = isLogin ? 'Sign In' : 'Sign Up';
  const description = isLogin
    ? 'Sign in to your AIrticle account to generate AI-powered articles, manage content, and access your dashboard.'
    : 'Create a free AIrticle account to start generating AI-powered articles and explore our content creation tools.';
  const keywords = isLogin
    ? 'AIrticle login, sign in, account access, AI writing tool login'
    : 'AIrticle signup, create account, free AI writer, AI content generation registration';
  const ogImageUrl = isLogin
    ? 'https://www.airticle.com/login-og-image.jpg'
    : 'https://www.airticle.com/signup-og-image.jpg';
  const ogUrl = isLogin
    ? 'https://www.airticle.com/login'
    : 'https://www.airticle.com/signup';

  return (
    <PageTitle
      title={title}
      description={description}
      keywords={keywords}
      ogImageUrl={ogImageUrl}
      ogUrl={ogUrl}
      suffix="AIrticle"
    />
  );
};

export const AppPageTitle: React.FC<{ pageName: string }> = ({ pageName }) => (
  <PageTitle title={pageName} />
);

export const AdminPanelPageTitle: React.FC = () => (
  <PageTitle
    title="Admin Panel"
    suffix="AIrticle"
    description="Manage user accounts and application settings for AIrticle. Access administrative tools and user data."
    keywords="admin panel, user management, application settings, AIrticle admin"
    ogImageUrl="https://www.airticle.com/admin-og-image.jpg"
    ogUrl="https://www.airticle.com/app/admin"
  >
    <meta name="robots" content="noindex, nofollow" />
  </PageTitle>
);

export const GeneratorPageTitle: React.FC = () => (
  <PageTitle
    title="AI Article Generator"
    suffix="AIrticle"
    description="Generate high-quality, SEO-optimized articles instantly with AIrticle's powerful AI generator. Input your topic, location, and tone to create unique content."
    keywords="AI article generator, content creation tool, AI writer, generate articles, content automation"
    ogImageUrl="https://www.airticle.com/generator-og-image.jpg"
    ogUrl="https://www.airticle.com/app/generator"
  />
);

export const ProfilePageTitle: React.FC = () => (
  <PageTitle
    title="User Profile"
    suffix="AIrticle"
    description="Manage your AIrticle user profile, including personal information, account statistics, recent articles, and password settings."
    keywords="user profile, account settings, AIrticle account, user data, password change"
    ogImageUrl="https://www.airticle.com/profile-og-image.jpg"
    ogUrl="https://www.airticle.com/app/profile"
  >
    <meta name="robots" content="noindex, nofollow" />
  </PageTitle>
);

export const StatisticsPageTitle: React.FC = () => (
  <PageTitle
    title="Article Statistics"
    suffix="AIrticle"
    description="View your AIrticle content performance statistics, including articles generated, word count, and AI-powered insights for optimization."
    keywords="article statistics, content performance, AI insights, content analytics, AIrticle stats"
    ogImageUrl="https://www.airticle.com/statistics-og-image.jpg"
    ogUrl="https://www.airticle.com/app/statistics"
  >
    <meta name="robots" content="noindex, nofollow" />
  </PageTitle>
);
