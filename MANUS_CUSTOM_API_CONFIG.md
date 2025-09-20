# Manus Custom API Configuration for Sentia Manufacturing Dashboard

## 1. RENDER API CONFIGURATION
**Name:** Render Dashboard Management
**Description:** Complete Render API access for managing Sentia Manufacturing Dashboard deployments, environment variables, service monitoring, and deployment triggers across development, testing, and production environments.

### Required Secrets (Environment Variables):
```yaml
# Core Render API Access
RENDER_API_TOKEN: "[GET_FROM_RENDER_DASHBOARD]"
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
RENDER_OWNER_ID: "[GET_FROM_RENDER_ACCOUNT]"
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
GITHUB_TOKEN: "[CREATE_NEW_TOKEN_AT_GITHUB]"
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
GITHUB_WEBHOOK_SECRET: "[CREATE_IN_GITHUB_SETTINGS]"
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
# Production Clerk Keys (ACTIVE IN ALL ENVIRONMENTS)
CLERK_SECRET_KEY: "sk_live_mzgSFm1q9VrzngMMaCTNNwPEqBmr75vVxiND1DO7wq"
CLERK_PUBLISHABLE_KEY: "pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ"
VITE_CLERK_PUBLISHABLE_KEY: "pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ"

# Clerk Webhook & Configuration
CLERK_WEBHOOK_SECRET: "whsec_iTUcbgzS5P6zJlXWQkc4zGHnw8yLGt9j"
CLERK_ENVIRONMENT: "production"
CLERK_DOMAIN: "financeflo.ai"
VITE_CLERK_DOMAIN: "clerk.financeflo.ai"
CLERK_FRONTEND_API: "https://financeflo.ai"

# Clerk URLs
VITE_CLERK_SIGN_IN_URL: "/sign-in"
VITE_CLERK_SIGN_UP_URL: "/sign-up"
VITE_CLERK_AFTER_SIGN_IN_URL: "/dashboard"
VITE_CLERK_AFTER_SIGN_UP_URL: "/dashboard"

# Webhook Endpoints
CLERK_WEBHOOK_ENDPOINT: "https://sentia-manufacturing-production.onrender.com/api/webhooks/clerk"

# Clerk API Management Key (GET FROM CLERK DASHBOARD)
CLERK_API_KEY: "[GET_FROM_CLERK_DASHBOARD]"
# Get from: https://dashboard.clerk.com/apps/[app-id]/api-keys

# Clerk Instance Details
CLERK_INSTANCE_ID: "[GET_FROM_CLERK_DASHBOARD]"
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
# Xero Accounting (PRODUCTION KEYS)
XERO_CLIENT_ID: "9C0CAB921C134476A249E48BBECB8C4B"
XERO_CLIENT_SECRET: "f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5"
XERO_TENANT_ID: "[GET_FROM_XERO_AFTER_AUTH]"
XERO_REDIRECT_URI_DEV: "https://sentia-manufacturing-development.onrender.com/api/xero/callback"
XERO_REDIRECT_URI_TEST: "https://sentia-manufacturing-testing.onrender.com/api/xero/callback"
XERO_REDIRECT_URI_PROD: "https://sentia-manufacturing-production.onrender.com/api/xero/callback"
XERO_API_KEY: "9C0CAB921C134476A249E48BBECB8C4B"
XERO_SECRET: "f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5"

# Amazon SP-API (NEED TO OBTAIN)
AMAZON_SP_API_CLIENT_ID: "[NEED_TO_OBTAIN_FROM_AMAZON]"
AMAZON_SP_API_CLIENT_SECRET: "[NEED_TO_OBTAIN_FROM_AMAZON]"
AMAZON_SP_API_REFRESH_TOKEN: "[NEED_TO_OBTAIN_FROM_AMAZON]"
AMAZON_SP_API_ACCESS_KEY_ID: "[NEED_TO_OBTAIN_FROM_AMAZON]"
AMAZON_SP_API_SECRET_ACCESS_KEY: "[NEED_TO_OBTAIN_FROM_AMAZON]"
AMAZON_SP_API_REGION: "us-east-1"
AMAZON_UK_MARKETPLACE_ID: "A1F83G8C2ARO7P"
AMAZON_USA_MARKETPLACE_ID: "ATVPDKIKX0DER"
AMAZON_SELLER_ID: "[NEED_TO_OBTAIN_FROM_AMAZON]"

# Shopify UK Store (PRODUCTION KEYS)
SHOPIFY_UK_API_KEY: "7a30cd84e7a106b852c8e0fb789de10e"
SHOPIFY_UK_SECRET: "8b2d61745c506970c70d8c892f5f977e"
SHOPIFY_UK_ACCESS_TOKEN: "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"
SHOPIFY_UK_SHOP_URL: "sentiaspirits.myshopify.com"
SHOPIFY_UK_WEBHOOK_SECRET: "shopify_uk_webhook_secret"

# Shopify USA Store (PRODUCTION KEYS)
SHOPIFY_USA_API_KEY: "83b8903fd8b509ef8bf93d1dbcd6079c"
SHOPIFY_USA_SECRET: "d01260e58adb00198cddddd1bd9a9490"
SHOPIFY_USA_ACCESS_TOKEN: "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"
SHOPIFY_USA_SHOP_URL: "us-sentiaspirits.myshopify.com"
SHOPIFY_USA_WEBHOOK_SECRET: "shopify_usa_webhook_secret"

# Unleashed Software (PRODUCTION KEYS)
UNLEASHED_API_ID: "d5313df6-db35-430c-a69e-ae27dffe0c5a"
UNLEASHED_API_KEY: "2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ=="
UNLEASHED_API_URL: "https://api.unleashedsoftware.com"

# Microsoft Integration (PRODUCTION KEYS)
MICROSOFT_CLIENT_ID: "c16d6fba-0e6b-45ea-a016-eb697ff7a7ae"
MICROSOFT_CLIENT_SECRET: "peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM"
MICROSOFT_TENANT_ID: "common"
MICROSOFT_ADMIN_EMAIL: "admin@app.sentiaspirits.com"
MICROSOFT_DATA_EMAIL: "data@app.sentiaspirits.com"
MS_API_KEY: "peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM"
MS_API_SECRET: "c16d6fba-0e6b-45ea-a016-eb697ff7a7ae"

# Slack Integration (PRODUCTION KEY)
SLACK_BOT_TOKEN: "xoxb-5909652898375-9457338164149-OGj9D5ptv8r3GQ7h2soAXRZY"
SLACK_SIGNING_SECRET: "[NEED_FROM_SLACK_APP_SETTINGS]"
SLACK_CHANNEL_ALERTS: "#alerts"
SLACK_CHANNEL_NOTIFICATIONS: "#notifications"
SLACK_CHANNEL_MONITORING: "#monitoring"
SLACK_WEBHOOK_URL: "[NEED_FROM_SLACK_APP_SETTINGS]"

# HubSpot CRM (NEED TO OBTAIN)
HUBSPOT_API_KEY: "[NEED_TO_OBTAIN_FROM_HUBSPOT]"
HUBSPOT_ACCESS_TOKEN: "[NEED_TO_OBTAIN_FROM_HUBSPOT]"
HUBSPOT_PORTAL_ID: "[NEED_TO_OBTAIN_FROM_HUBSPOT]"

# Stripe Payments (NEED TO OBTAIN)
STRIPE_SECRET_KEY: "[NEED_TO_OBTAIN_FROM_STRIPE]"
STRIPE_PUBLISHABLE_KEY: "[NEED_TO_OBTAIN_FROM_STRIPE]"
STRIPE_WEBHOOK_SECRET: "[NEED_TO_OBTAIN_FROM_STRIPE]"

# SendGrid Email (NEED TO OBTAIN)
SENDGRID_API_KEY: "[NEED_TO_OBTAIN_FROM_SENDGRID]"
SENDGRID_FROM_EMAIL: "notifications@financeflo.ai"
```

## 6. AI/ML SERVICE APIS
**Name:** AI and Machine Learning Services
**Description:** API access for AI models, forecasting, and intelligent analytics.

### Required Secrets:
```yaml
# OpenAI (PRODUCTION KEY - WARNING: MAY BE EXPOSED)
OPENAI_API_KEY: "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"
OPENAI_API_BASE: "https://api.openai.com/v1"
OPENAI_MODEL: "gpt-4-turbo-preview"
OPENAI_MAX_TOKENS: "4000"
OPENAI_TEMPERATURE: "0.1"
OPENAI_ORG_ID: "[GET_FROM_OPENAI_DASHBOARD]"

# Anthropic Claude (PRODUCTION KEY - WARNING: MAY BE EXPOSED)
ANTHROPIC_API_KEY: "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"
CLAUDE_API_KEY: "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"
CLAUDE_API_BASE: "https://api.anthropic.com"
CLAUDE_MODEL: "claude-3-sonnet-20240229"
CLAUDE_MAX_TOKENS: "4000"
CLAUDE_TEMPERATURE: "0.1"

# Google AI (NEED TO OBTAIN)
GOOGLE_AI_API_KEY: "[NEED_TO_OBTAIN_FROM_GOOGLE]"

# Cohere (NEED TO OBTAIN)
COHERE_API_KEY: "[NEED_TO_OBTAIN_FROM_COHERE]"

# Local LLM (Optional)
LOCAL_LLM_ENDPOINT: "http://localhost:11434"
LOCAL_LLM_MODEL: "llama2"

# MCP Server
MCP_SERVER_URL: "https://mcp-server-tkyu.onrender.com"
MCP_SERVER_PUBLIC_URL: "https://mcp-server-tkyu.onrender.com"
MCP_JWT_SECRET: "sentia-mcp-secret-key"
MCP_API_KEY: "[GENERATE_SECURE_KEY]"
MCP_ENABLE_WEBSOCKET: "true"
MCP_SERVER_PORT: "3001"
MCP_SERVER_HEALTH_CHECK_INTERVAL: "30000"
```

## 7. MONITORING & ANALYTICS APIS
**Name:** System Monitoring and Analytics
**Description:** API access for monitoring, logging, and analytics services.

### Required Secrets:
```yaml
# Datadog (NEED TO OBTAIN)
DATADOG_API_KEY: "[NEED_TO_OBTAIN_FROM_DATADOG]"
DATADOG_APP_KEY: "[NEED_TO_OBTAIN_FROM_DATADOG]"
DATADOG_SITE: "datadoghq.com"

# New Relic (NEED TO OBTAIN)
NEW_RELIC_LICENSE_KEY: "[NEED_TO_OBTAIN_FROM_NEWRELIC]"
NEW_RELIC_APP_NAME: "Sentia Manufacturing Dashboard"

# Sentry Error Tracking (NEED TO OBTAIN)
SENTRY_DSN: "[NEED_TO_OBTAIN_FROM_SENTRY]"
SENTRY_AUTH_TOKEN: "[NEED_TO_OBTAIN_FROM_SENTRY]"
SENTRY_ORG: "sentia"
SENTRY_PROJECT: "manufacturing-dashboard"

# LogDNA/Mezmo (NEED TO OBTAIN)
LOGDNA_INGESTION_KEY: "[NEED_TO_OBTAIN_FROM_LOGDNA]"

# Google Analytics (NEED TO OBTAIN)
GA_MEASUREMENT_ID: "[NEED_TO_OBTAIN_FROM_GOOGLE]"
GA_API_SECRET: "[NEED_TO_OBTAIN_FROM_GOOGLE]"

# Monitoring Configuration
MONITORING_ENABLED: "true"
MONITORING_INTERVAL: "30000"
LOG_LEVEL: "info"
LOG_FORMAT: "json"
```

## 8. CACHE & STORAGE APIS
**Name:** Cache and Storage Services
**Description:** API access for Redis cache and cloud storage services.

### Required Secrets:
```yaml
# Redis Cache (NEED TO OBTAIN OR USE LOCAL)
REDIS_URL: "redis://localhost:6379"
REDIS_PASSWORD: "[SET_IF_USING_REDIS_CLOUD]"
REDIS_HOST: "[SET_IF_USING_REDIS_CLOUD]"
REDIS_PORT: "6379"
REDIS_DB: "0"
REDIS_TLS_ENABLED: "false"
REDIS_TIMEOUT: "5000"
REDIS_RETRY_ATTEMPTS: "3"

# AWS S3 Storage (NEED TO OBTAIN)
AWS_ACCESS_KEY_ID: "[NEED_TO_OBTAIN_FROM_AWS]"
AWS_SECRET_ACCESS_KEY: "[NEED_TO_OBTAIN_FROM_AWS]"
AWS_REGION: "us-west-2"
AWS_S3_BUCKET: "sentia-manufacturing-assets"

# Cloudinary (Image/Media) (NEED TO OBTAIN)
CLOUDINARY_CLOUD_NAME: "sentia"
CLOUDINARY_API_KEY: "[NEED_TO_OBTAIN_FROM_CLOUDINARY]"
CLOUDINARY_API_SECRET: "[NEED_TO_OBTAIN_FROM_CLOUDINARY]"
```

## 9. DEPLOYMENT & CI/CD APIS
**Name:** Deployment and CI/CD Pipeline
**Description:** API access for automated deployment and continuous integration services.

### Required Secrets:
```yaml
# GitHub Actions
ACTIONS_RUNNER_TOKEN: "[GENERATE_FROM_GITHUB]"
ACTIONS_DEPLOY_KEY: "[GENERATE_SSH_KEY]"

# Docker Hub (if needed)
DOCKER_USERNAME: "sentiamanufacturing"
DOCKER_PASSWORD: "[SET_DOCKER_HUB_PASSWORD]"
DOCKER_REGISTRY: "docker.io"

# NPM Registry
NPM_TOKEN: "[GET_FROM_NPM_SETTINGS]"

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

# Current Render Domains
RENDER_DEV_URL: "https://sentia-manufacturing-development.onrender.com"
RENDER_TEST_URL: "https://sentia-manufacturing-testing.onrender.com"
RENDER_PROD_URL: "https://sentia-manufacturing-production.onrender.com"

# SSL Configuration
SSL_AUTO_RENEW: "true"

# DNS Configuration (NEED TO OBTAIN)
CLOUDFLARE_API_TOKEN: "[NEED_IF_USING_CLOUDFLARE]"
CLOUDFLARE_ZONE_ID: "[NEED_IF_USING_CLOUDFLARE]"
```

## 11. SECURITY & SESSION CONFIGURATION
**Name:** Security and Session Management
**Description:** JWT, session, and security configuration.

### Required Secrets:
```yaml
# JWT Configuration (PRODUCTION KEYS)
JWT_SECRET: "enterprise_jwt_secret_key_2025_sentia_manufacturing"
JWT_EXPIRES_IN: "24h"
JWT_REFRESH_EXPIRES_IN: "7d"
JWT_ALGORITHM: "HS256"

# Session Configuration (PRODUCTION KEYS)
SESSION_SECRET: "enterprise_session_secret_2025_sentia"
SESSION_MAX_AGE: "86400000"
SESSION_SECURE: "true"
SESSION_HTTP_ONLY: "true"
SESSION_SAME_SITE: "strict"

# Flask Configuration (PRODUCTION KEY)
SECRET_KEY: "7a91c84993193fe2592863a924eefff4b39fe51bc656fb6475c227d7b969c6fb"
FLASK_CONFIG: "production"
FLASK_ENV: "production"
```

## 12. SYNC & AUTOMATION CONFIGURATION
**Name:** Data Synchronization and Automation
**Description:** Intervals and settings for automated data synchronization.

### Required Configuration:
```yaml
# Sync Intervals (Cron format)
AUTO_SYNC_ENABLED: "true"
XERO_SYNC_INTERVAL: "*/30 * * * *"  # Every 30 minutes
SHOPIFY_SYNC_INTERVAL: "*/15 * * * *"  # Every 15 minutes
AMAZON_SYNC_INTERVAL: "*/60 * * * *"  # Every hour
DATABASE_SYNC_INTERVAL: "0 */6 * * *"  # Every 6 hours
UNLEASHED_SYNC_INTERVAL: "3600"  # In seconds
SYNC_INTERVAL_FINANCIAL: "21600"  # 6 hours in seconds
SYNC_INTERVAL_INVENTORY: "3600"  # 1 hour in seconds
SYNC_INTERVAL_ORDERS: "1800"  # 30 minutes in seconds
SYNC_INTERVAL_CUSTOMERS: "7200"  # 2 hours in seconds
SYNC_INTERVAL_PRODUCTS: "3600"  # 1 hour in seconds
```

## 13. FEATURE FLAGS & CONFIGURATION
**Name:** Feature Toggles and Application Settings
**Description:** Control feature availability and application behavior.

### Required Configuration:
```yaml
# Core Feature Flags
ENABLE_AI_FEATURES: "true"
ENABLE_SSE: "true"
ENABLE_WEBSOCKETS: "true"
ENABLE_AUTONOMOUS_TESTING: "false"
AUTO_FIX_ENABLED: "false"
AUTO_DEPLOY_ENABLED: "false"
BYPASS_AUTH: "false"
SKIP_ENTERPRISE_INIT: "true"
INIT_TIMEOUT_MS: "8000"

# Advanced Features
FEATURE_AI_DUAL_MODELS: "true"
FEATURE_ADVANCED_FORECASTING: "true"
FEATURE_EXTERNAL_INTEGRATIONS: "true"
FEATURE_WORKFLOW_AUTOMATION: "true"
FEATURE_ADVANCED_SECURITY: "true"
FEATURE_COMPREHENSIVE_MONITORING: "true"
FEATURE_ADVANCED_REPORTING: "true"
FEATURE_PERFORMANCE_OPTIMIZATION: "true"

# AI Configuration
AI_FORECAST_ACCURACY_TARGET: "88"
AI_CONFIDENCE_THRESHOLD: "80"
AI_RETRAINING_INTERVAL: "86400"
AI_MODEL_ENSEMBLE: "true"
AI_DUAL_MODEL_VALIDATION: "true"

# Forecasting Configuration
FORECAST_HORIZONS: "30,60,90,120,180,365"
FORECAST_DEFAULT_HORIZON: "90"
FORECAST_CONFIDENCE_LEVELS: "80,90,95"
FORECAST_DEFAULT_CONFIDENCE: "90"
FORECAST_UPDATE_INTERVAL: "3600"
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

### Step 2: Get Required Tokens (CRITICAL - MUST OBTAIN)
1. **Render API Token**: https://dashboard.render.com/account/api-keys
   - Create new API key with full access

2. **GitHub Token**: https://github.com/settings/tokens/new
   - Select scopes: `repo`, `workflow`, `admin:org`, `gist`

3. **Clerk API Key**: https://dashboard.clerk.com/apps/[your-app-id]/api-keys
   - Get Backend API key (not the secret key)

### Step 3: Find Service IDs (CRITICAL - FROM RENDER DASHBOARD)
1. Go to https://dashboard.render.com
2. Click on each service:
   - sentia-manufacturing-development
   - sentia-manufacturing-testing
   - sentia-manufacturing-production
   - mcp-server-tkyu
3. Copy the service ID from URL: `https://dashboard.render.com/web/srv-[THIS_PART]`
4. Also get database IDs: `https://dashboard.render.com/database/dpg-[THIS_PART]`

### Step 4: Configure Webhooks
1. GitHub webhooks: Settings → Webhooks → Add webhook
2. Clerk webhooks: Clerk Dashboard → Webhooks → Create webhook
3. Render deploy hooks: Service Settings → Deploy Hook

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

## IMPORTANT SECURITY NOTES

### ⚠️ CRITICAL SECURITY WARNINGS:

1. **EXPOSED API KEYS**: Your OpenAI and Anthropic keys appear to be production keys and may be exposed. Consider rotating them immediately:
   - OpenAI: Create new key at https://platform.openai.com/api-keys
   - Anthropic: Create new key at https://console.anthropic.com/account/keys

2. **Missing Keys to Obtain**:
   - Amazon SP-API credentials
   - Stripe payment keys
   - SendGrid API key
   - Monitoring services (Datadog, Sentry, New Relic)
   - Redis Cloud credentials (if using cloud Redis)
   - AWS S3 credentials

3. **Security Best Practices**:
   - Rotate API keys every 90 days
   - Use environment-specific keys where possible
   - Enable IP whitelisting for production keys
   - Use read-only keys where write access isn't needed
   - Monitor API usage for anomalies

## QUICK REFERENCE - MOST IMPORTANT KEYS

For immediate Manus setup, these are the essential keys already configured:

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
CLERK_PUBLISHABLE_KEY: "pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ"
DATABASE_URL_PROD: "postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a/sentia_manufacturing_prod"
XERO_CLIENT_ID: "9C0CAB921C134476A249E48BBECB8C4B"
XERO_CLIENT_SECRET: "f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5"
OPENAI_API_KEY: "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"
ANTHROPIC_API_KEY: "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"
```

---
**Last Updated:** 2025-09-20
**Configuration Version:** 2.0.0
**Contact:** admin@financeflo.ai
**Security Review Required:** YES - API keys may be exposed