# Theme System Migration Guide

## Overview

Comprehensive guide for migrating 4,206+ hardcoded Tailwind classes to theme-aware CSS across 210+ files.

## Class Mapping Reference

### Critical Text Color Migrations

```css
/* BEFORE → AFTER */
text-gray-900 → text-primary        /* Main headings, primary content */
text-gray-800 → text-primary        /* Dark text content */
text-gray-700 → text-secondary      /* Secondary content */
text-gray-600 → text-secondary      /* Medium gray text */
text-gray-500 → text-tertiary       /* Light gray text */
text-gray-400 → text-tertiary       /* Lighter text */
text-gray-300 → text-muted          /* Very light text */
text-black → text-primary           /* Black text */
text-white → text-inverse           /* White text (for dark backgrounds) */
```

### Background Color Migrations

```css
/* BEFORE → AFTER */
bg-white → bg-elevated              /* Card backgrounds, modals */
bg-gray-50 → bg-secondary          /* Light gray backgrounds */
bg-gray-100 → bg-tertiary          /* Medium gray backgrounds */
bg-gray-200 → bg-tertiary          /* Darker gray backgrounds */
bg-gray-800 → bg-primary           /* Dark backgrounds (in dark theme) */
bg-gray-900 → bg-primary           /* Very dark backgrounds */
```

### Border Color Migrations

```css
/* BEFORE → AFTER */
border-gray-200 → border-light      /* Light borders */
border-gray-300 → border-normal     /* Medium borders */
border-gray-400 → border-strong     /* Strong borders */
border-white → border-light         /* White borders */
```

### Shadow Migrations

```css
/* BEFORE → AFTER */
shadow-sm → shadow-theme-sm         /* Small shadows */
shadow → shadow-theme-base          /* Default shadows */
shadow-md → shadow-theme-md         /* Medium shadows */
shadow-lg → shadow-theme-lg         /* Large shadows */
```

## Migration Priority Order

### Phase 1: Core Layout (CRITICAL)

1. **src/App.jsx** - Root application wrapper
2. **src/components/layout/Header.jsx** - Main navigation
3. **src/components/layout/Sidebar.jsx** - Side navigation
4. **src/components/layout/DashboardLayout.jsx** - Layout wrapper

### Phase 2: Dashboard Components (HIGH)

1. **src/pages/EnterpriseEnhancedDashboard.jsx** - Main dashboard
2. **src/pages/WorldClassDashboard.jsx** - Enterprise dashboard
3. **src/components/widgets/\*.jsx** - All widget components

### Phase 3: Feature Pages (MEDIUM)

1. **src/components/WorkingCapital/\*.jsx** - Financial pages
2. **src/components/analytics/\*.jsx** - Analytics pages
3. **src/components/forecasting/\*.jsx** - Forecasting pages

### Phase 4: Admin & Settings (LOW)

1. **src/components/admin/**
2. **src/pages/auth/**
3. **Utility components**

## Automated Migration Patterns

### Find & Replace Patterns

```regex
# Text Colors
text-gray-900 → text-primary
text-gray-[78]00 → text-primary
text-gray-[56]00 → text-secondary
text-gray-[34]00 → text-tertiary
text-black → text-primary
text-white → text-inverse

# Backgrounds
bg-white → bg-elevated
bg-gray-50 → bg-secondary
bg-gray-[12]00 → bg-tertiary

# Borders
border-gray-200 → border-light
border-gray-300 → border-normal
border-white → border-light
```

## Component-Specific Guidelines

### Cards & Containers

```jsx
// OLD
<div className="bg-white border border-gray-200 shadow">

// NEW
<div className="bg-elevated border border-light shadow-theme-base">
```

### Text Elements

```jsx
// OLD
<h1 className="text-2xl font-bold text-gray-900">
<p className="text-gray-600">

// NEW
<h1 className="text-2xl font-bold text-primary">
<p className="text-secondary">
```

### Form Elements

```jsx
// OLD
<input className="bg-white border-gray-300 text-gray-900">

// NEW
<input className="input-theme">
```

### Buttons

```jsx
// OLD
<button className="bg-blue-600 text-white border border-blue-600">

// NEW
<button className="btn-theme-primary">
```

## Testing Checklist

### Theme Switching Test

- [ ] Switch to Bright theme - verify high contrast
- [ ] Switch to Medium theme - verify balanced colors
- [ ] Switch to Dark theme - verify dark mode colors
- [ ] Test all interactive states (hover, focus, active)

### Component Coverage Test

- [ ] Header navigation displays correctly in all themes
- [ ] Sidebar menu adapts to theme colors
- [ ] Dashboard widgets use theme-aware colors
- [ ] Forms and inputs follow theme system
- [ ] Cards and containers have proper backgrounds
- [ ] Text hierarchy is maintained across themes

### Accessibility Test

- [ ] WCAG AA contrast ratios maintained
- [ ] Focus indicators visible in all themes
- [ ] Text remains readable in all themes
- [ ] Interactive elements clearly distinguishable

## Implementation Notes

### Import Requirements

```jsx
// Add to components using theme system
import { useTheme } from '../ui/ThemeProvider'

// Usage
const { theme } = useTheme()
```

### CSS Class Application

```jsx
// Always prefer theme-aware classes
className = 'text-primary bg-elevated border-light'

// Avoid hardcoded colors
className = 'text-gray-900 bg-white border-gray-200'
```

### Performance Considerations

- Theme switching should be instant (0ms with CSS variables)
- No JavaScript required for color changes
- Minimal bundle size impact
- No runtime performance degradation

## Post-Migration Validation

### Build Verification

```bash
npm run build
# Should complete in <18 seconds
# Bundle size should not increase significantly
```

### Theme System Test

```bash
npm run preview
# Test theme switching on localhost:4173
# Verify all components respond to theme changes
```

### Production Deployment

```bash
git add .
git commit -m "feat: complete theme system migration"
git push origin production
```

## Common Migration Patterns

### Pattern 1: Simple Text Color

```jsx
// BEFORE
<span className="text-gray-600">Secondary text</span>

// AFTER
<span className="text-secondary">Secondary text</span>
```

### Pattern 2: Card Component

```jsx
// BEFORE
<div className="bg-white rounded-lg border border-gray-200 shadow p-6">

// AFTER
<div className="bg-elevated rounded-lg border border-light shadow-theme-base p-6">
```

### Pattern 3: Form Input

```jsx
// BEFORE
<input className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900">

// AFTER
<input className="w-full px-3 py-2 border rounded-md input-theme">
```

### Pattern 4: Button Variants

```jsx
// BEFORE
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">

// AFTER
<button className="px-4 py-2 rounded btn-theme-primary">
```

## Estimated Impact

- **Files to migrate**: 210+
- **Occurrences to fix**: 4,206+
- **Expected time**: 4-6 hours
- **Performance improvement**: Instant theme switching
- **User experience**: Optimal eye comfort across all lighting conditions
