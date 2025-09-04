/**
 * Tests for OptimizationService
 * Comprehensive test suite for EOQ, safety stock, and constraint handling
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import OptimizationService from '../../services/optimization/OptimizationService.js';

describe('OptimizationService', () => {
  let mockSKU;
  let mockDemandHistory;

  beforeEach(() => {
    // Reset service state
    OptimizationService.clearCache();
    
    // Mock SKU data
    mockSKU = {
      skuId: 'SKU-TEST-001',
      annualDemand: 1200,
      demandMean: 3.28, // Daily demand mean (1200/365)
      demandStdDev: 1.2,
      leadTimeDays: 14,
      unitCost: 25.50,
      unitPrice: 35.00,
      holdingCostRate: 0.25,
      orderingCost: 50,
      moq: 100,
      lotSize: 50,
      serviceLevel: 0.98,
      currentInventory: 150
    };

    // Mock demand history
    mockDemandHistory = Array.from({ length: 52 }, (_, i) => ({
      week: i + 1,
      demand: Math.floor(Math.random() * 50) + 20,
      date: new Date(2024, 0, i * 7).toISOString().split('T')[0]
    }));
  });

  describe('EOQ Calculation', () => {
    it('should calculate EOQ correctly with standard parameters', () => {
      const eoq = OptimizationService.calculateEOQ(
        1200, // annual demand
        50,   // ordering cost
        0.25, // holding cost rate
        25.50 // unit cost
      );

      // Expected: sqrt(2 * 1200 * 50 / (0.25 * 25.50)) ≈ 137.2
      expect(eoq).toBeCloseTo(137.2, 1);
    });

    it('should handle zero demand gracefully', () => {
      const eoq = OptimizationService.calculateEOQ(0, 50, 0.25, 25.50);
      expect(eoq).toBe(0);
    });

    it('should handle very high demand', () => {
      const eoq = OptimizationService.calculateEOQ(100000, 50, 0.25, 25.50);
      expect(eoq).toBeGreaterThan(0);
      expect(isFinite(eoq)).toBe(true);
    });
  });

  describe('Safety Stock Calculation', () => {
    it('should calculate safety stock for 98% service level', () => {
      const safetyStock = OptimizationService.calculateSafetyStock(
        0.98, // service level
        1.2,  // demand std dev
        14    // lead time days
      );

      // Expected: 2.05 (z-score for 98%) * sqrt(14) * 1.2 ≈ 9.22
      expect(safetyStock).toBeCloseTo(9.22, 1);
    });

    it('should use correct z-scores for different service levels', () => {
      const ss99 = OptimizationService.calculateSafetyStock(0.99, 1.0, 14);
      const ss95 = OptimizationService.calculateSafetyStock(0.95, 1.0, 14);
      
      expect(ss99).toBeGreaterThan(ss95);
    });

    it('should handle zero standard deviation', () => {
      const safetyStock = OptimizationService.calculateSafetyStock(0.98, 0, 14);
      expect(safetyStock).toBe(0);
    });
  });

  describe('Reorder Point Calculation', () => {
    it('should calculate ROP correctly', () => {
      const rop = OptimizationService.calculateROP(3.28, 14, 10);
      
      // Expected: 3.28 * 14 + 10 = 45.92 + 10 = 55.92
      expect(rop).toBeCloseTo(55.92, 2);
    });

    it('should handle zero safety stock', () => {
      const rop = OptimizationService.calculateROP(3.28, 14, 0);
      expect(rop).toBeCloseTo(45.92, 2);
    });
  });

  describe('Lead Time Demand Statistics', () => {
    it('should calculate mean and sigma for fixed lead time', () => {
      const stats = OptimizationService.calculateLeadTimeDemandStats(
        3.28, // daily mean
        1.2,  // daily std dev
        14,   // lead time days
        0     // lead time std dev (fixed)
      );

      expect(stats.meanLT).toBeCloseTo(45.92, 2);
      expect(stats.sigmaLT).toBeCloseTo(4.49, 2); // sqrt(14) * 1.2
    });

    it('should handle variable lead times', () => {
      const stats = OptimizationService.calculateLeadTimeDemandStats(
        3.28, // daily mean
        1.2,  // daily std dev
        14,   // lead time days
        3     // lead time std dev (variable)
      );

      expect(stats.meanLT).toBeCloseTo(45.92, 2);
      expect(stats.sigmaLT).toBeGreaterThan(4.49); // Should be higher due to lead time variance
    });
  });

  describe('ABC Classification', () => {
    it('should classify SKUs into ABC categories', () => {
      const mockSKUs = [
        { skuId: 'SKU-001', annualDemand: 1000, unitPrice: 50 }, // Revenue: 50000
        { skuId: 'SKU-002', annualDemand: 500, unitPrice: 100 },  // Revenue: 50000
        { skuId: 'SKU-003', annualDemand: 200, unitPrice: 75 },   // Revenue: 15000
        { skuId: 'SKU-004', annualDemand: 100, unitPrice: 25 },   // Revenue: 2500
        { skuId: 'SKU-005', annualDemand: 50, unitPrice: 10 }     // Revenue: 500
      ];

      const classified = OptimizationService.classifyABC(mockSKUs);
      
      // Check that classification was applied
      expect(classified).toHaveLength(5);
      expect(classified.every(sku => sku.abcClass)).toBe(true);
      expect(classified.every(sku => sku.serviceLevel)).toBe(true);
      
      // Top items should be class A
      const topItems = classified.slice(0, 2);
      expect(topItems.every(sku => sku.abcClass === 'A')).toBe(true);
      expect(topItems.every(sku => sku.serviceLevel === 0.99)).toBe(true);
    });
  });

  describe('MOQ and Lot Size Constraints', () => {
    it('should apply MOQ constraint correctly', () => {
      const adjustedQty = OptimizationService.applyMOQConstraints(80, 100, 0);
      expect(adjustedQty).toBe(100);
    });

    it('should apply lot size constraint', () => {
      const adjustedQty = OptimizationService.applyMOQConstraints(130, 100, 50);
      expect(adjustedQty).toBe(150); // Rounded up to next lot size multiple
    });

    it('should handle zero order quantity', () => {
      const adjustedQty = OptimizationService.applyMOQConstraints(0, 100, 50);
      expect(adjustedQty).toBe(0);
    });
  });

  describe('Risk Flag Generation', () => {
    it('should identify slow movers', () => {
      const slowSKU = { ...mockSKU, annualDemand: 20 }; // Less than 1 per week
      const flags = OptimizationService.generateRiskFlags(slowSKU, mockDemandHistory);
      
      expect(flags).toContain('slow_mover');
    });

    it('should identify high variance items', () => {
      const highVarianceSKU = { 
        ...mockSKU, 
        demandMean: 10, 
        demandStdDev: 20 // CV = 2.0 > 1.5
      };
      const flags = OptimizationService.generateRiskFlags(highVarianceSKU, mockDemandHistory);
      
      expect(flags).toContain('high_variance');
    });

    it('should identify new items', () => {
      const shortHistory = mockDemandHistory.slice(0, 10); // Less than 26 weeks
      const flags = OptimizationService.generateRiskFlags(mockSKU, shortHistory);
      
      expect(flags).toContain('new_item');
    });

    it('should identify obsolete items', () => {
      const obsoleteDemandHistory = mockDemandHistory.map((item, index) => ({
        ...item,
        demand: index < 39 ? item.demand : 0 // No demand in last 13 weeks
      }));
      
      const obsoleteSKU = { ...mockSKU, currentInventory: 100 };
      const flags = OptimizationService.generateRiskFlags(obsoleteSKU, obsoleteDemandHistory);
      
      expect(flags).toContain('obsolete');
    });
  });

  describe('SKU Optimization', () => {
    it('should optimize SKU successfully with valid inputs', async () => {
      const result = await OptimizationService.optimizeSKU(mockSKU, {}, mockDemandHistory);
      
      expect(result).toHaveProperty('skuId', 'SKU-TEST-001');
      expect(result).toHaveProperty('inputs');
      expect(result).toHaveProperty('calculations');
      expect(result).toHaveProperty('outputs');
      expect(result).toHaveProperty('adjustments');
      expect(result).toHaveProperty('riskFlags');
      expect(result).toHaveProperty('timestamp');
      
      // Check calculations are reasonable
      expect(result.calculations.eoq).toBeGreaterThan(0);
      expect(result.calculations.safetyStock).toBeGreaterThanOrEqual(0);
      expect(result.calculations.rop).toBeGreaterThan(0);
      expect(result.outputs.recommendedOrderQty).toBeGreaterThanOrEqual(0);
    });

    it('should apply MOQ adjustments', async () => {
      const smallDemandSKU = { 
        ...mockSKU, 
        annualDemand: 200, // Will result in EOQ < MOQ
        moq: 100
      };
      
      const result = await OptimizationService.optimizeSKU(smallDemandSKU);
      
      expect(result.outputs.recommendedOrderQty).toBeGreaterThanOrEqual(100);
      expect(result.adjustments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            constraint: 'moq_constraint'
          })
        ])
      );
    });

    it('should calculate order date correctly', async () => {
      const result = await OptimizationService.optimizeSKU(mockSKU);
      
      expect(result.outputs.recommendedOrderDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Should be today if current inventory <= ROP
      const orderDate = new Date(result.outputs.recommendedOrderDate);
      const today = new Date();
      const daysDifference = Math.abs(orderDate - today) / (1000 * 60 * 60 * 24);
      
      expect(daysDifference).toBeLessThan(30); // Within reasonable range
    });
  });

  describe('Batch Optimization', () => {
    it('should optimize multiple SKUs successfully', async () => {
      const mockSKUs = [
        { ...mockSKU, skuId: 'SKU-001', annualDemand: 1000, unitPrice: 50 },
        { ...mockSKU, skuId: 'SKU-002', annualDemand: 500, unitPrice: 100 },
        { ...mockSKU, skuId: 'SKU-003', annualDemand: 200, unitPrice: 75 }
      ];
      
      const result = await OptimizationService.optimizeBatch(mockSKUs);
      
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('timestamp');
      expect(result.results).toHaveLength(3);
      
      // Check ABC classification was applied
      expect(result.results.every(r => r.abcClass)).toBe(true);
      
      // Check summary statistics
      expect(result.summary.totalSKUs).toBe(3);
      expect(result.summary.totalInvestment).toBeGreaterThan(0);
      expect(result.summary.avgStockoutRisk).toBeLessThan(100);
    });

    it('should apply global constraints', async () => {
      const mockSKUs = Array.from({ length: 5 }, (_, i) => ({
        ...mockSKU,
        skuId: `SKU-00${i + 1}`,
        annualDemand: 1000,
        unitPrice: 50
      }));
      
      const globalConstraints = {
        workingCapitalLimit: 5000, // Very low limit
        capacityLimit: 100
      };
      
      const result = await OptimizationService.optimizeBatch(mockSKUs, globalConstraints);
      
      // Some orders should be deferred due to constraints
      const deferredOrders = result.results.filter(r => r.outputs.orderDeferred);
      expect(deferredOrders.length).toBeGreaterThan(0);
    });
  });

  describe('Stockout Risk Calculation', () => {
    it('should calculate stockout risk correctly', () => {
      const risk = OptimizationService.calculateStockoutRisk(50, 45, 5);
      
      // ROP > mean, so risk should be low
      expect(risk).toBeLessThan(0.5);
      expect(risk).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero sigma correctly', () => {
      const risk = OptimizationService.calculateStockoutRisk(50, 45, 0);
      expect(risk).toBe(0);
    });

    it('should return higher risk when ROP < mean', () => {
      const risk = OptimizationService.calculateStockoutRisk(40, 45, 5);
      expect(risk).toBeGreaterThan(0.1);
    });
  });

  describe('Normal CDF and Error Function', () => {
    it('should calculate normal CDF correctly for standard values', () => {
      const cdf0 = OptimizationService.normalCDF(0);
      expect(cdf0).toBeCloseTo(0.5, 2);
      
      const cdf1 = OptimizationService.normalCDF(1);
      expect(cdf1).toBeCloseTo(0.8413, 2);
      
      const cdfNeg1 = OptimizationService.normalCDF(-1);
      expect(cdfNeg1).toBeCloseTo(0.1587, 2);
    });

    it('should calculate error function correctly', () => {
      const erf0 = OptimizationService.erf(0);
      expect(erf0).toBeCloseTo(0, 2);
      
      const erf1 = OptimizationService.erf(1);
      expect(erf1).toBeCloseTo(0.8427, 2);
      
      const erfNeg1 = OptimizationService.erf(-1);
      expect(erfNeg1).toBeCloseTo(-0.8427, 2);
    });
  });

  describe('Caching', () => {
    it('should cache and retrieve optimization results', async () => {
      const cacheKey = 'test-sku-cache-key';
      const mockResult = { skuId: 'TEST-001', result: 'cached' };
      
      // Set cache
      OptimizationService.setCachedResult(cacheKey, mockResult);
      
      // Retrieve cache
      const retrieved = OptimizationService.getCachedResult(cacheKey);
      expect(retrieved).toEqual(expect.objectContaining(mockResult));
      expect(retrieved.cachedAt).toBeDefined();
    });

    it('should clear cache correctly', async () => {
      const cacheKey = 'test-clear-cache';
      OptimizationService.setCachedResult(cacheKey, { test: 'data' });
      
      OptimizationService.clearCache();
      
      const retrieved = OptimizationService.getCachedResult(cacheKey);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields gracefully', async () => {
      const minimalSKU = {
        skuId: 'SKU-MINIMAL',
        annualDemand: 1000,
        demandMean: 2.74,
        demandStdDev: 1.0,
        leadTimeDays: 14,
        unitCost: 25,
        serviceLevel: 0.95
      };
      
      const result = await OptimizationService.optimizeSKU(minimalSKU);
      expect(result.skuId).toBe('SKU-MINIMAL');
    });

    it('should handle very small numbers', async () => {
      const microSKU = {
        ...mockSKU,
        annualDemand: 1,
        demandMean: 0.01,
        demandStdDev: 0.01,
        unitCost: 0.01
      };
      
      const result = await OptimizationService.optimizeSKU(microSKU);
      expect(result.outputs.recommendedOrderQty).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large numbers', async () => {
      const megaSKU = {
        ...mockSKU,
        annualDemand: 1000000,
        demandMean: 2740,
        demandStdDev: 500,
        unitCost: 1000
      };
      
      const result = await OptimizationService.optimizeSKU(megaSKU);
      expect(isFinite(result.outputs.recommendedOrderQty)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for missing SKU ID', async () => {
      const invalidSKU = { ...mockSKU };
      delete invalidSKU.skuId;
      
      await expect(OptimizationService.optimizeSKU(invalidSKU))
        .rejects.toThrow();
    });

    it('should throw error for invalid service level', async () => {
      const invalidSKU = { ...mockSKU, serviceLevel: 1.5 }; // > 1.0
      
      await expect(OptimizationService.optimizeSKU(invalidSKU))
        .rejects.toThrow();
    });

    it('should throw error for negative demand', async () => {
      const invalidSKU = { ...mockSKU, annualDemand: -100 };
      
      await expect(OptimizationService.optimizeSKU(invalidSKU))
        .rejects.toThrow();
    });
  });
});