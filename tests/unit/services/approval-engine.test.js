import { describe, expect, it, vi } from 'vitest'

// Mock the logger before importing ApprovalEngine
vi.mock('../../../server/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

import ApprovalEngine from '../../../server/services/finance/ApprovalEngine.js'

const baselineMetrics = {
  ccc: {
    metrics: {
      ccc: 54,
    },
    impact: {
      ccc: {
        deltaPercent: 0,
      },
    },
    target: 55,
  },
  runway: {
    metrics: {
      runwayMonths: 4.2,
      cashBalance: 48000,
      burnRate: 11500,
    },
    impact: {
      runwayMonths: {
        deltaPercent: 0,
      },
    },
  },
}

describe('ApprovalEngine evaluation', () => {
  const engine = new ApprovalEngine({ autoApproveLimit: 15000 })

  it.skip('auto-approves low risk requests inside the limit', () => {
    const evaluation = engine.evaluate(
      {
        amount: 5000,
        impact: 'low',
        description: 'Routine stock replenishment',
      },
      { metrics: baselineMetrics }
    )

    expect(evaluation.decision).toBe('auto_approved')
    expect(evaluation.approvers).toHaveLength(0)
  })

  it('escalates high value, high impact decisions to leadership', () => {
    const evaluation = engine.evaluate(
      {
        amount: 100000,
        impact: 'high',
        description: 'Bridge financing to support supplier renegotiation',
        expectedBenefit: 'Improves runway by 2 months',
      },
      { metrics: baselineMetrics, scenario: 'stress' }
    )

    expect(evaluation.decision).toBe('requires_approval')
    expect(evaluation.approvers).toContain('cfo@sentia.ai')
    expect(evaluation.risk.category).toBe('high')
  })
})
