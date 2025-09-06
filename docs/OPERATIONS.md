# Operations Guide

## Overview
Comprehensive operational procedures and best practices for managing the Sentia Manufacturing Dashboard in production.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Monitoring Setup](#monitoring-setup)
3. [Performance Optimization](#performance-optimization)
4. [Security Operations](#security-operations)
5. [Capacity Planning](#capacity-planning)
6. [Cost Optimization](#cost-optimization)
7. [Compliance Operations](#compliance-operations)

---

## System Architecture

### Production Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│  Railway Apps   │────│   Neon DB       │
│   (Railway)     │    │  (Auto-scaling) │    │ (PostgreSQL)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     CDN         │    │     Redis       │    │   File Storage  │
│  (Cloudflare)   │    │   (Upstash)     │    │     (AWS S3)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Environment Configuration

#### Production
- **URL**: https://sentia-manufacturing.com
- **Railway Project**: `sentia-manufacturing-prod`
- **Database**: Neon PostgreSQL (Primary + Read Replica)
- **Cache**: Redis (Upstash)
- **Storage**: AWS S3
- **CDN**: Cloudflare

#### Staging  
- **URL**: https://staging.sentia-manufacturing.com
- **Railway Project**: `sentia-manufacturing-staging`
- **Database**: Neon PostgreSQL (Staging)
- **Cache**: Redis (Upstash Staging)

#### Development
- **URL**: https://dev.sentia-manufacturing.com
- **Railway Project**: `sentia-manufacturing-dev`
- **Database**: Neon PostgreSQL (Dev)

### Service Dependencies

```yaml
Core Services:
  - Frontend (React + Vite)
  - Backend API (Node.js + Express)
  - Database (PostgreSQL)
  - Cache (Redis)

External APIs:
  - Clerk (Authentication)
  - Amazon SP-API
  - Shopify API  
  - Unleashed Software API
  - QuickBooks API

Monitoring:
  - Sentry (Error Tracking)
  - Railway Metrics
  - Custom APM
  - Uptime Robot

Notifications:
  - Slack
  - Email (SendGrid)
  - SMS (Twilio)
  - PagerDuty
```

---

## Monitoring Setup

### Metrics Collection

#### Application Metrics
```typescript
// Key metrics tracked
const metrics = {
  // Performance
  responseTime: 'avg, p95, p99',
  throughput: 'requests per second',
  errorRate: 'percentage of failed requests',
  
  // Business
  activeUsers: 'concurrent user count',
  conversionRate: 'percentage completing actions',
  revenue: 'hourly revenue tracking',
  inventoryLevels: 'critical stock alerts',
  
  // System
  cpuUsage: 'percentage utilization',
  memoryUsage: 'percentage utilization', 
  diskUsage: 'percentage utilization',
  databaseConnections: 'active connection count',
  
  // Custom
  apiLatency: 'external API response times',
  jobQueueLength: 'background job backlog',
  cacheHitRate: 'cache effectiveness'
};
```

#### Health Check Endpoints
```bash
# Application health
GET /health
{
  "status": "healthy",
  "timestamp": "2025-01-XX",
  "uptime": 3600,
  "version": "1.0.0"
}

# API health
GET /api/health  
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "external_apis": {
    "clerk": "healthy",
    "amazon": "healthy",
    "shopify": "degraded"
  }
}

# Detailed system info
GET /api/system/info
{
  "memory": {"used": 512, "total": 1024},
  "cpu": {"usage": 45},
  "database": {"connections": 12, "max": 20},
  "uptime": 86400
}
```

### Alert Configuration

#### Performance Alerts
```yaml
High Error Rate:
  condition: error_rate > 5%
  duration: 5 minutes
  severity: high
  channels: [slack, email]
  
Slow Response Time:
  condition: response_time_p95 > 2000ms
  duration: 3 minutes
  severity: medium
  channels: [slack]
  
High CPU Usage:
  condition: cpu_usage > 80%
  duration: 10 minutes
  severity: medium
  channels: [slack, email]
  
Memory Usage Critical:
  condition: memory_usage > 90%
  duration: 5 minutes
  severity: high
  channels: [pagerduty, sms]
```

#### Business Alerts
```yaml
Low Conversion Rate:
  condition: conversion_rate < 2%
  duration: 60 minutes
  severity: medium
  channels: [email]
  
Revenue Anomaly:
  condition: revenue_change > -20%
  duration: 30 minutes
  severity: high
  channels: [slack, email]
  
Critical Inventory:
  condition: critical_items > 0
  duration: immediate
  severity: critical
  channels: [pagerduty, sms, slack]
```

### Dashboard Setup

#### Operational Dashboard
Access: https://dashboard.sentia-manufacturing.com/ops

**Widgets:**
- System overview (status, uptime, version)
- Performance metrics (response time, error rate, throughput)
- Resource utilization (CPU, memory, disk)
- Active alerts and incidents
- Recent deployments
- External service status

#### Business Dashboard  
Access: https://dashboard.sentia-manufacturing.com/business

**Widgets:**
- Key performance indicators
- Revenue tracking
- User engagement metrics
- Inventory status
- Conversion funnels

---

## Performance Optimization

### Application Performance

#### Frontend Optimization
```bash
# Bundle analysis
npm run build:analyze

# Performance audit
npm run lighthouse -- --url=https://sentia-manufacturing.com

# Core Web Vitals monitoring
# Automated via RUM service
```

#### Backend Optimization  
```sql
-- Query performance analysis
EXPLAIN ANALYZE SELECT * FROM orders 
WHERE status = 'pending' 
AND created_at > NOW() - INTERVAL '1 day';

-- Index optimization
CREATE INDEX CONCURRENTLY idx_orders_status_date 
ON orders(status, created_at) 
WHERE status = 'pending';

-- Connection pooling
-- Set in DATABASE_URL: ?pgbouncer=true&connection_limit=20
```

#### Caching Strategy
```typescript
// Redis caching layers
const cacheConfig = {
  // Short-term (5 minutes)
  userSessions: 300,
  apiResponses: 300,
  
  // Medium-term (1 hour)  
  dashboardData: 3600,
  inventoryLevels: 3600,
  
  // Long-term (24 hours)
  staticContent: 86400,
  configurations: 86400
};

// CDN caching
const cdnConfig = {
  staticAssets: '1 year',
  apiResponses: '5 minutes',
  htmlPages: '1 hour'
};
```

### Database Performance

#### Connection Management
```bash
# Monitor connection usage
railway connect postgres
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

# Optimize connection pool
export DATABASE_POOL_MIN=5
export DATABASE_POOL_MAX=20
export DATABASE_IDLE_TIMEOUT=30000
```

#### Query Optimization
```sql
-- Identify slow queries
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 20;

-- Add missing indexes
SELECT schemaname, tablename, attname
FROM pg_stats 
WHERE schemaname = 'public' 
AND n_distinct > 100 
AND correlation < 0.1;
```

#### Maintenance Tasks
```bash
# Automated maintenance (runs nightly)
#!/bin/bash
# Update statistics
psql $DATABASE_URL -c "ANALYZE;"

# Vacuum tables
psql $DATABASE_URL -c "VACUUM;"

# Reindex if fragmentation > 20%
psql $DATABASE_URL -c "REINDEX INDEX CONCURRENTLY idx_orders_status;"
```

---

## Security Operations

### Access Control

#### Role-Based Permissions
```typescript
const rolePermissions = {
  super_admin: ['*'], // All permissions
  admin: [
    'dashboard.view', 'dashboard.edit',
    'users.manage', 'system.configure',
    'reports.view', 'audit.view'
  ],
  manager: [
    'dashboard.view', 'dashboard.edit',
    'reports.view', 'inventory.manage'  
  ],
  operator: [
    'dashboard.view', 'inventory.view',
    'orders.process'
  ],
  viewer: [
    'dashboard.view', 'reports.view'
  ]
};
```

#### API Security
```bash
# Rate limiting configuration
export RATE_LIMIT_WINDOW=60000      # 1 minute
export RATE_LIMIT_MAX=100           # 100 requests/minute
export RATE_LIMIT_AUTH_MAX=20       # 20 auth requests/minute
```

### Security Monitoring

#### Log Analysis
```bash
# Security event monitoring
railway logs --filter "unauthorized\|blocked\|failed" --tail 100

# Suspicious activity patterns  
grep -E "(sql.*injection|xss|rce)" logs/security.log

# Failed authentication attempts
grep "auth.*failed" logs/security.log | wc -l
```

#### Vulnerability Scanning
```bash
# Dependency scanning
npm audit --audit-level=moderate
npm run security:scan

# SAST analysis  
npm run analyze:security

# Container scanning
docker scout cves sentia-dashboard:latest
```

### Incident Response

#### Security Incident Classification
```yaml
Critical (P0):
  - Active data breach
  - Unauthorized admin access
  - System compromise
  - Response: Immediate (15 min)
  
High (P1):
  - Suspected breach
  - Privilege escalation
  - DDoS attack
  - Response: 1 hour
  
Medium (P2):
  - Brute force attempts
  - Suspicious activity
  - Policy violations  
  - Response: 4 hours
```

---

## Capacity Planning

### Traffic Projections

#### Current Baseline
```yaml
Production Metrics (Weekly Average):
  Daily Active Users: 2,500
  Peak Concurrent Users: 400
  API Requests/Day: 150,000
  Database Queries/Day: 500,000
  Storage Growth: 5GB/month
```

#### Growth Planning
```yaml
6 Month Projections:
  DAU Growth: +50% (3,750 users)
  Peak Concurrent: +50% (600 users)  
  API Requests: +75% (262,500/day)
  Database Size: +100% (current + 30GB)
  
12 Month Projections:
  DAU Growth: +100% (5,000 users)
  Peak Concurrent: +100% (800 users)
  API Requests: +150% (375,000/day)
  Database Size: +200% (current + 60GB)
```

### Scaling Strategy

#### Horizontal Scaling
```bash
# Railway auto-scaling configuration
railway service scale --min-replicas 2 --max-replicas 10
railway service scale --cpu-target 70 --memory-target 80

# Database read replicas
# Configure in Neon dashboard for read-heavy workloads
```

#### Vertical Scaling
```yaml
Current Resources:
  CPU: 2 vCPUs per instance
  Memory: 2GB per instance
  Database: 4GB storage, 0.25 vCPU
  
Next Tier (at 80% utilization):
  CPU: 4 vCPUs per instance  
  Memory: 4GB per instance
  Database: 8GB storage, 0.5 vCPU
```

### Performance Thresholds

#### Scale-Up Triggers
```yaml
CPU Usage > 70%: Add replica
Memory Usage > 80%: Add replica  
Response Time > 1500ms: Add replica
Error Rate > 2%: Investigate + scale
Database Connections > 80%: Add read replica
```

#### Scale-Down Triggers
```yaml
CPU Usage < 30%: Remove replica (min 2)
Memory Usage < 50%: Remove replica (min 2)
Response Time < 500ms: Consider reducing replicas
Low Traffic Hours: Scale down to minimum
```

---

## Cost Optimization

### Current Costs (Monthly)

```yaml
Infrastructure:
  Railway: $50/month (2 services, auto-scaling)
  Neon Database: $30/month (4GB storage)
  Redis (Upstash): $10/month (1GB)
  AWS S3: $5/month (50GB storage)
  Cloudflare: $0 (Free tier)
  Total: $95/month

External Services:
  Clerk: $25/month (1000 MAU)
  Sentry: $26/month (10k errors/month)
  SendGrid: $15/month (5k emails/month)
  Total: $66/month

Grand Total: $161/month
```

### Optimization Strategies

#### Cost Monitoring
```bash
# Track usage metrics
railway usage --project sentia-manufacturing-prod

# Database storage optimization  
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Right-Sizing Resources
```yaml
Production Optimizations:
  - Use read replicas for heavy read workloads
  - Implement aggressive caching strategies
  - Optimize images and assets
  - Clean up unused database indexes
  - Archive old audit logs to cheaper storage
  
Development Optimizations:
  - Use smaller database instances
  - Implement resource scheduling (off during nights/weekends)
  - Share staging resources across environments
```

#### Reserved Instances
```bash
# For predictable workloads, consider:
# - Railway reserved capacity
# - AWS S3 storage classes (IA, Archive)
# - Database reserved instances (if migrating)
```

---

## Compliance Operations

### GDPR Compliance

#### Data Processing Activities
```yaml
User Data Collection:
  - Email addresses (authentication)
  - Usage analytics (anonymized)
  - Financial data (encrypted at rest)
  - Audit logs (90-day retention)

Data Retention:
  - User accounts: Until deletion requested
  - Financial data: 7 years (regulatory requirement)
  - Audit logs: 90 days  
  - Analytics data: 2 years (anonymized)
```

#### Subject Rights Management
```bash
# Data export request
curl -X GET /api/gdpr/export/:userId \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Data deletion request  
curl -X DELETE /api/gdpr/delete/:userId \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Consent management
curl -X GET /api/gdpr/consent/:userId \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### SOC 2 Compliance

#### Control Implementation
```yaml
Security Controls:
  - Multi-factor authentication (Implemented)
  - Role-based access control (Implemented)  
  - Data encryption at rest and in transit (Implemented)
  - Security monitoring and alerting (Implemented)
  
Availability Controls:
  - High availability architecture (Implemented)
  - Automated backups (Implemented)
  - Disaster recovery procedures (Implemented)
  - Performance monitoring (Implemented)
  
Processing Integrity:
  - Input validation (Implemented)
  - Error handling (Implemented)
  - Transaction logging (Implemented)
  - Data quality checks (Implemented)
```

#### Audit Trail
```sql
-- Audit log schema
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Query for compliance reporting
SELECT action, count(*) 
FROM audit_logs 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY action 
ORDER BY count DESC;
```

### Financial Data Compliance

#### PCI DSS (if handling card data)
```yaml
Requirements:
  - Secure network (TLS 1.3, firewall rules)
  - Cardholder data protection (tokenization)
  - Vulnerability management (regular scanning)
  - Access control (least privilege)
  - Network monitoring (continuous)
  - Information security policy (documented)
```

#### SOX Compliance (if publicly traded)
```yaml
Financial Reporting Controls:
  - Revenue recognition accuracy
  - Financial data integrity  
  - Change management procedures
  - Segregation of duties
  - Management review processes
```

---

## Maintenance Procedures

### Regular Maintenance

#### Daily Tasks (Automated)
```bash
#!/bin/bash
# System health check
curl -f https://sentia-manufacturing.com/health > /dev/null
STATUS=$?

# Database maintenance
railway exec -- psql $DATABASE_URL -c "SELECT pg_stat_reset();"

# Log rotation
railway exec -- logrotate /etc/logrotate.conf

# Backup verification
aws s3 ls s3://sentia-backups/database/ | tail -1
```

#### Weekly Tasks
```bash
#!/bin/bash  
# Dependency updates
npm audit fix
npm outdated

# Performance review
npm run analyze:performance

# Security scan
npm run security:full-scan

# Capacity review
railway metrics --period 7d
```

#### Monthly Tasks
```bash
#!/bin/bash
# Full security audit
npm run audit:full

# Performance optimization review
npm run optimize:review

# Cost optimization analysis
railway usage --detailed

# Compliance review
npm run compliance:check
```

### Emergency Maintenance

#### Process
1. **Risk Assessment**
   - Security impact
   - Business impact
   - Technical urgency
   - Available maintenance windows

2. **Communication Plan**
   - Stakeholder notification
   - User communication
   - Status page updates
   - Team coordination

3. **Execution**
   - Pre-change validation
   - Change implementation
   - Post-change verification
   - Rollback if needed

4. **Documentation**
   - Change record
   - Lessons learned
   - Process improvements
   - Runbook updates

---

## Troubleshooting Guide

### Common Issues

#### Application Won't Start
```bash
# Check recent deployments
railway deployments --limit 5

# Review environment variables
railway variables --all

# Check application logs
railway logs --tail 100

# Validate configuration
npm run config:validate
```

#### Database Connection Issues
```bash
# Test database connectivity
railway connect postgres --test

# Check connection pool
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

# Verify database configuration
echo $DATABASE_URL | grep -o '[^/]*$'

# Check for connection leaks
SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';
```

#### Performance Issues
```bash
# Check system resources
railway metrics --period 1h

# Analyze slow queries
SELECT query, calls, mean_exec_time FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;

# Review API response times
curl -w "@curl-format.txt" -o /dev/null https://sentia-manufacturing.com/api/health

# Check cache hit rates
railway exec -- redis-cli info stats | grep hit_rate
```

### Escalation Path

1. **Level 1**: On-call engineer (Response: 15 minutes)
2. **Level 2**: Engineering lead (Escalate after 30 minutes)
3. **Level 3**: VP Engineering (Escalate after 1 hour)
4. **Level 4**: CTO (P0 incidents only, escalate after 2 hours)

---

*Last Updated: January 2025*
*Version: 1.0.0*
*Next Review: April 2025*