import React from 'react';
import { useSSE } from '@/hooks/useSSE';
import {
  DollarSign,
  Package,
  Warehouse,
  Clock,
  TrendingUp,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';

/**
 * KPIStrip Component
 *
 * Displays 6 top-level KPIs with real-time SSE updates:
 * 1. Revenue (today, MTD, YTD)
 * 2. Production Output (units, OEE)
 * 3. Inventory Value
 * 4. Cash Conversion Cycle
 * 5. On-Time Delivery Rate
 * 6. Forecast Accuracy
 *
 * Features:
 * - Real-time SSE updates for live data
 * - Sparklines for trend visualization
 * - Trend badges (up/down/neutral)
 * - Status indicators (excellent/good/warning/critical)
 * - Click handlers for drilldown modals
 *
 * @param {Object} props
 * @param {Object} props.data - KPI data object
 * @param {Function} props.onKPIClick - Click handler for KPI drilldown
 */
function KPIStrip({ data, onKPIClick }) {
  // SSE integration for real-time updates
  // eslint-disable-next-line no-unused-vars
  const { lastMessage } = useSSE('dashboard', {
    enabled: true,
    onMessage: (message) => {
      if (message.type === 'kpi:update') {
        // Parent component handles query invalidation via TanStack Query
      }
    },
  });

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      id: 'revenue',
      label: 'Revenue',
      value: data.revenue?.today || 0,
      format: 'currency',
      comparison: {
        label: 'vs Yesterday',
        value: data.revenue?.change || 0,
        type: getTrend(data.revenue?.change),
      },
      status: getStatus(data.revenue?.target, data.revenue?.today),
      icon: DollarSign,
      sparkline: data.revenue?.sparkline || [],
      details: {
        mtd: data.revenue?.mtd || 0,
        ytd: data.revenue?.ytd || 0,
      },
    },
    {
      id: 'production',
      label: 'Production Output',
      value: data.production?.units || 0,
      format: 'number',
      suffix: 'units',
      comparison: {
        label: 'OEE',
        value: data.production?.oee || 0,
        type: getOEEStatus(data.production?.oee),
      },
      status: getStatus(data.production?.target, data.production?.units),
      icon: Package,
      sparkline: data.production?.sparkline || [],
      details: {
        oee: data.production?.oee || 0,
        target: data.production?.target || 0,
      },
    },
    {
      id: 'inventory',
      label: 'Inventory Value',
      value: data.inventory?.value || 0,
      format: 'currency',
      comparison: {
        label: 'vs Last Week',
        value: data.inventory?.change || 0,
        type: getTrend(data.inventory?.change),
      },
      status: 'good',
      icon: Warehouse,
      sparkline: data.inventory?.sparkline || [],
      details: {
        units: data.inventory?.units || 0,
        skus: data.inventory?.skus || 0,
      },
    },
    {
      id: 'ccc',
      label: 'Cash Conversion Cycle',
      value: data.ccc?.days || 0,
      format: 'number',
      suffix: 'days',
      comparison: {
        label: 'Target: <55d',
        value: 55 - (data.ccc?.days || 0),
        type: data.ccc?.days < 55 ? 'up' : 'down',
      },
      status: getCCCStatus(data.ccc?.days),
      icon: Clock,
      sparkline: data.ccc?.sparkline || [],
      details: {
        dio: data.ccc?.dio || 0,
        dso: data.ccc?.dso || 0,
        dpo: data.ccc?.dpo || 0,
      },
    },
    {
      id: 'otd',
      label: 'On-Time Delivery',
      value: data.otd?.rate || 0,
      format: 'percentage',
      comparison: {
        label: 'vs Last Month',
        value: data.otd?.change || 0,
        type: getTrend(data.otd?.change),
      },
      status: getPercentageStatus(data.otd?.rate, 95),
      icon: TrendingUp,
      sparkline: data.otd?.sparkline || [],
      details: {
        onTime: data.otd?.onTime || 0,
        total: data.otd?.total || 0,
      },
    },
    {
      id: 'forecast',
      label: 'Forecast Accuracy',
      value: data.forecast?.accuracy || 0,
      format: 'percentage',
      comparison: {
        label: 'Target: >85%',
        value: (data.forecast?.accuracy || 0) - 85,
        type: (data.forecast?.accuracy || 0) >= 85 ? 'up' : 'down',
      },
      status: getPercentageStatus(data.forecast?.accuracy, 85),
      icon: Target,
      sparkline: data.forecast?.sparkline || [],
      details: {
        mape: data.forecast?.mape || 0,
        models: data.forecast?.models || 0,
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.id} kpi={kpi} onClick={() => onKPIClick && onKPIClick(kpi)} />
      ))}
    </div>
  );
}

/**
 * KPICard Component
 *
 * Individual KPI card with status, trend, and sparkline
 */
function KPICard({ kpi, onClick }) {
  const statusColors = {
    excellent: 'border-green-500 bg-green-50',
    good: 'border-blue-500 bg-blue-50',
    warning: 'border-yellow-500 bg-yellow-50',
    critical: 'border-red-500 bg-red-50',
  };

  const Icon = kpi.icon;

  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-lg hover:scale-105 transition-all ${
        statusColors[kpi.status] || statusColors.good
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-gray-600" />
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            {kpi.label}
          </span>
        </div>
        <StatusBadge status={kpi.status} />
      </div>

      {/* Value */}
      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-900">
          {formatValue(kpi.value, kpi.format)}
          {kpi.suffix && <span className="text-sm font-normal text-gray-600 ml-1">{kpi.suffix}</span>}
        </div>
        <TrendBadge comparison={kpi.comparison} />
      </div>

      {/* Sparkline */}
      {kpi.sparkline && kpi.sparkline.length > 0 && (
        <div className="mt-3">
          <Sparkline data={kpi.sparkline} color={getSparklineColor(kpi.status)} />
        </div>
      )}

      {/* Details */}
      {kpi.details && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
          {kpi.id === 'revenue' && (
            <>
              <div>MTD: {formatValue(kpi.details.mtd, 'currency')}</div>
              <div>YTD: {formatValue(kpi.details.ytd, 'currency')}</div>
            </>
          )}
          {kpi.id === 'production' && (
            <>
              <div>OEE: {kpi.details.oee}%</div>
              <div>Target: {kpi.details.target}</div>
            </>
          )}
          {kpi.id === 'inventory' && (
            <>
              <div>{kpi.details.units} units</div>
              <div>{kpi.details.skus} SKUs</div>
            </>
          )}
          {kpi.id === 'ccc' && (
            <>
              <div>DIO: {kpi.details.dio}d</div>
              <div>DSO: {kpi.details.dso}d | DPO: {kpi.details.dpo}d</div>
            </>
          )}
          {kpi.id === 'otd' && (
            <div>{kpi.details.onTime} / {kpi.details.total} deliveries</div>
          )}
          {kpi.id === 'forecast' && (
            <>
              <div>MAPE: {kpi.details.mape}%</div>
              <div>{kpi.details.models} models</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * StatusBadge Component
 */
function StatusBadge({ status }) {
  const config = {
    excellent: { label: 'Excellent', className: 'bg-green-600 text-white' },
    good: { label: 'Good', className: 'bg-blue-600 text-white' },
    warning: { label: 'Warning', className: 'bg-yellow-600 text-white' },
    critical: { label: 'Critical', className: 'bg-red-600 text-white' },
  };

  const { label, className } = config[status] || config.good;

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

/**
 * TrendBadge Component
 */
function TrendBadge({ comparison }) {
  if (!comparison) return null;

  const { label, value, type } = comparison;

  const config = {
    up: { icon: ArrowUp, className: 'text-green-600 bg-green-100' },
    down: { icon: ArrowDown, className: 'text-red-600 bg-red-100' },
    neutral: { icon: Minus, className: 'text-gray-600 bg-gray-100' },
  };

  const { icon: Icon, className } = config[type] || config.neutral;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium mt-1 ${className}`}>
      <Icon className="w-3 h-3" />
      <span>{label}</span>
      {value !== null && value !== undefined && (
        <span className="font-semibold">
          {value > 0 ? '+' : ''}{value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

/**
 * Sparkline Component
 */
function Sparkline({ data, color = '#3b82f6' }) {
  if (!data || data.length === 0) return null;

  const width = 100;
  const height = 20;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Helper Functions
 */

function formatValue(value, format) {
  if (value === null || value === undefined) return 'N/A';

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
      }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
      return value.toLocaleString();
    default:
      return value;
  }
}

function getTrend(change) {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'neutral';
}

function getStatus(target, actual) {
  if (!target || !actual) return 'good';
  const percentage = (actual / target) * 100;
  if (percentage >= 100) return 'excellent';
  if (percentage >= 90) return 'good';
  if (percentage >= 75) return 'warning';
  return 'critical';
}

function getCCCStatus(days) {
  if (!days) return 'good';
  if (days < 40) return 'excellent';
  if (days < 55) return 'good';
  if (days < 70) return 'warning';
  return 'critical';
}

function getOEEStatus(oee) {
  if (!oee) return 'neutral';
  if (oee >= 85) return 'up';
  if (oee >= 75) return 'neutral';
  return 'down';
}

function getPercentageStatus(actual, target) {
  if (!actual) return 'good';
  if (actual >= target) return 'excellent';
  if (actual >= target * 0.9) return 'good';
  if (actual >= target * 0.75) return 'warning';
  return 'critical';
}

function getSparklineColor(status) {
  const colors = {
    excellent: '#10b981',
    good: '#3b82f6',
    warning: '#f59e0b',
    critical: '#ef4444',
  };
  return colors[status] || colors.good;
}

export default KPIStrip;
