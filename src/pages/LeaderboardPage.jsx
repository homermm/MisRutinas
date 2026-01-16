import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Trophy, Medal, Crown, Loader2, ChevronRight, Dumbbell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/**
 * Leaderboard - Shows PR rankings among friends
 */
export function LeaderboardPage() {
  const { user } = useAuth()
  const [leaderboards, setLeaderboards] = useState({})
  const [exercises, setExercises] = useState([])
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboards()
  }, [])

  const fetchLeaderboards = async () => {
    try {
      // Get accepted friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted')

      // Get all relevant user IDs (me + friends)
      const friendIds = new Set([user.id])
      friendships?.forEach(f => {
        friendIds.add(f.user_id)
        friendIds.add(f.friend_id)
      })
      const userIds = Array.from(friendIds)

      // Get profiles for these users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds)

      const profileMap = {}
      profiles?.forEach(p => {
        profileMap[p.id] = p
      })

      // Get exercises that have been used
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('id, name')
        .order('name')

      setExercises(exercisesData || [])
      if (exercisesData?.length && !selectedExercise) {
        setSelectedExercise(exercisesData[0].id)
      }

      // Get PRs for all users across exercises
      const { data: setLogs } = await supabase
        .from('set_logs')
        .select(`
          exercise_id,
          weight_kg,
          sessions!inner(user_id)
        `)
        .in('sessions.user_id', userIds)

      // Group by exercise and find max per user
      const boards = {}
      setLogs?.forEach(log => {
        const exId = log.exercise_id
        const userId = log.sessions?.user_id
        if (!exId || !userId) return

        if (!boards[exId]) boards[exId] = {}
        if (!boards[exId][userId] || log.weight_kg > boards[exId][userId]) {
          boards[exId][userId] = log.weight_kg
        }
      })

      // Convert to sorted leaderboard arrays
      const leaderboardData = {}
      Object.entries(boards).forEach(([exId, userPRs]) => {
        leaderboardData[exId] = Object.entries(userPRs)
          .map(([userId, pr]) => ({
            userId,
            pr,
            profile: profileMap[userId] || { username: 'Usuario' }
          }))
          .sort((a, b) => b.pr - a.pr)
      })

      setLeaderboards(leaderboardData)
    } catch (error) {
      console.error('Error fetching leaderboards:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank) => {
    if (rank === 0) return <Crown className="w-5 h-5 text-yellow-400" />
    if (rank === 1) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 2) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="w-5 text-center text-[var(--text-muted)]">{rank + 1}</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    )
  }

  const currentLeaderboard = selectedExercise ? leaderboards[selectedExercise] || [] : []
  const currentExercise = exercises.find(e => e.id === selectedExercise)

  return (
    <div className="space-y-6 fade-in pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Leaderboard
        </h1>
        <p className="text-[var(--text-muted)]">
          Ranking de PRs entre amigos
        </p>
      </div>

      {/* Exercise Selector */}
      <div>
        <label className="block text-sm text-[var(--text-secondary)] mb-2">
          Seleccionar ejercicio
        </label>
        <select
          value={selectedExercise || ''}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="input"
        >
          {exercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
      </div>

      {/* Leaderboard */}
      <div className="card overflow-hidden">
        <div className="p-3 bg-[var(--bg-tertiary)] flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-[var(--primary)]" />
          <span className="font-medium">{currentExercise?.name || 'Ejercicio'}</span>
        </div>

        {currentLeaderboard.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            No hay datos para este ejercicio
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {currentLeaderboard.map((entry, index) => (
              <Link
                key={entry.userId}
                to={`/u/${entry.profile.username}`}
                className={`flex items-center gap-3 p-3 hover:bg-[var(--bg-tertiary)] transition-colors ${
                  entry.userId === user.id ? 'bg-[var(--primary)]/10' : ''
                }`}
              >
                <div className="w-8 flex justify-center">
                  {getRankIcon(index)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[var(--text-primary)]">
                    {entry.profile.display_name || entry.profile.username}
                    {entry.userId === user.id && (
                      <span className="ml-2 text-xs text-[var(--primary)]">(Tú)</span>
                    )}
                  </div>
                </div>
                <div className="text-lg font-bold text-[var(--text-primary)]">
                  {entry.pr} kg
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {currentLeaderboard.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {currentLeaderboard.length}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Participantes</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {currentLeaderboard[0]?.pr || 0} kg
            </div>
            <div className="text-xs text-[var(--text-muted)]">Récord</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              #{currentLeaderboard.findIndex(e => e.userId === user.id) + 1 || '-'}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Tu posición</div>
          </div>
        </div>
      )}
    </div>
  )
}
