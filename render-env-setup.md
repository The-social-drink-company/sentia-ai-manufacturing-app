# Render Environment Variables Setup for Clerk Authentication

## Required Environment Variables for Render Deployment

Add these environment variables to your Render services:

### Development Environment
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
NODE_ENV=development
VITE_ENABLE_AUTH_FALLBACK=true
VITE_API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api
```

### Testing Environment
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
NODE_ENV=test
VITE_ENABLE_AUTH_FALLBACK=true
VITE_API_BASE_URL=https://sentia-manufacturing-testing.onrender.com/api
```

### Production Environment
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
NODE_ENV=production
VITE_ENABLE_AUTH_FALLBACK=false
VITE_API_BASE_URL=https://sentia-manufacturing-production.onrender.com/api
```

## How to Add Variables in Render

1. Go to https://dashboard.render.com
2. Select your service (development/testing/production)
3. Click on "Environment" tab
4. Add each variable one by one
5. Click "Save Changes"
6. Service will auto-redeploy

## Important Notes

- **Development/Test**: `VITE_ENABLE_AUTH_FALLBACK=true` allows demo mode if Clerk fails
- **Production**: `VITE_ENABLE_AUTH_FALLBACK=false` enforces authentication
- The test keys provided work with the test Clerk instance
- For production deployment with real users, you'll need production Clerk keys

## Testing the Authentication

After deployment, the authentication flow will:

1. **First Try**: Load with Clerk authentication using BulletproofClerkProvider
2. **If Clerk Fails in Dev/Test**: Fall back to demo mode with a warning
3. **If Clerk Fails in Production**: Show error screen with retry options
4. **Success**: Users can sign in/sign up through Clerk

## Troubleshooting

If you see a blank screen:
1. Check browser console for errors
2. Verify environment variables are set in Render
3. Check that the build completed successfully
4. Ensure VITE_CLERK_PUBLISHABLE_KEY starts with 'pk_'

The new implementation has multiple fallback layers to prevent blank screens:
- Loading screens during initialization
- Error boundaries to catch React errors
- Fallback authentication for development
- Demo mode when Clerk is unavailable
- Clear error messages with retry options