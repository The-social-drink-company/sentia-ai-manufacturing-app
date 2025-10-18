/**
 * Analytics API Service
 *
 * Frontend service layer for analytics and reporting:
 * - Custom reports
 * - What-if analysis
 * - Saved reports
 * - Export functionality
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Run custom report
 *
 * @param {Object} config - Report configuration
 * @param {string[]} config.metrics - Metrics to include
 * @param {string[]} config.dimensions - Dimensions to group by
 * @param {string} config.visualization - Visualization type
 * @param {Object[]} config.filters - Filters to apply
 * @param {string} config.timeRange - Time range
 * @returns {Promise<Object>} Report data
 */
export async function runCustomReport(config) {
  const response = await fetch(`${API_BASE_URL}/analytics/custom-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error('Failed to run custom report');
  }

  return response.json();
}

/**
 * Get saved reports
 *
 * @returns {Promise<Object[]>} Array of saved reports
 */
export async function getSavedReports() {
  const response = await fetch(`${API_BASE_URL}/analytics/reports`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch saved reports');
  }

  return response.json();
}

/**
 * Save report configuration
 *
 * @param {Object} config - Report configuration to save
 * @returns {Promise<Object>} Saved report details
 */
export async function saveReport(config) {
  const response = await fetch(`${API_BASE_URL}/analytics/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error('Failed to save report');
  }

  return response.json();
}

/**
 * Delete saved report
 *
 * @param {string} reportId - Report ID to delete
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteReport(reportId) {
  const response = await fetch(`${API_BASE_URL}/analytics/reports/${reportId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete report');
  }

  return response.json();
}

/**
 * Calculate what-if scenario
 *
 * @param {Object} params - Scenario parameters
 * @param {Object} params.baseline - Baseline parameters
 * @param {Object} params.scenario - What-if scenario parameters
 * @returns {Promise<Object>} Calculated scenario results
 */
export async function calculateWhatIf(params) {
  const response = await fetch(`${API_BASE_URL}/analytics/what-if/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate what-if scenario');
  }

  return response.json();
}

/**
 * Get sensitivity analysis
 *
 * @param {Object} baseline - Baseline parameters
 * @param {string} metric - Metric to analyze (revenue, profit, margin)
 * @returns {Promise<Object>} Sensitivity analysis results
 */
export async function getSensitivityAnalysis(baseline, metric) {
  const response = await fetch(`${API_BASE_URL}/analytics/what-if/sensitivity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ baseline, metric }),
  });

  if (!response.ok) {
    throw new Error('Failed to get sensitivity analysis');
  }

  return response.json();
}

/**
 * Export report data
 *
 * @param {Object} reportData - Report data to export
 * @param {string} format - Export format (csv, excel, pdf)
 * @returns {Promise<Blob>} File blob
 */
export async function exportReport(reportData, format = 'csv') {
  const response = await fetch(`${API_BASE_URL}/analytics/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ reportData, format }),
  });

  if (!response.ok) {
    throw new Error('Failed to export report');
  }

  return response.blob();
}

/**
 * Schedule report
 *
 * @param {Object} schedule - Schedule configuration
 * @param {string} schedule.reportId - Report ID to schedule
 * @param {string} schedule.frequency - Frequency (daily, weekly, monthly)
 * @param {string[]} schedule.recipients - Email recipients
 * @param {string} schedule.format - Export format
 * @returns {Promise<Object>} Schedule confirmation
 */
export async function scheduleReport(schedule) {
  const response = await fetch(`${API_BASE_URL}/analytics/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(schedule),
  });

  if (!response.ok) {
    throw new Error('Failed to schedule report');
  }

  return response.json();
}

/**
 * Get KPI metrics
 *
 * @param {Object} params - KPI parameters
 * @returns {Promise<Object>} KPI data
 */
export async function getKPIs(params = {}) {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/analytics/kpis?${queryParams}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch KPIs');
  }

  return response.json();
}

export default {
  runCustomReport,
  getSavedReports,
  saveReport,
  deleteReport,
  calculateWhatIf,
  getSensitivityAnalysis,
  exportReport,
  scheduleReport,
  getKPIs,
};
