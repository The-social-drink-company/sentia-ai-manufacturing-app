class ARIMAModel {
  constructor(options = {}) {
    this.p = options.p || 1; // AR order
    this.d = options.d || 1; // Differencing order
    this.q = options.q || 1; // MA order
    
    this.arCoefficients = null;
    this.maCoefficients = null;
    this.intercept = null;
    this.timeSeries = null;
    this.differencedSeries = null;
    this.residuals = null;
    this.fitted = false;
  }

  async fit(timeSeries) {
    this.timeSeries = timeSeries.map(point => ({
      date: point.date,
      value: parseFloat(point.value)
    }));

    const values = this.timeSeries.map(point => point.value);
    
    if (values.length < Math.max(this.p + this.d, this.q + this.d, 10)) {
      throw new Error(`Insufficient data for ARIMA(${this.p},${this.d},${this.q}). Need at least ${Math.max(this.p + this.d, this.q + this.d, 10)} points.`);
    }

    // Apply differencing
    this.differencedSeries = this.applyDifferencing(values, this.d);
    
    // Fit ARIMA model using method of moments approximation
    this.fitARIMA();
    
    this.fitted = true;
    return this;
  }

  applyDifferencing(series, order) {
    let differenced = [...series];
    
    for (let d = 0; d < order; d++) {
      const newDifferenced = [];
      for (let i = 1; i < differenced.length; i++) {
        newDifferenced.push(differenced[i] - differenced[i - 1]);
      }
      differenced = newDifferenced;
    }
    
    return differenced;
  }

  fitARIMA() {
    const n = this.differencedSeries.length;
    
    // Initialize coefficients using method of moments / Yule-Walker equations
    this.arCoefficients = new Array(this.p).fill(0);
    this.maCoefficients = new Array(this.q).fill(0);
    
    // For simple implementation, use basic AR approximation
    if (this.p > 0 && n > this.p) {
      // Estimate AR coefficients using Yule-Walker equations
      const autocorrelations = this.calculateAutocorrelations(this.differencedSeries, this.p);
      this.arCoefficients = this.solveYuleWalker(autocorrelations);
    }
    
    // Estimate MA coefficients using residuals from AR fit
    if (this.q > 0) {
      const arResiduals = this.calculateARResiduals();
      this.maCoefficients = this.estimateMACoefficients(arResiduals);
    }
    
    // Calculate intercept
    this.intercept = this.calculateIntercept();
    
    // Calculate final residuals
    this.residuals = this.calculateResiduals();
  }

  calculateAutocorrelations(series, maxLag) {
    const n = series.length;
    const mean = series.reduce((sum, val) => sum + val, 0) / n;
    const variance = series.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    
    const autocorrelations = [1]; // lag 0 is always 1
    
    for (let lag = 1; lag <= maxLag; lag++) {
      let covariance = 0;
      for (let i = lag; i < n; i++) {
        covariance += (series[i] - mean) * (series[i - lag] - mean);
      }
      covariance /= n;
      autocorrelations.push(covariance / variance);
    }
    
    return autocorrelations;
  }

  solveYuleWalker(autocorrelations) {
    // Solve Yule-Walker equations: R * phi = r
    // where R is the autocorrelation matrix, phi are AR coefficients, r is autocorrelation vector
    
    if (this.p === 1) {
      return [autocorrelations[1]];
    }
    
    // For p > 1, use simplified estimation
    const coefficients = new Array(this.p);
    for (let i = 0; i < this.p; i++) {
      coefficients[i] = autocorrelations[i + 1] * (0.8 ** i); // Decay factor for stability
    }
    
    // Ensure stationarity (sum of AR coefficients < 1)
    let sum = coefficients.reduce((s, c) => s + Math.abs(c), 0);
    if (sum >= 1) {
      const factor = 0.9 / sum;
      for (let i = 0; i < coefficients.length; i++) {
        coefficients[i] *= factor;
      }
    }
    
    return coefficients;
  }

  calculateARResiduals() {
    const residuals = [];
    const n = this.differencedSeries.length;
    
    for (let i = this.p; i < n; i++) {
      let prediction = 0;
      
      // AR component
      for (let j = 0; j < this.p; j++) {
        prediction += this.arCoefficients[j] * this.differencedSeries[i - 1 - j];
      }
      
      residuals.push(this.differencedSeries[i] - prediction);
    }
    
    return residuals;
  }

  estimateMACoefficients(residuals) {
    const n = residuals.length;
    const coefficients = new Array(this.q);
    
    // Simple estimation based on autocorrelations of residuals
    const residualAutocorr = this.calculateAutocorrelations(residuals, this.q);
    
    for (let i = 0; i < this.q; i++) {
      coefficients[i] = -residualAutocorr[i + 1] * (0.7 ** i); // Negative sign and decay for invertibility
    }
    
    return coefficients;
  }

  calculateIntercept() {
    const mean = this.differencedSeries.reduce((sum, val) => sum + val, 0) / this.differencedSeries.length;
    let arMean = 0;
    
    for (let i = 0; i < this.p; i++) {
      arMean += this.arCoefficients[i];
    }
    
    return mean * (1 - arMean);
  }

  calculateResiduals() {
    const residuals = [];
    const n = this.differencedSeries.length;
    const startIndex = Math.max(this.p, this.q);
    
    for (let i = startIndex; i < n; i++) {
      let prediction = this.intercept;
      
      // AR component
      for (let j = 0; j < this.p; j++) {
        if (i - 1 - j >= 0) {
          prediction += this.arCoefficients[j] * this.differencedSeries[i - 1 - j];
        }
      }
      
      // MA component (use previous residuals, or 0 if not available)
      for (let j = 0; j < this.q; j++) {
        const residualIndex = residuals.length - 1 - j;
        if (residualIndex >= 0) {
          prediction += this.maCoefficients[j] * residuals[residualIndex];
        }
      }
      
      const residual = this.differencedSeries[i] - prediction;
      residuals.push(residual);
    }
    
    return residuals;
  }

  async forecast(horizon) {
    if (!this.fitted) {
      throw new Error('Model must be fitted before forecasting');
    }

    // Forecast on differenced series
    const differencedForecasts = this.forecastDifferenced(horizon);
    
    // Integrate forecasts back to original scale
    const forecasts = this.integrateForecast(differencedForecasts);
    
    return forecasts.map(val => Math.max(0, val)); // Ensure non-negative
  }

  forecastDifferenced(horizon) {
    const forecasts = [];
    const extendedDifferenced = [...this.differencedSeries];
    const extendedResiduals = [...this.residuals];
    
    for (let h = 0; h < horizon; h++) {
      let prediction = this.intercept;
      
      // AR component
      for (let j = 0; j < this.p; j++) {
        const index = extendedDifferenced.length - 1 - j;
        if (index >= 0) {
          prediction += this.arCoefficients[j] * extendedDifferenced[index];
        }
      }
      
      // MA component (residuals become 0 for future periods)
      for (let j = 0; j < this.q; j++) {
        const residualIndex = extendedResiduals.length - 1 - j;
        if (residualIndex >= 0) {
          prediction += this.maCoefficients[j] * extendedResiduals[residualIndex];
        }
      }
      
      forecasts.push(prediction);
      extendedDifferenced.push(prediction);
      extendedResiduals.push(0); // Assume zero residuals for future
    }
    
    return forecasts;
  }

  integrateForecast(differencedForecasts) {
    if (this.d === 0) {
      return differencedForecasts;
    }
    
    // Get the last d values from original series for integration
    const originalValues = this.timeSeries.map(point => point.value);
    const lastValues = originalValues.slice(-this.d);
    
    let integratedForecasts = [...differencedForecasts];
    
    // Apply integration d times (reverse of differencing)
    for (let order = this.d - 1; order >= 0; order--) {
      const newIntegrated = [];
      let lastValue = order < lastValues.length ? lastValues[order] : originalValues[originalValues.length - 1];
      
      for (let i = 0; i < integratedForecasts.length; i++) {
        lastValue += integratedForecasts[i];
        newIntegrated.push(lastValue);
      }
      
      integratedForecasts = newIntegrated;
    }
    
    return integratedForecasts;
  }

  getParameters() {
    return {
      p: this.p,
      d: this.d,
      q: this.q,
      arCoefficients: this.arCoefficients ? [...this.arCoefficients] : null,
      maCoefficients: this.maCoefficients ? [...this.maCoefficients] : null,
      intercept: this.intercept,
      type: 'ARIMA'
    };
  }

  getDiagnostics() {
    return {
      arCoefficients: this.arCoefficients ? [...this.arCoefficients] : null,
      maCoefficients: this.maCoefficients ? [...this.maCoefficients] : null,
      intercept: this.intercept,
      residuals: this.residuals ? [...this.residuals] : null,
      residualMean: this.residuals ? this.residuals.reduce((sum, r) => sum + r, 0) / this.residuals.length : null,
      residualStd: this.residuals ? Math.sqrt(this.residuals.reduce((sum, r) => sum + r * r, 0) / this.residuals.length) : null,
      parameters: this.getParameters()
    };
  }
}

export default ARIMAModel;