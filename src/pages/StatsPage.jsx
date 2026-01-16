import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Trophy, TrendingUp, Calendar, Dumbbell, Loader2, ChevronRight, Target, PieChart, Star } from 'lucide-react'

export function StatsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalVolume: 0,
    weeklyVolume: [],
    prs: [],
    routineFrequency: []
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch all sessions with set_logs
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          created_at,
          routines (name),
          set_logs (
            reps,
            weight_kg,
            exercise_id,
            exercises (name)
          )
        `)
        .order('created_at', { ascending: false })

      if (sessionsError) throw sessionsError

      // Calculate stats
      const totalSessions = sessions?.length || 0
      let totalVolume = 0
      const prsByExercise = {}
      const routineCounts = {}
      const weeklyData = {}

      sessions?.forEach(session => {
        const routineName = session.routines?.name || 'Sin rutina'
        routineCounts[routineName] = (routineCounts[routineName] || 0) + 1

        // Weekly volume
        const weekStart = getWeekStart(new Date(session.created_at))
        const weekKey = weekStart.toISOString().split('T')[0]
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { week: weekKey, volume: 0 }
        }

        session.set_logs?.forEach(log => {
          const volume = log.reps * log.weight_kg
          totalVolume += volume
          weeklyData[weekKey].volume += volume

          // Track PRs (max weight for each exercise)
          const exId = log.exercise_id
          const exName = log.exercises?.name || 'Ejercicio'
          if (!prsByExercise[exId]) {
            prsByExercise[exId] = { name: exName, maxWeight: 0, maxVolume: 0, history: [] }
          }
          if (log.weight_kg > prsByExercise[exId].maxWeight) {
            prsByExercise[exId].maxWeight = log.weight_kg
          }
          prsByExercise[exId].maxVolume = Math.max(
            prsByExercise[exId].maxVolume,
            log.reps * log.weight_kg
          )
          prsByExercise[exId].history.push({
            date: session.created_at,
            weight: log.weight_kg,
            reps: log.reps
          })
        })
      })

      // Sort PRs by max weight
      const prs = Object.entries(prsByExercise)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.maxWeight - a.maxWeight)
        .slice(0, 10)

      // Routine frequency
      const routineFrequency = Object.entries(routineCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Weekly volume (last 8 weeks)
      const weeklyVolume = Object.values(weeklyData)
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-8)

      setStats({
        totalSessions,
        totalVolume,
        weeklyVolume,
        prs,
        routineFrequency
      })

    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const maxWeeklyVolume = Math.max(...stats.weeklyVolume.map(w => w.volume), 1)

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
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Estadísticas</h1>
          <p className="text-[var(--text-secondary)] mt-1">Tu progreso de entrenamiento</p>
        </div>
        <Link to="/goals" className="btn-primary flex items-center gap-2">
          <Target className="w-5 h-5" />
          <span className="hidden sm:inline">Metas</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--primary)]/20">
              <Calendar className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalSessions}</p>
              <p className="text-sm text-[var(--text-muted)]">Sesiones</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--success)]/20">
              <TrendingUp className="w-5 h-5 text-[var(--success)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{formatNumber(stats.totalVolume)}</p>
              <p className="text-sm text-[var(--text-muted)]">kg Totales</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Analytics Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link 
          to="/stats/muscle-volume" 
          className="card p-4 flex items-center gap-3 hover:border-[var(--primary)] transition-colors"
        >
          <div className="p-2 rounded-lg bg-[var(--warning)]/20">
            <PieChart className="w-5 h-5 text-[var(--warning)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">Por Músculo</p>
            <p className="text-xs text-[var(--text-muted)]">Distribución de volumen</p>
          </div>
        </Link>
        <Link 
          to="/stats/year-review" 
          className="card p-4 flex items-center gap-3 hover:border-[var(--primary)] transition-colors"
        >
          <div className="p-2 rounded-lg bg-[var(--danger)]/20">
            <Star className="w-5 h-5 text-[var(--danger)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">Resumen Anual</p>
            <p className="text-xs text-[var(--text-muted)]">Year in Review</p>
          </div>
        </Link>
      </div>

      {/* Weekly Volume Chart */}
      {stats.weeklyVolume.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Volumen Semanal</h3>
          <div className="flex items-end gap-2 h-32">
            {stats.weeklyVolume.map((week, index) => (
              <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-[var(--primary)] rounded-t transition-all"
                  style={{ height: `${(week.volume / maxWeeklyVolume) * 100}%`, minHeight: '4px' }}
                />
                <span className="text-[10px] text-[var(--text-muted)]">
                  S{index + 1}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2 text-center">Últimas 8 semanas</p>
        </div>
      )}

      {/* Personal Records */}
      <div className="card p-4">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[var(--warning)]" />
          Records Personales (Top 10)
        </h3>
        {stats.prs.length === 0 ? (
          <p className="text-[var(--text-muted)] text-center py-4">
            Completá sesiones para ver tus PRs
          </p>
        ) : (
          <div className="space-y-2">
            {stats.prs.map((pr, index) => (
              <Link
                key={pr.id}
                to={`/exercise/${pr.id}`}
                className="rounded-lg bg-[var(--bg-tertiary)]/50 p-3 flex items-center justify-between hover:bg-[var(--bg-tertiary)] transition-colors block"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-[var(--warning)] text-black' :
                    index === 1 ? 'bg-gray-300 text-black' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-[var(--bg-tertiary)]'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">{pr.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[var(--primary)]">{pr.maxWeight} kg</span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Routine Frequency */}
      {stats.routineFrequency.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[var(--primary)]" />
            Rutinas más usadas
          </h3>
          <div className="space-y-2">
            {stats.routineFrequency.map((routine) => (
              <div key={routine.name} className="flex items-center justify-between p-2 rounded bg-[var(--bg-tertiary)]/50">
                <span className="text-[var(--text-primary)]">{routine.name}</span>
                <span className="text-sm font-medium text-[var(--text-secondary)]">{routine.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
