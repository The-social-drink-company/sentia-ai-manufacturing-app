# BMAD Story: Unit Tests for Amazon SP-API Service

**Story ID**: BMAD-TEST-004
**Epic**: EPIC-004 (Test Coverage Enhancement)
**Priority**: HIGH
**Status**: ⏳ Ready for Implementation
**Estimated**: 2h BMAD velocity
**Created**: 2025-10-23
**Framework**: BMAD-METHOD v6-alpha

---

## User Story

**As a** developer
**I want** comprehensive unit tests for the Amazon SP-API service
**So that** I can ensure FBA inventory sync and order processing work correctly with AWS IAM authentication

---

## Business Value

**Priority Justification**: HIGH - Amazon SP-API is marked as fully operational (461 lines)

**Impact**:
- **FBA Inventory**: Critical for Amazon channel stock management
- **Order Processing**: Real-time order sync affects fulfillment
- **Multi-Marketplace**: US marketplace with expansion capability
- **Revenue Tracking**: Order metrics and financial calculations

**ROI**: 2 hours to ensure Amazon channel integration reliability

---

## Acceptance Criteria

### Functional Requirements

**1. Authentication Tests**
- [ ] Test OAuth 2.0 + AWS IAM configuration
- [ ] Test credential validation (refresh_token, lwa_app_id, lwa_client_secret, role_arn)
- [ ] Test connection initialization
- [ ] Test marketplace participation retrieval
- [ ] Coverage: >90% for authentication flow

**2. Inventory Sync Tests**
- [ ] Test syncInventoryData() with FBA inventory
- [ ] Test inventory data transformation
- [ ] Test ASIN/SKU/FNSKU mapping
- [ ] Test low stock detection (< 10 units)
- [ ] Test cache updates with Redis

**3. Order Sync Tests**
- [ ] Test syncOrderData() for 24-hour window
- [ ] Test order status filtering (Unshipped/PartiallyShipped/Shipped)
- [ ] Test order metrics calculations
- [ ] Test currency handling (USD)
- [ ] Test database upsert operations

**4. FBA Shipment Tests**
- [ ] Test syncFBAData() for inbound shipments
- [ ] Test shipment status tracking
- [ ] Test fulfillment center mapping
- [ ] Test shipment date handling
- [ ] Test label prep preferences

**5. Error Handling Tests**
- [ ] Test package import failure (amazon-sp-api not installed)
- [ ] Test invalid credentials (401)
- [ ] Test rate limiting (429)
- [ ] Test network timeouts
- [ ] Test API response errors

**6. Background Sync Tests**
- [ ] Test 15-minute interval scheduling
- [ ] Test performFullSync() orchestration
- [ ] Test SSE event emissions
- [ ] Test sync metrics reporting
- [ ] Test graceful failure handling

### Non-Functional Requirements

- [ ] All tests must use mocking (no real API calls)
- [ ] Tests must run in <5 seconds
- [ ] Clear test descriptions
- [ ] Follow existing test patterns

---

## Technical Context

**Current Implementation**:
```javascript
// services/amazon-sp-api.js (461 lines)
- OAuth 2.0 + AWS IAM authentication
- FBA inventory management
- Order sync with metrics
- 15-minute background scheduler
- Redis caching layer
- SSE event broadcasting
```

**Test Coverage Needed**:
- Authentication and initialization
- Inventory sync and transformation
- Order processing and metrics
- FBA shipment tracking
- Error scenarios and fallbacks
- Background sync orchestration

---

## Implementation Plan

### Step 1: Create Test Structure
- Create `tests/services/amazonService.test.js`
- Set up test suites for each functional area
- Mock amazon-sp-api package
- Mock Redis and SSE services

### Step 2: Write Authentication Tests
- Test credential validation
- Test connection initialization
- Mock marketplace participation API

### Step 3: Write Inventory Management Tests
- Mock FBA inventory API responses
- Test inventory transformation logic
- Test low stock detection
- Verify cache updates

### Step 4: Write Order Processing Tests
- Mock order API responses
- Test 24-hour window filtering
- Test order metrics calculations
- Verify database operations

### Step 5: Write FBA Shipment Tests
- Mock shipment API responses
- Test shipment data processing
- Verify status tracking

### Step 6: Write Background Sync Tests
- Test scheduler initialization
- Test full sync orchestration
- Verify SSE event emissions
- Test error recovery

---

## Definition of Done

- [ ] Test file created at `tests/services/amazonService.test.js`
- [ ] All acceptance criteria tests written
- [ ] All tests passing
- [ ] Coverage >90% for amazon-sp-api.js
- [ ] No console warnings or errors
- [ ] Tests run in <5 seconds
- [ ] Rate limiting logic properly tested

---

## Dependencies

- Jest testing framework
- Mocking utilities for SP-API
- Test fixtures for inventory/orders/shipments
- Mock Redis client
- Mock SSE service

---

## Notes

- Amazon SP-API is one of the fully operational integrations
- 461 lines of implementation need comprehensive testing
- Focus on OAuth 2.0 + AWS IAM complexity
- 15-minute sync interval must be tested
- This service handles real inventory and orders - tests must be thorough