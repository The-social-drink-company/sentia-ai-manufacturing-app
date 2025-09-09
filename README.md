# Sentia Manufacturing Planning Dashboard

A modern, full-stack manufacturing planning and scheduling system built with React/Vite frontend and Node.js/Express backend.

## Tech Stack

**Frontend:**
- **React 18** - Modern UI library with hooks
- **Vite** - Fast development server and build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Reusable component library
- **Recharts** - Data visualization
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Clerk** - Authentication and user management

**Backend:**
- **Node.js** - JavaScript runtime (v18+)
- **Express.js** - Web framework with comprehensive middleware
- **Prisma ORM** - Type-safe database client with migrations
- **PostgreSQL** - Primary database (Neon with SSL)
- **Clerk Backend** - Authentication and user management
- **Winston** - Structured logging with daily rotation
- **Helmet** - Security headers and middleware
- **Unleashed API** - Inventory management integration

**Infrastructure:**
- **Railway** - Cloud deployment platform
- **Neon PostgreSQL** - Serverless database with vector support
- **GitHub** - Version control with automated deployments
- **Railway + Nixpacks** - Automated deployment with zero configuration

**Security & Monitoring:**
- **ESLint** - Code linting with security rules
- **Express Rate Limit** - DDoS protection
- **Express Validator** - Input validation and sanitization
- **Prometheus** - Metrics collection and monitoring

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

The application uses **Prisma ORM** with **Neon PostgreSQL** in a three-environment setup:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Development       │    │       Test          │    │    Production       │
│                     │    │                     │    │                     │
│ localhost:5000      │    │ test.sentia-*.app   │    │ sentia-*.app        │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Neon Dev DB       │    │   Neon Test DB      │    │   Neon Prod DB      │
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

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/sentia_dev

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
- Database: Neon PostgreSQL with connection pooling
- Cache: Redis for sessions and caching
```

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

The application uses Neon PostgreSQL with environment-specific databases:

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
2. Database connectivity to Neon dev database
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
- Neon for serverless PostgreSQL
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
