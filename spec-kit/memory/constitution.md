<!-- Sync Impact Report
Version change: 1.0.0 → 2.0.0
Modified principles:
- Added: I. Render-Only Deployment
- Added: II. MCP Server Integration
- Added: III. Enterprise Architecture
- Added: IV. Security First
- Added: V. Real Data Only
- Added: VI. Context-Driven Development
- Added: VII. Git Workflow Standards
Added sections:
- Deployment Standards
- Integration Requirements
Templates requiring updates: ✅ updated
- /templates/plan-template.md: ✅ updated
- /templates/spec-template.md: ✅ updated
- /templates/tasks-template.md: ✅ updated
-->

# Sentia Manufacturing Dashboard Constitution

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

## Integration Requirements

### External Service Integration
All external services MUST integrate through Unified API Interface:
- Xero: Real-time financial data and accounting
- Shopify: UK/USA e-commerce sales analytics
- Unleashed: Manufacturing ERP and production data
- Amazon SP-API: Supply chain and inventory
- OpenAI/Anthropic: AI-powered intelligence via MCP Server

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

**Version**: 2.0.0 | **Ratified**: 2025-09-01 | **Last Amended**: 2025-09-21