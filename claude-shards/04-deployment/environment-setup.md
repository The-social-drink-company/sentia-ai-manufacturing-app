# Environment Setup

**Last Updated**: October 20, 2025
**Category**: Deployment
**Related Shards**: [deployment-infrastructure.md](./deployment-infrastructure.md)

## Prerequisites

- Node.js (v18+ recommended)
- npm (comes with Node.js)

## Development Setup

1. Install Node.js dependencies: `npm install`
2. Copy environment template: `cp .env.template .env` and configure
3. Start development servers: `npm run dev`

## Environment Configuration

### Required Environment Variables

#### Frontend (Vite - VITE\_ prefix)

- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk authentication key (required)
- `VITE_API_BASE_URL`: Backend API endpoint (default: http://localhost:5000/api)
- `VITE_APP_TITLE`: Application title display
- `VITE_APP_VERSION`: Version display in UI

#### Backend (Node.js)

- `NODE_ENV`: Environment mode (development/test/production)
- `PORT`: Server port (default: 5000, auto-set by Render)
- `DATABASE_URL`: PostgreSQL connection string (Render PostgreSQL with pgvector)
- `DEV_DATABASE_URL`: Development database URL
- `TEST_DATABASE_URL`: Test database URL
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `REDIS_URL`: Redis connection for caching/sessions
- `CLERK_SECRET_KEY`: Clerk backend secret key

#### API Integration Keys

- `SHOPIFY_API_KEY`: Shopify API authentication
- `AMAZON_SP_API_CLIENT_ID`: Amazon Selling Partner API
- `AMAZON_SP_API_CLIENT_SECRET`: Amazon SP-API secret
- `UNLEASHED_API_ID`: Unleashed ERP API ID
- `UNLEASHED_API_KEY`: Unleashed ERP API key
- `XERO_CLIENT_ID`: Xero OAuth client ID (not yet implemented)
- `XERO_CLIENT_SECRET`: Xero OAuth secret (not yet implemented)

#### AI Analytics Configuration

- `AI_ANALYTICS_ENABLED`: Enable AI analytics features (default: true)
- `LOG_LEVEL`: Logging level for application (default: info)

## Environment Management

### Local Development

Use `.env` file for local environment variables (copy from `.env.template`)

### Render Deployment

Environment variables are managed through the Render dashboard:
1. Go to https://dashboard.render.com
2. Select your service
3. Navigate to Environment tab
4. Add/update variables
5. Service auto-redeploys with new configuration

### Security Notes

- Never commit `.env` files to version control
- Use different API keys for development/test/production
- Rotate keys regularly
- Use Render's secret management for sensitive values

---

[← Previous: Deployment Infrastructure](./deployment-infrastructure.md) | [Next: Branch Strategy →](./branch-strategy.md) | [Back to Main →](../../CLAUDE.md)