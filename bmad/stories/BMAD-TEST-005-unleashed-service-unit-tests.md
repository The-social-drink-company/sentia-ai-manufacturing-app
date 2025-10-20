# BMAD Story: Unit Tests for Unleashed ERP Service

**Story ID**: BMAD-TEST-005
**Epic**: EPIC-004 (Test Coverage Enhancement)
**Priority**: HIGH
**Status**: ⏳ Ready for Implementation
**Estimated**: 2h BMAD velocity
**Created**: 2025-10-23
**Framework**: BMAD-METHOD v6-alpha

---

## User Story

**As a** developer
**I want** comprehensive unit tests for the Unleashed ERP service
**So that** I can ensure manufacturing data sync and production monitoring work correctly with HMAC authentication

---

## Business Value

**Priority Justification**: HIGH - Unleashed ERP is marked as fully operational (587 lines)

**Impact**:
- **Production Monitoring**: Real-time assembly job tracking critical for manufacturing
- **Quality Control**: Yield calculations detect production issues
- **Inventory Management**: Stock levels affect production planning
- **Resource Utilization**: Capacity planning based on active jobs

**ROI**: 2 hours to ensure manufacturing ERP integration reliability

---

## Acceptance Criteria

### Functional Requirements

**1. Authentication Tests**
- [ ] Test HMAC-SHA256 signature generation
- [ ] Test API header configuration (api-auth-id, api-auth-signature)
- [ ] Test query string extraction for signature
- [ ] Test connection initialization with Currencies endpoint
- [ ] Coverage: >90% for authentication flow

**2. Production Data Sync Tests**
- [ ] Test syncProductionData() with AssemblyJobs
- [ ] Test job status filtering (InProgress/Planned/Completed)
- [ ] Test quality score calculation (95% yield threshold)
- [ ] Test utilization rate calculation (4 concurrent capacity)
- [ ] Test quality alert generation

**3. Inventory Sync Tests**
- [ ] Test syncInventoryData() with StockOnHand
- [ ] Test low stock detection (< MinStockLevel)
- [ ] Test zero stock item tracking
- [ ] Test total value calculations
- [ ] Test low-stock alert generation

**4. Sales/Purchase Order Tests**
- [ ] Test syncSalesOrderData() with 30-day window
- [ ] Test order status tracking (Placed/Completed)
- [ ] Test syncPurchaseOrderData()
- [ ] Test order metrics aggregation
- [ ] Test date filtering logic

**5. Resource Utilization Tests**
- [ ] Test resource metrics from AssemblyJobs
- [ ] Test capacity calculations (4 production lines)
- [ ] Test utilization percentage calculations
- [ ] Test active vs planned job tracking

**6. Data Consolidation Tests**
- [ ] Test consolidateManufacturingData()
- [ ] Test cache integration with Redis
- [ ] Test SSE event emissions
- [ ] Test error recovery with fallback data

**7. Background Sync Tests**
- [ ] Test 15-minute interval scheduling
- [ ] Test syncAllData() orchestration
- [ ] Test SSE event broadcasts
- [ ] Test cache updates
- [ ] Test error handling during sync

### Non-Functional Requirements

- [ ] All tests must use mocking (no real API calls)
- [ ] Tests must run in <5 seconds
- [ ] Clear test descriptions
- [ ] Follow existing test patterns

---

## Technical Context

**Current Implementation**:
```javascript
// services/unleashed-erp.js (587 lines)
- HMAC-SHA256 authentication
- Assembly job tracking
- Stock level monitoring
- 15-minute background scheduler
- Redis caching layer
- SSE event broadcasting
- Quality alert detection (<95% yield)
```

**Test Coverage Needed**:
- HMAC authentication and signature generation
- Production data sync and metrics
- Inventory management and alerts
- Order processing (sales/purchase)
- Resource utilization calculations
- Data consolidation and caching
- Background sync orchestration

---

## Implementation Plan

### Step 1: Create Test Structure
- Create `tests/services/unleashedService.test.js`
- Set up test suites for each functional area
- Mock axios for API calls
- Mock Redis and SSE services

### Step 2: Write Authentication Tests
- Test HMAC-SHA256 signature generation
- Test header configuration
- Mock Currencies endpoint for connection test

### Step 3: Write Production Tests
- Mock AssemblyJobs API responses
- Test quality score calculations
- Test utilization metrics
- Verify quality alert detection

### Step 4: Write Inventory Tests
- Mock StockOnHand API responses
- Test low stock detection logic
- Test inventory value calculations
- Verify alert generation

### Step 5: Write Order Processing Tests
- Mock SalesOrders and PurchaseOrders
- Test date filtering
- Test order metrics aggregation

### Step 6: Write Consolidation Tests
- Test data consolidation logic
- Test cache integration
- Verify SSE event emissions
- Test error scenarios

---

## Definition of Done

- [ ] Test file created at `tests/services/unleashedService.test.js`
- [ ] All acceptance criteria tests written
- [ ] All tests passing
- [ ] Coverage >90% for unleashed-erp.js
- [ ] No console warnings or errors
- [ ] Tests run in <5 seconds
- [ ] Quality calculations properly tested

---

## Dependencies

- Jest testing framework
- Mocking utilities for axios
- Test fixtures for jobs/inventory/orders
- Mock Redis client
- Mock SSE service

---

## Notes

- Unleashed ERP is one of the fully operational integrations
- 587 lines of implementation need comprehensive testing
- Focus on HMAC authentication complexity
- Quality control logic (95% yield) is business-critical
- This service handles real manufacturing data - tests must be thorough