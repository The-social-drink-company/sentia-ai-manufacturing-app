import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import {
  LayoutDashboardIcon,
  TrendingUpIcon,
  Package2Icon,
  FactoryIcon,
  ShieldCheckIcon,
  DollarSignIcon,
  CalculatorIcon,
  FileTextIcon,
  DatabaseIcon,
  SettingsIcon
} from 'lucide-react'

// Navigation Configuration
const NAV_SECTIONS = [
  {
    title: 'OVERVIEW',
    items: [
      { 
        to: '/app/dashboard', 
        label: 'Executive Dashboard', 
        icon: LayoutDashboardIcon,
        number: 1
      }
    ]
  },
  {
    title: 'PLANNING & ANALYTICS',
    items: [
      { 
        to: '/app/demand-forecasting', 
        label: 'Demand Forecasting', 
        icon: TrendingUpIcon,
        number: 2
      },
      { 
        to: '/app/inventory-management', 
        label: 'Inventory Management', 
        icon: Package2Icon,
        number: 3
      },
      { 
        to: '/app/production-tracking', 
        label: 'Production Tracking', 
        icon: FactoryIcon,
        number: 4
      },
      { 
        to: '/app/quality-control', 
        label: 'Quality Control', 
        icon: ShieldCheckIcon,
        number: 5
      }
    ]
  },
  {
    title: 'FINANCIAL MANAGEMENT',
    items: [
      { 
        to: '/app/working-capital', 
        label: 'Working Capital', 
        icon: DollarSignIcon,
        number: 6
      },
      { 
        to: '/app/what-if-analysis', 
        label: 'What-If Analysis', 
        icon: CalculatorIcon,
        number: 7
      },
      { 
        to: '/app/financial-reports', 
        label: 'Financial Reports', 
        icon: FileTextIcon,
        number: 8
      }
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { 
        to: '/app/data-import', 
        label: 'Data Import', 
        icon: DatabaseIcon,
        number: 9
      },
      { 
        to: '/app/admin-panel', 
        label: 'Admin Panel', 
        icon: SettingsIcon,
        number: 10
      }
    ]
  }
]

const DashboardLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const handleNavigation = (path) => {
    console.log('Navigating to:', path)
    navigate(path)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800/90 backdrop-blur-sm border-r border-slate-700">
          {/* Logo */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h1 className="text-white font-semibold text-sm">Sentia</h1>
                <p className="text-slate-400 text-xs">Manufacturing</p>
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-2">Enterprise Dashboard</p>
          </div>

          {/* Navigation */}
          <div className="p-4 space-y-6 overflow-y-auto h-full">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.to)
                    
                    return (
                      <button
                        key={item.to}
                        onClick={() => handleNavigation(item.to)}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                          active
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                          active ? 'bg-blue-500' : 'bg-slate-600'
                        }`}>
                          {item.number}
                        </div>
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-slate-300 text-sm">All Systems Operational</span>
                </div>
                <div className="text-slate-500">•</div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-300 text-sm">Live Data Connected</span>
                </div>
                <div className="text-slate-500">•</div>
                <span className="text-slate-400 text-sm">Current: {location.pathname}</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-slate-400 text-sm">
                  {new Date().toLocaleDateString('en-GB', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
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

          {/* Page Content */}
          <div className="flex-1 overflow-auto">
            {children || <Outlet />}
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-600/25 flex items-center justify-center text-white transition-all duration-200 hover:scale-110">
          <span className="text-lg">🤖</span>
        </button>
      </div>
    </div>
  )
}

export default DashboardLayout
