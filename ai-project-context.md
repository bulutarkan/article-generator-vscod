# AIrticle - AI Article Generator Platform

## 🎯 Project Overview

**AIrticle** is a sophisticated AI-powered content generation platform that helps content creators, businesses, and agencies produce high-quality, SEO-optimized articles quickly and efficiently.

## 🏷️ Branding & Identity

- **App Name:** AIrticle
- **Logo:** "AI" in purple background + "rticle" in white
- **Tagline:** Empowering Content Creation with AI Intelligence
- **Target Audience:** Content creators, small businesses, agencies, enterprises

## ✨ Core Features

### AI-Powered Content Generation
- Advanced article generation using Google Gemini AI
- Customizable tone and writing style
- SEO-optimized content with keyword optimization
- Geographic targeting for local search optimization

### Advanced SEO & Analytics
- Comprehensive SEO analysis and scoring
- Keyword research with search volume and competition data
- Competitor analysis and content gap identification
- Real-time SEO metrics (readability, keyword density, content quality)
- Google Trends integration for trending topics

### Content Dashboard
- Article storage and management
- Edit, review, and organize generated content
- Performance tracking and analytics
- Version history and content exports

### AI Assistant Integration
- Real-time content improvement suggestions
- Automated refinement and optimization tips
- Interactive feedback system

### Content Calendar System
- Full-featured calendar interface with react-big-calendar
- Event planning and scheduling (planned, in_progress, completed, cancelled)
- Multi-day event support with status tracking
- Day view modal for multiple events per day
- Dynamic status filtering and visual event counters
- Integration with article generation workflow

### Publishing Integrations

#### WordPress Integration
- Basic Auth authentication using WordPress Application Passwords
- Automatic markdown-to-HTML conversion
- Draft/publish status control
- Direct publication to WordPress sites
- Error handling and status feedback

#### Medium Integration
- OAuth authentication with Bearer token
- Author ID retrieval and management
- HTML content publishing
- Draft/publication status options
- Seamless Medium API integration

### Bulk Content Generation
- Generate multiple articles simultaneously
- Progress tracking and queue management
- Retry failed generations
- Batch processing for agencies and large-scale content creation

### Image Integration
- Unsplash image integration ready to copy & paste for articles

### Geographic Targeting
- Location-specific content optimization
- Local SEO enhancement
- Price comparison features by region

## 💳 Subscription Models & Pricing

### Starter Plan - $9.99/month
- 20 articles per month
- GPT-5 Mini & Gemini 2.5 Flash
- Community support
- Basic AI article generation
- Keyword suggestions
- Basic SEO analytics
- Article storage & management
- Export options
* Best for everyone to tryout.

### Pro Plan - $29.99/month (Most Popular)
Everything in Starter and +
- Claude 3.5 & Grok 4
- Advanced AI article generation
- Calendar for workflow
- Comprehensive keyword research
- Full content analysis & SEO
- Google Trends integration
- AI assistant access
- Export options
- Content calendar access
- WordPress/Medium publishing
- Priority support
* Best for individual content managers, digital marketers etc.

### Enterprise Plan - $99.99/month
Everything in Pro and +
- 500 articles per month
- GPT 5 & Gemini 2.5 Pro
- Custom AI models with API keys
- Advanced analytics & reporting
- Team collaboration workspaces
- White-label options
- Dedicated account manager
- All platform features unlocked
* Best for agencies and enterprises

## 🛠️ Technical Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for build system
- **React Router** for navigation
- **Framer Motion** for animations
- **Swiper** for mobile-responsive carousels
- **React Big Calendar** for scheduling interface

### Backend & Services
- **Supabase** for database and authentication
- **Google Gemini AI** for content generation
- **Axios** for API communication
- **Cheerio** for web scraping
- **Google Trends API** for trend analysis
- **WordPress REST API** for publishing integration
- **Medium API** for publishing integration

### Key Dependencies
- `@google/genai`: Google Gemini AI integration
- `@supabase/supabase-js`: Backend as a service
- `react-big-calendar`: Calendar functionality
- `axios`: HTTP client
- `cheerio`: Web scraping
- `crypto-js`: Encryption utilities

## 🔧 Architecture & Features

### Authentication & User Management
- Supabase authentication system
- Role-based access control
- User profile management
- API key management for integrations

### Content Generation Pipeline
1. Topic and keyword analysis
2. Content structure generation
3. SEO optimization
4. Location-based customization
5. Quality validation
6. Format conversion (markdown/HTML)

### Calendar Integration
- Event creation tied to content schedules
- Status tracking throughout content lifecycle
- Article-to-calendar linking
- Visual progress indicators
- Multi-user calendar sharing (future feature)

### Publishing Workflow
1. Content approval in dashboard
2. Platform selection (WordPress/Medium)
3. Credential validation
4. Content transformation
5. API publication
6. Status tracking and error handling

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Gemini API key
- Supabase account

### Installation
```bash
npm install
# Set up environment variables in .env.local
npm run dev
```

### Environment Setup
```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Database Schema

### Key Tables
- `articles`: Content storage and metadata
- `calendar_events`: Scheduling and planning
- `user_integrations`: Publishing platform credentials
- `seo_analytics`: Performance tracking
- `bulk_generations`: Multi-article processing

### Authentication
- Supabase Auth for user management
- Row-level security policies
- Integration credential encryption

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interactions
- Optimized performance

### Visual Elements
- Dark theme with slate/indigo color scheme
- Smooth animations and transitions
- Loading states and progress indicators
- Interactive modals and overlays

### User Experience
- Intuitive workflow from generation to publication
- Real-time feedback and status updates
- Comprehensive help and documentation
- Error handling with user-friendly messages

## 📈 Market Position & Use Cases

### Target Markets
- Content Marketing Agencies
- E-commerce Stores
- Bloggers and Influencers
- Local Businesses
- SEO Specialists
- Small/Medium Enterprises

### Common Use Cases
- Blog content creation
- Product descriptions
- Local SEO articles
- News and trend articles
- Technical documentation
- Social media content
- Email marketing copy

## 🔐 Security & Compliance

- Encrypted credential storage
- Secure API communication
- GDPR compliance preparation
- Data export capabilities
- Regular security audits

## 🚀 Future Enhancements

### Planned Features
- Multi-language content generation
- Advanced team collaboration
- Analytics dashboard with detailed metrics
- AI content optimization suggestions
- Custom AI model training
- Direct social media publishing
- Webhook integrations

## 📞 Support & Resources

- In-platform AI assistant
- Community forum
- Priority support for Pro/Enterprise plans
- Comprehensive documentation
- API documentation for integrations

## 🎯 Business Metrics

- Free trial conversion rates
- Article generation success rates
- Publishing integration usage
- User retention and engagement
- Average time to publish content

---

*This context file provides comprehensive information about AIrticle for effective project management, development, and AI assistance.*

**Last Updated:** September 2025
**Version:** v1.0.0
