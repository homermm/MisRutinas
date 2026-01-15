import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, GitCompare, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'

export function ComparePage() {
  const [searchParams] = useSearchParams()
  const routineId = searchParams.get('routine')
  
  const [sessions, setSessions] = useState([])
  const [selectedSessions, setSelectedSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [comparison, setComparison] = useState(null)

  useEffect(() => {
    fetchSessions()
  }, [routineId])

  const fetchSessions = async () => {
    try {
      let query = supabase
        .from('sessions')
        .select(`
          id,
          created_at,
          routines (id, name),
          set_logs (
            exercise_id,
            reps,
            weight_kg,
            exercises (name)
          )
        `)
        .order('created_at', { ascending: false })

      if (routineId) {
        query = query.eq('routine_id', routineId)
      }

      const { data, error } = await query

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSession = (sessionId) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId)
      }
      if (prev.length >= 2) {
        return [prev[1], sessionId] // Replace oldest
      }
      return [...prev, sessionId]
    })
  }

  const compareSelected = () => {
    if (selectedSessions.length !== 2) return

    const session1 = sessions.find(s => s.id === selectedSessions[0])
    const session2 = sessions.find(s => s.id === selectedSessions[1])

    // Order by date (older first for comparison)
    const [older, newer] = new Date(session1.created_at) < new Date(session2.created_at)
      ? [session1, session2]
      : [session2, session1]

    // Compare by exercise
    const exerciseComparison = {}
    
    older.set_logs?.forEach(log => {
      const exName = log.exercises?.name
      if (!exerciseComparison[exName]) {
        exerciseComparison[exName] = { older: [], newer: [] }
      }
      exerciseComparison[exName].older.push(log)
    })

    newer.set_logs?.forEach(log => {
      const exName = log.exercises?.name
      if (!exerciseComparison[exName]) {
        exerciseComparison[exName] = { older: [], newer: [] }
      }
      exerciseComparison[exName].newer.push(log)
    })

    // Calculate differences
    const results = Object.entries(exerciseComparison).map(([name, data]) => {
      const olderMaxWeight = Math.max(...data.older.map(l => l.weight_kg), 0)
      const newerMaxWeight = Math.max(...data.newer.map(l => l.weight_kg), 0)
      const olderVolume = data.older.reduce((sum, l) => sum + l.reps * l.weight_kg, 0)
      const newerVolume = data.newer.reduce((sum, l) => sum + l.reps * l.weight_kg, 0)

      return {
        name,
        olderMaxWeight,
        newerMaxWeight,
        weightDiff: newerMaxWeight - olderMaxWeight,
        olderVolume,
        newerVolume,
        volumeDiff: newerVolume - olderVolume
      }
    }).filter(r => r.olderMaxWeight > 0 || r.newerMaxWeight > 0)

    setComparison({
      older,
      newer,
      exercises: results,
      totalOlderVolume: results.reduce((sum, r) => sum + r.olderVolume, 0),
      totalNewerVolume: results.reduce((sum, r) => sum + r.newerVolume, 0)
    })
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short'
    })
  }

  const DiffIndicator = ({ value, unit = '' }) => {
    if (value > 0) return <span className="text-[var(--success)] flex items-center gap-1"><TrendingUp className="w-3 h-3" />+{value}{unit}</span>
    if (value < 0) return <span className="text-[var(--danger)] flex items-center gap-1"><TrendingDown className="w-3 h-3" />{value}{unit}</span>
    return <span className="text-[var(--text-muted)] flex items-center gap-1"><Minus className="w-3 h-3" />0</span>
  }

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/history" className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Comparar Sesiones</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Seleccioná 2 sesiones para comparar
            </p>
          </div>
        </div>
      </div>

      {/* Session Selection */}
      {!comparison && (
        <>
          <div className="card p-4 space-y-2">
            <p className="text-sm text-[var(--text-muted)] mb-3">
              Seleccionadas: {selectedSessions.length}/2
            </p>
            {sessions.map((session) => {
              const isSelected = selectedSessions.includes(session.id)
              const volume = session.set_logs?.reduce((sum, l) => sum + l.reps * l.weight_kg, 0) || 0
              
              return (
                <button
                  key={session.id}
                  onClick={() => toggleSession(session.id)}
                  className={`w-full p-3 rounded-lg flex items-center justify-between transition-colors ${
                    isSelected 
                      ? 'bg-[var(--primary)] text-white' 
                      : 'bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <div className="text-left">
                    <span className="font-medium">{session.routines?.name || 'Rutina'}</span>
                    <span className={`text-sm ml-2 ${isSelected ? 'opacity-70' : 'text-[var(--text-muted)]'}`}>
                      {formatDate(session.created_at)}
                    </span>
                  </div>
                  <span className="text-sm font-bold">{volume.toLocaleString()} kg</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={compareSelected}
            disabled={selectedSessions.length !== 2}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <GitCompare className="w-5 h-5" />
            Comparar
          </button>
        </>
      )}

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="card p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-[var(--text-muted)]">{formatDate(comparison.older.created_at)}</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  {comparison.totalOlderVolume.toLocaleString()} kg
                </p>
              </div>
              <div className="flex items-center justify-center">
                <DiffIndicator value={comparison.totalNewerVolume - comparison.totalOlderVolume} unit=" kg" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">{formatDate(comparison.newer.created_at)}</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  {comparison.totalNewerVolume.toLocaleString()} kg
                </p>
              </div>
            </div>
          </div>

          {/* Exercise by Exercise */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-[var(--text-primary)]">Por Ejercicio</h3>
            {comparison.exercises.map((ex) => (
              <div key={ex.name} className="p-3 rounded-lg bg-[var(--bg-tertiary)]/50">
                <p className="font-medium text-[var(--text-primary)] mb-2">{ex.name}</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-[var(--text-muted)]">Peso máx</p>
                    <p>{ex.olderMaxWeight} → {ex.newerMaxWeight} kg</p>
                    <DiffIndicator value={ex.weightDiff} unit=" kg" />
                  </div>
                  <div className="col-span-2">
                    <p className="text-[var(--text-muted)]">Volumen</p>
                    <p>{ex.olderVolume} → {ex.newerVolume} kg</p>
                    <DiffIndicator value={ex.volumeDiff} unit=" kg" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setComparison(null)}
            className="btn-secondary w-full"
          >
            Nueva comparación
          </button>
        </div>
      )}
    </div>
  )
}
