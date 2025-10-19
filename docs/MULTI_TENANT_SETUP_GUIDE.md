# CapLiquify Multi-Tenant Database Setup Guide

**Version**: 1.0
**Date**: October 19, 2025
**Database**: PostgreSQL on Render
**ORM**: Prisma
**Authentication**: Clerk Organizations

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Usage](#usage)
5. [API Integration](#api-integration)
6. [Security](#security)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Overview

CapLiquify uses a **schema-per-tenant** multi-tenancy model for maximum data isolation and security. Each tenant gets their own PostgreSQL schema containing all their business data, while shared metadata (users, subscriptions, tenants) resides in the `public` schema.

### Why Schema-Per-Tenant?

✅ **Strong Data Isolation**: Each tenant's data is in a separate schema
✅ **Easy Backup/Restore**: Restore individual tenant without affecting others
✅ **Performance**: No tenant_id filtering overhead on every query
✅ **Compliance**: Easier to prove data isolation for SOC 2, GDPR
✅ **Scalability**: Can move tenant schemas to separate databases later

❌ **Cons**: More complex schema management, can't join across tenants

---

## Architecture

### Database Structure

```
PostgreSQL Database
│
├── public schema (shared metadata)
│   ├── tenants (master tenant registry)
│   ├── users (user accounts with tenant association)
│   ├── subscriptions (Stripe subscription tracking)
│   └── audit_logs (system-wide audit trail)
│
├── tenant_<uuid1> schema (Tenant A's data)
│   ├── companies
│   ├── products
│   ├── sales
│   ├── inventory
│   ├── forecasts
│   ├── working_capital_metrics
│   ├── scenarios
│   ├── api_credentials
│   └── user_preferences
│
├── tenant_<uuid2> schema (Tenant B's data)
│   └── (same tables as above)
│
└── tenant_<uuid3> schema (Tenant C's data)
    └── (same tables as above)
```

### Schema Naming Convention

- **Public**: `public`
- **Tenant**: `tenant_<uuid_without_dashes>`
- **Example**: `tenant_123e4567e89b12d3a456426614174000`

---

## Installation

### Step 1: Run Public Schema Migration

```bash
psql $DATABASE_URL -f prisma/migrations/001_create_public_schema.sql
```

**What this does**:
- Creates `tenants`, `users`, `subscriptions`, `audit_logs` tables
- Creates enums for subscription tiers, status, user roles
- Adds indexes for performance
- Sets up auto-update triggers for `updated_at` columns

### Step 2: Create Tenant Management Functions

```bash
psql $DATABASE_URL -f prisma/migrations/002_tenant_schema_functions.sql
```

**What this does**:
- Creates `create_tenant_schema(uuid)` function
- Creates `delete_tenant_schema(uuid)` function
- Creates `list_tenant_schemas()` function
- Creates `verify_tenant_isolation()` function

### Step 3: Generate Prisma Client

```bash
npx prisma generate --schema=prisma/schema-multi-tenant.prisma
```

### Step 4: Verify Installation

```bash
psql $DATABASE_URL -f prisma/migrations/003_testing_queries.sql
```

**Expected Output**:
```
Public Schema Tables | 4 | 4 expected
Tenant Schemas Created | 0 | (will increase as tenants are created)
Tenants Registered | 0 | (will increase as tenants sign up)
```

---

## Usage

### Creating a New Tenant

#### Option 1: Via SQL (Manual)

```sql
-- Step 1: Insert tenant record
INSERT INTO public.tenants (
  slug,
  name,
  schema_name,
  clerk_organization_id,
  subscription_tier,
  subscription_status,
  trial_ends_at,
  max_users,
  max_entities,
  features
) VALUES (
  'acme-corp',
  'ACME Corporation',
  'tenant_' || REPLACE(gen_random_uuid()::TEXT, '-', ''),
  'org_2abc123def456',
  'professional',
  'trial',
  NOW() + INTERVAL '14 days',
  10,
  1000,
  '{"ai_forecasting": true, "what_if": true}'::JSONB
) RETURNING id, schema_name;

-- Step 2: Create tenant schema using the returned id
SELECT create_tenant_schema('123e4567-e89b-12d3-a456-426614174000');
```

#### Option 2: Via Node.js/Prisma (Recommended)

```javascript
// services/tenantService.js
import { PrismaClient } from '@prisma/client'
import { Client } from 'pg'

const prisma = new PrismaClient()

export async function createTenant(organizationData) {
  const { clerkOrgId, name, slug, subscriptionTier } = organizationData

  // Step 1: Create tenant record
  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name,
      schemaName: `tenant_${crypto.randomUUID().replace(/-/g, '')}`,
      clerkOrganizationId: clerkOrgId,
      subscriptionTier,
      subscriptionStatus: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      maxUsers: subscriptionTier === 'starter' ? 5 : subscriptionTier === 'professional' ? 25 : 100,
      maxEntities: subscriptionTier === 'starter' ? 1 : subscriptionTier === 'professional' ? 5 : 999,
      features: {
        ai_forecasting: subscriptionTier !== 'starter',
        what_if: subscriptionTier !== 'starter',
        api_integrations: true,
        advanced_reports: subscriptionTier === 'enterprise',
      },
    },
  })

  // Step 2: Create tenant schema
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    await client.query('SELECT create_tenant_schema($1)', [tenant.id])
    console.log(`Tenant schema ${tenant.schemaName} created successfully`)
  } finally {
    await client.end()
  }

  return tenant
}
```

### Querying Tenant Data

#### Set Search Path (Recommended)

```javascript
// middleware/tenantMiddleware.js
export function setTenantSchema(req, res, next) {
  const tenant = req.user.tenant // From Clerk

  // Set Prisma to use tenant schema
  req.prisma.$queryRaw`SET search_path TO ${tenant.schemaName}, public`

  next()
}

// Usage in route
app.get('/api/products', setTenantSchema, async (req, res) => {
  // This query runs in tenant's schema
  const products = await req.prisma.$queryRaw`SELECT * FROM products WHERE is_active = true`
  res.json(products)
})
```

#### Direct Schema Reference

```javascript
// Query specific tenant's data
const products = await prisma.$queryRaw`
  SELECT * FROM tenant_${tenantId}.products
  WHERE is_active = true
  ORDER BY name
`
```

### Deleting a Tenant

```javascript
export async function deleteTenant(tenantId) {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    // Step 1: Soft delete tenant record
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { deletedAt: new Date() },
    })

    // Step 2: (Optional) Delete tenant schema after grace period
    // WARNING: This is IRREVERSIBLE!
    await client.query('SELECT delete_tenant_schema($1)', [tenantId])

    // Step 3: Hard delete tenant record
    await prisma.tenant.delete({
      where: { id: tenantId },
    })
  } finally {
    await client.end()
  }
}
```

---

## API Integration

### Clerk Webhook Handler (Tenant Provisioning)

```javascript
// api/webhooks/clerk.js
import { Webhook } from 'svix'
import { createTenant } from '../services/tenantService'

export async function handleClerkWebhook(req, res) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  const webhook = new Webhook(webhookSecret)

  try {
    const payload = webhook.verify(req.body, req.headers)

    if (payload.type === 'organization.created') {
      const { id, name, slug } = payload.data

      // Create tenant
      const tenant = await createTenant({
        clerkOrgId: id,
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        subscriptionTier: 'starter', // Default tier
      })

      console.log(`Tenant ${tenant.name} created successfully`)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Clerk webhook error:', error)
    res.status(400).json({ error: error.message })
  }
}
```

### Stripe Webhook Handler (Subscription Management)

```javascript
// api/webhooks/stripe.js
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await updateSubscription(event.data.object)
        break

      case 'customer.subscription.deleted':
        await cancelSubscription(event.data.object)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object)
        break
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    res.status(400).json({ error: error.message })
  }
}

async function updateSubscription(subscription) {
  const tenantId = subscription.metadata.tenant_id

  await prisma.subscription.upsert({
    where: { tenantId },
    update: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    create: {
      tenantId,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      billingCycle: subscription.items.data[0].price.recurring.interval === 'month' ? 'monthly' : 'annual',
      amountCents: subscription.items.data[0].price.unit_amount,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  })
}
```

---

## Security

### Row-Level Security (Future Enhancement)

While schema-per-tenant provides strong isolation, you can add RLS for extra protection:

```sql
-- Example: Prevent cross-tenant access via RLS
ALTER TABLE tenant_<uuid>.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenant_<uuid>.companies
  FOR ALL
  USING (current_schema() = 'tenant_<uuid>');
```

### Credential Encryption

API credentials stored in `api_credentials` table should be encrypted:

```javascript
import crypto from 'crypto'

const algorithm = 'aes-256-gcm'
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')

export function encryptCredentials(credentials) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)

  let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

export function decryptCredentials(encryptedData) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encryptedData.iv, 'hex')
  )

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return JSON.parse(decrypted)
}
```

### Audit Logging

Always log sensitive operations:

```javascript
export async function logAudit(tenantId, userId, action, resourceType, resourceId, metadata = {}) {
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action,
      resourceType,
      resourceId,
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      metadata,
    },
  })
}

// Usage
await logAudit(
  tenant.id,
  user.id,
  'forecast.generated',
  'forecast',
  forecast.id,
  { model: 'ensemble', confidence: 85.5 }
)
```

---

## Monitoring

### Database Size Monitoring

```sql
-- Monitor tenant schema sizes
SELECT
  schema_name,
  pg_size_pretty(SUM(pg_total_relation_size(quote_ident(schema_name) || '.' || quote_ident(table_name)))) AS size,
  COUNT(table_name) AS table_count
FROM information_schema.tables
WHERE table_schema LIKE 'tenant_%'
GROUP BY schema_name
ORDER BY SUM(pg_total_relation_size(quote_ident(schema_name) || '.' || quote_ident(table_name))) DESC
LIMIT 10;
```

### Active Tenant Queries

```sql
-- List all tenants with user counts
SELECT
  t.name,
  t.subscription_tier,
  t.subscription_status,
  COUNT(u.id) AS user_count,
  t.created_at
FROM public.tenants t
LEFT JOIN public.users u ON u.tenant_id = t.id
WHERE t.deleted_at IS NULL
GROUP BY t.id
ORDER BY t.created_at DESC;
```

### Performance Monitoring

```javascript
// Monitor slow queries per tenant
export async function getSlowQueries(tenantId) {
  const result = await prisma.$queryRaw`
    SELECT
      query,
      calls,
      total_time,
      mean_time,
      max_time
    FROM pg_stat_statements
    WHERE query LIKE '%tenant_${tenantId}%'
    ORDER BY mean_time DESC
    LIMIT 10
  `
  return result
}
```

---

## Troubleshooting

### Issue: Tenant schema not found

**Symptoms**: `ERROR: schema "tenant_xxx" does not exist`

**Solution**:
```sql
-- Verify tenant exists
SELECT id, schema_name FROM public.tenants WHERE id = '<tenant_id>';

-- Recreate schema if missing
SELECT create_tenant_schema('<tenant_id>'::UUID);
```

### Issue: Cannot query tenant data

**Symptoms**: `ERROR: relation "products" does not exist`

**Solution**: Set search path before querying
```sql
SET search_path TO tenant_<uuid>, public;
SELECT * FROM products;
```

### Issue: Tenant isolation verification fails

**Symptoms**: Can see data from wrong tenant

**Solution**:
```sql
-- Run isolation verification
SELECT * FROM verify_tenant_isolation();

-- Check current schema
SELECT current_schema();

-- Reset search path
RESET search_path;
```

### Issue: Migration failed mid-way

**Symptoms**: Some tenant tables created, others missing

**Solution**:
```sql
-- Drop incomplete schema
DROP SCHEMA IF EXISTS tenant_<uuid> CASCADE;

-- Recreate from scratch
SELECT create_tenant_schema('<tenant_id>'::UUID);
```

---

## Best Practices

### ✅ DO:

1. **Always set search_path** before querying tenant data
2. **Use Prisma transactions** for multi-table operations
3. **Encrypt sensitive credentials** before storing
4. **Log all audit events** for compliance
5. **Soft delete tenants** first (grace period before hard delete)
6. **Monitor schema sizes** to prevent runaway growth
7. **Use connection pooling** (PgBouncer) for production
8. **Backup tenant schemas** independently

### ❌ DON'T:

1. **Don't hardcode schema names** in queries
2. **Don't share database credentials** across tenants
3. **Don't join across tenant schemas**
4. **Don't forget to revoke test tenant access**
5. **Don't skip audit logging** for sensitive operations
6. **Don't delete tenant schemas** without user confirmation
7. **Don't expose tenant_id** in public APIs

---

## Next Steps

1. ✅ Complete Phase 1: Database schema design
2. ⏳ Phase 2: Backend multi-tenant transformation
3. ⏳ Phase 3: Authentication & tenant management (Clerk integration)
4. ⏳ Phase 4: Marketing website
5. ⏳ Phase 5: Master admin dashboard
6. ⏳ Phase 6: Billing & subscriptions (Stripe integration)
7. ⏳ Phase 7: Data migration from Sentia to CapLiquify
8. ⏳ Phase 8: Production deployment

---

## Resources

- **Prisma Multi-Schema**: https://www.prisma.io/docs/concepts/components/prisma-schema/multiple-databases
- **PostgreSQL Schemas**: https://www.postgresql.org/docs/current/ddl-schemas.html
- **Clerk Organizations**: https://clerk.com/docs/organizations/overview
- **Stripe Subscriptions**: https://stripe.com/docs/billing/subscriptions/overview

---

**Document Version**: 1.0
**Last Updated**: October 19, 2025
**Maintained By**: CapLiquify Engineering Team
