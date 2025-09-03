import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DemoSection: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [topicText, setTopicText] = useState('');
  const [locationText, setLocationText] = useState('');
  const [toneText, setToneText] = useState('');
  const [lengthText, setLengthText] = useState('');
  const [resultText, setResultText] = useState('');
  const [internalLinksEnabled, setInternalLinksEnabled] = useState(false);

  const topicString = 'Sustainable Energy Solutions';
  const locationString = 'United States';
  const toneString = 'Professional';
  const lengthString = '1500 words';

  const resultString = `# The Future of Sustainable Energy Solutions

The global energy landscape is undergoing a transformative shift towards sustainability. As we face unprecedented climate challenges, innovative solutions are emerging that promise to revolutionize how we generate, store, and consume energy.

## Key Challenges and Opportunities

The transition to sustainable energy solutions requires addressing several critical challenges. First, the intermittency of renewable sources like solar and wind power necessitates advanced storage technologies. Second, the existing infrastructure must be upgraded to accommodate distributed energy systems.

## Breakthrough Technologies

Recent breakthroughs in battery storage technology have made renewable energy more reliable and cost-effective. Lithium-ion batteries, once prohibitively expensive, have seen costs drop by over 80% in the past decade. Emerging technologies like solid-state batteries promise even greater improvements.

## Implementation Strategies

Successful implementation requires a multi-faceted approach:

1. **[Grid Modernization](#grid-modernization)**: Upgrading transmission and distribution systems
2. **[Smart Technologies](#smart-technologies)**: IoT sensors and AI-driven optimization
3. **[Policy Support](#policy-support)**: Government incentives and regulatory frameworks
4. **[Public Awareness](#public-awareness)**: Education and community engagement initiatives

## Future Outlook

The future of sustainable energy is bright, with continued innovation driving down costs and improving efficiency. By embracing these technologies, we can create a cleaner, more prosperous future for generations to come.

${internalLinksEnabled ? `
---

## 🔗 Internal Links Optimization

**Suggested Internal Links:**
- Learn more about [energy storage solutions](#)
- Discover our guide on [renewable energy transition](#)
- Explore [sustainable technology innovations](#)
- Read about our [climate change mitigation strategies](#)

**SEO Optimization Applied:**
✓ Strategic keyword placement
✓ Semantic content structure
✓ Internal linking framework
✓ Mobile-first responsive design
` : ''}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentStep(1);

      // Type topic text
      let index = 0;
      const typeTopic = () => {
        if (index < topicString.length) {
          setTopicText(topicString.slice(0, index + 1));
          index++;
          setTimeout(typeTopic, 100);
        }
      };
      typeTopic();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentStep === 1) {
      const timer = setTimeout(() => {
        setCurrentStep(2);

        // Type location text
        let index = 0;
        const typeLocation = () => {
          if (index < locationString.length) {
            setLocationText(locationString.slice(0, index + 1));
            index++;
            setTimeout(typeLocation, 80);
          } else {
            // After location, go to tone selection
            setTimeout(() => setCurrentStep(3), 1000);
          }
        };
        typeLocation();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 3) {
      // Type tone text
      let index = 0;
      const typeTone = () => {
        if (index < toneString.length) {
          setToneText(toneString.slice(0, index + 1));
          index++;
          setTimeout(typeTone, 80);
        } else {
          // After tone, go to length
          setTimeout(() => setCurrentStep(4), 1000);
        }
      };
      typeTone();
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 4) {
      // Type length text
      let index = 0;
      const typeLength = () => {
        if (index < lengthString.length) {
          setLengthText(lengthString.slice(0, index + 1));
          index++;
          setTimeout(typeLength, 80);
        } else {
          // Enable internal links
          setInternalLinksEnabled(true);
          // Start generation
          setTimeout(() => {
            setCurrentStep(5);
            setIsGenerating(true);
          }, 1000);
        }
      };
      typeLength();
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 5) {
      const timer = setTimeout(() => {
        setIsGenerating(false);
        setShowResult(true);

        // Type result text
        let index = 0;
        const typeResult = () => {
          if (index < resultString.length) {
            setResultText(resultString.slice(0, index + 1));
            index++;
            setTimeout(typeResult, 25);
          }
        };
        typeResult();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 font-heading">
            See AIrticle in Action
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Watch how our AI transforms your ideas into polished, SEO-optimized articles in real-time
          </p>
        </motion.div>

        {/* macOS Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-2xl border border-gray-300 overflow-hidden h-[700px] max-h-screen">
            {/* Window Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-300 flex items-center flex-shrink-0">
              {/* Traffic Lights */}
              <div className="flex space-x-2 mr-4">
                <div className="w-3 h-3 bg-red-500 rounded-full border border-red-600"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full border border-yellow-500"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full border border-green-600"></div>
              </div>

              {/* Window Title */}
              <div className="flex-1 text-center">
                <span className="text-sm font-medium text-gray-700 font-mono">
                  AIrticle - Article Generator Pro
                </span>
              </div>
            </div>

            {/* Window Content - Scrollable */}
            <div className="bg-white h-[calc(100%-60px)] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
              <div className="p-8">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Create New Article</h1>
                <p className="text-gray-600">Generate high-quality, SEO-optimized articles with AI</p>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Topic Input */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Topic
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 font-mono"
                      placeholder={!topicText ? "Enter your topic..." : ""}
                      readOnly
                    />
                    <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-800 font-mono pointer-events-none ${topicText ? 'opacity-100' : 'opacity-70'}`}>
                      {topicText}
                      <span className="animate-pulse">|</span>
                    </div>
                  </div>
                </div>

                {/* Location Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Location
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 font-mono appearance-none"
                      disabled
                    >
                      <option>Select a location...</option>
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Canada</option>
                      <option>Australia</option>
                    </select>
                    <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-800 font-mono pointer-events-none ${locationText ? 'opacity-100' : 'opacity-70'}`}>
                      {locationText}
                      <span className="animate-pulse">|</span>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Tone Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Writing Tone
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 font-mono appearance-none"
                      disabled
                    >
                      <option>Select a tone...</option>
                      <option>Professional</option>
                      <option>Casual</option>
                      <option>Academic</option>
                      <option>Conversational</option>
                    </select>
                    <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-800 font-mono pointer-events-none ${toneText ? 'opacity-100' : 'opacity-70'}`}>
                      {toneText}
                      <span className="animate-pulse">|</span>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Length Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Length
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 font-mono appearance-none"
                      disabled
                    >
                      <option>Select length...</option>
                      <option>800 words</option>
                      <option>1500 words</option>
                      <option>2500 words</option>
                      <option>4000 words</option>
                    </select>
                    <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-800 font-mono pointer-events-none ${lengthText ? 'opacity-100' : 'opacity-70'}`}>
                      {lengthText}
                      <span className="animate-pulse">|</span>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Internal Links Toggle */}
                <div className="flex items-center space-x-3">
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${internalLinksEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${internalLinksEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Generate Internal Links
                    </label>
                    <p className="text-xs text-gray-500">Optimize for SEO with strategic internal linking</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-6"
                  >
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3, ease: 'easeInOut' }}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                      />
                    </div>
                    <p className="text-sm text-gray-600 font-mono text-center">
                      Advanced AI analyzing content... Optimizing SEO... Generating internal links...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result */}
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="border border-gray-200 rounded-lg p-6 bg-gray-50 mt-6 min-h-[400px] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">Generated Article</h3>
                      <div className="flex space-x-2">
                        <button className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                        <span>{resultText}</span>
                        <span className="animate-pulse">|</span>
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-slate-400 text-lg">
            Generate professional articles in under 30 seconds with AI assistance
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoSection;
