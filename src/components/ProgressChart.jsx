import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calculate1RM } from '../lib/utils'
import { TrendingUp, Loader2 } from 'lucide-react'

/**
 * Progress Chart - Shows exercise progress over time
 * Uses SVG line chart for weight/1RM progression
 */
export function ProgressChart({ exerciseId, exerciseName }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [metric, setMetric] = useState('weight') // 'weight', '1rm', 'volume'

  useEffect(() => {
    if (exerciseId) fetchProgress()
  }, [exerciseId, metric])

  const fetchProgress = async () => {
    setLoading(true)
    try {
      const { data: logs } = await supabase
        .from('set_logs')
        .select(`
          weight_kg,
          reps,
          created_at,
          sessions!inner(created_at)
        `)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: true })

      if (!logs?.length) {
        setData([])
        return
      }

      // Group by session date and calculate metrics
      const byDate = {}
      logs.forEach(log => {
        const date = log.sessions?.created_at?.split('T')[0] || log.created_at.split('T')[0]
        if (!byDate[date]) {
          byDate[date] = { maxWeight: 0, max1RM: 0, totalVolume: 0 }
        }
        byDate[date].maxWeight = Math.max(byDate[date].maxWeight, log.weight_kg)
        byDate[date].max1RM = Math.max(byDate[date].max1RM, calculate1RM(log.weight_kg, log.reps))
        byDate[date].totalVolume += log.weight_kg * log.reps
      })

      const chartData = Object.entries(byDate)
        .map(([date, metrics]) => ({
          date,
          value: metric === 'weight' ? metrics.maxWeight : 
                 metric === '1rm' ? metrics.max1RM : metrics.totalVolume
        }))
        .slice(-20) // Last 20 sessions

      setData(chartData)
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 text-[var(--primary)] animate-spin" />
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)]">
        No hay datos para mostrar
      </div>
    )
  }

  // SVG chart dimensions
  const width = 300
  const height = 150
  const padding = 20
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  // Generate path
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2)
    const y = height - padding - ((d.value - minValue) / range) * (height - padding * 2)
    return { x, y, ...d }
  })

  const pathD = points.map((p, i) => 
    (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`
  ).join(' ')

  // Gradient area
  const areaD = pathD + 
    ` L${points[points.length-1].x},${height - padding}` +
    ` L${points[0].x},${height - padding} Z`

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
          {exerciseName || 'Progreso'}
        </h3>
        <div className="flex gap-1">
          {[
            { key: 'weight', label: 'Peso' },
            { key: '1rm', label: '1RM' },
            { key: 'volume', label: 'Vol' },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`px-2 py-1 text-xs rounded ${
                metric === m.key 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <defs>
          <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path d={areaD} fill="url(#progressGradient)" />
        
        {/* Line */}
        <path 
          d={pathD} 
          fill="none" 
          stroke="var(--primary)" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
        
        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="var(--bg-primary)"
            stroke="var(--primary)"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
        <span>{data[0]?.date}</span>
        <span className="font-medium text-[var(--text-primary)]">
          Máx: {maxValue.toLocaleString()}{metric === 'volume' ? 'kg' : 'kg'}
        </span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}
