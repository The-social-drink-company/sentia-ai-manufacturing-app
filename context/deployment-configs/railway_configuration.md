# Railway Deployment Configuration

## Overview
This document outlines the Railway deployment configuration for the Sentia Manufacturing Planning Dashboard with three environments: development, test, and production.

## Current Implementation Status
- **Railway Platform**: Nixpacks build system with Node.js/React ✅ IMPLEMENTED
- **Environment URLs**: Auto-deployment from GitHub branches ✅ IMPLEMENTED
- **Database**: Neon PostgreSQL with Prisma ORM ✅ IMPLEMENTED
- **Authentication**: Clerk integration with role-based access ✅ IMPLEMENTED
- **Environment Variables**: Comprehensive configuration management ✅ IMPLEMENTED

## Environment Structure
- **Development**: `development` branch → `dev.sentia-manufacturing.railway.app`
- **Test**: `test` branch → `test.sentia-manufacturing.railway.app`
- **Production**: `production` branch → `sentia-manufacturing.railway.app`

## Database Configuration
Each environment connects to a separate Neon PostgreSQL database:
- Development: `neon-dev-db` with Prisma migrations
- Test: `neon-test-db` with test data seeding
- Production: `neon-prod-db` with high availability

## Environment Variables by Environment

### Development Environment
```
NODE_ENV=development
PORT=5000
DATABASE_URL=${NEON_DEV_DATABASE_URL}
REDIS_URL=${RAILWAY_REDIS_URL}
CLERK_SECRET_KEY=${CLERK_DEV_SECRET_KEY}
VITE_CLERK_PUBLISHABLE_KEY=${CLERK_DEV_PUBLISHABLE_KEY}
CORS_ORIGINS=http://localhost:3000,https://dev.sentia-manufacturing.railway.app
LOG_LEVEL=debug
DEBUG=true
```

### Test Environment
```
NODE_ENV=test
PORT=5000
DATABASE_URL=${NEON_TEST_DATABASE_URL}
REDIS_URL=${RAILWAY_REDIS_URL}
CLERK_SECRET_KEY=${CLERK_TEST_SECRET_KEY}
VITE_CLERK_PUBLISHABLE_KEY=${CLERK_TEST_PUBLISHABLE_KEY}
CORS_ORIGINS=https://test.sentia-manufacturing.railway.app
LOG_LEVEL=info
DEBUG=false
```

### Production Environment
```
NODE_ENV=production
PORT=5000
DATABASE_URL=${NEON_PROD_DATABASE_URL}
REDIS_URL=${RAILWAY_REDIS_URL}
CLERK_SECRET_KEY=${CLERK_PROD_SECRET_KEY}
VITE_CLERK_PUBLISHABLE_KEY=${CLERK_PROD_PUBLISHABLE_KEY}
CORS_ORIGINS=https://sentia-manufacturing.railway.app
LOG_LEVEL=warn
DEBUG=false
SENTRY_DSN=${SENTRY_DSN}
```

## Build Configuration
Railway uses Nixpacks build system with the following settings:
- Node.js version: 18+
- Build command: `npm run build`
- Start command: `npm start`
- Port: 5000
- Build system: Nixpacks (no Docker required)

## Auto-Deployment Rules
- Push to `development` → Deploy to dev environment
- Push to `test` → Deploy to test environment
- Push to `production` → Deploy to production environment (with manual approval)

## Health Check Configuration
```yaml
health_check:
  path: /api/health
  interval: 30s
  timeout: 10s
  retries: 3
```

## Resource Allocation
- **Development**: 512MB RAM, 0.5 vCPU
- **Test**: 1GB RAM, 1 vCPU
- **Production**: 2GB RAM, 2 vCPU, Auto-scaling enabled