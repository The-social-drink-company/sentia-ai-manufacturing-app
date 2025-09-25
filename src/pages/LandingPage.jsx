import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  ChartBarIcon,
  CurrencyPoundIcon,
  CubeIcon,
  ChartPieIcon,
  ClockIcon,
  ShieldCheckIcon,
  ServerIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PhoneIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

const extractData = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload
  }

  if (payload.data) {
    return payload.data
  }

  if (payload.result) {
    return payload.result
  }

  if (payload.payload) {
    return payload.payload
  }

  return payload
}

const fetchApi = async (url) => {
  const response = await axios.get(url)
  return extractData(response.data)
}

const formatNumber = (value, options = {}) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }

  return new Intl.NumberFormat('en-GB', options).format(value)
}

const formatConfidence = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }

  const percentage = value <= 1 ? value * 100 : value
  return ${percentage.toFixed(0)}%
}

const formatMemory = (bytes) => {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) {
    return null
  }

  return ${(bytes / 1024 / 1024).toFixed(1)} MB
}

const formatPercentage = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }

  return ${value.toFixed(1)}%
}

const capabilities = [
  {
    icon: ChartBarIcon,
    title: 'Executive Dashboard',
    description: 'Real-time KPIs and operational metrics'
  },
  {
    icon: CurrencyPoundIcon,
    title: 'Working Capital Management',
    description: 'Cash flow optimization and forecasting'
  },
  {
    icon: CubeIcon,
    title: 'Inventory Control',
    description: 'Multi-warehouse inventory tracking'
  },
  {
    icon: ChartPieIcon,
    title: 'AI-Powered Analytics',
    description: 'Predictive insights and recommendations'
  }
]

const quickLinks = [
  { name: 'User Guide', href: '/docs/user-guide', icon: DocumentTextIcon },
  { name: 'API Documentation', href: '/docs/api', icon: ServerIcon },
  { name: 'Team Directory', href: '/team', icon: UserGroupIcon },
  { name: 'Support', href: '/support', icon: PhoneIcon }
]

const StatusIndicator = ({ status }) => {
  const colors = {
    healthy: 'bg-green-500',
    online: 'bg-green-500',
    checking: 'bg-yellow-500 animate-pulse',
    offline: 'bg-gray-400',
    error: 'bg-red-500'
  }

  return <div className={h-2 w-2 rounded-full } />
}

export default function LandingPage() {
  const navigate = useNavigate()

  // Try to use Clerk auth if available, otherwise assume not signed in
  let isSignedIn = false
  try {
    const clerkAuth = useClerkAuth()
    isSignedIn = clerkAuth.isSignedIn || false
  } catch (error) {
    // Clerk provider not available, continue without auth
    console.log('Clerk auth not available, continuing in demo mode')
  }

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard')
    }
  }, [isSignedIn, navigate])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const {
    data: systemStatus,
    isLoading: systemStatusLoading,
    isError: systemStatusError,
    error: systemStatusErrorDetail
  } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => fetchApi('/api/status'),
    refetchInterval: 60_000,
    retry: 1
  })

  const {
    data: overview,
    status: overviewStatus,
    isError: overviewError
  } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => fetchApi('/api/dashboard/overview'),
    refetchInterval: 60_000,
    retry: 1
  })

  const { data: workingCapital } = useQuery({
    queryKey: ['working-capital-overview'],
    queryFn: () => fetchApi('/api/working-capital/overview'),
    refetchInterval: 120_000,
    retry: 1
  })

  const { data: productionMetrics } = useQuery({
    queryKey: ['production-metrics'],
    queryFn: () => fetchApi('/api/production/metrics'),
    refetchInterval: 60_000,
    retry: 1
  })

  const { data: productionJobs, status: productionJobsStatus } = useQuery({
    queryKey: ['production-jobs'],
    queryFn: () => fetchApi('/api/production/jobs'),
    refetchInterval: 120_000,
    retry: 1
  })

  const { data: inventoryLevels = [] } = useQuery({
    queryKey: ['inventory-levels'],
    queryFn: () => fetchApi('/api/inventory/levels'),
    select: (data) => (Array.isArray(data?.levels) ? data.levels : data?.levels ? [data.levels] : []),
    refetchInterval: 120_000,
    retry: 1
  })

  const {
    data: forecast,
    status: forecastStatus,
    isError: forecastError
  } = useQuery({
    queryKey: ['analytics-forecast'],
    queryFn: () => fetchApi('/api/analytics/forecast'),
    select: (data) => data?.forecast ?? data,
    refetchInterval: 180_000,
    retry: 1
  })

  const { data: reports = [] } = useQuery({
    queryKey: ['analytics-reports'],
    queryFn: () => fetchApi('/api/analytics/reports'),
    select: (data) => (Array.isArray(data?.reports) ? data.reports : []),
    refetchInterval: 300_000,
    retry: 1
  })

  const totalInventoryQuantity = useMemo(() => {
    return inventoryLevels.reduce((acc, level) => {
      if (typeof level?.quantity === 'number') {
        return acc + level.quantity
      }
      return acc
    }, 0)
  }, [inventoryLevels])

  const productionHealth = overview?.summary?.productionHealth
  const workingCapitalScore = workingCapital?.liquidityScore
  const runwayDays = workingCapital?.runwayDays
  const alertCount = overview?.summary?.alerts
  const forecastConfidence = formatConfidence(forecast?.confidence)

  const summaryCards = useMemo(
    () => [
      {
        id: 'production-health',
        label: 'Production Health',
        value: productionHealth || null,
        helper: typeof alertCount === 'number' ? ${alertCount} active alert : null,
        icon: ChartBarIcon
      },
      {
        id: 'working-capital',
        label: 'Working Capital Liquidity',
        value: typeof workingCapitalScore === 'number' ? formatPercentage(workingCapitalScore) : null,
        helper: typeof runwayDays === 'number' ? ${runwayDays} day runway : null,
        icon: CurrencyPoundIcon
      },
      {
        id: 'production-throughput',
        label: 'Throughput',
        value: throughputDisplay,
        helper:
          typeof productionMetrics?.downtimeMinutes === 'number'
            ? ${productionMetrics.downtimeMinutes} min downtime
            : null,
        icon: ChartPieIcon
      },
      {
        id: 'inventory-levels',
        label: 'Inventory Units On Hand',
        value: typeof totalInventoryQuantity === 'number' ? formatNumber(totalInventoryQuantity) : null,
        helper: `SKUs tracked: ${inventoryLevels.length}`,
        icon: CubeIcon
      },
      {
        id: 'demand-forecast',
        label: 'Demand Forecast',
        value:
          typeof forecast?.demand === 'number'
            ? formatNumber(forecast.demand)
            : null,
        helper: forecastConfidence ? `Confidence ${forecastConfidence}` : null,
        icon: ChartBarIcon
      },
      {
        id: 'production-jobs',
        label: 'Jobs In Flight',
        value: Array.isArray(productionJobs?.jobs) ? productionJobs.jobs.length : null,
        helper:
          Array.isArray(productionJobs?.jobs) && productionJobs.jobs[0]?.status
            ? Latest status: 
            : productionJobsStatus === 'pending'
              ? 'Loading jobs�'
              : null,
        icon: UserGroupIcon
      }
    ],
    [alertCount, forecast, forecastConfidence, inventoryLevels.length, productionHealth, productionJobs, productionMetrics, totalInventoryQuantity, workingCapitalScore, runwayDays]
  )

  const systemIndicators = useMemo(() => {
    const memory = systemStatus?.memory || {}
    return [
      {
        id: 'environment',
        label: 'Environment',
        value: systemStatus?.environment || null,
        icon: ServerIcon
      },
      {
        id: 'deployment',
        label: 'Deployment Target',
        value: systemStatus?.deployment || null,
        icon: ShieldCheckIcon
      },
      {
        id: 'database',
        label: 'Database Health',
        value: systemStatus?.database?.status || null,
        meta: systemStatus?.database?.message || null,
        icon: CheckCircleIcon
      },
      {
        id: 'node-version',
        label: 'Node Runtime',
        value: systemStatus?.node || null,
        icon: ServerIcon
      },
      {
        id: 'memory-rss',
        label: 'Process RSS',
        value: formatMemory(memory.rss) || null,
        icon: ShieldCheckIcon
      },
      {
        id: 'memory-heap',
        label: 'Heap Used',
        value: formatMemory(memory.heapUsed) || null,
        icon: ShieldCheckIcon
      },
      {
        id: 'timestamp',
        label: 'Last Update',
        value: systemStatus?.time ? new Date(systemStatus.time).toLocaleString('en-GB') : null,
        icon: ClockIcon
      }
    ]
  }, [systemStatus])

  const reportEntries = useMemo(() => {
    return reports.map((report, index) => ({
      id: report.id || report.slug || report.name || `report-${index}`,
      generatedAt: report.generatedAt || report.generated_at || report.createdAt || null
    }))
  }, [reports])

  const heroHeading = 'Operational Command Center'
  const heroDescription = 'Unified visibility across finance, production, and supply chain activities sourced directly from live services.'

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900'>
      <header className='border-b border-gray-200 bg-white shadow-sm'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600'>
              <span className='text-xl font-bold text-white'>S</span>
            </div>
            <div className='ml-3'>
              <h1 className='text-xl font-semibold text-gray-900'>Sentia Manufacturing</h1>
              <p className='text-xs text-gray-500'>Enterprise Operations Platform</p>
            </div>
          </div>
          <div className='flex items-center space-x-6 text-sm text-gray-600'>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center'>
                <StatusIndicator status={databaseStatus} />
                <span className='ml-2'>Database</span>
              </div>
              <div className='flex items-center'>
                <StatusIndicator status={apiStatus} />
                <span className='ml-2'>API</span>
              </div>
              <div className='flex items-center'>
                <StatusIndicator status={aiStatus} />
                <span className='ml-2'>AI</span>
              </div>
            </div>
            <div className='font-mono'>{currentTime.toLocaleTimeString('en-GB')}</div>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        <motion.section
          className='mb-12 rounded-3xl border border-slate-200 bg-white/70 p-10 text-center shadow-xl backdrop-blur'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className='text-4xl font-bold text-gray-900 sm:text-5xl'>{heroHeading}</h2>
          <p className='mt-4 text-xl text-gray-600'>{heroDescription}</p>
          <motion.div className='mt-8 inline-flex' whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to='/login'
              className='inline-flex items-center rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-blue-700'
            >
              Access Dashboard
              <ArrowRightIcon className='ml-2 h-5 w-5' />
            </Link>
          </motion.div>
        </motion.section>

        {systemStatusError ? (
          <div className='mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600'>
            Unable to fetch system status: {systemStatusErrorDetail?.message || 'Check API availability.'}
          </div>
        ) : null}

        <motion.section
          className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.id} className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-slate-500'>{card.label}</span>
                  <Icon className='h-5 w-5 text-blue-500' />
                </div>
                <p className='mt-4 text-3xl font-semibold text-slate-900'>
                  {card.value || 'Not available'}
                </p>
                {card.helper ? <p className='mt-2 text-xs text-slate-500'>{card.helper}</p> : null}
              </div>
            )
          })}
        </motion.section>

        <motion.section
          className='mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {capabilities.map((capability) => {
            const Icon = capability.icon
            return (
              <div key={capability.title} className='rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500'>
                  <Icon className='h-5 w-5' />
                </div>
                <h3 className='mt-4 text-lg font-semibold text-slate-900'>{capability.title}</h3>
                <p className='mt-2 text-sm text-slate-600'>{capability.description}</p>
              </div>
            )
          })}
        </motion.section>

        <motion.section
          className='mt-12 grid gap-6 lg:grid-cols-5'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className='lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6'>
            <h2 className='text-lg font-semibold text-slate-900'>System Services</h2>
            <p className='mt-1 text-sm text-slate-500'>Monitored directly from runtime health endpoints.</p>
            <div className='mt-5 space-y-4 text-sm'>
              {systemIndicators.map((indicator) => {
                const Icon = indicator.icon
                return (
                  <div key={indicator.id} className='flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4'>
                    <div className='flex items-center gap-3'>
                      <Icon className='h-5 w-5 text-emerald-500' />
                      <div>
                        <p className='font-medium text-slate-900'>{indicator.label}</p>
                        {indicator.meta ? <p className='text-xs text-slate-500'>{indicator.meta}</p> : null}
                      </div>
                    </div>
                    <span className='font-semibold text-slate-900'>
                      {indicator.value || 'Not reported'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className='lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6'>
            <h2 className='text-lg font-semibold text-slate-900'>Operational Streams</h2>
            <p className='mt-1 text-sm text-slate-500'>Data is refreshed directly from live manufacturing services.</p>
            <div className='mt-5 grid gap-4 md:grid-cols-2'>
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                <div className='flex items-center justify-between text-sm text-slate-500'>
                  <span className='inline-flex items-center gap-2 font-medium text-slate-700'>
                    <CubeIcon className='h-5 w-5 text-blue-500' />
                    Inventory Detail
                  </span>
                  <span className='text-xs'>Auto-refresh 2 min</span>
                </div>
                <div className='mt-3 space-y-2 text-sm'>
                  {inventoryLevels.length === 0 ? (
                    <p className='text-slate-500'>No inventory records returned.</p>
                  ) : (
                    inventoryLevels.map((level, index) => (
                      <div key={level.sku || level.id || `inventory-${index}`} className='flex items-center justify-between rounded-lg border border-slate-800/80 px-3 py-2'>
                        <span className='font-medium text-slate-200'>{level.sku || level.id || 'SKU'}</span>
                        <span className='font-semibold text-white'>
                          {typeof level.quantity === 'number' ? formatNumber(level.quantity) : 'N/A'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                <div className='flex items-center justify-between text-sm text-slate-500'>
                  <span className='inline-flex items-center gap-2 font-medium text-slate-700'>
                    <DocumentTextIcon className='h-5 w-5 text-blue-500' />
                    Analytics Reports
                  </span>
                  <span className='text-xs'>Auto-refresh 5 min</span>
                </div>
                <div className='mt-3 space-y-3 text-sm'>
                  {reportEntries.length === 0 ? (
                    <p className='text-slate-500'>No reports generated yet.</p>
                  ) : (
                    reportEntries.map((report) => (
                      <div key={report.id} className='flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2'>
                        <span className='font-medium text-slate-800'>Report {report.id}</span>
                        <span className='text-xs text-slate-500'>
                          {report.generatedAt
                            ? new Date(report.generatedAt).toLocaleString('en-GB')
                            : 'Timestamp unavailable'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2'>
                <div className='flex items-center justify-between text-sm text-slate-500'>
                  <span className='inline-flex items-center gap-2 font-medium text-slate-700'>
                    <CheckCircleIcon className='h-5 w-5 text-blue-500' />
                    Forecast Confidence
                  </span>
                  <span className='text-xs'>Auto-refresh 3 min</span>
                </div>
                <div className='mt-3 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3'>
                  <div>
                    <p className='text-xs uppercase tracking-wider text-slate-500'>Demand</p>
                    <p className='text-2xl font-semibold text-slate-900'>
                      {typeof forecast?.demand === 'number' ? formatNumber(forecast.demand) : 'Not available'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-wider text-slate-500'>Confidence</p>
                    <p className='text-2xl font-semibold text-white'>
                      {forecastConfidence || 'Not available'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-wider text-slate-500'>Throughput</p>
                    <p className='text-2xl font-semibold text-slate-900'>
                      {throughputDisplay || 'Not available'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-wider text-slate-500'>Downtime</p>
                    <p className='text-2xl font-semibold text-slate-900'>
                      {typeof productionMetrics?.downtimeMinutes === 'number' ? ${productionMetrics.downtimeMinutes} min : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          className='mt-12 rounded-2xl border border-slate-200 bg-white p-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className='text-lg font-semibold text-slate-900'>Quick Links</h2>
          <p className='mt-1 text-sm text-slate-500'>Resources for operational runbooks, support, and documentation.</p>
          <div className='mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className='flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-white'
                >
                  <Icon className='h-5 w-5 text-blue-500' />
                  <span>{link.name}</span>
                </Link>
              )
            })}
          </div>
        </motion.section>
      </main>
    </div>
  )
}

