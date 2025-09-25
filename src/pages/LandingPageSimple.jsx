import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const LandingPageSimple = () => {
  const { isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/dashboard')
    }
  }, [isLoaded, isSignedIn, navigate])

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Navigation Header */}
      <header className="absolute top-0 w-full bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-white font-semibold text-lg">Sentia Manufacturing</span>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/login"
                className="px-4 py-2 text-white hover:text-blue-400 transition-colors font-medium"
              >
                Sign In
              </a>
              <a
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white">
                Enterprise Manufacturing
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Intelligence Platform
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-slate-300 max-w-3xl mx-auto">
                Transform your manufacturing operations with AI-powered insights, real-time analytics, and comprehensive financial management
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {[
                'AI Analytics',
                'Working Capital Management',
                'What-If Analysis',
                'Demand Forecasting',
                'Inventory Optimization',
                'Quality Control'
              ].map((feature) => (
                <span
                  key={feature}
                  className="px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-full text-sm text-slate-300"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <a
                href="/login"
                className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transform hover:scale-105 transition-all shadow-xl inline-block text-center"
              >
                Sign In to Dashboard
              </a>
              <a
                href="/signup"
                className="px-8 py-4 bg-slate-800 text-white text-lg font-semibold rounded-xl hover:bg-slate-700 transform hover:scale-105 transition-all border border-slate-600 inline-block text-center"
              >
                Request Access
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="pt-12 border-t border-slate-800 mt-12">
              <p className="text-slate-400 mb-6">Trusted by leading manufacturers worldwide</p>
              <div className="flex justify-center items-center space-x-8 opacity-50">
                <div className="text-slate-500">
                  <svg className="w-32 h-8" viewBox="0 0 120 30" fill="currentColor">
                    <text x="0" y="22" fontSize="18" fontWeight="bold">Enterprise</text>
                  </svg>
                </div>
                <div className="text-slate-500">
                  <svg className="w-32 h-8" viewBox="0 0 120 30" fill="currentColor">
                    <text x="0" y="22" fontSize="18" fontWeight="bold">Solutions</text>
                  </svg>
                </div>
                <div className="text-slate-500">
                  <svg className="w-32 h-8" viewBox="0 0 120 30" fill="currentColor">
                    <text x="0" y="22" fontSize="18" fontWeight="bold">Platform</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-slate-400 text-sm">
              © 2025 Sentia Manufacturing. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPageSimple