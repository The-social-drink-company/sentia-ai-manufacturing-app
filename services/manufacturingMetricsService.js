import { logInfo, logError, logWarn } from './logger.js';

/**
 * Manufacturing Metrics Service
 * Provides manufacturing KPI data, metrics, and analytics
 */
class ManufacturingMetricsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get current manufacturing metrics
   */
  async getCurrentMetrics() {
    try {
      const cacheKey = 'current_metrics';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Mock data for current metrics - replace with actual data source
      const metrics = {
        production: {
          value: Math.floor(Math.random() * 10000) + 5000,
          trend: (Math.random() - 0.5) * 10,
          unit: 'units',
          status: 'good'
        },
        efficiency: {
          value: Math.random() * 0.2 + 0.8, // 80-100%
          trend: (Math.random() - 0.5) * 5,
          unit: 'percentage',
          status: 'good'
        },
        quality: {
          value: Math.random() * 0.05 + 0.95, // 95-100%
          trend: (Math.random() - 0.5) * 2,
          unit: 'percentage',
          status: 'good'
        },
        downtime: {
          value: Math.random() * 60, // 0-60 minutes
          trend: (Math.random() - 0.5) * 20,
          unit: 'minutes',
          status: Math.random() > 0.7 ? 'warning' : 'good'
        },
        oee: {
          value: Math.random() * 0.2 + 0.75, // 75-95%
          trend: (Math.random() - 0.5) * 5,
          unit: 'percentage',
          status: 'good'
        },
        defectRate: {
          value: Math.random() * 0.03, // 0-3%
          trend: (Math.random() - 0.5) * 1,
          unit: 'percentage',
          status: Math.random() > 0.8 ? 'warning' : 'good'
        },
        throughput: {
          value: Math.floor(Math.random() * 500) + 200,
          trend: (Math.random() - 0.5) * 15,
          unit: 'units/hour',
          status: 'good'
        }
      };

      this.cache.set(cacheKey, { data: metrics, timestamp: Date.now() });
      logInfo('Current manufacturing metrics retrieved');
      return metrics;
    } catch (error) {
      logError('Failed to get current metrics:', error);
      throw new Error(`Failed to get current metrics: ${error.message}`);
    }
  }

  /**
   * Get historical manufacturing data
   */
  async getHistoricalData(days = 30) {
    try {
      const cacheKey = `historical_data_${days}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Generate mock historical data
      const data = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        data.push({
          date: date.toISOString().split('T')[0],
          timestamp: date.toISOString(),
          production: Math.floor(Math.random() * 2000) + 4000,
          efficiency: Math.random() * 0.2 + 0.75,
          quality: Math.random() * 0.05 + 0.94,
          downtime: Math.random() * 120,
          oee: Math.random() * 0.25 + 0.7,
          defectRate: Math.random() * 0.04,
          throughput: Math.floor(Math.random() * 100) + 180,
          revenue: Math.floor(Math.random() * 50000) + 100000,
          costs: Math.floor(Math.random() * 30000) + 50000,
          orders: Math.floor(Math.random() * 50) + 20,
          inventory: Math.floor(Math.random() * 10000) + 20000
        });
      }

      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      logInfo(`Historical data for ${days} days retrieved`);
      return data;
    } catch (error) {
      logError('Failed to get historical data:', error);
      throw new Error(`Failed to get historical data: ${error.message}`);
    }
  }

  /**
   * Process data upload
   */
  async processDataUpload(file) {
    try {
      if (!file) {
        throw new Error('No file provided for upload');
      }

      logInfo(`Processing data upload: ${file.originalname}`);

      // Mock processing - replace with actual file processing logic
      const result = {
        success: true,
        fileName: file.originalname,
        rowsProcessed: Math.floor(Math.random() * 1000) + 100,
        errors: [],
        warnings: [],
        summary: {
          production: Math.floor(Math.random() * 10000) + 5000,
          quality: Math.random() * 0.05 + 0.95,
          efficiency: Math.random() * 0.2 + 0.8
        }
      };

      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      logInfo(`Data upload processed successfully: ${result.rowsProcessed} rows`);
      return result;
    } catch (error) {
      logError('Failed to process data upload:', error);
      throw new Error(`Failed to process data upload: ${error.message}`);
    }
  }

  /**
   * Get all manufacturing data
   */
  async getAllManufacturingData() {
    try {
      const [currentMetrics, historicalData] = await Promise.all([
        this.getCurrentMetrics(),
        this.getHistoricalData(30)
      ]);

      const data = {
        current: currentMetrics,
        historical: historicalData,
        summary: {
          totalProduction: historicalData.reduce((sum, item) => sum + item.production, 0),
          averageEfficiency: historicalData.reduce((sum, item) => sum + item.efficiency, 0) / historicalData.length,
          averageQuality: historicalData.reduce((sum, item) => sum + item.quality, 0) / historicalData.length,
          totalDowntime: historicalData.reduce((sum, item) => sum + item.downtime, 0),
          averageOEE: historicalData.reduce((sum, item) => sum + item.oee, 0) / historicalData.length
        },
        kpis: {
          productionTarget: 150000, // Monthly target
          efficiencyTarget: 0.85,
          qualityTarget: 0.98,
          downtimeTarget: 600, // Monthly target in minutes
          oeeTarget: 0.85
        }
      };

      logInfo('All manufacturing data retrieved');
      return data;
    } catch (error) {
      logError('Failed to get all manufacturing data:', error);
      throw new Error(`Failed to get all manufacturing data: ${error.message}`);
    }
  }

  /**
   * Get available data sources
   */
  async getDataSources() {
    try {
      const sources = [
        {
          id: 'production_line_1',
          name: 'Production Line 1',
          type: 'sensor',
          status: 'active',
          lastUpdate: new Date().toISOString(),
          metrics: ['production', 'efficiency', 'quality']
        },
        {
          id: 'production_line_2',
          name: 'Production Line 2',
          type: 'sensor',
          status: 'active',
          lastUpdate: new Date().toISOString(),
          metrics: ['production', 'efficiency', 'downtime']
        },
        {
          id: 'quality_control',
          name: 'Quality Control System',
          type: 'system',
          status: 'active',
          lastUpdate: new Date().toISOString(),
          metrics: ['quality', 'defectRate']
        },
        {
          id: 'erp_system',
          name: 'ERP Integration',
          type: 'integration',
          status: 'active',
          lastUpdate: new Date().toISOString(),
          metrics: ['orders', 'inventory', 'costs']
        },
        {
          id: 'manual_entry',
          name: 'Manual Data Entry',
          type: 'manual',
          status: 'active',
          lastUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
          metrics: ['maintenance', 'notes']
        }
      ];

      logInfo('Data sources retrieved');
      return sources;
    } catch (error) {
      logError('Failed to get data sources:', error);
      throw new Error(`Failed to get data sources: ${error.message}`);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logInfo('Manufacturing metrics cache cleared');
  }
}

export default new ManufacturingMetricsService();