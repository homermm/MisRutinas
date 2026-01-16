import { describe, it, expect } from 'vitest'

// Test 1RM calculation logic (Brzycki and Epley formulas)
describe('1RM Calculator Logic', () => {
  const calculate1RM = (weight, reps) => {
    if (!weight || !reps || reps > 30 || reps < 1) return null
    if (reps === 1) return weight
    
    const brzycki = weight * (36 / (37 - reps))
    const epley = weight * (1 + reps / 30)
    return Math.round((brzycki + epley) / 2)
  }

  it('returns same weight for 1 rep', () => {
    expect(calculate1RM(100, 1)).toBe(100)
  })

  it('calculates correctly for 5 reps', () => {
    // 100kg x 5 reps should be ~115kg 1RM
    const result = calculate1RM(100, 5)
    expect(result).toBeGreaterThan(110)
    expect(result).toBeLessThan(120)
  })

  it('calculates correctly for 10 reps', () => {
    // 80kg x 10 reps should be ~107kg 1RM
    const result = calculate1RM(80, 10)
    expect(result).toBeGreaterThan(100)
    expect(result).toBeLessThan(115)
  })

  it('returns null for invalid input', () => {
    expect(calculate1RM(0, 5)).toBe(null)
    expect(calculate1RM(100, 0)).toBe(null)
    expect(calculate1RM(100, 31)).toBe(null)
  })
})

// Test streak calculation logic
describe('Streak Calculation', () => {
  const getWeekNumber = (date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  }

  it('calculates week number consistently', () => {
    // Just verify that different dates give different week numbers
    const jan15 = new Date('2024-01-15')
    const jan22 = new Date('2024-01-22')
    const weekNum1 = getWeekNumber(jan15)
    const weekNum2 = getWeekNumber(jan22)
    expect(weekNum2).toBe(weekNum1 + 1)
  })
})

// Test volume calculation
describe('Volume Calculation', () => {
  const calculateVolume = (sets) => {
    return sets.reduce((sum, s) => sum + s.reps * s.weight_kg, 0)
  }

  it('calculates total volume correctly', () => {
    const sets = [
      { reps: 10, weight_kg: 100 },
      { reps: 8, weight_kg: 110 },
      { reps: 12, weight_kg: 60 }
    ]
    expect(calculateVolume(sets)).toBe(2600) // 1000 + 880 + 720
  })

  it('returns 0 for empty array', () => {
    expect(calculateVolume([])).toBe(0)
  })
})

// Test number formatting
describe('Number Formatting', () => {
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  it('formats millions', () => {
    expect(formatNumber(1500000)).toBe('1.5M')
    expect(formatNumber(2000000)).toBe('2.0M')
  })

  it('formats thousands', () => {
    expect(formatNumber(1500)).toBe('1.5K')
    expect(formatNumber(2500)).toBe('2.5K')
  })

  it('keeps small numbers as is', () => {
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(100)).toBe('100')
  })
})

// Test rep percentage table
describe('Rep Percentage Table', () => {
  const repTable = [
    { reps: 1, percent: 100 },
    { reps: 3, percent: 93 },
    { reps: 5, percent: 87 },
    { reps: 8, percent: 80 },
    { reps: 10, percent: 75 },
  ]

  it('has correct percentages', () => {
    expect(repTable.find(r => r.reps === 1).percent).toBe(100)
    expect(repTable.find(r => r.reps === 5).percent).toBe(87)
    expect(repTable.find(r => r.reps === 10).percent).toBe(75)
  })

  it('calculates weight from 1RM correctly', () => {
    const oneRM = 100
    const weight5Rep = Math.round(oneRM * 87 / 100)
    expect(weight5Rep).toBe(87)
  })
})

// Test date formatting
describe('Date Formatting', () => {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short'
    })
  }

  it('formats dates in Spanish', () => {
    const formatted = formatDate('2024-01-15T10:00:00Z')
    expect(formatted).toContain('15')
    expect(formatted).toContain('ene')
  })
})

// Test username validation
describe('Username Validation', () => {
  const cleanUsername = (value) => {
    return value.toLowerCase().replace(/[^a-z0-9_]/g, '')
  }

  it('converts to lowercase', () => {
    expect(cleanUsername('TestUser')).toBe('testuser')
  })

  it('removes spaces and special characters', () => {
    expect(cleanUsername('test user!')).toBe('testuser')
    expect(cleanUsername('test@user#123')).toBe('testuser123')
  })

  it('allows underscores', () => {
    expect(cleanUsername('test_user')).toBe('test_user')
  })
})
