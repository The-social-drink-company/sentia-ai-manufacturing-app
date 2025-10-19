# Sentia Dashboard - Claude Code Commands

**Complete set of slash commands for deploying and managing the Sentia Manufacturing Dashboard**

## 📚 Available Commands

### 🚀 Deployment Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/verify-deployment` | Pre-deployment verification checks | Before any deployment |
| `/deploy-dev` | Deploy to development environment | Push changes to dev for testing |
| `/deploy-test` | Deploy to test environment for UAT | Promote stable dev changes |
| `/deploy-prod` | Deploy to production environment | Go live with tested features |
| `/rollback-production` | Emergency production rollback | Critical issues in production |

### 🔧 Development Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/create-feature` | Create new feature with scaffolding | Starting new feature development |
| `/fix-lint` | Systematically fix ESLint errors | Code quality cleanup |
| `/health-check` | Check all environment health | Regular monitoring or debugging |
| `/update-env` | Update environment variables | Configuration changes needed |

## 🎯 Quick Start

### First Time Setup

1. **Verify Everything Works**
   ```
   /verify-deployment
   ```
   This checks your local environment, dependencies, and build process.

2. **Check Current Status**
   ```
   /health-check
   ```
   This verifies all deployed environments are operational.

### Daily Development Workflow

1. **Make your changes** in your code editor

2. **Fix any lint errors**
   ```
   /fix-lint
   ```

3. **Deploy to development**
   ```
   /deploy-dev
   ```

4. **Test in development environment**
   - Visit: https://sentia-frontend-prod.onrender.com
   - Verify changes work correctly

5. **When ready for UAT**
   ```
   /deploy-test
   ```

6. **After UAT approval**
   ```
   /deploy-prod
   ```

## 📖 Detailed Command Usage

### /verify-deployment

**Purpose**: Comprehensive pre-deployment checks

**When to use**:
- Before deploying to any environment
- After pulling latest changes
- When debugging deployment issues
- Before starting new development

**What it checks**:
- ✅ Node.js and pnpm versions
- ✅ Dependencies installed and up-to-date
- ✅ Lint errors and warnings
- ✅ Build succeeds
- ✅ Environment variables documented
- ✅ Git status and branch

**Example output**:
```
✅ PASS: Node.js 18.17.0
✅ PASS: All dependencies installed
⚠️ WARN: 190 lint warnings (non-blocking)
✅ PASS: Build successful
✅ PASS: Git status clean

Overall: ✅ READY FOR DEPLOYMENT
```

---

### /deploy-dev

**Purpose**: Deploy changes to development environment

**When to use**:
- After making code changes
- To test features in deployed environment
- Daily development workflow

**What it does**:
- Checks current branch (should be `development`)
- Verifies no uncommitted changes (or commits them)
- Pushes to origin/development
- Triggers Render auto-deployment
- Provides monitoring URLs

**Safety**: Low risk - development environment only

**Example workflow**:
```
User: /deploy-dev

Claude:
  ✅ Current branch: development
  ✅ Working directory: clean
  ✅ Pushing to origin/development
  ✅ Deployment initiated

  🔗 Monitor at: https://dashboard.render.com
  🌐 Test at: https://sentia-frontend-prod.onrender.com

  ⏱️  Deployment ETA: 3-5 minutes
```

---

### /deploy-test

**Purpose**: Promote changes to test environment for UAT

**When to use**:
- Development changes are stable
- Ready for user acceptance testing
- Before production deployment

**What it does**:
- **Asks for confirmation** (requires user approval)
- Merges development → test
- Pushes to test branch
- Provides UAT checklist

**Safety**: Medium risk - requires explicit confirmation

**Example workflow**:
```
User: /deploy-test

Claude:
  🧪 You are about to deploy to TEST environment for UAT.

  This will deploy to: https://sentia-manufacturing-dashboard-test.onrender.com

  Are you ready to promote to TEST? (YES/NO)

User: YES

Claude:
  ✅ Merging development → test
  ✅ Pushing to origin/test
  ✅ Deployment initiated

  📋 UAT Checklist:
  [ ] Application loads
  [ ] Authentication works
  [ ] Dashboard displays correctly
  ...
```

---

### /deploy-prod

**Purpose**: Deploy to live production environment

**When to use**:
- UAT completed successfully in test
- Stakeholder approval obtained
- All quality gates passed

**What it does**:
- **Requires multiple confirmations**
- Creates release tag
- Merges test → production
- Provides comprehensive monitoring

**Safety**: HIGH RISK - multiple confirmations required

**Requires**:
- ✅ UAT completed
- ✅ Stakeholder approval
- ✅ Authorization confirmation
- ✅ Type "DEPLOY TO PRODUCTION" to confirm

---

### /rollback-production

**Purpose**: Emergency rollback of production deployment

**When to use**: EMERGENCY ONLY
- Application completely down (P0)
- Major functionality broken (P1)
- Security vulnerability discovered
- Data integrity at risk

**What it does**:
- Assesses severity
- Provides rollback options
- Executes rollback
- Verifies recovery
- Creates incident report

**Safety**: Emergency use only - requires justification

---

### /create-feature

**Purpose**: Scaffold and implement new feature

**When to use**:
- Starting new feature development
- Need structured implementation guide
- Want enterprise-standard scaffolding

**What it does**:
- Gathers requirements
- Creates technical design
- Provides implementation plan
- Scaffolds code structure
- Adds routing and navigation
- Ensures code quality standards

**Example workflow**:
```
User: /create-feature

Claude: Let's create a new feature. Please provide:
  - Feature Name: ?
  - Purpose: ?
  - User Story: ?

User: Feature: Inventory Alerts
      Purpose: Alert when stock levels are low
      User Story: As a manager, I want to be notified when inventory is low

Claude:
  📋 Implementation Plan: Inventory Alerts

  Phase 1: Backend Setup
    [ ] Create /api/inventory-alerts endpoint
    [ ] Add alert threshold logic
    [ ] Implement notification system

  Phase 2: Frontend
    [ ] Create InventoryAlerts.jsx component
    [ ] Add alerts dashboard
    [ ] Connect to API

  Ready to implement? (YES to continue)
```

---

### /fix-lint

**Purpose**: Systematically fix ESLint errors

**When to use**:
- Code quality cleanup needed
- Before major deployment
- Regular maintenance

**What it does**:
- Analyzes all lint errors
- Categorizes by severity
- Fixes in priority order
- Verifies no functionality broken
- Provides progress reports

**Safety**: Generally safe - verifies no breaking changes

---

### /health-check

**Purpose**: Comprehensive health check of all environments

**When to use**:
- Regular monitoring
- Before deployments
- Debugging issues
- Status reporting

**What it checks**:
- ✅ All 3 environments (dev/test/prod)
- ✅ Health endpoints
- ✅ API endpoints
- ✅ Response times
- ✅ External integrations
- ✅ Database connectivity

---

### /update-env

**Purpose**: Manage environment variables across all environments

**When to use**:
- Adding new configuration
- Changing API keys
- Updating feature flags
- Modifying connection strings

**What it does**:
- Updates .env.template (no secrets)
- Provides Render dashboard instructions
- Verifies variables across environments
- Documents changes

**Safety**: Be careful with production variables

## 🔒 Security Best Practices

### Environment Variables
- ❌ Never commit actual secret values
- ✅ Only use placeholders in .env.template
- ✅ Set actual values in Render Dashboard
- ✅ Use different secrets for each environment

### Git Workflow
- ❌ Never force push to production
- ❌ Never commit directly to production
- ✅ Always follow dev → test → production flow
- ✅ Create tags for production releases

### Deployment Safety
- ❌ Never skip UAT for production
- ❌ Never deploy to production on Friday
- ✅ Always test in test environment first
- ✅ Always have rollback plan ready

## 📊 Deployment Workflow Diagram

```
┌─────────────────┐
│  Development    │  ← Daily work happens here
│   (develop)     │  ← Use /deploy-dev frequently
└────────┬────────┘
         │ Stable features ready
         ↓
┌─────────────────┐
│     Test        │  ← UAT happens here
│    (test)       │  ← Use /deploy-test when stable
└────────┬────────┘
         │ UAT approved
         ↓
┌─────────────────┐
│   Production    │  ← Live environment
│  (production)   │  ← Use /deploy-prod after approval
└─────────────────┘
         │ If critical issue
         ↓
┌─────────────────┐
│   Rollback      │  ← Emergency only
│  (emergency)    │  ← Use /rollback-production
└─────────────────┘
```

## 🎓 Tips for Success

### 1. Start with Verification
Always run `/verify-deployment` before deploying

### 2. Deploy Often to Dev
Don't be afraid to deploy to development frequently

### 3. Test Thoroughly in Test
Use test environment exactly like production

### 4. Follow the Flow
Never skip stages: always dev → test → prod

### 5. Monitor After Deployment
Check logs and health status after every deployment

### 6. Document Changes
Keep CHANGELOG.md updated with significant changes

### 7. Use Feature Branches (Optional)
For major features, create feature branches off development

## 🆘 Troubleshooting

### Deployment Failed
1. Run `/verify-deployment` to check local issues
2. Check Render dashboard logs
3. Verify environment variables are set
4. Check build logs for errors

### Application Not Loading
1. Run `/health-check` to diagnose
2. Check Render service status
3. Verify environment variables
4. Check for recent code changes that might have broken build

### Lint Errors Blocking Development
1. Run `/fix-lint` to systematically fix
2. Focus on critical errors first
3. Add eslint-disable comments for false positives (with explanation)

### Need to Undo a Deployment
1. For production: `/rollback-production`
2. For test/dev: Just push previous commit

## 📞 Support

- **Render Dashboard**: https://dashboard.render.com
- **Repository**: https://github.com/The-social-drink-company/sentia-ai-manufacturing-app
- **Documentation**: See CLAUDE.md, README.md, and docs in /context

## 🔄 Command Updates

These commands are maintained in `.claude/commands/` directory.

To modify a command:
1. Edit the corresponding .md file
2. Test the command
3. Commit changes to git

Commands automatically available in Claude Code after modification.

---

**Last Updated**: October 2025
**Version**: 1.0.0
**Maintained by**: Claude Code Agent
