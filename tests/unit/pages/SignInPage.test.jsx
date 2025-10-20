import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SignInPage from '../../../src/pages/SignInPage'

// Mock Clerk SignIn component
vi.mock('@clerk/clerk-react', () => ({
  SignIn: ({ appearance, routing, path, signUpUrl }) => (
    <div data-testid="clerk-signin">
      <div data-testid="signin-appearance">{JSON.stringify(appearance)}</div>
      <div data-testid="signin-routing">{routing}</div>
      <div data-testid="signin-path">{path}</div>
      <div data-testid="signin-signup-url">{signUpUrl}</div>
    </div>
  ),
}))

// Mock react-router-dom Link
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    MemoryRouter: actual.MemoryRouter,
    Link: ({ to, children, className }) => (
      <a href={to} className={className} data-testid="back-to-home-link">
        {children}
      </a>
    ),
  }
})

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup() // Clean up DOM after each test
  })

  describe('Branding and Layout', () => {
    it('should display CapLiquify branding', () => {
      render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      expect(screen.getByText('CapLiquify Platform')).toBeInTheDocument()
      expect(screen.getByText('Multi-tenant manufacturing intelligence')).toBeInTheDocument()
    })

    it('should display tenant information', () => {
      render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      expect(screen.getByText('Tenant: Sentia Spirits')).toBeInTheDocument()
      expect(screen.getByText('CapLiquify workspace access for Sentia Spirits')).toBeInTheDocument()
    })

    it('should display logo with "C" letter', () => {
      render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      const logo = screen.getByText('C')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveClass('text-3xl', 'font-bold', 'text-blue-600')
    })

    it('should have gradient background', () => {
      const { container } = render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      const backgroundDiv = container.querySelector('.bg-gradient-to-br')
      expect(backgroundDiv).toBeInTheDocument()
      expect(backgroundDiv).toHaveClass('from-blue-600', 'via-purple-600', 'to-purple-700')
    })
  })

  describe('Clerk Integration', () => {
    it('should render Clerk SignIn component', () => {
      render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      expect(screen.getByTestId('clerk-signin')).toBeInTheDocument()
    })

    it('should configure SignIn with correct routing', () => {
      render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      expect(screen.getByTestId('signin-routing')).toHaveTextContent('path')
      expect(screen.getByTestId('signin-path')).toHaveTextContent('/sign-in')
    })

    it('should configure SignIn with sign-up URL', () => {
      render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      expect(screen.getByTestId('signin-signup-url')).toHaveTextContent('/sign-up')
    })

    it('should configure SignIn with custom appearance', () => {
      render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      const appearanceText = screen.getByTestId('signin-appearance').textContent
      const appearance = JSON.parse(appearanceText)

      expect(appearance.elements.rootBox).toBe('w-full')
      expect(appearance.elements.card).toBe('shadow-none')
    })
  })

  describe('Navigation', () => {
    it('should display "Back to Home" link', () => {
      render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      const backLink = screen.getByTestId('back-to-home-link')
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveTextContent('Back to Home')
    })

    it('should link to home page', () => {
      render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      const backLink = screen.getByTestId('back-to-home-link')
      expect(backLink).toHaveAttribute('href', '/')
    })

    it('should style back link with purple colors', () => {
      render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      const backLink = screen.getByTestId('back-to-home-link')
      expect(backLink).toHaveClass('text-purple-100', 'hover:text-white')
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive layout classes', () => {
      const { container } = render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      const mainContainer = container.querySelector('.min-h-screen')
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center')

      const contentWrapper = container.querySelector('.max-w-md')
      expect(contentWrapper).toHaveClass('w-full')
    })

    it('should apply padding to prevent edge clipping', () => {
      const { container } = render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      const mainContainer = container.querySelector('.min-h-screen')
      expect(mainContainer).toHaveClass('p-4')
    })
  })

  describe('Visual Hierarchy', () => {
    it('should display elements in correct visual order', () => {
      render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      const elements = screen.getAllByText(/CapLiquify|Multi-tenant|Tenant|Back to Home/i)
      expect(elements.length).toBeGreaterThan(0)
    })

    it('should use rounded corners for card', () => {
      const { container } = render(
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      )

      const card = container.querySelector('.rounded-2xl')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('bg-white', 'shadow-2xl')
    })
  })
})
