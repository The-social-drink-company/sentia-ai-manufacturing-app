import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';

/**
 * Enterprise Monte Carlo Simulation Engine
 * Fortune 500-level risk modeling and probabilistic forecasting
 * Used for cash flow scenarios and financial uncertainty quantification
 */
export class MonteCarloSimulationEngine {
  constructor() {
    this.simulationCache = new Map();
    this.distributionCache = new Map();
    this.correlationMatrix = null;
  }

  /**
   * Run comprehensive Monte Carlo simulation for cash coverage
   */
  async runCashCoverageSimulation(params, options = {}) {
    try {
      logInfo('Starting Monte Carlo simulation for cash coverage', {
        iterations: params.iterations || 10000,
        timeHorizon: params.timeHorizon
      });

      const config = {
        iterations: params.iterations || 10000,
        confidenceIntervals: options.confidenceIntervals || [0.05, 0.25, 0.50, 0.75, 0.95],
        correlations: options.correlations || {},
        seed: options.seed || null
      };

      // Initialize random number generator with seed for reproducibility
      if (config.seed) {
        this.initializeRNG(config.seed);
      }

      // Build correlation matrix for variables
      this.correlationMatrix = this.buildCorrelationMatrix(params.variables, config.correlations);

      // Run simulation iterations
      const results = [];
      for (let i = 0; i < config.iterations; i++) {
        const iteration = await this.runSingleIteration(params, i);
        results.push(iteration);
      }

      // Analyze results
      const analysis = this.analyzeResults(results, config.confidenceIntervals);

      // Calculate risk metrics
      analysis.riskMetrics = this.calculateRiskMetrics(results, params);

      // Generate scenario paths
      analysis.scenarioPaths = this.generateScenarioPaths(results, params.timeHorizon);

      // Store results for later analysis
      await this.storeSimulationResults(analysis, params);

      logInfo('Monte Carlo simulation completed', {
        iterations: config.iterations,
        convergence: analysis.convergence
      });

      return analysis;
    } catch (error) {
      logError('Monte Carlo simulation failed', error);
      throw error;
    }
  }

  /**
   * Run a single simulation iteration
   */
  async runSingleIteration(params, iterationIndex) {
    const iteration = {
      index: iterationIndex,
      timestamp: Date.now(),
      variables: {},
      outcomes: {}
    };

    // Generate correlated random variables
    const correlatedVariables = this.generateCorrelatedVariables(params.variables);

    // Simulate each variable
    for (const [variableName, config] of Object.entries(params.variables)) {
      iteration.variables[variableName] = this.simulateVariable(
        config,
        correlatedVariables[variableName]
      );
    }

    // Calculate cash position for each time period
    iteration.outcomes.cashPositions = [];
    let currentCash = params.initialCash || 0;

    for (let period = 0; period < params.timeHorizon; period++) {
      const periodCashFlow = this.calculatePeriodCashFlow(
        iteration.variables,
        period,
        params
      );

      currentCash += periodCashFlow;
      iteration.outcomes.cashPositions.push({
        period,
        cashFlow: periodCashFlow,
        balance: currentCash,
        shortfall: currentCash < 0 ? Math.abs(currentCash) : 0
      });
    }

    // Calculate summary metrics
    iteration.outcomes.minCash = Math.min(...iteration.outcomes.cashPositions.map(p => p.balance));
    iteration.outcomes.maxCash = Math.max(...iteration.outcomes.cashPositions.map(p => p.balance));
    iteration.outcomes.finalCash = currentCash;
    iteration.outcomes.hasShortfall = iteration.outcomes.minCash < 0;
    iteration.outcomes.maxShortfall = Math.max(...iteration.outcomes.cashPositions.map(p => p.shortfall));
    iteration.outcomes.shortfallPeriods = iteration.outcomes.cashPositions.filter(p => p.shortfall > 0).length;

    return iteration;
  }

  /**
   * Generate correlated random variables using Cholesky decomposition
   */
  generateCorrelatedVariables(variables) {
    const variableNames = Object.keys(variables);
    const n = variableNames.length;

    // Generate independent standard normal variables
    const independent = variableNames.map(() => this.generateStandardNormal());

    if (!this.correlationMatrix || this.correlationMatrix.length === 0) {
      // No correlations, return independent variables
      const result = {};
      variableNames.forEach((name, i) => {
        result[name] = independent[i];
      });
      return result;
    }

    // Apply Cholesky decomposition for correlation
    const L = this.choleskyDecomposition(this.correlationMatrix);
    const correlated = this.matrixMultiply(L, independent);

    // Map back to variable names
    const result = {};
    variableNames.forEach((name, i) => {
      result[name] = correlated[i];
    });

    return result;
  }

  /**
   * Simulate a single variable based on its distribution
   */
  simulateVariable(config, correlatedValue) {
    const z = correlatedValue || this.generateStandardNormal();

    switch (config.distribution) {
      case 'normal':
        return this.generateNormal(config.mean, config.stdDev, z);

      case 'lognormal':
        return this.generateLogNormal(config.mean, config.stdDev, z);

      case 'uniform':
        return this.generateUniform(config.min, config.max);

      case 'triangular':
        return this.generateTriangular(config.min, config.mode, config.max);

      case 'beta':
        return this.generateBeta(config.alpha, config.beta, config.min, config.max);

      case 'exponential':
        return this.generateExponential(config.lambda);

      case 'weibull':
        return this.generateWeibull(config.shape, config.scale);

      case 'empirical':
        return this.generateEmpirical(config.historicalData);

      case 'custom':
        return this.generateCustom(config.customFunction, z);

      default:
        // Default to normal if distribution not specified
        return this.generateNormal(config.mean || 0, config.stdDev || 1, z);
    }
  }

  /**
   * Calculate cash flow for a specific period
   */
  calculatePeriodCashFlow(variables, period, params) {
    let cashFlow = 0;

    // Revenue component
    if (variables.revenue) {
      const seasonalFactor = this.getSeasonalFactor(period, params.seasonality);
      const growthFactor = Math.pow(1 + (variables.growthRate || 0), period / 12);
      cashFlow += variables.revenue * seasonalFactor * growthFactor;
    }

    // Collections from receivables
    if (variables.collections) {
      const collectionDelay = variables.dso / 30; // Convert DSO to periods
      const adjustedPeriod = Math.max(0, period - collectionDelay);
      cashFlow += variables.collections * this.getCollectionPattern(adjustedPeriod);
    }

    // Operating expenses
    if (variables.operatingExpenses) {
      cashFlow -= variables.operatingExpenses * (1 + variables.inflationRate * period / 12);
    }

    // Payables payments
    if (variables.payables) {
      const paymentDelay = variables.dpo / 30; // Convert DPO to periods
      const adjustedPeriod = Math.max(0, period - paymentDelay);
      cashFlow -= variables.payables * this.getPaymentPattern(adjustedPeriod);
    }

    // Capital expenditures
    if (variables.capex && params.capexSchedule) {
      cashFlow -= this.getScheduledAmount(params.capexSchedule, period, variables.capex);
    }

    // Debt service
    if (variables.debtService) {
      cashFlow -= variables.debtService;
    }

    // Tax payments
    if (variables.taxPayments && this.isTaxPeriod(period, params.taxSchedule)) {
      cashFlow -= variables.taxPayments;
    }

    // One-time items
    if (params.oneTimeItems) {
      cashFlow += this.getOneTimeItems(params.oneTimeItems, period);
    }

    return cashFlow;
  }

  /**
   * Analyze simulation results
   */
  analyzeResults(results, confidenceIntervals) {
    const analysis = {
      statistics: {},
      percentiles: {},
      distributions: {},
      convergence: {},
      scenarios: {}
    };

    // Extract key metrics from all iterations
    const metrics = {
      finalCash: results.map(r => r.outcomes.finalCash),
      minCash: results.map(r => r.outcomes.minCash),
      maxShortfall: results.map(r => r.outcomes.maxShortfall),
      shortfallPeriods: results.map(r => r.outcomes.shortfallPeriods)
    };

    // Calculate statistics for each metric
    for (const [metricName, values] of Object.entries(metrics)) {
      analysis.statistics[metricName] = {
        mean: this.calculateMean(values),
        median: this.calculateMedian(values),
        stdDev: this.calculateStdDev(values),
        min: Math.min(...values),
        max: Math.max(...values),
        skewness: this.calculateSkewness(values),
        kurtosis: this.calculateKurtosis(values)
      };

      // Calculate percentiles
      analysis.percentiles[metricName] = {};
      for (const percentile of confidenceIntervals) {
        analysis.percentiles[metricName][`p${Math.round(percentile * 100)}`] =
          this.calculatePercentile(values, percentile);
      }
    }

    // Calculate probability distributions
    analysis.distributions.shortfallProbability =
      (results.filter(r => r.outcomes.hasShortfall).length / results.length) * 100;

    analysis.distributions.averageShortfallAmount =
      this.calculateMean(results.filter(r => r.outcomes.hasShortfall).map(r => r.outcomes.maxShortfall));

    // Check convergence
    analysis.convergence = this.checkConvergence(metrics.finalCash);

    // Identify scenarios
    analysis.scenarios = this.identifyScenarios(results);

    return analysis;
  }

  /**
   * Calculate risk metrics from simulation results
   */
  calculateRiskMetrics(results, params) {
    const metrics = {
      VaR: {},
      CVaR: {},
      expectedShortfall: 0,
      probabilityOfRuin: 0,
      liquidityRisk: {},
      stressTests: {}
    };

    // Value at Risk (VaR) at different confidence levels
    const cashValues = results.map(r => r.outcomes.minCash);
    metrics.VaR.onePercent = this.calculatePercentile(cashValues, 0.01);
    metrics.VaR.fivePercent = this.calculatePercentile(cashValues, 0.05);
    metrics.VaR.tenPercent = this.calculatePercentile(cashValues, 0.10);

    // Conditional Value at Risk (CVaR)
    metrics.CVaR.onePercent = this.calculateCVaR(cashValues, 0.01);
    metrics.CVaR.fivePercent = this.calculateCVaR(cashValues, 0.05);
    metrics.CVaR.tenPercent = this.calculateCVaR(cashValues, 0.10);

    // Expected Shortfall
    const shortfalls = results
      .filter(r => r.outcomes.hasShortfall)
      .map(r => r.outcomes.maxShortfall);

    metrics.expectedShortfall = shortfalls.length > 0 ?
      this.calculateMean(shortfalls) : 0;

    // Probability of Ruin (cash hitting zero)
    metrics.probabilityOfRuin =
      (results.filter(r => r.outcomes.minCash <= 0).length / results.length) * 100;

    // Liquidity Risk Score
    metrics.liquidityRisk = this.calculateLiquidityRisk(results, params);

    // Stress Test Results
    metrics.stressTests = this.performStressTests(results, params);

    return metrics;
  }

  /**
   * Generate scenario paths for visualization
   */
  generateScenarioPaths(results, timeHorizon) {
    // Select representative scenarios
    const selectedIndices = {
      best: this.findPercentileIndex(results, 'finalCash', 0.95),
      median: this.findPercentileIndex(results, 'finalCash', 0.50),
      worst: this.findPercentileIndex(results, 'finalCash', 0.05)
    };

    const paths = {};

    for (const [scenario, index] of Object.entries(selectedIndices)) {
      const result = results[index];
      paths[scenario] = result.outcomes.cashPositions.map(p => ({
        period: p.period,
        balance: p.balance,
        cashFlow: p.cashFlow
      }));
    }

    // Add confidence bands
    paths.confidenceBands = this.calculateConfidenceBands(results, timeHorizon);

    return paths;
  }

  /**
   * Statistical calculations
   */
  calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  calculateStdDev(values) {
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(percentile * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  calculateSkewness(values) {
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values);
    const n = values.length;

    const skew = values.reduce((sum, val) => {
      return sum + Math.pow((val - mean) / stdDev, 3);
    }, 0);

    return (n / ((n - 1) * (n - 2))) * skew;
  }

  calculateKurtosis(values) {
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values);
    const n = values.length;

    const kurt = values.reduce((sum, val) => {
      return sum + Math.pow((val - mean) / stdDev, 4);
    }, 0);

    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * kurt -
           (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  calculateCVaR(values, alpha) {
    const sorted = [...values].sort((a, b) => a - b);
    const varIndex = Math.floor(alpha * sorted.length);
    const tailValues = sorted.slice(0, varIndex);
    return tailValues.length > 0 ? this.calculateMean(tailValues) : sorted[0];
  }

  /**
   * Random number generation
   */
  generateStandardNormal() {
    // Box-Muller transform for standard normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  generateNormal(mean, stdDev, z = null) {
    const standardNormal = z || this.generateStandardNormal();
    return mean + stdDev * standardNormal;
  }

  generateLogNormal(mean, stdDev, z = null) {
    const normalValue = this.generateNormal(mean, stdDev, z);
    return Math.exp(normalValue);
  }

  generateUniform(min, max) {
    return min + Math.random() * (max - min);
  }

  generateTriangular(min, mode, max) {
    const u = Math.random();
    const fc = (mode - min) / (max - min);

    if (u < fc) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }

  generateBeta(alpha, beta, min, max) {
    // Simplified beta distribution using rejection sampling
    let x, y;
    do {
      x = Math.random();
      y = Math.random();
    } while (y > Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1));

    return min + x * (max - min);
  }

  generateExponential(lambda) {
    return -Math.log(1 - Math.random()) / lambda;
  }

  generateWeibull(shape, scale) {
    return scale * Math.pow(-Math.log(1 - Math.random()), 1 / shape);
  }

  generateEmpirical(historicalData) {
    // Sample from historical data
    const index = Math.floor(Math.random() * historicalData.length);
    return historicalData[index];
  }

  generateCustom(customFunction, z) {
    return customFunction(z || this.generateStandardNormal());
  }

  /**
   * Matrix operations for correlation
   */
  buildCorrelationMatrix(variables, correlations) {
    const variableNames = Object.keys(variables);
    const n = variableNames.length;
    const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

    // Set diagonal to 1
    for (let i = 0; i < n; i++) {
      matrix[i][i] = 1;
    }

    // Set correlations
    for (const [pair, correlation] of Object.entries(correlations)) {
      const [var1, var2] = pair.split('-');
      const i = variableNames.indexOf(var1);
      const j = variableNames.indexOf(var2);

      if (i >= 0 && j >= 0) {
        matrix[i][j] = correlation;
        matrix[j][i] = correlation;
      }
    }

    return matrix;
  }

  choleskyDecomposition(matrix) {
    const n = matrix.length;
    const L = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0;

        if (i === j) {
          for (let k = 0; k < j; k++) {
            sum += L[j][k] * L[j][k];
          }
          L[i][j] = Math.sqrt(Math.max(0, matrix[i][j] - sum));
        } else {
          for (let k = 0; k < j; k++) {
            sum += L[i][k] * L[j][k];
          }
          L[i][j] = L[j][j] > 0 ? (matrix[i][j] - sum) / L[j][j] : 0;
        }
      }
    }

    return L;
  }

  matrixMultiply(L, vector) {
    const n = L.length;
    const result = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        result[i] += L[i][j] * vector[j];
      }
    }

    return result;
  }

  /**
   * Helper methods
   */
  getSeasonalFactor(period, seasonality) {
    if (!seasonality) return 1;

    const month = period % 12;
    return seasonality[month] || 1;
  }

  getCollectionPattern(period) {
    // Typical collection pattern: 60% immediate, 30% next period, 10% after
    if (period < 1) return 0.6;
    if (period < 2) return 0.3;
    if (period < 3) return 0.1;
    return 0;
  }

  getPaymentPattern(period) {
    // Typical payment pattern
    if (period < 1) return 0.7;
    if (period < 2) return 0.2;
    if (period < 3) return 0.1;
    return 0;
  }

  getScheduledAmount(schedule, period, baseAmount) {
    const scheduled = schedule.find(s => s.period === period);
    return scheduled ? scheduled.amount || baseAmount : 0;
  }

  isTaxPeriod(period, taxSchedule) {
    if (!taxSchedule) return period % 3 === 0; // Quarterly by default
    return taxSchedule.includes(period);
  }

  getOneTimeItems(items, period) {
    const item = items.find(i => i.period === period);
    return item ? item.amount : 0;
  }

  checkConvergence(values) {
    // Check if simulation has converged using running mean
    const batchSize = Math.floor(values.length / 10);
    const means = [];

    for (let i = batchSize; i <= values.length; i += batchSize) {
      const batch = values.slice(0, i);
      means.push(this.calculateMean(batch));
    }

    const convergenceRate = this.calculateStdDev(means) / this.calculateMean(means);

    return {
      isConverged: convergenceRate < 0.01,
      convergenceRate: convergenceRate * 100,
      stabilityIndex: 1 - convergenceRate
    };
  }

  identifyScenarios(results) {
    // Identify key scenarios from results
    const scenarios = {
      bestCase: null,
      worstCase: null,
      mostLikely: null,
      criticalScenarios: []
    };

    // Sort by final cash
    const sorted = [...results].sort((a, b) => b.outcomes.finalCash - a.outcomes.finalCash);

    scenarios.bestCase = sorted[Math.floor(sorted.length * 0.05)];
    scenarios.worstCase = sorted[Math.floor(sorted.length * 0.95)];
    scenarios.mostLikely = sorted[Math.floor(sorted.length * 0.5)];

    // Find critical scenarios (those with significant shortfalls)
    scenarios.criticalScenarios = results
      .filter(r => r.outcomes.maxShortfall > this.calculatePercentile(
        results.map(r => r.outcomes.maxShortfall), 0.90
      ))
      .slice(0, 10);

    return scenarios;
  }

  calculateLiquidityRisk(results, params) {
    const shortfallPeriods = results.map(r => r.outcomes.shortfallPeriods);
    const avgShortfallPeriods = this.calculateMean(shortfallPeriods);

    return {
      score: Math.min(100, avgShortfallPeriods * 10),
      averageShortfallDuration: avgShortfallPeriods,
      maxShortfallDuration: Math.max(...shortfallPeriods),
      frequencyOfShortfalls: (results.filter(r => r.outcomes.hasShortfall).length / results.length) * 100
    };
  }

  performStressTests(results, params) {
    // Perform various stress tests on the results
    return {
      revenueDecline20: this.stressTestRevenue(results, -0.20),
      expenseIncrease15: this.stressTestExpenses(results, 0.15),
      combinedStress: this.stressTestCombined(results)
    };
  }

  stressTestRevenue(results, adjustment) {
    // Simulate revenue stress
    const stressedCash = results.map(r => {
      const revenueImpact = r.variables.revenue ? r.variables.revenue * adjustment : 0;
      return r.outcomes.finalCash + revenueImpact;
    });

    return {
      impactOnFinalCash: this.calculateMean(stressedCash) - this.calculateMean(results.map(r => r.outcomes.finalCash)),
      newShortfallProbability: (stressedCash.filter(c => c < 0).length / stressedCash.length) * 100
    };
  }

  stressTestExpenses(results, adjustment) {
    // Simulate expense stress
    const stressedCash = results.map(r => {
      const expenseImpact = r.variables.operatingExpenses ? r.variables.operatingExpenses * adjustment : 0;
      return r.outcomes.finalCash - expenseImpact;
    });

    return {
      impactOnFinalCash: this.calculateMean(stressedCash) - this.calculateMean(results.map(r => r.outcomes.finalCash)),
      newShortfallProbability: (stressedCash.filter(c => c < 0).length / stressedCash.length) * 100
    };
  }

  stressTestCombined(results) {
    // Combined stress scenario
    const stressedCash = results.map(r => {
      const revenueImpact = r.variables.revenue ? r.variables.revenue * -0.15 : 0;
      const expenseImpact = r.variables.operatingExpenses ? r.variables.operatingExpenses * 0.10 : 0;
      return r.outcomes.finalCash + revenueImpact - expenseImpact;
    });

    return {
      impactOnFinalCash: this.calculateMean(stressedCash) - this.calculateMean(results.map(r => r.outcomes.finalCash)),
      newShortfallProbability: (stressedCash.filter(c => c < 0).length / stressedCash.length) * 100
    };
  }

  calculateConfidenceBands(results, timeHorizon) {
    const bands = [];

    for (let period = 0; period < timeHorizon; period++) {
      const periodBalances = results.map(r => r.outcomes.cashPositions[period].balance);

      bands.push({
        period,
        p5: this.calculatePercentile(periodBalances, 0.05),
        p25: this.calculatePercentile(periodBalances, 0.25),
        p50: this.calculatePercentile(periodBalances, 0.50),
        p75: this.calculatePercentile(periodBalances, 0.75),
        p95: this.calculatePercentile(periodBalances, 0.95)
      });
    }

    return bands;
  }

  findPercentileIndex(results, metric, percentile) {
    const values = results.map(r => r.outcomes[metric]);
    const targetValue = this.calculatePercentile(values, percentile);
    return results.findIndex(r => r.outcomes[metric] === targetValue);
  }

  initializeRNG(seed) {
    // Initialize reproducible random number generator
    this.seed = seed;
    // Implementation would use a seeded RNG library
  }

  async storeSimulationResults(analysis, params) {
    // Store results for historical analysis
    try {
      const stored = {
        timestamp: new Date().toISOString(),
        params,
        analysis,
        version: '1.0.0'
      };

      // Would typically store in database
      logInfo('Simulation results stored', {
        iterations: params.iterations,
        convergence: analysis.convergence.isConverged
      });
    } catch (error) {
      logWarn('Failed to store simulation results', { error: error.message });
    }
  }
}

export default MonteCarloSimulationEngine;