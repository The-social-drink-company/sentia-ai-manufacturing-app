# CapLiquify Tenant Lifecycle Management

**Complete Guide to Tenant Creation, Management, and Deletion**

**Epic**: BMAD-MULTITENANT-001
**Created**: 2025-10-20
**Version**: 1.0
**Status**: Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Tenant Creation](#tenant-creation)
3. [Tenant Management](#tenant-management)
4. [Tenant Deletion](#tenant-deletion)
5. [Tenant Migration](#tenant-migration)
6. [Backup and Restore](#backup-and-restore)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers all operations for managing tenant lifecycles in the CapLiquify multi-tenant SaaS platform.

### Tenant States

```
TRIAL → ACTIVE → PAST_DUE → SUSPENDED → CANCELLED
                    ↓
                 EXPIRED
```

| State | Description | Schema Status |
|-------|-------------|---------------|
| **TRIAL** | Free trial period (14 days default) | Active |
| **ACTIVE** | Paid subscription active | Active |
| **PAST_DUE** | Payment failed, grace period | Active (read-only) |
| **SUSPENDED** | Admin suspension | Frozen |
| **CANCELLED** | Subscription cancelled by customer | Deleted (30-day retention) |
| **EXPIRED** | Trial expired without conversion | Frozen |

---

## Tenant Creation

### Process Overview

1. **User signs up** → Clerk Organizations creates organization
2. **Clerk webhook fires** → Backend receives `organization.created` event
3. **Backend creates tenant** → Insert into `public.tenants` table
4. **Backend creates schema** → Execute `create_tenant_schema()` function
5. **Backend seeds data** → Create initial company, sample products (optional)
6. **User redirected** → Onboarding flow in app

### Step-by-Step Guide

#### Step 1: Create Tenant Record

**Via Prisma**:
```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const tenant = await prisma.tenant.create({
  data: {
    slug: 'acme-manufacturing',        // URL-friendly identifier
    name: 'ACME Manufacturing Ltd',    // Display name
    clerkOrganizationId: 'org_clerk_acme123',

    // Company details
    companyName: 'ACME Manufacturing Ltd',
    domain: 'acme.com',
    industry: 'Manufacturing',

    // Trial configuration
    isInTrial: true,
    trialTier: 'PROFESSIONAL',
    trialStartDate: new Date(),
    trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days

    // Subscription (trial)
    subscriptionTier: 'PROFESSIONAL',
    subscriptionStatus: 'TRIAL',

    // Limits (Professional tier)
    maxUsers: 20,
    maxEntities: 500,
    maxStorage: 10000, // 10 GB

    // Feature flags
    features: {
      demandForecasting: true,
      inventoryManagement: true,
      workingCapitalAnalysis: true,
      aiAnalytics: true,
      multiChannelIntegration: true,
      advancedReporting: true
    },

    // Settings
    settings: {
      timezone: 'America/New_York',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      locale: 'en-US',
      fiscalYearStart: '01-01'
    },

    // Metadata
    createdBy: clerkUserId,
    isActive: true
  }
});

console.log('Tenant created:', tenant.id);
```

**Via SQL**:
```sql
INSERT INTO public.tenants (
  slug, name, clerk_organization_id,
  subscription_tier, subscription_status,
  is_in_trial, trial_tier,
  max_users, max_entities, max_storage,
  features, settings
) VALUES (
  'acme-manufacturing',
  'ACME Manufacturing Ltd',
  'org_clerk_acme123',
  'PROFESSIONAL',
  'TRIAL',
  true,
  'PROFESSIONAL',
  20,
  500,
  10000,
  '{"demandForecasting": true, "aiAnalytics": true}'::JSONB,
  '{"timezone": "America/New_York", "currency": "USD"}'::JSONB
) RETURNING id, slug, schema_name;
```

#### Step 2: Generate Schema Name

Schema name is auto-generated based on tenant UUID:
```
Schema Name Format: tenant_<uuid>
Example: tenant_550e8400-e29b-41d4-a716-446655440000
```

Update tenant record with schema name:
```javascript
const schemaName = `tenant_${tenant.id}`;

await prisma.tenant.update({
  where: { id: tenant.id },
  data: { schemaName }
});
```

#### Step 3: Create Tenant Schema

**Via Prisma**:
```javascript
await prisma.$executeRawUnsafe(
  `SELECT create_tenant_schema('${tenant.id}'::UUID)`
);
```

**Via SQL**:
```sql
SELECT create_tenant_schema('550e8400-e29b-41d4-a716-446655440000'::UUID);
-- Returns: 'tenant_550e8400-e29b-41d4-a716-446655440000'
```

**What happens**:
1. Creates schema `tenant_<uuid>`
2. Creates 9 tables: companies, products, sales, inventory, forecasts, working_capital_metrics, scenarios, api_credentials, user_preferences
3. Creates indexes on all foreign keys and frequently filtered columns
4. Creates triggers for `updated_at` auto-update

#### Step 4: Seed Initial Data (Optional)

Create initial company record:
```javascript
await prisma.$executeRawUnsafe(`
  INSERT INTO ${schemaName}.companies (name, currency, fiscal_year_start)
  VALUES ('ACME Manufacturing', 'USD', '01-01')
`);
```

Or use Prisma with schema context:
```javascript
// Set search path to tenant schema
await prisma.$executeRaw`SET search_path TO ${schemaName}, public`;

// Now create company
await prisma.company.create({
  data: {
    name: 'ACME Manufacturing',
    currency: 'USD',
    fiscalYearStart: '01-01'
  }
});
```

#### Step 5: Create First User

```javascript
await prisma.user.create({
  data: {
    clerkUserId: 'user_clerk_owner123',
    email: 'owner@acme.com',
    firstName: 'John',
    lastName: 'Doe',
    tenantId: tenant.id,
    role: 'OWNER', // OWNER, ADMIN, MEMBER, VIEWER
    isActive: true,
    isVerified: true
  }
});
```

#### Step 6: Create Audit Log Entry

```javascript
await prisma.auditLog.create({
  data: {
    tenantId: tenant.id,
    action: 'tenant.created',
    resourceType: 'tenant',
    resourceId: tenant.id,
    severity: 'INFO',
    metadata: {
      subscriptionTier: tenant.subscriptionTier,
      trialEndDate: tenant.trialEndDate,
      createdBy: clerkUserId
    },
    success: true
  }
});
```

---

## Tenant Management

### Updating Subscription

**Trial → Active Subscription**:
```javascript
await prisma.tenant.update({
  where: { id: tenantId },
  data: {
    isInTrial: false,
    trialTier: null,
    subscriptionStatus: 'ACTIVE',
    subscriptionStartDate: new Date()
  }
});

await prisma.subscription.create({
  data: {
    tenantId,
    subscriptionTier: 'PROFESSIONAL',
    status: 'ACTIVE',
    billingCycle: 'MONTHLY',
    stripeSubscriptionId: 'sub_stripe123',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
});
```

**Upgrade Subscription Tier**:
```javascript
// Professional → Enterprise
await prisma.tenant.update({
  where: { id: tenantId },
  data: {
    subscriptionTier: 'ENTERPRISE',
    maxUsers: 999999,      // Unlimited
    maxEntities: 999999,   // Unlimited
    maxStorage: 100000     // 100 GB
  }
});

await prisma.auditLog.create({
  data: {
    tenantId,
    action: 'subscription.upgraded',
    resourceType: 'subscription',
    severity: 'INFO',
    changes: {
      from: 'PROFESSIONAL',
      to: 'ENTERPRISE'
    }
  }
});
```

### Suspending a Tenant

**Suspend for non-payment**:
```javascript
await prisma.tenant.update({
  where: { id: tenantId },
  data: {
    subscriptionStatus: 'SUSPENDED',
    isSuspended: true,
    suspensionReason: 'Payment failed - subscription past due',
    lastActivityAt: new Date()
  }
});

// Tenant can still view data but cannot modify (enforce in app logic)
```

**Reactivate suspended tenant**:
```javascript
await prisma.tenant.update({
  where: { id: tenantId },
  data: {
    subscriptionStatus: 'ACTIVE',
    isSuspended: false,
    suspensionReason: null
  }
});
```

### Tracking Usage Metrics

**Record daily usage**:
```javascript
await prisma.usageMetric.create({
  data: {
    tenantId,
    periodStart: new Date(Date.now() - 24 * 60 * 60 * 1000),
    periodEnd: new Date(),
    activeUsersCount: 12,
    totalEntitiesCount: 450,
    storageUsedMb: 8500,
    apiRequestsCount: 15000,
    forecastsGenerated: 25,
    reportsExported: 8,
    integrationsSynced: 120
  }
});
```

**Check quota limits**:
```javascript
const tenant = await prisma.tenant.findUnique({
  where: { id: tenantId },
  include: {
    usageMetrics: {
      orderBy: { periodEnd: 'desc' },
      take: 1
    }
  }
});

const latestUsage = tenant.usageMetrics[0];

if (latestUsage.totalEntitiesCount > tenant.maxEntities) {
  throw new Error('Entity limit exceeded. Please upgrade your subscription.');
}
```

---

## Tenant Deletion

### Soft Delete (30-Day Retention)

**Step 1**: Mark tenant as deleted
```javascript
await prisma.tenant.update({
  where: { id: tenantId },
  data: {
    deletedAt: new Date(),
    subscriptionStatus: 'CANCELLED',
    isActive: false
  }
});
```

**Schema remains intact** for 30 days:
- Allows data recovery if customer changes mind
- Provides grace period for compliance/legal holds
- Audit logs preserved

**Step 2**: Create audit log
```javascript
await prisma.auditLog.create({
  data: {
    tenantId,
    action: 'tenant.soft_deleted',
    resourceType: 'tenant',
    severity: 'WARNING',
    metadata: {
      schemaName: tenant.schemaName,
      retentionDays: 30,
      permanentDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  }
});
```

### Hard Delete (Permanent)

**⚠️ WARNING: This operation is IRREVERSIBLE! All tenant data will be permanently deleted.**

**Step 1**: Verify 30-day retention period passed
```javascript
const tenant = await prisma.tenant.findUnique({
  where: { id: tenantId }
});

const daysSinceDeletion = (Date.now() - tenant.deletedAt.getTime()) / (1000 * 60 * 60 * 24);

if (daysSinceDeletion < 30) {
  throw new Error(`Tenant can only be permanently deleted after 30 days. Days remaining: ${30 - daysSinceDeletion}`);
}
```

**Step 2**: Delete tenant schema (CASCADE removes all tables and data)
```javascript
await prisma.$executeRawUnsafe(
  `SELECT delete_tenant_schema('${tenantId}'::UUID)`
);
// Returns: true if successful, false if schema doesn't exist
```

**Step 3**: Delete tenant record
```javascript
await prisma.tenant.delete({
  where: { id: tenantId }
});
// CASCADE deletes: users, subscriptions, audit_logs, usage_metrics
```

**Step 4**: Create permanent deletion audit log
```javascript
// Store in separate audit archive (tenant_id is now invalid)
await auditArchive.create({
  tenantId,
  action: 'tenant.permanently_deleted',
  timestamp: new Date(),
  metadata: {
    schemaName: tenant.schemaName,
    slug: tenant.slug,
    deletedBy: adminUserId
  }
});
```

---

## Tenant Migration

### Migrating Tenant Schema (e.g., adding new column)

**Challenge**: Update 1,000+ tenant schemas with new migration

**Solution**: Batch migration with retry logic

```javascript
async function migrateAllTenantSchemas(migrationSQL) {
  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null }
  });

  console.log(`Migrating ${tenants.length} tenant schemas...`);

  for (const tenant of tenants) {
    try {
      await prisma.$executeRawUnsafe(
        `SET search_path TO ${tenant.schemaName}, public`
      );

      await prisma.$executeRawUnsafe(migrationSQL);

      console.log(`✅ Migrated: ${tenant.schemaName}`);

      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          action: 'schema.migrated',
          resourceType: 'schema',
          severity: 'INFO',
          success: true
        }
      });
    } catch (error) {
      console.error(`❌ Failed to migrate ${tenant.schemaName}:`, error);

      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          action: 'schema.migration_failed',
          resourceType: 'schema',
          severity: 'ERROR',
          success: false,
          errorMessage: error.message
        }
      });
    }
  }
}

// Example: Add new column to products table
const migrationSQL = `
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS minimum_order_quantity INT DEFAULT 1;
`;

await migrateAllTenantSchemas(migrationSQL);
```

**Best Practices**:
1. Test migration on staging tenants first
2. Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
3. Run migrations during low-traffic hours
4. Monitor migration progress with audit logs
5. Implement rollback capability

---

## Backup and Restore

### Per-Tenant Backup

**Backup single tenant schema**:
```bash
# Export tenant schema to SQL file
pg_dump $DATABASE_URL \
  --schema=tenant_550e8400-e29b-41d4-a716-446655440000 \
  --file=backups/tenant_acme_2025-10-20.sql
```

**Backup with data**:
```bash
pg_dump $DATABASE_URL \
  --schema=tenant_550e8400-e29b-41d4-a716-446655440000 \
  --data-only \
  --file=backups/tenant_acme_data_2025-10-20.sql
```

### Per-Tenant Restore

**Restore tenant schema**:
```bash
psql $DATABASE_URL -f backups/tenant_acme_2025-10-20.sql
```

**Clone tenant schema** (for testing/staging):
```javascript
// Clone production tenant to staging
await prisma.$executeRawUnsafe(
  `SELECT clone_tenant_schema(
    '550e8400-e29b-41d4-a716-446655440000'::UUID,  -- source (production)
    '660e8400-e29b-41d4-a716-446655440001'::UUID   -- destination (staging)
  )`
);
// Returns: 'tenant_660e8400-e29b-41d4-a716-446655440001'
```

### Automated Backup Strategy

**Daily backups** (recommended):
```javascript
// Schedule daily at 2 AM UTC
cron.schedule('0 2 * * *', async () => {
  const tenants = await prisma.tenant.findMany({
    where: {
      deletedAt: null,
      isActive: true
    }
  });

  for (const tenant of tenants) {
    const filename = `backups/tenant_${tenant.slug}_${dateStr}.sql`;

    await execAsync(
      `pg_dump $DATABASE_URL --schema=${tenant.schemaName} --file=${filename}`
    );

    // Upload to S3 for redundancy
    await s3.upload(filename, `capliquify-backups/${filename}`);
  }
});
```

---

## Troubleshooting

### Issue: Tenant schema not created

**Symptoms**: Tenant record exists but schema missing

**Diagnosis**:
```sql
SELECT * FROM list_tenant_schemas();
-- Check if schema exists

SELECT id, slug, schema_name FROM public.tenants WHERE slug = 'acme-manufacturing';
-- Verify tenant record
```

**Solution**:
```javascript
// Re-run schema creation
const tenant = await prisma.tenant.findUnique({ where: { slug: 'acme-manufacturing' } });

await prisma.$executeRawUnsafe(
  `SELECT create_tenant_schema('${tenant.id}'::UUID)`
);
```

---

### Issue: Tenant over quota limits

**Symptoms**: 413 Payload Too Large or quota exceeded errors

**Diagnosis**:
```javascript
const tenant = await prisma.tenant.findUnique({
  where: { id: tenantId },
  include: {
    usageMetrics: {
      orderBy: { periodEnd: 'desc' },
      take: 1
    }
  }
});

console.log('Current Usage:', tenant.usageMetrics[0]);
console.log('Limits:', {
  maxUsers: tenant.maxUsers,
  maxEntities: tenant.maxEntities,
  maxStorage: tenant.maxStorage
});
```

**Solution**:
```javascript
// Option 1: Upgrade subscription tier
await prisma.tenant.update({
  where: { id: tenantId },
  data: {
    subscriptionTier: 'ENTERPRISE',
    maxEntities: 999999
  }
});

// Option 2: Notify customer to clean up data
await sendEmail(tenant.billingEmail, {
  subject: 'CapLiquify: Storage Limit Exceeded',
  body: `You are currently using ${usedMb} MB of ${tenant.maxStorage} MB...`
});
```

---

### Issue: Tenant schema orphaned (record deleted but schema exists)

**Symptoms**: Schema exists without corresponding tenant record

**Diagnosis**:
```sql
-- Find orphaned schemas
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name LIKE 'tenant_%'
AND schema_name NOT IN (
  SELECT schema_name FROM public.tenants
);
```

**Solution**:
```sql
-- Delete orphaned schemas (DANGEROUS!)
SELECT delete_tenant_schema('550e8400-e29b-41d4-a716-446655440000'::UUID);
```

---

## Related Documentation

- [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md) - Multi-tenant architecture overview
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Development best practices
- [Prisma Schema](../prisma/schema-multitenant.prisma) - Complete data model

---

**Epic**: BMAD-MULTITENANT-001
**Author**: Claude (BMAD Agent)
**Status**: Production-Ready
**Last Updated**: 2025-10-20
