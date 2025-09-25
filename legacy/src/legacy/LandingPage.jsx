import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  CubeIcon,
  SparklesIcon,
  TruckIcon,
  BanknotesIcon,
  CpuChipIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const LandingPage = ({ onGetStarted }) => {
  const [isHovered, setIsHovered] = useState(false);

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Real-time Analytics',
      description: 'Monitor KPIs and metrics with live dashboard updates'
    },
    {
      icon: BanknotesIcon,
      title: 'Working Capital',
      description: 'Optimize cash flow and financial operations'
    },
    {
      icon: SparklesIcon,
      title: 'AI-Powered Insights',
      description: 'Machine learning forecasting and predictions'
    },
    {
      icon: TruckIcon,
      title: 'Production Tracking',
      description: 'End-to-end manufacturing visibility'
    },
    {
      icon: CubeIcon,
      title: 'Inventory Management',
      description: 'Smart stock control and optimization'
    },
    {
      icon: CpuChipIcon,
      title: 'MCP Integration',
      description: 'Enterprise AI orchestration system'
    }
  ];

  const benefits = [
    '99.99% Uptime SLA',
    'Bank-grade Security',
    'ISO 27001 Certified',
    '24/7 Support',
    'GDPR Compliant',
    'SOC 2 Type II'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-white font-semibold text-xl">Sentia Manufacturing</span>
            </div>
            <div className="text-blue-400 text-sm font-mono">
              Enterprise Platform v1.0.5
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-bold text-white mb-6"
            >
              Manufacturing Intelligence
              <span className="block text-3xl md:text-4xl text-blue-400 mt-2">
                Powered by AI
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto"
            >
              Enterprise-grade manufacturing operations platform with real-time analytics,
              AI-powered insights, and comprehensive business intelligence.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <button
                onClick={onGetStarted}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-lg rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <span className="mr-2">Enter Dashboard</span>
                <motion.div
                  animate={{ x: isHovered ? 5 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRightIcon className="w-5 h-5" />
                </motion.div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors duration-300"
              >
                <feature.icon className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Benefits Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="bg-gray-800/30 backdrop-blur border-y border-gray-700"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center justify-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300 text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center"
          >
            <div>
              <div className="text-4xl font-bold text-blue-400">269+</div>
              <div className="text-gray-400 mt-2">Components</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400">138+</div>
              <div className="text-gray-400 mt-2">API Endpoints</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400">92%</div>
              <div className="text-gray-400 mt-2">AI Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-400">99.99%</div>
              <div className="text-gray-400 mt-2">Uptime SLA</div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-gray-400 text-sm">
              Â© 2025 The Social Drink Company. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
