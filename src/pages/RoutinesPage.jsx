import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Dumbbell, Play, X, Check, Loader2, GripVertical } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export function RoutinesPage() {
  const [routines, setRoutines] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formName, setFormName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState([])
  const [saving, setSaving] = useState(false)
  const [expandedRoutine, setExpandedRoutine] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [routinesRes, exercisesRes] = await Promise.all([
        supabase.from('routines').select(`
          *,
          routine_exercises (
            id,
            order,
            exercises (id, name, categories(name))
          )
        `).order('name'),
        supabase.from('exercises').select('*, categories(name)').order('name')
      ])

      if (routinesRes.error) throw routinesRes.error
      if (exercisesRes.error) throw exercisesRes.error

      setRoutines(routinesRes.data || [])
      setExercises(exercisesRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formName.trim()) return

    setSaving(true)
    try {
      let routineId = editingId

      if (editingId) {
        const { error } = await supabase
          .from('routines')
          .update({ name: formName.trim() })
          .eq('id', editingId)

        if (error) throw error

        // Delete existing routine_exercises
        await supabase.from('routine_exercises').delete().eq('routine_id', editingId)
      } else {
        const { data, error } = await supabase
          .from('routines')
          .insert({ name: formName.trim() })
          .select()
          .single()

        if (error) throw error
        routineId = data.id
      }

      // Insert new routine_exercises
      if (selectedExercises.length > 0) {
        const routineExercises = selectedExercises.map((exId, index) => ({
          routine_id: routineId,
          exercise_id: exId,
          order: index
        }))

        const { error } = await supabase
          .from('routine_exercises')
          .insert(routineExercises)

        if (error) throw error
      }

      await fetchData()
      resetForm()
    } catch (error) {
      console.error('Error saving routine:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (routine) => {
    setEditingId(routine.id)
    setFormName(routine.name)
    setSelectedExercises(
      routine.routine_exercises
        ?.sort((a, b) => a.order - b.order)
        .map(re => re.exercises?.id)
        .filter(Boolean) || []
    )
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta rutina?')) return

    try {
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error deleting routine:', error)
    }
  }

  const toggleExercise = (exerciseId) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId)
      }
      return [...prev, exerciseId]
    })
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormName('')
    setSelectedExercises([])
  }

  const startRoutine = (routineId) => {
    navigate(`/session/${routineId}`)
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Rutinas</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Organiza tus entrenamientos
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
          disabled={exercises.length === 0}
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-4 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="input"
              placeholder="Nombre de la rutina (ej: Lunes - Empuje)"
              autoFocus
            />

            {/* Exercise Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Seleccionar ejercicios ({selectedExercises.length})
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1 bg-[var(--bg-tertiary)]/50 rounded-lg p-2">
                {exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => toggleExercise(exercise.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                      selectedExercises.includes(exercise.id)
                        ? 'bg-[var(--primary)] text-white'
                        : 'hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <div>
                      <span className="font-medium">{exercise.name}</span>
                      <span className="text-sm opacity-70 ml-2">
                        {exercise.categories?.name}
                      </span>
                    </div>
                    {selectedExercises.includes(exercise.id) && (
                      <span className="text-sm font-bold">
                        #{selectedExercises.indexOf(exercise.id) + 1}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !formName.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* No Exercises Warning */}
      {!loading && exercises.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-[var(--text-secondary)]">
            Primero debes crear ejercicios para armar rutinas.
          </p>
        </div>
      )}

      {/* Routines List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        </div>
      ) : routines.length === 0 && exercises.length > 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Sin rutinas
          </h3>
          <p className="text-[var(--text-secondary)]">
            Creá tu primera rutina de entrenamiento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <div key={routine.id} className="card overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedRoutine(expandedRoutine === routine.id ? null : routine.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--primary)]/20">
                    <Dumbbell className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-primary)] block">
                      {routine.name}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">
                      {routine.routine_exercises?.length || 0} ejercicios
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startRoutine(routine.id)
                    }}
                    className="btn-primary py-2 px-4 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    <span className="hidden sm:inline">Iniciar</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(routine)
                    }}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--primary)]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(routine.id)
                    }}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--danger)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Exercise List */}
              {expandedRoutine === routine.id && routine.routine_exercises?.length > 0 && (
                <div className="border-t border-[var(--border)] p-4 bg-[var(--bg-tertiary)]/30">
                  <div className="space-y-2">
                    {routine.routine_exercises
                      .sort((a, b) => a.order - b.order)
                      .map((re, index) => (
                        <div
                          key={re.id}
                          className="flex items-center gap-3 text-sm"
                        >
                          <span className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="text-[var(--text-primary)]">
                            {re.exercises?.name}
                          </span>
                          <span className="text-[var(--text-muted)]">
                            {re.exercises?.categories?.name}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
