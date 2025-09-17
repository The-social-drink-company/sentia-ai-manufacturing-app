import crypto from 'crypto';
import axios from 'axios';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';

class UnleashedClient {
  constructor() {
    this.apiId = process.env.UNLEASHED_API_ID || '';
    this.apiKey = process.env.UNLEASHED_API_KEY || '';
    this.baseUrl = 'https://api.unleashedsoftware.com';
    this.timeout = 30000; // 30 seconds
    this.retryCount = 3;
    this.retryDelay = 1000; // 1 second

    // Validate credentials
    if (!this.apiId || !this.apiKey) {
      logWarn('Unleashed API credentials not configured', {
        hasApiId: !!this.apiId,
        hasApiKey: !!this.apiKey
      });
    }
  }

  /**
   * Generate HMAC-SHA256 signature for API authentication
   */
  getSignature(query) {
    try {
      const hmac = crypto.createHmac('sha256', this.apiKey);
      hmac.update(query || '');
      return hmac.digest('base64');
    } catch (error) {
      logError('Failed to generate Unleashed signature', error);
      throw new Error('Authentication signature generation failed');
    }
  }

  /**
   * Make authenticated request to Unleashed API
   */
  async request(endpoint, params = {}, method = 'GET') {
    if (!this.apiId || !this.apiKey) {
      throw new Error('Unleashed API credentials not configured');
    }

    const query = new URLSearchParams(params).toString();
    const signature = this.getSignature(query);

    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      params: method === 'GET' ? params : undefined,
      data: method !== 'GET' ? params : undefined,
      headers: {
        'api-auth-id': this.apiId,
        'api-auth-signature': signature,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: this.timeout
    };

    let lastError;
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        logInfo('Unleashed API request', {
          endpoint,
          method,
          attempt,
          hasParams: Object.keys(params).length > 0
        });

        const response = await axios(config);

        logInfo('Unleashed API response', {
          endpoint,
          status: response.status,
          itemCount: response.data?.Items?.length || 0
        });

        return response.data;
      } catch (error) {
        lastError = error;

        if (error.response) {
          // Server responded with error
          logError('Unleashed API error response', {
            endpoint,
            status: error.response.status,
            message: error.response.data?.Message || error.message,
            attempt
          });

          // Don't retry client errors (4xx)
          if (error.response.status >= 400 && error.response.status < 500) {
            throw new Error(`Unleashed API error: ${error.response.data?.Message || error.message}`);
          }
        } else if (error.request) {
          // Request made but no response
          logError('Unleashed API no response', {
            endpoint,
            attempt,
            error: error.message
          });
        } else {
          // Error in request setup
          logError('Unleashed API request setup error', {
            endpoint,
            attempt,
            error: error.message
          });
        }

        // Wait before retry
        if (attempt < this.retryCount) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw new Error(`Unleashed API request failed after ${this.retryCount} attempts: ${lastError?.message}`);
  }

  /**
   * Get all products from Unleashed
   */
  async getProducts(page = 1, pageSize = 200) {
    try {
      const response = await this.request('/Products', {
        page,
        pageSize
      });

      return {
        items: response.Items || [],
        pagination: response.Pagination || {},
        total: response.Total || 0
      };
    } catch (error) {
      logError('Failed to fetch Unleashed products', error);
      throw error;
    }
  }

  /**
   * Get stock on hand for all products
   */
  async getStockOnHand(page = 1, pageSize = 200) {
    try {
      const response = await this.request('/StockOnHand', {
        page,
        pageSize
      });

      return {
        items: response.Items || [],
        pagination: response.Pagination || {},
        total: response.Total || 0
      };
    } catch (error) {
      logError('Failed to fetch stock on hand', error);
      throw error;
    }
  }

  /**
   * Get purchase orders
   */
  async getPurchaseOrders(page = 1, pageSize = 200, status = null) {
    try {
      const params = { page, pageSize };
      if (status) params.orderStatus = status;

      const response = await this.request('/PurchaseOrders', params);

      return {
        items: response.Items || [],
        pagination: response.Pagination || {},
        total: response.Total || 0
      };
    } catch (error) {
      logError('Failed to fetch purchase orders', error);
      throw error;
    }
  }

  /**
   * Get sales orders
   */
  async getSalesOrders(page = 1, pageSize = 200, status = null) {
    try {
      const params = { page, pageSize };
      if (status) params.orderStatus = status;

      const response = await this.request('/SalesOrders', params);

      return {
        items: response.Items || [],
        pagination: response.Pagination || {},
        total: response.Total || 0
      };
    } catch (error) {
      logError('Failed to fetch sales orders', error);
      throw error;
    }
  }

  /**
   * Get stock movements
   */
  async getStockMovements(productCode = null, startDate = null, endDate = null) {
    try {
      const params = {};
      if (productCode) params.productCode = productCode;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await this.request('/StockMovements', params);

      return {
        items: response.Items || [],
        total: response.Total || 0
      };
    } catch (error) {
      logError('Failed to fetch stock movements', error);
      throw error;
    }
  }

  /**
   * Get warehouses
   */
  async getWarehouses() {
    try {
      const response = await this.request('/Warehouses');

      return {
        items: response.Items || [],
        total: response.Total || 0
      };
    } catch (error) {
      logError('Failed to fetch warehouses', error);
      throw error;
    }
  }

  /**
   * Get stock adjustments
   */
  async getStockAdjustments(page = 1, pageSize = 200) {
    try {
      const response = await this.request('/StockAdjustments', {
        page,
        pageSize
      });

      return {
        items: response.Items || [],
        pagination: response.Pagination || {},
        total: response.Total || 0
      };
    } catch (error) {
      logError('Failed to fetch stock adjustments', error);
      throw error;
    }
  }

  /**
   * Test connection to Unleashed API
   */
  async testConnection() {
    try {
      const response = await this.request('/Currencies', { page: 1, pageSize: 1 });
      return {
        success: true,
        message: 'Successfully connected to Unleashed API'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }
}

// Singleton instance
let clientInstance = null;

export function getUnleashedClient() {
  if (!clientInstance) {
    clientInstance = new UnleashedClient();
  }
  return clientInstance;
}

export default UnleashedClient;