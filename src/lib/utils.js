/**
 * Calculate total volume for a set of exercises
 * Volume = Σ(weight_kg × reps)
 */
export function calculateVolume(sets) {
  return sets.reduce((total, set) => {
    return total + (set.weight_kg * set.reps)
  }, 0)
}

/**
 * Format weight with kg suffix
 */
export function formatWeight(weight) {
  return `${weight} kg`
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Generate a unique ID
 */
export function generateId() {
  return crypto.randomUUID()
}

/**
 * Delay utility for async operations
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Class name utility (simple clsx alternative)
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Format large numbers with K/M suffix
 */
export function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

/**
 * Debounce function for search inputs
 */
export function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Calculate 1RM (One Rep Max) using Epley formula
 * Formula: weight × (1 + reps/30)
 * Best for reps > 1
 */
export function calculate1RMEpley(weight, reps) {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

/**
 * Calculate 1RM using Brzycki formula
 * Formula: weight × (36 / (37 - reps))
 * Most accurate for reps < 10
 */
export function calculate1RMBrzycki(weight, reps) {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  if (reps >= 37) return weight * 2 // Prevent division by zero/negative
  return Math.round(weight * (36 / (37 - reps)) * 10) / 10
}

/**
 * Calculate 1RM average of Epley and Brzycki formulas
 * Returns more balanced estimate
 */
export function calculate1RM(weight, reps) {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  const epley = calculate1RMEpley(weight, reps)
  const brzycki = calculate1RMBrzycki(weight, reps)
  return Math.round((epley + brzycki) / 2 * 10) / 10
}

/**
 * Calculate percentage of 1RM for different rep ranges
 */
export function getRepPercentages(oneRM) {
  return [
    { reps: 1, percent: 100, weight: oneRM },
    { reps: 2, percent: 95, weight: Math.round(oneRM * 0.95) },
    { reps: 3, percent: 93, weight: Math.round(oneRM * 0.93) },
    { reps: 4, percent: 90, weight: Math.round(oneRM * 0.90) },
    { reps: 5, percent: 87, weight: Math.round(oneRM * 0.87) },
    { reps: 6, percent: 85, weight: Math.round(oneRM * 0.85) },
    { reps: 8, percent: 80, weight: Math.round(oneRM * 0.80) },
    { reps: 10, percent: 75, weight: Math.round(oneRM * 0.75) },
    { reps: 12, percent: 70, weight: Math.round(oneRM * 0.70) },
    { reps: 15, percent: 65, weight: Math.round(oneRM * 0.65) },
  ]
}

