import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Dumbbell, Play, X, Check, Loader2, GripVertical, FolderPlus, Search, Copy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export function RoutinesPage() {
  const [routines, setRoutines] = useState([])
  const [exercises, setExercises] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formName, setFormName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState([]) // Array of exercise IDs in order
  const [saving, setSaving] = useState(false)
  const [expandedRoutine, setExpandedRoutine] = useState(null)
  
  // New exercise modal
  const [showNewExerciseModal, setShowNewExerciseModal] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')
  const [newExerciseCategoryId, setNewExerciseCategoryId] = useState('')
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [savingExercise, setSavingExercise] = useState(false)
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('')
  
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [routinesRes, exercisesRes, categoriesRes] = await Promise.all([
        supabase.from('routines').select(`
          *,
          routine_exercises (
            id,
            order,
            exercises (id, name, categories(name))
          )
        `).order('name'),
        supabase.from('exercises').select('*, categories(name)').order('name'),
        supabase.from('categories').select('*').order('name')
      ])

      if (routinesRes.error) throw routinesRes.error
      if (exercisesRes.error) throw exercisesRes.error
      if (categoriesRes.error) throw categoriesRes.error

      setRoutines(routinesRes.data || [])
      setExercises(exercisesRes.data || [])
      setCategories(categoriesRes.data || [])
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
      const { error } = await supabase.from('routines').delete().eq('id', id)
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error deleting routine:', error)
    }
  }

  // Duplicate routine
  const handleDuplicate = async (routine) => {
    try {
      // Create new routine with "(copia)" suffix
      const { data: newRoutine, error: routineError } = await supabase
        .from('routines')
        .insert({ name: `${routine.name} (copia)` })
        .select()
        .single()

      if (routineError) throw routineError

      // Copy exercise associations
      if (routine.routine_exercises?.length > 0) {
        const newExercises = routine.routine_exercises.map(re => ({
          routine_id: newRoutine.id,
          exercise_id: re.exercises?.id,
          order: re.order
        })).filter(e => e.exercise_id)

        if (newExercises.length > 0) {
          const { error } = await supabase
            .from('routine_exercises')
            .insert(newExercises)
          if (error) throw error
        }
      }

      await fetchData()
    } catch (error) {
      console.error('Error duplicating routine:', error)
    }
  }

  // Toggle exercise selection
  const toggleExercise = (exerciseId) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId)
      }
      return [...prev, exerciseId]
    })
  }

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null)

  // Drag handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    const newOrder = [...selectedExercises]
    const draggedItem = newOrder[draggedIndex]
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(index, 0, draggedItem)
    setSelectedExercises(newOrder)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // Remove from selected
  const removeExercise = (exerciseId) => {
    setSelectedExercises(prev => prev.filter(id => id !== exerciseId))
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormName('')
    setSelectedExercises([])
  }

  // Create new exercise inline
  const handleCreateExercise = async () => {
    if (!newExerciseName.trim()) return
    
    setSavingExercise(true)
    try {
      let categoryId = newExerciseCategoryId

      // Create category if needed
      if (showNewCategoryInput && newCategoryName.trim()) {
        const { data: newCat, error: catError } = await supabase
          .from('categories')
          .insert({ name: newCategoryName.trim() })
          .select()
          .single()
        
        if (catError) throw catError
        categoryId = newCat.id
      }

      if (!categoryId) {
        alert('Seleccioná o creá una categoría')
        setSavingExercise(false)
        return
      }

      // Create exercise
      const { data: newExercise, error: exError } = await supabase
        .from('exercises')
        .insert({ name: newExerciseName.trim(), category_id: categoryId })
        .select('*, categories(name)')
        .single()

      if (exError) throw exError

      // Add to exercises list and select it
      setExercises(prev => [...prev, newExercise])
      setSelectedExercises(prev => [...prev, newExercise.id])
      
      // Refresh categories if new one was created
      if (showNewCategoryInput) {
        const { data: cats } = await supabase.from('categories').select('*').order('name')
        setCategories(cats || [])
      }

      // Reset modal
      setShowNewExerciseModal(false)
      setNewExerciseName('')
      setNewExerciseCategoryId('')
      setShowNewCategoryInput(false)
      setNewCategoryName('')

    } catch (error) {
      console.error('Error creating exercise:', error)
    } finally {
      setSavingExercise(false)
    }
  }

  const startRoutine = (routineId) => {
    navigate(`/session/${routineId}`)
  }

  // Get exercise details by ID
  const getExercise = (id) => exercises.find(e => e.id === id)

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

            {/* Selected Exercises with drag & drop reorder */}
            {selectedExercises.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Ejercicios seleccionados ({selectedExercises.length}) - Arrastrá para reordenar
                </label>
                <div className="space-y-1 bg-[var(--bg-tertiary)]/50 rounded-lg p-2">
                  {selectedExercises.map((exId, index) => {
                    const exercise = getExercise(exId)
                    if (!exercise) return null
                    return (
                      <div
                        key={exId}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-secondary)] cursor-grab active:cursor-grabbing transition-opacity ${
                          draggedIndex === index ? 'opacity-50' : ''
                        }`}
                      >
                        <GripVertical className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="flex-1 font-medium text-sm">{exercise.name}</span>
                        <span className="text-xs text-[var(--text-muted)]">{exercise.categories?.name}</span>
                        <button
                          type="button"
                          onClick={() => removeExercise(exId)}
                          className="p-1 rounded hover:bg-[var(--danger)]/20 text-[var(--text-muted)] hover:text-[var(--danger)]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Exercise Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Agregar ejercicios
              </label>
              
              {/* Search and Filter */}
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-9 py-2 text-sm"
                    placeholder="Buscar ejercicio..."
                  />
                </div>
                <select
                  value={filterCategoryId}
                  onChange={(e) => setFilterCategoryId(e.target.value)}
                  className="input py-2 text-sm w-32"
                >
                  <option value="">Todas</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-1 bg-[var(--bg-tertiary)]/50 rounded-lg p-2">
                {exercises
                  .filter(e => !selectedExercises.includes(e.id))
                  .filter(e => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .filter(e => !filterCategoryId || e.category_id === filterCategoryId)
                  .map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => toggleExercise(exercise.id)}
                    className="w-full text-left p-3 rounded-lg flex items-center justify-between hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <div>
                      <span className="font-medium">{exercise.name}</span>
                      <span className="text-sm text-[var(--text-muted)] ml-2">
                        {exercise.categories?.name}
                      </span>
                    </div>
                    <Plus className="w-4 h-4 text-[var(--primary)]" />
                  </button>
                ))}
                
                {/* Create new exercise button */}
                <button
                  type="button"
                  onClick={() => setShowNewExerciseModal(true)}
                  className="w-full p-3 rounded-lg border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  Crear nuevo ejercicio
                </button>
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

      {/* New Exercise Modal */}
      {showNewExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-md fade-in">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Nuevo Ejercicio
            </h3>
            
            <div className="space-y-4">
              <input
                type="text"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                className="input"
                placeholder="Nombre del ejercicio"
                autoFocus
              />

              {!showNewCategoryInput ? (
                <div>
                  <select
                    value={newExerciseCategoryId}
                    onChange={(e) => setNewExerciseCategoryId(e.target.value)}
                    className="input"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryInput(true)}
                    className="text-sm text-[var(--primary)] mt-2 hover:underline"
                  >
                    + Crear nueva categoría
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="input"
                    placeholder="Nombre de la nueva categoría"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryInput(false)
                      setNewCategoryName('')
                    }}
                    className="text-sm text-[var(--text-muted)] mt-2 hover:underline"
                  >
                    Cancelar, elegir existente
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCreateExercise}
                  disabled={savingExercise || !newExerciseName.trim()}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {savingExercise ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Crear
                </button>
                <button
                  onClick={() => {
                    setShowNewExerciseModal(false)
                    setNewExerciseName('')
                    setNewExerciseCategoryId('')
                    setShowNewCategoryInput(false)
                    setNewCategoryName('')
                  }}
                  className="btn-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Routines List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        </div>
      ) : routines.length === 0 ? (
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
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicate(routine)
                    }}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--success)]"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(routine.id)
                    }}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--danger)]"
                    title="Eliminar"
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
