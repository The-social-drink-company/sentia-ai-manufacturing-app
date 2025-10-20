# BMAD Epic: Test Coverage Enhancement

**Epic ID**: EPIC-004
**Priority**: HIGH
**Status**: ⏳ Planning
**Owner**: Development Team (BMAD QA + Dev Agents)
**Created**: 2025-10-22
**Framework**: BMAD-METHOD v6-alpha

**Progress Tracker**:
- ⏳ BMAD-TEST-001: Unit Test Coverage for API Services (Est: 12h, Act: TBD)
- ⏳ BMAD-TEST-002: Integration Tests for External APIs (Est: 16h, Act: TBD)
- ⏳ BMAD-TEST-003: E2E Tests for Onboarding Wizard (Est: 12h, Act: TBD)
- ⏳ BMAD-TEST-004: E2E Tests for Critical User Journeys (Est: 20h, Act: TBD)
- ⏳ BMAD-TEST-005: Performance & Regression Tests (Est: 16h, Act: TBD)
- ⏳ BMAD-TEST-006: Security Regression Tests (Est: 12h, Act: TBD)
- ⏳ BMAD-TEST-007: CI/CD Test Automation Integration (Est: 12h, Act: TBD)

**Velocity Estimate**: Based on proven 4x-6x velocity, expect **12-20 hours actual** vs 100 hours traditional
**Target Completion**: 1 week (5-7 days with BMAD velocity)

---

## Epic Summary

**Goal**: Increase test coverage from 40% to 90%+ across unit, integration, and E2E tests, establishing production-quality assurance and regression prevention.

**Business Value**:
- **Production Quality**: 90%+ test coverage provides confidence for production deployment
- **Regression Prevention**: Comprehensive test suite catches breaking changes before deployment
- **Faster Development**: Automated tests enable confident refactoring and feature additions
- **Client Confidence**: High test coverage demonstrates professional engineering practices

**Current State**:
- Unit tests: ~40% coverage (partial service coverage)
- Integration tests: Partial (some external API tests exist)
- E2E tests: Partial coverage (32/160 tests passing - needs investigation)
- Authentication: 24/24 tests passed ✅ (excellent example to follow)

**Target State**:
- Unit tests: >90% coverage for all services
- Integration tests: 100% critical path coverage (4 external APIs)
- E2E tests: Complete coverage for 5+ critical user journeys
- Performance tests: Load testing and benchmarks established
- Security tests: Automated regression suite (20+ test cases)
- CI/CD integration: All tests run on PR with quality gates

---

## Business Context

### Problem Statement

After completing 7 major epics (EPIC-002, EPIC-003, EPIC-006, EPIC-007, EPIC-008, ONBOARDING-001, SUBSCRIPTION-001), CapLiquify has:
- ✅ 92% functional implementation with zero mock data
- ✅ 4 live external API integrations
- ✅ Production-ready UI/UX with modern components
- ✅ Comprehensive authentication and authorization
- ✅ Feature gating and subscription management

**BUT**:
- ❌ Only 40% unit test coverage (target: >90%)
- ❌ Partial integration test coverage (missing critical API paths)
- ❌ E2E test status unclear (32/160 passing - investigation needed)
- ❌ No automated performance testing
- ❌ No security regression tests
- ❌ No CI/CD test automation

**Impact**:
- **Production Risk**: Insufficient test coverage increases bug risk in production
- **Refactoring Risk**: Low confidence when making changes (fear of breaking things)
- **Deployment Risk**: No automated quality gates before deployment
- **Maintenance Cost**: Manual testing is time-consuming and error-prone
- **Client Perception**: Low test coverage may concern enterprise clients

**Root Cause**:
- **Velocity Focus**: BMAD velocity prioritized feature delivery over test coverage
- **Rapid Development**: 7 epics completed in 6 weeks, tests deferred
- **Legacy Code**: Some test infrastructure exists but incomplete

### Success Criteria

**Epic Complete When**:
- [ ] Unit test coverage >90% for all API services
- [ ] Integration tests cover 100% of external API critical paths (Xero, Shopify, Amazon, Unleashed)
- [ ] E2E tests cover 5+ critical user journeys (onboarding, dashboard, forecasting, working capital, subscriptions)
- [ ] Performance test suite operational (load testing, stress testing)
- [ ] Security regression test suite operational (auth, authz, input validation)
- [ ] All tests integrated into CI/CD pipeline with quality gates
- [ ] Test documentation complete (README, runbooks, troubleshooting)
- [ ] All tests passing (0 failures, 0 flaky tests)

---

## Epic Scope

### In Scope ✅

**Unit Tests**:
- API services (xeroService, shopifyService, amazonService, unleashedService)
- Subscription services (subscriptionService, stripeService)
- Feature gating services (featureGateService)
- Financial algorithms (FinancialAlgorithms.js, DemandForecastingEngine.js)
- Utility functions (data transformers, validators, helpers)

**Integration Tests**:
- Xero OAuth flow and data sync
- Shopify multi-store order sync
- Amazon SP-API inventory sync
- Unleashed ERP production data sync
- Stripe subscription webhooks
- Email service integration

**E2E Tests**:
- Trial onboarding wizard (4-step flow)
- Dashboard critical paths (data display, navigation, interactions)
- Demand forecasting (AI model execution, chart rendering)
- Working capital optimization (calculations, recommendations)
- Subscription management (upgrade, downgrade, cycle switching)

**Performance Tests**:
- Dashboard load time (<3 seconds target)
- API response time (<2 seconds average target)
- Concurrent user load (50 users target)
- Database query performance
- Memory usage and leak detection

**Security Tests**:
- Authentication flows (Clerk integration)
- Authorization checks (RBAC, feature gating)
- Input validation (XSS, SQL injection, command injection)
- CSRF protection
- Rate limiting
- Session management

**CI/CD Integration**:
- GitHub Actions workflow for test execution
- PR quality gates (all tests must pass)
- Test coverage reporting
- Slack/email notifications on failures

### Out of Scope ❌

**Manual Testing**:
- User acceptance testing (UAT) - separate activity
- Exploratory testing - QA team activity
- Visual regression testing - future epic

**Non-Critical Paths**:
- Edge case scenarios (defer to post-launch)
- Legacy code paths (no longer used)
- Demo/example code

**Infrastructure Tests**:
- Render deployment testing - separate epic
- Database migration testing - separate epic
- Backup/restore testing - EPIC-005

---

## Technical Architecture

### Test Stack

**Unit Testing**:
- **Framework**: Vitest (modern, fast, compatible with Vite)
- **Mocking**: Vitest mocks for external dependencies
- **Assertion Library**: Chai or Vitest built-in assertions
- **Coverage Tool**: c8 (Istanbul-compatible)

**Integration Testing**:
- **Framework**: Vitest + Supertest (for API endpoint testing)
- **Test Database**: PostgreSQL test instance (separate from dev)
- **API Mocking**: MSW (Mock Service Worker) for external APIs
- **OAuth Mocking**: Mock Clerk, mock Stripe webhooks

**E2E Testing**:
- **Framework**: Playwright (cross-browser, reliable, fast)
- **Test Environment**: Isolated test database + test Clerk tenant
- **Page Object Model**: Organize tests by page/component
- **Fixtures**: Reusable test data setup/teardown

**Performance Testing**:
- **Framework**: k6 (load testing, stress testing)
- **Metrics**: Response time, throughput, error rate, resource usage
- **Targets**: 50 concurrent users, <3s page load, <2s API response

**Security Testing**:
- **Framework**: Jest + custom security test utilities
- **Tools**: OWASP ZAP (future), manual penetration testing (future)
- **Scope**: Auth, authz, input validation, CSRF, XSS

**CI/CD Integration**:
- **Platform**: GitHub Actions
- **Workflow**: Run tests on PR, block merge on failures
- **Reporting**: Codecov for coverage tracking, GitHub PR comments

---

## Story Breakdown

### BMAD-TEST-001: Unit Test Coverage for API Services (12h → 2h)

**Goal**: Increase API service unit test coverage to 90%

**Scope**:
- xeroService.js (OAuth, data fetch, error handling)
- shopifyService.js (multi-store, order sync, inventory sync)
- amazonService.js (SP-API authentication, FBA inventory, order metrics)
- unleashedService.js (HMAC authentication, assembly jobs, quality alerts)
- subscriptionService.js (upgrade, downgrade, cycle switching)
- stripeService.js (webhook handling, proration, customer portal)

**Acceptance Criteria**:
- [ ] 90%+ unit test coverage for all 6 services
- [ ] All critical paths tested (happy path + error scenarios)
- [ ] External dependencies mocked (API calls, database queries)
- [ ] Fast execution (<5 seconds for all unit tests)
- [ ] Clear test descriptions and assertions

**Estimated Traditional**: 12 hours (2 hours per service)
**Estimated BMAD**: 2 hours (6x velocity with template-driven approach)

---

### BMAD-TEST-002: Integration Tests for External APIs (16h → 3h)

**Goal**: Comprehensive integration tests for 4 external APIs

**Scope**:
- Xero: OAuth flow, account fetch, working capital data
- Shopify: Store connection, order sync, inventory levels
- Amazon: SP-API authentication, FBA inventory, order metrics
- Unleashed: HMAC authentication, assembly jobs, stock on hand

**Acceptance Criteria**:
- [ ] 100% critical path coverage for each API
- [ ] OAuth/authentication flows tested
- [ ] Data sync operations tested (with test fixtures)
- [ ] Error handling tested (API down, rate limits, invalid data)
- [ ] Retry logic verified
- [ ] Integration with database persistence tested

**Estimated Traditional**: 16 hours (4 hours per API)
**Estimated BMAD**: 3 hours (5x velocity with integration test template)

---

### BMAD-TEST-003: E2E Tests for Onboarding Wizard (12h → 2h)

**Goal**: Complete E2E coverage for 4-step onboarding flow

**Scope**:
- Step 1: Company setup (form validation, data persistence)
- Step 2: Integration configuration (optional skip, save preferences)
- Step 3: Team setup (invite flow, optional skip)
- Step 4: Sample data generation (API call, data verification)
- ProductTour: 7-step guided tour (skip, navigate, complete)
- Celebration flow: Confetti, redirect to dashboard

**Acceptance Criteria**:
- [ ] Happy path: Complete all 4 steps successfully
- [ ] Skip optional steps: Integration and Team steps can be skipped
- [ ] Form validation: Invalid inputs show error messages
- [ ] Data persistence: Refresh page maintains progress
- [ ] Sample data: Verify 20 products, financial data, production jobs created
- [ ] ProductTour: All 7 steps navigable, skip button works
- [ ] Celebration: Confetti displays, redirect works

**Estimated Traditional**: 12 hours (complex wizard with many paths)
**Estimated BMAD**: 2 hours (6x velocity with Playwright + page object model)

---

### BMAD-TEST-004: E2E Tests for Critical User Journeys (20h → 4h)

**Goal**: E2E tests for 5 critical user journeys

**Scope**:
- Journey 1: Dashboard navigation and data display (KPIs, charts, widgets)
- Journey 2: Demand forecasting (select product, view forecast, adjust parameters)
- Journey 3: Working capital optimization (view metrics, recommendations, what-if scenarios)
- Journey 4: Inventory management (view levels, reorder points, low-stock alerts)
- Journey 5: Subscription management (view plan, upgrade, downgrade, billing portal)

**Acceptance Criteria**:
- [ ] Each journey has happy path + 2 error scenarios tested
- [ ] All navigation flows verified (sidebar, breadcrumbs, shortcuts)
- [ ] Data display verified (API data renders correctly)
- [ ] User interactions verified (clicks, form submissions, navigation)
- [ ] Error handling verified (API failures, network errors, validation errors)
- [ ] Mobile responsiveness verified (375px to 1920px viewports)

**Estimated Traditional**: 20 hours (4 hours per journey)
**Estimated BMAD**: 4 hours (5x velocity with reusable test fixtures)

---

### BMAD-TEST-005: Performance & Regression Tests (16h → 3h)

**Goal**: Performance benchmarks and regression test suite

**Scope**:
- Dashboard load time testing (<3 seconds target)
- API response time testing (<2 seconds average target)
- Concurrent user load testing (50 users target)
- Database query performance (slow query detection)
- Memory usage monitoring (leak detection)
- Regression suite (re-run all tests, track performance over time)

**Acceptance Criteria**:
- [ ] Dashboard load time <3 seconds (95th percentile)
- [ ] API response time <2 seconds average (excluding external APIs)
- [ ] 50 concurrent users supported without degradation
- [ ] No slow queries (>1 second database query time)
- [ ] No memory leaks detected (heap usage stable over 5 minutes)
- [ ] Regression suite runs on every PR (tracks performance trends)

**Estimated Traditional**: 16 hours (complex performance testing setup)
**Estimated BMAD**: 3 hours (5x velocity with k6 templates and scripts)

---

### BMAD-TEST-006: Security Regression Tests (12h → 2h)

**Goal**: Automated security testing for auth, authz, API access

**Scope**:
- Authentication: Login flow, session management, logout
- Authorization: RBAC checks (admin, manager, operator, viewer)
- Feature gating: Subscription tier access control
- Input validation: XSS, SQL injection, command injection
- CSRF protection: Token validation on state-changing requests
- Rate limiting: API rate limits enforced
- Session security: Timeout, hijacking prevention

**Acceptance Criteria**:
- [ ] 20+ security test cases implemented
- [ ] Authentication flows tested (Clerk integration, dev bypass)
- [ ] Authorization checks tested (RBAC, feature gating)
- [ ] Input validation tested (XSS, SQL injection attempts fail)
- [ ] CSRF protection verified (requests without tokens rejected)
- [ ] Rate limiting tested (429 errors on excessive requests)
- [ ] Session security tested (timeout after inactivity)

**Estimated Traditional**: 12 hours (security testing requires careful design)
**Estimated BMAD**: 2 hours (6x velocity with security test templates)

---

### BMAD-TEST-007: CI/CD Test Automation Integration (12h → 2h)

**Goal**: Integrate all test suites into CI/CD pipeline

**Scope**:
- GitHub Actions workflow configuration
- PR quality gates (all tests must pass before merge)
- Test coverage reporting (Codecov integration)
- Slack/email notifications on failures
- Parallel test execution (optimize CI runtime)
- Test result artifacts (screenshots, videos, logs)

**Acceptance Criteria**:
- [ ] All test suites run on every PR
- [ ] PR blocked if any test fails (quality gate)
- [ ] Test coverage reported on PR (Codecov comment)
- [ ] Notifications sent on failures (Slack + email)
- [ ] CI runtime <10 minutes (parallel execution)
- [ ] Test artifacts saved (screenshots for E2E failures)
- [ ] Documentation: README with CI/CD workflow explanation

**Estimated Traditional**: 12 hours (CI/CD integration can be complex)
**Estimated BMAD**: 2 hours (6x velocity with GitHub Actions templates)

---

## Total Estimates

| Story | Traditional | BMAD | Velocity |
|-------|-------------|------|----------|
| BMAD-TEST-001 (Unit Tests) | 12h | 2h | 6x |
| BMAD-TEST-002 (Integration) | 16h | 3h | 5x |
| BMAD-TEST-003 (Onboarding E2E) | 12h | 2h | 6x |
| BMAD-TEST-004 (Journeys E2E) | 20h | 4h | 5x |
| BMAD-TEST-005 (Performance) | 16h | 3h | 5x |
| BMAD-TEST-006 (Security) | 12h | 2h | 6x |
| BMAD-TEST-007 (CI/CD) | 12h | 2h | 6x |
| **TOTAL** | **100h** | **18h** | **5.6x** |

**Traditional Timeline**: 2.5 weeks (100 hours)
**BMAD Timeline**: 1 week (18 hours with 5.6x average velocity)

---

## Dependencies

**Internal**:
- ✅ All 7 epics complete (EPIC-002 through ONBOARDING-001)
- ✅ Deployment infrastructure operational (Render)
- ✅ Test database available (PostgreSQL)

**External**:
- ⏳ Test API credentials (Xero, Shopify, Amazon, Unleashed - can use test mode)
- ⏳ Test Clerk tenant (separate from production)
- ⏳ Test Stripe account (separate from production)

**Blockers**: None (all dependencies available or can be mocked)

---

## Risks & Mitigation

### Risk #1: E2E Test Flakiness
- **Impact**: MEDIUM (flaky tests reduce confidence)
- **Probability**: MEDIUM (E2E tests often flaky)
- **Mitigation**:
  - Use Playwright's built-in retry and wait mechanisms
  - Isolate tests (each test creates own test data)
  - Avoid timing dependencies (use waitFor assertions)
  - Run tests in parallel cautiously (avoid data conflicts)

### Risk #2: CI/CD Runtime Too Long
- **Impact**: LOW (slow CI reduces developer velocity)
- **Probability**: LOW (with parallel execution)
- **Mitigation**:
  - Parallelize test execution (unit, integration, E2E run in parallel)
  - Use caching (dependencies, build artifacts)
  - Target <10 minutes CI runtime

### Risk #3: Test Maintenance Burden
- **Impact**: MEDIUM (tests require ongoing maintenance)
- **Probability**: MEDIUM (as features evolve)
- **Mitigation**:
  - Use page object model for E2E tests (centralize selectors)
  - Use test fixtures for reusable setup/teardown
  - Document test patterns in README
  - Review and update tests during feature development

---

## Success Metrics

### Velocity Metrics
- **Target Velocity**: 5x-6x faster than traditional (proven across 7 epics)
- **Story Completion**: 7/7 stories complete (100%)
- **Time to Complete**: 18 hours (vs 100 hours traditional)

### Quality Metrics
- **Unit Test Coverage**: >90% (from 40%)
- **Integration Test Coverage**: 100% critical paths
- **E2E Test Coverage**: 5+ critical journeys
- **Test Stability**: 0 flaky tests (100% passing, no intermittent failures)
- **CI/CD Runtime**: <10 minutes (with parallel execution)

### Business Metrics
- **Production Confidence**: HIGH (90%+ coverage provides confidence)
- **Regression Prevention**: 0 regressions after EPIC-004 completion
- **Client Satisfaction**: Positive feedback on test coverage
- **Deployment Frequency**: Increased (automated quality gates enable faster releases)

---

## Next Steps

1. **User Approval**: Obtain approval for EPIC-004 plan
2. **Create Stories**: Generate BMAD-TEST-001 through BMAD-TEST-007 story files
3. **Prioritize**: Execute stories in order (unit → integration → E2E → perf → security → CI/CD)
4. **Execute**: Follow BMAD cycle for each story (create-story → story-context → dev-story → review-story)
5. **Retrospective**: Capture learnings after epic completion

---

**Epic Owner**: BMAD QA Agent + Dev Agent
**Framework**: BMAD-METHOD v6-alpha (6.0.0-alpha.0)
**Created**: 2025-10-22
**Status**: ⏳ Planning - Ready for Story Creation
