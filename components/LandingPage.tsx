import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Typed from 'typed.js';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import bgVideo from '../assets/bg-video.mp4';
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
import DemoSection from './DemoSection';

interface LandingPageProps {
  onNavigateToAuth: () => void;
  onNavigateToFeatures: () => void;
  onNavigateToPricing: () => void;
  onNavigateToContact: () => void;
  onNavigateToApp?: () => void;
  isLoggedIn: boolean;
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

const TestimonialCard: React.FC<{
  quote: string;
  author: string;
  role: string;
  rating: number;
  index: number;
}> = ({ quote, author, role, rating, index }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 relative"
    >
      <div className="flex mb-4">
        {[...Array(rating)].map((_, i) => (
          <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <blockquote className="text-slate-300 text-lg mb-4 italic">"{quote}"</blockquote>
      <div>
        <cite className="text-white font-semibold">{author}</cite>
        <p className="text-slate-400 text-sm">{role}</p>
      </div>
    </motion.div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToAuth,
  onNavigateToFeatures,
  onNavigateToPricing,
  onNavigateToContact,
  onNavigateToApp,
  isLoggedIn
}) => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const headerScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.98]);
  const headerY = useTransform(scrollYProgress, [0, 0.1], [0, -5]);
  const headerPadding = useTransform(scrollYProgress, [0, 0.1], ['2rem', '1rem']);
  const typedElementRef = useRef<HTMLSpanElement>(null);
  const typedInstanceRef = useRef<Typed | null>(null);

  // Mouse parallax state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Mouse move handler for parallax effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isHovering) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  useEffect(() => {
    if (typedElementRef.current) {
      typedInstanceRef.current = new Typed(typedElementRef.current, {
        strings: ['rticle.', 'rtist.', 'rtifact.'],
        typeSpeed: 150,
        backSpeed: 100,
        backDelay: 1000,
        loop: true,
      });
    }

    return () => {
      if (typedInstanceRef.current) {
        typedInstanceRef.current.destroy();
      }
    };
  }, []);

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

  const testimonials = [
    {
      quote: "AIrticle has revolutionized our content creation process. We went from spending hours on research to generating high-quality articles in minutes.",
      author: "Sarah Johnson",
      role: "Content Manager at TechCorp",
      rating: 5
    },
    {
      quote: "The geographic targeting feature is a game-changer. Our local SEO rankings have improved significantly since we started using AIrticle.",
      author: "Michael Chen",
      role: "Digital Marketing Director",
      rating: 5
    },
    {
      quote: "As a freelance writer, AIrticle helps me scale my business. The AI assistant suggestions are incredibly helpful for improving my content quality.",
      author: "Emma Rodriguez",
      role: "Freelance Content Creator",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <motion.header
        className="px-4 fixed top-0 left-0 right-0 z-[100] bg-slate-900/85 backdrop-blur-md border-b border-slate-800/50 shadow-lg transition-all duration-300 flex items-center"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: headerPadding,
          paddingBottom: headerPadding,
          minHeight: '4rem',
        }}
      >
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
            <motion.button 
              style={{
                scale: headerScale,
                y: headerY,
                backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
              onClick={onNavigateToApp || onNavigateToAuth} 
              whileHover={{ scale: 1.05 }}
              className="text-3xl sm:text-4xl font-bold tracking-tight animate-fade-in-up inline-flex items-baseline font-heading hover:scale-105 transition-all duration-300"
            >
              <span className="inline-block px-1.5 py-1.5 border-2 border-blue-300 rounded-md bg-gradient-to-r from-primary-500 to-accent-500 text-gray-900 text-3xl font-bold">AI</span>
              <span className="ml-1 text-3xl">rticle</span>
            </motion.button>
          <motion.div
            style={{
              scale: headerScale,
              y: headerY,
            }}
            className="flex items-center gap-2 sm:gap-4 transition-transform duration-300"
          >
            <button onClick={onNavigateToFeatures} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Features</button>
            <button onClick={onNavigateToPricing} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Pricing</button>
            <button onClick={onNavigateToContact} className="hidden sm:block px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Contact</button>
            {isLoggedIn ? (
              <button onClick={onNavigateToApp} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-colors">
                Back to App &rarr;
              </button>
            ) : (
              <button onClick={onNavigateToAuth} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-colors">
                Sign In &rarr;
              </button>
            )}
          </motion.div>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-20"></div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.4) contrast(0.8)' }}
        >
          <source src={bgVideo} type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Animated Background Elements */}
        <motion.div
          style={{ y }}
          className="absolute inset-0 opacity-20"
        >
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl" />
        </motion.div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-6xl sm:text-8xl font-bold text-white mb-6 tracking-tight font-heading">
              <span className="inline-block px-3 py-2 bg-purple-600 text-black rounded-lg mr-2 font-mono">AI</span>
              <span ref={typedElementRef} className="font-montserrat"></span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl sm:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Transform your content creation with AI-powered article generation.
            Create engaging, SEO-optimized articles in minutes, not hours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={isLoggedIn ? onNavigateToApp : onNavigateToAuth}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/50"
            >
              {isLoggedIn ? 'Start Creating' : 'Get Started Free'}
            </button>
            <button
              onClick={onNavigateToFeatures}
              className="border-2 border-slate-400 text-slate-300 hover:border-indigo-400 hover:text-indigo-400 font-semibold py-4 px-8 rounded-full text-lg transition-all duration-300"
            >
              Learn More
            </button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-3 bg-slate-400 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 font-heading">
              Trusted by Content Creators Worldwide
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Join thousands of professionals who have transformed their content workflow
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-bold text-indigo-400 mb-2 font-mono">50K+</div>
              <div className="text-slate-400">Articles Generated</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-bold text-purple-400 mb-2 font-mono">10K+</div>
              <div className="text-slate-400">Active Users</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-bold text-indigo-400 mb-2 font-mono">95%</div>
              <div className="text-slate-400">Satisfaction Rate</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-bold text-purple-400 mb-2 font-mono">24/7</div>
              <div className="text-slate-400">AI Support</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="py-20 px-4 bg-slate-800 relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              className="text-4xl sm:text-5xl font-bold text-white mb-6 font-heading"
              style={{
                x: isHovering ? (mousePosition.x - 0.5) * -20 : 0,
                y: isHovering ? (mousePosition.y - 0.5) * -10 : 0,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              How It Works
            </motion.h2>
            <motion.p
              className="text-xl text-slate-400 max-w-3xl mx-auto"
              style={{
                x: isHovering ? (mousePosition.x - 0.5) * -15 : 0,
                y: isHovering ? (mousePosition.y - 0.5) * -8 : 0,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              Create amazing content in just three simple steps
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
              animate={{
                x: isHovering ? (mousePosition.x - 0.5) * -25 : 0,
                y: isHovering ? (mousePosition.y - 0.5) * -12 : 0,
                rotateX: isHovering ? (mousePosition.y - 0.5) * 5 : 0,
                rotateY: isHovering ? (mousePosition.x - 0.5) * -5 : 0,
              }}
              whileHover={{
                scale: 1.05,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
            >
              <div className="bg-indigo-500/20 text-indigo-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold font-mono">1</div>
              <h3 className="text-xl font-bold text-white mb-4">Input Your Topic</h3>
              <p className="text-slate-400">Describe your content needs, target audience, and key points you want to cover.</p>
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg font-mono text-sm text-slate-300">
                <div className="text-indigo-400">const article = await generateArticle(&#123;</div>
                <div className="ml-4">topic: "AI Content Creation",</div>
                <div className="ml-4">tone: "professional",</div>
                <div className="ml-4">length: "1500 words"</div>
                <div className="text-indigo-400">&#125;);</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
              animate={{
                x: isHovering ? (mousePosition.x - 0.5) * -20 : 0,
                y: isHovering ? (mousePosition.y - 0.5) * -10 : 0,
                rotateX: isHovering ? (mousePosition.y - 0.5) * 3 : 0,
                rotateY: isHovering ? (mousePosition.x - 0.5) * -3 : 0,
              }}
              whileHover={{
                scale: 1.05,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
            >
              <div className="bg-purple-500/20 text-purple-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold font-mono">2</div>
              <h3 className="text-xl font-bold text-white mb-4">AI Processing</h3>
              <p className="text-slate-400">Our advanced AI analyzes your requirements and generates optimized content.</p>
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <div className="text-center mt-2 text-slate-400 font-mono text-sm">Processing...</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
              animate={{
                x: isHovering ? (mousePosition.x - 0.5) * -30 : 0,
                y: isHovering ? (mousePosition.y - 0.5) * -15 : 0,
                rotateX: isHovering ? (mousePosition.y - 0.5) * 7 : 0,
                rotateY: isHovering ? (mousePosition.x - 0.5) * -7 : 0,
              }}
              whileHover={{
                scale: 1.05,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
            >
              <div className="bg-indigo-500/20 text-indigo-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold font-mono">3</div>
              <h3 className="text-xl font-bold text-white mb-4">Get Your Article</h3>
              <p className="text-slate-400">Receive SEO-optimized, engaging content ready for publication.</p>
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg font-mono text-sm text-slate-300">
                <div className="text-green-400">✓ Article generated successfully</div>
                <div className="text-slate-400 mt-2">Word count: 1,247</div>
                <div className="text-slate-400">SEO Score: 92/100</div>
                <div className="text-slate-400">Readability: Excellent</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <DemoSection />

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Powerful Features for Modern Content Creation
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-8">
              Everything you need to create, optimize, and scale your content strategy with AI assistance.
            </p>
            <div className="flex items-center justify-center text-slate-400 text-sm md:hidden">
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              <span>Swipe to explore features</span>
              <ChevronRightIcon className="w-4 h-4 ml-2" />
            </div>
          </motion.div>

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
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 font-heading">
              Trusted & Secure
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Your data is protected with enterprise-grade security
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="flex items-center space-x-2 text-slate-400"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="font-mono text-sm">SSL Encrypted</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex items-center space-x-2 text-slate-400"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-mono text-sm">GDPR Compliant</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex items-center space-x-2 text-slate-400"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono text-sm">99.9% Uptime</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex items-center space-x-2 text-slate-400"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-mono text-sm">SOC 2 Certified</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-slate-800 relative overflow-hidden">
        {/* Parallax Background Image */}
        <motion.div
          style={{
            y: useTransform(scrollYProgress, [0.3, 0.7], ['-20%', '20%']),
          }}
          className="absolute inset-0 opacity-10"
        >
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/80" />
        </motion.div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              className="text-4xl sm:text-5xl font-bold text-white mb-6 font-heading"
              style={{
                textShadow: '0 0 30px rgba(255,255,255,0.1)',
              }}
            >
              Loved by Content Creators Worldwide
            </motion.h2>
            <motion.p
              className="text-xl text-slate-400 max-w-3xl mx-auto"
              style={{
                textShadow: '0 0 20px rgba(255,255,255,0.05)',
              }}
            >
              See what our users are saying about their experience with AIrticle.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-6 relative hover:bg-slate-800/80 transition-all duration-300"
                style={{
                  boxShadow: '0 0 40px rgba(0,0,0,0.3)',
                }}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.svg
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                      viewBox="0 0 20 20"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.2 + i * 0.1 }}
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </motion.svg>
                  ))}
                </div>
                <blockquote className="text-slate-300 text-lg mb-4 italic">"{testimonial.quote}"</blockquote>
                <div>
                  <cite className="text-white font-semibold">{testimonial.author}</cite>
                  <p className="text-slate-400 text-sm">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 font-heading">
              Stay Ahead of Content Trends
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Get weekly insights on AI content creation, SEO tips, and industry trends delivered to your inbox.
            </p>

            <div className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/10 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                />
                <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/50 font-mono">
                  Subscribe
                </button>
              </div>
              <p className="text-sm text-slate-400 mt-4">
                No spam, unsubscribe at any time. We respect your privacy.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-900 to-purple-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Content Creation?
            </h2>
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
              Join thousands of content creators who have already revolutionized their workflow with AIrticle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={isLoggedIn ? onNavigateToApp : onNavigateToAuth}
                className="bg-white text-indigo-900 hover:bg-slate-100 font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {isLoggedIn ? 'Start Creating Now' : 'Start Free Trial'}
              </button>
              <button
                onClick={onNavigateToPricing}
                className="border-2 border-white text-white hover:bg-white hover:text-indigo-900 font-semibold py-4 px-8 rounded-full text-lg transition-all duration-300"
              >
                View Pricing
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer
        onNavigateToPricing={onNavigateToPricing}
        onNavigateToTerms={() => { }}
        onNavigateToPrivacy={() => { }}
      />
    </div>
  );
};
