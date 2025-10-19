import logger from '../../utils/logger.js'

class MitigationPlanner {
  constructor(config = {}) {
    this.config = {
      cccTarget: config.cccTarget || 55,
      runwayWarning: config.runwayWarning || 3,
      runwayCritical: config.runwayCritical || 1.5,
      inventoryTolerance: config.inventoryTolerance || 0.08,
      maxRecommendations: config.maxRecommendations || 6,
    }
  }

  generatePlan(metrics = {}, options = {}) {
    logger.info('[MitigationPlanner] Building mitigation plan')
    const plan = {
      quickWins: [],
      structural: [],
      liquidity: [],
      summary: this.buildSummary(metrics, options.scenarios || []),
    }

    this.attachCccActions(plan, metrics?.ccc)
    this.attachRunwayActions(plan, metrics?.runway)
    this.attachInventoryActions(plan, metrics?.inventory)

    const combined = [...plan.quickWins, ...plan.liquidity, ...plan.structural]
    const prioritised = combined
      .sort((a, b) => (b.impact?.score || 0) - (a.impact?.score || 0))
      .slice(0, this.config.maxRecommendations)

    return {
      recommendations: prioritised,
      categories: plan,
    }
  }

  buildSummary(metrics, scenarios) {
    const summary = {
      cccStatus: metrics?.ccc?.status || 'unknown',
      runwayStatus: metrics?.runway?.status || 'unknown',
      inventoryValue: metrics?.inventory?.inventoryValue || 0,
      scenarioHighlights: [],
    }

    scenarios
      .filter(scenario => scenario?.key && scenario?.impact)
      .forEach(scenario => {
        const impact = scenario.impact
        summary.scenarioHighlights.push({
          key: scenario.key,
          label: scenario.label,
          cccDelta: impact?.ccc?.ccc?.delta || 0,
          runwayDelta: impact?.runway?.runwayMonths?.delta || 0,
        })
      })

    return summary
  }

  attachCccActions(plan, cccMetrics) {
    if (!cccMetrics) return
    const variance = cccMetrics.variance || 0

    if (variance > 5) {
      plan.quickWins.push({
        id: 'accelerate-collections',
        title: 'Accelerate receivables collections',
        description:
          'Deploy dunning workflows, focus on invoices >30 days, and incentivise early payment.',
        owner: 'Finance Operations',
        impact: {
          type: 'ccc',
          score: 0.32,
          expectedDelta: -Math.min(variance, 10),
        },
        effort: 'medium',
        timeframe: '2-4 weeks',
      })
    }

    if ((cccMetrics.dpo || 0) < 35) {
      plan.structural.push({
        id: 'renegotiate-terms',
        title: 'Renegotiate supplier terms',
        description:
          'Target top 10 suppliers for 15-30 day extensions to align with collection cadence.',
        owner: 'Procurement',
        impact: {
          type: 'ccc',
          score: 0.24,
          expectedDelta: 4,
        },
        effort: 'medium',
        timeframe: '4-8 weeks',
      })
    }
  }

  attachRunwayActions(plan, runwayMetrics) {
    if (!runwayMetrics) return
    const runwayMonths = runwayMetrics.runwayMonths || 0

    if (runwayMonths && runwayMonths < this.config.runwayCritical) {
      plan.liquidity.push({
        id: 'cash-containment',
        title: 'Activate cash containment playbook',
        description:
          'Pause discretionary spend, defer non-critical capex, and tighten vendor payment sequencing.',
        owner: 'FP&A',
        impact: {
          type: 'runway',
          score: 0.4,
          expectedDelta: 1.5,
        },
        effort: 'high',
        timeframe: 'Immediate',
      })
    } else if (runwayMonths && runwayMonths < this.config.runwayWarning) {
      plan.liquidity.push({
        id: 'credit-facility',
        title: 'Secure short-term liquidity facility',
        description:
          'Engage banking partners for revolving credit or supply-chain finance to protect >3 months runway.',
        owner: 'Treasury',
        impact: {
          type: 'runway',
          score: 0.28,
          expectedDelta: 1,
        },
        effort: 'medium',
        timeframe: '1-2 weeks',
      })
    }
  }

  attachInventoryActions(plan, inventoryMetrics) {
    if (!inventoryMetrics) return
    const inventoryValue = inventoryMetrics.inventoryValue || 0
    const cogs = inventoryMetrics.annualCogs || 0

    if (!inventoryValue || !cogs) return

    const turnoverDays = inventoryMetrics.turnoverDays || 0
    const impliedInventory = (turnoverDays / 365) * cogs
    const buffer = inventoryValue - impliedInventory

    if (buffer / Math.max(1, impliedInventory) > this.config.inventoryTolerance) {
      plan.structural.push({
        id: 'rebalance-slow-movers',
        title: 'Rebalance slow-moving SKUs',
        description:
          'Run targeted promotions, bundle offers, and inter-warehouse transfers to release trapped working capital.',
        owner: 'Supply Chain',
        impact: {
          type: 'inventory',
          score: 0.3,
          expectedDelta: -buffer,
        },
        effort: 'medium',
        timeframe: '4-6 weeks',
      })
    }
  }
}

export default MitigationPlanner
