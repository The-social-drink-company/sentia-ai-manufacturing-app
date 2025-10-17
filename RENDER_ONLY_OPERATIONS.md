# RENDER-ONLY OPERATIONS GUIDE

## No Local Development - 100% Cloud Operations

---

## 🚀 IMPORTANT: WE ARE NOW 100% RENDER-BASED

**No local development environment needed or supported**

---

## 📍 LIVE ENVIRONMENTS

### Production Environment

- **URL**: https://sentia-manufacturing-production.onrender.com
- **Branch**: `production`
- **Database**: `sentia-db-production`
- **Status**: LIVE - Client Operations

### Testing/UAT Environment

- **URL**: https://sentia-manufacturing-testing.onrender.com
- **Branch**: `test`
- **Database**: `sentia-db-testing`
- **Status**: LIVE - User Acceptance Testing

### Development Environment

- **URL**: https://sentia-manufacturing-development.onrender.com
- **Branch**: `development`
- **Database**: `sentia-db-development`
- **Status**: LIVE - Active Development

### MCP AI Server

- **URL**: https://mcp-server-tkyu.onrender.com
- **Service ID**: srv-d34fefur433s73cifuv0
- **Branch**: `development`
- **Status**: LIVE - AI Central Nervous System

---

## 🔧 HOW TO WORK WITH RENDER-ONLY SETUP

### Making Code Changes

1. **Edit code** in your preferred editor (VS Code, etc.)
2. **Commit and push** to the appropriate branch:
   ```bash
   git add .
   git commit -m "Your change description"
   git push origin development  # or test/production
   ```
3. **Render automatically deploys** within 2-5 minutes
4. **Monitor deployment** at https://dashboard.render.com

### Deployment Flow

```
Code Change → Push to GitHub → Render Auto-Deploy → Live in 2-5 mins
```

### Branch Strategy

- `development` → Make all changes here first
- `test` → Merge from development for UAT
- `production` → Merge from test after approval

---

## 🎯 OPERATIONAL WORKFLOWS

### For Development Work

```bash
# 1. Make your changes locally
# 2. Push to development branch
git checkout development
git add .
git commit -m "feat: Your new feature"
git push origin development

# 3. View changes at:
# https://sentia-manufacturing-development.onrender.com
```

### For Testing/UAT

```bash
# 1. Merge development to test
git checkout test
git merge development
git push origin test

# 2. Test at:
# https://sentia-manufacturing-testing.onrender.com
```

### For Production Release

```bash
# 1. After UAT approval, merge to production
git checkout production
git merge test
git push origin production

# 2. Live at:
# https://sentia-manufacturing-production.onrender.com
```

---

## 📊 MONITORING & LOGS

### View Logs

1. Go to https://dashboard.render.com
2. Select your service
3. Click "Logs" in the left sidebar

### Health Checks

- Development: https://sentia-manufacturing-development.onrender.com/health
- Testing: https://sentia-manufacturing-testing.onrender.com/health
- Production: https://sentia-manufacturing-production.onrender.com/health
- MCP Server: https://mcp-server-tkyu.onrender.com/health

---

## 🔑 ENVIRONMENT VARIABLES

### Managing Environment Variables

1. Go to https://dashboard.render.com
2. Select your service
3. Click "Environment" in the left sidebar
4. Add/Update variables
5. Service automatically redeploys

### Key Variables (Already Configured)

- ✅ Database connections (DATABASE_URL)
- ✅ API keys (Xero, Shopify, Unleashed, OpenAI, Anthropic)
- ✅ Authentication (Clerk)
- ✅ All other integrations

---

## 🚨 TROUBLESHOOTING

### If deployment fails:

1. Check Render dashboard for error logs
2. Review recent commits
3. Rollback if needed (Render dashboard → "Rollback")

### If site is down:

1. Check https://status.render.com
2. View service logs in Render dashboard
3. Check health endpoint

### Database issues:

1. Verify DATABASE_URL in environment variables
2. Check database status in Render dashboard
3. Run migrations if needed (automatic on deploy)

---

## ❌ NO LONGER NEEDED

### Remove These Local Commands

- ❌ `npm run dev` - No local development
- ❌ `npm run dev:client` - No local frontend
- ❌ `npm run dev:server` - No local backend
- ❌ `localhost:3000` - Not used
- ❌ `localhost:5000` - Not used
- ❌ Docker - Not needed
- ❌ Local PostgreSQL - Using Render databases
- ❌ `.env` files - All config in Render

---

## ✅ DAILY OPERATIONS CHECKLIST

### For Developers

1. Push code to `development` branch
2. Wait 2-5 minutes for auto-deploy
3. Test at development URL
4. Merge to `test` when ready

### For Testers

1. Access testing URL
2. Perform UAT
3. Report issues via GitHub
4. Approve for production

### For Operations

1. Monitor all three environments
2. Check health endpoints daily
3. Review logs for errors
4. Manage environment variables as needed

---

## 📱 CLIENT ACCESS

### Production Dashboard

- **URL**: https://sentia-manufacturing-production.onrender.com
- **Login**: Use Clerk authentication
- **Data**: 100% real, live data from all APIs

### Support

- **Logs**: Available in Render dashboard
- **Monitoring**: Health checks active
- **Updates**: Auto-deploy from `production` branch

---

## 🎯 QUICK REFERENCE

| Environment | URL                                                   | Branch      | Auto-Deploy |
| ----------- | ----------------------------------------------------- | ----------- | ----------- |
| Development | https://sentia-manufacturing-development.onrender.com | development | ✅          |
| Testing     | https://sentia-manufacturing-testing.onrender.com     | test        | ✅          |
| Production  | https://sentia-manufacturing-production.onrender.com  | production  | ✅          |
| MCP Server  | https://mcp-server-tkyu.onrender.com                  | development | ✅          |

---

## 🚀 KEY POINTS TO REMEMBER

1. **NO LOCAL SETUP REQUIRED** - Everything runs on Render
2. **AUTO-DEPLOY ENABLED** - Push to branch = automatic deployment
3. **100% REAL DATA** - No mock data anywhere
4. **FULL MONITORING** - Logs and health checks available
5. **ENTERPRISE READY** - Production-grade infrastructure

---

**Last Updated**: December 19, 2024
**Status**: FULLY OPERATIONAL ON RENDER
**Local Development**: DISCONTINUED
