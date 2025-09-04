// Global test setup for Jest backend tests
import { jest } from '@jest/globals';

// Mock console methods to reduce noise in test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Suppress console.error and console.warn unless specifically needed
  console.error = jest.fn((message, ...args) => {
    // Only show errors that contain 'Error:' to catch real errors
    if (typeof message === 'string' && message.includes('Error:')) {
      originalConsoleError(message, ...args);
    }
  });

  console.warn = jest.fn((message, ...args) => {
    // Only show warnings for test failures
    if (typeof message === 'string' && message.includes('Test')) {
      originalConsoleWarn(message, ...args);
    }
  });
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(30000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.TEST_MODE = 'true';