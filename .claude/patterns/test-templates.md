# Test Templates for Sentia Manufacturing Dashboard

## Unit Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentName } from '@/components/ComponentName';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ComponentName />);
      expect(screen.getByTestId('component-name')).toBeInTheDocument();
    });

    it('should display correct text content', () => {
      render(<ComponentName title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      render(<ComponentName onClick={handleClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data fails to load', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('API Error'));
      global.fetch = mockFetch;

      render(<ComponentName />);

      await waitFor(() => {
        expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ComponentName />);
      expect(screen.getByLabelText('Component Name')).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(<ComponentName />);
      const element = screen.getByRole('button');
      element.focus();
      expect(document.activeElement).toBe(element);
    });
  });
});
```

## Integration Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/nextjs';
import { ServiceName } from '@/services/ServiceName';
import { ComponentName } from '@/components/ComponentName';

describe('ServiceName Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <ClerkProvider>
        <QueryClientProvider client={queryClient}>
          {component}
        </QueryClientProvider>
      </ClerkProvider>
    );
  };

  it('should fetch and display data from API', async () => {
    const mockData = { items: ['item1', 'item2'] };
    global.fetch = vi.fn().mockResolvedValueOnce(
      global.testUtils.mockApiResponse(mockData)
    );

    renderWithProviders(<ComponentName />);

    await waitFor(() => {
      expect(screen.getByText('item1')).toBeInTheDocument();
      expect(screen.getByText('item2')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<ComponentName />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
```

## E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Add authentication if needed
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'test-token');
    });
  });

  test('should complete user workflow', async ({ page }) => {
    // Navigate to feature
    await page.click('[data-testid="nav-feature"]');
    await expect(page).toHaveURL('/feature');

    // Interact with UI
    await page.fill('[data-testid="input-field"]', 'Test Value');
    await page.click('[data-testid="submit-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="success-message"]');

    // Verify result
    const message = await page.textContent('[data-testid="success-message"]');
    expect(message).toContain('Successfully saved');
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Trigger error condition
    await page.route('/api/endpoint', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.click('[data-testid="action-button"]');

    // Verify error handling
    await expect(page.locator('[data-testid="error-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-alert"]')).toContainText('Something went wrong');
  });

  test('should be accessible', async ({ page }) => {
    // Check for accessibility violations
    const accessibilityResults = await page.accessibility.snapshot();
    expect(accessibilityResults).toBeTruthy();

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).not.toBe('BODY');
  });
});
```

## Security Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { testSecurityHeaders, testInputSanitization, testAuthorizationChecks } from '@/tests/security/utils';

describe('Security Tests', () => {
  describe('Input Validation', () => {
    it('should sanitize user input against XSS', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const sanitized = testInputSanitization(maliciousInput);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
    });

    it('should prevent SQL injection', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      expect(() => {
        testInputSanitization(sqlInjection, 'sql');
      }).not.toThrow();
    });
  });

  describe('Authorization', () => {
    it('should deny access without authentication', async () => {
      const result = await testAuthorizationChecks('/api/protected', null);
      expect(result.status).toBe(401);
    });

    it('should deny access with insufficient permissions', async () => {
      const viewerToken = 'viewer-token';
      const result = await testAuthorizationChecks('/api/admin', viewerToken);
      expect(result.status).toBe(403);
    });
  });

  describe('Security Headers', () => {
    it('should include all required security headers', async () => {
      const headers = await testSecurityHeaders();
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['strict-transport-security']).toContain('max-age=');
    });
  });
});
```

## API Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/server';

describe('API Endpoint Tests', () => {
  let server: any;

  beforeAll(async () => {
    server = app.listen(0); // Random port
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/resource', () => {
    it('should return 200 with data', async () => {
      const response = await request(app)
        .get('/api/resource')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/resource')
        .expect(401);
    });

    it('should handle query parameters', async () => {
      const response = await request(app)
        .get('/api/resource?limit=10&offset=0')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('POST /api/resource', () => {
    it('should create resource with valid data', async () => {
      const newResource = {
        name: 'Test Resource',
        value: 100
      };

      const response = await request(app)
        .post('/api/resource')
        .set('Authorization', 'Bearer test-token')
        .send(newResource)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newResource.name);
    });

    it('should return 400 with invalid data', async () => {
      const invalidResource = {
        name: '', // Empty name should fail validation
        value: -1 // Negative value should fail
      };

      await request(app)
        .post('/api/resource')
        .set('Authorization', 'Bearer test-token')
        .send(invalidResource)
        .expect(400);
    });
  });
});
```

## Hook Test Template

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useCustomHook } from '@/hooks/useCustomHook';

describe('useCustomHook', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCustomHook());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    global.fetch = vi.fn().mockResolvedValueOnce(
      global.testUtils.mockApiResponse(mockData)
    );

    const { result } = renderHook(() => useCustomHook());

    act(() => {
      result.current.fetchData();
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle errors', async () => {
    const error = new Error('Failed to fetch');
    global.fetch = vi.fn().mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCustomHook());

    act(() => {
      result.current.fetchData();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe(error.message);
    });
  });
});
```

## Test Utilities

```typescript
// tests/utils/test-helpers.ts

export const createMockStore = (initialState = {}) => {
  return {
    getState: () => initialState,
    setState: vi.fn(),
    subscribe: vi.fn(),
    destroy: vi.fn()
  };
};

export const waitForLoadingToFinish = async (container: HTMLElement) => {
  await waitFor(() => {
    expect(container.querySelector('[data-testid="loading-spinner"]')).not.toBeInTheDocument();
  });
};

export const mockClerkUser = (overrides = {}) => ({
  id: 'user_test123',
  emailAddresses: [{ emailAddress: 'test@sentia.com' }],
  firstName: 'Test',
  lastName: 'User',
  publicMetadata: {
    role: 'viewer',
    permissions: ['read:dashboard'],
    ...overrides
  }
});

export const setupMockServer = () => {
  const handlers = [
    // Add your mock API handlers here
  ];

  const server = setupServer(...handlers);

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
};
```

## Testing Best Practices

1. **Test Naming Convention**
   - Use descriptive test names that explain what is being tested
   - Format: `should [expected behavior] when [condition]`

2. **Test Organization**
   - Group related tests with `describe` blocks
   - Keep tests focused on single behavior
   - Use `beforeEach` for common setup

3. **Assertions**
   - Use specific assertions (toBe, toEqual, toContain)
   - Test both positive and negative cases
   - Verify error states and edge cases

4. **Mocking**
   - Mock external dependencies
   - Use test doubles for complex objects
   - Clear mocks between tests

5. **Coverage Goals**
   - Aim for 80% code coverage minimum
   - Focus on critical business logic
   - Don't test implementation details

6. **Performance**
   - Keep tests fast (<100ms for unit tests)
   - Use `test.concurrent` for independent tests
   - Avoid unnecessary waits