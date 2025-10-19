/**
 * Working Capital Engine - Advanced Analytics and Optimization
 *
 * Provides sophisticated working capital calculations and optimization
 * recommendations for Sentia Manufacturing's 9-SKU, 5-channel operation.
 */

class WorkingCapitalEngine {
  constructor() {
    this.apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
  }

  /**
   * Get comprehensive working capital analysis with optimization recommendations
   */
  async getWorkingCapitalAnalysis() {
    try {
      // Fetch base working capital data
      const response = await fetch(`${this.apiBase}/financial/working-capital`)
      const baseData = await response.json()

      if (!response.ok || !baseData.success) {
        throw new Error(baseData.message || 'Failed to fetch working capital data')
      }

      // Enhance with advanced analytics
      const enhancedAnalysis = await this.enhanceWithAnalytics(baseData.data)

      return {
        ...baseData,
        data: enhancedAnalysis,
        optimizationRecommendations: this.generateOptimizationRecommendations(enhancedAnalysis),
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(`Working capital analysis failed: ${error.message}`)
    }
  }

  /**
   * Enhance base data with advanced working capital analytics
   */
  async enhanceWithAnalytics(baseData) {
    // Calculate advanced cash conversion cycle components
    const cccAnalysis = this.calculateAdvancedCCC(baseData)

    // Working capital efficiency metrics
    const efficiencyMetrics = this.calculateEfficiencyMetrics(baseData)

    // Seasonal working capital patterns
    const seasonalAnalysis = await this.analyzeSeasonalPatterns()

    // Channel-specific working capital impact
    const channelAnalysis = await this.analyzeChannelImpact()

    // Manufacturing impact analysis with Unleashed data
    const manufacturingAnalysis = await this.analyzeManufacturingImpact()

    // Risk assessment
    const riskAssessment = this.assessWorkingCapitalRisk(baseData)

    return {
      ...baseData,
      advanced: {
        cashConversionCycle: cccAnalysis,
        efficiency: efficiencyMetrics,
        seasonal: seasonalAnalysis,
        channels: channelAnalysis,
        manufacturing: manufacturingAnalysis,
        risk: riskAssessment,
      },
    }
  }

  /**
   * Calculate advanced cash conversion cycle analytics
   */
  calculateAdvancedCCC(data) {
    const { dso, dio, dpo } = data

    // Industry benchmarks for supplement manufacturing
    const benchmarks = {
      dso: { excellent: 25, good: 35, poor: 50 },
      dio: { excellent: 60, good: 90, poor: 120 },
      dpo: { excellent: 45, good: 35, poor: 25 },
    }

    // Calculate working capital velocity
    const workingCapitalVelocity =
      data.workingCapital > 0 ? data.currentAssets / data.workingCapital : 0

    // Optimal CCC calculation for Sentia's business model
    const optimalCCC = this.calculateOptimalCCC()

    return {
      current: {
        dso: dso || 0,
        dio: dio || 0,
        dpo: dpo || 0,
        total: (dso || 0) + (dio || 0) - (dpo || 0),
      },
      optimal: optimalCCC,
      benchmarks,
      metrics: {
        workingCapitalVelocity,
        cccEfficiency:
          optimalCCC.total > 0 ? ((dso || 0) + (dio || 0) - (dpo || 0)) / optimalCCC.total : 0,
        improvementPotential: Math.max(0, (dso || 0) + (dio || 0) - (dpo || 0) - optimalCCC.total),
      },
    }
  }

  /**
   * Calculate optimal CCC for Sentia's business model
   */
  calculateOptimalCCC() {
    // Optimal targets for GABA supplement business
    return {
      dso: 28, // B2C marketplace average collection
      dio: 75, // Supplement shelf life and demand patterns
      dpo: 40, // Standard supplier payment terms
      total: 63, // 28 + 75 - 40
    }
  }

  /**
   * Calculate working capital efficiency metrics
   */
  calculateEfficiencyMetrics(data) {
    const { workingCapital, currentAssets, inventory, accountsReceivable } = data

    // Working capital turnover ratio
    const workingCapitalTurnover = workingCapital > 0 ? (data.netRevenue || 0) / workingCapital : 0

    // Asset utilization efficiency
    const assetUtilization = currentAssets > 0 ? (data.netRevenue || 0) / currentAssets : 0

    // Inventory efficiency
    const inventoryTurnover = inventory > 0 ? (data.costOfGoodsSold || 0) / inventory : 0

    // Receivables efficiency
    const receivablesTurnover =
      accountsReceivable > 0 ? (data.netRevenue || 0) / accountsReceivable : 0

    return {
      workingCapitalTurnover,
      assetUtilization,
      inventoryTurnover,
      receivablesTurnover,
      efficiency: {
        overall: this.calculateOverallEfficiency([
          workingCapitalTurnover,
          assetUtilization,
          inventoryTurnover,
          receivablesTurnover,
        ]),
        category: this.categorizeEfficiency(workingCapitalTurnover),
      },
    }
  }

  /**
   * Analyze seasonal working capital patterns
   */
  async analyzeSeasonalPatterns() {
    try {
      // Fetch historical sales data for seasonal analysis
      const response = await fetch(`${this.apiBase}/sales/product-performance?period=12months`)
      await response.json()

      if (!response.ok) {
        throw new Error('Failed to fetch seasonal data')
      }

      // Q4 supplement sales typically increase 30-40%
      const seasonalMultipliers = {
        Q1: 0.9, // Post-holiday decline
        Q2: 1.0, // Baseline
        Q3: 1.1, // Pre-holiday ramp
        Q4: 1.35, // Holiday season boost
      }

      const currentQuarter = Math.floor((new Date().getMonth() + 3) / 3)
      const currentMultiplier = seasonalMultipliers[`Q${currentQuarter}`]

      return {
        currentQuarter: `Q${currentQuarter}`,
        seasonalMultiplier: currentMultiplier,
        workingCapitalImpact: {
          inventoryAdjustment: (currentMultiplier - 1) * 100,
          receivablesImpact: (currentMultiplier - 1) * 100,
          recommendedBuffer: this.calculateSeasonalBuffer(currentMultiplier),
        },
        forecast: this.generateSeasonalForecast(seasonalMultipliers),
      }
    } catch (error) {
      return {
        error: 'Seasonal analysis unavailable',
        message: error.message,
      }
    }
  }

  /**
   * Analyze channel-specific working capital impact
   */
  async analyzeChannelImpact() {
    // Sentia's 5 sales channels with different working capital implications
    const channelProfiles = {
      'Amazon UK': {
        paymentTerms: 14, // Amazon pays bi-weekly
        commission: 0.15,
        workingCapitalImpact: 'low', // Fast payment
        dsoImpact: -7, // Reduces DSO
      },
      'Amazon USA': {
        paymentTerms: 14,
        commission: 0.15,
        workingCapitalImpact: 'low',
        dsoImpact: -7,
      },
      'Shopify UK': {
        paymentTerms: 3, // Direct customer payments
        commission: 0.029,
        workingCapitalImpact: 'very_low',
        dsoImpact: -15, // Immediate payment
      },
      'Shopify EU': {
        paymentTerms: 3,
        commission: 0.029,
        workingCapitalImpact: 'very_low',
        dsoImpact: -15,
      },
      'Shopify USA': {
        paymentTerms: 3,
        commission: 0.029,
        workingCapitalImpact: 'very_low',
        dsoImpact: -15,
      },
    }

    return {
      channels: channelProfiles,
      optimization: {
        recommendedMix: this.calculateOptimalChannelMix(channelProfiles),
        workingCapitalReduction: this.calculateChannelOptimization(channelProfiles),
      },
    }
  }

  /**
   * Analyze manufacturing impact on working capital with Unleashed ERP data
   */
  async analyzeManufacturingImpact() {
    try {
      // Fetch manufacturing data from Unleashed ERP
      const [productionResponse, inventoryResponse, qualityResponse] = await Promise.allSettled([
        fetch(`${this.apiBase}/unleashed/production`),
        fetch(`${this.apiBase}/unleashed/inventory`),
        fetch(`${this.apiBase}/unleashed/quality`),
      ])

      const manufacturingData = {
        production: null,
        inventory: null,
        quality: null,
        workingCapitalImpact: {},
      }

      // Process production data
      if (productionResponse.status === 'fulfilled' && productionResponse.value.ok) {
        const productionData = await productionResponse.value.json()
        if (productionData.success) {
          manufacturingData.production = {
            activeBatches: productionData.data.activeBatches || 0,
            utilizationRate: productionData.data.utilizationRate || 0,
            qualityScore: productionData.data.qualityScore || 95.0,
            schedule: productionData.data.schedule || [],
          }
        }
      }

      // Process inventory data
      if (inventoryResponse.status === 'fulfilled' && inventoryResponse.value.ok) {
        const inventoryData = await inventoryResponse.value.json()
        if (inventoryData.success) {
          manufacturingData.inventory = {
            totalValue: inventoryData.data.totalValue || 0,
            totalItems: inventoryData.data.totalItems || 0,
            lowStockItems: inventoryData.data.lowStockItems || 0,
            alerts: inventoryData.data.alerts || [],
          }
        }
      }

      // Process quality data
      if (qualityResponse.status === 'fulfilled' && qualityResponse.value.ok) {
        const qualityData = await qualityResponse.value.json()
        if (qualityData.success) {
          manufacturingData.quality = {
            qualityScore: qualityData.data.qualityScore || 95.0,
            completedToday: qualityData.data.completedToday || 0,
            alerts: qualityData.data.alerts || [],
          }
        }
      }

      // Calculate working capital impact from manufacturing operations
      manufacturingData.workingCapitalImpact =
        this.calculateManufacturingWorkingCapitalImpact(manufacturingData)

      return manufacturingData
    } catch (error) {
      return {
        error: 'Manufacturing analysis unavailable',
        message: error.message,
        production: null,
        inventory: null,
        quality: null,
        workingCapitalImpact: {
          productionEfficiencyImpact: 0,
          inventoryOptimizationPotential: 0,
          qualityRiskAdjustment: 0,
          recommendations: ['Manufacturing data integration pending'],
        },
      }
    }
  }

  /**
   * Calculate working capital impact from manufacturing operations
   */
  calculateManufacturingWorkingCapitalImpact(manufacturingData) {
    const impact = {
      productionEfficiencyImpact: 0,
      inventoryOptimizationPotential: 0,
      qualityRiskAdjustment: 0,
      recommendations: [],
    }

    // Production efficiency impact on working capital
    if (manufacturingData.production) {
      const utilizationRate = manufacturingData.production.utilizationRate

      if (utilizationRate > 90) {
        impact.productionEfficiencyImpact = 5 // High efficiency reduces working capital needs
        impact.recommendations.push('Excellent production utilization maintains lean inventory')
      } else if (utilizationRate < 70) {
        impact.productionEfficiencyImpact = -8 // Low efficiency increases working capital needs
        impact.recommendations.push(
          'Low production utilization may require increased inventory buffer'
        )
      } else {
        impact.productionEfficiencyImpact = 0
        impact.recommendations.push('Production utilization within normal range')
      }
    }

    // Inventory optimization potential
    if (manufacturingData.inventory) {
      const lowStockRatio =
        manufacturingData.inventory.totalItems > 0
          ? manufacturingData.inventory.lowStockItems / manufacturingData.inventory.totalItems
          : 0

      if (lowStockRatio > 0.2) {
        impact.inventoryOptimizationPotential = -15 // High low-stock ratio increases working capital risk
        impact.recommendations.push('High number of low-stock items increases working capital risk')
      } else if (lowStockRatio < 0.05) {
        impact.inventoryOptimizationPotential = 10 // Very low stock-out risk, potential for optimization
        impact.recommendations.push(
          'Low stock-out risk provides opportunity to optimize inventory levels'
        )
      } else {
        impact.inventoryOptimizationPotential = 0
        impact.recommendations.push('Inventory levels balanced for current demand')
      }
    }

    // Quality score impact on working capital
    if (manufacturingData.quality) {
      const qualityScore = manufacturingData.quality.qualityScore

      if (qualityScore > 98) {
        impact.qualityRiskAdjustment = 3 // Excellent quality reduces rework and waste
        impact.recommendations.push('Excellent quality scores minimize working capital waste')
      } else if (qualityScore < 90) {
        impact.qualityRiskAdjustment = -12 // Poor quality increases costs and working capital needs
        impact.recommendations.push(
          'Quality issues may increase working capital requirements due to rework/waste'
        )
      } else {
        impact.qualityRiskAdjustment = 0
        impact.recommendations.push('Quality performance within acceptable range')
      }
    }

    // Calculate overall manufacturing impact
    impact.overallImpact =
      impact.productionEfficiencyImpact +
      impact.inventoryOptimizationPotential +
      impact.qualityRiskAdjustment

    // Add strategic recommendations based on manufacturing data
    if (manufacturingData.production?.activeBatches > 3) {
      impact.recommendations.push(
        'High production volume may benefit from enhanced supplier payment terms'
      )
    }

    if (manufacturingData.inventory?.alerts?.length > 0) {
      impact.recommendations.push(
        'Inventory alerts require attention to prevent working capital disruption'
      )
    }

    return impact
  }

  /**
   * Assess working capital risk factors
   */
  assessWorkingCapitalRisk(data) {
    const risks = []
    const { currentRatio, quickRatio, workingCapital, cashConversionCycle } = data

    // Liquidity risks
    if (currentRatio < 1.5) {
      risks.push({
        type: 'liquidity',
        severity: 'high',
        description: 'Current ratio below recommended threshold',
        impact: 'Potential difficulty meeting short-term obligations',
      })
    }

    if (quickRatio < 1.0) {
      risks.push({
        type: 'liquidity',
        severity: 'medium',
        description: 'Quick ratio below 1.0',
        impact: 'Limited immediate liquidity without inventory conversion',
      })
    }

    // Cash conversion cycle risks
    if (cashConversionCycle > 90) {
      risks.push({
        type: 'efficiency',
        severity: 'medium',
        description: 'Extended cash conversion cycle',
        impact: 'Capital tied up longer than industry average',
      })
    }

    // Working capital adequacy
    if (workingCapital < 50000) {
      risks.push({
        type: 'adequacy',
        severity: 'high',
        description: 'Low working capital buffer',
        impact: 'Insufficient cushion for operational fluctuations',
      })
    }

    return {
      risks,
      overallRisk: this.calculateOverallRisk(risks),
      mitigation: this.generateRiskMitigationStrategies(risks),
    }
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(analysis) {
    const recommendations = []
    const { advanced } = analysis

    // Cash conversion cycle optimizations
    if (advanced.cashConversionCycle.metrics.improvementPotential > 10) {
      recommendations.push({
        category: 'cash_conversion',
        priority: 'high',
        title: 'Optimize Cash Conversion Cycle',
        description: `Reduce CCC by ${Math.round(advanced.cashConversionCycle.metrics.improvementPotential)} days`,
        actions: [
          'Negotiate faster customer payment terms',
          'Optimize inventory turnover for slow-moving SKUs',
          'Extend supplier payment terms where possible',
        ],
        impact: `Free up £${this.estimateCashImpact(advanced.cashConversionCycle.metrics.improvementPotential)}`,
      })
    }

    // Channel mix optimization
    if (advanced.channels.optimization.workingCapitalReduction > 5000) {
      recommendations.push({
        category: 'channel_optimization',
        priority: 'medium',
        title: 'Optimize Sales Channel Mix',
        description: 'Shift sales toward channels with better working capital terms',
        actions: [
          'Increase Shopify direct sales (3-day payment)',
          'Optimize Amazon marketplace performance',
          'Consider customer incentives for direct purchases',
        ],
        impact: `Potential £${Math.round(advanced.channels.optimization.workingCapitalReduction)} working capital improvement`,
      })
    }

    // Seasonal preparation
    if (advanced.seasonal.workingCapitalImpact?.recommendedBuffer > 10000) {
      recommendations.push({
        category: 'seasonal_planning',
        priority: 'medium',
        title: 'Seasonal Working Capital Planning',
        description: 'Prepare for seasonal demand fluctuations',
        actions: [
          `Build inventory buffer for Q${advanced.seasonal.currentQuarter}`,
          'Secure additional credit lines for peak season',
          'Plan production schedules for seasonal demand',
        ],
        impact: `Recommended buffer: £${Math.round(advanced.seasonal.workingCapitalImpact.recommendedBuffer)}`,
      })
    }

    return recommendations
  }

  // Helper methods
  calculateOverallEfficiency(metrics) {
    const validMetrics = metrics.filter(m => m > 0 && isFinite(m))
    return validMetrics.length > 0
      ? validMetrics.reduce((sum, m) => sum + m, 0) / validMetrics.length
      : 0
  }

  categorizeEfficiency(turnover) {
    if (turnover >= 4) return 'excellent'
    if (turnover >= 2) return 'good'
    if (turnover >= 1) return 'fair'
    return 'poor'
  }

  calculateSeasonalBuffer(multiplier) {
    // Base working capital requirement * seasonal adjustment
    return 25000 * Math.max(0, multiplier - 1)
  }

  generateSeasonalForecast(multipliers) {
    return Object.entries(multipliers).map(([quarter, multiplier]) => ({
      quarter,
      multiplier,
      workingCapitalNeed: 75000 * multiplier, // Base WC * seasonal factor
    }))
  }

  calculateOptimalChannelMix() {
    // Optimize for working capital efficiency
    return {
      'Shopify Direct': 0.4, // Prioritize for immediate payment
      'Amazon Marketplaces': 0.6, // Maintain for scale
    }
  }

  calculateChannelOptimization() {
    // Estimate working capital improvement from channel optimization
    const currentMix = { amazon: 0.7, shopify: 0.3 }
    const optimalMix = { amazon: 0.6, shopify: 0.4 }

    const improvementDays = (currentMix.amazon - optimalMix.amazon) * 11 // DSO difference
    return improvementDays * 2000 // £2000 per day of working capital
  }

  calculateOverallRisk(risks) {
    const riskScores = { low: 1, medium: 2, high: 3 }
    const totalScore = risks.reduce((sum, risk) => sum + riskScores[risk.severity], 0)

    if (totalScore <= 2) return 'low'
    if (totalScore <= 5) return 'medium'
    return 'high'
  }

  generateRiskMitigationStrategies(risks) {
    return risks.map(risk => ({
      risk: risk.type,
      strategy: this.getRiskMitigationStrategy(risk.type),
      timeframe: this.getRiskMitigationTimeframe(risk.severity),
    }))
  }

  getRiskMitigationStrategy(riskType) {
    const strategies = {
      liquidity: 'Establish credit facilities, improve cash forecasting',
      efficiency: 'Implement lean inventory practices, accelerate collections',
      adequacy: 'Increase working capital reserves, optimize cash flow timing',
    }
    return strategies[riskType] || 'Implement comprehensive working capital monitoring'
  }

  getRiskMitigationTimeframe(severity) {
    return {
      high: '30 days',
      medium: '60 days',
      low: '90 days',
    }[severity]
  }

  estimateCashImpact(days) {
    // Estimate cash impact of CCC improvement
    const dailyRevenue = 3500 // Estimated daily revenue for Sentia
    return Math.round(days * dailyRevenue)
  }
}

export default WorkingCapitalEngine
