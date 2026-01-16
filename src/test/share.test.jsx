import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ShareSessionCard } from '../components/ShareSessionCard'

describe('ShareSessionCard', () => {
  const mockSession = {
    id: 'test-session-123',
    created_at: '2024-01-15T10:00:00Z',
    routines: { name: 'Push Day' },
    set_logs: [
      { exercise_id: '1', reps: 10, weight_kg: 100, exercises: { name: 'Bench Press' } },
      { exercise_id: '1', reps: 8, weight_kg: 110, exercises: { name: 'Bench Press' } },
      { exercise_id: '2', reps: 12, weight_kg: 60, exercises: { name: 'Shoulder Press' } },
    ]
  }

  it('renders session name', () => {
    render(
      <MemoryRouter>
        <ShareSessionCard session={mockSession} onClose={vi.fn()} />
      </MemoryRouter>
    )
    expect(screen.getByText('Push Day')).toBeInTheDocument()
  })

  it('shows MisRutinas branding', () => {
    render(
      <MemoryRouter>
        <ShareSessionCard session={mockSession} onClose={vi.fn()} />
      </MemoryRouter>
    )
    expect(screen.getByText('MisRutinas')).toBeInTheDocument()
  })

  it('shows share button', () => {
    render(
      <MemoryRouter>
        <ShareSessionCard session={mockSession} onClose={vi.fn()} />
      </MemoryRouter>
    )
    expect(screen.getByText('Compartir')).toBeInTheDocument()
  })

  it('shows download button', () => {
    render(
      <MemoryRouter>
        <ShareSessionCard session={mockSession} onClose={vi.fn()} />
      </MemoryRouter>
    )
    expect(screen.getByText('Guardar')).toBeInTheDocument()
  })

  it('shows close button', () => {
    render(
      <MemoryRouter>
        <ShareSessionCard session={mockSession} onClose={vi.fn()} />
      </MemoryRouter>
    )
    expect(screen.getByText('Cerrar')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <ShareSessionCard session={mockSession} onClose={onClose} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('Cerrar'))
    expect(onClose).toHaveBeenCalled()
  })

  it('displays exercise and set count', () => {
    render(
      <MemoryRouter>
        <ShareSessionCard session={mockSession} onClose={vi.fn()} />
      </MemoryRouter>
    )
    // 2 unique exercises
    expect(screen.getByText('2')).toBeInTheDocument()
    // 3 sets total
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
