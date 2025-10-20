# EPIC-TRIAL-001: Automated Free Trial Journey

**Status**: 🟡 Planning
**Priority**: High
**Epic Owner**: Developer Agent
**Created**: 2025-10-20
**Target Completion**: 2025-10-23 (3 days)

---

## 📋 Epic Overview

### Business Objective
Create a complete automated free trial journey for CapLiquify that requires no credit card upfront, provides full feature access for 14 days, and smoothly converts trial users to paying customers with minimal friction.

### Success Criteria
- ✅ Users can start 14-day trial without credit card
- ✅ Full feature access during trial period
- ✅ Automated email nurture sequence (Day 1, 7, 12, 14)
- ✅ Visual trial countdown in dashboard
- ✅ Smooth conversion to paid subscription
- ✅ Grace period handling for expired trials
- ✅ Automated trial expiration monitoring
- ✅ Trial-to-paid conversion rate > 20%

### Impact
- **User Acquisition**: Reduce signup friction by 80%
- **Conversion**: Automated nurture increases trial-to-paid by 35%
- **Revenue**: Enable self-service onboarding at scale
- **Support**: Reduce manual trial management to zero

---

## 🎯 User Stories

### Story 1: BMAD-TRIAL-001 - Trial Signup Flow
**As a** prospective customer
**I want to** start a free trial without entering credit card
**So that** I can explore CapLiquify risk-free

**Acceptance Criteria**:
- No credit card required for trial signup
- Email verification required
- Company name + tier selection
- Clerk user + organization creation
- Tenant provisioning with trial status
- Welcome email sent immediately
- Redirect to onboarding wizard

**Effort**: 8 hours
**Priority**: P0 (Blocker)

---

### Story 2: BMAD-TRIAL-002 - Trial Countdown Component
**As a** trial user
**I want to** see how many days remain in my trial
**So that** I can decide when to add payment

**Acceptance Criteria**:
- Countdown banner in dashboard header
- Color-coded urgency (green > yellow > red)
- Days + hours remaining display
- "Add Payment Method" CTA
- Auto-hide after payment added
- Mobile responsive design

**Effort**: 4 hours
**Priority**: P0 (Blocker)

---

### Story 3: BMAD-TRIAL-003 - Trial API Endpoints
**As a** backend system
**I want to** manage trial lifecycles via API
**So that** trial creation and expiration are automated

**Acceptance Criteria**:
- POST /api/tenants/create-trial endpoint
- GET /api/trial/status endpoint
- Tenant schema creation
- Subscription record creation
- Trial date calculations (14 days)
- Unique slug generation
- User role assignment (OWNER)

**Effort**: 6 hours
**Priority**: P0 (Blocker)

---

### Story 4: BMAD-TRIAL-004 - Email Nurture Sequence
**As a** trial user
**I want to** receive helpful emails during my trial
**So that** I learn how to get value from CapLiquify

**Acceptance Criteria**:
- Day 1: Welcome email with quick start guide
- Day 7: Mid-trial check-in with progress metrics
- Day 12: Trial ending reminder with pricing
- Day 14: Trial expired, grace period notice
- Personalized with user name and tier
- Unsubscribe link in footer
- Responsive HTML templates

**Effort**: 8 hours
**Priority**: P1 (High)

---

### Story 5: BMAD-TRIAL-005 - Trial Expiration Cron Job
**As a** system administrator
**I want** automated trial expiration monitoring
**So that** trials are converted or suspended automatically

**Acceptance Criteria**:
- Runs hourly on backend server
- Identifies trials expiring in 2 days
- Sends day-12 reminder email
- Identifies expired trials
- Suspends tenants without payment
- Sends trial-expired email
- Logs all actions to database
- Error handling and retries

**Effort**: 5 hours
**Priority**: P1 (High)

---

### Story 6: BMAD-TRIAL-006 - Grace Period Handling
**As a** trial user whose trial expired
**I want** 3 days to add payment before suspension
**So that** I don't lose access immediately

**Acceptance Criteria**:
- 3-day grace period after trial end
- Account remains accessible (read-only)
- Persistent "Add Payment" banner
- Daily email reminders
- Auto-suspend after grace period
- Data archived (not deleted)

**Effort**: 4 hours
**Priority**: P2 (Medium)

---

### Story 7: BMAD-TRIAL-007 - Trial Analytics Dashboard
**As a** product manager
**I want to** track trial conversion metrics
**So that** I can optimize the trial experience

**Acceptance Criteria**:
- Trial signup rate tracking
- Trial-to-paid conversion rate
- Drop-off analysis by day
- Email open/click rates
- Feature usage during trial
- Admin dashboard visualization

**Effort**: 6 hours
**Priority**: P2 (Medium)

---

## 📊 Epic Metrics

### Development Metrics
- **Total Stories**: 7
- **Total Effort**: 41 hours (~5 days)
- **Estimated Velocity**: 3.5x (BMAD-METHOD average)
- **Actual Duration**: TBD
- **Completion Rate**: 0/7 (0%)

### Business Metrics (Post-Launch)
- **Trial Signup Rate**: Target > 5% of landing page visitors
- **Trial-to-Paid Conversion**: Target > 20%
- **Average Trial Duration**: Target 10+ days (70% complete trial)
- **Payment Add Rate**: Target > 60% before trial end
- **Email Engagement**: Target > 30% open rate, > 5% click rate

---

## 🏗️ Technical Architecture

### Frontend Components
```
src/pages/auth/TrialSignup.tsx         - Trial signup flow (3 steps)
src/components/trial/TrialCountdown.tsx - Countdown banner
src/components/trial/TrialProgress.tsx  - Trial progress tracker
```

### Backend API
```
server/routes/trial.routes.ts          - Trial endpoints
server/jobs/trial-expiration.job.ts    - Expiration monitoring
server/services/email/trial-emails.ts  - Email templates
```

### Database Schema Updates
```sql
-- Tenant trial fields (already exist)
ALTER TABLE Tenant ADD COLUMN isInTrial BOOLEAN DEFAULT FALSE;
ALTER TABLE Tenant ADD COLUMN trialStartDate TIMESTAMP;
ALTER TABLE Tenant ADD COLUMN trialEndDate TIMESTAMP;

-- Subscription trial tracking
ALTER TABLE Subscription ADD COLUMN trialStart TIMESTAMP;
ALTER TABLE Subscription ADD COLUMN trialEnd TIMESTAMP;

-- Trial analytics
CREATE TABLE TrialEvent (
  id UUID PRIMARY KEY,
  tenantId UUID REFERENCES Tenant(id),
  eventType VARCHAR(50), -- signup, email_sent, payment_added, converted, expired
  eventData JSONB,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## 🔗 Dependencies

### Prerequisites
- ✅ Clerk authentication setup (EPIC-006 complete)
- ✅ Multi-tenant architecture (existing)
- ✅ Stripe integration (EPIC-GATE-010 in progress)
- ❌ Email service setup (required for nurture sequence)
- ❌ Cron job infrastructure (required for expiration monitoring)

### Blockers
- Email service configuration (SendGrid/Mailgun/AWS SES)
- Cron job scheduling on Render (free tier limitations)

---

## 📅 Timeline

### Phase 1: Core Trial Flow (Days 1-2)
- BMAD-TRIAL-001: Trial signup flow
- BMAD-TRIAL-002: Trial countdown component
- BMAD-TRIAL-003: Trial API endpoints

### Phase 2: Automation (Day 3)
- BMAD-TRIAL-004: Email nurture sequence
- BMAD-TRIAL-005: Trial expiration cron job
- BMAD-TRIAL-006: Grace period handling

### Phase 3: Analytics (Day 4)
- BMAD-TRIAL-007: Trial analytics dashboard

---

## 🎨 Design Mockups

### Trial Signup Flow
```
Step 1: Account Details          Step 2: Email Verification       Step 3: Trial Started
┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
│ 🎉 14-Day Free Trial │        │ ✉️  Check Your Email  │        │ ✅ Trial Activated!   │
│ No Credit Card       │        │                      │        │                      │
│                      │        │ We sent code to:     │        │ Your 14-day trial of │
│ [First Name]         │        │ user@company.com     │        │ CapLiquify Pro is    │
│ [Last Name]          │   →    │                      │   →    │ now active!          │
│ [Email]              │        │ [______] Code        │        │                      │
│ [Company]            │        │                      │        │ [Start Onboarding]   │
│ [Password]           │        │ [Verify & Start]     │        │                      │
│                      │        │                      │        │ Days Remaining: 14   │
│ [Continue]           │        │ Resend Code          │        │                      │
└──────────────────────┘        └──────────────────────┘        └──────────────────────┘
```

### Trial Countdown Banner
```
┌──────────────────────────────────────────────────────────────────┐
│ ⏰ 7 days left in your trial                                     │
│ Your trial ends on October 27, 2025. Add payment to continue.   │
│ [💳 Add Payment Method]                                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📝 Notes

### Email Service Selection
Options for trial nurture emails:
1. **SendGrid** - Free tier: 100 emails/day (sufficient for MVP)
2. **Mailgun** - Free tier: 5,000 emails/month
3. **AWS SES** - $0.10 per 1,000 emails (cheapest at scale)

**Recommendation**: Start with SendGrid free tier, migrate to AWS SES at scale.

### Cron Job Hosting
Render free tier spins down after inactivity, which breaks cron jobs.

**Solutions**:
1. External cron service (cron-job.org, EasyCron)
2. Render starter plan ($7/mo with always-on)
3. GitHub Actions scheduled workflows (free)

**Recommendation**: GitHub Actions for MVP, Render starter for production.

---

## ✅ Definition of Done

- [ ] All 7 user stories complete and tested
- [ ] Trial signup flow functional end-to-end
- [ ] Email nurture sequence sending correctly
- [ ] Trial expiration monitoring running hourly
- [ ] Trial countdown visible in dashboard
- [ ] Grace period handling implemented
- [ ] Trial analytics tracking events
- [ ] Documentation updated (README, API docs)
- [ ] BMAD retrospective created with metrics
- [ ] Deployed to production on Render

---

## 🔄 Related Epics

- **EPIC-006**: Authentication Enhancement (prerequisite)
- **EPIC-GATE-010**: Production Stripe Integration (payment flow)
- **EPIC-ONBOARDING-001**: Interactive Onboarding Wizard (trial onboarding)
- **EPIC-PRICING-001**: Interactive Pricing Page (trial tier selection)

---

**Epic Status**: 🟡 Planning → 🔵 In Progress (Next)
