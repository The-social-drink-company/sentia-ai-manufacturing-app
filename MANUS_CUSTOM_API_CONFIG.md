# Manus Custom API Configuration for Sentia Manufacturing Dashboard

## 1. RENDER API CONFIGURATION
**Name:** Render Dashboard Management
**Description:** Complete Render API access for managing Sentia Manufacturing Dashboard deployments, environment variables, service monitoring, and deployment triggers across development, testing, and production environments.

### Required Secrets (Environment Variables):
```yaml
# Core Render API Access
RENDER_API_TOKEN: "rnd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# Get from: https://dashboard.render.com/account/api-keys

# Service IDs (ACTUAL SERVICE IDS)
RENDER_SERVICE_ID_DEV: "sentia-manufacturing-development"
# Service: sentia-manufacturing-development

RENDER_SERVICE_ID_TEST: "sentia-manufacturing-testing"
# Service: sentia-manufacturing-testing

RENDER_SERVICE_ID_PROD: "sentia-manufacturing-production"
# Service: sentia-manufacturing-production

# Database Service IDs (ACTUAL RENDER POSTGRESQL IDS)
RENDER_DB_ID_DEV: "dpg-d344rkfdiees73a20c50-a"
# Database: sentia-manufacturing-dev

RENDER_DB_ID_TEST: "dpg-d344rkfdiees73a20c40-a"
# Database: sentia-manufacturing-test

RENDER_DB_ID_PROD: "dpg-d344rkfdiees73a20c30-a"
# Database: sentia-manufacturing-prod

# MCP Server Service ID (ACTUAL SERVICE ID)
RENDER_MCP_SERVICE_ID: "srv-d34fefur433s73cifuv0"
# Service: mcp-server-tkyu

# Render Account Details
RENDER_OWNER_ID: "usr-xxxxxxxxxxxxxxxxxxxxx"
# Your Render user/team ID

RENDER_PROJECT_NAME: "sentia-manufacturing-dashboard"
```

### API Endpoints to Enable:
```yaml
base_url: "https://api.render.com/v1"
endpoints:
  - GET /services/{serviceId} # Get service details
  - GET /services/{serviceId}/env-vars # Get environment variables
  - PUT /services/{serviceId}/env-vars # Update environment variables
  - POST /services/{serviceId}/deploys # Trigger deployment
  - GET /services/{serviceId}/deploys # List deployments
  - POST /services/{serviceId}/restart # Restart service
  - GET /services/{serviceId}/logs # Get service logs
  - GET /services/{serviceId}/metrics # Get performance metrics
```

## 2. GITHUB API CONFIGURATION
**Name:** GitHub Repository Management
**Description:** Full GitHub API access for managing code, branches, pull requests, issues, and deployments for the Sentia Manufacturing Dashboard repository.

### Required Secrets:
```yaml
# GitHub Personal Access Token (with repo, workflow, admin:org permissions)
GITHUB_TOKEN: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# Create at: https://github.com/settings/tokens/new

# Repository Details
GITHUB_OWNER: "The-social-drink-company"
GITHUB_REPO: "sentia-manufacturing-dashboard"
GITHUB_DEFAULT_BRANCH: "development"

# Branch Names
GITHUB_BRANCH_DEV: "development"
GITHUB_BRANCH_TEST: "test"
GITHUB_BRANCH_PROD: "production"

# Webhook Secret (for GitHub Actions)
GITHUB_WEBHOOK_SECRET: "whsec_xxxxxxxxxxxxxxxxxxxxx"
```

### API Endpoints to Enable:
```yaml
base_url: "https://api.github.com"
endpoints:
  - GET /repos/{owner}/{repo} # Repository info
  - GET /repos/{owner}/{repo}/branches # List branches
  - POST /repos/{owner}/{repo}/pulls # Create pull request
  - GET /repos/{owner}/{repo}/commits # List commits
  - POST /repos/{owner}/{repo}/dispatches # Trigger workflow
  - GET /repos/{owner}/{repo}/actions/runs # List workflow runs
  - POST /repos/{owner}/{repo}/merges # Merge branches
  - GET /repos/{owner}/{repo}/contents/{path} # Read files
  - PUT /repos/{owner}/{repo}/contents/{path} # Update files
```

## 3. CLERK AUTHENTICATION API
**Name:** Clerk User & Authentication Management
**Description:** Complete Clerk API access for managing users, authentication, roles, permissions, and session management.

### Required Secrets:
```yaml
# Production Clerk Keys
CLERK_SECRET_KEY: "sk_live_mzgSFm1q9VrzngMMaCTNNwPEqBmr75vVxiND1DO7wq"
CLERK_PUBLISHABLE_KEY: "pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ"

# Clerk API Keys for Management
CLERK_API_KEY: "sk_live_xxxxxxxxxxxxxxxxxxxxx"
# Get from: https://dashboard.clerk.com/apps/[app-id]/api-keys

# Clerk Instance Details
CLERK_INSTANCE_ID: "ins_xxxxxxxxxxxxxxxxxxxxx"
CLERK_DOMAIN: "financeflo.ai"
CLERK_FRONTEND_API: "https://financeflo.ai"

# Webhook Endpoints
CLERK_WEBHOOK_SECRET: "whsec_xxxxxxxxxxxxxxxxxxxxx"
CLERK_WEBHOOK_ENDPOINT: "https://sentia-manufacturing-production.onrender.com/api/webhooks/clerk"
```

### API Endpoints to Enable:
```yaml
base_url: "https://api.clerk.com/v1"
endpoints:
  - GET /users # List users
  - POST /users # Create user
  - PATCH /users/{userId} # Update user
  - DELETE /users/{userId} # Delete user
  - GET /organizations # List organizations
  - POST /invitations # Send invitations
  - GET /sessions # List sessions
  - POST /sessions/{sessionId}/revoke # Revoke session
```

## 4. DATABASE API CONFIGURATION
**Name:** PostgreSQL Database Management (Render)
**Description:** Direct database access for Sentia Manufacturing data management, queries, and migrations using Render PostgreSQL with pgvector.

### Required Secrets:
```yaml
# Production Database (Render PostgreSQL)
DATABASE_URL: "postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a/sentia_manufacturing_prod"
EXTERNAL_DATABASE_URL: "postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a.oregon-postgres.render.com/sentia_manufacturing_prod"

# Testing Database (Render PostgreSQL)
TEST_DATABASE_URL: "postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a/sentia_manufacturing_test"
TEST_EXTERNAL_DATABASE_URL: "postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a.oregon-postgres.render.com/sentia_manufacturing_test"

# Development Database (Render PostgreSQL)
DEV_DATABASE_URL: "postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a/sentia_manufacturing_dev"
DEV_EXTERNAL_DATABASE_URL: "postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_dev"

# Database Pool Configuration
DB_POOL_MIN: "5"
DB_POOL_MAX: "50"
DB_POOL_IDLE_TIMEOUT: "30000"
DB_POOL_CONNECTION_TIMEOUT: "10000"
DB_QUERY_TIMEOUT: "30000"

# Prisma Configuration
PRISMA_SCHEMA_PATH: "./prisma/schema.prisma"
```

## 5. EXTERNAL SERVICE APIS
**Name:** Manufacturing System Integrations
**Description:** API access for all external manufacturing and business systems.

### Required Secrets:
```yaml
# Xero Accounting
XERO_CLIENT_ID: "xxxxxxxxxxxxxxxxxxxxx"
XERO_CLIENT_SECRET: "xxxxxxxxxxxxxxxxxxxxx"
XERO_TENANT_ID: "xxxxxxxxxxxxxxxxxxxxx"
XERO_REDIRECT_URI: "https://sentia-manufacturing-production.onrender.com/auth/xero/callback"

# Amazon SP-API
AMAZON_CLIENT_ID: "amzn1.application-oa2-client.xxxxxxxxxxxxx"
AMAZON_CLIENT_SECRET: "xxxxxxxxxxxxxxxxxxxxx"
AMAZON_REFRESH_TOKEN: "Atzr|xxxxxxxxxxxxxxxxxxxxx"
AMAZON_ACCESS_KEY: "AKIA_xxxxxxxxxxxxxxxxxxxxx"
AMAZON_SECRET_KEY: "xxxxxxxxxxxxxxxxxxxxx"
AMAZON_REGION: "us-west-2"
AMAZON_MARKETPLACE_ID: "ATVPDKIKX0DER"

# Shopify
SHOPIFY_STORE_DOMAIN: "sentiadrinks.myshopify.com"
SHOPIFY_ADMIN_ACCESS_TOKEN: "shpat_xxxxxxxxxxxxxxxxxxxxx"
SHOPIFY_STOREFRONT_ACCESS_TOKEN: "xxxxxxxxxxxxxxxxxxxxx"
SHOPIFY_WEBHOOK_SECRET: "xxxxxxxxxxxxxxxxxxxxx"

# Unleashed Software
UNLEASHED_API_ID: "xxxxxxxxxxxxxxxxxxxxx"
UNLEASHED_API_KEY: "xxxxxxxxxxxxxxxxxxxxx"
UNLEASHED_API_URL: "https://api.unleashedsoftware.com"

# HubSpot CRM
HUBSPOT_API_KEY: "xxxxxxxxxxxxxxxxxxxxx"
HUBSPOT_ACCESS_TOKEN: "xxxxxxxxxxxxxxxxxxxxx"
HUBSPOT_PORTAL_ID: "xxxxxxxxxxxxx"

# Stripe Payments
STRIPE_SECRET_KEY: "sk_live_xxxxxxxxxxxxxxxxxxxxx"
STRIPE_PUBLISHABLE_KEY: "pk_live_xxxxxxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET: "whsec_xxxxxxxxxxxxxxxxxxxxx"

# SendGrid Email
SENDGRID_API_KEY: "SG.xxxxxxxxxxxxxxxxxxxxx"
SENDGRID_FROM_EMAIL: "notifications@financeflo.ai"
```

## 6. AI/ML SERVICE APIS
**Name:** AI and Machine Learning Services
**Description:** API access for AI models, forecasting, and intelligent analytics.

### Required Secrets:
```yaml
# OpenAI
OPENAI_API_KEY: "sk-xxxxxxxxxxxxxxxxxxxxx"
OPENAI_ORG_ID: "org-xxxxxxxxxxxxxxxxxxxxx"

# Anthropic Claude
ANTHROPIC_API_KEY: "sk-ant-xxxxxxxxxxxxxxxxxxxxx"

# Google AI
GOOGLE_AI_API_KEY: "AIzaSy_xxxxxxxxxxxxxxxxxxxxx"

# Cohere
COHERE_API_KEY: "xxxxxxxxxxxxxxxxxxxxx"

# MCP Server
MCP_SERVER_URL: "https://mcp-server-tkyu.onrender.com"
MCP_JWT_SECRET: "sentia-mcp-secret-key"
MCP_API_KEY: "mcp_xxxxxxxxxxxxxxxxxxxxx"
```

## 7. MONITORING & ANALYTICS APIS
**Name:** System Monitoring and Analytics
**Description:** API access for monitoring, logging, and analytics services.

### Required Secrets:
```yaml
# Datadog
DATADOG_API_KEY: "xxxxxxxxxxxxxxxxxxxxx"
DATADOG_APP_KEY: "xxxxxxxxxxxxxxxxxxxxx"
DATADOG_SITE: "datadoghq.com"

# New Relic
NEW_RELIC_LICENSE_KEY: "xxxxxxxxxxxxxxxxxxxxx"
NEW_RELIC_APP_NAME: "Sentia Manufacturing Dashboard"

# Sentry Error Tracking
SENTRY_DSN: "https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
SENTRY_AUTH_TOKEN: "xxxxxxxxxxxxxxxxxxxxx"
SENTRY_ORG: "sentia"
SENTRY_PROJECT: "manufacturing-dashboard"

# LogDNA/Mezmo
LOGDNA_INGESTION_KEY: "xxxxxxxxxxxxxxxxxxxxx"

# Google Analytics
GA_MEASUREMENT_ID: "G-xxxxxxxxxxxxx"
GA_API_SECRET: "xxxxxxxxxxxxxxxxxxxxx"
```

## 8. CACHE & STORAGE APIS
**Name:** Cache and Storage Services
**Description:** API access for Redis cache and cloud storage services.

### Required Secrets:
```yaml
# Redis Cache
REDIS_URL: "redis://default:password@host:6379"
REDIS_HOST: "redis-xxxxx.c1.us-west-2.ec2.cloud.redislabs.com"
REDIS_PORT: "6379"
REDIS_PASSWORD: "xxxxxxxxxxxxxxxxxxxxx"
REDIS_TLS_ENABLED: "true"

# AWS S3 Storage
AWS_ACCESS_KEY_ID: "AKIA_xxxxxxxxxxxxxxxxxxxxx"
AWS_SECRET_ACCESS_KEY: "xxxxxxxxxxxxxxxxxxxxx"
AWS_REGION: "us-west-2"
AWS_S3_BUCKET: "sentia-manufacturing-assets"

# Cloudinary (Image/Media)
CLOUDINARY_CLOUD_NAME: "sentia"
CLOUDINARY_API_KEY: "xxxxxxxxxxxxxxxxxxxxx"
CLOUDINARY_API_SECRET: "xxxxxxxxxxxxxxxxxxxxx"
```

## 9. DEPLOYMENT & CI/CD APIS
**Name:** Deployment and CI/CD Pipeline
**Description:** API access for automated deployment and continuous integration services.

### Required Secrets:
```yaml
# GitHub Actions
ACTIONS_RUNNER_TOKEN: "xxxxxxxxxxxxxxxxxxxxx"
ACTIONS_DEPLOY_KEY: "xxxxxxxxxxxxxxxxxxxxx"

# Docker Hub (if needed)
DOCKER_USERNAME: "sentiamanufacturing"
DOCKER_PASSWORD: "xxxxxxxxxxxxxxxxxxxxx"
DOCKER_REGISTRY: "docker.io"

# NPM Registry
NPM_TOKEN: "npm_xxxxxxxxxxxxxxxxxxxxx"

# Deployment Webhooks
DEPLOY_WEBHOOK_DEV: "[GET_FROM_RENDER_SERVICE_SETTINGS]"
DEPLOY_WEBHOOK_TEST: "[GET_FROM_RENDER_SERVICE_SETTINGS]"
DEPLOY_WEBHOOK_PROD: "[GET_FROM_RENDER_SERVICE_SETTINGS]"
MCP_DEPLOY_HOOK: "https://api.render.com/deploy/srv-d34fefur433s73cifuv0?key=ANE5o0AJZjg"
```

## 10. CUSTOM DOMAIN & SSL CONFIGURATION
**Name:** Domain and SSL Management
**Description:** Configuration for custom domains and SSL certificates.

### Required Configuration:
```yaml
# Domain Configuration
PRIMARY_DOMAIN: "rendprod.financeflo.ai"
DEV_DOMAIN: "renddev.financeflo.ai"
TEST_DOMAIN: "rendtest.financeflo.ai"

# SSL Configuration
SSL_CERT_ARN: "arn:aws:acm:us-west-2:xxxxx:certificate/xxxxx"
SSL_AUTO_RENEW: "true"

# DNS Configuration
CLOUDFLARE_API_TOKEN: "xxxxxxxxxxxxxxxxxxxxx"
CLOUDFLARE_ZONE_ID: "xxxxxxxxxxxxxxxxxxxxx"
```

## MCP SERVER CONFIGURATION FOR MANUS

### MCP Server Setup (VERIFIED HEALTHY ✅)
**Status:** Operational - Uptime 27.5+ hours
**Version:** 2.0.0-enterprise-simple
**Features:** Manufacturing, AI integration, Real-time, Enterprise enabled

```yaml
# MCP Server Connection for Manus
Server Name: "Sentia Manufacturing Enterprise MCP"
Transport Type: "HTTP"
Server URL: "https://mcp-server-tkyu.onrender.com"
Service ID: "srv-d34fefur433s73cifuv0"
Deploy Hook: "https://api.render.com/deploy/srv-d34fefur433s73cifuv0?key=ANE5o0AJZjg"
Health Check: "https://mcp-server-tkyu.onrender.com/health"

# MCP Capabilities
- Real-time manufacturing data
- Financial analytics and cash flow management
- AI-powered business intelligence
- Seasonal demand forecasting
- Working capital optimization
- Supply chain analytics
```

## MANUS INTEGRATION STEPS

### Step 1: Create API Configuration in Manus
1. Go to Manus API Settings
2. Click "Add Custom API"
3. Name: "Sentia Manufacturing Complete Access"
4. Copy this entire configuration

### Step 2: Get Required Tokens
1. **Render API Token**: https://dashboard.render.com/account/api-keys
2. **GitHub Token**: https://github.com/settings/tokens/new (select repo, workflow, admin scopes)
3. **Clerk API Key**: https://dashboard.clerk.com/apps/[your-app-id]/api-keys

### Step 3: Find Service IDs
1. Go to Render Dashboard
2. Click on each service (dev, test, prod)
3. Copy the service ID from the URL: `https://dashboard.render.com/web/srv-[THIS_PART]`

### Step 4: Configure Webhooks
1. Set up GitHub webhooks for auto-deployment
2. Configure Clerk webhooks for user events
3. Set up monitoring webhooks for alerts

### Step 5: Test Access
```bash
# Test Render API
curl -H "Authorization: Bearer YOUR_RENDER_API_TOKEN" \
  https://api.render.com/v1/services/YOUR_SERVICE_ID

# Test GitHub API
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/The-social-drink-company/sentia-manufacturing-dashboard

# Test Clerk API
curl -H "Authorization: Bearer YOUR_CLERK_API_KEY" \
  https://api.clerk.com/v1/users
```

## IMPORTANT NOTES

1. **Security**: Store all tokens securely in Manus's encrypted storage
2. **Rotation**: Rotate API keys every 90 days
3. **Monitoring**: Set up alerts for API rate limits
4. **Backup**: Keep backup tokens in a secure password manager
5. **Access Control**: Only grant minimum required permissions

## QUICK REFERENCE - MOST IMPORTANT KEYS

For immediate Manus setup, these are the essential keys:

```yaml
# CRITICAL - Must Obtain
RENDER_API_TOKEN: "[GET FROM RENDER DASHBOARD]"
GITHUB_TOKEN: "[CREATE WITH REPO ACCESS]"

# Service IDs (ACTUAL - Ready to Use)
RENDER_SERVICE_ID_PROD: "sentia-manufacturing-production"
RENDER_SERVICE_ID_DEV: "sentia-manufacturing-development"
RENDER_SERVICE_ID_TEST: "sentia-manufacturing-testing"
MCP_SERVER_SERVICE_ID: "srv-d34fefur433s73cifuv0"

# Database IDs (ACTUAL - Ready to Use)
RENDER_DB_ID_PROD: "dpg-d344rkfdiees73a20c30-a"
RENDER_DB_ID_TEST: "dpg-d344rkfdiees73a20c40-a"
RENDER_DB_ID_DEV: "dpg-d344rkfdiees73a20c50-a"

# Service URLs (Active & Verified)
PRODUCTION_URL: "https://sentia-manufacturing-production.onrender.com"
DEVELOPMENT_URL: "https://sentia-manufacturing-development.onrender.com"
TESTING_URL: "https://sentia-manufacturing-testing.onrender.com"
MCP_SERVER_URL: "https://mcp-server-tkyu.onrender.com" # ✅ HEALTHY - Uptime: 27.5+ hours
MCP_DEPLOY_HOOK: "https://api.render.com/deploy/srv-d34fefur433s73cifuv0?key=ANE5o0AJZjg"

# Already Configured
CLERK_SECRET_KEY: "sk_live_mzgSFm1q9VrzngMMaCTNNwPEqBmr75vVxiND1DO7wq"
DATABASE_URL_PROD: "postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a/sentia_manufacturing_prod"
```

---
**Last Updated:** 2025-09-20
**Configuration Version:** 1.0.0
**Contact:** admin@financeflo.ai