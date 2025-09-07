import React from 'react';
import { signIn } from 'next-auth/react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      <div className="relative min-h-screen flex items-center justify-center px-4">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 text-center text-white max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              🚀 SENTIA
            </h1>
            <h2 className="text-2xl md:text-3xl font-light mb-6 text-blue-100">
              Manufacturing Intelligence Platform
            </h2>
            <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto mb-8">
              Advanced AI-powered manufacturing dashboard with real-time analytics, 
              predictive insights, and intelligent automation for modern production facilities.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 hover:bg-white/15 transition-all duration-300">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Analytics</h3>
              <p className="text-blue-200 text-sm">
                Advanced machine learning models for demand forecasting, quality prediction, and optimization.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 hover:bg-white/15 transition-all duration-300">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Monitoring</h3>
              <p className="text-blue-200 text-sm">
                Live production metrics, quality control, and operational efficiency tracking.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 hover:bg-white/15 transition-all duration-300">
              <div className="text-3xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold mb-2">Integrated Ecosystem</h3>
              <p className="text-blue-200 text-sm">
                Seamless integration with Shopify, Amazon, ERP systems, and financial platforms.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="space-y-4">
            <button 
              onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-200 text-lg shadow-lg">
                Access Dashboard
              </button>
            
            <p className="text-blue-200 text-sm">
              Secure authentication powered by Microsoft Azure AD
            </p>
          </div>

          {/* Current Status */}
          <div className="mt-12 bg-white/5 backdrop-blur-lg rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-green-400 font-semibold">✅ API Gateway</div>
                <div className="text-blue-200">Operational</div>
              </div>
              <div>
                <div className="text-green-400 font-semibold">✅ Database</div>
                <div className="text-blue-200">Connected</div>
              </div>
              <div>
                <div className="text-green-400 font-semibold">✅ ML Models</div>
                <div className="text-blue-200">Ready</div>
              </div>
              <div>
                <div className="text-green-400 font-semibold">✅ Integrations</div>
                <div className="text-blue-200">Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;