import { useAuth } from '../context/AuthContext'
import { Play, Plus, TrendingUp, Calendar, Flame, Target, Calculator } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalRoutines: 0,
    totalExercises: 0,
    totalSessions: 0,
    recentRoutines: [],
    streak: 0,
    lastSessionDate: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [routinesRes, exercisesRes, sessionsRes] = await Promise.all([
        supabase.from('routines').select('id, name', { count: 'exact' }),
        supabase.from('exercises').select('id', { count: 'exact' }),
        supabase.from('sessions').select('id, created_at', { count: 'exact' }).order('created_at', { ascending: false })
      ])

      // Calculate streak
      const streak = calculateStreak(sessionsRes.data || [])
      const lastSession = sessionsRes.data?.[0]

      setStats({
        totalRoutines: routinesRes.count || 0,
        totalExercises: exercisesRes.count || 0,
        totalSessions: sessionsRes.count || 0,
        recentRoutines: routinesRes.data?.slice(0, 3) || [],
        streak,
        lastSessionDate: lastSession?.created_at
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate weekly streak (number of consecutive weeks with at least one session)
  const calculateStreak = (sessions) => {
    if (!sessions.length) return 0

    const today = new Date()
    const getWeekNumber = (date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() + 4 - (d.getDay() || 7))
      const yearStart = new Date(d.getFullYear(), 0, 1)
      return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    }

    // Get unique weeks with sessions
    const weeksWithSessions = new Set()
    sessions.forEach(s => {
      const d = new Date(s.created_at)
      const weekKey = `${d.getFullYear()}-${getWeekNumber(d)}`
      weeksWithSessions.add(weekKey)
    })

    // Count consecutive weeks from current
    let streak = 0
    let currentWeek = getWeekNumber(today)
    let currentYear = today.getFullYear()

    for (let i = 0; i < 52; i++) {
      const weekKey = `${currentYear}-${currentWeek}`
      if (weeksWithSessions.has(weekKey)) {
        streak++
        currentWeek--
        if (currentWeek === 0) {
          currentYear--
          currentWeek = 52
        }
      } else if (i === 0) {
        // Allow current week to be empty if we're still in it
        currentWeek--
        if (currentWeek === 0) {
          currentYear--
          currentWeek = 52
        }
      } else {
        break
      }
    }

    return streak
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {greeting()} 👋
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          ¿Listo para entrenar?
        </p>
      </div>

      {/* Stats Grid */}
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
            <div className={`p-2 rounded-lg ${stats.streak > 0 ? 'bg-[var(--danger)]/20' : 'bg-[var(--bg-tertiary)]'}`}>
              <Flame className={`w-5 h-5 ${stats.streak > 0 ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.streak}</p>
              <p className="text-sm text-[var(--text-muted)]">Semanas 🔥</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--success)]/20">
              <TrendingUp className="w-5 h-5 text-[var(--success)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalRoutines}</p>
              <p className="text-sm text-[var(--text-muted)]">Rutinas</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--warning)]/20">
              <Play className="w-5 h-5 text-[var(--warning)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalExercises}</p>
              <p className="text-sm text-[var(--text-muted)]">Ejercicios</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/routines')}
            className="card p-4 flex flex-col items-center gap-2 hover:border-[var(--primary)] transition-colors"
          >
            <Play className="w-6 h-6 text-[var(--primary)]" />
            <span className="font-medium text-sm">Entrenar</span>
          </button>
          <Link
            to="/calculator"
            className="card p-4 flex flex-col items-center gap-2 hover:border-[var(--primary)] transition-colors"
          >
            <Calculator className="w-6 h-6 text-[var(--warning)]" />
            <span className="font-medium text-sm">1RM</span>
          </Link>
          <Link
            to="/goals"
            className="card p-4 flex flex-col items-center gap-2 hover:border-[var(--primary)] transition-colors"
          >
            <Target className="w-6 h-6 text-[var(--success)]" />
            <span className="font-medium text-sm">Metas</span>
          </Link>
        </div>
      </div>

      {/* Recent Routines */}
      {stats.recentRoutines.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
            Tus Rutinas
          </h2>
          <div className="space-y-2">
            {stats.recentRoutines.map((routine) => (
              <button
                key={routine.id}
                onClick={() => navigate(`/session/${routine.id}`)}
                className="card p-4 w-full flex items-center justify-between hover:border-[var(--primary)] transition-colors"
              >
                <span className="font-medium">{routine.name}</span>
                <Play className="w-5 h-5 text-[var(--primary)]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && stats.totalRoutines === 0 && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            ¡Empecemos!
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Creá tu primera categoría y ejercicios para armar tus rutinas.
          </p>
          <button
            onClick={() => navigate('/library')}
            className="btn-primary"
          >
            Crear Categoría
          </button>
        </div>
      )}
    </div>
  )
}
