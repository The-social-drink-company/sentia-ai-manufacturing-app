import { useState, useEffect } from 'react'

/**
 * Hook to fetch integration status from backend health endpoints
 * Returns status for Xero, Shopify, Amazon, and Unleashed integrations
 */
export const useIntegrationStatus = () => {
  const [integrationStatus, setIntegrationStatus] = useState({
    xero: null,
    shopify: null,
    amazon: null,
    unleashed: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchIntegrationStatus = async () => {
      try {
        const response = await fetch('/api/health')
        const health = await response.json()

        // Extract integration statuses from health check
        const xeroStatus = health.components?.xero || {
          status: 'not_configured',
          message: 'Xero integration not configured',
        }

        const shopifyStatus = health.components?.shopify || {
          status: 'not_configured',
          connected: false,
          activeStores: 0,
          totalStores: 2,
          stores: [],
        }

        const amazonStatus = health.components?.amazon || {
          status: 'not_configured',
          message: 'Amazon SP-API not configured',
        }

        const unleashedStatus = health.components?.unleashed || {
          status: 'not_configured',
          message: 'Unleashed ERP not configured',
        }

        setIntegrationStatus({
          xero: xeroStatus,
          shopify: shopifyStatus,
          amazon: amazonStatus,
          unleashed: unleashedStatus,
          loading: false,
          error: null,
        })
      } catch (error) {
        console.error('[useIntegrationStatus] Failed to fetch integration status:', error)
        setIntegrationStatus(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to check integration status',
        }))
      }
    }

    fetchIntegrationStatus()

    // Refresh integration status every 5 minutes
    const interval = setInterval(fetchIntegrationStatus, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return integrationStatus
}

export default useIntegrationStatus
