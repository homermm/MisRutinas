import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Scale, Ruler, Plus, Trash2, Loader2, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react'

const MEASUREMENT_FIELDS = [
  { key: 'weight_kg', label: 'Peso', unit: 'kg', icon: Scale },
  { key: 'chest_cm', label: 'Pecho', unit: 'cm', icon: Ruler },
  { key: 'waist_cm', label: 'Cintura', unit: 'cm', icon: Ruler },
  { key: 'hips_cm', label: 'Caderas', unit: 'cm', icon: Ruler },
  { key: 'bicep_left_cm', label: 'Bíceps Izq', unit: 'cm', icon: Ruler },
  { key: 'bicep_right_cm', label: 'Bíceps Der', unit: 'cm', icon: Ruler },
  { key: 'thigh_left_cm', label: 'Muslo Izq', unit: 'cm', icon: Ruler },
  { key: 'thigh_right_cm', label: 'Muslo Der', unit: 'cm', icon: Ruler },
  { key: 'body_fat_percent', label: '% Grasa', unit: '%', icon: Scale },
]

export function BodyMeasurementsPage() {
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0] })

  useEffect(() => {
    fetchMeasurements()
  }, [])

  const fetchMeasurements = async () => {
    try {
      const { data } = await supabase
        .from('body_measurements')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)

      setMeasurements(data || [])
    } catch (error) {
      console.error('Error fetching measurements:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveMeasurement = async () => {
    if (!form.date) return
    setSaving(true)
    try {
      // Check if entry exists for this date
      const { data: existing } = await supabase
        .from('body_measurements')
        .select('id')
        .eq('date', form.date)
        .single()

      if (existing) {
        // Update existing
        await supabase
          .from('body_measurements')
          .update(form)
          .eq('id', existing.id)
      } else {
        // Insert new
        await supabase
          .from('body_measurements')
          .insert(form)
      }

      fetchMeasurements()
      setShowForm(false)
      setForm({ date: new Date().toISOString().split('T')[0] })
    } catch (error) {
      console.error('Error saving measurement:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteMeasurement = async (id) => {
    if (!confirm('¿Eliminar esta medición?')) return
    try {
      await supabase.from('body_measurements').delete().eq('id', id)
      fetchMeasurements()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  // Calculate trend (compare last 2 entries)
  const getTrend = (field) => {
    if (measurements.length < 2) return null
    const current = measurements[0][field]
    const previous = measurements[1][field]
    if (!current || !previous) return null
    const diff = current - previous
    if (Math.abs(diff) < 0.1) return null
    return { diff, isUp: diff > 0 }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    )
  }

  const latestMeasurement = measurements[0] || {}

  return (
    <div className="space-y-6 fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Medidas Corporales
          </h1>
          <p className="text-[var(--text-muted)]">
            Seguimiento de peso y medidas
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary px-4 py-2 rounded-full flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-4 space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Fecha</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {MEASUREMENT_FIELDS.map(field => (
              <div key={field.key}>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  {field.label} ({field.unit})
                </label>
                <input
                  type="number"
                  value={form[field.key] || ''}
                  onChange={(e) => setForm({ ...form, [field.key]: parseFloat(e.target.value) || null })}
                  className="input"
                  placeholder="0"
                  step="0.1"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Notas</label>
            <input
              type="text"
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input"
              placeholder="Notas opcionales..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveMeasurement}
              disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="btn-secondary px-4"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Current Stats */}
      {measurements.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {MEASUREMENT_FIELDS.slice(0, 3).map(field => {
            const value = latestMeasurement[field.key]
            const trend = getTrend(field.key)
            const Icon = field.icon
            
            return (
              <div key={field.key} className="card p-3 text-center">
                <Icon className="w-5 h-5 mx-auto text-[var(--primary)] mb-1" />
                <div className="text-xl font-bold text-[var(--text-primary)]">
                  {value ? `${value}${field.unit}` : '-'}
                </div>
                <div className="text-xs text-[var(--text-muted)]">{field.label}</div>
                {trend && (
                  <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${
                    trend.isUp ? 'text-[var(--danger)]' : 'text-[var(--success)]'
                  }`}>
                    {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trend.diff > 0 ? '+' : ''}{trend.diff.toFixed(1)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="font-semibold text-[var(--text-primary)] mb-3">Historial</h2>
        <div className="space-y-2">
          {measurements.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] py-8">
              No hay mediciones registradas
            </p>
          ) : (
            measurements.map(m => (
              <div key={m.id} className="card p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[var(--text-primary)]">
                    {new Date(m.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => deleteMeasurement(m.id)}
                    className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  {MEASUREMENT_FIELDS.map(field => 
                    m[field.key] ? (
                      <span key={field.key} className="text-[var(--text-secondary)]">
                        {field.label}: <strong>{m[field.key]}{field.unit}</strong>
                      </span>
                    ) : null
                  )}
                </div>
                {m.notes && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">{m.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
