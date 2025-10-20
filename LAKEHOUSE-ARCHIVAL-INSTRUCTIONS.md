# Sentia Financial Lakehouse - Archival Instructions

**Date**: 2025-10-19
**Decision**: Archive to Separate Repository (Option A)
**Status**: 🔄 **READY FOR ARCHIVAL**
**Framework**: BMAD-METHOD v6a Phase 1.2

---

## Executive Summary

The `sentia-financial-lakehouse/` directory contains a complete standalone Financial Intelligence Platform (1,231 lines of code). Per strategic planning, this should be archived to a separate repository to:

- ✅ Clean separation of concerns
- ✅ Independent versioning and releases
- ✅ Reduced main repo complexity
- ✅ Potential for reuse across Sentia projects

---

## Lakehouse Overview

### What It Is

A complete microservices platform for financial data intelligence with:

- DuckDB + Parquet analytics engine
- Multi-LLM AI orchestration (GPT-4, Claude 3, Gemini)
- Data adapters for Xero, QuickBooks, SAP
- Prometheus + Redis metrics
- React dashboard UI

### Current State

- **Code**: 1,231 lines across 6 files
- **Architecture**: Complete microservices (ports 8100-8103, 3100)
- **Integration**: Zero references in main application
- **Status**: Excluded from linting, fully isolated

---

## Archival Steps (For Repository Admin)

### Step 1: Create New Repository

```bash
# On GitHub, create new repository:
# - Name: sentia-financial-lakehouse
# - Description: Financial Intelligence Platform with DuckDB and AI Orchestration
# - Visibility: Private (or public based on preference)
# - Initialize: No (we'll push existing code)
```

### Step 2: Clone and Prepare New Repo

```bash
# Clone the new empty repository
git clone git@github.com:The-social-drink-company/sentia-financial-lakehouse.git
cd sentia-financial-lakehouse

# Copy lakehouse code from main repo
cp -r ../capliquify-ai-dashboard-app/sentia-financial-lakehouse/* .

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Financial Lakehouse Platform

Migrated from capliquify-ai-dashboard-app repository.

Contents:
- DuckDB + Parquet analytics engine (248 lines)
- AI Orchestrator with multi-LLM support (246 lines)
- Data adapters for Xero/QuickBooks/SAP (374 lines)
- Metrics service with Prometheus (242 lines)
- Data contracts and types (121 lines)
- Docker compose configuration
- Complete architecture documentation

Total: 1,231 lines of functional code
Platform: Standalone microservices
Tech Stack: Node.js, DuckDB, Redis, Prometheus, React

Migrated as part of BMAD-CLEAN-002 technical debt cleanup.
"

# Push to new repository
git push origin main
```

### Step 3: Set Up CI/CD (Optional)

```bash
# Add GitHub Actions workflows
mkdir -p .github/workflows

# Create basic CI workflow
cat > .github/workflows/ci.yml <<'EOF'
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
EOF

git add .github/workflows/
git commit -m "chore: Add GitHub Actions CI workflow"
git push
```

### Step 4: Remove from Main Repository

```bash
# Switch back to main repo
cd ../capliquify-ai-dashboard-app

# Ensure on development branch
git checkout development

# Remove lakehouse directory
git rm -r sentia-financial-lakehouse/

# Update eslint.config.js to remove exclusion
# Edit file to remove: 'sentia-financial-lakehouse/**',

# Commit removal
git commit -m "refactor: Archive lakehouse to separate repository (BMAD-CLEAN-002)

Moved sentia-financial-lakehouse/ to separate repository.

Rationale:
- Complete standalone platform (1,231 lines)
- Different architecture (microservices vs monolith)
- Zero integration with main application
- Potential reuse across Sentia products

New Repository:
https://github.com/Capliquify/sentia-financial-lakehouse

Impact:
- Reduced main repo complexity
- Cleaner separation of concerns
- Independent development lifecycle

Story: BMAD-CLEAN-002 Phase 1.2
Decision: DECISION-001 Option A (Archive to Separate Repo)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to development
git push origin development
```

### Step 5: Update Documentation

```bash
# Add reference to lakehouse in main repo README
echo "
## Related Projects

- **Sentia Financial Lakehouse**: https://github.com/Capliquify/sentia-financial-lakehouse
  - Standalone financial intelligence platform
  - DuckDB analytics engine + AI orchestration
  - Can be used independently or integrated
" >> README.md

git add README.md
git commit -m "docs: Add reference to lakehouse repository"
git push origin development
```

---

## Verification Checklist

After archival, verify:

- [ ] New repository created and accessible
- [ ] All lakehouse code copied to new repo
- [ ] Initial commit pushed to new repo
- [ ] Lakehouse removed from main repo
- [ ] eslint.config.js updated (exclusion removed)
- [ ] README.md updated with repository link
- [ ] All changes committed and pushed
- [ ] No broken references in main repo

---

## Rollback Plan

If archival needs to be reversed:

```bash
# In main repo
git revert <commit-hash-of-removal>
git push origin development
```

---

## Files to Archive

```
sentia-financial-lakehouse/
├── ARCHITECTURE.md (367 lines)
├── docker-compose.yml
├── .github/
│   └── workflows/
├── contracts/
│   └── data-contracts.ts (121 lines)
├── services/
│   ├── adapters/index.js (374 lines)
│   ├── lakehouse/index.js (248 lines)
│   ├── metrics/index.js (242 lines)
│   └── orchestrator/index.js (246 lines)
├── tests/
│   └── e2e/acceptance.spec.js
└── ui/
    └── (React dashboard)
```

**Total Code**: 1,231 lines
**Total Size**: ~7MB

---

## Benefits of Archival

### For Main Repository:

- ✅ Reduced complexity (1,231 lines removed)
- ✅ Cleaner eslint configuration
- ✅ Clearer project focus
- ✅ Faster builds and tests

### For Lakehouse Project:

- ✅ Independent development
- ✅ Own release cycle
- ✅ Dedicated documentation
- ✅ Potential for reuse
- ✅ Clear ownership

---

## Post-Archival Next Steps

1. **Set up lakehouse CI/CD**: GitHub Actions, testing, deployment
2. **Add lakehouse documentation**: README, API docs, setup guide
3. **Configure lakehouse deployment**: Separate Render service if needed
4. **Define integration points**: If main app needs lakehouse data
5. **Establish ownership**: Assign maintainers for lakehouse repo

---

## References

**Main Repository**:

- https://github.com/Capliquify/capliquify-ai-dashboard-app

**New Lakehouse Repository** (to be created):

- https://github.com/Capliquify/sentia-financial-lakehouse

**BMAD Documentation**:

- BMAD-CLEAN-002: Technical debt cleanup story
- DECISION-001: Lakehouse subtree decision (Option A)

---

**Status**: 🔄 **READY FOR ARCHIVAL**
**Action Required**: Repository admin to execute Steps 1-5
**Timeline**: 4 hours estimated
**Priority**: Medium (not blocking, but part of strategic plan)
**Framework**: BMAD-METHOD v6a Phase 1.2
