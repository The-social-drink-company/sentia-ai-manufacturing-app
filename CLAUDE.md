# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend Commands (React + Vite)
- `npm run dev` - Start React development server on localhost:3000
- `npm run build` - Build production React app
- `npm run preview` - Preview production build locally
- `npm install` - Install Node.js dependencies

### Backend Commands (Flask API)
- `python run.py` - Start Flask API server on localhost:5000
- `python -m flask db init` - Initialize database
- `python -m flask db migrate -m "message"` - Create database migration
- `python -m flask db upgrade` - Apply database migrations
- `pytest` - Run all tests
- `pytest --cov=app tests/` - Run tests with coverage
- `python -m flask init-db` - Initialize database (custom CLI command)
- `python -m flask test-db` - Test database connection and show info
- `python -m flask list-users` - List all users in the system
- `python -m flask create-admin` - Create an admin user interactively

**Important**: Always use `python -m flask [command]` instead of `flask [command]` to ensure proper module resolution and environment compatibility.

### Environment Setup

#### Frontend Setup (Node.js)
1. Install Node.js (v18+)
2. Install dependencies: `npm install`

#### Backend Setup (Python)
1. Create virtual environment:
   - Windows: `py -3.13 -m venv C:\Users\DanielKenny\venvs\sentia` (or `python -m venv C:\Users\DanielKenny\venvs\sentia`)
   - Mac/Linux: `python -m venv venv`
2. Activate:
   - Windows: `C:\Users\DanielKenny\venvs\sentia\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
3. Install dependencies: `python -m pip install -r requirements.txt`
4. Copy environment template: `cp .env.template .env` and configure

#### Development Workflow
1. Start Flask API: `python run.py` (runs on port 5000)
2. Start React frontend: `npm run dev` (runs on port 3000)
3. Frontend proxies API calls to backend via Vite configuration

## Enhanced Dashboard System

### Production Dashboard Implementation (September 2025)
The main dashboard has been upgraded to a comprehensive, production-ready system implementing the full "Improved Prompt 8: Main Dashboard Interface Development" specification:

#### Key Features Implemented
- **Responsive Grid Layout**: 12-column responsive grid using react-grid-layout with drag-and-drop widgets
- **Role-Based Access Control**: Complete RBAC system with admin/manager/operator/viewer roles and granular permissions
- **Real-time Updates**: Server-Sent Events (SSE) integration for live data updates and job status monitoring
- **State Management**: Zustand for layout persistence, TanStack Query for data fetching and caching
- **Widget System**: Modular widget architecture with 7 core widgets (KPI Strip, Demand Forecast, Working Capital, etc.)
- **Dark/Light Themes**: Complete theming system with user preference persistence
- **Keyboard Shortcuts**: Navigate with hotkeys (g+o for dashboard, g+f for forecasts, etc.)
- **Edit Mode**: In-place dashboard customization with visual grid editing

#### Core Components
- **Enhanced Dashboard** (`/dashboard`): Main production dashboard with all features
- **Basic Dashboard** (`/dashboard/basic`): Fallback to original simple dashboard
- **Layout System**: Persistent grid layouts per user role and breakpoint
- **Authentication Integration**: Seamless Clerk integration with role-based UI

#### Technical Architecture
- **Frontend**: React 18 + Vite 4 + Tailwind CSS + shadcn/ui components
- **State**: Zustand stores for layout, TanStack Query for server state
- **Real-time**: SSE connection with automatic reconnection and query invalidation
- **Grid**: react-grid-layout with responsive breakpoints (lg/md/sm/xs/xxs)
- **Permissions**: Granular permission system with 20+ permissions across domains

#### Environment Configuration
Required Vite environment variables:
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk authentication (required)
- `VITE_API_BASE_URL`: Backend API endpoint (default: http://localhost:5000/api)
- `VITE_APP_TITLE`: Application title display
- `VITE_APP_VERSION`: Version display in UI

## Architecture Overview

### Hybrid Frontend/Backend Architecture
- **Frontend**: React with Vite (port 3000) - User interface and client-side logic
- **Backend**: Flask API (port 5000) - Data processing, advanced analytics (numpy, pandas), and database operations
- **Development**: Vite dev server proxies `/api/*` requests to Flask backend
- **Production**: React build served as static files, Flask serves API endpoints

### Flask Application Factory Pattern
The Flask backend uses application factory pattern in `app/__init__.py`:
- Database: SQLAlchemy with Flask-Migrate for migrations
- CORS configured for React frontend (localhost:3000)
- API-only endpoints under `/api/*` prefix
- Advanced data analysis capabilities with numpy, pandas, scikit-learn

### Database Models (app/models/)
Core entities following manufacturing planning domain:
- `User` - Authentication and user management
- `Job` - Manufacturing jobs/orders
- `Resource` - Production resources (machines, workers)
- `Schedule` - Production schedules linking jobs and resources

All models imported via `app/models/__init__.py` for clean imports.

### Configuration System
Multi-environment configuration in `config.py`:
- `DevelopmentConfig` - Local development with SQLite fallback
- `TestConfig` - Testing with PostgreSQL test database
- `ProductionConfig` - Production with logging to syslog
- Environment selection via `FLASK_CONFIG` environment variable

### Routing Structure (app/routes/)
- `main.bp` - Web interface routes (dashboard, forms)
- `api.bp` - REST API endpoints (/api/*)
- `auth.bp` - Authentication routes (login, logout)

## Branch and Deployment Strategy

### Branch Structure
- `development` - Primary development branch (default)
- `test` - User acceptance testing environment
- `production` - Live production environment

### Auto-Deployment
All branches auto-deploy to Railway with corresponding Neon PostgreSQL databases:
- development → dev.sentia-manufacturing.railway.app
- test → test.sentia-manufacturing.railway.app  
- production → sentia-manufacturing.railway.app

## Key Technical Specifications

### Database
- Primary: Neon PostgreSQL with vector support
- Development fallback: SQLite (`sentia_dev.db`)
- Testing: PostgreSQL test database
- Connection pooling configured in production

### Task Processing
- Celery for background tasks
- Redis as message broker
- Production settings: 300s max optimization time, 30-day schedule horizon

### Security Configuration
- Session cookies: secure, httponly, SameSite=Lax
- CORS origins configurable via environment
- Secret key management via environment variables

## Development Methodology

### Context-Driven Development
Following "Vibe Coding" methodology from `context/development-methodology/vibe_coding_guide.md`:
- Use structured context references from `context/` folder
- Always reference specific context folders/files when working
- Prevent AI drift by maintaining strict context validation
- Request additional prompts for any gaps in sequential development

### Context Folder Structure
- `context/api-documentation/` - External API documentation (Amazon SP-API, Shopify)
- `context/claude-code-docs/` - Local copy of Claude Code product docs for offline/reference use
- `context/technical-specifications/` - Tech stack and architecture docs
- `context/development-methodology/` - Development process guidelines
- Additional context folders for business logic, testing scenarios, etc.

#### Claude Code Docs (`context/claude-code-docs/`)
This folder contains the official Claude Code documentation mirrored locally to guide IDE integration and agent behavior. Key docs include:
- `overview.md`, `quickstart.md` – High-level intro and setup
- `sdk.md`, `hooks.md` – Extensibility, custom hooks, programmatic control
- `ide-integrations.md`, `interactive-mode.md` – Editor workflows and interactive usage
- `settings.md`, `output-styles.md`, `memory.md` – Configuration, formatting, and memory model
- `mcp.md`, `llm-gateway.md`, `sub-agents.md` – Advanced architectures and multi-tooling
- `troubleshooting.md`, `monitoring-usage.md`, `costs.md` – Ops guidance

Usage guidance:
- When asking Claude to code, reference specific files in this folder to enforce correct behavior (e.g., cite `hooks.md` when requesting a custom hook, or `settings.md` for formatting rules).
- Prefer these local docs over external links to ensure consistent, versioned behavior across environments and CI.

## Placeholder app

The program placeholder_app.js has been created to test the integration between GitHub and Railway. It will be replaced later with a GUI app.

## Character Encoding and Text Guidelines

### Unicode and Character Encoding
**CRITICAL**: Always use ASCII-compatible characters in code, especially in:
- Print statements and console output
- Error messages and logging
- Comments and docstrings  
- Test output and assertions

**AVOID** non-ASCII Unicode characters that can cause encoding issues:
- ❌ Emoji symbols (✅ ❌ 🎉 ⚠️ etc.)
- ❌ Unicode checkmarks and crosses (✓ ✗)
- ❌ Special punctuation (• → ← ↑ ↓)
- ❌ Mathematical symbols (≥ ≤ ≠ ≈)
- ❌ Currency symbols beyond $ (€ £ ¥)

**USE** ASCII alternatives instead:
- ✅ → "PASS:" or "SUCCESS:"
- ❌ → "FAIL:" or "ERROR:"
- 🎉 → "SUCCESS!" or "COMPLETED!"
- ⚠️ → "WARNING:" or "CAUTION:"
- ✓ → "OK" or "PASS"
- ✗ → "FAIL" or "ERROR"  
- • → "-" or "*"
- → → "-->" or "=>"

### Examples of Safe vs Unsafe Code:

**UNSAFE** (will cause UnicodeEncodeError):
```python
print("✅ Test passed!")
print("❌ Test failed!")
print("🎉 All done!")
```

**SAFE** (ASCII-compatible):
```python
print("PASS: Test passed!")
print("FAIL: Test failed!")  
print("SUCCESS: All done!")
```

### Exception: Web Templates and JSON
Unicode characters ARE acceptable in:
- HTML templates (properly encoded)
- JSON responses (UTF-8 encoded)
- Database content (properly handled by ORM)
- Frontend JavaScript and CSS

**Rationale**: This prevents `UnicodeEncodeError: 'charmap' codec can't encode character` errors that occur when the Windows console or terminal cannot display Unicode characters, especially in automated testing and CI/CD environments.

## Important Instruction Reminders

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User
- NEVER add Unicode characters in print statements, error messages, or console output - use ASCII alternatives only