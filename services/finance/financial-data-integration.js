import axios from 'axios';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';

/**
 * Enterprise Financial Data Integration Service
 * Connects to real accounting systems, banks, and ERPs
 * NO MOCK DATA - Only real financial information
 */
export class FinancialDataIntegrationService {
  constructor() {
    this.integrations = new Map();
    this.dataCache = new Map();
    this.reconciliationRules = [];
  }

  /**
   * Register all available financial data sources
   */
  async initialize() {
    try {
      logInfo('Initializing financial data integration service');

      // Register accounting system integrations
      await this.registerXeroIntegration();
      await this.registerQuickBooksIntegration();
      await this.registerSageIntegration();

      // Register banking integrations
      await this.registerPlaidIntegration();
      await this.registerBankingAPIs();

      // Register ERP integrations
      await this.registerSAPIntegration();
      await this.registerOracleIntegration();
      await this.registerNetSuiteIntegration();

      // Register market data sources
      await this.registerMarketDataProviders();

      logInfo('Financial data integration service initialized', {
        integrations: Array.from(this.integrations.keys())
      });
    } catch (error) {
      logError('Failed to initialize financial data integration', error);
      throw error;
    }
  }

  /**
   * Xero Accounting Integration
   */
  async registerXeroIntegration() {
    this.integrations.set('xero', {
      name: 'Xero Accounting',
      type: 'accounting',
      endpoints: {
        balanceSheet: '/api/integrations/xero/reports/balance-sheet',
        profitLoss: '/api/integrations/xero/reports/profit-loss',
        cashFlow: '/api/integrations/xero/reports/cash-flow',
        agedReceivables: '/api/integrations/xero/reports/aged-receivables',
        agedPayables: '/api/integrations/xero/reports/aged-payables',
        bankAccounts: '/api/integrations/xero/bank-accounts',
        invoices: '/api/integrations/xero/invoices',
        bills: '/api/integrations/xero/bills',
        bankTransactions: '/api/integrations/xero/bank-transactions'
      },
      fetchData: async (companyId, dataType) => {
        return this.fetchXeroData(companyId, dataType);
      }
    });
  }

  async fetchXeroData(companyId, dataType) {
    try {
      const integration = this.integrations.get('xero');
      const endpoint = integration.endpoints[dataType];

      if (!endpoint) {
        throw new Error(`Unknown Xero data type: ${dataType}`);
      }

      const response = await axios.get(endpoint, {
        params: {
          companyId,
          date: new Date().toISOString()
        },
        headers: {
          'X-Company-Id': companyId
        }
      });

      return {
        source: 'xero',
        dataType,
        timestamp: new Date().toISOString(),
        data: response.data
      };
    } catch (error) {
      logError('Xero data fetch failed', { error: error.message, dataType });
      throw error;
    }
  }

  /**
   * QuickBooks Integration
   */
  async registerQuickBooksIntegration() {
    this.integrations.set('quickbooks', {
      name: 'QuickBooks',
      type: 'accounting',
      endpoints: {
        company: '/api/integrations/quickbooks/company',
        balanceSheet: '/api/integrations/quickbooks/reports/balance-sheet',
        profitLoss: '/api/integrations/quickbooks/reports/profit-loss',
        cashFlow: '/api/integrations/quickbooks/reports/cash-flow',
        customers: '/api/integrations/quickbooks/customers',
        vendors: '/api/integrations/quickbooks/vendors',
        accounts: '/api/integrations/quickbooks/accounts'
      },
      fetchData: async (companyId, dataType) => {
        return this.fetchQuickBooksData(companyId, dataType);
      }
    });
  }

  /**
   * Banking Integration via Plaid
   */
  async registerPlaidIntegration() {
    this.integrations.set('plaid', {
      name: 'Plaid Banking',
      type: 'banking',
      endpoints: {
        accounts: '/api/integrations/plaid/accounts',
        balances: '/api/integrations/plaid/balances',
        transactions: '/api/integrations/plaid/transactions',
        identity: '/api/integrations/plaid/identity',
        cashFlow: '/api/integrations/plaid/cash-flow'
      },
      fetchData: async (companyId, dataType) => {
        return this.fetchPlaidData(companyId, dataType);
      }
    });
  }

  async fetchPlaidData(companyId, dataType) {
    try {
      const integration = this.integrations.get('plaid');
      const endpoint = integration.endpoints[dataType];

      const response = await axios.get(endpoint, {
        params: {
          companyId,
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }
      });

      return {
        source: 'plaid',
        dataType,
        timestamp: new Date().toISOString(),
        data: response.data
      };
    } catch (error) {
      logError('Plaid data fetch failed', { error: error.message, dataType });
      throw error;
    }
  }

  /**
   * SAP ERP Integration
   */
  async registerSAPIntegration() {
    this.integrations.set('sap', {
      name: 'SAP ERP',
      type: 'erp',
      endpoints: {
        financialPosition: '/api/integrations/sap/financial-position',
        cashPosition: '/api/integrations/sap/cash-position',
        workingCapital: '/api/integrations/sap/working-capital',
        costCenters: '/api/integrations/sap/cost-centers',
        profitCenters: '/api/integrations/sap/profit-centers'
      },
      fetchData: async (companyId, dataType) => {
        return this.fetchSAPData(companyId, dataType);
      }
    });
  }

  /**
   * Consolidated Financial Data Fetching
   */
  async fetchConsolidatedFinancials(companyId, options = {}) {
    try {
      logInfo('Fetching consolidated financial data', { companyId, options });

      const sources = options.sources || ['xero', 'plaid', 'database'];
      const dataPromises = [];

      // Fetch from each configured source
      for (const source of sources) {
        if (this.integrations.has(source)) {
          dataPromises.push(this.fetchSourceData(source, companyId, options));
        }
      }

      const results = await Promise.allSettled(dataPromises);

      // Process successful results
      const validData = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);

      if (validData.length === 0) {
        throw new Error('No financial data available from any source');
      }

      // Consolidate and reconcile data
      const consolidated = await this.consolidateFinancialData(validData, options);

      // Cache the result
      this.cacheFinancialData(companyId, consolidated);

      return consolidated;
    } catch (error) {
      logError('Failed to fetch consolidated financials', error);
      throw error;
    }
  }

  async fetchSourceData(source, companyId, options) {
    try {
      const integration = this.integrations.get(source);
      if (!integration) {
        throw new Error(`Integration not found: ${source}`);
      }

      const dataTypes = this.getRequiredDataTypes(source, options);
      const fetchPromises = dataTypes.map(type =>
        integration.fetchData(companyId, type)
      );

      const results = await Promise.allSettled(fetchPromises);
      const validResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      return {
        source,
        timestamp: new Date().toISOString(),
        data: validResults
      };
    } catch (error) {
      logWarn(`Failed to fetch data from ${source}`, { error: error.message });
      return null;
    }
  }

  getRequiredDataTypes(source, options) {
    const defaultTypes = {
      xero: ['balanceSheet', 'cashFlow', 'agedReceivables', 'agedPayables'],
      quickbooks: ['balanceSheet', 'profitLoss', 'accounts'],
      plaid: ['accounts', 'balances', 'transactions'],
      sap: ['financialPosition', 'cashPosition', 'workingCapital']
    };

    return options.dataTypes || defaultTypes[source] || [];
  }

  /**
   * Data Consolidation and Reconciliation
   */
  async consolidateFinancialData(dataSources, options) {
    try {
      const consolidated = {
        timestamp: new Date().toISOString(),
        sources: dataSources.map(d => d.source),
        financials: {
          cashAndEquivalents: 0,
          accountsReceivable: 0,
          accountsPayable: 0,
          inventory: 0,
          revenue: 0,
          expenses: 0,
          netIncome: 0,
          currentAssets: 0,
          currentLiabilities: 0,
          totalAssets: 0,
          totalLiabilities: 0,
          equity: 0
        },
        cashFlow: {
          operating: 0,
          investing: 0,
          financing: 0,
          net: 0
        },
        workingCapital: {
          current: 0,
          dso: 0,
          dpo: 0,
          dio: 0,
          cashConversionCycle: 0
        },
        bankAccounts: [],
        metrics: {},
        reconciliation: {
          status: 'pending',
          discrepancies: []
        }
      };

      // Process each data source
      for (const source of dataSources) {
        await this.processDataSource(source, consolidated);
      }

      // Perform reconciliation
      consolidated.reconciliation = await this.reconcileData(consolidated, dataSources);

      // Calculate derived metrics
      consolidated.metrics = this.calculateFinancialMetrics(consolidated.financials);

      // Apply business rules
      consolidated.validation = this.validateFinancialData(consolidated);

      return consolidated;
    } catch (error) {
      logError('Data consolidation failed', error);
      throw error;
    }
  }

  async processDataSource(source, consolidated) {
    if (!source.data || !Array.isArray(source.data)) return;

    for (const dataItem of source.data) {
      switch (dataItem.dataType) {
        case 'balanceSheet':
          this.processBalanceSheet(dataItem.data, consolidated);
          break;
        case 'cashFlow':
          this.processCashFlow(dataItem.data, consolidated);
          break;
        case 'agedReceivables':
          this.processAgedReceivables(dataItem.data, consolidated);
          break;
        case 'agedPayables':
          this.processAgedPayables(dataItem.data, consolidated);
          break;
        case 'accounts':
        case 'bankAccounts':
          this.processBankAccounts(dataItem.data, consolidated);
          break;
      }
    }
  }

  processBalanceSheet(data, consolidated) {
    if (!data) return;

    // Extract key balance sheet items
    consolidated.financials.cashAndEquivalents =
      Math.max(consolidated.financials.cashAndEquivalents, data.cashAndCashEquivalents || 0);

    consolidated.financials.accountsReceivable =
      Math.max(consolidated.financials.accountsReceivable, data.accountsReceivable || 0);

    consolidated.financials.accountsPayable =
      Math.max(consolidated.financials.accountsPayable, data.accountsPayable || 0);

    consolidated.financials.inventory =
      Math.max(consolidated.financials.inventory, data.inventory || 0);

    consolidated.financials.currentAssets =
      Math.max(consolidated.financials.currentAssets, data.currentAssets || 0);

    consolidated.financials.currentLiabilities =
      Math.max(consolidated.financials.currentLiabilities, data.currentLiabilities || 0);

    consolidated.financials.totalAssets =
      Math.max(consolidated.financials.totalAssets, data.totalAssets || 0);

    consolidated.financials.totalLiabilities =
      Math.max(consolidated.financials.totalLiabilities, data.totalLiabilities || 0);

    consolidated.financials.equity =
      Math.max(consolidated.financials.equity, data.totalEquity || 0);
  }

  processCashFlow(data, consolidated) {
    if (!data) return;

    consolidated.cashFlow.operating = data.operatingActivities || 0;
    consolidated.cashFlow.investing = data.investingActivities || 0;
    consolidated.cashFlow.financing = data.financingActivities || 0;
    consolidated.cashFlow.net = data.netCashFlow ||
      (consolidated.cashFlow.operating + consolidated.cashFlow.investing + consolidated.cashFlow.financing);
  }

  processAgedReceivables(data, consolidated) {
    if (!data || !data.summary) return;

    const totalReceivables = data.summary.total || 0;
    consolidated.financials.accountsReceivable =
      Math.max(consolidated.financials.accountsReceivable, totalReceivables);

    // Calculate DSO from aged receivables
    if (data.averageDaysOutstanding) {
      consolidated.workingCapital.dso = data.averageDaysOutstanding;
    }
  }

  processAgedPayables(data, consolidated) {
    if (!data || !data.summary) return;

    const totalPayables = data.summary.total || 0;
    consolidated.financials.accountsPayable =
      Math.max(consolidated.financials.accountsPayable, totalPayables);

    // Calculate DPO from aged payables
    if (data.averageDaysOutstanding) {
      consolidated.workingCapital.dpo = data.averageDaysOutstanding;
    }
  }

  processBankAccounts(data, consolidated) {
    if (!data) return;

    const accounts = Array.isArray(data) ? data : data.accounts || [];

    for (const account of accounts) {
      const existingAccount = consolidated.bankAccounts.find(
        a => a.accountId === account.accountId ||
             a.accountNumber === account.accountNumber
      );

      if (!existingAccount) {
        consolidated.bankAccounts.push({
          accountId: account.accountId,
          accountName: account.name || account.accountName,
          accountNumber: account.accountNumber,
          bank: account.institutionName || account.bank,
          type: account.type || account.accountType,
          balance: account.currentBalance || account.balance || 0,
          available: account.availableBalance || account.available || 0,
          currency: account.currency || 'USD',
          lastUpdated: account.lastUpdated || new Date().toISOString()
        });
      }
    }

    // Update total cash from bank accounts
    const totalBankCash = consolidated.bankAccounts.reduce(
      (sum, account) => sum + (account.balance || 0), 0
    );

    consolidated.financials.cashAndEquivalents =
      Math.max(consolidated.financials.cashAndEquivalents, totalBankCash);
  }

  /**
   * Data Reconciliation
   */
  async reconcileData(consolidated, dataSources) {
    const reconciliation = {
      status: 'reconciled',
      discrepancies: [],
      confidence: 100
    };

    // Check for discrepancies between sources
    if (dataSources.length > 1) {
      const cashValues = dataSources
        .map(s => this.extractCashValue(s))
        .filter(v => v > 0);

      if (cashValues.length > 1) {
        const maxCash = Math.max(...cashValues);
        const minCash = Math.min(...cashValues);
        const variance = ((maxCash - minCash) / maxCash) * 100;

        if (variance > 5) { // More than 5% variance
          reconciliation.discrepancies.push({
            field: 'cash',
            variance: variance.toFixed(2),
            values: cashValues,
            message: `Cash values vary by ${variance.toFixed(2)}% between sources`
          });
          reconciliation.confidence -= Math.min(20, variance);
        }
      }
    }

    // Validate accounting equation
    const assetsCheck = Math.abs(
      consolidated.financials.totalAssets -
      (consolidated.financials.totalLiabilities + consolidated.financials.equity)
    );

    if (assetsCheck > 0.01 && consolidated.financials.totalAssets > 0) {
      reconciliation.discrepancies.push({
        field: 'accounting_equation',
        difference: assetsCheck,
        message: 'Assets do not equal Liabilities + Equity'
      });
      reconciliation.confidence -= 10;
    }

    reconciliation.status = reconciliation.discrepancies.length === 0 ? 'reconciled' : 'discrepancies_found';

    return reconciliation;
  }

  extractCashValue(source) {
    if (!source.data) return 0;

    for (const item of source.data) {
      if (item.dataType === 'balanceSheet' && item.data?.cashAndCashEquivalents) {
        return item.data.cashAndCashEquivalents;
      }
      if (item.dataType === 'accounts' || item.dataType === 'balances') {
        const accounts = Array.isArray(item.data) ? item.data : item.data?.accounts || [];
        return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      }
    }
    return 0;
  }

  /**
   * Calculate Financial Metrics
   */
  calculateFinancialMetrics(financials) {
    const metrics = {};

    // Liquidity Ratios
    if (financials.currentLiabilities > 0) {
      metrics.currentRatio = financials.currentAssets / financials.currentLiabilities;
      metrics.quickRatio = (financials.currentAssets - financials.inventory) / financials.currentLiabilities;
      metrics.cashRatio = financials.cashAndEquivalents / financials.currentLiabilities;
    }

    // Working Capital
    metrics.workingCapital = financials.currentAssets - financials.currentLiabilities;
    metrics.workingCapitalRatio = financials.totalAssets > 0 ?
      metrics.workingCapital / financials.totalAssets : 0;

    // Leverage Ratios
    if (financials.totalAssets > 0) {
      metrics.debtToAssets = financials.totalLiabilities / financials.totalAssets;
    }
    if (financials.equity > 0) {
      metrics.debtToEquity = financials.totalLiabilities / financials.equity;
    }

    // Profitability Indicators
    if (financials.revenue > 0) {
      metrics.netProfitMargin = (financials.netIncome / financials.revenue) * 100;
    }
    if (financials.totalAssets > 0) {
      metrics.roa = (financials.netIncome / financials.totalAssets) * 100;
    }
    if (financials.equity > 0) {
      metrics.roe = (financials.netIncome / financials.equity) * 100;
    }

    return metrics;
  }

  /**
   * Data Validation
   */
  validateFinancialData(consolidated) {
    const validation = {
      isValid: true,
      warnings: [],
      errors: []
    };

    // Check for negative values where inappropriate
    if (consolidated.financials.cashAndEquivalents < 0) {
      validation.errors.push('Negative cash balance detected');
      validation.isValid = false;
    }

    if (consolidated.financials.totalAssets < 0) {
      validation.errors.push('Negative total assets');
      validation.isValid = false;
    }

    // Check for data freshness
    const dataAge = Date.now() - new Date(consolidated.timestamp).getTime();
    if (dataAge > 86400000) { // More than 24 hours
      validation.warnings.push('Financial data is more than 24 hours old');
    }

    // Check reconciliation status
    if (consolidated.reconciliation.status !== 'reconciled') {
      validation.warnings.push(`Data reconciliation: ${consolidated.reconciliation.status}`);
      consolidated.reconciliation.discrepancies.forEach(d => {
        validation.warnings.push(d.message);
      });
    }

    // Check metric reasonableness
    if (consolidated.metrics.currentRatio && consolidated.metrics.currentRatio < 0.5) {
      validation.warnings.push('Very low current ratio indicates liquidity risk');
    }

    if (consolidated.metrics.debtToEquity && consolidated.metrics.debtToEquity > 3) {
      validation.warnings.push('High debt-to-equity ratio indicates leverage risk');
    }

    return validation;
  }

  /**
   * Cache Management
   */
  cacheFinancialData(companyId, data) {
    const cacheKey = `financials-${companyId}`;
    this.dataCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: 3600000 // 1 hour TTL
    });

    // Clean up old cache entries
    this.cleanupCache();
  }

  getCachedFinancialData(companyId) {
    const cacheKey = `financials-${companyId}`;
    const cached = this.dataCache.get(cacheKey);

    if (cached && cached.timestamp + cached.ttl > Date.now()) {
      return cached.data;
    }

    return null;
  }

  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.dataCache.entries()) {
      if (value.timestamp + value.ttl < now) {
        this.dataCache.delete(key);
      }
    }
  }

  /**
   * Market Data Integration
   */
  async registerMarketDataProviders() {
    this.integrations.set('market-data', {
      name: 'Market Data Providers',
      type: 'market',
      providers: ['bloomberg', 'refinitiv', 'alphavantage'],
      fetchData: async (symbol, dataType) => {
        return this.fetchMarketData(symbol, dataType);
      }
    });
  }

  async fetchMarketData(symbol, dataType) {
    try {
      const endpoints = {
        quote: '/api/market-data/quote',
        fundamentals: '/api/market-data/fundamentals',
        peers: '/api/market-data/peers',
        industryMetrics: '/api/market-data/industry-metrics'
      };

      const response = await axios.get(endpoints[dataType], {
        params: { symbol, source: 'consolidated' }
      });

      return {
        source: 'market-data',
        dataType,
        timestamp: new Date().toISOString(),
        data: response.data
      };
    } catch (error) {
      logWarn('Market data fetch failed', { error: error.message });
      return null;
    }
  }

  // Additional integration methods for other providers would follow...
  async registerQuickBooksData(companyId, dataType) {
    // Implementation for QuickBooks
  }

  async registerSageIntegration() {
    // Implementation for Sage
  }

  async registerBankingAPIs() {
    // Implementation for direct bank APIs
  }

  async registerOracleIntegration() {
    // Implementation for Oracle
  }

  async registerNetSuiteIntegration() {
    // Implementation for NetSuite
  }
}

export default FinancialDataIntegrationService;