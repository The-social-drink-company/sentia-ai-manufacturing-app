# Sentia Manufacturing Dashboard - Codebase Index

## Overview
This document provides a comprehensive index of the Sentia Manufacturing Dashboard codebase to help developers understand the structure, find specific functionality, and navigate the project efficiently.

**Project Type:** Full-Stack Manufacturing Dashboard
**Architecture:** React + Vite Frontend with Node.js + Express Backend
**Database:** Neon PostgreSQL with Prisma ORM
**Authentication:** Clerk
**Deployment:** Railway with auto-deployment

---

## 1. File Structure Overview

### Root Directory Structure
```
sentia-manufacturing-dashboard/
├── src/                     # Frontend React application
├── services/                # Backend service modules
├── api/                     # API endpoint handlers
├── routes/                  # Express route definitions
├── prisma/                  # Database schema and migrations
├── context/                 # Project documentation and specifications
├── public/                  # Static assets
├── tests/                   # Test files
├── config/                  # Configuration files
├── database/                # Database scripts
├── scripts/                 # Utility and deployment scripts
├── dist/                    # Built frontend files
└── docs/                    # Additional documentation
```

### Key Configuration Files
- **`package.json`** - Dependencies, scripts, and project metadata
- **`vite.config.js`** - Vite build configuration with optimizations
- **`server.js`** - Main Express server entry point (141KB main server file)
- **`prisma/schema.prisma`** - Database schema definitions
- **`.env.template`** - Environment variable template
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`.eslintrc.json`** - ESLint configuration

### Entry Points and Routing
- **Frontend Entry:** `src/App.jsx` - Main React application with routing
- **Backend Entry:** `server.js` - Express server with all API endpoints
- **Main Routes:** React Router setup in `src/App.jsx`
- **Build Output:** `dist/` directory for production builds

---

## 2. API Endpoints Documentation

### Health and Monitoring Endpoints
- **GET `/health`** - Basic health check
- **GET `/ready`** - Readiness probe with database connection test
- **GET `/live`** - Liveness probe
- **GET `/diagnostics`** - Detailed system diagnostics
- **GET `/api/metrics`** - Prometheus-style metrics
- **GET `/api/performance/cache-stats`** - Cache performance metrics
- **GET `/api/performance/db-metrics`** - Database performance metrics

### Core API Routes
- **GET `/api/test`** - Basic API test endpoint
- **GET `/api/protected`** - Protected endpoint requiring authentication
- **GET `/api/metrics/current`** - Real-time KPI metrics (Auth required)
- **GET `/api/kpis/realtime`** - Real-time KPI data
- **GET `/api/metrics/historical`** - Historical metrics data (Auth required)
- **POST `/api/metrics/upload`** - File upload for metrics (Auth required)
- **GET `/api/metrics/all`** - All metrics summary (Auth required)
- **GET `/api/metrics/sources`** - Data source information (Auth required)

### Manufacturing and Operations
- **GET `/api/jobs`** - Manufacturing job listings
- **GET `/api/db-test`** - Database connection test

### AI and Intelligence Routes (`/api/ai/*`)
Located in `routes/aiRoutes.js`, all require authentication:

- **POST `/api/ai/initialize`** - Initialize AI systems
- **GET `/api/ai/status`** - Get AI system status
- **GET `/api/ai/health`** - AI system health check
- **POST `/api/ai/query`** - Execute unified AI queries
- **POST `/api/ai/production/start`** - Start production batch
- **POST `/api/ai/forecast`** - Generate demand forecasts
- **GET `/api/ai/dashboard/:type`** - Get unified dashboard data
- **POST `/api/ai/quality/inspect`** - AI quality inspection
- **GET `/api/ai/analytics/:dashboardId`** - Analytics dashboard data
- **GET `/api/ai/digital-twin/scene`** - 3D digital twin scene data
- **GET `/api/ai/supply-chain/dashboard`** - Supply chain dashboard
- **GET `/api/ai/maintenance/dashboard`** - Maintenance dashboard
- **GET `/api/ai/quality/dashboard`** - Quality dashboard
- **POST `/api/ai/chat`** - Conversational AI interface
- **GET `/api/ai/reports/executive`** - Executive reports
- **GET `/api/ai/execution/dashboard`** - Manufacturing execution dashboard
- **POST `/api/ai/procurement/recommendations`** - Procurement recommendations
- **GET `/api/ai/monitoring/status`** - Agent monitoring status
- **POST `/api/ai/monitoring/health-check`** - Force health check
- **POST `/api/ai/monitoring/restart/:agentId`** - Restart specific agent
- **POST `/api/ai/shutdown`** - Shutdown AI systems (Admin only)

### Authentication Middleware
All protected routes use Clerk authentication middleware with session verification.

---

## 3. Service Layer Mapping

### Core Services Directory (`services/`)

#### Authentication Services (`services/auth/`)
- **`AuthService.js`** - Main authentication service
- **`PasswordService.js`** - Password management and security
- **`MultiEntityService.js`** - Multi-tenant entity management
- **`SSOService.js`** - Single sign-on integration

#### AI and Intelligence Services (`services/ai/`)
- **`agentMonitor.js`** - AI agent monitoring
- **`conversationalAgent.js`** - Chat and conversational AI
- **`computerVisionQuality.js`** - Quality inspection with computer vision
- **`digitalTwinPlatform.js`** - 3D digital twin platform
- **`manufacturingExecution.js`** - MES integration
- **`openAIForecastingService.js`** - OpenAI-based forecasting
- **`predictiveMaintenance.js`** - Predictive maintenance algorithms
- **`supplyChainIntelligence.js`** - Supply chain AI

#### Agent Services (`services/agent/`)
- **`evaluator.js`** - Agent performance evaluation
- **`orchestrator.js`** - Agent orchestration
- **`planValidator.js`** - Plan validation service
- **`policyGuard.js`** - Policy enforcement
- **`rateLimiter.js`** - Rate limiting for agents
- **`scheduler.js`** - Agent scheduling
- **`toolCatalog.js`** - Available tools catalog

#### Database Services (`services/database/`)
- **`neonConnection.js`** - Neon PostgreSQL connection layer

#### Performance Services (`services/performance/`)
- **`caching.js`** - Cache service, pagination, sparse fields middleware
- **`dbOptimization.js`** - Database optimization service

#### Email and Communication (`services/email/`)
- **`emailUtilsWrapper.js`** - Email utilities wrapper

#### Integration Services
- **`amazon-sp-api.js`** - Amazon Seller Partner API integration
- **`unleashedService.js`** - Unleashed ERP integration
- **`xero.js`** - Xero accounting integration (in api/ directory)

#### Utility Services
- **`logger.js`** - Centralized logging service
- **`metrics.js`** - Metrics collection and reporting
- **`manufacturingMetricsService.js`** - Manufacturing-specific metrics

### External Integrations
- **Neon PostgreSQL** - Primary database with connection pooling
- **Clerk** - Authentication and user management
- **Amazon SP-API** - Amazon marketplace integration
- **Shopify API** - Multi-store e-commerce integration
- **Unleashed API** - ERP system integration
- **Xero API** - Accounting system integration
- **OpenAI API** - AI forecasting and analysis
- **Claude API** - Advanced AI capabilities

---

## 4. Frontend Component Architecture

### Main Application Structure (`src/`)

#### Core Application Files
- **`App.jsx`** - Main application with routing and providers
- **`index.css`** - Global styles
- **`styles/ui-fixes.css`** - UI-specific style fixes

#### Page Components (`src/pages/`)
- **`AIEnhancedDashboard.jsx`** - Main AI-enhanced dashboard (primary)
- **`Dashboard.jsx`** - Basic dashboard
- **`EnhancedDashboard.jsx`** - Enhanced dashboard with features
- **`AdminPanel.jsx`** - Administration interface
- **`WorkingCapitalDashboard.jsx`** - Financial management dashboard
- **`DataImport.jsx`** - Data import functionality
- **`LandingPage.jsx`** - Application landing page

#### Component Categories

##### Layout Components (`src/components/layout/`)
- **`DashboardLayout.jsx`** - Main dashboard layout wrapper
- **`Grid.jsx`** - Responsive grid system for dashboard widgets
- **`Header.jsx`** - Main application header
- **`Sidebar.jsx`** - Navigation sidebar

##### Authentication (`src/components/auth/`)
- **`ClerkProviderWithFallback.jsx`** - Clerk authentication provider
- **`SimpleAuth.jsx`** - Simplified authentication component
- **`ProtectedRoute.jsx`** - Route protection wrapper
- **`SignInButton.jsx`**, **`SignUpButton.jsx`**, **`UserButton.jsx`** - Auth UI components
- **`PasswordPolicyChecker.jsx`** - Password policy validation
- **`SecurityAlert.jsx`**, **`SecurityStatus.jsx`** - Security components

##### Dashboard Widgets (`src/components/widgets/`)
- **`KPIStrip.jsx`** - Key performance indicator strip
- **`CFOKPIWidget.jsx`** - CFO-specific KPIs
- **`WorkingCapitalWidget.jsx`** - Working capital metrics
- **`DemandForecastWidget.jsx`** - Demand forecasting
- **`ProductionMetricsWidget.jsx`** - Production metrics
- **`SmartInventoryWidget.jsx`** - Intelligent inventory management
- **`PredictiveMaintenanceWidget.jsx`** - Maintenance predictions
- **`AIForecastingWidget.jsx`** - AI-powered forecasting
- **`MultiChannelSalesWidget.jsx`** - Multi-channel sales data
- **`AmazonSPAPIWidget.jsx`** - Amazon marketplace data
- **`ShopifyMultiStoreWidget.jsx`** - Shopify store data
- **`UnleashedERPWidget.jsx`** - ERP system data
- **`EnterprisePerformanceWidget.jsx`** - Enterprise metrics
- **`MCPStatusWidget.jsx`** - MCP server status
- **`AgentMonitoringWidget.jsx`** - AI agent monitoring

##### Working Capital (`src/components/WorkingCapital/`)
- **`CashFlowProjections.jsx`** - Cash flow forecasting
- **`PolicyManagement.jsx`** - Financial policy management
- **`KPIDashboard.jsx`** - Working capital KPIs
- **`ScenarioAnalysis.jsx`** - Financial scenario modeling
- **`SystemDiagnostics.jsx`** - System health diagnostics

##### Admin Components (`src/components/admin/`)
- **`AdminHeader.jsx`**, **`AdminSidebar.jsx`** - Admin layout
- **`AgentSafety.jsx`** - Agent safety management
- **`DataQualityLineage.jsx`** - Data quality tracking
- **`ModelsBaselines.jsx`** - Model baseline management

##### Admin Pages (`src/components/admin/pages/`)
- **`AdminOverview.jsx`** - Admin dashboard overview
- **`AdminUsers.jsx`** - User management
- **`AdminSettings.jsx`** - System settings
- **`AdminAPI.jsx`** - API management
- **`AdminIntegrations.jsx`** - Third-party integrations
- **`AdminLogs.jsx`** - System logs
- **`AdminErrors.jsx`** - Error management
- **`AdminWebhooks.jsx`** - Webhook management
- **`AdminFeatureFlags.jsx`** - Feature flag management
- **`AdminMaintenance.jsx`** - System maintenance
- **`AdminEntities.jsx`** - Entity management
- **`AdminFX.jsx`** - Foreign exchange settings

##### AI Components (`src/components/AI/`)
- **`ConversationalAssistant.jsx`** - Chat interface
- **`PredictiveAnalyticsDashboard.jsx`** - Predictive analytics
- **`DigitalTwin3D.jsx`** - 3D digital twin visualization
- **`IntelligentKPICard.jsx`** - AI-enhanced KPI display

##### Data Import (`src/components/DataImport/`)
- **`DataImportDashboard.jsx`** - Data import interface
- **`DataImportStepper.jsx`** - Step-by-step import process
- **`DataPreviewMapper.jsx`** - Data mapping preview
- **`DataImportUploader.jsx`** - File upload component
- **`ImportTemplateManager.jsx`** - Template management
- **`DataImportResults.jsx`** - Import results display
- **`ValidationConfig.jsx`** - Validation configuration

##### UI Components (`src/components/ui/`)
- **Core UI:** `button.jsx`, `card.jsx`, `input.jsx`, `dialog.jsx`, `table.jsx`
- **Advanced UI:** `alert.jsx`, `badge.jsx`, `progress.jsx`, `select.jsx`, `tabs.jsx`
- **Specialized:** `AccessibleModal.jsx`, `ExportButton.jsx`, `ShareButton.jsx`
- **Charts:** `RealTimeChart.jsx`, `WorkingCapitalChart.jsx`

### State Management Patterns
- **React Query (TanStack Query)** - Server state management and caching
- **Zustand** - Client state management (mentioned in CLAUDE.md)
- **React Context** - Authentication context (`AuthContext`)
- **Clerk** - Authentication state management

---

## 5. Configuration and Environment

### Environment Variables (from `.env.template`)

#### Core Application
- **`NODE_ENV`** - Environment mode (development/test/production)
- **`PORT`** - Server port (default: 5000)
- **`SECRET_KEY`** - Application secret key
- **`CORS_ORIGINS`** - Allowed CORS origins

#### Database Configuration
- **`DATABASE_URL`** - Production PostgreSQL connection (Neon)
- **`DEV_DATABASE_URL`** - Development database
- **`TEST_DATABASE_URL`** - Test database

#### Authentication (Clerk)
- **`CLERK_SECRET_KEY`** - Backend secret key
- **`VITE_CLERK_PUBLISHABLE_KEY`** - Frontend publishable key

#### External API Integrations
- **Amazon SP-API:** `AMAZON_SP_API_CLIENT_ID`, `AMAZON_SP_API_CLIENT_SECRET`, `AMAZON_SP_API_REFRESH_TOKEN`
- **Shopify:** Multiple store configs (`SHOPIFY_UK_*`, `SHOPIFY_EU_*`, `SHOPIFY_USA_*`)
- **Unleashed ERP:** `UNLEASHED_API_ID`, `UNLEASHED_API_KEY`
- **AI Services:** `CLAUDE_API_KEY`, `OPENAI_API_KEY`

#### Infrastructure
- **`REDIS_URL`** - Redis connection for caching
- **`RAILWAY_TOKEN`** - Railway deployment token
- **`GITHUB_TOKEN`** - GitHub integration

#### MCP Server
- **`MCP_SERVER_URL`** - MCP server endpoint
- **`MCP_HEALTH_URL`** - MCP health check endpoint

#### Security Settings
- **Session:** `SESSION_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`
- **CSRF:** `WTF_CSRF_ENABLED`, `WTF_CSRF_TIME_LIMIT`

#### Email Configuration
- **`MAIL_SERVER`**, **`MAIL_PORT`**, **`MAIL_USE_TLS`**
- **`MAIL_USERNAME`**, **`MAIL_PASSWORD`**

#### Monitoring
- **`SENTRY_DSN`** - Error tracking
- **`LOG_LEVEL`**, **`LOG_FILE`** - Logging configuration

---

## 6. Dependencies and Technologies

### Core Frontend Dependencies
- **React 18.2.0** - UI framework
- **React Router DOM 6.15.0** - Client-side routing
- **Vite 4.4.5** - Build tool and dev server
- **TanStack React Query 5.0.0** - Server state management
- **Tailwind CSS 3.3.3** - Utility-first CSS framework

### UI and Component Libraries
- **Radix UI** - Unstyled accessible components
- **Heroicons 2.2.0** - Icon library
- **Lucide React 0.263.1** - Additional icons
- **React Grid Layout 1.5.2** - Drag-and-drop grid system
- **DND Kit** - Drag and drop utilities
- **Framer Motion 12.23.12** - Animation library

### Charts and Visualization
- **Chart.js 4.5.0** - Chart library
- **React-Chartjs-2 5.3.0** - React wrapper for Chart.js
- **Recharts 2.7.2** - React chart library
- **Three.js 0.180.0** - 3D graphics library

### Backend Dependencies
- **Express 4.19.2** - Web framework
- **Prisma 6.15.0** - Database ORM
- **PostgreSQL (pg) 8.12.0** - Database driver
- **Clerk Backend 2.12.0** - Authentication

### Authentication and Security
- **Clerk React 5.46.0** - Frontend authentication
- **Helmet 8.1.0** - Security headers
- **CORS 2.8.5** - Cross-origin resource sharing
- **Express Rate Limit 8.1.0** - Rate limiting
- **XSS 1.0.15** - XSS protection

### Utilities and Tools
- **Axios 1.5.0** - HTTP client
- **Date-fns 4.1.0** - Date utilities
- **Lodash** (via other dependencies) - Utility functions
- **Winston 3.11.0** - Logging
- **Dotenv 16.4.5** - Environment variables

### Development Dependencies
- **ESLint 8.57.1** - Code linting
- **Prettier 3.1.0** - Code formatting
- **Vitest 0.34.6** - Unit testing
- **Playwright 1.40.0** - End-to-end testing
- **Husky 9.0.0** - Git hooks
- **TypeScript 5.3.0** - Type checking

---

## 7. Development Workflow

### Local Development Setup

#### Prerequisites
- Node.js (v18+ recommended)
- npm (comes with Node.js)
- Git

#### Quick Start
1. **Clone and Install:**
   ```bash
   git clone [repository-url]
   cd sentia-manufacturing-dashboard
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.template .env
   # Edit .env with your configuration
   ```

3. **Start Development Servers:**
   ```bash
   npm run dev          # Both frontend and backend
   npm run dev:client   # Frontend only (port 3000)
   npm run dev:server   # Backend only (port 5000)
   ```

### Available Scripts

#### Development Scripts
- **`npm run dev`** - Start both frontend and backend concurrently
- **`npm run dev:client`** - Start React development server (localhost:3000)
- **`npm run dev:server`** - Start Node.js/Express API server with nodemon
- **`npm run dev:internal`** - Development with colored output

#### Build and Production
- **`npm run build`** - Build production React app
- **`npm run start`** - Start production Node.js server
- **`npm run preview`** - Preview production build locally
- **`npm run serve`** - Serve production build

#### Testing
- **`npm test`** - Run Vitest unit tests in watch mode
- **`npm run test:run`** - Run tests once
- **`npm run test:coverage`** - Run tests with coverage report
- **`npm run test:ui`** - Run tests with UI interface
- **`npm run test:e2e`** - Run Playwright end-to-end tests
- **`npm run test:e2e:ui`** - Run E2E tests with UI
- **`npm run test:setup`** - Install Playwright browsers

#### Code Quality
- **`npm run lint`** - Run ESLint
- **`npm run lint:fix`** - Auto-fix ESLint issues
- **`npm run format`** - Format code with Prettier
- **`npm run format:check`** - Check code formatting
- **`npm run typecheck`** - Run TypeScript type checking
- **`npm run quality`** - Run all quality checks

#### Database Operations
- **`npm run db:generate`** - Generate Prisma client
- **`npm run db:push`** - Push schema changes to database
- **`npm run db:migrate`** - Run database migrations
- **`npm run db:migrate:deploy`** - Deploy migrations to production
- **`npm run db:studio`** - Open Prisma Studio
- **`npm run db:seed`** - Seed database with initial data

### Branch and Deployment Strategy

#### Branch Structure
- **`development`** - Primary development branch (default)
- **`test`** - User acceptance testing environment
- **`production`** - Live production environment

#### Auto-Deployment (Railway)
All branches auto-deploy with corresponding databases:
- **Development:** `dev.sentia-manufacturing.railway.app`
- **Test:** `test.sentia-manufacturing.railway.app`
- **Production:** `sentia-manufacturing.railway.app`

#### Deployment Files
- **`.github/workflows/`** - GitHub Actions CI/CD pipelines
- **`nixpacks.toml`** - Nixpacks build configuration
- **`railway.toml`** - Railway deployment settings
- **`Dockerfile.*`** - Docker configurations for different environments

### Development Best Practices

#### Code Standards
- **Character Encoding:** ASCII-compatible characters only in console output
- **File Naming:** `.jsx` for React components, `.js` for utilities
- **Component Naming:** PascalCase for components, camelCase for hooks/utilities
- **Context-Driven Development:** Use `context/` folder specifications

#### Testing Strategy
- **Unit Tests:** Vitest for component and utility testing
- **Integration Tests:** API endpoint testing
- **E2E Tests:** Playwright for full application testing
- **Test Coverage:** Aim for high coverage on critical paths

#### Performance Optimization
- **Build Optimization:** Vite with manual chunking and tree-shaking
- **Caching:** Redis for session and application caching
- **Database:** Connection pooling with Neon PostgreSQL
- **Frontend:** Lazy loading, code splitting, optimized images

---

## 8. Navigation Quick Reference

### Finding Specific Functionality

#### Authentication and Security
- **Implementation:** `src/components/auth/` and `services/auth/`
- **Configuration:** Clerk setup in `src/App.jsx`
- **Middleware:** Authentication checks in `routes/aiRoutes.js`

#### Dashboard and Widgets
- **Main Dashboard:** `src/pages/AIEnhancedDashboard.jsx`
- **Widget Library:** `src/components/widgets/`
- **Layout System:** `src/components/layout/Grid.jsx`

#### API Integration
- **External APIs:** `services/` directory (Amazon, Shopify, Unleashed, Xero)
- **Internal APIs:** `server.js` main endpoints, `routes/` for organized routes
- **AI Services:** `services/ai/` and `routes/aiRoutes.js`

#### Database and Data
- **Schema:** `prisma/schema.prisma`
- **Connection:** `services/database/neonConnection.js`
- **Data Import:** `src/components/DataImport/`

#### Working Capital and Finance
- **Components:** `src/components/WorkingCapital/`
- **Page:** `src/pages/WorkingCapitalDashboard.jsx`
- **Widgets:** CFO and financial widgets in `src/components/widgets/`

#### Admin and Management
- **Admin Panel:** `src/pages/AdminPanel.jsx`
- **Admin Components:** `src/components/admin/`
- **User Management:** Admin pages for users, settings, integrations

#### AI and Intelligence
- **AI Routes:** `routes/aiRoutes.js` - comprehensive AI API
- **AI Components:** `src/components/AI/`
- **AI Services:** `services/ai/` - various AI service modules

### Common Development Tasks

#### Adding a New Widget
1. Create component in `src/components/widgets/`
2. Add to widget catalog if needed
3. Import and use in dashboard pages

#### Adding a New API Endpoint
1. Add route in `server.js` or organized route file
2. Implement authentication middleware if needed
3. Add corresponding service in `services/`

#### Adding External Integration
1. Create service in `services/`
2. Add environment variables to `.env.template`
3. Implement API endpoints in `server.js`
4. Create frontend components if needed

#### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npm run db:generate` to update client
3. Run `npm run db:migrate` to create migration
4. Update seed data if necessary

This index provides a comprehensive overview of the Sentia Manufacturing Dashboard codebase. For specific implementation details, refer to the individual files and the `context/` directory documentation.