# 👨‍💻 Developer Onboarding Checklist

Welcome to the CapLiquify Manufacturing Platform development team! This guide will help you get set up and familiar with our enterprise development workflow.

## Day 1: Environment Setup

### Prerequisites Installation

- [ ] Install Node.js v18+ (https://nodejs.org)
- [ ] Install Git (https://git-scm.com)
- [ ] Install VS Code (https://code.visualstudio.com)
- [ ] Install GitHub CLI (https://cli.github.com)
- [ ] Install PostgreSQL client tools

### Repository Access

- [ ] GitHub repository access granted
- [ ] Clone repository:
  ```bash
  git clone https://github.com/financeflo-ai/sentia-manufacturing-dashboard.git
  cd sentia-manufacturing-dashboard
  ```
- [ ] Set up Git credentials:
  ```bash
  git config user.name "Your Name"
  git config user.email "your.email@company.com"
  ```

### Local Development Setup

- [ ] Install dependencies:
  ```bash
  npm install --legacy-peer-deps
  ```
- [ ] Copy environment template:
  ```bash
  cp .env.template .env
  ```
- [ ] Request development environment variables from DevOps lead
- [ ] Configure `.env` file with provided credentials

### Verify Setup

- [ ] Run development server:
  ```bash
  npm run dev
  ```
- [ ] Access http://localhost:3000
- [ ] Verify backend at http://localhost:5000/health
- [ ] Run tests:
  ```bash
  npm test
  ```

## Day 2: Codebase Familiarization

### Documentation Review

- [ ] Read [ENTERPRISE_DEPLOYMENT_GUIDE.md](./ENTERPRISE_DEPLOYMENT_GUIDE.md)
- [ ] Review [ENTERPRISE_GIT_WORKFLOW.md](./ENTERPRISE_GIT_WORKFLOW.md)
- [ ] Study [CODE_REVIEW_GUIDELINES.md](./CODE_REVIEW_GUIDELINES.md)
- [ ] Understand [CLAUDE.md](./CLAUDE.md) for AI assistant usage

### Architecture Understanding

- [ ] Review project structure:
  ```
  src/           - Frontend React code
  api/           - Backend API endpoints
  services/      - Business logic layer
  prisma/        - Database schema
  mcp-server/    - AI integration server
  scripts/       - Automation scripts
  ```
- [ ] Understand tech stack:
  - Frontend: React 18, Vite, Tailwind CSS
  - Backend: Node.js, Express, Prisma
  - Database: PostgreSQL (Render)
  - AI: MCP Server with Claude/GPT-4
  - Deployment: Render platform

### Key Components

- [ ] Dashboard system (`src/pages/Dashboard.jsx`)
- [ ] Authentication (`src/components/auth/`)
- [ ] API integration (`services/api/`)
- [ ] Database models (`prisma/schema.prisma`)

## Day 3: Development Workflow

### Branch Management

- [ ] Understand branch structure:
  - `development` - Active development
  - `test` - UAT environment
  - `production` - Live system
- [ ] Practice creating feature branch:
  ```bash
  .\scripts\create-feature-branch.ps1 -FeatureName "test-feature"
  ```

### Commit Standards

- [ ] Learn conventional commits:
  ```bash
  feat: new feature
  fix: bug fix
  docs: documentation
  chore: maintenance
  ```
- [ ] Install commit message helper (optional):
  ```bash
  npm install -g commitizen
  ```

### Code Review Process

- [ ] Review PR template (`.github/pull_request_template.md`)
- [ ] Understand approval requirements:
  - Dev→Dev: 1 approval
  - Dev→Test: 1 approval
  - Test→Prod: 2 approvals

## Day 4: Tools & Services

### Render Platform

- [ ] Get Render dashboard access
- [ ] Understand services:
  - Development environment
  - Testing environment
  - Production environment
  - MCP AI server
- [ ] Learn to check logs and metrics

### External Services

- [ ] Understand API integrations:
  - Clerk (Authentication)
  - Xero (Accounting)
  - Shopify (E-commerce)
  - Unleashed (ERP)
- [ ] Review API documentation in `context/api-documentation/`

### Monitoring Tools

- [ ] Learn health check endpoints
- [ ] Practice using monitoring scripts:
  ```bash
  .\monitor-render-services.ps1
  ```

## Day 5: First Contribution

### Starter Task

- [ ] Assigned first "good first issue"
- [ ] Create feature branch
- [ ] Implement solution
- [ ] Write/update tests
- [ ] Update documentation

### First Pull Request

- [ ] Complete PR template
- [ ] Request code review
- [ ] Address review feedback
- [ ] Get approval and merge

### Deployment Process

- [ ] Watch promotion to test environment
- [ ] Participate in UAT verification
- [ ] Observe production deployment

## Week 2: Advanced Topics

### Database Operations

- [ ] Understand Prisma schema
- [ ] Learn migration process:
  ```bash
  npx prisma migrate dev
  npx prisma studio
  ```
- [ ] Practice database queries

### AI Integration

- [ ] Understand MCP server architecture
- [ ] Review AI tools and capabilities
- [ ] Test AI features locally

### Performance Optimization

- [ ] Learn React performance patterns
- [ ] Understand database indexing
- [ ] Review bundle optimization

### Security Practices

- [ ] Complete security training
- [ ] Run security audit:
  ```bash
  npm audit
  ```
- [ ] Review OWASP guidelines

## Week 3: Emergency Procedures

### Hotfix Process

- [ ] Review hotfix workflow
- [ ] Practice creating hotfix:
  ```bash
  .\scripts\create-hotfix.ps1 -FixDescription "test" -Severity medium
  ```
- [ ] Understand rollback procedures

### Incident Response

- [ ] Learn incident severity levels
- [ ] Review escalation process
- [ ] Understand on-call responsibilities

## Week 4: Full Cycle

### Complete Feature Development

- [ ] Take ownership of a feature
- [ ] Design and implement solution
- [ ] Write comprehensive tests
- [ ] Document changes
- [ ] Deploy through all environments

### Code Review Participation

- [ ] Review other developers' PRs
- [ ] Provide constructive feedback
- [ ] Learn from review comments

## Resources & Support

### Documentation

- [Technical Specifications](./context/technical-specifications/)
- [Business Requirements](./context/business-requirements/)
- [API Documentation](./context/api-documentation/)
- [UI Components Guide](./context/ui-components/)

### Communication Channels

- **Slack Channels**:
  - #dev-general - General development
  - #dev-help - Get help
  - #deployments - Deployment notifications
  - #incidents - Production issues

### Key Contacts

| Role          | Name       | Contact | For                         |
| ------------- | ---------- | ------- | --------------------------- |
| Tech Lead     | [Name]     | [Email] | Architecture, code reviews  |
| DevOps Lead   | [Name]     | [Email] | Infrastructure, deployments |
| Product Owner | [Name]     | [Email] | Requirements, priorities    |
| Mentor        | [Assigned] | [Email] | Daily guidance              |

## Learning Path

### Month 1: Foundation

- Master development workflow
- Understand codebase structure
- Complete first features
- Participate in code reviews

### Month 2: Proficiency

- Lead feature development
- Handle complex bugs
- Optimize performance
- Contribute to architecture

### Month 3: Expertise

- Mentor new developers
- Lead technical initiatives
- Handle production issues
- Improve processes

## Checklist Sign-off

### Developer

- [ ] All Day 1-5 tasks completed
- [ ] Environment fully functional
- [ ] First PR merged
- [ ] Access to all required services

**Name**: **\*\***\_\_\_**\*\***
**Date**: **\*\***\_\_\_**\*\***
**Signature**: **\*\***\_\_\_**\*\***

### Mentor/Manager

- [ ] Developer properly onboarded
- [ ] All access granted
- [ ] First tasks assigned
- [ ] Ready for independent work

**Name**: **\*\***\_\_\_**\*\***
**Date**: **\*\***\_\_\_**\*\***
**Signature**: **\*\***\_\_\_**\*\***

## Feedback

Please provide feedback on this onboarding process:

- What was helpful?
- What was missing?
- What could be improved?

Submit feedback to: [DevOps Lead Email]

---

**Welcome to the team! We're excited to have you contribute to the CapLiquify Manufacturing Platform.**

_Remember: Don't hesitate to ask questions. We're here to help you succeed!_

