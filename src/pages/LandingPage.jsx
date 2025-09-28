import {
  ChartBarIcon,
  CubeIcon,
  TruckIcon,
  BeakerIcon,
  BanknotesIcon,
  PresentationChartLineIcon,
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

import { SignInButton } from '../providers/ClerkAuthProvider'

export default function LandingPage() {
  // This landing page requires Clerk authentication - no guest access

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Real-time Analytics',
      description: 'Monitor production metrics, quality indicators, and KPIs with live dashboard updates'
    },
    {
      icon: BanknotesIcon,
      title: 'Working Capital Optimization',
      description: 'Advanced financial management with cash flow forecasting and scenario planning'
    },
    {
      icon: PresentationChartLineIcon,
      title: 'AI-Powered Forecasting',
      description: 'Leverage machine learning for demand prediction and inventory optimization'
    },
    {
      icon: CubeIcon,
      title: 'Inventory Management',
      description: 'Multi-location inventory tracking with automated reorder points'
    },
    {
      icon: TruckIcon,
      title: 'Production Tracking',
      description: 'End-to-end visibility of manufacturing processes and resource allocation'
    },
    {
      icon: BeakerIcon,
      title: 'Quality Control',
      description: 'Comprehensive quality metrics with defect tracking and trend analysis'
    }
  ]

  const benefits = [
    'Reduce inventory costs by up to 30%',
    'Improve production efficiency by 25%',
    'Real-time visibility across all operations',
    'AI-driven insights and recommendations',
    'Enterprise-grade security and compliance',
    'Seamless integration with existing systems'
  ]

  const stats = [
    { value: '10+', label: 'Years Industry Experience' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '24/7', label: 'Support Available' },
    { value: '50+', label: 'KPIs Tracked' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Sentia Manufacturing</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <SignInButton mode="modal">
                <button className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base">
                  Sign In to Dashboard
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-12 sm:pt-20 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <SparklesIcon className="w-3 sm:w-4 h-3 sm:h-4" />
              <span>AI-Powered Manufacturing Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Transform Your Manufacturing Operations
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 leading-relaxed px-4 sm:px-0">
              Enterprise-grade manufacturing dashboard with real-time analytics, AI forecasting,
              and comprehensive production management for Sentia Spirits
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <SignInButton mode="modal">
                <button className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 font-medium text-base sm:text-lg shadow-lg">
                  Sign In to Dashboard
                  <ArrowRightIcon className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
                </button>
              </SignInButton>
              <div className="text-center text-sm text-gray-600">
                <p>🔒 Secure enterprise authentication required</p>
                <p>No guest access • Powered by Clerk</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Manufacturing Platform
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to optimize production, manage inventory, and drive profitability
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Sentia Manufacturing Dashboard?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Built specifically for modern manufacturing operations, our platform delivers
                measurable results and continuous improvement.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                  <ShieldCheckIcon className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Enterprise Security</h3>
                  <p className="text-sm text-gray-600">Bank-grade encryption and compliance</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                  <GlobeAltIcon className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Global Scale</h3>
                  <p className="text-sm text-gray-600">Multi-region support with local compliance</p>
                </div>
              </div>
              <div className="space-y-6 mt-12">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                  <BoltIcon className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                  <p className="text-sm text-gray-600">Real-time updates and instant insights</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                  <SparklesIcon className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
                  <p className="text-sm text-gray-600">Advanced ML models for predictions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Manufacturing?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join industry leaders using Sentia to optimize operations and drive growth
          </p>
          <SignInButton mode="modal">
            <button className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 font-medium text-lg">
              Sign In to Dashboard
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
          </SignInButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="text-white font-semibold">Sentia Manufacturing Dashboard</span>
          </div>
          <p className="text-sm">
            {new Date().getFullYear()} Sentia Spirits. All rights reserved.
            Enterprise Manufacturing Intelligence Platform.
          </p>
        </div>
      </footer>
    </div>
  )
}