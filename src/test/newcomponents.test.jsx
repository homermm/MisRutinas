import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        gte: () => ({
          order: () => Promise.resolve({ data: [], error: null })
        }),
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          }),
          single: () => Promise.resolve({ data: null, error: null })
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        in: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } })
    }
  }
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@test.com' },
    loading: false,
    signOut: vi.fn()
  }),
  AuthProvider: ({ children }) => children
}))

import { ActivityCalendar } from '../components/ActivityCalendar'
import { ProgressChart } from '../components/ProgressChart'

describe('Phase 2-3 Components', () => {
  
  describe('ActivityCalendar', () => {
    it('renders without crashing', async () => {
      render(<ActivityCalendar weeks={4} />)
      await waitFor(() => {
        expect(screen.getByText('Actividad')).toBeInTheDocument()
      })
    })

    it('shows legend', async () => {
      render(<ActivityCalendar weeks={4} />)
      await waitFor(() => {
        expect(screen.getByText('Menos')).toBeInTheDocument()
        expect(screen.getByText('Más')).toBeInTheDocument()
      })
    })

    it('shows summary section', async () => {
      render(<ActivityCalendar weeks={4} />)
      await waitFor(() => {
        expect(screen.getByText(/días activos/)).toBeInTheDocument()
      })
    })

    it('shows week count in footer', async () => {
      render(<ActivityCalendar weeks={8} />)
      await waitFor(() => {
        expect(screen.getByText(/8 semanas/)).toBeInTheDocument()
      })
    })
  })

  describe('ProgressChart', () => {
    it('renders without crashing', async () => {
      render(<ProgressChart exerciseId="test-id" exerciseName="Bench Press" />)
      // When no data, shows empty state
      await waitFor(() => {
        expect(screen.getByText(/No hay datos/)).toBeInTheDocument()
      })
    })

    it('shows empty state when no data', async () => {
      render(<ProgressChart exerciseId="test-id" exerciseName="Test" />)
      await waitFor(() => {
        expect(screen.getByText(/No hay datos/)).toBeInTheDocument()
      })
    })
  })
})
