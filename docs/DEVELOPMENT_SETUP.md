# Development Environment Setup Guide

## Prerequisites

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: v2.30.0 or higher
- **PostgreSQL**: v14 or higher (for local development)
- **Redis**: v6.0 or higher (optional, for caching)
- **VS Code**: Latest version (recommended IDE)

### Recommended VS Code Extensions
- ESLint
- Prettier
- GitLens
- Claude Code
- Tailwind CSS IntelliSense
- Prisma
- Thunder Client (API testing)

---

## Initial Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/sentia-manufacturing-dashboard.git
cd sentia-manufacturing-dashboard
```

### 2. Install Dependencies
```bash
npm install
```

If you encounter peer dependency issues:
```bash
npm install --legacy-peer-deps
```

### 3. Environment Configuration

Copy environment template:
```bash
cp .env.template .env.development
```

Configure required environment variables:
```env
# Node Environment
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/sentia_dev

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Redis (optional for local dev)
REDIS_URL=redis://localhost:6379

# API Keys (get from team lead)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Service URLs
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Database Setup

#### Option A: Local PostgreSQL
```bash
# Create database
createdb sentia_dev

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

#### Option B: Docker PostgreSQL
```bash
docker run --name sentia-postgres \
  -e POSTGRES_DB=sentia_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:14-alpine
```

### 5. Start Development Servers

#### Full Stack Development
```bash
npm run dev
```
This starts both frontend (port 3000) and backend (port 5000).

#### Frontend Only
```bash
npm run dev:client
```

#### Backend Only
```bash
npm run dev:server
```

---

## Development Workflow

### Branch Strategy
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# After completing feature
git add .
git commit -m "feat: Add your feature description"
git push origin feature/your-feature-name
```

### Code Quality Checks

Before committing:
```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm run test

# Check TypeScript
npm run typecheck

# Format code
npm run format
```

### Testing

#### Unit Tests
```bash
npm run test:unit
```

#### Integration Tests
```bash
npm run test:integration
```

#### E2E Tests
```bash
# Install Playwright browsers (first time only)
npm run test:setup

# Run E2E tests
npm run test:e2e
```

#### Test Coverage
```bash
npm run test:coverage
```

---

## Common Development Tasks

### Working with Database

#### Create new migration
```bash
npm run db:migrate -- --name add_new_table
```

#### View database
```bash
npm run db:studio
```

#### Reset database
```bash
npm run db:migrate:reset
```

### Working with AI Features

#### Start MCP Server
```bash
cd mcp-server
npm install
npm start
```

The MCP server runs on port 3001 and provides AI orchestration.

### Adding New Features

1. **Create Component**
```bash
# Components go in src/components/
touch src/components/YourComponent.jsx
```

2. **Add Route**
```javascript
// In src/App.jsx
<Route path="/your-route" element={<YourComponent />} />
```

3. **Create API Endpoint**
```javascript
// In api/routes/your-route.js
router.get('/your-endpoint', authenticate, async (req, res) => {
  // Implementation
});
```

4. **Add Tests**
```javascript
// In tests/unit/YourComponent.test.jsx
describe('YourComponent', () => {
  // Tests
});
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_ctl status

# Restart PostgreSQL
pg_ctl restart
```

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear build cache
rm -rf dist .vite
npm run build
```

---

## Performance Optimization

### Development Performance

1. **Use Chrome DevTools**
   - Performance tab for profiling
   - Network tab for API calls
   - React DevTools for component analysis

2. **Enable React Strict Mode** (already configured)
```javascript
// In main.jsx
<React.StrictMode>
  <App />
</React.StrictMode>
```

3. **Use Vite HMR** (Hot Module Replacement)
   - Automatic with `npm run dev`
   - Instant updates without full reload

---

## Security Guidelines

### Local Development Security

1. **Never commit .env files**
```bash
# .gitignore should include
.env
.env.*
```

2. **Use development API keys only**
   - Never use production keys locally
   - Get test keys from team lead

3. **Test security features**
```bash
# Run security tests
npm run test:security
```

---

## IDE Configuration

### VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "tailwindCSS.includeLanguages": {
    "javascriptreact": "javascript",
    "typescriptreact": "typescript"
  }
}
```

### Claude Code Integration
1. Install Claude Code extension
2. Configure with your API key
3. Use for code reviews and suggestions

---

## Resources

### Documentation
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Prisma Documentation](https://prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)

### Internal Resources
- API Documentation: `/docs/api/README.md`
- Architecture Guide: `/docs/architecture/README.md`
- Security Guidelines: `/.claude/guidelines/SECURITY.md`
- Test Templates: `/.claude/patterns/test-templates.md`

### Support
- Team Slack: #dev-sentia
- Wiki: https://wiki.sentia.com
- Issues: GitHub Issues

---

## Quick Commands Reference

```bash
# Development
npm run dev              # Start full stack
npm run dev:client       # Frontend only
npm run dev:server       # Backend only

# Testing
npm test                 # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:coverage   # Generate coverage report

# Database
npm run db:studio       # Open Prisma Studio
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database

# Code Quality
npm run lint            # Check linting
npm run lint:fix        # Fix linting issues
npm run typecheck       # Check TypeScript
npm run format          # Format code

# Build
npm run build           # Build for production
npm run preview         # Preview production build
```

---

## Deployment

### Deploy to Development
```bash
git push origin development
```

### Deploy to Testing
```bash
git checkout test
git merge development
git push origin test
```

### Deploy to Production
```bash
# Requires approval and passes all checks
git checkout production
git merge test
git push origin production
```

---

Happy coding! 🚀