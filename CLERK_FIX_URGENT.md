# URGENT CLERK AUTHENTICATION FIX

## Problem Identified

Current Clerk publishable key `pk_live_Y2xlcmsucmVuZHByb2QuZmluYW5jZWZsby5haSQ` decodes to `clerk.rendprod.financeflo.ai$` which doesn't exist, causing DNS resolution failures.

## Solution

Replace with working Clerk configuration using standard domains.

## IMMEDIATE ACTION REQUIRED

### Step 1: Get New Clerk Keys

1. Go to https://dashboard.clerk.com
2. Create new application or access existing one
3. Get keys that use standard `.clerk.accounts.dev` or `.clerk.com` domains
4. For production, keys should start with `pk_live_` but decode to working domains

### Step 2: Update Render Environment Variables

Replace these variables in ALL Render environments (development, testing, production):

```env
# REPLACE THIS BROKEN KEY:
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsucmVuZHByb2QuZmluYW5jZWZsby5haSQ

# WITH A WORKING KEY LIKE:
VITE_CLERK_PUBLISHABLE_KEY=pk_live_[NEW_WORKING_KEY]
```

### Step 3: Temporary Fix (Use Working Test Keys)

If you need immediate fix, you can temporarily use the working test keys from .env.template:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
```

These decode to `champion-bulldog-92.clerk.accounts.dev$` which is a working standard Clerk domain.

### Step 4: Configure Clerk Application

In Clerk dashboard, ensure authorized domains include:

- capliquify-frontend-prod.onrender.com (development)
- sentia-manufacturing-dashboard-test.onrender.com (testing)
- sentia-manufacturing-dashboard-production.onrender.com (production)

## Expected Result

- No more `ERR_NAME_NOT_RESOLVED` errors
- Clerk will load from working domains
- Authentication will function properly

## Technical Details

The current error occurs because:

1. `pk_live_Y2xlcmsucmVuZHByb2QuZmluYW5jZWZsby5haSQ` → `clerk.rendprod.financeflo.ai$`
2. DNS lookup for `clerk.rendprod.financeflo.ai` fails
3. Clerk JavaScript can't load, breaking authentication

The fix ensures Clerk uses accessible domains like `clerk.accounts.dev` or `clerk.com`.
