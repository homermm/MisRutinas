import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Timer, Check, Plus, Trash2, Loader2, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatWeight, calculateVolume } from '../lib/utils'
import { RestTimer } from '../components/workout/RestTimer'

export function ActiveSessionPage() {
  const { routineId } = useParams()
  const navigate = useNavigate()

  const [routine, setRoutine] = useState(null)
  const [exercises, setExercises] = useState([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [sets, setSets] = useState({}) // { exerciseId: [{ reps, weight_kg, set_number }] }
  const [previousSets, setPreviousSets] = useState({}) // Smart Sets data
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [totalVolume, setTotalVolume] = useState(0)

  useEffect(() => {
    fetchRoutineData()
  }, [routineId])

  const fetchRoutineData = async () => {
    try {
      // Fetch routine with exercises
      const { data: routineData, error: routineError } = await supabase
        .from('routines')
        .select(`
          *,
          routine_exercises (
            id,
            order,
            exercises (id, name, categories(name))
          )
        `)
        .eq('id', routineId)
        .single()

      if (routineError) throw routineError

      setRoutine(routineData)
      const orderedExercises = routineData.routine_exercises
        ?.sort((a, b) => a.order - b.order)
        .map(re => re.exercises)
        .filter(Boolean) || []
      setExercises(orderedExercises)

      // Initialize sets for each exercise
      const initialSets = {}
      orderedExercises.forEach(ex => {
        initialSets[ex.id] = [{ reps: 0, weight_kg: 0, set_number: 1 }]
      })
      setSets(initialSets)

      // Fetch Smart Sets data (last session for this routine)
      await fetchSmartSets(routineId, orderedExercises)

    } catch (error) {
      console.error('Error fetching routine:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSmartSets = async (routineId, exercisesList) => {
    try {
      // Get the last session for this routine
      const { data: lastSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('routine_id', routineId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!lastSession) return

      // Get set logs from last session
      const { data: setLogs } = await supabase
        .from('set_logs')
        .select('*')
        .eq('session_id', lastSession.id)
        .order('set_number')

      if (!setLogs?.length) return

      // Organize by exercise
      const prevSets = {}
      setLogs.forEach(log => {
        if (!prevSets[log.exercise_id]) {
          prevSets[log.exercise_id] = []
        }
        prevSets[log.exercise_id].push({
          reps: log.reps,
          weight_kg: parseFloat(log.weight_kg),
          set_number: log.set_number
        })
      })

      setPreviousSets(prevSets)

      // Pre-fill current sets with previous data (Smart Sets)
      const smartSets = {}
      exercisesList.forEach(ex => {
        if (prevSets[ex.id]?.length) {
          smartSets[ex.id] = prevSets[ex.id].map(s => ({ ...s }))
        } else {
          smartSets[ex.id] = [{ reps: 0, weight_kg: 0, set_number: 1 }]
        }
      })
      setSets(smartSets)

    } catch (error) {
      console.error('Error fetching smart sets:', error)
    }
  }

  const currentExercise = exercises[currentExerciseIndex]
  const currentSets = currentExercise ? sets[currentExercise.id] || [] : []
  const currentPreviousSets = currentExercise ? previousSets[currentExercise.id] || [] : []

  const updateSet = (setIndex, field, value) => {
    if (!currentExercise) return
    setSets(prev => ({
      ...prev,
      [currentExercise.id]: prev[currentExercise.id].map((set, i) =>
        i === setIndex ? { ...set, [field]: parseFloat(value) || 0 } : set
      )
    }))
  }

  const addSet = () => {
    if (!currentExercise) return
    const lastSet = currentSets[currentSets.length - 1] || { reps: 0, weight_kg: 0 }
    setSets(prev => ({
      ...prev,
      [currentExercise.id]: [
        ...prev[currentExercise.id],
        { reps: lastSet.reps, weight_kg: lastSet.weight_kg, set_number: currentSets.length + 1 }
      ]
    }))
  }

  const removeSet = (setIndex) => {
    if (!currentExercise || currentSets.length <= 1) return
    setSets(prev => ({
      ...prev,
      [currentExercise.id]: prev[currentExercise.id]
        .filter((_, i) => i !== setIndex)
        .map((set, i) => ({ ...set, set_number: i + 1 }))
    }))
  }

  const goToNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
    }
  }

  const goToPreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1)
    }
  }

  const finishWorkout = async () => {
    setSaving(true)
    try {
      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          routine_id: routineId,
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Create set logs
      const setLogs = []
      Object.entries(sets).forEach(([exerciseId, exerciseSets]) => {
        exerciseSets.forEach(set => {
          if (set.reps > 0 || set.weight_kg > 0) {
            setLogs.push({
              session_id: session.id,
              exercise_id: exerciseId,
              reps: set.reps,
              weight_kg: set.weight_kg,
              set_number: set.set_number
            })
          }
        })
      })

      if (setLogs.length > 0) {
        const { error: logsError } = await supabase
          .from('set_logs')
          .insert(setLogs)

        if (logsError) throw logsError
      }

      // Calculate total volume
      const allSets = Object.values(sets).flat()
      const volume = calculateVolume(allSets)
      setTotalVolume(volume)

      setSessionComplete(true)

    } catch (error) {
      console.error('Error saving session:', error)
      alert('Error al guardar la sesión')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    )
  }

  if (sessionComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md w-full fade-in">
          <div className="w-20 h-20 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-[var(--success)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            ¡Entrenamiento Completado!
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            {routine?.name}
          </p>
          <div className="card p-4 mb-6">
            <p className="text-sm text-[var(--text-muted)]">Volumen Total</p>
            <p className="text-3xl font-bold text-[var(--primary)]">
              {totalVolume.toLocaleString()} kg
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-primary w-full"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 glass p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h1 className="font-semibold text-[var(--text-primary)]">
              {routine?.name}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {currentExerciseIndex + 1} / {exercises.length}
            </p>
          </div>

          <button
            onClick={() => setShowTimer(true)}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg text-[var(--primary)]"
          >
            <Timer className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Exercise Progress */}
      <div className="max-w-4xl mx-auto px-4 mt-2">
        <div className="flex gap-1">
          {exercises.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentExerciseIndex
                  ? 'bg-[var(--primary)]'
                  : 'bg-[var(--bg-tertiary)]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current Exercise */}
      {currentExercise && (
        <div className="max-w-4xl mx-auto p-4 space-y-4 fade-in">
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              {currentExercise.name}
            </h2>
            <p className="text-[var(--text-muted)]">
              {currentExercise.categories?.name}
            </p>
          </div>

          {/* Sets Table */}
          <div className="card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-2 p-3 bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-muted)]">
              <span className="text-center">Set</span>
              <span className="text-center">Anterior</span>
              <span className="text-center">Peso (kg)</span>
              <span className="text-center">Reps</span>
              <span></span>
            </div>

            {/* Sets */}
            <div className="divide-y divide-[var(--border)]">
              {currentSets.map((set, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-2 p-3 items-center"
                >
                  <span className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>

                  <div className="text-center text-sm text-[var(--text-muted)]">
                    {currentPreviousSets[index] ? (
                      `${currentPreviousSets[index].weight_kg}kg × ${currentPreviousSets[index].reps}`
                    ) : (
                      '-'
                    )}
                  </div>

                  <input
                    type="number"
                    value={set.weight_kg || ''}
                    onChange={(e) => updateSet(index, 'weight_kg', e.target.value)}
                    className="input text-center py-2"
                    placeholder="0"
                    min="0"
                    step="0.5"
                  />

                  <input
                    type="number"
                    value={set.reps || ''}
                    onChange={(e) => updateSet(index, 'reps', e.target.value)}
                    className="input text-center py-2"
                    placeholder="0"
                    min="0"
                  />

                  <button
                    onClick={() => removeSet(index)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--danger)]/20 hover:text-[var(--danger)] transition-colors"
                    title="Eliminar serie"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Set Button */}
            <button
              onClick={addSet}
              className="w-full p-3 flex items-center justify-center gap-2 text-[var(--primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar Serie
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 glass safe-bottom">
        <div className="max-w-4xl mx-auto p-4 flex gap-3">
          <button
            onClick={goToPreviousExercise}
            disabled={currentExerciseIndex === 0}
            className="btn-secondary flex-1"
          >
            Anterior
          </button>

          {currentExerciseIndex < exercises.length - 1 ? (
            <button
              onClick={goToNextExercise}
              className="btn-primary flex-1"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={finishWorkout}
              disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Finalizar
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Rest Timer Modal */}
      {showTimer && (
        <RestTimer onClose={() => setShowTimer(false)} />
      )}
    </div>
  )
}
