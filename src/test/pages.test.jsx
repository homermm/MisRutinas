import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock Supabase - simplified version that works
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

import { CalculatorPage } from '../pages/CalculatorPage'

describe('Calculator Page', () => {
  it('renders calculator title', () => {
    render(
      <MemoryRouter>
        <CalculatorPage />
      </MemoryRouter>
    )
    expect(screen.getByText('Calculadora 1RM')).toBeInTheDocument()
  })

  it('has weight input', () => {
    render(
      <MemoryRouter>
        <CalculatorPage />
      </MemoryRouter>
    )
    expect(screen.getByPlaceholderText('80')).toBeInTheDocument()
  })

  it('has reps input', () => {
    render(
      <MemoryRouter>
        <CalculatorPage />
      </MemoryRouter>
    )
    expect(screen.getByPlaceholderText('5')).toBeInTheDocument()
  })

  it('shows how it works section', () => {
    render(
      <MemoryRouter>
        <CalculatorPage />
      </MemoryRouter>
    )
    expect(screen.getByText('¿Cómo funciona?')).toBeInTheDocument()
  })

  it('mentions formulas', () => {
    render(
      <MemoryRouter>
        <CalculatorPage />
      </MemoryRouter>
    )
    expect(screen.getByText(/Brzycki/)).toBeInTheDocument()
    expect(screen.getByText(/Epley/)).toBeInTheDocument()
  })
})
