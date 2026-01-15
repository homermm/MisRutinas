import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ListChecks, X, Check, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function ExercisesPage() {
  const [exercises, setExercises] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formName, setFormName] = useState('')
  const [formCategoryId, setFormCategoryId] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterCategoryId, setFilterCategoryId] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [exercisesRes, categoriesRes] = await Promise.all([
        supabase.from('exercises').select('*, categories(name)').order('name'),
        supabase.from('categories').select('*').order('name')
      ])

      if (exercisesRes.error) throw exercisesRes.error
      if (categoriesRes.error) throw categoriesRes.error

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
    if (!formName.trim() || !formCategoryId) return

    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('exercises')
          .update({ name: formName.trim(), category_id: formCategoryId })
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('exercises')
          .insert({ name: formName.trim(), category_id: formCategoryId })

        if (error) throw error
      }

      await fetchData()
      resetForm()
    } catch (error) {
      console.error('Error saving exercise:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (exercise) => {
    setEditingId(exercise.id)
    setFormName(exercise.name)
    setFormCategoryId(exercise.category_id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este ejercicio?')) return

    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error deleting exercise:', error)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormName('')
    setFormCategoryId('')
  }

  const filteredExercises = filterCategoryId
    ? exercises.filter(e => e.category_id === filterCategoryId)
    : exercises

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Ejercicios</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Tu biblioteca de ejercicios
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
          disabled={categories.length === 0}
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {/* Filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterCategoryId('')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !filterCategoryId
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategoryId(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterCategoryId === cat.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card p-4 space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="input"
              placeholder="Nombre del ejercicio (ej: Press de Banca)"
              autoFocus
            />
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              className="input"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !formName.trim() || !formCategoryId}
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

      {/* No Categories Warning */}
      {!loading && categories.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-[var(--text-secondary)]">
            Primero debes crear categorías para agregar ejercicios.
          </p>
        </div>
      )}

      {/* Exercises List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        </div>
      ) : filteredExercises.length === 0 && categories.length > 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
            <ListChecks className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Sin ejercicios
          </h3>
          <p className="text-[var(--text-secondary)]">
            Creá tu primer ejercicio.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="card p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--success)]/20">
                  <ListChecks className="w-5 h-5 text-[var(--success)]" />
                </div>
                <div>
                  <span className="font-medium text-[var(--text-primary)] block">
                    {exercise.name}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {exercise.categories?.name}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(exercise)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--primary)]"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(exercise.id)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--danger)]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
