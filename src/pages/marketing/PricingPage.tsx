/**
 * Interactive Pricing Page with ROI Calculator
 *
 * High-converting pricing page featuring:
 * - 3-tier pricing cards (Starter, Professional, Enterprise)
 * - Monthly/annual billing toggle (17% savings)
 * - Interactive ROI calculator modal
 * - Feature comparison table
 * - FAQ section with accordion
 * - Social proof testimonials
 * - Clear CTAs throughout
 *
 * @epic EPIC-PRICING-001
 * @story BMAD-PRICE-002
 */

import { useState } from 'react';
import { Check, Zap, Crown, Rocket, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PRICING_TIERS, FEATURE_NAMES } from '@/config/pricing.config';
import { ROICalculatorModal } from '@/components/pricing/ROICalculatorModal';
import { FeatureComparisonTable } from '@/components/pricing/FeatureComparisonTable';
import { FAQSection } from '@/components/pricing/FAQSection';
import { TestimonialsSection } from '@/components/pricing/TestimonialsSection';

const PricingPage = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showCalculator, setShowCalculator] = useState(false);

  const getTierIcon = (tierId: string) => {
    const icons = {
      starter: Zap,
      professional: Rocket,
      enterprise: Crown,
    };
    return icons[tierId as keyof typeof icons] || Zap;
  };

  const handleStartTrial = (tierId: string) => {
    navigate(`/signup?tier=${tierId}&cycle=${billingCycle}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that's right for your business. Start your 14-day free trial today.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white rounded-full p-2 shadow-lg mb-12">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-8 py-3 rounded-full font-semibold transition-all relative ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                Save 17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_TIERS.map((tier, index) => {
            const Icon = getTierIcon(tier.id);
            const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
            const savings = billingCycle === 'annual' ? tier.monthlyPrice * 12 - tier.annualPrice : 0;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${
                  tier.popular ? 'ring-4 ring-blue-600 transform scale-105' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className={`p-8 ${tier.popular ? 'pt-14' : ''}`}>
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Tier Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">{tier.name}</h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-6 text-center">{tier.description}</p>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-gray-900">${price}</span>
                      <span className="text-gray-600">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                    {billingCycle === 'annual' && savings > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-2">Save ${savings}/year</p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleStartTrial(tier.id)}
                    className={`w-full py-4 rounded-lg font-semibold mb-8 transition-all ${
                      tier.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Start Free Trial
                  </button>

                  {/* Features */}
                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3">
                      Everything in {tier.name}:
                    </div>
                    <ul className="space-y-3">
                      {Object.entries(tier.features)
                        .slice(0, 10)
                        .map(([key, value]) => (
                          <li key={key} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{formatFeature(key, value)}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ROI Calculator CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16"
        >
          <button
            onClick={() => setShowCalculator(true)}
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Calculator className="w-5 h-5" />
            Calculate Your ROI
          </button>
        </motion.div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Compare Plans</h2>
        <FeatureComparisonTable />
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
        <FAQSection />
      </div>

      {/* Social Proof */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Trusted by Manufacturing Leaders
        </h2>
        <TestimonialsSection />
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to optimize your working capital?</h2>
          <p className="text-xl text-blue-100 mb-8">Start your 14-day free trial. No credit card required.</p>
          <button
            onClick={() => navigate('/signup')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl"
          >
            Start Free Trial
          </button>
        </div>
      </div>

      {/* ROI Calculator Modal */}
      {showCalculator && <ROICalculatorModal onClose={() => setShowCalculator(false)} />}
    </div>
  );
};

function formatFeature(key: string, value: any): string {
  const label = FEATURE_NAMES[key as keyof typeof FEATURE_NAMES] || key;

  if (typeof value === 'boolean') {
    return label;
  }

  const formattedValue = value === 'unlimited' ? 'Unlimited' : value;

  // Special formatting for specific features
  if (key === 'forecastHorizonMonths') {
    return `${formattedValue}-month forecast horizon`;
  }
  if (key === 'dataRetentionMonths') {
    return `${formattedValue} months data retention`;
  }
  if (key === 'apiCallsPerMonth') {
    return `${formattedValue.toLocaleString()} API calls/month`;
  }

  return `${formattedValue} ${label}`;
}

export default PricingPage;
