import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  ChartBarIcon,
  CubeIcon,
  BanknotesIcon,
  DocumentArrowUpIcon,
  UsersIcon,
  PresentationChartLineIcon,
  TruckIcon,
  BeakerIcon,
  AdjustmentsHorizontalIcon as SlidersIcon
} from '@heroicons/react/24/outline'

const EnterpriseNavSidebar = () => {
  const location = useLocation()
  const { hasPermission } = useAuthRole()
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Navigation structure matching the PSD design
  const navigationSections = [
    {
      title: 'OVERVIEW',
      items: [
        {
          to: '/dashboard',
          icon: HomeIcon,
          label: 'Executive Dashboard',
          permission: 'dashboard.view'
        }
      ]
    },
    {
      title: 'PLANNING & ANALYTICS',
      items: [
        {
          to: '/forecasting',
          icon: PresentationChartLineIcon,
          label: 'Demand Forecasting',
          permission: 'forecast.view'
        },
        {
          to: '/inventory',
          icon: CubeIcon,
          label: 'Inventory Management',
          permission: 'stock.view'
        },
        {
          to: '/production',
          icon: TruckIcon,
          label: 'Production Tracking',
          permission: 'production.view'
        },
        {
          to: '/quality',
          icon: BeakerIcon,
          label: 'Quality Control',
          permission: 'quality.view'
        }
      ]
    },
    {
      title: 'FINANCIAL MANAGEMENT',
      items: [
        {
          to: '/working-capital',
          icon: BanknotesIcon,
          label: 'Working Capital',
          permission: 'workingcapital.view'
        },
        {
          to: '/what-if',
          icon: SlidersIcon,
          label: 'What-If Analysis',
          permission: 'analytics.view'
        },
        {
          to: '/analytics',
          icon: ChartBarIcon,
          label: 'Financial Reports',
          permission: 'reports.generate'
        }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        {
          to: '/data-import',
          icon: DocumentArrowUpIcon,
          label: 'Data Import',
          permission: 'import.view'
        },
        {
          to: '/admin',
          icon: UsersIcon,
          label: 'Admin Panel',
          permission: 'users.manage'
        }
      ]
    }
  ]

  return (
    <div className="enterprise-sidebar">
      {/* Header */}
      <div className="enterprise-sidebar-header">
        <div className="flex items-center space-x-3">
          <div className="enterprise-logo">
            S
          </div>
          <div>
            <h1 className="enterprise-brand">Sentia Manufacturing</h1>
            <p className="enterprise-subtitle">Enterprise Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="enterprise-nav">
        {navigationSections.map((section) => {
          const visibleItems = section.items.filter(item => 
            !item.permission || hasPermission(item.permission)
          )
          
          if (visibleItems.length === 0) return null

          return (
            <div key={section.title} className="enterprise-nav-section">
              <h2 className="enterprise-section-title">{section.title}</h2>
              <div className="enterprise-nav-items">
                {visibleItems.map((item) => {
                  const active = isActive(item.to)
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`enterprise-nav-item ${active ? 'active' : ''}`}
                    >
                      <item.icon className="enterprise-nav-icon" />
                      <span className="enterprise-nav-label">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
    </div>
  )
}

export default EnterpriseNavSidebar