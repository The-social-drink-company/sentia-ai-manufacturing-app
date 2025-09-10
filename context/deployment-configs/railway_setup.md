# Railway Deployment Configuration

## Overview
This document outlines the complete Railway deployment setup for the Sentia Manufacturing Dashboard, covering all environments, services, and deployment strategies.

## Current Implementation Status
- **Railway Platform**: Nixpacks build system with Node.js/React ✅ IMPLEMENTED
- **Three Environments**: Development, Test, Production with auto-deployment ✅ IMPLEMENTED
- **Database**: Neon PostgreSQL with environment-specific databases ✅ IMPLEMENTED
- **Authentication**: Clerk integration with environment-specific keys ✅ IMPLEMENTED
- **Monitoring**: Health checks, metrics, and alerting ✅ IMPLEMENTED

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐        │
│  │   dev    │   │   test   │   │  production   │        │
│  └────┬─────┘   └────┬─────┘   └──────┬───────┘        │
└───────┼──────────────┼────────────────┼─────────────────┘
        │              │                │
        ▼              ▼                ▼
┌──────────────────────────────────────────────────────────┐
│                  GitHub Actions CI/CD                     │
│  ┌─────────┐   ┌─────────┐   ┌──────────────┐          │
│  │  Test   │   │  Build  │   │   Deploy     │          │
│  └────┬────┘   └────┬────┘   └──────┬───────┘          │
└───────┼─────────────┼────────────────┼──────────────────┘
        │             │                │
        ▼             ▼                ▼
┌──────────────────────────────────────────────────────────┐
│                     Railway Platform                      │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Development Environment             │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐ │    │
│  │  │  Web   │ │ Worker │ │ Redis  │ │  Neon   │ │    │
│  │  └────────┘ └────────┘ └────────┘ └─────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │                Test Environment                  │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐ │    │
│  │  │  Web   │ │ Worker │ │ Redis  │ │  Neon   │ │    │
│  │  └────────┘ └────────┘ └────────┘ └─────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │             Production Environment               │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐ │    │
│  │  │Web(2x) │ │Worker  │ │ Redis  │ │  Neon   │ │    │
│  │  └────────┘ └────────┘ └────────┘ └─────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Services Configuration

### 1. Web Service (Node.js + Express)
```toml
[services.web]
name = "sentia-web"
deploy.startCommand = "node server.js"
deploy.healthcheckPath = "/api/health"
deploy.region = "us-west1"
deploy.port = 5000

# Environment-specific scaling
[services.web.production]
deploy.numReplicas = 2
deploy.minReplicas = 2
deploy.maxReplicas = 5
resources.cpu = "1"
resources.memory = "2Gi"

[services.web.test]
deploy.numReplicas = 1
resources.cpu = "0.5"
resources.memory = "1Gi"

[services.web.development]
deploy.numReplicas = 1
resources.cpu = "0.25"
resources.memory = "512Mi"
```

### 2. Worker Service (BullMQ)
```toml
[services.worker]
name = "sentia-worker"
deploy.startCommand = "node services/workers/index.js"
deploy.region = "us-west1"

# Environment-specific configuration
[services.worker.production]
deploy.numReplicas = 2
resources.cpu = "1"
resources.memory = "2Gi"
env.WORKER_CONCURRENCY = "5"

[services.worker.test]
deploy.numReplicas = 1
resources.cpu = "0.5"
resources.memory = "1Gi"
env.WORKER_CONCURRENCY = "2"
```

### 3. Database Service (Neon PostgreSQL)
```yaml
# Neon Configuration per environment
production:
  project: sentia-prod
  branch: main
  compute:
    size: "2 vCPU, 8 GB"
    autoscaling: true
    min_size: "0.5 vCPU"
    max_size: "4 vCPU"
  storage:
    size: "100 GB"
  backup:
    retention: "30 days"
    frequency: "4 hours"

test:
  project: sentia-test
  branch: test
  compute:
    size: "0.5 vCPU, 2 GB"
  storage:
    size: "10 GB"
  backup:
    retention: "7 days"
    frequency: "daily"
```

### 4. Redis Service
```yaml
production:
  plan: "production"
  memory: "2 GB"
  persistence: "AOF + RDB"
  maxmemory-policy: "allkeys-lru"
  
test:
  plan: "starter"
  memory: "512 MB"
  persistence: "RDB"
```

## Environment Variables

### Required Secrets (Store in Railway)
```bash
# Database
DATABASE_URL
DATABASE_POOL_MAX

# Redis
REDIS_URL
REDIS_CACHE_TTL

# Authentication
CLERK_SECRET_KEY
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
SESSION_SECRET

# API Keys
AMAZON_CLIENT_SECRET
SHOPIFY_API_SECRET
UNLEASHED_API_KEY
XERO_CLIENT_SECRET

# Monitoring
SENTRY_DSN
TELEMETRY_KEY
NEW_RELIC_LICENSE_KEY
```

### Public Variables (Can be in code)
```bash
# Application
NODE_ENV
PORT
APP_URL
VITE_CLERK_PUBLISHABLE_KEY

# Features
FEATURE_FORECASTING
FEATURE_OPTIMIZATION
FEATURE_WORKING_CAPITAL
```

## Deployment Process

### 1. Development Branch
```bash
# Automatic deployment on push
git push origin development

# Manual deployment
railway up --environment development
```

### 2. Test Branch
```bash
# Requires passing tests
git push origin test

# Triggers E2E tests post-deployment
```

### 3. Production Branch
```bash
# Requires approval
git push origin production

# Manual approval in GitHub Actions
# Automatic database backup before deployment
# Health checks after deployment
```

## Scaling Configuration

### Auto-scaling Rules
```yaml
web:
  metrics:
    - type: CPU
      target: 70%
    - type: Memory
      target: 80%
    - type: RequestRate
      target: 1000 req/min
  
  scaling:
    min: 2
    max: 10
    cooldown: 300s

worker:
  metrics:
    - type: QueueDepth
      target: 100
  
  scaling:
    min: 1
    max: 5
    cooldown: 180s
```

### Manual Scaling
```bash
# Scale web service
railway scale --service web --replicas 3

# Scale worker service
railway scale --service worker --replicas 2
```

## Monitoring & Alerts

### Health Endpoints
- `/api/health` - Basic health check
- `/api/metrics` - Prometheus metrics
- `/api/status` - Detailed service status
- `/api/queues/status` - Queue health

### Alert Thresholds
```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 1%
    duration: 5m
    severity: critical
    
  - name: High Response Time
    condition: p95_latency > 2s
    duration: 10m
    severity: warning
    
  - name: Database Connection Pool
    condition: pool_usage > 90%
    duration: 5m
    severity: critical
    
  - name: Queue Backlog
    condition: queue_depth > 1000
    duration: 15m
    severity: warning
    
  - name: Memory Usage
    condition: memory_usage > 85%
    duration: 10m
    severity: warning
```

## Security Configuration

### Network Security
- TLS 1.3 enforced
- HTTPS only (HSTS enabled)
- IP allowlisting for admin endpoints
- DDoS protection via Cloudflare

### Secrets Management
```bash
# Rotate secrets quarterly
railway secrets rotate --all --environment production

# Audit secret access
railway audit secrets --days 30
```

### RBAC Configuration
```yaml
roles:
  - name: admin
    permissions: ["*"]
    
  - name: developer
    permissions: 
      - "read:*"
      - "write:development"
      - "write:test"
      
  - name: viewer
    permissions: ["read:*"]
```

## Backup & Recovery

### Backup Schedule
```yaml
database:
  production:
    frequency: "0 */4 * * *"  # Every 4 hours
    retention: 30 days
    type: "PITR"
    
  test:
    frequency: "0 2 * * *"    # Daily at 2 AM
    retention: 7 days
    
redis:
  production:
    frequency: "0 * * * *"    # Hourly
    retention: 24 hours
    
uploads:
  production:
    frequency: "0 3 * * *"    # Daily at 3 AM
    destination: "s3://sentia-backups-prod/"
```

### Recovery Procedures
```bash
# Database recovery
neon restore --branch production --timestamp "2024-01-01 12:00:00"

# Redis recovery
redis-cli -u $REDIS_URL --rdb restore.rdb

# Application rollback
railway rollback --service web --environment production
```

## CI/CD Pipeline

### Build Pipeline
```yaml
steps:
  - checkout
  - setup-node
  - install-dependencies
  - lint
  - test
  - build
  - security-scan
  - upload-artifacts
```

### Deploy Pipeline
```yaml
steps:
  - download-artifacts
  - setup-railway
  - database-backup (production only)
  - deploy-services
  - run-migrations
  - health-checks
  - smoke-tests
  - rollback-on-failure
```

## Performance Optimization

### Caching Strategy
```yaml
cdn:
  static_assets: 
    cache: "1 year"
    headers: "immutable"
    
  api_responses:
    cache: "5 minutes"
    vary: "Authorization"
    
redis:
  session: "24 hours"
  api_cache: "5 minutes"
  computed_data: "1 hour"
```

### Resource Limits
```yaml
services:
  web:
    limits:
      cpu: "2000m"
      memory: "4Gi"
    requests:
      cpu: "500m"
      memory: "1Gi"
      
  worker:
    limits:
      cpu: "1000m"
      memory: "2Gi"
    requests:
      cpu: "250m"
      memory: "512Mi"
```

## Maintenance Windows

### Scheduled Maintenance
- Production: Sunday 2-4 AM UTC
- Test: Any time with 1 hour notice
- Development: No maintenance windows

### Maintenance Mode
```bash
# Enable maintenance
railway env set MAINTENANCE_MODE=true

# Disable maintenance
railway env unset MAINTENANCE_MODE
```

## Troubleshooting

### Common Issues

1. **Deployment Fails**
```bash
railway logs --service web --tail 100
railway deployments list
railway rollback --deployment-id <id>
```

2. **Database Connection Issues**
```bash
railway logs --service web | grep database
neon connection-string --branch production
```

3. **High Memory Usage**
```bash
railway metrics --service web --period 1h
railway restart --service web
```

4. **Queue Backlog**
```bash
curl https://api/queues/status
railway scale --service worker --replicas 3
```

## Compliance & Governance

### Audit Logging
- All deployments logged
- Secret access tracked
- Configuration changes audited
- Monthly audit reports

### Change Management
- Production changes require approval
- Automated testing before deployment
- Rollback plan required
- Post-deployment verification

### Documentation Requirements
- README.md updated with changes
- CHANGELOG.md for releases
- API documentation current
- Runbooks maintained

## Contact Information

### Support Channels
- Railway Dashboard: [railway.app]
- Neon Console: [console.neon.tech]
- GitHub Issues: [repo/issues]
- Slack: #sentia-infrastructure

### Escalation Path
1. On-call engineer
2. Team lead
3. Infrastructure team
4. CTO/VP Engineering

---

**Last Updated**: January 2025
**Next Review**: April 2025
**Owner**: Infrastructure Team