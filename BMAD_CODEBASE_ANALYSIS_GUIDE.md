# BMAD Codebase Analysis & Alignment Guide

## Complete Step-by-Step Process for CapLiquify Manufacturing Platform

**Purpose**: Fully analyze, assess, and align the codebase and context files with the initial project brief, then review, revise, and enhance the original intent.

**Date**: October 17, 2025
**Project**: Sentia Manufacturing AI Dashboard
**BMAD Method**: v6a (Agentic Agile Driven Development)
**Scale Level**: Level 4 (Complex Enterprise System)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Initialize BMAD Workflow](#phase-1-initialize-bmad-workflow)
4. [Phase 2: Strategic Analysis (PM Agent)](#phase-2-strategic-analysis-pm-agent)
5. [Phase 3: Technical Analysis (Architect Agent)](#phase-3-technical-analysis-architect-agent)
6. [Phase 4: Review and Interpret Results](#phase-4-review-and-interpret-results)
7. [Phase 5: Create Action Plan](#phase-5-create-action-plan)
8. [Phase 6: Implementation](#phase-6-implementation)
9. [Expected Outputs](#expected-outputs)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### What This Guide Achieves

This guide will help you:

✅ **Analyze** the entire codebase against original project requirements
✅ **Assess** what's implemented vs what's claimed vs what's missing
✅ **Identify** mock data locations and incomplete integrations
✅ **Align** current implementation with original business intent
✅ **Review** and revise the project vision based on current state
✅ **Enhance** the original intent with learned insights
✅ **Generate** a prioritized roadmap for completion

### The BMAD Two-Agent Approach

```
┌─────────────────────────────────────────────────────────┐
│           BMAD ANALYSIS WORKFLOW                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Step 1: PM Agent (Strategic Analysis)                 │
│  ├─ Analyze original requirements                      │
│  ├─ Review current implementation                      │
│  ├─ Identify gaps and misalignments                    │
│  └─ Generate PRD with alignment report                 │
│          ↓                                              │
│  Step 2: Architect Agent (Technical Analysis)          │
│  ├─ Assess codebase architecture                       │
│  ├─ Identify technical debt                            │
│  ├─ Review integrations and mock data                  │
│  └─ Generate solution architecture                     │
│          ↓                                              │
│  Step 3: Synthesis (Combined Report)                   │
│  ├─ Business + Technical alignment                     │
│  ├─ Prioritized action items                           │
│  ├─ Story backlog for completion                       │
│  └─ Enhanced project vision                            │
└─────────────────────────────────────────────────────────┘
```

### Time Estimate

- **Phase 1-3 (Analysis)**: 30-60 minutes (mostly automated)
- **Phase 4 (Review)**: 1-2 hours (manual review of reports)
- **Phase 5 (Planning)**: 1-2 hours (creating action plan)
- **Phase 6 (Implementation)**: Ongoing (weeks/months)

---

## Prerequisites

### Required Software

- [ ] **BMAD Method CLI** installed

  ```bash
  npm install -g bmad-method
  # Or check installation:
  bmad --version
  ```

- [ ] **Claude Code** extension in VSCode (for slash commands)

- [ ] **Git** configured and working

- [ ] **Node.js 18+** and **pnpm** installed

### Required Access

- [ ] Project repository cloned locally
- [ ] Read access to all context files
- [ ] Understanding of original project requirements

### Context Files to Have Ready

Located in `context/business-requirements/`:

- [ ] `sentia_business_model.md` - Original business model
- [ ] `acceptance_criteria.md` - Success criteria
- [ ] `user_workflows.md` - User stories and workflows
- [ ] `CLAUDE.md` - Development guidelines and current state

---

## Phase 1: Initialize BMAD Workflow

### Step 1.1: Navigate to Project Directory

```bash
# Open terminal and navigate to project root
cd /c/Projects/The-social-drink-companycapliquify-ai-dashboard-app/capliquify-ai-dashboard-app

# Verify you're in the correct directory
pwd
ls -la CLAUDE.md  # Should exist
```

### Step 1.2: Verify BMAD Installation

```bash
# Check BMAD is installed
bmad --version

# If not installed, install it:
npm install -g bmad-method

# Verify installation
bmad --help
```

Expected output:

```
BMAD Method v6a - Agentic Agile Driven Development
Available commands:
  bmad pm          - Product Manager agent
  bmad architect   - Solution Architect agent
  bmad analyst     - Business Analyst agent
  ...
```

### Step 1.3: Initialize Workflow Status

```bash
# Initialize BMAD tracking for this project
bmad pm workflow-status
```

**What this does**:

- Analyzes project type (Brownfield/Greenfield)
- Determines scale level (0-4)
- Identifies current phase
- Creates tracking directory structure

**Expected output**:

```
🔍 Analyzing project...

Project Type: Brownfield (Existing codebase)
Scale Level: Level 4 (Complex Enterprise)
  - 2,000+ files
  - Multiple environments (dev/test/prod)
  - Complex integrations (Xero, Shopify, Amazon, Unleashed)
  - AI/ML components

Current Phase: Planning (Phase 2)
Recommended: Start with 'bmad pm plan-project'

Workflow initialized: bmad/.workflow-status.json
```

### Step 1.4: Review Project Context

Before running analysis, review these key files:

```bash
# Review current state documentation
code CLAUDE.md

# Review business requirements
code context/business-requirements/sentia_business_model.md
code context/business-requirements/acceptance_criteria.md

# Take notes on:
# 1. Original project goals
# 2. Claimed functionality
# 3. Known gaps (CLAUDE.md documents this well)
```

**Key findings from CLAUDE.md** (lines 89-106):

- ✅ 75% implementation (UI, auth, deployment, some business logic)
- ❌ 25% mock data (Business Intelligence, What-If Analysis, some integrations)
- 🔄 Recent improvements (Working Capital, Demand Forecasting, Shopify/Xero integrations)

---

## Phase 2: Strategic Analysis (PM Agent)

### Step 2.1: Run Product Manager Analysis

```bash
# Run the PM agent to analyze and plan
bmad pm plan-project
```

**The PM Agent will prompt you for information**:

```
📋 Project Planning Session

Project Name: Sentia Manufacturing AI Dashboard
Project Type: Manufacturing Intelligence Platform
Scale Level: 4 (Complex Enterprise)

Analyzing existing context...
- Found: context/business-requirements/
- Found: CLAUDE.md
- Found: 2,157 files

Press Enter to continue...
```

### Step 2.2: PM Agent Analysis Process

The PM agent will automatically:

1. **Read All Context Files** (5-10 minutes)
   - Business model
   - Acceptance criteria
   - User workflows
   - CLAUDE.md (current state)
   - All files in `context/`

2. **Scan Codebase** (10-15 minutes)
   - Identify implemented features
   - Map code to requirements
   - Find mock data locations
   - Check integration implementations

3. **Generate Alignment Analysis** (5-10 minutes)
   - Compare original intent vs implementation
   - Identify gaps and discrepancies
   - Categorize completion status
   - Prioritize missing features

### Step 2.3: PM Agent Outputs

Watch for these files to be created:

```bash
# Monitor output directory
watch ls -la bmad/planning/

# Files being created:
bmad/planning/
├── prd.md                      # Product Requirements Document
├── epics.md                    # Epic breakdown with status
├── roadmap.md                  # Feature roadmap
├── alignment-report.md         # Original vs Current analysis
├── gap-analysis.md             # Missing features
└── mock-data-locations.md      # All mock data found
```

### Step 2.4: Review PM Agent Outputs

Once complete, review each document:

```bash
# Open all planning documents
code bmad/planning/prd.md
code bmad/planning/alignment-report.md
code bmad/planning/gap-analysis.md
```

**Key sections to review in alignment-report.md**:

1. **Original Intent Summary**
   - What was the vision?
   - What problems was it solving?
   - Who were the users?

2. **Current Implementation Status**
   - What's fully implemented?
   - What's partially implemented?
   - What's mock data?
   - What's missing entirely?

3. **Alignment Score**
   - Overall: X% aligned with original intent
   - By feature area (e.g., Working Capital: 95%, What-If: 10%)

4. **Gap Analysis**
   - Critical gaps (blocking users)
   - High-priority gaps (limiting value)
   - Medium-priority gaps (nice to have)
   - Low-priority gaps (future enhancements)

5. **Recommendations**
   - Should original intent be revised?
   - Should new features be added based on learning?
   - Should scope be reduced for faster completion?

### Step 2.5: Document Your Findings

Create notes on PM analysis:

```bash
# Create your analysis notes
code bmad/planning/MY_ANALYSIS_NOTES.md
```

**Template for your notes**:

```markdown
# My Analysis Notes - PM Agent Review

## Date: [today's date]

## Key Findings

### What Surprised Me:

- [e.g., Working Capital is actually 95% complete, not mock]
- [e.g., Demand Forecasting is real, using actual algorithms]

### Critical Gaps Identified:

1. [Feature X] - [Why critical]
2. [Feature Y] - [Impact on users]

### Original Intent Review:

- Should we stick with original vision? YES/NO
- What should we change? [notes]
- What should we add? [notes]

### Priority Changes:

- Original: [old priority list]
- Recommended: [new priority list]

## Questions for Stakeholders:

1. [Question about business priority]
2. [Question about user needs]

## Next Steps:

- [ ] Review with team
- [ ] Get stakeholder input
- [ ] Proceed to technical analysis
```

---

## Phase 3: Technical Analysis (Architect Agent)

### Step 3.1: Run Architect Agent

```bash
# Run solution architecture analysis
bmad architect 3-solutioning
```

**The Architect Agent will prompt you**:

```
🏗️  Solution Architecture Analysis

Project: Sentia Manufacturing AI Dashboard
Type: Brownfield (Existing System)
Scale: Level 4

Analyzing codebase architecture...
Press Enter to continue...
```

### Step 3.2: Architect Analysis Process

The Architect agent will:

1. **Analyze Architecture** (10-15 minutes)
   - Frontend structure (React components)
   - Backend structure (Node.js/Express)
   - Database schema (Prisma)
   - API integrations
   - Deployment configuration (Render)

2. **Assess Code Quality** (10-15 minutes)
   - ESLint errors and warnings
   - Code duplication
   - Performance issues
   - Security concerns
   - Technical debt

3. **Review Integrations** (10-15 minutes)
   - Xero API status
   - Shopify API status
   - Amazon SP-API status
   - Unleashed ERP status
   - Mock vs real implementations

4. **Identify Technical Debt** (5-10 minutes)
   - Mock data locations (from CLAUDE.md)
   - Incomplete error handling
   - Missing authentication
   - Hard-coded values
   - TODO comments

### Step 3.3: Architect Agent Outputs

Watch for these files:

```bash
# Monitor solutioning directory
watch ls -la bmad/solutioning/

# Files being created:
bmad/solutioning/
├── solution-architecture.md    # Overall architecture
├── current-state-diagram.md    # What exists now
├── target-state-diagram.md     # What should exist
├── technical-debt.md           # Issues to fix
├── integration-status.md       # API integration health
├── mock-data-report.md         # All mock data locations
├── security-assessment.md      # Security issues
└── performance-analysis.md     # Performance bottlenecks
```

### Step 3.4: Review Architect Outputs

```bash
# Open architecture documents
code bmad/solutioning/solution-architecture.md
code bmad/solutioning/technical-debt.md
code bmad/solutioning/integration-status.md
code bmad/solutioning/mock-data-report.md
```

**Key sections to review**:

1. **solution-architecture.md**
   - Current Architecture Diagram
   - Strengths of current design
   - Weaknesses and concerns
   - Target Architecture Diagram
   - Migration path

2. **technical-debt.md**
   - Critical issues (must fix)
   - High-priority issues (should fix soon)
   - Medium-priority issues (can defer)
   - Estimated effort to resolve

3. **integration-status.md**
   - Integration-by-integration analysis:

     ```
     Xero API:
     - Status: ✅ OPERATIONAL
     - Coverage: 85% (some features missing)
     - Mock fallbacks: ✅ Properly implemented
     - Issues: Rate limiting not handled

     Shopify API:
     - Status: ✅ OPERATIONAL
     - Coverage: 90%
     - Mock fallbacks: ✅ Properly implemented
     - Issues: Multi-store sync delays

     Amazon SP-API:
     - Status: ⚠️ CONFIGURED BUT NOT ACTIVE
     - Coverage: 0% (framework ready)
     - Issues: Credentials not configured

     Unleashed ERP:
     - Status: 🔄 IN PROGRESS
     - Coverage: 40%
     - Issues: Manufacturing sync incomplete
     ```

4. **mock-data-report.md**
   - Comprehensive list of all mock data
   - Location in codebase
   - Why it's mock
   - How to replace with real data
   - Estimated effort

### Step 3.5: Document Technical Findings

```bash
# Create technical notes
code bmad/solutioning/MY_TECHNICAL_NOTES.md
```

**Template**:

```markdown
# My Technical Analysis Notes

## Date: [today's date]

## Architecture Assessment

### Strengths:

- [e.g., Clean React component structure]
- [e.g., Good separation of concerns]

### Concerns:

- [e.g., Too much business logic in components]
- [e.g., Database queries not optimized]

## Critical Technical Debt:

1. [Item] - Estimated effort: [X days]
2. [Item] - Estimated effort: [X days]

## Integration Priorities:

1. [Complete Amazon SP-API] - Business impact: [HIGH]
2. [Finish Unleashed sync] - Business impact: [MEDIUM]

## Mock Data Elimination Plan:

- Phase 1 (Critical): [List items]
- Phase 2 (High): [List items]
- Phase 3 (Medium): [List items]

## Questions for Tech Lead:

1. [Technical question]
2. [Architecture decision needed]
```

---

## Phase 4: Review and Interpret Results

### Step 4.1: Synthesize Findings

Now you have two comprehensive reports:

- **PM Agent**: Business/strategic alignment
- **Architect Agent**: Technical implementation assessment

Create a synthesis document:

```bash
# Create synthesis report
code bmad/SYNTHESIS_REPORT.md
```

**Synthesis Template**:

```markdown
# Sentia Dashboard - Complete Analysis Synthesis

## Date: [today's date]

## Executive Summary

[3-5 sentences summarizing everything]

## Overall Alignment Score: [X]%

### Breakdown:

- Strategic Alignment: [X]% (PM Agent finding)
- Technical Implementation: [X]% (Architect finding)
- Integration Completeness: [X]%
- Code Quality: [X]%

## Critical Findings

### What's Working Well ✅

1. [e.g., Working Capital Engine - 95% complete, real algorithms]
2. [e.g., Deployment infrastructure - enterprise-grade]
3. [e.g., Xero/Shopify integrations - operational]

### What's Mock Data ⚠️

1. [Feature] - Location: [file paths] - Impact: [HIGH/MEDIUM/LOW]
2. [Feature] - Location: [file paths] - Impact: [HIGH/MEDIUM/LOW]

### What's Missing ❌

1. [Feature] - From original brief: [Yes/No] - Priority: [HIGH/MEDIUM/LOW]
2. [Feature] - From original brief: [Yes/No] - Priority: [HIGH/MEDIUM/LOW]

## Alignment with Original Intent

### Original Vision:

[Summary from business-requirements]

### Current Reality:

[Summary from codebase analysis]

### Gap Analysis:

[Where they differ and why]

### Recommendation:

- [ ] Continue with original vision
- [ ] Revise original vision because: [reasons]
- [ ] Enhance original vision with: [new ideas]

## Technical Debt Impact

### Critical (Must Fix Before Launch):

- [Item] - Effort: [X days] - Impact: [description]

### High Priority (Should Fix Soon):

- [Item] - Effort: [X days] - Impact: [description]

### Medium Priority (Can Defer):

- [Item] - Effort: [X days] - Impact: [description]

## Integration Status Summary

| Integration | Status         | Coverage | Issues             |
| ----------- | -------------- | -------- | ------------------ |
| Xero        | ✅ Operational | 85%      | Rate limiting      |
| Shopify     | ✅ Operational | 90%      | Sync delays        |
| Amazon      | ⚠️ Ready       | 0%       | No credentials     |
| Unleashed   | 🔄 In Progress | 40%      | Manufacturing sync |

## Revised Project Vision

### Original Intent:

[What we started with]

### Learned Insights:

[What we discovered during development]

### Enhanced Vision:

[Combining original + learnings + market feedback]

### Scope Changes Recommended:

- Add: [New features based on learning]
- Remove: [Features that don't make sense anymore]
- Defer: [Features to push to v2.0]

## Next Steps

See Phase 5 for detailed action plan.
```

### Step 4.2: Review with Stakeholders

Before proceeding, review findings with:

1. **Business Stakeholders**
   - Share: `bmad/planning/alignment-report.md`
   - Focus: Are we solving the right problems?
   - Decisions needed: Priority changes, scope adjustments

2. **Technical Team**
   - Share: `bmad/solutioning/solution-architecture.md`
   - Focus: Technical approach sound?
   - Decisions needed: Architecture changes, technical debt priority

3. **Product Owner**
   - Share: `bmad/SYNTHESIS_REPORT.md`
   - Focus: Overall direction and priorities
   - Decisions needed: Roadmap approval

### Step 4.3: Document Stakeholder Feedback

```bash
code bmad/STAKEHOLDER_FEEDBACK.md
```

**Template**:

```markdown
# Stakeholder Feedback - Analysis Review

## Date: [review date]

## Business Stakeholder Feedback

### Attendees:

- [Name, Role]

### Key Feedback:

- [Feedback item]
- [Feedback item]

### Decisions Made:

- [Decision]
- [Decision]

### Questions/Concerns:

- [Item]

## Technical Team Feedback

### Attendees:

- [Name, Role]

### Key Feedback:

- [Feedback item]

### Technical Decisions:

- [Decision]

### Resource Needs:

- [Item]

## Product Owner Feedback

### Attendees:

- [Name, Role]

### Priority Changes:

- [Change]

### Scope Decisions:

- Add: [Feature]
- Remove: [Feature]
- Defer: [Feature]

### Approval Status:

- [ ] Roadmap approved
- [ ] Budget approved
- [ ] Timeline approved
```

---

## Phase 5: Create Action Plan

### Step 5.1: Generate Story Backlog

Now that analysis is complete, generate actionable stories:

```bash
# Use BMAD to create stories from the analysis
bmad pm create-stories
```

**This will generate**:

```
bmad/stories/
├── epic-01-eliminate-mock-data/
│   ├── story-001-xero-real-data.md
│   ├── story-002-shopify-real-data.md
│   ├── story-003-error-states.md
│   └── ...
│
├── epic-02-complete-amazon-integration/
│   ├── story-001-configure-credentials.md
│   ├── story-002-order-sync.md
│   └── ...
│
├── epic-03-finish-unleashed-erp/
│   ├── story-001-manufacturing-sync.md
│   ├── story-002-quality-control.md
│   └── ...
│
└── epic-04-technical-debt/
    ├── story-001-fix-critical-lint.md
    ├── story-002-optimize-queries.md
    └── ...
```

### Step 5.2: Prioritize Stories

Create priority order based on:

1. Business value (from PM analysis)
2. Technical dependencies (from Architect analysis)
3. Risk/complexity
4. Resource availability

```bash
# Create prioritized backlog
code bmad/PRIORITIZED_BACKLOG.md
```

**Backlog Template**:

```markdown
# Prioritized Story Backlog

## Sprint 1 (Critical Items)

**Goal**: Eliminate critical mock data, establish confidence

| Priority | Story ID | Title                             | Epic | Effort | Value | Risk |
| -------- | -------- | --------------------------------- | ---- | ------ | ----- | ---- |
| P0       | E01-S01  | Replace What-If mock calculations | 01   | 5 days | HIGH  | LOW  |
| P0       | E01-S02  | Connect real Xero financial data  | 01   | 3 days | HIGH  | MED  |
| P0       | E04-S01  | Fix critical lint errors          | 04   | 2 days | MED   | LOW  |

## Sprint 2 (High Value)

**Goal**: Complete major integrations

| Priority | Story ID | Title                       | Epic | Effort | Value | Risk |
| -------- | -------- | --------------------------- | ---- | ------ | ----- | ---- |
| P1       | E02-S01  | Configure Amazon SP-API     | 02   | 3 days | HIGH  | MED  |
| P1       | E02-S02  | Implement Amazon order sync | 02   | 5 days | HIGH  | HIGH |

## Sprint 3 (Enhancement)

...

## Backlog (Future)

...
```

### Step 5.3: Create Implementation Roadmap

```bash
code bmad/IMPLEMENTATION_ROADMAP.md
```

**Roadmap Template**:

```markdown
# Implementation Roadmap - Sentia Dashboard Completion

## Vision

[Revised vision from Phase 4]

## Timeline Overview
```

Month 1: Foundation
├─ Sprint 1: Critical mock data elimination
└─ Sprint 2: Core integrations

Month 2: Enhancements
├─ Sprint 3: Advanced features
└─ Sprint 4: Technical debt cleanup

Month 3: Polish
├─ Sprint 5: Performance optimization
└─ Sprint 6: Final testing & launch

```

## Detailed Sprint Plan

### Sprint 1: Critical Mock Data (Weeks 1-2)
**Goal**: Replace all critical mock data with real implementations

**Stories**:
- [ ] E01-S01: What-If Analysis real calculations
- [ ] E01-S02: Xero financial data connection
- [ ] E01-S03: Error state handling
- [ ] E04-S01: Critical lint fixes

**Success Criteria**:
- Zero critical mock data in user-facing features
- All API connections tested
- Error handling in place

**Deployment**: To test environment after sprint

---

### Sprint 2: Major Integrations (Weeks 3-4)
**Goal**: Complete Amazon SP-API and enhance Shopify

**Stories**:
- [ ] E02-S01: Amazon credentials configuration
- [ ] E02-S02: Amazon order synchronization
- [ ] E02-S03: Amazon inventory updates
- [ ] E01-S04: Shopify multi-store optimization

**Success Criteria**:
- Amazon orders flowing to system
- Inventory synchronized
- Multi-store performance improved

**Deployment**: To test environment, smoke test in production

---

[Continue for all sprints...]

## Resource Requirements

- **Development**: [X] developers for [Y] weeks
- **Design**: [X] hours for UI/UX refinements
- **QA**: [X] tester for [Y] weeks
- **DevOps**: [X] hours for deployment optimization

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Amazon API complexity | Medium | High | Start early, allocate senior dev |
| Unleashed ERP stability | High | Medium | Build robust error handling |
| Performance issues | Low | High | Load testing in sprint 5 |

## Success Metrics

- [ ] 0% mock data in production features
- [ ] 100% critical integrations operational
- [ ] <190 lint errors (from 232)
- [ ] <500ms average API response time
- [ ] 99.9% uptime in production

## Launch Readiness Checklist

### Technical
- [ ] All critical mock data eliminated
- [ ] All integrations tested
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation updated

### Business
- [ ] UAT completed successfully
- [ ] Stakeholder approval obtained
- [ ] Training materials created
- [ ] Support process defined
- [ ] Launch communication ready
```

### Step 5.4: Assign Resources

Create resource allocation plan:

```bash
code bmad/RESOURCE_ALLOCATION.md
```

```markdown
# Resource Allocation Plan

## Team Structure

### Core Team

- **Product Owner**: [Name] - Decision making, stakeholder liaison
- **Tech Lead**: [Name] - Architecture, technical decisions
- **Senior Developer**: [Name] - Complex features, mentoring
- **Developer**: [Name] - Feature implementation
- **QA Engineer**: [Name] - Testing, quality assurance

### Support Team

- **DevOps**: [Name] - 20% allocation for deployments
- **Designer**: [Name] - As needed for UI/UX

## Sprint Assignments

### Sprint 1 (Weeks 1-2)

- **Senior Dev**: E01-S01 (What-If calculations), E01-S02 (Xero)
- **Developer**: E01-S03 (Error states), E04-S01 (Lint fixes)
- **QA**: Test plan creation, sprint 1 testing
- **Tech Lead**: Code reviews, architecture decisions

[Continue for all sprints...]
```

---

## Phase 6: Implementation

### Step 6.1: Set Up Implementation Tracking

```bash
# Initialize story tracking
bmad pm track-progress
```

This creates:

```
bmad/tracking/
├── sprint-1-burndown.md
├── story-status.md
└── daily-standups.md
```

### Step 6.2: Implement Stories with BMAD

For each story in your backlog:

```bash
# Example: Implementing story E01-S01
bmad dev story E01-S01

# BMAD will:
# 1. Load story context
# 2. Analyze codebase
# 3. Guide implementation
# 4. Generate code
# 5. Create tests
# 6. Update documentation
```

### Step 6.3: Regular Review Cycles

**Daily Standup** (5-10 minutes):

```bash
# Update daily progress
code bmad/tracking/daily-standups.md
```

**Weekly Sprint Review** (1 hour):

```bash
# Review completed stories
bmad pm sprint-review
```

**End of Sprint Retrospective** (1 hour):

```bash
# Learn and improve
bmad pm retrospective

# This generates:
# - What went well
# - What to improve
# - Action items for next sprint
```

### Step 6.4: Continuous Alignment

Every 2 weeks, check alignment:

```bash
# Quick alignment check
bmad pm check-alignment

# Compare:
# - Current implementation vs roadmap
# - Velocity vs plan
# - Quality metrics
```

---

## Expected Outputs

### By End of Analysis (Phases 1-3)

You will have:

```
bmad/
├── planning/
│   ├── prd.md                      # ✅ Complete requirements
│   ├── epics.md                    # ✅ Epic breakdown
│   ├── roadmap.md                  # ✅ Feature roadmap
│   ├── alignment-report.md         # ✅ Gap analysis
│   └── mock-data-locations.md      # ✅ All mock data
│
├── solutioning/
│   ├── solution-architecture.md    # ✅ Architecture analysis
│   ├── technical-debt.md           # ✅ Technical issues
│   ├── integration-status.md       # ✅ API health
│   └── mock-data-report.md         # ✅ Mock data details
│
├── SYNTHESIS_REPORT.md             # ✅ Combined analysis
├── STAKEHOLDER_FEEDBACK.md         # ✅ Review notes
└── .workflow-status.json           # ✅ BMAD tracking
```

### By End of Planning (Phase 5)

You will add:

```
bmad/
├── stories/
│   ├── epic-01-eliminate-mock-data/
│   ├── epic-02-complete-amazon-integration/
│   ├── epic-03-finish-unleashed-erp/
│   └── epic-04-technical-debt/
│
├── PRIORITIZED_BACKLOG.md          # ✅ Story priority
├── IMPLEMENTATION_ROADMAP.md       # ✅ Sprint plan
└── RESOURCE_ALLOCATION.md          # ✅ Team assignments
```

### During Implementation (Phase 6)

You will maintain:

```
bmad/
├── tracking/
│   ├── sprint-1-burndown.md
│   ├── sprint-2-burndown.md
│   ├── story-status.md
│   ├── daily-standups.md
│   └── retrospectives/
│       ├── sprint-1-retro.md
│       └── sprint-2-retro.md
│
└── reports/
    ├── weekly-progress-report.md
    └── alignment-tracking.md
```

---

## Troubleshooting

### Issue: BMAD CLI Not Installed

**Symptoms**: `bmad: command not found`

**Solution**:

```bash
npm install -g bmad-method

# Or if permission issues:
sudo npm install -g bmad-method

# Verify:
bmad --version
```

---

### Issue: PM Agent Not Generating Output

**Symptoms**: Agent runs but no files created

**Solution**:

```bash
# Check bmad directory exists
mkdir -p bmad/planning bmad/solutioning

# Check permissions
chmod -R 755 bmad/

# Try again
bmad pm plan-project --verbose
```

---

### Issue: Analysis Taking Too Long

**Symptoms**: Agent running for >30 minutes

**Solution**:

```bash
# Check if stuck on large files
# Exclude node_modules and build directories

# Create .bmadignore
cat > .bmadignore << EOF
node_modules/
dist/
build/
.git/
coverage/
EOF

# Try again
bmad pm plan-project
```

---

### Issue: Can't Find Context Files

**Symptoms**: Agent says "No context found"

**Solution**:

```bash
# Verify context files exist
ls -la context/business-requirements/

# If missing, restore from git:
git checkout context/

# Verify CLAUDE.md exists
ls -la CLAUDE.md

# Try again
bmad pm plan-project
```

---

### Issue: Alignment Report Shows 0%

**Symptoms**: Report shows no alignment

**Solution**:
This might be accurate! Check:

1. Are original requirements documented?
2. Does codebase have the features?
3. Review mock data locations in CLAUDE.md

The alignment might genuinely be low if:

- Features are claimed but not implemented
- Mock data is used instead of real
- Original requirements were never met

---

### Issue: Can't Generate Stories

**Symptoms**: `bmad pm create-stories` fails

**Solution**:

```bash
# Ensure planning phase completed
ls bmad/planning/prd.md
ls bmad/planning/epics.md

# If missing, run planning first:
bmad pm plan-project

# Then try stories:
bmad pm create-stories
```

---

## Quick Reference Commands

```bash
# Phase 1: Initialize
bmad pm workflow-status

# Phase 2: Strategic Analysis
bmad pm plan-project

# Phase 3: Technical Analysis
bmad architect 3-solutioning

# Phase 5: Generate Stories
bmad pm create-stories

# Phase 6: Implement Story
bmad dev story <story-id>

# Track Progress
bmad pm track-progress
bmad pm sprint-review
bmad pm retrospective

# Check Alignment
bmad pm check-alignment
```

---

## Summary Checklist

Use this checklist to track your progress:

### Phase 1: Initialize ✓

- [ ] Navigate to project directory
- [ ] Verify BMAD installed
- [ ] Run `bmad pm workflow-status`
- [ ] Review project context files

### Phase 2: Strategic Analysis ✓

- [ ] Run `bmad pm plan-project`
- [ ] Review PRD
- [ ] Review alignment report
- [ ] Review gap analysis
- [ ] Document findings

### Phase 3: Technical Analysis ✓

- [ ] Run `bmad architect 3-solutioning`
- [ ] Review solution architecture
- [ ] Review technical debt
- [ ] Review integration status
- [ ] Document technical findings

### Phase 4: Review Results ✓

- [ ] Create synthesis report
- [ ] Review with business stakeholders
- [ ] Review with technical team
- [ ] Review with product owner
- [ ] Document feedback

### Phase 5: Create Action Plan ✓

- [ ] Generate story backlog
- [ ] Prioritize stories
- [ ] Create implementation roadmap
- [ ] Allocate resources
- [ ] Get approval

### Phase 6: Implementation ✓

- [ ] Set up tracking
- [ ] Implement stories
- [ ] Regular reviews
- [ ] Monitor alignment

---

## Support Resources

- **BMAD Documentation**: https://github.com/bmad-code-org/BMAD-METHOD
- **Project Documentation**: [CLAUDE.md](CLAUDE.md)
- **Deployment Guide**: [DEPLOYMENT_GUIDE_CLAUDE_CODE.md](DEPLOYMENT_GUIDE_CLAUDE_CODE.md)
- **Commands Reference**: [.claude/commands/README.md](.claude/commands/README.md)

---

## Conclusion

Following this guide will give you:

✅ **Complete understanding** of your codebase vs original intent
✅ **Detailed analysis** of what's real vs mock
✅ **Prioritized backlog** for completion
✅ **Clear roadmap** for implementation
✅ **Enhanced vision** incorporating learned insights
✅ **Actionable stories** ready for development

**Next Step**: Start with Phase 1, Step 1.1 above!

---

**Document Version**: 1.0
**Last Updated**: October 17, 2025
**Maintained By**: Claude Code Development Team

