# SECURITY GUIDELINES
## Security-First Development for Sentia Manufacturing Dashboard

### 🔴 CRITICAL SECURITY RULES

**YOU MUST** follow these security rules WITHOUT EXCEPTION:

1. **NEVER** commit secrets, API keys, or credentials
2. **NEVER** use string concatenation for SQL queries
3. **NEVER** trust user input without validation
4. **NEVER** log sensitive data (PII, passwords, tokens)
5. **NEVER** disable security features for convenience
6. **ALWAYS** use parameterized queries
7. **ALWAYS** validate and sanitize inputs
8. **ALWAYS** use HTTPS for all communications
9. **ALWAYS** implement rate limiting
10. **ALWAYS** run `/security-review` before commits

---

## 🛡️ AUTHENTICATION & AUTHORIZATION

### Authentication (via Clerk)
```javascript
// CORRECT: Use Clerk for authentication
import { requireAuth } from '@clerk/nextjs';

export default requireAuth(async (req, res) => {
  // User is authenticated
  const { userId, sessionId } = req.auth;
});

// WRONG: Custom authentication
// DON'T implement custom auth logic
```

### Authorization (RBAC)
```javascript
// CORRECT: Check permissions
if (!user.hasPermission('products:write')) {
  throw new AuthorizationError('Insufficient permissions');
}

// WRONG: Role-only checking
if (user.role !== 'admin') { // Too broad
  // ...
}
```

### Session Management
- Session timeout: 30 minutes
- Refresh token rotation enabled
- Secure cookie settings:
  ```javascript
  {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 1800000 // 30 minutes
  }
  ```

---

## 🔐 DATA SECURITY

### Encryption
```javascript
// At Rest - Use AES-256
import { encrypt, decrypt } from '@/utils/crypto';

const encrypted = encrypt(sensitiveData, process.env.ENCRYPTION_KEY);
const decrypted = decrypt(encryptedData, process.env.ENCRYPTION_KEY);

// In Transit - Always HTTPS
// Enforced via Render configuration
```

### Database Security
```javascript
// CORRECT: Parameterized queries
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
);

// WRONG: String concatenation
const result = await db.query(
  `SELECT * FROM users WHERE email = '${userEmail}'` // SQL INJECTION!
);

// CORRECT: Input validation
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150)
});
const validated = schema.parse(input);

// WRONG: Direct use
const email = req.body.email; // Unvalidated!
```

### Sensitive Data Handling
```javascript
// CORRECT: Mask sensitive data
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
}

// CORRECT: Exclude sensitive fields
const user = await db.user.findUnique({
  select: {
    id: true,
    name: true,
    // password: false - excluded
    // ssn: false - excluded
  }
});

// WRONG: Logging sensitive data
console.log('User password:', user.password); // NEVER!
```

---

## 🚪 API SECURITY

### Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

// Standard API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests'
});

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 attempts
  skipSuccessfulRequests: true
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

### Input Validation
```javascript
import { body, validationResult } from 'express-validator';

// CORRECT: Comprehensive validation
router.post('/api/products',
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('price').isFloat({ min: 0 }),
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process validated input
  }
);
```

### CORS Configuration
```javascript
// CORRECT: Strict CORS
const corsOptions = {
  origin: [
    'https://sentia-manufacturing-dashboard-621h.onrender.com',
    'https://sentia-manufacturing-dashboard-test.onrender.com',
    'https://sentia-manufacturing-dashboard-production.onrender.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// WRONG: Wildcard
const corsOptions = {
  origin: '*' // NEVER in production!
};
```

### API Authentication
```javascript
// CORRECT: API key validation
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const hashedKey = crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');

  if (!validApiKeys.includes(hashedKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}
```

---

## 🌐 WEB SECURITY

### Content Security Policy
```javascript
// CORRECT: Strict CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.clerk.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.clerk.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));
```

### XSS Prevention
```javascript
// CORRECT: Sanitize HTML
import DOMPurify from 'isomorphic-dompurify';

const clean = DOMPurify.sanitize(userInput);

// CORRECT: Escape output
function escapeHtml(text: string): string {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// WRONG: Direct HTML insertion
element.innerHTML = userInput; // XSS vulnerability!
```

### CSRF Protection
```javascript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});
```

---

## 🔍 SECURITY MONITORING

### Logging Security Events
```javascript
// CORRECT: Structured security logging
import { securityLogger } from '@/services/logger';

securityLogger.warn('Failed login attempt', {
  ip: req.ip,
  email: maskEmail(email),
  timestamp: new Date().toISOString(),
  attemptNumber: attempts
});

// WRONG: Logging sensitive data
console.log('Failed login:', email, password); // NEVER!
```

### Audit Trail
```javascript
// Track all sensitive operations
async function auditLog(action: string, userId: string, details: any) {
  await db.auditLog.create({
    data: {
      action,
      userId,
      details: sanitizeDetails(details),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    }
  });
}

// Use for critical operations
await auditLog('DELETE_PRODUCT', userId, { productId });
await auditLog('EXPORT_DATA', userId, { format, records });
```

### Security Headers
```javascript
// ALWAYS include these headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
```

---

## 🚨 INCIDENT RESPONSE

### Security Breach Protocol
1. **Detect**: Monitor logs for anomalies
2. **Contain**: Isolate affected systems
3. **Assess**: Determine scope of breach
4. **Notify**: Alert security team and stakeholders
5. **Remediate**: Fix vulnerability
6. **Review**: Post-incident analysis

### Emergency Contacts
- Security Team: security@sentia.com
- DevOps: devops@sentia.com
- Legal: legal@sentia.com
- CEO: ceo@sentia.com

---

## 🧪 SECURITY TESTING

### Required Security Tests
```javascript
// Test for SQL injection
describe('SQL Injection Prevention', () => {
  it('should sanitize user input', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const result = await api.searchProducts(maliciousInput);
    expect(result).not.toThrow();
    // Verify table still exists
  });
});

// Test for XSS
describe('XSS Prevention', () => {
  it('should escape HTML in user content', () => {
    const xssAttempt = '<script>alert("XSS")</script>';
    const rendered = renderUserContent(xssAttempt);
    expect(rendered).not.toContain('<script>');
  });
});

// Test authentication
describe('Authentication', () => {
  it('should reject invalid tokens', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer invalid-token');
    expect(response.status).toBe(401);
  });
});
```

---

## 📋 SECURITY CHECKLIST

Before EVERY deployment:
- [ ] Run `/security-review` command
- [ ] No secrets in code
- [ ] All inputs validated
- [ ] SQL queries parameterized
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers set
- [ ] Dependencies updated
- [ ] Penetration test passed
- [ ] Audit logs working

---

## 🔗 SECURITY RESOURCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Render Security Best Practices](https://render.com/docs/security)
- [Clerk Security](https://clerk.com/docs/security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

**REMEMBER**: Security is not optional. Every line of code must be secure by default.