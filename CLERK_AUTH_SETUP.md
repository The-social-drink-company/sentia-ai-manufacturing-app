# Clerk Authentication Setup

## Overview

This guide explains how to configure Clerk for the Sentia Manufacturing Dashboard in both local and Render environments without checking secrets into source control.

## Environment Variables

Create a `.env.local` (do not commit) with:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
VITE_CLERK_DOMAIN=clerk.yourdomain.tld
CLERK_ENVIRONMENT=production
VITE_FORCE_MOCK_AUTH=false
```

> Replace the placeholder values with keys from your Clerk dashboard. Rotate any previously exposed keys before adding the new ones.

## Local Verification

1. Run `npm install` if needed, then `npm run dev` (serves on `http://localhost:3000`).
2. Clear any mock session via DevTools (`localStorage.removeItem('sentia-mock-auth-v1')`) or the `/clear-auth.html` helper.
3. Visit `http://localhost:3000/`, click **Sign In** and complete the Clerk flow.
4. Confirm you land on `/dashboard` with `mode: 'clerk'` in the React context (`src/providers/AuthProvider.jsx`).

## Render Deployment

Set the same variables in Render's dashboard or via `render.yaml` secrets (see `render.yaml` for names). Re-deploy and test at the environment URL.

## Security Checklist

- [ ] Keys stored only in managed secrets, never in Git.
- [ ] Rotate any credentials exposed in earlier commits.
- [ ] Verify `/clear-auth.html` reports "Mock auth cleared" status.
- [ ] Run `npm run lint`, `npm run typecheck`, and relevant tests before shipping changes.

Last updated: 2025-09-26
