<!-- Sync Impact Report
Version change: 2.1.0 → 2.2.0
Modified principles:
- Added: Purpose Statement - Working Capital and Cash Flow Expertise
- Enhanced: Integration Requirements with Working Capital Calculator
Previous additions (v2.1.0):
- Added: VIII. Deployment Verification Rule
Previous additions (v2.0.0):
- Added: I. Render-Only Deployment
- Added: II. MCP Server Integration
- Added: III. Enterprise Architecture
- Added: IV. Security First
- Added: V. Real Data Only
- Added: VI. Context-Driven Development
- Added: VII. Git Workflow Standards
Added sections:
- Purpose Statement (NEW)
- Deployment Standards (enhanced with verification requirements)
- Integration Requirements (enhanced with Working Capital Calculator)
Templates requiring updates: ✅ updated
- /templates/plan-template.md: ✅ updated
- /templates/spec-template.md: ✅ updated
- /templates/tasks-template.md: ✅ updated
-->

# Sentia Manufacturing Dashboard Constitution

## Purpose Statement - Working Capital and Cash Flow Expertise

The Sentia Manufacturing Dashboard exists to answer three critical business questions:

### 1. Cash Coverage Analysis
**"How much cash in the bank do I need to cover my expenses 30, 60, 90, 120, 180 days ahead?"**
Taking into account all incoming revenue and outgoing expenses, providing real-time visibility into cash runway and liquidity positions.

### 2. Current Operations Funding
**"Do I need cash injection (investment, overdraft, additional shareholder, Private Equity injection) to fund my current operations?"**
Analyzing working capital gaps and identifying when external funding is required to maintain operations.

### 3. Growth Funding Requirements
**"If I want to grow at X%, how much cash injection do I need to fund my growth?"**
Modeling growth scenarios and calculating precise funding requirements for expansion plans.

### Core Working Capital Metrics We Track
- **Cash Flow Projections**: 30, 60, 90, 120, 180-day forecasts
- **Debtor Days (DSO)**: Average days to collect payment
- **Creditor Days (DPO)**: Average days to pay suppliers
- **Cash Conversion Cycle**: Time to convert investments back to cash
- **Working Capital Optimization**: Unlock cash without new debt
- **Industry Benchmarks**: Revenue per employee, margin comparisons
- **Inventory Turns**: For product-based manufacturing only

### Working Capital Calculator Features
- **Cash Unlock Estimation**: Calculate potential cash release in 90 days
- **12-Month Improvement Projections**: Without new debt or external funding
- **Working Capital Levers**: Actionable recommendations for improvement
- **Board-Ready Talking Points**: Executive-level insights and metrics
- **AI-Powered Benchmarking**: Industry-specific comparisons via LLM integration

**Rationale**: Manufacturing businesses fail not from lack of profit but from lack of cash. We are the Working Capital and Cash Flow Experts, providing the financial intelligence needed to maintain healthy cash positions and fund sustainable growth.

## Core Principles

### I. Render-Only Deployment (NON-NEGOTIABLE)
All development, testing, and production MUST run exclusively on Render cloud infrastructure. No local development servers are permitted. The MCP Server MUST always be hosted at mcp-server-tkyu.onrender.com. We NEVER use Docker or Caddy with Railway deployments. All environment variables MUST be managed through Render Dashboard, not local .env files.

**Rationale**: Cloud-first ensures consistent environments, eliminates "works on my machine" issues, and maintains enterprise-grade reliability.

### II. MCP Server Integration
The Enterprise MCP Server (Model Context Protocol) serves as the AI Central Nervous System for all manufacturing operations. It MUST orchestrate all LLM interactions (Claude 3.5 Sonnet, GPT-4 Turbo, Gemini Pro) through a unified interface. All AI features MUST route through the MCP server at https://mcp-server-tkyu.onrender.com. Vector database with pgvector extension MUST be used for semantic memory.

**Rationale**: Centralized AI orchestration ensures consistent intelligence layer, unified API management, and scalable decision-making.

### III. Enterprise Architecture
Maintain strict separation: Frontend (React/Vite) on port 3000, Backend (Node.js/Express) on port 5000, MCP Server on port 3001. Authentication MUST use Clerk with production keys at clerk.financeflo.ai. Database MUST be Render PostgreSQL with pgvector. All external APIs (Xero, Shopify, Unleashed) MUST integrate through the Unified API Interface.

**Rationale**: Clear architectural boundaries ensure maintainability, scalability, and security across enterprise systems.

### IV. Security First
Address all security vulnerabilities before production deployment. NEVER commit secrets or API keys to repository. Use Clerk RBAC for all access control (Admin, Manager, Operator, Viewer roles). Implement HMAC signature validation for webhooks. CSP headers MUST be properly configured. All API endpoints MUST validate authentication tokens.

**Rationale**: Enterprise manufacturing data requires bank-level security to protect business operations and maintain compliance.

### V. Real Data Only
NEVER use fake, mock, or dummy data in the application. ALL data MUST come from real APIs (Xero, Shopify, Unleashed) or actual spreadsheet imports. Test with production-like data in dedicated test environment. No Lorem Ipsum, no placeholder values, no synthetic datasets.

**Rationale**: Manufacturing decisions require accurate, real-time data; mock data creates dangerous false confidence in system outputs.

### VI. Context-Driven Development
All development MUST reference context/ folder documentation. Follow CLAUDE.md guidelines explicitly. Reference technical specifications for consistency. Maintain strict validation to prevent AI drift. Use structured context folders: api-documentation/, business-requirements/, technical-specifications/, ui-components/.

**Rationale**: Context-driven approach ensures consistency, prevents requirement drift, and maintains alignment with business objectives.

### VII. Git Workflow Standards
Follow enterprise workflow: development → test → production branches. Development branch for all coding work. Test branch requires UAT approval. Production branch only after formal sign-off. Auto-deployment configured for all branches via render.yaml. Document all changes in commit messages with technical details.

**Rationale**: Proper version control ensures traceability, enables rollback, and maintains clear deployment progression.

### VIII. Deployment Verification Rule (NON-NEGOTIABLE)
Any change or update is ONLY considered verified when it displays 100% correctly in Render deployment. Verification FAILS if:
- Render deployment fails or shows errors
- Screen is blank or shows loading indefinitely
- UI is broken, misaligned, or incorrect
- Components fail to render or show error boundaries
- API endpoints return errors or incorrect data
- Authentication flow is broken or redirects incorrectly
- Any functionality that worked before the change no longer works

Verification PASSES only when:
- Render deployment succeeds with green status
- All pages load and display correctly
- UI matches intended design without visual defects
- All functionality operates as specified
- No console errors in browser developer tools
- API health checks return successful responses

**Rationale**: Render deployment is the single source of truth. Local testing means nothing if Render deployment fails. This prevents broken code from reaching users and ensures production reliability.

## Deployment Standards

### Render Platform Requirements
- All services MUST deploy through Render (development, testing, production)
- Build commands automated via render.yaml configuration
- Health checks configured at /health endpoints
- Auto-deployment enabled for git push to respective branches
- Environment variables managed exclusively through Render Dashboard
- PostgreSQL databases with pgvector extension mandatory

### Forbidden Practices
- NO local development servers (npm run dev deprecated)
- NO Docker containers for deployment
- NO Caddy server configuration
- NO localhost URLs in production code
- NO .env files for configuration
- NO manual deployment processes
- NO merging code that fails Render deployment verification
- NO assuming local success equals Render success

## Integration Requirements

### External Service Integration
All external services MUST integrate through Unified API Interface:
- Xero: Real-time financial data and accounting (critical for cash flow)
- Shopify: UK/USA e-commerce sales analytics (revenue tracking)
- Unleashed: Manufacturing ERP and production data (inventory management)
- Amazon SP-API: Supply chain and inventory
- OpenAI/Anthropic: AI-powered intelligence via MCP Server (benchmarking)

### Working Capital Calculator Requirements
The Working Capital module MUST provide:
- **Input Metrics**: Annual Revenue, DSO, DPO, Current Debtors/Creditors, Gross/Net Margins, EBITDA, Cash on Hand
- **Growth Sliders**: Revenue growth projections, DSO reduction targets, DPO extension goals
- **Cash Unlock Calculations**: 90-day and 12-month improvement estimates
- **Industry Benchmarking**: AI-powered comparison against industry standards
- **Scenario Modeling**: What-if analysis for different growth rates
- **Funding Gap Analysis**: Calculate external funding requirements
- **Board Reporting**: Executive-ready insights and talking points
- **Real-time Integration**: Live data from Xero for actual cash positions

### Authentication Standards
- Clerk authentication mandatory for all user access
- Production keys: pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ
- RBAC enforcement at component and API levels
- Session validation on every protected route
- Webhook security with HMAC signatures

### Code Quality Standards
- ASCII characters only in console output (no Unicode)
- ESLint configuration excluding dist/ and build/ folders
- Structured logging with logInfo, logWarn, logError
- Test coverage >80% for critical business logic
- Commit messages with clear technical details

## Governance

### Amendment Process
- Constitution supersedes all other development practices
- Amendments require documentation in CLAUDE.md
- Major changes require client approval before implementation
- All pull requests MUST verify constitution compliance
- Version increments follow semantic versioning:
  - MAJOR: Removing principles or breaking architectural changes
  - MINOR: Adding new principles or significant expansions
  - PATCH: Clarifications and minor refinements

### Compliance Verification
- All code reviews MUST check constitution alignment
- Deployment pipeline validates security requirements
- MCP Server health checks mandatory before deployment
- Database migrations require backup verification
- Use CLAUDE.md as primary runtime development guidance
- MUST verify Render deployment success before marking any task complete
- MUST check deployed UI displays correctly (not blank/broken)
- MUST confirm all functionality works in Render environment

**Version**: 2.2.0 | **Ratified**: 2025-09-01 | **Last Amended**: 2025-09-21