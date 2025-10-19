# BMAD-MOCK-005: Amazon SP-API Integration

**Epic**: EPIC-002 - Eliminate All Mock Data
**Sprint**: Sprint 2 - External Integrations
**Status**: ✅ COMPLETE
**Story Points**: 8
**Priority**: P1 - High

## Story Description

As a business user, I need the dashboard to integrate with Amazon Selling Partner API (SP-API) to display real FBA inventory levels, order metrics, and channel performance analytics so that I can make informed decisions about marketplace strategy and inventory management.

## Acceptance Criteria

- [x] Amazon SP-API service fully implemented with OAuth 2.0 authentication
- [x] Real-time FBA inventory sync (15-minute background sync)
- [x] Order metrics tracking (revenue, orders, unshipped items)
- [x] Dashboard endpoints return setup instructions when Amazon not connected
- [x] No mock data fallbacks anywhere in Amazon integration
- [x] Comprehensive setup documentation created
- [x] AmazonSetupPrompt component displays configuration instructions
- [x] Channel performance endpoint compares Amazon vs. Shopify data

## Implementation Details

### Files Modified/Created

1. **services/amazon-sp-api.js** (460 lines) - **Already Existed**
   - Full Amazon SP-API client implementation
   - OAuth 2.0 with Login with Amazon (LWA) authentication
   - 15-minute background sync scheduler
   - Prisma database persistence for inventory/orders/FBA shipments
   - Redis caching (5-minute TTL)
   - SSE event broadcasting for real-time dashboard updates

2. **server/api/dashboard.js** - **Enhanced (6 edits)**
   - Added Amazon connection health check (lines 45-53)
   - Integrated Amazon data into setup instructions metadata (lines 72-76)
   - Added parallel Amazon data fetching (lines 83-98)
   - Enhanced logging with Amazon metrics (lines 100-104)
   - Added Amazon sales breakdown to KPIs (lines 134-140)
   - Added Amazon inventory to KPIs and metadata (lines 171-208)

3. **src/components/integrations/AmazonSetupPrompt.jsx** (200 lines) - **NEW**
   - React component displaying setup instructions when Amazon not configured
   - Orange Amazon branding (ShoppingCartIcon)
   - 5-step setup wizard (Developer registration → OAuth → IAM role → Environment vars → Restart)
   - Lists 6 required environment variables with examples
   - Links to Amazon Developer Portal and setup documentation
   - Technical details collapsible section (dev mode only)

4. **docs/integrations/amazon-setup.md** (400+ lines) - **NEW**
   - Comprehensive setup guide mirroring Xero documentation quality
   - 9-step process with time estimates (total: ~40 minutes)
   - AWS IAM role creation instructions with policy JSON
   - Environment variable configuration for Render and local dev
   - Troubleshooting section (7 common errors with solutions)
   - API endpoint reference table
   - Data transformation formulas
   - Security best practices
   - Advanced configuration (multi-marketplace, custom sync schedules)

### API Endpoints

**Dashboard Integration** (already existed in dashboard.js):
- `/api/v1/dashboard/amazon-orders` (lines 555-598)
  - Returns order metrics when connected
  - Returns setup instructions when not connected (no 503, just setupRequired: true)
- `/api/v1/dashboard/amazon-inventory` (lines 605-648)
  - Returns FBA inventory summary
  - Setup instructions when credentials missing
- `/api/v1/dashboard/channel-performance` (lines 650-720)
  - Compares Shopify vs Amazon revenue/orders
  - Calculates channel percentages
- `/api/v1/dashboard/executive` (enhanced)
  - Includes Amazon data in parallel fetch
  - Revenue KPI includes Amazon breakdown
  - Inventory KPI sourced from Amazon when available

### Environment Variables Required

```
AMAZON_REFRESH_TOKEN=Atzr|IwEBIA...       # From OAuth authorization
AMAZON_LWA_APP_ID=amzn1.application...   # LWA App Client ID
AMAZON_LWA_CLIENT_SECRET=abc123...       # LWA Client Secret
AMAZON_SP_ROLE_ARN=arn:aws:iam::...      # AWS IAM Role ARN
AMAZON_SELLER_ID=A1B2C3D4E5F6G7          # Merchant Token
AMAZON_REGION=us-east-1                  # AWS Region (optional)
```

### Key Features Implemented

1. **Authentication Flow**:
   - Login with Amazon (LWA) OAuth 2.0
   - AWS IAM role assumption using STS
   - Automatic token refresh
   - Connection health checking

2. **Data Sync Schedule**:
   - Background sync every 15 minutes
   - Initial sync on service initialization
   - Parallel sync of inventory, orders, and FBA shipments
   - SSE events broadcast after each sync completion

3. **Database Persistence**:
   - `amazonInventory` table: ASIN, SKU, quantities, fulfillable/reserved
   - `amazonOrder` table: Order ID, status, totals, shipping counts
   - `amazonFBAShipment` table: Shipment tracking, fulfillment centers
   - Upsert pattern prevents duplicates

4. **Caching Strategy**:
   - Redis 5-minute TTL for inventory summary
   - Redis 5-minute TTL for order metrics
   - Individual item caching by ASIN (300 seconds)
   - Reduces SP-API rate limit consumption

5. **Error Handling**:
   - Service returns `isConnected: false` when credentials missing
   - Dashboard endpoints return setup instructions (not 503 errors)
   - No mock data fallbacks anywhere
   - Proper error logging with categorization

## Testing

### Verification Performed

✅ **Service File Review** (services/amazon-sp-api.js):
- Lines 54-61: Credentials validation returns false if missing (no mock fallback)
- Lines 108-110: `syncInventoryData()` throws error when not connected
- Lines 183, 238: Other sync methods check `isConnected` flag
- Lines 393-416: `getInventorySummary()` returns database/cache data only
- No `Math.random()`, `mockData`, or `fallbackData` patterns found

✅ **Dashboard Endpoint Review** (server/api/dashboard.js):
- Lines 559-566: `/amazon-orders` returns setup instructions when not connected
- Lines 609-616: `/amazon-inventory` returns setup instructions when not connected
- Lines 85-98: Executive endpoint includes Amazon in parallel fetch (graceful degradation)
- No 503 errors, uses `setupRequired: true` pattern instead

✅ **Component Review** (AmazonSetupPrompt.jsx):
- Conditional rendering based on `amazonStatus.connected`
- Returns `null` when connected (doesn't show setup prompt)
- Lists all 6 required environment variables
- Amazon branding with orange colors

✅ **Documentation Review** (docs/integrations/amazon-setup.md):
- Complete 9-step setup process
- AWS IAM role creation instructions
- Troubleshooting for 7 common errors
- Security best practices section
- API endpoint reference table

### Expected Behavior

**When Amazon NOT Configured**:
```json
GET /api/v1/dashboard/amazon-orders
{
  "success": false,
  "error": "amazon_not_connected",
  "data": null,
  "message": "Amazon SP-API not configured. Add AMAZON_REFRESH_TOKEN, AMAZON_LWA_APP_ID, AMAZON_LWA_CLIENT_SECRET, AMAZON_SP_ROLE_ARN environment variables.",
  "setupRequired": true
}
```

**When Amazon Configured**:
```json
GET /api/v1/dashboard/amazon-orders
{
  "success": true,
  "data": {
    "orders": {
      "totalOrders": 47,
      "totalRevenue": 1520.50,
      "averageOrderValue": 32.35,
      "unshippedOrders": 3
    },
    "metadata": {
      "timestamp": "2025-10-19T15:30:00.000Z",
      "dataSource": "amazon_sp_api",
      "timeRange": "Last 24 hours"
    }
  }
}
```

**Executive Dashboard with Amazon**:
- Revenue KPI includes `amazon: { revenue, orders, avgOrderValue, unshippedOrders }`
- Inventory KPI includes `inventory: { totalSKUs, totalQuantity, lowStockItems }`
- Integration status shows `amazon: true/false`

## Definition of Done

- [x] Amazon SP-API service implemented (already existed) ✅
- [x] Dashboard endpoints enhanced with Amazon data ✅
- [x] Setup prompt component created ✅
- [x] Comprehensive documentation written ✅
- [x] Error handling verified (no mock fallbacks) ✅
- [x] Code reviewed and approved ✅
- [x] Story marked complete ✅

## Timeline

- **Created**: October 19, 2025 (Phase 4 Planning)
- **Implementation Started**: October 19, 2025
- **Implementation Completed**: October 19, 2025
- **Duration**: ~2 hours (estimated 8 hours, 75% savings due to existing service)

## Notes

### Pattern Reuse Velocity

This story demonstrates the power of infrastructure reuse:
- **Service Layer**: Amazon SP-API service already fully implemented (460 lines)
- **Dashboard Endpoints**: Already existed with proper error handling
- **Only New Work**: Setup prompt component (200 lines), documentation (400 lines)
- **Time Savings**: ~6 hours saved by discovering existing implementation

This matches the pattern from Sprint 1:
- BMAD-MOCK-003 (Math.random removal) - already complete
- BMAD-MOCK-004 (P&L summary) - already complete
- BMAD-MOCK-007 (working capital) - already complete

**Lesson**: Always search codebase for existing implementations before starting from scratch.

### Integration Quality

The Amazon SP-API integration is **enterprise-grade**:
- ✅ Full OAuth 2.0 + AWS IAM authentication
- ✅ Background sync with intelligent scheduling
- ✅ Database persistence with Prisma
- ✅ Redis caching to respect rate limits
- ✅ SSE event broadcasting for real-time updates
- ✅ Comprehensive error handling
- ✅ No mock data anywhere

### Technical Excellence

**Authentication**:
- Login with Amazon (LWA) token exchange
- AWS Security Token Service (STS) for IAM role assumption
- Automatic refresh token management

**Rate Limit Compliance**:
- FBA Inventory: 0.1 req/s (6/min) - respected via 15-min sync
- Orders: 0.0167 req/s (1/min) - respected via 15-min sync
- Redis caching prevents redundant API calls

**Data Transformation**:
```javascript
// Inventory aggregation
totalSKUs = inventoryItems.length
totalQuantity = sum(item.totalQuantity)
lowStockItems = items where fulfillableQuantity < 10

// Order metrics
totalRevenue = sum(order.OrderTotal.Amount)
avgOrderValue = totalRevenue / totalOrders
unshippedOrders = orders where OrderStatus === 'Unshipped'

// Channel comparison
amazonPercentage = (amazonRevenue / totalRevenue) × 100
```

## Related Stories

- **BMAD-MOCK-001**: Shopify Multi-Store Integration (complete)
- **BMAD-MOCK-002**: Xero Financial Integration (complete)
- **BMAD-MOCK-006**: Unleashed ERP Integration (next story)

## References

- [Setup Documentation](../../docs/integrations/amazon-setup.md)
- [Amazon SP-API Docs](https://developer-docs.amazon.com/sp-api/)
- [Service Implementation](../../services/amazon-sp-api.js)
- [Dashboard Endpoints](../../server/api/dashboard.js)
- [Setup Component](../../src/components/integrations/AmazonSetupPrompt.jsx)

---

**Last Updated**: 2025-10-19
**Version**: 1.0
**Sprint**: Sprint 2
**Epic**: EPIC-002 (60% complete - 6/10 stories)
