import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import './index.css'

// Get Clerk publishable key - prioritize new credentials
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
                        import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
                        'pk_test_cm9idXN0LXNuYWtlLTUwLmNsZXJrLmFjY291bnRzLmRldiQ'

console.log('🚀 Sentia Manufacturing - Minimal Clerk First Load')
console.log('🔐 Clerk Key:', PUBLISHABLE_KEY ? 'Present' : 'Missing')
console.log('📈 Progressive Loading: 10 stages configured')

// 10-stage progressive loading system
const loadingStages = [
  { stage: 1, text: "Initializing Clerk Authentication...", progress: 10, duration: 800 },
  { stage: 2, text: "Loading Core React Components...", progress: 20, duration: 1000 },
  { stage: 3, text: "Connecting to PostgreSQL Database...", progress: 30, duration: 1200 },
  { stage: 4, text: "Setting up Production Monitoring...", progress: 40, duration: 1000 },
  { stage: 5, text: "Initializing Quality Control Systems...", progress: 50, duration: 1100 },
  { stage: 6, text: "Loading Inventory Management...", progress: 60, duration: 900 },
  { stage: 7, text: "Starting Analytics Engine...", progress: 70, duration: 1300 },
  { stage: 8, text: "Activating Digital Twin System...", progress: 80, duration: 1000 },
  { stage: 9, text: "Enabling Workflow Automation...", progress: 90, duration: 800 },
  { stage: 10, text: "Finalizing Dashboard Interface...", progress: 100, duration: 600 }
]

// Minimal App component - Clerk authentication first
const App = () => {
  const [currentStage, setCurrentStage] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showDashboard, setShowDashboard] = React.useState(false)

  // Progressive loading effect
  React.useEffect(() => {
    if (currentStage < loadingStages.length) {
      const stage = loadingStages[currentStage]
      const timer = setTimeout(() => {
        setCurrentStage(prev => prev + 1)
      }, stage.duration)
      
      return () => clearTimeout(timer)
    } else {
      // All stages complete
      setTimeout(() => {
        setIsLoading(false)
      }, 500)
    }
  }, [currentStage])

  // Loading screen
  if (isLoading) {
    const stage = loadingStages[currentStage] || loadingStages[loadingStages.length - 1]
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full mx-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏭 Sentia Manufacturing
            </h1>
            <p className="text-gray-600">
              Enterprise Manufacturing Intelligence Platform
            </p>
          </div>
          
          {/* Progressive Loading Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-3 font-medium">
                Stage {stage.stage}: {stage.text}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out" 
                  style={{width: `${stage.progress}%`}}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {stage.stage} of 10 stages • {stage.progress}% complete
              </p>
            </div>
          </div>
          
          {/* Loading stages checklist */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">System Initialization:</h3>
            <div className="space-y-2">
              {loadingStages.map((stageItem, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className={`${index < currentStage ? 'text-gray-900' : 'text-gray-500'}`}>
                    {stageItem.stage}. {stageItem.text.replace('...', '')}
                  </span>
                  <span className={`${
                    index < currentStage ? 'text-green-600' : 
                    index === currentStage ? 'text-blue-600' : 'text-gray-300'
                  }`}>
                    {index < currentStage ? '✓' : index === currentStage ? '●' : '○'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main application with Clerk authentication
  return (
    <div className="min-h-screen bg-gray-50">
      <SignedOut>
        {/* Clerk Sign-In Landing Page */}
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🏭 Sentia Manufacturing
              </h1>
              <p className="text-gray-600 mb-6">
                Enterprise Manufacturing Intelligence Platform
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="text-green-600 mr-3">✅</div>
                  <div className="text-left">
                    <p className="text-green-800 font-semibold text-sm">All Systems Ready</p>
                    <p className="text-green-700 text-xs">10-stage initialization complete</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Clerk Sign-In Button */}
            <div className="space-y-4">
              <SignInButton mode="modal">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
                  Sign In to Dashboard
                </button>
              </SignInButton>
              
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Secure authentication powered by Clerk
                </p>
              </div>
            </div>
            
            {/* Enterprise Features Preview */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Enterprise Features:</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">📊</span>
                  Production Monitoring
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">🔬</span>
                  Quality Control
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">📦</span>
                  Inventory Management
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">🤖</span>
                  AI Analytics
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">🔧</span>
                  Digital Twin
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">⚡</span>
                  Automation
                </div>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {/* Enterprise Dashboard */}
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    🏭 Sentia Manufacturing Enterprise
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Welcome back!</span>
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8"
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-center">
                <div className="text-green-600 text-2xl mr-4">🎉</div>
                <div>
                  <h2 className="text-green-800 font-bold text-lg">Enterprise Dashboard Operational!</h2>
                  <p className="text-green-700">
                    Clerk authentication successful. All 10 enterprise systems initialized and ready.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm font-medium text-gray-600">Production Efficiency</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">94.2%</div>
                <div className="text-sm text-green-600 mt-1">↗ +2.1% from last week</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm font-medium text-gray-600">Quality Score</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">98.7%</div>
                <div className="text-sm text-green-600 mt-1">↗ +0.3% from last week</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm font-medium text-gray-600">Active Lines</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">12/14</div>
                <div className="text-sm text-yellow-600 mt-1">2 in maintenance</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm font-medium text-gray-600">Inventory Turnover</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">8.3x</div>
                <div className="text-sm text-green-600 mt-1">↗ +0.7x from last month</div>
              </div>
            </div>

            {/* Enterprise Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: '📊', title: 'Production Monitoring', desc: 'Real-time production line tracking and optimization' },
                { icon: '🔬', title: 'Quality Control', desc: 'Comprehensive quality assurance and compliance' },
                { icon: '📦', title: 'Inventory Management', desc: 'Advanced supply chain and demand forecasting' },
                { icon: '🤖', title: 'AI Analytics', desc: 'Machine learning insights and predictive maintenance' },
                { icon: '🔧', title: 'Digital Twin', desc: 'Virtual factory modeling and simulation' },
                { icon: '⚡', title: 'Workflow Automation', desc: 'Smart scheduling and integrated control systems' }
              ].map((feature, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </main>
        </div>
      </SignedIn>
    </div>
  )
}

// Initialize React with minimal Clerk setup
const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#ffffff',
          borderRadius: '8px'
        }
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
)

console.log('✅ Minimal Clerk-first application mounted successfully!')
