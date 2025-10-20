# CapLiquify Multi-Tenant Architecture

**Platform**: CapLiquify (SaaS)
**Architecture**: Schema-per-Tenant with Prisma ORM
**Authentication**: Clerk
**RBAC**: 5-tier role system

---

## Executive Summary

CapLiquify is a **multi-tenant SaaS platform** that provides manufacturing intelligence dashboards to multiple customers (tenants). Each tenant operates in complete isolation with their own data, users, and API integrations.

**Key Concepts**:
- **CapLiquify** = The SaaS platform (product name)
- **Tenant** = A customer/client using CapLiquify (e.g., Sentia Spirits)
- **Master Admin** = Platform owner managing all tenants
- **Tenant Admin** = Customer admin managing their own tenant

---

## Two-Tier Administration System

### 1. Master Admin Dashboard

**Purpose**: Platform-level administration
**Route**: `/master-admin`
**Role Required**: `master_admin`
**Color Scheme**: Red/Orange (differentiated from tenant dashboards)

**Capabilities**:
- ✅ View all tenants across the platform
- ✅ Create/edit/suspend tenant accounts
- ✅ Monitor platform-wide metrics (MRR, ARR, tenant count)
- ✅ Manage subscription tiers and billing
- ✅ Impersonate tenant users for support
- ✅ View audit logs across all tenants
- ✅ Configure platform-wide settings

**Components**:
- [MasterAdminDashboard.tsx](src/pages/master-admin/MasterAdminDashboard.tsx)
- Master admin middleware with email whitelist + 2FA

**Access Control**:
```javascript
// Only users with master_admin role + whitelisted email
const MASTER_ADMIN_EMAILS = [
  'owner@capliquify.com',
  'admin@capliquify.com',
  // Platform owners only
];
```

---

### 2. Tenant Admin Panel

**Purpose**: Tenant-level administration
**Route**: `/app/admin`
**Role Required**: `admin` (tenant admin role)
**Color Scheme**: Blue/Purple (CapLiquify brand colors)

**Capabilities**:
- ✅ Manage API integrations (Xero, Shopify, Amazon, Unleashed)
- ✅ Configure tenant settings (timezone, currency, fiscal year)
- ✅ Manage users within their tenant
- ✅ View tenant-specific audit logs
- ✅ Rotate API keys and credentials
- ✅ Trigger manual data syncs (with MFA)
- ✅ View sync job history and status
- ❌ **Cannot** view other tenants' data
- ❌ **Cannot** access platform-level settings

**Components**:
- [AdminPanel.tsx](src/pages/AdminPanelEnhanced.jsx) (alias for IntegrationManagement)
- [IntegrationManagement.jsx](src/pages/admin/IntegrationManagement.jsx)

**Sidebar Navigation**:
```javascript
// From Sidebar.jsx - Visible to both admin and master_admin
{
  name: 'Admin Panel',
  href: '/app/admin',
  icon: ShieldCheckIcon,
  roles: ['admin', 'master_admin'],
}
```

---

## Role Hierarchy

CapLiquify uses a 5-tier RBAC system:

| Role | Level | Capabilities | Typical Use Case |
|------|-------|--------------|------------------|
| **master_admin** | 5 (Highest) | Platform-wide access, all tenant management | CapLiquify platform owners |
| **admin** | 4 | Tenant management, API integrations, user admin | Customer IT managers |
| **manager** | 3 | Advanced analytics, forecasting, reports | Operations managers |
| **operator** | 2 | Daily operations, inventory, data entry | Floor supervisors |
| **viewer** | 1 (Lowest) | Read-only dashboard access | Stakeholders, executives |

**Role Inheritance**: Higher roles inherit all permissions of lower roles.

---

## Example Tenant: Sentia Spirits

**Tenant Name**: Sentia Spirits
**Slug**: `sentia-spirits`
**Company**: Sentia Spirits Ltd
**Industry**: Beverages - Functional Drinks
**Subscription**: Enterprise (Active)

**API Integrations**:
1. **Xero Accounting** - Financial data sync (receivables, payables, working capital)
2. **Shopify UK** - E-commerce orders and inventory sync (UK market)
3. **Shopify EU** - E-commerce orders and inventory sync (EU market)
4. **Shopify USA** - E-commerce orders and inventory sync (USA market)
5. **Amazon SP-API (UK)** - FBA inventory and order sync
6. **Amazon SP-API (USA)** - FBA inventory and order sync
7. **Unleashed ERP** - Production planning, assembly jobs, inventory management

**Access URL**: `https://app.capliquify.com/sentia-spirits`

**Seed Script**: [seed-tenant-sentia-spirits.js](prisma/seed-tenant-sentia-spirits.js)

---

## Data Isolation

### Schema Design

Each tenant has complete data isolation using Prisma's multi-tenant patterns:

```prisma
model Tenant {
  id                 String   @id @default(uuid())
  name               String   @unique
  slug               String   @unique
  companyName        String
  subscriptionTier   String   @default("starter")
  subscriptionStatus String   @default("TRIAL")
  features           Json     @default("{}") @db.Json
  // ... relationships to users, data, etc.
  @@map("tenants")
}
```

**Tenant-Aware Queries**:
```javascript
// All queries include tenant filter
const products = await prisma.products.findMany({
  where: { tenantId: currentTenant.id }
});

// Middleware enforces tenant context
prisma.$use(async (params, next) => {
  if (!params.args.where) params.args.where = {};
  params.args.where.tenantId = currentTenant.id;
  return next(params);
});
```

---

## User Assignment

### Master Admin Users
- Created at platform level
- Email must be in `MASTER_ADMIN_EMAILS` whitelist
- Have `master_admin` role globally
- **Cannot** be assigned to a specific tenant
- Access master admin dashboard only

### Tenant Users
- Created within a tenant context
- Assigned one of: admin, manager, operator, viewer
- **Tenant admin** role = highest role within a tenant
- **Cannot** access other tenants' data
- Access tenant-specific dashboards and admin panel

**Clerk User Metadata**:
```javascript
// Tenant users have tenantId in metadata
{
  userId: 'user_abc123',
  publicMetadata: {
    role: 'admin', // Tenant admin
    tenantId: 'tenant_xyz789',
    tenantSlug: 'sentia-spirits'
  }
}

// Master admin users have no tenantId
{
  userId: 'user_master001',
  publicMetadata: {
    role: 'master_admin', // Platform admin
    tenantId: null, // No tenant assignment
  }
}
```

---

## Routes and Access Control

### Public Routes (No Authentication)
- `/` - Landing page
- `/features` - Features page
- `/pricing` - Pricing page
- `/blog` - Blog
- `/sign-in` - Clerk sign-in
- `/sign-up` - Clerk sign-up

### Tenant Routes (Requires Authentication + Role)
- `/app/dashboard` - Main dashboard (`viewer` or higher)
- `/app/working-capital` - Working capital analysis (`manager` or higher)
- `/app/forecasting` - Demand forecasting (`operator` or higher)
- `/app/inventory` - Inventory management (`operator` or higher)
- `/app/admin` - **Tenant Admin Panel** (`admin` or `master_admin`)
- `/app/users` - User management (`admin` or `master_admin`)
- `/app/config` - System configuration (`admin` or `master_admin`)

### Platform Routes (Requires `master_admin`)
- `/master-admin` - **Master Admin Dashboard** (`master_admin` only)

---

## Integration Management

### Tenant Admin Panel - API Integrations

Located at `/app/admin`, the Integration Management page allows tenant admins to:

1. **View all integrations** with status indicators (🟢 Active, 🔴 Inactive)
2. **Trigger manual syncs** (requires MFA for security)
3. **Rotate API keys** (for security compliance)
4. **View sync job history** (timestamp, status, records processed)
5. **Configure sync settings** (frequency, enabled/disabled)

**MFA Requirement**:
- Sensitive operations (sync trigger, key rotation) require 2FA verification
- Implemented using Speakeasy TOTP
- Users must enroll in 2FA before performing sensitive actions

**API Credentials**:
- Stored encrypted in database (AES-256-GCM)
- Never logged in plain text
- Rotated regularly per security policy

---

## Branding Hierarchy

### Platform Branding (CapLiquify)
- Used in: Sign-in/sign-up pages, marketing pages, master admin dashboard
- Colors: Blue (#2563eb) / Purple (#7c3aed)
- Logo: "C" icon
- Name: **CapLiquify Manufacturing Dashboard**

### Tenant Branding (Optional Custom Branding)
- Enterprise tier tenants can upload custom logos
- Tenant name displayed in dashboard header
- Custom domain support (e.g., `dashboard.sentiadrinks.com` → CapLiquify tenant)

---

## Security Considerations

### Tenant Isolation
- ✅ Database-level isolation (tenant-aware queries)
- ✅ API-level isolation (middleware enforces tenant context)
- ✅ UI-level isolation (user can only see their tenant's data)
- ✅ Authentication-level isolation (Clerk metadata includes tenantId)

### Master Admin Protection
- ✅ Email whitelist requirement
- ✅ 2FA mandatory for master admin access
- ✅ Audit logging of all master admin actions
- ✅ Separate dashboard with distinct visual identity

### API Integration Security
- ✅ Encrypted credential storage (AES-256-GCM)
- ✅ MFA required for sensitive operations
- ✅ Rate limiting on sync endpoints
- ✅ IP whitelisting support (future)
- ✅ OAuth 2.0 for third-party APIs

---

## Deployment and Scaling

### Current Architecture
- **Frontend**: Render (sentia-frontend-prod.onrender.com)
- **Backend API**: Render (sentia-backend-prod.onrender.com)
- **MCP Server**: Render (sentia-mcp-prod.onrender.com)
- **Database**: Render PostgreSQL 17 with pgvector
- **Redis**: Redis Cloud (caching + job queues)

### Multi-Tenancy Performance
- **Connection Pooling**: Prisma connection pooling per tenant
- **Caching**: Redis caching with tenant-aware keys
- **Query Optimization**: Indexed tenant foreign keys
- **Background Jobs**: BullMQ with tenant context in job data

---

## Future Enhancements

### Planned Features
- [ ] Tenant-specific custom domains (e.g., `dashboard.sentiadrinks.com`)
- [ ] White-label branding (remove "CapLiquify" branding for enterprise)
- [ ] Tenant analytics dashboard (usage metrics, API call counts)
- [ ] Automated tenant provisioning (self-service trial signup)
- [ ] Tenant migration tools (import/export tenant data)
- [ ] Multi-region deployment (EU, US, APAC)

---

## Quick Reference

### For Platform Owners (Master Admins)
1. Access: `https://app.capliquify.com/master-admin`
2. Role: `master_admin`
3. Dashboard: Red/Orange theme
4. Capabilities: Manage all tenants, platform metrics, billing

### For Tenant Admins
1. Access: `https://app.capliquify.com/app/admin`
2. Role: `admin` (within their tenant)
3. Dashboard: Blue/Purple theme
4. Capabilities: Manage API integrations, users, settings (tenant-scoped only)

### For Developers
- **Tenant Context**: Always include `tenantId` in queries
- **Seed Data**: Use `seed-tenant-sentia-spirits.js` for demo tenant
- **RBAC Check**: Use `useAuthRole()` hook in components
- **Admin Routes**: Require `requiredRole="admin"` in route protection

---

## Related Documentation
- [Master Admin Epic](bmad/epics/2025-10-19-capliquify-phase-5-1-master-admin.md)
- [Authentication System](context/authentication-config.md)
- [Security Guidelines](context/security-guidelines.md)
- [Sentia to CapLiquify Renaming Guide](docs/SENTIA_TO_CAPLIQUIFY_RENAMING_GUIDE.md)
