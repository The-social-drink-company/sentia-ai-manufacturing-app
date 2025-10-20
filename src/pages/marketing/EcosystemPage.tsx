/**
 * Ecosystem Page - CapLiquify & FinanceFlo Platform Relationship
 *
 * Explains the strategic relationship between CapLiquify (specialized working capital SaaS)
 * and FinanceFlo.ai (infrastructure platform for 450+ UK businesses).
 *
 * @module src/pages/marketing/EcosystemPage
 */

import { motion } from 'framer-motion'
import {
  ArrowRight,
  Building2,
  Briefcase,
  Users,
  TrendingUp,
  Zap,
  Globe,
  CheckCircle2,
  BarChart3,
  DollarSign,
  Brain,
  Link as LinkIcon
} from 'lucide-react'
import { Link } from 'react-router-dom'

const EcosystemPage = () => {
  return (
    <div className="bg-white">
      <HeroSection />
      <PlatformOverviewSection />
      <DecisionTreeSection />
      <TeamSection />
      <IntegrationSection />
      <CTASection />
    </div>
  )
}

// ==================== HERO SECTION ====================

const HeroSection = () => {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            🌐 The FinanceFlo Ecosystem
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Two Platforms,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              One Vision
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Founded by Dudley Peacock, the FinanceFlo ecosystem provides both enterprise-grade infrastructure
            and specialized applications to help businesses optimize their financial operations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="https://financeflo.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-center"
            >
              Explore FinanceFlo.ai
            </a>
            <Link
              to="/sign-up"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-center"
            >
              Try CapLiquify Free
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>450+ businesses trust FinanceFlo infrastructure</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>66% cost reduction achieved</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>500% ROI boost</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ==================== PLATFORM OVERVIEW SECTION ====================

const PlatformOverviewSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Understanding the Ecosystem
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            FinanceFlo provides the infrastructure. CapLiquify delivers the specialized application.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* FinanceFlo Platform */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">FinanceFlo.ai</h3>
                <p className="text-purple-700 font-semibold">Infrastructure Platform</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              Enterprise-grade ERP integration and finance automation infrastructure trusted by 450+ UK businesses.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">ERP Integration & Implementation</div>
                  <div className="text-sm text-gray-600">Connect Xero, QuickBooks, Sage, and 20+ ERPs</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">AI-Powered Finance Automation</div>
                  <div className="text-sm text-gray-600">Intelligent workflows and process automation</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">Business Process Automation</div>
                  <div className="text-sm text-gray-600">Custom automation for unique workflows</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-purple-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">450+</div>
                  <div className="text-xs text-gray-600">UK Businesses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">66%</div>
                  <div className="text-xs text-gray-600">Cost Reduction</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">500%</div>
                  <div className="text-xs text-gray-600">ROI Boost</div>
                </div>
              </div>
            </div>

            <a
              href="https://financeflo.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-center"
            >
              Explore FinanceFlo.ai →
            </a>
          </motion.div>

          {/* CapLiquify Platform */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">CapLiquify</h3>
                <p className="text-blue-700 font-semibold">Specialized Application</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              Working capital optimization SaaS built on FinanceFlo infrastructure, specialized for manufacturers.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">Working Capital Optimization</div>
                  <div className="text-sm text-gray-600">Achieve &lt;55 day cash conversion cycles</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">AI Cash Flow Forecasting</div>
                  <div className="text-sm text-gray-600">&gt;85% accuracy with ensemble AI models</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">Inventory Management</div>
                  <div className="text-sm text-gray-600">Real-time optimization and demand forecasting</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-blue-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">&lt;55</div>
                  <div className="text-xs text-gray-600">Day CCC</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">&gt;85%</div>
                  <div className="text-xs text-gray-600">AI Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">20+</div>
                  <div className="text-xs text-gray-600">ERP Integrations</div>
                </div>
              </div>
            </div>

            <Link
              to="/sign-up"
              className="mt-6 block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
            >
              Start Free Trial →
            </Link>
          </motion.div>
        </div>

        {/* Relationship Diagram */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="flex-1 text-center">
                <div className="inline-block bg-purple-100 rounded-xl p-6 mb-4">
                  <Building2 className="w-12 h-12 text-purple-600 mx-auto" />
                </div>
                <div className="font-bold text-lg text-gray-900">FinanceFlo.ai</div>
                <div className="text-sm text-gray-600">Infrastructure Layer</div>
                <div className="text-xs text-gray-500 mt-2">ERP Integration, AI Automation</div>
              </div>

              <div className="hidden md:flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <LinkIcon className="w-8 h-8 text-gray-400" />
                  <div className="text-xs text-gray-500 font-semibold">Powers</div>
                  <ArrowRight className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              <div className="md:hidden">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-xs text-gray-500 font-semibold">Powers ↓</div>
                </div>
              </div>

              <div className="flex-1 text-center">
                <div className="inline-block bg-blue-100 rounded-xl p-6 mb-4">
                  <DollarSign className="w-12 h-12 text-blue-600 mx-auto" />
                </div>
                <div className="font-bold text-lg text-gray-900">CapLiquify</div>
                <div className="text-sm text-gray-600">Application Layer</div>
                <div className="text-xs text-gray-500 mt-2">Working Capital, Forecasting</div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <p className="text-gray-600 leading-relaxed">
                CapLiquify is built on top of FinanceFlo's proven infrastructure, inheriting the reliability
                and performance trusted by 450+ businesses while adding specialized manufacturing capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ==================== DECISION TREE SECTION ====================

const DecisionTreeSection = () => {
  const scenarios = [
    {
      question: 'Are you a manufacturer focused on working capital?',
      answer: 'yes',
      recommendation: 'CapLiquify',
      color: 'blue',
      icon: <DollarSign className="w-6 h-6" />,
      description: 'Start with CapLiquify for specialized working capital optimization with 14-day free trial.',
      cta: { text: 'Try CapLiquify Free', link: '/sign-up', internal: true }
    },
    {
      question: 'Do you need comprehensive ERP integration?',
      answer: 'yes',
      recommendation: 'FinanceFlo',
      color: 'purple',
      icon: <Building2 className="w-6 h-6" />,
      description: 'Choose FinanceFlo for enterprise-grade ERP implementation and custom automation.',
      cta: { text: 'Contact FinanceFlo', link: 'https://financeflo.ai', internal: false }
    },
    {
      question: 'Do you want a ready-to-use SaaS solution?',
      answer: 'yes',
      recommendation: 'CapLiquify',
      color: 'blue',
      icon: <Zap className="w-6 h-6" />,
      description: 'CapLiquify is a plug-and-play SaaS with instant setup and immediate value.',
      cta: { text: 'Start Free Trial', link: '/sign-up', internal: true }
    },
    {
      question: 'Do you need custom workflow automation?',
      answer: 'yes',
      recommendation: 'FinanceFlo',
      color: 'purple',
      icon: <Brain className="w-6 h-6" />,
      description: 'FinanceFlo provides bespoke automation tailored to your unique business processes.',
      cta: { text: 'Explore FinanceFlo', link: 'https://financeflo.ai', internal: false }
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Which Platform is Right for You?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Use this decision guide to choose the best solution for your business needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {scenarios.map((scenario, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 ${
                scenario.color === 'blue' ? 'border-blue-200 hover:border-blue-400' : 'border-purple-200 hover:border-purple-400'
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg ${scenario.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                  {scenario.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-2">{scenario.question}</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    scenario.color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    → {scenario.recommendation}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                {scenario.description}
              </p>

              {scenario.cta.internal ? (
                <Link
                  to={scenario.cta.link}
                  className={`block text-center px-4 py-2 rounded-lg font-semibold transition-colors ${
                    scenario.color === 'blue'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {scenario.cta.text}
                </Link>
              ) : (
                <a
                  href={scenario.cta.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-center px-4 py-2 rounded-lg font-semibold transition-colors ${
                    scenario.color === 'blue'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {scenario.cta.text}
                </a>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block bg-white rounded-xl p-8 shadow-md max-w-2xl">
            <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Not Sure? Start with Both</h3>
            <p className="text-gray-600 mb-6">
              Many businesses use CapLiquify for day-to-day working capital management while leveraging
              FinanceFlo's infrastructure for ERP integration and custom automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/sign-up"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try CapLiquify Free
              </Link>
              <a
                href="https://financeflo.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Contact FinanceFlo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ==================== TEAM SECTION ====================

const TeamSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Leadership & Vision
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Founded and led by Dudley Peacock, bringing 15+ years of finance automation expertise.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 md:p-12 shadow-lg"
          >
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                  DP
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Dudley Peacock</h3>
                <div className="text-lg text-blue-600 font-semibold mb-4">
                  Founder & CEO - CapLiquify & FinanceFlo.ai
                </div>

                <p className="text-gray-700 leading-relaxed mb-6">
                  Dudley Peacock founded FinanceFlo.ai to provide enterprise-grade ERP integration and finance
                  automation to UK businesses, achieving 66% cost reduction and 500% ROI for 450+ companies.
                  Building on this proven infrastructure, he created CapLiquify to deliver specialized working
                  capital optimization for manufacturers worldwide.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <Briefcase className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">15+ years in finance automation</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">Supporting 450+ businesses across UK</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">Proven track record: 66% cost reduction, 500% ROI</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <blockquote className="text-center italic text-gray-700 text-lg">
                "We built FinanceFlo to automate the complex. We built CapLiquify to optimize the critical.
                Together, they help businesses achieve financial excellence."
              </blockquote>
              <div className="text-center text-gray-600 mt-2 font-semibold">— Dudley Peacock</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ==================== INTEGRATION SECTION ====================

const IntegrationSection = () => {
  const benefits = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Shared Infrastructure',
      description: 'CapLiquify runs on the same proven infrastructure that powers 450+ FinanceFlo businesses.'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'Unified AI Engine',
      description: 'Both platforms leverage the same AI models for forecasting and automation.'
    },
    {
      icon: <LinkIcon className="w-8 h-8" />,
      title: 'Seamless Integration',
      description: 'Connect CapLiquify with FinanceFlo services for comprehensive finance automation.'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Upgrade Path',
      description: 'Start with CapLiquify, expand to FinanceFlo for custom ERP integration and automation.'
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ecosystem Benefits
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Leverage the power of both platforms for complete financial automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-blue-600 mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
              <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ==================== CTA SECTION ====================

const CTASection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Choose the platform that best fits your needs, or use both for complete financial automation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/sign-up"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start CapLiquify Free Trial
            </Link>
            <a
              href="https://financeflo.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-800 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-900 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Explore FinanceFlo.ai
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default EcosystemPage
