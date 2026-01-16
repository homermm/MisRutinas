import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ routineId: 'test-id' })
  }
})

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    })
  }
}))

describe('BottomNav', () => {
  it('renders all navigation items', async () => {
    const { BottomNav } = await import('../components/layout/BottomNav')
    render(<BottomNav />, { wrapper: BrowserRouter })
    
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Rutinas')).toBeInTheDocument()
    expect(screen.getByText('Biblioteca')).toBeInTheDocument()
    expect(screen.getByText('Historial')).toBeInTheDocument()
    expect(screen.getByText('Perfil')).toBeInTheDocument()
  })

  it('has correct link destinations', async () => {
    const { BottomNav } = await import('../components/layout/BottomNav')
    render(<BottomNav />, { wrapper: BrowserRouter })
    
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
    expect(links[0]).toHaveAttribute('href', '/')
    expect(links[1]).toHaveAttribute('href', '/routines')
    expect(links[2]).toHaveAttribute('href', '/library')
    expect(links[3]).toHaveAttribute('href', '/history')
    expect(links[4]).toHaveAttribute('href', '/profile')
  })
})

describe('RestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders timer title', async () => {
    const { RestTimer } = await import('../components/workout/RestTimer')
    render(<RestTimer onClose={() => {}} />)
    
    expect(screen.getByText('Descanso')).toBeInTheDocument()
  })

  it('shows preset buttons', async () => {
    const { RestTimer } = await import('../components/workout/RestTimer')
    render(<RestTimer onClose={() => {}} />)
    
    // Check that all preset time buttons exist
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(4) // At least preset buttons + controls
  })
})
