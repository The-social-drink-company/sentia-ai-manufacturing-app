/**
 * Optimization Diagnostics and Explainability Service
 * Provides decision rationale, constraint impact analysis, and optimization transparency
 */

class DiagnosticsService {
  constructor() {
    this.decisionHistory = new Map();
    this.constraintAnalysis = new Map();
    this.performanceMetrics = new Map();
  }

  /**
   * Generate comprehensive decision explanation
   */
  explainDecision(optimizationResult) {
    const explanation = {
      decisionSummary: this.generateDecisionSummary(optimizationResult),
      mathematicalRationale: this.explainMathematicalBasis(optimizationResult),
      constraintImpacts: this.analyzeConstraintImpacts(optimizationResult),
      riskAnalysis: this.explainRiskFactors(optimizationResult),
      alternativeScenarios: this.generateAlternativeScenarios(optimizationResult),
      sensitivityAnalysis: this.performSensitivityAnalysis(optimizationResult),
      businessJustification: this.generateBusinessJustification(optimizationResult),
      implementationGuidance: this.generateImplementationGuidance(optimizationResult)
    };

    // Store decision for audit trail
    this.storeDecisionRecord(optimizationResult.skuId, explanation);

    return explanation;
  }

  /**
   * Generate decision summary in plain language
   */
  generateDecisionSummary(result) {
    const { skuId, inputs, calculations, outputs, adjustments } = result;
    
    let summary = `For SKU ${skuId}, the optimization engine recommends ordering ${outputs.recommendedOrderQty} units.`;
    
    // Explain the calculation basis
    summary += ` This is based on an Economic Order Quantity (EOQ) of ${calculations.eoq} units, `;
    summary += `with ${Math.round(calculations.safetyStock)} units of safety stock to maintain a ${inputs.serviceLevel * 100}% service level.`;
    
    // Explain adjustments
    if (adjustments && adjustments.length > 0) {
      summary += ' The EOQ was adjusted due to: ';
      const adjustmentReasons = adjustments.map(adj => adj.reason).join(', ');
      summary += adjustmentReasons + '.';
    }
    
    // Risk communication
    if (outputs.expectedStockoutRiskPct > 5) {
      summary += ` WARNING: This order plan carries a ${outputs.expectedStockoutRiskPct}% risk of stockout during the next replenishment cycle.`;
    }
    
    return {
      plainLanguage: summary,
      keyMetrics: {
        orderQuantity: outputs.recommendedOrderQty,
        serviceLevel: `${inputs.serviceLevel * 100}%`,
        stockoutRisk: `${outputs.expectedStockoutRiskPct}%`,
        holdingCost: `£${outputs.projectedHoldingCost}`,
        orderDate: outputs.recommendedOrderDate
      }
    };
  }

  /**
   * Explain mathematical basis of the decision
   */
  explainMathematicalBasis(result) {
    const { inputs, calculations } = result;
    
    return {
      eoqCalculation: {
        formula: 'EOQ = √(2 × D × S / H)',
        parameters: {
          D: `${inputs.demandMeanDaily * 365} units/year (annual demand)`,
          S: '£50 (ordering cost per order)',
          H: `£${inputs.unitCost * inputs.holdingRate} (holding cost per unit per year)`
        },
        result: `${calculations.eoq} units`,
        explanation: 'Optimal order quantity that minimizes total ordering and holding costs'
      },
      safetyStockCalculation: {
        formula: 'Safety Stock = z × σ_LT',
        parameters: {
          z: `${this.getZScore(inputs.serviceLevel)} (service level z-score for ${inputs.serviceLevel * 100}%)`,
          sigma_LT: `${calculations.sigmaLT} (demand standard deviation during lead time)`
        },
        result: `${calculations.safetyStock} units`,
        explanation: 'Buffer stock to protect against demand variability during lead time'
      },
      reorderPointCalculation: {
        formula: 'ROP = μ_LT + Safety Stock',
        parameters: {
          mu_LT: `${calculations.muLT} units (expected demand during lead time)`,
          safetyStock: `${calculations.safetyStock} units`
        },
        result: `${calculations.rop} units`,
        explanation: 'Inventory level at which to place the next order'
      }
    };
  }

  /**
   * Analyze constraint impacts on the decision
   */
  analyzeConstraintImpacts(result) {
    const impacts = [];
    
    if (result.adjustments) {
      for (const adjustment of result.adjustments) {
        impacts.push({
          constraint: adjustment.constraint,
          impact: adjustment.reason,
          quantityChange: adjustment.afterQty - adjustment.beforeQty,
          costImpact: adjustment.costImpact,
          severity: this.assessConstraintSeverity(adjustment)
        });
      }
    }

    // Check for other constraint impacts
    if (result.outputs.orderDeferred) {
      impacts.push({
        constraint: 'working_capital_limit',
        impact: 'Order deferred due to working capital constraints',
        quantityChange: -result.outputs.recommendedOrderQty,
        costImpact: result.outputs.riskIncreasePct * result.inputs.unitCost,
        severity: 'HIGH'
      });
    }

    return {
      constraintCount: impacts.length,
      impacts,
      totalCostImpact: impacts.reduce((sum, impact) => sum + (impact.costImpact || 0), 0),
      worstConstraint: impacts.length > 0 
        ? impacts.reduce((worst, current) => current.severity === 'HIGH' ? current : worst)
        : null
    };
  }

  /**
   * Explain risk factors affecting the decision
   */
  explainRiskFactors(result) {
    const riskFactors = [];
    
    // Analyze risk flags
    if (result.riskFlags) {
      for (const flag of result.riskFlags) {
        riskFactors.push(this.explainRiskFlag(flag, result));
      }
    }

    // Stockout risk analysis
    if (result.outputs.expectedStockoutRiskPct > 2) {
      riskFactors.push({
        type: 'stockout_risk',
        level: result.outputs.expectedStockoutRiskPct > 10 ? 'HIGH' : 'MEDIUM',
        description: `${result.outputs.expectedStockoutRiskPct}% probability of stockout during next lead time`,
        impact: 'Potential revenue loss and customer service degradation',
        mitigation: 'Consider increasing safety stock or service level target'
      });
    }

    // Demand variability risk
    const cv = result.inputs.demandStdDaily / result.inputs.demandMeanDaily;
    if (cv > 1.0) {
      riskFactors.push({
        type: 'demand_variability',
        level: cv > 2.0 ? 'HIGH' : 'MEDIUM',
        description: `High demand variability (CV = ${Math.round(cv * 100) / 100})`,
        impact: 'Increased forecast uncertainty and potential stockouts',
        mitigation: 'Monitor demand patterns more closely and consider demand smoothing'
      });
    }

    return {
      totalRiskFactors: riskFactors.length,
      riskLevel: this.calculateOverallRiskLevel(riskFactors),
      factors: riskFactors,
      riskScore: this.calculateRiskScore(result)
    };
  }

  /**
   * Generate alternative scenarios
   */
  generateAlternativeScenarios(result) {
    const scenarios = [];
    
    // Higher service level scenario
    const higherServiceLevel = Math.min(0.99, result.inputs.serviceLevel + 0.02);
    if (higherServiceLevel > result.inputs.serviceLevel) {
      scenarios.push(this.calculateAlternativeScenario(result, {
        serviceLevel: higherServiceLevel,
        scenario: 'Higher Service Level',
        description: `Increase service level to ${higherServiceLevel * 100}%`
      }));
    }

    // Lower service level scenario
    const lowerServiceLevel = Math.max(0.90, result.inputs.serviceLevel - 0.02);
    if (lowerServiceLevel < result.inputs.serviceLevel) {
      scenarios.push(this.calculateAlternativeScenario(result, {
        serviceLevel: lowerServiceLevel,
        scenario: 'Lower Service Level',
        description: `Reduce service level to ${lowerServiceLevel * 100}%`
      }));
    }

    // Different lot size scenario
    if (result.inputs.lotSize > 0) {
      scenarios.push(this.calculateAlternativeScenario(result, {
        lotSize: result.inputs.lotSize * 2,
        scenario: 'Larger Lot Size',
        description: `Double the lot size to ${result.inputs.lotSize * 2} units`
      }));
    }

    return scenarios;
  }

  /**
   * Perform sensitivity analysis
   */
  performSensitivityAnalysis(result) {
    const baseOrderQty = result.outputs.recommendedOrderQty;
    const sensitivities = [];

    // Demand sensitivity
    const demandVariations = [-20, -10, 10, 20];
    for (const variation of demandVariations) {
      const adjustedDemand = result.inputs.demandMeanDaily * (1 + variation / 100);
      const newEOQ = this.calculateEOQ(
        adjustedDemand * 365,
        50,
        result.inputs.unitCost * result.inputs.holdingRate
      );
      
      sensitivities.push({
        parameter: 'demand',
        variation: `${variation}%`,
        newOrderQty: Math.round(newEOQ),
        change: Math.round(newEOQ) - baseOrderQty,
        sensitivity: Math.abs(Math.round(newEOQ) - baseOrderQty) / Math.abs(variation)
      });
    }

    // Lead time sensitivity
    const leadTimeVariations = [-3, -1, 1, 3];
    for (const variation of leadTimeVariations) {
      const adjustedLeadTime = Math.max(1, result.inputs.leadTimeDays + variation);
      // Simplified - affects safety stock calculation
      const impact = variation * result.inputs.demandMeanDaily * 0.5;
      
      sensitivities.push({
        parameter: 'lead_time',
        variation: `${variation} days`,
        newOrderQty: baseOrderQty + Math.round(impact),
        change: Math.round(impact),
        sensitivity: Math.abs(impact) / Math.abs(variation)
      });
    }

    return {
      mostSensitiveParameter: this.findMostSensitiveParameter(sensitivities),
      sensitivities,
      stabilityScore: this.calculateStabilityScore(sensitivities)
    };
  }

  /**
   * Generate business justification
   */
  generateBusinessJustification(result) {
    const costBenefitAnalysis = this.performCostBenefitAnalysis(result);
    
    return {
      investmentRequired: result.outputs.recommendedOrderQty * result.inputs.unitCost,
      expectedReturns: costBenefitAnalysis.annualSavings,
      paybackPeriod: costBenefitAnalysis.paybackMonths,
      riskMitigation: `Reduces stockout risk to ${result.outputs.expectedStockoutRiskPct}%`,
      strategicAlignment: this.assessStrategicAlignment(result),
      complianceConsiderations: this.assessComplianceRequirements(result),
      approvalRecommendation: this.generateApprovalRecommendation(result)
    };
  }

  /**
   * Generate implementation guidance
   */
  generateImplementationGuidance(result) {
    return {
      orderTiming: {
        recommendedDate: result.outputs.recommendedOrderDate,
        urgency: this.assessUrgency(result),
        leadTimeBuffer: result.inputs.leadTimeDays
      },
      supplierCommunication: {
        moqCompliant: result.outputs.recommendedOrderQty >= (result.inputs.moq || 0),
        specialRequirements: this.identifySpecialRequirements(result),
        paymentTerms: 'Net 45 days (standard terms)'
      },
      warehousePreparation: {
        spaceRequired: result.outputs.recommendedOrderQty * 0.1, // Simplified volume calc
        qcRequirements: 'Standard 10% sample rate',
        expectedReceiptDate: this.calculateExpectedReceipt(result.outputs.recommendedOrderDate, result.inputs.leadTimeDays)
      },
      monitoringPlan: {
        reorderPoint: result.calculations.rop,
        nextReviewDate: this.calculateNextReviewDate(result.outputs.recommendedOrderDate),
        kpiTracking: ['inventory_turns', 'service_level', 'stockout_frequency']
      }
    };
  }

  /**
   * Helper methods
   */
  getZScore(serviceLevel) {
    const zScores = { 0.99: 2.33, 0.98: 2.05, 0.95: 1.65, 0.90: 1.28 };
    return zScores[serviceLevel] || 1.65;
  }

  calculateEOQ(annualDemand, orderingCost, holdingCostPerUnit) {
    return Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
  }

  assessConstraintSeverity(adjustment) {
    return adjustment.costImpact > 100 ? 'HIGH' : (adjustment.costImpact > 25 ? 'MEDIUM' : 'LOW');
  }

  explainRiskFlag(flag, result) {
    const riskExplanations = {
      'slow_mover': {
        description: 'Item has low demand velocity (<1 unit/week)',
        impact: 'Higher risk of obsolescence and carrying cost',
        mitigation: 'Consider reducing order quantities and increasing review frequency'
      },
      'high_variance': {
        description: 'Demand pattern is highly variable',
        impact: 'Increased forecast uncertainty and stockout risk',
        mitigation: 'Increase safety stock or improve demand forecasting'
      },
      'data_gaps': {
        description: 'Missing historical demand data affects accuracy',
        impact: 'Reduced confidence in optimization recommendations',
        mitigation: 'Improve data collection and consider conservative assumptions'
      },
      'new_item': {
        description: 'Limited demand history available (<6 months)',
        impact: 'Higher forecast uncertainty for new product',
        mitigation: 'Use conservative estimates and monitor closely'
      },
      'obsolete': {
        description: 'No recent demand but inventory remains',
        impact: 'Risk of inventory write-off',
        mitigation: 'Consider liquidation or promotional activity'
      }
    };

    return {
      flag,
      level: 'MEDIUM',
      ...riskExplanations[flag] || { description: 'Unknown risk factor' }
    };
  }

  calculateOverallRiskLevel(riskFactors) {
    const highRiskCount = riskFactors.filter(rf => rf.level === 'HIGH').length;
    const mediumRiskCount = riskFactors.filter(rf => rf.level === 'MEDIUM').length;
    
    if (highRiskCount > 0) return 'HIGH';
    if (mediumRiskCount > 2) return 'MEDIUM';
    return 'LOW';
  }

  calculateRiskScore(result) {
    let score = 0;
    score += result.outputs.expectedStockoutRiskPct; // 0-100
    score += result.riskFlags.length * 10; // 0-50+
    
    const cv = result.inputs.demandStdDaily / result.inputs.demandMeanDaily;
    score += cv * 20; // Variability impact
    
    return Math.min(100, Math.round(score));
  }

  calculateAlternativeScenario(baseResult, modifications) {
    // Simplified scenario calculation
    const newInputs = { ...baseResult.inputs, ...modifications };
    
    return {
      scenario: modifications.scenario,
      description: modifications.description,
      inputs: newInputs,
      estimatedOrderQty: baseResult.outputs.recommendedOrderQty * 1.1, // Simplified
      costImpact: modifications.serviceLevel ? 50 : -25, // Simplified
      riskImpact: modifications.serviceLevel ? -1 : 1 // Simplified
    };
  }

  findMostSensitiveParameter(sensitivities) {
    return sensitivities.reduce((most, current) => 
      current.sensitivity > most.sensitivity ? current : most
    );
  }

  calculateStabilityScore(sensitivities) {
    const avgSensitivity = sensitivities.reduce((sum, s) => sum + s.sensitivity, 0) / sensitivities.length;
    return Math.max(0, 100 - avgSensitivity * 10); // Higher score = more stable
  }

  performCostBenefitAnalysis(result) {
    const annualHoldingCost = result.outputs.projectedHoldingCost * 12;
    const annualOrderingCost = (result.inputs.demandMeanDaily * 365 / result.outputs.recommendedOrderQty) * 50;
    const stockoutCostAvoided = result.outputs.expectedStockoutRiskPct * result.inputs.unitCost * result.inputs.demandMeanDaily * 365 / 100;
    
    return {
      annualSavings: stockoutCostAvoided - annualHoldingCost - annualOrderingCost,
      paybackMonths: 3, // Simplified
      netPresentValue: 1000 // Simplified
    };
  }

  assessStrategicAlignment(result) {
    if (result.abcClass === 'A') {
      return 'HIGH - Critical item for revenue generation';
    } else if (result.abcClass === 'B') {
      return 'MEDIUM - Important for operational continuity';
    }
    return 'LOW - Standard inventory management approach';
  }

  assessComplianceRequirements(result) {
    const requirements = [];
    if (result.inputs.unitCost > 1000) {
      requirements.push('Requires manager approval for high-value orders');
    }
    return requirements.length > 0 ? requirements.join('; ') : 'Standard compliance requirements apply';
  }

  generateApprovalRecommendation(result) {
    const investment = result.outputs.recommendedOrderQty * result.inputs.unitCost;
    
    if (investment > 200000) {
      return 'CFO approval required for investment >£200K';
    } else if (investment > 50000) {
      return 'Director approval required for investment >£50K';
    } else if (investment > 10000) {
      return 'Manager approval required for investment >£10K';
    }
    return 'Planner approval sufficient';
  }

  assessUrgency(result) {
    if (result.outputs.expectedStockoutRiskPct > 10) {
      return 'HIGH - Order immediately to avoid stockout';
    } else if (result.outputs.expectedStockoutRiskPct > 5) {
      return 'MEDIUM - Order within 1-2 days';
    }
    return 'NORMAL - Order as scheduled';
  }

  identifySpecialRequirements(result) {
    const requirements = [];
    if (result.inputs.moq > result.calculations.eoq) {
      requirements.push(`MOQ constraint: minimum ${result.inputs.moq} units`);
    }
    if (result.inputs.lotSize > 0) {
      requirements.push(`Lot size constraint: multiples of ${result.inputs.lotSize}`);
    }
    return requirements;
  }

  calculateExpectedReceipt(orderDate, leadTimeDays) {
    const receiptDate = new Date(orderDate);
    receiptDate.setDate(receiptDate.getDate() + leadTimeDays);
    return receiptDate.toISOString().split('T')[0];
  }

  calculateNextReviewDate(orderDate) {
    const reviewDate = new Date(orderDate);
    reviewDate.setDate(reviewDate.getDate() + 30); // Monthly review
    return reviewDate.toISOString().split('T')[0];
  }

  /**
   * Store decision record for audit trail
   */
  storeDecisionRecord(skuId, explanation) {
    const record = {
      skuId,
      timestamp: new Date().toISOString(),
      explanation,
      userId: 'system', // In real implementation, capture actual user
      version: '1.0'
    };
    
    this.decisionHistory.set(`${skuId}_${Date.now()}`, record);
  }

  /**
   * Get decision history for SKU
   */
  getDecisionHistory(skuId, limit = 10) {
    const records = Array.from(this.decisionHistory.entries())
      .filter(([key, record]) => record.skuId === skuId)
      .map(([key, record]) => record)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    return records;
  }

  /**
   * Generate diagnostic report for optimization run
   */
  generateDiagnosticReport(optimizationResults) {
    const diagnostics = {
      runSummary: {
        timestamp: new Date().toISOString(),
        totalSKUs: optimizationResults.length,
        successfulOptimizations: optimizationResults.filter(r => !r.error).length,
        failedOptimizations: optimizationResults.filter(r => r.error).length
      },
      constraintAnalysis: this.analyzeConstraintEffects(optimizationResults),
      performanceMetrics: this.calculatePerformanceMetrics(optimizationResults),
      dataQualityAssessment: this.assessDataQuality(optimizationResults),
      recommendations: this.generateSystemRecommendations(optimizationResults)
    };
    
    return diagnostics;
  }

  analyzeConstraintEffects(results) {
    const constraintCounts = {};
    let totalCostImpact = 0;
    
    for (const result of results) {
      if (result.adjustments) {
        for (const adjustment of result.adjustments) {
          constraintCounts[adjustment.constraint] = (constraintCounts[adjustment.constraint] || 0) + 1;
          totalCostImpact += adjustment.costImpact || 0;
        }
      }
    }
    
    return {
      constraintFrequency: constraintCounts,
      totalCostImpact: Math.round(totalCostImpact),
      mostLimitingConstraint: Object.keys(constraintCounts).reduce((a, b) => 
        constraintCounts[a] > constraintCounts[b] ? a : b, ''
      )
    };
  }

  calculatePerformanceMetrics(results) {
    const validResults = results.filter(r => !r.error);
    
    return {
      avgProcessingTime: 50, // Simplified - would measure actual time
      avgStockoutRisk: validResults.reduce((sum, r) => sum + r.outputs.expectedStockoutRiskPct, 0) / validResults.length,
      totalInvestment: validResults.reduce((sum, r) => sum + (r.outputs.recommendedOrderQty * r.inputs.unitCost), 0),
      riskDistribution: this.calculateRiskDistribution(validResults)
    };
  }

  assessDataQuality(results) {
    const dataIssues = [];
    let highVarianceCount = 0;
    let missingDataCount = 0;
    
    for (const result of results) {
      if (result.riskFlags.includes('data_gaps')) {
        missingDataCount++;
      }
      if (result.riskFlags.includes('high_variance')) {
        highVarianceCount++;
      }
    }
    
    return {
      dataQualityScore: Math.max(0, 100 - (missingDataCount * 5) - (highVarianceCount * 2)),
      issues: {
        missingData: missingDataCount,
        highVariance: highVarianceCount
      },
      recommendations: dataIssues
    };
  }

  generateSystemRecommendations(results) {
    const recommendations = [];
    
    // Analyze patterns and suggest improvements
    const constraintAnalysis = this.analyzeConstraintEffects(results);
    if (constraintAnalysis.mostLimitingConstraint === 'moq_constraint') {
      recommendations.push('Consider negotiating lower MOQs with key suppliers');
    }
    
    const avgRisk = results.reduce((sum, r) => sum + (r.outputs?.expectedStockoutRiskPct || 0), 0) / results.length;
    if (avgRisk > 5) {
      recommendations.push('Review service level targets - current settings may be too aggressive');
    }
    
    return recommendations;
  }

  calculateRiskDistribution(results) {
    const lowRisk = results.filter(r => r.outputs.expectedStockoutRiskPct <= 2).length;
    const mediumRisk = results.filter(r => r.outputs.expectedStockoutRiskPct > 2 && r.outputs.expectedStockoutRiskPct <= 10).length;
    const highRisk = results.filter(r => r.outputs.expectedStockoutRiskPct > 10).length;
    
    return { lowRisk, mediumRisk, highRisk };
  }
}

export default new DiagnosticsService();