// Global Configuration Module
// Provides global readiness settings for multi-region support

import { z } from 'zod';

// Configuration schema for validation
const GlobalConfigSchema = z.object({
  DEFAULT_BASE_CURRENCY: z.enum(['GBP', 'EUR', 'USD']).default('GBP'),
  SUPPORTED_CURRENCIES: z.array(z.enum(['GBP', 'EUR', 'USD', 'CAD', 'AUD'])).default(['GBP', 'EUR', 'USD']),
  SUPPORTED_REGIONS: z.array(z.enum(['UK', 'EU', 'USA', 'CA', 'AU'])).default(['UK', 'EU', 'USA']),
  DEFAULT_LOCALE: z.string().default('en-GB'),
  AVAILABLE_LOCALES: z.array(z.string()).default(['en-GB', 'en-US', 'de-DE', 'fr-FR']),
  TIMEZONES: z.record(z.string()).default({
    UK: 'Europe/London',
    EU: 'Europe/Paris',
    USA: 'America/New_York',
    CA: 'America/Toronto',
    AU: 'Australia/Sydney'
  }),
  FX_PROVIDER: z.enum(['oanda', 'ecb', 'currencyapi']).default('ecb'),
  FX_API_KEY: z.string().optional(),
  COMPLIANCE_FEATURES: z.object({
    VAT_ENABLED: z.boolean().default(false),
    GDPR_ENABLED: z.boolean().default(true),
    US_SALES_TAX_ENABLED: z.boolean().default(false)
  }).default({}),
  FEATURE_FLAGS: z.object({
    GLOBAL_CFO_PRESET: z.boolean().default(false),
    MULTI_CURRENCY_SUPPORT: z.boolean().default(false),
    REGIONAL_HOLIDAYS: z.boolean().default(false),
    BOARD_PACK_EXPORT: z.boolean().default(false)
  }).default({})
});

// Environment variable mapping
const getEnvValue = (key, defaultValue) => {
  const envValue = process.env[key];
  if (!envValue) return defaultValue;
  
  // Handle arrays
  if (Array.isArray(defaultValue)) {
    return envValue.split(',').map(item => item.trim());
  }
  
  // Handle objects
  if (typeof defaultValue === 'object' && defaultValue !== null) {
    try {
      return JSON.parse(envValue);
    } catch {
      return defaultValue;
    }
  }
  
  // Handle booleans
  if (typeof defaultValue === 'boolean') {
    return envValue.toLowerCase() === 'true';
  }
  
  return envValue;
};

// Load configuration from environment with defaults
const loadGlobalConfig = () => {
  const config = {
    DEFAULT_BASE_CURRENCY: getEnvValue('GLOBAL_DEFAULT_BASE_CURRENCY', 'GBP'),
    SUPPORTED_CURRENCIES: getEnvValue('GLOBAL_SUPPORTED_CURRENCIES', ['GBP', 'EUR', 'USD']),
    SUPPORTED_REGIONS: getEnvValue('GLOBAL_SUPPORTED_REGIONS', ['UK', 'EU', 'USA']),
    DEFAULT_LOCALE: getEnvValue('GLOBAL_DEFAULT_LOCALE', 'en-GB'),
    AVAILABLE_LOCALES: getEnvValue('GLOBAL_AVAILABLE_LOCALES', ['en-GB', 'en-US', 'de-DE', 'fr-FR']),
    TIMEZONES: getEnvValue('GLOBAL_TIMEZONES', {
      UK: 'Europe/London',
      EU: 'Europe/Paris',
      USA: 'America/New_York',
      CA: 'America/Toronto',
      AU: 'Australia/Sydney'
    }),
    FX_PROVIDER: getEnvValue('GLOBAL_FX_PROVIDER', 'ecb'),
    FX_API_KEY: getEnvValue('GLOBAL_FX_API_KEY', ''),
    COMPLIANCE_FEATURES: getEnvValue('GLOBAL_COMPLIANCE_FEATURES', {
      VAT_ENABLED: false,
      GDPR_ENABLED: true,
      US_SALES_TAX_ENABLED: false
    }),
    FEATURE_FLAGS: getEnvValue('GLOBAL_FEATURE_FLAGS', {
      GLOBAL_CFO_PRESET: false,
      MULTI_CURRENCY_SUPPORT: false,
      REGIONAL_HOLIDAYS: false,
      BOARD_PACK_EXPORT: false
    })
  };

  try {
    return GlobalConfigSchema.parse(config);
  } catch (error) {
    console.error('Global configuration validation failed:', error.errors);
    // Return default configuration if validation fails
    return GlobalConfigSchema.parse({});
  }
};

// Global configuration instance
const GLOBAL_CONFIG = loadGlobalConfig();

// Helper functions for configuration access
export const getGlobalConfig = () => GLOBAL_CONFIG;

export const getCurrency = (region = null) => {
  if (!region) return GLOBAL_CONFIG.DEFAULT_BASE_CURRENCY;
  
  const regionCurrencyMap = {
    UK: 'GBP',
    EU: 'EUR',
    USA: 'USD',
    CA: 'CAD',
    AU: 'AUD'
  };
  
  return regionCurrencyMap[region] || GLOBAL_CONFIG.DEFAULT_BASE_CURRENCY;
};

export const getLocale = (region = null) => {
  if (!region) return GLOBAL_CONFIG.DEFAULT_LOCALE;
  
  const regionLocaleMap = {
    UK: 'en-GB',
    EU: 'de-DE', // Default to German, could be made configurable
    USA: 'en-US',
    CA: 'en-US', // or 'fr-CA' for French Canada
    AU: 'en-AU'
  };
  
  const locale = regionLocaleMap[region] || GLOBAL_CONFIG.DEFAULT_LOCALE;
  return GLOBAL_CONFIG.AVAILABLE_LOCALES.includes(locale) ? locale : GLOBAL_CONFIG.DEFAULT_LOCALE;
};

export const getTimezone = (region = null) => {
  if (!region) return GLOBAL_CONFIG.TIMEZONES.UK;
  
  return GLOBAL_CONFIG.TIMEZONES[region] || GLOBAL_CONFIG.TIMEZONES.UK;
};

export const isFeatureEnabled = (featureName) => {
  return GLOBAL_CONFIG.FEATURE_FLAGS[featureName] || false;
};

export const getSupportedCurrencies = () => GLOBAL_CONFIG.SUPPORTED_CURRENCIES;

export const getSupportedRegions = () => GLOBAL_CONFIG.SUPPORTED_REGIONS;

export const getAvailableLocales = () => GLOBAL_CONFIG.AVAILABLE_LOCALES;

export const getFxConfig = () => ({
  provider: GLOBAL_CONFIG.FX_PROVIDER,
  apiKey: GLOBAL_CONFIG.FX_API_KEY
});

export const getComplianceConfig = () => GLOBAL_CONFIG.COMPLIANCE_FEATURES;

// Format number according to locale and currency
export const formatCurrency = (amount, currency = null, locale = null) => {
  const actualCurrency = currency || GLOBAL_CONFIG.DEFAULT_BASE_CURRENCY;
  const actualLocale = locale || GLOBAL_CONFIG.DEFAULT_LOCALE;
  
  try {
    return new Intl.NumberFormat(actualLocale, {
      style: 'currency',
      currency: actualCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback to basic formatting
    return `${actualCurrency} ${amount.toFixed(2)}`;
  }
};

// Format date according to locale and timezone
export const formatDate = (date, locale = null, timezone = null, options = {}) => {
  const actualLocale = locale || GLOBAL_CONFIG.DEFAULT_LOCALE;
  const actualTimezone = timezone || GLOBAL_CONFIG.TIMEZONES.UK;
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: actualTimezone,
    ...options
  };
  
  try {
    return new Intl.DateTimeFormat(actualLocale, defaultOptions).format(new Date(date));
  } catch (error) {
    // Fallback to ISO string
    return new Date(date).toISOString().split('T')[0];
  }
};

// Get regional holiday calendar configuration (placeholder)
export const getHolidayConfig = (region = 'UK') => {
  // This would be expanded to integrate with holiday providers
  const holidayProviders = {
    UK: { provider: 'uk-gov', apiKey: process.env.UK_HOLIDAY_API_KEY },
    EU: { provider: 'european-central-bank', apiKey: process.env.EU_HOLIDAY_API_KEY },
    USA: { provider: 'federal-reserve', apiKey: process.env.US_HOLIDAY_API_KEY }
  };
  
  return holidayProviders[region] || holidayProviders.UK;
};

// CFO Dashboard preset configuration
export const getCFODashboardPreset = () => {
  if (!isFeatureEnabled('GLOBAL_CFO_PRESET')) {
    return null;
  }
  
  return {
    layoutKey: 'cfo_global',
    name: 'CFO Global Dashboard',
    description: 'Consolidated financial view with regional tabs',
    defaultFilters: {
      regions: GLOBAL_CONFIG.SUPPORTED_REGIONS,
      currency: GLOBAL_CONFIG.DEFAULT_BASE_CURRENCY,
      consolidatedView: true
    },
    widgets: [
      {
        id: 'kpi_strip_global',
        type: 'kpi_strip',
        config: {
          metrics: [
            'forecast_accuracy_pct',
            'ccc_trend',
            'min_cash_90d',
            'facility_utilization',
            'wc_unlocked_qtd'
          ],
          regional: true
        }
      },
      {
        id: 'regional_tabs',
        type: 'regional_tabs',
        config: {
          regions: GLOBAL_CONFIG.SUPPORTED_REGIONS,
          defaultRegion: 'UK'
        }
      }
    ]
  };
};

// Audit configuration changes
export const auditConfigChange = (userId, changes, previousConfig) => {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    userId,
    changes,
    previousConfig: previousConfig || {},
    newConfig: GLOBAL_CONFIG
  };
  
  // In production, this would send to audit log service
  console.log('Configuration audit:', auditEntry);
  return auditEntry;
};

// Export default configuration for direct access
export default GLOBAL_CONFIG;