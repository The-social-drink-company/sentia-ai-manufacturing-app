# ENTERPRISE GIT WORKFLOW - SENTIA MANUFACTURING DASHBOARD

## **CRITICAL SENIOR DEVELOPER RECOMMENDATION**

This document implements world-class enterprise-level Git workflow best practices as recommended by the senior full-stack developer. The current development approach **MUST** follow this workflow to meet enterprise standards.

## **BRANCH STRUCTURE & WORKFLOW**

### **Branch Hierarchy**

```
development (dev/coding branch)
    ↓
test (UAT/user testing branch)
    ↓
production (live/production branch)
```

### **Branch Purposes**

#### 🔧 **DEVELOPMENT BRANCH**

- **Purpose**: Active development and coding area
- **Railway URL**: https://sentia-manufacturing-dashboard-development.up.railway.app
- **Database**: Development Neon PostgreSQL instance
- **Usage**: All feature development, bug fixes, and code changes
- **Stability**: Unstable - frequent changes, experimental features
- **Team Access**: All developers

#### 🧪 **TEST BRANCH**

- **Purpose**: User Acceptance Testing (UAT) environment
- **Railway URL**: https://sentiatest.financeflo.ai
- **Database**: Testing Neon PostgreSQL instance
- **Usage**: Extensive user testing, quality assurance, client preview
- **Stability**: Stable - only tested, ready-for-UAT code
- **Team Access**: Developers, QA team, stakeholders, clients (for UAT)

#### 🚀 **PRODUCTION BRANCH**

- **Purpose**: Live production environment for daily operations
- **Railway URL**: https://sentia-manufacturing-dashboard-production.up.railway.app
- **Database**: Production Neon PostgreSQL instance
- **Usage**: Real-world daily manufacturing operations
- **Stability**: Highly stable - only fully tested, client-approved code
- **Team Access**: Operations team, authorized users only

## **WORKFLOW PROCESS**

### **STEP 1: Development Phase**

```bash
# Work on development branch
git checkout development
git pull origin development

# Make code changes, implement features
# Test locally on http://localhost:3000

# Commit changes
git add .
git commit -m "feat: implement enterprise navigation system

- Add clickable Sentia logo with navigation to dashboard
- Implement world-class sidebar navigation with role-based access
- Add keyboard shortcuts for all major functions
- Fix all button functionality (Export, Save, Share)
- Ensure What-If Analysis and Working Capital pages accessible

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to development
git push origin development
```

### **STEP 2: Testing Phase (UAT Ready)**

```bash
# When development features are complete and ready for UAT
git checkout test
git pull origin test

# Merge from development (only tested, stable code)
git merge development

# Push to test branch for UAT
git push origin test
```

**Result**: Automatic Railway deployment to https://sentiatest.financeflo.ai

### **STEP 3: Production Deployment (Go Live)**

```bash
# After successful UAT and client approval
git checkout production
git pull origin production

# Merge from test (only UAT-approved code)
git merge test

# Push to production branch for live deployment
git push origin production
```

**Result**: Automatic Railway deployment to https://sentia-manufacturing-dashboard-production.up.railway.app

## **QUALITY GATES**

### **Development → Test**

- [ ] All features implemented and functional
- [ ] Local testing completed (http://localhost:3000)
- [ ] No console errors or warnings
- [ ] All buttons and navigation working
- [ ] Database connections tested
- [ ] Code review completed
- [ ] Documentation updated

### **Test → Production**

- [ ] User Acceptance Testing (UAT) completed
- [ ] Client approval received
- [ ] Performance testing passed
- [ ] Security review completed
- [ ] Database migrations tested
- [ ] Backup procedures verified
- [ ] Rollback plan documented

## **RAILWAY AUTO-DEPLOYMENT CONFIGURATION**

Each branch automatically deploys to its respective Railway environment:

```json
{
  "environments": {
    "development": {
      "variables": {
        "NODE_ENV": "development",
        "ENABLE_AUTONOMOUS_TESTING": "true",
        "AUTO_FIX_ENABLED": "true",
        "AUTO_DEPLOY_ENABLED": "true"
      }
    },
    "testing": {
      "variables": {
        "NODE_ENV": "test",
        "ENABLE_AUTONOMOUS_TESTING": "true",
        "AUTO_FIX_ENABLED": "true",
        "AUTO_DEPLOY_ENABLED": "false"
      }
    },
    "production": {
      "variables": {
        "NODE_ENV": "production",
        "ENABLE_AUTONOMOUS_TESTING": "false",
        "AUTO_FIX_ENABLED": "false",
        "AUTO_DEPLOY_ENABLED": "false"
      }
    }
  }
}
```

## **EMERGENCY PROCEDURES**

### **Hotfix Process**

For critical production issues:

```bash
# Create hotfix branch from production
git checkout production
git checkout -b hotfix/critical-issue-fix

# Make minimal fix
# Test locally

# Deploy to development first
git checkout development
git merge hotfix/critical-issue-fix
git push origin development

# Fast-track through testing
git checkout test
git merge development
git push origin test

# Deploy to production after verification
git checkout production
git merge test
git push origin production

# Clean up
git branch -d hotfix/critical-issue-fix
```

### **Rollback Process**

If production deployment fails:

```bash
# Revert production to previous stable commit
git checkout production
git reset --hard HEAD~1
git push origin production --force-with-lease
```

## **CURRENT WORKFLOW VIOLATIONS**

### **Issues Identified:**

1. **Direct development on development branch** ✅ **CORRECT**
2. **Bypassing UAT in test environment** ❌ **VIOLATION**
3. **No formal promotion process** ❌ **VIOLATION**
4. **Inconsistent environment configurations** ❌ **VIOLATION**

### **Immediate Actions Required:**

1. **Commit current development changes**
2. **Promote stable code to test branch for UAT**
3. **Only deploy to production after successful UAT**
4. **Establish formal change approval process**

## **BENEFITS OF THIS WORKFLOW**

### **Risk Mitigation**

- Prevents untested code reaching production
- Provides rollback capabilities at each stage
- Isolates development experiments from live systems
- Enables thorough testing before client exposure

### **Quality Assurance**

- Multiple testing phases (dev → test → production)
- Client/stakeholder approval gates
- Database integrity protection
- Performance validation opportunities

### **Compliance & Governance**

- Audit trail of all changes
- Approval workflows documented
- Change management compliance
- Risk assessment at each stage

## **TEAM RESPONSIBILITIES**

### **Developers**

- Work exclusively on development branch
- Ensure code quality before promoting to test
- Document all changes thoroughly
- Follow commit message standards

### **QA Team**

- Validate functionality in test environment
- Perform regression testing
- Sign off on UAT completion
- Document test results

### **Operations Team**

- Monitor production deployments
- Execute rollback procedures if needed
- Maintain environment configurations
- Coordinate deployment schedules

### **Stakeholders/Clients**

- Perform User Acceptance Testing in test environment
- Provide formal approval for production deployment
- Report issues discovered during UAT
- Sign off on go-live decisions

## **CONCLUSION**

This enterprise Git workflow ensures:

- **Code Quality**: Multiple testing phases
- **Risk Management**: Staged deployment process
- **Client Satisfaction**: UAT approval gates
- **Operational Excellence**: Stable production environment
- **Compliance**: Audit trails and approval processes

**CRITICAL**: All future development MUST follow this workflow to meet world-class enterprise standards as required by the senior full-stack developer.
