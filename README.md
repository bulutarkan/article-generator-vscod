<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AIrticle - AI Powered Article Generator

## Overview

The AIrticle - Article Generator is a powerful, AI-powered platform designed to streamline the process of generating, analyzing, and managing high-quality articles. Leveraging advanced artificial intelligence, this application empowers users to create engaging content efficiently, optimize it for search engines, and organize their publishing efforts with ease.

## Features

*   **AI-powered Article Generation**: Generate unique and high-quality articles on various topics using integrated AI models.
*   **SEO Analysis and Recommendations**: Get real-time SEO insights and suggestions to improve article visibility and ranking.
*   **Content Calendar and Scheduling**: Plan, organize, and schedule your content publishing with an intuitive content calendar.
*   **User Authentication and Profile Management**: Secure user authentication and personalized profile management.
*   **Dashboard and Statistics**: Monitor key performance indicators and track content engagement through a comprehensive dashboard.
*   **Integration with AI Models**: Seamlessly integrates with AI models like Google Gemini for enhanced content creation.
*   **Web Crawling for Content Ideas**: Discover trending topics and gather information from the web to inspire new content.
*   **Google Trends Integration**: Analyze search interest and popular topics to create timely and relevant articles.

## Technologies Used

*   **Frontend**: React, TypeScript, Tailwind CSS, Vite
*   **Backend/Services**:
    *   Google Gemini API: For AI-powered content generation and analysis.
    *   Supabase: Provides robust backend services including database, authentication, and real-time capabilities.
    *   Netlify Functions: Serverless functions used for specific tasks like web crawling.

## Getting Started

Follow these steps to set up and run the AI Article Generator locally.

**Prerequisites:**

*   Node.js (LTS version recommended)
*   npm (Node Package Manager)

**Installation:**

1.  **Clone the repository (if applicable):**
    `git clone <repository-url>`
    `cd article-generator`
2.  **Install dependencies:**
    `npm install`

**Configuration:**

1.  **Set up environment variables:**
    Create a `.env.local` file in the root directory of the project.
    *   Obtain a `GEMINI_API_KEY` from Google AI Studio and add it to your `.env.local` file:
        `VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY`
    *   (Optional) Configure Supabase if you intend to use its services (database, authentication). You will need `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**Running the Application:**

1.  **Start the development server:**
    `npm run dev`
2.  Open your browser and navigate to `http://localhost:5173` (or the port indicated in your terminal).

## Deployment

This application is designed to be deployed on platforms like Netlify, leveraging Netlify Functions for serverless backend logic. Specific deployment instructions would typically involve connecting your repository to Netlify and configuring environment variables.
