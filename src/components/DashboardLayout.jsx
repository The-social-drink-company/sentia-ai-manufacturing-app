import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  BarChart3,
  TrendingUp,
  Package,
  Factory,
  Shield,
  Calculator,
  FileText,
  BarChart2,
  Upload,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  MessageCircle,
  ChevronRight,
  Activity
} from 'lucide-react'

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  // Authentication removed
  const user = { name: "User" };
  const isSignedIn = true;
  const isLoaded = true;

  const navigationSections = [
    {
      title: "OVERVIEW",
      items: [
        {
          icon: BarChart3,
          label: "Executive Dashboard",
          path: "/app/dashboard",
          badge: null
        }
      ]
    },
    {
      title: "PLANNING & ANALYTICS",
      items: [
        {
          icon: TrendingUp,
          label: "Demand Forecasting",
          path: "/app/demand-forecasting",
          badge: null
        },
        {
          icon: Package,
          label: "Inventory Management",
          path: "/app/inventory-management",
          badge: "Live"
        },
        {
          icon: Factory,
          label: "Production Tracking",
          path: "/app/production-tracking",
          badge: null
        },
        {
          icon: Shield,
          label: "Quality Control",
          path: "/app/quality-control",
          badge: null
        }
      ]
    },
    {
      title: "FINANCIAL MANAGEMENT",
      items: [
        {
          icon: Calculator,
          label: "Working Capital",
          path: "/app/working-capital",
          badge: "New"
        },
        {
          icon: FileText,
          label: "What-If Analysis",
          path: "/app/what-if-analysis",
          badge: null
        },
        {
          icon: BarChart2,
          label: "Financial Reports",
          path: "/app/financial-reports",
          badge: null
        }
      ]
    },
    {
      title: "OPERATIONS",
      items: [
        {
          icon: Upload,
          label: "Data Import",
          path: "/app/data-import",
          badge: null
        },
        {
          icon: Settings,
          label: "Admin Panel",
          path: "/app/admin-panel",
          badge: null
        }
      ]
    }
  ]

  const isActivePath = (path) => {
    return location.pathname === path
  }

  const handleNavigation = (path) => {
    navigate(path)
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-80 bg-slate-900 text-white flex flex-col shadow-2xl"
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">S</span>
                  </div>
                  <div>
                    <h1 className="text-white font-bold text-lg">Sentia</h1>
                    <h2 className="text-white font-semibold">Manufacturing</h2>
                    <p className="text-slate-400 text-sm">Enterprise Dashboard</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400">All Systems Operational</span>
                </div>
                <span className="text-slate-500">18:24:24</span>
              </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-4 py-6">
              <nav className="space-y-6">
                {navigationSections.map((section, sectionIndex) => (
                  <div key={section.title}>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item, itemIndex) => (
                        <motion.button
                          key={item.path}
                          onClick={() => handleNavigation(item.path)}
                          className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-all duration-200 group ${
                            isActivePath(item.path)
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon className={`h-5 w-5 ${
                              isActivePath(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-white'
                            }`} />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.badge && (
                              <Badge 
                                variant={item.badge === 'Live' ? 'destructive' : 'secondary'}
                                className="text-xs px-2 py-0.5"
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {isActivePath(item.path) && (
                              <ChevronRight className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    {sectionIndex < navigationSections.length - 1 && (
                      <Separator className="mt-6 bg-slate-700" />
                    )}
                  </div>
                ))}
              </nav>
            </ScrollArea>

            {/* User Profile Section */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center space-x-3">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.fullName || "user@example.com"es?.[0]?.emailAddress}
                  </p>
                  <p className="text-xs text-slate-400">Enterprise User</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="text-slate-600 dark:text-slate-400"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              
              <div className="flex items-center space-x-2">
                <span className="text-slate-600 dark:text-slate-400">Dashboard</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">Manufacturing Intelligence</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="pl-10 pr-4 py-2 w-64 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
              </Button>

              {/* Activity Status */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* AI Chat Assistant - Bottom Right */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-20 right-6 w-80 h-96 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 z-50"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">AI Assistant</h3>
                  <p className="text-xs text-slate-500">Financial Intelligence</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 h-64 overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Hello! I'm your AI financial assistant. I can help you with working capital analysis, 
                    cash flow projections, and industry benchmarking. What would you like to explore?
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <input
                type="text"
                placeholder="Ask about your financial metrics..."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-700"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    </div>
  )
}

export default DashboardLayout
