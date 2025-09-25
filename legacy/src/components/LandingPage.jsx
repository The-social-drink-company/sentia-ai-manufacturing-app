import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Calculator, 
  BarChart3, 
  PieChart, 
  Target, 
  Zap,
  Shield,
  Users,
  Globe,
  ArrowRight,
  CheckCircle,
  DollarSign,
  Clock,
  TrendingDown
} from 'lucide-react'

const LandingPage = () => {
  const navigate = useNavigate()
  const [hoveredFeature, setHoveredFeature] = useState(null)

  const features = [
    {
      icon: Calculator,
      title: "Working Capital Calculator",
      description: "Advanced cash flow analysis with 30-180 day projections",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: TrendingUp,
      title: "Growth Scenario Modeling",
      description: "Model different growth rates and funding requirements",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      icon: BarChart3,
      title: "Industry Benchmarking",
      description: "Compare performance against industry standards",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: PieChart,
      title: "AI-Powered Insights",
      description: "Machine learning analytics for predictive forecasting",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      icon: Target,
      title: "Cash Flow Optimization",
      description: "Identify opportunities to unlock working capital",
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      icon: Zap,
      title: "Real-Time Processing",
      description: "Live data integration with instant calculations",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    }
  ]

  const stats = [
    { label: "Average Cash Unlock", value: "Â£83K", subtext: "in 90 days", icon: DollarSign },
    { label: "Improvement Potential", value: "Â£334K", subtext: "12-month projection", icon: TrendingUp },
    { label: "Processing Time", value: "<2s", subtext: "real-time analysis", icon: Clock },
    { label: "Efficiency Gain", value: "46", subtext: "days reduction", icon: TrendingDown }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation Header */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Sentia Manufacturing</h1>
              <p className="text-blue-200 text-sm">Enterprise Dashboard</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <SignInButton mode="modal">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </SignUpButton>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-blue-600/20 text-blue-200 border-blue-600/30">
              Working Capital & Cash Flow Experts
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Unlock Your
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}Working Capital
              </span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Enterprise-grade financial intelligence platform that answers three critical questions: 
              How much cash do you need? When do you need funding? How much to fund growth?
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                  Start Free Analysis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignUpButton>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="border-blue-400 text-blue-200 hover:bg-blue-600/10 px-8 py-4 text-lg"
                onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <stat.icon className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-blue-200 text-sm">{stat.subtext}</div>
                    <div className="text-blue-300 text-xs mt-1">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Enterprise-Grade Financial Intelligence
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              Comprehensive suite of tools designed for CFOs, Finance Directors, and Business Analysts 
              who demand accurate, actionable insights for strategic decision making.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-blue-200 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 backdrop-blur-sm">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to Optimize Your Working Capital?
                </h2>
                <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
                  Join enterprise leaders who trust Sentia Manufacturing Dashboard 
                  for critical financial decision making and cash flow optimization.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <SignUpButton mode="modal">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">
                      Access Enterprise Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </SignUpButton>
                </div>
                
                <div className="flex items-center justify-center mt-6 space-x-6 text-sm text-blue-300">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enterprise Security
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    SOC 2 Compliant
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    24/7 Support
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-blue-300">
            Â© 2025 Sentia Manufacturing Dashboard. Enterprise Working Capital Intelligence Platform.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

