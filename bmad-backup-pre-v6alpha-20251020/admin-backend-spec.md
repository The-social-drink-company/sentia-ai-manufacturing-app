# Admin Backend Entry Points (BMAD)

## Prisma Model Sketches
- `admin_user_roles` (id, name, permissions[], createdAt)
- `admin_permissions` (id, key, description)
- `admin_role_assignments` (id, userId, roleId, assignedBy, createdAt)
- `admin_feature_flags` (id, key, name, defaultEnabled, impact, createdAt)
- `admin_feature_flag_history` (id, flagId, environment, enabled, actorId, metadata JSON, createdAt)
- `admin_integrations` (id, name, vendor, status, endpoint, maskedKey, createdAt)
- `admin_sync_jobs` (id, integrationId, status, durationMs, recordsProcessed, metadata JSON, createdAt)
- `admin_queues` (id, name, description, status, lastFailedReason, createdAt)
- `admin_queue_events` (id, queueId, eventType, payload JSON, createdAt)
- `admin_audit_logs` (id, timestamp, actorId, action, resource, environment, metadata JSON, hashSignature, prevHash)
- `admin_system_health` (id, cpuUsage, memoryUsage, apiLatencyMs, apiErrorRate, alerts JSON, createdAt)
- `admin_alert_thresholds` (id, environment, cpuThreshold, memoryThreshold, channel, updatedAt)
- `admin_environment_configs` (id, environment, runtime JSON, secrets JSON (masked), updatedAt)
- `admin_deployments` (id, environment, summary, actorId, status, metadata JSON, createdAt)
- `admin_approvals` (id, type, target, summary, details JSON, status, requesterId, reviewers JSON, createdAt, updatedAt)
- `admin_approval_history` (id, approvalId, actorId, action, comments, createdAt)
- `admin_mfa_challenges` (id, userId, codeHash, expiresAt, consumedAt, metadata JSON)

## Services & Middleware
- `AdminAuthMiddleware` – verifies clerk session -> admin role, attaches context.
- `MfaMiddleware` – enforces MFA for destructive routes, uses `admin_mfa_challenges`.
- `AuditLogger` – helper to write signed audit entries (hash chain across `admin_audit_logs`).
- `ApprovalService` – state machine for approvals (pending/approved/rejected), interacts with BullMQ `approvalQueue` for notifications.
- `FeatureFlagService` – wraps Redis/DB store, enforces approvals for production toggles.
- `IntegrationService` – proxies integration health, manual sync, rotates secrets.
- `QueueAdminService` – interacts with BullMQ to fetch stats, retry, clean.
- `SystemHealthService` – collects metrics (Prometheus, Postgres) and manages alerts.
- `EnvironmentConfigService` – handles proposals, deployment ledger, rollbacks.
- `AdminRouter` – Express router binding controllers: `/admin/dashboard`, `/admin/users`, `/admin/roles`, `/admin/feature-flags`, `/admin/integrations`, `/admin/queues`, `/admin/audit`, `/admin/system-health`, `/admin/environment`, `/admin/approvals`.

## BullMQ Workers
- `approval-notification-worker` – sends Slack/email when approvals created/resolved.
- `manual-sync-worker` – executes integration sync jobs triggered from UI.
- `config-rollout-worker` – applies environment config changes post approval.
- `audit-ingest-worker` – optional asynchronous batching of audit events.

## Testing Strategy
- Unit tests for each service (Vitest, mocking Prisma and external SDKs).
- Integration tests hitting `/admin` routes with supertest (happy-path + auth/MFA failure cases).
- BullMQ worker tests verifying job payloads + error recovery.
