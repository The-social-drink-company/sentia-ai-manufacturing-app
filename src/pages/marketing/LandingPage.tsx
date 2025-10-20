/**
 * CapLiquify Marketing Landing Page
 *
 * Professional, high-converting landing page for CapLiquify SaaS platform.
 * Target: Mid-market manufacturers ($10M-$100M revenue)
 *
 * @module src/pages/marketing/LandingPage
 */

import { motion } from 'framer-motion'
import {
  Check,
  Zap,
  TrendingUp,
  Shield,
  Users,
  BarChart3,
  Clock,
  DollarSign,
  Brain,
  Target,
  ArrowRight,
  Star,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

// Import sections from other files
import {
  SolutionSection,
  FeaturesSection,
  HowItWorksSection,
  PricingSection
} from './LandingPageSections'
import {
  SocialProofSection,
  FAQSection,
  FinalCTASection,
  Footer
} from './LandingPageFooter'

const LandingPage = () => {
  return (
    <div className="bg-white">
      <Header />
      <main id="main-content" role="main">
        <HeroSection />
        <TrustBar />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <SocialProofSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  )
}

// ==================== HEADER COMPONENT ====================

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-200" role="banner">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-lg" aria-label="CapLiquify Home">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center" aria-hidden="true">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">CapLiquify</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Primary navigation">
            <Link to="/features" className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1">
              Features
            </Link>
            <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1">
              Pricing
            </a>
            <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1">
              Customers
            </a>
            <Link to="/blog" className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1">
              Blog
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/sign-in" className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1">
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              aria-label="Start your 14-day free trial"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 space-y-4" role="navigation" aria-label="Mobile navigation">
            <Link to="/features" className="block text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1">Features</Link>
            <a href="#pricing" className="block text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1">Pricing</a>
            <a href="#testimonials" className="block text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1">Customers</a>
            <Link to="/blog" className="block text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1">Blog</Link>
            <Link to="/sign-in" className="block text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1">Sign In</Link>
            <Link
              to="/sign-up"
              className="block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              aria-label="Start your 14-day free trial"
            >
              Start Free Trial
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}

// ==================== HERO SECTION ====================

const HeroSection = () => {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              🚀 AI-Powered Working Capital Management
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Optimize Working Capital,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Not Just Track It
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              AI-powered cash flow forecasting and working capital management built specifically for manufacturers.
              Achieve &lt;55 day cash conversion cycles with &gt;85% forecast accuracy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                to="/sign-up"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-center"
              >
                Start 14-Day Free Trial
              </Link>
              <a
                href="#demo"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors text-center"
              >
                Watch Demo
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>14-day money-back guarantee</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl shadow-2xl overflow-hidden border-8 border-white bg-gray-900">
              {/* Dashboard Mockup */}
              <div className="p-6 space-y-4">
                <div className="h-12 bg-gray-800 rounded-lg"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg"></div>
                  <div className="h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg"></div>
                  <div className="h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-lg"></div>
                </div>
                <div className="h-48 bg-gray-800 rounded-lg"></div>
              </div>

              {/* Floating Metrics */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4"
              >
                <div className="text-sm text-gray-600">Cash Conversion Cycle</div>
                <div className="text-2xl font-bold text-green-600">48 days</div>
                <div className="text-xs text-green-600">↓ 23% this month</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4"
              >
                <div className="text-sm text-gray-600">Forecast Accuracy</div>
                <div className="text-2xl font-bold text-blue-600">87.3%</div>
                <div className="text-xs text-blue-600">AI Ensemble Model</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ==================== TRUST BAR ====================

const TrustBar = () => {
  return (
    <section className="py-8 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">Built on FinanceFlo.ai infrastructure</p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm font-semibold text-gray-700">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>450+ businesses</span>
            </div>
            <div className="hidden sm:block text-gray-300">•</div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>66% cost reduction</span>
            </div>
            <div className="hidden sm:block text-gray-300">•</div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>500% ROI</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ==================== PROBLEM SECTION ====================

const ProblemSection = () => {
  const problems = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Cash Tied Up in Inventory',
      description: 'Excess inventory drains working capital and increases storage costs'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Unpredictable Cash Flow',
      description: 'Manual forecasts are inaccurate and take days to prepare'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Slow Decision Making',
      description: 'Waiting for reports delays critical financial decisions'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'No Visibility',
      description: 'Disconnected systems make it impossible to see the full picture'
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Manufacturing Finance is Complex. Your Software Shouldn't Be.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Most manufacturers struggle with working capital management because traditional tools
            weren't built for the complexity of manufacturing operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="text-blue-600 mb-4">{problem.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{problem.title}</h3>
              <p className="text-gray-600">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Continuing in next message due to length...
export default LandingPage
