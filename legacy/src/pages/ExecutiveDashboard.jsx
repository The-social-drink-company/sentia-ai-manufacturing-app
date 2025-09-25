import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  ChartBarIcon,
  CurrencyPoundIcon,
  CubeIcon,
  UsersIcon,
  TrendingUpIcon,
  WalletIcon,
  ChartPieIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { parseNumericValue, parsePercentageValue } from '../hooks/useExecutiveDashboard.js';

const ICON_MAP = {
  revenue: CurrencyPoundIcon,
  cash: WalletIcon,
  finance: WalletIcon,
  orders: CubeIcon,
  inventory: CubeIcon,
  operations: ChartBarIcon,
  performance: TrendingUpIcon,
  analytics: ChartPieIcon,
  customers: UsersIcon,
  default: ChartBarIcon
};

const KPI_COLORS = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-600' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' }
};

const HEALTH_COLORS = {
  healthy: 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10',
  degraded: 'text-amber-600 border-amber-500/30 bg-amber-500/10',
  down: 'text-rose-600 border-rose-500/30 bg-rose-500/10',
  unhealthy: 'text-rose-600 border-rose-500/30 bg-rose-500/10'
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = parseNumericValue(value);
  if (numeric === null) {
    return typeof value === 'string' ? value : null;
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(numeric);
};

const formatNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = parseNumericValue(value);
  if (numeric === null) {
    return typeof value === 'string' ? value : null;
  }

  return new Intl.NumberFormat('en-GB').format(Math.round(numeric));
};

const determineTrendDirection = (kpi) => {
  if (!kpi) {
    return null;
  }

  if (typeof kpi.changeType === 'string') {
    if (kpi.changeType.toLowerCase() === 'increase') return 'up';
    if (kpi.changeType.toLowerCase() === 'decrease') return 'down';
  }

  const numeric = parsePercentageValue(kpi.change ?? kpi.delta ?? kpi.trend ?? null);
  if (numeric === null) {
    return null;
  }
  if (numeric > 0) return 'up';
  if (numeric < 0) return 'down';
  return null;
};

const extractTrendLabel = (kpi) => {
  if (!kpi) {
    return null;
  }

  if (typeof kpi.change === 'string' && kpi.change.trim()) {
    return kpi.change.trim();
  }
  if (typeof kpi.delta === 'string' && kpi.delta.trim()) {
    return kpi.delta.trim();
  }
  if (typeof kpi.trend === 'string' && kpi.trend.trim()) {
    return kpi.trend.trim();
  }

  const numeric = parsePercentageValue(kpi.change ?? kpi.delta ?? kpi.trend ?? null);
  if (numeric === null) {
    return null;
  }

  return `${numeric.toFixed(1)}%`;
};

const KPICard = ({ title, value, subtitle, trendLabel, trendDirection, icon: IconComponent, colorKey, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-8 w-32 rounded bg-slate-200" />
          <div className="h-3 w-20 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error || value === null || value === undefined) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-sm text-slate-500">Data unavailable</p>
      </div>
    );
  }

  const color = KPI_COLORS[colorKey] || KPI_COLORS.slate;
  const TrendIcon = trendDirection === 'down' ? ArrowDownIcon : ArrowUpIcon;
  const trendClasses = trendDirection === 'down' ? 'text-rose-600' : 'text-emerald-600';

  return (
    <motion.div
      className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow"
      whileHover={{ scale: 1.02 }}
      role="region"
      aria-live="polite"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {typeof value === 'number' ? value.toLocaleString('en-GB') : value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`${color.bg} ${color.text} rounded-lg p-2`}> 
          <IconComponent className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
      {trendLabel ? (
        <div className={`mt-4 flex items-center text-sm font-medium ${trendClasses}`}>
          <TrendIcon className="mr-1 h-4 w-4" aria-hidden="true" />
          <span>{trendLabel}</span>
        </div>
      ) : null}
    </motion.div>
  );
};

const MetricRow = ({ label, value, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-between border-b border-slate-200 py-3">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-b border-slate-200 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
};

const QuickAction = ({ title, description, icon: IconComponent, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    className="flex w-full items-start gap-4 rounded-xl bg-white p-6 text-left shadow hover:shadow-lg transition-all"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="rounded-lg bg-slate-100 p-3 text-slate-600">
      <IconComponent className="h-6 w-6" aria-hidden="true" />
    </div>
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
    </div>
  </motion.button>
);

const HealthStatusBadge = ({ status }) => {
  if (!status) {
    return null;
  }

  const normalized = String(status).toLowerCase();
  const style = HEALTH_COLORS[normalized] || HEALTH_COLORS.degraded;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${style}`}>
      {normalized === 'healthy' ? (
        <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
      )}
      {normalized.charAt(0).toUpperCase() + normalized.slice(1)}
    </span>
  );
};

const flattenMetrics = (payload) => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload
      .filter(Boolean)
      .map((item) => {
        if (typeof item === 'object') {
          const label = item.label || item.name || item.id;
          const value = item.value ?? item.amount ?? item.current ?? item.status;
          if (!label || value === undefined || value === null) {
            return null;
          }
          return { label, value };
        }
        return null;
      })
      .filter(Boolean);
  }

  if (typeof payload === 'object') {
    return Object.entries(payload)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([label, value]) => ({ label, value }));
  }

  return [];
};

const deriveQuickActions = (data) => {
  if (!data) {
    return [];
  }

  if (Array.isArray(data.quickActions)) {
    return data.quickActions;
  }

  if (Array.isArray(data.actions)) {
    return data.actions;
  }

  return [];
};

export default function ExecutiveDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    data: dashboardData,
    isLoading: loadingDashboard,
    error: dashboardError
  } = useQuery({
    queryKey: ['executive-dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/executive');
      if (!response.data) {
        throw new Error('No executive dashboard data available');
      }
      return response.data;
    },
    refetchInterval: 30000,
    retry: 2
  });

  const {
    data: metricsData,
    isLoading: loadingMetrics,
    error: metricsError
  } = useQuery({
    queryKey: ['realtime-metrics'],
    queryFn: async () => {
      const response = await axios.get('/api/metrics/realtime');
      if (!response.data) {
        throw new Error('No real-time metrics available');
      }
      return response.data;
    },
    refetchInterval: 30000,
    retry: 2
  });

  const {
    data: workingCapital,
    isLoading: loadingWorkingCapital,
    error: workingCapitalError
  } = useQuery({
    queryKey: ['working-capital-current'],
    queryFn: async () => {
      const response = await axios.get('/api/working-capital/current');
      if (!response.data) {
        throw new Error('No working capital data available');
      }
      return response.data;
    },
    refetchInterval: 60000,
    retry: 2
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await axios.get('/api/health');
      return response.data;
    },
    refetchInterval: 10000,
    retry: 2
  });

  const kpis = useMemo(() => {
    if (!dashboardData) {
      return [];
    }

    const source = Array.isArray(dashboardData.kpis)
      ? dashboardData.kpis
      : Array.isArray(dashboardData.metrics)
        ? dashboardData.metrics
        : [];

    return source
      .filter(Boolean)
      .map((kpi) => {
        const title = kpi.title || kpi.label || kpi.name || 'KPI';
        const rawValue = kpi.value ?? kpi.amount ?? kpi.current ?? null;
        const displayValue = formatCurrency(rawValue) || formatNumber(rawValue) || (typeof rawValue === 'string' ? rawValue : null);

        return {
          id: kpi.id || title,
          title,
          subtitle: kpi.description || kpi.subtitle || null,
          value: displayValue,
          trendLabel: extractTrendLabel(kpi),
          trendDirection: determineTrendDirection(kpi),
          icon: ICON_MAP[kpi.icon] || ICON_MAP[kpi.id] || ICON_MAP.default,
          color: (kpi.color && KPI_COLORS[kpi.color]) ? kpi.color : 'blue'
        };
      })
      .filter((item) => item.value !== null);
  }, [dashboardData]);

  const realtimeMetrics = useMemo(() => {
    if (!metricsData) {
      return [];
    }

    if (Array.isArray(metricsData.metrics)) {
      return flattenMetrics(metricsData.metrics);
    }

    if (metricsData.keyMetrics) {
      return flattenMetrics(metricsData.keyMetrics);
    }

    return flattenMetrics(metricsData);
  }, [metricsData]);

  const workingCapitalSummary = useMemo(() => {
    if (!workingCapital) {
      return null;
    }

    const source = workingCapital.current || workingCapital.data || workingCapital;

    const currentValue = source.current?.amount ?? source.current_value ?? source.current ?? source.amount;
    const projectionValue = source.projection?.amount ?? source.projection30 ?? source.projection;
    const cashCycle = source.cashConversionCycle ?? source.cashCycle ?? source.ccc;
    const change = source.change ?? source.delta ?? source.changePercent;

    const breakdown = [];
    if (source.accountsReceivableDays || source.arDays) {
      breakdown.push({
        label: 'AR Days',
        value: formatNumber(source.accountsReceivableDays ?? source.arDays)
      });
    }
    if (source.accountsPayableDays || source.apDays) {
      breakdown.push({
        label: 'AP Days',
        value: formatNumber(source.accountsPayableDays ?? source.apDays)
      });
    }
    if (source.inventoryDays || source.inventoryTurnoverDays) {
      breakdown.push({
        label: 'Inventory Days',
        value: formatNumber(source.inventoryDays ?? source.inventoryTurnoverDays)
      });
    }

    const trendSeries = Array.isArray(source.trend?.points)
      ? source.trend.points
      : Array.isArray(source.trend)
        ? source.trend
        : Array.isArray(source.series)
          ? source.series
          : [];

    return {
      current: formatCurrency(currentValue),
      projection: formatCurrency(projectionValue),
      cashCycle: formatNumber(cashCycle),
      change: extractTrendLabel({ change }),
      breakdown: breakdown.filter((item) => item.value !== null),
      trendSeries
    };
  }, [workingCapital]);

  const quickActions = useMemo(() => deriveQuickActions(dashboardData), [dashboardData]);

  const healthEntries = useMemo(() => {
    if (!systemHealth?.components) {
      return [];
    }

    return Object.entries(systemHealth.components).map(([key, details]) => ({
      id: key,
      status: details?.status || 'unknown',
      details
    }));
  }, [systemHealth]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Executive Command Center</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Manufacturing Executive Dashboard</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>Updated {currentTime.toLocaleTimeString('en-GB')}</span>
              {systemHealth?.status ? <HealthStatusBadge status={systemHealth.status} /> : null}
              {dashboardError ? <span className="text-rose-400">Executive data: {dashboardError.message}</span> : null}
              {metricsError ? <span className="text-rose-400">Metrics data: {metricsError.message}</span> : null}
              {workingCapitalError ? <span className="text-rose-400">Working capital data: {workingCapitalError.message}</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm">
            <CloudArrowUpIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <div>
              <p className="font-medium text-slate-200">Realtime Sync</p>
              <p className="text-xs text-slate-500">Auto-refresh every 30s</p>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-4 sm:grid-cols-2">
          {kpis.length === 0 && (loadingDashboard || dashboardError) ? (
            Array.from({ length: 4 }).map((_, index) => (
              <KPICard
                key={`kpi-skeleton-${index}`}
                title=""
                value={null}
                loading
                subtitle={null}
                trendLabel={null}
                trendDirection={null}
                icon={ICON_MAP.default}
                colorKey="slate"
              />
            ))
          ) : (
            kpis.map((kpi) => (
              <KPICard
                key={kpi.id}
                title={kpi.title}
                value={kpi.value}
                subtitle={kpi.subtitle}
                trendLabel={kpi.trendLabel}
                trendDirection={kpi.trendDirection}
                icon={kpi.icon}
                colorKey={kpi.color}
                loading={loadingDashboard}
                error={!kpi.value}
              />
            ))
          )}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Working Capital Position</h2>
              {workingCapitalSummary?.change ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                  {workingCapitalSummary.change}
                </span>
              ) : null}
            </div>
            {loadingWorkingCapital ? (
              <div className="mt-6 space-y-4">
                <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
              </div>
            ) : null}

            {workingCapitalSummary ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500">Current Working Capital</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {workingCapitalSummary.current || 'Data unavailable'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">30 Day Projection</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {workingCapitalSummary.projection || 'Data unavailable'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Cash Conversion Cycle</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {workingCapitalSummary.cashCycle ? `${workingCapitalSummary.cashCycle} days` : 'Data unavailable'}
                  </p>
                </div>
              </div>
            ) : (!loadingWorkingCapital ? (
              <p className="mt-6 text-sm text-slate-500">No working capital data available.</p>
            ) : null)}

            {workingCapitalSummary?.breakdown?.length ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {workingCapitalSummary.breakdown.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {workingCapitalSummary?.trendSeries?.length ? (
              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Trend</p>
                <div className="mt-3 h-24 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 p-4">
                  <div className="flex h-full items-end gap-2">
                    {workingCapitalSummary.trendSeries.map((point, index) => {
                      const numeric = parseNumericValue(point?.value ?? point);
                      if (numeric === null) {
                        return null;
                      }
                      const height = Math.min(100, Math.max(10, Math.abs(numeric) / 1000));
                      return (
                        <div
                          key={`trend-${index}`}
                          className="w-full rounded bg-slate-300"
                          style={{ height: `${height}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-slate-900">System Health</h2>
            <div className="mt-4 space-y-3">
              {healthEntries.length ? (
                healthEntries.map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between rounded-lg border border-slate-200 p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{entry.id.replace(/_/g, ' ')}</p>
                      {entry.details?.details ? (
                        <p className="mt-1 text-xs text-slate-500">{entry.details.details}</p>
                      ) : null}
                    </div>
                    <HealthStatusBadge status={entry.status} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Health telemetry not available.</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Real-time Manufacturing Metrics</h2>
              <HealthStatusBadge status={metricsData?.status} />
            </div>
            <div className="mt-4">
              {realtimeMetrics.length ? (
                realtimeMetrics.map((metric) => (
                  <MetricRow
                    key={metric.label}
                    label={metric.label}
                    value={formatNumber(metric.value) || formatCurrency(metric.value) || metric.value}
                    loading={loadingMetrics}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500">No live metrics available.</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {quickActions.length ? (
              quickActions.map((action, index) => {
                const IconComponent = ICON_MAP[action.icon] || ICON_MAP[action.id] || ICON_MAP.default;
                const handleClick = () => {
                  if (action.href) {
                    window.open(action.href, action.target || '_blank', 'noopener');
                  } else if (action.url) {
                    window.open(action.url, action.target || '_blank', 'noopener');
                  } else if (action.onClick && typeof action.onClick === 'function') {
                    action.onClick();
                  }
                };

                return (
                  <QuickAction
                    key={action.id || `action-${index}`}
                    title={action.title || action.label || 'Action'}
                    description={action.description || action.subtitle}
                    icon={IconComponent}
                    onClick={handleClick}
                  />
                );
              })
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                No executive quick actions available.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

