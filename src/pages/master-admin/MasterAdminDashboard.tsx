/**
 * Master Admin Dashboard
 *
 * Comprehensive admin dashboard for SaaS owner to manage all tenants,
 * monitor system health, and track business metrics.
 *
 * @module src/pages/master-admin/MasterAdminDashboard
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Activity,
  Database,
  Clock,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Trash2
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface Metrics {
  tenants: {
    total: number
    active: number
    trial: number
    suspended: number
    newThisMonth: number
    churnedThisMonth: number
  }
  users: {
    total: number
  }
  revenue: {
    mrr: number
    arr: number
    currency: string
  }
  churnRate: number
}

interface Tenant {
  id: string
  name: string
  slug: string
  subscriptionTier: string
  subscriptionStatus: string
  createdAt: string
  _count: {
    users: number
  }
}

const MasterAdminDashboard = () => {
  const { getToken } = useAuth()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchMetrics(), fetchTenants()])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const token = await getToken()
      const response = await fetch('/api/master-admin/metrics/overview', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setMetrics(data.data)
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  const fetchTenants = async () => {
    try {
      const token = await getToken()
      const params = new URLSearchParams({
        limit: '10',
        ...(filterStatus !== 'all' && { status: filterStatus })
      })
      const response = await fetch(`/api/master-admin/tenants?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setTenants(data.data)
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
    }
  }

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading master admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Master Admin Dashboard</h1>
              <p className="text-red-100 mt-1">CapLiquify Platform Management</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                <Activity className="w-5 h-5" />
                <span className="text-sm font-semibold">System Healthy</span>
              </div>
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<Building2 className="w-6 h-6" />}
            title="Total Tenants"
            value={metrics?.tenants.total || 0}
            change={`+${metrics?.tenants.newThisMonth || 0} this month`}
            changeType="positive"
            bgColor="bg-blue-500"
          />

          <MetricCard
            icon={<Users className="w-6 h-6" />}
            title="Active Tenants"
            value={metrics?.tenants.active || 0}
            subtitle={`${metrics?.tenants.trial || 0} in trial`}
            bgColor="bg-green-500"
          />

          <MetricCard
            icon={<DollarSign className="w-6 h-6" />}
            title="MRR"
            value={`$${(metrics?.revenue.mrr || 0).toLocaleString()}`}
            change={`$${(metrics?.revenue.arr || 0).toLocaleString()} ARR`}
            changeType="neutral"
            bgColor="bg-purple-500"
          />

          <MetricCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Churn Rate"
            value={`${(metrics?.churnRate || 0).toFixed(1)}%`}
            change={`${metrics?.tenants.churnedThisMonth || 0} churned this month`}
            changeType={metrics && metrics.churnRate > 5 ? 'negative' : 'positive'}
            bgColor="bg-orange-500"
          />
        </div>

        {/* Tenants Table */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Tenants</h2>
              <div className="flex gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <Building2 className="w-4 h-4" />
                  Create Tenant
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tenants by name or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTenants.length > 0 ? (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{tenant.name}</div>
                          <div className="text-sm text-gray-500">{tenant.slug}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <TierBadge tier={tenant.subscriptionTier} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={tenant.subscriptionStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Users className="w-4 h-4 text-gray-400" />
                          {tenant._count.users}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No tenants found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600 text-center">
              Showing {filteredTenants.length} of {tenants.length} tenants
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== METRIC CARD COMPONENT ====================

interface MetricCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle?: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  bgColor: string
}

const MetricCard = ({
  icon,
  title,
  value,
  subtitle,
  change,
  changeType,
  bgColor
}: MetricCardProps) => {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`${bgColor} text-white p-3 rounded-lg`}>{icon}</div>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-2">{value}</div>
      {subtitle && <div className="text-sm text-gray-600 mb-1">{subtitle}</div>}
      {change && (
        <div className={`text-sm font-medium ${changeColors[changeType || 'neutral']}`}>
          {change}
        </div>
      )}
    </div>
  )
}

// ==================== STATUS BADGE COMPONENT ====================

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
    trial: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Trial' },
    suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspended' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' }
  }

  const config = statusConfig[status] || statusConfig.active

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  )
}

// ==================== TIER BADGE COMPONENT ====================

const TierBadge = ({ tier }: { tier: string }) => {
  const tierConfig: Record<string, { bg: string; text: string; label: string }> = {
    starter: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Starter' },
    professional: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Professional' },
    enterprise: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Enterprise' }
  }

  const config = tierConfig[tier] || tierConfig.professional

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  )
}

export default MasterAdminDashboard
