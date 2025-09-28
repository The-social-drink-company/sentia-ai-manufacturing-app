export function calculateChange(current, previous) {
  if (typeof current !== 'number' || typeof previous !== 'number') {
    return 0;
  }

  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

export function determineTrend(change) {
  if (change > 0.5) {
    return 'up';
  }
  if (change < -0.5) {
    return 'down';
  }
  return 'flat';
}

export function toCurrency(value) {
  return Math.round((value ?? 0) * 100) / 100;
}

export function buildTimeSeries(entries, valueExtractor) {
  return entries
    .filter(Boolean)
    .map((entry) => ({
      date: entry.date instanceof Date ? entry.date : new Date(entry.date),
      value: valueExtractor(entry)
    }))
    .sort((a, b) => a.date - b.date);
}

export function summarizeSeries(series) {
  if (!series.length) {
    return { current: 0, previous: 0, change: 0, trend: 'flat' };
  }

  const current = series[series.length - 1].value ?? 0;
  const previous = series.length > 1 ? series[series.length - 2].value ?? 0 : 0;
  const change = calculateChange(current, previous);
  return { current, previous, change, trend: determineTrend(change) };
}
