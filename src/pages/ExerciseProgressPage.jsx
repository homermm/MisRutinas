import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, TrendingUp, Trophy, Calculator, Loader2 } from 'lucide-react'

export function ExerciseProgressPage() {
  const { exerciseId } = useParams()
  const [exercise, setExercise] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [oneRMWeight, setOneRMWeight] = useState('')
  const [oneRMReps, setOneRMReps] = useState('')

  useEffect(() => {
    fetchData()
  }, [exerciseId])

  const fetchData = async () => {
    try {
      // Get exercise info
      const { data: exData } = await supabase
        .from('exercises')
        .select('*, categories(name)')
        .eq('id', exerciseId)
        .single()

      setExercise(exData)

      // Get all set_logs for this exercise
      const { data: logs } = await supabase
        .from('set_logs')
        .select(`
          *,
          sessions (created_at)
        `)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: true })

      // Group by session date and get max weight per session
      const byDate = {}
      logs?.forEach(log => {
        const date = log.sessions?.created_at?.split('T')[0]
        if (!date) return
        if (!byDate[date]) {
          byDate[date] = { date, maxWeight: 0, maxVolume: 0, sets: [] }
        }
        byDate[date].maxWeight = Math.max(byDate[date].maxWeight, log.weight_kg)
        byDate[date].maxVolume = Math.max(byDate[date].maxVolume, log.weight_kg * log.reps)
        byDate[date].sets.push(log)
      })

      setHistory(Object.values(byDate).slice(-20)) // Last 20 sessions

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate 1RM using Brzycki formula: weight × (36 / (37 - reps))
  const calculate1RM = () => {
    const weight = parseFloat(oneRMWeight)
    const reps = parseInt(oneRMReps)
    if (!weight || !reps || reps > 30 || reps < 1) return null
    
    // Different formulas for different rep ranges
    if (reps === 1) return weight
    
    // Brzycki formula (most accurate for <10 reps)
    const brzycki = weight * (36 / (37 - reps))
    
    // Epley formula (better for higher reps)
    const epley = weight * (1 + reps / 30)
    
    // Average of both
    return Math.round((brzycki + epley) / 2)
  }

  const estimated1RM = calculate1RM()

  // Get PR from history
  const pr = history.length > 0 
    ? Math.max(...history.map(h => h.maxWeight))
    : 0

  const maxChartWeight = Math.max(...history.map(h => h.maxWeight), 1)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/stats" className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {exercise?.name}
          </h1>
          <p className="text-[var(--text-secondary)]">
            {exercise?.categories?.name}
          </p>
        </div>
      </div>

      {/* PR Card */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-[var(--warning)]/20">
            <Trophy className="w-6 h-6 text-[var(--warning)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)]">Record Personal</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{pr} kg</p>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      {history.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
            Progresión de Peso
          </h3>
          <div className="flex items-end gap-1 h-40">
            {history.map((session, index) => {
              const height = (session.maxWeight / maxChartWeight) * 100
              const isPR = session.maxWeight === pr
              return (
                <div key={session.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {session.maxWeight}
                  </span>
                  <div 
                    className={`w-full rounded-t transition-all ${
                      isPR ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]'
                    }`}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                    title={`${session.date}: ${session.maxWeight}kg`}
                  />
                </div>
              )
            })}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
            Últimas {history.length} sesiones • Las barras doradas son PRs
          </p>
        </div>
      )}

      {/* 1RM Calculator */}
      <div className="card p-4">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[var(--success)]" />
          Calculadora 1RM
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-sm text-[var(--text-muted)] block mb-1">Peso (kg)</label>
            <input
              type="number"
              value={oneRMWeight}
              onChange={(e) => setOneRMWeight(e.target.value)}
              className="input py-2"
              placeholder="80"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--text-muted)] block mb-1">Repeticiones</label>
            <input
              type="number"
              value={oneRMReps}
              onChange={(e) => setOneRMReps(e.target.value)}
              className="input py-2"
              placeholder="5"
              min="1"
              max="30"
            />
          </div>
        </div>
        
        {estimated1RM && (
          <div className="p-4 rounded-lg bg-[var(--success)]/10 text-center">
            <p className="text-sm text-[var(--text-muted)]">1RM Estimado</p>
            <p className="text-3xl font-bold text-[var(--success)]">{estimated1RM} kg</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Basado en fórmulas Brzycki y Epley
            </p>
          </div>
        )}

        {/* Rep max table */}
        {estimated1RM && (
          <div className="mt-4">
            <p className="text-sm text-[var(--text-muted)] mb-2">Tabla de repeticiones</p>
            <div className="grid grid-cols-5 gap-1 text-center text-sm">
              {[1, 3, 5, 8, 10].map(reps => {
                const percentage = reps === 1 ? 100 : reps === 3 ? 93 : reps === 5 ? 87 : reps === 8 ? 80 : 75
                const weight = Math.round(estimated1RM * percentage / 100)
                return (
                  <div key={reps} className="p-2 rounded bg-[var(--bg-tertiary)]">
                    <p className="font-bold text-[var(--text-primary)]">{weight}kg</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{reps} rep</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* History List */}
      {history.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Historial</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...history].reverse().map((session) => (
              <div key={session.date} className="flex items-center justify-between p-2 rounded bg-[var(--bg-tertiary)]/50">
                <span className="text-sm text-[var(--text-muted)]">
                  {new Date(session.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                </span>
                <div className="text-right">
                  <span className="font-medium text-[var(--text-primary)]">{session.maxWeight} kg</span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">{session.sets.length} series</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
