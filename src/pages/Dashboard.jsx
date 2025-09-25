import { useEffect, useMemo, useState } from 'react'
import { useSpring } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, AlertTriangle, RefreshCcw } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import useExecutiveDashboard, { parseNumericValue } from '../hooks/useExecutiveDashboard.js'
import { useAuth } from '../App.jsx'

const ACTION_BLUEPRINTS = [
  { id: 'run-forecast', title: 'Run Forecast', description: 'Generate demand forecast', action: '/forecasting' },
  { id: 'working-capital', title: 'Working Capital', description: 'Analyze cash flow', action: '/working-capital' },
  { id: 'what-if-analysis', title: 'What-If Analysis', description: 'Scenario modeling', action: '/what-if' }
]

const formatCompactCurrency = (value) => {
  if (!Number.isFinite(value)) {
    return null
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)
}

const formatStandardCurrency = (value) => {
  if (!Number.isFinite(value)) {
    return null
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 1
  }).format(value)
}

const formatInteger = (value) => {
  if (!Number.isFinite(value)) {
    return null
  }

  return new Intl.NumberFormat('en-GB').format(Math.round(value))
}

const formatPercent = (value, decimals = 1) => {
  if (!Number.isFinite(value)) {
    return null
  }

  const fixed = value.toFixed(decimals)
  return `${value >= 0 ? '+' : ''}${fixed}%`
}

const formatRating = (value) => {
  if (!Number.isFinite(value)) {
    return null
  }

  return `${value.toFixed(1)}/5`
}

const getInitials = (name) => {
  if (!name) {
    return 'SE'
  }

  const parts = String(name).trim().split(' ').filter(Boolean)
  if (!parts.length) {
    return 'SE'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase()
}

const AnimatedNumber = ({ value, formatter, fallback, precision = 1 }) => {
  const [displayValue, setDisplayValue] = useState(() => (Number.isFinite(value) ? value : 0))
  const spring = useSpring(Number.isFinite(value) ? value : 0, {
    stiffness: 120,
    damping: 24,
    mass: 0.8
  })

  useEffect(() => {
    if (Number.isFinite(value)) {
      spring.set(value)
    }
  }, [spring, value])

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(latest)
    })

    return () => unsubscribe()
  }, [spring])

  if (!Number.isFinite(value)) {
    return <span>{fallback ?? '--'}</span>
  }

  const formatted = formatter
    ? formatter(displayValue)
    : new Intl.NumberFormat('en-GB', { maximumFractionDigits: precision }).format(displayValue)

  return <span>{formatted}</span>
}

const TrendBadge = ({ value, raw }) => {
  if (!Number.isFinite(value)) {
    return <span className='text-xs text-slate-400'>{raw || '--'}</span>
  }

  const positive = value >= 0
  const formatted = formatPercent(value)
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  const className = positive
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      <Icon className='h-3.5 w-3.5' />
      {formatted}
    </span>
  )
}

const SkeletonBlock = ({ className }) => (
  <div className={`h-full animate-pulse rounded-2xl bg-slate-800/50 ${className}`} />
)

const buildWorkingCapitalSeries = (trend, fallbackSeries) => {
  const source = Array.isArray(trend) && trend.length ? trend : Array.isArray(fallbackSeries) ? fallbackSeries : []

  return source
    .map((point, index) => {
      if (point === null || point === undefined) {
        return null
      }

      if (typeof point === 'number') {
        return {
          name: `T${index + 1}`,
          current: point
        }
      }

      const currentCandidate = point.value ?? point.current ?? point.amount ?? point.actual ?? point.balance ?? point.metric
      const projectedCandidate = point.projection ?? point.projected ?? point.forecast ?? point.expected ?? point.target
      const current = parseNumericValue(currentCandidate)
      const projected = parseNumericValue(projectedCandidate)

      if (!Number.isFinite(current) && !Number.isFinite(projected)) {
        return null
      }

      const label = point.label || point.timestamp || point.time || point.date || `T${index + 1}`

      return {
        name: typeof label === 'string' ? label : `T${index + 1}`,
        current,
        projected
      }
    })
    .filter(Boolean)
}

const prepareQuickActions = (actionsFromApi = []) => {
  const actionMap = new Map(
    actionsFromApi.map((action) => [
      (action.title || action.id || '').toLowerCase(),
      action
    ])
  )

  return ACTION_BLUEPRINTS.map((blueprint) => {
    const matched = actionMap.get(blueprint.title.toLowerCase()) || actionMap.get(blueprint.id)

    return {
      ...blueprint,
      description: matched?.description || blueprint.description,
      action: matched?.action || blueprint.action || '#'
    }
  })
}

const DashboardPage = () => {
  const { user } = useAuth()
  const { data, isLoading, isFetching, isError, error, refetch } = useExecutiveDashboard()
  const [currentTime, setCurrentTime] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const displayTime = useMemo(
    () => currentTime.toLocaleTimeString('en-GB', { hour12: false }),
    [currentTime]
  )

  const initials = useMemo(
    () => getInitials(user?.displayName || user?.name || user?.email || 'Sentia Executive'),
    [user]
  )

  const kpis = data?.kpis ?? []
  const workingCapital = data?.workingCapital ?? {}
  const workingCapitalSeries = useMemo(
    () => buildWorkingCapitalSeries(workingCapital.trend, data?.realtimeSeries),
    [data?.realtimeSeries, workingCapital.trend]
  )

  const quickActions = useMemo(
    () => prepareQuickActions(data?.quickActions),
    [data?.quickActions]
  )

  const metricsCards = useMemo(() => {
    const metrics = data?.keyMetrics ?? {}
    return [
      {
        id: 'revenue-growth',
        label: 'Revenue Growth',
        value: Number.isFinite(metrics.revenueGrowth) ? metrics.revenueGrowth : null,
        raw: metrics.revenueGrowthRaw,
        formatter: (val) => formatPercent(val)
      },
      {
        id: 'order-fulfillment',
        label: 'Order Fulfillment',
        value: Number.isFinite(metrics.orderFulfillment) ? metrics.orderFulfillment : null,
        raw: metrics.orderFulfillmentRaw,
        formatter: (val) => formatPercent(val)
      },
      {
        id: 'customer-satisfaction',
        label: 'Customer Satisfaction',
        value: Number.isFinite(metrics.customerSatisfaction) ? metrics.customerSatisfaction : null,
        raw: metrics.customerSatisfactionRaw,
        formatter: (val) => formatRating(val)
      },
      {
        id: 'inventory-turnover',
        label: 'Inventory Turnover',
        value: Number.isFinite(metrics.inventoryTurnover) ? metrics.inventoryTurnover : null,
        raw: metrics.inventoryTurnoverRaw,
        formatter: (val) => `${val.toFixed(1)}x`
      }
    ]
  }, [data?.keyMetrics])

  return (
    <main className='min-h-screen bg-slate-950 text-slate-100'>
      <div className='mx-auto w-full max-w-7xl px-6 py-8'>
        <header className='flex flex-col gap-6 border-b border-slate-800 pb-6 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <h1 className='text-3xl font-semibold text-white'>Executive Dashboard</h1>
            <p className='mt-1 text-sm text-slate-400'>Real-time manufacturing operations overview</p>
          </div>

          <div className='flex flex-col gap-4 text-sm text-slate-300 sm:flex-row sm:items-center sm:gap-6'>
            <div className='flex items-center gap-2'>
              <span className='relative flex h-2.5 w-2.5'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 opacity-75' />
                <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400' />
              </span>
              <span className='text-xs uppercase tracking-wide text-emerald-300'>All Systems Operational</span>
            </div>

            <div className='text-right'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Current Time</p>
              <p className='font-mono text-xl font-semibold text-white'>{displayTime}</p>
            </div>

            <div className='flex items-center gap-3'>
              <div className='flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white'>
                {initials}
              </div>
              <div className='leading-tight'>
                <p className='text-sm font-semibold text-white'>{user?.displayName || user?.name || 'Sentia Executive'}</p>
                <p className='text-xs text-slate-400'>{user?.email || 'executive@sentia-demo.com'}</p>
              </div>
            </div>
          </div>
        </header>

        <div className='mt-6 flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2 text-xs text-slate-500'>
            <span className='font-medium'>Data refresh</span>
            <span>{isFetching ? 'Updating…' : '30s interval'}</span>
          </div>
          <button
            type='button'
            onClick={() => refetch()}
            className='inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white'
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh now
          </button>
        </div>

        {isError ? (
          <div className='mt-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200'>
            <div className='flex items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <AlertTriangle className='h-4 w-4' />
                <span>Unable to load executive metrics. {error?.message || 'Please try again shortly.'}</span>
              </div>
              <button
                type='button'
                onClick={() => refetch()}
                className='rounded-md border border-rose-400/60 px-3 py-1 text-xs font-semibold text-rose-100 hover:border-rose-200 hover:text-white'
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}

        <section className='mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
          {(isLoading ? Array.from({ length: 4 }) : kpis).map((kpi, index) => {
            if (isLoading) {
              return <SkeletonBlock key={`kpi-skeleton-${index}`} />
            }

            const isCurrency = kpi.id === 'total-revenue' || kpi.id === 'inventory-value'
            const formatter = isCurrency ? formatCompactCurrency : formatInteger
            const fallback = kpi.rawValue || '--'

            return (
              <article key={kpi.id} className='flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm transition-colors hover:border-slate-700'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='text-xs uppercase tracking-wide text-slate-500'>{kpi.title}</p>
                    <p className='mt-3 text-3xl font-semibold text-white'>
                      <AnimatedNumber value={kpi.value} formatter={formatter} fallback={fallback} precision={1} />
                    </p>
                  </div>
                  <TrendBadge value={kpi.trend} raw={kpi.rawTrend} />
                </div>
                <p className='mt-6 text-xs text-slate-400'>{kpi.description}</p>
              </article>
            )
          })}
        </section>

        <section className='mt-8 grid gap-6 lg:grid-cols-5'>
          {isLoading ? (
            <>
              <SkeletonBlock className='lg:col-span-2' />
              <SkeletonBlock className='lg:col-span-3' />
            </>
          ) : (
            <>
              <article className='flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm lg:col-span-2'>
                <header>
                  <p className='text-xs uppercase tracking-wide text-slate-500'>Working Capital</p>
                  <h2 className='mt-2 text-2xl font-semibold text-white'>Liquidity Snapshot</h2>
                </header>
                <dl className='mt-6 space-y-5 text-sm'>
                  <div className='flex items-center justify-between'>
                    <dt className='text-slate-400'>Current</dt>
                    <dd className='text-xl font-semibold text-white'>
                      <AnimatedNumber
                        value={workingCapital.current}
                        formatter={formatStandardCurrency}
                        fallback={workingCapital.rawCurrent || '--'}
                        precision={1}
                      />
                    </dd>
                  </div>
                  <div className='flex items-center justify-between'>
                    <dt className='text-slate-400'>30-Day Projection</dt>
                    <dd className='text-xl font-semibold text-white'>
                      <AnimatedNumber
                        value={workingCapital.projection}
                        formatter={formatStandardCurrency}
                        fallback={workingCapital.rawProjection || '--'}
                        precision={1}
                      />
                    </dd>
                  </div>
                  <div className='flex items-center justify-between'>
                    <dt className='text-slate-400'>Trend</dt>
                    <dd>
                      <TrendBadge value={workingCapital.change} raw={workingCapital.rawChange} />
                    </dd>
                  </div>
                </dl>
              </article>

              <article className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm lg:col-span-3'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-xs uppercase tracking-wide text-slate-500'>Working Capital Trend</p>
                    <h3 className='mt-1 text-lg font-semibold text-white'>Current vs Projection</h3>
                  </div>
                </div>
                <div className='mt-6 h-64'>
                  {workingCapitalSeries.length ? (
                    <ResponsiveContainer width='100%' height='100%'>
                      <AreaChart data={workingCapitalSeries} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id='currentFill' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='5%' stopColor='#34d399' stopOpacity={0.3} />
                            <stop offset='95%' stopColor='#34d399' stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id='projectionFill' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='5%' stopColor='#60a5fa' stopOpacity={0.25} />
                            <stop offset='95%' stopColor='#60a5fa' stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke='#1f2937' strokeDasharray='3 3' />
                        <XAxis dataKey='name' tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis
                          tickFormatter={(value) => formatCompactCurrency(value) || '--'}
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          width={70}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ stroke: '#334155', strokeWidth: 1 }}
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                          formatter={(value, key) => [formatStandardCurrency(value) || value, key === 'current' ? 'Current' : 'Projected']}
                        />
                        <Area type='monotone' dataKey='current' stroke='#34d399' strokeWidth={2.5} fill='url(#currentFill)' />
                        <Area type='monotone' dataKey='projected' stroke='#60a5fa' strokeWidth={2} strokeDasharray='6 4' fill='url(#projectionFill)' />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className='flex h-full items-center justify-center text-sm text-slate-500'>
                      Awaiting working capital history from telemetry…
                    </div>
                  )}
                </div>
              </article>
            </>
          )}
        </section>

        <section className='mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm'>
          <div className='flex items-center justify-between'>
            <h2 className='text-base font-semibold text-white'>Key Performance Metrics</h2>
          </div>
          <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {(isLoading ? Array.from({ length: 4 }) : metricsCards).map((metric, index) => {
              if (isLoading) {
                return <SkeletonBlock key={`metric-skeleton-${index}`} className='h-28 rounded-xl' />
              }

              const formatted = metric.value !== null ? metric.formatter(metric.value) : null

              return (
                <div key={metric.id} className='rounded-xl border border-slate-800/80 bg-slate-900/70 p-4'>
                  <p className='text-xs uppercase tracking-wide text-slate-500'>{metric.label}</p>
                  <p className='mt-3 text-2xl font-semibold text-white'>
                    {formatted || metric.raw || '--'}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        <section className='mt-8'>
          <div className='flex items-center justify-between'>
            <h2 className='text-base font-semibold text-white'>Quick Actions</h2>
          </div>
          <div className='mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {(isLoading ? Array.from({ length: 3 }) : quickActions).map((action, index) => {
              if (isLoading) {
                return <SkeletonBlock key={`action-skeleton-${index}`} className='h-32 rounded-xl' />
              }

              return (
                <a
                  key={action.id}
                  href={action.action || '#'}
                  className='group flex h-full flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm transition-colors hover:border-slate-600'
                >
                  <div>
                    <p className='text-sm font-semibold text-white group-hover:text-emerald-300'>{action.title}</p>
                    <p className='mt-2 text-xs text-slate-400'>{action.description}</p>
                  </div>
                  <span className='mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 opacity-0 transition-opacity group-hover:opacity-100'>
                    Open workspace
                    <ArrowUpRight className='h-3.5 w-3.5' />
                  </span>
                </a>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

export default DashboardPage
