# UI/UX Architecture Diagrams
## CapLiquify Manufacturing Platform

**Companion Document to:** COMPREHENSIVE_UI_UX_AUTHENTICATION_PLAN.md
**Created:** October 19, 2025

---

## 1. Component Hierarchy Diagram

```
App-simple-environment.jsx (Root)
├── ErrorBoundary
├── AuthProvider (Clerk or Development)
│   ├── BulletproofAuthProvider
│   └── ClerkProvider (Production)
├── QueryClientProvider (TanStack Query)
└── BrowserRouter
    ├── PUBLIC ROUTES
    │   ├── / (Landing Page)
    │   │   ├── Hero Section
    │   │   │   ├── Gradient Background
    │   │   │   ├── Hero Title + Subtitle
    │   │   │   ├── Primary CTA (SignIn Button)
    │   │   │   └── Secondary CTA (Learn More)
    │   │   ├── Features Section
    │   │   │   └── FeatureCard × 6
    │   │   │       ├── Icon
    │   │   │       ├── Title
    │   │   │       └── Description
    │   │   ├── Trust Metrics Section
    │   │   │   └── MetricCard × 4
    │   │   │       ├── Icon (CheckCircle)
    │   │   │       ├── Value
    │   │   │       └── Label
    │   │   ├── Final CTA Section
    │   │   └── Footer
    │   │       ├── Company Info
    │   │       └── Links (Privacy, Terms, Contact)
    │   │
    │   ├── /app/sign-in (Clerk Sign In)
    │   └── /app/sign-up (Clerk Sign Up)
    │
    └── PROTECTED ROUTES (Wrapped in ProtectedRoute)
        ├── DashboardLayout (Container)
        │   ├── XeroProvider
        │   ├── ProgressiveDashboardLoader
        │   └── Layout Structure
        │       ├── Sidebar (Fixed Left)
        │       │   ├── Logo Section
        │       │   │   ├── Sentia Logo (Gradient)
        │       │   │   └── Collapse Button
        │       │   ├── Navigation Groups
        │       │   │   ├── OVERVIEW
        │       │   │   │   └── Dashboard
        │       │   │   ├── PLANNING & ANALYTICS
        │       │   │   │   ├── Demand Forecasting
        │       │   │   │   ├── Inventory Management
        │       │   │   │   └── AI Analytics
        │       │   │   ├── FINANCIAL MANAGEMENT
        │       │   │   │   ├── Working Capital
        │       │   │   │   ├── What-If Analysis
        │       │   │   │   └── Financial Reports
        │       │   │   ├── DATA MANAGEMENT
        │       │   │   │   ├── Import Wizard
        │       │   │   │   ├── Export Builder
        │       │   │   │   └── Data Import
        │       │   │   └── ADMINISTRATION
        │       │   │       ├── Admin Panel
        │       │   │       ├── User Management
        │       │   │       ├── System Configuration
        │       │   │       └── Monitoring
        │       │   └── User Section
        │       │       ├── User Avatar
        │       │       ├── User Name
        │       │       └── User Role
        │       │
        │       ├── Header (Sticky Top)
        │       │   ├── Mobile Menu Button (< 1024px)
        │       │   ├── Breadcrumb Navigation
        │       │   ├── System Status Badge
        │       │   ├── Current Time Display
        │       │   ├── Notification Bell
        │       │   └── Clerk UserButton
        │       │
        │       └── Main Content Area (Scrollable)
        │           ├── /app/dashboard (DashboardEnterprise)
        │           │   ├── Page Header
        │           │   │   ├── Title + Subtitle
        │           │   │   └── SSE Status Indicator
        │           │   ├── Capital Position Section
        │           │   │   ├── Section Header
        │           │   │   └── KPIGrid (4 cards)
        │           │   │       ├── Global Working Capital
        │           │   │       ├── Cash Coverage
        │           │   │       ├── Current Ratio
        │           │   │       └── Quick Ratio
        │           │   ├── Performance Metrics Section
        │           │   │   ├── Section Header
        │           │   │   └── KPIGrid (3 cards)
        │           │   │       ├── Annual Revenue
        │           │   │       ├── Units Sold
        │           │   │       └── Gross Margin
        │           │   ├── Financial Analysis Section
        │           │   │   └── Chart Grid (3 columns)
        │           │   │       ├── Product Sales Chart
        │           │   │       ├── P&L Analysis Chart
        │           │   │       └── Regional Contribution Chart
        │           │   ├── Stock Levels Widget
        │           │   ├── Working Capital Card
        │           │   │   ├── Header
        │           │   │   └── Metrics Grid (4 metrics)
        │           │   └── Quick Actions Section
        │           │       └── Action Buttons Grid (4 buttons)
        │           │           ├── Run Forecast
        │           │           ├── Analyze Cash Flow
        │           │           ├── What-If Analysis
        │           │           └── Generate Report
        │           │
        │           ├── /app/forecasting (Forecasting)
        │           ├── /app/inventory (InventoryDashboard)
        │           ├── /app/working-capital (RealWorkingCapital)
        │           ├── /app/what-if (WhatIfAnalysis)
        │           ├── /app/reports (FinancialReports)
        │           ├── /app/admin (AdminPanelEnhanced)
        │           ├── /app/admin/import (ImportWizard)
        │           └── /app/admin/export (ExportBuilder)
        │
        └── DebugPanel (Development Only)
```

---

## 2. Authentication State Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    APPLICATION INITIALIZATION                   │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Check         │
         │ VITE_         │
         │ DEVELOPMENT_  │
         │ MODE          │
         └───────┬───────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌───────────────┐   ┌───────────────┐
│ Development   │   │ Production    │
│ Mode          │   │ Mode          │
│ (true)        │   │ (false)       │
└───────┬───────┘   └───────┬───────┘
        │                   │
        │                   ▼
        │           ┌───────────────┐
        │           │ Load Clerk    │
        │           │ Provider      │
        │           └───────┬───────┘
        │                   │
        │            ┌──────┴──────┐
        │            │             │
        │            ▼             ▼
        │    ┌───────────────┐ ┌───────────────┐
        │    │ Clerk Loaded  │ │ Clerk Failed  │
        │    │ Successfully  │ │ (Timeout 3s)  │
        │    └───────┬───────┘ └───────┬───────┘
        │            │                 │
        ├────────────┤                 │
        │            │                 │
        ▼            ▼                 ▼
┌────────────────────────────────────────────────────────────────┐
│              FALLBACK AUTH STATE (Development Mode)             │
│  • isSignedIn: true                                             │
│  • user: { id: 'dev', fullName: 'Dev User' }                   │
│  • mode: 'fallback'                                             │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION CONTEXT                       │
│  Available globally via useAuth() hook                          │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ User navigates │
        │ to route       │
        └────────┬───────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌───────────────┐   ┌───────────────┐
│ Public Route  │   │ Protected     │
│ (/, /sign-in) │   │ Route         │
└───────────────┘   └───────┬───────┘
                            │
                    ┌───────┴───────┐
                    │ Check auth    │
                    │ status        │
                    └───────┬───────┘
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
           ┌───────────────┐ ┌───────────────┐
           │ SignedIn      │ │ SignedOut     │
           └───────┬───────┘ └───────┬───────┘
                   │                 │
                   ▼                 ▼
           ┌───────────────┐ ┌───────────────┐
           │ Render        │ │ Redirect to   │
           │ Dashboard     │ │ /app/sign-in  │
           └───────────────┘ └───────────────┘
```

---

## 3. Route Protection Flow

```
User Navigates to URL
        │
        ▼
┌────────────────┐
│ React Router   │
│ Matches Route  │
└────────┬───────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
PUBLIC     PROTECTED
ROUTE      ROUTE
    │         │
    │         ▼
    │    ┌────────────────┐
    │    │ ProtectedRoute │
    │    │ Wrapper        │
    │    └────────┬───────┘
    │             │
    │     ┌───────┴────────────┐
    │     │                    │
    │     ▼                    ▼
    │ DEVELOPMENT         PRODUCTION
    │ MODE                MODE
    │     │                    │
    │     │                    ▼
    │     │            ┌────────────────┐
    │     │            │ useAuth()      │
    │     │            │ (Clerk)        │
    │     │            └────────┬───────┘
    │     │                     │
    │     │            ┌────────┴────────┐
    │     │            │                 │
    │     │            ▼                 ▼
    │     │    ┌────────────────┐ ┌────────────────┐
    │     │    │ isSignedIn     │ │ !isSignedIn    │
    │     │    │ = true         │ │ = false        │
    │     │    └────────┬───────┘ └────────┬───────┘
    │     │             │                  │
    ├─────┼─────────────┤                  │
    │     │             │                  │
    ▼     ▼             ▼                  ▼
┌──────────────────────────────┐  ┌────────────────┐
│ RENDER COMPONENT             │  │ REDIRECT TO    │
│                              │  │ /app/sign-in   │
│ Wrapped in:                  │  │                │
│ • XeroProvider               │  │ Store original │
│ • ProgressiveDashboardLoader │  │ URL in         │
│ • DashboardLayout            │  │ sessionStorage │
│   • Sidebar                  │  └────────────────┘
│   • Header                   │
│   • Main Content             │
└──────────────────────────────┘
```

---

## 4. Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│  (React Components)                                             │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT LAYER                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ React Query  │  │ Zustand      │  │ React State  │         │
│  │ (Server)     │  │ (Client)     │  │ (Component)  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                   │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│ API Services     │ │ Local Storage│ │ Component    │
│ (Fetch/Axios)    │ │ (Persist)    │ │ State        │
└──────┬───────────┘ └──────────────┘ └──────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────┐
│                      BACKEND API LAYER                          │
│                                                                  │
│  GET /api/financial/kpi-summary                                 │
│  GET /api/financial/pl-analysis                                 │
│  GET /api/sales/product-sales                                   │
│  GET /api/regional/performance                                  │
│  GET /api/working-capital/summary                               │
│  GET /api/inventory/stock-levels                                │
│                                                                  │
└────────────────┬───────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌───────────────┐  ┌───────────────┐
│ Database      │  │ External APIs │
│ (PostgreSQL)  │  │ (Xero, Shopify)│
└───────────────┘  └───────────────┘

DATA FLOW EXAMPLE (KPI Summary):

1. User loads dashboard
2. DashboardEnterprise.jsx mounts
3. useEffect triggers API call
4. plAnalysisApi.getKPISummary() called
5. HTTP GET request to /api/financial/kpi-summary
6. Backend queries PostgreSQL + Xero API
7. Backend returns JSON response
8. React Query caches response (5 min staleTime)
9. State updated with setPerformanceKpis()
10. KPIGrid component re-renders with data
```

---

## 5. Responsive Layout Breakpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                       MOBILE (< 640px)                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      HEADER                               │  │
│  │  [☰] Breadcrumb (hidden)          [Bell] [User]         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │                  MAIN CONTENT                             │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │ KPI Card 1 (Full Width)                        │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │ KPI Card 2 (Full Width)                        │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │ Chart 1 (Full Width)                           │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  │                                                           │  │
│  │  SIDEBAR: Hidden (slides in from left when ☰ clicked)    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      TABLET (640px - 1023px)                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      HEADER                               │  │
│  │  [☰] Dashboard › Overview        [Status] [Bell] [User]  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │                  MAIN CONTENT                             │  │
│  │                                                           │  │
│  │  ┌──────────────────┐  ┌──────────────────┐              │  │
│  │  │ KPI Card 1       │  │ KPI Card 2       │              │  │
│  │  └──────────────────┘  └──────────────────┘              │  │
│  │  ┌──────────────────┐  ┌──────────────────┐              │  │
│  │  │ KPI Card 3       │  │ KPI Card 4       │              │  │
│  │  └──────────────────┘  └──────────────────┘              │  │
│  │  ┌──────────────────┐  ┌──────────────────┐              │  │
│  │  │ Chart 1          │  │ Chart 2          │              │  │
│  │  └──────────────────┘  └──────────────────┘              │  │
│  │                                                           │  │
│  │  SIDEBAR: Overlay when open                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DESKTOP (≥ 1024px)                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      HEADER                               │  │
│  │  Dashboard › Overview › Executive  [Status] [10:53] [Bell]│  │
│  │                                                   [User]   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌────────┬─────────────────────────────────────────────────┐  │
│  │        │                                                  │  │
│  │ SIDE   │             MAIN CONTENT                         │  │
│  │ BAR    │                                                  │  │
│  │ (256px)│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │  │
│  │        │  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │            │  │
│  │ Logo   │  │ Card │ │ Card │ │ Card │ │ Card │            │  │
│  │ ----   │  │  1   │ │  2   │ │  3   │ │  4   │            │  │
│  │ Nav    │  └──────┘ └──────┘ └──────┘ └──────┘            │  │
│  │ Items  │                                                  │  │
│  │        │  ┌────────────┐ ┌────────────┐ ┌────────────┐   │  │
│  │ ----   │  │  Chart 1   │ │  Chart 2   │ │  Chart 3   │   │  │
│  │ User   │  │            │ │            │ │            │   │  │
│  │        │  └────────────┘ └────────────┘ └────────────┘   │  │
│  │        │                                                  │  │
│  └────────┴─────────────────────────────────────────────────┘  │
│                                                                  │
│  SIDEBAR: Always visible, fixed position                        │
└─────────────────────────────────────────────────────────────────┘

BREAKPOINT SUMMARY:

• xs (< 640px):   1-column grid, overlay sidebar
• sm (640-767px): 2-column grid, overlay sidebar
• md (768-1023px): 2-column grid, overlay sidebar
• lg (1024-1279px): 4-column grid, fixed sidebar (256px)
• xl (1280px+):    4-column grid, fixed sidebar (256px)
```

---

## 6. Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    USER INTERACTIONS                            │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ User Action    │
        └────────┬───────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Click   │ │ Keyboard│ │ Scroll  │
│ Button  │ │ Shortcut│ │ Event   │
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     └───────────┼───────────┘
                 ▼
        ┌────────────────┐
        │ Event Handler  │
        └────────┬───────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Update   │ │ Navigate │ │ Toggle   │
│ State    │ │ Route    │ │ UI       │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     └────────────┼────────────┘
                  ▼
         ┌────────────────┐
         │ React Re-render│
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ Updated UI     │
         └────────────────┘

EXAMPLE FLOWS:

1. CLICK "RUN FORECAST" BUTTON:
   User clicks → onClick handler → navigate('/app/forecasting')
   → React Router changes route → Forecasting component renders

2. TOGGLE SIDEBAR:
   User clicks collapse button → toggleCollapse() called
   → setCollapsed(true) → localStorage.setItem()
   → Sidebar re-renders with w-16 instead of w-64

3. KEYBOARD SHORTCUT (Ctrl+B):
   User presses Ctrl+B → keydown event → toggleCollapse()
   → Same as click flow above

4. SIGN IN:
   User clicks "Sign In" → Clerk modal opens → User enters credentials
   → Clerk validates → Session token stored → Redirect to /app/dashboard
   → ProtectedRoute checks auth → Dashboard renders

5. API DATA UPDATE:
   Component mounts → useEffect triggers → API call via React Query
   → Data fetched → Cache updated → State updated → Component re-renders
```

---

## 7. Authentication Decision Tree

```
START: User Attempts to Access Application
        │
        ▼
    Is route protected?
        │
   ┌────┴────┐
   NO        YES
   │          │
   ▼          ▼
RENDER    Check Environment Mode
COMPONENT     │
              ▼
          VITE_DEVELOPMENT_MODE?
              │
         ┌────┴────┐
         YES       NO
         │         │
         ▼         ▼
    DEVELOPMENT  PRODUCTION
    MODE         MODE
         │         │
         │         ▼
         │     Is Clerk Loaded?
         │         │
         │    ┌────┴────┐
         │    YES       NO
         │    │         │
         │    ▼         ▼
         │  Check     Fallback to
         │  Auth      Development
         │  Status    Mode
         │    │         │
         │    ▼         │
         │  isSignedIn? │
         │    │         │
         │ ┌──┴──┐      │
         │ YES  NO      │
         │ │    │       │
         ├─┤    │       │
         │ │    ▼       │
         │ │  Redirect  │
         │ │  to        │
         │ │  /app/     │
         │ │  sign-in   │
         │ │            │
         ▼ ▼            ▼
    ┌────────────────────┐
    │ RENDER PROTECTED   │
    │ COMPONENT          │
    │                    │
    │ • XeroProvider     │
    │ • DashboardLoader  │
    │ • DashboardLayout  │
    └────────────────────┘

AUTHENTICATION TIMEOUT FLOW:

User attempts sign-in
        │
        ▼
    Clerk API call initiated
        │
        ▼
    Set 3-second timeout
        │
   ┌────┴────┐
   │         │
   ▼         ▼
SUCCESS   TIMEOUT
(< 3s)    (≥ 3s)
   │         │
   ▼         ▼
Generate   Switch to
JWT Token  Fallback Mode
   │         │
   ▼         ▼
Redirect   Allow Access
to         (Dev Mode)
Dashboard
```

---

## 8. CSS Class Hierarchy (Tailwind)

```
LAYOUT CLASSES
│
├── Container Widths
│   ├── max-w-7xl (1280px)
│   ├── max-w-4xl (896px)
│   └── max-w-3xl (768px)
│
├── Spacing
│   ├── p-{size}  (padding)
│   ├── m-{size}  (margin)
│   ├── gap-{size} (grid/flex gap)
│   └── space-{x|y}-{size} (stack spacing)
│
├── Grid Layouts
│   ├── grid
│   ├── grid-cols-{n}
│   ├── md:grid-cols-{n}
│   └── lg:grid-cols-{n}
│
└── Flex Layouts
    ├── flex
    ├── flex-col
    ├── items-{alignment}
    └── justify-{alignment}

COMPONENT CLASSES
│
├── Cards
│   ├── rounded-xl (12px radius)
│   ├── shadow-lg
│   ├── p-6 (24px padding)
│   └── bg-white
│
├── Buttons
│   ├── rounded-xl
│   ├── px-8 py-4 (padding)
│   ├── font-semibold
│   ├── transition-all
│   └── hover:scale-105
│
├── KPI Cards
│   ├── bg-gradient-{type}
│   ├── rounded-xl
│   ├── p-6
│   ├── shadow-lg
│   └── hover:-translate-y-1
│
└── Navigation Items
    ├── rounded-lg
    ├── px-3 py-2
    ├── hover:bg-slate-700
    └── text-slate-300

COLOR CLASSES
│
├── Background Colors
│   ├── bg-white
│   ├── bg-slate-{50-900}
│   ├── bg-blue-{50-900}
│   └── bg-purple-{50-900}
│
├── Text Colors
│   ├── text-white
│   ├── text-slate-{400-900}
│   ├── text-blue-{500-700}
│   └── text-muted-foreground
│
└── Gradient Backgrounds
    ├── bg-gradient-to-br
    ├── from-blue-600
    └── to-purple-700

TYPOGRAPHY CLASSES
│
├── Headings
│   ├── text-7xl (Hero)
│   ├── text-5xl (Page title)
│   ├── text-3xl (Section title)
│   ├── text-xl (Card title)
│   └── text-lg (Widget title)
│
├── Body Text
│   ├── text-base (16px default)
│   ├── text-sm (14px small)
│   └── text-xs (12px caption)
│
└── Font Weights
    ├── font-extrabold (800)
    ├── font-bold (700)
    ├── font-semibold (600)
    └── font-medium (500)

INTERACTIVE CLASSES
│
├── Hover States
│   ├── hover:bg-{color}
│   ├── hover:scale-{scale}
│   ├── hover:shadow-{size}
│   └── hover:-translate-y-{size}
│
├── Focus States
│   ├── focus:outline-none
│   ├── focus:ring-2
│   ├── focus:ring-blue-500
│   └── focus:ring-offset-2
│
└── Active States
    ├── active:scale-98
    └── active:shadow-sm

ANIMATION CLASSES
│
├── Transitions
│   ├── transition-all
│   ├── transition-colors
│   └── transition-transform
│
├── Durations
│   ├── duration-150 (fast)
│   ├── duration-300 (normal)
│   └── duration-500 (slow)
│
└── Animations
    ├── animate-pulse
    ├── animate-spin
    └── animate-pulse-slow (custom)

RESPONSIVE CLASSES
│
├── sm: (≥ 640px)
│   ├── sm:text-5xl
│   ├── sm:grid-cols-2
│   └── sm:flex-row
│
├── md: (≥ 768px)
│   ├── md:text-6xl
│   ├── md:grid-cols-2
│   └── md:flex
│
├── lg: (≥ 1024px)
│   ├── lg:text-7xl
│   ├── lg:grid-cols-4
│   └── lg:block
│
└── xl: (≥ 1280px)
    └── xl:max-w-7xl
```

---

## 9. File Structure Diagram

```
sentia-ai-manufacturing-app/
│
├── src/
│   ├── main.jsx                    # App entry point
│   ├── App-simple-environment.jsx  # Root app component
│   │
│   ├── pages/                      # Page components
│   │   ├── LandingPage.jsx        # ✅ Exists (needs styling updates)
│   │   ├── DashboardEnterprise.jsx # ✅ Exists (needs component updates)
│   │   ├── Forecasting.jsx        # ✅ Exists
│   │   ├── Analytics.jsx          # ✅ Exists
│   │   └── ...
│   │
│   ├── components/
│   │   ├── layout/                # Layout components
│   │   │   ├── Sidebar.jsx        # ✅ Exists (needs dark theme styling)
│   │   │   ├── Header.jsx         # ✅ Exists (needs breadcrumb + status)
│   │   │   ├── DashboardLayout.jsx # ✅ Exists
│   │   │   ├── Breadcrumb.jsx     # ⚠️ CREATE NEW
│   │   │   └── SystemStatusBadge.jsx # ⚠️ CREATE NEW
│   │   │
│   │   ├── dashboard/             # Dashboard components
│   │   │   ├── KPIGrid.jsx        # ✅ Exists (needs gradient styling)
│   │   │   ├── WorkingCapitalCard.jsx # ✅ Exists (needs redesign)
│   │   │   ├── QuickActions.jsx   # ✅ Exists (needs styling update)
│   │   │   ├── ProductSalesChart.jsx # ✅ Exists
│   │   │   ├── PLAnalysisChart.jsx # ✅ Exists
│   │   │   └── RegionalContributionChart.jsx # ✅ Exists
│   │   │
│   │   ├── auth/                  # Authentication components
│   │   │   ├── AuthGuard.jsx      # ✅ Exists
│   │   │   ├── ProtectedRoute.jsx # ✅ Exists
│   │   │   └── ClerkAuthGuard.jsx # ✅ Exists
│   │   │
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── card.jsx           # ✅ Exists
│   │   │   ├── badge.jsx          # ✅ Exists
│   │   │   ├── button.jsx         # ✅ Exists
│   │   │   └── ...
│   │   │
│   │   └── ErrorBoundary.jsx      # ✅ Exists
│   │
│   ├── auth/                      # Auth providers
│   │   ├── BulletproofAuthProvider.jsx # ✅ Exists
│   │   └── DevelopmentAuthProvider.jsx # ✅ Exists
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── useAuthRole.js         # ✅ Exists
│   │   ├── useEnvironmentUser.js  # ✅ Exists
│   │   └── useSSE.js              # ✅ Exists
│   │
│   ├── services/                  # API services
│   │   ├── api/
│   │   │   ├── plAnalysisApi.js   # ✅ Exists
│   │   │   ├── workingCapitalApi.js # ✅ Exists
│   │   │   ├── productSalesApi.js # ✅ Exists
│   │   │   └── regionalPerformanceApi.js # ✅ Exists
│   │   ├── xeroService.js         # ✅ Exists
│   │   └── shopify-multistore.js  # ✅ Exists
│   │
│   ├── contexts/                  # React contexts
│   │   ├── XeroContext.jsx        # ✅ Exists
│   │   └── useXero.js             # ✅ Exists
│   │
│   ├── utils/                     # Utility functions
│   │   └── cn.js                  # ✅ Exists (classnames helper)
│   │
│   └── styles/
│       └── index.css              # ✅ Exists (Tailwind imports)
│
├── public/                        # Static assets
│   └── ...
│
├── bmad/                          # BMAD-METHOD files
│   ├── audit/
│   │   ├── COMPREHENSIVE_UI_UX_AUTHENTICATION_PLAN.md # ✅ NEW
│   │   └── UI_UX_ARCHITECTURE_DIAGRAMS.md # ✅ NEW
│   ├── docs/
│   └── ...
│
├── vite.config.js                 # ✅ Exists
├── tailwind.config.js             # ✅ Exists (needs gradient updates)
├── package.json                   # ✅ Exists
└── render.yaml                    # ✅ Exists (deployment config)

LEGEND:
✅ File exists, minor updates needed
⚠️ File needs to be created
🔧 File exists, major refactor needed
```

---

## 10. Deployment Pipeline Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    DEVELOPER WORKFLOW                           │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ Code Changes   │
        │ in Local IDE   │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │ Run Tests      │
        │ Locally        │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │ Git Commit     │
        │ with Message   │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │ Git Push to    │
        │ development    │
        │ branch         │
        └────────┬───────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│                    RENDER.COM (CI/CD)                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Webhook Triggered on Git Push                            │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Clone Repository (development branch)                    │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Install Dependencies (pnpm install)                      │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Build Application (pnpm run build)                       │  │
│  │ • Vite builds React app                                  │  │
│  │ • Tailwind processes CSS                                 │  │
│  │ • Assets optimized and bundled                           │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Inject Environment Variables                             │  │
│  │ • VITE_CLERK_PUBLISHABLE_KEY                             │  │
│  │ • VITE_API_BASE_URL                                      │  │
│  │ • VITE_DEVELOPMENT_MODE                                  │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Start Server (node server.js)                            │  │
│  │ • Express serves React build from /dist                  │  │
│  │ • API routes available at /api/*                         │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Health Check (/health endpoint)                          │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                ┌──────┴──────┐                                  │
│                │             │                                  │
│                ▼             ▼                                  │
│        ┌───────────┐  ┌───────────┐                            │
│        │ SUCCESS   │  │ FAILURE   │                            │
│        └─────┬─────┘  └─────┬─────┘                            │
│              │              │                                   │
│              │              ▼                                   │
│              │        ┌───────────┐                            │
│              │        │ Rollback  │                            │
│              │        │ Previous  │                            │
│              │        │ Deploy    │                            │
│              │        └───────────┘                            │
│              │                                                  │
└──────────────┼──────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│                    LIVE ENVIRONMENTS                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Development Environment                                   │  │
│  │ https://capliquify-frontend-prod.onrender.com │  │
│  │ • Auto-deploys on push to development branch             │  │
│  │ • VITE_DEVELOPMENT_MODE=true                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Test Environment                                          │  │
│  │ https://sentia-manufacturing-dashboard-test.onrender.com │  │
│  │ • Auto-deploys on push to test branch                    │  │
│  │ • VITE_DEVELOPMENT_MODE=false                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Production Environment                                    │  │
│  │ https://sentia-.../...production.onrender.com            │  │
│  │ • Auto-deploys on push to production branch              │  │
│  │ • VITE_DEVELOPMENT_MODE=false                            │  │
│  │ • Stricter monitoring and alerting                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘

BRANCH PROMOTION FLOW:

development → test → production

Developer pushes to development
        │
        ▼
    Auto-deploys to DEV environment
        │
        ▼
    Testing and QA on DEV
        │
        ▼
    Merge development → test
        │
        ▼
    Auto-deploys to TEST environment
        │
        ▼
    UAT (User Acceptance Testing)
        │
        ▼
    Approval from stakeholders
        │
        ▼
    Merge test → production
        │
        ▼
    Auto-deploys to PRODUCTION
        │
        ▼
    Monitor production deployment
```

---

## Summary

These architecture diagrams provide visual representations of:

1. **Component Hierarchy** - Complete tree of React components
2. **Authentication State Flow** - How authentication is managed
3. **Route Protection** - How routes are protected and accessed
4. **Data Flow** - How data moves through the application
5. **Responsive Layouts** - How UI adapts to different screen sizes
6. **Component Interactions** - How user actions trigger UI updates
7. **Authentication Decision Tree** - Logic flow for auth decisions
8. **CSS Class Hierarchy** - Tailwind class organization
9. **File Structure** - Complete project file organization
10. **Deployment Pipeline** - How code goes from development to production

These diagrams complement the main **COMPREHENSIVE_UI_UX_AUTHENTICATION_PLAN.md** document and provide visual reference for developers implementing the redesign.

---

**Next Steps:**

1. Review diagrams with development team
2. Use diagrams during implementation for reference
3. Update diagrams as architecture evolves
4. Share with stakeholders for clarity on system design

**Document Version:** 1.0
**Created By:** Claude (BMAD Architect Agent)
**Status:** Ready for Review
