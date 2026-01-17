import { describe, it, expect, vi } from 'vitest'
import { 
  calculateVolume, 
  formatTime, 
  formatNumber,
  calculate1RM,
  calculate1RMEpley,
  calculate1RMBrzycki,
  getRepPercentages,
  debounce
} from '../lib/utils'
import { WEIGHT_INCREMENT, REPS_INCREMENT, SET_TYPES, REST_TIMER_PRESETS } from '../lib/constants'

/**
 * Edge Cases & Breaking Tests
 * These tests attempt to find bugs by testing extreme values,
 * null/undefined inputs, and boundary conditions
 */
describe('Edge Cases - Breaking Tests', () => {
  
  // ============================================
  // Numeric Overflow / Underflow
  // ============================================
  describe('Numeric Edge Cases', () => {
    it('handles very large weight values', () => {
      const result = calculate1RM(Number.MAX_SAFE_INTEGER, 5)
      expect(isFinite(result)).toBe(true)
    })

    it('handles very small decimal values', () => {
      const result = calculate1RM(0.0001, 5)
      expect(result).toBeGreaterThanOrEqual(0)
    })

    it('handles Infinity', () => {
      const result = calculate1RM(Infinity, 5)
      // Should not crash, may return Infinity or handle it
      expect(result).toBeDefined()
    })

    it('handles NaN input', () => {
      const result = calculate1RM(NaN, 5)
      expect(result).toBe(0)
    })

    it('calculateVolume with extreme values', () => {
      const sets = [{ weight_kg: 1e15, reps: 1e6 }]
      const result = calculateVolume(sets)
      expect(isFinite(result)).toBe(true)
    })

    it('formatNumber with negative numbers', () => {
      expect(formatNumber(-1000)).toBeDefined()
      expect(formatNumber(-1000000)).toBeDefined()
    })

    it('formatTime with negative seconds', () => {
      // Should handle gracefully
      const result = formatTime(-60)
      expect(result).toBeDefined()
    })
  })

  // ============================================
  // Null / Undefined Handling
  // ============================================
  describe('Null/Undefined Handling', () => {
    it('calculateVolume with undefined values in sets', () => {
      const sets = [
        { weight_kg: undefined, reps: undefined },
        { weight_kg: null, reps: null }
      ]
      // Should not throw
      expect(() => calculateVolume(sets)).not.toThrow()
    })

    it('1RM with undefined', () => {
      expect(calculate1RM(undefined, 5)).toBe(0)
      expect(calculate1RM(100, undefined)).toBe(0)
    })

    it('1RM with null', () => {
      expect(calculate1RM(null, 5)).toBe(0)
      expect(calculate1RM(100, null)).toBe(0)
    })

    it('getRepPercentages with 0', () => {
      const result = getRepPercentages(0)
      expect(Array.isArray(result)).toBe(true)
      expect(result.every(r => r.weight === 0)).toBe(true)
    })

    it('getRepPercentages with null', () => {
      const result = getRepPercentages(null)
      expect(Array.isArray(result)).toBe(true)
    })
  })

  // ============================================
  // Boundary Conditions
  // ============================================
  describe('Boundary Conditions', () => {
    it('1RM at exactly 1 rep returns exact weight', () => {
      expect(calculate1RM(100, 1)).toBe(100)
      expect(calculate1RMEpley(100, 1)).toBe(100)
      expect(calculate1RMBrzycki(100, 1)).toBe(100)
    })

    it('Brzycki at rep boundary (36 and 37)', () => {
      // 37 - 36 = 1, should not cause division issue
      expect(() => calculate1RMBrzycki(100, 36)).not.toThrow()
      expect(isFinite(calculate1RMBrzycki(100, 36))).toBe(true)
      
      // 37 - 37 = 0, protected against division by zero
      expect(() => calculate1RMBrzycki(100, 37)).not.toThrow()
      expect(isFinite(calculate1RMBrzycki(100, 37))).toBe(true)
    })

    it('Brzycki with 38+ reps (past boundary)', () => {
      expect(() => calculate1RMBrzycki(100, 40)).not.toThrow()
      expect(calculate1RMBrzycki(100, 40)).toBeGreaterThan(0)
    })

    it('formatTime at 0 seconds', () => {
      expect(formatTime(0)).toBe('00:00')
    })

    it('formatTime at exactly 60 seconds', () => {
      expect(formatTime(60)).toBe('01:00')
    })

    it('formatNumber at boundaries', () => {
      expect(formatNumber(999)).toBe('999')
      expect(formatNumber(1000)).toBe('1.0K')
      expect(formatNumber(999999)).toBe('1000.0K')
      expect(formatNumber(1000000)).toBe('1.0M')
    })
  })

  // ============================================
  // Constants Integrity
  // ============================================
  describe('Constants Integrity', () => {
    it('WEIGHT_INCREMENT is a positive number', () => {
      expect(typeof WEIGHT_INCREMENT).toBe('number')
      expect(WEIGHT_INCREMENT).toBeGreaterThan(0)
    })

    it('REPS_INCREMENT is a positive integer', () => {
      expect(typeof REPS_INCREMENT).toBe('number')
      expect(REPS_INCREMENT).toBeGreaterThan(0)
      expect(Number.isInteger(REPS_INCREMENT)).toBe(true)
    })

    it('SET_TYPES has required types', () => {
      expect(SET_TYPES.normal).toBeDefined()
      expect(SET_TYPES.warmup).toBeDefined()
      expect(SET_TYPES.dropset).toBeDefined()
      expect(SET_TYPES.restpause).toBeDefined()
    })

    it('SET_TYPES have labels', () => {
      Object.values(SET_TYPES).forEach(type => {
        expect(type.label).toBeDefined()
        expect(typeof type.label).toBe('string')
      })
    })

    it('REST_TIMER_PRESETS are valid numbers', () => {
      expect(Array.isArray(REST_TIMER_PRESETS)).toBe(true)
      REST_TIMER_PRESETS.forEach(preset => {
        expect(typeof preset).toBe('number')
        expect(preset).toBeGreaterThan(0)
      })
    })
  })

  // ============================================
  // Debounce Edge Cases
  // ============================================
  describe('Debounce Edge Cases', () => {
    it('debounce with 0 delay', () => {
      vi.useFakeTimers()
      const fn = vi.fn()
      const debounced = debounce(fn, 0)
      
      debounced()
      vi.advanceTimersByTime(0)
      
      expect(fn).toHaveBeenCalled()
      vi.restoreAllMocks()
    })

    it('debounce preserves this context', () => {
      vi.useFakeTimers()
      const obj = {
        value: 42,
        fn: vi.fn(function() { return this.value })
      }
      const debounced = debounce(obj.fn.bind(obj), 100)
      
      debounced()
      vi.advanceTimersByTime(100)
      
      expect(obj.fn).toHaveBeenCalled()
      vi.restoreAllMocks()
    })
  })

  // ============================================
  // String Edge Cases
  // ============================================
  describe('String Edge Cases', () => {
    it('formatNumber with string input', () => {
      // Should not crash even with string
      const result = formatNumber('1000')
      expect(result).toBeDefined()
    })
  })

  // ============================================
  // Array Edge Cases
  // ============================================
  describe('Array Edge Cases', () => {
    it('calculateVolume with empty objects', () => {
      const sets = [{}, {}, {}]
      const result = calculateVolume(sets)
      expect(result).toBe(0)
    })

    it('calculateVolume with mixed valid/invalid', () => {
      const sets = [
        { weight_kg: 100, reps: 10 },
        {},
        { weight_kg: 50, reps: 5 },
        { reps: 10 }, // missing weight
        { weight_kg: 50 } // missing reps
      ]
      const result = calculateVolume(sets)
      expect(result).toBeGreaterThanOrEqual(1250) // At least 1000 + 250
    })

    it('getRepPercentages returns expected structure', () => {
      const result = getRepPercentages(100)
      result.forEach(item => {
        expect(item).toHaveProperty('reps')
        expect(item).toHaveProperty('percent')
        expect(item).toHaveProperty('weight')
        expect(typeof item.reps).toBe('number')
        expect(typeof item.percent).toBe('number')
        expect(typeof item.weight).toBe('number')
      })
    })
  })
})

/**
 * Integration-like Tests
 * Testing common user workflows
 */
describe('User Workflow Simulations', () => {
  
  it('simulates completing a workout with multiple sets', () => {
    const sets = [
      { weight_kg: 60, reps: 12, set_type: 'warmup' },
      { weight_kg: 80, reps: 10, set_type: 'normal' },
      { weight_kg: 100, reps: 8, set_type: 'normal' },
      { weight_kg: 100, reps: 6, set_type: 'normal' },
      { weight_kg: 80, reps: 10, set_type: 'dropset' },
    ]
    
    const volume = calculateVolume(sets)
    const estimated1RM = calculate1RM(100, 8)
    
    expect(volume).toBe(720 + 800 + 800 + 600 + 800) // 3720
    expect(estimated1RM).toBeGreaterThan(100)
    expect(estimated1RM).toBeLessThan(150)
  })

  it('simulates rest timer countdown', () => {
    for (let seconds = 90; seconds >= 0; seconds -= 10) {
      const formatted = formatTime(seconds)
      expect(formatted).toMatch(/^\d{2}:\d{2}$/)
    }
  })

  it('simulates 1RM calculator with rep table', () => {
    const oneRM = 100
    const repTable = getRepPercentages(oneRM)
    
    // User should be able to see weights for different rep ranges
    const fiveRep = repTable.find(r => r.reps === 5)
    const tenRep = repTable.find(r => r.reps === 10)
    
    expect(fiveRep.weight).toBeGreaterThan(tenRep.weight)
    expect(fiveRep.percent).toBeGreaterThan(tenRep.percent)
  })
})
