# EPIC: CapLiquify Phase 5.1 - Master Admin Dashboard & Tenant Management

**Epic ID**: CAPLIQUIFY-PHASE-5-1
**Created**: October 19, 2025
**Status**: In Progress
**Priority**: High
**Sprint**: Phase 5 - Master Admin & Billing (Part 1)

---

## 📋 Epic Overview

### Business Objective

Create a comprehensive Master Admin Dashboard that allows the SaaS owner to:
1. Manage all tenants (view, edit, suspend, delete)
2. Monitor system health and performance
3. Track business metrics (MRR, ARR, churn)
4. Impersonate users for support
5. View revenue analytics
6. Audit all administrative actions

### Target User

- **Primary**: SaaS owner/administrator (you)
- **Access Level**: Master admin only (email whitelist + 2FA required)
- **Use Cases**: Tenant management, system monitoring, support, analytics

### Success Metrics

- **Security**: 100% of admin actions logged in audit trail
- **Visibility**: Real-time metrics for all key business KPIs
- **Efficiency**: <5 seconds to view tenant details
- **Reliability**: 99.9% uptime for admin dashboard
- **Compliance**: Full audit trail for all tenant modifications

---

## 🎯 Epic Goals

### Master Admin Dashboard

1. **Secure Access Control**: Email whitelist + 2FA enforcement + optional IP whitelist
2. **Tenant Management**: CRUD operations for all tenants with status management
3. **System Health Monitoring**: Real-time database, memory, error tracking
4. **Revenue Analytics**: MRR, ARR, churn rate, revenue by tier
5. **User Impersonation**: Generate short-lived tokens to impersonate users for support
6. **Audit Logging**: Complete trail of all admin actions

---

## 📊 Story Breakdown

### Story 1: Master Admin Middleware (2-3 hrs)

**Description**: Create authentication middleware for master admin routes

**Tasks**:
- [ ] Create `server/middleware/master-admin.middleware.ts`
- [ ] Validate Clerk session token
- [ ] Check email against whitelist (environment variable)
- [ ] Verify 2FA enabled for admin user
- [ ] Optional: IP whitelist validation
- [ ] Attach admin context to request object

**Acceptance Criteria**:
- [ ] Only whitelisted emails can access admin routes
- [ ] 2FA is enforced (403 error if not enabled)
- [ ] Unauthorized requests return 401/403 with clear error messages
- [ ] Admin email logged in request context

---

### Story 2: Tenant Management API Routes (4-6 hrs)

**Description**: Create comprehensive API for tenant management

**Endpoints**:
- `GET /api/master-admin/tenants` - List all tenants (paginated, filterable)
- `GET /api/master-admin/tenants/:id` - Get tenant details with metrics
- `POST /api/master-admin/tenants` - Create tenant (manual onboarding)
- `PATCH /api/master-admin/tenants/:id` - Update tenant (tier, status, limits)
- `POST /api/master-admin/tenants/:id/suspend` - Suspend tenant
- `POST /api/master-admin/tenants/:id/reactivate` - Reactivate tenant
- `DELETE /api/master-admin/tenants/:id` - Soft delete tenant

**Acceptance Criteria**:
- [ ] All endpoints require master admin auth
- [ ] Pagination working (default 50 per page)
- [ ] Filtering by status, tier, search term
- [ ] Tenant details include user count, metrics from tenant schema
- [ ] All modifications logged in audit trail
- [ ] Soft delete (not hard delete)

---

### Story 3: System Metrics API Routes (2-3 hrs)

**Description**: Create API endpoints for business and system metrics

**Endpoints**:
- `GET /api/master-admin/metrics/overview` - Key business metrics
- `GET /api/master-admin/metrics/revenue` - Revenue breakdown and trends
- `GET /api/master-admin/metrics/system-health` - System health status

**Metrics**:
- Total tenants, active, trial, suspended
- New tenants this month, churned this month
- MRR, ARR, churn rate
- Total users
- Revenue by tier
- Revenue trend (last 12 months)
- Database status, error count, uptime

**Acceptance Criteria**:
- [ ] Overview metrics calculated correctly
- [ ] MRR calculated based on active subscriptions
- [ ] Churn rate calculated accurately
- [ ] Revenue trend returns 12 months of data
- [ ] System health checks database connection

---

### Story 4: User Impersonation API (2-3 hrs)

**Description**: Allow master admin to impersonate users for support

**Endpoint**:
- `POST /api/master-admin/impersonate/:userId` - Generate impersonation token

**Functionality**:
- Generate JWT with user context
- 1-hour expiration
- Log impersonation action
- Return token and user details

**Acceptance Criteria**:
- [ ] Impersonation token expires after 1 hour
- [ ] Token includes user ID, tenant ID, admin email
- [ ] Impersonation logged in audit trail
- [ ] Frontend can use token to access user's tenant

---

### Story 5: Master Admin Dashboard Frontend (4-6 hrs)

**Description**: Create React dashboard for master admin

**Components**:
- Dashboard overview with key metrics cards
- Tenants table with search and filters
- System health indicator
- Revenue charts

**Pages**:
- `src/pages/master-admin/MasterAdminDashboard.tsx` - Main dashboard
- `src/pages/master-admin/TenantDetails.tsx` - Individual tenant view
- `src/pages/master-admin/TenantList.tsx` - Full tenant list with advanced filters

**Acceptance Criteria**:
- [ ] Dashboard loads metrics on mount
- [ ] Metric cards show: Total Tenants, Active Tenants, MRR, Churn Rate
- [ ] Tenants table shows recent 10 tenants
- [ ] Search bar filters tenants
- [ ] Status badges color-coded (green=active, yellow=trial, red=suspended)
- [ ] Click tenant to view details

---

### Story 6: Tenant Details Page (3-4 hrs)

**Description**: Detailed view of individual tenant

**Sections**:
- Tenant info (name, slug, tier, status)
- Subscription details
- User list
- Tenant-specific metrics (products, sales, forecasts)
- Recent audit logs
- Admin actions (Edit, Suspend, Reactivate, Delete)

**Acceptance Criteria**:
- [ ] All tenant data displayed
- [ ] User list shows email, role, last login
- [ ] Tenant metrics fetched from tenant schema
- [ ] Audit logs paginated (50 most recent)
- [ ] Admin actions trigger API calls
- [ ] Confirmation required for destructive actions

---

### Story 7: Tenant Management Actions (2-3 hrs)

**Description**: Frontend components for tenant management actions

**Components**:
- Edit tenant modal (tier, limits, features)
- Suspend tenant modal (with reason)
- Delete tenant modal (with "DELETE" confirmation)
- Create tenant modal (manual onboarding)

**Acceptance Criteria**:
- [ ] Edit modal updates tier, maxUsers, maxEntities, features
- [ ] Suspend modal requires reason text
- [ ] Delete modal requires typing "DELETE" to confirm
- [ ] Create modal validates all required fields
- [ ] Success/error toasts shown after actions
- [ ] Table refreshes after successful action

---

### Story 8: System Health Dashboard (2-3 hrs)

**Description**: Visual dashboard for system health monitoring

**Metrics Displayed**:
- Database status (healthy/unhealthy)
- API response times
- Error count (last hour, last 24 hours)
- Memory usage
- Uptime
- Active connections

**Acceptance Criteria**:
- [ ] Health status auto-refreshes every 30 seconds
- [ ] Red/yellow/green indicators for each metric
- [ ] Graph showing error trend over time
- [ ] Memory usage bar chart
- [ ] Alert if error count exceeds threshold

---

### Story 9: Revenue Analytics Dashboard (3-4 hrs)

**Description**: Visual analytics for revenue tracking

**Charts**:
- MRR trend (line chart, last 12 months)
- Revenue by tier (pie chart)
- New vs churned tenants (bar chart)
- Subscription growth (line chart)

**Acceptance Criteria**:
- [ ] Charts render using Chart.js or Recharts
- [ ] Data fetched from revenue metrics API
- [ ] Charts responsive on mobile
- [ ] Tooltips show exact values
- [ ] Time period selectable (month, quarter, year)

---

### Story 10: Audit Trail Viewer (2-3 hrs)

**Description**: View all admin actions and system events

**Features**:
- Filter by action type, tenant, user, date range
- Search by metadata
- Export to CSV
- Pagination

**Acceptance Criteria**:
- [ ] All admin actions visible
- [ ] Filter by action type (tenant.created, tenant.suspended, etc.)
- [ ] Date range picker functional
- [ ] Metadata shown in expandable row
- [ ] Export generates CSV with all filtered logs

---

## 🎨 Design System

### Master Admin Color Scheme

**Different from tenant dashboards** to clearly indicate admin mode:

- **Primary**: Red/Orange (#DC2626) - Indicates admin/danger zone
- **Secondary**: Gray (#6B7280) - Neutral actions
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Danger**: Red (#EF4444)

### Layout

```
┌─────────────────────────────────────────┐
│  Master Admin Header (Red bar)          │
│  "CapLiquify Master Admin" + Health     │
├─────────────────────────────────────────┤
│  Key Metrics Cards (4 columns)          │
│  [Tenants] [Active] [MRR] [Churn]      │
├─────────────────────────────────────────┤
│  Tenants Table                          │
│  [Search] [Filter] [Create Tenant]      │
│  ┌───────────────────────────────────┐  │
│  │ Name │ Tier │ Status │ Actions   │  │
│  │ ...  │ ...  │ ...    │ ...       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 📐 Technical Architecture

### Backend Structure

```
server/
├── middleware/
│   └── master-admin.middleware.ts    # Auth + 2FA enforcement
├── routes/
│   └── master-admin.routes.ts        # All admin API routes
└── services/
    └── master-admin.service.ts       # Business logic (optional)
```

### Frontend Structure

```
src/
├── pages/
│   └── master-admin/
│       ├── MasterAdminDashboard.tsx  # Main dashboard
│       ├── TenantDetails.tsx         # Individual tenant view
│       ├── TenantList.tsx            # Full list with filters
│       ├── SystemHealth.tsx          # System monitoring
│       ├── RevenueAnalytics.tsx      # Revenue charts
│       └── AuditTrail.tsx            # Audit log viewer
├── components/
│   └── master-admin/
│       ├── MetricCard.tsx            # Reusable metric display
│       ├── TenantTable.tsx           # Tenant list table
│       ├── StatusBadge.tsx           # Status indicator
│       ├── EditTenantModal.tsx       # Edit dialog
│       ├── SuspendTenantModal.tsx    # Suspend dialog
│       ├── DeleteTenantModal.tsx     # Delete dialog
│       └── CreateTenantModal.tsx     # Create dialog
└── hooks/
    └── useMasterAdmin.ts             # Hook for admin API calls
```

---

## 🔐 Security Architecture

### Authentication Flow

1. User signs in with Clerk
2. Middleware extracts session token from `Authorization: Bearer <token>`
3. Verify session with Clerk API
4. Check user email against `MASTER_ADMIN_EMAIL` environment variable
5. Verify user has 2FA enabled
6. Optional: Check IP against whitelist
7. Attach admin context to request: `req.masterAdmin = { userId, email }`

### Authorization Levels

- **Master Admin**: Full access to all routes and tenants
- **Future**: Support admin (read-only access to tenant data)
- **Future**: Billing admin (access to revenue metrics only)

### Audit Logging

**All admin actions logged**:
- `tenant.created` - New tenant created manually
- `tenant.updated_by_admin` - Tier/limits changed
- `tenant.suspended` - Tenant suspended with reason
- `tenant.reactivated` - Tenant reactivated
- `tenant.deleted` - Tenant soft deleted
- `user.impersonated` - Admin impersonated user

**Log Structure**:
```typescript
{
  tenantId: string
  userId?: string
  action: string
  resourceType: 'tenant' | 'user' | 'subscription'
  resourceId: string
  metadata: {
    adminEmail: string
    changes?: object
    reason?: string
  }
  createdAt: Date
}
```

---

## 🔗 Dependencies

### Backend Dependencies (Existing)

- `@clerk/clerk-sdk-node` - Clerk SDK for session verification
- `express` - Web framework
- `@prisma/client` - Database ORM
- `jsonwebtoken` - JWT for impersonation tokens

### Frontend Dependencies (Existing)

- `@clerk/clerk-react` - Clerk React hooks
- `react-router-dom` - Routing
- `lucide-react` - Icons
- `tailwindcss` - Styling

### New Dependencies (Optional)

- `recharts` - Charts for revenue analytics (if not already installed)
- `react-query` - Data fetching (if not already using TanStack Query)

---

## ✅ Definition of Done

### Backend
- [ ] Master admin middleware functional
- [ ] All 11 API endpoints implemented
- [ ] Audit logging for all admin actions
- [ ] Error handling comprehensive
- [ ] TypeScript types complete
- [ ] 2FA enforcement working

### Frontend
- [ ] Master admin dashboard loads and displays metrics
- [ ] Tenant table shows all tenants with filters
- [ ] Tenant details page functional
- [ ] All CRUD modals working
- [ ] Impersonation functionality tested
- [ ] Responsive design (desktop primary, tablet secondary)

### Security
- [ ] Email whitelist enforced
- [ ] 2FA checked on every request
- [ ] Audit trail captures all actions
- [ ] Impersonation tokens expire after 1 hour

### Documentation
- [ ] Environment variable guide (MASTER_ADMIN_EMAIL)
- [ ] API endpoint documentation
- [ ] Setup instructions for master admin access

---

## 📊 Effort Estimation

### Traditional Development

| Story | Description | Traditional Est. | BMAD Target |
|-------|-------------|-----------------|-------------|
| 1 | Master Admin Middleware | 2-3 hrs | 0.3-0.4 hrs |
| 2 | Tenant Management API | 4-6 hrs | 0.6-0.8 hrs |
| 3 | System Metrics API | 2-3 hrs | 0.3-0.4 hrs |
| 4 | User Impersonation API | 2-3 hrs | 0.3-0.4 hrs |
| 5 | Master Admin Dashboard Frontend | 4-6 hrs | 0.6-0.8 hrs |
| 6 | Tenant Details Page | 3-4 hrs | 0.4-0.6 hrs |
| 7 | Tenant Management Actions | 2-3 hrs | 0.3-0.4 hrs |
| 8 | System Health Dashboard | 2-3 hrs | 0.3-0.4 hrs |
| 9 | Revenue Analytics Dashboard | 3-4 hrs | 0.4-0.6 hrs |
| 10 | Audit Trail Viewer | 2-3 hrs | 0.3-0.4 hrs |

**Total Traditional**: 26-38 hours
**Total BMAD Target**: 3.8-5.6 hours (6.8x-10x faster)

---

## 🎯 Sprint Plan

### Session 1 (2-3 hours) - Backend + Basic Frontend
- Stories 1-4: Middleware + API routes (tenant, metrics, impersonation)
- Story 5: Master admin dashboard (basic UI)
- Commit and push

### Session 2 (1.5-2.5 hours) - Advanced Frontend
- Stories 6-10: Tenant details, modals, health, analytics, audit trail
- Commit and push
- Update retrospective

**Total Sprint Time**: 3.5-5.5 hours
**Traditional Equivalent**: 26-38 hours
**Expected Velocity**: **7x-10x faster**

---

## 📝 Notes

### Environment Variables Required

```env
# Master Admin
MASTER_ADMIN_EMAIL=your-email@example.com
JWT_SECRET=your-secret-key-for-impersonation-tokens

# Optional
MASTER_ADMIN_IP_WHITELIST=1.2.3.4,5.6.7.8
```

### Future Enhancements (Post-Phase 5.1)

- Email notifications when tenant suspended
- Slack integration for admin alerts
- Advanced analytics (cohort analysis, LTV)
- Automated tenant provisioning from Stripe webhooks
- Multi-admin support with role-based permissions
- Tenant health score (engagement, payment history)

---

**Epic Created**: October 19, 2025
**Target Completion**: October 19, 2025 (same day)
**Status**: In Progress (0% → Target: 100%)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
