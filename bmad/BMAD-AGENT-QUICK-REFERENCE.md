# BMAD-METHOD Agent Quick Reference

**Updated**: 2025-10-19
**Project**: CapLiquify Platform AI Dashboard
**BMAD Version**: v6-alpha (Latest)

---

## Available Agents

All agents are now available in `bmad/core/agents/`. Each agent is a specialized AI persona with specific commands and workflows.

### Planning Agents

#### 📊 Analyst (Mary)
**File**: `bmad/core/agents/analyst.md`
**Role**: Business Analyst
**Use for**: Market research, brainstorming, competitive analysis, project briefs, brownfield documentation

**Key Commands**:
- `*help` - Show all commands
- `*brainstorm {topic}` - Facilitate structured brainstorming
- `*create-competitor-analysis` - Create competitor analysis document
- `*create-project-brief` - Create project brief
- `*perform-market-research` - Create market research document
- `*research-prompt {topic}` - Generate deep research prompt
- `*elicit` - Run advanced elicitation
- `*doc-out` - Output full document
- `*yolo` - Toggle Yolo Mode
- `*exit` - Exit analyst mode

**When to use**: Initial project discovery, understanding existing systems, market research

---

#### 🏗️ Architect (Alex)
**File**: `bmad/core/agents/architect.md`
**Role**: Solution Architect
**Use for**: Solution architecture, technical specifications, system design, tech stack decisions

**Key Commands**:
- `*help` - Show all commands
- `*solution-architecture` - Create solution architecture
- `*tech-spec` - Create technical specification
- `*story-context` - Inject technical context into stories
- `*assess-nfr` - Assess non-functional requirements
- `*risk-profile` - Create risk profile
- `*trace-requirements` - Trace requirements to implementation
- `*exit` - Exit architect mode

**When to use**: Designing system architecture, creating tech specs, reviewing technical decisions

---

#### 📋 Product Manager (Pat)
**File**: `bmad/core/agents/pm.md`
**Role**: Product Manager
**Use for**: Product planning, PRD creation, epic breakdown, feature roadmap

**Key Commands**:
- `*help` - Show all commands
- `*workflow-status` - Check project workflow status
- `*plan-project` - Create project plan and PRD
- `*create-epic` - Create new epic
- `*prioritize` - Prioritize features/epics
- `*exit` - Exit PM mode

**When to use**: Creating product roadmap, defining epics, prioritizing features

---

#### 📝 Product Owner (Parker)
**File**: `bmad/core/agents/po.md`
**Role**: Product Owner
**Use for**: Story refinement, acceptance criteria, backlog management

**Key Commands**:
- `*help` - Show all commands
- `*refine-story` - Refine user story
- `*create-acceptance-criteria` - Create acceptance criteria
- `*prioritize-backlog` - Prioritize story backlog
- `*exit` - Exit PO mode

**When to use**: Refining stories, defining acceptance criteria, managing backlog

---

### Development Agents

#### 🏃 Scrum Master (Sam)
**File**: `bmad/core/agents/sm.md`
**Role**: Scrum Master
**Use for**: Story creation, sprint coordination, retrospectives, course correction

**Key Commands**:
- `*help` - Show all commands
- `*create-story` - Create new user story
- `*create-brownfield-story` - Create story for existing codebase
- `*validate-story` - Validate story completeness
- `*retrospective` - Run sprint/epic retrospective
- `*correct-course` - Correct course when issues arise
- `*exit` - Exit SM mode

**When to use**: Creating stories, running retrospectives, managing sprint workflow

**Most Common**: Use this agent to create stories from epics

---

#### 💻 Developer (Dev)
**File**: `bmad/core/agents/dev.md`
**Role**: Software Developer
**Use for**: Code implementation, technical delivery, story development

**Key Commands**:
- `*help` - Show all commands
- `*dev-story` - Implement user story
- `*develop-story {story-id}` - Develop specific story
- `*debug` - Debug current implementation
- `*exit` - Exit dev mode

**When to use**: Implementing stories, writing code, technical implementation

**Most Common**: Use this agent to implement stories created by SM

---

#### 🧪 QA (Quinn)
**File**: `bmad/core/agents/qa.md`
**Role**: Quality Assurance
**Use for**: Quality review, testing, story validation, defect tracking

**Key Commands**:
- `*help` - Show all commands
- `*review-story` - Review completed story
- `*test-design` - Design test cases
- `*qa-gate` - Run QA gate checklist
- `*apply-fixes` - Apply QA fixes
- `*exit` - Exit QA mode

**When to use**: Reviewing completed stories, testing implementations, quality gates

**Most Common**: Use this agent to review stories after dev completes them

---

### Specialty Agents

#### 🎨 UX Expert (Uma)
**File**: `bmad/core/agents/ux-expert.md`
**Role**: UX/UI Designer
**Use for**: User experience design, UI/UX review, interaction design

**Key Commands**:
- `*help` - Show all commands
- `*ux-review` - Review UX/UI design
- `*create-wireframe` - Create wireframe
- `*user-flow` - Design user flow
- `*exit` - Exit UX mode

**When to use**: Designing interfaces, reviewing UX, creating user flows

---

#### 🎯 BMAD Master
**File**: `bmad/core/agents/bmad-master.md`
**Role**: BMAD Framework Expert
**Use for**: Framework guidance, methodology questions, process help

**Key Commands**:
- `*help` - Show all commands
- `*explain` - Explain BMAD concept
- `*guide` - Get methodology guidance
- `*kb-mode` - Enter knowledge base mode
- `*exit` - Exit master mode

**When to use**: Learning BMAD, understanding workflows, methodology questions

---

#### 🤖 BMAD Orchestrator
**File**: `bmad/core/agents/bmad-orchestrator.md`
**Role**: Multi-Agent Orchestrator
**Use for**: Coordinating multiple agents, complex workflows, agent delegation

**Key Commands**:
- `*help` - Show all commands
- `*orchestrate` - Orchestrate multi-agent workflow
- `*delegate` - Delegate task to appropriate agent
- `*workflow` - Execute complex workflow
- `*exit` - Exit orchestrator mode

**When to use**: Complex tasks requiring multiple agents, workflow automation

---

## Core Workflows

Located in `bmad/core/workflows/`:

### Brownfield Workflows (Our Project Type)
- `brownfield-fullstack.yaml` - Full-stack brownfield project workflow ⭐ **Use This**
- `brownfield-service.yaml` - Backend service brownfield workflow
- `brownfield-ui.yaml` - Frontend UI brownfield workflow

### Greenfield Workflows
- `greenfield-fullstack.yaml` - Full-stack greenfield project workflow
- `greenfield-service.yaml` - Backend service greenfield workflow
- `greenfield-ui.yaml` - Frontend UI greenfield workflow

---

## Core Tasks

Located in `bmad/core/tasks/` (21 tasks available):

### Story Management
- `create-next-story.md` - Create next story from epic
- `create-brownfield-story.md` - Create story for existing codebase ⭐ **Use This**
- `brownfield-create-story.md` - Alternative brownfield story creation
- `validate-next-story.md` - Validate story before starting

### Quality & Review
- `review-story.md` - Review completed story ⭐ **Use This**
- `qa-gate.md` - Run QA gate checklist
- `apply-qa-fixes.md` - Apply fixes from QA review
- `test-design.md` - Design test cases

### Planning & Analysis
- `advanced-elicitation.md` - Advanced requirements elicitation
- `create-deep-research-prompt.md` - Create research prompts
- `facilitate-brainstorming-session.md` - Run brainstorming sessions
- `document-project.md` - Document existing project (brownfield)

### Epic Management
- `brownfield-create-epic.md` - Create epic for existing codebase ⭐ **Use This**
- `correct-course.md` - Correct course when issues arise

### Architecture & Design
- `nfr-assess.md` - Assess non-functional requirements
- `risk-profile.md` - Create risk profile
- `trace-requirements.md` - Trace requirements to implementation
- `shard-doc.md` - Shard large documents

### Frontend/UI
- `generate-ai-frontend-prompt.md` - Generate AI prompts for frontend

### Knowledge Management
- `index-docs.md` - Index documentation
- `kb-mode-interaction.md` - Knowledge base interaction

---

## Checklists

Located in `bmad/core/checklists/` (6 checklists):

- `architect-checklist.md` - Architecture review checklist
- `change-checklist.md` - Change management checklist
- `pm-checklist.md` - Product manager checklist
- `po-master-checklist.md` - Product owner master checklist
- `story-dod-checklist.md` - Story definition of done ⭐ **Use This**
- `story-draft-checklist.md` - Story draft checklist

---

## Templates

Located in `bmad/core/templates/` (13 templates):

Document templates for creating standardized outputs from agents.

---

## Typical BMAD Workflow for Our Project

### Phase 1: Planning (PM Agent)
```
1. bmad pm workflow-status
2. bmad pm plan-project  # Creates/updates PRD
3. bmad pm create-epic   # Creates epics from PRD
```

### Phase 2: Story Creation (SM Agent)
```
1. bmad sm create-brownfield-story  # Creates story from epic
2. bmad sm validate-story           # Validates story
```

### Phase 3: Implementation (Dev Agent)
```
1. bmad dev dev-story {story-id}  # Implements story
```

### Phase 4: Quality Review (QA Agent)
```
1. bmad qa review-story {story-id}  # Reviews implementation
2. bmad qa qa-gate                  # Runs quality gate
```

### Phase 5: Retrospective (SM Agent)
```
1. bmad sm retrospective  # After epic completion
2. bmad sm correct-course # If issues found
```

---

## Configuration

**Main Config**: `bmad/core/core-config.yaml`

**Key Settings**:
- Project type: `brownfield-fullstack`
- Scale: `level-4`
- Stories location: `bmad/stories/`
- Epics location: `bmad/epics/`
- Retrospectives: `bmad/retrospectives/`

---

## Quick Tips

1. **Always start with `*help`** when entering an agent mode to see available commands
2. **Use brownfield-specific workflows** for our existing codebase
3. **Follow SM → Dev → QA cycle** for story implementation
4. **Run retrospectives after each epic** to capture learnings
5. **Use architect agent** for technical decisions and architecture changes
6. **Use analyst agent** for understanding existing systems and requirements

---

## Need Help?

1. **Framework Questions**: Use `bmad bmad-master` agent
2. **Workflow Guidance**: Check `bmad/core/workflows/brownfield-fullstack.yaml`
3. **Task Instructions**: Read task files in `bmad/core/tasks/`
4. **Quality Standards**: Review checklists in `bmad/core/checklists/`
5. **Documentation**: See [BMAD-METHOD-V6A-IMPLEMENTATION.md](BMAD-METHOD-V6A-IMPLEMENTATION.md)

---

**Updated**: 2025-10-19
**Agent Count**: 10
**Task Count**: 21
**Workflow Count**: 6
**Status**: ✅ Complete Agent Suite Installed
