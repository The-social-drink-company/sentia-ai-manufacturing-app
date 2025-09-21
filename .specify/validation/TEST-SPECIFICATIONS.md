# Test Specifications and Validation Strategy
## Comprehensive Testing Framework for Sentia Manufacturing Dashboard

### 1. Testing Philosophy

#### 1.1 Test-Driven Development (TDD) Approach
- Write tests before implementation
- Tests define expected behavior
- Implementation satisfies tests
- Refactor with confidence

#### 1.2 Testing Pyramid
```
         /\
        /E2E\       (5%) - Critical user journeys
       /------\
      /Integration\ (25%) - API and service tests
     /------------\
    /  Unit Tests  \(70%) - Component and function tests
   /----------------\
```

### 2. Test Categories and Specifications

## 2.1 Unit Tests

### Authentication Tests
```javascript
// tests/unit/auth/clerk-middleware.test.js
describe('Clerk Middleware', () => {
  describe('Middleware Order', () => {
    it('should allow health check without authentication', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'healthy' });
    });

    it('should require authentication for API endpoints', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(401);
    });

    it('should validate JWT token format', () => {
      const invalidToken = 'invalid-token';
      expect(() => validateToken(invalidToken)).toThrow('Invalid token format');
    });
  });

  describe('Role-Based Access', () => {
    it('should allow admin access to all endpoints', async () => {
      const adminToken = generateToken({ role: 'admin' });
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
    });

    it('should restrict viewer role from write operations', async () => {
      const viewerToken = generateToken({ role: 'viewer' });
      const response = await request(app)
        .post('/api/data')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(response.status).toBe(403);
    });
  });
});
```

### Component Tests
```javascript
// tests/unit/components/Dashboard.test.jsx
describe('Dashboard Component', () => {
  it('should render without crashing', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('should display user-specific widgets based on role', () => {
    const { rerender } = render(<Dashboard user={{ role: 'manager' }} />);
    expect(screen.getByText('Production Overview')).toBeInTheDocument();

    rerender(<Dashboard user={{ role: 'viewer' }} />);
    expect(screen.queryByText('Production Overview')).not.toBeInTheDocument();
  });

  it('should handle widget drag and drop', async () => {
    render(<Dashboard />);
    const widget = screen.getByTestId('widget-1');
    const dropZone = screen.getByTestId('drop-zone-2');

    fireEvent.dragStart(widget);
    fireEvent.drop(dropZone);

    await waitFor(() => {
      expect(widget.parentElement).toBe(dropZone);
    });
  });
});
```

### Service Tests
```javascript
// tests/unit/services/manufacturing.test.js
describe('Manufacturing Service', () => {
  describe('Production Calculations', () => {
    it('should calculate OEE correctly', () => {
      const data = {
        availability: 0.9,
        performance: 0.95,
        quality: 0.98
      };
      const oee = calculateOEE(data);
      expect(oee).toBeCloseTo(0.8379, 4);
    });

    it('should handle missing data gracefully', () => {
      const data = { availability: 0.9 };
      const oee = calculateOEE(data);
      expect(oee).toBe(0);
      expect(logWarn).toHaveBeenCalledWith('Missing OEE data');
    });
  });
});
```

## 2.2 Integration Tests

### API Integration Tests
```javascript
// tests/integration/api/working-capital.test.js
describe('Working Capital API', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it('should return working capital overview', async () => {
    const response = await request(app)
      .get('/api/working-capital/overview')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      current: expect.any(Number),
      previous: expect.any(Number),
      trend: expect.any(String),
      components: {
        receivables: expect.any(Number),
        inventory: expect.any(Number),
        payables: expect.any(Number)
      }
    });
  });

  it('should create what-if scenario', async () => {
    const scenario = {
      name: 'Increased Sales',
      parameters: {
        salesGrowth: 0.2,
        daysReceivable: 45
      }
    };

    const response = await request(app)
      .post('/api/what-if/scenarios')
      .set('Authorization', `Bearer ${validToken}`)
      .send(scenario);

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.results).toBeDefined();
  });
});
```

### Database Integration Tests
```javascript
// tests/integration/database/prisma.test.js
describe('Database Operations', () => {
  it('should handle concurrent connections', async () => {
    const promises = Array(50).fill(null).map(() =>
      prisma.user.findMany()
    );

    const results = await Promise.all(promises);
    results.forEach(result => {
      expect(Array.isArray(result)).toBe(true);
    });
  });

  it('should rollback transaction on error', async () => {
    const initialCount = await prisma.job.count();

    try {
      await prisma.$transaction(async (tx) => {
        await tx.job.create({ data: validJob });
        throw new Error('Rollback test');
      });
    } catch (error) {
      // Expected error
    }

    const finalCount = await prisma.job.count();
    expect(finalCount).toBe(initialCount);
  });
});
```

## 2.3 End-to-End Tests

### Critical User Journeys
```javascript
// tests/e2e/authentication.spec.js
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should complete login successfully', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'TestPassword123');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toContainText('test@example.com');
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email"]', 'invalid@example.com');
    await page.fill('[data-testid="password"]', 'WrongPassword');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    await expect(page).toHaveURL('/');
  });
});
```

### Dashboard Functionality
```javascript
// tests/e2e/dashboard.spec.js
test.describe('Dashboard Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'manager');
  });

  test('should customize widget layout', async ({ page }) => {
    await page.goto('/dashboard');

    // Drag widget
    const widget = page.locator('[data-testid="widget-production"]');
    const targetCell = page.locator('[data-testid="grid-cell-2-1"]');

    await widget.dragTo(targetCell);

    // Save layout
    await page.click('[data-testid="save-layout"]');
    await expect(page.locator('[data-testid="toast"]')).toContainText('Layout saved');

    // Refresh and verify persistence
    await page.reload();
    await expect(targetCell.locator('[data-testid="widget-production"]')).toBeVisible();
  });
});
```

### 3. Test Data Management

#### 3.1 Test Data Factory
```javascript
// tests/factories/index.js
export const UserFactory = {
  build: (overrides = {}) => ({
    id: faker.datatype.uuid(),
    email: faker.internet.email(),
    role: 'operator',
    createdAt: new Date(),
    ...overrides
  }),

  admin: () => UserFactory.build({ role: 'admin' }),
  manager: () => UserFactory.build({ role: 'manager' }),
  viewer: () => UserFactory.build({ role: 'viewer' })
};

export const JobFactory = {
  build: (overrides = {}) => ({
    id: faker.datatype.uuid(),
    name: faker.commerce.productName(),
    status: 'pending',
    priority: faker.datatype.number({ min: 1, max: 5 }),
    ...overrides
  })
};
```

#### 3.2 Database Seeding
```javascript
// tests/seeds/test-data.js
export async function seedTestData() {
  // Clear existing data
  await prisma.$transaction([
    prisma.job.deleteMany(),
    prisma.user.deleteMany()
  ]);

  // Seed users
  const users = await prisma.user.createMany({
    data: [
      UserFactory.admin(),
      UserFactory.manager(),
      UserFactory.viewer()
    ]
  });

  // Seed jobs
  const jobs = await prisma.job.createMany({
    data: Array(20).fill(null).map(() => JobFactory.build())
  });

  return { users, jobs };
}
```

### 4. Test Coverage Requirements

#### 4.1 Coverage Targets
```json
{
  "coverage": {
    "statements": 80,
    "branches": 75,
    "functions": 80,
    "lines": 80,
    "exclude": [
      "**/*.test.js",
      "**/*.spec.js",
      "**/test/**",
      "**/node_modules/**"
    ]
  }
}
```

#### 4.2 Critical Path Coverage
These components must have 100% test coverage:
- Authentication middleware
- Authorization checks
- Payment processing
- Data validation
- Error handlers

### 5. Performance Testing

#### 5.1 Load Testing
```javascript
// tests/performance/load.test.js
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  const response = http.get('https://sentia.onrender.com/api/dashboard');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### 6. Security Testing

#### 6.1 Security Test Suite
```javascript
// tests/security/vulnerabilities.test.js
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .get(`/api/users?search=${encodeURIComponent(maliciousInput)}`);

    expect(response.status).not.toBe(500);
    const userCount = await prisma.user.count();
    expect(userCount).toBeGreaterThan(0);
  });

  it('should prevent XSS attacks', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    const response = await request(app)
      .post('/api/comments')
      .send({ content: xssPayload });

    const saved = await prisma.comment.findFirst();
    expect(saved.content).not.toContain('<script>');
  });

  it('should enforce rate limiting', async () => {
    const requests = Array(101).fill(null).map(() =>
      request(app).get('/api/data')
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### 7. Test Automation

#### 7.1 CI/CD Test Pipeline
```yaml
# .github/workflows/test.yml
name: Test Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          file: ./coverage/lcov.info

      - name: Check coverage thresholds
        run: npm run test:coverage:check
```

### 8. Test Execution Commands

```json
// package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:coverage:check": "vitest run --coverage --coverageThreshold=80",
    "test:security": "npm audit && vitest run tests/security",
    "test:performance": "k6 run tests/performance/load.test.js",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

### 9. Test Validation Checklist

Before any code is merged:
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests for affected features pass
- [ ] Coverage meets thresholds
- [ ] No security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Test documentation updated

### 10. Regression Prevention

#### 10.1 Snapshot Testing
```javascript
// tests/unit/components/snapshots.test.jsx
it('should match dashboard snapshot', () => {
  const component = render(<Dashboard />);
  expect(component).toMatchSnapshot();
});
```

#### 10.2 Golden Path Tests
Critical user journeys that must never break:
1. User registration and login
2. Dashboard initial load
3. Data export functionality
4. Payment processing
5. Report generation

---

*This comprehensive testing specification ensures quality and prevents regression in the Sentia Manufacturing Dashboard.*