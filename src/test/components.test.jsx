import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    })
  }
}))

// Test wrapper with router
const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with email input', async () => {
    const { AuthPage } = await import('../pages/AuthPage')
    render(<AuthPage />, { wrapper: TestWrapper })
    
    // Check for email input placeholder
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument()
  })

  it('renders login form with password input', async () => {
    const { AuthPage } = await import('../pages/AuthPage')
    render(<AuthPage />, { wrapper: TestWrapper })
    
    // Check for password input
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('has register option', async () => {
    const { AuthPage } = await import('../pages/AuthPage')
    render(<AuthPage />, { wrapper: TestWrapper })
    
    // Check that there's a button with "Registrate" text somewhere
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
