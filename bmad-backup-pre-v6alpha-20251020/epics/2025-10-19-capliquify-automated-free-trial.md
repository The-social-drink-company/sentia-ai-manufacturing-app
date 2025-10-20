# EPIC: CapLiquify - Automated Free Trial Journey

**Epic ID**: CAPLIQUIFY-TRIAL-001
**Created**: October 19, 2025
**Status**: In Progress
**Priority**: High
**Sprint**: Phase 6 - Automated Onboarding (Part 1)

---

## 📋 Epic Overview

### Business Objective

Create a frictionless 14-day free trial journey that allows prospective customers to experience the full power of CapLiquify without requiring a credit card upfront. This automated trial system will:

1. Enable instant signup with email verification
2. Provision fully-functional tenant with all features unlocked
3. Nurture trial users with automated email sequence
4. Create urgency with real-time countdown
5. Seamlessly convert to paid subscription
6. Maximize trial-to-paid conversion rates

### Target User

- **Primary**: Manufacturing business owners evaluating CapLiquify
- **Access Level**: Full feature access during 14-day trial period
- **Use Cases**: Evaluate working capital optimization, demand forecasting, inventory management

### Success Metrics

- **Conversion Rate**: 25%+ trial-to-paid conversion
- **Activation Rate**: 70%+ users complete onboarding within first day
- **Time to Value**: <10 minutes from signup to first insight
- **Engagement**: 50%+ users return 3+ times during trial
- **Drop-off Reduction**: <15% signup abandonment rate

---

## 🎯 Epic Goals

### Automated Free Trial Journey

1. **No Friction Signup**: Email-only signup with instant verification
2. **14-Day Full Access**: All features unlocked (Starter, Professional, or Enterprise)
3. **Trial Countdown**: Real-time urgency indicator in dashboard
4. **Email Nurturing**: 4-email sequence (Day 1, 7, 12, 14)
5. **Seamless Conversion**: One-click upgrade to paid subscription
6. **Grace Period**: 3-day window after expiration before suspension

---

## 📊 Story Breakdown

### Story 1: Trial Signup Flow Component (3-4 hrs)

**Description**: Create multi-step trial signup form with Clerk integration

**Tasks**:
- [ ] Create `src/pages/auth/TrialSignup.tsx` component
- [ ] Step 1: Account Info (name, email, company, tier selection)
- [ ] Step 2: Email Verification (6-digit code from Clerk)
- [ ] Step 3: Start Trial (organization creation, tenant provisioning)
- [ ] Progress indicator showing current step
- [ ] Trial benefits display (no credit card, 14 days, full access)
- [ ] Form validation with error handling
- [ ] Clerk user creation API integration
- [ ] Success redirect to dashboard

**Acceptance Criteria**:
- [ ] User can sign up with email only (no credit card)
- [ ] Email verification code sent via Clerk
- [ ] Verification code validates correctly
- [ ] Organization created in Clerk on completion
- [ ] Tenant provisioned with trial status
- [ ] Trial start date and end date calculated
- [ ] User redirected to dashboard after signup
- [ ] Error states handled gracefully

---

### Story 2: Trial Countdown Component (2-3 hrs)

**Description**: Real-time trial countdown display in dashboard

**Tasks**:
- [ ] Create `src/components/trial/TrialCountdown.tsx` component
- [ ] Calculate days/hours remaining from trial end date
- [ ] Color-coded urgency (red ≤3 days, yellow ≤7 days, blue >7 days)
- [ ] "Add Payment Method" CTA when trial ending
- [ ] Trial expired state when countdown reaches zero
- [ ] Real-time countdown using JavaScript interval
- [ ] Responsive design (desktop and mobile)
- [ ] Integration with dashboard layout

**Acceptance Criteria**:
- [ ] Countdown displays correct days/hours remaining
- [ ] Colors change based on urgency thresholds
- [ ] Expired state shows when trial ended
- [ ] CTA button links to payment setup
- [ ] Countdown updates every minute
- [ ] Mobile-responsive design
- [ ] Only shows during trial period

---

### Story 3: Trial API Routes (3-4 hrs)

**Description**: Backend API endpoints for trial management

**Endpoints**:
- `POST /api/tenants/create-trial` - Create tenant with trial status
- `GET /api/trial/status` - Get trial status and days remaining
- `PATCH /api/trial/convert` - Convert trial to paid subscription

**Tasks**:
- [ ] Create `server/routes/trial.routes.ts`
- [ ] Implement tenant creation with trial configuration
- [ ] Calculate trial end date (14 days from start)
- [ ] Create database schema for trial tenants
- [ ] Implement trial status endpoint
- [ ] Add days remaining calculation
- [ ] Add trial conversion endpoint
- [ ] Error handling and validation
- [ ] Clerk authentication middleware

**Acceptance Criteria**:
- [ ] POST /api/tenants/create-trial creates tenant successfully
- [ ] Trial end date calculated as 14 days from start
- [ ] Tenant provisioned with correct subscription tier
- [ ] GET /api/trial/status returns accurate days remaining
- [ ] Trial status includes isExpired boolean
- [ ] All endpoints require authentication
- [ ] Error responses follow standard format
- [ ] Database records created correctly

---

### Story 4: Email Templates (2-3 hrs)

**Description**: Automated email sequence for trial nurturing

**Templates**:
- Day 1: Welcome email with getting started guide
- Day 7: Mid-trial check-in asking if help needed
- Day 12: Trial ending soon (2 days left) with payment prompt
- Day 14: Trial expired with 3-day grace period notice

**Tasks**:
- [ ] Create `server/emails/trial/` directory
- [ ] Design welcome email template (day-1.html)
- [ ] Design mid-trial check-in (day-7.html)
- [ ] Design trial ending warning (day-12.html)
- [ ] Design trial expired notice (day-14.html)
- [ ] Add dynamic variable substitution ({{name}}, {{daysLeft}}, etc.)
- [ ] Create email service integration (SendGrid/Mailgun/Resend)
- [ ] Test email rendering across clients

**Acceptance Criteria**:
- [ ] All 4 email templates designed and functional
- [ ] HTML emails render correctly in major clients
- [ ] Dynamic variables populate correctly
- [ ] Emails include clear CTAs
- [ ] Mobile-responsive email design
- [ ] Unsubscribe link included
- [ ] Company branding consistent with marketing site

---

### Story 5: Trial Expiration Cron Job (3-4 hrs)

**Description**: Automated background job for trial lifecycle management

**Functionality**:
- Check trials expiring in 3 days → send day-12 email
- Check expired trials → send day-14 email
- Check trials in grace period (>14 days) → suspend account
- Run every hour

**Tasks**:
- [ ] Create `server/jobs/trial-expiration.job.ts`
- [ ] Install `node-cron` for scheduling
- [ ] Query tenants with trials expiring in 3 days
- [ ] Send day-12 warning emails
- [ ] Query tenants with expired trials (0 days left)
- [ ] Send day-14 expired emails
- [ ] Query tenants past grace period (17+ days)
- [ ] Suspend accounts without payment method
- [ ] Add logging for all automated actions
- [ ] Error handling and retry logic

**Acceptance Criteria**:
- [ ] Cron job runs every hour
- [ ] Day-12 emails sent when 2 days remaining
- [ ] Day-14 emails sent on expiration day
- [ ] Accounts suspended after 3-day grace period
- [ ] All actions logged to audit trail
- [ ] Job handles errors gracefully
- [ ] No duplicate emails sent
- [ ] Job can be manually triggered for testing

---

### Story 6: Database Schema Updates (1-2 hrs)

**Description**: Add trial-specific fields to database models

**Schema Changes**:
```prisma
model Tenant {
  // ... existing fields
  isInTrial       Boolean   @default(false)
  trialStartDate  DateTime?
  trialEndDate    DateTime?
  trialTier       String?   // starter, professional, enterprise
}

model Subscription {
  // ... existing fields
  trialEndDate    DateTime?
  gracePeriodEnd  DateTime?
}
```

**Tasks**:
- [ ] Update `prisma/schema.prisma` with trial fields
- [ ] Create Prisma migration
- [ ] Run migration on development database
- [ ] Update TypeScript types
- [ ] Update seed data with trial examples

**Acceptance Criteria**:
- [ ] Migration creates new fields successfully
- [ ] Existing data unaffected
- [ ] TypeScript types updated
- [ ] No breaking changes to existing queries

---

### Story 7: Trial Tier Selection (2-3 hrs)

**Description**: Allow users to choose trial tier during signup

**Functionality**:
- Display 3 tier options (Starter, Professional, Enterprise)
- Show feature comparison
- Allow tier selection
- Store selected tier in tenant record
- Apply tier limits during trial

**Tasks**:
- [ ] Create tier selection step in signup flow
- [ ] Design tier comparison cards
- [ ] Add tier selection state management
- [ ] Pass selected tier to tenant creation API
- [ ] Apply tier-specific feature gates
- [ ] Add tier badge to dashboard

**Acceptance Criteria**:
- [ ] User can select from 3 tiers during signup
- [ ] Feature comparison clear and accurate
- [ ] Selected tier stored in database
- [ ] Tier limits enforced during trial
- [ ] User can see current tier in dashboard
- [ ] Tier displayed in trial countdown component

---

### Story 8: Trial-to-Paid Conversion Flow (3-4 hrs)

**Description**: Seamless upgrade from trial to paid subscription

**Functionality**:
- "Add Payment Method" button in countdown
- Redirect to Stripe Checkout
- Create subscription on successful payment
- Update tenant status from trial to active
- Send confirmation email
- Remove trial countdown from dashboard

**Tasks**:
- [ ] Create payment method collection flow
- [ ] Integrate Stripe Checkout
- [ ] Handle successful payment webhook
- [ ] Update tenant and subscription status
- [ ] Send subscription confirmation email
- [ ] Remove trial UI elements
- [ ] Add subscription management link

**Acceptance Criteria**:
- [ ] User can add payment method during trial
- [ ] Stripe Checkout integration functional
- [ ] Subscription created on successful payment
- [ ] Tenant status updated to ACTIVE
- [ ] Trial countdown removed after conversion
- [ ] Confirmation email sent
- [ ] No service interruption during conversion

---

### Story 9: Grace Period Management (2-3 hrs)

**Description**: Handle trial expiration with 3-day grace period

**Functionality**:
- Show "Trial Expired" banner when trial ends
- Allow 3 days of continued access
- Display grace period countdown
- Suspend account after grace period
- Send final warning email

**Tasks**:
- [ ] Create "Trial Expired" banner component
- [ ] Calculate grace period end date
- [ ] Show grace period countdown
- [ ] Implement account suspension logic
- [ ] Send final warning email
- [ ] Create suspended account page
- [ ] Allow reactivation with payment

**Acceptance Criteria**:
- [ ] Banner shows when trial expires
- [ ] Grace period is exactly 3 days
- [ ] User retains access during grace period
- [ ] Account suspended after grace period
- [ ] Suspended page shows payment options
- [ ] User can reactivate with payment
- [ ] All actions logged in audit trail

---

### Story 10: Trial Analytics Dashboard (2-3 hrs)

**Description**: Admin dashboard for monitoring trial metrics

**Metrics**:
- Active trials count
- Trial conversions (last 30 days)
- Average time to conversion
- Trial abandonment rate
- Most popular trial tier

**Tasks**:
- [ ] Create trial metrics API endpoint
- [ ] Query trial conversion statistics
- [ ] Calculate conversion rate
- [ ] Create admin analytics component
- [ ] Display trial funnel visualization
- [ ] Add trial list with filters
- [ ] Export trial data to CSV

**Acceptance Criteria**:
- [ ] Admin can view trial metrics
- [ ] Conversion rate calculated accurately
- [ ] Trial funnel shows drop-off points
- [ ] Admin can filter trials by status
- [ ] Trial list shows key information
- [ ] Data exportable to CSV
- [ ] Metrics update in real-time

---

## 🎨 Design System

### Trial-Specific Colors

- **Trial Blue**: #3B82F6 - Primary trial indicator color
- **Warning Yellow**: #F59E0B - 7-day warning state
- **Urgent Red**: #EF4444 - 3-day urgent state
- **Success Green**: #10B981 - Trial converted to paid
- **Neutral Gray**: #6B7280 - Expired/grace period

### Trial Countdown UI

```
┌────────────────────────────────────────┐
│  🎯 Free Trial Active                  │
│  12 days, 4 hours remaining            │
│  [Add Payment Method]                  │
└────────────────────────────────────────┘
```

### Signup Flow Layout

```
Step 1: Account Info
┌─────────────────────────────────────────┐
│  Create Your CapLiquify Account         │
│  ○────○────○  (Progress: 1 of 3)       │
│                                         │
│  Name: [____________]                   │
│  Email: [___________]                   │
│  Company: [_________]                   │
│  Choose Tier: [○ Starter ○ Pro ○ Ent]  │
│                                         │
│  ✓ No credit card required              │
│  ✓ 14 days full access                  │
│  ✓ Cancel anytime                       │
│                                         │
│  [Continue →]                           │
└─────────────────────────────────────────┘
```

---

## 📐 Technical Architecture

### Backend Structure

```
server/
├── routes/
│   └── trial.routes.ts           # Trial API endpoints
├── jobs/
│   └── trial-expiration.job.ts   # Automated trial management
├── emails/
│   └── trial/
│       ├── day-1.html            # Welcome email
│       ├── day-7.html            # Mid-trial check-in
│       ├── day-12.html           # Trial ending warning
│       └── day-14.html           # Trial expired notice
└── services/
    └── trial.service.ts          # Trial business logic
```

### Frontend Structure

```
src/
├── pages/
│   └── auth/
│       └── TrialSignup.tsx       # Multi-step signup form
├── components/
│   └── trial/
│       ├── TrialCountdown.tsx    # Trial countdown display
│       ├── TrialBanner.tsx       # Expired trial banner
│       └── TierSelection.tsx     # Tier selection cards
└── hooks/
    └── useTrial.ts               # Trial status management
```

---

## 🔐 Security & Compliance

### Trial Abuse Prevention

1. **Email Verification Required**: Prevents bulk fake signups
2. **One Trial Per Email**: Check email uniqueness across all tenants
3. **IP Rate Limiting**: Max 3 trial signups per IP per day
4. **Domain Validation**: Validate business email domains
5. **Clerk Organization**: 1:1 mapping prevents duplicate trials

### Data Privacy

- Trial data isolated per tenant (schema-per-tenant)
- Email preferences honored (unsubscribe links)
- GDPR compliance for EU users
- Data deletion after 30 days of non-conversion

---

## 📊 Effort Estimation

### Traditional Development

| Story | Description | Traditional Est. | BMAD Target |
|-------|-------------|-----------------|-------------|
| 1 | Trial Signup Flow | 3-4 hrs | 0.5-0.6 hrs |
| 2 | Trial Countdown | 2-3 hrs | 0.3-0.4 hrs |
| 3 | Trial API Routes | 3-4 hrs | 0.5-0.6 hrs |
| 4 | Email Templates | 2-3 hrs | 0.3-0.4 hrs |
| 5 | Trial Expiration Job | 3-4 hrs | 0.5-0.6 hrs |
| 6 | Database Schema | 1-2 hrs | 0.2-0.3 hrs |
| 7 | Tier Selection | 2-3 hrs | 0.3-0.4 hrs |
| 8 | Trial-to-Paid Flow | 3-4 hrs | 0.5-0.6 hrs |
| 9 | Grace Period | 2-3 hrs | 0.3-0.4 hrs |
| 10 | Analytics Dashboard | 2-3 hrs | 0.3-0.4 hrs |

**Total Traditional**: 23-33 hours
**Total BMAD Target**: 3.7-5.0 hours (6.2x-8.9x faster)

---

## ✅ Definition of Done

### Backend
- [ ] Trial API routes functional and tested
- [ ] Email templates created and rendering correctly
- [ ] Cron job running and sending automated emails
- [ ] Database schema updated with migrations
- [ ] Trial conversion flow working end-to-end
- [ ] Grace period logic implemented
- [ ] Error handling comprehensive

### Frontend
- [ ] Trial signup flow functional (3 steps)
- [ ] Email verification working via Clerk
- [ ] Trial countdown displaying correctly
- [ ] Tier selection working
- [ ] Trial expired banner showing when appropriate
- [ ] Payment method collection integrated
- [ ] Responsive design (mobile + desktop)

### Integration
- [ ] Clerk user creation working
- [ ] Clerk organization creation working
- [ ] Tenant provisioning with trial status
- [ ] Stripe Checkout integration (for conversion)
- [ ] Email service integration (SendGrid/Resend)
- [ ] All APIs authenticated and authorized

### Quality
- [ ] No console errors
- [ ] Form validation working
- [ ] Error states handled gracefully
- [ ] Loading states implemented
- [ ] TypeScript types complete
- [ ] Code formatted and linted

---

## 📝 Dependencies

### Existing Dependencies
- `@clerk/clerk-react` - User authentication
- `@clerk/clerk-sdk-node` - Backend Clerk SDK
- `@prisma/client` - Database ORM
- `react-router-dom` - Routing
- `tailwindcss` - Styling

### New Dependencies
- `node-cron` - Cron job scheduling
- `@sendgrid/mail` OR `resend` - Email service (choose one)
- `stripe` - Payment processing (if not already installed)

---

## 🎯 Sprint Plan

### Session 1 (3-4 hours) - Core Trial Flow
- Story 1: Trial Signup Flow
- Story 2: Trial Countdown Component
- Story 3: Trial API Routes
- Story 6: Database Schema Updates
- Commit and push

### Session 2 (2-3 hours) - Automation & Conversion
- Story 4: Email Templates
- Story 5: Trial Expiration Job
- Story 7: Tier Selection
- Story 8: Trial-to-Paid Flow
- Commit and push

### Session 3 (1-2 hours) - Polish & Analytics
- Story 9: Grace Period Management
- Story 10: Trial Analytics Dashboard
- Final testing and deployment
- Create retrospective

**Total Sprint Time**: 6-9 hours
**Traditional Equivalent**: 23-33 hours
**Expected Velocity**: **6x-8x faster**

---

## 📚 Email Sequence Content

### Day 1: Welcome Email

**Subject**: Welcome to CapLiquify - Your 14-Day Trial Starts Now! 🎉

**Content**:
- Welcome message and thank you for signing up
- Quick start guide (3 steps to first insight)
- Links to key features (Working Capital, Demand Forecasting, Inventory)
- Support contact information
- Trial end date reminder

### Day 7: Mid-Trial Check-In

**Subject**: How's Your CapLiquify Trial Going? We're Here to Help

**Content**:
- Check-in message (7 days remaining)
- Highlight of most popular features
- Invitation to schedule demo or ask questions
- Customer success story/testimonial
- FAQ link

### Day 12: Trial Ending Soon

**Subject**: Only 2 Days Left - Don't Lose Access to Your CapLiquify Workspace

**Content**:
- Urgency message (2 days remaining)
- Summary of trial usage/value delivered
- Clear CTA to add payment method
- Pricing reminder for selected tier
- What happens when trial expires

### Day 14: Trial Expired

**Subject**: Your CapLiquify Trial Has Ended - 3-Day Grace Period Active

**Content**:
- Trial expired notification
- 3-day grace period explanation
- Clear CTA to subscribe and keep access
- Offer to answer questions or schedule call
- Reminder of value/features that will be lost

---

**Epic Created**: October 19, 2025
**Target Completion**: October 20, 2025
**Status**: In Progress (0% → Target: 100%)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
