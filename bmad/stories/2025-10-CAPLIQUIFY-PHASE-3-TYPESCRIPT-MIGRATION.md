# CAPLIQUIFY-PHASE-3-TS: TypeScript Migration & Production-Grade Middleware

**Story ID**: CAPLIQUIFY-PHASE-3-TS
**Epic**: Phase 3 - Authentication & Tenant Management
**Priority**: P0 (Critical Path)
**Created**: October 19, 2025
**Status**: IN PROGRESS
**Estimated**: 16-20 hours

---

## 📋 Story Overview

Convert the existing multi-tenant infrastructure to **TypeScript** with full **Clerk SDK integration** and production-grade error handling. This migration ensures type safety, better developer experience, and enterprise-level reliability.

### Goals
1. Full TypeScript conversion of all tenant-related code
2. Clerk SDK integration with proper session verification
3. Production-grade error handling and logging
4. Type-safe tenant context throughout application
5. Enhanced middleware with comprehensive security

### Success Criteria
- [ ] All tenant middleware converted to TypeScript
- [ ] Clerk SDK integrated with session verification
- [ ] Type definitions for all tenant-related interfaces
- [ ] Production-grade error handling implemented
- [ ] Zero TypeScript compilation errors
- [ ] Backward compatibility with existing API routes
- [ ] Integration tests passing

---

## 🎯 Acceptance Criteria

### 1. TypeScript Infrastructure
- [ ] TypeScript configuration (tsconfig.json) set up
- [ ] Type definitions for Tenant, User, Subscription models
- [ ] Type definitions for middleware request/response extensions
- [ ] Prisma Client types generated
- [ ] Clerk SDK types configured

### 2. Enhanced Tenant Middleware (TypeScript)
**File**: `server/middleware/tenantContext.ts`

- [ ] `clerkMiddleware()` integration for session verification
- [ ] `requireOrganization()` middleware - blocks users without org
- [ ] `requireActiveSubscription()` middleware - checks subscription status
- [ ] `requireFeature(featureName)` middleware - feature flag enforcement
- [ ] `requireRole(roles[])` middleware - RBAC enforcement
- [ ] `preventReadOnly()` middleware - blocks writes for past_due
- [ ] `checkEntityLimit(entityType, countQuery)` middleware
- [ ] Full TypeScript type safety with proper request extension

**Technical Requirements**:
```typescript
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express'
import { Request, Response, NextFunction } from 'express'

// Extend Express Request with tenant context
declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant
      tenantSchema?: string
      userRole?: UserRole
      organizationId?: string
      userId?: string
    }
  }
}
```

### 3. Tenant-Aware Prisma Client (TypeScript)
**File**: `server/services/TenantPrismaClient.ts`

- [ ] Type-safe connection pooling
- [ ] Schema-specific query methods
- [ ] Transaction support with proper typing
- [ ] Graceful error handling
- [ ] Connection cleanup on shutdown

### 4. Type Definitions
**File**: `server/types/tenant.types.ts`

```typescript
export interface Tenant {
  id: string
  slug: string
  name: string
  schemaName: string
  clerkOrganizationId: string
  subscriptionTier: SubscriptionTier
  subscriptionStatus: SubscriptionStatus
  trialEndsAt?: Date
  maxUsers?: number
  maxEntities?: number
  features?: TenantFeatures
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface TenantFeatures {
  ai_forecasting: boolean
  what_if: boolean
  api_integrations: boolean
  advanced_reports: boolean
  custom_integrations: boolean
}

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise'
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended'
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface TenantContext {
  tenant: Tenant
  tenantSchema: string
  userRole: UserRole
  organizationId: string
  userId: string
}
```

### 5. Production-Grade Error Handling
**File**: `server/middleware/errorHandler.ts`

- [ ] Custom error classes (TenantNotFoundError, SubscriptionInactiveError, etc.)
- [ ] Structured error responses
- [ ] Error logging with Winston
- [ ] Sentry integration for production errors
- [ ] User-friendly error messages

### 6. Clerk SDK Integration
- [ ] Clerk Express middleware configured
- [ ] Session verification on all protected routes
- [ ] Organization ID extraction from Clerk session
- [ ] User role mapping from Clerk to tenant roles
- [ ] Webhook signature verification (already implemented)

---

## 🏗️ Implementation Plan

### Phase 1: TypeScript Setup (2-3 hours)

**Step 1.1: Install Dependencies**
```bash
pnpm add -D typescript @types/node @types/express @types/cors
pnpm add @clerk/express @clerk/backend
```

**Step 1.2: Create TypeScript Configuration**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./server",
    "types": ["node"]
  },
  "include": ["server/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 1.3: Update package.json Scripts**
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch server/index.ts",
    "start": "node dist/index.js"
  }
}
```

### Phase 2: Type Definitions (2-3 hours)

**Step 2.1: Create Core Types**
- Create `server/types/tenant.types.ts`
- Create `server/types/middleware.types.ts`
- Create `server/types/api.types.ts`

**Step 2.2: Extend Express Types**
```typescript
// server/types/express.d.ts
import { Tenant, UserRole } from './tenant.types'

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant
      tenantSchema?: string
      userRole?: UserRole
      organizationId?: string
      userId?: string
      readOnly?: boolean
    }
  }
}
```

### Phase 3: Convert Middleware to TypeScript (4-6 hours)

**Step 3.1: Tenant Context Middleware**
```typescript
// server/middleware/tenantContext.ts
import { Request, Response, NextFunction } from 'express'
import { getAuth } from '@clerk/express'
import { PrismaClient } from '@prisma/client'
import { TenantNotFoundError, SubscriptionInactiveError } from '../errors'

const prisma = new PrismaClient()

export async function tenantContext(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const auth = getAuth(req)

    if (!auth.orgId) {
      throw new TenantNotFoundError('User must be part of an organization')
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrganizationId: auth.orgId },
      include: {
        subscription: true,
        users: {
          where: { clerkUserId: auth.userId },
          select: { role: true }
        }
      }
    })

    if (!tenant) {
      throw new TenantNotFoundError(`No tenant found for organization: ${auth.orgId}`)
    }

    if (tenant.deletedAt) {
      throw new TenantNotFoundError('This organization has been deleted')
    }

    if (['suspended', 'cancelled'].includes(tenant.subscriptionStatus)) {
      throw new SubscriptionInactiveError(
        `Subscription is ${tenant.subscriptionStatus}`
      )
    }

    // Attach to request
    req.tenant = tenant
    req.tenantSchema = tenant.schemaName
    req.userId = auth.userId
    req.organizationId = auth.orgId
    req.userRole = tenant.users[0]?.role || 'viewer'

    // Set PostgreSQL search path
    await prisma.$executeRawUnsafe(
      `SET search_path TO "${tenant.schemaName}", public`
    )

    next()
  } catch (error) {
    next(error)
  }
}
```

**Step 3.2: Feature Flag Middleware**
```typescript
export function requireFeature(featureName: keyof TenantFeatures) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      return next(new Error('Tenant context required'))
    }

    const hasFeature = req.tenant.features?.[featureName] === true

    if (!hasFeature) {
      return next(new FeatureNotAvailableError(
        `Feature '${featureName}' not available on ${req.tenant.subscriptionTier} plan`
      ))
    }

    next()
  }
}
```

### Phase 4: Convert Services to TypeScript (4-6 hours)

**Step 4.1: Tenant Prisma Client**
```typescript
// server/services/TenantPrismaClient.ts
import { PrismaClient, Prisma } from '@prisma/client'

export class TenantPrismaClient {
  private globalClient: PrismaClient
  private clientPool: Map<string, PrismaClient>

  constructor() {
    this.globalClient = new PrismaClient()
    this.clientPool = new Map()
  }

  async getClient(schemaName: string): Promise<PrismaClient> {
    if (this.clientPool.has(schemaName)) {
      return this.clientPool.get(schemaName)!
    }

    const client = new PrismaClient()
    await client.$executeRawUnsafe(
      `SET search_path TO "${schemaName}", public`
    )

    this.clientPool.set(schemaName, client)
    return client
  }

  async queryRaw<T = unknown>(
    schemaName: string,
    query: string,
    params: unknown[] = []
  ): Promise<T[]> {
    const client = await this.getClient(schemaName)
    return client.$queryRawUnsafe<T>(query, ...params)
  }

  async executeRaw(
    schemaName: string,
    query: string,
    params: unknown[] = []
  ): Promise<number> {
    const client = await this.getClient(schemaName)
    return client.$executeRawUnsafe(query, ...params)
  }

  // ... other methods
}

export const tenantPrisma = new TenantPrismaClient()
```

**Step 4.2: Tenant Provisioning Service**
- Convert `TenantProvisioningService.js` to TypeScript
- Add proper type definitions for all methods
- Ensure type safety for Clerk webhook data

### Phase 5: Update API Routes (2-3 hours)

**Example: Products API in TypeScript**
```typescript
// server/routes/products.ts
import express, { Request, Response, NextFunction } from 'express'
import { tenantContext, requireFeature } from '../middleware/tenantContext'
import { tenantPrisma } from '../services/TenantPrismaClient'

const router = express.Router()

router.use(tenantContext)

interface Product {
  id: string
  sku: string
  name: string
  unitCost: number
  unitPrice: number
  isActive: boolean
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantSchema } = req

    if (!tenantSchema) {
      throw new Error('Tenant schema not found')
    }

    const products = await tenantPrisma.queryRaw<Product>(
      tenantSchema,
      `SELECT * FROM products WHERE is_active = true ORDER BY name`
    )

    res.json({
      success: true,
      data: products,
      count: products.length
    })
  } catch (error) {
    next(error)
  }
})

export default router
```

### Phase 6: Error Handling (2-3 hours)

**Step 6.1: Custom Error Classes**
```typescript
// server/errors/TenantErrors.ts
export class TenantNotFoundError extends Error {
  statusCode = 404
  constructor(message: string) {
    super(message)
    this.name = 'TenantNotFoundError'
  }
}

export class SubscriptionInactiveError extends Error {
  statusCode = 403
  constructor(message: string) {
    super(message)
    this.name = 'SubscriptionInactiveError'
  }
}

export class FeatureNotAvailableError extends Error {
  statusCode = 403
  constructor(message: string) {
    super(message)
    this.name = 'FeatureNotAvailableError'
  }
}

export class EntityLimitExceededError extends Error {
  statusCode = 403
  constructor(message: string) {
    super(message)
    this.name = 'EntityLimitExceededError'
  }
}
```

**Step 6.2: Global Error Handler**
```typescript
// server/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Request error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    organizationId: req.organizationId
  })

  const statusCode = (err as any).statusCode || 500

  res.status(statusCode).json({
    success: false,
    error: err.name,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}
```

---

## 📊 Testing Strategy

### Unit Tests
```typescript
// server/middleware/__tests__/tenantContext.test.ts
import { tenantContext } from '../tenantContext'
import { Request, Response } from 'express'

describe('tenantContext middleware', () => {
  it('should attach tenant to request', async () => {
    const req = mockRequest({ orgId: 'org_123' })
    const res = mockResponse()
    const next = jest.fn()

    await tenantContext(req, res, next)

    expect(req.tenant).toBeDefined()
    expect(req.tenantSchema).toBeDefined()
    expect(next).toHaveBeenCalled()
  })

  it('should throw error when no organization', async () => {
    const req = mockRequest({ orgId: null })
    const res = mockResponse()
    const next = jest.fn()

    await tenantContext(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(TenantNotFoundError))
  })
})
```

### Integration Tests
- Update existing integration tests to use TypeScript
- Add tests for Clerk SDK integration
- Test error handling scenarios

---

## 📝 Migration Checklist

### Files to Convert
- [ ] `server/middleware/tenantContext.js` → `tenantContext.ts`
- [ ] `server/services/tenantPrisma.js` → `TenantPrismaClient.ts`
- [ ] `server/services/TenantProvisioningService.js` → `TenantProvisioningService.ts`
- [ ] `server/routes/products.js` → `products.ts`
- [ ] `server/routes/sales.js` → `sales.ts`
- [ ] `server/routes/inventory.js` → `inventory.ts`
- [ ] `server/routes/forecasts.js` → `forecasts.ts`
- [ ] `server/routes/working-capital.js` → `working-capital.ts`
- [ ] `server/routes/scenarios.js` → `scenarios.ts`
- [ ] `server/routes/webhooks/clerk.js` → `clerk.ts`

### New Files to Create
- [ ] `server/types/tenant.types.ts`
- [ ] `server/types/middleware.types.ts`
- [ ] `server/types/api.types.ts`
- [ ] `server/types/express.d.ts`
- [ ] `server/errors/TenantErrors.ts`
- [ ] `server/middleware/errorHandler.ts`
- [ ] `tsconfig.json`

---

## 🎯 Definition of Done

- [ ] All JavaScript files converted to TypeScript
- [ ] Zero TypeScript compilation errors
- [ ] All existing integration tests passing
- [ ] New unit tests for middleware added
- [ ] Clerk SDK fully integrated
- [ ] Production-grade error handling implemented
- [ ] Documentation updated
- [ ] Code reviewed and committed
- [ ] Deployed to staging for testing

---

## 📈 Success Metrics

- **Type Safety**: 100% of tenant-related code type-safe
- **Error Rate**: < 0.1% errors in production
- **Performance**: No degradation from JavaScript version
- **Developer Experience**: IntelliSense working for all types
- **Code Quality**: ESLint passing with strict TypeScript rules

---

**Story Created**: October 19, 2025
**Estimated Completion**: 16-20 hours
**Priority**: P0 (Blocks Phase 3 completion)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
