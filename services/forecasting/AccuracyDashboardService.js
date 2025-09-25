import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';

class AccuracyDashboardService {
  constructor(forecastingService, options = {}) {
    this.forecastingService = forecastingService;
    this.config = {
      trackingPeriodDays: options.trackingPeriodDays || 90,
      alertThresholds: {
        mapeWarning: options.mapeWarning || 25,
        mapeCritical: options.mapeCritical || 40,
        coverageWarning: options.coverageWarning || 0.85,
        coverageCritical: options.coverageCritical || 0.75
      },
      updateFrequency: options.updateFrequency || 'daily'
    };
    
    this.accuracyHistory = new Map();
    this.alerts = [];
  }

  // Generate comprehensive accuracy dashboard
  async generateAccuracyDashboard(seriesIds, options = {}) {
    const {
      regions = ['UK', 'EU', 'USA'],
      models = ['Ensemble', 'ARIMA', 'HoltWinters', 'Linear'],
      horizons = [7, 30, 90],
      includeTrends = true,
      includeAlerts = true
    } = options;

    const dashboard = {
      overview: {},
      modelPerformance: {},
      regionPerformance: {},
      horizonPerformance: {},
      predictionIntervalCoverage: {},
      trends: {},
      alerts: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        seriesCount: seriesIds.length,
        trackingPeriod: this.config.trackingPeriodDays
      }
    };

    // Generate overview metrics
    dashboard.overview = await this.generateOverviewMetrics(seriesIds, regions, models);

    // Generate model performance comparison
    dashboard.modelPerformance = await this.generateModelPerformance(seriesIds, models, regions);

    // Generate regional performance analysis
    dashboard.regionPerformance = await this.generateRegionPerformance(seriesIds, regions);

    // Generate horizon performance analysis
    dashboard.horizonPerformance = await this.generateHorizonPerformance(seriesIds, horizons);

    // Generate prediction interval coverage analysis
    dashboard.predictionIntervalCoverage = await this.generateCoverageAnalysis(seriesIds, models);

    // Generate trends if requested
    if (includeTrends) {
      dashboard.trends = this.generateAccuracyTrends();
    }

    // Generate alerts if requested
    if (includeAlerts) {
      dashboard.alerts = this.generateAccuracyAlerts(dashboard);
    }

    return dashboard;
  }

  // Generate overview accuracy metrics
  async generateOverviewMetrics(seriesIds, regions, models) {
    const overview = {
      totalSeries: seriesIds.length,
      avgMAPE: 0,
      avgRMSE: 0,
      avgMAE: 0,
      bestModel: null,
      worstModel: null,
      overallHealth: 'Good'
    };

    const modelMetrics = {};
    let totalMAPE = 0;
    let totalRMSE = 0;
    let totalMAE = 0;
    let processedForecasts = 0;

    for (const seriesId of seriesIds.slice(0, 10)) { // Sample for performance
      for (const region of regions) {
        try {
          const result = await this.forecastingService.forecastWithOptions(seriesId, {
            horizon: 30,
            region,
            models: models
          });

          if (result.backtestMetrics) {
            Object.entries(result.backtestMetrics).forEach(([model, metrics]) => {
              if (!modelMetrics[model]) {
                modelMetrics[model] = { mape: [], rmse: [], mae: [] };
              }
              
              if (metrics.mape) modelMetrics[model].mape.push(metrics.mape);
              if (metrics.rmse) modelMetrics[model].rmse.push(metrics.rmse);
              if (metrics.mae) modelMetrics[model].mae.push(metrics.mae);

              totalMAPE += metrics.mape || 0;
              totalRMSE += metrics.rmse || 0;
              totalMAE += metrics.mae || 0;
              processedForecasts++;
            });
          }

        } catch (error) {
          logWarn(`Failed to get metrics for series ${seriesId} in region ${region}:`, error.message);
        }
      }
    }

    // Calculate averages
    if (processedForecasts > 0) {
      overview.avgMAPE = totalMAPE / processedForecasts;
      overview.avgRMSE = totalRMSE / processedForecasts;
      overview.avgMAE = totalMAE / processedForecasts;
    }

    // Find best and worst performing models
    const modelAvgMAPE = {};
    Object.entries(modelMetrics).forEach(([model, metrics]) => {
      if (metrics.mape.length > 0) {
        modelAvgMAPE[model] = metrics.mape.reduce((sum, val) => sum + val, 0) / metrics.mape.length;
      }
    });

    if (Object.keys(modelAvgMAPE).length > 0) {
      overview.bestModel = Object.keys(modelAvgMAPE).reduce((best, model) => 
        modelAvgMAPE[model] < modelAvgMAPE[best] ? model : best
      );
      overview.worstModel = Object.keys(modelAvgMAPE).reduce((worst, model) => 
        modelAvgMAPE[model] > modelAvgMAPE[worst] ? model : worst
      );
    }

    // Determine overall health
    if (overview.avgMAPE <= 15) {
      overview.overallHealth = 'Excellent';
    } else if (overview.avgMAPE <= 25) {
      overview.overallHealth = 'Good';
    } else if (overview.avgMAPE <= 35) {
      overview.overallHealth = 'Fair';
    } else {
      overview.overallHealth = 'Poor';
    }

    return overview;
  }

  // Generate model performance comparison
  async generateModelPerformance(seriesIds, models, regions) {
    const performance = {};

    for (const model of models) {
      performance[model] = {
        avgMAPE: 0,
        avgRMSE: 0,
        successRate: 0,
        bestRegion: null,
        worstRegion: null,
        regionPerformance: {}
      };

      const modelData = [];
      const regionData = {};

      for (const region of regions) {
        regionData[region] = [];

        for (const seriesId of seriesIds.slice(0, 5)) { // Sample
          try {
            const result = await this.forecastingService.forecastWithOptions(seriesId, {
              horizon: 30,
              region,
              models: [model]
            });

            if (result.backtestMetrics && result.backtestMetrics[model]) {
              const metrics = result.backtestMetrics[model];
              modelData.push(metrics);
              regionData[region].push(metrics);
            }

          } catch (error) {
            // Skip failed forecasts
          }
        }
      }

      // Calculate model averages
      if (modelData.length > 0) {
        performance[model].avgMAPE = modelData.reduce((sum, m) => sum + (m.mape || 0), 0) / modelData.length;
        performance[model].avgRMSE = modelData.reduce((sum, m) => sum + (m.rmse || 0), 0) / modelData.length;
        performance[model].successRate = (modelData.length / (seriesIds.length * regions.length)) * 100;
      }

      // Calculate regional performance for this model
      Object.entries(regionData).forEach(([region, metrics]) => {
        if (metrics.length > 0) {
          performance[model].regionPerformance[region] = {
            avgMAPE: metrics.reduce((sum, m) => sum + (m.mape || 0), 0) / metrics.length,
            count: metrics.length
          };
        }
      });

      // Find best and worst regions for this model
      const regionMAPEs = Object.entries(performance[model].regionPerformance)
        .filter(([_, data]) => data.avgMAPE > 0)
        .map(([region, data]) => ({ region, mape: data.avgMAPE }));

      if (regionMAPEs.length > 0) {
        performance[model].bestRegion = regionMAPEs.reduce((best, current) => 
          current.mape < best.mape ? current : best
        ).region;
        
        performance[model].worstRegion = regionMAPEs.reduce((worst, current) => 
          current.mape > worst.mape ? current : worst
        ).region;
      }
    }

    return performance;
  }

  // Generate regional performance analysis
  async generateRegionPerformance(seriesIds, regions) {
    const regionPerformance = {};

    for (const region of regions) {
      regionPerformance[region] = {
        avgMAPE: 0,
        avgRMSE: 0,
        forecastCount: 0,
        bestModel: null,
        modelPerformance: {},
        dataQuality: 'Unknown',
        seasonalPatterns: []
      };

      const regionMetrics = [];
      const modelData = {};

      for (const seriesId of seriesIds.slice(0, 8)) { // Sample
        try {
          const result = await this.forecastingService.forecastWithOptions(seriesId, {
            horizon: 30,
            region
          });

          if (result.backtestMetrics) {
            Object.entries(result.backtestMetrics).forEach(([model, metrics]) => {
              regionMetrics.push(metrics);
              
              if (!modelData[model]) {
                modelData[model] = [];
              }
              modelData[model].push(metrics);
            });
          }

          regionPerformance[region].forecastCount++;

        } catch (error) {
          logWarn(`Regional analysis failed for series ${seriesId} in region ${region}:`, error.message);
        }
      }

      // Calculate regional averages
      if (regionMetrics.length > 0) {
        regionPerformance[region].avgMAPE = regionMetrics.reduce((sum, m) => sum + (m.mape || 0), 0) / regionMetrics.length;
        regionPerformance[region].avgRMSE = regionMetrics.reduce((sum, m) => sum + (m.rmse || 0), 0) / regionMetrics.length;
      }

      // Calculate model performance in this region
      Object.entries(modelData).forEach(([model, metrics]) => {
        if (metrics.length > 0) {
          regionPerformance[region].modelPerformance[model] = {
            avgMAPE: metrics.reduce((sum, m) => sum + (m.mape || 0), 0) / metrics.length,
            count: metrics.length
          };
        }
      });

      // Find best model for this region
      const modelMAPEs = Object.entries(regionPerformance[region].modelPerformance)
        .filter(([_, data]) => data.avgMAPE > 0)
        .map(([model, data]) => ({ model, mape: data.avgMAPE }));

      if (modelMAPEs.length > 0) {
        regionPerformance[region].bestModel = modelMAPEs.reduce((best, current) => 
          current.mape < best.mape ? current : best
        ).model;
      }

      // Assess data quality
      if (regionPerformance[region].avgMAPE <= 20) {
        regionPerformance[region].dataQuality = 'High';
      } else if (regionPerformance[region].avgMAPE <= 35) {
        regionPerformance[region].dataQuality = 'Medium';
      } else {
        regionPerformance[region].dataQuality = 'Low';
      }
    }

    return regionPerformance;
  }

  // Generate horizon performance analysis
  async generateHorizonPerformance(seriesIds, horizons) {
    const horizonPerformance = {};

    for (const horizon of horizons) {
      horizonPerformance[`${horizon}d`] = {
        avgMAPE: 0,
        avgRMSE: 0,
        forecastCount: 0,
        degradationRate: 0,
        bestModel: null
      };

      const horizonMetrics = [];
      const modelData = {};

      for (const seriesId of seriesIds.slice(0, 6)) { // Sample
        try {
          const result = await this.forecastingService.forecastWithOptions(seriesId, {
            horizon
          });

          if (result.backtestMetrics) {
            Object.entries(result.backtestMetrics).forEach(([model, metrics]) => {
              horizonMetrics.push(metrics);
              
              if (!modelData[model]) {
                modelData[model] = [];
              }
              modelData[model].push(metrics);
            });
          }

          horizonPerformance[`${horizon}d`].forecastCount++;

        } catch (error) {
          logWarn(`Horizon analysis failed for series ${seriesId} at horizon ${horizon}:`, error.message);
        }
      }

      // Calculate horizon averages
      if (horizonMetrics.length > 0) {
        horizonPerformance[`${horizon}d`].avgMAPE = horizonMetrics.reduce((sum, m) => sum + (m.mape || 0), 0) / horizonMetrics.length;
        horizonPerformance[`${horizon}d`].avgRMSE = horizonMetrics.reduce((sum, m) => sum + (m.rmse || 0), 0) / horizonMetrics.length;
      }

      // Find best model for this horizon
      const modelMAPEs = Object.entries(modelData)
        .filter(([_, metrics]) => metrics.length > 0)
        .map(([model, metrics]) => ({
          model,
          mape: metrics.reduce((sum, m) => sum + (m.mape || 0), 0) / metrics.length
        }));

      if (modelMAPEs.length > 0) {
        horizonPerformance[`${horizon}d`].bestModel = modelMAPEs.reduce((best, current) => 
          current.mape < best.mape ? current : best
        ).model;
      }
    }

    // Calculate degradation rates between horizons
    const sortedHorizons = horizons.sort((a, b) => a - b);
    for (let i = 1; i < sortedHorizons.length; i++) {
      const currentHorizon = sortedHorizons[i];
      const previousHorizon = sortedHorizons[i - 1];
      
      const currentMAPE = horizonPerformance[`${currentHorizon}d`].avgMAPE;
      const previousMAPE = horizonPerformance[`${previousHorizon}d`].avgMAPE;
      
      if (previousMAPE > 0) {
        horizonPerformance[`${currentHorizon}d`].degradationRate = 
          ((currentMAPE - previousMAPE) / previousMAPE) * 100;
      }
    }

    return horizonPerformance;
  }

  // Generate prediction interval coverage analysis
  async generateCoverageAnalysis(seriesIds, models) {
    const coverage = {
      overall: {
        targetCoverage: this.forecastingService.config.predictionIntervalCoverage,
        actualCoverage: 0,
        coverageRatio: 0
      },
      byModel: {}
    };

    const allCoverages = [];
    const modelCoverages = {};

    for (const model of models) {
      modelCoverages[model] = [];
    }

    for (const seriesId of seriesIds.slice(0, 8)) { // Sample for performance
      try {
        const result = await this.forecastingService.forecastWithOptions(seriesId, {
          horizon: 30,
          models: models
        });

        if (result.predictionIntervals) {
          Object.entries(result.predictionIntervals).forEach(([model, intervals]) => {
            if (intervals.achievedCoverage) {
              allCoverages.push(intervals.achievedCoverage);
              modelCoverages[model].push(intervals.achievedCoverage);
            }
          });
        }

      } catch (error) {
        logWarn(`Coverage analysis failed for series ${seriesId}:`, error.message);
      }
    }

    // Calculate overall coverage
    if (allCoverages.length > 0) {
      coverage.overall.actualCoverage = allCoverages.reduce((sum, cov) => sum + cov, 0) / allCoverages.length;
      coverage.overall.coverageRatio = coverage.overall.actualCoverage / coverage.overall.targetCoverage;
    }

    // Calculate coverage by model
    Object.entries(modelCoverages).forEach(([model, coverages]) => {
      if (coverages.length > 0) {
        const avgCoverage = coverages.reduce((sum, cov) => sum + cov, 0) / coverages.length;
        coverage.byModel[model] = {
          actualCoverage: avgCoverage,
          coverageRatio: avgCoverage / coverage.overall.targetCoverage,
          sampleSize: coverages.length
        };
      }
    });

    return coverage;
  }

  // Generate accuracy trends over time
  generateAccuracyTrends() {
    // Mock trend data - in production, this would query historical accuracy records
    const trends = {
      mapeByWeek: [],
      coverageByWeek: [],
      modelTrends: {},
      trendAnalysis: {}
    };

    // Generate mock weekly MAPE trend
    for (let week = 0; week < 12; week++) {
      trends.mapeByWeek.push({
        week: week + 1,
        mape: 20 + Math.sin(week * 0.5) * 5 + Math.random() * 3,
        date: new Date(Date.now() - (11 - week) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    // Generate mock weekly coverage trend
    for (let week = 0; week < 12; week++) {
      trends.coverageByWeek.push({
        week: week + 1,
        coverage: 0.92 + Math.sin(week * 0.3) * 0.05 + (Math.random() - 0.5) * 0.02,
        date: new Date(Date.now() - (11 - week) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    // Calculate trend analysis
    const recentMAPE = trends.mapeByWeek.slice(-4).map(w => w.mape);
    const olderMAPE = trends.mapeByWeek.slice(0, 4).map(w => w.mape);
    
    const recentAvg = recentMAPE.reduce((sum, val) => sum + val, 0) / recentMAPE.length;
    const olderAvg = olderMAPE.reduce((sum, val) => sum + val, 0) / olderMAPE.length;
    
    trends.trendAnalysis = {
      mapeDirection: recentAvg < olderAvg ? 'Improving' : recentAvg > olderAvg ? 'Degrading' : 'Stable',
      mapeChange: ((recentAvg - olderAvg) / olderAvg) * 100,
      recommendation: recentAvg > olderAvg + 2 ? 'Monitor model performance closely' : 'Performance is stable'
    };

    return trends;
  }

  // Generate accuracy alerts
  generateAccuracyAlerts(dashboard) {
    const alerts = [];

    // Check overall MAPE alert
    if (dashboard.overview.avgMAPE > this.config.alertThresholds.mapeCritical) {
      alerts.push({
        level: 'Critical',
        category: 'Overall Performance',
        message: `Overall MAPE (${dashboard.overview.avgMAPE.toFixed(1)}%) exceeds critical threshold (${this.config.alertThresholds.mapeCritical}%)`,
        recommendation: 'Review model selection and data quality immediately',
        timestamp: new Date().toISOString()
      });
    } else if (dashboard.overview.avgMAPE > this.config.alertThresholds.mapeWarning) {
      alerts.push({
        level: 'Warning',
        category: 'Overall Performance',
        message: `Overall MAPE (${dashboard.overview.avgMAPE.toFixed(1)}%) exceeds warning threshold (${this.config.alertThresholds.mapeWarning}%)`,
        recommendation: 'Monitor performance and consider model retraining',
        timestamp: new Date().toISOString()
      });
    }

    // Check coverage alerts
    if (dashboard.predictionIntervalCoverage.overall.actualCoverage < this.config.alertThresholds.coverageCritical) {
      alerts.push({
        level: 'Critical',
        category: 'Prediction Intervals',
        message: `Prediction interval coverage (${(dashboard.predictionIntervalCoverage.overall.actualCoverage * 100).toFixed(1)}%) is critically low`,
        recommendation: 'Review prediction interval calibration methodology',
        timestamp: new Date().toISOString()
      });
    }

    // Check model-specific alerts
    Object.entries(dashboard.modelPerformance).forEach(([model, performance]) => {
      if (performance.avgMAPE > this.config.alertThresholds.mapeCritical) {
        alerts.push({
          level: 'Warning',
          category: 'Model Performance',
          message: `${model} model MAPE (${performance.avgMAPE.toFixed(1)}%) is above critical threshold`,
          recommendation: `Consider replacing or retraining ${model} model`,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Sort alerts by severity
    return alerts.sort((a, b) => {
      const severityOrder = { 'Critical': 3, 'Warning': 2, 'Info': 1 };
      return severityOrder[b.level] - severityOrder[a.level];
    });
  }

  // Update accuracy history (for real-time tracking)
  updateAccuracyHistory(seriesId, actualValues, forecastValues, metadata = {}) {
    const accuracy = this.calculateAccuracyMetrics(actualValues, forecastValues);
    
    this.accuracyHistory.set(`${seriesId}_${Date.now()}`, {
      seriesId,
      timestamp: new Date().toISOString(),
      accuracy,
      metadata
    });

    // Keep only recent history
    const cutoffTime = Date.now() - (this.config.trackingPeriodDays * 24 * 60 * 60 * 1000);
    for (const [key, record] of this.accuracyHistory.entries()) {
      if (new Date(record.timestamp).getTime() < cutoffTime) {
        this.accuracyHistory.delete(key);
      }
    }
  }

  // Calculate accuracy metrics for actual vs forecast comparison
  calculateAccuracyMetrics(actual, forecast) {
    if (actual.length !== forecast.length || actual.length === 0) {
      throw new Error('Actual and forecast arrays must have the same non-zero length');
    }

    const n = actual.length;
    let mape = 0;
    let mae = 0;
    let mse = 0;

    for (let i = 0; i < n; i++) {
      const error = actual[i] - forecast[i];
      const absError = Math.abs(error);
      
      mae += absError;
      mse += error * error;
      
      if (actual[i] !== 0) {
        mape += Math.abs(error / actual[i]);
      }
    }

    return {
      mape: (mape / n) * 100,
      mae: mae / n,
      rmse: Math.sqrt(mse / n),
      mse: mse / n
    };
  }

  // Get accuracy history for analysis
  getAccuracyHistory(seriesId = null, days = 30) {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const filtered = [];

    for (const record of this.accuracyHistory.values()) {
      const recordTime = new Date(record.timestamp).getTime();
      if (recordTime >= cutoffTime && (!seriesId || record.seriesId === seriesId)) {
        filtered.push(record);
      }
    }

    return filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
}

export default AccuracyDashboardService;