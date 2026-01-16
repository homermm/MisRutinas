import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Calendar, TrendingUp, Dumbbell, Loader2 } from 'lucide-react'

export function ExerciseHistoryPage() {
  const { exerciseId } = useParams()
  const [exercise, setExercise] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (exerciseId) fetchHistory()
  }, [exerciseId])

  const fetchHistory = async () => {
    try {
      // Get exercise info
      const { data: exerciseData } = await supabase
        .from('exercises')
        .select('id, name, categories(name)')
        .eq('id', exerciseId)
        .single()

      setExercise(exerciseData)

      // Get all set_logs for this exercise with session info
      const { data: logs } = await supabase
        .from('set_logs')
        .select(`
          id,
          reps,
          weight_kg,
          set_number,
          session_id,
          sessions (
            id,
            created_at,
            routines (name)
          )
        `)
        .eq('exercise_id', exerciseId)
        .order('sessions(created_at)', { ascending: false })

      // Group by session
      const sessionMap = new Map()
      logs?.forEach(log => {
        const sessionId = log.session_id
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, {
            id: sessionId,
            date: log.sessions?.created_at,
            routine: log.sessions?.routines?.name || 'Sin rutina',
            sets: []
          })
        }
        sessionMap.get(sessionId).sets.push({
          reps: log.reps,
          weight: log.weight_kg,
          setNumber: log.set_number
        })
      })

      // Convert to array and calculate stats
      const sessionsArray = Array.from(sessionMap.values()).map(session => ({
        ...session,
        maxWeight: Math.max(...session.sets.map(s => s.weight)),
        totalVolume: session.sets.reduce((sum, s) => sum + s.reps * s.weight, 0),
        setsCount: session.sets.length
      }))

      setHistory(sessionsArray)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Calculate overall stats
  const overallStats = history.length > 0 ? {
    totalSessions: history.length,
    allTimeMax: Math.max(...history.map(h => h.maxWeight)),
    avgVolume: Math.round(history.reduce((sum, h) => sum + h.totalVolume, 0) / history.length),
    trend: history.length >= 2 ? history[0].maxWeight - history[history.length - 1].maxWeight : 0
  } : null

  // Get last 10 sessions for chart
  const chartData = history.slice(0, 10).reverse()
  const maxChartWeight = chartData.length > 0 ? Math.max(...chartData.map(d => d.maxWeight)) : 100

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
        <Link to="/history" className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {exercise?.name || 'Ejercicio'}
          </h1>
          <p className="text-[var(--text-muted)]">
            {exercise?.categories?.name || 'Sin categoría'}
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      {overallStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4 text-center">
            <Calendar className="w-5 h-5 text-[var(--primary)] mx-auto mb-1" />
            <p className="text-xl font-bold text-[var(--text-primary)]">{overallStats.totalSessions}</p>
            <p className="text-xs text-[var(--text-muted)]">Sesiones</p>
          </div>
          <div className="card p-4 text-center">
            <Dumbbell className="w-5 h-5 text-[var(--success)] mx-auto mb-1" />
            <p className="text-xl font-bold text-[var(--text-primary)]">{overallStats.allTimeMax} kg</p>
            <p className="text-xs text-[var(--text-muted)]">Máximo</p>
          </div>
          <div className="card p-4 text-center">
            <TrendingUp className="w-5 h-5 text-[var(--warning)] mx-auto mb-1" />
            <p className="text-xl font-bold text-[var(--text-primary)]">{overallStats.avgVolume}</p>
            <p className="text-xs text-[var(--text-muted)]">Vol. promedio</p>
          </div>
          <div className="card p-4 text-center">
            <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${overallStats.trend >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`} />
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {overallStats.trend >= 0 ? '+' : ''}{overallStats.trend} kg
            </p>
            <p className="text-xs text-[var(--text-muted)]">Progreso</p>
          </div>
        </div>
      )}

      {/* Weight Progression Chart */}
      {chartData.length > 1 && (
        <div className="card p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Progresión de Peso</h3>
          <div className="h-40 flex items-end gap-2">
            {chartData.map((session, index) => (
              <div key={session.id} className="flex-1 flex flex-col items-center">
                <span className="text-xs text-[var(--text-muted)] mb-1">{session.maxWeight}</span>
                <div 
                  className="w-full bg-[var(--primary)] rounded-t transition-all hover:bg-[var(--primary-hover)]"
                  style={{ height: `${(session.maxWeight / maxChartWeight) * 100}%`, minHeight: '8px' }}
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-1 truncate w-full text-center">
                  {new Date(session.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session History */}
      <div className="card p-4">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">Historial de Sesiones</h3>
        
        {history.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] py-8">
            No hay registros de este ejercicio
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((session) => (
              <div key={session.id} className="p-3 rounded-lg bg-[var(--bg-tertiary)]/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{session.routine}</p>
                    <p className="text-sm text-[var(--text-muted)]">{formatDate(session.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--primary)]">{session.maxWeight} kg</p>
                    <p className="text-xs text-[var(--text-muted)]">máx</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {session.sets.map((set, idx) => (
                    <span 
                      key={idx} 
                      className={`text-xs px-2 py-1 rounded ${
                        set.weight === session.maxWeight 
                          ? 'bg-[var(--primary)] text-white' 
                          : 'bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      {set.weight}kg × {set.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
