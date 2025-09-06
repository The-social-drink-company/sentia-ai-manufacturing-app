# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend Commands (React + Vite)
- `npm run dev:client` - Start React development client only on localhost:3000
- `npm run build` - Build production React app
- `npm run preview` - Preview production build locally
- `npm run serve` - Serve production build on port 3000

### Backend Commands (Node.js + Express)
- `npm run dev:server` - Start Node.js/Express API server with nodemon
- `node server.js` - Start production Node.js server
- `npm start` - Production start command (same as above)

### Full Stack Development
- `npm run dev` - Start both frontend and backend concurrently
- `npm install` - Install all Node.js dependencies

### Testing Commands
- `npm test` - Run Vitest unit tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Run tests with UI interface
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:setup` - Install Playwright browsers

### Linting & Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues

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

#### Frontend (Vite - VITE_ prefix)
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk authentication key (required)
- `VITE_API_BASE_URL`: Backend API endpoint (default: http://localhost:5000/api)
- `VITE_APP_TITLE`: Application title display
- `VITE_APP_VERSION`: Version display in UI

#### Backend (Node.js)
- `NODE_ENV`: Environment mode (development/test/production)
- `PORT`: Server port (default: 5000)
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `DEV_DATABASE_URL`: Development database URL
- `TEST_DATABASE_URL`: Test database URL
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `REDIS_URL`: Redis connection for caching/sessions
- `CLERK_SECRET_KEY`: Clerk backend secret key
- Various API keys (Amazon SP-API, Shopify, Unleashed, etc.)

## Architecture Overview

### Full-Stack Node.js Architecture
- **Frontend**: React 18 + Vite 4 + Tailwind CSS - User interface (port 3000)
- **Backend**: Node.js + Express - REST API and business logic (port 5000)
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: Clerk for user authentication and RBAC
- **Real-time**: Server-Sent Events (SSE) for live updates
- **Development**: Vite dev server proxies `/api/*` requests to Express backend
- **Production**: React build served as static files, Express serves API endpoints

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

#### Technical Stack
- **Frontend**: React 18 + Vite 4 + Tailwind CSS + Heroicons + shadcn/ui components
- **State Management**: Zustand stores with localStorage persistence + TanStack Query for server state
- **Real-time**: SSE with 15+ event types and automatic query invalidation
- **Grid System**: react-grid-layout with responsive breakpoints (lg/md/sm/xs/xxs)
- **Authentication**: Seamless Clerk integration with role-based UI components
- **Database**: Prisma ORM with PostgreSQL (Neon)

## Project Structure

```
src/
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

context/
├── api-documentation/      # External API docs
├── business-requirements/  # Business logic documentation
├── claude-code-docs/      # Claude Code documentation
├── technical-specifications/ # Tech stack docs
└── ui-components/         # UI/UX specifications

database/               # Database scripts and migrations
prisma/                # Prisma schema and migrations
public/                # Static assets
tests/                 # Test files (unit, integration, e2e)
services/              # Backend service modules
scripts/               # Utility scripts
```

## Database & Data Management

### Database Configuration
- **Primary**: Neon PostgreSQL with connection pooling
- **ORM**: Prisma for type-safe database operations
- **Migrations**: Prisma migrations for schema management
- **Development**: Automatic database setup with Docker fallback

### Key Data Models
- **Users**: Authentication and role management
- **Financial Models**: Working capital, AR/AP, cash flow
- **Manufacturing**: Jobs, resources, capacity planning
- **Dashboard**: User layouts, widget preferences

## Branch and Deployment Strategy

### Branch Structure
- `development` - Primary development branch (default)
- `test` - User acceptance testing environment
- `production` - Live production environment

### Auto-Deployment (Railway)
All branches auto-deploy with corresponding Neon PostgreSQL databases:
- development → dev.sentia-manufacturing.railway.app
- test → test.sentia-manufacturing.railway.app
- production → web-production-1f10.up.railway.app

### Development Workflow (Critical)
**NODE_ENV=development in Railway** - Therefore we must follow this branching workflow:

1. **Development Branch**: All coding, fixing, and development work happens in `development` branch
2. **Test Branch**: Once ready, push to `test` branch for user acceptance testing
3. **Production Branch**: Only push to `production` when software is ready to go live

This workflow ensures proper testing stages and prevents development code from reaching production.

## Development Methodology

### Context-Driven Development
Following structured context references from `context/` folder:
- Use specific context folders/files when working
- Reference technical specifications for consistency
- Maintain strict context validation to prevent AI drift

### Context Folder Structure
- `context/api-documentation/` - External API documentation (Amazon SP-API, Shopify)
- `context/claude-code-docs/` - Local Claude Code documentation for reference
- `context/technical-specifications/` - Tech stack and architecture docs
- `context/business-requirements/` - Business logic and user workflows
- `context/ui-components/` - Dashboard layouts and UI specifications

## Code Standards & Guidelines

### Character Encoding
**CRITICAL**: Always use ASCII-compatible characters in:
- Console output and logging
- Error messages
- Comments and documentation
- Test output and assertions

**Avoid Unicode characters**: ✅ ❌ 🎉 ⚠️ → ← ↑ ↓ • etc.
**Use ASCII alternatives**: "PASS:" "FAIL:" "SUCCESS:" "-->" "*" etc.

**Exception**: Unicode acceptable in:
- HTML templates (properly encoded)
- JSON responses (UTF-8 encoded)
- Frontend React components (properly handled)

### File Naming
- Use `.jsx` extension for React components with JSX
- Use `.js` extension for plain JavaScript utilities
- Use PascalCase for React components
- Use camelCase for hooks, utilities, and services

## Code Quality & ESLint Configuration

### ESLint Best Practices (Lessons Learned 2025)
**CRITICAL**: Our comprehensive analysis identified key ESLint patterns:

#### Built Files Exclusion
- **NEVER lint built/dist files**: Causes 7,000+ false errors
- Update `.eslintignore` to properly exclude: `dist/`, `build/`, `*.min.js`
- Focus linting on source code only: `src/`, `api/`, `config/`, `services/`

#### Global Variables Configuration
- **Node.js Environment**: Ensure globals defined for `setTimeout`, `setInterval`, `Intl`
- **Browser Environment**: Define `window`, `document`, `localStorage`, `alert`
- **Security Plugin**: Use `plugin:security/recommended` with appropriate warnings

#### Import Patterns
- **Prefer ES modules**: Use `import/export` over `require/module.exports`
- **Node.js Timers**: Import explicitly `import { setTimeout, setInterval } from 'timers'`
- **Remove unused imports**: Clean up imports that aren't used

### Security Configuration
```json
{
  "extends": ["plugin:security/recommended"],
  "rules": {
    "security/detect-unsafe-regex": "warn",
    "security/detect-non-literal-fs-filename": "off",
    "security/detect-object-injection": "warn"
  }
}
```

## Enterprise Logging Standards

### Logging Best Practices (Mandatory)
**CRITICAL**: Based on 355+ console statements analysis:

#### Production Logging Rules
1. **NO console.log in production code**
2. **Use structured logging with levels**: `logInfo`, `logWarn`, `logError`
3. **Environment-aware logging**: Only debug logs in development
4. **Proper error objects**: Pass error objects, not just messages

#### Logging Implementation Pattern
```javascript
// Import structured logger
import { logInfo, logWarn, logError } from './services/observability/structuredLogger.js';

// Development-only logging utility
const devLog = {
  log: (...args) => { if (process.env.NODE_ENV === 'development') console.log(...args); },
  warn: (...args) => { if (process.env.NODE_ENV === 'development') console.warn(...args); },
  error: (...args) => { if (process.env.NODE_ENV === 'development') console.error(...args); }
};

// Use in code
logInfo('Operation completed', { userId, operation: 'data_sync' });
logWarn('Fallback triggered', { reason, fallbackType });
logError('Critical failure', error); // Pass error object
```

#### Acceptable Console Usage
- **Test files**: Debug output acceptable
- **Development utilities**: Environment-gated console statements
- **Setup/build scripts**: Informational output for developers

## Security & Dependencies

### Vulnerability Management (Lessons Learned)
Based on security audit findings:

#### High Priority Issues
- **xlsx package**: High severity prototype pollution - no fix available
- **esbuild**: Development server vulnerability - update to >0.24.2
- **Dependencies**: Regular `npm audit` checks and fixes

#### Security Practices
- Run `npm audit fix` for non-breaking fixes
- Document known vulnerabilities that require breaking changes
- Use `npm audit --audit-level=moderate` for production checks

## Error Handling Standards

### Enterprise Error Patterns
Based on service layer analysis:

#### Service Layer Error Handling
```javascript
// Standard error handling pattern
try {
  const result = await apiCall();
  logInfo('API call successful', { endpoint, responseTime });
  return result;
} catch (error) {
  logError('API call failed', { 
    endpoint, 
    error: error.message, 
    stack: error.stack,
    statusCode: error.response?.status 
  });
  throw new ServiceError(`${endpoint} failed`, { cause: error });
}
```

#### Circuit Breaker Pattern
- Use circuit breaker for external API calls
- Implement fallback mechanisms
- Log state transitions for monitoring

#### Graceful Degradation
- Provide fallback data when services fail
- User-friendly error messages
- Maintain application functionality during partial failures

## Performance Optimization

### Build Performance (Validated Results)
- **Build Time**: Consistent 9-11 seconds across all environments
- **Bundle Size**: ~1.7MB total, ~450KB gzipped
- **Code Splitting**: Effective chunk distribution
- **Asset Optimization**: All assets properly compressed

### Memory Management
- Implement memory monitoring in development
- Use React.memo for expensive components
- Clean up event listeners and subscriptions

## Testing Standards

### Test Configuration Issues (Identified)
**CRITICAL**: Our analysis found test infrastructure needs:

#### Module System Issues
- **ES Module vs CommonJS**: Standardize on ES modules
- **Missing Dependencies**: Install `@jest/globals` for test utilities
- **Path Aliases**: Configure test environment path resolution

#### Test Best Practices
- Use Vitest for unit tests (configured and working)
- Playwright for E2E tests (needs configuration fixes)
- Maintain >80% test coverage for critical business logic

## Important Instructions

### Core Development Principles
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary for the goal
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files unless explicitly requested
- NEVER add Unicode characters in console output - use ASCII alternatives only
- Always check existing code patterns and follow the established architecture
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream

### Pre-Development Checklist
1. **Check ESLint configuration** - Ensure proper exclusions and globals
2. **Review logging patterns** - Use structured logging, not console statements
3. **Validate imports** - Prefer ES modules, import Node.js globals explicitly
4. **Test build process** - Ensure changes don't break production build
5. **Run security audit** - Check for new vulnerabilities

### Quality Gates
- **ESLint**: Must pass without errors in source code
- **Build**: Must complete successfully in <12 seconds
- **Tests**: Core functionality must remain working
- **Security**: No new high-severity vulnerabilities
- **Performance**: Build size should not increase significantly

### Emergency Rollback Indicators
- Build failures
- Critical test failures  
- New high-severity security vulnerabilities
- Performance degradation >50%

## Documentation Standards

### Code Documentation
- **Comprehensive index**: Maintain SENTIA_CODEBASE_INDEX.md
- **API documentation**: Document all endpoints with methods and purposes
- **Architecture decisions**: Record significant technical decisions
- **Environment setup**: Keep setup instructions current

### Change Documentation
- **Commit messages**: Clear, descriptive with technical details
- **PR descriptions**: Include before/after analysis and impact assessment
- **Breaking changes**: Document any changes that affect existing functionality

This enhanced CLAUDE.md reflects all lessons learned from comprehensive codebase analysis (September 2025) and establishes enterprise-grade development standards for the Sentia Manufacturing Dashboard.
- Raiway does not like docker and uses Nixpacks nix-based builder developed by Railway
=======
- app is Express/Node.js, not a static site, so Caddy shouldn't be used at all
>>>>>>> Stashed changes
=======
- app is Express/Node.js, not a static site, so Caddy shouldn't be used at all
>>>>>>> Stashed changes
=======
- app is Express/Node.js, not a static site, so Caddy shouldn't be used at all
>>>>>>> Stashed changes
=======
- app is Express/Node.js, not a static site, so Caddy shouldn't be used at all
>>>>>>> Stashed changes
