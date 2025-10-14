# Technical Stack

## Development Environment

- **Primary IDE**: Cursor with Claude Code integration
- **AI Assistant**: Claude Code CLI for development assistance
- **Version Control**: GitHub CLI with automated deployments
- **Database**: Render PostgreSQL with connection pooling and SSL
- **Hosting**: Render with auto-deployment and health checks
- **Backend**: Node.js 18+ with Express.js - Full-featured API server
- **Frontend**: React 19 with Vite 6 - Modern SPA with component-based architecture
- **Build Tool**: Vite 6 with optimized production builds
- **Package Manager**: pnpm with lockfile versioning

## Architecture

**Full-Stack Node.js Application:**
- **Backend**: Express.js server with comprehensive middleware stack
- **Frontend**: React 19 SPA with modern hooks and routing
- **Database**: Render PostgreSQL with SSL connections and pooling
- **Authentication**: Clerk.dev integration with role-based access control
- **Security**: Helmet, CORS, rate limiting, input validation, CSRF protection
- **Monitoring**: Winston logging, health checks, structured logging
- **Testing**: Vitest (unit), Playwright (E2E) - configured but not actively used
- **State Management**: Zustand for client state, TanStack Query for server state
- **Real-time**: Server-Sent Events (SSE) and WebSocket for live updates

## Branch Structure

- **development** → All development work (primary branch)
- **testing** → User acceptance testing environment 
- **production** → Live production application

**Auto-deployment**: All branches automatically sync to respective Render PostgreSQL databases and environments

## Key Dependencies

**Frontend:**
- React 19, React Router 7, TanStack Query 5
- Tailwind CSS 4, Radix UI components (shadcn/ui), Lucide React icons
- Recharts for data visualization and charts
- Framer Motion for animations
- Clerk React SDK 5.49.0 for authentication
- Microsoft Graph API integration (@azure/msal-browser)
- React Hook Form with Zod validation

**Backend:**
- Express.js web framework with comprehensive middleware
- Prisma ORM 6.16.2 with PostgreSQL client
- Clerk Express SDK 1.7.34 for authentication
- Winston logging with daily rotation and structured logging
- Helmet security, CORS, compression, rate limiting
- Redis 4.7.0 for caching and sessions
- Socket.io 4.8.1 for WebSocket real-time features
- Xero Node SDK 4.38.0 for financial integrations
- Shopify API 11.5.0 for e-commerce integrations
- Model Context Protocol SDK 1.11.3 for AI integrations

**Development:**
- Vite 6.3.5 build tool and dev server
- ESLint 9 with security plugins and custom rules
- Vitest and Playwright testing frameworks (configured but not actively used)
- Concurrently for parallel development
- Prettier for code formatting
- pnpm 10.4.1 for package management
- Nodemon for server development

## Enhanced Features (v2.0+)

**Enterprise Integrations:**
- Xero OAuth2 financial data integration
- Shopify e-commerce platform connectivity
- Microsoft Graph API for enterprise workflows
- AI-powered analytics via Model Context Protocol

**Security Enhancements:**
- Enhanced CSP with nonce-based script execution
- Multi-tier rate limiting for different endpoints
- Security headers (HSTS, referrer policy, frame protection)
- Comprehensive input validation and sanitization
- JWT-based authentication with Clerk

**Observability & Monitoring:**
- Health endpoints (/health) for all environments
- Structured Winston logging with daily rotation
- Real-time error tracking and performance monitoring
- Render-native deployment monitoring

**Performance Optimizations:**
- Vite 6 with modern ES modules and tree shaking
- React 19 concurrent features and optimizations
- Tailwind CSS 4 performance improvements
- Asset optimization with compression

**Deployment Architecture:**
- Multi-environment Render deployments (development/testing/production)
- Separate PostgreSQL databases per environment
- Auto-deployment via GitHub integration
- Health check monitoring and rollback capabilities

**Legacy Code Management:**
- Unused server variants moved to archive/ folder
- Consolidated configuration (eliminated render-start.js confusion)
- Clean separation of development vs production server files