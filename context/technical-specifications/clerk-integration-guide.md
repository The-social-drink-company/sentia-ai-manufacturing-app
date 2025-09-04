# Clerk Integration Guide for React + Vite

## Overview
This guide provides comprehensive information for integrating Clerk authentication with React + Vite applications, with specific focus on preventing blank screen issues and handling deployment challenges.

## Key Concepts

### 1. Environment Variables
- **Development**: `pk_test_` prefix for publishable keys
- **Production**: `pk_live_` prefix for publishable keys
- **Vite Requirement**: Must use `VITE_` prefix for client-side env vars
- **Required**: `VITE_CLERK_PUBLISHABLE_KEY`
- **Backend**: `CLERK_SECRET_KEY` (for Node.js backend)

### 2. Critical Setup Requirements

#### Mandatory ClerkProvider Configuration
```javascript
// main.jsx or main.tsx
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>
)
```

## Common Issues and Solutions

### Issue 1: Blank Screen in Production

**Symptoms:**
- Application shows blank white screen
- No error messages visible
- Works locally but fails in production

**Root Causes:**
1. Missing `VITE_CLERK_PUBLISHABLE_KEY` in production environment
2. ClerkProvider imported but key is undefined
3. Build process includes Clerk code but runtime lacks configuration

**Solutions:**

#### Option A: Make Clerk Optional (Recommended for demos)
```javascript
// main.jsx - Conditional ClerkProvider
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>
)
```

#### Option B: Graceful Fallback Pattern
```javascript
// App.jsx - Handle missing auth gracefully
function ProtectedRoute({ children }) {
  const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  
  if (!hasClerk) {
    // No Clerk configured - allow access (demo mode)
    return children
  }
  
  // Clerk available - use authentication
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  )
}
```

#### Option C: Complete Removal (Emergency fix)
If Clerk is causing persistent issues:
1. Remove all Clerk imports
2. Remove ClerkProvider wrapper
3. Replace auth components with placeholders
4. Deploy without authentication

### Issue 2: Import Errors

**Problem:** 
```
Cannot resolve '@clerk/clerk-react'
```

**Solution:**
```bash
# Ensure Clerk is installed
npm install @clerk/clerk-react@latest

# Or remove if not using
npm uninstall @clerk/clerk-react
```

### Issue 3: Build vs Runtime Mismatch

**Problem:** Build includes Clerk but runtime doesn't have keys

**Solution:**
```javascript
// Use dynamic imports for optional features
const loadClerk = async () => {
  if (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    const { ClerkProvider } = await import('@clerk/clerk-react')
    return ClerkProvider
  }
  return null
}
```

## Deployment Best Practices

### Railway Deployment

1. **Set Environment Variables:**
   - Add `VITE_CLERK_PUBLISHABLE_KEY` in Railway dashboard
   - Ensure it's available during build time
   - Railway auto-rebuilds on env var changes

2. **Build Configuration:**
   ```toml
   # railway.toml
   [build]
   builder = "NIXPACKS"
   buildCommand = "npm run build"
   
   [deploy]
   startCommand = "npm start"
   ```

3. **Debugging Railway Blank Screen:**
   - Check Railway build logs for import errors
   - Verify env vars are set before deployment
   - Use Railway's console to inspect runtime environment

### Vercel/Netlify Deployment

1. **Environment Variables:**
   - Add through platform dashboard
   - Prefix with `VITE_` for Vite projects
   - Redeploy after adding variables

2. **Build Settings:**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node version: 18+

## Error Handling Patterns

### 1. Loading States
```javascript
function App() {
  const { isLoaded, isSignedIn } = useAuth()
  
  if (!isLoaded) {
    return <LoadingSpinner />
  }
  
  return isSignedIn ? <Dashboard /> : <LandingPage />
}
```

### 2. Error Boundaries
```javascript
class ClerkErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    if (error.message.includes('Clerk')) {
      // Handle Clerk-specific errors
      console.error('Clerk initialization failed:', error)
      // Render app without auth
    }
  }
  
  render() {
    if (this.state.hasError) {
      return <AppWithoutAuth />
    }
    return this.props.children
  }
}
```

### 3. Conditional Feature Flags
```javascript
// config/features.js
export const features = {
  authentication: !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  requireAuth: import.meta.env.VITE_REQUIRE_AUTH === 'true'
}

// Use throughout app
if (features.authentication) {
  // Show auth features
}
```

## Debugging Checklist

### Local Development
- [ ] VITE_CLERK_PUBLISHABLE_KEY is in .env.local
- [ ] npm install @clerk/clerk-react is successful
- [ ] No console errors about missing Clerk
- [ ] Application renders without blank screen

### Production Deployment
- [ ] Environment variables set in deployment platform
- [ ] Build logs show no import errors
- [ ] Browser console shows no Clerk errors
- [ ] Application loads without blank screen
- [ ] Authentication flow works (if configured)

## Migration Strategy

### From Mandatory to Optional Clerk

1. **Phase 1: Make Optional**
   - Wrap ClerkProvider conditionally
   - Add fallback routes

2. **Phase 2: Test Both Modes**
   - Test with VITE_CLERK_PUBLISHABLE_KEY set
   - Test without key (demo mode)

3. **Phase 3: Deploy**
   - Deploy to staging first
   - Verify both modes work
   - Deploy to production

### Emergency Removal

If Clerk is causing critical issues:

1. **Remove from main.jsx:**
   ```javascript
   // Remove: import { ClerkProvider } from '@clerk/clerk-react'
   // Remove: <ClerkProvider> wrapper
   ```

2. **Remove from components:**
   ```javascript
   // Remove: import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
   // Replace with placeholders or remove entirely
   ```

3. **Update package.json:**
   ```bash
   npm uninstall @clerk/clerk-react
   ```

## Best Practices Summary

1. **Always handle missing keys gracefully**
2. **Use conditional imports for optional features**
3. **Implement proper loading states**
4. **Add comprehensive error boundaries**
5. **Test both authenticated and unauthenticated flows**
6. **Document environment variable requirements**
7. **Use feature flags for auth features**
8. **Monitor production for auth errors**

## References

- [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)
- [Clerk Deployment Guide](https://clerk.com/docs/deployments/overview)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Railway Deployment](https://docs.railway.com)