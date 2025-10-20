# CapLiquify Database Architecture

**Multi-Tenant SaaS Platform - Schema-Per-Tenant Isolation**

**Epic**: BMAD-MULTITENANT-001
**Created**: 2025-10-20
**Version**: 1.0
**Status**: Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Database Structure](#database-structure)
4. [Public Schema](#public-schema)
5. [Tenant Schema](#tenant-schema)
6. [Entity Relationship Diagrams](#entity-relationship-diagrams)
7. [Scaling Considerations](#scaling-considerations)
8. [Migration Guide](#migration-guide)
9. [Performance Optimization](#performance-optimization)
10. [Security Best Practices](#security-best-practices)

---

## Overview

CapLiquify uses a **schema-per-tenant** multi-tenant architecture to provide complete data isolation for each customer. This approach ensures:

- **Physical Isolation**: PostgreSQL enforces separation at the schema level
- **Security**: Zero risk of cross-tenant data leakage
- **Scalability**: Support for 1000+ tenants without architectural changes
- **Per-Tenant Operations**: Easy backup/restore, migrations, and schema customization
- **Compliance**: GDPR/SOC2 compliant data separation

### Key Statistics

- **Database Platform**: PostgreSQL 17+ (Render PostgreSQL)
- **ORM**: Prisma 5.x with multiSchema preview feature
- **Schema Limit**: ~10,000 schemas per PostgreSQL instance
- **Subscription Tiers**: Starter, Professional, Enterprise
- **Authentication**: Clerk Organizations integration

---

## Architecture Pattern

### Schema-Per-Tenant Isolation

CapLiquify implements **schema-per-tenant** architecture where each customer gets their own PostgreSQL schema containing all business tables.

```
PostgreSQL Database
├── public schema (shared metadata)
│   ├── tenants
│   ├── users
│   ├── subscriptions
│   ├── audit_logs
│   └── usage_metrics
│
├── tenant_550e8400... (Customer 1)
│   ├── companies
│   ├── products
│   ├── sales
│   ├── inventory
│   ├── forecasts
│   └── working_capital_metrics
│
├── tenant_660e8400... (Customer 2)
│   └── ... (same tables)
│
└── tenant_N... (Customer N)
    └── ... (same tables)
```

### Why Schema-Per-Tenant?

| Pattern | Pros | Cons | Verdict |
|---------|------|------|---------|
| **Database-per-tenant** | ✅ Complete isolation<br>✅ Per-tenant scaling | ❌ Connection limits<br>❌ Complex migrations<br>❌ High cost | ❌ Too complex |
| **Schema-per-tenant** | ✅ Physical isolation<br>✅ Easy backup/restore<br>✅ Scales to 10K tenants<br>✅ Shared connection pool | ⚠️ Migration coordination | ✅ **CHOSEN** |
| **Row-level tenant_id** | ✅ Simple schema<br>✅ Easy queries | ❌ Risk of query filter mistakes<br>❌ No physical isolation<br>❌ Complex RLS policies | ❌ Too risky |

**Decision**: Schema-per-tenant provides the best balance of isolation, security, and operational simplicity.

---

## Database Structure

### Naming Conventions

**Tenant Schema Names**:
```
tenant_<uuid>
Example: tenant_550e8400-e29b-41d4-a716-446655440000
```

**Why UUID in schema name?**
- ✅ Globally unique (no collision risk)
- ✅ Difficult to guess (security through obscurity)
- ✅ Supports tenant rename without schema change
- ✅ URL-safe and PostgreSQL-safe

**Table Naming**:
- Snake_case: `working_capital_metrics`, `audit_logs`
- Plural nouns: `tenants`, `users`, `products`
- Descriptive: `days_sales_outstanding`, `cash_conversion_cycle`

---

## Public Schema

The `public` schema contains shared metadata for the multi-tenant platform.

### Tables

#### 1. tenants

**Purpose**: Master registry of all customer organizations

**Key Fields**:
```sql
id UUID PRIMARY KEY
slug VARCHAR(100) UNIQUE          -- URL-friendly (e.g., "acme-corp")
name VARCHAR(255)                 -- Display name
schema_name VARCHAR(100) UNIQUE   -- PostgreSQL schema name
clerk_organization_id VARCHAR(255) UNIQUE -- Clerk integration

subscription_tier ENUM            -- STARTER, PROFESSIONAL, ENTERPRISE
subscription_status ENUM          -- TRIAL, ACTIVE, PAST_DUE, CANCELLED, SUSPENDED

max_users INT                     -- Tier limit
max_entities INT                  -- SKU/product limit
max_storage INT                   -- MB limit

features JSONB                    -- Feature flags
settings JSONB                    -- Timezone, currency, locale

created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP              -- Soft delete
```

**Indexes**:
- `idx_tenants_slug` - Fast tenant lookup by URL slug
- `idx_tenants_clerk_org` - Clerk Organizations integration
- `idx_tenants_status` - Filter by subscription status
- `idx_tenants_active` - Active tenants only

**Business Rules**:
- Slug must be 3+ characters, URL-safe
- Schema name must be `tenant_<uuid>` format
- Soft delete (deleted_at) - schemas retained for 30 days

---

#### 2. users

**Purpose**: User authentication and role management

**Key Fields**:
```sql
id UUID PRIMARY KEY
clerk_user_id VARCHAR(255) UNIQUE -- Clerk integration
email VARCHAR(255)
tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE
role ENUM                          -- OWNER, ADMIN, MEMBER, VIEWER

is_active BOOLEAN
is_verified BOOLEAN
last_login_at TIMESTAMP
```

**Roles**:
| Role | Permissions |
|------|-------------|
| **OWNER** | Full admin + billing access |
| **ADMIN** | Full operational access, no billing |
| **MEMBER** | Standard user access |
| **VIEWER** | Read-only access |

**Indexes**:
- `idx_users_tenant` - Fast user lookup by tenant
- `idx_users_clerk` - Clerk integration
- `idx_users_email` - Email search
- `idx_users_role` - Role-based filtering

---

#### 3. subscriptions

**Purpose**: Billing and subscription management

**Key Fields**:
```sql
id UUID PRIMARY KEY
tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE
subscription_tier ENUM
status ENUM
billing_cycle ENUM                -- MONTHLY, QUARTERLY, ANNUAL

stripe_subscription_id VARCHAR(255)
stripe_price_id VARCHAR(255)

current_period_start TIMESTAMP
current_period_end TIMESTAMP
trial_end TIMESTAMP
cancel_at TIMESTAMP
```

**Subscription Tiers**:

| Tier | Max Users | Max SKUs | Max Storage | Monthly Price |
|------|-----------|----------|-------------|---------------|
| **Starter** | 5 | 100 | 1 GB | $49 |
| **Professional** | 20 | 500 | 10 GB | $199 |
| **Enterprise** | Unlimited | Unlimited | 100 GB | Custom |

---

#### 4. audit_logs

**Purpose**: System-wide audit trail for compliance and debugging

**Key Fields**:
```sql
id UUID PRIMARY KEY
tenant_id UUID
user_id UUID
action VARCHAR(100)               -- "CREATE_TENANT", "DELETE_SCHEMA", etc.
resource_type VARCHAR(100)        -- "tenant", "user", "forecast"
resource_id UUID

severity ENUM                     -- INFO, WARNING, ERROR, CRITICAL
changes JSONB                     -- Before/after values
metadata JSONB

ip_address INET
user_agent TEXT
success BOOLEAN
error_message TEXT

created_at TIMESTAMP
```

**Example Actions**:
- `user.login`, `user.logout`, `user.failed_login`
- `tenant.created`, `tenant.suspended`, `tenant.deleted`
- `forecast.generated`, `report.exported`, `api.connected`
- `schema.created`, `schema.migrated`, `schema.deleted`

---

#### 5. usage_metrics

**Purpose**: Quota tracking and billing metrics

**Key Fields**:
```sql
id UUID PRIMARY KEY
tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE

period_start TIMESTAMP
period_end TIMESTAMP

active_users_count INT
total_entities_count INT
storage_used_mb INT

api_requests_count BIGINT
api_errors_count BIGINT

forecasts_generated INT
reports_exported INT
integrations_synced INT
```

**Usage**:
- Track tenant resource consumption
- Enforce tier limits
- Generate usage-based billing data
- Performance monitoring

---

## Tenant Schema

Each tenant schema contains identical tables for business data.

### Tables

#### 1. companies

**Purpose**: Tenant's company/business unit details

**Key Fields**:
```sql
id UUID PRIMARY KEY
name VARCHAR(255)
legal_name VARCHAR(255)
registration_number VARCHAR(100)
tax_id VARCHAR(100)
industry VARCHAR(100)
primary_currency VARCHAR(3)       -- GBP, USD, EUR
fiscal_year_start VARCHAR(5)      -- MM-DD format
timezone VARCHAR(50)
```

---

#### 2. products

**Purpose**: Product catalog (SKUs)

**Key Fields**:
```sql
id UUID PRIMARY KEY
company_id UUID REFERENCES companies(id)
sku VARCHAR(100) UNIQUE
name VARCHAR(255)
category VARCHAR(100)
unit_cost DECIMAL(15, 2)
unit_price DECIMAL(15, 2)

reorder_point INT
reorder_quantity INT
lead_time_days INT
safety_stock INT

is_active BOOLEAN
```

**Indexes**:
- `idx_products_company` - Fast product lookup by company
- `idx_products_sku` - SKU search (unique within tenant)

---

#### 3. sales

**Purpose**: Historical sales data (multi-channel)

**Key Fields**:
```sql
id UUID PRIMARY KEY
company_id UUID
product_id UUID
sale_date DATE
quantity INT
unit_price DECIMAL(15, 2)
total_amount DECIMAL(15, 2)

channel VARCHAR(50)               -- "amazon_uk", "shopify_uk", etc.
channel_order_id VARCHAR(255)

commission_rate DECIMAL(5, 4)
commission_amount DECIMAL(15, 2)
net_revenue DECIMAL(15, 2)        -- total_amount - commission_amount

market VARCHAR(10)                -- "UK", "EU", "USA"
```

**Channels**:
- Shopify UK, Shopify EU, Shopify USA
- Amazon UK, Amazon USA
- Direct sales
- Wholesale

---

#### 4. inventory

**Purpose**: Real-time inventory levels (multi-location)

**Key Fields**:
```sql
id UUID PRIMARY KEY
company_id UUID
product_id UUID

quantity_on_hand INT
quantity_reserved INT
quantity_available INT            -- GENERATED: on_hand - reserved

location VARCHAR(100)             -- "warehouse_uk", "fba_usa"

last_counted_at TIMESTAMP
last_received_at TIMESTAMP
```

**Unique Constraint**: `(product_id, location)` - one record per SKU per location

---

#### 5. forecasts

**Purpose**: AI-generated demand/revenue forecasts

**Key Fields**:
```sql
id UUID PRIMARY KEY
company_id UUID
product_id UUID

forecast_date DATE
forecast_type ENUM                -- DEMAND, REVENUE, CASH_FLOW
period_type ENUM                  -- DAILY, WEEKLY, MONTHLY

model_type VARCHAR(50)            -- "arima", "lstm", "prophet", "ensemble"
model_version VARCHAR(50)

predicted_value DECIMAL(15, 2)
lower_bound DECIMAL(15, 2)
upper_bound DECIMAL(15, 2)
confidence_level DECIMAL(5, 4)    -- 0.95 for 95% confidence

actual_value DECIMAL(15, 2)       -- For accuracy tracking
accuracy_percentage DECIMAL(5, 2)
```

**Forecast Types**:
- **DEMAND**: Unit quantity predictions
- **REVENUE**: Financial value predictions
- **CASH_FLOW**: Working capital predictions

---

#### 6. working_capital_metrics

**Purpose**: Financial metrics and cash conversion cycle

**Key Fields**:
```sql
id UUID PRIMARY KEY
company_id UUID
period_date DATE
period_type ENUM                  -- DAILY, WEEKLY, MONTHLY

-- Current Assets
cash DECIMAL(15, 2)
accounts_receivable DECIMAL(15, 2)
inventory DECIMAL(15, 2)

-- Current Liabilities
accounts_payable DECIMAL(15, 2)
short_term_debt DECIMAL(15, 2)

-- Calculated Metrics (GENERATED columns)
working_capital DECIMAL(15, 2)   -- CA - CL
current_ratio DECIMAL(10, 4)     -- CA / CL
quick_ratio DECIMAL(10, 4)       -- (CA - Inventory) / CL

-- Cash Conversion Cycle
days_sales_outstanding DECIMAL(10, 2)    -- DSO
days_inventory_outstanding DECIMAL(10, 2) -- DIO
days_payables_outstanding DECIMAL(10, 2)  -- DPO
cash_conversion_cycle DECIMAL(10, 2)      -- DSO + DIO - DPO
```

**Formulas**:
```
DSO = (Accounts Receivable / Revenue) × Days
DIO = (Inventory / COGS) × Days
DPO = (Accounts Payable / COGS) × Days
CCC = DSO + DIO - DPO
```

---

#### 7. scenarios

**Purpose**: What-if analysis and optimization scenarios

**Key Fields**:
```sql
id UUID PRIMARY KEY
company_id UUID
name VARCHAR(255)
description TEXT
scenario_type ENUM                -- WHAT_IF, OPTIMIZATION, SENSITIVITY

parameters JSONB                  -- Scenario inputs
results JSONB                     -- Calculated outputs

baseline_scenario_id UUID
impact_summary JSONB              -- Comparison to baseline

created_by UUID                   -- public.users.id
```

**Example Scenarios**:
- "Increase prices by 10%"
- "Reduce lead time to 14 days"
- "Optimize reorder points"

---

#### 8. api_credentials

**Purpose**: External API credentials (encrypted)

**Key Fields**:
```sql
id UUID PRIMARY KEY
company_id UUID
service_name VARCHAR(100)         -- "xero", "shopify_uk", "amazon_sp_api"
service_type VARCHAR(50)          -- "accounting", "ecommerce", "erp"

credentials_encrypted TEXT        -- AES-256-GCM encrypted JSON
access_token_encrypted TEXT
refresh_token_encrypted TEXT
token_expires_at TIMESTAMP

is_active BOOLEAN
last_sync_at TIMESTAMP
last_sync_status VARCHAR(50)      -- SUCCESS, FAILURE, PENDING
```

**Security**: All credentials encrypted at rest using PostgreSQL pgcrypto extension

---

#### 9. user_preferences

**Purpose**: Tenant-specific user settings

**Key Fields**:
```sql
id UUID PRIMARY KEY
user_id UUID                      -- public.users.id
company_id UUID

dashboard_layout JSONB
widget_preferences JSONB

theme VARCHAR(20)                 -- light, dark, auto
locale VARCHAR(10)
timezone VARCHAR(50)

email_notifications JSONB
push_notifications JSONB
```

---

## Entity Relationship Diagrams

### Public Schema ERD

```
┌─────────────┐
│   tenants   │
├─────────────┤
│ id (PK)     │
│ slug        │◄──────┐
│ schema_name │       │
│ clerk_org_id│       │
└─────────────┘       │
       │              │
       │ 1:N          │
       ▼              │
┌─────────────┐       │
│    users    │       │
├─────────────┤       │
│ id (PK)     │       │
│ tenant_id   │───────┘
│ email       │
│ role        │
└─────────────┘
       │
       │ 1:N
       ▼
┌─────────────────┐
│  audit_logs     │
├─────────────────┤
│ id (PK)         │
│ tenant_id (FK)  │
│ user_id (FK)    │
│ action          │
└─────────────────┘

       ┌─────────────┐
       │   tenants   │
       └─────────────┘
              │
              │ 1:1
              ▼
       ┌─────────────────┐
       │ subscriptions   │
       ├─────────────────┤
       │ id (PK)         │
       │ tenant_id (FK)  │
       │ stripe_sub_id   │
       │ status          │
       └─────────────────┘
```

### Tenant Schema ERD

```
┌─────────────┐
│  companies  │
├─────────────┤
│ id (PK)     │
│ name        │
│ currency    │
└─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐       ┌─────────────┐
│  products   │       │    sales    │
├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ product_id  │
│ company_id  │       │ quantity    │
│ sku         │       │ channel     │
│ unit_cost   │       └─────────────┘
└─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐       ┌─────────────┐
│  inventory  │       │  forecasts  │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ product_id  │       │ product_id  │
│ qty_on_hand │       │ predicted   │
│ location    │       │ model_type  │
└─────────────┘       └─────────────┘
```

---

## Scaling Considerations

### Tenant Limits

**PostgreSQL Schema Limit**: ~10,000 schemas per instance

**Scaling Strategy**:
1. **0-1,000 tenants**: Single PostgreSQL instance
2. **1,000-10,000 tenants**: Vertical scaling (larger instance)
3. **10,000+ tenants**: Horizontal sharding across multiple databases

### Connection Pooling

**Challenge**: Each PostgreSQL connection can access multiple schemas, but connection limits exist

**Solution**:
- **Prisma Connection Pooling**: 100 connections max
- **PgBouncer**: Transaction-level pooling in front of PostgreSQL
- **Connection String**: `DATABASE_URL` with `connection_limit=10` per service

### Migration Coordination

**Challenge**: Updating 1,000+ tenant schemas with new migrations

**Solution**:
```javascript
// Iterate through all tenant schemas
const tenants = await prisma.tenant.findMany();

for (const tenant of tenants) {
  await runMigrationOnSchema(tenant.schemaName);
}
```

**Best Practices**:
- Test migrations on staging tenants first
- Implement tenant migration queue with retry logic
- Monitor migration progress with usage_metrics
- Rollback capability per tenant

---

## Migration Guide

### Creating the Database

**Step 1**: Run Public Schema Migration
```bash
psql $DATABASE_URL -f prisma/migrations/001_create_public_schema.sql
```

**Step 2**: Run Tenant Lifecycle Functions
```bash
psql $DATABASE_URL -f prisma/migrations/tenant_lifecycle_functions.sql
```

**Step 3**: Generate Prisma Client
```bash
npx prisma generate --schema=prisma/schema-multitenant.prisma
```

### Creating a New Tenant

**Step 1**: Insert tenant record
```javascript
const tenant = await prisma.tenant.create({
  data: {
    slug: 'acme-corp',
    name: 'ACME Corporation',
    clerkOrganizationId: 'org_clerk_acme123',
    subscriptionTier: 'PROFESSIONAL',
    subscriptionStatus: 'TRIAL'
  }
});
```

**Step 2**: Create tenant schema
```javascript
await prisma.$executeRaw`SELECT create_tenant_schema(${tenant.id}::UUID)`;
```

**Step 3**: Verify schema created
```bash
SELECT * FROM list_tenant_schemas();
```

### Deleting a Tenant

**Step 1**: Soft delete tenant (retain schema for 30 days)
```javascript
await prisma.tenant.update({
  where: { id: tenantId },
  data: { deletedAt: new Date() }
});
```

**Step 2**: Hard delete schema (after 30 days)
```javascript
await prisma.$executeRaw`SELECT delete_tenant_schema(${tenantId}::UUID)`;
```

**Step 3**: Permanently delete tenant record
```javascript
await prisma.tenant.delete({ where: { id: tenantId } });
```

---

## Performance Optimization

### Indexing Strategy

**Public Schema**:
- All foreign keys indexed
- Frequently filtered columns (subscription_status, is_active, deleted_at)
- Unique constraints on slugs and external IDs

**Tenant Schema**:
- All foreign keys indexed
- SKU search (products.sku)
- Date range queries (sales.sale_date, forecasts.forecast_date)
- Channel filtering (sales.channel)

### Query Optimization

**Use Connection Search Path**:
```javascript
// Set search path to tenant schema for queries
await prisma.$executeRaw`SET search_path TO ${schemaName}, public`;

// Now queries default to tenant schema
const products = await prisma.product.findMany();
```

**Avoid Cross-Tenant Queries**:
```javascript
// BAD: Joins across tenant schemas
SELECT * FROM tenant_a.products
JOIN tenant_b.sales ON ...

// GOOD: Query within single tenant
SELECT * FROM tenant_a.products
JOIN tenant_a.sales ON ...
```

---

## Security Best Practices

### 1. Schema Isolation

**PostgreSQL enforces physical separation** - no cross-tenant queries possible without explicit schema qualification.

### 2. Row-Level Security (RLS)

Apply RLS policies on public schema tables:
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_tenant_isolation ON public.users
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### 3. Encrypted Credentials

All API credentials encrypted using PostgreSQL pgcrypto:
```sql
SELECT pgp_sym_encrypt('api_key_secret', 'encryption_key');
SELECT pgp_sym_decrypt(credentials_encrypted, 'encryption_key');
```

### 4. Audit Logging

All tenant operations logged to `audit_logs`:
- Tenant creation/deletion
- User role changes
- Schema migrations
- API credential updates

### 5. Soft Deletes

Tenants soft-deleted with `deleted_at` timestamp:
- Schema retained for 30 days (compliance, data recovery)
- Permanent deletion requires manual approval

---

## Related Documentation

- [TENANT_LIFECYCLE.md](TENANT_LIFECYCLE.md) - Tenant management operations
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Development best practices
- [Prisma Schema](../prisma/schema-multitenant.prisma) - Complete data model

---

**Epic**: BMAD-MULTITENANT-001
**Author**: Claude (BMAD Agent)
**Status**: Production-Ready
**Last Updated**: 2025-10-20
