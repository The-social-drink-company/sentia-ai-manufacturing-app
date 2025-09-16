# ARCHITECTURE GUIDELINES
## System Design Rules for Sentia Manufacturing Dashboard

### MICROSERVICES ARCHITECTURE

#### Service Boundaries
- **API Gateway**: Single entry point for all client requests
- **Auth Service**: Clerk-based authentication and authorization
- **Data Service**: Database operations with Render PostgreSQL
- **Analytics Service**: AI/ML operations and forecasting
- **Integration Service**: External API connections (Shopify, Xero, etc.)
- **Notification Service**: Real-time updates via SSE/WebSocket

#### Communication Patterns
- **Synchronous**: REST APIs for request/response
- **Asynchronous**: Event-driven for background processing
- **Real-time**: SSE for live updates
- **Batch**: Scheduled jobs for data synchronization

### DATABASE ARCHITECTURE

#### PostgreSQL with pgvector
- **Primary Database**: Render PostgreSQL v16
- **Vector Storage**: pgvector extension for AI embeddings
- **Partitioning**: Time-based partitioning for historical data
- **Replication**: Read replicas for analytics queries

#### Data Patterns
```sql
-- ALWAYS use parameterized queries
SELECT * FROM products WHERE id = $1;

-- NEVER use string concatenation
-- BAD: "SELECT * FROM products WHERE id = " + id

-- Use vector similarity for AI features
SELECT * FROM products
ORDER BY embedding <=> $1
LIMIT 10;
```

### FRONTEND ARCHITECTURE

#### Component Hierarchy
```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Content
├── Pages
│   ├── Dashboard
│   ├── Analytics
│   └── Admin
└── Shared
    ├── Components
    ├── Hooks
    └── Utils
```

#### State Management
- **Zustand**: Application state
- **TanStack Query**: Server state
- **Context API**: Theme and auth
- **Local Storage**: User preferences

### API ARCHITECTURE

#### RESTful Design
```
GET    /api/v1/resources       # List
GET    /api/v1/resources/:id   # Read
POST   /api/v1/resources       # Create
PUT    /api/v1/resources/:id   # Update
DELETE /api/v1/resources/:id   # Delete
```

#### Response Format
```json
{
  "success": true,
  "data": {},
  "metadata": {
    "timestamp": "2025-09-16T08:00:00Z",
    "version": "1.0.0",
    "requestId": "uuid"
  },
  "errors": []
}
```

### SECURITY ARCHITECTURE

#### Defense in Depth
1. **Network Layer**: Cloudflare DDoS protection
2. **Application Layer**: Rate limiting, CORS
3. **Authentication**: Clerk with MFA
4. **Authorization**: RBAC with granular permissions
5. **Data Layer**: Encryption at rest and in transit

#### Security Headers
```javascript
// ALWAYS include these headers
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': "default-src 'self'"
}
```

### DEPLOYMENT ARCHITECTURE

#### Environments
- **Development**: Auto-deploy from `development` branch
- **Testing**: Manual deploy from `test` branch
- **Production**: Manual deploy from `production` branch

#### Infrastructure
```
Render Platform
├── Web Services (3)
│   ├── sentia-manufacturing-development
│   ├── sentia-manufacturing-testing
│   └── sentia-manufacturing-production
├── Databases (3)
│   ├── sentia-db-development
│   ├── sentia-db-testing
│   └── sentia-db-production
└── Static Assets
    └── CDN (Cloudflare)
```

### MONITORING ARCHITECTURE

#### Observability Stack
- **Metrics**: Application and business metrics
- **Logging**: Structured JSON logging
- **Tracing**: Distributed tracing for requests
- **Alerting**: PagerDuty integration

#### Key Metrics
- Response time < 200ms (p95)
- Error rate < 0.1%
- Availability > 99.9%
- Database query time < 100ms

### AI/ML ARCHITECTURE

#### Model Management
- **Embeddings**: OpenAI ada-002 (1536 dimensions)
- **Forecasting**: Ensemble of 4 models
- **Anomaly Detection**: Isolation Forest
- **NLP**: Claude 3.5 for analysis

#### Vector Operations
```javascript
// Similarity search pattern
const similar = await db.query(`
  SELECT *, 1 - (embedding <=> $1) as similarity
  FROM products
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> $1
  LIMIT $2
`, [queryEmbedding, limit]);
```

### CACHING ARCHITECTURE

#### Cache Layers
1. **Browser Cache**: Static assets
2. **CDN Cache**: Cloudflare
3. **Application Cache**: Redis
4. **Database Cache**: Query results

#### Cache Strategy
- **Cache-First**: Static content
- **Network-First**: Dynamic data
- **Stale-While-Revalidate**: Analytics

### ERROR HANDLING ARCHITECTURE

#### Error Types
```typescript
class ApplicationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

class ValidationError extends ApplicationError {}
class AuthenticationError extends ApplicationError {}
class AuthorizationError extends ApplicationError {}
class ServiceError extends ApplicationError {}
```

#### Error Recovery
- Automatic retry with exponential backoff
- Circuit breaker for external services
- Graceful degradation
- User-friendly error messages

### SCALABILITY PRINCIPLES

1. **Horizontal Scaling**: Stateless services
2. **Database Optimization**: Indexes and partitioning
3. **Caching**: Multi-layer caching strategy
4. **Async Processing**: Background jobs
5. **CDN**: Static asset delivery
6. **Load Balancing**: Render's automatic balancing

### COMPLIANCE ARCHITECTURE

#### Data Privacy
- GDPR compliance for EU users
- CCPA compliance for California users
- Data retention policies
- Right to be forgotten

#### Audit Trail
- All data modifications logged
- User actions tracked
- API access recorded
- Security events monitored

---

## DECISION RECORDS

### ADR-001: Render over Railway
**Decision**: Use Render for deployment
**Rationale**: Better PostgreSQL support, pgvector availability, cost-effective

### ADR-002: PostgreSQL with pgvector
**Decision**: Use PostgreSQL with pgvector for database
**Rationale**: Native vector operations for AI features

### ADR-003: Clerk for Authentication
**Decision**: Use Clerk for auth
**Rationale**: Enterprise features, MFA support, easy integration

### ADR-004: Zustand for State Management
**Decision**: Use Zustand over Redux
**Rationale**: Simpler API, better TypeScript support, smaller bundle