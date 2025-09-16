# Post-Deployment Verification Checklist

## 🎯 Immediate Verification (First 30 Minutes)

### Service Health Checks
- [ ] **Development** - https://sentia-manufacturing-development.onrender.com/health
- [ ] **Testing** - https://sentia-manufacturing-testing.onrender.com/health
- [ ] **Production** - https://sentia-manufacturing-production.onrender.com/health
- [ ] **MCP Server** - https://mcp-server-tkyu.onrender.com/health

### Database Connectivity
Run for each environment:
```powershell
# Quick database check
.\validate-render-complete.ps1 -Environment all
```

- [ ] Development database connected
- [ ] Testing database connected
- [ ] Production database connected
- [ ] Connection pool stable
- [ ] Query performance acceptable (<100ms)

### Authentication Test
- [ ] Login page loads
- [ ] Clerk authentication works
- [ ] User session persists
- [ ] Logout functions correctly
- [ ] Role-based access control working

## 🔍 Functional Verification (First Hour)

### Core Features
- [ ] Dashboard loads with data
- [ ] Navigation menu works
- [ ] All page routes accessible:
  - [ ] /dashboard
  - [ ] /forecasting
  - [ ] /inventory
  - [ ] /production
  - [ ] /quality
  - [ ] /working-capital
  - [ ] /what-if
  - [ ] /analytics
  - [ ] /admin

### MCP Server Integration
```powershell
# Test MCP integration
.\test-mcp-integration-e2e.ps1 -Environment production
```

- [ ] MCP server responding
- [ ] AI tools available
- [ ] WebSocket connection established
- [ ] Real-time updates working

### API Integrations
Test each integration endpoint:

#### Xero
- [ ] Connection status: `/api/xero/status`
- [ ] OAuth redirect working
- [ ] Data sync functional

#### Shopify
- [ ] UK store connected
- [ ] USA store connected
- [ ] Webhook endpoints active
- [ ] Order sync working

#### Unleashed
- [ ] API connection established
- [ ] Product sync working
- [ ] Inventory levels accurate

## 📊 Performance Verification (First 2 Hours)

### Load Times
Measure and record:
- [ ] Homepage: _____ seconds (target: <3s)
- [ ] Dashboard: _____ seconds (target: <3s)
- [ ] API responses: _____ ms (target: <500ms)
- [ ] Database queries: _____ ms (target: <100ms)

### Resource Usage
Check in Render Dashboard:
- [ ] CPU usage <70%
- [ ] Memory usage <80%
- [ ] No memory leaks detected
- [ ] Database connections stable

### Error Monitoring
- [ ] Check application logs for errors
- [ ] Review browser console for JavaScript errors
- [ ] Monitor failed API requests
- [ ] Check for 404 errors

## 🔐 Security Verification (First 4 Hours)

### SSL/TLS
- [ ] HTTPS enforced on all domains
- [ ] SSL certificates valid
- [ ] No mixed content warnings
- [ ] Security headers present

### Environment Variables
- [ ] No sensitive data in logs
- [ ] API keys not exposed
- [ ] Database credentials secure
- [ ] JWT secrets unique per environment

### Access Control
- [ ] Authentication required for protected routes
- [ ] API rate limiting active
- [ ] CORS configured correctly
- [ ] SQL injection protection verified

## 📈 Data Verification (First 24 Hours)

### Database Migration
```powershell
# Validate migrated data
.\database-migration-render.ps1 -Operation validate -SourceDB "[render-db-url]"
```

- [ ] User accounts migrated
- [ ] Historical data preserved
- [ ] Relationships intact
- [ ] No data corruption
- [ ] Backup created

### Data Sync
- [ ] Auto-sync jobs running:
  - [ ] Xero sync (every 30 minutes)
  - [ ] Shopify sync (every 15 minutes)
  - [ ] Database sync (every 6 hours)
- [ ] Manual sync buttons working
- [ ] Sync logs showing success

## 🎨 UI/UX Verification

### Visual Inspection
- [ ] Styling rendered correctly
- [ ] Responsive design working:
  - [ ] Desktop (1920x1080)
  - [ ] Tablet (768x1024)
  - [ ] Mobile (375x667)
- [ ] Dark/light theme switching
- [ ] Icons and images loading

### User Workflows
Test critical user paths:

1. **Data Import Flow**
   - [ ] Upload file
   - [ ] Preview data
   - [ ] Confirm import
   - [ ] View imported data

2. **Report Generation**
   - [ ] Select parameters
   - [ ] Generate report
   - [ ] Export to PDF/Excel
   - [ ] Email report

3. **Dashboard Customization**
   - [ ] Drag and drop widgets
   - [ ] Save layout
   - [ ] Load saved layout
   - [ ] Reset to default

## 🔄 Continuous Monitoring (First Week)

### Daily Checks
- [ ] Morning health check (9 AM)
- [ ] Afternoon performance review (2 PM)
- [ ] Evening error log review (6 PM)
- [ ] Overnight job verification (Next day 9 AM)

### Metrics to Track
Create dashboard or spreadsheet:

| Metric | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 |
|--------|-------|-------|-------|-------|-------|-------|-------|
| Uptime % | | | | | | | |
| Avg Response Time | | | | | | | |
| Error Rate | | | | | | | |
| Active Users | | | | | | | |
| API Success Rate | | | | | | | |
| Database Performance | | | | | | | |

### Automated Monitoring
```powershell
# Run continuous monitoring
.\monitor-render-services.ps1 -IntervalSeconds 300
```

## 📝 Documentation Updates

### Update Documentation
- [ ] README.md with new Render URLs
- [ ] API documentation with new endpoints
- [ ] User guide with new login URL
- [ ] Admin guide with Render-specific instructions

### Communication
- [ ] Notify team of new URLs
- [ ] Update internal wikis
- [ ] Send user announcement
- [ ] Update support documentation

## ✅ Final Sign-off Criteria

### Go/No-Go Decision Points

**GO Criteria** (All must be met):
- ✅ All services operational
- ✅ Database fully migrated
- ✅ Authentication working
- ✅ Core features functional
- ✅ Performance acceptable
- ✅ No critical errors in logs

**NO-GO Criteria** (Any triggers rollback):
- ❌ Services failing health checks
- ❌ Database connection issues
- ❌ Authentication broken
- ❌ Data corruption detected
- ❌ Performance degradation >50%
- ❌ Critical security vulnerabilities

## 🚨 Issue Resolution

### Common Issues and Fixes

| Issue | Solution | Command/Action |
|-------|----------|---------------|
| Service not starting | Check build logs | Render Dashboard → Events |
| Database connection failed | Verify DATABASE_URL | Check env variables |
| MCP server timeout | Restart MCP service | Render Dashboard → Manual Deploy |
| SSL certificate error | Trigger cert renewal | Settings → Custom Domains |
| High memory usage | Scale up plan | Settings → Change Plan |

### Escalation Path
1. Check documentation and logs
2. Run diagnostic scripts
3. Contact Render support
4. Implement rollback if needed

## 📋 Verification Scripts

### Quick Health Check
```powershell
# Run all health checks
.\validate-render-complete.ps1 -Environment all
```

### Performance Test
```powershell
# Test response times
.\test-mcp-integration-e2e.ps1 -Environment production
```

### Continuous Monitor
```powershell
# Monitor for 24 hours
.\monitor-render-services.ps1 -MaxIterations 288 -IntervalSeconds 300
```

## 🎯 Success Metrics

After 24 hours, you should see:
- **Uptime**: >99.9%
- **Response Time**: <500ms average
- **Error Rate**: <0.1%
- **All Tests**: Passing
- **User Feedback**: Positive

## 📅 Next Steps After Verification

1. **Day 1-7**: Daily monitoring and optimization
2. **Week 2**: Performance tuning based on metrics
3. **Week 3**: User feedback implementation
4. **Week 4**: Full production cutover from Railway
5. **Month 2**: Decommission Railway services

---

**Remember**: Take screenshots and document any issues for future reference!