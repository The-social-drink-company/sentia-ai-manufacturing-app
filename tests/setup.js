import '@testing-library/jest-dom'
import React from 'react'
import { vi, beforeEach } from 'vitest'

process.env.NODE_ENV = 'test'
process.env.VITE_API_URL = 'http://localhost:5000/api'
process.env.VITE_CLERK_PUBLISHABLE_KEY = 'test-key'

vi.mock('@clerk/clerk-react', () => ({
  useAuth: vi.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    signOut: vi.fn(),
    getToken: vi.fn(() => Promise.resolve('test-token'))
  })),
  useUser: vi.fn(() => ({
    isLoaded: true,
    user: {
      id: 'test-user',
      fullName: 'Test User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      publicMetadata: { role: 'admin', permissions: ['dashboard.read'] }
    }
  })),
  ClerkProvider: ({ children }) => children,
  SignIn: () => React.createElement('div', null, 'Sign In'),
  SignUp: () => React.createElement('div', null, 'Sign Up')
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: {},
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn()
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    data: null
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn()
  })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }) => children
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn()
  },
  Toaster: () => React.createElement('div', { 'data-testid': 'toaster' })
}))

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: '/' })),
  Link: ({ children }) => React.createElement('a', null, children)
}))

global.fetch = vi.fn()

export const mockFetch = (response) => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => response,
    text: async () => JSON.stringify(response)
  })
}

beforeEach(() => {
  fetch.mockClear()
})
