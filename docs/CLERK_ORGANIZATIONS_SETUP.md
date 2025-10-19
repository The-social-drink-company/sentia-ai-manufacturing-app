# Clerk Organizations Setup Guide - CapLiquify Multi-Tenant SaaS

**Date**: October 19, 2025
**Feature**: Clerk Organizations for Multi-Tenant Management
**Status**: Phase 3 - Authentication & Tenant Management

---

## 📋 Overview

This guide covers the complete setup and configuration of Clerk Organizations for CapLiquify's multi-tenant architecture. Each Clerk Organization maps to one tenant in the platform.

### Architecture

```
Clerk Organization (clerk.com)
    ↓ (1:1 mapping)
PostgreSQL Tenant (dedicated schema)
    ↓ (contains)
Users, Products, Sales, Inventory, Forecasts, etc.
```

---

## 🔐 Clerk Dashboard Configuration

### Step 1: Enable Organizations

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Configure** → **Organizations**
4. Click **Enable Organizations**

### Step 2: Configure Organization Settings

#### Organization Creation
- **Who can create organizations**: `Anyone` (for self-service onboarding)
- **Maximum organizations per user**: `Unlimited` (or set limit)
- **Default role**: `basic_member`

#### Organization Roles
Configure the following roles:
- **Admin** (`admin`): Full organization management
- **Member** (`basic_member`): Standard user access

#### Organization Permissions
- Enable **Organization Switcher**
- Enable **Organization Invitations**
- Enable **Organization Profile Page**

### Step 3: Configure Webhooks

1. Navigate to **Configure** → **Webhooks**
2. Click **Add Endpoint**
3. Configure:
   - **Endpoint URL**: `https://your-backend-url.onrender.com/api/webhooks/clerk`
   - **Description**: CapLiquify Tenant Provisioning
   - **Events to listen for**:
     - `organization.created` ✅
     - `organization.updated` ✅
     - `organization.deleted` ✅
     - `organizationMembership.created` ✅
     - `organizationMembership.updated` ✅
     - `organizationMembership.deleted` ✅
4. Save and copy the **Signing Secret**

---

## 🔧 Environment Variables

### Frontend (Vite - `.env`)

```env
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# API Configuration
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

### Backend (Node.js - Render Environment Variables)

```env
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Database
DATABASE_URL=postgresql://user:password@host:port/database?schema=public

# Application
NODE_ENV=production
PORT=5000
```

---

## 📦 Installed Dependencies

### Frontend

```json
{
  "@clerk/clerk-react": "^5.49.0",
  "@clerk/themes": "^2.1.38"
}
```

### Backend

```json
{
  "@clerk/backend": "^2.18.3",
  "@clerk/express": "^1.7.35",
  "svix": "^1.77.0"
}
```

---

## 🚀 Implementation Files

### Backend Files

#### 1. Clerk SDK Configuration (`src/lib/clerk.ts`)
- Clerk client initialization
- Session verification helper
- Organization fetching helpers
- Role mapping utilities

#### 2. Tenant Service (`server/services/tenant.service.ts`)
- `createTenant()` - Create tenant with schema
- `updateTenant()` - Update tenant metadata
- `getTenantByClerkOrgId()` - Fetch tenant by Clerk org ID
- `getTenantBySlug()` - Fetch tenant by slug
- `isSlugAvailable()` - Check slug availability
- `softDeleteTenant()` - Soft delete tenant

#### 3. Onboarding API Routes (`server/routes/onboarding.routes.ts`)
- `POST /api/onboarding/create-tenant` - Create new tenant
- `POST /api/onboarding/join-tenant` - Join existing tenant
- `GET /api/onboarding/check-slug/:slug` - Check slug availability
- `GET /api/onboarding/tenant/:clerkOrgId` - Get tenant info

#### 4. Clerk Webhooks (`server/routes/webhooks/clerk.js`)
- `POST /api/webhooks/clerk` - Handle all Clerk events
- Automatic tenant provisioning on org creation
- User-tenant association management
- Idempotent webhook handling

### Frontend Files

#### 5. Onboarding Page (`src/pages/Onboarding.tsx`)
- 2-step onboarding flow
- Organization name and slug configuration
- Subscription tier selection (Starter/Professional/Enterprise)
- Real-time slug availability checking
- Trial activation (14 days)

#### 6. Organization Switcher (`src/components/auth/OrganizationSwitcher.tsx`)
- Dropdown menu showing all user organizations
- Switch between organizations
- Create new organization button
- Current organization indicator

#### 7. App Routes (`src/App-simple-environment.jsx`)
- `/onboarding` route added
- Protected route configuration
- Clerk authentication integration

---

## 🔄 Onboarding Flow

### User Journey

```
1. User Signs Up
   ↓
2. Clerk Creates User Account
   ↓
3. User Creates Organization in Clerk
   ↓
4. Webhook: organization.created
   ↓
5. Backend Provisions Tenant
   - Creates PostgreSQL schema
   - Sets subscription tier
   - Creates default company
   - Adds owner user
   ↓
6. User Redirected to Dashboard
```

### Detailed Steps

#### Step 1: Organization Details
- Enter organization name (e.g., "Acme Manufacturing")
- Auto-generated slug (e.g., "acme-manufacturing")
- Real-time slug validation
- URL preview: `app.capliquify.com/acme-manufacturing`

#### Step 2: Subscription Tier
- **Starter** ($149/mo):
  - Up to 5 users
  - Basic forecasting
  - 2 ERP integrations
  - Email support

- **Professional** ($295/mo) ⭐ Recommended:
  - Unlimited users
  - AI forecasting
  - Unlimited integrations
  - What-If analysis
  - Priority support

- **Enterprise** ($595/mo):
  - Everything in Pro
  - Multi-entity (10)
  - API access
  - White-label
  - Dedicated support

#### Step 3: Confirmation
- 14-day free trial starts automatically
- No credit card required
- Email confirmation sent
- Redirect to dashboard

---

## 🔐 Security Features

### 1. Webhook Verification
```javascript
// Svix signature verification
const wh = new Webhook(CLERK_WEBHOOK_SECRET)
const evt = wh.verify(req.body, headers)
```

### 2. Tenant Isolation
- Each tenant has a dedicated PostgreSQL schema
- Tenant middleware enforces schema-level isolation
- No cross-tenant data access

### 3. Role-Based Access Control (RBAC)
- **Owner**: Full tenant access, billing management
- **Admin**: User management, configuration
- **Member**: Standard feature access
- **Viewer**: Read-only access

### 4. Idempotency
- Webhook handlers are idempotent
- Duplicate events don't create duplicate tenants
- Safe retry mechanism

---

## 🧪 Testing Guide

### Test Webhook Endpoint

```bash
# Test webhook endpoint is reachable
curl https://your-backend-url.onrender.com/api/webhooks/clerk

# Expected: 405 Method Not Allowed (GET not allowed, only POST)
```

### Test Slug Availability

```bash
# Check if slug is available
curl https://your-backend-url.onrender.com/api/onboarding/check-slug/test-company

# Expected:
{
  "success": true,
  "data": {
    "slug": "test-company",
    "available": true
  }
}
```

### Test Tenant Creation (Manual)

```bash
# Create tenant via API
curl -X POST https://your-backend-url.onrender.com/api/onboarding/create-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "clerkOrganizationId": "org_test123",
    "clerkUserId": "user_test123",
    "organizationName": "Test Company",
    "slug": "test-company",
    "subscriptionTier": "professional"
  }'

# Expected:
{
  "success": true,
  "data": {
    "tenant": {
      "id": "...",
      "slug": "test-company",
      "name": "Test Company",
      "subscriptionTier": "professional",
      "subscriptionStatus": "trial",
      "trialEndsAt": "2025-11-02T..."
    },
    "user": {
      "id": "...",
      "email": "user_test123@example.com",
      "role": "owner"
    }
  },
  "message": "Tenant created successfully"
}
```

---

## 📊 Subscription Tiers

### Feature Matrix

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| **Users** | 5 | Unlimited | Unlimited |
| **Max Entities** | 500 | 5,000 | Unlimited |
| **Basic Forecasting** | ✅ | ✅ | ✅ |
| **AI Forecasting** | ❌ | ✅ | ✅ |
| **What-If Analysis** | ❌ | ✅ | ✅ |
| **ERP Integrations** | 2 | Unlimited | Unlimited |
| **Advanced Reports** | ❌ | ✅ | ✅ |
| **Custom Integrations** | ❌ | ❌ | ✅ |
| **API Access** | ❌ | ❌ | ✅ |
| **White-Label** | ❌ | ❌ | ✅ |
| **Support** | Email | Priority | Dedicated |
| **Multi-Entity** | 1 | 1 | 10 |

### Pricing

- **Starter**: $149/month (billed monthly)
- **Professional**: $295/month (billed monthly)
- **Enterprise**: $595/month (billed monthly)

**All tiers include**:
- 14-day free trial
- No credit card required for trial
- Cancel anytime
- Monthly billing

---

## 🔄 Organization Management

### Switch Organizations

Users can switch between organizations using the Organization Switcher in the header:

```tsx
import { OrganizationSwitcher } from '@/components/auth/OrganizationSwitcher'

<OrganizationSwitcher />
```

### Create New Organization

From the organization switcher dropdown, click **"Create New Organization"** to be redirected to `/onboarding`.

### Invite Users

1. In Clerk dashboard or via API
2. Send invitation to email
3. User accepts invitation
4. Webhook: `organizationMembership.created`
5. Backend adds user to tenant with assigned role

---

## 🐛 Troubleshooting

### Webhook Not Triggering

**Problem**: Organization created but no tenant provisioned

**Solution**:
1. Check webhook endpoint in Clerk dashboard
2. Verify `CLERK_WEBHOOK_SECRET` environment variable
3. Check backend logs for webhook errors
4. Test endpoint manually with curl

### Slug Already Taken

**Problem**: Slug validation shows available but creation fails

**Solution**:
- Race condition - another user claimed the slug
- Frontend re-checks availability on submit
- Show error message and suggest alternative slug

### Tenant Not Found

**Problem**: User sees "Tenant not found" error

**Solution**:
1. Check if organization exists in Clerk
2. Verify tenant exists in database: `SELECT * FROM tenants WHERE clerk_organization_id = 'org_xxx'`
3. Check webhook logs for provisioning errors
4. Manually provision tenant if needed

### Permission Denied

**Problem**: User cannot access features

**Solution**:
1. Check user role in database
2. Verify feature flags for subscription tier
3. Check `tenant.features` JSON field
4. Ensure user is member of correct organization

---

## 📚 Additional Resources

- [Clerk Organizations Documentation](https://clerk.com/docs/organizations/overview)
- [Clerk Webhooks Guide](https://clerk.com/docs/integrations/webhooks/overview)
- [CapLiquify Architecture Docs](./CAPLIQUIFY_MIGRATION_GUIDE.md)
- [Multi-Tenant Setup Guide](./MULTI_TENANT_SETUP_GUIDE.md)

---

**Documentation Updated**: October 19, 2025
**Version**: 1.0.0
**Status**: Production Ready

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
