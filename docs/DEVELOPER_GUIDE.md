# CapLiquify Developer Guide

**Multi-Tenant Development Best Practices**

**Epic**: BMAD-MULTITENANT-001
**Created**: 2025-10-20
**Version**: 1.0
**Status**: Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Development Environment Setup](#development-environment-setup)
3. [Querying Tenant Data](#querying-tenant-data)
4. [Prisma Client Usage](#prisma-client-usage)
5. [Middleware for Tenant Context](#middleware-for-tenant-context)
6. [Security Best Practices](#security-best-practices)
7. [Common Patterns](#common-patterns)
8. [Testing](#testing)
9. [Debugging](#debugging)

---

## Overview

This guide provides practical examples and best practices for developing features in the CapLiquify multi-tenant SaaS platform.

### Key Principles

1. **Always verify tenant context** before querying data
2. **Never expose tenant_id in URLs** (use Clerk Organization ID instead)
3. **Enforce tenant isolation** at the database, API, and UI levels
4. **Log all tenant operations** to audit_logs
5. **Test cross-tenant isolation** for every feature

---

## Development Environment Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 17+ (local or Render)
- Prisma 5.x
- Clerk account

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/capliquify.git
cd capliquify

# Install dependencies
pnpm install

# Copy environment template
cp .env.template .env
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/capliquify_dev?schema=public"

# Clerk Authentication
CLERK_SECRET_KEY="sk_test_..."
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Application
NODE_ENV="development"
PORT=5000
VITE_API_BASE_URL="http://localhost:5000/api"
```

### Database Setup

```bash
# Run public schema migration
psql $DATABASE_URL -f prisma/migrations/001_create_public_schema.sql

# Run tenant lifecycle functions
psql $DATABASE_URL -f prisma/migrations/tenant_lifecycle_functions.sql

# Generate Prisma Client
npx prisma generate --schema=prisma/schema-multitenant.prisma
```

### Create Development Tenant

```bash
# Run SQL to create test tenant
psql $DATABASE_URL -f prisma/migrations/003_testing_queries.sql
```

---

## Querying Tenant Data

### Pattern 1: Using Prisma with Dynamic Schema

**Set search path to tenant schema:**
```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getProductsForTenant(tenantId) {
  // Get tenant schema name
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  // Set search path to tenant schema
  await prisma.$executeRaw`SET search_path TO ${tenant.schemaName}, public`;

  // Now queries default to tenant schema
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      inventory: true
    }
  });

  return products;
}
```

### Pattern 2: Using Raw SQL with Schema Qualification

**Explicitly qualify table names:**
```javascript
async function getSalesForTenant(tenantId, startDate, endDate) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  const sales = await prisma.$queryRawUnsafe(`
    SELECT
      s.sale_date,
      p.sku,
      p.name AS product_name,
      s.quantity,
      s.total_amount,
      s.channel
    FROM ${tenant.schemaName}.sales s
    JOIN ${tenant.schemaName}.products p ON p.id = s.product_id
    WHERE s.sale_date BETWEEN $1 AND $2
    ORDER BY s.sale_date DESC
  `, startDate, endDate);

  return sales;
}
```

### Pattern 3: Using Prisma with Multiple Schemas

**Prisma multiSchema preview feature:**
```prisma
// prisma/schema-multitenant.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "tenant"]
}

model Tenant {
  id   String @id @default(uuid())
  slug String @unique

  @@schema("public")
  @@map("tenants")
}

model Product {
  id   String @id @default(uuid())
  sku  String @unique
  name String

  @@schema("tenant")
  @@map("products")
}
```

**Query across schemas:**
```javascript
// Public schema
const tenant = await prisma.tenant.findUnique({
  where: { slug: 'acme-corp' }
});

// Tenant schema (requires setting schema context first)
await prisma.$executeRaw`SET search_path TO ${tenant.schemaName}`;
const products = await prisma.product.findMany();
```

---

## Prisma Client Usage

### Creating a Tenant-Aware Prisma Client

**Prisma Client Extension** (recommended):
```javascript
// lib/prisma-tenant.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function getTenantPrisma(tenantId) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          // Get tenant schema
          const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
          });

          // Set search path before query
          await prisma.$executeRaw`SET search_path TO ${tenant.schemaName}, public`;

          // Execute original query
          return query(args);
        }
      }
    }
  });
}
```

**Usage:**
```javascript
import { getTenantPrisma } from './lib/prisma-tenant';

async function handler(req, res) {
  const tenantId = req.user.tenantId;
  const db = getTenantPrisma(tenantId);

  const products = await db.product.findMany({
    where: { isActive: true }
  });

  res.json(products);
}
```

### Transaction Handling

**Ensure transactions stay within tenant schema:**
```javascript
async function createOrderWithInventoryUpdate(tenantId, orderData) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  return await prisma.$transaction(async (tx) => {
    // Set schema context
    await tx.$executeRaw`SET search_path TO ${tenant.schemaName}`;

    // Create sale
    const sale = await tx.sale.create({
      data: {
        companyId: orderData.companyId,
        productId: orderData.productId,
        quantity: orderData.quantity,
        unitPrice: orderData.unitPrice,
        totalAmount: orderData.quantity * orderData.unitPrice,
        channel: orderData.channel
      }
    });

    // Update inventory
    await tx.inventory.update({
      where: {
        productId_location: {
          productId: orderData.productId,
          location: orderData.warehouseLocation
        }
      },
      data: {
        quantityOnHand: {
          decrement: orderData.quantity
        }
      }
    });

    return sale;
  });
}
```

---

## Middleware for Tenant Context

### Express Middleware

**Extract tenant from Clerk Organization:**
```javascript
// middleware/tenant-context.js
import { requireAuth } from '@clerk/express';

export async function attachTenantContext(req, res, next) {
  try {
    // Clerk middleware should run first to set req.auth
    const clerkOrgId = req.auth.orgId;

    if (!clerkOrgId) {
      return res.status(400).json({ error: 'No organization context' });
    }

    // Lookup tenant by Clerk Organization ID
    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrganizationId: clerkOrgId }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check subscription status
    if (tenant.subscriptionStatus === 'SUSPENDED') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    // Attach tenant to request
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant context error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

**Apply middleware:**
```javascript
// routes/products.js
import { requireAuth } from '@clerk/express';
import { attachTenantContext } from '../middleware/tenant-context';

router.get('/api/products',
  requireAuth(),           // 1. Verify Clerk authentication
  attachTenantContext,     // 2. Attach tenant context
  async (req, res) => {
    // 3. Query tenant data
    const { tenant } = req;

    await prisma.$executeRaw`SET search_path TO ${tenant.schemaName}`;

    const products = await prisma.product.findMany();

    res.json(products);
  }
);
```

### React Context (Frontend)

**Tenant Context Provider:**
```javascript
// context/TenantContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useOrganization } from '@clerk/clerk-react';

const TenantContext = createContext();

export function TenantProvider({ children }) {
  const { organization } = useOrganization();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTenant() {
      if (!organization) return;

      try {
        const response = await fetch('/api/tenant/current', {
          headers: {
            'Authorization': `Bearer ${await getToken()}`
          }
        });

        const data = await response.json();
        setTenant(data);
      } catch (error) {
        console.error('Failed to fetch tenant:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTenant();
  }, [organization]);

  return (
    <TenantContext.Provider value={{ tenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
```

**Usage:**
```javascript
// pages/Dashboard.jsx
import { useTenant } from '../context/TenantContext';

export function Dashboard() {
  const { tenant, loading } = useTenant();

  if (loading) return <LoadingScreen />;
  if (!tenant) return <ErrorScreen message="No tenant context" />;

  return (
    <div>
      <h1>Welcome to {tenant.name}</h1>
      <p>Subscription: {tenant.subscriptionTier}</p>
    </div>
  );
}
```

---

## Security Best Practices

### 1. Never Trust Client Input

**Bad:**
```javascript
// ❌ DANGEROUS: Tenant ID from client
router.get('/api/products', async (req, res) => {
  const tenantId = req.query.tenantId; // CLIENT CONTROLLED!

  // Attacker can query ANY tenant's data
  const products = await getProductsForTenant(tenantId);
  res.json(products);
});
```

**Good:**
```javascript
// ✅ SAFE: Tenant from authentication context
router.get('/api/products',
  requireAuth(),
  attachTenantContext,
  async (req, res) => {
    const { tenant } = req; // SERVER CONTROLLED via Clerk

    const products = await getProductsForTenant(tenant.id);
    res.json(products);
  }
);
```

### 2. Validate Tenant Access to Resources

**Check resource belongs to tenant:**
```javascript
async function getProduct(tenantId, productId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  await prisma.$executeRaw`SET search_path TO ${tenant.schemaName}`;

  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    throw new Error('Product not found or does not belong to tenant');
  }

  return product;
}
```

### 3. Use Prepared Statements

**Prevent SQL injection:**
```javascript
// ❌ DANGEROUS: String concatenation
const sku = req.query.sku;
const products = await prisma.$queryRawUnsafe(
  `SELECT * FROM ${tenant.schemaName}.products WHERE sku = '${sku}'`
);

// ✅ SAFE: Parameterized query
const products = await prisma.$queryRawUnsafe(
  `SELECT * FROM ${tenant.schemaName}.products WHERE sku = $1`,
  sku
);
```

### 4. Audit Sensitive Operations

**Log all data modifications:**
```javascript
async function deleteProduct(tenantId, productId, userId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  await prisma.$executeRaw`SET search_path TO ${tenant.schemaName}`;

  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  // Delete product
  await prisma.product.delete({
    where: { id: productId }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action: 'product.deleted',
      resourceType: 'product',
      resourceId: productId,
      severity: 'WARNING',
      changes: {
        sku: product.sku,
        name: product.name
      },
      success: true
    }
  });
}
```

### 5. Row-Level Security (RLS)

**Apply PostgreSQL RLS policies:**
```sql
-- Enable RLS on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see users from their tenant
CREATE POLICY users_tenant_isolation ON public.users
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Set current tenant ID in session
SELECT set_config('app.current_tenant_id', '550e8400-e29b-41d4-a716-446655440000', false);
```

**Set session variable in middleware:**
```javascript
async function attachTenantContext(req, res, next) {
  const tenant = await getTenantFromClerk(req.auth.orgId);

  // Set PostgreSQL session variable
  await prisma.$executeRawUnsafe(
    `SELECT set_config('app.current_tenant_id', '${tenant.id}', false)`
  );

  req.tenant = tenant;
  next();
}
```

---

## Common Patterns

### Pattern: Multi-Channel Sales Aggregation

```javascript
async function getSalesByChannel(tenantId, startDate, endDate) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  const salesByChannel = await prisma.$queryRawUnsafe(`
    SELECT
      channel,
      COUNT(*) AS order_count,
      SUM(quantity) AS total_units,
      SUM(total_amount) AS gross_revenue,
      SUM(net_revenue) AS net_revenue,
      AVG(commission_rate) AS avg_commission_rate
    FROM ${tenant.schemaName}.sales
    WHERE sale_date BETWEEN $1 AND $2
    GROUP BY channel
    ORDER BY gross_revenue DESC
  `, startDate, endDate);

  return salesByChannel;
}
```

### Pattern: Inventory Reorder Recommendations

```javascript
async function getReorderRecommendations(tenantId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  await prisma.$executeRaw`SET search_path TO ${tenant.schemaName}`;

  const lowStockProducts = await prisma.$queryRaw`
    SELECT
      p.sku,
      p.name,
      p.reorder_point,
      p.reorder_quantity,
      p.lead_time_days,
      i.quantity_on_hand,
      i.quantity_reserved,
      i.quantity_available,
      CASE
        WHEN i.quantity_available <= p.reorder_point THEN 'URGENT'
        WHEN i.quantity_available <= p.reorder_point * 1.2 THEN 'WARNING'
        ELSE 'OK'
      END AS reorder_status
    FROM products p
    JOIN inventory i ON i.product_id = p.id
    WHERE i.quantity_available <= p.reorder_point
    ORDER BY i.quantity_available ASC
  `;

  return lowStockProducts;
}
```

### Pattern: Working Capital Calculation

```javascript
async function calculateWorkingCapital(tenantId, periodDate) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  await prisma.$executeRaw`SET search_path TO ${tenant.schemaName}`;

  // Calculate current assets
  const currentAssets = await prisma.$queryRaw`
    SELECT
      SUM(CASE WHEN metric_type = 'cash' THEN amount ELSE 0 END) AS cash,
      SUM(CASE WHEN metric_type = 'ar' THEN amount ELSE 0 END) AS accounts_receivable,
      SUM(i.quantity_on_hand * p.unit_cost) AS inventory
    FROM inventory i
    JOIN products p ON p.id = i.product_id
  `;

  // Calculate current liabilities (from external API - Xero)
  const xeroData = await xeroService.getBalanceSheet(tenant.id);

  const wcMetric = await prisma.workingCapitalMetric.create({
    data: {
      companyId: tenant.companies[0].id,
      periodDate,
      periodType: 'MONTHLY',
      cash: currentAssets.cash,
      accountsReceivable: currentAssets.accounts_receivable,
      inventory: currentAssets.inventory,
      accountsPayable: xeroData.accountsPayable,
      shortTermDebt: xeroData.shortTermDebt
    }
  });

  return wcMetric;
}
```

---

## Testing

### Unit Tests with Tenant Isolation

**Setup test tenant:**
```javascript
// tests/setup.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let testTenant;

beforeAll(async () => {
  // Create test tenant
  testTenant = await prisma.tenant.create({
    data: {
      slug: 'test-tenant',
      name: 'Test Tenant',
      schemaName: 'tenant_test123',
      clerkOrganizationId: 'org_test123',
      subscriptionTier: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE'
    }
  });

  // Create tenant schema
  await prisma.$executeRawUnsafe(
    `SELECT create_tenant_schema('${testTenant.id}'::UUID)`
  );
});

afterAll(async () => {
  // Delete tenant schema
  await prisma.$executeRawUnsafe(
    `SELECT delete_tenant_schema('${testTenant.id}'::UUID)`
  );

  // Delete tenant record
  await prisma.tenant.delete({ where: { id: testTenant.id } });

  await prisma.$disconnect();
});
```

**Test tenant isolation:**
```javascript
// tests/tenant-isolation.test.js
describe('Tenant Isolation', () => {
  it('should not allow cross-tenant data access', async () => {
    // Create two tenants
    const tenant1 = await createTestTenant('tenant1');
    const tenant2 = await createTestTenant('tenant2');

    // Insert product into Tenant 1
    await prisma.$executeRaw`SET search_path TO ${tenant1.schemaName}`;
    await prisma.product.create({
      data: { sku: 'TENANT1-SKU', name: 'Tenant 1 Product' }
    });

    // Try to query Tenant 1's product from Tenant 2 context
    await prisma.$executeRaw`SET search_path TO ${tenant2.schemaName}`;
    const products = await prisma.product.findMany({
      where: { sku: 'TENANT1-SKU' }
    });

    // Should return 0 rows (isolation enforced)
    expect(products).toHaveLength(0);
  });
});
```

---

## Debugging

### Enable Query Logging

```javascript
// lib/prisma.js
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' }
  ]
});

prisma.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Params:', e.params);
  console.log('Duration:', e.duration, 'ms');
});
```

### Verify Current Schema

```javascript
async function getCurrentSchema() {
  const result = await prisma.$queryRaw`SELECT current_schema()`;
  console.log('Current schema:', result[0].current_schema);
}
```

### List All Tenant Schemas

```sql
SELECT * FROM list_tenant_schemas();
```

---

## Related Documentation

- [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md) - Multi-tenant architecture overview
- [TENANT_LIFECYCLE.md](TENANT_LIFECYCLE.md) - Tenant management operations
- [Prisma Schema](../prisma/schema-multitenant.prisma) - Complete data model

---

**Epic**: BMAD-MULTITENANT-001
**Author**: Claude (BMAD Agent)
**Status**: Production-Ready
**Last Updated**: 2025-10-20
