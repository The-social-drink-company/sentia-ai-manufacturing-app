# Sentia Manufacturing Dashboard - Railway Deployment Guide

## Overview
This guide covers the complete deployment process for the Sentia Manufacturing Dashboard on Railway using Nixpacks. The application is a full-stack React + Node.js system with enterprise-grade security and monitoring.

## Prerequisites
- Railway account with CLI installed
- GitHub repository access
- Node.js 18+ locally (for development)
- Environment variables configured

## Quick Start
1. Fork the repository
2. Connect to Railway
3. Configure environment variables
4. Deploy to production

---

## Railway Configuration

### 1. Nixpacks Setup
The project includes a `nixpacks.toml` file optimized for Railway deployment:

```toml
# nixpacks.toml
providers = ["node"]

[phases.install]
cmds = [
    "npm ci --prefer-offline --no-audit",
    "npm cache clean --force"
]

[phases.build]
cmds = [
    "echo 'Building React frontend...'",
    "npm run build",
    "echo 'Build complete. Checking dist folder...'",
    "ls -la dist/ || echo 'WARNING: dist folder not found'",
    "test -f dist/index.html && echo 'SUCCESS: index.html found' || echo 'ERROR: index.html missing'"
]
cacheDirectories = ["node_modules", ".npm", "dist"]

[start]
cmd = "node server.js"

[variables]
NODE_ENV = "production"
NPM_CONFIG_PRODUCTION = "false"
DATABASE_CONNECTION_LIMIT = "5"
DATABASE_IDLE_TIMEOUT = "30000"
BUILD_CACHE_VERSION = "v4-fullstack-fix"
```

### 2. Branch Configuration
The system supports three environments:
- **Production**: `production` branch → https://sentia-manufacturing.railway.app
- **Test**: `test` branch → https://test.sentia-manufacturing.railway.app  
- **Development**: `development` branch → https://dev.sentia-manufacturing.railway.app

### 3. Service Configuration
Each environment automatically provisions:
- **Web Service**: Node.js + React application
- **Database**: Neon PostgreSQL with connection pooling
- **Redis**: Optional caching layer
- **Monitoring**: Health checks and performance tracking

---

## Environment Variables

### Critical Variables (Required)
```bash
# Database
DATABASE_URL="postgresql://username:password@hostname:port/database"
DEV_DATABASE_URL="postgresql://dev-connection-string"
TEST_DATABASE_URL="postgresql://test-connection-string"

# Authentication (Clerk)
CLERK_SECRET_KEY="sk_live_xxxxxxxxxxxx"
VITE_CLERK_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxx"

# Security
JWT_SECRET="your-secure-jwt-secret-key"
SESSION_SECRET="your-secure-session-key"
CSRF_SECRET="your-csrf-protection-secret"
```

### Optional Enhancements
```bash
# AI Forecasting
OPENAI_API_KEY="sk-xxxxxxxxxxxx"

# External APIs
UNLEASHED_API_ID="your-unleashed-api-id"
UNLEASHED_API_KEY="your-unleashed-api-key"

# Monitoring & Analytics
SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
VITE_SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"

# Caching
REDIS_URL="redis://username:password@hostname:port"

# Notifications
SLACK_WEBHOOK="https://hooks.slack.com/services/xxx/xxx/xxx"
ALERT_EMAIL="alerts@yourcompany.com"

# Performance
NODE_OPTIONS="--max-old-space-size=2048"
```

---

## Deployment Steps

### Step 1: Repository Setup
```bash
# Clone the repository
git clone https://github.com/your-org/sentia-manufacturing-dashboard.git
cd sentia-manufacturing-dashboard

# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login
```

### Step 2: Create Railway Project
```bash
# Create new project
railway init

# Link to existing project (if already created)
railway link [project-id]

# Set deployment source
railway connect
```

### Step 3: Environment Configuration
```bash
# Set critical environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="your-neon-connection-string"
railway variables set CLERK_SECRET_KEY="your-clerk-secret"
railway variables set VITE_CLERK_PUBLISHABLE_KEY="your-clerk-public-key"

# Bulk upload from file
railway variables set --from-file .env.production
```

### Step 4: Database Setup
```bash
# The system automatically handles database setup through Neon PostgreSQL
# Ensure DATABASE_URL is configured correctly

# Test database connection
railway run npm run db:test
```

### Step 5: Deploy
```bash
# Deploy current branch
railway up

# Deploy specific branch
railway up --service web --environment production

# Monitor deployment
railway logs --follow
```

### Step 6: Verification
```bash
# Check deployment status
railway status

# Test health endpoints
curl https://your-app.railway.app/health
curl https://your-app.railway.app/ready
curl https://your-app.railway.app/diagnostics

# Run deployment tests
npm run test:deployment
```

---

## Build Process

### Frontend Build (Vite)
The build process is optimized for production:

1. **Code Splitting**: Automatic chunking by feature and vendor libraries
2. **Minification**: Terser with console log removal
3. **Asset Optimization**: Image compression and font optimization
4. **Bundle Analysis**: Automatic bundle size monitoring

### Backend Preparation
1. **Dependency Installation**: Clean npm ci installation
2. **Security Setup**: All middleware configured
3. **Health Checks**: Monitoring systems initialized
4. **Cache Warming**: Redis connection and data pre-loading

---

## Performance Optimizations

### Build Optimizations
- **Terser Minification**: JavaScript compression
- **CSS Code Splitting**: Separate CSS bundles
- **Tree Shaking**: Dead code elimination
- **Asset Inlining**: Small assets embedded as base64

### Runtime Optimizations
- **React Suspense**: Lazy loading for components
- **Chart Virtualization**: Only render visible charts
- **API Response Caching**: Redis-based caching layer
- **Database Query Optimization**: Connection pooling and prepared statements

### CDN & Caching
- **Static Assets**: Automatic CDN distribution
- **Cache Headers**: Proper browser caching
- **Compression**: Gzip/Brotli compression enabled
- **Resource Hints**: DNS prefetch and preconnect

---

## Monitoring & Health Checks

### Automatic Health Monitoring
The system includes comprehensive health checks:

```javascript
// Health check endpoints
GET /health          // Basic health status
GET /ready          // Readiness probe with dependencies
GET /diagnostics    // Detailed system diagnostics
GET /api/health/detailed  // Full health report (authenticated)
```

### Performance Monitoring
- **Web Vitals**: LCP, FID, CLS tracking
- **API Performance**: Response time monitoring
- **Error Tracking**: Sentry integration
- **Resource Usage**: Memory and CPU monitoring

### Alerting
- **Slack Integration**: Automatic incident notifications
- **Email Alerts**: Critical system notifications
- **Sentry Alerts**: Error threshold notifications
- **Health Check Failures**: Automatic escalation

---

## Security Features

### OWASP Compliance
- **Security Headers**: Complete CSP, HSTS, XFO implementation
- **Input Validation**: Joi schema validation
- **XSS Protection**: Automatic HTML sanitization
- **CSRF Protection**: Token-based CSRF prevention
- **Rate Limiting**: Tiered rate limiting by endpoint type

### Authentication & Authorization
- **Clerk Integration**: Enterprise SSO support
- **JWT Tokens**: Secure session management
- **Role-Based Access**: Granular permission system
- **Multi-Entity Support**: Organization-level access control

### Data Protection
- **SQL Injection Prevention**: Parameterized queries
- **NoSQL Injection Prevention**: MongoDB sanitization
- **File Upload Security**: MIME type validation
- **IP Blocking**: Automatic threat detection

---

## Troubleshooting

### Common Issues
1. **Build Failures**: Check node version compatibility
2. **Database Connections**: Verify Neon PostgreSQL credentials
3. **Environment Variables**: Ensure all required vars are set
4. **Memory Issues**: Increase NODE_OPTIONS memory limit
5. **Rate Limiting**: Check API key quotas

### Debug Commands
```bash
# Check build logs
railway logs --service web

# Inspect environment
railway variables

# Test database connection
railway run node -e "console.log(process.env.DATABASE_URL)"

# Check service status
railway status --json

# Force redeploy
railway redeploy
```

### Performance Issues
1. **Slow Loading**: Enable Redis caching
2. **High Memory Usage**: Optimize React components
3. **API Timeouts**: Increase timeout values
4. **Database Slow**: Check connection pooling settings

---

## Scaling & Advanced Configuration

### Horizontal Scaling
```bash
# Scale web service
railway scale --replicas 3

# Configure auto-scaling
railway autoscale --min 1 --max 5 --cpu 80
```

### Resource Limits
```bash
# Set memory limits
railway resources --memory 2GB --cpu 2

# Monitor resource usage
railway metrics
```

### Advanced Nixpacks Configuration
For custom build requirements, modify `nixpacks.toml`:

```toml
# Custom build phases
[phases.setup]
aptPkgs = ["python3", "build-essential"]

[phases.build]
cmds = [
    "npm run build:custom",
    "npm run optimize"
]

# Environment-specific variables
[variables]
CUSTOM_BUILD_FLAG = "true"
OPTIMIZATION_LEVEL = "3"
```

---

## Maintenance & Updates

### Regular Maintenance
1. **Dependency Updates**: Weekly npm audit and updates
2. **Security Patches**: Automatic Dependabot integration
3. **Performance Reviews**: Monthly performance analysis
4. **Health Check Validation**: Daily health monitoring

### Backup & Recovery
- **Database Backups**: Automatic Neon PostgreSQL backups
- **Environment Snapshots**: Railway environment versioning
- **Code Versioning**: Git-based deployment rollbacks
- **Configuration Backup**: Environment variable exports

### Disaster Recovery
1. **Automated Failover**: Multi-region deployment capability
2. **Data Replication**: Cross-region database replication
3. **Service Recovery**: Automatic service restoration
4. **Communication Plan**: Stakeholder notification procedures

---

## Support & Resources

### Documentation
- [API Documentation](./API-DOCUMENTATION.md)
- [Database Schema](./DATABASE-SCHEMA.md)
- [Environment Configuration](./ENVIRONMENT-GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### Monitoring Dashboards
- **Agent Dashboard**: http://localhost:4502 (development)
- **Railway Dashboard**: https://railway.app/dashboard
- **Health Monitoring**: `/api/health/detailed`
- **Performance Metrics**: `/api/monitoring/web-vitals`

### Contact & Support
- **Technical Issues**: Create GitHub issue
- **Security Concerns**: security@sentia.ai
- **Performance Issues**: performance@sentia.ai
- **General Support**: support@sentia.ai

---

*Last Updated: 2025-09-06*
*Version: 2.0.0 - Enterprise Deployment Suite*