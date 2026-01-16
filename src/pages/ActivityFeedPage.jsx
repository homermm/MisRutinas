import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Activity, Dumbbell, Trophy, Calendar, Loader2, Heart, MessageCircle, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatNumber } from '../lib/utils'

/**
 * Activity Feed - Shows recent activity from friends
 */
export function ActivityFeedPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivity()
  }, [])

  const fetchActivity = async () => {
    try {
      // Get accepted friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted')

      // Get friend IDs
      const friendIds = new Set()
      friendships?.forEach(f => {
        if (f.user_id !== user.id) friendIds.add(f.user_id)
        if (f.friend_id !== user.id) friendIds.add(f.friend_id)
      })
      const allUserIds = [user.id, ...Array.from(friendIds)]

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', allUserIds)

      const profileMap = {}
      profiles?.forEach(p => {
        profileMap[p.id] = p
      })

      // Get recent sessions with set logs
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id,
          user_id,
          created_at,
          completed_at,
          routines(name),
          set_logs(weight_kg, reps, exercises(name))
        `)
        .in('user_id', allUserIds)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(30)

      // Transform to activity items
      const activityItems = sessions?.map(session => {
        const totalVolume = session.set_logs?.reduce((sum, log) => 
          sum + (log.weight_kg * log.reps), 0) || 0
        const exerciseCount = new Set(session.set_logs?.map(l => l.exercises?.name)).size
        const setCount = session.set_logs?.length || 0
        
        // Find max weight for PR detection
        const maxWeight = Math.max(...(session.set_logs?.map(l => l.weight_kg) || [0]))

        return {
          id: session.id,
          type: 'workout',
          userId: session.user_id,
          profile: profileMap[session.user_id] || { username: 'Usuario' },
          date: session.completed_at,
          routineName: session.routines?.name || 'Entrenamiento',
          totalVolume,
          exerciseCount,
          setCount,
          maxWeight,
          isMe: session.user_id === user.id
        }
      }) || []

      setActivities(activityItems)
    } catch (error) {
      console.error('Error fetching activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins}m`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Activity className="w-6 h-6 text-[var(--primary)]" />
          Actividad
        </h1>
        <p className="text-[var(--text-muted)]">
          Últimos entrenamientos de tus amigos
        </p>
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="card p-8 text-center">
          <User className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">
            No hay actividad reciente
          </p>
          <Link to="/friends" className="btn-primary mt-4 inline-block">
            Agregar amigos
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map(activity => (
            <div 
              key={activity.id} 
              className={`card p-4 ${activity.isMe ? 'border-[var(--primary)]/30' : ''}`}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                  <User className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
                <div className="flex-1">
                  <Link 
                    to={`/u/${activity.profile.username}`}
                    className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)]"
                  >
                    {activity.profile.display_name || activity.profile.username}
                    {activity.isMe && <span className="text-[var(--primary)] ml-1">(Tú)</span>}
                  </Link>
                  <div className="text-xs text-[var(--text-muted)]">
                    {formatTimeAgo(activity.date)}
                  </div>
                </div>
                <Dumbbell className="w-5 h-5 text-[var(--primary)]" />
              </div>

              {/* Content */}
              <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 mb-3">
                <div className="font-medium text-[var(--text-primary)] mb-2">
                  {activity.routineName}
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="text-[var(--text-muted)]">
                    <strong className="text-[var(--text-primary)]">{activity.exerciseCount}</strong> ejercicios
                  </span>
                  <span className="text-[var(--text-muted)]">
                    <strong className="text-[var(--text-primary)]">{activity.setCount}</strong> series
                  </span>
                  <span className="text-[var(--text-muted)]">
                    <strong className="text-[var(--text-primary)]">{formatNumber(activity.totalVolume)}</strong> kg vol.
                  </span>
                </div>
              </div>

              {/* Actions (placeholder for future) */}
              <div className="flex items-center gap-4 text-[var(--text-muted)]">
                <button className="flex items-center gap-1 hover:text-[var(--danger)] transition-colors">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs">Me gusta</span>
                </button>
                <button className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">Comentar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
