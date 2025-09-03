import '@testing-library/jest-dom'

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
      emailAddresses: [{ emailAddress: 'test@example.com' }]
    }
  })),
  ClerkProvider: ({ children }) => children,
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  UserButton: () => <div data-testid="user-button">User</div>
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