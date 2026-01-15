import { useState } from 'react'
import { RestTimer } from '../components/workout/RestTimer'
import { Timer, X } from 'lucide-react'

export function TimerPage() {
  const [showTimer, setShowTimer] = useState(true)

  if (!showTimer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--primary)]/20 flex items-center justify-center mb-6">
          <Timer className="w-10 h-10 text-[var(--primary)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Cronómetro de Descanso
        </h2>
        <p className="text-[var(--text-secondary)] mb-6">
          Usalo para controlar tus tiempos de descanso entre series
        </p>
        <button
          onClick={() => setShowTimer(true)}
          className="btn-primary"
        >
          Abrir Cronómetro
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <RestTimer onClose={() => setShowTimer(false)} embedded />
    </div>
  )
}
