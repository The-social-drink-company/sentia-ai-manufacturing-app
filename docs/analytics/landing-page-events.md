# Landing Page Analytics Events

| Event Name                       | Trigger                                | Properties                                                                                |
|----------------------------------|----------------------------------------|-------------------------------------------------------------------------------------------|
| `landing_hero_viewed`            | Hero section enters viewport (40%+)    | `variant`, `viewportWidth`, `referrer`, `userStatus`                                      |
| `landing_primary_cta_clicked`    | Primary CTA button click (hero/footer) | `variant`, `triggerLocation` (`hero` \| `footer`), `userStatus`                           |
| `landing_secondary_cta_clicked`  | Secondary CTA (Learn More)             | `variant`, `targetSection`                                                                |
| `landing_signin_modal_opened`    | Clerk modal opened from landing page   | `variant`, `triggerLocation` (`hero` \| `footer`), `userStatus`                           |

## Consent & Gating
- Analytics only fires when `VITE_ENABLE_ANALYTICS=true` *and* `window.__sentiaConsent.analytics === true`.
- In development mode, debug logs show when analytics is disabled or consent is denied.

## Environment Variables
```
VITE_ENABLE_ANALYTICS=false
VITE_ANALYTICS_ENDPOINT=
```

Set `VITE_ANALYTICS_ENDPOINT` to the serverless endpoint (Segment, RudderStack, internal ingestion). When unset, events fall back to console logs in dev.

## QA Checklist
1. Enable analytics and consent; verify events appear in DevTools > Network (keepalive POST) or Segment debugger.
2. Disable `VITE_ENABLE_ANALYTICS` and reload; ensure no network activity occurs.
3. Toggle consent off (`window.__sentiaConsent = { analytics: false }`); ensure events stop firing.
4. Confirm hero event fires only once per session per page load.
5. Validate CTA clicks on mobile (touch) and keyboard navigation.
