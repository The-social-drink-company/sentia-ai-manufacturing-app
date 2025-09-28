/**
 * Agent Evaluation Harness with Simulation
 */

import { logInfo, logError, logDebug } from '../observability/structuredLogger.js';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import seedrandom from 'seedrandom';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

export class AgentEvaluator {
  constructor() {
    this.thresholds = {
      forecastMinAccuracyDelta: parseFloat(process.env.FORECAST_MIN_ACCURACY_DELTA) || 0.05,
      wcMaxBreachMonthsDelta: parseInt(process.env.WC_MAX_BREACH_MONTHS_DELTA) || 0,
      wcMinCashDelta: parseFloat(process.env.WC_MIN_CASH_DELTA) || 0,
      optMinStockoutsAvoided: parseFloat(process.env.OPT_MIN_STOCKOUTS_AVOIDED) || 0.10
    };

    this.goldenDatasets = new Map();
    this.loadGoldenDatasets();
  }

  async loadGoldenDatasets() {
    try {
      const datasetsPath = path.join(__dirname, '../../tests/data/golden');
      const files = await fs.readdir(datasetsPath).catch(() => []);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(datasetsPath, file), 'utf8');
          const dataset = JSON.parse(content);
          const key = file.replace('.json', '');
          this.goldenDatasets.set(key, dataset);
          logDebug(`Loaded golden dataset: ${key}`);
        }
      }
    } catch (error) {
      logError('Failed to load golden datasets', error);
    }
  }

  /**
   * Run evaluation on a plan
   */
  async evaluate(goal, options = {}) {
    const evalId = crypto.randomUUID();
    const { preset_key, dataset_key, scope = {}, thresholds_override = {} } = options;

    // Merge thresholds
    const thresholds = { ...this.thresholds, ...thresholds_override };

    logInfo('Starting evaluation', { evalId, goal, dataset_key });

    // Create evaluation record
    const evaluation = await prisma.agentEvals.create({
      data: {
        id: evalId,
        goal,
        datasetKey: dataset_key,
        simulate: true,
        startedAt: new Date(),
        status: 'RUNNING'
      }
    });

    try {
      // Get golden dataset
      const dataset = dataset_key ? this.goldenDatasets.get(dataset_key) : this.generateSyntheticDataset(evalId);

      // Run simulation
      const cases = await this.simulatePlan(evalId, goal, dataset, scope);

      // Calculate scores
      const scorecard = await this.calculateScorecard(cases, thresholds);

      // Determine pass/fail
      const passed = this.evaluateScorecard(scorecard, thresholds);

      // Save results
      await prisma.agentEvals.update({
        where: { id: evalId },
        data: {
          status: 'COMPLETED',
          finishedAt: new Date()
        }
      });

      await prisma.agentEvalScores.create({
        data: {
          id: crypto.randomUUID(),
          evalId,
          scorecardJson: scorecard,
          passed
        }
      });

      return {
        evalId,
        scorecard,
        passed,
        artifacts: cases
      };

    } catch (error) {
      logError('Evaluation failed', error, { evalId });
      
      await prisma.agentEvals.update({
        where: { id: evalId },
        data: {
          status: 'FAILED',
          finishedAt: new Date()
        }
      });

      throw error;
    }
  }

  /**
   * Simulate plan execution
   */
  async simulatePlan(evalId, goal, dataset, scope) {
    const rng = seedrandom(evalId); // Deterministic randomness
    const cases = [];

    // Simulate forecast tool
    if (goal.includes('forecast') || goal.includes('demand')) {
      const forecastCase = await this.simulateForecast(dataset, rng);
      cases.push({
        tool: 'forecast.run',
        params: { startDate: '2024-01-01', endDate: '2024-03-31' },
        metrics: forecastCase
      });

      await prisma.agentEvalCases.create({
        data: {
          id: crypto.randomUUID(),
          evalId,
          tool: 'forecast.run',
          paramsJson: { startDate: '2024-01-01', endDate: '2024-03-31' },
          metricsJson: forecastCase
        }
      });
    }

    // Simulate optimization tool
    if (goal.includes('stock') || goal.includes('inventory') || goal.includes('optimize')) {
      const optimizationCase = await this.simulateOptimization(dataset, rng);
      cases.push({
        tool: 'stock.optimize',
        params: { workingCapitalCap: 1000000 },
        metrics: optimizationCase
      });

      await prisma.agentEvalCases.create({
        data: {
          id: crypto.randomUUID(),
          evalId,
          tool: 'stock.optimize',
          paramsJson: { workingCapitalCap: 1000000 },
          metricsJson: optimizationCase
        }
      });
    }

    // Simulate working capital tool
    if (goal.includes('working capital') || goal.includes('WC') || goal.includes('cash')) {
      const wcCase = await this.simulateWorkingCapital(dataset, rng);
      cases.push({
        tool: 'wc.project',
        params: { horizon: 90 },
        metrics: wcCase
      });

      await prisma.agentEvalCases.create({
        data: {
          id: crypto.randomUUID(),
          evalId,
          tool: 'wc.project',
          paramsJson: { horizon: 90 },
          metricsJson: wcCase
        }
      });
    }

    return cases;
  }

  /**
   * Simulate forecast execution
   */
  simulateForecast(dataset, rng) {
    const baseline = dataset.forecast?.baseline || {
      mape: 0.15,
      coverage: 0.85,
      piCoverage: 0.90
    };

    // Add some deterministic noise
    const improvement = rng() * 0.1 - 0.02; // -2% to +8%
    
    return {
      mape: Math.max(0.05, baseline.mape - improvement),
      mapeImprovement: improvement,
      coverage: Math.min(0.98, baseline.coverage + improvement / 2),
      piCoverage: Math.min(0.98, baseline.piCoverage + improvement / 3),
      forecastedDemand: dataset.demand?.total || 10000,
      confidenceLevel: 0.95
    };
  }

  /**
   * Simulate stock optimization
   */
  simulateOptimization(dataset, rng) {
    const baseline = dataset.optimization?.baseline || {
      stockouts: 50,
      inventoryValue: 2000000,
      holdingCost: 50000,
      serviceLevel: 0.92
    };

    // Simulate improvement
    const efficiency = rng() * 0.2; // 0-20% improvement
    
    return {
      stockoutsAvoided: Math.floor(baseline.stockouts * efficiency),
      stockoutsAvoidedPct: efficiency,
      inventoryValueDelta: -baseline.inventoryValue * efficiency * 0.5,
      holdingCostDelta: -baseline.holdingCost * efficiency * 0.7,
      serviceLevel: Math.min(0.99, baseline.serviceLevel + efficiency * 0.1),
      wcReduction: baseline.inventoryValue * efficiency * 0.3
    };
  }

  /**
   * Simulate working capital projection
   */
  simulateWorkingCapital(dataset, rng) {
    const baseline = dataset.workingCapital?.baseline || {
      ccc: 45,
      minCash: 500000,
      breachMonths: 2,
      dio: 30,
      dso: 45,
      dpo: 30
    };

    // Simulate changes
    const improvement = rng() * 10 - 2; // -2 to +8 days
    
    return {
      cccDelta: -improvement,
      minCashDelta: improvement > 0 ? 50000 : -20000,
      breachMonthsDelta: improvement > 5 ? -1 : 0,
      dio: Math.max(20, baseline.dio - improvement * 0.5),
      dso: Math.max(30, baseline.dso - improvement * 0.7),
      dpo: Math.min(45, baseline.dpo + improvement * 0.3),
      peakRequirement: baseline.minCash * (1 + rng() * 0.2),
      averageRequirement: baseline.minCash * (1 + rng() * 0.1)
    };
  }

  /**
   * Generate synthetic dataset
   */
  generateSyntheticDataset(seed) {
    const rng = seedrandom(seed);
    
    return {
      forecast: {
        baseline: {
          mape: 0.12 + rng() * 0.08,
          coverage: 0.80 + rng() * 0.10,
          piCoverage: 0.85 + rng() * 0.10
        }
      },
      optimization: {
        baseline: {
          stockouts: Math.floor(30 + rng() * 40),
          inventoryValue: 1500000 + rng() * 1000000,
          holdingCost: 30000 + rng() * 40000,
          serviceLevel: 0.88 + rng() * 0.08
        }
      },
      workingCapital: {
        baseline: {
          ccc: Math.floor(35 + rng() * 20),
          minCash: 300000 + rng() * 400000,
          breachMonths: Math.floor(rng() * 4),
          dio: Math.floor(25 + rng() * 10),
          dso: Math.floor(35 + rng() * 15),
          dpo: Math.floor(25 + rng() * 10)
        }
      },
      demand: {
        total: Math.floor(8000 + rng() * 4000)
      }
    };
  }

  /**
   * Calculate scorecard from cases
   */
  calculateScorecard(cases, thresholds) {
    const scorecard = {
      forecast: null,
      optimization: null,
      workingCapital: null,
      overall: null
    };

    // Score each tool's results
    for (const caseData of cases) {
      switch (caseData.tool) {
        case 'forecast.run':
          scorecard.forecast = {
            mapeImprovement: caseData.metrics.mapeImprovement,
            passed: caseData.metrics.mapeImprovement >= thresholds.forecastMinAccuracyDelta,
            score: Math.min(1, Math.max(0, caseData.metrics.mapeImprovement / thresholds.forecastMinAccuracyDelta))
          };
          break;

        case 'stock.optimize':
          scorecard.optimization = {
            stockoutsAvoidedPct: caseData.metrics.stockoutsAvoidedPct,
            passed: caseData.metrics.stockoutsAvoidedPct >= thresholds.optMinStockoutsAvoided,
            score: Math.min(1, Math.max(0, caseData.metrics.stockoutsAvoidedPct / thresholds.optMinStockoutsAvoided))
          };
          break;

        case 'wc.project':
          scorecard.workingCapital = {
            breachMonthsDelta: caseData.metrics.breachMonthsDelta,
            minCashDelta: caseData.metrics.minCashDelta,
            passed: caseData.metrics.breachMonthsDelta <= thresholds.wcMaxBreachMonthsDelta &&
                    caseData.metrics.minCashDelta >= thresholds.wcMinCashDelta,
            score: (caseData.metrics.breachMonthsDelta <= 0 ? 0.5 : 0) +
                   (caseData.metrics.minCashDelta >= 0 ? 0.5 : 0)
          };
          break;
      }
    }

    // Calculate overall score
    const scores = [
      scorecard.forecast?.score,
      scorecard.optimization?.score,
      scorecard.workingCapital?.score
    ].filter(s => s !== null && s !== undefined);

    scorecard.overall = {
      score: scores.length > 0 ? scores.reduce((a, _b) => a + b, 0) / scores.length : 0,
      passed: scores.length > 0 && scores.every(s => s >= 0.5)
    };

    return scorecard;
  }

  /**
   * Evaluate scorecard against thresholds
   */
  evaluateScorecard(scorecard, thresholds) {
    // Check must-have criteria
    const mustHaves = [];

    if (scorecard.forecast) {
      mustHaves.push(scorecard.forecast.passed);
    }

    if (scorecard.workingCapital) {
      mustHaves.push(scorecard.workingCapital.passed);
    }

    // All must-haves must pass
    return mustHaves.length === 0 || mustHaves.every(passed => passed);
  }

  /**
   * Gate a plan based on evaluation
   */
  async gatePlan(plan, evalScorecard) {
    if (!evalScorecard.passed) {
      logInfo('Plan gated due to failing thresholds', {
        scorecard: evalScorecard.scorecard
      });

      // Downgrade to DRY_RUN
      return {
        ...plan,
        mode: 'DRY_RUN',
        gated: true,
        reason: 'Insufficient evidence - evaluation thresholds not met',
        failedCriteria: this.identifyFailedCriteria(evalScorecard.scorecard)
      };
    }

    return plan;
  }

  /**
   * Identify which criteria failed
   */
  identifyFailedCriteria(scorecard) {
    const failed = [];

    if (scorecard.forecast && !scorecard.forecast.passed) {
      failed.push({
        tool: 'forecast',
        metric: 'mapeImprovement',
        required: this.thresholds.forecastMinAccuracyDelta,
        actual: scorecard.forecast.mapeImprovement
      });
    }

    if (scorecard.optimization && !scorecard.optimization.passed) {
      failed.push({
        tool: 'optimization',
        metric: 'stockoutsAvoidedPct',
        required: this.thresholds.optMinStockoutsAvoided,
        actual: scorecard.optimization.stockoutsAvoidedPct
      });
    }

    if (scorecard.workingCapital && !scorecard.workingCapital.passed) {
      if (scorecard.workingCapital.breachMonthsDelta > this.thresholds.wcMaxBreachMonthsDelta) {
        failed.push({
          tool: 'workingCapital',
          metric: 'breachMonthsDelta',
          required: this.thresholds.wcMaxBreachMonthsDelta,
          actual: scorecard.workingCapital.breachMonthsDelta
        });
      }
      if (scorecard.workingCapital.minCashDelta < this.thresholds.wcMinCashDelta) {
        failed.push({
          tool: 'workingCapital',
          metric: 'minCashDelta',
          required: this.thresholds.wcMinCashDelta,
          actual: scorecard.workingCapital.minCashDelta
        });
      }
    }

    return failed;
  }
}

// Singleton instance
export const agentEvaluator = new AgentEvaluator();

export default {
  AgentEvaluator,
  agentEvaluator
};