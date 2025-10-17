# Render Auto-Deploy Configuration Guide

## Overview

This guide sets up automatic deployments from GitHub branches to Render services.

## Branch-to-Service Mapping

| Branch        | Service Name                     | URL                                                   | Plan           |
| ------------- | -------------------------------- | ----------------------------------------------------- | -------------- |
| `development` | sentia-manufacturing-development | https://sentia-manufacturing-development.onrender.com | Free           |
| `test`        | sentia-manufacturing-testing     | https://sentia-manufacturing-testing.onrender.com     | Starter ($7)   |
| `production`  | sentia-manufacturing-production  | https://sentia-manufacturing-production.onrender.com  | Standard ($25) |

## Step 1: Initial Service Creation

### Option A: Via Render Dashboard (Recommended)

1. **Development Service**:

   ```
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect repo: The-social-drink-company/sentia-manufacturing-dashboard
   - Name: sentia-manufacturing-development
   - Branch: development
   - Root Directory: ./
   - Build: npm ci --legacy-peer-deps && npm run build && npx prisma generate && npx prisma db push --skip-generate
   - Start: node server-render.js
   - Plan: Free
   ```

2. **Testing Service**:

   ```
   - Repeat above with:
   - Name: sentia-manufacturing-testing
   - Branch: test
   - Plan: Starter
   ```

3. **Production Service**:
   ```
   - Repeat above with:
   - Name: sentia-manufacturing-production
   - Branch: production
   - Plan: Standard
   - Build: npm ci --legacy-peer-deps && npm run build && npx prisma generate && npx prisma migrate deploy
   ```

### Option B: Via Blueprint (All at once)

1. Push `render-environments.yaml` to GitHub
2. Go to https://render.com/deploy
3. Select your repository
4. Choose `render-environments.yaml`
5. Deploy all services at once

## Step 2: Configure Auto-Deploy

For each service in Render Dashboard:

1. Go to Settings → Build & Deploy
2. Enable "Auto-Deploy" → "Yes"
3. Set branch:
   - Development: `development`
   - Testing: `test`
   - Production: `production`

## Step 3: Environment Variables

### Critical Variables for MCP Integration

Each service needs these MCP-specific variables:

```yaml
MCP_SERVER_URL: https://mcp-server-tkyu.onrender.com
MCP_WEBSOCKET_URL: wss://mcp-server-tkyu.onrender.com
MCP_JWT_SECRET: [Generate unique for each environment]
MCP_ENABLE_WEBSOCKET: true
```

### Database URLs by Environment

**Development**:

```
DATABASE_URL: postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

**Testing**:

```
DATABASE_URL: postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

**Production**:

```
DATABASE_URL: postgresql://neondb_owner:npg_2wXVD9gdintm@ep-broad-resonance-ablmx6yo-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

## Step 4: GitHub Webhook Configuration

Render automatically sets up webhooks. Verify in GitHub:

1. Go to GitHub repo settings
2. Click "Webhooks"
3. Verify Render webhooks exist for each service
4. Each should have:
   - URL: `https://api.render.com/deploy/...`
   - Events: Push events

## Step 5: Deployment Workflow

### Development Workflow

```bash
# Make changes locally
git add .
git commit -m "feat: new feature"
git push origin development

# Automatically deploys to: sentia-manufacturing-development.onrender.com
```

### Testing Workflow

```bash
# Merge development to test
git checkout test
git merge development
git push origin test

# Automatically deploys to: sentia-manufacturing-testing.onrender.com
```

### Production Workflow

```bash
# After UAT approval, merge to production
git checkout production
git merge test
git push origin production

# Automatically deploys to: sentia-manufacturing-production.onrender.com
```

## Step 6: Monitoring Auto-Deploys

### Render Dashboard

- View deployment status in real-time
- Check build logs for errors
- Monitor service health

### GitHub Actions Integration (Optional)

```yaml
# .github/workflows/render-notify.yml
name: Notify Render Deploy
on:
  push:
    branches: [development, test, production]
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Notify deployment started
        run: echo "Deployment to Render started for branch ${{ github.ref }}"
```

## Step 7: Rollback Strategy

If deployment fails:

### Automatic Rollback

1. Render keeps previous builds
2. Go to service → Deploys
3. Click "Rollback" on last working deploy

### Manual Rollback

```bash
# Revert commit locally
git revert HEAD
git push origin <branch>

# Or reset to previous commit
git reset --hard <commit-hash>
git push --force origin <branch>
```

## Step 8: Health Monitoring

### Automated Health Checks

Each service has `/health` endpoint configured. Render will:

- Check every 30 seconds
- Alert if unhealthy
- Restart if needed

### Manual Health Check

```powershell
# Test all environments
$environments = @("development", "testing", "production")
foreach ($env in $environments) {
    $url = "https://sentia-manufacturing-$env.onrender.com/health"
    Write-Host "Checking $env..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri $url
}
```

## Step 9: MCP Server Integration Verification

Test MCP connectivity for each environment:

```powershell
# Test MCP integration
$services = @(
    "https://sentia-manufacturing-development.onrender.com",
    "https://sentia-manufacturing-testing.onrender.com",
    "https://sentia-manufacturing-production.onrender.com"
)

foreach ($service in $services) {
    Write-Host "Testing $service..." -ForegroundColor Cyan

    # Test health
    Invoke-RestMethod -Uri "$service/health"

    # Test MCP status
    try {
        Invoke-RestMethod -Uri "$service/api/mcp/status"
        Write-Host "MCP Connected!" -ForegroundColor Green
    } catch {
        Write-Host "MCP endpoint needs auth (expected)" -ForegroundColor Yellow
    }
}
```

## Deployment Status Dashboard

| Environment | Auto-Deploy | Branch        | Status  | MCP Server |
| ----------- | ----------- | ------------- | ------- | ---------- |
| Development | ✅ Enabled  | `development` | 🟢 Live | Connected  |
| Testing     | ✅ Enabled  | `test`        | 🟢 Live | Connected  |
| Production  | ✅ Enabled  | `production`  | 🟢 Live | Connected  |

## Cost Summary

- **Development**: Free (750 hours/month)
- **Testing**: $7/month (Starter)
- **Production**: $25/month (Standard)
- **MCP Server**: $25/month (Standard)
- **Total**: $57/month

## Troubleshooting

### Build Fails

- Check build logs in Render dashboard
- Verify package.json dependencies
- Check Node version compatibility

### MCP Connection Issues

- Verify MCP_SERVER_URL is correct
- Check CORS_ORIGINS includes your domain
- Verify JWT_SECRET matches

### Database Connection Fails

- Verify DATABASE_URL is correct
- Check Neon dashboard for connection limits
- Ensure SSL mode is set correctly

## Next Steps

1. ✅ Deploy all three environments
2. ✅ Configure auto-deploy
3. ✅ Verify MCP integration
4. ✅ Test health endpoints
5. ⬜ Set up monitoring alerts
6. ⬜ Configure custom domains
7. ⬜ Enable zero-downtime deploys
