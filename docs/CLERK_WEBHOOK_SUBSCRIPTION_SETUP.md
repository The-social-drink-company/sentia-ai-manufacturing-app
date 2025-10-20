# Clerk Webhook & Subscription Setup Guide

## Overview

This guide walks you through setting up Clerk webhooks and subscription management for the Sentia Dashboard application.

**Pricing Model:**
- $295/month per account (not per user)
- 14-day free trial
- Alpha pricing for initial client
- Multi-tenant SaaS architecture

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Clerk Dashboard Configuration](#clerk-dashboard-configuration)
4. [Environment Variables](#environment-variables)
5. [Testing Webhooks](#testing-webhooks)
6. [Subscription Management](#subscription-management)

---

## Prerequisites

- Clerk account (https://clerk.com)
- Render backend deployed and accessible
- Database access (PostgreSQL on Render)
- Access to Clerk dashboard

---

## Database Setup

### Step 1: Add Clerk Fields to Existing Models

Update your `prisma/schema.prisma` file:

```prisma
model User {
  // Add this field to existing User model
  clerkUserId String? @unique @map("clerk_user_id")

  // ... rest of existing fields ...
}

model Organization {
  // Add these fields to existing Organization model
  clerkOrgId   String?        @unique @map("clerk_org_id")
  slug         String?        @unique
  subscription Subscription? // Add this relation

  // ... rest of existing fields ...
}
```

### Step 2: Add Subscription Models

Add these new models to `prisma/schema.prisma`:

```prisma
model Subscription {
  id             String       @id @default(uuid())
  organizationId String       @unique @map("organization_id")
  organization   Organization @relation(fields: [organizationId], references: [id])

  // Subscription Details
  tier     String // ALPHA, PRO, ENTERPRISE
  status   String // trialing, active, past_due, canceled, unpaid

  // Pricing (in cents: $295.00 = 29500)
  pricePerMonth Int     @map("price_per_month")
  currency      String  @default("USD")

  // Billing Periods
  currentPeriodStart DateTime  @map("current_period_start")
  currentPeriodEnd   DateTime  @map("current_period_end")
  trialStart         DateTime? @map("trial_start")
  trialEnd           DateTime? @map("trial_end")

  // Cancellation
  cancelAtPeriodEnd Boolean   @default(false) @map("cancel_at_period_end")
  canceledAt        DateTime? @map("canceled_at")
  cancelReason      String?   @map("cancel_reason")

  // Payment Integration
  stripeCustomerId     String? @unique @map("stripe_customer_id")
  stripeSubscriptionId String? @unique @map("stripe_subscription_id")
  paymentMethod        String? @map("payment_method")

  // Usage Tracking
  usageData Json? @map("usage_data") @db.Json

  // Metadata
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([organizationId])
  @@index([status])
  @@map("subscriptions")
}

model SubscriptionInvoice {
  id             String @id @default(uuid())
  subscriptionId String @map("subscription_id")

  // Invoice Details
  invoiceNumber String @unique @map("invoice_number")
  amount        Int // Amount in cents
  currency      String @default("USD")
  status        String // draft, open, paid, void

  // Billing Period
  periodStart DateTime @map("period_start")
  periodEnd   DateTime @map("period_end")

  // Payment
  dueDate DateTime  @map("due_date")
  paidAt  DateTime? @map("paid_at")

  // Integration
  stripeInvoiceId  String? @unique @map("stripe_invoice_id")
  hostedInvoiceUrl String? @map("hosted_invoice_url")
  invoicePdfUrl    String? @map("invoice_pdf_url")

  // Metadata
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([subscriptionId])
  @@index([status])
  @@index([dueDate])
  @@map("subscription_invoices")
}
```

### Step 3: Run Migrations

```bash
# Format the schema
npx prisma format

# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_clerk_subscriptions

# For production (Render)
npx prisma migrate deploy
```

---

## Clerk Dashboard Configuration

### Step 1: Get Your Clerk Keys

1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **API Keys**
4. Copy these values:
   - `Publishable key` → `VITE_CLERK_PUBLISHABLE_KEY`
   - `Secret key` → `CLERK_SECRET_KEY`

### Step 2: Generate Webhook Signing Secret

1. In Clerk Dashboard, navigate to **Webhooks**
2. Click **+ Add Endpoint**
3. Configure the endpoint:
   ```
   Endpoint URL: https://capliquify-backend-prod.onrender.com/api/webhooks/clerk
   ```

4. Subscribe to these events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
   - ✅ `organization.created` ⭐ **IMPORTANT**
   - ✅ `organization.updated`
   - ✅ `organization.deleted`
   - ✅ `organizationMembership.created`
   - ✅ `organizationMembership.deleted`

5. Click **Create**
6. Copy the **Signing Secret** → `CLERK_WEBHOOK_SECRET`

### Step 3: Enable Organizations

1. In Clerk Dashboard, navigate to **Organizations**
2. Enable Organizations for your application
3. Configure organization settings:
   - **Name**: Required
   - **Slug**: Auto-generated
   - **Logo**: Optional
   - **Metadata**: Enabled

---

## Environment Variables

### Add to Render Environment Variables

Go to Render Dashboard → Your Backend Service → Environment:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
CLERK_SECRET_KEY=sk_test_... (or sk_live_...)
CLERK_WEBHOOK_SECRET=whsec_...

# Application
NODE_ENV=production
PORT=10000
DATABASE_URL=[Already set by Render]

# Optional: Development bypass
VITE_DEVELOPMENT_MODE=false
```

### Local Development (.env)

```bash
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL=postgresql://...

# Server
NODE_ENV=development
PORT=10000
VITE_DEVELOPMENT_MODE=true
```

---

## Testing Webhooks

### Using Clerk Dashboard

1. Navigate to **Webhooks** in Clerk Dashboard
2. Click on your webhook endpoint
3. Click **Testing** tab
4. Select an event type (e.g., `organization.created`)
5. Click **Send Example**
6. Check the **Response** tab for status

### Using Svix CLI (Local Development)

```bash
# Install Svix CLI
npm install -g svix

# Listen for webhooks
svix listen http://localhost:10000/api/webhooks/clerk --secret whsec_...
```

### Manual Testing with cURL

```bash
# Test webhook endpoint (without signature - will fail verification)
curl -X POST https://capliquify-backend-prod.onrender.com/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: msg_test" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: v1,test" \
  -d '{
    "type": "organization.created",
    "data": {
      "id": "org_test123",
      "name": "Test Company",
      "slug": "test-company"
    }
  }'
```

---

## Subscription Management

### Subscription Flow

1. **User Signs Up**
   - Clerk creates user account
   - Webhook: `user.created` → Creates User in database

2. **Organization Created**
   - User creates organization in Clerk
   - Webhook: `organization.created` → Creates Organization + Subscription
   - **Subscription Status**: `trialing` (14-day free trial)
   - **Price**: $295/month (29500 cents)

3. **Trial Period** (14 days)
   - Full access to all features
   - No payment required
   - Status: `trialing`

4. **Trial Ends**
   - Manual process: Contact client for payment setup
   - Update subscription status to `active` after payment confirmed
   - Or set status to `past_due` if no payment

5. **Active Subscription**
   - Status: `active`
   - Monthly billing cycle
   - Full feature access

6. **Cancellation**
   - Set `cancelAtPeriodEnd = true`
   - Access continues until period end
   - Status changes to `canceled` after period ends

### API Endpoints

#### Get Subscription Status

```http
GET /api/webhooks/subscription/status
Authorization: Bearer <clerk_token>
```

**Response:**
```json
{
  "status": "trialing",
  "tier": {
    "name": "Alpha",
    "price": 29500,
    "currency": "USD",
    "features": [...],
    "limits": {
      "users": 10,
      "apiCallsPerMonth": 100000,
      "dataRetentionMonths": 24
    }
  },
  "billing": {
    "currentPeriodStart": "2025-10-19T00:00:00Z",
    "currentPeriodEnd": "2025-11-19T00:00:00Z",
    "trialEnd": "2025-11-02T00:00:00Z",
    "canceledAt": null
  }
}
```

### Updating Subscription Status (Admin Only)

Use Prisma Studio or direct database access to update subscription status:

```typescript
// After receiving payment confirmation
await prisma.subscription.update({
  where: { organizationId: 'org_...' },
  data: {
    status: 'active',
    trialEnd: new Date(), // End trial
    paymentMethod: 'STRIPE', // or 'MANUAL', 'INVOICE'
    stripeCustomerId: 'cus_...', // if using Stripe
    stripeSubscriptionId: 'sub_...' // if using Stripe
  }
})
```

### Subscription Lifecycle Management

```typescript
// Cancel subscription at period end
await prisma.subscription.update({
  where: { organizationId: 'org_...' },
  data: {
    cancelAtPeriodEnd: true,
    cancelReason: 'Customer requested'
  }
})

// Immediately cancel subscription
await prisma.subscription.update({
  where: { organizationId: 'org_...' },
  data: {
    status: 'canceled',
    canceledAt: new Date(),
    cancelReason: 'Non-payment'
  }
})

// Reactivate subscription
await prisma.subscription.update({
  where: { organizationId: 'org_...' },
  data: {
    status: 'active',
    cancelAtPeriodEnd: false,
    canceledAt: null
  }
})
```

---

## Webhook Event Handlers

The webhook handler (`server/routes/clerk-webhooks.js`) processes these events:

| Event | Action |
|-------|--------|
| `user.created` | Create User record in database |
| `user.updated` | Update User information |
| `user.deleted` | Soft delete User |
| `organization.created` | Create Organization + Subscription (trial) |
| `organization.updated` | Update Organization details |
| `organization.deleted` | Cancel subscription, soft delete Organization |
| `organizationMembership.created` | Link User to Organization |
| `organizationMembership.deleted` | Unlink User from Organization |

---

## Monitoring & Debugging

### Check Webhook Delivery

1. Clerk Dashboard → **Webhooks**
2. Click your endpoint
3. View **Attempts** tab
4. See delivery status, response codes, payloads

### Check Database

```sql
-- Check subscriptions
SELECT
  o.name,
  s.tier,
  s.status,
  s.price_per_month / 100.0 AS price_dollars,
  s.trial_end,
  s.current_period_end
FROM subscriptions s
JOIN organizations o ON s.organization_id = o.id;

-- Check users with organizations
SELECT
  u.email,
  u.first_name,
  u.last_name,
  o.name AS organization
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id;
```

### Logs

Check Render logs for webhook processing:
```bash
# Via Render Dashboard
Services → sentia-backend-prod → Logs

# Look for:
[Webhook] Received event: organization.created
[Webhook] Organization created with Alpha subscription
```

---

## Troubleshooting

### Webhook Signature Verification Failed

**Problem:** `Webhook signature verification failed`

**Solution:**
1. Verify `CLERK_WEBHOOK_SECRET` is correct
2. Check Clerk Dashboard → Webhooks → Your Endpoint → Signing Secret
3. Ensure secret matches environment variable

### Organization Not Creating Subscription

**Problem:** Organization created but no subscription

**Solution:**
1. Check webhook delivery in Clerk Dashboard
2. Verify `organization.created` event is subscribed
3. Check Render logs for errors
4. Verify database connection

### User Limit Exceeded

**Problem:** Can't add more users to organization

**Solution:**
1. Check current user count:
   ```sql
   SELECT COUNT(*) FROM users WHERE organization_id = '...' AND deleted_at IS NULL;
   ```
2. Alpha tier allows 10 users
3. Upgrade subscription tier or remove inactive users

---

## Next Steps

1. ✅ Deploy webhook handler to Render
2. ✅ Configure Clerk webhooks
3. ✅ Test organization creation flow
4. ⏳ Integrate Stripe for payment processing
5. ⏳ Build subscription management UI
6. ⏳ Set up automated billing reminders

---

## Support

For issues with:
- **Clerk**: https://clerk.com/support
- **Webhooks**: Check Clerk Dashboard → Webhooks → Attempts
- **Database**: Check Render Dashboard → Database → Logs
- **Application**: Check Render Dashboard → Backend → Logs
