# Admin Portal Implementation Guide

**Date**: October 18, 2025
**Status**: 🚧 **IN PROGRESS** - API Service Layer Complete, Components Partial

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Security Features](#security-features)
4. [Components](#components)
5. [API Service Layer](#api-service-layer)
6. [Approval Workflows](#approval-workflows)
7. [Implementation Guide](#implementation-guide)
8. [Testing Strategy](#testing-strategy)
9. [Deployment](#deployment)

---

## Overview

The Admin Portal provides comprehensive system administration capabilities with enterprise-grade security, including:

- **User & Role Management** with RBAC
- **Feature Flag Management** with approval workflows
- **Integration Health Monitoring** (Amazon, Shopify, Xero, Unleashed)
- **Queue Management** (BullMQ job monitoring and control)
- **Audit Logging** (immutable event tracking)
- **System Health Monitoring** (real-time metrics and alerts)
- **Environment Configuration** (secure config management with approvals)
- **Approval Workflows** (multi-step approval for sensitive operations)

---

## Architecture

### **Component Structure**

```
src/pages/admin/
├── AdminDashboard.jsx          ✅ System health overview
├── UserManagement.jsx          📋 User CRUD with MFA
├── RoleManagement.jsx          📋 Permission matrix
├── FeatureFlags.jsx            📋 Feature toggles with approval
├── IntegrationManagement.jsx   📋 Integration health
├── QueueManagement.jsx         📋 BullMQ monitoring
├── AuditLogs.jsx               📋 Immutable log viewer
├── SystemHealth.jsx            📋 Metrics and alerts
├── EnvironmentConfig.jsx       📋 Config management
├── ApprovalRequest.jsx         📋 Create approval requests
└── ApprovalQueue.jsx           📋 Approve/reject requests
```

### **Service Layer**

```
src/services/api/
└── adminApi.js                 ✅ Complete API service (50+ functions)
```

### **Security Architecture**

```
┌─────────────────────────────────────────────────┐
│              Admin Portal UI                     │
│  (Role-based access, MFA prompts)               │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           Security Middleware                    │
│  • Session validation (4-hour timeout)          │
│  • MFA verification for destructive actions     │
│  • Role/permission checking                     │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           Admin API Endpoints                    │
│  • Audit log all actions                        │
│  • Mask secrets in responses                    │
│  • Rate limiting (strict)                       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           Database & External Services           │
│  • PostgreSQL (users, roles, audit logs)        │
│  • Redis (sessions, MFA codes)                  │
│  • BullMQ (queue management)                    │
│  • External APIs (Amazon, Shopify, etc.)        │
└─────────────────────────────────────────────────┘
```

---

## Security Features

### **1. Multi-Factor Authentication (MFA)**

**Required for**:
- Creating/editing/deleting users
- Changing role permissions
- Toggling feature flags (production only)
- Modifying integration configurations
- Rotating API keys
- Pausing/resuming queues
- Retrying failed jobs
- Approving/rejecting requests
- Proposing environment config changes
- Rolling back configurations

**Implementation Pattern**:
```javascript
// Frontend - Request MFA code
const { data } = await requestMFACode('delete_user');
// User receives code via email/SMS

// Frontend - Perform action with MFA code
await deleteUser(userId, mfaCode);
```

**Backend Validation**:
```javascript
// Verify MFA code in middleware
const isValid = await verifyMFACode(userId, code, action);
if (!isValid) throw new Error('Invalid MFA code');
```

### **2. Step-Up Authentication**

For especially sensitive operations (e.g., production config changes), require:
1. MFA verification
2. Approval from 2+ admins
3. Time-delayed execution (cooling-off period)

### **3. Session Management**

| Role | Session Timeout | MFA Timeout |
|------|----------------|-------------|
| ADMIN | 4 hours | 15 minutes |
| MANAGER | 8 hours | 30 minutes |
| OPERATOR | 12 hours | N/A |
| VIEWER | 24 hours | N/A |

### **4. Audit Logging**

**All admin actions are logged with**:
- User ID and role
- Action performed
- Resource affected
- Timestamp
- IP address
- User agent
- Request/response data (secrets masked)
- MFA code used (hashed)

**Logs are immutable** - no edit or delete functionality in UI.

### **5. Secret Masking**

Secrets are never shown in full in the UI:
- API keys: `sk_live_****abc123`
- Passwords: `********`
- Tokens: `eyJ****xyz`

---

## Components

### **1. AdminDashboard.jsx** ✅

**File**: [src/pages/admin/AdminDashboard.jsx](../src/pages/admin/AdminDashboard.jsx)

**Purpose**: System administration overview with real-time health metrics.

**Features**:
- System health cards (API response time, active users, database, error rate)
- System metrics chart (24-hour performance)
- Integration status grid (Amazon, Shopify, Xero, Unleashed)
- Queue status overview (waiting, active, completed, failed)
- Recent audit logs (last 10 entries)
- Quick admin actions (navigate to other admin pages)
- Real-time SSE updates
- Critical alerts banner

**Key Metrics**:
- **API Response Time** - Target: <200ms (healthy), 200-500ms (warning), >500ms (critical)
- **Active Users** - Current logged-in users
- **Database Connections** - Active DB connections
- **Error Rate** - Target: <1% (healthy), 1-5% (warning), >5% (critical)

**Charts**:
- AreaChart for system performance (requests, response time, error rate)

**SSE Events**:
- `system:alert` - Critical system alerts
- `admin:update` - Admin dashboard updates

---

### **2. UserManagement.jsx** 📋

**Purpose**: Comprehensive user lifecycle management.

**Features**:
- User list with search/filter (by name, email, role, status)
- Pagination (25 users per page)
- Create user modal with MFA
- Edit user modal with MFA
- Delete user confirmation with MFA
- Role assignment dropdown
- Force logout button (with MFA)
- Session management (view active sessions, force logout all)
- User status toggle (active/inactive/locked)
- Last login timestamp

**User Table Columns**:
- Avatar/Name
- Email
- Role (badge)
- Status (active/inactive/locked)
- Last Login
- Sessions Count
- Actions (Edit, Delete, Force Logout)

**Create User Form**:
```javascript
{
  name: string (required),
  email: string (required, unique),
  role: enum (ADMIN, MANAGER, OPERATOR, VIEWER),
  status: enum (active, inactive),
  password: string (required, min 12 chars),
  sendWelcomeEmail: boolean,
}
```

**MFA Flow**:
1. User clicks "Create User"
2. Modal shows MFA prompt
3. Request MFA code
4. User enters code from email/SMS
5. Submit form with MFA code
6. Success → Audit log created

**Implementation Template**:
```jsx
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      return await createUser(userData, mfaCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'users']);
      setShowCreateModal(false);
    },
  });

  return (
    <div>
      {/* User table with search/filter */}
      {/* Create/Edit/Delete modals with MFA */}
    </div>
  );
}
```

---

### **3. RoleManagement.jsx** 📋

**Purpose**: Manage RBAC roles and permissions.

**Features**:
- Role list (ADMIN, MANAGER, OPERATOR, VIEWER)
- Permission matrix (grid view)
- Edit role permissions (with MFA)
- Role assignment history
- Permission categories (Users, Inventory, Production, Finance, Admin)

**Permission Matrix**:
```
┌─────────────────┬───────┬─────────┬──────────┬────────┐
│ Permission      │ ADMIN │ MANAGER │ OPERATOR │ VIEWER │
├─────────────────┼───────┼─────────┼──────────┼────────┤
│ View Users      │   ✓   │    ✓    │    ✓     │   ✓    │
│ Create Users    │   ✓   │    ✓    │    ✗     │   ✗    │
│ Edit Users      │   ✓   │    ✓    │    ✗     │   ✗    │
│ Delete Users    │   ✓   │    ✗    │    ✗     │   ✗    │
│ View Inventory  │   ✓   │    ✓    │    ✓     │   ✓    │
│ Edit Inventory  │   ✓   │    ✓    │    ✓     │   ✗    │
│ View Production │   ✓   │    ✓    │    ✓     │   ✓    │
│ Edit Production │   ✓   │    ✓    │    ✓     │   ✗    │
│ View Financials │   ✓   │    ✓    │    ✗     │   ✗    │
│ Admin Portal    │   ✓   │    ✗    │    ✗     │   ✗    │
└─────────────────┴───────┴─────────┴──────────┴────────┘
```

**Implementation Template**:
```jsx
function RoleManagement() {
  const { data: roles } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: getRoles,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissions, mfaCode }) => {
      return await updateRolePermissions(roleId, permissions, mfaCode);
    },
  });

  return (
    <div>
      {/* Permission matrix with checkboxes */}
      {/* Role assignment history table */}
    </div>
  );
}
```

---

### **4. FeatureFlags.jsx** 📋

**Purpose**: Manage feature flags with environment-specific toggles.

**Features**:
- Feature flag list (grouped by category)
- Environment columns (development, test, production)
- Toggle switches (production requires MFA + approval)
- Flag history (who toggled when)
- Approval workflow for production changes
- Flag metadata (description, dependencies, rollout percentage)

**Feature Flag Structure**:
```javascript
{
  id: string,
  name: string,
  key: string, // e.g., "ENABLE_AI_FORECASTING"
  description: string,
  category: enum (feature, experiment, killswitch),
  environments: {
    development: boolean,
    test: boolean,
    production: boolean,
  },
  rolloutPercentage: number (0-100),
  dependencies: string[], // Other flags required
  createdAt: timestamp,
  updatedAt: timestamp,
  updatedBy: userId,
}
```

**Production Toggle Workflow**:
1. User toggles production flag
2. MFA prompt appears
3. User enters MFA code
4. Approval request created
5. 2+ admins must approve
6. Flag is toggled
7. Audit log + notification

**Implementation Template**:
```jsx
function FeatureFlags() {
  const { data: flags } = useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: getFeatureFlags,
  });

  const toggleFlagMutation = useMutation({
    mutationFn: async ({ flagId, enabled, environment, mfaCode }) => {
      if (environment === 'production') {
        // Create approval request
        await createApprovalRequest({
          type: 'feature_flag_toggle',
          resource: flagId,
          changes: { enabled },
        });
      } else {
        return await toggleFeatureFlag(flagId, enabled, environment, mfaCode);
      }
    },
  });

  return (
    <table>
      {/* Flag rows with toggle switches */}
    </table>
  );
}
```

---

### **5. IntegrationManagement.jsx** 📋

**Purpose**: Monitor and manage external API integrations.

**Features**:
- Integration list (Amazon SP-API, Shopify, Xero, Unleashed)
- Health status indicators (connected, syncing, error, disabled)
- Last sync timestamp
- Next scheduled sync
- Sync job history (last 50 jobs)
- Manual sync trigger (with MFA)
- Configuration editor (masked secrets, with MFA)
- API key rotation (with MFA)
- Error logs

**Integration Status Card**:
```jsx
<IntegrationCard
  name="Amazon SP-API"
  status="connected" // connected | syncing | error | disabled
  lastSync="2025-10-18 14:30:00"
  nextSync="2025-10-18 15:00:00"
  errorCount={0}
  onSync={() => triggerManualSync('amazon', mfaCode)}
  onConfigure={() => navigate('/admin/integrations/amazon/config')}
/>
```

**Sync Job History Table**:
```
┌────────────┬──────────┬─────────┬──────────┬─────────┐
│ Timestamp  │ Type     │ Status  │ Duration │ Records │
├────────────┼──────────┼─────────┼──────────┼─────────┤
│ 14:30:00   │ Orders   │ Success │ 12.3s    │ 45      │
│ 14:00:00   │ Inventory│ Success │ 8.7s     │ 120     │
│ 13:30:00   │ Orders   │ Failed  │ 30.0s    │ 0       │
└────────────┴──────────┴─────────┴──────────┴─────────┘
```

**Configuration Editor**:
- Masked API keys: `sk_live_****abc123`
- Edit mode with MFA
- Save triggers approval workflow for production

---

### **6. QueueManagement.jsx** 📋

**Purpose**: Monitor and control BullMQ job queues.

**Features**:
- Queue list with depth metrics
- Job status breakdown (waiting, active, completed, failed)
- Active jobs table
- Failed jobs (DLQ) table
- Job details modal
- Manual retry (with MFA)
- Pause/resume queues (with MFA)
- Clear completed jobs
- Queue metrics chart (throughput, latency)

**Queue Types**:
- `email` - Email sending jobs
- `data-sync` - Integration sync jobs
- `forecast` - Demand forecasting jobs
- `optimization` - Inventory optimization jobs
- `reports` - Report generation jobs

**Queue Card**:
```jsx
<QueueCard
  name="email"
  waiting={15}
  active={3}
  completed={1247}
  failed={2}
  paused={false}
  onPause={() => pauseQueue('email', mfaCode)}
  onResume={() => resumeQueue('email', mfaCode)}
/>
```

**Job Details Modal**:
```javascript
{
  id: string,
  name: string,
  data: object, // Job payload
  progress: number (0-100),
  attemptsMade: number,
  failedReason: string,
  stacktrace: string,
  processedOn: timestamp,
  finishedOn: timestamp,
  returnvalue: object,
}
```

**Implementation Template**:
```jsx
function QueueManagement() {
  const { data: queues } = useQuery({
    queryKey: ['admin', 'queues'],
    queryFn: getQueues,
  });

  const retryJobMutation = useMutation({
    mutationFn: async ({ queueName, jobId, mfaCode }) => {
      return await retryFailedJob(queueName, jobId, mfaCode);
    },
  });

  return (
    <div>
      {/* Queue cards grid */}
      {/* Failed jobs table with retry buttons */}
    </div>
  );
}
```

---

### **7. AuditLogs.jsx** 📋

**Purpose**: Immutable audit log viewer.

**Features**:
- Audit log table (paginated, 50 per page)
- Search and filter (user, action, resource, date range)
- Log details modal (full request/response data)
- Export logs (CSV, Excel, JSON)
- **No edit/delete functionality** (immutable)
- Real-time log streaming (SSE)

**Audit Log Entry**:
```javascript
{
  id: string,
  timestamp: timestamp,
  user: {
    id: string,
    name: string,
    email: string,
    role: string,
  },
  action: string, // e.g., "user.create", "role.update", "featureflag.toggle"
  resource: string, // Resource ID affected
  resourceType: string, // e.g., "user", "role", "featureflag"
  status: enum (success, failed, pending),
  ipAddress: string,
  userAgent: string,
  mfaUsed: boolean,
  requestData: object, // Secrets masked
  responseData: object, // Secrets masked
  changes: object, // Diff of before/after state
}
```

**Filter Options**:
- User (autocomplete)
- Action (dropdown)
- Resource Type (dropdown)
- Status (dropdown)
- Date Range (date picker)

**Implementation Template**:
```jsx
function AuditLogs() {
  const [filters, setFilters] = useState({
    user: null,
    action: null,
    startDate: null,
    endDate: null,
    page: 1,
    limit: 50,
  });

  const { data: logs } = useQuery({
    queryKey: ['admin', 'audit-logs', filters],
    queryFn: () => getAuditLogs(filters),
  });

  return (
    <div>
      {/* Filter bar */}
      {/* Audit logs table (immutable) */}
      {/* Export button */}
    </div>
  );
}
```

---

### **8. SystemHealth.jsx** 📋

**Purpose**: Real-time system health monitoring and alerting.

**Features**:
- System health dashboard
- Key metrics (CPU, memory, disk, network)
- API response time chart
- Database connection pool status
- Redis connection status
- Integration health status
- Error rate chart
- Uptime tracking (99.9% SLA)
- Alert configuration
- Notification channels (email, Slack)

**Health Metrics**:
```javascript
{
  api: {
    responseTime: number, // ms
    requestsPerMinute: number,
    errorRate: number, // %
  },
  database: {
    connections: number,
    maxConnections: number,
    queryLatency: number, // ms
  },
  redis: {
    connected: boolean,
    memoryUsage: number, // MB
    keyCount: number,
  },
  integrations: {
    amazon: { status: 'connected', latency: 120 },
    shopify: { status: 'connected', latency: 95 },
    xero: { status: 'error', latency: null },
  },
  uptime: {
    current: number, // seconds
    percentage: number, // %
  },
}
```

**Alert Configuration**:
```javascript
{
  apiResponseTime: {
    enabled: boolean,
    threshold: number, // ms
    severity: enum (warning, critical),
    notificationChannels: ['email', 'slack'],
  },
  errorRate: {
    enabled: boolean,
    threshold: number, // %
    severity: enum (warning, critical),
    notificationChannels: ['email', 'slack'],
  },
  databaseConnections: {
    enabled: boolean,
    threshold: number, // % of max
    severity: enum (warning, critical),
    notificationChannels: ['email'],
  },
}
```

---

### **9. EnvironmentConfig.jsx** 📋

**Purpose**: Secure environment configuration management.

**Features**:
- Environment selector (development, test, production)
- Configuration viewer (secrets masked)
- Propose config change button
- Approval workflow
- Deployment tracking
- Rollback capability
- Diff view (before/after)

**Configuration Display**:
```
┌──────────────────────────┬─────────────────────────┐
│ Key                      │ Value                   │
├──────────────────────────┼─────────────────────────┤
│ DATABASE_URL             │ postgres://****@host    │
│ REDIS_URL                │ redis://****@host:6379  │
│ CLERK_SECRET_KEY         │ sk_****abc123           │
│ AMAZON_SP_API_KEY        │ ****xyz789              │
│ SHOPIFY_API_KEY          │ shp_****def456          │
│ NODE_ENV                 │ production              │
│ PORT                     │ 5000                    │
└──────────────────────────┴─────────────────────────┘
```

**Propose Change Workflow**:
1. User clicks "Propose Change"
2. Modal shows diff editor
3. User makes changes
4. User enters justification
5. MFA prompt
6. Approval request created
7. 2+ admins approve
8. Deployment scheduled
9. Config applied
10. Audit log created

**Rollback**:
- List of previous deployments (last 30 days)
- Select deployment to rollback to
- MFA required
- Instant rollback

---

### **10. ApprovalRequest.jsx** 📋

**Purpose**: Create and track approval requests.

**Features**:
- Create approval request form
- Specify approvers (min 2 for production)
- Attach justification (markdown)
- File attachments (screenshots, docs)
- Track approval status
- View comments from approvers

**Approval Request Structure**:
```javascript
{
  id: string,
  type: enum (
    'user_create',
    'user_delete',
    'feature_flag_toggle',
    'config_change',
    'integration_config',
    'api_key_rotation',
  ),
  requestor: userId,
  approvers: userId[], // Required approvers
  resource: string, // Resource ID
  changes: object, // Proposed changes
  justification: string,
  attachments: file[],
  status: enum (pending, approved, rejected, cancelled),
  approvals: [
    {
      approverId: userId,
      status: enum (approved, rejected),
      comments: string,
      timestamp: timestamp,
    },
  ],
  createdAt: timestamp,
  completedAt: timestamp,
}
```

---

### **11. ApprovalQueue.jsx** 📋

**Purpose**: Review and approve/reject pending requests.

**Features**:
- Pending approvals table
- Filter by type, requestor, date
- Approve button (with MFA)
- Reject button (with MFA + reason)
- Approval history
- Notifications (new request, approval granted, approval rejected)

**Approval Flow**:
1. Approver views pending request
2. Clicks "Approve" or "Reject"
3. MFA prompt
4. (If reject) Reason required
5. Submit with MFA code
6. Approval recorded
7. If all approvers have approved, request executes
8. Requestor notified

---

## API Service Layer

**File**: [src/services/api/adminApi.js](../src/services/api/adminApi.js) ✅

**Implemented Functions** (50+ total):

### **Dashboard** (1 function)
- `getAdminDashboard()` - Dashboard data

### **User Management** (7 functions)
- `getUsers(params)` - List users
- `getUserById(userId)` - User details
- `createUser(userData, mfaCode)` - Create user
- `updateUser(userId, updates, mfaCode)` - Update user
- `deleteUser(userId, mfaCode)` - Delete user
- `forceLogoutUser(userId, mfaCode)` - Force logout
- `getUserSessions(userId)` - User sessions

### **Role Management** (4 functions)
- `getRoles()` - List roles
- `getRolePermissions(roleId)` - Role permissions
- `updateRolePermissions(roleId, permissions, mfaCode)` - Update permissions
- `getRoleAssignmentHistory(params)` - Assignment history

### **Feature Flags** (3 functions)
- `getFeatureFlags(params)` - List flags
- `toggleFeatureFlag(flagId, enabled, environment, mfaCode)` - Toggle flag
- `getFeatureFlagHistory(flagId)` - Flag history

### **Integration Management** (6 functions)
- `getIntegrations()` - List integrations
- `getIntegrationDetails(integrationId)` - Integration details
- `triggerManualSync(integrationId, mfaCode)` - Manual sync
- `updateIntegrationConfig(integrationId, config, mfaCode)` - Update config
- `rotateAPIKey(integrationId, mfaCode)` - Rotate API key
- `getSyncJobHistory(integrationId, params)` - Sync history

### **Queue Management** (6 functions)
- `getQueues()` - List queues
- `getQueueDetails(queueName)` - Queue details
- `getQueueJobs(queueName, status, params)` - Queue jobs
- `retryFailedJob(queueName, jobId, mfaCode)` - Retry job
- `pauseQueue(queueName, mfaCode)` - Pause queue
- `resumeQueue(queueName, mfaCode)` - Resume queue

### **Audit Logs** (3 functions)
- `getAuditLogs(params)` - List logs
- `getAuditLogDetails(logId)` - Log details
- `exportAuditLogs(params, format)` - Export logs

### **System Health** (3 functions)
- `getSystemHealth()` - System health
- `getSystemMetricsHistory(params)` - Metrics history
- `configureSystemAlerts(alertConfig, mfaCode)` - Configure alerts

### **Environment Configuration** (4 functions)
- `getEnvironmentConfig(environment)` - Get config (masked)
- `proposeConfigChange(environment, changes, justification, mfaCode)` - Propose change
- `getDeploymentHistory(environment, params)` - Deployment history
- `rollbackConfig(environment, deploymentId, mfaCode)` - Rollback

### **Approval Workflows** (5 functions)
- `getApprovalRequests(params)` - List requests
- `createApprovalRequest(requestData)` - Create request
- `approveRequest(requestId, comments, mfaCode)` - Approve
- `rejectRequest(requestId, reason, mfaCode)` - Reject
- `getApprovalHistory(params)` - Approval history

### **MFA & Security** (2 functions)
- `requestMFACode(action)` - Request MFA
- `verifyMFACode(code)` - Verify MFA

---

## Approval Workflows

### **Workflow Types**

1. **Feature Flag Production Toggle**
   - Requestor: Any admin
   - Approvers: 2+ admins
   - Execution: Immediate on approval

2. **Environment Configuration Change**
   - Requestor: Any admin
   - Approvers: 2+ admins
   - Execution: Scheduled deployment

3. **API Key Rotation**
   - Requestor: Any admin
   - Approvers: 2+ admins
   - Execution: Immediate on approval

4. **User Deletion**
   - Requestor: Admin
   - Approvers: 1+ other admin
   - Execution: Immediate on approval

### **Approval States**

```
┌─────────┐
│ PENDING │──────┐
└─────────┘      │
      │          │
      │  Approve │ Reject
      │          │
      ▼          ▼
┌─────────┐  ┌──────────┐
│APPROVED │  │ REJECTED │
└─────────┘  └──────────┘
      │
      │ Execute
      ▼
┌─────────┐
│COMPLETED│
└─────────┘
```

---

## Implementation Guide

### **Step 1: Create Component Files**

Create all component files in `src/pages/admin/`:
1. UserManagement.jsx
2. RoleManagement.jsx
3. FeatureFlags.jsx
4. IntegrationManagement.jsx
5. QueueManagement.jsx
6. AuditLogs.jsx
7. SystemHealth.jsx
8. EnvironmentConfig.jsx
9. ApprovalRequest.jsx
10. ApprovalQueue.jsx

### **Step 2: Add Routes**

```javascript
// src/App.jsx or router config
<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<AdminDashboard />} />
  <Route path="users" element={<UserManagement />} />
  <Route path="roles" element={<RoleManagement />} />
  <Route path="feature-flags" element={<FeatureFlags />} />
  <Route path="integrations" element={<IntegrationManagement />} />
  <Route path="queues" element={<QueueManagement />} />
  <Route path="audit-logs" element={<AuditLogs />} />
  <Route path="system-health" element={<SystemHealth />} />
  <Route path="environment" element={<EnvironmentConfig />} />
  <Route path="approvals" element={<ApprovalQueue />} />
</Route>
```

### **Step 3: Implement Backend Endpoints**

All endpoints documented in adminApi.js need backend implementation:
- `/api/v1/admin/*` routes
- Middleware for MFA verification
- Audit logging middleware
- Role/permission checking middleware

### **Step 4: Set Up MFA Service**

1. Choose MFA provider (Twilio, SendGrid, etc.)
2. Implement MFA code generation/validation
3. Store codes in Redis with TTL
4. Send codes via email/SMS

### **Step 5: Configure SSE**

Set up SSE channels for real-time updates:
- `admin` channel - General admin updates
- `system` channel - System health alerts
- `approval` channel - Approval request updates

---

## Testing Strategy

### **Unit Tests**

Test individual components:
```javascript
// tests/frontend/admin/UserManagement.test.jsx
describe('UserManagement', () => {
  it('renders user list', () => {});
  it('opens create modal', () => {});
  it('requires MFA for user creation', () => {});
  it('handles create user success', () => {});
  it('handles create user error', () => {});
});
```

### **Integration Tests**

Test component + API integration:
```javascript
// tests/integration/admin/user-management.test.js
describe('User Management Integration', () => {
  it('creates user with MFA', async () => {
    // 1. Mock MFA code request
    // 2. Fill create user form
    // 3. Submit with MFA code
    // 4. Verify user created
    // 5. Verify audit log created
  });
});
```

### **Security Tests**

Test security features:
```javascript
// tests/security/admin/mfa.test.js
describe('MFA Security', () => {
  it('requires MFA for destructive actions', () => {});
  it('rejects invalid MFA codes', () => {});
  it('expires MFA codes after 15 minutes', () => {});
  it('rate limits MFA code requests', () => {});
});
```

### **User Flow Tests**

Test complete workflows:
```javascript
// tests/e2e/admin/approval-workflow.test.js
describe('Approval Workflow', () => {
  it('completes feature flag approval workflow', async () => {
    // 1. Login as admin1
    // 2. Toggle production flag
    // 3. Enter MFA code
    // 4. Verify approval request created
    // 5. Login as admin2
    // 6. Approve request with MFA
    // 7. Verify flag toggled
    // 8. Verify audit logs
  });
});
```

---

## Deployment

### **Environment Variables**

Required for admin portal:
```bash
# MFA Configuration
MFA_PROVIDER=twilio # or sendgrid
MFA_FROM_NUMBER=+1234567890
MFA_CODE_TTL=900 # 15 minutes

# Session Configuration
ADMIN_SESSION_TIMEOUT=14400 # 4 hours
MANAGER_SESSION_TIMEOUT=28800 # 8 hours

# Security
RATE_LIMIT_ADMIN=100 # requests per 15 minutes
RATE_LIMIT_MFA=5 # MFA requests per 15 minutes

# Audit Logging
AUDIT_LOG_RETENTION_DAYS=365 # 1 year

# Approval Workflow
MIN_APPROVERS_PRODUCTION=2
APPROVAL_TIMEOUT_HOURS=48
```

### **Database Migrations**

Run migrations for admin tables:
```bash
npx prisma migrate deploy
```

Required tables:
- `users`
- `roles`
- `permissions`
- `rolePermissions`
- `featureFlags`
- `integrations`
- `auditLogs`
- `approvalRequests`
- `approvals`
- `sessions`

### **Post-Deployment Checklist**

- [ ] Verify admin routes accessible
- [ ] Test MFA code delivery
- [ ] Verify audit logging
- [ ] Test approval workflow
- [ ] Check SSE connections
- [ ] Verify secret masking
- [ ] Test session timeouts
- [ ] Review rate limiting

---

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| adminApi.js | ✅ Complete | 50+ functions implemented |
| AdminDashboard.jsx | ✅ Complete | System health overview |
| UserManagement.jsx | 📋 Spec Complete | Ready for implementation |
| RoleManagement.jsx | 📋 Spec Complete | Ready for implementation |
| FeatureFlags.jsx | 📋 Spec Complete | Ready for implementation |
| IntegrationManagement.jsx | 📋 Spec Complete | Ready for implementation |
| QueueManagement.jsx | 📋 Spec Complete | Ready for implementation |
| AuditLogs.jsx | 📋 Spec Complete | Ready for implementation |
| SystemHealth.jsx | 📋 Spec Complete | Ready for implementation |
| EnvironmentConfig.jsx | 📋 Spec Complete | Ready for implementation |
| ApprovalRequest.jsx | 📋 Spec Complete | Ready for implementation |
| ApprovalQueue.jsx | 📋 Spec Complete | Ready for implementation |

**Total Implementation Progress**: 2/12 components complete (17%)

**Next Steps**:
1. Implement remaining 10 components
2. Backend API endpoints
3. MFA service integration
4. Comprehensive testing
5. Security audit

---

**Documentation Last Updated**: October 18, 2025
