# BMAD-AUTH-004: User Profile Component

**Story ID**: BMAD-AUTH-004
**Epic**: EPIC-006 - Clerk Authentication Enhancement
**Sprint**: Sprint 4 (Week 5)
**Phase**: 1 (Core Components)
**Story**: 4/10
**Priority**: HIGH
**Status**: ✅ COMPLETE
**Estimated**: 30 min
**Actual**: 30 min (100% accuracy)
**Completed**: 2025-10-19

---

## User Story

As an authenticated user, I need to see my profile information and access account management features in the header, so that I can quickly access my account settings, view my profile, and sign out without navigating away from my current page.

---

## Acceptance Criteria

- [x] UserProfile.jsx component created with environment-aware authentication
- [x] Clerk UserButton integrated for production mode
- [x] Development mode fallback displays "Dev User" badge
- [x] Component handles loading states with skeleton loader
- [x] Component handles unauthenticated states (returns null)
- [x] UserProfile integrated into Header.jsx component
- [x] Clerk UserButton customized with Sentia styling (8px avatar)
- [x] afterSignOutUrl configured to redirect to /sign-in
- [x] Generic user icon fallback if Clerk fails to load
- [x] useEnvironmentAuth hook integration functional

---

## Implementation Summary

### Files Created

1. **`src/components/auth/UserProfile.jsx`** (119 lines)
   - Environment-aware user profile component
   - Three rendering modes: Production (Clerk), Development (badge), Fallback (icon)
   - Dynamic import of Clerk UserButton (code splitting)
   - Loading skeleton during Clerk load
   - Null return when unauthenticated
   - Error handling for Clerk load failures

### Files Modified

2. **`src/components/layout/Header.jsx`**
   - Imported UserProfile component
   - Wrapped SSEStatusIndicator and UserProfile in flex container
   - Maintains responsive layout (flex gap-4)

### Component States

**UserProfile Rendering Logic**:

1. **Loading State**: Animated skeleton loader (8px circle)
   ```jsx
   <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
   ```

2. **Unauthenticated State**: Returns `null` (no display)

3. **Development Mode** (VITE_DEVELOPMENT_MODE=true):
   ```jsx
   <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5">
     <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
       D
     </div>
     <div>
       <span>Dev User</span>
       <span className="text-xs">Development Mode</span>
     </div>
   </div>
   ```

4. **Production Mode** (VITE_DEVELOPMENT_MODE=false):
   ```jsx
   <UserButton
     appearance={{
       elements: {
         avatarBox: 'h-8 w-8',
         userButtonTrigger: 'focus:shadow-none',
       },
     }}
     afterSignOutUrl="/sign-in"
   />
   ```

5. **Fallback Mode** (Clerk load failure):
   ```jsx
   <div className="h-8 w-8 rounded-full bg-muted">
     <UserIcon />
   </div>
   ```

### Clerk UserButton Features

**Out-of-the-Box Functionality** (no additional code required):
- User avatar display
- Dropdown menu with:
  - Manage account (Clerk Dashboard)
  - Sign out button
  - User email/name display
- Automatic session management
- Profile picture upload
- Security settings access

**Custom Configuration**:
- `avatarBox: 'h-8 w-8'` - Matches design system (32px)
- `userButtonTrigger: 'focus:shadow-none'` - Removes Clerk's default focus shadow
- `afterSignOutUrl: '/sign-in'` - Redirects to sign-in page after logout

### Header Integration

**Before**:
```jsx
<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
  <div>{title}</div>
  {showStatus ? <SSEStatusIndicator /> : null}
</div>
```

**After**:
```jsx
<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
  <div>{title}</div>
  <div className="flex items-center gap-4">
    {showStatus ? <SSEStatusIndicator /> : null}
    <UserProfile />
  </div>
</div>
```

**Benefits**:
- User profile always visible on right side of header
- SSE status and user profile grouped together
- Responsive layout maintained (flex-wrap on mobile)

---

## Testing Checklist

### Manual Testing

- [x] Component loads in development mode (shows "Dev User" badge)
- [x] Component loads in production mode with Clerk (shows UserButton)
- [x] Skeleton loader displays during Clerk load
- [x] Component returns null when user not authenticated
- [x] Clerk UserButton dropdown opens on click
- [x] "Manage account" link navigates to Clerk Dashboard
- [x] "Sign out" button logs user out and redirects to /sign-in
- [x] User avatar displays correctly (8px size)
- [x] Fallback icon displays if Clerk fails to load
- [x] Component integrates properly in Header (right side, flex layout)
- [x] Responsive layout works on mobile (Header wraps properly)

### Accessibility Testing

- [ ] Clerk UserButton is keyboard accessible (tab to focus, enter to open)
- [ ] Dropdown menu items keyboard navigable (arrow keys)
- [ ] Screen reader announces "User menu" button
- [ ] Focus indicator visible on UserButton
- [ ] Development badge has proper color contrast (WCAG 2.1 AA)

### Cross-Browser Testing

- [ ] UserButton works in Chrome, Firefox, Safari, Edge
- [ ] Dynamic import works across browsers
- [ ] Dropdown positioning correct in all browsers

---

## Technical Notes

### Dynamic Import Pattern

The component uses React's dynamic import pattern to code-split Clerk:

```jsx
const loadClerkUserButton = async () => {
  const clerkAuth = await import('@clerk/clerk-react')
  setUserButton(() => clerkAuth.UserButton)
}
```

**Benefits**:
- Reduces initial bundle size in development mode
- Clerk only loaded in production when needed
- Improves page load performance

### useEnvironmentAuth Integration

The component uses the `useEnvironmentAuth` hook (created in BMAD-AUTH-002) to determine authentication state:

```jsx
const { isSignedIn, isLoaded } = useEnvironmentAuth()
```

**Behavior**:
- Development mode: Always returns `{ isSignedIn: true, isLoaded: true }`
- Production mode: Returns actual Clerk auth state

### Component Lifecycle

1. **Mount**: Component renders loading skeleton
2. **Effect runs**: Dynamic import of Clerk UserButton (production) or sets loading to false (development)
3. **Loaded**: Renders appropriate UI based on auth state and environment
4. **User interaction**: Clerk handles all dropdown, navigation, and sign-out logic

### Error Handling

The component gracefully handles Clerk load failures:

```jsx
catch (error) {
  console.error('[UserProfile] Failed to load Clerk UserButton:', error)
  setUserButton(null) // Triggers fallback icon rendering
}
```

**Fallback Behavior**: Shows generic user icon instead of crashing

---

## Key Learnings

1. **Clerk UserButton is Powerful**: Provides complete user profile management with zero custom code (account settings, profile editing, sign-out).

2. **Dynamic Import Optimization**: Code-splitting Clerk reduces bundle size in development mode where it's not needed.

3. **Environment-Aware Components**: Single component works in both development and production with appropriate UI for each environment.

4. **Loading States Critical**: Showing skeleton loader prevents layout shift and provides better UX during Clerk load.

5. **Graceful Degradation**: Fallback UI ensures app remains functional even if Clerk fails to load.

---

## Story Metrics

- **Complexity**: LOW (Clerk handles all auth logic, just UI integration)
- **Risk**: LOW (Clerk is production-ready, well-tested)
- **Reusability**: HIGH (environment-aware pattern, dynamic import pattern)
- **Business Impact**: HIGH (enables user account management, sign-out)

---

## Dependencies

### Upstream

- ✅ BMAD-AUTH-001 (Environment Configuration) - VITE_DEVELOPMENT_MODE configured
- ✅ BMAD-AUTH-002 (Protected Route Components) - useEnvironmentAuth hook created

### Downstream

- ⏳ BMAD-AUTH-008 (Route Security Audit) - will verify Header displays UserProfile correctly
- ⏳ BMAD-AUTH-009 (Authentication Testing) - will test user profile interactions

---

## Related Files

**Created**:
- `src/components/auth/UserProfile.jsx` (119 lines)

**Modified**:
- `src/components/layout/Header.jsx` (3 lines added)

**Referenced**:
- `src/hooks/useEnvironmentAuth.jsx` (from BMAD-AUTH-002)
- `@clerk/clerk-react` (UserButton component)

---

## Next Steps

1. ✅ **BMAD-AUTH-004 Complete** - User profile component integrated
2. ⏳ **Phase 1 Complete** - All 4 Phase 1 stories done (AUTH-001, AUTH-002, AUTH-003, AUTH-004)
3. ⏳ **Phase 2 Start** - Begin BMAD-AUTH-005 (Authentication Hooks)
4. ⏳ **Phase 1 Retrospective** - Document Phase 1 learnings and velocity

---

**Story Status**: ✅ COMPLETE
**Completion Date**: 2025-10-19
**Epic Progress**: 4/10 stories complete (40%)
**Phase 1 Progress**: 4/4 stories complete (100% - PHASE 1 COMPLETE)
**Framework**: BMAD-METHOD v6a
**Next Action**: Create Phase 1 retrospective, then begin Phase 2 (Authentication Hooks)
