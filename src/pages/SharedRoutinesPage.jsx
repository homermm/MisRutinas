import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Share2, Download, Heart, Search, Loader2, Dumbbell, User, ChevronRight, Plus, X, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const DIFFICULTY_LABELS = {
  beginner: { label: 'Principiante', color: 'var(--success)' },
  intermediate: { label: 'Intermedio', color: 'var(--warning)' },
  advanced: { label: 'Avanzado', color: 'var(--danger)' },
}

export function SharedRoutinesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sharedRoutines, setSharedRoutines] = useState([])
  const [myRoutines, setMyRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareForm, setShareForm] = useState({ routine_id: '', title: '', description: '', difficulty: 'intermediate' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get public shared routines
      const { data: shared } = await supabase
        .from('shared_routines')
        .select(`
          *,
          routines(name, routine_exercises(exercises(name))),
          profiles:user_id(username, display_name)
        `)
        .eq('is_public', true)
        .order('import_count', { ascending: false })
        .limit(50)

      // Get user's routines (for sharing)
      const { data: myData } = await supabase
        .from('routines')
        .select('id, name')
        .order('name')

      setSharedRoutines(shared || [])
      setMyRoutines(myData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const shareRoutine = async () => {
    if (!shareForm.routine_id || !shareForm.title) return
    setSaving(true)
    try {
      await supabase
        .from('shared_routines')
        .insert({
          routine_id: shareForm.routine_id,
          title: shareForm.title,
          description: shareForm.description,
          difficulty: shareForm.difficulty,
        })
      
      setShowShareModal(false)
      setShareForm({ routine_id: '', title: '', description: '', difficulty: 'intermediate' })
      fetchData()
    } catch (error) {
      console.error('Error sharing routine:', error)
    } finally {
      setSaving(false)
    }
  }

  const importRoutine = async (sharedRoutine) => {
    setSaving(true)
    try {
      // Get original routine with exercises
      const { data: original } = await supabase
        .from('routines')
        .select('name, routine_exercises(exercise_id, order)')
        .eq('id', sharedRoutine.routine_id)
        .single()

      if (!original) throw new Error('Routine not found')

      // Create new routine
      const { data: newRoutine } = await supabase
        .from('routines')
        .insert({ name: `${sharedRoutine.title} (importada)` })
        .select()
        .single()

      // Copy exercises
      if (original.routine_exercises?.length) {
        const exercises = original.routine_exercises.map(re => ({
          routine_id: newRoutine.id,
          exercise_id: re.exercise_id,
          order: re.order
        }))
        await supabase.from('routine_exercises').insert(exercises)
      }

      // Track import
      await supabase.from('routine_imports').insert({
        shared_routine_id: sharedRoutine.id,
        new_routine_id: newRoutine.id
      })

      // Update import count
      await supabase
        .from('shared_routines')
        .update({ import_count: sharedRoutine.import_count + 1 })
        .eq('id', sharedRoutine.id)

      navigate('/routines')
    } catch (error) {
      console.error('Error importing routine:', error)
      alert('Error al importar rutina')
    } finally {
      setSaving(false)
    }
  }

  const toggleLike = async (sharedRoutine) => {
    try {
      const { data: existingLike } = await supabase
        .from('routine_likes')
        .select('id')
        .eq('shared_routine_id', sharedRoutine.id)
        .eq('user_id', user.id)
        .single()

      if (existingLike) {
        await supabase.from('routine_likes').delete().eq('id', existingLike.id)
        setSharedRoutines(prev => prev.map(r => 
          r.id === sharedRoutine.id ? { ...r, like_count: r.like_count - 1, liked: false } : r
        ))
      } else {
        await supabase.from('routine_likes').insert({ shared_routine_id: sharedRoutine.id })
        setSharedRoutines(prev => prev.map(r => 
          r.id === sharedRoutine.id ? { ...r, like_count: r.like_count + 1, liked: true } : r
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const filteredRoutines = sharedRoutines.filter(r =>
    !searchQuery || 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Share2 className="w-6 h-6 text-[var(--primary)]" />
            Rutinas Compartidas
          </h1>
          <p className="text-[var(--text-muted)]">
            Descubre e importa rutinas de la comunidad
          </p>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="btn-primary px-4 py-2 rounded-full flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Compartir
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
          placeholder="Buscar rutinas..."
        />
      </div>

      {/* Routines Grid */}
      {filteredRoutines.length === 0 ? (
        <div className="card p-8 text-center">
          <Share2 className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">
            No hay rutinas compartidas aún
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRoutines.map(routine => {
            const diff = DIFFICULTY_LABELS[routine.difficulty] || DIFFICULTY_LABELS.intermediate
            const exerciseCount = routine.routines?.routine_exercises?.length || 0
            
            return (
              <div key={routine.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {routine.title}
                    </h3>
                    <Link 
                      to={`/u/${routine.profiles?.username}`}
                      className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)]"
                    >
                      @{routine.profiles?.username}
                    </Link>
                  </div>
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${diff.color}20`, color: diff.color }}
                  >
                    {diff.label}
                  </span>
                </div>

                {routine.description && (
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    {routine.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-3">
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-4 h-4" />
                    {exerciseCount} ejercicios
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {routine.import_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {routine.like_count}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleLike(routine)}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      routine.liked 
                        ? 'bg-[var(--danger)]/20 text-[var(--danger)]' 
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--danger)]'
                    }`}
                  >
                    <Heart className="w-4 h-4" fill={routine.liked ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => importRoutine(routine)}
                    disabled={saving}
                    className="flex-[3] btn-primary py-2 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Importar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Compartir Rutina</h2>
              <button onClick={() => setShowShareModal(false)}>
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  Rutina a compartir
                </label>
                <select
                  value={shareForm.routine_id}
                  onChange={(e) => setShareForm({ ...shareForm, routine_id: e.target.value })}
                  className="input"
                >
                  <option value="">Seleccionar...</option>
                  {myRoutines.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  Título público
                </label>
                <input
                  type="text"
                  value={shareForm.title}
                  onChange={(e) => setShareForm({ ...shareForm, title: e.target.value })}
                  className="input"
                  placeholder="Push Day - Pecho y Tríceps"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={shareForm.description}
                  onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
                  className="input resize-none"
                  rows={3}
                  placeholder="Rutina enfocada en..."
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  Dificultad
                </label>
                <div className="flex gap-2">
                  {Object.entries(DIFFICULTY_LABELS).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      onClick={() => setShareForm({ ...shareForm, difficulty: key })}
                      className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                        shareForm.difficulty === key
                          ? 'text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                      }`}
                      style={shareForm.difficulty === key ? { backgroundColor: color } : {}}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={shareRoutine}
                disabled={saving || !shareForm.routine_id || !shareForm.title}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
