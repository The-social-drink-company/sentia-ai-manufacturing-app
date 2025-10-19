# Admin Portal Backend Implementation Plan (BMAD)

## Context
Frontend workflows for the Admin Portal are complete (users, roles, feature flags, integrations, queues, audit logs, system health, environment config, approvals). The API client (`src/services/api/adminApi.js`) exposes 44 functions, yet the server currently lacks `/admin/*` routes. This document captures the backend work required to support production operations.

## Required Endpoint Matrix
| Area | Client Functions | Backend Tasks |
| --- | --- | --- |
| Dashboard | `getAdminDashboard` | Build `/admin/dashboard` aggregate service composing existing metrics. |
| User Mgmt | `getUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser`, `forceLogoutUser`, `getUserSessions` | Hook into Clerk/Prisma to manage accounts, enforce MFA on mutations, audit every change. |
| Role Mgmt | `getRoles`, `getRolePermissions`, `updateRolePermissions`, `getRoleAssignmentHistory` | Persist role hierarchy, permission matrix, and assignment ledger. |
| Feature Flags | `getFeatureFlags`, `toggleFeatureFlag`, `getFeatureFlagHistory` | Connect to flag store (Redis/DB), require approvals + MFA for production toggles, append to history. |
| Integrations | `getIntegrations`, `getIntegrationDetails`, `triggerManualSync`, `updateIntegrationConfig`, `rotateAPIKey`, `getSyncJobHistory` | Surface BullMQ/manual sync APIs, rotate secrets securely, mask returns. |
| Queues | `getQueues`, `getQueueDetails`, `getQueueJobs`, `retryFailedJob`, `pauseQueue`, `resumeQueue` | Wrap BullMQ admin controls with MFA + audit logging. |
| Audit Logs | `getAuditLogs`, `getAuditLogDetails`, `exportAuditLogs` | Implement append-only audit table and export endpoint. |
| System Health | `getSystemHealth`, `getSystemMetricsHistory`, `configureSystemAlerts` | Wire telemetry collector + alert threshold storage, integrate notifications. |
| Environment Config | `getEnvironmentConfig`, `proposeConfigChange`, `getDeploymentHistory`, `rollbackConfig` | Create secure config store, proposal workflow, deployment ledger, rollback execution. |
| Approvals | `getApprovalRequests`, `createApprovalRequest`, `approveRequest`, `rejectRequest`, `getApprovalHistory`, `requestMFACode`, `verifyMFACode` | Build approval engine (state machine + queue), MFA service, notifier webhooks. |

## Data Model Requirements
- `admin_users`, `admin_roles`, `admin_role_assignments`
- `admin_feature_flags`, `admin_flag_history`
- `admin_integrations`, `admin_sync_jobs`
- `admin_queues`, `admin_queue_events`
- `admin_audit_logs`
- `admin_system_health`, `admin_alert_thresholds`
- `admin_environment_configs`, `admin_deployments`
- `admin_approvals`, `admin_approval_history`

## Service Architecture
1. **Router Layer** – Express `/admin` routes with auth + MFA middleware.
2. **Domain Services** – Feature modules encapsulating business logic (roles, flags, queues, etc.).
3. **Persistence Layer** – Prisma models, migrations, repositories.
4. **Async Jobs** – BullMQ queues for manual syncs, approval notifications, config rollouts.
5. **Audit/Telemetry** – Central logger writing to `admin_audit_logs`, exposing metrics.

## Security Controls
- MFA enforcement on destructive endpoints – leverage `requestMFACode`/`verifyMFACode`.
- Immutable audit logging (hash chain / signature).
- RBAC middleware verifying admin role from Clerk/DB.
- Response masking for secrets and sensitive metadata.

## Implementation Phasing (BMAD)
1. **Foundation**
   - Scaffold `/admin` router and middleware.
   - Add Prisma migrations for admin tables.
   - Implement audit logging + MFA verification services.
2. **Core Flows**
   - User / role management endpoints.
   - Approval engine + queue processing.
3. **Operational Modules**
   - Feature flags, integrations, queues, system health.
4. **Environment Management**
   - Config proposals, deployment history, rollback automation.
5. **Hardening**
   - Notification integrations, observability dashboards, Vitest + integration test coverage.

## Immediate Next Actions
- [ ] Scaffold Express `/admin` router (controllers + middleware).
- [ ] Introduce Prisma models/migrations for approvals, audit logs, feature flags, integrations, queues.
- [ ] Implement approval service (state machine) + BullMQ worker.
- [ ] Build MFA verification microservice or reuse Clerk factors with server-side enforcement.
- [ ] Stand up backend Vitest suite targeting new services.
