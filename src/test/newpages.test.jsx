import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock Supabase - inline to fix hoisting issues
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          }),
          in: () => Promise.resolve({ data: [], error: null }),
          gte: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          })
        }),
        or: () => ({
          eq: () => Promise.resolve({ data: [], error: null })
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        in: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
        gte: () => ({
          order: () => Promise.resolve({ data: [], error: null })
        }),
        not: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          })
        })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'new-id' }, error: null })
        })
      }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  }
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@test.com' },
    loading: false,
    signOut: () => {}
  }),
  AuthProvider: ({ children }) => children
}))

// Import pages after mocks
import { LeaderboardPage } from '../pages/LeaderboardPage'
import { ActivityFeedPage } from '../pages/ActivityFeedPage'
import { SharedRoutinesPage } from '../pages/SharedRoutinesPage'
import { BodyMeasurementsPage } from '../pages/BodyMeasurementsPage'
import { Dashboard } from '../pages/Dashboard'

describe('Phase 4 Social Pages', () => {
  
  describe('LeaderboardPage', () => {
    it('renders page title', async () => {
      render(<MemoryRouter><LeaderboardPage /></MemoryRouter>)
      expect(screen.getByText('Leaderboard')).toBeInTheDocument()
    })

    it('shows exercise selector', async () => {
      render(<MemoryRouter><LeaderboardPage /></MemoryRouter>)
      expect(screen.getByText('Seleccionar ejercicio')).toBeInTheDocument()
    })

    it('shows empty state when no data', async () => {
      render(<MemoryRouter><LeaderboardPage /></MemoryRouter>)
      await waitFor(() => {
        expect(screen.getByText(/No hay datos/i)).toBeInTheDocument()
      })
    })
  })

  describe('ActivityFeedPage', () => {
    it('renders page title', async () => {
      render(<MemoryRouter><ActivityFeedPage /></MemoryRouter>)
      expect(screen.getByText('Actividad')).toBeInTheDocument()
    })

    it('shows friend activity subtitle', async () => {
      render(<MemoryRouter><ActivityFeedPage /></MemoryRouter>)
      expect(screen.getByText(/amigos/i)).toBeInTheDocument()
    })

    it('shows empty state with add friends link', async () => {
      render(<MemoryRouter><ActivityFeedPage /></MemoryRouter>)
      await waitFor(() => {
        expect(screen.getByText('Agregar amigos')).toBeInTheDocument()
      })
    })
  })

  describe('SharedRoutinesPage', () => {
    it('renders page title', async () => {
      render(<MemoryRouter><SharedRoutinesPage /></MemoryRouter>)
      expect(screen.getByText('Rutinas Compartidas')).toBeInTheDocument()
    })

    it('has share button', async () => {
      render(<MemoryRouter><SharedRoutinesPage /></MemoryRouter>)
      expect(screen.getByText('Compartir')).toBeInTheDocument()
    })

    it('has search input', async () => {
      render(<MemoryRouter><SharedRoutinesPage /></MemoryRouter>)
      expect(screen.getByPlaceholderText(/Buscar/i)).toBeInTheDocument()
    })

    it('opens share modal on button click', async () => {
      render(<MemoryRouter><SharedRoutinesPage /></MemoryRouter>)
      const shareBtn = screen.getByText('Compartir')
      fireEvent.click(shareBtn)
      await waitFor(() => {
        expect(screen.getByText('Compartir Rutina')).toBeInTheDocument()
      })
    })
  })
})

describe('Phase 3 Analytics Pages', () => {
  
  describe('BodyMeasurementsPage', () => {
    it('renders page title', async () => {
      render(<MemoryRouter><BodyMeasurementsPage /></MemoryRouter>)
      await waitFor(() => {
        expect(screen.getByText('Medidas Corporales')).toBeInTheDocument()
      })
    })

    it('has new measurement button after loading', async () => {
      render(<MemoryRouter><BodyMeasurementsPage /></MemoryRouter>)
      await waitFor(() => {
        expect(screen.getByText('Nueva')).toBeInTheDocument()
      })
    })

    it('shows empty state or current stats after loading', async () => {
      render(<MemoryRouter><BodyMeasurementsPage /></MemoryRouter>)
      await waitFor(() => {
        // Either has empty state or history section
        const hasContent = screen.queryByText(/No hay mediciones/i) || screen.queryByText('Historial')
        expect(hasContent).toBeTruthy()
      })
    })
  })
})

describe('Dashboard', () => {
  it('renders greeting', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    // Should contain one of the greetings
    const greetings = ['Buenos días', 'Buenas tardes', 'Buenas noches']
    const hasGreeting = greetings.some(g => screen.queryByText(new RegExp(g)) !== null)
    expect(hasGreeting).toBe(true)
  })

  it('has quick action buttons', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText('Acciones Rápidas')).toBeInTheDocument()
    expect(screen.getByText('Entrenar')).toBeInTheDocument()
  })
})
