import React from 'react';
import { motion, useInView } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { TargetIcon } from './icons/TargetIcon';
import { BarChartIcon } from './icons/BarChartIcon';
import { MailIcon } from './icons/MailIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { TrendIcon } from './icons/TrendIcon';
import { FilesIcon } from './icons/FilesIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { ImageIcon } from './icons/ImageIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { Footer } from './Footer';
import { StaticPageTitle } from './PageTitle';
import { useAuth } from './AuthContext';

interface FeaturesPageProps {
  onNavigateToAuth: () => void;
  onNavigateToApp?: () => void;
  onNavigateToPricing: () => void;
  onNavigateToContact: () => void;
  onNavigateToTerms: () => void;
  onNavigateToPrivacy: () => void;
}

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}> = ({ icon, title, description, index }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col items-start transform hover:-translate-y-2 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 group"
    >
      <div className="bg-indigo-500/20 text-indigo-400 p-3 rounded-lg mb-4 group-hover:bg-indigo-500/30 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
};

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigateToAuth, onNavigateToApp, onNavigateToPricing, onNavigateToContact, onNavigateToTerms, onNavigateToPrivacy }) => {
  const { user } = useAuth();
  const actualLoggedIn = !!user;
  const features = [
    {
      icon: <SparkleIcon className="h-6 w-6" />,
      title: "AI-Powered Content",
      description: "Leverage the power of advanced AI to generate high-quality, relevant, and engaging articles in minutes. Our sophisticated algorithms ensure content that reads naturally and resonates with your audience."
    },
    {
      icon: <TargetIcon className="h-6 w-6" />,
      title: "Geographic Targeting",
      description: "Optimize your content for local search by specifying a target country, city, or region for each article. Reach the right audience in the right location with precision targeting."
    },
    {
      icon: <BarChartIcon className="h-6 w-6" />,
      title: "SEO Optimization",
      description: "Articles are structured with SEO best practices in mind to help you rank higher in search engine results. Built-in keyword optimization and meta tag suggestions included."
    },
    {
      icon: <ChatBubbleIcon className="h-6 w-6" />,
      title: "Customizable Tone",
      description: "Choose from a variety of tones of voice to match your brand's personality and connect with your audience. From professional to conversational, we adapt to your style."
    },
    {
      icon: <FilesIcon className="h-6 w-6" />,
      title: "Content Dashboard",
      description: "Manage all your generated articles in one place. Edit, review, and delete content with ease. Track your content performance and organize your articles efficiently."
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l.707-.707m2.828 9.9a5 5 0 117.072 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      title: "AI Assistant",
      description: "Get help and suggestions from our integrated AI assistant to refine your articles and improve your content strategy. Real-time feedback and optimization tips."
    },
    {
      icon: <TrendIcon className="h-6 w-6" />,
      title: "Google Trends Integration",
      description: "Stay ahead of trends with built-in Google Trends analysis. Discover trending topics and keywords to create timely, relevant content that drives engagement."
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
      title: "Bulk Generation",
      description: "Generate multiple articles at once with our bulk processing feature. Perfect for content creators and agencies who need to produce large volumes of content efficiently."
    },
    {
      icon: <ImageIcon className="h-6 w-6" />,
      title: "Image Generation Integration",
      description: "Automatically generate relevant, high-quality images to complement your articles. AI-powered visuals that match your content theme and enhance reader engagement."
    }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <StaticPageTitle pageName="Features" />
      <header className="py-8 px-4">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
          <button onClick={() => window.location.href = '/'} className="text-3xl sm:text-4xl font-bold tracking-tight text-white inline-block font-montserrat">
            <span className="inline-block px-2 py-1 bg-purple-600 text-black rounded">AI</span>rticle
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={onNavigateToPricing} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Pricing</button>
            <button onClick={onNavigateToContact} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Contact</button>
            <button onClick={actualLoggedIn ? onNavigateToApp : onNavigateToAuth} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-colors">
              {actualLoggedIn ? 'Back to App' : 'Sign In'} &rarr;
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Powerful Features to Supercharge Your Content
            </h1>
            <p className="mt-4 text-lg text-slate-400 max-w-3xl mx-auto">
              Our AI-powered platform is packed with tools designed to make content creation faster, smarter, and more effective.
            </p>
          </div>

          {/* Desktop Grid Layout */}
          <div className="hidden lg:grid grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>

          {/* Tablet Layout (2 columns) */}
          <div className="hidden md:grid lg:hidden grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>

          {/* Mobile Slider */}
          <div className="md:hidden swiper-container">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={1.2}
              centeredSlides={false}
              navigation={{
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
              }}
              pagination={{
                el: '.swiper-pagination',
                clickable: true,
                dynamicBullets: true,
              }}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={true}
              className="pb-12"
            >
              {features.map((feature, index) => (
                <SwiperSlide key={index} className="pb-2">
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    index={0} // Reset index for mobile to avoid staggered animations
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Custom Navigation */}
            <div className="flex justify-center items-center gap-4 mt-4">
              <button className="swiper-button-prev bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-full p-2 transition-all duration-300 border border-slate-700">
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <div className="swiper-pagination flex gap-1"></div>
              <button className="swiper-button-next bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-full p-2 transition-all duration-300 border border-slate-700">
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Custom pagination styling */}
            <style dangerouslySetInnerHTML={{
              __html: `
                .swiper-pagination-bullet {
                  background: #64748b;
                  opacity: 0.5;
                }
                .swiper-pagination-bullet-active {
                  opacity: 1;
                  background: #6366f1;
                }
                .swiper-button-prev,
                .swiper-button-next {
                  opacity: 0.7;
                }
                .swiper-button-prev:after,
                .swiper-button-next:after {
                  display: none;
                }
              `
            }} />
          </div>

          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
            <p className="mt-3 text-slate-400">Generate your first article for free.</p>
            <button onClick={actualLoggedIn ? onNavigateToApp : onNavigateToPricing} className="mt-6 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
              Start Generating
            </button>
          </div>
        </div>
      </main>
      <Footer onNavigateToTerms={onNavigateToTerms} onNavigateToPrivacy={onNavigateToPrivacy} />
    </div>
  );
};
