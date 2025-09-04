# Authentication & Authorization Enhancements

This document describes the comprehensive authentication and authorization enhancements implemented for the Sentia Manufacturing Dashboard.

## Overview

The authentication system has been enhanced with enterprise-grade security features while maintaining backward compatibility with existing Clerk.dev integration.

## Key Features Implemented

### 1. Token & Session Hardening
- **Rotating Refresh Tokens**: Automatic token rotation with replay detection
- **Secure Session Management**: Device-aware sessions with suspicious activity detection
- **Session Lifecycle**: Configurable session timeouts and automatic cleanup
- **Token Security**: bcrypt-hashed tokens with high entropy salt rounds (14+)

### 2. Account Security & Lockouts
- **Exponential Backoff Lockouts**: Progressive lockout periods for failed login attempts
- **IP-based Rate Limiting**: Multiple tiers of rate limiting for different endpoints
- **Suspicious Activity Detection**: Device and location-based anomaly detection
- **Account Recovery**: Secure password reset with time-limited tokens

### 3. Enhanced RBAC (Role-Based Access Control)
- **Granular Permissions**: 20+ specific permissions across dashboard features
- **Role Hierarchy**: Admin → Manager → Operator → Viewer with inheritance
- **Feature Flags**: Role-based feature access control
- **Route Protection**: Enhanced middleware for API and UI protection

### 4. Password Security Policies
- **Complex Validation**: 12+ character minimum with complexity scoring
- **History Prevention**: Prevents reuse of last 5 passwords
- **Contextual Checking**: Prevents use of email/name components
- **Age Policies**: Configurable password expiration (default: 90 days)
- **Pattern Detection**: Identifies and prevents sequential/repetitive patterns

### 5. Comprehensive Audit Logging
- **Security Events**: Login attempts, permission changes, admin actions
- **Session Tracking**: Session creation, usage, and termination
- **Structured Logging**: JSON-formatted logs with consistent schema
- **Retention Policies**: Configurable audit log retention periods

### 6. Multi-Entity & Global Readiness
- **Entity-Aware Permissions**: Users can be restricted to specific business entities
- **Multi-Region Support**: Regional data access controls and compliance
- **Currency & Localization**: Per-user preferences for currency and locale
- **Hierarchical Entities**: Support for subsidiary and division structures

### 7. SSO & JIT Provisioning
- **Multiple Providers**: Support for Okta, Azure AD, and Google Workspace
- **Just-In-Time Provisioning**: Automatic user creation from SSO attributes
- **Domain Whitelisting**: Control which email domains can auto-provision
- **Attribute Mapping**: Flexible mapping of SSO attributes to user properties

### 8. Frontend Auth UX
- **Enhanced Route Protection**: Granular permission and role checking
- **Security Status Components**: Real-time security alerts and status
- **Session Management UI**: User-facing session management and security controls
- **Password Policy Validation**: Client-side password strength checking

## API Endpoints Added

### Authentication Core
- `GET /api/auth/security/status` - User security status
- `GET /api/auth/sessions` - Active user sessions
- `DELETE /api/auth/sessions/:id` - Revoke specific session
- `DELETE /api/auth/sessions` - Revoke all sessions

### Password Management
- `GET /api/auth/password-policy` - Password policy requirements
- `POST /api/auth/password/validate` - Validate password strength
- `POST /api/auth/password/reset-request` - Request password reset
- `POST /api/auth/password/reset-verify` - Complete password reset
- `GET /api/auth/password/status` - Password age status

### Multi-Entity Management  
- `GET /api/auth/entity-context` - User's entity context
- `PUT /api/auth/entity-context` - Update user's entity preferences
- `GET /api/auth/accessible-entities` - Entities user can access
- `GET /api/auth/regions` - Available regions and metadata

### SSO & JIT Provisioning
- `GET /api/auth/sso/providers` - Available SSO providers
- `GET /api/auth/sso/config` - SSO and JIT configuration
- `POST /api/auth/sso/:provider/callback` - SSO authentication callback

### Admin Management
- `GET /api/admin/audit-logs` - System audit logs
- `GET /api/admin/entities` - Entity management
- `POST /api/admin/entities` - Create new entity
- `PUT /api/admin/entities/:id` - Update entity
- `GET /api/admin/sso/providers` - SSO provider management
- `POST /api/admin/sso/providers` - Configure SSO provider
- `PUT /api/admin/sso/jit-config` - Update JIT configuration
- `GET /api/admin/sso/statistics` - SSO usage statistics

## Database Schema Enhancements

### Enhanced User Model
```sql
-- Auth Security Extensions  
locked_until                DateTime?
failed_login_count         Int? DEFAULT 0
last_failed_login          DateTime?
password_changed_at        DateTime?

-- Global Readiness Extensions
default_entity_id          String? -- UUID
allowed_entity_ids         Json?   -- Array of entity UUIDs
allowed_regions           Json?   -- Array: ["UK","EU","USA"]
preferred_currency_code   String? -- ISO-4217 currency code
preferred_locale          String? -- Locale preference
preferred_timezone        String? -- IANA timezone

-- SSO Extensions
sso_provider              String? -- okta, azuread, google
last_sso_login           DateTime?
created_via_jit          Boolean? DEFAULT false
approved                 Boolean DEFAULT false
```

### New Tables Added
- `user_sessions` - Session management and tracking
- `audit_logs` - Comprehensive security and system audit trail
- `password_reset_tokens` - Secure password reset token management
- `password_history` - Password reuse prevention
- `entities` - Business entity management for multi-tenant support
- `sso_providers` - SSO provider configurations
- `feature_flags` - Feature flag management
- `system_settings` - Configuration storage

## Configuration

### Environment Variables
Copy `.env.auth.template` to your environment files and configure:

**Core Authentication** (Required):
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `DATABASE_URL` - PostgreSQL connection string

**Security Settings**:
- `PASSWORD_MIN_LENGTH=12` - Minimum password length
- `SESSION_TIMEOUT_MINUTES=30` - Session timeout
- `LOCKOUT_MAX_ATTEMPTS=5` - Failed login attempts before lockout

**Multi-Entity** (Optional):
- `MULTI_ENTITY_ENABLED=false` - Enable multi-entity features
- `MULTI_REGION_ENABLED=false` - Enable multi-region features

**SSO Configuration** (Optional):
- `OKTA_ENABLED=false` - Enable Okta SSO
- `JIT_PROVISIONING_ENABLED=false` - Enable JIT provisioning

### Feature Flags
Features can be enabled/disabled via environment variables:
- Multi-entity support
- Multi-region data segregation
- SSO providers
- JIT provisioning
- Cross-entity access

## Security Considerations

### Authentication Flow
1. **Initial Login**: User authenticates via Clerk
2. **Session Creation**: System creates tracked session with device fingerprinting
3. **Token Management**: Access tokens rotated, refresh tokens with replay detection
4. **Permission Checking**: Role and permission-based access control
5. **Activity Monitoring**: All actions logged for audit trail

### Security Headers
- CSP (Content Security Policy) with nonces
- HSTS (HTTP Strict Transport Security)
- Frame options and referrer policy
- X-Content-Type-Options nosniff

### Rate Limiting Tiers
- **General API**: 1000 requests / 15 minutes
- **Auth Endpoints**: 20 requests / 5 minutes  
- **Failed Logins**: 5 attempts / 15 minutes
- **File Uploads**: 50 uploads / hour

## Frontend Integration

### Enhanced Components
- **ProtectedRoute**: Role/permission-based route protection
- **SecurityAlert**: Real-time security notifications
- **SecurityStatus**: Session and account security overview
- **PasswordPolicyChecker**: Real-time password validation
- **AuthContext**: Centralized authentication state management

### Usage Examples

```jsx
// Route protection with roles
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>

// Permission-based rendering
<ProtectedRoute requiredPermission="dashboard.edit">
  <EditButton />
</ProtectedRoute>

// Feature flag checking
<ProtectedRoute requiredFeature="advancedAnalytics">
  <AnalyticsPanel />
</ProtectedRoute>

// Security status display
<SecurityStatus />
<SecurityAlert />
```

## Migration & Deployment

### Database Migration
1. **Schema Updates**: All new fields are nullable for backward compatibility
2. **Data Migration**: Existing users automatically get default security settings
3. **Feature Rollout**: Features can be enabled incrementally via environment variables

### Deployment Checklist
- [ ] Update environment variables from `.env.auth.template`
- [ ] Run database migrations for new tables
- [ ] Configure SSO providers (if using)
- [ ] Set up audit log retention policies
- [ ] Configure rate limiting thresholds
- [ ] Test authentication flows end-to-end
- [ ] Monitor security metrics and alerts

### Production Considerations
- **Database Performance**: Audit logs table will grow - implement archival strategy
- **Session Storage**: Consider Redis for high-traffic deployments
- **Monitoring**: Set up alerts for failed login spikes and account lockouts
- **Backup**: Ensure auth-related tables are included in backup strategy

## Testing

### Security Testing
- Password policy enforcement
- Account lockout mechanisms
- Session management and timeout
- Permission boundary testing
- Rate limiting verification

### Integration Testing
- SSO provider integration
- JIT provisioning workflows
- Multi-entity access controls
- Audit log generation
- Frontend component behavior

## Monitoring & Observability

### Key Metrics
- Failed login attempts per minute
- Account lockout events
- Session creation/termination rates
- SSO authentication success rates
- Audit log volume and patterns

### Alerts
- Spike in failed login attempts
- Account lockout threshold exceeded
- Suspicious activity patterns detected
- SSO provider failures
- Audit log system errors

## Support & Troubleshooting

### Common Issues
1. **Account Locked**: Check `locked_until` timestamp, review failed login logs
2. **Permission Denied**: Verify user role and required permissions
3. **SSO Failures**: Check provider configuration and network connectivity
4. **Session Issues**: Review session timeout settings and device tracking

### Debug Mode
Enable debug logging with `DEBUG_AUTH=true` for detailed authentication flow tracing.

## Compliance & Standards

### Security Standards
- OWASP Authentication Guidelines compliance
- NIST Cybersecurity Framework alignment
- SOC 2 Type II audit trail requirements
- GDPR data protection considerations

### Audit Requirements
- User access logging
- Administrative action tracking
- Session lifecycle auditing
- Security event correlation
- Data retention policies

## Future Enhancements

### Planned Features
- Multi-factor authentication (MFA)
- Adaptive authentication based on risk scoring
- Advanced threat detection and response
- Integration with SIEM systems
- Automated compliance reporting

### API Versioning
Current implementation is v1. Future versions will maintain backward compatibility while adding new capabilities.

---

For technical support or feature requests, please refer to the project's issue tracker or contact the development team.