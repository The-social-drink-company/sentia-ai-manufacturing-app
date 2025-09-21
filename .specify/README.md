# Sentia Manufacturing Dashboard - Spec-Driven Development (SDD)

## 🎯 Complete Spec-Kit Implementation

This directory contains the comprehensive Spec-Driven Development (SDD) framework for the Sentia Manufacturing Dashboard, following GitHub's Spec-Kit methodology to eliminate AI drift, context loss, and code quality degradation.

## 📁 Directory Structure

```
.specify/
├── specification/           # WHAT we're building
│   ├── 01-USER-REQUIREMENTS.md    # User stories, personas, journeys
│   └── 02-CRITICAL-ISSUES.md      # Problems to solve (Clerk auth, drift)
│
├── plan/                   # HOW we're building it
│   ├── 01-TECHNICAL-ARCHITECTURE.md   # System design, patterns
│   └── 02-ANTI-DRIFT-STRATEGY.md      # Guards against AI/context drift
│
├── tasks/                  # IMPLEMENTATION breakdown
│   └── PRIORITY-TASKS.md   # Prioritized, testable task list
│
├── validation/            # QUALITY assurance
│   └── TEST-SPECIFICATIONS.md   # Comprehensive testing strategy
│
├── deployment/            # DEPLOYMENT strategy
│   └── DEPLOYMENT-CICD.md  # Render deployment, CI/CD pipeline
│
├── locks/                 # IMMUTABLE specifications
│   └── (to be created)    # Component locks preventing drift
│
└── SPEC-KIT-MASTER.md    # Master specification document
```

## 🚀 Quick Start

### 1. Understanding the Current State
Read these documents first to understand the problems:
- `specification/02-CRITICAL-ISSUES.md` - Current problems (Clerk auth, AI drift)
- `plan/02-ANTI-DRIFT-STRATEGY.md` - How we prevent code degradation

### 2. Implementation Priority
Follow the task order in:
- `tasks/PRIORITY-TASKS.md` - Start with P0 critical tasks

### 3. Validation Before Changes
Always check:
- Component lock files (when created)
- Test specifications before implementing
- Anti-drift guidelines

## 🔥 Critical Issues Being Addressed

### 1. Clerk Authentication Blank Screen (P0 - CRITICAL)
- **Problem**: Users get blank screen after authentication
- **Solution**: Fix middleware order (health check first)
- **Task**: TASK-001 in `tasks/PRIORITY-TASKS.md`

### 2. AI/Context Drift (P0 - CRITICAL)
- **Problem**: AI overwrites good code with bad implementations
- **Solution**: Specification locks and validation checkpoints
- **Implementation**: See `plan/02-ANTI-DRIFT-STRATEGY.md`

### 3. Code Quality Degradation (P1 - HIGH)
- **Problem**: Progressive deterioration over iterations
- **Solution**: Structured logging, ESLint enforcement, test coverage
- **Tasks**: TASK-005, TASK-007 in priority list

## 📋 Implementation Workflow

### Phase 1: SPECIFY (Complete ✅)
- User requirements documented
- Critical issues identified
- Success criteria defined

### Phase 2: PLAN (Complete ✅)
- Technical architecture defined
- Anti-drift strategy created
- Deployment strategy documented

### Phase 3: TASKS (Ready for Implementation 🚦)
- 10 priority tasks identified
- Clear acceptance criteria
- Time estimates provided

### Phase 4: IMPLEMENT (Next Step ➡️)
Follow this process for each task:

```bash
# 1. Read the task specification
cat .specify/tasks/PRIORITY-TASKS.md

# 2. Check for lock files
ls .specify/locks/

# 3. Implement with validation
npm run validate:changes

# 4. Test implementation
npm test

# 5. Check for drift
node scripts/drift-detector.js
```

## 🛡️ Guard Rails Against Drift

### Before ANY Code Change:
1. **Check Specifications**: Is this change specified?
2. **Review Lock Files**: Are there immutable constraints?
3. **Validate Architecture**: Does it align with our patterns?
4. **Test First**: Write tests before implementation

### AI Instruction Template:
```markdown
CONTEXT:
- Read: .specify/specification/01-USER-REQUIREMENTS.md
- Follow: .specify/plan/01-TECHNICAL-ARCHITECTURE.md
- Preserve: .specify/locks/[component].lock.yaml

CONSTRAINTS:
- DO NOT change authentication middleware order
- DO NOT remove error handling
- DO NOT modify core business logic
- DO NOT use console.log in production

VALIDATION:
- Run: npm test
- Check: npm run build
- Verify: No features broken
```

## 📊 Success Metrics

### Week 1 Goals:
- [ ] Zero authentication failures
- [ ] Drift detection operational
- [ ] All P0 tasks complete

### Month 1 Goals:
- [ ] 80% test coverage
- [ ] <2s page load times
- [ ] All P1 tasks complete

### Quarter 1 Goals:
- [ ] 99.9% uptime
- [ ] NPS score > 40
- [ ] Technical debt reduced 50%

## 🔧 Maintenance

### Daily:
- Check health endpoints
- Monitor error rates
- Review deployment logs

### Weekly:
- Run drift detection
- Update specifications if needed
- Review test coverage

### Monthly:
- Security audit
- Performance review
- Specification updates

## 📚 Key Documents Reference

| Document | Purpose | When to Use |
|----------|---------|-------------|
| `SPEC-KIT-MASTER.md` | Overview and methodology | Starting point |
| `01-USER-REQUIREMENTS.md` | What users need | Before any feature |
| `02-CRITICAL-ISSUES.md` | Problems to solve | Debugging/fixing |
| `01-TECHNICAL-ARCHITECTURE.md` | System design | Architecture decisions |
| `02-ANTI-DRIFT-STRATEGY.md` | Prevent degradation | Before AI interactions |
| `PRIORITY-TASKS.md` | What to work on | Implementation |
| `TEST-SPECIFICATIONS.md` | Testing requirements | Before/after coding |
| `DEPLOYMENT-CICD.md` | Deployment process | Deploying changes |

## 🚨 Emergency Procedures

### If Clerk Auth Breaks:
1. Check middleware order in `server.js`
2. Verify environment variables
3. See TASK-001 in priority tasks

### If AI Overwrites Good Code:
1. Check git history for last good version
2. Review anti-drift strategy
3. Create/update lock files
4. Restore from last known good state

### If Deployment Fails:
1. Check Render logs
2. Verify environment variables
3. Run health checks
4. Rollback if needed

## 💡 Best Practices

1. **Small Changes**: Implement one task at a time
2. **Test Everything**: Never skip tests
3. **Document Changes**: Update specs after implementation
4. **Review Before Merge**: Always check for drift
5. **Monitor After Deploy**: Watch metrics closely

## 📞 Support

For questions about:
- **Specifications**: Review `.specify/specification/`
- **Architecture**: See `.specify/plan/`
- **Tasks**: Check `.specify/tasks/`
- **Testing**: Refer to `.specify/validation/`
- **Deployment**: Read `.specify/deployment/`

---

**Remember**: The specifications are the source of truth. When in doubt, check the specs!

*Last Updated: September 2025*
*Version: 1.0.0*
*Status: Ready for Implementation*