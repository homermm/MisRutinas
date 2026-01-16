import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

/**
 * Activity Calendar - GitHub-style heatmap showing workout activity
 */
export function ActivityCalendar({ weeks = 12 }) {
  const [activityData, setActivityData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivity()
  }, [])

  const fetchActivity = async () => {
    try {
      // Get sessions from the last N weeks
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - (weeks * 7))

      const { data: sessions } = await supabase
        .from('sessions')
        .select('created_at, set_logs(reps, weight_kg)')
        .gte('created_at', startDate.toISOString())
        .order('created_at')

      // Group sessions by date
      const activity = {}
      sessions?.forEach(session => {
        const date = session.created_at.split('T')[0]
        const volume = session.set_logs?.reduce((sum, log) => 
          sum + (log.reps * log.weight_kg), 0) || 0
        
        if (!activity[date]) {
          activity[date] = { count: 0, volume: 0 }
        }
        activity[date].count++
        activity[date].volume += volume
      })

      setActivityData(activity)
    } catch (error) {
      console.error('Error fetching activity:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate calendar grid (weeks x 7 days)
  const generateCalendarDays = () => {
    const days = []
    const today = new Date()
    const totalDays = weeks * 7

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      days.push(date.toISOString().split('T')[0])
    }

    return days
  }

  // Get intensity level (0-4) based on activity
  const getIntensityLevel = (dateStr) => {
    const data = activityData[dateStr]
    if (!data) return 0
    if (data.count >= 2) return 4 // Multiple sessions
    if (data.volume >= 5000) return 4
    if (data.volume >= 2500) return 3
    if (data.volume >= 1000) return 2
    return 1
  }

  // Get color based on intensity
  const getColor = (level) => {
    const colors = [
      'bg-[var(--bg-tertiary)]',           // 0 - No activity
      'bg-[var(--success)]/30',            // 1 - Light
      'bg-[var(--success)]/50',            // 2 - Medium
      'bg-[var(--success)]/70',            // 3 - Heavy
      'bg-[var(--success)]',               // 4 - Very heavy
    ]
    return colors[level] || colors[0]
  }

  const days = generateCalendarDays()
  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 text-[var(--primary)] animate-spin" />
      </div>
    )
  }

  // Group days into weeks for grid layout
  const weeksGrid = []
  for (let i = 0; i < days.length; i += 7) {
    weeksGrid.push(days.slice(i, i + 7))
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--text-primary)]">
          Actividad
        </h3>
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <span>Menos</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${getColor(level)}`}
            />
          ))}
          <span>Más</span>
        </div>
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map((label, i) => (
            <div 
              key={i} 
              className="h-3 text-[10px] text-[var(--text-muted)] flex items-center"
            >
              {i % 2 === 0 ? label : ''}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex gap-1 overflow-x-auto">
          {weeksGrid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((dateStr, dayIndex) => {
                const data = activityData[dateStr]
                const level = getIntensityLevel(dateStr)
                const date = new Date(dateStr)
                const isToday = dateStr === new Date().toISOString().split('T')[0]
                
                return (
                  <div
                    key={dateStr}
                    className={`w-3 h-3 rounded-sm ${getColor(level)} ${
                      isToday ? 'ring-1 ring-[var(--primary)]' : ''
                    } cursor-pointer transition-transform hover:scale-125`}
                    title={`${date.toLocaleDateString('es-AR', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    })}${data ? `: ${data.count} sesión(es), ${data.volume.toLocaleString()}kg` : ': Sin actividad'}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between text-sm">
        <span className="text-[var(--text-muted)]">
          {Object.keys(activityData).length} días activos
        </span>
        <span className="text-[var(--text-muted)]">
          Últimas {weeks} semanas
        </span>
      </div>
    </div>
  )
}
