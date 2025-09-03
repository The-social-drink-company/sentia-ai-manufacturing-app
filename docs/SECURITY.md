# Security Policy

## Security Guidelines for Sentia Manufacturing Dashboard

### Overview

This document outlines the security policies, procedures, and best practices for the Sentia Manufacturing Dashboard application. All developers and operators must adhere to these guidelines to maintain the security and integrity of the system.

## Security Architecture

### Authentication & Authorization

- **Primary Auth**: Clerk.dev with role-based access control (RBAC)
- **Supported Roles**: admin, cfo, financial_manager, financial_analyst, operator, viewer
- **Session Management**: Secure JWT tokens with automatic rotation
- **MFA**: Multi-factor authentication enforced for admin and financial roles

### Data Protection

#### Encryption
- **In Transit**: TLS 1.3 minimum for all communications
- **At Rest**: Database-level encryption via Neon PostgreSQL
- **API Keys**: Stored in Railway secrets management, rotated quarterly

#### Data Classification
- **Public**: Marketing content, general product information
- **Internal**: Operational metrics, non-financial data
- **Confidential**: Financial data, user information
- **Restricted**: Authentication secrets, API keys, audit logs

### Network Security

#### CORS Configuration
```javascript
// Allowed origins for development and production
CORS_ORIGINS=https://sentia-manufacturing.railway.app,https://dev.sentia-manufacturing.railway.app
```

#### Content Security Policy
- Script sources limited to self and approved CDNs
- No inline scripts or eval() allowed
- Nonce-based CSP for dynamic content
- Image sources restricted to trusted domains

#### Rate Limiting
- **General API**: 1000 requests per 15 minutes per IP
- **Authentication**: 20 requests per 5 minutes per IP
- **File Upload**: 50 uploads per hour per user
- **Admin Actions**: 100 requests per hour per user

### Secrets Management

#### Environment Variables
Never commit secrets to the repository. Use Railway environment variables for:

**Required Secrets:**
- `CLERK_SECRET_KEY`: Clerk backend authentication
- `DATABASE_URL`: Neon PostgreSQL connection string
- `UNLEASHED_API_KEY`: Unleashed Software API key

**Optional Secrets:**
- `GLOBAL_FX_API_KEY`: Foreign exchange rate provider key
- `UK_HOLIDAY_API_KEY`: UK government holiday calendar API
- `EU_HOLIDAY_API_KEY`: European Central Bank holiday calendar API
- `US_HOLIDAY_API_KEY`: Federal Reserve holiday calendar API

#### Secret Rotation Schedule
- **Critical secrets**: Every 90 days
- **API keys**: Every 180 days
- **Database passwords**: Every 365 days or on security incident

### Input Validation & Sanitization

#### Server-Side Validation
All API endpoints use express-validator for:
- Input type checking
- Length limits
- Format validation
- SQL injection prevention
- XSS protection

#### File Upload Security
- File type validation (CSV, XLSX, JSON only)
- File size limits (10MB maximum)
- Virus scanning (planned)
- Temporary file cleanup

### Logging & Monitoring

#### Security Events Logged
- Failed authentication attempts
- Rate limit violations
- Privilege escalation attempts
- File access violations
- Database connection failures

#### Log Storage
- **Retention**: 90 days for development, 1 year for production
- **Location**: Winston daily rotate files + external log aggregation
- **Format**: Structured JSON with correlation IDs

### Vulnerability Management

#### Dependency Security
- Automated dependency scanning via Renovate
- Security updates applied within 48 hours for critical vulnerabilities
- Monthly security review of all dependencies

#### Code Security
- ESLint security plugin enabled
- No hardcoded secrets in source code
- Regular security-focused code reviews
- Automated SAST scanning (planned)

### Incident Response

#### Security Incident Classification
1. **Critical**: Data breach, system compromise, authentication bypass
2. **High**: Privilege escalation, unauthorized access, service disruption
3. **Medium**: Brute force attempts, suspicious activity, configuration issues
4. **Low**: Policy violations, minor security misconfigurations

#### Response Procedures
1. **Immediate**: Isolate affected systems, prevent further damage
2. **Investigation**: Gather logs, identify scope and root cause
3. **Containment**: Apply patches, rotate secrets, update configurations
4. **Recovery**: Restore services, verify security posture
5. **Review**: Post-incident analysis, update procedures

### Compliance Requirements

#### Data Protection Regulations
- **GDPR**: EU data protection compliance enabled by default
- **CCPA**: California consumer privacy protection (if applicable)
- **SOX**: Financial data handling for public companies

#### Industry Standards
- **ISO 27001**: Information security management
- **SOC 2**: Service organization controls for security
- **PCI DSS**: Payment card data security (if processing payments)

### Security Development Practices

#### Secure Coding Guidelines
1. Never log sensitive information
2. Use parameterized queries for database access
3. Validate all inputs at API boundaries
4. Implement proper error handling without information leakage
5. Use secure random number generation
6. Follow principle of least privilege

#### Code Review Security Checklist
- [ ] No hardcoded secrets or credentials
- [ ] Input validation on all user inputs
- [ ] Proper authentication and authorization checks
- [ ] No SQL injection vulnerabilities
- [ ] XSS protection implemented
- [ ] Error messages don't leak sensitive information
- [ ] Logging captures security events appropriately

### Deployment Security

#### Production Environment
- **Network**: Railway private networking with load balancers
- **Database**: Neon PostgreSQL with SSL/TLS encryption
- **Monitoring**: Real-time security monitoring and alerting
- **Backups**: Encrypted backups with 30-day retention

#### Environment Separation
- **Development**: Isolated environment with mock data
- **Test**: Staging environment with production-like configuration
- **Production**: Live environment with full security controls

### Security Training

#### Required Training Topics
1. Secure coding practices
2. OWASP Top 10 vulnerabilities
3. Authentication and authorization
4. Data protection and privacy
5. Incident response procedures

#### Training Schedule
- New developers: Security training within first week
- All team members: Annual security refresher
- Security team: Quarterly advanced security training

### Emergency Contacts

#### Internal Security Team
- **Security Lead**: [To be assigned]
- **Development Lead**: [To be assigned]
- **Operations Lead**: [To be assigned]

#### External Partners
- **Clerk Support**: security@clerk.dev
- **Railway Security**: security@railway.app
- **Neon Security**: security@neon.tech

### Security Metrics

#### Key Performance Indicators
- Mean Time to Detection (MTTD): < 15 minutes
- Mean Time to Response (MTTR): < 1 hour for critical incidents
- Vulnerability Remediation: < 48 hours for critical, < 7 days for high
- Security Training Completion: 100% annually

#### Regular Security Reviews
- **Daily**: Automated security scans and monitoring
- **Weekly**: Security log review and analysis
- **Monthly**: Vulnerability assessment and dependency audit
- **Quarterly**: Security architecture review and penetration testing
- **Annually**: Comprehensive security audit and policy review

## Reporting Security Issues

### Internal Reporting
For security issues discovered by team members:
1. Create a private GitHub issue with "Security" label
2. Notify security lead immediately via secure channel
3. Do not discuss in public channels until resolved

### External Reporting
For security researchers and external parties:
1. Email: security@sentia-manufacturing.com
2. Encrypted communication preferred
3. Responsible disclosure with 90-day timeline

### Bug Bounty Program
Currently not available. Under consideration for future implementation.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: April 2025  
**Owner**: Development Team