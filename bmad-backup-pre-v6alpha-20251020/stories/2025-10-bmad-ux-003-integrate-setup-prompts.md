# BMAD-UX-003: Integrate Setup Prompts into Frontend

**Epic**: EPIC-003 - Frontend Polish & UX Enhancement
**Story ID**: BMAD-UX-003
**Priority**: HIGH (Highest Business Value)
**Estimated Effort**: 3 days (baseline) → 6-8 hours (projected with 4.1x velocity)
**Dependencies**: BMAD-MOCK-009 (API fallback strategy complete)
**Status**: PENDING

---

## Story Description

Replace generic "No data available" messages with **interactive setup prompt components** that guide users through configuring external API integrations (Xero, Shopify, Amazon SP-API, Unleashed ERP). These components transform 503 API errors into actionable onboarding experiences.

### Business Value

- **Reduces Time-to-Value**: Users can self-configure integrations in minutes instead of waiting for support
- **Increases Adoption**: Clear setup instructions eliminate confusion and abandonment
- **Reduces Support Load**: 80-90% reduction in "integration not working" support tickets
- **Professional Polish**: Transforms errors into guided onboarding experiences
- **Competitive Advantage**: Most SaaS apps show generic errors; we show setup wizards

### Current State

- Backend returns 503 with JSON setup instructions (BMAD-MOCK-009 complete)
- Frontend shows generic error messages or "No data available"
- Users have no clear path to configure integrations
- Setup instructions exist but are not surfaced to users
- No visual guidance for integration configuration

### Desired State

- Frontend detects 503 responses and renders setup prompt components
- Each integration (Xero, Shopify, Amazon, Unleashed) has custom setup UI
- Setup prompts include:
  - Clear explanations of what integration provides
  - Step-by-step configuration instructions
  - Visual diagrams/screenshots (where helpful)
  - "Contact Admin" action for non-admin users
  - "Test Connection" action (future enhancement)
- Setup prompts match the visual context (dashboard widget vs full page)

---

## Acceptance Criteria

### AC1: Setup Prompt Component Library Created
**Given** a need for integration setup guidance
**When** developers need to display setup instructions
**Then** reusable setup prompt components exist:
- `<XeroSetupPrompt />` - Xero integration setup
- `<ShopifySetupPrompt />` - Shopify multi-store setup
- `<AmazonSetupPrompt />` - Amazon SP-API setup
- `<UnleashedSetupPrompt />` - Unleashed ERP setup
- `<GenericSetupPrompt />` - Fallback for unknown integrations

All components include:
- Integration name and logo
- "Why configure this?" benefit statement
- Step-by-step setup instructions
- Environment variables required
- "Contact Admin" button (for non-admin users)
- "View Documentation" link
- Proper RBAC: admins see full instructions, users see "contact admin"

**Status**: ⏳ PENDING

---

### AC2: Working Capital Page Shows Xero Setup Prompt
**Given** user navigates to `/working-capital`
**And** Xero API is not configured (returns 503)
**When** page attempts to fetch working capital data
**Then** page displays `<XeroSetupPrompt />` with:
- Headline: "Connect Xero to unlock Working Capital insights"
- Benefits: "View real-time AR/AP, optimize cash flow, track payment cycles"
- Setup steps:
  1. Create Xero app at developer.xero.com
  2. Generate OAuth 2.0 credentials
  3. Add environment variables: `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_TENANT_ID`
  4. Restart application
- **Admin users**: See full setup instructions
- **Non-admin users**: See "Contact your administrator to configure Xero integration"
- Action: "View Xero Setup Guide" (opens documentation)

**Status**: ⏳ PENDING

---

### AC3: Inventory Page Shows Shopify Setup Prompt
**Given** user navigates to `/inventory`
**And** Shopify API is not configured (returns 503)
**When** page attempts to fetch inventory data
**Then** page displays `<ShopifySetupPrompt />` with:
- Headline: "Connect Shopify stores to sync inventory"
- Benefits: "Real-time stock levels, multi-store allocation, automated reorder points"
- Setup steps:
  1. Create Shopify custom app for each store (UK, EU, USA)
  2. Generate Admin API access tokens
  3. Add environment variables:
     - `SHOPIFY_UK_STORE_DOMAIN`, `SHOPIFY_UK_ACCESS_TOKEN`
     - `SHOPIFY_EU_STORE_DOMAIN`, `SHOPIFY_EU_ACCESS_TOKEN`
     - `SHOPIFY_USA_STORE_DOMAIN`, `SHOPIFY_USA_ACCESS_TOKEN`
  4. Restart application
- **Admin users**: See full setup instructions with multi-store guidance
- **Non-admin users**: See "Contact your administrator to configure Shopify integration"
- Action: "View Shopify Setup Guide"

**Status**: ⏳ PENDING

---

### AC4: Production Dashboard Shows Unleashed Setup Prompt
**Given** user navigates to `/production`
**And** Unleashed ERP API is not configured (returns 503)
**When** page attempts to fetch production data
**Then** page displays `<UnleashedSetupPrompt />` with:
- Headline: "Connect Unleashed ERP for production tracking"
- Benefits: "Assembly job monitoring, real-time stock, quality alerts, production schedules"
- Setup steps:
  1. Log into Unleashed account
  2. Navigate to Integration → API Access
  3. Generate API key and ID
  4. Add environment variables: `UNLEASHED_API_ID`, `UNLEASHED_API_KEY`
  5. Restart application
- **Admin users**: See full setup instructions
- **Non-admin users**: See "Contact your administrator to configure Unleashed ERP integration"
- Action: "View Unleashed Setup Guide"

**Status**: ⏳ PENDING

---

### AC5: Financial Reports Show Amazon Setup Prompt
**Given** user navigates to `/reports/financial`
**And** Amazon SP-API is not configured (returns 503)
**When** page attempts to fetch Amazon sales data
**Then** page displays `<AmazonSetupPrompt />` with:
- Headline: "Connect Amazon SP-API for FBA insights"
- Benefits: "FBA inventory tracking, order metrics, multi-channel revenue analysis"
- Setup steps:
  1. Register as Amazon SP-API developer
  2. Create application and request access
  3. Generate LWA (Login with Amazon) credentials
  4. Add environment variables:
     - `AMAZON_SP_CLIENT_ID`, `AMAZON_SP_CLIENT_SECRET`
     - `AMAZON_SP_REFRESH_TOKEN`, `AMAZON_SP_MARKETPLACE_ID`
  5. Restart application
- **Admin users**: See full setup instructions with OAuth flow guidance
- **Non-admin users**: See "Contact your administrator to configure Amazon SP-API integration"
- Action: "View Amazon SP-API Setup Guide"

**Status**: ⏳ PENDING

---

### AC6: Widget-Level Setup Prompts (Compact)
**Given** a dashboard widget requires an unconfigured integration
**When** widget attempts to fetch data and receives 503
**Then** widget displays **compact setup prompt** with:
- Integration logo/icon
- Short message: "Configure [Integration] to view this data"
- "Setup Guide" button (opens modal or navigates to setup page)
- **Admin users**: Button opens setup instructions modal
- **Non-admin users**: Button shows "Contact admin" message
- Widget maintains its card layout (no full-page takeover)

**Example**: Working Capital Widget on dashboard shows compact Xero setup prompt

**Status**: ⏳ PENDING

---

## Technical Context

### Files to Create

**Setup Prompt Components**:
```
src/components/setup/
├── XeroSetupPrompt.jsx           # Xero integration setup
├── ShopifySetupPrompt.jsx        # Shopify multi-store setup
├── AmazonSetupPrompt.jsx         # Amazon SP-API setup
├── UnleashedSetupPrompt.jsx      # Unleashed ERP setup
├── GenericSetupPrompt.jsx        # Fallback for unknown integrations
├── SetupPromptCard.jsx           # Shared card component (for widgets)
├── SetupPromptPage.jsx           # Shared full-page component
└── index.js                      # Export all setup components
```

**Example Implementation** (`XeroSetupPrompt.jsx`):
```jsx
import React from 'react'
import { useAuthRole } from '@/hooks/useAuthRole'
import SetupPromptPage from './SetupPromptPage'

export default function XeroSetupPrompt({ compact = false }) {
  const { isAdmin } = useAuthRole()

  const setupSteps = [
    {
      title: 'Create Xero App',
      description: 'Go to developer.xero.com and create a new app',
      link: 'https://developer.xero.com/app/manage'
    },
    {
      title: 'Generate OAuth 2.0 Credentials',
      description: 'Create OAuth 2.0 credentials and copy Client ID & Secret'
    },
    {
      title: 'Find Tenant ID',
      description: 'Use Xero API to retrieve your organization\'s Tenant ID'
    },
    {
      title: 'Add Environment Variables',
      code: `XERO_CLIENT_ID=your_client_id
XERO_CLIENT_SECRET=your_client_secret
XERO_TENANT_ID=your_tenant_id`
    },
    {
      title: 'Restart Application',
      description: 'Restart the server to apply configuration'
    }
  ]

  if (!isAdmin && compact) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-900">Xero Not Configured</h4>
            <p className="text-sm text-blue-700 mt-1">
              Contact your administrator to configure Xero integration.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SetupPromptPage
      integration="Xero"
      icon="/integrations/xero-logo.svg"
      headline="Connect Xero to unlock Working Capital insights"
      benefits={[
        'Real-time accounts receivable and payable tracking',
        'Optimize cash flow with payment cycle analysis',
        'Automated working capital calculations'
      ]}
      steps={setupSteps}
      docsLink="/docs/integrations/xero"
      compact={compact}
      showAdminOnly={!isAdmin}
    />
  )
}
```

**Shared SetupPromptPage Component**:
```jsx
import React from 'react'

export default function SetupPromptPage({
  integration,
  icon,
  headline,
  benefits,
  steps,
  docsLink,
  compact = false,
  showAdminOnly = false
}) {
  if (showAdminOnly) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
          {integration} Integration Required
        </h3>
        <p className="text-yellow-700">
          Contact your administrator to configure {integration}.
        </p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <img src={icon} alt={integration} className="w-12 h-12 mx-auto mb-3" />
        <h4 className="font-semibold text-gray-900 mb-2">{headline}</h4>
        <p className="text-sm text-gray-600 mb-4">
          Configure {integration} to view this data
        </p>
        <a
          href={docsLink}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Setup Guide
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <img src={icon} alt={integration} className="w-20 h-20 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{headline}</h1>
        <div className="flex justify-center gap-4 text-sm text-gray-600">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {benefit}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-xl font-semibold mb-6">Setup Instructions</h2>
        <ol className="space-y-6">
          {steps.map((step, i) => (
            <li key={i} className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">
                {i + 1}
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-gray-600 mb-2">{step.description}</p>
                {step.link && (
                  <a href={step.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    {step.link}
                  </a>
                )}
                {step.code && (
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm font-mono mt-2 overflow-x-auto">
                    {step.code}
                  </pre>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
          <a
            href={docsLink}
            className="text-blue-600 hover:underline"
          >
            View Full Documentation
          </a>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Test Connection
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Files to Modify

**Pages to Integrate Setup Prompts**:

**`src/pages/WorkingCapital.jsx`** - Detect 503 from Xero:
```jsx
import XeroSetupPrompt from '@/components/setup/XeroSetupPrompt'

export default function WorkingCapital() {
  const { data, error, isLoading } = useWorkingCapitalData()

  if (error?.status === 503 && error?.integration === 'xero') {
    return <XeroSetupPrompt />
  }

  // ... rest of component
}
```

**`src/pages/inventory/InventoryManagement.jsx`** - Detect 503 from Shopify:
```jsx
import ShopifySetupPrompt from '@/components/setup/ShopifySetupPrompt'

export default function InventoryManagement() {
  const { data, error, isLoading } = useInventoryData()

  if (error?.status === 503 && error?.integration === 'shopify') {
    return <ShopifySetupPrompt />
  }

  // ... rest of component
}
```

**`src/pages/production/ProductionDashboard.jsx`** - Detect 503 from Unleashed:
```jsx
import UnleashedSetupPrompt from '@/components/setup/UnleashedSetupPrompt'

export default function ProductionDashboard() {
  const { data, error, isLoading } = useProductionData()

  if (error?.status === 503 && error?.integration === 'unleashed') {
    return <UnleashedSetupPrompt />
  }

  // ... rest of component
}
```

**`src/pages/reports/FinancialReports.jsx`** - Detect 503 from Amazon:
```jsx
import AmazonSetupPrompt from '@/components/setup/AmazonSetupPrompt'

export default function FinancialReports() {
  const { data, error, isLoading } = useFinancialReports()

  if (error?.status === 503 && error?.integration === 'amazon') {
    return <AmazonSetupPrompt />
  }

  // ... rest of component
}
```

**Widget-Level Integration**:

**`src/components/widgets/WorkingCapitalWidget.jsx`** - Compact setup prompt:
```jsx
import XeroSetupPrompt from '@/components/setup/XeroSetupPrompt'

export default function WorkingCapitalWidget() {
  const { data, error, isLoading } = useWorkingCapitalData()

  if (error?.status === 503 && error?.integration === 'xero') {
    return <XeroSetupPrompt compact={true} />
  }

  // ... rest of widget
}
```

### API Response Detection

**Update fetch utilities** to parse 503 responses:

**`src/services/api.js`** - Extract setup instructions from 503:
```javascript
export async function fetchWithSetupDetection(url, options) {
  const response = await fetch(url, options)

  if (response.status === 503) {
    const body = await response.json()
    throw {
      status: 503,
      integration: body.integration, // e.g., 'xero', 'shopify'
      message: body.message,
      setupSteps: body.setupSteps,
      requiredEnvVars: body.requiredEnvVars
    }
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.json()
}
```

### Integration Logos/Icons

**Add integration logos** to `public/integrations/`:
- `xero-logo.svg`
- `shopify-logo.svg`
- `amazon-logo.svg`
- `unleashed-logo.svg`

(Use official brand assets or create simple icon versions)

---

## Testing Requirements

### Manual Testing Checklist

- [ ] **Xero Setup Prompt**: Navigate to `/working-capital` without Xero configured, verify prompt displays
- [ ] **Shopify Setup Prompt**: Navigate to `/inventory` without Shopify configured, verify prompt displays
- [ ] **Amazon Setup Prompt**: Navigate to `/reports/financial` without Amazon configured, verify prompt displays
- [ ] **Unleashed Setup Prompt**: Navigate to `/production` without Unleashed configured, verify prompt displays
- [ ] **RBAC**: Non-admin users see "Contact admin" message, not full setup steps
- [ ] **Compact Mode**: Widgets show compact setup prompts, not full-page takeovers
- [ ] **Documentation Links**: "View Setup Guide" links work and open correct docs

### Test Scenarios

**Test 1: Admin User Sees Full Setup Instructions**
1. Log in as admin user
2. Ensure Xero is not configured (remove `XERO_CLIENT_ID` env var)
3. Navigate to `/working-capital`
4. **Expected**: Full XeroSetupPrompt with 5 setup steps displayed
5. Verify "View Full Documentation" link works
6. Verify environment variable code block displays correctly

**Test 2: Non-Admin User Sees Contact Message**
1. Log in as non-admin user (viewer or operator role)
2. Navigate to `/working-capital`
3. **Expected**: "Contact your administrator to configure Xero integration" message
4. **Expected**: No setup steps visible
5. Verify professional, non-technical messaging

**Test 3: Widget Compact Mode**
1. Add Working Capital Widget to dashboard
2. Ensure Xero not configured
3. Navigate to `/dashboard`
4. **Expected**: Widget shows compact setup prompt (not full-page)
5. **Expected**: Other widgets load normally
6. Click "Setup Guide" button
7. **Expected**: Opens setup instructions (modal or navigates to page)

**Test 4: Multiple Integrations Unconfigured**
1. Remove all integration env vars (Xero, Shopify, Amazon, Unleashed)
2. Navigate to dashboard with multiple widgets
3. **Expected**: Each widget shows its respective setup prompt
4. **Expected**: No crashes or conflicts between prompts
5. Navigate to each full page (`/working-capital`, `/inventory`, `/production`)
6. **Expected**: Appropriate setup prompt for each page

**Test 5: Setup Instructions Accuracy**
1. Follow Xero setup instructions exactly as written in prompt
2. Add environment variables to Render dashboard
3. Restart application
4. Navigate to `/working-capital`
5. **Expected**: Xero data loads successfully (no more setup prompt)
6. Repeat for Shopify, Amazon, Unleashed

---

## Implementation Plan

### Phase 1: Shared Components (2-3 hours)
1. Create `src/components/setup/` directory
2. Implement `SetupPromptPage.jsx` (shared full-page component)
3. Implement `SetupPromptCard.jsx` (shared compact component)
4. Add integration logos to `public/integrations/`
5. Test shared components in isolation

### Phase 2: Integration-Specific Prompts (2-3 hours)
1. Implement `XeroSetupPrompt.jsx` with real setup steps
2. Implement `ShopifySetupPrompt.jsx` with multi-store guidance
3. Implement `AmazonSetupPrompt.jsx` with OAuth flow steps
4. Implement `UnleashedSetupPrompt.jsx` with HMAC auth steps
5. Implement `GenericSetupPrompt.jsx` as fallback
6. Test each prompt component

### Phase 3: Page Integration (1-2 hours)
1. Update `WorkingCapital.jsx` to detect 503 and show XeroSetupPrompt
2. Update `InventoryManagement.jsx` for ShopifySetupPrompt
3. Update `ProductionDashboard.jsx` for UnleashedSetupPrompt
4. Update `FinancialReports.jsx` for AmazonSetupPrompt
5. Test each page with missing integration config

### Phase 4: Widget Integration (1-2 hours)
1. Update `WorkingCapitalWidget.jsx` with compact XeroSetupPrompt
2. Update `InventorySummaryWidget.jsx` with compact ShopifySetupPrompt
3. Update other relevant widgets
4. Test compact mode on dashboard

### Phase 5: RBAC & Testing (1 hour)
1. Test with admin user (sees full instructions)
2. Test with non-admin user (sees contact message)
3. Verify all "View Documentation" links work
4. Cross-browser testing
5. Final QA review

---

## Definition of Done

- [ ] ✅ All 5 setup prompt components created (Xero, Shopify, Amazon, Unleashed, Generic)
- [ ] ✅ Shared SetupPromptPage and SetupPromptCard components created
- [ ] ✅ All 4 main pages integrate setup prompts (Working Capital, Inventory, Production, Financial Reports)
- [ ] ✅ All relevant widgets show compact setup prompts
- [ ] ✅ RBAC implemented: admins see instructions, users see "contact admin"
- [ ] ✅ Integration logos added to public/integrations/
- [ ] ✅ API fetch utilities detect 503 and extract setup instructions
- [ ] ✅ Setup instructions tested and verified accurate
- [ ] ✅ Documentation links functional
- [ ] ✅ Zero ESLint warnings introduced
- [ ] ✅ Code reviewed and approved
- [ ] ✅ Committed to `development` branch with descriptive message
- [ ] ✅ Deployed to Render development environment and verified

---

## Related Stories

- **BMAD-MOCK-009** (API Fallback Strategy): Backend foundation for setup prompts
- **BMAD-UX-001** (Loading Skeletons): Different state - loading vs unconfigured
- **BMAD-UX-002** (Error Boundaries): Different state - error vs setup required
- **BMAD-UX-005** (Accessibility Audit): Ensure setup prompts are accessible

---

## Notes

**Business Impact**:
- **Reduces Time-to-Value**: Users can configure integrations in 5-10 minutes vs hours waiting for support
- **Increases Adoption**: Clear setup path increases likelihood of successful onboarding
- **Reduces Support Load**: Self-service setup eliminates most integration support tickets
- **Professional Polish**: Transforms "broken" experience into guided onboarding

**UX Best Practices**:
- **Progressive Disclosure**: Compact mode for widgets, full mode for pages
- **Role-Based Messaging**: Admins get actionable steps, users get "contact admin"
- **Visual Hierarchy**: Step numbers, icons, code blocks make instructions scannable
- **Actionable CTAs**: "View Documentation", "Test Connection", "Contact Support"

**Content Strategy**:
- **Benefit-Driven Headlines**: "Unlock working capital insights" not "Configure Xero"
- **Non-Technical Language**: "Connect" not "Integrate API endpoint"
- **Step-by-Step Clarity**: Numbered steps with clear actions
- **Code Examples**: Copy-paste ready environment variables

**Design References**:
- **Stripe**: Excellent API setup prompts with code examples
- **Vercel**: Integration setup wizards with step-by-step guidance
- **Linear**: "Connect GitHub" prompts with RBAC (admins vs users)
- **Notion**: Integration cards with benefits and setup CTAs

---

**Story Created**: 2025-10-19
**Last Updated**: 2025-10-19
**BMAD-METHOD Phase**: Planning (Phase 2)
