import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } })
    }
  }
}))

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@test.com' },
    loading: false,
    signOut: vi.fn()
  }),
  AuthProvider: ({ children }) => children
}))

import { RoutinesPage } from '../pages/RoutinesPage'
import { LibraryPage } from '../pages/LibraryPage'
import { GoalsPage } from '../pages/GoalsPage'

describe('RoutinesPage', () => {
  it('renders page title', () => {
    render(<MemoryRouter><RoutinesPage /></MemoryRouter>)
    expect(screen.getByText('Rutinas')).toBeInTheDocument()
  })

  it('shows new routine button', () => {
    render(<MemoryRouter><RoutinesPage /></MemoryRouter>)
    expect(screen.getByText('Nueva')).toBeInTheDocument()
  })
})

describe('LibraryPage', () => {
  it('renders page title', () => {
    render(<MemoryRouter><LibraryPage /></MemoryRouter>)
    expect(screen.getByText('Biblioteca')).toBeInTheDocument()
  })
})

describe('GoalsPage', () => {
  it('renders page title', () => {
    render(<MemoryRouter><GoalsPage /></MemoryRouter>)
    expect(screen.getByText('Metas')).toBeInTheDocument()
  })
})
