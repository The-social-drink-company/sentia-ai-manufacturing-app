/**
 * Operations API Service
 *
 * Frontend service layer for production and operations endpoints:
 * - Production job management
 * - OEE tracking
 * - Downtime monitoring
 * - Quality metrics
 * - Inventory management
 * - Stock alerts
 * - Inventory optimization
 * - Supplier performance
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * ============================================================================
 * PRODUCTION ENDPOINTS
 * ============================================================================
 */

/**
 * Get production overview
 *
 * @returns {Promise<Object>} Production overview data
 */
export async function getProductionOverview() {
  const response = await fetch(`${API_BASE_URL}/production/overview`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to fetch production overview');
  return response.json();
}

/**
 * Get production jobs
 *
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object[]>} Array of production jobs
 */
export async function getProductionJobs(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE_URL}/production/jobs?${params}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to fetch production jobs');
  return response.json();
}

/**
 * Update production job
 *
 * @param {string} jobId - Job ID
 * @param {Object} updates - Job updates
 * @returns {Promise<Object>} Updated job
 */
export async function updateProductionJob(jobId, updates) {
  const response = await fetch(`${API_BASE_URL}/production/jobs/${jobId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  if (!response.ok) throw new Error('Failed to update production job');
  return response.json();
}

/**
 * Get OEE data
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} OEE data
 */
export async function getOEEData(params = {}) {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/production/oee?${queryParams}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to fetch OEE data');
  return response.json();
}

/**
 * Get downtime data
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Downtime data
 */
export async function getDowntimeData(params = {}) {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/production/downtime?${queryParams}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to fetch downtime data');
  return response.json();
}

/**
 * Resolve downtime event
 *
 * @param {string} eventId - Downtime event ID
 * @returns {Promise<Object>} Updated downtime event
 */
export async function resolveDowntimeEvent(eventId) {
  const response = await fetch(`${API_BASE_URL}/production/downtime/${eventId}/resolve`, {
    method: 'PATCH',
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to resolve downtime event');
  return response.json();
}

/**
 * Get quality metrics
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Quality metrics data
 */
export async function getQualityMetrics(params = {}) {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/production/quality?${queryParams}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to fetch quality metrics');
  return response.json();
}

/**
 * ============================================================================
 * INVENTORY ENDPOINTS
 * ============================================================================
 */

/**
 * Get inventory dashboard data
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Inventory dashboard data
 */
export async function getInventoryDashboard(params = {}) {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/inventory/dashboard?${queryParams}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to fetch inventory dashboard data');
  return response.json();
}

/**
 * Get stock alerts
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Stock alerts data
 */
export async function getStockAlerts(params = {}) {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/inventory/alerts?${queryParams}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to fetch stock alerts');
  return response.json();
}

/**
 * Dismiss stock alert
 *
 * @param {string} alertId - Alert ID
 * @returns {Promise<Object>} Dismissed alert
 */
export async function dismissStockAlert(alertId) {
  const response = await fetch(`${API_BASE_URL}/inventory/alerts/${alertId}/dismiss`, {
    method: 'PATCH',
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to dismiss stock alert');
  return response.json();
}

/**
 * Execute alert action
 *
 * @param {string} alertId - Alert ID
 * @param {Object} actionData - Action data (action type, sku, warehouse)
 * @returns {Promise<Object>} Action result
 */
export async function executeAlertAction(alertId, actionData) {
  const response = await fetch(`${API_BASE_URL}/inventory/alerts/${alertId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(actionData),
  });

  if (!response.ok) throw new Error('Failed to execute alert action');
  return response.json();
}

/**
 * Get inventory optimization data
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Optimization data
 */
export async function getInventoryOptimization(params = {}) {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/inventory/optimization?${queryParams}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to fetch inventory optimization data');
  return response.json();
}

/**
 * Run inventory optimization
 *
 * @param {Object} config - Optimization configuration
 * @returns {Promise<Object>} Optimization results
 */
export async function runInventoryOptimization(config) {
  const response = await fetch(`${API_BASE_URL}/inventory/optimization/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(config),
  });

  if (!response.ok) throw new Error('Failed to run inventory optimization');
  return response.json();
}

/**
 * Create purchase order
 *
 * @param {Object} orderData - Purchase order data
 * @returns {Promise<Object>} Created purchase order
 */
export async function createPurchaseOrder(orderData) {
  const response = await fetch(`${API_BASE_URL}/inventory/purchase-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(orderData),
  });

  if (!response.ok) throw new Error('Failed to create purchase order');
  return response.json();
}

/**
 * ============================================================================
 * SUPPLY CHAIN ENDPOINTS
 * ============================================================================
 */

/**
 * Get supplier performance data
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Supplier performance data
 */
export async function getSupplierPerformance(params = {}) {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/supply-chain/suppliers/performance?${queryParams}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to fetch supplier performance data');
  return response.json();
}

/**
 * Get supplier details
 *
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<Object>} Supplier details
 */
export async function getSupplierDetails(supplierId) {
  const response = await fetch(`${API_BASE_URL}/supply-chain/suppliers/${supplierId}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to fetch supplier details');
  return response.json();
}

/**
 * Update supplier rating
 *
 * @param {string} supplierId - Supplier ID
 * @param {Object} ratingData - Rating data
 * @returns {Promise<Object>} Updated supplier
 */
export async function updateSupplierRating(supplierId, ratingData) {
  const response = await fetch(`${API_BASE_URL}/supply-chain/suppliers/${supplierId}/rating`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(ratingData),
  });

  if (!response.ok) throw new Error('Failed to update supplier rating');
  return response.json();
}

/**
 * ============================================================================
 * EXPORT UTILITIES
 * ============================================================================
 */

/**
 * Export production data
 *
 * @param {string} dataType - Type of data to export (jobs, oee, downtime, quality)
 * @param {string} format - Export format (csv, excel, pdf)
 * @param {Object} params - Query parameters
 * @returns {Promise<Blob>} File blob
 */
export async function exportProductionData(dataType, format = 'csv', params = {}) {
  const queryParams = new URLSearchParams({ ...params, format });
  const response = await fetch(`${API_BASE_URL}/production/${dataType}/export?${queryParams}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to export production data');
  return response.blob();
}

/**
 * Export inventory data
 *
 * @param {string} dataType - Type of data to export (dashboard, alerts, optimization)
 * @param {string} format - Export format (csv, excel, pdf)
 * @param {Object} params - Query parameters
 * @returns {Promise<Blob>} File blob
 */
export async function exportInventoryData(dataType, format = 'csv', params = {}) {
  const queryParams = new URLSearchParams({ ...params, format });
  const response = await fetch(`${API_BASE_URL}/inventory/${dataType}/export?${queryParams}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to export inventory data');
  return response.blob();
}

/**
 * Export supplier data
 *
 * @param {string} format - Export format (csv, excel, pdf)
 * @param {Object} params - Query parameters
 * @returns {Promise<Blob>} File blob
 */
export async function exportSupplierData(format = 'csv', params = {}) {
  const queryParams = new URLSearchParams({ ...params, format });
  const response = await fetch(`${API_BASE_URL}/supply-chain/suppliers/export?${queryParams}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to export supplier data');
  return response.blob();
}

/**
 * ============================================================================
 * DEFAULT EXPORT
 * ============================================================================
 */

export default {
  // Production
  getProductionOverview,
  getProductionJobs,
  updateProductionJob,
  getOEEData,
  getDowntimeData,
  resolveDowntimeEvent,
  getQualityMetrics,

  // Inventory
  getInventoryDashboard,
  getStockAlerts,
  dismissStockAlert,
  executeAlertAction,
  getInventoryOptimization,
  runInventoryOptimization,
  createPurchaseOrder,

  // Supply Chain
  getSupplierPerformance,
  getSupplierDetails,
  updateSupplierRating,

  // Export
  exportProductionData,
  exportInventoryData,
  exportSupplierData,
};
