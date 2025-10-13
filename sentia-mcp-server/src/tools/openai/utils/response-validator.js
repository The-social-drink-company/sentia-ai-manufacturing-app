/**
 * Response Validator - OpenAI Integration
 * 
 * Response validation, quality assurance, and consistency checking.
 * Ensures AI responses meet quality standards and business requirements.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class ResponseValidator {
  constructor() {
    this.validationRules = new Map();
    this.qualityThresholds = new Map();
    this.isInitialized = false;
    
    logger.info('Response Validator initialized');
  }

  async initialize() {
    try {
      logger.info('Initializing Response Validator...');
      
      this.loadValidationRules();
      this.configureQualityThresholds();
      
      this.isInitialized = true;
      logger.info('Response Validator initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize Response Validator', { error: error.message });
      throw error;
    }
  }

  loadValidationRules() {
    // Content validation rules
    this.validationRules.set('content_completeness', {
      name: 'Content Completeness',
      validate: (response) => this.validateCompleteness(response)
    });

    this.validationRules.set('factual_consistency', {
      name: 'Factual Consistency',
      validate: (response) => this.validateFactualConsistency(response)
    });

    this.validationRules.set('business_relevance', {
      name: 'Business Relevance',
      validate: (response) => this.validateBusinessRelevance(response)
    });

    this.validationRules.set('manufacturing_accuracy', {
      name: 'Manufacturing Accuracy',
      validate: (response) => this.validateManufacturingAccuracy(response)
    });

    logger.info('Validation rules loaded', { ruleCount: this.validationRules.size });
  }

  configureQualityThresholds() {
    this.qualityThresholds.set('minimum_length', 100);
    this.qualityThresholds.set('maximum_length', 10000);
    this.qualityThresholds.set('confidence_threshold', 0.8);
    this.qualityThresholds.set('relevance_threshold', 0.7);
    
    logger.info('Quality thresholds configured');
  }

  validateResponse(response, context = {}) {
    try {
      const validationResult = {
        valid: true,
        score: 100,
        errors: [],
        warnings: [],
        suggestions: [],
        metrics: {}
      };

      // Basic structure validation
      if (!response || typeof response !== 'string') {
        validationResult.valid = false;
        validationResult.errors.push('Response must be a non-empty string');
        return validationResult;
      }

      // Length validation
      const lengthValidation = this.validateLength(response);
      if (!lengthValidation.valid) {
        validationResult.valid = false;
        validationResult.errors.push(...lengthValidation.errors);
      }

      // Apply all validation rules
      for (const [ruleName, rule] of this.validationRules) {
        try {
          const ruleResult = rule.validate(response, context);
          
          if (!ruleResult.valid) {
            validationResult.score -= ruleResult.impact || 10;
            
            if (ruleResult.severity === 'error') {
              validationResult.valid = false;
              validationResult.errors.push(...(ruleResult.errors || []));
            } else {
              validationResult.warnings.push(...(ruleResult.warnings || []));
            }
          }

          if (ruleResult.suggestions) {
            validationResult.suggestions.push(...ruleResult.suggestions);
          }

          validationResult.metrics[ruleName] = ruleResult.score || 0;

        } catch (error) {
          logger.warn('Validation rule failed', { rule: ruleName, error: error.message });
          validationResult.warnings.push(`Validation rule '${ruleName}' failed to execute`);
        }
      }

      // Final score adjustment
      validationResult.score = Math.max(0, Math.min(100, validationResult.score));

      logger.debug('Response validation completed', {
        valid: validationResult.valid,
        score: validationResult.score,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length
      });

      return validationResult;

    } catch (error) {
      logger.error('Response validation failed', { error: error.message });
      return {
        valid: false,
        score: 0,
        errors: [`Validation failed: ${error.message}`],
        warnings: [],
        suggestions: [],
        metrics: {}
      };
    }
  }

  validateInput(input, schema) {
    try {
      const result = { valid: true, errors: [] };

      if (!input || typeof input !== 'object') {
        result.valid = false;
        result.errors.push('Input must be an object');
        return result;
      }

      // Validate required properties
      if (schema.required) {
        for (const required of schema.required) {
          if (!(required in input)) {
            result.valid = false;
            result.errors.push(`Missing required property: ${required}`);
          }
        }
      }

      // Validate property types and values
      if (schema.properties) {
        for (const [prop, propSchema] of Object.entries(schema.properties)) {
          if (prop in input) {
            const propResult = this.validateProperty(input[prop], propSchema, prop);
            if (!propResult.valid) {
              result.valid = false;
              result.errors.push(...propResult.errors);
            }
          }
        }
      }

      return result;

    } catch (error) {
      logger.error('Input validation failed', { error: error.message });
      return {
        valid: false,
        errors: [`Input validation failed: ${error.message}`]
      };
    }
  }

  validateProperty(value, schema, propertyName) {
    const result = { valid: true, errors: [] };

    // Type validation
    if (schema.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== schema.type) {
        result.valid = false;
        result.errors.push(`Property '${propertyName}' must be of type ${schema.type}`);
        return result;
      }
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      result.valid = false;
      result.errors.push(`Property '${propertyName}' must be one of: ${schema.enum.join(', ')}`);
    }

    // Number range validation
    if (schema.type === 'number' || schema.type === 'integer') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        result.valid = false;
        result.errors.push(`Property '${propertyName}' must be >= ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        result.valid = false;
        result.errors.push(`Property '${propertyName}' must be <= ${schema.maximum}`);
      }
    }

    // String length validation
    if (schema.type === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        result.valid = false;
        result.errors.push(`Property '${propertyName}' must be at least ${schema.minLength} characters`);
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        result.valid = false;
        result.errors.push(`Property '${propertyName}' must be at most ${schema.maxLength} characters`);
      }
    }

    return result;
  }

  validateLength(response) {
    const minLength = this.qualityThresholds.get('minimum_length');
    const maxLength = this.qualityThresholds.get('maximum_length');
    const length = response.length;

    if (length < minLength) {
      return {
        valid: false,
        errors: [`Response too short: ${length} characters (minimum: ${minLength})`]
      };
    }

    if (length > maxLength) {
      return {
        valid: false,
        errors: [`Response too long: ${length} characters (maximum: ${maxLength})`]
      };
    }

    return { valid: true };
  }

  validateCompleteness(response, context) {
    const result = { valid: true, score: 100, warnings: [], suggestions: [] };

    // Check for incomplete sentences
    if (response.endsWith('...') || response.includes('[incomplete]')) {
      result.valid = false;
      result.score = 0;
      result.warnings.push('Response appears incomplete');
    }

    // Check for minimum content requirements
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 3) {
      result.score -= 20;
      result.suggestions.push('Response could be more comprehensive');
    }

    return result;
  }

  validateFactualConsistency(response, context) {
    const result = { valid: true, score: 100, warnings: [], suggestions: [] };

    // Check for conflicting statements (simple pattern matching)
    const contradictionPatterns = [
      /\b(increase|improve|up)\b.*\b(decrease|reduce|down)\b/i,
      /\b(always|never)\b.*\b(sometimes|occasionally)\b/i
    ];

    for (const pattern of contradictionPatterns) {
      if (pattern.test(response)) {
        result.score -= 15;
        result.warnings.push('Potential contradiction detected in response');
        break;
      }
    }

    return result;
  }

  validateBusinessRelevance(response, context) {
    const result = { valid: true, score: 100, warnings: [], suggestions: [] };

    // Check for business-relevant keywords
    const businessKeywords = [
      'roi', 'cost', 'efficiency', 'productivity', 'quality', 'revenue',
      'profit', 'performance', 'optimization', 'improvement', 'strategy'
    ];

    const hasBusinessContent = businessKeywords.some(keyword =>
      response.toLowerCase().includes(keyword)
    );

    if (!hasBusinessContent) {
      result.score -= 25;
      result.suggestions.push('Consider adding business impact or ROI information');
    }

    return result;
  }

  validateManufacturingAccuracy(response, context) {
    const result = { valid: true, score: 100, warnings: [], suggestions: [] };

    // Check for manufacturing-specific terms and accuracy
    const manufacturingTerms = [
      'oee', 'throughput', 'downtime', 'quality', 'lean', 'six sigma',
      'production', 'inventory', 'supply chain', 'process', 'equipment'
    ];

    const hasManufacturingContent = manufacturingTerms.some(term =>
      response.toLowerCase().includes(term)
    );

    if (context.requiresManufacturingContext && !hasManufacturingContent) {
      result.score -= 20;
      result.suggestions.push('Consider adding manufacturing-specific context');
    }

    return result;
  }

  generateImprovementSuggestions(validationResult) {
    const suggestions = [...validationResult.suggestions];

    if (validationResult.score < 70) {
      suggestions.push('Consider regenerating response with additional context');
    }

    if (validationResult.errors.length > 0) {
      suggestions.push('Address validation errors before proceeding');
    }

    if (validationResult.warnings.length > 2) {
      suggestions.push('Review response for quality and accuracy');
    }

    return suggestions;
  }

  getValidationStatistics() {
    return {
      rules_available: this.validationRules.size,
      thresholds_configured: this.qualityThresholds.size,
      initialized: this.isInitialized
    };
  }

  async cleanup() {
    try {
      logger.info('Cleaning up Response Validator...');
      
      this.validationRules.clear();
      this.qualityThresholds.clear();
      this.isInitialized = false;
      
      logger.info('Response Validator cleanup completed');
      
    } catch (error) {
      logger.error('Error during Response Validator cleanup', { error: error.message });
    }
  }
}