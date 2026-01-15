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
