# Technical Stack

## Development Environment

 - Primary IDE: Cursor
 - AI Assistant: Claude Code CLI
 - Version Control: GitHub CLI
 - Database: Neon PostgreSQL (vector database)
 - Hosting: Railway
 - Backend: Node.js with Express - Full-featured API server with security middleware
 - Frontend: React 18 with Vite - Modern SPA with component-based architecture
 - Build Tool: Vite
 - Package Manager: npm

## Architecture

**Full-Stack Node.js Application:**
- **Backend**: Express.js server with comprehensive middleware stack
- **Frontend**: React 18 SPA with modern hooks and routing
- **Database**: Neon PostgreSQL with SSL connections and pooling
- **Authentication**: Clerk.dev integration with role-based access control
- **Security**: Helmet, CORS, rate limiting, input validation
- **Monitoring**: Winston logging, Prometheus metrics
- **Testing**: Vitest (unit), Playwright (E2E), Supertest (API)

## Branch Structure

development    → All development work (your primary branch)
test           → User acceptance testing
production     → Live application

Auto-sync: All branches automatically sync to respective Neon databases and Railway
environments

## Key Dependencies

**Frontend:**
- React 18, React Router, TanStack Query
- Tailwind CSS, Shadcn/UI, Lucide Icons
- Recharts for data visualization
- Clerk React SDK for authentication

**Backend:**
- Express.js web framework
- PostgreSQL client (pg)
- Clerk Backend SDK
- Winston logging, Helmet security
- Express-validator, Rate limiting

**Development:**
- Vite build tool and dev server
- ESLint with security plugins
- Vitest and Playwright testing
- Concurrently for parallel development