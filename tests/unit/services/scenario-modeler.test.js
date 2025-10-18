import { describe, expect, it } from 'vitest'
import ScenarioModeler from '../../../server/services/finance/ScenarioModeler.js'

const baselineFixture = {
  data: {
    revenue: 120000,
    cogs: 72000,
    inventory: 24000,
    accountsReceivable: 18000,
    accountsPayable: 15000,
    cashBalance: 50000,
    burnRate: 12000,
  },
  metrics: {
    ccc: {
      dio: 40,
      dso: 35,
      dpo: 25,
      ccc: 50,
      periodDays: 365,
      target: 55,
    },
    runway: {
      runwayMonths: 4,
      cashBalance: 50000,
      burnRate: 12000,
    },
    inventory: {
      inventoryValue: 24000,
      turnoverDays: 40,
    },
  },
}

describe('ScenarioModeler utilities', () => {
  const modeler = new ScenarioModeler({})

  it('applies adjustments to baseline snapshot', () => {
    const adjusted = modeler.applyAdjustments(baselineFixture, {
      revenuePct: 0.1,
      cogsPct: -0.05,
      dsoDelta: -5,
      dpoDelta: 3,
      cashPct: 0.05,
      burnPct: -0.1,
    })

    expect(adjusted.data.revenue).toBeCloseTo(132000)
    expect(adjusted.data.cogs).toBeCloseTo(68400)
    expect(adjusted.data.accountsReceivable).toBeLessThan(baselineFixture.data.accountsReceivable)
    expect(adjusted.data.accountsPayable).toBeGreaterThan(baselineFixture.data.accountsPayable)
    expect(adjusted.data.cashBalance).toBeGreaterThan(baselineFixture.data.cashBalance)
    expect(adjusted.data.burnRate).toBeLessThan(baselineFixture.data.burnRate)
  })

  it('calculates impact between baseline and scenario metrics', () => {
    const baselineMetrics = baselineFixture.metrics
    const scenarioMetrics = {
      ccc: { ...baselineMetrics.ccc, ccc: 46, dso: 32, dpo: 28 },
      runway: { ...baselineMetrics.runway, runwayMonths: 5.5, cashBalance: 56000 },
      inventory: { ...baselineMetrics.inventory, inventoryValue: 21000 },
    }

    const impact = modeler.calculateImpact(baselineMetrics, scenarioMetrics)

    expect(impact.ccc.ccc.delta).toBeCloseTo(-4)
    expect(impact.runway.runwayMonths.delta).toBeCloseTo(1.5)
    expect(impact.inventory.inventoryValue.delta).toBeCloseTo(-3000)
  })
})
