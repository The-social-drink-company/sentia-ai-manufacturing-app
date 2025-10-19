# BMAD-MOCK-001: Mock Data Audit Report

**Story**: BMAD-MOCK-001 - Connect Xero Financial Data
**Date**: October 19, 2025
**Phase**: 1.1 - Mock Data Source Audit
**Status**: ✅ COMPLETE

---

## Executive Summary

This audit identifies all mock data sources, hardcoded financial values, and Math.random() usage across the financial codebase that must be replaced with real Xero API data to complete BMAD-MOCK-001.

**Key Finding**: The DSO/DIO/DPO hardcoded values in xeroService.js have **already been fixed** - they now calculate from real P&L data instead of using hardcoded defaults.

---

## Critical Discoveries

### ✅ xeroService.js - ALREADY FIXED

**Previous Issue** (documented in story):
```javascript
// Lines 527-529: HARDCODED VALUES
const dso = 35; // Days Sales Outstanding - HARDCODED
const dio = 45; // Days Inventory Outstanding - HARDCODED
const dpo = 38; // Days Payable Outstanding - HARDCODED
```

**Current Implementation** ([services/xeroService.js](../../services/xeroService.js):527-550):
```javascript
// Calculate cash conversion cycle components from real data
// Need P&L data to calculate revenue/COGS for DSO/DIO/DPO
let dso = 0; // Days Sales Outstanding
let dio = 0; // Days Inventory Outstanding
let dpo = 0; // Days Payable Outstanding

try {
  logDebug('📊 Fetching P&L data for DSO/DIO/DPO calculation...');
  const plData = await this.getProfitAndLoss(1); // Get last period

  if (plData && plData.length > 0) {
    const currentPeriod = plData[0];
    const revenue = currentPeriod.totalRevenue || 0;
    const expenses = currentPeriod.totalExpenses || 0;

    // Estimate COGS as approximately 65% of expenses (typical for manufacturing)
    const cogs = expenses * 0.65;

    // Calculate real DSO: (AR / Revenue) * 365
    if (revenue > 0 && accountsReceivable > 0) {
      dso = (accountsReceivable / (revenue / 365));
    }

    // Calculate real DIO: (Inventory / COGS) * 365
    if (cogs > 0 && inventory > 0) {
      dio = (inventory / (cogs / 365));
    }

    // Calculate real DPO: (AP / COGS) * 365
    if (cogs > 0 && accountsPayable > 0) {
      dpo = (accountsPayable / (cogs / 365));
    }
  }
```

**Status**: ✅ **FIXED** - Now uses real Xero P&L data for calculations

---

## Mock Data Sources Requiring Fixes

### 1. api/routes/financial.js - P&L Analysis Endpoint

**Location**: [api/routes/financial.js](../../api/routes/financial.js):1003-1044

**Issue**: `/api/financial/pl-analysis` endpoint generates completely synthetic P&L data using Math.random()

**Code**:
```javascript
// Line 1003: Generate mock P&L data for demonstration
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const plData = months.map((month, index) => {
  // Generate realistic but varied data with seasonal patterns
  const baseRevenue = 1200 + (Math.sin(index * 0.5) * 200) + (Math.random() * 100);
  const seasonalFactor = 1 + (Math.sin(index * 0.5) * 0.15);

  const revenue = Math.round(baseRevenue * seasonalFactor);
  const grossProfit = Math.round(revenue * (0.55 + Math.random() * 0.15)); // 55-70% gross margin
  const ebitda = Math.round(revenue * (0.18 + Math.random() * 0.08)); // 18-26% EBITDA margin
  const grossMarginPercent = Number(((grossProfit / revenue) * 100).toFixed(1));

  return {
    month,
    revenue,
    grossProfit,
    ebitda,
    grossMarginPercent
  };
});
```

**Lines with Math.random()**:
- Line 1008: `(Math.random() * 100)` - Random revenue variation
- Line 1012: `(0.55 + Math.random() * 0.15)` - Random gross profit margin
- Line 1013: `(0.18 + Math.random() * 0.08)` - Random EBITDA margin

**Required Fix**: Replace with real Xero P&L data from `xeroService.getProfitAndLoss(11)`

**Impact**: HIGH - This is a user-facing dashboard endpoint

---

### 2. api/routes/financial.js - P&L Summary Endpoint

**Location**: [api/routes/financial.js](../../api/routes/financial.js):1051-1100

**Issue**: `/api/financial/pl-summary` endpoint uses hardcoded mock financial totals

**Code**:
```javascript
// Line 1065: Mock summary calculations
const mockTotalRevenue = 15840;
const mockTotalGrossProfit = 9860;
const mockTotalEbitda = 3420;

const summaryData = {
  totalRevenue: mockTotalRevenue,
  totalGrossProfit: mockTotalGrossProfit,
  totalEbitda: mockTotalEbitda,
  avgGrossMargin: Number(((mockTotalGrossProfit / mockTotalRevenue) * 100).toFixed(1)),
  avgEbitdaMargin: Number(((mockTotalEbitda / mockTotalRevenue) * 100).toFixed(1)),
  period
};
```

**Hardcoded Values**:
- Line 1066: `mockTotalRevenue = 15840`
- Line 1067: `mockTotalGrossProfit = 9860`
- Line 1068: `mockTotalEbitda = 3420`

**Required Fix**: Calculate from real Xero P&L data

**Impact**: MEDIUM - Summary endpoint for dashboard widgets

---

### 3. server/api/working-capital.js - Account ID Generation

**Location**: [server/api/working-capital.js](../../server/api/working-capital.js):253

**Issue**: Random account ID generation when real account data is missing

**Code**:
```javascript
// Line 253: Random account ID generation
id: account.id ?? account.accountId ?? `acct-${Math.random().toString(36).slice(2, 8)}`
```

**Analysis**: This is **acceptable fallback behavior** - it only generates random IDs when bank account data doesn't include an ID field. This is better than crashing.

**Required Action**: ⚠️ **LOW PRIORITY** - Document as acceptable fallback, but log warning when triggered

**Impact**: LOW - This is defensive code, not primary mock data

---

### 4. server/api/working-capital.js - Fallback Working Capital Data

**Location**: [server/api/working-capital.js](../../server/api/working-capital.js):133-164

**Issue**: Complete hardcoded working capital dataset when database is empty

**Code**:
```javascript
// Lines 133-164: Fallback data if no database records
workingCapitalData = {
  workingCapital: 1470000,
  currentRatio: 2.1,
  quickRatio: 1.8,
  cash: 580000,
  receivables: 1850000,
  payables: 980000,
  cashRunwayMonths: 6,
  liquiditySnapshot: {
    bankAccounts: parseBankAccounts(null, 580000),
    currentAssets: {
      cash: 580000,
      accountsReceivable: 1850000,
      inventory: 960000,
      otherCurrentAssets: 230000,
      total: 3620000,
    },
    currentLiabilities: {
      accountsPayable: 980000,
      shortTermDebt: 210000,
      accruedExpenses: 175000,
      otherCurrentLiabilities: 160000,
      total: 1525000,
    },
    inventory: parseInventory(inventorySummary),
  },
  forecast,
  lastCalculated: new Date().toISOString(),
}
```

**Required Fix**: Replace with Xero working capital data or return explicit error when Xero not connected

**Impact**: HIGH - This endpoint should integrate with Xero service for real data

---

## Files NOT Requiring Changes

### ✅ server/api/dashboard.js
**Status**: Already integrated with Xero
**Evidence**: Header comment shows "STATUS: Xero integration complete (BMAD-MOCK-001)"
**Lines**: 42-78 contain Xero health check and real data fetching

### ✅ services/xeroService.js
**Status**: Already fixed (DSO/DIO/DPO calculations)
**Evidence**: Lines 527-550 now calculate from real P&L data instead of hardcoded values

### ✅ sentia-mcp-server/ files
**Status**: Test code only
**Analysis**: All Math.random() and faker usage in `sentia-mcp-server/tests/utils/test-data-generators.js` is legitimate test data generation, not production code

---

## Summary of Required Fixes

| File | Lines | Issue | Priority | Estimated Time |
|------|-------|-------|----------|----------------|
| api/routes/financial.js | 1008, 1012, 1013 | Math.random() in P&L analysis | HIGH | 2 hours |
| api/routes/financial.js | 1066-1068 | Hardcoded P&L summary | MEDIUM | 1 hour |
| server/api/working-capital.js | 133-164 | Hardcoded fallback data | HIGH | 3 hours |
| server/api/working-capital.js | 253 | Random account ID | LOW | 30 min |

**Total Estimated Fix Time**: 6.5 hours

---

## Xero Integration Status

### ✅ Already Complete
- [x] xeroService.js DSO/DIO/DPO calculations (Lines 527-550)
- [x] xeroService.js working capital calculations (Lines 464-102)
- [x] server/api/dashboard.js Xero integration (Lines 42-78, 95-120)
- [x] Xero health check endpoint (dashboard.js:194-259)

### ⏳ Remaining Work
- [ ] Replace Math.random() in api/routes/financial.js P&L endpoints
- [ ] Integrate server/api/working-capital.js with xeroService
- [ ] Update SSE broadcasts to use real Xero data
- [ ] Create frontend XeroSetupPrompt component
- [ ] Write integration tests

---

## Recommendations

### Phase 2 Priority Order
1. **Fix api/routes/financial.js P&L endpoints** (HIGH priority, user-facing)
   - Replace Math.random() with xeroService.getProfitAndLoss()
   - Remove hardcoded mock values
   - Add proper error handling for Xero not connected

2. **Integrate server/api/working-capital.js with Xero** (HIGH priority)
   - Replace fallback data with xeroService.calculateWorkingCapital()
   - Return setup instructions when Xero not available
   - Remove hardcoded financial values

3. **Document random ID generation** (LOW priority)
   - Add logging when random IDs are generated
   - Document as acceptable fallback behavior

### Testing Strategy
- Test all endpoints with Xero connected
- Test all endpoints with Xero NOT connected (should return setup prompts)
- Verify no Math.random() or hardcoded values in response data
- Confirm error messages guide users to connect Xero

---

## Phase 1.1 Deliverable Status

✅ **COMPLETE** - Mock data audit documented with:
- List of all mock data sources identified
- Line numbers and code snippets
- Priority and impact assessment
- Estimated fix times
- Current Xero integration status
- Recommendations for Phase 2

**Next Step**: Phase 1.2 - Test existing Xero service functionality

---

**Audit Completed**: October 19, 2025
**Auditor**: Claude (BMAD Agent)
**Story**: BMAD-MOCK-001
**Epic**: EPIC-002 - Eliminate Mock Data with Live API Integration
