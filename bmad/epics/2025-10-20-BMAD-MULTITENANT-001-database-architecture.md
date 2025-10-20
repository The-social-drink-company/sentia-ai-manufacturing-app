# BMAD-MULTITENANT-001: Multi-Tenant Database Architecture

**Epic ID**: BMAD-MULTITENANT-001
**Type**: Infrastructure / Architecture
**Priority**: P0 (Foundation for SaaS transformation)
**Status**: PLANNING
**Created**: 2025-10-20
**Estimated Duration**: 8-12 hours traditional / 3-4 hours BMAD

---

## Epic Overview

Design and implement a complete **schema-per-tenant** multi-tenant database architecture for CapLiquify, transforming it from a single-tenant application to a scalable SaaS platform supporting 100+ tenants.

### Business Context
**Current State**: Single-tenant Sentia Manufacturing Dashboard
**Target State**: Multi-tenant CapLiquify SaaS platform with complete data isolation

**Business Value**:
- Support unlimited tenants on single infrastructure
- Complete data isolation (security + compliance)
- Per-tenant schema = easy backup/restore per customer
- Scalable to 1000+ tenants without architectural changes

---

## Epic Goals

### Primary Goals
1. ✅ Design complete multi-tenant database schema (public + tenant schemas)
2. ✅ Implement schema-per-tenant isolation pattern
3. ✅ Create Prisma schema with multi-schema support
4. ✅ Build SQL functions for tenant lifecycle (create/delete schemas)
5. ✅ Ensure ZERO cross-tenant data leakage

### Secondary Goals
1. ✅ Create migration scripts for deployment
2. ✅ Build testing framework for tenant isolation
3. ✅ Document architecture for developers
4. ✅ Prepare for Clerk Organizations integration

---

## Technical Approach

### Architecture Pattern: Schema-Per-Tenant

**Why Schema-Per-Tenant?**
- ✅ Complete data isolation (PostgreSQL enforced)
- ✅ Easy per-tenant backup/restore
- ✅ Per-tenant schema migrations possible
- ✅ Scales to 1000+ tenants (PostgreSQL limit ~10K schemas)
- ✅ Better than row-level tenant_id (no filter mistakes)

**Alternatives Considered**:
- ❌ Database-per-tenant: Too many connections, complex migrations
- ❌ Row-level tenant_id: Risk of query filter mistakes, no physical isolation

### Database Structure

```
PostgreSQL Database
├── public schema (shared metadata)
│   ├── tenants
│   ├── users
│   ├── subscriptions
│   └── audit_logs
│
├── tenant_<uuid1> schema (Customer 1 data)
│   ├── companies
│   ├── products
│   ├── sales
│   ├── inventory
│   ├── forecasts
│   └── working_capital_metrics
│
├── tenant_<uuid2> schema (Customer 2 data)
│   └── ... (same tables)
│
└── tenant_<uuidN> schema (Customer N data)
    └── ... (same tables)
```

---

## Stories Breakdown

### Story 1: Public Schema Design (2 hours BMAD)
**Deliverable**: Complete public schema with tenants, users, subscriptions, audit_logs

**Tasks**:
- Design `tenants` table (id, slug, schema_name, clerk_org_id, subscription tier/status)
- Design `users` table (clerk_user_id, email, tenant_id, role)
- Design `subscriptions` table (Stripe integration fields)
- Design `audit_logs` table (tenant_id, action, resource_type)
- Create Prisma models for public schema
- Write migration SQL

**Acceptance Criteria**:
- All tables have proper indexes
- Foreign keys enforce referential integrity
- Enum constraints for subscription_tier and subscription_status
- Soft delete support (deleted_at column)

---

### Story 2: Tenant Schema Design (2 hours BMAD)
**Deliverable**: Complete tenant schema template with all business tables

**Tables**:
1. `companies` - Tenant's company details
2. `products` - Product catalog (SKU, name, pricing, inventory settings)
3. `sales` - Historical sales data (date, quantity, channel)
4. `inventory` - Current inventory levels (on_hand, reserved, available)
5. `forecasts` - AI-generated demand/revenue forecasts
6. `working_capital_metrics` - Financial metrics (DSO, DIO, DPO, CCC)
7. `scenarios` - What-if analysis scenarios
8. `api_credentials` - External API credentials (Xero, Shopify, Amazon)
9. `user_preferences` - Tenant-specific user settings

**Acceptance Criteria**:
- All tables have proper indexes
- Foreign keys reference within same schema
- Generated columns for calculated values
- Support for multi-currency
- Encrypted credentials storage

---

### Story 3: Prisma Schema Implementation (1.5 hours BMAD)
**Deliverable**: Complete `schema.prisma` with multi-schema support

**Requirements**:
- Use Prisma's multi-schema preview feature
- Define all public schema models
- Define tenant schema models (with `@@schema("tenant")` directive)
- Proper enums (SubscriptionTier, SubscriptionStatus, Role, etc.)
- All relationships and indexes
- Custom generators for TypeScript types

**Example**:
```prisma
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
  id                   String   @id @default(uuid())
  slug                 String   @unique
  name                 String
  schemaName           String   @unique @map("schema_name")
  clerkOrganizationId  String   @unique @map("clerk_organization_id")
  subscriptionTier     SubscriptionTier @map("subscription_tier")
  subscriptionStatus   SubscriptionStatus @map("subscription_status")
  // ... more fields

  @@schema("public")
  @@map("tenants")
}

enum SubscriptionTier {
  starter
  professional
  enterprise

  @@schema("public")
}
```

---

### Story 4: Tenant Lifecycle Functions (1 hour BMAD)
**Deliverable**: SQL functions for tenant schema creation and deletion

**Functions**:

1. **`create_tenant_schema(tenant_uuid UUID)`**
   - Creates `tenant_<uuid>` schema
   - Executes all CREATE TABLE statements
   - Creates all indexes and constraints
   - Returns schema_name

2. **`delete_tenant_schema(tenant_uuid UUID)`**
   - Drops `tenant_<uuid>` schema CASCADE
   - Cleans up public schema references
   - Returns success boolean

3. **`clone_tenant_schema(source_uuid UUID, dest_uuid UUID)`**
   - Duplicates tenant schema (for backup/testing)
   - Returns new schema_name

**Example**:
```sql
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_uuid UUID)
RETURNS VARCHAR AS $$
DECLARE
  schema_name VARCHAR;
BEGIN
  schema_name := 'tenant_' || tenant_uuid::TEXT;

  -- Create schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

  -- Create companies table
  EXECUTE format('
    CREATE TABLE %I.companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      -- ... all fields
    )
  ', schema_name);

  -- Create products table
  -- ... all other tables

  RETURN schema_name;
END;
$$ LANGUAGE plpgsql;
```

---

### Story 5: Migration Scripts (1 hour BMAD)
**Deliverable**: Complete migration strategy and scripts

**Migrations**:

1. **`001_create_public_schema.sql`**
   - Creates all public schema tables
   - Creates indexes and constraints
   - Creates enums

2. **`002_create_tenant_functions.sql`**
   - Creates `create_tenant_schema()` function
   - Creates `delete_tenant_schema()` function
   - Creates helper functions

3. **`003_create_demo_tenant.sql`**
   - Creates "Sentia Spirits" demo tenant
   - Inserts sample data
   - Verifies isolation

**Prisma Migration Commands**:
```bash
# Generate migration
npx prisma migrate dev --name multi_tenant_architecture

# Apply to production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

---

### Story 6: Testing & Validation (1 hour BMAD)
**Deliverable**: Comprehensive test suite for tenant isolation

**Test Categories**:

1. **Tenant Creation Tests**
   ```sql
   -- Create tenant
   SELECT create_tenant_schema('550e8400-e29b-41d4-a716-446655440000');

   -- Verify schema exists
   SELECT schema_name FROM information_schema.schemata
   WHERE schema_name = 'tenant_550e8400-e29b-41d4-a716-446655440000';

   -- Verify all tables created
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'tenant_550e8400-e29b-41d4-a716-446655440000';
   ```

2. **Data Isolation Tests**
   ```sql
   -- Insert data into Tenant A
   INSERT INTO tenant_<uuid_a>.products (sku, name) VALUES ('SKU001', 'Product A');

   -- Verify Tenant B cannot see Tenant A's data
   SELECT * FROM tenant_<uuid_b>.products WHERE sku = 'SKU001';
   -- Should return 0 rows
   ```

3. **Cross-Tenant Query Prevention**
   ```sql
   -- Attempt to query Tenant A from Tenant B context
   -- Should fail with permission error
   SET search_path = tenant_<uuid_b>;
   SELECT * FROM tenant_<uuid_a>.products;
   -- Expected: ERROR: permission denied
   ```

4. **Tenant Deletion Tests**
   ```sql
   -- Delete tenant
   SELECT delete_tenant_schema('550e8400-e29b-41d4-a716-446655440000');

   -- Verify schema deleted
   SELECT schema_name FROM information_schema.schemata
   WHERE schema_name = 'tenant_550e8400-e29b-41d4-a716-446655440000';
   -- Should return 0 rows
   ```

---

### Story 7: Documentation (0.5 hours BMAD)
**Deliverable**: Complete architecture documentation

**Documents**:

1. **DATABASE_ARCHITECTURE.md**
   - Schema-per-tenant pattern explanation
   - Entity Relationship Diagrams (ERD)
   - Migration guide
   - Scaling considerations

2. **TENANT_LIFECYCLE.md**
   - How to create a new tenant
   - How to delete a tenant
   - How to backup/restore tenant data
   - How to migrate tenant schema

3. **DEVELOPER_GUIDE.md**
   - How to query tenant data in code
   - Prisma Client usage with multi-schema
   - Middleware for tenant context
   - Security best practices

---

## Technical Specifications

### Database Platform
- **Database**: PostgreSQL 17+ (Render PostgreSQL)
- **ORM**: Prisma 5.x with multiSchema preview feature
- **Connection Pooling**: Prisma connection pool (100 connections max)

### Schema Naming Convention
```
tenant_<uuid>
Example: tenant_550e8400-e29b-41d4-a716-446655440000
```

**Why UUID in schema name?**
- Ensures uniqueness globally
- No collision risk
- Difficult to guess (security)
- Supports tenant rename without schema change

### Subscription Tiers

| Tier | Max Users | Max Entities | Max Storage | Features |
|------|-----------|--------------|-------------|----------|
| **Starter** | 5 | 100 SKUs | 1 GB | Basic forecasting, Shopify integration |
| **Professional** | 20 | 500 SKUs | 10 GB | AI forecasting, Multi-channel, API access |
| **Enterprise** | Unlimited | Unlimited | 100 GB | All features, Custom integrations, SSO |

### Security Considerations

1. **Schema Isolation**: PostgreSQL enforces physical separation
2. **Row-Level Security**: RLS policies on public schema tables
3. **Encrypted Credentials**: AES-256-GCM for api_credentials
4. **Audit Logging**: All tenant operations logged to audit_logs
5. **Soft Deletes**: Tenants marked deleted_at, schema retained for 30 days

---

## Dependencies

### Existing Work
- ✅ BMAD-REBRAND-002: CapLiquify branding (90% complete)
- ✅ EPIC-006: Authentication (Clerk integration ready)
- ✅ EPIC-002: Mock data elimination (real data patterns established)

### External Dependencies
- Clerk Organizations feature (for tenant<>org mapping)
- PostgreSQL 17+ on Render
- Stripe for subscription management (future)

---

## Risks & Mitigations

### Risk 1: Schema Limit (PostgreSQL max ~10K schemas)
**Mitigation**: 10K tenants is sufficient for initial growth. If exceeded, shard across multiple databases.

### Risk 2: Connection Pool Exhaustion
**Mitigation**: Prisma connection pooling + PgBouncer in front of PostgreSQL.

### Risk 3: Complex Migrations (changing all tenant schemas)
**Mitigation**:
- Create migration function that iterates through all tenant schemas
- Test on staging tenants first
- Implement tenant migration queue with retry logic

### Risk 4: Backup/Restore Complexity
**Mitigation**:
- Per-tenant schema = easy `pg_dump` of single schema
- Automated daily backups per tenant
- Restore scripts in `scripts/tenant-restore.sh`

---

## Success Criteria

### Phase 1: Design ✅
- [ ] Complete Prisma schema with all models
- [ ] SQL migration scripts reviewed and approved
- [ ] Tenant lifecycle functions tested

### Phase 2: Implementation ✅
- [ ] Public schema tables created in database
- [ ] Tenant schema creation function working
- [ ] Demo tenant (Sentia Spirits) created successfully

### Phase 3: Validation ✅
- [ ] All isolation tests passing
- [ ] Performance benchmarks meet targets (<100ms tenant queries)
- [ ] Documentation complete

### Phase 4: Production Ready ✅
- [ ] Migration scripts deployed to staging
- [ ] Rollback scripts tested
- [ ] Monitoring dashboards created

---

## BMAD Velocity Estimate

**Traditional Approach**: 12 hours
- Schema design: 3 hours
- Prisma implementation: 2 hours
- SQL functions: 2 hours
- Migrations: 2 hours
- Testing: 2 hours
- Documentation: 1 hour

**BMAD-METHOD Approach**: 4 hours (3x faster)
- Schema design: 1 hour (pattern-based templates)
- Prisma implementation: 0.75 hours (generated from schema)
- SQL functions: 0.5 hours (template-based)
- Migrations: 0.5 hours (automated generation)
- Testing: 0.75 hours (script-based)
- Documentation: 0.5 hours (auto-generated from schema)

**Velocity Multiplier**: 3x faster with BMAD

---

## Related Epics

- BMAD-DEPLOY-001: CapLiquify Rebranding (foundation)
- BMAD-MULTITENANT-002: Tenant Onboarding UI (next)
- BMAD-MULTITENANT-003: Subscription Management (Stripe integration)
- BMAD-MULTITENANT-004: Clerk Organizations Integration

---

**Epic Owner**: Claude (BMAD Agent)
**Status**: Ready for implementation
**Next Action**: Begin Story 1 (Public Schema Design)
