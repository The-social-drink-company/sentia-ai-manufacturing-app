/**
 * Manufacturing Metrics Service
 * REAL DATA ONLY - No mock data generation
 * Integrates with APIs and uploaded files for authentic manufacturing data
 */

import { dataIntegrationService } from '../src/services/dataIntegrationService.js';

class ManufacturingMetricsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get current manufacturing metrics - REAL DATA ONLY
   * Sources: API endpoints, uploaded files, external integrations
   */
  async getCurrentMetrics() {
    try {
      // Try to get real data from dataIntegrationService
      const realData = await dataIntegrationService.fetchCurrentMetrics();
      
      if (!realData || realData.length === 0) {
        throw new Error('No real manufacturing data available. Please upload CSV/Excel files or connect APIs.');
      }

      return {
        success: true,
        data: realData,
        source: 'real_data',
        timestamp: new Date().toISOString(),
        message: `${realData.length} metrics loaded from real data sources`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        source: 'none',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get historical manufacturing data - REAL DATA ONLY
   */
  async getHistoricalData(days = 30) {
    try {
      const realHistoricalData = await dataIntegrationService.fetchHistoricalData(days);
      
      if (!realHistoricalData || realHistoricalData.length === 0) {
        throw new Error('No historical manufacturing data available. Please upload CSV/Excel files with historical data.');
      }

      return {
        success: true,
        data: realHistoricalData,
        source: 'real_historical_data',
        timestamp: new Date().toISOString(),
        period: `${days} days`,
        message: `${realHistoricalData.length} historical data points loaded`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        source: 'none',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get production data from Unleashed API - REAL DATA ONLY
   */
  async getProductionData() {
    try {
      // This would integrate with Unleashed API for real production data
      const response = await fetch('/api/unleashed/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Unleashed API error: ${response.status}`);
      }

      const unleashed = await response.json();
      
      if (!unleashed.success || !unleashed.data) {
        throw new Error('No production data available from Unleashed API');
      }

      // Transform Unleashed data to manufacturing metrics
      const productionMetrics = this.transformUnleashedData(unleashed.data);

      return {
        success: true,
        data: productionMetrics,
        source: 'unleashed_api',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        source: 'unleashed_api'
      };
    }
  }

  /**
   * Get financial data from external APIs - REAL DATA ONLY
   */
  async getFinancialData() {
    try {
      // Get real financial data from multiple sources
      const promises = [
        this.getXeroData(),
        this.getWorkingCapitalData()
      ];

      const results = await Promise.allSettled(promises);
      const financialData = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          financialData.push(...result.value.data);
        }
      });

      if (financialData.length === 0) {
        throw new Error('No real financial data available from any source');
      }

      return {
        success: true,
        data: financialData,
        source: 'financial_apis',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        source: 'financial_apis'
      };
    }
  }

  /**
   * Get Xero financial data - REAL DATA ONLY
   */
  async getXeroData() {
    try {
      // Get real data from Xero via MCP server
      const xeroMetrics = await dataIntegrationService.fetchXeroMetrics();
      
      if (!xeroMetrics) {
        throw new Error('No Xero data available');
      }

      return {
        success: true,
        data: [xeroMetrics],
        source: 'xero_api'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        source: 'xero_api'
      };
    }
  }

  /**
   * Get Working Capital data - REAL DATA ONLY
   */
  async getWorkingCapitalData() {
    try {
      const response = await fetch('/api/working-capital/kpis/trends', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Working Capital API error: ${response.status}`);
      }

      const wcData = await response.json();
      
      if (!wcData.success) {
        throw new Error('No working capital data available');
      }

      return {
        success: true,
        data: wcData.data,
        source: 'working_capital_api'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        source: 'working_capital_api'
      };
    }
  }

  /**
   * Transform Unleashed product data to manufacturing metrics
   */
  transformUnleashedData(products) {
    if (!products || !Array.isArray(products)) return [];

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.productCode && !p.obsolete).length;
    const totalStockValue = products.reduce((sum, p) => sum + ((p.defaultSellPrice || 0) * (p.availableQty || 0)), 0);

    return [
      {
        id: 'total_products',
        name: 'Total Products',
        value: totalProducts,
        format: 'number',
        status: totalProducts > 0 ? 'good' : 'critical',
        source: 'unleashed'
      },
      {
        id: 'active_products',
        name: 'Active Products',
        value: activeProducts,
        format: 'number',
        status: activeProducts > 0 ? 'good' : 'warning',
        source: 'unleashed'
      },
      {
        id: 'stock_value',
        name: 'Total Stock Value',
        value: totalStockValue,
        format: 'currency',
        status: totalStockValue > 0 ? 'good' : 'warning',
        source: 'unleashed'
      }
    ];
  }

  /**
   * Get all available manufacturing data from all real sources
   */
  async getAllManufacturingData() {
    try {
      const sources = [
        this.getCurrentMetrics(),
        this.getProductionData(),
        this.getFinancialData()
      ];

      const results = await Promise.allSettled(sources);
      const allData = [];
      const sourcesSummary = [];

      results.forEach((result, index) => {
        const sourceNames = ['uploaded_data', 'production', 'financial'];
        const sourceName = sourceNames[index];

        if (result.status === 'fulfilled' && result.value.success) {
          allData.push(...result.value.data);
          sourcesSummary.push({
            source: sourceName,
            status: 'success',
            count: result.value.data.length
          });
        } else {
          sourcesSummary.push({
            source: sourceName,
            status: 'error',
            error: result.value?.error || result.reason?.message
          });
        }
      });

      if (allData.length === 0) {
        throw new Error('No real manufacturing data available from any source. Please upload CSV/Excel files or configure API connections.');
      }

      return {
        success: true,
        data: allData,
        sources: sourcesSummary,
        totalMetrics: allData.length,
        timestamp: new Date().toISOString(),
        message: `${allData.length} real manufacturing metrics loaded from ${sourcesSummary.filter(s => s.status === 'success').length} sources`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        sources: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Upload and process manufacturing data file - REAL DATA ONLY
   */
  async processDataUpload(fileBuffer, filename) {
    try {
      const file = new File([fileBuffer], filename);
      const processedData = await dataIntegrationService.uploadDataFile(file, 'metrics');

      if (!processedData || processedData.length === 0) {
        throw new Error('No valid manufacturing data found in uploaded file');
      }

      return {
        success: true,
        data: processedData,
        source: 'file_upload',
        filename: filename,
        recordCount: processedData.length,
        timestamp: new Date().toISOString(),
        message: `Successfully processed ${processedData.length} records from ${filename}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        filename: filename,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get data source status - shows what real data sources are available
   */
  async getDataSourceStatus() {
    const sources = [
      { name: 'Uploaded Files', endpoint: 'dataIntegrationService', status: 'checking' },
      { name: 'Unleashed API', endpoint: '/api/unleashed/products', status: 'checking' },
      { name: 'Xero API', endpoint: 'MCP Server', status: 'checking' },
      { name: 'Working Capital', endpoint: '/api/working-capital/kpis/trends', status: 'checking' }
    ];

    // Check each source
    for (const source of sources) {
      try {
        if (source.name === 'Uploaded Files') {
          const uploadedData = await dataIntegrationService.getUploadedData('metrics');
          source.status = uploadedData ? 'available' : 'no_data';
          source.recordCount = uploadedData ? uploadedData.length : 0;
        } else if (source.name === 'Xero API') {
          const xeroData = await dataIntegrationService.fetchXeroMetrics();
          source.status = xeroData ? 'available' : 'no_data';
        } else {
          const response = await fetch(source.endpoint);
          source.status = response.ok ? 'available' : 'error';
        }
      } catch (error) {
        source.status = 'error';
        source.error = error.message;
      }
    }

    return {
      success: true,
      sources: sources,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const manufacturingMetricsService = new ManufacturingMetricsService();
export default ManufacturingMetricsService;