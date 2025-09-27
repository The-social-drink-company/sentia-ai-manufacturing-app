/**
 * Xero API Integration Service
 * Provides real financial data for working capital management
 */

import { auditService } from './auditService'

// Xero API configuration
const XERO_CONFIG = {
  baseURL: 'https://api.xero.com/api.xro/2.0',
  authURL: 'https://identity.xero.com/connect/authorize',
  tokenURL: 'https://identity.xero.com/connect/token',
  clientId: process.env.VITE_XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectURI: `${window.location.origin}/auth/xero/callback`,
  scopes: [
    'accounting.transactions',
    'accounting.contacts',
    'accounting.settings',
    'accounting.reports.read'
  ]
}

class XeroAPIService {
  constructor() {
    this.accessToken = localStorage.getItem('xero_access_token')
    this.refreshToken = localStorage.getItem('xero_refresh_token')
    this.tokenExpiry = localStorage.getItem('xero_token_expiry')
    this.tenantId = localStorage.getItem('xero_tenant_id')
    this.isConnected = false
    this.retryCount = 0
    this.maxRetries = 3

    // Initialize connection status
    this.checkConnectionStatus()
  }

  // Check if we have valid authentication
  checkConnectionStatus() {
    const hasValidToken = this.accessToken &&
                         this.tokenExpiry &&
                         new Date(this.tokenExpiry) > new Date()

    this.isConnected = hasValidToken && this.tenantId

    auditService.logEvent('xero_connection_check', {
      hasToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      hasValidExpiry: hasValidToken,
      hasTenant: !!this.tenantId,
      isConnected: this.isConnected
    })

    return this.isConnected
  }

  // Generate OAuth authorization URL
  getAuthorizationURL(state = null) {
    const stateParam = state || Math.random().toString(36).substring(2, 15)
    localStorage.setItem('xero_oauth_state', stateParam)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: XERO_CONFIG.clientId,
      redirect_uri: XERO_CONFIG.redirectURI,
      scope: XERO_CONFIG.scopes.join(' '),
      state: stateParam
    })

    const authURL = `${XERO_CONFIG.authURL}?${params.toString()}`

    auditService.logEvent('xero_auth_url_generated', {
      redirectURI: XERO_CONFIG.redirectURI,
      scopes: XERO_CONFIG.scopes,
      state: stateParam
    })

    return authURL
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code, state) {
    const storedState = localStorage.getItem('xero_oauth_state')
    if (state !== storedState) {
      throw new Error('Invalid OAuth state parameter')
    }

    try {
      const tokenData = {
        grant_type: 'authorization_code',
        client_id: XERO_CONFIG.clientId,
        code: code,
        redirect_uri: XERO_CONFIG.redirectURI
      }

      const response = await fetch(XERO_CONFIG.tokenURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${XERO_CONFIG.clientId}:${XERO_CONFIG.clientSecret}`)}`
        },
        body: new URLSearchParams(tokenData)
      })

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`)
      }

      const tokens = await response.json()
      this.storeTokens(tokens)

      // Get tenant connections
      await this.fetchConnections()

      auditService.logEvent('xero_token_exchange_success', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in
      })

      return tokens
    } catch (error) {
      auditService.logError(error, {
        action: 'xero_token_exchange',
        code: code?.substring(0, 10) + '...'
      })
      throw error
    }
  }

  // Store tokens securely
  storeTokens(tokens) {
    this.accessToken = tokens.access_token
    this.refreshToken = tokens.refresh_token
    this.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    localStorage.setItem('xero_access_token', this.accessToken)
    localStorage.setItem('xero_refresh_token', this.refreshToken)
    localStorage.setItem('xero_token_expiry', this.tokenExpiry)

    this.isConnected = true
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const tokenData = {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      }

      const response = await fetch(XERO_CONFIG.tokenURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${XERO_CONFIG.clientId}:${XERO_CONFIG.clientSecret}`)}`
        },
        body: new URLSearchParams(tokenData)
      })

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`)
      }

      const tokens = await response.json()
      this.storeTokens(tokens)

      auditService.logEvent('xero_token_refresh_success', {
        newExpiresIn: tokens.expires_in
      })

      return tokens
    } catch (error) {
      auditService.logError(error, { action: 'xero_token_refresh' })
      this.clearTokens()
      throw error
    }
  }

  // Fetch available connections/tenants
  async fetchConnections() {
    try {
      const response = await this.makeAPIRequest('https://api.xero.com/connections', 'GET')

      if (response.length > 0) {
        this.tenantId = response[0].tenantId
        localStorage.setItem('xero_tenant_id', this.tenantId)
        localStorage.setItem('xero_tenant_name', response[0].tenantName)

        auditService.logEvent('xero_connections_fetched', {
          tenantCount: response.length,
          tenantId: this.tenantId,
          tenantName: response[0].tenantName
        })
      }

      return response
    } catch (error) {
      auditService.logError(error, { action: 'xero_fetch_connections' })
      throw error
    }
  }

  // Make authenticated API request with retry logic
  async makeAPIRequest(endpoint, method = 'GET', data = null) {
    if (!this.isConnected) {
      throw new Error('Xero not connected. Please authenticate first.')
    }

    // Check if token needs refresh
    if (new Date(this.tokenExpiry) <= new Date()) {
      await this.refreshAccessToken()
    }

    const url = endpoint.startsWith('http') ? endpoint : `${XERO_CONFIG.baseURL}/${endpoint}`

    const requestOptions = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Xero-tenant-id': this.tenantId,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(data)
    }

    try {
      const startTime = performance.now()
      const response = await fetch(url, requestOptions)
      const duration = performance.now() - startTime

      if (!response.ok) {
        if (response.status === 401 && this.retryCount < this.maxRetries) {
          this.retryCount++
          auditService.logEvent('xero_401_retry_attempt', {
            retryCount: this.retryCount,
            endpoint: url
          })

          await this.refreshAccessToken()
          return this.makeAPIRequest(endpoint, method, data)
        }

        const errorData = await response.text()
        throw new Error(`Xero API error: ${response.status} - ${errorData}`)
      }

      const responseData = await response.json()
      this.retryCount = 0

      auditService.logEvent('xero_api_success', {
        endpoint: url,
        method,
        statusCode: response.status,
        responseTime: Math.round(duration),
        dataSize: JSON.stringify(responseData).length
      })

      return responseData
    } catch (error) {
      auditService.logError(error, {
        action: 'xero_api_request',
        endpoint: url,
        method,
        retryCount: this.retryCount
      })
      throw error
    }
  }

  // Clear stored tokens
  clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    this.tokenExpiry = null
    this.tenantId = null
    this.isConnected = false

    localStorage.removeItem('xero_access_token')
    localStorage.removeItem('xero_refresh_token')
    localStorage.removeItem('xero_token_expiry')
    localStorage.removeItem('xero_tenant_id')
    localStorage.removeItem('xero_tenant_name')

    auditService.logEvent('xero_tokens_cleared', {
      reason: 'user_logout_orerror'
    })
  }

  // Fetch accounts receivable data
  async getAccountsReceivable(options = {}) {
    try {
      const params = new URLSearchParams({
        where: 'Status=="AUTHORISED"',
        order: 'DueDateString DESC',
        ...options.queryParams
      })

      const invoices = await this.makeAPIRequest(`Invoices?${params}`)

      // Process AR data for working capital metrics
      const arData = this.processARData(invoices.Invoices || [])

      auditService.logEvent('xero_ar_data_fetched', {
        invoiceCount: invoices.Invoices?.length || 0,
        totalOutstanding: arData.total,
        overdueAmount: arData.overdue
      })

      return arData
    } catch (error) {
      auditService.logError(error, { action: 'fetch_accounts_receivable' })
      throw error
    }
  }

  // Fetch accounts payable data
  async getAccountsPayable(options = {}) {
    try {
      const params = new URLSearchParams({
        where: 'Status=="AUTHORISED" AND Type=="ACCPAY"',
        order: 'DueDateString DESC',
        ...options.queryParams
      })

      const bills = await this.makeAPIRequest(`Invoices?${params}`)

      // Process AP data for working capital metrics
      const apData = this.processAPData(bills.Invoices || [])

      auditService.logEvent('xero_ap_data_fetched', {
        billCount: bills.Invoices?.length || 0,
        totalOutstanding: apData.total,
        discountsAvailable: apData.discountsAvailable
      })

      return apData
    } catch (error) {
      auditService.logError(error, { action: 'fetch_accounts_payable' })
      throw error
    }
  }

  // Fetch cash and bank accounts
  async getCashAccounts() {
    try {
      const accounts = await this.makeAPIRequest('Accounts?where=Type=="BANK"')

      const cashData = {
        totalCash: 0,
        accounts: [],
        lastUpdated: new Date().toISOString()
      }

      if (accounts.Accounts) {
        cashData.accounts = accounts.Accounts.map(account => ({
          id: account.AccountID,
          name: account.Name,
          balance: parseFloat(account.BankAccountNumber) || 0,
          type: account.BankAccountType,
          currency: account.CurrencyCode
        }))

        cashData.totalCash = cashData.accounts.reduce((sum, account) => sum + account.balance, 0)
      }

      auditService.logEvent('xero_cash_data_fetched', {
        accountCount: cashData.accounts.length,
        totalCash: cashData.totalCash
      })

      return cashData
    } catch (error) {
      auditService.logError(error, { action: 'fetch_cash_accounts' })
      throw error
    }
  }

  // Fetch profit and loss report
  async getProfitLossReport(periods = 12) {
    try {
      const fromDate = new Date()
      fromDate.setMonth(fromDate.getMonth() - periods)

      const params = new URLSearchParams({
        fromDate: fromDate.toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        periods: periods,
        timeframe: 'MONTH'
      })

      const report = await this.makeAPIRequest(`Reports/ProfitAndLoss?${params}`)

      auditService.logEvent('xero_pl_report_fetched', {
        periods,
        reportDate: report.ReportDate,
        hasData: !!report.Reports?.[0]
      })

      return this.processPLReport(report)
    } catch (error) {
      auditService.logError(error, { action: 'fetch_profit_loss_report' })
      throw error
    }
  }

  // Fetch balance sheet report
  async getBalanceSheet() {
    try {
      const report = await this.makeAPIRequest('Reports/BalanceSheet')

      auditService.logEvent('xero_balance_sheet_fetched', {
        reportDate: report.ReportDate,
        hasData: !!report.Reports?.[0]
      })

      return this.processBalanceSheet(report)
    } catch (error) {
      auditService.logError(error, { action: 'fetch_balance_sheet' })
      throw error
    }
  }

  // Process AR data for working capital calculations
  processARData(invoices) {
    const now = new Date()
    let total = 0
    let overdue = 0
    const aging = { current: 0, '30days': 0, '60days': 0, '90days': 0, '120plus': 0 }
    const receivables = []

    invoices.forEach(invoice => {
      const amountDue = parseFloat(invoice.AmountDue) || 0
      const dueDate = new Date(invoice.DueDateString)
      const daysPastDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24))

      total += amountDue

      if (daysPastDue > 0) {
        overdue += amountDue
      }

      // Age buckets
      if (daysPastDue <= 0) {
        aging.current += amountDue
      } else if (daysPastDue <= 30) {
        aging['30days'] += amountDue
      } else if (daysPastDue <= 60) {
        aging['60days'] += amountDue
      } else if (daysPastDue <= 90) {
        aging['90days'] += amountDue
      } else {
        aging['120plus'] += amountDue
      }

      receivables.push({
        invoiceId: invoice.InvoiceID,
        invoiceNumber: invoice.InvoiceNumber,
        contactName: invoice.Contact?.Name,
        amount: amountDue,
        dueDate: invoice.DueDateString,
        daysPastDue,
        status: invoice.Status
      })
    })

    // Calculate DSO (Days Sales Outstanding)
    const dso = total > 0 ? Math.round((total / (total / 30))) : 0

    return {
      total: Math.round(total * 100) / 100,
      overdue: Math.round(overdue * 100) / 100,
      dso,
      aging,
      receivables,
      count: invoices.length,
      lastUpdated: new Date().toISOString()
    }
  }

  // Process AP data for working capital calculations
  processAPData(bills) {
    const now = new Date()
    let total = 0
    let discountsAvailable = 0
    const aging = { current: 0, '30days': 0, '60days': 0, '90days': 0, '120plus': 0 }
    const payables = []

    bills.forEach(bill => {
      const amountDue = parseFloat(bill.AmountDue) || 0
      const dueDate = new Date(bill.DueDateString)
      const daysPastDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24))

      total += amountDue

      // Estimate early payment discounts (typically 2% if paid within 10 days)
      if (daysPastDue < -10) {
        discountsAvailable += amountDue * 0.02
      }

      // Age buckets
      if (daysPastDue <= 0) {
        aging.current += amountDue
      } else if (daysPastDue <= 30) {
        aging['30days'] += amountDue
      } else if (daysPastDue <= 60) {
        aging['60days'] += amountDue
      } else if (daysPastDue <= 90) {
        aging['90days'] += amountDue
      } else {
        aging['120plus'] += amountDue
      }

      payables.push({
        invoiceId: bill.InvoiceID,
        invoiceNumber: bill.InvoiceNumber,
        contactName: bill.Contact?.Name,
        amount: amountDue,
        dueDate: bill.DueDateString,
        daysPastDue,
        status: bill.Status
      })
    })

    // Calculate DPO (Days Payable Outstanding)
    const dpo = total > 0 ? Math.round((total / (total / 30))) : 0

    return {
      total: Math.round(total * 100) / 100,
      discountsAvailable: Math.round(discountsAvailable * 100) / 100,
      dpo,
      aging,
      payables,
      count: bills.length,
      lastUpdated: new Date().toISOString()
    }
  }

  // Process profit and loss report
  processPLReport(report) {
    // Extract key metrics for cash flow analysis
    const reportData = report.Reports?.[0]
    if (!reportData) return null

    const sections = reportData.Rows || []
    const revenue = this.extractSectionValue(sections, 'Revenue')
    const expenses = this.extractSectionValue(sections, 'Expenses')
    const netIncome = revenue - expenses

    return {
      revenue,
      expenses,
      netIncome,
      grossMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
      reportPeriod: reportData.ReportTitles?.[1] || 'Current Period',
      lastUpdated: new Date().toISOString()
    }
  }

  // Process balance sheet for working capital calculation
  processBalanceSheet(report) {
    const reportData = report.Reports?.[0]
    if (!reportData) return null

    const sections = reportData.Rows || []
    const currentAssets = this.extractSectionValue(sections, 'Current Assets')
    const currentLiabilities = this.extractSectionValue(sections, 'Current Liabilities')
    const workingCapital = currentAssets - currentLiabilities

    return {
      currentAssets,
      currentLiabilities,
      workingCapital,
      currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
      reportDate: reportData.ReportDate,
      lastUpdated: new Date().toISOString()
    }
  }

  // Helper function to extract values from Xero report sections
  extractSectionValue(rows, sectionName) {
    const section = rows.find(row => row.Title?.includes(sectionName))
    if (!section || !section.Rows) return 0

    return section.Rows.reduce((total, row) => {
      const value = row.Cells?.[1]?.Value
      return total + (parseFloat(value) || 0)
    }, 0)
  }

  // Get connection status for UI
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      tenantId: this.tenantId,
      tenantName: localStorage.getItem('xero_tenant_name'),
      tokenExpiry: this.tokenExpiry,
      lastCheck: new Date().toISOString()
    }
  }

  // Disconnect from Xero
  disconnect() {
    this.clearTokens()
    auditService.logEvent('xero_disconnected', {
      reason: 'user_initiated'
    })
  }
}

// Create singleton instance
const xeroService = new XeroAPIService()

export default xeroService