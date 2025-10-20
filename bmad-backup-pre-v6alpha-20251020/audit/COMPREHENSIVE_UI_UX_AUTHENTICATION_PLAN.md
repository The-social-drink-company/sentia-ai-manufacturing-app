# Comprehensive UI/UX and Authentication Plan
## Sentia Manufacturing Dashboard Transformation

**Document Version:** 1.0
**Created:** October 19, 2025
**Project:** Sentia AI Manufacturing Dashboard
**Methodology:** BMAD-METHOD v6a Integration
**Target Mockup:** https://manufacture-ng7zmx.manus.space/

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Authentication Flow Architecture](#2-authentication-flow-architecture)
3. [UI/UX Design Specifications](#3-uiux-design-specifications)
4. [Implementation Roadmap](#4-implementation-roadmap)
5. [Technical Specifications](#5-technical-specifications)
6. [Testing Strategy](#6-testing-strategy)
7. [Technical Appendix](#7-technical-appendix)

---

## 1. Executive Summary

### 1.1 Overview

This document provides a comprehensive transformation plan to redesign the Sentia Manufacturing Dashboard from its current functional state to a production-ready enterprise platform matching the professional mockup design. The plan integrates seamlessly with the existing BMAD-METHOD v6a development framework already in place.

### 1.2 Current State Analysis

**Strengths:**
- ✅ Solid authentication infrastructure (Clerk integration with fallbacks)
- ✅ Modern tech stack (React 18, Vite 4, Tailwind CSS)
- ✅ Professional deployment pipeline (Render with dev/test/prod environments)
- ✅ Comprehensive routing system with protected routes
- ✅ Real data integrations (Shopify, Xero operational)
- ✅ Existing component library (shadcn/ui)

**Gaps:**
- ❌ Landing page requires modernization to match mockup aesthetics
- ❌ Dashboard UI needs visual consistency improvements
- ❌ Authentication flow requires UX polish
- ❌ Sidebar navigation needs design alignment
- ❌ Header requires breadcrumb and status enhancements
- ❌ Chart components need styling harmonization

### 1.3 Transformation Objectives

1. **Modernize Landing Page**: Create professional marketing experience with clear authentication CTAs
2. **Enhance Authentication Flow**: Polish Clerk integration with seamless user experience
3. **Redesign Dashboard Layout**: Implement consistent design system across all views
4. **Improve Navigation**: Create intuitive sidebar with role-based access
5. **Optimize Component Library**: Build reusable UI components matching mockup design
6. **Ensure Accessibility**: WCAG 2.1 AA compliance across all interfaces

### 1.4 Success Criteria

- **User Experience**: Sign-in to dashboard in < 3 clicks
- **Performance**: Page load times < 2 seconds
- **Accessibility**: 100% keyboard navigable, ARIA compliant
- **Visual Consistency**: 95%+ match to mockup design
- **Responsive Design**: Perfect rendering on mobile, tablet, desktop
- **Authentication**: < 500ms auth check, graceful fallbacks

### 1.5 Timeline

**Total Duration:** 6 weeks (30 business days)

| Phase | Duration | Completion |
|-------|----------|------------|
| Phase 1: Foundation | 1 week | Week 1 |
| Phase 2: Authentication | 1 week | Week 2 |
| Phase 3: Layout | 1 week | Week 3 |
| Phase 4: Dashboard Components | 2 weeks | Week 4-5 |
| Phase 5: Polish & Testing | 1 week | Week 6 |

---

## 2. Authentication Flow Architecture

### 2.1 Overview

The authentication system leverages Clerk for production authentication with intelligent fallback to development mode when needed. The current implementation (`BulletproofAuthProvider.jsx`) provides robust error handling and will be enhanced with improved UX flows.

### 2.2 Authentication State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                    UNAUTHENTICATED STATE                     │
│                                                               │
│  User on Landing Page (/)                                    │
│  ├─ Primary CTA: "Sign In" button                           │
│  ├─ Secondary CTA: "Learn More" button                      │
│  └─ Footer links: Sign Up option                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION INITIATED                    │
│                                                               │
│  User clicks "Sign In" → Clerk Modal/Redirect                │
│  ├─ Clerk SignIn Component Renders                          │
│  ├─ Email/Password OR OAuth options shown                   │
│  └─ Loading state: "Authenticating..."                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION PROCESSING                  │
│                                                               │
│  Clerk Validates Credentials                                 │
│  ├─ Success → Generate JWT session token                    │
│  ├─ Error → Display error message, retry option             │
│  └─ Timeout (3s) → Fallback to development mode             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATED STATE                        │
│                                                               │
│  Redirect to /app/dashboard                                  │
│  ├─ Session token stored (HttpOnly cookie)                  │
│  ├─ User context available globally                         │
│  ├─ Role-based permissions applied                          │
│  └─ Dashboard layout renders with sidebar/header            │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Public Experience (Unauthenticated)

#### 2.3.1 Landing Page (`/`)

**Purpose:** Marketing and conversion page for unauthenticated users

**Design Specifications:**

```jsx
// Visual Design
Background: Gradient from #3B82F6 (blue) to #8B5CF6 (purple)
Pattern Overlay: Radial gradient dots (40px grid)
Typography:
  - Hero Title: text-5xl to text-7xl, font-extrabold, text-white
  - Subtitle: text-xl, text-blue-100
Spacing: py-24 to py-40 (responsive)
```

**Layout Structure:**

1. **Hero Section**
   - Full-viewport height background gradient
   - Centered content with max-width container
   - Large heading: "Sentia Manufacturing Enterprise Dashboard"
   - Subheading: Value proposition (1-2 lines)
   - Primary CTA: "Sign In" button (prominent, white background)
   - Secondary CTA: "Learn More" button (outline style)

2. **Features Section**
   - Background: Light gray (#F8FAFC)
   - Section title: "Powerful Manufacturing Intelligence"
   - 3-column grid (responsive to 1-column on mobile)
   - 6 feature cards with icons, titles, descriptions
   - Hover effects: Scale 1.05, shadow increase

3. **Trust Metrics Section**
   - Background: White
   - Section title: "Trusted by Manufacturing Leaders"
   - 4-column grid (responsive)
   - Metric cards: Large value, small label
   - Icons: Checkmark or relevant emoji

4. **Final CTA Section**
   - Background: Purple to blue gradient
   - Large heading: "Ready to optimize?"
   - Single CTA button: "Get Started"

5. **Footer**
   - Background: Dark slate (#1E293B)
   - Company name, copyright
   - Links: Privacy, Terms, Contact

**Component Implementation:**

```jsx
// Current Implementation Status
File: src/pages/LandingPage.jsx
Status: ✅ Functional with Clerk integration
Enhancements Needed:
  - Improve visual consistency with mockup
  - Add animations (framer-motion already integrated)
  - Enhance mobile responsiveness
  - Add loading states for sign-in modal
```

#### 2.3.2 Authentication Components

**Clerk SignIn Component:**

```jsx
// Configuration
Mode: "modal" (overlay) OR "redirect" (full page)
Redirect URL: /app/dashboard
Appearance: Custom theme matching brand colors

// Appearance Configuration
{
  baseTheme: undefined, // Use default Clerk styling
  variables: {
    colorPrimary: '#2563eb',         // Blue-600
    colorTextOnPrimaryBackground: '#ffffff',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#1f2937',      // Gray-800
    fontFamily: '"Inter", -apple-system, ...',
    borderRadius: '0.5rem',          // 8px rounded
  },
  elements: {
    card: {
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      border: '1px solid #e5e7eb',
    },
    headerTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
    },
    headerSubtitle: {
      color: '#6b7280',
    },
  },
}
```

**Sign In Flow:**

1. User clicks "Sign In" on landing page
2. Clerk modal appears with:
   - Email input field
   - Password input field
   - "Continue with Google" OAuth button (optional)
   - "Continue with Microsoft" OAuth button (optional)
   - "Sign up" link at bottom
3. User enters credentials
4. Clerk validates (client-side first, then server)
5. On success: Modal closes, redirect to `/app/dashboard`
6. On error: Error message shown inline, retry allowed

**Sign Up Flow:**

1. User clicks "Sign Up" link in Clerk modal
2. Clerk SignUp component renders with:
   - Full name input
   - Email input
   - Password input (with strength indicator)
   - Terms acceptance checkbox
3. Email verification sent (if enabled)
4. User verifies email via link
5. Redirect to `/app/dashboard` on completion

### 2.4 Session Management

**Technology:** Clerk JWT tokens + HttpOnly cookies

**Token Lifecycle:**

```
1. Sign In → Generate JWT with 1-hour expiration
2. Token stored in HttpOnly cookie (secure, sameSite)
3. Every API request includes token in Authorization header
4. Token auto-refreshed 5 minutes before expiration
5. Sign Out → Token invalidated, cookie cleared
```

**Session Persistence:**

- Sessions persist across browser refreshes
- Sessions persist across tab closes
- Sessions expire after 7 days of inactivity
- "Remember me" extends to 30 days (optional)

**Security Measures:**

- CSRF protection via Clerk's built-in mechanisms
- XSS protection via HttpOnly cookies
- Token rotation on sensitive operations
- IP address validation (optional)
- Device fingerprinting (optional)

### 2.5 Protected Routes Architecture

**Route Protection Strategy:**

```jsx
// Current Implementation (App-simple-environment.jsx)

// Development Mode (VITE_DEVELOPMENT_MODE=true)
const DevelopmentProtectedRoute = ({ children }) => (
  <XeroProvider>
    <ProgressiveDashboardLoader>
      <DashboardLayout>{children}</DashboardLayout>
    </ProgressiveDashboardLoader>
  </XeroProvider>
)

// Production Mode (VITE_DEVELOPMENT_MODE=false)
const ProductionProtectedRoute = ({ children }) => {
  const { SignedIn, SignedOut, RedirectToSignIn } = useClerkComponents()

  return (
    <>
      <SignedIn>
        <XeroProvider>
          <ProgressiveDashboardLoader>
            <DashboardLayout>{children}</DashboardLayout>
          </ProgressiveDashboardLoader>
        </XeroProvider>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
```

**Route Structure:**

| Route | Protection | Component | Purpose |
|-------|-----------|-----------|---------|
| `/` | Public | LandingPage | Marketing homepage |
| `/landing` | Public | LandingPage | Alias for homepage |
| `/app/sign-in` | Public | ClerkSignInEnvironmentAware | Sign in page |
| `/app/sign-up` | Public | ClerkSignInEnvironmentAware | Sign up page |
| `/app/dashboard` | Protected | DashboardEnterprise | Main dashboard |
| `/app/forecasting` | Protected | Forecasting | Demand forecasting |
| `/app/inventory` | Protected | InventoryDashboard | Inventory management |
| `/app/working-capital` | Protected | RealWorkingCapital | Working capital analysis |
| `/app/what-if` | Protected | WhatIfAnalysis | Scenario planning |
| `/app/reports` | Protected | FinancialReports | Financial reports |
| `/app/admin` | Protected | AdminPanelEnhanced | Admin panel |
| `/app/admin/import` | Protected | ImportWizard | Import wizard |
| `/app/admin/export` | Protected | ExportBuilder | Export builder |

**Redirect Logic:**

```
Unauthenticated user attempts protected route:
  1. Check authentication status via Clerk
  2. If not signed in → Redirect to /app/sign-in
  3. Store original URL in sessionStorage
  4. After successful sign in → Redirect to original URL
  5. If original URL not stored → Redirect to /app/dashboard
```

### 2.6 Role-Based Access Control (RBAC)

**Role Hierarchy:**

```
viewer < operator < manager < admin < master_admin
```

**Permission Matrix:**

| Feature | Viewer | Operator | Manager | Admin | Master Admin |
|---------|--------|----------|---------|-------|--------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Forecasting | ❌ | ✅ | ✅ | ✅ | ✅ |
| Inventory | ❌ | ✅ | ✅ | ✅ | ✅ |
| Working Capital | ❌ | ❌ | ✅ | ✅ | ✅ |
| What-If Analysis | ❌ | ❌ | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data Import | ❌ | ❌ | ✅ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ | ✅ |
| System Config | ❌ | ❌ | ❌ | ❌ | ✅ |

**Implementation:**

```jsx
// useAuthRole hook (existing)
import useAuthRole from '@/hooks/useAuthRole'

const Component = () => {
  const { role } = useAuthRole()

  // Check if user has permission
  const hasPermission = ['manager', 'admin', 'master_admin'].includes(role)

  if (!hasPermission) {
    return <AccessDenied />
  }

  return <ProtectedFeature />
}
```

**Sidebar Navigation Role Filtering:**

```jsx
// Already implemented in Sidebar.jsx
const hasAccess = useCallback(
  item => {
    if (!item.roles || item.roles.length === 0) return true
    const userRole = role || 'viewer'
    return item.roles.includes(userRole)
  },
  [role]
)

// Filter navigation items
const accessibleItems = section.items.filter(item => hasAccess(item))
```

### 2.7 Error Handling & Edge Cases

**Clerk API Failures:**

```jsx
// Scenario 1: Clerk SDK fails to load
if (!ClerkComponents) {
  // Fallback to development mode
  return <DevelopmentProtectedRoute>{children}</DevelopmentProtectedRoute>
}

// Scenario 2: Clerk publishable key invalid
if (!isValidKey) {
  console.warn('Invalid Clerk key - using fallback mode')
  setAuthMode('fallback')
}

// Scenario 3: Clerk authentication timeout (>3s)
const timeout = setTimeout(() => {
  console.warn('Authentication timeout - switching to fallback mode')
  setAuthMode('fallback')
}, 3000)
```

**Network Failures:**

```jsx
// Show retry UI
<AuthError
  error={error}
  onRetry={handleRetry}
/>

// Retry logic
const handleRetry = () => {
  setRetryCount(prev => prev + 1)
  initialize()
}
```

**Session Expiration:**

```jsx
// Clerk automatically refreshes tokens
// If refresh fails, user is redirected to sign-in
<SignedOut>
  <RedirectToSignIn />
</SignedOut>
```

**Rate Limiting:**

```jsx
// Clerk handles rate limiting internally
// Show appropriate error message to user
"Too many attempts. Please try again in 5 minutes."
```

### 2.8 Authentication Flow Diagrams

#### 2.8.1 Sign In Flow

```
┌──────────────┐
│  Landing     │
│  Page (/)    │
└──────┬───────┘
       │
       │ User clicks "Sign In"
       ▼
┌──────────────┐
│  Clerk       │
│  SignIn      │
│  Modal       │
└──────┬───────┘
       │
       │ User enters email/password
       ▼
┌──────────────┐      ┌──────────────┐
│  Clerk API   │─────▶│  Validation  │
│  Validates   │      │  Success     │
└──────┬───────┘      └──────┬───────┘
       │                     │
       │ Error               │ Success
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│  Show Error  │      │  Generate    │
│  Message     │      │  JWT Token   │
└──────────────┘      └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  Store in    │
                      │  HttpOnly    │
                      │  Cookie      │
                      └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  Redirect to │
                      │  /app/       │
                      │  dashboard   │
                      └──────────────┘
```

#### 2.8.2 Session Validation Flow

```
┌──────────────┐
│  User visits │
│  protected   │
│  route       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Check auth  │
│  status      │
│  (Clerk)     │
└──────┬───────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Signed In   │  │  Signed Out  │  │  Loading     │
│  Valid token │  │  No token    │  │  Checking... │
└──────┬───────┘  └──────┬───────┘  └──────────────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│  Render      │  │  Redirect to │
│  Dashboard   │  │  /app/       │
│  Layout      │  │  sign-in     │
└──────────────┘  └──────────────┘
```

---

## 3. UI/UX Design Specifications

### 3.1 Design System Foundation

#### 3.1.1 Color Palette

**Primary Colors:**

```css
/* Blue Gradient (Primary) */
--blue-50:  #eff6ff;
--blue-100: #dbeafe;
--blue-200: #bfdbfe;
--blue-300: #93c5fd;
--blue-400: #60a5fa;
--blue-500: #3b82f6;  /* Primary blue */
--blue-600: #2563eb;
--blue-700: #1d4ed8;
--blue-800: #1e40af;
--blue-900: #1e3a8a;

/* Purple Gradient (Secondary) */
--purple-50:  #faf5ff;
--purple-100: #f3e8ff;
--purple-200: #e9d5ff;
--purple-300: #d8b4fe;
--purple-400: #c084fc;
--purple-500: #a855f7;
--purple-600: #9333ea;
--purple-700: #7e22ce;
--purple-800: #6b21a8;
--purple-900: #581c87;
```

**Neutral Colors:**

```css
/* Slate (Backgrounds & Text) */
--slate-50:  #f8fafc;  /* Light background */
--slate-100: #f1f5f9;
--slate-200: #e2e8f0;  /* Border color */
--slate-300: #cbd5e1;
--slate-400: #94a3b8;  /* Secondary text */
--slate-500: #64748b;
--slate-600: #475569;
--slate-700: #334155;  /* Active sidebar bg */
--slate-800: #1e293b;  /* Dark sidebar bg */
--slate-900: #0f172a;  /* Footer bg */
```

**Semantic Colors:**

```css
/* Success (Green) */
--green-500: #10b981;
--green-600: #059669;

/* Warning (Orange) */
--orange-500: #f97316;
--orange-600: #ea580c;

/* Error (Red) */
--red-500: #ef4444;
--red-600: #dc2626;

/* Info (Cyan) */
--cyan-500: #06b6d4;
--cyan-600: #0891b2;
```

**Gradient Definitions:**

```css
/* Landing Page Hero */
.bg-gradient-hero {
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
}

/* KPI Cards */
.bg-gradient-revenue {
  background: linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%);
}

.bg-gradient-units {
  background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%);
}

.bg-gradient-margin {
  background: linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%);
}

.bg-gradient-wc {
  background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%);
}

/* Working Capital Card */
.bg-gradient-capital {
  background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%);
}
```

#### 3.1.2 Typography Scale

**Font Family:**

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Type Scale:**

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| Display XL | 72px (4.5rem) | 90px | 800 | Hero headlines |
| Display L | 60px (3.75rem) | 72px | 800 | Landing sections |
| Display M | 48px (3rem) | 60px | 700 | Page titles |
| Heading XL | 36px (2.25rem) | 48px | 700 | Section titles |
| Heading L | 30px (1.875rem) | 40px | 600 | Card headers |
| Heading M | 24px (1.5rem) | 32px | 600 | Widget titles |
| Heading S | 20px (1.25rem) | 28px | 600 | Subsection titles |
| Body L | 18px (1.125rem) | 28px | 400 | Large body text |
| Body M | 16px (1rem) | 24px | 400 | Default body text |
| Body S | 14px (0.875rem) | 20px | 400 | Small body text |
| Caption | 12px (0.75rem) | 16px | 400 | Captions, labels |
| Overline | 12px (0.75rem) | 16px | 600 | Uppercase labels |

**Font Weights:**

```css
--font-regular: 400;
--font-medium:  500;
--font-semibold: 600;
--font-bold:    700;
--font-extrabold: 800;
```

**Tailwind Classes:**

```jsx
// Hero Heading
<h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold">

// Page Title
<h1 className="text-3xl font-semibold">

// Section Title
<h2 className="text-xl font-semibold">

// Card Title
<h3 className="text-lg font-semibold">

// Body Text
<p className="text-base text-muted-foreground">

// Small Text
<span className="text-sm text-muted-foreground">

// Caption
<span className="text-xs text-muted-foreground">
```

#### 3.1.3 Spacing System

**Base Unit:** 4px (0.25rem)

**Spacing Scale:**

| Name | Value | Pixels | Usage |
|------|-------|--------|-------|
| xs | 0.25rem | 4px | Tight spacing |
| sm | 0.5rem | 8px | Small gaps |
| md | 0.75rem | 12px | Medium gaps |
| base | 1rem | 16px | Default spacing |
| lg | 1.5rem | 24px | Large spacing |
| xl | 2rem | 32px | Extra large |
| 2xl | 2.5rem | 40px | Section spacing |
| 3xl | 3rem | 48px | Large sections |
| 4xl | 4rem | 64px | Hero sections |

**Component Spacing:**

```jsx
// Card Padding
className="p-6"  // 24px all sides

// Section Padding
className="py-16 sm:py-24"  // 64px-96px vertical

// Grid Gaps
className="gap-6"  // 24px between items

// Stack Spacing
className="space-y-6"  // 24px vertical stack

// Inline Spacing
className="space-x-3"  // 12px horizontal
```

#### 3.1.4 Border Radius

```css
/* Tailwind rounded classes */
--rounded-none: 0px;
--rounded-sm: 0.125rem;  /* 2px */
--rounded: 0.25rem;      /* 4px */
--rounded-md: 0.375rem;  /* 6px */
--rounded-lg: 0.5rem;    /* 8px */
--rounded-xl: 0.75rem;   /* 12px */
--rounded-2xl: 1rem;     /* 16px */
--rounded-3xl: 1.5rem;   /* 24px */
--rounded-full: 9999px;
```

**Component Radii:**

```jsx
// Buttons
className="rounded-xl"  // 12px

// Cards
className="rounded-xl"  // 12px

// Inputs
className="rounded-lg"  // 8px

// Badges
className="rounded-full"  // Pill shape

// Modals
className="rounded-2xl"  // 16px
```

#### 3.1.5 Shadows

```css
/* Tailwind shadow classes */
.shadow-sm {
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.shadow {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.shadow-md {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.shadow-lg {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.shadow-xl {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
}
```

**Component Shadows:**

```jsx
// Cards (Default)
className="shadow-lg"

// Cards (Hover)
className="hover:shadow-xl"

// Modals
className="shadow-2xl"

// Dropdown Menus
className="shadow-lg"

// Floating Action Buttons
className="shadow-xl"
```

### 3.2 Layout Architecture

#### 3.2.1 Authenticated Layout Structure

```
┌───────────────────────────────────────────────────────────┐
│                         HEADER (64px)                      │
│  Logo | Breadcrumbs | Status | Time | Bell | UserButton   │
├─────────┬─────────────────────────────────────────────────┤
│         │                                                   │
│ SIDEBAR │               MAIN CONTENT AREA                  │
│ (256px) │                                                   │
│         │  ┌─────────────────────────────────────────┐     │
│ Nav     │  │                                         │     │
│ Items   │  │          Page Content                   │     │
│         │  │          (scrollable)                   │     │
│         │  │                                         │     │
│         │  │                                         │     │
│         │  └─────────────────────────────────────────┘     │
│         │                                                   │
│ User    │                                                   │
│ Profile │                                                   │
└─────────┴───────────────────────────────────────────────────┘
```

**Dimensions:**

- **Sidebar Width:** 256px (w-64) desktop, full-width mobile
- **Header Height:** 64px (h-16) fixed
- **Main Content:** Calculated (100vw - 256px on desktop)
- **Max Content Width:** None (full width)
- **Content Padding:** 24px (p-6)

**Responsive Breakpoints:**

```jsx
// Tailwind breakpoints
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Small desktops (sidebar becomes fixed)
xl: 1280px  // Desktops
2xl: 1536px // Large desktops
```

**Layout Behavior:**

| Screen Size | Sidebar | Header | Content |
|-------------|---------|--------|---------|
| Mobile (< 1024px) | Hidden (hamburger menu) | Mobile header | Full width |
| Desktop (≥ 1024px) | Fixed left | Desktop header | Offset by sidebar width |

#### 3.2.2 Sidebar Navigation Design

**File:** `src/components/layout/Sidebar.jsx` (existing, needs styling updates)

**Design Specifications:**

```jsx
// Container
Background: #1E293B (slate-800)
Width: 256px (w-64)
Height: 100vh
Position: fixed left
Border Right: 1px solid #334155 (slate-700)
Z-Index: 50

// Sidebar Sections
1. Header (64px) - Logo + company name
2. Navigation (~calc(100vh - 128px)) - Scrollable nav items
3. User Section (64px) - User profile at bottom
```

**Logo Section:**

```jsx
<div className="flex items-center justify-between p-4 h-16 border-b border-slate-700">
  {/* Logo */}
  <div className="flex items-center space-x-3">
    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-sm">S</span>
    </div>
    <div>
      <h2 className="text-sm font-semibold text-white">Sentia</h2>
      <p className="text-xs text-slate-400">Manufacturing</p>
    </div>
  </div>

  {/* Collapse Button */}
  <button className="p-2 rounded-lg hover:bg-slate-700">
    <ChevronLeftIcon className="w-4 h-4 text-slate-400" />
  </button>
</div>
```

**Navigation Groups:**

```jsx
// Section Header
<button className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
  <span>OVERVIEW</span>
  <ChevronDownIcon className="w-3 h-3" />
</button>

// Navigation Item (Inactive)
<NavLink className="flex items-center px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700">
  <HomeIcon className="w-5 h-5 text-slate-400" />
  <span className="ml-3 text-sm font-medium">Dashboard</span>
</NavLink>

// Navigation Item (Active)
<NavLink className="flex items-center px-3 py-2 rounded-lg bg-slate-700 text-white border-l-3 border-blue-500">
  <HomeIcon className="w-5 h-5 text-blue-500" />
  <span className="ml-3 text-sm font-medium">Dashboard</span>
</NavLink>

// Navigation Item with Badge
<NavLink className="flex items-center justify-between px-3 py-2 rounded-lg">
  <div className="flex items-center">
    <SparklesIcon className="w-5 h-5 text-slate-400" />
    <span className="ml-3 text-sm font-medium">AI Analytics</span>
  </div>
  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-900/30 text-purple-400">
    AI
  </span>
</NavLink>
```

**User Section:**

```jsx
<div className="p-4 border-t border-slate-700">
  <div className="flex items-center space-x-3">
    {/* Avatar */}
    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
      <span className="text-sm font-medium text-slate-200">
        {user.firstName?.[0]?.toUpperCase()}
      </span>
    </div>

    {/* User Info */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white truncate">
        {user.fullName || user.firstName}
      </p>
      <p className="text-xs text-slate-400 truncate capitalize">
        {role || 'Viewer'}
      </p>
    </div>
  </div>
</div>
```

**Mobile Sidebar:**

```jsx
// Mobile Overlay (shown when sidebar open)
{isMobile && isOpen && (
  <div
    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
    onClick={onToggle}
  />
)}

// Sidebar with transition
<aside className={cn(
  "fixed left-0 top-0 h-full bg-slate-800",
  "transition-all duration-300 z-50",
  "w-64",
  isMobile && !isOpen && "-translate-x-full"
)}>
```

#### 3.2.3 Header Design

**File:** `src/components/layout/Header.jsx` (needs significant enhancement)

**Design Specifications:**

```jsx
// Container
Background: White (#FFFFFF)
Height: 64px (h-16)
Border Bottom: 1px solid #E2E8F0 (slate-200)
Position: sticky top-0
Z-Index: 40
Padding: 0 24px (px-6)

// Layout: Flex row, items-center, justify-between
```

**Header Elements (Left to Right):**

1. **Mobile Menu Button** (< 1024px only)
```jsx
<button className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
  <Bars3Icon className="w-6 h-6 text-slate-600" />
</button>
```

2. **Breadcrumb Navigation**
```jsx
<nav className="hidden sm:flex items-center space-x-2 text-sm">
  <span className="text-slate-600">Dashboard</span>
  <ChevronRightIcon className="w-4 h-4 text-slate-400" />
  <span className="text-slate-600">OVERVIEW</span>
  <ChevronRightIcon className="w-4 h-4 text-slate-400" />
  <span className="text-slate-900 font-medium">Executive Dashboard</span>
</nav>
```

3. **System Status Badge**
```jsx
<div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
  All Systems Operational
</div>
```

4. **Current Time**
```jsx
<div className="hidden lg:block text-sm text-slate-600">
  {new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })}
</div>
```

5. **Notification Bell**
```jsx
<button className="relative p-2 rounded-lg hover:bg-slate-100">
  <BellIcon className="w-5 h-5 text-slate-600" />
  {/* Badge if notifications */}
  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
</button>
```

6. **User Button** (Clerk)
```jsx
<UserButton afterSignOutUrl="/" />
```

**Responsive Behavior:**

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Mobile Menu | ✅ Show | ✅ Show | ❌ Hide |
| Breadcrumbs | ❌ Hide | ✅ Show | ✅ Show |
| System Status | ❌ Hide | ✅ Show | ✅ Show |
| Time Display | ❌ Hide | ❌ Hide | ✅ Show |
| Notification Bell | ✅ Show | ✅ Show | ✅ Show |
| User Button | ✅ Show | ✅ Show | ✅ Show |

### 3.3 Dashboard Component Design

#### 3.3.1 KPI Card Grid

**Component:** `src/components/dashboard/KPIGrid.jsx` (existing, needs styling updates)

**Layout:**

```jsx
// Grid Container
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  {/* 4 KPI cards */}
</div>
```

**Individual KPI Card:**

```jsx
<div className={cn(
  "relative overflow-hidden rounded-xl p-6 shadow-lg",
  "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
  gradient // bg-gradient-revenue, bg-gradient-units, etc.
)}>
  {/* Icon */}
  <div className="text-4xl mb-2 text-white/80">
    {icon} {/* 💰, 📦, 📈, etc. */}
  </div>

  {/* Value */}
  <div className="text-4xl font-bold text-white mb-1">
    {value} {/* £10.76M, 350,314, 67.6%, etc. */}
  </div>

  {/* Label */}
  <div className="text-sm text-white/80 mb-3">
    {label} {/* Annual Revenue, Units Sold, etc. */}
  </div>

  {/* Trend Indicator */}
  {trend && (
    <div className={cn(
      "flex items-center gap-1 text-xs font-medium",
      trend.direction === 'up' ? "text-green-300" : "text-red-300"
    )}>
      {trend.direction === 'up' ? (
        <ArrowUpIcon className="w-3 h-3" />
      ) : (
        <ArrowDownIcon className="w-3 h-3" />
      )}
      <span>{Math.abs(trend.value)}%</span>
    </div>
  )}
</div>
```

**KPI Cards Data:**

```jsx
const kpis = [
  {
    icon: '💰',
    value: '£10.76M',
    label: 'Annual Revenue',
    gradient: 'bg-gradient-revenue',
    trend: { value: 15.2, direction: 'up' }
  },
  {
    icon: '📦',
    value: '350,314',
    label: 'Units Sold',
    gradient: 'bg-gradient-units',
    trend: { value: 8.3, direction: 'up' }
  },
  {
    icon: '📈',
    value: '67.6%',
    label: 'Gross Margin',
    gradient: 'bg-gradient-margin',
    trend: { value: 2.1, direction: 'up' }
  },
  {
    icon: '💼',
    value: '£869K',
    label: 'Working Capital',
    gradient: 'bg-gradient-wc',
    trend: null // or status: 'Optimized ✓'
  }
]
```

#### 3.3.2 Chart Card Design

**Component Pattern:**

```jsx
<Card className="rounded-xl shadow-md">
  <CardHeader>
    <div className="flex items-center gap-2">
      <span className="text-2xl">📊</span>
      <div>
        <CardTitle className="text-lg font-semibold">
          Chart Title
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Chart subtitle or description
        </CardDescription>
      </div>
    </div>
  </CardHeader>

  <CardContent className="h-64">
    {/* Chart component (Recharts) */}
  </CardContent>
</Card>
```

**Chart Types:**

1. **Sales Performance** (Grouped Bar Chart)
   - X-axis: Products (GABA Red, Black, Gold)
   - Y-axis (Left): Units Sold (K)
   - Y-axis (Right): Revenue (£M)
   - Bars: Red (units), Teal (revenue)

2. **Market Distribution** (Pie Chart)
   - Segments: UK (65%), USA (35%)
   - Colors: Blue (#3B82F6), Orange (#F97316)

3. **Stock Levels** (Grouped Bar Chart)
   - X-axis: Products
   - Y-axis: Units (K)
   - Bars: Purple (current), Orange (reorder level)

4. **P&L Analysis** (Multi-line Chart)
   - X-axis: Months
   - Y-axis (Left): Amount (£K)
   - Y-axis (Right): Margin (%)
   - Lines: Revenue, Gross Profit, EBITDA, Margin %

**Chart Styling (Recharts):**

```jsx
// Chart Container
<ResponsiveContainer width="100%" height="100%">
  <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
    <XAxis
      dataKey="name"
      stroke="#64748B"
      tick={{ fill: '#64748B', fontSize: 12 }}
    />
    <YAxis
      stroke="#64748B"
      tick={{ fill: '#64748B', fontSize: 12 }}
    />
    <Tooltip
      contentStyle={{
        background: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
      }}
    />
    <Legend
      wrapperStyle={{
        paddingTop: '20px',
        fontSize: '12px'
      }}
    />
    <Bar
      dataKey="units"
      fill="#EF4444"  // Red
      radius={[8, 8, 0, 0]}  // Rounded top corners
    />
    <Bar
      dataKey="revenue"
      fill="#14B8A6"  // Teal
      radius={[8, 8, 0, 0]}
    />
  </BarChart>
</ResponsiveContainer>
```

#### 3.3.3 Working Capital Card

**Design:**

```jsx
<div className="relative overflow-hidden rounded-xl p-8 shadow-xl bg-gradient-capital">
  {/* Background Pattern */}
  <div className="absolute inset-0 opacity-10">
    <div className="absolute inset-0" style={{
      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
      backgroundSize: '40px 40px'
    }} />
  </div>

  {/* Content */}
  <div className="relative">
    {/* Header */}
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-4xl">💰</span>
        <h3 className="text-2xl font-bold text-white">
          Working Capital Analysis
        </h3>
      </div>
      <p className="text-sm text-white/80">
        Cash flow optimization and working capital management insights
      </p>
    </div>

    {/* Metrics Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {/* Metric 1 */}
      <div>
        <div className="text-4xl font-bold text-white mb-1">
          £869K
        </div>
        <div className="text-sm text-white/80">
          Current WC
        </div>
      </div>

      {/* Metric 2 */}
      <div>
        <div className="text-4xl font-bold text-white mb-1">
          43.6
        </div>
        <div className="text-sm text-white/80">
          Days CCC
        </div>
      </div>

      {/* Metric 3 */}
      <div>
        <div className="text-4xl font-bold text-white mb-1">
          £150K
        </div>
        <div className="text-sm text-white/80">
          Optimization Potential
        </div>
      </div>

      {/* Metric 4 */}
      <div>
        <div className="text-4xl font-bold text-white mb-1">
          8.1%
        </div>
        <div className="text-sm text-white/80">
          % of Revenue
        </div>
      </div>
    </div>
  </div>
</div>
```

#### 3.3.4 Quick Actions Section

**Design:**

```jsx
<div className="space-y-4">
  {/* Section Header */}
  <div>
    <div className="flex items-center gap-2 mb-1">
      <span className="text-2xl">⚡</span>
      <h2 className="text-xl font-semibold">Quick Actions</h2>
    </div>
    <p className="text-sm text-slate-600">
      Access key business intelligence tools and reports
    </p>
  </div>

  {/* Actions Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Action Button 1 */}
    <button
      onClick={() => navigate('/app/forecasting')}
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg shadow-md",
        "bg-blue-500 text-white",
        "transition-all hover:-translate-y-1 hover:shadow-lg"
      )}
    >
      <span className="text-2xl">🔮</span>
      <span className="text-sm font-medium">Run Forecast</span>
    </button>

    {/* Action Button 2 */}
    <button
      onClick={() => navigate('/app/working-capital')}
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg shadow-md",
        "bg-pink-500 text-white",
        "transition-all hover:-translate-y-1 hover:shadow-lg"
      )}
    >
      <span className="text-2xl">💰</span>
      <span className="text-sm font-medium">Analyze Cash Flow</span>
    </button>

    {/* Action Button 3 */}
    <button
      onClick={() => navigate('/app/what-if')}
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg shadow-md",
        "bg-blue-500 text-white",
        "transition-all hover:-translate-y-1 hover:shadow-lg"
      )}
    >
      <span className="text-2xl">🔧</span>
      <span className="text-sm font-medium">What-If Analysis</span>
    </button>

    {/* Action Button 4 */}
    <button
      onClick={() => navigate('/app/reports')}
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg shadow-md",
        "bg-white border border-slate-300 text-slate-900",
        "transition-all hover:-translate-y-1 hover:shadow-lg"
      )}
    >
      <span className="text-2xl">📋</span>
      <span className="text-sm font-medium">Generate Report</span>
    </button>
  </div>
</div>
```

### 3.4 Responsive Design Strategy

#### 3.4.1 Breakpoint Strategy

**Mobile First Approach:**

```jsx
// Base styles (mobile)
className="text-3xl p-4 grid-cols-1"

// Tablet and up
className="sm:text-4xl sm:p-6 sm:grid-cols-2"

// Desktop and up
className="lg:text-5xl lg:p-8 lg:grid-cols-4"
```

**Layout Adaptations:**

| Component | Mobile (< 640px) | Tablet (640-1023px) | Desktop (≥ 1024px) |
|-----------|------------------|---------------------|-------------------|
| Sidebar | Hidden (overlay) | Hidden (overlay) | Fixed (256px) |
| Header | Mobile header | Tablet header | Desktop header |
| KPI Grid | 1 column | 2 columns | 4 columns |
| Chart Grid | 1 column | 2 columns | 3 columns |
| Working Capital | 2x2 grid | 2x2 grid | 4x1 grid |
| Quick Actions | 1 column | 2 columns | 4 columns |

#### 3.4.2 Touch Targets

**Minimum Size:** 44x44px (iOS) / 48x48px (Android)

```jsx
// Buttons
className="p-3"  // Minimum 48px touch target

// Navigation Items
className="py-3 px-4"  // Comfortable tap area

// Icon Buttons
className="p-3 w-12 h-12"  // Explicit sizing
```

#### 3.4.3 Typography Scaling

```jsx
// Hero Heading
className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl"

// Page Title
className="text-2xl sm:text-3xl"

// Section Title
className="text-xl sm:text-2xl"

// Body Text (consistent)
className="text-base"

// Small Text
className="text-sm"
```

### 3.5 Animation & Interaction Design

#### 3.5.1 Page Transitions

**Using Framer Motion (already integrated):**

```jsx
import { motion } from 'framer-motion'

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
)
```

#### 3.5.2 Component Animations

**Hover Effects:**

```jsx
// KPI Cards
className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"

// Buttons
className="transition-all hover:scale-105 hover:shadow-lg"

// Sidebar Items
className="transition-colors hover:bg-slate-700"
```

**Loading States:**

```jsx
// Skeleton Pulse
<div className="h-40 rounded-xl bg-slate-200 animate-pulse" />

// Spinner
<div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
```

**Micro-interactions:**

```jsx
// Button Click
className="active:scale-98 transition-transform"

// Notification Badge
className="animate-pulse"

// System Status
<span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
```

#### 3.5.3 Transition Durations

```css
/* Fast - Hover states */
transition-duration: 150ms;

/* Normal - Page transitions, component animations */
transition-duration: 300ms;

/* Slow - Complex animations, layout shifts */
transition-duration: 500ms;
```

**Easing Functions:**

```css
/* Default */
transition-timing-function: ease-in-out;

/* Sharp - Quick start, slow end */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Smooth - Natural feel */
transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
```

### 3.6 Accessibility Requirements

#### 3.6.1 Semantic HTML

```jsx
// ✅ Good
<header>
  <nav>
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
    </ul>
  </nav>
</header>

<main>
  <section>
    <h1>Dashboard</h1>
    <article>...</article>
  </section>
</main>

<footer>...</footer>

// ❌ Bad
<div className="header">
  <div className="nav">
    <div><a>Dashboard</a></div>
  </div>
</div>
```

#### 3.6.2 ARIA Labels

```jsx
// Icon-only buttons
<button aria-label="Close sidebar">
  <XMarkIcon className="w-5 h-5" />
</button>

// Active navigation
<NavLink aria-current={isActive ? 'page' : undefined}>
  Dashboard
</NavLink>

// Expandable sections
<button
  aria-expanded={isExpanded}
  aria-controls="nav-section-overview"
>
  Overview
</button>

// Navigation regions
<nav aria-label="Primary navigation">
  {/* Nav items */}
</nav>
```

#### 3.6.3 Keyboard Navigation

**Tab Order:**

1. Skip to main content link (hidden, visible on focus)
2. Header elements (logo, breadcrumbs, actions)
3. Sidebar navigation (if visible)
4. Main content (interactive elements)

**Keyboard Shortcuts:**

```jsx
// Already implemented in Sidebar.jsx
Ctrl/Cmd + B: Toggle sidebar

// Proposed additions
Ctrl/Cmd + K: Open command palette
Ctrl/Cmd + /: Focus search
Escape: Close modals/dropdowns
Arrow keys: Navigate within menus
```

**Focus Management:**

```jsx
// Visible focus indicators
className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"

// Focus trap in modals
import { useFocusTrap } from '@/hooks/useFocusTrap'

const Modal = ({ isOpen, onClose }) => {
  const modalRef = useFocusTrap(isOpen)

  return (
    <div ref={modalRef}>
      {/* Modal content */}
    </div>
  )
}
```

#### 3.6.4 Color Contrast

**WCAG 2.1 AA Compliance:**

| Text Size | Minimum Ratio |
|-----------|---------------|
| Normal text (< 18px) | 4.5:1 |
| Large text (≥ 18px or ≥ 14px bold) | 3:1 |
| UI components & graphics | 3:1 |

**Verified Combinations:**

```jsx
// ✅ Pass (7.5:1)
text-slate-900 on white
#0F172A on #FFFFFF

// ✅ Pass (4.5:1)
text-slate-600 on white
#475569 on #FFFFFF

// ✅ Pass (12.6:1)
text-white on bg-blue-600
#FFFFFF on #2563EB

// ❌ Fail (2.8:1) - needs adjustment
text-slate-400 on white
#94A3B8 on #FFFFFF
```

#### 3.6.5 Screen Reader Support

```jsx
// Hide decorative elements
<div aria-hidden="true">
  <DecorativeIcon />
</div>

// Announce dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Provide alternative text
<img
  src="/chart.png"
  alt="Revenue chart showing 15% increase from Q3 to Q4"
/>

// Label form inputs
<label htmlFor="email">Email Address</label>
<input id="email" type="email" />
```

---

## 4. Implementation Roadmap

### 4.1 BMAD-METHOD Integration

This implementation plan integrates seamlessly with the existing BMAD-METHOD v6a framework. All work will follow the four-phase BMAD workflow:

```
Phase 1: ANALYSIS → Phase 2: PLANNING → Phase 3: SOLUTIONING → Phase 4: IMPLEMENTATION
```

**BMAD Agent Roles for UI/UX Project:**

- **PM (`bmad pm`):** Oversee timeline, coordinate between design and development
- **Architect (`bmad architect`):** Define component architecture, design system structure
- **Scrum Master (`bmad sm`):** Create user stories from design specs, manage sprint planning
- **Developer (`bmad dev`):** Implement components, integrate with existing codebase
- **QA (`bmad qa`):** Visual regression testing, accessibility audits, user testing

### 4.2 Six-Week Implementation Plan

#### Week 1: Foundation & Setup

**BMAD Phase:** Phase 1 (Analysis) → Phase 2 (Planning)

**Epic:** EPIC-UI-001 - Design System Foundation

**User Stories:**

1. **STORY-UI-001:** Set up Tailwind config with custom design tokens
   - Define color palette (blue/purple gradients)
   - Configure typography scale
   - Set up spacing system
   - Create custom gradient utilities
   - **Estimate:** 1 day

2. **STORY-UI-002:** Create base component library structure
   - Set up component folder organization
   - Create index exports for easy imports
   - Document component API patterns
   - **Estimate:** 1 day

3. **STORY-UI-003:** Implement authentication flow infrastructure
   - Review Clerk integration
   - Set up development/production mode switching
   - Create authentication loading states
   - Test fallback mechanisms
   - **Estimate:** 2 days

4. **STORY-UI-004:** Set up routing and navigation foundation
   - Verify all routes work correctly
   - Implement route protection
   - Test redirects after sign-in/sign-out
   - **Estimate:** 1 day

**Deliverables:**

- ✅ Tailwind config with custom design system
- ✅ Component library folder structure
- ✅ Verified authentication flows
- ✅ Tested route protection

**Success Criteria:**

- All custom Tailwind classes available
- Authentication works in dev and prod modes
- All routes accessible with proper protection

---

#### Week 2: Authentication & Landing Page

**BMAD Phase:** Phase 3 (Solutioning) → Phase 4 (Implementation)

**Epic:** EPIC-UI-002 - Public Experience Redesign

**User Stories:**

1. **STORY-UI-005:** Redesign landing page hero section
   - Implement gradient background with pattern overlay
   - Create responsive hero typography
   - Add primary/secondary CTA buttons
   - Integrate Clerk SignIn modal
   - Add animations with Framer Motion
   - **Estimate:** 2 days

2. **STORY-UI-006:** Build landing page features section
   - Create feature card component
   - Implement 3-column responsive grid
   - Add hover animations
   - Populate with 6 feature cards
   - **Estimate:** 1 day

3. **STORY-UI-007:** Build trust metrics and final CTA sections
   - Create metric card component
   - Implement 4-column metric grid
   - Build final CTA section with gradient
   - Style footer
   - **Estimate:** 1 day

4. **STORY-UI-008:** Polish Clerk authentication UI
   - Customize Clerk appearance theme
   - Test sign-in flow end-to-end
   - Test sign-up flow with verification
   - Test OAuth providers (if enabled)
   - Verify mobile responsiveness
   - **Estimate:** 1 day

**Deliverables:**

- ✅ Redesigned landing page matching mockup
- ✅ Polished Clerk sign-in experience
- ✅ Mobile-responsive public pages
- ✅ Animated page transitions

**Success Criteria:**

- Landing page matches mockup design ≥90%
- Sign-in flow completes in < 3 clicks
- Page loads in < 2 seconds
- Perfect rendering on mobile/tablet/desktop

---

#### Week 3: Dashboard Layout

**BMAD Phase:** Phase 4 (Implementation)

**Epic:** EPIC-UI-003 - Dashboard Layout Redesign

**User Stories:**

1. **STORY-UI-009:** Redesign sidebar navigation
   - Update sidebar background to dark theme (#1E293B)
   - Style logo section with gradient
   - Implement collapsible navigation groups
   - Add active state styling with left border accent
   - Add badge support for "Live", "AI", "New" labels
   - Implement collapse/expand animation
   - **Estimate:** 2 days

2. **STORY-UI-010:** Redesign header bar
   - Add breadcrumb navigation component
   - Implement system status badge
   - Add current time display with auto-update
   - Style notification bell with badge
   - Integrate Clerk UserButton
   - Make responsive (mobile hamburger menu)
   - **Estimate:** 2 days

3. **STORY-UI-011:** Implement main content area layout
   - Set up proper spacing and padding
   - Ensure sidebar + content layout works
   - Test scrolling behavior
   - Verify responsive breakpoints
   - **Estimate:** 1 day

**Deliverables:**

- ✅ Dark-themed sidebar with role-based navigation
- ✅ Feature-rich header with breadcrumbs and status
- ✅ Responsive layout (mobile → desktop)
- ✅ Smooth sidebar collapse/expand

**Success Criteria:**

- Sidebar matches mockup design ≥95%
- Header shows all required elements
- Layout works perfectly on all screen sizes
- Navigation is fully keyboard accessible

---

#### Week 4-5: Dashboard Components

**BMAD Phase:** Phase 4 (Implementation)

**Epic:** EPIC-UI-004 - Dashboard Component Redesign

**User Stories:**

1. **STORY-UI-012:** Redesign KPI card grid
   - Update KPIGrid component with gradient backgrounds
   - Add hover lift animation
   - Implement trend indicators (arrows + percentages)
   - Make cards fully responsive (1/2/4 column grid)
   - Add loading skeleton states
   - **Estimate:** 2 days

2. **STORY-UI-013:** Redesign chart cards
   - Create consistent Card wrapper for all charts
   - Style chart titles with emoji icons
   - Configure Recharts colors to match design system
   - Add rounded corners to bars
   - Implement loading states
   - Add error states with retry
   - **Estimate:** 3 days

3. **STORY-UI-014:** Implement working capital card
   - Create gradient background card
   - Add background pattern overlay
   - Implement 4-metric grid (responsive 2x2 → 4x1)
   - Style typography for large values
   - **Estimate:** 1 day

4. **STORY-UI-015:** Build quick actions section
   - Create action button component
   - Implement 4-button responsive grid
   - Add hover animations (lift + shadow)
   - Wire up navigation onClick handlers
   - **Estimate:** 1 day

5. **STORY-UI-016:** Implement financial analysis section
   - Arrange 4 charts in 3-column grid (responsive)
   - Ensure consistent card styling
   - Verify all charts render correctly
   - Test with real data from APIs
   - **Estimate:** 2 days

6. **STORY-UI-017:** Add page-level animations
   - Implement page enter/exit transitions
   - Add staggered animations for card grids
   - Optimize animation performance
   - **Estimate:** 1 day

**Deliverables:**

- ✅ Redesigned KPI cards with gradients and trends
- ✅ Styled chart cards with consistent theming
- ✅ Working capital card with 4-metric layout
- ✅ Quick actions section with 4 buttons
- ✅ Complete financial analysis grid
- ✅ Smooth page and component animations

**Success Criteria:**

- All dashboard components match mockup ≥90%
- Charts display real data correctly
- Animations perform smoothly (60fps)
- Loading and error states work correctly
- Fully responsive on all devices

---

#### Week 6: Polish & Testing

**BMAD Phase:** Phase 4 (Implementation) + QA

**Epic:** EPIC-UI-005 - Polish, Testing & Accessibility

**User Stories:**

1. **STORY-UI-018:** Accessibility audit and fixes
   - Run automated accessibility checks (axe DevTools)
   - Verify WCAG 2.1 AA color contrast
   - Test keyboard navigation on all pages
   - Add missing ARIA labels
   - Test with screen reader (NVDA/JAWS/VoiceOver)
   - **Estimate:** 2 days

2. **STORY-UI-019:** Responsive design testing
   - Test on real devices (iPhone, iPad, Android)
   - Test all breakpoints in browser DevTools
   - Fix any layout issues
   - Verify touch targets (≥44x44px)
   - **Estimate:** 1 day

3. **STORY-UI-020:** Performance optimization
   - Run Lighthouse audit
   - Optimize images (WebP format, lazy loading)
   - Reduce bundle size (code splitting)
   - Optimize animations (GPU acceleration)
   - Measure and improve LCP, FID, CLS
   - **Estimate:** 1 day

4. **STORY-UI-021:** Cross-browser testing
   - Test on Chrome, Firefox, Safari, Edge
   - Fix any browser-specific issues
   - Verify Clerk works on all browsers
   - **Estimate:** 1 day

**Deliverables:**

- ✅ WCAG 2.1 AA compliant UI
- ✅ Perfect responsive design on all devices
- ✅ Lighthouse score ≥90 across all metrics
- ✅ Cross-browser compatibility verified

**Success Criteria:**

- Accessibility score ≥95/100 (axe DevTools)
- All pages keyboard navigable
- Lighthouse Performance ≥90
- Works flawlessly on Chrome, Firefox, Safari, Edge
- No visual bugs on mobile/tablet/desktop

---

### 4.3 BMAD Workflow Integration

**Week-by-Week BMAD Phase Mapping:**

| Week | BMAD Phase | Focus |
|------|------------|-------|
| Week 1 | Phase 1 → Phase 2 | Analysis & Planning |
| Week 2 | Phase 3 → Phase 4 | Solution Design & Implementation (Public) |
| Week 3 | Phase 4 | Implementation (Layout) |
| Week 4-5 | Phase 4 | Implementation (Components) |
| Week 6 | Phase 4 + QA | Polish, Testing, Deployment |

**BMAD Commands to Use:**

```bash
# Week 1
bmad pm workflow-status          # Check project status
bmad architect design-review     # Review design system architecture
bmad sm create-epic "EPIC-UI-001"  # Create foundation epic

# Week 2-5
bmad dev start-story "STORY-UI-005"  # Start each user story
bmad dev complete-story "STORY-UI-005"  # Mark completed

# Week 6
bmad qa test-epic "EPIC-UI-005"  # Run comprehensive tests
bmad sm retrospective            # Review what went well/poorly
```

### 4.4 Risk Management

**Identified Risks:**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Clerk API rate limiting | Low | Medium | Implement proper error handling, use development mode fallback |
| Design complexity delays | Medium | High | Break work into smaller stories, prioritize core features |
| Cross-browser compatibility issues | Medium | Medium | Test early and often, use PostCSS autoprefixer |
| Accessibility issues discovered late | Low | High | Integrate axe DevTools in dev workflow from Week 1 |
| Performance degradation | Low | Medium | Monitor bundle size, use React DevTools Profiler |
| Mobile layout bugs | Medium | High | Test on real devices throughout development |

**Mitigation Strategies:**

1. **Daily Progress Tracking:** Update TodoWrite with completed tasks daily
2. **Early Testing:** Test authentication and layout in Week 1, not Week 6
3. **Incremental Deployment:** Deploy to development branch continuously
4. **Stakeholder Reviews:** Show progress to stakeholders at end of each week
5. **Automated Testing:** Set up visual regression tests for critical pages
6. **Buffer Time:** Each 2-week sprint has 1 day buffer for unexpected issues

---

## 5. Technical Specifications

### 5.1 Component API Documentation

#### 5.1.1 KPIGrid Component

**File:** `src/components/dashboard/KPIGrid.jsx`

**Props:**

```typescript
interface KPIGridProps {
  kpis: Array<{
    icon: string;              // Emoji icon (e.g., "💰")
    value: string | number;    // Display value (e.g., "£10.76M")
    label: string;             // Metric label (e.g., "Annual Revenue")
    gradient: string;          // Tailwind gradient class (e.g., "bg-gradient-revenue")
    trend?: {
      value: number;           // Percentage change (e.g., 15.2)
      direction: 'up' | 'down' | 'neutral';
    };
    valueFormat?: 'raw' | 'currency' | 'percentage' | 'number';
  }>;
  loading?: boolean;
  error?: string;
}
```

**Usage:**

```jsx
import KPIGrid from '@/components/dashboard/KPIGrid'

<KPIGrid
  kpis={[
    {
      icon: '💰',
      value: '£10.76M',
      label: 'Annual Revenue',
      gradient: 'bg-gradient-revenue',
      trend: { value: 15.2, direction: 'up' }
    },
    // ... more KPIs
  ]}
  loading={false}
  error={null}
/>
```

#### 5.1.2 WorkingCapitalCard Component

**File:** `src/components/dashboard/WorkingCapitalCard.jsx`

**Props:**

```typescript
interface WorkingCapitalCardProps {
  data: {
    currentWC: number;              // Current working capital (e.g., 869000)
    daysCCC: number;                // Cash conversion cycle in days (e.g., 43.6)
    optimizationPotential: number;  // Optimization potential (e.g., 150000)
    percentOfRevenue: number;       // Percentage of revenue (e.g., 8.1)
  };
  loading?: boolean;
  error?: string;
}
```

**Usage:**

```jsx
import WorkingCapitalCard from '@/components/dashboard/WorkingCapitalCard'

<WorkingCapitalCard
  data={{
    currentWC: 869000,
    daysCCC: 43.6,
    optimizationPotential: 150000,
    percentOfRevenue: 8.1
  }}
/>
```

#### 5.1.3 QuickActions Component

**File:** `src/components/dashboard/QuickActions.jsx`

**Props:**

```typescript
interface QuickActionsProps {
  actions?: Array<{
    id: string;
    icon: string;           // Emoji or icon component
    label: string;          // Action label
    onClick: () => void;    // Click handler
    color: string;          // Background color class
    disabled?: boolean;
  }>;
}
```

**Usage:**

```jsx
import QuickActions from '@/components/dashboard/QuickActions'

<QuickActions
  actions={[
    {
      id: 'forecast',
      icon: '🔮',
      label: 'Run Forecast',
      onClick: () => navigate('/app/forecasting'),
      color: 'bg-blue-500'
    },
    // ... more actions
  ]}
/>
```

### 5.2 State Management Approach

**Current State Management:**

- **Authentication:** Clerk + BulletproofAuthProvider
- **Server State:** TanStack Query (React Query)
- **Client State:** Zustand stores
- **Form State:** React Hook Form (where needed)

**No Changes Needed** - existing state management is robust and appropriate.

**State Flow Example:**

```jsx
// Authentication State (Clerk + Context)
const { isSignedIn, user } = useAuth()  // Clerk hook
const { role } = useAuthRole()          // Custom hook

// Server State (React Query)
const { data: kpiData, isLoading, error } = useQuery({
  queryKey: ['kpi-summary'],
  queryFn: () => plAnalysisApi.getKPISummary(),
  staleTime: 5 * 60 * 1000,  // 5 minutes
})

// Client State (Zustand)
const { sidebarCollapsed, toggleSidebar } = useSidebarStore()
```

### 5.3 API Integration Points

**Existing API Services (No Changes Needed):**

```javascript
// Financial APIs
import plAnalysisApi from '@/services/api/plAnalysisApi'
import workingCapitalApi from '@/services/api/workingCapitalApi'
import productSalesApi from '@/services/api/productSalesApi'
import regionalPerformanceApi from '@/services/api/regionalPerformanceApi'

// Integration Services
import { xeroService } from '@/services/xeroService'
import { shopifyService } from '@/services/shopify-multistore'
```

**API Usage in Dashboard:**

```jsx
// Already implemented in DashboardEnterprise.jsx
useEffect(() => {
  const fetchKPIData = async () => {
    try {
      setKpiLoading(true)
      const response = await plAnalysisApi.getKPISummary()
      if (response?.success && response?.data) {
        setPerformanceKpis(transformKPIData(response.data))
      }
    } catch (error) {
      setKpiError(error.message)
    } finally {
      setKpiLoading(false)
    }
  }

  fetchKPIData()
}, [xeroConnected])
```

### 5.4 Environment Variables

**Required Environment Variables (Already Configured):**

```bash
# Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=[server-side secret]

# Development Mode
VITE_DEVELOPMENT_MODE=true  # For development branch
VITE_DEVELOPMENT_MODE=false # For test/production branches

# API Endpoints
VITE_API_BASE_URL=https://capliquify-frontend-prod.onrender.com/api  # Dev
VITE_API_BASE_URL=https://sentia-manufacturing-dashboard-test.onrender.com/api  # Test
VITE_API_BASE_URL=https://sentia-manufacturing-dashboard-production.onrender.com/api  # Prod

# Application Info
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_APP_VERSION=2.0.0
```

**No New Environment Variables Required** for UI/UX redesign.

### 5.5 Build Configuration

**Vite Config (vite.config.js):**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Code splitting for better performance
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'clerk-vendor': ['@clerk/clerk-react'],
          'chart-vendor': ['recharts'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 1MB
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

**Tailwind Config (tailwind.config.js):**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom gradients will be defined here
        'gradient-revenue': 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)',
        'gradient-units': 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
        'gradient-margin': 'linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%)',
        'gradient-wc': 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'custom-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'custom-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
```

---

## 6. Testing Strategy

### 6.1 Unit Testing

**Testing Framework:** Vitest + React Testing Library

**Components to Unit Test:**

```jsx
// KPIGrid.test.jsx
describe('KPIGrid', () => {
  it('renders KPI cards correctly', () => {
    const kpis = [
      { icon: '💰', value: '£10M', label: 'Revenue', gradient: 'bg-gradient-revenue' }
    ]
    render(<KPIGrid kpis={kpis} />)
    expect(screen.getByText('£10M')).toBeInTheDocument()
    expect(screen.getByText('Revenue')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<KPIGrid kpis={[]} loading={true} />)
    expect(screen.getAllByRole('status')).toHaveLength(4) // 4 skeleton cards
  })

  it('shows error state', () => {
    render(<KPIGrid kpis={[]} error="Failed to load" />)
    expect(screen.getByText(/Failed to load/i)).toBeInTheDocument()
  })

  it('displays trend indicators correctly', () => {
    const kpis = [
      {
        icon: '💰',
        value: '£10M',
        label: 'Revenue',
        gradient: 'bg-gradient-revenue',
        trend: { value: 15.2, direction: 'up' }
      }
    ]
    render(<KPIGrid kpis={kpis} />)
    expect(screen.getByText('15.2%')).toBeInTheDocument()
    expect(screen.getByTestId('arrow-up-icon')).toBeInTheDocument()
  })
})
```

**Coverage Target:** ≥80% for all new components

### 6.2 Integration Testing

**Scenarios to Test:**

```jsx
// Authentication Flow Integration Test
describe('Authentication Flow', () => {
  it('redirects unauthenticated user to sign-in', async () => {
    render(<App />, { wrapper: BrowserRouter })

    // Navigate to protected route
    fireEvent.click(screen.getByText(/dashboard/i))

    // Should redirect to sign-in
    await waitFor(() => {
      expect(window.location.pathname).toBe('/app/sign-in')
    })
  })

  it('shows dashboard after successful sign-in', async () => {
    // Mock Clerk auth
    vi.mock('@clerk/clerk-react', () => ({
      useAuth: () => ({ isSignedIn: true, user: mockUser }),
    }))

    render(<App />, { wrapper: BrowserRouter })

    await waitFor(() => {
      expect(screen.getByText(/Enterprise dashboard/i)).toBeInTheDocument()
    })
  })
})

// Dashboard Data Flow Integration Test
describe('Dashboard Data Loading', () => {
  it('loads and displays KPI data', async () => {
    // Mock API response
    server.use(
      rest.get('/api/financial/kpi-summary', (req, res, ctx) => {
        return res(ctx.json({
          success: true,
          data: {
            annualRevenue: { value: '£10.76M', helper: '+15.2%' },
            unitsSold: { value: '350,314', helper: '+8.3%' },
            grossMargin: { value: '67.6%', helper: '+2.1%' },
          }
        }))
      })
    )

    render(<DashboardEnterprise />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('£10.76M')).toBeInTheDocument()
      expect(screen.getByText('350,314')).toBeInTheDocument()
      expect(screen.getByText('67.6%')).toBeInTheDocument()
    })
  })
})
```

### 6.3 End-to-End Testing

**Testing Framework:** Playwright

**Critical User Journeys:**

```javascript
// e2e/authentication.spec.js
test('complete sign-in flow', async ({ page }) => {
  // Visit landing page
  await page.goto('/')

  // Click sign in button
  await page.click('text=Sign In')

  // Wait for Clerk modal
  await page.waitForSelector('[data-clerk-modal]')

  // Enter credentials
  await page.fill('input[name="identifier"]', 'test@example.com')
  await page.fill('input[name="password"]', 'TestPassword123!')
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await page.waitForURL('/app/dashboard')

  // Verify dashboard loaded
  await expect(page.locator('text=Enterprise dashboard')).toBeVisible()
})

// e2e/navigation.spec.js
test('navigate through dashboard sections', async ({ page }) => {
  await page.goto('/app/dashboard')

  // Click forecasting in sidebar
  await page.click('text=Demand Forecasting')
  await page.waitForURL('/app/forecasting')
  await expect(page.locator('h1')).toContainText('Forecasting')

  // Click working capital
  await page.click('text=Working Capital')
  await page.waitForURL('/app/working-capital')
  await expect(page.locator('h1')).toContainText('Working Capital')

  // Verify breadcrumbs update
  await expect(page.locator('[aria-label="Breadcrumb"]')).toContainText('Working Capital')
})

// e2e/responsive.spec.js
test('mobile menu works correctly', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/app/dashboard')

  // Sidebar should be hidden
  await expect(page.locator('aside')).toHaveCSS('transform', 'translateX(-100%)')

  // Click hamburger menu
  await page.click('[aria-label="Open menu"]')

  // Sidebar should slide in
  await expect(page.locator('aside')).toHaveCSS('transform', 'translateX(0)')

  // Click navigation item
  await page.click('text=Forecasting')

  // Sidebar should close
  await expect(page.locator('aside')).toHaveCSS('transform', 'translateX(-100%)')
})
```

### 6.4 Accessibility Testing

**Automated Testing:**

```bash
# Install axe-core
npm install --save-dev @axe-core/playwright

# Run accessibility tests
npx playwright test --project=accessibility
```

```javascript
// e2e/accessibility.spec.js
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('dashboard has no accessibility violations', async ({ page }) => {
  await page.goto('/app/dashboard')

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})

test('landing page has no accessibility violations', async ({ page }) => {
  await page.goto('/')

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})
```

**Manual Testing Checklist:**

- [ ] All interactive elements reachable via Tab key
- [ ] Focus indicators visible on all focusable elements
- [ ] Escape key closes modals and dropdowns
- [ ] Screen reader announces page changes
- [ ] Form inputs have associated labels
- [ ] Images have alt text
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] No information conveyed by color alone
- [ ] Headings follow proper hierarchy (h1 → h2 → h3)

### 6.5 Visual Regression Testing

**Tool:** Percy or Chromatic

```javascript
// Install Percy
npm install --save-dev @percy/playwright

// percy.spec.js
import { test } from '@playwright/test'
import percySnapshot from '@percy/playwright'

test('dashboard visual regression', async ({ page }) => {
  await page.goto('/app/dashboard')
  await page.waitForLoadState('networkidle')
  await percySnapshot(page, 'Dashboard - Desktop')
})

test('dashboard mobile visual regression', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/app/dashboard')
  await page.waitForLoadState('networkidle')
  await percySnapshot(page, 'Dashboard - Mobile')
})

test('landing page visual regression', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await percySnapshot(page, 'Landing Page')
})
```

### 6.6 Performance Testing

**Lighthouse CI Configuration:**

```yaml
# lighthouserc.json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/app/dashboard"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**Performance Benchmarks:**

| Metric | Target | Method |
|--------|--------|--------|
| First Contentful Paint (FCP) | < 1.8s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Time to Interactive (TTI) | < 3.8s | Lighthouse |
| Total Blocking Time (TBT) | < 200ms | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| Bundle Size (gzipped) | < 300KB | Bundler |

---

## 7. Technical Appendix

### 7.1 Code Examples

#### 7.1.1 Complete KPIGrid Component

```jsx
// src/components/dashboard/KPIGrid.jsx
import { cn } from '@/utils/cn'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

const KPIGrid = ({ kpis, loading, error }) => {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-40 rounded-xl bg-slate-200 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 rounded-xl border border-red-200 bg-red-50">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">Failed to load metrics</p>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!kpis || kpis.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 rounded-xl border border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-600">No metrics available</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <KPICard key={kpi.label || index} {...kpi} />
      ))}
    </div>
  )
}

const KPICard = ({ icon, value, label, gradient, trend }) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-6 shadow-lg",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl",
        gradient
      )}
    >
      {/* Icon */}
      <div className="text-4xl mb-2 text-white/80" aria-hidden="true">
        {icon}
      </div>

      {/* Value */}
      <div className="text-4xl font-bold text-white mb-1">
        {value}
      </div>

      {/* Label */}
      <div className="text-sm text-white/80 mb-3">
        {label}
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trend.direction === 'up' && "text-green-300",
            trend.direction === 'down' && "text-red-300",
            trend.direction === 'neutral' && "text-white/60"
          )}
        >
          {trend.direction === 'up' && (
            <ArrowUpIcon className="w-3 h-3" data-testid="arrow-up-icon" />
          )}
          {trend.direction === 'down' && (
            <ArrowDownIcon className="w-3 h-3" data-testid="arrow-down-icon" />
          )}
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
    </div>
  )
}

export default KPIGrid
```

#### 7.1.2 Breadcrumb Component

```jsx
// src/components/layout/Breadcrumb.jsx
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { useLocation, Link } from 'react-router-dom'

const Breadcrumb = () => {
  const location = useLocation()

  // Parse pathname into breadcrumb segments
  const pathSegments = location.pathname
    .split('/')
    .filter(segment => segment !== '')

  // Map segments to readable labels
  const segmentLabels = {
    'app': 'Dashboard',
    'dashboard': 'OVERVIEW',
    'forecasting': 'Demand Forecasting',
    'inventory': 'Inventory Management',
    'working-capital': 'Working Capital',
    'what-if': 'What-If Analysis',
    'reports': 'Financial Reports',
    'admin': 'Admin Panel',
  }

  // Build breadcrumb items
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/')
    const label = segmentLabels[segment] || segment
    const isLast = index === pathSegments.length - 1

    return { path, label, isLast }
  })

  if (breadcrumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-2 text-sm">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.path} className="flex items-center space-x-2">
          {index > 0 && (
            <ChevronRightIcon className="w-4 h-4 text-slate-400" aria-hidden="true" />
          )}

          {breadcrumb.isLast ? (
            <span className="text-slate-900 font-medium">
              {breadcrumb.label}
            </span>
          ) : (
            <Link
              to={breadcrumb.path}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

export default Breadcrumb
```

#### 7.1.3 System Status Badge

```jsx
// src/components/layout/SystemStatusBadge.jsx
import { useState, useEffect } from 'react'

const SystemStatusBadge = () => {
  const [status, setStatus] = useState('operational')
  const [latency, setLatency] = useState(null)

  // Check system health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const start = Date.now()
        const response = await fetch('/api/health')
        const end = Date.now()

        if (response.ok) {
          setStatus('operational')
          setLatency(end - start)
        } else {
          setStatus('degraded')
        }
      } catch (error) {
        setStatus('down')
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const statusConfig = {
    operational: {
      color: 'green',
      label: 'All Systems Operational',
      dotClass: 'bg-green-500',
      bgClass: 'bg-green-50',
      textClass: 'text-green-700',
    },
    degraded: {
      color: 'yellow',
      label: 'Degraded Performance',
      dotClass: 'bg-yellow-500',
      bgClass: 'bg-yellow-50',
      textClass: 'text-yellow-700',
    },
    down: {
      color: 'red',
      label: 'Service Unavailable',
      dotClass: 'bg-red-500',
      bgClass: 'bg-red-50',
      textClass: 'text-red-700',
    },
  }

  const config = statusConfig[status]

  return (
    <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 ${config.bgClass} ${config.textClass} rounded-full text-xs font-medium`}>
      <span className={`w-2 h-2 ${config.dotClass} rounded-full animate-pulse`} />
      <span>{config.label}</span>
      {latency && status === 'operational' && (
        <span className="text-xs opacity-70">({latency}ms)</span>
      )}
    </div>
  )
}

export default SystemStatusBadge
```

### 7.2 Configuration Files

#### 7.2.1 ESLint Configuration

```javascript
// .eslintrc.cjs
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', 'react-hooks', 'jsx-a11y'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'warn',
    'jsx-a11y/anchor-is-valid': 'warn',
    'no-unused-vars': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
```

#### 7.2.2 Prettier Configuration

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 7.3 Deployment Checklist

**Pre-Deployment (Development Branch):**

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Lighthouse score ≥90 on all metrics
- [ ] Accessibility audit passed (axe DevTools)
- [ ] Visual regression tests approved (Percy/Chromatic)
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified
- [ ] Code review completed
- [ ] Git commit with clear message
- [ ] Push to `development` branch

**Deployment to Test Environment:**

- [ ] Merge `development` → `test` branch
- [ ] Render auto-deploys to test URL
- [ ] Verify test environment loads correctly
- [ ] Run smoke tests on test environment
- [ ] UAT (User Acceptance Testing) with stakeholders
- [ ] Collect feedback and create bug tickets if needed

**Deployment to Production:**

- [ ] All UAT issues resolved
- [ ] Final QA sign-off
- [ ] Merge `test` → `production` branch
- [ ] Render auto-deploys to production URL
- [ ] Monitor production deployment logs
- [ ] Verify production environment loads correctly
- [ ] Run post-deployment smoke tests
- [ ] Monitor error tracking (Sentry/LogRocket if configured)
- [ ] Announce deployment to team

### 7.4 Rollback Plan

**If Critical Issues Discovered:**

1. **Immediate Rollback:**
   ```bash
   # Revert to last known good commit
   git revert <bad-commit-hash>
   git push origin production
   ```

2. **Render Auto-Redeploys:**
   - Render automatically redeploys on push
   - Previous version restored in ~2 minutes

3. **Communication:**
   - Notify team of rollback
   - Create incident report
   - Document root cause
   - Plan fix for next deployment

**Quality Gates (Prevent Bad Deployments):**

- Automated tests must pass before merge
- Lighthouse score must be ≥90
- No accessibility violations
- Code review approval required
- Staging environment testing completed

---

## Conclusion

This comprehensive UI/UX and authentication plan provides a detailed roadmap for transforming the Sentia Manufacturing Dashboard into a production-ready enterprise platform. The plan:

- ✅ Integrates seamlessly with existing BMAD-METHOD v6a workflow
- ✅ Preserves all functional components (authentication, APIs, data integrations)
- ✅ Enhances visual design to match professional mockup
- ✅ Maintains accessibility and performance standards
- ✅ Provides clear implementation tasks with time estimates
- ✅ Includes comprehensive testing strategy
- ✅ Follows best practices for modern web applications

**Next Steps:**

1. Review and approve this plan with stakeholders
2. Run `bmad pm workflow-status` to verify project readiness
3. Create EPIC-UI-001 in BMAD system
4. Begin Week 1 implementation (Foundation & Setup)
5. Deploy continuously to development branch
6. Review progress weekly with team

**Estimated Completion:** 6 weeks (30 business days) from start date

**Success Metrics:**

- 95%+ visual match to mockup design
- 100% accessibility compliance (WCAG 2.1 AA)
- Lighthouse score ≥90 across all metrics
- < 3 clicks from landing page to dashboard
- < 2 second page load times
- Perfect rendering on mobile, tablet, desktop

---

**Document Prepared By:** Claude (BMAD Developer Agent)
**Review Required By:** Project Manager, Lead Architect, UX Designer
**Approval Status:** Pending Review
