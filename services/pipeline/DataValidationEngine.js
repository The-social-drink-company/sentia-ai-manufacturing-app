/**
 * Enterprise Data Validation and Cleansing Engine
 * Fortune 500-grade data quality management for Sentia Spirits
 *
 * NO MOCK DATA - Production data validation only
 */

import Joi from 'joi';
import { z } from 'zod';
import validator from 'validator';
import { parse, isValid, format } from 'date-fns';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

export class DataValidationEngine {
  constructor() {
    this.validationRules = new Map();
    this.cleansingRules = new Map();
    this.anomalyDetectors = new Map();
    this.validationMetrics = {
      totalValidated: 0,
      totalCleansed: 0,
      errorsDetected: 0,
      anomaliesDetected: 0,
      dataQualityScore: 100
    };

    this.initializeValidationSchemas();
    this.initializeCleansingRules();
    this.initializeAnomalyDetection();
  }

  /**
   * Initialize validation schemas for different data types
   */
  initializeValidationSchemas() {
    // Financial transaction schema
    this.validationRules.set('financial_transaction', z.object({
      transactionId: z.string().min(1),
      date: z.string().refine(val => isValid(new Date(val))),
      amount: z.number().finite(),
      currency: z.enum(['USD', 'EUR', 'GBP', 'AUD', 'NZD']),
      type: z.enum(['sale', 'purchase', 'payment', 'receipt', 'adjustment']),
      accountCode: z.string().regex(/^[0-9]{4,6}$/),
      description: z.string().max(500),
      vatRate: z.number().min(0).max(100).optional(),
      customerOrSupplier: z.object({
        id: z.string(),
        name: z.string(),
        taxNumber: z.string().optional()
      }).optional(),
      metadata: z.record(z.any()).optional()
    }));

    // Inventory movement schema
    this.validationRules.set('inventory_movement', z.object({
      movementId: z.string().min(1),
      productCode: z.string().min(1),
      productName: z.string(),
      quantity: z.number().int(),
      unitOfMeasure: z.enum(['units', 'cases', 'pallets', 'liters', 'kilograms']),
      movementType: z.enum(['receipt', 'issue', 'adjustment', 'transfer', 'production']),
      location: z.string(),
      date: z.string().refine(val => isValid(new Date(val))),
      batchNumber: z.string().optional(),
      expiryDate: z.string().refine(val => !val || isValid(new Date(val))).optional(),
      costPerUnit: z.number().positive().optional(),
      metadata: z.record(z.any()).optional()
    }));

    // Sales order schema
    this.validationRules.set('sales_order', z.object({
      orderId: z.string().min(1),
      customerId: z.string().min(1),
      orderDate: z.string().refine(val => isValid(new Date(val))),
      deliveryDate: z.string().refine(val => isValid(new Date(val))),
      status: z.enum(['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
      items: z.array(z.object({
        productCode: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        discount: z.number().min(0).max(100).optional(),
        tax: z.number().min(0).optional()
      })),
      totalAmount: z.number().positive(),
      currency: z.string().length(3),
      paymentTerms: z.string().optional(),
      shippingAddress: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string().optional(),
        postalCode: z.string(),
        country: z.string()
      }).optional()
    }));

    // Production batch schema
    this.validationRules.set('production_batch', z.object({
      batchId: z.string().min(1),
      productCode: z.string(),
      startDate: z.string().refine(val => isValid(new Date(val))),
      endDate: z.string().refine(val => isValid(new Date(val))).optional(),
      plannedQuantity: z.number().positive(),
      actualQuantity: z.number().min(0).optional(),
      status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
      ingredients: z.array(z.object({
        materialCode: z.string(),
        quantity: z.number().positive(),
        unit: z.string(),
        batchNumber: z.string().optional()
      })),
      qualityMetrics: z.object({
        ph: z.number().min(0).max(14).optional(),
        brix: z.number().min(0).max(100).optional(),
        alcohol: z.number().min(0).max(100).optional(),
        temperature: z.number().optional()
      }).optional(),
      costBreakdown: z.object({
        materials: z.number().min(0),
        labor: z.number().min(0),
        overhead: z.number().min(0)
      }).optional()
    }));

    // Cash flow schema
    this.validationRules.set('cash_flow', z.object({
      period: z.string(),
      date: z.string().refine(val => isValid(new Date(val))),
      openingBalance: z.number(),
      receipts: z.object({
        sales: z.number(),
        otherIncome: z.number(),
        financingActivities: z.number().optional()
      }),
      payments: z.object({
        purchases: z.number(),
        wages: z.number(),
        rent: z.number(),
        utilities: z.number(),
        tax: z.number(),
        other: z.number()
      }),
      closingBalance: z.number(),
      metadata: z.record(z.any()).optional()
    }));

    logInfo('Data validation schemas initialized', {
      schemas: Array.from(this.validationRules.keys())
    });
  }

  /**
   * Initialize data cleansing rules
   */
  initializeCleansingRules() {
    // Date cleansing rules
    this.cleansingRules.set('date', {
      cleanser: (value) => {
        if (!value) return null;

        // Try multiple date formats
        const formats = [
          'yyyy-MM-dd',
          'MM/dd/yyyy',
          'dd/MM/yyyy',
          'yyyy-MM-dd HH:mm:ss',
          'MM-dd-yyyy',
          'dd-MM-yyyy'
        ];

        for (const fmt of formats) {
          try {
            const parsed = parse(value, fmt, new Date());
            if (isValid(parsed)) {
              return format(parsed, 'yyyy-MM-dd');
            }
          } catch (e) {
            // Try next format
          }
        }

        // Try JS Date parsing as fallback
        const date = new Date(value);
        if (isValid(date)) {
          return format(date, 'yyyy-MM-dd');
        }

        throw new Error(`Invalid date: ${value}`);
      }
    });

    // Currency amount cleansing
    this.cleansingRules.set('currency', {
      cleanser: (value) => {
        if (typeof value === 'number') return value;
        if (!value) return 0;

        // Remove currency symbols and thousands separators
        const cleaned = String(value)
          .replace(/[^0-9.-]/g, '')
          .replace(/,/g, '');

        const parsed = parseFloat(cleaned);
        if (isNaN(parsed)) {
          throw new Error(`Invalid currency amount: ${value}`);
        }

        return Math.round(parsed * 100) / 100; // Round to 2 decimal places
      }
    });

    // String cleansing
    this.cleansingRules.set('string', {
      cleanser: (value) => {
        if (!value) return '';

        return String(value)
          .trim()
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
          .substring(0, 1000); // Limit length
      }
    });

    // Email cleansing
    this.cleansingRules.set('email', {
      cleanser: (value) => {
        if (!value) return null;

        const cleaned = String(value).toLowerCase().trim();
        if (!validator.isEmail(cleaned)) {
          throw new Error(`Invalid email: ${value}`);
        }

        return cleaned;
      }
    });

    // Phone number cleansing
    this.cleansingRules.set('phone', {
      cleanser: (value) => {
        if (!value) return null;

        const cleaned = String(value).replace(/[^0-9+]/g, '');
        if (cleaned.length < 10 || cleaned.length > 15) {
          throw new Error(`Invalid phone number: ${value}`);
        }

        return cleaned;
      }
    });

    // Tax number cleansing
    this.cleansingRules.set('taxNumber', {
      cleanser: (value) => {
        if (!value) return null;

        const cleaned = String(value)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '');

        // Basic validation for common tax number formats
        if (cleaned.length < 9 || cleaned.length > 15) {
          throw new Error(`Invalid tax number: ${value}`);
        }

        return cleaned;
      }
    });

    logInfo('Data cleansing rules initialized', {
      rules: Array.from(this.cleansingRules.keys())
    });
  }

  /**
   * Initialize anomaly detection algorithms
   */
  initializeAnomalyDetection() {
    // Z-score based anomaly detection for numerical values
    this.anomalyDetectors.set('zscore', {
      detect: (values, threshold = 3) => {
        if (!Array.isArray(values) || values.length < 3) return [];

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        return values.map((value, index) => {
          const zScore = Math.abs((value - mean) / stdDev);
          return {
            index,
            value,
            zScore,
            isAnomaly: zScore > threshold
          };
        }).filter(item => item.isAnomaly);
      }
    });

    // Interquartile range (IQR) anomaly detection
    this.anomalyDetectors.set('iqr', {
      detect: (values, multiplier = 1.5) => {
        if (!Array.isArray(values) || values.length < 4) return [];

        const sorted = [...values].sort((a, b) => a - b);
        const q1Index = Math.floor(sorted.length * 0.25);
        const q3Index = Math.floor(sorted.length * 0.75);

        const q1 = sorted[q1Index];
        const q3 = sorted[q3Index];
        const iqr = q3 - q1;

        const lowerBound = q1 - (multiplier * iqr);
        const upperBound = q3 + (multiplier * iqr);

        return values.map((value, index) => ({
          index,
          value,
          isAnomaly: value < lowerBound || value > upperBound
        })).filter(item => item.isAnomaly);
      }
    });

    // Time series anomaly detection
    this.anomalyDetectors.set('timeseries', {
      detect: (data, windowSize = 7) => {
        if (!Array.isArray(data) || data.length < windowSize) return [];

        const anomalies = [];

        for (let i = windowSize; i < data.length; i++) {
          const window = data.slice(i - windowSize, i);
          const mean = window.reduce((a, b) => a + b.value, 0) / window.length;
          const stdDev = Math.sqrt(
            window.reduce((a, b) => a + Math.pow(b.value - mean, 2), 0) / window.length
          );

          const current = data[i];
          const zScore = Math.abs((current.value - mean) / stdDev);

          if (zScore > 2.5) {
            anomalies.push({
              index: i,
              date: current.date,
              value: current.value,
              expectedRange: {
                min: mean - (2.5 * stdDev),
                max: mean + (2.5 * stdDev)
              },
              zScore
            });
          }
        }

        return anomalies;
      }
    });

    logInfo('Anomaly detection algorithms initialized', {
      algorithms: Array.from(this.anomalyDetectors.keys())
    });
  }

  /**
   * Validate data against schema
   */
  async validateData(type, data) {
    try {
      const schema = this.validationRules.get(type);
      if (!schema) {
        throw new Error(`No validation schema found for type: ${type}`);
      }

      const result = await schema.safeParseAsync(data);

      this.validationMetrics.totalValidated++;

      if (!result.success) {
        this.validationMetrics.errorsDetected++;

        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        logWarn('Data validation failed', {
          type,
          errors,
          sample: JSON.stringify(data).substring(0, 200)
        });

        return {
          valid: false,
          errors,
          qualityScore: this.calculateQualityScore(errors.length, Object.keys(data).length)
        };
      }

      return {
        valid: true,
        data: result.data,
        qualityScore: 100
      };
    } catch (error) {
      logError('Validation error', error);
      throw error;
    }
  }

  /**
   * Cleanse data based on field types
   */
  async cleanseData(data, fieldMappings) {
    try {
      const cleansed = {};
      const issues = [];

      for (const [field, type] of Object.entries(fieldMappings)) {
        const cleanser = this.cleansingRules.get(type);

        if (!cleanser) {
          cleansed[field] = data[field];
          continue;
        }

        try {
          cleansed[field] = cleanser.cleanser(data[field]);
          this.validationMetrics.totalCleansed++;
        } catch (error) {
          issues.push({
            field,
            originalValue: data[field],
            error: error.message
          });
          cleansed[field] = null; // Set to null if cleansing fails
        }
      }

      // Copy over any unmapped fields
      for (const [field, value] of Object.entries(data)) {
        if (!(field in cleansed)) {
          cleansed[field] = value;
        }
      }

      if (issues.length > 0) {
        logWarn('Data cleansing issues detected', {
          issueCount: issues.length,
          issues: issues.slice(0, 5) // Log first 5 issues
        });
      }

      return {
        data: cleansed,
        issues,
        cleansingScore: ((Object.keys(cleansed).length - issues.length) / Object.keys(cleansed).length) * 100
      };
    } catch (error) {
      logError('Cleansing error', error);
      throw error;
    }
  }

  /**
   * Detect anomalies in dataset
   */
  async detectAnomalies(data, config = {}) {
    try {
      const {
        algorithm = 'zscore',
        field = 'value',
        threshold = 3
      } = config;

      const detector = this.anomalyDetectors.get(algorithm);
      if (!detector) {
        throw new Error(`Unknown anomaly detection algorithm: ${algorithm}`);
      }

      let values;
      if (algorithm === 'timeseries') {
        values = data; // Expects array of objects with date and value
      } else {
        values = data.map(item =>
          typeof item === 'object' ? item[field] : item
        ).filter(v => typeof v === 'number');
      }

      const anomalies = detector.detect(values, threshold);

      if (anomalies.length > 0) {
        this.validationMetrics.anomaliesDetected += anomalies.length;

        logWarn('Anomalies detected in data', {
          algorithm,
          count: anomalies.length,
          samples: anomalies.slice(0, 3)
        });
      }

      return {
        anomalies,
        anomalyRate: (anomalies.length / data.length) * 100,
        algorithm,
        threshold
      };
    } catch (error) {
      logError('Anomaly detection error', error);
      throw error;
    }
  }

  /**
   * Validate batch of records
   */
  async validateBatch(records, type) {
    const results = {
      valid: [],
      invalid: [],
      totalProcessed: records.length,
      successRate: 0
    };

    for (let i = 0; i < records.length; i++) {
      try {
        const validation = await this.validateData(type, records[i]);

        if (validation.valid) {
          results.valid.push({
            index: i,
            data: validation.data
          });
        } else {
          results.invalid.push({
            index: i,
            errors: validation.errors,
            data: records[i]
          });
        }
      } catch (error) {
        results.invalid.push({
          index: i,
          errors: [{ message: error.message }],
          data: records[i]
        });
      }
    }

    results.successRate = (results.valid.length / results.totalProcessed) * 100;

    // Update overall data quality score
    this.updateDataQualityScore(results.successRate);

    return results;
  }

  /**
   * Perform comprehensive data quality check
   */
  async performQualityCheck(data, config = {}) {
    const qualityReport = {
      timestamp: new Date().toISOString(),
      totalRecords: Array.isArray(data) ? data.length : 1,
      checks: [],
      overallScore: 0,
      recommendations: []
    };

    // Completeness check
    const completeness = this.checkCompleteness(data);
    qualityReport.checks.push({
      type: 'completeness',
      score: completeness.score,
      details: completeness
    });

    // Consistency check
    const consistency = this.checkConsistency(data);
    qualityReport.checks.push({
      type: 'consistency',
      score: consistency.score,
      details: consistency
    });

    // Accuracy check (if reference data provided)
    if (config.referenceData) {
      const accuracy = this.checkAccuracy(data, config.referenceData);
      qualityReport.checks.push({
        type: 'accuracy',
        score: accuracy.score,
        details: accuracy
      });
    }

    // Timeliness check
    const timeliness = this.checkTimeliness(data, config.maxAge);
    qualityReport.checks.push({
      type: 'timeliness',
      score: timeliness.score,
      details: timeliness
    });

    // Calculate overall score
    qualityReport.overallScore = qualityReport.checks.reduce((sum, check) =>
      sum + check.score, 0
    ) / qualityReport.checks.length;

    // Generate recommendations
    qualityReport.recommendations = this.generateQualityRecommendations(qualityReport);

    return qualityReport;
  }

  /**
   * Check data completeness
   */
  checkCompleteness(data) {
    const records = Array.isArray(data) ? data : [data];
    let totalFields = 0;
    let missingFields = 0;
    const missingByField = {};

    records.forEach(record => {
      Object.entries(record).forEach(([field, value]) => {
        totalFields++;
        if (value === null || value === undefined || value === '') {
          missingFields++;
          missingByField[field] = (missingByField[field] || 0) + 1;
        }
      });
    });

    return {
      score: ((totalFields - missingFields) / totalFields) * 100,
      totalFields,
      missingFields,
      missingByField,
      completenessRate: ((totalFields - missingFields) / totalFields) * 100
    };
  }

  /**
   * Check data consistency
   */
  checkConsistency(data) {
    const records = Array.isArray(data) ? data : [data];
    const inconsistencies = [];
    const fieldPatterns = new Map();

    // Build field patterns
    records.forEach((record, index) => {
      Object.entries(record).forEach(([field, value]) => {
        if (!fieldPatterns.has(field)) {
          fieldPatterns.set(field, new Set());
        }

        // Track data type patterns
        const dataType = value === null ? 'null' : typeof value;
        fieldPatterns.get(field).add(dataType);
      });
    });

    // Check for inconsistencies
    fieldPatterns.forEach((patterns, field) => {
      if (patterns.size > 1 && !patterns.has('null')) {
        inconsistencies.push({
          field,
          types: Array.from(patterns)
        });
      }
    });

    return {
      score: ((fieldPatterns.size - inconsistencies.length) / fieldPatterns.size) * 100,
      totalFields: fieldPatterns.size,
      inconsistencies,
      consistencyRate: ((fieldPatterns.size - inconsistencies.length) / fieldPatterns.size) * 100
    };
  }

  /**
   * Check data accuracy against reference
   */
  checkAccuracy(data, referenceData) {
    const records = Array.isArray(data) ? data : [data];
    const references = Array.isArray(referenceData) ? referenceData : [referenceData];

    let matches = 0;
    let mismatches = 0;
    const mismatchDetails = [];

    records.forEach((record, index) => {
      const ref = references[index];
      if (!ref) return;

      Object.entries(record).forEach(([field, value]) => {
        if (field in ref) {
          if (value === ref[field]) {
            matches++;
          } else {
            mismatches++;
            if (mismatchDetails.length < 10) { // Limit detail collection
              mismatchDetails.push({
                index,
                field,
                actual: value,
                expected: ref[field]
              });
            }
          }
        }
      });
    });

    return {
      score: (matches / (matches + mismatches)) * 100,
      matches,
      mismatches,
      mismatchDetails,
      accuracyRate: (matches / (matches + mismatches)) * 100
    };
  }

  /**
   * Check data timeliness
   */
  checkTimeliness(data, maxAgeHours = 24) {
    const records = Array.isArray(data) ? data : [data];
    const now = new Date();
    let fresh = 0;
    let stale = 0;
    const staleRecords = [];

    records.forEach((record, index) => {
      // Look for date fields
      const dateFields = ['date', 'timestamp', 'createdAt', 'updatedAt', 'lastModified'];
      let recordDate = null;

      for (const field of dateFields) {
        if (record[field]) {
          recordDate = new Date(record[field]);
          break;
        }
      }

      if (recordDate && isValid(recordDate)) {
        const ageHours = (now - recordDate) / (1000 * 60 * 60);

        if (ageHours <= maxAgeHours) {
          fresh++;
        } else {
          stale++;
          staleRecords.push({
            index,
            ageHours: Math.round(ageHours),
            date: recordDate.toISOString()
          });
        }
      }
    });

    const totalWithDates = fresh + stale;

    return {
      score: totalWithDates > 0 ? (fresh / totalWithDates) * 100 : 0,
      fresh,
      stale,
      staleRecords: staleRecords.slice(0, 10), // Limit details
      timelinessRate: totalWithDates > 0 ? (fresh / totalWithDates) * 100 : 0,
      maxAgeHours
    };
  }

  /**
   * Generate quality recommendations
   */
  generateQualityRecommendations(qualityReport) {
    const recommendations = [];

    qualityReport.checks.forEach(check => {
      if (check.score < 70) {
        switch (check.type) {
          case 'completeness':
            recommendations.push({
              type: 'completeness',
              priority: 'high',
              message: `Data completeness is ${check.score.toFixed(1)}%. Review required fields and data collection processes.`,
              action: 'Implement mandatory field validation and default value strategies'
            });
            break;

          case 'consistency':
            recommendations.push({
              type: 'consistency',
              priority: 'medium',
              message: `Data consistency is ${check.score.toFixed(1)}%. Standardize data formats and types.`,
              action: 'Apply data type enforcement and format normalization'
            });
            break;

          case 'accuracy':
            recommendations.push({
              type: 'accuracy',
              priority: 'high',
              message: `Data accuracy is ${check.score.toFixed(1)}%. Significant discrepancies detected.`,
              action: 'Investigate data sources and implement validation rules'
            });
            break;

          case 'timeliness':
            recommendations.push({
              type: 'timeliness',
              priority: 'medium',
              message: `Data freshness is ${check.score.toFixed(1)}%. Update data ingestion frequency.`,
              action: 'Increase polling frequency or implement real-time data streaming'
            });
            break;
        }
      }
    });

    // Add overall recommendations
    if (qualityReport.overallScore < 80) {
      recommendations.push({
        type: 'overall',
        priority: 'high',
        message: `Overall data quality score is ${qualityReport.overallScore.toFixed(1)}%. Comprehensive data quality improvement needed.`,
        action: 'Implement data governance framework and quality monitoring dashboard'
      });
    }

    return recommendations;
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore(errors, total) {
    if (total === 0) return 0;
    return Math.max(0, ((total - errors) / total) * 100);
  }

  /**
   * Update overall data quality score
   */
  updateDataQualityScore(latestScore) {
    // Weighted average with recent scores having more weight
    this.validationMetrics.dataQualityScore =
      (this.validationMetrics.dataQualityScore * 0.7) + (latestScore * 0.3);
  }

  /**
   * Get validation metrics
   */
  getMetrics() {
    return {
      ...this.validationMetrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.validationMetrics = {
      totalValidated: 0,
      totalCleansed: 0,
      errorsDetected: 0,
      anomaliesDetected: 0,
      dataQualityScore: 100
    };

    logInfo('Validation metrics reset');
  }
}

export default DataValidationEngine;