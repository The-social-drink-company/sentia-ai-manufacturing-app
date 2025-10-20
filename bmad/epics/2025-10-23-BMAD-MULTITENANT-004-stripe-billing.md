# BMAD-MULTITENANT-004: Stripe Billing Integration

**Epic ID**: BMAD-MULTITENANT-004
**Phase**: 6 (Short-term) - Billing & Subscriptions
**Created**: 2025-10-23
**Status**: ⏳ IN PROGRESS
**BMAD Velocity**: 4x faster than traditional
**Estimated Time**: 8-10 hours (BMAD) vs 32-40 hours (traditional)

---

## Epic Overview

Implement comprehensive Stripe billing integration for CapLiquify multi-tenant SaaS, including subscription management, automated trial expiration, webhook handling, upgrade/downgrade flows, payment failure recovery, and customer portal.

**Parent Epic**: CAPLIQUIFY-TRANSFORMATION (Phase 6)
**Dependencies**:
- ✅ BMAD-MULTITENANT-001 (Database architecture)
- ✅ BMAD-MULTITENANT-002 (Middleware & RBAC)
- ✅ BMAD-MULTITENANT-003 (Integration & performance testing)

---

## Business Value

### Problem Statement

CapLiquify needs automated billing infrastructure to:
1. Convert trial users to paying customers (14-day free trial)
2. Handle subscription lifecycle (creation, upgrades, downgrades, cancellations)
3. Recover from payment failures (dunning management)
4. Provide self-service billing portal for customers
5. Ensure billing events sync with tenant status in real-time

### Success Criteria

1. **Subscription Management**: ✅ Create, upgrade, downgrade, cancel subscriptions via Stripe API
2. **Trial Automation**: ✅ Automatically suspend tenants after 14-day trial expires
3. **Webhook Processing**: ✅ Handle 10+ Stripe webhook events (invoice.paid, subscription.updated, etc.)
4. **Payment Recovery**: ✅ 3-attempt retry system with graceful degradation to read-only mode
5. **Customer Portal**: ✅ Self-service billing management (change plan, update payment method, view invoices)
6. **Data Sync**: ✅ 100% consistency between Stripe subscriptions and tenant records
7. **Testing Coverage**: ✅ 90%+ test coverage with Stripe mock library

### Key Metrics

- **Trial Conversion Rate**: Target 15-20% (industry standard for B2B SaaS)
- **Payment Success Rate**: Target >98% (industry standard)
- **Dunning Recovery**: Target 40-50% recovery of failed payments
- **Sync Accuracy**: 100% (zero billing/tenant mismatches)
- **Webhook Processing Time**: <2 seconds (p95)

---

## Technical Architecture

### Stripe Products & Pricing

**Subscription Tiers** (from BMAD-MULTITENANT-001):

| Tier | Monthly Price | Users | Entities | Features |
|------|---------------|-------|----------|----------|
| **Starter** | $29-49 | 5 | 500 | Basic forecasting, API integrations |
| **Professional** | $99-149 | 25 | 5,000 | AI forecasting, what-if analysis, priority support |
| **Enterprise** | $299-499 | 100 | Unlimited | Custom integrations, advanced reports, dedicated support |

**Trial Period**: 14 days (all tiers)
**Billing Cycle**: Monthly (annual option for 15% discount)

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Stripe Integration                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Stripe     │    │   Webhook    │    │   Billing    │ │
│  │   Products   │───▶│   Handler    │───▶│   Service    │ │
│  │   & Prices   │    │  (Express)   │    │   (Core)     │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                             │                      │        │
│                             ▼                      ▼        │
│                      ┌──────────────┐    ┌──────────────┐  │
│                      │   Database   │    │   Tenant     │  │
│                      │  Sync Logic  │◀───│  Middleware  │  │
│                      └──────────────┘    └──────────────┘  │
│                             │                               │
│                             ▼                               │
│                    ┌─────────────────┐                      │
│                    │  Prisma Models  │                      │
│                    │  - tenants      │                      │
│                    │  - subscriptions│                      │
│                    └─────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema Extensions

**Existing `tenants` table** (from BMAD-MULTITENANT-001):
```prisma
model Tenant {
  id                    String   @id @default(uuid())
  subscriptionTier      String   // 'starter' | 'professional' | 'enterprise'
  subscriptionStatus    String   // 'trial' | 'active' | 'past_due' | 'canceled' | 'suspended'
  trialEndsAt          DateTime?
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  // ... existing fields
}
```

**New `subscriptions` table** (from BMAD-MULTITENANT-001):
```prisma
model Subscription {
  id                 String   @id @default(uuid())
  tenantId          String   @unique
  tenant            Tenant   @relation(fields: [tenantId], references: [id])

  stripeCustomerId       String
  stripeSubscriptionId   String  @unique
  stripePriceId         String
  stripeProductId       String

  status            String   // 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd Boolean  @default(false)
  canceledAt        DateTime?
  trialStart        DateTime?
  trialEnd          DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("subscriptions")
}
```

**New `billing_events` table** (audit trail):
```prisma
model BillingEvent {
  id               String   @id @default(uuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])

  eventType       String   // 'invoice.paid', 'subscription.updated', etc.
  stripeEventId   String   @unique
  status          String   // 'processed' | 'failed' | 'pending'
  payload         Json
  errorMessage    String?

  processedAt     DateTime @default(now())

  @@map("billing_events")
}
```

### Stripe Webhook Events

**Critical Events** (must handle):
1. `customer.subscription.created` - New subscription created
2. `customer.subscription.updated` - Plan changed, status updated
3. `customer.subscription.deleted` - Subscription canceled
4. `customer.subscription.trial_will_end` - 3 days before trial ends (send email)
5. `invoice.paid` - Payment successful (activate/renew subscription)
6. `invoice.payment_failed` - Payment failed (dunning process)
7. `invoice.payment_action_required` - 3D Secure required
8. `customer.updated` - Customer details changed
9. `payment_method.attached` - Payment method added
10. `payment_method.detached` - Payment method removed

**Nice-to-Have Events**:
- `charge.succeeded` / `charge.failed` - Payment tracking
- `customer.created` / `customer.deleted` - Customer lifecycle
- `invoice.upcoming` - Upcoming invoice reminder (7 days)

### API Endpoints

**New billing routes**:
```javascript
// Subscription management (protected, RBAC: owner only)
POST   /api/billing/subscriptions          // Create subscription
GET    /api/billing/subscriptions/:id      // Get subscription details
PATCH  /api/billing/subscriptions/:id      // Update subscription (upgrade/downgrade)
DELETE /api/billing/subscriptions/:id      // Cancel subscription

// Customer portal (protected, RBAC: owner/admin)
POST   /api/billing/portal-session         // Create Stripe customer portal session

// Webhooks (public, Stripe signature verification)
POST   /api/webhooks/stripe                // Stripe webhook handler

// Trial management (internal cron job)
POST   /api/internal/expire-trials         // Cron job endpoint (CRON_SECRET required)
```

---

## Stories Breakdown

### Story 1: Stripe Product & Price Configuration ⏳

**Estimated Time**: 1 hour (BMAD) vs 4 hours (traditional)

**Tasks**:
1. Create Stripe products (Starter, Professional, Enterprise)
2. Create Stripe prices (monthly billing)
3. Document product/price IDs for environment variables
4. Create Stripe test mode configuration script

**Deliverables**:
- [ ] `scripts/stripe-setup.js` - Setup script for Stripe products/prices
- [ ] `docs/STRIPE_CONFIGURATION.md` - Product/price IDs and setup guide
- [ ] Environment variable documentation (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, etc.)

**Acceptance Criteria**:
- ✅ 3 Stripe products created (Starter, Professional, Enterprise)
- ✅ 3 monthly prices configured with correct amounts
- ✅ Test mode and production mode configurations documented
- ✅ Product IDs stored in environment variables

---

### Story 2: Subscription Service Implementation ⏳

**Estimated Time**: 1.5 hours (BMAD) vs 6 hours (traditional)

**Deliverables**:
- [ ] `server/services/billing/SubscriptionService.js` (300+ lines)
- [ ] Unit tests: `tests/unit/services/billing/SubscriptionService.test.js`

---

### Story 3: Stripe Webhook Handler ⏳

**Estimated Time**: 1.5 hours (BMAD) vs 6 hours (traditional)

**Deliverables**:
- [ ] `server/routes/webhooks/stripe.js` (400+ lines)
- [ ] `server/services/billing/WebhookProcessor.js` (300+ lines)
- [ ] Integration tests: `tests/integration/stripe-webhooks.test.js`

---

### Story 4: Trial Expiration Automation ⏳

**Estimated Time**: 1 hour (BMAD) vs 4 hours (traditional)

**Deliverables**:
- [ ] `server/routes/internal/expire-trials.js` (150+ lines)
- [ ] `server/services/notifications/EmailService.js` (200+ lines)
- [ ] Render cron configuration in `render.yaml`
- [ ] Unit tests: `tests/unit/services/expire-trials.test.js`

---

### Story 5: Subscription Upgrade/Downgrade Flow ⏳

**Estimated Time**: 1 hour (BMAD) vs 4 hours (traditional)

**Deliverables**:
- [ ] Updated `SubscriptionService.js` with upgrade/downgrade methods
- [ ] `server/routes/billing/subscriptions.js` (200+ lines)
- [ ] Unit tests: `tests/unit/services/billing/upgrade-downgrade.test.js`

---

### Story 6: Payment Failure Recovery System ⏳

**Estimated Time**: 1 hour (BMAD) vs 4 hours (traditional)

**Deliverables**:
- [ ] Updated `WebhookProcessor.js` with payment failure handling
- [ ] `server/services/billing/DunningService.js` (200+ lines)
- [ ] Email templates for payment failure notifications
- [ ] Unit tests: `tests/unit/services/billing/dunning.test.js`

---

### Story 7: Stripe Customer Portal Integration ⏳

**Estimated Time**: 0.5 hours (BMAD) vs 2 hours (traditional)

**Deliverables**:
- [ ] `server/routes/billing/portal-session.js` (50+ lines)
- [ ] Frontend: `src/components/billing/ManageBillingButton.jsx` (80+ lines)
- [ ] Integration tests: `tests/integration/customer-portal.test.js`

---

### Story 8: Billing Integration Testing Suite ⏳

**Estimated Time**: 1.5 hours (BMAD) vs 6 hours (traditional)

**Deliverables**:
- [ ] `tests/integration/stripe-billing.test.js` (500+ lines)
- [ ] `tests/mocks/stripe-mock-server.js` (150+ lines)
- [ ] Test coverage report (target: 90%+)

---

## Epic Status

**Current Status**: ⏳ IN PROGRESS
**Stories Completed**: 0/8 (0%)
**Estimated Completion**: 2025-10-24 (8-10 hours)
**Next Story**: Story 1 (Stripe Product & Price Configuration)

**Progress Tracker**:
- [x] Epic created and planned
- [ ] Story 1: Stripe setup
- [ ] Story 2: Subscription service
- [ ] Story 3: Webhook handler
- [ ] Story 4: Trial expiration
- [ ] Story 5: Upgrade/downgrade
- [ ] Story 6: Payment recovery
- [ ] Story 7: Customer portal
- [ ] Story 8: Testing suite
- [ ] QA & code review
- [ ] Production deployment

---

**Epic Owner**: Claude (BMAD Agent)
**Stakeholder**: Dudley Peacock (CEO)
**Priority**: High (required for Phase 6 launch)
**Related Epics**: BMAD-MULTITENANT-001, BMAD-MULTITENANT-002, BMAD-MULTITENANT-003

**Last Updated**: 2025-10-23
