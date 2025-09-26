# Clerk Authentication Deployment Guide

## Overview

Clerk provides complete user management and authentication for the Sentia Manufacturing Dashboard. This guide covers production deployment, environment configuration, and best practices.

## Production Instance Configuration

### 1. Environment Variables

#### Required Production Variables
```env
# Frontend (React/Vite)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED

# Backend (Node.js/Express)
CLERK_SECRET_KEY=sk_live_REDACTED

# Clerk Configuration
CLERK_ENVIRONMENT=production
VITE_CLERK_DOMAIN=clerk.financeflo.ai
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Webhook (if using)
CLERK_WEBHOOK_SECRET=whsec_REDACTED
```

### 2. Key Differences: Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Publishable Key | `pk_test_*` | `pk_live_*` |
| Secret Key | `sk_test_*` | `sk_live_*` |
| Domain | clerk.accounts.dev | clerk.financeflo.ai |
| OAuth | Shared credentials | Custom credentials |
| Rate Limits | Lower | Higher |
| Support | Community | Priority |

## Authentication Flow Implementation

### Frontend (React)

```jsx
// src/main.jsx
import { ClerkProvider } from '@clerk/clerk-react'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

root.render(
  <ClerkProvider 
    publishableKey={clerkPubKey}
    navigate={(to) => navigate(to)}
    appearance={{
      baseTheme: dark,
      variables: {
        colorPrimary: '#3b82f6'
      }
    }}
  >
    <App />
  </ClerkProvider>
)
```

### Backend (Express)

```javascript
// server.js
import { clerkMiddleware, requireAuth } from '@clerk/express'

app.use(clerkMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY
}))

// Protected route example
app.get('/api/protected', requireAuth(), (req, res) => {
  const { userId } = req.auth
  // Access authenticated user
})
```

## Render Deployment Specifics

### render.yaml Configuration

```yaml
services:
  - type: web
    name: sentia-manufacturing-production
    env: node
    branch: production
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: VITE_CLERK_PUBLISHABLE_KEY
        value: pk_live_REDACTED
      - key: CLERK_SECRET_KEY
        value: sk_live_REDACTED
      - key: NODE_ENV
        value: production
```

### Build Configuration

```javascript
// vite.config.js
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'clerk': ['@clerk/clerk-react']
        }
      }
    }
  }
})
```

## Security Best Practices

### 1. Authorized Parties Configuration

Prevent subdomain cookie leaking:

```javascript
clerkMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY
})
```

### 2. Content Security Policy

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'",
        "https://clerk.financeflo.ai",
        "https://*.clerk.accounts.dev"
      ],
      'connect-src': [
        "'self'",
        "https://clerk.financeflo.ai",
        "https://api.clerk.dev"
      ],
      'frame-src': ["https://clerk.financeflo.ai"]
    }
  }
}))
```

### 3. Session Management

```javascript
// Validate session on each request
app.use(async (req, res, next) => {
  try {
    const sessionClaims = await clerkClient.verifyToken(
      req.headers.authorization?.replace('Bearer ', '')
    )
    req.auth = sessionClaims
    next()
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' })
  }
})
```

## Role-Based Access Control (RBAC)

### User Roles
- **Admin**: Full system access
- **Manager**: Financial and production management
- **Operator**: Production operations
- **Viewer**: Read-only access (default)

### Implementation

```javascript
// Middleware for role checking
const requireRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.auth.sessionClaims?.metadata?.role || 'viewer'
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    next()
  }
}

// Protected route example
app.post('/api/financial/update', 
  requireAuth,
  requireRole(['admin', 'manager']),
  (req, res) => {
    // Only admin and manager can access
  }
)
```

## OAuth and Social Login

### Production OAuth Setup

1. **Google OAuth**
   - Create project in Google Cloud Console
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `https://clerk.financeflo.ai/v1/oauth_callback`

2. **Microsoft OAuth**
   - Register app in Azure Portal
   - Configure redirect URI
   - Add required API permissions

3. **GitHub OAuth**
   - Create OAuth App in GitHub settings
   - Set authorization callback URL

## Webhooks Configuration

### Endpoint Setup

```javascript
// api/webhooks/clerk.js
import { Webhook } from '@clerk/clerk-sdk-node'

const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

app.post('/api/webhooks/clerk', async (req, res) => {
  try {
    const payload = webhook.verify(req.body, {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature']
    })
    
    // Handle different event types
    switch (payload.type) {
      case 'user.created':
        await handleUserCreated(payload.data)
        break
      case 'user.updated':
        await handleUserUpdated(payload.data)
        break
      case 'session.created':
        await handleSessionCreated(payload.data)
        break
    }
    
    res.status(200).json({ received: true })
  } catch (error) {
    res.status(400).json({ error: 'Webhook verification failed' })
  }
})
```

## Deployment Checklist

### Pre-Deployment
- [ ] Create production Clerk instance
- [ ] Update all environment variables
- [ ] Configure custom domain
- [ ] Set up OAuth providers
- [ ] Configure webhooks
- [ ] Test authentication flow

### Deployment
- [ ] Push to production branch
- [ ] Verify environment variables in Render
- [ ] Monitor deployment logs
- [ ] Test health endpoints

### Post-Deployment
- [ ] Verify authentication works
- [ ] Test all user roles
- [ ] Confirm webhook delivery
- [ ] Monitor error rates
- [ ] Check performance metrics

## Troubleshooting

### Common Issues

1. **"Invalid API Key" Error**
   - Verify `CLERK_SECRET_KEY` is set correctly
   - Ensure using production key (`sk_live_*`)
   - Check for trailing spaces

2. **CORS Errors**
   - Add domain to authorized parties
   - Configure CORS middleware properly
   - Check CSP headers

3. **Session Not Persisting**
   - Verify cookie settings
   - Check domain configuration
   - Ensure HTTPS is used

4. **OAuth Not Working**
   - Verify redirect URIs
   - Check OAuth credentials
   - Ensure providers are enabled

### Debug Mode

```javascript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  clerk.setLogLevel('debug')
}
```

## Performance Optimization

### Caching Sessions

```javascript
const sessionCache = new Map()

const getCachedSession = async (sessionId) => {
  if (sessionCache.has(sessionId)) {
    const cached = sessionCache.get(sessionId)
    if (cached.expiry > Date.now()) {
      return cached.data
    }
  }
  
  const session = await clerkClient.sessions.getSession(sessionId)
  sessionCache.set(sessionId, {
    data: session,
    expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
  })
  
  return session
}
```

### Lazy Loading

```jsx
// Lazy load Clerk components
const SignIn = lazy(() => import('@clerk/clerk-react').then(m => ({ 
  default: m.SignIn 
})))

const UserButton = lazy(() => import('@clerk/clerk-react').then(m => ({ 
  default: m.UserButton 
})))
```

## Monitoring and Analytics

### Key Metrics to Track
- Authentication success rate
- Average sign-in time
- Session duration
- Failed authentication attempts
- OAuth provider usage

### Integration with Monitoring Tools

```javascript
// Track authentication events
clerk.addListener('session.created', (session) => {
  analytics.track('User Signed In', {
    userId: session.userId,
    method: session.createdAt
  })
})

clerk.addListener('user.created', (user) => {
  analytics.identify(user.id, {
    email: user.emailAddresses[0].emailAddress,
    createdAt: user.createdAt
  })
})
```

## Migration Guide

### From Development to Production

1. **Update Environment Variables**
   ```bash
   # Replace all test keys with production keys
   sed -i 's/pk_test_/pk_live_/g' .env
   sed -i 's/sk_test_/sk_live_/g' .env
   ```

2. **Update Clerk Provider**
   ```jsx
   // Use environment-based configuration
   const clerkConfig = {
     development: {
       publishableKey: 'pk_test_...',
       domain: 'clerk.accounts.dev'
     },
     production: {
       publishableKey: 'pk_live_...',
       domain: 'clerk.financeflo.ai'
     }
   }
   ```

3. **Database User Migration**
   ```sql
   -- Update user roles and permissions
   UPDATE users 
   SET role = 'viewer' 
   WHERE role IS NULL;
   ```

## API Reference

### Authentication Endpoints
- `POST /api/auth/sign-in` - Sign in user
- `POST /api/auth/sign-up` - Create new user
- `POST /api/auth/sign-out` - Sign out user
- `GET /api/auth/session` - Get current session
- `GET /api/auth/user` - Get current user

### User Management
- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Role Management
- `GET /api/roles` - List available roles
- `POST /api/users/:id/role` - Assign role to user
- `DELETE /api/users/:id/role` - Remove role from user

---

**Last Updated**: December 2024
**Clerk SDK Version**: @clerk/clerk-react@5.46.1
**Documentation Version**: 1.0