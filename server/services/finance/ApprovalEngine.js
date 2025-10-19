import logger from '../../utils/logger.js'

export default class ApprovalEngine {
  constructor(config = {}) {
    this.config = {
      autoApproveLimit: config.autoApproveLimit || 10000,
      highRiskThreshold: config.highRiskThreshold || 0.2,
      mediumRiskThreshold: config.mediumRiskThreshold || 0.1,
      defaultSlaHours: config.defaultSlaHours || 24,
      criticalSlaHours: config.criticalSlaHours || 4,
      approvers: config.approvers || {
        financeManager: ['finance.manager@sentia.ai'],
        controller: ['group.controller@sentia.ai'],
        cfo: ['cfo@sentia.ai'],
      },
    }
  }

  evaluate(request = {}, context = {}) {
    logger.info?.('[ApprovalEngine] Evaluating request', { request })

    const metrics = context.metrics || {}
    const scenario = context.scenario || 'baseline'

    const riskScore = this.calculateRiskScore(request, metrics)
    const category = this.categoriseRisk(riskScore)

    const decision = this.buildDecision(request, category, scenario)
    const checklist = this.buildChecklist(request, metrics)

    return {
      ...decision,
      risk: {
        score: Number(riskScore.toFixed(3)),
        category,
      },
      checklist,
      scenario,
      timestamp: new Date().toISOString(),
    }
  }

  calculateRiskScore(request, metrics) {
    const { amount = 0, impact = 'medium' } = request
    const cccVariance = metrics?.ccc?.impact?.ccc?.deltaPercent || 0
    const runwayDelta = metrics?.runway?.impact?.runwayMonths?.deltaPercent || 0

    const impactWeight = this.getImpactWeight(impact)

    const amountScore = Math.log10(Math.max(1, amount)) / 10
    const cccScore = (cccVariance || 0) / 100
    const runwayScore = -(runwayDelta || 0) / 100

    return Math.max(0, amountScore * impactWeight + cccScore + runwayScore)
  }

  getImpactWeight(impact) {
    switch (impact) {
      case 'high':
        return 1.4
      case 'low':
        return 0.7
      default:
        return 1
    }
  }

  categoriseRisk(score) {
    if (score >= this.config.highRiskThreshold) return 'high'
    if (score >= this.config.mediumRiskThreshold) return 'medium'
    return 'low'
  }

  buildDecision(request, riskCategory, scenario) {
    if (riskCategory === 'low' && request.amount <= this.config.autoApproveLimit) {
      return {
        decision: 'auto_approved',
        approvers: [],
        slaHours: 0,
        rationale: 'Meets auto-approval policy (low risk & within limit).',
      }
    }

    const approverChain = this.getApproverChain(request, riskCategory)
    const slaHours = riskCategory === 'high'
      ? this.config.criticalSlaHours
      : this.config.defaultSlaHours

    return {
      decision: 'requires_approval',
      approvers: approverChain,
      slaHours,
      rationale: this.composeRationale(request, riskCategory, scenario),
    }
  }

  getApproverChain(request, riskCategory) {
    const chain = []

    if (riskCategory === 'high' || request.amount > this.config.autoApproveLimit * 5) {
      chain.push(...this.config.approvers.cfo)
    }

    if (riskCategory !== 'low') {
      chain.push(...this.config.approvers.controller)
    }

    chain.push(...this.config.approvers.financeManager)

    return [...new Set(chain)]
  }

  composeRationale(request, riskCategory, scenario) {
    const parts = []

    parts.push(`Scenario: ${scenario}`)
    parts.push(`Risk category: ${riskCategory}`)
    parts.push(`Requested amount: £${Number(request.amount || 0).toLocaleString()}`)

    if (request.description) {
      parts.push(`Purpose: ${request.description}`)
    }

    if (request.expectedBenefit) {
      parts.push(`Expected benefit: ${request.expectedBenefit}`)
    }

    return parts.join(' | ')
  }

  buildChecklist(request, metrics) {
    const checklist = []

    if (metrics?.ccc?.metrics?.ccc || metrics?.ccc?.ccc) {
      const cccValue = metrics.ccc?.metrics?.ccc || metrics.ccc?.ccc
      if (cccValue > (metrics.ccc?.target || metrics.ccc?.metrics?.target || 0)) {
        checklist.push('Provide receivables recovery plan to reduce CCC below target.')
      }
    }

    if (metrics?.runway?.metrics?.runwayMonths || metrics?.runway?.runwayMonths) {
      const runway = metrics.runway?.metrics?.runwayMonths || metrics.runway?.runwayMonths
      if (runway && runway < 3) {
        checklist.push('Attach liquidity plan covering < 3 months runway risk.')
      }
    }

    if ((request.amount || 0) > this.config.autoApproveLimit * 5) {
      checklist.push('Include CFO sign-off for high-value request.')
    }

    if (!checklist.length) {
      checklist.push('No additional documentation required.')
    }

    return checklist
  }
}
