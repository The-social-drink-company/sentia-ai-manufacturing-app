# BMAD Story: Unit Tests for Xero Service

**Story ID**: BMAD-TEST-002
**Epic**: EPIC-004 (Test Coverage Enhancement)
**Priority**: HIGH
**Status**: ⏳ Ready for Implementation
**Estimated**: 2h BMAD velocity
**Created**: 2025-10-23
**Framework**: BMAD-METHOD v6-alpha

---

## User Story

**As a** developer
**I want** comprehensive unit tests for the Xero service
**So that** I can ensure the financial data integration works correctly and catch regressions

---

## Business Value

**Priority Justification**: HIGH - Xero is currently a 7-line stub returning empty arrays

**Impact**:
- **Integration Reality**: Xero is marked as operational but is actually not implemented
- **Data Integrity**: Critical for working capital calculations
- **Trust**: Financial data accuracy is paramount for manufacturing clients
- **Compliance**: Audit trail for financial data handling

**ROI**: 2 hours to implement tests that ensure financial data accuracy

---

## Acceptance Criteria

### Functional Requirements

**1. Service Implementation Tests**
- [ ] Test that service is properly initialized
- [ ] Test that methods exist (getWorkingCapital, getAccounts, etc.)
- [ ] Test that methods return expected data structure
- [ ] Test error handling for missing configuration
- [ ] Coverage: >90% for xero.js

**2. OAuth Flow Tests**
- [ ] Test OAuth URL generation
- [ ] Test callback handling with valid code
- [ ] Test callback handling with error
- [ ] Test token refresh logic
- [ ] Test token expiration handling

**3. API Method Tests**
- [ ] Test getWorkingCapital() returns receivables/payables structure
- [ ] Test getAccounts() returns account list
- [ ] Test getInvoices() returns invoice data
- [ ] Test error handling for 401, 429, 500 responses
- [ ] Test network timeout handling

**4. Data Transformation Tests**
- [ ] Test financial data normalization
- [ ] Test currency conversion (if applicable)
- [ ] Test date formatting
- [ ] Test handling of null/undefined values

### Non-Functional Requirements

- [ ] All tests must use mocking (no real API calls)
- [ ] Tests must run in <5 seconds
- [ ] Clear test descriptions
- [ ] Follow existing test patterns

---

## Technical Context

**Current State**:
```javascript
// services/xero.js - STUB ONLY (7 lines)
class XeroService {
  async getWorkingCapital() {
    return []  // NOT IMPLEMENTED
  }
}
```

**Required Implementation**:
1. Either implement full Xero service OR
2. Update documentation to reflect stub status
3. Return proper 503 errors instead of empty arrays

---

## Implementation Plan

### Step 1: Assess Current Implementation
- Check if xero.js is actually 7 lines
- Determine if OAuth setup exists
- Check for environment variables

### Step 2: Create Test File
- Create `tests/services/xeroService.test.js`
- Import necessary testing utilities
- Set up test structure

### Step 3: Write Tests
- Start with initialization tests
- Add method existence tests
- Implement mock-based API tests
- Add error handling tests

### Step 4: Handle Implementation Gap
- If service is stub, write tests for expected behavior
- Document that implementation is pending
- Ensure tests will pass when service is implemented

---

## Definition of Done

- [ ] Test file created at `tests/services/xeroService.test.js`
- [ ] All acceptance criteria tests written
- [ ] Tests pass (or skip if implementation pending)
- [ ] Coverage >90% for implemented code
- [ ] No console warnings or errors
- [ ] Tests run in <5 seconds

---

## Dependencies

- Jest testing framework
- Mocking utilities
- Test data fixtures

---

## Notes

- Xero is listed as operational in docs but is actually a stub
- This is a critical gap in the "zero mock data" claim
- Tests should be written to expected API contract
- Implementation can follow once tests define the contract