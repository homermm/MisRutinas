import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Timer, Check, Plus, Minus, Trash2, Loader2, Trophy, List, ChevronDown, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { calculateVolume, calculate1RM } from '../lib/utils'
import { WEIGHT_INCREMENT, SET_TYPES } from '../lib/constants'
import { RestTimer } from '../components/workout/RestTimer'

export function ActiveSessionPage() {
  const { routineId } = useParams()
  const navigate = useNavigate()

  const [routine, setRoutine] = useState(null)
  const [exercises, setExercises] = useState([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [sets, setSets] = useState({})
  const [previousSets, setPreviousSets] = useState({})
  const [exercisePRs, setExercisePRs] = useState({}) // Track PRs for each exercise
  const [prNotification, setPrNotification] = useState(null) // { exerciseName, weight }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [totalVolume, setTotalVolume] = useState(0)
  const [showExerciseList, setShowExerciseList] = useState(false)
  const [completedExercises, setCompletedExercises] = useState(new Set())

  useEffect(() => {
    fetchRoutineData()
  }, [routineId])

  const fetchRoutineData = async () => {
    try {
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

      const initialSets = {}
      orderedExercises.forEach(ex => {
        initialSets[ex.id] = [{ reps: 0, weight_kg: 0, set_number: 1, notes: '', set_type: 'normal', is_warmup: false }]
      })
      setSets(initialSets)

      await fetchSmartSets(routineId, orderedExercises)
      await fetchExercisePRs(orderedExercises)

    } catch (error) {
      console.error('Error fetching routine:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSmartSets = async (routineId, exercisesList) => {
    try {
      const { data: lastSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('routine_id', routineId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!lastSession) return

      const { data: setLogs } = await supabase
        .from('set_logs')
        .select('*')
        .eq('session_id', lastSession.id)
        .order('set_number')

      if (!setLogs?.length) return

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

      // Note: PRs are now loaded separately from full history via fetchExercisePRs

      const smartSets = {}
      exercisesList.forEach(ex => {
        if (prevSets[ex.id]?.length) {
          smartSets[ex.id] = prevSets[ex.id].map(s => ({ 
            ...s, 
            notes: '', 
            set_type: s.set_type || 'normal', 
            is_warmup: s.is_warmup || false 
          }))
        } else {
          smartSets[ex.id] = [{ reps: 0, weight_kg: 0, set_number: 1, notes: '', set_type: 'normal', is_warmup: false }]
        }
      })
      setSets(smartSets)

    } catch (error) {
      console.error('Error fetching smart sets:', error)
    }
  }

  // Fetch PRs from complete exercise history (not just last session)
  const fetchExercisePRs = async (exercisesList) => {
    try {
      const exerciseIds = exercisesList.map(e => e.id)
      
      const { data: allLogs } = await supabase
        .from('set_logs')
        .select('exercise_id, weight_kg')
        .in('exercise_id', exerciseIds)
        .order('weight_kg', { ascending: false })
      
      if (!allLogs?.length) return
      
      // Find max weight per exercise
      const prs = {}
      allLogs.forEach(log => {
        if (!prs[log.exercise_id] || log.weight_kg > prs[log.exercise_id]) {
          prs[log.exercise_id] = log.weight_kg
        }
      })
      
      setExercisePRs(prs)
    } catch (error) {
      console.error('Error fetching exercise PRs:', error)
    }
  }

  const currentExercise = exercises[currentExerciseIndex]
  const currentSets = currentExercise ? sets[currentExercise.id] || [] : []
  const currentPreviousSets = currentExercise ? previousSets[currentExercise.id] || [] : []

  const updateSet = (setIndex, field, value) => {
    if (!currentExercise) return
    
    // Only parse as float for numeric fields
    const numericFields = ['weight_kg', 'reps', 'set_number']
    const newValue = numericFields.includes(field) 
      ? (parseFloat(value) || 0)
      : value  // Keep strings as-is (notes, set_type)
    
    setSets(prev => ({
      ...prev,
      [currentExercise.id]: prev[currentExercise.id].map((set, i) =>
        i === setIndex ? { ...set, [field]: newValue } : set
      )
    }))

    // Check for PR on weight change
    if (field === 'weight_kg' && newValue > 0) {
      const currentPR = exercisePRs[currentExercise.id] || 0
      if (newValue > currentPR) {
        setExercisePRs(prev => ({ ...prev, [currentExercise.id]: newValue }))
        setPrNotification({ exerciseName: currentExercise.name, weight: newValue })
        setTimeout(() => setPrNotification(null), 3000)
      }
    }
  }

  // Quick adjust functions
  const adjustWeight = (setIndex, delta) => {
    if (!currentExercise) return
    const currentWeight = currentSets[setIndex]?.weight_kg || 0
    const newWeight = Math.max(0, currentWeight + delta)
    updateSet(setIndex, 'weight_kg', newWeight)
  }

  const adjustReps = (setIndex, delta) => {
    if (!currentExercise) return
    const currentReps = currentSets[setIndex]?.reps || 0
    const newReps = Math.max(0, currentReps + delta)
    updateSet(setIndex, 'reps', newReps)
  }

  const addSet = () => {
    if (!currentExercise) return
    const lastSet = currentSets[currentSets.length - 1] || { reps: 0, weight_kg: 0, notes: '', set_type: 'normal', is_warmup: false }
    setSets(prev => ({
      ...prev,
      [currentExercise.id]: [
        ...prev[currentExercise.id],
        { reps: lastSet.reps, weight_kg: lastSet.weight_kg, set_number: currentSets.length + 1, notes: '', set_type: 'normal', is_warmup: false }
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

  // Navigate to specific exercise
  const goToExercise = (index) => {
    // Mark current as completed if has data
    if (currentExercise) {
      const hasSets = currentSets.some(s => s.reps > 0 || s.weight_kg > 0)
      if (hasSets) {
        setCompletedExercises(prev => new Set([...prev, currentExercise.id]))
      }
    }
    setCurrentExerciseIndex(index)
    setShowExerciseList(false)
  }

  const goToNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      goToExercise(currentExerciseIndex + 1)
    }
  }

  const goToPreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      goToExercise(currentExerciseIndex - 1)
    }
  }

  // Check if exercise has logged data
  const exerciseHasData = (exerciseId) => {
    const exerciseSets = sets[exerciseId] || []
    return exerciseSets.some(s => s.reps > 0 || s.weight_kg > 0)
  }

  const finishWorkout = async () => {
    setSaving(true)
    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          routine_id: routineId,
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      const setLogs = []
      Object.entries(sets).forEach(([exerciseId, exerciseSets]) => {
        exerciseSets.forEach(set => {
          if (set.reps > 0 || set.weight_kg > 0) {
            setLogs.push({
              session_id: session.id,
              exercise_id: exerciseId,
              reps: set.reps,
              weight_kg: set.weight_kg,
              set_number: set.set_number,
              notes: set.notes || null,
              set_type: set.set_type || 'normal',
              is_warmup: set.set_type === 'warmup' || set.is_warmup || false
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
      {/* PR Notification Toast */}
      {prNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-[var(--success)] text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <span className="font-bold">¡Nuevo PR! {prNotification.weight}kg en {prNotification.exerciseName}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 glass p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Clickable exercise selector */}
          <button
            onClick={() => setShowExerciseList(!showExerciseList)}
            className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <div className="text-center">
              <h1 className="font-semibold text-[var(--text-primary)]">
                {routine?.name}
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                {currentExerciseIndex + 1} / {exercises.length}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showExerciseList ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => setShowTimer(true)}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg text-[var(--primary)]"
          >
            <Timer className="w-5 h-5" />
          </button>
        </div>

        {/* Exercise List Dropdown */}
        {showExerciseList && (
          <div className="absolute left-0 right-0 top-full bg-[var(--bg-secondary)] border-b border-[var(--border)] max-h-64 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-2 space-y-1">
              {exercises.map((ex, index) => {
                const hasData = exerciseHasData(ex.id)
                const isCompleted = completedExercises.has(ex.id)
                const isCurrent = index === currentExerciseIndex
                
                return (
                  <button
                    key={ex.id}
                    onClick={() => goToExercise(index)}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                      isCurrent 
                        ? 'bg-[var(--primary)] text-white' 
                        : 'hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted || hasData
                        ? 'bg-[var(--success)] text-white'
                        : isCurrent
                          ? 'bg-white/20'
                          : 'bg-[var(--bg-tertiary)]'
                    }`}>
                      {isCompleted || hasData ? <Check className="w-3 h-3" /> : index + 1}
                    </span>
                    <div className="text-left flex-1">
                      <span className="font-medium">{ex.name}</span>
                      <span className={`text-sm ml-2 ${isCurrent ? 'opacity-70' : 'text-[var(--text-muted)]'}`}>
                        {ex.categories?.name}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* Exercise Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 mt-2">
        <div className="flex gap-1">
          {exercises.map((ex, index) => {
            const hasData = exerciseHasData(ex.id) || completedExercises.has(ex.id)
            return (
              <button
                key={index}
                onClick={() => goToExercise(index)}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  hasData
                    ? 'bg-[var(--success)]'
                    : index === currentExerciseIndex
                      ? 'bg-[var(--primary)]'
                      : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border)]'
                }`}
              />
            )
          })}
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
                <div key={index} className="py-3">
                  {/* Main Set Row */}
                  <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-2 px-3 items-center">
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

                    {/* Weight with +/- buttons */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => adjustWeight(index, -WEIGHT_INCREMENT)}
                        className="w-7 h-7 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--danger)]/20 hover:text-[var(--danger)] transition-colors text-[10px] font-bold"
                      >
                        -{WEIGHT_INCREMENT}
                      </button>
                      <input
                        type="number"
                        value={set.weight_kg || ''}
                        onChange={(e) => updateSet(index, 'weight_kg', e.target.value)}
                        className="input text-center py-2 flex-1 min-w-0"
                        placeholder="0"
                        min="0"
                        step="0.5"
                      />
                      <button 
                        onClick={() => adjustWeight(index, WEIGHT_INCREMENT)}
                        className="w-7 h-7 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--success)]/20 hover:text-[var(--success)] transition-colors text-[10px] font-bold"
                      >
                        +{WEIGHT_INCREMENT}
                      </button>
                    </div>

                    {/* Reps with +/- buttons */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => adjustReps(index, -1)}
                        className="w-7 h-7 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--danger)]/20 hover:text-[var(--danger)] transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(index, 'reps', e.target.value)}
                        className="input text-center py-2 flex-1 min-w-0"
                        placeholder="0"
                        min="0"
                      />
                      <button 
                        onClick={() => adjustReps(index, 1)}
                        className="w-7 h-7 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--success)]/20 hover:text-[var(--success)] transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeSet(index)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--danger)]/20 hover:text-[var(--danger)] transition-colors"
                      title="Eliminar serie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Set Type & Notes Row */}
                  <div className="grid grid-cols-[40px_1fr] gap-2 px-3 pt-2">
                    <div></div>
                    <div className="flex flex-wrap gap-2">
                      {/* Set Type Buttons */}
                      {Object.entries(SET_TYPES).map(([type, config]) => (
                        <button
                          key={type}
                          onClick={() => updateSet(index, 'set_type', type)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            set.set_type === type
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                          style={set.set_type === type && config.color ? { backgroundColor: config.color } : {}}
                        >
                          {config.icon && <span className="mr-1">{config.icon}</span>}
                          {config.label}
                        </button>
                      ))}
                      
                      {/* Notes Toggle */}
                      <button
                        onClick={() => {
                          const notesEl = document.getElementById(`notes-${currentExercise.id}-${index}`)
                          if (notesEl) notesEl.classList.toggle('hidden')
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                          set.notes ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        Nota
                      </button>
                    </div>
                  </div>

                  {/* Notes Input (Hidden by default) */}
                  <div 
                    id={`notes-${currentExercise.id}-${index}`}
                    className={`grid grid-cols-[40px_1fr] gap-2 px-3 pt-2 ${set.notes ? '' : 'hidden'}`}
                  >
                    <div></div>
                    <input
                      type="text"
                      value={set.notes || ''}
                      onChange={(e) => updateSet(index, 'notes', e.target.value)}
                      className="input py-1 text-sm"
                      placeholder="Añadir nota (ej: con spotter, falló en rep 8...)"
                    />
                  </div>
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
