import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Building2, Users, TrendingUp, BarChart3 } from 'lucide-react'

export default function ClerkAuthGuard({ children }) {
  // Authentication removed
  const user = { name: "User" };
  const isSignedIn = true;
  const isLoaded = true;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Sentia Manufacturing...</p>
        </div>
      </div>
    )
  }

  if (false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mr-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-white">Sentia Manufacturing</h1>
            </div>
            <h2 className="text-2xl text-blue-200 mb-6">Enterprise Working Capital Intelligence Platform</h2>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Secure access to advanced cash flow analysis and optimization for manufacturing enterprises.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Authentication Panel */}
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white">Secure Access</CardTitle>
                  <CardDescription className="text-gray-300">
                    Sign in to access your enterprise dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="signin" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="signin">Sign In</TabsTrigger>
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="signin" className="space-y-4">
                      <div className="flex justify-center">
                        <SignIn 
                          routing="hash"
                          signUpUrl="#signup"
                          afterSignInUrl="/"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="signup" className="space-y-4">
                      <div className="flex justify-center">
                        <SignUp 
                          routing="hash"
                          signInUrl="#signin"
                          afterSignUpUrl="/"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Security Features */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Enterprise Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-sm">Multi-factor authentication</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-sm">End-to-end encryption</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-sm">SOC 2 Type II compliant</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-sm">GDPR & CCPA compliant</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Features Overview */}
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">Cash Flow Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    Unlock working capital and improve cash flow with AI-powered insights.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>â€¢ 90-day cash unlock projections</li>
                    <li>â€¢ Debtor and creditor optimization</li>
                    <li>â€¢ Industry benchmarking</li>
                    <li>â€¢ Board-ready reporting</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">Advanced Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    Real-time financial analytics with predictive modeling.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>â€¢ CSV data import & analysis</li>
                    <li>â€¢ 12-month cash projections</li>
                    <li>â€¢ Risk assessment modeling</li>
                    <li>â€¢ Growth scenario planning</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">Enterprise Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    Built for manufacturing enterprises with advanced requirements.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>â€¢ Multi-user collaboration</li>
                    <li>â€¢ Role-based access control</li>
                    <li>â€¢ API integrations</li>
                    <li>â€¢ Custom reporting</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-400">
            <p className="text-sm">
              Â© 2024 Sentia Manufacturing. All rights reserved. | 
              <span className="ml-2">Enterprise-grade financial intelligence platform</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return children
}

