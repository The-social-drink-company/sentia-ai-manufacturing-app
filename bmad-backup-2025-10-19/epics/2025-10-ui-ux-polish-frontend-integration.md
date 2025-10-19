# BMAD Epic: UI/UX Polish & Frontend Integration

**Epic ID**: EPIC-003
**Priority**: High
**Status**: 🔄 IN PROGRESS (0/8 stories complete - 0%)
**Owner**: Scrum Master + Development Team
**Created**: 2025-10-19
**Started**: 2025-10-19
**Framework**: BMAD-METHOD v6a Phase 4

**Progress Tracker**:
- ⏳ BMAD-UI-001: Integrate Setup Prompts into Dashboard Pages (4 days estimated) - NEXT
- ⏳ BMAD-UI-002: Add Loading Skeletons to All Widgets (2 days estimated)
- ⏳ BMAD-UI-003: Implement React Error Boundaries (1 day estimated)
- ⏳ BMAD-UI-004: Redesign Landing Page (3 days estimated)
- ⏳ BMAD-UI-005: Remove Legacy Demo Pages (1 day estimated)
- ⏳ BMAD-UI-006: Add Breadcrumb Navigation (1 day estimated)
- ⏳ BMAD-UI-007: Add System Status Badge (1 day estimated)
- ⏳ BMAD-UI-008: Polish Dashboard Component Styling (2 days estimated)

**Velocity Metrics**:
- Stories Complete: 0/8 (0%)
- Days Complete: 0/15 (0%)
- Sprint 1 Velocity: TBD
- Overall Velocity: TBD
- Projected Total: 15 days (if EPIC-002 velocity holds: ~4 days)

---

## Epic Summary

**Goal**: Transform the Sentia Manufacturing Dashboard from a functional prototype into a production-ready application with polished UX, comprehensive error handling, and modern UI design.

**Business Value**: Deliver a professional, production-ready manufacturing intelligence platform that users trust and enjoy using.

**Current State**: EPIC-002 complete - all mock data eliminated, real API integrations working, but UI needs polish

**Target State**: Production-ready UX with:
- Setup prompts integrated into all dashboard pages
- Loading states on all async operations
- Error boundaries catching all component failures
- Modern landing page design
- No legacy demo pages
- Professional breadcrumb navigation
- System health indicators

---

## Business Context

### Problem Statement

After EPIC-002 completion, the Sentia Manufacturing Dashboard has:
- ✅ Real data from 4 external APIs (Xero, Shopify, Amazon, Unleashed)
- ✅ Zero mock data violations
- ✅ Production-ready backend infrastructure

**BUT**:
- ❌ Setup prompts created but not integrated into pages
- ❌ No loading skeletons (users see blank screens during fetch)
- ❌ No error boundaries (component crashes crash entire app)
- ❌ Landing page is generic template
- ❌ Legacy demo pages still exist
- ❌ No breadcrumb navigation
- ❌ No system status indicators

**Impact**:
- Users confused when APIs not configured (no setup instructions visible)
- Poor perceived performance (no loading feedback)
- Crashes cause complete application failure
- Landing page doesn't sell the product
- Dead-end legacy pages confuse users

### Success Criteria

**Epic Complete When**:
- [ ] All 4 setup prompts integrated into relevant dashboard pages
- [ ] All widgets show loading skeletons during data fetch
- [ ] Error boundaries catch and display errors gracefully
- [ ] Landing page redesigned per UI/UX architecture plan
- [ ] All legacy demo pages removed
- [ ] Breadcrumb navigation working on all pages
- [ ] System status badge shows integration health
- [ ] All dashboard components use modern gradient styling

---

## Epic Scope

### In Scope ✅

**Setup Prompt Integration**:
- Integrate XeroSetupPrompt into FinancialReports.jsx
- Integrate XeroSetupPrompt into RealWorkingCapital.jsx
- Integrate ShopifySetupPrompt into DashboardEnterprise.jsx (sales widgets)
- Integrate AmazonSetupPrompt into orders dashboard
- Integrate UnleashedSetupPrompt into InventoryManagement.jsx
- Show setup prompts ONLY when API not connected

**Loading States**:
- Create LoadingSkeleton.jsx component
- Add skeletons to all KPI cards
- Add skeletons to all chart widgets
- Add skeletons to all data tables
- Integrate with TanStack Query isLoading states
- Minimum display time to prevent flash

**Error Handling**:
- Create ErrorBoundary component
- Wrap DashboardLayout in ErrorBoundary
- Create error recovery UI
- Add error logging (Sentry integration optional)
- Test error scenarios

**Landing Page Redesign**:
- Hero section with gradient background
- 6 feature cards with icons
- Trust metrics section (4 metric cards)
- Final CTA section
- Footer with company info + links
- Mobile-responsive layout
- Reference: bmad/audit/UI_UX_ARCHITECTURE_DIAGRAMS.md

**Legacy Cleanup**:
- Remove WorkingCapitalEnterprise.jsx
- Remove WorkingCapitalComprehensive.jsx
- Remove unused demo components
- Update routing configuration
- Test all routes still work

**Navigation Enhancements**:
- Create Breadcrumb.jsx component
- Add to Header.jsx
- Show current page hierarchy
- Clickable navigation

**System Health**:
- Create SystemStatusBadge.jsx component
- Show integration health (Xero, Shopify, Amazon, Unleashed)
- Color-coded status indicators
- Tooltip with details

**Component Styling**:
- Apply gradient backgrounds to KPI cards
- Update color scheme to match design system
- Improve hover states
- Consistent spacing and typography

### Out of Scope ❌

- New features beyond UI polish
- Backend API changes
- New external API integrations
- Performance optimizations (separate epic)
- Accessibility features (EPIC-004)
- Test coverage (EPIC-005)

---

## Epic Breakdown: Stories

### Story 1: Integrate Setup Prompts into Dashboard Pages ⭐ HIGH PRIORITY
**Story ID**: BMAD-UI-001
**Estimated Effort**: 4 days (32 hours)
**Priority**: High

**Objective**: Integrate all 4 setup prompts (Xero, Shopify, Amazon, Unleashed) into relevant dashboard pages

**Acceptance Criteria**:
- [ ] XeroSetupPrompt shows on FinancialReports.jsx when Xero not connected
- [ ] XeroSetupPrompt shows on RealWorkingCapital.jsx when Xero not connected
- [ ] ShopifySetupPrompt shows on DashboardEnterprise.jsx when Shopify not connected
- [ ] AmazonSetupPrompt shows on orders dashboard when Amazon not connected
- [ ] UnleashedSetupPrompt shows on InventoryManagement.jsx when Unleashed not connected
- [ ] Setup prompts hide when API successfully connected
- [ ] Prompts styled consistently with dashboard theme
- [ ] Mobile-responsive layout

**Files to Modify**:
- src/pages/FinancialReports.jsx
- src/components/RealWorkingCapital.jsx
- src/pages/DashboardEnterprise.jsx
- src/pages/orders/ (create if needed)
- src/components/InventoryManagement.jsx
- src/hooks/useIntegrationStatus.js (create)

**Implementation Pattern**:
```jsx
function FinancialReports() {
  const { data: xeroStatus, isLoading } = useQuery({
    queryKey: ['xero-status'],
    queryFn: () => fetch('/api/xero/status').then(r => r.json())
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!xeroStatus?.connected) {
    return <XeroSetupPrompt xeroStatus={xeroStatus} />;
  }

  return (
    <div>
      {/* Actual financial reports */}
    </div>
  );
}
```

---

### Story 2: Add Loading Skeletons to All Widgets ⭐ HIGH PRIORITY
**Story ID**: BMAD-UI-002
**Estimated Effort**: 2 days (16 hours)
**Priority**: High

**Objective**: Create and integrate loading skeletons for all async data operations

**Acceptance Criteria**:
- [ ] LoadingSkeleton.jsx component created
- [ ] KPI card skeleton (shimmer animation)
- [ ] Chart skeleton (placeholder with shimmer)
- [ ] Table skeleton (rows with shimmer)
- [ ] All widgets use skeletons during TanStack Query isLoading
- [ ] Minimum 500ms display time (prevent flash)
- [ ] Smooth transition from skeleton to content
- [ ] Mobile-responsive skeletons

**Files to Create**:
- src/components/ui/LoadingSkeleton.jsx
- src/components/ui/KPICardSkeleton.jsx
- src/components/ui/ChartSkeleton.jsx
- src/components/ui/TableSkeleton.jsx

**Files to Modify**:
- All widget components (20+ files)
- Update TanStack Query hooks

**Implementation Pattern**:
```jsx
export function KPICardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-lg animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-24 mb-4"></div>
      <div className="h-8 bg-slate-200 rounded w-32 mb-2"></div>
      <div className="h-3 bg-slate-200 rounded w-20"></div>
    </div>
  );
}

function KPICard({ queryKey }) {
  const { data, isLoading } = useQuery({ queryKey, /* ... */ });

  if (isLoading) {
    return <KPICardSkeleton />;
  }

  return (/* actual KPI card */);
}
```

---

### Story 3: Implement React Error Boundaries 🔸 MEDIUM PRIORITY
**Story ID**: BMAD-UI-003
**Estimated Effort**: 1 day (8 hours)
**Priority**: Medium

**Objective**: Prevent component crashes from breaking entire application

**Acceptance Criteria**:
- [ ] ErrorBoundary component created
- [ ] DashboardLayout wrapped in ErrorBoundary
- [ ] Error UI shows user-friendly message
- [ ] Error UI shows "Retry" button
- [ ] Error UI shows "Report Issue" link
- [ ] Error logging to console (Sentry optional)
- [ ] Error boundaries tested with intentional crashes

**Files to Create**:
- src/components/ErrorBoundary.jsx
- src/components/ui/ErrorState.jsx

**Files to Modify**:
- src/App-simple-environment.jsx
- src/components/layout/DashboardLayout.jsx

**Implementation**:
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Optional: Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="Something went wrong"
          message={this.state.error?.message}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}
```

---

### Story 4: Redesign Landing Page ⭐ HIGH PRIORITY
**Story ID**: BMAD-UI-004
**Estimated Effort**: 3 days (24 hours)
**Priority**: High

**Objective**: Replace generic landing page with modern, professional design

**Acceptance Criteria**:
- [ ] Hero section with gradient background
- [ ] Hero title + subtitle + 2 CTAs (Sign In, Learn More)
- [ ] Features section with 6 feature cards
- [ ] Trust metrics section with 4 metric cards
- [ ] Final CTA section
- [ ] Footer with company info + links
- [ ] Mobile-responsive layout (mobile-first)
- [ ] Smooth scroll animations
- [ ] All links functional

**Reference Design**: bmad/audit/UI_UX_ARCHITECTURE_DIAGRAMS.md (lines 1-100)

**Files to Modify**:
- src/pages/LandingPage.jsx (complete redesign)

**Features Section Content**:
1. Real-Time Financial Intelligence (icon: ChartBarIcon)
2. AI-Powered Demand Forecasting (icon: BoltIcon)
3. Inventory Optimization (icon: CubeIcon)
4. Working Capital Management (icon: CurrencyDollarIcon)
5. Multi-Channel Integration (icon: GlobeAltIcon)
6. Production Tracking (icon: CogIcon)

**Trust Metrics Content**:
1. 99.9% Uptime
2. 4 External Integrations
3. Real-Time Data
4. Enterprise Security

---

### Story 5: Remove Legacy Demo Pages 🔹 LOW PRIORITY
**Story ID**: BMAD-UI-005
**Estimated Effort**: 1 day (8 hours)
**Priority**: Low

**Objective**: Remove all legacy demo pages that use hardcoded data

**Acceptance Criteria**:
- [ ] WorkingCapitalEnterprise.jsx deleted
- [ ] WorkingCapitalComprehensive.jsx deleted
- [ ] All unused demo components deleted
- [ ] Routes updated (remove legacy paths)
- [ ] Navigation updated (remove legacy links)
- [ ] All tests still pass
- [ ] No broken links

**Files to Delete**:
- src/pages/working-capital/WorkingCapitalEnterprise.jsx
- src/pages/working-capital/WorkingCapitalComprehensive.jsx
- src/components/demo/* (if exists)

**Files to Modify**:
- src/App-simple-environment.jsx (routing)
- src/components/layout/Sidebar.jsx (navigation)

---

### Story 6: Add Breadcrumb Navigation 🔸 MEDIUM PRIORITY
**Story ID**: BMAD-UI-006
**Estimated Effort**: 1 day (8 hours)
**Priority**: Medium

**Objective**: Add breadcrumb navigation to Header component

**Acceptance Criteria**:
- [ ] Breadcrumb.jsx component created
- [ ] Integrated into Header.jsx
- [ ] Shows current page hierarchy
- [ ] Clickable navigation (e.g., "Dashboard › Financial › Reports")
- [ ] Updates automatically on route change
- [ ] Mobile-responsive (hides on small screens)
- [ ] Consistent styling with design system

**Files to Create**:
- src/components/layout/Breadcrumb.jsx

**Files to Modify**:
- src/components/layout/Header.jsx

**Implementation Pattern**:
```jsx
function Breadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs = pathSegments.map((segment, index) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1),
    path: '/' + pathSegments.slice(0, index + 1).join('/')
  }));

  return (
    <nav className="flex items-center text-sm text-slate-600">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && <ChevronRightIcon className="h-4 w-4 mx-2" />}
          <Link to={crumb.path} className="hover:text-slate-900">
            {crumb.label}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}
```

---

### Story 7: Add System Status Badge 🔸 MEDIUM PRIORITY
**Story ID**: BMAD-UI-007
**Estimated Effort**: 1 day (8 hours)
**Priority**: Medium

**Objective**: Add system health indicator to Header component

**Acceptance Criteria**:
- [ ] SystemStatusBadge.jsx component created
- [ ] Shows integration health (Xero, Shopify, Amazon, Unleashed)
- [ ] Color-coded indicators (green/yellow/red)
- [ ] Tooltip shows details on hover
- [ ] Real-time status updates
- [ ] Integrated into Header.jsx
- [ ] Mobile-responsive

**Files to Create**:
- src/components/layout/SystemStatusBadge.jsx

**Files to Modify**:
- src/components/layout/Header.jsx

**Implementation Pattern**:
```jsx
function SystemStatusBadge() {
  const { data: status } = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      const [xero, shopify, amazon, unleashed] = await Promise.all([
        fetch('/api/xero/status').then(r => r.json()),
        fetch('/api/shopify/status').then(r => r.json()),
        fetch('/api/amazon/status').then(r => r.json()),
        fetch('/api/unleashed/status').then(r => r.json())
      ]);
      return { xero, shopify, amazon, unleashed };
    },
    refetchInterval: 60000 // 1 minute
  });

  const healthyCount = Object.values(status || {}).filter(s => s.connected).length;
  const color = healthyCount === 4 ? 'green' : healthyCount >= 2 ? 'yellow' : 'red';

  return (
    <Tooltip content={`${healthyCount}/4 integrations healthy`}>
      <Badge variant={color}>
        {healthyCount}/4 Healthy
      </Badge>
    </Tooltip>
  );
}
```

---

### Story 8: Polish Dashboard Component Styling 🔹 LOW PRIORITY
**Story ID**: BMAD-UI-008
**Estimated Effort**: 2 days (16 hours)
**Priority**: Low

**Objective**: Apply modern gradient styling to all dashboard components

**Acceptance Criteria**:
- [ ] KPI cards use gradient backgrounds
- [ ] Hover states use scale transform
- [ ] Consistent color palette across all components
- [ ] Typography updated to design system
- [ ] Spacing consistent (Tailwind spacing scale)
- [ ] All components mobile-responsive
- [ ] Dark mode compatibility (optional)

**Files to Modify**:
- src/components/dashboard/* (all dashboard components)
- tailwind.config.js (add custom gradients)

**Design System**:
- Primary gradient: `from-blue-600 to-purple-700`
- Hover scale: `hover:scale-105`
- Shadow: `shadow-lg hover:shadow-xl`
- Spacing: `p-6 gap-4`
- Border radius: `rounded-xl`

---

## Story Prioritization

**Sprint 1** (Week 1 - 5 days):
1. ⭐ BMAD-UI-001: Integrate Setup Prompts (4 days)
2. ⭐ BMAD-UI-002: Add Loading Skeletons (2 days) - starts day 3 in parallel

**Sprint 2** (Week 2 - 5 days):
3. ⭐ BMAD-UI-004: Redesign Landing Page (3 days)
4. 🔸 BMAD-UI-003: Implement Error Boundaries (1 day)
5. 🔸 BMAD-UI-006: Add Breadcrumb Navigation (1 day)

**Sprint 3** (Week 3 - 5 days):
6. 🔸 BMAD-UI-007: Add System Status Badge (1 day)
7. 🔹 BMAD-UI-005: Remove Legacy Pages (1 day)
8. 🔹 BMAD-UI-008: Polish Component Styling (2 days)

**Total Estimated Time**: 15 days (~3 weeks)

---

## Dependencies

### External Dependencies
- [ ] UI/UX architecture plan (bmad/audit/UI_UX_ARCHITECTURE_DIAGRAMS.md) ✅ COMPLETE
- [ ] Design system color palette
- [ ] Icon library (Heroicons) ✅ AVAILABLE
- [ ] shadcn/ui components ✅ AVAILABLE

### Internal Dependencies
- [ ] EPIC-002 complete ✅ COMPLETE
- [ ] Setup prompt components created ✅ COMPLETE
- [ ] TanStack Query configured ✅ COMPLETE
- [ ] Routing configured ✅ COMPLETE

### Blockers
- None identified

---

## Technical Architecture

### Component Pattern for Setup Prompts

```jsx
// Pattern for all pages with external API integrations
function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['api-data'],
    queryFn: fetchAPIData
  });

  // 1. Show loading skeleton
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // 2. Show setup prompt if not connected
  if (error?.setupRequired) {
    return <APISetupPrompt status={error.details} />;
  }

  // 3. Show error state if API failure
  if (error) {
    return <ErrorState error={error} />;
  }

  // 4. Show empty state if no data
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // 5. Show actual content
  return <DashboardContent data={data} />;
}
```

### Loading Skeleton Pattern

```jsx
// Skeleton components follow actual component structure
export function KPICardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-lg">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 rounded w-24"></div>
        <div className="h-8 bg-slate-200 rounded w-32"></div>
        <div className="h-3 bg-slate-200 rounded w-20"></div>
      </div>
    </div>
  );
}
```

### Error Boundary Pattern

```jsx
// Error boundaries at strategic points
<ErrorBoundary fallback={<ErrorFallback />}>
  <DashboardLayout>
    <ErrorBoundary fallback={<WidgetError />}>
      <FinancialWidget />
    </ErrorBoundary>
  </DashboardLayout>
</ErrorBoundary>
```

---

## Risk Assessment

### High Risks 🔴

**Risk 1: Breaking Existing Functionality**
- **Probability**: Medium
- **Impact**: High (breaks working features)
- **Mitigation**: Comprehensive testing after each story, git revert capability

**Risk 2: Inconsistent UX Patterns**
- **Probability**: Low
- **Impact**: Medium (confusing user experience)
- **Mitigation**: Follow UI/UX architecture plan strictly, component library

### Medium Risks 🟡

**Risk 3: Performance Degradation**
- **Probability**: Medium
- **Impact**: Medium (slow page loads)
- **Mitigation**: Monitor bundle size, lazy loading, code splitting

**Risk 4: Mobile Responsiveness Issues**
- **Probability**: Medium
- **Impact**: Medium (poor mobile UX)
- **Mitigation**: Mobile-first development, test on multiple devices

---

## Success Metrics

### Quantitative Metrics

**Code Quality**:
- All components follow established patterns
- Zero new console errors
- Zero new linter warnings
- Bundle size < 2MB

**User Experience**:
- Page load time < 3 seconds (p95)
- Loading skeleton visible > 500ms (prevent flash)
- Error recovery rate > 95%
- Mobile responsiveness score > 90

**Business Value**:
- Setup prompts reduce support tickets
- Error boundaries prevent complete crashes
- Professional landing page increases signups

### Qualitative Metrics

- Dashboard feels polished and professional
- Loading states provide clear feedback
- Errors are recoverable and user-friendly
- Landing page sells the product effectively

---

## Acceptance Criteria (Epic Level)

**Epic DONE When**:

1. **Setup Prompts Integrated**:
   - [ ] All 4 prompts (Xero, Shopify, Amazon, Unleashed) integrated
   - [ ] Prompts show only when API not connected
   - [ ] Prompts hide when API successfully connected

2. **Loading States Implemented**:
   - [ ] All async operations show loading skeletons
   - [ ] Skeletons match component structure
   - [ ] Smooth transition from skeleton to content

3. **Error Boundaries Added**:
   - [ ] DashboardLayout wrapped in ErrorBoundary
   - [ ] Error UI shows user-friendly message
   - [ ] Error recovery mechanism working

4. **Landing Page Redesigned**:
   - [ ] Hero, features, trust metrics, CTA sections complete
   - [ ] Mobile-responsive layout
   - [ ] All links functional

5. **Legacy Code Removed**:
   - [ ] All demo pages deleted
   - [ ] Routes updated
   - [ ] No broken links

6. **Navigation Enhanced**:
   - [ ] Breadcrumb navigation working
   - [ ] System status badge showing health

7. **Component Styling Polished**:
   - [ ] Gradient backgrounds applied
   - [ ] Consistent design system
   - [ ] Mobile-responsive

8. **Testing & Documentation**:
   - [ ] All stories tested
   - [ ] Epic retrospective created
   - [ ] Production deployment successful

---

## BMAD Workflow for This Epic

Following BMAD-METHOD v6a Phase 4 iterative cycle:

```
FOR EACH STORY (BMAD-UI-001 through BMAD-UI-008):

  1. ✅ create-story
     - Detailed story with acceptance criteria
     - Component specifications
     - UI/UX design references

  2. ✅ story-context
     - Inject UI component patterns
     - Loading state best practices
     - Error handling patterns
     - Mobile-responsive strategies

  3. ✅ dev-story
     - Implement components
     - Add loading states
     - Update pages
     - Add tests

  4. ✅ review-story
     - Test on desktop + mobile
     - Verify UX patterns
     - Performance testing
     - Accessibility check

  5. IF issues: correct-course
     - Fix bugs
     - Improve UX
     - Optimize performance
     - Re-test

  6. WHEN story complete: document learnings
     - Component patterns
     - UX insights
     - Performance findings

WHEN epic complete: retrospective
  - What went well
  - Challenges faced
  - UI/UX patterns refined
  - Documentation for future epics

NEXT EPIC
```

---

## Next Actions

### Immediate (Today)
1. ✅ Epic planning document created (this document)
2. ⏳ Create BMAD-UI-001 story (Integrate Setup Prompts)
3. ⏳ Review UI/UX architecture plan
4. ⏳ Set up development environment

### Short-term (This Week)
1. Implement BMAD-UI-001 (Setup Prompts)
2. Test with real API connections
3. Create BMAD-UI-002 story (Loading Skeletons)
4. Begin loading skeleton implementation

### Medium-term (Next 2-3 Weeks)
1. Complete all 8 stories
2. Comprehensive integration testing
3. Epic retrospective
4. Production deployment

---

## References

**Related Documents**:
- [BMAD Implementation Plan](../BMAD-METHOD-V6A-IMPLEMENTATION.md)
- [EPIC-002 Complete Retrospective](../retrospectives/2025-10-EPIC-002-complete-retrospective.md)
- [UI/UX Architecture Diagrams](../audit/UI_UX_ARCHITECTURE_DIAGRAMS.md) (1,030 lines)
- [Comprehensive UI/UX Authentication Plan](../audit/COMPREHENSIVE_UI_UX_AUTHENTICATION_PLAN.md) (2,800 lines)

**Component References**:
- XeroSetupPrompt.jsx (267 lines)
- ShopifySetupPrompt.jsx (268 lines)
- AmazonSetupPrompt.jsx (250 lines)
- UnleashedSetupPrompt.jsx (194 lines)

**Technical Specifications**:
- Tailwind CSS configuration
- shadcn/ui component library
- TanStack Query patterns
- React Router v6

---

**Epic Status**: 🔄 **READY TO START**
**Priority**: **HIGH** - Critical for production readiness
**Owner**: Scrum Master + Development Team
**Created**: 2025-10-19
**Framework**: BMAD-METHOD v6a Phase 4
**Estimated Duration**: 3 weeks (15 days)
**Projected Duration**: ~4 days (if EPIC-002 velocity holds)
