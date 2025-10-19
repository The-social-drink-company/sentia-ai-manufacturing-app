# BMAD-UX-001: Loading Skeletons

**Epic**: EPIC-003 - Frontend Polish & UX Enhancement
**Story ID**: BMAD-UX-001
**Priority**: MEDIUM
**Estimated Effort**: 2 days (baseline) → 4-6 hours (projected with 4.1x velocity)
**Dependencies**: None
**Status**: PENDING

---

## Story Description

Implement skeleton loading states across all dashboard pages to improve perceived performance and provide visual feedback during data fetching. Replace generic spinners with content-aware skeleton screens that match the layout of the loaded content.

### Business Value

- **User Experience**: Reduces perceived loading time by 40-60%
- **Professional Polish**: Modern loading patterns expected in enterprise applications
- **Visual Continuity**: Maintains layout stability during data transitions
- **Reduced Bounce Rate**: Users are more likely to wait when they see structured loading feedback

### Current State

- Most pages use generic `<Spinner />` components or no loading states
- Some pages show blank screens during data fetching
- No consistent loading pattern across the application
- Loading states don't reflect the structure of loaded content

### Desired State

- All dashboard pages implement skeleton loading screens
- Skeletons match the layout and structure of loaded content
- Consistent skeleton component library available
- Smooth transitions from skeleton to actual content
- Loading states visible during SSE connection establishment

---

## Acceptance Criteria

### AC1: Skeleton Component Library Created
**Given** a need for consistent loading patterns
**When** developers need skeleton components
**Then** a reusable skeleton component library exists with:
- `<SkeletonCard />` - for card-based layouts
- `<SkeletonTable />` - for data tables
- `<SkeletonChart />` - for chart placeholders
- `<SkeletonText />` - for text content
- `<SkeletonKPI />` - for KPI cards
- Animation: subtle pulse/shimmer effect
- Accessibility: proper ARIA labels (`aria-busy="true"`)

**Status**: ⏳ PENDING

---

### AC2: Dashboard Page Skeletons Implemented
**Given** user navigates to `/dashboard`
**When** data is loading from SSE or API
**Then** skeleton components display matching the actual layout:
- KPI strip: 4 skeleton KPI cards
- Charts: skeleton chart placeholders in grid layout
- Tables: skeleton table with 5-10 rows
- Smooth fade-in transition when real data arrives

**Status**: ⏳ PENDING

---

### AC3: Working Capital Page Skeletons Implemented
**Given** user navigates to `/working-capital`
**When** Xero data is loading
**Then** skeleton components display:
- Financial summary cards: 3 skeleton cards
- Cash flow chart: skeleton chart placeholder
- Recommendations table: skeleton table
- Quick actions panel: skeleton action cards

**Status**: ⏳ PENDING

---

### AC4: Production Dashboard Skeletons Implemented
**Given** user navigates to `/production`
**When** Unleashed ERP data is loading
**Then** skeleton components display:
- Production metrics: 4 skeleton KPI cards
- Assembly jobs table: skeleton table with 10 rows
- Quality alerts: skeleton alert cards
- Schedule timeline: skeleton timeline view

**Status**: ⏳ PENDING

---

### AC5: Inventory Page Skeletons Implemented
**Given** user navigates to `/inventory`
**When** Shopify/Amazon data is loading
**Then** skeleton components display:
- Stock summary: 9 skeleton SKU cards (3x3 grid)
- Channel allocation chart: skeleton chart
- Reorder recommendations: skeleton table
- Low stock alerts: skeleton alert cards

**Status**: ⏳ PENDING

---

### AC6: Smooth Transitions Implemented
**Given** skeleton loading state is displayed
**When** actual data arrives from API/SSE
**Then** transition includes:
- 200-300ms fade-in animation
- No layout shift (skeleton matches content dimensions)
- No flash of unstyled content (FOUC)
- Progressive enhancement (content loads in logical order)

**Status**: ⏳ PENDING

---

## Technical Context

### Files to Create

**New Skeleton Component Library**:
```
src/components/skeletons/
├── SkeletonCard.jsx          # Generic card skeleton
├── SkeletonTable.jsx         # Table skeleton with rows/columns
├── SkeletonChart.jsx         # Chart placeholder
├── SkeletonText.jsx          # Text line skeletons
├── SkeletonKPI.jsx           # KPI card skeleton
└── index.js                  # Export all skeletons
```

**Example Implementation** (`SkeletonCard.jsx`):
```jsx
import React from 'react'

export default function SkeletonCard({ rows = 3, hasHeader = true }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      {hasHeader && (
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  )
}
```

### Files to Modify

**Dashboard Pages** (add skeleton loading states):
- `src/pages/production/ProductionDashboard.jsx`
- `src/pages/WorkingCapital.jsx`
- `src/pages/inventory/InventoryManagement.jsx`
- `src/pages/dashboard/EnhancedDashboard.jsx`
- `src/pages/forecasting/DemandForecasting.jsx`
- `src/pages/reports/FinancialReports.jsx`

**Pattern to Follow**:
```jsx
// Before (generic spinner)
if (isLoading) return <Spinner />

// After (skeleton matching content)
if (isLoading) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKPI key={i} />
        ))}
      </div>
      <SkeletonChart height="400px" />
      <SkeletonTable rows={10} columns={5} />
    </div>
  )
}
```

### Dependencies

**Existing Libraries**:
- Tailwind CSS (already available) - for animations and styling
- React (already available) - component framework

**No New Dependencies Required** - use pure CSS animations via Tailwind

### Animation Strategy

**CSS Animation** (add to `src/styles/skeletons.css`):
```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton-shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(
    to right,
    #f0f0f0 0%,
    #e0e0e0 20%,
    #f0f0f0 40%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
}
```

**Tailwind Config** (alternative to CSS):
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        }
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear'
      }
    }
  }
}
```

---

## Testing Requirements

### Manual Testing Checklist

- [ ] **Visual Verification**: Skeleton layouts match actual content structure
- [ ] **Transition Smoothness**: No jarring layout shifts when data loads
- [ ] **Animation Performance**: Shimmer effect runs smoothly at 60fps
- [ ] **Accessibility**: Screen readers announce "Loading..." state
- [ ] **Dark Mode**: Skeletons visible in both light/dark themes
- [ ] **Responsive**: Skeletons adapt to mobile/tablet/desktop layouts

### Test Scenarios

**Test 1: Cold Load (No Cache)**
1. Clear browser cache
2. Navigate to `/dashboard`
3. Verify skeleton displays immediately
4. Verify smooth transition when data arrives (2-3 seconds later)

**Test 2: Slow Network Simulation**
1. Enable Chrome DevTools network throttling (Slow 3G)
2. Navigate to each dashboard page
3. Verify skeletons remain visible throughout loading
4. Verify no blank screens or spinners

**Test 3: SSE Connection Delay**
1. Temporarily disable SSE server
2. Navigate to pages relying on SSE
3. Verify skeletons display indefinitely until connection establishes
4. Verify proper error state if connection fails (see BMAD-UX-002)

**Test 4: Accessibility Audit**
1. Use screen reader (NVDA/JAWS)
2. Navigate to loading pages
3. Verify "Loading..." or "Fetching data..." is announced
4. Verify loading state is announced when completed

---

## Implementation Plan

### Phase 1: Component Library (2-3 hours)
1. Create `src/components/skeletons/` directory
2. Implement 5 core skeleton components
3. Add shimmer animation CSS
4. Test components in isolation (Storybook if available, or standalone test page)

### Phase 2: Dashboard Integration (1-2 hours)
1. Update `ProductionDashboard.jsx` with skeleton states
2. Update `WorkingCapital.jsx` with skeleton states
3. Update `EnhancedDashboard.jsx` with skeleton states
4. Test transitions and animations

### Phase 3: Secondary Pages (1-2 hours)
1. Update `InventoryManagement.jsx` with skeleton states
2. Update `DemandForecasting.jsx` with skeleton states
3. Update `FinancialReports.jsx` with skeleton states
4. Cross-browser testing (Chrome, Firefox, Safari, Edge)

### Phase 4: Accessibility & Polish (30 min - 1 hour)
1. Add ARIA labels and loading announcements
2. Verify keyboard navigation doesn't break during loading
3. Test dark mode compatibility
4. Final QA review

---

## Definition of Done

- [ ] ✅ All 5 skeleton components created and reusable
- [ ] ✅ All 6 dashboard pages implement skeleton loading states
- [ ] ✅ Smooth transitions with no layout shift
- [ ] ✅ Shimmer animation works smoothly across browsers
- [ ] ✅ Accessibility: Screen readers announce loading states
- [ ] ✅ Dark mode: Skeletons visible and styled appropriately
- [ ] ✅ Responsive: Skeletons work on mobile/tablet/desktop
- [ ] ✅ Zero ESLint warnings introduced
- [ ] ✅ Code reviewed and approved
- [ ] ✅ Committed to `development` branch with descriptive message
- [ ] ✅ Deployed to Render development environment and verified

---

## Related Stories

- **BMAD-UX-002** (Error Boundaries): Complements loading states with error states
- **BMAD-UX-003** (Integrate Setup Prompts): Empty states when no API credentials configured
- **BMAD-UX-004** (Mobile Responsiveness): Skeletons must adapt to mobile layouts

---

## Notes

**Design References**:
- **Linear**: Excellent skeleton loading patterns for task lists
- **GitHub**: Code skeleton loading during search
- **Stripe Dashboard**: Financial data skeleton states
- **Notion**: Content-aware loading skeletons

**Performance Considerations**:
- Skeletons should render instantly (< 50ms)
- Avoid complex animations that cause jank on low-end devices
- Use CSS animations instead of JavaScript for better performance
- Consider reduced-motion preferences (`prefers-reduced-motion: reduce`)

**Pattern Consistency**:
- All skeletons use same color palette (`bg-gray-200` for light mode)
- All skeletons use same animation duration (2s)
- All skeletons use same border radius as actual content
- All skeletons maintain same spacing as actual content

---

**Story Created**: 2025-10-19
**Last Updated**: 2025-10-19
**BMAD-METHOD Phase**: Planning (Phase 2)
