import React, { useRef, Suspense } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { useInView } from 'react-intersection-observer';

// Components
import ProductVisualization from './components/ProductVisualization';
import CountUp from './components/CountUp';
import FeatureCard from './components/FeatureCard';
import TestimonialsCarousel from './components/TestimonialsCarousel';
import PricingSection from './components/PricingSection';
import Footer from './components/Footer';

// Icons
import {
  ChartBarIcon,
  CpuChipIcon,
  LinkIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChevronRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const LandingPage = () => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <div className="landing-page min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Sentia</span>
            </motion.div>

            <motion.div
              className="hidden md:flex items-center space-x-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Testimonials</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</a>
              <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</a>
            </motion.div>

            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                  Start Free Trial
                </button>
              </SignUpButton>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={targetRef} className="hero relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* 3D Background */}
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <Suspense fallback={null}>
              <ProductVisualization />
            </Suspense>
          </Canvas>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 dark:via-gray-900/50 to-white dark:to-gray-900 pointer-events-none" />

        {/* Hero Content */}
        <motion.div
          ref={heroRef}
          className="relative z-10 container mx-auto px-4 text-center"
          style={{ y, opacity, scale }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <SparklesIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">AI-Powered Manufacturing Intelligence</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Transform Your Factory
              <br />
              <span className="text-gray-900 dark:text-white">With Real Intelligence</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Unlock the power of AI-driven insights to optimize production, predict demand,
              and maximize efficiency across your entire manufacturing operation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <SignUpButton mode="modal">
                <motion.button
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-xl hover:shadow-2xl transform transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="flex items-center gap-2">
                    Start 14-Day Free Trial
                    <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
              </SignUpButton>

              <motion.button
                className="group px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:border-blue-600 dark:hover:border-blue-400 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <PlayIcon className="w-5 h-5" />
                  Watch Demo
                </span>
              </motion.button>
            </div>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap justify-center gap-8 text-sm text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-blue-500" />
                <span>99.9% Uptime SLA</span>
              </div>
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-purple-500" />
                <span>50+ Integrations</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Animated Metrics */}
        <motion.div
          className="absolute bottom-10 left-0 right-0 z-10"
          initial={{ opacity: 0, y: 50 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <CountUp end={99.9} suffix="%" label="Uptime Guarantee" />
              <CountUp end={47} suffix="%" label="Average Efficiency Gain" />
              <CountUp end={2.3} suffix="M" label="Data Points Analyzed Daily" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to modernize your manufacturing operations and stay ahead of the competition.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ChartBarIcon className="w-8 h-8" />}
              title="Real-Time Analytics"
              description="Monitor production metrics, quality indicators, and efficiency rates with millisecond precision. Get instant alerts when anomalies are detected."
              delay={0}
              gradient="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={<CpuChipIcon className="w-8 h-8" />}
              title="AI-Powered Predictions"
              description="Leverage machine learning to forecast demand, predict maintenance needs, and optimize inventory levels automatically."
              delay={0.1}
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={<LinkIcon className="w-8 h-8" />}
              title="Seamless Integration"
              description="Connect with Xero, Unleashed, Shopify, and 50+ other platforms. Sync data in real-time across your entire tech stack."
              delay={0.2}
              gradient="from-green-500 to-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <FeatureCard
              icon={<ShieldCheckIcon className="w-8 h-8" />}
              title="Enterprise Security"
              description="Bank-level encryption, SSO support, and comprehensive audit logs. Your data is protected by industry-leading security measures."
              delay={0.3}
              gradient="from-red-500 to-orange-500"
            />
            <FeatureCard
              icon={<ClockIcon className="w-8 h-8" />}
              title="24/7 Monitoring"
              description="Continuous monitoring of all production lines with intelligent alerting. Never miss a critical event or opportunity."
              delay={0.4}
              gradient="from-indigo-500 to-blue-500"
            />
            <FeatureCard
              icon={<SparklesIcon className="w-8 h-8" />}
              title="Smart Automation"
              description="Automate routine tasks and workflows. Let AI handle the repetitive work while your team focuses on strategic decisions."
              delay={0.5}
              gradient="from-yellow-500 to-orange-500"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsCarousel />

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Transform Your Manufacturing?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join hundreds of manufacturers who are already using Sentia to optimize their operations.
            </p>
            <SignUpButton mode="modal">
              <motion.button
                className="px-10 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg shadow-xl hover:shadow-2xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Your Free Trial Today
              </motion.button>
            </SignUpButton>
            <p className="text-white/80 mt-4">No credit card required • 14-day free trial • Cancel anytime</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;