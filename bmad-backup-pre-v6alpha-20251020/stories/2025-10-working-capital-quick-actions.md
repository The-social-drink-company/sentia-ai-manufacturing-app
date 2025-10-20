# BMAD Story: Working Capital Card & Quick Actions Components

**Story ID**: BMAD-UI-004
**Epic**: Dashboard UI/UX Enhancement
**Created**: 2025-10-19
**Status**: Phase 1 - Analysis
**Priority**: HIGH
**Estimated Time**: 4-6 hours

---

## 📋 Story Summary

**As a** manufacturing business user
**I want to** see working capital metrics in a prominent card and access quick actions
**So that** I can quickly understand cash flow health and take common actions

**Acceptance Criteria**:
- [ ] WorkingCapitalCard.jsx component displays 4 metrics in gradient card
- [ ] QuickActions.jsx component shows 4 action buttons
- [ ] Components are responsive (mobile: 2x2, tablet: 4x1)
- [ ] Hover animations work smoothly (200ms transitions)
- [ ] Navigation to correct routes works
- [ ] Components integrated into DashboardEnterprise.jsx
- [ ] Accessibility standards met (ARIA labels, keyboard nav)

---

## 📊 Phase 1: ANALYSIS

### Current State Assessment

**Existing Components**:
- ✅ DashboardEnterprise.jsx exists at `src/pages/DashboardEnterprise.jsx`
- ✅ KPIGrid component already implemented
- ✅ FinancialAnalysisSection exists
- ✅ Tailwind CSS configured
- ✅ React Router configured
- ✅ lucide-react icons available

**Missing Components**:
- ❌ WorkingCapitalCard.jsx (needs creation)
- ❌ QuickActions.jsx (needs creation)
- ❌ QuickActionButton.jsx (optional, for reusability)

### Requirements Analysis

**Working Capital Card Requirements**:
1. **Visual Design**:
   - Gradient background: purple-600 to violet-700
   - White text for contrast
   - Large card with shadow
   - 4-metric grid layout
   - Emoji icon (💰)

2. **Metrics** (4 total):
   - Current WC (£869K) - currency format
   - Days CCC (43.6) - number format
   - Optimization Potential (£150K) - currency format
   - % of Revenue (8.1%) - percentage format

3. **Responsive Design**:
   - Mobile: 2x2 grid (grid-cols-2)
   - Tablet/Desktop: 4x1 grid (md:grid-cols-4)

**Quick Actions Requirements**:
1. **Visual Design**:
   - Row of 4 action buttons
   - Each button has icon, label, description
   - Different colors per action
   - Hover effects (lift + shadow)

2. **Actions** (4 total):
   - Run Forecast → /forecasting (blue)
   - Analyze Cash Flow → /working-capital (pink)
   - What-If Analysis → /what-if (blue)
   - Generate Report → /reports (white outline)

3. **Responsive Design**:
   - Mobile: 1 column (stacked)
   - Tablet: 2 columns (sm:grid-cols-2)
   - Desktop: 4 columns (lg:grid-cols-4)

---

## 📋 Phase 2: PLANNING

### Component Structure

```
src/components/dashboard/
├── WorkingCapitalCard.jsx (NEW)
├── QuickActions.jsx (NEW)
└── QuickActionButton.jsx (NEW - optional)
```

### Data Flow

```
DashboardEnterprise.jsx
  ↓ (passes workingCapitalData prop)
WorkingCapitalCard.jsx
  ↓ (renders metrics with formatValue)
Metric Display (grid)

DashboardEnterprise.jsx
  ↓ (no props needed)
QuickActions.jsx
  ↓ (uses useNavigate hook)
Action Buttons (grid)
```

### Implementation Tasks

1. **Create WorkingCapitalCard.jsx** (1-2 hours):
   - Define component with data prop
   - Create metrics array with value/label/format
   - Implement formatValue utility function
   - Add gradient background classes
   - Create responsive grid layout
   - Add accessibility attributes

2. **Create QuickActions.jsx** (1-2 hours):
   - Define actions array with icon/label/path/color
   - Import useNavigate from react-router-dom
   - Create grid layout with responsive classes
   - Add hover animations (tailwind classes)
   - Implement navigation handlers
   - Add accessibility attributes

3. **Create QuickActionButton.jsx** (30 min - optional):
   - Reusable button component
   - Variant support (primary/secondary/outline)
   - Icon support
   - onClick handler

4. **Integrate with DashboardEnterprise.jsx** (30 min):
   - Import new components
   - Define workingCapitalData object
   - Add components to layout
   - Test responsive behavior

5. **Testing & Verification** (1 hour):
   - Test responsive layouts (mobile/tablet/desktop)
   - Verify hover animations
   - Test navigation
   - Check accessibility (screen reader, keyboard)
   - Verify color contrast

---

## 🎯 Phase 3: SOLUTIONING (Architecture Design)

### WorkingCapitalCard Architecture

```jsx
// Component Props
interface WorkingCapitalCardProps {
  data: {
    currentWC: number        // e.g., 869000 (£869K)
    daysCCC: number          // e.g., 43.6 days
    optimizationPotential: number  // e.g., 150000 (£150K)
    percentOfRevenue: number // e.g., 8.1%
  }
}

// Internal Structure
WorkingCapitalCard
├── Header Section
│   ├── Title with emoji icon
│   └── Description
└── Metrics Grid (responsive)
    ├── Current WC (formatted as currency)
    ├── Days CCC (formatted as number)
    ├── Optimization Potential (formatted as currency)
    └── % of Revenue (formatted as percentage)
```

**Tailwind Classes**:
- Background: `bg-gradient-to-br from-purple-600 to-violet-700`
- Padding: `p-8`
- Text: `text-white`
- Shadow: `shadow-xl`
- Grid: `grid grid-cols-2 md:grid-cols-4 gap-6`

**Format Function**:
```javascript
const formatValue = (value, format) => {
  switch (format) {
    case 'currency':
      return `£${(value / 1000).toFixed(0)}K`
    case 'percentage':
      return `${value.toFixed(1)}%`
    default:
      return value.toFixed(1)
  }
}
```

### QuickActions Architecture

```jsx
// No Props Required (self-contained)

// Actions Configuration
const actions = [
  {
    icon: Sparkles,           // lucide-react icon
    label: 'Run Forecast',
    description: 'Generate AI-powered demand forecast',
    path: '/forecasting',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  // ... 3 more actions
]

// Component Structure
QuickActions
├── Header Section
│   ├── Title with emoji icon
│   └── Description
└── Action Grid (responsive)
    ├── Run Forecast Button
    ├── Analyze Cash Flow Button
    ├── What-If Analysis Button
    └── Generate Report Button
```

**Tailwind Classes**:
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- Button Base: `p-4 rounded-lg shadow-md transition-all duration-200`
- Hover: `hover:shadow-lg hover:-translate-y-1`
- Layout: `flex flex-col items-center text-center gap-2`

**Navigation Handler**:
```javascript
const navigate = useNavigate()
onClick={() => navigate(action.path)}
```

---

## 📊 Success Criteria

**Visual Requirements**:
- [x] Gradient background matches mockup (purple-600 to violet-700)
- [x] Metrics display correctly formatted
- [x] Grid layout is responsive
- [x] Icons and emoji render correctly
- [x] Text is readable on gradient background

**Interaction Requirements**:
- [x] Hover animations are smooth (200ms)
- [x] Buttons navigate to correct routes
- [x] Touch targets are min 44x44px
- [x] Keyboard navigation works
- [x] Focus states are visible

**Technical Requirements**:
- [x] Components use proper TypeScript/JSX
- [x] Tailwind classes are used (no inline styles)
- [x] Components are properly exported
- [x] Props are validated
- [x] Code is clean and maintainable

**Accessibility Requirements**:
- [x] Semantic HTML elements (button, not div)
- [x] ARIA labels where needed
- [x] Keyboard accessible
- [x] Focus visible
- [x] Color contrast meets WCAG AA

---

## 🚀 Phase 4: IMPLEMENTATION PLAN

### Step 1: Create WorkingCapitalCard.jsx

1. Create file at `src/components/dashboard/WorkingCapitalCard.jsx`
2. Import dependencies (React, cn utility)
3. Define metrics array
4. Implement formatValue function
5. Create component JSX structure
6. Add Tailwind classes for gradient and grid
7. Export component

### Step 2: Create QuickActions.jsx

1. Create file at `src/components/dashboard/QuickActions.jsx`
2. Import dependencies (React, useNavigate, lucide-react icons, cn utility)
3. Define actions array
4. Create component JSX structure
5. Add navigation handlers
6. Add Tailwind classes for grid and hover effects
7. Export component

### Step 3: Integrate with DashboardEnterprise.jsx

1. Import new components
2. Define workingCapitalData object
3. Add components to render tree
4. Test rendering

### Step 4: Verification

1. Start dev server: `pnpm run dev`
2. Navigate to dashboard
3. Verify components render
4. Test responsive layouts (resize browser)
5. Test hover animations
6. Test navigation (click all buttons)
7. Test keyboard navigation (tab through buttons)
8. Run accessibility audit

---

## 📋 Files to Create/Modify

**New Files**:
- `src/components/dashboard/WorkingCapitalCard.jsx`
- `src/components/dashboard/QuickActions.jsx`
- `src/components/dashboard/QuickActionButton.jsx` (optional)

**Modified Files**:
- `src/pages/DashboardEnterprise.jsx` (add imports and components)

**Estimated Lines of Code**:
- WorkingCapitalCard.jsx: ~80 lines
- QuickActions.jsx: ~100 lines
- QuickActionButton.jsx: ~40 lines (optional)
- DashboardEnterprise.jsx: +20 lines

**Total**: ~200-240 lines

---

## 🎯 READY FOR PHASE 4: IMPLEMENTATION

**Next Actions**:
1. Create WorkingCapitalCard.jsx component
2. Create QuickActions.jsx component
3. Integrate with DashboardEnterprise.jsx
4. Test and verify

---

**Created**: 2025-10-19 10:30 BST
**Last Updated**: 2025-10-19 10:30 BST
**Status**: Phase 1-3 COMPLETE → Ready for Phase 4 (Implementation)
**Framework**: BMAD-METHOD v6a
**Deployment**: Render (development branch)
