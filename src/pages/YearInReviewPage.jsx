import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Trophy, Calendar, Dumbbell, Flame, Star, TrendingUp, Loader2 } from 'lucide-react'

export function YearInReviewPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchYearStats()
  }, [year])

  const fetchYearStats = async () => {
    try {
      const startOfYear = new Date(year, 0, 1).toISOString()
      const endOfYear = new Date(year, 11, 31, 23, 59, 59).toISOString()

      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id,
          created_at,
          duration_seconds,
          routines (name),
          set_logs (
            reps,
            weight_kg,
            exercises (name)
          )
        `)
        .gte('created_at', startOfYear)
        .lte('created_at', endOfYear)
        .order('created_at', { ascending: true })

      if (!sessions || sessions.length === 0) {
        setStats(null)
        setLoading(false)
        return
      }

      // Calculate stats
      let totalVolume = 0
      let totalSets = 0
      let totalTime = 0
      const exerciseCounts = {}
      const routineCounts = {}
      const monthlyVolume = {}
      const prs = {}
      
      // Streak calculation
      const sessionDates = new Set()

      sessions.forEach(session => {
        const dateKey = new Date(session.created_at).toDateString()
        sessionDates.add(dateKey)
        
        totalTime += session.duration_seconds || 0
        
        const routineName = session.routines?.name || 'Sin rutina'
        routineCounts[routineName] = (routineCounts[routineName] || 0) + 1
        
        const month = new Date(session.created_at).toLocaleDateString('es-AR', { month: 'short' })
        monthlyVolume[month] = monthlyVolume[month] || 0

        session.set_logs?.forEach(log => {
          const volume = log.reps * log.weight_kg
          totalVolume += volume
          totalSets++
          monthlyVolume[month] += volume
          
          const exName = log.exercises?.name || 'Ejercicio'
          exerciseCounts[exName] = (exerciseCounts[exName] || 0) + 1
          
          // Track PRs
          if (!prs[exName] || log.weight_kg > prs[exName].weight) {
            prs[exName] = { weight: log.weight_kg, date: session.created_at }
          }
        })
      })

      // Calculate longest streak
      let maxStreak = 0
      let currentStreak = 0
      const sortedDates = Array.from(sessionDates).map(d => new Date(d)).sort((a, b) => a - b)
      
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          currentStreak = 1
        } else {
          const diff = (sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24)
          if (diff <= 2) { // Allow 1 day gap for rest days
            currentStreak++
          } else {
            currentStreak = 1
          }
        }
        maxStreak = Math.max(maxStreak, currentStreak)
      }

      // Top exercise
      const topExercise = Object.entries(exerciseCounts)
        .sort((a, b) => b[1] - a[1])[0]

      // Top routine
      const topRoutine = Object.entries(routineCounts)
        .sort((a, b) => b[1] - a[1])[0]

      // PR count
      const prCount = Object.keys(prs).length

      // Best PR
      const bestPR = Object.entries(prs)
        .sort((a, b) => b[1].weight - a[1].weight)[0]

      setStats({
        totalSessions: sessions.length,
        totalVolume,
        totalSets,
        totalHours: Math.round(totalTime / 3600),
        topExercise: topExercise ? { name: topExercise[0], count: topExercise[1] } : null,
        topRoutine: topRoutine ? { name: topRoutine[0], count: topRoutine[1] } : null,
        longestStreak: maxStreak,
        prCount,
        bestPR: bestPR ? { name: bestPR[0], weight: bestPR[1].weight } : null,
        monthlyVolume
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
    return num.toString()
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
          <Link to="/stats" className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Resumen del Año</h1>
        </div>
      </div>

      {/* Year selector */}
      <div className="flex gap-2">
        {[2024, 2025, 2026].map(y => (
          <button
            key={y}
            onClick={() => { setLoading(true); setYear(y) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              year === y 
                ? 'bg-[var(--primary)] text-white' 
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {!stats ? (
        <div className="card p-8 text-center">
          <Calendar className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">No hay datos para {year}</p>
        </div>
      ) : (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 text-center bg-gradient-to-br from-[var(--primary)]/20 to-transparent">
              <Calendar className="w-6 h-6 text-[var(--primary)] mx-auto mb-2" />
              <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalSessions}</p>
              <p className="text-sm text-[var(--text-muted)]">Sesiones</p>
            </div>
            <div className="card p-4 text-center bg-gradient-to-br from-[var(--success)]/20 to-transparent">
              <Dumbbell className="w-6 h-6 text-[var(--success)] mx-auto mb-2" />
              <p className="text-3xl font-bold text-[var(--text-primary)]">{formatNumber(stats.totalVolume)}</p>
              <p className="text-sm text-[var(--text-muted)]">kg Totales</p>
            </div>
            <div className="card p-4 text-center bg-gradient-to-br from-[var(--warning)]/20 to-transparent">
              <Flame className="w-6 h-6 text-[var(--warning)] mx-auto mb-2" />
              <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.longestStreak}</p>
              <p className="text-sm text-[var(--text-muted)]">Mejor racha (días)</p>
            </div>
            <div className="card p-4 text-center bg-gradient-to-br from-[var(--danger)]/20 to-transparent">
              <Trophy className="w-6 h-6 text-[var(--danger)] mx-auto mb-2" />
              <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.prCount}</p>
              <p className="text-sm text-[var(--text-muted)]">PRs Logrados</p>
            </div>
          </div>

          {/* Highlights */}
          <div className="card p-4 space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Star className="w-5 h-5 text-[var(--warning)]" />
              Highlights de {year}
            </h3>
            
            {stats.topExercise && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/50">
                <span className="text-[var(--text-secondary)]">Ejercicio favorito</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {stats.topExercise.name} ({stats.topExercise.count}x)
                </span>
              </div>
            )}
            
            {stats.topRoutine && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/50">
                <span className="text-[var(--text-secondary)]">Rutina más usada</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {stats.topRoutine.name} ({stats.topRoutine.count}x)
                </span>
              </div>
            )}
            
            {stats.bestPR && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/50">
                <span className="text-[var(--text-secondary)]">Mejor PR</span>
                <span className="font-medium text-[var(--primary)]">
                  {stats.bestPR.name}: {stats.bestPR.weight} kg
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/50">
              <span className="text-[var(--text-secondary)]">Series totales</span>
              <span className="font-medium text-[var(--text-primary)]">{formatNumber(stats.totalSets)}</span>
            </div>

            {stats.totalHours > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/50">
                <span className="text-[var(--text-secondary)]">Horas entrenando</span>
                <span className="font-medium text-[var(--text-primary)]">{stats.totalHours}h</span>
              </div>
            )}
          </div>

          {/* Monthly Volume Chart */}
          {Object.keys(stats.monthlyVolume).length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                Volumen Mensual
              </h3>
              <div className="h-32 flex items-end gap-1">
                {Object.entries(stats.monthlyVolume).map(([month, volume]) => {
                  const maxVol = Math.max(...Object.values(stats.monthlyVolume))
                  const height = maxVol > 0 ? (volume / maxVol) * 100 : 0
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-[var(--primary)] rounded-t"
                        style={{ height: `${height}%`, minHeight: volume > 0 ? '4px' : '0' }}
                      />
                      <span className="text-[9px] text-[var(--text-muted)] mt-1">{month}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
