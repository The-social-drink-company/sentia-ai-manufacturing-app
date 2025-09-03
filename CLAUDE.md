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
- production → sentia-manufacturing.railway.app

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

## Important Instructions

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary for the goal
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files unless explicitly requested
- NEVER add Unicode characters in console output - use ASCII alternatives only
- Always check existing code patterns and follow the established architecture