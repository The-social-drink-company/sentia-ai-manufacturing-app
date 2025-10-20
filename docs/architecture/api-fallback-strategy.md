# API Fallback Strategy

**Last Updated**: 2025-10-19
**Version**: 1.0
**Framework**: BMAD-METHOD v6a (EPIC-002 - Eliminate Mock Data)
**Story**: BMAD-MOCK-009

---

## Overview

This document defines the **three-tier fallback strategy** implemented across all external API integrations in the CapLiquify Platform AI Dashboard. This strategy ensures graceful degradation when external services are unavailable while maintaining **zero mock data violations** in production.

### Core Principle

**NO MOCK DATA FALLBACKS**: The application never generates fake data to disguise API failures. All fallback mechanisms provide real data from alternative sources or clear error states with actionable resolution steps.

---

## Three-Tier Fallback Strategy

### Tier 1: Real-time API Data (Primary)

**Priority**: HIGHEST
**Source**: Live external API integration
**Freshness**: Real-time or near-real-time (based on sync frequency)

When external API is available and responding normally, the dashboard displays live data directly from:
- **Xero API**: Financial data (accounts receivable, accounts payable, P&L, cash flow)
- **Shopify REST API**: Multi-store sales data (UK/EU/USA orders, products, revenue)
- **Amazon SP-API**: FBA inventory and order management
- **Unleashed ERP**: Manufacturing data (assembly jobs, stock on hand, production schedule)

**Implementation Pattern**:
```javascript
// Example: Xero Working Capital
const xeroData = await xeroService.getWorkingCapital();
if (xeroData?.success && xeroData.data) {
  return {
    success: true,
    data: xeroData.data,
    source: 'xero_api',
    timestamp: new Date().toISOString()
  };
}
// Fall to Tier 2...
```

### Tier 2: Database Estimates (Secondary)

**Priority**: MEDIUM
**Source**: Historical data aggregation from Prisma database
**Freshness**: Last successful sync timestamp

When external API is temporarily unavailable (timeout, rate limit, network error), the dashboard falls back to **real historical data** stored in the local database from previous successful syncs.

**Calculation Methods**:
- **Receivables**: Sum of `prisma.invoice.findMany({ where: { status: 'SENT' } })`
- **Payables**: Sum of `prisma.bill.findMany({ where: { status: 'AUTHORISED' } })`
- **Inventory**: Sum of `prisma.product.findMany()` with `quantityOnHand`
- **Sales**: Aggregate of `prisma.order.findMany()` grouped by channel

**Implementation Pattern**:
```javascript
// Example: Database fallback for working capital
const dbInvoices = await prisma.invoice.findMany({
  where: { status: 'SENT' }
});
const totalReceivables = dbInvoices.reduce((sum, inv) => sum + inv.total, 0);

return {
  success: true,
  data: {
    accountsReceivable: totalReceivables,
    // ... other metrics from DB
  },
  source: 'database_estimate',
  timestamp: lastSyncTimestamp,
  note: 'Xero API unavailable. Showing last known data.'
};
```

**Key Characteristics**:
- ✅ Real data (from previous API syncs)
- ✅ Accurate historical snapshot
- ❌ NOT real-time (staleness indicated to user)
- ❌ NOT mock data (came from real API originally)

### Tier 3: Setup Instructions (Error State)

**Priority**: LOWEST
**Source**: HTTP 503 response with actionable error details
**Freshness**: N/A (no data available)

When **both** external API and database have no data (e.g., first-time setup, credentials missing/invalid, database empty), the system returns a **503 Service Unavailable** response with clear setup instructions.

**Implementation Pattern**:
```javascript
// Example: No data available
return res.status(503).json({
  success: false,
  error: 'xero_not_connected',
  message: 'Xero integration not configured. Add XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_TENANT_ID environment variables.',
  setupRequired: true,
  setupInstructions: {
    step1: 'Go to https://developer.xero.com/myapps',
    step2: 'Create OAuth 2.0 app',
    step3: 'Add environment variables to Render',
    step4: 'Restart service'
  },
  documentation: 'https://docs.sentia.ai/integrations/xero-setup'
});
```

**Frontend Handling**:
When receiving a 503 response with `setupRequired: true`, the frontend displays a **Setup Prompt Component** (e.g., `XeroSetupPrompt.jsx`) instead of broken widgets.

**Setup Prompt Components**:
- `XeroSetupPrompt.jsx` - Green branding, BanknotesIcon
- `ShopifySetupPrompt.jsx` - Green branding, ShoppingBagIcon
- `AmazonSetupPrompt.jsx` - Orange branding, ShoppingCartIcon
- `UnleashedSetupPrompt.jsx` - Purple branding, CogIcon

---

## Integration-Specific Fallback Behavior

### Xero Financial Integration

**Service**: `services/xeroService.js`
**Endpoints**:
- `/api/v1/dashboard/working-capital`
- `/api/v1/dashboard/financial-reports`
- `/api/v1/dashboard/cash-flow`

**Fallback Flow**:
1. **Tier 1**: Xero OAuth → `GET /api.xro/2.0/Reports/BalanceSheet`
2. **Tier 2**: Prisma → `sum(Invoice.total)`, `sum(Bill.total)`
3. **Tier 3**: 503 → `XeroSetupPrompt.jsx` with OAuth setup instructions

**Code Example**:
```javascript
// services/xeroService.js - calculateWorkingCapital()
try {
  // Tier 1: Xero API
  const balanceSheet = await this.getBalanceSheet();
  if (balanceSheet?.success) {
    return { success: true, data: balanceSheet.data, source: 'xero_api' };
  }
} catch (error) {
  logger.warn('[Xero] API call failed, falling back to database', { error: error.message });
}

// Tier 2: Database estimates
const dbInvoices = await prisma.invoice.findMany({ where: { status: 'SENT' } });
if (dbInvoices.length > 0) {
  const receivables = dbInvoices.reduce((sum, inv) => sum + inv.total, 0);
  return { success: true, data: { accountsReceivable: receivables }, source: 'database_estimate' };
}

// Tier 3: Setup instructions
return { success: false, error: 'xero_not_connected', setupRequired: true };
```

---

### Shopify Multi-Store Integration

**Service**: `services/shopify-multistore.js`
**Endpoints**:
- `/api/v1/dashboard/shopify-sales`
- `/api/v1/dashboard/sales-trends`
- `/api/v1/dashboard/product-performance`

**Fallback Flow**:
1. **Tier 1**: Shopify REST API → `GET /admin/api/2024-01/orders.json`
2. **Tier 2**: Prisma → `sum(Order.totalPrice)` grouped by store
3. **Tier 3**: 503 → `ShopifySetupPrompt.jsx` with API key setup

**Code Example**:
```javascript
// services/shopify-multistore.js - getConsolidatedSalesData()
try {
  // Tier 1: Shopify API (3 stores in parallel)
  const [ukData, euData, usaData] = await Promise.all([
    this.fetchStoreOrders('uk'),
    this.fetchStoreOrders('eu'),
    this.fetchStoreOrders('usa')
  ]);
  return { success: true, data: { ukData, euData, usaData }, source: 'shopify_api' };
} catch (error) {
  logger.warn('[Shopify] API call failed, falling back to database');
}

// Tier 2: Database aggregation
const dbOrders = await prisma.order.findMany({ where: { channel: 'SHOPIFY' } });
if (dbOrders.length > 0) {
  const revenue = dbOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  return { success: true, data: { totalRevenue: revenue }, source: 'database_estimate' };
}

// Tier 3: Setup instructions
return { success: false, error: 'shopify_not_connected', setupRequired: true };
```

---

### Amazon SP-API Integration

**Service**: `services/amazon-sp-api.js`
**Endpoints**:
- `/api/v1/dashboard/amazon-orders`
- `/api/v1/dashboard/amazon-inventory`
- `/api/v1/dashboard/channel-performance`

**Fallback Flow**:
1. **Tier 1**: Amazon SP-API → OAuth 2.0 (LWA) + AWS IAM role assumption → `GET /fba/inventory/v1/summaries`
2. **Tier 2**: Prisma → `sum(AmazonFBAInventory.quantity)`
3. **Tier 3**: 503 → `AmazonSetupPrompt.jsx` with 6-step setup (refresh token, LWA, IAM role)

**Code Example**:
```javascript
// services/amazon-sp-api.js - getInventorySummary()
try {
  // Tier 1: Amazon SP-API (OAuth + IAM)
  const accessToken = await this.getAccessToken();
  const inventory = await this.fetchFBAInventory(accessToken);
  return { success: true, data: inventory, source: 'amazon_sp_api' };
} catch (error) {
  logger.warn('[Amazon] SP-API call failed, falling back to database');
}

// Tier 2: Database FBA inventory
const dbInventory = await prisma.amazonFBAInventory.findMany();
if (dbInventory.length > 0) {
  const totalQuantity = dbInventory.reduce((sum, item) => sum + item.quantity, 0);
  return { success: true, data: { totalQuantity }, source: 'database_estimate' };
}

// Tier 3: Setup instructions
return { success: false, error: 'amazon_not_connected', setupRequired: true };
```

---

### Unleashed ERP Integration

**Service**: `services/unleashed-erp.js`
**Endpoints**:
- `/api/v1/dashboard/manufacturing`
- `/api/v1/dashboard/production-data`
- `/api/v1/dashboard/unleashed-inventory`
- `/api/v1/dashboard/quality-control`

**Fallback Flow**:
1. **Tier 1**: Unleashed API → HMAC-SHA256 auth → `GET /AssemblyJobs`, `GET /StockOnHand`
2. **Tier 2**: Prisma → `count(AssemblyJob)`, `sum(Inventory.quantity)`
3. **Tier 3**: 503 → `UnleashedSetupPrompt.jsx` with HMAC setup

**Code Example**:
```javascript
// services/unleashed-erp.js - syncProductionData()
try {
  // Tier 1: Unleashed API
  const assemblyJobs = await this.fetchAssemblyJobs();
  const activeBatches = assemblyJobs.filter(job => job.JobStatus === 'InProgress').length;
  return { success: true, data: { activeBatches }, source: 'unleashed_api' };
} catch (error) {
  logger.warn('[Unleashed] API call failed, falling back to database');
}

// Tier 2: Database assembly jobs
const dbJobs = await prisma.assemblyJob.findMany({ where: { status: 'IN_PROGRESS' } });
if (dbJobs.length > 0) {
  return { success: true, data: { activeBatches: dbJobs.length }, source: 'database_estimate' };
}

// Tier 3: Setup instructions
return { success: false, error: 'unleashed_not_connected', setupRequired: true };
```

---

## Error Handling Standards

### Retry Logic

All API calls implement **3-attempt retry with exponential backoff**:

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      logger.warn(`Retry attempt ${attempt}/${maxRetries} after ${backoffMs}ms`, { error: error.message });
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
}
```

### Timeout Handling

All API calls have a **30-second timeout**:

```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s

try {
  const response = await fetch(apiUrl, {
    signal: controller.signal,
    headers: { Authorization: `Bearer ${token}` }
  });
  clearTimeout(timeout);
  return response;
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('API request timed out after 30 seconds');
  }
  throw error;
}
```

### Rate Limit Handling

Respect `429 Too Many Requests` with `Retry-After` header:

```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After') || 60;
  logger.warn(`Rate limit hit, retrying after ${retryAfter}s`);
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  return retryWithBackoff(fn, maxRetries - 1);
}
```

---

## Frontend Integration

### TanStack Query Cache Invalidation

When Tier 1 (API) data becomes available after Tier 2 (database) fallback, the frontend automatically invalidates the cache and refetches:

```javascript
// src/hooks/useSSE.js - SSE event listener
useEffect(() => {
  const eventSource = new EventSource('/api/sse/dashboard');

  eventSource.addEventListener('xero:data_updated', () => {
    queryClient.invalidateQueries(['working-capital']);
    queryClient.invalidateQueries(['financial-reports']);
  });

  eventSource.addEventListener('shopify:sync_completed', () => {
    queryClient.invalidateQueries(['shopify-sales']);
  });
}, []);
```

### Setup Prompt Component Pattern

All setup prompts follow this consistent pattern:

```jsx
// src/components/integrations/XeroSetupPrompt.jsx
export default function XeroSetupPrompt({ xeroStatus }) {
  // Don't show if Xero is connected
  if (!xeroStatus || xeroStatus.connected === true) {
    return null;
  }

  const hasConfigError = xeroStatus.details?.missing && xeroStatus.details.missing.length > 0;

  return (
    <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6">
      <div className="flex items-start gap-4">
        <BanknotesIcon className="h-8 w-8 text-green-600 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-green-900">
            Connect Xero to Enable Financial Intelligence
          </h3>
          <p className="mt-2 text-sm text-green-800">
            Your dashboard needs Xero integration to display real-time financial data...
          </p>

          {/* 4-step setup wizard */}
          <div className="mt-6 space-y-6">
            <SetupStep number={1} title="Access Xero Developer Portal" ... />
            <SetupStep number={2} title="Create OAuth 2.0 App" ... />
            <SetupStep number={3} title="Add Environment Variables" ... />
            <SetupStep number={4} title="Restart Service" ... />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Monitoring and Observability

### Logging Standards

All fallback transitions are logged with structured context:

```javascript
logger.info('[Xero] Using Tier 1 (API)', { source: 'xero_api', timestamp });
logger.warn('[Xero] Tier 1 failed, using Tier 2 (database)', { error: error.message, fallback: 'database_estimate' });
logger.error('[Xero] All tiers failed, returning 503', { setupRequired: true });
```

### Metrics Collection

Track fallback usage to identify reliability issues:

```javascript
metrics.increment('api.xero.tier1.success');
metrics.increment('api.xero.tier2.fallback');
metrics.increment('api.xero.tier3.error');
```

---

## Validation and Testing

### testarch-automate Rules

The codebase is validated with the following rules to prevent mock data violations:

```javascript
// testarch-automate.config.js
module.exports = {
  rules: [
    {
      name: 'no-math-random',
      pattern: /Math\.random\(\)/,
      excludePatterns: [/tests\//, /\.test\./],
      severity: 'error',
      message: 'Math.random() is not allowed in production code (mock data violation)'
    },
    {
      name: 'no-mock-data-objects',
      pattern: /(mockData|fallbackData|sampleData|fakeData)\s*=/,
      severity: 'error',
      message: 'Mock data objects not allowed (use real API → database → 503 pattern)'
    }
  ]
};
```

### Integration Tests

Each integration has tests covering all three tiers:

```javascript
// tests/integration/xero.test.js
describe('Xero Fallback Strategy', () => {
  it('Tier 1: Returns real Xero API data when connected', async () => {
    const result = await xeroService.getWorkingCapital();
    expect(result.source).toBe('xero_api');
  });

  it('Tier 2: Falls back to database when API fails', async () => {
    mockXeroAPIFailure();
    const result = await xeroService.getWorkingCapital();
    expect(result.source).toBe('database_estimate');
  });

  it('Tier 3: Returns 503 when no data available', async () => {
    mockXeroAPIFailure();
    mockDatabaseEmpty();
    const response = await request(app).get('/api/working-capital');
    expect(response.status).toBe(503);
    expect(response.body.setupRequired).toBe(true);
  });
});
```

---

## Best Practices Summary

### DO ✅

- ✅ Use three-tier fallback: API → Database → 503
- ✅ Return real data from Tier 1 (live API) and Tier 2 (historical DB)
- ✅ Return 503 with setup instructions for Tier 3
- ✅ Log all fallback transitions with structured context
- ✅ Display setup prompt components on 503 responses
- ✅ Implement retry logic (3 attempts, exponential backoff)
- ✅ Respect rate limits (429 with Retry-After)
- ✅ Set 30-second timeouts on all API calls
- ✅ Track metrics for fallback usage
- ✅ Validate with testarch-automate rules

### DON'T ❌

- ❌ Generate fake data to disguise API failures
- ❌ Use `Math.random()` for any production data
- ❌ Create hardcoded fallback objects (e.g., `const fallbackData = {...}`)
- ❌ Return empty arrays without indicating data source
- ❌ Hide API failures from users (always show setup instructions)
- ❌ Skip retry logic (always attempt 3 times)
- ❌ Ignore rate limits (respect 429 responses)
- ❌ Allow infinite API call timeouts
- ❌ Skip logging fallback transitions
- ❌ Return 200 OK with fake data on errors

---

## Related Documentation

- [Xero Setup Guide](../integrations/xero-setup.md)
- [Shopify Setup Guide](../integrations/shopify-setup.md)
- [Amazon SP-API Setup Guide](../integrations/amazon-setup.md)
- [Unleashed ERP Setup Guide](../integrations/unleashed-erp-setup.md)
- [BMAD-MOCK-009 Story](../../bmad/stories/2025-10-bmad-mock-009-api-fallback-documentation.md)

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-19 | Initial creation (BMAD-MOCK-009) | Development Team |

---

**Framework**: BMAD-METHOD v6a Phase 4 (Implementation)
**Epic**: EPIC-002 - Eliminate All Mock Data
**Story**: BMAD-MOCK-009
**Status**: Complete
