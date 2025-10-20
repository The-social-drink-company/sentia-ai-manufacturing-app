# BMAD-REBRAND-002: Complete CapLiquify Branding Migration

**Epic**: BMAD-DEPLOY-001 (CapLiquify Platform Rebranding)
**Story**: BMAD-REBRAND-002
**Type**: Technical Debt / Brand Consistency
**Priority**: P1 (User-Facing)
**Status**: IN PROGRESS
**Created**: 2025-10-20
**Assignee**: Claude (BMAD-METHOD v6-alpha Agent)

---

## Story Description

### As a platform owner
I want all "Sentia" platform branding replaced with "CapLiquify"
So that users clearly understand CapLiquify is the SaaS platform name, and "Sentia Spirits" is a demo tenant/customer.

### Acceptance Criteria
- [ ] All user-facing pages show "CapLiquify" as platform name
- [ ] Authentication pages (sign-in/sign-up) display "CapLiquify" branding
- [ ] Dashboard sidebar shows "CapLiquify" logo and name
- [ ] Service layer comments reference "tenant data" not "Sentia data"
- [ ] Documentation references "CapLiquify" as platform, "Sentia Spirits" as tenant
- [ ] "Sentia Spirits" preserved as valid demo tenant name
- [ ] Historical BMAD docs preserved unchanged (retrospectives, completed stories)
- [ ] Verification script passes (zero platform "Sentia" references)

---

## Research Summary

### Files Scanned
- **Total files with "Sentia"**: 615 files
- **Source code files**: 35 .jsx/.tsx files
- **Documentation files**: 66 .md files
- **BMAD docs**: 100+ files (historical - preserve most)
- **Critical user-facing**: 13 files (landing, auth, dashboards)

### Classification
**CHANGE** (Platform branding):
- "Sentia Manufacturing" → "CapLiquify Manufacturing"
- "Sentia AI" → "CapLiquify AI"
- "real Sentia data" → "real tenant data"
- "Sentia database" → "tenant database" or "manufacturing database"

**PRESERVE** (Tenant-specific):
- "Sentia Spirits" (tenant name) → KEEP
- "Sentia Spirits Ltd" (tenant company) → KEEP
- Tenant slug "sentia-spirits" → KEEP
- File: `prisma/seed-tenant-sentia-spirits.js` → KEEP filename
- Historical retrospectives/stories → KEEP unchanged

---

## Implementation Phases

### Phase 1: Critical User-Facing Pages ✅ COMPLETE
**Status**: COMPLETE (2025-10-20 10:00 UTC)
**Files Updated**: 5 files, 10 changes
**Time**: 30 minutes (BMAD velocity: 3x faster)

#### Files Modified
1. `src/pages/LandingPage.jsx` (3 changes)
   - Line 95: aria-label "Capliquify Dashboard"
   - Line 184: aria-label "Capliquify Dashboard"
   - Lines 202-204: Footer "Capliquify" (was "Sentia Spirits")

2. `src/pages/SignInPage.jsx` (2 changes)
   - Line 10: Logo icon "C" (was "S")
   - Line 12: Title "Capliquify Manufacturing"

3. `src/pages/SignUpPage.jsx` (2 changes)
   - Line 10: Logo icon "C" (was "S")
   - Line 12: Title "Capliquify Manufacturing"

4. `src/components/LoadingScreen.jsx` (1 change - completed earlier)
   - Line 2: Comment "Capliquify branding"

5. `src/components/layout/Sidebar.jsx` (2 changes - completed earlier)
   - Line 300: Logo icon "C" (was "S")
   - Line 303: Brand name "Capliquify"

**Business Value**: Users now see correct "Capliquify" branding during authentication and landing experience.

---

### Phase 1B: Remaining UI Components
**Status**: IN PROGRESS
**Files Remaining**: 16 files, 25 occurrences
**Estimate**: 20 minutes BMAD

#### Files to Update
1. Marketing Pages (2 files)
   - `src/pages/marketing/BlogListPage.tsx`
   - `src/components/pricing/TestimonialsSection.tsx`

2. Dashboard Components (5 files)
   - `src/components/dashboard/StockLevelsChartEnhanced.jsx`
   - `src/components/dashboard/SalesPerformanceChart.jsx`
   - `src/components/dashboard/ProgressiveDashboardLoader.jsx`
   - `src/components/dashboard/PLAnalysisChartEnhanced.jsx`
   - `src/components/dashboard/MarketDistributionChart.jsx`
   - `src/components/dashboard/FinancialAnalysisSection.jsx`

3. Financial Components (3 files)
   - `src/components/WorkingCapital/RealWorkingCapital.jsx`
   - `src/components/FinancialReports.jsx`
   - `src/components/DemandForecasting.jsx`

4. Layout Components (3 files)
   - `src/components/DashboardLayout.jsx`
   - `src/components/layout/DashboardSidebar.jsx`
   - `src/components/navigation/Sidebar.jsx`

5. Admin & Misc (3 files)
   - `src/pages/admin/AdminDashboard.jsx`
   - `src/components/ChatBot.jsx`
   - `src/components/auth/AuthScaffold.jsx`

---

### Phase 2: Service Layer & Business Logic
**Status**: PENDING
**Files**: 8 files
**Estimate**: 15 minutes BMAD

#### Files to Update
1. Financial Services (3 files)
   - `src/services/FinancialAlgorithms.js` - "real Sentia data" → "real tenant data"
   - `src/services/WorkingCapitalEngine.js` - Comment updates
   - `src/services/DemandForecastingEngine.js` - Comment updates

2. API Services (2 files)
   - `src/services/APIIntegration.js` - Service comments
   - `src/services/mcpClient.js` - MCP client comments

3. Backend (3 files)
   - `server.js` - Server startup messages
   - `server/api/working-capital.js` - API comments
   - `src/server.js` - Comments

**Pattern**: "Sentia database" → "database" or "tenant database"

---

### Phase 3: Documentation
**Status**: PENDING
**Files**: 60+ files
**Estimate**: 30 minutes BMAD

#### Categories
1. **User Documentation** (10 files)
   - User manuals, getting started guides, FAQ
   - Training materials, glossaries
   - **Action**: Replace "Sentia Manufacturing" → "CapLiquify Manufacturing"

2. **Technical Documentation** (15 files)
   - Architecture docs, API docs, component docs
   - **Action**: Update system diagrams, endpoint examples

3. **Integration Documentation** (4 files)
   - Xero, Shopify, Amazon, Unleashed setup guides
   - **Action**: Update callback URLs, webhook examples

4. **Deployment Documentation** (8 files)
   - Render deployment guides, environment guides
   - **Action**: Update service names (already capliquify-*)

5. **Context Files** (25+ files)
   - Business requirements, technical specs
   - **Action**: Update platform name references

---

### Phase 4: BMAD Documentation
**Status**: PENDING
**Files**: 15 files (current/future only)
**Estimate**: 10 minutes BMAD

#### Update (Current/Future Docs Only)
- `bmad/status/BMAD-WORKFLOW-STATUS.md` - Current status
- `bmad/planning/roadmap.md` - Future roadmap
- `bmad/planning/prd.md` - Product requirements
- `bmad/planning/epics.md` - Epic list

#### Preserve (Historical Docs)
- All retrospectives (historical record)
- Completed stories (historical record)
- Audit reports (historical record)

**Rationale**: Historical docs preserve "what happened" - don't rewrite history.

---

### Phase 5: Verification & Deployment
**Status**: PENDING
**Estimate**: 10 minutes BMAD

#### Create Verification Script
```bash
#!/bin/bash
# scripts/verify-capliquify-branding.sh
echo "🔍 Verifying CapLiquify branding..."

# Check for platform "Sentia" references (exclude tenant name)
echo "❌ Platform 'Sentia' references found:"
grep -r "Sentia Manufacturing\|Sentia AI\|Sentia Dashboard" src/ docs/ \
  --exclude-dir=node_modules \
  --exclude-dir=bmad-backup* \
  --exclude="seed-tenant-sentia-spirits.js" \
  --exclude="MULTI-TENANT-ARCHITECTURE.md" || echo "None ✅"

echo ""
echo "✅ Valid tenant references (should exist):"
grep -r "Sentia Spirits" prisma/seed-tenant-sentia-spirits.js | wc -l
echo " references to 'Sentia Spirits' in tenant seed script"

echo ""
echo "✅ Verification complete!"
```

#### Deployment Checklist
- [ ] Run branding verification script
- [ ] Visual test: Sign-in page shows "CapLiquify"
- [ ] Visual test: Landing page shows "CapLiquify"
- [ ] Visual test: Dashboard sidebar shows "CapLiquify"
- [ ] Git commit all changes (following autonomous git agent rules)
- [ ] Push to main branch
- [ ] Render auto-deploys
- [ ] Smoke test production URLs

---

## BMAD Velocity Estimates

### Traditional Approach
- Phase 1: 1.5 hours (critical UI)
- Phase 1B: 1 hour (remaining UI)
- Phase 2: 1 hour (services)
- Phase 3: 2 hours (documentation)
- Phase 4: 0.5 hours (BMAD docs)
- **Total**: 6 hours

### BMAD-METHOD Approach
- Phase 1: 30 minutes (systematic search-replace) ✅ **DONE**
- Phase 1B: 20 minutes (batch processing)
- Phase 2: 15 minutes (service layer)
- Phase 3: 30 minutes (documentation)
- Phase 4: 10 minutes (BMAD docs)
- Phase 5: 10 minutes (verification)
- **Total**: 1 hour 55 minutes

**BMAD Velocity**: 3.1x faster (6 hours → 1.9 hours)

---

## Success Criteria

### ✅ Definition of Done
1. All user-facing pages show "CapLiquify" as platform name
2. Zero platform "Sentia" references in source code (excluding tenant name)
3. Documentation updated to reflect CapLiquify branding
4. "Sentia Spirits" preserved as demo tenant name
5. Historical BMAD docs preserved unchanged
6. Verification script passes with zero violations
7. Render deployment health: 100%
8. Visual smoke test passes on all auth/landing pages

### 🎯 Business Value
- **Brand Clarity**: Clear distinction between platform (CapLiquify) and customer (Sentia Spirits)
- **User Experience**: Professional, consistent branding across all touchpoints
- **Developer Experience**: Accurate documentation reduces confusion
- **Platform Scalability**: Branding supports multi-tenant SaaS model

---

## Risks & Mitigations

### Risk: Breaking Links
- **Mitigation**: Search-replace only affects display text, not URLs or slugs
- **Example**: `sentiadrinks.com` (tenant domain) remains unchanged

### Risk: Historical Confusion
- **Mitigation**: Preserve historical BMAD docs showing "Sentia" → "CapLiquify" migration journey
- **Example**: Retrospectives preserve original context

### Risk: Incomplete Migration
- **Mitigation**: Verification script catches missed references
- **Example**: grep -r "Sentia Manufacturing" src/

---

## Related Stories
- BMAD-DEPLOY-001: Initial Capliquify renaming (Render services)
- BMAD-REBRAND-001: Phase 1 critical pages (this story's Phase 1)
- EPIC-007: Authentication enhancement with branded pages

---

## Notes
- **Autonomous Git Agent**: Active - will auto-commit after every 5 file changes or 150+ lines
- **Render Deployment**: Auto-deploys on push to main
- **Current Health**: Frontend ✅ Backend ✅ MCP ✅ (100% healthy)

---

## Timeline
- **Created**: 2025-10-20 10:00 UTC
- **Phase 1 Complete**: 2025-10-20 10:30 UTC
- **Phase 1B Start**: 2025-10-20 10:45 UTC
- **Estimated Completion**: 2025-10-20 12:00 UTC (1.9 hours total)

---

**Story Points**: 5 (Traditional) → 2 (BMAD) = 60% velocity improvement
