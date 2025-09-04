class FXService {
  constructor(options = {}) {
    this.config = {
      baseCurrency: options.baseCurrency || 'GBP',
      supportedCurrencies: options.supportedCurrencies || ['GBP', 'EUR', 'USD'],
      cacheExpiry: options.cacheExpiry || 3600000, // 1 hour
      volatilityWindow: options.volatilityWindow || 30 // days
    };
    
    this.rateCache = new Map();
    this.volatilityCache = new Map();
    
    // Mock FX rates for development - replace with real FX API in production
    this.mockRates = {
      'GBP/EUR': 1.1650,
      'GBP/USD': 1.2450,
      'EUR/GBP': 0.8584,
      'EUR/USD': 1.0687,
      'USD/GBP': 0.8032,
      'USD/EUR': 0.9357
    };
  }

  // Get current FX rate between two currencies
  async getFXRate(baseCurrency, quoteCurrency) {
    if (baseCurrency === quoteCurrency) {
      return 1.0;
    }

    const pair = `${baseCurrency}/${quoteCurrency}`;
    const reversePair = `${quoteCurrency}/${baseCurrency}`;
    
    // Check cache first
    const cached = this.rateCache.get(pair);
    if (cached && cached.timestamp > Date.now() - this.config.cacheExpiry) {
      return cached.rate;
    }

    // Mock implementation - replace with real FX API
    let rate = this.mockRates[pair];
    if (!rate && this.mockRates[reversePair]) {
      rate = 1 / this.mockRates[reversePair];
    }
    
    if (!rate) {
      throw new Error(`FX rate not available for ${pair}`);
    }

    // Add some random volatility for realistic simulation
    const volatility = 0.005; // 0.5% daily volatility
    const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2;
    rate *= randomFactor;

    // Cache the rate
    this.rateCache.set(pair, {
      rate,
      timestamp: Date.now()
    });

    return rate;
  }

  // Generate FX scenario rates
  async generateFXScenario(baseCurrency, quoteCurrency, scenarioType = 'base', shockPercent = 0) {
    const currentRate = await this.getFXRate(baseCurrency, quoteCurrency);
    
    switch (scenarioType) {
      case 'base':
        return currentRate;
        
      case 'stress_up':
        return currentRate * (1 + (shockPercent / 100));
        
      case 'stress_down':
        return currentRate * (1 - (shockPercent / 100));
        
      case 'high_volatility':
        // Simulate high volatility with wider random range
        const highVolatility = 0.02; // 2% volatility
        const highVolFactor = 1 + (Math.random() - 0.5) * highVolatility * 2;
        return currentRate * highVolFactor;
        
      case 'crisis':
        // Simulate crisis scenario with significant depreciation
        const crisisFactor = 0.85 + Math.random() * 0.1; // 15-25% depreciation
        return currentRate * crisisFactor;
        
      default:
        return currentRate;
    }
  }

  // Convert forecast values between currencies
  async convertForecast(forecastData, fromCurrency, toCurrency, scenarioConfig = null) {
    if (fromCurrency === toCurrency) {
      return forecastData;
    }

    const fxRate = scenarioConfig 
      ? await this.generateFXScenario(fromCurrency, toCurrency, scenarioConfig.type, scenarioConfig.shock)
      : await this.getFXRate(fromCurrency, toCurrency);

    const convertedData = {
      ...forecastData,
      forecasts: {},
      predictionIntervals: {},
      metadata: {
        ...forecastData.metadata,
        fxConversion: {
          fromCurrency,
          toCurrency,
          rate: fxRate,
          convertedAt: new Date().toISOString(),
          scenarioConfig
        }
      }
    };

    // Convert forecast values
    Object.keys(forecastData.forecasts).forEach(model => {
      convertedData.forecasts[model] = forecastData.forecasts[model].map(value => value * fxRate);
    });

    // Convert prediction intervals
    Object.keys(forecastData.predictionIntervals).forEach(model => {
      const intervals = forecastData.predictionIntervals[model];
      convertedData.predictionIntervals[model] = {
        ...intervals,
        lower: intervals.lower.map(value => value * fxRate),
        upper: intervals.upper.map(value => value * fxRate)
      };
    });

    return convertedData;
  }

  // Calculate FX volatility impact on forecast uncertainty
  calculateFXVolatilityAdjustment(baseCurrency, quoteCurrency, horizon) {
    const pair = `${baseCurrency}/${quoteCurrency}`;
    
    // Mock volatility data - replace with real historical volatility calculation
    const annualizedVolatilities = {
      'GBP/EUR': 0.08,  // 8% annual volatility
      'GBP/USD': 0.12,  // 12% annual volatility
      'EUR/USD': 0.10,  // 10% annual volatility
      'USD/GBP': 0.12,
      'EUR/GBP': 0.08,
      'USD/EUR': 0.10
    };

    const volatility = annualizedVolatilities[pair] || 0.15; // Default 15%
    
    // Scale volatility by forecast horizon (sqrt of time)
    const timeScaledVolatility = volatility * Math.sqrt(horizon / 365);
    
    return {
      annualizedVolatility: volatility,
      horizonAdjustedVolatility: timeScaledVolatility,
      uncertaintyMultiplier: 1 + timeScaledVolatility
    };
  }

  // Generate multi-currency scenario matrix
  async generateMultiCurrencyScenarios(baseCurrency, targetCurrencies, scenarios = ['base', 'stress_up', 'stress_down']) {
    const scenarioMatrix = {};
    
    for (const scenario of scenarios) {
      scenarioMatrix[scenario] = {};
      
      for (const currency of targetCurrencies) {
        if (currency !== baseCurrency) {
          const shockPercent = scenario === 'stress_up' ? 10 : scenario === 'stress_down' ? -10 : 0;
          scenarioMatrix[scenario][currency] = await this.generateFXScenario(
            baseCurrency, 
            currency, 
            scenario, 
            Math.abs(shockPercent)
          );
        } else {
          scenarioMatrix[scenario][currency] = 1.0;
        }
      }
    }
    
    return scenarioMatrix;
  }

  // Calculate currency correlation matrix
  getCurrencyCorrelations() {
    // Mock correlation matrix - replace with real historical correlations
    return {
      'GBP': { 'GBP': 1.00, 'EUR': 0.85, 'USD': 0.72 },
      'EUR': { 'GBP': 0.85, 'EUR': 1.00, 'USD': 0.78 },
      'USD': { 'GBP': 0.72, 'EUR': 0.78, 'USD': 1.00 }
    };
  }

  // Get FX hedging recommendations
  generateHedgingRecommendations(exposureAmount, fromCurrency, toCurrency, horizon) {
    const volatilityData = this.calculateFXVolatilityAdjustment(fromCurrency, toCurrency, horizon);
    const hedgingCost = exposureAmount * 0.001; // 0.1% hedging cost estimate
    
    const recommendations = [];
    
    if (volatilityData.horizonAdjustedVolatility > 0.15) {
      recommendations.push({
        type: 'high_volatility_hedge',
        message: `High FX volatility detected (${(volatilityData.horizonAdjustedVolatility * 100).toFixed(1)}%). Consider hedging ${Math.round(exposureAmount * 0.8)} ${fromCurrency} exposure.`,
        hedgeRatio: 0.8,
        estimatedCost: hedgingCost * 0.8
      });
    }
    
    if (horizon > 90) {
      recommendations.push({
        type: 'long_horizon_hedge',
        message: `Long forecast horizon (${horizon} days). Consider partial hedging to reduce uncertainty.`,
        hedgeRatio: 0.6,
        estimatedCost: hedgingCost * 0.6
      });
    }
    
    return recommendations;
  }

  // Clear FX rate cache
  clearCache() {
    this.rateCache.clear();
    this.volatilityCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      rateCache: {
        size: this.rateCache.size,
        entries: Array.from(this.rateCache.keys())
      },
      volatilityCache: {
        size: this.volatilityCache.size,
        entries: Array.from(this.volatilityCache.keys())
      }
    };
  }
}

export default FXService;