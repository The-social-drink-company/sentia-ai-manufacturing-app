# BMAD Story: Unit Tests for Shopify Multi-Store Service

**Story ID**: BMAD-TEST-003
**Epic**: EPIC-004 (Test Coverage Enhancement)
**Priority**: HIGH
**Status**: ⏳ Ready for Implementation
**Estimated**: 2h BMAD velocity
**Created**: 2025-10-23
**Framework**: BMAD-METHOD v6-alpha

---

## User Story

**As a** developer
**I want** comprehensive unit tests for the Shopify multi-store service
**So that** I can ensure order sync and inventory management work correctly across all stores

---

## Business Value

**Priority Justification**: HIGH - Shopify is marked as fully operational (486 lines)

**Impact**:
- **Revenue Accuracy**: 2.9% commission calculations must be exact
- **Multi-Store Complexity**: UK/EU/USA stores need separate handling
- **Inventory Sync**: Critical for stock management
- **Order Processing**: 500+ real transactions need reliable processing

**ROI**: 2 hours to ensure multi-store e-commerce integration reliability

---

## Acceptance Criteria

### Functional Requirements

**1. Multi-Store Configuration Tests**
- [ ] Test store initialization for UK/EU/USA
- [ ] Test API key configuration per store
- [ ] Test store URL formatting
- [ ] Test store selection logic
- [ ] Coverage: >90% for configuration

**2. Order Sync Tests**
- [ ] Test fetchOrders() for each store
- [ ] Test order data transformation
- [ ] Test commission calculation (2.9% accuracy)
- [ ] Test order status filtering
- [ ] Test pagination handling

**3. Inventory Management Tests**
- [ ] Test fetchInventoryLevels()
- [ ] Test inventory sync to database
- [ ] Test multi-location inventory
- [ ] Test stock level alerts
- [ ] Test SKU mapping

**4. Error Handling Tests**
- [ ] Test 401 unauthorized (invalid API key)
- [ ] Test 429 rate limiting
- [ ] Test 500 server errors
- [ ] Test network timeouts
- [ ] Test malformed response data

**5. Data Transformation Tests**
- [ ] Test order data normalization
- [ ] Test currency conversion (GBP/EUR/USD)
- [ ] Test date/time formatting
- [ ] Test commission calculations
- [ ] Test tax calculations

### Non-Functional Requirements

- [ ] All tests must use mocking (no real API calls)
- [ ] Tests must run in <5 seconds
- [ ] Clear test descriptions
- [ ] Follow existing test patterns

---

## Technical Context

**Current Implementation**:
```javascript
// services/shopify-multistore.js (486 lines)
- Full multi-store support
- Real-time order sync
- Commission tracking (2.9%)
- Live inventory sync
```

**Test Coverage Needed**:
- Store configuration and initialization
- Order fetching and transformation
- Inventory level management
- Commission calculations
- Error scenarios

---

## Implementation Plan

### Step 1: Create Test Structure
- Create `tests/services/shopifyService.test.js`
- Set up test suites for each functional area
- Import mocking utilities

### Step 2: Write Configuration Tests
- Test multi-store setup
- Test API key management
- Test store selection

### Step 3: Write Order Management Tests
- Mock order API responses
- Test order transformation
- Test commission calculations
- Verify accuracy to the penny

### Step 4: Write Inventory Tests
- Mock inventory API responses
- Test inventory sync logic
- Test multi-location handling

### Step 5: Write Error Handling Tests
- Test all error scenarios
- Verify graceful degradation
- Test retry logic

---

## Definition of Done

- [ ] Test file created at `tests/services/shopifyService.test.js`
- [ ] All acceptance criteria tests written
- [ ] All tests passing
- [ ] Coverage >90% for shopify-multistore.js
- [ ] No console warnings or errors
- [ ] Tests run in <5 seconds
- [ ] Commission calculations accurate to $0.01

---

## Dependencies

- Jest testing framework
- Mocking utilities for Shopify API
- Test fixtures for orders/inventory
- Multi-store test data

---

## Notes

- Shopify is one of the fully operational integrations
- 486 lines of implementation need comprehensive testing
- Focus on multi-store complexity
- Commission calculation accuracy is critical
- This service handles real money - tests must be thorough