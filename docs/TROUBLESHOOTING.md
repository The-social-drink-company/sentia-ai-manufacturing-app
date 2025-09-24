# Troubleshooting Guide

## Common Deployment Issues

### Railway Deployment Issues

#### Build Failures

**Problem**: Build fails with "Module not found" errors
```
Error: Cannot resolve module './components/AI/ForecastingPanel'
```

**Solution**:
1. Check file path case sensitivity (Linux is case-sensitive)
2. Verify all imports use exact case matching
3. Run locally: `npm run build` to catch issues early

**Problem**: Build timeout on Railway
```
Error: Build exceeded 10 minute timeout
```

**Solution**:
1. Optimize build process in `vite.config.js`
2. Enable build caching
3. Remove unnecessary dependencies
4. Check for memory leaks in build scripts

#### Environment Variable Issues

**Problem**: Missing environment variables in production
```
Error: VITE_CLERK_PUBLISHABLE_KEY is not defined
```

**Solution**:
1. Check Railway environment variables dashboard
2. Verify variable names match exactly (case-sensitive)
3. Restart deployment after adding variables
4. Use Railway CLI: `railway variables set KEY=value`

**Problem**: Database connection failures
```
Error: getaddrinfo ENOTFOUND postgresql://...
```

**Solution**:
1. Verify DATABASE_URL is correctly set
2. Check Neon database status
3. Confirm database exists and is accessible
4. Test connection locally with same URL

#### SSL/Domain Issues

**Problem**: Custom domain shows SSL certificate errors
```
Error: NET::ERR_CERT_AUTHORITY_INVALID
```

**Solution**:
1. Wait 24-48 hours for SSL propagation
2. Check domain DNS settings
3. Verify domain is added in Railway dashboard
4. Force SSL refresh: delete and re-add domain

**Problem**: API calls fail with CORS errors
```
Access to fetch at 'https://api.domain.com' from origin 'https://domain.com' has been blocked by CORS policy
```

**Solution**:
1. Update CORS_ORIGINS environment variable
2. Include both www and non-www domains
3. Restart Railway service after changes
4. Check security headers configuration

### Database Issues

#### Connection Pool Exhaustion

**Problem**: Database connection timeouts
```
Error: sorry, too many clients already
```

**Solution**:
1. Optimize connection pool settings in Prisma
2. Check for connection leaks in code
3. Implement proper connection cleanup
4. Consider upgrading Neon plan

#### Migration Failures

**Problem**: Prisma migrations fail in production
```
Error: Database migration failed at step 1
```

**Solution**:
1. Run migrations manually: `npx prisma migrate deploy`
2. Check database schema differences
3. Verify migration files are committed
4. Reset database if safe: `npx prisma db push --force-reset`

### Performance Issues

#### Slow Page Load Times

**Problem**: Dashboard takes >5 seconds to load

**Diagnostic Steps**:
1. Check Network tab in browser DevTools
2. Analyze bundle size: `npm run build && npx vite-bundle-analyzer`
3. Monitor Core Web Vitals
4. Check server response times

**Solutions**:
1. Enable code splitting for large components
2. Implement lazy loading for non-critical components
3. Optimize images and static assets
4. Use service workers for caching

#### Memory Leaks

**Problem**: High memory usage over time

**Diagnostic Steps**:
1. Monitor memory usage in browser DevTools
2. Check for event listener leaks
3. Analyze React component re-renders
4. Use React Developer Tools Profiler

**Solutions**:
1. Implement proper cleanup in useEffect hooks
2. Use React.memo for expensive components
3. Avoid creating objects in render functions
4. Implement proper dependency arrays

### Authentication Issues

#### Clerk Authentication Failures

**Problem**: Users cannot sign in
```
Error: Clerk: Invalid publishable key
```

**Solution**:
1. Verify VITE_CLERK_PUBLISHABLE_KEY is set
2. Check CLERK_SECRET_KEY on server
3. Confirm Clerk dashboard configuration
4. Test with Clerk development keys first

**Problem**: Role-based access not working
```
Error: User role undefined
```

**Solution**:
1. Check user metadata in Clerk dashboard
2. Verify role assignment in user creation flow
3. Update user roles via Clerk API
4. Clear browser cache and cookies

### API Integration Issues

#### OpenAI API Failures

**Problem**: AI forecasting not working
```
Error: OpenAI API key invalid
```

**Solution**:
1. Verify OPENAI_API_KEY environment variable
2. Check API key permissions in OpenAI dashboard
3. Monitor API usage and billing
4. Test with curl: `curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models`

**Problem**: API rate limiting
```
Error: Rate limit exceeded
```

**Solution**:
1. Implement exponential backoff
2. Add request queuing system
3. Cache responses when possible
4. Upgrade OpenAI plan if needed

#### External API Timeouts

**Problem**: Unleashed API calls timeout
```
Error: Request timeout after 10000ms
```

**Solution**:
1. Increase timeout values
2. Implement retry logic
3. Add fallback data sources
4. Monitor API status pages

### Security Issues

#### CORS Policy Violations

**Problem**: Browser blocks API requests
```
Access-Control-Allow-Origin header contains multiple values
```

**Solution**:
1. Configure single origin in CORS settings
2. Use environment-specific origins
3. Check for duplicate CORS middleware
4. Verify headers in network inspector

#### CSP Violations

**Problem**: Content Security Policy blocks resources
```
Refused to load script because it violates CSP directive
```

**Solution**:
1. Update CSP directives in security middleware
2. Add specific domains to allowlist
3. Use nonce for inline scripts
4. Check browser console for specific violations

### Monitoring Issues

#### Sentry Not Capturing Errors

**Problem**: Errors not appearing in Sentry dashboard

**Solution**:
1. Verify SENTRY_DSN environment variable
2. Check Sentry project settings
3. Test error capture manually
4. Confirm environment configuration

#### Health Checks Failing

**Problem**: Health check endpoints return errors
```
Error: Health check failed for database
```

**Solution**:
1. Check individual service status
2. Verify database connectivity
3. Review health check logs
4. Update health check timeouts

## Debugging Tools

### Local Development

```bash
# Check all environment variables
npm run env:check

# Test database connection
npm run db:test

# Run health checks
npm run health:check

# Generate performance report
npm run perf:report
```

### Production Debugging

```bash
# Railway logs
railway logs --tail

# Database status
railway run npx prisma db pull

# Environment variables
railway variables

# Deploy status
railway status
```

### Browser DevTools

1. **Network Tab**: Monitor API calls and response times
2. **Performance Tab**: Analyze runtime performance
3. **Memory Tab**: Check for memory leaks
4. **Security Tab**: Verify SSL certificates
5. **Console Tab**: Monitor errors and warnings

## Emergency Procedures

### Service Outage

1. **Immediate Response**:
   - Check Railway status page
   - Verify custom domain configuration
   - Test direct Railway URL
   - Check third-party service status

2. **Escalation**:
   - Switch to backup deployment
   - Implement maintenance page
   - Notify stakeholders
   - Document incident

### Data Loss Prevention

1. **Database Issues**:
   - Never run destructive migrations in production
   - Always backup before major changes
   - Use transactions for critical operations
   - Test migrations in development first

2. **Recovery Steps**:
   - Restore from latest backup
   - Check data integrity
   - Verify all services are functional
   - Update monitoring systems

### Performance Degradation

1. **Immediate Actions**:
   - Check server metrics
   - Monitor database performance
   - Review recent deployments
   - Scale resources if needed

2. **Optimization Steps**:
   - Implement caching strategies
   - Optimize database queries
   - Review and fix N+1 queries
   - Update resource allocations

## Prevention Best Practices

### Before Deployment

- [ ] Run full test suite locally
- [ ] Test build process
- [ ] Verify environment variables
- [ ] Check dependency versions
- [ ] Review security headers
- [ ] Test database migrations
- [ ] Verify SSL configuration

### Monitoring Setup

- [ ] Configure Sentry error tracking
- [ ] Set up health check alerts
- [ ] Monitor Core Web Vitals
- [ ] Track API response times
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation
- [ ] Test disaster recovery

### Code Quality

- [ ] Use TypeScript for type safety
- [ ] Implement proper error boundaries
- [ ] Add comprehensive logging
- [ ] Use proper dependency injection
- [ ] Implement circuit breakers
- [ ] Add retry mechanisms
- [ ] Use proper caching strategies

## Getting Help

### Railway Support
- Railway Discord: https://discord.gg/railway
- Documentation: https://docs.railway.app
- Status Page: https://status.railway.app

### Community Resources
- GitHub Issues: Create detailed issue reports
- Stack Overflow: Search existing solutions
- Railway Community: Ask deployment questions

### Internal Resources
- Check health dashboard: `/api/health`
- Review monitoring logs: Sentry dashboard
- Database status: Neon console
- Performance metrics: Web Vitals dashboard