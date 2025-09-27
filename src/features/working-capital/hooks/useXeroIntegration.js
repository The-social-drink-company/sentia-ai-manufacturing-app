/**
 * Xero Integration Hook
 * Provides React integration for Xero API service
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import xeroService from '../services/xeroService'
import { useAuditTrail } from './useAuditTrail'

export const useXeroIntegration = () => {
  const [connectionStatus, setConnectionStatus] = useState(xeroService.getConnectionStatus())
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const queryClient = useQueryClient()
  const audit = useAuditTrail('XeroIntegration')
  const pollIntervalRef = useRef(null)

  // Check connection status on mount and periodically
  useEffect(() => {
    const checkStatus = () => {
      const status = xeroService.getConnectionStatus()
      setConnectionStatus(status)
      audit.logDataAccess('xero_connection_status', { isConnected: status.isConnected })
    }

    checkStatus()

    // Poll connection status every 5 minutes
    pollIntervalRef.current = setInterval(checkStatus, 5 * 60 * 1000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [audit])

  // Authentication mutation
  const authenticateMutation = useMutation({
    mutationFn: async ({ code, state }) => {
      setIsAuthenticating(true)
      audit.trackAction('xero_authentication_attempt', { hasCode: !!code })

      try {
        const tokens = await xeroService.exchangeCodeForTokens(code, state)
        const newStatus = xeroService.getConnectionStatus()
        setConnectionStatus(newStatus)

        audit.trackAction('xero_authentication_success', {
          tenantId: newStatus.tenantId,
          tenantName: newStatus.tenantName
        })

        // Invalidate all financial data queries to refresh with real data
        queryClient.invalidateQueries({ queryKey: ['working-capital'] })
        queryClient.invalidateQueries({ queryKey: ['xero'] })

        return tokens
      } finally {
        setIsAuthenticating(false)
      }
    },
    onError: (error) => {
      setIsAuthenticating(false)
      audit.logError(error, { action: 'xero_authentication' })
    }
  })

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async _() => {
      audit.trackAction('xero_disconnect_attempt')
      xeroService.disconnect()
      const newStatus = xeroService.getConnectionStatus()
      setConnectionStatus(newStatus)

      // Clear all cached financial data
      queryClient.removeQueries({ queryKey: ['xero'] })
      queryClient.invalidateQueries({ queryKey: ['working-capital'] })

      audit.trackAction('xero_disconnect_success')
    },
    onError: (error) => {
      audit.logError(error, { action: 'xero_disconnect' })
    }
  })

  // Generate OAuth URL
  const getAuthUrl = useCallback(() => {
    const authUrl = xeroService.getAuthorizationURL()
    audit.trackAction('xero_auth_url_generated', { url: authUrl })
    return authUrl
  }, [audit])

  // Start OAuth flow
  const startAuthFlow = useCallback(() => {
    const authUrl = getAuthUrl()
    window.location.href = authUrl
  }, [getAuthUrl])

  return {
    connectionStatus,
    isConnected: connectionStatus.isConnected,
    isAuthenticating,
    authenticate: authenticateMutation.mutate,
    disconnect: disconnectMutation.mutate,
    getAuthUrl,
    startAuthFlow,
    isLoading: authenticateMutation.isPending || disconnectMutation.isPending
  }
}

// Hook for fetching accounts receivable data from Xero
export const useXeroAccountsReceivable = (options = _{}) => {
  const { isConnected } = useXeroIntegration()
  const audit = useAuditTrail('XeroAccountsReceivable')

  return useQuery({
    queryKey: _['xero', 'accounts-receivable', _options],
    queryFn: async _() => {
      audit.logDataAccess('accounts_receivable', { source: 'xero_api' })
      const startTime = performance.now()

      try {
        const data = await xeroService.getAccountsReceivable(options)
        const duration = performance.now() - startTime

        audit.logPerformance('ar_data_fetch', duration, 5000, {
          recordCount: data.count,
          totalAmount: data.total
        })

        return data
      } catch (error) {
        audit.logError(error, { action: 'fetch_ar_data' })
        throw error
      }
    },
    enabled: isConnected,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error) => {
      // Don't retry authentication errors
      if (error.message?.includes('401')) return false
      return failureCount < 2
    },
    onError: (error) => {
      audit.logError(error, { query: 'accounts_receivable' })
    }
  })
}

// Hook for fetching accounts payable data from Xero
export const useXeroAccountsPayable = (options = _{}) => {
  const { isConnected } = useXeroIntegration()
  const audit = useAuditTrail('XeroAccountsPayable')

  return useQuery({
    queryKey: _['xero', 'accounts-payable', _options],
    queryFn: async _() => {
      audit.logDataAccess('accounts_payable', { source: 'xero_api' })
      const startTime = performance.now()

      try {
        const data = await xeroService.getAccountsPayable(options)
        const duration = performance.now() - startTime

        audit.logPerformance('ap_data_fetch', duration, 5000, {
          recordCount: data.count,
          totalAmount: data.total
        })

        return data
      } catch (error) {
        audit.logError(error, { action: 'fetch_ap_data' })
        throw error
      }
    },
    enabled: isConnected,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error) => {
      if (error.message?.includes('401')) return false
      return failureCount < 2
    },
    onError: (error) => {
      audit.logError(error, { query: 'accounts_payable' })
    }
  })
}

// Hook for fetching cash and bank account data
export const useXeroCashAccounts = () => {
  const { isConnected } = useXeroIntegration()
  const audit = useAuditTrail('XeroCashAccounts')

  return useQuery({
    queryKey: _['xero', 'cash-accounts'],
    queryFn: async _() => {
      audit.logDataAccess('cash_accounts', { source: 'xero_api' })
      const startTime = performance.now()

      try {
        const data = await xeroService.getCashAccounts()
        const duration = performance.now() - startTime

        audit.logPerformance('cash_data_fetch', duration, 3000, {
          accountCount: data.accounts?.length || 0,
          totalCash: data.totalCash
        })

        return data
      } catch (error) {
        audit.logError(error, { action: 'fetch_cash_data' })
        throw error
      }
    },
    enabled: isConnected,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    onError: (error) => {
      audit.logError(error, { query: 'cash_accounts' })
    }
  })
}

// Hook for fetching balance sheet data
export const useXeroBalanceSheet = () => {
  const { isConnected } = useXeroIntegration()
  const audit = useAuditTrail('XeroBalanceSheet')

  return useQuery({
    queryKey: _['xero', 'balance-sheet'],
    queryFn: async _() => {
      audit.logDataAccess('balance_sheet', { source: 'xero_api' })
      const startTime = performance.now()

      try {
        const data = await xeroService.getBalanceSheet()
        const duration = performance.now() - startTime

        audit.logPerformance('balance_sheet_fetch', duration, 10000, {
          hasData: !!data,
          workingCapital: data?.workingCapital || 0
        })

        return data
      } catch (error) {
        audit.logError(error, { action: 'fetch_balance_sheet' })
        throw error
      }
    },
    enabled: isConnected,
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    onError: (error) => {
      audit.logError(error, { query: 'balance_sheet' })
    }
  })
}

// Hook for fetching profit and loss data
export const useXeroProfitLoss = (periods = _12) => {
  const { isConnected } = useXeroIntegration()
  const audit = useAuditTrail('XeroProfitLoss')

  return useQuery({
    queryKey: _['xero', 'profit-loss', _periods],
    queryFn: async _() => {
      audit.logDataAccess('profit_loss', { source: 'xero_api', periods })
      const startTime = performance.now()

      try {
        const data = await xeroService.getProfitLossReport(periods)
        const duration = performance.now() - startTime

        audit.logPerformance('pl_report_fetch', duration, 15000, {
          hasData: !!data,
          periods,
          revenue: data?.revenue || 0
        })

        return data
      } catch (error) {
        audit.logError(error, { action: 'fetch_profit_loss' })
        throw error
      }
    },
    enabled: isConnected,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
    onError: (error) => {
      audit.logError(error, { query: 'profit_loss' })
    }
  })
}

// Composite hook for all working capital data from Xero
export const useXeroWorkingCapitalData = () => {
  const { isConnected, connectionStatus } = useXeroIntegration()
  const audit = useAuditTrail('XeroWorkingCapitalData')

  // Fetch all required data
  const arQuery = useXeroAccountsReceivable()
  const apQuery = useXeroAccountsPayable()
  const cashQuery = useXeroCashAccounts()
  const balanceSheetQuery = useXeroBalanceSheet()
  const profitLossQuery = useXeroProfitLoss()

  // Combine all data into working capital format
  const combinedData = {
    isConnected,
    connectionStatus,
    isLoading: arQuery.isLoading || apQuery.isLoading || balanceSheetQuery.isLoading,
    isError: arQuery.isError || apQuery.isError || balanceSheetQuery.isError,
    error: arQuery.error || apQuery.error || balanceSheetQuery.error,

    // Raw data from Xero
    accountsReceivable: arQuery.data,
    accountsPayable: apQuery.data,
    cashAccounts: cashQuery.data,
    balanceSheet: balanceSheetQuery.data,
    profitLoss: profitLossQuery.data,

    // Computed working capital metrics
    summary: null,
    receivables: null,
    payables: null,
    inventory: null,
    cashFlow: null
  }

  // Process data when all queries are successful
  useEffect(() => {
    if (arQuery.data && apQuery.data && balanceSheetQuery.data) {
      const summary = {
        workingCapital: balanceSheetQuery.data.workingCapital,
        workingCapitalChange: 0, // Would need historical data
        currentRatio: balanceSheetQuery.data.currentRatio,
        currentRatioChange: 0, // Would need historical data
        quickRatio: balanceSheetQuery.data.currentRatio * 0.8, // Estimate
        quickRatioChange: 0,
        cashConversionCycle: (arQuery.data.dso + (apQuery.data.dpo || 30)) - (apQuery.data.dpo || 30),
        cccChange: 0
      }

      combinedData.summary = summary
      combinedData.receivables = arQuery.data
      combinedData.payables = apQuery.data

      audit.logDataAccess('working_capital_combined', {
        hasAR: !!arQuery.data,
        hasAP: !!apQuery.data,
        hasBalanceSheet: !!balanceSheetQuery.data,
        workingCapital: summary.workingCapital
      })
    }
  }, [arQuery.data, apQuery.data, balanceSheetQuery.data, audit])

  // Refresh all data
  const refetch = useCallback(async _() => {
    audit.trackAction('xero_data_refresh', { userInitiated: true })

    const promises = [
      arQuery.refetch(),
      apQuery.refetch(),
      balanceSheetQuery.refetch(),
      cashQuery.refetch(),
      profitLossQuery.refetch()
    ]

    try {
      await Promise.all(promises)
      audit.trackAction('xero_data_refresh_success')
    } catch (error) {
      audit.logError(error, { action: 'xero_data_refresh' })
      throw error
    }
  }, [arQuery, apQuery, balanceSheetQuery, cashQuery, profitLossQuery, audit])

  return {
    ...combinedData,
    refetch,
    lastUpdated: new Date().toISOString()
  }
}

export default useXeroIntegration