import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
const plans = [
  {
    name: 'Starter',
    price: { monthly: 299, annual: 249 },
    description: 'Perfect for small manufacturing operations',
    features: [
      { name: 'Up to 5 production lines', included: true },
      { name: 'Real-time monitoring', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Email support', included: true },
      { name: 'API access', included: true },
      { name: 'Advanced AI predictions', included: false },
      { name: 'Custom integrations', included: false },
      { name: 'Dedicated account manager', included: false },
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: { monthly: 799, annual: 666 },
    description: 'Ideal for growing manufacturing companies',
    features: [
      { name: 'Up to 20 production lines', included: true },
      { name: 'Real-time monitoring', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Priority support', included: true },
      { name: 'Full API access', included: true },
      { name: 'Advanced AI predictions', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated account manager', included: false },
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: { monthly: 'Custom', annual: 'Custom' },
    description: 'For large-scale operations with custom needs',
    features: [
      { name: 'Unlimited production lines', included: true },
      { name: 'Real-time monitoring', included: true },
      { name: 'Enterprise analytics', included: true },
      { name: '24/7 phone support', included: true },
      { name: 'Full API access', included: true },
      { name: 'Advanced AI predictions', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated account manager', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const PricingSection = () => {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  return (
    <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your manufacturing needs. All plans include a 14-day free trial.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Annual
              <span className="ml-2 text-xs text-green-600 dark:text-green-400">Save 20%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative ${plan.popular ? 'md:-mt-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <motion.div
                whileHover={{ y: -5 }}
                className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 h-full border-2 ${
                  plan.popular
                    ? 'border-blue-500 shadow-xl'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline">
                    {typeof plan.price[billingPeriod] === 'number' ? (
                      <>
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          ${plan.price[billingPeriod]}
                        </span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">/month</span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price[billingPeriod]}
                      </span>
                    )}
                  </div>
                  {billingPeriod === 'annual' && typeof plan.price.monthly === 'number' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Billed annually (${plan.price.annual * 12}/year)
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-start">
                      {feature.included ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 mt-0.5 mr-3 flex-shrink-0" />
                      )}
                      <span
                        className={
                          feature.included
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-400 dark:text-gray-500'
                        }
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.cta === 'Contact Sales' ? (
                  <button className="w-full py-3 px-6 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {plan.cta}
                  </button>
                ) : (
                  <SignUpButton mode="modal">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {plan.cta}
                    </motion.button>
                  </SignUpButton>
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400">
            All plans include: SSL encryption â€¢ GDPR compliance â€¢ Daily backups â€¢ 99.9% uptime SLA
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
