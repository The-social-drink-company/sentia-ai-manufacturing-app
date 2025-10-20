# Trial Countdown Integration Guide

**Epic**: EPIC-TRIAL-001 - Trial Automation System
**Date**: October 20, 2025
**Status**: ✅ Backend Complete, ⏳ Dashboard Integration Pending
**Author**: BMAD Agent (Autonomous)

---

## Integration Status

**✅ COMPLETE**:
- useTrial custom hook created and ready ([src/hooks/useTrial.ts](../../src/hooks/useTrial.ts))
- TrialCountdown component verified production-ready ([src/components/trial/TrialCountdown.tsx](../../src/components/trial/TrialCountdown.tsx))
- Backend trial APIs operational
- Email automation system deployed

**⏳ PENDING**:
- Dashboard integration (deferred due to active linter reformatting [DashboardEnterprise.jsx](../../src/pages/DashboardEnterprise.jsx))

---

## Quick Start (When File is Stable)

### Step 1: Add Imports

Add these imports to the top of `DashboardEnterprise.jsx`:

```javascript
import { useTrial } from '@/hooks/useTrial'
import TrialCountdown from '@/components/trial/TrialCountdown'
```

### Step 2: Initialize Hook

Add the hook inside the `DashboardEnterprise` component:

```javascript
const DashboardEnterprise = () => {
  // ... existing hooks ...

  // Add trial hook
  const { trial, isInTrial, daysRemaining } = useTrial()

  // ... rest of component ...
}
```

### Step 3: Add Countdown Banner

Insert the countdown banner after the header section (around line 2500):

```jsx
      </header>

      {/* Trial Countdown Banner */}
      {isInTrial && trial && (
        <TrialCountdown
          trialEndDate={trial.trialEndDate}
          tier={trial.subscriptionTier}
          onAddPayment={() => window.location.href = '/billing'}
        />
      )}

      {/* Capital Position - New KPI Grid */}
```

---

## Complete Integration Code

### Full Integration Example

```javascript
// File: src/pages/DashboardEnterprise.jsx

import { Suspense, lazy, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useXero } from '@/contexts/useXero'
import { useSSE } from '@/hooks/useSSE'
import { useIntegrationStatus } from '@/hooks/useIntegrationStatus'
import KPIGrid from '@/components/dashboard/KPIGrid'
import WorkingCapitalCard from '@/components/dashboard/WorkingCapitalCard'
import ShopifySetupPrompt from '@/components/integrations/ShopifySetupPrompt'
import ProductTour, { useProductTour } from '@/components/onboarding/ProductTour'
import Confetti from 'react-confetti'
import { useWindowSize } from '@/hooks/useWindowSize'

// ⬇️ ADD THESE IMPORTS
import { useTrial } from '@/hooks/useTrial'
import TrialCountdown from '@/components/trial/TrialCountdown'

// ... rest of imports ...

const DashboardEnterprise = () => {
  // ... existing hooks ...

  // ⬇️ ADD TRIAL HOOK
  const { trial, isInTrial, daysRemaining, isUrgent } = useTrial()

  // ... rest of component logic ...

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header section */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        {/* ... header content ... */}
      </header>

      {/* ⬇️ ADD TRIAL COUNTDOWN BANNER */}
      {isInTrial && trial && (
        <TrialCountdown
          trialEndDate={trial.trialEndDate}
          tier={trial.subscriptionTier}
          onAddPayment={() => window.location.href = '/billing'}
        />
      )}

      {/* Rest of dashboard content */}
      <main className="max-w-[1920px] mx-auto p-6">
        {/* ... dashboard widgets ... */}
      </main>
    </div>
  )
}

export default DashboardEnterprise
```

---

## Testing Checklist

### Pre-Integration Tests

- [ ] Verify `useTrial` hook is working:
  ```javascript
  // Test in browser console
  import { useTrial } from '@/hooks/useTrial'
  const { trial, isInTrial } = useTrial()
  console.log('Trial status:', { trial, isInTrial })
  ```

- [ ] Verify TrialCountdown component renders:
  ```jsx
  // Test in isolation
  <TrialCountdown
    trialEndDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
    tier="professional"
    onAddPayment={() => console.log('Add payment clicked')}
  />
  ```

### Post-Integration Tests

- [ ] Dashboard loads without errors
- [ ] TrialCountdown appears for trial users
- [ ] TrialCountdown does NOT appear for paid users
- [ ] Countdown shows correct days remaining
- [ ] Color coding works (blue >7 days, yellow 4-7 days, red ≤3 days)
- [ ] "Add Payment" button navigates to /billing
- [ ] Dismiss button works (for non-urgent trials)
- [ ] Mobile responsive (test at 375px, 768px, 1024px)
- [ ] No console errors or warnings

---

## Troubleshooting

### Issue: TrialCountdown Not Appearing

**Possible Causes**:
1. User is not in trial (`isInTrial === false`)
2. Trial data not loaded (`trial === null`)
3. Hook not fetching data (check network tab)
4. Tenant slug not resolving correctly

**Debug Steps**:
```javascript
// Add temporary console.log in component
const { trial, isInTrial, daysRemaining } = useTrial()
console.log('Trial Debug:', { trial, isInTrial, daysRemaining })
```

### Issue: Countdown Shows Wrong Days

**Possible Causes**:
1. Backend trial data incorrect
2. Date calculation off (timezone issues)
3. Hook caching stale data

**Debug Steps**:
```javascript
// Check raw trial data from API
fetch('/api/trial/status', {
  headers: { 'X-Tenant-Slug': 'your-tenant' }
})
.then(r => r.json())
.then(console.log)
```

### Issue: Component Styling Broken

**Possible Causes**:
1. Tailwind CSS not loaded
2. Component expects different props
3. Z-index conflicts with header

**Fix**:
```jsx
{/* Add explicit z-index if needed */}
<div className="relative z-30">
  <TrialCountdown ... />
</div>
```

---

## Alternative Integration Locations

### Option 1: Sticky Top Banner (Recommended)
```jsx
{/* After header, before main content */}
<header>...</header>
{isInTrial && trial && <TrialCountdown ... />}
<main>...</main>
```

### Option 2: Inside Dashboard Header
```jsx
<header className="...">
  <div className="flex justify-between items-center">
    <h1>Dashboard</h1>
    {isInTrial && trial && (
      <TrialCountdown
        trialEndDate={trial.trialEndDate}
        tier={trial.subscriptionTier}
        onAddPayment={() => window.location.href = '/billing'}
      />
    )}
  </div>
</header>
```

### Option 3: Dashboard Widget
```jsx
<div className="grid grid-cols-12 gap-6">
  {isInTrial && trial && (
    <div className="col-span-12">
      <TrialCountdown ... />
    </div>
  )}
  {/* Other widgets */}
</div>
```

---

## API Reference

### `useTrial` Hook

**Returns**:
```typescript
{
  trial: {
    trialStartDate: Date
    trialEndDate: Date
    trialDaysRemaining: number
    subscriptionTier: 'starter' | 'professional' | 'enterprise'
    isInTrial: boolean
    gracePeriodEnd?: Date
  } | null
  isInTrial: boolean
  daysRemaining: number
  hasEnded: boolean
  isUrgent: boolean
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}
```

**Example Usage**:
```javascript
const { trial, isInTrial, daysRemaining, isUrgent } = useTrial()

if (isLoading) return <div>Loading...</div>
if (error) return <div>Error loading trial status</div>
if (!isInTrial) return null

return (
  <div>
    <p>Trial ends in {daysRemaining} days</p>
    {isUrgent && <p className="text-red-600">⚠️ Trial ending soon!</p>}
  </div>
)
```

### `TrialCountdown` Component

**Props**:
```typescript
interface TrialCountdownProps {
  trialEndDate: string | Date
  tier: 'starter' | 'professional' | 'enterprise'
  onAddPayment?: () => void
}
```

**Behavior**:
- Shows countdown with days, hours, minutes
- Color-codes by urgency:
  - Blue: >7 days remaining
  - Yellow: 4-7 days remaining
  - Red: ≤3 days remaining
- Dismissible if >3 days remaining
- Non-dismissible if ≤3 days (urgent)
- Displays tier name and upgrade CTA

---

## Related Documentation

- [EPIC-TRIAL-001 Retrospective](../retrospectives/2025-10-20-EPIC-TRIAL-001-trial-automation-complete.md)
- [useTrial Hook Source](../../src/hooks/useTrial.ts)
- [TrialCountdown Component Source](../../src/components/trial/TrialCountdown.tsx)
- [Trial Cron Workflow](../../.github/workflows/trial-expiration.yml)

---

## Deployment Notes

**Before Deploying**:
1. Ensure backend trial APIs are operational (`/api/trial/status`)
2. Verify tenant context resolves correctly
3. Test with multiple trial statuses (day 1, 7, 12, 14)
4. Confirm email automation is working

**After Deploying**:
1. Monitor for console errors
2. Check analytics for trial engagement
3. Track upgrade conversions
4. Gather user feedback on messaging

---

**Status**: ✅ **READY FOR INTEGRATION**
**Last Updated**: 2025-10-20
**Maintained By**: BMAD Agent
**Framework**: BMAD-METHOD v6-alpha