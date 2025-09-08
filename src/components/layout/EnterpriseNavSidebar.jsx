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
  
  // Mock permission check for now - all items visible
  const hasPermission = () => true
  
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
    <div className="enterprise-sidebar" style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '256px',
      height: '100vh',
      backgroundColor: '#111827',
      color: 'white',
      zIndex: 50,
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div className="enterprise-sidebar-header" style={{
        padding: '24px',
        borderBottom: '1px solid #374151'
      }}>
        <div className="flex items-center space-x-3">
          <div className="enterprise-logo" style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#2563eb',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>
            S
          </div>
          <div>
            <h1 className="enterprise-brand" style={{
              color: 'white',
              fontWeight: '600',
              fontSize: '16px',
              lineHeight: '1.25',
              margin: 0
            }}>Sentia Manufacturing</h1>
            <p className="enterprise-subtitle" style={{
              color: '#9CA3AF',
              fontSize: '14px',
              fontWeight: 'normal',
              margin: 0
            }}>Enterprise Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="enterprise-nav" style={{
        flex: 1,
        overflowY: 'auto',
        paddingTop: '16px',
        paddingBottom: '16px'
      }}>
        {navigationSections.map((section) => {
          const visibleItems = section.items.filter(item => 
            !item.permission || hasPermission(item.permission)
          )
          
          if (visibleItems.length === 0) return null

          return (
            <div key={section.title} className="enterprise-nav-section" style={{
              marginBottom: '32px'
            }}>
              <h2 className="enterprise-section-title" style={{
                paddingLeft: '24px',
                paddingRight: '24px',
                marginBottom: '12px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>{section.title}</h2>
              <div className="enterprise-nav-items">
                {visibleItems.map((item) => {
                  const active = isActive(item.to)
                  const IconComponent = item.icon
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`enterprise-nav-item ${active ? 'active' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '24px',
                        paddingRight: '24px',
                        paddingTop: '12px',
                        paddingBottom: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: active ? 'white' : '#D1D5DB',
                        backgroundColor: active ? '#2563eb' : 'transparent',
                        textDecoration: 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <IconComponent className="enterprise-nav-icon" style={{
                        width: '20px',
                        height: '20px',
                        marginRight: '12px',
                        flexShrink: 0,
                        color: 'currentColor'
                      }} />
                      <span className="enterprise-nav-label" style={{
                        flex: 1,
                        color: 'currentColor'
                      }}>{item.label}</span>
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