# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `python run.py` - Start development server on localhost:5000
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
1. Create virtual environment:
   - Windows: `py -3.13 -m venv C:\Users\DanielKenny\venvs\sentia` (or `python -m venv C:\Users\DanielKenny\venvs\sentia`)
   - Mac/Linux: `python -m venv venv`
2. Activate:
   - Windows: `C:\Users\DanielKenny\venvs\sentia\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
3. Install dependencies: `python -m pip install -r requirements.txt`
4. Copy environment template: `cp .env.template .env` and configure

## Architecture Overview

### Flask Application Factory Pattern
The application uses Flask's application factory pattern in `app/__init__.py`:
- Database: SQLAlchemy with Flask-Migrate for migrations
- CORS enabled for frontend API calls
- Three main blueprints: main (views), api (REST endpoints), auth (authentication)

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