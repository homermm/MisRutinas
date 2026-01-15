import { useState } from 'react'
import { Calculator, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function CalculatorPage() {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')

  // Calculate 1RM using multiple formulas
  const calculate1RM = () => {
    const w = parseFloat(weight)
    const r = parseInt(reps)
    if (!w || !r || r > 30 || r < 1) return null
    
    if (r === 1) return { oneRM: w, brzycki: w, epley: w }
    
    // Brzycki formula (most accurate for <10 reps)
    const brzycki = w * (36 / (37 - r))
    
    // Epley formula (better for higher reps)
    const epley = w * (1 + r / 30)
    
    // Average
    const oneRM = Math.round((brzycki + epley) / 2)
    
    return { oneRM, brzycki: Math.round(brzycki), epley: Math.round(epley) }
  }

  const result = calculate1RM()

  // Rep percentages table
  const repTable = [
    { reps: 1, percent: 100 },
    { reps: 2, percent: 97 },
    { reps: 3, percent: 93 },
    { reps: 4, percent: 90 },
    { reps: 5, percent: 87 },
    { reps: 6, percent: 85 },
    { reps: 8, percent: 80 },
    { reps: 10, percent: 75 },
    { reps: 12, percent: 70 },
    { reps: 15, percent: 65 },
  ]

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Calculadora 1RM
          </h1>
          <p className="text-[var(--text-secondary)]">
            Estimá tu repetición máxima
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="card p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-[var(--text-muted)] block mb-2">
              Peso levantado (kg)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="input w-full text-center text-xl py-3"
              placeholder="80"
              min="1"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--text-muted)] block mb-2">
              Repeticiones
            </label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="input w-full text-center text-xl py-3"
              placeholder="5"
              min="1"
              max="30"
            />
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="p-6 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-center">
            <p className="text-white/70 text-sm mb-1">Tu 1RM estimado</p>
            <p className="text-5xl font-bold text-white">{result.oneRM} kg</p>
            <div className="flex justify-center gap-4 mt-3 text-sm text-white/60">
              <span>Brzycki: {result.brzycki}kg</span>
              <span>Epley: {result.epley}kg</span>
            </div>
          </div>
        )}

        {!result && weight && reps && (
          <p className="text-center text-[var(--text-muted)] py-4">
            Ingresá peso y repeticiones (1-30)
          </p>
        )}
      </div>

      {/* Rep Max Table */}
      {result && (
        <div className="card p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[var(--primary)]" />
            Tabla de Pesos por Repeticiones
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {repTable.map(({ reps: r, percent }) => {
              const w = Math.round(result.oneRM * percent / 100)
              return (
                <div key={r} className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-center">
                  <p className="text-lg font-bold text-[var(--text-primary)]">{w}kg</p>
                  <p className="text-xs text-[var(--text-muted)]">{r} rep</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{percent}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="card p-4">
        <h3 className="font-semibold text-[var(--text-primary)] mb-2">¿Cómo funciona?</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          El 1RM (One Rep Max) es el peso máximo que podés levantar en una sola repetición. 
          Usamos las fórmulas de <strong>Brzycki</strong> (mejor para menos de 10 reps) y 
          <strong> Epley</strong> (mejor para más reps) y promediamos el resultado.
        </p>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          💡 Tip: Es más preciso con 3-8 repeticiones.
        </p>
      </div>
    </div>
  )
}
