import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const SignupPage = () => {
  const benefits = [
    'Real-time production monitoring',
    'AI-powered demand forecasting',
    'Working capital optimization',
    'Quality control analytics',
    'Inventory management',
    'Financial reporting dashboard'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center px-4 py-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl flex gap-8">
        {/* Left Side - Benefits */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex flex-col justify-center flex-1 pr-8"
        >
          <h2 className="text-3xl font-bold text-white mb-6">
            Join Sentia Manufacturing Dashboard
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Get instant access to powerful manufacturing analytics and insights
          </p>

          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start"
              >
                <CheckCircleIcon className="h-6 w-6 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-200">{benefit}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-lg">
            <p className="text-white font-semibold mb-2">Enterprise Ready</p>
            <p className="text-gray-300 text-sm">
              Trusted by manufacturing companies worldwide for real-time insights and decision making
            </p>
          </div>
        </motion.div>

        {/* Right Side - SignUp Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
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
          <div className="text-center mb-8 lg:hidden">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl mb-4 shadow-2xl"
            >
              <span className="text-white font-bold text-3xl">S</span>
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-2">Get Started</h1>
            <p className="text-gray-300">Create your account to begin</p>
          </div>

          {/* Clerk SignUp Component with Custom Styling */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-1">
            <SignUp
              path="/signup"
              routing="path"
              signInUrl="/login"
              redirectUrl="/dashboard"
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-green-600 hover:bg-green-700 text-white',
                  card: 'bg-white shadow-none',
                  headerTitle: 'text-gray-900',
                  headerSubtitle: 'text-gray-600',
                  socialButtonsBlockButton: 'bg-white hover:bg-gray-50 border border-gray-300',
                  formFieldLabel: 'text-gray-700',
                  formFieldInput: 'border-gray-300 focus:border-green-500 focus:ring-green-500',
                  footerActionLink: 'text-green-600 hover:text-green-700',
                  identityPreviewEditButton: 'text-green-600 hover:text-green-700',
                  formResendCodeLink: 'text-green-600 hover:text-green-700'
                },
                layout: {
                  socialButtonsPlacement: 'top',
                  showOptionalFields: true,
                  termsPageUrl: '/terms',
                  privacyPageUrl: '/privacy'
                },
                variables: {
                  colorPrimary: '#16a34a',
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
              Already have an account?{' '}
              <Link to="/login" className="text-green-400 hover:text-green-300 font-medium">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex items-center justify-center space-x-6 lg:hidden"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-gray-400">Secure</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-xs text-gray-400">Support</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">Free</p>
              <p className="text-xs text-gray-400">Trial</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
