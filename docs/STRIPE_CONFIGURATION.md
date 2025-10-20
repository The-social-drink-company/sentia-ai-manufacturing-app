# Stripe Configuration Guide

**BMAD-MULTITENANT-004 Story 1**: Stripe Product & Price Configuration
**Last Updated**: 2025-10-23
**Epic**: Phase 6 - Billing & Subscriptions

---

## Overview

This guide covers the complete Stripe integration setup for CapLiquify multi-tenant SaaS, including:
- Product and price configuration
- Webhook endpoint setup
- Environment variables
- Testing workflows

**Prerequisites**:
- Stripe account (test mode and production mode)
- Node.js 18+ installed
- `npm install stripe` completed

---

## Subscription Tiers & Pricing

### Tier Comparison

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| **Monthly Price** | $49 | $149 | $499 |
| **Annual Price** | - | $1,518 (15% off) | $5,088 (15% off) |
| **Max Users** | 5 | 25 | 100 |
| **Max Entities** | 500 | 5,000 | Unlimited |
| **Trial Period** | 14 days | 14 days | 14 days |
| **Basic Forecasting** | ✅ | ✅ | ✅ |
| **AI Forecasting** | ❌ | ✅ | ✅ |
| **What-If Analysis** | ❌ | ✅ | ✅ |
| **API Integrations** | ✅ | ✅ | ✅ |
| **Advanced Reports** | ❌ | ✅ | ✅ |
| **Custom Integrations** | ❌ | ❌ | ✅ |
| **Support** | Email | Priority Email | Dedicated |

---

## Step 1: Create Stripe Products & Prices

### Automated Setup (Recommended)

```bash
# Test mode (uses STRIPE_SECRET_KEY from .env)
node scripts/stripe-setup.js

# Production mode (uses STRIPE_LIVE_SECRET_KEY from .env)
node scripts/stripe-setup.js --production
```

**Expected Output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CapLiquify Stripe Product & Price Setup
📍 Mode: TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Creating product: Starter...
   ✅ Created product: prod_xyz123

   💰 Creating price: Starter Monthly...
      ✅ Created price: price_abc123 ($49.00/month)

📦 Creating product: Professional...
   ✅ Created product: prod_xyz456

   💰 Creating price: Professional Monthly...
      ✅ Created price: price_abc456 ($149.00/month)

   💰 Creating price: Professional Annual...
      ✅ Created price: price_abc789 ($1,518.30/year)

📦 Creating product: Enterprise...
   ✅ Created product: prod_xyz789

   💰 Creating price: Enterprise Monthly...
      ✅ Created price: price_abc012 ($499.00/month)

   💰 Creating price: Enterprise Annual...
      ✅ Created price: price_abc345 ($5,088.30/year)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Environment Variables:
   Copy these to your .env file:

   STRIPE_PRICE_STARTER_MONTH=price_abc123
   STRIPE_PRICE_PROFESSIONAL_MONTH=price_abc456
   STRIPE_PRICE_PROFESSIONAL_YEAR=price_abc789
   STRIPE_PRICE_ENTERPRISE_MONTH=price_abc012
   STRIPE_PRICE_ENTERPRISE_YEAR=price_abc345
```

### Manual Setup (Stripe Dashboard)

If you prefer to create products manually:

1. Navigate to https://dashboard.stripe.com/products
2. Click "Add product"
3. Configure each tier:

**Starter Product**:
```
Name: CapLiquify Starter
Description: Perfect for small manufacturing businesses getting started with working capital optimization

Pricing:
  - Monthly: $49.00/month (recurring)
  - Trial period: 14 days

Metadata:
  tier: starter
  maxUsers: 5
  maxEntities: 500
  features: ["basic_forecasting", "api_integrations", "standard_reports", "email_support"]
```

**Professional Product**:
```
Name: CapLiquify Professional
Description: Advanced AI-powered forecasting and what-if analysis for growing manufacturers

Pricing:
  - Monthly: $149.00/month (recurring)
  - Annual: $1,518.30/year (recurring, 15% discount)
  - Trial period: 14 days

Metadata:
  tier: professional
  maxUsers: 25
  maxEntities: 5000
  features: ["basic_forecasting", "ai_forecasting", "what_if_analysis", "api_integrations", "advanced_reports", "priority_support"]
```

**Enterprise Product**:
```
Name: CapLiquify Enterprise
Description: Unlimited users, custom integrations, and dedicated support for large-scale operations

Pricing:
  - Monthly: $499.00/month (recurring)
  - Annual: $5,088.30/year (recurring, 15% discount)
  - Trial period: 14 days

Metadata:
  tier: enterprise
  maxUsers: 100
  maxEntities: unlimited
  features: ["basic_forecasting", "ai_forecasting", "what_if_analysis", "api_integrations", "advanced_reports", "custom_integrations", "dedicated_support", "custom_training"]
```

---

## Step 2: Configure Environment Variables

### Required Environment Variables

Add these to your `.env` file (development) and Render dashboard (production):

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...                # Test mode secret key
STRIPE_PUBLISHABLE_KEY=pk_test_...           # Test mode publishable key (for frontend)
STRIPE_WEBHOOK_SECRET=whsec_...              # Webhook signing secret (see Step 3)

# Production keys (for production deployment)
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...
STRIPE_LIVE_WEBHOOK_SECRET=whsec_...

# Price IDs (from stripe-setup.js output or Stripe dashboard)
STRIPE_PRICE_STARTER_MONTH=price_...
STRIPE_PRICE_PROFESSIONAL_MONTH=price_...
STRIPE_PRICE_PROFESSIONAL_YEAR=price_...
STRIPE_PRICE_ENTERPRISE_MONTH=price_...
STRIPE_PRICE_ENTERPRISE_YEAR=price_...

# Cron Job Authentication (for trial expiration)
CRON_SECRET=<generate with: openssl rand -hex 32>

# Email Service (SendGrid example)
SENDGRID_API_KEY=SG...
FROM_EMAIL=billing@capliquify.com

# Frontend URL (for customer portal return URL)
FRONTEND_URL=https://app.capliquify.com
```

### How to Get Stripe API Keys

1. **Test Mode Keys**:
   - Navigate to https://dashboard.stripe.com/test/apikeys
   - Copy "Secret key" → `STRIPE_SECRET_KEY`
   - Copy "Publishable key" → `STRIPE_PUBLISHABLE_KEY`

2. **Production Keys** (when ready for launch):
   - Toggle to "Production" mode in Stripe dashboard
   - Navigate to https://dashboard.stripe.com/apikeys
   - Copy "Secret key" → `STRIPE_LIVE_SECRET_KEY`
   - Copy "Publishable key" → `STRIPE_LIVE_PUBLISHABLE_KEY`

---

## Step 3: Configure Stripe Webhooks

Webhooks enable Stripe to notify your application about subscription events (payments, cancellations, etc.).

### Development Setup (Stripe CLI)

For local development, use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to localhost
stripe listen --forward-to http://localhost:5000/api/webhooks/stripe

# Copy webhook signing secret from output
# Example: whsec_abc123xyz...
# Add to .env as STRIPE_WEBHOOK_SECRET
```

### Production Setup (Render)

1. Navigate to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Configure:
   ```
   Endpoint URL: https://capliquify-backend-prod.onrender.com/api/webhooks/stripe
   Description: CapLiquify Production Webhooks
   Events to send: Select all (or critical events below)
   ```

4. **Critical Events to Enable**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.payment_action_required`
   - `customer.updated`
   - `payment_method.attached`
   - `payment_method.detached`

5. **Optional Events** (recommended):
   - `charge.succeeded`
   - `charge.failed`
   - `customer.created`
   - `customer.deleted`
   - `invoice.upcoming`

6. After creating endpoint, copy "Signing secret" (starts with `whsec_`)
7. Add to Render environment variables as `STRIPE_WEBHOOK_SECRET`

### Webhook Security

- ✅ **Always verify webhook signatures** (prevents spoofing)
- ✅ **Idempotency checks** (prevent duplicate processing)
- ✅ **Use HTTPS in production** (Stripe requires HTTPS endpoints)
- ✅ **Return 200 status quickly** (acknowledge receipt, process async if needed)

---

## Step 4: Configure Stripe Customer Portal

The customer portal allows customers to self-service their billing (change plan, update payment method, view invoices).

1. Navigate to https://dashboard.stripe.com/settings/billing/portal
2. Configure branding:
   ```
   Business name: CapLiquify
   Brand color: #6366F1 (Sentia blue)
   Logo: Upload CapLiquify logo (200x200px recommended)
   ```

3. Configure functionality:
   - ✅ **Allow subscription cancellation**: Yes (with feedback)
   - ✅ **Allow plan changes**: Yes (prorated upgrades/downgrades)
   - ✅ **Allow payment method updates**: Yes
   - ✅ **Show invoice history**: Yes
   - ✅ **Cancellation retention**: Show upgrade options before canceling

4. Configure customer portal session:
   ```
   Return URL: https://app.capliquify.com/dashboard
   ```

---

## Step 5: Test Subscription Flow

### Test Credit Cards

Use these test cards in Stripe test mode:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Success (any CVC, any future expiry) |
| `4000 0000 0000 3220` | 3D Secure required |
| `4000 0000 0000 9995` | Decline (insufficient funds) |
| `4000 0000 0000 0341` | Decline (incorrect CVC) |
| `4000 0025 0000 3155` | Requires authentication (SCA) |

**Full list**: https://stripe.com/docs/testing

### Test Subscription Creation

```bash
# Create test subscription via API
curl -X POST https://capliquify-backend-prod.onrender.com/api/billing/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-test-token>" \
  -d '{
    "priceId": "price_...",
    "paymentMethodId": "pm_card_visa"
  }'

# Expected response:
{
  "id": "sub_...",
  "status": "trialing",
  "trial_end": "2025-11-06T00:00:00Z",
  "current_period_end": "2025-11-06T00:00:00Z"
}
```

### Verify Database Sync

```sql
-- Check tenant subscription status
SELECT id, name, subscription_status, subscription_tier, trial_ends_at, stripe_subscription_id
FROM public.tenants
WHERE stripe_customer_id = 'cus_...';

-- Check subscription record
SELECT * FROM public.subscriptions
WHERE stripe_subscription_id = 'sub_...';

-- Check billing events
SELECT event_type, status, processed_at FROM public.billing_events
ORDER BY processed_at DESC
LIMIT 10;
```

### Trigger Webhook Events

```bash
# Using Stripe CLI (test mode)
stripe trigger customer.subscription.created
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.trial_will_end

# Check logs
curl https://capliquify-backend-prod.onrender.com/api/admin/logs?type=billing
```

---

## Step 6: Production Checklist

Before launching with real payments:

### Pre-Launch

- [ ] All test scenarios passed (success, failure, SCA, webhooks)
- [ ] Stripe production keys configured in Render
- [ ] Webhook endpoint verified (test with `stripe trigger`)
- [ ] Customer portal branding configured
- [ ] Email notifications tested (trial expiration, payment failure)
- [ ] Database sync verified (100% consistency)
- [ ] Monitoring alerts configured (Sentry, Prometheus)
- [ ] Refund policy documented
- [ ] Terms of service updated (billing terms)

### Launch Day

- [ ] Switch Stripe dashboard to "Production" mode
- [ ] Update environment variables (STRIPE_SECRET_KEY → STRIPE_LIVE_SECRET_KEY)
- [ ] Verify webhook endpoint receiving events
- [ ] Monitor first 10 subscriptions closely
- [ ] Check Sentry for billing errors
- [ ] Verify trial expiration cron job runs successfully

### Post-Launch (First Week)

- [ ] Monitor trial conversion rate (target: 15-20%)
- [ ] Check payment success rate (target: >98%)
- [ ] Verify dunning recovery rate (target: 40-50%)
- [ ] Review customer support tickets (billing-related)
- [ ] Analyze drop-off points in signup funnel

---

## Troubleshooting

### Webhook Delivery Failures

**Symptoms**: Subscriptions created in Stripe but not synced to database

**Diagnosis**:
```bash
# Check Stripe webhook logs
# https://dashboard.stripe.com/webhooks → Click endpoint → View logs

# Check application logs
render logs --tail 100 capliquify-backend-prod | grep webhook
```

**Solutions**:
1. Verify webhook signing secret matches environment variable
2. Check endpoint URL is accessible (HTTPS, not 503)
3. Review application logs for errors
4. Manually re-send failed events from Stripe dashboard

### Payment Failures

**Symptoms**: Subscription status stuck in "incomplete" or "past_due"

**Diagnosis**:
```bash
# Check Stripe dashboard
# https://dashboard.stripe.com/subscriptions → Filter by status

# Check database
SELECT * FROM public.subscriptions WHERE status IN ('incomplete', 'past_due');
```

**Solutions**:
1. Verify customer has valid payment method
2. Check if 3D Secure authentication required
3. Review payment failure reason in Stripe dashboard
4. Send customer email with "Update Payment Method" link

### Database/Stripe Sync Mismatch

**Symptoms**: Tenant subscription status in database doesn't match Stripe

**Diagnosis**:
```bash
# Run reconciliation script (Story 8)
node scripts/reconcile-subscriptions.js

# Expected output:
# ✅ 100/102 subscriptions in sync
# ⚠️ 2 mismatches found (reconciled automatically)
```

**Solutions**:
1. Run reconciliation script to identify mismatches
2. Manually sync via API: `PATCH /api/billing/subscriptions/:id/sync`
3. Check billing_events table for failed webhook processing

---

## API Reference

### Create Subscription

```javascript
POST /api/billing/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "priceId": "price_...",       // Stripe price ID
  "paymentMethodId": "pm_..."   // Stripe payment method ID
}

Response 201:
{
  "subscription": {
    "id": "sub_...",
    "status": "trialing",
    "trial_end": "2025-11-06T00:00:00Z",
    "current_period_end": "2025-11-06T00:00:00Z"
  },
  "tenant": {
    "id": "tenant_...",
    "subscription_status": "trial",
    "subscription_tier": "professional"
  }
}
```

### Upgrade Subscription

```javascript
PATCH /api/billing/subscriptions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "newPriceId": "price_..."  // New tier price ID
}

Response 200:
{
  "subscription": {
    "id": "sub_...",
    "status": "active",
    "proration_applied": true,
    "proration_amount": 5000  // $50.00 prorated credit
  }
}
```

### Cancel Subscription

```javascript
DELETE /api/billing/subscriptions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "immediately": false  // true = cancel now, false = at period end
}

Response 200:
{
  "subscription": {
    "id": "sub_...",
    "status": "active",
    "cancel_at_period_end": true,
    "canceled_at": "2025-10-23T12:00:00Z"
  }
}
```

### Customer Portal Session

```javascript
POST /api/billing/portal-session
Authorization: Bearer <token>

Response 200:
{
  "url": "https://billing.stripe.com/session/..." // Redirect customer here
}
```

---

## Resources

### Stripe Documentation

- [Subscription Lifecycle](https://stripe.com/docs/billing/subscriptions/overview)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Cards](https://stripe.com/docs/testing)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Strong Customer Authentication (SCA)](https://stripe.com/docs/strong-customer-authentication)

### CapLiquify Documentation

- [Multi-Tenant Setup Guide](MULTI_TENANT_SETUP_GUIDE.md)
- [Production Deployment Guide](PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Production Runbook](PRODUCTION_RUNBOOK.md)
- [Billing Architecture](BILLING_ARCHITECTURE.md) (Story 8)

### Support

- **Stripe Support**: https://support.stripe.com
- **CapLiquify Slack**: #capliquify-billing
- **On-Call Engineer**: Slack #capliquify-alerts

---

**Document Status**: ✅ Complete
**Last Updated**: 2025-10-23
**Epic**: BMAD-MULTITENANT-004 (Story 1)
**Next**: Story 2 (Subscription Service Implementation)
