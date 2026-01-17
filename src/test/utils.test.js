import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  calculateVolume, 
  formatWeight, 
  formatTime, 
  cn, 
  formatNumber,
  debounce,
  calculate1RM,
  calculate1RMEpley,
  calculate1RMBrzycki,
  getRepPercentages
} from '../lib/utils'

describe('Utils - Complete Coverage', () => {
  
  // ============================================
  // calculateVolume Tests
  // ============================================
  describe('calculateVolume', () => {
    it('calculates volume correctly for multiple sets', () => {
      const sets = [
        { weight_kg: 100, reps: 10 },
        { weight_kg: 100, reps: 8 },
        { weight_kg: 90, reps: 6 }
      ]
      expect(calculateVolume(sets)).toBe(2340)
    })

    it('returns 0 for empty array', () => {
      expect(calculateVolume([])).toBe(0)
    })

    it('handles zero values', () => {
      expect(calculateVolume([{ weight_kg: 0, reps: 10 }])).toBe(0)
      expect(calculateVolume([{ weight_kg: 100, reps: 0 }])).toBe(0)
    })

    it('handles undefined/null values gracefully', () => {
      const sets = [
        { weight_kg: undefined, reps: 10 },
        { weight_kg: 50, reps: null }
      ]
      // Should not throw, returns NaN calculations as 0
      expect(calculateVolume(sets)).toBe(0)
    })

    it('handles decimal weights', () => {
      const sets = [{ weight_kg: 22.5, reps: 10 }]
      expect(calculateVolume(sets)).toBe(225)
    })

    it('handles large volumes', () => {
      const sets = Array(100).fill({ weight_kg: 100, reps: 10 })
      expect(calculateVolume(sets)).toBe(100000)
    })
  })

  // ============================================
  // formatWeight Tests
  // ============================================
  describe('formatWeight', () => {
    it('formats integer weight', () => {
      expect(formatWeight(100)).toBe('100 kg')
    })

    it('formats decimal weight', () => {
      expect(formatWeight(100.5)).toBe('100.5 kg')
    })

    it('formats zero', () => {
      expect(formatWeight(0)).toBe('0 kg')
    })

    it('handles negative weight (edge case)', () => {
      expect(formatWeight(-5)).toBe('-5 kg')
    })
  })

  // ============================================
  // formatTime Tests
  // ============================================
  describe('formatTime', () => {
    it('formats zero seconds', () => {
      expect(formatTime(0)).toBe('00:00')
    })

    it('formats seconds under 60', () => {
      expect(formatTime(45)).toBe('00:45')
      expect(formatTime(5)).toBe('00:05')
    })

    it('formats full minutes', () => {
      expect(formatTime(60)).toBe('01:00')
      expect(formatTime(120)).toBe('02:00')
    })

    it('formats minutes and seconds', () => {
      expect(formatTime(90)).toBe('01:30')
      expect(formatTime(150)).toBe('02:30')
    })

    it('handles large values', () => {
      expect(formatTime(3600)).toBe('60:00')
      expect(formatTime(7260)).toBe('121:00')
    })
  })

  // ============================================
  // cn (className utility) Tests
  // ============================================
  describe('cn', () => {
    it('joins multiple classes', () => {
      expect(cn('a', 'b', 'c')).toBe('a b c')
    })

    it('filters false values', () => {
      expect(cn('a', false, 'b')).toBe('a b')
    })

    it('filters null values', () => {
      expect(cn('a', null, 'b')).toBe('a b')
    })

    it('filters undefined values', () => {
      expect(cn('a', undefined, 'b')).toBe('a b')
    })

    it('filters empty strings', () => {
      expect(cn('a', '', 'b')).toBe('a b')
    })

    it('handles conditional expressions', () => {
      expect(cn('base', true && 'active')).toBe('base active')
      expect(cn('base', false && 'active')).toBe('base')
    })

    it('returns empty string for no valid classes', () => {
      expect(cn(false, null, undefined, '')).toBe('')
    })
  })

  // ============================================
  // formatNumber Tests
  // ============================================
  describe('formatNumber', () => {
    it('formats millions', () => {
      expect(formatNumber(1000000)).toBe('1.0M')
      expect(formatNumber(1500000)).toBe('1.5M')
      expect(formatNumber(10000000)).toBe('10.0M')
    })

    it('formats thousands', () => {
      expect(formatNumber(1000)).toBe('1.0K')
      expect(formatNumber(1500)).toBe('1.5K')
      expect(formatNumber(999999)).toBe('1000.0K')
    })

    it('keeps small numbers as strings', () => {
      expect(formatNumber(999)).toBe('999')
      expect(formatNumber(100)).toBe('100')
      expect(formatNumber(0)).toBe('0')
    })

    it('handles edge cases', () => {
      expect(formatNumber(1)).toBe('1')
      expect(formatNumber(1000)).toBe('1.0K')
    })
  })

  // ============================================
  // debounce Tests
  // ============================================
  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('delays function execution', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)
      
      debouncedFn()
      expect(fn).not.toHaveBeenCalled()
      
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('cancels previous calls', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)
      
      debouncedFn()
      debouncedFn()
      debouncedFn()
      
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('passes arguments correctly', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)
      
      debouncedFn('arg1', 'arg2')
      vi.advanceTimersByTime(100)
      
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  // ============================================
  // 1RM Calculation Tests
  // ============================================
  describe('calculate1RMEpley', () => {
    it('returns weight for 1 rep', () => {
      expect(calculate1RMEpley(100, 1)).toBe(100)
    })

    it('calculates correctly for 5 reps', () => {
      // 100 * (1 + 5/30) = 100 * 1.167 = 116.7
      expect(calculate1RMEpley(100, 5)).toBeCloseTo(116.7, 0)
    })

    it('calculates correctly for 10 reps', () => {
      // 100 * (1 + 10/30) = 100 * 1.333 = 133.3
      expect(calculate1RMEpley(100, 10)).toBeCloseTo(133.3, 0)
    })

    it('returns 0 for zero weight', () => {
      expect(calculate1RMEpley(0, 5)).toBe(0)
    })

    it('returns 0 for zero reps', () => {
      expect(calculate1RMEpley(100, 0)).toBe(0)
    })

    it('returns 0 for negative values', () => {
      expect(calculate1RMEpley(-100, 5)).toBe(0)
      expect(calculate1RMEpley(100, -5)).toBe(0)
    })
  })

  describe('calculate1RMBrzycki', () => {
    it('returns weight for 1 rep', () => {
      expect(calculate1RMBrzycki(100, 1)).toBe(100)
    })

    it('calculates correctly for 5 reps', () => {
      // 100 * (36 / (37 - 5)) = 100 * 1.125 = 112.5
      expect(calculate1RMBrzycki(100, 5)).toBeCloseTo(112.5, 0)
    })

    it('returns 0 for zero weight', () => {
      expect(calculate1RMBrzycki(0, 5)).toBe(0)
    })

    it('returns 0 for zero reps', () => {
      expect(calculate1RMBrzycki(100, 0)).toBe(0)
    })

    it('handles edge case at 37 reps (division boundary)', () => {
      // Should not throw or return Infinity
      const result = calculate1RMBrzycki(100, 37)
      expect(result).toBeGreaterThan(0)
      expect(isFinite(result)).toBe(true)
    })

    it('handles reps > 37', () => {
      const result = calculate1RMBrzycki(100, 40)
      expect(result).toBeGreaterThan(0)
      expect(isFinite(result)).toBe(true)
    })
  })

  describe('calculate1RM (average)', () => {
    it('returns weight for 1 rep', () => {
      expect(calculate1RM(100, 1)).toBe(100)
    })

    it('returns average of Epley and Brzycki', () => {
      const epley = calculate1RMEpley(100, 5)
      const brzycki = calculate1RMBrzycki(100, 5)
      const expected = Math.round((epley + brzycki) / 2 * 10) / 10
      expect(calculate1RM(100, 5)).toBeCloseTo(expected, 0)
    })

    it('returns 0 for invalid inputs', () => {
      expect(calculate1RM(0, 5)).toBe(0)
      expect(calculate1RM(100, 0)).toBe(0)
      expect(calculate1RM(-100, 5)).toBe(0)
    })
  })

  describe('getRepPercentages', () => {
    it('returns array of rep percentages', () => {
      const percentages = getRepPercentages(100)
      expect(Array.isArray(percentages)).toBe(true)
      expect(percentages.length).toBeGreaterThan(0)
    })

    it('has 100% for 1 rep', () => {
      const percentages = getRepPercentages(100)
      const oneRep = percentages.find(p => p.reps === 1)
      expect(oneRep.percent).toBe(100)
      expect(oneRep.weight).toBe(100)
    })

    it('calculates weights correctly based on 1RM', () => {
      const percentages = getRepPercentages(100)
      const fiveRep = percentages.find(p => p.reps === 5)
      expect(fiveRep.weight).toBe(87) // 87% of 100
    })

    it('handles different 1RM values', () => {
      const percentages = getRepPercentages(200)
      const oneRep = percentages.find(p => p.reps === 1)
      expect(oneRep.weight).toBe(200)
    })
  })
})
