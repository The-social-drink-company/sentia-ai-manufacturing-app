import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  LightBulbIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0)

  // Handle scroll for parallax effects
  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const features = [
    {
      icon: CurrencyDollarIcon,
      title: 'Working Capital Optimization',
      description: 'Advanced analytics to optimize cash flow and working capital management across all Sentia operations.',
      color: 'from-blue-600 to-blue-800'
    },
    {
      icon: ArrowTrendingUpIcon,
      title: 'Cash Flow Forecasting',
      description: 'Predictive modeling and AI-driven insights for accurate financial planning and decision making.',
      color: 'from-purple-600 to-purple-800'
    },
    {
      icon: LightBulbIcon,
      title: 'AI-Powered Analytics',
      description: 'Machine learning algorithms analyze financial patterns to provide actionable business intelligence.',
      color: 'from-amber-600 to-amber-800'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Enterprise Security',
      description: 'Bank-grade security protocols ensure all financial data remains protected and compliant.',
      color: 'from-green-600 to-green-800'
    }
  ]

  const benefits = [
    'Real-time working capital monitoring',
    'Automated cash flow optimization',
    'Advanced financial reporting',
    'AI-driven business insights',
    'Secure enterprise-grade platform',
    'Seamless integration with existing systems'
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <motion.div 
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `radial-gradient(circle at ${scrollY * 0.1}px ${scrollY * 0.05}px, #ffffff 1px, transparent 1px)` }}
          animate={{ 
            backgroundPosition: [`0px 0px`, `100px 100px`] 
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            repeatType: "reverse" 
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Sentia</h1>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Financial Management Platform</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link to="/dashboard">
                <button className="px-6 py-2 text-white hover:text-gray-300 transition-colors font-medium">
                  Sign In
                </button>
              </Link>
              <Link to="/dashboard">
                <button className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Get Started
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                  Working Capital
                </span>
                <br />
                <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                  Management
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Advanced financial analytics and cash flow optimization platform designed exclusively for Sentia's internal operations and contracted partners.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/dashboard">
                  <motion.button
                    className="group px-8 py-4 bg-white text-black rounded-lg font-semibold text-lg hover:bg-gray-200 transition-all duration-300 flex items-center space-x-2 min-w-[200px] justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>Access Dashboard</span>
                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>

                <Link to="/dashboard" className="group">
                  <motion.button
                    className="px-8 py-4 border border-white/20 text-white rounded-lg font-semibold text-lg hover:bg-white/10 transition-all duration-300 flex items-center space-x-2 min-w-[200px] justify-center backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>View Demo</span>
                    <ChartBarIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32 bg-gradient-to-b from-transparent to-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Enterprise Financial Intelligence
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Sophisticated tools designed for Sentia's financial operations team and authorized partners to optimize working capital and cash flow performance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-white/10">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                Comprehensive Financial Control
              </h2>
              
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Built specifically for Sentia's internal financial management needs, providing complete visibility and control over working capital optimization.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-md border border-white/10 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">98.7%</div>
                    <div className="text-sm text-gray-400">Cash Flow Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">2.4x</div>
                    <div className="text-sm text-gray-400">ROI Improvement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">15min</div>
                    <div className="text-sm text-gray-400">Report Generation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">24/7</div>
                    <div className="text-sm text-gray-400">Monitoring</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 bg-gradient-to-b from-transparent to-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Ready to Optimize Your Financial Operations?
            </h2>
            
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Join Sentia's internal financial management platform and gain access to advanced working capital optimization tools.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <motion.button
                  className="group px-10 py-4 bg-white text-black rounded-lg font-bold text-lg hover:bg-gray-200 transition-all duration-300 flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Get Started Now</span>
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <Link to="/dashboard">
                <motion.button
                  className="group px-10 py-4 border border-white/20 text-white rounded-lg font-bold text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center space-x-2 backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Explore Demo</span>
                  <BanknotesIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold">S</span>
              </div>
              <div>
                <div className="font-bold">Sentia Financial Platform</div>
                <div className="text-xs text-gray-400">Internal Working Capital Management</div>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <div className="text-gray-400 text-sm">
                © 2025 Sentia Spirits. Internal use only.
              </div>
              <div className="text-gray-500 text-xs mt-1">
                Authorized personnel and contractors only
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage