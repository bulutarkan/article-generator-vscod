import React from 'react';
import { Helmet } from 'react-helmet-async';

type SEOProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  robots?: string;
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  schema?: Record<string, any>;
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  path = typeof window !== 'undefined' ? window.location.pathname : '/',
  image = '/vite.svg',
  type = 'website',
  robots = 'index,follow',
  keywords,
  publishedTime,
  modifiedTime,
  schema,
}) => {
  const siteName = 'AIrticle';
  const siteUrl = (import.meta as any)?.env?.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const url = siteUrl ? new URL(path, siteUrl).toString() : path;
  const img = image?.startsWith('http') ? image : `${siteUrl || ''}${image}`;

  const jsonLd: Record<string, any> | undefined =
    type === 'article'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description,
          datePublished: publishedTime,
          dateModified: modifiedTime || publishedTime,
          mainEntityOfPage: url,
          author: { '@type': 'Organization', name: siteName },
          publisher: { '@type': 'Organization', name: siteName },
          image: img,
        }
      : schema;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords?.length ? (
        <meta name="keywords" content={keywords.join(', ')} />
      ) : null}
      <meta name="robots" content={robots} />
      {url && <link rel="canonical" href={url} />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {url && <meta property="og:url" content={url} />} 
      {img && <meta property="og:image" content={img} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {img && <meta name="twitter:image" content={img} />}

      {publishedTime ? (
        <meta property="article:published_time" content={publishedTime} />
      ) : null}
      {modifiedTime ? (
        <meta property="article:modified_time" content={modifiedTime} />
      ) : null}

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
};

export default SEO;
