import '@testing-library/jest-dom'
import React from 'react'
import { vi, beforeEach } from 'vitest'

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
process.env.VITE_API_URL = 'http://localhost:5000/api'
process.env.VITE_CLERK_PUBLISHABLE_KEY = 'test-key'

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    user: {
      id: 'test-user',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      getToken: vi.fn(() => Promise.resolve('test-token'))
    }
  })),
  ClerkProvider: ({ children }) => children,
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  UserButton: () => React.createElement('div', { 'data-testid': 'user-button' }, 'User'),
  SignedIn: ({ children }) => children,
  SignedOut: ({ children }) => React.createElement('div', { 'data-testid': 'signed-out' })
}))

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: {},
    isLoading: false,
    error: null,
    refetch: vi.fn()
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn()
  })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }) => children
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn()
  },
  Toaster: () => React.createElement('div', { 'data-testid': 'toaster' })
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: '/' }))
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Setup fetch mock helper
export const mockFetch = (response) => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => response,
    text: async () => JSON.stringify(response)
  })
}

// Reset mocks between tests
beforeEach(() => {
  fetch.mockClear()
})