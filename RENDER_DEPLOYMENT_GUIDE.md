# Render Deployment Guide for CapLiquify Manufacturing Platform

## Overview

This guide walks you through migrating from Railway to Render for hosting your three environments (Development, Testing, Production) plus the MCP AI server.

## Prerequisites

- GitHub repository connected
- Render account (free tier available)
- Environment variables ready

## Step 1: Create Render Account

1. Sign up at https://render.com
2. Connect your GitHub account
3. Authorize Render to access your repository

## Step 2: Deploy Using Blueprint (Recommended)

### Option A: One-Click Deploy via Dashboard

1. Go to Render Dashboard
2. Click "New +" -> "Blueprint"
3. Connect your GitHub repository
4. Select the branch with `render.yaml`
5. Render will automatically create all services and databases

### Option B: Deploy via Render CLI

```bash
# Install Render CLI
npm install -g @render/cli

# Login to Render
render login

# Deploy blueprint
render blueprint deploy
```

## Step 3: Configure Environment Variables

### Critical Variables to Set in Dashboard

Navigate to each service's Environment tab and add:

#### Authentication (All Environments)

- `CLERK_SECRET_KEY`: Your Clerk secret key
- `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key

#### API Keys (All Environments)

- `XERO_CLIENT_ID`: Xero OAuth client ID
- `XERO_CLIENT_SECRET`: Xero OAuth client secret
- `SHOPIFY_API_KEY`: Shopify API key
- `SHOPIFY_API_SECRET`: Shopify API secret
- `AMAZON_SP_CLIENT_ID`: Amazon SP-API client ID
- `AMAZON_SP_CLIENT_SECRET`: Amazon SP-API client secret
- `UNLEASHED_API_ID`: Unleashed API ID
- `UNLEASHED_API_KEY`: Unleashed API key
- `DEAR_API_KEY`: DEAR Systems API key

#### AI Keys (MCP Server)

- `ANTHROPIC_API_KEY`: Claude API key
- `OPENAI_API_KEY`: OpenAI API key
- `GOOGLE_AI_API_KEY`: Google AI API key (optional)

## Step 4: Database Migration

### Export from Railway

```bash
# Export Railway database
pg_dump $RAILWAY_DATABASE_URL > railway_backup.sql
```

### Import to Render

1. Get Render database URL from dashboard
2. Import data:

```bash
psql $RENDER_DATABASE_URL < railway_backup.sql
```

### Run Prisma Migrations

```bash
# Set DATABASE_URL to Render database
export DATABASE_URL="your-render-database-url"

# Run migrations
npx prisma migrate deploy
```

## Step 5: Update Your Local Development

### Update .env file

```env
# Development
DATABASE_URL=postgresql://user:pass@host.render.com:5432/sentia_manufacturing_dev

# Frontend URL (for CORS)
VITE_API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api
```

### Update Git Remotes (Optional)

Keep using your existing GitHub repository. Render will auto-deploy from branches.

## Step 6: Verify Deployments

### Check Service Health

1. Development: https://sentia-manufacturing-development.onrender.com/api/health
2. Testing: https://sentia-manufacturing-testing.onrender.com/api/health
3. Production: https://sentia-manufacturing-production.onrender.com/api/health

### Monitor Logs

- Dashboard -> Service -> Logs
- Or use Render CLI: `render logs --service sentia-manufacturing-development`

## Step 7: DNS Configuration (Production Only)

### Custom Domain Setup

1. Go to service Settings -> Custom Domain
2. Add your domain (e.g., manufacturing.sentia.com)
3. Update DNS records:
   - Type: CNAME
   - Name: manufacturing
   - Value: sentia-manufacturing-production.onrender.com

## Deployment Workflow

### Development Branch (Auto-Deploy)

```bash
git checkout development
git add .
git commit -m "feat: new feature"
git push origin development
# Automatically deploys to development environment
```

### Testing Branch (Auto-Deploy)

```bash
git checkout test
git merge development
git push origin test
# Automatically deploys to testing environment
```

### Production Branch (Manual Deploy)

```bash
git checkout production
git merge test
git push origin production
# Go to Render dashboard and manually trigger deploy
```

## Cost Comparison

### Render Pricing (Monthly)

- **Free Tier**: 750 hours/month (enough for 1 service)
- **Development**: Free tier
- **Testing**: Free tier (if under 750 hours combined)
- **Production**: $7/month (Starter plan recommended)
- **Database**: Free (90 days), then $7/month for Starter
- **Total**: ~$14/month for production setup

### vs Railway Pricing

- Railway: $5/month + usage-based pricing
- Render: More predictable pricing, better free tier

## Troubleshooting

### Common Issues

#### 1. Build Failures

- Check Node version in package.json
- Ensure all dependencies are in package.json
- Review build logs for specific errors

#### 2. Database Connection Issues

- Verify DATABASE_URL is set correctly
- Check SSL settings (Render requires SSL)
- Ensure database is in same region as service

#### 3. Environment Variables Not Loading

- Variables must be set before deploy
- Restart service after adding variables
- Check for typos in variable names

#### 4. CORS Issues

- Update CORS_ORIGINS to match Render URLs
- Include https:// in origins
- Add localhost:3000 for local development

### Health Check Endpoints

Render uses health checks to monitor services:

- Endpoint: `/api/health`
- Expected response: 200 OK with JSON
- Timeout: 30 seconds
- Frequency: Every 30 seconds

### Support Resources

- Render Documentation: https://render.com/docs
- Status Page: https://status.render.com
- Community Forum: https://community.render.com
- Support: https://render.com/support

## Migration Checklist

- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Deploy using render.yaml blueprint
- [ ] Set all environment variables
- [ ] Migrate database from Railway
- [ ] Test development environment
- [ ] Test staging environment
- [ ] Configure custom domain (if applicable)
- [ ] Update local .env files
- [ ] Document Render URLs for team
- [ ] Set up monitoring/alerts
- [ ] Complete UAT on testing environment
- [ ] Deploy to production

## Rollback Strategy

If issues occur, you can:

1. Rollback to previous deploy in Render dashboard
2. Keep Railway running in parallel during migration
3. Use Render's preview environments for testing

## Next Steps

1. Start with development environment deployment
2. Verify all features working
3. Migrate testing environment
4. Complete UAT testing
5. Finally migrate production with client approval

---

**Note**: Render provides better stability than Railway with automatic SSL, DDoS protection, and global CDN. The migration should resolve your 502 errors and environment variable issues.

