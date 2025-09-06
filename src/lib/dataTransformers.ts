// Data transformation utilities for enterprise data processing

import type { FormattingOptions, AggregationOptions, CurrencyRate } from '../stores/types';

// Currency conversion utilities
export class CurrencyConverter {
  private rates: Map<string, CurrencyRate[]> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadCachedRates();
  }

  // Add or update exchange rate
  addRate(rate: CurrencyRate): void {
    const key = `${rate.from}-${rate.to}`;
    const existingRates = this.rates.get(key) || [];
    
    // Remove old rates and add new one
    const updatedRates = [rate, ...existingRates.filter(r => 
      r.timestamp.getTime() !== rate.timestamp.getTime()
    )].slice(0, 100); // Keep last 100 rates
    
    this.rates.set(key, updatedRates);
    this.saveCachedRates();
  }

  // Get latest exchange rate
  getRate(from: string, to: string): CurrencyRate | null {
    if (from === to) {
      return {
        from,
        to,
        rate: 1,
        timestamp: new Date(),
        source: 'internal',
      };
    }

    const key = `${from}-${to}`;
    const rates = this.rates.get(key);
    
    if (!rates || rates.length === 0) {
      // Try reverse rate
      const reverseKey = `${to}-${from}`;
      const reverseRates = this.rates.get(reverseKey);
      
      if (reverseRates && reverseRates.length > 0) {
        const latestReverse = reverseRates[0];
        return {
          from,
          to,
          rate: 1 / latestReverse.rate,
          timestamp: latestReverse.timestamp,
          source: latestReverse.source,
        };
      }
      
      return null;
    }

    // Return latest rate if not expired
    const latestRate = rates[0];
    const isExpired = Date.now() - latestRate.timestamp.getTime() > this.cacheExpiry;
    
    return isExpired ? null : latestRate;
  }

  // Convert amount between currencies
  convert(amount: number, from: string, to: string): number | null {
    const rate = this.getRate(from, to);
    return rate ? amount * rate.rate : null;
  }

  // Get all available currency pairs
  getAvailablePairs(): Array<{ from: string; to: string; rate: number; timestamp: Date }> {
    const pairs: Array<{ from: string; to: string; rate: number; timestamp: Date }> = [];
    
    this.rates.forEach((rates, key) => {
      if (rates.length > 0) {
        const [from, to] = key.split('-');
        const latest = rates[0];
        pairs.push({
          from,
          to,
          rate: latest.rate,
          timestamp: latest.timestamp,
        });
      }
    });

    return pairs;
  }

  // Load rates from localStorage
  private loadCachedRates(): void {
    try {
      const cached = localStorage.getItem('currency-rates');
      if (cached) {
        const data = JSON.parse(cached);
        
        Object.entries(data).forEach(([key, rates]) => {
          const parsedRates = (rates as any[]).map(rate => ({
            ...rate,
            timestamp: new Date(rate.timestamp),
          }));
          this.rates.set(key, parsedRates);
        });
      }
    } catch (error) {
      console.error('Failed to load cached currency rates:', error);
    }
  }

  // Save rates to localStorage
  private saveCachedRates(): void {
    try {
      const data: Record<string, CurrencyRate[]> = {};
      
      this.rates.forEach((rates, key) => {
        data[key] = rates;
      });

      localStorage.setItem('currency-rates', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save currency rates to cache:', error);
    }
  }
}

// Global currency converter instance
export const currencyConverter = new CurrencyConverter();

// Number and currency formatting utilities
export class NumberFormatter {
  private formatters: Map<string, Intl.NumberFormat> = new Map();

  // Format number with localization
  formatNumber(
    value: number, 
    options: Partial<FormattingOptions> = {}
  ): string {
    const {
      locale = 'en-GB',
      decimals = 2,
      useGrouping = true,
      compact = false,
    } = options;

    const key = `${locale}-${decimals}-${useGrouping}-${compact}`;
    
    if (!this.formatters.has(key)) {
      this.formatters.set(key, new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping,
        notation: compact ? 'compact' : 'standard',
        compactDisplay: compact ? 'short' : undefined,
      }));
    }

    const formatter = this.formatters.get(key)!;
    
    if (!isFinite(value) || isNaN(value)) {
      return '—';
    }

    return formatter.format(value);
  }

  // Format currency with conversion
  formatCurrency(
    value: number,
    currency: string,
    options: Partial<FormattingOptions> & { convertTo?: string } = {}
  ): string {
    const {
      locale = 'en-GB',
      decimals = 2,
      convertTo,
    } = options;

    let displayValue = value;
    let displayCurrency = currency;

    // Convert currency if needed
    if (convertTo && convertTo !== currency) {
      const converted = currencyConverter.convert(value, currency, convertTo);
      if (converted !== null) {
        displayValue = converted;
        displayCurrency = convertTo;
      }
    }

    const key = `${locale}-${displayCurrency}-${decimals}`;
    
    if (!this.formatters.has(key)) {
      this.formatters.set(key, new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: displayCurrency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }));
    }

    const formatter = this.formatters.get(key)!;
    
    if (!isFinite(displayValue) || isNaN(displayValue)) {
      return '—';
    }

    return formatter.format(displayValue);
  }

  // Format percentage
  formatPercentage(
    value: number,
    options: Partial<FormattingOptions> = {}
  ): string {
    const {
      locale = 'en-GB',
      decimals = 1,
    } = options;

    const key = `percent-${locale}-${decimals}`;
    
    if (!this.formatters.has(key)) {
      this.formatters.set(key, new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }));
    }

    const formatter = this.formatters.get(key)!;
    
    if (!isFinite(value) || isNaN(value)) {
      return '—';
    }

    // Convert to percentage (e.g., 0.15 -> 15%)
    return formatter.format(value / 100);
  }

  // Format file size
  formatBytes(bytes: number, decimals: number = 1): string {
    if (bytes === 0) return '0 B';
    if (!isFinite(bytes) || isNaN(bytes)) return '—';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);

    return `${value.toFixed(decimals)} ${sizes[i]}`;
  }

  // Format duration
  formatDuration(milliseconds: number): string {
    if (!isFinite(milliseconds) || isNaN(milliseconds) || milliseconds < 0) {
      return '—';
    }

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Format with suffix (K, M, B, etc.)
  formatWithSuffix(value: number, decimals: number = 1): string {
    if (!isFinite(value) || isNaN(value)) return '—';
    
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (absValue >= 1e12) {
      return `${sign}${(absValue / 1e12).toFixed(decimals)}T`;
    } else if (absValue >= 1e9) {
      return `${sign}${(absValue / 1e9).toFixed(decimals)}B`;
    } else if (absValue >= 1e6) {
      return `${sign}${(absValue / 1e6).toFixed(decimals)}M`;
    } else if (absValue >= 1e3) {
      return `${sign}${(absValue / 1e3).toFixed(decimals)}K`;
    } else {
      return `${sign}${absValue.toFixed(decimals)}`;
    }
  }
}

// Global number formatter instance
export const numberFormatter = new NumberFormatter();

// Date and timezone formatting utilities
export class DateTimeFormatter {
  private formatters: Map<string, Intl.DateTimeFormat> = new Map();

  // Format date with timezone
  formatDate(
    date: Date | string | number,
    options: {
      locale?: string;
      timeZone?: string;
      dateStyle?: 'full' | 'long' | 'medium' | 'short';
      timeStyle?: 'full' | 'long' | 'medium' | 'short';
      format?: 'date' | 'time' | 'datetime';
    } = {}
  ): string {
    const {
      locale = 'en-GB',
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateStyle = 'medium',
      timeStyle = 'short',
      format = 'datetime',
    } = options;

    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    const key = `${locale}-${timeZone}-${dateStyle}-${timeStyle}-${format}`;
    
    if (!this.formatters.has(key)) {
      const formatOptions: Intl.DateTimeFormatOptions = { timeZone };
      
      if (format === 'date' || format === 'datetime') {
        formatOptions.dateStyle = dateStyle;
      }
      
      if (format === 'time' || format === 'datetime') {
        formatOptions.timeStyle = timeStyle;
      }

      this.formatters.set(key, new Intl.DateTimeFormat(locale, formatOptions));
    }

    const formatter = this.formatters.get(key)!;
    return formatter.format(dateObj);
  }

  // Format relative time (e.g., "2 hours ago")
  formatRelativeTime(
    date: Date | string | number,
    options: {
      locale?: string;
      style?: 'long' | 'short' | 'narrow';
    } = {}
  ): string {
    const {
      locale = 'en-GB',
      style = 'long',
    } = options;

    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const absDiffMs = Math.abs(diffMs);

    const rtf = new Intl.RelativeTimeFormat(locale, { style });

    // Define time units in milliseconds
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;

    // Determine the appropriate unit
    if (absDiffMs < minute) {
      return rtf.format(Math.round(diffMs / 1000), 'second');
    } else if (absDiffMs < hour) {
      return rtf.format(Math.round(diffMs / minute), 'minute');
    } else if (absDiffMs < day) {
      return rtf.format(Math.round(diffMs / hour), 'hour');
    } else if (absDiffMs < week) {
      return rtf.format(Math.round(diffMs / day), 'day');
    } else if (absDiffMs < month) {
      return rtf.format(Math.round(diffMs / week), 'week');
    } else if (absDiffMs < year) {
      return rtf.format(Math.round(diffMs / month), 'month');
    } else {
      return rtf.format(Math.round(diffMs / year), 'year');
    }
  }

  // Convert between timezones
  convertTimezone(
    date: Date | string | number,
    fromTimeZone: string,
    toTimeZone: string
  ): Date {
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date provided');
    }

    // Get the offset difference
    const fromOffset = this.getTimezoneOffset(dateObj, fromTimeZone);
    const toOffset = this.getTimezoneOffset(dateObj, toTimeZone);
    
    const offsetDiff = (fromOffset - toOffset) * 60 * 1000; // Convert to milliseconds
    
    return new Date(dateObj.getTime() + offsetDiff);
  }

  // Get timezone offset in minutes
  private getTimezoneOffset(date: Date, timeZone: string): number {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const localDate = new Date(date.toLocaleString('en-US', { timeZone }));
    
    return (utcDate.getTime() - localDate.getTime()) / (60 * 1000);
  }

  // Format market hours
  formatMarketHours(
    openTime: string,
    closeTime: string,
    timeZone: string,
    options: {
      locale?: string;
      userTimeZone?: string;
    } = {}
  ): string {
    const {
      locale = 'en-GB',
      userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
    } = options;

    try {
      const today = new Date();
      const openDate = new Date(`${today.toDateString()} ${openTime}`);
      const closeDate = new Date(`${today.toDateString()} ${closeTime}`);

      const convertedOpen = this.convertTimezone(openDate, timeZone, userTimeZone);
      const convertedClose = this.convertTimezone(closeDate, timeZone, userTimeZone);

      const timeFormat = new Intl.DateTimeFormat(locale, {
        timeStyle: 'short',
        timeZone: userTimeZone,
      });

      return `${timeFormat.format(convertedOpen)} - ${timeFormat.format(convertedClose)}`;
    } catch (error) {
      return `${openTime} - ${closeTime} (${timeZone})`;
    }
  }
}

// Global date formatter instance
export const dateTimeFormatter = new DateTimeFormatter();

// Data aggregation utilities
export class DataAggregator {
  // Aggregate data based on options
  aggregate<T extends Record<string, any>>(
    data: T[],
    options: AggregationOptions
  ): Record<string, any>[] {
    if (!data || data.length === 0) {
      return [];
    }

    // Apply filters first
    let filteredData = data;
    if (options.filters) {
      filteredData = this.applyFilters(data, options.filters);
    }

    // Group data
    const grouped = this.groupBy(filteredData, options.groupBy);

    // Aggregate each group
    const aggregated = Object.entries(grouped).map(([groupKey, groupData]) => {
      const result: Record<string, any> = { [Array.isArray(options.groupBy) ? 'group' : options.groupBy]: groupKey };

      options.aggregations.forEach(agg => {
        const alias = agg.alias || `${agg.operation}_${agg.field}`;
        result[alias] = this.applyAggregation(groupData, agg.field, agg.operation);
      });

      return result;
    });

    // Sort if specified
    if (options.sort && options.sort.length > 0) {
      return this.sortData(aggregated, options.sort);
    }

    return aggregated;
  }

  // Group data by field(s)
  private groupBy<T extends Record<string, any>>(
    data: T[],
    groupBy: string | string[]
  ): Record<string, T[]> {
    const groups: Record<string, T[]> = {};

    data.forEach(item => {
      const key = Array.isArray(groupBy)
        ? groupBy.map(field => String(item[field])).join('|')
        : String(item[groupBy]);

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return groups;
  }

  // Apply filters to data
  private applyFilters<T extends Record<string, any>>(
    data: T[],
    filters: Record<string, any>
  ): T[] {
    return data.filter(item => {
      return Object.entries(filters).every(([field, value]) => {
        if (Array.isArray(value)) {
          return value.includes(item[field]);
        } else if (typeof value === 'object' && value !== null) {
          // Range filter
          if (value.min !== undefined && item[field] < value.min) return false;
          if (value.max !== undefined && item[field] > value.max) return false;
          return true;
        } else {
          return item[field] === value;
        }
      });
    });
  }

  // Apply aggregation operation
  private applyAggregation(
    data: any[],
    field: string,
    operation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median' | 'stddev'
  ): number {
    if (operation === 'count') {
      return data.length;
    }

    const values = data
      .map(item => Number(item[field]))
      .filter(value => !isNaN(value) && isFinite(value));

    if (values.length === 0) {
      return 0;
    }

    switch (operation) {
      case 'sum':
        return values.reduce((sum, value) => sum + value, 0);
      
      case 'avg':
        return values.reduce((sum, value) => sum + value, 0) / values.length;
      
      case 'min':
        return Math.min(...values);
      
      case 'max':
        return Math.max(...values);
      
      case 'median':
        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
          ? (sorted[middle - 1] + sorted[middle]) / 2
          : sorted[middle];
      
      case 'stddev':
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        const squareDiffs = values.map(value => Math.pow(value - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
        return Math.sqrt(avgSquareDiff);
      
      default:
        return 0;
    }
  }

  // Sort data
  private sortData<T extends Record<string, any>>(
    data: T[],
    sortOptions: Array<{ field: string; order: 'asc' | 'desc' }>
  ): T[] {
    return [...data].sort((a, b) => {
      for (const sort of sortOptions) {
        const aValue = a[sort.field];
        const bValue = b[sort.field];
        
        let comparison = 0;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        
        if (comparison !== 0) {
          return sort.order === 'desc' ? -comparison : comparison;
        }
      }
      
      return 0;
    });
  }
}

// Global data aggregator instance
export const dataAggregator = new DataAggregator();

// Statistical calculation utilities
export class StatisticalCalculator {
  // Calculate moving average
  movingAverage(data: number[], windowSize: number): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = data.slice(start, i + 1);
      const average = window.reduce((sum, value) => sum + value, 0) / window.length;
      result.push(average);
    }
    
    return result;
  }

  // Calculate exponential moving average
  exponentialMovingAverage(data: number[], alpha: number = 0.2): number[] {
    const result: number[] = [];
    let ema = data[0];
    result.push(ema);
    
    for (let i = 1; i < data.length; i++) {
      ema = alpha * data[i] + (1 - alpha) * ema;
      result.push(ema);
    }
    
    return result;
  }

  // Calculate percentage change
  percentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue === 0 ? 0 : Infinity;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  // Calculate correlation coefficient
  correlation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, value) => sum + value, 0);
    const sumY = y.reduce((sum, value) => sum + value, 0);
    const sumXY = x.reduce((sum, xVal, i) => sum + xVal * y[i], 0);
    const sumX2 = x.reduce((sum, value) => sum + value * value, 0);
    const sumY2 = y.reduce((sum, value) => sum + value * value, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Calculate linear regression
  linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    if (x.length !== y.length || x.length === 0) {
      return { slope: 0, intercept: 0, r2: 0 };
    }
    
    const n = x.length;
    const sumX = x.reduce((sum, value) => sum + value, 0);
    const sumY = y.reduce((sum, value) => sum + value, 0);
    const sumXY = x.reduce((sum, xVal, i) => sum + xVal * y[i], 0);
    const sumX2 = x.reduce((sum, value) => sum + value * value, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R²
    const correlation = this.correlation(x, y);
    const r2 = correlation * correlation;
    
    return { slope, intercept, r2 };
  }

  // Calculate z-score normalization
  zScoreNormalize(data: number[]): number[] {
    const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
    const stdDev = Math.sqrt(
      data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length
    );
    
    if (stdDev === 0) return data.map(() => 0);
    
    return data.map(value => (value - mean) / stdDev);
  }

  // Calculate percentiles
  percentile(data: number[], p: number): number {
    if (data.length === 0) return 0;
    
    const sorted = [...data].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    
    if (index === Math.floor(index)) {
      return sorted[index];
    } else {
      const lower = sorted[Math.floor(index)];
      const upper = sorted[Math.ceil(index)];
      const weight = index - Math.floor(index);
      return lower + weight * (upper - lower);
    }
  }

  // Calculate outliers using IQR method
  detectOutliers(data: number[]): { outliers: number[]; indices: number[] } {
    const q1 = this.percentile(data, 25);
    const q3 = this.percentile(data, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outliers: number[] = [];
    const indices: number[] = [];
    
    data.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outliers.push(value);
        indices.push(index);
      }
    });
    
    return { outliers, indices };
  }
}

// Global statistical calculator instance
export const statisticalCalculator = new StatisticalCalculator();

// Validation utilities
export const validateNumber = (value: any): boolean => {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
};

export const validateDate = (value: any): boolean => {
  const date = new Date(value);
  return !isNaN(date.getTime());
};

export const validateCurrency = (code: string): boolean => {
  try {
    new Intl.NumberFormat('en-US', { style: 'currency', currency: code });
    return true;
  } catch {
    return false;
  }
};

export const validateTimeZone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};