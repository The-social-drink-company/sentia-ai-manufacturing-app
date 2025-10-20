# EPIC: CapLiquify Phase 5.1 - Master Admin Dashboard

**Epic ID**: PHASE-5.1-MASTER-ADMIN-DASHBOARD
**Created**: 2025-10-20
**Status**: 🚧 In Progress
**Priority**: High
**Phase**: Phase 5 - Master Admin Dashboard
**Estimated Effort**: 42 hours (5-6 days)

---

## 📋 **EPIC OVERVIEW**

### **Business Context**

CapLiquify is a multi-tenant SaaS platform for manufacturing working capital optimization. As the platform scales to support 100+ tenants, we need a comprehensive **Master Admin Dashboard** that allows the SaaS owner (platform administrator) to:

1. Monitor all tenants and system health
2. Manage tenant subscriptions and access
3. Track revenue metrics (MRR, ARR, churn)
4. Debug tenant issues via secure impersonation
5. Audit all administrative actions
6. Suspend/reactivate tenants as needed

This epic builds upon the completed **Phase 1 & 2** multi-tenant infrastructure and creates the control center for platform operations.

---

## 🎯 **GOALS & SUCCESS CRITERIA**

### **Primary Goals**

1. ✅ **Tenant Management**: Full CRUD operations for all tenants
2. ✅ **System Monitoring**: Real-time health metrics and error tracking
3. ✅ **Revenue Analytics**: MRR, ARR, churn rate, revenue by tier
4. ✅ **User Impersonation**: Secure tenant debugging with audit trail
5. ✅ **Master Admin Security**: 2FA-enforced access with IP whitelisting option

### **Success Criteria**

- [ ] Master admin can view all tenants with pagination and search
- [ ] Master admin can suspend/reactivate tenants with audit logging
- [ ] System health dashboard shows real-time metrics
- [ ] Revenue analytics display MRR, ARR, and 12-month trends
- [ ] Impersonation generates time-limited tokens (1-hour expiry)
- [ ] All admin actions logged to audit_logs table
- [ ] 2FA required for master admin access
- [ ] Master admin UI is responsive and user-friendly

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **Backend Components**

```
server/
├── middleware/
│   └── master-admin.middleware.ts     # 2FA + email whitelist verification
├── routes/
│   └── master-admin.routes.ts         # All admin API endpoints
└── services/
    ├── tenant.service.ts               # Tenant CRUD operations
    └── analytics.service.ts            # Revenue & metrics calculations
```

### **Frontend Components**

```
src/
├── pages/
│   └── master-admin/
│       ├── MasterAdminDashboard.tsx   # Main admin dashboard
│       ├── TenantListView.tsx         # Tenant list with search/filter
│       ├── TenantDetailView.tsx       # Individual tenant details
│       ├── RevenueAnalytics.tsx       # MRR/ARR charts
│       └── SystemHealthView.tsx       # Health monitoring
└── hooks/
    └── useMasterAdmin.ts              # Admin API hooks
```

### **Database Schema** (Already Exists - Phase 1)

```sql
-- Public schema tables
public.tenants              # Tenant registry
public.users                # User-tenant associations
public.subscriptions        # Stripe billing data
public.audit_logs           # Admin action trail
```

---

## 📦 **DELIVERABLES**

### **1. Master Admin Middleware** (ADMIN-001)
- ✅ Email whitelist verification
- ✅ 2FA enforcement check
- ✅ Session validation via Clerk
- ✅ Optional IP whitelisting
- **Estimated**: 4 hours

### **2. Tenant Management API** (ADMIN-002)
- ✅ GET /api/master-admin/tenants (list with pagination)
- ✅ GET /api/master-admin/tenants/:id (detailed view)
- ✅ POST /api/master-admin/tenants (manual tenant creation)
- ✅ PATCH /api/master-admin/tenants/:id (update subscription/limits)
- ✅ POST /api/master-admin/tenants/:id/suspend
- ✅ POST /api/master-admin/tenants/:id/reactivate
- ✅ DELETE /api/master-admin/tenants/:id (soft delete)
- **Estimated**: 6 hours

### **3. System Metrics API** (ADMIN-003)
- ✅ GET /api/master-admin/metrics/overview (tenant counts, MRR, ARR)
- ✅ GET /api/master-admin/metrics/revenue (by tier, 12-month trend)
- ✅ GET /api/master-admin/metrics/system-health (DB, errors, uptime)
- **Estimated**: 4 hours

### **4. Master Admin Dashboard UI** (ADMIN-004)
- ✅ Dashboard layout with navigation
- ✅ Key metrics cards (tenants, MRR, ARR, churn)
- ✅ Recent tenants table
- ✅ Search and filter functionality
- ✅ Responsive design (Tailwind CSS)
- **Estimated**: 8 hours

### **5. Tenant Detail View** (ADMIN-005)
- ✅ Tenant information display
- ✅ User list with roles
- ✅ Subscription details
- ✅ Tenant-specific metrics (product count, sales count)
- ✅ Recent audit logs
- ✅ Suspend/reactivate actions
- **Estimated**: 4 hours

### **6. User Impersonation System** (ADMIN-006)
- ✅ POST /api/master-admin/impersonate/:userId
- ✅ Generate JWT with 1-hour expiry
- ✅ Audit log on impersonation start
- ✅ Impersonation banner in tenant UI
- **Estimated**: 4 hours

### **7. Revenue Analytics** (ADMIN-007)
- ✅ MRR/ARR calculation logic
- ✅ Revenue by tier breakdown
- ✅ 12-month revenue trend chart (recharts)
- ✅ Churn rate calculation
- **Estimated**: 4 hours

### **8. System Health Monitoring** (ADMIN-008)
- ✅ Database connection status
- ✅ Error log tracking (last hour)
- ✅ System uptime display
- ✅ Memory usage metrics
- **Estimated**: 3 hours

### **9. Audit Log Viewer** (ADMIN-009)
- ✅ Audit log table with filtering
- ✅ Action type filter
- ✅ Date range filter
- ✅ Export to CSV functionality
- **Estimated**: 3 hours

### **10. Documentation** (ADMIN-010)
- ✅ Master admin setup guide
- ✅ API endpoint documentation
- ✅ Security best practices
- ✅ Impersonation usage guide
- **Estimated**: 2 hours

---

## 🔐 **SECURITY CONSIDERATIONS**

### **Access Control**

1. **Master Admin Whitelist**
   - Environment variable: `MASTER_ADMIN_EMAIL`
   - Only whitelisted emails can access master admin routes
   - Example: `MASTER_ADMIN_EMAIL=admin@capliquify.com`

2. **2FA Enforcement**
   - Clerk integration checks `user.twoFactorEnabled`
   - Rejects requests if 2FA not enabled
   - Error: "2FA required for master admin access"

3. **IP Whitelisting (Optional)**
   - Environment variable: `MASTER_ADMIN_ALLOWED_IPS`
   - Example: `MASTER_ADMIN_ALLOWED_IPS=203.0.113.1,198.51.100.0/24`

4. **Session Expiry**
   - Clerk session tokens expire after 1 hour
   - Impersonation tokens expire after 1 hour
   - Automatic re-authentication required

### **Audit Logging**

All master admin actions are logged to `public.audit_logs`:

```sql
INSERT INTO audit_logs (
  tenant_id,
  action,
  resource_type,
  resource_id,
  metadata
) VALUES (
  'tenant-uuid',
  'tenant.suspended',
  'tenant',
  'tenant-uuid',
  '{"adminEmail": "admin@capliquify.com", "reason": "Payment overdue"}'
);
```

**Logged Actions**:
- `tenant.created`, `tenant.updated`, `tenant.suspended`, `tenant.reactivated`, `tenant.deleted`
- `user.impersonated`
- `subscription.updated_by_admin`

---

## 📊 **METRICS & KPIs**

### **Tenant Metrics**
- Total tenants (active, trial, suspended, cancelled)
- New tenants this month
- Churned tenants this month
- Churn rate: `(churned / total) * 100`

### **Revenue Metrics**
- **MRR** (Monthly Recurring Revenue): Sum of all active monthly subscriptions
  - Annual subscriptions divided by 12
- **ARR** (Annual Recurring Revenue): `MRR * 12`
- **Revenue by Tier**: Breakdown by Starter, Professional, Enterprise

### **System Health**
- Database connection status
- Error count (last hour)
- System uptime (seconds)
- Memory usage (used/total/external)

---

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Foundation** (Day 1-2)
- [x] ADMIN-001: Master Admin Middleware
- [x] ADMIN-002: Tenant Management API
- [x] ADMIN-003: System Metrics API

### **Phase 2: UI Development** (Day 3-4)
- [ ] ADMIN-004: Master Admin Dashboard UI
- [ ] ADMIN-005: Tenant Detail View
- [ ] ADMIN-008: System Health Monitoring UI

### **Phase 3: Advanced Features** (Day 5)
- [ ] ADMIN-006: User Impersonation System
- [ ] ADMIN-007: Revenue Analytics UI
- [ ] ADMIN-009: Audit Log Viewer

### **Phase 4: Documentation & Testing** (Day 6)
- [ ] ADMIN-010: Documentation
- [ ] Integration testing
- [ ] Security audit
- [ ] User acceptance testing

---

## 🔗 **DEPENDENCIES**

### **Completed Dependencies** ✅
- ✅ Phase 1: Multi-tenant database architecture
- ✅ Phase 2: Backend multi-tenant framework
- ✅ Clerk authentication system
- ✅ Prisma schema with multiSchema support

### **External Dependencies**
- ⏳ Stripe integration (Phase 6 - for billing data)
  - **Workaround**: Use mock subscription data for now
- ⏳ Custom domain SSL (for production deployment)
  - **Status**: Already configured (app.capliquify.com)

---

## 📝 **EPIC STORIES**

| Story ID | Title | Estimated | Status |
|----------|-------|-----------|--------|
| ADMIN-001 | Master Admin Middleware & Access Control | 4h | ⏳ Pending |
| ADMIN-002 | Tenant Management API Routes | 6h | ⏳ Pending |
| ADMIN-003 | System Metrics & Analytics API | 4h | ⏳ Pending |
| ADMIN-004 | Master Admin Dashboard Frontend | 8h | ⏳ Pending |
| ADMIN-005 | Tenant Detail View | 4h | ⏳ Pending |
| ADMIN-006 | User Impersonation System | 4h | ⏳ Pending |
| ADMIN-007 | Revenue Analytics Dashboard | 4h | ⏳ Pending |
| ADMIN-008 | System Health Monitoring | 3h | ⏳ Pending |
| ADMIN-009 | Audit Log Viewer | 3h | ⏳ Pending |
| ADMIN-010 | Master Admin Documentation | 2h | ⏳ Pending |

**Total**: 42 hours estimated

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests**
- Master admin middleware authentication logic
- Tenant service CRUD operations
- Revenue calculation functions

### **Integration Tests**
- Complete API endpoint testing with mock data
- Clerk session verification
- Audit log creation on admin actions

### **Security Tests**
- Unauthorized access attempts (non-whitelisted emails)
- 2FA bypass attempts
- Token expiry validation
- SQL injection prevention

### **E2E Tests**
- Master admin login flow
- Tenant suspension workflow
- Impersonation token generation and usage

---

## 📖 **REFERENCE DOCUMENTATION**

### **Internal Docs**
- [Multi-Tenant Setup Guide](../../docs/MULTI_TENANT_SETUP_GUIDE.md)
- [CapLiquify Migration Guide](../../docs/CAPLIQUIFY_MIGRATION_GUIDE.md)
- [Phase 1 & 2 Retrospective](../retrospectives/2025-10-19-capliquify-phase-1-2-retrospective.md)

### **External Resources**
- [Clerk Session Verification](https://clerk.com/docs/references/backend/sessions/verify-session)
- [Prisma Multi-Schema](https://www.prisma.io/docs/orm/prisma-schema/data-model/multi-schema)
- [Recharts Documentation](https://recharts.org/en-US/)

---

## ✅ **EPIC ACCEPTANCE CRITERIA**

- [ ] Master admin can authenticate with 2FA-enforced Clerk session
- [ ] Master admin can view list of all tenants with search/filter
- [ ] Master admin can view detailed tenant information
- [ ] Master admin can suspend/reactivate tenants
- [ ] Master admin can manually create new tenants
- [ ] System metrics display current MRR, ARR, and churn rate
- [ ] Revenue analytics show 12-month trend chart
- [ ] System health dashboard shows real-time status
- [ ] User impersonation generates valid JWT tokens
- [ ] All admin actions logged to audit_logs table
- [ ] UI is responsive on desktop and mobile
- [ ] Documentation covers all features
- [ ] Security audit passed (no critical vulnerabilities)

---

## 🚧 **RISKS & MITIGATION**

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Stripe integration incomplete | Medium | High | Use mock subscription data initially |
| Clerk 2FA not configured | High | Low | Add setup instructions in docs |
| Performance issues with 100+ tenants | Medium | Medium | Implement pagination and caching |
| Security vulnerabilities in impersonation | High | Low | Time-limited tokens + audit logging |

---

## 📅 **TIMELINE**

**Start Date**: 2025-10-20
**Target Completion**: 2025-10-27 (7 days)
**Status**: 🚧 In Progress (0% complete)

**Milestones**:
- Day 1-2: Backend API complete ✅
- Day 3-4: UI components complete ✅
- Day 5: Advanced features complete ✅
- Day 6: Documentation & testing complete ✅
- Day 7: Production deployment ✅

---

## 📬 **STAKEHOLDERS**

- **Product Owner**: SaaS Platform Owner
- **Technical Lead**: Claude (BMAD Developer Agent)
- **End Users**: CapLiquify Platform Administrators

---

**Last Updated**: 2025-10-20
**Epic Status**: 🚧 In Progress
**Next Action**: Create individual BMAD stories (ADMIN-001 to ADMIN-010)
