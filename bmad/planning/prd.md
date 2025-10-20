# Product Requirements Document (PRD)
## CapLiquify Platform AI Dashboard

**Date**: 2025-10-19
**Version**: 1.0
**Project Type**: Brownfield - Existing codebase transformation
**Scale Level**: Level 4 (Complex Enterprise System)
**Framework**: BMAD-METHOD v6a

---

## Executive Summary

The CapLiquify Platform AI Dashboard is an enterprise-grade manufacturing intelligence platform that provides real-time visibility and control across all aspects of CapLiquify Platform's operations. The platform integrates with external e-commerce platforms (Amazon, Shopify), financial systems (Xero), and ERP systems (Unleashed) to deliver data-driven insights for manufacturing planning, inventory optimization, financial management, and demand forecasting.

**Current Status**: 75% functional implementation with sophisticated architecture but requiring elimination of mock data and completion of external API integrations.

**Primary Objective**: Transform from a high-fidelity prototype with mock data into a production-ready enterprise platform with 100% real data integration.

---

## Product Vision

**Vision Statement**: Empower CapLiquify Platform with AI-powered intelligence that eliminates guesswork from manufacturing planning, inventory management, and financial forecasting, enabling data-driven decisions that optimize cash flow, reduce waste, and maximize profitability.

**Strategic Goals**:
1. **Eliminate Operational Blind Spots**: Provide real-time visibility into all critical business metrics
2. **Optimize Working Capital**: Reduce cash conversion cycle through intelligent receivables/payables management
3. **Prevent Stockouts & Overstock**: AI-powered demand forecasting with 85%+ accuracy
4. **Streamline Manufacturing**: Automated production scheduling optimized for resource utilization
5. **Enable Scalability**: Platform architecture supports growth from 3 to 30+ markets

---

## Target Users

### Primary Users

#### 1. Manufacturing Planners (Primary Persona)
**Role**: Plan production schedules, manage resources, optimize manufacturing operations
**Needs**:
- Real-time view of production capacity and utilization
- Automated production scheduling with constraint solving
- Resource allocation optimization
- Quality control tracking and metrics

**Success Criteria**: 50% reduction in planning time, 90%+ on-time delivery

#### 2. Financial Controllers
**Role**: Manage cash flow, working capital, financial forecasting
**Needs**:
- Working capital analysis and optimization
- Cash conversion cycle monitoring (DSO, DPO, DIO)
- Multi-currency financial reporting (GBP, EUR, USD)
- Real-time P&L visibility with Xero integration

**Success Criteria**: 20% reduction in inventory carrying costs, 95% forecast accuracy

#### 3. Operations Managers
**Role**: Oversee day-to-day operations, inventory management, fulfillment
**Needs**:
- Multi-channel inventory visibility (own warehouses + FBA)
- Reorder point calculations with lead time analysis
- Demand forecasting across 5 sales channels
- Stockout/overstock alerts

**Success Criteria**: Zero critical stockouts, <10% inventory write-offs

### Secondary Users

#### 4. Executives/Stakeholders
**Role**: Strategic oversight, business performance monitoring
**Needs**:
- High-level KPI dashboards
- Trend analysis and business intelligence
- Scenario modeling and what-if analysis

**Success Criteria**: Real-time business insights, data-driven decision making

#### 5. System Administrators
**Role**: User management, system configuration, integration management
**Needs**:
- Role-based access control (RBAC)
- API integration configuration (Xero, Shopify, Amazon, Unleashed)
- Audit logging and compliance

**Success Criteria**: 99.9% system availability, zero security incidents

---

## Core Features & Capabilities

### 1. Dashboard & Visualization ✅ **IMPLEMENTED**

**Description**: Modern, responsive dashboard with real-time updates via Server-Sent Events (SSE)

**Features**:
- ✅ Responsive 12-column grid layout with drag-and-drop widgets
- ✅ Real-time data updates (SSE integration)
- ✅ 7+ core widgets: KPI Strip, Demand Forecast, Working Capital, Financial Reports
- ✅ Dark/Light theme support with user preference persistence
- ✅ Keyboard shortcuts for navigation (g+o, g+f, etc.)
- ✅ Mobile-optimized responsive design
- ✅ Edit mode for dashboard customization

**Acceptance Criteria**:
- Dashboard loads in <3 seconds
- Real-time updates within 5 seconds
- Support for 100+ concurrent users
- 99.9% uptime

---

### 2. Working Capital Management ✅ **IMPLEMENTED**

**Description**: Comprehensive financial management with cash conversion cycle optimization

**Features**:
- ✅ Real cash conversion cycle calculations (DSO + DIO - DPO)
- ✅ 30-90 day forecasting with trend analysis
- ✅ Receivables/Payables optimization recommendations
- ✅ Live Xero integration for real financial data
- ✅ Multi-currency support (GBP, EUR, USD)
- ✅ Working capital quick actions (AR collection, AP negotiation)

**Acceptance Criteria**:
- 20% reduction in inventory carrying costs
- 95% service level achievement
- Real-time Xero data sync (<5 min lag)
- Multi-currency calculations accurate to 2 decimal places

---

### 3. Demand Forecasting Engine ✅ **IMPLEMENTED**

**Description**: AI-powered demand prediction with ensemble forecasting models

**Features**:
- ✅ Ensemble forecasting with 4 statistical models
- ✅ Seasonal pattern detection and trend analysis
- ✅ Channel-specific forecasting (Amazon vs Shopify patterns)
- ✅ Confidence intervals for all predictions
- ✅ Historical accuracy tracking and model improvement
- ✅ 9-SKU tracking across 3 regions (UK/EU/USA)

**Acceptance Criteria**:
- Forecast accuracy >85% for short-term predictions
- <30 second forecast generation for 365-day horizon
- Confidence intervals provided for all forecasts
- Channel-specific pattern recognition

---

### 4. Inventory Management System ✅ **IMPLEMENTED**

**Description**: Real-time inventory intelligence with automated optimization

**Features**:
- ✅ Reorder point calculations with lead time analysis
- ✅ Batch optimization (100-1000 units per product)
- ✅ 9-SKU tracking with channel-specific allocation
- ✅ Safety stock calculations based on service levels
- ✅ Multi-location inventory (own warehouses + FBA centers)
- ✅ Live Shopify sync for real-time stock levels

**Acceptance Criteria**:
- Zero critical stockouts
- <10% inventory write-offs
- 20% reduction in inventory carrying costs
- Real-time stock sync across all channels

---

### 5. External API Integrations ⏳ **PARTIAL** - EPIC-002 Focus

**Description**: Live data integration with external platforms

**Current Status**:
- ✅ **Xero Financial Integration**: Operational (BMAD-MOCK-001 complete)
- ⏳ **Shopify Multi-Store**: Framework ready, needs final integration (BMAD-MOCK-002 next)
- ⏳ **Amazon SP-API**: Infrastructure ready, pending credential configuration
- ⏳ **Unleashed ERP**: Service classes implemented, 40% complete

**Features Required**:
- Real-time order sync from Amazon UK/USA
- Sales data from Shopify UK/EU/USA stores
- Financial data from Xero (AR, AP, P&L)
- Manufacturing data from Unleashed ERP
- Webhook endpoints for real-time updates
- API rate limiting and error handling
- Authentication with OAuth2 flows

**Acceptance Criteria** (EPIC-002):
- 99.5% API integration uptime
- <5 minute data synchronization lag
- Zero data integrity violations
- <1% API call failure rate
- Graceful fallback when APIs unavailable (503 with setup instructions)

---

### 6. Production Scheduling & Resource Management ⏳ **PENDING**

**Description**: Optimized production scheduling with constraint solving

**Features Required**:
- Production schedules optimized using constraint solving
- Resource capacity constraints respected
- Due date commitments prioritized
- Real-time schedule updates
- Resource utilization maximization

**Acceptance Criteria**:
- >90% on-time delivery performance
- >85% average resource utilization
- <1 hour schedule optimization time
- Zero infeasible schedules generated

---

### 7. Financial Reporting & P&L Analysis ✅ **IMPLEMENTED**

**Description**: Real-time financial analysis with live Xero data

**Features**:
- ✅ Month-over-month P&L tracking
- ✅ Gross margin analysis by product/market
- ✅ Revenue and expense categorization
- ✅ Multi-currency reporting
- ✅ Performance trend analysis
- ⏳ Export capabilities (CSV, Excel, PDF)

**Acceptance Criteria**:
- Real-time P&L data from Xero
- 100% accurate profit margin calculations
- Multi-currency support with proper conversion
- Reports generate in <30 seconds

---

### 8. Import/Export System ✅ **PHASE 2 COMPLETE**

**Description**: Enterprise-grade async job processing for data import/export

**Features**:
- ✅ CSV/XLSX/JSON import/export with validation
- ✅ BullMQ queues with Redis backend
- ✅ RESTful API routes with RBAC
- ✅ Retry logic: 3 attempts with exponential backoff
- ✅ Progress tracking with real-time status updates
- ✅ Schema-based validation with detailed error reporting
- ✅ MFA-protected admin operations
- ✅ Comprehensive audit logging

**Acceptance Criteria**:
- Process 10,000 records in <5 minutes
- 100% data validation accuracy
- Support files up to 100MB
- Zero data corruption incidents

---

## Technical Requirements

### Frontend Stack ✅ **IMPLEMENTED**
- **Framework**: React 18 with Vite 4 build system
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: Zustand for local state, TanStack Query for server state
- **Real-time**: Server-Sent Events (SSE) with automatic query invalidation
- **Routing**: React Router v6
- **Grid System**: react-grid-layout with responsive breakpoints
- **Icons**: Heroicons
- **Charts**: Recharts for data visualization

### Backend Stack ✅ **IMPLEMENTED**
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: Render PostgreSQL with pgvector extension
- **ORM**: Prisma (type-safe database operations)
- **Authentication**: Clerk (RBAC with admin/manager/operator/viewer roles)
- **Real-time**: SSE + WebSocket for live updates
- **Queue**: BullMQ with Redis for async job processing

### External Integrations ⏳ **IN PROGRESS**
- **Xero API**: OAuth2 for financial data (✅ OPERATIONAL)
- **Shopify API**: Multi-store management (⏳ FRAMEWORK READY)
- **Amazon SP-API**: Order and inventory sync (⏳ PENDING CONFIG)
- **Unleashed ERP**: Manufacturing resource planning (⏳ 40% COMPLETE)

### Deployment Infrastructure ✅ **IMPLEMENTED**
- **Platform**: Render (cloud-based deployment)
- **Environments**: Development, Testing, Production
- **CI/CD**: Auto-deployment on git push to respective branches
- **Database**: Render PostgreSQL with automated backups
- **Caching**: Redis for sessions and queue management
- **Monitoring**: Application performance monitoring (APM)

---

## Quality Standards

### Code Quality ⏳ **IN PROGRESS** - EPIC-004 Focus
- **Test Coverage**: >90% unit test coverage (current: ~40%)
- **Integration Tests**: 100% critical path coverage
- **E2E Tests**: All major user workflows validated
- **No Mock Data**: Zero hardcoded fallback data in production code ⏳ **EPIC-002**
- **Error Handling**: All API calls wrapped in try/catch with proper error responses
- **Type Safety**: TypeScript/JSDoc for all functions
- **Code Reviews**: All changes reviewed before merge

### Architecture Compliance ⏳ **EPIC-002 FOCUS**
- ❌ **No Mock Data in Production**: Currently violated in 3 files
  - `api/routes/financial.js` (Math.random())
  - `api/routes/financial.js` (hardcoded P&L summary)
  - `server/api/working-capital.js` (fallback data)
- ✅ **Error Handling**: Proper try/catch and 503 error responses
- ⏳ **Type Safety**: Partial TypeScript/JSDoc coverage
- ✅ **API Fallbacks**: Graceful degradation implemented

### Performance Standards ✅ **IMPLEMENTED**
- **Dashboard Load Time**: <3 seconds
- **API Response Time**: <2 seconds average
- **Real-time Updates**: <5 seconds propagation
- **Forecast Generation**: <30 seconds for 365-day horizon
- **Concurrent Users**: Support for 100+ (target: 500+)
- **System Availability**: 99.9%

### Security Standards ✅ **IMPLEMENTED**
- **Authentication**: Clerk integration with RBAC
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Password Security**: Industry-standard hashing algorithms
- **API Security**: Authentication required for all endpoints
- **Audit Logging**: All system access and changes captured
- **GDPR Compliance**: Privacy regulations followed for EU users

---

## Success Metrics

### Business Metrics
- **Operational Efficiency**: 50% reduction in planning time
- **Financial Performance**: 20% reduction in inventory carrying costs
- **Forecast Accuracy**: >85% for short-term predictions
- **Service Levels**: 95% achievement, zero critical stockouts
- **User Adoption**: 90% adoption rate across all user roles

### Technical Metrics
- **System Availability**: 99.9% uptime
- **API Integration Uptime**: 99.5%
- **Data Sync Lag**: <5 minutes
- **Test Coverage**: >90% unit tests
- **Code Quality**: Zero critical bugs in production
- **Performance**: <3s dashboard load, <2s API response

### User Experience Metrics
- **User Satisfaction**: 95% satisfaction score
- **Task Completion**: <5 clicks to reach any feature
- **Onboarding Time**: <1 hour for new users
- **Task Abandonment**: <10% rate
- **Accessibility**: 100% WCAG 2.1 AA compliance

---

## Non-Functional Requirements

### Scalability
- Support for 500+ concurrent users (current: 100+)
- Horizontal scaling capability
- Database optimized for 10,000+ products
- Support for 1,000+ concurrent manufacturing jobs

### Reliability
- 99.9% system availability
- Automated backup and disaster recovery
- <5 minute incident detection time
- <15 minute mean time to resolution
- Zero data loss incidents

### Maintainability
- Modular architecture with clear separation of concerns
- Comprehensive documentation for all APIs
- Code quality standards enforced (ESLint, Prettier)
- Automated testing for regression prevention
- Version control with git branching strategy

### Compliance
- GDPR compliance for EU users
- SOC 2 Type II compliance for enterprise customers
- Data retention policies enforced
- Right to erasure implemented
- Regular security assessments conducted

---

## Dependencies & Constraints

### External Dependencies
- **Xero API**: Financial data source (dependency: OAuth connection)
- **Shopify API**: Multi-store sales data (dependency: Store credentials)
- **Amazon SP-API**: Order and inventory data (dependency: SP-API credentials)
- **Unleashed ERP**: Manufacturing data (dependency: API access)
- **Clerk**: Authentication provider (dependency: Clerk account)
- **Render**: Hosting platform (dependency: Render account)

### Technical Constraints
- Node.js v18+ required for server
- PostgreSQL with pgvector extension for database
- Redis required for caching and queue management
- Internet connection required for external API integrations
- Minimum browser: Chrome 90+, Firefox 88+, Safari 14+

### Business Constraints
- Must support 3 markets (UK, EU, USA) with 5 sales channels
- Must handle 9 SKUs (3 products × 3 regions)
- Must support multi-currency (GBP, EUR, USD)
- Must maintain compliance with regional regulations
- Must integrate with existing business processes

---

## Risks & Mitigation Strategies

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| External API outages | High | Medium | Three-tier fallback strategy (real → estimates → setup instructions) |
| Database performance degradation | High | Low | Query optimization, indexing, connection pooling |
| Real-time update latency | Medium | Low | SSE optimization, caching strategy |
| Security vulnerabilities | Critical | Low | Regular security audits, automated scanning, patch management |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Scope creep during mock data elimination | Medium | High | Strict scope definition in EPIC-002, defer new features to future sprints |
| User adoption resistance | Medium | Medium | Comprehensive training, gradual rollout, user feedback loops |
| Data migration errors | High | Low | Staged migration, validation at each step, rollback procedures |
| Regulatory compliance changes | Medium | Low | Regular compliance reviews, flexible architecture |

---

## Current Project Status

### What's Working (75% Functional)
- ✅ Navigation system and UI framework
- ✅ Authentication with Clerk (RBAC)
- ✅ Working capital management engine
- ✅ Demand forecasting with AI models
- ✅ Inventory management system
- ✅ Financial reports and P&L analysis
- ✅ Xero financial integration (BMAD-MOCK-001 ✅)
- ✅ Shopify multi-store framework
- ✅ Import/export system (Phase 2 complete)
- ✅ Deployment infrastructure (Render)

### What's Pending (25% Remaining)
- ⏳ **EPIC-002**: Eliminate mock data from 3 remaining files
- ⏳ Shopify sales data integration (BMAD-MOCK-002)
- ⏳ Amazon SP-API configuration and testing
- ⏳ Unleashed ERP integration completion
- ⏳ **EPIC-003**: Frontend empty state handling
- ⏳ **EPIC-004**: Test coverage improvement (40% → 90%)
- ⏳ **EPIC-005**: Production deployment readiness

---

## Implementation Roadmap

### Phase 2: PLANNING ✅ (This Document)
- ✅ Product Requirements Document (PRD) - This document
- ⏳ Epic breakdown (epics.md) - Next
- ⏳ Feature roadmap (roadmap.md) - Following

### Phase 3: SOLUTIONING ⏳ NEXT
- ⏳ Solution architecture document
- ⏳ Technical specifications per epic (JIT)
- ⏳ Architecture decision records (ADRs)

### Phase 4: IMPLEMENTATION ⏳ CURRENT SPRINT
- ⏳ **EPIC-002**: Eliminate mock data (Stories 1-7)
  - ✅ BMAD-MOCK-001: Xero integration complete
  - ⏳ BMAD-MOCK-002: Shopify integration (NEXT)
  - ⏳ BMAD-MOCK-003-007: Remaining integrations
- ⏳ **EPIC-003**: Frontend polish and UX
- ⏳ **EPIC-004**: Test coverage and quality
- ⏳ **EPIC-005**: Production deployment

---

## Appendices

### Appendix A: Glossary

- **SKU**: Stock Keeping Unit - Unique product identifier
- **DSO**: Days Sales Outstanding - Accounts receivable collection period
- **DPO**: Days Payable Outstanding - Accounts payable payment period
- **DIO**: Days Inventory Outstanding - Inventory holding period
- **FBA**: Fulfillment by Amazon - Amazon's fulfillment service
- **RBAC**: Role-Based Access Control - Permission system
- **SSE**: Server-Sent Events - Real-time update technology
- **SP-API**: Selling Partner API - Amazon's integration API

### Appendix B: References

- **Business Model**: `context/business-requirements/sentia_business_model.md`
- **Acceptance Criteria**: `context/business-requirements/acceptance_criteria.md`
- **User Workflows**: `context/business-requirements/user_workflows.md`
- **Development Guidelines**: `CLAUDE.md`
- **BMAD Implementation**: `BMAD-METHOD-V6A-IMPLEMENTATION.md`

---

**Document Status**: ✅ COMPLETE
**Next Action**: Create `bmad/planning/epics.md` (Epic breakdown)
**Framework**: BMAD-METHOD v6a Phase 2 (Planning)
**Generated**: 2025-10-19
**Maintained By**: Development Team
