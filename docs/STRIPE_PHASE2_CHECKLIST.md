# Stripe Phase 2 Configuration Checklist

**Status**: Phase 1 (Infrastructure) ✅ COMPLETE | Phase 2 (Configuration) ⏳ PENDING

**Phase 1 Summary**: 2,640 lines of production-ready Stripe integration code deployed to Render.

---

## 📋 Configuration Steps

### 1. Stripe Dashboard Setup (30 minutes)

#### A. Create Products & Prices
Go to: https://dashboard.stripe.com/products

**Product 1: Starter Tier**
- Name: `CapLiquify Starter`
- Description: `Up to 5 users, 100 entities, 1 integration`
- Create 2 prices:
  - Monthly: `$149/month` → Copy Price ID → `price_xxxxx`
  - Annual: `$1,490/year` → Copy Price ID → `price_xxxxx`

**Product 2: Professional Tier**
- Name: `CapLiquify Professional`
- Description: `Up to 20 users, 1,000 entities, 3 integrations`
- Create 2 prices:
  - Monthly: `$295/month` → Copy Price ID → `price_xxxxx`
  - Annual: `$2,950/year` → Copy Price ID → `price_xxxxx`

**Product 3: Enterprise Tier**
- Name: `CapLiquify Enterprise`
- Description: `Unlimited users, 10,000 entities, unlimited integrations`
- Create 2 prices:
  - Monthly: `$595/month` → Copy Price ID → `price_xxxxx`
  - Annual: `$5,950/year` → Copy Price ID → `price_xxxxx`

**Result**: You now have 6 price IDs (3 tiers × 2 cycles)

#### B. Configure Webhook Endpoint
Go to: https://dashboard.stripe.com/webhooks

1. Click **"Add endpoint"**
2. Endpoint URL: `https://sentia-backend-prod.onrender.com/api/webhooks/stripe`
3. Description: `CapLiquify Subscription Events`
4. Events to send:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.trial_will_end`
5. Click **"Add endpoint"**
6. Copy **Signing secret**: `whsec_xxxxx`

**Result**: Webhook endpoint configured with signing secret

#### C. Get API Keys
Go to: https://dashboard.stripe.com/apikeys

1. Copy **Publishable key**: `pk_live_xxxxx` (or `pk_test_xxxxx` for testing)
2. Reveal and copy **Secret key**: `sk_live_xxxxx` (or `sk_test_xxxxx` for testing)

**Result**: 2 API keys ready to configure

---

### 2. Render Environment Variables (15 minutes)

Go to: https://dashboard.render.com → Select `sentia-backend-prod` service → **Environment** tab

Add the following environment variables:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE

# Stripe Price IDs (paste the 6 price IDs from Step 1A)
STRIPE_STARTER_MONTHLY_PRICE_ID=price_YOUR_STARTER_MONTHLY_ID
STRIPE_STARTER_ANNUAL_PRICE_ID=price_YOUR_STARTER_ANNUAL_ID
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_YOUR_PROFESSIONAL_MONTHLY_ID
STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_YOUR_PROFESSIONAL_ANNUAL_ID
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_YOUR_ENTERPRISE_MONTHLY_ID
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=price_YOUR_ENTERPRISE_ANNUAL_ID

# Email Provider (choose one)
EMAIL_PROVIDER=console  # Options: console, resend, sendgrid
EMAIL_FROM=noreply@capliquify.com

# If using Resend:
RESEND_API_KEY=re_YOUR_RESEND_KEY_HERE

# If using SendGrid:
SENDGRID_API_KEY=SG.YOUR_SENDGRID_KEY_HERE

# Test Email (for development)
TEST_EMAIL=your-email@example.com
```

**After adding variables**: Service will auto-redeploy (takes ~5 minutes)

---

### 3. Testing (30 minutes)

#### A. Test Webhook Endpoint
Using Stripe CLI (install from https://stripe.com/docs/stripe-cli):

```bash
# Login to Stripe CLI
stripe login

# Forward webhooks to local server (for testing)
stripe listen --forward-to https://sentia-backend-prod.onrender.com/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_succeeded
```

**Expected**: Check Render logs to see webhook events processed successfully

#### B. Test API Endpoints

**Health Check**:
```bash
curl https://sentia-backend-prod.onrender.com/api/subscription/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "subscription-api",
  "version": "1.0.0",
  "stripe": { "configured": true },
  "timestamp": "2025-10-20T..."
}
```

**Preview Upgrade** (with test tenant):
```bash
curl -X POST https://sentia-backend-prod.onrender.com/api/subscription/preview-upgrade \
  -H "Content-Type: application/json" \
  -d '{"newTier": "professional", "newCycle": "monthly"}'
```

**Expected**: Proration calculation returned

#### C. Test Payment Flow

Use Stripe test cards (from https://stripe.com/docs/testing):

- **Successful payment**: `4242 4242 4242 4242`
- **Payment requires authentication**: `4000 0025 0000 3155`
- **Payment declined**: `4000 0000 0000 9995`

**Steps**:
1. Create test subscription via Stripe Dashboard
2. Verify webhook creates database record
3. Check email sent (console logs if `EMAIL_PROVIDER=console`)
4. Test upgrade flow
5. Test downgrade flow
6. Test billing cycle switch

---

## 📊 Verification Checklist

After completing configuration, verify:

- ✅ **Stripe Dashboard**: 3 products with 6 prices created
- ✅ **Webhook Endpoint**: Configured with 6 events + signing secret
- ✅ **Render Environment**: All 11+ environment variables added
- ✅ **Backend Deployment**: Auto-redeployed successfully (check logs)
- ✅ **Health Check**: `/api/subscription/health` returns `"configured": true`
- ✅ **Webhook Test**: Test events processed successfully
- ✅ **API Test**: Preview upgrade returns proration calculation
- ✅ **Payment Test**: Test subscription created via Stripe dashboard
- ✅ **Email Test**: Confirmation email sent (check console logs or inbox)

---

## 🚀 Production Readiness

**After all tests pass**, switch to production mode:

1. Use **live Stripe keys** (`pk_live_xxx`, `sk_live_xxx`)
2. Update webhook endpoint to use live mode
3. Switch `EMAIL_PROVIDER` to `resend` or `sendgrid`
4. Configure monitoring alerts (see [STRIPE_PRODUCTION_INTEGRATION.md](STRIPE_PRODUCTION_INTEGRATION.md))

---

## 📚 Reference Documentation

- **Implementation Details**: [STRIPE_PRODUCTION_INTEGRATION.md](STRIPE_PRODUCTION_INTEGRATION.md) (677 lines)
- **API Specifications**: See sections in STRIPE_PRODUCTION_INTEGRATION.md
- **Webhook Events**: See webhook documentation in STRIPE_PRODUCTION_INTEGRATION.md
- **Email Templates**: See email template descriptions in STRIPE_PRODUCTION_INTEGRATION.md

---

## 🆘 Troubleshooting

**Webhook signature verification fails**:
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check raw body parser is configured (`express.raw()`)

**Health check shows `"configured": false`**:
- Verify `STRIPE_SECRET_KEY` is set in Render environment
- Check Render logs for configuration errors

**Emails not sending**:
- Check `EMAIL_PROVIDER` is set correctly
- Verify email provider API key is configured
- Check Render logs for email sending errors

**Proration calculation errors**:
- Verify all 6 price IDs are configured
- Check Stripe Dashboard that prices exist
- Use Stripe test mode first before production

---

**Phase 1 Status**: ✅ COMPLETE (2,640 lines of production-ready code deployed)
**Phase 2 Status**: ⏳ PENDING (awaiting Stripe configuration by user)

**Estimated Time**: 1-2 hours total (30 min Stripe + 15 min Render + 30 min testing)
