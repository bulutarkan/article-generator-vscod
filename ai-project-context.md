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

## 3. Technical Architecture

The application follows a modern JAMstack (JavaScript, APIs, Markup) architecture with a focus on client-side rendering and serverless functions.

*   **Frontend**: Built with React and TypeScript, styled with Tailwind CSS, and bundled with Vite for a fast development experience. The UI is component-based, with a clear separation of concerns (e.g., `components/Generator.tsx`, `components/Editor.tsx`, `components/Dashboard.tsx`).
*   **Backend as a Service (BaaS)**: Supabase serves as the primary backend, providing:
    *   **PostgreSQL Database**: For structured data storage (users, articles, content calendar events, SEO reports, etc.).
    *   **Authentication**: User management, roles, and access control.
    *   **Realtime**: Potential for live updates in the dashboard or editor.
*   **External APIs**:
    *   **Google Gemini API**: Core AI capabilities for content generation.
    *   **Google Trends API**: For market research and trend analysis.
*   **Serverless Functions**: Netlify Functions (`netlify/functions/`) are used for specific backend tasks that require server-side execution, such as web crawling (`crawl.js`), to enhance performance and security, and manage external API calls.
*   **Static Assets**: Images (`assets/`) and other static resources are served efficiently.

## 4. Data Models/Entities (Conceptual)

Key data entities managed by the application, primarily within Supabase:

*   **User**: `id`, `email`, `profile_data` (name, preferences), `subscription_status`.
*   **Article**: `id`, `user_id`, `title`, `content` (raw/markdown), `html_content`, `status` (draft, published, scheduled), `seo_score`, `keywords`, `generated_date`, `publish_date`.
*   **SEOReport**: `id`, `article_id`, `analysis_data` (recommendations, scores), `generated_date`.
*   **ContentCalendarEvent**: `id`, `user_id`, `article_id` (optional), `event_type` (publish, draft, idea), `date`, `notes`.
*   **GeneratedContent**: `id`, `user_id`, `request_prompt`, `response_content`, `model_used`, `timestamp`.

## 5. Key Integrations

*   **Google Gemini API**: Integrated via `services/geminiService.ts`. This service handles API key management, request formatting, and response parsing. It's used across features requiring AI text generation or analysis.
*   **Supabase**: Integrated via `services/supabase.ts`. This service provides the client-side interface to interact with Supabase's database, authentication, and storage features.
*   **Netlify Functions**: Defined in `netlify/functions/`. These are deployed as serverless functions and are typically invoked via API calls from the frontend or other services (e.g., `webCrawlerService.ts`).
*   **Google Trends**: Integrated via `services/googleTrendsService.ts`. This service likely queries Google Trends data to provide insights into trending topics.

## 6. Development Environment & Build Process

*   **Language**: TypeScript for type safety and improved developer experience.
*   **Package Manager**: `npm`.
*   **Build Tool**: Vite (`vite.config.ts`) for fast development server and optimized production builds.
*   **Styling**: Tailwind CSS (`tailwind.config.js`, `postcss.config.js`, `index.css`) for utility-first styling.
*   **Environment Variables**: Managed via `.env` and `.env.local` files, accessed through `VITE_` prefixed variables in the client-side build.
*   **Scripts**: `package.json` defines scripts like `npm run dev` (start dev server), `npm run build` (create production build).
*   **Type Definitions**: `types.ts` and `src/types/` define custom TypeScript types for data structures and API responses.

This document provides a comprehensive technical overview for an AI to understand the structure, functionality, and underlying technologies of the AIrticle application.
