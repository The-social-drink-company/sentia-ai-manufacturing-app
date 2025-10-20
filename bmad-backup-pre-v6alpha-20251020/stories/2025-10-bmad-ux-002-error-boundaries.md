# BMAD-UX-002: Error Boundaries & Graceful Degradation

**Epic**: EPIC-003 - Frontend Polish & UX Enhancement
**Story ID**: BMAD-UX-002
**Priority**: HIGH
**Estimated Effort**: 1 day (baseline) → 2-3 hours (projected with 4.1x velocity)
**Dependencies**: None
**Status**: PENDING

---

## Story Description

Implement React Error Boundaries across the application to catch JavaScript errors, prevent full-page crashes, and provide graceful degradation with user-friendly error messages and recovery options. Ensure the application never shows a blank white screen to users.

### Business Value

- **Application Stability**: Prevents full-page crashes from propagating
- **User Trust**: Professional error handling builds confidence
- **Debugging**: Captures error context for faster troubleshooting
- **Business Continuity**: Users can continue working in unaffected areas
- **Reduced Support Tickets**: Clear error messages reduce user confusion

### Current State

- No React Error Boundaries implemented
- Unhandled errors crash the entire application
- Users see blank white screen or browser error page
- No error context captured for debugging
- No recovery mechanism for users

### Desired State

- Error Boundaries wrap all major sections (dashboard, widgets, pages)
- Errors contained to smallest affected component
- User-friendly error messages with recovery actions
- Automatic error reporting to logging service
- Fallback UI allows continued use of unaffected features

---

## Acceptance Criteria

### AC1: Core Error Boundary Components Created
**Given** a need for error handling across the application
**When** developers wrap components with error boundaries
**Then** reusable error boundary components exist:
- `<RootErrorBoundary />` - wraps entire app, fallback to safe mode
- `<PageErrorBoundary />` - wraps individual pages, shows error page
- `<WidgetErrorBoundary />` - wraps dashboard widgets, shows error card
- `<SectionErrorBoundary />` - wraps page sections, shows inline error

All boundaries include:
- Error logging to console (dev) or service (prod)
- User-friendly error messages (no stack traces exposed)
- Recovery actions (refresh, retry, go home)
- Error context capture (component stack, user info)

**Status**: ⏳ PENDING

---

### AC2: Root-Level Error Boundary Implemented
**Given** a catastrophic error occurs anywhere in the app
**When** error propagates to root boundary
**Then** root error boundary activates with:
- Full-page error screen
- Message: "Something went wrong. The application encountered an unexpected error."
- Actions: "Reload Application" button, "Contact Support" link
- Error details logged to backend (if available)
- User session preserved (localStorage not cleared)

**Status**: ⏳ PENDING

---

### AC3: Page-Level Error Boundaries Implemented
**Given** an error occurs in a specific page component
**When** error is caught by page-level boundary
**Then** page error boundary shows:
- Error message: "This page failed to load."
- Explanation: Brief, non-technical reason (e.g., "Data formatting error")
- Actions: "Try Again" button, "Go to Dashboard" link
- Navigation sidebar remains functional
- Other pages remain accessible

**Status**: ⏳ PENDING

---

### AC4: Widget-Level Error Boundaries Implemented
**Given** an error occurs in a dashboard widget
**When** error is caught by widget-level boundary
**Then** widget error boundary shows:
- Compact error card matching widget layout
- Message: "Unable to load this widget"
- Icon: Warning/error icon
- Actions: "Retry" button (attempts to remount widget)
- Other widgets on dashboard continue functioning normally

**Status**: ⏳ PENDING

---

### AC5: Error Logging and Monitoring Integrated
**Given** an error is caught by any error boundary
**When** error boundary componentDidCatch lifecycle fires
**Then** error details are logged:
- **Development**: `console.error()` with full stack trace
- **Production**: Send to logging service (e.g., Sentry, LogRocket, or custom endpoint)
- Error context includes:
  - User ID (if authenticated)
  - URL/route where error occurred
  - Component stack trace
  - Browser/OS information
  - Timestamp
  - Error message and type

**Status**: ⏳ PENDING

---

### AC6: Graceful Network Error Handling
**Given** API requests fail due to network issues
**When** fetch/axios errors occur
**Then** user sees:
- Contextual error message: "Unable to connect to server"
- Recovery actions: "Retry" button, "Check connection" guidance
- Loading state replaced with error state (not crash)
- Automatic retry after 5 seconds (with countdown)
- Option to dismiss automatic retry

**Status**: ⏳ PENDING

---

## Technical Context

### Files to Create

**Error Boundary Components**:
```
src/components/errors/
├── RootErrorBoundary.jsx         # Top-level app boundary
├── PageErrorBoundary.jsx         # Page-level boundary
├── WidgetErrorBoundary.jsx       # Widget-level boundary
├── SectionErrorBoundary.jsx      # Section-level boundary
├── ErrorFallback.jsx             # Reusable fallback UI component
├── errorLogger.js                # Error logging service
└── index.js                      # Export all error components
```

**Example Implementation** (`RootErrorBoundary.jsx`):
```jsx
import React from 'react'
import { logErrorToService } from './errorLogger'

export default class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('RootErrorBoundary caught error:', error, errorInfo)

    // Log to service in production
    logErrorToService({
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })

    this.setState({ error, errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              The application encountered an unexpected error. Please reload to continue.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 mb-3"
            >
              Reload Application
            </button>
            <a
              href="mailto:support@sentia.com"
              className="text-sm text-blue-600 hover:underline"
            >
              Contact Support
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Error Logger Service** (`errorLogger.js`):
```javascript
export function logErrorToService(errorData) {
  // Development: console only
  if (import.meta.env.DEV) {
    console.error('Error logged:', errorData)
    return
  }

  // Production: send to backend logging endpoint
  try {
    fetch('/api/logs/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...errorData,
        severity: 'error',
        source: 'frontend'
      })
    }).catch(err => {
      // Fail silently - don't crash app if logging fails
      console.error('Failed to log error to service:', err)
    })
  } catch (err) {
    console.error('Error logging failed:', err)
  }
}
```

### Files to Modify

**Wrap Application with Error Boundaries**:

**`src/App.jsx`** - Add root boundary:
```jsx
import RootErrorBoundary from './components/errors/RootErrorBoundary'

function App() {
  return (
    <RootErrorBoundary>
      <BrowserRouter>
        {/* existing app content */}
      </BrowserRouter>
    </RootErrorBoundary>
  )
}
```

**`src/pages/production/ProductionDashboard.jsx`** - Add page boundary:
```jsx
import PageErrorBoundary from '@/components/errors/PageErrorBoundary'

export default function ProductionDashboard() {
  return (
    <PageErrorBoundary pageName="Production Dashboard">
      {/* existing page content */}
    </PageErrorBoundary>
  )
}
```

**`src/components/widgets/DataTableWidget.jsx`** - Add widget boundary:
```jsx
import WidgetErrorBoundary from '@/components/errors/WidgetErrorBoundary'

export default function DataTableWidget({ title, data }) {
  return (
    <WidgetErrorBoundary widgetName={title}>
      {/* existing widget content */}
    </WidgetErrorBoundary>
  )
}
```

**All Dashboard Pages to Wrap**:
- `src/pages/production/ProductionDashboard.jsx`
- `src/pages/WorkingCapital.jsx`
- `src/pages/inventory/InventoryManagement.jsx`
- `src/pages/dashboard/EnhancedDashboard.jsx`
- `src/pages/forecasting/DemandForecasting.jsx`
- `src/pages/reports/FinancialReports.jsx`
- `src/pages/admin/AdminPanel.jsx`

**All Widgets to Wrap**:
- `src/components/widgets/KPIStripWidget.jsx`
- `src/components/widgets/DataTableWidget.jsx`
- `src/components/widgets/ChartWidget.jsx`
- `src/components/widgets/AlertsWidget.jsx`
- `src/components/widgets/DemandForecastWidget.jsx`
- `src/components/widgets/WorkingCapitalWidget.jsx`
- `src/components/widgets/InventorySummaryWidget.jsx`

### Backend Error Logging Endpoint

**Create API endpoint** (`server/api/logs.js`):
```javascript
import express from 'express'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.post('/error', authMiddleware, async (req, res) => {
  const { error, errorInfo, componentStack, url, userAgent, severity, source } = req.body

  // Log to console in development
  console.error('Frontend Error Logged:', {
    user: req.user?.id,
    error,
    url,
    timestamp: new Date().toISOString()
  })

  // In production, send to logging service (Sentry, CloudWatch, etc.)
  // await logToMonitoringService(req.body)

  res.json({ success: true, logged: true })
})

export default router
```

**Register route in** `server.js`:
```javascript
import logsRouter from './api/logs.js'
app.use('/api/logs', logsRouter)
```

---

## Testing Requirements

### Manual Testing Checklist

- [ ] **Root Boundary**: Force error in App.jsx, verify full-page fallback
- [ ] **Page Boundary**: Force error in page component, verify page fallback
- [ ] **Widget Boundary**: Force error in widget, verify widget fallback only
- [ ] **Error Logging**: Verify errors logged to console (dev) and API (prod)
- [ ] **Recovery Actions**: Verify "Reload" and "Retry" buttons work
- [ ] **Navigation**: Verify sidebar/navigation remains functional during errors

### Test Scenarios

**Test 1: Widget-Level Error (Isolated)**
1. Modify `DataTableWidget.jsx` to throw error: `throw new Error('Test widget error')`
2. Navigate to dashboard
3. **Expected**: Only affected widget shows error card, other widgets load normally
4. Click "Retry" button
5. **Expected**: Widget attempts to remount
6. Verify error logged to console/API

**Test 2: Page-Level Error (Contained)**
1. Modify `ProductionDashboard.jsx` to throw error in render: `throw new Error('Test page error')`
2. Navigate to `/production`
3. **Expected**: Page shows error fallback, sidebar remains functional
4. Click "Go to Dashboard" link
5. **Expected**: Navigate to dashboard successfully
6. Verify error logged with page context

**Test 3: Root-Level Error (Catastrophic)**
1. Modify `App.jsx` to throw error: `throw new Error('Test root error')`
2. Load application
3. **Expected**: Full-page error fallback displayed
4. Click "Reload Application"
5. **Expected**: Page reloads (comment out error to verify recovery)
6. Verify error logged with full context

**Test 4: Network Error Handling**
1. Disconnect network or block API endpoint
2. Navigate to page requiring API data
3. **Expected**: Error message "Unable to connect to server"
4. **Expected**: "Retry" button appears with countdown
5. Reconnect network
6. Click "Retry"
7. **Expected**: Data loads successfully

**Test 5: Async Error in useEffect**
1. Add async error in useEffect: `useEffect(() => { Promise.reject('Async error') }, [])`
2. **Expected**: Error boundary catches and displays fallback
3. Verify error logged with component context

---

## Implementation Plan

### Phase 1: Error Boundary Components (1-1.5 hours)
1. Create `src/components/errors/` directory
2. Implement `RootErrorBoundary.jsx`
3. Implement `PageErrorBoundary.jsx`
4. Implement `WidgetErrorBoundary.jsx`
5. Implement `errorLogger.js` service
6. Create reusable `ErrorFallback.jsx` component

### Phase 2: Application Integration (30 min - 1 hour)
1. Wrap `App.jsx` with `RootErrorBoundary`
2. Wrap all 7 page components with `PageErrorBoundary`
3. Wrap all 7 widget components with `WidgetErrorBoundary`
4. Test each boundary with forced errors

### Phase 3: Backend Logging Endpoint (30 min)
1. Create `server/api/logs.js` with error logging endpoint
2. Register route in `server.js`
3. Test error logging flow end-to-end
4. Verify error data captured correctly

### Phase 4: Testing & QA (30 min - 1 hour)
1. Force errors at each level (widget, page, root)
2. Verify fallback UI displays correctly
3. Verify recovery actions work
4. Verify error logging captures context
5. Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## Definition of Done

- [ ] ✅ All 4 error boundary components created (Root, Page, Widget, Section)
- [ ] ✅ All 7 dashboard pages wrapped with PageErrorBoundary
- [ ] ✅ All 7 widgets wrapped with WidgetErrorBoundary
- [ ] ✅ Root-level error boundary wraps entire App.jsx
- [ ] ✅ Error logging service implemented (frontend + backend)
- [ ] ✅ Backend `/api/logs/error` endpoint created and tested
- [ ] ✅ All boundaries tested with forced errors
- [ ] ✅ Recovery actions (Reload, Retry, Go Home) functional
- [ ] ✅ User-friendly error messages (no stack traces exposed)
- [ ] ✅ Zero ESLint warnings introduced
- [ ] ✅ Code reviewed and approved
- [ ] ✅ Committed to `development` branch with descriptive message
- [ ] ✅ Deployed to Render development environment and verified

---

## Related Stories

- **BMAD-UX-001** (Loading Skeletons): Complements with loading states
- **BMAD-UX-003** (Integrate Setup Prompts): Different from errors - setup prompts for missing config
- **BMAD-UX-004** (Mobile Responsiveness): Error fallbacks must work on mobile

---

## Notes

**Best Practices**:
- **Granular Boundaries**: Smallest affected area should catch error (widget > section > page > root)
- **User-Friendly Messages**: Never expose stack traces or technical details to users
- **Actionable Recovery**: Always provide clear next steps (Reload, Retry, Contact Support)
- **Context Capture**: Log enough context to reproduce errors (component stack, user ID, URL)
- **Fail Gracefully**: Logging failures should not crash the app

**Error Boundary Limitations**:
- Cannot catch errors in event handlers (use try/catch)
- Cannot catch errors in async code (use try/catch or Promise.catch)
- Cannot catch errors in server-side rendering
- Cannot catch errors in error boundary itself

**For Event Handler Errors** (use try/catch):
```javascript
async function handleSubmit() {
  try {
    await submitData()
  } catch (error) {
    logErrorToService({ error, context: 'submit button' })
    setErrorMessage('Submission failed. Please try again.')
  }
}
```

**Design References**:
- **GitHub**: Error pages with recovery actions
- **Vercel**: Clean error fallbacks with "Go Home" link
- **Linear**: Widget-level error handling without page crash
- **Stripe Dashboard**: Network error handling with retry

---

**Story Created**: 2025-10-19
**Last Updated**: 2025-10-19
**BMAD-METHOD Phase**: Planning (Phase 2)
