/**
 * Forecasting API Service
 *
 * Frontend service layer for interacting with forecasting endpoints:
 * - Run forecasts
 * - Retrieve forecast results
 * - Model comparison
 * - Forecast accuracy metrics
 * - Export functionality
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/**
 * Run a new forecast
 *
 * @param {Object} params - Forecast parameters
 * @param {string[]} params.productIds - Product IDs to forecast
 * @param {string[]} params.models - Models to use (arima, lstm, prophet, randomforest)
 * @param {number} params.horizon - Forecast horizon in days
 * @param {string} params.region - Optional region filter
 * @param {string} params.channel - Optional channel filter
 * @param {boolean} params.useEnsemble - Whether to use ensemble mode
 * @returns {Promise<Object>} Job ID and status
 */
export async function runForecast(params) {
  const response = await fetch(`${API_BASE_URL}/forecasts/train`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to start forecast')
  }

  return response.json()
}

/**
 * Get forecast results by ID
 *
 * @param {string} forecastId - Forecast ID
 * @returns {Promise<Object>} Forecast results with metrics and data
 */
export async function getForecastResults(forecastId) {
  const response = await fetch(`${API_BASE_URL}/forecasts/${forecastId}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch forecast results')
  }

  return response.json()
}

/**
 * Get recent forecasts for a product
 *
 * @param {string} productId - Product ID
 * @param {number} limit - Number of forecasts to return
 * @returns {Promise<Object[]>} Array of recent forecasts
 */
export async function getRecentForecasts(productId = null, limit = 10) {
  const params = new URLSearchParams()
  if (productId) params.append('productId', productId)
  params.append('limit', limit.toString())

  const response = await fetch(`${API_BASE_URL}/forecasts/recent?${params}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch recent forecasts')
  }

  return response.json()
}

/**
 * Get model comparison data for a product
 *
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Comparison data with metrics for all models
 */
export async function getModelComparison(productId) {
  const response = await fetch(`${API_BASE_URL}/forecasts/comparison?productId=${productId}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch model comparison')
  }

  return response.json()
}

/**
 * Get forecast accuracy metrics
 *
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Accuracy metrics (MAPE, RMSE, MAE, R²)
 */
export async function getForecastAccuracy(productId) {
  const response = await fetch(`${API_BASE_URL}/forecasts/accuracy/${productId}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch forecast accuracy')
  }

  return response.json()
}

/**
 * Export forecast data
 *
 * @param {string} forecastId - Forecast ID
 * @param {string} format - Export format (csv, excel, json, pdf)
 * @returns {Promise<Blob>} File blob
 */
export async function exportForecast(forecastId, format = 'csv') {
  const response = await fetch(`${API_BASE_URL}/forecasts/${forecastId}/export?format=${format}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to export forecast')
  }

  return response.blob()
}

/**
 * Push forecast to optimization
 *
 * @param {string} forecastId - Forecast ID
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} Optimization job details
 */
export async function pushToOptimization(forecastId, options = {}) {
  const response = await fetch(`${API_BASE_URL}/forecasts/${forecastId}/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(options),
  })

  if (!response.ok) {
    throw new Error('Failed to push forecast to optimization')
  }

  return response.json()
}

/**
 * Get forecast job status
 *
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Job status and progress
 */
export async function getForecastJobStatus(jobId) {
  const response = await fetch(`${API_BASE_URL}/forecasts/jobs/${jobId}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch job status')
  }

  return response.json()
}

/**
 * Batch forecast for multiple products
 *
 * @param {Object} params - Batch forecast parameters
 * @returns {Promise<Object>} Batch job details
 */
export async function batchForecast(params) {
  const response = await fetch(`${API_BASE_URL}/forecasts/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error('Failed to start batch forecast')
  }

  return response.json()
}

export default {
  runForecast,
  getForecastResults,
  getRecentForecasts,
  getModelComparison,
  getForecastAccuracy,
  exportForecast,
  pushToOptimization,
  getForecastJobStatus,
  batchForecast,
}
