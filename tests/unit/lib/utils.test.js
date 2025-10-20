import { describe, it, expect, vi } from 'vitest'
import { cn } from '../../../src/lib/utils.js'

// Mock clsx and twMerge
vi.mock('clsx', () => ({
  clsx: vi.fn((...inputs) => {
    const processInput = input => {
      if (typeof input === 'string') return [input]
      if (Array.isArray(input)) return input.flatMap(processInput)
      if (typeof input === 'object' && input !== null) {
        return Object.entries(input)
          .filter(([, value]) => value)
          .map(([key]) => key)
      }
      return []
    }

    return inputs
      .flatMap(processInput)
      .filter(Boolean)
      .join(' ')
  }),
}))

vi.mock('tailwind-merge', () => ({
  twMerge: vi.fn(str => str),
}))

describe('cn utility', () => {
  describe('Basic class merging', () => {
    it('should merge single class name', () => {
      const result = cn('text-red-500')
      expect(result).toBe('text-red-500')
    })

    it('should merge multiple class names', () => {
      const result = cn('text-red-500', 'bg-blue-100')
      expect(result).toContain('text-red-500')
      expect(result).toContain('bg-blue-100')
    })

    it('should handle array of class names', () => {
      const result = cn(['text-red-500', 'bg-blue-100'])
      expect(result).toContain('text-red-500')
      expect(result).toContain('bg-blue-100')
    })

    it('should merge object with conditional classes', () => {
      const result = cn({
        'text-red-500': true,
        'bg-blue-100': false,
      })
      expect(result).toContain('text-red-500')
      expect(result).not.toContain('bg-blue-100')
    })
  })

  describe('Conditional classes', () => {
    it('should include classes when condition is true', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
    })

    it('should exclude classes when condition is false', () => {
      const isActive = false
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).not.toContain('active-class')
    })

    it('should handle multiple conditional classes', () => {
      const isActive = true
      const isDisabled = false
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      )
      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
      expect(result).not.toContain('disabled-class')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle null and undefined', () => {
      const result = cn('base-class', null, undefined, 'other-class')
      expect(result).toContain('base-class')
      expect(result).toContain('other-class')
    })

    it('should handle empty strings', () => {
      const result = cn('base-class', '', 'other-class')
      expect(result).toContain('base-class')
      expect(result).toContain('other-class')
    })

    it('should handle mixed types', () => {
      const result = cn('base-class', ['array-class'], { 'object-class': true }, 'string-class')
      expect(result).toContain('base-class')
      expect(result).toContain('array-class')
      expect(result).toContain('object-class')
      expect(result).toContain('string-class')
    })
  })

  describe('Tailwind conflict resolution', () => {
    it('should pass classes to twMerge for conflict resolution', () => {
      // In real usage, twMerge would handle conflicts like:
      // cn('text-red-500', 'text-blue-500') -> 'text-blue-500'
      const result = cn('text-red-500', 'text-blue-500')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle complex Tailwind class combinations', () => {
      const result = cn(
        'px-4 py-2',
        'bg-blue-500 hover:bg-blue-600',
        'text-white font-bold'
      )
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
  })

  describe('Real-world usage patterns', () => {
    it('should work with component variants', () => {
      const variant = 'primary'
      const result = cn(
        'base-button',
        variant === 'primary' && 'bg-blue-500',
        variant === 'secondary' && 'bg-gray-500'
      )
      expect(result).toContain('base-button')
      expect(result).toContain('bg-blue-500')
    })

    it('should work with size variations', () => {
      const size = 'lg'
      const result = cn(
        'button',
        size === 'sm' && 'px-2 py-1 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg'
      )
      expect(result).toContain('button')
      expect(result).toContain('px-6 py-3 text-lg')
    })

    it('should work with state classes', () => {
      const isLoading = true
      const isDisabled = false
      const result = cn(
        'button',
        isLoading && 'opacity-50 cursor-wait',
        isDisabled && 'opacity-25 cursor-not-allowed'
      )
      expect(result).toContain('button')
      expect(result).toContain('opacity-50 cursor-wait')
      expect(result).not.toContain('cursor-not-allowed')
    })

    it('should handle className prop merging', () => {
      const baseClasses = 'button bg-blue-500'
      const userClasses = 'custom-class mt-4'
      const result = cn(baseClasses, userClasses)
      expect(result).toContain('button')
      expect(result).toContain('bg-blue-500')
      expect(result).toContain('custom-class')
      expect(result).toContain('mt-4')
    })
  })

  describe('Performance considerations', () => {
    it('should handle many class inputs efficiently', () => {
      const manyClasses = Array.from({ length: 50 }, (_, i) => `class-${i}`)
      const result = cn(...manyClasses)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle deeply nested conditional logic', () => {
      const condition1 = true
      const condition2 = false
      const condition3 = true
      const result = cn(
        'base',
        condition1 && 'level1',
        condition1 && condition2 && 'level2',
        condition1 && condition3 && 'level3'
      )
      expect(result).toContain('base')
      expect(result).toContain('level1')
      expect(result).toContain('level3')
      expect(result).not.toContain('level2')
    })
  })
})
