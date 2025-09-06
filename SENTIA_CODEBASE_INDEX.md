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