# BMAD Story: Codebase Cleanup - Refactor Update Queue

**Story ID**: BMAD-CLEAN-002
**Epic**: Technical Debt Reduction
**Owner**: Developer Agent
**Status**: ✅ READY TO START
**Priority**: Medium
**Estimated Effort**: 2 days
**Dependencies**: BMAD-CLEAN-001 (removal) recommended but not required
**Phase**: Technical Debt / Modernization
**Framework**: BMAD-METHOD v6a

---

## Context

A comprehensive BMAD tree sweep has identified **7 components** that are still stubbed, misaligned with current architecture, or need refactoring:

- **1 Legacy API router** (410 stubs across all endpoints)
- **2 Mock data handlers** (dashboard, business intelligence)
- **5 CommonJS finance services** (misaligned with ESM architecture)
- **1 Minimal test server** (incomplete API surface)
- **2 Empty analysis docs** (addressed in BMAD-CLEAN-001)
- **1 Unmanaged subtree** (sentia-financial-lakehouse)

**Evidence**: Each item has been verified with grep/code inspection showing stubs, TODOs, or architectural misalignment.

**Source Document**: [BMAD_UPDATE_QUEUE.md](../../BMAD_UPDATE_QUEUE.md) at repo root

---

## Goals

**Primary Objective**: Refactor or retire all 7 components identified in BMAD_UPDATE_QUEUE.md to align with current architecture and eliminate technical debt.

**Success Criteria**:
- [ ] Legacy `/api` router either modernized or retired
- [ ] Dashboard and BI handlers connected to real services
- [ ] Finance services converted to ESM or shimmed
- [ ] Test server expanded or removed
- [ ] Lakehouse subtree integrated or archived
- [ ] All TODOs and stub code eliminated
- [ ] Documentation updated

---

## User Story

**As a** developer maintaining the Sentia Manufacturing AI Dashboard
**I want to** refactor stubbed and misaligned components
**So that** the codebase is architecturally consistent and production-ready

**Acceptance Criteria**:
- [ ] No 410 status codes in active API routes
- [ ] No "TODO: replace with real data" comments in production handlers
- [ ] All services use consistent module system (ESM)
- [ ] Test infrastructure matches deployed API surface
- [ ] All components tested and verified
- [ ] Git history documents refactoring decisions

---

## Update Inventory

### Category 1: Legacy API Router (High Priority) ⚠️

#### 1.1 Stubbed `/api` Routes
**Path**: `server/routes/api.js`
**Issue**: All handlers return 410 "Legacy API Deprecated"
**Evidence**:
```bash
Select-String -Path server/routes/api.js -Pattern '410'
# Shows every route returning res.status(410)
```

**Impact**: `/api` namespace completely non-functional

**Options**:

**Option A: Retire Completely** (Recommended)
```javascript
// Remove server/routes/api.js entirely
// Update server.js to remove: app.use('/api', apiRouter);
// Document that all APIs are now under specific namespaces:
// - /api/import/* (import routes)
// - /api/export/* (export routes)
// - /financial/* (financial data)
// - /sse/* (server-sent events)
```

**Option B: Modernize**
```javascript
// Map /api/* to new endpoints
router.get('/financial/kpis', financialController.getKPIs);
router.get('/inventory/levels', inventoryController.getLevels);
// etc.
```

**Recommendation**: **Option A** - Clean retirement
- Simpler
- Clearer API structure
- No confusion between old/new endpoints

**Estimated Effort**: 0.5 days

---

### Category 2: Mock Data Handlers (High Priority) ⚠️

#### 2.1 Dashboard Mock Data
**Path**: `server/api/dashboard.js`
**Issue**: Returns synthetic KPI/chart data with TODO comments
**Evidence**:
```bash
Select-String -Path server/api/dashboard.js -Pattern 'TODO'
# Highlights inline mock generators
```

**Current Code**:
```javascript
// TODO: Replace with real services
const kpis = {
  revenue: Math.random() * 100000,
  orders: Math.floor(Math.random() * 500),
  // ... more mock data
};
```

**Refactoring**:
```javascript
// Import real services
import { xeroService } from '../services/api/xeroService.js';
import { shopifyService } from '../services/api/shopify-multistore.js';

router.get('/kpis', async (req, res) => {
  try {
    const [xeroData, shopifyData] = await Promise.all([
      xeroService.getFinancialKPIs(),
      shopifyService.getSalesKPIs()
    ]);

    const kpis = {
      revenue: xeroData.totalRevenue,
      orders: shopifyData.totalOrders,
      // ... real data
    };

    res.json({ success: true, data: kpis });
  } catch (error) {
    // Proper error handling
    res.status(503).json({
      success: false,
      error: 'Unable to fetch KPIs',
      retryable: true
    });
  }
});
```

**Dependencies**: Xero and Shopify integrations (EPIC-002: BMAD-MOCK-001, BMAD-MOCK-002)

**Estimated Effort**: 1 day (after EPIC-002 stories complete)

---

#### 2.2 Business Intelligence Mock Data
**Path**: `server/api/business-intelligence.js`
**Issue**: Hard-coded "AI insights" instead of calling actual ML endpoints
**Evidence**: File comments state "In production this would integrate with Claude 3 Sonnet and GPT-4"

**Current Code**:
```javascript
// Hard-coded insights
const insights = [
  "Inventory levels suggest restocking needed",
  "Sales trending 15% above forecast",
  // ... fake AI insights
];
```

**Options**:

**Option A: Integrate with Real AI** (If Available)
```javascript
import { aiOrchestrationService } from '../services/ai/orchestration.js';

const insights = await aiOrchestrationService.generateInsights({
  context: 'dashboard',
  data: { financials, inventory, sales }
});
```

**Option B: Remove Entirely** (Recommended for Now)
```javascript
// Return empty insights with "coming soon" message
res.json({
  success: true,
  insights: [],
  message: "AI insights coming soon. Connect your data sources first."
});
```

**Recommendation**: **Option B** until real AI orchestration is implemented

**Estimated Effort**: 0.25 days

---

### Category 3: CommonJS Finance Services (Medium Priority) ⚠️

#### 3.1 Finance Services Module System Mismatch
**Paths**:
- `server/services/finance/ApprovalEngine.js`
- `server/services/finance/CashConversionCycle.js`
- `server/services/finance/ScenarioModeler.js`
- `server/services/finance/WorkingCapitalOptimization.js`
- `server/services/finance/CreditAnalysis.js`

**Issue**: Use `require(...)` expecting CommonJS logger, but logger is ESM
**Evidence**:
```bash
Get-Content server/services/finance/ApprovalEngine.js -Head 5
# Shows: const logger = require('../../utils/logger')
# But server/utils/logger.js exports ESM
```

**Impact**: Services cannot load under current module system

**Options**:

**Option A: Convert to ESM** (Recommended)
```javascript
// Before (CommonJS)
const logger = require('../../utils/logger');

// After (ESM)
import logger from '../../utils/logger.js';
```

**Option B: Create CommonJS Shim**
```javascript
// server/utils/logger-cjs.js
const logger = require('./logger.js').default;
module.exports = logger;
```

**Recommendation**: **Option A** - Consistent ESM across codebase

**Process for Each Service**:
1. Replace `require(...)` with `import ... from ...`
2. Replace `module.exports = ...` with `export default ...`
3. Add `.js` extensions to all imports
4. Test service functionality

**Estimated Effort**: 0.5 days (all 5 services)

---

### Category 4: Minimal Test Server (Low Priority) 🔹

#### 4.1 Incomplete Test Harness
**Path**: `test-server.js`
**Issue**: Only `/health` endpoint; legacy tests expect inventory/optimization routes
**Evidence**:
```bash
Get-Content test-server.js
# Shows Express app with single health handler
```

**Current Code**:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
// Nothing else
```

**Options**:

**Option A: Expand Test Server**
```javascript
// Add routes matching deployed API
app.use('/api/import', importRoutes);
app.use('/api/export', exportRoutes);
app.use('/financial', financialRoutes);
// etc.

// Or proxy to main server
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true
}));
```

**Option B: Remove Test Server** (Recommended)
```javascript
// Delete test-server.js
// Update test scripts to use actual server.js
// Or use supertest against Express app directly
```

**Recommendation**: **Option B** - Test against real server

**Estimated Effort**: 0.25 days

---

### Category 5: Unmanaged Lakehouse Subtree (Low Priority) 🔹

#### 5.1 Financial Lakehouse Subproject
**Path**: `sentia-financial-lakehouse/`
**Issue**: Excluded from linting, not referenced elsewhere in repo
**Evidence**:
```bash
rg 'sentia-financial-lakehouse'
# Only finds exclusion in eslint.config.js
```

**Options**:

**Option A: Archive Externally**
```bash
# Move to separate repository
cd ..
git clone sentia-ai-manufacturing-app sentia-financial-lakehouse-archive
cd sentia-financial-lakehouse-archive
# Keep only lakehouse code
# Publish as separate repo
```

**Option B: Integrate into Main Repo**
```bash
# Bring into main codebase
# Add proper imports
# Remove from eslint exclusions
# Add to build process
```

**Option C: Delete if Obsolete**
```bash
git rm -r sentia-financial-lakehouse/
```

**Recommendation**: **Needs stakeholder decision**
- If active project: Option A (separate repo)
- If needed for integration: Option B
- If obsolete: Option C

**Estimated Effort**: 0.5 days (once decision made)

---

## Refactoring Plan

### Phase 1: High Priority Items (1.5 days)

**Step 1: Retire Legacy API Router** (0.5 days)
```bash
# 1. Verify no active usage
rg "'/api/" --glob "*.{js,jsx,ts,tsx}" | grep -v "api.js"

# 2. Remove from server.js
# Comment out: app.use('/api', apiRouter);

# 3. Test application
npm run dev
# Verify app works without /api routes

# 4. Delete file
git rm server/routes/api.js

# 5. Update documentation
```

**Step 2: Refactor Mock Data Handlers** (1 day)
```bash
# Option: Wait for EPIC-002 (Eliminate Mock Data)
# Or: Replace with "coming soon" placeholders now

# For dashboard.js:
# - Remove Math.random() generators
# - Return empty states with setup prompts
# - Add proper error handling

# For business-intelligence.js:
# - Remove fake insights
# - Return "coming soon" message
# - Document future AI integration plan
```

---

### Phase 2: Medium Priority Items (0.5 days)

**Step 3: Convert Finance Services to ESM**
```bash
# For each service in server/services/finance/:

# 1. Update imports
sed -i 's/const logger = require/import logger from/g' ApprovalEngine.js
sed -i 's/require(/import /g' ApprovalEngine.js

# 2. Update exports
sed -i 's/module.exports =/export default/g' ApprovalEngine.js

# 3. Add .js extensions
# Manual: Review all import statements and add .js

# 4. Test service
node --experimental-modules server/services/finance/ApprovalEngine.js

# Repeat for all 5 services
```

**Verification**:
```javascript
// Test that services can now be imported
import { ApprovalEngine } from './server/services/finance/ApprovalEngine.js';
const engine = new ApprovalEngine();
console.log(engine); // Should work
```

---

### Phase 3: Low Priority Items (0.5 days)

**Step 4: Handle Test Server**
```bash
# Option B: Remove
git rm test-server.js

# Update package.json test scripts
# Change: "test:server": "node test-server.js"
# To: "test:server": "node server.js"

# Or use supertest directly
```

**Step 5: Decide on Lakehouse Subtree**
```bash
# Schedule stakeholder meeting
# Document decision in BMAD story
# Execute chosen option (A, B, or C)
```

---

## Testing Plan

### Pre-Refactoring Tests
```bash
# 1. Capture current state
npm run lint > pre-refactor-lint.txt
npm test > pre-refactor-tests.txt
npm run build > pre-refactor-build.txt

# 2. Document current API endpoints
curl http://localhost:5000/api/ # Should return 410

# 3. Baseline metrics
git ls-files | wc -l  # File count
find . -name "*.js" -exec wc -l {} + | tail -1  # Line count
```

### Post-Refactoring Tests
```bash
# 1. Verify builds
npm run lint  # Should pass (or have fewer errors)
npm test      # Should pass
npm run build # Should succeed

# 2. Verify API endpoints
curl http://localhost:5000/health  # Should work
curl http://localhost:5000/api/    # Should 404 (not 410)

# 3. Verify finance services load
node -e "import('./server/services/finance/ApprovalEngine.js').then(console.log)"

# 4. Check metrics
git ls-files | wc -l  # Should be fewer
```

---

## Commit Strategy

**Create Focused Commits** (not one big commit):

```bash
# Commit 1: Remove legacy API router
git commit -m "refactor: Retire legacy /api router returning 410 stubs"

# Commit 2: Refactor dashboard handler
git commit -m "refactor: Replace dashboard mock data with empty states"

# Commit 3: Refactor BI handler
git commit -m "refactor: Remove hard-coded AI insights, add 'coming soon'"

# Commit 4: Convert finance services to ESM
git commit -m "refactor: Convert finance services from CommonJS to ESM"

# Commit 5: Remove test server
git commit -m "refactor: Remove minimal test-server.js, test against main server"

# Commit 6: Handle lakehouse (if decided)
git commit -m "refactor: [Archive/Integrate/Remove] financial lakehouse subtree"
```

---

## Dependencies

### External Dependencies
- **EPIC-002** (Eliminate Mock Data): Dashboard/BI handlers need real services
  - Can partially refactor now (empty states)
  - Full integration after BMAD-MOCK-001, BMAD-MOCK-002

### Internal Dependencies
- **BMAD-CLEAN-001** (Removal): Recommended to run first for cleaner codebase
  - Not strictly required
  - Can run in parallel

### Stakeholder Decisions Needed
- **Lakehouse Subtree**: Archive, integrate, or delete?
  - Needs product owner input
  - Timeline: This week

---

## Risk Assessment

### Risks

**Risk 1: Breaking Active API Consumers**
- **Probability**: Low
- **Impact**: High
- **Mitigation**: Verify no active `/api` usage with grep before removal
- **Verification**: Test all known API consumers

**Risk 2: ESM Conversion Issues**
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**: Convert one service at a time, test thoroughly
- **Rollback**: Git revert if issues found

**Risk 3: Lost Functionality in Test Server**
- **Probability**: Low
- **Impact**: Low
- **Mitigation**: Verify tests pass against main server before deleting

---

## Success Metrics

### Quantitative Metrics

**Code Quality**:
- Zero 410 status codes in active routes
- Zero "TODO" comments in production handlers
- 100% ESM consistency in services
- Reduced eslint exclusions

**Technical Debt Reduction**:
- 7 components refactored or retired
- Architectural consistency improved
- Module system unified (all ESM)

### Qualitative Metrics

**Developer Experience**:
- Clearer API structure
- No confusion about stub vs. real endpoints
- Consistent import syntax across codebase

---

## Definition of Done

**Story DONE When**:
- [ ] Legacy `/api` router retired (Option A) or modernized (Option B)
- [ ] Dashboard handler refactored (mock data removed or replaced)
- [ ] BI handler refactored (fake insights removed)
- [ ] All 5 finance services converted to ESM
- [ ] Test server removed or expanded (decision documented)
- [ ] Lakehouse subtree archived, integrated, or deleted (decision documented)
- [ ] All tests passing
- [ ] All builds succeeding
- [ ] BMAD_UPDATE_QUEUE.md marked "COMPLETE" or deleted
- [ ] Git commits created with clear rationale

---

## Next Actions

### Immediate (After BMAD-CLEAN-001)
1. Create refactor branch: `refactor/update-queue-components`
2. Execute Phase 1 (high priority items)
3. Verify builds and tests
4. Commit Phase 1 changes

### Short-term (This Week)
1. Execute Phase 2 (ESM conversion)
2. Execute Phase 3 (test server, lakehouse decision)
3. Comprehensive testing
4. Final commit and merge

### Follow-up
1. Monitor for any regressions
2. Update team documentation
3. Schedule retrospective
4. Plan next technical debt sprint

---

## Integration with Other BMAD Stories

**Relationship to EPIC-002** (Eliminate Mock Data):
- Dashboard and BI handlers are *subsets* of EPIC-002
- Can refactor to empty states now
- Full integration happens in BMAD-MOCK-001, BMAD-MOCK-002

**Execution Options**:

**Option 1: Sequential** (Recommended)
```
BMAD-CLEAN-001 → BMAD-CLEAN-002 → EPIC-002
(Remove legacy) → (Refactor stubs) → (Real data)
```

**Option 2: Parallel**
```
BMAD-CLEAN-001 + BMAD-CLEAN-002 (together)
Then → EPIC-002
```

**Option 3: Interleaved**
```
BMAD-CLEAN-001 → BMAD-MOCK-001 (Xero) → BMAD-CLEAN-002 → BMAD-MOCK-002 (Shopify)
```

---

## References

**Evidence Documents**:
- [BMAD_UPDATE_QUEUE.md](../../BMAD_UPDATE_QUEUE.md) - Comprehensive refactoring queue
- [BMAD_REMOVAL_LIST.md](../../BMAD_REMOVAL_LIST.md) - Removal companion document

**Related BMAD Stories**:
- [BMAD-CLEAN-001](./2025-10-codebase-cleanup-removal.md) - Remove legacy components
- [EPIC-002](../epics/2025-10-eliminate-mock-data-epic.md) - Eliminate mock data

**BMAD Documentation**:
- [BMAD Workflow Status](../BMAD-WORKFLOW-STATUS.md)
- [BMAD Implementation Plan](../../BMAD-METHOD-V6A-IMPLEMENTATION.md)

---

**Status**: ✅ **READY TO START**
**Priority**: **Medium** (after BMAD-CLEAN-001)
**Owner**: Developer Agent
**Created**: 2025-10-18
**Framework**: BMAD-METHOD v6a
**Estimated Duration**: 2 days
**Type**: Refactoring / Technical Debt / Modernization
