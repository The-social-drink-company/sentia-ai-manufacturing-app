# Production Runbook

**BMAD-MULTITENANT-003 Story 7**: Production Readiness Checklist & Runbook
**Last Updated**: 2025-10-23
**On-Call Contact**: Slack #capliquify-alerts

---

## Quick Reference

| Issue | Page | Severity |
|-------|------|----------|
| Service Down | [Page 1](#issue-1-service-down-503) | 🔴 Critical |
| High Error Rate | [Page 2](#issue-2-high-error-rate-1) | 🔴 Critical |
| Slow Response Times | [Page 3](#issue-3-slow-response-times-p95--500ms) | 🟠 High |
| Database Connection Issues | [Page 4](#issue-4-database-connection-exhaustion) | 🔴 Critical |
| Memory Leak | [Page 5](#issue-5-memory-leak-high-heap-usage) | 🟠 High |
| Tenant Hopping Detected | [Page 6](#issue-6-cross-tenant-access-detected-security) | 🔴 Critical |
| Failed Deployments | [Page 7](#issue-7-failed-deployment) | 🟠 High |

---

## Common Issues & Solutions

### Issue 1: Service Down (503)

**Symptoms**:
- Health check returns 503 or times out
- Users cannot access application
- Slack alert: "Service health check failed"

**Diagnosis**:
```bash
# Check service status
curl https://sentia-backend-prod.onrender.com/api/health

# Check Render logs
render logs --tail 100 sentia-backend-prod

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"
```

**Common Causes**:
1. **Database connection failure**
   - Solution: Restart service, check DATABASE_URL
2. **Out of memory**
   - Solution: Check memory usage, restart service, increase memory
3. **Deployment in progress**
   - Solution: Wait for deployment to complete (~2-3 minutes)

**Resolution Steps**:
```bash
# 1. Check Render dashboard
open https://dashboard.render.com

# 2. Restart service (if needed)
render restart sentia-backend-prod

# 3. Monitor recovery
watch -n 5 'curl -s https://sentia-backend-prod.onrender.com/api/health | jq'
```

**Escalation**: If not resolved in 10 minutes → Page on-call engineer

---

### Issue 2: High Error Rate (>1%)

**Symptoms**:
- Sentry shows spike in errors
- Slack alert: "Error rate above 1%"
- Users reporting "something went wrong" messages

**Diagnosis**:
```bash
# Check Sentry dashboard
open https://sentry.io/organizations/capliquify/issues/

# Check error logs
render logs --tail 200 sentia-backend-prod | grep ERROR

# Check specific tenant
render logs --tail 100 sentia-backend-prod | grep "tenant_abc123"
```

**Common Causes**:
1. **Clerk API rate limiting**
   - Error: `Too Many Requests (429)`
   - Solution: Implement Redis caching for session lookups
2. **Database deadlocks**
   - Error: `deadlock detected`
   - Solution: Retry transaction, optimize queries
3. **Tenant schema missing**
   - Error: `schema "tenant_xyz" does not exist`
   - Solution: Run `create_tenant_schema(uuid)` function

**Resolution Steps**:
```bash
# 1. Identify error type from Sentry
# 2. Check affected tenants
psql $DATABASE_URL -c "SELECT id, slug FROM tenants WHERE schema_name NOT IN (SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%');"

# 3. Fix missing schemas
psql $DATABASE_URL -c "SELECT create_tenant_schema('tenant-uuid-here');"
```

---

### Issue 3: Slow Response Times (p95 > 500ms)

**Symptoms**:
- Grafana alert: "p95 latency > 500ms"
- Users report slow page loads
- Timeout errors (504 Gateway Timeout)

**Diagnosis**:
```bash
# Check middleware performance
pnpm exec ts-node tests/performance/middleware-benchmark.ts

# Check database slow queries
psql $DATABASE_URL -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check connection pool
psql $DATABASE_URL -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
```

**Common Causes**:
1. **Database connection pool exhausted**
   - Symptom: `connection pool timeout`
   - Solution: Increase pool size, add PgBouncer
2. **Slow middleware (>10ms)**
   - Symptom: `tenantMiddleware` taking >20ms
   - Solution: Cache tenant lookups in Redis
3. **Large result sets**
   - Symptom: Queries returning 10,000+ rows
   - Solution: Add pagination, limit result size

**Resolution Steps**:
```bash
# 1. Identify bottleneck
clinic doctor -- node server.js
# Run load test, then open clinic report

# 2. Add Redis caching (if middleware slow)
# See: docs/REDIS_CACHING_GUIDE.md

# 3. Optimize slow queries
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM tenant_abc123.products WHERE created_at > NOW() - INTERVAL '30 days';"
```

---

### Issue 4: Database Connection Exhaustion

**Symptoms**:
- Error: `remaining connection slots are reserved`
- Error: `connection pool timeout`
- API requests hanging

**Diagnosis**:
```bash
# Check active connections
psql $DATABASE_URL -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Check connection pool metrics
curl -s https://sentia-backend-prod.onrender.com/metrics | grep database_connections

# Check for connection leaks
psql $DATABASE_URL -c "SELECT pid, application_name, state, query_start, state_change FROM pg_stat_activity WHERE state = 'idle in transaction' AND state_change < NOW() - INTERVAL '5 minutes';"
```

**Resolution Steps**:
```bash
# 1. Kill idle connections (temporary fix)
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND state_change < NOW() - INTERVAL '10 minutes';"

# 2. Restart backend service (releases connections)
render restart sentia-backend-prod

# 3. Long-term fix: Install PgBouncer
# See: docs/PGBOUNCER_SETUP_GUIDE.md
```

---

### Issue 5: Memory Leak (High Heap Usage)

**Symptoms**:
- Memory usage >90%
- Service restarts frequently
- Grafana alert: "Heap usage > 1GB"

**Diagnosis**:
```bash
# Check current memory usage
curl -s https://sentia-backend-prod.onrender.com/metrics | grep nodejs_heap

# Profile memory
clinic doctor -- node server.js
# Run load test, then check heap snapshots
```

**Common Causes**:
1. **Unclosed database connections**
2. **Large in-memory caches**
3. **Event listener leaks**

**Resolution Steps**:
```bash
# 1. Restart service (immediate relief)
render restart sentia-backend-prod

# 2. Increase heap size (temporary)
# In render.yaml:
# NODE_OPTIONS="--max-old-space-size=2048"

# 3. Fix memory leak (permanent)
# Analyze clinic.js report
# Add proper connection cleanup
```

---

### Issue 6: Cross-Tenant Access Detected (Security)

**Symptoms**:
- Audit log shows tenant A accessing tenant B data
- Sentry error: `tenant_not_found` for wrong org ID
- User reports seeing another company's data

**Diagnosis**:
```bash
# Check audit logs
psql $DATABASE_URL -c "SELECT * FROM public.audit_logs WHERE action = 'unauthorized_access' ORDER BY created_at DESC LIMIT 20;"

# Check user's tenant association
psql $DATABASE_URL -c "SELECT u.id, u.email, u.tenant_id, t.slug FROM public.users u JOIN public.tenants t ON u.tenant_id = t.id WHERE u.clerk_user_id = 'user_xyz';"

# Verify search_path
render logs --tail 100 sentia-backend-prod | grep "SET search_path"
```

**Resolution Steps** (CRITICAL - Escalate immediately):
```bash
# 1. Suspend affected tenant (if confirmed breach)
psql $DATABASE_URL -c "UPDATE public.tenants SET subscription_status = 'suspended' WHERE id = 'tenant_xyz';"

# 2. Investigate root cause
# - Review tenant middleware logs
# - Check Clerk organization membership
# - Verify PostgreSQL search_path setting

# 3. Run security audit
pnpm test tests/security/

# 4. Notify security team
# Email: security@capliquify.com
# Slack: #security-incidents
```

**Escalation**: IMMEDIATE - Page CTO and Security Officer

---

### Issue 7: Failed Deployment

**Symptoms**:
- Render deployment status: Failed
- Build errors in logs
- Services not updated after git push

**Diagnosis**:
```bash
# Check build logs
render logs --build sentia-backend-prod

# Check recent commits
git log --oneline -5

# Check environment variables
render env list sentia-backend-prod
```

**Common Causes**:
1. **TypeScript compilation errors**
2. **Missing environment variables**
3. **Database migration failures**

**Resolution Steps**:
```bash
# 1. Rollback to previous deployment
# Render Dashboard → Service → Rollback

# 2. Fix build errors locally
pnpm run build
pnpm test

# 3. Verify environment variables
render env list sentia-backend-prod
# Add missing vars in Render Dashboard

# 4. Re-deploy
git push origin main
```

---

## Operational Procedures

### Procedure 1: Create New Tenant Manually

```bash
# 1. Connect to database
psql $DATABASE_URL

# 2. Insert tenant record
INSERT INTO public.tenants (id, name, slug, schema_name, clerk_organization_id, subscription_tier, subscription_status, max_users, max_entities, features)
VALUES (
  gen_random_uuid(),
  'New Tenant Name',
  'new-tenant-slug',
  'tenant_' || replace(gen_random_uuid()::text, '-', ''),
  'org_clerk_id_here',
  'professional',
  'trial',
  25,
  5000,
  '{"basic_forecasting": true, "ai_forecasting": true, "what_if_analysis": true}'::jsonb
);

# 3. Provision schema
SELECT create_tenant_schema((SELECT id FROM public.tenants WHERE slug = 'new-tenant-slug'));

# 4. Verify
SELECT * FROM public.tenants WHERE slug = 'new-tenant-slug';
\dn tenant_*
```

### Procedure 2: Suspend Tenant (Payment Failure)

```bash
psql $DATABASE_URL -c "UPDATE public.tenants SET subscription_status = 'suspended' WHERE id = 'tenant_xyz';"
```

### Procedure 3: Delete Tenant (Permanent)

```bash
# WARNING: This is permanent and irreversible!

# 1. Backup tenant data first
pg_dump $DATABASE_URL --schema=tenant_abc123 > tenant_abc123_backup_$(date +%Y%m%d).sql

# 2. Delete tenant
psql $DATABASE_URL -c "SELECT delete_tenant_schema('tenant_abc123');"
psql $DATABASE_URL -c "DELETE FROM public.tenants WHERE schema_name = 'tenant_abc123';"

# 3. Verify deletion
psql $DATABASE_URL -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'tenant_abc123';"
# Should return 0 rows
```

### Procedure 4: Restore Tenant from Backup

```bash
# 1. Restore schema
psql $DATABASE_URL < tenant_abc123_backup_20251023.sql

# 2. Restore tenant metadata
psql $DATABASE_URL -c "INSERT INTO public.tenants (...) VALUES (...);"

# 3. Verify restoration
psql $DATABASE_URL -c "SELECT count(*) FROM tenant_abc123.products;"
```

---

## Monitoring Checklist

### Daily Monitoring (Automated)

- [ ] Error rate < 0.1%
- [ ] p95 latency < 200ms
- [ ] Database connections < 70% pool
- [ ] Memory usage < 80%
- [ ] CPU usage < 70%

### Weekly Review

- [ ] Review slow query log
- [ ] Analyze tenant growth trends
- [ ] Check disk space (database)
- [ ] Review security audit logs
- [ ] Update documentation (if needed)

### Monthly Operations

- [ ] Database vacuum and analyze
- [ ] Rotate logs (> 30 days old)
- [ ] Review and archive old tenants (deleted >90 days)
- [ ] Security audit (run penetration tests)
- [ ] Performance baseline re-measurement

---

## Escalation Procedures

### L1: On-Call Engineer (Slack)

**Response Time**: 15 minutes
**Handles**: Service restarts, log investigation, simple fixes

### L2: Senior Engineer (PagerDuty)

**Response Time**: 30 minutes
**Handles**: Database issues, performance optimization, complex bugs

### L3: CTO (Phone)

**Response Time**: 1 hour
**Handles**: Security breaches, data loss, multi-hour outages

---

## Emergency Contacts

| Role | Contact | Phone | Availability |
|------|---------|-------|--------------|
| On-Call Engineer | Slack: #capliquify-alerts | - | 24/7 |
| Senior Engineer | PagerDuty | - | 24/7 |
| DevOps Lead | devops@capliquify.com | +1-XXX-XXX-XXXX | Business hours |
| Database Admin | db-admin@capliquify.com | +1-XXX-XXX-XXXX | Business hours |
| Security Officer | security@capliquify.com | +1-XXX-XXX-XXXX | 24/7 (critical) |
| CTO | cto@capliquify.com | +1-XXX-XXX-XXXX | Critical only |

---

## Production Readiness Sign-Off

**Checklist**:
- [x] All integration tests passing
- [x] Load tests passed (1000 RPS)
- [x] Security audit complete (0 critical)
- [x] Monitoring configured (Prometheus + Grafana)
- [x] Alerts configured (Slack + Email)
- [x] Runbook created
- [ ] Stakeholder approval

**Approved By**:
- [ ] Technical Lead: ___________________ Date: __________
- [ ] DevOps Lead: _____________________ Date: __________
- [ ] Product Owner: ___________________ Date: __________
- [ ] CTO: ____________________________ Date: __________

**Production Launch Date**: TBD

---

**Epic**: BMAD-MULTITENANT-003 Phase 5.3 - Integration & Performance Testing
**Status**: ✅ COMPLETE (7/7 stories)
**Next**: Production deployment approval
