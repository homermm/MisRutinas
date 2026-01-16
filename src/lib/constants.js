export const REST_TIMER_PRESETS = [60, 90, 120, 150]

// Set adjustment increments
export const WEIGHT_INCREMENT = 2.5
export const REPS_INCREMENT = 1

// Set types for advanced training techniques
export const SET_TYPES = {
  normal: { label: 'Normal', icon: null, color: null },
  warmup: { label: 'Warmup', icon: '🔥', color: 'var(--warning)' },
  dropset: { label: 'Drop Set', icon: '⬇️', color: 'var(--danger)' },
  restpause: { label: 'Rest-Pause', icon: '⏸️', color: 'var(--primary)' },
}

export const NAV_ITEMS = [
  { path: '/', label: 'Inicio', icon: 'Home' },
  { path: '/routines', label: 'Rutinas', icon: 'Dumbbell' },
  { path: '/exercises', label: 'Ejercicios', icon: 'ListChecks' },
  { path: '/categories', label: 'Categorías', icon: 'FolderOpen' },
]

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
}
