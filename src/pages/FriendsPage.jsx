import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Users, UserPlus, Search, Check, X, Loader2, Clock, ArrowRight } from 'lucide-react'

export function FriendsPage() {
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const [pendingReceived, setPendingReceived] = useState([])
  const [pendingSent, setPendingSent] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (user) fetchFriends()
  }, [user])

  const fetchFriends = async () => {
    try {
      // Get all friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          user_id,
          friend_id,
          created_at
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

      // Get profiles for all related users
      const userIds = new Set()
      friendships?.forEach(f => {
        userIds.add(f.user_id)
        userIds.add(f.friend_id)
      })
      userIds.delete(user.id)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', Array.from(userIds))

      const profileMap = {}
      profiles?.forEach(p => profileMap[p.id] = p)

      // Categorize friendships
      const accepted = []
      const received = []
      const sent = []

      friendships?.forEach(f => {
        const otherUserId = f.user_id === user.id ? f.friend_id : f.user_id
        const friendProfile = profileMap[otherUserId] || { username: 'unknown' }

        const item = { ...f, profile: friendProfile }

        if (f.status === 'accepted') {
          accepted.push(item)
        } else if (f.status === 'pending') {
          if (f.friend_id === user.id) {
            received.push(item)
          } else {
            sent.push(item)
          }
        }
      })

      setFriends(accepted)
      setPendingReceived(received)
      setPendingSent(sent)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)

    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', user.id)
        .limit(10)

      // Filter out existing friends
      const existingIds = new Set([
        ...friends.map(f => f.profile.id),
        ...pendingSent.map(f => f.profile.id),
        ...pendingReceived.map(f => f.profile.id)
      ])

      setSearchResults(data?.filter(p => !existingIds.has(p.id)) || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSearching(false)
    }
  }

  const sendRequest = async (friendId) => {
    try {
      await supabase.from('friendships').insert({
        user_id: user.id,
        friend_id: friendId
      })
      setSearchResults(prev => prev.filter(p => p.id !== friendId))
      fetchFriends()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const acceptRequest = async (friendshipId) => {
    try {
      await supabase.from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
      fetchFriends()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const rejectRequest = async (friendshipId) => {
    try {
      await supabase.from('friendships').delete().eq('id', friendshipId)
      fetchFriends()
    } catch (error) {
      console.error('Error:', error)
    }
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
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Amigos</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Conectá con otros atletas
        </p>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              className="input w-full pl-10"
              placeholder="Buscar por username..."
            />
          </div>
          <button onClick={searchUsers} disabled={searching} className="btn-primary">
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-bold">
                    {profile.display_name?.[0] || profile.username?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{profile.display_name || profile.username}</p>
                    <p className="text-sm text-[var(--text-muted)]">@{profile.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => sendRequest(profile.id)}
                  className="btn-primary p-2"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Received */}
      {pendingReceived.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--warning)]" />
            Solicitudes pendientes
          </h3>
          <div className="space-y-2">
            {pendingReceived.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--warning)]/20 flex items-center justify-center text-[var(--warning)] font-bold">
                    {f.profile.display_name?.[0] || f.profile.username?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{f.profile.display_name || f.profile.username}</p>
                    <p className="text-sm text-[var(--text-muted)]">@{f.profile.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => acceptRequest(f.id)} className="p-2 rounded-lg bg-[var(--success)]/20 text-[var(--success)]">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => rejectRequest(f.id)} className="p-2 rounded-lg bg-[var(--danger)]/20 text-[var(--danger)]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      {friends.length > 0 ? (
        <div className="card p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--primary)]" />
            Tus amigos ({friends.length})
          </h3>
          <div className="space-y-2">
            {friends.map((f) => (
              <Link
                key={f.id}
                to={`/u/${f.profile.username}`}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-bold">
                    {f.profile.display_name?.[0] || f.profile.username?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{f.profile.display_name || f.profile.username}</p>
                    <p className="text-sm text-[var(--text-muted)]">@{f.profile.username}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Sin amigos todavía</h3>
          <p className="text-[var(--text-secondary)]">
            Buscá usuarios por su username para conectar.
          </p>
        </div>
      )}

      {/* Pending Sent */}
      {pendingSent.length > 0 && (
        <div className="text-sm text-[var(--text-muted)]">
          <p>Solicitudes enviadas: {pendingSent.map(f => '@' + f.profile.username).join(', ')}</p>
        </div>
      )}
    </div>
  )
}
