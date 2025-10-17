# Production Deployment Checklist

## Pre-Deployment Validation

### Code Quality & Testing

- [ ] All unit tests passing (`npm test`)
- [ ] All integration tests passing
- [ ] ESLint no errors (`npm run lint`)
- [ ] Build completes successfully (`npm run build`)
- [ ] No console errors in development environment
- [ ] Code review completed and approved
- [ ] Security audit passed (`npm audit`)

### Performance Validation

- [ ] Lighthouse score > 90
- [ ] Bundle size < 2MB
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Memory usage stable (no leaks detected)
- [ ] API response times < 500ms (95th percentile)

### Feature Verification

- [ ] Authentication flow working (login/logout)
- [ ] All dashboard widgets loading correctly
- [ ] Real-time data streaming functional
- [ ] AI features responding correctly
- [ ] Export/Import functionality tested
- [ ] All navigation routes accessible
- [ ] Mobile responsive design verified

### Security Checklist

- [ ] Environment variables properly secured
- [ ] API keys not exposed in client code
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

## Environment Configuration

### Railway Production Environment

- [ ] Production branch up to date with test branch
- [ ] Environment variables configured in Railway
  - [ ] NODE_ENV=production
  - [ ] DATABASE_URL configured
  - [ ] VITE_CLERK_PUBLISHABLE_KEY set
  - [ ] CLERK_SECRET_KEY set
  - [ ] All API keys configured (Xero, Shopify, etc.)
  - [ ] Redis URL configured (if using)
  - [ ] Sentry DSN configured
- [ ] Database migrations up to date
- [ ] SSL certificates valid
- [ ] Domain DNS configured correctly

### External Services

- [ ] Clerk authentication production keys set
- [ ] Neon database production instance ready
- [ ] Redis cache configured (optional)
- [ ] Sentry error tracking enabled
- [ ] External APIs (Xero, Shopify, Amazon) credentials verified
- [ ] Email service (SendGrid) configured
- [ ] SMS service (Twilio) configured (if used)

## Deployment Steps

### 1. Final Code Preparation

```bash
# Ensure on production branch
git checkout production

# Merge from test branch
git merge test

# Verify no conflicts
git status

# Run final build
npm run build

# Test production build locally
npm run preview
```

### 2. Database Preparation

```bash
# Run database migrations
npx prisma migrate deploy

# Verify database schema
npx prisma studio

# Backup existing production data
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Railway Deployment

```bash
# Use deployment script
npm run deploy:production

# OR manual deployment
git push origin production

# Monitor deployment
railway logs --service=web --environment=production
```

### 4. Health Check Verification

```bash
# Check basic health
curl https://your-production-url.com/health

# Check detailed health
curl https://your-production-url.com/health/detailed

# Check readiness
curl https://your-production-url.com/health/ready

# Check metrics
curl https://your-production-url.com/metrics
```

## Post-Deployment Verification

### Immediate Checks (First 5 minutes)

- [ ] Application loads without errors
- [ ] Login functionality working
- [ ] Dashboard displays data correctly
- [ ] No 500 errors in logs
- [ ] Database connections stable
- [ ] Memory usage normal
- [ ] CPU usage normal

### Short-term Monitoring (First hour)

- [ ] Error rate < 0.1%
- [ ] Response times stable
- [ ] No memory leaks
- [ ] WebSocket connections stable
- [ ] Background jobs running
- [ ] Scheduled tasks executing
- [ ] Cache hit rates normal

### Extended Monitoring (First 24 hours)

- [ ] Daily reports generating
- [ ] Backup processes running
- [ ] Log rotation working
- [ ] No security alerts
- [ ] User feedback positive
- [ ] Performance metrics stable
- [ ] API rate limits not exceeded

## Rollback Procedure

### Immediate Rollback Triggers

- [ ] Application fails to start
- [ ] Database connection failures
- [ ] Authentication completely broken
- [ ] Data corruption detected
- [ ] Critical security vulnerability exposed

### Rollback Steps

1. **Revert Railway Deployment**

   ```bash
   # Rollback to previous deployment
   railway rollback --environment=production
   ```

2. **Revert Database (if needed)**

   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Clear Cache**

   ```bash
   # Clear Redis cache
   redis-cli FLUSHALL
   ```

4. **Notify Stakeholders**
   - Send rollback notification to team
   - Update status page
   - Communicate with affected users

## Communication Plan

### Pre-Deployment

- [ ] Maintenance window announced (24 hours prior)
- [ ] Stakeholders notified
- [ ] Support team briefed
- [ ] Status page updated

### During Deployment

- [ ] Status page showing maintenance mode
- [ ] Real-time updates in deployment channel
- [ ] Support team on standby
- [ ] Monitoring dashboard active

### Post-Deployment

- [ ] Deployment success announcement
- [ ] Release notes published
- [ ] Support team debriefed
- [ ] User documentation updated
- [ ] Training materials updated (if needed)

## Success Criteria

### Technical Metrics

- Error rate < 0.1%
- Uptime > 99.9%
- Response time < 500ms (p95)
- Successful request rate > 99%
- Zero critical security issues
- All health checks passing

### Business Metrics

- User login success rate > 99%
- Data accuracy 100%
- Report generation functional
- Export/Import working
- All integrations connected
- Real-time updates flowing

## Sign-off Requirements

### Technical Sign-off

- [ ] DevOps Engineer approval
- [ ] Security team approval
- [ ] Database administrator approval
- [ ] QA team approval

### Business Sign-off

- [ ] Product Owner approval
- [ ] Operations Manager approval
- [ ] Customer Success approval
- [ ] Executive stakeholder approval

## Emergency Contacts

### Technical Team

- DevOps Lead: [Contact Info]
- Backend Lead: [Contact Info]
- Frontend Lead: [Contact Info]
- Database Admin: [Contact Info]

### Business Team

- Product Owner: [Contact Info]
- Operations Manager: [Contact Info]
- Customer Success: [Contact Info]

### External Support

- Railway Support: support@railway.app
- Neon Database: support@neon.tech
- Clerk Support: support@clerk.dev

## Appendix

### Useful Commands

```bash
# View logs
railway logs --service=web --environment=production

# Check environment variables
railway variables --environment=production

# Database console
railway run --service=postgres psql

# Redis console
railway run --service=redis redis-cli

# Run migrations
railway run --service=web npx prisma migrate deploy

# Emergency restart
railway restart --service=web --environment=production
```

### Monitoring URLs

- Application: https://your-production-url.com
- Health Check: https://your-production-url.com/health
- Metrics: https://your-production-url.com/metrics
- Railway Dashboard: https://railway.app/project/[project-id]
- Sentry Dashboard: https://sentry.io/organizations/[org]/projects/
- Status Page: https://status.your-domain.com

### Documentation References

- Deployment Guide: `/ENTERPRISE_GIT_WORKFLOW.md`
- API Documentation: `/context/api-documentation/`
- Environment Variables: `/.env.enterprise.template`
- Architecture Diagram: `/ENTERPRISE_TRANSFORMATION_SUMMARY.md`

---

**Last Updated**: September 15, 2025
**Version**: 1.0.5
**Status**: Development Environment - Awaiting Railway Environment Variables
**Current URL**: https://sentiadeploy.financeflo.ai (502 - needs env vars)
**Railway Project**: 6d1ca9b2-75e2-46c6-86a8-ed05161112fe
**Development Service**: e985e174-ebed-4043-81f8-7b1ab2e86cd2
