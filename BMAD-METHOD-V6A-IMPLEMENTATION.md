# BMAD-METHOD v6a Implementation Plan

## Sentia Manufacturing AI Dashboard

**Date**: 2025-10-17
**Version**: v6a Alpha
**Repository**: https://github.com/bmad-code-org/BMAD-METHOD
**Status**: IN PROGRESS

---

## Executive Summary

This document outlines the complete implementation of BMAD-METHOD v6a (Agentic Agile Driven Development) for the Sentia Manufacturing AI Dashboard project. BMAD-METHOD replaces the previous SpecKit methodology with a structured four-phase approach: Analysis, Planning, Solutioning, and Implementation.

---

## 1. BMAD-METHOD v6a Overview

### Core Philosophy

- **Human Amplification, Not Replacement**: AI agents coach, mentor, and collaborate rather than replace human thinking
- **Context-Engineered Development**: Hyper-detailed stories contain full implementation context
- **Scale-Adaptive Planning**: Automatic routing through workflows based on project complexity (Level 0-4)
- **Just-In-Time Design**: Technical specifications created per-epic during implementation

### Four Phases

```
Phase 1: ANALYSIS (Optional)
├─ brainstorm-project → research → product-brief
└─ Output: Project understanding, requirements

Phase 2: PLANNING (Required)
├─ workflow-status → plan-project → Scale determination (0-4)
└─ Output: PRD, Epics, Initial stories (Level 0-1 only)

Phase 3: SOLUTIONING (Level 3-4 only)
├─ solution-architecture → tech-spec (JIT per epic)
└─ Output: Solution architecture, technical specifications

Phase 4: IMPLEMENTATION (Iterative)
├─ create-story → story-context → dev-story → review-story
├─ retrospective (per epic) → correct-course (if needed)
└─ Output: Working software, learned improvements
```

---

## 2. Sentia Manufacturing Project Classification

### Current State Analysis

**Project Type**: Brownfield (Existing codebase with production deployments)
**Domain**: Manufacturing Intelligence Platform
**Scale Level**: **Level 4** (40+ stories, 5+ epics, complex enterprise system)

**Rationale**:

- Existing codebase: 2,000+ files
- Production deployments: Development, Testing, Production environments
- Complex integrations: Xero, Shopify, Amazon SP-API, Unleashed ERP
- Multiple domains: Financial planning, inventory management, forecasting, production tracking
- AI/ML components: Demand forecasting, working capital optimization

---

## 3. Implementation Strategy

### Phase 1: ANALYSIS (Skip - Existing Product)

**Decision**: SKIP Phase 1
**Reason**: Product brief and requirements already established through previous work

**Existing Artifacts**:

- context/business-requirements/sentia_business_model.md
- context/business-requirements/acceptance_criteria.md
- context/business-requirements/user_workflows.md
- CLAUDE.md (comprehensive development guidelines)

### Phase 2: PLANNING (Start Here)

**Entry Point**: `bmad analyst workflow-status`

**Actions**:

1. Initialize BMAD workflow-status
2. Run `bmad pm plan-project`
3. System will determine Level 4 (complex enterprise)
4. Generate:
   - Product Requirements Document (PRD)
   - Epic breakdown
   - Feature roadmap

**Output Directory**: `bmad/planning/`

### Phase 3: SOLUTIONING (Required for Level 4)

**Actions**:

1. Run `bmad architect 3-solutioning`
2. Generate solution-architecture.md
3. Create tech-specs per epic (JIT during Phase 4)

**Output Directory**: `bmad/solutioning/`

### Phase 4: IMPLEMENTATION (Current Phase)

**Iterative Cycle**:

```
FOR EACH EPIC:
  1. bmad sm create-story       # Scrum Master creates user story
  2. bmad architect story-context # Inject technical context
  3. bmad dev dev-story          # Developer implements
  4. bmad qa review-story        # QA reviews and tests
  5. IF issues: bmad sm correct-course
  6. WHEN epic complete: bmad sm retrospective
NEXT EPIC
```

**Output Directory**: `bmad/stories/`

---

## 4. BMAD Agent Roles

### Planning Agents

**Analyst Agent** (`bmad analyst`)

- Responsible for: Requirements gathering, research, analysis
- Key workflows: brainstorm-project, research, product-brief
- Current status: Not needed (brownfield project)

**Product Manager Agent** (`bmad pm`)

- Responsible for: Project planning, epic creation, roadmap
- Key workflows: plan-project, workflow-status
- **Next action**: Initialize planning for Sentia project

**Architect Agent** (`bmad architect`)

- Responsible for: Solution architecture, technical specifications
- Key workflows: 3-solutioning, solution-architecture, tech-spec, story-context
- **Next action**: Create solution architecture

### Development Agents

**Scrum Master Agent** (`bmad sm`)

- Responsible for: Story creation, sprint coordination, retrospectives
- Key workflows: create-story, retrospective, correct-course
- **Next action**: Create story backlog from existing requirements

**Developer Agent** (`bmad dev`)

- Responsible for: Code implementation, technical delivery
- Key workflows: dev-story
- **Next action**: Implement stories with full context

**QA Agent** (`bmad qa`)

- Responsible for: Quality assurance, testing, review
- Key workflows: review-story
- **Next action**: Review and validate implementations

---

## 5. Migration from SpecKit to BMAD

### Removed (Completed)

- ✅ `.specify/` directory (deleted)
- ✅ `spec-kit/` directory (deleted)
- ✅ `speckit.config.js` (deleted)
- ✅ `.github/SPECKIT.md` (deleted)
- ✅ `docs/bmad-measurement-mock-data.md` (deleted - was misleading, not BMAD framework)

### Added

- ✅ `bmad/` directory (framework copied from v6-alpha)
- ✅ BMAD-METHOD-V6A-IMPLEMENTATION.md (this document)
- ⏳ BMAD configuration files (pending)
- ⏳ Workflow-status initialization (pending)
- ⏳ Story files (pending)

---

## 6. Manufacturing Domain Customization

### Custom BMAD Expansion Pack: Manufacturing Intelligence

**Location**: `bmad/expansion-packs/manufacturing-intelligence/`

**Specialized Agents**:

1. **Demand Forecasting Specialist** - AI-powered demand prediction
2. **Inventory Optimization Expert** - Stock level optimization
3. **Financial Planning Analyst** - Working capital, cash flow
4. **Integration Architect** - External API integrations (Xero, Shopify, etc.)
5. **Production Tracking Specialist** - Manufacturing operations
6. **Quality Control Expert** - QC workflows and metrics

**Custom Workflows**:

- `manufacturing-epic-creation` - Domain-specific epic templates
- `api-integration-story` - Integration story patterns
- `financial-feature-context` - Financial domain expertise injection
- `ai-model-implementation` - ML/AI feature implementation

---

## 7. Mock Data Elimination Strategy

### Current Mock Data Locations (from deleted bmad-measurement-mock-data.md)

**Server API Routes**:

- server/index.js - Hard-coded KPI, cash flow, sales data
- server/api/working-capital.js - Fabricated AR/AP topDebtors/topCreditors
- server/api/enhanced-forecasting.js - Mock demand data
- server/routes/sse.js - Random metrics broadcast
- server/routes/data.js - Mock analytics payloads

**Backend Services**:

- src/services/DemandForecastingEngine.js - Simulated forecasts
- src/services/FinancialAlgorithms.js - Synthetic baselines
- src/services/WorkingCapitalEngine.js - Estimated multipliers
- src/services/api/APIIntegration.js - Mocked status messages

**Client Components**:

- src/components/DemandForecasting.jsx - Expects synthetic data
- src/components/FinancialReports.jsx - Renders randomized figures
- src/components/InventoryManagement.jsx - Mock inventory data
- src/components/widgets/\* - Various mock data consumers

### BMAD Story Creation for Real API Integration

**Epic**: "Eliminate All Mock Data with Live API Integration"

**Stories to Create**:

1. **Connect Xero Financial Data** - Replace mock financial KPIs with Xero API
2. **Connect Shopify Sales Data** - Replace mock sales metrics with Shopify API
3. **Connect Amazon SP-API Orders** - Replace mock order data with Amazon API
4. **Connect Unleashed Inventory** - Replace mock inventory with Unleashed ERP
5. **Implement Real-time Data Streaming** - Replace SSE mock broadcasts with live data
6. **Add API Fallback Handling** - Graceful degradation when APIs unavailable
7. **Update UI for Empty States** - Handle missing/loading data properly

**BMAD Workflow**:

```bash
# For each story above:
bmad sm create-story --epic "eliminate-mock-data" --story "connect-xero-financial-data"
bmad architect story-context --story "connect-xero-financial-data"
bmad dev dev-story --story "connect-xero-financial-data"
bmad qa review-story --story "connect-xero-financial-data"
```

---

## 8. Next Immediate Actions

### Step 1: Initialize BMAD Workflow (TODAY)

```bash
cd /c/Projects/The-social-drink-companysentia-ai-manufacturing-app/sentia-ai-manufacturing-app
bmad pm workflow-status
# Follow prompts:
# - Project context: Brownfield
# - Current phase: Phase 2 (Planning needed)
# - Scale: Level 4 (complex enterprise)
```

### Step 2: Create Project Planning Artifacts (TODAY)

```bash
bmad pm plan-project
# Input:
# - Project name: Sentia Manufacturing AI Dashboard
# - Type: Software (Manufacturing Intelligence Platform)
# - Scale: Level 4 (40+ stories, 5+ epics)
# - Description: AI-powered manufacturing planning and financial optimization

# Outputs:
# - bmad/planning/prd.md (Product Requirements Document)
# - bmad/planning/epics.md (Epic breakdown)
# - bmad/planning/roadmap.md (Feature roadmap)
```

### Step 3: Solution Architecture (TOMORROW)

```bash
bmad architect 3-solutioning
# Review existing architecture and create:
# - bmad/solutioning/solution-architecture.md
# - System design for manufacturing intelligence platform
```

### Step 4: Story Creation and Implementation (ONGOING)

```bash
# Create story backlog
bmad sm create-story --from-requirements context/business-requirements/

# Start implementation cycle
bmad dev dev-story --priority high
bmad qa review-story --latest
```

---

## 9. Success Criteria

### BMAD Implementation Complete When:

- ✅ BMAD framework installed and configured
- ⏳ Workflow-status initialized and tracking project state
- ⏳ PRD generated with full product requirements
- ⏳ All epics defined with clear scope and acceptance criteria
- ⏳ Story backlog created from existing requirements
- ⏳ Manufacturing intelligence expansion pack created
- ⏳ All agents (Analyst, PM, Architect, SM, Dev, QA) operational
- ⏳ First complete story cycle executed (create → context → dev → review → retrospective)

### Mock Data Elimination Complete When:

- ⏳ All server API routes return real data or 503 errors
- ⏳ All backend services connect to live APIs
- ⏳ All client components handle real data and empty states
- ⏳ No Math.random() or faker.js usage in production code
- ⏳ API fallback mechanisms tested and documented
- ⏳ User documentation updated with real data requirements

---

## 10. Documentation Updates Required

### Files to Update:

1. **CLAUDE.md** - Replace SpecKit references with BMAD-METHOD v6a
2. **README.md** - Update development methodology section
3. **context/development-methodology/** - Replace vibe_coding_guide.md with BMAD workflows
4. **context/README.md** - Update directory structure and methodology references
5. **DEVELOPER_ONBOARDING.md** - Add BMAD workflow training

### New Files to Create:

1. **BMAD-AGENT-GUIDE.md** - How to use each BMAD agent
2. **BMAD-WORKFLOW-REFERENCE.md** - Quick reference for all workflows
3. **MANUFACTURING-EXPANSION-PACK.md** - Custom domain agents and workflows

---

## 11. Rollout Timeline

### Week 1 (Current): Foundation

- [x] Remove SpecKit methodology
- [ ] Initialize BMAD framework
- [ ] Create PRD and epic breakdown
- [ ] Generate solution architecture

### Week 2: Story Creation

- [ ] Create story backlog from existing requirements
- [ ] Prioritize stories for sprint 1
- [ ] Execute first story cycle
- [ ] Refine workflows based on retrospective

### Week 3-4: Mock Data Elimination

- [ ] Implement real API integration stories
- [ ] Test and validate live data flows
- [ ] Update documentation
- [ ] Train team on BMAD workflows

### Week 5: Production Readiness

- [ ] Complete all high-priority stories
- [ ] Comprehensive QA and testing
- [ ] Deploy to production
- [ ] Monitor and optimize

---

## 12. Team Training Requirements

### Required Knowledge:

1. **BMAD-METHOD v6a Philosophy** - Understanding Agentic Agile
2. **Four-Phase Workflow** - Analysis, Planning, Solutioning, Implementation
3. **Agent Roles** - When to use each specialized agent
4. **Story-Context Workflow** - How technical context is injected
5. **Retrospective Process** - Continuous improvement cycle

### Training Resources:

- BMAD-METHOD GitHub: https://github.com/bmad-code-org/BMAD-METHOD
- BMAD YouTube Channel: https://www.youtube.com/@BMadCode
- BMAD Discord Community: https://discord.gg/gk8jAdXWmj
- Internal: bmad/docs/ directory

---

## 13. Monitoring and Metrics

### BMAD Workflow Metrics:

- Story cycle time (create → complete)
- Context injection effectiveness
- Retrospective insights per epic
- Code quality improvements
- Team velocity and throughput

### Mock Data Elimination Metrics:

- Percentage of endpoints using real data
- API integration test coverage
- Error handling robustness
- User experience during data loading

---

## Conclusion

BMAD-METHOD v6a provides the structured, agentic framework needed to transform the Sentia Manufacturing AI Dashboard from a mock-data prototype into a production-ready enterprise platform. By following this implementation plan, we ensure:

1. **Systematic Approach**: Four-phase methodology with clear gates
2. **Quality Focus**: Agent-driven reviews and retrospectives
3. **Context Preservation**: Story-context prevents information loss
4. **Continuous Improvement**: Retrospective learnings feed back into process
5. **Real Data Integration**: Eliminate all mocks with live API connections

**Status**: Ready to begin Phase 2 (Planning) initialization.

**Next Action**: Run `bmad pm workflow-status` to initialize BMAD tracking.

---

**Generated**: 2025-10-17
**Framework**: BMAD-METHOD v6a Alpha
**Project**: Sentia Manufacturing AI Dashboard
**Maintained By**: Development Team
