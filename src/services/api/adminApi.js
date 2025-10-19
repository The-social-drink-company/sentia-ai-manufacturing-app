/**
 * Admin API Service
 *
 * Frontend service layer for admin portal endpoints:
 * - User management
 * - Role management
 * - Feature flags
 * - Integration management
 * - Queue management
 * - Audit logs
 * - System health
 * - Environment configuration
 * - Approval workflows
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/**
 * ============================================================================
 * DASHBOARD
 * ============================================================================
 */

/**
 * Get admin dashboard data
 *
 * @returns {Promise<Object>} Dashboard data
 */
export async function getAdminDashboard() {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch admin dashboard')
  return response.json()
}

/**
 * ============================================================================
 * USER MANAGEMENT
 * ============================================================================
 */

/**
 * Get all users
 *
 * @param {Object} params - Query parameters (search, role, status, page, limit)
 * @returns {Promise<Object>} Users list
 */
export async function getUsers(params = {}) {
  const queryParams = new URLSearchParams(params)
  const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams}`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch users')
  return response.json()
}

/**
 * Get user by ID
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User details
 */
export async function getUserById(userId) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch user')
  return response.json()
}

/**
 * Create new user
 *
 * @param {Object} userData - User data
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Created user
 */
export async function createUser(userData, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
    body: JSON.stringify(userData),
  })

  if (!response.ok) throw new Error('Failed to create user')
  return response.json()
}

/**
 * Update user
 *
 * @param {string} userId - User ID
 * @param {Object} updates - User updates
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Updated user
 */
export async function updateUser(userId, updates, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  })

  if (!response.ok) throw new Error('Failed to update user')
  return response.json()
}

/**
 * Delete user
 *
 * @param {string} userId - User ID
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteUser(userId, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to delete user')
  return response.json()
}

/**
 * Force logout user
 *
 * @param {string} userId - User ID
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Logout result
 */
export async function forceLogoutUser(userId, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/logout`, {
    method: 'POST',
    headers: {
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to force logout')
  return response.json()
}

/**
 * Get user sessions
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object[]>} User sessions
 */
export async function getUserSessions(userId) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/sessions`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch user sessions')
  return response.json()
}

/**
 * ============================================================================
 * ROLE MANAGEMENT
 * ============================================================================
 */

/**
 * Get all roles
 *
 * @returns {Promise<Object[]>} Roles list
 */
export async function getRoles() {
  const response = await fetch(`${API_BASE_URL}/admin/roles`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch roles')
  return response.json()
}

/**
 * Get role permissions
 *
 * @param {string} roleId - Role ID
 * @returns {Promise<Object>} Role permissions
 */
export async function getRolePermissions(roleId) {
  const response = await fetch(`${API_BASE_URL}/admin/roles/${roleId}/permissions`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch role permissions')
  return response.json()
}

/**
 * Update role permissions
 *
 * @param {string} roleId - Role ID
 * @param {Object} permissions - Updated permissions
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Updated role
 */
export async function updateRolePermissions(roleId, permissions, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/roles/${roleId}/permissions`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
    body: JSON.stringify(permissions),
  })

  if (!response.ok) throw new Error('Failed to update role permissions')
  return response.json()
}

/**
 * Get role assignment history
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object[]>} Role assignment history
 */
export async function getRoleAssignmentHistory(params = {}) {
  const queryParams = new URLSearchParams(params)
  const response = await fetch(`${API_BASE_URL}/admin/roles/history?${queryParams}`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch role assignment history')
  return response.json()
}

/**
 * ============================================================================
 * FEATURE FLAGS
 * ============================================================================
 */

/**
 * Get all feature flags
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object[]>} Feature flags
 */
export async function getFeatureFlags(params = {}) {
  const queryParams = new URLSearchParams(params)
  const response = await fetch(`${API_BASE_URL}/admin/feature-flags?${queryParams}`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch feature flags')
  return response.json()
}

/**
 * Toggle feature flag
 *
 * @param {string} flagId - Flag ID
 * @param {boolean} enabled - New enabled state
 * @param {string} environment - Environment (development, test, production)
 * @param {string} mfaCode - MFA code for production changes
 * @returns {Promise<Object>} Updated flag
 */
export async function toggleFeatureFlag(flagId, enabled, environment, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/feature-flags/${flagId}/toggle`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(environment === 'production' && { 'X-MFA-Code': mfaCode }),
    },
    credentials: 'include',
    body: JSON.stringify({ enabled, environment }),
  })

  if (!response.ok) throw new Error('Failed to toggle feature flag')
  return response.json()
}

/**
 * Get feature flag history
 *
 * @param {string} flagId - Flag ID
 * @returns {Promise<Object[]>} Flag history
 */
export async function getFeatureFlagHistory(flagId) {
  const response = await fetch(`${API_BASE_URL}/admin/feature-flags/${flagId}/history`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch feature flag history')
  return response.json()
}

/**
 * ============================================================================
 * INTEGRATION MANAGEMENT
 * ============================================================================
 */

/**
 * Get all integrations
 *
 * @returns {Promise<Object[]>} Integrations list
 */
export async function getIntegrations() {
  const response = await fetch(`${API_BASE_URL}/admin/integrations`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch integrations')
  return response.json()
}

/**
 * Get integration details
 *
 * @param {string} integrationId - Integration ID
 * @returns {Promise<Object>} Integration details
 */
export async function getIntegrationDetails(integrationId) {
  const response = await fetch(`${API_BASE_URL}/admin/integrations/${integrationId}`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch integration details')
  return response.json()
}

/**
 * Trigger manual sync
 *
 * @param {string} integrationId - Integration ID
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Sync job
 */
export async function triggerManualSync(integrationId, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/integrations/${integrationId}/sync`, {
    method: 'POST',
    headers: {
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to trigger sync')
  return response.json()
}

/**
 * Update integration configuration
 *
 * @param {string} integrationId - Integration ID
 * @param {Object} config - Configuration updates
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Updated integration
 */
export async function updateIntegrationConfig(integrationId, config, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/integrations/${integrationId}/config`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
    body: JSON.stringify(config),
  })

  if (!response.ok) throw new Error('Failed to update integration config')
  return response.json()
}

/**
 * Rotate API key
 *
 * @param {string} integrationId - Integration ID
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} New API key (masked)
 */
export async function rotateAPIKey(integrationId, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/integrations/${integrationId}/rotate-key`, {
    method: 'POST',
    headers: {
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to rotate API key')
  return response.json()
}

/**
 * Get sync job history
 *
 * @param {string} integrationId - Integration ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object[]>} Sync job history
 */
export async function getSyncJobHistory(integrationId, params = {}) {
  const queryParams = new URLSearchParams(params)
  const response = await fetch(
    `${API_BASE_URL}/admin/integrations/${integrationId}/sync-history?${queryParams}`,
    {
      credentials: 'include',
    }
  )

  if (!response.ok) throw new Error('Failed to fetch sync job history')
  return response.json()
}

/**
 * ============================================================================
 * QUEUE MANAGEMENT
 * ============================================================================
 */

/**
 * Get all queues
 *
 * @returns {Promise<Object[]>} Queues list
 */
export async function getQueues() {
  const response = await fetch(`${API_BASE_URL}/admin/queues`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch queues')
  return response.json()
}

/**
 * Get queue details
 *
 * @param {string} queueName - Queue name
 * @returns {Promise<Object>} Queue details
 */
export async function getQueueDetails(queueName) {
  const response = await fetch(`${API_BASE_URL}/admin/queues/${queueName}`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch queue details')
  return response.json()
}

/**
 * Get queue jobs
 *
 * @param {string} queueName - Queue name
 * @param {string} status - Job status (waiting, active, completed, failed)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object[]>} Queue jobs
 */
export async function getQueueJobs(queueName, status, params = {}) {
  const queryParams = new URLSearchParams({ status, ...params })
  const response = await fetch(`${API_BASE_URL}/admin/queues/${queueName}/jobs?${queryParams}`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch queue jobs')
  return response.json()
}

/**
 * Retry failed job
 *
 * @param {string} queueName - Queue name
 * @param {string} jobId - Job ID
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Retry result
 */
export async function retryFailedJob(queueName, jobId, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/queues/${queueName}/jobs/${jobId}/retry`, {
    method: 'POST',
    headers: {
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to retry job')
  return response.json()
}

/**
 * Pause queue
 *
 * @param {string} queueName - Queue name
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Pause result
 */
export async function pauseQueue(queueName, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/queues/${queueName}/pause`, {
    method: 'POST',
    headers: {
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to pause queue')
  return response.json()
}

/**
 * Resume queue
 *
 * @param {string} queueName - Queue name
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Resume result
 */
export async function resumeQueue(queueName, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/queues/${queueName}/resume`, {
    method: 'POST',
    headers: {
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to resume queue')
  return response.json()
}

/**
 * ============================================================================
 * AUDIT LOGS
 * ============================================================================
 */

/**
 * Get audit logs
 *
 * @param {Object} params - Query parameters (user, action, resource, startDate, endDate, page, limit)
 * @returns {Promise<Object>} Audit logs
 */
export async function getAuditLogs(params = {}) {
  const queryParams = new URLSearchParams(params)
  const response = await fetch(`${API_BASE_URL}/admin/audit-logs?${queryParams}`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch audit logs')
  return response.json()
}

/**
 * Get audit log details
 *
 * @param {string} logId - Log ID
 * @returns {Promise<Object>} Log details
 */
export async function getAuditLogDetails(logId) {
  const response = await fetch(`${API_BASE_URL}/admin/audit-logs/${logId}`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch audit log details')
  return response.json()
}

/**
 * Export audit logs
 *
 * @param {Object} params - Query parameters
 * @param {string} format - Export format (csv, excel, json)
 * @returns {Promise<Blob>} File blob
 */
export async function exportAuditLogs(params = {}, format = 'csv') {
  const queryParams = new URLSearchParams({ ...params, format })
  const response = await fetch(`${API_BASE_URL}/admin/audit-logs/export?${queryParams}`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to export audit logs')
  return response.blob()
}

/**
 * ============================================================================
 * SYSTEM HEALTH
 * ============================================================================
 */

/**
 * Get system health metrics
 *
 * @returns {Promise<Object>} System health data
 */
export async function getSystemHealth() {
  const response = await fetch(`${API_BASE_URL}/admin/system-health`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch system health')
  return response.json()
}

/**
 * Get system metrics history
 *
 * @param {Object} params - Query parameters (timeRange, metrics)
 * @returns {Promise<Object[]>} Metrics history
 */
export async function getSystemMetricsHistory(params = {}) {
  const queryParams = new URLSearchParams(params)
  const response = await fetch(`${API_BASE_URL}/admin/system-health/metrics?${queryParams}`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch system metrics')
  return response.json()
}

/**
 * Configure system alerts
 *
 * @param {Object} alertConfig - Alert configuration
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Updated alert config
 */
export async function configureSystemAlerts(alertConfig, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/system-health/alerts`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
    body: JSON.stringify(alertConfig),
  })

  if (!response.ok) throw new Error('Failed to configure system alerts')
  return response.json()
}

/**
 * ============================================================================
 * ENVIRONMENT CONFIGURATION
 * ============================================================================
 */

/**
 * Get environment configuration (masked secrets)
 *
 * @param {string} environment - Environment name
 * @returns {Promise<Object>} Environment config
 */
export async function getEnvironmentConfig(environment) {
  const response = await fetch(`${API_BASE_URL}/admin/environment/${environment}/config`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch environment config')
  return response.json()
}

/**
 * Propose configuration change
 *
 * @param {string} environment - Environment name
 * @param {Object} changes - Proposed changes
 * @param {string} justification - Change justification
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Approval request
 */
export async function proposeConfigChange(environment, changes, justification, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/environment/${environment}/propose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
    body: JSON.stringify({ changes, justification }),
  })

  if (!response.ok) throw new Error('Failed to propose config change')
  return response.json()
}

/**
 * Get deployment history
 *
 * @param {string} environment - Environment name
 * @param {Object} params - Query parameters
 * @returns {Promise<Object[]>} Deployment history
 */
export async function getDeploymentHistory(environment, params = {}) {
  const queryParams = new URLSearchParams(params)
  const response = await fetch(
    `${API_BASE_URL}/admin/environment/${environment}/deployments?${queryParams}`,
    {
      credentials: 'include',
    }
  )

  if (!response.ok) throw new Error('Failed to fetch deployment history')
  return response.json()
}

/**
 * Rollback configuration
 *
 * @param {string} environment - Environment name
 * @param {string} deploymentId - Deployment ID to rollback to
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Rollback result
 */
export async function rollbackConfig(environment, deploymentId, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/environment/${environment}/rollback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
    body: JSON.stringify({ deploymentId }),
  })

  if (!response.ok) throw new Error('Failed to rollback config')
  return response.json()
}

/**
 * ============================================================================
 * APPROVAL WORKFLOWS
 * ============================================================================
 */

/**
 * Get approval requests
 *
 * @param {Object} params - Query parameters (status, requestor, type)
 * @returns {Promise<Object[]>} Approval requests
 */
export async function getApprovalRequests(params = {}) {
  const queryParams = new URLSearchParams(params)
  const response = await fetch(`${API_BASE_URL}/admin/approvals?${queryParams}`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch approval requests')
  return response.json()
}

/**
 * Create approval request
 *
 * @param {Object} requestData - Request data
 * @returns {Promise<Object>} Created approval request
 */
export async function createApprovalRequest(requestData) {
  const response = await fetch(`${API_BASE_URL}/admin/approvals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(requestData),
  })

  if (!response.ok) throw new Error('Failed to create approval request')
  return response.json()
}

/**
 * Approve request
 *
 * @param {string} requestId - Request ID
 * @param {string} comments - Approval comments
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Approval result
 */
export async function approveRequest(requestId, comments, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/approvals/${requestId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
    body: JSON.stringify({ comments }),
  })

  if (!response.ok) throw new Error('Failed to approve request')
  return response.json()
}

/**
 * Reject request
 *
 * @param {string} requestId - Request ID
 * @param {string} reason - Rejection reason
 * @param {string} mfaCode - MFA code for verification
 * @returns {Promise<Object>} Rejection result
 */
export async function rejectRequest(requestId, reason, mfaCode) {
  const response = await fetch(`${API_BASE_URL}/admin/approvals/${requestId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MFA-Code': mfaCode,
    },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  })

  if (!response.ok) throw new Error('Failed to reject request')
  return response.json()
}

/**
 * Get approval history
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object[]>} Approval history
 */
export async function getApprovalHistory(params = {}) {
  const queryParams = new URLSearchParams(params)
  const response = await fetch(`${API_BASE_URL}/admin/approvals/history?${queryParams}`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch approval history')
  return response.json()
}

/**
 * ============================================================================
 * MFA & SECURITY
 * ============================================================================
 */

/**
 * Request MFA code
 *
 * @param {string} action - Action requiring MFA
 * @returns {Promise<Object>} MFA request result
 */
export async function requestMFACode(action) {
  const response = await fetch(`${API_BASE_URL}/admin/mfa/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ action }),
  })

  if (!response.ok) throw new Error('Failed to request MFA code')
  return response.json()
}

/**
 * Verify MFA code
 *
 * @param {string} code - MFA code
 * @returns {Promise<Object>} Verification result
 */
export async function verifyMFACode(code) {
  const response = await fetch(`${API_BASE_URL}/admin/mfa/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ code }),
  })

  if (!response.ok) throw new Error('Failed to verify MFA code')
  return response.json()
}

/**
 * ============================================================================
 * DEFAULT EXPORT
 * ============================================================================
 */

export default {
  // Dashboard
  getAdminDashboard,

  // User Management
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  forceLogoutUser,
  getUserSessions,

  // Role Management
  getRoles,
  getRolePermissions,
  updateRolePermissions,
  getRoleAssignmentHistory,

  // Feature Flags
  getFeatureFlags,
  toggleFeatureFlag,
  getFeatureFlagHistory,

  // Integration Management
  getIntegrations,
  getIntegrationDetails,
  triggerManualSync,
  updateIntegrationConfig,
  rotateAPIKey,
  getSyncJobHistory,

  // Queue Management
  getQueues,
  getQueueDetails,
  getQueueJobs,
  retryFailedJob,
  pauseQueue,
  resumeQueue,

  // Audit Logs
  getAuditLogs,
  getAuditLogDetails,
  exportAuditLogs,

  // System Health
  getSystemHealth,
  getSystemMetricsHistory,
  configureSystemAlerts,

  // Environment Configuration
  getEnvironmentConfig,
  proposeConfigChange,
  getDeploymentHistory,
  rollbackConfig,

  // Approval Workflows
  getApprovalRequests,
  createApprovalRequest,
  approveRequest,
  rejectRequest,
  getApprovalHistory,

  // MFA & Security
  requestMFACode,
  verifyMFACode,
}
