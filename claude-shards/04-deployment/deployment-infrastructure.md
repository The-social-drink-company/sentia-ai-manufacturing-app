# Deployment Infrastructure

**Last Updated**: October 20, 2025
**Category**: Deployment
**Related Shards**: [environment-setup.md](./environment-setup.md), [branch-strategy.md](./branch-strategy.md)

## Cloud-Based Deployment (Actually Working) ✅

All environments deployed on Render with proper CI/CD:

### Live Environments

**Current Production Services** (All deploy from `main` branch):

| Service         | URL                                       | Status    | Purpose                   |
| --------------- | ----------------------------------------- | --------- | ------------------------- |
| **Frontend**    | https://sentia-frontend-prod.onrender.com | ✅ Active | React application UI      |
| **Backend API** | https://sentia-backend-prod.onrender.com  | 🔄 Active | Express REST API + Prisma |
| **MCP Server**  | https://sentia-mcp-prod.onrender.com      | 🔄 Active | External API integrations |
| **Database**    | Internal PostgreSQL 17                    | ✅ Active | Main data store           |

**Health Check Endpoints**:
- Frontend: https://sentia-frontend-prod.onrender.com
- Backend: https://sentia-backend-prod.onrender.com/api/health
- MCP: https://sentia-mcp-prod.onrender.com/health

**⚠️ Critical Configuration**: All services MUST specify `branch: main` in render.yaml (see [docs/render-deployment-guide.md](../../docs/render-deployment-guide.md))

**Database Expiration**: Free tier expires **November 16, 2025** (upgrade required)

## 3-Service Architecture

**IMPORTANT**: The application now uses a **3-service architecture** instead of monolithic deployment:

1. **Frontend Service** - React application UI
2. **Backend API Service** - Express REST API + Prisma
3. **MCP Server Service** - External API integrations

Each service deploys independently with its own health check endpoint.

## Server File Configuration (SIMPLIFIED - October 2025)

**SIMPLIFIED CONFIGURATION**: Server startup confusion has been eliminated.

**Current Production Configuration**:
- **Render Configuration**: `render.yaml` specifies `startCommand: "node server.js"` for ALL environments
- **Production Server**: `/server.js` (root level) - Contains full enterprise functionality
- **Development Server**: `server/index.js` used only for local development (`npm run dev:server`)
- **Legacy Files**: All other server files moved to `archive/` folder for safety

**Configuration Clarity**:
- ✅ **What configs say**: `node server.js`
- ✅ **What actually runs**: `server.js` (same file)
- ✅ **No Hidden Overrides**: No render-start.js or conflicting scripts
- ✅ **Single Source of Truth**: One production server file

**To Deploy API Changes**: Modify `/server.js` (root level) - the only production server

## Deployment Commands

```bash
# Push to main (auto-deploys to production services)
git push origin main

# Push to test (auto-deploys to test environment - future)
git push origin test

# Push to production (dedicated production environment - future)
git push origin production
```

## Render Build Commands (Automated - Do Not Run Locally)

- `pnpm run build` - Used by Render for building
- `pnpm run start:render` - Used by Render for starting
- These run automatically on Render after git push

## ❌ DEPRECATED - DO NOT USE

- ~~`npm run dev`~~ - No local development
- ~~`npm run dev:client`~~ - No local frontend
- ~~`npm run dev:server`~~ - No local backend
- ~~`localhost:3000`~~ - Use Render URLs
- ~~`localhost:5000`~~ - Use Render URLs
- ~~`.env` files~~ - Use Render environment variables

## Managing Environment Variables

1. Go to https://dashboard.render.com
2. Select your service
3. Click "Environment" tab
4. Add/update variables
5. Service auto-redeploys

## Monitoring

- **Logs**: Render Dashboard → Service → Logs
- **Health**: `{service-url}/health`
- **Metrics**: Render Dashboard → Service → Metrics

## Render Platform Configuration Notes

- Deployment uses Render for all environments (development, testing, production)
- Application is an Express/Node.js server serving both API and static React build
- PostgreSQL databases with pgvector extension for AI/ML capabilities
- Auto-deployment configured for all three branches via render.yaml
- Environment variables automatically injected from Render dashboard
- Health checks configured at `/health` endpoint

---

[Next: Environment Setup →](./environment-setup.md) | [Back to Main →](../../CLAUDE.md)