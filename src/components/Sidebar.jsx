import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  ClipboardCheck, 
  Shield, 
  DollarSign, 
  FileText, 
  BarChart, 
  Upload, 
  Settings,
  Home
} from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection }) => {
  const menuSections = [
    {
      title: "OVERVIEW",
      items: [
        { id: "executive-dashboard", label: "Executive Dashboard", icon: BarChart3, active: true }
      ]
    },
    {
      title: "PLANNING & ANALYTICS", 
      items: [
        { id: "demand-forecasting", label: "Demand Forecasting", icon: TrendingUp },
        { id: "inventory-management", label: "Inventory Management", icon: Package },
        { id: "production-tracking", label: "Production Tracking", icon: ClipboardCheck },
        { id: "quality-control", label: "Quality Control", icon: Shield }
      ]
    },
    {
      title: "FINANCIAL MANAGEMENT",
      items: [
        { id: "working-capital", label: "Working Capital", icon: DollarSign },
        { id: "what-if-analysis", label: "What-If Analysis", icon: BarChart },
        { id: "financial-reports", label: "Financial Reports", icon: FileText }
      ]
    },
    {
      title: "OPERATIONS",
      items: [
        { id: "data-import", label: "Data Import", icon: Upload },
        { id: "admin-panel", label: "Admin Panel", icon: Settings }
      ]
    }
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="font-semibold text-lg">Sentia</h1>
            <h2 className="font-semibold">Manufacturing</h2>
            <p className="text-slate-400 text-xs">Enterprise Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {menuSections.map((section, _sectionIndex) => (
          <div key={sectionIndex} className="py-4">
            <h3 className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <nav className="space-y-1">
              _{section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-6 py-2.5 text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white border-r-2 border-blue-400' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>All Systems Operational</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">18:24:24</div>
      </div>
    </div>
  );
};

export default Sidebar;
