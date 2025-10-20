import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatCompact,
  formatTrend,
} from '../../../src/utils/formatters.js'

describe('formatCurrency', () => {
  describe('Millions formatting', () => {
    it('should format values >= 1 million with M suffix', () => {
      expect(formatCurrency(10760000, '£')).toBe('£10.76M')
      expect(formatCurrency(1000000, '£')).toBe('£1.00M')
      expect(formatCurrency(2500000, '$')).toBe('$2.50M')
    })

    it('should format negative millions correctly', () => {
      expect(formatCurrency(-5000000, '£')).toBe('£-5.00M')
      expect(formatCurrency(-1250000, '$')).toBe('$-1.25M')
    })

    it('should round millions to 2 decimal places', () => {
      expect(formatCurrency(1234567, '£')).toBe('£1.23M')
      expect(formatCurrency(9876543, '$')).toBe('$9.88M')
    })
  })

  describe('Thousands formatting', () => {
    it('should format values >= 1000 with K suffix', () => {
      expect(formatCurrency(350000, '£')).toBe('£350K')
      expect(formatCurrency(1000, '$')).toBe('$1K')
      expect(formatCurrency(75500, '€')).toBe('€76K')
    })

    it('should format negative thousands correctly', () => {
      expect(formatCurrency(-25000, '£')).toBe('£-25K')
      expect(formatCurrency(-1500, '$')).toBe('$-2K')
    })

    it('should round thousands to 0 decimal places', () => {
      expect(formatCurrency(1234, '£')).toBe('£1K')
      expect(formatCurrency(9876, '$')).toBe('$10K')
    })
  })

  describe('Values < 1000', () => {
    it('should format values < 1000 with locale', () => {
      expect(formatCurrency(500, '£')).toBe('£500')
      expect(formatCurrency(123, '$')).toBe('$123')
      expect(formatCurrency(0, '€')).toBe('€0')
    })

    it('should format negative values < 1000', () => {
      expect(formatCurrency(-500, '£')).toBe('£-500')
      expect(formatCurrency(-123, '$')).toBe('$-123')
    })
  })

  describe('Default currency', () => {
    it('should use £ as default currency', () => {
      expect(formatCurrency(10000)).toBe('£10K')
      expect(formatCurrency(1500000)).toBe('£1.50M')
      expect(formatCurrency(500)).toBe('£500')
    })
  })

  describe('Edge cases', () => {
    it('should handle zero', () => {
      expect(formatCurrency(0, '£')).toBe('£0')
      expect(formatCurrency(0)).toBe('£0')
    })

    it('should handle NaN', () => {
      expect(formatCurrency(NaN, '£')).toBe('£0')
      expect(formatCurrency(NaN)).toBe('£0')
    })

    it('should handle non-number types', () => {
      expect(formatCurrency('invalid', '£')).toBe('£0')
      expect(formatCurrency(null, '$')).toBe('$0')
      expect(formatCurrency(undefined, '€')).toBe('€0')
    })

    it('should handle very large numbers', () => {
      expect(formatCurrency(999999999, '£')).toBe('£1000.00M')
      expect(formatCurrency(1500000000, '$')).toBe('$1500.00M')
    })

    it('should handle very small negative numbers', () => {
      expect(formatCurrency(-1, '£')).toBe('£-1')
      expect(formatCurrency(-999, '$')).toBe('$-999')
    })
  })
})

describe('formatNumber', () => {
  describe('Millions formatting', () => {
    it('should format values >= 1 million with M suffix', () => {
      expect(formatNumber(10760000)).toBe('10.76M')
      expect(formatNumber(1000000)).toBe('1.00M')
      expect(formatNumber(2500000)).toBe('2.50M')
    })

    it('should format negative millions correctly', () => {
      expect(formatNumber(-5000000)).toBe('-5.00M')
      expect(formatNumber(-1250000)).toBe('-1.25M')
    })
  })

  describe('Thousands formatting', () => {
    it('should format values >= 1000 with K suffix', () => {
      expect(formatNumber(350314)).toBe('350K')
      expect(formatNumber(1000)).toBe('1K')
      expect(formatNumber(75500)).toBe('76K')
    })

    it('should format negative thousands correctly', () => {
      expect(formatNumber(-25000)).toBe('-25K')
      expect(formatNumber(-1500)).toBe('-2K')
    })
  })

  describe('Values < 1000', () => {
    it('should format values < 1000 with locale', () => {
      expect(formatNumber(500)).toBe('500')
      expect(formatNumber(123)).toBe('123')
      expect(formatNumber(0)).toBe('0')
    })
  })

  describe('Edge cases', () => {
    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0')
    })

    it('should handle NaN', () => {
      expect(formatNumber(NaN)).toBe('0')
    })

    it('should handle non-number types', () => {
      expect(formatNumber('invalid')).toBe('0')
      expect(formatNumber(null)).toBe('0')
      expect(formatNumber(undefined)).toBe('0')
    })

    it('should handle decimal values', () => {
      expect(formatNumber(1234.56)).toBe('1K')
      expect(formatNumber(500.75)).toBe('500.75')
    })
  })
})

describe('formatPercentage', () => {
  describe('Default decimals (1)', () => {
    it('should format percentages with 1 decimal place', () => {
      expect(formatPercentage(67.6)).toBe('67.6%')
      expect(formatPercentage(100)).toBe('100.0%')
      expect(formatPercentage(0)).toBe('0.0%')
    })

    it('should format negative percentages', () => {
      expect(formatPercentage(-15.2)).toBe('-15.2%')
      expect(formatPercentage(-100)).toBe('-100.0%')
    })

    it('should round to 1 decimal place', () => {
      expect(formatPercentage(67.65)).toBe('67.7%')
      expect(formatPercentage(67.64)).toBe('67.6%')
    })
  })

  describe('Custom decimals', () => {
    it('should format with 0 decimal places', () => {
      expect(formatPercentage(67.6, 0)).toBe('68%')
      expect(formatPercentage(100, 0)).toBe('100%')
    })

    it('should format with 2 decimal places', () => {
      expect(formatPercentage(67.654, 2)).toBe('67.65%')
      expect(formatPercentage(100.12, 2)).toBe('100.12%')
    })

    it('should format with 3 decimal places', () => {
      expect(formatPercentage(67.6543, 3)).toBe('67.654%')
      expect(formatPercentage(99.9995, 3)).toBe('99.999%')
    })
  })

  describe('Edge cases', () => {
    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.0%')
      expect(formatPercentage(0, 2)).toBe('0.00%')
    })

    it('should handle NaN', () => {
      expect(formatPercentage(NaN)).toBe('0%')
      expect(formatPercentage(NaN, 2)).toBe('0%')
    })

    it('should handle non-number types', () => {
      expect(formatPercentage('invalid')).toBe('0%')
      expect(formatPercentage(null)).toBe('0%')
      expect(formatPercentage(undefined)).toBe('0%')
    })

    it('should handle very large percentages', () => {
      expect(formatPercentage(999.99, 2)).toBe('999.99%')
      expect(formatPercentage(1000, 0)).toBe('1000%')
    })

    it('should handle very small percentages', () => {
      expect(formatPercentage(0.01, 2)).toBe('0.01%')
      expect(formatPercentage(0.001, 3)).toBe('0.001%')
    })
  })
})

describe('formatCompact', () => {
  describe('Standard formatting', () => {
    it('should format numbers with commas', () => {
      expect(formatCompact(10760)).toBe('10,760')
      expect(formatCompact(1000)).toBe('1,000')
      expect(formatCompact(1234567)).toBe('1,234,567')
    })

    it('should format numbers without commas when < 1000', () => {
      expect(formatCompact(500)).toBe('500')
      expect(formatCompact(123)).toBe('123')
    })

    it('should format negative numbers', () => {
      expect(formatCompact(-10760)).toBe('-10,760')
      expect(formatCompact(-1000000)).toBe('-1,000,000')
    })
  })

  describe('Edge cases', () => {
    it('should handle zero', () => {
      expect(formatCompact(0)).toBe('0')
    })

    it('should handle NaN', () => {
      expect(formatCompact(NaN)).toBe('0')
    })

    it('should handle non-number types', () => {
      expect(formatCompact('invalid')).toBe('0')
      expect(formatCompact(null)).toBe('0')
      expect(formatCompact(undefined)).toBe('0')
    })

    it('should handle decimal numbers', () => {
      expect(formatCompact(1234.56)).toBe('1,234.56')
      expect(formatCompact(999.99)).toBe('999.99')
    })

    it('should handle very large numbers', () => {
      expect(formatCompact(999999999)).toBe('999,999,999')
      expect(formatCompact(1000000000)).toBe('1,000,000,000')
    })
  })
})

describe('formatTrend', () => {
  describe('Positive trends', () => {
    it('should format positive values with + sign', () => {
      expect(formatTrend(15.2)).toBe('+15.2%')
      expect(formatTrend(100)).toBe('+100.0%')
      expect(formatTrend(0.5)).toBe('+0.5%')
    })

    it('should round positive values to 1 decimal', () => {
      expect(formatTrend(15.25)).toBe('+15.3%')
      expect(formatTrend(15.24)).toBe('+15.2%')
    })
  })

  describe('Negative trends', () => {
    it('should format negative values without + sign', () => {
      expect(formatTrend(-15.2)).toBe('-15.2%')
      expect(formatTrend(-100)).toBe('-100.0%')
      expect(formatTrend(-0.5)).toBe('-0.5%')
    })

    it('should round negative values to 1 decimal', () => {
      expect(formatTrend(-15.25)).toBe('-15.3%')
      expect(formatTrend(-15.24)).toBe('-15.2%')
    })
  })

  describe('Zero trend', () => {
    it('should format zero without + sign', () => {
      expect(formatTrend(0)).toBe('0.0%')
    })
  })

  describe('Edge cases', () => {
    it('should handle NaN', () => {
      expect(formatTrend(NaN)).toBe('0%')
    })

    it('should handle non-number types', () => {
      expect(formatTrend('invalid')).toBe('0%')
      expect(formatTrend(null)).toBe('0%')
      expect(formatTrend(undefined)).toBe('0%')
    })

    it('should handle very large positive values', () => {
      expect(formatTrend(999.99)).toBe('+1000.0%')
      expect(formatTrend(1000)).toBe('+1000.0%')
    })

    it('should handle very large negative values', () => {
      expect(formatTrend(-999.99)).toBe('-1000.0%')
      expect(formatTrend(-1000)).toBe('-1000.0%')
    })

    it('should handle very small positive values', () => {
      expect(formatTrend(0.01)).toBe('+0.0%')
      expect(formatTrend(0.05)).toBe('+0.1%')
    })

    it('should handle very small negative values', () => {
      expect(formatTrend(-0.01)).toBe('-0.0%')
      expect(formatTrend(-0.05)).toBe('-0.1%')
    })
  })
})
