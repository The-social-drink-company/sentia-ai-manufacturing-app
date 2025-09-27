import crypto from 'crypto';
import dotenv from 'dotenv';
import { logWarn, logError } from './observability/structuredLogger.js';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


dotenv.config();

class UnleashedService {
  constructor() {
    this.apiId = process.env.UNLEASHED_API_ID;
    this.apiKey = process.env.UNLEASHED_API_KEY;
    this.baseUrl = process.env.UNLEASHED_API_URL || 'https://api.unleashedsoftware.com';
    
    if (!this.apiId || !this.apiKey) {
      logWarn('Unleashed API credentials not found in environment variables - service will be limited');
      this.disabled = true;
    }
  }

  generateSignature(queryString = '') {
    // Remove leading '?' if present
    if (queryString.startsWith('?')) {
      queryString = queryString.substring(1);
    }
    
    // Create HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', this.apiKey);
    hmac.update(queryString);
    return hmac.digest('base64');
  }

  async makeRequest(endpoint, method = 'GET', params = null, data = null) {
    // Build full URL
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add query parameters
    let queryString = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).sort().forEach(key => {
        searchParams.append(key, params[key]);
      });
      queryString = searchParams.toString();
      url.search = queryString;
    }
    
    // Generate signature
    const signature = this.generateSignature(queryString);
    
    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-auth-id': this.apiId,
      'api-auth-signature': signature
    };
    
    // Make request
    try {
      const options = {
        method,
        headers
      };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url.toString(), options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      logError('Unleashed API request failed:', error);
      throw error;
    }
  }

  // Product Methods
  async getProducts(page = 1, pageSize = 200) {
    const params = {
      pageNumber: page,
      pageSize: pageSize
    };
    return this.makeRequest('/Products', 'GET', params);
  }

  async getProduct(productGuid) {
    return this.makeRequest(`/Products/${productGuid}`);
  }

  // Stock on Hand Methods
  async getStockOnHand(page = 1, pageSize = 200) {
    const params = {
      pageNumber: page,
      pageSize: pageSize
    };
    return this.makeRequest('/StockOnHand', 'GET', params);
  }

  // Sales Order Methods
  async getSalesOrders(page = 1, pageSize = 200, orderStatus = null) {
    const params = {
      pageNumber: page,
      pageSize: pageSize
    };
    if (orderStatus) {
      params.orderStatus = orderStatus;
    }
    return this.makeRequest('/SalesOrders', 'GET', params);
  }

  async getSalesOrder(orderGuid) {
    return this.makeRequest(`/SalesOrders/${orderGuid}`);
  }

  // Purchase Order Methods
  async getPurchaseOrders(page = 1, pageSize = 200) {
    const params = {
      pageNumber: page,
      pageSize: pageSize
    };
    return this.makeRequest('/PurchaseOrders', 'GET', params);
  }

  // Customer Methods
  async getCustomers(page = 1, pageSize = 200) {
    const params = {
      pageNumber: page,
      pageSize: pageSize
    };
    return this.makeRequest('/Customers', 'GET', params);
  }

  async getCustomer(customerGuid) {
    return this.makeRequest(`/Customers/${customerGuid}`);
  }

  // Supplier Methods
  async getSuppliers(page = 1, pageSize = 200) {
    const params = {
      pageNumber: page,
      pageSize: pageSize
    };
    return this.makeRequest('/Suppliers', 'GET', params);
  }

  // Warehouse Methods
  async getWarehouses() {
    return this.makeRequest('/Warehouses');
  }

  // Bill of Materials Methods
  async getBillOfMaterials(page = 1, pageSize = 200) {
    const params = {
      pageNumber: page,
      pageSize: pageSize
    };
    return this.makeRequest('/BillsOfMaterials', 'GET', params);
  }

  // Stock Adjustments
  async getStockAdjustments(page = 1, pageSize = 200) {
    const params = {
      pageNumber: page,
      pageSize: pageSize
    };
    return this.makeRequest('/StockAdjustments', 'GET', params);
  }

  // Test connection
  async testConnection() {
    if (this.disabled) {
      return {
        success: false,
        message: 'Unleashed API service is disabled - missing credentials'
      };
    }
    
    try {
      const result = await this.getWarehouses();
      return {
        success: true,
        message: `Successfully connected. Found ${result.Items?.length || 0} warehouses.`
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }
}

export default UnleashedService;