# Sentia Manufacturing Dashboard Design System

A comprehensive, enterprise-grade design system built for the Sentia Manufacturing Dashboard with TypeScript support, dark/light theming, market-specific customization, and responsive design.

## Features

- 🎨 **Token-based Design**: Comprehensive design tokens for colors, typography, spacing, shadows, and more
- 🌓 **Dark/Light Mode**: Full theme support with system preference detection
- 🌍 **Market Localization**: Customizable themes for UK, EU, and US markets
- 📱 **Responsive**: Mobile-first responsive design with 5 breakpoints
- ⚡ **Performance**: CSS variables for dynamic theming with minimal runtime overhead
- 🎭 **Animations**: Smooth micro-interactions with respect for reduced motion preferences
- 🎯 **TypeScript**: Full type safety for all design tokens and utilities
- ♿ **Accessible**: WCAG 2.1 AA compliant with high contrast mode support

## Installation

The design system is built into the project. To use it:

```jsx
import { ThemeProvider, useTheme } from '@/lib/design-system';

function App() {
  return (
    <ThemeProvider defaultMode="system">
      <YourApp />
    </ThemeProvider>
  );
}
```

## Design Tokens

### Colors

The design system uses a functional color approach with semantic naming:

```typescript
import { colors, lightColors, darkColors } from '@/lib/design-system';

// Primary color palette
colors.primary[500] // #3b82f6
colors.primary[600] // #2563eb

// Functional colors
lightColors.text.primary      // #0f172a
lightColors.background.primary // #f8fafc
```

### Typography

Typography follows a modular scale (1.25 - Major Third) with Inter for UI and Roboto Mono for metrics:

```typescript
import { typography } from '@/lib/design-system';

// Usage in CSS-in-JS
const styles = {
  ...typography.heading.lg,
  color: 'var(--color-text-primary)'
};
```

### Spacing

Based on a 4px grid system:

```typescript
import { spacing } from '@/lib/design-system';

spacing[1]  // 4px
spacing[2]  // 8px
spacing[4]  // 16px
spacing[6]  // 24px
```

### Breakpoints

Mobile-first responsive breakpoints:

```typescript
import { breakpoints } from '@/lib/design-system';

breakpoints.sm  // 640px  (Mobile)
breakpoints.md  // 768px  (Tablet)
breakpoints.lg  // 1024px (Desktop)
breakpoints.xl  // 1280px (Wide)
breakpoints['2xl'] // 1536px (Ultra-wide)
```

## Theme Usage

### Theme Provider

Wrap your app with the ThemeProvider:

```jsx
import { ThemeProvider } from '@/lib/design-system';

<ThemeProvider 
  defaultMode="system" 
  defaultMarketRegion="uk"
  enableSystemTheme={true}
>
  <App />
</ThemeProvider>
```

### Using Theme in Components

```jsx
import { useTheme } from '@/lib/design-system';

function MyComponent() {
  const { theme, mode, setMode, toggleMode } = useTheme();
  
  return (
    <div style={{ 
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.background.primary 
    }}>
      <button onClick={toggleMode}>
        Switch to {mode === 'light' ? 'dark' : 'light'} mode
      </button>
    </div>
  );
}
```

### CSS Variables

All design tokens are available as CSS custom properties:

```css
.my-component {
  color: var(--color-text-primary);
  background: var(--color-surface-primary);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  font-family: var(--typography-body-md-font-family);
  font-size: var(--typography-body-md-font-size);
}
```

## Responsive Design

### Responsive Utilities

```typescript
import { responsiveStyles, responsiveFlex, responsiveGrid } from '@/lib/design-system';

// Responsive values
const styles = responsiveStyles({
  sm: { fontSize: '14px' },
  md: { fontSize: '16px' },
  lg: { fontSize: '18px' }
});

// Responsive flexbox
const flexStyles = responsiveFlex({
  direction: { sm: 'column', lg: 'row' },
  gap: { sm: '2', lg: '4' }
});

// Responsive grid
const gridStyles = responsiveGrid({
  columns: { sm: 1, md: 2, lg: 3 },
  gap: '4'
});
```

### Media Queries

```typescript
import { createMediaQuery } from '@/lib/design-system';

const styles = {
  fontSize: '14px',
  [createMediaQuery.up('md')]: {
    fontSize: '16px'
  },
  [createMediaQuery.down('sm')]: {
    fontSize: '12px'
  }
};
```

## Market Customization

The design system supports market-specific theming:

```jsx
import { ThemeProvider } from '@/lib/design-system';

// UK Market (Royal Blue)
<ThemeProvider marketRegion="uk">
  <App />
</ThemeProvider>

// EU Market (European Blue)
<ThemeProvider marketRegion="eu">
  <App />
</ThemeProvider>

// US Market (Liberty Blue)
<ThemeProvider marketRegion="us">
  <App />
</ThemeProvider>
```

Market colors are available as CSS variables:

```css
.market-button {
  background-color: var(--color-market-primary-500);
  border-color: var(--color-market-accent);
}
```

## Animation System

### Duration and Easing

```typescript
import { duration, easing, createTransition } from '@/lib/design-system';

// Predefined durations
duration.fast    // 150ms
duration.normal  // 250ms
duration.slow    // 400ms

// Material Design easing curves
easing.standard    // cubic-bezier(0.4, 0, 0.2, 1)
easing.decelerated // cubic-bezier(0, 0, 0.2, 1)
easing.accelerated // cubic-bezier(0.4, 0, 1, 1)

// Create transitions
const transition = createTransition(
  ['transform', 'opacity'],
  'fast',
  'standard'
);
```

### CSS Variables

```css
.animated-element {
  transition: 
    transform var(--duration-fast) var(--easing-standard),
    opacity var(--duration-fast) var(--easing-standard);
}
```

## Component Examples

### Button Component

```jsx
import { useTheme, createTransition } from '@/lib/design-system';

const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const { theme } = useTheme();
  
  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    fontFamily: theme.typography.body.md.fontFamily,
    fontWeight: 600,
    borderRadius: theme.radius.md,
    ...createTransition(['background-color', 'transform', 'box-shadow']),
    
    // Size variants
    ...(size === 'sm' && {
      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
      fontSize: theme.typography.body.sm.fontSize
    }),
    ...(size === 'md' && {
      padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
      fontSize: theme.typography.body.md.fontSize
    }),
    ...(size === 'lg' && {
      padding: `${theme.spacing[4]} ${theme.spacing[6]}`,
      fontSize: theme.typography.body.lg.fontSize
    }),
    
    // Variant styles
    ...(variant === 'primary' && {
      backgroundColor: theme.colors.interactive.primary,
      color: theme.colors.text.inverse,
      ':hover': {
        backgroundColor: theme.colors.interactive.primaryHover,
        transform: 'translateY(-1px)',
        boxShadow: theme.shadows.md.boxShadow
      }
    }),
    ...(variant === 'secondary' && {
      backgroundColor: theme.colors.interactive.secondary,
      color: theme.colors.text.primary,
      ':hover': {
        backgroundColor: theme.colors.interactive.secondaryHover
      }
    })
  };
  
  return <button style={styles} {...props}>{children}</button>;
};
```

### Card Component

```jsx
import { useTheme } from '@/lib/design-system';

const Card = ({ children, elevated = false, interactive = false }) => {
  const { theme } = useTheme();
  
  const styles = {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border.primary}`,
    padding: theme.spacing[6],
    ...(elevated && {
      boxShadow: theme.shadows.lg.boxShadow
    }),
    ...(interactive && {
      cursor: 'pointer',
      transition: `transform ${theme.animations.duration.fast} ${theme.animations.easing.standard}`,
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows.xl.boxShadow
      }
    })
  };
  
  return <div style={styles}>{children}</div>;
};
```

## CSS Classes

Pre-built utility classes are available in `/src/styles/design-system.css`:

```html
<!-- Typography -->
<h1 class="text-display-xl">Display Extra Large</h1>
<h2 class="text-heading-lg">Heading Large</h2>
<p class="text-body-md">Body Medium</p>
<code class="text-mono">Monospace Text</code>

<!-- Colors -->
<div class="text-primary bg-surface-primary">Primary text on primary surface</div>
<div class="text-success">Success text</div>
<div class="text-error">Error text</div>

<!-- Spacing -->
<div class="p-4 m-2">Padding 16px, Margin 8px</div>

<!-- Shadows -->
<div class="shadow-md">Medium shadow</div>

<!-- Border Radius -->
<div class="rounded-lg">Large border radius</div>

<!-- Animations -->
<div class="transition-normal">Normal transition</div>
```

## Best Practices

### 1. Use Design Tokens
Always use design tokens instead of hard-coded values:

```jsx
// ❌ Don't do this
const styles = {
  color: '#334155',
  fontSize: '16px',
  padding: '12px'
};

// ✅ Do this
const { theme } = useTheme();
const styles = {
  color: theme.colors.text.secondary,
  fontSize: theme.typography.body.md.fontSize,
  padding: theme.spacing[3]
};
```

### 2. Responsive Design
Use mobile-first responsive design:

```jsx
import { responsiveStyles } from '@/lib/design-system';

const styles = responsiveStyles({
  sm: { fontSize: '14px', padding: '8px' },    // Mobile first
  md: { fontSize: '16px', padding: '12px' },   // Tablet
  lg: { fontSize: '18px', padding: '16px' }    // Desktop
});
```

### 3. Semantic Colors
Use semantic color names for maintainability:

```jsx
// ❌ Don't use color scale directly for semantic meaning
color: theme.colors.neutral[500]

// ✅ Use semantic color names
color: theme.colors.text.secondary
```

### 4. Consistent Spacing
Use the spacing scale consistently:

```jsx
// ❌ Inconsistent spacing
margin: '10px'
padding: '14px'

// ✅ Consistent spacing scale
margin: theme.spacing[2]    // 8px
padding: theme.spacing[3]   // 12px
```

### 5. Performance
Leverage CSS variables for theme switching:

```css
/* ✅ Performant theme switching with CSS variables */
.component {
  color: var(--color-text-primary);
  background: var(--color-surface-primary);
  transition: background-color var(--duration-fast) var(--easing-standard);
}
```

## Browser Support

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

The design system uses CSS custom properties extensively. For older browser support, consider using a CSS custom properties polyfill.

## Contributing

When extending the design system:

1. Follow the existing token structure
2. Add TypeScript types for new tokens
3. Update CSS variables in the global stylesheet
4. Add utility functions for complex calculations
5. Include responsive variants where applicable
6. Test across all supported themes and markets

## Migration Guide

### From Tailwind CSS

The design system provides similar utilities to Tailwind:

```jsx
// Tailwind
<div className="text-lg font-semibold text-gray-900 bg-white p-4 rounded-lg shadow-md">

// Design System CSS Classes
<div className="text-heading-md text-primary bg-surface-primary p-4 rounded-lg shadow-md">

// Design System CSS-in-JS
const styles = {
  ...theme.typography.heading.md,
  color: theme.colors.text.primary,
  backgroundColor: theme.colors.surface.primary,
  padding: theme.spacing[4],
  borderRadius: theme.radius.lg,
  boxShadow: theme.shadows.md.boxShadow
};
```

This design system provides a solid foundation for building consistent, accessible, and performant user interfaces in the Sentia Manufacturing Dashboard.