import { logWarn } from '../utils/structuredLogger.js'

const DEFAULT_MCP_BASE_URL = 'https://mcp-server-tkyu.onrender.com'
const DASHBOARD_SUMMARY_PATH = '/v1/dashboard/summary'

const MOCK_DASHBOARD_SUMMARY = {
  generatedAt: new Date().toISOString(),
  metrics: {
    throughput: { value: 94.7, unit: '%', trend: 1.8 },
    forecastAccuracy: { value: 86.3, unit: '%', trend: 0.9 },
    cashRunway: { value: 137, unit: 'days', trend: 6 },
    queueDepth: { value: 12, unit: 'jobs', trend: -3 },
  },
  alerts: [
    {
      id: 'line-7-maintenance',
      severity: 'warning',
      message: 'Line 7 scheduled maintenance window in 2 hours',
    },
    {
      id: 'supply-risk',
      severity: 'info',
      message: 'Supplier lead time extended 3 days for EU spirits batch',
    },
  ],
}

function resolveBaseUrl() {
  return import.meta.env?.VITE_MCP_BASE_URL ?? DEFAULT_MCP_BASE_URL
}

async function safeJson(response) {
  try {
    return await response.json()
  } catch (error) {\n    logWarn('Failed to parse dashboard summary JSON', error)\n    return null\n  }
}

export async function fetchDashboardSummary({ signal } = {}) {
  const controller = !signal ? new AbortController() : null
  const timeout = controller ? setTimeout(() => controller.abort(), 5000) : null

  const requestSignal = signal ?? controller?.signal
  const baseUrl = resolveBaseUrl()
  const url = `${baseUrl}${DASHBOARD_SUMMARY_PATH}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
      signal: requestSignal,
    })

    if (!response.ok) {
      throw new Error(`MCP responded with ${response.status}`)
    }

    const payload = await safeJson(response)
    if (!payload) {
      throw new Error('MCP response missing JSON body')
    }

    return {
      source: 'mcp',
      payload,
    }
  } catch (error) {
    logWarn('Dashboard service falling back to mock summary', error)
    return {
      source: 'mock',
      payload: MOCK_DASHBOARD_SUMMARY,
    }
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

