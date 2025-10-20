/**
 * Pricing Page - Clerk Billing Integration
 * 
 * Epic: BMAD-MULTITENANT-004 (Clerk Billing)
 * Story: Story 2 - Pricing UI
 */

import { PricingTable, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Zap } from 'lucide-react'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      {/* Hero */}
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-6">
          <Zap className="w-4 h-4 mr-2" />
          <span className="font-semibold">14-day free trial • No credit card required</span>
        </div>

        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Optimize working capital with AI-powered forecasting. Start free, upgrade anytime.
        </p>
      </div>

      {/* Pricing Table */}
      <div className="container mx-auto px-4 pb-24 max-w-6xl">
        <SignedIn>
          <PricingTable 
            appearance={{
              elements: {
                card: 'shadow-xl border-2 hover:border-blue-500 transition-all duration-300',
                priceText: 'text-4xl font-bold text-gray-900',
                badge: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              }
            }}
            checkoutProps={{
              appearance: {
                elements: {
                  formButtonPrimary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold'
                }
              }
            }}
            newSubscriptionRedirectUrl="/dashboard?subscribed=true"
            ctaPosition="bottom"
          />
        </SignedIn>

        <SignedOut>
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sign in to view pricing
            </h2>
            <p className="text-gray-600 mb-8">
              Create a free account to explore our plans and start your 14-day trial
            </p>
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg transform hover:scale-105">
                Sign In to Get Started
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>

      {/* Features Grid */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why manufacturers choose CapLiquify</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              title="AI-Powered Forecasting"
              description="Achieve >85% forecast accuracy with ensemble machine learning models"
            />
            <FeatureCard
              title="Real-Time Integration"
              description="Connect Xero, Shopify, Amazon SP-API, and custom ERP systems"
            />
            <FeatureCard
              title="What-If Scenarios"
              description="Model inventory changes, payment terms, and production schedules"
            />
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <FAQ
            q="Do I need a credit card for the trial?"
            a="No! Start your 14-day trial with just an email. Upgrade to a paid plan anytime."
          />
          <FAQ
            q="Can I change plans later?"
            a="Yes, upgrade or downgrade anytime. Changes take effect immediately with prorated billing."
          />
          <FAQ
            q="What happens when my trial ends?"
            a="You'll get email reminders before expiration. After the trial, upgrade or access read-only mode for 3 days."
          />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, description }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
        <Check className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function FAQ({ q, a }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{q}</h3>
      <p className="text-gray-600">{a}</p>
    </div>
  )
}
