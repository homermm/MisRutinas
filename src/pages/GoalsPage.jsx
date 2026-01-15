import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Target, Plus, Trash2, Check, Loader2, Trophy, X } from 'lucide-react'

export function GoalsPage() {
  const [goals, setGoals] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch goals with exercise info
      const { data: goalsData } = await supabase
        .from('goals')
        .select(`
          *,
          exercises (name, categories(name))
        `)
        .order('created_at', { ascending: false })

      // Fetch all exercises
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('id, name, categories(name)')
        .order('name')

      // For each goal, check if achieved
      const goalsWithProgress = await Promise.all(
        (goalsData || []).map(async (goal) => {
          // Get max weight for this exercise
          const { data: logs } = await supabase
            .from('set_logs')
            .select('weight_kg')
            .eq('exercise_id', goal.exercise_id)
            .order('weight_kg', { ascending: false })
            .limit(1)

          const currentMax = logs?.[0]?.weight_kg || 0
          const progress = Math.min(100, (currentMax / goal.target_weight) * 100)
          const isAchieved = currentMax >= goal.target_weight

          // Update achieved status if needed
          if (isAchieved && !goal.achieved) {
            await supabase
              .from('goals')
              .update({ achieved: true, achieved_at: new Date().toISOString() })
              .eq('id', goal.id)
            goal.achieved = true
            goal.achieved_at = new Date().toISOString()
          }

          return { ...goal, currentMax, progress }
        })
      )

      setGoals(goalsWithProgress)
      setExercises(exercisesData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedExercise || !targetWeight) return

    setSaving(true)
    try {
      await supabase.from('goals').insert({
        exercise_id: selectedExercise,
        target_weight: parseFloat(targetWeight)
      })
      await fetchData()
      setShowForm(false)
      setSelectedExercise('')
      setTargetWeight('')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteGoal = async (id) => {
    if (!confirm('¿Eliminar esta meta?')) return
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    )
  }

  const activeGoals = goals.filter(g => !g.achieved)
  const achievedGoals = goals.filter(g => g.achieved)

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Metas</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Tus objetivos de entrenamiento
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva meta</span>
        </button>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <div className="card p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-[var(--text-muted)] block mb-1">Ejercicio</label>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="input w-full"
              >
                <option value="">Seleccionar ejercicio</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.categories?.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-[var(--text-muted)] block mb-1">Peso objetivo (kg)</label>
              <input
                type="number"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                className="input w-full"
                placeholder="100"
                min="1"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !selectedExercise || !targetWeight}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Crear meta
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary px-4"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-[var(--text-primary)]">En progreso</h3>
          {activeGoals.map((goal) => (
            <div key={goal.id} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--primary)]/20">
                    <Target className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">
                      {goal.exercises?.name}
                    </span>
                    <span className="text-sm text-[var(--text-muted)] block">
                      {goal.exercises?.categories?.name}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-2 rounded hover:bg-[var(--danger)]/20 text-[var(--text-muted)] hover:text-[var(--danger)]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-muted)]">
                    Actual: <span className="font-medium text-[var(--text-primary)]">{goal.currentMax} kg</span>
                  </span>
                  <span className="text-[var(--text-muted)]">
                    Meta: <span className="font-medium text-[var(--primary)]">{goal.target_weight} kg</span>
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <div 
                    className="h-full bg-[var(--primary)] transition-all duration-500"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {Math.round(goal.progress)}% completado • Faltan {Math.max(0, goal.target_weight - goal.currentMax)} kg
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achieved Goals */}
      {achievedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[var(--warning)]" />
            Logradas
          </h3>
          {achievedGoals.map((goal) => (
            <div key={goal.id} className="card p-4 border-[var(--success)] border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--success)]/20">
                    <Check className="w-5 h-5 text-[var(--success)]" />
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">
                      {goal.exercises?.name}
                    </span>
                    <span className="text-sm text-[var(--success)] block">
                      {goal.target_weight} kg ✓
                    </span>
                  </div>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {goal.achieved_at && new Date(goal.achieved_at).toLocaleDateString('es-AR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {goals.length === 0 && !showForm && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Sin metas
          </h3>
          <p className="text-[var(--text-secondary)]">
            Creá tu primera meta para trackear tu progreso.
          </p>
        </div>
      )}
    </div>
  )
}
