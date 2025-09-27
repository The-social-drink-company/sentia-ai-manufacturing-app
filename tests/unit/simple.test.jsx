import { describe, it, expect } from 'vitest'

describe('Simple Test Suite', () => {
  it('should pass a basic arithmetic test', () => {
    expect(2 + 2).toBe(4)
  })

  it('should verify string equality', () => {
    expect('hello').toBe('hello')
  })

  it('should check array length', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
  })
})