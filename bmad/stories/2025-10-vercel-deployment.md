# BMAD Story: Deploy to Vercel (Alternative Platform)

**Story ID**: BMAD-INFRA-003-S1
**Epic**: BMAD-INFRA-003 - Deployment Infrastructure Resolution
**Created**: 2025-10-19
**Status**: Phase 2 - Planning → Phase 3 - Solutioning
**Priority**: CRITICAL
**Estimated Time**: 2-4 hours

---

## 📋 Story Summary

**As a** development team
**I want to** deploy the application to Vercel
**So that** we can verify completed work and unblock the deployment pipeline

**Acceptance Criteria**:
- [ ] Vercel project created from GitHub repository
- [ ] Environment variables configured
- [ ] Main branch deployed successfully (commit `9c41a83d`)
- [ ] Health endpoint returns 200 OK
- [ ] Import/Export UI accessible and functional
- [ ] Dashboard Layout Components render correctly
- [ ] No deployment errors or console errors

---

## 🎯 Context

**Current Blocker**: Render service suspended - cannot deploy or verify:
- Import/Export UI (BMAD-UI-001) - completed 2025-10-18
- Dashboard Layout Components (BMAD-INFRA-002) - completed 2025-10-19

**Solution**: Deploy to Vercel as alternative platform while Render issue is resolved.

---

## 📊 Phase 3: SOLUTIONING (Architecture Design)

### Vercel Deployment Architecture

```
GitHub Repository (main branch)
         ↓
    Vercel Project
         ↓
    Build Process
    ├── Install: pnpm install
    ├── Build: pnpm run build
    └── Start: node server.js
         ↓
    Deployed Application
    ├── Frontend: React app (Vite build)
    ├── Backend: Express API server
    ├── Database: PostgreSQL (external)
    └── Redis: Optional (for caching)
         ↓
    Public URL: https://[project-name].vercel.app
```

### Configuration Requirements

**1. Vercel Project Settings**:
```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "vite"
}
```

**2. Environment Variables** (copy from Render):
```bash
# Node.js
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=[PostgreSQL connection string]

# Clerk Authentication
CLERK_SECRET_KEY=[from Render]
VITE_CLERK_PUBLISHABLE_KEY=[from Render]

# API Keys (if needed)
VITE_API_BASE_URL=https://[project-name].vercel.app/api

# Redis (optional)
REDIS_URL=[if using Redis]
```

**3. Build Configuration** (`vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ]
}
```

### Database Strategy

**Option A: Use Existing Render PostgreSQL** (RECOMMENDED)
- ✅ No data migration needed
- ✅ Preserves existing data
- ✅ Vercel connects to external DB
- ⚠️ Render DB must be accessible from Vercel

**Option B: Create New Vercel Postgres**
- ✅ Isolated from Render
- ✅ Managed by Vercel
- ❌ Requires data migration
- ❌ Additional cost if exceeds free tier

**DECISION**: Use Option A (Render PostgreSQL) - connection string in environment variables

---

## 🚀 Phase 4: IMPLEMENTATION PLAN

### Step 1: Prepare Vercel Configuration Files

**Create `vercel.json`** in project root:
```json
{
  "version": 2,
  "buildCommand": "pnpm run build",
  "devCommand": "pnpm run dev",
  "installCommand": "corepack enable && pnpm install --frozen-lockfile",
  "framework": null,
  "outputDirectory": "dist",
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "server.js": {
      "maxDuration": 30
    }
  },
  "routes": [
    { "handle": "filesystem" },
    { "src": "/api/.*", "dest": "/server.js" },
    { "src": "/(.*)", "dest": "/dist/index.html" }
  ]
}
```

**Update `package.json`** (if needed):
```json
{
  "scripts": {
    "build": "prisma generate && vite build",
    "start": "node server.js",
    "vercel-build": "prisma generate && vite build"
  }
}
```

### Step 2: Create Vercel Project

**Via Vercel CLI**:
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link

# Add environment variables
vercel env add DATABASE_URL
vercel env add CLERK_SECRET_KEY
vercel env add VITE_CLERK_PUBLISHABLE_KEY
# ... add all required env vars

# Deploy
vercel --prod
```

**Via Vercel Dashboard** (RECOMMENDED for first-time):
1. Go to https://vercel.com/new
2. Import GitHub repository
3. Configure project settings
4. Add environment variables
5. Deploy

### Step 3: Configure Environment Variables

**Required Variables** (copy from Render dashboard):
- `NODE_ENV`: production
- `DATABASE_URL`: [Render PostgreSQL connection string]
- `CLERK_SECRET_KEY`: [from Render]
- `VITE_CLERK_PUBLISHABLE_KEY`: [from Render]
- `VITE_API_BASE_URL`: https://[vercel-project].vercel.app/api
- `PORT`: 3000 (Vercel default)

**Optional Variables**:
- `REDIS_URL`: [if using Redis]
- `LOG_LEVEL`: info
- API keys for integrations (Shopify, Xero, etc.)

### Step 4: Deploy and Verify

**Deployment**:
```bash
vercel --prod
```

**Verification Checklist**:
- [ ] Build completes without errors
- [ ] Deployment URL generated
- [ ] Health endpoint: `GET https://[project].vercel.app/health`
- [ ] Frontend loads: `GET https://[project].vercel.app/`
- [ ] Import Wizard: `GET https://[project].vercel.app/app/admin/import`
- [ ] Export Builder: `GET https://[project].vercel.app/app/admin/export`
- [ ] Dashboard Layout: Check for new header components
- [ ] Browser console: No errors

### Step 5: Smoke Testing

**Test Scenarios**:
1. **Authentication**:
   - Navigate to application
   - Verify Clerk login works
   - Check user role permissions

2. **Import/Export UI** (BMAD-UI-001):
   - Navigate to /app/admin/import
   - Verify 6-step wizard renders
   - Check file upload zone
   - Verify role-based access

3. **Dashboard Layout** (BMAD-INFRA-002):
   - Load main dashboard
   - Check new DashboardHeader renders
   - Test NotificationDropdown functionality
   - Verify SystemStatusBadge displays

4. **API Endpoints**:
   - Test /api/health
   - Test database connectivity
   - Verify external API integrations (if applicable)

### Step 6: Documentation

**Update Deployment Documentation**:
- Document Vercel URL
- Update CLAUDE.md with Vercel deployment info
- Create rollback procedure
- Document environment variables

---

## 📋 Tasks (Implementation Checklist)

### Prerequisites
- [ ] Vercel account created (or access granted)
- [ ] Vercel CLI installed: `npm install -g vercel`
- [ ] GitHub repository access verified
- [ ] Render PostgreSQL connection string retrieved

### Configuration
- [ ] Create `vercel.json` configuration file
- [ ] Update `package.json` with vercel-build script
- [ ] Test build locally: `pnpm run build`
- [ ] Commit configuration files to main branch

### Deployment
- [ ] Login to Vercel: `vercel login`
- [ ] Link project: `vercel link` OR import via dashboard
- [ ] Configure environment variables via dashboard
- [ ] Deploy to production: `vercel --prod`
- [ ] Verify deployment URL generated

### Verification
- [ ] Health check: https://[project].vercel.app/health returns 200
- [ ] Frontend loads without errors
- [ ] Import/Export UI accessible
- [ ] Dashboard Layout renders correctly
- [ ] Authentication works (Clerk integration)
- [ ] Database connectivity verified
- [ ] No console errors

### Documentation
- [ ] Update CLAUDE.md with Vercel URL
- [ ] Document deployment process
- [ ] Create environment variable guide
- [ ] Update deployment checklist

---

## 🎯 Success Criteria

**Deployment Success**:
- ✅ Vercel build completes in < 5 minutes
- ✅ No build errors or warnings
- ✅ Deployment URL accessible
- ✅ Health endpoint returns 200 OK
- ✅ All environment variables configured

**Functional Success**:
- ✅ Import Wizard page loads and renders 6 steps
- ✅ Export Builder page loads and renders form
- ✅ Dashboard Header, NotificationDropdown, SystemStatusBadge render
- ✅ Sidebar navigation shows Import/Export links with "New" badges
- ✅ Clerk authentication functional
- ✅ Database queries work
- ✅ No JavaScript console errors

**Documentation Success**:
- ✅ Vercel deployment documented in CLAUDE.md
- ✅ Environment variables documented
- ✅ Rollback procedure created
- ✅ Alternative deployment strategy recorded

---

## 🔄 Rollback Plan

**If Vercel Deployment Fails**:
1. Document error messages and logs
2. Revert configuration files if needed
3. Consider Option 4: New Render Service
4. Or proceed with Option 3: Local Docker environment

**If Vercel Works but Issues Found**:
1. Create hotfix branch from main
2. Fix issues locally
3. Test thoroughly
4. Deploy hotfix to Vercel
5. Create PR to merge hotfix to main

---

## 📊 Estimated Timeline

| Phase | Tasks | Duration | Status |
|-------|-------|----------|--------|
| Phase 1: Analysis | Epic creation | 30 min | ✅ Complete |
| Phase 2: Planning | Story creation | 30 min | ✅ Complete |
| **Phase 3: Solutioning** | **Architecture design** | **30 min** | **In Progress** |
| Phase 4: Implementation | Vercel setup + deploy | 1-2 hours | Pending |
| Phase 5: Verification | Smoke testing + docs | 30-60 min | Pending |

**Total**: 2.5-4 hours

---

## 🚀 READY FOR PHASE 4: IMPLEMENTATION

**Next Actions**:
1. Create `vercel.json` configuration file
2. Commit to main branch
3. Create Vercel project from GitHub
4. Configure environment variables
5. Deploy to production
6. Verify deployment successful

---

**Created**: 2025-10-19 09:35 BST
**Last Updated**: 2025-10-19 09:35 BST
**Status**: Phase 3 COMPLETE → Ready for Phase 4 (Implementation)
**Framework**: BMAD-METHOD v6a
**Epic**: BMAD-INFRA-003
