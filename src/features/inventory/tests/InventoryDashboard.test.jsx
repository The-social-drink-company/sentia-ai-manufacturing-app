import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import InventoryDashboard from '../InventoryDashboard'

// Mock the auth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { role: 'manager', id: 'user123' }
  })
}))

// Mock the inventory metrics hook
vi.mock('../hooks/useInventoryMetrics', () => ({
  useInventoryMetrics: vi.fn(() => ({
    data: {
      summary: {
        totalItems: 1250,
        totalValue: 2850000,
        lowStock: 45,
        outOfStock: 12,
        turnoverRate: 6.2,
        averageDaysOnHand: 58
      },
      categories: [
        { name: 'Raw Materials', value: 1200000, count: 450 },
        { name: 'Finished Goods', value: 980000, count: 380 },
        { name: 'Work in Progress', value: 670000, count: 420 }
      ],
      locations: [
        { name: 'Warehouse A', value: 1500000, utilization: 85 },
        { name: 'Warehouse B', value: 1350000, utilization: 72 }
      ],
      reorderPoints: [
        { sku: 'SKU001', name: 'Product A', currentStock: 50, reorderPoint: 100, leadTime: 14 },
        { sku: 'SKU002', name: 'Product B', currentStock: 25, reorderPoint: 75, leadTime: 21 }
      ]
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
    exportData: vi.fn()
  }))
}))

// Mock child components
vi.mock('../components/InventoryCard', () => ({
  default: ({ title, value, icon }) => (
    <div data-testid={`inventory-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <h3>{title}</h3>
      <span>{value}</span>
    </div>
  )
}))

vi.mock('../components/StockLevelChart', () => ({
  default: ({ data }) => (
    <div data-testid="stock-level-chart">
      Stock Level Chart - {data ? 'with data' : 'no data'}
    </div>
  )
}))

vi.mock('../components/DemandForecast', () => ({
  default: ({ data }) => (
    <div data-testid="demand-forecast">
      Demand Forecast - {data ? 'with data' : 'no data'}
    </div>
  )
}))

vi.mock('../components/SupplierPerformance', () => ({
  default: ({ data }) => (
    <div data-testid="supplier-performance">
      Supplier Performance - {data ? 'with data' : 'no data'}
    </div>
  )
}))

vi.mock('../components/ReorderRecommendations', () => ({
  default: ({ data }) => (
    <div data-testid="reorder-recommendations">
      Reorder Recommendations - {data?.length || 0} items
    </div>
  )
}))

vi.mock('../components/ABCAnalysis', () => ({
  default: ({ data }) => (
    <div data-testid="abc-analysis">
      ABC Analysis - {data ? 'with data' : 'no data'}
    </div>
  )
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('InventoryDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('renders inventory dashboard header', () => {
    renderWithRouter(<InventoryDashboard />)

    expect(screen.getByText('Inventory Management')).toBeInTheDocument()
    expect(screen.getByText(/Real-time inventory tracking/i)).toBeInTheDocument()
  })

  it('displays filter controls', () => {
    renderWithRouter(<InventoryDashboard />)

    expect(screen.getByDisplayValue('All Locations')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument()
    expect(screen.getByDisplayValue('30 Days')).toBeInTheDocument()
  })

  it('renders inventory summary cards', () => {
    renderWithRouter(<InventoryDashboard />)

    expect(screen.getByTestId('inventory-card-total-items')).toBeInTheDocument()
    expect(screen.getByTestId('inventory-card-total-value')).toBeInTheDocument()
    expect(screen.getByTestId('inventory-card-low-stock-alerts')).toBeInTheDocument()
    expect(screen.getByTestId('inventory-card-turnover-rate')).toBeInTheDocument()
  })

  it('renders all dashboard components', () => {
    renderWithRouter(<InventoryDashboard />)

    expect(screen.getByTestId('stock-level-chart')).toBeInTheDocument()
    expect(screen.getByTestId('demand-forecast')).toBeInTheDocument()
    expect(screen.getByTestId('supplier-performance')).toBeInTheDocument()
    expect(screen.getByTestId('reorder-recommendations')).toBeInTheDocument()
    expect(screen.getByTestId('abc-analysis')).toBeInTheDocument()
  })

  it('handles location filter changes', async () => {
    const mockRefetch = vi.fn()
    const { useInventoryMetrics } = await import('../hooks/useInventoryMetrics')
    useInventoryMetrics.mockReturnValue({
      data: { summary: {}, categories: [], locations: [], reorderPoints: [] },
      loading: false,
      error: null,
      refetch: mockRefetch,
      exportData: vi.fn()
    })

    renderWithRouter(<InventoryDashboard />)

    const locationSelect = screen.getByDisplayValue('All Locations')
    fireEvent.change(locationSelect, { target: { value: 'warehouse-a' } })

    await waitFor(() => {
      expect(locationSelect.value).toBe('warehouse-a')
    })
  })

  it('handles category filter changes', async () => {
    renderWithRouter(<InventoryDashboard />)

    const categorySelect = screen.getByDisplayValue('All Categories')
    fireEvent.change(categorySelect, { target: { value: 'raw-materials' } })

    await waitFor(() => {
      expect(categorySelect.value).toBe('raw-materials')
    })
  })

  it('handles time range filter changes', async () => {
    renderWithRouter(<InventoryDashboard />)

    const timeRangeSelect = screen.getByDisplayValue('30 Days')
    fireEvent.change(timeRangeSelect, { target: { value: '7d' } })

    await waitFor(() => {
      expect(timeRangeSelect.value).toBe('7d')
    })
  })

  it('shows loading state', () => {
    const { useInventoryMetrics } = require('../hooks/useInventoryMetrics')
    useInventoryMetrics.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
      exportData: vi.fn()
    })

    renderWithRouter(<InventoryDashboard />)

    expect(screen.getByText('Loading inventory data...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error state', () => {
    const mockError = new Error('Failed to load inventory data')
    const { useInventoryMetrics } = require('../hooks/useInventoryMetrics')
    useInventoryMetrics.mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
      refetch: vi.fn(),
      exportData: vi.fn()
    })

    renderWithRouter(<InventoryDashboard />)

    expect(screen.getByText('Error Loading Inventory Data')).toBeInTheDocument()
    expect(screen.getByText('Failed to load inventory data')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('handles export functionality', async () => {
    const mockExportData = vi.fn()
    const { useInventoryMetrics } = require('../hooks/useInventoryMetrics')
    useInventoryMetrics.mockReturnValue({
      data: { summary: {}, categories: [], locations: [], reorderPoints: [] },
      loading: false,
      error: null,
      refetch: vi.fn(),
      exportData: mockExportData
    })

    renderWithRouter(<InventoryDashboard />)

    const exportButton = screen.getByRole('button', { name: /export/i })
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(mockExportData).toHaveBeenCalledWith('csv')
    })
  })

  it('redirects viewers to dashboard', () => {
    const { useAuth } = require('../../../hooks/useAuth')
    useAuth.mockReturnValue({
      user: { role: 'viewer', id: 'viewer123' }
    })

    renderWithRouter(<InventoryDashboard />)

    // Component should render Navigate component for redirection
    expect(screen.queryByText('Inventory Management')).not.toBeInTheDocument()
  })

  it('sets up auto-refresh interval', () => {
    vi.useFakeTimers()
    const mockRefetch = vi.fn()

    const { useInventoryMetrics } = require('../hooks/useInventoryMetrics')
    useInventoryMetrics.mockReturnValue({
      data: { summary: {}, categories: [], locations: [], reorderPoints: [] },
      loading: false,
      error: null,
      refetch: mockRefetch,
      exportData: vi.fn()
    })

    renderWithRouter(<InventoryDashboard />)

    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30000)

    expect(mockRefetch).toHaveBeenCalledTimes(1)

    // Fast-forward another 30 seconds
    vi.advanceTimersByTime(30000)

    expect(mockRefetch).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  it('passes correct props to child components', () => {
    renderWithRouter(<InventoryDashboard />)

    expect(screen.getByTestId('stock-level-chart')).toHaveTextContent('with data')
    expect(screen.getByTestId('demand-forecast')).toHaveTextContent('with data')
    expect(screen.getByTestId('supplier-performance')).toHaveTextContent('with data')
    expect(screen.getByTestId('reorder-recommendations')).toHaveTextContent('2 items')
    expect(screen.getByTestId('abc-analysis')).toHaveTextContent('with data')
  })

  it('handles retry on error', async () => {
    const mockRefetch = vi.fn()
    const mockError = new Error('Network error')

    const { useInventoryMetrics } = require('../hooks/useInventoryMetrics')
    useInventoryMetrics.mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
      refetch: mockRefetch,
      exportData: vi.fn()
    })

    renderWithRouter(<InventoryDashboard />)

    const retryButton = screen.getByRole('button', { name: /retry/i })
    fireEvent.click(retryButton)

    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('cleans up interval on unmount', () => {
    vi.useFakeTimers()
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

    const { unmount } = renderWithRouter(<InventoryDashboard />)
    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()

    vi.useRealTimers()
  })
})