import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, FolderOpen, X, Check, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formName, setFormName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formName.trim()) return

    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update({ name: formName.trim() })
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({ name: formName.trim() })

        if (error) throw error
      }

      await fetchCategories()
      resetForm()
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category) => {
    setEditingId(category.id)
    setFormName(category.name)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta categoría? Esto eliminará también sus ejercicios.')) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormName('')
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Categorías</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Organiza tus ejercicios por grupo muscular
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

      {/* Form Modal/Inline */}
      {showForm && (
        <div className="card p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="input flex-1"
              placeholder="Nombre de la categoría (ej: Pecho, Pierna)"
              autoFocus
            />
            <button
              type="submit"
              disabled={saving || !formName.trim()}
              className="btn-primary px-4"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary px-4"
            >
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
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Sin categorías
          </h3>
          <p className="text-[var(--text-secondary)]">
            Creá tu primera categoría para organizar ejercicios.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="card p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--primary)]/20">
                  <FolderOpen className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <span className="font-medium text-[var(--text-primary)]">
                  {category.name}
                </span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--primary)]"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
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
