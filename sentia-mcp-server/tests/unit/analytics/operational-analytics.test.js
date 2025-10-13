/**
 * Operational Analytics Test Suite
 * 
 * Comprehensive tests for the OperationalAnalytics class including:
 * - Production efficiency analysis
 * - OEE (Overall Equipment Effectiveness) calculations
 * - Inventory optimization
 * - Supply chain analytics
 * - Quality metrics tracking
 * - Performance KPI monitoring
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OperationalAnalytics } from '../../../src/utils/operational-analytics.js';

describe('OperationalAnalytics', () => {
  let operationalAnalytics;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      enableRealTimeTracking: true,
      enableOptimization: true,
      oeeTargets: {
        availability: 0.9,
        performance: 0.85,
        quality: 0.95,
        overall: 0.85
      },
      inventoryThresholds: {
        lowStock: 0.1,
        highStock: 0.9,
        optimalTurnover: 8
      }
    };

    operationalAnalytics = new OperationalAnalytics(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const analytics = new OperationalAnalytics();
      expect(analytics).toBeDefined();
      expect(analytics.config).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      expect(operationalAnalytics.config).toEqual(expect.objectContaining(mockConfig));
    });

    it('should initialize analytics components', () => {
      expect(operationalAnalytics.productionAnalyzer).toBeDefined();
      expect(operationalAnalytics.inventoryOptimizer).toBeDefined();
      expect(operationalAnalytics.qualityAnalyzer).toBeDefined();
      expect(operationalAnalytics.supplyChainAnalyzer).toBeDefined();
      expect(operationalAnalytics.oeeCalculator).toBeDefined();
    });
  });

  describe('OEE (Overall Equipment Effectiveness) calculations', () => {
    it('should calculate OEE for single equipment', async () => {
      const equipmentData = {
        equipmentId: 'PROD001',
        plannedProductionTime: 480, // 8 hours in minutes
        downtime: 60, // 1 hour downtime
        actualProduction: 95,
        targetProduction: 100,
        goodProduction: 90,
        defectiveProduction: 5
      };

      const oee = await operationalAnalytics.calculateEquipmentOEE(equipmentData);

      expect(oee).toBeDefined();
      expect(oee.equipmentId).toBe('PROD001');
      expect(oee.availability).toBeCloseTo(0.875, 3); // (480-60)/480
      expect(oee.performance).toBeCloseTo(0.95, 2); // 95/100
      expect(oee.quality).toBeCloseTo(0.947, 3); // 90/95
      expect(oee.overall).toBeCloseTo(0.785, 3); // 0.875 * 0.95 * 0.947
      expect(oee.lossAnalysis).toBeDefined();
    });

    it('should calculate plant-wide OEE', async () => {
      const plantData = {
        equipment: [
          {
            id: 'PROD001',
            plannedTime: 480,
            downtime: 30,
            actualProduction: 98,
            targetProduction: 100,
            goodProduction: 95
          },
          {
            id: 'PROD002',
            plannedTime: 480,
            downtime: 45,
            actualProduction: 92,
            targetProduction: 100,
            goodProduction: 88
          },
          {
            id: 'PROD003',
            plannedTime: 480,
            downtime: 20,
            actualProduction: 105,
            targetProduction: 100,
            goodProduction: 100
          }
        ]
      };

      const plantOEE = await operationalAnalytics.calculateOEE(plantData);

      expect(plantOEE).toBeDefined();
      expect(plantOEE.overall).toBeDefined();
      expect(plantOEE.overall).toBeGreaterThan(0);
      expect(plantOEE.overall).toBeLessThanOrEqual(1);
      expect(plantOEE.byEquipment).toBeDefined();
      expect(plantOEE.byEquipment.size).toBe(3);
      expect(plantOEE.averages).toBeDefined();
      expect(plantOEE.benchmarkComparison).toBeDefined();
    });

    it('should identify OEE improvement opportunities', async () => {
      const lowPerformanceData = {
        equipment: [
          {
            id: 'PROD001',
            plannedTime: 480,
            downtime: 120, // High downtime
            actualProduction: 70, // Low performance
            targetProduction: 100,
            goodProduction: 60 // High defect rate
          }
        ]
      };

      const analysis = await operationalAnalytics.analyzeOEEPerformance(lowPerformanceData);

      expect(analysis).toBeDefined();
      expect(analysis.improvementOpportunities).toBeDefined();
      expect(analysis.improvementOpportunities.length).toBeGreaterThan(0);
      
      const opportunities = analysis.improvementOpportunities;
      expect(opportunities.some(opp => opp.category === 'availability')).toBe(true);
      expect(opportunities.some(opp => opp.category === 'performance')).toBe(true);
      expect(opportunities.some(opp => opp.category === 'quality')).toBe(true);
    });

    it('should track OEE trends over time', async () => {
      const historicalOEE = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        availability: 0.85 + (Math.random() * 0.1),
        performance: 0.80 + (Math.random() * 0.15),
        quality: 0.90 + (Math.random() * 0.08),
        overall: null // Will be calculated
      }));

      historicalOEE.forEach(day => {
        day.overall = day.availability * day.performance * day.quality;
      });

      const trendAnalysis = await operationalAnalytics.analyzeOEETrends(historicalOEE);

      expect(trendAnalysis).toBeDefined();
      expect(trendAnalysis.trends).toBeDefined();
      expect(trendAnalysis.trends.availability).toBeDefined();
      expect(trendAnalysis.trends.performance).toBeDefined();
      expect(trendAnalysis.trends.quality).toBeDefined();
      expect(trendAnalysis.trends.overall).toBeDefined();
      expect(trendAnalysis.volatility).toBeDefined();
      expect(trendAnalysis.seasonality).toBeDefined();
    });
  });

  describe('inventory optimization', () => {
    it('should perform ABC analysis', async () => {
      const inventoryData = Array.from({ length: 100 }, (_, i) => ({
        sku: `SKU${String(i + 1).padStart(3, '0')}`,
        annualUsage: Math.floor(Math.random() * 10000) + 100,
        unitCost: Math.random() * 100 + 10,
        currentStock: Math.floor(Math.random() * 500) + 50,
        leadTime: Math.floor(Math.random() * 14) + 1
      }));

      const abcAnalysis = await operationalAnalytics.performABCAnalysis(inventoryData);

      expect(abcAnalysis).toBeDefined();
      expect(abcAnalysis.categories).toBeDefined();
      expect(abcAnalysis.categories.A).toBeDefined();
      expect(abcAnalysis.categories.B).toBeDefined();
      expect(abcAnalysis.categories.C).toBeDefined();

      // A items should be ~20% of items, ~80% of value
      expect(abcAnalysis.categories.A.items.length).toBeLessThan(25);
      expect(abcAnalysis.categories.A.valuePercentage).toBeGreaterThan(0.6);

      // Total items should equal input
      const totalItems = abcAnalysis.categories.A.items.length + 
                        abcAnalysis.categories.B.items.length + 
                        abcAnalysis.categories.C.items.length;
      expect(totalItems).toBe(100);
    });

    it('should perform XYZ analysis based on demand variability', async () => {
      const demandData = Array.from({ length: 50 }, (_, i) => {
        const baseDemand = Math.random() * 100 + 50;
        const variability = Math.random() * 0.5; // 0-50% variability
        
        return {
          sku: `SKU${String(i + 1).padStart(3, '0')}`,
          historicalDemand: Array.from({ length: 12 }, () => 
            baseDemand * (1 + (Math.random() - 0.5) * variability)
          )
        };
      });

      const xyzAnalysis = await operationalAnalytics.performXYZAnalysis(demandData);

      expect(xyzAnalysis).toBeDefined();
      expect(xyzAnalysis.categories).toBeDefined();
      expect(xyzAnalysis.categories.X).toBeDefined(); // Low variability
      expect(xyzAnalysis.categories.Y).toBeDefined(); // Medium variability
      expect(xyzAnalysis.categories.Z).toBeDefined(); // High variability

      xyzAnalysis.categories.X.items.forEach(item => {
        expect(item.coefficientOfVariation).toBeLessThan(0.2);
      });

      xyzAnalysis.categories.Z.items.forEach(item => {
        expect(item.coefficientOfVariation).toBeGreaterThan(0.5);
      });
    });

    it('should calculate optimal safety stock levels', async () => {
      const inventoryItem = {
        sku: 'SKU001',
        averageDemand: 100,
        demandStandardDeviation: 20,
        leadTime: 7,
        leadTimeVariability: 2,
        serviceLevel: 0.95,
        unitCost: 25
      };

      const safetyStock = await operationalAnalytics.calculateSafetyStock(inventoryItem);

      expect(safetyStock).toBeDefined();
      expect(safetyStock.sku).toBe('SKU001');
      expect(safetyStock.recommendedLevel).toBeGreaterThan(0);
      expect(safetyStock.reorderPoint).toBeDefined();
      expect(safetyStock.economicOrderQuantity).toBeDefined();
      expect(safetyStock.totalAnnualCost).toBeDefined();
      expect(safetyStock.stockoutRisk).toBeDefined();
    });

    it('should identify slow-moving and obsolete inventory', async () => {
      const inventoryData = [
        {
          sku: 'SKU001',
          lastMovement: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          currentStock: 100,
          averageMonthlyUsage: 50,
          unitCost: 25
        },
        {
          sku: 'SKU002',
          lastMovement: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
          currentStock: 200,
          averageMonthlyUsage: 5,
          unitCost: 15
        },
        {
          sku: 'SKU003',
          lastMovement: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
          currentStock: 150,
          averageMonthlyUsage: 0,
          unitCost: 30
        }
      ];

      const analysis = await operationalAnalytics.identifySlowMovingInventory(inventoryData, {
        slowMovingThreshold: 90, // days
        obsoleteThreshold: 180 // days
      });

      expect(analysis).toBeDefined();
      expect(analysis.slowMoving).toBeDefined();
      expect(analysis.obsolete).toBeDefined();
      expect(analysis.slowMoving.some(item => item.sku === 'SKU002')).toBe(true);
      expect(analysis.obsolete.some(item => item.sku === 'SKU003')).toBe(true);
      expect(analysis.totalValueAtRisk).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });

    it('should optimize inventory turnover', async () => {
      const inventoryData = Array.from({ length: 20 }, (_, i) => ({
        sku: `SKU${String(i + 1).padStart(3, '0')}`,
        averageInventory: Math.random() * 1000 + 100,
        costOfGoodsSold: Math.random() * 10000 + 1000,
        leadTime: Math.floor(Math.random() * 14) + 1,
        demandVariability: Math.random() * 0.5,
        unitCost: Math.random() * 50 + 5
      }));

      const optimization = await operationalAnalytics.optimizeInventoryTurnover(inventoryData, {
        targetTurnover: 8,
        minimumServiceLevel: 0.95
      });

      expect(optimization).toBeDefined();
      expect(optimization.currentTurnover).toBeDefined();
      expect(optimization.optimizedLevels).toBeDefined();
      expect(optimization.potentialSavings).toBeDefined();
      expect(optimization.riskAssessment).toBeDefined();
      
      optimization.optimizedLevels.forEach(item => {
        expect(item.sku).toBeDefined();
        expect(item.currentLevel).toBeDefined();
        expect(item.optimizedLevel).toBeDefined();
        expect(item.turnoverImprovement).toBeDefined();
      });
    });
  });

  describe('production efficiency analysis', () => {
    it('should analyze production line efficiency', async () => {
      const productionData = {
        lineId: 'LINE001',
        shifts: [
          {
            shiftId: 'SHIFT001',
            startTime: '2024-01-01T06:00:00Z',
            endTime: '2024-01-01T14:00:00Z',
            plannedOutput: 1000,
            actualOutput: 950,
            defects: 25,
            downtimeMinutes: 30
          },
          {
            shiftId: 'SHIFT002',
            startTime: '2024-01-01T14:00:00Z',
            endTime: '2024-01-01T22:00:00Z',
            plannedOutput: 1000,
            actualOutput: 980,
            defects: 15,
            downtimeMinutes: 20
          }
        ]
      };

      const efficiency = await operationalAnalytics.analyzeProductionEfficiency(productionData);

      expect(efficiency).toBeDefined();
      expect(efficiency.lineId).toBe('LINE001');
      expect(efficiency.overallEfficiency).toBeDefined();
      expect(efficiency.throughputEfficiency).toBeDefined();
      expect(efficiency.qualityRate).toBeDefined();
      expect(efficiency.utilizationRate).toBeDefined();
      expect(efficiency.shiftComparison).toBeDefined();
      expect(efficiency.bottleneckAnalysis).toBeDefined();
    });

    it('should identify production bottlenecks', async () => {
      const processData = [
        { station: 'STATION001', cycleTime: 60, capacity: 100 },
        { station: 'STATION002', cycleTime: 90, capacity: 80 }, // Bottleneck
        { station: 'STATION003', cycleTime: 45, capacity: 120 },
        { station: 'STATION004', cycleTime: 75, capacity: 95 }
      ];

      const bottleneckAnalysis = await operationalAnalytics.identifyBottlenecks(processData);

      expect(bottleneckAnalysis).toBeDefined();
      expect(bottleneckAnalysis.primaryBottleneck).toBe('STATION002');
      expect(bottleneckAnalysis.bottleneckImpact).toBeDefined();
      expect(bottleneckAnalysis.capacityUtilization).toBeDefined();
      expect(bottleneckAnalysis.improvementOpportunities).toBeDefined();
      expect(bottleneckAnalysis.whatIfScenarios).toBeDefined();
    });

    it('should calculate production lead times', async () => {
      const orderData = Array.from({ length: 50 }, (_, i) => ({
        orderId: `ORDER${String(i + 1).padStart(3, '0')}`,
        orderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        startProductionDate: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000),
        completionDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
        productType: `PRODUCT${Math.floor(Math.random() * 5) + 1}`,
        quantity: Math.floor(Math.random() * 500) + 100
      }));

      const leadTimeAnalysis = await operationalAnalytics.analyzeLeadTimes(orderData);

      expect(leadTimeAnalysis).toBeDefined();
      expect(leadTimeAnalysis.averageLeadTime).toBeDefined();
      expect(leadTimeAnalysis.medianLeadTime).toBeDefined();
      expect(leadTimeAnalysis.leadTimeVariability).toBeDefined();
      expect(leadTimeAnalysis.byProductType).toBeDefined();
      expect(leadTimeAnalysis.trends).toBeDefined();
      expect(leadTimeAnalysis.performanceMetrics).toBeDefined();
    });
  });

  describe('quality metrics and analysis', () => {
    it('should calculate quality control metrics', async () => {
      const qualityData = {
        inspections: Array.from({ length: 100 }, (_, i) => ({
          inspectionId: `INS${String(i + 1).padStart(3, '0')}`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          productType: `PRODUCT${Math.floor(Math.random() * 3) + 1}`,
          quantityInspected: Math.floor(Math.random() * 100) + 50,
          defectsFound: Math.floor(Math.random() * 5),
          defectTypes: ['dimensional', 'surface', 'functional'].slice(0, Math.floor(Math.random() * 3) + 1)
        }))
      };

      const qualityMetrics = await operationalAnalytics.calculateQualityMetrics(qualityData);

      expect(qualityMetrics).toBeDefined();
      expect(qualityMetrics.overallDefectRate).toBeDefined();
      expect(qualityMetrics.firstPassYield).toBeDefined();
      expect(qualityMetrics.defectsByType).toBeDefined();
      expect(qualityMetrics.defectsByProduct).toBeDefined();
      expect(qualityMetrics.qualityTrends).toBeDefined();
      expect(qualityMetrics.statisticalProcessControl).toBeDefined();
    });

    it('should perform statistical process control (SPC) analysis', async () => {
      const processData = Array.from({ length: 50 }, (_, i) => ({
        sampleId: i + 1,
        measurement: 100 + (Math.random() - 0.5) * 10, // Normal variation around 100
        timestamp: new Date(Date.now() - (49 - i) * 60 * 60 * 1000) // Hourly samples
      }));

      // Add some out-of-control points
      processData[25].measurement = 120; // Out of upper control limit
      processData[35].measurement = 80;  // Out of lower control limit

      const spcAnalysis = await operationalAnalytics.performSPCAnalysis(processData, {
        targetValue: 100,
        tolerance: 5,
        controlLimits: 3 // 3-sigma
      });

      expect(spcAnalysis).toBeDefined();
      expect(spcAnalysis.controlLimits).toBeDefined();
      expect(spcAnalysis.controlLimits.upper).toBeDefined();
      expect(spcAnalysis.controlLimits.lower).toBeDefined();
      expect(spcAnalysis.outOfControlPoints).toBeDefined();
      expect(spcAnalysis.outOfControlPoints.length).toBeGreaterThan(0);
      expect(spcAnalysis.processCapability).toBeDefined();
      expect(spcAnalysis.trends).toBeDefined();
    });

    it('should identify quality improvement opportunities', async () => {
      const qualityIssues = [
        {
          defectType: 'dimensional',
          frequency: 45,
          cost: 15000,
          rootCauses: ['machine calibration', 'operator error']
        },
        {
          defectType: 'surface',
          frequency: 30,
          cost: 8000,
          rootCauses: ['material quality', 'environmental conditions']
        },
        {
          defectType: 'functional',
          frequency: 25,
          cost: 12000,
          rootCauses: ['design issue', 'assembly error']
        }
      ];

      const improvement = await operationalAnalytics.identifyQualityImprovements(qualityIssues);

      expect(improvement).toBeDefined();
      expect(improvement.prioritizedIssues).toBeDefined();
      expect(improvement.prioritizedIssues[0].defectType).toBe('dimensional'); // Highest impact
      expect(improvement.rootCauseAnalysis).toBeDefined();
      expect(improvement.improvementActions).toBeDefined();
      expect(improvement.costBenefitAnalysis).toBeDefined();
    });
  });

  describe('supply chain analytics', () => {
    it('should analyze supplier performance', async () => {
      const supplierData = [
        {
          supplierId: 'SUPP001',
          deliveries: Array.from({ length: 20 }, (_, i) => ({
            deliveryId: `DEL${i + 1}`,
            plannedDate: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000),
            actualDate: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000 + Math.random() * 2 * 24 * 60 * 60 * 1000),
            quantityOrdered: 1000,
            quantityDelivered: 980 + Math.random() * 40,
            qualityScore: 0.9 + Math.random() * 0.1
          }))
        }
      ];

      const supplierAnalysis = await operationalAnalytics.analyzeSupplierPerformance(supplierData);

      expect(supplierAnalysis).toBeDefined();
      expect(supplierAnalysis.length).toBe(1);
      
      const supplier = supplierAnalysis[0];
      expect(supplier.supplierId).toBe('SUPP001');
      expect(supplier.onTimeDeliveryRate).toBeDefined();
      expect(supplier.quantityAccuracy).toBeDefined();
      expect(supplier.averageQualityScore).toBeDefined();
      expect(supplier.leadTimeVariability).toBeDefined();
      expect(supplier.performanceRating).toBeDefined();
    });

    it('should optimize procurement strategies', async () => {
      const procurementData = {
        materials: [
          {
            materialId: 'MAT001',
            annualDemand: 10000,
            unitCost: 25,
            orderingCost: 150,
            holdingCostRate: 0.2,
            leadTime: 14,
            suppliers: ['SUPP001', 'SUPP002']
          },
          {
            materialId: 'MAT002',
            annualDemand: 5000,
            unitCost: 45,
            orderingCost: 200,
            holdingCostRate: 0.25,
            leadTime: 21,
            suppliers: ['SUPP002', 'SUPP003']
          }
        ]
      };

      const optimization = await operationalAnalytics.optimizeProcurement(procurementData);

      expect(optimization).toBeDefined();
      expect(optimization.materials).toBeDefined();
      
      optimization.materials.forEach(material => {
        expect(material.materialId).toBeDefined();
        expect(material.economicOrderQuantity).toBeDefined();
        expect(material.reorderPoint).toBeDefined();
        expect(material.totalAnnualCost).toBeDefined();
        expect(material.recommendedSupplier).toBeDefined();
      });

      expect(optimization.totalCostSavings).toBeDefined();
      expect(optimization.recommendations).toBeDefined();
    });

    it('should assess supply chain risks', async () => {
      const supplyChainData = {
        suppliers: [
          {
            id: 'SUPP001',
            location: 'China',
            criticality: 'high',
            alternativeSuppliers: 1,
            financialStability: 0.8,
            geopoliticalRisk: 0.6
          },
          {
            id: 'SUPP002',
            location: 'Germany',
            criticality: 'medium',
            alternativeSuppliers: 3,
            financialStability: 0.95,
            geopoliticalRisk: 0.1
          }
        ],
        materials: [
          {
            id: 'MAT001',
            singleSourced: true,
            strategicImportance: 'critical',
            bufferStock: 30 // days
          }
        ]
      };

      const riskAssessment = await operationalAnalytics.assessSupplyChainRisks(supplyChainData);

      expect(riskAssessment).toBeDefined();
      expect(riskAssessment.overallRiskScore).toBeDefined();
      expect(riskAssessment.riskFactors).toBeDefined();
      expect(riskAssessment.highRiskSuppliers).toBeDefined();
      expect(riskAssessment.criticalMaterials).toBeDefined();
      expect(riskAssessment.mitigationStrategies).toBeDefined();
    });
  });

  describe('insights generation', () => {
    it('should generate operational insights', async () => {
      const operationalData = {
        production: {
          oee: 0.75, // Below target
          throughput: 950,
          defectRate: 0.03
        },
        inventory: {
          turnover: 6.2, // Below target
          stockouts: 5,
          excessInventory: 150000
        },
        quality: {
          firstPassYield: 0.92,
          customerComplaints: 8,
          reworkCosts: 25000
        }
      };

      const insights = await operationalAnalytics.generateInsights(operationalData, {
        priority: 'high',
        includeRecommendations: true
      });

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);

      insights.forEach(insight => {
        expect(insight.id).toBeDefined();
        expect(insight.type).toBeDefined();
        expect(insight.category).toBe('operational');
        expect(insight.priority).toBeDefined();
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.impact).toBeDefined();
        expect(insight.confidence).toBeGreaterThan(0);
        expect(insight.actionable).toBeDefined();
      });

      // Should identify OEE issue as high priority
      const oeeInsight = insights.find(i => i.title.toLowerCase().includes('oee'));
      expect(oeeInsight).toBeDefined();
      expect(['high', 'critical']).toContain(oeeInsight.priority);
    });

    it('should prioritize insights by impact and urgency', async () => {
      const criticalData = {
        production: {
          oee: 0.45, // Critically low
          machineDowntime: 8, // hours
          safetyIncidents: 2
        },
        inventory: {
          stockouts: 15, // Critical stockouts
          obsoleteValue: 500000
        }
      };

      const insights = await operationalAnalytics.generateInsights(criticalData);

      const criticalInsights = insights.filter(i => i.priority === 'critical');
      const highInsights = insights.filter(i => i.priority === 'high');

      expect(criticalInsights.length).toBeGreaterThan(0);
      expect(highInsights.length).toBeGreaterThan(0);

      // Safety incidents should be critical priority
      const safetyInsight = insights.find(i => i.title.toLowerCase().includes('safety'));
      if (safetyInsight) {
        expect(safetyInsight.priority).toBe('critical');
      }
    });
  });

  describe('error handling and validation', () => {
    it('should handle missing operational data', async () => {
      const incompleteData = {
        production: { oee: 0.75 }
        // Missing inventory and quality data
      };

      const analysis = await operationalAnalytics.analyzeOperationalData(incompleteData);

      expect(analysis).toBeDefined();
      expect(analysis.warnings).toBeDefined();
      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.completeness).toBeLessThan(1.0);
    });

    it('should validate OEE calculation inputs', async () => {
      const invalidData = {
        plannedProductionTime: -480, // Negative time
        downtime: 600, // Downtime > planned time
        actualProduction: -50 // Negative production
      };

      await expect(operationalAnalytics.calculateEquipmentOEE(invalidData))
        .rejects.toThrow('Invalid OEE calculation data');
    });

    it('should handle equipment data inconsistencies', async () => {
      const inconsistentData = {
        equipment: [
          {
            id: 'PROD001',
            plannedTime: 480,
            downtime: 30,
            actualProduction: 150, // > target
            targetProduction: 100,
            goodProduction: 160 // > actual production (impossible)
          }
        ]
      };

      const analysis = await operationalAnalytics.analyzeOperationalData(inconsistentData, {
        validateConsistency: true
      });

      expect(analysis.dataValidation).toBeDefined();
      expect(analysis.dataValidation.errors).toBeDefined();
      expect(analysis.dataValidation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('performance and optimization', () => {
    it('should handle large operational datasets efficiently', async () => {
      const largeDataset = {
        production: {
          equipment: Array.from({ length: 100 }, (_, i) => ({
            id: `PROD${String(i + 1).padStart(3, '0')}`,
            plannedTime: 480,
            downtime: Math.random() * 60,
            actualProduction: Math.random() * 200 + 50,
            targetProduction: 100
          }))
        }
      };

      const startTime = Date.now();
      const analysis = await operationalAnalytics.analyzeOperationalData(largeDataset, {
        enableParallelProcessing: true
      });
      const duration = Date.now() - startTime;

      expect(analysis).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(analysis.performance).toBeDefined();
      expect(analysis.performance.equipmentCount).toBe(100);
    });

    it('should cache complex calculations', async () => {
      const productionData = {
        equipment: Array.from({ length: 50 }, (_, i) => ({
          id: `PROD${String(i + 1).padStart(3, '0')}`,
          plannedTime: 480,
          downtime: Math.random() * 60,
          actualProduction: Math.random() * 200 + 50,
          targetProduction: 100
        }))
      };

      const cacheKey = 'oee-calculation-test';

      // First calculation should cache results
      const result1 = await operationalAnalytics.calculateOEE(productionData, {
        cacheKey,
        enableCaching: true
      });

      // Second calculation should use cache
      const result2 = await operationalAnalytics.calculateOEE(productionData, {
        cacheKey,
        enableCaching: true
      });

      expect(result2.fromCache).toBe(true);
      expect(result1.overall).toBe(result2.overall);
    });
  });
});