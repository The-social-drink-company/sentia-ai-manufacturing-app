# BMAD-MOCK-007: UI Empty States & Loading Components

**Story ID**: BMAD-MOCK-007
**Epic**: EPIC-002 (Eliminate Mock Data - Production-Ready Application)
**Sprint**: Sprint 3 - Real-Time & Error Handling
**Story Points**: 4
**Estimated Effort**: 2 days
**Priority**: Low
**Status**: Ready for Development

**Created**: 2025-10-19
**Assigned To**: Development Team
**BMAD Agent Role**: Developer (`bmad dev`)

---

## 📋 Story Overview

**As a** user
**I want** clear loading states and empty state messages throughout the dashboard
**So that** I understand when data is loading, missing, or requires setup

---

## 🎯 Business Value

**Current State (Problem)**:
- Widgets show blank screens during API calls
- No indication of why data is missing
- Setup instructions buried in technical errors
- Inconsistent empty state designs across components

**Target State (Solution)**:
- Professional loading spinners during async operations
- Clear empty state messages with setup instructions
- Consistent design language across all widgets
- Actionable buttons (Setup, Retry, Documentation)

**Business Impact**:
- **User Experience**: Clear understanding of application state
- **Onboarding**: New users guided through setup process
- **Support Reduction**: Self-service setup instructions reduce tickets
- **Professional Appearance**: Polished UI builds user confidence

---

## 🔍 Current State Analysis

### Existing Empty State Patterns

**Current Approach** (Inconsistent):
```jsx
// ❌ INCONSISTENT: Some widgets have empty states, others don't
function Widget({ data }) {
  if (!data) {
    return <div>No data</div>; // Too generic
  }
  return <Chart data={data} />;
}
```

**Required Approach** (Standardized):
```jsx
// ✅ STANDARDIZED: Reusable components with consistent design
function Widget({ data, loading, error }) {
  if (loading) {
    return <LoadingSpinner message="Loading financial data..." />;
  }

  if (error && error.setupRequired) {
    return <SetupPrompt service="xero" instructions={error.message} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState
      icon={<ChartIcon />}
      title="No Data Available"
      description="No financial records found. Data will appear here once synced."
    />;
  }

  return <Chart data={data} />;
}
```

---

## 🛠️ Technical Implementation Plan

### Phase 1: Create Reusable Components (0.5 days)

**1.1 Loading Spinner Component**

**File**: `src/components/common/LoadingSpinner.jsx` (NEW)

```jsx
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  fullScreen = false
}) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const spinnerClass = sizeClasses[size] || sizeClasses.md;

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <ArrowPathIcon className={`${spinnerClass} animate-spin text-blue-600`} />
      {message && (
        <p className="text-sm text-gray-600 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[200px] p-8">
      {content}
    </div>
  );
}

// Skeleton loading variant
export function SkeletonLoader({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{ width: `${100 - (i * 10)}%` }}
        />
      ))}
    </div>
  );
}
```

**1.2 Empty State Component**

**File**: `src/components/common/EmptyState.jsx` (NEW)

```jsx
import { InboxIcon } from '@heroicons/react/24/outline';

export default function EmptyState({
  icon: Icon = InboxIcon,
  title = 'No Data Available',
  description,
  action,
  variant = 'default' // 'default' | 'setup' | 'error'
}) {
  const variantStyles = {
    default: {
      container: 'bg-gray-50 border-gray-200',
      icon: 'text-gray-400',
      title: 'text-gray-900',
      description: 'text-gray-600'
    },
    setup: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      description: 'text-blue-700'
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
      description: 'text-red-700'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className={`rounded-lg border-2 border-dashed ${styles.container} p-8 text-center`}>
      <Icon className={`mx-auto h-16 w-16 ${styles.icon}`} />

      <h3 className={`mt-4 text-lg font-semibold ${styles.title}`}>
        {title}
      </h3>

      {description && (
        <p className={`mt-2 text-sm ${styles.description}`}>
          {description}
        </p>
      )}

      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}
```

**1.3 Error State Component**

**File**: `src/components/common/ErrorState.jsx` (NEW)

```jsx
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getUserFriendlyError } from '../../utils/api-error-handler';

export default function ErrorState({
  error,
  onRetry,
  showTechnicalDetails = false
}) {
  const friendlyError = getUserFriendlyError(error);

  return (
    <div className="rounded-lg border-2 border-red-200 bg-red-50 p-8 text-center">
      <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-600" />

      <h3 className="mt-4 text-lg font-semibold text-red-900">
        {friendlyError.title}
      </h3>

      <p className="mt-2 text-sm text-red-700">
        {friendlyError.message}
      </p>

      {showTechnicalDetails && error.cause && (
        <details className="mt-4 text-left">
          <summary className="text-xs text-red-600 cursor-pointer">
            Technical Details
          </summary>
          <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-auto">
            {JSON.stringify(error.cause, null, 2)}
          </pre>
        </details>
      )}

      <div className="mt-6 flex justify-center gap-3">
        {friendlyError.action === 'retry' && onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-primary"
          >
            Try Again
          </button>
        )}

        <a
          href="/docs/troubleshooting"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
        >
          View Documentation
        </a>
      </div>
    </div>
  );
}
```

**1.4 Setup Prompt Component**

**File**: `src/components/common/SetupPrompt.jsx` (NEW)

```jsx
import { CogIcon } from '@heroicons/react/24/outline';

export default function SetupPrompt({
  service,
  title,
  description,
  envVars = [],
  permissions = [],
  setupUrl,
  docsUrl
}) {
  return (
    <div className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-8">
      <div className="text-center">
        <CogIcon className="mx-auto h-16 w-16 text-blue-600" />

        <h3 className="mt-4 text-xl font-semibold text-gray-900">
          {title || `Connect ${service} to View Data`}
        </h3>

        <p className="mt-2 text-gray-600">
          {description || `${service} integration is not configured. Add credentials to view live data.`}
        </p>

        {envVars.length > 0 && (
          <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
            <h4 className="font-semibold text-gray-900">Required Environment Variables:</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {envVars.map((envVar, index) => (
                <li key={index}>
                  <code className="bg-gray-100 px-2 py-1 rounded">{envVar.name}</code>
                  {envVar.description && ` - ${envVar.description}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {permissions.length > 0 && (
          <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
            <h4 className="font-semibold text-gray-900">Required API Permissions:</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {permissions.map((permission, index) => (
                <li key={index}>
                  {permission.required ? '✅' : '❌'} {permission.name}
                  {permission.description && ` - ${permission.description}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-4">
          {docsUrl && (
            <a
              href={docsUrl}
              className="btn btn-primary"
            >
              Setup Instructions
            </a>
          )}

          {setupUrl && (
            <a
              href={setupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              Open {service} Admin
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 2: Update Widgets with Empty States (1 day)

**2.1 KPI Strip Widget**

**File**: `src/components/widgets/KPIStripWidget.jsx`

```jsx
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import SetupPrompt from '../common/SetupPrompt';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function KPIStripWidget() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => fetch('/api/v1/dashboard/kpis').then(res => res.json())
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="widget-card">
        <h3 className="widget-title">Key Performance Indicators</h3>
        <LoadingSpinner message="Loading KPIs..." />
      </div>
    );
  }

  // Setup required state
  if (error?.setupRequired || (data && !data.success && data.setupRequired)) {
    return (
      <div className="widget-card">
        <h3 className="widget-title">Key Performance Indicators</h3>
        <SetupPrompt
          service="Data Integrations"
          title="Connect Data Sources"
          description="Connect Xero, Shopify, Amazon, and Unleashed to view KPIs."
          envVars={[
            { name: 'XERO_CLIENT_ID', description: 'Xero OAuth client ID' },
            { name: 'SHOPIFY_UK_SHOP_DOMAIN', description: 'UK store domain' },
            { name: 'AMAZON_REFRESH_TOKEN', description: 'SP-API refresh token' },
            { name: 'UNLEASHED_API_ID', description: 'Unleashed API ID' }
          ]}
          docsUrl="/docs/integrations"
        />
      </div>
    );
  }

  // Error state
  if (error || (data && !data.success)) {
    return (
      <div className="widget-card">
        <h3 className="widget-title">Key Performance Indicators</h3>
        <ErrorState error={error || data} onRetry={refetch} />
      </div>
    );
  }

  // Empty data state
  if (!data?.data?.kpis || Object.keys(data.data.kpis).length === 0) {
    return (
      <div className="widget-card">
        <h3 className="widget-title">Key Performance Indicators</h3>
        <EmptyState
          icon={ChartBarIcon}
          title="No KPI Data Available"
          description="KPIs will appear here once data sources are connected and synced."
          action={
            <button onClick={refetch} className="btn btn-primary">
              Refresh Data
            </button>
          }
        />
      </div>
    );
  }

  // Success state - render KPIs
  return (
    <div className="widget-card">
      <h3 className="widget-title">Key Performance Indicators</h3>
      <div className="kpi-grid">
        {Object.entries(data.data.kpis).map(([key, kpi]) => (
          <KPICard key={key} kpi={kpi} />
        ))}
      </div>
    </div>
  );
}
```

**2.2 Production Schedule Widget** (Apply same pattern)

**File**: `src/components/widgets/ProductionScheduleWidget.jsx`

```jsx
// Similar structure with:
// - LoadingSpinner during fetch
// - SetupPrompt if Unleashed not configured
// - ErrorState for API failures
// - EmptyState if no assembly jobs
// - Success rendering of production schedule
```

**2.3 Working Capital Widget** (Apply same pattern)

**File**: `src/components/working-capital/WorkingCapitalWidget.jsx`

```jsx
// Similar structure with:
// - LoadingSpinner during Xero fetch
// - SetupPrompt if Xero not configured
// - ErrorState for API failures
// - EmptyState if no financial data
// - Success rendering of working capital metrics
```

**2.4 Inventory Alerts Widget** (Apply same pattern)

Apply same pattern to ALL widgets throughout the application.

---

### Phase 3: Loading State Enhancements (0.25 days)

**3.1 Skeleton Loaders for Tables**

**File**: `src/components/common/TableSkeleton.jsx` (NEW)

```jsx
export default function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-3 py-3.5">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-3 py-4">
                  <div
                    className="h-4 bg-gray-100 rounded animate-pulse"
                    style={{ width: `${70 + Math.random() * 30}%` }}
                  ></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**3.2 Chart Loading Placeholder**

**File**: `src/components/common/ChartSkeleton.jsx` (NEW)

```jsx
export default function ChartSkeleton({ type = 'line' }) {
  return (
    <div className="w-full h-64 flex items-end justify-around gap-2 p-4 bg-gray-50 rounded-lg">
      {type === 'bar' && (
        <>
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-t animate-pulse"
              style={{
                width: '12%',
                height: `${40 + Math.random() * 60}%`
              }}
            ></div>
          ))}
        </>
      )}

      {type === 'line' && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-full h-2 bg-gray-200 rounded-full animate-pulse relative">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-gray-300 to-transparent animate-shimmer"></div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Phase 4: Empty State Variations (0.25 days)

**4.1 Integration-Specific Setup Prompts**

Create pre-configured setup prompts for each integration:

**File**: `src/components/integrations/XeroSetupPrompt.jsx`

```jsx
import SetupPrompt from '../common/SetupPrompt';

export default function XeroSetupPrompt() {
  return (
    <SetupPrompt
      service="Xero"
      title="Connect Xero to View Financial Data"
      description="Xero integration provides real-time financial KPIs, working capital analysis, and cash flow data."
      envVars={[
        { name: 'XERO_CLIENT_ID', description: 'OAuth 2.0 client ID' },
        { name: 'XERO_CLIENT_SECRET', description: 'OAuth 2.0 client secret' },
        { name: 'XERO_REDIRECT_URI', description: 'OAuth callback URL' }
      ]}
      permissions={[
        { name: 'Accounting.reports.read', required: true, description: 'Read financial reports' },
        { name: 'Accounting.contacts.read', required: true, description: 'Read debtors/creditors' }
      ]}
      setupUrl="https://developer.xero.com/app/manage"
      docsUrl="/docs/integrations/xero-setup"
    />
  );
}
```

Create similar components for:
- `ShopifySetupPrompt.jsx`
- `AmazonSetupPrompt.jsx`
- `UnleashedSetupPrompt.jsx`

(Already created in previous stories - BMAD-MOCK-001 through BMAD-MOCK-004)

**4.2 Error-Specific Empty States**

**No Network Connection**:
```jsx
<EmptyState
  icon={WifiIcon}
  title="No Internet Connection"
  description="Unable to connect to external services. Check your network connection and try again."
  variant="error"
  action={<button onClick={refetch} className="btn btn-primary">Retry</button>}
/>
```

**Data Not Yet Synced**:
```jsx
<EmptyState
  icon={ClockIcon}
  title="Data Sync in Progress"
  description="Your data is being synced from external services. This may take a few minutes."
  variant="setup"
  action={
    <div className="flex items-center gap-2 text-sm text-blue-700">
      <ArrowPathIcon className="h-4 w-4 animate-spin" />
      <span>Syncing... {progress}%</span>
    </div>
  }
/>
```

---

### Phase 5: Testing & Documentation (0.25 days)

**5.1 Manual Testing Checklist**

```markdown
### Loading States
- [ ] All widgets show loading spinner during API calls
- [ ] Loading spinner disappears after data loads
- [ ] Skeleton loaders render correctly for tables
- [ ] Chart placeholders render correctly
- [ ] Loading messages are descriptive (not generic "Loading...")

### Empty States
- [ ] Empty data displays "No data available" message
- [ ] Empty states include descriptive icons
- [ ] Empty states explain why data is missing
- [ ] Refresh/setup buttons are functional

### Setup Prompts
- [ ] Missing credentials show setup wizard
- [ ] Required env vars listed clearly
- [ ] API permissions documented
- [ ] Setup links open correct admin panels
- [ ] Documentation links work

### Error States
- [ ] API failures show user-friendly errors
- [ ] Retry buttons functional
- [ ] Technical details collapsible (for admins)
- [ ] Error messages don't expose secrets

### Consistency
- [ ] All widgets use same empty state components
- [ ] Design language consistent (colors, spacing, icons)
- [ ] Loading states don't flash (<300ms display)
- [ ] Transitions smooth (fade in/out)
```

**5.2 Component Storybook**

**File**: `src/stories/LoadingStates.stories.jsx`

```jsx
import LoadingSpinner, { SkeletonLoader } from '../components/common/LoadingSpinner';
import TableSkeleton from '../components/common/TableSkeleton';
import ChartSkeleton from '../components/common/ChartSkeleton';

export default {
  title: 'Components/Loading States',
  component: LoadingSpinner
};

export const Spinner = () => <LoadingSpinner message="Loading data..." />;
export const FullScreen = () => <LoadingSpinner fullScreen />;
export const Skeleton = () => <SkeletonLoader lines={5} />;
export const Table = () => <TableSkeleton rows={5} columns={4} />;
export const BarChart = () => <ChartSkeleton type="bar" />;
export const LineChart = () => <ChartSkeleton type="line" />;
```

**File**: `src/stories/EmptyStates.stories.jsx`

```jsx
import EmptyState from '../components/common/EmptyState';
import { InboxIcon, ChartBarIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

export default {
  title: 'Components/Empty States',
  component: EmptyState
};

export const Default = () => (
  <EmptyState
    icon={InboxIcon}
    title="No Data Available"
    description="There is no data to display at this time."
  />
);

export const WithAction = () => (
  <EmptyState
    icon={ChartBarIcon}
    title="No KPIs Configured"
    description="Configure data sources to view KPIs."
    action={<button className="btn btn-primary">Setup Data Sources</button>}
  />
);

export const SetupVariant = () => (
  <EmptyState
    variant="setup"
    icon={ShoppingBagIcon}
    title="Connect Shopify"
    description="Connect your Shopify store to view sales data."
    action={<button className="btn btn-primary">Connect Shopify</button>}
  />
);

export const ErrorVariant = () => (
  <EmptyState
    variant="error"
    title="Connection Failed"
    description="Unable to connect to the API. Please try again."
    action={<button className="btn btn-primary">Retry</button>}
  />
);
```

**5.3 Documentation**

**File**: `docs/ui-components/empty-states.md`

```markdown
# Empty States & Loading Components

## Overview

Standardized UI components for handling loading, empty, and error states throughout the application.

## Components

### LoadingSpinner

**Usage**:
```jsx
import LoadingSpinner from '../components/common/LoadingSpinner';

<LoadingSpinner message="Loading dashboard data..." />
```

**Props**:
- `message` (string): Loading message (default: "Loading...")
- `size` (sm|md|lg|xl): Spinner size (default: "md")
- `fullScreen` (boolean): Full-screen overlay (default: false)

### EmptyState

**Usage**:
```jsx
import EmptyState from '../components/common/EmptyState';
import { InboxIcon } from '@heroicons/react/24/outline';

<EmptyState
  icon={InboxIcon}
  title="No Data Available"
  description="Data will appear here once synced."
  variant="default"
  action={<button>Refresh</button>}
/>
```

**Props**:
- `icon` (Component): Heroicon component
- `title` (string): Primary message
- `description` (string): Secondary explanation
- `variant` (default|setup|error): Visual style
- `action` (ReactNode): Action button/link

### ErrorState

**Usage**:
```jsx
import ErrorState from '../components/common/ErrorState';

<ErrorState
  error={apiError}
  onRetry={refetch}
  showTechnicalDetails={true}
/>
```

**Props**:
- `error` (object): API error object
- `onRetry` (function): Retry callback
- `showTechnicalDetails` (boolean): Show error stack (default: false)

### SetupPrompt

**Usage**:
```jsx
import SetupPrompt from '../components/common/SetupPrompt';

<SetupPrompt
  service="Xero"
  title="Connect Xero"
  description="Xero integration provides financial data."
  envVars={[{ name: 'XERO_CLIENT_ID', description: 'OAuth client ID' }]}
  permissions={[{ name: 'read_reports', required: true }]}
  setupUrl="https://xero.com"
  docsUrl="/docs/xero-setup"
/>
```

## Design Guidelines

### Loading States
- Minimum display time: 300ms (prevent flash)
- Use skeleton loaders for known layouts (tables, charts)
- Use spinner for unknown content
- Always include descriptive message

### Empty States
- Always explain WHY data is missing
- Provide actionable next steps
- Use appropriate icons (Heroicons)
- Keep messages concise (<2 sentences)

### Error States
- Use user-friendly language (no jargon)
- Classify errors (network, auth, validation)
- Offer retry for transient errors
- Link to documentation for setup errors

## Accessibility

- All icons have `aria-label` attributes
- Loading states announce to screen readers
- Buttons have descriptive text
- Color is not the only indicator (use icons + text)
```

**5.4 Deployment**

```bash
# Commit UI empty states
git add .
git commit -m "feat(ui): Complete BMAD-MOCK-007 - UI empty states & loading components

- Create reusable LoadingSpinner component (4 sizes)
- Create EmptyState component (3 variants: default, setup, error)
- Create ErrorState component with user-friendly messages
- Create SetupPrompt component for missing credentials
- Add skeleton loaders (table, chart)
- Update all widgets with standardized empty states
- Create Storybook stories for all components
- Complete UI component documentation

Story: BMAD-MOCK-007
Sprint: Sprint 3 - Real-Time & Error Handling
Effort: 2 days

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to development
git push origin development
```

---

## ✅ Definition of Done

### Functional Requirements
- ✅ LoadingSpinner component created (4 sizes, fullscreen variant)
- ✅ EmptyState component created (3 variants)
- ✅ ErrorState component created (user-friendly errors)
- ✅ SetupPrompt component created (integration-specific)
- ✅ Skeleton loaders for tables and charts
- ✅ All widgets updated with empty states
- ✅ Integration-specific setup prompts (Xero, Shopify, Amazon, Unleashed)

### Technical Requirements
- ✅ Consistent design language (Tailwind CSS)
- ✅ Heroicons for all icons
- ✅ Accessible (ARIA labels, screen reader support)
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Loading states don't flash (<300ms)

### Testing Requirements
- ✅ Manual testing checklist passed
- ✅ Storybook stories created for all components
- ✅ Visual regression tests (optional)
- ✅ Accessibility audit (WCAG 2.1 AA)

### Documentation Requirements
- ✅ Component usage documentation
- ✅ Design guidelines
- ✅ Accessibility guidelines
- ✅ Storybook examples

### Deployment Requirements
- ✅ Changes deployed to development environment
- ✅ All widgets rendering empty states correctly
- ✅ Loading states functional

---

## 📊 Success Metrics

### Before (Inconsistent UI)
- Empty states: Blank screens or generic "No data"
- Loading: No indication or spinner
- Errors: Technical stack traces
- Setup: Hidden in console logs

### After (Polished UI)
- Empty states: Clear messages with icons and actions
- Loading: Professional spinners with descriptive messages
- Errors: User-friendly messages with retry buttons
- Setup: Guided wizards with step-by-step instructions

---

## 🔗 Related Stories

**Epic**: [EPIC-002: Eliminate Mock Data](../epics/2025-10-eliminate-mock-data-epic.md)

**Sprint 3 Stories**:
- ✅ BMAD-MOCK-005: Real-Time Data Streaming (Completed)
- ✅ BMAD-MOCK-006: API Fallback & Error Handling (Completed)
- ✅ BMAD-MOCK-007: UI Empty States & Loading UI (This Story)

---

**Story Status**: ✅ Ready for Implementation
**Next Step**: Begin Phase 1 - Create Reusable Components
**Estimated Completion**: 2 days from start

---

## 🎉 Epic Completion

**This is the FINAL story in EPIC-002 (Eliminate Mock Data)!**

Upon completion of BMAD-MOCK-007, all 7 stories will be complete:
1. ✅ BMAD-MOCK-001: Xero Financial Data (3 days)
2. ✅ BMAD-MOCK-002: Shopify Sales Data (2.5 days)
3. ✅ BMAD-MOCK-003: Amazon SP-API (3 days)
4. ✅ BMAD-MOCK-004: Unleashed ERP (3 days)
5. ✅ BMAD-MOCK-005: Real-Time SSE (2 days)
6. ✅ BMAD-MOCK-006: API Fallback (1.5 days)
7. ✅ BMAD-MOCK-007: UI Empty States (2 days)

**Total**: 17.5 days of work planned across 3 sprints

**Next Phase**: BMAD-METHOD v6a Phase 4 (Implementation)
