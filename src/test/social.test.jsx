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

import { FriendsPage } from '../pages/FriendsPage'
import { TimerPage } from '../pages/TimerPage'

describe('FriendsPage', () => {
  it('renders page title', () => {
    render(<MemoryRouter><FriendsPage /></MemoryRouter>)
    expect(screen.getByText('Amigos')).toBeInTheDocument()
  })
})

describe('TimerPage', () => {
  it('renders timer component', () => {
    render(<MemoryRouter><TimerPage /></MemoryRouter>)
    expect(screen.getByText('Descanso')).toBeInTheDocument()
  })
})
