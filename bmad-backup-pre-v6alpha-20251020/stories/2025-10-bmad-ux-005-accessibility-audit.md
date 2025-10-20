# BMAD-UX-005: Accessibility Audit & WCAG 2.1 AA Compliance

**Epic**: EPIC-003 - Frontend Polish & UX Enhancement
**Story ID**: BMAD-UX-005
**Priority**: MEDIUM
**Estimated Effort**: 3 days (baseline) → 6-8 hours (projected with 4.1x velocity)
**Dependencies**: None
**Status**: PENDING

---

## Story Description

Conduct comprehensive accessibility audit using automated tools (axe DevTools, Lighthouse) and manual testing with screen readers. Fix all WCAG 2.1 AA violations to ensure the application is usable by people with disabilities, including those using screen readers, keyboard-only navigation, and assistive technologies.

### Business Value

- **Legal Compliance**: Meet ADA/Section 508 requirements (avoid lawsuits)
- **Market Expansion**: 15% of population has disabilities (potential users)
- **SEO Benefits**: Many accessibility fixes improve search engine rankings
- **Better UX for All**: Accessible design benefits all users (keyboard shortcuts, clear labels, etc.)
- **Enterprise Requirements**: Many large enterprises require WCAG 2.1 AA compliance

### Current State

- No formal accessibility audit conducted
- Unknown WCAG 2.1 AA compliance status
- Limited screen reader testing
- Keyboard navigation may have gaps
- Color contrast may not meet guidelines
- Missing ARIA labels on interactive elements
- Form validation errors may not be accessible

### Desired State

- WCAG 2.1 AA compliant across all pages
- Zero critical accessibility violations (automated tools)
- Full keyboard navigation support (no mouse required)
- Screen reader tested with NVDA and VoiceOver
- Color contrast meets 4.5:1 minimum (text) and 3:1 (UI components)
- All images have alt text
- Forms have proper labels and error announcements
- Focus indicators visible on all interactive elements

---

## Acceptance Criteria

### AC1: Automated Accessibility Audit Completed
**Given** a need to identify accessibility violations
**When** running automated accessibility tools
**Then** audit results show:
- **axe DevTools**: 0 critical violations, 0 serious violations
- **Lighthouse Accessibility Score**: ≥ 90/100
- **WAVE Browser Extension**: 0 errors
- All violations documented with remediation plan
- Re-audit after fixes confirms 100% pass rate

**Status**: ⏳ PENDING

---

### AC2: Keyboard Navigation Fully Functional
**Given** user navigates application using keyboard only
**When** pressing Tab, Shift+Tab, Enter, Space, Escape
**Then** keyboard navigation includes:
- Tab order follows logical visual flow
- All interactive elements reachable via keyboard
- Focus indicators visible on all elements (2px outline minimum)
- Enter/Space activates buttons and links
- Escape closes modals and overlays
- Arrow keys navigate within components (dropdowns, tabs, etc.)
- No keyboard traps (can always escape to next element)
- Skip links allow jumping to main content

**Status**: ⏳ PENDING

---

### AC3: Screen Reader Compatibility Verified
**Given** user navigates with screen reader (NVDA or VoiceOver)
**When** navigating through all pages
**Then** screen reader announces:
- Page titles and headings in logical hierarchy
- Interactive element purposes (button labels, link destinations)
- Form labels and required fields
- Error messages and validation feedback
- Loading states ("Loading...", "Fetching data...")
- Landmark regions (header, nav, main, footer)
- Dynamic content updates (live regions with aria-live)
- Current state of toggles and checkboxes

**Status**: ⏳ PENDING

---

### AC4: Color Contrast Meets WCAG 2.1 AA Standards
**Given** a need for readable text and UI elements
**When** checking color contrast ratios
**Then** contrast meets standards:
- Normal text (< 18pt): 4.5:1 minimum contrast ratio
- Large text (≥ 18pt or bold ≥ 14pt): 3:1 minimum
- UI components (buttons, borders, icons): 3:1 minimum
- Focus indicators: 3:1 against adjacent colors
- No critical information conveyed by color alone
- Links distinguishable from surrounding text (underline or 3:1 contrast)

**Test with**: Contrast Checker browser extension or WebAIM Contrast Checker

**Status**: ⏳ PENDING

---

### AC5: Semantic HTML and ARIA Labels Implemented
**Given** assistive technologies rely on semantic markup
**When** inspecting HTML structure
**Then** markup includes:
- Proper heading hierarchy (h1 → h2 → h3, no skipping)
- Semantic HTML elements (`<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`)
- ARIA landmarks on regions (`role="navigation"`, `role="main"`, etc.)
- ARIA labels on icon-only buttons (`aria-label="Close"`)
- ARIA descriptions where needed (`aria-describedby` for help text)
- Form inputs associated with labels (`<label for="id">` or wrapping)
- Tables have proper headers (`<th scope="col">`)
- Lists use `<ul>`, `<ol>`, `<li>` (not div-based pseudo-lists)

**Status**: ⏳ PENDING

---

### AC6: Forms Accessible and Error Handling Clear
**Given** user fills out forms with assistive technology
**When** interacting with form fields
**Then** forms are accessible:
- All inputs have associated `<label>` elements
- Required fields marked with `aria-required="true"` or `required` attribute
- Validation errors announced by screen readers (`aria-invalid="true"`, `aria-describedby`)
- Error messages clearly associated with inputs
- Success messages announced (aria-live regions)
- Field instructions available before input focus
- Placeholder text not used as sole label
- Autocomplete attributes for standard fields

**Status**: ⏳ PENDING

---

### AC7: Images and Media Accessible
**Given** user cannot see images or videos
**When** encountering media content
**Then** media is accessible:
- All `<img>` tags have `alt` attributes
- Decorative images use `alt=""` (empty string)
- Informative images have descriptive alt text
- Charts/graphs have text alternatives (table or description)
- Icon buttons have `aria-label` or visible text
- Videos have captions (if applicable in future)
- SVG icons have `<title>` or `aria-label`

**Status**: ⏳ PENDING

---

### AC8: Focus Management and Live Regions
**Given** user relies on screen reader for dynamic updates
**When** content changes dynamically
**Then** focus and announcements work correctly:
- Modal opening moves focus to modal content
- Modal closing returns focus to trigger element
- Loading states announced (`aria-live="polite"` or `aria-busy="true"`)
- Toast notifications announced (`aria-live="assertive"`)
- Client-side routing announces page changes
- Error messages announced when they appear
- Infinite scroll announces new content loaded
- No unexpected focus jumps

**Status**: ⏳ PENDING

---

## Technical Context

### Accessibility Testing Tools

**Automated Tools** (install and use):
1. **axe DevTools** (Chrome/Firefox extension)
   - Most comprehensive automated testing
   - Detects WCAG 2.1 violations
   - Provides remediation guidance

2. **Lighthouse** (Chrome DevTools)
   - Built into Chrome
   - Accessibility score + actionable recommendations

3. **WAVE** (Browser extension)
   - Visual accessibility feedback
   - Color contrast analyzer

4. **WebAIM Contrast Checker**
   - https://webaim.org/resources/contrastchecker/
   - Verify specific color combinations

**Manual Testing Tools**:
1. **NVDA** (Windows screen reader - free)
   - https://www.nvaccess.org/download/
   - Test with Firefox + NVDA

2. **VoiceOver** (Mac/iOS screen reader - built-in)
   - Enable: System Preferences → Accessibility → VoiceOver
   - Test with Safari + VoiceOver

3. **Keyboard Only**
   - Unplug mouse, navigate entire app with keyboard

### Files to Modify

**Global Styles** (focus indicators):
- `src/styles/index.css` - Add global focus styles

**Example Focus Styles**:
```css
/* Remove default outline, add custom focus ring */
*:focus {
  outline: 2px solid #3b82f6; /* Blue-600 */
  outline-offset: 2px;
}

/* Focus-visible (only when keyboard navigating) */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}
```

**Layout Components** (semantic HTML, ARIA landmarks):
- `src/components/layout/Header.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/Footer.jsx` (if exists)
- `src/App.jsx`

**Example Semantic Structure**:
```jsx
<div className="min-h-screen">
  <header role="banner">
    <nav role="navigation" aria-label="Main navigation">
      {/* Navigation items */}
    </nav>
  </header>

  <main role="main" id="main-content">
    {/* Page content */}
  </main>

  <footer role="contentinfo">
    {/* Footer content */}
  </footer>
</div>
```

**Add Skip Link** (keyboard navigation):
```jsx
// src/App.jsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded"
>
  Skip to main content
</a>
```

**All Interactive Components** (ARIA labels, keyboard support):
- `src/components/ui/Button.jsx`
- `src/components/ui/Modal.jsx`
- `src/components/ui/Dropdown.jsx`
- `src/components/widgets/*.jsx`

**Example Accessible Button**:
```jsx
<button
  type="button"
  aria-label="Close modal"
  onClick={onClose}
  className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
>
  <XMarkIcon className="w-6 h-6" aria-hidden="true" />
</button>
```

**Form Components** (labels, error announcements):
- `src/components/forms/*.jsx`
- `src/pages/admin/AdminPanel.jsx` (user creation form)

**Example Accessible Form**:
```jsx
<div>
  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
    Email <span className="text-red-500" aria-label="required">*</span>
  </label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-invalid={errors.email ? 'true' : 'false'}
    aria-describedby={errors.email ? 'email-error' : undefined}
    className="mt-1 block w-full rounded border-gray-300 focus:ring-2 focus:ring-blue-600"
  />
  {errors.email && (
    <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
      {errors.email}
    </p>
  )}
</div>
```

**Live Regions** (dynamic content announcements):
```jsx
// Toast/notification component
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded shadow"
>
  {message}
</div>

// Loading state
<div role="status" aria-live="polite" aria-busy="true">
  Loading data...
</div>
```

**Image Alt Text** (all images):
```jsx
// Informative image
<img src="/chart.png" alt="Revenue trend showing 15% growth in Q3" />

// Decorative image
<img src="/pattern.svg" alt="" aria-hidden="true" />

// Icon with button
<button aria-label="Delete item">
  <TrashIcon className="w-5 h-5" aria-hidden="true" />
</button>
```

### Color Contrast Fixes

**Common Issues**:
- Gray text on white background (needs darker gray)
- Disabled button text (needs sufficient contrast)
- Link colors (need 4.5:1 contrast)

**Example Contrast-Safe Colors** (Tailwind):
```javascript
// Safe combinations (≥ 4.5:1 contrast)
- White background: text-gray-900, text-gray-800, text-gray-700
- Gray-50 background: text-gray-900, text-gray-800
- Blue-600 background: text-white
- White background + blue link: text-blue-700 (not blue-400)
```

**Verify with**:
```bash
# Install Pa11y (command-line accessibility testing)
npm install -g pa11y

# Test specific page
pa11y http://localhost:3000/dashboard
```

---

## Testing Requirements

### Manual Testing Checklist

- [ ] **axe DevTools**: 0 violations on all major pages
- [ ] **Lighthouse**: ≥ 90 accessibility score on all pages
- [ ] **Keyboard Navigation**: Navigate entire app without mouse
- [ ] **NVDA Screen Reader**: Test on Windows with Firefox
- [ ] **VoiceOver**: Test on Mac with Safari
- [ ] **Color Contrast**: All text/UI meets 4.5:1 or 3:1 standards
- [ ] **Focus Indicators**: Visible on all interactive elements
- [ ] **Skip Links**: "Skip to main content" works

### Test Scenarios

**Test 1: Keyboard Navigation (No Mouse)**
1. Unplug mouse or ignore mouse entirely
2. Open application in browser
3. Press Tab repeatedly
4. **Expected**: Focus moves through all interactive elements in logical order
5. Navigate to dashboard, working capital, production pages
6. **Expected**: All pages fully navigable with keyboard
7. Open a modal (if applicable)
8. **Expected**: Focus trapped in modal, Escape closes modal
9. Press Shift+Tab
10. **Expected**: Focus moves backwards through elements

**Test 2: Screen Reader (NVDA + Firefox)**
1. Install NVDA (free from nvaccess.org)
2. Open application in Firefox
3. Enable NVDA (Ctrl+Alt+N)
4. Navigate with down arrow key
5. **Expected**: NVDA announces page title, headings, content
6. Tab through interactive elements
7. **Expected**: NVDA announces button/link purposes clearly
8. Navigate to form, fill out fields
9. **Expected**: NVDA announces labels, required fields, errors
10. Trigger loading state
11. **Expected**: NVDA announces "Loading..." or "Fetching data..."

**Test 3: axe DevTools Automated Scan**
1. Install axe DevTools extension (Chrome/Firefox)
2. Open application, navigate to `/dashboard`
3. Open DevTools → axe DevTools tab
4. Click "Scan ALL of my page"
5. **Expected**: 0 violations (or document acceptable ones)
6. Repeat for all major pages
7. Fix all violations, rescan
8. **Expected**: 100% pass rate

**Test 4: Color Contrast Audit**
1. Install WAVE extension or use WebAIM Contrast Checker
2. Navigate to all pages
3. Check all text against background colors
4. **Expected**: All text meets 4.5:1 (normal) or 3:1 (large)
5. Check button states (default, hover, disabled)
6. **Expected**: All UI components meet 3:1 contrast
7. Check focus indicators
8. **Expected**: Focus ring has 3:1 contrast with adjacent colors

**Test 5: Form Accessibility**
1. Navigate to admin panel (user creation form)
2. Enable screen reader
3. Tab to first form field
4. **Expected**: Screen reader announces label and "required" status
5. Submit form with errors
6. **Expected**: Screen reader announces errors clearly
7. Fix errors and resubmit
8. **Expected**: Success message announced

**Test 6: Dynamic Content Announcements**
1. Navigate to dashboard with SSE updates
2. Enable screen reader
3. Wait for data update
4. **Expected**: Screen reader announces "Data updated" or similar
5. Trigger loading state
6. **Expected**: Screen reader announces loading status
7. Trigger error state
8. **Expected**: Screen reader announces error message

---

## Implementation Plan

### Phase 1: Automated Audit & Documentation (1-2 hours)
1. Install axe DevTools, WAVE, Lighthouse
2. Run automated scans on all major pages
3. Document all violations in spreadsheet/checklist
4. Prioritize critical and serious violations
5. Create remediation plan

### Phase 2: Quick Wins (1-2 hours)
1. Add alt text to all images
2. Add ARIA labels to icon-only buttons
3. Fix form label associations
4. Add focus indicators globally
5. Rescan with automated tools

### Phase 3: Semantic HTML & Structure (1-2 hours)
1. Add semantic HTML5 elements (nav, main, article, aside)
2. Implement proper heading hierarchy (h1 → h2 → h3)
3. Add ARIA landmarks to layout components
4. Add skip link to main content
5. Test with screen reader

### Phase 4: Keyboard Navigation & Focus Management (1-2 hours)
1. Test keyboard navigation through all pages
2. Fix tab order issues
3. Implement modal focus trapping
4. Add keyboard shortcuts where beneficial
5. Verify no keyboard traps exist

### Phase 5: Color Contrast Fixes (1 hour)
1. Identify low-contrast text/UI elements
2. Update color values to meet WCAG standards
3. Verify with Contrast Checker
4. Test in both light and dark modes (if applicable)

### Phase 6: Final Testing & Verification (1-2 hours)
1. Comprehensive screen reader testing (NVDA + VoiceOver)
2. Full keyboard navigation testing
3. Re-run all automated tools
4. Document any acceptable exceptions
5. Create accessibility conformance report

---

## Definition of Done

- [ ] ✅ axe DevTools: 0 critical/serious violations on all pages
- [ ] ✅ Lighthouse Accessibility Score: ≥ 90/100 on all pages
- [ ] ✅ WAVE: 0 errors on all pages
- [ ] ✅ Full keyboard navigation functional (no mouse needed)
- [ ] ✅ Screen reader tested with NVDA (Windows) and VoiceOver (Mac)
- [ ] ✅ Color contrast meets WCAG 2.1 AA (4.5:1 text, 3:1 UI)
- [ ] ✅ All images have appropriate alt text
- [ ] ✅ Forms have labels, required indicators, error announcements
- [ ] ✅ Focus indicators visible on all interactive elements
- [ ] ✅ Semantic HTML and ARIA landmarks implemented
- [ ] ✅ Live regions announce dynamic content updates
- [ ] ✅ Skip link implemented and functional
- [ ] ✅ Accessibility conformance report documented
- [ ] ✅ Zero ESLint warnings introduced
- [ ] ✅ Code reviewed and approved
- [ ] ✅ Committed to `development` branch with descriptive message
- [ ] ✅ Deployed to Render development environment and verified

---

## Related Stories

- **BMAD-UX-001** (Loading Skeletons): Loading states must be announced
- **BMAD-UX-002** (Error Boundaries): Errors must be accessible to screen readers
- **BMAD-UX-003** (Setup Prompts): Setup instructions must be accessible
- **BMAD-UX-004** (Mobile Responsiveness): Touch targets part of accessibility

---

## Notes

**WCAG 2.1 Levels**:
- **Level A**: Minimum compliance (basic accessibility)
- **Level AA**: Mid-range compliance (our target - industry standard)
- **Level AAA**: Highest compliance (optional, exceeds most requirements)

**Common Accessibility Violations**:
1. Missing alt text on images
2. Low color contrast (< 4.5:1 for text)
3. Missing form labels
4. Buttons without accessible names
5. Poor heading structure (skipped levels)
6. Keyboard traps (can't tab out)
7. No focus indicators
8. Inaccessible custom components (dropdowns, modals)

**Screen Reader Keyboard Shortcuts** (NVDA):
- **Down Arrow**: Read next item
- **Up Arrow**: Read previous item
- **H**: Jump to next heading
- **Tab**: Jump to next interactive element
- **Insert + F7**: List all headings/links/landmarks
- **NVDA + Space**: Toggle browse/focus mode

**Screen Reader Keyboard Shortcuts** (VoiceOver):
- **VO = Ctrl + Option**
- **VO + Right Arrow**: Read next item
- **VO + Command + H**: Jump to next heading
- **Tab**: Jump to next interactive element
- **VO + U**: Open rotor (navigate by headings, links, etc.)

**Accessibility Resources**:
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM**: https://webaim.org/ (excellent guides and tools)
- **A11y Project**: https://www.a11yproject.com/ (checklist and resources)
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility

**Design References**:
- **GitHub**: Excellent keyboard navigation and screen reader support
- **GOV.UK**: Gold standard for accessible government services
- **Stripe**: High accessibility standards in complex dashboard
- **Linear**: Modern app with strong accessibility foundation

---

**Story Created**: 2025-10-19
**Last Updated**: 2025-10-19
**BMAD-METHOD Phase**: Planning (Phase 2)
