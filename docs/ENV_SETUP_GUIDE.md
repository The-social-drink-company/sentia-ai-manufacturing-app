# Local Environment Setup Guide

## Quick Start (5 Minutes)

### Step 1: Copy Template
```bash
cp .env.template .env.local
```

### Step 2: Get Database Password

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to: **Databases → sentia-db-prod**
3. Click on **Info** tab
4. Copy the **Password** (the long hidden value with dots)
5. In `.env.local`, replace `YOUR_PASSWORD_HERE` with the actual password

**Your DATABASE_URL should look like:**
```
DATABASE_URL=postgresql://sentia_user:abc123xyz789...(long password)...@dpg-d3p75uqli9vc73crtj0g-a.oregon-postgres.render.com:5432/sentia_prod_db?ssl=true
```

⚠️ **Important**: Add `?ssl=true` at the end for external connections!

### Step 3: Get Clerk Keys & Configure Authentication

#### 3.1: Get API Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **API Keys**
4. Copy these values:

**Publishable Key:**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...copy from Clerk...
```

**Secret Key:**
```
CLERK_SECRET_KEY=sk_test_...copy from Clerk...
```

5. (Optional) If you've set up webhooks, also copy:
```
CLERK_WEBHOOK_SECRET=whsec_...copy from Clerk Webhooks...
```

#### 3.2: Configure Redirect URLs

Add these redirect URL configurations to your `.env.local`:

```bash
# Clerk Redirect URLs (already configured in template)
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**What these do:**
- `SIGN_IN_URL`: Where users go to sign in (our branded sign-in page)
- `SIGN_UP_URL`: Where users go to sign up (our branded sign-up page)
- `AFTER_SIGN_IN_URL`: Where to redirect after successful sign-in (dashboard)
- `AFTER_SIGN_UP_URL`: Where to redirect after successful sign-up (dashboard)

⚠️ **Note**: These are already set to recommended defaults in `.env.template`. Only change if you need custom routes.

### Step 4: Set Development Mode

For local development, keep this as `true`:
```
VITE_DEVELOPMENT_MODE=true
```

This allows you to bypass Clerk authentication during development.

### Step 5: Verify Your .env.local

Your `.env.local` should now have at minimum:

```bash
# Database (REQUIRED)
DATABASE_URL=postgresql://sentia_user:ACTUAL_PASSWORD@dpg-d3p75uqli9vc73crtj0g-a.oregon-postgres.render.com:5432/sentia_prod_db?ssl=true

# Clerk (REQUIRED for auth)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_ACTUAL_KEY
CLERK_SECRET_KEY=sk_test_ACTUAL_KEY

# Clerk Redirect URLs (configured with defaults)
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Development (REQUIRED)
VITE_DEVELOPMENT_MODE=true
NODE_ENV=development
PORT=10000
```

### Step 6: Test Connection

```bash
# Test database connection
npx prisma db pull

# If successful, you should see:
# ✔ Introspected X models and wrote them into prisma/schema.prisma
```

✅ **You're ready to develop!**

---

## Optional: API Integrations

### Xero Integration

1. Go to [Xero Developer Portal](https://developer.xero.com/myapps)
2. Create an app or use existing app
3. Copy **Client ID** and **Client Secret**
4. Add to `.env.local`:
```bash
XERO_CLIENT_ID=YOUR_CLIENT_ID
XERO_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

### Shopify Integration

1. Log into Shopify Admin
2. Navigate to **Apps → Develop apps**
3. Create app and install to your store
4. Copy **API Key** and **Access Token**
5. Add to `.env.local`:
```bash
SHOPIFY_API_KEY=YOUR_API_KEY
SHOPIFY_API_SECRET=YOUR_API_SECRET
SHOPIFY_UK_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_UK_ACCESS_TOKEN=shpat_YOUR_ACCESS_TOKEN
```

### Amazon SP-API

1. Go to [Amazon Seller Central](https://sellercentral.amazon.com)
2. Navigate to **Apps & Services → Develop Apps**
3. Create app and get credentials
4. Add to `.env.local`:
```bash
AMAZON_REFRESH_TOKEN=YOUR_REFRESH_TOKEN
AMAZON_LWA_APP_ID=amzn1.application.YOUR_APP_ID
AMAZON_LWA_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

---

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solution:**
1. Verify password is correct (no extra spaces)
2. Ensure `?ssl=true` is at the end of DATABASE_URL
3. Check you're using the **External** database URL, not Internal

**Test connection:**
```bash
psql "postgresql://sentia_user:YOUR_PASSWORD@dpg-d3p75uqli9vc73crtj0g-a.oregon-postgres.render.com:5432/sentia_prod_db?sslmode=require"
```

### Clerk Authentication Issues

**Error:** `Invalid Clerk keys`

**Solution:**
1. Verify keys start with correct prefix:
   - Publishable: `pk_test_` or `pk_live_`
   - Secret: `sk_test_` or `sk_live_`
2. Ensure no extra quotes or spaces
3. For development, use `pk_test_` and `sk_test_` keys

**Bypass for development:**
```bash
VITE_DEVELOPMENT_MODE=true
```

**Redirect URL issues:**

If you see redirect loops or authentication errors:
1. Verify all 4 redirect URLs are set in `.env.local`:
   - `VITE_CLERK_SIGN_IN_URL=/sign-in`
   - `VITE_CLERK_SIGN_UP_URL=/sign-up`
   - `VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard`
   - `VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard`

2. Ensure routes exist in your application:
   - `/sign-in` → SignInPage component
   - `/sign-up` → SignUpPage component
   - `/dashboard` → Dashboard component

3. Check Clerk Dashboard → Paths configuration matches your URLs

### Prisma Issues

**Error:** `Environment variable not found: DATABASE_URL`

**Solution:**
1. Ensure `.env.local` exists in project root
2. Verify DATABASE_URL is set in `.env.local`
3. Restart your terminal/editor

**Force regenerate:**
```bash
npx prisma generate --schema=./prisma/schema.prisma
```

---

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] Never commit `.env.local` to git
- [ ] Use test keys for development
- [ ] Use live keys only in production (Render)
- [ ] Rotate secrets regularly
- [ ] Don't share .env.local in screenshots/Slack

---

## Next Steps

Once your `.env.local` is configured:

1. **Start Development Server:**
   ```bash
   pnpm run dev
   ```

2. **Access Application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:10000

3. **Test API:**
   ```bash
   curl http://localhost:10000/api/health
   ```

4. **View Database:**
   ```bash
   npx prisma studio
   ```

---

## Quick Reference

| Item | Where to Get It |
|------|----------------|
| Database Password | Render Dashboard → Database → Info |
| Clerk Keys | https://dashboard.clerk.com → API Keys |
| Xero Credentials | https://developer.xero.com/myapps |
| Shopify Credentials | Shopify Admin → Apps → Develop apps |
| Amazon Credentials | Seller Central → Develop Apps |

---

## Support

- **Database Issues**: Check [Render Database Logs](https://dashboard.render.com)
- **Clerk Issues**: Check [Clerk Dashboard](https://dashboard.clerk.com)
- **API Issues**: Check integration provider dashboards
- **General**: See [.env.template](.env.template) for all available options
