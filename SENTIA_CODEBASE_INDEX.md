# Sentia Manufacturing Dashboard - Comprehensive Codebase Index

## Project Overview

The Sentia Manufacturing Dashboard is an enterprise-grade manufacturing intelligence platform built with a modern full-stack architecture. It provides real-time manufacturing insights, working capital management, AI-powered forecasting, and comprehensive business intelligence through a responsive web dashboard.

### Architecture Summary
- **Frontend**: React 18 + Vite 4 + Tailwind CSS (port 3000)
- **Backend**: Node.js + Express REST API (port 5000)
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: Clerk for enterprise SSO and RBAC
- **Real-time**: Server-Sent Events for live updates
- **Deployment**: Railway with auto-deployment pipelines
- **AI/ML**: Custom forecasting engines with multiple model support

## Directory Structure

```
sentia-manufacturing-dashboard/
├── api/                         # Backend API endpoints
├── config/                      # Database and system configuration
├── context/                     # Structured development documentation
├── database/                    # Database scripts and migrations
├── docs/                        # Technical documentation
├── mcp-server/                  # MCP (Model Context Protocol) integration
├── prisma/                      # Database schema and migrations
├── public/                      # Static assets
├── scripts/                     # Utility and deployment scripts
├── server/                      # Server-specific modules
├── services/                    # Backend service layer
├── src/                         # Frontend React application
├── tests/                       # Test suites (unit, integration, e2e)
└── [config files]               # Various configuration files
```

## Core Configuration Files

### Package Management
- **`package.json`** - Main dependency manifest with 100+ packages
  - Scripts: Development, build, test, deployment commands
  - Dependencies: React, Express, Prisma, Clerk, Chart.js, etc.
  - DevDependencies: ESLint, Playwright, Vitest testing tools

### Build & Development
- **`vite.config.js`** - Vite build configuration with React plugin
  - Development proxy for API routes (`/api/*` → port 5000)
  - Build optimizations and code splitting
- **`vitest.config.js`** - Unit testing configuration
- **`playwright.config.js`** - E2E testing setup

### Code Quality
- **`.eslintrc.json`** - ESLint configuration with security rules
- **`tailwind.config.js`** - Tailwind CSS customization
- **`tsconfig.json`** - TypeScript configuration

### Database
- **`prisma/schema.prisma`** - Database schema definition
  - User management with RBAC
  - Manufacturing entities and metrics
  - Financial data models

### Deployment
- **`railway.json`** - Railway deployment configuration
- **`.env.template`** - Environment variables template

## Frontend Components (`src/components/`)

### Authentication (`auth/`)
- **`ClerkProviderWithFallback.jsx`** - Clerk authentication provider with error handling
- **`PasswordPolicyChecker.jsx`** - Password validation component
- **`ProtectedRoute.jsx`** - Route protection wrapper
- **`SecurityAlert.jsx`** - Security notification system
- **`SimpleAuth.jsx`** - Fallback authentication UI
- **`UserButton.jsx`** - User profile dropdown

### Administration (`admin/`)
- **`AdminHeader.jsx`** - Admin panel header navigation
- **`AdminSidebar.jsx`** - Admin navigation sidebar
- **`AgentSafety.jsx`** - AI agent safety monitoring
- **`DataQualityLineage.jsx`** - Data quality tracking

#### Admin Pages (`admin/pages/`)
- **`AdminOverview.jsx`** - System overview dashboard
- **`AdminUsers.jsx`** - User management interface
- **`AdminAPI.jsx`** - API endpoint management
- **`AdminIntegrations.jsx`** - External system integrations
- **`AdminLogs.jsx`** - System logging interface
- **`AdminSettings.jsx`** - System configuration

### AI Components (`AI/`)
- **`ConversationalAssistant.jsx`** - Natural language interface
- **`IntelligentKPICard.jsx`** - AI-enhanced KPI display
- **`MCPConnectionStatus.jsx`** - MCP service status indicator
- **`MLForecastingPanel.jsx`** - Machine learning forecasting UI
- **`PredictiveAnalyticsDashboard.jsx`** - Predictive insights dashboard

### Dashboard Widgets (`widgets/`)
- **`AllWidgetsFixed.jsx`** - Main widget container
- **`KPIStrip.jsx`** - Key performance indicator strip
- **`DemandForecastWidget.jsx`** - Demand forecasting display
- **`WorkingCapitalWidget.jsx`** - Financial metrics widget
- **`ProductionMetricsWidget.jsx`** - Manufacturing KPIs
- **`EnhancedManufacturingWidget.jsx`** - Advanced manufacturing insights
- **`AmazonSPAPIWidget.jsx`** - Amazon Seller Partner API integration
- **`ShopifyMultiStoreWidget.jsx`** - Multi-store Shopify metrics
- **`UnleashedERPWidget.jsx`** - Unleashed ERP integration

### Working Capital Management (`WorkingCapital/`)
- **`KPIDashboard.jsx`** - Financial KPI dashboard
- **`CashFlowProjections.jsx`** - Cash flow forecasting
- **`PolicyManagement.jsx`** - Financial policy configuration
- **`ScenarioAnalysis.jsx`** - What-if scenario modeling
- **`SystemDiagnostics.jsx`** - System health monitoring

### Layout Components (`layout/`)
- **`DashboardLayout.jsx`** - Main dashboard layout wrapper
- **`Header.jsx`** - Application header with navigation
- **`Sidebar.jsx`** - Navigation sidebar
- **`Grid.jsx`** - Responsive grid layout system

### UI Components (`ui/`)
Built on Radix UI primitives with Tailwind styling:
- **`button.jsx`** - Button components with variants
- **`card.jsx`** - Card layout components
- **`dialog.jsx`** - Modal dialog components
- **`table.jsx`** - Data table components
- **`tabs.jsx`** - Tab navigation components
- **`select.jsx`** - Dropdown selection components

### Charts (`charts/`)
- **`RealTimeChart.jsx`** - Real-time data visualization
- **`WorkingCapitalChart.jsx`** - Financial chart components

### Data Import (`DataImport/`)
- **`DataImportDashboard.jsx`** - Import management interface
- **`DataImportUploader.jsx`** - File upload component
- **`DataPreviewMapper.jsx`** - Data mapping interface
- **`ValidationConfig.jsx`** - Import validation rules

## Backend Services (`services/`)

### Authentication (`auth/`)
- **`AuthService.js`** - Core authentication logic
- **`PasswordService.js`** - Password management
- **`MultiEntityService.js`** - Multi-tenant authentication
- **`SSOService.js`** - Single sign-on integration

### AI & Machine Learning (`ai/`)
- **`agentMonitoring.js`** - AI agent monitoring
- **`conversationalAgent.js`** - Natural language processing
- **`manufacturingExecution.js`** - Manufacturing AI
- **`predictiveMaintenance.js`** - Predictive analytics
- **`supplyChainIntelligence.js`** - Supply chain optimization

### Forecasting (`forecasting/`)
- **`ForecastingService.js`** - Main forecasting engine
- **`AccuracyDashboardService.js`** - Forecast accuracy tracking
- **`BatchProcessor.js`** - Batch forecast processing
- **`CFOWorkbenchService.js`** - Executive financial forecasts
- **`FeatureEngineeringService.js`** - ML feature preparation

#### Forecasting Models (`forecasting/models/`)
- **`ARIMAModel.js`** - ARIMA time series model
- **`HoltWintersModel.js`** - Seasonal forecasting
- **`LinearRegressionModel.js`** - Linear regression model
- **`SimpleMovingAverageModel.js`** - Moving average model

### Optimization (`optimization/`)
- **`OptimizationService.js`** - Core optimization engine
- **`WorkingCapitalService.js`** - Financial optimization
- **`JobManagerService.js`** - Manufacturing job optimization
- **`MultiWarehouseService.js`** - Inventory optimization
- **`CFOReportingService.js`** - Executive reporting

### Database (`database/`)
- **`neonConnection.js`** - Neon PostgreSQL connection management
- **`GlobalReadinessRepository.js`** - Multi-region data access

### Performance (`performance/`)
- **`caching.js`** - Redis caching and middleware
- **`dbOptimization.js`** - Database query optimization

### API Integrations (`api/`)
- **`amazon.js`** - Amazon SP-API integration
- **`shopify.js`** - Shopify API integration
- **`unleashed.js`** - Unleashed ERP integration
- **`healthCheck.js`** - Service health monitoring

### Monitoring (`monitoring/`)
- **`metrics.js`** - Application metrics collection
- **`telemetry.js`** - Performance telemetry

### Security (`security/`)
- **`config.js`** - Security configuration
- **`middleware.js`** - Security middleware

## Frontend Services (`src/services/`)

### Data Integration
- **`dataIntegrationService.js`** - External data integration
- **`realDataIntegration.js`** - Real-time data processing
- **`liveDataService.js`** - Live data streaming
- **`enhancedLiveDataService.js`** - Enhanced real-time features

### AI Services
- **`aiForecasting.js`** - AI-powered forecasting
- **`aiEnsembleForecasting.js`** - Ensemble model forecasting
- **`intelligenceService.js`** - Business intelligence
- **`predictiveMaintenance.js`** - Equipment maintenance predictions

### API Services
- **`amazonApi.js`** - Amazon marketplace integration
- **`shopifyApi.js`** - Shopify store integration
- **`mcpService.js`** - MCP protocol service

### Database Services (`db/`)
- **`index.js`** - Database service layer
- **`utils.js`** - Database utilities
- **`test.js`** - Database testing utilities

### Validation & Quality
- **`dataValidationService.js`** - Data quality validation
- **`validationEngine.js`** - Business rule validation
- **`errorHandlingService.js`** - Error management

## API Endpoints (`api/`)

### Core APIs
- **`agent.js`** - AI agent management endpoints
- **`forecasting.js`** - Forecasting API endpoints
- **`optimization.js`** - Optimization API endpoints
- **`models.js`** - ML model management
- **`dataQuality.js`** - Data quality monitoring
- **`email.js`** - Email service endpoints
- **`xero.js`** - Xero accounting integration

## Pages (`src/pages/`)

### Main Applications
- **`EnhancedDashboard.jsx`** - Primary dashboard interface
- **`WorkingCapitalDashboard.jsx`** - Financial management dashboard
- **`AdminPanel.jsx`** - System administration interface
- **`AIDashboard.jsx`** - AI and analytics dashboard
- **`DataImport.jsx`** - Data import management

### Utilities
- **`LandingPage.jsx`** - Application landing page
- **`TestPage.jsx`** - Development testing interface
- **`SimpleTest.jsx`** - Basic functionality testing

## Hooks (`src/hooks/`)

### Authentication & Authorization
- **`useAuthRole.jsx`** - Role-based access control
- **`useFeatureFlags.jsx`** - Feature flag management

### Data & Real-time
- **`useRealTimeData.jsx`** - Real-time data subscriptions
- **`useSSE.js`** - Server-Sent Events handling
- **`useMCPService.js`** - MCP service integration

### User Experience
- **`useKeyboardNavigation.jsx`** - Keyboard shortcuts
- **`useTouchGestures.js`** - Mobile touch interactions
- **`useExport.jsx`** - Data export functionality

## Utilities (`src/lib/`, `src/utils/`)

### Logging & Debugging
- **`src/lib/devLog.js`** - Development logging utility
- **`src/lib/logger.js`** - Production logging
- **`src/lib/errors.js`** - Error handling utilities

### Performance
- **`src/utils/performance.js`** - Performance optimization utilities
- **`src/utils/memoryOptimization.js`** - Memory management
- **`src/utils/assetOptimization.js`** - Asset loading optimization
- **`src/utils/vitals.js`** - Web vitals monitoring

### Data Management
- **`src/utils/resilience.js`** - Error resilience patterns
- **`src/lib/redis.js`** - Redis caching utilities
- **`src/lib/utils.js`** - General utility functions

## State Management (`src/stores/`)

### Layout Management
- **`layoutStore.js`** - Dashboard layout state (Zustand)
  - Widget positioning and sizing
  - User layout preferences
  - Responsive breakpoint handling

## Database Schema (`prisma/`)

### Core Models
- **User** - Authentication and user management
  - RBAC with roles and permissions
  - Multi-entity support
  - Security features (2FA, account locking)
- **Manufacturing entities** - Production data models
- **Financial models** - Working capital and cash flow
- **System configuration** - Application settings

### Migration Scripts
- **`seed.js`** - Database seeding
- **`seed-simple.js`** - Simplified seeding for development

## Testing (`tests/`)

### Unit Tests
- **`api/`** - API endpoint testing
- **`forecasting/`** - Forecasting service tests
- **`optimization/`** - Optimization service tests
- **`unit/`** - Component unit tests

### Integration Tests
- **`e2e/dashboard.spec.js`** - End-to-end dashboard testing

### Test Configuration
- **`jest.setup.js`** - Jest testing setup
- **`setup.js`** - General test setup

## Scripts (`scripts/`)

### Deployment & Monitoring
- **`railway-deployment-monitor.js`** - Deployment monitoring
- **`setup-railway-env.js`** - Environment configuration
- **`create-admin.js`** - Admin user creation

### Agent Systems
- **`autonomous-completion-agent.js`** - Automated task completion
- **`code-quality-agent.js`** - Code quality monitoring
- **`performance-optimization-agent.js`** - Performance automation
- **`ui-ux-enhancement-agent.js`** - UI/UX optimization

### Database Management
- **`database/optimizations.sql`** - Database performance optimizations

## Documentation (`context/`, `docs/`)

### Business Requirements (`context/business-requirements/`)
- **`sentia_business_model.md`** - Business model specification
- **`user_workflows.md`** - User journey definitions
- **`cash_flow_requirements.md`** - Financial requirements
- **`admin_requirements.md`** - Administrative requirements

### Technical Specifications (`context/technical-specifications/`)
- **`tech_stack.md`** - Technology stack documentation
- **`system_configuration.md`** - System configuration guide
- **`production_requirements.md`** - Production deployment requirements
- **`clerk-integration-guide.md`** - Authentication integration

### API Documentation (`context/api-documentation/`)
- **`forecasting.md`** - Forecasting API specification
- **`optimization.md`** - Optimization API specification

### Deployment (`context/deployment-configs/`)
- **`railway_configuration.md`** - Railway deployment configuration
- **`observability.md`** - Monitoring and observability setup

## MCP Server Integration (`mcp-server/`)

### Core MCP Services
- **`index.js`** - MCP server main entry point
- **`providers/anthropic.js`** - Anthropic AI provider
- **`providers/openai.js`** - OpenAI integration
- **`providers/xero.js`** - Xero accounting integration

### Deployment
- **`DEPLOYMENT_INSTRUCTIONS.md`** - MCP deployment guide
- **`RAILWAY_DEPLOYMENT.md`** - Railway-specific deployment

## Key Features & Capabilities

### Dashboard System
- **Responsive Grid Layout**: 12-column responsive grid with drag-and-drop
- **Role-Based Access Control**: Complete RBAC with 20+ granular permissions
- **Real-time Updates**: SSE integration for live data updates
- **Widget System**: Modular architecture with 15+ core widgets
- **Dark/Light Themes**: Complete theming with user preferences
- **Keyboard Navigation**: Hotkey system for power users

### Financial Management
- **Working Capital Analysis**: Comprehensive financial KPIs
- **Cash Flow Projections**: Multi-scenario forecasting
- **Policy Management**: Automated financial policy enforcement
- **Currency Support**: Multi-currency with real-time FX rates

### Manufacturing Intelligence
- **Production Metrics**: Real-time manufacturing KPIs
- **Predictive Maintenance**: AI-powered equipment monitoring
- **Supply Chain Optimization**: Intelligent inventory management
- **Quality Control**: Automated quality monitoring

### AI & Machine Learning
- **Forecasting Engine**: Multiple model ensemble forecasting
- **Natural Language Interface**: Conversational analytics
- **Predictive Analytics**: Advanced statistical modeling
- **Computer Vision**: Quality inspection automation

### Data Integration
- **Multi-Source Integration**: Amazon SP-API, Shopify, Unleashed ERP
- **Real-time Streaming**: Live data ingestion and processing
- **Data Quality**: Automated validation and cleansing
- **Import/Export**: Flexible data import/export capabilities

### Enterprise Features
- **Multi-Entity Support**: Global enterprise deployment
- **SSO Integration**: Enterprise authentication systems
- **Audit Logging**: Comprehensive activity tracking
- **Performance Monitoring**: Real-time system health monitoring

## Performance & Scalability

### Build Performance
- **Build Time**: 9-11 seconds consistent across environments
- **Bundle Size**: ~1.7MB total, ~450KB gzipped
- **Code Splitting**: Effective chunk distribution
- **Asset Optimization**: Compressed and optimized assets

### Runtime Performance
- **Memory Management**: React.memo for expensive components
- **Caching**: Redis-based intelligent caching
- **Database Optimization**: Query optimization and connection pooling
- **Real-time**: Efficient SSE implementation

### Security
- **Authentication**: Clerk enterprise SSO
- **Authorization**: Granular RBAC system
- **Data Protection**: Encryption at rest and in transit
- **Security Headers**: Helmet.js security middleware
- **Rate Limiting**: API rate limiting and DDoS protection

## Development Standards

### Code Quality
- **ESLint**: Comprehensive linting with security rules
- **TypeScript**: Type safety for critical components
- **Testing**: Unit, integration, and E2E testing
- **Documentation**: Comprehensive inline documentation

### Deployment
- **CI/CD**: Automated Railway deployment pipelines
- **Environment Management**: Multi-environment configuration
- **Monitoring**: Real-time application monitoring
- **Error Tracking**: Comprehensive error handling and logging

This comprehensive index represents the complete Sentia Manufacturing Dashboard codebase as of September 2025, documenting over 200 source files, 50+ services, and enterprise-grade manufacturing intelligence capabilities.

## Overview

The Sentia Manufacturing Dashboard is an enterprise-grade manufacturing intelligence platform built with modern full-stack technologies. It provides real-time manufacturing insights, AI-powered forecasting, working capital management, and comprehensive business intelligence capabilities.

**Version**: 1.0.0  
**Node.js**: >=18.0.0  
**Project Type:** Full-Stack Manufacturing Intelligence Platform
**Architecture:** React 18 + Vite 4 Frontend with Node.js + Express Backend
**Database:** Neon PostgreSQL with Prisma ORM (50+ models)
**Authentication:** Clerk with RBAC (admin/manager/operator/viewer)
**Real-time:** Server-Sent Events (SSE)
**Deployment:** Railway with auto-deployment
**Last Updated:** September 2025

---

## 1. Architecture Overview

### System Architecture
- **Type**: Full-Stack Node.js Application
- **Frontend**: React 18 + Vite 4 + Tailwind CSS (Port 3000)
- **Backend**: Node.js + Express.js REST API (Port 5000)
- **Database**: Neon PostgreSQL with Prisma ORM (50+ models)
- **Authentication**: Clerk (RBAC with 20+ granular permissions)
- **Real-time**: Server-Sent Events (SSE) with 15+ event types
- **State Management**: Zustand + TanStack Query
- **Development**: Concurrent frontend/backend development
- **Production**: Static React build + Express API server

### Key Design Patterns
- **Component Architecture**: Modular React components with separation of concerns
- **Service Layer**: Dedicated service modules for business logic
- **Repository Pattern**: Prisma ORM with structured data access
- **Event-Driven**: SSE for real-time updates and notifications
- **Caching Strategy**: Multi-level caching (Redis + in-memory)
- **Security-First**: RBAC, rate limiting, input validation, CSRF protection

### Integration Points
- **Unleashed Software API**: Inventory and product management
- **Amazon SP-API**: E-commerce sales data (planned)
- **Shopify API**: E-commerce integration (planned)
- **Xero API**: Financial data integration (planned)
- **Railway**: Auto-deployment platform
- **Neon PostgreSQL**: Cloud database hosting
- **AI Services**: OpenAI, Claude API integration
- **MCP Integration**: Model Context Protocol server

### Technology Stack Overview

#### Frontend Stack
- **React 18.2.0**: UI framework with concurrent features
- **Vite 4.4.5**: Build tool with HMR and optimizations
- **Tailwind CSS 3.3.3**: Utility-first CSS framework
- **TanStack Query 5.0.0**: Server state management and caching
- **Zustand**: Client state management
- **React Router DOM 6.15.0**: Client-side routing
- **React Grid Layout 1.5.2**: Drag-and-drop dashboard widgets

#### Backend Stack
- **Node.js**: Runtime environment (v18+)
- **Express.js 4.19.2**: Web framework with 100+ endpoints
- **Prisma 6.15.0**: Type-safe ORM with auto-generated client
- **Neon PostgreSQL**: Serverless database with connection pooling
- **Clerk**: Authentication service with JWT tokens
- **Winston**: Centralized logging
- **Redis**: Caching layer

#### Development & Quality Tools
- **ESLint 8.57.1**: Code linting with security rules
- **Prettier 3.1.0**: Code formatting
- **Vitest 0.34.6**: Unit testing framework
- **Playwright 1.40.0**: E2E testing
- **TypeScript 5.3.0**: Type checking
- **Husky**: Git hooks for quality gates

---

## 2. Project Structure & File Organization

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

## 3. API Documentation (100+ Endpoints)

### API Architecture
**Base URL**: `/api`  
**Authentication**: Clerk JWT tokens  
**Rate Limiting**: Configured per endpoint type  
**Total Endpoints**: 100+ across multiple categories

### Health & Monitoring Endpoints
```
GET    /health                      # Basic health check
GET    /ready                      # Readiness probe with database test
GET    /live                       # Liveness probe
GET    /diagnostics                # Detailed system diagnostics
GET    /api/metrics                # Prometheus-style metrics
GET    /api/performance/cache-stats # Cache performance metrics
GET    /api/performance/db-metrics  # Database performance metrics
POST   /api/performance/optimize-db # Database optimization
```

### Authentication & Security (15+ endpoints)
```
GET    /api/auth/sessions           # List user sessions
DELETE /api/auth/sessions/:id       # Revoke specific session
DELETE /api/auth/sessions           # Revoke all sessions
GET    /api/auth/security/status    # Security status overview
POST   /api/auth/password/validate  # Password strength validation
POST   /api/auth/password/reset-request # Password reset initiation
POST   /api/auth/password/reset-verify  # Password reset completion
GET    /api/auth/password/status    # Password policy status
GET    /api/auth/entity-context     # Multi-entity context
PUT    /api/auth/entity-context     # Update entity context
GET    /api/auth/accessible-entities # Available entities
GET    /api/auth/regions           # Available regions
GET    /api/auth/sso/providers     # SSO provider list
POST   /api/auth/sso/:id/callback  # SSO callback handler
```

### Core Business Data (15+ endpoints)
```
GET    /api/test                    # Health check
GET    /api/protected               # Authentication test
GET    /api/metrics/current         # Real-time KPIs
GET    /api/kpis/realtime          # Live KPI data
GET    /api/metrics/historical      # Time-series data
POST   /api/metrics/upload          # Data import
GET    /api/metrics/all            # All metrics summary
GET    /api/metrics/sources        # Data source info
GET    /api/db-test                # Database connectivity
GET    /api/status                 # API status
```

### Manufacturing Operations (10+ endpoints)
```
GET    /api/jobs                    # Manufacturing jobs
POST   /api/jobs                    # Create manufacturing job
GET    /api/resources              # Manufacturing resources
GET    /api/schedules              # Production schedules
```

### Unleashed ERP Integration (15+ endpoints)
```
GET    /api/unleashed/test          # Connection test
GET    /api/unleashed/products      # Product catalog
GET    /api/unleashed/products/:id  # Specific product
GET    /api/unleashed/stock         # Inventory levels
GET    /api/unleashed/sales-orders  # Sales orders
GET    /api/unleashed/sales-orders/:id # Specific order
GET    /api/unleashed/purchase-orders  # Purchase orders
GET    /api/unleashed/customers     # Customer data
GET    /api/unleashed/suppliers     # Supplier data
GET    /api/unleashed/warehouses    # Warehouse data
GET    /api/unleashed/bill-of-materials # BOM data
GET    /api/unleashed/stock-adjustments # Stock adjustments
```

### Working Capital Management (10+ endpoints)
```
POST   /api/working-capital/projections    # Generate projections
GET    /api/working-capital/projections/history # Historical projections
POST   /api/working-capital/scenarios      # Scenario modeling
POST   /api/working-capital/optimize       # Optimization engine
GET    /api/working-capital/diagnostics    # Health diagnostics
GET    /api/working-capital/kpis/trends    # KPI trends analysis
GET    /api/working-capital/policies/ar    # AR policy management
GET    /api/working-capital/policies/ap    # AP policy management
POST   /api/working-capital/policies/ar    # Create AR policies
```

### Data Import System (15+ endpoints)
```
POST   /api/import/upload           # File upload
GET    /api/import/preview/:id      # Preview import data
POST   /api/import/process/:id      # Process import job
POST   /api/import/validate/:id     # Validate import data
GET    /api/import/status/:id       # Import job status
GET    /api/import/jobs             # List import jobs
GET    /api/import/results/:id      # Import results
POST   /api/import/upload-enhanced  # Enhanced file upload
POST   /api/import/validate-enhanced/:id # Enhanced validation
POST   /api/import/commit/:id       # Commit import
GET    /api/import/templates/:type  # Import templates
POST   /api/import/templates        # Create template
GET    /api/import/statistics/:id   # Import statistics
GET    /api/import/entity-report/:id # Entity-specific reports
GET    /api/entities/available      # Available entities
```

### AI & Machine Learning (15+ endpoints)
```
GET    /api/ai/status              # AI service status
GET    /api/ai/health              # AI health check
POST   /api/ai/query               # AI query endpoint
POST   /api/ai/forecast            # Generate forecasts
POST   /api/ai/production/start    # Start production
GET    /api/ai/dashboard/:type     # AI dashboard data
POST   /api/ai/quality/inspect     # Quality inspection
GET    /api/ai/insights/production # Production insights
GET    /api/ai/insights/sales      # Sales insights
GET    /api/ai/optimization/inventory # Inventory optimization
GET    /api/ai/predictions/quality # Quality predictions
```

### Admin Panel (30+ endpoints)
```
# User Management
GET    /api/admin/users            # User list
GET    /api/admin/invitations      # Pending invitations
POST   /api/admin/invite           # Invite user
POST   /api/admin/users/:id/approve # Approve user
POST   /api/admin/users/:id/revoke  # Revoke user access
DELETE /api/admin/invitations/:id  # Delete invitation

# System Management
GET    /api/admin/health           # System health
GET    /api/admin/errors           # Error tracking
POST   /api/admin/errors/:id/ack   # Acknowledge errors
GET    /api/admin/settings         # System settings
GET    /api/admin/feature-flags    # Feature flags
PATCH  /api/admin/feature-flags/:id # Update feature flag
GET    /api/admin/integrations     # Integration status
POST   /api/admin/integrations/:id/test # Test integration
GET    /api/admin/logs             # System logs
GET    /api/admin/audit-logs       # Audit trail

# Maintenance Operations
GET    /api/admin/maintenance/status # Maintenance status
POST   /api/admin/maintenance/database/backup # Database backup
POST   /api/admin/maintenance/cleanup # System cleanup
GET    /api/admin/env              # Environment variables
POST   /api/admin/env/propose      # Propose env changes
POST   /api/admin/secret/rotate    # Rotate secrets
POST   /api/admin/queue/:name/retry # Retry queue operations
POST   /api/admin/cache/clear      # Clear cache

# Multi-Entity Management
GET    /api/admin/entities         # Entity management
POST   /api/admin/entities         # Create entity
PUT    /api/admin/entities/:id     # Update entity
GET    /api/admin/multi-entity/health # Multi-entity health
GET    /api/admin/global/entities  # Global entity view

# SSO Management
GET    /api/admin/sso/providers    # SSO providers
POST   /api/admin/sso/providers    # Create SSO provider
PUT    /api/admin/sso/jit-config   # JIT provisioning config
GET    /api/admin/sso/statistics   # SSO usage statistics
GET    /api/admin/sso/health       # SSO health check

# Financial Exchange
GET    /api/admin/fx/settings      # FX rate settings
POST   /api/admin/fx/settings      # Update FX settings
POST   /api/admin/approvals        # Approval workflows
GET    /api/admin/activity         # Activity monitoring
```

### Request/Response Patterns

#### Standard Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2025-09-06T10:00:00Z"
}
```

#### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable error message",
    "details": { /* error specifics */ }
  },
  "timestamp": "2025-09-06T10:00:00Z"
}
```

### Middleware Stack
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers (HSTS, CSP, etc.)
- **Morgan**: HTTP request logging
- **Rate Limiting**: Per-endpoint and per-user limits
- **Authentication**: Clerk JWT token validation
- **RBAC**: Role-based access control with granular permissions
- **Input Validation**: Express-validator for request validation
- **File Upload**: Multer with security constraints
- **Compression**: Response compression for performance
- **Error Handling**: Centralized error handling with logging

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

---

## 9. Database Schema & Models (50+ Models)

### Database Technology
- **Engine**: Neon PostgreSQL (Serverless)
- **ORM**: Prisma (Type-safe, auto-generated client)
- **Connection**: Connection pooling enabled
- **Migrations**: Prisma migrations with versioning
- **Total Models**: 50+ models covering all business domains

### Core Data Models

#### User Management & Authentication
```sql
User                   # User accounts with RBAC (20+ fields)
UserSession           # Session management with device tracking
AuditLog              # Security audit trail with event tracking
PasswordResetToken    # Secure password reset tokens
password_history      # Password history for policy enforcement
SSOProvider          # SSO configuration (future use)
FeatureFlag          # Feature toggles with rollout percentages
```

#### Business Core Models
```sql
Market                # Geographic markets with regulatory requirements
Product               # Product catalog with cost/pricing data
SalesChannel          # Sales channel management with API configs
HistoricalSale        # Sales transaction data with global currency support
Forecast              # AI-generated forecasts with confidence scores
InventoryLevel        # Inventory tracking with optimization metrics
```

#### Manufacturing Operations
```sql
Job                   # Manufacturing jobs with scheduling
Schedule              # Production schedules with optimization scores
Resource              # Manufacturing resources with maintenance tracking
```

#### Financial Management (Advanced Working Capital)
```sql
WorkingCapital        # Working capital projections with scenarios
ARPolicy              # Accounts receivable policies by channel
APPolicy              # Accounts payable policies by supplier
InventoryPolicy       # Inventory management policies by product
WCProjection          # Monthly cash flow projections
WCKPIs               # Working capital KPIs (DSO, DPO, DIO, CCC)
WCScenario           # Scenario modeling (baseline, optimistic, pessimistic)
WCOptimization       # AI-generated optimization recommendations
```

#### Data Management & Import System
```sql
data_imports          # Master import job tracking
import_errors         # Detailed error tracking with resolution
import_logs           # Import audit logs with performance metrics
import_templates      # Reusable import templates
import_job           # Enhanced import job management
validation_result    # Data validation results with quality scores
ImportLineage        # Data lineage tracking for compliance
ImportProvenance     # Import provenance and batch tracking
```

#### Global Multi-Entity Support
```sql
Entity                # Business entities for multi-tenant support
Currency              # Multi-currency support with ISO codes
FxRate               # Foreign exchange rates with provider tracking
VatRate              # European VAT rates by country and date
SalesTaxUs           # US sales tax rates by state/locality
```

#### AI & Agent System (Comprehensive)
```sql
AgentRuns            # AI agent execution runs with outcomes
AgentSteps           # Individual agent steps with dependencies
ToolInvocations      # Tool usage tracking with metrics
Reflections          # Agent learning and reflection data
Lessons              # Knowledge capture for continuous learning
Approvals            # Human approval workflow for critical operations
AgentEvals           # Agent evaluation and testing framework
AgentEvalCases       # Individual test cases for agents
AgentEvalScores      # Performance scoring and validation
AgentSchedules       # Automated agent scheduling with cron
AgentPolicies        # Safety policies and constraints
AgentApprovals       # Approval workflow management
AgentSafetyMetrics   # Safety metrics and monitoring
```

#### Data Quality & Governance
```sql
DQRules              # Data quality rules by dataset
DQRuns               # Data quality validation runs
DQFindings           # Data quality issues and impact assessment
ModelArtifacts       # Model registry with versioning
ModelBaselines       # Model baseline management and approval
```

#### System Configuration
```sql
SystemSetting        # System configuration with versioning
```

### Database Relationships & Constraints

#### Key Relationships
- **User → Sessions**: One-to-many with cascade delete
- **User → AuditLog**: One-to-many for activity tracking
- **Product → HistoricalSale**: One-to-many with foreign keys
- **Market → SalesChannel**: One-to-many with regulatory constraints
- **Entity → Multi-currency data**: One-to-many for global operations
- **AgentRuns → AgentSteps**: One-to-many with execution flow
- **WCProjection → WCKPIs**: One-to-many for detailed metrics

#### Database Indexes & Performance
- **100+ optimized indexes** for query performance
- **Composite indexes** for complex multi-column queries
- **Partial indexes** for filtered data access
- **Foreign key constraints** with proper cascading rules
- **UUID primary keys** for distributed scaling and security
- **Date range indexes** for time-series data
- **Full-text search indexes** for content search

### Data Validation & Constraints

#### Field Validation
- **Email validation** with unique constraints
- **Currency codes** validated against ISO 4217
- **Country codes** validated against ISO 3166
- **Percentage fields** with range constraints (0-1)
- **UUID fields** with proper formatting
- **Date ranges** with logical validation
- **Enum constraints** for status fields

#### Business Logic Constraints
- **Unique constraints** on business keys
- **Check constraints** for data integrity
- **Cascade rules** for related data cleanup
- **Soft delete patterns** for audit trails
- **Versioning support** for configuration changes

### Global Multi-Currency Architecture

#### Currency Support
- **Base Currency**: GBP (configurable)
- **Supported Currencies**: GBP, EUR, USD (extensible)
- **FX Rate Management**: Daily rates with provider tracking
- **Currency Conversion**: Automatic conversion in projections
- **Historical Rates**: Full rate history for accurate reporting

#### Regional Compliance
- **VAT Rates**: European VAT by country and rate type
- **Sales Tax**: US state and local tax rates
- **Regulatory Fields**: Compliance status tracking
- **Data Residency**: Regional data handling flags

---

## 10. Recent Improvements & Enhancements (2025)

### Performance Optimizations
- **Vite Build Optimization**: Advanced chunking strategy reducing initial load by 40%
- **Database Connection Pooling**: Neon PostgreSQL with optimized connection management
- **Redis Caching**: Multi-level caching reducing API response times by 60%
- **Memory Management**: Efficient garbage collection patterns and memory leak prevention
- **Bundle Splitting**: Strategic code splitting for 3-second initial load times

### AI & Agent System Implementation
- **Agentic AI Framework**: Complete AI agent orchestration with 12-step execution
- **Safety Policies**: Comprehensive policy enforcement preventing unauthorized operations
- **Agent Evaluation**: Performance monitoring with automated testing and learning
- **Human-in-the-loop**: Approval workflows for critical business operations
- **Agent Scheduling**: Automated execution with freeze window protection

### Enhanced Security Features
- **Multi-factor Authentication**: TOTP implementation with backup codes
- **Session Management**: Advanced session tracking with device fingerprinting
- **Audit Logging**: Comprehensive audit trail with event correlation
- **Rate Limiting**: Sophisticated rate limiting with burst handling
- **RBAC Enhancement**: 20+ granular permissions with role inheritance

### Global Readiness Features
- **Multi-Entity Support**: Complete multi-tenant architecture with data isolation
- **Multi-Currency**: Comprehensive foreign exchange rate management
- **Regional Compliance**: VAT, sales tax, and regulatory compliance automation
- **Localization**: Multi-language support with timezone handling
- **Data Residency**: Regional data handling for GDPR compliance

### Data Quality & Lineage
- **Data Quality Rules**: Comprehensive validation framework with 10+ rule types
- **Import Lineage**: Complete data provenance tracking for compliance
- **Validation Pipelines**: Multi-stage validation with error recovery
- **Quality Scoring**: Automated data quality assessment and reporting

### Working Capital Management
- **Advanced Projections**: 18-month rolling projections with scenario modeling
- **Policy Management**: Automated AR/AP policy optimization
- **KPI Monitoring**: Real-time working capital KPI tracking
- **Optimization Engine**: AI-powered recommendations for cash flow improvement

---

## 11. Code Quality & Standards

### ESLint Configuration
- **Base Rules**: eslint:recommended with React and security plugins
- **React Rules**: Comprehensive React/JSX linting with hooks validation
- **Security Rules**: Security vulnerability detection and prevention
- **Custom Rules**: Performance optimizations and best practices

### Code Style Guidelines

#### JavaScript/React Conventions
- **Components**: PascalCase naming (e.g., `DashboardWidget`)
- **Files**: `.jsx` for React components, `.js` for utilities
- **Hooks**: Custom hooks prefixed with `use` (e.g., `useWorkingCapital`)
- **Constants**: UPPER_SNAKE_CASE for application constants
- **Functions**: camelCase for all function names

#### Import/Export Standards
```javascript
// Standard import ordering
import React from 'react'           // External libraries first
import { useState } from 'react'    // React-specific imports
import { useQuery } from '@tanstack/react-query' // Third-party hooks
import ComponentName from './ComponentName' // Local component imports
import { utilityFunction } from '../utils' // Utility imports
```

#### Error Handling Standards
```javascript
// Consistent API error responses
{
  success: false,
  error: {
    code: 'BUSINESS_LOGIC_ERROR',
    message: 'User-friendly error message',
    details: { field: 'specific validation error' }
  },
  timestamp: '2025-09-06T10:00:00Z'
}
```

### Security Standards
- **Input Validation**: All API endpoints use express-validator
- **SQL Injection Protection**: Prisma ORM provides parameterized queries
- **XSS Prevention**: React built-in escaping + CSP headers
- **CSRF Protection**: CSRF tokens for state-changing operations
- **Rate Limiting**: Per-endpoint limits with IP-based tracking
- **Authentication**: JWT tokens with proper expiration and refresh
- **Authorization**: RBAC with granular permission checking

### Performance Standards
- **Bundle Size**: Main chunks under 1.5MB with warning thresholds
- **Load Time**: Initial page load under 3 seconds on 3G networks
- **Memory Usage**: Efficient React patterns preventing memory leaks
- **Database**: All queries optimized with proper indexing
- **Caching**: Multi-level caching with 95% hit rates

### Testing Standards
- **Unit Tests**: 80%+ code coverage on critical business logic
- **Integration Tests**: Full API endpoint testing with mocked external services
- **E2E Tests**: Complete user workflow testing with Playwright
- **Performance Tests**: Load testing for high-traffic scenarios

---

## 12. Troubleshooting Guide

### Common Development Issues

#### Environment Setup
- **Port Conflicts**: Ensure ports 3000 (frontend) and 5000 (backend) are available
- **Database Connection**: Verify DATABASE_URL in .env points to accessible Neon instance
- **Clerk Authentication**: Check VITE_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY are set
- **Node Version**: Ensure Node.js v18+ is installed (`node --version`)
- **NPM Cache**: Clear npm cache if installation fails (`npm cache clean --force`)

#### Build and Development
- **Vite Build Errors**: Clear dist/ directory and rebuild (`rm -rf dist && npm run build`)
- **Hot Reload Issues**: Restart dev server and clear browser cache
- **TypeScript Errors**: Run type checking (`npm run typecheck`) and fix issues
- **ESLint Errors**: Auto-fix where possible (`npm run lint:fix`)
- **Prisma Issues**: Regenerate client (`npm run db:generate`) after schema changes

#### Production Deployment
- **Railway Deployment**: Check build logs in Railway dashboard for specific errors
- **Environment Variables**: Verify all production env vars are set in Railway
- **Database Migrations**: Ensure migrations run in production (`npm run db:migrate:deploy`)
- **Static Assets**: Verify Vite build assets are properly served by Express
- **SSL Issues**: Check CORS configuration for HTTPS origins

#### Performance Issues
- **Slow Database Queries**: Use Prisma Studio to analyze query performance
- **High Memory Usage**: Monitor Node.js memory with `--inspect` flag
- **Large Bundle Sizes**: Analyze bundle with Vite build analyzer
- **Cache Issues**: Clear Redis cache and restart application
- **API Rate Limits**: Check rate limiting logs and adjust limits

### Support Resources
- **Documentation**: Complete API and component documentation
- **Error Logs**: Winston logging with structured error information
- **Performance Monitoring**: Built-in metrics and monitoring endpoints
- **Database Tools**: Prisma Studio for database inspection
- **Development Tools**: React DevTools and Clerk Dashboard

This comprehensive codebase index provides developers with everything needed to navigate, understand, and contribute to the Sentia Manufacturing Dashboard. It serves as the definitive reference for this enterprise-grade manufacturing intelligence platform.
