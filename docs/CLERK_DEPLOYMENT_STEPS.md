# Clerk Authentication Deployment Guide

## Local Development
- Copy `.env.development.clerk` to `.env.local` and confirm `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are the Clerk test keys for the Sentia instance.
- Run `npm install` (once) and start the stack with `npm run dev`; the Vite client now reads tokens from Clerk and automatically forwards them via Axios interceptors.
- Visit `http://localhost:3000/login` and complete the Clerk sign-in; network calls to `/api/**` should include the `Authorization: Bearer <jwt>` header via the interceptor.
- Trigger a protected request (e.g. `/api/dashboard/overview`) and confirm the Express logs show `User authenticated` entries coming from `api/middleware/clerkAuth.js`.

## Render Environments (Development / Testing / Production)
1. In each Render service (three branches), set the following environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY` – public key matching the target Clerk instance (test key for dev/test, live key for production).
   - `CLERK_SECRET_KEY` – server key with access to the same instance.
   - `CLERK_WEBHOOK_SECRET` – optional but recommended if webhooks are enabled.
   - `VITE_CLERK_SIGN_IN_URL`, `VITE_CLERK_SIGN_UP_URL`, `VITE_CLERK_AFTER_SIGN_IN_URL`, `VITE_CLERK_AFTER_SIGN_UP_URL` – ensure they reflect the deployed domain (e.g. `/login`, `/signup`, `/dashboard`).
2. Redeploy the service; Render injects the variables for both the server and Vite build. The Express server boots with `clerkAuthMiddleware` and rejects unsigned requests with `401`.
3. Validate the deployment:
   - Hit `/health` for baseline availability.
   - Open the branch URL, sign in via Clerk, and exercise `/dashboard` and `/settings` routes.
   - Watch the logs for `User authenticated` messages and confirm SSE (`/api/events`) streams without 401s.

## Operational Checklist
- Rotate secret keys in Render when rotating Clerk API credentials.
- Keep CSP updates (`server-fixed.js`) aligned with any future Clerk domain changes.
- Before promoting to production, run `npm run lint`, `npm run build`, and `npm test -- --runInBand` with valid Clerk keys to ensure the pipeline respects the authentication hooks.
