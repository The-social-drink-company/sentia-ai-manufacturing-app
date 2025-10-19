/**
 * API-related TypeScript type definitions
 *
 * @module server/types/api.types
 */

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: PaginationMeta
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ErrorResponse {
  success: false
  error: string
  message: string
  statusCode?: number
  stack?: string
}

export interface Product {
  id: string
  sku: string
  name: string
  description?: string | null
  unitCost: number
  unitPrice: number
  category?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export interface Sale {
  id: string
  orderId: string
  productId: string
  quantity: number
  unitPrice: number
  totalAmount: number
  saleDate: Date
  channel?: string | null
  customerId?: string | null
  createdAt: Date
}

export interface InventoryItem {
  id: string
  productId: string
  warehouseId?: string | null
  quantityOnHand: number
  reorderPoint?: number | null
  reorderQuantity?: number | null
  lastRestocked?: Date | null
  updatedAt: Date
}

export interface Forecast {
  id: string
  productId: string
  forecastDate: Date
  predictedDemand: number
  confidenceLevel?: number | null
  model?: string | null
  createdAt: Date
}

export interface WorkingCapitalMetric {
  id: string
  metricDate: Date
  accountsReceivable: number
  accountsPayable: number
  inventory: number
  cashConversionCycle?: number | null
  createdAt: Date
}

export interface Scenario {
  id: string
  name: string
  description?: string | null
  parameters: Record<string, any>
  results?: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
}

export interface ApiCredential {
  id: string
  serviceName: string
  apiKey: string
  apiSecret?: string | null
  isActive: boolean
  lastUsed?: Date | null
  createdAt: Date
  updatedAt: Date
}
