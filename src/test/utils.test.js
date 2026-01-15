import { describe, it, expect } from 'vitest'
import { calculateVolume, formatWeight, formatTime, cn } from '../lib/utils'

describe('Utils', () => {
  describe('calculateVolume', () => {
    it('calculates volume correctly for multiple sets', () => {
      const sets = [
        { weight_kg: 100, reps: 10 },
        { weight_kg: 100, reps: 8 },
        { weight_kg: 90, reps: 6 }
      ]
      expect(calculateVolume(sets)).toBe(2340) // 1000 + 800 + 540
    })

    it('returns 0 for empty array', () => {
      expect(calculateVolume([])).toBe(0)
    })

    it('handles sets with missing values', () => {
      const sets = [
        { weight_kg: 50, reps: 10 },
        { weight_kg: 0, reps: 10 },
        { weight_kg: 50, reps: 0 }
      ]
      expect(calculateVolume(sets)).toBe(500)
    })
  })

  describe('formatWeight', () => {
    it('formats weight with kg suffix', () => {
      expect(formatWeight(100)).toBe('100 kg')
    })

    it('formats decimal weight', () => {
      expect(formatWeight(100.5)).toBe('100.5 kg')
    })
  })

  describe('formatTime', () => {
    it('formats seconds less than a minute with padded zeros', () => {
      expect(formatTime(45)).toBe('00:45')
    })

    it('formats full minutes', () => {
      expect(formatTime(60)).toBe('01:00')
    })

    it('formats minutes and seconds', () => {
      expect(formatTime(90)).toBe('01:30')
    })

    it('pads single digit seconds', () => {
      expect(formatTime(65)).toBe('01:05')
    })
  })

  describe('cn', () => {
    it('joins class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('filters falsy values', () => {
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
    })

    it('handles conditional classes', () => {
      const isActive = true
      expect(cn('base', isActive && 'active')).toBe('base active')
    })
  })
})
