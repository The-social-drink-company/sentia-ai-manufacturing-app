# BMAD-UX-008: Add Tooltips & Contextual Help Text

**Epic**: EPIC-003 - Frontend Polish & UX Enhancement
**Story ID**: BMAD-UX-008
**Priority**: LOW
**Estimated Effort**: 1 day (baseline) → 2-3 hours (projected with 4.1x velocity)
**Dependencies**: None
**Status**: PENDING

---

## Story Description

Add tooltips and contextual help text throughout the application to explain complex features, industry terminology, and provide guidance to users. Improve onboarding experience and reduce confusion for new users unfamiliar with manufacturing/financial terminology.

### Business Value

- **Reduced Training Time**: Users can self-educate via in-app help (30-40% reduction)
- **Lower Support Tickets**: Contextual help reduces "How do I...?" questions
- **Increased Feature Discovery**: Tooltips encourage exploration of features
- **Better Onboarding**: New users understand interface without external documentation
- **Accessibility**: Proper tooltips improve screen reader experience

### Current State

- Limited tooltips or help text
- Complex terminology not explained (e.g., "Working Capital", "Cash Conversion Cycle")
- Icon-only buttons with no labels or tooltips
- Abbreviations not defined (AR, AP, SKU, FBA)
- No contextual help for form fields
- Users must rely on external documentation

### Desired State

- Tooltips on all icon-only buttons
- Contextual help icons (ℹ️) next to complex terms
- Hover cards explaining industry terminology
- Form field help text below inputs
- Abbreviations defined in tooltips
- Consistent tooltip styling and behavior
- Keyboard-accessible tooltips (show on focus)

---

## Acceptance Criteria

### AC1: Tooltip Component Library Created
**Given** a need for consistent tooltips across the application
**When** developers add tooltips to components
**Then** reusable tooltip components exist:
- `<Tooltip />` - Standard tooltip (hover/focus, small text)
- `<HelpTooltip />` - Info icon (ℹ️) with tooltip on hover
- `<HoverCard />` - Larger tooltip with rich content (headings, lists, links)

All components include:
- Accessible (ARIA labels, keyboard navigation)
- Responsive (mobile-friendly, tap to show)
- Consistent styling (dark background, white text, rounded corners)
- Positioned intelligently (above/below/left/right based on viewport)

**Status**: ⏳ PENDING

---

### AC2: Icon Buttons Have Accessible Labels
**Given** icon-only buttons throughout the application
**When** users hover or focus on icon buttons
**Then** tooltips display:
- Clear action description (e.g., "Close", "Delete", "Edit", "Refresh")
- Tooltip appears on hover (desktop) and long-press (mobile)
- ARIA labels for screen readers (`aria-label="Close"`)
- Consistent positioning (above button by default)

**Examples**:
- Close button (X icon): Tooltip "Close"
- Delete button (trash icon): Tooltip "Delete item"
- Refresh button (rotate icon): Tooltip "Refresh data"
- Settings button (gear icon): Tooltip "Settings"

**Status**: ⏳ PENDING

---

### AC3: Industry Terminology Explained
**Given** users encounter complex manufacturing/financial terms
**When** hovering over help icon (ℹ️) next to term
**Then** tooltip explains term:
- **Working Capital**: "Current assets minus current liabilities. Measures liquidity."
- **Cash Conversion Cycle**: "Days it takes to convert inventory into cash. Lower is better."
- **AR (Accounts Receivable)**: "Money owed to the company by customers."
- **AP (Accounts Payable)**: "Money the company owes to suppliers."
- **SKU**: "Stock Keeping Unit - unique product identifier."
- **FBA**: "Fulfillment by Amazon - inventory stored and shipped by Amazon."
- **Reorder Point**: "Inventory level that triggers a new order."
- **Lead Time**: "Time between placing order and receiving inventory."

**Implementation**: Add `<HelpTooltip />` next to terms in dashboard

**Status**: ⏳ PENDING

---

### AC4: Form Fields Have Help Text
**Given** users fill out forms (e.g., admin user creation, settings)
**When** viewing form fields
**Then** help text guides users:
- Help text below input field (gray text)
- Explains expected format or constraints
- Tooltips on labels for additional context

**Examples**:
- **Email field**: Help text "User will receive login credentials at this email"
- **Role dropdown**: Tooltip on label "Roles determine what users can view and edit"
- **Password field**: Help text "Minimum 8 characters, must include number and symbol"

**Status**: ⏳ PENDING

---

### AC5: Abbreviations Defined
**Given** abbreviations used throughout the UI (AR, AP, SKU, etc.)
**When** users hover or focus on abbreviation
**Then** tooltip shows full term:
- Use `<abbr>` HTML tag with `title` attribute, OR
- Use `<Tooltip>` component

**Examples**:
- "AR" → Tooltip: "Accounts Receivable"
- "AP" → Tooltip: "Accounts Payable"
- "SKU" → Tooltip: "Stock Keeping Unit"
- "FBA" → Tooltip: "Fulfillment by Amazon"
- "ERP" → Tooltip: "Enterprise Resource Planning"

**Status**: ⏳ PENDING

---

### AC6: Dashboard Widgets Have Help Tooltips
**Given** complex widgets on dashboard (charts, KPIs, tables)
**When** users hover help icon in widget header
**Then** tooltip explains widget purpose and data source:

**Examples**:
- **Working Capital Widget**: "Displays current assets minus liabilities. Data from Xero."
- **Demand Forecast Widget**: "AI-powered sales forecast for next 30 days. Based on historical Shopify data."
- **Inventory Widget**: "Real-time stock levels across 9 SKUs. Synced from Shopify and Amazon FBA."
- **Production Schedule Widget**: "Upcoming assembly jobs. Data from Unleashed ERP."

**Status**: ⏳ PENDING

---

### AC7: Keyboard Accessibility for Tooltips
**Given** keyboard-only users navigate the application
**When** focusing on element with tooltip
**Then** tooltip behavior is accessible:
- Tooltip appears on focus (not just hover)
- Tooltip remains visible while focused
- Tooltip disappears on blur or Escape key
- Tab order logical (tooltip trigger reachable via Tab)
- ARIA attributes proper (`aria-describedby` linking element to tooltip)

**Status**: ⏳ PENDING

---

### AC8: Mobile-Friendly Tooltips
**Given** users access application on mobile devices
**When** interacting with tooltips on touchscreen
**Then** tooltips work on mobile:
- Tap to show tooltip (not hover-only)
- Tap outside or on tooltip to dismiss
- Tooltips don't obscure content (positioned intelligently)
- No hover-only tooltips (all have tap alternative)

**Status**: ⏳ PENDING

---

## Technical Context

### Tooltip Library Options

**Option 1: Radix UI Tooltip** (Recommended)
- `npm install @radix-ui/react-tooltip`
- Accessible by default (ARIA, keyboard navigation)
- Unstyled (full control over appearance)
- Small bundle size (~5kb)
- Excellent documentation

**Option 2: Headless UI Tooltip** (If using Headless UI already)
- Part of Headless UI library
- Tailwind-friendly
- Similar accessibility features

**Option 3: Custom Implementation** (If avoiding dependencies)
- Build using React + CSS
- More work but full control

**Recommendation**: **Radix UI Tooltip** for best accessibility and DX.

### Installation

```bash
npm install @radix-ui/react-tooltip
```

### Example Implementation

**Basic Tooltip Component** (`src/components/ui/Tooltip.jsx`):
```jsx
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

export function TooltipProvider({ children }) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

export function Tooltip({ children, content, side = 'top' }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          className="bg-gray-900 text-white text-sm px-3 py-2 rounded shadow-lg z-50 max-w-xs"
          sideOffset={5}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-gray-900" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
```

**Help Tooltip Component** (`src/components/ui/HelpTooltip.jsx`):
```jsx
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { Tooltip } from './Tooltip'

export function HelpTooltip({ content }) {
  return (
    <Tooltip content={content}>
      <button
        type="button"
        className="inline-flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded"
        aria-label="Help"
      >
        <QuestionMarkCircleIcon className="w-4 h-4" />
      </button>
    </Tooltip>
  )
}
```

**Hover Card Component** (for rich content):
```jsx
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'

export function HoverCard({ trigger, children }) {
  return (
    <HoverCardPrimitive.Root openDelay={200}>
      <HoverCardPrimitive.Trigger asChild>
        {trigger}
      </HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50"
          sideOffset={5}
        >
          {children}
          <HoverCardPrimitive.Arrow className="fill-white" />
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  )
}
```

### Usage Examples

**Icon Button with Tooltip**:
```jsx
import { Tooltip } from '@/components/ui/Tooltip'
import { XMarkIcon } from '@heroicons/react/24/outline'

<Tooltip content="Close">
  <button
    onClick={onClose}
    className="p-2 rounded hover:bg-gray-100"
    aria-label="Close"
  >
    <XMarkIcon className="w-5 h-5" />
  </button>
</Tooltip>
```

**Industry Term with Help Tooltip**:
```jsx
import { HelpTooltip } from '@/components/ui/HelpTooltip'

<div className="flex items-center gap-2">
  <h3 className="text-lg font-semibold">Working Capital</h3>
  <HelpTooltip content="Current assets minus current liabilities. Measures your company's short-term liquidity and operational efficiency." />
</div>
```

**Abbreviation with Tooltip**:
```jsx
<Tooltip content="Accounts Receivable - Money owed to your company by customers">
  <abbr className="cursor-help no-underline">AR</abbr>
</Tooltip>
```

**Form Field with Help Text**:
```jsx
<div>
  <label htmlFor="email" className="flex items-center gap-2">
    Email
    <HelpTooltip content="User will receive login credentials and notifications at this email address." />
  </label>
  <input
    id="email"
    type="email"
    className="mt-1 block w-full rounded border-gray-300"
  />
  <p className="mt-1 text-sm text-gray-600">
    Must be a valid email address
  </p>
</div>
```

**Widget with Help Tooltip**:
```jsx
export function WorkingCapitalWidget() {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Working Capital</h3>
        <HelpTooltip content="Displays current assets minus current liabilities. Data sourced from Xero. Lower values may indicate cash flow issues." />
      </div>
      {/* Widget content */}
    </div>
  )
}
```

**Hover Card with Rich Content**:
```jsx
import { HoverCard } from '@/components/ui/HoverCard'

<HoverCard
  trigger={
    <button className="text-blue-600 hover:underline">
      What is Cash Conversion Cycle?
    </button>
  }
>
  <div>
    <h4 className="font-semibold mb-2">Cash Conversion Cycle (CCC)</h4>
    <p className="text-sm text-gray-600 mb-3">
      Measures how long it takes to convert inventory into cash.
    </p>
    <div className="text-sm">
      <p className="mb-1"><strong>Formula:</strong></p>
      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
        CCC = DIO + DSO - DPO
      </code>
      <ul className="mt-3 space-y-1 text-gray-600">
        <li>• DIO: Days Inventory Outstanding</li>
        <li>• DSO: Days Sales Outstanding</li>
        <li>• DPO: Days Payable Outstanding</li>
      </ul>
    </div>
  </div>
</HoverCard>
```

### Files to Modify

**Add Tooltips to**:
- `src/components/ui/Button.jsx` - Icon buttons
- `src/components/layout/Header.jsx` - Header icons (settings, notifications)
- `src/components/layout/Sidebar.jsx` - Collapsed sidebar icons
- `src/components/widgets/KPIStripWidget.jsx` - KPI card help icons
- `src/components/widgets/WorkingCapitalWidget.jsx` - Financial terms
- `src/components/widgets/InventorySummaryWidget.jsx` - SKU, reorder point explanations
- `src/pages/production/ProductionDashboard.jsx` - Production terms (lead time, batch size)
- `src/pages/admin/AdminPanel.jsx` - Form field help text
- All pages with complex terminology

**Wrap App with TooltipProvider** (`src/App.jsx`):
```jsx
import { TooltipProvider } from '@/components/ui/Tooltip'

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        {/* Rest of app */}
      </BrowserRouter>
    </TooltipProvider>
  )
}
```

### Tooltip Content Guidelines

**Good Tooltip Content**:
- **Concise**: 1-2 sentences maximum (20-40 words)
- **Actionable**: Explains what element does or what term means
- **Plain Language**: Avoid jargon in tooltips (ironic but true)
- **Helpful**: Adds value, not just repeating label

**Bad Tooltip Examples**:
- ❌ "Click here" (not helpful, obvious)
- ❌ "This is the email field" (repeats label)
- ❌ "For more information see documentation" (unhelpful)

**Good Tooltip Examples**:
- ✅ "Close this dialog and discard changes"
- ✅ "Accounts Receivable: Money owed to you by customers"
- ✅ "Reorder when stock falls below this level"

---

## Testing Requirements

### Manual Testing Checklist

- [ ] **Icon Buttons**: All icon-only buttons have tooltips
- [ ] **Industry Terms**: Complex terms have help icons with explanations
- [ ] **Abbreviations**: All abbreviations defined in tooltips
- [ ] **Form Fields**: Forms have help text or tooltips
- [ ] **Keyboard Access**: Tooltips appear on focus (not just hover)
- [ ] **Mobile**: Tooltips work on tap (not hover-only)
- [ ] **Screen Readers**: ARIA attributes proper, screen reader announces tooltips
- [ ] **Positioning**: Tooltips positioned intelligently (don't overflow viewport)

### Test Scenarios

**Test 1: Icon Button Tooltips**
1. Hover over close button (X icon)
2. **Expected**: Tooltip appears with "Close" text
3. Move mouse away
4. **Expected**: Tooltip disappears after brief delay
5. Repeat for all icon buttons across pages

**Test 2: Help Icon Tooltips (Industry Terms)**
1. Navigate to `/working-capital`
2. Hover over help icon (ℹ️) next to "Working Capital"
3. **Expected**: Tooltip explains term clearly
4. Verify tooltip positioned correctly (not cut off)
5. Repeat for all help icons

**Test 3: Keyboard Navigation**
1. Unplug mouse or navigate with keyboard only
2. Tab to element with tooltip
3. **Expected**: Tooltip appears on focus
4. Press Escape
5. **Expected**: Tooltip disappears
6. Tab away
7. **Expected**: Tooltip disappears

**Test 4: Mobile Tap Interaction**
1. Open app on mobile device (or DevTools mobile simulator)
2. Tap icon button with tooltip
3. **Expected**: Tooltip appears
4. Tap outside tooltip
5. **Expected**: Tooltip disappears
6. Verify no hover-only tooltips (all accessible via tap)

**Test 5: Screen Reader Compatibility**
1. Enable screen reader (NVDA or VoiceOver)
2. Navigate to element with tooltip
3. **Expected**: Screen reader announces tooltip content
4. Verify `aria-describedby` or `aria-label` attributes present
5. Test with multiple tooltip types (standard, help icon, hover card)

**Test 6: Tooltip Positioning**
1. Hover over element at top of page
2. **Expected**: Tooltip appears below element (has space)
3. Hover over element at bottom of page
4. **Expected**: Tooltip appears above element (avoids viewport overflow)
5. Verify tooltips never cut off or overflow screen

**Test 7: Form Help Text**
1. Navigate to admin panel (user creation form)
2. Verify each form field has help text or tooltip
3. Read help text
4. **Expected**: Guidance clear and helpful
5. Fill out form successfully using only help text (no external docs)

---

## Implementation Plan

### Phase 1: Install & Setup (30 min)
1. Install Radix UI Tooltip: `npm install @radix-ui/react-tooltip`
2. Create `Tooltip.jsx` component
3. Create `HelpTooltip.jsx` component
4. Wrap app with `TooltipProvider` in `App.jsx`
5. Test basic tooltip functionality

### Phase 2: Add Tooltips to Icon Buttons (1 hour)
1. Audit all icon-only buttons across pages
2. Add `<Tooltip>` to each button
3. Write clear, concise tooltip content
4. Test hover and focus states

### Phase 3: Add Help Icons to Complex Terms (1-2 hours)
1. Identify industry terminology needing explanation
2. Add `<HelpTooltip>` next to terms
3. Write educational tooltip content
4. Test tooltips across all pages

### Phase 4: Form Field Help Text (30 min - 1 hour)
1. Audit all forms (admin panel, settings, etc.)
2. Add help text below inputs
3. Add tooltips to form labels where beneficial
4. Test form completion with only help text

### Phase 5: Abbreviation Tooltips (30 min)
1. Find all abbreviations (AR, AP, SKU, FBA, etc.)
2. Wrap with `<Tooltip>` or `<abbr>` tag
3. Define full terms in tooltips
4. Test across pages

### Phase 6: Accessibility & Mobile Testing (30 min - 1 hour)
1. Test keyboard navigation (Tab, Escape)
2. Test on mobile (tap interactions)
3. Test with screen reader
4. Fix any accessibility issues
5. Final QA review

---

## Definition of Done

- [ ] ✅ Radix UI Tooltip installed and configured
- [ ] ✅ Tooltip, HelpTooltip, and HoverCard components created
- [ ] ✅ All icon-only buttons have tooltips
- [ ] ✅ Industry terms have help icons with explanations
- [ ] ✅ Abbreviations defined in tooltips
- [ ] ✅ Form fields have help text or tooltips
- [ ] ✅ Dashboard widgets have help tooltips
- [ ] ✅ Tooltips keyboard-accessible (show on focus)
- [ ] ✅ Tooltips mobile-friendly (tap to show)
- [ ] ✅ Screen reader tested (NVDA or VoiceOver)
- [ ] ✅ Tooltip positioning intelligent (no viewport overflow)
- [ ] ✅ Zero ESLint warnings introduced
- [ ] ✅ Code reviewed and approved
- [ ] ✅ Committed to `development` branch with descriptive message
- [ ] ✅ Deployed to Render development environment and verified

---

## Related Stories

- **BMAD-UX-003** (Setup Prompts): Help tooltips complement setup instructions
- **BMAD-UX-004** (Mobile Responsiveness): Tooltips must work on mobile
- **BMAD-UX-005** (Accessibility Audit): Tooltips must be accessible
- **BMAD-UX-007** (Loading Animations): Tooltip appearance may have subtle animation

---

## Notes

**Why Tooltips Matter**:
- **Reduce Learning Curve**: Users understand complex features faster
- **Increase Confidence**: Clear explanations encourage feature exploration
- **Reduce Support Load**: Contextual help answers questions in-app
- **Accessibility**: Proper tooltips help screen reader users

**Tooltip Best Practices**:
- **Hover Delay**: 200-400ms delay before tooltip appears (avoid accidental triggers)
- **Dismiss on Action**: Tooltip disappears when clicking trigger element
- **Arrow Pointer**: Visual arrow pointing to trigger element
- **Contrast**: Dark background, white text (high contrast for readability)
- **Concise**: 1-2 sentences, 20-40 words maximum
- **Positioning**: Intelligent (above/below/left/right based on viewport space)

**Tooltip vs Help Text vs Documentation**:
- **Tooltip**: Brief (1-2 sentences), explains what element does or term means
- **Help Text**: 1 sentence, provides context for form fields
- **Documentation**: Comprehensive guides, separate from UI

**Common Mistakes to Avoid**:
- **Hover-Only on Mobile**: Tooltips must work on tap, not just hover
- **Too Long**: Tooltips with paragraphs of text (use HoverCard or link to docs)
- **Inaccessible**: Missing ARIA attributes, not keyboard-accessible
- **Stating the Obvious**: "This is the save button" (not helpful)

**Accessibility Attributes**:
```jsx
// For decorative tooltips (icon labels)
<button aria-label="Close">
  <XMarkIcon />
</button>

// For descriptive tooltips (additional context)
<div>
  <span id="tooltip-1">Hover for more info</span>
  <p id="tooltip-content-1">This is additional context...</p>
</div>
```

**Design References**:
- **Linear**: Excellent tooltips on icons and complex features
- **GitHub**: Helpful tooltips throughout UI, especially on icon buttons
- **Stripe Dashboard**: Tooltips explain financial metrics clearly
- **Notion**: Hover cards with rich content for help documentation

---

**Story Created**: 2025-10-19
**Last Updated**: 2025-10-19
**BMAD-METHOD Phase**: Planning (Phase 2)
