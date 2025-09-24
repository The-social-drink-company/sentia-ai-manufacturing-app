# Priority Tasks - Spec-Driven Implementation
## Sentia Manufacturing Dashboard

### Task Organization Structure
Tasks are organized by priority and dependency. Each task is:
- **Small**: Completable in <2 hours
- **Testable**: Has clear acceptance criteria
- **Specific**: No ambiguity in requirements
- **Reviewable**: Produces verifiable output

---

## CRITICAL - P0 Tasks (Immediate - Fix Breaking Issues)

### TASK-001: Fix Clerk Authentication Middleware Order
**Priority**: P0 - CRITICAL
**Time**: 30 minutes
**Dependencies**: None

#### Specification
The health check endpoint must be accessible without authentication to allow monitoring services to verify application status.

#### Current Problem
```javascript
// WRONG ORDER - Health check blocked
app.use(clerkMiddleware());
app.get('/health', healthHandler);
```

#### Required Implementation
```javascript
// CORRECT ORDER - Health check first
app.get('/health', healthHandler);
app.use(clerkMiddleware());
```

#### File to Modify
- `server.js` (lines 50-70)
- `minimal-server.js` (similar structure)

#### Acceptance Criteria
- [ ] `/health` endpoint responds without authentication
- [ ] All other endpoints require authentication
- [ ] No blank screen errors on login
- [ ] Health check returns proper JSON response

#### Validation
```bash
# Test health endpoint
curl http://localhost:5000/health
# Should return: {"status":"healthy"}

# Test protected endpoint
curl http://localhost:5000/api/users
# Should return: 401 Unauthorized
```

---

### TASK-002: Validate Clerk Environment Variables
**Priority**: P0 - CRITICAL
**Time**: 45 minutes
**Dependencies**: None

#### Specification
Ensure all required Clerk environment variables are loaded and validated on application startup.

#### Implementation
```javascript
// env-validator.js
const requiredEnvVars = [
  'VITE_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'VITE_CLERK_DOMAIN'
];

function validateEnvironment() {
  const missing = requiredEnvVars.filter(
    key => !process.env[key]
  );

  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log('Environment validation passed');
}

// Call on startup
validateEnvironment();
```

#### Files to Create/Modify
- Create: `src/utils/env-validator.js`
- Modify: `server.js` (add validation on line 1)
- Modify: `src/main.jsx` (add client-side validation)

#### Acceptance Criteria
- [ ] Application fails to start with clear error if env vars missing
- [ ] All required variables documented
- [ ] Validation runs before any other initialization
- [ ] Both frontend and backend validate their respective variables

---

### TASK-003: Implement CORS Configuration Fix
**Priority**: P0 - CRITICAL
**Time**: 30 minutes
**Dependencies**: TASK-002

#### Specification
Configure CORS to allow authenticated requests from all deployment environments.

#### Implementation
```javascript
// cors-config.js
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://sentia-testing.onrender.com',
      'https://sentia.onrender.com',
      'https://sentiaprod.financeflo.ai'
    ];

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count']
};

app.use(cors(corsOptions));
```

#### Files to Modify
- `server.js` (update CORS configuration)
- `minimal-server.js` (update CORS configuration)

#### Acceptance Criteria
- [ ] Frontend can authenticate from all environments
- [ ] Credentials included in requests
- [ ] Preflight requests succeed
- [ ] No CORS errors in console

---

## HIGH PRIORITY - P1 Tasks (This Week)

### TASK-004: Create Specification Lock Files
**Priority**: P1
**Time**: 1 hour
**Dependencies**: None

#### Specification
Create immutable specification files that prevent AI from changing critical code.

#### Files to Create
```yaml
# .specify/locks/authentication.lock.yaml
component: Authentication
version: 1.0.0
locked: true
invariants:
  - Clerk is the only authentication provider
  - Health endpoints bypass authentication
  - Middleware order is critical
  - Role-based access control required
```

#### Acceptance Criteria
- [ ] Lock files for all critical components
- [ ] Clear documentation of invariants
- [ ] AI instructions reference lock files
- [ ] Version tracking implemented

---

### TASK-005: Implement Structured Logging
**Priority**: P1
**Time**: 2 hours
**Dependencies**: None

#### Specification
Replace all console.log statements with structured logging.

#### Implementation
```javascript
// logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export const logInfo = (message, meta) => logger.info(message, meta);
export const logError = (message, error) => logger.error(message, { error: error.message, stack: error.stack });
export const logWarn = (message, meta) => logger.warn(message, meta);
```

#### Files to Modify
- Create: `src/utils/logger.js`
- Update: All files with console.log (355+ instances)

#### Acceptance Criteria
- [ ] No console.log in production code
- [ ] All logs structured with metadata
- [ ] Log levels appropriate
- [ ] Performance impact minimal

---

### TASK-006: Fix Database Connection Management
**Priority**: P1
**Time**: 1 hour
**Dependencies**: TASK-002

#### Specification
Implement proper connection pooling and error handling for database.

#### Implementation
```javascript
// db-connection.js
import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: ['error'],
    errorFormat: 'minimal'
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn']
    });
  }
  prisma = global.prisma;
}

// Connection health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected' };
  } catch (error) {
    return { status: 'disconnected', error: error.message };
  }
}

export default prisma;
```

#### Acceptance Criteria
- [ ] Connection pooling implemented
- [ ] Graceful error handling
- [ ] Health check endpoint works
- [ ] No connection leaks

---

### TASK-007: Implement Drift Detection Script
**Priority**: P1
**Time**: 2 hours
**Dependencies**: TASK-004

#### Specification
Create automated script to detect code drift from specifications.

#### Implementation
```javascript
// scripts/drift-detector.js
const fs = require('fs');
const path = require('path');

class DriftDetector {
  constructor() {
    this.specifications = this.loadSpecifications();
    this.violations = [];
  }

  loadSpecifications() {
    // Load all .lock.yaml files
    const lockDir = path.join(__dirname, '../.specify/locks');
    // ... implementation
  }

  checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for violations
    if (content.includes('console.log') && !filePath.includes('test')) {
      this.violations.push({
        file: filePath,
        issue: 'console.log found in production code'
      });
    }

    // Check for authentication pattern violations
    if (filePath.includes('server.js')) {
      // Verify middleware order
      // ... implementation
    }
  }

  report() {
    if (this.violations.length > 0) {
      console.error('Drift detected:');
      this.violations.forEach(v => {
        console.error(`  ${v.file}: ${v.issue}`);
      });
      process.exit(1);
    } else {
      console.log('No drift detected');
    }
  }
}
```

#### Acceptance Criteria
- [ ] Detects specification violations
- [ ] Runs in CI/CD pipeline
- [ ] Clear error reporting
- [ ] Configurable rules

---

## MEDIUM PRIORITY - P2 Tasks (This Month)

### TASK-008: Implement Test Infrastructure
**Priority**: P2
**Time**: 3 hours
**Dependencies**: TASK-005

#### Specification
Fix and implement comprehensive test infrastructure.

#### Implementation Steps
1. Fix Vitest configuration
2. Add Playwright for E2E
3. Create test utilities
4. Add coverage reporting

#### Acceptance Criteria
- [ ] Unit tests run successfully
- [ ] Integration tests configured
- [ ] E2E tests working
- [ ] Coverage > 60%

---

### TASK-009: Optimize Bundle Size
**Priority**: P2
**Time**: 2 hours
**Dependencies**: None

#### Specification
Reduce bundle size through code splitting and lazy loading.

#### Implementation
- Dynamic imports for routes
- Lazy load heavy components
- Tree shaking optimization
- Compression configuration

#### Acceptance Criteria
- [ ] Bundle size < 2MB
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Performance improved

---

### TASK-010: Implement Performance Monitoring
**Priority**: P2
**Time**: 2 hours
**Dependencies**: TASK-005

#### Specification
Add performance monitoring and metrics collection.

#### Implementation
- Response time tracking
- Memory usage monitoring
- Database query performance
- Frontend metrics (Web Vitals)

#### Acceptance Criteria
- [ ] Metrics collected
- [ ] Dashboard for monitoring
- [ ] Alerts configured
- [ ] Historical data stored

---

## Task Execution Order

### Week 1 - Critical Fixes
1. TASK-001: Fix Clerk Middleware (30 min)
2. TASK-002: Validate Environment (45 min)
3. TASK-003: Fix CORS (30 min)
4. TASK-004: Create Lock Files (1 hr)
5. TASK-005: Structured Logging (2 hr)
6. TASK-006: Fix Database (1 hr)
7. TASK-007: Drift Detection (2 hr)

### Week 2-3 - Stabilization
8. TASK-008: Test Infrastructure (3 hr)
9. TASK-009: Bundle Optimization (2 hr)
10. TASK-010: Performance Monitoring (2 hr)

### Week 4 - Enhancement
- Additional tasks based on priorities
- Feature implementations
- UI/UX improvements

## Validation Checklist for Each Task

Before marking any task as complete:
- [ ] Code follows specifications
- [ ] Tests written and passing
- [ ] No regression in existing features
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to test environment
- [ ] Acceptance criteria met

## Success Metrics

### Week 1 Success
- Zero authentication failures
- All P0 tasks complete
- Drift detection operational

### Month 1 Success
- 80% test coverage
- <2s page load times
- Zero critical bugs
- All P1 tasks complete

### Quarter 1 Success
- Full feature parity
- 99.9% uptime
- NPS score > 40
- Technical debt reduced by 50%

---

*These tasks provide a clear, testable path to fixing critical issues and preventing future drift in the Sentia Manufacturing Dashboard.*