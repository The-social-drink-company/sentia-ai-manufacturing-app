/**
 * Authentication Test Helpers
 *
 * Utilities for creating mock Clerk tokens and authentication headers for integration tests.
 *
 * @see tests/integration/tenant-isolation.test.js for usage examples
 */

/**
 * Create a mock Clerk JWT token for testing
 *
 * In production, use real Clerk tokens. This is a simplified mock for integration tests.
 *
 * @param {string} orgId - Clerk organization ID (e.g., 'org_test_prof_123')
 * @param {string} userId - Clerk user ID (e.g., 'user_123')
 * @returns {string} Mock JWT token
 */
export function createMockClerkToken(orgId, userId) {
  const payload = {
    orgId,
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
  }

  // Base64 encode the payload (not secure, just for testing)
  return `mock.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`
}

/**
 * Create authorization headers for API requests
 *
 * @param {string} token - JWT token
 * @returns {Object} Headers object with Authorization
 */
export function createAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`
  }
}

/**
 * Create a test user token with specific roles
 *
 * @param {string} orgId - Organization ID
 * @param {string} userId - User ID
 * @param {string[]} roles - Array of roles (e.g., ['admin', 'manager'])
 * @returns {string} Mock JWT token with roles
 */
export function createMockTokenWithRoles(orgId, userId, roles = ['member']) {
  const payload = {
    orgId,
    userId,
    roles,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  }

  return `mock.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`
}

/**
 * Create headers with content-type and auth
 *
 * @param {string} token - JWT token
 * @returns {Object} Headers with Authorization and Content-Type
 */
export function createJsonAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}
