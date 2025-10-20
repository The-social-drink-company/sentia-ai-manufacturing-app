import { motion } from 'framer-motion'
import useLandingAnalytics from '@/hooks/useLandingAnalytics'
import { SignInButton } from '@clerk/clerk-react'
import {
  ArrowRight,
  BarChart2,
  TrendingUp,
  DollarSign,
  Settings,
  Package,
  Brain,
  CheckCircle2,
} from 'lucide-react'

const Motion = motion

const LandingPage = () => {
  const { heroRef, trackPrimaryCTA, trackSecondaryCTA, trackSignInModal } = useLandingAnalytics()

  const scrollToFeatures = () => {
    trackSecondaryCTA('features')
    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handlePrimaryCTA = () => {
    trackPrimaryCTA('hero-sign-in')
    trackSignInModal('hero-sign-in')
  }

  const handleLearnMore = () => {
    trackSecondaryCTA('hero-learn-more')
    scrollToFeatures()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Motion.header
        ref={heroRef}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="text-center">
            {/* Main Heading */}
            <Motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
            >
              CapLiquify Platform
              <span className="block text-blue-200">Enterprise Dashboard</span>
            </Motion.h1>

            {/* Subheading */}
            <Motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100 sm:text-xl"
            >
              Real-time manufacturing intelligence with AI-driven forecasting and working capital
              optimization
            </Motion.p>

            {/* CTA Buttons */}
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              {/* Primary CTA - Sign In */}
              <SignInButton mode="modal" redirectUrl="/app/dashboard">
                <button
                  onClick={handlePrimaryCTA}
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-700 shadow-xl transition-all hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300 sm:text-lg"
                  aria-label="Sign in to Capliquify Dashboard"
                >
                  Sign In
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </SignInButton>

              {/* Secondary CTA - Learn More */}
              <button
                onClick={handleLearnMore}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-transparent px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 sm:text-lg"
                aria-label="Learn more about features"
              >
                Learn More
                <BarChart2 className="h-5 w-5" />
              </button>
            </Motion.div>
          </div>
        </div>
      </Motion.header>

      {/* Main Content */}
      <main>
        {/* Features Section */}
        <section id="features" className="bg-slate-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Powerful Manufacturing Intelligence
              </h2>
              <p className="mt-4 text-lg text-slate-600 sm:text-xl">
                Everything you need to optimize your manufacturing operations
              </p>
            </div>

            {/* Features Grid */}
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} feature={feature} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Trust/Metrics Section */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Trusted by Manufacturing Leaders
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Real results from real manufacturing data
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric, index) => (
                <MetricCard key={metric.label} metric={metric} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-700 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to optimize your manufacturing operations?
              </h2>
              <p className="mt-6 text-lg text-purple-100 sm:text-xl">
                Join leading manufacturers using AI-powered insights to drive efficiency and
                profitability
              </p>

              {/* CTA Button */}
              <div className="mt-10">
                <SignInButton mode="modal" redirectUrl="/app/dashboard">
                  <button
                    className="group inline-flex items-center gap-2 rounded-xl bg-white px-10 py-5 text-lg font-semibold text-purple-700 shadow-2xl transition-all hover:scale-105 hover:shadow-purple-900/50 focus:outline-none focus:ring-4 focus:ring-purple-300 sm:text-xl"
                    aria-label="Get started with Capliquify Dashboard"
                  >
                    Get Started
                    <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </button>
                </SignInButton>
              </div>
            </Motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            {/* Company Name */}
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-white">Capliquify</h3>
              <p className="mt-1 text-sm text-slate-400">
                &copy; {new Date().getFullYear()} Capliquify. All rights reserved.
              </p>
            </div>

            {/* Footer Links */}
            <nav className="flex flex-wrap items-center justify-center gap-6">
              <a
                href="/privacy"
                className="text-sm text-slate-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-sm text-slate-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Terms of Service
              </a>
              <a
                href="/contact"
                className="text-sm text-slate-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Contact
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}

/**
 * FeatureCard Component
 * Displays individual feature with icon, title, and description
 */
const FeatureCard = ({ feature, index }) => {
  const Icon = feature.icon

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05 }}
      className="group relative rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-xl"
    >
      {/* Icon */}
      <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-3 shadow-md">
        <Icon className="h-8 w-8 text-white" aria-hidden="true" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>

      {/* Description */}
      <p className="mt-3 text-base leading-7 text-slate-600">{feature.description}</p>

      {/* Hover Accent */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent transition-colors group-hover:border-purple-500" />
    </Motion.div>
  )
}

/**
 * MetricCard Component
 * Displays key metrics and statistics
 */
const MetricCard = ({ metric, index }) => {
  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      viewport={{ once: true }}
      className="rounded-xl bg-slate-50 p-6 text-center"
    >
      {/* Icon */}
      <div className="mb-3 flex justify-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />
      </div>

      {/* Value */}
      <div className="text-3xl font-bold text-slate-900 sm:text-4xl">{metric.value}</div>

      {/* Label */}
      <div className="mt-2 text-sm font-medium text-slate-600">{metric.label}</div>
    </Motion.div>
  )
}

/**
 * Features Data
 */
const features = [
  {
    icon: BarChart2,
    title: 'Executive Dashboard',
    description:
      'Real-time KPI monitoring with customizable widgets and role-based access control for executive decision-making.',
  },
  {
    icon: TrendingUp,
    title: 'AI Forecasting',
    description:
      'Ensemble forecasting models achieving >85% accuracy with seasonal pattern detection and confidence intervals.',
  },
  {
    icon: DollarSign,
    title: 'Working Capital',
    description:
      'Optimize cash conversion cycle with 30-90 day forecasting and receivables/payables management.',
  },
  {
    icon: Settings,
    title: 'What-If Analysis',
    description:
      'Interactive scenario planning and modeling with real-time impact analysis on key financial metrics.',
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description:
      'Multi-warehouse optimization with reorder point calculations and batch size recommendations (100-1000 units).',
  },
  {
    icon: Brain,
    title: 'AI Insights',
    description:
      'Powered by OpenAI and Claude for intelligent recommendations, anomaly detection, and predictive analytics.',
  },
]

/**
 * Trust Metrics Data
 */
const metrics = [
  {
    value: '£10.76M+',
    label: 'Revenue Tracked',
  },
  {
    value: '350K+',
    label: 'Units Managed',
  },
  {
    value: '67.6%',
    label: 'Gross Margin',
  },
  {
    value: '43.6 Days',
    label: 'Cash Conversion Cycle',
  },
]

export default LandingPage
