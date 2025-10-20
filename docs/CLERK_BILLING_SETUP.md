# Clerk Billing Setup Guide

**Epic**: BMAD-MULTITENANT-004 (Clerk Billing Integration)
**Created**: 2025-10-20
**Status**: Active

## Overview

CapLiquify uses Clerk's native billing system (powered by Stripe) for subscription management.

## Architecture

Clerk handles:
- Stripe product/price configuration
- Checkout flows and payment processing
- Customer portal for plan changes
- Webhook delivery for subscription events

CapLiquify handles:
- Pricing page UI with Clerk components
- Webhook processing to sync tenant billing status
- Trial expiration logic and grace periods

## Step 1: Connect Stripe to Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Your Application
2. Navigate to **Monetization** → **Billing** (Beta)
3. Click **Connect Stripe Account**
4. Authorize Stripe via OAuth
5. Use **Test Mode** for development, **Live Mode** for production

## Step 2: Create Subscription Plans

Create 3 plans in Clerk Dashboard → Billing → Plans:

### Starter Plan ($49/month)
- **Name**: CapLiquify Starter
- **Features**: 5 users, 500 entities, basic forecasting, API integrations
- **Metadata**: `{"tier":"starter","max_users":"5","max_entities":"500"}`

### Professional Plan ($149/month)
- **Name**: CapLiquify Professional
- **Features**: 25 users, 5,000 entities, AI forecasting, what-if analysis
- **Annual**: $1,519/year (15% discount)
- **Metadata**: `{"tier":"professional","max_users":"25","max_entities":"5000"}`

### Enterprise Plan ($299/month)
- **Name**: CapLiquify Enterprise
- **Features**: 100 users, unlimited entities, custom integrations, dedicated support
- **Annual**: $2,870/year (20% discount)
- **Metadata**: `{"tier":"enterprise","max_users":"100","max_entities":"unlimited"}`

## Step 3: Configure Webhooks

1. Clerk Dashboard → **Webhooks** → **Add Endpoint**
2. **URL**: `https://api.capliquify.com/api/webhooks/clerk`
3. **Events**: 
   - `subscription.created`
   - `subscription.updated`
   - `subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy **Signing Secret** → add to environment as `CLERK_WEBHOOK_SECRET`

## Step 4: Environment Variables

Add to `.env`:

```bash
# Clerk Billing (get from Dashboard → Billing → Plans)
CLERK_PLAN_STARTER=plan_xxx
CLERK_PLAN_PROFESSIONAL=plan_xxx
CLERK_PLAN_ENTERPRISE=plan_xxx

# Clerk Webhooks (get from Dashboard → Webhooks)
CLERK_WEBHOOK_SECRET=whsec_xxx

# Trial Configuration
TRIAL_LENGTH_DAYS=14
GRACE_PERIOD_DAYS=3
```

## Step 5: Test in Test Mode

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`

## Next Steps

- Implement `/pricing` page with `<PricingTable />`
- Create webhook handler at `/api/webhooks/clerk`
- Add `<SubscriptionDetailsButton />` to dashboard
- Test trial-to-paid conversion flow

## References

- [Clerk Billing Docs](https://clerk.com/docs/billing)
- [Clerk PricingTable](https://clerk.com/docs/nextjs/reference/components/billing/pricing-table)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks)
