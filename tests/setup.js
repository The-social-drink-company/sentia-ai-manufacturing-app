import '@testing-library/jest-dom';
import React from 'react';
import { vi, beforeEach } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.VITE_API_URL = 'http://localhost:5000/api';
process.env.VITE_CLERK_PUBLISHABLE_KEY = 'test-key';

vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    user: {
      id: 'test-user',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      publicMetadata: { role: 'admin' }
    },
    isLoaded: true,
    isSignedIn: true
  })),
  useAuth: vi.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
    getToken: vi.fn(() => Promise.resolve('test-token')),
    signOut: vi.fn()
  })),
  useClerk: vi.fn(() => ({
    openSignIn: vi.fn(),
    openSignUp: vi.fn(),
    closeSignIn: vi.fn(),
    closeSignUp: vi.fn()
  })),
  ClerkProvider: ({ children }) => children,
  SignIn: () => '<div>Sign In</div>',
  SignUp: () => '<div>Sign Up</div>'
}));

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
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn()
  },
  Toaster: () => React.createElement('div', { 'data-testid': 'toaster' })
}));

vi.mock('react-router-dom', () => ({
  __esModule: true,
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  RouterProvider: ({ router }) =>
    React.createElement('div', { 'data-testid': 'router-provider', 'data-router-loaded': Boolean(router) }),
  createBrowserRouter: vi.fn((routes) => ({ routes })),
  createMemoryRouter: vi.fn((routes, options = {}) => ({ routes, options })),
  Navigate: ({ children }) => React.createElement(React.Fragment, null, children ?? null),
  Outlet: ({ children }) => React.createElement('div', { 'data-testid': 'outlet' }, children ?? null),
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: '/' }))
}));

global.fetch = vi.fn();

export const mockFetch = (response) => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => response,
    text: async () => JSON.stringify(response)
  });
};

beforeEach(() => {
  fetch.mockClear();
});
