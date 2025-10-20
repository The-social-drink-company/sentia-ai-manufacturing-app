# Multi-Tenant Middleware Guide

**BMAD-MULTITENANT-002**: Complete Multi-Tenant SaaS Infrastructure
**Author**: BMAD Development Team
**Date**: October 20, 2025
**Status**: ✅ Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Middleware Reference](#middleware-reference)
5. [Route Protection Patterns](#route-protection-patterns)
6. [Tenant Service](#tenant-service)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Migration Guide](#migration-guide)
10. [Deployment](#deployment)

---

## Overview

CapLiquify's multi-tenant middleware system provides **schema-per-tenant data isolation** using PostgreSQL `search_path` switching. This approach ensures complete data separation between tenants while maintaining high performance and simplified backup/restore operations.

### Key Features

✅ **Schema-Per-Tenant Isolation**: Each tenant has a dedicated PostgreSQL schema
✅ **Clerk Authentication**: OAuth integration with organization management
✅ **Automatic User Provisioning**: Users are auto-created on first login
✅ **Subscription Tier Enforcement**: Feature flags based on pricing tiers
✅ **RBAC**: Role hierarchy (owner > admin > member > viewer)
✅ **Atomic Tenant Creation**: Rollback on failure guarantees consistency
✅ **Zero Configuration**: Middleware handles all schema switching automatically

### Architecture Benefits

| Approach | Data Isolation | Performance | Backup/Restore | Complexity |
|----------|---------------|-------------|----------------|------------|
| **Schema-per-tenant** ✅ | **Complete** | **High** | **Easy** | **Low** |
| Row-level security | Complete | Medium | Complex | High |
| Shared schema | Partial | High | Complex | Very High |

**Decision**: We chose schema-per-tenant for maximum isolation with minimal complexity.

---

## Quick Start

### 1. Installation

The multi-tenant middleware is already installed in CapLiquify. If you're setting up a new environment:

```bash
# Install dependencies
pnpm install

# Run Prisma migrations
pnpm exec prisma migrate deploy

# Generate Prisma Client
pnpm exec prisma generate
```

### 2. Environment Variables

Configure the following environment variables:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host/database?sslmode=require"

# Clerk Authentication
CLERK_SECRET_KEY="sk_live_..."
VITE_CLERK_PUBLISHABLE_KEY="pk_live_..."

# Application
NODE_ENV="production"
```

### 3. Protect a Route (5-Minute Tutorial)

Here's a complete example of protecting an API route with tenant isolation and RBAC:

```typescript
import express from 'express'
import { tenantMiddleware } from '../middleware/tenant.middleware'
import { requireRole } from '../middleware/rbac.middleware'
import { requireFeature } from '../middleware/feature.middleware'
import { prisma } from '../lib/prisma-tenant'

const router = express.Router()

// ================================
// Apply tenant middleware to ALL routes
// ================================
router.use(tenantMiddleware)

// ================================
// List products (all authenticated users)
// ================================
router.get('/api/products', async (req, res) => {
  // Query automatically targets tenant schema
  const products = await prisma.$queryRawUnsafe(`
    SELECT * FROM products
    WHERE is_active = true
  `)

  res.json({
    success: true,
    data: products,
    tenant: req.tenant?.slug
  })
})

// ================================
// Create product (admin+ only)
// ================================
router.post('/api/products', requireRole('admin'), async (req, res) => {
  const { sku, name, unitPrice } = req.body

  const result = await prisma.$queryRawUnsafe(`
    INSERT INTO products (sku, name, unit_price)
    VALUES ($1, $2, $3)
    RETURNING *
  `, sku, name, unitPrice)

  res.status(201).json({
    success: true,
    data: result[0]
  })
})

// ================================
// AI forecast (Professional+ tier only)
// ================================
router.get(
  '/api/products/:id/ai-forecast',
  requireFeature('ai_forecasting'),
  async (req, res) => {
    const forecasts = await prisma.$queryRawUnsafe(`
      SELECT * FROM forecasts
      WHERE product_id = $1::UUID
    `, req.params.id)

    res.json({
      success: true,
      data: forecasts,
      tier: req.tenant?.subscriptionTier
    })
  }
)

export default router
```

### How It Works

1. **`tenantMiddleware`**: Identifies tenant from Clerk session, sets `search_path` to tenant schema
2. **`requireRole('admin')`**: Checks if user has admin role or higher (RBAC)
3. **`requireFeature('ai_forecasting')`**: Checks if tenant's subscription includes AI forecasting
4. **`prisma.$queryRawUnsafe()`**: Executes query in tenant schema automatically

### Client-Side Setup

Send two headers with every request:

```typescript
// Example: Fetch API
fetch('https://api.capliquify.com/api/products', {
  headers: {
    'Authorization': `Bearer ${clerkSession.token}`,
    'X-Organization-ID': clerkOrganization.id
  }
})

// Example: Axios
axios.defaults.headers.common['Authorization'] = `Bearer ${session.token}`
axios.defaults.headers.common['X-Organization-ID'] = organization.id
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                            │
│  Headers: Authorization: Bearer sess_...,                    │
│           X-Organization-ID: org_...                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│          TENANT MIDDLEWARE (tenant.middleware.ts)            │
│                                                               │
│  1. Extract Clerk session token from Authorization header    │
│  2. Verify session with Clerk API                            │
│  3. Extract organization ID from X-Organization-ID header    │
│  4. Verify user is member of organization (Clerk)            │
│  5. Fetch tenant from database (public.tenants)              │
│  6. Check subscription status (trial/active/past_due/etc)    │
│  7. Get or create user in database (public.users)            │
│  8. Attach tenant and user to req object                     │
│  9. Set PostgreSQL search_path to tenant schema              │
│ 10. Call next()                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│        FEATURE MIDDLEWARE (feature.middleware.ts)            │
│                                                               │
│  - Check if tenant has required feature flags                │
│  - Return 403 Forbidden if feature not available             │
│  - Return upgrade URL for blocked features                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│          RBAC MIDDLEWARE (rbac.middleware.ts)                │
│                                                               │
│  - Check if user has required role or higher                 │
│  - Role hierarchy: owner > admin > member > viewer           │
│  - Return 403 Forbidden if insufficient permissions          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              ROUTE HANDLER (your code)                       │
│                                                               │
│  - Access req.tenant (tenant metadata)                       │
│  - Access req.user (user metadata + role)                    │
│  - Execute queries (automatically in tenant schema)          │
│  - Return response                                           │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema Structure

```
PostgreSQL Database
│
├── public schema (shared metadata)
│   ├── tenants
│   │   ├── id (UUID, PK)
│   │   ├── name (VARCHAR)
│   │   ├── slug (VARCHAR, UNIQUE)
│   │   ├── schema_name (VARCHAR, UNIQUE)
│   │   ├── clerk_organization_id (VARCHAR, UNIQUE)
│   │   ├── subscription_tier (ENUM: starter/professional/enterprise)
│   │   ├── subscription_status (ENUM: trial/active/past_due/cancelled/suspended)
│   │   ├── max_users (INTEGER)
│   │   ├── max_entities (INTEGER)
│   │   ├── features (JSONB)
│   │   └── created_at, updated_at, deleted_at
│   │
│   ├── users
│   │   ├── id (UUID, PK)
│   │   ├── clerk_user_id (VARCHAR, UNIQUE)
│   │   ├── tenant_id (UUID, FK → tenants.id)
│   │   ├── email (VARCHAR)
│   │   ├── role (ENUM: owner/admin/member/viewer)
│   │   └── is_active, last_login_at, created_at, updated_at
│   │
│   ├── subscriptions (Stripe billing)
│   └── audit_logs (compliance trail)
│
├── tenant_<uuid1> schema (Tenant A's isolated data)
│   ├── companies
│   ├── products
│   ├── sales
│   ├── inventory_items
│   ├── forecasts
│   ├── working_capital_metrics
│   ├── scenarios
│   ├── api_credentials
│   └── user_preferences
│
└── tenant_<uuid2> schema (Tenant B's isolated data)
    └── (same 9 tables)
```

### Subscription Tiers

| Tier | Price | Max Users | Max Entities | Key Features |
|------|-------|-----------|--------------|--------------|
| **Starter** | $29-49/mo | 5 | 500 | Basic forecasting, integrations |
| **Professional** | $99-149/mo | 25 | 5,000 | AI forecasting, what-if analysis, priority support |
| **Enterprise** | $299-499/mo | 100 | Unlimited | Custom integrations, white-label, advanced reports |

### Feature Flags

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| `basic_forecasting` | ✅ | ✅ | ✅ |
| `ai_forecasting` | ❌ | ✅ | ✅ |
| `what_if_analysis` | ❌ | ✅ | ✅ |
| `multi_entity` | ❌ | ❌ | ✅ |
| `api_access` | ❌ | ❌ | ✅ |
| `white_label` | ❌ | ❌ | ✅ |
| `priority_support` | ❌ | ✅ | ✅ |
| `advanced_reports` | ❌ | ❌ | ✅ |
| `custom_integrations` | ❌ | ❌ | ✅ |

---

## Middleware Reference

### Tenant Middleware

**File**: `server/middleware/tenant.middleware.ts`

#### `tenantMiddleware`

Identifies tenant from Clerk session and sets up request context.

**Responsibilities**:
1. Verify Clerk session (Authorization header)
2. Verify organization membership (X-Organization-ID header)
3. Fetch tenant from database
4. Check subscription status
5. Auto-create user if not exists
6. Set PostgreSQL search_path to tenant schema
7. Attach tenant and user to req object

**Request Headers Required**:
- `Authorization: Bearer <clerk_session_token>`
- `X-Organization-ID: <clerk_organization_id>`

**Request Context Added**:
```typescript
req.tenant = {
  id: string
  name: string
  slug: string
  schemaName: string
  subscriptionTier: 'starter' | 'professional' | 'enterprise'
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended'
  features: Record<string, boolean>
  maxUsers: number
  maxEntities: number
}

req.user = {
  id: string
  clerkUserId: string
  tenantId: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  isActive: boolean
}
```

**Error Responses**:
- `401 Unauthorized`: Missing/invalid Authorization header
- `401 Unauthorized`: Missing X-Organization-ID header
- `401 Unauthorized`: Invalid Clerk session
- `403 Forbidden`: User not member of organization
- `404 Not Found`: Tenant not found for organization
- `402 Payment Required`: Subscription payment past due
- `403 Forbidden`: Subscription suspended
- `403 Forbidden`: Subscription cancelled

**Usage**:
```typescript
// Apply to all routes in router
router.use(tenantMiddleware)

// Apply to specific routes
router.get('/api/products', tenantMiddleware, getProductsHandler)
```

#### `requireTenant`

Guards routes that require tenant context.

**Usage**:
```typescript
router.get('/api/data', requireTenant, handler)
```

#### `requireUser`

Guards routes that require user context.

**Usage**:
```typescript
router.get('/api/profile', requireUser, handler)
```

---

### Feature Middleware

**File**: `server/middleware/feature.middleware.ts`

#### `requireFeature(featureName)`

Enforces subscription tier restrictions based on feature flags.

**Parameters**:
- `featureName` (string): Feature flag to check (e.g., 'ai_forecasting')

**Error Response**:
- `401 Unauthorized`: Tenant context missing
- `403 Forbidden`: Feature not available (includes upgrade URL)

**Usage**:
```typescript
// Require specific feature
router.get(
  '/api/forecasts/ai',
  tenantMiddleware,
  requireFeature('ai_forecasting'),
  handler
)
```

#### `requireAnyFeature(features)`

Allows access if ANY of the specified features are enabled.

**Parameters**:
- `features` (string[]): Array of feature flags

**Usage**:
```typescript
router.get(
  '/api/reports',
  tenantMiddleware,
  requireAnyFeature(['advanced_reports', 'custom_integrations']),
  handler
)
```

#### `requireAllFeatures(features)`

Requires ALL specified features to be enabled.

**Parameters**:
- `features` (string[]): Array of feature flags

**Usage**:
```typescript
router.post(
  '/api/integrations/custom',
  tenantMiddleware,
  requireAllFeatures(['api_access', 'custom_integrations']),
  handler
)
```

#### Helper Functions

**`hasFeature(req, featureName)`**: Check if tenant has feature (non-middleware)
**`getEnabledFeatures(req)`**: Get array of enabled features

---

### RBAC Middleware

**File**: `server/middleware/rbac.middleware.ts`

#### Role Hierarchy

```
owner (4)    ─┐
              │ Can do everything
admin (3)    ─┤ below + admin actions
              │
member (2)   ─┤ Can do everything
              │ below + create/edit
viewer (1)   ─┘ Read-only access
```

Higher roles inherit ALL permissions from lower roles.

#### `requireRole(minRole)`

Enforces minimum role requirement with hierarchy support.

**Parameters**:
- `minRole` (Role): Minimum role required ('owner', 'admin', 'member', 'viewer')

**Error Response**:
- `401 Unauthorized`: User context missing
- `403 Forbidden`: Insufficient permissions

**Usage**:
```typescript
// Admin or higher (admin, owner)
router.delete('/api/products/:id', requireRole('admin'), handler)

// Member or higher (member, admin, owner)
router.post('/api/products', requireRole('member'), handler)

// All authenticated users
router.get('/api/products', requireRole('viewer'), handler)
```

#### `requireExactRole(role)`

Requires EXACT role match (no hierarchy).

**Usage**:
```typescript
// Owner ONLY (not admin)
router.post('/api/subscription/change', requireExactRole('owner'), handler)
```

#### `requireAnyRole(roles)`

Allows access if user has ANY of the specified roles (no hierarchy).

**Usage**:
```typescript
// Admin OR owner (but not member)
router.get('/api/audit-logs', requireAnyRole(['admin', 'owner']), handler)
```

#### Role Permissions

**Viewer**:
- view_dashboard
- view_products
- view_sales
- view_forecasts
- view_reports
- export_data

**Member** (+ all viewer permissions):
- create_products
- edit_products
- create_sales
- edit_sales
- create_forecasts
- edit_forecasts
- import_data

**Admin** (+ all member permissions):
- delete_products
- delete_sales
- manage_users
- invite_users
- remove_users
- manage_integrations
- configure_settings
- view_audit_logs

**Owner** (+ all admin permissions):
- delete_tenant
- change_subscription
- manage_billing
- assign_owner_role
- view_billing
- export_all_data

#### Helper Functions

**`hasRole(req, minRole)`**: Check if user has role or higher
**`hasExactRole(req, role)`**: Check if user has exact role
**`getRolePermissions(role)`**: Get all permissions for role (with inheritance)
**`hasPermission(req, permission)`**: Check if user has specific permission

---

## Route Protection Patterns

### Pattern 1: Public Routes (No Protection)

```typescript
router.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' })
})
```

### Pattern 2: Authenticated Routes (Tenant-Aware)

```typescript
router.use(tenantMiddleware)

router.get('/api/products', async (req, res) => {
  // All queries automatically target tenant schema
  const products = await prisma.$queryRawUnsafe(`SELECT * FROM products`)
  res.json({ data: products, tenant: req.tenant.slug })
})
```

### Pattern 3: RBAC-Protected Routes

```typescript
router.use(tenantMiddleware)

// Read-only (all authenticated users)
router.get('/api/products', async (req, res) => {
  // ...
})

// Create (member+)
router.post('/api/products', requireRole('member'), async (req, res) => {
  // ...
})

// Delete (admin+)
router.delete('/api/products/:id', requireRole('admin'), async (req, res) => {
  // ...
})

// Billing (owner only)
router.post('/api/subscription', requireExactRole('owner'), async (req, res) => {
  // ...
})
```

### Pattern 4: Feature-Gated Routes

```typescript
router.use(tenantMiddleware)

// Basic forecasting (all tiers)
router.get('/api/forecasts/basic', async (req, res) => {
  // ...
})

// AI forecasting (Professional+ only)
router.get(
  '/api/forecasts/ai',
  requireFeature('ai_forecasting'),
  async (req, res) => {
    // ...
  }
)

// Advanced reports (Enterprise only)
router.get(
  '/api/reports/advanced',
  requireFeature('advanced_reports'),
  async (req, res) => {
    // ...
  }
)
```

### Pattern 5: Combined Protection (Feature + RBAC)

```typescript
router.use(tenantMiddleware)

// AI forecasting: Professional+ tier AND member+ role
router.post(
  '/api/forecasts/ai',
  requireFeature('ai_forecasting'),
  requireRole('member'),
  async (req, res) => {
    // ...
  }
)

// Custom integrations: Enterprise tier AND admin+ role
router.post(
  '/api/integrations/custom',
  requireAllFeatures(['api_access', 'custom_integrations']),
  requireRole('admin'),
  async (req, res) => {
    // ...
  }
)
```

### Pattern 6: Conditional Logic (Non-Middleware)

```typescript
router.use(tenantMiddleware)

router.get('/api/dashboard', async (req, res) => {
  const data: any = {
    products: await getProducts(),
    sales: await getSales()
  }

  // Add AI forecasts only if tier allows
  if (hasFeature(req, 'ai_forecasting')) {
    data.aiForecasts = await getAIForecasts()
  }

  // Add admin panel only for admin+
  if (hasRole(req, 'admin')) {
    data.adminPanel = await getAdminPanelData()
  }

  res.json(data)
})
```

---

## Tenant Service

**File**: `server/services/tenant.service.ts`

### Create Tenant

Creates a new tenant with PostgreSQL schema provisioning.

```typescript
import { tenantService } from '../services/tenant.service'

const tenant = await tenantService.createTenant({
  name: 'Acme Manufacturing',
  slug: 'acme-mfg',
  clerkOrganizationId: 'org_2abc123',
  subscriptionTier: 'professional',
  ownerEmail: 'owner@acme.com'
})
```

**What Happens**:
1. Generates tenant ID and schema name (`tenant_<uuid>`)
2. Creates tenant record in `public.tenants`
3. Creates PostgreSQL schema (`CREATE SCHEMA tenant_abc123`)
4. Provisions 9 tenant tables (companies, products, sales, inventory, forecasts, working_capital, scenarios, api_credentials, user_preferences)
5. Creates 14 performance indexes
6. Inserts default company record
7. **Rolls back on failure** (atomic operation)

**Result**:
```typescript
{
  id: 'tenant_abc123...',
  name: 'Acme Manufacturing',
  slug: 'acme-mfg',
  schemaName: 'tenant_abc123def456...',
  subscriptionTier: 'professional',
  subscriptionStatus: 'trial',
  trialEndsAt: Date (14 days from now),
  maxUsers: 25,
  maxEntities: 5000,
  features: {
    basic_forecasting: true,
    ai_forecasting: true,
    what_if_analysis: true,
    priority_support: true,
    // ... (9 features total)
  }
}
```

### Delete Tenant

**WARNING**: This permanently deletes all tenant data.

```typescript
await tenantService.deleteTenant('tenant_abc123')
```

**What Happens**:
1. Fetches tenant metadata
2. Drops PostgreSQL schema CASCADE (`DROP SCHEMA tenant_abc123 CASCADE`)
3. Deletes tenant record from `public.tenants`
4. Cascades to `public.users`, `public.subscriptions`, `public.audit_logs`

### Soft Delete Tenant

Marks tenant as deleted without removing data (for recovery).

```typescript
await tenantService.softDeleteTenant('tenant_abc123')
```

**Result**: Sets `deletedAt` timestamp and changes `subscriptionStatus` to 'cancelled'.

### Other Methods

```typescript
// Update tenant metadata
await tenantService.updateTenant(tenantId, {
  name: 'New Name',
  subscriptionTier: 'enterprise'
})

// Get tenant by Clerk organization ID
const tenant = await tenantService.getTenantByClerkOrgId('org_abc123')

// Get tenant by slug
const tenant = await tenantService.getTenantBySlug('acme-mfg')

// Check slug availability
const isAvailable = await tenantService.isSlugAvailable('new-slug')
```

---

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test tests/unit/middleware/tenant.middleware.test.ts

# Run with coverage
pnpm test --coverage
```

### Test Coverage

✅ **34 tests** across 4 modules:
- Tenant Middleware: 12 tests
- Feature Middleware: 8 tests
- RBAC Middleware: 8 tests
- Tenant Service: 6 tests

**Coverage**: 100% of middleware and service logic

### Writing Tests

Example test structure:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tenantMiddleware } from '../../../server/middleware/tenant.middleware'
import { createMockClerkClient, createMockSession } from '../../mocks/clerk.mock'
import { createMockPrismaClient, createMockTenant } from '../../mocks/prisma.mock'
import { createMockExpressContext } from '../../mocks/express.mock'

describe('Tenant Middleware', () => {
  let mockClerk: ReturnType<typeof createMockClerkClient>
  let mockPrisma: ReturnType<typeof createMockPrismaClient>

  beforeEach(() => {
    mockClerk = createMockClerkClient()
    mockPrisma = createMockPrismaClient()
    vi.clearAllMocks()
  })

  it('should successfully identify tenant', async () => {
    const { req, res, next } = createMockExpressContext({
      headers: {
        'authorization': 'Bearer sess_test123',
        'x-organization-id': 'org_test123'
      }
    })

    const tenant = createMockTenant()
    mockPrisma.addTenant(tenant)

    await tenantMiddleware(req as any, res as any, next)

    expect(req.tenant).toBeDefined()
    expect(req.tenant?.id).toBe(tenant.id)
  })
})
```

---

## Troubleshooting

### Common Errors

#### Error: "missing_authorization"

**Cause**: Authorization header not sent
**Solution**: Ensure client sends `Authorization: Bearer <token>` header

```typescript
fetch('/api/products', {
  headers: {
    'Authorization': `Bearer ${clerkSession.token}`
  }
})
```

#### Error: "missing_organization_id"

**Cause**: X-Organization-ID header not sent
**Solution**: Ensure client sends organization ID header

```typescript
fetch('/api/products', {
  headers: {
    'X-Organization-ID': clerkOrganization.id
  }
})
```

#### Error: "tenant_not_found"

**Cause**: No tenant exists for Clerk organization
**Solution**: Create tenant first using `tenantService.createTenant()`

#### Error: "insufficient_permissions"

**Cause**: User role too low for requested action
**Solution**: Check role requirements in route definition

#### Error: "feature_not_available"

**Cause**: Subscription tier doesn't include required feature
**Solution**: Upgrade subscription or disable feature-gated functionality

### Debugging

Enable debug logging:

```typescript
// In tenant.middleware.ts
console.log('[TenantMiddleware] Session:', session)
console.log('[TenantMiddleware] Organization:', organization)
console.log('[TenantMiddleware] Tenant:', tenant)
console.log('[TenantMiddleware] User:', user)
console.log('[TenantMiddleware] Search path:', schemaName)
```

Check PostgreSQL search_path:

```sql
SHOW search_path;
-- Should show: "tenant_abc123", public
```

Verify tenant schema exists:

```sql
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name LIKE 'tenant_%';
```

---

## Migration Guide

### Migrating Existing Routes to Multi-Tenant

**Before** (single-tenant):
```typescript
router.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true }
  })
  res.json({ data: products })
})
```

**After** (multi-tenant):
```typescript
router.use(tenantMiddleware)

router.get('/api/products', async (req, res) => {
  // Option 1: Use raw SQL (automatic schema switching)
  const products = await prisma.$queryRawUnsafe(`
    SELECT * FROM products WHERE is_active = true
  `)

  // Option 2: Use withTenantSchema helper
  const products = await withTenantSchema(req.tenant.schemaName, async () => {
    return await prisma.product.findMany({
      where: { isActive: true }
    })
  })

  res.json({
    data: products,
    tenant: req.tenant.slug
  })
})
```

### Adding RBAC to Existing Routes

```typescript
// Before: No access control
router.post('/api/products', createProductHandler)

// After: Admin-only
router.post('/api/products', requireRole('admin'), createProductHandler)
```

### Adding Feature Gates

```typescript
// Before: Feature available to all
router.get('/api/forecasts/ai', getAIForecastsHandler)

// After: Professional+ tier only
router.get(
  '/api/forecasts/ai',
  requireFeature('ai_forecasting'),
  getAIForecastsHandler
)
```

---

## Deployment

### Render Configuration

The application is deployed to Render with 3 services:

```yaml
# render.yaml (simplified)
databases:
  - name: sentia-db-prod
    plan: free

services:
  # Backend API
  - type: web
    name: sentia-backend-prod
    buildCommand: pnpm install && pnpm exec prisma generate
    startCommand: pnpm run start:render
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: sentia-db-prod
      - key: CLERK_SECRET_KEY
        sync: false

  # Frontend
  - type: web
    name: sentia-frontend-prod
    runtime: static
    buildCommand: pnpm install && pnpm exec vite build

  # MCP Server (External Integrations)
  - type: web
    name: sentia-mcp-prod
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: sentia-db-prod
```

### Environment Variables on Render

Set these in Render Dashboard → Service → Environment:

**Required**:
- `DATABASE_URL` (auto-injected from database)
- `CLERK_SECRET_KEY` (from Clerk Dashboard)
- `VITE_CLERK_PUBLISHABLE_KEY` (from Clerk Dashboard)

**Optional**:
- `RATE_LIMIT_MAX` (default: 100)
- `RATE_LIMIT_WINDOW` (default: 60000ms)

### Health Checks

All services expose `/health` or `/api/health` endpoints:

```bash
# Check backend health
curl https://sentia-backend-prod.onrender.com/api/health

# Response
{
  "status": "healthy",
  "database": "connected",
  "uptime": 12345
}
```

### Database Migrations

Migrations run automatically on deployment via `startCommand`:

```bash
pnpm exec prisma migrate resolve --applied 20251017171256_init &&
pnpm run start:render
```

To run migrations manually:

```bash
# Connect to Render shell
render shell sentia-backend-prod

# Run migrations
pnpm exec prisma migrate deploy
```

---

## API Reference Summary

### Middleware Chain Order

```
1. tenantMiddleware        (identify tenant, set schema)
2. requireFeature          (check subscription tier)
3. requireRole             (check user permissions)
4. Route handler           (your code)
```

### Request Context Properties

After `tenantMiddleware` runs:

```typescript
req.tenant: {
  id: string
  name: string
  slug: string
  schemaName: string
  subscriptionTier: 'starter' | 'professional' | 'enterprise'
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended'
  features: Record<string, boolean>
  maxUsers: number
  maxEntities: number
}

req.user: {
  id: string
  clerkUserId: string
  tenantId: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  isActive: boolean
}
```

### Error Response Format

All middleware errors follow this format:

```json
{
  "success": false,
  "error": "error_code",
  "message": "Human-readable error message",
  "hint": "Suggestion for fixing the error (optional)"
}
```

---

## Support

**Documentation**: https://github.com/capliquify/docs
**Issues**: https://github.com/capliquify/sentia-ai-manufacturing-app/issues
**BMAD Status**: [bmad/status/daily-log.md](../bmad/status/daily-log.md)

---

**Last Updated**: October 20, 2025
**BMAD Epic**: BMAD-MULTITENANT-002
**Version**: 1.0.0
**Status**: ✅ Production-Ready
