import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';

class CFOWorkbenchService {
  constructor(forecastingService, options = {}) {
    this.forecastingService = forecastingService;
    this.config = {
      defaultRegions: options.defaultRegions || ['UK', 'EU', 'USA'],
      defaultCurrencies: options.defaultCurrencies || ['GBP', 'EUR', 'USD'],
      reportingCurrency: options.reportingCurrency || 'GBP',
      confidenceLevel: options.confidenceLevel || 0.95,
      planningHorizons: options.planningHorizons || [30, 90, 180, 365]
    };
  }

  // Generate comprehensive CFO board pack
  async generateBoardPack(seriesIds, options = {}) {
    const {
      reportingCurrency = this.config.reportingCurrency,
      regions = this.config.defaultRegions,
      horizons = this.config.planningHorizons,
      includeScenarios = true,
      includeRiskMetrics = true
    } = options;

    const boardPack = {
      executiveSummary: {},
      forecastSummary: {},
      scenarioAnalysis: {},
      riskAssessment: {},
      recommendedActions: [],
      appendices: {},
      metadata: {
        generatedAt: new Date().toISOString(),
        reportingCurrency,
        regions,
        seriesCount: seriesIds.length
      }
    };

    // Generate executive summary
    boardPack.executiveSummary = await this.generateExecutiveSummary(
      seriesIds, reportingCurrency, regions
    );

    // Generate forecast summary by region and horizon
    boardPack.forecastSummary = await this.generateForecastSummary(
      seriesIds, horizons, regions, reportingCurrency
    );

    // Generate scenario analysis if requested
    if (includeScenarios) {
      boardPack.scenarioAnalysis = await this.generateScenarioAnalysis(
        seriesIds, regions, reportingCurrency
      );
    }

    // Generate risk assessment
    if (includeRiskMetrics) {
      boardPack.riskAssessment = await this.generateRiskAssessment(
        seriesIds, regions, reportingCurrency, horizons
      );
    }

    // Generate recommended actions
    boardPack.recommendedActions = this.generateRecommendedActions(
      boardPack.executiveSummary,
      boardPack.scenarioAnalysis,
      boardPack.riskAssessment
    );

    return boardPack;
  }

  // Generate executive summary with key metrics
  async generateExecutiveSummary(seriesIds, reportingCurrency, regions) {
    const summaries = [];
    let totalBaseline = 0;
    let totalUpside = 0;
    let totalDownside = 0;

    for (const region of regions) {
      const regionSummary = {
        region,
        currency: reportingCurrency,
        metrics: {}
      };

      let regionBaseline = 0;
      let regionUpside = 0;
      let regionDownside = 0;

      for (const seriesId of seriesIds) {
        try {
          const scenarios = await this.forecastingService.generateScenarioAnalysis(
            seriesId,
            {
              regions: [region],
              targetCurrency: reportingCurrency,
              horizon: 90 // Q1 planning horizon
            }
          );

          const baselineTotal = scenarios.scenarios[region]?.base?.forecast
            ?.reduce((sum, val) => sum + val, 0) || 0;
          const upsideTotal = scenarios.scenarios[region]?.stress_up?.forecast
            ?.reduce((sum, val) => sum + val, 0) || 0;
          const downsideTotal = scenarios.scenarios[region]?.stress_down?.forecast
            ?.reduce((sum, val) => sum + val, 0) || 0;

          regionBaseline += baselineTotal;
          regionUpside += upsideTotal;
          regionDownside += downsideTotal;

        } catch (error) {
          logWarn(`Failed to process series ${seriesId} for region ${region}:`, error.message);
        }
      }

      regionSummary.metrics = {
        baselineRevenue: regionBaseline,
        upsideRevenue: regionUpside,
        downsideRevenue: regionDownside,
        volatility: ((regionUpside - regionDownside) / regionBaseline) * 100,
        upside: ((regionUpside - regionBaseline) / regionBaseline) * 100,
        downside: ((regionBaseline - regionDownside) / regionBaseline) * 100
      };

      summaries.push(regionSummary);
      totalBaseline += regionBaseline;
      totalUpside += regionUpside;
      totalDownside += regionDownside;
    }

    return {
      consolidated: {
        currency: reportingCurrency,
        baselineRevenue: totalBaseline,
        upsideRevenue: totalUpside,
        downsideRevenue: totalDownside,
        totalVolatility: ((totalUpside - totalDownside) / totalBaseline) * 100,
        revenueAtRisk: totalBaseline - totalDownside,
        confidenceInterval: this.config.confidenceLevel
      },
      byRegion: summaries,
      keyInsights: this.generateKeyInsights(summaries, {
        totalBaseline,
        totalUpside,
        totalDownside
      })
    };
  }

  // Generate detailed forecast summary
  async generateForecastSummary(seriesIds, horizons, regions, reportingCurrency) {
    const forecastSummary = {
      byHorizon: {},
      byRegion: {},
      accuracy: {},
      trends: {}
    };

    for (const horizon of horizons) {
      forecastSummary.byHorizon[`${horizon}d`] = {};

      for (const region of regions) {
        let totalForecast = 0;
        let seriesCount = 0;
        const accuracyMetrics = [];

        for (const seriesId of seriesIds) {
          try {
            const result = await this.forecastingService.forecastWithOptions(seriesId, {
              horizon,
              region,
              targetCurrency: reportingCurrency,
              currencyMode: 'converted'
            });

            const forecastSum = result.forecasts.Ensemble?.reduce((sum, val) => sum + val, 0) || 0;
            totalForecast += forecastSum;
            seriesCount++;

            // Extract accuracy metrics from backtest
            if (result.backtestMetrics && result.backtestMetrics.Ensemble) {
              accuracyMetrics.push(result.backtestMetrics.Ensemble);
            }

          } catch (error) {
            logWarn(`Forecast failed for series ${seriesId}, region ${region}, horizon ${horizon}:`, error.message);
          }
        }

        forecastSummary.byHorizon[`${horizon}d`][region] = {
          totalForecast,
          seriesCount,
          averageMAPE: accuracyMetrics.length > 0 
            ? accuracyMetrics.reduce((sum, metric) => sum + metric.mape, 0) / accuracyMetrics.length
            : null,
          averageRMSE: accuracyMetrics.length > 0
            ? accuracyMetrics.reduce((sum, metric) => sum + metric.rmse, 0) / accuracyMetrics.length
            : null
        };
      }
    }

    return forecastSummary;
  }

  // Generate scenario analysis for CFO review
  async generateScenarioAnalysis(seriesIds, regions, reportingCurrency) {
    const scenarios = {
      baseCase: {},
      bullCase: {},
      bearCase: {},
      stressTest: {},
      summary: {}
    };

    const scenarioConfig = {
      base: { type: 'base', description: 'Current market conditions' },
      bull: { type: 'stress_up', shock: 15, description: '15% favorable market shift' },
      bear: { type: 'stress_down', shock: 15, description: '15% adverse market conditions' },
      stress: { type: 'crisis', shock: 25, description: 'Crisis scenario with 25% market contraction' }
    };

    for (const [scenarioName, config] of Object.entries(scenarioConfig)) {
      scenarios[`${scenarioName}Case`] = {
        description: config.description,
        assumptions: this.getScenarioAssumptions(config),
        results: {}
      };

      for (const region of regions) {
        let totalRevenue = 0;
        let processedSeries = 0;

        for (const seriesId of seriesIds.slice(0, 3)) { // Limit for performance
          try {
            const result = await this.forecastingService.forecastWithOptions(seriesId, {
              horizon: 90,
              region,
              targetCurrency: reportingCurrency,
              currencyMode: 'converted',
              fxScenario: config.type !== 'base' ? config : null
            });

            const revenue = result.forecasts.Ensemble?.reduce((sum, val) => sum + val, 0) || 0;
            totalRevenue += revenue;
            processedSeries++;

          } catch (error) {
            logWarn(`Scenario analysis failed for ${seriesId}:`, error.message);
          }
        }

        scenarios[`${scenarioName}Case`].results[region] = {
          totalRevenue,
          processedSeries,
          averageRevenue: processedSeries > 0 ? totalRevenue / processedSeries : 0
        };
      }
    }

    // Generate scenario summary
    scenarios.summary = this.generateScenarioSummary(scenarios);

    return scenarios;
  }

  // Generate risk assessment metrics
  async generateRiskAssessment(seriesIds, regions, reportingCurrency, horizons) {
    const riskMetrics = {
      forecastAccuracy: {},
      volatilityRisk: {},
      concentrationRisk: {},
      fxRisk: {},
      operationalRisk: {},
      overallRiskRating: null
    };

    // Forecast accuracy risk
    riskMetrics.forecastAccuracy = await this.assessForecastAccuracy(seriesIds, regions);

    // Volatility risk assessment
    riskMetrics.volatilityRisk = await this.assessVolatilityRisk(seriesIds, regions, reportingCurrency);

    // Concentration risk (region/series concentration)
    riskMetrics.concentrationRisk = this.assessConcentrationRisk(seriesIds, regions);

    // FX risk assessment
    riskMetrics.fxRisk = await this.assessFXRisk(regions, reportingCurrency, horizons[0]);

    // Overall risk rating
    riskMetrics.overallRiskRating = this.calculateOverallRiskRating(riskMetrics);

    return riskMetrics;
  }

  // Generate recommended actions for CFO
  generateRecommendedActions(executiveSummary, scenarioAnalysis, riskAssessment) {
    const actions = [];

    // Revenue optimization recommendations
    if (executiveSummary.consolidated.totalVolatility > 20) {
      actions.push({
        category: 'Revenue Management',
        priority: 'High',
        action: 'Implement revenue diversification strategy',
        rationale: `High volatility (${executiveSummary.consolidated.totalVolatility.toFixed(1)}%) indicates concentrated risk`,
        impact: 'Reduce revenue volatility by 15-25%',
        timeframe: '6-12 months'
      });
    }

    // Regional expansion recommendations
    const regionMetrics = executiveSummary.byRegion;
    const bestPerformingRegion = regionMetrics.reduce((best, current) => 
      current.metrics.baselineRevenue > best.metrics.baselineRevenue ? current : best
    );

    if (bestPerformingRegion.metrics.upside > 15) {
      actions.push({
        category: 'Regional Expansion',
        priority: 'Medium',
        action: `Increase investment in ${bestPerformingRegion.region} market`,
        rationale: `${bestPerformingRegion.region} shows ${bestPerformingRegion.metrics.upside.toFixed(1)}% upside potential`,
        impact: 'Potential 10-20% revenue increase in region',
        timeframe: '3-6 months'
      });
    }

    // Risk mitigation recommendations
    if (riskAssessment.overallRiskRating > 0.7) {
      actions.push({
        category: 'Risk Management',
        priority: 'High',
        action: 'Implement comprehensive risk mitigation framework',
        rationale: `Overall risk rating of ${(riskAssessment.overallRiskRating * 100).toFixed(0)}% requires immediate attention`,
        impact: 'Reduce overall business risk by 20-30%',
        timeframe: '1-3 months'
      });
    }

    // FX hedging recommendations
    if (riskAssessment.fxRisk && riskAssessment.fxRisk.maxExposure > 1000000) {
      actions.push({
        category: 'Financial Risk',
        priority: 'Medium',
        action: 'Implement FX hedging strategy',
        rationale: `FX exposure of ${(riskAssessment.fxRisk.maxExposure / 1000000).toFixed(1)}M requires hedging`,
        impact: 'Reduce FX volatility impact by 60-80%',
        timeframe: '1-2 months'
      });
    }

    return actions.sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Helper methods
  generateKeyInsights(regionSummaries, totals) {
    const insights = [];

    // Identify highest performing region
    const topRegion = regionSummaries.reduce((best, current) => 
      current.metrics.baselineRevenue > best.metrics.baselineRevenue ? current : best
    );

    insights.push(`${topRegion.region} is the top-performing region with ${(topRegion.metrics.baselineRevenue / 1000000).toFixed(1)}M baseline revenue`);

    // Identify highest risk region
    const riskiestRegion = regionSummaries.reduce((riskiest, current) => 
      current.metrics.volatility > riskiest.metrics.volatility ? current : riskiest
    );

    insights.push(`${riskiestRegion.region} shows highest volatility at ${riskiestRegion.metrics.volatility.toFixed(1)}%`);

    // Overall portfolio insight
    const totalVolatility = ((totals.totalUpside - totals.totalDownside) / totals.totalBaseline) * 100;
    if (totalVolatility > 25) {
      insights.push('Portfolio shows high volatility - consider diversification strategies');
    } else if (totalVolatility < 10) {
      insights.push('Portfolio shows low volatility - opportunity for strategic growth investments');
    }

    return insights;
  }

  getScenarioAssumptions(config) {
    const assumptions = {
      base: ['Current market conditions', 'Historical volatility patterns', 'No major market disruptions'],
      stress_up: ['Favorable economic conditions', 'Strong consumer demand', 'Positive regulatory environment'],
      stress_down: ['Economic headwinds', 'Reduced consumer spending', 'Increased competition'],
      crisis: ['Severe market disruption', 'Supply chain challenges', 'Regulatory restrictions']
    };

    return assumptions[config.type] || ['Standard market assumptions'];
  }

  generateScenarioSummary(scenarios) {
    const summary = {
      bestCase: null,
      worstCase: null,
      mostLikely: 'baseCase',
      variationRange: null
    };

    // Calculate scenario variations
    const scenarioValues = {};
    Object.keys(scenarios).forEach(scenario => {
      if (scenario !== 'summary' && scenarios[scenario].results) {
        let totalRevenue = 0;
        Object.values(scenarios[scenario].results).forEach(regionData => {
          totalRevenue += regionData.totalRevenue || 0;
        });
        scenarioValues[scenario] = totalRevenue;
      }
    });

    const values = Object.values(scenarioValues);
    summary.bestCase = Math.max(...values);
    summary.worstCase = Math.min(...values);
    summary.variationRange = ((summary.bestCase - summary.worstCase) / scenarioValues.baseCase) * 100;

    return summary;
  }

  async assessForecastAccuracy(seriesIds, regions) {
    const accuracy = { overall: 0, byRegion: {} };
    let totalMAPE = 0;
    let seriesProcessed = 0;

    for (const region of regions) {
      let regionMAPE = 0;
      let regionSeries = 0;

      for (const seriesId of seriesIds.slice(0, 5)) { // Sample for performance
        try {
          const result = await this.forecastingService.forecastWithOptions(seriesId, {
            horizon: 30,
            region
          });

          if (result.backtestMetrics && result.backtestMetrics.Ensemble) {
            regionMAPE += result.backtestMetrics.Ensemble.mape;
            regionSeries++;
          }
        } catch (error) {
          // Skip failed forecasts
        }
      }

      if (regionSeries > 0) {
        accuracy.byRegion[region] = regionMAPE / regionSeries;
        totalMAPE += regionMAPE;
        seriesProcessed += regionSeries;
      }
    }

    accuracy.overall = seriesProcessed > 0 ? totalMAPE / seriesProcessed : 0;
    return accuracy;
  }

  async assessVolatilityRisk(seriesIds, regions, reportingCurrency) {
    // Mock volatility assessment - replace with real calculation
    return {
      overall: 'Medium',
      score: 0.6,
      byRegion: regions.reduce((acc, region) => {
        acc[region] = Math.random() * 0.5 + 0.3; // Mock: 0.3-0.8 range
        return acc;
      }, {})
    };
  }

  assessConcentrationRisk(seriesIds, regions) {
    return {
      seriesConcentration: seriesIds.length < 5 ? 'High' : 'Low',
      regionConcentration: regions.length < 3 ? 'High' : 'Medium',
      recommendation: seriesIds.length < 5 || regions.length < 3 
        ? 'Consider diversifying across more series and regions'
        : 'Concentration risk is acceptable'
    };
  }

  async assessFXRisk(regions, reportingCurrency, horizon) {
    const fxRisk = { exposures: {}, maxExposure: 0, recommendation: null };

    for (const region of regions) {
      // Mock FX exposure calculation
      const exposure = Math.random() * 2000000 + 500000; // 0.5M - 2.5M exposure
      fxRisk.exposures[region] = exposure;
      fxRisk.maxExposure = Math.max(fxRisk.maxExposure, exposure);
    }

    fxRisk.recommendation = fxRisk.maxExposure > 1000000 
      ? 'Consider FX hedging for exposures above 1M'
      : 'FX risk is manageable at current exposure levels';

    return fxRisk;
  }

  calculateOverallRiskRating(riskMetrics) {
    // Weighted average of risk factors
    const weights = {
      forecastAccuracy: 0.3,
      volatilityRisk: 0.25,
      concentrationRisk: 0.2,
      fxRisk: 0.15,
      operationalRisk: 0.1
    };

    let totalScore = 0;
    let totalWeight = 0;

    if (riskMetrics.forecastAccuracy.overall > 0) {
      totalScore += Math.min(riskMetrics.forecastAccuracy.overall / 100, 1) * weights.forecastAccuracy;
      totalWeight += weights.forecastAccuracy;
    }

    if (riskMetrics.volatilityRisk.score) {
      totalScore += riskMetrics.volatilityRisk.score * weights.volatilityRisk;
      totalWeight += weights.volatilityRisk;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0.5; // Default medium risk
  }
}

export default CFOWorkbenchService;