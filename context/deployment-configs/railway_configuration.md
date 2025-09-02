# Railway Deployment Configuration

## Overview
This document outlines the Railway deployment configuration for the Sentia Manufacturing Planning Dashboard with three environments: development, test, and production.

## Environment Structure
- **Development**: `development` branch → `dev.sentia-manufacturing.railway.app`
- **Test**: `test` branch → `test.sentia-manufacturing.railway.app`
- **Production**: `production` branch → `sentia-manufacturing.railway.app`

## Database Configuration
Each environment connects to a separate Neon PostgreSQL database:
- Development: `neon-dev-db`
- Test: `neon-test-db` 
- Production: `neon-prod-db`

## Environment Variables by Environment

### Development Environment
```
FLASK_CONFIG=development
SECRET_KEY=${RAILWAY_SECRET_KEY}
DATABASE_URL=${NEON_DEV_DATABASE_URL}
REDIS_URL=${RAILWAY_REDIS_URL}
CORS_ORIGINS=http://localhost:3000,https://dev.sentia-manufacturing.railway.app
DEBUG=True
LOG_LEVEL=DEBUG
```

### Test Environment
```
FLASK_CONFIG=test
SECRET_KEY=${RAILWAY_SECRET_KEY}
DATABASE_URL=${NEON_TEST_DATABASE_URL}
REDIS_URL=${RAILWAY_REDIS_URL}
CORS_ORIGINS=https://test.sentia-manufacturing.railway.app
DEBUG=False
LOG_LEVEL=INFO
```

### Production Environment
```
FLASK_CONFIG=production
SECRET_KEY=${RAILWAY_SECRET_KEY}
DATABASE_URL=${NEON_PROD_DATABASE_URL}
REDIS_URL=${RAILWAY_REDIS_URL}
CORS_ORIGINS=https://sentia-manufacturing.railway.app
DEBUG=False
LOG_LEVEL=WARNING
SENTRY_DSN=${SENTRY_DSN}
```

## Build Configuration
Railway will use the following build settings:
- Python version: 3.11+
- Build command: `pip install -r requirements.txt`
- Start command: `python run.py`
- Port: 5000

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