# Authentication System Configuration

This document provides comprehensive authentication configuration for the Sentia Manufacturing Dashboard.

## AUTHENTICATION SYSTEM (BRANCH-SPECIFIC)

### 🔧 **Development Branch Authentication Bypass**
**CRITICAL RULE**: Development branch bypasses Clerk authentication entirely for faster development workflow.

**Environment Variable**: `VITE_DEVELOPMENT_MODE=true`
**Implementation**: Custom `DevelopmentAuthProvider` replaces `ClerkProvider`
**Mock User**: Automatic admin user with full permissions
**Access**: Direct dashboard access without sign-in flow

**Key Components**:
- `src/auth/DevelopmentAuthProvider.jsx` - Mock authentication provider
- `src/auth/MockUser.js` - Mock user data with admin permissions
- `src/App-environment-aware.jsx` - Environment-aware App component
- `src/hooks/useAuthRole.jsx` - Environment-aware authentication hook

### 🔐 **Production Clerk Configuration**
**Domain**: clerk.financeflo.ai
**Environment**: Production
**SDK Version**: @clerk/clerk-react@5.47.0

### Critical Production Keys
```env
# Frontend (React/Vite)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED

# Backend (Node.js/Express)
CLERK_SECRET_KEY=sk_live_REDACTED

# Configuration
CLERK_ENVIRONMENT=production
VITE_CLERK_DOMAIN=clerk.financeflo.ai
CLERK_WEBHOOK_SECRET=whsec_REDACTED
```

### Authentication Implementation
```javascript
// Frontend (src/main.jsx)
import { ClerkProvider } from '@clerk/clerk-react'

<ClerkProvider
  publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
  navigate={(to) => navigate(to)}
>
  <App />
</ClerkProvider>

// Backend (server.js)
import { clerkMiddleware } from '@clerk/express'

app.use(clerkMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY
}))
```

### Role-Based Access Control (RBAC)
- **Admin**: Full system access, user management, configuration
- **Manager**: Financial planning, production scheduling, reports
- **Operator**: Production operations, quality control, inventory
- **Viewer**: Read-only dashboard access (default role)

### Branch-Specific Authentication Configuration
**Development Branch**: `VITE_DEVELOPMENT_MODE=true` - Authentication bypassed
**Testing Branch**: `VITE_DEVELOPMENT_MODE=false` - Full Clerk authentication with test keys
**Production Branch**: `VITE_DEVELOPMENT_MODE=false` - Full Clerk authentication with production keys

### Security Best Practices
1. **Authorized Parties**: Configured to prevent subdomain cookie leaking
2. **CSP Headers**: Properly configured for Clerk domains
3. **Session Validation**: Token verification on each protected route
4. **Webhook Security**: HMAC signature validation for all webhooks
5. **Development Security**: Authentication bypass only enabled in development branch

### Clerk Documentation Resource
**Documentation Folder**: `clerk-docs/` (excluded from Git)
- **Comprehensive Coverage**: Complete Clerk authentication documentation crawled from clerk.com
- **Platform Support**: React, Next.js, Express, Nuxt, Vue, Go, iOS, Android guides
- **Authentication Flows**: OAuth, social connections, enterprise SSO, multi-factor authentication
- **Organization Management**: Role-based access control, team management, domain verification
- **Security Features**: Bot protection, session management, JWT verification, password policies
- **Integration Guides**: Custom flows, API references, webhooks, billing integration
- **Deployment**: Production setup, environment management, troubleshooting guides

**Key Documentation Areas**:
- Getting Started: `/docs/getting-started/` - Setup and core concepts
- Guides: `/docs/guides/` - Authentication strategies, customization, security
- Reference: `/docs/reference/` - Component APIs, hooks, backend utilities
- Platform-Specific: React, Next.js, Express integration examples