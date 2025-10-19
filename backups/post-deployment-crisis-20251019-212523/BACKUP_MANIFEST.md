# Post-Deployment Crisis Backup Manifest

**Backup Date**: October 19, 2025 21:25:23 UTC
**Backup ID**: post-deployment-crisis-20251019-212523
**Git Tag**: post-deployment-crisis-baseline
**Purpose**: Complete backup after EPIC-DEPLOY-CRISIS resolution + CapLiquify Phases 1-2

---

## 📊 Project State

### Application Status
- **Name**: CapLiquify (formerly Sentia Manufacturing Dashboard)
- **Architecture**: Multi-tenant SaaS (Phases 1-2 complete)
- **Database**: PostgreSQL with multi-tenant schema design
- **Authentication**: Clerk with correct publishable key configured
- **Deployment**: Render (100% operational - all services healthy)

### Git Information
- **Repository**: https://github.com/The-social-drink-company/sentia-ai-manufacturing-app
- **Branch**: main
- **Commit**: 4a82b8a2 (4a82b8a248c190c9dbd99b24ffb03c3204bf8e89)
- **Tag**: post-deployment-crisis-baseline
- **Previous Backup**: pre-capliquify-baseline (commit 3bd285c8)

### Deployment Status
- **Backend**: ✅ Healthy (200 OK)
- **Frontend**: ✅ Live (200 OK)
- **MCP Server**: ✅ Healthy (200 OK)
- **Database**: ✅ Connected (PostgreSQL 17)

### Work Completed Since Last Backup
- ✅ EPIC-DEPLOY-CRISIS completed (6/6 incidents resolved)
- ✅ Clerk authentication fixed (correct publishable key)
- ✅ CapLiquify Phase 1 complete (Multi-tenant schema design)
- ✅ CapLiquify Phase 2 complete (Backend transformation)
- ✅ Tailwind CSS fixed (downgrade v4 → v3)
- ✅ Comprehensive documentation created

---

## 📁 Backup Contents

### 1. Git Repository Baseline
- **Git Tag**: `post-deployment-crisis-baseline`
- **GitHub URL**: https://github.com/The-social-drink-company/sentia-ai-manufacturing-app/releases/tag/post-deployment-crisis-baseline
- **Commits Since Previous Backup**: 10 commits
- **Files Changed**: 60+ files

### 2. Database Schemas
- **Single-Tenant Schema**: `schema.prisma` (1,117 lines)
- **Multi-Tenant Schema**: `schema-multi-tenant.prisma` (600+ lines)
- **Status**: Both schemas backed up

### 3. Documentation
- **BMAD Retrospectives**: 6 incidents documented
- **Epic Documentation**: EPIC-DEPLOY-CRISIS complete
- **Deployment Summary**: DEPLOYMENT_SUCCESS_SUMMARY.md
- **CapLiquify Docs**: Phase 1-2 retrospectives

---

## 🔄 Restoration Options

### Option 1: Restore to SAME GitHub Repository

**Quick Rollback**:
```bash
# Checkout this backup tag
git checkout post-deployment-crisis-baseline

# Create restore branch
git checkout -b restore-post-crisis-$(date +%Y%m%d)

# Push to main (if needed)
git push origin restore-post-crisis-$(date +%Y%m%d):main --force
```

### Option 2: Restore to NEW GitHub Repository

**Complete Migration to New Repository**:

#### Step 1: Clone Current Repository
```bash
# Clone with full history
git clone https://github.com/The-social-drink-company/sentia-ai-manufacturing-app.git capliquify-backup

cd capliquify-backup

# Checkout backup tag
git checkout post-deployment-crisis-baseline
```

#### Step 2: Create New GitHub Repository
1. Go to https://github.com/new
2. Repository name: `capliquify-platform` (or your choice)
3. Description: "CapLiquify - Working Capital SaaS Platform (Restored from backup)"
4. Visibility: Private
5. **DO NOT** initialize with README
6. Click "Create repository"

#### Step 3: Push to New Repository
```bash
# Remove old remote
git remote remove origin

# Add new remote (replace with your new repo URL)
git remote add origin https://github.com/YOUR-USERNAME/capliquify-platform.git

# Push all branches
git push -u origin main

# Push all tags
git push origin --tags

# Verify
git remote -v
```

#### Step 4: Restore Environment Variables in Render

Since the new repository will trigger new Render deployments:

1. **Create New Render Services** (or update existing):
   - Go to https://dashboard.render.com
   - Create new Web Service for frontend
   - Create new Web Service for backend
   - Create new Web Service for MCP
   - Create new PostgreSQL database (or use existing)

2. **Configure Environment Variables**:

   **Frontend Service**:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuY2FwbGlxdWlmeS5jb20k
   VITE_API_BASE_URL=https://YOUR-BACKEND-URL.onrender.com
   VITE_DEVELOPMENT_MODE=false
   ```

   **Backend Service**:
   ```
   DATABASE_URL=(auto-injected by Render)
   CLERK_SECRET_KEY=(get new key from Clerk dashboard)
   NODE_ENV=production
   PORT=10000
   ```

   **MCP Service**:
   ```
   DATABASE_URL=(auto-injected by Render)
   PORT=10000
   ```

3. **Update GitHub Integration**:
   - In Render dashboard, connect to your new GitHub repository
   - Set branch to `main`
   - Enable auto-deploy on push

#### Step 5: Update Domain (if using custom domain)
```bash
# If using capliquify.com:
# 1. Go to Render dashboard
# 2. Select frontend service
# 3. Go to "Settings" → "Custom Domain"
# 4. Add your domain
# 5. Update DNS records as instructed
```

#### Step 6: Verify New Deployment
```bash
# Check all services
curl https://YOUR-BACKEND.onrender.com/api/health
curl https://YOUR-MCP.onrender.com/health
curl -I https://YOUR-FRONTEND.onrender.com

# All should return 200 OK
```

---

## 🆘 Emergency Full Restore Procedure

**If main repository is corrupted/lost, follow these steps**:

### 1. Clone from Backup Tag
```bash
# Clone specific tag only (faster)
git clone --branch post-deployment-crisis-baseline --single-branch \
  https://github.com/The-social-drink-company/sentia-ai-manufacturing-app.git \
  capliquify-emergency-restore

cd capliquify-emergency-restore
```

### 2. Verify Backup Integrity
```bash
# Check commit hash
git log --oneline -1
# Should show: 4a82b8a2

# Check schemas exist
ls -lh backups/post-deployment-crisis-20251019-212523/
# Should show: schema.prisma, schema-multi-tenant.prisma

# Verify Prisma schema
npx prisma validate
```

### 3. Create New Repository
Follow **Option 2: Step 2** above to create new GitHub repository

### 4. Push Backup to New Repository
```bash
# Remove old remote
git remote remove origin

# Add NEW repository
git remote add origin https://github.com/YOUR-ORG/capliquify-platform-restored.git

# Push everything
git push -u origin main --force
git push origin --tags
```

### 5. Deploy to Render
Follow **Option 2: Step 4** above for Render configuration

---

## 📋 Backup Comparison

| Aspect | Pre-CapLiquify Backup | Post-Deployment Crisis (THIS) |
|--------|----------------------|-------------------------------|
| **Git Tag** | `pre-capliquify-baseline` | `post-deployment-crisis-baseline` |
| **Commit** | `3bd285c8` | `4a82b8a2` |
| **Status** | BMAD-DEPLOY-006 in progress | All incidents resolved ✅ |
| **Schema** | Single-tenant only | Single + Multi-tenant |
| **Commits** | Baseline | +10 commits |
| **CapLiquify** | Not started | Phases 1-2 complete |
| **Clerk** | Wrong key | Correct key ✅ |
| **Tailwind** | v4 (broken) | v3 (fixed) ✅ |

---

## 🔐 Security Checklist for New Repository

If restoring to a NEW repository, ensure:

### Secrets Management
- [ ] Rotate ALL Clerk keys (new repository = new secrets)
- [ ] Generate new `CLERK_SECRET_KEY` in Clerk dashboard
- [ ] Keep `VITE_CLERK_PUBLISHABLE_KEY` same (or update domain)
- [ ] Update Render environment variables with new secrets
- [ ] Delete old Render services if migrating completely

### Access Control
- [ ] Update GitHub repository collaborators
- [ ] Review Render service permissions
- [ ] Update Clerk application domains (if domain changes)
- [ ] Configure new webhook URLs (if any)

### DNS & Domains
- [ ] Update domain DNS to point to new Render services
- [ ] Update Clerk allowed domains
- [ ] Update CORS origins in backend

---

## 📊 Files Included in This Backup

### Schemas
```
backups/post-deployment-crisis-20251019-212523/
├── schema.prisma (36 KB - single-tenant)
├── schema-multi-tenant.prisma (15 KB - multi-tenant)
└── BACKUP_MANIFEST.md (this file)
```

### Git Tag Contents
All files from commit `4a82b8a2`:
- Complete codebase (src/, server/, sentia-mcp-server/)
- All BMAD documentation (6 retrospectives + epic)
- Deployment configuration (render.yaml)
- Environment references (ENVIRONMENT_VARS.md)
- CapLiquify Phase 1-2 work

---

## ⚡ Quick Reference Commands

### Restore to Current Repo
```bash
git checkout post-deployment-crisis-baseline
git checkout -b restore-$(date +%Y%m%d)
```

### Restore to New Repo
```bash
git clone https://github.com/The-social-drink-company/sentia-ai-manufacturing-app.git new-repo
cd new-repo
git checkout post-deployment-crisis-baseline
git remote set-url origin https://github.com/YOUR-ORG/new-repo.git
git push -u origin main --force
git push origin --tags
```

### Verify Backup
```bash
git log --oneline -10
git show post-deployment-crisis-baseline
ls -lh backups/post-deployment-crisis-20251019-212523/
```

---

## 🎯 What This Backup Preserves

### ✅ Preserved
- All source code (React frontend, Node.js backend, MCP server)
- Database schemas (single-tenant + multi-tenant)
- Render deployment configuration
- Complete git history (all commits)
- All BMAD documentation
- CapLiquify Phases 1-2 implementation
- Clerk authentication fix
- Tailwind CSS fix

### ⚠️ NOT Preserved (External Systems)
- Actual database DATA (create backup via Render dashboard)
- Clerk API keys (rotate when restoring to new repo)
- Render service configurations (recreate manually)
- Environment variable VALUES (documented but not stored)
- Custom domain DNS records (update manually)

---

## 📞 Additional Resources

### GitHub
- **Original Repo**: https://github.com/The-social-drink-company/sentia-ai-manufacturing-app
- **Backup Tag**: https://github.com/The-social-drink-company/sentia-ai-manufacturing-app/releases/tag/post-deployment-crisis-baseline

### Dashboards
- **Render**: https://dashboard.render.com
- **Clerk**: https://dashboard.clerk.com

### Documentation
- **DEPLOYMENT_SUCCESS_SUMMARY.md**: Complete deployment status
- **EPIC-DEPLOY-CRISIS.md**: All 6 incidents documented
- **CLAUDE.md**: Project instructions and context

---

## ✅ Backup Verification Checklist

- [x] Git tag created and will be pushed to GitHub
- [x] Schemas backed up (single + multi-tenant)
- [x] Restoration procedures documented (same repo + new repo)
- [x] Emergency restore procedure included
- [x] Security checklist for new repository
- [x] Environment variables reference included
- [x] All critical files preserved in git tag

---

**Created by**: Claude Code BMAD-METHOD v6a Agent
**Backup Type**: Post-deployment crisis resolution
**Restoration Priority**: CRITICAL
**Expiration**: Never (keep as stable baseline)
**Next Backup Recommended**: After CapLiquify Phase 3 completion
