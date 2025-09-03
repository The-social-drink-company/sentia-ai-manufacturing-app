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
- **Node.js** - JavaScript runtime (v24.4.1)
- **Express.js** - Web framework with comprehensive middleware
- **PostgreSQL** - Primary database (Neon with SSL)
- **Clerk Backend** - Authentication and user management
- **Winston** - Structured logging with daily rotation
- **Helmet** - Security headers and middleware
- **Unleashed API** - Inventory management integration

**Infrastructure:**
- **Railway** - Cloud deployment platform
- **Neon PostgreSQL** - Serverless database with vector support
- **GitHub** - Version control with automated deployments
- **Docker** - Containerized deployment

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
- GitHub CLI (optional but recommended)

### 1. Clone and Setup

```bash
git clone https://github.com/The-social-drink-company/sentia-manufacturing-dashboard.git
cd sentia-manufacturing-dashboard

# Copy environment template
cp .env.example .env.local
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

## Branch Strategy & Deployment

### Branch Structure
- `development` - Active development (default branch)
- `test` - User acceptance testing environment  
- `production` - Live production environment

### Auto-Deployment
All branches automatically deploy to Railway environments:
- **development** → `dev.sentia-manufacturing.railway.app`
- **test** → `test.sentia-manufacturing.railway.app`  
- **production** → `sentia-manufacturing.railway.app`

**Railway Project ID**: `ef36131f-d36e-4c2d-8ab9-1914288d5781`

Each environment connects to its corresponding Neon PostgreSQL database.

### Development Workflow
1. Work on `development` branch
2. Test locally with `npm run dev`
3. Commit and push → automatic deployment to dev environment
4. Merge to `test` for UAT → automatic deployment to test environment
5. Merge to `production` for release → automatic deployment to production

## Available Scripts

```bash
npm run dev          # Start both frontend and backend
npm run dev:client   # Start Vite dev server (frontend only)
npm run dev:server   # Start Express server (backend only)
npm run build        # Build production React app
npm run preview      # Preview production build
npm start            # Start production server
```

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
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
- Implement monitoring and logging