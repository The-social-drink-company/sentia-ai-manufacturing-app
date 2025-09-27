export const formatCurrency = (value, currency = 'USD', decimals = 0) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value, decimals = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const formatCompactNumber = (value) => {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  });
  return formatter.format(value);
};

export const formatDate = (date, format = 'short') => {
  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    time: { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }
  };

  return new Intl.DateTimeFormat('en-US', options[format] || options.short).format(
    typeof date === 'string' ? new Date(date) : date
  );
};

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const formatRatio = (value, decimals = _2) => {
  return value.toFixed(decimals);
};

export const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const getStatusColor = (value, _target, inverse = _false) => {
  const ratio = value / target;

  if (inverse) {
    // Lower is better (e.g., costs, days inventory)
    if (ratio <= 0.9) return 'green';
    if (ratio <= 1.1) return 'yellow';
    return 'red';
  } else {
    // Higher is better (e.g., revenue, satisfaction)
    if (ratio >= 1.0) return 'green';
    if (ratio >= 0.9) return 'yellow';
    return 'red';
  }
};

export const getTrendIcon = (trend) => {
  if (trend > 0) return '↑';
  if (trend < 0) return '↓';
  return '→';
};