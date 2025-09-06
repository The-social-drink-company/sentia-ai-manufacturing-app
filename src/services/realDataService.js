import { devLog } from '../lib/devLog.js';\n// Real Data Service - Connects to actual external APIs
// NO MOCK DATA - Only real production data

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api'

// Fetch real-time KPI data from backend
export const fetchRealKPIs = async () => {
  try {
    const response = await fetch(`${API_BASE}/kpis/realtime`)
    if (!response.ok) {
      // Fallback to working capital API for financial KPIs
      const wcResponse = await fetch(`${API_BASE}/working-capital/summary`)
      if (wcResponse.ok) {
        const wcData = await wcResponse.json()
        return {
          revenue: wcData.totalRevenue || 0,
          orders: wcData.orderCount || 0,
          efficiency: wcData.efficiency || 0,
          quality: wcData.qualityScore || 0
        }
      }
    }
    return await response.json()
  } catch (error) {
    devLog.error('Failed to fetch real KPIs:', error)
    // Return zeros instead of mock data
    return { revenue: 0, orders: 0, efficiency: 0, quality: 0 }
  }
}

// Fetch real Amazon SP-API data
export const fetchAmazonData = async () => {
  try {
    const response = await fetch(`${API_BASE}/external/amazon/orders`)
    if (!response.ok) throw new Error('Amazon API unavailable')
    return await response.json()
  } catch (error) {
    devLog.error('Failed to fetch Amazon data:', error)
    return { orders: [], revenue: 0, units: 0 }
  }
}

// Fetch real Shopify data
export const fetchShopifyData = async () => {
  try {
    const response = await fetch(`${API_BASE}/external/shopify/analytics`)
    if (!response.ok) throw new Error('Shopify API unavailable')
    return await response.json()
  } catch (error) {
    devLog.error('Failed to fetch Shopify data:', error)
    return { sales: 0, orders: 0, customers: 0 }
  }
}

// Fetch real Unleashed inventory data
export const fetchUnleashedInventory = async () => {
  try {
    const response = await fetch(`${API_BASE}/external/unleashed/stock`)
    if (!response.ok) throw new Error('Unleashed API unavailable')
    return await response.json()
  } catch (error) {
    devLog.error('Failed to fetch Unleashed data:', error)
    return { items: [], totalValue: 0 }
  }
}

// Fetch real production metrics from IoT sensors
export const fetchProductionMetrics = async () => {
  try {
    const response = await fetch(`${API_BASE}/production/metrics`)
    if (!response.ok) throw new Error('Production API unavailable')
    return await response.json()
  } catch (error) {
    devLog.error('Failed to fetch production metrics:', error)
    return { unitsProduced: 0, efficiency: 0, defectRate: 0, oee: 0 }
  }
}

// Fetch real financial data from database
export const fetchFinancialData = async () => {
  try {
    const response = await fetch(`${API_BASE}/financial/summary`)
    if (!response.ok) {
      // Try working capital endpoint as fallback
      const wcResponse = await fetch(`${API_BASE}/working-capital/metrics`)
      if (wcResponse.ok) return await wcResponse.json()
    }
    return await response.json()
  } catch (error) {
    devLog.error('Failed to fetch financial data:', error)
    return { ebitda: 0, grossMargin: 0, cashFlow: 0, roi: 0 }
  }
}

// Fetch real demand forecast from ML model
export const fetchDemandForecast = async () => {
  try {
    const response = await fetch(`${API_BASE}/forecasting/demand`)
    if (!response.ok) throw new Error('Forecast API unavailable')
    return await response.json()
  } catch (error) {
    devLog.error('Failed to fetch demand forecast:', error)
    return { forecast: [], accuracy: 0 }
  }
}

// Fetch real predictive maintenance data from sensors
export const fetchMaintenanceAlerts = async () => {
  try {
    const response = await fetch(`${API_BASE}/maintenance/predictions`)
    if (!response.ok) throw new Error('Maintenance API unavailable')
    return await response.json()
  } catch (error) {
    devLog.error('Failed to fetch maintenance data:', error)
    return { alerts: [], nextMaintenance: null }
  }
}

// Fetch real multi-channel sales data
export const fetchMultiChannelSales = async () => {
  try {
    const [amazon, shopify, direct] = await Promise.all([
      fetchAmazonData(),
      fetchShopifyData(),
      fetch(`${API_BASE}/sales/direct`).then(r => r.ok ? r.json() : { sales: 0 })
    ])
    
    return {
      amazon: amazon.revenue || 0,
      shopify: shopify.sales || 0,
      direct: direct.sales || 0,
      total: (amazon.revenue || 0) + (shopify.sales || 0) + (direct.sales || 0)
    }
  } catch (error) {
    devLog.error('Failed to fetch multi-channel sales:', error)
    return { amazon: 0, shopify: 0, direct: 0, total: 0 }
  }
}

// Fetch real working capital metrics
export const fetchWorkingCapital = async () => {
  try {
    const response = await fetch(`${API_BASE}/working-capital/current`)
    if (!response.ok) throw new Error('Working capital API unavailable')
    return await response.json()
  } catch (error) {
    devLog.error('Failed to fetch working capital:', error)
    return { arDays: 0, apDays: 0, cashCycle: 0, workingCapital: 0 }
  }
}

// Real-time WebSocket connection for live data
export const connectToRealTimeData = (onUpdate) => {
  const ws = new WebSocket(
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:5000/ws`
  )
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onUpdate(data)
    } catch (error) {
      devLog.error('Failed to parse real-time data:', error)
    }
  }
  
  ws.onerror = (error) => {
    devLog.error('WebSocket error:', error)
  }
  
  return ws
}

// Export all real data fetchers
export default {
  fetchRealKPIs,
  fetchAmazonData,
  fetchShopifyData,
  fetchUnleashedInventory,
  fetchProductionMetrics,
  fetchFinancialData,
  fetchDemandForecast,
  fetchMaintenanceAlerts,
  fetchMultiChannelSales,
  fetchWorkingCapital,
  connectToRealTimeData
}