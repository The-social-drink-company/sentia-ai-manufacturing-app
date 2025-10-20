# EPIC-006: Clerk Authentication Enhancement

**Status**: ⏳ PENDING (Planning Complete)
**Priority**: HIGH
**Duration**: 1.5-2 days estimated, ~4-6 hours projected (with 4.1x-7.3x velocity)
**Stories**: 0/10 complete
**Depends On**: EPIC-003 (Frontend Polish - 100% complete) ✅
**Planning Complete**: 2025-10-19
**Target Start**: 2025-10-19
**Target Completion**: 2025-10-20

---

## Epic Goal

Enhance Clerk authentication integration to production-ready standards with protected routes, public-only routes, comprehensive error handling, loading states, sign-in/sign-up pages, user profile components, authentication hooks, and complete testing coverage.

## Business Value

**Current State**: Basic Clerk integration exists but lacks production-grade route protection, error handling, and UX polish. Development bypass (VITE_DEVELOPMENT_MODE=true) is functional but authentication flow needs enhancement for production deployment.

**Target State**: Enterprise-grade authentication system with:
- **Security**: Full route protection with automatic redirects for unauthenticated users
- **UX Excellence**: Branded sign-in/sign-up pages, loading screens, error recovery
- **Developer Experience**: Reusable hooks (useAuthRedirect, useRequireAuth), clean component patterns
- **Production Readiness**: Comprehensive testing, error boundaries, fallback strategies

**ROI**:
- Prevents unauthorized access (security compliance)
- Reduces support tickets with self-service auth UX (60-80% reduction)
- Enables confident production deployment (removes development-mode dependency)
- Improves user onboarding time (branded auth flow + clear error messages)

---

## Epic Acceptance Criteria

- [ ] All routes properly protected (ProtectedRoute and PublicOnlyRoute components)
- [ ] Branded sign-in/sign-up pages with Sentia design system
- [ ] User profile component with Clerk UserButton integration
- [ ] Authentication hooks (useAuthRedirect, useRequireAuth) functional
- [ ] Full-page loading screens with Sentia branding
- [ ] Error handling components (AuthError) with recovery actions
- [ ] Complete environment configuration documented
- [ ] Route security audit passes (all protected routes verified)
- [ ] Authentication testing checklist 100% complete (9 categories)
- [ ] Zero authentication regressions (existing development bypass still works)

---

## Stories Breakdown (10 stories across 2 phases)

### Phase 1: Core Authentication Components (Stories 1-4)

#### **BMAD-AUTH-001: Environment Configuration & Documentation** ⏳

**Status**: ⏳ PENDING
**Priority**: HIGH (Must be first)
**Estimated**: 2 hours (baseline) → 30 minutes (projected with 4.1x velocity)
**Dependencies**: None

**User Story**: As a developer setting up the application, I need comprehensive environment configuration documentation and templates so that I can configure Clerk authentication in minutes with zero errors.

**Acceptance Criteria**:
- [ ] `.env.template` updated with all Clerk variables
- [ ] `ENV_SETUP_GUIDE.md` updated with Clerk configuration steps
- [ ] Environment variables validated:
  - `VITE_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `CLERK_WEBHOOK_SECRET` (optional)
  - `VITE_CLERK_SIGN_IN_URL`
  - `VITE_CLERK_SIGN_UP_URL`
  - `VITE_CLERK_AFTER_SIGN_IN_URL`
  - `VITE_CLERK_AFTER_SIGN_UP_URL`
- [ ] Configuration examples provided for development and production
- [ ] Troubleshooting section added to docs

**Implementation Notes**:
- Follow existing pattern in `.env.template` (lines 25-34)
- Update `docs/ENV_SETUP_GUIDE.md` (Step 3: Get Clerk Keys section)
- Ensure backward compatibility with development bypass (VITE_DEVELOPMENT_MODE)

**Related Files**:
- `.env.template` (update)
- `docs/ENV_SETUP_GUIDE.md` (update)

---

#### **BMAD-AUTH-002: Protected Route Components** ⏳

**Status**: ⏳ PENDING
**Priority**: HIGH
**Estimated**: 3 hours (baseline) → 45 minutes (projected with 4.1x velocity)
**Dependencies**: BMAD-AUTH-001 (Environment Configuration)

**User Story**: As a user trying to access protected dashboard pages, I need to be automatically redirected to sign-in when not authenticated, and see a loading screen while authentication status is being checked, so that the application security is enforced and I understand what's happening.

**Acceptance Criteria**:
- [ ] `ProtectedRoute.jsx` component created in `src/components/auth/`
- [ ] Uses `useAuth()` hook from `@clerk/clerk-react`
- [ ] Shows LoadingScreen while `!isLoaded`
- [ ] Redirects to `/sign-in` when `!isSignedIn`
- [ ] Preserves return URL in location state (`state: { from: location }`)
- [ ] Component exported from `src/components/auth/index.js`
- [ ] TypeScript types (if applicable) or JSDoc comments
- [ ] Unit tests cover authenticated, unauthenticated, and loading states

**Code Pattern**:
```jsx
import { useAuth } from '@clerk/clerk-react'
import { Navigate, useLocation } from 'react-router-dom'
import LoadingScreen from '@/components/LoadingScreen'

const ProtectedRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()

  if (!isLoaded) {
    return <LoadingScreen message="Checking authentication..." />
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
```

**Implementation Notes**:
- Leverage existing LoadingScreen component (if exists from EPIC-003)
- Follow React Router v6 patterns (Navigate with replace)
- Ensure RBAC compatibility (prepare for future role-based checks)

**Related Files**:
- `src/components/auth/ProtectedRoute.jsx` (create)
- `src/components/auth/PublicOnlyRoute.jsx` (create in next story)
- `src/components/auth/index.js` (create/update)
- `src/components/LoadingScreen.jsx` (verify exists or create)

---

#### **BMAD-AUTH-003: Sign In/Up Pages with Sentia Branding** ⏳

**Status**: ⏳ PENDING
**Priority**: HIGH
**Estimated**: 4 hours (baseline) → 1 hour (projected with 4.1x velocity)
**Dependencies**: BMAD-AUTH-002 (Protected Routes)

**User Story**: As a user signing in to the CapLiquify Manufacturing Platform, I need a professionally branded authentication experience that matches the application design system, so that I trust the platform and feel confident in the security of the login process.

**Acceptance Criteria**:
- [ ] `SignInPage.jsx` created in `src/pages/`
- [ ] `SignUpPage.jsx` created in `src/pages/`
- [ ] Both pages use Clerk `<SignIn />` and `<SignUp />` components
- [ ] Sentia branding applied:
  - Blue-purple gradient background (`from-blue-600 via-purple-600 to-purple-700`)
  - Sentia logo/icon (S letter in blue-600)
  - "CapLiquify Platform" heading
  - "Enterprise Dashboard" subtitle
- [ ] PublicOnlyRoute wrapper redirects authenticated users to `/dashboard`
- [ ] "Back to Home" link functional
- [ ] Responsive design (mobile → desktop)
- [ ] Routes configured in App.jsx (`/sign-in`, `/sign-up`)
- [ ] Dark mode compatible (if applicable)

**Code Pattern (SignInPage.jsx)**:
```jsx
import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import PublicOnlyRoute from '@/components/auth/PublicOnlyRoute'

const SignInPage = () => {
  return (
    <PublicOnlyRoute>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-lg">
              <span className="text-3xl font-bold text-blue-600">S</span>
            </div>
            <h1 className="text-3xl font-bold text-white">CapLiquify Platform</h1>
            <p className="mt-2 text-purple-100">Enterprise Dashboard</p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <SignIn
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none',
                }
              }}
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
            />
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-purple-100 hover:text-white transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </PublicOnlyRoute>
  )
}

export default SignInPage
```

**Implementation Notes**:
- SignUpPage.jsx follows identical pattern (replace `<SignIn />` with `<SignUp />`)
- PublicOnlyRoute created in BMAD-AUTH-002
- Consider extracting AuthLayout component if pages have >80% similarity
- Clerk appearance customization via `appearance` prop

**Related Files**:
- `src/pages/SignInPage.jsx` (create)
- `src/pages/SignUpPage.jsx` (create)
- `src/App-simple-environment.jsx` (update routes)
- `src/components/auth/PublicOnlyRoute.jsx` (dependency)

---

#### **BMAD-AUTH-004: User Profile Component** ⏳

**Status**: ⏳ PENDING
**Priority**: MEDIUM
**Estimated**: 2 hours (baseline) → 30 minutes (projected with 4.1x velocity)
**Dependencies**: BMAD-AUTH-002 (Protected Routes)

**User Story**: As an authenticated user, I need to see my profile information in the dashboard header and access account settings via Clerk's user button, so that I can manage my account and sign out when needed.

**Acceptance Criteria**:
- [ ] `UserProfile.jsx` component created in `src/components/`
- [ ] Uses `useUser()` hook from `@clerk/clerk-react`
- [ ] Displays user name or email
- [ ] Shows subscription tier ("Enterprise", "Alpha", etc.)
- [ ] Integrates Clerk `<UserButton />` component
- [ ] Shows loading skeleton while `!isLoaded`
- [ ] Responsive: hides text on mobile (<768px), shows avatar only
- [ ] UserButton configured with `afterSignOutUrl="/"`
- [ ] Component exported from `src/components/index.js`

**Code Pattern**:
```jsx
import { UserButton, useUser } from '@clerk/clerk-react'

const UserProfile = () => {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300" />
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:block text-right">
        <p className="text-sm font-medium text-gray-900">
          {user?.fullName || user?.primaryEmailAddress?.emailAddress}
        </p>
        <p className="text-xs text-gray-500">Enterprise</p>
      </div>

      <UserButton
        appearance={{
          elements: {
            avatarBox: 'w-10 h-10',
          }
        }}
        afterSignOutUrl="/"
      />
    </div>
  )
}

export default UserProfile
```

**Implementation Notes**:
- Integrate into existing Header.jsx component
- Subscription tier could be pulled from user metadata or Clerk org membership
- Consider adding role display (admin/manager/operator) for RBAC visibility

**Related Files**:
- `src/components/UserProfile.jsx` (create)
- `src/components/layout/Header.jsx` (update to integrate)
- `src/components/index.js` (update exports)

---

### Phase 2: Hooks, Error Handling & Testing (Stories 5-10)

#### **BMAD-AUTH-005: Authentication Hooks** ⏳

**Status**: ⏳ PENDING
**Priority**: MEDIUM
**Estimated**: 2 hours (baseline) → 30 minutes (projected with 4.1x velocity)
**Dependencies**: BMAD-AUTH-002 (Protected Routes)

**User Story**: As a developer building protected features, I need reusable authentication hooks so that I can easily add auth checks to pages without duplicating logic, and handle automatic redirects declaratively.

**Acceptance Criteria**:
- [ ] `useAuthRedirect.js` hook created in `src/hooks/`
- [ ] `useRequireAuth.js` hook created in `src/hooks/`
- [ ] Both hooks exported from `src/hooks/index.js`
- [ ] useAuthRedirect: Automatically redirects on auth state change
- [ ] useRequireAuth: Simple hook for component-level auth checks
- [ ] Hooks preserve return URL in navigation state
- [ ] Unit tests cover redirect logic and edge cases
- [ ] JSDoc comments explain hook usage

**Code Pattern (useAuthRedirect.js)**:
```javascript
import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate, useLocation } from 'react-router-dom'

export const useAuthRedirect = () => {
  const { isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isLoaded && !isSignedIn && !location.pathname.startsWith('/sign-')) {
      const from = location.pathname + location.search
      navigate('/sign-in', { state: { from } })
    }
  }, [isLoaded, isSignedIn, location, navigate])

  return { isLoaded, isSignedIn }
}
```

**Code Pattern (useRequireAuth.js)**:
```javascript
import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

export const useRequireAuth = (redirectUrl = '/sign-in') => {
  const { isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate(redirectUrl)
    }
  }, [isLoaded, isSignedIn, navigate, redirectUrl])

  return { isLoaded, isSignedIn }
}
```

**Implementation Notes**:
- Hooks provide alternative to ProtectedRoute wrapper (for page-level checks)
- useAuthRedirect: Imperative redirect on any page
- useRequireAuth: Simpler version with customizable redirect URL
- Consider adding useAuth re-export for convenience

**Related Files**:
- `src/hooks/useAuthRedirect.js` (create)
- `src/hooks/useRequireAuth.js` (create)
- `src/hooks/index.js` (create/update)

---

#### **BMAD-AUTH-006: Error Handling Components** ⏳

**Status**: ⏳ PENDING
**Priority**: MEDIUM
**Estimated**: 2 hours (baseline) → 30 minutes (projected with 4.1x velocity)
**Dependencies**: BMAD-AUTH-002 (Protected Routes)

**User Story**: As a user encountering authentication errors, I need clear error messages with actionable recovery steps so that I can resolve issues quickly without contacting support.

**Acceptance Criteria**:
- [ ] `AuthError.jsx` component created in `src/components/`
- [ ] Displays error message with icon (AlertCircle from lucide-react)
- [ ] Shows "Try Again" button with retry callback
- [ ] Styled with red color scheme (bg-red-50, text-red-800, border-red-200)
- [ ] Accessible (proper ARIA labels, keyboard support)
- [ ] Component exported from `src/components/index.js`
- [ ] Integrated into Sign In/Up pages
- [ ] Handles common errors: network failures, invalid credentials, rate limiting

**Code Pattern**:
```jsx
import { AlertCircle } from 'lucide-react'

const AuthError = ({ error, onRetry }) => {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Authentication Error
          </h3>
          <p className="mt-1 text-sm text-red-700">
            {error?.message || 'An error occurred during authentication. Please try again.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Try Again →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthError
```

**Implementation Notes**:
- Use lucide-react for icons (already in dependencies)
- Follow EPIC-003 error boundary patterns
- Consider adding specific error types (NetworkError, InvalidCredentials, RateLimitError)

**Related Files**:
- `src/components/AuthError.jsx` (create)
- `src/components/index.js` (update exports)
- `src/pages/SignInPage.jsx` (integrate error display)
- `src/pages/SignUpPage.jsx` (integrate error display)

---

#### **BMAD-AUTH-007: Loading Screen Enhancements** ⏳

**Status**: ⏳ PENDING
**Priority**: LOW
**Estimated**: 1 hour (baseline) → 15 minutes (projected with 4.1x velocity)
**Dependencies**: BMAD-AUTH-002 (Protected Routes)

**User Story**: As a user accessing the application, I need a branded full-page loading screen while authentication is being verified, so that I understand the app is working and not broken or frozen.

**Acceptance Criteria**:
- [ ] `LoadingScreen.jsx` component created (or verified from EPIC-003)
- [ ] Sentia branding applied:
  - Blue-purple gradient background
  - Spinning loader with blue-500 color
  - "Loading..." or custom message
  - Uppercase tracking-wider styling
- [ ] Customizable message prop
- [ ] Smooth animation (60fps)
- [ ] Responsive design
- [ ] Component exported from `src/components/index.js`

**Code Pattern**:
```jsx
const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm uppercase tracking-wider text-slate-300">
          {message}
        </p>
      </div>
    </div>
  )
}

export default LoadingScreen
```

**Implementation Notes**:
- May already exist from BMAD-UX-001 (Loading Skeletons) - verify first
- If exists, just enhance with Sentia branding
- If not exists, create as new component

**Related Files**:
- `src/components/LoadingScreen.jsx` (create or enhance)
- `src/components/auth/ProtectedRoute.jsx` (uses LoadingScreen)
- `src/components/index.js` (update exports)

---

#### **BMAD-AUTH-008: Route Security Audit** ⏳

**Status**: ⏳ PENDING
**Priority**: HIGH
**Estimated**: 3 hours (baseline) → 45 minutes (projected with 4.1x velocity)
**Dependencies**: BMAD-AUTH-001, 002, 003 (Components exist)

**User Story**: As a security engineer, I need comprehensive documentation of which routes require authentication and which are public, so that I can verify no protected data is accidentally exposed to unauthenticated users.

**Acceptance Criteria**:
- [ ] All routes audited in `src/App-simple-environment.jsx`
- [ ] Route security matrix created (Route, Protected, Public-Only, Role Required)
- [ ] ProtectedRoute wrapper applied to all dashboard routes
- [ ] PublicOnlyRoute wrapper applied to sign-in/sign-up
- [ ] Public routes documented (/, /sign-in, /sign-up)
- [ ] Protected routes documented (all dashboard pages)
- [ ] RBAC requirements documented (admin-only routes, if any)
- [ ] Audit report created: `bmad/audit/BMAD-AUTH-008-route-security-audit.md`

**Route Security Matrix Template**:
| Route | Protected | Public-Only | RBAC Required | Notes |
|-------|-----------|-------------|---------------|-------|
| `/` | ❌ | ❌ | None | Public landing page |
| `/sign-in` | ❌ | ✅ | None | Redirects authenticated users to /dashboard |
| `/sign-up` | ❌ | ✅ | None | Redirects authenticated users to /dashboard |
| `/dashboard` | ✅ | ❌ | None | Main dashboard (all authenticated users) |
| `/working-capital` | ✅ | ❌ | Manager+ | Financial data (future RBAC) |
| `/admin` | ✅ | ❌ | Admin | User management |

**Implementation Notes**:
- Review existing routes in App-simple-environment.jsx
- Apply ProtectedRoute and PublicOnlyRoute consistently
- Document future RBAC enhancements (e.g., admin-only, manager-only)
- Create testarch-automate rules to enforce route protection

**Related Files**:
- `src/App-simple-environment.jsx` (update route wrappers)
- `bmad/audit/BMAD-AUTH-008-route-security-audit.md` (create)

---

#### **BMAD-AUTH-009: Authentication Testing** ⏳

**Status**: ⏳ PENDING
**Priority**: HIGH
**Estimated**: 4 hours (baseline) → 1 hour (projected with 4.1x velocity)
**Dependencies**: BMAD-AUTH-001 through 008 (All components exist)

**User Story**: As a QA engineer, I need comprehensive automated tests for authentication flows so that regressions are caught before production deployment and users never encounter broken authentication.

**Acceptance Criteria**:
- [ ] Unit tests for ProtectedRoute component
- [ ] Unit tests for PublicOnlyRoute component
- [ ] Unit tests for useAuthRedirect hook
- [ ] Unit tests for useRequireAuth hook
- [ ] Unit tests for AuthError component
- [ ] Integration tests for sign-in flow
- [ ] Integration tests for sign-up flow
- [ ] Integration tests for sign-out flow
- [ ] E2E tests for protected route redirection
- [ ] All tests passing in CI/CD pipeline

**Testing Checklist (9 categories from user spec)**:

**1. Basic Authentication Flow**:
- [ ] User can sign in with valid credentials
- [ ] User can sign up and create new account
- [ ] User can sign out
- [ ] Session persists across page refreshes

**2. Protected Routes**:
- [ ] Unauthenticated users redirected to /sign-in
- [ ] Authenticated users can access protected pages
- [ ] Return URL preserved after sign-in redirect

**3. Public-Only Routes**:
- [ ] Authenticated users redirected to /dashboard from /sign-in
- [ ] Authenticated users redirected to /dashboard from /sign-up
- [ ] Unauthenticated users can access /sign-in and /sign-up

**4. Loading States**:
- [ ] LoadingScreen displays while auth status loading
- [ ] Skeleton loader shows in UserProfile while loading

**5. Error Handling**:
- [ ] AuthError component displays on invalid credentials
- [ ] Network errors handled gracefully
- [ ] Rate limiting errors displayed

**6. User Profile**:
- [ ] User name/email displays in UserProfile
- [ ] UserButton menu functional (Account, Sign Out)
- [ ] afterSignOutUrl redirect works

**7. Clerk Integration**:
- [ ] ClerkProvider wraps App.jsx
- [ ] publishableKey configured correctly
- [ ] afterSignInUrl redirects to /dashboard
- [ ] afterSignUpUrl redirects to /dashboard

**8. Development Mode**:
- [ ] VITE_DEVELOPMENT_MODE=true still bypasses auth (backward compatibility)
- [ ] Development mode toggle functional

**9. RBAC (Future)**:
- [ ] Role checks prepared (useAuth().orgRole or similar)
- [ ] Admin-only routes documented

**Implementation Notes**:
- Use vitest + @testing-library/react for unit tests
- Use Playwright for E2E tests
- Mock Clerk hooks with `vi.mock('@clerk/clerk-react')`
- Create test fixtures for authenticated/unauthenticated states

**Related Files**:
- `tests/unit/auth/ProtectedRoute.test.jsx` (create)
- `tests/unit/auth/PublicOnlyRoute.test.jsx` (create)
- `tests/unit/hooks/useAuthRedirect.test.js` (create)
- `tests/integration/auth-flow.test.js` (create)
- `tests/e2e/authentication.spec.js` (create)

---

#### **BMAD-AUTH-010: Documentation & Deployment** ⏳

**Status**: ⏳ PENDING
**Priority**: MEDIUM
**Estimated**: 2 hours (baseline) → 30 minutes (projected with 4.1x velocity)
**Dependencies**: BMAD-AUTH-001 through 009 (Epic 100% complete)

**User Story**: As a developer or ops engineer, I need comprehensive documentation of the authentication system and deployment steps so that I can configure production environments, troubleshoot issues, and onboard new team members quickly.

**Acceptance Criteria**:
- [ ] Authentication architecture documented
- [ ] Component API docs created (ProtectedRoute, PublicOnlyRoute, etc.)
- [ ] Hook usage examples documented
- [ ] Deployment checklist created
- [ ] Environment variable configuration guide updated
- [ ] Troubleshooting guide created
- [ ] CLAUDE.md updated with EPIC-006 completion status
- [ ] Production deployment tested on Render

**Documentation Structure**:

**1. Architecture Overview** (`docs/architecture/authentication.md`):
- Clerk integration overview
- Component hierarchy (App → ClerkProvider → Routes → Components)
- Authentication flow diagrams
- Route protection patterns

**2. Component API Docs** (`docs/components/authentication.md`):
- ProtectedRoute props and usage
- PublicOnlyRoute props and usage
- UserProfile props and customization
- AuthError props and error types
- LoadingScreen props and styling

**3. Hook API Docs** (`docs/hooks/authentication.md`):
- useAuthRedirect usage and examples
- useRequireAuth usage and examples
- Custom hook patterns

**4. Deployment Checklist** (`docs/deployment/authentication-checklist.md`):
- [ ] Clerk account created
- [ ] Application configured in Clerk dashboard
- [ ] Environment variables set in Render
- [ ] VITE_DEVELOPMENT_MODE=false in production
- [ ] Sign-in/sign-up URLs configured
- [ ] After-sign-in redirects configured
- [ ] Webhook configured (if using subscriptions)
- [ ] Testing completed (all 9 categories)

**5. Troubleshooting Guide** (`docs/troubleshooting/authentication.md`):
- Common errors and solutions
- Clerk dashboard investigation steps
- Network debugging
- Environment variable issues

**Implementation Notes**:
- Follow existing documentation patterns from EPIC-002
- Update CLAUDE.md with EPIC-006 completion metrics
- Create retrospective document
- Deploy to development branch first, then test before production

**Related Files**:
- `docs/architecture/authentication.md` (create)
- `docs/components/authentication.md` (create)
- `docs/hooks/authentication.md` (create)
- `docs/deployment/authentication-checklist.md` (create)
- `docs/troubleshooting/authentication.md` (create)
- `CLAUDE.md` (update EPIC-006 status)
- `bmad/retrospectives/BMAD-AUTH-epic-retrospective.md` (create)

---

## Epic Metrics

- **Total Stories**: 10
- **Completed**: 0 (0%)
- **In Progress**: 0
- **Pending**: 10 (100%)
- **Estimated Duration (Baseline)**: 25 hours (3 days)
- **Projected Duration (4.1x Velocity)**: 6 hours (0.75 days)
- **Projected Duration (7.3x Velocity)**: 3.5 hours (0.5 days)
- **Actual Spent**: 0 hours
- **Target Completion**: 2025-10-20 (1 day after start)

---

## Story Priority Breakdown

**Phase 1: Core Components** (HIGH Priority - Complete First):
1. BMAD-AUTH-001: Environment Configuration - 30 min
2. BMAD-AUTH-002: Protected Route Components - 45 min
3. BMAD-AUTH-003: Sign In/Up Pages - 1 hour
4. BMAD-AUTH-004: User Profile Component - 30 min

**Phase 2: Hooks & Polish** (MEDIUM/LOW Priority - Complete Second):
5. BMAD-AUTH-005: Authentication Hooks - 30 min
6. BMAD-AUTH-006: Error Handling Components - 30 min
7. BMAD-AUTH-007: Loading Screen Enhancements - 15 min
8. BMAD-AUTH-008: Route Security Audit - 45 min
9. BMAD-AUTH-009: Authentication Testing - 1 hour
10. BMAD-AUTH-010: Documentation & Deployment - 30 min

**Total Projected Time**: 6 hours (conservative estimate with 4.1x velocity)

---

## Epic Success Criteria

- [ ] At least 1 story complete (BMAD-AUTH-001)
- [ ] All 10 stories complete (100% - 10/10)
- [ ] All routes properly protected or public-only
- [ ] Sign-in/sign-up pages branded and functional
- [ ] User profile component integrated in header
- [ ] Authentication hooks available for developers
- [ ] Error handling components display actionable messages
- [ ] Route security audit passes (0 unprotected routes with sensitive data)
- [ ] Testing checklist 100% complete (9 categories, all tests passing)
- [ ] Documentation complete and reviewed
- [ ] Production deployment successful with zero authentication issues

---

## Key Technical Details

**Authentication Architecture**:
- Clerk as authentication provider
- React Router v6 for routing
- ClerkProvider wraps entire App.jsx
- ProtectedRoute HOC for route protection
- PublicOnlyRoute HOC for auth-only pages

**Component Patterns**:
- ProtectedRoute: Check auth → redirect or render
- PublicOnlyRoute: Check auth → redirect to dashboard or render
- UserProfile: Display user info + Clerk UserButton
- AuthError: Display error + retry action
- LoadingScreen: Full-page branded loading

**Hook Patterns**:
- useAuthRedirect: Declarative redirect on auth change
- useRequireAuth: Imperative auth check in components
- useAuth (Clerk): Access authentication state

**Route Protection Matrix**:
- Public: `/`, `/sign-in`, `/sign-up`
- Protected: `/dashboard`, `/working-capital`, `/inventory`, `/production`, `/financial-reports`, `/admin`
- Public-Only: `/sign-in`, `/sign-up` (redirect if authenticated)

**Environment Variables**:
```bash
# Clerk Keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URLs
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Development Mode (optional)
VITE_DEVELOPMENT_MODE=false
```

---

## Dependencies

**Upstream**:
- EPIC-003 (Frontend Polish) ✅ COMPLETE - LoadingScreen, ErrorBoundary patterns established

**Downstream**:
- EPIC-004 (Test Coverage) will include BMAD-AUTH-009 tests
- EPIC-005 (Production Deployment) depends on BMAD-AUTH-010 completion

---

## Retrospective Template

**To be completed after epic finishes:**

**Velocity Metrics**:
- Estimated: 25 hours (baseline)
- Projected: 6 hours (4.1x velocity)
- Actual: [TBD]
- Velocity: [TBD]x faster

**What Went Well**:
- [TBD]

**What Could Be Improved**:
- [TBD]

**Key Learnings**:
- [TBD]

**Blockers Encountered**:
- [TBD]

**Future Recommendations**:
- [TBD]

---

**Epic Status**: ⏳ PENDING (Planning Complete)
**Planning Complete**: 2025-10-19
**Stories Created**: 10/10 (100%)
**Next Action**: Begin implementation with BMAD-AUTH-001 (Environment Configuration)
**Framework**: BMAD-METHOD v6a Phase 3 (Solutioning) → Phase 4 (Implementation)
**Generated**: 2025-10-19
**Maintained By**: Development Team
