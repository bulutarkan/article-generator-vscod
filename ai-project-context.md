# AIrticle - AI Powered Article Generator: Project Context for AI Models

## 1. Project Name and Purpose

**Project Name:** AIrticle - AI Powered Article Generator

**Purpose:** The AIrticle platform is designed to serve as a comprehensive content creation and management system. Its primary goal is to empower users (content creators, marketers, bloggers) to efficiently generate high-quality, SEO-optimized articles, manage their content pipeline, and gain insights into content performance, all powered by artificial intelligence. It abstracts away complex AI model interactions and provides a user-friendly interface for content workflows.

## 2. Core Functionality and Technical Implementation

This section details the key features and their underlying technical mechanisms.

### 2.1 AI-powered Article Generation
*   **Description**: Users can generate full-length articles or article sections based on provided prompts, keywords, or topics. The AI assists in drafting content, ensuring coherence, relevance, and originality.
*   **Technical Details**:
    *   **AI Model Integration**: Utilizes the Google Gemini API (`services/geminiService.ts`) for natural language understanding and generation.
    *   **Prompt Engineering**: The `components/Generator.tsx` and `components/Editor.tsx` likely handle user input and construct prompts sent to the Gemini API. These prompts are carefully designed to guide the AI in generating contextually relevant and high-quality text.
    *   **Content Processing**: Generated text is received and processed, potentially undergoing further refinement, formatting, or sentiment analysis before being presented to the user.

### 2.2 SEO Analysis and Recommendations
*   **Description**: Provides real-time analysis of article content against SEO best practices, offering recommendations for keywords, readability, meta descriptions, and on-page optimization.
*   **Technical Details**:
    *   **Service**: Implemented in `services/seoAnalysisService.ts`. This service likely contains algorithms and rules for evaluating content against SEO criteria.
    *   **Integration**: Analysis is triggered within `components/Editor.tsx` or similar content editing interfaces, providing immediate feedback.
    *   **Data Sources**: May involve comparing content against target keywords, analyzing competitor content (via web crawling), and leveraging general SEO guidelines.

### 2.3 Content Calendar and Scheduling
*   **Description**: An interactive calendar view allows users to plan, schedule, and track the status of their articles, ensuring consistent content flow.
*   **Technical Details**:
    *   **Components**: `components/ContentCalendar.tsx`, `components/DayEventsModal.tsx`, `components/EventDetailModal.tsx`.
    *   **Data Storage**: Scheduled events and article statuses are stored in the Supabase database.
    *   **User Interface**: React components render the calendar and handle user interactions for creating, editing, and viewing events.

### 2.4 User Authentication and Profile Management
*   **Description**: Secure user registration, login, and profile management (e.g., account settings, subscription details).
*   **Technical Details**:
    *   **Authentication Service**: Handled by Supabase's authentication services (`services/supabase.ts`, `components/AuthPage.tsx`, `components/AuthContext.tsx`, `components/AuthGuard.tsx`).
    *   **Data Storage**: User data, including profiles and preferences, is stored in the Supabase database.
    *   **Subscription Management**: `src/services/subscriptionManagement.ts` likely manages user subscription states and access levels.

### 2.5 Dashboard and Statistics
*   **Description**: A centralized dashboard provides an overview of content performance, article generation history, and key metrics.
*   **Technical Details**:
    *   **Components**: `components/Dashboard.tsx`, `components/StatisticsPage.tsx`, `components/LineChart.tsx`, `components/SEOMetricsBox.tsx`.
    *   **Data Aggregation**: Data from Supabase (article metadata, user activity) and potentially external APIs (SEO metrics) is aggregated and processed.
    *   **Visualization**: React components and charting libraries (e.g., `components/LineChart.tsx`) are used to visualize trends and statistics.

### 2.6 Web Crawling for Content Ideas
*   **Description**: The application can crawl specified web pages or general topics to gather information and generate content ideas or outlines.
*   **Technical Details**:
    *   **Service**: `services/webCrawlerService.ts` orchestrates the crawling process.
    *   **Serverless Function**: `netlify/functions/crawl.js` is likely a Netlify Function that executes the web crawling logic to avoid CORS issues and offload heavy processing from the client.
    *   **AI Integration**: The crawled content can be fed into the Gemini API for summarization, entity extraction, or idea generation.

### 2.7 Google Trends Integration
*   **Description**: Integrates with Google Trends to identify popular and trending topics, helping users create timely and relevant content.
*   **Technical Details**:
    *   **Service**: `services/googleTrendsService.ts` handles API calls to Google Trends.
    *   **Data Analysis**: Trend data is processed and presented to the user, often influencing content generation suggestions or SEO recommendations.

### 2.8 Bulk Article Generation
*   **Description**: Enables users to generate multiple articles simultaneously in batch mode, with real-time progress tracking, pause/resume functionality, and error handling for failed generations.
*   **Technical Details**:
    *   **Service**: `services/bulkGenerationService.ts` manages the bulk generation process, including queue management and rate limiting.
    *   **Context Provider**: `BulkGenerationContext.tsx` and `BulkGenerationProvider` handle state management across components.
    *   **Modal Interface**: `BulkGenerationModal.tsx` provides the UI for configuring and monitoring bulk generation jobs.
    *   **Progress Tracking**: Real-time progress updates with estimated time remaining and failure recovery.
    *   **AI Integration**: Uses the Google Gemini API with sequential processing to avoid rate limits.

### 2.9 Content Analysis and SEO Insights
*   **Description**: Performs comprehensive content analysis including competitor research, keyword opportunities, SEO scoring, and actionable recommendations for content optimization.
*   **Technical Details**:
    *   **Service**: `services/contentAnalyticsService.ts` handles deep content analysis using AI-powered insights combined with Google Trends data.
    *   **Quick Insights**: Provides rapid keyword metrics (volume, competition, trends) for instant decision making.
    *   **Competitor Analysis**: Identifies top competing pages, their domain authority, backlink counts, and content patterns.
    *   **Modal Interface**: `components/ContentAnalysisModal.tsx` displays detailed analytics and recommendations.
    *   **Data Caching**: Implements intelligent caching (24-hour duration) to optimize performance and API usage.

### 2.10 Image Search Integration
*   **Description**: Searches for royalty-free images from multiple sources to visually enhance articles and improve content engagement.
*   **Technical Details**:
    *   **Service**: `services/imageService.ts` integrates with Pexels and Google Images APIs for comprehensive image search.
    *   **Fallback Handling**: Implements smart fallback mechanisms when primary APIs are unavailable.
    *   **Query Modification**: Uses AI-powered query enhancements to improve search result quality.
    *   **Image Selection**: Returns multiple image options with attribution information for proper licensing.

### 2.11 Publishing Integrations
*   **Description**: Allows direct publishing of generated articles to external platforms like WordPress and Medium, streamlining the content workflow.
*   **Technical Details**:
    *   **Service**: `services/publishingService.ts` handles secure API connections and content formatting for different platforms.
    *   **WordPress Integration**: Supports application password authentication for seamless publishing.
    *   **Medium Integration**: Uses Medium's API with token-based authentication.
    *   **Content Formatting**: Automatically converts markdown content to HTML format for platform compatibility.
    *   **Security**: Credentials are encrypted and stored securely in Supabase database.

### 2.12 Markdown to HTML Conversion
*   **Description**: Converts markdown-formatted content to HTML with support for advanced features like tables, pricing comparisons, and custom formatting.
*   **Technical Details**:
    *   **Service**: `services/markdownToHtml.ts` handles the conversion process with specialized handling for pricing tables and comparisons.
    *   **Rich Content Support**: Processes price comparison tables, general comparison charts, and numbered lists.
    *   **Typography Enhancement**: Uses `@tailwindcss/typography` for styled HTML output.
    *   **Integration**: Used throughout the platform for previewing and publishing content.

## 3. Technical Architecture

The application follows a modern JAMstack (JavaScript, APIs, Markup) architecture with a focus on client-side rendering, serverless functions, and comprehensive content management capabilities.

*   **Frontend**: Built with React 18 and TypeScript, styled with Tailwind CSS (v4), and bundled with Vite for fast development and optimized production builds. Key libraries include:
    *   **Routing**: React Router DOM for client-side navigation
    *   **Animations**: Framer Motion for smooth UI transitions
    *   **Charts**: Chart.js and React-ChartJS-2 for data visualization
    *   **Forms & Components**: React Big Calendar for scheduling, Swiper for carousels, React DnD for drag-and-drop
    *   **Typography**: @tailwindcss/typography plugin for rich text rendering
    *   **Document Processing**: PDF.js for PDF handling, Docx and Mammoth for Word document support, XLSX for spreadsheet processing
    *   **HTTP Client**: Axios for API calls
    *   **Icons**: Lucide React for consistent iconography
    *   **SEO**: React Helmet Async for dynamic meta tag management
*   **Backend as a Service (BaaS)**: Supabase serves as the primary backend, providing:
    *   **PostgreSQL Database**: For structured data storage (users, articles, content calendar events, SEO reports, etc.).
    *   **Authentication**: User management, roles, and access control with encrypted credential storage.
    *   **Realtime**: Potential for live updates in the dashboard or editor.
*   **External APIs**:
    *   **Google Gemini API**: Core AI capabilities for content generation, analysis, and recommendations.
    *   **Google Trends API**: For market research, trend analysis, and keyword insights.
    *   **Image APIs**: Pexels and Google Images APIs for royalty-free image search.
    *   **Publishing APIs**: WordPress REST API and Medium API for content publishing.
*   **Serverless Functions**: Netlify Functions (`netlify/functions/`) are used for CORS-restricted operations and heavy processing:
    *   **Web Crawling**: `crawl.js` for website content extraction to avoid client-side CORS limitations.
    *   **Future Extensibility**: Framework ready for additional serverless operations.
*   **Static Assets**: Images (`assets/`), background videos, and other resources are served efficiently through Vite's asset optimization.

## 4. Data Models/Entities (Conceptual)

Key data entities managed by the application, primarily within Supabase:

*   **User**: `id`, `username`, `email`, `passwordHash`, `role`, `secretQuestion`, `secretAnswerHash`, `firstName`, `lastName`.
*   **Article**: `id`, `user_id`, `title`, `topic`, `location`, `articleContent`, `metaDescription`, `keywords`, `priceComparison`, `generalComparison`, `monthlySearches`, `primaryKeyword`, `keywordDifficulty`, `content_quality`, `tone`, `seoMetrics`, `created_at`.
*   **ContentCalendarEvent**: `id`, `user_id`, `title`, `start_date`, `end_date`, `status`, `notes`.
*   **BulkGenerationItem**: `id`, `topic`, `status`, `progress`, `article`, `error`, `retryCount`.
*   **BulkGenerationState**: `items`, `progress`, `isGenerating`, `lastSaved`.
*   **AiRecommendation**: `id`, `title`, `description`, `value`, `icon`, `color`.
*   **UserIntegration**: `id`, `user_id`, `provider`, `credentials`, `created_at`, `updated_at`.
*   **ContentAnalysis**: `keywordMetrics`, `competitorAnalysis`, `contentSuggestions`, `seoScore`, `marketInsights`.

## 5. Key Integrations

*   **Google Gemini API**: Core AI service integrated via `services/geminiService.ts` for content generation, analysis, keyword suggestions, and recommendations. Handles API key management, request formatting, response parsing, and fallback model selection.
*   **Supabase**: Primary backend integration via `services/supabase.ts`. Provides database operations, authentication, user management, and secure credential storage for integrations.
*   **Netlify Functions**: Serverless functions in `netlify/functions/` for CORS-restricted operations including web crawling (`crawl.js`) and potential future backend services.
*   **Google Trends API**: Market research integration via `services/googleTrendsService.ts` and `contentAnalyticsService.ts`. Provides real-time trend data, keyword competition, search volume estimates, and related keyword suggestions.
*   **External Image APIs**: Pexels and Google Images integration via `services/imageService.ts` for royalty-free image search and retrieval with fallback mechanisms.
*   **Publishing Platforms**: WordPress and Medium integration via `services/publishingService.ts`. Supports encrypted credential storage and automatic content formatting for direct publishing.
*   **Document Processing Libraries**: Fast XML Parser, Cheerio, and Cheerio for web content parsing and HTML manipulation in web crawling operations.

## 6. Development Environment & Build Process

*   **Language**: TypeScript for type safety and improved developer experience.
*   **Package Manager**: `npm`.
*   **Build Tool**: Vite (`vite.config.ts`) for fast development server and optimized production builds.
*   **Styling**: Tailwind CSS (`tailwind.config.js`, `postcss.config.js`, `index.css`) for utility-first styling.
*   **Environment Variables**: Managed via `.env` and `.env.local` files, accessed through `VITE_` prefixed variables in the client-side build.
*   **Scripts**: `package.json` defines scripts like `npm run dev` (start dev server), `npm run build` (create production build).
*   **Type Definitions**: `types.ts` and `src/types/` define custom TypeScript types for data structures and API responses.

This document provides a comprehensive technical overview for an AI to understand the structure, functionality, and underlying technologies of the AIrticle application.
