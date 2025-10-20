# Tooltip Implementation Guide (BMAD-UX-008)

**Date**: 2025-10-19
**Story**: BMAD-UX-008 (Add Tooltips & Contextual Help Text)
**Status**: Foundation Complete
**Framework**: Radix UI Tooltip + shadcn/ui styling

---

## Overview

This guide covers the tooltip system implemented for the CapLiquify Manufacturing Platform. The system provides 5 specialized tooltip components for different use cases, all built on Radix UI primitives for accessibility.

---

## Components Available

### 1. SimpleTooltip - General Purpose

**Use Case**: Quick tooltips for any element

**Example**:
```jsx
import { SimpleTooltip } from '@/components/ui/tooltip-helpers'

<SimpleTooltip content="Refresh data">
  <button className="p-2 rounded hover:bg-slate-100">
    <RefreshIcon className="h-5 w-5" />
  </button>
</SimpleTooltip>
```

**Props**:
- `content` (string) - Tooltip text
- `side` ('top' | 'right' | 'bottom' | 'left') - Position (default: 'top')
- `children` (ReactNode) - Trigger element

**Features**:
- ✅ Keyboard accessible (shows on focus)
- ✅ Instant display (0ms delay)
- ✅ Smooth fade + zoom animations
- ✅ Arrow indicator

---

### 2. IconTooltip - Icon-Only Buttons

**Use Case**: Icon buttons without visible text labels (WCAG 2.1 AA requirement)

**Example**:
```jsx
import { IconTooltip } from '@/components/ui/tooltip-helpers'

<IconTooltip label="Delete item">
  <button className="p-2 text-red-600 hover:bg-red-50 rounded">
    <TrashIcon className="h-5 w-5" />
  </button>
</IconTooltip>
```

**Props**:
- `label` (string) - Accessible label and tooltip text
- `side` ('top' | 'right' | 'bottom' | 'left') - Position (default: 'bottom')
- `children` (ReactNode) - Button element

**Features**:
- ✅ Auto-adds aria-label for screen readers
- ✅ WCAG 2.1 AA compliant
- ✅ Touch-friendly (long-press support)
- ✅ Keyboard navigation

**Important**: All icon-only buttons MUST use IconTooltip for accessibility compliance.

---

### 3. HelpTooltip - Industry Terms & Explanations

**Use Case**: Explain complex manufacturing terminology inline

**Example**:
```jsx
import { HelpTooltip } from '@/components/ui/tooltip-helpers'

<div className="text-sm text-slate-600">
  <HelpTooltip content="Days Sales Outstanding (DSO) measures the average number of days it takes to collect payment after a sale. Lower is better for cash flow.">
    DSO
  </HelpTooltip>
  : 45 days
</div>
```

**Props**:
- `content` (string | ReactNode) - Explanation text (can be multiline)
- `side` ('top' | 'right' | 'bottom' | 'left') - Position (default: 'top')
- `children` (ReactNode) - Term to explain

**Features**:
- ✅ Question mark icon built-in
- ✅ Dotted underline (standard help styling)
- ✅ Max-width: 320px (text-balance for readability)
- ✅ Cursor: help

**When to Use**:
- Manufacturing terms (OEE, FPY, Yield, Lead Time)
- Financial metrics (DSO, DPO, DIO, Working Capital)
- Business abbreviations
- Complex concepts needing explanation

---

### 4. AbbrTooltip - Abbreviations & Acronyms

**Use Case**: Expand abbreviations for clarity

**Example**:
```jsx
import { AbbrTooltip } from '@/components/ui/tooltip-helpers'

<div className="text-2xl font-bold">
  <AbbrTooltip abbr="OEE" full="Overall Equipment Effectiveness">
    OEE
  </AbbrTooltip>
  : 94.2%
</div>
```

**Props**:
- `abbr` (string) - The abbreviation
- `full` (string) - Full term
- `side` ('top' | 'right' | 'bottom' | 'left') - Position (default: 'top')
- `children` (ReactNode) - Optional (defaults to abbr)

**Features**:
- ✅ Semantic <abbr> element (SEO + screen readers)
- ✅ Dotted underline (standard abbreviation styling)
- ✅ Title attribute fallback (works without JS)
- ✅ Keyboard accessible

**Common Abbreviations**:
- **OEE**: Overall Equipment Effectiveness
- **FPY**: First Pass Yield
- **DSO**: Days Sales Outstanding
- **DPO**: Days Payable Outstanding
- **DIO**: Days Inventory Outstanding
- **WC**: Working Capital
- **AR**: Accounts Receivable
- **AP**: Accounts Payable
- **COGS**: Cost of Goods Sold
- **P&L**: Profit & Loss
- **SKU**: Stock Keeping Unit
- **ERP**: Enterprise Resource Planning
- **MES**: Manufacturing Execution System

---

### 5. BadgeTooltip - Status Indicators

**Use Case**: Add explanations to status badges

**Example**:
```jsx
import { BadgeTooltip } from '@/components/ui/tooltip-helpers'

<BadgeTooltip status="success" tooltip="All 4 integrations connected: Xero, Shopify, Amazon, Unleashed">
  Active
</BadgeTooltip>

<BadgeTooltip status="warning" tooltip="Xero connection requires re-authentication">
  Limited
</BadgeTooltip>

<BadgeTooltip status="error" tooltip="Amazon SP-API credentials missing - click to configure">
  Disconnected
</BadgeTooltip>
```

**Props**:
- `status` ('success' | 'warning' | 'error' | 'info' | 'default') - Badge color
- `tooltip` (string | ReactNode) - Explanation
- `side` ('top' | 'right' | 'bottom' | 'left') - Position (default: 'top')
- `children` (ReactNode) - Badge text

**Features**:
- ✅ Color-coded status indicators
- ✅ Cursor: help
- ✅ Keyboard accessible

---

## Implementation Priorities

### Phase 1: High Priority (Icon Buttons - Accessibility Critical) ⚠️

**Requirement**: All icon-only buttons MUST have tooltips for WCAG 2.1 AA compliance.

**Locations to Implement**:
1. **Dashboard Header** (`src/components/layout/DashboardHeader.jsx`)
   - Notifications icon
   - User menu icon
   - Command palette icon (⌘K)
   - System status indicator

2. **Data Tables** (All pages with tables)
   - Edit icon buttons
   - Delete icon buttons
   - Export icon buttons
   - Filter icon buttons
   - Sort icons

3. **KPI Cards** (`src/components/dashboard/KPICard.jsx`)
   - Info icon (shows calculation method)
   - Trend icon (shows period comparison)
   - Drill-down icon

4. **Chart Components** (All Recharts visualizations)
   - Fullscreen toggle
   - Download chart icon
   - Chart type selector icons

5. **Navigation Sidebar** (`src/components/layout/DashboardSidebar.jsx`)
   - Collapse/expand icon (mobile)
   - Each nav item icon (optional, but helpful)

**Estimated Time**: 3-4 hours to add to all icon buttons

---

### Phase 2: Medium Priority (Industry Terms & Abbreviations)

**Locations to Implement**:
1. **Working Capital Dashboard** (`src/components/WorkingCapital/RealWorkingCapital.jsx`)
   - DSO, DPO, DIO, Cash Conversion Cycle
   - Accounts Receivable, Accounts Payable
   - Operating Cycle, Financial Cycle

2. **Production Dashboard** (`src/pages/production/ProductionDashboard.jsx`)
   - OEE (Overall Equipment Effectiveness)
   - Availability, Performance, Quality (OEE components)
   - FPY (First Pass Yield)
   - Downtime categories

3. **Financial Reports** (`src/pages/Financial/FinancialReports.jsx`)
   - P&L, COGS, Gross Margin, Net Profit
   - Revenue, Expenses, EBITDA

4. **Inventory Management** (`src/components/InventoryManagement.jsx`)
   - SKU, Lead Time, Reorder Point, Safety Stock
   - ABC Analysis categories

**Estimated Time**: 4-5 hours to add to all key terms

---

### Phase 3: Low Priority (Contextual Help & Enhancements)

**Locations to Implement**:
1. **Form Fields** (All forms)
   - Help text for complex fields
   - Validation rules explanation
   - Format requirements (e.g., "YYYY-MM-DD")

2. **Dashboard Widgets** (All widget types)
   - Widget purpose explanation
   - Data source indicator
   - Last updated timestamp

3. **Status Badges** (Throughout app)
   - Integration status explanations
   - Job status details
   - Alert severity context

**Estimated Time**: 3-4 hours for comprehensive coverage

---

## Implementation Examples

### Example 1: Icon Button in Dashboard Header

**Before** (no tooltip, fails WCAG 2.1 AA):
```jsx
<button className="p-2 rounded hover:bg-slate-100">
  <BellIcon className="h-5 w-5" />
</button>
```

**After** (with tooltip, accessible):
```jsx
import { IconTooltip } from '@/components/ui/tooltip-helpers'

<IconTooltip label="View notifications (3 unread)">
  <button className="p-2 rounded hover:bg-slate-100">
    <BellIcon className="h-5 w-5" />
    {hasUnread && <span className="sr-only">3 unread</span>}
  </button>
</IconTooltip>
```

---

### Example 2: Industry Term Explanation

**Before** (unclear term):
```jsx
<div className="text-sm font-semibold">DSO: 45 days</div>
```

**After** (with help tooltip):
```jsx
import { HelpTooltip } from '@/components/ui/tooltip-helpers'

<div className="text-sm font-semibold">
  <HelpTooltip content="Days Sales Outstanding (DSO) measures the average number of days it takes to collect payment after a sale. Lower is better for cash flow.">
    DSO
  </HelpTooltip>
  : 45 days
</div>
```

---

### Example 3: Abbreviation in Chart Legend

**Before** (abbreviation without expansion):
```jsx
<div className="flex items-center gap-2">
  <div className="h-3 w-3 bg-blue-500 rounded" />
  <span className="text-xs">OEE</span>
</div>
```

**After** (with abbr tooltip):
```jsx
import { AbbrTooltip } from '@/components/ui/tooltip-helpers'

<div className="flex items-center gap-2">
  <div className="h-3 w-3 bg-blue-500 rounded" />
  <AbbrTooltip abbr="OEE" full="Overall Equipment Effectiveness">
    <span className="text-xs">OEE</span>
  </AbbrTooltip>
</div>
```

---

### Example 4: Status Badge with Explanation

**Before** (status without context):
```jsx
<span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
  Connected
</span>
```

**After** (with tooltip):
```jsx
import { BadgeTooltip } from '@/components/ui/tooltip-helpers'

<BadgeTooltip status="success" tooltip="All 4 integrations connected: Xero (connected 2h ago), Shopify (syncing), Amazon (connected), Unleashed (connected)">
  Connected
</BadgeTooltip>
```

---

## Accessibility Features

All tooltip components include:

1. **Keyboard Navigation**
   - Tab to focus trigger element
   - Tooltip shows automatically on focus
   - Escape to dismiss (optional)

2. **Screen Reader Support**
   - IconTooltip adds aria-label attribute
   - AbbrTooltip uses semantic <abbr> with title
   - Tooltips announced via aria-live regions

3. **Touch Support**
   - Tap to show tooltip on mobile
   - Long-press for additional context
   - Automatic dismissal on scroll

4. **Motion Preferences**
   - Respects prefers-reduced-motion
   - Instant show/hide (no animations) when reduced motion preferred

---

## Performance Considerations

**Radix UI Tooltip Performance**:
- ✅ Lazy renders content (only when shown)
- ✅ Portal-based (avoids z-index issues)
- ✅ No layout shift (position: fixed)
- ✅ Minimal bundle size (~3KB gzipped)
- ✅ No performance impact when not triggered

**Best Practices**:
- Keep tooltip content concise (1-2 sentences max)
- Avoid complex React components in content
- Use simple strings when possible
- Defer loading expensive content until tooltip opens

---

## Testing Checklist

**Keyboard Accessibility**:
- [ ] All tooltips show on focus (Tab key)
- [ ] Tooltips dismiss on Escape (optional behavior)
- [ ] Focus remains on trigger after tooltip shows
- [ ] No keyboard traps (can Tab away)

**Screen Reader Testing**:
- [ ] Icon button labels announced (NVDA: "Delete item, button")
- [ ] Abbreviations expanded on first encounter
- [ ] Tooltip content announced via aria-live

**Mobile Testing**:
- [ ] Tap triggers tooltip (not hover-only)
- [ ] Tooltips visible on touch devices
- [ ] No tooltips block important content
- [ ] Automatic dismissal on scroll works

**Visual Regression**:
- [ ] Tooltips visible above all content (z-index)
- [ ] Arrow points to correct trigger
- [ ] Smooth animations (fade + zoom)
- [ ] Readable contrast (WCAG AA: 4.5:1 text, 3:1 UI)

---

## Common Patterns

### Pattern 1: Icon Button Grid (e.g., Quick Actions)
```jsx
<div className="grid grid-cols-3 gap-3">
  <IconTooltip label="Export to CSV">
    <button><DownloadIcon /></button>
  </IconTooltip>

  <IconTooltip label="Share dashboard">
    <button><ShareIcon /></button>
  </IconTooltip>

  <IconTooltip label="Print report">
    <button><PrintIcon /></button>
  </IconTooltip>
</div>
```

### Pattern 2: Data Table Actions
```jsx
<div className="flex gap-2">
  <IconTooltip label="Edit">
    <button><PencilIcon /></button>
  </IconTooltip>

  <IconTooltip label="Delete">
    <button><TrashIcon /></button>
  </IconTooltip>

  <IconTooltip label="Duplicate">
    <button><CopyIcon /></button>
  </IconTooltip>
</div>
```

### Pattern 3: Form Field Help
```jsx
<label htmlFor="leadTime" className="text-sm font-medium">
  Lead Time{' '}
  <SimpleTooltip content="Number of days from order placement to inventory arrival">
    <span className="inline-flex items-center cursor-help text-slate-500">
      <QuestionMarkCircleIcon className="h-4 w-4" />
    </span>
  </SimpleTooltip>
</label>
<input id="leadTime" type="number" />
```

---

## Future Enhancements (Post-MVP)

1. **Rich Tooltips** - Support for formatted content, images, videos
2. **Interactive Tooltips** - Tooltips with buttons/links (e.g., "Learn more")
3. **Persistent Tooltips** - Stay open until explicitly dismissed
4. **Tooltip Tours** - Step-by-step feature introductions
5. **Contextual Help Panel** - Expandable sidebar with comprehensive help
6. **Tooltip Analytics** - Track which terms users hover most (identify confusion)

---

## Conclusion

**Current Status**: ✅ Foundation Complete
- Radix UI Tooltip installed and configured
- 5 specialized tooltip components created
- Accessibility features built-in
- Implementation guide documented

**Next Steps**:
1. Phase 1: Add IconTooltip to all icon-only buttons (3-4 hours)
2. Phase 2: Add HelpTooltip/AbbrTooltip to key terms (4-5 hours)
3. Phase 3: Add contextual help throughout app (3-4 hours)

**Total Estimated Time**: 10-13 hours for comprehensive coverage

**Recommendation**: Begin with Phase 1 (icon buttons) for WCAG 2.1 AA compliance, then incrementally add Phase 2/3 as time permits.

---

**Guide Complete**: 2025-10-19
**Status**: Foundation implemented, comprehensive rollout pending
**Next Action**: Begin Phase 1 icon button implementation (separate story)
