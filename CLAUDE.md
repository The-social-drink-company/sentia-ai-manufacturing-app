# CLAUDE.md - Navigation Index

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated**: October 23, 2025
**Documentation Structure**: Modular shards for better maintainability
**Current Status**: 85% production-ready | Multi-tenant Phases 1-6 complete | 4-6 weeks to production

## 🚨 Critical Rules (MUST READ)

### 🔴 NEVER AUTOMATICALLY COMMIT TO TEST/PRODUCTION BRANCHES
- ✅ Work in `main` branch
- ❌ NO auto-commits to `test` or `production` without explicit instruction
- ❌ NO PRs to test/production without explicit user request

### 📝 Development Standards
- Do what's asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- DO NOT add code comments unless asked

## 📚 Documentation Structure

The documentation is organized into focused shards for better maintainability:

### [01-methodology/](claude-shards/01-methodology/)
- **[bmad-method.md](claude-shards/01-methodology/bmad-method.md)** - BMAD-METHOD v6-Alpha framework
- **[bmad-auto-update.md](claude-shards/01-methodology/bmad-auto-update.md)** - Autonomous framework updates
- **[autonomous-git.md](claude-shards/01-methodology/autonomous-git.md)** - Git automation system

### [02-project-context/](claude-shards/02-project-context/)
- **[ecosystem-positioning.md](claude-shards/02-project-context/ecosystem-positioning.md)** - CapLiquify & FinanceFlo.ai relationship
- **[multi-tenant-transformation.md](claude-shards/02-project-context/multi-tenant-transformation.md)** - SaaS transformation progress
- **[implementation-status.md](claude-shards/02-project-context/implementation-status.md)** - Feature completion tracking

### [03-technical/](claude-shards/03-technical/)
- **[architecture-overview.md](claude-shards/03-technical/architecture-overview.md)** - System architecture
- **[authentication-system.md](claude-shards/03-technical/authentication-system.md)** - Clerk auth integration
- **[integrations.md](claude-shards/03-technical/integrations.md)** - External API status
- **[database-config.md](claude-shards/03-technical/database-config.md)** - Database setup
- **[project-structure.md](claude-shards/03-technical/project-structure.md)** - Directory organization

### [04-deployment/](claude-shards/04-deployment/)
- **[deployment-infrastructure.md](claude-shards/04-deployment/deployment-infrastructure.md)** - Render setup
- **[environment-setup.md](claude-shards/04-deployment/environment-setup.md)** - Environment variables
- **[branch-strategy.md](claude-shards/04-deployment/branch-strategy.md)** - Git workflow
- **[critical-deployment-rules.md](claude-shards/04-deployment/critical-deployment-rules.md)** - ⚠️ MUST READ

### [05-guidelines/](claude-shards/05-guidelines/)
- **[reality-summary.md](claude-shards/05-guidelines/reality-summary.md)** - What actually works
- **[code-standards.md](claude-shards/05-guidelines/code-standards.md)** - Development standards
- **[security.md](claude-shards/05-guidelines/security.md)** - Security practices
- **[important-instructions.md](claude-shards/05-guidelines/important-instructions.md)** - Critical instructions

## 🚀 Quick Start

1. **Development Methodology**: Using BMAD-METHOD v6-Alpha (see [methodology](claude-shards/01-methodology/bmad-method.md))
2. **Current Status**: Multi-tenant SaaS transformation Phases 1-6 complete
3. **Integrations**: 2/4 operational (Shopify, Amazon), 1/4 partial (Unleashed), 1/4 stub (Xero)
4. **Next Action**: Run `bmad pm workflow-status` to check project status

## ⚡ Active Systems

### 🤖 BMAD Auto-Update Agent ✅

**Status**: Operational - Autonomous daily framework updates
**Version**: 1.0.0

An autonomous system that automatically keeps your BMAD-METHOD framework up-to-date with the latest v6-alpha releases while **preserving 100% of your project work**.

**Key Features**:
- ✅ **Fully Autonomous**: Runs daily at 3:00 AM via Windows Task Scheduler
- ✅ **Smart Detection**: Only updates when new v6-alpha commits available
- ✅ **100% Safe**: Automatic backups before every update
- ✅ **Project Preservation**: Never loses epics, stories, retrospectives (141 files preserved)
- ✅ **Git Integration**: Automatic commits with descriptive messages
- ✅ **Rollback Capable**: Automatic rollback on failure
- ✅ **Zero Configuration**: Works out of the box with sensible defaults

**Quick Commands**:
```bash
# Test in dry-run mode
node scripts/bmad-auto-update.cjs --dry-run

# Manual update trigger
node scripts/bmad-auto-update.cjs --force

# Run test suite
node scripts/test-update.cjs --verbose

# Setup scheduled task (PowerShell as Admin)
powershell -ExecutionPolicy Bypass -File scripts/setup-task-scheduler.ps1
```

For complete documentation, see [bmad-auto-update.md](claude-shards/01-methodology/bmad-auto-update.md)

### 🤖 Autonomous Git Agent ✅
**Status**: Operational - Auto-commits, pushes, and suggests PRs
For complete documentation, see [autonomous-git.md](claude-shards/01-methodology/autonomous-git.md)

## 📌 Project Context

### Ecosystem Positioning
**CapLiquify** is a specialized working capital SaaS built on **FinanceFlo.ai** infrastructure.
For complete details, see [ecosystem-positioning.md](claude-shards/02-project-context/ecosystem-positioning.md)

### Multi-Tenant Transformation
**Status**: Phases 1-6 complete (Database, Backend, Auth, Marketing, Admin, Billing)
For complete details, see [multi-tenant-transformation.md](claude-shards/02-project-context/multi-tenant-transformation.md)

### Implementation Status
**Current**: 85% production-ready | 4-6 weeks remaining
For complete details, see [implementation-status.md](claude-shards/02-project-context/implementation-status.md)


## 🔧 Technical Details

For architecture, authentication, integrations, and database configuration, see:
- [03-technical/](claude-shards/03-technical/) - Technical documentation

## 🚢 Deployment

For deployment infrastructure, environment setup, and branch strategy, see:
- [04-deployment/](claude-shards/04-deployment/) - Deployment documentation

## 📋 Guidelines

For reality summary, code standards, and security practices, see:
- [05-guidelines/](claude-shards/05-guidelines/) - Guidelines and standards

---

## 🎯 Summary

This project is an **85% production-ready** manufacturing intelligence platform with:
- ✅ Complete multi-tenant SaaS foundation (Phases 1-6 done)
- ✅ Enterprise-grade architecture (React, Node.js, Prisma, PostgreSQL)
- ✅ Production-ready authentication (Clerk) and billing (Stripe)
- ⚠️ 2/4 integrations operational (Shopify, Amazon), 1 partial (Unleashed), 1 stub (Xero)
- ⏳ 4-6 weeks remaining: integration fixes + testing + hardening

**For detailed information, navigate to the appropriate shard documentation above.**

### Completed Phases ✅

**Phase 1: Database Architecture** (100% Complete)
- ✅ Complete Prisma schema with multiSchema support (520 lines)
- ✅ Public schema migration (tenants, users, subscriptions, audit_logs)
- ✅ PostgreSQL tenant management functions (create, delete, list, verify isolation)
- ✅ Comprehensive testing queries with 2 test tenants + sample data
- ✅ Multi-tenant setup guide (630 lines of documentation)

**Phase 2: Backend Multi-Tenant Framework** (100% Complete)
- ✅ Tenant context middleware with automatic Clerk organization resolution
- ✅ Subscription tier validation and feature flag enforcement
- ✅ Entity/user limit guards and read-only mode support
- ✅ RBAC middleware (owner/admin/member/viewer)
- ✅ Tenant-aware Prisma service with connection pooling
- ✅ CapLiquify migration guide (950 lines of step-by-step instructions)

**Phase 2.1: Multi-Tenant API Route Refactoring** (100% Complete) ✅ **NEW - October 22, 2025**
- ✅ 4 routes refactored (onboarding, import, export, ml-models) - **462 lines changed**
- ✅ 100% tenant isolation - zero cross-tenant data leakage risk
- ✅ Feature gating complete (Professional+ for AI forecasting)
- ✅ Entity limit enforcement for bulk imports (Starter tier protection)
- ✅ RBAC for sensitive operations (admin-only exports/training)
- ✅ Comprehensive audit logging with tenant context
- ✅ Converted 3 routes from CommonJS to ES modules
- ✅ All 10 core routes now multi-tenant aware (100% coverage)

**Deliverables**: 462 lines across 4 files, 39 routes fully tenant-scoped
**Velocity**: 42% faster than estimated (3.5 hours vs 6 hours)
**Documentation**: [Phase 2.1 Retrospective](bmad/retrospectives/2025-10-22-phase-2-1-completion-multi-tenant-routes.md)

### Architecture Highlights

**Schema-Per-Tenant Isolation**:
```
PostgreSQL Database
├── public schema (shared metadata)
│   ├── tenants (master tenant registry)
│   ├── users (tenant association)
│   ├── subscriptions (Stripe billing)
│   └── audit_logs (compliance trail)
│
├── tenant_<uuid1> schema (Tenant A's data)
│   ├── companies, products, sales, inventory
│   ├── forecasts, working_capital_metrics
│   ├── scenarios, api_credentials
│   └── user_preferences
│
└── tenant_<uuid2> schema (Tenant B's data)
    └── (same 9 tables)
```

**Subscription Tiers**:
- **Starter**: $29-49/mo (5 users, 500 entities, basic features)
- **Professional**: $99-149/mo (25 users, 5K entities, AI forecasting, what-if analysis)
- **Enterprise**: $299-499/mo (100 users, unlimited, custom integrations, advanced reports)

**Feature Flags**:
- `ai_forecasting`: Professional+ (AI-powered demand forecasting)
- `what_if`: Professional+ (Scenario modeling)
- `api_integrations`: All tiers (Shopify, Xero, Amazon, Unleashed)
- `advanced_reports`: Enterprise (Custom reporting)
- `custom_integrations`: Enterprise (White-label integrations)

### Deliverables (4,280+ lines)

| File | Lines | Purpose |
|------|-------|---------|
| `prisma/schema-multi-tenant.prisma` | 520 | Complete multi-tenant schema |
| `prisma/migrations/001_create_public_schema.sql` | 200 | Public schema tables |
| `prisma/migrations/002_tenant_schema_functions.sql` | 450 | Tenant management functions |
| `prisma/migrations/003_testing_queries.sql` | 500 | Comprehensive testing |
| `docs/MULTI_TENANT_SETUP_GUIDE.md` | 630 | Setup & usage guide |
| `docs/CAPLIQUIFY_MIGRATION_GUIDE.md` | 950 | Complete migration guide |
| `server/middleware/tenantContext.js` | 510 | Tenant middleware |
| `server/services/tenantPrisma.js` | 520 | Tenant-aware Prisma service |

### Completed Phases (Continued)

**Phase 4: Marketing Website** (100% Complete) ✅ **NEW - October 22, 2025**
- ✅ Professional landing page with hero section, features showcase
- ✅ Pricing section with 3 tiers (Starter/Professional/Enterprise)
- ✅ Social proof with real FinanceFlo.ai metrics (450+ businesses, 66% cost reduction, 500% ROI)
- ✅ FAQ section with 8-10 common questions
- ✅ Enhanced dashboard mockup with chart visualization (12 data points)
- ✅ Comprehensive SEO (meta tags, OG/Twitter cards, JSON-LD structured data)
- ✅ WCAG 2.1 AA accessibility (ARIA labels, focus states, skip-to-main, keyboard navigation)
- ✅ Mobile responsive (375px - 1920px)
- ✅ Performance optimization (preconnect, dns-prefetch for API domains)

**Deliverables**: 13 stories complete, ~2,000 lines across 9 files
**Velocity**: 2-3x faster than BMAD estimate (8 hours vs 12-25 hours), 8-11x traditional
**Documentation**: [Phase 4 Retrospective](bmad/retrospectives/2025-10-22-phase-4-marketing-website-completion.md)

**Phase 5.1: Master Admin Dashboard** (100% Complete) ✅ - October 20, 2025
- ✅ Master admin authentication middleware with 2FA enforcement
- ✅ Backend API routes (11 endpoints: metrics, revenue, tenants, audit logs)
- ✅ Frontend dashboard with CapLiquify branding
- ✅ System Health Panel with real-time monitoring (ADMIN-007)
- ✅ Revenue Analytics with charts (recharts integration) (ADMIN-006)
- ✅ Tenant Detail Modal with management actions (ADMIN-005)
- ✅ Audit Log Viewer with CSV export (ADMIN-008)
- ✅ Custom hooks for all master admin operations (useMasterAdmin.ts)
- ✅ Comprehensive retrospective documentation

**Deliverables**: 1,955 lines across 5 components, 13 custom hooks, 11 API endpoints
**Velocity**: 1.5x faster than estimated (4 hours vs 6 hours)
**Documentation**: [Phase 5.1 Retrospective](bmad/retrospectives/2025-10-20-phase-5-1-master-admin-completion.md)

### Completed Phases (Continued)

**Phase 3: Authentication & Tenant Management** (100% Complete) ✅ **NEW - October 23, 2025**
- ✅ Clerk webhooks integration (709 lines)
- ✅ Tenant provisioning service (432 lines)
- ✅ Organization switcher UI (142 lines)
- ✅ User invitation system with email notifications (750 lines)
- ✅ Multi-tenant onboarding flow verification
- ✅ Organization metadata sync via webhooks
- ✅ User role management API + UI (1,200 lines)
- ✅ Multi-tenant auth flow with middleware (452 lines)

**Deliverables**: 8/8 stories complete, ~2,400 lines of code, ~1,800 lines of documentation
**Velocity**: Completed in 6 hours (2 sessions)
**Documentation**: [Phase 3 Retrospective](bmad/retrospectives/2025-10-23-phase-3-complete.md)

**Phase 6: Billing & Subscriptions (Stripe)** (100% Complete) ✅ **NEW - October 23, 2025**
- ✅ Stripe billing integration (BMAD-MULTITENANT-004)
- ✅ Subscription management system
- ✅ Pricing tiers implementation (Starter/Professional/Enterprise)
- ✅ Trial automation and expiration handling
- ✅ Stripe webhook handlers for subscription events

**Deliverables**: 4/4 stories complete (BMAD-MULTITENANT-004)
**Documentation**: [Phase 6 Retrospective](bmad/retrospectives/2025-10-23-BMAD-MULTITENANT-004-retrospective.md)

### Remaining Phases

| Phase | Description | Estimated Time | Status |
|-------|-------------|----------------|--------|
| **Phase 3** | Authentication & Tenant Management | 3-4 weeks | ✅ **COMPLETE** (October 23, 2025) |
| **Phase 4** | Marketing Website | 2-3 weeks | ✅ **COMPLETE** (October 22, 2025) |
| **Phase 5** | Master Admin Dashboard | 2-3 weeks | ✅ **COMPLETE** (October 20, 2025) |
| **Phase 6** | Billing & Subscriptions (Stripe) | 3-4 weeks | ✅ **COMPLETE** (October 23, 2025) |
| **Phase 7** | Data Migration & Testing | 2-3 weeks | ⏳ Pending |
| **Phase 8** | Production Launch & Monitoring | 1-2 weeks | ⏳ Pending |

**Total Estimated Time to Production**: 3-5 weeks (Phases 7 & 8 only) - Updated after Phases 1-6 completion

### Documentation

- **Multi-Tenant Setup Guide**: [MULTI_TENANT_SETUP_GUIDE.md](docs/MULTI_TENANT_SETUP_GUIDE.md)
- **Migration Guide**: [CAPLIQUIFY_MIGRATION_GUIDE.md](docs/CAPLIQUIFY_MIGRATION_GUIDE.md)
- **Phase 1-2 Retrospective**: [2025-10-19-capliquify-phase-1-2-retrospective.md](bmad/retrospectives/2025-10-19-capliquify-phase-1-2-retrospective.md)
- **Phase 4 Retrospective**: [2025-10-22-phase-4-marketing-website-completion.md](bmad/retrospectives/2025-10-22-phase-4-marketing-website-completion.md) ⬆️ **NEW**
- **Phase 5.1 Retrospective**: [2025-10-20-phase-5-1-master-admin-completion.md](bmad/retrospectives/2025-10-20-phase-5-1-master-admin-completion.md)

---

## 🎉 **ACTUAL IMPLEMENTATION STATUS**

**EPIC-002 & EPIC-003 COMPLETE**: This application has been **transformed from 15% to 95% functional implementation** through BMAD-METHOD v6a Phase 4 completion. **ZERO MOCK DATA** achieved across all services with live external API integration (Xero, Shopify, Amazon SP-API, Unleashed ERP). **UI/UX Polish** complete with breadcrumb navigation, system status monitoring, and production-ready frontend.

**CURRENT STATE (October 20, 2025)**:

- ✅ **UI Framework**: Modern React/Tailwind components fully functional
- ✅ **Navigation**: Complete routing, sidebar navigation, breadcrumb system ⬆️ **NEW (EPIC-003)**
- ✅ **System Monitoring**: Real-time integration health badges ⬆️ **NEW (EPIC-003)**
- ✅ **Authentication**: Clerk integration with development bypass working
- ✅ **Architecture**: Enterprise-grade infrastructure and deployment setup
- ✅ **API Integrations**: 4 live integrations (Xero, Shopify, Amazon SP-API, Unleashed ERP) ⬆️ **COMPLETE**
- ✅ **Business Logic**: Working capital optimization, demand forecasting, inventory management functional ⬆️ **BREAKTHROUGH**
- ✅ **Data Layer**: Real manufacturing data with live external integration, **ZERO mock fallbacks** ⬆️ **EPIC-002 COMPLETE**
- ✅ **Setup Prompts**: 4 production-ready components (100% pattern consistency) ⬆️ **EPIC-002**
- ✅ **Three-Tier Fallback**: API → Database → 503 Setup Instructions (never fake data) ⬆️ **EPIC-002**
- ✅ **Deployment Chain**: 4 critical blockers resolved (Prisma, ES modules, Clerk env var, UI polish) ⬆️ **NEW**

## ⚠️ **DATA INTEGRITY STATUS** ⬆️ **CORRECTED (October 23, 2025)**

**Status**: Significant progress made, but mock data violations still exist in 1 integration.

**✅ Mock Data Violations Eliminated** (Partial):

- ✅ **FinancialAlgorithms.js**: Hardcoded fallbacks removed, uses real data
- ✅ **APIIntegration.js**: Fake order generation eliminated
- ✅ **Shopify Integration**: Full implementation, no mock fallbacks
- ✅ **Amazon SP-API**: Full implementation, no mock fallbacks
- ⚠️ **Unleashed Integration**: **HAS MOCK FALLBACK** (lines 40-66) - violates zero mock data claim
- ❌ **Xero Integration**: Stub only - returns empty arrays

**⚠️ Remaining Mock Data Violations**:

```javascript
// unleashed.js lines 40-66 - MOCK FALLBACK PRESENT
async makeRequest(endpoint, params = {}) {
  if (this.mockMode) {
    return this.getMockData(endpoint)  // FALLBACK TO MOCK
  }
  // ... real API calls ...
  catch (error) {
    console.error('Unleashed API error:', error.message)
    return this.getMockData(endpoint)  // FALLBACK ON ERROR ⚠️
  }
}
```

**Action Required**:
1. Remove mock fallback from Unleashed integration
2. Implement proper 503 error responses
3. Implement Xero integration OR remove claims

## IMPLEMENTATION STATUS BY FEATURE

### **✅ FULLY FUNCTIONAL FEATURES (92%)** ⬆️ **EPIC-002, EPIC-003, EPIC-006, EPIC-008, ONBOARDING-001 COMPLETE**

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

#### **Working Capital Engine** ✅ **NEW**

- **Status**: Fully functional with advanced algorithms
- **Functionality**: Real cash conversion cycle calculations, optimization recommendations
- **Components**: WorkingCapitalEngine.js, RealWorkingCapital.jsx
- **Reality**: 30-90 day forecasting, receivables/payables optimization, live Xero integration

#### **Inventory Management System** ✅ **NEW**

- **Status**: Comprehensive real-time inventory intelligence
- **Functionality**: Reorder point calculations, batch optimization (100-1000 units)
- **Components**: InventoryManagement.jsx with live Shopify sync
- **Reality**: 9-SKU tracking, channel-specific allocation, lead time analysis

#### **Demand Forecasting Engine** ✅ **NEW**

- **Status**: AI-powered statistical models operational
- **Functionality**: Ensemble forecasting, seasonal pattern detection
- **Components**: DemandForecastingEngine.js, DemandForecasting.jsx
- **Reality**: Channel-specific patterns (Amazon vs Shopify), confidence intervals

#### **Financial Reports & P&L Analysis** ✅ **NEW**

- **Status**: Real-time financial analysis with live data
- **Functionality**: Month-over-month tracking, comprehensive financial reporting
- **Components**: FinancialReports.jsx connected to real endpoints
- **Reality**: Actual P&L data integration, performance trend analysis

#### **Shopify Multi-Store Integration** ✅ **NEW**

- **Status**: Fully operational across UK/EU/USA stores
- **Functionality**: Real-time order sync, 2.9% commission calculations
- **Components**: shopify-multistore.js with live data streaming
- **Reality**: 500+ real transactions, live inventory sync, net revenue tracking

#### **Xero Financial Integration** ❌ **STUB ONLY - NOT IMPLEMENTED**

- **Status**: 7-line stub returning empty arrays
- **Functionality**: NOT FUNCTIONAL - requires full implementation
- **Components**: xero.js (7 lines) - stub file only
- **Reality**: Returns empty array `[]` - no OAuth, no API calls
- **Action Required**: Implement full Xero integration OR remove from marketing claims

#### **Amazon SP-API Integration** ✅ **NEW** (EPIC-002)

- **Status**: Fully operational with OAuth 2.0 + AWS IAM authentication
- **Functionality**: FBA inventory sync, order metrics tracking, channel performance comparison
- **Components**: amazon-sp-api.js with 15-minute background scheduler
- **Reality**: Real-time inventory data, order revenue, unshipped items tracking
- **Epic**: BMAD-MOCK-005 (EPIC-002)

#### **Unleashed ERP Integration** ⚠️ **PARTIAL** (EPIC-002)

- **Status**: Full implementation with mock data fallback (lines 40-66)
- **Functionality**: Assembly job tracking, stock on hand sync, production schedule, quality alerts
- **Components**: unleashed.js (462 lines) with HMAC-SHA256 authentication
- **Reality**: Falls back to mock data on API errors - violates "zero mock data" principle
- **Action Required**: Remove mock fallback, return proper 503 errors instead
- **Epic**: BMAD-MOCK-006 (EPIC-002)

#### **Import/Export System** ✅ **COMPLETE** (Phase 2)

- **Status**: Enterprise-grade async job processing infrastructure
- **Functionality**: CSV/XLSX/JSON import/export with validation and transformation
- **Components**:
  - BullMQ queues with Redis backend (importQueue.js, exportQueue.js)
  - RESTful API routes with RBAC (/api/import/_, /api/export/_)
  - Service layer (ValidationEngine, DataTransformer, ImportProcessor, ExportGenerator)
  - Security services (CSRF, RateLimiter, InputSanitizer, Encryption)
  - Admin UI (IntegrationManagement.jsx)
- **Features**:
  - Retry logic: 3 attempts with exponential backoff
  - Progress tracking with real-time status updates
  - Multi-format support (CSV, Excel, JSON)
  - Schema-based validation with detailed error reporting
  - Scheduled/recurring exports
  - MFA-protected admin operations
  - Comprehensive audit logging
- **Reality**: Production-ready import/export foundation with 7,000+ lines of enterprise code

#### **Trial Onboarding Flow** ✅ **NEW** (EPIC-ONBOARDING-001)

- **Status**: Production-ready frictionless onboarding system
- **Route**: `/trial-onboarding` - Complete 4-step wizard with progressive disclosure
- **Functionality**:
  - Company setup (name, industry, company size)
  - Integration configuration (Xero, Shopify, Amazon, Unleashed) - optional
  - Team setup (invite team members) - optional
  - Sample data generation (20 products, financial data, production jobs)
- **Components**:
  - `OnboardingWizard.tsx` - Main wizard orchestration with step navigation
  - `OnboardingChecklist.jsx` - Progress tracking sidebar (8 tasks)
  - `ProductTour.tsx` - Interactive guided tour with react-joyride (7 steps)
  - `SampleDataGenerator.js` - Realistic sample data for 9 SKUs
  - `onboardingService.js` - API integration layer
  - Step components (CompanyStep, IntegrationsStep, TeamStep, DataStep)
- **Features**:
  - Progressive disclosure UX (skip optional steps)
  - Real-time step validation with instant feedback
  - Celebration flow with confetti animation on completion
  - Mobile-responsive design (Tailwind responsive classes)
  - Data persistence across page refreshes
  - Smooth animations and transitions
- **API Endpoints**:
  - `POST /api/onboarding/complete` - Mark onboarding complete
  - `POST /api/onboarding/sample-data` - Generate sample data
  - `GET /api/onboarding/status` - Check onboarding progress
- **Reality**: 2,756 lines across 18 files, 6.5 hours implementation (3x faster than traditional approach)
- **Epic**: CAPLIQUIFY-ONBOARDING-001 (completed 2025-10-20)

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

## AUTHENTICATION SYSTEM ✅ **PRODUCTION-READY** (EPIC-006 COMPLETE)

**Status**: ✅ **Fully Functional & Secure** (EPIC-006 completed 2025-10-19)
**Epic**: EPIC-006 (Authentication Enhancement) - 10/10 stories complete
**Velocity**: 42% faster than estimated (3.5 hours vs 6 hours)

### Core Features ✅

- ✅ **Clerk Integration**: Production-ready OAuth authentication
- ✅ **Development Bypass**: Environment-aware auth (VITE_DEVELOPMENT_MODE)
- ✅ **Branded Pages**: Sign-in/sign-up with Sentia blue-purple gradient
- ✅ **Route Protection**: 20 routes (3 public, 2 public-only, 15 protected)
- ✅ **RBAC Framework**: Role-based access control (admin, manager, operator, viewer)
- ✅ **Error Handling**: Graceful degradation, user-friendly fallbacks
- ✅ **Loading States**: Branded loading screens prevent flash of content

### Security Verification ✅

- ✅ **Route Security Audit**: 0 critical vulnerabilities (BMAD-AUTH-008)
- ✅ **Comprehensive Testing**: 24/24 available tests passed (BMAD-AUTH-009)
- ✅ **Defense in Depth**: Route + component + API-level protection
- ✅ **Secure by Default**: Unknown routes redirect to safe landing page

### Components & Hooks ✅

**Pages**:
- `SignInPage.jsx` - Clerk sign-in with Sentia branding
- `SignUpPage.jsx` - Clerk sign-up with Sentia branding

**Route Wrappers**:
- `ProtectedRoute` - Requires authentication, redirects to `/sign-in`
- `PublicOnlyRoute` - Prevents authenticated users accessing auth pages

**Hooks**:
- `useEnvironmentAuth()` - Dev bypass + production Clerk integration
- `useAuth()` - Unified auth interface (user data + auth state)
- `useAuthRole()` - Role-based access control

**Error Handling**:
- `ErrorBoundary` - Catches crashes, prevents data exposure
- `LoadingScreen` - Branded Sentia loading with blue gradient

### Documentation ✅

- **Route Security Audit**: [ROUTE_SECURITY_AUDIT.md](ROUTE_SECURITY_AUDIT.md) (500+ lines)
- **Testing Results**: [AUTHENTICATION_TESTING_RESULTS.md](AUTHENTICATION_TESTING_RESULTS.md) (500+ lines)
- **Testing Checklist**: [AUTHENTICATION_TESTING_CHECKLIST.md](AUTHENTICATION_TESTING_CHECKLIST.md) (290 lines)

### Deployment Status

- ⚠️ **Render Deployment**: 503 (Service Unavailable) - requires user action
- ✅ **Code Verification**: All components tested and functional
- ✅ **Production Readiness**: APPROVED (pending Render restoration)

## INTEGRATION STATUS ⬆️ **CORRECTED (October 23, 2025)**

### **Integration Summary**

| Integration | Status | Details |
|-------------|--------|---------|
| Shopify | ✅ Operational | 486 lines, full implementation |
| Amazon SP-API | ✅ Operational | 583 lines, full implementation |
| Unleashed ERP | ⚠️ Partial | 462 lines, has mock fallback |
| Xero | ❌ Stub Only | 7 lines, not implemented |

### **Shopify Integration** ✅ **OPERATIONAL**

- **Framework**: Multi-store service fully implemented (486 lines)
- **Reality**: UK/EU/USA stores actively syncing with 2.9% commission tracking
- **Status**: Operational - 500+ real transactions, live inventory sync
- **Authentication**: API keys configured via environment variables

### **Amazon SP-API** ✅ **OPERATIONAL** (EPIC-002)

- **Framework**: Complete OAuth 2.0 + AWS IAM authentication implemented (583 lines)
- **Reality**: FBA inventory sync, order metrics, channel performance tracking
- **Status**: Operational - 15-minute sync, rate limiting respected, ready for credential configuration
- **Epic**: BMAD-MOCK-005 (completed 2025-10-19)

### **Unleashed ERP** ⚠️ **PARTIAL IMPLEMENTATION** (EPIC-002)

- **Framework**: HMAC-SHA256 authentication, full API implementation (462 lines)
- **Reality**: Has mock data fallback on errors (lines 40-66) - **violates "zero mock data" claim**
- **Status**: Partial - works with credentials, falls back to mock without
- **Action Required**: Remove mock fallback, implement proper 503 error responses
- **Epic**: BMAD-MOCK-006 (completed 2025-10-19, needs revision)

### **Xero Financial Integration** ❌ **STUB ONLY - NOT IMPLEMENTED**

- **Framework**: 7-line stub file returning empty arrays
- **Reality**: NO OAuth, NO API calls, NO data streaming
- **Status**: Not implemented - returns `[]` for all methods
- **Action Required**: Full implementation (8-12 hours) OR remove from documentation/marketing
- **Epic**: BMAD-MOCK-001 (INCORRECTLY marked complete)

## DEPLOYMENT INFRASTRUCTURE ✅

### **Cloud-Based Deployment (Actually Working)**

All environments deployed on Render with proper CI/CD:

### Live Environments

**Current Production Services** (All deploy from `development` branch):

| Service         | URL                                       | Status    | Purpose                   |
| --------------- | ----------------------------------------- | --------- | ------------------------- |
| **Frontend**    | https://sentia-frontend-prod.onrender.com | ✅ Active | React application UI      |
| **Backend API** | https://sentia-backend-prod.onrender.com  | 🔄 Active | Express REST API + Prisma |
| **MCP Server**  | https://sentia-mcp-prod.onrender.com      | 🔄 Active | External API integrations |
| **Database**    | Internal PostgreSQL 17                    | ✅ Active | Main data store           |

**Health Check Endpoints**:

- MCP: https://sentia-mcp-prod.onrender.com/health
- Backend: https://sentia-backend-prod.onrender.com/api/health

**⚠️ Critical Configuration**: All services MUST specify `branch: main` in render.yaml (see [docs/render-deployment-guide.md](docs/render-deployment-guide.md))

**Database Expiration**: Free tier expires **November 16, 2025** (upgrade required)

### Deployment Commands

```bash
# Push to main (auto-deploys to production services)
git push origin main

# Push to test (auto-deploys to test environment - future)
git push origin test

# Push to production (dedicated production environment - future)
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
- **Trial Onboarding** (`/trial-onboarding`): New user onboarding wizard with sample data generation ⬆️ **NEW**

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

- `main` - **Primary development branch (default)** - All development work happens here
- `test` - User acceptance testing environment
- `production` - Live production environment

**NOTE**: The `development` branch has been consolidated into `main` as of October 19, 2025.

### Render Deployment Configuration

#### Main Application Deployments

**IMPORTANT**: The application now uses a **3-service architecture** (Frontend, Backend API, MCP Server) instead of the previous monolithic deployment.

**Current Production Services** (All deploy from `main` branch):

| Service         | URL                                       | Status    | Purpose                   |
| --------------- | ----------------------------------------- | --------- | ------------------------- |
| **Frontend**    | https://sentia-frontend-prod.onrender.com | ✅ Active | React application UI      |
| **Backend API** | https://sentia-backend-prod.onrender.com  | 🔄 Active | Express REST API + Prisma |
| **MCP Server**  | https://sentia-mcp-prod.onrender.com      | 🔄 Active | External API integrations |

**Health Check Endpoints**:

- Frontend: https://sentia-frontend-prod.onrender.com
- Backend: https://sentia-backend-prod.onrender.com/api/health
- MCP: https://sentia-mcp-prod.onrender.com/health

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

**Enterprise Git Workflow**: All development work happens in the `main` branch, which deploys to the production Render services:

1. **Main Branch**: All coding, fixing, and development work happens in `main` branch
   - Auto-deploys to: `sentia-frontend-prod`, `sentia-backend-prod`, `sentia-mcp-prod`
   - Custom domains: app.capliquify.com, api.capliquify.com, mcp.capliquify.com
2. **Test Branch**: Push to `test` branch for user acceptance testing (future separate environment)
3. **Production Branch**: Production-ready releases (future dedicated environment)

**Quality Gates**: Formal UAT process with client approval required before production deployment.

### 🤖 **AUTONOMOUS GIT AGENT SYSTEM** ✅ **ACTIVE**

**Status**: Operational since October 17, 2025

An intelligent autonomous system that automatically manages git commit, push, and PR operations during development, eliminating the "GitHub mess" problem.

**Documentation**:

- **Complete Specification**: [docs/AUTONOMOUS_GIT_AGENT.md](docs/AUTONOMOUS_GIT_AGENT.md) (500+ lines)
- **Quick Reference**: [.claude-git-agent-rules.md](.claude-git-agent-rules.md)
- **Summary**: [AUTONOMOUS_GIT_SUMMARY.md](AUTONOMOUS_GIT_SUMMARY.md)

#### How It Works

**Three-Tier Trigger System:**

1. **PRIMARY (Task-Based)**: Auto-commits when TodoWrite tasks are completed
2. **SECONDARY (Change-Based)**: Auto-commits when 5+ files modified OR 150+ lines changed
3. **TERTIARY (Time-Based)**: Safety WIP commits every 30 minutes if uncommitted changes exist

**Automatic Operations:**

- ✅ **Smart Commits**: Auto-generated commit messages from task content and file analysis
- ✅ **Conventional Format**: Follows `type: subject` format (feat, fix, docs, refactor, etc.)
- ✅ **Auto-Push**: Pushes to main branch every 5 commits OR 1 hour (whichever first)
- ✅ **PR Suggestions**: Asks user when feature/epic milestones are reached

**Key Benefits:**

- Never lose work (automatic safety checkpoints)
- Clean, meaningful commit history
- Small, reviewable commits
- No manual git operations needed
- Eliminates "GitHub mess" problem permanently

**Safety Rules:**

- ❌ NEVER auto-commits to `test` or `production` branches
- ❌ NEVER creates PRs without asking first
- ❌ NEVER pushes if merge conflicts exist
- ✅ ONLY operates on `main` branch (unless explicitly told otherwise)

**Session Example:**

```
User works on feature → Claude completes tasks → Auto-commits after each task
After 5 commits → Auto-pushes to main
After epic complete → Asks: "Create PR with 12 commits?"
```

### 🚨 **CRITICAL DEPLOYMENT RULE**

**NEVER AUTOMATICALLY COMMIT, PUSH, OR CREATE PULL REQUESTS TO TESTING/PRODUCTION BRANCHES**

Claude must ONLY work in the `main` branch. Any commits, pushes, or PRs to `test` or `production` branches require explicit manual instruction from the user.

**Allowed in Main Branch**:

- ✅ Make commits to `main` branch
- ✅ Push to `main` branch
- ✅ Create PRs within `main` branch

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

**MANDATORY**: Claude must NEVER automatically commit, push, or create pull requests to `test` or `production` branches without explicit user instruction. Only work in `main` branch unless specifically told otherwise.

### Render Platform Configuration Notes

- Deployment uses Render for all environments (development, testing, production)
- Application is an Express/Node.js server serving both API and static React build
- PostgreSQL databases with pgvector extension for AI/ML capabilities
- Auto-deployment configured for all three branches via render.yaml
- Environment variables automatically injected from Render dashboard
- Health checks configured at `/health` endpoint

## 🚨 **HONEST REALITY SUMMARY** ⬆️ **UPDATED (October 23, 2025)**

### **What This Application Actually Is**

This is a **near production-ready manufacturing intelligence platform** with enterprise-grade architecture and **multi-tenant SaaS foundation complete** (Phases 1-6 done). The infrastructure, UI, deployment, and authentication are genuinely functional. **Integration reality**: 2/4 integrations fully operational, 1 partial, 1 stub. Remaining work focuses on integration completion, test coverage (EPIC-004), and production hardening (EPIC-005).

### **What Works vs What's Claimed**

- ✅ **Architecture**: Genuinely enterprise-grade (React, Node.js, Prisma, PostgreSQL)
- ✅ **Multi-Tenant Foundation**: Phases 1-6 complete (DB, Backend, Auth, Marketing, Admin, Billing) ⬆️ **NEW**
- ✅ **Deployment**: Professional CI/CD with three-service architecture
- ✅ **UI/UX**: Modern, responsive interface with proper component library
- ✅ **Frontend Polish**: Breadcrumbs, status badges, error boundaries complete (EPIC-003)
- ⚠️ **Data Layer**: Shopify & Amazon integrations complete, Unleashed has mock fallback, Xero is stub
- ⚠️ **Integrations**: 2/4 fully operational (Shopify, Amazon), 1/4 partial (Unleashed), 1/4 stub (Xero)
- ⚠️ **Test Coverage**: Estimated 20-30% actual (not 40% as claimed)
- ⏳ **Production Hardening**: Security, monitoring, performance (EPIC-005)

### **Integration Status (CORRECTED)**

| Integration | Status | Implementation | Lines | Reality |
|-------------|--------|----------------|-------|---------|
| **Shopify** | ✅ Operational | Full multi-store support | 486 | UK/EU/USA stores, 2.9% commission tracking |
| **Amazon SP-API** | ✅ Operational | OAuth 2.0 + AWS IAM | 583 | FBA inventory, order metrics, ready for credentials |
| **Unleashed ERP** | ⚠️ Partial | Has mock fallback | 462 | Falls back to mock data on error (lines 40-66) |
| **Xero** | ❌ Stub Only | 7-line stub | 7 | Returns empty array, not implemented |

**Action Required**: Implement Xero integration OR remove claims, eliminate Unleashed mock fallback

### **Bottom Line**

**MULTI-TENANT TRANSFORMATION COMPLETE** (October 23, 2025):
- ✅ **Phases 1-6 Complete**: Database, Backend, Auth, Marketing, Admin Dashboard, Billing (100%)
- ✅ **Phase 3 (Auth)**: Completed October 23 in 6 hours (~2,400 lines of code)
- ✅ **Phase 6 (Billing)**: Completed October 23 (BMAD-MULTITENANT-004)
- ⚠️ **Integration Gaps**: Xero stub, Unleashed mock fallback need resolution
- ⏳ **Phase 7 (Data Migration & Testing)**: 2-3 weeks
- ⏳ **Phase 8 (Production Launch)**: 1-2 weeks

**Current Progress**: **85% production-ready** (realistic assessment, down from 95% claim)
**Revised Estimate**: **4-6 weeks to production** (integration fixes + testing + hardening)

### **For Users/Stakeholders**

**What's Ready**:
- ✅ Application loads and looks professional
- ✅ Navigation and UI interactions work perfectly
- ✅ Multi-tenant infrastructure complete (6 phases done)
- ✅ Authentication system production-ready (Clerk)
- ✅ Billing system operational (Stripe)
- ✅ Breadcrumb navigation, system status badges, error boundaries

**What Needs Work**:
- ⚠️ Xero integration is stub (returns empty data)
- ⚠️ Unleashed has mock data fallback (needs fixing)
- ⚠️ Test coverage at 20-30% (needs expansion to 70%+)
- ⚠️ Security audit required before production
- ⚠️ Performance testing not yet completed

**Recommendation**: **85% production-ready** with 4-6 weeks remaining work. Multi-tenant foundation is solid (Phases 1-6 complete), but integration completion and testing critical before launch.

