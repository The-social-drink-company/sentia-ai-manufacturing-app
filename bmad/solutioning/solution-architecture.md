# Solution Architecture
## CapLiquify Platform AI Dashboard

**Date**: 2025-10-19
**Version**: 1.0
**Framework**: BMAD-METHOD v6a Phase 3 (Solutioning)
**Project Scale**: Level 4 (Complex Enterprise System)

---

## 1. System Overview

### Architecture Pattern
**Full-Stack Node.js with External API Integration**

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Dashboard │ │Widgets   │ │Working   │ │Forecast  │       │
│  │Grid      │ │          │ │Capital   │ │Engine    │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │               │
│       └────────────┴────────────┴────────────┘               │
│                         │                                    │
│                    SSE + REST API                            │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│               Express.js Backend (Node.js)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │API       │ │Services  │ │Queue     │ │SSE       │       │
│  │Routes    │ │Layer     │ │(BullMQ)  │ │Stream    │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │               │
└───────┼────────────┼────────────┼────────────┼───────────────┘
        │            │            │            │
     ┌──▼────────────▼─┐      ┌──▼────┐   ┌──▼────┐
     │   Prisma ORM    │      │ Redis │   │ SSE   │
     └────────┬────────┘      └───────┘   │Clients│
              │                            └───────┘
     ┌────────▼────────┐
     │   PostgreSQL    │
     │   (pgvector)    │
     └─────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   External APIs                               │
│  ┌─────┐ ┌────────┐ ┌────────┐ ┌──────────┐               │
│  │Xero │ │Shopify │ │Amazon  │ │Unleashed │               │
│  │API  │ │API     │ │SP-API  │ │ERP       │               │
│  └──┬──┘ └───┬────┘ └───┬────┘ └────┬─────┘               │
│     │        │           │           │                      │
└─────┼────────┼───────────┼───────────┼──────────────────────┘
      │        │           │           │
  ┌───▼────────▼───────────▼───────────▼───┐
  │    Service Layer (Integration)         │
  │  xeroService │ shopifyService │ etc.   │
  └────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Monolithic Full-Stack**: Simpler deployment, easier debugging for current scale
2. **Service Layer Pattern**: Clean separation between API routes and business logic
3. **Three-Tier Fallback**: Real data → Estimates → Setup instructions (never fake data)
4. **SSE for Real-time**: Lower overhead than WebSocket for one-way updates
5. **BullMQ for Async Jobs**: Import/export with progress tracking and retry logic

---

## 2. Component Design

### 2.1 Frontend Architecture

**Stack**: React 18, Vite 4, Tailwind CSS, shadcn/ui

#### State Management
- **Local State**: Zustand stores with localStorage persistence
- **Server State**: TanStack Query (React Query) for API data
- **Real-time**: SSE integration with automatic query invalidation

#### Component Hierarchy
```
App
├── AuthProvider (Clerk)
├── QueryClientProvider (TanStack Query)
├── ErrorBoundary
└── Layout
    ├── Header (nav, user menu)
    ├── Sidebar (role-based navigation)
    └── MainContent
        ├── Dashboard (grid layout)
        │   ├── KPIStripWidget
        │   ├── DemandForecastWidget
        │   ├── WorkingCapitalWidget
        │   └── FinancialReportsWidget
        ├── WorkingCapitalPage
        ├── InventoryPage
        └── ProductionPage
```

#### Key Frontend Patterns

**1. Widget Pattern** - Modular, reusable dashboard widgets
```javascript
// Widget structure
const Widget = ({ title, data, loading, error }) => {
  if (loading) return <WidgetSkeleton />
  if (error) return <WidgetError error={error} />
  if (!data) return <WidgetEmpty onSetup={...} />
  return <WidgetContent data={data} />
}
```

**2. Setup Prompt Pattern** - Consistent integration setup UX
```javascript
// XeroSetupPrompt.jsx (template for all integrations)
<SetupPrompt
  icon={<XeroLogo />}
  title="Connect Xero"
  description="Link your Xero account for real-time financial data"
  steps={[...]}
  onConnect={handleOAuthFlow}
/>
```

**3. Real-time Update Pattern** - SSE integration with query invalidation
```javascript
useSSE('/api/sse', {
  onEvent: (event) => {
    if (event.type === 'financial_update') {
      queryClient.invalidateQueries(['working-capital'])
    }
  }
})
```

---

### 2.2 Backend Architecture

**Stack**: Node.js, Express.js, Prisma ORM

#### API Layer Structure
```
server/
├── api/              # API route handlers
│   ├── dashboard.js  # Dashboard data aggregation
│   ├── financial.js  # Financial endpoints (P&L, etc.)
│   └── working-capital.js  # Working capital calculations
├── routes/           # Express routers
│   ├── sse.js        # Server-Sent Events
│   └── data.js       # Data management
└── services/         # Business logic layer
    ├── xeroService.js       # Xero API integration
    ├── shopifyService.js    # Shopify multi-store
    ├── amazonService.js     # Amazon SP-API
    └── unleashedService.js  # Unleashed ERP
```

#### Service Layer Pattern

**Three-Tier Fallback Strategy** (CRITICAL for EPIC-002)
```javascript
// Pattern for all external API services
async function getData() {
  try {
    // Tier 1: Real data from external API
    const health = await checkServiceHealth()
    if (!health.connected) {
      return {
        success: false,
        error: 'NOT_CONNECTED',
        setupRequired: true
      }
    }

    const realData = await fetchFromAPI()
    return {
      success: true,
      data: realData,
      dataSource: 'real',
      timestamp: new Date()
    }
  } catch (error) {
    // Tier 2: Return error (NOT mock data)
    return {
      success: false,
      error: error.message,
      setupRequired: error.code === 'AUTH_FAILED'
    }
  }
  // NEVER Tier 3: No fallback to mock data
}
```

---

### 2.3 Database Design

**Technology**: PostgreSQL with Prisma ORM, pgvector extension

#### Core Models (73+ total)
- **Users**: Authentication, roles, preferences
- **Products**: 9 SKUs (3 products × 3 regions)
- **Jobs**: Manufacturing jobs, resources, capacity
- **Financial**: AR/AP, cash flow, working capital
- **Inventory**: Stock levels, warehouses, movements
- **Orders**: Multi-channel orders (Amazon, Shopify)
- **Forecasts**: Demand predictions, accuracy tracking

#### Key Relationships
```
User ─┬─ Dashboard Layouts
      └─ Preferences

Product ─┬─ Jobs (manufacturing)
         ├─ Inventory (stock levels)
         └─ Forecasts (demand predictions)

Order ─┬─ Products (line items)
       └─ Channels (Amazon UK/USA, Shopify UK/EU/USA)

Financial ─┬─ Accounts Receivable
           └─ Accounts Payable
```

---

## 3. Data Flow Diagrams

### 3.1 Dashboard Load Flow (With Real Data)

```
User Requests Dashboard
      │
      ▼
React Component Loads
      │
      ├─► TanStack Query: useQuery('working-capital')
      │        │
      │        ▼
      │   GET /api/working-capital
      │        │
      │        ▼
      │   Dashboard API Handler
      │        │
      │        ├─► xeroService.getWorkingCapital()
      │        │        │
      │        │        ├─► Check OAuth token validity
      │        │        ├─► Fetch AR/AP from Xero API
      │        │        └─► Transform to dashboard format
      │        │
      │        ├─► Calculate DSO/DPO/DIO
      │        └─► Return { success, data, dataSource: 'real' }
      │
      └─► Render Dashboard
           │
           ├─► If success: Show real data
           ├─► If NOT_CONNECTED: Show XeroSetupPrompt
           └─► If error: Show error message + retry
```

### 3.2 Real-time Update Flow (SSE)

```
Backend Event Occurs (new order, inventory change)
      │
      ▼
SSE Stream: broadcastEvent({ type: 'inventory_update', sku: 'GABA-RED-UK' })
      │
      ▼
Frontend SSE Listener receives event
      │
      ▼
Query Client: invalidateQueries(['inventory'])
      │
      ▼
React Component re-fetches inventory data
      │
      ▼
UI updates automatically (no page refresh)
```

---

## 4. Integration Architecture

### 4.1 External API Integration Pattern

**All integrations follow this pattern**:

1. **Health Check** - Before data fetch, check connection status
2. **OAuth/Auth** - Manage authentication tokens
3. **Data Fetch** - Retrieve data with pagination
4. **Transform** - Convert to dashboard format
5. **Error Handling** - Return 503 with setup instructions if unavailable
6. **Rate Limiting** - Respect API limits, handle 429 responses

### 4.2 Xero Integration (COMPLETE ✅)

**OAuth Flow**:
```
User clicks "Connect Xero"
  → Redirect to Xero OAuth
  → User authorizes app
  → Redirect back with auth code
  → Exchange code for access/refresh tokens
  → Store tokens securely
  → Fetch financial data
```

**Key Endpoints**:
- `/api/xero/connect` - Initiate OAuth
- `/api/xero/callback` - Handle OAuth callback
- `/api/xero/financial-data` - Get P&L, AR, AP
- `/api/xero/working-capital` - Get DSO/DPO/DIO data

### 4.3 Shopify Multi-Store Integration (NEXT)

**Multi-Store Pattern**:
```javascript
const stores = [
  { region: 'UK', url: 'uk-store.myshopify.com' },
  { region: 'EU', url: 'eu-store.myshopify.com' },
  { region: 'USA', url: 'usa-store.myshopify.com' }
]

// Fetch from all stores in parallel
const allOrders = await Promise.all(
  stores.map(store => shopifyService.getOrders(store))
)

// Calculate 2.9% commission per store
const withCommission = allOrders.map(orders => ({
  ...orders,
  netRevenue: orders.gross * 0.971 // 100% - 2.9%
}))
```

### 4.4 Amazon SP-API Integration (PENDING)

**Complexity**: High (complex auth, strict rate limits)

**Marketplace IDs**:
- UK: A1F83G8C2ARO7P
- USA: ATVPDKIKX0DER

**Rate Limits**:
- Orders API: 0.0167 requests/second (1 per minute)
- Inventory API: 0.0167 requests/second

**Strategy**: Cache aggressively, batch requests, respect rate limits

### 4.5 Unleashed ERP Integration (40% COMPLETE)

**Status**: Service classes implemented, needs API configuration

**Data Sync**:
- Manufacturing jobs (pending/in_progress/completed)
- Inventory levels (real-time stock)
- Production schedules
- Quality control metrics

---

## 5. Security Architecture

### 5.1 Authentication & Authorization

**Provider**: Clerk
**Roles**: Admin, Manager, Operator, Viewer
**Permissions**: 20+ granular permissions (e.g., `financial:read`, `inventory:write`)

**RBAC Pattern**:
```javascript
// Middleware enforces permissions
app.get('/api/financial', requirePermission('financial:read'), handler)

// Frontend hides unauthorized UI
{hasPermission('financial:write') && <EditButton />}
```

### 5.2 API Security

- **Authentication**: All `/api/*` endpoints require Clerk JWT
- **Rate Limiting**: 100 requests/minute per user
- **Input Validation**: Zod schemas for all request bodies
- **SQL Injection**: Prisma ORM prevents SQL injection
- **XSS**: React auto-escapes, CSP headers configured
- **CSRF**: SameSite cookies, CSRF tokens for mutations

### 5.3 Data Security

- **Encryption at Rest**: PostgreSQL encryption
- **Encryption in Transit**: HTTPS/TLS for all connections
- **Environment Variables**: Sensitive data in Render env vars (never committed)
- **OAuth Tokens**: Stored encrypted in database
- **Audit Logging**: All mutations logged with user, timestamp, changes

---

## 6. Deployment Architecture

### 6.1 Render Infrastructure (IMPLEMENTED ✅)

**Environments**:
- **Development**: https://capliquify-frontend-prod.onrender.com
  - Branch: `development`
  - Auto-deploy on push
  - Uses dev database, relaxed security

- **Testing**: https://sentia-manufacturing-dashboard-test.onrender.com
  - Branch: `test`
  - Auto-deploy on push
  - UAT environment, production-like

- **Production**: https://sentia-manufacturing-dashboard-production.onrender.com
  - Branch: `production`
  - Auto-deploy on push (after approval)
  - Full security, monitoring, backups

**Database**: Render PostgreSQL with pgvector
- Automated daily backups
- Point-in-time recovery
- Connection pooling
- SSL enforced

**Redis**: Queue and cache management
- BullMQ queues (import/export jobs)
- Session storage
- SSE connection management

### 6.2 CI/CD Pipeline

```
Developer pushes to `development` branch
      │
      ▼
GitHub detects push
      │
      ▼
Render triggers build
      │
      ├─► Install dependencies (pnpm install)
      ├─► Build frontend (vite build)
      ├─► Run database migrations (prisma migrate deploy)
      └─► Start server (node server.js)
      │
      ▼
Health check passes (/health endpoint returns 200)
      │
      ▼
Deployment complete - New version live
```

---

## 7. Error Handling Strategy (CRITICAL for EPIC-002)

### 7.1 Error Response Format

**Standard Error Response**:
```javascript
{
  success: false,
  error: 'SERVICE_UNAVAILABLE',
  message: 'Unable to connect to Xero. Please check your integration.',
  code: 503,
  setupRequired: true,  // Triggers setup prompt in UI
  retryAfter: 60        // Seconds until retry
}
```

### 7.2 Error Hierarchy

1. **503 Service Unavailable** - External API not connected/down
2. **401 Unauthorized** - Authentication failed (re-auth required)
3. **429 Too Many Requests** - Rate limit hit (retry with backoff)
4. **500 Internal Server Error** - Unexpected server error
5. **400 Bad Request** - Invalid input data

### 7.3 Frontend Error Handling

```javascript
// Query with error handling
const { data, error, isLoading } = useQuery({
  queryKey: ['working-capital'],
  queryFn: fetchWorkingCapital,
  retry: (failureCount, error) => {
    // Don't retry 503 (setup required)
    if (error.code === 503 && error.setupRequired) return false
    // Retry 500/502 errors up to 3 times
    return failureCount < 3
  }
})

// Render logic
if (isLoading) return <Skeleton />
if (error?.setupRequired) return <XeroSetupPrompt />
if (error) return <ErrorMessage error={error} onRetry={refetch} />
return <DataVisualization data={data} />
```

---

## 8. Testing Strategy

### 8.1 Test Pyramid

```
        ┌─────────────┐
        │   E2E (5%)  │  ← Critical user workflows
        ├─────────────┤
        │Integration  │  ← API endpoints, service integration
        │   (15%)     │
        ├─────────────┤
        │  Unit Tests │  ← Service logic, utilities
        │   (80%)     │
        └─────────────┘
```

### 8.2 Unit Testing (Vitest)

**Target**: 90%+ coverage

**What to Test**:
- Service layer logic (xeroService, shopifyService)
- Utility functions (calculations, transformations)
- React hooks (useSSE, useAuthRole)
- Data transformations

**Example**:
```javascript
// xeroService.test.js
describe('xeroService.getWorkingCapital', () => {
  it('returns real data when Xero connected', async () => {
    mockXeroAPI.mockResolvedValue({ ar: 100000, ap: 50000 })
    const result = await xeroService.getWorkingCapital()
    expect(result.success).toBe(true)
    expect(result.dataSource).toBe('real')
  })

  it('returns 503 when Xero not connected', async () => {
    mockXeroAPI.mockRejectedValue({ code: 'NOT_CONNECTED' })
    const result = await xeroService.getWorkingCapital()
    expect(result.success).toBe(false)
    expect(result.setupRequired).toBe(true)
  })
})
```

### 8.3 Integration Testing

**What to Test**:
- API endpoints with real database
- External API mocks (Xero, Shopify, Amazon)
- Database migrations
- Queue job processing

### 8.4 E2E Testing (Playwright)

**Critical Flows**:
1. User login → Dashboard load → See real data
2. Connect Xero → OAuth flow → Financial data appears
3. Working capital page → Calculations accurate → Recommendations shown
4. Demand forecast → Chart renders → Confidence intervals visible

### 8.5 Architecture Validation (testarch-automate)

**Automated Checks** (from BMM testarch workflow):
- ✅ No `Math.random()` in production code
- ✅ No hardcoded fallback data
- ✅ All API calls have error handling
- ✅ All services have TypeScript/JSDoc
- ✅ External integrations have fallback logic

---

## 9. Performance Optimization

### 9.1 Frontend Performance

**Techniques**:
- Code splitting (React.lazy for routes)
- Image optimization (WebP, lazy loading)
- Memoization (useMemo, React.memo)
- Virtual scrolling (for large lists)
- Service worker (offline capability)

**Metrics**:
- First Contentful Paint: <1s
- Time to Interactive: <3s
- Largest Contentful Paint: <2.5s

### 9.2 Backend Performance

**Techniques**:
- Database query optimization (indexes, joins)
- Caching (Redis for frequent queries)
- Parallel API calls (Promise.all)
- Connection pooling (Prisma)
- Response compression (gzip)

**Metrics**:
- API response time: <2s (avg)
- Database query time: <1s (avg)
- SSE latency: <5s (updates)

### 9.3 Database Optimization

**Indexes**:
```sql
-- Critical indexes for performance
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_products_region ON products(region);
```

---

## 10. Monitoring & Observability

### 10.1 Application Monitoring

**Tools**: Render APM, Custom logging

**Metrics Tracked**:
- Request count, response time, error rate
- Database connection pool usage
- Queue job success/failure rate
- SSE connection count

### 10.2 Business Metrics

**Dashboard**:
- API integration health (Xero, Shopify, Amazon, Unleashed)
- Data freshness (last sync time per service)
- User adoption (active users, session duration)
- Feature usage (which widgets most viewed)

### 10.3 Alerting

**Critical Alerts**:
- API error rate >5% for 5 minutes
- Database connections >80% of pool
- Queue job failures >10 in 1 hour
- SSE connections drop suddenly

---

## Conclusion

This solution architecture provides a robust foundation for the CapLiquify Platform AI Dashboard transformation from prototype to production. The three-tier fallback strategy ensures data integrity, the service layer pattern enables clean external API integration, and the comprehensive testing strategy ensures production readiness.

**Key Architectural Principles**:
1. **No Mock Data**: Real data or explicit error states, never fake data
2. **Service Layer Isolation**: Clean separation of concerns
3. **Error-First Design**: Every integration handles failures gracefully
4. **Real-time Capable**: SSE architecture for live updates
5. **Production-Ready**: Security, monitoring, deployment automation

**Next Action**: Create technical specification for EPIC-002 (Eliminate Mock Data)

---

**Document Status**: ✅ COMPLETE
**Framework**: BMAD-METHOD v6a Phase 3 (Solutioning)
**Generated**: 2025-10-19
**Maintained By**: Development Team
