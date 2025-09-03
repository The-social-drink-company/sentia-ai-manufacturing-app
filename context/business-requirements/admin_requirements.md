# Admin Portal Business Requirements

## Overview
The Admin Portal provides secure system administration, monitoring, and maintenance capabilities for the Sentia Manufacturing Dashboard. It enforces strict RBAC controls and maintains comprehensive audit trails for all administrative actions.

## Information Architecture

### Navigation Structure (Left Sidebar)
- **Overview** - System Health Dashboard
- **Users & Roles** - User management and role administration
- **Settings** - Application configuration and feature flags
- **Integrations** - External API management (Shopify/Amazon/Xero)
- **API & Webhooks** - API key and webhook management
- **Logs & Errors** - System monitoring and error exploration
- **Maintenance** - Database, cache, and system maintenance

## Role-Based Access Control (RBAC)

### Access Matrix

| Feature | ADMIN | MANAGER | OPERATOR | VIEWER |
|---------|-------|---------|----------|--------|
| **Overview Dashboard** | Full | View-only | No Access | No Access |
| **System Metrics** | Full | View-only | No Access | No Access |
| **User Management** | Full | View-only | No Access | No Access |
| **Role Changes** | Full | No | No Access | No Access |
| **Settings Management** | Full | View-only | No Access | No Access |
| **Feature Flags** | Full | View-only | No Access | No Access |
| **Environment Variables** | Full (masked) | No Access | No Access | No Access |
| **Integrations** | Full | View-only | No Access | No Access |
| **API Keys** | Full | No Access | No Access | No Access |
| **Webhooks** | Full | View-only | No Access | No Access |
| **Logs & Errors** | Full | View-only | No Access | No Access |
| **Maintenance Tools** | Full | No Access | No Access | No Access |
| **Database Operations** | Full | No Access | No Access | No Access |

### Permission Categories

#### ADMIN Permissions
- `admin.overview.view` - View system health dashboard
- `admin.users.view` - View user list and details
- `admin.users.create` - Create new users
- `admin.users.edit` - Edit user profiles and roles
- `admin.users.deactivate` - Deactivate/reactivate users
- `admin.users.reset_password` - Force password reset
- `admin.users.manage_mfa` - Enable/disable MFA
- `admin.settings.view` - View application settings
- `admin.settings.edit` - Edit application settings
- `admin.feature_flags.view` - View feature flags
- `admin.feature_flags.edit` - Toggle feature flags
- `admin.env.view` - View environment variables (masked)
- `admin.env.edit` - Edit environment variables
- `admin.integrations.view` - View integration status
- `admin.integrations.manage` - Manage integrations
- `admin.api.manage` - Manage API keys
- `admin.webhooks.view` - View webhook status
- `admin.webhooks.manage` - Manage webhooks
- `admin.logs.view` - View system logs
- `admin.logs.export` - Export logs
- `admin.errors.view` - View error explorer
- `admin.errors.manage` - Acknowledge errors
- `admin.maintenance.database` - Database operations
- `admin.maintenance.cache` - Cache operations
- `admin.maintenance.system` - System maintenance

#### MANAGER Permissions (Read-only)
- `admin.overview.view`
- `admin.users.view`
- `admin.settings.view`
- `admin.feature_flags.view`
- `admin.integrations.view`
- `admin.webhooks.view`
- `admin.logs.view`
- `admin.errors.view`

## Environment Guardrails

### Development Environment
- Full self-service access for ADMIN users
- No confirmation required for most actions
- Database operations allowed

### Test Environment
- Full self-service access for ADMIN users
- Simple confirmation for destructive actions
- Database operations allowed

### Production Environment
- **Step-up Authentication Required**: Password re-confirmation or WebAuthn for all destructive actions
- **Two-step Confirmation**: Type confirmation text for risky operations
- **Environment Variable Changes**: Proposal-only workflow (creates approval record)
- **Database Operations**: Read-only access with runbook links
- **Maintenance Mode**: Requires two-step approval process

## Functional Requirements

### System Health Dashboard
- **Real-time Metrics**: App uptime, error rate (5m/1h), P95 latency
- **Infrastructure Status**: Queue depth (BullMQ), DB status, Redis status
- **Visual Indicators**: Status timeline sparklines, environment badge
- **Alerting**: Incident banner when error rate > threshold
- **Navigation**: Direct links to relevant admin sections

### User Management
- **User Operations**: Create, edit, deactivate, reactivate users
- **Role Management**: Assign/change user roles with validation
- **Security Actions**: Force password reset, MFA enable/disable
- **Bulk Operations**: CSV import for user creation (ADMIN only)
- **Search & Filter**: By role, status, last login, email domain

### Settings Management
- **Application Settings**: Branding, market/region defaults, timezone/locale
- **Feature Flags**: Toggle features with rollout percentage, change notes
- **Environment Variables**: Masked display, secure editing, encryption at rest
- **Persistence**: System_Settings table with audit trail

### Integrations Administration
- **Status Monitoring**: Integration health, last sync, error counts
- **Operations**: Connect/edit, test connection, run backfill, rotate secrets
- **Webhook Management**: Subscription status, re-subscribe capability
- **Reconciliation**: Variance reports and detail views

### API & Webhook Management
- **API Keys**: Issue, revoke, scope, expiration management
- **Documentation**: OpenAPI spec download
- **Webhook Monitoring**: Volume tracking, verification rates, processing times
- **Dead Letter Queue**: View, drain, and retry failed events

### Logs & Error Exploration
- **Live Log Tail**: Sampled with filters (service, level, job_id, user_id)
- **Error Grouping**: By fingerprint with stack traces, counts, environments
- **Export Capabilities**: CSV/JSON export, cURL generation
- **Correlation**: Link errors to related jobs and workflows

### Maintenance Tools
- **Database**: Backup/restore, migration status, pending migrations
- **Cache Management**: Redis cache clearing with scoped keys
- **Queue Operations**: Pause/resume, retry failed jobs
- **Data Tools**: Re-indexing, metric recomputation
- **System Mode**: Maintenance mode toggle with approvals

## Audit Requirements

### Audit Events
All administrative actions must be logged with:
- **User Identity**: Who performed the action
- **Action Details**: What was done (before/after state)
- **Timestamp**: When the action occurred
- **Reason/Ticket**: Why the action was taken
- **Environment**: Which environment was affected
- **IP Address**: Source of the action
- **Session Info**: Authentication method used

### Critical Audit Events
- `USER_CREATED` - New user account creation
- `ROLE_CHANGED` - User role modifications
- `USER_DISABLED` - Account deactivation
- `FORCE_RESET` - Password reset forced
- `SETTING_CHANGED` - Application setting modification
- `FEATURE_FLAG_TOGGLED` - Feature flag state change
- `ENV_VAR_CHANGED` - Environment variable modification
- `INTEGRATION_ROTATED` - API key/secret rotation
- `MAINTENANCE_MODE` - System maintenance mode changes
- `DATABASE_OPERATION` - Backup, restore, migration actions

### Audit Log Retention
- **Development**: 30 days
- **Test**: 90 days
- **Production**: 7 years (compliance requirement)

## Security Requirements

### Authentication & Authorization
- Multi-factor authentication required for ADMIN role
- Session timeout: 4 hours for ADMIN, 8 hours for MANAGER
- Concurrent session limit: 2 per user
- Failed login lockout: 5 attempts, 15-minute lockout

### Data Protection
- All sensitive data masked in UI (API keys, passwords, tokens)
- Encryption at rest for System_Settings table
- No logging of secrets or PII in application logs
- Secure headers (CSP, HSTS, X-Frame-Options)

### Network Security
- CORS restricted to known admin domains
- Rate limiting on all admin endpoints
- IP allowlisting for production admin access (optional)
- HTTPS enforcement with secure cookie flags

### Input Validation
- All inputs validated with Zod schemas
- SQL injection protection via parameterized queries
- XSS protection via content security policy
- Path traversal protection on file operations

## Performance Requirements

### Response Times
- Dashboard metrics: < 2 seconds
- User operations: < 1 second
- Log searches: < 5 seconds
- Error exploration: < 3 seconds

### Scalability
- Support 50 concurrent admin users
- Handle 10,000 log entries per minute
- Process 1,000 error events per minute
- Maintain 99.9% uptime SLA

### Caching Strategy
- System metrics cached for 30 seconds
- User data cached for 5 minutes
- Feature flags cached for 1 minute
- Settings cached until modification

## Compliance Requirements

### Data Governance
- GDPR compliance for EU user data
- SOX compliance for financial data access
- Audit trail immutability
- Data retention policies per environment

### Change Management
- All production changes require approval
- Change documentation mandatory
- Rollback procedures documented
- Emergency access procedures defined

## Integration Points

### External Systems
- **Clerk**: User authentication and role management
- **Neon PostgreSQL**: Data persistence and backup
- **Redis**: Caching and session management
- **BullMQ**: Job queue monitoring
- **Shopify/Amazon/Xero**: Integration management

### Internal Systems
- **Enhanced Dashboard**: User role synchronization
- **Working Capital**: Configuration management
- **Forecast System**: Feature flag integration
- **Data Import**: Processing monitoring

## Success Metrics

### Operational Metrics
- Admin task completion time
- Error resolution time
- System availability
- Security incident count

### User Metrics
- Admin user satisfaction score
- Feature adoption rate
- Training completion rate
- Support ticket volume

### Business Metrics
- Compliance audit scores
- Security certification maintenance
- Operational cost per admin user
- Mean time to resolution (MTTR)