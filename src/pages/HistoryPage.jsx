import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, ChevronDown, ChevronRight, Trash2, Edit2, Loader2, Trophy, X, Check, Dumbbell, TrendingUp, GitCompare } from 'lucide-react'
import { formatWeight } from '../lib/utils'

export function HistoryPage() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState(null)
  const [editingSet, setEditingSet] = useState(null) // { sessionId, setLogId, reps, weight_kg }
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          routines (name),
          set_logs (
            id,
            exercise_id,
            reps,
            weight_kg,
            set_number,
            exercises (id, name, categories(name))
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteSession = async (sessionId) => {
    if (!confirm('¿Eliminar esta sesión y todos sus registros?')) return

    try {
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
      if (error) throw error
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const startEditSet = (setLog) => {
    setEditingSet({
      setLogId: setLog.id,
      reps: setLog.reps,
      weight_kg: setLog.weight_kg
    })
  }

  const saveEditSet = async () => {
    if (!editingSet) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from('set_logs')
        .update({ reps: editingSet.reps, weight_kg: editingSet.weight_kg })
        .eq('id', editingSet.setLogId)

      if (error) throw error
      
      // Update local state
      setSessions(prev => prev.map(session => ({
        ...session,
        set_logs: session.set_logs.map(log => 
          log.id === editingSet.setLogId 
            ? { ...log, reps: editingSet.reps, weight_kg: editingSet.weight_kg }
            : log
        )
      })))
      
      setEditingSet(null)
    } catch (error) {
      console.error('Error updating set:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteSetLog = async (setLogId) => {
    if (!confirm('¿Eliminar esta serie?')) return

    try {
      const { error } = await supabase.from('set_logs').delete().eq('id', setLogId)
      if (error) throw error
      
      setSessions(prev => prev.map(session => ({
        ...session,
        set_logs: session.set_logs.filter(log => log.id !== setLogId)
      })))
    } catch (error) {
      console.error('Error deleting set:', error)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateSessionVolume = (setLogs) => {
    return setLogs.reduce((total, log) => total + (log.reps * log.weight_kg), 0)
  }

  // Group set_logs by exercise
  const groupByExercise = (setLogs) => {
    const grouped = {}
    setLogs.forEach(log => {
      const exId = log.exercise_id
      if (!grouped[exId]) {
        grouped[exId] = {
          exercise: log.exercises,
          sets: []
        }
      }
      grouped[exId].sets.push(log)
    })
    return Object.values(grouped)
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Historial</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Tus sesiones de entrenamiento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/compare"
            className="btn-secondary flex items-center gap-2"
          >
            <GitCompare className="w-5 h-5" />
            <span className="hidden sm:inline">Comparar</span>
          </Link>
          <Link
            to="/stats"
            className="btn-primary flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="hidden sm:inline">Estadísticas</span>
          </Link>
        </div>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Sin historial
          </h3>
          <p className="text-[var(--text-secondary)]">
            Completá tu primera sesión de entrenamiento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const volume = calculateSessionVolume(session.set_logs || [])
            const exerciseGroups = groupByExercise(session.set_logs || [])
            const isExpanded = expandedSession === session.id

            return (
              <div key={session.id} className="card overflow-hidden">
                {/* Session Header */}
                <div
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-tertiary)]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-[var(--primary)]" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                    )}
                    <div className="p-2 rounded-lg bg-[var(--success)]/20">
                      <Trophy className="w-5 h-5 text-[var(--success)]" />
                    </div>
                    <div>
                      <span className="font-medium text-[var(--text-primary)] block">
                        {session.routines?.name || 'Rutina eliminada'}
                      </span>
                      <span className="text-sm text-[var(--text-muted)]">
                        {formatDate(session.created_at)} • {formatTime(session.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-bold text-[var(--primary)]">
                        {volume.toLocaleString()} kg
                      </span>
                      <span className="text-xs text-[var(--text-muted)] block">
                        Volumen
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSession(session.id)
                      }}
                      className="p-2 rounded-lg hover:bg-[var(--danger)]/20 text-[var(--text-muted)] hover:text-[var(--danger)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Session Details */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] p-4 bg-[var(--bg-tertiary)]/30 space-y-4">
                    {exerciseGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="bg-[var(--bg-secondary)] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Dumbbell className="w-4 h-4 text-[var(--primary)]" />
                          <span className="font-medium text-[var(--text-primary)]">
                            {group.exercise?.name}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {group.exercise?.categories?.name}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          {group.sets.sort((a, b) => a.set_number - b.set_number).map((setLog) => (
                            <div
                              key={setLog.id}
                              className="flex items-center gap-2 text-sm p-2 rounded bg-[var(--bg-tertiary)]/50"
                            >
                              <span className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-medium">
                                {setLog.set_number}
                              </span>
                              
                              {editingSet?.setLogId === setLog.id ? (
                                <>
                                  <input
                                    type="number"
                                    value={editingSet.weight_kg}
                                    onChange={(e) => setEditingSet(prev => ({ ...prev, weight_kg: parseFloat(e.target.value) || 0 }))}
                                    className="input w-16 py-1 text-center text-sm"
                                  />
                                  <span className="text-[var(--text-muted)]">kg ×</span>
                                  <input
                                    type="number"
                                    value={editingSet.reps}
                                    onChange={(e) => setEditingSet(prev => ({ ...prev, reps: parseInt(e.target.value) || 0 }))}
                                    className="input w-14 py-1 text-center text-sm"
                                  />
                                  <button
                                    onClick={saveEditSet}
                                    disabled={saving}
                                    className="p-1 rounded bg-[var(--success)]/20 text-[var(--success)] hover:bg-[var(--success)]/30"
                                  >
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={() => setEditingSet(null)}
                                    className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="flex-1 text-[var(--text-primary)]">
                                    {setLog.weight_kg} kg × {setLog.reps} reps
                                  </span>
                                  <button
                                    onClick={() => startEditSet(setLog)}
                                    className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--primary)]"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteSetLog(setLog.id)}
                                    className="p-1 rounded hover:bg-[var(--danger)]/20 text-[var(--text-muted)] hover:text-[var(--danger)]"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
