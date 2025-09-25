/**
 * Data Integration Service
 * Handles real data from APIs, CSV, and Excel uploads
 * NO MOCK DATA - Only real production data
 */

import { logInfo, logWarn, logError } from '../lib/logger.js';

import { mcpService } from './mcpService';

class DataIntegrationService {
  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || '/api';
    this.cachedData = new Map();
    this.uploadedData = new Map();
  }

  /**
   * Fetch current metrics from real data sources
   */
  async fetchCurrentMetrics() {
    try {
      // Try multiple data sources in priority order
      
      // 1. First try Xero for financial metrics
      const xeroData = await this.fetchXeroMetrics();
      
      // 2. Then try the main API for production metrics
      const apiData = await this.fetchAPIMetrics();
      
      // 3. Check for uploaded CSV/Excel data
      const uploadedData = await this.getUploadedData('metrics');
      
      // 4. Try external integrations (Amazon, Shopify, Unleashed)
      const externalData = await this.fetchExternalMetrics();

      // Merge all available real data
      return this.mergeMetricsData({
        xero: xeroData,
        api: apiData,
        uploaded: uploadedData,
        external: externalData
      });
    } catch (error) {
      logError('Failed to fetch current metrics', error, { operation: 'fetch_metrics' });
      throw new Error('No real data available. Please upload CSV/Excel file or connect to API.');
    }
  }

  /**
   * Fetch historical data from real sources
   */
  async fetchHistoricalData(days = 30) {
    try {
      // Fetch from multiple sources
      const [apiHistory, uploadedHistory, xeroHistory] = await Promise.all([
        fetch(`${this.apiBaseUrl}/metrics/history?days=${days}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
        this.getUploadedData('historical'),
        this.fetchXeroHistoricalData(days)
      ]);

      // Combine all available historical data
      const combinedHistory = [];
      
      if (apiHistory?.data) {
        combinedHistory.push(...apiHistory.data);
      }
      
      if (uploadedHistory) {
        combinedHistory.push(...this.parseUploadedHistory(uploadedHistory));
      }
      
      if (xeroHistory) {
        combinedHistory.push(...xeroHistory);
      }

      // Sort by date and remove duplicates
      return this.deduplicateAndSort(combinedHistory);
    } catch (error) {
      logError('Failed to fetch historical data', error, { operation: 'fetch_historical' });
      return [];
    }
  }

  /**
   * Fetch data from Xero via MCP server
   */
  async fetchXeroMetrics() {
    try {
      const [invoices, items] = await Promise.all([
        mcpService.xeroGetInvoices({ status: 'AUTHORISED', page: 1 }),
        mcpService.xeroGetItems()
      ]);

      if (!invoices || !items) return null;

      // Calculate real metrics from Xero data
      return {
        revenue: this.calculateRevenue(invoices),
        costPerUnit: this.calculateAverageCost(items),
        invoiceCount: invoices.length,
        productCount: items.length
      };
    } catch (error) {
      logError('Xero data fetch failed', error, { service: 'xero' });
      return null;
    }
  }

  /**
   * Fetch data from main API
   */
  async fetchAPIMetrics() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/metrics/current`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      return data.metrics || data;
    } catch (error) {
      logError('API fetch failed', error, { operation: 'api_fetch' });
      return null;
    }
  }

  /**
   * Fetch from external integrations
   */
  async fetchExternalMetrics() {
    const external = {};

    // Amazon SP-API
    try {
      const amazonData = await fetch(`${this.apiBaseUrl}/integrations/amazon/metrics`)
        .then(r => r.json());
      if (amazonData) {
        external.amazonOrders = amazonData.orderCount;
        external.amazonRevenue = amazonData.revenue;
      }
    } catch (e) {
      logInfo('Amazon data not available', { service: 'amazon', reason: 'no_credentials' });
    }

    // Shopify
    try {
      const shopifyData = await fetch(`${this.apiBaseUrl}/integrations/shopify/metrics`)
        .then(r => r.json());
      if (shopifyData) {
        external.shopifyOrders = shopifyData.orders;
        external.shopifyInventory = shopifyData.inventory;
      }
    } catch (e) {
      logInfo('Shopify data not available', { service: 'shopify', reason: 'no_credentials' });
    }

    // Unleashed
    try {
      const unleashedData = await fetch(`${this.apiBaseUrl}/integrations/unleashed/metrics`)
        .then(r => r.json());
      if (unleashedData) {
        external.inventory = unleashedData.stockOnHand;
        external.production = unleashedData.productionVolume;
      }
    } catch (e) {
      logInfo('Unleashed data not available', { service: 'unleashed', reason: 'no_credentials' });
    }

    return Object.keys(external).length > 0 ? external : null;
  }

  /**
   * Handle CSV/Excel file uploads
   */
  async uploadDataFile(file, dataType = 'metrics') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target.result;
          let parsedData;

          if (file.name.endsWith('.csv')) {
            parsedData = this.parseCSV(content);
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            parsedData = await this.parseExcel(content);
          } else {
            throw new Error('Unsupported file format. Please upload CSV or Excel file.');
          }

          // Store the uploaded data
          this.uploadedData.set(dataType, {
            data: parsedData,
            timestamp: new Date().toISOString(),
            filename: file.name
          });

          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  /**
   * Parse CSV content
   */
  parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        // Try to parse numbers
        row[header] = isNaN(value) ? value : parseFloat(value);
      });
      
      data.push(row);
    }

    return data;
  }

  /**
   * Parse Excel content (requires xlsx library)
   */
  async parseExcel(content) {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const buffer = content instanceof ArrayBuffer ? content : new Uint8Array(content);
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return [];
    }

    const toValue = (cellValue) => {
      if (cellValue === null || cellValue === undefined) return '';
      if (cellValue instanceof Date) return cellValue.toISOString();
      if (typeof cellValue === 'object') {
        if (cellValue.text) return cellValue.text;
        if (Array.isArray(cellValue.richText)) {
          return cellValue.richText.map(part => part.text).join('');
        }
        if (typeof cellValue.result !== 'undefined') return cellValue.result;
        if (cellValue.hyperlink) return cellValue.text || cellValue.hyperlink;
        if (typeof cellValue.value !== 'undefined') return cellValue.value;
      }
      return cellValue;
    };

    const headers = worksheet
      .getRow(1)
      .values.slice(1)
      .map(header => {
        const value = toValue(header);
        return typeof value === 'string' ? value.trim() : value;
      });

    const rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const record = {};

      headers.forEach((header, idx) => {
        if (!header) return;
        const raw = toValue(row.getCell(idx + 1).value);
        record[header] = raw;
      });

      if (Object.values(record).some(value => value !== '' && value !== null && value !== undefined)) {
        rows.push(record);
      }
    });

    return rows;
  }

  /**
   * Get uploaded data
   */
  async getUploadedData(dataType) {
    const uploaded = this.uploadedData.get(dataType);
    if (!uploaded) {
      // Check localStorage for previously uploaded data
      const stored = localStorage.getItem(`uploaded_${dataType}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.uploadedData.set(dataType, parsed);
        return parsed.data;
      }
      return null;
    }
    return uploaded.data;
  }

  /**
   * Merge metrics from multiple sources
   */
  mergeMetricsData(sources) {
    const merged = {};

    // Priority order: uploaded > api > xero > external
    if (sources.uploaded) {
      Object.assign(merged, this.transformUploadedMetrics(sources.uploaded));
    }
    
    if (sources.api) {
      Object.assign(merged, sources.api);
    }
    
    if (sources.xero) {
      Object.assign(merged, sources.xero);
    }
    
    if (sources.external) {
      Object.assign(merged, sources.external);
    }

    // Ensure we have some data
    if (Object.keys(merged).length === 0) {
      throw new Error('No data available from any source');
    }

    return this.formatMetricsForDashboard(merged);
  }

  /**
   * Transform uploaded data to metrics format
   */
  transformUploadedMetrics(uploadedData) {
    if (!Array.isArray(uploadedData) || uploadedData.length === 0) {
      return {};
    }

    // Assume the uploaded data has columns that map to our metrics
    const latestRow = uploadedData[uploadedData.length - 1];
    const metrics = {};

    // Map common column names to our metric IDs
    const columnMappings = {
      'Production': 'production',
      'Production Output': 'production',
      'Efficiency': 'efficiency',
      'Overall Efficiency': 'efficiency',
      'Quality': 'quality',
      'Quality Score': 'quality',
      'Cost': 'cost',
      'Cost Per Unit': 'costPerUnit',
      'Inventory': 'inventory',
      'Inventory Turnover': 'inventoryTurnover',
      'Downtime': 'downtime',
      'Machine Downtime': 'downtime',
      'Revenue': 'revenue',
      'Orders': 'orders'
    };

    Object.keys(latestRow).forEach(key => {
      const metricId = columnMappings[key] || key.toLowerCase().replace(/\s+/g, '_');
      metrics[metricId] = latestRow[key];
    });

    return metrics;
  }

  /**
   * Format metrics for dashboard display
   */
  formatMetricsForDashboard(rawMetrics) {
    const formatted = [];
    
    const metricDefinitions = [
      {
        id: 'production',
        name: 'Production Output',
        key: ['production', 'productionOutput', 'output'],
        format: 'number',
        unit: 'units/day'
      },
      {
        id: 'efficiency',
        name: 'Overall Efficiency',
        key: ['efficiency', 'overallEfficiency', 'oee'],
        format: 'percentage'
      },
      {
        id: 'quality',
        name: 'Quality Score',
        key: ['quality', 'qualityScore', 'qualityRate'],
        format: 'percentage'
      },
      {
        id: 'cost',
        name: 'Cost per Unit',
        key: ['cost', 'costPerUnit', 'unitCost'],
        format: 'currency'
      },
      {
        id: 'inventory',
        name: 'Inventory Turnover',
        key: ['inventory', 'inventoryTurnover', 'stockTurnover'],
        format: 'number',
        unit: 'times/year'
      },
      {
        id: 'downtime',
        name: 'Machine Downtime',
        key: ['downtime', 'machineDowntime', 'downtimeRate'],
        format: 'percentage'
      }
    ];

    metricDefinitions.forEach(def => {
      // Find the value from raw metrics using possible keys
      let value = null;
      for (const key of def.key) {
        if (rawMetrics[key] !== undefined) {
          value = rawMetrics[key];
          break;
        }
      }

      if (value !== null) {
        formatted.push({
          id: def.id,
          name: def.name,
          value: value,
          format: def.format,
          unit: def.unit,
          trend: this.calculateTrend(def.id, value),
          status: this.getMetricStatus(def.id, value)
        });
      }
    });

    return formatted;
  }

  /**
   * Calculate trend for a metric
   */
  calculateTrend(metricId, currentValue) {
    // This would compare with historical data
    // For now, return 0 if no historical data
    return 0;
  }

  /**
   * Determine metric status
   */
  getMetricStatus(metricId, value) {
    // Define thresholds for each metric
    const thresholds = {
      efficiency: { good: 0.85, warning: 0.75 },
      quality: { good: 0.95, warning: 0.90 },
      downtime: { good: 0.05, warning: 0.10 } // Lower is better for downtime
    };

    const threshold = thresholds[metricId];
    if (!threshold) return 'normal';

    if (metricId === 'downtime') {
      // For downtime, lower is better
      if (value <= threshold.good) return 'good';
      if (value <= threshold.warning) return 'warning';
      return 'critical';
    } else {
      // For other metrics, higher is better
      if (value >= threshold.good) return 'good';
      if (value >= threshold.warning) return 'warning';
      return 'critical';
    }
  }

  /**
   * Fetch Xero historical data
   */
  async fetchXeroHistoricalData(days) {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      
      const invoices = await mcpService.xeroGetInvoices({
        where: `Date >= DateTime(${fromDate.toISOString()})`,
        order: 'Date ASC'
      });

      if (!invoices) return null;

      // Group by date and calculate daily metrics
      const dailyMetrics = {};
      
      invoices.forEach(invoice => {
        const date = invoice.date.split('T')[0];
        if (!dailyMetrics[date]) {
          dailyMetrics[date] = {
            date,
            revenue: 0,
            invoiceCount: 0
          };
        }
        dailyMetrics[date].revenue += invoice.total || 0;
        dailyMetrics[date].invoiceCount += 1;
      });

      return Object.values(dailyMetrics);
    } catch (error) {
      logError('Failed to fetch Xero historical data', error, { service: 'xero', operation: 'historical_data' });
      return null;
    }
  }

  /**
   * Parse uploaded historical data
   */
  parseUploadedHistory(uploadedData) {
    if (!Array.isArray(uploadedData)) return [];
    
    return uploadedData.map(row => ({
      date: row.Date || row.date || row.Timestamp || row.timestamp,
      production: row.Production || row.production || row['Production Output'],
      efficiency: row.Efficiency || row.efficiency || row['Overall Efficiency'],
      quality: row.Quality || row.quality || row['Quality Score'],
      cost: row.Cost || row.cost || row['Cost Per Unit'],
      inventory: row.Inventory || row.inventory || row['Inventory Turnover'],
      downtime: row.Downtime || row.downtime || row['Machine Downtime']
    }));
  }

  /**
   * Deduplicate and sort historical data
   */
  deduplicateAndSort(data) {
    const uniqueMap = new Map();
    
    data.forEach(item => {
      const key = item.date || item.timestamp;
      if (key && (!uniqueMap.has(key) || item.production)) {
        uniqueMap.set(key, item);
      }
    });

    return Array.from(uniqueMap.values())
      .sort((a, b) => new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp));
  }

  /**
   * Calculate revenue from invoices
   */
  calculateRevenue(invoices) {
    if (!invoices || !Array.isArray(invoices)) return 0;
    return invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  }

  /**
   * Calculate average cost from items
   */
  calculateAverageCost(items) {
    if (!items || !Array.isArray(items) || items.length === 0) return 0;
    const total = items.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
    return total / items.length;
  }

  /**
   * Clear all cached and uploaded data
   */
  clearAllData() {
    this.cachedData.clear();
    this.uploadedData.clear();
    // Clear from localStorage too
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('uploaded_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Export singleton instance
export const dataIntegrationService = new DataIntegrationService();

// Export class for testing
export default DataIntegrationService;

