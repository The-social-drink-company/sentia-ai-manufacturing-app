# BMAD Story: Admin Approval Service & MFA Verification

**Story ID**: BMAD-ADMIN-002
**Epic**: Admin Portal Backend (BMAD-ADMIN-EPIC)
**Status**: 🟡 IN PROGRESS
**Created**: October 19, 2025
**Framework**: BMAD-METHOD v6a
**Estimated Effort**: 20 hours
**Actual Effort**: TBD

---

## User Story

**As an** administrator
**I want** an approval workflow with MFA verification
**So that** sensitive operations require explicit authorization and cannot be performed without multi-factor authentication

---

## Business Context

The admin portal frontend is complete with 44 API endpoints defined in `src/services/api/adminApi.js`, but the backend currently returns 501 stubs. This story implements the foundational approval workflow that will be used by feature flags, environment config, and other sensitive operations.

**Problem**:
- Production feature flag toggles have no approval mechanism
- Sensitive operations (user deletion, integration config changes) lack MFA protection
- No audit trail for approval decisions
- Manual approval processes are slow and error-prone

**Solution**:
- Automated approval workflow with state machine (PENDING → MFA_REQUIRED → APPROVED/REJECTED)
- MFA verification via Clerk or custom TOTP
- BullMQ queue for async execution of approved actions
- Complete audit trail via AdminApproval and AdminApprovalHistory models

**Business Value**:
- **Security**: MFA enforcement prevents unauthorized changes
- **Compliance**: Audit trail for SOC 2 / ISO 27001
- **Efficiency**: Automated execution reduces manual work
- **Risk Mitigation**: Approval workflow prevents accidental production changes

---

## Acceptance Criteria

### Functional Requirements

**✅ Approval Service**:
1. Create approval request with type, category, priority, title, description
2. State machine transitions: PENDING → MFA_REQUIRED → APPROVED → COMPLETED
3. Auto-approval for low-risk requests (amount < £10,000, low risk category)
4. Rejection workflow with reason capture
5. Expiration handling (auto-expire requests after expiresAt timestamp)
6. Execution tracking (executedAt, executionResult, executionError)

**✅ MFA Verification**:
1. Request MFA code (email, SMS, or TOTP)
2. Verify MFA code with rate limiting (max 3 attempts per 5 minutes)
3. Return verification token on success
4. Integrate with Clerk MFA (primary) or fallback to custom TOTP

**✅ BullMQ Approval Queue**:
1. Process approved requests asynchronously
2. Retry logic (3 attempts with exponential backoff: 30s, 2min, 10min)
3. Update AdminApproval status (COMPLETED/FAILED)
4. Store execution results and errors
5. Emit events for real-time UI updates

**✅ Approval Controller**:
1. `GET /admin/approvals` - List approvals with filters (status, requester, type)
2. `POST /admin/approvals` - Create new approval request
3. `POST /admin/approvals/:id/approve` - Approve request (requires MFA)
4. `POST /admin/approvals/:id/reject` - Reject request (requires MFA)
5. `GET /admin/approvals/history` - Query approval history

**✅ MFA Controller**:
1. `POST /admin/mfa/request` - Request MFA code for specific action
2. `POST /admin/mfa/verify` - Verify MFA code

### Non-Functional Requirements

**Performance**:
- Approval list query < 300ms
- MFA code delivery < 3 seconds
- Approval execution via BullMQ < 10 seconds (p95)

**Security**:
- All approval operations require admin role (requireAdmin middleware)
- Approve/reject operations require MFA verification
- MFA codes expire after 5 minutes
- Rate limiting: 3 MFA attempts per 5 minutes per user

**Reliability**:
- BullMQ retry logic handles transient failures
- Failed approvals stored with error details for manual intervention
- Expired approvals auto-transitioned to EXPIRED status

**Testing**:
- Unit test coverage: 80%+ for ApprovalService
- Integration tests for approval workflow (create → approve → execute)
- MFA verification tests (success, failure, rate limiting)

---

## Technical Design

### 1. ApprovalService Architecture

```javascript
// server/services/admin/ApprovalService.js
import prisma from '../../lib/prisma.js'
import logger from '../../utils/logger.js'
import { approvalQueue } from '../../queues/approvalQueue.js'

class ApprovalService {
  // State machine transitions
  async createApprovalRequest({ type, category, priority, title, description, requestedChanges, rationale, requesterId })
  async transitionToMfaRequired(approvalId)
  async approve(approvalId, approverId, mfaVerified)
  async reject(approvalId, rejectorId, reason, mfaVerified)
  async execute(approvalId) // Enqueue to BullMQ
  async markCompleted(approvalId, result)
  async markFailed(approvalId, error)
  async expireOldRequests() // Cron job to auto-expire

  // Query methods
  async getApprovalRequests(filters)
  async getApprovalById(approvalId)
  async getApprovalHistory(approvalId)

  // Auto-approval logic
  async evaluateAutoApproval(request) // Returns true if auto-approved
  calculateRiskScore(request) // Returns 0-1 risk score
}
```

### 2. MfaService Architecture

```javascript
// server/services/admin/MfaService.js
import { Clerk } from '@clerk/clerk-sdk-node'
import speakeasy from 'speakeasy' // Fallback TOTP
import logger from '../../utils/logger.js'

class MfaService {
  async requestMFACode(userId, action, method = 'email')
  async verifyMFACode(userId, code)
  async checkRateLimit(userId) // Max 3 attempts per 5 min
  async generateTOTP(userId) // Fallback if Clerk MFA unavailable
  async verifyTOTP(userId, code)
}
```

### 3. BullMQ Approval Queue

```javascript
// server/queues/approvalQueue.js
import Queue from 'bullmq'
import { ApprovalService } from '../services/admin/ApprovalService.js'

export const approvalQueue = new Queue('admin:approvals', {
  connection: { host: 'localhost', port: 6379 },
})

// Worker
approvalQueue.process(async (job) => {
  const { approvalId, requestedChanges } = job.data

  try {
    // Execute the approved action
    const result = await executeApprovedAction(requestedChanges)

    // Mark approval as completed
    await ApprovalService.markCompleted(approvalId, result)

    return result
  } catch (error) {
    // Mark approval as failed
    await ApprovalService.markFailed(approvalId, error.message)
    throw error // BullMQ will retry
  }
})
```

### 4. State Machine Flow

```
┌─────────┐
│ PENDING │ ◄──────────────────────┐
└─────────┘                        │
     │                             │
     │ requiresApproval()          │ autoApprove()
     │                             │
     ▼                             │
┌──────────────┐                   │
│ MFA_REQUIRED │                   │
└──────────────┘                   │
     │      │                      │
     │      │                      │
     │      ▼                      ▼
     │  ┌──────────┐        ┌──────────┐
     │  │ REJECTED │        │ APPROVED │
     │  └──────────┘        └──────────┘
     │                            │
     │ approve(mfaVerified)       │ execute()
     └────────────────────────────┤
                                  ▼
                            ┌───────────┐
                            │ COMPLETED │
                            └───────────┘
                                  │
                                  │ error
                                  ▼
                            ┌─────────┐
                            │ FAILED  │
                            └─────────┘
                                  │
                                  │ retry (BullMQ)
                                  └─────────┐
                                            │
                            ┌───────────────┘
                            │
                            ▼
                      (retry 3 times)
```

### 5. Database Schema (Already Created)

```prisma
model AdminApproval {
  id                String   @id @default(uuid())
  requesterId       String
  requester         User     @relation("ApprovalRequester")

  type              String   // CONFIG_CHANGE, FEATURE_FLAG, INTEGRATION_SYNC
  category          String   // SECURITY, OPERATIONAL, CONFIGURATION
  priority          String   // LOW, MEDIUM, HIGH, CRITICAL

  title             String
  description       String
  requestedChanges  Json
  rationale         String?

  status            String   @default("PENDING")
  approvedBy        String?
  approver          User?    @relation("ApprovalApprover")
  approvedAt        DateTime?
  rejectedBy        String?
  rejector          User?    @relation("ApprovalRejector")
  rejectedAt        DateTime?
  rejectionReason   String?

  mfaRequired       Boolean  @default(true)
  mfaVerifiedAt     DateTime?
  mfaMethod         String?

  executedAt        DateTime?
  executionResult   Json?
  executionError    String?

  expiresAt         DateTime
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  history           AdminApprovalHistory[]

  @@map("admin_approvals")
}

model AdminApprovalHistory {
  id         String   @id @default(uuid())
  approvalId String
  approval   AdminApproval @relation(fields: [approvalId])

  fromStatus String
  toStatus   String
  changedBy  String
  changedAt  DateTime @default(now())

  comment    String?
  metadata   Json?

  @@map("admin_approval_history")
}
```

---

## Implementation Tasks

### Task 1: ApprovalService (6 hours)
- [ ] Create `server/services/admin/ApprovalService.js`
- [ ] Implement state machine methods (create, approve, reject, execute)
- [ ] Implement auto-approval logic (risk scoring)
- [ ] Implement query methods (list, getById, getHistory)
- [ ] Implement expiration handling (cron job)
- [ ] Add comprehensive logging

### Task 2: MfaService (4 hours)
- [ ] Create `server/services/admin/MfaService.js`
- [ ] Research Clerk MFA capabilities
- [ ] Implement Clerk MFA integration (primary)
- [ ] Implement TOTP fallback with speakeasy
- [ ] Implement rate limiting (Redis-backed)
- [ ] Add MFA code expiration (5 minutes)

### Task 3: BullMQ Approval Queue (3 hours)
- [ ] Create `server/queues/approvalQueue.js`
- [ ] Configure queue with Redis connection
- [ ] Implement worker for approval execution
- [ ] Add retry logic (3 attempts, exponential backoff)
- [ ] Emit events for real-time UI updates
- [ ] Add queue health monitoring

### Task 4: Approval Controller (4 hours)
- [ ] Update `server/controllers/admin/approvalsController.js`
- [ ] Implement `getApprovalRequests()` - List with filters
- [ ] Implement `createApprovalRequest()` - Create new
- [ ] Implement `approveRequest()` - Approve with MFA check
- [ ] Implement `rejectRequest()` - Reject with reason
- [ ] Implement `getApprovalHistory()` - Query history
- [ ] Add error handling and validation

### Task 5: MFA Controller (2 hours)
- [ ] Create `server/controllers/admin/mfaController.js`
- [ ] Implement `requestMFACode()` - Send code
- [ ] Implement `verifyMFACode()` - Validate code
- [ ] Add rate limiting middleware
- [ ] Add error handling

### Task 6: Routes (1 hour)
- [ ] Update `server/routes/admin/index.js`
- [ ] Add approval routes (5 endpoints)
- [ ] Add MFA routes (2 endpoints)
- [ ] Apply middleware (requireAdmin, requireMfa, audit)

### Task 7: Testing (5 hours)
- [ ] Create `tests/unit/services/admin/ApprovalService.test.js`
- [ ] Test state machine transitions
- [ ] Test auto-approval logic
- [ ] Test MFA verification
- [ ] Create integration test for full workflow
- [ ] Achieve 80%+ coverage

---

## Test Cases

### Unit Tests: ApprovalService

```javascript
describe('ApprovalService', () => {
  describe('createApprovalRequest', () => {
    it('creates request with PENDING status', async () => {})
    it('calculates expiration (24 hours from now)', async () => {})
    it('creates approval history entry', async () => {})
  })

  describe('approve', () => {
    it('requires MFA verification', async () => {})
    it('transitions from PENDING to APPROVED', async () => {})
    it('enqueues to BullMQ for execution', async () => {})
    it('creates history entry', async () => {})
  })

  describe('reject', () => {
    it('requires rejection reason', async () => {})
    it('transitions from PENDING to REJECTED', async () => {})
    it('creates history entry', async () => {})
  })

  describe('evaluateAutoApproval', () => {
    it('auto-approves low-risk requests under £10,000', async () => {})
    it('requires approval for high-risk requests', async () => {})
    it('requires approval for amounts over £10,000', async () => {})
  })

  describe('expireOldRequests', () => {
    it('expires requests past expiresAt timestamp', async () => {})
    it('does not expire completed/rejected requests', async () => {})
  })
})
```

### Integration Tests: Approval Workflow

```javascript
describe('Approval Workflow Integration', () => {
  it('completes full approval flow', async () => {
    // 1. Create approval request
    const approval = await createApprovalRequest({ type: 'FEATURE_FLAG', ... })
    expect(approval.status).toBe('PENDING')

    // 2. Request MFA code
    await requestMFACode(userId, 'APPROVE_REQUEST')

    // 3. Verify MFA code
    const verified = await verifyMFACode(userId, '123456')
    expect(verified).toBe(true)

    // 4. Approve request
    const approved = await approve(approval.id, userId, verified)
    expect(approved.status).toBe('APPROVED')

    // 5. Wait for BullMQ execution
    await delay(2000)

    // 6. Verify execution
    const executed = await getApprovalById(approval.id)
    expect(executed.status).toBe('COMPLETED')
    expect(executed.executedAt).toBeDefined()
  })
})
```

---

## Dependencies

### Internal
- ✅ Prisma AdminApproval and AdminApprovalHistory models
- ✅ Clerk authentication
- ⏳ BullMQ infrastructure (Redis)

### External
- `@clerk/clerk-sdk-node` - Clerk SDK for MFA
- `speakeasy` - TOTP library (fallback)
- `bullmq` - Queue library
- `ioredis` - Redis client

### Install Commands
```bash
pnpm add @clerk/clerk-sdk-node speakeasy bullmq ioredis
pnpm add -D @types/speakeasy
```

---

## Risks & Mitigation

**Risk 1**: Clerk MFA limitations
- **Mitigation**: Implement TOTP fallback with speakeasy

**Risk 2**: BullMQ execution failures
- **Mitigation**: Store error in executionError field, manual retry capability

**Risk 3**: MFA rate limiting abuse
- **Mitigation**: Redis-backed rate limiting (3 attempts per 5 min)

---

## Definition of Done

- [ ] ApprovalService implemented with state machine
- [ ] MfaService implemented with Clerk integration (or TOTP fallback)
- [ ] BullMQ approval queue operational
- [ ] All 7 endpoints functional (5 approval + 2 MFA)
- [ ] Vitest tests written with 80%+ coverage
- [ ] Manual testing completed
- [ ] Code reviewed
- [ ] Committed to development branch
- [ ] BMAD story documentation updated with learnings

---

## Next Story

**BMAD-ADMIN-003**: Feature Flags and Integration Management (Week 2)

---

**Story Created**: October 19, 2025
**Framework**: BMAD-METHOD v6a
**Status**: 🟡 IN PROGRESS (0% complete)
