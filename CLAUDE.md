# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 **CRITICAL DATA INTEGRITY RULE**
**MANDATORY**: NO FALLBACK, MOCK, OR DEMO DATA is allowed on the dashboard or stored in the database. Only real, live data must be used for all business operations, financial calculations, and dashboard displays.

**Exception**: Clerk authentication bypass in development mode only (see authentication section).

**This rule applies to**:
- Dashboard widgets and displays
- Financial calculations and reports
- Inventory and production data
- API responses and database storage
- All business intelligence and analytics

**Error Handling Requirements**:
- When components fail to retrieve real data, they MUST show clear "no data available" states
- Detailed error messages and connection status MUST be logged to help debug integration issues
- Development mode SHOULD provide enhanced debugging information without showing mock data
- Error logging MUST include specific failure reasons (authentication, timeout, network, API errors)
- Components SHOULD gracefully indicate data source connectivity status without fabricating data

## CRITICAL SENIOR DEVELOPER RECOMMENDATIONS (IMPLEMENTED)

### **NAVIGATION SYSTEM - WORLD-CLASS ENTERPRISE LEVEL** ✅
**Issue**: Navigation menu was not built or deployed, making the application incomplete and difficult to navigate at world-class enterprise level.

**Solution Implemented**:
- **Clickable Sentia Logo** (`src/components/layout/Header.jsx:540-551`): Logo with "S" brand icon navigates to dashboard home
- **Enterprise Sidebar Navigation** (`src/components/layout/Sidebar.jsx:131-230`): Complete navigation system with:
  - Overview: Dashboard home
  - Planning & Analytics: Demand Forecasting, Inventory Management, AI Analytics
  - Financial Management: Working Capital, What-If Analysis, Financial Reports
  - Data Management: Data Import, Import Templates
  - Administration: Admin Panel, System Config
- **Keyboard Shortcuts**: G+O (Dashboard), G+F (Forecasting), G+I (Inventory), G+W (Working Capital), G+A (What-If), G+R (Reports), G+D (Data Import)
- **Role-Based Access Control**: Navigation items filtered by user permissions
- **Responsive Design**: Works on mobile, tablet, desktop with collapsible sidebar

### **BUTTON FUNCTIONALITY - ALL WORKING** ✅
**Issue**: Many buttons did not work, causing poor user experience.

**Solution Implemented** (`src/components/layout/Header.jsx:480-528`):
- **Export Button**: Downloads JSON file with dashboard data
- **Save Layout Button**: Saves dashboard layout to localStorage
- **Share Button**: Copies shareable URL to clipboard
- **Working Capital Button**: Navigates to `/working-capital`
- **What-If Analysis Button**: Navigates to `/what-if`
- **Run Forecast Button**: Navigates to `/forecasting`
- **Optimize Stock Button**: Navigates to `/inventory`

### **WHAT-IF ANALYSIS & WORKING CAPITAL PAGES** ✅
**Issue**: Sliders and what-if analysis pages were not working and available.

**Solution Implemented**:
- **What-If Analysis**: Fully accessible at `/what-if` route with interactive sliders for scenario modeling
- **Working Capital**: Complete financial management interface at `/working-capital`
- **Navigation Access**: Both pages prominently featured in sidebar navigation and header quick actions
- **Functional Components**: `WhatIfAnalysis.jsx` and `WorkingCapital.jsx` properly routed in `App.jsx`

### **ENTERPRISE GIT WORKFLOW** ✅
**Issue**: Not following world-class enterprise workflow with proper development → testing → production progression.

**Solution Implemented** (`ENTERPRISE_GIT_WORKFLOW.md`):
- **Development Branch**: Active coding and development area (https://sentia-manufacturing-dashboard-621h.onrender.com)
- **Test Branch**: User Acceptance Testing environment (https://sentia-manufacturing-dashboard-test.onrender.com)
- **Production Branch**: Live production for daily operations (https://sentia-manufacturing-dashboard-production.onrender.com)
- **Quality Gates**: Formal UAT process, client approval required before production
- **Documentation**: Complete workflow documentation with checklists and procedures

### **AI ANALYTICS INTEGRATION** ✅
**Issue**: No unified AI system for manufacturing intelligence.

**Solution Implemented** (September 2025):
- **AI Analytics Endpoints**: Built-in AI analysis capabilities for manufacturing data
- **Real-time Data Processing**: Live analysis of production, inventory, and financial metrics
- **Database Integration**: Advanced analytics powered by PostgreSQL with direct queries
- **WebSocket Broadcasting**: Live analytics responses pushed to all clients
- **Production Deployment**: Complete integration deployed to Render with health monitoring

### **MCP SERVER ARCHITECTURE** ✅
**Issue**: MCP server was integrated into main dashboard, lacking modularity and independent scaling.

**Solution Implemented** (October 2025):
- **Modular Architecture**: Complete separation into `sentia-mcp-server/` directory
- **Independent Deployment**: Separate Render services for dashboard and MCP server
- **Dashboard Integration**: Secure HTTP API with JWT authentication for inter-service communication
- **Tool Management**: Dynamic tool loading system with comprehensive error handling
- **Production Ready**: Enterprise-grade configuration, monitoring, logging, and health checks
- **Claude Desktop**: Standalone integration via stdio transport for direct Claude access

**Technical Implementation**:
- **Location**: `./sentia-mcp-server/` (complete standalone project)
- **Dependencies**: Minimal MCP-specific packages (9 core dependencies)
- **API Endpoints**: `/api/dashboard/*` for secure dashboard integration
- **Transport Support**: Dual transport (stdio + HTTP) for maximum compatibility
- **Deployment URLs**: 
  - Production: `sentia-mcp-production.onrender.com`

## AUTHENTICATION SYSTEM
**See**: `context/authentication-config.md` for complete authentication setup including:
- Development branch bypass configuration (ONLY exception to real data rule)
- Production Clerk setup with RBAC
- Branch-specific configuration
- Security best practices

## XERO INTEGRATION
**See**: `context/xero-integration-guide.md` for complete Xero setup including:
- Custom connection migration details
- Step-by-step setup process
- API integration features
- Environment configuration

## RENDER-ONLY DEPLOYMENT (NO LOCAL DEVELOPMENT)

### 🚀 WE ARE 100% CLOUD-BASED - NO LOCAL DEVELOPMENT
All development, testing, and production runs exclusively on Render.

### Live Environments
- **Development**: https://sentia-manufacturing-dashboard-621h.onrender.com
- **Testing**: https://sentia-manufacturing-dashboard-test.onrender.com
- **Production**: https://sentia-manufacturing-dashboard-production.onrender.com

### Deployment Commands
```bash
# Push to development (auto-deploys)
git push origin development

# Push to test (auto-deploys)
git push origin test

# Push to production (auto-deploys)
git push origin production
```

### Render Build Commands (Automated - Do Not Run Locally)
- `pnpm run build` - Used by Render for building
- `pnpm run start:render` - Used by Render for starting
- These run automatically on Render after git push

### ❌ DEPRECATED - DO NOT USE
- ~~`npm run dev`~~ - No local development
- ~~`npm run dev:client`~~ - No local frontend
- ~~`npm run dev:server`~~ - No local backend
- ~~`localhost:3000`~~ - Use Render URLs
- ~~`localhost:5000`~~ - Use Render URLs
- ~~`.env` files~~ - Use Render environment variables

### Managing Environment Variables
1. Go to https://dashboard.render.com
2. Select your service
3. Click "Environment" tab
4. Add/update variables
5. Service auto-redeploys

### Monitoring
- **Logs**: Render Dashboard → Service → Logs
- **Health**: `{service-url}/health`
- **Metrics**: Render Dashboard → Service → Metrics

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

#### Frontend (Vite - VITE_ prefix)
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

## Architecture Overview

### Full-Stack Node.js Architecture with AI Integration
- **Frontend**: React 18 + Vite 4 + Tailwind CSS - User interface (port 3000)
- **Backend**: Node.js + Express - REST API and business logic (port 5000)
- **Database**: Render PostgreSQL with Prisma ORM
- **Authentication**: Clerk for user authentication and RBAC
- **Real-time**: Server-Sent Events (SSE) + WebSocket for live data updates
- **AI Integration**: Built-in analytics and processing capabilities
- **Development**: Vite dev server proxies `/api/*` requests to Express backend
- **Production**: React build served as static files, Express serves API and analytics endpoints

### Enhanced Dashboard System

#### Production Dashboard Features
- **Responsive Grid Layout**: 12-column responsive grid using react-grid-layout with drag-and-drop widgets
- **Role-Based Access Control**: Complete RBAC system with admin/manager/operator/viewer roles and 20+ granular permissions
- **Real-time Updates**: Server-Sent Events integration for live data updates and job status monitoring
- **State Management**: Zustand for layout persistence, TanStack Query for data fetching and caching
- **Widget System**: Modular widget architecture with 7 core widgets (KPI Strip, Demand Forecast, Working Capital, etc.)
- **Dark/Light Themes**: Complete theming system with user preference persistence
- **Keyboard Shortcuts**: Navigate with hotkeys (g+o for dashboard, g+f for forecasts, etc.)
- **Edit Mode**: In-place dashboard customization with visual grid editing

#### Core Routes
- **Enhanced Dashboard** (`/dashboard`): Main production dashboard with all features
- **Basic Dashboard** (`/dashboard/basic`): Fallback to original simple dashboard
- **Working Capital** (`/working-capital`): Comprehensive financial management
- **Admin Panel** (`/admin`): User and system management

#### Technical Stack
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

## Branch and Deployment Strategy

### Branch Structure
- `development` - Primary development branch (default)
- `test` - User acceptance testing environment
- `production` - Live production environment

### Render Deployment Configuration

#### Main Application Deployments
- **Development**: sentia-manufacturing-dashboard-621h.onrender.com [primary deployment of all code changes]
- **Testing**: sentia-manufacturing-dashboard-test.onrender.com [test environment for users]
- **Production**: sentia-manufacturing-dashboard-production.onrender.com [live environment updated after test has passed after UAT]

#### Server File Configuration (SIMPLIFIED - October 2025)
**SIMPLIFIED CONFIGURATION**: Server startup confusion has been eliminated.

**Current Production Configuration**:
- **Render Configuration**: `render.yaml` specifies `startCommand: "node server.js"` for ALL environments
- **Production Server**: `/server.js` (root level) - Contains full enterprise functionality
- **Development Server**: `server/index.js` used only for local development (`npm run dev:server`)
- **Legacy Files**: All other server files moved to `archive/` folder for safety

**Configuration Clarity**:
- ✅ **What configs say**: `node server.js`
- ✅ **What actually runs**: `server.js` (same file)
- ✅ **No Hidden Overrides**: No render-start.js or conflicting scripts
- ✅ **Single Source of Truth**: One production server file

**To Deploy API Changes**: Modify `/server.js` (root level) - the only production server

**Configuration Simplification (October 2025)**:
- **FIXED**: Eliminated hidden `render-start.js` override that caused confusion
- **FIXED**: Consolidated enterprise functionality into main `server.js`
- **FIXED**: Removed conflicting server files and scripts
- **RESULT**: Configuration transparency - what you see is what runs

#### MCP Server (AI Central Nervous System)
- **MCP Server**: mcp-server-tkyu.onrender.com

#### Database Configuration
- All environments use Render PostgreSQL with pgvector extension
- Automatic connection string injection via render.yaml
- Support for vector embeddings and semantic search

### Development Workflow (Implemented)
**Enterprise Git Workflow**: Proper development → testing → production progression:

1. **Development Branch**: All coding, fixing, and development work happens in `development` branch (sentia-manufacturing-dashboard-621h.onrender.com)
2. **Test Branch**: Push to `test` branch for user acceptance testing at sentia-manufacturing-dashboard-test.onrender.com
3. **Production Branch**: Only push to `production` when software is ready to go live at sentia-manufacturing-dashboard-production.onrender.com

**Quality Gates**: Formal UAT process with client approval required before production deployment.

### 🚨 **CRITICAL DEPLOYMENT RULE**
**NEVER AUTOMATICALLY COMMIT, PUSH, OR CREATE PULL REQUESTS TO TESTING/PRODUCTION BRANCHES**

Claude must ONLY work in the `development` branch. Any commits, pushes, or PRs to `test` or `production` branches require explicit manual instruction from the user.

**Allowed in Development Branch**:
- ✅ Make commits to `development` branch
- ✅ Push to `development` branch  
- ✅ Create PRs within `development` branch

**FORBIDDEN Without Explicit Instruction**:
- ❌ Commit to `test` branch
- ❌ Commit to `production` branch
- ❌ Push to `test` branch
- ❌ Push to `production` branch
- ❌ Create PRs to `test` branch
- ❌ Create PRs to `production` branch
- ❌ Merge to `test` branch
- ❌ Merge to `production` branch

**Exception**: Only when user explicitly says "commit to test", "push to production", "create PR to production", etc.

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

## Important Instructions

### 🚨 **CRITICAL GIT DEPLOYMENT RULE**
**MANDATORY**: Claude must NEVER automatically commit, push, or create pull requests to `test` or `production` branches without explicit user instruction. Only work in `development` branch unless specifically told otherwise.

### Render Platform Configuration Notes
- Deployment uses Render for all environments (development, testing, production)
- Application is an Express/Node.js server serving both API and static React build
- PostgreSQL databases with pgvector extension for AI/ML capabilities
- Auto-deployment configured for all three branches via render.yaml
- Environment variables automatically injected from Render dashboard
- Health checks configured at `/health` endpoint
- Remember no shortcuts and no emergency pages - I want the full 100% working enterprise level software application deployed on Render