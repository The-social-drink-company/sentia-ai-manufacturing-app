class SimpleMovingAverageModel {
  constructor(options = {}) {
    this.windowSize = options.windowSize || 14;
    this.timeSeries = null;
    this.fitted = false;
  }

  async fit(timeSeries) {
    this.timeSeries = timeSeries.map(point => ({
      date: point.date,
      value: parseFloat(point.value)
    }));
    this.fitted = true;
    return this;
  }

  async forecast(horizon) {
    if (!this.fitted) {
      throw new Error('Model must be fitted before forecasting');
    }

    const values = this.timeSeries.map(point => point.value);
    const lastValues = values.slice(-this.windowSize);
    const movingAverage = lastValues.reduce((sum, _val) => sum + val, 0) / lastValues.length;
    
    // Simple SMA assumes constant forecast equal to the moving average
    return new Array(horizon).fill(movingAverage);
  }

  getParameters() {
    return {
      windowSize: this.windowSize,
      type: 'SimpleMovingAverage'
    };
  }
}

export default SimpleMovingAverageModel;