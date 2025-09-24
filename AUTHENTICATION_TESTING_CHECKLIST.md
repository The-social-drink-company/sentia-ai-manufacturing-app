# Authentication Testing Checklist for Sentia Manufacturing Dashboard

## Pre-Deployment Verification

### Environment URLs
- [ ] Development: https://sentia-manufacturing-development.onrender.com
- [ ] Production: https://sentia-manufacturing-production.onrender.com
- [ ] MCP Server: https://mcp-server-tkyu.onrender.com

### Deployment Status Check
```bash
# Check if services are live (should return 200 OK)
curl -I https://sentia-manufacturing-development.onrender.com/health
curl -I https://sentia-manufacturing-production.onrender.com/health
curl -I https://mcp-server-tkyu.onrender.com/health
```

## Phase 1: Basic Health Checks (5 minutes)

### Development Environment
- [ ] Navigate to https://sentia-manufacturing-development.onrender.com
- [ ] Verify page loads without errors
- [ ] Check browser console for any critical errors
- [ ] Verify Clerk production key is loaded (check console logs)

### Production Environment
- [ ] Navigate to https://sentia-manufacturing-production.onrender.com
- [ ] Verify page loads without errors
- [ ] Check browser console for any critical errors
- [ ] Verify Clerk production key is loaded

## Phase 2: Authentication Flow Testing (10 minutes)

### Sign Up Flow
1. **Development Environment**
   - [ ] Click "Sign Up" button
   - [ ] Verify redirect to Clerk sign-up page
   - [ ] Create new account with:
     - Email: test-dev-[timestamp]@sentia.com
     - Password: TestUser2025!
   - [ ] Complete email verification (if required)
   - [ ] Verify redirect to /dashboard after sign-up
   - [ ] Check user role assignment (should be 'viewer' by default)

2. **Production Environment**
   - [ ] Click "Sign Up" button
   - [ ] Verify redirect to Clerk sign-up page
   - [ ] Create new account with:
     - Email: test-prod-[timestamp]@sentia.com
     - Password: ProdUser2025!
   - [ ] Complete email verification (if required)
   - [ ] Verify redirect to /dashboard after sign-up
   - [ ] Check user role assignment

### Sign In Flow
1. **Development Environment**
   - [ ] Sign out if logged in
   - [ ] Click "Sign In" button
   - [ ] Enter credentials created above
   - [ ] Verify successful authentication
   - [ ] Verify redirect to /dashboard
   - [ ] Check session persistence (refresh page)

2. **Production Environment**
   - [ ] Sign out if logged in
   - [ ] Click "Sign In" button
   - [ ] Enter credentials created above
   - [ ] Verify successful authentication
   - [ ] Verify redirect to /dashboard
   - [ ] Check session persistence

## Phase 3: Dashboard Access & Permissions (15 minutes)

### Navigation Testing
- [ ] **Sidebar Navigation**
  - [ ] Dashboard (Overview)
  - [ ] Demand Forecasting
  - [ ] Inventory Management
  - [ ] Production Tracking
  - [ ] Quality Control
  - [ ] Working Capital
  - [ ] What-If Analysis
  - [ ] Financial Reports
  - [ ] Data Import

### Widget Functionality
- [ ] **KPI Strip**: Verify metrics load
- [ ] **Demand Forecast Chart**: Check data visualization
- [ ] **Inventory Levels**: Confirm real-time updates
- [ ] **Production Metrics**: Test gauge displays
- [ ] **Quality Metrics**: Verify trend charts
- [ ] **Financial Overview**: Check currency formatting

### Button Actions
- [ ] **Export Button**: Download JSON data
- [ ] **Save Layout**: Persist dashboard configuration
- [ ] **Share Button**: Copy shareable link
- [ ] **Quick Actions**:
  - [ ] Working Capital button → /working-capital
  - [ ] What-If Analysis button → /what-if
  - [ ] Run Forecast button → /forecasting
  - [ ] Optimize Stock button → /inventory

## Phase 4: Real Data Verification (20 minutes)

### API Integration Tests

#### Financial Data
```javascript
// Check in browser console
fetch('/api/financial/working-capital', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('clerk-token')
  }
}).then(r => r.json()).then(console.log)
```
- [ ] Verify response contains real financial metrics
- [ ] Check for current assets/liabilities data
- [ ] Confirm cash flow calculations

#### Inventory Data
```javascript
fetch('/api/inventory/levels', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('clerk-token')
  }
}).then(r => r.json()).then(console.log)
```
- [ ] Verify real inventory items returned
- [ ] Check stock levels are current
- [ ] Confirm SKU information accurate

#### Production Data
```javascript
fetch('/api/production/metrics', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('clerk-token')
  }
}).then(r => r.json()).then(console.log)
```
- [ ] Verify production metrics loaded
- [ ] Check OEE calculations
- [ ] Confirm batch information

### External Service Connections
- [ ] **Xero**: Check financial sync status
- [ ] **Shopify UK**: Verify order data
- [ ] **Shopify USA**: Confirm inventory sync
- [ ] **Unleashed**: Check ERP integration
- [ ] **MCP Server**: Test AI features

## Phase 5: Role-Based Access Testing (10 minutes)

### Viewer Role (Default)
- [ ] Can view all dashboards
- [ ] Cannot modify settings
- [ ] No access to admin panel
- [ ] Read-only widget interactions

### Admin Role Testing
- [ ] Request admin role assignment in Clerk dashboard
- [ ] Verify admin panel access
- [ ] Test user management features
- [ ] Check system configuration access

## Phase 6: Error Handling & Edge Cases (10 minutes)

### Session Management
- [ ] Test session timeout (wait 24 hours or modify token)
- [ ] Verify graceful redirect to sign-in
- [ ] Check "Remember me" functionality
- [ ] Test multiple browser tabs

### Network Scenarios
- [ ] Slow connection (throttle to 3G)
- [ ] Offline mode (disconnect network)
- [ ] API timeout handling
- [ ] Retry mechanisms

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS/Android)

## Phase 7: Performance Metrics (5 minutes)

### Page Load Times
- [ ] Initial load < 3 seconds
- [ ] Dashboard render < 2 seconds
- [ ] API responses < 1 second
- [ ] Widget updates < 500ms

### Resource Usage
- [ ] Check browser memory usage
- [ ] Monitor network requests
- [ ] Verify no memory leaks
- [ ] Check console for warnings

## Post-Testing Verification

### Success Criteria
- [ ] All authentication flows work
- [ ] Dashboard loads with real data
- [ ] No console errors in production
- [ ] Performance meets targets
- [ ] Role-based access enforced
- [ ] External services connected

### Issue Tracking
Document any issues found:

| Issue | Environment | Severity | Status |
|-------|-------------|----------|--------|
| | | | |
| | | | |
| | | | |

### Sign-Off
- [ ] Development environment approved
- [ ] Production environment approved
- [ ] Authentication system validated
- [ ] Ready for client UAT

---

## Quick Test Commands

Run these in terminal to quickly verify services:

```bash
# Check all services health
for url in "https://sentia-manufacturing-development.onrender.com/health" \
           "https://sentia-manufacturing-production.onrender.com/health" \
           "https://mcp-server-tkyu.onrender.com/health"; do
  echo "Checking $url"
  curl -s -o /dev/null -w "%{http_code}\n" $url
done

# Test API endpoints (requires auth token)
TOKEN="your-clerk-token-here"
for endpoint in "financial/dashboard" "inventory/levels" "production/metrics"; do
  echo "Testing /api/$endpoint"
  curl -s "https://sentia-manufacturing-production.onrender.com/api/$endpoint" \
    -H "Authorization: Bearer $TOKEN" | jq '.success'
done
```

## Notes

- Replace [timestamp] with current time (e.g., 20250920-1430)
- Save test account credentials securely
- Document any deviations from expected behavior
- Take screenshots of any errors for debugging

---

**Testing Started**: _______________  
**Testing Completed**: _______________  
**Tested By**: _______________  
**Approved By**: _______________