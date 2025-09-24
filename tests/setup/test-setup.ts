// Enterprise Test Setup for Sentia Manufacturing Dashboard
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// Auto cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.VITE_API_BASE_URL = 'http://localhost:5000/api';
  process.env.VITE_CLERK_PUBLISHABLE_KEY = 'test_clerk_key';
});

// Global test utilities
global.testUtils = {
  mockUser: (role = 'viewer') => ({
    id: 'test-user-id',
    email: 'test@sentia.com',
    role,
    permissions: getPermissionsByRole(role)
  }),

  mockApiResponse: (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data)
  }),

  waitForElement: async (testId: string, timeout = 3000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const element = document.querySelector(`[data-testid="${testId}"]`);
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Element with testId "${testId}" not found`);
  }
};

// Permission helper
function getPermissionsByRole(role: string): string[] {
  const permissions: Record<string, string[]> = {
    admin: ['*'],
    manager: ['read:*', 'write:*', 'delete:inventory', 'export:*'],
    operator: ['read:*', 'write:inventory', 'write:production'],
    viewer: ['read:*']
  };
  return permissions[role] || [];
}

// Mock fetch globally
global.fetch = vi.fn();

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: useLayoutEffect'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});