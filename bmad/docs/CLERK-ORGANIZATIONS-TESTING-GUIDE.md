# Clerk Organizations Testing Guide

**Epic**: BMAD-TRIAL-001 (Automated Free Trial Journey)
**Story**: Story 1 - Trial Signup Flow (Clerk + Tenant Provisioning)
**Status**: Testing Documentation
**Created**: 2025-10-23
**Target Coverage**: 85%+

---

## Overview

This guide outlines the comprehensive testing strategy for the Clerk Organizations implementation, covering unit tests, integration tests, and end-to-end scenarios.

---

## Test Files Structure

```
tests/
├── unit/
│   ├── services/
│   │   └── TrialProvisioningService.test.js      (250+ lines)
│   └── routes/
│       └── onboarding.routes.test.js              (300+ lines)
├── integration/
│   └── clerk-onboarding.test.js                   (200+ lines)
└── e2e/
    └── onboarding-flow.spec.js                    (150+ lines)
```

**Total Estimated**: 900+ lines of tests

---

## Unit Tests: TrialProvisioningService

**File**: `tests/unit/services/TrialProvisioningService.test.js`
**Target Coverage**: 85%+
**Estimated Lines**: 250+

### Test Suites

#### 1. `provisionTenant()` Method

```javascript
describe('TrialProvisioningService - provisionTenant', () => {
  describe('Success cases', () => {
    it('should create tenant with trial defaults', async () => {
      // Arrange: Mock Clerk organization and user
      // Act: Call provisionTenant()
      // Assert: Tenant created with 14-day trial, Professional tier, owner role
    })

    it('should set correct trial expiration date', async () => {
      // Assert: trialEndsAt = now() + 14 days
    })

    it('should assign correct tier limits', async () => {
      // Test: Starter (5 users, 500 entities)
      // Test: Professional (25 users, 5K entities)
      // Test: Enterprise (100 users, unlimited)
    })

    it('should create audit log entry', async () => {
      // Assert: audit_logs table has 'tenant.created' entry
    })
  })

  describe('Idempotency', () => {
    it('should return existing tenant if already provisioned', async () => {
      // Call provisionTenant() twice with same Clerk org ID
      // Assert: Same tenant returned, alreadyExists: true
    })

    it('should not create duplicate schema', async () => {
      // Assert: Only one schema created for duplicate requests
    })
  })

  describe('Error handling', () => {
    it('should throw error if Clerk organization not found', async () => {
      // Mock: getOrganization() returns null
      // Assert: Error thrown
    })

    it('should throw error if Clerk user not found', async () => {
      // Mock: getUser() returns null
      // Assert: Error thrown
    })

    it('should throw error if slug already taken', async () => {
      // Pre-create tenant with same slug
      // Assert: Error message includes 'already taken'
    })

    it('should rollback transaction on schema creation failure', async () => {
      // Mock: create_tenant_schema() throws error
      // Assert: No tenant record created
    })
  })

  describe('Edge cases', () => {
    it('should handle special characters in organization name', async () => {
      // Test: "Acme & Co. (Manufacturing)" → valid slug
    })

    it('should handle slug conflicts with suggestions', async () => {
      // Pre-create: 'acme'
      // Test: checkSlugAvailability('acme')
      // Assert: Suggestions include 'acme-1', 'acme-2', 'acme-2025'
    })
  })
})
```

#### 2. `createUserInTenant()` Method

```javascript
describe('TrialProvisioningService - createUserInTenant', () => {
  it('should create user with specified role', async () => {
    // Test: owner, admin, member, viewer roles
  })

  it('should return existing user if already in tenant', async () => {
    // Idempotency test
  })

  it('should throw error if user belongs to different tenant', async () => {
    // Cross-tenant security check
  })

  it('should create audit log for user creation', async () => {
    // Assert: audit_logs entry with 'user.created'
  })
})
```

#### 3. `checkSlugAvailability()` Method

```javascript
describe('TrialProvisioningService - checkSlugAvailability', () => {
  it('should return available=true for unused slug', async () => {})

  it('should return available=false for taken slug', async () => {})

  it('should reject invalid slug formats', async () => {
    // Test: 'AB', 'Acme Manufacturing', 'acme_corp', 'a' (too short)
  })

  it('should generate 3 suggestions for taken slugs', async () => {})

  it('should accept valid slugs', async () => {
    // Test: 'acme', 'acme-manufacturing', 'acme123', 'a-b-c-d-e'
  })
})
```

---

## Unit Tests: Onboarding API Routes

**File**: `tests/unit/routes/onboarding.routes.test.js`
**Target Coverage**: 80%+
**Estimated Lines**: 300+

### Test Suites

#### 1. `POST /api/onboarding/create-tenant`

```javascript
describe('POST /api/onboarding/create-tenant', () => {
  describe('Success cases', () => {
    it('should create tenant and return 201', async () => {
      // Mock: Valid Clerk org and user
      // Assert: Response 201, tenant object with trial info
    })

    it('should return 200 if tenant already exists', async () => {
      // Idempotency test
      // Assert: alreadyExists: true
    })
  })

  describe('Validation errors', () => {
    it('should return 400 if organizationName missing', async () => {})

    it('should return 400 if slug invalid', async () => {
      // Test: empty, too short, uppercase, special chars
    })

    it('should return 400 if clerkOrganizationId missing', async () => {})

    it('should return 400 if clerkUserId missing', async () => {})

    it('should return 400 if subscriptionTier invalid', async () => {
      // Test: 'premium', 'basic' (not valid enums)
    })
  })

  describe('Error cases', () => {
    it('should return 403 if user not member of organization', async () => {
      // Mock: isUserMemberOfOrganization() returns false
    })

    it('should return 409 if slug already taken', async () => {
      // Pre-create tenant with same slug
    })

    it('should return 500 on database error', async () => {
      // Mock: Database connection failure
    })
  })

  describe('Rate limiting', () => {
    it('should return 429 after 10 requests', async () => {
      // Send 11 requests within 1 minute
      // Assert: 11th request returns 429
    })
  })
})
```

#### 2. `POST /api/onboarding/join-tenant`

```javascript
describe('POST /api/onboarding/join-tenant', () => {
  it('should add user to existing tenant', async () => {})

  it('should return 404 if tenant not found', async () => {})

  it('should validate invitation token if provided', async () => {})

  it('should return 400 if invitation expired', async () => {})

  it('should return 400 if invitation already used', async () => {})

  it('should mark invitation as accepted', async () => {
    // Assert: acceptedAt timestamp set
  })

  it('should return 403 if user not org member', async () => {})
})
```

#### 3. `GET /api/onboarding/check-slug/:slug`

```javascript
describe('GET /api/onboarding/check-slug/:slug', () => {
  it('should return available=true for unused slug', async () => {})

  it('should return available=false with suggestions', async () => {})

  it('should return 400 for invalid slug format', async () => {})

  it('should handle special characters', async () => {})
})
```

---

## Integration Tests: Full Onboarding Flow

**File**: `tests/integration/clerk-onboarding.test.js`
**Target Coverage**: 70%+
**Estimated Lines**: 200+

### Test Scenarios

#### 1. Complete Trial Signup Flow

```javascript
describe('Complete Trial Signup Flow', () => {
  it('should complete full onboarding from Clerk org creation to dashboard', async () => {
    // Step 1: Create Clerk organization (mock)
    // Step 2: Call POST /api/onboarding/create-tenant
    // Step 3: Verify tenant schema created in database
    // Step 4: Verify user record created with 'owner' role
    // Step 5: Verify audit log entries
    // Step 6: Verify trial expiration set correctly
    // Assert: End-to-end flow successful
  })
})
```

#### 2. Webhook-Driven Provisioning

```javascript
describe('Clerk Webhook Integration', () => {
  it('should provision tenant via organization.created webhook', async () => {
    // Send webhook POST to /api/webhooks/clerk
    // Assert: Tenant created, schema provisioned
  })

  it('should verify webhook signature', async () => {
    // Test: Invalid signature → 400 error
  })

  it('should add user via organizationMembership.created webhook', async () => {
    // Pre-create tenant
    // Send webhook for new member
    // Assert: User added to tenant
  })

  it('should retry on failure (3 attempts)', async () => {
    // Mock: First 2 attempts fail, 3rd succeeds
    // Assert: Eventual success
  })
})
```

#### 3. Concurrent Signup Edge Cases

```javascript
describe('Concurrent Signups', () => {
  it('should handle duplicate Clerk org IDs gracefully', async () => {
    // Send 2 simultaneous requests with same Clerk org ID
    // Assert: Only 1 tenant created (idempotency)
  })

  it('should handle slug conflicts in race conditions', async () => {
    // Send 2 simultaneous requests with same slug
    // Assert: One succeeds, one gets conflict error
  })
})
```

---

## End-to-End Tests: Frontend + Backend

**File**: `tests/e2e/onboarding-flow.spec.js` (Playwright)
**Estimated Lines**: 150+

### Test Scenarios

#### 1. Complete User Journey

```javascript
test('User completes onboarding from sign-up to dashboard', async ({ page }) => {
  // Step 1: Navigate to /sign-up
  // Step 2: Sign up with Clerk (use test account)
  // Step 3: Verify redirect to /onboarding
  // Step 4: Fill organization name → verify slug auto-generated
  // Step 5: Check slug availability (green checkmark appears)
  // Step 6: Click "Next Step"
  // Step 7: Select "Professional" tier
  // Step 8: Click "Start 14-Day Free Trial"
  // Step 9: Verify redirect to /dashboard
  // Step 10: Verify trial banner shows "13 days remaining"
})
```

#### 2. Slug Availability Real-Time Check

```javascript
test('Slug availability updates in real-time', async ({ page }) => {
  // Pre-create tenant with slug 'acme'
  // Navigate to /onboarding
  // Type 'acme' in slug field
  // Wait 500ms (debounce)
  // Assert: Red X icon appears, suggestions shown
  // Click suggestion 'acme-1'
  // Wait 500ms
  // Assert: Green checkmark appears
})
```

#### 3. Validation Error Handling

```javascript
test('Shows validation errors for invalid inputs', async ({ page }) => {
  // Leave organization name empty
  // Click "Next Step"
  // Assert: Error message "Organization name is required"

  // Enter invalid slug "ACME CORP"
  // Assert: Error message about lowercase/hyphens only
})
```

---

## Test Data Setup

### Mock Data for Tests

```javascript
// tests/fixtures/clerk-mock-data.js

export const mockClerkOrganization = {
  id: 'org_test123abc',
  name: 'Acme Manufacturing',
  slug: 'acme-manufacturing',
  created_by: 'user_test456def'
}

export const mockClerkUser = {
  id: 'user_test456def',
  emailAddresses: [
    {
      id: 'email_test789ghi',
      emailAddress: 'john@acme.com'
    }
  ],
  firstName: 'John',
  lastName: 'Doe',
  primaryEmailAddressId: 'email_test789ghi'
}

export const mockWebhookEvent = {
  type: 'organization.created',
  id: 'evt_test123',
  data: {
    id: 'org_test123abc',
    name: 'Acme Manufacturing',
    created_by: 'user_test456def'
  }
}
```

### Database Test Fixtures

```javascript
// tests/fixtures/database-fixtures.js

export async function createTestTenant(prisma, overrides = {}) {
  return await prisma.tenant.create({
    data: {
      slug: 'test-tenant',
      name: 'Test Tenant',
      schemaName: 'tenant_test123',
      clerkOrganizationId: 'org_test123',
      subscriptionTier: 'professional',
      subscriptionStatus: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxUsers: 25,
      maxEntities: 5000,
      features: {
        ai_forecasting: true,
        what_if: true,
        api_integrations: true
      },
      ...overrides
    }
  })
}

export async function cleanupTestData(prisma) {
  await prisma.auditLog.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.tenant.deleteMany({})
}
```

---

## Coverage Targets

| Component | Target | Priority |
|-----------|--------|----------|
| TrialProvisioningService | 85%+ | High |
| Onboarding API Routes | 80%+ | High |
| Clerk Webhooks | 75%+ | Medium |
| Clerk Helper Functions | 80%+ | Medium |
| Frontend Onboarding | 70%+ | Medium |
| End-to-End Flows | 60%+ | Low |

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test:unit

# Run specific service tests
pnpm test:unit tests/unit/services/TrialProvisioningService.test.js

# Run with coverage
pnpm test:unit --coverage
```

### Integration Tests

```bash
# Run all integration tests
pnpm test:integration

# Run specific integration test
pnpm test:integration tests/integration/clerk-onboarding.test.js
```

### End-to-End Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific E2E test
pnpm test:e2e tests/e2e/onboarding-flow.spec.js

# Run in headed mode (see browser)
pnpm test:e2e --headed
```

### Full Test Suite

```bash
# Run all tests with coverage
pnpm test:all --coverage

# Expected output:
# ✓ Unit Tests: 45/45 passed
# ✓ Integration Tests: 12/12 passed
# ✓ E2E Tests: 6/6 passed
# Total Coverage: 83.5%
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test-clerk-organizations.yml

name: Test Clerk Organizations

on:
  pull_request:
    paths:
      - 'src/lib/clerk.ts'
      - 'server/services/TrialProvisioningService.js'
      - 'server/routes/onboarding.routes.js'
      - 'server/webhooks/clerk.js'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:unit --coverage
      - run: pnpm test:integration
      - run: pnpm test:e2e
```

---

## Manual Testing Checklist

### Pre-Deployment Verification

- [ ] Test trial signup flow manually in staging
- [ ] Verify slug availability checking works
- [ ] Test all 3 subscription tiers
- [ ] Verify trial expiration calculation (14 days)
- [ ] Test Clerk webhook with test organization
- [ ] Verify audit logging for all operations
- [ ] Test rate limiting (10 req/min)
- [ ] Verify idempotency (duplicate signups)
- [ ] Test slug conflict handling
- [ ] Verify error messages user-friendly

---

## Next Steps

1. **Implement Unit Tests** (TrialProvisioningService) - 2 hours
2. **Implement Unit Tests** (Onboarding Routes) - 2 hours
3. **Implement Integration Tests** - 1.5 hours
4. **Implement E2E Tests** - 1 hour
5. **Run Full Test Suite** - Verify 85%+ coverage
6. **Fix Failing Tests** - Address any issues
7. **Code Review** - Peer review test suite
8. **Merge to Main** - Deploy with confidence

---

**Total Estimated Testing Time**: 6.5 hours
**Target Coverage Achievement**: 85%+
**Status**: ✅ Testing guide complete, implementation pending

---

**Created**: 2025-10-23
**Last Updated**: 2025-10-23
**Owner**: BMAD Development Team
**Related Epic**: BMAD-TRIAL-001 Story 1
