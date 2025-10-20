# Architecture Overview

## Full-Stack Node.js Architecture with AI Integration

- **Frontend**: React 18 + Vite 4 + Tailwind CSS - User interface (port 3000)
- **Backend**: Node.js + Express - REST API and business logic (port 5000)
- **Database**: Render PostgreSQL with Prisma ORM
- **Authentication**: Clerk for user authentication and RBAC
- **Real-time**: Server-Sent Events (SSE) + WebSocket for live data updates
- **AI Integration**: Built-in analytics and processing capabilities
- **Development**: Vite dev server proxies `/api/*` requests to Express backend
- **Production**: React build served as static files, Express serves API and analytics endpoints

## Enhanced Dashboard System

### Production Dashboard Features

- **Responsive Grid Layout**: 12-column responsive grid using react-grid-layout with drag-and-drop widgets
- **Role-Based Access Control**: Complete RBAC system with admin/manager/operator/viewer roles and 20+ granular permissions
- **Real-time Updates**: Server-Sent Events integration for live data updates and job status monitoring
- **State Management**: Zustand for layout persistence, TanStack Query for data fetching and caching
- **Widget System**: Modular widget architecture with 7 core widgets (KPI Strip, Demand Forecast, Working Capital, etc.)
- **Dark/Light Themes**: Complete theming system with user preference persistence
- **Keyboard Shortcuts**: Navigate with hotkeys (g+o for dashboard, g+f for forecasts, etc.)
- **Edit Mode**: In-place dashboard customization with visual grid editing

### Core Routes

- **Enhanced Dashboard** (`/dashboard`): Main production dashboard with all features
- **Basic Dashboard** (`/dashboard/basic`): Fallback to original simple dashboard
- **Working Capital** (`/working-capital`): Comprehensive financial management
- **Admin Panel** (`/admin`): User and system management
- **Trial Onboarding** (`/trial-onboarding`): New user onboarding wizard with sample data generation

### Technical Stack

- **Frontend**: React 18 + Vite 4 + Tailwind CSS + Heroicons + shadcn/ui components
- **State Management**: Zustand stores with localStorage persistence + TanStack Query for server state
- **Real-time**: SSE with 15+ event types and automatic query invalidation
- **Grid System**: react-grid-layout with responsive breakpoints (lg/md/sm/xs/xxs)
- **Authentication**: Seamless Clerk integration with role-based UI components
- **Database**: Prisma ORM with PostgreSQL (Render)

## Project Structure

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
```

## Database & Data Management

### Database Configuration

- **Primary**: Render PostgreSQL with pgvector extension
- **ORM**: Prisma for type-safe database operations
- **Migrations**: Prisma migrations for schema management
- **Vector Support**: pgvector for embeddings and semantic search
- **Development**: Real data connections in all environments

### Key Data Models

- **Users**: Authentication and role management
- **Financial Models**: Working capital, AR/AP, cash flow
- **Manufacturing**: Jobs, resources, capacity planning
- **Dashboard**: User layouts, widget preferences

## Environment Setup

### Prerequisites

- Node.js (v18+ recommended)
- npm (comes with Node.js)

### Development Setup

1. Install Node.js dependencies: `npm install`
2. Copy environment template: `cp .env.template .env` and configure
3. Start development servers: `npm run dev`

### Environment Configuration

Required environment variables:

#### Frontend (Vite - VITE\_ prefix)

- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk authentication key (required)
- `VITE_API_BASE_URL`: Backend API endpoint (default: http://localhost:5000/api)
- `VITE_APP_TITLE`: Application title display
- `VITE_APP_VERSION`: Version display in UI

#### Backend (Node.js)

- `NODE_ENV`: Environment mode (development/test/production)
- `PORT`: Server port (default: 5000, auto-set by Render)
- `DATABASE_URL`: PostgreSQL connection string (Render PostgreSQL with pgvector)
- `DEV_DATABASE_URL`: Development database URL
- `TEST_DATABASE_URL`: Test database URL
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `REDIS_URL`: Redis connection for caching/sessions
- `CLERK_SECRET_KEY`: Clerk backend secret key
- Various API keys (Amazon SP-API, Shopify, Unleashed, etc.)

#### AI Analytics Configuration

- `AI_ANALYTICS_ENABLED`: Enable AI analytics features (default: true)
- `LOG_LEVEL`: Logging level for application (default: info)

## Code Quality and Development Standards

**See**: `context/development-standards.md` for complete guidelines including:

- Character encoding standards
- ESLint configuration best practices
- Enterprise logging standards
- Error handling patterns
- Core development principles

## Security Guidelines

**See**: `context/security-guidelines.md` for security practices including:

- Vulnerability management
- Security action plans
- Quality gates and rollback indicators
- Documentation standards

## Performance and Testing

**See**: `context/performance-testing.md` for optimization guidelines including:

- Build performance metrics
- Memory management strategies
- Testing infrastructure setup
- API integration status

## Related Documentation

- [BMAD Method](BMAD-METHOD.md) - Development methodology
- [CapLiquify Transformation](CAPLIQUIFY-TRANSFORMATION.md) - Multi-tenant development details
- [Ecosystem Positioning](ECOSYSTEM-POSITIONING.md) - Platform relationship strategy
- [Implementation Status](IMPLEMENTATION-STATUS.md) - Feature completion tracking
- [Deployment Guide](DEPLOYMENT-GUIDE.md) - Infrastructure and deployment