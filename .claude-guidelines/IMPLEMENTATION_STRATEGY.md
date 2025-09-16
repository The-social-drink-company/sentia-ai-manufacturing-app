# CLAUDE CODE IMPLEMENTATION STRATEGY
## Enterprise Best Practices Configuration

**Project**: Sentia Manufacturing Dashboard
**Version**: 2.0.0
**Platform**: Render PostgreSQL with pgvector

---

## 🎯 CRITICAL RULES

YOU MUST follow these rules WITHOUT EXCEPTION:

1. **NEVER** reference Railway or Neon in any code or documentation
2. **ALWAYS** use Render PostgreSQL with pgvector for database operations
3. **SECURITY FIRST** - Run `/security-review` before EVERY commit
4. **FOLLOW** enterprise patterns in `.claude/patterns/` directory
5. **USE** TypeScript for all new code with strict type checking
6. **MAINTAIN** 80%+ test coverage for all code changes
7. **DOCUMENT** all architectural decisions in ADRs
8. **VALIDATE** all external API inputs and outputs
9. **ENCRYPT** all sensitive data at rest and in transit
10. **LOG** all critical operations with structured logging

---

## 📁 PROJECT STRUCTURE

```
sentia-manufacturing-dashboard/
├── .claude/                    # Claude Code configuration
│   ├── guidelines/             # AI guidelines (this folder)
│   ├── patterns/              # Code templates
│   └── security/              # Security rules
├── .cursor/                   # Cursor IDE settings
├── .github/                   # GitHub workflows
├── docs/                      # Documentation
├── src/                       # Source code
├── tests/                     # Test suites
├── config/                    # Configuration
├── security/                  # Security policies
└── CLAUDE.md                  # Main guidelines
```

---

## 🔧 CODE PATTERNS

### Component Pattern
```typescript
// ALWAYS use this pattern for React components
import React, { memo } from 'react';
import { useAuthRole } from '@/hooks/useAuthRole';

interface ComponentProps {
  // Type all props
}

export const Component = memo<ComponentProps>(({ props }) => {
  // Security check first
  const { hasPermission } = useAuthRole();

  // Early return for unauthorized
  if (!hasPermission('view:component')) {
    return null;
  }

  // Component logic
  return <div>{/* Content */}</div>;
});

Component.displayName = 'Component';
```

### Service Pattern
```typescript
// ALWAYS use this pattern for services
export class ServiceName {
  private static instance: ServiceName;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): ServiceName {
    if (!ServiceName.instance) {
      ServiceName.instance = new ServiceName();
    }
    return ServiceName.instance;
  }

  public async methodName(params: TypedParams): Promise<TypedResult> {
    try {
      // Validate inputs
      this.validateParams(params);

      // Business logic
      const result = await this.performOperation(params);

      // Log success
      logger.info('Operation completed', { params, result });

      return result;
    } catch (error) {
      // Log error
      logger.error('Operation failed', { params, error });
      throw new ServiceError('Operation failed', { cause: error });
    }
  }
}
```

### API Endpoint Pattern
```typescript
// ALWAYS use this pattern for API endpoints
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

export const endpointHandler = [
  // Validation middleware
  body('field').isString().trim().notEmpty(),

  // Handler
  async (req: Request, res: Response) => {
    // Check validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Security check
      if (!req.user?.hasPermission('action:perform')) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Business logic
      const result = await service.performAction(req.body);

      // Response
      res.json({ success: true, data: result });
    } catch (error) {
      // Error handling
      logger.error('Endpoint error', { error, body: req.body });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
];
```

---

## 🔒 SECURITY REQUIREMENTS

### Authentication & Authorization
- Use Clerk for all authentication
- Implement RBAC with granular permissions
- Validate all JWT tokens
- Enforce MFA for admin accounts
- Session timeout after 30 minutes of inactivity

### Data Security
- Encrypt all PII data using AES-256
- Use parameterized queries for all database operations
- Implement rate limiting on all API endpoints
- Validate and sanitize all user inputs
- Use CSP headers to prevent XSS attacks

### API Security
- Require API keys for all external endpoints
- Implement request signing for sensitive operations
- Use HTTPS for all communications
- Implement CORS with strict origin policies
- Log all API access with audit trails

---

## 🧪 TESTING REQUIREMENTS

### Test Coverage
- Minimum 80% code coverage
- 100% coverage for critical business logic
- All API endpoints must have integration tests
- All React components must have unit tests
- Security tests for all authentication flows

### Test Patterns
```typescript
// Unit test pattern
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should handle expected behavior', () => {
    // Arrange
    const input = createTestInput();

    // Act
    const result = performAction(input);

    // Assert
    expect(result).toMatchExpectedOutput();
  });

  it('should handle error cases', () => {
    // Test error scenarios
  });
});
```

---

## 📊 PERFORMANCE STANDARDS

### Response Times
- API responses < 200ms (p95)
- Page load < 2 seconds
- Time to interactive < 3 seconds
- Database queries < 100ms

### Resource Limits
- Bundle size < 500KB gzipped
- Memory usage < 512MB per container
- CPU usage < 80% sustained
- Database connections < 100 concurrent

---

## 🚀 DEPLOYMENT CHECKLIST

Before EVERY deployment:
1. [ ] Run `/security-review` command
2. [ ] All tests passing (100%)
3. [ ] Code coverage > 80%
4. [ ] No high/critical vulnerabilities
5. [ ] Documentation updated
6. [ ] Database migrations tested
7. [ ] Performance benchmarks met
8. [ ] Security scan completed
9. [ ] Rollback plan documented
10. [ ] Monitoring alerts configured

---

## 🔄 CONTINUOUS IMPROVEMENT

### Weekly Reviews
- Security vulnerability assessment
- Performance metrics review
- Code quality metrics
- Technical debt assessment

### Monthly Updates
- Dependency updates
- Security patches
- Performance optimization
- Documentation updates

---

## ⚠️ FORBIDDEN PRACTICES

NEVER do the following:
- ❌ Hardcode secrets or API keys
- ❌ Use console.log in production code
- ❌ Skip security validation
- ❌ Ignore TypeScript errors
- ❌ Deploy without tests
- ❌ Use deprecated packages
- ❌ Store PII in logs
- ❌ Use synchronous file operations
- ❌ Ignore error handling
- ❌ Skip code reviews

---

## 📞 ESCALATION

For critical issues:
1. Security vulnerabilities → Security team immediately
2. Performance degradation → DevOps team
3. Data integrity issues → Database team
4. Architecture decisions → Architecture review board

---

**Remember**: Quality > Speed. Security > Features. Documentation > Assumptions.