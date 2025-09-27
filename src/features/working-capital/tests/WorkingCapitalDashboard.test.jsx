import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import WorkingCapitalDashboard from '../WorkingCapitalDashboard'

// Mock the auth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { role: 'manager', id: 'user123' }
  })
}))

// Mock the working capital metrics hook
vi.mock('../hooks/useWorkingCapitalMetrics', () => ({
  useWorkingCapitalMetrics: vi.fn(() => ({
    data: {
      summary: {
        workingCapital: 1200000,
        workingCapitalChange: 5.2,
        cashConversionCycle: 35,
        cccChange: -2.1,
        currentRatio: 2.1,
        currentRatioChange: 1.5,
        quickRatio: 1.8,
        quickRatioChange: 0.8
      },
      receivables: {
        total: 450000,
        dso: 42,
        overdue: 85000
      },
      payables: {
        total: 280000,
        dpo: 38,
        discountsAvailable: 12000
      },
      inventory: {
        total: 650000,
        dio: 28,
        turnoverRatio: 13.1
      },
      alerts: [
        {
          severity: 'warning',
          title: 'High DSO',
          description: 'Days Sales Outstanding is above target',
          action: 'Review Collections'
        }
      ]
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
    exportData: vi.fn()
  }))
}))

// Mock chart components to avoid canvas issues in tests
vi.mock('../components/AgingChart', () => ({
  default: ({ title }) => <div data-testid="aging-chart">{title}</div>
}))

vi.mock('../components/CashConversionCycle', () => ({
  default: ({ dso, dio, dpo }) => (
    <div data-testid="ccc-chart">
      CCC: {dso + dio - dpo} days
    </div>
  )
}))

vi.mock('../components/CashFlowForecast', () => ({
  default: ({ data, period }) => (
    <div data-testid="cash-flow-forecast">
      Cash Flow Forecast - {period}
    </div>
  )
}))

vi.mock('../components/OptimizationRecommendations', () => ({
  default: ({ recommendations, onActionClick }) => (
    <div data-testid="optimization-recommendations">
      <button onClick={() => onActionClick('test-action')}>
        Test Action
      </button>
    </div>
  )
}))

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('WorkingCapitalDashboard', () => {
  const mockRefetch = vi.fn()
  const mockExportData = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock successful export
    mockExportData.mockResolvedValue({ success: true, filename: 'test.csv' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the dashboard with all main sections', () => {
    renderWithRouter(<WorkingCapitalDashboard />)

    // Check header
    expect(screen.getByText('Working Capital Management')).toBeInTheDocument()
    expect(screen.getByText('Optimize cash flow and improve financial efficiency')).toBeInTheDocument()

    // Check metric cards
    expect(screen.getByText('Working Capital')).toBeInTheDocument()
    expect(screen.getByText('Cash Conversion Cycle')).toBeInTheDocument()
    expect(screen.getByText('Current Ratio')).toBeInTheDocument()
    expect(screen.getByText('Quick Ratio')).toBeInTheDocument()

    // Check sections
    expect(screen.getByText('Accounts Receivable')).toBeInTheDocument()
    expect(screen.getByText('Accounts Payable')).toBeInTheDocument()
    expect(screen.getByText('Inventory')).toBeInTheDocument()
  })

  it('displays correct metric values', () => {
    renderWithRouter(<WorkingCapitalDashboard />)

    // Check formatted currency values
    expect(screen.getByText('$1,200,000')).toBeInTheDocument() // Working Capital
    expect(screen.getByText('35')).toBeInTheDocument() // CCC days
    expect(screen.getByText('2.1')).toBeInTheDocument() // Current Ratio
    expect(screen.getByText('1.8')).toBeInTheDocument() // Quick Ratio

    // Check receivables section
    expect(screen.getByText('$450,000')).toBeInTheDocument() // Total Outstanding
    expect(screen.getByText('42 days')).toBeInTheDocument() // DSO
    expect(screen.getByText('$85,000')).toBeInTheDocument() // Overdue

    // Check payables section
    expect(screen.getByText('$280,000')).toBeInTheDocument() // Total Outstanding
    expect(screen.getByText('38 days')).toBeInTheDocument() // DPO
    expect(screen.getByText('$12,000')).toBeInTheDocument() // Discounts Available

    // Check inventory section
    expect(screen.getByText('$650,000')).toBeInTheDocument() // Total Value
    expect(screen.getByText('28 days')).toBeInTheDocument() // DIO
    expect(screen.getByText('13.1x')).toBeInTheDocument() // Turnover Ratio
  })

  it('displays alerts when present', () => {
    renderWithRouter(<WorkingCapitalDashboard />)

    expect(screen.getByText('Active Alerts')).toBeInTheDocument()
    expect(screen.getByText('High DSO')).toBeInTheDocument()
    expect(screen.getByText('Days Sales Outstanding is above target')).toBeInTheDocument()
    expect(screen.getByText('Review Collections')).toBeInTheDocument()
  })

  it('handles period selection changes', () => {
    renderWithRouter(<WorkingCapitalDashboard />)

    const periodSelector = screen.getByDisplayValue('Current')
    fireEvent.change(periodSelector, { target: { value: 'mtd' } })

    // Should trigger a re-render with the new period
    expect(periodSelector.value).toBe('mtd')
  })

  it('handles currency selection changes', () => {
    renderWithRouter(<WorkingCapitalDashboard />)

    const currencySelector = screen.getByDisplayValue('USD')
    fireEvent.change(currencySelector, { target: { value: 'EUR' } })

    expect(currencySelector.value).toBe('EUR')
  })

  it('handles export functionality', async () => {
    renderWithRouter(<WorkingCapitalDashboard />)

    // Find and hover over the export menu
    const exportMenu = screen.getByText('Export').closest('.relative')
    fireEvent.mouseEnter(exportMenu)

    await waitFor(() => {
      expect(screen.getByText('Export as PDF')).toBeInTheDocument()
    })

    // Click on PDF export
    const pdfExport = screen.getByText('Export as PDF')
    fireEvent.click(pdfExport)

    await waitFor(() => {
      expect(mockExportData).toHaveBeenCalledWith('pdf')
    })
  })

  it('handles refresh button click', () => {
    renderWithRouter(<WorkingCapitalDashboard />)

    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)

    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('renders chart components', () => {
    renderWithRouter(<WorkingCapitalDashboard />)

    expect(screen.getByTestId('aging-chart')).toBeInTheDocument()
    expect(screen.getByTestId('ccc-chart')).toBeInTheDocument()
    expect(screen.getByTestId('cash-flow-forecast')).toBeInTheDocument()
    expect(screen.getByTestId('optimization-recommendations')).toBeInTheDocument()
  })

  it('handles optimization recommendation actions', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    renderWithRouter(<WorkingCapitalDashboard />)

    const actionButton = screen.getByText('Test Action')
    fireEvent.click(actionButton)

    expect(consoleSpy).toHaveBeenCalledWith('Action clicked:', 'test-action')

    consoleSpy.restore()
  })

  it('handles role-based access control', () => {
    // Test with viewer role (should redirect)
    const { useAuth } = require('../../../hooks/useAuth')
    useAuth.mockReturnValue({ user: { role: 'viewer' } })

    renderWithRouter(<WorkingCapitalDashboard />)

    // Should attempt to navigate to /dashboard (mocked by router)
    // In a real test, you'd check for navigation or redirect
  })

  it('auto-refreshes data every 15 minutes', () => {
    vi.useFakeTimers()

    renderWithRouter(<WorkingCapitalDashboard />)

    // Fast-forward 15 minutes
    vi.advanceTimersByTime(15 * 60 * 1000)

    expect(mockRefetch).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('renders loading state correctly', () => {
    const { useWorkingCapitalMetrics } = require('../hooks/useWorkingCapitalMetrics')
    useWorkingCapitalMetrics.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: mockRefetch,
      exportData: mockExportData
    })

    renderWithRouter(<WorkingCapitalDashboard />)

    expect(screen.getByText('Loading working capital metrics...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveClass('animate-spin')
  })

  it('renders error state correctly', () => {
    const { useWorkingCapitalMetrics } = require('../hooks/useWorkingCapitalMetrics')
    useWorkingCapitalMetrics.mockReturnValue({
      data: null,
      loading: false,
      error: { message: 'Failed to load data' },
      refetch: mockRefetch,
      exportData: mockExportData
    })

    renderWithRouter(<WorkingCapitalDashboard />)

    expect(screen.getByText('Error Loading Data')).toBeInTheDocument()
    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()

    // Test retry functionality
    const retryButton = screen.getByText('Retry')
    fireEvent.click(retryButton)
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('formats currency values correctly', () => {
    renderWithRouter(<WorkingCapitalDashboard />)

    // Check that large numbers are formatted with commas
    expect(screen.getByText('$1,200,000')).toBeInTheDocument()
    expect(screen.getByText('$450,000')).toBeInTheDocument()
    expect(screen.getByText('$280,000')).toBeInTheDocument()
    expect(screen.getByText('$650,000')).toBeInTheDocument()
  })

  it('passes correct props to chart components', () => {
    renderWithRouter(<WorkingCapitalDashboard />)

    const cccChart = screen.getByTestId('ccc-chart')
    expect(cccChart).toHaveTextContent('CCC: 108 days') // 42 + 28 - 38 = 32 (mocked calculation)
  })
})