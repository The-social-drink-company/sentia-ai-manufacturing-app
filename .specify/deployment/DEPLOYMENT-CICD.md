# Deployment and CI/CD Specifications
## Render-First Cloud Deployment Strategy

### 1. Deployment Overview

#### 1.1 Environment Structure
```
┌──────────────────────────────────────────────┐
│                 PRODUCTION                    │
│         sentia.onrender.com                   │
│         sentiaprod.financeflo.ai              │
└──────────────────┬───────────────────────────┘
                   │ Promotion
┌──────────────────▼───────────────────────────┐
│                  TESTING                      │
│         sentia-testing.onrender.com           │
└──────────────────┬───────────────────────────┘
                   │ Promotion
┌──────────────────▼───────────────────────────┐
│               DEVELOPMENT                     │
│         sentia-dev.onrender.com               │
│         localhost:3000 (local)                │
└───────────────────────────────────────────────┘
```

#### 1.2 Deployment Philosophy
- **NO Docker**: Direct Node.js deployment on Render
- **NO Railway**: Fully migrated to Render platform
- **Automatic**: Git push triggers deployment
- **Zero-downtime**: Blue-green deployment strategy

### 2. Render Configuration

#### 2.1 Service Configuration
```yaml
# render.yaml
services:
  # Web Service
  - type: web
    name: sentia-manufacturing
    env: node
    buildCommand: npm run render:build
    startCommand: npm run render:start
    envVars:
      - key: NODE_ENV
        value: production
      - key: NODE_VERSION
        value: 20
      - key: VITE_CLERK_PUBLISHABLE_KEY
        sync: false
      - key: CLERK_SECRET_KEY
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: sentia-db
          property: connectionString

  # MCP AI Service
  - type: web
    name: sentia-mcp-server
    env: node
    buildCommand: cd mcp-server && npm install
    startCommand: cd mcp-server && npm start
    envVars:
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: OPENAI_API_KEY
        sync: false

databases:
  - name: sentia-db
    plan: standard
    extensions:
      - pgvector
```

#### 2.2 Environment Variables Management
```bash
# Production Environment Variables
NODE_ENV=production
PORT=10000  # Render sets this automatically

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
CLERK_SECRET_KEY=sk_live_REDACTED
CLERK_WEBHOOK_SECRET=whsec_iTUcbgzS5P6zJlXWQkc4zGHnw8yLGt9j

# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# API Keys (External Services)
XERO_CLIENT_ID=xxx
XERO_CLIENT_SECRET=xxx
SHOPIFY_API_KEY=xxx
AMAZON_SP_API_KEY=xxx

# AI Services
ANTHROPIC_API_KEY=xxx
OPENAI_API_KEY=xxx
GOOGLE_AI_API_KEY=xxx

# Application URLs
VITE_API_BASE_URL=https://sentia.onrender.com/api
FRONTEND_URL=https://sentia.onrender.com

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_AUTONOMOUS_TESTING=false
AUTO_FIX_ENABLED=false
```

### 3. CI/CD Pipeline

#### 3.1 GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy Pipeline

on:
  push:
    branches:
      - development
      - test
      - production

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Validate environment
        run: |
          node scripts/validate-environment.js

      - name: Check for drift
        run: |
          node scripts/drift-detector.js

      - name: Lint code
        run: npm run lint

      - name: Run tests
        run: npm run test:ci

      - name: Build application
        run: npm run build
        env:
          VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}

      - name: Security scan
        run: |
          npm audit --audit-level=moderate
          npx snyk test

  deploy-development:
    needs: validate
    if: github.ref == 'refs/heads/development'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render Development
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            https://api.render.com/v1/services/${{ secrets.DEV_SERVICE_ID }}/deploys

      - name: Wait for deployment
        run: |
          sleep 60
          curl --fail https://sentia-dev.onrender.com/health

  deploy-testing:
    needs: validate
    if: github.ref == 'refs/heads/test'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render Testing
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            https://api.render.com/v1/services/${{ secrets.TEST_SERVICE_ID }}/deploys

      - name: Run smoke tests
        run: |
          npm run test:smoke

      - name: Notify QA team
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"Testing environment updated. Please begin UAT."}'

  deploy-production:
    needs: validate
    if: github.ref == 'refs/heads/production'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://sentia.onrender.com

    steps:
      - name: Create backup
        run: |
          pg_dump ${{ secrets.PROD_DATABASE_URL }} > backup-$(date +%Y%m%d).sql

      - name: Deploy to Render Production
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            https://api.render.com/v1/services/${{ secrets.PROD_SERVICE_ID }}/deploys

      - name: Health check
        run: |
          for i in {1..10}; do
            if curl --fail https://sentia.onrender.com/health; then
              echo "Deployment successful"
              exit 0
            fi
            sleep 30
          done
          echo "Deployment failed"
          exit 1

      - name: Rollback on failure
        if: failure()
        run: |
          curl -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            https://api.render.com/v1/services/${{ secrets.PROD_SERVICE_ID }}/rollback
```

### 4. Build Optimization

#### 4.1 Build Script
```javascript
// scripts/render-build.js
const fs = require('fs');
const { execSync } = require('child_process');

console.log('Starting Render build process...');

// 1. Clean previous builds
console.log('Cleaning previous builds...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}

// 2. Install dependencies
console.log('Installing dependencies...');
execSync('npm ci --production=false', { stdio: 'inherit' });

// 3. Build frontend
console.log('Building frontend...');
execSync('npm run build:vite', { stdio: 'inherit' });

// 4. Generate Prisma client
console.log('Generating Prisma client...');
execSync('npx prisma generate', { stdio: 'inherit' });

// 5. Run migrations (only in production)
if (process.env.NODE_ENV === 'production') {
  console.log('Running database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
}

// 6. Optimize assets
console.log('Optimizing assets...');
execSync('node scripts/optimize-assets.js', { stdio: 'inherit' });

console.log('Build completed successfully!');
```

#### 4.2 Start Script
```javascript
// scripts/render-start.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  const numCPUs = os.cpus().length;
  console.log(`Master process ${process.pid} starting ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  require('../server.js');
}
```

### 5. Health Monitoring

#### 5.1 Health Check Endpoint
```javascript
// server.js - MUST BE FIRST ROUTE
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    checks: {}
  };

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'connected';
  } catch (error) {
    health.status = 'degraded';
    health.checks.database = 'disconnected';
  }

  // Redis check
  try {
    await redis.ping();
    health.checks.redis = 'connected';
  } catch (error) {
    health.checks.redis = 'disconnected';
  }

  // External services
  health.checks.clerk = clerkClient ? 'configured' : 'not configured';
  health.checks.mcp = mcpServerHealthy ? 'healthy' : 'unhealthy';

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

#### 5.2 Monitoring Script
```javascript
// scripts/monitor-production.js
const axios = require('axios');

const endpoints = [
  'https://sentia.onrender.com/health',
  'https://sentia-mcp.onrender.com/health',
  'https://sentiaprod.financeflo.ai/health'
];

async function checkHealth() {
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint);
      console.log(`✓ ${endpoint}: ${response.data.status}`);

      if (response.data.status !== 'healthy') {
        await notifyOps(`Service degraded: ${endpoint}`, response.data);
      }
    } catch (error) {
      console.error(`✗ ${endpoint}: ${error.message}`);
      await notifyOps(`Service down: ${endpoint}`, error);
    }
  }
}

// Run every 5 minutes
setInterval(checkHealth, 5 * 60 * 1000);
checkHealth();
```

### 6. Rollback Strategy

#### 6.1 Automatic Rollback Triggers
```yaml
rollback-triggers:
  - health-check-failures: 3
  - error-rate: > 5%
  - response-time: > 3000ms
  - memory-usage: > 90%
  - restart-count: > 5
```

#### 6.2 Manual Rollback Process
```bash
# 1. Identify last stable deployment
render deployments list --service sentia-manufacturing

# 2. Rollback to specific deployment
render deployments rollback --service sentia-manufacturing --id dep-xxxxx

# 3. Verify rollback
curl https://sentia.onrender.com/health

# 4. Investigate issue
render logs --service sentia-manufacturing --tail 1000
```

### 7. Database Management

#### 7.1 Migration Strategy
```bash
# Development migrations
npx prisma migrate dev --name feature-description

# Testing migrations (dry run)
npx prisma migrate deploy --dry-run

# Production migrations (automatic in build)
npx prisma migrate deploy
```

#### 7.2 Backup and Restore
```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL | gzip > backup-$(date +\%Y\%m\%d).sql.gz

# Restore procedure
gunzip < backup-20250921.sql.gz | psql $DATABASE_URL
```

### 8. Security Deployment Practices

#### 8.1 Secret Management
```yaml
secrets:
  storage: Render environment variables
  rotation: Monthly for API keys
  access: Role-based (dev/qa/ops)
  audit: All access logged
```

#### 8.2 Security Headers
```javascript
// security-headers.js
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```

### 9. Performance Optimization

#### 9.1 CDN Configuration
```javascript
// Static assets served through CDN
app.use('/static', express.static('dist', {
  maxAge: '1y',
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, immutable');
    }
  }
}));
```

#### 9.2 Compression
```javascript
// Enable gzip compression
import compression from 'compression';

app.use(compression({
  threshold: 0,
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

### 10. Deployment Checklist

#### 10.1 Pre-Deployment
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Environment variables verified
- [ ] Database migrations tested

#### 10.2 Deployment
- [ ] Backup created
- [ ] Deployment triggered
- [ ] Health checks passing
- [ ] Logs monitored
- [ ] Metrics normal

#### 10.3 Post-Deployment
- [ ] User acceptance verified
- [ ] Performance monitored
- [ ] Error rates checked
- [ ] Rollback plan ready
- [ ] Team notified

### 11. Incident Response

#### 11.1 Severity Levels
```yaml
P0 - Critical: Complete outage
  Response: Immediate
  Rollback: Automatic

P1 - High: Major feature broken
  Response: Within 1 hour
  Rollback: Manual decision

P2 - Medium: Minor feature issue
  Response: Within 4 hours
  Rollback: Next deployment

P3 - Low: Cosmetic issue
  Response: Next business day
  Rollback: Not required
```

#### 11.2 Incident Process
1. Detection (monitoring/user report)
2. Assessment (severity determination)
3. Response (fix or rollback)
4. Resolution (deploy fix)
5. Post-mortem (lessons learned)

---

*This deployment and CI/CD specification ensures reliable, secure, and efficient deployment of the Sentia Manufacturing Dashboard on Render.*

