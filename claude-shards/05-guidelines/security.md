# Security Guidelines

**Last Updated**: October 20, 2025
**Category**: Guidelines
**Related Shards**: [code-standards.md](./code-standards.md)

## External Documentation

**See**: `context/security-guidelines.md` for security practices including:

- Vulnerability management
- Security action plans
- Quality gates and rollback indicators
- Documentation standards

## Quick Security Checklist

### Authentication & Authorization

- ✅ Use Clerk for authentication
- ✅ Implement RBAC (Role-Based Access Control)
- ✅ Validate all user inputs
- ✅ Use secure session management

### Data Protection

- ✅ Encrypt sensitive data at rest
- ✅ Use HTTPS for all communications
- ✅ Implement rate limiting
- ✅ Sanitize user inputs
- ✅ Use parameterized queries

### API Security

- ✅ Validate API keys
- ✅ Implement CORS properly
- ✅ Use authentication tokens
- ✅ Rate limit API endpoints

### Environment Variables

- ❌ Never commit secrets to git
- ✅ Use different keys per environment
- ✅ Rotate keys regularly
- ✅ Use secure secret management

### Security Testing

- Regular vulnerability scanning
- Penetration testing before production
- Security code reviews
- Dependency vulnerability checks

---

[← Previous: Code Standards](./code-standards.md) | [Next: Important Instructions →](./important-instructions.md) | [Back to Main →](../../CLAUDE.md)