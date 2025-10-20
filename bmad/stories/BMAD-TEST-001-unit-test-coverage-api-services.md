# BMAD Story: Unit Test Coverage for API Services

**Story ID**: BMAD-TEST-001
**Epic**: EPIC-004 (Test Coverage Enhancement)
**Priority**: HIGH
**Status**: ⏳ Ready for Implementation
**Estimated**: 12h traditional → 2h BMAD (6x velocity)
**Created**: 2025-10-22
**Framework**: BMAD-METHOD v6-alpha

---

## User Story

**As a** developer
**I want** comprehensive unit test coverage for all API services
**So that** I can confidently refactor code and catch bugs before they reach production

---

## Business Value

**Priority Justification**: HIGH - Foundation for test coverage epic, enables confident code changes

**Impact**:
- **Quality Assurance**: 90%+ unit test coverage provides safety net for refactoring
- **Regression Prevention**: Automated tests catch breaking changes immediately
- **Development Velocity**: Developers can refactor without fear (tests verify correctness)
- **Production Confidence**: High test coverage demonstrates professional engineering

**ROI**: 2 hours investment → saves 10+ hours debugging production issues

---

## Acceptance Criteria

### Functional Requirements

**1. xeroService.js Unit Tests**
- [ ] Test OAuth flow (initiate, callback, token exchange)
- [ ] Test account data fetch (success, API error, network error)
- [ ] Test working capital calculation (valid data, missing fields)
- [ ] Test error handling (401 unauthorized, 429 rate limit, 500 server error)
- [ ] Coverage: >90% for xeroService.js

**2. shopifyService.js Unit Tests**
- [ ] Test multi-store configuration (UK/EU/USA stores)
- [ ] Test order sync (fetch orders, transform data, calculate commission)
- [ ] Test inventory levels (fetch, sync to database)
- [ ] Test error handling (store unreachable, invalid API key, missing data)
- [ ] Coverage: >90% for shopifyService.js

**3. amazonService.js Unit Tests**
- [ ] Test SP-API authentication (OAuth 2.0 + AWS IAM)
- [ ] Test FBA inventory fetch (parse response, handle pagination)
- [ ] Test order metrics (revenue, unshipped items)
- [ ] Test error handling (auth failure, API down, invalid response)
- [ ] Coverage: >90% for amazonService.js

**4. unleashedService.js Unit Tests**
- [ ] Test HMAC-SHA256 authentication (signature generation, validation)
- [ ] Test assembly job tracking (fetch, parse, sync to database)
- [ ] Test stock on hand (SKU-level inventory, low-stock alerts)
- [ ] Test quality alerts (yield <95% detection, notification)
- [ ] Coverage: >90% for unleashedService.js

**5. subscriptionService.js Unit Tests**
- [ ] Test subscription tier management (upgrade, downgrade)
- [ ] Test billing cycle switching (monthly → annual, proration)
- [ ] Test usage limit checks (entity count, user count)
- [ ] Test feature flag resolution (tier-specific features)
- [ ] Coverage: >90% for subscriptionService.js

**6. stripeService.js Unit Tests**
- [ ] Test webhook handling (4 types: upgrade, downgrade, cycle change, payment failure)
- [ ] Test proration calculation (accuracy ±$0.01 of Stripe expected)
- [ ] Test customer portal URL generation
- [ ] Test error handling (webhook signature invalid, Stripe API down)
- [ ] Coverage: >90% for stripeService.js

### Non-Functional Requirements

**Performance**:
- [ ] All unit tests execute in <5 seconds total
- [ ] No external API calls (all dependencies mocked)
- [ ] No database queries (all database calls mocked)

**Maintainability**:
- [ ] Clear test descriptions (describe what, not how)
- [ ] Consistent test structure (Arrange-Act-Assert pattern)
- [ ] Reusable test fixtures (mock data, helper functions)
- [ ] Comprehensive error scenarios (not just happy path)

**Documentation**:
- [ ] README with instructions to run tests
- [ ] Test coverage report generated (c8 or Vitest coverage)
- [ ] Comments for complex test scenarios

---

## Technical Specifications

### Test Stack

**Framework**: Vitest
- Modern, fast, Vite-compatible
- Built-in mocking and assertions
- Code coverage with c8

**Mocking Strategy**:
- **External APIs**: Mock fetch/axios with `vi.mock()`
- **Database**: Mock Prisma client with `vi.mocked()`
- **Environment Variables**: Mock with `vi.stubEnv()`
- **Date/Time**: Mock with `vi.useFakeTimers()` for time-sensitive tests

**Test Structure**:
```javascript
// Example test structure
describe('xeroService', () => {
  beforeEach(() => {
    // Setup mocks
    vi.clearAllMocks()
  })

  describe('fetchWorkingCapital', () => {
    it('should fetch working capital data successfully', async () => {
      // Arrange: Setup mocks and test data
      const mockResponse = { accountsReceivable: 50000, accountsPayable: 30000 }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      // Act: Call the function
      const result = await xeroService.fetchWorkingCapital()

      // Assert: Verify results
      expect(result.success).toBe(true)
      expect(result.data.accountsReceivable).toBe(50000)
    })

    it('should handle API errors gracefully', async () => {
      // Arrange: Mock API error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      // Act: Call the function
      const result = await xeroService.fetchWorkingCapital()

      // Assert: Verify error handling
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })
})
```

### File Locations

**Test Files** (create these):
```
tests/unit/services/
├── xeroService.test.js           (new file, ~150 lines)
├── shopifyService.test.js        (new file, ~200 lines)
├── amazonService.test.js         (new file, ~180 lines)
├── unleashedService.test.js      (new file, ~170 lines)
├── subscriptionService.test.js   (new file, ~150 lines)
└── stripeService.test.js         (new file, ~200 lines)
```

**Source Files** (already exist):
```
services/
├── xero/xeroService.js
├── shopify/shopify-multistore.js
├── amazon/amazon-sp-api.js
├── unleashed/unleashed-erp.js
├── subscription/subscriptionService.js
└── stripe/stripeService.js
```

### Test Coverage Configuration

**vitest.config.js** (update):
```javascript
export default {
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      include: ['services/**/*.js'],
      exclude: ['**/*.test.js', '**/*.spec.js'],
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90
    }
  }
}
```

---

## Implementation Approach

### Phase 1: Setup Test Infrastructure (15 min)

1. **Install Vitest** (if not already):
   ```bash
   pnpm add -D vitest c8 @vitest/ui
   ```

2. **Update package.json** scripts:
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:unit": "vitest run tests/unit",
       "test:coverage": "vitest run --coverage",
       "test:ui": "vitest --ui"
     }
   }
   ```

3. **Create test directory structure**:
   ```bash
   mkdir -p tests/unit/services
   ```

### Phase 2: Create Test Files (90 min)

**Template-Driven Approach** (6x velocity):
1. Create base test template with common mocks
2. Copy template for each service
3. Customize for service-specific logic
4. Run tests, verify coverage

**Per-Service Breakdown** (15 min each):
- xeroService: 15 min (OAuth flow + data fetch)
- shopifyService: 15 min (multi-store + order sync)
- amazonService: 15 min (SP-API auth + inventory)
- unleashedService: 15 min (HMAC auth + assembly jobs)
- subscriptionService: 15 min (tier management + feature flags)
- stripeService: 15 min (webhooks + proration)

### Phase 3: Verify Coverage (15 min)

1. **Run coverage report**:
   ```bash
   pnpm run test:coverage
   ```

2. **Verify >90% coverage** for all services

3. **Address gaps** (if any):
   - Identify uncovered lines
   - Add targeted tests for missing coverage

4. **Generate HTML report**:
   ```bash
   open coverage/index.html
   ```

---

## Testing Strategy

### Happy Path Tests
- Valid inputs → successful response
- Standard workflows → expected outcomes

### Error Scenario Tests
- Invalid inputs → validation errors
- API errors → graceful error handling (401, 429, 500)
- Network errors → retry logic + fallback behavior
- Missing data → sensible defaults or error messages

### Edge Case Tests
- Empty responses → handle null/undefined
- Large datasets → pagination handling
- Rate limits → respect API limits
- Timeout scenarios → don't hang indefinitely

### Mocking Strategy
- **External APIs**: Mock all fetch/axios calls
- **Database**: Mock all Prisma queries
- **Environment Variables**: Mock for different configurations
- **Time-Dependent Logic**: Mock date/time for deterministic tests

---

## Risks & Mitigation

### Risk #1: Mocking External APIs is Complex
- **Impact**: MEDIUM (complex mocks may not reflect reality)
- **Probability**: MEDIUM (OAuth flows, webhook signatures)
- **Mitigation**:
  - Start with simple mocks (happy path)
  - Add complexity incrementally (error scenarios)
  - Use actual API response examples as test fixtures
  - Document mock behavior in comments

### Risk #2: Coverage Gaps in Complex Logic
- **Impact**: LOW (some edge cases may be missed)
- **Probability**: LOW (comprehensive test planning)
- **Mitigation**:
  - Review coverage report for gaps
  - Prioritize critical paths over 100% coverage
  - Use integration tests for complex flows

### Risk #3: Test Maintenance Burden
- **Impact**: LOW (tests require updates when logic changes)
- **Probability**: MEDIUM (services evolve over time)
- **Mitigation**:
  - Keep tests simple and focused
  - Use reusable fixtures and helpers
  - Update tests alongside code changes (part of DoD)

---

## Definition of Done

- [x] **BMAD QA Review**: Story reviewed by QA agent
- [ ] **All Tests Implemented**: 6 service test files created
- [ ] **All Tests Passing**: 0 test failures
- [ ] **Coverage Target Met**: >90% for all services
- [ ] **Code Review**: PR approved by team
- [ ] **Documentation**: README updated with test instructions
- [ ] **CI Integration**: Tests run on PR (if BMAD-TEST-007 complete)

---

## Story Dependencies

**Blockers**: None (all dependencies available)

**Depends On**:
- ✅ Vitest installed and configured
- ✅ Test directory structure exists
- ✅ All 6 services exist and functional

**Blocks**:
- BMAD-TEST-002 (Integration tests depend on unit tests passing)
- BMAD-TEST-007 (CI/CD integration depends on test suite existing)

---

## BMAD Agent Instructions

### For Developer Agent (`bmad dev`)

**Execution Steps**:
1. Install Vitest and c8 (if not already)
2. Create test directory structure
3. Create xeroService.test.js (use template below)
4. Create shopifyService.test.js (copy template, customize)
5. Create amazonService.test.js (copy template, customize)
6. Create unleashedService.test.js (copy template, customize)
7. Create subscriptionService.test.js (copy template, customize)
8. Create stripeService.test.js (copy template, customize)
9. Run tests: `pnpm run test:unit`
10. Verify coverage: `pnpm run test:coverage`
11. Fix any gaps (target >90%)
12. Create PR with all test files

**Test Template** (xeroService.test.js):
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import xeroService from '../../../services/xero/xeroService.js'

describe('xeroService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchWorkingCapital', () => {
    it('should fetch working capital data successfully', async () => {
      // Arrange
      const mockData = { accountsReceivable: 50000, accountsPayable: 30000 }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData
      })

      // Act
      const result = await xeroService.fetchWorkingCapital()

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.accountsReceivable).toBe(50000)
      expect(result.data.accountsPayable).toBe(30000)
    })

    it('should handle unauthorized error', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      // Act
      const result = await xeroService.fetchWorkingCapital()

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })

    it('should handle network error', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      // Act
      const result = await xeroService.fetchWorkingCapital()

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })
  })
})
```

### For QA Agent (`bmad qa`)

**Review Checklist**:
- [ ] All 6 services have test files
- [ ] Each test file has >90% coverage
- [ ] Tests follow Arrange-Act-Assert pattern
- [ ] Error scenarios tested (401, 429, 500)
- [ ] Mocks are realistic (use actual API response examples)
- [ ] Test descriptions are clear
- [ ] No external API calls (all mocked)
- [ ] Tests run fast (<5 seconds total)
- [ ] Coverage report generated
- [ ] README updated with instructions

---

##Retrospective Notes

**Post-Implementation** (to be filled after completion):
- Actual time taken: TBD
- Challenges encountered: TBD
- Lessons learned: TBD
- Velocity actual: TBD (target: 6x)

---

**Story Created**: 2025-10-22
**Epic**: EPIC-004 (Test Coverage Enhancement)
**Framework**: BMAD-METHOD v6-alpha
**Status**: ⏳ Ready for Implementation
