import { useState, useEffect, useCallback } from 'react'
import { X, Play, Pause, RotateCcw } from 'lucide-react'
import { formatTime } from '../../lib/utils'
import { REST_TIMER_PRESETS } from '../../lib/constants'

export function RestTimer({ onClose, embedded = false }) {
  const [timeLeft, setTimeLeft] = useState(90)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(90)

  useEffect(() => {
    let interval = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            // Play notification sound
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp2Nf3V2go2WnZqRhHx6gYqQko2GfXl4fYWLjouFfnl3eX6EiIiEfnl3d3t/goSCf3t4dnh7fn+Af3x5d3d4ent8fHt5eHd3eHl6enp5eHd3d3h5eXl5eHd3d3h5eXl5eHd3d3h5eXl5eHd3d3h5eXl5eHd2d3h5eXl5eHd3d3h5eXl5eHd3d3h5eXl5eHd3d3h5eXl5eHd3d3h5eXl5eHd3d3h5eXl5eHd3d3h5eXl5eHd3d3h5eXl5eHd3d3h5eXl5eHd3')
              audio.play()
            } catch (e) {
              // Vibrate on mobile
              if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200])
              }
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft])

  const selectPreset = (seconds) => {
    setSelectedPreset(seconds)
    setTimeLeft(seconds)
    setIsRunning(true)
  }

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setTimeLeft(selectedPreset)
    setIsRunning(false)
  }

  const progress = (timeLeft / selectedPreset) * 100

  const content = (
    <div className={embedded ? "card p-6 w-full max-w-sm" : "card p-6 w-full max-w-sm fade-in"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Descanso
        </h3>
        {!embedded && onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Timer Display */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        {/* Progress Ring */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth="8"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={553}
            strokeDashoffset={553 - (553 * progress) / 100}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Time */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-5xl font-bold ${timeLeft === 0 ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={resetTimer}
          className="p-4 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--border)] transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
        <button
          onClick={toggleTimer}
          className="p-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors"
        >
          {isRunning ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-4 gap-2">
        {REST_TIMER_PRESETS.map((seconds) => (
          <button
            key={seconds}
            onClick={() => selectPreset(seconds)}
            className={`py-3 px-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPreset === seconds
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {formatTime(seconds)}
          </button>
        ))}
      </div>
    </div>
  )

  // If embedded, render directly without modal wrapper
  if (embedded) {
    return content
  }

  // Render as modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {content}
    </div>
  )
}
