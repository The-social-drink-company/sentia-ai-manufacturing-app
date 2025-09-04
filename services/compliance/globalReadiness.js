import { logInfo, logWarn, logBusinessEvent } from '../observability/structuredLogger.js';
import crypto from 'crypto';

// Global compliance configuration
const COMPLIANCE_CONFIG = {
  REGIONAL_HINT: process.env.REGIONAL_HINT || 'EU',
  DATA_RESIDENCY_REGION: process.env.DATA_RESIDENCY_REGION || 'eu',
  PII_REDACTION_ENABLED: process.env.PII_REDACTION_ENABLED === 'true',
  PII_RETENTION_DAYS: parseInt(process.env.PII_RETENTION_DAYS) || 365,
  FEATURE_BOARD_MODE: process.env.FEATURE_BOARD_MODE === 'true',
  GDPR_ENABLED: true,
  CCPA_ENABLED: false,
  FX_PROVIDER: process.env.FX_PROVIDER,
  FX_API_KEY: process.env.FX_API_KEY,
  FX_PULL_CRON: process.env.FX_PULL_CRON || '0 1 * * *'
};

// Regional configuration
const REGIONAL_CONFIG = {
  EU: {
    dataCenter: 'eu-west1',
    currency: 'EUR',
    locale: 'en-GB',
    timezone: 'Europe/London',
    regulations: ['GDPR', 'MiFID II'],
    vatEnabled: true,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: '€'
    }
  },
  US: {
    dataCenter: 'us-east1',
    currency: 'USD',
    locale: 'en-US',
    timezone: 'America/New_York',
    regulations: ['CCPA', 'SOX'],
    salesTaxEnabled: true,
    dateFormat: 'MM/DD/YYYY',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: '$'
    }
  },
  APAC: {
    dataCenter: 'asia-southeast1',
    currency: 'SGD',
    locale: 'en-SG',
    timezone: 'Asia/Singapore',
    regulations: ['PDPA'],
    gstEnabled: true,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: 'S$'
    }
  }
};

// PII field definitions
const PII_FIELDS = [
  'email', 'phone', 'mobile', 'ssn', 'taxId', 'nationalId',
  'passport', 'driverLicense', 'bankAccount', 'creditCard',
  'address', 'streetAddress', 'postalCode', 'dateOfBirth',
  'fullName', 'firstName', 'lastName', 'middleName'
];

// Compliance service class
export class ComplianceService {
  constructor() {
    this.region = this.detectRegion();
    this.config = REGIONAL_CONFIG[this.region] || REGIONAL_CONFIG.EU;
    this.boardModeActive = false;
  }
  
  detectRegion() {
    // Priority: Environment variable > Request header > Default
    return COMPLIANCE_CONFIG.REGIONAL_HINT || 'EU';
  }
  
  // PII redaction
  redactPII(data, fields = PII_FIELDS) {
    if (!COMPLIANCE_CONFIG.PII_REDACTION_ENABLED) {
      return data;
    }
    
    const redacted = { ...data };
    
    for (const field of fields) {
      if (redacted[field]) {
        redacted[field] = this.redactValue(redacted[field], field);
      }
      
      // Handle nested objects
      for (const key in redacted) {
        if (typeof redacted[key] === 'object' && redacted[key] !== null) {
          redacted[key] = this.redactPII(redacted[key], fields);
        }
      }
    }
    
    return redacted;
  }
  
  redactValue(value, fieldType) {
    const str = String(value);
    
    switch (fieldType) {
      case 'email':
        const [localPart, domain] = str.split('@');
        return localPart.substring(0, 2) + '***@' + domain;
      
      case 'phone':
      case 'mobile':
        return str.substring(0, 3) + '****' + str.substring(str.length - 2);
      
      case 'creditCard':
        return '**** **** **** ' + str.substring(str.length - 4);
      
      case 'ssn':
      case 'taxId':
      case 'nationalId':
        return '***-**-' + str.substring(str.length - 4);
      
      default:
        if (str.length <= 3) {
          return '***';
        }
        return str.substring(0, 1) + '***' + str.substring(str.length - 1);
    }
  }
  
  // Data retention check
  shouldRetainData(createdAt) {
    const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays <= COMPLIANCE_CONFIG.PII_RETENTION_DAYS;
  }
  
  // GDPR compliance
  async handleGDPRRequest(type, userId, data = {}) {
    logBusinessEvent('GDPR_request', {
      type,
      userId: this.hashUserId(userId),
      region: this.region
    });
    
    switch (type) {
      case 'ACCESS':
        return await this.handleDataAccess(userId);
      
      case 'PORTABILITY':
        return await this.handleDataPortability(userId);
      
      case 'ERASURE':
        return await this.handleDataErasure(userId);
      
      case 'RECTIFICATION':
        return await this.handleDataRectification(userId, data);
      
      case 'RESTRICTION':
        return await this.handleProcessingRestriction(userId, data);
      
      default:
        throw new Error(`Unknown GDPR request type: ${type}`);
    }
  }
  
  async handleDataAccess(userId) {
    // Implementation would fetch all user data
    return {
      status: 'pending',
      requestId: crypto.randomBytes(16).toString('hex'),
      estimatedCompletion: new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours
    };
  }
  
  async handleDataPortability(userId) {
    // Implementation would export data in machine-readable format
    return {
      status: 'processing',
      format: 'JSON',
      compressionType: 'gzip'
    };
  }
  
  async handleDataErasure(userId) {
    // Implementation would schedule data deletion
    return {
      status: 'scheduled',
      scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      dataCategories: ['personal', 'usage', 'preferences']
    };
  }
  
  async handleDataRectification(userId, corrections) {
    // Implementation would update incorrect data
    return {
      status: 'completed',
      fieldsUpdated: Object.keys(corrections),
      timestamp: new Date().toISOString()
    };
  }
  
  async handleProcessingRestriction(userId, restrictions) {
    // Implementation would restrict data processing
    return {
      status: 'applied',
      restrictions: restrictions,
      effectiveDate: new Date().toISOString()
    };
  }
  
  // Hash user ID for logging
  hashUserId(userId) {
    return crypto
      .createHash('sha256')
      .update(userId + (process.env.USER_HASH_SALT || 'default-salt'))
      .digest('hex')
      .substring(0, 16);
  }
  
  // Board mode management
  enableBoardMode(duration = 3600000) { // 1 hour default
    if (!COMPLIANCE_CONFIG.FEATURE_BOARD_MODE) {
      return false;
    }
    
    this.boardModeActive = true;
    this.boardModeExpiry = Date.now() + duration;
    
    logBusinessEvent('Board_mode_enabled', {
      duration,
      expiryTime: new Date(this.boardModeExpiry).toISOString()
    });
    
    // Schedule automatic disable
    setTimeout(() => this.disableBoardMode(), duration);
    
    return true;
  }
  
  disableBoardMode() {
    this.boardModeActive = false;
    this.boardModeExpiry = null;
    
    logBusinessEvent('Board_mode_disabled');
  }
  
  isBoardModeActive() {
    if (!this.boardModeActive) {
      return false;
    }
    
    if (this.boardModeExpiry && Date.now() > this.boardModeExpiry) {
      this.disableBoardMode();
      return false;
    }
    
    return true;
  }
  
  // Data export for board mode
  async generateBoardExport(data) {
    if (!this.isBoardModeActive()) {
      throw new Error('Board mode not active');
    }
    
    // Redact sensitive information
    const sanitized = this.redactPII(data);
    
    // Add watermark and metadata
    return {
      ...sanitized,
      _metadata: {
        exported: new Date().toISOString(),
        boardMode: true,
        region: this.region,
        sanitized: true,
        watermark: 'CONFIDENTIAL - BOARD REVIEW ONLY'
      }
    };
  }
  
  // Regional latency optimization
  getOptimalEndpoint(service) {
    const endpoints = {
      EU: {
        api: 'https://eu.api.sentia.com',
        cdn: 'https://eu-cdn.sentia.com',
        storage: 'https://eu-storage.sentia.com'
      },
      US: {
        api: 'https://us.api.sentia.com',
        cdn: 'https://us-cdn.sentia.com',
        storage: 'https://us-storage.sentia.com'
      },
      APAC: {
        api: 'https://apac.api.sentia.com',
        cdn: 'https://apac-cdn.sentia.com',
        storage: 'https://apac-storage.sentia.com'
      }
    };
    
    return endpoints[this.region]?.[service] || endpoints.EU[service];
  }
  
  // Currency and FX support
  async getExchangeRates(baseCurrency = this.config.currency) {
    if (!COMPLIANCE_CONFIG.FX_PROVIDER || !COMPLIANCE_CONFIG.FX_API_KEY) {
      logWarn('FX provider not configured');
      return null;
    }
    
    try {
      // Implementation would call FX provider API
      const rates = await this.fetchFXRates(baseCurrency);
      
      logBusinessEvent('FX_rates_fetched', {
        baseCurrency,
        provider: COMPLIANCE_CONFIG.FX_PROVIDER,
        rateCount: Object.keys(rates).length
      });
      
      return rates;
    } catch (error) {
      logError('Failed to fetch FX rates', error);
      return null;
    }
  }
  
  async fetchFXRates(baseCurrency) {
    // Stub for FX rate fetching
    // Would integrate with ECB, OANDA, or other providers
    return {
      USD: 1.0,
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      AUD: 1.35,
      CAD: 1.25
    };
  }
  
  // Format values based on region
  formatCurrency(amount, currency = this.config.currency) {
    const formatter = new Intl.NumberFormat(this.config.locale, {
      style: 'currency',
      currency: currency
    });
    
    return formatter.format(amount);
  }
  
  formatDate(date, format = this.config.dateFormat) {
    const d = new Date(date);
    
    // Simple format replacement
    return format
      .replace('YYYY', d.getFullYear())
      .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(d.getDate()).padStart(2, '0'));
  }
  
  formatNumber(number) {
    const formatter = new Intl.NumberFormat(this.config.locale);
    return formatter.format(number);
  }
  
  // Compliance audit trail
  logComplianceEvent(event, details = {}) {
    logBusinessEvent('Compliance_event', {
      event,
      region: this.region,
      regulations: this.config.regulations,
      ...details
    });
  }
  
  // Get compliance status
  getComplianceStatus() {
    return {
      region: this.region,
      dataResidency: COMPLIANCE_CONFIG.DATA_RESIDENCY_REGION,
      regulations: this.config.regulations,
      features: {
        piiRedaction: COMPLIANCE_CONFIG.PII_REDACTION_ENABLED,
        dataRetention: COMPLIANCE_CONFIG.PII_RETENTION_DAYS,
        boardMode: COMPLIANCE_CONFIG.FEATURE_BOARD_MODE,
        gdpr: COMPLIANCE_CONFIG.GDPR_ENABLED,
        ccpa: COMPLIANCE_CONFIG.CCPA_ENABLED
      },
      boardMode: {
        active: this.isBoardModeActive(),
        expiry: this.boardModeExpiry ? new Date(this.boardModeExpiry).toISOString() : null
      }
    };
  }
}

// Express middleware for compliance
export const complianceMiddleware = (complianceService) => {
  return (req, res, next) => {
    // Attach compliance service to request
    req.compliance = complianceService;
    
    // Detect region from request
    const regionHeader = req.headers['x-region-hint'];
    if (regionHeader && REGIONAL_CONFIG[regionHeader]) {
      req.compliance.region = regionHeader;
      req.compliance.config = REGIONAL_CONFIG[regionHeader];
    }
    
    // Add compliance headers to response
    res.setHeader('X-Data-Region', req.compliance.region);
    res.setHeader('X-Compliance-Mode', req.compliance.config.regulations.join(', '));
    
    // Log if board mode is active
    if (req.compliance.isBoardModeActive()) {
      res.setHeader('X-Board-Mode', 'active');
    }
    
    next();
  };
};

// PII redaction middleware
export const piiRedactionMiddleware = (complianceService) => {
  return (req, res, next) => {
    // Override res.json to apply PII redaction
    const originalJson = res.json;
    
    res.json = function(data) {
      // Apply redaction if enabled and not in development
      if (COMPLIANCE_CONFIG.PII_REDACTION_ENABLED && 
          process.env.NODE_ENV !== 'development') {
        data = complianceService.redactPII(data);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// GDPR request handler
export const gdprRequestHandler = (complianceService) => {
  return async (req, res) => {
    const { type, userId, data } = req.body;
    
    try {
      const result = await complianceService.handleGDPRRequest(type, userId, data);
      res.json({
        success: true,
        result
      });
    } catch (error) {
      logError('GDPR request failed', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };
};

// Board mode endpoints
export const boardModeHandlers = (complianceService) => {
  return {
    enable: (req, res) => {
      const { duration } = req.body;
      const enabled = complianceService.enableBoardMode(duration);
      
      res.json({
        success: enabled,
        boardMode: complianceService.isBoardModeActive(),
        expiry: complianceService.boardModeExpiry
      });
    },
    
    disable: (req, res) => {
      complianceService.disableBoardMode();
      
      res.json({
        success: true,
        boardMode: false
      });
    },
    
    export: async (req, res) => {
      try {
        const exportData = await complianceService.generateBoardExport(req.body);
        
        res.json({
          success: true,
          data: exportData
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }
  };
};

// Create singleton instance
export const complianceService = new ComplianceService();

export default {
  ComplianceService,
  complianceService,
  complianceMiddleware,
  piiRedactionMiddleware,
  gdprRequestHandler,
  boardModeHandlers,
  COMPLIANCE_CONFIG,
  REGIONAL_CONFIG,
  PII_FIELDS
};