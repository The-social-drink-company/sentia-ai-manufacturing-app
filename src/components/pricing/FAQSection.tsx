/**
 * FAQ Section with Accordion
 *
 * Common questions about pricing, trials, plans, and features.
 * Smooth expand/collapse animations with Framer Motion.
 *
 * @epic EPIC-PRICING-001
 * @story BMAD-PRICE-005
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How does the free trial work?',
      answer:
        'You get 14 days of full access to all features in your chosen plan. No credit card required to start. You can cancel anytime during the trial with no charges.',
    },
    {
      question: 'Can I change plans later?',
      answer:
        'Yes! You can upgrade or downgrade at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing period.',
    },
    {
      question: 'What integrations do you support?',
      answer:
        'We integrate with Xero, QuickBooks, Sage One, Unleashed ERP, Shopify, Amazon SP-API, and more. Professional and Enterprise plans support unlimited integrations.',
    },
    {
      question: 'Is my data secure?',
      answer:
        'Absolutely. We use bank-level encryption (AES-256), SOC 2 compliance, and regular security audits. Your data is stored in secure, redundant data centers.',
    },
    {
      question: 'What happens if I exceed my limits?',
      answer:
        "We'll notify you when you approach your limits. You can upgrade to a higher plan anytime. We never shut off your access without warning.",
    },
    {
      question: 'Do you offer discounts for annual billing?',
      answer:
        "Yes! Annual billing saves you 17% compared to monthly billing. That's over 2 months free per year.",
    },
    {
      question: 'Can I get a demo before signing up?',
      answer:
        'Of course! Contact us to schedule a personalized demo, or start your free trial to explore on your own.',
    },
    {
      question: 'What kind of support do you offer?',
      answer:
        'All plans include email support. Professional plans get priority support with faster response times. Enterprise plans include a dedicated account manager and phone support.',
    },
  ];

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">{faq.question}</span>
            <ChevronDown
              className={`w-5 h-5 text-gray-500 transition-transform ${
                openIndex === index ? 'transform rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-4 text-gray-600">{faq.answer}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
