# Clerk Webhook & Subscription Quick Reference

## 🚀 Quick Setup (5 Minutes)

### 1. Get Clerk Keys
```
https://dashboard.clerk.com → API Keys
```
Copy:
- `VITE_CLERK_PUBLISHABLE_KEY` (pk_test_... or pk_live_...)
- `CLERK_SECRET_KEY` (sk_test_... or sk_live_...)

### 2. Add to Render Environment
```
Render Dashboard → sentia-backend-prod → Environment → Add
```

### 3. Create Webhook in Clerk
```
https://dashboard.clerk.com → Webhooks → + Add Endpoint

Endpoint URL: https://capliquify-backend-prod.onrender.com/api/webhooks/clerk

Subscribe to:
✅ user.created
✅ user.updated
✅ user.deleted
✅ organization.created ⭐
✅ organization.updated
✅ organization.deleted
✅ organizationMembership.created
✅ organizationMembership.deleted
```

Copy the **Signing Secret** → Add to Render as `CLERK_WEBHOOK_SECRET`

### 4. Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_clerk_subscriptions

# Deploy to production
npx prisma migrate deploy
```

✅ **Done!** Webhooks are now active.

---

## 💰 Subscription Details

| Property | Value |
|----------|-------|
| **Price** | $295.00/month |
| **Billing** | Per account (not per user) |
| **Free Trial** | 14 days |
| **User Limit** | 10 users per account |
| **Features** | Full dashboard, all integrations, analytics |

---

## 📊 Subscription States

| Status | Description | Access |
|--------|-------------|--------|
| `trialing` | 14-day free trial | ✅ Full access |
| `active` | Paid subscription | ✅ Full access |
| `past_due` | Payment failed | ⚠️ Limited access |
| `canceled` | Subscription ended | ❌ No access |

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| Clerk Dashboard | https://dashboard.clerk.com |
| Webhook Endpoint | https://capliquify-backend-prod.onrender.com/api/webhooks/clerk |
| Subscription Status API | https://capliquify-backend-prod.onrender.com/api/webhooks/subscription/status |
| Render Dashboard | https://dashboard.render.com |

---

## 🧪 Testing Webhooks

### Test in Clerk Dashboard
```
Webhooks → Your Endpoint → Testing → Send Example
```

### Test Locally with Svix
```bash
npm install -g svix
svix listen http://localhost:10000/api/webhooks/clerk
```

---

## 📋 Common Tasks

### Check Subscription Status
```sql
SELECT
  o.name,
  s.tier,
  s.status,
  s.price_per_month / 100.0 AS price_usd,
  s.trial_end,
  s.current_period_end
FROM subscriptions s
JOIN organizations o ON s.organization_id = o.id;
```

### Activate Subscription (After Payment)
```typescript
await prisma.subscription.update({
  where: { organizationId: 'org_...' },
  data: {
    status: 'active',
    trialEnd: new Date(),
    paymentMethod: 'STRIPE' // or 'MANUAL', 'INVOICE'
  }
})
```

### Cancel Subscription
```typescript
await prisma.subscription.update({
  where: { organizationId: 'org_...' },
  data: {
    status: 'canceled',
    canceledAt: new Date(),
    cancelReason: 'Customer requested'
  }
})
```

---

## ⚠️ Troubleshooting

### Webhook Signature Verification Failed
1. Check `CLERK_WEBHOOK_SECRET` in Render environment
2. Compare with Clerk Dashboard → Webhooks → Signing Secret
3. Redeploy backend after updating

### Organization Not Creating Subscription
1. Check Clerk Dashboard → Webhooks → Attempts
2. View Render logs: Services → Backend → Logs
3. Look for `[Webhook] Organization created`

### Can't Add More Users
- Alpha tier limit: **10 users**
- Check current count:
  ```sql
  SELECT COUNT(*) FROM users
  WHERE organization_id = '...' AND deleted_at IS NULL;
  ```

---

## 📚 Full Documentation

See [CLERK_WEBHOOK_SUBSCRIPTION_SETUP.md](./CLERK_WEBHOOK_SUBSCRIPTION_SETUP.md) for complete setup instructions.

---

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `server/routes/clerk-webhooks.js` | Webhook handler |
| `prisma/clerk-subscription-schema.prisma` | Database schema |
| `docs/CLERK_WEBHOOK_SUBSCRIPTION_SETUP.md` | Complete setup guide |
| `.env` | Environment variables |

---

**Need Help?** Check the [full setup guide](./CLERK_WEBHOOK_SUBSCRIPTION_SETUP.md)
