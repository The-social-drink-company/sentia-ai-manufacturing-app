# Technical Stack

## Development Environment

- **Primary IDE**: Cursor with Claude Code integration
- **AI Assistant**: Claude Code CLI for development assistance
- **Version Control**: GitHub CLI with automated deployments
- **Database**: Neon PostgreSQL with connection pooling and SSL
- **Hosting**: Railway with Nixpacks build system
- **Backend**: Node.js 18+ with Express.js - Full-featured API server
- **Frontend**: React 18 with Vite 4 - Modern SPA with component-based architecture
- **Build Tool**: Vite 4 with optimized production builds
- **Package Manager**: npm with lockfile versioning

## Architecture

**Full-Stack Node.js Application:**
- **Backend**: Express.js server with comprehensive middleware stack
- **Frontend**: React 18 SPA with modern hooks and routing
- **Database**: Neon PostgreSQL with SSL connections and pooling
- **Authentication**: Clerk.dev integration with role-based access control
- **Security**: Helmet, CORS, rate limiting, input validation, CSRF protection
- **Monitoring**: Winston logging, Prometheus metrics, health checks
- **Testing**: Vitest (unit), Playwright (E2E), Supertest (API)
- **State Management**: Zustand for client state, TanStack Query for server state
- **Real-time**: Server-Sent Events (SSE) for live updates

## Branch Structure

- **development** → All development work (primary branch)
- **test** → User acceptance testing environment
- **production** → Live production application

**Auto-deployment**: All branches automatically sync to respective Neon databases and Railway environments

## Key Dependencies

**Frontend:**
- React 18, React Router 6, TanStack Query 5
- Tailwind CSS 3, Shadcn/UI, Lucide React icons
- Recharts for data visualization, Chart.js for advanced charts
- React Grid Layout for drag-and-drop dashboard
- Framer Motion for animations
- Clerk React SDK for authentication

**Backend:**
- Express.js web framework with comprehensive middleware
- Prisma ORM with PostgreSQL client
- Clerk Backend SDK for authentication
- Winston logging with daily rotation
- Helmet security, Express-validator, Rate limiting
- BullMQ for job processing
- Redis for caching and sessions

**Development:**
- Vite 4 build tool and dev server
- ESLint with security plugins and custom rules
- Vitest and Playwright testing frameworks
- Concurrently for parallel development
- Prettier for code formatting
- Husky for pre-commit hooks

## Enhanced Features (v1.1+)

**Security Enhancements:**
- Enhanced CSP with nonce-based script execution
- Multi-tier rate limiting for different endpoints
- Security headers (HSTS, referrer policy, frame protection)
- Comprehensive input validation and sanitization

**Observability & Monitoring:**
- Health endpoints (/health, /ready, /live)
- Prometheus-format metrics at /api/metrics
- Performance monitoring with Web Vitals
- Structured JSON logging with correlation IDs

**Performance Optimizations:**
- Code splitting with vendor library optimization
- Asset optimization with separate paths
- Tree shaking for unused code elimination
- Brotli and gzip compression

**Global Readiness:**
- Multi-currency support (GBP, EUR, USD)
- Regional configuration (UK, EU, USA)
- CFO Dashboard preset with regional consolidation
- Feature flags for gradual rollouts