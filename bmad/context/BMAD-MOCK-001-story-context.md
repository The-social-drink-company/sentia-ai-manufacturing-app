# Story Context: BMAD-MOCK-001 - Connect Xero Financial Data

**Story ID**: BMAD-MOCK-001
**Context Injection Date**: 2025-10-19
**Framework**: BMAD-METHOD v6a Phase 4 (story-context step)
**Purpose**: Provide comprehensive context for implementing real Xero financial data integration

---

## Context Summary

This document contains the injected context necessary for successfully implementing BMAD-MOCK-001. It includes existing implementation review, API patterns, error handling strategies, caching best practices, and integration points.

---

## 1. Existing Implementation Review

### ✅ Already Implemented (services/xeroService.js)

**XeroService Class** - Comprehensive enterprise implementation (~1,225 lines)

**Key Features**:
1. **Custom Connection Authentication** ✅
   - Client Credentials OAuth flow (no redirect URIs needed)
   - Automatic token exchange via `https://identity.xero.com/connect/token`
   - Organization and tenant ID retrieval
   - Connection state management

2. **Core API Methods** ✅
   - `getBalanceSheet(periods)` - Real balance sheet data
   - `getCashFlow(periods)` - Bank summary-based cash flow
   - `getProfitAndLoss(periods)` - P&L reports with 1-11 periods
   - `calculateWorkingCapital()` - Complete working capital calculations

3. **Error Handling & Retry Logic** ✅
   - `executeWithRetry()` - Exponential backoff with 3 retries
   - `extractErrorInfo()` - Comprehensive error parsing
   - Rate limit handling (429 responses)
   - Authentication error recovery (401 responses)
   - Network timeout handling (30-second timeout)

4. **Data Processing** ✅
   - `processBalanceSheet()` - Structured balance sheet data
   - `processProfitAndLoss()` - Revenue, expenses, margins extraction
   - `processBankSummaryToCashFlow()` - Cash flow categorization
   - `extractValue()` - Recursive row searching with fuzzy matching

5. **Validation & Health Checks** ✅
   - `validateEnvironmentVariables()` - Credential validation
   - `healthCheck()` - API connectivity testing
   - `testConnection()` - Organization retrieval test

**Current Limitations**:
- ❌ Not integrated with dashboard KPI endpoints
- ❌ Still returns zero/empty data when not connected (fallback pattern)
- ❌ P&L data exists but not used by financial reports
- ❌ No UI for "Connect Xero" prompts
- ❌ Cache implementation exists but not fully utilized

---

## 2. Integration Points

### Backend Files Requiring Modification

#### A. server/api/working-capital.js
**Current State**: Returns mock data or zero fallbacks
**Required Changes**:
```javascript
// BEFORE (Mock Data Pattern):
router.get('/summary', async (req, res) => {
  // Returns hardcoded values or mock calculations
  res.json({
    success: true,
    data: {
      currentAssets: 350000,
      currentLiabilities: 180000,
      // ... hardcoded mock data
    }
  });
});

// AFTER (Real Xero Integration):
import xeroService from '../../services/xeroService.js';

router.get('/summary', async (req, res) => {
  try {
    // Call real Xero service
    const result = await xeroService.calculateWorkingCapital();

    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: result.error,
        message: result.message,
        data: null
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch working capital data',
      data: null
    });
  }
});
```

#### B. src/services/FinancialAlgorithms.js
**Current State**: Contains hardcoded financial calculations
**Required Changes**:
- Remove all `Math.random()` usage
- Remove hardcoded return values
- Connect to backend `/api/financial/*` endpoints
- Use real Xero data from API responses

#### C. server.js or server/index.js
**Current State**: May have `/api/financial/kpi-summary` endpoint with mock data
**Required Changes**:
- Replace mock KPI generation with real Xero data
- Call `xeroService.getProfitAndLoss()` for revenue/profit
- Call `xeroService.calculateWorkingCapital()` for AR/AP/WC
- Return structured KPI data for dashboard

### Frontend Files Requiring Modification

#### D. src/pages/DashboardEnterprise.jsx
**Current State**: Shows error/empty states but no "Connect Xero" UI
**Required Changes**:
```javascript
// Add Xero connection status check
const [xeroStatus, setXeroStatus] = useState({ connected: false, loading: true });

useEffect(() => {
  const checkXeroStatus = async () => {
    const response = await fetch('/api/xero/health');
    const status = await response.json();
    setXeroStatus({ connected: status.status === 'connected', loading: false });
  };
  checkXeroStatus();
}, []);

// Enhance empty state to show "Connect Xero" prompt
if (!xeroStatus.connected && !xeroStatus.loading) {
  return (
    <EmptyState
      icon={<XeroIcon />}
      title="Connect Xero"
      description="Connect your Xero account to see real financial data"
      action={
        <Button onClick={() => window.location.href = '/admin/integrations'}>
          Connect Xero
        </Button>
      }
    />
  );
}
```

#### E. src/pages/admin/IntegrationManagement.jsx
**Current State**: Unknown - may not exist or may be placeholder
**Required Changes**:
- Create admin page for Xero configuration
- Display connection status from `/api/xero/health`
- Show organization name and tenant ID when connected
- Provide "Disconnect" button functionality
- Display last sync time and data freshness

---

## 3. API Patterns & Best Practices

### Xero Custom Connection Pattern (Injected from xero-integration-guide.md)

**Authentication Flow**:
```javascript
// 1. Exchange credentials for access token
POST https://identity.xero.com/connect/token
Headers:
  Authorization: Basic base64(clientId:clientSecret)
  Content-Type: application/x-www-form-urlencoded
Body:
  grant_type=client_credentials
  scope=accounting.transactions.read accounting.settings.read accounting.contacts.read accounting.reports.read

// 2. Get tenant connections
GET https://api.xero.com/connections
Headers:
  Authorization: Bearer {access_token}
  Accept: application/json

// 3. Get organization details
GET /api.xro/2.0/Organisation
Headers:
  Authorization: Bearer {access_token}
  Xero-Tenant-Id: {tenantId}
```

**Key Differences from OAuth 2.0**:
- ❌ No redirect URIs or callback URLs
- ❌ No user login flow
- ❌ No token refresh (tokens are application-level)
- ✅ Direct API access with client credentials
- ✅ Single organization per connection
- ✅ No multi-tenant complexity

**Environment Variables Required**:
```env
XERO_CLIENT_ID=your-client-id
XERO_CLIENT_SECRET=your-client-secret
# XERO_ORGANIZATION_ID retrieved automatically after authentication
```

**Important**: Custom connections require Xero subscription purchase by the customer

---

## 4. Error Handling Patterns (Injected from xeroService.js)

### Pattern 1: Retry with Exponential Backoff

```javascript
async executeWithRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check connection before each attempt
      if (!this.isConnected) {
        await this.authenticate();
      }

      // Execute with 30-second timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), 30000)
      );

      return await Promise.race([operation(), timeoutPromise]);

    } catch (error) {
      // Authentication errors - reset connection
      if (error.response?.status === 401) {
        this.isConnected = false;
        this.organizationId = null;
        await this.authenticate();
      }

      // Rate limiting - wait and retry
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      }

      // Last attempt - throw error
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

### Pattern 2: Structured Error Responses

```javascript
// Backend API Response Format
{
  success: false,
  error: "Xero authentication required",
  message: "Please authenticate with Xero to access real financial data",
  data: null,
  dataSource: "authentication_required",
  lastUpdated: "2025-10-19T10:00:00Z"
}

// Frontend Error Handling
if (!response.success) {
  if (response.dataSource === 'authentication_required') {
    // Show "Connect Xero" UI
  } else if (response.dataSource === 'xero_api_error') {
    // Show error with retry button
  } else {
    // Generic error state
  }
}
```

### Pattern 3: No Mock Data Fallbacks (CRITICAL)

```javascript
// ❌ WRONG - Mock data fallback
if (!xeroConnected) {
  return { revenue: 1000000, profit: 250000 }; // Hardcoded mock data
}

// ✅ CORRECT - Explicit error response
if (!xeroConnected) {
  throw new Error('Xero service not connected - no fallback data available');
}

// ✅ CORRECT - Return explicit empty state
if (!xeroConnected) {
  return {
    success: false,
    error: 'Not connected',
    message: 'Xero authentication required',
    data: null
  };
}
```

**BMAD-METHOD Rule**: Zero mock data fallbacks - real API or explicit errors only

---

## 5. Caching Strategy (Injected Best Practice)

### Implementation Pattern

```javascript
class CachedXeroService {
  constructor() {
    this.cache = new Map();
    this.ttl = 15 * 60 * 1000; // 15 minutes
  }

  async getFinancialData(cacheKey, fetchFn) {
    // 1. Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return { data: cached.data, stale: false };
    }

    try {
      // 2. Fetch from API
      const data = await fetchFn();

      // 3. Update cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return { data, stale: false };

    } catch (error) {
      // 4. Return stale data if available
      if (cached) {
        return { data: cached.data, stale: true };
      }
      throw error;
    }
  }
}

// Usage
const result = await cachedXeroService.getFinancialData(
  'working_capital',
  () => xeroService.calculateWorkingCapital()
);

if (result.stale) {
  // Show warning: "Displaying cached data (updated 5 minutes ago)"
}
```

**Cache TTL Recommendations**:
- Working Capital: 15 minutes
- P&L Reports: 1 hour
- Balance Sheet: 1 hour
- Cash Flow: 30 minutes
- Organization Info: 24 hours

---

## 6. Data Transformation Patterns

### P&L Data Transformation (from xeroService.js)

```javascript
// Xero Raw Response Structure
{
  reports: [{
    reportID: "ProfitAndLoss",
    reportName: "Profit and Loss",
    reportDate: "October 2025",
    rows: [
      {
        rowType: "Header",
        cells: [
          { value: "" },
          { value: "October 2025" }
        ]
      },
      {
        rowType: "Section",
        title: "Income",
        rows: [
          {
            rowType: "Row",
            cells: [
              { value: "Revenue" },
              { value: "125000.00" }
            ]
          }
        ]
      }
    ]
  }]
}

// Transformed for Dashboard
{
  reportId: "ProfitAndLoss",
  reportDate: "October 2025",
  totalRevenue: 125000,
  totalExpenses: 85000,
  netProfit: 40000,
  grossProfit: 75000,
  profitMargin: 32.0, // (netProfit / revenue) * 100
  grossMargin: 60.0,  // (grossProfit / revenue) * 100
  lastUpdated: "2025-10-19T10:00:00Z"
}
```

### Working Capital Data Transformation

```javascript
// From Balance Sheet → Working Capital
{
  currentAssets: 350000,       // Cash + AR + Inventory
  currentLiabilities: 180000,  // AP + Short-term Debt
  workingCapital: 170000,      // currentAssets - currentLiabilities
  currentRatio: 1.94,          // currentAssets / currentLiabilities
  quickRatio: 1.50,            // (currentAssets - inventory) / currentLiabilities
  cashConversionCycle: 42,     // DSO + DIO - DPO
  accountsReceivable: 125000,
  accountsPayable: 95000,
  inventory: 80000,
  cash: 145000
}
```

---

## 7. Testing Strategy

### Integration Test Pattern

```javascript
describe('Xero Financial Integration', () => {
  let xeroService;

  beforeAll(async () => {
    xeroService = require('../../services/xeroService');
    await xeroService.ensureInitialized();
  });

  describe('Working Capital Calculation', () => {
    it('should fetch real working capital data when connected', async () => {
      const result = await xeroService.calculateWorkingCapital();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('currentAssets');
      expect(result.data).toHaveProperty('currentLiabilities');
      expect(result.data).toHaveProperty('workingCapital');
      expect(result.dataSource).toBe('xero_api');
    });

    it('should return authentication error when not connected', async () => {
      xeroService.isConnected = false;

      const result = await xeroService.calculateWorkingCapital();

      expect(result.success).toBe(false);
      expect(result.dataSource).toBe('authentication_required');
      expect(result.error).toContain('authentication');
    });
  });

  describe('P&L Data Fetching', () => {
    it('should fetch 11 periods of P&L data', async () => {
      const data = await xeroService.getProfitAndLoss(11);

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('totalRevenue');
      expect(data[0]).toHaveProperty('netProfit');
    });

    it('should handle invalid periods parameter', async () => {
      // Xero API requires 1-11 periods
      const data = await xeroService.getProfitAndLoss(15);

      expect(Array.isArray(data)).toBe(true);
      // Should auto-correct to 11
    });
  });
});
```

### Manual Testing Checklist

- [ ] Verify Xero credentials are set in environment
- [ ] Test authentication flow via `/api/xero/health`
- [ ] Verify organization ID retrieved correctly
- [ ] Test working capital endpoint: `GET /api/working-capital/summary`
- [ ] Test financial KPI endpoint: `GET /api/financial/kpi-summary`
- [ ] Verify dashboard displays real Xero data
- [ ] Test "Not Connected" state shows proper UI
- [ ] Test error handling (disconnect Xero, refresh page)
- [ ] Verify cache TTL (check network tab for cache hits)
- [ ] Test rate limit handling (make 100+ requests rapidly)

---

## 8. Xero API Rate Limits

**Limits**:
- **60 API calls per minute** per organization
- **5,000 API calls per day** per organization
- **10 concurrent calls** maximum

**Mitigation Strategies**:
1. **Aggressive Caching**: 15-minute TTL for most endpoints
2. **Request Queuing**: Queue requests to stay under 60/min
3. **Batch Operations**: Combine multiple data fetches when possible
4. **Background Refresh**: Update cache in background, not on-demand
5. **Rate Limit Headers**: Monitor `X-Rate-Limit-Remaining` header

**Rate Limit Response Handling**:
```javascript
if (error.response?.status === 429) {
  const retryAfter = error.response.headers['retry-after'] || 60;
  console.log(`Rate limited. Retry after ${retryAfter} seconds`);
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  // Retry request
}
```

---

## 9. Security Considerations

### Credential Storage
- ✅ Store in environment variables (not in code)
- ✅ Use Render environment variables dashboard
- ✅ Never commit credentials to git
- ✅ Rotate credentials periodically

### API Token Security
- ✅ Tokens stored in memory only (not database)
- ✅ HTTPS for all API calls
- ✅ No token exposure in client-side code
- ✅ Server-side token management only

### Data Privacy
- ✅ Financial data never cached in browser
- ✅ Server-side caching with TTL
- ✅ No PII in logs
- ✅ Audit logging for data access

---

## 10. Deployment Checklist

### Development Environment
- [ ] Set `XERO_CLIENT_ID` in local `.env`
- [ ] Set `XERO_CLIENT_SECRET` in local `.env`
- [ ] Test authentication locally
- [ ] Verify data retrieval works

### Render Deployment (Production/Test)
- [ ] Add `XERO_CLIENT_ID` to Render environment variables
- [ ] Add `XERO_CLIENT_SECRET` to Render environment variables
- [ ] Deploy to development environment first
- [ ] Test end-to-end flow on deployed instance
- [ ] Promote to test environment after validation
- [ ] UAT approval before production

---

## 11. Known Issues & Workarounds

### Issue 1: Organization ID Not Found
**Symptom**: Authentication succeeds but no organization ID
**Cause**: Custom connection not authorized in Xero
**Fix**: Check Xero Developer Portal, ensure connection is authorized

### Issue 2: Empty P&L Data
**Symptom**: API returns empty rows
**Cause**: No financial transactions in Xero for selected period
**Fix**: Use demo Xero organization with sample data, or wait for real transactions

### Issue 3: Cache Not Updating
**Symptom**: Dashboard shows stale data
**Cause**: Cache TTL too long or not expiring properly
**Fix**: Clear cache manually, reduce TTL to 5 minutes for testing

---

## 12. Success Metrics for This Story

### Code Quality
- [ ] Zero `Math.random()` calls in financial code
- [ ] Zero hardcoded mock financial values
- [ ] 100% of Xero API calls have error handling
- [ ] >90% test coverage for integration code

### Performance
- [ ] API response time < 2 seconds (p95)
- [ ] Cache hit rate > 80%
- [ ] Error rate < 5%
- [ ] Rate limit compliance (< 60 calls/min)

### Business Value
- [ ] Financial data matches Xero exactly (100% accuracy)
- [ ] P&L updates within 15 minutes of changes
- [ ] AR/AP balances accurate within 5 minutes
- [ ] Can make business decisions from dashboard data

---

## 13. Next Steps After Context Injection

**BMAD Workflow Progression**:
1. ✅ **create-story** - Story document created
2. ✅ **story-context** - This context document (current step)
3. ⏳ **dev-story** - Begin implementation
4. ⏳ **review-story** - Test and validate
5. ⏳ **retrospective** - Document learnings

**Immediate Implementation Tasks**:
1. Update `server/api/working-capital.js` to use `xeroService`
2. Remove mock data from `FinancialAlgorithms.js`
3. Create `/api/xero/health` endpoint
4. Update `DashboardEnterprise.jsx` with "Connect Xero" UI
5. Write integration tests
6. Deploy to development environment
7. Manual testing with real Xero account

---

## References

**Internal Documentation**:
- [services/xeroService.js](../../services/xeroService.js) - Main service implementation
- [context/xero-integration-guide.md](../../context/xero-integration-guide.md) - Setup guide
- [BMAD-MOCK-001 Story](../stories/BMAD-MOCK-001-xero-financial-data.md) - Story requirements
- [Epic-002](../epics/2025-10-eliminate-mock-data-epic.md) - Parent epic

**External Documentation**:
- [Xero API Overview](https://developer.xero.com/documentation/api/api-overview)
- [Xero Custom Connections](https://developer.xero.com/documentation/guides/oauth2/custom-connections/)
- [Xero Accounting API](https://developer.xero.com/documentation/api/accounting/overview)

---

**Context Status**: ✅ **COMPLETE**
**Next Phase**: dev-story (Implementation)
**Estimated Effort**: 3 days
**Priority**: HIGH
