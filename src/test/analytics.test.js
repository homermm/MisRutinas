import { describe, it, expect } from 'vitest'

// Test PR tracking logic
describe('PR Tracking', () => {
  const trackPRs = (sessions) => {
    const prs = {}
    sessions.forEach(session => {
      session.set_logs.forEach(log => {
        const exName = log.exercise
        if (!prs[exName] || log.weight > prs[exName]) {
          prs[exName] = log.weight
        }
      })
    })
    return prs
  }

  it('tracks single PR correctly', () => {
    const sessions = [
      { set_logs: [{ exercise: 'Bench', weight: 100 }] }
    ]
    expect(trackPRs(sessions)['Bench']).toBe(100)
  })

  it('updates PR when weight increases', () => {
    const sessions = [
      { set_logs: [{ exercise: 'Bench', weight: 100 }] },
      { set_logs: [{ exercise: 'Bench', weight: 120 }] }
    ]
    expect(trackPRs(sessions)['Bench']).toBe(120)
  })

  it('keeps highest PR', () => {
    const sessions = [
      { set_logs: [{ exercise: 'Bench', weight: 120 }] },
      { set_logs: [{ exercise: 'Bench', weight: 100 }] }
    ]
    expect(trackPRs(sessions)['Bench']).toBe(120)
  })

  it('tracks multiple exercises', () => {
    const sessions = [
      { set_logs: [
        { exercise: 'Bench', weight: 100 },
        { exercise: 'Squat', weight: 150 }
      ]}
    ]
    const prs = trackPRs(sessions)
    expect(prs['Bench']).toBe(100)
    expect(prs['Squat']).toBe(150)
  })
})

// Test session volume calculation
describe('Session Volume', () => {
  const calculateSessionVolume = (setLogs) => {
    return setLogs.reduce((sum, log) => sum + log.reps * log.weight, 0)
  }

  it('calculates single set volume', () => {
    const sets = [{ reps: 10, weight: 100 }]
    expect(calculateSessionVolume(sets)).toBe(1000)
  })

  it('calculates multiple sets volume', () => {
    const sets = [
      { reps: 10, weight: 100 },
      { reps: 8, weight: 110 },
      { reps: 6, weight: 120 }
    ]
    // 1000 + 880 + 720 = 2600
    expect(calculateSessionVolume(sets)).toBe(2600)
  })

  it('returns 0 for empty sets', () => {
    expect(calculateSessionVolume([])).toBe(0)
  })
})

// Test goal progress calculation
describe('Goal Progress', () => {
  const calculateProgress = (currentWeight, targetWeight) => {
    if (targetWeight <= 0) return 0
    return Math.min(100, Math.round((currentWeight / targetWeight) * 100))
  }

  it('calculates 50% progress', () => {
    expect(calculateProgress(50, 100)).toBe(50)
  })

  it('calculates 100% when achieved', () => {
    expect(calculateProgress(100, 100)).toBe(100)
  })

  it('caps at 100% when exceeded', () => {
    expect(calculateProgress(120, 100)).toBe(100)
  })

  it('returns 0 for invalid target', () => {
    expect(calculateProgress(50, 0)).toBe(0)
  })
})

// Test 1RM calculation formulas
describe('1RM Formulas', () => {
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
    const result = calculate1RM(100, 5)
    expect(result).toBeGreaterThan(110)
    expect(result).toBeLessThan(120)
  })

  it('returns null for invalid input', () => {
    expect(calculate1RM(0, 5)).toBe(null)
    expect(calculate1RM(100, 0)).toBe(null)
    expect(calculate1RM(100, 31)).toBe(null)
  })
})

// Test volume by category (simple grouping)
describe('Volume by Category', () => {
  const calculateVolumeByCategory = (setLogs) => {
    const result = {}
    setLogs.forEach(log => {
      const category = log.category || 'Sin categoría'
      if (!result[category]) result[category] = 0
      result[category] += log.reps * log.weight
    })
    return result
  }

  it('groups volume by category', () => {
    const logs = [
      { category: 'Pecho', reps: 10, weight: 100 },
      { category: 'Pecho', reps: 8, weight: 100 },
      { category: 'Espalda', reps: 10, weight: 80 }
    ]
    const result = calculateVolumeByCategory(logs)
    expect(result['Pecho']).toBe(1800)
    expect(result['Espalda']).toBe(800)
  })

  it('handles missing category', () => {
    const logs = [{ reps: 10, weight: 100 }]
    const result = calculateVolumeByCategory(logs)
    expect(result['Sin categoría']).toBe(1000)
  })
})
