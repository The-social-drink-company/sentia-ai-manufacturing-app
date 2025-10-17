# Enterprise Deployment Guide

## World-Class Manufacturing Dashboard Deployment

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Environment                   │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │              │    │              │    │              │ │
│  │   Frontend   │────│   Backend    │────│   Database   │ │
│  │  (React/Vite)│    │  (Express)   │    │ (PostgreSQL) │ │
│  │              │    │              │    │   pgvector   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                   │                     │         │
│         └───────────────────┴─────────────────────┘         │
│                            │                                 │
│                     ┌──────────────┐                        │
│                     │              │                        │
│                     │  MCP Server  │                        │
│                     │   (AI/ML)    │                        │
│                     │              │                        │
│                     └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Environment Configuration

### Development Environment

- **URL**: https://sentia-manufacturing-development.onrender.com
- **Branch**: `development`
- **Auto-Deploy**: Yes
- **Purpose**: Active development and feature implementation

### Testing Environment

- **URL**: https://sentia-manufacturing-testing.onrender.com
- **Branch**: `test`
- **Auto-Deploy**: Yes
- **Purpose**: User Acceptance Testing (UAT)

### Production Environment

- **URL**: https://sentia-manufacturing-production.onrender.com
- **Branch**: `production`
- **Auto-Deploy**: Yes (with approval)
- **Purpose**: Live production operations

## Deployment Process

### Phase 1: Pre-Deployment Checklist

```bash
# 1. Run all tests
npm run test
npm run test:e2e

# 2. Check for security vulnerabilities
npm audit

# 3. Lint and format code
npm run lint:check
npm run format:check

# 4. Build production bundle
npm run build

# 5. Verify environment variables
node scripts/verify-env-vars.js
```

### Phase 2: Development Deployment

1. **Push to development branch**

   ```bash
   git checkout development
   git add .
   git commit -m "feat: [description of changes]"
   git push origin development
   ```

2. **Monitor deployment**
   - Visit: https://dashboard.render.com
   - Check build logs
   - Verify deployment status

3. **Smoke test**
   ```bash
   curl https://sentia-manufacturing-development.onrender.com/health
   ```

### Phase 3: Testing Deployment

1. **Create PR to test branch**

   ```bash
   git checkout test
   git merge development
   git push origin test
   ```

2. **UAT Process**
   - Notify QA team
   - Execute test scenarios
   - Document issues
   - Get stakeholder approval

### Phase 4: Production Deployment

1. **Create PR to production**

   ```bash
   git checkout production
   git merge test
   git push origin production
   ```

2. **Production verification**
   - Health check endpoints
   - Critical user journeys
   - Performance metrics
   - Error monitoring

## Environment Variables

### Critical Production Variables

```env
# Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
CLERK_ENVIRONMENT=production

# API Configuration
NODE_ENV=production
PORT=5000
VITE_API_BASE_URL=https://sentia-manufacturing-production.onrender.com/api

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# AI/ML Services
ANTHROPIC_API_KEY=xxx
OPENAI_API_KEY=xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info
```

## Health Monitoring

### Health Check Endpoints

- **Main Application**: `/health`
- **API Status**: `/api/health`
- **Database**: `/api/health/database`
- **External Services**: `/api/health/services`
- **MCP Server**: `/mcp/health`

### Monitoring Dashboard

```javascript
// Health check implementation
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      clerk: await checkClerk(),
      mcp: await checkMCP(),
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
  }

  res.json(health)
})
```

## Rollback Procedures

### Immediate Rollback

1. **Revert to previous deployment**

   ```bash
   # In Render Dashboard
   1. Go to service page
   2. Click "Deploys" tab
   3. Find last successful deployment
   4. Click "Rollback to this deploy"
   ```

2. **Git revert**
   ```bash
   git revert HEAD
   git push origin production
   ```

### Emergency Procedures

1. **Critical issue in production**
   - Enable maintenance mode
   - Rollback deployment
   - Notify stakeholders
   - Investigate root cause

2. **Database issues**
   - Switch to read-only mode
   - Restore from backup
   - Verify data integrity
   - Resume normal operations

## Performance Optimization

### Build Optimization

```javascript
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        auth: ['@clerk/clerk-react'],
        charts: ['recharts'],
        ui: ['@headlessui/react', '@heroicons/react']
      }
    }
  },
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true
    }
  }
}
```

### Caching Strategy

```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# Cache API responses
location /api/dashboard/metrics {
  add_header Cache-Control "public, max-age=60";
}
```

## Security Hardening

### Production Security Checklist

- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Authentication on all routes
- [ ] Secrets in environment variables
- [ ] Security headers (Helmet.js)

### Security Headers

```javascript
// server.js
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", 'https://clerk.financeflo.ai'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.clerk.com'],
      },
    },
  })
)
```

## Disaster Recovery

### Backup Strategy

1. **Database backups**
   - Daily automated backups
   - 30-day retention
   - Point-in-time recovery

2. **Code repository**
   - GitHub mirroring
   - Tagged releases
   - Branch protection

### Recovery Time Objectives

- **RTO**: 1 hour
- **RPO**: 1 hour
- **Uptime SLA**: 99.9%

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Application Metrics**
   - Response time (p50, p95, p99)
   - Error rate
   - Request rate
   - Active users

2. **Infrastructure Metrics**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network throughput

3. **Business Metrics**
   - Daily active users
   - API calls per minute
   - Feature adoption
   - User engagement

### Alert Configuration

```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 1%
    duration: 5m
    severity: critical

  - name: Slow Response Time
    condition: p95_latency > 2000ms
    duration: 10m
    severity: warning

  - name: Low Disk Space
    condition: disk_usage > 90%
    duration: 5m
    severity: critical
```

## Post-Deployment Verification

### Automated Tests

```bash
# Run smoke tests
npm run test:smoke

# Run E2E tests
npm run test:e2e:production

# Run performance tests
npm run test:performance
```

### Manual Verification

1. **Critical User Journeys**
   - User login/logout
   - Dashboard loading
   - Data refresh
   - Report generation

2. **Cross-browser Testing**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

3. **Mobile Responsiveness**
   - iOS Safari
   - Android Chrome
   - Tablet views

## Support & Maintenance

### Support Contacts

- **Development Team**: dev@sentia.com
- **DevOps**: devops@sentia.com
- **Emergency Hotline**: +1-xxx-xxx-xxxx

### Maintenance Windows

- **Scheduled**: Sundays 2-4 AM UTC
- **Emergency**: As needed with 1-hour notice

### Documentation

- **API Documentation**: `/api/docs`
- **User Guide**: `/docs/user-guide`
- **Admin Guide**: `/docs/admin-guide`
- **Troubleshooting**: `/docs/troubleshooting`

---

_Last Updated: September 2025_
_Version: 2.0.0_
_Status: Production Ready_
