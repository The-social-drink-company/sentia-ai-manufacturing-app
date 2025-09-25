import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, beforeEach, expect } from 'vitest'

import App from '../../src/App.jsx'
import MockAuthProvider from '../../src/providers/MockAuthProvider.jsx'
import { useAuth } from '../../src/hooks/useAuth.js'

const AuthProbe = () => {
  const { isAuthenticated, isLoaded, login, logout } = useAuth()

  return (
    <div>
      <span data-testid='auth-status'>{isAuthenticated ? 'authenticated' : 'anonymous'}</span>
      <span data-testid='auth-loaded'>{isLoaded ? 'loaded' : 'loading'}</span>
      <button type='button' onClick={() => login({ email: 'qa@sentia.test' })}>
        log in
      </button>
      <button type='button' onClick={() => logout()}>log out</button>
    </div>
  )
}

describe('authentication baseline', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('redirects unauthenticated visitors to the login experience when using the mock provider', async () => {
    window.localStorage.setItem('sentia-mock-auth-v1', JSON.stringify({ user: null, isAuthenticated: false }))

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/sign in with your workspace email/i)).toBeInTheDocument()
    })
  })

  it('allows the mock provider to update authentication state through login and logout', async () => {
    render(
      <MockAuthProvider>
        <AuthProbe />
      </MockAuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-loaded').textContent).toBe('loaded')
    })

    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated')

    fireEvent.click(screen.getByText('log out'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('anonymous')
    })

    fireEvent.click(screen.getByText('log in'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('authenticated')
    })
  })
})
