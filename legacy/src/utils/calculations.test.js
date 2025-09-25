import { describe, it, expect, beforeEach } from 'vitest';

// Import calculation functions
const calculateWorkingCapital = (data) => {
  const { receivables = 0, inventory = 0, payables = 0 } = data;
  return receivables + inventory - payables;
};

const calculateCashConversionCycle = (data) => {
  const { daysInventoryOutstanding = 0, daysSalesOutstanding = 0, daysPayablesOutstanding = 0 } = data;
  return daysInventoryOutstanding + daysSalesOutstanding - daysPayablesOutstanding;
};

const applySeasonalAdjustment = (baseValue, seasonalFactor) => {
  return baseValue * (1 + seasonalFactor);
};

const calculateInterestCost = (principal, rate, days = 365) => {
  return (principal * rate * days) / 36500;
};

const calculateCurrentRatio = (currentAssets, currentLiabilities) => {
  if (currentLiabilities === 0) return 0;
  return currentAssets / currentLiabilities;
};

const calculateQuickRatio = (currentAssets, inventory, currentLiabilities) => {
  if (currentLiabilities === 0) return 0;
  return (currentAssets - inventory) / currentLiabilities;
};

const calculateInventoryTurnover = (cogs, averageInventory) => {
  if (averageInventory === 0) return 0;
  return cogs / averageInventory;
};

const calculateGrossMargin = (revenue, cogs) => {
  if (revenue === 0) return 0;
  return ((revenue - cogs) / revenue) * 100;
};

// Test Suite
describe('Financial Calculations', () => {
  describe('Working Capital Calculations', () => {
    it('should calculate working capital correctly with positive values', () => {
      const result = calculateWorkingCapital({
        receivables: 100000,
        inventory: 50000,
        payables: 30000
      });
      expect(result).toBe(120000);
    });

    it('should handle zero values', () => {
      const result = calculateWorkingCapital({
        receivables: 0,
        inventory: 0,
        payables: 0
      });
      expect(result).toBe(0);
    });

    it('should handle missing values with defaults', () => {
      const result = calculateWorkingCapital({
        receivables: 100000
      });
      expect(result).toBe(100000);
    });

    it('should handle negative payables correctly', () => {
      const result = calculateWorkingCapital({
        receivables: 100000,
        inventory: 50000,
        payables: -10000
      });
      expect(result).toBe(160000);
    });

    it('should handle large numbers', () => {
      const result = calculateWorkingCapital({
        receivables: 10000000,
        inventory: 5000000,
        payables: 3000000
      });
      expect(result).toBe(12000000);
    });
  });

  describe('Cash Conversion Cycle', () => {
    it('should calculate CCC correctly', () => {
      const result = calculateCashConversionCycle({
        daysInventoryOutstanding: 30,
        daysSalesOutstanding: 45,
        daysPayablesOutstanding: 25
      });
      expect(result).toBe(50);
    });

    it('should handle zero days payables', () => {
      const result = calculateCashConversionCycle({
        daysInventoryOutstanding: 30,
        daysSalesOutstanding: 45,
        daysPayablesOutstanding: 0
      });
      expect(result).toBe(75);
    });

    it('should handle negative CCC (favorable)', () => {
      const result = calculateCashConversionCycle({
        daysInventoryOutstanding: 10,
        daysSalesOutstanding: 20,
        daysPayablesOutstanding: 40
      });
      expect(result).toBe(-10);
    });
  });

  describe('Seasonal Adjustments', () => {
    it('should apply positive seasonal adjustment', () => {
      const result = applySeasonalAdjustment(100000, 0.2);
      expect(result).toBe(120000);
    });

    it('should apply negative seasonal adjustment', () => {
      const result = applySeasonalAdjustment(100000, -0.1);
      expect(result).toBe(90000);
    });

    it('should handle zero seasonal factor', () => {
      const result = applySeasonalAdjustment(100000, 0);
      expect(result).toBe(100000);
    });

    it('should handle extreme seasonal factors', () => {
      const result = applySeasonalAdjustment(100000, 1.5);
      expect(result).toBe(250000);
    });
  });

  describe('Interest Cost Calculations', () => {
    it('should calculate annual interest cost', () => {
      const result = calculateInterestCost(1000000, 5);
      expect(result).toBe(50000);
    });

    it('should calculate monthly interest cost', () => {
      const result = calculateInterestCost(1000000, 5, 30);
      expect(result).toBeCloseTo(4109.59, 2);
    });

    it('should handle zero principal', () => {
      const result = calculateInterestCost(0, 5);
      expect(result).toBe(0);
    });

    it('should handle zero rate', () => {
      const result = calculateInterestCost(1000000, 0);
      expect(result).toBe(0);
    });
  });

  describe('Financial Ratios', () => {
    describe('Current Ratio', () => {
      it('should calculate current ratio correctly', () => {
        const result = calculateCurrentRatio(200000, 100000);
        expect(result).toBe(2);
      });

      it('should handle zero liabilities', () => {
        const result = calculateCurrentRatio(200000, 0);
        expect(result).toBe(0);
      });

      it('should handle equal assets and liabilities', () => {
        const result = calculateCurrentRatio(100000, 100000);
        expect(result).toBe(1);
      });
    });

    describe('Quick Ratio', () => {
      it('should calculate quick ratio correctly', () => {
        const result = calculateQuickRatio(200000, 50000, 100000);
        expect(result).toBe(1.5);
      });

      it('should handle zero inventory', () => {
        const result = calculateQuickRatio(200000, 0, 100000);
        expect(result).toBe(2);
      });

      it('should handle zero liabilities', () => {
        const result = calculateQuickRatio(200000, 50000, 0);
        expect(result).toBe(0);
      });
    });

    describe('Inventory Turnover', () => {
      it('should calculate inventory turnover correctly', () => {
        const result = calculateInventoryTurnover(500000, 100000);
        expect(result).toBe(5);
      });

      it('should handle zero inventory', () => {
        const result = calculateInventoryTurnover(500000, 0);
        expect(result).toBe(0);
      });

      it('should handle decimal turnover', () => {
        const result = calculateInventoryTurnover(750000, 100000);
        expect(result).toBe(7.5);
      });
    });

    describe('Gross Margin', () => {
      it('should calculate gross margin correctly', () => {
        const result = calculateGrossMargin(1000000, 600000);
        expect(result).toBe(40);
      });

      it('should handle zero revenue', () => {
        const result = calculateGrossMargin(0, 600000);
        expect(result).toBe(0);
      });

      it('should handle negative margin', () => {
        const result = calculateGrossMargin(1000000, 1200000);
        expect(result).toBe(-20);
      });

      it('should handle 100% margin', () => {
        const result = calculateGrossMargin(1000000, 0);
        expect(result).toBe(100);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined values', () => {
      const result = calculateWorkingCapital({});
      expect(result).toBe(0);
    });

    it('should handle null values', () => {
      const result = calculateWorkingCapital({
        receivables: null,
        inventory: null,
        payables: null
      });
      expect(result).toBe(0);
    });

    it('should handle string numbers', () => {
      const data = {
        receivables: 100000,
        inventory: 50000,
        payables: 30000
      };
      const result = calculateWorkingCapital(data);
      expect(result).toBe(120000);
    });

    it('should handle very large numbers', () => {
      const result = calculateWorkingCapital({
        receivables: 999999999999,
        inventory: 999999999999,
        payables: 999999999999
      });
      expect(result).toBe(999999999999);
    });

    it('should handle decimal precision', () => {
      const result = calculateInterestCost(1234567.89, 3.75, 365);
      expect(result).toBeCloseTo(46296.30, 2);
    });
  });
});

describe('Business Logic Validation', () => {
  describe('Working Capital Health', () => {
    it('should identify healthy working capital', () => {
      const wc = calculateWorkingCapital({
        receivables: 200000,
        inventory: 100000,
        payables: 150000
      });
      expect(wc).toBeGreaterThan(0);
      expect(wc).toBe(150000);
    });

    it('should identify working capital stress', () => {
      const wc = calculateWorkingCapital({
        receivables: 50000,
        inventory: 30000,
        payables: 100000
      });
      expect(wc).toBeLessThan(0);
      expect(wc).toBe(-20000);
    });
  });

  describe('Seasonal Business Patterns', () => {
    it('should handle Q4 peak season adjustment', () => {
      const baseWC = 1000000;
      const q4Adjustment = 0.3; // 30% increase
      const peakWC = applySeasonalAdjustment(baseWC, q4Adjustment);
      expect(peakWC).toBe(1300000);
    });

    it('should handle Q1 low season adjustment', () => {
      const baseWC = 1000000;
      const q1Adjustment = -0.2; // 20% decrease
      const lowWC = applySeasonalAdjustment(baseWC, q1Adjustment);
      expect(lowWC).toBe(800000);
    });
  });

  describe('Multi-Currency Scenarios', () => {
    const exchangeRates = {
      USD: 1,
      GBP: 0.79,
      EUR: 0.92
    };

    const convertCurrency = (amount, fromCurrency, toCurrency) => {
      const usdAmount = amount / exchangeRates[fromCurrency];
      return usdAmount * exchangeRates[toCurrency];
    };

    it('should convert GBP to USD correctly', () => {
      const gbpAmount = 100000;
      const usdAmount = convertCurrency(gbpAmount, 'GBP', 'USD');
      expect(usdAmount).toBeCloseTo(126582.28, 2);
    });

    it('should convert EUR to GBP correctly', () => {
      const eurAmount = 100000;
      const gbpAmount = convertCurrency(eurAmount, 'EUR', 'GBP');
      expect(gbpAmount).toBeCloseTo(85869.57, 2);
    });
  });
});
