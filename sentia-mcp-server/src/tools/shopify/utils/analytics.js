/**
 * Shopify Analytics Utility
 * 
 * Advanced analytics and business intelligence utilities for Shopify data,
 * including cross-store comparisons, trend analysis, and forecasting.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Shopify Analytics Utility Class
 */
export class ShopifyAnalytics {
  constructor(options = {}) {
    this.options = {
      // Analysis configuration
      trendsWindowDays: options.trendsWindowDays || 30,
      forecastDays: options.forecastDays || 30,
      seasonalityPeriod: options.seasonalityPeriod || 7, // Weekly patterns
      confidenceLevel: options.confidenceLevel || 0.95,
      
      ...options
    };

    logger.info('Shopify Analytics initialized', {
      trendsWindowDays: this.options.trendsWindowDays,
      forecastDays: this.options.forecastDays
    });
  }

  /**
   * Analyze cross-store performance
   */
  analyzeCrossStorePerformance(storeResults) {
    try {
      const analysis = {
        summary: {
          totalStores: 0,
          activeStores: 0,
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0
        },
        performance: {},
        insights: [],
        recommendations: []
      };

      const validStores = Object.entries(storeResults).filter(([, result]) => 
        result.success && result.analytics
      );

      analysis.summary.totalStores = Object.keys(storeResults).length;
      analysis.summary.activeStores = validStores.length;

      if (validStores.length === 0) {
        return {
          ...analysis,
          insights: ['No valid store data available for analysis']
        };
      }

      // Calculate aggregated metrics
      validStores.forEach(([storeId, result]) => {
        const analytics = result.analytics.summary;
        
        analysis.summary.totalRevenue += analytics.totalRevenue || 0;
        analysis.summary.totalOrders += analytics.totalOrders || 0;
        analysis.summary.totalCustomers += analytics.uniqueCustomers || 0;

        // Store-specific performance
        analysis.performance[storeId] = {
          revenue: analytics.totalRevenue || 0,
          orders: analytics.totalOrders || 0,
          customers: analytics.uniqueCustomers || 0,
          aov: analytics.averageOrderValue || 0,
          conversionRate: this.calculateConversionRate(analytics),
          revenueShare: 0, // Will be calculated later
          performanceIndex: 0 // Will be calculated later
        };
      });

      // Calculate relative performance metrics
      this.calculateRelativePerformance(analysis);

      // Generate insights
      analysis.insights = this.generateCrossStoreInsights(analysis);

      // Generate recommendations
      analysis.recommendations = this.generateCrossStoreRecommendations(analysis);

      return analysis;

    } catch (error) {
      logger.error('Failed to analyze cross-store performance', {
        error: error.message
      });
      return {
        error: error.message,
        insights: ['Analysis failed due to data processing error']
      };
    }
  }

  /**
   * Analyze sales trends
   */
  analyzeSalesTrends(salesData, options = {}) {
    try {
      const windowDays = options.windowDays || this.options.trendsWindowDays;
      
      if (!salesData || salesData.length < 7) {
        return {
          error: 'Insufficient data for trend analysis (minimum 7 days required)'
        };
      }

      const sortedData = [...salesData].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const trends = {
        overall: this.calculateOverallTrend(sortedData),
        weekly: this.analyzeWeeklyPatterns(sortedData),
        monthly: this.analyzeMonthlyPatterns(sortedData),
        seasonal: this.analyzeSeasonalPatterns(sortedData),
        volatility: this.calculateVolatility(sortedData),
        growth: this.calculateGrowthMetrics(sortedData)
      };

      return trends;

    } catch (error) {
      logger.error('Failed to analyze sales trends', {
        error: error.message
      });
      return {
        error: error.message
      };
    }
  }

  /**
   * Generate sales forecast
   */
  generateSalesForecast(historicalData, options = {}) {
    try {
      const forecastDays = options.forecastDays || this.options.forecastDays;
      
      if (!historicalData || historicalData.length < 14) {
        return {
          error: 'Insufficient historical data for forecasting (minimum 14 days required)'
        };
      }

      const sortedData = [...historicalData].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Extract revenue values
      const revenues = sortedData.map(d => d.revenue || 0);
      
      // Calculate trend using linear regression
      const trend = this.calculateLinearTrend(revenues);
      
      // Calculate seasonal components
      const seasonal = this.extractSeasonalComponents(revenues);
      
      // Generate forecast
      const forecast = [];
      const lastDate = new Date(sortedData[sortedData.length - 1].date);
      
      for (let i = 1; i <= forecastDays; i++) {
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(forecastDate.getDate() + i);
        
        // Linear trend component
        const trendValue = trend.slope * (sortedData.length + i) + trend.intercept;
        
        // Seasonal component
        const seasonalIndex = (sortedData.length + i - 1) % this.options.seasonalityPeriod;
        const seasonalMultiplier = seasonal.factors[seasonalIndex] || 1;
        
        // Forecast value with seasonal adjustment
        const forecastValue = Math.max(0, trendValue * seasonalMultiplier);
        
        // Calculate confidence interval
        const confidence = this.calculateForecastConfidence(i, forecastDays, trend.rSquared);
        
        forecast.push({
          date: forecastDate.toISOString().split('T')[0],
          revenue: forecastValue,
          confidence: confidence,
          trend: trendValue,
          seasonal: seasonalMultiplier
        });
      }

      return {
        forecast,
        model: {
          trend: trend,
          seasonal: seasonal,
          accuracy: trend.rSquared,
          method: 'linear_trend_with_seasonality'
        },
        summary: {
          totalForecastRevenue: forecast.reduce((sum, day) => sum + day.revenue, 0),
          averageDailyRevenue: forecast.reduce((sum, day) => sum + day.revenue, 0) / forecast.length,
          averageConfidence: forecast.reduce((sum, day) => sum + day.confidence, 0) / forecast.length
        }
      };

    } catch (error) {
      logger.error('Failed to generate sales forecast', {
        error: error.message
      });
      return {
        error: error.message
      };
    }
  }

  /**
   * Analyze customer lifetime value
   */
  analyzeCustomerLifetimeValue(customers) {
    try {
      if (!customers || customers.length === 0) {
        return {
          error: 'No customer data available for CLV analysis'
        };
      }

      const clvAnalysis = {
        overall: {
          averageCLV: 0,
          medianCLV: 0,
          totalCLV: 0,
          customerCount: customers.length
        },
        segments: {
          high: { threshold: 0, count: 0, totalCLV: 0 },
          medium: { threshold: 0, count: 0, totalCLV: 0 },
          low: { threshold: 0, count: 0, totalCLV: 0 }
        },
        distribution: {},
        trends: {}
      };

      // Calculate CLV for each customer
      const clvValues = customers.map(customer => {
        return this.calculateCustomerCLV(customer);
      }).filter(clv => clv > 0);

      if (clvValues.length === 0) {
        return {
          error: 'Unable to calculate CLV for any customers'
        };
      }

      // Sort CLV values
      const sortedCLV = clvValues.sort((a, b) => a - b);

      // Calculate overall metrics
      clvAnalysis.overall.totalCLV = sortedCLV.reduce((sum, clv) => sum + clv, 0);
      clvAnalysis.overall.averageCLV = clvAnalysis.overall.totalCLV / sortedCLV.length;
      clvAnalysis.overall.medianCLV = this.calculateMedian(sortedCLV);

      // Define segments
      const p33 = this.calculatePercentile(sortedCLV, 33);
      const p67 = this.calculatePercentile(sortedCLV, 67);

      clvAnalysis.segments.low.threshold = p33;
      clvAnalysis.segments.medium.threshold = p67;
      clvAnalysis.segments.high.threshold = p67;

      // Categorize customers
      sortedCLV.forEach(clv => {
        if (clv <= p33) {
          clvAnalysis.segments.low.count++;
          clvAnalysis.segments.low.totalCLV += clv;
        } else if (clv <= p67) {
          clvAnalysis.segments.medium.count++;
          clvAnalysis.segments.medium.totalCLV += clv;
        } else {
          clvAnalysis.segments.high.count++;
          clvAnalysis.segments.high.totalCLV += clv;
        }
      });

      return clvAnalysis;

    } catch (error) {
      logger.error('Failed to analyze customer lifetime value', {
        error: error.message
      });
      return {
        error: error.message
      };
    }
  }

  /**
   * Analyze product performance
   */
  analyzeProductPerformance(products, orders) {
    try {
      const productAnalysis = {
        topPerformers: [],
        underPerformers: [],
        trending: [],
        declining: [],
        insights: []
      };

      if (!products || products.length === 0) {
        return {
          error: 'No product data available for analysis'
        };
      }

      // Create product performance map
      const productPerformance = new Map();

      // Initialize product metrics
      products.forEach(product => {
        productPerformance.set(product.id, {
          id: product.id,
          title: product.title,
          totalRevenue: 0,
          totalQuantity: 0,
          orderCount: 0,
          averagePrice: 0,
          conversionRate: 0,
          trendScore: 0
        });
      });

      // Aggregate order data
      if (orders && orders.length > 0) {
        orders.forEach(order => {
          if (order.line_items) {
            order.line_items.forEach(item => {
              const productId = item.product_id;
              const performance = productPerformance.get(productId);
              
              if (performance) {
                performance.totalRevenue += parseFloat(item.price || 0) * (item.quantity || 0);
                performance.totalQuantity += item.quantity || 0;
                performance.orderCount++;
              }
            });
          }
        });
      }

      // Calculate derived metrics
      productPerformance.forEach(performance => {
        if (performance.totalQuantity > 0) {
          performance.averagePrice = performance.totalRevenue / performance.totalQuantity;
        }
        
        // Simple trend score based on recent performance
        performance.trendScore = this.calculateProductTrendScore(performance);
      });

      // Convert to array and sort
      const performanceArray = Array.from(productPerformance.values());

      // Identify top performers (by revenue)
      productAnalysis.topPerformers = performanceArray
        .filter(p => p.totalRevenue > 0)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      // Identify underperformers (low revenue, high inventory)
      productAnalysis.underPerformers = performanceArray
        .filter(p => p.totalRevenue < 100 && p.orderCount < 5)
        .sort((a, b) => a.totalRevenue - b.totalRevenue)
        .slice(0, 10);

      // Identify trending products (positive trend score)
      productAnalysis.trending = performanceArray
        .filter(p => p.trendScore > 0.1)
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, 10);

      // Identify declining products (negative trend score)
      productAnalysis.declining = performanceArray
        .filter(p => p.trendScore < -0.1)
        .sort((a, b) => a.trendScore - b.trendScore)
        .slice(0, 10);

      // Generate insights
      productAnalysis.insights = this.generateProductInsights(productAnalysis);

      return productAnalysis;

    } catch (error) {
      logger.error('Failed to analyze product performance', {
        error: error.message
      });
      return {
        error: error.message
      };
    }
  }

  // Helper methods for calculations

  calculateConversionRate(analytics) {
    if (!analytics.totalOrders || !analytics.conversionData) return 0;
    return (analytics.conversionData.completedOrders / analytics.totalOrders) * 100;
  }

  calculateRelativePerformance(analysis) {
    const stores = Object.keys(analysis.performance);
    const totalRevenue = analysis.summary.totalRevenue;

    stores.forEach(storeId => {
      const performance = analysis.performance[storeId];
      
      // Calculate revenue share
      performance.revenueShare = totalRevenue > 0 
        ? (performance.revenue / totalRevenue) * 100 
        : 0;

      // Calculate performance index (normalized score)
      const metrics = [
        performance.revenue,
        performance.orders,
        performance.customers,
        performance.aov
      ];
      
      performance.performanceIndex = this.calculateNormalizedScore(metrics);
    });
  }

  calculateNormalizedScore(metrics) {
    // Simple normalization - could be enhanced with more sophisticated scoring
    const weights = [0.4, 0.3, 0.2, 0.1]; // Revenue, orders, customers, AOV
    let score = 0;
    
    metrics.forEach((metric, index) => {
      score += (metric || 0) * weights[index];
    });
    
    return Math.min(100, Math.max(0, score / 1000)); // Normalize to 0-100 scale
  }

  calculateOverallTrend(data) {
    const revenues = data.map(d => d.revenue || 0);
    return this.calculateLinearTrend(revenues);
  }

  calculateLinearTrend(values) {
    const n = values.length;
    const xSum = (n * (n + 1)) / 2;
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, index) => sum + val * (index + 1), 0);
    const x2Sum = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    // Calculate R-squared
    const yMean = ySum / n;
    const ssTotal = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssResidual = values.reduce((sum, val, index) => {
      const predicted = slope * (index + 1) + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    
    const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

    return { slope, intercept, rSquared };
  }

  analyzeWeeklyPatterns(data) {
    const weeklyAverages = {};
    const weeklyCounts = {};

    data.forEach(entry => {
      const date = new Date(entry.date);
      const dayOfWeek = date.getDay();
      
      if (!weeklyAverages[dayOfWeek]) {
        weeklyAverages[dayOfWeek] = 0;
        weeklyCounts[dayOfWeek] = 0;
      }
      
      weeklyAverages[dayOfWeek] += entry.revenue || 0;
      weeklyCounts[dayOfWeek]++;
    });

    // Calculate averages
    Object.keys(weeklyAverages).forEach(day => {
      weeklyAverages[day] = weeklyAverages[day] / weeklyCounts[day];
    });

    return weeklyAverages;
  }

  analyzeMonthlyPatterns(data) {
    const monthlyData = {};

    data.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, orders: 0, count: 0 };
      }
      
      monthlyData[monthKey].revenue += entry.revenue || 0;
      monthlyData[monthKey].orders += entry.orders || 0;
      monthlyData[monthKey].count++;
    });

    return monthlyData;
  }

  analyzeSeasonalPatterns(data) {
    // Simple seasonal analysis - could be enhanced with more sophisticated methods
    const quarters = { Q1: [], Q2: [], Q3: [], Q4: [] };

    data.forEach(entry => {
      const date = new Date(entry.date);
      const month = date.getMonth() + 1;
      
      let quarter;
      if (month <= 3) quarter = 'Q1';
      else if (month <= 6) quarter = 'Q2';
      else if (month <= 9) quarter = 'Q3';
      else quarter = 'Q4';
      
      quarters[quarter].push(entry.revenue || 0);
    });

    // Calculate quarterly averages
    const seasonalAverages = {};
    Object.keys(quarters).forEach(quarter => {
      const values = quarters[quarter];
      seasonalAverages[quarter] = values.length > 0 
        ? values.reduce((sum, val) => sum + val, 0) / values.length 
        : 0;
    });

    return seasonalAverages;
  }

  calculateVolatility(data) {
    const revenues = data.map(d => d.revenue || 0);
    const mean = revenues.reduce((sum, val) => sum + val, 0) / revenues.length;
    const variance = revenues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / revenues.length;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      mean,
      variance,
      standardDeviation,
      coefficientOfVariation: mean > 0 ? standardDeviation / mean : 0
    };
  }

  calculateGrowthMetrics(data) {
    if (data.length < 2) return { error: 'Insufficient data for growth calculation' };

    const revenues = data.map(d => d.revenue || 0);
    const firstPeriod = revenues.slice(0, Math.floor(revenues.length / 2));
    const secondPeriod = revenues.slice(Math.floor(revenues.length / 2));

    const firstAverage = firstPeriod.reduce((sum, val) => sum + val, 0) / firstPeriod.length;
    const secondAverage = secondPeriod.reduce((sum, val) => sum + val, 0) / secondPeriod.length;

    const growthRate = firstAverage > 0 ? ((secondAverage - firstAverage) / firstAverage) * 100 : 0;

    return {
      firstPeriodAverage: firstAverage,
      secondPeriodAverage: secondAverage,
      growthRate,
      growthDirection: growthRate > 0 ? 'increasing' : growthRate < 0 ? 'decreasing' : 'stable'
    };
  }

  extractSeasonalComponents(values) {
    const period = this.options.seasonalityPeriod;
    const factors = [];

    // Calculate seasonal factors for each position in the cycle
    for (let i = 0; i < period; i++) {
      const periodValues = [];
      
      for (let j = i; j < values.length; j += period) {
        periodValues.push(values[j]);
      }
      
      const average = periodValues.length > 0 
        ? periodValues.reduce((sum, val) => sum + val, 0) / periodValues.length 
        : 1;
      
      factors[i] = average;
    }

    // Normalize factors around 1.0
    const overallAverage = factors.reduce((sum, val) => sum + val, 0) / factors.length;
    const normalizedFactors = factors.map(factor => 
      overallAverage > 0 ? factor / overallAverage : 1
    );

    return {
      factors: normalizedFactors,
      period,
      strength: this.calculateSeasonalStrength(normalizedFactors)
    };
  }

  calculateSeasonalStrength(factors) {
    const mean = factors.reduce((sum, val) => sum + val, 0) / factors.length;
    const variance = factors.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / factors.length;
    return Math.sqrt(variance);
  }

  calculateForecastConfidence(dayAhead, totalDays, modelAccuracy) {
    // Confidence decreases with distance and increases with model accuracy
    const distanceDecay = Math.exp(-dayAhead / (totalDays * 0.5));
    const baseConfidence = Math.max(0.1, modelAccuracy || 0.5);
    return Math.min(0.95, baseConfidence * distanceDecay);
  }

  calculateCustomerCLV(customer) {
    // Simplified CLV calculation
    const totalSpent = parseFloat(customer.total_spent || 0);
    const orderCount = customer.orders_count || 0;
    
    if (orderCount === 0) return 0;
    
    const averageOrderValue = totalSpent / orderCount;
    const estimatedLifetime = Math.max(1, orderCount * 0.5); // Simplified lifetime estimation
    
    return averageOrderValue * estimatedLifetime;
  }

  calculateMedian(sortedArray) {
    const mid = Math.floor(sortedArray.length / 2);
    return sortedArray.length % 2 === 0
      ? (sortedArray[mid - 1] + sortedArray[mid]) / 2
      : sortedArray[mid];
  }

  calculatePercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  calculateProductTrendScore(performance) {
    // Simplified trend score - would be enhanced with time-series data
    const revenueScore = Math.log(performance.totalRevenue + 1) / 10;
    const quantityScore = Math.log(performance.totalQuantity + 1) / 10;
    return (revenueScore + quantityScore) / 2;
  }

  generateCrossStoreInsights(analysis) {
    const insights = [];
    const stores = Object.keys(analysis.performance);

    if (stores.length < 2) {
      insights.push('Single store analysis - cross-store comparison not available');
      return insights;
    }

    // Find best and worst performing stores
    const storesByRevenue = stores.sort((a, b) => 
      analysis.performance[b].revenue - analysis.performance[a].revenue
    );

    const topStore = storesByRevenue[0];
    const bottomStore = storesByRevenue[storesByRevenue.length - 1];

    insights.push(`${topStore} is the top performing store with ${analysis.performance[topStore].revenueShare.toFixed(1)}% of total revenue`);
    
    if (analysis.performance[topStore].revenue > analysis.performance[bottomStore].revenue * 2) {
      insights.push(`Significant performance gap detected between top and bottom performing stores`);
    }

    // AOV insights
    const avgAOV = stores.reduce((sum, store) => sum + analysis.performance[store].aov, 0) / stores.length;
    const highAOVStores = stores.filter(store => analysis.performance[store].aov > avgAOV * 1.2);
    
    if (highAOVStores.length > 0) {
      insights.push(`${highAOVStores.join(', ')} have significantly higher average order values`);
    }

    return insights;
  }

  generateCrossStoreRecommendations(analysis) {
    const recommendations = [];
    const stores = Object.keys(analysis.performance);

    // Performance improvement recommendations
    const underperformingStores = stores.filter(store => 
      analysis.performance[store].performanceIndex < 30
    );

    if (underperformingStores.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        stores: underperformingStores,
        action: 'Review marketing strategies and product offerings for underperforming stores'
      });
    }

    // AOV optimization recommendations
    const lowAOVStores = stores.filter(store => 
      analysis.performance[store].aov < analysis.summary.totalRevenue / analysis.summary.totalOrders * 0.8
    );

    if (lowAOVStores.length > 0) {
      recommendations.push({
        type: 'aov',
        priority: 'medium',
        stores: lowAOVStores,
        action: 'Implement cross-selling and upselling strategies to increase average order value'
      });
    }

    return recommendations;
  }

  generateProductInsights(productAnalysis) {
    const insights = [];

    if (productAnalysis.topPerformers.length > 0) {
      const topProduct = productAnalysis.topPerformers[0];
      insights.push(`${topProduct.title} is the top revenue generator with $${topProduct.totalRevenue.toFixed(2)}`);
    }

    if (productAnalysis.trending.length > 0) {
      insights.push(`${productAnalysis.trending.length} products showing positive growth trends`);
    }

    if (productAnalysis.declining.length > 0) {
      insights.push(`${productAnalysis.declining.length} products showing declining performance - consider promotional strategies`);
    }

    if (productAnalysis.underPerformers.length > 0) {
      insights.push(`${productAnalysis.underPerformers.length} products identified as underperforming - review pricing and positioning`);
    }

    return insights;
  }
}