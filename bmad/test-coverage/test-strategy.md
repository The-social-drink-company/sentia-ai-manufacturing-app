# Test Strategy

**Project**: CapLiquify Manufacturing Intelligence Platform
**Epic**: EPIC-004 (Test Coverage Enhancement)
**Date**: 2025-10-23
**Framework**: BMAD-METHOD v6-alpha

---

## Test Pyramid

```
┌─────────────────┐
│      E2E        │ 10% (15+ tests)  - Critical user journeys
├─────────────────┤
│  Integration    │ 20% (65+ tests)  - API + Database + External services
├─────────────────┤
│      Unit       │ 70% (235+ tests) - Functions, components, services
└─────────────────┘
Total: 315+ tests to reach 90% coverage (from current 26)
```

---

## Quick Start Guides

### Unit Test (Vitest + React Testing Library)

**Template**:
```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  it('should render with default props', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const mockFn = vi.fn();
    render(<ComponentName onClick={mockFn} />);
    await userEvent.click(screen.getByRole('button'));
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
```

**Run**: `pnpm test ComponentName`

### Integration Test (API + Database)

**Template**:
```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('ServiceName Integration', () => {
  beforeEach(async () => {
    // Setup: Create test data
    await prisma.tenant.create({ data: { /* test tenant */ } });
  });

  afterEach(async () => {
    // Teardown: Clean test data
    await prisma.tenant.deleteMany();
  });

  it('should fetch data from database', async () => {
    const result = await service.getData();
    expect(result).toHaveLength(1);
  });
});
```

**Run**: `pnpm test ServiceName`

### E2E Test (Playwright)

**Template**:
```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should complete happy path', async ({ page }) => {
    await page.goto('/feature');
    await page.click('button[aria-label="Start"]');
    await expect(page.locator('h1')).toContainText('Success');
  });
});
```

**Run**: `pnpm test:e2e Feature`

---

## Test Patterns

### ✅ Good Pattern: Mock External Dependencies

```javascript
// Mock API calls
vi.mock('axios');
axios.get.mockResolvedValue({ data: { success: true } });

// Mock environment variables
vi.stubEnv('VITE_API_URL', 'http://test-api');

// Mock date/time
vi.setSystemTime(new Date('2025-01-01'));
```

### ✅ Good Pattern: Test Business Logic, Not Implementation

```javascript
// ❌ BAD: Testing implementation details
expect(component.state.count).toBe(5);

// ✅ GOOD: Testing user-observable behavior
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

### ✅ Good Pattern: Arrange-Act-Assert (AAA)

```javascript
it('should calculate total correctly', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(30);
});
```

### ❌ Bad Pattern: Fragile Assertions

```javascript
// ❌ BAD: Exact values for dynamic data
expect(cpuUsage).toEqual([1.5, 1.2, 1.0]);

// ✅ GOOD: Range checks
expect(cpuUsage).toHaveLength(3);
cpuUsage.forEach(val => {
  expect(val).toBeGreaterThanOrEqual(0);
  expect(val).toBeLessThanOrEqual(100);
});
```

---

## Coverage Targets by Module

| Module | Unit | Integration | E2E | Priority |
|--------|------|-------------|-----|----------|
| Subscription Service | 95% | 100% | 100% | P0 |
| Feature Gating | 90% | 100% | 100% | P0 |
| Financial Algorithms | 95% | 80% | 50% | P0 |
| Onboarding Wizard | 70% | 80% | 100% | P0 |
| External APIs (4) | 85% | 100% | - | P1 |
| Dashboard | 70% | - | 100% | P1 |
| Auth System | 90% | 100% | 100% | P1 |
| Admin Services | 80% | 60% | - | P2 |

**Overall Target**: 90%+ coverage across all modules

---

## Testing Checklist

### Before Writing Tests

- [ ] Read existing tests in same module for patterns
- [ ] Identify critical paths (happy path + 2 error scenarios minimum)
- [ ] Plan mocks for external dependencies (APIs, database, time)
- [ ] Review acceptance criteria from story

### Writing Tests

- [ ] Use descriptive test names ("should ..." format)
- [ ] Follow AAA pattern (Arrange-Act-Assert)
- [ ] Test behavior, not implementation
- [ ] Mock external dependencies
- [ ] Use ranges for dynamic values (CPU, memory, timestamps)
- [ ] Add comments for complex setup/assertions

### After Writing Tests

- [ ] All tests pass locally (`pnpm test:run`)
- [ ] Coverage increased (check `pnpm test -- --coverage`)
- [ ] No console errors/warnings
- [ ] Tests run fast (<100ms per unit test, <5s per E2E test)
- [ ] Commit with clear message

---

## Common Pitfalls & Solutions

### Pitfall 1: Import/Export Errors

**Error**: `default is not a constructor`

**Solution**:
```javascript
// ❌ BAD
import XeroService from './xeroService';

// ✅ GOOD (if service exports as named export)
import { XeroService } from './xeroService';

// ✅ GOOD (if service exports as default)
import XeroService from './xeroService';
const service = new XeroService();
```

### Pitfall 2: Async Test Timeouts

**Error**: `Test timeout of 5000ms exceeded`

**Solution**:
```javascript
// ✅ Add explicit timeout for slow tests
it('should sync large dataset', async () => {
  await syncData();
}, { timeout: 30000 }); // 30 second timeout
```

### Pitfall 3: Flaky E2E Tests

**Problem**: Tests pass/fail randomly

**Solution**:
```javascript
// ✅ Use Playwright's built-in waits
await expect(page.locator('.result')).toBeVisible();

// ✅ Avoid arbitrary waits
await page.waitForTimeout(1000); // ❌ BAD

// ✅ Wait for specific conditions
await page.waitForSelector('.data-loaded');
```

---

## CI/CD Integration

### GitHub Actions Workflow (Future - BMAD-TEST-007)

```yaml
name: Test Suite
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test:run        # Unit + Integration
      - run: pnpm test:e2e        # E2E tests
      - run: pnpm test -- --coverage # Coverage report

      # Quality Gate: Block PR if coverage < 90%
      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 90" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 90% threshold"
            exit 1
          fi
```

---

## BMAD Velocity Factors

**Expected**: 5.6x faster than traditional testing approach

**Velocity Drivers**:
1. **Template-Based**: Copy-paste templates, modify for specific use case
2. **Existing Infrastructure**: Vitest + Playwright pre-configured
3. **Pattern Library**: 26 existing tests provide copy-able patterns
4. **Focused Scope**: Test critical paths only (not 100% coverage of every file)
5. **Parallel Execution**: Vitest runs tests concurrently

---

## Success Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Unit Test Coverage | 7% | 90% | ⛔ Critical |
| Integration Coverage | Partial | 100% critical paths | ⛔ Critical |
| E2E Test Count | 3 | 15+ | ⛔ Critical |
| Test Pass Rate | 67% (22/67) | 100% (0 failures) | ⛔ Critical |
| CI/CD Automation | Manual | Automated PR gates | ⏳ Planned |

---

## Resources

**Documentation**:
- Vitest: https://vitest.dev
- React Testing Library: https://testing-library.com/react
- Playwright: https://playwright.dev

**Project Files**:
- Unit test examples: `tests/unit/`
- Integration test examples: `tests/integration/`
- E2E test examples: `tests/e2e/`
- Test config: `vitest.config.js`, `playwright.config.js`

**BMAD Stories**:
- BMAD-TEST-001: Unit Tests for API Services
- BMAD-TEST-002: Integration Tests for External APIs
- BMAD-TEST-003: E2E Tests for Onboarding Wizard
- BMAD-TEST-004: E2E Tests for Critical User Journeys
- BMAD-TEST-005: Performance & Regression Tests
- BMAD-TEST-006: Security Regression Tests
- BMAD-TEST-007: CI/CD Test Automation Integration

---

**Status**: ✅ **READY FOR USE**
**Next**: Generate BMAD-TEST-* story files and begin execution
**Framework**: BMAD-METHOD v6-alpha
