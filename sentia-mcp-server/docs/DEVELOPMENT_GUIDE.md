# Sentia MCP Server - Development Guide

## 📋 **Overview**

This document provides comprehensive guidance for developers working with the Sentia MCP Server, including setup instructions, development workflow, coding standards, and best practices.

## 💻 **Development Environment Setup**

### **Prerequisites**
- **Node.js 18+**: Latest LTS version recommended
- **Git access**: Repository access and SSH key setup
- **Environment variables**: API credentials for each integration
- **Docker**: For local production testing (optional)
- **PostgreSQL**: Database for local development
- **Redis**: Cache for local development

### **Quick Start**
```bash
# Clone repository
git clone <repository-url>
cd sentia-mcp-server

# Install dependencies  
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API credentials

# Start development server
npm run dev

# Run tests
npm test

# Validate integrations
node scripts/validate-unleashed-integration.js
```

### **Development Scripts**
```bash
# Core development commands
npm run dev                   # Start development server with hot reload
npm run start                 # Start production server
npm run build                 # Build production bundle
npm run test                  # Run test suite
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Generate coverage report

# Integration validation
npm run validate:all          # Validate all integrations
npm run validate:xero         # Validate Xero integration
npm run validate:shopify      # Validate Shopify integration
npm run validate:amazon       # Validate Amazon integration
npm run validate:unleashed    # Validate Unleashed integration

# Code quality
npm run lint                  # Run ESLint
npm run lint:fix              # Fix ESLint issues
npm run format                # Format code with Prettier
npm run typecheck             # Run TypeScript checks

# Documentation
npm run docs:generate         # Generate API documentation
npm run docs:serve            # Serve documentation locally
```

## 🔄 **Development Workflow**

### **Git Branch Strategy**
- **development**: Primary development branch (auto-deploy to development environment)
- **test**: User acceptance testing (manual deploy to test environment)  
- **production**: Live production (manual deploy after UAT approval)

### **Development Process**
1. **Feature Development**: Work in `development` branch
2. **Testing**: Deploy to test environment for UAT
3. **Production**: Deploy to production after approval
4. **Hotfixes**: Direct fixes to production with backport

### **Code Review Process**
1. **Create Feature Branch**: `git checkout -b feature/your-feature-name`
2. **Implement Changes**: Follow coding standards and best practices
3. **Run Tests**: Ensure all tests pass locally
4. **Create Pull Request**: Submit PR to `development` branch
5. **Code Review**: Address reviewer feedback
6. **Merge**: Merge after approval and CI/CD validation

### **Commit Message Standards**
```bash
# Format: type(scope): description
feat(auth): add JWT token refresh mechanism
fix(xero): resolve OAuth token expiration issue
docs(api): update integration endpoint documentation
test(unleashed): add comprehensive integration tests
refactor(config): improve environment configuration system
```

## 🛠️ **Code Standards & Best Practices**

### **Code Standards**
- **ES Modules**: All code uses import/export syntax
- **Structured Logging**: Winston with correlation IDs
- **Error Handling**: Comprehensive try/catch with recovery strategies
- **Documentation**: JSDoc comments for all public functions
- **Security**: Input validation, rate limiting, audit logging

### **File Organization**
```
src/
├── server.js                 # Main server entry point
├── config/                   # Configuration management
├── middleware/               # Express middleware
├── routes/                   # API route handlers
├── tools/                    # MCP tool integrations
├── utils/                    # Utility functions
└── tests/                    # Test files
```

### **Coding Best Practices**

**Error Handling Pattern**
```javascript
// Standard error handling with recovery
async function performIntegrationCall(integration, params) {
  try {
    const result = await integration.call(params);
    logger.info('Integration call successful', { integration, params });
    return result;
  } catch (error) {
    logger.error('Integration call failed', { 
      integration, 
      params, 
      error: error.message,
      stack: error.stack 
    });
    
    // Implement retry logic
    if (error.retryable && params.retryCount < MAX_RETRIES) {
      await delay(calculateBackoff(params.retryCount));
      return performIntegrationCall(integration, { 
        ...params, 
        retryCount: (params.retryCount || 0) + 1 
      });
    }
    
    throw new IntegrationError(`${integration} call failed`, { cause: error });
  }
}
```

**Logging Pattern**
```javascript
// Structured logging with correlation IDs
import { logger } from '../utils/logger.js';

export async function processRequest(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || generateId();
  req.correlationId = correlationId;
  
  logger.info('Request started', {
    correlationId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  });
  
  try {
    await next();
    
    logger.info('Request completed', {
      correlationId,
      statusCode: res.statusCode,
      duration: Date.now() - req.startTime
    });
  } catch (error) {
    logger.error('Request failed', {
      correlationId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
```

**Integration Pattern**
```javascript
// Standardized integration implementation
export class IntegrationBase {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.client = this.createClient();
    this.cache = new CacheManager(`${name}-cache`);
  }
  
  async initialize() {
    await this.validateCredentials();
    await this.setupWebhooks();
    this.registerTools();
  }
  
  async call(toolName, params) {
    const cacheKey = this.generateCacheKey(toolName, params);
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const result = await this.executeCall(toolName, params);
    await this.cache.set(cacheKey, result);
    
    return result;
  }
  
  async executeCall(toolName, params) {
    // Override in subclasses
    throw new Error('executeCall must be implemented');
  }
}
```

## 🧪 **Testing Guidelines**

### **Test Structure**
```
tests/
├── unit/                     # Unit tests
│   ├── tools/               # Integration tool tests
│   ├── utils/               # Utility function tests
│   └── middleware/          # Middleware tests
├── integration/             # Integration tests
├── e2e/                     # End-to-end tests
├── security/                # Security tests
├── performance/             # Performance tests
└── fixtures/                # Test data and mocks
```

### **Test Writing Standards**

**Unit Test Example**
```javascript
// tests/unit/tools/xero-integration.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { XeroIntegration } from '../../src/tools/xero-integration.js';

describe('XeroIntegration', () => {
  let integration;
  
  beforeEach(() => {
    integration = new XeroIntegration({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret'
    });
  });
  
  afterEach(() => {
    // Cleanup
  });
  
  describe('getFinancialReports', () => {
    it('should return financial reports for valid parameters', async () => {
      // Arrange
      const params = { reportType: 'profit-loss', period: '2024-01' };
      
      // Act
      const result = await integration.getFinancialReports(params);
      
      // Assert
      expect(result).toHaveProperty('reports');
      expect(result.reports).toBeArray();
      expect(result.reports[0]).toHaveProperty('reportType', 'profit-loss');
    });
    
    it('should handle authentication errors gracefully', async () => {
      // Arrange
      integration.client.isAuthenticated = false;
      
      // Act & Assert
      await expect(integration.getFinancialReports({}))
        .rejects
        .toThrow('Authentication required');
    });
  });
});
```

**Integration Test Example**
```javascript
// tests/integration/database.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from '../utils/test-db.js';

describe('Database Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  afterAll(async () => {
    await teardownTestDatabase();
  });
  
  it('should store and retrieve configuration data', async () => {
    // Test database operations
  });
});
```

### **Test Data Management**

**Test Fixtures**
```javascript
// tests/fixtures/manufacturing-data.js
export const mockManufacturingOrder = {
  id: 'MO-001',
  productId: 'PROD-123',
  quantity: 100,
  status: 'in-progress',
  startDate: '2024-01-15T08:00:00Z',
  expectedCompletion: '2024-01-20T17:00:00Z'
};

export const mockInventoryItem = {
  id: 'INV-456',
  sku: 'SKU-ABC-123',
  name: 'Widget Component A',
  quantity: 500,
  location: 'Warehouse A',
  lastUpdated: '2024-01-15T10:30:00Z'
};
```

**Custom Test Matchers**
```javascript
// tests/utils/custom-matchers.js
expect.extend({
  toBeValidManufacturingOrder(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.productId === 'string' &&
      typeof received.quantity === 'number' &&
      ['pending', 'in-progress', 'completed'].includes(received.status);
    
    return {
      pass,
      message: () => `Expected ${received} to be a valid manufacturing order`
    };
  }
});
```

## 🔧 **Environment Configuration**

### **Environment Variables Required**
```bash
# Core Configuration
NODE_ENV=development
MCP_SERVER_PORT=3001
MCP_HTTP_PORT=3002

# Xero Integration
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
XERO_REDIRECT_URI=http://localhost:3001/auth/xero/callback

# Shopify Integration  
SHOPIFY_UK_ACCESS_TOKEN=your_uk_token
SHOPIFY_USA_ACCESS_TOKEN=your_usa_token
SHOPIFY_UK_SHOP_DOMAIN=your-uk-store.myshopify.com
SHOPIFY_USA_SHOP_DOMAIN=your-usa-store.myshopify.com

# Amazon Integration
AMAZON_SP_API_CLIENT_ID=your_sp_api_client_id
AMAZON_SP_API_CLIENT_SECRET=your_sp_api_secret
AMAZON_SP_API_REFRESH_TOKEN=your_refresh_token
AMAZON_MARKETPLACE_ID=your_marketplace_id

# AI Integration
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key

# Unleashed Integration
UNLEASHED_API_KEY=your_unleashed_key
UNLEASHED_API_SECRET=your_unleashed_secret
UNLEASHED_BASE_URL=https://api.unleashedsoftware.com

# Phase 3.1: Authentication & Security
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret
ENCRYPTION_KEY=your_aes_256_encryption_key
MFA_ENABLED=true
SESSION_TIMEOUT=3600000
SECURITY_MONITORING_ENABLED=true
AUDIT_LOGGING_ENABLED=true

# Phase 3.2: Monitoring & Alerting
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_BUSINESS_ANALYTICS=true
ENABLE_MEMORY_LEAK_DETECTION=true
ENABLE_GC_MONITORING=true
METRICS_RETENTION_DAYS=30
REDIS_URL=redis://localhost:6379
NOTIFICATION_WEBHOOK_URL=your_webhook_url
NOTIFICATION_EMAIL_HOST=smtp.gmail.com
NOTIFICATION_EMAIL_USER=your_email
NOTIFICATION_EMAIL_PASS=your_app_password
SLACK_WEBHOOK_URL=your_slack_webhook
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# Phase 3.3: Configuration & Environment Management
CONFIG_ENVIRONMENT=development
ENABLE_DYNAMIC_CONFIG=true
ENABLE_CONFIG_VALIDATION=true
CREDENTIAL_ENCRYPTION_ENABLED=true
CREDENTIAL_ROTATION_ENABLED=true
CONFIG_CACHE_TTL=300000
DATABASE_CONFIG_PROFILE=development
PERFORMANCE_CONFIG_PROFILE=standard

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sentia_mcp_dev
DATABASE_POOL_SIZE=10
DATABASE_TIMEOUT=5000

# Cache
CACHE_TYPE=redis
CACHE_TTL=300000
CACHE_MAX_SIZE=1000
```

### **Environment Setup Scripts**
```bash
# setup-dev-environment.sh
#!/bin/bash

echo "Setting up Sentia MCP Server development environment..."

# Check Node.js version
node_version=$(node -v | cut -d'v' -f2)
required_version="18.0.0"

if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
  echo "Error: Node.js version $required_version or higher is required"
  exit 1
fi

# Install dependencies
npm install

# Setup environment file
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env file. Please configure your API credentials."
fi

# Setup local database
docker run -d \
  --name sentia-postgres \
  -e POSTGRES_DB=sentia_mcp_dev \
  -e POSTGRES_USER=sentia \
  -e POSTGRES_PASSWORD=development \
  -p 5432:5432 \
  postgres:15-alpine

# Setup local Redis
docker run -d \
  --name sentia-redis \
  -p 6379:6379 \
  redis:7-alpine

echo "Development environment setup complete!"
echo "Next steps:"
echo "1. Configure API credentials in .env file"
echo "2. Run 'npm run dev' to start development server"
echo "3. Run 'npm test' to verify setup"
```

## 🚀 **Development Best Practices**

### **Performance Guidelines**
- Use connection pooling for database connections
- Implement caching strategies for frequently accessed data
- Monitor memory usage and implement leak detection
- Use lazy loading for non-critical modules
- Implement request/response compression

### **Security Guidelines**
- Validate all input data
- Use parameterized queries to prevent SQL injection
- Implement rate limiting on all endpoints
- Use HTTPS in all environments
- Store sensitive data encrypted
- Implement proper authentication and authorization

### **Error Handling Guidelines**
- Use structured error objects with error codes
- Implement retry logic with exponential backoff
- Log errors with correlation IDs for tracing
- Provide meaningful error messages to users
- Implement circuit breaker patterns for external services

### **Testing Guidelines**
- Aim for >90% code coverage
- Write tests before implementing features (TDD)
- Use realistic test data and scenarios
- Test error conditions and edge cases
- Implement performance tests for critical paths

## 🔍 **Debugging & Troubleshooting**

### **Debug Configuration**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug MCP Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/server.js",
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeArgs": ["--inspect"]
    }
  ]
}
```

### **Common Issues & Solutions**

**Integration Authentication Failures**
```bash
# Check credential configuration
npm run validate:credentials

# Test specific integration
npm run validate:xero -- --verbose

# Check API endpoint connectivity
curl -H "Authorization: Bearer $XERO_ACCESS_TOKEN" \
  https://api.xero.com/api.xro/2.0/Organisation
```

**Database Connection Issues**
```bash
# Check database status
npm run db:status

# Test database connection
npm run db:test-connection

# Reset database for development
npm run db:reset
```

**Performance Issues**
```bash
# Enable performance monitoring
export ENABLE_PERFORMANCE_MONITORING=true

# Generate performance report
npm run performance:report

# Check memory usage
npm run memory:analyze
```

## 🎯 **Next Development Steps**

### **Potential Future Integrations**
1. **Quickbooks Integration**: Additional accounting platform support
2. **Slack/Teams Integration**: Communication and notifications
3. **Warehouse Management**: WMS integration for inventory
4. **CRM Integration**: Salesforce or HubSpot connectivity
5. **IoT Device Integration**: Manufacturing sensor data

### **Enhancement Opportunities**
1. **Advanced Analytics**: Machine learning integration
2. **Real-time Dashboards**: Live data visualization
3. **Automated Workflows**: Business process automation
4. **Mobile API**: Mobile application support
5. **Data Warehouse**: Historical data analysis

### **Technical Debt**
1. **Code Coverage**: Improve test coverage to >95%
2. **Documentation**: Complete API documentation
3. **Performance**: Optimize database queries
4. **Security**: Implement additional security headers
5. **Monitoring**: Add more detailed business metrics

## 📚 **Related Documentation**

- **[MCP Server Overview](MCP_SERVER_OVERVIEW.md)**: Architecture and technology stack overview
- **[Integrations Guide](INTEGRATIONS_GUIDE.md)**: Detailed integration implementations and patterns
- **[Authentication & Security](AUTHENTICATION_SECURITY.md)**: Enterprise security system (Phase 3.1)
- **[Monitoring & Logging](MONITORING_LOGGING.md)**: Comprehensive monitoring infrastructure (Phase 3.2)
- **[Configuration Management](CONFIGURATION_MANAGEMENT.md)**: Multi-environment configuration system (Phase 3.3)
- **[Deployment Infrastructure](DEPLOYMENT_INFRASTRUCTURE.md)**: Complete deployment automation (Phase 4)

---

*This development guide provides comprehensive instructions for setting up, developing, and maintaining the Sentia MCP Server with best practices for code quality, testing, and deployment.*