# Technical Architecture Plan
## Sentia Manufacturing Dashboard - SDD Implementation

### 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend Layer                       │
│  React 18 + Vite 4 + Tailwind CSS + Zustand + TanStack  │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTPS/WSS
┌─────────────────▼───────────────────────────────────────┐
│                  API Gateway Layer                       │
│     Express.js + Clerk Middleware + CORS + Rate Limit   │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                 Business Logic Layer                     │
│   Service Modules + Business Rules + Data Processing    │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              AI Orchestration Layer                      │
│    MCP Server + Multi-LLM + Vector DB + Decision Engine │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                  Data Access Layer                       │
│        Prisma ORM + PostgreSQL + pgvector + Redis       │
└──────────────────────────────────────────────────────────┘
```

### 2. Technology Stack Decisions

#### 2.1 Frontend Technologies
- **Framework**: React 18 (established, no change)
- **Build Tool**: Vite 4 (optimal performance)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand (layout) + TanStack Query (server state)
- **Real-time**: Server-Sent Events + WebSocket
- **Authentication**: @clerk/clerk-react

**Rationale**: Modern, performant stack with excellent DX

#### 2.2 Backend Technologies
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js
- **Authentication**: @clerk/express
- **Database ORM**: Prisma
- **Validation**: Zod
- **Logging**: Winston + structured logging

**Rationale**: Stable, well-supported ecosystem

#### 2.3 AI Integration
- **MCP Server**: Model Context Protocol
- **LLM Providers**: Claude 3.5, GPT-4, Gemini Pro
- **Vector Database**: pgvector
- **Orchestration**: Custom AI Central Nervous System

**Rationale**: Multi-provider resilience with fallback

#### 2.4 Infrastructure
- **Hosting**: Render (primary)
- **Database**: PostgreSQL with pgvector
- **CDN**: Cloudflare
- **Monitoring**: Custom + Render metrics
- **CI/CD**: GitHub Actions

**Rationale**: Proven platform with good PostgreSQL support

### 3. Architectural Patterns

#### 3.1 Design Patterns

##### Layered Architecture
```javascript
// Clear separation of concerns
├── Presentation Layer (React Components)
├── Application Layer (Business Logic)
├── Domain Layer (Core Models)
├── Infrastructure Layer (External Services)
```

##### Repository Pattern
```javascript
// Abstract data access
class UserRepository {
  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  async save(user) {
    return prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user
    });
  }
}
```

##### Service Layer Pattern
```javascript
// Business logic encapsulation
class ManufacturingService {
  constructor(repo, validator, logger) {
    this.repo = repo;
    this.validator = validator;
    this.logger = logger;
  }

  async processOrder(order) {
    await this.validator.validate(order);
    this.logger.info('Processing order', { orderId: order.id });
    return this.repo.save(order);
  }
}
```

##### Circuit Breaker Pattern
```javascript
// Fault tolerance for external services
class CircuitBreaker {
  constructor(service, threshold = 5, timeout = 60000) {
    this.service = service;
    this.failures = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';
  }

  async call(...args) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await this.service(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

#### 3.2 Security Patterns

##### Authentication Flow
```
1. User → Clerk Login
2. Clerk → JWT Token
3. Frontend → Store Token
4. API Calls → Include Token
5. Middleware → Validate Token
6. Route → Process Request
```

##### Authorization Matrix
```javascript
const permissions = {
  admin: ['*'],
  manager: ['read', 'write', 'approve'],
  operator: ['read', 'write'],
  viewer: ['read']
};
```

##### Input Validation
```javascript
// Zod schemas for all inputs
const orderSchema = z.object({
  id: z.string().uuid(),
  items: z.array(itemSchema),
  total: z.number().positive()
});
```

### 4. Data Architecture

#### 4.1 Database Schema Structure
```sql
-- Core Tables
Users (id, email, role, metadata)
Organizations (id, name, settings)
Dashboards (id, userId, layout, config)

-- Manufacturing Tables
Jobs (id, status, priority, deadline)
Resources (id, type, capacity, availability)
Products (id, name, sku, specifications)

-- Financial Tables
Transactions (id, type, amount, date)
WorkingCapital (id, current, projected)
Forecasts (id, scenario, results)

-- AI Tables
Embeddings (id, content, vector)
Conversations (id, context, history)
Decisions (id, input, output, confidence)
```

#### 4.2 Caching Strategy
- **Redis**: Session data, hot queries
- **Browser**: Static assets, API responses
- **CDN**: Images, scripts, styles
- **Database**: Query result caching

#### 4.3 Data Flow
```
User Input → Validation → Business Logic → Database
     ↓            ↓              ↓            ↓
   Cache      Audit Log    AI Processing  Response
```

### 5. Integration Architecture

#### 5.1 External Services
```javascript
// Unified API interface
class UnifiedAPIInterface {
  constructor() {
    this.services = {
      xero: new XeroService(),
      shopify: new ShopifyService(),
      amazon: new AmazonSPAPI(),
      unleashed: new UnleashedService()
    };
  }

  async fetch(service, method, params) {
    return this.services[service][method](params);
  }
}
```

#### 5.2 Event-Driven Architecture
```javascript
// Event bus for decoupling
class EventBus {
  emit(event, data) {
    // Publish to subscribers
  }

  on(event, handler) {
    // Subscribe to events
  }
}

// Usage
eventBus.on('order.created', async (order) => {
  await notificationService.send(order);
  await inventoryService.update(order);
  await analyticsService.track(order);
});
```

### 6. Deployment Architecture

#### 6.1 Environment Strategy
```yaml
Development:
  - URL: localhost:3000
  - Database: Development DB
  - Features: All enabled
  - Debugging: Verbose

Testing:
  - URL: sentia-testing.onrender.com
  - Database: Test DB
  - Features: Feature flags
  - Debugging: Standard

Production:
  - URL: sentia.onrender.com
  - Database: Production DB
  - Features: Stable only
  - Debugging: Minimal
```

#### 6.2 CI/CD Pipeline
```yaml
1. Code Push → GitHub
2. GitHub Actions → Run Tests
3. Tests Pass → Build Docker Image
4. Push Image → Registry
5. Deploy → Render
6. Health Check → Validate
7. Rollback → If Failed
```

### 7. Performance Architecture

#### 7.1 Optimization Strategies
- **Code Splitting**: Dynamic imports for routes
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: Large lists virtualized
- **Image Optimization**: WebP format, lazy loading

#### 7.2 Performance Budgets
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Bundle Size**: <2MB
- **API Response**: <500ms
- **Database Query**: <100ms

### 8. Error Handling Architecture

#### 8.1 Error Hierarchy
```javascript
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}
```

#### 8.2 Global Error Handler
```javascript
app.use((err, req, res, next) => {
  if (!err.isOperational) {
    logger.error('Unexpected error', err);
    // Alert monitoring service
  }

  res.status(err.statusCode || 500).json({
    error: {
      message: err.message,
      ...(isDevelopment && { stack: err.stack })
    }
  });
});
```

### 9. Monitoring Architecture

#### 9.1 Metrics Collection
- **Application Metrics**: Response times, error rates
- **Business Metrics**: User activity, feature usage
- **Infrastructure Metrics**: CPU, memory, disk
- **Custom Metrics**: AI usage, API calls

#### 9.2 Alerting Rules
```javascript
const alerts = {
  critical: {
    errorRate: > 1%,
    responseTime: > 2000ms,
    availability: < 99.9%
  },
  warning: {
    errorRate: > 0.5%,
    responseTime: > 1000ms,
    diskUsage: > 80%
  }
};
```

### 10. Development Standards

#### 10.1 Code Organization
```
src/
├── components/     # React components
├── hooks/         # Custom hooks
├── services/      # Business logic
├── utils/         # Utilities
├── api/          # API routes
├── models/       # Data models
├── types/        # TypeScript types
└── tests/        # Test files
```

#### 10.2 Naming Conventions
- **Components**: PascalCase (UserProfile)
- **Hooks**: camelCase with 'use' prefix (useAuth)
- **Services**: PascalCase with 'Service' suffix
- **Utils**: camelCase (formatDate)
- **Constants**: UPPER_SNAKE_CASE

#### 10.3 Git Workflow
```bash
# Feature development
git checkout -b feature/JIRA-123-description
# Make changes
git commit -m "feat: Add new feature"
# Push and create PR
git push origin feature/JIRA-123-description
```

---

*This technical architecture plan provides the foundation for implementing the Sentia Manufacturing Dashboard using spec-driven development principles.*