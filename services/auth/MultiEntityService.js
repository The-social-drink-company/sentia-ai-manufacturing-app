import { logInfo, logWarn, logError } from '../logger.js';

/**
 * Multi-Entity Service for global readiness
 * Handles entity-aware access control and region-specific features
 */
class MultiEntityService {
  constructor(pool, featureFlags = {}) {
    this.pool = pool;
    this.featureFlags = featureFlags;
    
    // Feature flags for gradual rollout
    this.features = {
      multiEntityEnabled: featureFlags.multiEntityEnabled || false,
      multiRegionEnabled: featureFlags.multiRegionEnabled || false,
      crossEntityAccess: featureFlags.crossEntityAccess || false,
      regionSpecificData: featureFlags.regionSpecificData || false
    };
    
    // Supported regions with metadata
    this.regions = {
      UK: {
        name: 'United Kingdom',
        currency: 'GBP',
        timezone: 'Europe/London',
        locale: 'en-GB',
        taxRate: 0.20,
        dateFormat: 'DD/MM/YYYY'
      },
      EU: {
        name: 'European Union', 
        currency: 'EUR',
        timezone: 'Europe/Brussels',
        locale: 'en-EU',
        taxRate: 0.21,
        dateFormat: 'DD/MM/YYYY'
      },
      USA: {
        name: 'United States',
        currency: 'USD', 
        timezone: 'America/New_York',
        locale: 'en-US',
        taxRate: 0.08,
        dateFormat: 'MM/DD/YYYY'
      }
    };
  }

  /**
   * Check if multi-entity features are enabled
   */
  isMultiEntityEnabled() {
    return this.features.multiEntityEnabled;
  }

  /**
   * Check if multi-region features are enabled
   */
  isMultiRegionEnabled() {
    return this.features.multiRegionEnabled;
  }

  /**
   * Get user's entity context
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User entity context
   */
  async getUserEntityContext(userId) {
    try {
      const query = `
        SELECT 
          default_entity_id,
          allowed_entity_ids,
          allowed_regions,
          preferred_currency_code,
          preferred_locale,
          preferred_timezone
        FROM users 
        WHERE clerk_user_id = $1
      `;
      
      const result = await this.pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return this.getDefaultEntityContext();
      }

      const user = result.rows[0];
      
      return {
        defaultEntityId: user.default_entity_id,
        allowedEntityIds: Array.isArray(user.allowed_entity_ids) 
          ? user.allowed_entity_ids 
          : (user.allowed_entity_ids ? JSON.parse(user.allowed_entity_ids) : []),
        allowedRegions: Array.isArray(user.allowed_regions)
          ? user.allowed_regions
          : (user.allowed_regions ? JSON.parse(user.allowed_regions) : ['UK']),
        preferences: {
          currency: user.preferred_currency_code || 'GBP',
          locale: user.preferred_locale || 'en-GB', 
          timezone: user.preferred_timezone || 'Europe/London'
        }
      };
    } catch (error) {
      logError('Failed to get user entity context', error);
      return this.getDefaultEntityContext();
    }
  }

  /**
   * Get default entity context for new users
   */
  getDefaultEntityContext() {
    return {
      defaultEntityId: null,
      allowedEntityIds: [],
      allowedRegions: ['UK'],
      preferences: {
        currency: 'GBP',
        locale: 'en-GB',
        timezone: 'Europe/London'
      }
    };
  }

  /**
   * Update user entity context
   * @param {string} userId - User ID
   * @param {Object} context - Entity context to update
   */
  async updateUserEntityContext(userId, context) {
    if (!this.isMultiEntityEnabled()) {
      logWarn('Multi-entity not enabled, skipping context update');
      return false;
    }

    try {
      const query = `
        UPDATE users 
        SET 
          default_entity_id = $2,
          allowed_entity_ids = $3,
          allowed_regions = $4,
          preferred_currency_code = $5,
          preferred_locale = $6,
          preferred_timezone = $7
        WHERE clerk_user_id = $1
      `;
      
      await this.pool.query(query, [
        userId,
        context.defaultEntityId,
        JSON.stringify(context.allowedEntityIds || []),
        JSON.stringify(context.allowedRegions || ['UK']),
        context.preferences?.currency || 'GBP',
        context.preferences?.locale || 'en-GB',
        context.preferences?.timezone || 'Europe/London'
      ]);
      
      logInfo('User entity context updated', { userId, context });
      return true;
    } catch (error) {
      logError('Failed to update user entity context', error);
      return false;
    }
  }

  /**
   * Check if user has access to specific entity
   * @param {string} userId - User ID
   * @param {string} entityId - Entity ID to check
   * @returns {Promise<boolean>} Access permission
   */
  async hasEntityAccess(userId, entityId) {
    if (!this.isMultiEntityEnabled()) {
      return true; // Single entity mode - all users have access
    }

    try {
      const context = await this.getUserEntityContext(userId);
      
      // No restrictions if no entities configured
      if (context.allowedEntityIds.length === 0) {
        return true;
      }
      
      // Check if entity is in allowed list
      return context.allowedEntityIds.includes(entityId);
    } catch (error) {
      logError('Failed to check entity access', error);
      return false;
    }
  }

  /**
   * Check if user has access to specific region
   * @param {string} userId - User ID  
   * @param {string} region - Region code to check
   * @returns {Promise<boolean>} Access permission
   */
  async hasRegionAccess(userId, region) {
    if (!this.isMultiRegionEnabled()) {
      return true; // Single region mode
    }

    try {
      const context = await this.getUserEntityContext(userId);
      return context.allowedRegions.includes(region);
    } catch (error) {
      logError('Failed to check region access', error);
      return false;
    }
  }

  /**
   * Get user's accessible entities with metadata
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of accessible entities
   */
  async getUserAccessibleEntities(userId) {
    if (!this.isMultiEntityEnabled()) {
      return []; // Return empty in single entity mode
    }

    try {
      const context = await this.getUserEntityContext(userId);
      
      if (context.allowedEntityIds.length === 0) {
        // No restrictions - return all entities
        const query = 'SELECT id, name, region, status FROM entities WHERE is_active = true';
        const result = await this.pool.query(query);
        return result.rows;
      }
      
      // Return only allowed entities
      const query = `
        SELECT id, name, region, status 
        FROM entities 
        WHERE id = ANY($1) AND is_active = true
      `;
      const result = await this.pool.query(query, [context.allowedEntityIds]);
      return result.rows;
    } catch (error) {
      logError('Failed to get user accessible entities', error);
      return [];
    }
  }

  /**
   * Get region metadata
   * @param {string} regionCode - Region code
   * @returns {Object} Region metadata
   */
  getRegionMetadata(regionCode) {
    return this.regions[regionCode] || this.regions['UK'];
  }

  /**
   * Apply entity/region filters to query parameters
   * @param {string} userId - User ID
   * @param {Object} queryParams - Query parameters to filter
   * @returns {Promise<Object>} Filtered query parameters
   */
  async applyEntityFilters(userId, queryParams) {
    if (!this.isMultiEntityEnabled() && !this.isMultiRegionEnabled()) {
      return queryParams; // No filtering needed
    }

    try {
      const context = await this.getUserEntityContext(userId);
      const filteredParams = { ...queryParams };
      
      // Apply entity filters
      if (this.isMultiEntityEnabled() && context.allowedEntityIds.length > 0) {
        filteredParams.entityIds = context.allowedEntityIds;
      }
      
      // Apply region filters
      if (this.isMultiRegionEnabled()) {
        filteredParams.regions = context.allowedRegions;
      }
      
      return filteredParams;
    } catch (error) {
      logError('Failed to apply entity filters', error);
      return queryParams;
    }
  }

  /**
   * Convert currency based on user preferences
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Promise<number>} Converted amount
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    try {
      // In a real implementation, this would call a currency conversion API
      // For now, use mock exchange rates
      const mockRates = {
        'GBP-EUR': 1.17,
        'GBP-USD': 1.27,
        'EUR-GBP': 0.85,
        'EUR-USD': 1.08,
        'USD-GBP': 0.79,
        'USD-EUR': 0.93
      };
      
      const rateKey = `${fromCurrency}-${toCurrency}`;
      const rate = mockRates[rateKey] || 1;
      
      return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      logError('Currency conversion failed', error);
      return amount;
    }
  }

  /**
   * Format date according to region preferences
   * @param {Date} date - Date to format
   * @param {string} region - Region code
   * @returns {string} Formatted date string
   */
  formatDateByRegion(date, region) {
    const regionMeta = this.getRegionMetadata(region);
    const locale = regionMeta.locale;
    
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit'
      }).format(new Date(date));
    } catch (error) {
      // Fallback to ISO format
      return new Date(date).toISOString().split('T')[0];
    }
  }

  /**
   * Format currency according to region preferences
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @param {string} region - Region code  
   * @returns {string} Formatted currency string
   */
  formatCurrencyByRegion(amount, currency, region) {
    const regionMeta = this.getRegionMetadata(region);
    const locale = regionMeta.locale;
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      // Fallback format
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Validate entity access for API requests
   * @param {string} userId - User ID
   * @param {Object} requestData - Request data containing entity/region info
   * @returns {Promise<Object>} Validation result
   */
  async validateEntityAccess(userId, requestData) {
    const validation = {
      isValid: true,
      errors: [],
      filteredData: { ...requestData }
    };

    try {
      // Check entity access
      if (requestData.entityId && this.isMultiEntityEnabled()) {
        const hasAccess = await this.hasEntityAccess(userId, requestData.entityId);
        if (!hasAccess) {
          validation.isValid = false;
          validation.errors.push(`Access denied to entity: ${requestData.entityId}`);
        }
      }

      // Check region access
      if (requestData.region && this.isMultiRegionEnabled()) {
        const hasAccess = await this.hasRegionAccess(userId, requestData.region);
        if (!hasAccess) {
          validation.isValid = false;
          validation.errors.push(`Access denied to region: ${requestData.region}`);
        }
      }

      // Apply automatic filters if needed
      if (validation.isValid) {
        validation.filteredData = await this.applyEntityFilters(userId, requestData);
      }

      return validation;
    } catch (error) {
      logError('Entity access validation failed', error);
      return {
        isValid: false,
        errors: ['Entity access validation failed'],
        filteredData: requestData
      };
    }
  }

  /**
   * Health check for multi-entity service
   */
  async healthCheck() {
    try {
      // Test database connection
      await this.pool.query('SELECT 1');
      
      return {
        status: 'healthy',
        features: this.features,
        supportedRegions: Object.keys(this.regions),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default MultiEntityService;