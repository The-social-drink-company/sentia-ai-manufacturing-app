import CashConversionCycle from './CashConversionCycle.js'
import CashRunway from './CashRunway.js'
import InventoryOptimization from './InventoryOptimization.js'
import logger from '../../utils/logger.js'

const DEFAULT_SCENARIOS = [
  {
    key: 'baseline',
    label: 'Baseline',
    adjustments: {},
  },
  {
    key: 'optimistic',
    label: 'Optimistic',
    adjustments: {
      revenuePct: 0.08,
      cogsPct: -0.03,
      dsoDelta: -4,
      dpoDelta: 2,
      burnPct: -0.12,
      cashPct: 0.05,
    },
  },
  {
    key: 'conservative',
    label: 'Conservative',
    adjustments: {
      revenuePct: -0.05,
      cogsPct: 0.02,
      dsoDelta: 3,
      dpoDelta: -2,
      burnPct: 0.08,
      cashPct: -0.04,
    },
  },
  {
    key: 'stress',
    label: 'Stress Test',
    adjustments: {
      revenuePct: -0.12,
      cogsPct: 0.05,
      dsoDelta: 6,
      dpoDelta: -4,
      burnPct: 0.2,
      cashPct: -0.1,
    },
  },
]

class ScenarioModeler {
  constructor(config = {}) {
    this.config = {
      scenarios: DEFAULT_SCENARIOS,
      burnRateWindow: config.burnRateWindow || 3,
      ...config,
    }

    this.cccService = new CashConversionCycle(config.ccc || {})
    this.cashRunwayService = new CashRunway({
      burnRateWindow: this.config.burnRateWindow,
      ...(config.cashRunway || {}),
    })
    this.inventoryService = new InventoryOptimization(config.inventory || {})
  }

  async generateScenarioSet(options = {}) {
    const baseline = await this.generateBaseline(options.overrides)
    const scenarios = []

    for (const scenario of this.config.scenarios) {
      if (scenario.key === 'baseline') {
        scenarios.push({ ...scenario, ...baseline })
        continue
      }

      const result = await this.runScenario(baseline, scenario)
      scenarios.push(result)
    }

    return {
      baseline,
      scenarios,
    }
  }

  async runScenario(baseline, scenario) {
    const applied = this.applyAdjustments(baseline, scenario.adjustments || {})
    const metrics = await this.calculateMetrics(applied.data)
    const impact = this.calculateImpact(baseline.metrics, metrics)

    return {
      key: scenario.key,
      label: scenario.label,
      assumptions: scenario.adjustments || {},
      data: applied.data,
      metrics,
      impact,
    }
  }

  async generateBaseline(overrides = {}) {
    const data = await this.fetchBaseData(overrides)
    const metrics = await this.calculateMetrics(data)

    return {
      key: 'baseline',
      label: 'Baseline',
      data,
      metrics,
      impact: this.calculateImpact(metrics, metrics),
    }
  }

  async fetchBaseData(overrides = {}) {
    logger.info('[ScenarioModeler] Fetching baseline data...')
    const financials = await this.cccService.fetchFinancialData()
    const cashBalance = overrides.cashBalance ?? (await this.cashRunwayService.fetchCashBalance())
    const burnRate =
      overrides.burnRate ??
      (await this.cashRunwayService.calculateBurnRate(this.config.burnRateWindow))

    return {
      ...financials,
      cashBalance,
      burnRate,
      ...overrides,
    }
  }

  async calculateMetrics(financials) {
    const cccMetrics = await this.cccService.calculateCurrent(financials)
    const runwayMetrics = await this.cashRunwayService.calculateCurrent({
      cashBalance: financials.cashBalance,
      burnRate: financials.burnRate,
    })

    const inventorySnapshot = {
      inventoryValue: Number((financials.inventory || 0).toFixed(2)),
      annualCogs: Number((financials.cogs || 0).toFixed(2)),
      turnoverDays: cccMetrics.dio,
    }

    return {
      ccc: cccMetrics,
      runway: runwayMetrics,
      inventory: inventorySnapshot,
    }
  }

  applyAdjustments(baseline, adjustments) {
    const days = baseline.metrics?.ccc?.periodDays || 365
    const baseData = baseline.data

    const revenue = baseData.revenue * (1 + (adjustments.revenuePct || 0))
    const cogs = baseData.cogs * (1 + (adjustments.cogsPct || 0))

    const baseDIO = baseline.metrics?.ccc?.dio || 0
    const baseDSO = baseline.metrics?.ccc?.dso || 0
    const baseDPO = baseline.metrics?.ccc?.dpo || 0

    const dio = Math.max(0, baseDIO * (1 + (adjustments.dioPct || 0)))
    const dso = Math.max(0, baseDSO + (adjustments.dsoDelta || 0))
    const dpo = Math.max(0, baseDPO + (adjustments.dpoDelta || 0))

    const inventory = (dio / days) * cogs
    const accountsReceivable = (dso / days) * revenue
    const accountsPayable = (dpo / days) * cogs

    const cashBalance = Math.max(
      0,
      baseData.cashBalance * (1 + (adjustments.cashPct || 0)) + (adjustments.cashDelta || 0)
    )

    const burnRate = Math.max(0, baseData.burnRate * (1 + (adjustments.burnPct || 0)))

    return {
      data: {
        ...baseData,
        revenue,
        cogs,
        inventory,
        accountsReceivable,
        accountsPayable,
        cashBalance,
        burnRate,
      },
    }
  }

  calculateImpact(baselineMetrics, scenarioMetrics) {
    const impactNumber = (base, value) => {
      if (base === null || base === undefined || value === null || value === undefined) {
        return null
      }
      const delta = value - base
      const percent = base !== 0 ? (delta / base) * 100 : null
      return {
        current: value,
        baseline: base,
        delta: Number(delta.toFixed(2)),
        deltaPercent: percent !== null ? Number(percent.toFixed(2)) : null,
      }
    }

    const cccImpact = {
      ccc: impactNumber(baselineMetrics.ccc.ccc, scenarioMetrics.ccc.ccc),
      dio: impactNumber(baselineMetrics.ccc.dio, scenarioMetrics.ccc.dio),
      dso: impactNumber(baselineMetrics.ccc.dso, scenarioMetrics.ccc.dso),
      dpo: impactNumber(baselineMetrics.ccc.dpo, scenarioMetrics.ccc.dpo),
      status: scenarioMetrics.ccc.status,
    }

    const runwayImpact = {
      runwayMonths: impactNumber(
        baselineMetrics.runway.runwayMonths,
        scenarioMetrics.runway.runwayMonths
      ),
      cashBalance: impactNumber(
        baselineMetrics.runway.cashBalance,
        scenarioMetrics.runway.cashBalance
      ),
      burnRate: impactNumber(baselineMetrics.runway.burnRate, scenarioMetrics.runway.burnRate),
      status: scenarioMetrics.runway.status,
    }

    const inventoryImpact = {
      inventoryValue: impactNumber(
        baselineMetrics.inventory.inventoryValue,
        scenarioMetrics.inventory.inventoryValue
      ),
      turnoverDays: impactNumber(
        baselineMetrics.inventory.turnoverDays,
        scenarioMetrics.inventory.turnoverDays
      ),
    }

    return {
      ccc: cccImpact,
      runway: runwayImpact,
      inventory: inventoryImpact,
    }
  }
}

// Export both default and named for maximum compatibility
export { ScenarioModeler }
export default ScenarioModeler
