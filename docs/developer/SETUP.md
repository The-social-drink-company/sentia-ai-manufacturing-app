# Development Setup Guide

## Overview
Complete guide for setting up the Sentia Manufacturing Dashboard development environment.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Development Environment](#development-environment)
- [Local Setup](#local-setup)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Development Tools](#development-tools)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Operating System:**
- Windows 10/11
- macOS 10.15+
- Ubuntu 18.04+ or similar Linux distribution

**Required Software:**
- Node.js 18.0+ (LTS recommended)
- pnpm 9.12.0+
- Git 2.30+
- Modern code editor (VS Code recommended)

**Recommended Hardware:**
- 8GB+ RAM
- 4+ CPU cores
- 50GB+ free disk space
- SSD storage for better performance

### Software Installation

**Node.js Installation:**
```bash
# Using Node Version Manager (recommended)
# Install nvm first (https://github.com/nvm-sh/nvm)
nvm install 18
nvm use 18

# Verify installation
node --version  # Should show v18.x.x

# Install pnpm globally
npm install -g pnpm@9.12.0
pnpm --version  # Should show 9.12.0+
```

**Git Installation:**
```bash
# Windows (using Chocolatey)
choco install git

# macOS (using Homebrew)
brew install git

# Ubuntu/Debian
sudo apt update
sudo apt install git

# Verify installation
git --version
```

**VS Code Installation:**
- Download from https://code.visualstudio.com/
- Install recommended extensions (see Development Tools section)

---

## Development Environment

### Recommended VS Code Extensions

Install these extensions for optimal development experience:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "streetsidesoftware.code-spell-checker",
    "ms-vscode.vscode-todo-highlight",
    "gruntfuggly.todo-tree",
    "ms-vscode.vscode-jest",
    "ms-playwright.playwright"
  ]
}
```

**Installation:**
1. Open VS Code
2. Go to Extensions (Ctrl/Cmd + Shift + X)
3. Search and install each extension
4. Restart VS Code

### VS Code Settings

Create `.vscode/settings.json` in your project root:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "'([^']*)'"],
    ["clsx\\(([^)]*)\\)", "'([^']*)'"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  "jest.autoRun": "off"
}
```

---

## Local Setup

### 1. Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/sentia-manufacturing/dashboard.git
cd dashboard

# Set up remote branches
git remote add origin https://github.com/sentia-manufacturing/dashboard.git
git fetch origin

# Create local development branch
git checkout -b feature/your-feature-name development
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

**Common Installation Issues:**
```bash
# If pnpm install fails, try:
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install

# For permission issues on macOS/Linux:
sudo chown -R $(whoami) ~/.local/share/pnpm
```

### 3. Verify Installation

```bash
# Check if all scripts are available
pnpm run --help

# Test build process
pnpm run build

# Run linting
pnpm run lint
```

---

## Database Setup

### Option 1: Neon PostgreSQL (Recommended)

**Create Neon Account:**
1. Visit https://neon.tech
2. Sign up for free account
3. Create new project: "Sentia Dashboard Dev"
4. Note connection string

**Connection String Format:**
```
postgresql://username:password@host/database?sslmode=require
```

### Option 2: Local PostgreSQL

**Install PostgreSQL:**
```bash
# Windows (using Chocolatey)
choco install postgresql

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Create Development Database:**
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE sentia_dashboard_dev;
CREATE USER sentia_dev WITH ENCRYPTED PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE sentia_dashboard_dev TO sentia_dev;
\q
```

### Option 3: Native PostgreSQL Installation

```bash
# Windows (using Chocolatey)
choco install postgresql

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create development database
sudo -u postgres createdb sentia_dashboard_dev
sudo -u postgres createuser sentia_dev -P
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sentia_dashboard_dev TO sentia_dev;"
```

---

## Environment Configuration

### 1. Environment Files

Create environment files for different stages:

**.env.development:**
```bash
# Application Settings
NODE_ENV=development
APP_NAME="Sentia Manufacturing Dashboard (Dev)"
APP_VERSION=1.0.0-dev
APP_URL=http://localhost:3000
API_URL=http://localhost:5000

# Server Configuration
PORT=5000
HOST=localhost

# Database Configuration
DATABASE_URL=postgresql://sentia_dev:dev_password_123@localhost:5432/sentia_dashboard_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# Authentication (Development Clerk Keys)
CLERK_PUBLISHABLE_KEY=pk_test_your_dev_key_here
CLERK_SECRET_KEY=sk_test_your_dev_key_here
CLERK_WEBHOOK_SECRET=whsec_your_dev_webhook_secret

# Development Features
DEBUG_MODE=true
VERBOSE_LOGGING=true
HOT_RELOAD=true
SOURCE_MAPS=true

# External APIs (Use test/sandbox endpoints)
AMAZON_SELLER_ID=test_seller_id
AMAZON_ACCESS_KEY=test_access_key
SHOPIFY_SHOP_DOMAIN=your-test-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=test_access_token

# Development Tools
VITE_DEV_TOOLS=true
REACT_QUERY_DEVTOOLS=true
STORYBOOK_ENABLED=true
```

**.env.test:**
```bash
# Test Environment Configuration
NODE_ENV=test
APP_NAME="Sentia Dashboard (Test)"
DATABASE_URL=postgresql://sentia_test:test_password@localhost:5432/sentia_dashboard_test
REDIS_URL=redis://localhost:6379/1

# Disable external services in tests
CLERK_PUBLISHABLE_KEY=pk_test_mock_key
CLERK_SECRET_KEY=sk_test_mock_key
EXTERNAL_APIS_ENABLED=false

# Test-specific settings
LOG_LEVEL=error
CACHE_ENABLED=false
RATE_LIMITING_ENABLED=false
```

**.env.local.example:**
```bash
# Copy this file to .env.local and customize for your setup
# .env.local is gitignored and won't be committed

# Personal API Keys (get these from respective services)
CLERK_PUBLISHABLE_KEY=your_personal_clerk_key
CLERK_SECRET_KEY=your_personal_clerk_secret

# Database (if using personal Neon account)
DATABASE_URL=your_personal_database_url

# Optional: Personal configurations
PERSONAL_EMAIL=your.email@example.com
DEFAULT_USER_ROLE=admin
SKIP_EMAIL_VERIFICATION=true
```

### 2. Clerk Authentication Setup

**Development Setup:**
1. Visit https://clerk.dev
2. Create account and new application
3. Choose "React" as framework
4. Note Publishable Key and Secret Key
5. Add to your `.env.development`

**Local Development URLs:**
- Add `http://localhost:3000` to allowed origins
- Add `http://localhost:5000` to allowed redirect URLs

### 3. Database Migration

```bash
# Install Prisma CLI globally
pnpm add -g prisma

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed development data
npx prisma db seed
```

**Verify Database Setup:**
```bash
# Open Prisma Studio (database GUI)
npx prisma studio

# Should open http://localhost:5555
# Verify tables were created and seeded
```

---

## Running the Application

### Development Mode

**Start Full Stack:**
```bash
# Terminal 1: Start backend
pnpm run dev:server

# Terminal 2: Start frontend
pnpm run dev:client

# Or start both concurrently
pnpm run dev
```

**Verify Everything is Running:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/health
- Database GUI: http://localhost:5555 (if Prisma Studio is running)

### Individual Services

**Frontend Only:**
```bash
pnpm run dev:client
```

**Backend Only:**
```bash
pnpm run dev:server
```

**Database Operations:**
```bash
# Reset database
pnpm run db:reset

# View database
pnpm run db:studio

# Generate new migration
pnpm run db:migrate

# Seed test data
pnpm run db:seed
```

### Production Build (Local)

```bash
# Build frontend
npm run build

# Start production server
npm run start

# Or build and start
npm run build && npm run start
```

---

## Development Tools

### Package.json Scripts

Here are all available npm scripts:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:client": "vite",
    "dev:server": "nodemon server.js",
    "build": "vite build",
    "build:analyze": "vite build --mode analyze",
    "preview": "vite preview",
    "start": "node server.js",
    
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    
    "db:reset": "prisma migrate reset",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "db:generate": "prisma generate",
    
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### Code Quality Tools

**ESLint Configuration:**
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react-hooks/exhaustive-deps': 'warn'
  },
  settings: {
    react: { version: 'detect' }
  }
};
```

**Prettier Configuration:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Git Hooks (Husky)

**Pre-commit Hook:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run type-check
npm run test:run
```

**Commit Message Hook:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx --no-install commitlint --edit $1
```

---

## Troubleshooting

### Common Issues

**Node.js Version Issues:**
```bash
# Error: Node version not supported
# Solution: Use Node Version Manager
nvm install 18
nvm use 18

# Verify version
node --version  # Should be 18.x.x
```

**Port Already in Use:**
```bash
# Error: Port 3000/5000 already in use
# Solution: Kill process using port
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Or use different ports
export PORT=3001  # for backend
export VITE_PORT=3002  # for frontend
```

**Database Connection Issues:**
```bash
# Error: Database connection failed
# Check if PostgreSQL is running
# Windows:
sc query postgresql

# macOS:
brew services list | grep postgresql

# Linux:
systemctl status postgresql

# Test connection manually
psql -h localhost -U sentia_dev -d sentia_dashboard_dev
```

**Dependency Issues:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check for version conflicts
npm ls
```

**TypeScript Issues:**
```bash
# Restart TypeScript server in VS Code
Ctrl/Cmd + Shift + P -> "TypeScript: Restart TS Server"

# Check TypeScript configuration
npx tsc --showConfig

# Regenerate type definitions
npm run db:generate
```

### Performance Issues

**Slow Development Server:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Disable source maps for faster builds (development)
export GENERATE_SOURCEMAP=false

# Use faster development build
npm run dev:fast  # if available
```

**Hot Reload Not Working:**
```bash
# Check Vite configuration
# Ensure polling is enabled for network drives
# vite.config.ts
export default defineConfig({
  server: {
    watch: {
      usePolling: true
    }
  }
});
```

### Environment Issues

**Environment Variables Not Loading:**
```bash
# Check file names (case sensitive)
ls -la .env*

# Verify file format (no spaces around =)
cat .env.development

# Restart development server after changes
npm run dev
```

**CORS Issues:**
```bash
# Add to vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
```

### Getting Help

**Internal Resources:**
1. Check existing documentation in `/docs`
2. Search GitHub issues
3. Ask in team Slack channel
4. Review code comments and README files

**External Resources:**
1. Vite documentation: https://vitejs.dev
2. React documentation: https://reactjs.org
3. TypeScript handbook: https://typescriptlang.org
4. Prisma documentation: https://prisma.io

**Creating Support Requests:**
Include this information when asking for help:
- Operating system and version
- Node.js and npm versions
- Complete error messages
- Steps to reproduce the issue
- What you've already tried

---

## Next Steps

After completing setup:

1. **Explore the codebase**: Read through key files and components
2. **Run tests**: Make sure all tests pass on your machine
3. **Make a small change**: Update a component and see hot reload
4. **Review development workflow**: Read `DEVELOPMENT.md`
5. **Check coding standards**: Review `CONTRIBUTING.md`

**Quick Validation:**
```bash
# Run this command to validate your setup
npm run validate-setup
```

This should output:
```
✅ Node.js version: 18.x.x
✅ Database connection: OK
✅ Environment variables: Loaded
✅ Dependencies: Installed
✅ Build process: Working
✅ Tests: Passing
🎉 Development environment ready!
```

You're now ready to start developing on the Sentia Manufacturing Dashboard!