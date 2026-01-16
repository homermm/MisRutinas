import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, PieChart, Loader2, AlertCircle } from 'lucide-react'

// Color palette for categories (will be assigned dynamically)
const CATEGORY_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
]

export function MuscleVolumePage() {
  const [volumeData, setVolumeData] = useState([])
  const [totalVolume, setTotalVolume] = useState(0)
  const [loading, setLoading] = useState(true)
  const [weeks, setWeeks] = useState(4)

  useEffect(() => {
    fetchVolumeData()
  }, [weeks])

  const fetchVolumeData = async () => {
    try {
      const weeksAgo = new Date()
      weeksAgo.setDate(weeksAgo.getDate() - (weeks * 7))

      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          created_at,
          set_logs (
            reps,
            weight_kg,
            exercises (name, categories(id, name))
          )
        `)
        .gte('created_at', weeksAgo.toISOString())

      // Calculate volume per USER CATEGORY
      const volumeByCategory = {}

      let total = 0
      sessions?.forEach(session => {
        session.set_logs?.forEach(log => {
          const volume = log.reps * log.weight_kg
          total += volume
          
          // Use the user's category directly
          const categoryName = log.exercises?.categories?.name || 'Sin categoría'
          
          if (!volumeByCategory[categoryName]) {
            volumeByCategory[categoryName] = 0
          }
          volumeByCategory[categoryName] += volume
        })
      })

      // Convert to array with colors and sort
      const dataArray = Object.entries(volumeByCategory)
        .map(([name, volume], index) => ({
          name,
          volume,
          percentage: total > 0 ? Math.round((volume / total) * 100) : 0,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
        }))
        .filter(d => d.volume > 0)
        .sort((a, b) => b.volume - a.volume)

      setVolumeData(dataArray)
      setTotalVolume(total)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Calculate pie chart segments
  const calculatePieSegments = () => {
    let currentAngle = 0
    return volumeData.map(item => {
      const angle = (item.percentage / 100) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle
      
      const startRad = (startAngle - 90) * Math.PI / 180
      const endRad = (endAngle - 90) * Math.PI / 180
      
      const x1 = 50 + 40 * Math.cos(startRad)
      const y1 = 50 + 40 * Math.sin(startRad)
      const x2 = 50 + 40 * Math.cos(endRad)
      const y2 = 50 + 40 * Math.sin(endRad)
      
      const largeArc = angle > 180 ? 1 : 0
      
      return {
        ...item,
        path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`
      }
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    )
  }

  const pieSegments = calculatePieSegments()

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/stats" className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Volumen por Categoría</h1>
            <p className="text-[var(--text-muted)]">Últimas {weeks} semanas</p>
          </div>
        </div>
      </div>

      {/* Week selector */}
      <div className="flex gap-2">
        {[2, 4, 8, 12].map(w => (
          <button
            key={w}
            onClick={() => { setLoading(true); setWeeks(w) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              weeks === w 
                ? 'bg-[var(--primary)] text-white' 
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            }`}
          >
            {w} sem
          </button>
        ))}
      </div>

      {volumeData.length === 0 ? (
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">No hay datos en este período</p>
        </div>
      ) : (
        <>
          {/* Pie Chart */}
          <div className="card p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Chart */}
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {pieSegments.map((segment, idx) => (
                    <path
                      key={idx}
                      d={segment.path}
                      fill={segment.color}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                  <circle cx="50" cy="50" r="25" fill="var(--bg-secondary)" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl font-bold text-[var(--text-primary)]">{formatNumber(totalVolume)}</p>
                    <p className="text-xs text-[var(--text-muted)]">kg total</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 grid grid-cols-2 gap-2">
                {volumeData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-[var(--text-primary)]">{item.name}</span>
                    <span className="text-sm text-[var(--text-muted)] ml-auto">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Volume Bars */}
          <div className="card p-4">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Detalle por Categoría</h3>
            <div className="space-y-3">
              {volumeData.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--text-primary)]">{item.name}</span>
                    <span className="text-[var(--text-muted)]">{formatNumber(item.volume)} kg</span>
                  </div>
                  <div className="h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${item.percentage}%`, 
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {volumeData.length > 0 && (
            <div className="card p-4 border-l-4 border-[var(--warning)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-2">💡 Sugerencia</h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Tu categoría más entrenada es <strong>{volumeData[0]?.name}</strong> ({volumeData[0]?.percentage}%).
                {volumeData.length > 1 && (
                  <> Considera balancear con más trabajo de <strong>{volumeData[volumeData.length - 1]?.name}</strong>.</>
                )}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
