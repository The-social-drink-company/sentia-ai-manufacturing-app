import { logInfo, logWarn, logError } from '../logger';

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface ForecastResult {
  predictions: Array<{
    timestamp: Date;
    predicted: number;
    confidence: number;
    upperBound: number;
    lowerBound: number;
  }>;
  accuracy: {
    mae: number; // Mean Absolute Error
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    r2: number; // R-squared
  };
  modelInfo: {
    algorithm: 'exponential_smoothing' | 'arima' | 'linear_regression' | 'seasonal_decomposition';
    parameters: Record<string, any>;
    trainingPeriod: { start: Date; end: Date };
    seasonality: 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  insights: {
    trend: 'increasing' | 'decreasing' | 'stable';
    volatility: 'low' | 'medium' | 'high';
    seasonalPatterns: Array<{
      period: string;
      strength: number;
      description: string;
    }>;
    anomalies: Array<{
      timestamp: Date;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  };
}

export interface DemandForecastConfig {
  horizon: number; // Number of periods to forecast
  confidence: number; // Confidence level (0.8, 0.9, 0.95, 0.99)
  seasonality: 'auto' | 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  includeExternalFactors: boolean;
  algorithm: 'auto' | 'exponential_smoothing' | 'arima' | 'linear_regression';
}

export interface ExternalFactor {
  name: string;
  type: 'economic' | 'seasonal' | 'promotional' | 'supply_chain' | 'competitive';
  values: TimeSeriesDataPoint[];
  correlation?: number;
  impact?: 'positive' | 'negative' | 'neutral';
}

export interface AnomalyDetectionResult {
  anomalies: Array<{
    timestamp: Date;
    actual: number;
    expected: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'spike' | 'drop' | 'trend_change' | 'seasonal_anomaly';
    confidence: number;
    context?: string;
  }>;
  statistics: {
    totalAnomalies: number;
    anomalyRate: number;
    severityBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
  };
}

export interface CustomerBehaviorPrediction {
  customerId: string;
  predictions: {
    nextOrderDate: Date | null;
    nextOrderValue: number | null;
    churnProbability: number;
    lifetimeValue: number;
    preferredProducts: Array<{
      productId: string;
      probability: number;
      expectedQuantity: number;
    }>;
  };
  insights: {
    orderFrequency: number; // orders per month
    averageOrderValue: number;
    seasonality: string[];
    growthTrend: 'increasing' | 'decreasing' | 'stable';
    riskFactors: string[];
  };
}

export class PredictiveAnalyticsEngine {
  private modelCache: Map<string, any> = new Map();

  async generateDemandForecast(
    historicalData: TimeSeriesDataPoint[],
    config: DemandForecastConfig,
    externalFactors?: ExternalFactor[]
  ): Promise<ForecastResult> {
    try {
      logInfo('Generating demand forecast', { 
        dataPoints: historicalData.length, 
        horizon: config.horizon 
      });

      // Validate and clean data
      const cleanData = this.preprocessData(historicalData);
      if (cleanData.length < 10) {
        throw new Error('Insufficient historical data for reliable forecasting');
      }

      // Detect seasonality if auto
      const detectedSeasonality = config.seasonality === 'auto' 
        ? this.detectSeasonality(cleanData)
        : config.seasonality;

      // Select algorithm based on data characteristics
      const algorithm = config.algorithm === 'auto'
        ? this.selectOptimalAlgorithm(cleanData, detectedSeasonality)
        : config.algorithm;

      // Generate base forecast
      const baseForecast = await this.generateBaseForecast(
        cleanData, 
        algorithm, 
        config.horizon, 
        detectedSeasonality
      );

      // Incorporate external factors if provided
      const adjustedForecast = externalFactors?.length
        ? this.incorporateExternalFactors(baseForecast, externalFactors, config.horizon)
        : baseForecast;

      // Calculate confidence intervals
      const forecastWithConfidence = this.calculateConfidenceIntervals(
        adjustedForecast,
        cleanData,
        config.confidence
      );

      // Calculate accuracy metrics using cross-validation
      const accuracy = await this.calculateAccuracyMetrics(cleanData, algorithm, detectedSeasonality);

      // Generate insights
      const insights = this.generateForecastInsights(cleanData, forecastWithConfidence, detectedSeasonality);

      const result: ForecastResult = {
        predictions: forecastWithConfidence,
        accuracy,
        modelInfo: {
          algorithm,
          parameters: this.getModelParameters(algorithm, detectedSeasonality),
          trainingPeriod: {
            start: cleanData[0].timestamp,
            end: cleanData[cleanData.length - 1].timestamp
          },
          seasonality: detectedSeasonality
        },
        insights
      };

      // Cache the model for future use
      const cacheKey = `forecast_${algorithm}_${detectedSeasonality}_${cleanData.length}`;
      this.modelCache.set(cacheKey, {
        algorithm,
        parameters: result.modelInfo.parameters,
        timestamp: new Date()
      });

      logInfo('Demand forecast generated successfully', {
        algorithm,
        seasonality: detectedSeasonality,
        accuracy: accuracy.mape
      });

      return result;

    } catch (error: any) {
      logError('Failed to generate demand forecast', error);
      throw new Error(`Forecast generation failed: ${error.message}`);
    }
  }

  async detectAnomalies(
    data: TimeSeriesDataPoint[],
    sensitivity: number = 2.5,
    contextWindow: number = 30
  ): Promise<AnomalyDetectionResult> {
    try {
      const anomalies: AnomalyDetectionResult['anomalies'] = [];
      
      // Statistical anomaly detection using modified Z-score
      const values = data.map(d => d.value);
      const movingStats = this.calculateMovingStatistics(values, contextWindow);

      for (let i = contextWindow; i < data.length; i++) {
        const current = data[i];
        const stats = movingStats[i - contextWindow];
        
        const modifiedZScore = Math.abs(0.6745 * (current.value - stats.median) / stats.mad);
        
        if (modifiedZScore > sensitivity) {
          const deviation = current.value - stats.expected;
          const deviationPercent = Math.abs(deviation / stats.expected) * 100;
          
          let severity: 'low' | 'medium' | 'high' | 'critical';
          if (deviationPercent > 50) severity = 'critical';
          else if (deviationPercent > 25) severity = 'high';
          else if (deviationPercent > 10) severity = 'medium';
          else severity = 'low';

          let type: 'spike' | 'drop' | 'trend_change' | 'seasonal_anomaly';
          if (deviation > 0) type = 'spike';
          else if (deviation < 0) type = 'drop';
          else type = this.detectAnomalyType(data, i, contextWindow);

          anomalies.push({
            timestamp: current.timestamp,
            actual: current.value,
            expected: stats.expected,
            deviation: deviation,
            severity,
            type,
            confidence: Math.min(modifiedZScore / sensitivity, 1.0),
            context: this.generateAnomalyContext(data, i, type, deviationPercent)
          });
        }
      }

      // Calculate statistics
      const totalAnomalies = anomalies.length;
      const anomalyRate = totalAnomalies / (data.length - contextWindow);
      
      const severityBreakdown = anomalies.reduce((acc, a) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const typeBreakdown = anomalies.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      logInfo('Anomaly detection completed', {
        totalAnomalies,
        anomalyRate: Math.round(anomalyRate * 100 * 100) / 100
      });

      return {
        anomalies: anomalies.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        statistics: {
          totalAnomalies,
          anomalyRate,
          severityBreakdown,
          typeBreakdown
        }
      };

    } catch (error: any) {
      logError('Anomaly detection failed', error);
      throw new Error(`Anomaly detection failed: ${error.message}`);
    }
  }

  async predictCustomerBehavior(
    customerId: string,
    orderHistory: Array<{
      orderId: string;
      timestamp: Date;
      value: number;
      products: Array<{ productId: string; quantity: number; price: number }>;
    }>
  ): Promise<CustomerBehaviorPrediction> {
    try {
      if (orderHistory.length < 3) {
        throw new Error('Insufficient order history for behavior prediction');
      }

      // Calculate order frequency
      const orderDates = orderHistory.map(o => o.timestamp).sort();
      const intervals = [];
      for (let i = 1; i < orderDates.length; i++) {
        intervals.push(orderDates[i].getTime() - orderDates[i-1].getTime());
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const orderFrequency = 30.44 * 24 * 60 * 60 * 1000 / avgInterval; // orders per month

      // Calculate average order value
      const avgOrderValue = orderHistory.reduce((sum, order) => sum + order.value, 0) / orderHistory.length;

      // Predict next order date
      const lastOrder = orderHistory[orderHistory.length - 1];
      const nextOrderDate = new Date(lastOrder.timestamp.getTime() + avgInterval);

      // Calculate churn probability based on recency
      const daysSinceLastOrder = (Date.now() - lastOrder.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      const expectedInterval = avgInterval / (1000 * 60 * 60 * 24);
      const churnProbability = Math.min(Math.max(daysSinceLastOrder / (expectedInterval * 2), 0), 1);

      // Calculate lifetime value
      const customerAge = orderHistory.length > 1 
        ? (orderDates[orderDates.length - 1].getTime() - orderDates[0].getTime()) / (1000 * 60 * 60 * 24)
        : 30;
      const monthlyValue = (avgOrderValue * orderFrequency);
      const expectedLifetimeMonths = Math.max(12, customerAge / 30.44); // At least 12 months
      const lifetimeValue = monthlyValue * expectedLifetimeMonths * (1 - churnProbability);

      // Analyze product preferences
      const productFrequency = new Map<string, { count: number; totalQuantity: number; totalValue: number }>();
      
      orderHistory.forEach(order => {
        order.products.forEach(product => {
          const current = productFrequency.get(product.productId) || { count: 0, totalQuantity: 0, totalValue: 0 };
          current.count++;
          current.totalQuantity += product.quantity;
          current.totalValue += product.price * product.quantity;
          productFrequency.set(product.productId, current);
        });
      });

      const preferredProducts = Array.from(productFrequency.entries())
        .map(([productId, stats]) => ({
          productId,
          probability: stats.count / orderHistory.length,
          expectedQuantity: stats.totalQuantity / stats.count
        }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 10);

      // Detect seasonality in orders
      const monthlyOrders = new Map<number, number>();
      orderHistory.forEach(order => {
        const month = order.timestamp.getMonth();
        monthlyOrders.set(month, (monthlyOrders.get(month) || 0) + 1);
      });

      const seasonality = Array.from(monthlyOrders.entries())
        .filter(([_, count]) => count > orderHistory.length * 0.2)
        .map(([month, _]) => new Date(2024, month, 1).toLocaleDateString('en', { month: 'long' }));

      // Determine growth trend
      const recentOrders = orderHistory.slice(-Math.min(5, Math.floor(orderHistory.length / 2)));
      const earlyOrders = orderHistory.slice(0, Math.min(5, Math.floor(orderHistory.length / 2)));
      
      const recentAvg = recentOrders.reduce((sum, order) => sum + order.value, 0) / recentOrders.length;
      const earlyAvg = earlyOrders.reduce((sum, order) => sum + order.value, 0) / earlyOrders.length;
      
      let growthTrend: 'increasing' | 'decreasing' | 'stable';
      const growthRate = (recentAvg - earlyAvg) / earlyAvg;
      if (growthRate > 0.1) growthTrend = 'increasing';
      else if (growthRate < -0.1) growthTrend = 'decreasing';
      else growthTrend = 'stable';

      // Identify risk factors
      const riskFactors: string[] = [];
      if (churnProbability > 0.7) riskFactors.push('High churn risk');
      if (daysSinceLastOrder > expectedInterval * 1.5) riskFactors.push('Inactive customer');
      if (growthTrend === 'decreasing') riskFactors.push('Declining order values');
      if (orderFrequency < 1) riskFactors.push('Low order frequency');

      const result: CustomerBehaviorPrediction = {
        customerId,
        predictions: {
          nextOrderDate: churnProbability < 0.8 ? nextOrderDate : null,
          nextOrderValue: churnProbability < 0.8 ? avgOrderValue : null,
          churnProbability,
          lifetimeValue,
          preferredProducts
        },
        insights: {
          orderFrequency,
          averageOrderValue: avgOrderValue,
          seasonality,
          growthTrend,
          riskFactors
        }
      };

      logInfo('Customer behavior prediction completed', {
        customerId,
        churnProbability: Math.round(churnProbability * 100),
        lifetimeValue: Math.round(lifetimeValue)
      });

      return result;

    } catch (error: any) {
      logError('Customer behavior prediction failed', error);
      throw new Error(`Customer behavior prediction failed: ${error.message}`);
    }
  }

  // Private helper methods

  private preprocessData(data: TimeSeriesDataPoint[]): TimeSeriesDataPoint[] {
    // Sort by timestamp
    const sorted = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Remove duplicates and invalid values
    const cleaned = sorted.filter((point, index, array) => {
      if (isNaN(point.value) || !isFinite(point.value)) return false;
      if (index > 0 && point.timestamp.getTime() === array[index - 1].timestamp.getTime()) return false;
      return true;
    });

    // Fill small gaps using interpolation
    const filled: TimeSeriesDataPoint[] = [];
    for (let i = 0; i < cleaned.length - 1; i++) {
      filled.push(cleaned[i]);
      
      const current = cleaned[i];
      const next = cleaned[i + 1];
      const timeDiff = next.timestamp.getTime() - current.timestamp.getTime();
      
      // If gap is more than 2 periods but less than 7, interpolate
      const expectedInterval = this.estimateInterval(cleaned);
      if (timeDiff > 2 * expectedInterval && timeDiff < 7 * expectedInterval) {
        const steps = Math.floor(timeDiff / expectedInterval) - 1;
        const valueDiff = (next.value - current.value) / (steps + 1);
        
        for (let j = 1; j <= steps; j++) {
          filled.push({
            timestamp: new Date(current.timestamp.getTime() + j * expectedInterval),
            value: current.value + j * valueDiff,
            metadata: { interpolated: true }
          });
        }
      }
    }
    
    if (cleaned.length > 0) {
      filled.push(cleaned[cleaned.length - 1]);
    }

    return filled;
  }

  private estimateInterval(data: TimeSeriesDataPoint[]): number {
    if (data.length < 2) return 24 * 60 * 60 * 1000; // Default to daily
    
    const intervals = [];
    for (let i = 1; i < Math.min(10, data.length); i++) {
      intervals.push(data[i].timestamp.getTime() - data[i-1].timestamp.getTime());
    }
    
    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  private detectSeasonality(data: TimeSeriesDataPoint[]): 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' {
    if (data.length < 14) return 'none';

    const values = data.map(d => d.value);
    
    // Test for different seasonal periods
    const periods = [
      { name: 'weekly', days: 7 },
      { name: 'monthly', days: 30 },
      { name: 'quarterly', days: 90 },
      { name: 'yearly', days: 365 }
    ];

    let bestSeason = 'none';
    let bestStrength = 0;

    for (const period of periods) {
      const strength = this.calculateSeasonalStrength(data, period.days);
      if (strength > bestStrength && strength > 0.3) {
        bestStrength = strength;
        bestSeason = period.name;
      }
    }

    return bestSeason as any;
  }

  private calculateSeasonalStrength(data: TimeSeriesDataPoint[], periodDays: number): number {
    const intervalMs = this.estimateInterval(data);
    const periodPoints = Math.floor((periodDays * 24 * 60 * 60 * 1000) / intervalMs);
    
    if (data.length < periodPoints * 2) return 0;

    const seasonalMeans = new Array(periodPoints).fill(0);
    const seasonalCounts = new Array(periodPoints).fill(0);

    // Calculate seasonal averages
    data.forEach((point, index) => {
      const seasonalIndex = index % periodPoints;
      seasonalMeans[seasonalIndex] += point.value;
      seasonalCounts[seasonalIndex]++;
    });

    for (let i = 0; i < periodPoints; i++) {
      if (seasonalCounts[i] > 0) {
        seasonalMeans[i] /= seasonalCounts[i];
      }
    }

    // Calculate variance within seasons vs between seasons
    const overallMean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    const betweenVariance = seasonalMeans.reduce((sum, mean) => sum + Math.pow(mean - overallMean, 2), 0) / periodPoints;
    const withinVariance = data.reduce((sum, point, index) => {
      const seasonalIndex = index % periodPoints;
      return sum + Math.pow(point.value - seasonalMeans[seasonalIndex], 2);
    }, 0) / data.length;

    return betweenVariance / (betweenVariance + withinVariance);
  }

  private selectOptimalAlgorithm(
    data: TimeSeriesDataPoint[], 
    seasonality: string
  ): 'exponential_smoothing' | 'arima' | 'linear_regression' | 'seasonal_decomposition' {
    const dataLength = data.length;
    
    if (seasonality !== 'none' && dataLength > 50) {
      return 'seasonal_decomposition';
    } else if (dataLength > 100) {
      return 'arima';
    } else if (seasonality !== 'none') {
      return 'exponential_smoothing';
    } else {
      return 'linear_regression';
    }
  }

  private async generateBaseForecast(
    data: TimeSeriesDataPoint[],
    algorithm: string,
    horizon: number,
    seasonality: string
  ): Promise<Array<{ timestamp: Date; predicted: number }>> {
    const lastTimestamp = data[data.length - 1].timestamp;
    const interval = this.estimateInterval(data);
    const forecasts: Array<{ timestamp: Date; predicted: number }> = [];

    switch (algorithm) {
      case 'exponential_smoothing':
        return this.exponentialSmoothingForecast(data, horizon, interval, seasonality);
      
      case 'linear_regression':
        return this.linearRegressionForecast(data, horizon, interval);
      
      case 'seasonal_decomposition':
        return this.seasonalDecompositionForecast(data, horizon, interval, seasonality);
      
      default:
        return this.exponentialSmoothingForecast(data, horizon, interval, seasonality);
    }
  }

  private exponentialSmoothingForecast(
    data: TimeSeriesDataPoint[],
    horizon: number,
    interval: number,
    seasonality: string
  ): Array<{ timestamp: Date; predicted: number }> {
    const values = data.map(d => d.value);
    const alpha = 0.3; // Smoothing parameter
    const beta = 0.1;  // Trend parameter
    const gamma = 0.1; // Seasonal parameter

    let level = values[0];
    let trend = 0;
    const seasonal: number[] = [];

    // Initialize seasonal components
    if (seasonality !== 'none') {
      const seasonLength = this.getSeasonalLength(seasonality);
      for (let i = 0; i < seasonLength; i++) {
        seasonal[i] = 1; // Multiplicative seasonality
      }
    }

    // Update components with historical data
    for (let i = 1; i < values.length; i++) {
      const prevLevel = level;
      const seasonalIndex = seasonality !== 'none' ? i % seasonal.length : 0;
      const seasonalFactor = seasonality !== 'none' ? seasonal[seasonalIndex] : 1;

      level = alpha * (values[i] / seasonalFactor) + (1 - alpha) * (prevLevel + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
      
      if (seasonality !== 'none') {
        seasonal[seasonalIndex] = gamma * (values[i] / level) + (1 - gamma) * seasonal[seasonalIndex];
      }
    }

    // Generate forecasts
    const forecasts: Array<{ timestamp: Date; predicted: number }> = [];
    const lastTimestamp = data[data.length - 1].timestamp;

    for (let i = 1; i <= horizon; i++) {
      const forecastLevel = level + i * trend;
      const seasonalIndex = seasonality !== 'none' 
        ? (data.length - 1 + i) % seasonal.length 
        : 0;
      const seasonalFactor = seasonality !== 'none' ? seasonal[seasonalIndex] : 1;
      
      forecasts.push({
        timestamp: new Date(lastTimestamp.getTime() + i * interval),
        predicted: Math.max(0, forecastLevel * seasonalFactor)
      });
    }

    return forecasts;
  }

  private linearRegressionForecast(
    data: TimeSeriesDataPoint[],
    horizon: number,
    interval: number
  ): Array<{ timestamp: Date; predicted: number }> {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data.map(d => d.value);

    // Calculate regression coefficients
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecasts
    const forecasts: Array<{ timestamp: Date; predicted: number }> = [];
    const lastTimestamp = data[data.length - 1].timestamp;

    for (let i = 1; i <= horizon; i++) {
      const predicted = intercept + slope * (n - 1 + i);
      forecasts.push({
        timestamp: new Date(lastTimestamp.getTime() + i * interval),
        predicted: Math.max(0, predicted)
      });
    }

    return forecasts;
  }

  private seasonalDecompositionForecast(
    data: TimeSeriesDataPoint[],
    horizon: number,
    interval: number,
    seasonality: string
  ): Array<{ timestamp: Date; predicted: number }> {
    // Simplified seasonal decomposition
    const seasonLength = this.getSeasonalLength(seasonality);
    const values = data.map(d => d.value);
    
    // Calculate trend using moving average
    const trend = this.calculateTrend(values, seasonLength);
    
    // Calculate seasonal components
    const seasonal = this.calculateSeasonalComponents(values, trend, seasonLength);
    
    // Calculate residuals (noise)
    const residuals = values.map((val, i) => {
      const trendValue = trend[i] || trend[trend.length - 1];
      const seasonalValue = seasonal[i % seasonLength];
      return val - trendValue - seasonalValue;
    });

    // Forecast trend
    const lastTrendValue = trend[trend.length - 1];
    const trendSlope = trend.length > 1 
      ? (trend[trend.length - 1] - trend[Math.max(0, trend.length - 10)]) / 9
      : 0;

    // Generate forecasts
    const forecasts: Array<{ timestamp: Date; predicted: number }> = [];
    const lastTimestamp = data[data.length - 1].timestamp;

    for (let i = 1; i <= horizon; i++) {
      const forecastTrend = lastTrendValue + i * trendSlope;
      const seasonalIndex = (data.length - 1 + i) % seasonLength;
      const seasonalComponent = seasonal[seasonalIndex];
      
      const predicted = forecastTrend + seasonalComponent;
      
      forecasts.push({
        timestamp: new Date(lastTimestamp.getTime() + i * interval),
        predicted: Math.max(0, predicted)
      });
    }

    return forecasts;
  }

  private getSeasonalLength(seasonality: string): number {
    const lengths: Record<string, number> = {
      'weekly': 7,
      'monthly': 12,
      'quarterly': 4,
      'yearly': 12
    };
    return lengths[seasonality] || 12;
  }

  private calculateTrend(values: number[], seasonLength: number): number[] {
    const trend: number[] = [];
    const windowSize = Math.max(3, Math.ceil(seasonLength / 2));
    
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(values.length, i + Math.ceil(windowSize / 2));
      const window = values.slice(start, end);
      trend[i] = window.reduce((a, b) => a + b, 0) / window.length;
    }
    
    return trend;
  }

  private calculateSeasonalComponents(values: number[], trend: number[], seasonLength: number): number[] {
    const seasonal = new Array(seasonLength).fill(0);
    const counts = new Array(seasonLength).fill(0);

    // Calculate average seasonal effect for each period
    for (let i = 0; i < values.length; i++) {
      const seasonalIndex = i % seasonLength;
      const detrended = values[i] - (trend[i] || 0);
      seasonal[seasonalIndex] += detrended;
      counts[seasonalIndex]++;
    }

    // Average and normalize
    for (let i = 0; i < seasonLength; i++) {
      if (counts[i] > 0) {
        seasonal[i] /= counts[i];
      }
    }

    // Ensure seasonal components sum to zero
    const seasonalMean = seasonal.reduce((a, b) => a + b, 0) / seasonLength;
    for (let i = 0; i < seasonLength; i++) {
      seasonal[i] -= seasonalMean;
    }

    return seasonal;
  }

  private incorporateExternalFactors(
    baseForecast: Array<{ timestamp: Date; predicted: number }>,
    externalFactors: ExternalFactor[],
    horizon: number
  ): Array<{ timestamp: Date; predicted: number }> {
    // Simplified external factor incorporation
    return baseForecast.map((forecast, index) => {
      let adjustment = 1.0;
      
      externalFactors.forEach(factor => {
        if (factor.correlation && Math.abs(factor.correlation) > 0.3) {
          const factorValue = this.getExternalFactorValue(factor, forecast.timestamp);
          const factorImpact = factor.correlation * (factorValue / 100); // Simplified
          adjustment *= (1 + factorImpact * 0.1); // Limit impact to 10%
        }
      });

      return {
        ...forecast,
        predicted: Math.max(0, forecast.predicted * adjustment)
      };
    });
  }

  private getExternalFactorValue(factor: ExternalFactor, timestamp: Date): number {
    // Find closest value in time
    let closest = factor.values[0];
    let minDiff = Math.abs(timestamp.getTime() - factor.values[0].timestamp.getTime());

    for (const value of factor.values) {
      const diff = Math.abs(timestamp.getTime() - value.timestamp.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closest = value;
      }
    }

    return closest.value;
  }

  private calculateConfidenceIntervals(
    forecasts: Array<{ timestamp: Date; predicted: number }>,
    historicalData: TimeSeriesDataPoint[],
    confidenceLevel: number
  ): Array<{ timestamp: Date; predicted: number; confidence: number; upperBound: number; lowerBound: number }> {
    // Calculate prediction error from historical data
    const errors = this.calculateForecastErrors(historicalData);
    const errorStd = this.calculateStandardDeviation(errors);
    
    // Z-score for confidence level
    const zScores: Record<number, number> = {
      0.80: 1.28,
      0.90: 1.64,
      0.95: 1.96,
      0.99: 2.58
    };
    
    const zScore = zScores[confidenceLevel] || 1.96;

    return forecasts.map((forecast, index) => {
      // Error typically increases with forecast horizon
      const horizonMultiplier = Math.sqrt(index + 1);
      const predictionError = errorStd * horizonMultiplier;
      const marginOfError = zScore * predictionError;

      return {
        ...forecast,
        confidence: confidenceLevel,
        upperBound: forecast.predicted + marginOfError,
        lowerBound: Math.max(0, forecast.predicted - marginOfError)
      };
    });
  }

  private calculateForecastErrors(data: TimeSeriesDataPoint[]): number[] {
    // Simple one-step ahead errors using exponential smoothing
    const errors: number[] = [];
    let smoothed = data[0].value;
    const alpha = 0.3;

    for (let i = 1; i < data.length; i++) {
      const error = Math.abs(data[i].value - smoothed);
      errors.push(error);
      smoothed = alpha * data[i].value + (1 - alpha) * smoothed;
    }

    return errors;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private async calculateAccuracyMetrics(
    data: TimeSeriesDataPoint[],
    algorithm: string,
    seasonality: string
  ): Promise<{ mae: number; mape: number; rmse: number; r2: number }> {
    // Cross-validation accuracy using last 20% of data
    const trainSize = Math.floor(data.length * 0.8);
    const trainData = data.slice(0, trainSize);
    const testData = data.slice(trainSize);

    if (testData.length === 0) {
      return { mae: 0, mape: 0, rmse: 0, r2: 0 };
    }

    const testForecasts = await this.generateBaseForecast(
      trainData,
      algorithm,
      testData.length,
      seasonality
    );

    const actual = testData.map(d => d.value);
    const predicted = testForecasts.map(f => f.predicted);

    // Mean Absolute Error
    const mae = actual.reduce((sum, act, i) => sum + Math.abs(act - predicted[i]), 0) / actual.length;

    // Mean Absolute Percentage Error
    const mape = actual.reduce((sum, act, i) => {
      if (act !== 0) {
        return sum + Math.abs((act - predicted[i]) / act);
      }
      return sum;
    }, 0) / actual.length * 100;

    // Root Mean Square Error
    const rmse = Math.sqrt(
      actual.reduce((sum, act, i) => sum + Math.pow(act - predicted[i], 2), 0) / actual.length
    );

    // R-squared
    const actualMean = actual.reduce((a, b) => a + b, 0) / actual.length;
    const totalSumSquares = actual.reduce((sum, act) => sum + Math.pow(act - actualMean, 2), 0);
    const residualSumSquares = actual.reduce((sum, act, i) => sum + Math.pow(act - predicted[i], 2), 0);
    const r2 = 1 - (residualSumSquares / totalSumSquares);

    return { mae: Math.round(mae), mape: Math.round(mape * 100) / 100, rmse: Math.round(rmse), r2: Math.round(r2 * 100) / 100 };
  }

  private generateForecastInsights(
    historicalData: TimeSeriesDataPoint[],
    forecasts: Array<{ predicted: number; upperBound: number; lowerBound: number }>,
    seasonality: string
  ): ForecastResult['insights'] {
    const values = historicalData.map(d => d.value);
    const recentValues = values.slice(-Math.min(10, values.length));
    const forecastValues = forecasts.map(f => f.predicted);

    // Determine trend
    const recentMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const forecastMean = forecastValues.reduce((a, b) => a + b, 0) / forecastValues.length;
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    const trendChange = (forecastMean - recentMean) / recentMean;
    if (trendChange > 0.05) trend = 'increasing';
    else if (trendChange < -0.05) trend = 'decreasing';
    else trend = 'stable';

    // Calculate volatility
    const allValues = [...values, ...forecastValues];
    const overallMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    const variance = allValues.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0) / allValues.length;
    const coefficient = Math.sqrt(variance) / overallMean;
    
    let volatility: 'low' | 'medium' | 'high';
    if (coefficient < 0.1) volatility = 'low';
    else if (coefficient < 0.3) volatility = 'medium';
    else volatility = 'high';

    // Seasonal patterns
    const seasonalPatterns = seasonality !== 'none' ? [{
      period: seasonality,
      strength: 0.7, // Simplified
      description: `Strong ${seasonality} seasonal pattern detected`
    }] : [];

    // Detect anomalies in forecast
    const anomalies: Array<{ timestamp: Date; severity: 'low' | 'medium' | 'high'; description: string }> = [];
    forecasts.forEach((forecast, index) => {
      const confidenceRange = forecast.upperBound - forecast.lowerBound;
      const uncertainty = confidenceRange / forecast.predicted;
      
      if (uncertainty > 0.5) {
        anomalies.push({
          timestamp: forecast.timestamp,
          severity: uncertainty > 1.0 ? 'high' : 'medium',
          description: `High uncertainty in forecast (${Math.round(uncertainty * 100)}% range)`
        });
      }
    });

    return {
      trend,
      volatility,
      seasonalPatterns,
      anomalies
    };
  }

  private getModelParameters(algorithm: string, seasonality: string): Record<string, any> {
    const baseParams = {
      algorithm,
      seasonality,
      timestamp: new Date().toISOString()
    };

    switch (algorithm) {
      case 'exponential_smoothing':
        return { ...baseParams, alpha: 0.3, beta: 0.1, gamma: 0.1 };
      case 'linear_regression':
        return { ...baseParams, method: 'least_squares' };
      case 'seasonal_decomposition':
        return { ...baseParams, decomposition_type: 'additive' };
      default:
        return baseParams;
    }
  }

  private calculateMovingStatistics(values: number[], window: number): Array<{
    median: number;
    mad: number; // Median Absolute Deviation
    expected: number;
  }> {
    const stats: Array<{ median: number; mad: number; expected: number }> = [];
    
    for (let i = window; i < values.length; i++) {
      const windowValues = values.slice(i - window, i).sort((a, b) => a - b);
      const median = windowValues[Math.floor(windowValues.length / 2)];
      
      const deviations = windowValues.map(v => Math.abs(v - median)).sort((a, b) => a - b);
      const mad = deviations[Math.floor(deviations.length / 2)];
      
      stats.push({
        median,
        mad: mad || 1, // Avoid division by zero
        expected: median // Simplified - use median as expected
      });
    }
    
    return stats;
  }

  private detectAnomalyType(
    data: TimeSeriesDataPoint[],
    index: number,
    window: number
  ): 'spike' | 'drop' | 'trend_change' | 'seasonal_anomaly' {
    if (index < window + 5) return 'spike';
    
    const current = data[index].value;
    const recent = data.slice(Math.max(0, index - 5), index).map(d => d.value);
    const historical = data.slice(Math.max(0, index - window), index - 5).map(d => d.value);
    
    const recentMean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const historicalMean = historical.reduce((a, b) => a + b, 0) / historical.length;
    
    const trendChange = Math.abs(recentMean - historicalMean) / historicalMean;
    
    if (trendChange > 0.2) return 'trend_change';
    if (current > recentMean * 1.5) return 'spike';
    if (current < recentMean * 0.5) return 'drop';
    return 'seasonal_anomaly';
  }

  private generateAnomalyContext(
    data: TimeSeriesDataPoint[],
    index: number,
    type: string,
    deviationPercent: number
  ): string {
    const contexts: Record<string, string> = {
      'spike': `Unusual spike detected - ${Math.round(deviationPercent)}% above expected`,
      'drop': `Significant drop detected - ${Math.round(deviationPercent)}% below expected`,
      'trend_change': `Trend change detected - pattern differs from historical behavior`,
      'seasonal_anomaly': `Seasonal anomaly - value doesn't match expected seasonal pattern`
    };
    
    return contexts[type] || 'Anomaly detected';
  }
}

export const defaultPredictiveEngine = new PredictiveAnalyticsEngine();