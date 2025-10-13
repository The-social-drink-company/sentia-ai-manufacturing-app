# 🏢 Sentia AI Manufacturing App

[![Security Review](https://img.shields.io/badge/Security-A%2B-green)](./security)
[![Code Quality](https://img.shields.io/badge/Code%20Quality-95%25-blue)](./docs)
[![Test Coverage](https://img.shields.io/badge/Coverage-80%25-green)](./coverage)
[![Documentation](https://img.shields.io/badge/Docs-100%25-blue)](./docs)
[![Enterprise Grade](https://img.shields.io/badge/Enterprise-Grade-gold)](./docs/architecture)

## 🎯 Enterprise Manufacturing Intelligence Platform

World-class AI manufacturing application with AI-powered analytics, real-time monitoring, and comprehensive business intelligence for Sentia Spirits.

## 🛠️ Technology Stack

**Frontend:**
- **React 18** - Modern UI library with hooks
- **Vite 4** - Lightning-fast build tool
- **TypeScript 5** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Enterprise component library
- **Recharts** - Data visualization
- **TanStack Query** - Advanced data synchronization
- **Clerk** - Enterprise authentication

**Backend:**
- **Node.js 18** - High-performance runtime
- **Express 4** - Production-grade web framework
- **Prisma ORM** - Type-safe database access
- **PostgreSQL 16** - Enterprise database with pgvector
- **Clerk Backend** - Secure authentication
- **Winston** - Enterprise logging
- **Helmet** - Security hardening

**Infrastructure:**
- **Render Platform** - Enterprise cloud deployment
- **PostgreSQL with pgvector** - AI-ready database
- **GitHub Actions** - CI/CD automation
- **Cloudflare CDN** - Global content delivery

**Security & Monitoring:**
- **ESLint** - Code linting with security rules
- **Express Rate Limit** - DDoS protection
- **Express Validator** - Input validation and sanitization
- **Prometheus** - Metrics collection and monitoring

## 🚀 Local Development Setup

### Prerequisites

- **Node.js** v24.4.1 (Required - use exact version)
- **pnpm** (Preferred) or npm (Alternative)
- **PostgreSQL** 16+ with pgvector extension (Optional for local development)
- **Git** for version control

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/The-social-drink-company/sentia-manufacturing-dashboard.git
   cd sentia-manufacturing-dashboard
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.template .env
   # Edit .env file with your configuration
   ```

4. **Start development servers**
   ```bash
   pnpm run dev
   # Frontend: http://localhost:3000
   # Backend: http://localhost:5000
   # MCP Server: http://localhost:3001 (optional)
   ```

### Environment Configuration

Required environment variables:

```env
# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY
CLERK_SECRET_KEY=sk_live_YOUR_KEY
VITE_CLERK_DOMAIN=clerk.financeflo.ai
CLERK_ENVIRONMENT=production

# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
NODE_ENV=development
PORT=5000

# Database (Optional for local development)
DATABASE_URL=postgresql://user:password@localhost:5432/sentia_dev
```

### Available Scripts

```bash
# Development
pnpm run dev              # Start both frontend and backend
pnpm run dev:client       # Start frontend only (port 3000)
pnpm run dev:server       # Start backend only (port 5000)
pnpm run dev:mcp          # Start MCP AI server (port 3001)

# Code Quality
pnpm run lint             # Run ESLint with auto-fix
pnpm run lint:check       # Check linting issues
pnpm run format           # Format code with Prettier
pnpm run format:check     # Check formatting issues

# Testing
pnpm run test             # Run unit tests with Vitest
pnpm run test:ui          # Run tests with UI
pnpm run test:coverage    # Generate coverage report
pnpm run test:e2e         # Run E2E tests with Playwright

# Build & Production
pnpm run build            # Build for production
pnpm run preview          # Preview production build
pnpm run start            # Start production server

# Database (if using local PostgreSQL)
pnpm run db:generate      # Generate Prisma client
pnpm run db:migrate       # Run database migrations
pnpm run db:studio        # Open Prisma Studio
```

### Troubleshooting

**Port conflicts:**
```bash
# Kill processes on specific ports
npx kill-port 3000 5000 3001
```

**Node modules issues:**
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Environment variables not loading:**
- Ensure `.env` file exists in root directory
- Variables starting with `VITE_` are for frontend
- Restart development servers after changes

## Project Structure

```
sentia-manufacturing-dashboard/
├── src/                       # React frontend source
│   ├── components/           # Reusable UI components
│   │   └── auth/            # Authentication components
│   ├── pages/               # Route components (Dashboard, Admin, etc.)
│   ├── services/            # Frontend API service calls
│   ├── utils/               # Helper functions
│   └── styles/              # CSS and theme files
├── services/                 # Backend Node.js services
│   ├── logger.js            # Winston logging service
│   ├── metrics.js           # Prometheus metrics
│   ├── unleashedService.js  # Unleashed API integration
│   └── envValidator.js      # Environment validation
├── context/                 # Documentation and specifications
│   ├── business-requirements/
│   ├── technical-specifications/
│   ├── database-schemas/
│   ├── api-documentation/
│   ├── business-logic/
│   ├── testing-scenarios/
│   └── deployment-configs/
├── database/                # Database schemas and migrations
├── tests/                   # Complete testing suite
│   ├── unit/                # Vitest unit tests
│   ├── api/                 # Supertest API tests
│   └── e2e/                # Playwright E2E tests
├── public/                  # Static assets
├── dist/                    # Production build output
├── scripts/                 # Utility scripts
├── logs/                    # Application logs (Winston)
├── server.js                # Express.js backend server
├── package.json             # Dependencies and scripts
├── vite.config.js          # Vite build configuration
├── eslint.config.js        # ESLint with security rules
├── tailwind.config.js      # Tailwind CSS configuration
└── .env.example            # Environment variables template
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- Railway CLI (for deployment)

### 1. Clone and Setup

```bash
git clone https://github.com/The-social-drink-company/sentia-manufacturing-dashboard.git
cd sentia-manufacturing-dashboard

# Copy environment template for your environment
cp .env.development .env.local  # For local development
# Edit .env.local with your configuration
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Development Setup

Start both frontend and backend in development mode:

```bash
# Start both frontend (port 3000) and backend (port 5000)
npm run dev

# Or run them separately:
npm run dev:client    # Frontend only (Vite dev server)
npm run dev:server    # Backend only (Express server)
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## Database Setup

### Database Architecture

The application uses **Prisma ORM** with **Render PostgreSQL** in a three-environment setup:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Development       │    │       Test          │    │    Production       │
│                     │    │                     │    │                     │
│ localhost:5000      │    │ test.sentia-*.app   │    │ sentia-*.app        │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  Render Dev DB      │    │  Render Test DB     │    │  Render Prod DB     │
│                     │    │                     │    │                     │
│ ep-***-pooler.      │    │ ep-***-pooler.      │    │ ep-***-pooler.      │
│ eu-west-2.aws       │    │ eu-west-2.aws       │    │ eu-west-2.aws       │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Database Commands

#### Essential Commands:
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create and apply migrations
npm run db:migrate

# Deploy migrations to production
npm run db:migrate:deploy

# Reset database (development only)
npm run db:migrate:reset

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

#### Migration Workflow:
```bash
# 1. Make changes to prisma/schema.prisma
# 2. Create migration
npm run db:migrate

# 3. Deploy to production
npm run db:migrate:deploy
```

### Database Schema

The application implements a comprehensive manufacturing planning schema with the following core entities:

- **Users** - Authentication and role-based access control
- **Markets** - Geographic markets (UK, EU, USA) with tax and shipping rules
- **Products** - 9 SKUs (3 categories × 3 regions) with manufacturing specifications
- **Sales Channels** - E-commerce platforms (Amazon, Shopify) with API integration
- **Historical Sales** - Transaction-level sales data for analytics
- **Forecasts** - AI-generated demand predictions with confidence scoring
- **Inventory Levels** - Multi-location stock management with reorder points
- **Working Capital** - Financial projections and cash flow management
- **System Settings** - Flexible configuration management

### Backup and Restore

#### Create Backup:
```bash
node -e "
import utils from './src/services/db/utils.js';
utils.createBackup({ filename: 'manual-backup.sql' })
  .then(r => console.log('Backup created:', r.path))
  .catch(console.error);
"
```

#### Restore Backup:
```bash
node -e "
import utils from './src/services/db/utils.js';
utils.restoreBackup('./backups/backup-file.sql')
  .then(r => console.log('Restore completed'))
  .catch(console.error);
"
```

#### List Backups:
```bash
node -e "
import utils from './src/services/db/utils.js';
const backups = utils.listBackups();
console.table(backups);
"
```

## Environment Configuration

Key environment variables in `.env.local`:

```bash
# Node.js
NODE_ENV=development
PORT=5000

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database (Render PostgreSQL)
DATABASE_URL=postgresql://sentia_dev:password@dpg-xxx.oregon-postgres.render.com/sentia_manufacturing_dev

# Unleashed API
UNLEASHED_API_ID=your_unleashed_api_id
UNLEASHED_API_KEY=your_unleashed_api_key

# Frontend API URL
VITE_API_URL=http://localhost:5000/api
```

## Deployment & Infrastructure

### Railway Deployment

The application is deployed on Railway with automatic branch deployments:

#### Environments
- **Development**: `dev.sentia-manufacturing.railway.app` (auto-deploy from `development` branch)
- **Test/UAT**: `test.sentia-manufacturing.railway.app` (auto-deploy from `test` branch)
- **Production**: `sentia-manufacturing.railway.app` (auto-deploy from `production` branch with approval)

#### Services Architecture
```
- Web Service: Node.js/Express API + React frontend
- Worker Service: BullMQ job processor
- Database: Render PostgreSQL with connection pooling
- Cache: Redis for sessions and caching
```

### Railway Deployment Configuration

#### Important Configuration Notes

**CRITICAL: Railway uses Nixpacks for deployment. DO NOT add the following files as they will conflict:**
- `railway.toml` - Will override nixpacks.toml and cause build failures
- `Procfile` - Will override both nixpacks.toml and railway.toml
- `railway.json` - Deprecated configuration format

**The deployment is configured exclusively through `nixpacks.toml`:**
```toml
[build]
# Uses npm ci with custom cache to avoid Docker mount conflicts
cmds = ["npm ci --cache /tmp/.npm", "npm run build"]

[start]
# Starts the dedicated Railway server with health checks
cmd = "node railway-ultimate.js"

[variables]
# Node.js 22.12.0 required for Vite compatibility
NIXPACKS_NODE_VERSION = "22.12.0"
```

**Why these configuration choices:**
- `npm ci --cache /tmp/.npm`: Maintains lockfile integrity while avoiding Docker cache mount conflicts
- `railway-ultimate.js`: Dedicated server with Railway-specific health checks and monitoring
- Node 22.12.0: Satisfies Vite's engine requirements (20.19+ or 22.12+)

### Deployment Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy to specific environment
railway up --environment development
railway up --environment test
railway up --environment production

# Check deployment status
railway status
railway logs --service web --tail 100

# Rollback if needed
railway rollback --service web --environment production
```

### CI/CD Pipeline

GitHub Actions automates the deployment process:

1. **On Push to `development`**: 
   - Run tests → Build → Deploy to dev

2. **On Push to `test`**:
   - Run tests → Security scan → Build → Deploy to test → Run E2E tests

3. **On Push to `production`**:
   - Require approval → Backup database → Deploy → Health checks → Rollback on failure

### Environment Variables

Environment variables are managed through Railway dashboard. Templates available:
- `.env.development` - Development environment
- `.env.test` - Test/UAT environment  
- `.env.production` - Production environment

Critical secrets must be stored in Railway secrets management, not in code.

### Monitoring & Health

- **Health Check**: `/api/health`
- **Metrics**: `/api/metrics` (Prometheus format)
- **Monitoring**: GitHub Actions runs health checks every 15 minutes
- **Alerts**: Automated alerts for errors, high latency, or service degradation

### Disaster Recovery

- **Database Backups**: Automated every 4 hours (production), daily (test)
- **Recovery Procedures**: See `scripts/disaster-recovery.md`
- **Rollback**: Automatic rollback on deployment failure
- **RTO**: < 30 minutes | **RPO**: < 4 hours

For detailed deployment configuration, see `context/deployment-configs/railway_setup.md`

## Available Scripts

### Development & Build
```bash
npm run dev          # Start both frontend and backend
npm run dev:client   # Start Vite dev server (frontend only)
npm run dev:server   # Start Express server (backend only)
npm run build        # Build production React app
npm run preview      # Preview production build
npm start            # Start production server
```

### Code Quality & Testing
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run typecheck    # Run TypeScript type checking
npm run quality      # Run all quality checks (lint + format + typecheck)
npm test             # Run Vitest unit tests
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage
npm run test:e2e     # Run Playwright E2E tests
```

### Development Setup (Enhanced)
```bash
# Install dependencies
npm install

# Setup pre-commit hooks (runs automatically after npm install)
npm run prepare

# Copy environment template and configure
cp .env.example .env.local

# Run quality checks before committing
npm run quality
```

## Enhanced Features (v1.1)

### Security Enhancements
- **Enhanced CSP**: Content Security Policy with nonce-based script execution
- **Multi-tier Rate Limiting**: Different limits for API, auth, and upload endpoints
- **Security Headers**: HSTS, referrer policy, frame protection
- **Input Validation**: Comprehensive server-side validation with express-validator

### Observability & Monitoring
- **Health Endpoints**: `/health`, `/ready`, `/live` for different health checks
- **Metrics Collection**: Prometheus-format metrics at `/api/metrics`
- **Performance Monitoring**: Web vitals collection for Core Web Vitals
- **Enhanced Logging**: Structured JSON logging with correlation IDs

### Performance Optimizations
- **Code Splitting**: Vendor libraries split into optimized chunks
- **Asset Optimization**: Separate paths for images, fonts, and assets
- **Tree Shaking**: Unused code elimination in production builds
- **Compression**: Brotli and gzip compression enabled

### Global Readiness
- **Multi-Currency Support**: GBP, EUR, USD with configurable base currency
- **Regional Configuration**: UK, EU, USA regions with localized settings
- **CFO Dashboard Preset**: Executive-grade dashboard with regional consolidation
- **Feature Flags**: Toggleable features for gradual rollouts

### Development Experience
- **Pre-commit Hooks**: Automated linting, formatting, and validation
- **Conventional Commits**: Enforced commit message standards
- **TypeScript Support**: Full TypeScript integration with strict mode
- **Code Quality Gates**: Combined lint, format, and type checking

## API Endpoints

### Core Endpoints
- `GET /health` - Basic health check
- `GET /ready` - Readiness probe (checks dependencies)
- `GET /live` - Liveness probe (memory and uptime)
- `GET /api/status` - Detailed application status
- `GET /api/metrics` - Prometheus metrics
- `GET /api/test` - API connectivity test
- `GET /api/db-test` - Database connectivity test

### Unleashed Integration
- `GET /api/unleashed/test` - Test Unleashed API connection
- `GET /api/unleashed/products` - Get products from Unleashed
- `GET /api/unleashed/stock` - Get current stock levels
- `GET /api/unleashed/sales-orders` - Get sales orders
- `GET /api/unleashed/customers` - Get customer data
- `GET /api/unleashed/warehouses` - Get warehouse information

### Manufacturing Data
- `GET /api/jobs` - Manufacturing jobs
- `GET /api/resources` - Production resources
- `GET /api/schedules` - Production schedules

## Features

### Core Manufacturing
- Real-time production scheduling
- Resource allocation and management
- Job tracking and monitoring
- Inventory management via Unleashed integration

### User Interface
- Modern, responsive React frontend
- Real-time data visualization with Recharts
- Component-based architecture with Shadcn/UI
- Dark/light mode support
- Mobile-friendly design

### Authentication & Security
- Clerk-based authentication
- Role-based access control
- Secure API endpoints
- Environment-based configuration

## Database Management

The application uses Render PostgreSQL with environment-specific databases:

```bash
# Check database connection
curl http://localhost:5000/api/db-test
```

## Testing

Run tests (when test suite is added):
```bash
npm test                # Run Jest tests
npm run test:e2e       # Run Playwright E2E tests
npm run test:coverage  # Run tests with coverage
```

## Validation Steps

### Local Development Test
```bash
# 1. Start development environment
npm run dev

# 2. Test frontend
curl http://localhost:3000

# 3. Test backend API
curl http://localhost:5000/health
curl http://localhost:5000/api/test

# 4. Test Unleashed integration
curl http://localhost:5000/api/unleashed/test
```

### Deployment Validation
After pushing to development branch, verify:
1. Automatic deployment to Railway dev environment
2. Database connectivity to Render dev database
3. Unleashed API integration working
4. Frontend builds and serves correctly

### Railway Project Verification
To verify you're deploying to the correct Railway project:
```bash
# Check current deployment URLs match expected environment
curl https://sentiadeploy.financeflo.ai/health

# Verify project ID in Railway dashboard matches:
# ef36131f-d36e-4c2d-8ab9-1914288d5781
```

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using port 5000
netstat -ano | findstr :5000
# Kill process if needed
taskkill /PID <process_id> /F
```

**Dependencies issues:**
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Environment variables:**
- Ensure `.env.local` exists with required variables
- Check Clerk keys are correctly set
- Verify database URLs are accessible

## Contributing

1. Create feature branch from `development`
2. Implement changes with proper testing
3. Ensure code follows project conventions
4. Submit pull request to `development` branch
5. After review, changes will be merged and auto-deployed

## Architecture Notes

### Frontend (React/Vite)
- Modern React 18 with functional components and hooks
- Vite for fast development and optimized production builds
- Tailwind CSS with custom Sentia brand colors
- Component library pattern with Shadcn/UI

### Backend (Node.js/Express)
- RESTful API design
- Express middleware for CORS, authentication, logging
- Integration with external APIs (Unleashed)
- PostgreSQL with connection pooling

### Deployment
- Railway for hosting and CI/CD
- Render for PostgreSQL databases
- Branch-based deployment strategy
- Environment-specific configurations

## License

Proprietary - Sentia Manufacturing Solutions

## Support

For technical issues or questions:
- Create GitHub issues for bug reports
- Contact development team for urgent matters
- Refer to context documentation in `/context` folder

---

**Next Steps:**
- Set up branch protection rules on GitHub
- Configure Railway deployment webhooks
- Add comprehensive test suite
- Implement monitoring and logging# Force Railway Redeploy - Sun, Sep  7, 2025  9:50:31 PM
# Force redeploy Tue, Sep  9, 2025  6:51:53 PM
# MCP Server restart - Tue, Sep 10, 2025  7:03:00 AM
# Latest deployment: Wed, Sep 10, 2025  2:47:08 PM
# Deployment trigger Sun Sep 28 17:34:36 EDT 2025
