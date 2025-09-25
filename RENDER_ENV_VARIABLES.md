# Render Environment Variables Configuration

## CRITICAL: Add These to Render Dashboard

Navigate to: https://dashboard.render.com ’ Select Your Service ’ Environment Tab

### Required Environment Variables

```bash
# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq

# Application Settings
NODE_ENV=production
PORT=5000

# API Configuration
VITE_API_BASE_URL=https://sentia-manufacturing-dashboard-production.up.railway.app/api

# Database (Auto-configured by Render)
# DATABASE_URL will be automatically set by Render PostgreSQL

# CORS Configuration
CORS_ORIGINS=https://sentia-manufacturing-dashboard-production.up.railway.app,https://sentiaprod.financeflo.ai
```

### How to Add Variables

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service (sentia-manufacturing-dashboard)
3. Click on "Environment" tab
4. Add each variable:
   - Click "Add Environment Variable"
   - Enter the key (e.g., `VITE_CLERK_PUBLISHABLE_KEY`)
   - Enter the value
   - Click "Save"
5. Service will automatically redeploy

### Verification

After deployment, verify at:
- Health Check: https://your-service.onrender.com/health
- Application: https://your-service.onrender.com

### Troubleshooting

If you see 502 Bad Gateway:
1. Check logs in Render Dashboard ’ Logs tab
2. Verify all environment variables are set
3. Ensure PORT is set to 5000 (or match Render's expectation)
4. Check DATABASE_URL is properly configured

### Notes

- Render automatically provides DATABASE_URL for PostgreSQL
- The service auto-deploys when environment variables change
- Keep CLERK keys secure and never commit them to Git