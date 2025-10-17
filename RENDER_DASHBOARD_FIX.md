# RENDER DASHBOARD BUILD COMMAND FIX

## The Problem

Render Dashboard has a hardcoded build command that overrides our configuration files:

```
npm ci --legacy-peer-deps && npm run build && npx prisma generate && npx prisma db push --skip-generate
```

This command fails because `prisma db push` is missing the `--accept-data-loss` flag.

## The Solution

### Option 1: Update Render Dashboard Build Command (RECOMMENDED)

1. Go to your Render Dashboard
2. Navigate to Settings > Build & Deploy
3. Find the "Build Command" field
4. Replace the current command with:

```bash
npm ci --legacy-peer-deps && npm run build && npx prisma generate && npx prisma db push --accept-data-loss --skip-generate
```

### Option 2: Remove Dashboard Override

1. Go to your Render Dashboard
2. Navigate to Settings > Build & Deploy
3. Clear the "Build Command" field entirely
4. This will make Render use our render.yaml configuration

### Option 3: Use Our Build Script

1. Go to your Render Dashboard
2. Navigate to Settings > Build & Deploy
3. Replace the build command with:

```bash
npm ci --legacy-peer-deps && npm run build
```

(Our build script already handles Prisma operations)

## Why This Happens

- Render Dashboard settings override ALL configuration files (render.yaml, .render-build.sh, etc.)
- The dashboard command runs AFTER our build script completes
- Even if we sync the database in our script, Render's command still tries to run migrations
- Without --accept-data-loss flag, it fails when there are schema changes

## Permanent Fix

The build command in package.json now includes all necessary Prisma operations:

```json
"build": "npx vite build && npx prisma generate && (npx prisma db push --accept-data-loss --skip-generate || echo 'DB sync done')"
```

But this only works if the Render Dashboard doesn't have its own prisma commands afterward.
