/**
 * Foreign Exchange Rate Service
 * Provides currency conversion and exchange rate management for multi-market operations
 * Supports FinanceFlo UK/EU/USA markets with GBP/EUR/USD currencies
 */

import { logInfo, logError, logWarn } from '../../../services/logger.js';
import { getFxConfig } from '../../config/global.js';

class ExchangeRateService {
  constructor() {
    this.rates = new Map();
    this.lastUpdate = null;
    this.config = getFxConfig();
    this.baseCurrency = 'GBP'; // FinanceFlo base currency
    this.supportedCurrencies = ['GBP', 'EUR', 'USD'];
    this.refreshInterval = 1000 * 60 * 60; // 1 hour
    this.rateTolerance = 0.05; // 5% rate change alert threshold
  }

  /**
   * Initialize the FX service and load initial rates
   */
  async initialize() {
    try {
      await this.updateRates();
      logInfo('Exchange Rate Service initialized successfully');
    } catch (error) {
      logError('Failed to initialize Exchange Rate Service', error);
      // Load fallback rates to prevent system failure
      await this.loadFallbackRates();
    }
  }

  /**
   * Update exchange rates from configured provider
   */
  async updateRates() {
    try {
      let rates;
      
      switch (this.config.provider) {
        case 'ecb':
          rates = await this.fetchECBRates();
          break;
        case 'oanda':
          rates = await this.fetchOandaRates();
          break;
        case 'currencyapi':
          rates = await this.fetchCurrencyAPIRates();
          break;
        default:
          rates = await this.loadFallbackRates();
      }

      this.rates = rates;
      this.lastUpdate = new Date();
      
      logInfo('Exchange rates updated successfully', {
        provider: this.config.provider,
        currencies: Array.from(this.rates.keys()),
        lastUpdate: this.lastUpdate
      });

    } catch (error) {
      logError('Failed to update exchange rates', error);
      if (this.rates.size === 0) {
        await this.loadFallbackRates();
      }
    }
  }

  /**
   * Fetch rates from European Central Bank (Free, reliable)
   */
  async fetchECBRates() {
    try {
      // ECB provides EUR-based rates, we need to convert to GBP base
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/GBP');
      const data = await response.json();
      
      if (!data || !data.rates) {
        throw new Error('Invalid ECB API response');
      }

      const rates = new Map();
      rates.set('GBP', 1.0); // Base currency
      
      // Convert to GBP-based rates
      for (const currency of this.supportedCurrencies) {
        if (currency !== 'GBP' && data.rates[currency]) {
          rates.set(currency, data.rates[currency]);
        }
      }

      return rates;
    } catch (error) {
      logError('ECB rate fetch failed', error);
      throw error;
    }
  }

  /**
   * Fetch rates from Oanda (Premium, requires API key)
   */
  async fetchOandaRates() {
    if (!this.config.apiKey) {
      throw new Error('Oanda API key not configured');
    }

    try {
      const instruments = `GBP_EUR,GBP_USD,EUR_GBP,USD_GBP`;
      const response = await fetch(
        `https://api-fxtrade.oanda.com/v3/instruments/${instruments}/candles?count=1&granularity=D`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (!data || !data.candles) {
        throw new Error('Invalid Oanda API response');
      }

      const rates = new Map();
      rates.set('GBP', 1.0);
      
      // Parse Oanda response and extract mid rates
      data.candles.forEach(candle => {
        const instrument = candle.instrument;
        const midRate = parseFloat(candle.mid.c); // Closing price
        
        if (instrument === 'GBP_EUR') rates.set('EUR', midRate);
        if (instrument === 'GBP_USD') rates.set('USD', midRate);
      });

      return rates;
    } catch (error) {
      logError('Oanda rate fetch failed', error);
      throw error;
    }
  }

  /**
   * Fetch rates from CurrencyAPI (Alternative provider)
   */
  async fetchCurrencyAPIRates() {
    if (!this.config.apiKey) {
      throw new Error('CurrencyAPI key not configured');
    }

    try {
      const response = await fetch(
        `https://api.currencyapi.com/v3/latest?apikey=${this.config.apiKey}&base_currency=GBP&currencies=EUR,USD`
      );
      
      const data = await response.json();
      
      if (!data || !data.data) {
        throw new Error('Invalid CurrencyAPI response');
      }

      const rates = new Map();
      rates.set('GBP', 1.0);
      
      Object.entries(data.data).forEach(([currency, info]) => {
        if (this.supportedCurrencies.includes(currency)) {
          rates.set(currency, info.value);
        }
      });

      return rates;
    } catch (error) {
      logError('CurrencyAPI rate fetch failed', error);
      throw error;
    }
  }

  /**
   * Load fallback rates when external providers fail
   */
  async loadFallbackRates() {
    logWarn('Loading fallback exchange rates');
    
    // FinanceFlo approximate rates for business continuity
    const fallbackRates = new Map([
      ['GBP', 1.0],        // Base currency
      ['EUR', 1.17],       // GBP to EUR approximate
      ['USD', 1.27]        // GBP to USD approximate
    ]);

    this.rates = fallbackRates;
    this.lastUpdate = new Date();
    
    logInfo('Fallback rates loaded', {
      rates: Object.fromEntries(fallbackRates),
      note: 'Using approximate rates - external provider unavailable'
    });

    return fallbackRates;
  }

  /**
   * Convert amount from one currency to another
   */
  convert(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const fromRate = this.rates.get(fromCurrency);
    const toRate = this.rates.get(toCurrency);

    if (!fromRate || !toRate) {
      logError('Currency conversion failed - unsupported currency', {
        from: fromCurrency,
        to: toCurrency,
        supported: this.supportedCurrencies
      });
      return amount; // Return original amount to prevent system failure
    }

    // Convert to base currency (GBP) then to target currency
    const gbpAmount = fromCurrency === 'GBP' ? amount : amount / fromRate;
    const convertedAmount = toCurrency === 'GBP' ? gbpAmount : gbpAmount * toRate;

    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get current exchange rate between two currencies
   */
  getRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1.0;
    
    const fromRate = this.rates.get(fromCurrency);
    const toRate = this.rates.get(toCurrency);
    
    if (!fromRate || !toRate) return null;
    
    return fromCurrency === 'GBP' ? toRate : (toCurrency === 'GBP' ? 1/fromRate : toRate/fromRate);
  }

  /**
   * Get all current rates
   */
  getAllRates() {
    return {
      baseCurrency: this.baseCurrency,
      rates: Object.fromEntries(this.rates),
      lastUpdate: this.lastUpdate,
      provider: this.config.provider,
      status: this.rates.size > 0 ? 'active' : 'fallback'
    };
  }

  /**
   * Convert multi-currency working capital to consolidated view
   */
  consolidateWorkingCapital(wcData) {
    const consolidated = {
      baseCurrency: this.baseCurrency,
      consolidatedAt: new Date(),
      regions: {},
      totals: {
        accountsReceivable: 0,
        inventory: 0,
        accountsPayable: 0,
        workingCapital: 0,
        cashFlow: 0
      }
    };

    // Process each region's data
    Object.entries(wcData).forEach(([region, data]) => {
      const regionCurrency = this.getRegionCurrency(region);
      
      consolidated.regions[region] = {
        currency: regionCurrency,
        original: data,
        converted: {
          accountsReceivable: this.convert(data.accountsReceivable, regionCurrency, this.baseCurrency),
          inventory: this.convert(data.inventory, regionCurrency, this.baseCurrency),
          accountsPayable: this.convert(data.accountsPayable, regionCurrency, this.baseCurrency),
          workingCapital: this.convert(data.workingCapital, regionCurrency, this.baseCurrency),
          cashFlow: this.convert(data.cashFlow, regionCurrency, this.baseCurrency)
        },
        exchangeRate: this.getRate(regionCurrency, this.baseCurrency)
      };

      // Add to consolidated totals
      const converted = consolidated.regions[region].converted;
      consolidated.totals.accountsReceivable += converted.accountsReceivable;
      consolidated.totals.inventory += converted.inventory;
      consolidated.totals.accountsPayable += converted.accountsPayable;
      consolidated.totals.workingCapital += converted.workingCapital;
      consolidated.totals.cashFlow += converted.cashFlow;
    });

    return consolidated;
  }

  /**
   * Get region-specific currency
   */
  getRegionCurrency(region) {
    const currencyMap = {
      'UK': 'GBP',
      'EU': 'EUR', 
      'USA': 'USD'
    };
    
    return currencyMap[region] || 'GBP';
  }

  /**
   * Check if rates need updating
   */
  needsUpdate() {
    if (!this.lastUpdate) return true;
    
    const timeSinceUpdate = Date.now() - this.lastUpdate.getTime();
    return timeSinceUpdate > this.refreshInterval;
  }

  /**
   * Get service status for health checks
   */
  getStatus() {
    return {
      service: 'ExchangeRateService',
      status: this.rates.size > 0 ? 'connected' : 'disconnected',
      provider: this.config.provider,
      supportedCurrencies: this.supportedCurrencies,
      baseCurrency: this.baseCurrency,
      lastUpdate: this.lastUpdate,
      ratesLoaded: this.rates.size,
      needsUpdate: this.needsUpdate()
    };
  }
}

// Create singleton instance
const exchangeRateService = new ExchangeRateService();

export default exchangeRateService;
