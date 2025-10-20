# Technical Specification: Eliminate Mock Data (EPIC-002)
## Three Critical Files - Stories 1, 2, 3

**Date**: 2025-10-19
**Epic**: EPIC-002 (Eliminate All Mock Data)
**Stories**: BMAD-MOCK-003, BMAD-MOCK-004, BMAD-MOCK-007 (remaining 3 files)
**Priority**: CRITICAL
**Framework**: BMAD-METHOD v6a Phase 3 (Solutioning)

---

## Overview

This technical specification defines the implementation approach for eliminating mock data from the 3 remaining files identified in the codebase audit. All implementations follow the established three-tier fallback pattern from BMAD-MOCK-001 (Xero integration).

**Affected Files**:
1. `api/routes/financial.js` - Math.random() in P&L endpoints
2. `api/routes/financial.js` - Hardcoded P&L summary objects
3. `server/api/working-capital.js` - Hardcoded fallback data

---

## Architectural Pattern (Reusable)

### Three-Tier Fallback Strategy

**Established Pattern** (from BMAD-MOCK-001):
```javascript
// Tier 1: Real data from external API
try {
  const health = await xeroService.checkHealth()
  if (!health.connected) {
    // Tier 2: Return setup instructions (NOT mock data)
    return res.status(503).json({
      error: 'Xero not connected',
      message: 'Please connect Xero to view financial data',
      code: 'XERO_NOT_CONNECTED',
      setupRequired: true
    })
  }

  const realData = await xeroService.getFinancialData()
  return res.status(200).json({
    success: true,
    data: realData,
    dataSource: 'real',
    timestamp: new Date()
  })
} catch (error) {
  // Tier 3: Error handling (NOT mock data)
  return res.status(503).json({
    error: 'Service unavailable',
    message: 'Financial service temporarily unavailable',
    code: 'SERVICE_ERROR'
  })
}
// NEVER return fake/mock data
```

**Frontend Response**:
- `200 + data` → Render real data
- `503 + setupRequired` → Show XeroSetupPrompt component
- `503 + error` → Show error message with retry button

---

## Story 1: Remove Math.random() from Financial P&L

**File**: `api/routes/financial.js`
**Story ID**: BMAD-MOCK-003
**Estimated**: 2 hours
**Priority**: HIGH

### Current Implementation (VIOLATION)

```javascript
// CURRENT CODE (api/routes/financial.js)
app.get('/api/financial/pl', async (req, res) => {
  const mockData = {
    revenue: 500000 + Math.random() * 100000,  // ❌ VIOLATION
    cogs: 300000 + Math.random() * 50000,      // ❌ VIOLATION
    expenses: 150000 + Math.random() * 30000,  // ❌ VIOLATION
    netIncome: Math.random() * 50000           // ❌ VIOLATION
  }
  res.json(mockData)
})
```

### Required Changes

**Step 1**: Remove all `Math.random()` calls

**Step 2**: Replace with xeroService integration
```javascript
// NEW CODE (api/routes/financial.js)
app.get('/api/financial/pl', async (req, res) => {
  try {
    // Check Xero connection status
    const health = await xeroService.checkHealth()
    if (!health.connected) {
      return res.status(503).json({
        error: 'Xero not connected',
        message: 'Please connect Xero to view P&L data',
        code: 'XERO_NOT_CONNECTED',
        setupRequired: true
      })
    }

    // Fetch real P&L data from Xero
    const plData = await xeroService.getFinancialData()
    if (!plData || !plData.success) {
      throw new Error('Failed to fetch P&L data')
    }

    return res.status(200).json({
      success: true,
      data: {
        revenue: plData.data.revenue,
        cogs: plData.data.costOfGoodsSold,
        expenses: plData.data.expenses,
        netIncome: plData.data.netIncome
      },
      dataSource: 'xero',
      timestamp: new Date(),
      responseTime: plData.responseTime
    })
  } catch (error) {
    logger.error('Financial P&L error:', error)
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Unable to retrieve P&L data from Xero',
      code: 'SERVICE_ERROR'
    })
  }
})
```

**Step 3**: Add unit tests
```javascript
// tests/api/financial.test.js
describe('GET /api/financial/pl', () => {
  it('returns real Xero data when connected', async () => {
    mockXeroService.checkHealth.mockResolvedValue({ connected: true })
    mockXeroService.getFinancialData.mockResolvedValue({
      success: true,
      data: { revenue: 550000, costOfGoodsSold: 320000, ... }
    })

    const res = await request(app).get('/api/financial/pl')
    expect(res.status).toBe(200)
    expect(res.body.dataSource).toBe('xero')
    expect(res.body.data.revenue).toBe(550000)
  })

  it('returns 503 when Xero not connected', async () => {
    mockXeroService.checkHealth.mockResolvedValue({ connected: false })

    const res = await request(app).get('/api/financial/pl')
    expect(res.status).toBe(503)
    expect(res.body.setupRequired).toBe(true)
  })
})
```

### Validation

Run `testarch-automate --mode quick` to verify:
- ✅ No `Math.random()` in api/routes/financial.js
- ✅ Proper error handling exists
- ✅ Unit tests pass

---

## Story 2: Replace Hardcoded P&L Summary

**File**: `api/routes/financial.js`
**Story ID**: BMAD-MOCK-004
**Estimated**: 1 hour
**Priority**: MEDIUM

### Current Implementation (VIOLATION)

```javascript
// CURRENT CODE (api/routes/financial.js)
app.get('/api/financial/summary', async (req, res) => {
  const hardcodedSummary = {      // ❌ VIOLATION
    revenue: 500000,              // ❌ VIOLATION
    cogs: 300000,                 // ❌ VIOLATION
    grossProfit: 200000,          // ❌ VIOLATION
    expenses: 150000,             // ❌ VIOLATION
    netIncome: 50000              // ❌ VIOLATION
  }
  res.json(hardcodedSummary)
})
```

### Required Changes

**Step 1**: Remove hardcoded summary object

**Step 2**: Calculate from real Xero data
```javascript
// NEW CODE (api/routes/financial.js)
app.get('/api/financial/summary', async (req, res) => {
  try {
    const health = await xeroService.checkHealth()
    if (!health.connected) {
      return res.status(503).json({
        error: 'Xero not connected',
        message: 'Connect Xero to view financial summary',
        code: 'XERO_NOT_CONNECTED',
        setupRequired: true
      })
    }

    const plData = await xeroService.getFinancialData()
    if (!plData || !plData.success) {
      throw new Error('Failed to fetch data')
    }

    // Calculate summary from real data
    const summary = {
      revenue: plData.data.revenue || null,
      cogs: plData.data.costOfGoodsSold || null,
      grossProfit: (plData.data.revenue - plData.data.costOfGoodsSold) || null,
      expenses: plData.data.expenses || null,
      netIncome: plData.data.netIncome || null
    }

    return res.status(200).json({
      success: true,
      data: summary,
      dataSource: 'xero',
      timestamp: new Date()
    })
  } catch (error) {
    logger.error('Financial summary error:', error)
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Unable to calculate summary from Xero',
      code: 'SERVICE_ERROR'
    })
  }
})
```

**Step 3**: Verify frontend handles null values
```javascript
// src/components/FinancialReports.jsx
function FinancialSummary({ summary }) {
  if (!summary) return <EmptyState />

  return (
    <div>
      <MetricCard
        label="Revenue"
        value={summary.revenue !== null ? formatCurrency(summary.revenue) : 'N/A'}
      />
      <MetricCard
        label="Net Income"
        value={summary.netIncome !== null ? formatCurrency(summary.netIncome) : 'N/A'}
      />
    </div>
  )
}
```

### Validation

- ✅ No hardcoded summary objects
- ✅ Calculations match Xero data exactly
- ✅ Frontend renders null gracefully (shows "N/A" or empty state)

---

## Story 3: Remove Working Capital Fallback Data

**File**: `server/api/working-capital.js`
**Story ID**: BMAD-MOCK-007
**Estimated**: 3 hours
**Priority**: HIGH

### Current Implementation (VIOLATION)

```javascript
// CURRENT CODE (server/api/working-capital.js)
const fallbackData = {               // ❌ VIOLATION
  accountsReceivable: 170300,        // ❌ VIOLATION
  accountsPayable: 98200,            // ❌ VIOLATION
  topDebtors: [                      // ❌ VIOLATION
    { name: 'Customer A', amount: 45000 },
    { name: 'Customer B', amount: 32000 }
  ],
  topCreditors: [                    // ❌ VIOLATION
    { name: 'Supplier X', amount: 28000 },
    { name: 'Supplier Y', amount: 19000 }
  ]
}

app.get('/api/working-capital', async (req, res) => {
  try {
    const xeroData = await xeroService.getWorkingCapital()
    // If Xero fails, return fallback data ❌ VIOLATION
    const data = xeroData || fallbackData
    res.json(data)
  } catch (error) {
    res.json(fallbackData)  // ❌ VIOLATION
  }
})
```

### Required Changes

**Step 1**: Remove ALL fallback objects
```javascript
// DELETE these lines entirely
const fallbackData = { ... }  // ❌ DELETE
const data = xeroData || fallbackData  // ❌ DELETE
res.json(fallbackData)  // ❌ DELETE
```

**Step 2**: Implement proper error handling
```javascript
// NEW CODE (server/api/working-capital.js)
app.get('/api/working-capital', async (req, res) => {
  try {
    // Check Xero connection
    const health = await xeroService.checkHealth()
    if (!health.connected) {
      return res.status(503).json({
        error: 'Xero not connected',
        message: 'Please connect Xero to view working capital data',
        code: 'XERO_NOT_CONNECTED',
        setupRequired: true
      })
    }

    // Fetch real working capital data
    const wcData = await xeroService.getWorkingCapital()
    if (!wcData || !wcData.success) {
      throw new Error('Failed to fetch working capital data')
    }

    return res.status(200).json({
      success: true,
      data: {
        accountsReceivable: wcData.data.accountsReceivable,
        accountsPayable: wcData.data.accountsPayable,
        topDebtors: wcData.data.topDebtors || [],
        topCreditors: wcData.data.topCreditors || [],
        cashConversionCycle: wcData.data.cashConversionCycle,
        dso: wcData.data.dso,
        dpo: wcData.data.dpo,
        dio: wcData.data.dio
      },
      dataSource: 'xero',
      timestamp: new Date()
    })
  } catch (error) {
    logger.error('Working capital error:', error)
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Unable to retrieve working capital data from Xero',
      code: 'SERVICE_ERROR'
    })
  }
})
```

**Step 3**: Add retry logic with exponential backoff
```javascript
async function fetchWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      const delay = Math.pow(2, i) * 1000  // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Usage
const wcData = await fetchWithRetry(() => xeroService.getWorkingCapital())
```

**Step 4**: Verify frontend XeroSetupPrompt component (already exists from BMAD-MOCK-001)
```javascript
// src/pages/WorkingCapital.jsx
const { data, error } = useQuery(['working-capital'], fetchWorkingCapital)

if (error?.setupRequired) {
  return <XeroSetupPrompt />  // ✅ Component already exists
}
```

### Validation

Run `testarch-automate --mode standard` (includes integration tests):
- ✅ No fallback objects in server/api/working-capital.js
- ✅ Returns 503 when Xero unavailable
- ✅ Frontend shows XeroSetupPrompt on 503
- ✅ Retry logic tested (3 attempts)
- ✅ Integration tests validate error handling

---

## Testing Strategy

### Unit Tests (All 3 Stories)

**Coverage Requirements**: >90% for modified files

**Test Cases** (pattern for each file):
1. ✅ Returns real data when external API connected
2. ✅ Returns 503 when API not connected (setupRequired: true)
3. ✅ Returns 503 on API error (with error message)
4. ✅ Handles timeout scenarios (30s limit)
5. ✅ Validates data structure (no null/undefined in required fields)

### Integration Tests (Story 3 only)

**Test Xero Service Integration**:
```javascript
describe('Working Capital API Integration', () => {
  it('fetches real data from Xero sandbox', async () => {
    // Use Xero sandbox/test credentials
    const res = await request(app).get('/api/working-capital')
    expect(res.status).toBe(200)
    expect(res.body.dataSource).toBe('xero')
    expect(res.body.data.accountsReceivable).toBeGreaterThan(0)
  })

  it('retries on transient failures', async () => {
    // Mock Xero to fail twice, succeed on third attempt
    let attempts = 0
    mockXeroService.getWorkingCapital.mockImplementation(() => {
      attempts++
      if (attempts < 3) throw new Error('Transient failure')
      return { success: true, data: {...} }
    })

    const res = await request(app).get('/api/working-capital')
    expect(attempts).toBe(3)
    expect(res.status).toBe(200)
  })
})
```

### Architecture Validation (testarch-automate)

**Run After Each Story**:
```bash
# Story 1
testarch-automate --mode quick
# Validates: No Math.random() in financial.js

# Story 2
testarch-automate --mode quick
# Validates: No hardcoded summaries in financial.js

# Story 3
testarch-automate --mode standard
# Validates: No fallback data in working-capital.js
# Includes integration tests
```

---

## Deployment Strategy

### Story 1 & 2: Low Risk (same file, sequential)
- Deploy together to development
- Test in development environment
- Promote to test after validation
- Production deployment after UAT

### Story 3: Medium Risk (different service)
- Deploy independently
- Comprehensive testing in development
- Staged rollout (dev → test → production)
- Monitor error rates closely

### Rollback Plan

**If Issues Detected**:
1. Immediate: Revert git commit
2. Render auto-deploys previous version
3. Investigation: Review logs, identify root cause
4. Fix: Address issue in development
5. Re-deploy: After validation

---

## Success Criteria (EPIC-002 - 3 Stories Complete)

### Code Quality
- [ ] No `Math.random()` in api/routes/financial.js
- [ ] No hardcoded summary objects in api/routes/financial.js
- [ ] No fallback data in server/api/working-capital.js
- [ ] All files have try/catch error handling
- [ ] All endpoints return 503 with setupRequired when appropriate

### Testing
- [ ] Unit tests >90% coverage for all 3 files
- [ ] Integration tests pass for working capital
- [ ] testarch-automate shows 0 violations
- [ ] Manual testing in development environment successful

### Functionality
- [ ] Real Xero data displayed in dashboard
- [ ] XeroSetupPrompt shown when Xero not connected
- [ ] Retry logic works for transient failures
- [ ] Error messages clear and actionable
- [ ] No user-facing errors in production

### Documentation
- [ ] Story files updated with completion notes
- [ ] Retrospective documented with learnings
- [ ] BMAD-METHOD-V6A-IMPLEMENTATION.md metrics updated

---

## Risk Assessment

### Low Risk
- **Story 1**: Math.random() removal - straightforward replacement
- **Story 2**: Hardcoded summary - simple calculation change

### Medium Risk
- **Story 3**: Working capital fallbacks - more complex, retry logic needed

### Mitigation
- ✅ Established pattern from BMAD-MOCK-001 (Xero integration already working)
- ✅ Reusable XeroSetupPrompt component exists
- ✅ testarch-automate validates architecture compliance
- ✅ Staging environment for testing before production

---

## Timeline (6 Hours Total)

**Story 1**: 2 hours
- 1 hour: Code changes + error handling
- 30 min: Unit tests
- 30 min: testarch validation + documentation

**Story 2**: 1 hour
- 30 min: Code changes
- 15 min: Verify frontend null handling
- 15 min: Validation + documentation

**Story 3**: 3 hours
- 1.5 hours: Remove fallbacks + error handling + retry logic
- 1 hour: Integration tests
- 30 min: testarch validation + documentation

---

## Conclusion

This technical specification provides detailed implementation guidance for eliminating the last 3 mock data violations in the codebase. By following the established three-tier fallback pattern from BMAD-MOCK-001, we ensure consistent error handling, user experience, and data integrity across the platform.

**Next Action**: Create 3 story files, then implement sequentially

---

**Document Status**: ✅ COMPLETE
**Framework**: BMAD-METHOD v6a Phase 3 (Solutioning)
**Generated**: 2025-10-19
**Maintained By**: Development Team
