# SENTIA MANUFACTURING DASHBOARD - TECHNICAL SPECIFICATION

## Complete System Architecture & Implementation Details

### Version 1.0.10 | September 24, 2025

---

## QUICK START GUIDE FOR DEVELOPERS

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/The-social-drink-company/sentia-manufacturing-dashboard.git
cd sentia-manufacturing-dashboard

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.template .env
# Edit .env with your configuration

# 4. Start development servers
npm run dev

# 5. Access application
# Frontend: http://localhost:3000 or http://localhost:5173
# Backend API: http://localhost:5000
# MCP Server: http://localhost:3001 (if running)
```

---

## COMPLETE FEATURE INVENTORY

### 📊 DASHBOARDS (5 Variations)

```javascript
const dashboards = {
  '/dashboard': {
    name: 'Main Dashboard',
    components: ['KPIStrip', 'GridLayout', 'Charts', 'Widgets'],
    features: ['Real-time updates', 'Drag-drop layout', 'Export data'],
  },
  '/dashboard/enhanced': {
    name: 'Enhanced Dashboard',
    components: ['AdvancedGrid', 'SSEIntegration', 'CustomWidgets'],
    features: ['Server-sent events', 'Advanced filtering', 'Custom KPIs'],
  },
  '/dashboard/enterprise': {
    name: 'Enterprise Dashboard',
    components: ['RoleBasedWidgets', 'MultiTenant', 'Analytics'],
    features: ['Role-based access', 'Department views', 'Drill-down'],
  },
  '/dashboard/world-class': {
    name: 'World-Class Dashboard',
    components: ['AI_Insights', '3D_Visualizations', 'Predictive'],
    features: ['AI recommendations', '3D charts', 'Forecasting'],
  },
  '/dashboard/simple': {
    name: 'Simple Dashboard',
    components: ['BasicKPIs', 'SimpleCharts'],
    features: ['Lightweight', 'Mobile-optimized', 'Fast loading'],
  },
}
```

### 💰 FINANCIAL MANAGEMENT (7 Pages)

```javascript
const financialPages = {
  '/working-capital': {
    features: [
      'Current working capital metrics',
      'Cash Conversion Cycle tracking',
      'Accounts receivable/payable',
      'Inventory turnover analysis',
    ],
  },
  '/cash-runway': {
    // NEW
    features: [
      'Visual cash depletion timeline',
      '30/60/90/120/180 day coverage',
      'Burn rate calculator',
      'Expense breakdown',
      'Scenario modeling with sliders',
    ],
  },
  '/funding-calculator': {
    // NEW
    features: [
      'Sustain/Growth/Aggressive scenarios',
      'Unit economics (LTV/CAC)',
      'Growth funding requirements',
      'Funding mix optimization',
      '24-month projections',
    ],
  },
  '/working-capital-optimizer': {
    // NEW
    features: [
      'Interactive DSO/DPO/DIO controls',
      'Industry benchmarking',
      'Cash impact visualization',
      'Optimization recommendations',
      'Action items by priority',
    ],
  },
  '/what-if': {
    features: [
      'Scenario planning',
      'Sensitivity analysis',
      'Monte Carlo simulation',
      'Risk assessment',
    ],
  },
  '/analytics': {
    features: [
      'Financial reports',
      'Custom report builder',
      'Export to Excel/PDF',
      'Scheduled reports',
    ],
  },
  '/ai-insights': {
    features: [
      'AI-powered recommendations',
      'Anomaly detection',
      'Predictive analytics',
      'Natural language queries',
    ],
  },
}
```

### 🏭 MANUFACTURING OPERATIONS (6 Pages)

```javascript
const manufacturingPages = {
  '/production': {
    features: [
      'Real-time production tracking',
      'Job scheduling',
      'Resource allocation',
      'OEE monitoring',
      'Downtime analysis',
    ],
  },
  '/quality': {
    features: [
      'Quality metrics dashboard',
      'Defect tracking',
      'SPC charts',
      'Root cause analysis',
      'Compliance reporting',
    ],
  },
  '/inventory': {
    features: [
      'Stock levels monitoring',
      'Reorder point optimization',
      'ABC analysis',
      'Stock movements',
      'Warehouse visualization',
    ],
  },
  '/supply-chain': {
    features: [
      'Supplier performance',
      'Lead time tracking',
      'Risk assessment',
      'Order management',
      'Logistics monitoring',
    ],
  },
  '/forecasting': {
    features: [
      'Demand forecasting',
      'Seasonal analysis',
      'ML-based predictions',
      'Forecast accuracy',
      'Collaborative planning',
    ],
  },
  '/analytics/real-time': {
    features: [
      'Live production metrics',
      'Real-time alerts',
      'Performance monitoring',
      'Bottleneck detection',
    ],
  },
}
```

### 📱 MOBILE & SPECIALIZED (3 Pages)

```javascript
const mobilePages = {
  '/mobile': {
    features: [
      'Touch-optimized interface',
      'Responsive design',
      'Offline capability',
      'Progressive Web App',
    ],
  },
  '/mobile-floor': {
    features: [
      'Floor worker interface',
      'Task management',
      'Quality reporting',
      'QR code scanning',
      'Voice commands',
    ],
  },
  '/landing': {
    features: ['3D animated hero', 'Feature showcase', 'Interactive demos', 'CTA buttons'],
  },
}
```

### ⚙️ ADMINISTRATION (3 Pages)

```javascript
const adminPages = {
  '/admin': {
    features: [
      'User management',
      'Role assignment',
      'Permissions control',
      'Activity logs',
      'System configuration',
    ],
  },
  '/admin/enhanced': {
    features: ['Advanced RBAC', 'Audit trails', 'Batch operations', 'API key management'],
  },
  '/settings': {
    features: [
      'Profile settings',
      'Notification preferences',
      'Theme customization',
      'Export preferences',
    ],
  },
}
```

---

## API ENDPOINT SPECIFICATION

### Complete API Routes

```javascript
// Health & Monitoring
GET  /health                          → System health status
GET  /health/live                     → Liveness probe
GET  /health/ready                    → Readiness probe
GET  /api/status                      → API operational status

// Dashboard Endpoints
GET  /api/dashboard/overview          → Main dashboard data
GET  /api/dashboard/widgets           → Available widgets
GET  /api/dashboard/layout/:userId    → User's saved layout
POST /api/dashboard/layout            → Save layout configuration
GET  /api/dashboard/kpis              → Key performance indicators
GET  /api/dashboard/export            → Export dashboard data

// Working Capital Management
GET  /api/working-capital/overview    → WC metrics summary
GET  /api/working-capital/trends      → Historical trends
GET  /api/working-capital/cash-runway → Cash runway analysis
POST /api/working-capital/optimize    → Run optimization
GET  /api/working-capital/benchmarks  → Industry benchmarks
GET  /api/working-capital/forecast    → WC forecast

// Cash Flow Analysis (NEW)
GET  /api/cash-flow/runway           → Runway calculations
POST /api/cash-flow/scenario         → Scenario analysis
GET  /api/cash-flow/coverage/:days   → Coverage for X days
POST /api/cash-flow/burn-rate        → Calculate burn rate

// Funding Calculator (NEW)
POST /api/funding/calculate          → Calculate funding needs
GET  /api/funding/scenarios          → Pre-built scenarios
POST /api/funding/optimize           → Optimize funding mix
GET  /api/funding/sources            → Available funding sources

// Production Management
GET  /api/production/jobs            → Active production jobs
GET  /api/production/job/:id         → Specific job details
POST /api/production/job             → Create new job
PUT  /api/production/job/:id         → Update job status
GET  /api/production/metrics         → Production KPIs
GET  /api/production/oee             → OEE calculations

// Quality Control
GET  /api/quality/metrics            → Quality KPIs
POST /api/quality/inspection         → Log inspection
GET  /api/quality/defects            → Defect tracking
GET  /api/quality/spc                → SPC chart data
POST /api/quality/rca                → Root cause analysis

// Inventory Management
GET  /api/inventory/levels           → Current stock levels
GET  /api/inventory/movements        → Stock movements
POST /api/inventory/adjustment       → Stock adjustment
GET  /api/inventory/reorder          → Reorder recommendations
POST /api/inventory/optimize         → Optimization analysis

// Supply Chain
GET  /api/supply-chain/suppliers     → Supplier list
GET  /api/supply-chain/performance   → Supplier metrics
GET  /api/supply-chain/orders        → Purchase orders
POST /api/supply-chain/order         → Create PO
GET  /api/supply-chain/risk          → Risk assessment

// Analytics & Reporting
GET  /api/analytics/forecast         → Demand forecast
POST /api/analytics/what-if          → What-if scenario
GET  /api/analytics/reports          → Available reports
POST /api/analytics/report/generate  → Generate report
GET  /api/analytics/export/:format   → Export data

// AI/ML Endpoints
POST /api/ai/query                   → Natural language query
GET  /api/ai/insights                → AI insights
POST /api/ai/predict                 → Predictive analysis
GET  /api/ai/recommendations         → AI recommendations

// Real-time & WebSocket
GET  /api/events                     → Server-Sent Events
WS   /ws/mcp                         → WebSocket for AI
WS   /ws/production                  → Production updates
WS   /ws/alerts                      → Real-time alerts

// User & Authentication
GET  /api/users                      → User list (admin)
GET  /api/user/:id                   → User details
PUT  /api/user/:id                   → Update user
POST /api/user/preferences           → Save preferences
GET  /api/user/activity              → Activity log

// System Administration
GET  /api/admin/logs                 → System logs
GET  /api/admin/metrics              → System metrics
POST /api/admin/backup               → Trigger backup
GET  /api/admin/config               → Configuration
PUT  /api/admin/config               → Update config
```

---

## COMPONENT ARCHITECTURE

### Core Component Structure

```
src/components/
├── AI/
│   ├── SentiaAIChatbot.jsx         # AI assistant interface
│   └── AIInsightsPanel.jsx         # AI recommendations
├── analytics/
│   ├── WhatIfAnalysis.jsx          # Scenario modeling
│   ├── PredictiveChart.jsx         # Forecasting charts
│   └── SensitivityAnalysis.jsx    # Sensitivity testing
├── auth/
│   └── clerk-mock.js                # Mock authentication
├── dashboard/
│   ├── DashboardGrid.jsx           # Grid layout system
│   ├── KPIStrip.jsx                # KPI indicators
│   ├── Widget.jsx                  # Base widget component
│   └── widgets/
│       ├── ProductionWidget.jsx    # Production metrics
│       ├── QualityWidget.jsx       # Quality metrics
│       ├── InventoryWidget.jsx     # Inventory status
│       └── FinancialWidget.jsx     # Financial KPIs
├── layout/
│   ├── Header.jsx                  # Top navigation
│   ├── Sidebar.jsx                 # Side navigation
│   ├── Footer.jsx                  # Footer
│   └── Layout.jsx                  # Main layout wrapper
├── ui/
│   ├── Button.jsx                  # Button component
│   ├── Card.jsx                    # Card container
│   ├── Modal.jsx                   # Modal dialog
│   ├── Table.jsx                   # Data table
│   ├── Chart.jsx                   # Chart wrapper
│   └── NotificationSystem.jsx      # Toast notifications
└── WorkingCapital/
    ├── CashFlowChart.jsx           # Cash flow visualization
    ├── DSO_DPO_DIO.jsx            # Metrics controls
    ├── WorkingCapitalMetrics.jsx   # Metrics display
    └── OptimizationPanel.jsx       # Optimization tools
```

### State Management Architecture

```javascript
// Zustand Store Structure
stores/
├── layoutStore.js        # UI layout state
├── dashboardStore.js     # Dashboard configuration
├── userStore.js         # User preferences
├── workingCapitalStore.js # Financial metrics
├── productionStore.js   # Production data
├── inventoryStore.js    # Inventory levels
└── notificationStore.js # Notifications

// Example Store Implementation
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWorkingCapitalStore = create(
  persist(
    (set, get) => ({
      // State
      metrics: {
        dso: 45,
        dpo: 30,
        dio: 60,
        currentAssets: 0,
        currentLiabilities: 0
      },

      // Actions
      updateMetrics: (metrics) => set({ metrics }),

      // Computed
      getCCC: () => {
        const { dso, dpo, dio } = get().metrics
        return dso + dio - dpo
      }
    }),
    {
      name: 'working-capital-storage'
    }
  )
)
```

---

## DATABASE SCHEMA

### Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User Management
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  role            Role      @default(VIEWER)
  department      String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  dashboards      Dashboard[]
  preferences     UserPreference[]
  activityLogs    ActivityLog[]
}

enum Role {
  ADMIN
  MANAGER
  OPERATOR
  VIEWER
}

// Dashboard Configuration
model Dashboard {
  id          String   @id @default(cuid())
  userId      String
  name        String
  layout      Json     // Grid layout configuration
  widgets     Json     // Widget settings
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
}

// Working Capital
model WorkingCapital {
  id                  String   @id @default(cuid())
  date                DateTime @default(now())
  currentAssets       Float
  currentLiabilities  Float
  inventory           Float
  accountsReceivable  Float
  accountsPayable     Float
  cash                Float
  dso                 Int      // Days Sales Outstanding
  dpo                 Int      // Days Payable Outstanding
  dio                 Int      // Days Inventory Outstanding
  ccc                 Int      // Cash Conversion Cycle
  createdAt           DateTime @default(now())

  @@index([date])
}

// Cash Flow Analysis
model CashFlow {
  id              String   @id @default(cuid())
  date            DateTime
  cashInflow      Float
  cashOutflow     Float
  netCashFlow     Float
  openingBalance  Float
  closingBalance  Float
  category        String
  description     String?
  createdAt       DateTime @default(now())

  @@index([date])
}

// Production Jobs
model ProductionJob {
  id              String   @id @default(cuid())
  jobNumber       String   @unique
  productId       String
  productName     String
  quantity        Int
  plannedQuantity Int
  status          JobStatus
  priority        Priority
  startDate       DateTime
  dueDate         DateTime
  completedDate   DateTime?
  machineId       String?
  operatorId      String?
  setupTime       Int?     // minutes
  runTime         Int?     // minutes
  downtime        Int?     // minutes
  oee             Float?   // Overall Equipment Effectiveness
  qualityRate     Float?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  qualityChecks   QualityCheck[]

  @@index([status])
  @@index([startDate])
}

enum JobStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  ON_HOLD
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

// Quality Control
model QualityCheck {
  id              String   @id @default(cuid())
  jobId           String
  checkType       String
  result          QualityResult
  defectCount     Int      @default(0)
  defectType      String?
  notes           String?
  inspectorId     String
  inspectedAt     DateTime @default(now())

  job             ProductionJob @relation(fields: [jobId], references: [id])

  @@index([jobId])
}

enum QualityResult {
  PASS
  FAIL
  CONDITIONAL
}

// Inventory
model Inventory {
  id              String   @id @default(cuid())
  sku             String   @unique
  name            String
  description     String?
  category        String
  unit            String
  currentStock    Float
  reorderPoint    Float
  reorderQuantity Float
  safetyStock     Float
  location        String
  value           Float
  lastUpdated     DateTime @updatedAt

  movements       StockMovement[]

  @@index([sku])
  @@index([category])
}

model StockMovement {
  id              String   @id @default(cuid())
  inventoryId     String
  type            MovementType
  quantity        Float
  fromLocation    String?
  toLocation      String?
  reference       String?  // PO number, job number, etc.
  reason          String?
  performedBy     String
  performedAt     DateTime @default(now())

  inventory       Inventory @relation(fields: [inventoryId], references: [id])

  @@index([inventoryId])
  @@index([performedAt])
}

enum MovementType {
  RECEIPT
  ISSUE
  TRANSFER
  ADJUSTMENT
  RETURN
}

// AI Insights
model AIInsight {
  id              String   @id @default(cuid())
  type            InsightType
  category        String
  title           String
  content         String   @db.Text
  confidence      Float
  impact          String?  // HIGH, MEDIUM, LOW
  recommendations Json?
  metadata        Json?
  embedding       Float[]  // pgvector embedding
  status          InsightStatus @default(NEW)
  createdAt       DateTime @default(now())
  acknowledgedAt  DateTime?
  acknowledgedBy  String?

  @@index([type])
  @@index([status])
  @@index([createdAt])
}

enum InsightType {
  ANOMALY
  PREDICTION
  RECOMMENDATION
  WARNING
  OPTIMIZATION
}

enum InsightStatus {
  NEW
  ACKNOWLEDGED
  IMPLEMENTED
  DISMISSED
}

// Activity Logs
model ActivityLog {
  id          String   @id @default(cuid())
  userId      String
  action      String
  entity      String   // Table/model affected
  entityId    String?  // Record ID affected
  details     Json?
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([timestamp])
}

// User Preferences
model UserPreference {
  id          String   @id @default(cuid())
  userId      String
  key         String
  value       Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])

  @@unique([userId, key])
}
```

---

## DEPLOYMENT ARCHITECTURE

### Production Infrastructure

```yaml
# Complete deployment configuration

# Primary: Render
services:
  - name: sentia-manufacturing-dashboard
    type: web
    runtime: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /health
    envVars:
      - NODE_ENV=production
      - DATABASE_URL=@sentia-db
      - REDIS_URL=@sentia-redis

  - name: mcp-server
    type: web
    runtime: node
    plan: starter
    buildCommand: cd mcp-server && npm install
    startCommand: cd mcp-server && node enterprise-server-simple.js
    healthCheckPath: /health

databases:
  - name: sentia-db
    plan: starter
    extensions: [pgvector]

redis:
  - name: sentia-redis
    plan: starter
# Backup: Railway
# railway.json configuration available
```

### Environment Configuration

```bash
# Complete .env.template

# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@host/db?schema=public
REDIS_URL=redis://default:pass@host:port

# Authentication (Mocked)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# External APIs
XERO_CLIENT_ID=xxx
XERO_CLIENT_SECRET=xxx
XERO_TENANT_ID=xxx
SHOPIFY_API_KEY=xxx
SHOPIFY_API_SECRET=xxx
SHOPIFY_STORE_URL=xxx
AMAZON_SP_API_KEY=xxx
AMAZON_SP_API_SECRET=xxx
UNLEASHED_API_ID=xxx
UNLEASHED_API_KEY=xxx

# AI Services
ANTHROPIC_API_KEY=xxx
OPENAI_API_KEY=xxx
GOOGLE_AI_API_KEY=xxx
MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
MCP_JWT_SECRET=xxx

# Frontend Configuration
VITE_API_BASE_URL=/api
VITE_MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_APP_VERSION=1.0.10

# Monitoring
SENTRY_DSN=xxx
LOG_LEVEL=info
ENABLE_MONITORING=true

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_MOBILE_APP=true
ENABLE_REAL_TIME_UPDATES=true
ENABLE_ADVANCED_ANALYTICS=true
```

---

## TESTING SPECIFICATIONS

### Test Suite Structure

```javascript
// Complete test configuration

// vitest.config.js
export default {
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
      threshold: {
        branches: 70,
        functions: 70,
        lines: 80,
        statements: 80
      }
    }
  }
}

// Test categories
tests/
├── unit/                 # Unit tests
│   ├── components/      # Component tests
│   ├── hooks/          # Hook tests
│   ├── utils/          # Utility tests
│   └── services/       # Service tests
├── integration/         # Integration tests
│   ├── api/           # API endpoint tests
│   ├── database/      # Database tests
│   └── workflows/     # User workflow tests
└── e2e/                # End-to-end tests
    ├── auth.spec.js   # Authentication flow
    ├── dashboard.spec.js # Dashboard functionality
    ├── financial.spec.js # Financial features
    └── production.spec.js # Production features
```

---

## CRITICAL FILES & LOCATIONS

### Essential Files for Development

```
Root Files:
- package.json           # Dependencies and scripts
- vite.config.js        # Vite configuration
- server.js             # Main backend server
- server-fixed.js       # Production server
- .env.template         # Environment template
- CLAUDE.md            # Development guidelines
- DEVELOPER_HANDOVER.md # This document

Source Files:
- src/App.jsx          # Main React application
- src/main.jsx         # Application entry point
- src/index.css        # Global styles

Configuration:
- prisma/schema.prisma # Database schema
- render.yaml          # Render deployment
- railway.json         # Railway deployment

MCP Server:
- mcp-server/enterprise-server-simple.js # AI server
- mcp-server/package.json # MCP dependencies
```

---

## CONTACT & SUPPORT

### Development Team Resources

- **GitHub Repository**: https://github.com/The-social-drink-company/sentia-manufacturing-dashboard
- **Render Dashboard**: https://dashboard.render.com
- **Railway Dashboard**: https://railway.app
- **Documentation**: See `/context` folder for detailed specs

### Key Contacts

- **Technical Issues**: Create GitHub Issue
- **Security Concerns**: See SECURITY.md
- **Deployment Support**: DevOps team

---

**Document Generated**: September 24, 2025
**Version**: 1.0.0
**Status**: Complete Handover Package
