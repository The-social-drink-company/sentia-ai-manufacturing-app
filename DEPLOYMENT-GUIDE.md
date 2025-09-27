# Sentia Manufacturing Dashboard - Complete Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the complete Sentia Manufacturing Dashboard with all enterprise-level features, AI/ML capabilities, and MCP server integration.

## Architecture
- **Frontend**: React + Vite (Deployed on Render)
- **Backend**: Node.js Express API (Deployed on Render)
- **MCP Server**: AI/ML Server (Deployed on Render)
- **Authentication**: Clerk Pro
- **Database**: PostgreSQL (Render managed)

## Prerequisites
1. Render account with billing enabled
2. Clerk Pro account
3. Domain name (optional but recommended)

## Deployment Steps

### 1. Deploy Main Application (Frontend + Backend)

#### Create New Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

```yaml
Name: sentia-manufacturing-production
Environment: Node
Build Command: pnpm install --frozen-lockfile && pnpm run build
Start Command: pnpm run start
```

#### Environment Variables
Add all variables from `PRODUCTION-ENV-UPDATES-REQUIRED.env`:

**Critical Authentication Variables:**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
CLERK_SECRET_KEY=sk_live_[YOUR_CLERK_SECRET_KEY]
VITE_CLERK_DOMAIN=clerk.financeflo.ai
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**MCP Server Integration:**
```env
VITE_MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
MCP_JWT_SECRET=UCL2hGcrBa4GdF32izKAd2dTBDJ5WidLVuV5r3uPTOc=
VITE_MCP_JWT_SECRET=UCL2hGcrBa4GdF32izKAd2dTBDJ5WidLVuV5r3uPTOc=
```

**API Configuration:**
```env
VITE_API_BASE_URL=https://sentia-manufacturing-production.onrender.com/api
VITE_WS_URL=wss://sentia-manufacturing-production.onrender.com/ws
VITE_SSE_URL=https://sentia-manufacturing-production.onrender.com/api/events
```

### 2. Deploy MCP Server

#### Create New Web Service for MCP Server
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect the same GitHub repository
4. Configure the service:

```yaml
Name: sentia-mcp-server
Root Directory: mcp-server
Environment: Node
Build Command: pnpm install --frozen-lockfile
Start Command: pnpm start
Port: 9000
```

#### MCP Server Environment Variables
```env
NODE_ENV=production
PORT=9000
JWT_SECRET=UCL2hGcrBa4GdF32izKAd2dTBDJ5WidLVuV5r3uPTOc=
LOG_LEVEL=info

# AI/ML Configuration
OPENAI_API_KEY=sk-[YOUR_OPENAI_API_KEY]
ANTHROPIC_API_KEY=sk-ant-[YOUR_ANTHROPIC_API_KEY]

# External API Integrations
XERO_CLIENT_ID=[YOUR_XERO_CLIENT_ID]
XERO_CLIENT_SECRET=[YOUR_XERO_CLIENT_SECRET]
XERO_REDIRECT_URI=https://mcp-server-tkyu.onrender.com/auth/xero/callback

# Database (if using external database)
DATABASE_URL=[YOUR_DATABASE_URL]
```

### 3. Configure Clerk Authentication

#### Update Clerk Application Settings
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to your application
3. Go to "API Keys" and copy the keys
4. Go to "Domains" and add your Render domain:
   - `https://sentia-manufacturing-production.onrender.com`
   - `https://sentia.onrender.com`
5. Configure OAuth providers if needed
6. Set up user roles and permissions

#### Clerk Webhook Configuration
1. In Clerk Dashboard, go to "Webhooks"
2. Create new webhook with URL: `https://sentia-manufacturing-production.onrender.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy webhook secret to environment variables

### 4. Database Setup (Optional)

#### PostgreSQL Database
1. In Render Dashboard, create new PostgreSQL service
2. Name: `sentia-manufacturing-db`
3. Copy connection string to environment variables
4. Update `DATABASE_URL` in both services

### 5. Domain Configuration (Optional)

#### Custom Domain Setup
1. In Render Dashboard, go to your web service
2. Click "Settings" → "Custom Domains"
3. Add your domain: `sentia.financeflo.ai`
4. Configure DNS records as instructed by Render
5. Update Clerk domain settings

### 6. SSL and Security

#### SSL Certificates
- Render automatically provides SSL certificates
- Ensure HTTPS is enforced in production
- Update all environment variables to use HTTPS URLs

#### Security Headers
- Helmet.js is configured in both services
- CORS is properly configured
- Rate limiting is enabled

### 7. Monitoring and Logging

#### Application Monitoring
1. Enable Render's built-in monitoring
2. Set up alerts for service health
3. Monitor resource usage and performance

#### Logging Configuration
- Winston logging is configured
- Logs are available in Render dashboard
- Structured logging for better debugging

### 8. Testing Deployment

#### Health Checks
1. Test main application: `https://sentia-manufacturing-production.onrender.com/health`
2. Test MCP server: `https://mcp-server-tkyu.onrender.com/health`
3. Test authentication flow
4. Test AI/ML features
5. Test real-time data streaming

#### Feature Verification
- [ ] User authentication works
- [ ] Dashboard loads correctly
- [ ] AI forecasting functions
- [ ] Real-time monitoring works
- [ ] Manufacturing modules function
- [ ] MCP server responds
- [ ] WebSocket connections work

### 9. Performance Optimization

#### Frontend Optimization
- Code splitting is implemented
- Lazy loading is configured
- Bundle size optimization
- CDN for static assets

#### Backend Optimization
- Connection pooling
- Caching strategies
- Rate limiting
- Compression enabled

### 10. Backup and Recovery

#### Database Backups
- Render provides automatic PostgreSQL backups
- Configure backup retention policy
- Test restore procedures

#### Application Backups
- GitHub repository serves as code backup
- Environment variables are documented
- Configuration files are version controlled

## Troubleshooting

### Common Issues

#### 1. Authentication Issues
- Verify Clerk keys are correct
- Check domain configuration in Clerk
- Ensure webhook URLs are accessible

#### 2. MCP Server Connection Issues
- Verify MCP server is running
- Check network connectivity
- Validate JWT secrets match

#### 3. Database Connection Issues
- Verify DATABASE_URL format
- Check database service status
- Validate connection permissions

#### 4. Build Failures
- Check Node.js version compatibility
- Verify all dependencies are available
- Review build logs for specific errors

### Debug Commands

#### Check Service Health
```bash
# Main application
curl https://sentia-manufacturing-production.onrender.com/health

# MCP server
curl https://mcp-server-tkyu.onrender.com/health
```

#### Test Authentication
```bash
# Test Clerk integration
curl -H "Authorization: Bearer [TOKEN]" https://sentia-manufacturing-production.onrender.com/api/users/me
```

#### Test MCP Server
```bash
# Test MCP tools
curl -H "Authorization: Bearer [MCP_TOKEN]" https://mcp-server-tkyu.onrender.com/mcp/tools
```

## Maintenance

### Regular Tasks
1. Monitor service health daily
2. Review logs weekly
3. Update dependencies monthly
4. Backup database weekly
5. Test disaster recovery quarterly

### Updates and Deployments
1. Test changes in staging environment
2. Deploy during maintenance windows
3. Monitor deployment health
4. Rollback if issues detected

## Support

### Documentation
- Technical specifications: `.specify/` directory
- API documentation: Available at `/api/docs`
- Component documentation: In component files

### Contact
- Technical support: [Your support email]
- Emergency contact: [Your emergency contact]
- Documentation: [Your documentation URL]

---

## Quick Start Commands

```bash
# Deploy main application
render deploy

# Deploy MCP server
cd mcp-server && render deploy

# Check deployment status
render service list

# View logs
render logs --service sentia-manufacturing-production
render logs --service sentia-mcp-server
```

This deployment guide ensures your Sentia Manufacturing Dashboard is deployed with all enterprise-level features, AI/ML capabilities, and proper security configurations.
