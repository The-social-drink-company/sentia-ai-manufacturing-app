# Render Quick Start Guide

## 5-Minute Deployment

### Step 1: Sign Up
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize repository access

### Step 2: Deploy Blueprint
1. Click "New +" → "Blueprint"
2. Select your repository: `The-social-drink-company/sentia-manufacturing-dashboard`
3. Render will detect `render.yaml` and show all services
4. Click "Apply" to create everything

### Step 3: Add Environment Variables (Required)
Go to each service's Environment tab:

#### Minimum Required Variables:
```
CLERK_SECRET_KEY=sk_live_xxxxx
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
```

#### Add These If You Have Them:
```
XERO_CLIENT_ID=xxxxx
XERO_CLIENT_SECRET=xxxxx
SHOPIFY_API_KEY=xxxxx
SHOPIFY_API_SECRET=xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
```

### Step 4: Wait for Deploy
- First deploy takes ~10 minutes
- Check logs for any errors
- Services will show "Live" when ready

### Step 5: Access Your Apps
- Development: https://sentia-manufacturing-development.onrender.com
- Testing: https://sentia-manufacturing-testing.onrender.com
- Production: https://sentia-manufacturing-production.onrender.com

## Your New URLs

Replace your Railway URLs with these:

| Environment | Old Railway URL | New Render URL |
|------------|----------------|----------------|
| Development | sentia-manufacturing-development.up.railway.app | sentia-manufacturing-development.onrender.com |
| Testing | sentia-manufacturing-testing.up.railway.app | sentia-manufacturing-testing.onrender.com |
| Production | sentia-manufacturing-production.up.railway.app | sentia-manufacturing-production.onrender.com |

## Troubleshooting

### If Build Fails:
1. Check Node version matches package.json
2. Ensure all dependencies are listed
3. Review build logs for specific error

### If App Shows Error:
1. Check environment variables are set
2. Verify database connection
3. Look at service logs

### If Database Not Connecting:
1. Database takes 5 minutes to provision
2. Connection string is auto-set via `render.yaml`
3. May need to run migrations manually first time

## Data Migration from Railway

```bash
# Export from Railway
pg_dump YOUR_RAILWAY_DATABASE_URL > backup.sql

# Import to Render (get URL from Render dashboard)
psql YOUR_RENDER_DATABASE_URL < backup.sql

# Run migrations
DATABASE_URL=YOUR_RENDER_DATABASE_URL npx prisma migrate deploy
```

## Support
- Render Dashboard: https://dashboard.render.com
- Documentation: https://render.com/docs
- Status: https://status.render.com

---

**That's it!** Your three environments should be running on Render within 15 minutes.