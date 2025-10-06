# Sentia AI Manufacturing App MCP Server Guide

## 🏭 Overview

The Sentia AI Manufacturing App MCP (Model Context Protocol) Server is an enterprise-grade AI orchestration system that provides comprehensive business intelligence capabilities for manufacturing operations. Built with the official `@modelcontextprotocol/sdk`, it offers seamless integration with Claude Desktop and other MCP-compatible clients.

## 🚀 Features

### Core Capabilities
- **Dual Transport Support**: Both stdio (Claude Desktop) and HTTP (web dashboard) transports
- **Dynamic Tool Loading**: Automatic discovery and registration of tools from the tools/ directory
- **Enterprise Security**: JWT authentication, rate limiting, and input validation
- **Production Monitoring**: Health checks, metrics collection, and comprehensive logging
- **Database Integration**: PostgreSQL with pgvector support for AI/ML workloads
- **Error Handling**: Advanced error classification, retry mechanisms, and circuit breakers

### Manufacturing Intelligence
- **Inventory Optimization**: AI-powered stock level recommendations
- **Demand Forecasting**: ML-based demand prediction with multiple models
- **Quality Prediction**: Real-time quality assessment and risk analysis
- **Working Capital Optimization**: Financial metrics optimization (DSO/DPO/DIO)
- **Cash Runway Analysis**: Scenario-based cash flow projections
- **Anomaly Detection**: Statistical anomaly detection across operational metrics

### Integration Capabilities
- **Unified API Gateway**: Single interface for Xero, Shopify, Amazon, Unleashed
- **Real-time Updates**: Server-Sent Events (SSE) for live data streaming
- **External AI Services**: Anthropic Claude, OpenAI GPT, Google Gemini integration
- **Database Analytics**: Read-only SQL query execution for business intelligence

## 🛠 Installation & Setup

### Prerequisites
- Node.js 18+ with ES Module support
- PostgreSQL database with pgvector extension
- Environment variables configured (see Configuration section)

### Installation
```bash
# Install dependencies
npm install

# Or with pnpm
pnpm install
```

### Database Setup
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create MCP requests table for vector storage
CREATE TABLE IF NOT EXISTS mcp_requests (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  provider VARCHAR(50),
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS mcp_requests_embedding_idx 
ON mcp_requests USING ivfflat (embedding vector_cosine_ops);
```

## ⚙️ Configuration

### Environment Variables

#### Core Server Settings
```env
# Server Configuration
MCP_SERVER_NAME=sentia-manufacturing-mcp
MCP_SERVER_PORT=3001
MCP_SERVER_HOST=0.0.0.0
NODE_ENV=development|testing|production

# Transport Configuration
MCP_TRANSPORT=dual                    # stdio, http, or dual
MCP_STDIO_ENABLED=true
MCP_HTTP_ENABLED=true
MCP_SSE_ENABLED=true

# Database Configuration
DATABASE_URL=postgresql://user:pass@host:5432/database
DB_MAX_CONNECTIONS=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000
DB_QUERY_LOGGING=false
DB_SLOW_QUERY_THRESHOLD=1000

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
AUTH_REQUIRED=false                   # Set to true in production
RATE_LIMITING_ENABLED=true
RATE_LIMIT_WINDOW=900000             # 15 minutes in ms
RATE_LIMIT_MAX=100                   # Requests per window

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://your-domain.com

# Logging Configuration
LOG_LEVEL=info                       # debug, info, warn, error
LOG_FORMAT=json
LOG_FILE_ENABLED=true
LOG_FILE_MAX_SIZE=5m
LOG_FILE_MAX_FILES=5
LOG_DIRECTORY=logs

# Tool Configuration
TOOLS_DIRECTORY=tools
ENABLED_TOOL_CATEGORIES=system,manufacturing,financial,database,integration
TOOL_TIMEOUT=30000
MAX_CONCURRENT_TOOLS=10
TOOL_CACHING_ENABLED=true
TOOL_CACHE_TTL=300

# Cache Configuration
CACHE_TYPE=memory                    # memory or redis
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=sentia-mcp:
MEMORY_CACHE_MAX_SIZE=1000

# Monitoring Configuration
MONITORING_ENABLED=true
METRICS_ENDPOINT=/metrics
HEALTH_ENDPOINT=/health
COLLECT_SYSTEM_METRICS=true
COLLECT_TOOL_METRICS=true
```

#### External Service Integration
```env
# Anthropic Claude
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-sonnet-20240229
ANTHROPIC_MAX_TOKENS=4096
ANTHROPIC_TEMPERATURE=0.7

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7

# Xero Integration
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
XERO_REDIRECT_URI=https://your-app.com/auth/xero/callback
XERO_SCOPES=accounting.read,accounting.transactions

# Shopify Integration
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-shopify-access-token
SHOPIFY_API_VERSION=2024-01

# Unleashed ERP
UNLEASHED_API_ID=your-unleashed-api-id
UNLEASHED_API_KEY=your-unleashed-api-key
UNLEASHED_BASE_URL=https://api.unleashedsoftware.com

# Amazon SP-API
AMAZON_SELLER_ID=your-amazon-seller-id
AMAZON_CLIENT_ID=your-amazon-client-id
AMAZON_CLIENT_SECRET=your-amazon-client-secret
AMAZON_REFRESH_TOKEN=your-amazon-refresh-token
AMAZON_REGION=us-east-1
```

## 🚀 Starting the Server

### Development Mode
```bash
# Start with auto-reload
npm run mcp:dev

# Or with pnpm
pnpm run mcp:dev
```

### Production Mode
```bash
# Start in production mode
npm run mcp:prod

# Or with custom configuration
NODE_ENV=production \
DATABASE_URL=your-production-db-url \
JWT_SECRET=your-production-secret \
npm run mcp:start
```

### Command Line Options
```bash
# Available CLI options
node scripts/start-mcp-server.js --help

# Examples
node scripts/start-mcp-server.js --port 3001 --env production
node scripts/start-mcp-server.js --log-level debug
```

## 🔧 Tool Development

### Creating Custom Tools

Tools are automatically discovered from the `tools/` directory. Each tool should export an object with the following structure:

```javascript
// tools/example-tool.js
export default {
  name: 'example-tool',
  description: 'Description of what this tool does',
  category: 'manufacturing',
  version: '1.0.0',
  
  // Optional JSON schema for input validation
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'First parameter' },
      param2: { type: 'number', minimum: 0 }
    },
    required: ['param1']
  },
  
  // Tool execution function
  async execute(params) {
    const { param1, param2, correlationId, timestamp } = params;
    
    try {
      // Your tool logic here
      const result = await someOperation(param1, param2);
      
      return {
        success: true,
        data: result,
        processingTime: Date.now() - new Date(timestamp).getTime()
      };
    } catch (error) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }
};
```

### Tool Categories
- **system**: Server management and monitoring tools
- **manufacturing**: Production, inventory, and quality tools
- **financial**: Working capital, cash flow, and financial analysis tools
- **database**: Database queries and analytics tools
- **integration**: External API integrations and data synchronization

### Built-in Tools

#### System Tools
- `system-status`: Get comprehensive system health and metrics
- `list-tools`: List all available tools with filtering
- `database-query`: Execute read-only SQL queries

#### Manufacturing Tools
- `inventory-optimization`: AI-powered inventory level optimization
- `demand-forecast`: ML-based demand forecasting
- `quality-prediction`: Real-time quality assessment
- `maintenance-scheduling`: Predictive maintenance planning

#### Financial Tools
- `working-capital-optimization`: DSO/DPO/DIO optimization
- `cash-runway-analysis`: Multi-scenario cash flow analysis

#### Integration Tools
- `unified-api-call`: Proxy calls to external APIs
- `anomaly-detection`: Statistical anomaly detection

## 🔌 Claude Desktop Integration

### Configuration
1. Copy the configuration to your Claude Desktop settings:

```json
{
  "mcpServers": {
    "sentia-manufacturing": {
      "command": "node",
      "args": ["scripts/start-mcp-server.js"],
      "cwd": "/path/to/sentia-manufacturing-dashboard",
      "env": {
        "NODE_ENV": "development",
        "MCP_TRANSPORT": "stdio",
        "DATABASE_URL": "your-database-url"
      }
    }
  }
}
```

2. Restart Claude Desktop to load the server

### Usage Examples
```
# Get system status
What's the current status of the manufacturing system?

# Analyze inventory
Can you optimize our inventory levels for SKUs ABC-123 and XYZ-789?

# Financial analysis
Analyze our working capital metrics and suggest improvements

# Quality prediction
Predict quality issues based on current production parameters: 
temperature=75°C, pressure=2.5bar, humidity=45%

# Database query
Query our production database to show top 10 products by volume this month
```

## 🌐 HTTP API Usage

### Authentication
```bash
# Get JWT token (implement your own auth endpoint)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

### Tool Execution
```bash
# Execute a tool via HTTP
curl -X POST http://localhost:3001/api/tools/system-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"includeMetrics": true}'
```

### Real-time Events
```javascript
// Subscribe to server events via SSE
const eventSource = new EventSource('http://localhost:3001/api/events');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received event:', data);
};
```

### Health Monitoring
```bash
# Check server health
curl http://localhost:3001/health

# Get metrics
curl http://localhost:3001/metrics
```

## 📊 Monitoring & Observability

### Health Checks
The server provides comprehensive health endpoints:

- **`/health`**: Basic health status with system metrics
- **`/metrics`**: Detailed performance metrics
- **`/api/tools`**: Available tools and capabilities

### Logging
Structured logging with correlation IDs:

```javascript
// All operations include correlation IDs for request tracking
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Tool execution completed",
  "correlationId": "123e4567-e89b-12d3-a456-426614174000",
  "toolName": "inventory-optimization",
  "executionTime": 1250,
  "success": true
}
```

### Error Handling
Advanced error classification and metrics:

- **Error Types**: Validation, Authentication, Database, External API, etc.
- **Severity Levels**: Low, Medium, High, Critical
- **Retry Logic**: Automatic retry with exponential backoff
- **Circuit Breakers**: Prevent cascading failures

### Performance Metrics
- Request/response times
- Tool execution statistics
- Database query performance
- Memory and CPU usage
- Error rates and classifications

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication with configurable expiration
- Role-based access control (RBAC) support
- Rate limiting with configurable windows and thresholds

### Input Validation
- JSON schema validation for all tool parameters
- SQL injection prevention for database queries
- XSS protection with helmet.js middleware

### Production Security
- HTTPS enforcement in production
- CORS configuration for cross-origin requests
- Security headers with Content Security Policy
- Environment-based security settings

## 🚀 Deployment

### Render Deployment
Add MCP server to your render.yaml:

```yaml
services:
  - type: web
    name: sentia-mcp-server
    env: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm run mcp:prod
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: MCP_SERVER_PORT
        value: 3001
      - key: DATABASE_URL
        fromDatabase:
          name: sentia-manufacturing-db
          property: connectionString
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["npm", "run", "mcp:prod"]
```

### Environment-Specific Configuration
- **Development**: Relaxed security, detailed logging, auto-reload
- **Testing**: Moderate security, comprehensive monitoring
- **Production**: Maximum security, minimal logging, performance optimization

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

### Integration Tests
```bash
# Test tool execution
npm run test:integration

# Test database connectivity
npm run test:db
```

### Load Testing
```bash
# Test server performance
npm run test:load
```

## 🐛 Troubleshooting

### Common Issues

#### Server Won't Start
1. Check environment variables are set correctly
2. Verify database connectivity
3. Ensure required directories exist (logs/, tmp/)
4. Check for port conflicts

#### Tool Execution Failures
1. Verify tool schema validation
2. Check database connections
3. Review error logs for specific failures
4. Test external API connectivity

#### Performance Issues
1. Monitor memory usage and heap size
2. Check database query performance
3. Review tool execution times
4. Analyze error rates and patterns

### Debug Mode
```bash
# Start with debug logging
LOG_LEVEL=debug npm run mcp:dev

# Or with specific debug flags
DEBUG=sentia:* npm run mcp:dev
```

### Log Analysis
```bash
# View error logs
tail -f logs/error.log

# View all logs with correlation ID
grep "correlation-id-here" logs/combined.log

# Monitor real-time logs
tail -f logs/combined.log | jq '.'
```

## 📈 Performance Optimization

### Database Optimization
- Connection pooling with configurable limits
- Query timeout and slow query logging
- Read-only query restrictions for security
- Vector similarity search optimization

### Caching Strategies
- In-memory LRU cache for frequently accessed data
- Redis support for distributed caching
- Tool response caching with configurable TTL
- Database query result caching

### Resource Management
- Memory monitoring with automatic cleanup
- CPU usage tracking and alerting
- Connection limiting and cleanup
- File system cleanup for temporary resources

## 🔄 Maintenance

### Regular Tasks
- Log rotation and cleanup
- Database maintenance and optimization
- Cache cleanup and optimization
- Security updates and patches

### Monitoring Checklist
- [ ] System health status
- [ ] Database connectivity
- [ ] External API availability
- [ ] Memory and CPU usage
- [ ] Error rates and classifications
- [ ] Tool execution performance

### Backup Procedures
- Database backups with point-in-time recovery
- Configuration backup and versioning
- Log archival and retention policies
- Disaster recovery procedures

## 📚 API Reference

### Tool Execution API
```
POST /api/tools/{toolName}
Content-Type: application/json
Authorization: Bearer {jwt-token}

{
  "param1": "value1",
  "param2": 42
}
```

### System Status API
```
GET /health
GET /metrics
GET /api/tools
GET /api/tools?category=manufacturing
```

### Real-time Events API
```
GET /api/events
Accept: text/event-stream
```

For complete API documentation, see the OpenAPI specification in `docs/api/`.

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Install dependencies: `npm install`
4. Start development server: `npm run mcp:dev`
5. Run tests: `npm test`
6. Submit pull request

### Code Style
- ES6+ modules with import/export
- Async/await for asynchronous operations
- Comprehensive error handling
- JSDoc documentation for all functions
- ESLint and Prettier for code formatting

### Pull Request Guidelines
- Include tests for new features
- Update documentation as needed
- Follow semantic versioning
- Include performance benchmarks for changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting guide
- Review the API documentation
- Contact the development team

---

**Built with ❤️ for Manufacturing Excellence**