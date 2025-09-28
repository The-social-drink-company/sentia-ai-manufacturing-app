# SENTIA MANUFACTURING DASHBOARD - ENTERPRISE RENDER DEPLOYMENT GUIDE

## **Fortune 500-Level Multi-Branch Deployment Strategy**

This comprehensive guide provides enterprise-grade deployment procedures for the Sentia Manufacturing Dashboard on Render platform with Fortune 500-level reliability, monitoring, and operational excellence.

---

## **📋 TABLE OF CONTENTS**

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture Overview](#architecture-overview)
4. [Multi-Branch Strategy](#multi-branch-strategy)
5. [Deployment Process](#deployment-process)
6. [Environment Configuration](#environment-configuration)
7. [Health Monitoring](#health-monitoring)
8. [Operational Procedures](#operational-procedures)
9. [Troubleshooting](#troubleshooting)
10. [Security Guidelines](#security-guidelines)

---

## **🎯 OVERVIEW**

The Sentia Manufacturing Dashboard is a comprehensive enterprise application featuring:

- **Frontend**: React 19 + Vite 7 with modern TypeScript
- **Backend**: Node.js 20+ + Express with enterprise middleware
- **Database**: PostgreSQL with pgvector extension for AI capabilities
- **Authentication**: Clerk production authentication system
- **AI Integration**: Multi-LLM orchestration via MCP server
- **Real-time**: WebSocket + Server-Sent Events
- **Monitoring**: Comprehensive health checks and observability

### **Key Features**
- Manufacturing operations management
- Financial working capital analysis
- AI-powered forecasting and optimization
- Real-time production monitoring
- Quality control and analytics
- External API integrations (Xero, Shopify, Unleashed)

---

## **🔧 PREREQUISITES**

### **Required Accounts & Services**
- [x] **Render Account** with billing enabled for Pro plans
- [x] **GitHub Repository** with proper branch structure
- [x] **Clerk Account** with production authentication setup
- [x] **Domain Configuration** (optional but recommended)

### **Required Credentials**
- [x] **Production Database** credentials (PostgreSQL with pgvector)
- [x] **Clerk Authentication** keys (production environment)
- [x] **External API Keys**: Xero, Shopify, Unleashed, OpenAI, Anthropic
- [x] **Security Secrets**: JWT, Session, MCP authentication

### **Development Tools**
- [x] **Node.js 20+** for local development and testing
- [x] **pnpm 9+** package manager
- [x] **Git** with proper branch access
- [x] **Render CLI** (optional but recommended)

---

## **🏗️ ARCHITECTURE OVERVIEW**

### **Service Architecture**
```
┌─────────────────────────────────────────────────────────┐
│                    RENDER PLATFORM                      │
├─────────────────────────────────────────────────────────┤
│  Production Environment (Pro Plan)                     │
│  ├── Web Service: sentia-manufacturing-production      │
│  ├── Database: sentia-db-production (Pro PostgreSQL)   │
│  ├── Redis: sentia-redis-production (Pro)              │
│  └── Custom Domain: dashboard.sentia.com               │
├─────────────────────────────────────────────────────────┤
│  Testing Environment (Starter Plan)                    │
│  ├── Web Service: sentia-manufacturing-testing         │
│  ├── Database: sentia-db-testing (Starter PostgreSQL)  │
│  └── URL: sentia-manufacturing-testing.onrender.com    │
├─────────────────────────────────────────────────────────┤
│  Development Environment (Starter Plan)                │
│  ├── Web Service: sentia-manufacturing-development     │
│  ├── Database: sentia-db-development (Starter)         │
│  └── URL: sentia-manufacturing-development.onrender.com│
├─────────────────────────────────────────────────────────┤
│  Hotfix Environment (Manual Deploy)                    │
│  ├── Web Service: sentia-manufacturing-hotfix          │
│  ├── Database: Uses Production Database                │
│  └── URL: sentia-manufacturing-hotfix.onrender.com     │
└─────────────────────────────────────────────────────────┘
```

### **Application Stack**
```
Frontend (React/Vite)
├── Authentication: Clerk
├── State Management: Zustand + TanStack Query
├── UI Framework: Tailwind CSS + shadcn/ui
├── Charts: Recharts + Chart.js
└── Real-time: WebSocket + SSE

Backend (Node.js/Express)
├── Database: Prisma ORM + PostgreSQL
├── Authentication: Clerk middleware
├── APIs: REST + GraphQL endpoints
├── Real-time: Socket.io + SSE
├── AI Integration: MCP server communication
└── Monitoring: Health checks + metrics

External Integrations
├── Financial: Xero accounting integration
├── E-commerce: Shopify UK & USA stores
├── ERP: Unleashed inventory management
├── AI: OpenAI + Anthropic LLM services
└── Microsoft: Graph API integration
```

---

## **🌿 MULTI-BRANCH STRATEGY**

### **Branch Structure**
```
main/production    ← Production-ready code
├── test          ← UAT and quality assurance
├── development   ← Active development
└── hotfix        ← Emergency production fixes
```

### **Environment Progression**
```
Development → Testing → Production
     ↑           ↑         ↑
   Feature    Quality   Production
 Development  Assurance  Release
```

### **Deployment Flow**
1. **Development**: Continuous deployment on every commit
2. **Testing**: Deployed when test branch is updated
3. **Production**: Manual deployment after UAT approval
4. **Hotfix**: Manual deployment for emergency fixes

---

## **🚀 DEPLOYMENT PROCESS**

### **Phase 1: Initial Setup**

#### **1.1 Repository Configuration**
```bash
# Clone repository
git clone https://github.com/The-social-drink-company/sentia-manufacturing-dashboard.git
cd sentia-manufacturing-dashboard

# Verify branch structure
git branch -a
# Should show: main, development, test, production, hotfix
```

#### **1.2 Render Configuration**
Upload the optimized render configuration:
- File: `render-enterprise-optimized.yaml`
- Location: Root directory of repository

#### **1.3 Database Setup**
Create PostgreSQL databases with pgvector extension:
```sql
-- Production Database
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Testing Database
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Development Database
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### **Phase 2: Environment Configuration**

#### **2.1 Production Environment**
Configure production environment variables in Render dashboard:

**Core Configuration:**
```bash
NODE_ENV=production
BRANCH=production
PORT=10000
LOG_LEVEL=error
```

**Database:**
```bash
DATABASE_URL=postgresql://[generated-by-render]
PROD_DATABASE_URL=postgresql://[generated-by-render]
```

**Security:**
```bash
JWT_SECRET=[generate-secure-secret]
SESSION_SECRET=[generate-secure-secret]
CORS_ORIGINS=https://sentia-manufacturing-production.onrender.com
```

**Clerk Authentication:**
```bash
CLERK_ENVIRONMENT=production
CLERK_SECRET_KEY=sk_live_[your-production-key]
VITE_CLERK_PUBLISHABLE_KEY=pk_live_[your-production-key]
VITE_CLERK_DOMAIN=clerk.financeflo.ai
```

#### **2.2 Testing Environment**
Similar configuration with testing-specific values:
```bash
NODE_ENV=testing
BRANCH=testing
CORS_ORIGINS=https://sentia-manufacturing-testing.onrender.com
```

#### **2.3 Development Environment**
Development configuration with enhanced logging:
```bash
NODE_ENV=development
BRANCH=development
LOG_LEVEL=debug
ENABLE_DETAILED_LOGGING=true
```

### **Phase 3: Service Deployment**

#### **3.1 Production Deployment**
```bash
# 1. Deploy render.yaml configuration
# Upload render-enterprise-optimized.yaml to Render

# 2. Configure environment variables
# Use Render dashboard to set all production variables

# 3. Deploy production branch
git checkout production
git push origin production

# 4. Monitor deployment
# Check Render dashboard for build progress
```

#### **3.2 Testing Deployment**
```bash
# Deploy to testing environment
git checkout test
git push origin test
```

#### **3.3 Development Deployment**
```bash
# Deploy to development environment
git checkout development
git push origin development
```

### **Phase 4: Verification**

#### **4.1 Health Check Verification**
```bash
# Production Health Check
curl https://sentia-manufacturing-production.onrender.com/health

# Expected Response:
{
  "status": "healthy",
  "service": "sentia-manufacturing-dashboard",
  "version": "1.0.10",
  "environment": "production",
  "timestamp": "2025-01-XX...",
  "database": { "connected": true, "status": "operational" },
  "mcp": { "connected": true, "url": "..." }
}
```

#### **4.2 Application Verification**
- [ ] Dashboard loads successfully
- [ ] Authentication works (Clerk login)
- [ ] Database connectivity confirmed
- [ ] External API integrations functional
- [ ] Real-time features operational

#### **4.3 Performance Verification**
- [ ] Build time < 15 minutes
- [ ] Application loads < 3 seconds
- [ ] Memory usage < 80% of allocated
- [ ] Health checks respond < 1 second

---

## **⚙️ ENVIRONMENT CONFIGURATION**

### **Environment Variable Management**

#### **Production Variables**
Use the `EnvironmentManager` utility to generate and validate configurations:

```javascript
import { EnvironmentManager } from './config/environment-templates.js';

// Generate production environment
const prodEnv = EnvironmentManager.generateEnvironmentFile('production', {
  DATABASE_URL: 'postgresql://prod-db-url',
  CLERK_SECRET_KEY: 'sk_live_your_key',
  // ... other production values
});

// Validate configuration
const validation = EnvironmentManager.validateEnvironment('production', variables);
console.log('Errors:', validation.errors);
console.log('Warnings:', validation.warnings);
```

#### **Security Best Practices**
1. **Never commit secrets** to version control
2. **Use Render's secret management** for sensitive values
3. **Generate unique secrets** for each environment
4. **Rotate secrets regularly** (quarterly recommended)
5. **Use environment-specific domains** and CORS origins

### **Required Environment Variables by Environment**

#### **Production (Required)**
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `JWT_SECRET`
- `SESSION_SECRET`
- `CORS_ORIGINS`

#### **Testing (Required)**
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`

#### **Development (Required)**
- `DATABASE_URL` (minimum required)

---

## **🏥 HEALTH MONITORING**

### **Health Check Endpoints**

#### **Basic Health Check**
```bash
GET /health
```
Returns basic service status and version information.

#### **Comprehensive Health Check**
```bash
GET /health/detailed
```
Returns detailed status of all system components:
- Database connectivity and performance
- MCP server status
- Clerk authentication status
- External API integration status
- System resources and performance

#### **Health History**
```bash
GET /health/history
```
Returns historical health check data for trend analysis.

#### **Kubernetes-Style Probes**
```bash
GET /health/liveness   # Application is running
GET /health/readiness  # Application is ready to serve traffic
```

### **Monitoring Integration**

#### **Health Monitor Setup**
```javascript
import HealthMonitor from './services/health/comprehensive-health-monitor.js';

const healthMonitor = new HealthMonitor();
const healthMiddleware = healthMonitor.getHealthMiddleware();

// Basic health check
app.get('/health', healthMiddleware.basic);

// Comprehensive health check
app.get('/health/detailed', healthMiddleware.detailed);

// Health history
app.get('/health/history', healthMiddleware.history);

// Kubernetes-style probes
app.get('/health/liveness', healthMiddleware.liveness);
app.get('/health/readiness', healthMiddleware.readiness);
```

#### **Render Integration**
Configure Render's health check path in render.yaml:
```yaml
healthCheckPath: /health
```

### **Performance Monitoring**

#### **Memory Monitoring**
The application includes automatic memory monitoring:
- Garbage collection optimization
- Memory usage alerts at 80% threshold
- Automatic memory reports generated

#### **Response Time Monitoring**
Health checks include response time measurements:
- Database query performance
- External API response times
- Overall health check duration

---

## **🔄 OPERATIONAL PROCEDURES**

### **Deployment Workflows**

#### **Standard Deployment (Development → Testing → Production)**
```bash
# 1. Development Phase
git checkout development
# Make changes, commit, push
git push origin development
# Auto-deploys to development environment

# 2. Testing Phase
git checkout test
git merge development
git push origin test
# Auto-deploys to testing environment

# 3. Quality Assurance
# Perform UAT testing on testing environment
# Get stakeholder approval

# 4. Production Deployment
git checkout production
git merge test
git push origin production
# Auto-deploys to production environment
```

#### **Hotfix Deployment**
```bash
# 1. Create hotfix from production
git checkout production
git checkout -b hotfix/critical-fix

# 2. Make critical fix
# Edit files, commit changes
git commit -m "hotfix: critical production issue"

# 3. Deploy to hotfix environment for testing
git checkout hotfix
git merge hotfix/critical-fix
git push origin hotfix
# Manually deploy to hotfix environment

# 4. Deploy to production (after verification)
git checkout production
git merge hotfix/critical-fix
git push origin production
```

### **Rollback Procedures**

#### **Production Rollback**
```bash
# 1. Identify last known good commit
git log --oneline production

# 2. Revert to last good commit
git checkout production
git revert [commit-hash]
git push origin production

# 3. Monitor rollback deployment
# Check health endpoints and application functionality
```

#### **Database Rollback**
```bash
# For database schema changes, use Prisma migrations
npx prisma migrate reset
npx prisma migrate deploy
```

### **Maintenance Procedures**

#### **Scheduled Maintenance**
1. **Announcement**: Notify users 24-48 hours in advance
2. **Backup**: Create database and application backups
3. **Maintenance**: Apply updates to testing environment first
4. **Verification**: Test all functionality in testing environment
5. **Production**: Apply changes to production environment
6. **Monitoring**: Monitor for 2-4 hours post-deployment

#### **Security Updates**
1. **Assessment**: Evaluate security impact and urgency
2. **Testing**: Apply updates to development/testing environments
3. **Approval**: Get security team approval for production deployment
4. **Deployment**: Deploy during low-usage periods
5. **Verification**: Confirm security improvements

---

## **🔧 TROUBLESHOOTING**

### **Common Issues**

#### **Build Failures**
```bash
# Issue: Memory exhaustion during build
# Solution: Increase Node.js memory limit
NODE_OPTIONS='--max-old-space-size=8192' npm run build

# Issue: Dependency conflicts
# Solution: Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install --frozen-lockfile
```

#### **Database Connection Issues**
```bash
# Issue: Database connection timeout
# Check: DATABASE_URL format and credentials
# Solution: Verify PostgreSQL service status in Render

# Issue: pgvector extension missing
# Solution: Run in database console:
CREATE EXTENSION IF NOT EXISTS vector;
```

#### **Authentication Issues**
```bash
# Issue: Clerk authentication failing
# Check: CLERK_SECRET_KEY and VITE_CLERK_PUBLISHABLE_KEY
# Solution: Verify keys match your Clerk environment

# Issue: CORS errors
# Check: CORS_ORIGINS configuration
# Solution: Ensure origins match your domain
```

#### **Performance Issues**
```bash
# Issue: High memory usage
# Check: Memory reports at /memory-report.json
# Solution: Enable garbage collection and memory optimization

# Issue: Slow response times
# Check: Health check response times
# Solution: Optimize database queries and enable caching
```

### **Diagnostic Commands**

#### **Health Status**
```bash
# Check overall application health
curl https://your-app.onrender.com/health/detailed

# Check specific components
curl https://your-app.onrender.com/health/history
```

#### **System Status**
```bash
# Check Render service status
curl https://your-app.onrender.com/api/status

# Check memory usage
curl https://your-app.onrender.com/memory-report.json
```

#### **Log Analysis**
```bash
# View Render logs via dashboard
# Check for error patterns and performance metrics
# Monitor startup times and health check failures
```

---

## **🔒 SECURITY GUIDELINES**

### **Authentication Security**

#### **Clerk Configuration**
- Use production Clerk environment for all public-facing deployments
- Configure proper domain restrictions
- Enable webhook signature verification
- Implement proper session management

#### **API Security**
- Validate all external API credentials
- Use environment variables for all secrets
- Implement rate limiting for API endpoints
- Use HTTPS only for all communications

### **Database Security**

#### **Access Control**
- Use database connection pooling
- Implement proper user permissions
- Enable SSL/TLS for database connections
- Regular security updates

#### **Data Protection**
- Encrypt sensitive data at rest
- Implement proper backup strategies
- Use parameterized queries (Prisma ORM)
- Regular security audits

### **Application Security**

#### **Input Validation**
- Validate all user inputs
- Sanitize data before database operations
- Implement CSRF protection
- Use content security policies

#### **Error Handling**
- Don't expose sensitive information in errors
- Log security events appropriately
- Implement proper error boundaries
- Monitor for suspicious activities

---

## **📊 MONITORING & OBSERVABILITY**

### **Key Metrics**

#### **Application Metrics**
- Response time percentiles (p50, p95, p99)
- Error rates by endpoint
- Active user sessions
- Database query performance

#### **Infrastructure Metrics**
- CPU utilization
- Memory usage and garbage collection
- Database connection pool status
- Network latency

#### **Business Metrics**
- Manufacturing KPIs
- Financial calculations accuracy
- User engagement metrics
- API integration success rates

### **Alerting**

#### **Critical Alerts**
- Application downtime (health check failures)
- Database connectivity issues
- High error rates (>5%)
- Memory exhaustion (>90% usage)

#### **Warning Alerts**
- Elevated response times (>2 seconds)
- Low disk space
- External API degradation
- Authentication issues

### **Logging Standards**

#### **Log Levels**
- **ERROR**: System errors requiring immediate attention
- **WARN**: Issues that need monitoring but don't break functionality
- **INFO**: General operational information
- **DEBUG**: Detailed information for development (development only)

#### **Structured Logging**
```javascript
import { logInfo, logWarn, logError } from './src/utils/logger.js';

// Proper logging with context
logInfo('User authentication successful', {
  userId,
  method: 'clerk',
  duration: responseTime
});

logError('Database connection failed', error, {
  attempt: retryCount,
  database: 'production'
});
```

---

## **🚀 DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Security secrets generated and stored
- [ ] External API credentials verified
- [ ] Build process tested locally
- [ ] Health checks implemented
- [ ] Performance benchmarks established

### **Deployment**
- [ ] render.yaml configuration uploaded
- [ ] All services created in Render
- [ ] Environment variables set in Render dashboard
- [ ] Database services provisioned with pgvector
- [ ] Custom domains configured (if applicable)
- [ ] SSL certificates enabled
- [ ] Auto-deployment configured for branches

### **Post-Deployment**
- [ ] Health checks passing
- [ ] Application accessibility verified
- [ ] Authentication flow tested
- [ ] Database connectivity confirmed
- [ ] External integrations functional
- [ ] Performance metrics baseline established
- [ ] Monitoring and alerting active
- [ ] Documentation updated

### **Production Readiness**
- [ ] Load testing completed
- [ ] Security scan performed
- [ ] Backup procedures verified
- [ ] Disaster recovery plan tested
- [ ] Team training completed
- [ ] Support procedures documented
- [ ] Monitoring dashboards configured
- [ ] Stakeholder approval obtained

---

## **📞 SUPPORT & MAINTENANCE**

### **Support Contacts**
- **Technical Lead**: [Your Team Lead]
- **DevOps Engineer**: [DevOps Contact]
- **Database Administrator**: [DBA Contact]
- **Security Team**: [Security Contact]

### **Escalation Procedures**
1. **Level 1**: Development team (response: 1 hour)
2. **Level 2**: Technical lead (response: 30 minutes)
3. **Level 3**: DevOps/Infrastructure team (response: 15 minutes)
4. **Level 4**: Emergency response team (response: immediate)

### **Maintenance Windows**
- **Regular Maintenance**: Sundays 2:00-4:00 AM UTC
- **Emergency Maintenance**: As needed with 2-hour notice
- **Security Updates**: Within 24 hours of release

---

## **📚 ADDITIONAL RESOURCES**

### **Documentation**
- [Render Platform Documentation](https://render.com/docs)
- [React/Vite Documentation](https://vitejs.dev/)
- [Prisma ORM Documentation](https://www.prisma.io/docs)
- [Clerk Authentication Documentation](https://clerk.com/docs)

### **Monitoring Tools**
- Render Dashboard: Built-in monitoring and logging
- Health Check Endpoints: Custom application health monitoring
- Database Monitoring: PostgreSQL performance metrics
- External API Monitoring: Integration status tracking

### **Development Resources**
- GitHub Repository: Source code and issue tracking
- Development Environment: Testing and feature development
- API Documentation: Generated from code annotations
- Architecture Diagrams: System design and data flow

---

**Document Version**: 1.0.10
**Last Updated**: September 2025
**Next Review**: December 2025

**Status**: ✅ Production Ready - Fortune 500 Level Deployment Strategy

---