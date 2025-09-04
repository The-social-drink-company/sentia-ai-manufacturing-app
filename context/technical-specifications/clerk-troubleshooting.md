# Clerk Troubleshooting Guide

## Quick Diagnosis Flowchart

```
Is the screen blank?
├── YES → Check browser console
│   ├── "Missing Clerk Publishable Key" → Set VITE_CLERK_PUBLISHABLE_KEY
│   ├── "Cannot resolve '@clerk/clerk-react'" → Run npm install @clerk/clerk-react
│   └── No errors → Check Network tab for failed requests
└── NO → Check specific error message below
```

## Common Error Messages and Solutions

### 1. "Missing Clerk Publishable Key"

**Error:**
```
Uncaught Error: Missing Clerk Publishable Key
```

**Causes:**
- VITE_CLERK_PUBLISHABLE_KEY not set in .env or production
- Wrong environment variable name (missing VITE_ prefix)
- Environment variables not loaded during build

**Solutions:**
```bash
# Local development
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_..." >> .env.local

# Production (Railway)
# Add via Railway dashboard → Variables → New Variable
# Key: VITE_CLERK_PUBLISHABLE_KEY
# Value: pk_live_... (or pk_test_ for testing)
```

### 2. "Module not found: @clerk/clerk-react"

**Error:**
```
Module not found: Error: Can't resolve '@clerk/clerk-react'
```

**Solution:**
```bash
# Install Clerk
npm install @clerk/clerk-react@latest

# Or if not using Clerk
npm uninstall @clerk/clerk-react
# Then remove all Clerk imports from code
```

### 3. Blank Screen (No Console Errors)

**Diagnosis Steps:**

1. **Check Network Tab:**
   - Look for failed API calls to clerk.com
   - Check if main.js loaded successfully

2. **Verify Build Output:**
   ```bash
   npm run build
   # Check for errors in build output
   ```

3. **Test Production Build Locally:**
   ```bash
   npm run build
   npm run preview
   # Open http://localhost:4173
   ```

**Common Fixes:**

```javascript
// Fix 1: Make Clerk Optional
// main.jsx
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (PUBLISHABLE_KEY) {
  // Only use Clerk if key exists
  const { ClerkProvider } = await import('@clerk/clerk-react')
  // ... render with ClerkProvider
} else {
  // Render without Clerk
  ReactDOM.createRoot(document.getElementById('root')).render(<App />)
}
```

```javascript
// Fix 2: Remove Clerk Completely (Emergency)
// main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Remove: import { ClerkProvider } from '@clerk/clerk-react'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />  {/* No ClerkProvider wrapper */}
  </React.StrictMode>
)
```

### 4. "Invalid publishable key"

**Error:**
```
Error: Invalid publishable key. Make sure you're using the correct key for your environment.
```

**Causes:**
- Using test key in production or vice versa
- Malformed key (extra spaces, quotes)
- Wrong Clerk application key

**Solution:**
```javascript
// Verify key format
// Test: pk_test_[base64string]
// Live: pk_live_[base64string]

// Clean the key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim()
```

### 5. Authentication Redirect Loop

**Symptoms:**
- Page keeps redirecting
- URL changes repeatedly
- Never reaches dashboard

**Fix:**
```javascript
// Check afterSignOutUrl and redirects
<ClerkProvider 
  publishableKey={PUBLISHABLE_KEY} 
  afterSignOutUrl="/"  // Ensure this route exists
  appearance={{
    signIn: { redirectUrl: '/dashboard' },
    signUp: { redirectUrl: '/dashboard' }
  }}
>
```

## Platform-Specific Issues

### Railway

**Issue:** Environment variables not available during build

**Fix:**
1. Set variables in Railway dashboard
2. Trigger rebuild:
   ```bash
   git commit --allow-empty -m "Trigger Railway rebuild"
   git push
   ```

**Issue:** Build succeeds but runtime fails

**Debug:**
```javascript
// Add to main.jsx for debugging
console.log('Clerk Key exists:', !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
console.log('All env vars:', import.meta.env)
```

### Vercel

**Issue:** Environment variables not exposed to client

**Fix:**
- Ensure variables start with `VITE_`
- Add to Vercel dashboard
- Redeploy

### Local Development

**Issue:** .env not loading

**Fix:**
```bash
# Use .env.local for local secrets
mv .env .env.local

# Restart dev server
npm run dev
```

## Emergency Recovery Procedures

### Procedure 1: Quick Fix (Remove Auth)

```bash
# 1. Remove Clerk from main.jsx
sed -i '' '/ClerkProvider/d' src/main.jsx
sed -i '' '/@clerk/d' src/main.jsx

# 2. Remove from package.json
npm uninstall @clerk/clerk-react

# 3. Rebuild and deploy
npm run build
git add -A
git commit -m "Emergency: Remove Clerk to fix blank screen"
git push
```

### Procedure 2: Make Auth Optional

```javascript
// main.jsx - Quick optional auth setup
const App = () => {
  try {
    const { ClerkProvider } = require('@clerk/clerk-react')
    const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
    if (key) {
      return (
        <ClerkProvider publishableKey={key}>
          <MainApp />
        </ClerkProvider>
      )
    }
  } catch (e) {
    console.log('Clerk not available, running without auth')
  }
  return <MainApp />
}
```

### Procedure 3: Rollback

```bash
# Find last working commit
git log --oneline -10

# Rollback to working version
git revert HEAD
git push

# Or hard reset (careful!)
git reset --hard <commit-hash>
git push --force
```

## Debug Commands

```bash
# Check if Clerk is installed
npm list @clerk/clerk-react

# Check environment variables
node -e "console.log(process.env.VITE_CLERK_PUBLISHABLE_KEY)"

# Test build
npm run build 2>&1 | grep -i clerk

# Check for Clerk in bundle
grep -r "clerk" dist/

# Railway logs
railway logs -n 100

# Local production test
npm run build && npm run preview
```

## Prevention Checklist

Before deploying:
- [ ] Test with Clerk key present
- [ ] Test with Clerk key missing
- [ ] Build succeeds without warnings
- [ ] No hardcoded keys in code
- [ ] Error boundaries implemented
- [ ] Fallback UI for auth failures
- [ ] Environment variables documented
- [ ] Deployment platform configured

## Support Resources

1. **Clerk Discord**: https://clerk.com/discord
2. **Clerk Support**: https://clerk.com/contact/support
3. **Documentation**: https://clerk.com/docs
4. **Status Page**: https://status.clerk.com

## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Blank screen | Remove Clerk imports |
| Missing key error | Add VITE_CLERK_PUBLISHABLE_KEY |
| Module not found | npm install @clerk/clerk-react |
| Invalid key | Check pk_test_ vs pk_live_ |
| Redirect loop | Fix afterSignOutUrl |
| Build fails | Make Clerk optional |

## Testing Strategies

### Test Matrix
- [ ] Local + No Clerk key
- [ ] Local + Test key
- [ ] Production + No key
- [ ] Production + Live key
- [ ] Build without @clerk/clerk-react installed
- [ ] Build with wrong key format

### Automated Tests
```javascript
// tests/clerk-integration.test.js
describe('Clerk Integration', () => {
  it('should render without Clerk key', () => {
    delete process.env.VITE_CLERK_PUBLISHABLE_KEY
    expect(() => render(<App />)).not.toThrow()
  })
  
  it('should handle invalid key gracefully', () => {
    process.env.VITE_CLERK_PUBLISHABLE_KEY = 'invalid'
    expect(() => render(<App />)).not.toThrow()
  })
})