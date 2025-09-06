# Landing Page - Complete Implementation Code

## Full React Component Code

```jsx
// src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { ArrowRight, BarChart3, Brain, Factory, Users, Shield, Globe, Zap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LandingPage = () => {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mcpStatus, setMcpStatus] = useState('disconnected');
  const [aiCapabilities, setAiCapabilities] = useState([]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    // Check MCP connection status
    checkMCPConnection();
    
    // Load AI capabilities
    loadAICapabilities();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkMCPConnection = async () => {
    try {
      const response = await fetch('/api/mcp/status');
      const data = await response.json();
      setMcpStatus(data.connected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('MCP connection check failed:', error);
    }
  };

  const loadAICapabilities = async () => {
    try {
      const response = await fetch('/api/ai/capabilities');
      const data = await response.json();
      setAiCapabilities(data.capabilities);
    } catch (error) {
      console.error('Failed to load AI capabilities:', error);
    }
  };

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Insights",
      description: "Multi-model ensemble forecasting with GPT-4, Claude 3, and specialized ML models",
      details: [
        "Real-time demand prediction",
        "Anomaly detection",
        "Natural language queries",
        "Automated reporting"
      ]
    },
    {
      icon: <Factory className="w-8 h-8" />,
      title: "Digital Twin Technology",
      description: "3D visualization and simulation of your entire manufacturing operation",
      details: [
        "Real-time 3D factory model",
        "What-if scenario testing",
        "Bottleneck identification",
        "Capacity optimization"
      ]
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "24/7 Autonomous Agents",
      description: "AI agents continuously monitor and optimize your operations",
      details: [
        "Proactive issue detection",
        "Automated task execution",
        "Continuous optimization",
        "Alert management"
      ]
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Enterprise Security",
      description: "Bank-grade security with role-based access control",
      details: [
        "End-to-end encryption",
        "SSO integration",
        "Audit logging",
        "Compliance reporting"
      ]
    }
  ];

  const stats = [
    { value: "45%", label: "Reduction in Lead Times" },
    { value: "32%", label: "Increase in Efficiency" },
    { value: "28%", label: "Cost Savings" },
    { value: "99.9%", label: "System Uptime" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation Header */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-gray-900/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Factory className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-white">Sentia Manufacturing</span>
              {mcpStatus === 'connected' && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  MCP Connected
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {!isSignedIn ? (
                <>
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 text-white hover:text-blue-400 transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Get Started
                    </button>
                  </SignUpButton>
                </>
              ) : (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Manufacturing Intelligence
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                Powered by AI
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform your manufacturing operations with real-time insights, predictive analytics, 
              and autonomous optimization powered by cutting-edge AI technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <SignUpButton mode="modal">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  Start Free Trial
                </button>
              </SignUpButton>
              <button 
                onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border-2 border-gray-600 text-white rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Floating metrics */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <div key={index} className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-400">{stat.value}</div>
                <div className="text-sm text-gray-400 mt-2">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to optimize your manufacturing operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveFeature(index)}
                  className={`p-6 rounded-lg cursor-pointer transition-all duration-300 ${
                    activeFeature === index 
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500' 
                      : 'bg-gray-800/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-blue-400">{feature.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-gray-800/50 rounded-lg p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-blue-400 mb-4">{features[activeFeature].icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {features[activeFeature].title}
                  </h3>
                  <ul className="space-y-3">
                    {features[activeFeature].details.map((detail, idx) => (
                      <li key={idx} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300">{detail}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Learn More
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* AI Capabilities Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              AI & Machine Learning Capabilities
            </h2>
            <p className="text-xl text-gray-400">
              Powered by the latest in artificial intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {aiCapabilities.length > 0 ? (
              aiCapabilities.map((capability, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700"
                >
                  <div className="text-3xl mb-4">{capability.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{capability.name}</h3>
                  <p className="text-gray-400 mb-4">{capability.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {capability.models?.map((model, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                        {model}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              // Default capabilities if API not available
              <>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
                  <Brain className="w-12 h-12 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Predictive Analytics</h3>
                  <p className="text-gray-400">Advanced forecasting using ensemble ML models</p>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
                  <BarChart3 className="w-12 h-12 text-purple-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Real-time Optimization</h3>
                  <p className="text-gray-400">Continuous process improvement with AI agents</p>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
                  <Globe className="w-12 h-12 text-green-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Natural Language Interface</h3>
                  <p className="text-gray-400">Query your data using conversational AI</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-400">
              Watch how Sentia transforms manufacturing operations
            </p>
          </div>

          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Sentia Manufacturing Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">5 min</div>
              <div className="text-gray-400">Setup Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">100+</div>
              <div className="text-gray-400">Integrations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">24/7</div>
              <div className="text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Manufacturing?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join leading manufacturers using AI to optimize operations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignUpButton mode="modal">
                <button className="px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  Start Free Trial
                </button>
              </SignUpButton>
              <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors">
                Schedule Demo
              </button>
            </div>
            <p className="text-sm text-white/70 mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Factory className="w-6 h-6 text-blue-500" />
                <span className="text-xl font-bold text-white">Sentia</span>
              </div>
              <p className="text-gray-400">
                AI-powered manufacturing intelligence platform
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>2024 Sentia Manufacturing. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
```

## Supporting Styles

```css
/* src/styles/landing.css */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 3s ease-in-out infinite;
}

/* Gradient text animation */
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.gradient-animate {
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}

/* Glass morphism effects */
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Hover effects */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

/* Loading animations */
.skeleton {
  background: linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Particle effects */
.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(59, 130, 246, 0.5);
  border-radius: 50%;
  animation: particle-float 20s infinite linear;
}

@keyframes particle-float {
  from {
    transform: translateY(100vh) translateX(0);
  }
  to {
    transform: translateY(-10vh) translateX(100px);
  }
}
```

## API Integration Endpoints

```javascript
// src/services/landing.js
export const landingAPI = {
  // Check MCP connection status
  checkMCPStatus: async () => {
    const response = await fetch('/api/mcp/status');
    return response.json();
  },

  // Get AI capabilities
  getAICapabilities: async () => {
    const response = await fetch('/api/ai/capabilities');
    return response.json();
  },

  // Schedule demo
  scheduleDemo: async (data) => {
    const response = await fetch('/api/demo/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Get testimonials
  getTestimonials: async () => {
    const response = await fetch('/api/testimonials');
    return response.json();
  },

  // Get case studies
  getCaseStudies: async () => {
    const response = await fetch('/api/case-studies');
    return response.json();
  }
};
```

## Features Summary

1. **Hero Section**: Animated gradient text, floating metrics, particle effects
2. **MCP Status**: Real-time connection indicator
3. **AI Capabilities**: Dynamic loading of ML/AI features
4. **Interactive Features**: Click-through feature showcase
5. **Demo Video**: Embedded video player
6. **Authentication**: Clerk integration for sign in/up
7. **Responsive Design**: Mobile-first approach
8. **Animations**: Framer Motion for smooth transitions
9. **Glass Morphism**: Modern UI effects
10. **CTA Sections**: Multiple conversion points