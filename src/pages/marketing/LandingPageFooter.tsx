/**
 * Landing Page Footer Sections (Social Proof, FAQ, Final CTA, Footer)
 *
 * @module src/pages/marketing/LandingPageFooter
 */

import { motion } from 'framer-motion'
import { Check, ChevronDown, Star, Mail, Linkedin, Twitter } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

// ==================== SOCIAL PROOF SECTION ====================

export const SocialProofSection = () => {
  const testimonials = [
    {
      quote: "CapLiquify helped us reduce our cash conversion cycle from 78 days to 55 days in just 3 months. The AI forecasting is incredibly accurate.",
      author: "Sarah Johnson",
      title: "CFO",
      company: "Acme Manufacturing",
      metric: "Reduced CCC by 23 days",
      avatar: "SJ"
    },
    {
      quote: "The real-time dashboards and proactive alerts have transformed how we manage working capital. We now make decisions based on data, not gut feelings.",
      author: "Michael Chen",
      title: "Finance Director",
      company: "TechParts Industries",
      metric: "87% forecast accuracy",
      avatar: "MC"
    },
    {
      quote: "Implementation was seamless - we were up and running in under a week. The ROI was immediate with better inventory optimization alone.",
      author: "Emily Rodriguez",
      title: "VP of Operations",
      company: "BuildPro Manufacturing",
      metric: "$320K freed up in working capital",
      avatar: "ER"
    }
  ]

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Trusted by Growing Manufacturers
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how other manufacturers are using CapLiquify to optimize working capital and improve cash flow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-xl p-8"
            >
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.title}, {testimonial.company}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm font-semibold text-blue-600">{testimonial.metric}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ==================== FAQ SECTION ====================

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "What ERPs do you integrate with?",
      answer: "We integrate with Xero, QuickBooks Online, Unleashed ERP, Shopify, and Amazon Seller Central. We're constantly adding new integrations based on customer demand."
    },
    {
      question: "How accurate is the AI forecasting?",
      answer: "Our ensemble AI models (ARIMA, LSTM, Prophet) achieve >85% accuracy on average. Accuracy improves over time as the AI learns your business patterns. Most customers see 87%+ accuracy within 90 days."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes! There are no long-term contracts. You can cancel your subscription at any time from your account settings. If you cancel during your trial, you won't be charged."
    },
    {
      question: "Do you offer implementation support?",
      answer: "Professional and Enterprise plans include priority implementation support. Our team helps you connect your data sources, configure dashboards, and train your team."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-level encryption (AES-256), secure OAuth integrations, and SOC 2 compliant infrastructure. Your data is encrypted at rest and in transit. We never sell or share your data."
    },
    {
      question: "What's included in the free trial?",
      answer: "You get full access to all features of your chosen plan for 14 days. No credit card required. You can connect your ERPs, see live forecasts, and explore all features risk-free."
    },
    {
      question: "Can I upgrade or downgrade my plan?",
      answer: "Yes! You can upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period."
    },
    {
      question: "Do you offer custom integrations?",
      answer: "Yes, Enterprise customers can request custom integrations. We also offer API access for building your own integrations or extending CapLiquify's functionality."
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about CapLiquify
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ==================== FINAL CTA SECTION ====================

export const FinalCTASection = () => {
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
            Join 50+ manufacturers using CapLiquify to improve cash flow and make smarter financial decisions.
          </p>

          <Link
            to="/sign-up"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl mb-6"
          >
            Start 14-Day Free Trial
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span>14-day money-back guarantee</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ==================== FOOTER ====================

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company */}
          <div>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
              <span className="ml-2 text-xl font-bold text-white">CapLiquify</span>
            </div>
            <p className="text-sm text-gray-400">
              AI-powered working capital management for manufacturers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a></li>
              <li><Link to="/integrations" className="hover:text-blue-400 transition-colors">Integrations</Link></li>
              <li><Link to="/roadmap" className="hover:text-blue-400 transition-colors">Roadmap</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">About</Link></li>
              <li><Link to="/blog" className="hover:text-blue-400 transition-colors">Blog</Link></li>
              <li><Link to="/careers" className="hover:text-blue-400 transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/security" className="hover:text-blue-400 transition-colors">Security</Link></li>
              <li><Link to="/gdpr" className="hover:text-blue-400 transition-colors">GDPR</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between">
          <div className="text-sm text-gray-400 mb-4 md:mb-0">
            © {new Date().getFullYear()} CapLiquify. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <a href="https://twitter.com/capliquify" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com/company/capliquify" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="mailto:hello@capliquify.com" className="hover:text-blue-400 transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
