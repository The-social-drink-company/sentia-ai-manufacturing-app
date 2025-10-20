# BMAD-TRIAL-001: Trial Signup Flow

**Epic**: EPIC-TRIAL-001 (Automated Free Trial Journey)
**Status**: 🔵 In Progress
**Priority**: P0 (Blocker)
**Assigned**: Developer Agent
**Created**: 2025-10-20
**Effort Estimate**: 8 hours
**Actual Effort**: TBD

---

## 📋 Story Description

**As a** prospective customer
**I want to** start a free trial without entering a credit card
**So that** I can explore CapLiquify risk-free for 14 days

---

## ✅ Acceptance Criteria

1. **No Credit Card Required**
   - Trial signup does NOT request credit card
   - Payment collection deferred until trial conversion
   - Clear messaging: "No Credit Card Required"

2. **Email Verification**
   - User receives verification code via email
   - Code must be entered to activate trial
   - Resend code functionality available

3. **Company Name + Tier Selection**
   - User enters company name during signup
   - Tier pre-selected (default: Professional)
   - Billing cycle selection (monthly/annual)

4. **Clerk User + Organization Creation**
   - Clerk user account created
   - Clerk organization created for tenant
   - User assigned as organization owner

5. **Tenant Provisioning**
   - Tenant record created in database
   - Status set to TRIAL
   - Trial dates calculated (14 days)
   - Unique slug generated from company name
   - Dedicated tenant schema created

6. **Welcome Email Sent**
   - Automated welcome email on verification
   - Includes trial details and quick start guide
   - Personalized with user name and tier

7. **Redirect to Onboarding**
   - After trial activation, redirect to /onboarding
   - Onboarding wizard pre-populated with tenant info
   - Seamless handoff from signup to onboarding

---

## 🏗️ Technical Implementation

### Frontend Component

**File**: `src/pages/auth/TrialSignup.tsx`

**Key Features**:
- Multi-step form (3 steps)
- Step 1: Account details (name, email, company, password)
- Step 2: Email verification (6-digit code)
- Step 3: Trial activation confirmation
- Progress indicator at top
- Error handling and validation
- Loading states for async operations
- Mobile-responsive design

**Dependencies**:
- `@clerk/clerk-react` (useSignUp hook)
- `react-router-dom` (navigation)
- `lucide-react` (icons)

### Backend API Endpoint

**File**: `server/routes/trial.routes.ts`

**Endpoint**: `POST /api/tenants/create-trial`

**Request Body**:
```typescript
{
  companyName: string,
  tier: 'starter' | 'professional' | 'enterprise',
  billingCycle: 'monthly' | 'annual'
}
```

**Response**:
```typescript
{
  tenant: {
    id: string,
    name: string,
    slug: string,
    subscriptionTier: string,
    trialEndDate: Date
  }
}
```

**Logic**:
1. Extract userId from Clerk auth middleware
2. Fetch user details from Clerk
3. Create Clerk organization
4. Generate unique slug from company name
5. Calculate trial dates (start: now, end: +14 days)
6. Create tenant record with TRIAL status
7. Create tenant database schema
8. Create user record with OWNER role
9. Create subscription record with TRIAL status
10. Send welcome email
11. Return tenant details

---

## 🎨 UI/UX Design

### Signup Form (Step 1)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         🎉 14-Day Free Trial • No Credit Card Required       │
│                                                             │
│              Start Your Free Trial                          │
│     Get full access to CapLiquify Professional              │
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐                   │
│  │ First Name      │ │ Last Name       │                   │
│  │ [___________]   │ │ [___________]   │                   │
│  └─────────────────┘ └─────────────────┘                   │
│                                                             │
│  ┌──────────────────────────────────────┐                  │
│  │ Work Email                           │                  │
│  │ [you@company.com________________]    │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  ┌──────────────────────────────────────┐                  │
│  │ Company Name                         │                  │
│  │ [Acme Manufacturing_____________]    │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  ┌──────────────────────────────────────┐                  │
│  │ Password                             │                  │
│  │ [••••••••___________________]        │                  │
│  │ Minimum 8 characters                 │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  ┌──────────────────────────────────────┐                  │
│  │          Continue                    │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  By signing up, you agree to our Terms and Privacy Policy  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

What's included in your trial:
✓ Full access to all features
✓ 14 days to explore and test
✓ No credit card required
✓ Cancel anytime, no questions asked
```

### Verification Step (Step 2)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ✉️  Check Your Email                      │
│                                                             │
│        We sent a verification code to                       │
│             user@company.com                                │
│                                                             │
│  ┌──────────────────────────────────────┐                  │
│  │ Verification Code                    │                  │
│  │ [  0  |  0  |  0  |  0  |  0  |  0  ]│                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  ┌──────────────────────────────────────┐                  │
│  │    Verify & Start Trial              │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│         Didn't receive the code? Resend                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Metrics

### Performance Metrics
- Page load time: < 2 seconds
- Form submission: < 3 seconds
- Email delivery: < 30 seconds
- Tenant provisioning: < 5 seconds

### Business Metrics (Post-Launch)
- Signup completion rate: Target > 60%
- Email verification rate: Target > 90%
- Signup-to-onboarding rate: Target > 95%
- Trial activation time: Target < 5 minutes

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Form validation (required fields, email format, password length)
- [ ] Slug generation (lowercase, hyphens, uniqueness)
- [ ] Trial date calculation (14 days from signup)
- [ ] Error handling (network errors, Clerk errors, database errors)

### Integration Tests
- [ ] Clerk user creation
- [ ] Clerk organization creation
- [ ] Tenant database record creation
- [ ] Tenant schema creation
- [ ] Subscription record creation
- [ ] User role assignment

### E2E Tests
- [ ] Complete signup flow from form to onboarding
- [ ] Email verification flow
- [ ] Resend verification code
- [ ] Error states (duplicate email, invalid code)
- [ ] Mobile responsive layout

---

## 🚀 Deployment Notes

### Environment Variables Required
```env
# Clerk (already configured)
CLERK_SECRET_KEY=sk_test_xxx
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx

# Email service (SendGrid)
SENDGRID_API_KEY=SG.xxx (to be added)
SENDGRID_FROM_EMAIL=noreply@capliquify.com (to be configured)
```

### Database Migrations
```sql
-- Tenant trial fields (verify exist)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'Tenant'
AND column_name IN ('isInTrial', 'trialStartDate', 'trialEndDate');

-- If missing, add:
ALTER TABLE "Tenant" ADD COLUMN "isInTrial" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Tenant" ADD COLUMN "trialStartDate" TIMESTAMP;
ALTER TABLE "Tenant" ADD COLUMN "trialEndDate" TIMESTAMP;
```

---

## 📝 Implementation Log

### 2025-10-20 - Story Created
- Epic EPIC-TRIAL-001 created with 7 user stories
- This story (BMAD-TRIAL-001) created as first implementation
- Status: Ready for development

---

## ✅ Definition of Done

- [ ] TrialSignup.tsx component created and functional
- [ ] POST /api/tenants/create-trial endpoint implemented
- [ ] Clerk user + organization creation working
- [ ] Tenant provisioning with trial status working
- [ ] Email verification flow complete
- [ ] Welcome email sending (template created)
- [ ] Redirect to onboarding after activation
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E test for complete flow passing
- [ ] Mobile responsive verified
- [ ] Error handling comprehensive
- [ ] Code reviewed and merged
- [ ] Deployed to staging environment
- [ ] Manual QA completed

---

**Story Status**: 🔵 In Progress
**Next Actions**: Implement TrialSignup.tsx component
