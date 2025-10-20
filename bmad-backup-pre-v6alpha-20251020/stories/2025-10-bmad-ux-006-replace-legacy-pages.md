# BMAD-UX-006: Replace Legacy Dashboard Pages

**Epic**: EPIC-003 - Frontend Polish & UX Enhancement
**Story ID**: BMAD-UX-006
**Priority**: MEDIUM
**Estimated Effort**: 2 days (baseline) → 4-6 hours (projected with 4.1x velocity)
**Dependencies**: BMAD-UX-001, BMAD-UX-002, BMAD-UX-003 (polished components ready)
**Status**: PENDING

---

## Story Description

Replace or deprecate legacy dashboard pages that use outdated components, placeholder content, or duplicate functionality. Consolidate user experience into modern, polished pages (ProductionDashboard, WorkingCapital, EnhancedDashboard) and remove or redirect old routes.

### Business Value

- **Reduced Maintenance**: Fewer duplicate pages to maintain
- **Consistent UX**: Users see only modern, polished interfaces
- **Performance**: Remove unused code, reduce bundle size
- **User Clarity**: No confusion between "old" and "new" versions of pages
- **Code Quality**: Clean up technical debt accumulated during development

### Current State

- Multiple versions of similar pages exist (e.g., `/dashboard` vs `/dashboard/basic`)
- Some pages use placeholder content or outdated components
- Legacy pages may bypass new error boundaries, loading states, setup prompts
- Unclear which pages are "canonical" for users
- Code bloat from maintaining parallel implementations

### Desired State

- Single canonical version of each page type
- All pages use modern components (loading skeletons, error boundaries, setup prompts)
- Legacy routes either removed or redirect to modern equivalents
- Clear navigation structure (no duplicate menu items)
- Reduced bundle size from removing unused code

---

## Acceptance Criteria

### AC1: Legacy Dashboard Routes Identified and Documented
**Given** a need to consolidate dashboard pages
**When** auditing existing routes
**Then** documentation includes:
- List of all dashboard routes (current state)
- Classification: "Keep", "Deprecate", "Redirect", "Remove"
- Mapping of old routes to new canonical routes
- Breaking changes documented (if any)
- Migration plan for bookmarked URLs (redirects vs 404s)

**Status**: ⏳ PENDING

---

### AC2: Basic Dashboard Deprecated or Removed
**Given** `/dashboard/basic` exists as fallback
**And** `/dashboard` (EnhancedDashboard) is fully functional
**When** users navigate to `/dashboard/basic`
**Then** one of the following occurs:
- **Option A (Deprecation)**: Show banner "This page is deprecated. Use the new Dashboard" with link to `/dashboard`
- **Option B (Redirect)**: Automatically redirect to `/dashboard`
- **Option C (Remove)**: Route removed entirely (404)

**Decision Required**: Confirm with stakeholders which approach

**Status**: ⏳ PENDING

---

### AC3: Placeholder/Demo Pages Removed
**Given** some pages exist with "coming soon" or placeholder content
**When** auditing all routes in `src/pages/`
**Then** placeholder pages are:
- **Identified**: List all pages with minimal/placeholder content
- **Evaluated**: Determine if functionality exists in other pages
- **Removed or Redirected**: Pages with no unique value removed
- **Documented**: Any breaking changes noted in changelog

**Examples of placeholder pages** (to verify and potentially remove):
- Pages showing only "Feature coming soon" messages
- Pages with hardcoded sample data (no real functionality)
- Duplicate analytics/reports pages with identical content

**Status**: ⏳ PENDING

---

### AC4: Duplicate Functionality Consolidated
**Given** multiple pages may display similar information
**When** reviewing all pages
**Then** duplicates are consolidated:
- **Financial Data**: Consolidated into `/working-capital` and `/reports/financial`
- **Production Metrics**: Consolidated into `/production`
- **Inventory**: Consolidated into `/inventory`
- **Analytics**: Consolidated into main `/dashboard`
- No two pages show identical widgets/data without clear differentiation

**Status**: ⏳ PENDING

---

### AC5: Navigation Menu Updated
**Given** legacy pages removed or deprecated
**When** users view sidebar navigation
**Then** navigation menu:
- Only shows active, canonical pages
- No menu items linking to removed pages
- No duplicate menu items for same functionality
- Logical grouping (Dashboards, Operations, Reports, Admin)
- Breadcrumbs reflect current canonical structure

**Update**: `src/components/layout/Sidebar.jsx`

**Status**: ⏳ PENDING

---

### AC6: Redirects Implemented for Bookmarked URLs
**Given** users may have bookmarked legacy URLs
**When** navigating to deprecated route
**Then** user is redirected:
- HTTP 301 (permanent redirect) for removed pages with clear replacements
- HTTP 404 with helpful "Page not found" message if no replacement
- "Page not found" includes suggestions for similar pages
- All redirects logged for analytics (track usage of legacy URLs)

**Implementation**: React Router redirects or server-side redirects

**Status**: ⏳ PENDING

---

### AC7: Bundle Size Reduced
**Given** legacy code removed
**When** building production bundle
**Then** bundle size metrics improve:
- Measure before: `pnpm run build` → note bundle size
- Remove legacy pages and components
- Measure after: `pnpm run build` → note bundle size
- **Target**: ≥ 5% reduction in bundle size
- Document savings in retrospective

**Status**: ⏳ PENDING

---

## Technical Context

### Files to Audit and Potentially Remove

**Dashboard Pages** (check for duplicates):
```
src/pages/
├── dashboard/
│   ├── EnhancedDashboard.jsx      # KEEP (canonical dashboard)
│   ├── BasicDashboard.jsx         # EVALUATE (fallback or remove?)
│   └── DashboardLayout.jsx        # KEEP (shared layout)
├── production/
│   └── ProductionDashboard.jsx    # KEEP (canonical production page)
├── WorkingCapital.jsx             # KEEP (canonical financial page)
├── inventory/
│   └── InventoryManagement.jsx    # KEEP (canonical inventory page)
├── forecasting/
│   └── DemandForecasting.jsx      # KEEP (unique functionality)
├── reports/
│   └── FinancialReports.jsx       # KEEP (unique reports page)
├── admin/
│   └── AdminPanel.jsx             # KEEP (unique admin functionality)
```

**Components to Audit**:
```
src/components/
├── widgets/                       # KEEP (modern widgets)
├── legacy/                        # REMOVE (if exists)
├── old/                           # REMOVE (if exists)
└── deprecated/                    # REMOVE (if exists)
```

**Example: Remove Legacy Component**:
```bash
# Find unused components
npx depcheck

# Search for imports of specific component
grep -r "import.*OldDashboard" src/
```

### Routes to Audit

**Check** `src/App.jsx` or router configuration for all routes:
```jsx
// Example routes
<Routes>
  <Route path="/dashboard" element={<EnhancedDashboard />} />
  <Route path="/dashboard/basic" element={<BasicDashboard />} /> {/* EVALUATE */}
  <Route path="/production" element={<ProductionDashboard />} />
  <Route path="/working-capital" element={<WorkingCapital />} />
  <Route path="/inventory" element={<InventoryManagement />} />
  <Route path="/forecasting" element={<DemandForecasting />} />
  <Route path="/reports/financial" element={<FinancialReports />} />
  <Route path="/admin" element={<AdminPanel />} />
  {/* Any other routes to evaluate */}
</Routes>
```

### Implementing Redirects

**React Router Redirect** (client-side):
```jsx
import { Navigate } from 'react-router-dom'

// Redirect old route to new route
<Route path="/old-dashboard" element={<Navigate to="/dashboard" replace />} />
```

**Server-Side Redirect** (Express):
```javascript
// server.js
app.get('/old-dashboard', (req, res) => {
  res.redirect(301, '/dashboard')
})
```

**Deprecation Banner** (if keeping page temporarily):
```jsx
export default function BasicDashboard() {
  return (
    <div>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              This page is deprecated. Please use the{' '}
              <a href="/dashboard" className="font-medium underline hover:text-yellow-600">
                new Dashboard
              </a>
              {' '}instead.
            </p>
          </div>
        </div>
      </div>
      {/* Rest of legacy page content */}
    </div>
  )
}
```

### Bundle Size Analysis

**Measure Bundle Size**:
```bash
# Build production bundle
pnpm run build

# Output shows bundle sizes:
# dist/assets/index-abc123.js  523.45 kB │ gzip: 167.89 kB
```

**Analyze Bundle** (optional):
```bash
# Install bundle analyzer
npm install --save-dev vite-plugin-visualizer

# Add to vite.config.js
import { visualizer } from 'vite-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
})

# Build to generate report
pnpm run build
```

### Migration Checklist

**Before Removing Page**:
1. ✅ Verify page is truly unused (check analytics if available)
2. ✅ Search codebase for links to page (`grep -r "/old-page" src/`)
3. ✅ Check if page linked in documentation
4. ✅ Decide: Redirect vs Remove (bookmarked URLs?)
5. ✅ Update navigation menu
6. ✅ Test that new canonical page covers all functionality
7. ✅ Document breaking change (if external links exist)

---

## Testing Requirements

### Manual Testing Checklist

- [ ] **Navigation**: All menu items link to active, canonical pages
- [ ] **Redirects**: Deprecated routes redirect to correct new routes
- [ ] **Bookmarks**: Test bookmarked legacy URLs (manually or with analytics)
- [ ] **Functionality**: Canonical pages cover all legacy page functionality
- [ ] **Bundle Size**: Verify bundle size reduction after removal
- [ ] **Broken Links**: No 404s when clicking navigation or internal links

### Test Scenarios

**Test 1: Identify Legacy Pages**
1. Review all routes in `src/App.jsx`
2. Navigate to each route manually
3. Document pages with:
   - "Coming soon" messages
   - Minimal/placeholder content
   - Duplicate functionality
4. Create removal plan (what to keep, redirect, remove)

**Test 2: Test Redirects**
1. Implement redirects for deprecated routes
2. Navigate to old URL (e.g., `/old-dashboard`)
3. **Expected**: Automatically redirect to new URL (e.g., `/dashboard`)
4. Verify URL in browser address bar updates
5. Test with React Router DevTools (confirm route change)

**Test 3: Navigation Menu Accuracy**
1. Review sidebar navigation
2. Click every menu item
3. **Expected**: All links go to active, functional pages
4. **Expected**: No duplicate menu items
5. Verify logical grouping and order

**Test 4: Bundle Size Reduction**
1. Before removing legacy pages:
   ```bash
   pnpm run build
   # Note bundle size: e.g., 523.45 kB
   ```
2. Remove legacy pages and components
3. After removal:
   ```bash
   pnpm run build
   # Note new bundle size: e.g., 487.12 kB
   ```
4. Calculate reduction:
   ```
   (523.45 - 487.12) / 523.45 = 6.9% reduction ✅
   ```
5. Document in retrospective

**Test 5: Functionality Coverage**
1. For each removed legacy page, document its purpose
2. Navigate to canonical replacement page
3. Verify all functionality from legacy page exists in new page
4. **Example**:
   - **Legacy**: `/dashboard/basic` showed 4 KPI cards
   - **New**: `/dashboard` shows same 4 KPIs plus additional insights ✅

**Test 6: Broken Link Audit**
1. Use browser extension or script to find broken links
2. Navigate through all pages
3. Click every internal link
4. **Expected**: No 404 errors
5. Fix any broken links found

---

## Implementation Plan

### Phase 1: Audit & Documentation (1-2 hours)
1. List all routes in `src/App.jsx`
2. Navigate to each route and document state
3. Classify each page: Keep, Deprecate, Redirect, Remove
4. Create removal/consolidation plan
5. Document in `docs/page-consolidation-plan.md`

### Phase 2: Remove Duplicate Functionality (1-2 hours)
1. Identify pages with duplicate widgets/data
2. Consolidate into canonical pages
3. Update any references to removed pages
4. Test canonical pages cover all use cases

### Phase 3: Implement Redirects (1 hour)
1. Add React Router redirects for deprecated routes
2. Add server-side redirects (if needed)
3. Test redirects work correctly
4. Consider adding deprecation banners (temporary)

### Phase 4: Update Navigation (30 min - 1 hour)
1. Remove deprecated pages from sidebar menu
2. Reorganize menu items logically
3. Test navigation flows
4. Update breadcrumbs (if applicable)

### Phase 5: Remove Legacy Code (1 hour)
1. Delete unused page components
2. Delete unused legacy components
3. Run `npx depcheck` to find unused dependencies
4. Remove unused imports
5. Build and verify no errors

### Phase 6: Testing & Verification (1 hour)
1. Test all navigation paths
2. Test redirects from legacy URLs
3. Measure bundle size reduction
4. Run full application regression test
5. Document changes in changelog

---

## Definition of Done

- [ ] ✅ All routes audited and documented (Keep, Deprecate, Redirect, Remove)
- [ ] ✅ Legacy pages removed or deprecated with clear plan
- [ ] ✅ Redirects implemented for bookmarked legacy URLs
- [ ] ✅ Navigation menu updated (no links to removed pages)
- [ ] ✅ Duplicate functionality consolidated into canonical pages
- [ ] ✅ Bundle size reduced by ≥ 5% (or documented why not)
- [ ] ✅ All internal links functional (no 404s)
- [ ] ✅ Canonical pages cover all legacy page functionality
- [ ] ✅ Breaking changes documented in changelog
- [ ] ✅ Zero ESLint warnings introduced
- [ ] ✅ Code reviewed and approved
- [ ] ✅ Committed to `development` branch with descriptive message
- [ ] ✅ Deployed to Render development environment and verified

---

## Related Stories

- **BMAD-UX-001** (Loading Skeletons): Legacy pages may lack loading states
- **BMAD-UX-002** (Error Boundaries): Legacy pages may lack error handling
- **BMAD-UX-003** (Setup Prompts): Legacy pages may lack setup guidance
- **BMAD-UX-007** (Loading Animations): Ensure removed pages don't break animations

---

## Notes

**Why This Matters**:
- **Technical Debt**: Legacy pages accumulate bugs and inconsistencies
- **User Confusion**: Multiple versions of same page creates poor UX
- **Maintenance Burden**: More code to maintain and test
- **Performance**: Unused code increases bundle size and load times
- **Quality**: Modern pages have better error handling, loading states, polish

**Common Legacy Page Types**:
1. **Old Dashboard Versions**: Replaced by EnhancedDashboard
2. **Placeholder Pages**: "Feature coming soon" with no real content
3. **Duplicate Reports**: Multiple pages showing same data
4. **Prototype Pages**: Built during exploration, never completed
5. **Demo Pages**: Used for testing, not meant for production

**Deprecation Strategy**:
- **Immediate Removal**: Pages with < 1% traffic (check analytics)
- **Redirect**: Pages with > 1% traffic but clear replacement
- **Deprecation Banner**: Pages with significant traffic, give users time to adapt
- **Keep Temporarily**: Critical pages used by stakeholders (plan migration)

**Communication**:
- Notify stakeholders if removing pages they use
- Add changelog entry for breaking changes
- Consider email notification if many users affected
- Provide clear migration path in deprecation messages

**Design References**:
- **GitHub**: Clean route structure, clear redirects from deprecated URLs
- **Stripe**: Consolidated dashboard views, removed duplicate pages
- **Notion**: Simplified navigation after removing redundant templates
- **Linear**: Clean page hierarchy with minimal duplication

---

**Story Created**: 2025-10-19
**Last Updated**: 2025-10-19
**BMAD-METHOD Phase**: Planning (Phase 2)
