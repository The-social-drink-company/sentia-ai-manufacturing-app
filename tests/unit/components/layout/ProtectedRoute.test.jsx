import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import ProtectedRoute from '../../../../src/components/layout/ProtectedRoute'
import { useAuth } from '../../../../src/hooks/useAuth.js'

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    MemoryRouter: actual.MemoryRouter,
    Navigate: vi.fn(({ to }) => <div data-testid="navigate-to">{to}</div>),
    useLocation: vi.fn(() => ({
      pathname: '/dashboard',
      search: '',
      hash: '',
    })),
  }
})

vi.mock('@/components/auth/RedirectToSignInEnvironmentAware', () => ({
  default: ({ redirectUrl }) => <div data-testid="clerk-redirect">Redirecting to Clerk: {redirectUrl}</div>,
}))

vi.mock('../../../../src/hooks/useAuth.js', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    mode: 'development',
  })),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup() // Clean up DOM after each test
  })

  describe('Authenticated Users', () => {
    it('should render children when user is authenticated', () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
        mode: 'development',
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should render children in Clerk mode when authenticated', () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
        mode: 'clerk',
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  describe('Unauthenticated Users - Clerk Mode', () => {
    it('should redirect to Clerk sign-in when not authenticated in Clerk mode', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        mode: 'clerk',
      })

      useLocation.mockReturnValue({
        pathname: '/dashboard',
        search: '',
        hash: '',
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      // Should show Clerk redirect component
      expect(screen.getByTestId('clerk-redirect')).toBeInTheDocument()
      expect(screen.getByText(/Redirecting to Clerk: \/dashboard/i)).toBeInTheDocument()

      // Should not render protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should preserve query parameters in Clerk redirect URL', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        mode: 'clerk',
      })

      useLocation.mockReturnValue({
        pathname: '/dashboard',
        search: '?tab=analytics',
        hash: '#section-1',
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByTestId('clerk-redirect')).toBeInTheDocument()
      expect(screen.getByText(/Redirecting to Clerk: \/dashboard\?tab=analytics#section-1/i)).toBeInTheDocument()
    })
  })

  describe('Unauthenticated Users - Non-Clerk Mode', () => {
    it('should navigate to /login when not authenticated in development mode', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        mode: 'development',
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      // Should show Navigate component to /login
      expect(screen.getByTestId('navigate-to')).toBeInTheDocument()
      expect(screen.getByText('/login')).toBeInTheDocument()

      // Should not render protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should navigate to /login when not authenticated with no mode specified', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        mode: undefined,
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByTestId('navigate-to')).toBeInTheDocument()
      expect(screen.getByText('/login')).toBeInTheDocument()
    })
  })

  describe('Location Preservation', () => {
    it('should preserve the attempted route location for Clerk redirect', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        mode: 'clerk',
      })

      useLocation.mockReturnValue({
        pathname: '/forecasting/advanced',
        search: '?model=ensemble',
        hash: '#results',
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      const redirect = screen.getByTestId('clerk-redirect')
      expect(redirect).toBeInTheDocument()
      expect(redirect.textContent).toContain('/forecasting/advanced?model=ensemble#results')
    })
  })

  describe('Children Rendering', () => {
    it('should render multiple children when authenticated', () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
        mode: 'development',
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Child 1</div>
            <div>Child 2</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
    })

    it('should render complex component trees when authenticated', () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
        mode: 'clerk',
      })

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>
              <h1>Dashboard</h1>
              <nav>
                <a href="/link1">Link 1</a>
                <a href="/link2">Link 2</a>
              </nav>
              <main>Content</main>
            </div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Link 1')).toBeInTheDocument()
      expect(screen.getByText('Link 2')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })
})
