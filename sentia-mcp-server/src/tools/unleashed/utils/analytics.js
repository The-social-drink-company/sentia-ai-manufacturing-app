/**
 * Unleashed Analytics Utility
 * 
 * Manufacturing intelligence and analytics for Unleashed ERP data.
 * Provides advanced analytics, KPI calculations, and business insights.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class UnleashedAnalytics {
  constructor() {
    this.isInitialized = false;
    this.metrics = new Map();
    this.trends = new Map();
    this.benchmarks = new Map();
    
    logger.info('Unleashed Analytics utility initialized');
  }

  async initialize() {
    try {
      logger.info('Initializing Unleashed Analytics...');
      
      this.loadBenchmarks();
      this.initializeMetrics();
      
      this.isInitialized = true;
      logger.info('Unleashed Analytics initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize Analytics', { error: error.message });
      throw error;
    }
  }

  loadBenchmarks() {
    // Manufacturing industry benchmarks
    this.benchmarks.set('inventory_turnover', { target: 12, good: 8, poor: 4 });
    this.benchmarks.set('on_time_delivery', { target: 95, good: 90, poor: 80 });
    this.benchmarks.set('quality_rating', { target: 4.5, good: 4.0, poor: 3.0 });
    this.benchmarks.set('lead_time_variance', { target: 5, good: 10, poor: 20 });
    this.benchmarks.set('cost_variance', { target: 2, good: 5, poor: 10 });
    this.benchmarks.set('capacity_utilization', { target: 85, good: 75, poor: 60 });
    
    logger.info('Manufacturing benchmarks loaded');
  }

  initializeMetrics() {
    this.metrics.set('production_efficiency', 0);
    this.metrics.set('inventory_performance', 0);
    this.metrics.set('supplier_performance', 0);
    this.metrics.set('customer_satisfaction', 0);
    this.metrics.set('financial_performance', 0);
    
    logger.info('Metrics framework initialized');
  }

  calculateProductionAnalytics(productionOrders) {
    try {
      const completedOrders = productionOrders.filter(o => o.status === 'Completed');
      const inProgressOrders = productionOrders.filter(o => o.status === 'InProgress');
      
      const analytics = {
        overallEfficiency: this.calculateOverallEfficiency(productionOrders),
        capacityUtilization: this.calculateCapacityUtilization(productionOrders),
        schedulePerformance: this.calculateSchedulePerformance(completedOrders),
        costPerformance: this.calculateCostPerformance(completedOrders),
        qualityMetrics: this.calculateQualityMetrics(completedOrders),
        wipAnalysis: this.analyzeWIP(inProgressOrders),
        bottleneckAnalysis: this.identifyBottlenecks(productionOrders),
        recommendations: this.generateProductionRecommendations(productionOrders)
      };

      logger.debug('Production analytics calculated', {
        ordersAnalyzed: productionOrders.length,
        overallEfficiency: analytics.overallEfficiency
      });

      return analytics;

    } catch (error) {
      logger.error('Production analytics calculation failed', { error: error.message });
      throw error;
    }
  }

  calculateInventoryAnalytics(inventoryData) {
    try {
      const analytics = {
        turnoverAnalysis: this.calculateTurnoverAnalysis(inventoryData),
        stockLevelOptimization: this.analyzeStockLevels(inventoryData),
        valuationAnalysis: this.analyzeInventoryValuation(inventoryData),
        abcAnalysis: this.performABCAnalysis(inventoryData),
        riskAssessment: this.assessInventoryRisks(inventoryData),
        seasonalityAnalysis: this.analyzeSeasonality(inventoryData),
        recommendations: this.generateInventoryRecommendations(inventoryData)
      };

      logger.debug('Inventory analytics calculated', {
        itemsAnalyzed: inventoryData.length,
        totalValue: analytics.valuationAnalysis.totalValue
      });

      return analytics;

    } catch (error) {
      logger.error('Inventory analytics calculation failed', { error: error.message });
      throw error;
    }
  }

  calculateSupplierAnalytics(suppliers, purchaseOrders) {
    try {
      const analytics = {
        performanceScoring: this.scoreSupplierPerformance(suppliers),
        deliveryAnalysis: this.analyzeDeliveryPerformance(purchaseOrders),
        costAnalysis: this.analyzeProcurementCosts(purchaseOrders),
        qualityAssessment: this.assessSupplierQuality(suppliers),
        riskEvaluation: this.evaluateSupplierRisks(suppliers),
        diversificationAnalysis: this.analyzeSupplierDiversification(suppliers),
        recommendations: this.generateSupplierRecommendations(suppliers, purchaseOrders)
      };

      logger.debug('Supplier analytics calculated', {
        suppliersAnalyzed: suppliers.length,
        ordersAnalyzed: purchaseOrders.length
      });

      return analytics;

    } catch (error) {
      logger.error('Supplier analytics calculation failed', { error: error.message });
      throw error;
    }
  }

  calculateCustomerAnalytics(customers, salesOrders) {
    try {
      const analytics = {
        segmentationAnalysis: this.analyzeCustomerSegmentation(customers),
        profitabilityAnalysis: this.analyzeCustomerProfitability(customers),
        loyaltyAnalysis: this.analyzeCustomerLoyalty(customers, salesOrders),
        churnRiskAssessment: this.assessChurnRisk(customers),
        growthOpportunities: this.identifyGrowthOpportunities(customers, salesOrders),
        geographicAnalysis: this.analyzeGeographicDistribution(customers),
        recommendations: this.generateCustomerRecommendations(customers, salesOrders)
      };

      logger.debug('Customer analytics calculated', {
        customersAnalyzed: customers.length,
        ordersAnalyzed: salesOrders.length
      });

      return analytics;

    } catch (error) {
      logger.error('Customer analytics calculation failed', { error: error.message });
      throw error;
    }
  }

  // Production Analytics Methods
  calculateOverallEfficiency(orders) {
    const efficiencyScores = orders
      .filter(o => o.efficiency && o.efficiency.overallEfficiency > 0)
      .map(o => o.efficiency.overallEfficiency);
    
    return efficiencyScores.length > 0 ? 
      efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length : 0;
  }

  calculateCapacityUtilization(orders) {
    const activeOrders = orders.filter(o => o.status === 'InProgress');
    const totalCapacity = 100; // Assume 100% capacity
    const currentUtilization = (activeOrders.length / orders.length) * 100;
    
    return Math.min(currentUtilization, totalCapacity);
  }

  calculateSchedulePerformance(completedOrders) {
    const onTimeOrders = completedOrders.filter(o => 
      !o.plannedEndDate || !o.actualEndDate || 
      new Date(o.actualEndDate) <= new Date(o.plannedEndDate)
    );
    
    return completedOrders.length > 0 ? 
      (onTimeOrders.length / completedOrders.length) * 100 : 0;
  }

  calculateCostPerformance(orders) {
    const ordersWithCosts = orders.filter(o => o.estimatedCost > 0 && o.actualCost > 0);
    const costVariances = ordersWithCosts.map(o => 
      ((o.actualCost - o.estimatedCost) / o.estimatedCost) * 100
    );
    
    return costVariances.length > 0 ? 
      costVariances.reduce((sum, variance) => sum + Math.abs(variance), 0) / costVariances.length : 0;
  }

  // Inventory Analytics Methods
  calculateTurnoverAnalysis(inventory) {
    const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
    const avgInventoryValue = totalValue / (inventory.length || 1);
    
    // Simplified turnover calculation
    const estimatedTurnover = inventory.length > 0 ? 12 : 0; // Monthly turnover assumption
    
    return {
      turnoverRate: estimatedTurnover,
      totalValue,
      avgInventoryValue,
      performance: this.benchmarkAgainst('inventory_turnover', estimatedTurnover)
    };
  }

  performABCAnalysis(inventory) {
    const sorted = inventory.sort((a, b) => b.totalValue - a.totalValue);
    const totalValue = sorted.reduce((sum, item) => sum + item.totalValue, 0);
    
    let runningValue = 0;
    const classification = sorted.map(item => {
      runningValue += item.totalValue;
      const percentage = runningValue / totalValue;
      
      if (percentage <= 0.8) return 'A';
      if (percentage <= 0.95) return 'B';
      return 'C';
    });

    return {
      A: classification.filter(c => c === 'A').length,
      B: classification.filter(c => c === 'B').length,
      C: classification.filter(c => c === 'C').length,
      totalItems: inventory.length
    };
  }

  // Supplier Analytics Methods
  scoreSupplierPerformance(suppliers) {
    return suppliers.map(supplier => {
      const perf = supplier.performance || {};
      const scores = {
        delivery: perf.onTimeDeliveryRate || 0,
        quality: (perf.qualityRating || 0) * 20, // Convert to percentage
        cost: perf.costPerformance || 0,
        overall: perf.overallRating ? perf.overallRating * 20 : 0
      };
      
      const weightedScore = (scores.delivery * 0.3) + (scores.quality * 0.3) + 
                           (scores.cost * 0.2) + (scores.overall * 0.2);
      
      return {
        supplierCode: supplier.supplierCode,
        supplierName: supplier.supplierName,
        scores,
        weightedScore,
        grade: this.assignGrade(weightedScore)
      };
    });
  }

  // Customer Analytics Methods
  analyzeCustomerSegmentation(customers) {
    const segments = {
      premium: customers.filter(c => c.analytics.valueSegment === 'premium'),
      preferred: customers.filter(c => c.analytics.valueSegment === 'preferred'),
      standard: customers.filter(c => c.analytics.valueSegment === 'standard')
    };

    return {
      segmentCounts: {
        premium: segments.premium.length,
        preferred: segments.preferred.length,
        standard: segments.standard.length
      },
      revenueBySegment: {
        premium: segments.premium.reduce((sum, c) => sum + (c.profitability.totalRevenue || 0), 0),
        preferred: segments.preferred.reduce((sum, c) => sum + (c.profitability.totalRevenue || 0), 0),
        standard: segments.standard.reduce((sum, c) => sum + (c.profitability.totalRevenue || 0), 0)
      }
    };
  }

  // Utility Methods
  benchmarkAgainst(metric, value) {
    const benchmark = this.benchmarks.get(metric);
    if (!benchmark) return 'unknown';
    
    if (value >= benchmark.target) return 'excellent';
    if (value >= benchmark.good) return 'good';
    if (value >= benchmark.poor) return 'poor';
    return 'critical';
  }

  assignGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  identifyBottlenecks(orders) {
    const bottlenecks = [];
    
    const overdueOrders = orders.filter(o => 
      o.plannedEndDate && new Date(o.plannedEndDate) < new Date() && o.status !== 'Completed'
    );
    
    if (overdueOrders.length > 0) {
      bottlenecks.push({
        type: 'schedule_delays',
        count: overdueOrders.length,
        impact: 'high',
        description: 'Orders behind scheduled completion'
      });
    }

    return bottlenecks;
  }

  generateProductionRecommendations(orders) {
    const recommendations = [];
    
    const efficiency = this.calculateOverallEfficiency(orders);
    if (efficiency < 80) {
      recommendations.push({
        priority: 'high',
        category: 'efficiency',
        title: 'Improve Production Efficiency',
        description: `Current efficiency at ${efficiency.toFixed(1)}%. Target: 85%+`,
        actions: ['Review resource allocation', 'Optimize production schedules', 'Reduce setup times']
      });
    }

    return recommendations;
  }

  generateInventoryRecommendations(inventory) {
    const recommendations = [];
    
    const lowStockItems = inventory.filter(item => item.isLowStock).length;
    if (lowStockItems > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'stock_levels',
        title: 'Address Low Stock Items',
        description: `${lowStockItems} items below reorder level`,
        actions: ['Review reorder points', 'Place urgent purchase orders', 'Update demand forecasts']
      });
    }

    return recommendations;
  }

  generateSupplierRecommendations(suppliers, orders) {
    const recommendations = [];
    
    const poorPerformers = suppliers.filter(s => 
      s.performance.overallRating && s.performance.overallRating < 3.5
    ).length;
    
    if (poorPerformers > 0) {
      recommendations.push({
        priority: 'high',
        category: 'supplier_performance',
        title: 'Address Supplier Performance Issues',
        description: `${poorPerformers} suppliers below performance standards`,
        actions: ['Conduct supplier reviews', 'Implement improvement plans', 'Consider alternative suppliers']
      });
    }

    return recommendations;
  }

  generateCustomerRecommendations(customers, orders) {
    const recommendations = [];
    
    const highValueCustomers = customers.filter(c => c.analytics.valueSegment === 'premium').length;
    const totalCustomers = customers.length;
    
    if (highValueCustomers / totalCustomers < 0.2) {
      recommendations.push({
        priority: 'medium',
        category: 'customer_growth',
        title: 'Develop Premium Customer Base',
        description: 'Low percentage of premium customers',
        actions: ['Implement customer development programs', 'Enhance value propositions', 'Focus on customer retention']
      });
    }

    return recommendations;
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      metricsLoaded: this.metrics.size,
      benchmarksLoaded: this.benchmarks.size,
      trendsTracked: this.trends.size
    };
  }

  async cleanup() {
    try {
      logger.info('Cleaning up Analytics...');
      
      this.metrics.clear();
      this.trends.clear();
      this.benchmarks.clear();
      this.isInitialized = false;
      
      logger.info('Analytics cleanup completed');
      
    } catch (error) {
      logger.error('Error during Analytics cleanup', { error: error.message });
    }
  }
}