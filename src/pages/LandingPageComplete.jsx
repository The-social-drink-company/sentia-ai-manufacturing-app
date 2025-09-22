import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  CubeIcon,
  TruckIcon,
  BeakerIcon,
  ChartPieIcon,
  BanknotesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const LandingPageComplete = () => {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // All working navigation functions
  const handleNavigate = (path) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  // Main feature cards with working navigation
  const features = [
    {
      icon: CurrencyDollarIcon,
      title: 'Working Capital',
      description: 'Optimize cash flow and manage financial operations',
      path: '/working-capital',
      color: 'from-blue-500 to-blue-700',
      stats: '15% ROI Increase'
    },
    {
      icon: ChartPieIcon,
      title: 'What-If Analysis',
      description: 'Simulate scenarios and forecast business outcomes',
      path: '/what-if',
      color: 'from-purple-500 to-purple-700',
      stats: 'Real-time Modeling'
    },
    {
      icon: LightBulbIcon,
      title: 'AI Analytics',
      description: 'AI-powered insights and predictive analytics',
      path: '/ai-analytics',
      color: 'from-amber-500 to-amber-700',
      stats: '98% Accuracy'
    },
    {
      icon: CubeIcon,
      title: 'Inventory Management',
      description: 'Real-time inventory tracking and optimization',
      path: '/inventory',
      color: 'from-green-500 to-green-700',
      stats: '30% Cost Reduction'
    },
    {
      icon: TruckIcon,
      title: 'Production Planning',
      description: 'Optimize production schedules and resources',
      path: '/production',
      color: 'from-indigo-500 to-indigo-700',
      stats: '25% Efficiency Boost'
    },
    {
      icon: BeakerIcon,
      title: 'Quality Control',
      description: 'Monitor and ensure product quality standards',
      path: '/quality',
      color: 'from-red-500 to-red-700',
      stats: '99.9% Quality Rate'
    }
  ];

  // Quick action buttons
  const quickActions = [
    { label: 'Dashboard', path: '/dashboard', primary: true },
    { label: 'Working Capital', path: '/working-capital' },
    { label: 'What-If Analysis', path: '/what-if' },
    { label: 'AI Analytics', path: '/ai-analytics' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header with working navigation */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div
              className="flex items-center cursor-pointer"
              onClick={() => handleNavigate('/dashboard')}
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">S</span>
              </div>
              <h1 className="ml-3 text-xl font-bold text-white">
                Sentia Manufacturing
              </h1>
            </div>

            {/* Navigation buttons */}
            <nav className="flex items-center space-x-4">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => handleNavigate(action.path)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    action.primary
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Enterprise Manufacturing
              <span className="block text-blue-400">Intelligence Platform</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform your manufacturing operations with AI-powered analytics,
              real-time monitoring, and comprehensive financial management.
            </p>

            {/* Main CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleNavigate('/dashboard')}
                className="group px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center justify-center"
              >
                Enter Dashboard
                <ArrowRightIcon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => handleNavigate('/working-capital')}
                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-lg font-semibold hover:bg-white/20 transition-all transform hover:scale-105"
              >
                Working Capital Analysis
              </button>
              <button
                onClick={() => handleNavigate('/what-if')}
                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-lg font-semibold hover:bg-white/20 transition-all transform hover:scale-105"
              >
                What-If Scenarios
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid with working cards */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Comprehensive Manufacturing Suite
            </h2>
            <p className="text-xl text-gray-400">
              Click any feature to explore its capabilities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
                onClick={() => handleNavigate(feature.path)}
                className="relative group cursor-pointer"
              >
                <div className="h-full bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 hover:border-white/40 transition-all hover:transform hover:scale-105">
                  {/* Icon with gradient background */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {feature.description}
                  </p>

                  {/* Stats badge */}
                  <div className="inline-block px-3 py-1 bg-white/10 rounded-full">
                    <span className="text-sm text-blue-400 font-medium">
                      {feature.stats}
                    </span>
                  </div>

                  {/* Hover indicator */}
                  <div className={`absolute bottom-4 right-4 transition-opacity ${
                    hoveredFeature === index ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <ArrowRightIcon className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 px-4 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Enterprise-Grade Features
              </h2>
              <div className="space-y-4">
                {[
                  'Real-time dashboard with live data updates',
                  'AI-powered predictive analytics',
                  'Comprehensive financial management tools',
                  'Advanced inventory optimization',
                  'Quality control and compliance tracking',
                  'Integrated supply chain management',
                  'Custom reporting and data export',
                  '24/7 monitoring and alerts'
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: '99.9%', label: 'Uptime SLA' },
                { value: '500+', label: 'API Integrations' },
                { value: '24/7', label: 'AI Monitoring' },
                { value: '<10ms', label: 'Response Time' }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20"
                >
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Operations?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Get instant access to all enterprise features with live data integration
            </p>
            <button
              onClick={() => handleNavigate('/dashboard')}
              className="group px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 flex items-center justify-center mx-auto"
            >
              <SparklesIcon className="mr-2 w-6 h-6" />
              Launch Enterprise Dashboard
              <ArrowRightIcon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-md border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold">S</span>
            </div>
            <span className="ml-2 text-white font-semibold">
              Sentia Manufacturing Dashboard
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 Sentia Manufacturing. Enterprise Edition with Live Data.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageComplete;