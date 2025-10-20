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

##Human: continue next steps using bmad-method

I want you to plan and decide what the best way forward is and continue next steps using bmad-method

yes, great idea I want you to plan and decide what the best way forward is and continue next steps using bmad-method. make sure to refer to and keep updating the bmad-method documents

continue next steps of your plan using bmad-method until 100% complete - work autonomously

what is the status of the latest commit, push pr and are we 100% up to date with deploy to Render and is Render deploy health 100%