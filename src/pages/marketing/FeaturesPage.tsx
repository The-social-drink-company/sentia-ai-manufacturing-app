/**
 * CapLiquify Features Showcase Page
 *
 * Comprehensive feature documentation for CapLiquify SaaS platform.
 * Target: Mid-market manufacturers seeking working capital management solutions
 *
 * @module src/pages/marketing/FeaturesPage
 */

import { motion } from 'framer-motion'
import {
  Check,
  X,
  Zap,
  TrendingUp,
  Package,
  Target,
  Link as LinkIcon,
  Bell,
  Users,
  BarChart3,
  Brain,
  Clock,
  DollarSign,
  Shield,
  ArrowRight
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const FeaturesPage = () => {
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Features', icon: BarChart3 },
    { id: 'forecasting', name: 'Cash Flow & Forecasting', icon: TrendingUp },
    { id: 'working-capital', name: 'Working Capital', icon: DollarSign },
    { id: 'inventory', name: 'Inventory', icon: Package },
    { id: 'integrations', name: 'Integrations', icon: LinkIcon },
    { id: 'collaboration', name: 'Collaboration', icon: Users }
  ]

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 100 // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Everything You Need to Master Working Capital
            </h1>
            <p className="text-xl lg:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
              Comprehensive tools for cash flow forecasting, inventory optimization, and financial planning
            </p>
            <Link
              to="/sign-up"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Free Trial
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Category Navigation */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-4 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id)
                    if (category.id !== 'all') {
                      scrollToSection(category.id)
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* AI-Powered Forecasting Section */}
      <FeatureSection
        id="forecasting"
        headline="Forecast Cash Flow with >85% Accuracy"
        description="Our ensemble AI models (ARIMA, LSTM, Prophet, Random Forest) analyze your historical data to predict cash flow 18 months into the future with industry-leading accuracy."
        benefits={[
          { text: 'Ensemble modeling for maximum accuracy', icon: Brain },
          { text: 'Automatic model selection based on your data', icon: Zap },
          { text: 'Confidence intervals for risk assessment', icon: Shield },
          { text: 'Continuous learning and improvement', icon: TrendingUp }
        ]}
        useCase={{
          text: 'A mid-market manufacturer reduced forecast errors by 67% and avoided a cash crunch by proactively securing a line of credit 3 months in advance.',
          metric: '67%',
          metricLabel: 'Error Reduction'
        }}
        imagePosition="right"
        gradient="from-blue-50 to-purple-50"
      />

      {/* Working Capital Optimization Section */}
      <FeatureSection
        id="working-capital"
        headline="Achieve <55 Day Cash Conversion Cycle"
        description="Our optimization engine analyzes your DSO, DIO, and DPO to identify opportunities to free up cash and improve working capital efficiency."
        benefits={[
          { text: 'Real-time CCC tracking', icon: Clock },
          { text: 'Automated recommendations', icon: Zap },
          { text: 'Historical trend analysis', icon: TrendingUp },
          { text: 'Benchmarking against industry standards', icon: Target }
        ]}
        useCase={{
          text: 'A food manufacturer reduced their CCC from 78 days to 52 days in 4 months, freeing up $2.3M in working capital.',
          metric: '$2.3M',
          metricLabel: 'Cash Freed'
        }}
        imagePosition="left"
        gradient="from-green-50 to-blue-50"
      />

      {/* Inventory Optimization Section */}
      <FeatureSection
        id="inventory"
        headline="Optimize Inventory Levels Automatically"
        description="AI-powered reorder point calculations ensure you have the right inventory at the right time, minimizing carrying costs while avoiding stockouts."
        benefits={[
          { text: 'Automated reorder point calculations', icon: Target },
          { text: 'Lead time optimization', icon: Clock },
          { text: 'Safety stock recommendations', icon: Shield },
          { text: 'Multi-warehouse support', icon: Package }
        ]}
        useCase={{
          text: 'A beverage manufacturer reduced inventory carrying costs by 31% while improving order fulfillment rates to 98.5%.',
          metric: '31%',
          metricLabel: 'Cost Reduction'
        }}
        imagePosition="right"
        gradient="from-purple-50 to-pink-50"
      />

      {/* What-If Scenario Modeling Section */}
      <FeatureSection
        id="scenarios"
        headline="Test Strategies Before You Commit"
        description="Model the financial impact of pricing changes, inventory strategies, growth plans, and more with our powerful scenario planning tools."
        benefits={[
          { text: 'Unlimited scenarios', icon: Zap },
          { text: 'Side-by-side comparison', icon: BarChart3 },
          { text: 'Sensitivity analysis', icon: Target },
          { text: 'Export to presentations', icon: ArrowRight }
        ]}
        useCase={{
          text: 'A spirits manufacturer tested 12 pricing scenarios and identified a strategy that increased margins by 4.2% without impacting volume.',
          metric: '4.2%',
          metricLabel: 'Margin Increase'
        }}
        imagePosition="left"
        gradient="from-blue-50 to-green-50"
      />

      {/* Integrations Section */}
      <section id="integrations" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Connect All Your Data Sources
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              One-click integrations with Xero, QuickBooks, Sage, Unleashed, Shopify, Amazon, and more.
              Your data syncs automatically in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {[
              { text: '20+ pre-built integrations', icon: LinkIcon },
              { text: 'Real-time data sync (<5 min latency)', icon: Zap },
              { text: 'Automatic reconciliation', icon: Check },
              { text: 'Custom API for unique needs', icon: Target }
            ].map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{benefit.text}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Integration Logos Grid */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Supported Integrations</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              {/* Accounting */}
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-4">ACCOUNTING</p>
                <div className="space-y-3">
                  <IntegrationLogo name="Xero" />
                  <IntegrationLogo name="QuickBooks" />
                  <IntegrationLogo name="Sage One" />
                </div>
              </div>

              {/* ERP */}
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-4">ERP</p>
                <div className="space-y-3">
                  <IntegrationLogo name="Unleashed" />
                  <IntegrationLogo name="Cin7" />
                  <IntegrationLogo name="Katana" />
                </div>
              </div>

              {/* E-Commerce */}
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-4">E-COMMERCE</p>
                <div className="space-y-3">
                  <IntegrationLogo name="Shopify" />
                  <IntegrationLogo name="Amazon" />
                  <IntegrationLogo name="WooCommerce" />
                </div>
              </div>

              {/* Payments */}
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-4">PAYMENTS</p>
                <div className="space-y-3">
                  <IntegrationLogo name="Stripe" />
                  <IntegrationLogo name="PayPal" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="#request-integration"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Request Integration
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Dashboards, Alerts, Collaboration */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Real-Time Dashboards */}
            <FeatureCard
              icon={BarChart3}
              headline="Live Data, Instant Insights"
              description="Server-Sent Events (SSE) technology delivers real-time updates to your dashboard with <5 second latency. No more refreshing."
              benefits={[
                'Live KPI updates',
                'Instant alerts',
                'Collaborative viewing',
                'Mobile responsive'
              ]}
            />

            {/* Alerts & Notifications */}
            <FeatureCard
              icon={Bell}
              headline="Never Miss a Critical Event"
              description="Proactive alerts notify you of low cash balances, inventory stockouts, overdue receivables, and more via email, SMS, or Slack."
              benefits={[
                'Customizable alert rules',
                'Multi-channel notifications',
                'Smart alert grouping',
                'Escalation workflows'
              ]}
            />

            {/* Collaboration */}
            <FeatureCard
              icon={Users}
              headline="Empower Your Team"
              description="Role-based access control ensures everyone has the right level of access. Share reports, collaborate on scenarios, and make decisions together."
              benefits={[
                '4 role levels (Owner, Admin, Member, Viewer)',
                'Granular permissions',
                'Audit trail',
                'Comment and annotation'
              ]}
            />
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <ComparisonTable />

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">Ready to See It in Action?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start your 14-day free trial and experience the power of AI-driven working capital management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/sign-up"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Free Trial
            </Link>
            <a
              href="#demo"
              className="inline-block bg-transparent text-white px-8 py-4 rounded-lg font-semibold text-lg border-2 border-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Schedule Demo
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

// ==================== FEATURE SECTION COMPONENT ====================

interface FeatureSectionProps {
  id: string
  headline: string
  description: string
  benefits: Array<{ text: string; icon: any }>
  useCase: { text: string; metric: string; metricLabel: string }
  imagePosition: 'left' | 'right'
  gradient: string
}

const FeatureSection = ({
  id,
  headline,
  description,
  benefits,
  useCase,
  imagePosition,
  gradient
}: FeatureSectionProps) => {
  const content = (
    <div className={imagePosition === 'left' ? 'md:order-2' : ''}>
      <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">{headline}</h2>
      <p className="text-xl text-gray-600 mb-8">{description}</p>

      <div className="space-y-4 mb-8">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex items-start gap-3"
            >
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-lg text-gray-700">{benefit.text}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Use Case */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="text-4xl font-bold text-blue-600">{useCase.metric}</div>
            <div className="text-sm text-gray-600">{useCase.metricLabel}</div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2">SUCCESS STORY</p>
            <p className="text-gray-700">{useCase.text}</p>
          </div>
        </div>
      </div>
    </div>
  )

  const screenshot = (
    <div className={imagePosition === 'left' ? 'md:order-1' : ''}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="relative rounded-2xl shadow-2xl overflow-hidden bg-gray-900 p-4"
      >
        {/* Screenshot Mockup */}
        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4" />
            <p className="text-sm">Feature Screenshot</p>
          </div>
        </div>
      </motion.div>
    </div>
  )

  return (
    <section id={id} className={`py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br ${gradient}`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {content}
          {screenshot}
        </div>
      </div>
    </section>
  )
}

// ==================== FEATURE CARD COMPONENT ====================

interface FeatureCardProps {
  icon: any
  headline: string
  description: string
  benefits: string[]
}

const FeatureCard = ({ icon: Icon, headline, description, benefits }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
    >
      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{headline}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <ul className="space-y-3">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{benefit}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

// ==================== INTEGRATION LOGO COMPONENT ====================

const IntegrationLogo = ({ name }: { name: string }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
        <span className="text-xs font-bold text-gray-600">{name[0]}</span>
      </div>
      <span className="font-medium text-gray-900">{name}</span>
    </div>
  )
}

// ==================== COMPARISON TABLE COMPONENT ====================

const ComparisonTable = () => {
  const features = [
    { name: 'AI-Powered Forecasting', capliquify: true, competitor1: false, competitor2: true },
    { name: 'Ensemble Models (4+ algorithms)', capliquify: true, competitor1: false, competitor2: false },
    { name: 'Real-Time Dashboards (SSE)', capliquify: true, competitor1: false, competitor2: false },
    { name: 'Working Capital Optimization', capliquify: true, competitor1: true, competitor2: true },
    { name: 'Inventory Optimization', capliquify: true, competitor1: true, competitor2: false },
    { name: 'What-If Scenario Modeling', capliquify: true, competitor1: false, competitor2: true },
    { name: '20+ ERP Integrations', capliquify: true, competitor1: false, competitor2: true },
    { name: 'Multi-Entity Support', capliquify: true, competitor1: true, competitor2: false },
    { name: 'API Access', capliquify: true, competitor1: false, competitor2: true },
    { name: 'Custom Alerts & Notifications', capliquify: true, competitor1: true, competitor2: false }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How We Compare</h2>
          <p className="text-xl text-gray-600">
            See why leading manufacturers choose CapLiquify over alternatives
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">CapLiquify</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500">Competitor A</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500">Competitor B</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {features.map((feature, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">{feature.name}</td>
                  <td className="px-6 py-4 text-center">
                    {feature.capliquify ? (
                      <Check className="w-6 h-6 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-6 h-6 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {feature.competitor1 ? (
                      <Check className="w-6 h-6 text-gray-400 mx-auto" />
                    ) : (
                      <X className="w-6 h-6 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {feature.competitor2 ? (
                      <Check className="w-6 h-6 text-gray-400 mx-auto" />
                    ) : (
                      <X className="w-6 h-6 text-gray-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-blue-50 px-6 py-4 text-center border-t-2 border-blue-200">
            <p className="text-sm text-gray-600">
              * Comparison based on publicly available information as of October 2025
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturesPage
