import KPICard from './KPICard'

const DEFAULT_KPI_CARDS = [
  {
    metric: 'annualRevenue',
    icon: '💰',
    label: 'Annual Revenue',
    value: 10760000,
    valueFormat: 'currency',
    gradient: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500',
    trend: { value: 15.2, direction: 'up' },
  },
  {
    metric: 'unitsSold',
    icon: '📦',
    label: 'Units Sold',
    value: 350314,
    valueFormat: 'compact',
    gradient: 'bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500',
    trend: { value: 8.3, direction: 'up' },
  },
  {
    metric: 'grossMargin',
    icon: '📈',
    label: 'Gross Margin',
    value: 67.6,
    valueFormat: 'percentage',
    gradient: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    trend: { value: 2.1, direction: 'up' },
  },
  {
    metric: 'workingCapital',
    icon: '💼',
    label: 'Working Capital',
    value: 869000,
    valueFormat: 'currency',
    gradient: 'bg-gradient-to-br from-purple-600 to-violet-600',
    trend: null,
    customFooter: 'Status: Optimized',
  },
]

const createDefaultKpis = () =>
  DEFAULT_KPI_CARDS.map(kpi => ({
    ...kpi,
    trend: kpi.trend ? { ...kpi.trend } : null,
  }))

const normalizeMetricKey = metric => {
  if (!metric) {
    return ''
  }

  const cleaned = metric.toString().trim()
  if (!cleaned) {
    return ''
  }

  const camel = cleaned
    .replace(/[-_\s]+(.)/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/[^a-zA-Z0-9]/g, '')

  if (!camel) {
    return ''
  }

  return camel.charAt(0).toLowerCase() + camel.slice(1)
}

const normalizeKpiValue = (incomingValue, fallbackValue, fallbackFormat) => {
  if (incomingValue === undefined || incomingValue === null) {
    return { value: fallbackValue, valueFormat: fallbackFormat }
  }

  if (typeof incomingValue === 'number' && !Number.isNaN(incomingValue)) {
    return { value: incomingValue, valueFormat: fallbackFormat }
  }

  if (typeof incomingValue === 'string') {
    const trimmed = incomingValue.trim()
    if (!trimmed) {
      return { value: fallbackValue, valueFormat: fallbackFormat }
    }

    const millionMatch = trimmed.match(/([\d.,]+)\s*M/i)
    if (millionMatch) {
      const numeric = Number(millionMatch[1].replace(/,/g, ''))
      if (!Number.isNaN(numeric)) {
        return { value: numeric * 1_000_000, valueFormat: fallbackFormat }
      }
    }

    const thousandMatch = trimmed.match(/([\d.,]+)\s*K/i)
    if (thousandMatch) {
      const numeric = Number(thousandMatch[1].replace(/,/g, ''))
      if (!Number.isNaN(numeric)) {
        return { value: numeric * 1_000, valueFormat: fallbackFormat }
      }
    }

    const numeric = Number(trimmed.replace(/[^\d.-]/g, ''))
    if (!Number.isNaN(numeric)) {
      return { value: numeric, valueFormat: fallbackFormat }
    }

    return { value: trimmed, valueFormat: 'raw' }
  }

  return { value: fallbackValue, valueFormat: fallbackFormat }
}

const mergeKpisWithDefaults = kpis => {
  if (!Array.isArray(kpis) || kpis.length === 0) {
    return createDefaultKpis()
  }

  const isPreformatted = kpis.every(
    item => item && typeof item === 'object' && item.gradient && item.icon && item.value !== undefined
  )

  if (isPreformatted) {
    return kpis
  }

  const normalized = kpis.reduce((acc, item) => {
    const key = normalizeMetricKey(item.metric || item.label)
    if (key) {
      acc[key] = item
    }
    return acc
  }, {})

  const hasOverlap = DEFAULT_KPI_CARDS.some(kpi => normalized[kpi.metric])

  if (!hasOverlap && Object.keys(normalized).length > 0) {
    return kpis
  }

  return createDefaultKpis().map(defaultKpi => {
    const override = normalized[defaultKpi.metric]
    if (!override) {
      return defaultKpi
    }

    const merged = { ...defaultKpi }

    if (override.value !== undefined) {
      const normalizedValue = normalizeKpiValue(
        override.value,
        defaultKpi.value,
        defaultKpi.valueFormat
      )
      merged.value = normalizedValue.value
      if (normalizedValue.valueFormat) {
        merged.valueFormat = normalizedValue.valueFormat
      }
    }

    if (override.valueFormat) {
      merged.valueFormat = override.valueFormat
    }

    if (override.valuePrefix !== undefined) {
      merged.valuePrefix = override.valuePrefix
    }

    if (override.valueSuffix !== undefined) {
      merged.valueSuffix = override.valueSuffix
    }

    if (override.trend !== undefined) {
      merged.trend = override.trend
    } else if (override.trendValue !== undefined || override.delta !== undefined || override.change !== undefined) {
      const rawTrend = override.trendValue ?? override.delta ?? override.change
      const numeric = Number(rawTrend)
      if (!Number.isNaN(numeric)) {
        merged.trend = {
          value: numeric,
          direction: numeric > 0 ? 'up' : numeric < 0 ? 'down' : 'neutral',
        }
      }
    }

    if (override.customFooter !== undefined) {
      merged.customFooter = override.customFooter
    } else if (override.status) {
      merged.customFooter = `Status: ${override.status}`
    }

    if (override.label) {
      merged.label = override.label
    }

    if (override.icon) {
      merged.icon = override.icon
    }

    if (override.gradient) {
      merged.gradient = override.gradient
    }

    return merged
  })
}

const KPIGrid = ({ kpis = [], className = '' }) => {
  const resolvedKpis = mergeKpisWithDefaults(kpis)

  if (!resolvedKpis || resolvedKpis.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-500">No KPI data available</p>
      </div>
    )
  }

  return (
    <div
      className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}
      role="list"
      aria-label="Key Performance Indicators"
    >
      {resolvedKpis.map((kpi, index) => (
        <div key={kpi.metric || kpi.label || index} role="listitem">
          <KPICard {...kpi} />
        </div>
      ))}
    </div>
  )
}

export default KPIGrid
