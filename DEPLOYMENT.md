# Deployment Guide

## Overview

This document provides comprehensive instructions for deploying the Sentia Manufacturing Planning Dashboard to Railway with production-grade configuration.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │      Test       │    │   Production    │
│     Railway     │    │     Railway     │    │     Railway     │
│                 │    │                 │    │                 │
│ dev.sentia-*    │    │ test.sentia-*   │    │ sentia-*        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Neon Dev DB   │    │  Neon Test DB   │    │  Neon Prod DB   │
│   + Redis       │    │   + Redis       │    │   + Redis       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Environment Configuration

### 1. Development Environment

**Branch**: `development`  
**URL**: `https://dev.sentia-manufacturing.railway.app`  
**Auto-deploy**: ✅ On push to `development`

#### Environment Variables:
```bash
FLASK_CONFIG=development
SECRET_KEY=${RAILWAY_SECRET_KEY}
DATABASE_URL=${NEON_DEV_DATABASE_URL}
REDIS_URL=${RAILWAY_REDIS_URL}
CORS_ORIGINS=http://localhost:3000,https://dev.sentia-manufacturing.railway.app
DEBUG=True
LOG_LEVEL=DEBUG
```

### 2. Test Environment

**Branch**: `test`  
**URL**: `https://test.sentia-manufacturing.railway.app`  
**Auto-deploy**: ✅ On push to `test`

#### Environment Variables:
```bash
FLASK_CONFIG=test
SECRET_KEY=${RAILWAY_SECRET_KEY}
DATABASE_URL=${NEON_TEST_DATABASE_URL}
REDIS_URL=${RAILWAY_REDIS_URL}
CORS_ORIGINS=https://test.sentia-manufacturing.railway.app
DEBUG=False
LOG_LEVEL=INFO
```

### 3. Production Environment

**Branch**: `production`  
**URL**: `https://sentia-manufacturing.railway.app`  
**Auto-deploy**: ✅ On push to `production` (with approval)

#### Environment Variables:
```bash
FLASK_CONFIG=production
SECRET_KEY=${RAILWAY_SECRET_KEY}
DATABASE_URL=${NEON_PROD_DATABASE_URL}
REDIS_URL=${RAILWAY_REDIS_URL}
CORS_ORIGINS=https://sentia-manufacturing.railway.app
DEBUG=False
LOG_LEVEL=WARNING
SENTRY_DSN=${SENTRY_DSN}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
ALERT_WEBHOOK_URL=${ALERT_WEBHOOK_URL}
```

## Railway Setup Instructions

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway project create sentia-manufacturing-dashboard
```

### 2. Set Up Three Environments

#### Create Development Environment:
```bash
railway environment create development
railway environment use development
railway link
```

#### Create Test Environment:
```bash
railway environment create test
railway environment use test
railway link
```

#### Create Production Environment:
```bash
railway environment create production
railway environment use production
railway link
```

### 3. Configure Databases

#### Neon PostgreSQL Setup:
1. Go to [Neon Console](https://console.neon.tech)
2. Create three databases:
   - `sentia-dev-db`
   - `sentia-test-db`
   - `sentia-prod-db`
3. Copy connection strings to Railway environment variables

#### Redis Setup:
Railway provides Redis add-on:
```bash
railway add redis
```

### 4. Configure Environment Variables

For each environment, set the required variables:

```bash
# Switch to environment
railway environment use [development|test|production]

# Set variables
railway variables set FLASK_CONFIG=production
railway variables set SECRET_KEY=$(openssl rand -base64 32)
railway variables set DATABASE_URL=postgresql://...
# ... etc
```

### 5. Deploy

#### Development Deployment:
```bash
git push origin development
```

#### Test Deployment:
```bash
git checkout test
git merge development
git push origin test
```

#### Production Deployment:
```bash
git checkout production
git merge test
git push origin production
```

## Monitoring Setup

### 1. Health Checks

Railway automatically monitors the `/api/health` endpoint.

Custom health checks available at:
- `/api/health` - Application health
- `/metrics` - Detailed metrics
- `/alerts` - Current alerts

### 2. External Monitoring

#### Slack Alerts:
1. Create Slack webhook URL
2. Set `SLACK_WEBHOOK_URL` environment variable
3. Configure alert channel

#### Custom Webhooks:
Set `ALERT_WEBHOOK_URL` for custom alert handling.

### 3. GitHub Actions Monitoring

Automated monitoring runs every 5 minutes via GitHub Actions:
- Health checks across all environments
- Performance monitoring
- Automated alerting

## Backup and Recovery

### Automated Backups

Daily backups run via GitHub Actions:
- Full database backups
- 30-day retention
- Cross-region replication (optional)

### Manual Backup

```bash
# Create backup
python scripts/backup.py

# Restore from backup
python scripts/backup.py restore backups/backup_file.sql
```

### Point-in-Time Recovery

Neon provides point-in-time recovery up to 7 days.

## Security Configuration

### 1. SSL/TLS
- HTTPS enforced via Railway
- HSTS headers configured
- TLS 1.3 minimum

### 2. Security Headers
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy configured

### 3. Rate Limiting
- 100 requests/minute per IP
- Configurable per endpoint
- Redis-backed storage

### 4. Access Control
- Flask-Login session management
- Strong session protection
- Secure cookie configuration

## Performance Optimization

### 1. Application Server
- Gunicorn with gevent workers
- 4 workers for production
- Connection pooling enabled
- Request/response compression

### 2. Database Optimization
- Connection pooling (10 connections)
- Query optimization
- Index management

### 3. Caching Strategy
- Redis for session storage
- API response caching
- Static file caching (1 year)

### 4. CDN Configuration
Railway provides CDN automatically for static files.

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database connectivity
railway logs

# Test connection
python -c "
from app import create_app
from config import config
app = create_app(config['production'])
with app.app_context():
    from app import db
    db.session.execute('SELECT 1')
    print('Database connected')
"
```

#### 2. Redis Connection Issues
```bash
# Check Redis status
railway logs | grep redis

# Test Redis connection
python -c "
import redis
import os
r = redis.from_url(os.environ['REDIS_URL'])
r.ping()
print('Redis connected')
"
```

#### 3. High Memory Usage
```bash
# Check memory metrics
python scripts/monitoring.py

# Review logs for memory leaks
railway logs | grep -i memory
```

#### 4. Slow Response Times
```bash
# Check performance metrics
curl https://sentia-manufacturing.railway.app/metrics

# Review database performance
# Check for slow queries in logs
```

### Rollback Procedures

#### Automatic Rollback
Failed deployments automatically rollback via GitHub Actions.

#### Manual Rollback
```bash
# Via Railway CLI
railway rollback

# Via Git
git revert HEAD
git push origin production
```

### Log Analysis
```bash
# View recent logs
railway logs

# Stream logs
railway logs --follow

# Filter logs
railway logs | grep ERROR
```

## Maintenance Windows

### Scheduled Maintenance
- Weekly maintenance window: Sunday 2-4 AM UTC
- Database updates and optimizations
- Security patch applications

### Emergency Maintenance
- Critical security updates: As needed
- System failures: Immediate response
- Performance issues: Within 4 hours

## Contact and Support

- **Development Team**: development@sentamanufacturing.com
- **Operations Team**: ops@sentamanufacturing.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX

---

## Quick Reference Commands

```bash
# Check application status
curl -s https://sentia-manufacturing.railway.app/api/health | jq

# Run monitoring check
python scripts/monitoring.py

# Create backup
python scripts/backup.py

# View metrics
curl -s https://sentia-manufacturing.railway.app/metrics | jq

# Deploy to production
git push origin production
```