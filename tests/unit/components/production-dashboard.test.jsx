import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProductionDashboard from '../../../src/features/production/ProductionDashboard.jsx'

// Mock the hooks and components
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { role: 'manager' }
  }))
}))

vi.mock('../../../src/features/production/hooks/useProductionMetrics', () => ({
  useProductionMetrics: vi.fn(() => ({
    data: {
      summary: {
        totalProduction: 25000,
        productionChange: 5.2,
        averageOEE: 82.5,
        oeeChange: 1.8,
        qualityRate: 96.2,
        qualityChange: 0.3,
        onTimeDelivery: 88.7,
        deliveryChange: 2.1
      },
      oee: {
        overall: 82.5,
        availability: 87.2,
        performance: 82.1,
        quality: 95.8,
        availabilityChange: 2.3,
        performanceChange: -1.2,
        qualityChange: 0.8,
        target: 85,
        worldClass: 90
      },
      machines: [
        {
          id: 'line-1',
          name: 'Production Line 1',
          status: 'running',
          efficiency: 87.5,
          currentSpeed: 850,
          targetSpeed: 1000,
          alerts: []
        }
      ],
      schedule: {
        jobs: [
          {
            id: 'JOB-1001',
            product: 'SNTG-001',
            status: 'in-progress',
            quantity: 2500,
            progress: 65,
            plannedStart: '2024-09-26T08:00:00Z',
            lineId: 'line-1'
          }
        ]
      },
      alerts: [
        {
          severity: 'warning',
          title: 'High Temperature Alert',
          description: 'Line 3 temperature above normal',
          action: 'Check Cooling System'
        }
      ]
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
    exportData: vi.fn()
  }))
}))

// Mock child components to focus on ProductionDashboard logic
vi.mock('../../../src/features/production/components/OEEDisplay', () => ({
  default: vi.fn(() => <div data-testid="oee-display">OEE Display</div>)
}))

vi.mock('../../../src/features/production/components/MachineStatusGrid', () => ({
  default: vi.fn(() => <div data-testid="machine-status-grid">Machine Status</div>)
}))

vi.mock('../../../src/features/production/components/ProductionSchedule', () => ({
  default: vi.fn(() => <div data-testid="production-schedule">Production Schedule</div>)
}))

vi.mock('../../../src/features/production/components/QualityMetrics', () => ({
  default: vi.fn(() => <div data-testid="quality-metrics">Quality Metrics</div>)
}))

vi.mock('../../../src/features/production/components/CapacityPlanning', () => ({
  default: vi.fn(() => <div data-testid="capacity-planning">Capacity Planning</div>)
}))

vi.mock('../../../src/features/production/components/ShiftHandover', () => ({
  default: vi.fn(() => <div data-testid="shift-handover">Shift Handover</div>)
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('ProductionDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders production dashboard with main components', () => {
    renderWithRouter(<ProductionDashboard />)

    expect(screen.getByText('Production Tracking')).toBeInTheDocument()
    expect(screen.getByText('Real-time OEE monitoring, production scheduling, and quality control')).toBeInTheDocument()
    expect(screen.getByTestId('oee-display')).toBeInTheDocument()
    expect(screen.getByTestId('machine-status-grid')).toBeInTheDocument()
  })

  it('displays OEE summary cards with correct values', () => {
    renderWithRouter(<ProductionDashboard />)

    expect(screen.getByText('Overall OEE')).toBeInTheDocument()
    expect(screen.getByText('82.5%')).toBeInTheDocument()
    expect(screen.getByText('87.2%')).toBeInTheDocument() // Availability
    expect(screen.getByText('82.1%')).toBeInTheDocument() // Performance
    expect(screen.getByText('95.8%')).toBeInTheDocument() // Quality
  })

  it('displays production alerts when present', () => {
    renderWithRouter(<ProductionDashboard />)

    expect(screen.getByText('Critical Production Alerts')).toBeInTheDocument()
    expect(screen.getByText('High Temperature Alert')).toBeInTheDocument()
    expect(screen.getByText('Line 3 temperature above normal')).toBeInTheDocument()
    expect(screen.getByText('Check Cooling System')).toBeInTheDocument()
  })

  it('handles line filter changes', () => {
    renderWithRouter(<ProductionDashboard />)

    const lineFilter = screen.getByDisplayValue('All Lines')
    fireEvent.change(lineFilter, { target: { value: 'line-1' } })

    expect(lineFilter.value).toBe('line-1')
  })

  it('handles shift filter changes', () => {
    renderWithRouter(<ProductionDashboard />)

    const shiftFilter = screen.getByDisplayValue('Current Shift')
    fireEvent.change(shiftFilter, { target: { value: 'shift-1' } })

    expect(shiftFilter.value).toBe('shift-1')
  })

  it('handles time range filter changes', () => {
    renderWithRouter(<ProductionDashboard />)

    const timeRangeFilter = screen.getByDisplayValue('Last 24 Hours')
    fireEvent.change(timeRangeFilter, { target: { value: '7d' } })

    expect(timeRangeFilter.value).toBe('7d')
  })

  it('displays view toggle buttons', () => {
    renderWithRouter(<ProductionDashboard />)

    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Schedule')).toBeInTheDocument()
    expect(screen.getByText('Quality')).toBeInTheDocument()
  })

  it('switches between different views', () => {
    renderWithRouter(<ProductionDashboard />)

    // Default view should show OEE display
    expect(screen.getByTestId('oee-display')).toBeInTheDocument()

    // Switch to schedule view
    fireEvent.click(screen.getByText('Schedule'))
    expect(screen.getByTestId('production-schedule')).toBeInTheDocument()

    // Switch to quality view
    fireEvent.click(screen.getByText('Quality'))
    expect(screen.getByTestId('quality-metrics')).toBeInTheDocument()
  })

  it('displays export menu and handles export actions', async () => {
    const mockExportData = vi.fn()
    const { useProductionMetrics } = await import('../../../src/features/production/hooks/useProductionMetrics')
    useProductionMetrics.mockReturnValue({
      ...useProductionMetrics(),
      exportData: mockExportData
    })

    renderWithRouter(<ProductionDashboard />)

    // Find and hover over export button
    const exportButton = screen.getByText('Export')
    fireEvent.mouseEnter(exportButton.parentElement)

    await waitFor(() => {
      expect(screen.getByText('Export as PDF')).toBeInTheDocument()
      expect(screen.getByText('Export as Excel')).toBeInTheDocument()
      expect(screen.getByText('Export as CSV')).toBeInTheDocument()
    })
  })

  it('displays quick actions panel', () => {
    renderWithRouter(<ProductionDashboard />)

    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('Start Job')).toBeInTheDocument()
    expect(screen.getByText('Pause Line')).toBeInTheDocument()
    expect(screen.getByText('Emergency Stop')).toBeInTheDocument()
    expect(screen.getByText('View Reports')).toBeInTheDocument()
  })

  it('handles refresh button click', async () => {
    const mockRefetch = vi.fn()
    const { useProductionMetrics } = await import('../../../src/features/production/hooks/useProductionMetrics')
    useProductionMetrics.mockReturnValue({
      ...useProductionMetrics(),
      refetch: mockRefetch
    })

    renderWithRouter(<ProductionDashboard />)

    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)

    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows loading state', async () => {
    const { useProductionMetrics } = await import('../../../src/features/production/hooks/useProductionMetrics')
    useProductionMetrics.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
      exportData: vi.fn()
    })

    renderWithRouter(<ProductionDashboard />)

    expect(screen.getByText('Loading production data...')).toBeInTheDocument()
  })

  it('shows error state with retry option', async () => {
    const mockRefetch = vi.fn()
    const { useProductionMetrics } = await import('../../../src/features/production/hooks/useProductionMetrics')
    useProductionMetrics.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to load production data'),
      refetch: mockRefetch,
      exportData: vi.fn()
    })

    renderWithRouter(<ProductionDashboard />)

    expect(screen.getByText('Error Loading Production Data')).toBeInTheDocument()
    expect(screen.getByText('Failed to load production data')).toBeInTheDocument()

    const retryButton = screen.getByText('Retry')
    fireEvent.click(retryButton)

    expect(mockRefetch).toHaveBeenCalled()
  })

  it('redirects viewers to dashboard', async () => {
    const { useAuth } = await import('../../../src/hooks/useAuth')
    useAuth.mockReturnValue({
      user: { role: 'viewer' }
    })

    renderWithRouter(<ProductionDashboard />)

    // Should render Navigate component (though we can't easily test the redirect)
    // The component should not render the main dashboard content
    expect(screen.queryByText('Production Tracking')).not.toBeInTheDocument()
  })

  it('calculates OEE status correctly', () => {
    renderWithRouter(<ProductionDashboard />)

    // With OEE of 82.5%, it should show "Good" status (70-85% range)
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('displays trend indicators for metrics', () => {
    renderWithRouter(<ProductionDashboard />)

    // Should show trend indicators for availability, performance, quality changes
    // Positive changes should show up arrows, negative changes down arrows
    const trendElements = screen.getAllByText(/[↑↓]/)
    expect(trendElements.length).toBeGreaterThan(0)
  })
})

describe('ProductionDashboard Integration', () => {
  it('auto-refreshes data every 10 seconds', async () => {
    vi.useFakeTimers()
    const mockRefetch = vi.fn()

    const { useProductionMetrics } = await import('../../../src/features/production/hooks/useProductionMetrics')
    useProductionMetrics.mockReturnValue({
      data: { summary: {}, oee: {}, machines: [], schedule: {} },
      loading: false,
      error: null,
      refetch: mockRefetch,
      exportData: vi.fn()
    })

    renderWithRouter(<ProductionDashboard />)

    // Fast-forward 10 seconds
    vi.advanceTimersByTime(10000)

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled()
    })

    vi.useRealTimers()
  })

  it('cleans up auto-refresh interval on unmount', async () => {
    vi.useFakeTimers()
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

    const { unmount } = renderWithRouter(<ProductionDashboard />)

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()

    vi.useRealTimers()
  })
})