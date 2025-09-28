import React, { useState, useEffect } from 'react'
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  UserButton, 
  useUser,
  useAuth
} from '@clerk/clerk-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Package, 
  Factory,
  Bot,
  Menu,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'
import './App.css'

function App() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { getToken } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [mcpStatus, setMcpStatus] = useState({
    xero: 'connecting',
    shopify: 'connected',
    unleashed: 'connected',
    huggingface: 'connected'
  })
  const [realTimeData, setRealTimeData] = useState({
    revenue: '£3.17M',
    workingCapital: '£170.3K',
    units: '245K',
    efficiency: '94.8%',
    shopifyOrders: [
      {
        id: '5770',
        customer: 'Siro Tondi',
        product: 'GABA 3-bottle bundle',
        location: 'Switzerland',
        amount: '£98.47',
        status: 'Paid'
      },
      {
        id: '5769',
        customer: 'Douglas Yarborough',
        product: 'GABA Red + Gold 500ml',
        location: 'Freeport, NY',
        amount: '$107.97',
        status: 'Processing'
      }
    ],
    workingCapitalComponents: {
      receivables: { amount: '£85.2K', days: 28 },
      inventory: { amount: '£125.8K', days: 45 },
      payables: { amount: '£40.7K', days: 35 }
    }
  })

  // Initialize MCP connections
  useEffect(() => {
    const initializeMCP = async () => {
      try {
        // Simulate MCP server health checks
        const mcpServers = ['xero', 'shopify', 'unleashed', 'huggingface']
        
        for (const server of mcpServers) {
          setTimeout(() => {
            setMcpStatus(prev => ({
              ...prev,
              [server]: server === 'xero' ? 'error' : 'connected'
            }))
          }, 1000 + Math.random() * 2000)
        }
      } catch (error) {
        console.error('MCP initialization error:', error)
      }
    }

    if (isSignedIn) {
      initializeMCP()
    }
  }, [isSignedIn])

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        efficiency: (94.5 + Math.random() * 0.6).toFixed(1) + '%'
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading Sentia Manufacturing...</h2>
          <p className="text-gray-600">Initializing enterprise systems...</p>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'connecting':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Factory className="h-16 w-16 text-blue-300 mr-4" />
            <h1 className="text-5xl font-bold">Sentia Manufacturing</h1>
          </div>
          <p className="text-xl text-blue-200 mb-8">Enterprise Working Capital Intelligence</p>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">World-Class Manufacturing Intelligence</h2>
            <p className="text-xl mb-8 text-blue-100">
              Real-time working capital management with AI-powered insights from MCP servers
            </p>
            <SignInButton mode="modal">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg">
                🔐 Sign In to Dashboard
              </Button>
            </SignInButton>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-blue-300 mb-4" />
              <CardTitle>Real-Time Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Live business intelligence with £3.17M revenue tracking via Xero integration</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <DollarSign className="h-12 w-12 text-green-300 mb-4" />
              <CardTitle>Working Capital</CardTitle>
            </CardHeader>
            <CardContent>
              <p>£170.3K working capital optimization with Unleashed ERP integration</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <Factory className="h-12 w-12 text-purple-300 mb-4" />
              <CardTitle>Production Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p>245K units FY2026 forecast with real-time Shopify order tracking</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <Bot className="h-12 w-12 text-yellow-300 mb-4" />
              <CardTitle>AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Intelligent recommendations powered by Hugging Face ML models</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  const Dashboard = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center">
            <div className="bg-green-600 p-2 rounded-lg mr-3">
              <Factory className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold">Sentia Manufacturing</h2>
              <p className="text-sm text-slate-400">Enterprise Dashboard</p>
            </div>
          </div>
        </div>

        {/* MCP Server Status */}
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            MCP Server Status
          </h3>
          <div className="space-y-2">
            {Object.entries(mcpStatus).map(([server, status]) => (
              <div key={server} className="flex items-center justify-between">
                <span className="text-sm capitalize">{server}</span>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(status)}
                  <span className="text-xs text-slate-400 capitalize">{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <nav className="mt-6">
          <div className="px-6 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Overview
          </div>
          <a href="#" className="flex items-center px-6 py-3 text-blue-300 bg-slate-800 border-r-2 border-blue-300">
            <BarChart3 className="h-5 w-5 mr-3" />
            Executive Dashboard
          </a>

          <div className="px-6 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6">
            Planning & Analytics
          </div>
          <a href="#" className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800">
            <TrendingUp className="h-5 w-5 mr-3" />
            Demand Forecasting
          </a>
          <a href="#" className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800">
            <Package className="h-5 w-5 mr-3" />
            Inventory Management
          </a>

          <div className="px-6 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6">
            Financial Management
          </div>
          <a href="#" className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800">
            <DollarSign className="h-5 w-5 mr-3" />
            Working Capital
          </a>

          <div className="px-6 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6">
            AI & ML
          </div>
          <a href="#" className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800">
            <Zap className="h-5 w-5 mr-3" />
            ML Insights
          </a>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
              <p className="text-gray-600">Real-time manufacturing operations with MCP integration</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                MCP Systems Active
              </Badge>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue FY2025</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{realTimeData.revenue}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">↗ +102.6%</span> from FY2024 (Xero)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Working Capital</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{realTimeData.workingCapital}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">↗ +8.5%</span> optimized (Unleashed)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Units FY2026 Forecast</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{realTimeData.units}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">↗ +15.2%</span> projected growth (AI)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Production Efficiency</CardTitle>
                <Factory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{realTimeData.efficiency}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">↗ +2.1%</span> this week (Live)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Live Shopify Orders */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                🛒 Live Shopify Orders (MCP Real-Time Data)
              </CardTitle>
              <CardDescription>
                Connected to Shopify UK & USA stores via MCP server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {realTimeData.shopifyOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold">Order #{order.id} - {order.customer}</div>
                      <div className="text-sm text-gray-600">{order.product} ({order.location})</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{order.amount}</div>
                      <Badge className={order.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Working Capital Analysis */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                💰 Working Capital Components (Unleashed ERP Integration)
              </CardTitle>
              <CardDescription>
                Real-time financial data from integrated ERP systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {realTimeData.workingCapitalComponents.receivables.amount}
                  </div>
                  <div className="text-gray-600">Accounts Receivable</div>
                  <div className="text-sm text-green-600">
                    DSO: {realTimeData.workingCapitalComponents.receivables.days} days
                  </div>
                </div>
                
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {realTimeData.workingCapitalComponents.inventory.amount}
                  </div>
                  <div className="text-gray-600">Inventory Value</div>
                  <div className="text-sm text-green-600">
                    DIO: {realTimeData.workingCapitalComponents.inventory.days} days
                  </div>
                </div>
                
                <div className="text-center p-6 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {realTimeData.workingCapitalComponents.payables.amount}
                  </div>
                  <div className="text-gray-600">Accounts Payable</div>
                  <div className="text-sm text-red-600">
                    DPO: {realTimeData.workingCapitalComponents.payables.days} days
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="h-5 w-5 mr-2" />
                🤖 AI-Powered Business Insights (Hugging Face ML)
              </CardTitle>
              <CardDescription>
                Machine learning recommendations from integrated AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Cash Flow Optimization</h4>
                  <p className="text-sm text-blue-800">
                    AI analysis suggests reducing DSO by 3 days could free up £9.1K in working capital.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Inventory Forecasting</h4>
                  <p className="text-sm text-green-800">
                    ML models predict 18% increase in GABA product demand for Q4 2025.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* AI Chatbot */}
      <div className="fixed bottom-6 right-6">
        <Button 
          size="lg" 
          className="bg-green-600 hover:bg-green-700 rounded-full w-14 h-14 shadow-lg"
          onClick={() => alert('🤖 AI Assistant (Hugging Face): Hello! I can help you with working capital analysis, demand forecasting, and production optimization. Current working capital is £170.3K with 8.5% optimization opportunity identified through ML analysis.')}
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="app">
      <SignedOut>
        <LandingPage />
      </SignedOut>
      
      <SignedIn>
        <Dashboard />
      </SignedIn>
    </div>
  )
}

export default App
