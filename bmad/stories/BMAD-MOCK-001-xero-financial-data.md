# BMAD Story: Connect Xero Financial Data

**Story ID**: BMAD-MOCK-001
**Epic**: EPIC-002 - Eliminate Mock Data with Live API Integration
**Priority**: ⭐ HIGH
**Status**: 🔄 READY TO START
**Owner**: Development Team
**Estimated Effort**: 3 days
**Framework**: BMAD-METHOD v6a Phase 4 (IMPLEMENTATION)

---

## Story Summary

**Objective**: Replace all mock financial KPIs with real Xero API data

**Business Value**: Transform financial metrics from hardcoded demo data to genuine real-time financial information from Xero accounting system, enabling accurate business decision-making.

**Current State**: Dashboard displays hardcoded financial values or shows errors when Xero not connected
**Target State**: Dashboard displays live Xero financial data or shows explicit "Connect Xero" setup prompts

---

## Acceptance Criteria

**Story COMPLETE When**: ✅ ALL CRITERIA MET

### 1. Xero OAuth Authentication ✅
- [ ] Xero OAuth 2.0 flow implemented and working
- [ ] Access tokens stored securely
- [ ] Token refresh mechanism operational
- [ ] Multi-tenant support (multiple Xero organizations)
- [ ] Connection status visible in admin panel

### 2. Real-Time Financial Data ✅
- [ ] P&L (Profit & Loss) data fetched from Xero
- [ ] Annual revenue calculated from Xero records
- [ ] Gross margin extracted from Xero P&L
- [ ] Data refresh interval configured (hourly recommended)
- [ ] Historical data available (last 12 months minimum)

### 3. AR/AP Balances ✅
- [ ] Accounts Receivable balances from Xero
- [ ] Accounts Payable balances from Xero
- [ ] Working capital calculations using real AR/AP
- [ ] Debtor days calculation
- [ ] Creditor days calculation

### 4. Cash Flow Data ✅
- [ ] Cash flow statements from Xero
- [ ] Cash conversion cycle calculated
- [ ] Operating cash flow extracted
- [ ] Current ratio calculated (Current Assets / Current Liabilities)
- [ ] Quick ratio calculated ((Current Assets - Inventory) / Current Liabilities)

### 5. Dashboard Integration ✅
- [ ] DashboardEnterprise.jsx displays real Xero data
- [ ] FinancialReports.jsx displays real Xero data
- [ ] Working Capital page uses real Xero AR/AP
- [ ] KPI cards show accurate financial metrics
- [ ] No hardcoded fallback values (critical!)

### 6. Error Handling & Empty States ✅
- [ ] "Connect Xero" prompt when not authenticated
- [ ] User-friendly error messages for API failures
- [ ] Retry mechanism for transient failures
- [ ] Rate limit handling (Xero API limits)
- [ ] Network timeout handling (5-second timeout)

### 7. Performance & Caching ✅
- [ ] API responses cached (15-minute TTL recommended)
- [ ] Stale-while-revalidate pattern implemented
- [ ] API response time < 2 seconds (p95)
- [ ] Cache hit rate > 80%
- [ ] Background refresh for cached data

### 8. Testing & Documentation ✅
- [ ] Integration tests for Xero API calls
- [ ] Unit tests for data transformation logic
- [ ] Xero setup documentation created
- [ ] API troubleshooting guide written
- [ ] User documentation updated

---

## Files to Modify

### Backend Services

1. **server/services/api/xeroService.js** (Enhance)
   - Implement OAuth 2.0 flow
   - Add P&L data fetching
   - Add AR/AP balance fetching
   - Add cash flow statement fetching
   - Implement caching layer
   - Add rate limit handling

2. **server/api/working-capital.js** (Modify)
   - Replace mock AR/AP with Xero data
   - Remove hardcoded values
   - Add proper error handling
   - Return explicit errors when Xero not connected

3. **src/services/FinancialAlgorithms.js** (Modify)
   - Connect to Xero data instead of hardcoded values
   - Remove `Math.random()` usage
   - Add real working capital calculations
   - Use actual AR/AP for cash conversion cycle

### Frontend Components

4. **src/pages/DashboardEnterprise.jsx** (Modify)
   - Update to handle real Xero data structure
   - Add "Connect Xero" UI when not authenticated
   - Enhance error messages with Xero-specific guidance
   - Add connection status indicator

5. **src/components/FinancialReports.jsx** (Modify)
   - Display real P&L from Xero
   - Add monthly trend charts using historical data
   - Show actual vs. budget comparisons (if available)
   - Add export functionality

6. **src/pages/Financial/FinancialReports.jsx** (Modify)
   - Integrate with enhanced FinancialReports component
   - Add filtering by date range
   - Add Xero organization selector (multi-tenant)

### Integration Infrastructure

7. **src/pages/admin/IntegrationManagement.jsx** (Create/Enhance)
   - Xero connection management UI
   - OAuth flow initiation button
   - Connection status display
   - Disconnect/reconnect functionality
   - Tenant organization selector

8. **server/middleware/xeroAuth.js** (Create)
   - OAuth callback handler
   - Token validation middleware
   - Automatic token refresh
   - Multi-tenant organization switching

9. **server/routes/xero.js** (Create)
   - `/api/xero/auth` - Initiate OAuth flow
   - `/api/xero/callback` - OAuth callback handler
   - `/api/xero/disconnect` - Disconnect Xero
   - `/api/xero/status` - Connection status
   - `/api/xero/organizations` - List connected orgs

### Configuration

10. **Environment Variables** (Update .env.template)
    ```
    XERO_CLIENT_ID=your_xero_client_id
    XERO_CLIENT_SECRET=your_xero_client_secret
    XERO_REDIRECT_URI=https://your-domain.com/api/xero/callback
    XERO_SCOPES=accounting.transactions.read,accounting.reports.read
    ```

---

## Technical Specifications

### Xero API Integration Pattern

```javascript
// server/services/api/xeroService.js
class XeroService {
  constructor() {
    this.client = null
    this.tokenSet = null
    this.cache = new Map()
  }

  async initialize() {
    const { XeroClient } = require('xero-node')

    this.client = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUris: [process.env.XERO_REDIRECT_URI],
      scopes: process.env.XERO_SCOPES.split(','),
    })
  }

  async getFinancialData(organizationId) {
    try {
      // 1. Check cache
      const cacheKey = `financial_${organizationId}`
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < 900000) { // 15 min TTL
        return { data: cached.data, stale: false }
      }

      // 2. Validate token
      if (!this.tokenSet || this.tokenSet.expired()) {
        await this.refreshToken()
      }

      // 3. Fetch from Xero API
      const response = await this.client.accountingApi.getReportProfitAndLoss(
        organizationId,
        {
          fromDate: this.getStartOfYear(),
          toDate: new Date().toISOString().split('T')[0],
        }
      )

      // 4. Transform data
      const financialData = this.transformPLData(response.body)

      // 5. Cache result
      this.cache.set(cacheKey, {
        data: financialData,
        timestamp: Date.now(),
      })

      // 6. Return
      return { data: financialData, stale: false }

    } catch (error) {
      // 7. Handle errors
      if (error.response?.statusCode === 401) {
        throw new XeroAuthError('Xero authentication expired')
      }
      if (error.response?.statusCode === 429) {
        throw new XeroRateLimitError('Xero API rate limit exceeded')
      }

      // 8. Return cached if available
      const cached = this.cache.get(cacheKey)
      if (cached) {
        return { data: cached.data, stale: true }
      }

      throw new XeroAPIError('Unable to fetch Xero financial data', { cause: error })
    }
  }

  transformPLData(xeroPL) {
    // Extract revenue, COGS, gross profit, etc.
    const revenue = this.findLineItem(xeroPL, 'Revenue')
    const cogs = this.findLineItem(xeroPL, 'Cost of Sales')
    const grossProfit = revenue - cogs
    const grossMargin = (grossProfit / revenue) * 100

    return {
      annualRevenue: revenue,
      grossMargin: grossMargin.toFixed(2),
      netProfit: this.findLineItem(xeroPL, 'Net Profit'),
      timestamp: new Date().toISOString(),
    }
  }
}

module.exports = new XeroService()
```

### Dashboard Component Update

```javascript
// src/pages/DashboardEnterprise.jsx
const DashboardEnterprise = () => {
  const [xeroConnected, setXeroConnected] = useState(false)
  const [financialData, setFinancialData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchXeroData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check Xero connection status
        const statusResponse = await fetch('/api/xero/status')
        const status = await statusResponse.json()

        if (!status.connected) {
          setXeroConnected(false)
          setLoading(false)
          return
        }

        setXeroConnected(true)

        // Fetch financial data
        const dataResponse = await fetch('/api/financial/kpi-summary')
        const data = await dataResponse.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch financial data')
        }

        setFinancialData(data.data)

      } catch (err) {
        console.error('[Dashboard] Error fetching Xero data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchXeroData()
  }, [])

  if (!xeroConnected) {
    return (
      <EmptyState
        icon={<XeroIcon />}
        title="Connect Xero"
        description="Connect your Xero account to see real financial data"
        action={
          <Button onClick={() => window.location.href = '/api/xero/auth'}>
            Connect Xero
          </Button>
        }
      />
    )
  }

  // ... rest of component
}
```

---

## API Endpoints Required

### Xero Authentication
- `GET /api/xero/auth` - Initiate OAuth flow
- `GET /api/xero/callback` - OAuth callback (redirects to dashboard)
- `POST /api/xero/disconnect` - Disconnect Xero
- `GET /api/xero/status` - Connection status { connected: boolean, organization: string }

### Financial Data (Enhanced)
- `GET /api/financial/kpi-summary` - Return real Xero KPIs
- `GET /api/financial/pl-analysis` - Return real P&L from Xero
- `GET /api/working-capital/summary` - Return real AR/AP from Xero

---

## External Dependencies

### Xero API Credentials
- [ ] Xero Developer Account created
- [ ] OAuth 2.0 app registered
- [ ] Client ID obtained
- [ ] Client Secret obtained
- [ ] Redirect URI configured
- [ ] Scopes defined: `accounting.transactions.read`, `accounting.reports.read`

### NPM Packages
- [ ] `xero-node` - Official Xero Node.js SDK
- [ ] `node-cache` - Caching layer (or use Redis)
- [ ] `jsonwebtoken` - Token handling

### Environment Setup
- [ ] `.env` variables configured
- [ ] Render environment variables set (all 3 environments)
- [ ] Webhook endpoint configured (for real-time updates)

---

## Risk Assessment

### High Risks 🔴

**Risk 1: Xero API Credentials Unavailable**
- **Probability**: Medium
- **Impact**: High (blocks entire story)
- **Mitigation**: Request credentials early, use Xero demo organization if needed

**Risk 2: Xero API Rate Limits**
- **Probability**: High
- **Impact**: Medium
- **Mitigation**: Implement aggressive caching (15-min TTL), queue requests

**Risk 3: Data Schema Mismatch**
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**: Comprehensive error handling, schema validation, fallback to cached data

### Medium Risks 🟡

**Risk 4: Multi-Tenant Complexity**
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**: Start with single tenant, add multi-tenant later

**Risk 5: Token Expiration During Session**
- **Probability**: Medium
- **Impact**: Low
- **Mitigation**: Automatic token refresh, retry mechanism

---

## Testing Strategy

### Integration Tests

```javascript
describe('Xero Integration', () => {
  it('should fetch P&L data from Xero', async () => {
    const data = await xeroService.getFinancialData(organizationId)
    expect(data).toHaveProperty('annualRevenue')
    expect(data).toHaveProperty('grossMargin')
    expect(typeof data.annualRevenue).toBe('number')
  })

  it('should handle Xero authentication errors', async () => {
    // Mock 401 response
    await expect(xeroService.getFinancialData(invalidOrgId)).rejects.toThrow(XeroAuthError)
  })

  it('should return cached data when Xero API fails', async () => {
    // Setup cache
    xeroService.cache.set('financial_test', { data: mockData, timestamp: Date.now() })

    // Mock API failure
    jest.spyOn(xeroService.client.accountingApi, 'getReportProfitAndLoss').mockRejectedValue(new Error())

    const result = await xeroService.getFinancialData('test')
    expect(result.stale).toBe(true)
    expect(result.data).toEqual(mockData)
  })
})
```

### Manual Testing Checklist

- [ ] Connect Xero via OAuth flow
- [ ] Verify financial data displays correctly
- [ ] Test disconnect functionality
- [ ] Verify error handling (disconnect Xero, refresh page)
- [ ] Test rate limit handling (make many requests)
- [ ] Verify caching (check network tab, should see cache hits)
- [ ] Test multi-tenant switching (if applicable)
- [ ] Verify data accuracy against Xero dashboard

---

## Success Metrics

### Code Quality
- Zero instances of `Math.random()` in financial code paths
- Zero hardcoded mock financial values
- 100% of Xero API calls have error handling
- >90% test coverage for Xero integration code

### Performance
- API response time < 2 seconds (p95)
- Cache hit rate > 80%
- Error rate < 5%
- Token refresh success rate > 99%

### Business Value
- Financial accuracy matches Xero exactly (100%)
- Can make real business decisions from dashboard
- P&L data updates within 15 minutes of Xero changes
- AR/AP balances accurate within 5 minutes

---

## Documentation to Create

1. **Xero Setup Guide** (`docs/xero-integration-setup.md`)
   - How to create Xero developer account
   - How to register OAuth app
   - How to obtain credentials
   - How to connect Xero to dashboard

2. **Troubleshooting Guide** (`docs/xero-troubleshooting.md`)
   - Common connection issues
   - API error codes and solutions
   - Cache debugging
   - Token refresh issues

3. **API Documentation** (Update existing)
   - Document new Xero endpoints
   - Request/response schemas
   - Error codes and meanings

4. **User Guide** (Update existing)
   - How to connect Xero
   - What data is synced
   - How often data refreshes
   - Privacy and security information

---

## BMAD Workflow for This Story

Following BMAD-METHOD v6a Phase 4:

1. ✅ **create-story** - This document
2. ⏳ **story-context** - Review Xero API docs, inject patterns
3. ⏳ **dev-story** - Implement Xero integration
4. ⏳ **review-story** - Test with real Xero account
5. ⏳ **retrospective** - Document learnings (part of epic retro)

**Next Steps**:
1. Review Xero API documentation
2. Obtain Xero API credentials
3. Begin implementation of xeroService.js
4. Create OAuth flow endpoints
5. Update dashboard components
6. Write integration tests
7. Manual testing with real Xero account

---

## Definition of Done

**Story DONE When**:

1. **All Acceptance Criteria Met**: ✅ All 8 sections complete
2. **Zero Mock Data**: No hardcoded financial values in code paths
3. **Tests Pass**: Integration and unit tests passing
4. **Documentation Complete**: All 4 docs created/updated
5. **Manual Testing**: Verified with real Xero account
6. **Code Review**: Peer review complete
7. **Deployed**: Working on development environment
8. **QA Sign-off**: Product owner approval

---

## References

**External Documentation**:
- [Xero API Overview](https://developer.xero.com/documentation/api/api-overview)
- [Xero OAuth 2.0 Guide](https://developer.xero.com/documentation/oauth2/overview)
- [Xero Accounting API](https://developer.xero.com/documentation/api/accounting/overview)
- [Xero Reports API](https://developer.xero.com/documentation/api/accounting/reports)

**Internal Documentation**:
- [context/technical-specifications/xero-integration-guide.md](../../context/technical-specifications/xero-integration-guide.md)
- [server/services/api/xeroService.js](../../server/services/api/xeroService.js)
- [EPIC-002: Eliminate Mock Data](../epics/2025-10-eliminate-mock-data-epic.md)

**Related Stories**:
- BMAD-MOCK-002: Connect Shopify Sales Data (next)
- BMAD-MOCK-006: API Fallback Handling (error handling patterns)

---

**Story Status**: 🔄 **READY TO START**
**Priority**: ⭐ **HIGH** - Critical for real financial data
**Owner**: Development Team
**Estimated**: 3 days
**Framework**: BMAD-METHOD v6a Phase 4 (IMPLEMENTATION)
**Epic**: EPIC-002 - Eliminate Mock Data with Live API Integration
