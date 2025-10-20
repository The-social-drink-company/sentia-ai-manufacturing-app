# Phase 3: Authentication & Tenant Management Deployment Guide

**Date**: October 23, 2025
**Phase**: Phase 3 (Authentication & Tenant Management)
**Status**: ✅ Complete (8/8 stories)
**Target Audience**: DevOps, System Administrators, Backend Developers

---

## 📋 Overview

This guide provides step-by-step instructions for deploying the complete Phase 3 authentication and tenant management system. Phase 3 adds multi-tenant authentication via Clerk, webhook-based provisioning, user role management, and organization switching capabilities.

### What Phase 3 Delivers

- ✅ Clerk webhook integration for organization/user lifecycle events
- ✅ Automated tenant provisioning service
- ✅ Organization switcher UI component
- ✅ User invitation system with email notifications
- ✅ Multi-tenant onboarding flow
- ✅ Organization metadata synchronization
- ✅ Complete user role management (owner/admin/member/viewer)
- ✅ Multi-tenant authentication flow with middleware

**Total Implementation**: ~2,400 lines of code, ~1,800 lines of documentation

---

## 🔧 Prerequisites

### Required Services

1. **Clerk Account** (Production)
   - Organization: https://clerk.com
   - Plan: Production or higher (for webhooks)
   - JWT templates configured

2. **PostgreSQL Database** (with multi-tenant schema)
   - Public schema with `tenants` and `users` tables
   - Tenant-specific schemas (created automatically via provisioning)

3. **SMTP Service** (for email invitations)
   - SendGrid, AWS SES, or similar
   - API key configured

4. **Render Deployment**
   - Backend API service deployed
   - Environment variables accessible

### Required Environment Variables

```bash
# Clerk Configuration
CLERK_SECRET_KEY=sk_live_xxxxx                    # Clerk backend secret
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx              # Clerk frontend key
CLERK_WEBHOOK_SECRET=whsec_xxxxx                 # Webhook signing secret

# Database
DATABASE_URL=postgresql://user:pass@host/db       # Main database URL

# Email Service (for invitations)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx
SMTP_FROM_EMAIL=noreply@capliquify.com
SMTP_FROM_NAME="CapLiquify Team"

# Application
NODE_ENV=production
FRONTEND_URL=https://app.capliquify.com          # For email links
API_BASE_URL=https://api.capliquify.com
```

---

## 📦 Phase 3 Components

### Backend Components

| File | Lines | Purpose |
|------|-------|---------|
| `server/routes/clerk-webhooks.js` | 709 | Handles Clerk webhook events |
| `server/services/tenantProvisioning.js` | 432 | Automated tenant creation/deletion |
| `server/routes/users.js` | 650 | User management API endpoints |
| `server/routes/invitations.js` | 750 | User invitation system |
| `server/middleware/tenantContext.js` | 452 | Multi-tenant auth middleware |
| `server/services/emailService.js` | 180 | Email notification service |

### Frontend Components

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/auth/OrganizationSwitcher.tsx` | 142 | Organization switcher UI |
| `src/components/admin/RoleManagement.tsx` | 550 | Role management interface |
| `src/components/admin/UserInvitations.tsx` | 320 | Invitation management UI |
| `src/hooks/useOrganization.ts` | 95 | Organization data hook |
| `src/hooks/useUserRole.ts` | 78 | Role management hook |

---

## 🚀 Deployment Steps

### Step 1: Configure Clerk Webhooks (30 minutes)

#### 1.1 Create Webhook Endpoint in Clerk Dashboard

1. Log in to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** in the sidebar
3. Click **Add Endpoint**
4. Configure:
   ```
   Endpoint URL: https://api.capliquify.com/api/webhooks/clerk
   Subscribe to events:
     ✅ organization.created
     ✅ organization.updated
     ✅ organization.deleted
     ✅ organizationMembership.created
     ✅ organizationMembership.updated
     ✅ organizationMembership.deleted
     ✅ user.created
     ✅ user.updated
     ✅ user.deleted
   ```
5. Copy the **Signing Secret** (starts with `whsec_`)

#### 1.2 Add Webhook Secret to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your **Backend API** service
3. Go to **Environment** tab
4. Add new variable:
   ```
   Key: CLERK_WEBHOOK_SECRET
   Value: whsec_xxxxxxxxxxxxx
   ```
5. Service will auto-redeploy

#### 1.3 Verify Webhook Configuration

```bash
# Test webhook endpoint is accessible
curl https://api.capliquify.com/api/webhooks/clerk

# Expected response:
# {"error":"Missing Clerk webhook signature"}
```

**✅ Success Indicator**: 400 error (not 404) means endpoint is live

---

### Step 2: Configure Tenant Provisioning (15 minutes)

#### 2.1 Verify Database Functions

```sql
-- Connect to your PostgreSQL database
psql $DATABASE_URL

-- Check tenant management functions exist
\df create_tenant_schema
\df delete_tenant_schema
\df list_tenant_schemas

-- Expected output: 3 functions listed
```

If functions missing, run:
```bash
# From project root
psql $DATABASE_URL < prisma/migrations/002_tenant_schema_functions.sql
```

#### 2.2 Test Tenant Provisioning

```bash
# From Render Shell or local with DATABASE_URL
node -e "
const { createTenantSchema } = require('./server/services/tenantProvisioning');
createTenantSchema('test-tenant-123', 'Test Org')
  .then(() => console.log('✅ Provisioning works'))
  .catch(err => console.error('❌ Error:', err));
"
```

**✅ Success Indicator**: No errors, new schema `tenant_test-tenant-123` created

---

### Step 3: Configure Email Service (20 minutes)

#### 3.1 Set Up SMTP Provider

**Option A: SendGrid** (Recommended)
```bash
# Get API key from https://app.sendgrid.com/settings/api_keys
# Add to Render environment:
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxx
```

**Option B: AWS SES**
```bash
# Get SMTP credentials from AWS SES console
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIA...
SMTP_PASS=...
```

#### 3.2 Configure Email Templates

Email templates located in `server/templates/emails/`:
- `invitation.html` - User invitation email
- `role-changed.html` - Role change notification
- `welcome.html` - Welcome email

**Customization**: Edit templates to match your branding

#### 3.3 Test Email Service

```bash
# From Render Shell or local
node server/scripts/test-email.js your-email@example.com
```

**✅ Success Indicator**: Email received within 1 minute

---

### Step 4: Deploy Frontend Components (30 minutes)

#### 4.1 Verify Clerk Provider Configuration

Check `src/App.tsx` has Clerk provider:
```tsx
import { ClerkProvider } from '@clerk/clerk-react'

<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  {/* app content */}
</ClerkProvider>
```

#### 4.2 Add Environment Variables to Render (Frontend Service)

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
VITE_API_BASE_URL=https://api.capliquify.com
```

#### 4.3 Deploy Frontend

```bash
# Push to main branch (triggers auto-deploy)
git add .
git commit -m "feat(auth): Phase 3 authentication deployment"
git push origin main
```

Wait for Render deployment (3-5 minutes)

#### 4.4 Verify Frontend Deployment

1. Visit https://app.capliquify.com
2. Sign in with Clerk
3. Check Organization Switcher appears in header
4. Navigate to `/admin/users` (admin only)
5. Verify role management interface loads

---

### Step 5: Test Multi-Tenant Flow End-to-End (45 minutes)

#### 5.1 Create Test Organization

1. Sign up new user: https://app.capliquify.com/sign-up
2. Create organization via Clerk UI
3. Verify:
   - Webhook received (check Render logs)
   - Tenant provisioned (check database)
   - User can access dashboard

**Verification SQL**:
```sql
-- Check tenant was created
SELECT id, clerk_organization_id, name, subscription_tier
FROM tenants
WHERE clerk_organization_id = 'org_xxxxx';

-- Check user was associated
SELECT id, clerk_user_id, email, role
FROM users
WHERE tenant_id = (SELECT id FROM tenants WHERE clerk_organization_id = 'org_xxxxx');
```

#### 5.2 Test User Invitation Flow

1. As organization owner, go to `/admin/users`
2. Click **Invite User**
3. Enter email: `test-user@example.com`
4. Select role: `member`
5. Click **Send Invitation**
6. Verify:
   - Email sent (check test inbox)
   - Invitation link works
   - New user can sign up and join organization

#### 5.3 Test Role Management

1. As owner/admin, go to `/admin/users`
2. Click role badge next to a member
3. Change role to `viewer`
4. Confirm change
5. Verify:
   - Role updated in database
   - User's permissions reflect new role
   - Audit log entry created

**Verification SQL**:
```sql
-- Check role was updated
SELECT email, role, updated_at
FROM users
WHERE email = 'test-user@example.com';

-- Check audit log
SELECT action, old_value, new_value, created_at
FROM audit_logs
WHERE entity_type = 'user'
AND entity_id = (SELECT id FROM users WHERE email = 'test-user@example.com')
ORDER BY created_at DESC
LIMIT 5;
```

#### 5.4 Test Organization Switching

1. Create second organization via Clerk
2. Verify new tenant provisioned
3. Use Organization Switcher in header
4. Switch between organizations
5. Verify:
   - Data isolation (each org sees own data)
   - Role persists per organization
   - Middleware sets correct tenant context

---

## 🔒 Security Verification

### Webhook Security

```bash
# Verify webhook signature validation
curl -X POST https://api.capliquify.com/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"type":"organization.created"}'

# Expected: 400 "Invalid Clerk webhook signature"
```

### Tenant Isolation

```sql
-- Connect as application user
SET ROLE tenant_app_user;

-- Try to access another tenant's schema
SET search_path TO tenant_other_org_id;
SELECT * FROM products LIMIT 1;

-- Expected: Permission denied or no data visible
```

### RBAC Enforcement

1. Sign in as `viewer` role
2. Try to access `/admin/users` (should redirect/403)
3. Try to modify data via API (should return 403)

**Test API Endpoint**:
```bash
# As viewer, try to create a product
curl -X POST https://api.capliquify.com/api/products \
  -H "Authorization: Bearer <viewer-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product"}'

# Expected: 403 Forbidden
```

---

## 📊 Monitoring & Health Checks

### Webhook Health

Monitor webhook delivery in Clerk Dashboard:
1. Go to **Webhooks** → Your endpoint
2. Check **Recent Deliveries** tab
3. Look for:
   - ✅ 200 responses (success)
   - ⚠️ 4xx/5xx errors (investigate)

### Database Connection Pooling

```bash
# Check active connections per tenant
psql $DATABASE_URL -c "
SELECT schemaname, count(*)
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY schemaname;
"
```

### Email Delivery

Check SMTP service dashboard:
- SendGrid: https://app.sendgrid.com/email_activity
- AWS SES: CloudWatch metrics for bounces/complaints

---

## 🐛 Troubleshooting

### Webhook Not Firing

**Symptom**: Organization created in Clerk, but no tenant in database

**Solutions**:
1. Check Render logs for webhook errors:
   ```bash
   # In Render dashboard → Logs
   # Search for: "Clerk webhook"
   ```
2. Verify webhook URL is correct in Clerk dashboard
3. Verify `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
4. Test webhook manually with Clerk's "Send test event" button

### Tenant Provisioning Fails

**Symptom**: Webhook received, but tenant schema not created

**Solutions**:
1. Check database permissions:
   ```sql
   GRANT CREATE ON DATABASE your_db TO your_db_user;
   ```
2. Verify provisioning functions exist:
   ```sql
   \df create_tenant_schema
   ```
3. Check Render logs for SQL errors

### Email Invitations Not Sending

**Symptom**: Invitation created, but no email received

**Solutions**:
1. Verify SMTP credentials:
   ```bash
   node server/scripts/test-email.js your-email@example.com
   ```
2. Check spam folder
3. Verify `SMTP_FROM_EMAIL` is verified in SendGrid/SES
4. Check Render logs for SMTP errors

### Role Changes Not Reflecting

**Symptom**: Role updated in UI, but user still has old permissions

**Solutions**:
1. Check JWT token expiration (Clerk refreshes every 1 minute)
2. Force user to sign out and back in
3. Verify middleware is reading `req.auth.orgRole`
4. Check database for role update:
   ```sql
   SELECT id, email, role FROM users WHERE id = 'user-id';
   ```

---

## 📚 API Documentation

### User Management Endpoints

```bash
# List all users in organization
GET /api/users
Authorization: Bearer <token>
Response: [{ id, email, role, createdAt, lastLogin }]

# Update user role
PUT /api/users/:id/role
Authorization: Bearer <token>
Body: { role: "admin" | "member" | "viewer" }
Response: { id, email, role }

# Remove user from organization
DELETE /api/users/:id
Authorization: Bearer <token>
Response: { success: true }

# Get permission matrix
GET /api/users/roles/permissions
Authorization: Bearer <token>
Response: { owner: [...], admin: [...], member: [...], viewer: [...] }
```

### Invitation Endpoints

```bash
# Send user invitation
POST /api/invitations
Authorization: Bearer <token>
Body: { email: string, role: string }
Response: { id, email, role, token, expiresAt }

# List pending invitations
GET /api/invitations
Authorization: Bearer <token>
Response: [{ id, email, role, status, createdAt }]

# Cancel invitation
DELETE /api/invitations/:id
Authorization: Bearer <token>
Response: { success: true }
```

---

## 🎯 Success Criteria

Phase 3 deployment is successful when:

- ✅ Clerk webhooks trigger tenant provisioning
- ✅ New organizations automatically get tenant schemas
- ✅ Users can switch between organizations via UI
- ✅ Invitations send email and allow signup
- ✅ Role changes reflect immediately (after JWT refresh)
- ✅ Tenant isolation verified (no cross-org data access)
- ✅ RBAC enforced on all protected routes
- ✅ Audit logs capture all role changes

---

## 🔗 Related Documentation

- [Multi-Tenant Setup Guide](MULTI_TENANT_SETUP_GUIDE.md) - Database schema overview
- [CAPLIQUIFY Migration Guide](CAPLIQUIFY_MIGRATION_GUIDE.md) - Complete migration reference
- [Phase 3 Retrospective](../bmad/retrospectives/2025-10-23-phase-3-complete.md) - Implementation details
- [Clerk Documentation](https://clerk.com/docs) - Official Clerk guides

---

## 📞 Support

For deployment issues:
1. Check troubleshooting section above
2. Review Render logs for error messages
3. Verify all environment variables are set
4. Test individual components (webhooks, provisioning, email) separately

**Emergency Rollback**:
```bash
# If Phase 3 deployment causes issues, temporarily disable webhooks:
# In Clerk dashboard → Webhooks → Disable endpoint
# This prevents new tenant provisioning while you debug
```
