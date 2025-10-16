# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 **ACTUAL IMPLEMENTATION STATUS**
**REALITY CHECK**: This application is currently a **sophisticated demo/prototype** with ~15% actual implementation. While the architecture and UI are enterprise-grade, most core business functionality relies on mock data and placeholder components.

**CURRENT STATE**:
- ✅ **UI Framework**: Modern React/Tailwind components fully functional
- ✅ **Navigation**: Complete routing and sidebar navigation system
- ✅ **Authentication**: Clerk integration with development bypass working
- ✅ **Architecture**: Enterprise-grade infrastructure and deployment setup
- ⚠️ **API Integrations**: Service classes exist but most return mock data on errors
- ❌ **Business Logic**: Core features (forecasting, analytics, working capital) are placeholders
- ❌ **Data Layer**: No real manufacturing data, extensive fallback to mock data

## 🚨 **CRITICAL DATA INTEGRITY VIOLATIONS**
**ACTUAL REALITY**: Despite documentation claiming "100% DATA INTEGRITY COMPLIANCE", the codebase systematically violates this rule throughout:

**Widespread Mock Data Usage**:
- FinancialAlgorithms.js: All calculations fallback to hardcoded values
- APIIntegration.js: Returns sample data on ANY error
- All major services: Default to mock data instead of "no data available" states

**Examples of Violations**:
```javascript
// FinancialAlgorithms.js - Returns hardcoded data on errors
catch (error) {
  return { totalAmount: 170300 } // HARDCODED MOCK DATA
}

// APIIntegration.js - Generates fake orders
return {
  orders: this.generateSampleOrders(region), // FAKE ORDERS
  revenue: region === 'UK' ? 98470 : 107970  // HARDCODED REVENUE
}
```

## IMPLEMENTATION STATUS BY FEATURE

### **✅ ACTUALLY FUNCTIONAL FEATURES (15%)**

#### **Navigation System** ✅
- **Status**: Fully implemented and working
- **Functionality**: Complete sidebar navigation, routing, keyboard shortcuts
- **Components**: Header.jsx, Sidebar.jsx with proper routing
- **Reality**: Navigation works perfectly and routes to all pages

#### **UI Framework** ✅  
- **Status**: Enterprise-grade implementation
- **Functionality**: Modern React/Tailwind, shadcn/ui components, responsive design
- **Reality**: UI components are genuinely well-designed and functional

#### **Authentication** ✅
- **Status**: Working with fallbacks
- **Functionality**: Clerk integration with development bypass
- **Reality**: Authentication actually works but has multiple fallback layers

#### **Deployment Infrastructure** ✅
- **Status**: Professional deployment setup
- **Functionality**: Render deployment with environment management
- **Reality**: Deployment and hosting infrastructure is genuinely enterprise-grade

### **⚠️ PARTIALLY IMPLEMENTED FEATURES (10%)**

#### **API Integration Framework** ⚠️
- **Status**: Service classes exist but non-functional
- **Claimed**: "Complete API integration with external services"
- **Reality**: Service classes built but most return mock data on any error
- **Examples**: Xero, Shopify, Amazon SP-API services exist but require configuration

#### **Database Schema** ⚠️
- **Status**: Comprehensive schema, empty data
- **Claimed**: "Production-ready data management"
- **Reality**: Excellent database design with 73+ models but no real data

### **❌ NON-FUNCTIONAL FEATURES (75%)**

#### **Business Intelligence** ❌
- **Status**: Complete placeholders
- **Claimed**: "Advanced AI analytics and forecasting"
- **Reality**: All components show "capabilities coming soon..." messages
- **Examples**: 
  - Demand Forecasting: Placeholder component
  - Inventory Management: Placeholder component  
  - AI Analytics: Hardcoded fake scenarios

#### **Working Capital Analysis** ❌
- **Status**: Sophisticated UI, zero business logic
- **Claimed**: "Real-time financial analysis"
- **Reality**: Beautiful interface that displays only mock financial data
- **Evidence**: FinancialAlgorithms.js returns hardcoded values like `{ totalAmount: 170300 }`

#### **What-If Analysis** ❌
- **Status**: Interactive sliders, no calculations
- **Claimed**: "Advanced scenario modeling"
- **Reality**: Sliders work but don't affect any real calculations or data

#### **External Integrations** ❌
- **Status**: Framework exists, connections broken
- **Claimed**: "Live data from Amazon, Shopify, Xero"
- **Reality**: 
  - Amazon SP-API: Disabled in server.js (line 447)
  - Shopify: Returns sample data on errors
  - Xero: Connection framework exists but unclear if functional

#### **Real-time Data** ❌
- **Status**: WebSocket infrastructure, fake updates
- **Claimed**: "Live dashboard updates"
- **Reality**: Real-time infrastructure simulates updates of mock data

### **🔄 ENTERPRISE WORKFLOW** ✅ (Infrastructure Only)
- **Development Branch**: Deploys to Render ✅
- **Test Branch**: Separate environment ✅  
- **Production Branch**: Live environment ✅
- **Reality**: Git workflow is properly implemented but deploys a demo app

## REALISTIC TIMELINE FOR ACTUAL COMPLETION

### **To Make This a Functional Manufacturing App**

**Phase 1: Data Layer Reconstruction (2-3 months)**
- Remove ALL mock data fallbacks from services
- Implement real API connections to external systems
- Build actual data processing and business logic
- Create proper error handling for missing data (no fallbacks)

**Phase 2: Core Business Features (3-4 months)**  
- Implement actual demand forecasting algorithms
- Build real inventory optimization logic
- Create functional working capital analysis
- Develop genuine AI analytics (not hardcoded scenarios)

**Phase 3: Integration & Testing (2-3 months)**
- Configure and test all external API integrations
- Implement real data validation and processing
- Performance testing with actual data volumes
- End-to-end business process validation

**Total Estimated Time: 7-10 months of focused development**

## AUTHENTICATION SYSTEM
**Status**: ✅ **Actually Working**
- Development branch bypass: Functional
- Clerk integration: Working with fallbacks  
- RBAC framework: Implemented but not enforced
- **Reality**: Authentication is one of the few genuinely functional parts

## INTEGRATION STATUS

### **Xero Integration** ⚠️
- **Framework**: Service classes exist
- **Reality**: Custom connection setup exists but unclear if functional
- **Status**: Requires configuration and testing

### **Shopify Integration** ⚠️  
- **Framework**: Multi-store service implemented
- **Reality**: Returns sample data on any error
- **Status**: Needs proper store configurations

### **Amazon SP-API** ❌
- **Framework**: Client structure built  
- **Reality**: Disabled in server.js (line 447)
- **Status**: "Temporarily disabled due to credential issues"

## DEPLOYMENT INFRASTRUCTURE ✅

### **Cloud-Based Deployment (Actually Working)**
All environments deployed on Render with proper CI/CD:

### Live Environments (All Functional)
- **Development**: https://sentia-manufacturing-dashboard-621h.onrender.com
- **Testing**: https://sentia-manufacturing-dashboard-test.onrender.com  
- **Production**: https://sentia-manufacturing-dashboard-production.onrender.com

**Note**: All environments deploy successfully and show the demo interface

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
## 🚨 **HONEST REALITY SUMMARY**

### **What This Application Actually Is**
This is a **sophisticated demo/prototype** with enterprise-grade architecture serving as a foundation for a manufacturing intelligence platform. The infrastructure, UI, and deployment are genuinely professional, but core business functionality is placeholder content.

### **What Works vs What's Claimed**
- ✅ **Architecture**: Genuinely enterprise-grade (React, Node.js, Prisma, PostgreSQL)
- ✅ **Deployment**: Professional CI/CD with multiple environments  
- ✅ **UI/UX**: Modern, responsive interface with proper component library
- ❌ **Business Logic**: Extensive mock data disguised as real functionality
- ❌ **Integrations**: Service frameworks exist but most are non-functional
- ❌ **AI Analytics**: Hardcoded scenarios, not real intelligence

### **Bottom Line**
This represents **months of quality development work** creating an excellent foundation, but it requires **7-10 additional months** to implement actual manufacturing intelligence functionality. Currently deployed environments show a polished demo, not a functional business application.

### **For Users/Stakeholders**
- The application loads and looks professional ✅
- Navigation and UI interactions work ✅  
- All business data and analytics are simulated ❌
- External integrations require configuration and development ❌
- Core manufacturing intelligence features need to be built ❌

**Recommendation**: Treat as a high-quality prototype that demonstrates the intended user experience but requires significant additional development to deliver actual business value.