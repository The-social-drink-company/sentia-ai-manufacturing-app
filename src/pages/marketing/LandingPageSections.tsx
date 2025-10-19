/**
 * Landing Page Section Components
 *
 * @module src/pages/marketing/LandingPageSections
 */

import { motion } from 'framer-motion'
import {
  Check,
  Zap,
  TrendingUp,
  Shield,
  Brain,
  ArrowRight,
  Star,
  ChevronDown,
  MessageSquare,
  Clock,
  Users
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

// ==================== SOLUTION SECTION ====================

export const SolutionSection = () => {
  const benefits = [
    {
      icon: <Brain className="w-12 h-12" />,
      title: 'AI Forecasting',
      description: '>85% accuracy with ensemble models (ARIMA, LSTM, Prophet)',
      metric: '87.3%',
      metricLabel: 'Forecast Accuracy'
    },
    {
      icon: <TrendingUp className="w-12 h-12" />,
      title: 'Working Capital Optimization',
      description: 'Target <55 day cash conversion cycle with AI recommendations',
      metric: '48 days',
      metricLabel: 'Avg CCC'
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: 'Real-Time Intelligence',
      description: '<5 second data latency from your ERPs via live updates',
      metric: '<5 sec',
      metricLabel: 'Data Latency'
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Meet CapLiquify: Your AI-Powered CFO
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Stop guessing and start knowing. Our AI analyzes your data 24/7 to give you
            actionable insights that drive real results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-8 hover:bg-white/20 transition-all"
            >
              <div className="text-blue-300 mb-4">{benefit.icon}</div>
              <h3 className="text-2xl font-bold mb-2">{benefit.title}</h3>
              <p className="text-blue-100 mb-6">{benefit.description}</p>
              <div className="pt-6 border-t border-white/20">
                <div className="text-4xl font-bold">{benefit.metric}</div>
                <div className="text-blue-200 text-sm">{benefit.metricLabel}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ==================== FEATURES SECTION ====================

export const FeaturesSection = () => {
  const features = [
    {
      title: 'Cash Flow Forecasting',
      description: '18-month AI-powered projections with >85% accuracy',
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      title: 'Inventory Optimization',
      description: 'Automated reorder points and batch size recommendations',
      icon: <Shield className="w-6 h-6" />
    },
    {
      title: 'Working Capital Analytics',
      description: 'Track CCC, DSO, DIO, DPO with real-time dashboards',
      icon: <Brain className="w-6 h-6" />
    },
    {
      title: 'What-If Scenarios',
      description: 'Test pricing, inventory, and growth strategies instantly',
      icon: <Zap className="w-6 h-6" />
    },
    {
      title: 'ERP Integrations',
      description: 'Connect Xero, QuickBooks, Unleashed, Shopify, Amazon',
      icon: <Users className="w-6 h-6" />
    },
    {
      title: 'Real-Time Dashboards',
      description: 'Live updates via SSE with <5 second latency',
      icon: <Clock className="w-6 h-6" />
    },
    {
      title: 'Alerts & Notifications',
      description: 'Proactive cash flow warnings and recommendations',
      icon: <MessageSquare className="w-6 h-6" />
    },
    {
      title: 'Multi-Entity Support',
      description: 'Consolidate multiple locations with one view',
      icon: <Star className="w-6 h-6" />
    }
  ]

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Master Working Capital
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            All the tools and insights you need to optimize cash flow, reduce costs,
            and make data-driven financial decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ==================== HOW IT WORKS SECTION ====================

export const HowItWorksSection = () => {
  const steps = [
    {
      number: '1',
      title: 'Connect Your Data',
      description: 'Link Xero, QuickBooks, Shopify, Amazon in 1-click. Our secure OAuth integration takes less than 2 minutes.',
      icon: '🔗'
    },
    {
      number: '2',
      title: 'AI Learns Your Business',
      description: 'Our ensemble models analyze your historical data to understand patterns, seasonality, and trends.',
      icon: '🤖'
    },
    {
      number: '3',
      title: 'Get Actionable Insights',
      description: 'See 18-month forecasts, working capital recommendations, and proactive alerts in real-time.',
      icon: '💡'
    },
    {
      number: '4',
      title: 'Optimize & Grow',
      description: 'Make data-driven decisions with confidence. Reduce CCC by 20-30% in the first 90 days.',
      icon: '🚀'
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            From Setup to Insights in Minutes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get started in 4 simple steps. No complex setup, no data migration headaches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{step.icon}</div>
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>

              {/* Arrow connector (except last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/3 -right-4 transform translate-x-1/2">
                  <ArrowRight className="w-6 h-6 text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ==================== PRICING SECTION ====================

export const PricingSection = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

  const tiers = [
    {
      name: 'Starter',
      price: billingPeriod === 'monthly' ? 149 : 124,
      description: 'Perfect for small manufacturers getting started',
      features: [
        'Up to 5 users',
        '1 company/entity',
        'Basic cash flow forecasting (12 months)',
        '2 ERP integrations',
        'Basic working capital analytics',
        'Email support'
      ],
      cta: 'Start Free Trial',
      ctaLink: '/sign-up',
      highlighted: false
    },
    {
      name: 'Professional',
      price: billingPeriod === 'monthly' ? 295 : 245,
      description: 'Most popular for growing manufacturers',
      features: [
        'Unlimited users',
        '1 company/entity',
        'AI-powered forecasting (18 months)',
        'Unlimited ERP integrations',
        'Advanced working capital optimization',
        'What-If scenario modeling',
        'Inventory optimization',
        'Real-time updates (SSE)',
        'Priority email + chat support'
      ],
      cta: 'Start Free Trial',
      ctaLink: '/sign-up',
      highlighted: true,
      badge: 'MOST POPULAR'
    },
    {
      name: 'Enterprise',
      price: billingPeriod === 'monthly' ? 595 : 495,
      description: 'For large manufacturers with complex needs',
      features: [
        'Everything in Professional',
        'Multi-entity consolidation (up to 10)',
        'Custom AI model training',
        'API access',
        'White-label options',
        'Dedicated account manager',
        'Phone support + SLA',
        'Custom reporting',
        'Advanced security (SSO, SAML)'
      ],
      cta: 'Contact Sales',
      ctaLink: '/contact',
      highlighted: false
    }
  ]

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transparent Pricing. No Surprises.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the plan that fits your business. All plans include a 14-day free trial.
          </p>

          {/* Annual/Monthly Toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                billingPeriod === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                billingPeriod === 'annual' ? 'bg-blue-600 text-white' : 'text-gray-700'
              }`}
            >
              Annual <span className="text-xs">(Save 17%)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                tier.highlighted ? 'ring-2 ring-blue-600 transform scale-105' : ''
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  {tier.badge}
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 mb-4 text-sm">{tier.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">${tier.price}</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                {billingPeriod === 'annual' && (
                  <p className="text-sm text-green-600 mt-2">Save ${(tier.price * 0.17 * 12).toFixed(0)}/year</p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={tier.ctaLink}
                className={`block w-full text-center py-3 rounded-lg font-semibold transition-all ${
                  tier.highlighted
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center text-gray-600">
          <p className="mb-2">✓ No credit card required • ✓ Cancel anytime • ✓ 14-day money-back guarantee</p>
          <p>All prices in USD. Annual billing available with 17% discount.</p>
        </div>
      </div>
    </section>
  )
}

// Continuing in LandingPage.tsx...
