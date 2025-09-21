# Anti-Drift Strategy Plan
## Preventing AI and Context Drift in Development

### 1. The Drift Problem

#### 1.1 What is AI/Context Drift?
AI and context drift occurs when AI coding assistants progressively:
- Lose understanding of project requirements
- Forget architectural decisions
- Overwrite working code with inferior versions
- Introduce inconsistent patterns
- Break existing functionality

#### 1.2 Why Does It Happen?
1. **Limited Context Window**: AI can't see entire codebase
2. **No Memory**: Each session starts fresh
3. **Generic Training**: AI defaults to common patterns
4. **Vague Instructions**: Incomplete specifications
5. **No Validation**: Changes aren't verified

### 2. Guard Rails Against Drift

#### 2.1 Specification Lock Files
```yaml
# .specify/locks/authentication.lock.yaml
component: Authentication
version: 1.0.0
locked: true
specifications:
  - Must use Clerk for authentication
  - Health endpoints bypass authentication
  - Middleware order: health first, then auth
  - Support roles: Admin, Manager, Operator, Viewer
constraints:
  - NEVER use custom auth implementation
  - NEVER change middleware order
  - NEVER remove role checks
```

#### 2.2 Architectural Decision Records (ADRs)
```markdown
# ADR-001: Use Clerk for Authentication
Status: ACCEPTED
Date: 2025-01-01

## Decision
Use Clerk as the sole authentication provider.

## Rationale
- Enterprise-grade security
- Built-in RBAC
- Easy integration

## Consequences
- Dependency on external service
- Must handle Clerk-specific errors

## Constraints
- NEVER implement custom auth
- ALWAYS check Clerk middleware order
```

#### 2.3 Code Invariants
```javascript
// INVARIANT: This pattern must NEVER change
// @lock-pattern: authentication-flow
export const authenticateUser = async (req, res, next) => {
  // 1. Health check bypass (CRITICAL - DO NOT MOVE)
  if (req.path === '/health') return next();

  // 2. Clerk authentication (MUST BE SECOND)
  const auth = await clerkMiddleware(req);

  // 3. Role validation (MUST BE THIRD)
  if (!hasRequiredRole(auth, req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};
// @end-lock-pattern
```

### 3. Context Preservation Strategy

#### 3.1 Context Hierarchy
```
1. IMMUTABLE Context (Never changes)
   ├── Core architecture decisions
   ├── Technology stack
   └── Business rules

2. STABLE Context (Rarely changes)
   ├── API contracts
   ├── Database schema
   └── Design patterns

3. EVOLVING Context (Can change)
   ├── Feature implementations
   ├── UI components
   └── Optimizations
```

#### 3.2 Context Documentation Structure
```
.specify/
├── context/
│   ├── immutable/
│   │   ├── architecture.md
│   │   ├── tech-stack.md
│   │   └── business-rules.md
│   ├── stable/
│   │   ├── api-contracts.md
│   │   ├── database-schema.md
│   │   └── patterns.md
│   └── evolving/
│       ├── features/
│       ├── components/
│       └── optimizations/
```

### 4. Validation Checkpoints

#### 4.1 Pre-Implementation Validation
```javascript
// Before ANY code changes
const validateChange = async (proposedChange) => {
  // Check against specifications
  if (!meetsSpecification(proposedChange)) {
    throw new Error('Change violates specifications');
  }

  // Check against invariants
  if (violatesInvariant(proposedChange)) {
    throw new Error('Change violates code invariants');
  }

  // Check against architecture
  if (!alignsWithArchitecture(proposedChange)) {
    throw new Error('Change conflicts with architecture');
  }

  return true;
};
```

#### 4.2 Post-Implementation Validation
```bash
# Automated validation script
npm run validate:changes

# Checks:
1. ✓ All tests pass
2. ✓ No lint errors
3. ✓ Build succeeds
4. ✓ Bundle size acceptable
5. ✓ Performance benchmarks met
6. ✓ Security scan clean
```

### 5. AI Instruction Templates

#### 5.1 Safe Modification Template
```markdown
## Task: [Specific Task]

### CONTEXT REQUIREMENTS
1. Read these specifications first:
   - `.specify/specification/01-USER-REQUIREMENTS.md`
   - `.specify/plan/01-TECHNICAL-ARCHITECTURE.md`
   - `.specify/locks/[relevant-lock].yaml`

2. Preserve these invariants:
   - [List specific patterns that must not change]

3. Follow these patterns:
   - [List established patterns to follow]

### IMPLEMENTATION CONSTRAINTS
- DO NOT change authentication middleware order
- DO NOT remove error handling
- DO NOT modify core business logic
- DO NOT introduce new dependencies without approval

### VALIDATION REQUIREMENTS
After implementation:
1. Run tests: `npm test`
2. Check build: `npm run build`
3. Verify no regressions
```

#### 5.2 Feature Addition Template
```markdown
## New Feature: [Feature Name]

### SPECIFICATION
[Detailed specification of the feature]

### INTEGRATION POINTS
- Existing code to interface with
- APIs to consume
- Database tables to use

### PATTERNS TO FOLLOW
- Use existing service pattern
- Follow established naming conventions
- Maintain consistent error handling

### TEST REQUIREMENTS
- Unit tests for business logic
- Integration tests for API
- E2E tests for user flows
```

### 6. Drift Detection Mechanisms

#### 6.1 Automated Drift Detection
```javascript
// drift-detector.js
class DriftDetector {
  async checkForDrift() {
    const issues = [];

    // Check specifications compliance
    if (!await this.checkSpecifications()) {
      issues.push('Specification drift detected');
    }

    // Check pattern consistency
    if (!await this.checkPatterns()) {
      issues.push('Pattern drift detected');
    }

    // Check dependency changes
    if (!await this.checkDependencies()) {
      issues.push('Dependency drift detected');
    }

    return issues;
  }
}
```

#### 6.2 Manual Review Checklist
```markdown
## Code Review Checklist

### Before Approving Changes:
- [ ] Specifications still met?
- [ ] Invariants preserved?
- [ ] Patterns consistent?
- [ ] Tests updated?
- [ ] Documentation current?
- [ ] No functionality lost?
- [ ] Performance maintained?
- [ ] Security intact?
```

### 7. Recovery from Drift

#### 7.1 Drift Recovery Process
```bash
# 1. Identify drift
git diff HEAD~10 HEAD

# 2. Locate last known good state
git log --oneline | grep "STABLE:"

# 3. Create recovery branch
git checkout -b recovery/fix-drift

# 4. Cherry-pick good changes
git cherry-pick <good-commits>

# 5. Revalidate
npm run validate:all

# 6. Merge back
git checkout main
git merge recovery/fix-drift
```

#### 7.2 Regression Prevention
```javascript
// regression-tests.js
describe('Regression Tests', () => {
  it('should maintain authentication flow', () => {
    // Test that auth still works correctly
  });

  it('should preserve navigation structure', () => {
    // Test that navigation hasn't been broken
  });

  it('should keep all API endpoints', () => {
    // Test that no endpoints have been removed
  });
});
```

### 8. Communication with AI

#### 8.1 Effective Prompting
```markdown
## GOOD Prompt Example:
"Update the dashboard widget following the patterns in
`src/components/widgets/BaseWidget.jsx`. Maintain the
existing prop interface and preserve all current functionality.
The widget should support real-time updates via SSE as
documented in `.specify/stable/real-time-updates.md`."

## BAD Prompt Example:
"Fix the dashboard"
```

#### 8.2 Context Injection
```javascript
// Always provide context
const aiContext = `
Project: Sentia Manufacturing Dashboard
Stack: React 18, Vite, Express, PostgreSQL
Auth: Clerk (DO NOT CHANGE)
Patterns: Service layer, Repository pattern
Constraints: See .specify/locks/
`;
```

### 9. Quality Gates

#### 9.1 Mandatory Gates
```yaml
quality-gates:
  pre-commit:
    - lint
    - format
    - type-check

  pre-push:
    - test
    - build
    - security-scan

  pre-merge:
    - coverage-check
    - performance-test
    - drift-detection
```

#### 9.2 Gate Enforcement
```json
// .husky/pre-commit
{
  "hooks": {
    "pre-commit": "npm run quality:pre-commit",
    "pre-push": "npm run quality:pre-push"
  }
}
```

### 10. Monitoring and Metrics

#### 10.1 Drift Metrics
```javascript
const driftMetrics = {
  codeQuality: {
    eslintErrors: 0,     // Target
    testCoverage: 80,    // Minimum %
    buildTime: 15,       // Maximum seconds
    bundleSize: 2000     // Maximum KB
  },

  functionalIntegrity: {
    workingFeatures: 47,  // Count
    apiEndpoints: 138,    // Count
    brokenTests: 0        // Maximum
  }
};
```

#### 10.2 Trend Analysis
```javascript
// Track quality over time
const qualityTrend = [
  { date: '2025-01-01', score: 95 },
  { date: '2025-01-15', score: 93 },
  { date: '2025-02-01', score: 91 }  // Drift detected!
];
```

## Implementation Priority

1. **Immediate** (Day 1)
   - Create specification lock files
   - Document critical invariants
   - Set up validation scripts

2. **Short-term** (Week 1)
   - Implement drift detection
   - Create AI instruction templates
   - Establish quality gates

3. **Long-term** (Month 1)
   - Full monitoring system
   - Automated recovery procedures
   - Comprehensive documentation

---

*This anti-drift strategy ensures that AI assistants enhance rather than degrade code quality.*