import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
// ClerkTest removed - was causing errors with Clerk hooks

const LandingPageSimple = () => {
  const [scrollY, setScrollY] = useState(0)
  const navigate = useNavigate()

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

  // Handle navigation to dashboard
  const handleDashboardNavigation = () => {
    console.log('Button clicked - navigating to dashboard')
    navigate('/dashboard')
  }

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
            ease: 'linear'
          }}
        />
      </div>

      {/* Navigation Header */}
      <nav className="relative z-20 backdrop-blur-md bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold">Sentia Manufacturing</span>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In
              </Link>
              <button
                onClick={handleDashboardNavigation}
                className="text-gray-300 hover:text-white transition-colors px-3 py-2"
              >
                Guest Access
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
                <motion.button
                  onClick={handleDashboardNavigation}
                  className="group px-8 py-4 bg-white text-black rounded-lg font-semibold text-lg hover:bg-gray-200 transition-all duration-300 flex items-center space-x-2 min-w-[200px] justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Get Started</span>
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                <motion.button
                  onClick={handleDashboardNavigation}
                  className="px-8 py-4 border border-white/20 text-white rounded-lg font-semibold text-lg hover:bg-white/10 transition-all duration-300 flex items-center space-x-2 min-w-[200px] justify-center backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Enter Dashboard</span>
                  <ChartBarIcon className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Clerk test removed - AuthVerification component handles this now */}

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
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
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
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-3xl opacity-30"></div>
                <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                  <BanknotesIcon className="w-12 h-12 text-blue-500 mb-4" />

                  <h3 className="text-2xl font-bold mb-4">Financial Command Center</h3>

                  <p className="text-gray-400 mb-6">
                    Access all critical financial metrics and controls from a single, intuitive dashboard designed for rapid decision-making.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-500">98%</div>
                      <div className="text-sm text-gray-400">Accuracy Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-500">24/7</div>
                      <div className="text-sm text-gray-400">Monitoring</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 bg-gradient-to-t from-gray-900/50 to-transparent">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Financial Operations?
            </h2>

            <p className="text-xl text-gray-400 mb-8">
              Join Sentia's finance team in leveraging advanced analytics for superior working capital management.
            </p>

            <motion.button
              onClick={handleDashboardNavigation}
              className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-semibold text-xl hover:from-blue-700 hover:to-blue-900 transition-all duration-300 flex items-center space-x-3 mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Start Your Journey</span>
              <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>2024 Sentia Manufacturing Dashboard. Internal Use Only.</p>
            <p className="mt-2 text-sm">Advanced Financial Management Platform</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPageSimple