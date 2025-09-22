import React from 'react';
import { useUser, SignIn, SignUp } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, CheckCircle } from 'lucide-react';

const AuthGuard = ({ children, authMode = 'sign-in' }) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Enterprise Messaging */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white space-y-8"
          >
            {/* Header */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-2xl font-bold">📊</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Sentia Manufacturing</h1>
                  <p className="text-blue-200">Enterprise Working Capital Intelligence</p>
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Enterprise-Grade Security</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Multi-Factor Authentication</h3>
                    <p className="text-gray-300 text-sm">Advanced security with SMS, email, and authenticator app support</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">End-to-End Encryption</h3>
                    <p className="text-gray-300 text-sm">All data encrypted in transit and at rest with AES-256</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Compliance Certified</h3>
                    <p className="text-gray-300 text-sm">SOC 2 Type II, GDPR, and CCPA compliant infrastructure</p>
                  </div>
                </div>
              </div>

              {/* Compliance Badges */}
              <div className="flex flex-wrap gap-2 mt-6">
                <Badge variant="secondary" className="bg-green-600/20 text-green-200 border-green-400/30">
                  SOC 2 Type II
                </Badge>
                <Badge variant="secondary" className="bg-blue-600/20 text-blue-200 border-blue-400/30">
                  GDPR Compliant
                </Badge>
                <Badge variant="secondary" className="bg-purple-600/20 text-purple-200 border-purple-400/30">
                  CCPA Certified
                </Badge>
                <Badge variant="secondary" className="bg-orange-600/20 text-orange-200 border-orange-400/30">
                  ISO 27001
                </Badge>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="font-semibold mb-3">Trusted by Manufacturing Leaders</h3>
              <p className="text-gray-300 text-sm">
                Join thousands of manufacturing enterprises who trust our platform with their most sensitive financial data.
              </p>
            </div>
          </motion.div>

          {/* Right Side - Authentication Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-0">
                {authMode === 'sign-up' ? (
                  <SignUp 
                    routing="hash"
                    signInUrl="#/sign-in"
                    afterSignUpUrl="/"
                  />
                ) : (
                  <SignIn 
                    routing="hash"
                    signUpUrl="#/sign-up"
                    afterSignInUrl="/"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthGuard;
