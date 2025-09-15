# CODEBASE_INDEX.md
# Sentia Manufacturing Dashboard - Comprehensive Codebase Index

**Version:** 1.0.5
**Last Updated:** September 15, 2025
**Node Version:** >=20.19.0

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Core Files](#core-files)
5. [Frontend Components](#frontend-components)
6. [Backend Services](#backend-services)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Configuration](#configuration)
10. [Build & Deployment](#build--deployment)
11. [Testing Infrastructure](#testing-infrastructure)
12. [Dependencies](#dependencies)
13. [Development Environment](#development-environment)
14. [Deployment Status](#deployment-status)

## 🏢 Project Overview

**Sentia Manufacturing Dashboard** is an enterprise-grade full-stack manufacturing management system built with React/Vite frontend and Node.js/Express backend, featuring:

- **AI-Powered Forecasting** with multiple ML models
- **Working Capital Management** with optimization algorithms
- **Multi-Entity Global Operations** support
- **Real-time Manufacturing Intelligence**
- **Autonomous Agent System** for operational automation
- **Enterprise Security & Authentication**
- **Model Context Protocol (MCP) Server** for AI orchestration

### Key Features
- 🔥 **World-Class Enterprise Navigation System**
- 🤖 **AI Central Nervous System** (MCP Server integration)
- 💰 **Advanced Working Capital Analytics**
- 📊 **What-If Analysis & Scenario Modeling**
- 🏭 **Manufacturing Operations Management**
- 📈 **Demand Forecasting with ML Models**
- 🌐 **Multi-Currency & Multi-Region Support**
- 🔐 **Role-Based Access Control (RBAC)**

## 🏗 Architecture

### Full-Stack Node.js Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React/Vite    │    │  Node.js/Express│    │ MCP AI Server   │
│   Frontend      │◄──►│   Backend       │◄──►│  (Port 3001)    │
│  (Port 3000)    │    │  (Port 5000)    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Static Assets  │    │ PostgreSQL      │    │ Vector Database │
│  (dist/)        │    │ (Neon)          │    │ & LLM Providers │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Tech Stack Summary
- **Frontend:** React 18, Vite 4, Tailwind CSS, TanStack Query
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL (Neon) with 40+ models
- **Authentication:** Clerk with enterprise RBAC
- **AI Integration:** OpenAI GPT-4, Anthropic Claude, Custom MCP Server
- **Real-time:** Server-Sent Events (SSE), WebSocket
- **Deployment:** Railway with Nixpacks builder

## 📁 Directory Structure

```
C:\Projects\Sentia Manufacturing Dashboard\sentia-manufacturing-dashboard\
├── 📁 api/                           # API modules & integrations
│   ├── 📄 forecasting.js              # Forecasting API endpoints
│   ├── 📄 optimization.js             # Optimization algorithms
│   ├── 📄 ai-forecasting.js           # AI-powered forecasting
│   ├── 📄 health.js                   # Health check endpoints
│   └── 📁 integrations/               # External API integrations
│       └── 📄 xero.js                 # Xero accounting integration
│
├── 📁 src/                           # Frontend React application
│   ├── 📄 App.jsx                     # Main application component with routing
│   ├── 📄 index.css                   # Global styles
│   ├── 📁 components/                 # React components library
│   │   ├── 📁 layout/                 # Layout components
│   │   │   ├── 📄 Header.jsx          # Navigation header with functional buttons
│   │   │   ├── 📄 Sidebar.jsx         # Enterprise sidebar navigation
│   │   │   ├── 📄 DashboardLayout.jsx # Standard dashboard layout
│   │   │   └── 📄 WorldClassLayout.jsx # Enterprise world-class layout
│   │   ├── 📁 widgets/                # Dashboard widgets
│   │   ├── 📁 analytics/              # Analytics components
│   │   │   ├── 📄 WhatIfAnalysis.jsx  # What-If analysis interface
│   │   │   └── 📄 AdvancedAnalyticsDashboard.jsx
│   │   ├── 📁 WorkingCapital/         # Working capital components
│   │   │   ├── 📄 WorkingCapital.jsx  # Basic working capital interface
│   │   │   └── 📄 EnhancedWorkingCapital.jsx # Advanced WC management
│   │   ├── 📁 forecasting/            # Forecasting components
│   │   │   ├── 📄 DemandForecasting.jsx # Demand forecasting interface
│   │   │   └── 📄 EnhancedAIForecasting.jsx # AI-powered forecasting
│   │   ├── 📁 inventory/              # Inventory management
│   │   ├── 📁 production/             # Production tracking
│   │   ├── 📁 quality/                # Quality control
│   │   ├── 📁 AI/                     # AI components
│   │   ├── 📁 admin/                  # Admin panel components
│   │   └── 📁 ui/                     # Reusable UI components
│   ├── 📁 pages/                     # Page components
│   │   ├── 📄 LandingPage.jsx         # Public landing page
│   │   ├── 📄 WorldClassDashboard.jsx # Main enterprise dashboard
│   │   ├── 📄 SimpleDashboard.jsx     # Fallback dashboard
│   │   └── 📄 AdminPanel.jsx          # Administration panel
│   ├── 📁 services/                  # Frontend services
│   ├── 📁 hooks/                     # Custom React hooks
│   ├── 📁 stores/                    # Zustand state stores
│   ├── 📁 utils/                     # Utility functions
│   └── 📁 styles/                    # CSS stylesheets
│
├── 📁 services/                      # Backend services layer
│   ├── 📁 auth/                      # Authentication services
│   │   ├── 📄 AuthService.js          # User authentication logic
│   │   └── 📄 MultiEntityService.js   # Multi-entity user management
│   ├── 📁 forecasting/               # Forecasting services
│   │   ├── 📄 AccuracyDashboardService.js
│   │   ├── 📄 BatchProcessor.js       # Batch processing for forecasts
│   │   └── 📁 models/                # ML model implementations
│   │       ├── 📄 ARIMAModel.js       # ARIMA forecasting model
│   │       ├── 📄 HoltWintersModel.js # Seasonal forecasting
│   │       └── 📄 LinearRegressionModel.js
│   ├── 📁 optimization/              # Optimization algorithms
│   │   ├── 📄 WorkingCapitalService.js # Working capital optimization
│   │   └── 📄 JobManagerService.js    # Manufacturing job optimization
│   ├── 📁 ai/                        # AI & machine learning services
│   │   ├── 📄 predictiveMaintenance.js # Predictive maintenance AI
│   │   ├── 📄 conversationalAgent.js  # AI chatbot service
│   │   └── 📄 digitalTwinPlatform.js  # Digital twin implementation
│   ├── 📁 observability/             # Monitoring & observability
│   │   ├── 📄 structuredLogger.js     # Enterprise logging system
│   │   ├── 📄 productionMonitor.js    # Production monitoring
│   │   └── 📄 realtimeEventSystem.js  # Real-time event handling
│   └── 📁 database/                  # Database services
│       └── 📄 neonConnection.js       # Neon PostgreSQL connection
│
├── 📁 mcp-server/                    # AI Central Nervous System (MCP Server)
│   ├── 📄 package.json               # MCP server dependencies
│   ├── 📄 enterprise-server-simple.js # Main MCP server implementation
│   ├── 📁 ai-orchestration/         # AI orchestration layer
│   ├── 📁 api-integrations/          # Unified API interface
│   ├── 📁 providers/                 # LLM provider integrations
│   └── 📁 logs/                      # MCP server logs
│
├── 📁 database/                      # Database scripts
├── 📁 prisma/                        # Prisma ORM configuration
│   ├── 📄 schema.prisma              # Database schema definition (40+ models)
│   └── 📁 migrations/                # Database migrations
│
├── 📁 scripts/                       # Utility & deployment scripts
├── 📁 tests/                         # Test suites
├── 📁 config/                        # Configuration files
├── 📁 context/                       # Development context & documentation
└── 📁 public/                        # Static public assets
```

## 🔧 Core Files

### Essential Configuration Files

| File | Purpose | Key Features |
|------|---------|--------------|
| `package.json` | Dependencies & scripts | 110+ scripts, 220+ dependencies |
| `server.js` | Main Express server (191KB) | Railway deployment, MCP integration |
| `App.jsx` | React root component | 90+ routes, lazy loading, error boundaries |
| `vite.config.js` | Vite build configuration | Advanced chunk splitting, optimization |
| `tailwind.config.js` | Tailwind CSS config | Sentia brand colors, custom animations |
| `eslint.config.js` | Code quality configuration | Environment-specific rules |
| `prisma/schema.prisma` | Database schema | 40+ models, global readiness support |

### Main Entry Points

| Entry Point | Port | Purpose | Key Features |
|-------------|------|---------|--------------|
| `src/App.jsx` | 3000 | React frontend | World-class dashboard, 90+ routes |
| `server.js` | 5000 | Express API | REST endpoints, SSE, Railway deployment |
| `mcp-server/enterprise-server-simple.js` | 3001 | AI orchestration | Multi-LLM, unified API interface |
| `railway-ultimate.js` | $PORT | Production server | Railway-optimized startup |

## 🎨 Frontend Components

### Layout Components
```
src/components/layout/
├── Header.jsx                     # Enterprise navigation header
├── Sidebar.jsx                    # 9-section enterprise navigation
├── DashboardLayout.jsx            # Standard dashboard wrapper
├── WorldClassLayout.jsx           # Enterprise-grade layout
└── Footer.jsx                     # Application footer
```

### Core Dashboard Components
```
src/components/
├── analytics/
│   ├── WhatIfAnalysis.jsx         # Interactive scenario modeling
│   ├── WhatIfAnalysisSimple.jsx   # Simplified what-if interface
│   └── AdvancedAnalyticsDashboard.jsx # Comprehensive analytics
├── WorkingCapital/
│   ├── WorkingCapital.jsx         # Basic working capital management
│   └── EnhancedWorkingCapital.jsx # Advanced WC analytics & optimization
├── forecasting/
│   ├── DemandForecasting.jsx      # Demand prediction interface
│   └── EnhancedAIForecasting.jsx  # AI-powered forecasting with ML models
├── inventory/
│   ├── InventoryManagement.jsx    # Basic inventory tracking
│   └── AdvancedInventoryManagement.jsx # Optimization & analytics
└── production/
    ├── ProductionTracking.jsx     # Production monitoring
    └── ProductionOptimization.jsx # Optimization algorithms
```

### Page Components
```
src/pages/
├── LandingPage.jsx                # Public marketing page
├── WorldClassDashboard.jsx        # Main enterprise dashboard
├── SimpleDashboard.jsx            # Fallback dashboard
├── AdminPanel.jsx                 # System administration
└── UserPreferences.jsx            # User settings & preferences
```

### Widget System
```
src/components/widgets/
├── KPIWidget.jsx                  # Key performance indicators
├── ChartWidget.jsx                # Configurable charts
├── AlertsWidget.jsx               # System alerts & notifications
└── MetricsWidget.jsx              # Real-time metrics display
```

## ⚙️ Backend Services

### Core API Services
```
services/
├── auth/
│   ├── AuthService.js             # User authentication & authorization
│   ├── MultiEntityService.js      # Multi-entity user management
│   └── SSOService.js              # Single sign-on integration
├── forecasting/
│   ├── AccuracyDashboardService.js # Forecast accuracy tracking
│   ├── BatchProcessor.js          # Batch forecast processing
│   ├── FXService.js               # Foreign exchange rates
│   └── models/                    # Machine learning models
│       ├── ARIMAModel.js          # Time series ARIMA
│       ├── HoltWintersModel.js    # Seasonal forecasting
│       └── LinearRegressionModel.js # Linear regression
├── optimization/
│   ├── WorkingCapitalService.js   # Working capital optimization
│   ├── JobManagerService.js       # Manufacturing job scheduling
│   └── CFOReportingService.js     # Executive financial reporting
└── observability/
    ├── structuredLogger.js        # Enterprise logging
    ├── productionMonitor.js       # Real-time monitoring
    └── realtimeEventSystem.js     # Event-driven architecture
```

### AI & Machine Learning Services
```
services/ai/
├── predictiveMaintenance.js       # Equipment maintenance prediction
├── conversationalAgent.js         # AI chatbot & natural language
├── digitalTwinPlatform.js         # Digital twin implementation
├── computerVisionQuality.js       # Quality control vision AI
└── manufacturingExecution.js      # AI-driven manufacturing execution
```

### External API Integrations
```
services/api/
├── amazon.js                      # Amazon SP-API integration
├── shopify.js                     # Shopify ecommerce API
├── unleashed.js                   # Unleashed ERP integration
└── healthCheck.js                 # API health monitoring
```

## 🗄️ Database Schema

### Core Models (40+ Tables)

#### User Management & Authentication
```sql
-- User management with enterprise RBAC
users (26 fields)                  # User accounts, roles, permissions
user_sessions                      # Session management & security
audit_logs                         # Comprehensive audit trail
password_reset_tokens              # Secure password reset
sso_providers                      # Single sign-on configuration
```

#### Manufacturing Data Models
```sql
-- Core manufacturing entities
products (22 fields)              # Product catalog & specifications
markets (15 fields)               # Regional market configuration
sales_channels (20 fields)        # Sales channel management
historical_sales (35 fields)      # Sales transaction history
inventory_levels (32 fields)      # Multi-location inventory tracking
```

#### Financial Models
```sql
-- Working capital & financial planning
working_capital (45 fields)       # Working capital projections
forecasts (35 fields)             # Demand forecasting results
ar_policies, ap_policies           # Accounts receivable/payable policies
inventory_policies                 # Inventory management policies
wc_projections, wc_kpis           # Working capital analytics
```

#### Global Readiness Models
```sql
-- Multi-entity, multi-currency support
entities                          # Business entities (subsidiaries)
currencies                        # Multi-currency support
fx_rates                          # Foreign exchange rates
vat_rates, sales_tax_us          # Tax rate management
```

#### AI & Automation Models
```sql
-- Agentic AI system
agent_runs, agent_steps           # AI agent execution tracking
tool_invocations                  # AI tool usage analytics
reflections, lessons              # AI learning & improvement
agent_policies                    # AI safety & governance
```

### Key Relationships
- **Users** → **Multiple entities** (multi-entity support)
- **Products** → **Markets** → **Sales Channels** (hierarchical structure)
- **Historical Sales** → **Forecasts** (ML pipeline)
- **Working Capital** → **Optimization Models** (financial planning)
- **Agent Runs** → **Tool Invocations** (AI traceability)

## 🌐 API Endpoints

### Authentication & User Management
```
POST   /api/auth/login             # User authentication
POST   /api/auth/logout            # Session termination
GET    /api/auth/profile           # User profile data
PUT    /api/auth/profile           # Update user profile
GET    /api/auth/permissions       # User permissions & roles
```

### Forecasting Endpoints
```
GET    /api/forecasting/accuracy/trends        # Forecast accuracy analytics
POST   /api/forecasting/generate               # Generate new forecasts
GET    /api/forecasting/models                 # Available ML models
POST   /api/forecasting/batch                  # Batch forecast processing
GET    /api/forecasting/performance/{model}    # Model performance metrics
```

### Working Capital Management
```
GET    /api/working-capital/projections        # Working capital projections
POST   /api/working-capital/optimize           # Optimization recommendations
GET    /api/working-capital/kpis               # Key performance indicators
POST   /api/working-capital/scenarios          # Scenario analysis
GET    /api/working-capital/reports            # Executive reporting
```

### Optimization & Analytics
```
GET    /api/optimization/inventory              # Inventory optimization
POST   /api/optimization/production            # Production scheduling
GET    /api/optimization/recommendations       # AI-powered recommendations
POST   /api/optimization/validate              # Validate optimization results
```

### Data Import & Management
```
POST   /api/data-import/upload                 # File upload & validation
GET    /api/data-import/templates              # Import templates
POST   /api/data-import/process                # Process imported data
GET    /api/data-import/status/{jobId}         # Import job status
GET    /api/data-import/errors/{jobId}         # Import error details
```

### Health & Monitoring
```
GET    /api/health                            # System health check
GET    /api/health/comprehensive              # Detailed system status
GET    /api/health/database                   # Database connectivity
GET    /api/health/integrations               # External API status
GET    /api/metrics                           # System performance metrics
```

## ⚙️ Configuration

### Environment Variables

#### Frontend Configuration (Vite - VITE_ prefix)
```env
VITE_CLERK_PUBLISHABLE_KEY         # Clerk authentication (required)
VITE_API_BASE_URL                  # Backend API endpoint
VITE_APP_TITLE                     # Application title
VITE_APP_VERSION                   # Version display
```

#### Backend Configuration (Node.js)
```env
# Core Configuration
NODE_ENV                           # Environment mode
PORT                              # Server port (default: 5000)
DATABASE_URL                      # PostgreSQL connection (Neon)
CORS_ORIGINS                      # Allowed CORS origins

# Authentication
CLERK_SECRET_KEY                  # Clerk backend secret key

# External API Keys
AMAZON_SP_API_ACCESS_KEY          # Amazon Seller Partner API
AMAZON_SP_API_SECRET_KEY
SHOPIFY_API_KEY                   # Shopify integration
SHOPIFY_API_SECRET
UNLEASHED_API_ID                  # Unleashed ERP
UNLEASHED_API_KEY
XERO_CLIENT_ID                    # Xero accounting
XERO_CLIENT_SECRET
```

#### MCP Server Configuration (AI Central Nervous System)
```env
# AI Provider Keys
ANTHROPIC_API_KEY                 # Claude 3.5 Sonnet (required)
OPENAI_API_KEY                    # GPT-4 Turbo (required)
GOOGLE_AI_API_KEY                 # Gemini Pro (optional)

# Local LLM Configuration
LOCAL_LLM_ENDPOINT                # Local LLM endpoint (optional)
LOCAL_LLM_MODEL                   # Local LLM model name

# MCP Configuration
JWT_SECRET                        # JWT secret for MCP auth
LOG_LEVEL                         # Logging level (default: info)
```

### Configuration Files
```
├── 📄 .env.template              # Environment variable template
├── 📄 .env.development.template  # Development environment template
├── 📄 .env.production.template   # Production environment template
├── 📄 .env.enterprise.template   # Enterprise configuration template
├── 📄 vite.config.js            # Vite build configuration
├── 📄 tailwind.config.js        # Tailwind CSS configuration
├── 📄 eslint.config.js          # ESLint code quality rules
├── 📄 nixpacks.toml             # Railway deployment configuration
└── 📄 railway.json              # Railway environment settings
```

## 🚀 Build & Deployment

### Build Scripts
```json
{
  "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
  "dev:client": "vite",
  "dev:server": "nodemon server.js",
  "build": "vite build",
  "start": "node railway-ultimate.js",
  "mcp:start": "cd mcp-server && npm start",
  "ai:full-stack": "concurrently \"npm run dev:server\" \"npm run dev:client\" \"npm run mcp:dev\""
}
```

### Railway Deployment Configuration

#### Nixpacks Configuration (`nixpacks.toml`)
```toml
[phases.setup]
nixPkgs = ['nodejs_22']

[phases.build]
cmds = ['npm ci', 'npm run build']

[start]
cmd = 'npm start'
```

### Deployment Structure

#### Main Application Project
**Project ID:** `b9ca1af1-13c5-4ced-9ab6-68fddd73fc8f`

| Environment | Service ID | URL |
|-------------|------------|-----|
| Development | `f97b65ad-c306-410a-9d5d-5f5fdc098620` | sentia-manufacturing-dashboard-development.up.railway.app |
| Testing | `02e0c7f6-9ca1-4355-af52-ee9eec0b3545` | sentiatest.financeflo.ai |
| Production | `3e0053fc-ea90-49ec-9708-e09d58cad4a0` | web-production-1f10.up.railway.app |

#### MCP Server Project (AI Central Nervous System)
**Project ID:** `3adb1ac4-84d8-473b-885f-3a9790fe6140`

| Service | Service ID | URL |
|---------|------------|-----|
| MCP Server | `99691282-de66-45b2-98cf-317083dd11ba` | web-production-99691282.up.railway.app |

### Build Performance Metrics
- **Build Time:** 9-11 seconds consistently
- **Bundle Size:** ~1.7MB total, ~450KB gzipped
- **Code Splitting:** 12+ optimized chunks
- **Asset Optimization:** All assets properly compressed

## 🧪 Testing Infrastructure

### Test Configuration

#### Vitest (Unit Testing)
```javascript
// vitest.config.js
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js'
  }
})
```

#### Playwright (E2E Testing)
```javascript
// playwright.config.js
export default {
  testDir: './tests',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
}
```

### Test Scripts
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

### Test Structure
```
tests/
├── 📁 unit/                      # Unit tests
├── 📁 integration/               # Integration tests
├── 📁 e2e/                      # End-to-end tests
├── 📁 autonomous/               # Autonomous agent tests
└── 📄 setup.js                  # Test environment setup
```

## 📦 Dependencies

### Production Dependencies (Key Highlights)

#### Frontend Framework & UI
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@vitejs/plugin-react": "^4.3.1",
  "@tanstack/react-query": "^5.87.1",
  "react-router-dom": "^6.30.1",
  "@heroicons/react": "^2.2.0",
  "tailwindcss": "^3.4.17"
}
```

#### Authentication & Security
```json
{
  "@clerk/clerk-react": "^5.46.1",
  "@clerk/clerk-sdk-node": "^5.1.6",
  "helmet": "^8.1.0",
  "express-rate-limit": "^8.1.0",
  "bcryptjs": "^3.0.2",
  "jsonwebtoken": "^9.0.2"
}
```

#### Database & ORM
```json
{
  "@prisma/client": "^6.15.0",
  "prisma": "^6.15.0",
  "pg": "^8.12.0"
}
```

#### AI & Machine Learning
```json
{
  "openai": "^4.20.0",
  "ml-kmeans": "^6.0.0",
  "ml-matrix": "^6.12.1",
  "ml-regression": "^6.3.0"
}
```

#### External API Integrations
```json
{
  "amazon-sp-api": "^1.1.6",
  "@shopify/shopify-api": "^11.14.1",
  "xero-node": "^13.0.0",
  "axios": "^1.12.2"
}
```

#### Charts & Visualization
```json
{
  "recharts": "^2.15.4",
  "chart.js": "^4.5.0",
  "react-chartjs-2": "^5.3.0",
  "chartjs-adapter-date-fns": "^3.0.0"
}
```

### Development Dependencies

#### Build Tools & Bundling
```json
{
  "vite": "^7.1.5",
  "rollup-plugin-visualizer": "^6.0.3",
  "terser": "^5.44.0"
}
```

#### Testing Framework
```json
{
  "vitest": "^3.2.4",
  "@vitest/ui": "^3.2.4",
  "@playwright/test": "^1.40.0",
  "@testing-library/react": "^13.4.0"
}
```

#### Code Quality & Linting
```json
{
  "eslint": "^8.57.1",
  "@typescript-eslint/eslint-plugin": "^8.43.0",
  "prettier": "^3.1.0",
  "husky": "^9.0.0"
}
```

### Dependency Summary
- **Total Dependencies:** 220+ packages
- **Production Dependencies:** 115+ packages
- **Development Dependencies:** 65+ packages
- **Security:** Regular `npm audit` monitoring
- **Updates:** Automated dependency updates via Renovate

## 💻 Development Environment

### Prerequisites
- **Node.js:** >=20.19.0 (specified in package.json)
- **npm:** Latest version (comes with Node.js)
- **PostgreSQL:** Neon cloud database
- **Git:** Version control

### Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Environment configuration
cp .env.template .env
# Configure environment variables

# 3. Database setup
npm run db:generate
npm run db:push

# 4. Start development servers
npm run dev                    # Full-stack (frontend + backend)
npm run ai:full-stack         # Include MCP server
npm run dev:client            # Frontend only (port 3000)
npm run dev:server            # Backend only (port 5000)
npm run mcp:start            # MCP server only (port 3001)
```

### Development Commands
```bash
# Development
npm run dev                   # Start full-stack development
npm run dev:clean            # Clean build cache
npm run dev:fresh            # Fresh install and start

# Database
npm run db:studio            # Prisma Studio GUI
npm run db:migrate           # Run migrations
npm run db:seed              # Seed database

# Code Quality
npm run lint                 # Run ESLint
npm run lint:fix             # Auto-fix linting issues
npm run format               # Format code with Prettier

# Testing
npm run test                 # Run unit tests
npm run test:coverage        # Test coverage report
npm run test:e2e            # End-to-end tests
```

### Port Configuration
| Service | Port | Purpose |
|---------|------|---------|
| Vite Dev Server | 3000 | React frontend development |
| Express API | 5000 | Backend API server |
| MCP Server | 3001 | AI Central Nervous System |
| Prisma Studio | 5555 | Database GUI (when running) |

### IDE Configuration

#### VSCode Extensions (Recommended)
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **Prisma** - Database schema support
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **ES7+ React/Redux/React-Native snippets** - React snippets

#### VSCode Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

## 🚦 Deployment Status

### Current Status (September 2025)

#### ✅ Ready for Client Delivery
- ✅ **Enterprise Navigation System** - Complete with 9-section sidebar
- ✅ **Functional Buttons** - All Export, Save, Share buttons working
- ✅ **What-If Analysis** - Accessible at `/what-if` route
- ✅ **Working Capital** - Accessible at `/working-capital` route
- ✅ **Git Workflow** - Enterprise development → testing → production
- ✅ **Local Development** - Fully functional environment
- ✅ **AI Integration** - MCP Server with multi-LLM support

#### ⚠️ Issues Requiring Resolution
- ❌ **Railway Production Deployments** - 502 errors on production endpoints
- ❌ **API Endpoints** - Returning HTML instead of JSON in production
- ❌ **External Services** - Disconnected in production environment
- ❌ **Security Vulnerabilities** - 7 vulnerabilities (4 high, 1 moderate, 2 low)
- ❌ **UAT Testing** - Not completed in test environment

### Deployment Checklist

#### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security vulnerabilities addressed
- [ ] API endpoints tested in production
- [ ] External service integrations verified

#### Production Readiness
- [ ] Railway environment configuration fixed
- [ ] Health checks returning proper JSON responses
- [ ] All external APIs connected (Xero, Shopify, Amazon)
- [ ] Performance testing completed
- [ ] User acceptance testing in test environment

### Enterprise Git Workflow

#### Branch Strategy
- **`development`** - Primary development branch
  - URL: sentia-manufacturing-dashboard-development.up.railway.app
- **`test`** - User acceptance testing environment
  - URL: sentiatest.financeflo.ai
- **`production`** - Live production environment
  - URL: web-production-1f10.up.railway.app

#### Quality Gates
```
Development → Test:
✅ All features implemented and functional
✅ Local testing completed
✅ No console errors or warnings
✅ Code review completed

Test → Production:
⏳ User Acceptance Testing (UAT) completed
⏳ Client approval received
⏳ Performance testing passed
⏳ Security review completed
```

---

## 📞 Support & Documentation

### Additional Documentation
- **`CLAUDE.md`** - Comprehensive development guidelines (35KB)
- **`README.md`** - Project overview and setup (20KB)
- **`ENTERPRISE_GIT_WORKFLOW.md`** - Git workflow documentation
- **`context/`** - Technical specifications and business requirements

### Development Guidelines
- Follow structured logging patterns (no console.log in production)
- Use ASCII-compatible characters in console output
- Implement proper error boundaries and fallback mechanisms
- Maintain separation between development, testing, and production environments
- Regular security audits and dependency updates

### Architecture Principles
- **Context-Driven Development** - Reference context files for consistency
- **Enterprise Security** - RBAC, audit logging, security middleware
- **Global Readiness** - Multi-entity, multi-currency, multi-region support
- **AI-First Approach** - MCP server integration for intelligent operations
- **Performance Optimized** - Code splitting, lazy loading, efficient bundling

---

*This codebase index reflects the state of the Sentia Manufacturing Dashboard as of September 15, 2025. For the most current information, refer to the git commit history and deployment logs.*