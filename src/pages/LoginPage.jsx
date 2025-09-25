import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4 py-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Back to Home Link */}
        <Link
          to="/"
          className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mb-4 shadow-2xl"
          >
            <span className="text-white font-bold text-3xl">S</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-300">Sign in to access your manufacturing dashboard</p>
        </div>

        {/* Clerk SignIn Component with Custom Styling */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-1">
          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/signup"
            redirectUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
                card: 'bg-white shadow-none',
                headerTitle: 'text-gray-900',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton: 'bg-white hover:bg-gray-50 border border-gray-300',
                formFieldLabel: 'text-gray-700',
                formFieldInput: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                footerActionLink: 'text-blue-600 hover:text-blue-700',
                identityPreviewEditButton: 'text-blue-600 hover:text-blue-700',
                formResendCodeLink: 'text-blue-600 hover:text-blue-700'
              },
              layout: {
                socialButtonsPlacement: 'top',
                showOptionalFields: true
              },
              variables: {
                colorPrimary: '#2563eb',
                colorText: '#111827',
                colorTextSecondary: '#6b7280',
                colorBackground: '#ffffff',
                borderRadius: '0.5rem',
                fontFamily: 'Inter, system-ui, sans-serif'
              }
            }}
          />
        </div>

        {/* Additional Options */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign up here
            </Link>
          </p>
        </div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-2 gap-4 text-sm"
        >
          <div className="text-gray-300">
            <span className="block font-semibold text-white mb-1">Real-time Analytics</span>
            Monitor production metrics live
          </div>
          <div className="text-gray-300">
            <span className="block font-semibold text-white mb-1">AI Forecasting</span>
            Predict demand with ML models
          </div>
          <div className="text-gray-300">
            <span className="block font-semibold text-white mb-1">Working Capital</span>
            Optimize cash flow management
          </div>
          <div className="text-gray-300">
            <span className="block font-semibold text-white mb-1">Quality Control</span>
            Track and improve quality metrics
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;