# Sentia Manufacturing Dashboard - Codebase Index

*Generated: 2025-09-05*  
*Total Issues Fixed: 387 (reduced from 2,677 to 2,290 ESLint issues)*

## 📊 **Project Overview**
- **Type**: Full-stack Node.js Manufacturing Dashboard
- **Frontend**: React 18 + Vite 4 + Tailwind CSS
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: Neon PostgreSQL
- **Authentication**: Clerk
- **Deployment**: Railway (Auto-deployment)

## 🏗️ **Architecture Summary**

### **Frontend (React + Vite)**
- **Port**: 3000 (development)
- **Build**: Static files served by Express in production
- **State Management**: Zustand + TanStack Query
- **Styling**: Tailwind CSS + shadcn/ui components
- **Real-time**: Server-Sent Events (SSE)

### **Backend (Node.js + Express)**
- **Port**: 5000 (API server)
- **APIs**: REST endpoints with authentication
- **Database**: Prisma ORM with Neon PostgreSQL
- **Queue**: Disabled (Redis compatibility issues)
- **Logging**: Structured logging with Winston

### **Key Services**
- **Manufacturing Metrics Service**: Real data processing (NO MOCK DATA)
- **Working Capital Service**: Financial calculations
- **Data Import Service**: CSV/Excel file processing
- **Agent Services**: AI-powered automation

## 📁 **Directory Structure**

```
├── api/                          # API route handlers
│   ├── agent.js                  # Agent orchestration routes
│   ├── dataQuality.js           # Data quality monitoring
│   ├── forecasting.js           # Demand forecasting API
│   ├── models.js                # Model registry API
│   ├── optimization.js          # Optimization algorithms
│   └── xero.js                  # Xero integration API
├── context/                      # Documentation & specifications
│   ├── api-documentation/       # External API docs
│   ├── business-requirements/   # Business logic specs
│   ├── technical-specifications/# Tech stack documentation
│   └── ui-components/           # UI/UX specifications
├── database/                     # Database utilities
├── docs/                        # Generated documentation
├── mcp-server/                  # Model Context Protocol server
├── prisma/                      # Prisma schema & migrations
├── public/                      # Static assets
├── scripts/                     # Utility & deployment scripts
├── services/                    # Backend service modules
├── src/                         # Frontend React application
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── pages/                  # Page components
│   ├── services/               # Frontend API services
│   ├── stores/                 # Zustand state stores
│   └── utils/                  # Helper utilities
├── tests/                      # Test files (unit, integration, e2e)
├── server.js                   # Main Express server
└── package.json               # Dependencies & scripts
```

## 🔧 **Key Files & Components**

### **Core Server Files**
- `server.js` - Main Express server with API routes
- `services/manufacturingMetricsService.js` - **NEW**: Real data processing service
- `services/auth/` - Authentication & authorization
- `services/db/` - Database connection & operations
- `services/logger.js` - Structured logging

### **Frontend Core**
- `src/App.jsx` - Main React application
- `src/pages/Dashboard.jsx` - Enhanced production dashboard
- `src/pages/AIDashboard.jsx` - AI-powered dashboard
- `src/components/widgets/` - Dashboard widgets
- `src/stores/` - Zustand state management

### **Configuration**
- `.env` - Environment variables (191 lines)
- `eslint.config.js` - **IMPROVED**: ESLint configuration with proper globals
- `vite.config.js` - Vite build configuration
- `prisma/schema.prisma` - Database schema

## 🚀 **Recent Improvements (This Session)**

### **1. Critical Server Fixes**
- ✅ Fixed HTTP headers error (`ERR_HTTP_HEADERS_SENT`)
- ✅ Disabled problematic queue service (Redis version issues)
- ✅ Improved response time middleware

### **2. Code Quality Improvements**
- ✅ Reduced ESLint issues from 2,677 to 2,290 (387 issues fixed)
- ✅ Fixed unused imports in API files
- ✅ Added proper globals for Node.js, Browser, and Test environments
- ✅ Enhanced ESLint configuration

### **3. Codebase Cleanup**
- ✅ Removed duplicate agent files (32+ files)
- ✅ Removed duplicate HTML dashboards
- ✅ Removed unused database backup folder
- ✅ Cleaned up root directory

### **4. New Manufacturing Service Integration**
- ✅ Added `manufacturingMetricsService.js` (enforces NO MOCK DATA rule)
- ✅ Integrated with backend API endpoints:
  - `GET /api/metrics/current`
  - `GET /api/metrics/historical`
  - `POST /api/metrics/upload`
  - `GET /api/metrics/all`
  - `GET /api/metrics/sources`

## 📋 **Development Commands**

### **Frontend**
- `npm run dev:client` - Start React dev server (port 3000)
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build

### **Backend**
- `npm run dev:server` - Start Express API server (port 5000)
- `npm start` - Production server start

### **Full Stack**
- `npm run dev` - Start both frontend and backend
- `npm install` - Install all dependencies

### **Quality & Testing**
- `npm run lint` - Run ESLint (2,290 issues remaining)
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm test` - Run Vitest unit tests
- `npm run test:e2e` - Run Playwright E2E tests

## 🗄️ **Database Schema**

### **Core Models**
- **Users** - Clerk authentication & role management
- **Financial Models** - Working capital, AR/AP, cash flow
- **Manufacturing** - Jobs, resources, capacity planning  
- **Dashboard** - User layouts, widget preferences

### **Environment Configuration**
- **Development**: Neon PostgreSQL (development branch)
- **Test**: Neon PostgreSQL (test branch)
- **Production**: Neon PostgreSQL (production branch)

## 🔐 **Authentication & Security**

### **Clerk Integration**
- Role-based access control (admin/manager/operator/viewer)
- 20+ granular permissions
- Seamless frontend/backend integration

### **Security Measures**
- Express rate limiting
- CORS configuration
- Input validation with express-validator
- Security-focused ESLint rules

## 🔄 **Real-time Features**

### **Server-Sent Events (SSE)**
- Live data updates
- Job status monitoring
- 15+ event types
- Automatic query invalidation

## 🎯 **Key Business Rules**

### **NO MOCK DATA Policy**
- ✅ All manufacturing metrics use real data only
- ✅ Data sources: APIs, CSV/Excel uploads, external integrations
- ✅ Enforced by `manufacturingMetricsService.js`
- ✅ Error thrown if no real data available

## 📊 **Current Status**

### **Health Check**
- **Frontend**: ✅ Running (port 3000)
- **Backend**: ⚠️ Intermittent (Redis/DB connection issues)
- **Database**: ✅ Connected (Neon PostgreSQL)
- **MCP Server**: ✅ Running (port 3001)
- **Queue Service**: ❌ Disabled (Redis version mismatch)

### **Remaining Issues**
- Redis version needs upgrade (current: 3.0.504, required: 5.0.0+)
- Some database connection timeouts
- 654 ESLint errors remaining (mostly console statements and security warnings)

## 🏷️ **Branch Strategy**
- `development` - Primary development (default)
- `test` - UAT environment  
- `production` - Live environment
- **Auto-deployment**: All branches deploy to Railway with separate databases

## 📚 **Documentation**
- `CLAUDE.md` - Development guidance & commands
- `context/` - Comprehensive context documentation
- `docs/` - Generated API documentation
- `README.md` - Project setup & overview

## 🔍 **Search Patterns**

### **Find Components**
```bash
find src/components -name "*.jsx" | grep -i dashboard
```

### **Find Services**
```bash
find services -name "*.js" | grep -v test
```

### **Find APIs**
```bash
grep -r "app\.get\|app\.post" server.js api/
```

---

*This index was generated after comprehensive codebase analysis and cleanup. The project is now significantly more maintainable with reduced technical debt and improved code quality.*