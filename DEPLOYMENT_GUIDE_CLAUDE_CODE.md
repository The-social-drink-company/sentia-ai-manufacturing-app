# Sentia Dashboard - Comprehensive Deployment Guide

## Using Claude Code in VSCode

**Complete step-by-step guide for deploying and managing the CapLiquify Manufacturing Platform**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Daily Development Workflow](#daily-development-workflow)
5. [Deployment Workflows](#deployment-workflows)
6. [Emergency Procedures](#emergency-procedures)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What This Guide Covers

This guide provides complete instructions for deploying the CapLiquify Manufacturing Platform using Claude Code slash commands in VSCode. It's designed for both new developers and ongoing maintenance.

### Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Your Development                       │
│                   (Local Machine)                         │
│                                                           │
│  VSCode + Claude Code Extension                          │
│  ├── Code Editor                                         │
│  ├── Claude Code Chat (Slash Commands)                  │
│  └── Git Integration                                     │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ git push
                       ↓
┌──────────────────────────────────────────────────────────┐
│                    GitHub Repository                      │
│   github.com/The-social-drink-company/                   │
│                sentia-ai-manufacturing-app                │
│                                                           │
│  Branches:                                               │
│  ├── development  (main dev branch)                     │
│  ├── test         (UAT environment)                      │
│  └── production   (live environment)                     │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ auto-deploy
                       ↓
┌──────────────────────────────────────────────────────────┐
│                    Render Platform                        │
│                  (Cloud Hosting)                          │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Development                                        │ │
│  │ capliquify-frontend-prod.onrender.com   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Test                                               │ │
│  │ sentia-manufacturing-dashboard-test.onrender.com   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Production                                         │ │
│  │ sentia-...ashboard-production.onrender.com        │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Deployment Environments

| Environment | URL                                                                                                  | Branch        | Purpose                 | Auto-Deploy |
| ----------- | ---------------------------------------------------------------------------------------------------- | ------------- | ----------------------- | ----------- |
| Development | [sentia-...621h.onrender.com](https://capliquify-frontend-prod.onrender.com)                             | `development` | Daily development work  | ✅ Yes      |
| Test        | [sentia-...-test.onrender.com](https://sentia-manufacturing-dashboard-test.onrender.com)             | `test`        | User acceptance testing | ✅ Yes      |
| Production  | [sentia-...-production.onrender.com](https://sentia-manufacturing-dashboard-production.onrender.com) | `production`  | Live production         | ✅ Yes      |

---

## Prerequisites

### Required Software

1. **Node.js 18+**

   ```bash
   node --version  # Should show v18.x.x or higher
   ```

   Download: https://nodejs.org/

2. **pnpm Package Manager**

   ```bash
   npm install -g pnpm
   pnpm --version
   ```

3. **Git**

   ```bash
   git --version
   ```

   Download: https://git-scm.com/

4. **VSCode**
   Download: https://code.visualstudio.com/

5. **Claude Code Extension**
   Install from VSCode marketplace: "Claude Code"

### Required Access

- [ ] GitHub repository access
- [ ] Render dashboard access (https://dashboard.render.com)
- [ ] Clerk account access (for auth configuration)
- [ ] Environment variable access

### Recommended Tools

- GitHub Desktop (optional, for easier git management)
- Postman or similar (for API testing)
- Browser DevTools knowledge

---

## Initial Setup

### 1. Clone Repository

```bash
# Navigate to your projects folder
cd /path/to/your/projects

# Clone the repository
git clone https://github.com/The-social-drink-company/sentia-ai-manufacturing-app.git

# Navigate into project
cd sentia-ai-manufacturing-app

# Verify you're on development branch
git branch --show-current  # Should show: development
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

Expected output: List of installed dependencies with no errors

### 3. Set Up Environment Variables

```bash
# Copy template to create local env file
cp .env.template .env

# Edit .env with your local development values
code .env
```

**Important**: Never commit `.env` file to git. Only commit `.env.template` with placeholder values.

### 4. Verify Setup

Open Claude Code in VSCode and run:

```
/verify-deployment
```

This will check:

- ✅ Node.js version
- ✅ Dependencies installed
- ✅ Build process works
- ✅ Lint status
- ✅ Git configuration

Expected output:

```
✅ PASS: Environment setup complete
✅ PASS: Dependencies installed
✅ PASS: Build successful
⚠️ WARN: Some lint warnings (non-blocking)
✅ PASS: Git configured correctly

Overall: ✅ READY FOR DEVELOPMENT
```

### 5. Run Locally (Optional)

To test locally before deploying:

```bash
# Start development server
npm run dev

# Application will be available at:
# http://localhost:5173
```

---

## Daily Development Workflow

### Standard Development Cycle

```
Edit Code → Test Locally → Fix Lint → Deploy to Dev → Test in Dev → Repeat
```

### Step-by-Step Process

#### 1. Start Your Development Session

```bash
# Make sure you're on development branch
git checkout development

# Pull latest changes
git pull origin development

# Create feature branch (optional)
git checkout -b feature/my-new-feature
```

#### 2. Make Your Code Changes

Edit files in your code editor as needed.

#### 3. Test Locally (Recommended)

```bash
npm run dev
# Visit http://localhost:5173
# Test your changes
```

#### 4. Fix Any Lint Errors

In Claude Code:

```
/fix-lint
```

This will:

- Analyze all lint errors
- Fix critical issues
- Provide report of remaining issues

#### 5. Deploy to Development

In Claude Code:

```
/deploy-dev
```

What happens:

1. Claude checks your branch and git status
2. Commits any uncommitted changes (with your approval)
3. Pushes to origin/development
4. Render automatically deploys
5. You get URLs to monitor deployment

#### 6. Test in Development Environment

Wait 3-5 minutes for deployment, then:

- Visit: https://capliquify-frontend-prod.onrender.com
- Test your changes
- Check browser console for errors
- Verify functionality works

#### 7. Fix Issues and Repeat

If you find issues:

- Make fixes locally
- Run `/deploy-dev` again
- Test again

---

## Deployment Workflows

### Workflow A: Development Deployment (Most Common)

**Use when**: Making regular code changes

```
┌─────────────────────────────────────────────┐
│ 1. Make code changes                        │
├─────────────────────────────────────────────┤
│ 2. /fix-lint (if needed)                    │
├─────────────────────────────────────────────┤
│ 3. /deploy-dev                              │
├─────────────────────────────────────────────┤
│ 4. Wait 3-5 minutes                         │
├─────────────────────────────────────────────┤
│ 5. Test at dev URL                          │
├─────────────────────────────────────────────┤
│ 6. If issues, fix and repeat from step 1   │
└─────────────────────────────────────────────┘
```

### Workflow B: Test Deployment (Before Production)

**Use when**: Ready for user acceptance testing

```
┌─────────────────────────────────────────────┐
│ Prerequisites:                              │
│ ✅ Features stable in development          │
│ ✅ All known bugs fixed                    │
│ ✅ Lint errors resolved                    │
│ ✅ Manual testing completed                │
├─────────────────────────────────────────────┤
│ 1. /verify-deployment                       │
├─────────────────────────────────────────────┤
│ 2. /deploy-test                             │
├─────────────────────────────────────────────┤
│ 3. Confirm deployment (requires YES)       │
├─────────────────────────────────────────────┤
│ 4. Wait 3-5 minutes                         │
├─────────────────────────────────────────────┤
│ 5. Complete UAT checklist                   │
├─────────────────────────────────────────────┤
│ 6. Get stakeholder approval                 │
├─────────────────────────────────────────────┤
│ 7. Document any issues found               │
└─────────────────────────────────────────────┘
```

UAT Checklist (provided by `/deploy-test`):

- [ ] Application loads successfully
- [ ] Authentication works (Clerk or bypass)
- [ ] Dashboard displays data correctly
- [ ] Working Capital page functional
- [ ] Demand Forecasting operational
- [ ] Financial Reports accessible
- [ ] All navigation works
- [ ] No console errors
- [ ] Performance acceptable

### Workflow C: Production Deployment (Go Live)

**Use when**: Deploying to live production

⚠️ **HIGH RISK - FOLLOW ALL STEPS CAREFULLY**

```
┌─────────────────────────────────────────────┐
│ Prerequisites (MANDATORY):                  │
│ ✅ UAT completed successfully              │
│ ✅ Stakeholder approval obtained           │
│ ✅ All critical issues resolved            │
│ ✅ Test environment stable for 24+ hours   │
│ ✅ Rollback plan prepared                  │
│ ✅ NOT deploying on Friday                 │
├─────────────────────────────────────────────┤
│ 1. /verify-deployment                       │
├─────────────────────────────────────────────┤
│ 2. /health-check (verify all environments) │
├─────────────────────────────────────────────┤
│ 3. /deploy-prod                             │
├─────────────────────────────────────────────┤
│ 4. Answer ALL confirmation questions       │
├─────────────────────────────────────────────┤
│ 5. Type "DEPLOY TO PRODUCTION" to confirm  │
├─────────────────────────────────────────────┤
│ 6. Monitor deployment closely (5-10 min)   │
├─────────────────────────────────────────────┤
│ 7. Complete post-deployment verification   │
├─────────────────────────────────────────────┤
│ 8. Monitor for 30 minutes after deploy     │
├─────────────────────────────────────────────┤
│ 9. Notify stakeholders of successful deploy│
└─────────────────────────────────────────────┘
```

Post-Deployment Verification:

1. ✅ Application loads at production URL
2. ✅ /health endpoint returns 200
3. ✅ Authentication functional
4. ✅ Dashboard displays correctly
5. ✅ All critical features work
6. ✅ No JavaScript errors
7. ✅ Database connections working
8. ✅ External APIs responding
9. ✅ Performance acceptable
10. ✅ No error logs

---

## Emergency Procedures

### Emergency Rollback

**When to use**: Critical issues in production (P0/P1 severity)

#### Severity Levels

- **P0 (Critical)**: Application completely down, data loss risk
- **P1 (High)**: Major functionality broken, all users affected
- **P2 (Medium)**: Specific features broken, workarounds exist
- **P3 (Low)**: Minor issues, can wait for normal fix

**Only rollback for P0 or P1 issues**

#### Rollback Process

```
/rollback-production
```

Follow the prompts:

1. Describe the issue
2. Confirm severity level
3. Choose rollback method:
   - **Option A**: Git revert (safer, recommended)
   - **Option B**: Git reset (more aggressive)
   - **Option C**: Render dashboard rollback

4. Verify rollback successful
5. Create incident report
6. Notify stakeholders

#### Post-Rollback Actions

1. **Immediate** (within 5 minutes)
   - Verify production stable
   - Notify team
   - Update status page

2. **Within 1 hour**
   - Complete incident report
   - Document root cause
   - Plan fix

3. **Within 24 hours**
   - Implement fix in development
   - Test thoroughly
   - Deploy to test
   - Complete UAT
   - Schedule production retry

---

## Monitoring & Maintenance

### Daily Checks

Run once per day:

```
/health-check
```

This verifies:

- All environments responsive
- Health endpoints working
- API endpoints functional
- Performance metrics
- External integrations

### Weekly Maintenance

1. **Code Quality**

   ```
   /fix-lint
   ```

   Address code quality issues

2. **Dependency Updates**

   ```bash
   pnpm outdated
   pnpm update
   ```

   Keep dependencies current

3. **Security Audit**
   ```bash
   pnpm audit
   ```
   Check for security vulnerabilities

### Monthly Reviews

- Review deployment frequency
- Analyze error rates
- Check performance metrics
- Update documentation
- Plan technical debt cleanup

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Deployment Failed

**Symptoms**: Render shows build failure

**Solutions**:

1. Check Render build logs
2. Run `/verify-deployment` locally
3. Verify environment variables set
4. Check for syntax errors
5. Try clearing Render build cache

#### Issue: Application Won't Load

**Symptoms**: Blank screen or 502/503 errors

**Solutions**:

1. Run `/health-check` to diagnose
2. Check Render service status
3. Verify environment variables
4. Check recent commits
5. Review application logs

#### Issue: Lint Errors Blocking Progress

**Symptoms**: Too many lint errors

**Solutions**:

```
/fix-lint
```

Focus on:

1. Critical errors first (undefined variables)
2. High priority (unused imports)
3. Medium priority (code quality)
4. Defer low priority warnings

#### Issue: Can't Push to Git

**Symptoms**: Git push rejected

**Solutions**:

```bash
# Pull latest changes
git pull origin development

# If conflicts, resolve them
# Then push again
git push origin development
```

#### Issue: Environment Variable Not Working

**Symptoms**: Feature not working, variable undefined

**Solutions**:

1. Verify variable name starts with `VITE_` (frontend)
2. Check Render dashboard - variable set correctly?
3. Force redeploy in Render
4. Check code uses `import.meta.env.VITE_VAR` not `process.env`

#### Issue: Build Succeeds Locally But Fails on Render

**Solutions**:

1. Check Node.js version matches (18+)
2. Verify all dependencies in package.json
3. Check for environment-specific code
4. Review Render environment variables
5. Check build logs for specific errors

### Getting Help

1. **Check Documentation**
   - This guide
   - CLAUDE.md
   - README.md
   - Context files in /context

2. **Check Logs**
   - Render dashboard logs
   - Browser console
   - Git history

3. **Use Claude Code**
   - Ask questions in Claude Code chat
   - Use relevant slash commands

4. **External Resources**
   - Render Support: https://render.com/support
   - GitHub Issues: Repository issues tab

---

## Best Practices

### ✅ DO

- ✅ Run `/verify-deployment` before deploying
- ✅ Deploy to dev frequently (multiple times per day)
- ✅ Test thoroughly in test environment
- ✅ Follow the deployment flow: dev → test → prod
- ✅ Monitor deployments after pushing
- ✅ Keep documentation updated
- ✅ Fix lint errors regularly
- ✅ Use meaningful commit messages
- ✅ Test locally before deploying
- ✅ Check environment variable changes carefully

### ❌ DON'T

- ❌ Never skip testing stages
- ❌ Never deploy to production on Friday
- ❌ Never commit secrets to git
- ❌ Never force push to production
- ❌ Never skip UAT for production
- ❌ Never deploy without verification
- ❌ Never ignore health check failures
- ❌ Never rush production deployments

---

## Quick Reference

### Essential Commands

| Command                | Use Case                 |
| ---------------------- | ------------------------ |
| `/verify-deployment`   | Before any deployment    |
| `/deploy-dev`          | Deploy to development    |
| `/deploy-test`         | Deploy for UAT           |
| `/deploy-prod`         | Deploy to production     |
| `/fix-lint`            | Clean up code quality    |
| `/health-check`        | Check environment status |
| `/rollback-production` | Emergency only           |

### Important URLs

**Deployment Dashboard**

- Render: https://dashboard.render.com

**Live Environments**

- Dev: https://capliquify-frontend-prod.onrender.com
- Test: https://sentia-manufacturing-dashboard-test.onrender.com
- Prod: https://sentia-manufacturing-dashboard-production.onrender.com

**Repository**

- GitHub: https://github.com/The-social-drink-company/sentia-ai-manufacturing-app

### Key Files

- `.claude/commands/` - Slash command definitions
- `CLAUDE.md` - Main project documentation
- `.env.template` - Environment variable template
- `render.yaml` - Deployment configuration
- `package.json` - Dependencies and scripts

---

## Support & Updates

**Maintained by**: Claude Code Development Team
**Last Updated**: October 2025
**Version**: 1.0.0

For updates to this guide or commands, check:

- `.claude/commands/README.md`
- CHANGELOG.md
- Git commit history

---

**Remember**: When in doubt, ask Claude Code! The assistant is here to help guide you through any deployment scenarios.

Happy deploying! 🚀

