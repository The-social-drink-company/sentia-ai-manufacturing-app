import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
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
  return `${percentage.toFixed(0)}%`
}

const formatMemory = (bytes) => {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) {
    return null
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function LandingPage() {
  const navigate = useNavigate()

  const { isAuthenticated } = useAuth()

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

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
    retry: 1,
    enabled: isAuthenticated
  })

  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => fetchApi('/api/dashboard/overview'),
    refetchInterval: 60_000,
    retry: 1,
    enabled: isAuthenticated
  })

  const { data: workingCapital } = useQuery({
    queryKey: ['working-capital-overview'],
    queryFn: () => fetchApi('/api/working-capital/overview'),
    refetchInterval: 120_000,
    retry: 1,
    enabled: isAuthenticated
  })

  const { data: productionMetrics } = useQuery({
    queryKey: ['production-metrics'],
    queryFn: () => fetchApi('/api/production/metrics'),
    refetchInterval: 60_000,
    retry: 1,
    enabled: isAuthenticated
  })

  const { data: productionJobs } = useQuery({
    queryKey: ['production-jobs'],
    queryFn: () => fetchApi('/api/production/jobs'),
    refetchInterval: 120_000,
    retry: 1,
    enabled: isAuthenticated
  })

  const { data: inventoryLevels = [] } = useQuery({
    queryKey: ['inventory-levels'],
    queryFn: () => fetchApi('/api/inventory/levels'),
    select: (data) => (Array.isArray(data?.levels) ? data.levels : data?.levels ? [data.levels] : []),
    refetchInterval: 120_000,
    retry: 1,
    enabled: isAuthenticated
  })

  const { data: forecast } = useQuery({
    queryKey: ['analytics-forecast'],
    queryFn: () => fetchApi('/api/analytics/forecast'),
    select: (data) => data?.forecast ?? data,
    refetchInterval: 180_000,
    retry: 1,
    enabled: isAuthenticated
  })

  const { data: reports = [] } = useQuery({
    queryKey: ['analytics-reports'],
    queryFn: () => fetchApi('/api/analytics/reports'),
    select: (data) => (Array.isArray(data?.reports) ? data.reports : []),
    refetchInterval: 300_000,
    retry: 1,
    enabled: isAuthenticated
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
        helper: typeof alertCount === 'number' ? `${alertCount} active alert${alertCount === 1 ? '' : 's'}` : null,
        icon: ChartBarIcon
      },
      {
        id: 'working-capital',
        label: 'Working Capital Liquidity',
        value: typeof workingCapitalScore === 'number' ? workingCapitalScore : null,
        helper: typeof runwayDays === 'number' ? `${runwayDays} day runway` : null,
        icon: CurrencyPoundIcon
      },
      {
        id: 'production-throughput',
        label: 'Throughput',
        value:
          typeof productionMetrics?.throughput === 'number'
            ? `${productionMetrics.throughput}%`
            : null,
        helper:
          typeof productionMetrics?.downtimeMinutes === 'number'
            ? `${productionMetrics.downtimeMinutes} min downtime`
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
        helper: Array.isArray(productionJobs?.jobs) && productionJobs.jobs[0]?.status ? `Latest status: ${productionJobs.jobs[0].status}` : null,
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
    <div className='min-h-screen bg-slate-950 text-slate-50'>
      <div className='mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-12 lg:px-10'>
        <motion.section
          className='grid gap-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-900/90 to-slate-950 p-10 shadow-2xl backdrop-blur'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
            <div className='max-w-2xl space-y-5'>
              <span className='inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-400'>
                <ShieldCheckIcon className='h-4 w-4 text-blue-400' aria-hidden='true' />
                Sentia Manufacturing Platform
              </span>
              <h1 className='text-4xl font-semibold tracking-tight text-white sm:text-5xl'>{heroHeading}</h1>
              <p className='text-base text-slate-300'>{heroDescription}</p>
              <div className='flex flex-wrap gap-3'>
                <Link
                  to='/login'
                  className='inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500'
                >
                  Access Console
                  <ArrowRightIcon className='h-4 w-4' aria-hidden='true' />
                </Link>
                <Link
                  to='/signup'
                  className='inline-flex items-center gap-2 rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400'
                >
                  Request Access
                </Link>
              </div>
            </div>
            <div className='w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/60 p-6'>
              <div className='flex items-center justify-between text-sm text-slate-300'>
                <span className='inline-flex items-center gap-2 font-medium'>
                  <ClockIcon className='h-5 w-5 text-blue-300' aria-hidden='true' />
                  Live Clock
                </span>
                <span className='font-mono text-lg text-white'>{currentTime.toLocaleTimeString('en-GB')}</span>
              </div>
              <div className='mt-4 space-y-3 text-sm'>
                <div className='flex items-center justify-between'>
                  <span className='inline-flex items-center gap-2 text-slate-400'>
                    <ServerIcon className='h-5 w-5 text-emerald-300' aria-hidden='true' />
                    Environment
                  </span>
                  <span className='font-medium text-white'>
                    {systemStatusLoading ? 'Loadingï¿½' : systemStatus?.environment || 'Unavailable'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='inline-flex items-center gap-2 text-slate-400'>
                    <ShieldCheckIcon className='h-5 w-5 text-emerald-300' aria-hidden='true' />
                    Database
                  </span>
                  <span className='font-medium text-white'>
                    {systemStatusLoading
                      ? 'Loadingï¿½'
                      : systemStatus?.database?.status || 'Unavailable'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='inline-flex items-center gap-2 text-slate-400'>
                    <PhoneIcon className='h-5 w-5 text-emerald-300' aria-hidden='true' />
                    Active Alerts
                  </span>
                  <span className='font-medium text-white'>
                    {typeof alertCount === 'number' ? alertCount : 'None reported'}
                  </span>
                </div>
              </div>
              {systemStatusError ? (
                <p className='mt-4 text-xs text-rose-400'>
                  Unable to fetch system status: {systemStatusErrorDetail?.message || 'Check API availability.'}
                </p>
              ) : null}
            </div>
          </div>
        </motion.section>

        <motion.section
          className='mt-12 grid gap-6 lg:grid-cols-3'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.id} className='rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm transition hover:border-slate-700'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-slate-300'>{card.label}</span>
                  <Icon className='h-5 w-5 text-blue-300' aria-hidden='true' />
                </div>
                <p className='mt-4 text-3xl font-semibold text-white'>
                  {card.value ?? 'Not available'}
                </p>
                {card.helper ? (
                  <p className='mt-2 text-xs text-slate-400'>{card.helper}</p>
                ) : null}
              </div>
            )
          })}
        </motion.section>

        <motion.section
          className='mt-12 grid gap-6 lg:grid-cols-5'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className='lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-6'>
            <h2 className='text-lg font-semibold text-white'>System Services</h2>
            <p className='mt-1 text-sm text-slate-400'>Monitored directly from runtime health endpoints.</p>
            <div className='mt-5 space-y-4 text-sm'>
              {systemIndicators.map((indicator) => {
                const Icon = indicator.icon
                return (
                  <div key={indicator.id} className='flex items-start justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/80 p-4'>
                    <div className='flex items-center gap-3'>
                      <Icon className='h-5 w-5 text-emerald-300' aria-hidden='true' />
                      <div>
                        <p className='font-medium text-slate-200'>{indicator.label}</p>
                        {indicator.meta ? (
                          <p className='text-xs text-slate-400'>{indicator.meta}</p>
                        ) : null}
                      </div>
                    </div>
                    <span className='font-semibold text-slate-100'>
                      {indicator.value || 'Not reported'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className='lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-6'>
            <h2 className='text-lg font-semibold text-white'>Operational Streams</h2>
            <p className='mt-1 text-sm text-slate-400'>Data is refreshed directly from live manufacturing services.</p>
            <div className='mt-5 grid gap-4 md:grid-cols-2'>
              <div className='rounded-xl border border-slate-800/80 bg-slate-900/80 p-4'>
                <div className='flex items-center justify-between text-sm text-slate-300'>
                  <span className='inline-flex items-center gap-2 font-medium'>
                    <CubeIcon className='h-5 w-5 text-blue-300' aria-hidden='true' />
                    Inventory Detail
                  </span>
                  <span className='text-xs text-slate-500'>Auto-refresh 2 min</span>
                </div>
                <div className='mt-3 space-y-2 text-sm'>
                  {inventoryLevels.length === 0 ? (
                    <p className='text-slate-400'>No inventory records returned.</p>
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

              <div className='rounded-xl border border-slate-800/80 bg-slate-900/80 p-4'>
                <div className='flex items-center justify-between text-sm text-slate-300'>
                  <span className='inline-flex items-center gap-2 font-medium'>
                    <DocumentTextIcon className='h-5 w-5 text-blue-300' aria-hidden='true' />
                    Analytics Reports
                  </span>
                  <span className='text-xs text-slate-500'>Auto-refresh 5 min</span>
                </div>
                <div className='mt-3 space-y-3 text-sm'>
                  {reportEntries.length === 0 ? (
                    <p className='text-slate-400'>No reports generated yet.</p>
                  ) : (
                    reportEntries.map((report) => (
                      <div key={report.id} className='flex items-center justify-between rounded-lg border border-slate-800/80 px-3 py-2'>
                        <span className='font-medium text-slate-200'>Report {report.id}</span>
                        <span className='text-xs text-slate-400'>
                          {report.generatedAt
                            ? new Date(report.generatedAt).toLocaleString('en-GB')
                            : 'Timestamp unavailable'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className='rounded-xl border border-slate-800/80 bg-slate-900/80 p-4 md:col-span-2'>
                <div className='flex items-center justify-between text-sm text-slate-300'>
                  <span className='inline-flex items-center gap-2 font-medium'>
                    <CheckCircleIcon className='h-5 w-5 text-blue-300' aria-hidden='true' />
                    Forecast Confidence
                  </span>
                  <span className='text-xs text-slate-500'>Auto-refresh 3 min</span>
                </div>
                <div className='mt-3 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-800/80 px-4 py-3'>
                  <div>
                    <p className='text-xs uppercase tracking-wider text-slate-500'>Demand</p>
                    <p className='text-2xl font-semibold text-white'>
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
                    <p className='text-2xl font-semibold text-white'>
                      {typeof productionMetrics?.throughput === 'number' ? `${productionMetrics.throughput}%` : 'Not available'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-wider text-slate-500'>Downtime</p>
                    <p className='text-2xl font-semibold text-white'>
                      {typeof productionMetrics?.downtimeMinutes === 'number' ? `${productionMetrics.downtimeMinutes} min` : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}





