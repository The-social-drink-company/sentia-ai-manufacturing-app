# Phase 6: Billing & Subscriptions (Stripe) Deployment Guide

**Date**: October 23, 2025
**Phase**: Phase 6 (Billing & Subscriptions)
**Epic**: BMAD-MULTITENANT-004
**Status**: ✅ Complete (leveraging EPIC-008 infrastructure)
**Target Audience**: DevOps, System Administrators, Finance/Billing Teams

---

## 📋 Overview

This guide provides step-by-step instructions for deploying the complete Stripe billing integration for CapLiquify's multi-tenant SaaS platform. Phase 6 delivers subscription management, trial automation, payment processing, and webhook integration.

**Key Achievement**: Phase 6 was completed in **1 hour vs 8-10 hours estimated** (10x velocity) by intelligently **reusing existing EPIC-008 infrastructure** (1,210+ lines of production-ready code).

### What Phase 6 Delivers

- ✅ Stripe product & price configuration for 3 tiers (Starter/Professional/Enterprise)
- ✅ Subscription management (create, upgrade, downgrade, cancel)
- ✅ 14-day trial automation with email reminders
- ✅ Webhook processing for 6+ critical events
- ✅ Payment recovery with 3-attempt dunning
- ✅ Customer portal integration
- ✅ Real-time database synchronization (Stripe ↔ PostgreSQL)

**Total Infrastructure**: 1,510+ lines (300 new + 1,210 from EPIC-008)

---

## 🏗️ Architecture Overview

### Billing System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Stripe Platform                          │
│  - Products & Prices                                        │
│  - Subscriptions                                            │
│  - Customer Portal                                          │
│  - Webhooks                                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Webhooks (HTTPS)
                   ↓
┌─────────────────────────────────────────────────────────────┐
│              CapLiquify Backend API                         │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │ Webhook Handler (363 lines)                  │          │
│  │  - Signature verification                    │          │
│  │  - Event routing                             │          │
│  │  - Database sync                             │          │
│  │  - Email notifications                       │          │
│  └──────────────┬───────────────────────────────┘          │
│                 │                                           │
│  ┌──────────────┴───────────────────────────────┐          │
│  │                                                │          │
│  ↓                                               ↓          │
│  Subscription Manager (448 lines)    Stripe Service (444)  │
│  - Business logic                    - API wrapper         │
│  - Upgrade/downgrade                 - SDK integration     │
│  - Proration                         - Mock mode           │
│  - Rollback                                                │
│                 │                                           │
│                 ↓                                           │
│  Subscription Repository (318 lines)                       │
│  - Database CRUD                                           │
│  - Tenant limit updates                                    │
│  - Payment logging                                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│           PostgreSQL (Public Schema)                        │
│  - subscriptions table                                      │
│  - payments table                                           │
│  - tenants table (with tier limits)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Prerequisites

### Required Accounts

1. **Stripe Account** (Production)
   - Organization: https://stripe.com
   - Account type: Standard account (for Connect features)
   - Bank account verified for payouts

2. **CapLiquify Deployment**
   - Phases 1-5 complete (Database, Backend, Auth, Marketing, Admin)
   - PostgreSQL with `subscriptions` and `payments` tables
   - Email service configured (SendGrid/SES)

### Required Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxxxx                  # Stripe live secret key
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx            # Stripe live publishable key
STRIPE_WEBHOOK_SECRET=whsec_xxxxx               # Webhook signing secret
STRIPE_STARTER_PRICE_ID=price_xxxxx             # Starter tier price ID
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx        # Professional tier price ID
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx          # Enterprise tier price ID

# Application
DATABASE_URL=postgresql://user:pass@host/db      # Main database URL
FRONTEND_URL=https://app.capliquify.com         # For redirects
API_BASE_URL=https://api.capliquify.com

# Email (for billing notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_FROM_EMAIL=billing@capliquify.com
```

---

## 🚀 Deployment Steps

### Step 1: Create Stripe Products & Prices (30 minutes)

#### 1.1 Set Up Stripe Test Mode

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle to **Test Mode** (top right)
3. Note your test API keys:
   - **Secret key**: `sk_test_xxxxx`
   - **Publishable key**: `pk_test_xxxxx`

#### 1.2 Run Automated Setup Script

The `stripe-setup.js` script creates all products and prices automatically:

```bash
# From project root (local or Render shell)
# Export test keys first
export STRIPE_SECRET_KEY=sk_test_xxxxx

# Run setup script
node scripts/stripe-setup.js --test

# Expected output:
# ✅ Stripe connected successfully
# ✅ Created product: CapLiquify Starter (prod_xxxxx)
#    ├─ Monthly price: $29/month (price_xxxxx)
#    └─ Annual price: $290/year (price_xxxxx)
# ✅ Created product: CapLiquify Professional (prod_xxxxx)
#    ├─ Monthly price: $99/month (price_xxxxx)
#    └─ Annual price: $990/year (price_xxxxx)
# ✅ Created product: CapLiquify Enterprise (prod_xxxxx)
#    ├─ Monthly price: $299/month (price_xxxxx)
#    └─ Annual price: $2,990/year (price_xxxxx)
# ✅ Setup complete! Add these price IDs to your environment variables.
```

#### 1.3 Save Price IDs

Copy the price IDs from the script output and add to Render:

```bash
# In Render Dashboard → Backend API → Environment
STRIPE_STARTER_PRICE_ID=price_xxxxx              # Monthly Starter
STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxxxx       # Annual Starter
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx         # Monthly Professional
STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_xxxxx  # Annual Professional
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx           # Monthly Enterprise
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=price_xxxxx    # Annual Enterprise
```

**✅ Success Indicator**: All 6 price IDs saved in environment variables

---

### Step 2: Configure Stripe Webhooks (20 minutes)

#### 2.1 Create Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Configure:
   ```
   Endpoint URL: https://api.capliquify.com/api/webhooks/stripe
   Description: CapLiquify Billing Webhooks

   Events to send:
     ✅ customer.subscription.created
     ✅ customer.subscription.updated
     ✅ customer.subscription.deleted
     ✅ customer.subscription.trial_will_end
     ✅ invoice.payment_succeeded
     ✅ invoice.payment_failed
     ✅ checkout.session.completed (optional)
   ```
4. Click **Add endpoint**
5. Copy the **Signing secret** (starts with `whsec_`)

#### 2.2 Add Webhook Secret to Render

```bash
# In Render Dashboard → Backend API → Environment
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

Service will auto-redeploy.

#### 2.3 Verify Webhook Endpoint

```bash
# Test webhook endpoint is accessible
curl https://api.capliquify.com/api/webhooks/stripe

# Expected response:
# {"error":"No Stripe signature found"}
# (This is correct - it means endpoint is live)
```

#### 2.4 Send Test Event

1. In Stripe Dashboard → Webhooks → Your endpoint
2. Click **Send test webhook**
3. Select event: `customer.subscription.created`
4. Click **Send test webhook**
5. Check Render logs for processing confirmation

**✅ Success Indicator**: 200 response in Stripe webhook delivery log

---

### Step 3: Configure Stripe Customer Portal (15 minutes)

The customer portal allows users to manage their own subscriptions without admin intervention.

#### 3.1 Enable Customer Portal

1. In Stripe Dashboard, go to **Settings** → **Billing** → **Customer portal**
2. Click **Activate test link** (for test mode)
3. Configure features:
   ```
   ✅ Update payment method
   ✅ View invoices
   ✅ Cancel subscription
   ✅ Update subscription (upgrade/downgrade)

   Cancellation behavior:
   ○ Cancel immediately
   ● Cancel at period end (recommended)

   Subscription updates:
   ✅ Allow switching between products
   Proration: Charge for remaining time (recommended)
   ```
4. Click **Save changes**

#### 3.2 Test Customer Portal

```bash
# Create portal session via API
curl -X POST https://api.capliquify.com/api/stripe/create-portal-session \
  -H "Authorization: Bearer <test-user-token>" \
  -H "Content-Type: application/json"

# Expected response:
# {"url":"https://billing.stripe.com/session/xxxxx"}

# Visit the URL to test portal
```

**✅ Success Indicator**: Portal loads and shows subscription details

---

### Step 4: Test Subscription Flow End-to-End (60 minutes)

#### 4.1 Create Test Subscription

1. Sign in to CapLiquify app (test environment)
2. Go to **Billing** or **Upgrade** page
3. Click **Start 14-Day Trial** for Professional tier
4. Use Stripe test card:
   ```
   Card number: 4242 4242 4242 4242
   Expiry: Any future date
   CVC: Any 3 digits
   ZIP: Any 5 digits
   ```
5. Complete checkout

**Verification**:
```sql
-- Check subscription was created
SELECT id, tenant_id, stripe_subscription_id, tier, status, trial_end_date
FROM subscriptions
WHERE tenant_id = 'your-tenant-id';

-- Expected: status='trialing', trial_end_date ~ 14 days from now
```

#### 4.2 Test Trial Ending Reminder

**Stripe fires `trial_will_end` webhook 3 days before trial ends.**

To test immediately:
1. In Stripe Dashboard → Customers → Your test customer → Subscriptions
2. Click **⋮** menu → **Update subscription**
3. Change trial end to 4 days from now
4. Save changes
5. Wait 24 hours OR manually trigger webhook:
   - Go to Webhooks → Your endpoint → Send test webhook
   - Select `customer.subscription.trial_will_end`
   - Use your subscription ID in the payload

**Verification**:
- Check email inbox for "Your trial is ending soon" email
- Check Render logs for webhook processing

#### 4.3 Test Trial Conversion (Payment Success)

**Stripe automatically attempts payment when trial ends.**

To test immediately:
1. In Stripe Dashboard → Subscriptions → Your test subscription
2. Click **⋮** menu → **End trial**
3. Select **Charge immediately**
4. Stripe will:
   - Create invoice
   - Charge payment method (test card always succeeds)
   - Fire `invoice.payment_succeeded` webhook
   - Update subscription status to `active`

**Verification**:
```sql
-- Check subscription activated
SELECT id, status, current_period_start, current_period_end
FROM subscriptions
WHERE stripe_subscription_id = 'sub_xxxxx';

-- Check payment logged
SELECT id, amount, status, stripe_invoice_id
FROM payments
WHERE subscription_id = 'your-subscription-id'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- `subscriptions.status` = `'active'`
- `payments` table has new record with `status='succeeded'`
- Email sent: "Payment successful"

#### 4.4 Test Upgrade Flow

1. In CapLiquify app, go to **Billing**
2. Click **Upgrade to Enterprise**
3. Confirm upgrade
4. Verify:
   - Stripe subscription updated (view in Dashboard)
   - Database `subscriptions.tier` = `'enterprise'`
   - Tenant limits increased (e.g., `max_users` now 100)
   - Email sent: "Subscription upgraded"

**API Test**:
```bash
curl -X POST https://api.capliquify.com/api/subscriptions/upgrade \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "newTier": "enterprise",
    "billingCycle": "monthly"
  }'

# Expected response:
# {
#   "success": true,
#   "subscription": {...},
#   "prorationAmount": 16666,  # Prorated charge in cents
#   "effectiveDate": "2025-10-23T12:00:00Z"
# }
```

#### 4.5 Test Downgrade Flow

1. In CapLiquify app, go to **Billing**
2. Click **Change Plan** → **Starter**
3. Confirm downgrade
4. Verify:
   - Subscription status: `'active'` (no immediate change)
   - Stripe subscription has schedule: downgrade at period end
   - Database records scheduled change
   - Email sent: "Downgrade scheduled for [date]"

**Verification**:
```sql
SELECT id, tier, status, scheduled_tier_change, scheduled_change_date
FROM subscriptions
WHERE tenant_id = 'your-tenant-id';

-- Expected:
-- tier: 'enterprise' (current)
-- scheduled_tier_change: 'starter'
-- scheduled_change_date: <period_end_date>
```

#### 4.6 Test Payment Failure & Dunning

Stripe test card for declined payment: `4000 0000 0000 0341`

1. Update payment method to declined card:
   - Customer Portal → Update payment method
   - Use card `4000 0000 0000 0341`
2. Trigger invoice (end trial or wait for renewal)
3. Stripe will:
   - Attempt charge (fails)
   - Fire `invoice.payment_failed` webhook
   - Start dunning process (3 attempts over 7 days)

**Verification**:
- Email sent: "Payment failed - please update payment method"
- Database `subscriptions.status` = `'past_due'`
- App shows banner: "Payment issue - update payment method"

**Stripe's automatic dunning**:
- Day 1: First attempt (failed)
- Day 4: Second attempt
- Day 7: Third attempt
- Day 8: Subscription cancelled if all 3 fail

---

### Step 5: Production Deployment (30 minutes)

#### 5.1 Switch to Live Mode in Stripe

1. In Stripe Dashboard, toggle to **Live Mode**
2. Complete account verification if not done:
   - Business details
   - Bank account for payouts
   - Tax information

#### 5.2 Run Setup Script in Live Mode

```bash
# Export LIVE API keys
export STRIPE_SECRET_KEY=sk_live_xxxxx

# Run setup script (production)
node scripts/stripe-setup.js --production

# Confirm when prompted:
# "⚠️  You are about to create products in LIVE mode. Continue? (y/N)"
# Type: y
```

**✅ Success Indicator**: 6 live price IDs created

#### 5.3 Update Production Environment Variables

In Render Dashboard → Backend API → Environment:

```bash
# Replace test keys with live keys
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (from live webhook endpoint)

# Update price IDs with live price IDs
STRIPE_STARTER_PRICE_ID=price_live_xxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_live_xxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_live_xxxxx
(repeat for annual)
```

Service auto-redeploys.

#### 5.4 Create Live Webhook Endpoint

1. In Stripe Dashboard (Live Mode) → Webhooks
2. Add endpoint: `https://api.capliquify.com/api/webhooks/stripe`
3. Select same 6 events as test mode
4. Copy new signing secret → Add to Render as `STRIPE_WEBHOOK_SECRET`

#### 5.5 Configure Live Customer Portal

1. Settings → Billing → Customer portal (Live Mode)
2. Activate portal
3. Configure same settings as test mode
4. Save changes

**✅ Production Ready**: Live mode fully configured

---

## 📊 Monitoring & Alerts

### Stripe Dashboard

Monitor key metrics:
- **Home** → Payments (successful vs failed)
- **Customers** → Subscription count by tier
- **Revenue Recognition** → MRR (Monthly Recurring Revenue)
- **Webhooks** → Delivery success rate (should be >99%)

### Database Queries

```sql
-- Active subscriptions by tier
SELECT tier, COUNT(*) as count
FROM subscriptions
WHERE status IN ('active', 'trialing')
GROUP BY tier;

-- MRR calculation
SELECT tier,
       COUNT(*) as subscribers,
       CASE tier
         WHEN 'starter' THEN 29
         WHEN 'professional' THEN 99
         WHEN 'enterprise' THEN 299
       END * COUNT(*) as mrr
FROM subscriptions
WHERE status = 'active' AND billing_cycle = 'monthly'
GROUP BY tier;

-- Failed payments (last 30 days)
SELECT COUNT(*), SUM(amount) as lost_revenue
FROM payments
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL '30 days';

-- Trial conversion rate
SELECT
  COUNT(CASE WHEN status = 'trialing' THEN 1 END) as active_trials,
  COUNT(CASE WHEN status = 'active' AND trial_end_date IS NOT NULL THEN 1 END) as converted,
  ROUND(100.0 * COUNT(CASE WHEN status = 'active' AND trial_end_date IS NOT NULL THEN 1 END) /
        NULLIF(COUNT(CASE WHEN status = 'trialing' OR (status = 'active' AND trial_end_date IS NOT NULL) THEN 1 END), 0), 2) as conversion_rate_percent
FROM subscriptions;
```

### Email Alerts

Configure alerts for critical events:
1. Payment failures >3 in 1 hour → Alert finance team
2. Webhook delivery failures >10% → Alert DevOps
3. Subscription cancellations >5 per day → Alert product team

---

## 🐛 Troubleshooting

### Webhook Not Received

**Symptom**: Subscription created in Stripe, but not in database

**Solutions**:
1. Check Render logs for webhook errors:
   ```bash
   # In Render dashboard → Logs
   # Search for: "Stripe webhook"
   ```
2. Verify webhook endpoint in Stripe Dashboard:
   - Webhooks → Your endpoint → Recent deliveries
   - Look for 4xx/5xx errors
3. Test webhook secret:
   ```bash
   # Verify secret matches
   echo $STRIPE_WEBHOOK_SECRET  # In Render shell
   # Compare with Stripe Dashboard → Webhooks → Signing secret
   ```
4. Manual retry:
   - Stripe Dashboard → Webhooks → Failed delivery → Retry

### Payment Method Declined (Test Mode)

**Symptom**: Test payment fails unexpectedly

**Solutions**:
1. Use correct test card:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Full list: https://stripe.com/docs/testing#cards
2. Check Stripe logs:
   - Stripe Dashboard → Payments → Failed → View details
3. Verify 3D Secure not required (unless testing)

### Subscription Status Out of Sync

**Symptom**: Database shows `active`, Stripe shows `past_due`

**Solutions**:
1. Re-sync from Stripe:
   ```bash
   node scripts/sync-subscriptions.js --tenant-id=<id>
   ```
2. Check for missed webhooks:
   - Stripe Dashboard → Webhooks → Recent deliveries
   - Manually replay failed events
3. Verify database transaction completed:
   ```sql
   SELECT * FROM subscriptions WHERE stripe_subscription_id = 'sub_xxxxx';
   ```

### Proration Calculation Incorrect

**Symptom**: User charged wrong amount on upgrade

**Solutions**:
1. Check proration preview:
   ```bash
   curl -X POST https://api.capliquify.com/api/subscriptions/preview-upgrade \
     -H "Authorization: Bearer <token>" \
     -d '{"newTier":"professional"}'
   ```
2. Verify Stripe settings:
   - Settings → Billing → Proration behavior
   - Should be: "Charge immediately for upgraded service"
3. Check subscription schedule conflicts:
   - Stripe Dashboard → Subscription → View schedule
   - Cancel any conflicting schedules

---

## 📚 API Reference

### Subscription Management Endpoints

```bash
# Create subscription (via Stripe Checkout)
POST /api/subscriptions/checkout
Authorization: Bearer <token>
Body: { tier: "professional", billingCycle: "monthly" }
Response: { checkoutUrl: "https://checkout.stripe.com/..." }

# Preview upgrade
POST /api/subscriptions/preview-upgrade
Authorization: Bearer <token>
Body: { newTier: "enterprise", billingCycle: "monthly" }
Response: { prorationAmount: 16666, effectiveDate: "..." }

# Process upgrade
POST /api/subscriptions/upgrade
Authorization: Bearer <token>
Body: { newTier: "enterprise", billingCycle: "monthly" }
Response: { subscription: {...}, prorationAmount: 16666 }

# Schedule downgrade
POST /api/subscriptions/downgrade
Authorization: Bearer <token>
Body: { newTier: "starter" }
Response: { subscription: {...}, effectiveDate: "..." }

# Cancel subscription
DELETE /api/subscriptions
Authorization: Bearer <token>
Query: ?immediate=false (default: cancel at period end)
Response: { subscription: {...}, cancelAt: "..." }

# Get customer portal URL
POST /api/stripe/create-portal-session
Authorization: Bearer <token>
Response: { url: "https://billing.stripe.com/session/..." }
```

---

## 🎯 Success Criteria

Phase 6 deployment is successful when:

- ✅ All 3 pricing tiers created in Stripe (live mode)
- ✅ Webhooks delivering successfully (>99% success rate)
- ✅ Trial subscriptions auto-expire after 14 days
- ✅ Payments processing correctly (test with real card in production)
- ✅ Database stays in sync with Stripe
- ✅ Upgrade/downgrade flows work end-to-end
- ✅ Customer portal accessible and functional
- ✅ Email notifications sent for all billing events
- ✅ MRR tracking accurate in both Stripe and database

---

## 🔗 Related Documentation

- [STRIPE_CONFIGURATION.md](../docs/STRIPE_CONFIGURATION.md) - Detailed setup guide (650+ lines)
- [Multi-Tenant Setup Guide](MULTI_TENANT_SETUP_GUIDE.md) - Database schema
- [Phase 6 Retrospective](../bmad/retrospectives/2025-10-23-BMAD-MULTITENANT-004-retrospective.md)
- [Stripe Documentation](https://stripe.com/docs) - Official Stripe guides
- [EPIC-008 Feature Gating](../bmad/epics/EPIC-008-feature-gating.md) - Infrastructure details

---

## 💰 Pricing Tiers (Reference)

| Tier | Monthly | Annual | Users | Entities | Key Features |
|------|---------|--------|-------|----------|--------------|
| **Starter** | $29 | $290 (17% off) | 5 | 500 | Basic integrations, working capital tracking |
| **Professional** | $99 | $990 (17% off) | 25 | 5,000 | AI forecasting, what-if analysis, priority support |
| **Enterprise** | $299 | $2,990 (17% off) | 100 | Unlimited | Custom integrations, advanced reports, dedicated CSM |

**Trial**: 14 days free (all tiers), credit card required

---

## 📞 Support

For billing deployment issues:
1. Check troubleshooting section above
2. Review Stripe Dashboard → Webhooks for delivery errors
3. Check Render logs for application errors
4. Verify all environment variables set correctly

**Emergency Pause**:
```bash
# If billing system malfunctioning, disable webhooks temporarily:
# Stripe Dashboard → Webhooks → Your endpoint → Disable
# This prevents new subscriptions while you debug (existing ones unaffected)
```

**Rollback to Test Mode**:
```bash
# Replace live keys with test keys in Render
# Service will redeploy and use Stripe test mode
```
