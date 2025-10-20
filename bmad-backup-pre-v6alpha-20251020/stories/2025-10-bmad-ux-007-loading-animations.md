# BMAD-UX-007: Polish Loading Animations & Transitions

**Epic**: EPIC-003 - Frontend Polish & UX Enhancement
**Story ID**: BMAD-UX-007
**Priority**: LOW
**Estimated Effort**: 1 day (baseline) → 2-3 hours (projected with 4.1x velocity)
**Dependencies**: BMAD-UX-001 (Loading Skeletons)
**Status**: PENDING

---

## Story Description

Add subtle, professional loading animations and transitions throughout the application to improve perceived performance and create a polished, fluid user experience. Focus on micro-interactions that provide visual feedback without being distracting.

### Business Value

- **Perceived Performance**: Smooth animations make app feel faster (20-30% perception improvement)
- **Professional Polish**: Quality animations signal attention to detail
- **User Engagement**: Delightful micro-interactions increase satisfaction
- **Reduced Perceived Wait**: Animated transitions during loading reduce bounce rate
- **Brand Differentiation**: Polished animations set apart from competitors

### Current State

- Basic CSS transitions on some elements
- Instant page transitions (no fade-in/fade-out)
- Minimal feedback on button clicks
- Data updates appear instantly (no smooth transitions)
- Modals/overlays appear/disappear abruptly

### Desired State

- Smooth page transitions with fade-in effects
- Button states with visual feedback (ripple, scale, color transition)
- Data updates with smooth fade/slide animations
- Modal open/close with scale+fade animations
- Loading spinners with smooth rotation
- Skeleton-to-content transitions with fade
- Hover states with smooth color/scale transitions

---

## Acceptance Criteria

### AC1: Page Transition Animations Implemented
**Given** user navigates between pages
**When** route changes occur
**Then** transitions include:
- 200-300ms fade-in animation when new page loads
- Previous page fades out (if applicable)
- No jarring instant page swaps
- Animation does not delay page interaction (< 300ms total)
- Smooth transition in React Router

**Status**: ⏳ PENDING

---

### AC2: Button Interaction Animations
**Given** user interacts with buttons
**When** clicking, hovering, or focusing buttons
**Then** buttons show animations:
- **Hover**: Subtle color transition (150ms) and/or slight scale (1.02x)
- **Click/Active**: Slight scale down (0.98x) for 100ms or ripple effect
- **Loading State**: Spinner inside button with smooth rotation
- **Success**: Brief green flash or checkmark animation
- **Disabled**: Reduced opacity with cursor change (no animation on hover)

**Examples**:
- Primary buttons: Color darken + subtle scale on hover
- Icon buttons: Background color fade + scale
- Submit buttons: Loading spinner replaces text during submission

**Status**: ⏳ PENDING

---

### AC3: Modal/Overlay Animations
**Given** user opens or closes modals/overlays
**When** modal state changes
**Then** animations include:
- **Open**: Fade-in overlay (200ms) + scale-up modal from 0.95 to 1.0 (200ms)
- **Close**: Fade-out overlay (200ms) + scale-down modal from 1.0 to 0.95 (200ms)
- **Backdrop**: Smooth opacity transition from 0 to 0.5
- Animations feel natural (ease-out for open, ease-in for close)

**Status**: ⏳ PENDING

---

### AC4: Data Update Animations
**Given** data updates via SSE or API
**When** new data replaces old data
**Then** updates animate smoothly:
- **Number Changes**: Count-up animation for KPIs (e.g., 1,234 → 1,567 animates digits)
- **New Rows**: Slide-in or fade-in new table rows
- **Chart Updates**: Smooth transition between data states (not instant redraw)
- **Card Updates**: Subtle highlight flash (e.g., green pulse) to indicate change

**Examples**:
- Revenue KPI increases: Numbers count up over 500ms
- New production job appears: Slide-in from top with fade
- Chart data updates: Recharts transition animation

**Status**: ⏳ PENDING

---

### AC5: Loading Spinner Animations
**Given** content is loading
**When** displaying loading indicators
**Then** spinners are smooth:
- **Rotation**: Smooth 360° rotation (1-2 second duration, infinite loop)
- **Style**: Modern spinner (not default browser spinner)
- **Placement**: Centered in container, appropriate size
- **Accessibility**: `aria-label="Loading"` for screen readers

**Use**: Custom spinner component or library like `react-loader-spinner`

**Status**: ⏳ PENDING

---

### AC6: Skeleton-to-Content Transitions
**Given** skeleton loading states implemented (BMAD-UX-001)
**When** real data arrives and replaces skeleton
**Then** transition is smooth:
- **Fade Transition**: Skeleton fades out (200ms) while content fades in (200ms)
- **No Layout Shift**: Content dimensions match skeleton exactly
- **Staggered Load**: If multiple items, stagger fade-in by 50ms each (waterfall effect)

**Example**: KPI cards load in sequence, each fading in 50ms after previous

**Status**: ⏳ PENDING

---

### AC7: Hover State Animations
**Given** user hovers over interactive elements
**When** mouse enters/leaves element
**Then** hover states animate:
- **Cards**: Subtle shadow increase + slight lift (transform: translateY(-2px))
- **Links**: Underline slides in from left (or color transition)
- **Icons**: Color transition + slight rotate or scale
- **Images**: Subtle zoom (scale: 1.05) with overflow hidden
- All transitions: 150-200ms duration

**Status**: ⏳ PENDING

---

### AC8: Accessibility and Performance Considerations
**Given** animations implemented across the application
**When** users with motion sensitivity or slow devices access the app
**Then** animations respect accessibility:
- **Reduced Motion**: Respect `prefers-reduced-motion: reduce` media query
- **Performance**: All animations run at 60fps (no jank)
- **CSS-Based**: Use CSS transitions/animations (not JavaScript where possible)
- **Graceful Degradation**: App functional even if animations disabled

**CSS Example**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Status**: ⏳ PENDING

---

## Technical Context

### Animation Libraries (Choose One or None)

**Option 1: Pure CSS** (Recommended - Best Performance)
- Use Tailwind transition classes: `transition`, `duration-200`, `ease-in-out`
- CSS keyframe animations for complex effects
- No additional dependencies

**Option 2: Framer Motion** (If Complex Animations Needed)
- `npm install framer-motion`
- Declarative animations with great DX
- Adds ~60kb to bundle (consider if needed)

**Option 3: React Spring** (Physics-Based Animations)
- `npm install react-spring`
- More natural animations
- Adds ~30kb to bundle

**Recommendation**: Start with **pure CSS/Tailwind**, only add library if needed for complex animations.

### Files to Modify

**Global Transition Utilities** (`src/styles/index.css`):
```css
/* Smooth transitions globally */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); /* ease-in-out */
}

/* Page transitions */
.page-enter {
  opacity: 0;
}
.page-enter-active {
  opacity: 1;
  transition: opacity 300ms ease-in;
}
.page-exit {
  opacity: 1;
}
.page-exit-active {
  opacity: 0;
  transition: opacity 200ms ease-out;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Button Component** (`src/components/ui/Button.jsx`):
```jsx
export default function Button({ children, loading, variant = 'primary', ...props }) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200'
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98]',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  )
}
```

**Modal Component** (`src/components/ui/Modal.jsx`):
```jsx
import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with fade */}
      <div
        className="fixed inset-0 bg-black transition-opacity duration-200"
        style={{ opacity: isOpen ? 0.5 : 0 }}
        onClick={onClose}
      />

      {/* Modal content with scale + fade */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transition-all duration-200"
          style={{
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'scale(1)' : 'scale(0.95)'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
```

**Number Count-Up Animation** (for KPIs):
```jsx
import { useEffect, useState } from 'react'

export function useCountUp(end, duration = 500) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }, [end, duration])

  return count
}

// Usage in KPI component:
export default function KPICard({ label, value }) {
  const animatedValue = useCountUp(value)
  return (
    <div className="bg-white rounded-lg p-6 border">
      <h3 className="text-sm text-gray-600 mb-2">{label}</h3>
      <p className="text-3xl font-bold">{animatedValue.toLocaleString()}</p>
    </div>
  )
}
```

**Card Hover Animation**:
```jsx
<div className="bg-white rounded-lg border p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
  {/* Card content */}
</div>
```

**Staggered List Animation** (Tailwind):
```jsx
{items.map((item, i) => (
  <div
    key={item.id}
    className="opacity-0 animate-fade-in"
    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}
  >
    {item.content}
  </div>
))}
```

**Add to `tailwind.config.js`**:
```javascript
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out'
      }
    }
  }
}
```

### Components to Enhance

**Add animations to**:
- `src/components/ui/Button.jsx` - Hover, click, loading states
- `src/components/ui/Modal.jsx` - Open/close animations
- `src/components/ui/Card.jsx` - Hover lift effect
- `src/components/widgets/KPIStripWidget.jsx` - Number count-up
- `src/components/widgets/DataTableWidget.jsx` - Row slide-in
- `src/pages/*` - Page transition animations
- `src/components/layout/Sidebar.jsx` - Menu item hover

---

## Testing Requirements

### Manual Testing Checklist

- [ ] **Page Transitions**: Smooth fade-in when navigating between pages
- [ ] **Button Hovers**: Buttons show color/scale transition on hover
- [ ] **Button Clicks**: Buttons show active state (scale down or ripple)
- [ ] **Modal Open/Close**: Modals scale+fade in/out smoothly
- [ ] **Loading Spinners**: Spinners rotate smoothly (no stutter)
- [ ] **Number Count-Up**: KPI values count up smoothly
- [ ] **Reduced Motion**: Animations disabled when `prefers-reduced-motion: reduce`
- [ ] **Performance**: All animations run at 60fps (no jank)

### Test Scenarios

**Test 1: Page Transitions**
1. Navigate from `/dashboard` to `/working-capital`
2. **Expected**: New page fades in over 200-300ms
3. **Expected**: Transition feels smooth, not jarring
4. Navigate back
5. **Expected**: Same smooth transition

**Test 2: Button Animations**
1. Hover over primary button
2. **Expected**: Button color darkens and slightly scales up (150-200ms)
3. Click button
4. **Expected**: Button scales down briefly (100ms)
5. Hover disabled button
6. **Expected**: No animation, cursor shows "not-allowed"

**Test 3: Modal Animations**
1. Click button to open modal
2. **Expected**: Backdrop fades in (200ms), modal scales up from 0.95 to 1.0
3. Click outside modal or close button
4. **Expected**: Backdrop fades out, modal scales down, then disappears
5. Verify smooth, not abrupt

**Test 4: KPI Count-Up Animation**
1. Load dashboard with KPI cards
2. **Expected**: Numbers count up from 0 to final value over 500ms
3. Trigger data update (via SSE or refresh)
4. **Expected**: Numbers count from old value to new value

**Test 5: Loading Spinner**
1. Trigger loading state (e.g., submit form)
2. **Expected**: Spinner appears inside button, rotates smoothly
3. Verify no stutter or pauses in rotation
4. Complete action
5. **Expected**: Spinner disappears, success message or next state appears

**Test 6: Reduced Motion Preference**
1. Enable reduced motion in OS settings:
   - **Windows**: Settings → Ease of Access → Display → Show animations
   - **Mac**: System Preferences → Accessibility → Display → Reduce motion
2. Reload application
3. **Expected**: All animations instant (< 10ms) or disabled
4. Verify app still functional

**Test 7: Performance (60fps Check)**
1. Open Chrome DevTools → Performance tab
2. Start recording
3. Navigate pages, open modals, hover buttons
4. Stop recording
5. **Expected**: Frame rate stays at 60fps during animations
6. **Expected**: No dropped frames or jank

---

## Implementation Plan

### Phase 1: Global Animation Foundation (30 min - 1 hour)
1. Add global transition styles to `src/styles/index.css`
2. Add custom animations to `tailwind.config.js`
3. Implement `prefers-reduced-motion` support
4. Test global styles across pages

### Phase 2: Button & Interactive Element Animations (1 hour)
1. Update `Button.jsx` with hover, active, loading animations
2. Add hover effects to cards (lift + shadow)
3. Add link underline slide animations
4. Test across all pages

### Phase 3: Modal & Overlay Animations (30 min - 1 hour)
1. Update `Modal.jsx` with scale+fade animations
2. Add backdrop fade animation
3. Test modal open/close flows
4. Verify focus management still works

### Phase 4: Data Update Animations (1 hour)
1. Implement number count-up hook for KPIs
2. Add staggered list animations for tables
3. Add chart transition animations (if needed)
4. Test SSE data updates with animations

### Phase 5: Loading & Transition Polish (30 min)
1. Create custom loading spinner component
2. Add page transition animations (React Router)
3. Add skeleton-to-content fade transitions
4. Test all loading states

### Phase 6: Testing & Performance (30 min - 1 hour)
1. Test all animations across browsers
2. Verify 60fps performance
3. Test reduced motion preference
4. Fix any janky or slow animations
5. Final QA review

---

## Definition of Done

- [ ] ✅ Page transitions with smooth fade-in implemented
- [ ] ✅ Button hover, active, loading animations implemented
- [ ] ✅ Modal open/close animations with scale+fade
- [ ] ✅ KPI number count-up animations functional
- [ ] ✅ Loading spinners with smooth rotation
- [ ] ✅ Skeleton-to-content fade transitions
- [ ] ✅ Card hover lift effects implemented
- [ ] ✅ `prefers-reduced-motion` support implemented
- [ ] ✅ All animations run at 60fps (no jank)
- [ ] ✅ Animations tested across browsers (Chrome, Firefox, Safari)
- [ ] ✅ Zero ESLint warnings introduced
- [ ] ✅ Code reviewed and approved
- [ ] ✅ Committed to `development` branch with descriptive message
- [ ] ✅ Deployed to Render development environment and verified

---

## Related Stories

- **BMAD-UX-001** (Loading Skeletons): Skeleton-to-content transitions
- **BMAD-UX-002** (Error Boundaries): Error state transitions
- **BMAD-UX-004** (Mobile Responsiveness): Animations must work on mobile
- **BMAD-UX-005** (Accessibility Audit): Reduced motion compliance

---

## Notes

**Animation Best Practices**:
- **Subtle Over Flashy**: Animations should enhance, not distract
- **Fast Durations**: 150-300ms for most transitions (avoid slow animations)
- **Natural Easing**: Use ease-in-out or cubic-bezier for smooth feel
- **Performance**: Use `transform` and `opacity` (GPU-accelerated), avoid `width`/`height`
- **Purpose**: Every animation should have a purpose (feedback, context, delight)

**Common Animation Mistakes to Avoid**:
- **Too Slow**: Animations > 500ms feel sluggish
- **Too Many**: Animating everything creates chaos
- **Janky**: Non-60fps animations worse than no animation
- **Blocking**: Animations that delay interaction frustrate users
- **Ignoring Reduced Motion**: Accessibility issue

**Animation Timing Guidelines**:
- **Instant Feedback**: 0-100ms (button active state)
- **Quick Transitions**: 150-200ms (hover, color changes)
- **Standard Transitions**: 200-300ms (modals, page changes)
- **Emphasis**: 300-500ms (count-up animations, important changes)
- **Never**: > 500ms (feels slow and broken)

**CSS vs JavaScript Animations**:
- **Use CSS**: Simple transitions (color, opacity, transform)
- **Use JavaScript**: Complex animations (count-up numbers, coordinated sequences)
- **Use Libraries**: Physics-based animations, gesture-driven interactions

**Performance Tips**:
- Animate `transform` and `opacity` only (GPU-accelerated)
- Use `will-change` sparingly (on elements about to animate)
- Avoid animating `width`, `height`, `top`, `left` (causes reflow)
- Test on low-end devices (animations smooth on fast machines may jank on slow)

**Design References**:
- **Linear**: Subtle, fast animations that feel premium
- **Stripe**: Professional loading states and transitions
- **Vercel**: Smooth page transitions and micro-interactions
- **Notion**: Delightful hover states and loading animations

---

**Story Created**: 2025-10-19
**Last Updated**: 2025-10-19
**BMAD-METHOD Phase**: Planning (Phase 2)
