# Enterprise Operations Guide

## System Overview

The Sentia Manufacturing Dashboard is a comprehensive enterprise-grade manufacturing intelligence platform that provides real-time monitoring, predictive analytics, and automated workflows for modern manufacturing operations.

### Architecture Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   React + Vite  │◄──►│   Node.js       │◄──►│   PostgreSQL    │
│   Port: 3000    │    │   Port: 5000    │    │   Neon Cloud    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Monitoring    │    │   Cache Layer   │    │   External APIs │
│   Production    │    │   Redis         │    │   Xero/Shopify  │
│   Alerts        │    │   Optional      │    │   Amazon/OpenAI │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Daily Operations

### 1. System Health Monitoring

#### Health Check Endpoints
```bash
# Basic health check
curl https://your-domain.com/health

# Detailed system status
curl https://your-domain.com/health/detailed

# Readiness probe
curl https://your-domain.com/health/ready

# Metrics for monitoring
curl https://your-domain.com/metrics
```

#### Expected Responses
- **Healthy System**: Status 200, all dependencies connected
- **Degraded System**: Status 200, some non-critical services offline
- **Unhealthy System**: Status 503, critical dependencies failed

### 2. Performance Monitoring

#### Key Metrics to Monitor
- **CPU Usage**: Should stay below 80%
- **Memory Usage**: Should stay below 85%
- **Response Time**: Should be under 2 seconds (95th percentile)
- **Error Rate**: Should be below 1%
- **Database Connections**: Monitor connection pool usage

#### Monitoring Dashboard
Access the production monitoring dashboard at:
```
https://your-domain.com/monitoring/dashboard.html
```

### 3. User Management

#### Role-Based Access Control (RBAC)
The system supports four primary user roles:

1. **Admin**: Full system access, user management
2. **Manager**: Dashboard configuration, report access
3. **Operator**: Production monitoring, data entry
4. **Viewer**: Read-only access to dashboards

#### User Operations
```bash
# View user analytics
curl https://your-domain.com/api/admin/users/analytics

# Check active sessions
curl https://your-domain.com/api/admin/sessions

# System configuration
curl https://your-domain.com/api/admin/config
```

## Deployment Operations

### 1. Environment Management

#### Development Environment
- **URL**: https://sentia-manufacturing-dashboard-development.up.railway.app
- **Purpose**: Active development and testing
- **Auto-deploy**: Enabled on `development` branch push

#### Testing Environment
- **URL**: https://sentiatest.financeflo.ai
- **Purpose**: User Acceptance Testing (UAT)
- **Deploy**: Manual promotion from development

#### Production Environment
- **URL**: https://web-production-1f10.up.railway.app
- **Purpose**: Live operations
- **Deploy**: Manual promotion with approval required

### 2. Deployment Scripts

#### Quick Deployment Commands
```bash
# Deploy to development
npm run deploy:development

# Deploy to testing
npm run deploy:testing

# Deploy to production (requires confirmation)
npm run deploy:production

# Run deployment with full checklist
node scripts/deploy-railway.js
```

#### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Build completes successfully
- [ ] No critical security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Database migrations ready (if any)

### 3. Continuous Integration/Continuous Deployment (CI/CD)

#### GitHub Actions Pipeline
The CI/CD pipeline automatically:
1. Runs code quality checks
2. Executes test suites
3. Performs security scans
4. Builds and deploys to appropriate environments
5. Runs post-deployment verification

#### Manual Overrides
For emergency deployments:
```bash
# Bypass CI/CD pipeline (use with caution)
railway login
railway environment production
railway up
```

## Troubleshooting Guide

### 1. Common Issues

#### Application Won't Start
**Symptoms**: 502 Bad Gateway, Connection refused
**Diagnosis**:
```bash
# Check Railway logs
railway logs

# Check process status
ps aux | grep node

# Verify environment variables
railway variables
```

**Solutions**:
1. Verify all required environment variables are set
2. Check database connectivity
3. Restart the service: `railway restart`

#### High Memory Usage
**Symptoms**: Slow response times, memory warnings
**Diagnosis**:
```bash
# Check memory usage
node -e "console.log(process.memoryUsage())"

# Monitor in real-time
npm run monitor:production
```

**Solutions**:
1. Restart the application
2. Check for memory leaks in recent code changes
3. Scale up memory allocation in Railway

#### Database Connection Issues
**Symptoms**: "Database not connected" in health checks
**Diagnosis**:
```bash
# Test database connection
npm run db:test-connection

# Check connection pool
curl https://your-domain.com/health/detailed
```

**Solutions**:
1. Verify DATABASE_URL environment variable
2. Check Neon database status
3. Restart database connections: `npm run db:reconnect`

### 2. Performance Issues

#### Slow Response Times
**Diagnosis**:
```bash
# Run performance analysis
npm run performance

# Check specific endpoints
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/health
```

**Solutions**:
1. Enable Redis caching
2. Optimize database queries
3. Implement CDN for static assets

#### High CPU Usage
**Symptoms**: CPU consistently above 85%
**Solutions**:
1. Identify CPU-intensive operations
2. Optimize algorithms
3. Scale horizontally with multiple instances

### 3. External Service Failures

#### API Integration Issues
Common integrations that may fail:
- Xero API (financial data)
- Shopify API (e-commerce data)  
- Amazon SP-API (marketplace data)
- OpenAI API (AI features)

**Diagnosis**:
```bash
# Check service status
curl https://your-domain.com/api/integrations/status

# Test specific integration
curl https://your-domain.com/api/integrations/test/xero
```

**Solutions**:
1. Verify API keys and credentials
2. Check rate limits
3. Enable fallback/cache mechanisms
4. Contact external service support

## Maintenance Procedures

### 1. Regular Maintenance Tasks

#### Daily
- [ ] Check system health dashboards
- [ ] Review error logs
- [ ] Monitor performance metrics
- [ ] Verify backup completion

#### Weekly  
- [ ] Run security scans
- [ ] Review user activity logs
- [ ] Clean up old logs and artifacts
- [ ] Performance optimization review

#### Monthly
- [ ] Update dependencies (non-breaking)
- [ ] Review and rotate API keys
- [ ] Capacity planning review
- [ ] Disaster recovery test

### 2. Backup and Recovery

#### Automated Backups
- **Database**: Daily automated backups via Neon
- **Application Data**: Stored in Railway persistent storage
- **Configuration**: Version controlled in Git

#### Recovery Procedures
```bash
# Database recovery
railway connect postgres
\i backup_YYYYMMDD.sql

# Application rollback
railway rollback [deployment-id]

# Full environment restore
node scripts/disaster-recovery.js --restore
```

### 3. Security Maintenance

#### Regular Security Tasks
- [ ] Monitor security alerts
- [ ] Review access logs
- [ ] Update SSL certificates (automatic via Railway)
- [ ] Audit user permissions

#### Security Incident Response
1. **Identify**: Monitor alerts and logs
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove threats and vulnerabilities
4. **Recover**: Restore normal operations
5. **Learn**: Post-incident analysis and improvements

## Scaling Operations

### 1. Vertical Scaling

#### Railway Resource Scaling
```bash
# View current resources
railway status

# Scale up memory/CPU (via Railway dashboard)
# Navigate to: Project → Service → Settings → Resources
```

### 2. Horizontal Scaling

#### Multi-Instance Deployment
For high-traffic scenarios:
1. Enable multiple Railway service instances
2. Implement load balancing
3. Use Redis for session management
4. Configure sticky sessions if needed

### 3. Database Scaling

#### Neon PostgreSQL Scaling
- **Read Replicas**: For read-heavy workloads
- **Connection Pooling**: Optimize connection usage
- **Query Optimization**: Regular query performance review

## Monitoring and Alerting

### 1. Monitoring Stack

#### Built-in Monitoring
- **Production Monitor**: `monitoring/production-monitor.js`
- **Health Checks**: Comprehensive system health endpoints
- **Performance Metrics**: Real-time performance tracking

#### External Monitoring (Recommended)
- **Sentry**: Error tracking and performance monitoring
- **Datadog**: Infrastructure monitoring
- **Pingdom**: Uptime monitoring

### 2. Alert Configuration

#### Critical Alerts
- CPU > 85% for 5 minutes
- Memory > 90% for 3 minutes  
- Error rate > 5% for 1 minute
- Response time > 2 seconds (95th percentile)
- Database connection failures

#### Alert Channels
- **Email**: Immediate notifications
- **Slack**: Team collaboration
- **PagerDuty**: On-call escalation

### 3. Metrics Dashboard

#### Access Real-time Metrics
```
URL: https://your-domain.com/monitoring/dashboard.html
```

#### Key Metrics Displayed
- System performance (CPU, Memory, Load)
- Application metrics (Requests, Errors, Response time)
- Business metrics (Active users, Orders, Revenue)
- Recent alerts and system status

## Contact Information

### Technical Support
- **DevOps Team**: devops@sentia-manufacturing.com
- **Development Team**: development@sentia-manufacturing.com
- **On-Call Support**: +1-XXX-XXX-XXXX

### External Vendors
- **Railway Support**: support@railway.app
- **Neon Database**: support@neon.tech
- **Clerk Authentication**: support@clerk.dev

### Emergency Contacts
- **System Administrator**: admin@sentia-manufacturing.com
- **Security Team**: security@sentia-manufacturing.com
- **Business Operations**: operations@sentia-manufacturing.com

---

**Document Version**: 1.0  
**Last Updated**: September 10, 2025  
**Next Review**: October 10, 2025

*This guide should be reviewed and updated quarterly or after major system changes.*