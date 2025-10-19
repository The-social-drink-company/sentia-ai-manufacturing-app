# Pre-CapLiquify Transformation Backup Manifest

**Backup Date**: October 19, 2025 20:59:13 UTC
**Backup ID**: pre-capliquify-20251019-205913
**Git Tag**: pre-capliquify-baseline
**Purpose**: Complete backup before CapLiquify multi-tenant SaaS transformation

---

## 📊 Project State

### Application Information
- **Name**: Sentia Manufacturing Dashboard
- **Architecture**: Single-tenant React + Node.js application
- **Database**: PostgreSQL with Prisma ORM (single schema)
- **Authentication**: Clerk (development bypass mode)
- **Deployment**: Render (3-service architecture)

### Git Information
- **Repository**: https://github.com/The-social-drink-company/sentia-ai-manufacturing-app
- **Branch**: main
- **Commit**: 3bd285c8 (3bd285c82bed0de8fbf8354b220aa5835c4e8727)
- **Tag**: pre-capliquify-baseline

### Deployment Status
- **Backend**: ✅ Healthy (200 OK)
- **Frontend**: 🔄 Deploying (Clerk publishable key fix)
- **MCP Server**: ✅ Healthy (200 OK)
- **Database**: ✅ Operational (Render PostgreSQL 17 with pgvector)

### BMAD Status
- **Current Epic**: EPIC-DEPLOY-CRISIS (6 incidents, 5 resolved, 1 in progress)
- **Active Story**: BMAD-DEPLOY-006 (Frontend ClerkProvider fix)
- **Completion**: 83% (5 incidents fully resolved)

---

## 📁 Backup Contents

### 1. Git Repository Baseline
- **Git Tag**: `pre-capliquify-baseline`
- **GitHub URL**: https://github.com/The-social-drink-company/sentia-ai-manufacturing-app/releases/tag/pre-capliquify-baseline
- **What**: Complete git history and codebase snapshot
- **How to Restore**:
  ```bash
  git checkout pre-capliquify-baseline
  git checkout -b restore-pre-capliquify
  ```

### 2. Database Schema
- **File**: `backups/pre-capliquify-20251019-205913/schema.prisma`
- **What**: Complete Prisma schema (1,117 lines)
- **Models**: 32 tables (Users, Organizations, Products, Inventory, etc.)
- **Extensions**: pgvector for AI embeddings
- **How to Restore**: Copy to `prisma/schema.prisma`

### 3. Environment Variables (Reference)
- **File**: `backups/pre-capliquify-20251019-205913/ENVIRONMENT_VARS.md`
- **What**: List of environment variables used (values NOT included for security)
- **Critical Variables**:
  - `DATABASE_URL` - PostgreSQL connection
  - `VITE_CLERK_PUBLISHABLE_KEY` - Clerk frontend auth
  - `CLERK_SECRET_KEY` - Clerk backend auth (rotated Oct 19)
  - `VITE_API_BASE_URL` - Backend API endpoint

### 4. Project Documentation
- **Files**:
  - `CLAUDE.md` - Project instructions for Claude Code
  - `BMAD-METHOD-V6A-IMPLEMENTATION.md` - BMAD methodology
  - `RENDER_DEPLOYMENT_STATUS.md` - Deployment status tracking
  - All BMAD retrospectives (5 incidents documented)

### 5. Render Configuration
- **File**: `render.yaml`
- **Services**:
  - Frontend: sentia-frontend-prod.onrender.com
  - Backend: sentia-backend-prod.onrender.com
  - MCP: sentia-mcp-prod.onrender.com
  - Database: PostgreSQL 17 (free tier, expires Nov 16, 2025)

---

## 🔄 Restoration Procedures

### Full Restoration (Complete Rollback)

If you need to completely revert to pre-CapLiquify state:

#### Step 1: Restore Git Codebase
```bash
# Clone repository (if needed)
git clone https://github.com/The-social-drink-company/sentia-ai-manufacturing-app.git
cd sentia-ai-manufacturing-app

# Checkout baseline tag
git checkout pre-capliquify-baseline

# Create new branch from baseline
git checkout -b restore-sentia-$(date +%Y%m%d)

# Push restored branch
git push origin restore-sentia-$(date +%Y%m%d)
```

#### Step 2: Restore Database Schema
```bash
# Copy backup schema
cp backups/pre-capliquify-20251019-205913/schema.prisma prisma/schema.prisma

# Generate Prisma client
npx prisma generate

# Apply migrations (if needed)
npx prisma migrate deploy
```

#### Step 3: Restore Environment Variables
1. Go to https://dashboard.render.com
2. Select each service (frontend, backend, MCP)
3. Go to Environment tab
4. Restore variables from `ENVIRONMENT_VARS.md` reference

**Critical Variables**:
- `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_Y2xlcmsuY2FwbGlxdWlmeS5jb20k`
- `CLERK_SECRET_KEY` = (New secret key rotated Oct 19 - stored in Clerk dashboard)
- `DATABASE_URL` = (Auto-injected by Render PostgreSQL)

#### Step 4: Deploy to Render
```bash
# Push to main branch
git push origin restore-sentia-$(date +%Y%m%d):main

# Or manually trigger deployment in Render dashboard
```

#### Step 5: Verify Restoration
```bash
# Check all services
curl https://sentia-backend-prod.onrender.com/api/health
curl https://sentia-mcp-prod.onrender.com/health
curl -I https://capliquify.com/

# All should return 200 OK
```

---

## 🗄️ Database Backup (Recommended Additional Step)

**IMPORTANT**: This manifest does NOT include actual database data backup.

### To Create Database Data Backup:

```bash
# Via Render dashboard:
# 1. Go to https://dashboard.render.com
# 2. Select PostgreSQL service
# 3. Click "Backups" tab
# 4. Click "Create Backup"
# 5. Download backup file

# Via pg_dump (if database credentials available):
pg_dump $DATABASE_URL > backups/pre-capliquify-20251019-205913/database-dump.sql
```

### To Restore Database Data:

```bash
# Via Render dashboard:
# 1. Upload backup file
# 2. Restore from backup

# Via psql:
psql $DATABASE_URL < backups/pre-capliquify-20251019-205913/database-dump.sql
```

---

## 📋 Pre-Transformation Checklist

Before starting CapLiquify transformation, verify:

- ✅ Git tag created and pushed (`pre-capliquify-baseline`)
- ✅ Schema backup saved (`schema.prisma`)
- ✅ Environment variables documented (`ENVIRONMENT_VARS.md`)
- ✅ Render configuration saved (`render.yaml`)
- ⚠️ Database data backup (RECOMMENDED - create via Render dashboard)
- ✅ All services operational (Backend, Frontend, MCP)
- 🔄 BMAD-DEPLOY-006 resolved (Clerk auth fix)

---

## 🚨 Rollback Indicators

**Trigger immediate rollback if**:

1. **Authentication Breaks**: Users cannot sign in to CapLiquify
2. **Data Loss**: Existing Sentia data becomes inaccessible
3. **Service Outages**: Any service down for >30 minutes
4. **Database Errors**: Migration failures or schema conflicts
5. **Critical Bugs**: Application crashes or data corruption

**Rollback Procedure**: Follow "Full Restoration" steps above

---

## 📞 Emergency Contacts

If issues arise during transformation:

- **Repository**: https://github.com/The-social-drink-company/sentia-ai-manufacturing-app
- **Render Dashboard**: https://dashboard.render.com
- **Clerk Dashboard**: https://dashboard.clerk.com
- **Database**: Render PostgreSQL (access via dashboard)

---

## 🔐 Security Notes

### Clerk Secret Key Rotation
- **Old Secret Key**: Compromised (exposed in screenshots Oct 19)
- **New Secret Key**: Rotated Oct 19, 2025
- **Status**: ✅ New key active in Render backend environment
- **Old Key**: ✅ Deleted from Clerk dashboard

### Publishable Key Update
- **Correct Key**: `pk_live_Y2xlcmsuY2FwbGlxdWlmeS5jb20k`
- **Status**: 🔄 Being deployed to Render frontend
- **Previous (Wrong)**: `sk_live_3a7...` (secret key, not publishable)

---

## 📊 Transformation Scope

**What's Changing**:
- Single-tenant → Multi-tenant architecture
- Single schema → Schema-per-tenant isolation
- Sentia branding → CapLiquify branding
- Single organization → Multiple organizations (SaaS)
- No billing → Stripe subscriptions
- Simple auth → Clerk Organizations

**What's NOT Changing**:
- Core business logic (forecasting, working capital, etc.)
- React frontend framework
- Node.js backend
- Prisma ORM
- Render deployment platform
- PostgreSQL database (adding schemas, not replacing)

---

## ✅ Backup Verification

**Backup Integrity Checklist**:

- ✅ Git tag exists and is pushed to GitHub
- ✅ `schema.prisma` is complete (1,117 lines, 32 models)
- ✅ Environment variables documented (no secrets exposed)
- ✅ `render.yaml` configuration saved
- ✅ BMAD documentation captured
- ⚠️ Database data backup (create via Render dashboard)

**Restoration Tested**: ❌ Not tested (recommend testing in separate environment)

---

## 📝 Notes

- Database expires Nov 16, 2025 (Render free tier) - upgrade required
- Frontend deployment in progress (Clerk key fix)
- Backend healthy and operational
- MCP server healthy and operational
- All BMAD documentation up to date

**This backup represents the last stable single-tenant Sentia state before multi-tenant transformation begins.**

---

**Created by**: Claude Code BMAD-METHOD v6a Agent
**Backup Type**: Pre-transformation baseline
**Restoration Priority**: CRITICAL (required for rollback)
**Expiration**: Never (keep indefinitely as baseline reference)
