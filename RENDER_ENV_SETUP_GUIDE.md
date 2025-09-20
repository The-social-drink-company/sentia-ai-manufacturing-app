# Render Environment Variables Setup Guide

## Step 1: Add Environment Variables to Development Service

### Access Render Dashboard
1. Navigate to **https://dashboard.render.com**
2. Find your **sentia-manufacturing-development** service
3. Click on the service to open details
4. Click on the **"Environment"** tab

### Add Clerk Production Keys

Click "Add Environment Variable" for each entry below. Copy and paste exactly as shown:

#### 1. Frontend Publishable Key
```
Name: VITE_CLERK_PUBLISHABLE_KEY
Value: pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ
```

#### 2. Backend Secret Key
```
Name: CLERK_SECRET_KEY
Value: sk_live_mzgSFm1q9VrzngMMaCTNNwPEqBmr75vVxiND1DO7wq
```

#### 3. Next.js Compatibility Key
```
Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ
```

#### 4. Sign In URL
```
Name: VITE_CLERK_SIGN_IN_URL
Value: /sign-in
```

#### 5. Sign Up URL
```
Name: VITE_CLERK_SIGN_UP_URL
Value: /sign-up
```

#### 6. After Sign In URL
```
Name: VITE_CLERK_AFTER_SIGN_IN_URL
Value: /dashboard
```

#### 7. After Sign Up URL
```
Name: VITE_CLERK_AFTER_SIGN_UP_URL
Value: /dashboard
```

#### 8. Clerk Environment
```
Name: CLERK_ENVIRONMENT
Value: production
```

#### 9. Clerk Domain
```
Name: VITE_CLERK_DOMAIN
Value: clerk.financeflo.ai
```

### Save and Deploy
- After adding all 9 variables, click **"Save Changes"**
- Service will automatically redeploy (takes 5-10 minutes)
- Monitor the deployment in the "Events" tab

---

## Step 2: Add Environment Variables to Production Service

### Access Production Service
1. Go back to Render Dashboard
2. Find your **sentia-manufacturing-production** service
3. Click on the service
4. Click on the **"Environment"** tab

### Add Same Variables
Add the exact same 9 environment variables as above:

1. `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ`
2. `CLERK_SECRET_KEY` = `sk_live_mzgSFm1q9VrzngMMaCTNNwPEqBmr75vVxiND1DO7wq`
3. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ`
4. `VITE_CLERK_SIGN_IN_URL` = `/sign-in`
5. `VITE_CLERK_SIGN_UP_URL` = `/sign-up`
6. `VITE_CLERK_AFTER_SIGN_IN_URL` = `/dashboard`
7. `VITE_CLERK_AFTER_SIGN_UP_URL` = `/dashboard`
8. `CLERK_ENVIRONMENT` = `production`
9. `VITE_CLERK_DOMAIN` = `clerk.financeflo.ai`

### Additional Production Variables (if needed)
```
Name: NODE_ENV
Value: production
```

```
Name: DATABASE_URL
Value: [Your production database URL from Render PostgreSQL]
```

```
Name: MCP_SERVER_URL
Value: https://mcp-server-tkyu.onrender.com
```

---

## Quick Copy-Paste Reference

### All Variables in One Block
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ
CLERK_SECRET_KEY=sk_live_mzgSFm1q9VrzngMMaCTNNwPEqBmr75vVxiND1DO7wq
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard
CLERK_ENVIRONMENT=production
VITE_CLERK_DOMAIN=clerk.financeflo.ai
```

---

## Verification Steps

### 1. Check Deployment Status
- Go to the **"Events"** tab
- Look for "Deploy live" status
- Should show green checkmark when complete

### 2. Verify Environment Variables
- In the **"Environment"** tab
- All 9 Clerk variables should be visible
- Values should match exactly (no extra spaces)

### 3. Test the Service
Once deployed, test with:
```bash
# Check health
curl https://sentia-manufacturing-development.onrender.com/health

# Check for Clerk key in HTML
curl -s https://sentia-manufacturing-development.onrender.com | grep "pk_live_"
```

### 4. Browser Test
1. Navigate to https://sentia-manufacturing-development.onrender.com
2. Open browser console (F12)
3. Look for: "Initializing with Clerk key: Present"
4. Try clicking "Sign In" or "Sign Up"
5. Should redirect to Clerk authentication page

---

## Troubleshooting

### Issue: Service won't redeploy
- Click **"Manual Deploy"** button
- Select **"Clear build cache & deploy"**

### Issue: Variables not loading
- Check for trailing spaces in values
- Ensure no quotes around values
- Verify variable names are exact (case-sensitive)

### Issue: 502 Bad Gateway
- Service is still deploying (wait 5-10 minutes)
- Check **"Logs"** tab for errors
- Verify all required variables are set

### Issue: Authentication not working
- Clear browser cache
- Try incognito/private browsing
- Check browser console for errors
- Verify Clerk domain is correct

---

## Expected Results After Setup

### Development Service
✅ Service redeploys automatically
✅ Health endpoint returns 200 OK
✅ Homepage loads without errors
✅ Clerk authentication is active
✅ Sign In/Sign Up buttons work
✅ Dashboard is accessible after login

### Production Service
✅ All features from development
✅ Production database connected
✅ External APIs integrated
✅ Performance optimized
✅ Error logging minimized

---

## Security Notes

⚠️ **IMPORTANT**: These are production keys. Handle with care:
- Never commit them to public repositories
- Only share with authorized team members
- Rotate keys periodically
- Monitor for unauthorized usage

---

## Next Steps

After both services are configured and deployed:

1. **Test Authentication Flow**
   - Create a test account
   - Sign in and out
   - Verify dashboard access

2. **Verify Data Loading**
   - Check financial metrics
   - Test inventory management
   - Confirm production tracking

3. **Test Features**
   - Working Capital page
   - What-If Analysis
   - Report generation

4. **Mobile Testing**
   - Test on mobile devices
   - Check responsive design
   - Verify touch interactions

---

**Document Version**: 1.0
**Last Updated**: September 2025
**Keys Valid Until**: Check Clerk Dashboard