class HoltWintersModel {
  constructor(options = {}) {
    this.alpha = options.alpha || 0.3; // Level smoothing
    this.beta = options.beta || 0.1;   // Trend smoothing  
    this.gamma = options.gamma || 0.2; // Seasonal smoothing
    this.seasonalPeriods = options.seasonalPeriods || 7;
    this.seasonalityType = options.seasonalityType || 'additive';
    
    this.level = null;
    this.trend = null;
    this.seasonal = [];
    this.timeSeries = null;
    this.fitted = false;
  }

  async fit(timeSeries) {
    this.timeSeries = timeSeries.map(point => ({
      date: point.date,
      value: parseFloat(point.value)
    }));

    const values = this.timeSeries.map(point => point.value);
    const n = values.length;

    if (n < 2 * this.seasonalPeriods) {
      throw new Error(`Insufficient data for seasonal model. Need at least ${2 * this.seasonalPeriods} points, got ${n}`);
    }

    // Initialize components
    this.initializeComponents(values);
    
    // Fit the model using exponential smoothing
    for (let t = this.seasonalPeriods; t < n; t++) {
      const observed = values[t];
      const seasonalComponent = this.seasonal[t % this.seasonalPeriods];
      
      let deseasonalized;
      if (this.seasonalityType === 'multiplicative') {
        deseasonalized = seasonalComponent !== 0 ? observed / seasonalComponent : observed;
      } else {
        deseasonalized = observed - seasonalComponent;
      }
      
      // Update level
      const prevLevel = this.level;
      this.level = this.alpha * deseasonalized + (1 - this.alpha) * (this.level + this.trend);
      
      // Update trend
      this.trend = this.beta * (this.level - prevLevel) + (1 - this.beta) * this.trend;
      
      // Update seasonal component
      let seasonalError;
      if (this.seasonalityType === 'multiplicative') {
        seasonalError = this.level !== 0 ? observed / this.level : 1;
      } else {
        seasonalError = observed - this.level;
      }
      
      this.seasonal[t % this.seasonalPeriods] = 
        this.gamma * seasonalError + (1 - this.gamma) * this.seasonal[t % this.seasonalPeriods];
    }

    this.fitted = true;
    return this;
  }

  initializeComponents(values) {
    const n = values.length;
    const seasonLen = this.seasonalPeriods;
    
    // Initialize level as average of first season
    this.level = values.slice(0, seasonLen).reduce((sum, val) => sum + val, 0) / seasonLen;
    
    // Initialize trend using linear regression on first two seasons
    if (n >= 2 * seasonLen) {
      const firstSeason = values.slice(0, seasonLen).reduce((sum, val) => sum + val, 0) / seasonLen;
      const secondSeason = values.slice(seasonLen, 2 * seasonLen).reduce((sum, val) => sum + val, 0) / seasonLen;
      this.trend = (secondSeason - firstSeason) / seasonLen;
    } else {
      this.trend = 0;
    }
    
    // Initialize seasonal components
    this.seasonal = new Array(seasonLen).fill(0);
    
    for (let season = 0; season < Math.floor(n / seasonLen); season++) {
      for (let j = 0; j < seasonLen; j++) {
        const index = season * seasonLen + j;
        if (index < n) {
          if (this.seasonalityType === 'multiplicative') {
            this.seasonal[j] += this.level !== 0 ? values[index] / this.level : 1;
          } else {
            this.seasonal[j] += values[index] - this.level;
          }
        }
      }
    }
    
    // Average the seasonal components
    const numSeasons = Math.floor(n / seasonLen);
    for (let j = 0; j < seasonLen; j++) {
      this.seasonal[j] /= numSeasons;
    }
    
    // Normalize seasonal components
    if (this.seasonalityType === 'multiplicative') {
      const seasonalSum = this.seasonal.reduce((sum, val) => sum + val, 0);
      const seasonalMean = seasonalSum / seasonLen;
      if (seasonalMean !== 0) {
        this.seasonal = this.seasonal.map(val => val / seasonalMean);
      }
    } else {
      const seasonalSum = this.seasonal.reduce((sum, val) => sum + val, 0);
      const adjustment = seasonalSum / seasonLen;
      this.seasonal = this.seasonal.map(val => val - adjustment);
    }
  }

  async forecast(horizon) {
    if (!this.fitted) {
      throw new Error('Model must be fitted before forecasting');
    }

    const forecasts = [];
    
    for (let h = 1; h <= horizon; h++) {
      const seasonalIndex = (this.timeSeries.length + h - 1) % this.seasonalPeriods;
      const levelTrend = this.level + h * this.trend;
      const seasonalComponent = this.seasonal[seasonalIndex];
      
      let forecast;
      if (this.seasonalityType === 'multiplicative') {
        forecast = levelTrend * seasonalComponent;
      } else {
        forecast = levelTrend + seasonalComponent;
      }
      
      forecasts.push(Math.max(0, forecast)); // Ensure non-negative forecasts
    }
    
    return forecasts;
  }

  getParameters() {
    return {
      alpha: this.alpha,
      beta: this.beta, 
      gamma: this.gamma,
      seasonalPeriods: this.seasonalPeriods,
      seasonalityType: this.seasonalityType,
      type: 'HoltWinters'
    };
  }

  getDiagnostics() {
    return {
      finalLevel: this.level,
      finalTrend: this.trend,
      seasonalComponents: [...this.seasonal],
      parameters: this.getParameters()
    };
  }
}

export default HoltWintersModel;