import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, FolderOpen, ChevronDown, ChevronRight, X, Check, Loader2, ListChecks } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function LibraryPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedCategory, setExpandedCategory] = useState(null)
  
  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)
  
  // Exercise form
  const [showExerciseForm, setShowExerciseForm] = useState(null) // category id
  const [editingExerciseId, setEditingExerciseId] = useState(null)
  const [exerciseName, setExerciseName] = useState('')
  const [savingExercise, setSavingExercise] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          exercises (id, name)
        `)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    if (!categoryName.trim()) return

    setSavingCategory(true)
    try {
      if (editingCategoryId) {
        await supabase.from('categories').update({ name: categoryName.trim() }).eq('id', editingCategoryId)
      } else {
        await supabase.from('categories').insert({ name: categoryName.trim() })
      }
      await fetchCategories()
      resetCategoryForm()
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setSavingCategory(false)
    }
  }

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.id)
    setCategoryName(category.name)
    setShowCategoryForm(true)
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('¿Eliminar esta categoría y todos sus ejercicios?')) return
    await supabase.from('categories').delete().eq('id', id)
    await fetchCategories()
  }

  const resetCategoryForm = () => {
    setShowCategoryForm(false)
    setEditingCategoryId(null)
    setCategoryName('')
  }

  // Exercise handlers
  const handleExerciseSubmit = async (e, categoryId) => {
    e.preventDefault()
    if (!exerciseName.trim()) return

    setSavingExercise(true)
    try {
      if (editingExerciseId) {
        await supabase.from('exercises').update({ name: exerciseName.trim() }).eq('id', editingExerciseId)
      } else {
        await supabase.from('exercises').insert({ name: exerciseName.trim(), category_id: categoryId })
      }
      await fetchCategories()
      resetExerciseForm()
    } catch (error) {
      console.error('Error saving exercise:', error)
    } finally {
      setSavingExercise(false)
    }
  }

  const handleEditExercise = (exercise, categoryId) => {
    setEditingExerciseId(exercise.id)
    setExerciseName(exercise.name)
    setShowExerciseForm(categoryId)
    setExpandedCategory(categoryId)
  }

  const handleDeleteExercise = async (id) => {
    if (!confirm('¿Eliminar este ejercicio?')) return
    await supabase.from('exercises').delete().eq('id', id)
    await fetchCategories()
  }

  const resetExerciseForm = () => {
    setShowExerciseForm(null)
    setEditingExerciseId(null)
    setExerciseName('')
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
    resetExerciseForm()
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Biblioteca</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Categorías y ejercicios
          </p>
        </div>
        <button
          onClick={() => setShowCategoryForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Categoría</span>
        </button>
      </div>

      {/* Category Form */}
      {showCategoryForm && (
        <div className="card p-4">
          <form onSubmit={handleCategorySubmit} className="flex gap-3">
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="input flex-1"
              placeholder="Nombre de la categoría (ej: Pecho)"
              autoFocus
            />
            <button type="submit" disabled={savingCategory || !categoryName.trim()} className="btn-primary px-4">
              {savingCategory ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            </button>
            <button type="button" onClick={resetCategoryForm} className="btn-secondary px-4">
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Sin categorías</h3>
          <p className="text-[var(--text-secondary)]">Creá tu primera categoría para agregar ejercicios.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="card overflow-hidden">
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(category.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-tertiary)]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedCategory === category.id ? (
                    <ChevronDown className="w-5 h-5 text-[var(--primary)]" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                  <div className="p-2 rounded-lg bg-[var(--primary)]/20">
                    <FolderOpen className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">{category.name}</span>
                    <span className="text-sm text-[var(--text-muted)] ml-2">
                      ({category.exercises?.length || 0})
                    </span>
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--primary)]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--danger)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Exercises */}
              {expandedCategory === category.id && (
                <div className="border-t border-[var(--border)] bg-[var(--bg-tertiary)]/30 p-4 space-y-2">
                  {/* Exercises List */}
                  {category.exercises?.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)] group"
                    >
                      <div className="flex items-center gap-3">
                        <ListChecks className="w-4 h-4 text-[var(--success)]" />
                        <span className="text-[var(--text-primary)]">{exercise.name}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditExercise(exercise, category.id)}
                          className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--primary)]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--danger)]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Exercise Form or Button */}
                  {showExerciseForm === category.id ? (
                    <form onSubmit={(e) => handleExerciseSubmit(e, category.id)} className="flex gap-2">
                      <input
                        type="text"
                        value={exerciseName}
                        onChange={(e) => setExerciseName(e.target.value)}
                        className="input flex-1 py-2"
                        placeholder="Nombre del ejercicio"
                        autoFocus
                      />
                      <button type="submit" disabled={savingExercise || !exerciseName.trim()} className="btn-primary px-3 py-2">
                        {savingExercise ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={resetExerciseForm} className="btn-secondary px-3 py-2">
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowExerciseForm(category.id)}
                      className="w-full p-3 rounded-lg border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar ejercicio
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
