# Clerk Authentication Setup Documentation

## Overview
This document outlines the authentication setup for the Sentia Manufacturing Dashboard using Clerk for production authentication across local development and Render deployments.

## Configuration Status

### Local Environment (.env file)
- **VITE_CLERK_PUBLISHABLE_KEY**: `pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ` ✓
- **CLERK_SECRET_KEY**: `sk_live_mzgSFm1q9VrzngMMaCTNNwPEqBmr75vVxiND1DO7wq` ✓
- **CLERK_WEBHOOK_SECRET**: `whsec_iTUcbgzS5P6zJlXWQkc4zGHnw8yLGt9j` ✓
- **VITE_CLERK_DOMAIN**: `clerk.financeflo.ai` ✓
- **CLERK_ENVIRONMENT**: `production` ✓
- **VITE_FORCE_MOCK_AUTH**: Not set (defaults to false) ✓

### Render Environments (render.yaml)
All three environments (development, testing, production) have been configured with:
- Clerk production keys properly set
- No VITE_FORCE_MOCK_AUTH variable (uses real Clerk authentication)
- Consistent authentication configuration across all environments

## Authentication Flow

### 1. Clear Mock Authentication
Navigate to: `http://localhost:3003/clear-auth.html`
- Click "Clear Mock Auth Session" to remove any cached mock authentication
- Verify localStorage is clean

### 2. Test Authentication
1. Go to the landing page: `http://localhost:3003/`
2. Click "Sign In" or "Get Started"
3. Complete Clerk authentication at `clerk.financeflo.ai`
4. You'll be redirected to `/dashboard` after successful authentication

## Key Implementation Files

### AuthProvider Selection Logic
File: `src/providers/AuthProvider.jsx`
- Lines 25-27: Checks for VITE_FORCE_MOCK_AUTH environment variable
- Lines 161-184: Selects between ClerkAuthProvider and MockAuthProvider
- With VITE_FORCE_MOCK_AUTH unset or false, ClerkAuthProvider is used

### Landing Page
File: `landing.html`
- Integrated with Clerk authentication
- Sign In and Get Started buttons redirect to Clerk

### Clear Auth Utility
File: `public/clear-auth.html`
- Utility page to clear mock authentication tokens
- Displays current authentication status
- Provides quick navigation to test auth flow

## Deployment Workflow

### Local Development
1. Ensure `.env` file has correct Clerk keys
2. Run `npm run dev` (server runs on port 3003)
3. Clear any mock auth tokens using `/clear-auth.html`
4. Test authentication flow

### Render Deployment
1. Push changes to development branch: `git push origin development`
2. Render auto-deploys from the development branch
3. Environment variables are automatically configured from render.yaml
4. Access at: `https://sentia-manufacturing-development.onrender.com`

## Verification Checklist

- [x] Local .env has Clerk production keys
- [x] VITE_FORCE_MOCK_AUTH is not set (or explicitly false)
- [x] render.yaml has Clerk keys for all environments
- [x] Mock authentication tokens cleared from localStorage
- [x] Local authentication flow tested successfully
- [x] Render configuration verified

## Troubleshooting

### If Mock Auth Persists
1. Navigate to `/clear-auth.html`
2. Click "Clear ALL localStorage"
3. Hard refresh the page (Ctrl+Shift+R)
4. Try authentication flow again

### If Clerk Doesn't Load
1. Check browser console for errors
2. Verify VITE_CLERK_PUBLISHABLE_KEY is correct
3. Ensure no browser extensions are blocking Clerk scripts
4. Check that clerk.financeflo.ai is accessible

### For Render Deployments
1. Check Render dashboard for deployment status
2. View logs for any build/runtime errors
3. Verify environment variables in Render dashboard
4. Restart service after environment variable changes

## Production URLs

- **Development**: https://sentia-manufacturing-development.onrender.com
- **Testing**: https://sentia-manufacturing-testing.onrender.com
- **Production**: https://sentia-manufacturing-production.onrender.com
- **Clerk Domain**: https://clerk.financeflo.ai

## Security Notes

- Never commit `.env` files with real keys to version control
- Clerk keys in render.yaml are production keys and should be kept secure
- Use environment-specific keys when available
- Regularly rotate secrets and webhook signing keys

---

Last Updated: September 26, 2025