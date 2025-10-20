/**
 * About Page - CapLiquify Company Background
 *
 * Company history, mission, values, and team information.
 * Highlights relationship with FinanceFlo.ai and Dudley Peacock's leadership.
 *
 * @module src/pages/marketing/AboutPage
 */

import { motion } from 'framer-motion'
import {
  Target,
  Heart,
  Users,
  TrendingUp,
  Zap,
  Globe,
  Award,
  CheckCircle2,
  Mail,
  Linkedin,
  Building2,
  DollarSign,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

const AboutPage = () => {
  return (
    <div className="bg-white">
      <HeroSection />
      <StorySection />
      <MissionSection />
      <ValuesSection />
      <LeadershipSection />
      <EcosystemSection />
      <ContactSection />
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
            🏢 About CapLiquify
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Helping Manufacturers{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Master Working Capital
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Founded by Dudley Peacock, CapLiquify is built on the proven FinanceFlo.ai infrastructure
            trusted by 450+ businesses to deliver specialized working capital optimization for manufacturers.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Founded 2024</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Built on FinanceFlo infrastructure</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Trusted by 450+ businesses</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ==================== STORY SECTION ====================

const StorySection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Story</h2>
          <p className="text-xl text-gray-600">
            From infrastructure to innovation
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-6 text-gray-700 leading-relaxed"
        >
          <p className="text-lg">
            CapLiquify was born from a simple observation: while comprehensive ERP integration platforms
            like <a href="https://financeflo.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold">FinanceFlo.ai</a> were
            helping hundreds of businesses automate their finance operations, manufacturers needed something more specialized.
          </p>

          <p className="text-lg">
            After seeing 450+ UK businesses achieve 66% cost reduction and 500% ROI through FinanceFlo's
            infrastructure, founder Dudley Peacock recognized an opportunity to create a focused solution
            for one of manufacturing's most critical challenges: <strong>working capital optimization</strong>.
          </p>

          <div className="bg-blue-50 rounded-xl p-8 my-8">
            <div className="flex items-start gap-4">
              <Target className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">The Challenge We Saw</h3>
                <p className="text-gray-700">
                  Manufacturers were drowning in spreadsheets, struggling with 90+ day cash conversion cycles,
                  and making critical financial decisions based on weeks-old data. They needed real-time insights,
                  AI-powered forecasting, and actionable recommendations—not another generic finance tool.
                </p>
              </div>
            </div>
          </div>

          <p className="text-lg">
            By building on the proven FinanceFlo infrastructure, we created CapLiquify: a specialized SaaS
            platform that helps manufacturers achieve &lt;55 day cash conversion cycles with &gt;85% forecast
            accuracy. We combined the reliability of enterprise-grade infrastructure with the specificity
            manufacturers need.
          </p>

          <p className="text-lg">
            Today, CapLiquify serves manufacturers worldwide, helping them free up millions in working capital
            through AI-powered forecasting, inventory optimization, and real-time financial intelligence.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// ==================== MISSION SECTION ====================

const MissionSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering manufacturers with AI-powered financial intelligence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white rounded-xl p-8 shadow-md"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Vision</h3>
            <p className="text-gray-600 leading-relaxed">
              To become the world's leading working capital optimization platform for manufacturers,
              helping every manufacturer achieve financial excellence through AI and automation.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-white rounded-xl p-8 shadow-md"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              Democratize access to enterprise-grade working capital management by delivering AI-powered
              forecasting and optimization tools that are both powerful and easy to use.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-xl p-8 shadow-md"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Impact</h3>
            <p className="text-gray-600 leading-relaxed">
              Free up billions in working capital for manufacturers worldwide, enabling growth,
              innovation, and financial resilience through data-driven decision making.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ==================== VALUES SECTION ====================

const ValuesSection = () => {
  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Customer Obsession',
      description: 'We build features manufacturers actually need, not features that look good in demos. Every decision starts with: "Does this help our customers free up working capital?"'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Excellence in Execution',
      description: 'Built on infrastructure trusted by 450+ businesses. We inherit FinanceFlo\'s commitment to reliability, security, and performance in everything we deliver.'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Transparency',
      description: 'We show real metrics, real forecasts, and real results. No fake testimonials, no inflated claims—just honest data and genuine value for our customers.'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Continuous Innovation',
      description: 'AI and manufacturing finance evolve rapidly. We invest heavily in R&D to ensure our forecasting models, optimization algorithms, and integrations stay cutting-edge.'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Ecosystem Thinking',
      description: 'We\'re part of the FinanceFlo ecosystem, enabling seamless integration with broader finance automation. Start with CapLiquify, expand to comprehensive ERP automation.'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Results-Driven',
      description: 'We measure success by customer outcomes: cash conversion cycles reduced, forecast accuracy improved, working capital freed up. Metrics matter.'
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The principles that guide everything we do
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="text-blue-600 mb-4">{value.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
              <p className="text-gray-600 leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ==================== LEADERSHIP SECTION ====================

const LeadershipSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Leadership</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Founded and led by finance automation expert Dudley Peacock
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 md:p-12 shadow-lg"
          >
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-shrink-0">
                <div className="w-40 h-40 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                  DP
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Dudley Peacock</h3>
                <div className="text-lg text-blue-600 font-semibold mb-4">
                  Founder & CEO
                </div>
                <div className="text-sm text-gray-500 mb-6">
                  Also: Founder & CEO of FinanceFlo.ai
                </div>

                <p className="text-gray-700 leading-relaxed mb-6">
                  Dudley Peacock is a finance automation pioneer with 15+ years of experience helping businesses
                  optimize their financial operations. As the founder of <a href="https://financeflo.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold">FinanceFlo.ai</a>,
                  he built infrastructure trusted by 450+ UK businesses, achieving 66% cost reduction and 500% ROI.
                </p>

                <p className="text-gray-700 leading-relaxed mb-6">
                  Recognizing manufacturers' unique needs for working capital optimization, Dudley founded CapLiquify
                  to deliver specialized AI-powered forecasting and inventory management built on the proven FinanceFlo
                  infrastructure. His vision: every manufacturer should have access to enterprise-grade financial
                  intelligence.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">Founder of CapLiquify & FinanceFlo.ai</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">Supporting 450+ businesses</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">15+ years in finance automation</span>
                  </div>
                </div>

                <div className="flex gap-4 justify-center md:justify-start">
                  <a
                    href="https://linkedin.com/in/dudleypeacock"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    aria-label="Dudley Peacock on LinkedIn"
                  >
                    <Linkedin className="w-6 h-6" />
                  </a>
                  <a
                    href="mailto:dudley@capliquify.com"
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    aria-label="Email Dudley Peacock"
                  >
                    <Mail className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <blockquote className="text-center italic text-gray-700 text-lg">
                "Manufacturing finance is too complex for generic tools. We built CapLiquify to give manufacturers
                the same level of financial intelligence that Fortune 500 companies enjoy—but accessible,
                affordable, and designed specifically for manufacturing operations."
              </blockquote>
              <div className="text-center text-gray-600 mt-2 font-semibold">— Dudley Peacock</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ==================== ECOSYSTEM SECTION ====================

const EcosystemSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Part of the FinanceFlo Ecosystem</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            CapLiquify is built on the proven infrastructure trusted by 450+ businesses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 shadow-md"
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

            <p className="text-gray-700 mb-4 leading-relaxed">
              Enterprise-grade ERP integration and finance automation infrastructure serving 450+ UK businesses.
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>ERP Integration & Implementation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>AI-Powered Finance Automation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>Custom Workflow Automation</span>
              </div>
            </div>

            <a
              href="https://financeflo.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
            >
              Learn More <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 shadow-md"
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

            <p className="text-gray-700 mb-4 leading-relaxed">
              Working capital optimization SaaS built on FinanceFlo infrastructure, specialized for manufacturers.
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Working Capital Optimization</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>AI Cash Flow Forecasting (&gt;85% accuracy)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Inventory Management & Demand Forecasting</span>
              </div>
            </div>

            <Link
              to="/features"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Explore Features <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        <div className="text-center">
          <Link
            to="/ecosystem"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Learn About the Ecosystem <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ==================== CONTACT SECTION ====================

const ContactSection = () => {
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
            Ready to Optimize Your Working Capital?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join manufacturers worldwide using CapLiquify to free up millions in working capital.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/sign-up"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start 14-Day Free Trial
            </Link>
            <a
              href="mailto:hello@capliquify.com"
              className="bg-purple-800 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-900 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Contact Us
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>14-day money-back guarantee</span>
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

export default AboutPage
