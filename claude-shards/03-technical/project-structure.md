# Project Structure

**Last Updated**: October 20, 2025
**Category**: Technical
**Related Shards**: [architecture-overview.md](./architecture-overview.md)

## Directory Structure

```
src/                    # Frontend React application
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (Header, Sidebar, Grid)
│   ├── widgets/        # Dashboard widgets
│   └── WorkingCapital/ # Financial management components
├── hooks/              # Custom React hooks (useAuthRole, useSSE)
├── lib/                # Utility functions
├── pages/              # Page components (Dashboard, AdminPanel)
├── services/           # API services and query client
├── stores/             # Zustand state stores
├── styles/             # CSS files
└── utils/              # Helper utilities

sentia-mcp-server/      # Standalone MCP Server (NEW)
├── src/
│   ├── server.js       # Main MCP server implementation
│   ├── config/         # Server configuration
│   ├── utils/          # Server utilities (logger, error handling)
│   ├── middleware/     # Dashboard integration middleware
│   ├── routes/         # API routes for dashboard communication
│   └── tools/          # Dynamic MCP tools
├── scripts/            # Startup and utility scripts
├── tests/              # MCP server tests
├── docs/               # MCP server documentation
├── package.json        # MCP-specific dependencies
├── render.yaml         # Separate deployment configuration
└── Dockerfile          # Container configuration

context/
├── api-documentation/      # External API docs
├── business-requirements/  # Business logic documentation
├── claude-code-docs/      # Claude Code documentation
├── technical-specifications/ # Tech stack docs (includes MCP setup)
├── ui-components/         # UI/UX specifications
├── authentication-config.md # Authentication system details
├── xero-integration-guide.md # Xero setup instructions
├── development-standards.md # Code quality standards
├── security-guidelines.md # Security practices
└── performance-testing.md # Performance and testing info

database/               # Database scripts and migrations
prisma/                # Prisma schema and migrations
public/                # Static assets
tests/                 # Test files (unit, integration, e2e)
services/              # Backend service modules
scripts/               # Utility scripts

claude-shards/         # Modular CLAUDE.md documentation (NEW)
├── 01-methodology/    # BMAD method, auto-update, git agent
├── 02-project-context/# Ecosystem, multi-tenant, implementation status
├── 03-technical/      # Architecture, auth, integrations, database
├── 04-deployment/     # Infrastructure, environment, branch strategy
└── 05-guidelines/     # Reality summary, standards, instructions
```

## Key Configuration Files

- **CLAUDE.md** - Main guidance file for Claude Code (now navigation index)
- **package.json** - Node.js dependencies and scripts
- **vite.config.js** - Frontend build configuration
- **render.yaml** - Deployment configuration for Render
- **prisma/schema.prisma** - Database schema definition
- **.env.template** - Environment variable template
- **tsconfig.json** - TypeScript configuration
- **tailwind.config.js** - Tailwind CSS configuration

## Service Architecture

The application uses a **3-service architecture**:

1. **Frontend Service** - React application UI
2. **Backend API Service** - Express REST API + Prisma
3. **MCP Server Service** - External API integrations

Each service deploys independently on Render with its own health check endpoint.

---

[← Previous: Database Config](./database-config.md) | [Back to Main →](../../CLAUDE.md)