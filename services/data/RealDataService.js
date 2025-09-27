/**
 * SENTIA REAL DATA SERVICE
 * ZERO MOCK DATA - ONLY REAL DATA FROM APIs, CSV, LLMs
 *
 * This service enforces the strict requirement for real data only.
 * When data is unavailable, it returns 0 with user notification.
 */

import { FINANCIAL_DATA_REQUIREMENTS } from '../../src/config/financialDataRequirements.js';

class RealDataService {
  constructor() {
    this.dataCache = new Map();
    this.missingDataQueue = [];
  }

  /**
   * Get financial metric with zero fallback
   */
  async getMetric(metricKey) {
    try {
      // Try API sources first
      let value = await this.fetchFromAPIs(metricKey);

      if (value === null || value === undefined) {
        // Try CSV import
        value = await this.fetchFromCSV(metricKey);
      }

      if (value === null || value === undefined) {
        // Try LLM benchmark
        value = await this.fetchFromLLM(metricKey);
      }

      if (value === null || value === undefined) {
        // Return zero with notification
        return this.zeroWithNotification(metricKey);
      }

      return {
        value,
        isRealData: true,
        source: 'api',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this.zeroWithNotification(metricKey, error.message);
    }
  }

  /**
   * Fetch from APIs (Xero, QuickBooks, Banking)
   */
  async fetchFromAPIs(metricKey) {
    const endpoints = {
      annual_revenue_gbp: '/api/xero/revenue',
      gross_margin_percentage: '/api/xero/gross-margin',
      net_margin_percentage: '/api/xero/net-margin',
      ebitda_average: '/api/xero/ebitda',
      dso_days: '/api/xero/debtor-days',
      dpo_days: '/api/xero/creditor-days',
      current_debtors_gbp: '/api/xero/current-debtors',
      current_creditors_gbp: '/api/xero/current-creditors',
      current_cash_balance: '/api/banking/cash-balance',
      average_bank_balance_gbp: '/api/banking/average-balance'
    };

    const endpoint = endpoints[metricKey];
    if (!endpoint) return null;

    try {
      const response = await fetch(endpoint);
      if (!response.ok) return null;
      const data = await response.json();
      return data.value || null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch from CSV import
   */
  async fetchFromCSV(metricKey) {
    try {
      const response = await fetch(`/api/csv/metric/${metricKey}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.value || null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch from LLM benchmark via MCP
   */
  async fetchFromLLM(metricKey) {
    try {
      const response = await fetch('/api/mcp/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric: metricKey })
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.benchmark || null;
    } catch {
      return null;
    }
  }

  /**
   * Return zero with user notification
   */
  zeroWithNotification(metricKey, additionalMessage = '') {
    const config = this.findMetricConfig(metricKey);
    const message = config?.missingDataMessage ||
      `Data required for ${metricKey}. Please import CSV or connect API.`;

    // Add to missing data queue
    this.missingDataQueue.push({
      metric: metricKey,
      message,
      timestamp: new Date().toISOString()
    });

    return {
      value: 0,
      isRealData: false,
      isMissing: true,
      userMessage: message + (additionalMessage ? ` (${additionalMessage})` : ''),
      actions: [
        { type: 'csv', label: 'Import CSV' },
        { type: 'api', label: 'Connect API' },
        { type: 'manual', label: 'Enter Manually' }
      ],
      source: 'none',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Find metric configuration
   */
  findMetricConfig(metricKey) {
    for (const category of Object.values(FINANCIAL_DATA_REQUIREMENTS)) {
      for (const config of Object.values(category)) {
        if (config.field === metricKey) {
          return config;
        }
      }
    }
    return null;
  }

  /**
   * Get all missing data notifications
   */
  getMissingDataNotifications() {
    return this.missingDataQueue;
  }

  /**
   * Clear notifications
   */
  clearNotifications() {
    this.missingDataQueue = [];
  }

  /**
   * Calculate cash flow projections (30, 60, 90, 120, 180 days)
   */
  async getCashFlowProjections() {
    const periods = [30, 60, 90, 120, 180];
    const projections = {};

    for (const days of periods) {
      const cashBalance = await this.getMetric('current_cash_balance');
      const dailyBurn = await this.calculateDailyBurnRate();
      const dailyRevenue = await this.calculateDailyRevenue();

      const netDaily = (dailyRevenue.value || 0) - (dailyBurn.value || 0);
      const projectedCash = (cashBalance.value || 0) + (netDaily * days);

      projections[`${days}days`] = {
        currentCash: cashBalance.value || 0,
        projectedCash: Math.max(0, projectedCash),
        dailyBurn: dailyBurn.value || 0,
        dailyRevenue: dailyRevenue.value || 0,
        needsInjection: projectedCash < 0,
        injectionRequired: projectedCash < 0 ? Math.abs(projectedCash) : 0,
        daysOfCashRemaining: dailyBurn.value > 0 ?
          Math.floor((cashBalance.value || 0) / dailyBurn.value) : 999
      };
    }

    return projections;
  }

  /**
   * Calculate growth funding requirements
   */
  async calculateGrowthFunding(growthPercentage) {
    const revenue = await this.getMetric('annual_revenue_gbp');
    const workingCapital = await this.calculateWorkingCapital();
    const currentCash = await this.getMetric('current_cash_balance');

    const growthMultiplier = growthPercentage / 100;
    const additionalRevenue = (revenue.value || 0) * growthMultiplier;
    const additionalWorkingCapital = (workingCapital.value || 0) * growthMultiplier;

    // Calculate funding needed
    const fundingRequired = additionalWorkingCapital - (currentCash.value || 0);

    return {
      growthRate: growthPercentage,
      currentRevenue: revenue.value || 0,
      targetRevenue: (revenue.value || 0) * (1 + growthMultiplier),
      currentWorkingCapital: workingCapital.value || 0,
      additionalWorkingCapitalNeeded: additionalWorkingCapital,
      currentCash: currentCash.value || 0,
      totalFundingRequired: Math.max(0, fundingRequired),
      fundingOptions: [
        {
          type: 'Overdraft',
          amount: Math.min(fundingRequired, (revenue.value || 0) * 0.1),
          cost: '8-12% APR'
        },
        {
          type: 'Invoice Finance',
          amount: Math.min(fundingRequired, (revenue.value || 0) * 0.15),
          cost: '1-3% per month'
        },
        {
          type: 'Term Loan',
          amount: fundingRequired,
          cost: '6-10% APR'
        },
        {
          type: 'Equity Investment',
          amount: fundingRequired,
          cost: 'Dilution of ownership'
        }
      ]
    };
  }

  /**
   * Calculate working capital
   */
  async calculateWorkingCapital() {
    const debtors = await this.getMetric('current_debtors_gbp');
    const creditors = await this.getMetric('current_creditors_gbp');
    const inventory = await this.getMetric('inventory_value');

    const workingCapital = (debtors.value || 0) + (inventory.value || 0) - (creditors.value || 0);

    return {
      value: workingCapital,
      components: {
        debtors: debtors.value || 0,
        inventory: inventory.value || 0,
        creditors: creditors.value || 0
      }
    };
  }

  /**
   * Calculate daily burn rate
   */
  async calculateDailyBurnRate() {
    const revenue = await this.getMetric('annual_revenue_gbp');
    const netMargin = await this.getMetric('net_margin_percentage');

    const annualProfit = (revenue.value || 0) * ((netMargin.value || 0) / 100);
    const annualCosts = (revenue.value || 0) - annualProfit;
    const dailyBurn = annualCosts / 365;

    return { value: dailyBurn };
  }

  /**
   * Calculate daily revenue
   */
  async calculateDailyRevenue() {
    const revenue = await this.getMetric('annual_revenue_gbp');
    return { value: (revenue.value || 0) / 365 };
  }

  /**
   * Import CSV data
   */
  async importCSV(file, template) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('template', template);

    try {
      const response = await fetch('/api/csv/import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Import failed');

      const result = await response.json();
      this.dataCache.clear(); // Clear cache after import

      return {
        success: true,
        recordsImported: result.count || 0,
        message: 'Data imported successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error.message}`
      };
    }
  }

  /**
   * Connect API
   */
  async connectAPI(apiType, credentials) {
    try {
      const response = await fetch(`/api/connect/${apiType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) throw new Error('Connection failed');

      return {
        success: true,
        message: `${apiType} connected successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Manual data entry
   */
  async enterManually(metricKey, value) {
    try {
      const response = await fetch('/api/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: metricKey,
          value: value,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Entry failed');

      // Clear cache for this metric
      this.dataCache.delete(metricKey);

      return {
        success: true,
        message: 'Data entered successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Entry failed: ${error.message}`
      };
    }
  }
}

// Export singleton
export const realDataService = new RealDataService();
export default RealDataService;