import '@testing-library/jest-dom';
import React from 'react';
import { vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Import existing setup
import './setup.js';

// Enhanced cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  // Clear any pending timers
  vi.clearAllTimers();
});

// Global test setup
beforeAll(() => {
  // Enhanced environment variables
  process.env.NODE_ENV = 'test';
  process.env.VITE_API_URL = 'http://localhost:5000/api';
  process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_test_enhanced_key';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/sentia_test';
  
  // Mock timers
  vi.useFakeTimers();
  
  // Enhanced console mocking with selective suppression
  const originalConsole = global.console;
  global.console = {
    ...originalConsole,
    log: process.env.VITEST_VERBOSE ? originalConsole.log : vi.fn(),
    debug: vi.fn(),
    info: process.env.VITEST_VERBOSE ? originalConsole.info : vi.fn(),
    warn: originalConsole.warn, // Keep warnings visible
    error: originalConsole.error // Keep errors visible
  };
});

afterAll(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// Enhanced fetch mock with better error handling
const createMockResponse = (data, options = {}) => {
  const {
    status = 200,
    statusText = 'OK',
    headers = { 'content-type': 'application/json' },
    ok = status >= 200 && status < 300
  } = options;

  return Promise.resolve({
    ok,
    status,
    statusText,
    headers: new Map(Object.entries(headers)),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    clone: () => createMockResponse(data, options)
  });
};

global.fetch = vi.fn();

// Enhanced mock helpers
export const mockFetchSuccess = (data, options = {}) => {
  global.fetch.mockResolvedValueOnce(createMockResponse(data, { ...options, ok: true }));
};

export const mockFetchError = (error, status = 500) => {
  global.fetch.mockRejectedValueOnce(
    createMockResponse({ error }, { status, ok: false })
  );
};

export const mockFetchSequence = (responses) => {
  responses.forEach(({ data, options = {} }) => {
    global.fetch.mockResolvedValueOnce(createMockResponse(data, options));
  });
};

// Enhanced Web APIs mocking
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: []
}));

global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn()
}));

global.MutationObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  takeRecords: vi.fn(() => [])
}));

// Enhanced window.matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('max-width: 768px') ? false : true,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Enhanced storage mocks with realistic behavior
const createStorageMock = () => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn(key => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn(index => Object.keys(store)[index] || null)
  };
};

Object.defineProperty(window, 'localStorage', { value: createStorageMock() });
Object.defineProperty(window, 'sessionStorage', { value: createStorageMock() });

// Enhanced Clerk mocking with more realistic behavior
vi.mock('@clerk/clerk-react', () => ({
  useAuth: vi.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    getToken: vi.fn().mockResolvedValue('mock-jwt-token'),
    signOut: vi.fn().mockResolvedValue(undefined)
  })),
  useUser: vi.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@sentiaspirits.com' }],
      publicMetadata: { role: 'admin', department: 'finance' },
      privateMetadata: {},
      unsafeMetadata: {}
    }
  })),
  useClerk: vi.fn(() => ({
    loaded: true,
    user: null,
    session: null
  })),
  SignIn: ({ children }) => React.createElement('div', { 'data-testid': 'sign-in' }, children),
  SignUp: ({ children }) => React.createElement('div', { 'data-testid': 'sign-up' }, children),
  UserButton: () => React.createElement('div', { 'data-testid': 'user-button' }),
  ClerkProvider: ({ children }) => children,
  ClerkLoaded: ({ children }) => children,
  ClerkLoading: () => React.createElement('div', { 'data-testid': 'clerk-loading' })
}));

// Enhanced React Router mocking
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default'
    })),
    useParams: vi.fn(() => ({})),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    BrowserRouter: ({ children }) => children,
    Routes: ({ children }) => children,
    Route: ({ children }) => children,
    Link: ({ children, to, ...props }) => 
      React.createElement('a', { href: to, ...props, 'data-testid': 'router-link' }, children),
    NavLink: ({ children, to, ...props }) => 
      React.createElement('a', { href: to, ...props, 'data-testid': 'nav-link' }, children)
  };
});

// Enhanced TanStack Query mocking
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isSuccess: true,
    isFetching: false
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    data: null
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    removeQueries: vi.fn()
  })),
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn()
  })),
  QueryClientProvider: ({ children }) => children
}));

// Mock Chart.js and react-chartjs-2
vi.mock('chart.js/auto', () => ({
  default: vi.fn(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    render: vi.fn()
  }))
}));

vi.mock('react-chartjs-2', () => ({
  Bar: vi.fn(() => React.createElement('div', { 'data-testid': 'bar-chart' })),
  Line: vi.fn(() => React.createElement('div', { 'data-testid': 'line-chart' })),
  Pie: vi.fn(() => React.createElement('div', { 'data-testid': 'pie-chart' })),
  Doughnut: vi.fn(() => React.createElement('div', { 'data-testid': 'doughnut-chart' }))
}));

// Enhanced date mocking
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // Simple YYYY-MM-DD format
  }),
  parseISO: vi.fn(str => new Date(str)),
  isValid: vi.fn(date => date instanceof Date && !isNaN(date)),
  addDays: vi.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  subDays: vi.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  startOfMonth: vi.fn(date => new Date(date.getFullYear(), date.getMonth(), 1)),
  endOfMonth: vi.fn(date => new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  differenceInDays: vi.fn((dateLeft, dateRight) => 
    Math.floor((dateLeft - dateRight) / (24 * 60 * 60 * 1000))
  )
}));

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@sentiaspirits.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  isActive: true,
  department: 'finance',
  organizationId: 'test-org',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createMockProduct = (overrides = {}) => ({
  id: 'test-product-id',
  name: 'Test Product',
  sku: 'TEST-001',
  price: 99.99,
  cost: 50.00,
  category: 'Test Category',
  region: 'UK',
  source: 'shopify',
  stockLevel: 100,
  reorderPoint: 20,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createMockOrder = (overrides = {}) => ({
  id: 'test-order-id',
  orderNumber: 'ORD-001',
  customerId: 'test-customer-id',
  status: 'pending',
  total: 199.98,
  currency: 'GBP',
  region: 'UK',
  source: 'shopify',
  items: [
    {
      productId: 'test-product-id',
      quantity: 2,
      price: 99.99
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createMockForecast = (overrides = {}) => ({
  id: 'test-forecast-id',
  type: 'sales',
  period: 'monthly',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  predictions: [
    { date: new Date().toISOString(), value: 10000, confidence: 0.85 }
  ],
  accuracy: 0.92,
  status: 'active',
  createdBy: 'test-user-id',
  createdAt: new Date().toISOString(),
  ...overrides
});

// Test utilities
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

export const createMockApiError = (message = 'API Error', status = 500) => ({
  message,
  status,
  response: {
    status,
    statusText: message,
    data: { error: message }
  }
});

// Custom render helpers
export const renderWithProviders = (ui, options = {}) => {
  const { initialEntries = ['/'], ...renderOptions } = options;
  
  const Wrapper = ({ children }) => {
    return React.createElement(
      'div',
      { 'data-testid': 'test-wrapper' },
      children
    );
  };
  
  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    // Add custom utilities here if needed
  };
};

// Re-export testing utilities
export { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
export { vi };

