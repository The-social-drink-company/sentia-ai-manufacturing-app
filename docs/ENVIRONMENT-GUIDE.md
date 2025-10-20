# Environment Variable Configuration Guide

## Overview
This guide provides comprehensive documentation for all environment variables used in the CapLiquify Manufacturing Platform. Variables are categorized by functionality and deployment environment.

---

## Environment Structure

### Development (.env.development)
Local development environment with hot reloading and debug features.

### Test (.env.test)
Testing environment with mock services and test data.

### Production (.env.production)
Production environment with enterprise security and monitoring.

---

## Required Variables

### 🔐 Authentication (Clerk)
**Critical for user authentication and authorization**

```bash
# Clerk Authentication - REQUIRED
CLERK_SECRET_KEY="sk_live_xxxxxxxxxxxxxxxxxxxx"
# Server-side secret key for Clerk authentication
# Location: Clerk Dashboard > API Keys > Secret keys
# Format: sk_live_... (production) or sk_test_... (development)

VITE_CLERK_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxxxxxxxxxx"
# Client-side publishable key for Clerk
# Location: Clerk Dashboard > API Keys > Publishable keys
# Format: pk_live_... (production) or pk_test_... (development)
# Note: VITE_ prefix makes it available to frontend
```

### 🗄️ Database Configuration
**PostgreSQL database connections via Neon**

```bash
# Primary Database - REQUIRED
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"
# Production database connection string
# Source: Neon Console > Connection Details
# Format: postgresql://user:pass@host:5432/db?sslmode=require
# Example: postgresql://user123:pass456@ep-example-123456.us-east-1.aws.neon.tech:5432/sentia_production?sslmode=require

# Development Database - REQUIRED for local development
DEV_DATABASE_URL="postgresql://dev_user:dev_pass@localhost:5432/sentia_dev"
# Local or development database connection
# Can be local PostgreSQL or separate Neon database

# Test Database - REQUIRED for testing
TEST_DATABASE_URL="postgresql://test_user:test_pass@localhost:5432/sentia_test"
# Test database for running test suites
# Should be isolated from production data
```

### 🔒 Security Keys
**JWT and session management**

```bash
# JWT Secret - REQUIRED
JWT_SECRET="your-super-secure-jwt-secret-key-min-32-chars"
# Secret key for JWT token signing
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Minimum 32 characters, use cryptographically secure random string

# Session Secret - REQUIRED
SESSION_SECRET="your-super-secure-session-secret-min-32-chars"
# Secret for session management
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Different from JWT_SECRET for security

# CSRF Protection - REQUIRED for production
CSRF_SECRET="your-super-secure-csrf-secret-min-32-chars"
# Secret for CSRF token generation
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Optional Enhancement Variables

### 🤖 AI & Machine Learning
**OpenAI integration for forecasting**

```bash
# OpenAI API Key - OPTIONAL but recommended
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# OpenAI API key for GPT-4 forecasting capabilities
# Source: OpenAI Platform > API Keys
# Enables: AI-powered demand forecasting, market insights, anomaly detection
# Cost: Pay-per-token usage, monitor with cost tracking
# Alternative: System uses statistical fallback models if not provided

# OpenAI Organization ID - OPTIONAL
OPENAI_ORG_ID="org-xxxxxxxxxxxxxxxxxxxxxxxx"
# OpenAI organization identifier
# Required only for organization-level API keys
```

### 🔗 External API Integrations
**Third-party service connections**

```bash
# Unleashed Software API - OPTIONAL
UNLEASHED_API_ID="your-unleashed-api-id"
UNLEASHED_API_KEY="your-unleashed-api-key"
# Unleashed Software ERP integration
# Source: Unleashed > Settings > API Access
# Enables: Real-time inventory data, sales orders, purchase orders
# Alternative: Mock data used if not provided

# Xero Accounting API - OPTIONAL
XERO_CLIENT_ID="your-xero-client-id"
XERO_CLIENT_SECRET="your-xero-client-secret"
# Xero accounting integration
# Source: Xero Developer > My Apps
# Enables: Financial data integration, automated accounting

# Shopify Integration - OPTIONAL (Multi-market)
SHOPIFY_API_KEY="your-shopify-api-key"
SHOPIFY_SECRET_KEY="your-shopify-secret"
SHOPIFY_STORE_URL="your-store.myshopify.com"
# Shopify e-commerce integration
# Enables: Multi-store inventory management, order processing
```

### 📊 Monitoring & Analytics
**Error tracking and performance monitoring**

```bash
# Sentry Error Tracking - RECOMMENDED for production
SENTRY_DSN="https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxx"
# Server-side Sentry DSN for error tracking
# Source: Sentry > Project Settings > Client Keys (DSN)

VITE_SENTRY_DSN="https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxx"
# Client-side Sentry DSN for frontend error tracking
# Note: VITE_ prefix makes it available to frontend
# Can be same as SENTRY_DSN or separate project

# Application Versioning
VITE_APP_VERSION="2.0.0"
# Application version for error tracking and deployment tracking
# Automatically set by CI/CD or manually updated

# Deployment Tracking
VITE_DEPLOYMENT_ID="deployment-12345"
# Unique identifier for each deployment
# Used for tracking deployment-specific issues
```

### 🚨 Alerting & Notifications
**Incident response and monitoring**

```bash
# Slack Webhooks - OPTIONAL
SLACK_WEBHOOK="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
# Slack webhook for automated alerts and notifications
# Source: Slack > Apps > Incoming Webhooks
# Enables: Real-time alerts, health check notifications, error alerts

# Email Alerts - OPTIONAL
ALERT_EMAIL="alerts@yourcompany.com"
# Email address for critical system alerts
# Used for: Database failures, security incidents, system overloads

# SMS Alerts - OPTIONAL
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"
ALERT_PHONE_NUMBER="+1987654321"
# Twilio integration for SMS alerts
# Used for: Critical production incidents
```

### ⚡ Performance & Caching
**Redis caching and performance optimization**

```bash
# Redis Cache - OPTIONAL but recommended for production
REDIS_URL="redis://username:password@hostname:port"
# Redis connection string for caching
# Source: Railway Redis add-on or external Redis provider
# Example: redis://default:password@redis-12345.railway.app:6379
# Enables: API response caching, session storage, rate limiting

# Node.js Performance Tuning
NODE_OPTIONS="--max-old-space-size=2048 --optimize-for-size"
# Node.js runtime options for performance
# max-old-space-size: Maximum heap size in MB (default: ~1.4GB)
# optimize-for-size: Optimize for memory usage over speed

# Database Connection Tuning
DATABASE_CONNECTION_LIMIT="10"
# Maximum number of database connections in pool
# Default: 5, increase for high-traffic deployments

DATABASE_IDLE_TIMEOUT="30000"
# Database connection idle timeout in milliseconds
# Default: 30000 (30 seconds)

# Cache Configuration
CACHE_TTL="3600"
# Default cache time-to-live in seconds (1 hour)
CACHE_MAX_SIZE="100"
# Maximum number of items in memory cache
```

---

## Environment-Specific Configuration

### 🌍 Multi-Region Configuration
**Geographic market support**

```bash
# Market-Specific Settings
DEFAULT_MARKET="UK"
# Default market for new users
# Options: UK, USA, EU, ASIA

SUPPORTED_MARKETS="UK,USA,EU,ASIA"
# Comma-separated list of supported markets
# Affects: Currency handling, tax calculations, shipping

# Regional Compliance
GDPR_ENABLED="true"
# Enable GDPR compliance features for EU markets
# Affects: Cookie consent, data retention, privacy settings

CCPA_ENABLED="false"
# Enable CCPA compliance for California users
# Affects: Data collection, user rights, privacy disclosures
```

### 🔧 Feature Flags
**Feature toggles and experimental features**

```bash
# AI Features
ENABLE_AI_FORECASTING="true"
# Enable/disable AI-powered forecasting
# Falls back to statistical models if disabled

ENABLE_MARKET_INSIGHTS="true"
# Enable AI-generated market insights
# Requires OpenAI API key

# UI Features
ENABLE_DARK_MODE="true"
# Enable dark mode toggle in UI

ENABLE_ADVANCED_CHARTS="true"
# Enable advanced chart types and interactions

# Experimental Features
ENABLE_BETA_FEATURES="false"
# Enable experimental beta features
# Only enable in development/test environments

# Multi-tenant Features
ENABLE_MULTI_TENANT="false"
# Enable multi-tenant organization support
# Requires additional database schema
```

---

## Security Configuration

### 🛡️ CORS & API Security
**Cross-origin and API protection**

```bash
# CORS Configuration
CORS_ORIGINS="https://yourdomain.com,https://staging.yourdomain.com"
# Comma-separated list of allowed origins
# Default: * (all origins) in development, specific domains in production

# API Security
API_RATE_LIMIT="100"
# Requests per 15-minute window per IP
# Default: 100, adjust based on usage patterns

AUTH_RATE_LIMIT="5"
# Authentication attempts per 15-minute window per IP
# Default: 5, increase if legitimate users are blocked

# Upload Limits
MAX_FILE_SIZE="10485760"
# Maximum file upload size in bytes (10MB)
# Adjust based on expected file sizes

ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf,text/csv"
# Comma-separated list of allowed MIME types
# Security: Only allow necessary file types
```

### 🔐 SSL/TLS Configuration
**HTTPS and encryption settings**

```bash
# HTTPS Configuration
FORCE_HTTPS="true"
# Force HTTPS redirects in production
# Should be true for production, false for development

SSL_CERT_PATH="/path/to/ssl/cert.pem"
# Path to SSL certificate (if using custom SSL)
# Not needed for Railway deployment (automatic SSL)

SSL_KEY_PATH="/path/to/ssl/private.key"
# Path to SSL private key (if using custom SSL)
# Not needed for Railway deployment
```

---

## Deployment-Specific Variables

### 🚀 Railway Configuration
**Railway platform-specific settings**

```bash
# Railway automatically provides these:
RAILWAY_ENVIRONMENT="production"
# Current Railway environment (production/staging/development)

RAILWAY_PROJECT_ID="project-id-12345"
# Railway project identifier

RAILWAY_SERVICE_ID="service-id-67890"
# Railway service identifier

PORT="8080"
# Port number (automatically set by Railway)
# Don't override unless necessary
```

### 📝 Build Configuration
**Build process customization**

```bash
# Build Optimization
NODE_ENV="production"
# Node.js environment mode
# Affects: Error handling, logging level, optimizations

NPM_CONFIG_PRODUCTION="false"
# Keep devDependencies for build process
# Required for Vite build tools

BUILD_CACHE_VERSION="v4-fullstack-fix"
# Cache busting version for builds
# Update when build process changes

# Frontend Build
VITE_API_BASE_URL="https://yourdomain.com/api"
# API base URL for frontend
# Defaults to relative URLs if not set

VITE_APP_TITLE="CapLiquify Manufacturing Platform"
# Application title shown in browser tab

VITE_APP_DESCRIPTION="Enterprise manufacturing dashboard with AI forecasting"
# Application description for SEO
```

---

## Validation & Testing

### ✅ Environment Validation Script
Create `.env.example` with all required variables:

```bash
# Copy and configure environment variables
cp .env.example .env.local

# Validate environment configuration
npm run env:validate

# Test database connections
npm run db:test

# Test external API connections
npm run api:test
```

### 🧪 Testing Configuration
**Test environment variables**

```bash
# Test Database
TEST_DATABASE_URL="postgresql://test_user:test_pass@localhost:5432/sentia_test"

# Mock Services (for testing)
MOCK_OPENAI="true"
# Use mock OpenAI responses instead of real API calls

MOCK_UNLEASHED="true"
# Use mock Unleashed API responses

# Test User Accounts
TEST_USER_EMAIL="test@sentia.ai"
TEST_USER_PASSWORD="TestPass123!"
# Test user credentials for automated testing
```

---

## Common Configurations

### 📋 Development Environment
```bash
# .env.development
NODE_ENV=development
DATABASE_URL=postgresql://dev_user:dev_pass@localhost:5432/sentia_dev
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxx
JWT_SECRET=dev-jwt-secret-key
SESSION_SECRET=dev-session-secret-key
VITE_API_BASE_URL=http://localhost:5000/api
ENABLE_BETA_FEATURES=true
```

### 📋 Production Environment
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://prod_connection_string
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxx
JWT_SECRET=super-secure-production-jwt-secret
SESSION_SECRET=super-secure-production-session-secret
CSRF_SECRET=super-secure-csrf-secret
OPENAI_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxx
REDIS_URL=redis://redis_connection_string
SENTRY_DSN=https://sentry_dsn_url
VITE_SENTRY_DSN=https://sentry_dsn_url
SLACK_WEBHOOK=https://slack_webhook_url
CORS_ORIGINS=https://sentia-manufacturing.railway.app
FORCE_HTTPS=true
```

---

## Security Best Practices

### 🔒 Secret Management
1. **Never commit secrets** to version control
2. **Use environment-specific** `.env` files
3. **Rotate secrets regularly** (quarterly recommended)
4. **Use strong, unique secrets** for each environment
5. **Limit access** to production secrets

### 🛡️ Variable Security
1. **Validate all inputs** from environment variables
2. **Use default values** for non-critical variables
3. **Sanitize URL inputs** to prevent injection
4. **Encrypt sensitive data** in environment variables when possible
5. **Monitor access** to environment variables

### 📊 Monitoring Variables
1. **Log variable usage** (without exposing values)
2. **Monitor for missing** critical variables
3. **Alert on configuration** changes
4. **Track environment** drift between deployments
5. **Validate configuration** before deployment

---

## Troubleshooting

### ❌ Common Issues

**Missing Environment Variable**
```bash
Error: Missing required environment variable: CLERK_SECRET_KEY
Solution: Set the variable in Railway dashboard or .env file
```

**Database Connection Failed**
```bash
Error: ENOTFOUND in database connection
Solution: Check DATABASE_URL format and network connectivity
```

**Invalid API Key**
```bash
Error: 401 Unauthorized from OpenAI API
Solution: Verify OPENAI_API_KEY is correct and has sufficient credits
```

### 🔍 Debug Commands
```bash
# Check all environment variables
env | grep -E "(CLERK|DATABASE|OPENAI)"

# Validate configuration
npm run config:validate

# Test specific integrations
npm run test:db
npm run test:apis
npm run test:auth
```

---

*Last Updated: 2025-09-06*
*Version: 2.0.0 - Environment Configuration Guide*