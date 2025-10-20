# EPIC: CapLiquify Phase 3 - Authentication & Tenant Management

**Epic ID**: CAPLIQUIFY-PHASE-3
**Phase**: Phase 3 of 8 (Authentication & Tenant Management)
**Created**: October 19, 2025
**Status**: PLANNING
**Priority**: P0 (Critical Path)
**Estimated Duration**: 3-4 weeks

---

## 📋 Epic Overview

Integrate Clerk Organizations for multi-tenant authentication, implement automatic tenant provisioning, build organization switching UI, and create user invitation system. This phase bridges the backend multi-tenant infrastructure (Phase 2) with the user-facing authentication experience.

### Prerequisites
- ✅ Phase 1: Database architecture complete
- ✅ Phase 2: Backend multi-tenant framework complete
- ✅ Clerk account configured
- ✅ Clerk publishable key in environment

### Success Criteria
- [ ] Clerk Organizations webhooks integrated
- [ ] Automatic tenant provisioning on organization creation
- [ ] Organization switching UI functional
- [ ] User invitation system with role assignment
- [ ] Onboarding flow for new tenants
- [ ] All users associated with tenants via Clerk organizations
- [ ] Zero users can access system without organization membership

---

## 🎯 Epic Goals

### 1. Clerk Organizations Integration
**Goal**: Seamlessly integrate Clerk Organizations as the source of truth for tenant management.

**Components**:
- Clerk webhook handler for organization events
- Automatic tenant creation on `organization.created` event
- Automatic tenant deletion on `organization.deleted` event (soft delete)
- Sync organization metadata to tenant record

### 2. Tenant Provisioning Automation
**Goal**: Fully automated tenant onboarding from organization creation to ready-to-use tenant schema.

**Components**:
- Tenant provisioning service (creates tenant + schema + default data)
- Default company record creation
- Welcome email to organization owner
- Trial period activation (14 days)

### 3. Organization Switching UI
**Goal**: Allow users who are members of multiple organizations to switch between them seamlessly.

**Components**:
- Organization switcher component (dropdown in header)
- Current organization display
- Switch organization logic with redirect
- Organization list with metadata (name, logo, tier)

### 4. User Invitation System
**Goal**: Allow organization owners/admins to invite team members with proper roles.

**Components**:
- Invite user form (email + role)
- Clerk invitation API integration
- Role assignment on invitation acceptance
- Invitation management (pending, accepted, revoked)

### 5. Tenant Onboarding Flow
**Goal**: Guide new organizations through initial setup.

**Components**:
- Welcome wizard (company info, industry, size)
- Integration setup prompts (Xero, Shopify, etc.)
- Sample data option
- Onboarding progress tracking

---

## 📦 Stories

### Story 1: CAPLIQUIFY-AUTH-001 - Clerk Webhooks Integration
**Priority**: P0
**Estimated**: 8-12 hours

**Description**: Implement Clerk webhook handler to listen for organization events and trigger tenant provisioning.

**Acceptance Criteria**:
- [ ] Webhook endpoint `/api/webhooks/clerk` created
- [ ] Webhook signature verification implemented
- [ ] Handle `organization.created` event
- [ ] Handle `organization.updated` event
- [ ] Handle `organization.deleted` event (soft delete tenant)
- [ ] Handle `organizationMembership.created` event (add user to tenant)
- [ ] Handle `organizationMembership.deleted` event (remove user from tenant)
- [ ] Comprehensive error handling and logging

**Technical Notes**:
- Use `svix` library for webhook signature verification
- Store webhook events in audit log
- Implement idempotency to prevent duplicate tenant creation

---

### Story 2: CAPLIQUIFY-AUTH-002 - Tenant Provisioning Service
**Priority**: P0
**Estimated**: 8-12 hours

**Description**: Create automated tenant provisioning service that creates complete tenant infrastructure.

**Acceptance Criteria**:
- [ ] `TenantProvisioningService` class created
- [ ] `provisionTenant(organizationData)` method implemented
- [ ] Creates tenant record in public schema
- [ ] Calls `create_tenant_schema(uuid)` PostgreSQL function
- [ ] Creates default company record in tenant schema
- [ ] Sets up trial period (14 days from creation)
- [ ] Sends welcome email to organization owner
- [ ] Returns complete tenant object with schema name

**Technical Notes**:
- Use transaction to ensure atomic provisioning
- Rollback on any failure
- Log all steps for debugging

---

### Story 3: CAPLIQUIFY-AUTH-003 - Organization Switcher UI
**Priority**: P1
**Estimated**: 6-8 hours

**Description**: Build organization switcher component for users who belong to multiple organizations.

**Acceptance Criteria**:
- [ ] `OrganizationSwitcher` component created
- [ ] Displays current organization name and logo
- [ ] Dropdown shows all user's organizations
- [ ] Clicking organization switches active organization
- [ ] Redirects to dashboard after switch
- [ ] Shows subscription tier badge per organization
- [ ] Handles users with single organization (no switcher needed)

**UI/UX Notes**:
- Position in header next to user profile
- Use Clerk's `useOrganizationList()` hook
- Show organization role (Owner, Admin, Member, Viewer)

---

### Story 4: CAPLIQUIFY-AUTH-004 - User Invitation System
**Priority**: P1
**Estimated**: 10-14 hours

**Description**: Implement user invitation system with role-based access control.

**Acceptance Criteria**:
- [ ] Invite user form created (email + role selection)
- [ ] Integration with Clerk's `organization.inviteMember()` API
- [ ] Role assignment on invitation acceptance
- [ ] Invitation list page (pending, accepted, expired)
- [ ] Revoke invitation functionality (owner/admin only)
- [ ] Email notification on invitation sent
- [ ] Redirect to onboarding after invitation acceptance

**Technical Notes**:
- Use Clerk's invitation API
- Store invitation metadata in tenant's `users` table
- Enforce user limits based on subscription tier

---

### Story 5: CAPLIQUIFY-AUTH-005 - Tenant Onboarding Flow
**Priority**: P2
**Estimated**: 12-16 hours

**Description**: Create guided onboarding flow for new tenants.

**Acceptance Criteria**:
- [ ] Welcome wizard component created
- [ ] Step 1: Company information (name, industry, size, currency)
- [ ] Step 2: Integration selection (Xero, Shopify, Amazon, Unleashed)
- [ ] Step 3: Sample data option
- [ ] Step 4: Team invitations
- [ ] Step 5: Onboarding complete (redirect to dashboard)
- [ ] Onboarding progress saved (can resume later)
- [ ] Skip onboarding option (go straight to dashboard)

**UI/UX Notes**:
- Use step indicator (1 of 5, 2 of 5, etc.)
- Allow back/forward navigation
- Show estimated time to complete

---

### Story 6: CAPLIQUIFY-AUTH-006 - Organization Metadata Sync
**Priority**: P2
**Estimated**: 4-6 hours

**Description**: Sync organization metadata from Clerk to tenant record.

**Acceptance Criteria**:
- [ ] Sync organization name on update
- [ ] Sync organization logo URL
- [ ] Sync organization metadata (industry, size, etc.)
- [ ] Handle organization deletion (soft delete tenant)
- [ ] Periodic sync job (hourly) to catch any missed webhooks

**Technical Notes**:
- Use Clerk's `organization.update()` webhook
- Store metadata in tenant record's `metadata` JSONB field

---

### Story 7: CAPLIQUIFY-AUTH-007 - User Role Management
**Priority**: P1
**Estimated**: 8-10 hours

**Description**: Implement role-based access control for organization members.

**Acceptance Criteria**:
- [ ] Role assignment on user creation (from invitation or webhook)
- [ ] Role update functionality (owner/admin only)
- [ ] Role enforcement via middleware (already created)
- [ ] Role display in user list
- [ ] Prevent role escalation (members can't become admins)
- [ ] Owner role transfer functionality

**Technical Notes**:
- Roles: owner, admin, member, viewer
- Store in tenant's `users` table
- Sync with Clerk organization roles

---

### Story 8: CAPLIQUIFY-AUTH-008 - Multi-Tenant Authentication Flow
**Priority**: P0
**Estimated**: 6-8 hours

**Description**: Update authentication flow to require organization membership.

**Acceptance Criteria**:
- [ ] Redirect users without organization to "Create Organization" page
- [ ] Block API access for users without organization
- [ ] Handle organization selection on login
- [ ] Store selected organization in session
- [ ] Clear session on organization switch

**Technical Notes**:
- Update `tenantContext` middleware to handle missing organization
- Add organization check to all protected routes

---

## 📊 Estimation Summary

| Story | Priority | Estimated Hours | Complexity |
|-------|----------|----------------|------------|
| CAPLIQUIFY-AUTH-001 | P0 | 8-12 | High |
| CAPLIQUIFY-AUTH-002 | P0 | 8-12 | High |
| CAPLIQUIFY-AUTH-003 | P1 | 6-8 | Medium |
| CAPLIQUIFY-AUTH-004 | P1 | 10-14 | High |
| CAPLIQUIFY-AUTH-005 | P2 | 12-16 | Medium |
| CAPLIQUIFY-AUTH-006 | P2 | 4-6 | Low |
| CAPLIQUIFY-AUTH-007 | P1 | 8-10 | Medium |
| CAPLIQUIFY-AUTH-008 | P0 | 6-8 | Medium |
| **TOTAL** | - | **62-86 hours** | **3-4 weeks** |

---

## 🎯 Definition of Done

### Phase 3 Complete When:
- [ ] All 8 stories completed and tested
- [ ] Clerk Organizations fully integrated
- [ ] Tenant provisioning automated
- [ ] Organization switching functional
- [ ] User invitation system working
- [ ] Onboarding flow complete
- [ ] All users associated with organizations
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Retrospective created

### Technical Acceptance
- [ ] Zero users can access API without organization membership
- [ ] Tenant provisioning completes in < 5 seconds
- [ ] Organization switching completes in < 1 second
- [ ] User invitations sent within 30 seconds
- [ ] Webhook processing completes in < 2 seconds

### User Experience Acceptance
- [ ] Users can create organization in < 2 minutes
- [ ] Users can switch organizations in < 3 clicks
- [ ] Users can invite team members in < 1 minute
- [ ] Onboarding flow completable in < 5 minutes
- [ ] Clear error messages for all failure cases

---

## 🔗 Dependencies

### Upstream (Blocking This Epic)
- ✅ Phase 1: Database architecture
- ✅ Phase 2: Backend multi-tenant framework
- ✅ Clerk account configured

### Downstream (Blocked By This Epic)
- ⏳ Phase 4: Marketing website (needs organization creation flow)
- ⏳ Phase 5: Admin dashboard (needs user management)
- ⏳ Phase 6: Billing & subscriptions (needs organization context)

---

## 🚨 Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Clerk webhook delays | Medium | Medium | Implement retry logic + manual sync fallback |
| Race conditions in provisioning | Low | High | Use database transactions + idempotency keys |
| User confusion with organization concept | Medium | Medium | Clear onboarding wizard + help documentation |
| Webhook verification failures | Low | High | Comprehensive error handling + logging |
| Organization switching bugs | Medium | Medium | Extensive integration testing |

---

## 📝 Technical Notes

### Clerk Organizations API
```javascript
// Create organization
const organization = await clerkClient.organizations.createOrganization({
  name: 'ACME Manufacturing',
  slug: 'acme-manufacturing'
})

// Invite user
await clerkClient.organizations.createOrganizationInvitation({
  organizationId: org.id,
  emailAddress: 'user@example.com',
  role: 'admin'
})

// List user's organizations
const { data: organizations } = await clerkClient.users.getOrganizationMembershipList({
  userId: user.id
})
```

### Webhook Event Types
- `organization.created`
- `organization.updated`
- `organization.deleted`
- `organizationMembership.created`
- `organizationMembership.updated`
- `organizationMembership.deleted`

### Tenant Provisioning Flow
```
1. Clerk webhook received: organization.created
2. Verify webhook signature
3. Extract organization data (id, name, slug)
4. Create tenant record in public.tenants
5. Call create_tenant_schema(tenant.id)
6. Create default company in tenant schema
7. Activate 14-day trial
8. Send welcome email
9. Return success
```

---

**Epic Created**: October 19, 2025
**Target Completion**: 3-4 weeks from start
**Blocking**: Phase 4-8 (Marketing, Admin, Billing, Migration, Launch)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
