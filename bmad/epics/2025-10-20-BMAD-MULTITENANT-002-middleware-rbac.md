# EPIC: BMAD-MULTITENANT-002 - Tenant Middleware & RBAC System

**Epic ID**: BMAD-MULTITENANT-002
**Created**: 2025-10-20
**Status**: 🚧 In Progress
**Priority**: Critical
**Phase**: Phase 5.2 - Multi-Tenant Middleware
**Estimated Effort**: 16 hours (BMAD) vs 48 hours (traditional) = **3x velocity**

---

## 📋 **EPIC OVERVIEW**

### **Business Context**

CapLiquify's Phase 1 & 2 multi-tenant infrastructure (BMAD-MULTITENANT-001) established the database architecture with schema-per-tenant isolation. **Phase 5.2** completes the multi-tenant foundation by building the middleware layer that:

1. **Identifies tenants** from Clerk organization context
2. **Switches database schemas** automatically per request
3. **Enforces subscription tiers** via feature flags
4. **Controls access** with role-based permissions (RBAC)
5. **Manages tenant lifecycle** (creation, deletion, schema management)

This epic transforms CapLiquify from a single-tenant application to a **production-ready multi-tenant SaaS platform** supporting 100+ isolated tenants.

### **Dependencies**

✅ **Completed**:
- Phase 1: Multi-tenant database architecture (schema-per-tenant)
- Phase 2: Backend framework (tenant metadata tables)
- Clerk authentication integration (EPIC-006)
- Prisma ORM setup

⏳ **Pending** (not blocking):
- Stripe billing integration (Phase 6)
- Master Admin Dashboard (Phase 5.1 - completed but separate)

---

## 🎯 **GOALS & SUCCESS CRITERIA**

### **Primary Goals**

1. ✅ **Tenant Identification**: Extract tenant from Clerk organization ID
2. ✅ **Schema Switching**: Automatic `SET search_path` per request
3. ✅ **Feature Enforcement**: Block features based on subscription tier
4. ✅ **RBAC**: Role hierarchy (owner → admin → member → viewer)
5. ✅ **Tenant Service**: Create/delete tenants with schema provisioning

### **Success Criteria**

- [ ] Middleware authenticates user via Clerk session token
- [ ] Middleware identifies tenant from `X-Organization-ID` header
- [ ] Database queries automatically target tenant-specific schema
- [ ] Feature flags block unauthorized features (e.g., `ai_forecasting` for Starter tier)
- [ ] RBAC middleware enforces role permissions
- [ ] Tenant service creates schemas with all required tables
- [ ] Example API routes demonstrate middleware integration
- [ ] Comprehensive unit tests validate middleware behavior
- [ ] Documentation enables developer onboarding

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **Middleware Flow**

```
┌─────────────────────────────────────────────────────────────┐
│  1. Request arrives with Authorization: Bearer <token>      │
│  2. tenantMiddleware extracts Clerk session token           │
│  3. Verify session with Clerk API                           │
│  4. Get user's active organization from X-Organization-ID   │
│  5. Verify user belongs to organization (Clerk)             │
│  6. Fetch tenant from database (by clerkOrganizationId)     │
│  7. Check subscription status (active/trial/suspended)      │
│  8. Attach tenant + user to req object                      │
│  9. SET search_path TO "tenant_<uuid>", public              │
│ 10. Execute route handler → queries target tenant schema    │
└─────────────────────────────────────────────────────────────┘
```

### **File Structure**

```
server/
├── middleware/
│   ├── tenant.middleware.ts        # Core tenant identification
│   ├── feature.middleware.ts       # Feature flag enforcement
│   └── rbac.middleware.ts          # Role-based access control
├── lib/
│   └── prisma.ts                   # Tenant-aware Prisma client
├── services/
│   └── tenant.service.ts           # Tenant CRUD + schema management
└── routes/
    └── example/
        └── products.routes.ts      # Example tenant-scoped API
```

### **Database Schema** (from Phase 1)

```sql
-- Public schema (shared metadata)
public.tenants (
  id UUID PRIMARY KEY,
  slug VARCHAR(100) UNIQUE,
  schema_name VARCHAR(100) UNIQUE,
  clerk_organization_id VARCHAR(100) UNIQUE,
  subscription_tier VARCHAR(50),  -- starter | professional | enterprise
  subscription_status VARCHAR(50), -- trial | active | suspended | cancelled
  features JSONB,                 -- { ai_forecasting: true, ... }
  max_users INT,
  max_entities INT,
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Tenant schema (per-tenant data)
tenant_<uuid>.companies
tenant_<uuid>.products
tenant_<uuid>.sales
tenant_<uuid>.inventory
tenant_<uuid>.forecasts
tenant_<uuid>.working_capital_metrics
... (9 total tables)
```

---

## 📦 **DELIVERABLES**

### **Phase 1: Core Middleware** (4 hours)

#### **Story 1: Tenant Middleware** (MULTI-TENANT-001) - 2 hours
- [src/middleware/tenant.middleware.ts](../../src/middleware/tenant.middleware.ts)
- Clerk session verification
- Organization membership validation
- Tenant lookup from database
- Subscription status check (active/trial/suspended)
- User auto-creation if missing
- PostgreSQL search_path switching
- Request extensions (req.tenant, req.user)

#### **Story 2: Feature Flag Middleware** (MULTI-TENANT-002) - 1 hour
- [src/middleware/feature.middleware.ts](../../src/middleware/feature.middleware.ts)
- `requireFeature(featureName)` factory function
- Feature availability check against tenant.features
- 403 response with upgrade URL if feature unavailable

#### **Story 3: RBAC Middleware** (MULTI-TENANT-003) - 1 hour
- [src/middleware/rbac.middleware.ts](../../src/middleware/rbac.middleware.ts)
- Role hierarchy: owner (4) > admin (3) > member (2) > viewer (1)
- `requireRole(minRole)` factory function
- 403 response if insufficient permissions

---

### **Phase 2: Database Layer** (3 hours)

#### **Story 4: Tenant-Aware Prisma Client** (MULTI-TENANT-004) - 2 hours
- [src/lib/prisma.ts](../../src/lib/prisma.ts)
- Singleton Prisma client (production vs development)
- `withTenantSchema()` helper for schema-scoped queries
- Error handling with search_path reset
- Connection pooling configuration

#### **Story 5: TypeScript Type Definitions** (MULTI-TENANT-005) - 1 hour
- Express Request extensions (req.tenant, req.user)
- Tenant interface (id, slug, schema_name, features, etc.)
- User interface (id, clerkId, email, role)
- Feature flag types (ai_forecasting, what_if, etc.)
- Role types (owner, admin, member, viewer)

---

### **Phase 3: Tenant Service** (5 hours)

#### **Story 6: Tenant Creation** (MULTI-TENANT-006) - 2 hours
- [src/services/tenant.service.ts](../../src/services/tenant.service.ts)
- `createTenant()` method
  - Generate tenant UUID and schema name
  - Insert into public.tenants
  - Create PostgreSQL schema
  - Provision 9 tenant tables (companies, products, sales, etc.)
  - Create indexes
  - Insert default company record
  - Rollback on failure

#### **Story 7: Tenant Deletion** (MULTI-TENANT-007) - 1 hour
- `deleteTenant()` method
  - Soft delete from public.tenants
  - Drop PostgreSQL schema CASCADE
  - Clean up related users/subscriptions

#### **Story 8: Feature Tier Configuration** (MULTI-TENANT-008) - 2 hours
- `getFeaturesForTier()` method
  - Starter: basic_forecasting only
  - Professional: + ai_forecasting, what_if_analysis, priority_support
  - Enterprise: + multi_entity, api_access, white_label
- `getMaxUsersForTier()` method (5 / 25 / unlimited)
- `getMaxEntitiesForTier()` method (500 / 5000 / unlimited)

---

### **Phase 4: Integration & Testing** (4 hours)

#### **Story 9: Example API Routes** (MULTI-TENANT-009) - 1 hour
- [src/routes/example/products.routes.ts](../../src/routes/example/products.routes.ts)
- `GET /api/products` - List products (tenant-scoped)
- `POST /api/products` - Create product (requires admin role)
- `DELETE /api/products/:id` - Delete product (requires admin role)
- Demonstrates middleware chaining:
  - `router.use(tenantMiddleware)`
  - `router.post('/', requireRole('admin'), ...)`
  - `router.get('/ai-forecast', requireFeature('ai_forecasting'), ...)`

#### **Story 10: Comprehensive Unit Tests** (MULTI-TENANT-010) - 2 hours
- [tests/unit/middleware/tenant.middleware.test.ts](../../tests/unit/middleware/tenant.middleware.test.ts)
- Test scenarios:
  - ✅ Valid session with tenant returns tenant data
  - ❌ Missing Authorization header returns 401
  - ❌ Invalid Clerk session returns 401
  - ❌ Missing X-Organization-ID returns 400
  - ❌ User not in organization returns 403
  - ❌ Tenant not found returns 404
  - ❌ Suspended subscription returns 403
  - ✅ Auto-creates user if missing in database
  - ✅ Sets PostgreSQL search_path correctly
- [tests/unit/middleware/feature.middleware.test.ts](../../tests/unit/middleware/feature.middleware.test.ts)
- [tests/unit/middleware/rbac.middleware.test.ts](../../tests/unit/middleware/rbac.middleware.test.ts)
- [tests/unit/services/tenant.service.test.ts](../../tests/unit/services/tenant.service.test.ts)

#### **Story 11: Documentation** (MULTI-TENANT-011) - 1 hour
- [docs/MULTI_TENANT_MIDDLEWARE_GUIDE.md](../../docs/MULTI_TENANT_MIDDLEWARE_GUIDE.md)
- Middleware usage examples
- Route protection patterns
- Testing strategies
- Common pitfalls and troubleshooting
- Migration guide for existing routes

---

## 🔐 **SECURITY CONSIDERATIONS**

### **Authentication Flow**

1. **Clerk Session Verification**: Every request validates Clerk JWT token
2. **Organization Membership**: Verifies user belongs to requested organization
3. **Subscription Status**: Blocks suspended/cancelled tenants
4. **Database Isolation**: Search_path ensures tenant data separation

### **Attack Vectors Mitigated**

- ❌ **Tenant Hopping**: User can't access other tenant's data (org membership check)
- ❌ **Feature Abuse**: Starter tier blocked from Professional features
- ❌ **Role Escalation**: Member can't perform admin actions
- ❌ **Session Hijacking**: Clerk session expiry (1 hour)
- ❌ **SQL Injection**: Parameterized schema names (safe from injection)

---

## 📊 **SUBSCRIPTION TIERS & FEATURES**

### **Starter** ($29-49/mo)
- ✅ basic_forecasting
- ❌ ai_forecasting
- ❌ what_if_analysis
- ✅ api_integrations (Shopify, Xero, Amazon, Unleashed)
- ❌ advanced_reports
- ❌ custom_integrations
- ❌ white_label
- Max users: 5
- Max entities: 500

### **Professional** ($99-149/mo)
- ✅ basic_forecasting
- ✅ ai_forecasting
- ✅ what_if_analysis
- ✅ api_integrations
- ❌ advanced_reports
- ❌ custom_integrations
- ❌ white_label
- ✅ priority_support
- Max users: 25
- Max entities: 5,000

### **Enterprise** ($299-499/mo)
- ✅ ALL FEATURES
- Max users: 100
- Max entities: Unlimited

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests**
- Tenant middleware authentication logic (9 scenarios)
- Feature flag enforcement (3 scenarios)
- RBAC role hierarchy (4 scenarios)
- Tenant service CRUD operations (6 scenarios)
- Prisma schema switching (3 scenarios)

### **Integration Tests**
- Complete API request flow with middleware chain
- Tenant creation → schema provisioning → data insertion
- Feature flag blocking (Starter tier requests Professional feature)
- RBAC blocking (member attempts admin action)

### **E2E Tests**
- Multi-tenant product creation (Tenant A vs Tenant B isolation)
- User switches organizations (tenant context changes)
- Subscription downgrade (feature access revoked)

---

## 📖 **REFERENCE DOCUMENTATION**

### **Internal Docs**
- [Multi-Tenant Setup Guide](../../docs/MULTI_TENANT_SETUP_GUIDE.md) - Phase 1 database setup
- [CapLiquify Migration Guide](../../docs/CAPLIQUIFY_MIGRATION_GUIDE.md) - Phase 1-2 retrospective
- [Phase 5.1 Master Admin Dashboard](../retrospectives/2025-10-20-phase-5-1-master-admin-completion.md)

### **External Resources**
- [Clerk Session Verification](https://clerk.com/docs/references/backend/sessions/verify-session)
- [Clerk Organization Membership](https://clerk.com/docs/references/backend/organizations/get-organization-membership-list)
- [Prisma Multi-Schema](https://www.prisma.io/docs/orm/prisma-schema/data-model/multi-schema)
- [PostgreSQL search_path](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)

---

## ✅ **EPIC ACCEPTANCE CRITERIA**

- [ ] Tenant middleware authenticates via Clerk and identifies tenant
- [ ] Database queries automatically target tenant schema
- [ ] Feature middleware blocks unauthorized features
- [ ] RBAC middleware enforces role permissions
- [ ] Tenant service creates schemas with 9 tables
- [ ] Tenant service deletes tenants with schema cleanup
- [ ] Example API routes demonstrate middleware usage
- [ ] 30+ unit tests validate middleware behavior (100% coverage)
- [ ] Documentation enables developer onboarding
- [ ] No cross-tenant data leaks (verified via integration tests)

---

## 🚧 **RISKS & MITIGATION**

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Clerk organization API changes | High | Low | Abstract Clerk logic into service layer |
| PostgreSQL connection pool exhaustion | High | Medium | Implement connection pooling, monitor usage |
| Schema switching performance | Medium | Low | Cache search_path, minimize context switches |
| Feature flag complexity | Medium | Medium | Use TypeScript enums, centralize config |

---

## 📅 **TIMELINE**

**Start Date**: 2025-10-20 17:45 UTC
**Target Completion**: 2025-10-21 09:45 UTC (16 hours BMAD time)
**Status**: 🚧 Phase 1 (0% complete)

**Milestones**:
- Hour 1-4: Phase 1 complete (Core Middleware) ✅
- Hour 5-7: Phase 2 complete (Database Layer) ✅
- Hour 8-12: Phase 3 complete (Tenant Service) ✅
- Hour 13-16: Phase 4 complete (Integration & Testing) ✅

---

## 📬 **STAKEHOLDERS**

- **Product Owner**: CapLiquify Platform Team
- **Technical Lead**: Claude (BMAD Developer Agent)
- **End Users**: Multi-tenant SaaS developers
- **Consumers**: CapLiquify tenant applications

---

**Last Updated**: 2025-10-20 17:45 UTC
**Epic Status**: 🚧 In Progress (Phase 1 starting)
**Next Action**: Implement tenant.middleware.ts with Clerk integration
