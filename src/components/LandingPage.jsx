import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  Calculator, 
  Brain,
  CheckCircle,
  Star,
  Users,
  Award
} from 'lucide-react';

const LandingPage = ({ onStartNow, onLogin, onCalculator }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div 
        className="relative z-10 container mx-auto px-6 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="text-center mb-16" variants={itemVariants}>
          <div className="flex items-center justify-center mb-6">
            <motion.div 
              className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mr-6 shadow-2xl"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="text-3xl font-bold">📊</span>
            </motion.div>
            <div className="text-left">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Sentia Manufacturing
              </h1>
              <div className="flex items-center mt-2">
                <Badge variant="secondary" className="bg-blue-600/20 text-blue-200 border-blue-400/30">
                  <Award className="w-4 h-4 mr-1" />
                  Enterprise Grade
                </Badge>
                <Badge variant="secondary" className="ml-2 bg-green-600/20 text-green-200 border-green-400/30">
                  <Shield className="w-4 h-4 mr-1" />
                  SOC 2 Certified
                </Badge>
              </div>
            </div>
          </div>
          
          <motion.h2 
            className="text-3xl text-blue-200 mb-6 font-light"
            variants={itemVariants}
          >
            Enterprise Working Capital Intelligence Platform
          </motion.h2>
          
          <motion.p 
            className="text-xl text-gray-300 max-w-5xl mx-auto leading-relaxed mb-8"
            variants={itemVariants}
          >
            Transform your manufacturing enterprise with AI-powered working capital optimization. 
            Answer the critical questions: <span className="text-blue-300 font-semibold">How much cash do you need?</span> 
            <span className="text-green-300 font-semibold"> When do you need it?</span> 
            <span className="text-purple-300 font-semibold"> How can you optimize for growth?</span>
          </motion.p>

          {/* Key Metrics */}
          <motion.div 
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
            variants={itemVariants}
          >
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">£83K</div>
                <div className="text-sm text-gray-300">90-Day Cash Unlock Potential</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">£334K</div>
                <div className="text-sm text-gray-300">Annual Improvement Target</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">46 Days</div>
                <div className="text-sm text-gray-300">Cash Conversion Improvement</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Call to Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16"
          variants={itemVariants}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={onStartNow}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-xl font-semibold rounded-xl shadow-2xl border-0 group"
            >
              Start Now
              <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={onLogin}
              variant="outline"
              size="lg"
              className="border-2 border-white/30 text-white hover:bg-white/10 px-12 py-6 text-xl font-semibold rounded-xl backdrop-blur-sm"
            >
              Login
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={onCalculator}
              variant="secondary"
              size="lg"
              className="bg-green-600/20 border-2 border-green-400/30 text-green-200 hover:bg-green-600/30 px-12 py-6 text-xl font-semibold rounded-xl backdrop-blur-sm"
            >
              <Calculator className="mr-2 w-6 h-6" />
              Working Capital Calculator
            </Button>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16"
          variants={itemVariants}
        >
          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Cash Requirements Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">
                  Precisely calculate cash requirements for 30, 60, 90, 120, and 180-day periods with AI-powered forecasting.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-green-300">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Multi-period cash flow analysis
                  </div>
                  <div className="flex items-center text-sm text-green-300">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Industry benchmark comparisons
                  </div>
                  <div className="flex items-center text-sm text-green-300">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Risk assessment and mitigation
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Investment & Funding Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">
                  Determine optimal funding strategies including overdrafts, equity injections, and investment requirements.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-blue-300">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Funding requirement calculations
                  </div>
                  <div className="flex items-center text-sm text-blue-300">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Investment opportunity analysis
                  </div>
                  <div className="flex items-center text-sm text-blue-300">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Capital structure optimization
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Growth Acceleration Engine</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">
                  Calculate precise funding requirements for targeted growth scenarios with AI-powered projections.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-purple-300">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Growth scenario modeling
                  </div>
                  <div className="flex items-center text-sm text-purple-300">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Scalability assessments
                  </div>
                  <div className="flex items-center text-sm text-purple-300">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Market expansion planning
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Enterprise Features */}
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <h3 className="text-3xl font-bold mb-8">Enterprise-Grade Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="flex flex-col items-center p-6 bg-white/5 rounded-xl backdrop-blur-sm">
              <Shield className="w-12 h-12 text-green-400 mb-4" />
              <h4 className="text-lg font-semibold mb-2">Enterprise Security</h4>
              <p className="text-sm text-gray-300 text-center">SOC 2, GDPR, CCPA compliant with end-to-end encryption</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/5 rounded-xl backdrop-blur-sm">
              <BarChart3 className="w-12 h-12 text-blue-400 mb-4" />
              <h4 className="text-lg font-semibold mb-2">Advanced Analytics</h4>
              <p className="text-sm text-gray-300 text-center">Real-time dashboards with predictive insights</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/5 rounded-xl backdrop-blur-sm">
              <Users className="w-12 h-12 text-purple-400 mb-4" />
              <h4 className="text-lg font-semibold mb-2">Multi-User Collaboration</h4>
              <p className="text-sm text-gray-300 text-center">Role-based access with team collaboration tools</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/5 rounded-xl backdrop-blur-sm">
              <Brain className="w-12 h-12 text-orange-400 mb-4" />
              <h4 className="text-lg font-semibold mb-2">AI-Powered Insights</h4>
              <p className="text-sm text-gray-300 text-center">Machine learning algorithms for optimization</p>
            </div>
          </div>
        </motion.div>

        {/* Social Proof */}
        <motion.div 
          className="text-center"
          variants={itemVariants}
        >
          <div className="flex justify-center items-center space-x-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
          </div>
          <p className="text-gray-300 text-lg">
            Trusted by manufacturing enterprises worldwide for working capital optimization
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
