import { useState, useRef } from 'react'
import { Share2, Download, X, Trophy, Dumbbell, Flame, Clock } from 'lucide-react'

export function ShareSessionCard({ session, onClose }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  if (!session) return null

  const volume = session.set_logs?.reduce((sum, l) => sum + l.reps * l.weight_kg, 0) || 0
  const exerciseCount = new Set(session.set_logs?.map(l => l.exercise_id)).size
  const setCount = session.set_logs?.length || 0

  // Find max weight lift
  const maxLift = session.set_logs?.reduce((max, l) => 
    l.weight_kg > max.weight_kg ? l : max
  , { weight_kg: 0, exercises: { name: '-' } })

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)

    try {
      // Use html2canvas if available, otherwise use native screenshot
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      })
      
      const link = document.createElement('a')
      link.download = `workout-${session.id.slice(0, 8)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Instalá html2canvas para descargar: npm install html2canvas')
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    if (!cardRef.current) return
    
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2
      })
      
      canvas.toBlob(async (blob) => {
        if (navigator.share && blob) {
          const file = new File([blob], 'workout.png', { type: 'image/png' })
          await navigator.share({
            title: 'Mi entrenamiento 💪',
            text: `${session.routines?.name || 'Entrenamiento'} - ${volume.toLocaleString()}kg de volumen`,
            files: [file]
          })
        } else {
          handleDownload()
        }
      })
    } catch (error) {
      console.error('Error sharing:', error)
      handleDownload()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-sm">
        {/* Share Card */}
        <div 
          ref={cardRef}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
          }}
        >
          <div className="p-6 text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6" />
                <span className="font-bold text-lg">MisRutinas</span>
              </div>
              <span className="text-white/70 text-sm">{formatDate(session.created_at)}</span>
            </div>

            {/* Routine Name */}
            <h2 className="text-3xl font-bold mb-6">
              {session.routines?.name || 'Entrenamiento'}
            </h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <Dumbbell className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-3xl font-bold">{volume.toLocaleString()}</p>
                <p className="text-sm opacity-70">kg volumen</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <Trophy className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-3xl font-bold">{maxLift?.weight_kg || 0}</p>
                <p className="text-sm opacity-70">kg máx</p>
              </div>
            </div>

            {/* Exercise Stats */}
            <div className="flex justify-around text-center border-t border-white/20 pt-4">
              <div>
                <p className="text-2xl font-bold">{exerciseCount}</p>
                <p className="text-xs opacity-70">ejercicios</p>
              </div>
              <div className="border-l border-white/20 pl-6">
                <p className="text-2xl font-bold">{setCount}</p>
                <p className="text-xs opacity-70">series</p>
              </div>
              <div className="border-l border-white/20 pl-6">
                <p className="text-2xl font-bold">💪</p>
                <p className="text-xs opacity-70">done!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Cerrar
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Guardar
          </button>
          <button
            onClick={handleShare}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Compartir
          </button>
        </div>
      </div>
    </div>
  )
}
