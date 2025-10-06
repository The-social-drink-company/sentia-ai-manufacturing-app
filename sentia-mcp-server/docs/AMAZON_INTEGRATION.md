# Amazon Marketplace Integration

## Overview

The Amazon Marketplace Integration provides comprehensive e-commerce management capabilities across multiple Amazon marketplaces (UK, USA, EU, Canada) through the Amazon Selling Partner API (SP-API). This enterprise-grade integration offers advanced features including business intelligence, compliance management, multi-marketplace analytics, and performance optimization.

## Features

### 🌍 Multi-Marketplace Support
- **UK Marketplace**: A1F83G8C2ARO7P (GBP, eu-west-1)
- **USA Marketplace**: ATVPDKIKX0DER (USD, us-east-1)  
- **EU Marketplace**: A1PA6795UKMFR9 (EUR, eu-west-1)
- **Canada Marketplace**: A2EUQ1WTGCTBG2 (CAD, us-east-1)

### 🛠️ Core E-commerce Tools
1. **Orders Management** - Comprehensive order tracking and analytics
2. **Products Management** - Product catalog and competitive analysis
3. **Inventory Tracking** - Real-time FBA/FBM inventory monitoring
4. **Reports Generation** - Automated report creation and retrieval
5. **Listings Management** - Product creation and optimization
6. **Advertising Data** - Campaign performance and ROI analysis

### 🔐 Enterprise Authentication
- **Login with Amazon (LWA)** OAuth 2.0 flow
- **Multi-tenant support** with marketplace-specific credentials
- **Token management** with automatic refresh
- **Secure credential storage** with environment variable support

### 📊 Business Intelligence
- **Cross-marketplace analytics** and performance comparison
- **Real-time metrics** tracking and reporting
- **Optimization recommendations** based on performance data
- **Competitive analysis** and market insights
- **ROI tracking** and profitability analysis

### ⚖️ Compliance Management
- **Tax calculation** with marketplace-specific rates
- **Regulatory compliance** checking and validation
- **Product restrictions** and category management
- **Certification requirements** tracking
- **Legal compliance** documentation

### 🚀 Performance Features
- **Intelligent caching** with marketplace-specific TTL
- **Circuit breaker pattern** for error resilience
- **Rate limiting** with exponential backoff
- **Connection pooling** for optimal performance
- **Request optimization** and batching

## Installation

### Prerequisites
- Node.js v18+ 
- Amazon SP-API credentials (Client ID, Client Secret, Refresh Token)
- Valid seller account with appropriate marketplace permissions

### Dependencies Installation
```bash
npm install amazon-sp-api@^2.1.0 aws-sdk@^2.1691.0 currency-converter-lt@^2.0.3
```

### Environment Configuration
Create a `.env` file with your Amazon SP-API credentials:

```env
# Amazon SP-API Authentication
AMAZON_CLIENT_ID=your_client_id_here
AMAZON_CLIENT_SECRET=your_client_secret_here
AMAZON_REFRESH_TOKEN=your_refresh_token_here

# Optional: Sandbox Configuration
AMAZON_SANDBOX_MODE=false
AMAZON_TEST_CLIENT_ID=your_test_client_id
```

## Quick Start

### 1. Basic Integration Setup
```javascript
import { registerAmazonTools } from './tools/amazon-integration.js';

// Register with MCP server
await registerAmazonTools(mcpServer);
```

### 2. Authentication Test
```javascript
// Test authentication across all marketplaces
const authResult = await mcpServer.executeTool('amazon-auth', {
  action: 'test',
  marketplaceId: 'all'
});

console.log('Authentication Status:', authResult);
```

### 3. Retrieve Orders
```javascript
// Get orders from UK marketplace
const orders = await mcpServer.executeTool('amazon-execute', {
  tool: 'orders',
  marketplaceId: 'UK',
  params: {
    dateRange: {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    },
    orderStatus: ['Shipped', 'Delivered'],
    includeMetrics: true
  }
});
```

## API Reference

### Authentication Tool (`amazon-auth`)

Manages Amazon SP-API authentication across multiple marketplaces.

```javascript
// Check authentication status
await executeTool('amazon-auth', {
  action: 'status'  // 'status' | 'test' | 'refresh' | 'disconnect'
});

// Test specific marketplace connection
await executeTool('amazon-auth', {
  action: 'test',
  marketplaceId: 'UK',  // 'UK' | 'USA' | 'EU' | 'CANADA' | 'all'
  sandbox: false
});
```

### Execute Tool (`amazon-execute`)

Executes core e-commerce operations across marketplaces.

#### Orders Management
```javascript
await executeTool('amazon-execute', {
  tool: 'orders',
  marketplaceId: 'USA',
  params: {
    dateRange: {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    },
    orderStatus: ['Pending', 'Shipped', 'Delivered'],
    fulfillmentChannels: ['FBA', 'FBM'],
    includeMetrics: true,
    pagination: {
      limit: 50,
      offset: 0
    }
  }
});
```

#### Products Management
```javascript
await executeTool('amazon-execute', {
  tool: 'products',
  marketplaceId: 'UK',
  params: {
    searchType: 'asin',  // 'asin' | 'sku' | 'listings' | 'catalog'
    asinList: ['B0123456789', 'B0987654321'],
    includeAttributes: true,
    includePricing: true,
    includeCompetitors: true
  }
});
```

#### Inventory Tracking
```javascript
await executeTool('amazon-execute', {
  tool: 'inventory',
  marketplaceId: 'EU',
  params: {
    inventoryType: 'all',  // 'fba' | 'fbm' | 'all'
    includeReserved: true,
    includeInbound: true,
    skuFilter: ['SKU-001', 'SKU-002']
  }
});
```

#### Reports Generation
```javascript
await executeTool('amazon-execute', {
  tool: 'reports',
  marketplaceId: 'CANADA',
  params: {
    reportType: 'GET_MERCHANT_LISTINGS_ALL_DATA',
    dateRange: {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    },
    marketplaceIds: ['A2EUQ1WTGCTBG2'],
    autoProcess: true
  }
});
```

#### Listings Management
```javascript
await executeTool('amazon-execute', {
  tool: 'listings',
  marketplaceId: 'USA',
  params: {
    action: 'create',  // 'create' | 'update' | 'delete' | 'get'
    sku: 'NEW-PRODUCT-001',
    productData: {
      title: 'Amazing New Product',
      brand: 'Your Brand',
      category: 'Electronics',
      price: 99.99,
      currency: 'USD',
      description: 'Product description...',
      images: ['https://example.com/image1.jpg'],
      attributes: {
        color: 'Black',
        size: 'Medium'
      }
    },
    validateCompliance: true
  }
});
```

#### Advertising Analytics
```javascript
await executeTool('amazon-execute', {
  tool: 'advertising',
  marketplaceId: 'UK',
  params: {
    operation: 'getPerformanceData',
    campaignType: 'sponsoredProducts',
    dateRange: {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    },
    metrics: ['clicks', 'cost', 'sales', 'acos'],
    includeOptimization: true
  }
});
```

### System Tool (`amazon-system`)

Provides system management and health monitoring capabilities.

```javascript
// System health check
await executeTool('amazon-system', {
  action: 'health'  // 'health' | 'status' | 'stats' | 'clear-cache' | 'marketplaces' | 'tools'
});

// Clear marketplace-specific cache
await executeTool('amazon-system', {
  action: 'clear-cache',
  target: 'UK'  // Specific marketplace or omit for all
});

// Get system statistics
await executeTool('amazon-system', {
  action: 'stats'
});
```

### Analytics Tool (`amazon-analytics`)

Advanced analytics and business intelligence capabilities.

```javascript
// Cross-marketplace performance analysis
await executeTool('amazon-analytics', {
  analysisType: 'cross-marketplace',
  marketplaces: ['UK', 'USA', 'EU'],
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  }
});

// Product compliance analysis
await executeTool('amazon-analytics', {
  analysisType: 'compliance',
  marketplaces: ['UK', 'EU'],
  productData: {
    title: 'Product Name',
    category: 'Electronics',
    brand: 'Brand Name',
    price: 99.99
  }
});

// Performance optimization recommendations
await executeTool('amazon-analytics', {
  analysisType: 'optimization'
});
```

## Advanced Configuration

### Multi-Marketplace Setup
```javascript
const amazonIntegration = new AmazonIntegration({
  marketplaces: {
    uk: {
      id: 'A1F83G8C2ARO7P',
      endpoint: 'https://sellingpartnerapi-eu.amazon.com',
      region: 'eu-west-1',
      currency: 'GBP',
      countryCode: 'GB',
      name: 'UK'
    },
    usa: {
      id: 'ATVPDKIKX0DER', 
      endpoint: 'https://sellingpartnerapi-na.amazon.com',
      region: 'us-east-1',
      currency: 'USD',
      countryCode: 'US',
      name: 'USA'
    }
    // ... additional marketplaces
  },
  
  // Performance Configuration
  rateLimiting: {
    enabled: true,
    maxRequests: 10,     // Lower than other APIs due to SP-API limits
    timeWindow: 1000,
    burstLimit: 20
  },
  
  // Caching Strategy
  caching: {
    enabled: true,
    defaultTTL: 600,     // 10 minutes
    ordersTTL: 300,      // 5 minutes (more dynamic)
    productsTTL: 1800,   // 30 minutes (more stable)
    inventoryTTL: 300,   // 5 minutes (highly dynamic)
    reportsTTL: 3600,    // 1 hour (static once generated)
    advertisingTTL: 1800 // 30 minutes
  },
  
  // Error Handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 2000,
    circuitBreakerThreshold: 5,
    rateLimitBackoff: 5000
  },
  
  // Business Intelligence
  analytics: {
    enabled: true,
    crossMarketplaceAnalysis: true,
    performanceTracking: true,
    optimizationSuggestions: true
  },
  
  // Compliance Management
  compliance: {
    enabled: true,
    taxCalculation: true,
    restrictedProducts: true,
    marketplaceRules: true
  }
});
```

### Custom Authentication Configuration
```javascript
// Multi-marketplace authentication
const marketplaceAuth = new MarketplaceAuth({
  credentials: {
    uk: {
      clientId: process.env.AMAZON_UK_CLIENT_ID,
      clientSecret: process.env.AMAZON_UK_CLIENT_SECRET,
      refreshToken: process.env.AMAZON_UK_REFRESH_TOKEN
    },
    usa: {
      clientId: process.env.AMAZON_USA_CLIENT_ID,
      clientSecret: process.env.AMAZON_USA_CLIENT_SECRET,  
      refreshToken: process.env.AMAZON_USA_REFRESH_TOKEN
    }
  },
  sandbox: process.env.NODE_ENV !== 'production'
});
```

## Compliance and Regulations

### Tax Calculation
```javascript
const compliance = new ComplianceManager();

// Calculate UK VAT
const ukTax = compliance.calculateTax(100, 'UK');
// Result: { basePrice: 100, taxAmount: 20, taxRate: 0.20, totalPrice: 120, currency: 'GBP' }

// Calculate US tax (varies by state)
const usTax = compliance.calculateTax(100, 'USA', 'CA');
// Result: { basePrice: 100, taxAmount: 7.25, taxRate: 0.0725, totalPrice: 107.25, currency: 'USD' }
```

### Product Compliance Validation
```javascript
const productData = {
  title: 'Wireless Bluetooth Headphones',
  brand: 'TechBrand',
  category: 'Electronics',
  price: 79.99,
  certifications: ['CE', 'FCC']
};

const validation = await compliance.validateProductCompliance(productData, 'UK');
/*
Result: {
  compliant: true,
  warnings: [],
  errors: [],
  requirements: [
    'Ensure content is available in: en-GB',
    'Consider obtaining certifications: CE, UKCA'
  ],
  marketplace: 'UK'
}
*/
```

### Restricted Categories Management
```javascript
// Check category restrictions
const restriction = compliance.isCategoryRestricted('weapons', 'UK');
// Result: { restricted: true, prohibited: true, reason: "Category 'weapons' is prohibited in UK marketplace" }

const electronicsRestriction = compliance.isCategoryRestricted('electronics', 'EU');
// Result: { restricted: false, prohibited: false, requirements: ['safety certifications', 'warranty information'] }
```

## Performance Optimization

### Intelligent Caching
The integration implements sophisticated caching strategies:

```javascript
// Cache configuration by data type
const cacheConfig = {
  orders: 300,        // 5 minutes (frequently changing)
  products: 1800,     // 30 minutes (stable catalog data)
  inventory: 300,     // 5 minutes (stock levels change)
  reports: 3600,      // 1 hour (static once generated)
  advertising: 1800   // 30 minutes (campaign performance)
};

// Cache operations
await cache.set('amazon:UK:orders:recent', orderData, 300);
const cachedOrders = await cache.get('amazon:UK:orders:recent');
await cache.clearMarketplace('UK');  // Clear UK-specific cache
```

### Rate Limiting and Circuit Breaker
```javascript
// Automatic rate limiting with SP-API limits
const rateLimiter = {
  maxRequests: 10,      // SP-API has strict limits
  timeWindow: 1000,     // Per second
  burstLimit: 20,       // Short burst allowance
  backoffStrategy: 'exponential'
};

// Circuit breaker for failing operations
const circuitBreaker = {
  threshold: 5,         // Failures before opening
  timeout: 60000,       // 1 minute timeout
  states: ['closed', 'open', 'half-open']
};
```

### Connection Pooling
```javascript
// Optimize SP-API connections
const connectionPool = {
  maxConnections: 10,
  idleTimeout: 30000,
  retryOnFailure: true,
  keepAlive: true
};
```

## Error Handling

### Error Types and Recovery
```javascript
// Common SP-API errors and handling
const errorTypes = {
  'UNAUTHORIZED': 'Check SP-API credentials and refresh tokens',
  'FORBIDDEN': 'Verify SP-API permissions and scopes',
  'RATE_LIMITED': 'Implement request throttling and respect rate limits',
  'SERVER_ERROR': 'Retry the request after a short delay',
  'NETWORK_ERROR': 'Check network connectivity and DNS resolution'
};

// Automatic retry with exponential backoff
const retryStrategy = {
  maxRetries: 3,
  baseDelay: 2000,      // 2 seconds
  maxDelay: 30000,      // 30 seconds
  backoffMultiplier: 2
};
```

### Circuit Breaker Pattern
```javascript
// Prevent cascading failures
const circuitBreaker = {
  failureThreshold: 5,
  recoveryTimeout: 60000,
  monitoringPeriod: 10000
};

// Usage example
try {
  const result = await errorHandler.withRetry(
    () => amazonAPI.getOrders(params),
    'amazon-orders',
    { maxRetries: 3 }
  );
} catch (error) {
  // Circuit breaker may prevent further attempts
  console.log('Operation failed:', error.message);
}
```

## Monitoring and Analytics

### Performance Metrics
```javascript
// Track system performance
const metrics = {
  requestCount: 1000,
  errorCount: 5,
  averageResponseTime: 1500,
  cacheHitRate: 85.2,
  marketplaceStats: {
    UK: { requests: 400, errors: 2 },
    USA: { requests: 600, errors: 3 }
  }
};
```

### Business Intelligence
```javascript
// Cross-marketplace analytics
const analytics = await executeTool('amazon-analytics', {
  analysisType: 'cross-marketplace',
  marketplaces: ['UK', 'USA', 'EU'],
  dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' }
});

/*
Result includes:
- Revenue comparison across marketplaces
- Performance metrics and trends
- Market share analysis
- Optimization recommendations
- ROI calculations
*/
```

### Real-time Monitoring
```javascript
// System health monitoring
setInterval(async () => {
  const health = await executeTool('amazon-system', { action: 'health' });
  
  if (health.status !== 'healthy') {
    console.warn('Amazon integration health issue:', health);
    // Trigger alerts or recovery procedures
  }
}, 30000); // Check every 30 seconds
```

## Testing

### Unit Tests
```bash
# Run Amazon integration tests
npm test tests/amazon-integration.test.js

# Run specific test suites
npm test -- --grep "Authentication System"
npm test -- --grep "Caching System"
npm test -- --grep "Error Handling"
```

### Integration Tests
```bash
# Test with live SP-API (requires credentials)
NODE_ENV=test npm run test:integration:amazon

# Test individual marketplaces
npm run test:amazon:uk
npm run test:amazon:usa
```

### Load Testing
```bash
# Performance testing
npm run test:load:amazon

# Concurrent marketplace operations
npm run test:concurrent:amazon
```

## Troubleshooting

### Common Issues

#### Authentication Failures
```javascript
// Check credentials
const authStatus = await executeTool('amazon-auth', { action: 'status' });

// Refresh tokens
await executeTool('amazon-auth', { action: 'refresh' });

// Test specific marketplace
await executeTool('amazon-auth', { 
  action: 'test', 
  marketplaceId: 'UK',
  sandbox: true 
});
```

#### Rate Limiting
```javascript
// Check rate limit status
const stats = await executeTool('amazon-system', { action: 'stats' });
console.log('Rate limit info:', stats.rateLimiting);

// Clear rate limit state
await errorHandler.clearErrorHistory();
```

#### Cache Issues
```javascript
// Clear problematic cache
await executeTool('amazon-system', { 
  action: 'clear-cache',
  target: 'UK'  // Specific marketplace
});

// Check cache health
const cacheHealth = await cache.healthCheck();
console.log('Cache status:', cacheHealth);
```

#### Performance Issues
```javascript
// Analyze performance metrics
const metrics = await executeTool('amazon-system', { action: 'stats' });
console.log('Performance metrics:', metrics.performance);

// Get optimization recommendations
const optimization = await executeTool('amazon-analytics', {
  analysisType: 'optimization'
});
```

### Debug Mode
```javascript
// Enable detailed logging
process.env.LOG_LEVEL = 'debug';
process.env.AMAZON_DEBUG = 'true';

// Trace API calls
process.env.AMAZON_TRACE_API = 'true';
```

### Support Resources
- **Amazon SP-API Documentation**: https://developer-docs.amazon.com/sp-api/
- **Marketplace Central**: https://sellercentral.amazon.com/
- **Developer Console**: https://developer.amazon.com/docs/login-with-amazon/
- **MCP Integration Issues**: Check server logs and health endpoints

## Security Considerations

### Credential Management
- Store SP-API credentials in environment variables
- Use AWS Secrets Manager or similar for production
- Rotate refresh tokens regularly
- Implement IP whitelisting if possible

### Data Protection
- Encrypt sensitive order and customer data
- Implement data retention policies
- Comply with GDPR and regional regulations
- Use HTTPS for all API communications

### Access Control
- Implement role-based access control
- Audit API usage and access patterns
- Monitor for suspicious activity
- Use least-privilege principles

## Version History

### v1.0.0 (Current)
- ✅ Multi-marketplace support (UK, USA, EU, Canada)
- ✅ Complete SP-API integration with 6 core tools
- ✅ Business intelligence and analytics
- ✅ Compliance management system
- ✅ Enterprise caching and error handling
- ✅ MCP server integration

### Roadmap
- 🔄 Additional marketplace support (Japan, Australia)
- 🔄 Advanced AI-powered analytics
- 🔄 Real-time webhook integration
- 🔄 Enhanced compliance automation
- 🔄 Performance optimization tools

---

## Support

For technical support, feature requests, or bug reports related to the Amazon integration:

1. **Check Documentation**: Review this guide and the SP-API documentation
2. **System Health**: Use `amazon-system` tool to check integration status
3. **Debug Logs**: Enable debug mode for detailed error information
4. **Test Environment**: Use sandbox mode for development and testing

**Contact Information**:
- Development Team: sentia-dev@company.com
- Technical Support: mcp-support@company.com
- Documentation: docs@company.com