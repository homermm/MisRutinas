import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { User, Trophy, Calendar, Dumbbell, Edit2, Check, Loader2, ArrowLeft, Globe, Lock, Users } from 'lucide-react'

export function ProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ sessions: 0, volume: 0, prs: [] })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    is_public: false
  })

  const isOwnProfile = !username || (profile && user?.id === profile.id)

  useEffect(() => {
    fetchProfile()
  }, [username, user])

  const fetchProfile = async () => {
    try {
      let profileData

      if (username) {
        // Fetch by username
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single()
        profileData = data
      } else if (user) {
        // Fetch own profile
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (!data) {
          // Create profile if doesn't exist
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({ id: user.id, username: user.email?.split('@')[0] })
            .select()
            .single()
          profileData = newProfile
        } else {
          profileData = data
        }
      }

      if (profileData) {
        setProfile(profileData)
        setFormData({
          username: profileData.username || '',
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
          is_public: profileData.is_public || false
        })
        await fetchStats(profileData.id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (userId) => {
    try {
      // Get sessions count and volume
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id,
          set_logs (reps, weight_kg, exercise_id, exercises(name))
        `)
        .eq('user_id', userId)

      const totalVolume = sessions?.reduce((sum, s) => 
        sum + s.set_logs.reduce((sSum, l) => sSum + l.reps * l.weight_kg, 0)
      , 0) || 0

      // Get PRs
      const prsByExercise = {}
      sessions?.forEach(s => {
        s.set_logs.forEach(log => {
          const exName = log.exercises?.name
          if (!prsByExercise[exName] || log.weight_kg > prsByExercise[exName]) {
            prsByExercise[exName] = log.weight_kg
          }
        })
      })

      const prs = Object.entries(prsByExercise)
        .map(([name, weight]) => ({ name, weight }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5)

      setStats({
        sessions: sessions?.length || 0,
        volume: totalVolume,
        prs
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          display_name: formData.display_name,
          bio: formData.bio,
          is_public: formData.is_public,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error
      setProfile({ ...profile, ...formData })
      setEditing(false)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="card p-8 text-center">
        <User className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Perfil no encontrado</h2>
        <p className="text-[var(--text-secondary)] mt-2">El usuario no existe o su perfil es privado.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">Volver al inicio</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      {username && (
        <Link to="/" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--primary)]">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      )}

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-2xl font-bold">
              {formData.display_name?.[0]?.toUpperCase() || formData.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              {editing ? (
                <input
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  className="input text-lg font-bold mb-1"
                  placeholder="Nombre"
                />
              ) : (
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  {profile.display_name || profile.username}
                </h1>
              )}
              {editing ? (
                <input
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  className="input text-sm"
                  placeholder="username"
                />
              ) : (
                <p className="text-[var(--text-muted)]">@{profile.username}</p>
              )}
            </div>
          </div>
          
          {isOwnProfile && (
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="btn-secondary p-2">
                    Cancelar
                  </button>
                  <button onClick={saveProfile} disabled={saving} className="btn-primary p-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="btn-secondary p-2">
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bio */}
        {editing ? (
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            className="input w-full mb-4"
            placeholder="Bio (opcional)"
            rows={2}
          />
        ) : profile.bio && (
          <p className="text-[var(--text-secondary)] mb-4">{profile.bio}</p>
        )}

        {/* Privacy toggle */}
        {editing && (
          <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)] cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
              className="w-5 h-5"
            />
            <div className="flex items-center gap-2">
              {formData.is_public ? <Globe className="w-4 h-4 text-[var(--success)]" /> : <Lock className="w-4 h-4" />}
              <span>{formData.is_public ? 'Perfil público' : 'Perfil privado'}</span>
            </div>
          </label>
        )}

        {!editing && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            {profile.is_public ? (
              <><Globe className="w-4 h-4" /> Perfil público</>
            ) : (
              <><Lock className="w-4 h-4" /> Perfil privado</>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 text-center">
          <Calendar className="w-6 h-6 text-[var(--primary)] mx-auto mb-2" />
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.sessions}</p>
          <p className="text-sm text-[var(--text-muted)]">Sesiones</p>
        </div>
        <div className="card p-4 text-center">
          <Dumbbell className="w-6 h-6 text-[var(--success)] mx-auto mb-2" />
          <p className="text-2xl font-bold text-[var(--text-primary)]">{formatNumber(stats.volume)}</p>
          <p className="text-sm text-[var(--text-muted)]">kg Totales</p>
        </div>
      </div>

      {/* PRs */}
      {stats.prs.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[var(--warning)]" />
            Top PRs
          </h3>
          <div className="space-y-2">
            {stats.prs.map((pr, index) => (
              <div key={pr.name} className="flex items-center justify-between p-2 rounded bg-[var(--bg-tertiary)]/50">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-[var(--warning)] text-black' : 'bg-[var(--bg-tertiary)]'
                  }`}>{index + 1}</span>
                  <span className="text-[var(--text-primary)]">{pr.name}</span>
                </div>
                <span className="font-bold text-[var(--primary)]">{pr.weight} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share profile link */}
      {isOwnProfile && profile.is_public && profile.username && (
        <div className="card p-4">
          <p className="text-sm text-[var(--text-muted)] mb-2">Tu perfil público:</p>
          <code className="block p-2 rounded bg-[var(--bg-tertiary)] text-sm text-[var(--primary)] break-all">
            {window.location.origin}/u/{profile.username}
          </code>
        </div>
      )}

      {/* Friends Link */}
      {isOwnProfile && (
        <Link 
          to="/friends" 
          className="card p-4 flex items-center justify-between hover:border-[var(--primary)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[var(--primary)]" />
            <span className="font-medium text-[var(--text-primary)]">Ver Amigos</span>
          </div>
          <ArrowLeft className="w-4 h-4 text-[var(--text-muted)] rotate-180" />
        </Link>
      )}
    </div>
  )
}
