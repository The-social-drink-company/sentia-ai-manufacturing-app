/**
 * Forecasting Dashboard Integration Test Suite
 * Tests the complete forecasting workflow and component interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ForecastingDashboard from '../ForecastingDashboard'
import { demandForecastingService } from '../services/DemandForecastingService'

// Mock the auth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      role: 'manager',
      firstName: 'Test',
      id: 'test-user-123'
    }
  })
}))

// Mock the demand forecasting service
vi.mock('../services/DemandForecastingService', () => ({
  demandForecastingService: {
    generateDemandForecast: vi.fn()
  }
}))

// Mock recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
  Legend: () => <div data-testid="legend" />,
  Brush: () => <div data-testid="brush" />
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('ForecastingDashboard Integration _Tests', () {
  beforeEach(() {
    vi.clearAllMocks()

    // Mock successful forecasting response
    demandForecastingService.generateDemandForecast.mockResolvedValue({
      forecast: [
        {
          date: '2024-01-01',
          value: 1000,
          isForecast: false,
          confidence: 1.0
        },
        {
          date: '2024-01-02',
          value: 1100,
          isForecast: true,
          confidence: 0.9
        }
      ],
      scenarios: {
        realistic: [
          { date: '2024-01-02', value: 1100, isForecast: true }
        ],
        optimistic: [
          { date: '2024-01-02', value: 1200, isForecast: true }
        ],
        pessimistic: [
          { date: '2024-01-02', value: 1000, isForecast: true }
        ]
      },
      dataAnalysis: {
        mean: 1050,
        volatility: 0.15,
        trend: {
          type: 'increasing',
          strength: 0.8,
          significance: 'strong'
        },
        seasonality: {
          present: true,
          period: 12,
          strength: 0.6,
          significance: 'moderate'
        },
        dataQuality: {
          score: 0.9,
          validDataRatio: 0.95,
          interpolatedPoints: 2,
          consistencyScore: 0.85,
          recommendation: 'Data quality is sufficient for reliable forecasting'
        }
      },
      accuracy: {
        linearTrend: { mae: 50, mape: 5.2, rmse: 65 },
        exponentialSmoothing: { mae: 45, mape: 4.8, rmse: 58 }
      },
      aiInsights: [
        {
          type: 'trend',
          severity: 'info',
          title: 'Strong Increasing Trend Detected',
          description: 'Data shows a strong increasing trend with 80% confidence',
          recommendation: 'Consider scaling production capacity to meet growing demand'
        }
      ],
      metadata: {
        dataPoints: 24,
        forecastPeriods: 12,
        confidence: 0.85,
        generatedAt: new Date().toISOString(),
        version: '2.0'
      }
    })
  })

  afterEach(() {
    vi.restoreAllMocks()
  })

  describe('Dashboard _Rendering', () {
    it('should render main dashboard _components', () {
      renderWithRouter(<ForecastingDashboard />)

      expect(screen.getByText('Demand Forecasting')).toBeInTheDocument()
      expect(screen.getByText('AI-powered demand forecasting and time series analysis')).toBeInTheDocument()

      // Check for data source selector
      expect(screen.getByDisplayValue('Product Demand')).toBeInTheDocument()

      // Check for period selector
      expect(screen.getByDisplayValue('12 Months')).toBeInTheDocument()

      // Check for control buttons
      expect(screen.getByText('Export')).toBeInTheDocument()
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })

    it('should render data source _information', () {
      renderWithRouter(<ForecastingDashboard />)

      expect(screen.getByText(/Current Data Source:/)).toBeInTheDocument()
      expect(screen.getByText('Product Demand')).toBeInTheDocument()
      expect(screen.getByText('Historical product demand data')).toBeInTheDocument()
    })

    it('should show auto-refresh _toggle', () {
      renderWithRouter(<ForecastingDashboard />)

      const autoRefreshButton = screen.getByRole('button', { name: /auto-refresh/i })
      expect(autoRefreshButton).toBeInTheDocument()
      expect(autoRefreshButton).toHaveTextContent('Auto-refresh OFF')
    })
  })

  describe('Data Source _Selection', () {
    it('should change data source when selector is _used', async () {
      renderWithRouter(<ForecastingDashboard />)

      const dataSourceSelect = screen.getByDisplayValue('Product Demand')
      fireEvent.change(dataSourceSelect, { target: { value: 'inventory' } })

      await waitFor(() {
        expect(screen.getByText('Inventory Levels')).toBeInTheDocument()
        expect(screen.getByText('Inventory level trends')).toBeInTheDocument()
      })
    })

    it('should update data points count when data source _changes', async () {
      renderWithRouter(<ForecastingDashboard />)

      // Initial data source should show data points
      expect(screen.getByText(/data points available/)).toBeInTheDocument()

      // Change data source
      const dataSourceSelect = screen.getByDisplayValue('Product Demand')
      fireEvent.change(dataSourceSelect, { target: { value: 'revenue' } })

      await waitFor(() {
        expect(screen.getByText('Revenue')).toBeInTheDocument()
      })
    })
  })

  describe('Forecasting Period _Selection', () {
    it('should change forecast _period', async () {
      renderWithRouter(<ForecastingDashboard />)

      const periodSelect = screen.getByDisplayValue('12 Months')
      fireEvent.change(periodSelect, { target: { value: '24' } })

      await waitFor(() {
        expect(screen.getByDisplayValue('24 Months')).toBeInTheDocument()
      })
    })

    it('should update forecasting when period _changes', async () {
      renderWithRouter(<ForecastingDashboard />)

      const periodSelect = screen.getByDisplayValue('12 Months')
      fireEvent.change(periodSelect, { target: { value: '18' } })

      await waitFor(() {
        expect(demandForecastingService.generateDemandForecast).toHaveBeenCalled()
      })
    })
  })

  describe('Auto-Refresh _Functionality', () {
    it('should toggle _auto-refresh', () {
      renderWithRouter(<ForecastingDashboard />)

      const autoRefreshButton = screen.getByRole('button', { name: /auto-refresh/i })
      expect(autoRefreshButton).toHaveTextContent('Auto-refresh OFF')

      fireEvent.click(autoRefreshButton)
      expect(autoRefreshButton).toHaveTextContent('Auto-refresh ON')

      fireEvent.click(autoRefreshButton)
      expect(autoRefreshButton).toHaveTextContent('Auto-refresh OFF')
    })

    it('should show auto-refresh status in data source _info', () {
      renderWithRouter(<ForecastingDashboard />)

      const autoRefreshButton = screen.getByRole('button', { name: /auto-refresh/i })
      fireEvent.click(autoRefreshButton)

      expect(screen.getByText('Auto-refresh active')).toBeInTheDocument()
    })
  })

  describe('Export _Functionality', () {
    it('should show export dropdown menu on _hover', () {
      renderWithRouter(<ForecastingDashboard />)

      const exportButton = screen.getByText('Export')
      expect(exportButton).toBeInTheDocument()

      // The dropdown menu items should be in the DOM (though hidden)
      expect(screen.getByText('Export as JSON')).toBeInTheDocument()
      expect(screen.getByText('Export as CSV')).toBeInTheDocument()
      expect(screen.getByText('Export Report')).toBeInTheDocument()
    })

    it('should handle export button _clicks', async () {
      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = vi.fn()

      // Mock document.createElement and link.click
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink)

      renderWithRouter(<ForecastingDashboard />)

      // Wait for analysis to be generated
      await waitFor(() {
        expect(screen.getByText(/Time Series Analysis/)).toBeInTheDocument()
      })

      const exportJsonButton = screen.getByText('Export as JSON')
      fireEvent.click(exportJsonButton)

      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
    })
  })

  describe('Time Series Analysis _Integration', () {
    it('should render time series analysis _component', async () {
      renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        expect(screen.getByText(/Time Series Analysis/)).toBeInTheDocument()
      })
    })

    it('should pass correct props to time series _analysis', async () {
      renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        // Should show the data source name in the analysis title
        expect(screen.getByText(/Time Series Analysis - Product Demand/)).toBeInTheDocument()
      })
    })
  })

  describe('Forecast Chart _Integration', () {
    it('should render forecast chart when analysis is _available', async () {
      renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      })
    })

    it('should show forecast visualization title', async () {
      renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        expect(screen.getByText('Forecast Visualization')).toBeInTheDocument()
      })
    })
  })

  describe('Model Performance _Display', () {
    it('should display model performance _metrics', async () {
      renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        expect(screen.getByText('Model Performance')).toBeInTheDocument()
        expect(screen.getByText('Linear Trend')).toBeInTheDocument()
        expect(screen.getByText('Exponential Smoothing')).toBeInTheDocument()
      })
    })

    it('should show accuracy _metrics', async () {
      renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        expect(screen.getByText('MAPE:')).toBeInTheDocument()
        expect(screen.getByText('RMSE:')).toBeInTheDocument()
        expect(screen.getByText('MAE:')).toBeInTheDocument()
      })
    })
  })

  describe('Data Quality _Assessment', () {
    it('should display data quality _metrics', async () {
      renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        expect(screen.getByText('Data Quality Assessment')).toBeInTheDocument()
        expect(screen.getByText('Overall Score:')).toBeInTheDocument()
        expect(screen.getByText('90%')).toBeInTheDocument() // Based on mock data
      })
    })

    it('should show data quality _details', async () {
      renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        expect(screen.getByText('Valid Data Ratio:')).toBeInTheDocument()
        expect(screen.getByText('Interpolated Points:')).toBeInTheDocument()
        expect(screen.getByText('Consistency Score:')).toBeInTheDocument()
      })
    })

    it('should display data quality _recommendations', async () {
      renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        expect(screen.getByText('Recommendation:')).toBeInTheDocument()
        expect(screen.getByText(/Data quality is sufficient for reliable forecasting/)).toBeInTheDocument()
      })
    })
  })

  describe('Error _Handling', () {
    it('should display error message when forecasting _fails', async () {
      demandForecastingService.generateDemandForecast.mockRejectedValue(
        new Error('Forecasting service unavailable')
      )

      renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        expect(screen.getByText('Analysis Error:')).toBeInTheDocument()
        expect(screen.getByText('Forecasting service unavailable')).toBeInTheDocument()
      })
    })

    it('should show error alert with dismiss _button', async () {
      demandForecastingService.generateDemandForecast.mockRejectedValue(
        new Error('Test error')
      )

      renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        const dismissButton = screen.getByText('×')
        expect(dismissButton).toBeInTheDocument()
      })
    })

    it('should clear error when dismiss button is _clicked', async () {
      demandForecastingService.generateDemandForecast.mockRejectedValue(
        new Error('Test error')
      )

      renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        const dismissButton = screen.getByText('×')
        fireEvent.click(dismissButton)
      })

      expect(screen.queryByText('Analysis Error:')).not.toBeInTheDocument()
    })
  })

  describe('Refresh _Functionality', () {
    it('should refresh analysis when refresh button is _clicked', () {
      renderWithRouter(<ForecastingDashboard />)

      const refreshButton = screen.getByText('Refresh')
      fireEvent.click(refreshButton)

      // Should trigger a new analysis
      expect(demandForecastingService.generateDemandForecast).toHaveBeenCalled()
    })

    it('should clear existing analysis when _refreshing', () {
      renderWithRouter(<ForecastingDashboard />)

      const refreshButton = screen.getByText('Refresh')
      fireEvent.click(refreshButton)

      // Analysis should be reset
      expect(demandForecastingService.generateDemandForecast).toHaveBeenCalledTimes(1)
    })
  })

  describe('Footer _Information', () {
    it('should display footer _information', () {
      renderWithRouter(<ForecastingDashboard />)

      expect(screen.getByText(/Powered by AI Central Nervous System/)).toBeInTheDocument()
      expect(screen.getByText(/Advanced Time Series Analysis/)).toBeInTheDocument()
      expect(screen.getByText(/Real-time Forecasting/)).toBeInTheDocument()
    })
  })

  describe('Responsive _Design', () {
    it('should handle mobile _viewport', () {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      renderWithRouter(<ForecastingDashboard />)

      // Component should still render without errors
      expect(screen.getByText('Demand Forecasting')).toBeInTheDocument()
    })
  })

  describe('Role-based Access _Control', () {
    it('should redirect viewer role to _dashboard', () {
      // Mock viewer role
      vi.mocked(vi.importActual('../../../hooks/useAuth')).useAuth = vi.fn(() => ({
        user: { role: 'viewer' }
      }))

      renderWithRouter(<ForecastingDashboard />)

      // Should render Navigate component (redirect)
      expect(screen.queryByText('Demand Forecasting')).not.toBeInTheDocument()
    })
  })

  describe('Integration with Forecasting _Service', () {
    it('should call forecasting service with correct parameters', async () {
      renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        expect(demandForecastingService.generateDemandForecast).toHaveBeenCalledWith(
          expect.any(Array), // Historical data
          expect.objectContaining({
            defaultForecastPeriods: 12,
            algorithm: 'hybrid',
            aiEnabled: true
          })
        )
      })
    })

    it('should update forecast when parameters _change', async () {
      renderWithRouter(<ForecastingDashboard />)

      // Change forecast period
      const periodSelect = screen.getByDisplayValue('12 Months')
      fireEvent.change(periodSelect, { target: { value: '6' } })

      await waitFor(() {
        expect(demandForecastingService.generateDemandForecast).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            defaultForecastPeriods: 6
          })
        )
      })
    })
  })

  describe('Performance _Optimization', () {
    it('should not re-render _unnecessarily', async () {
      const { rerender } = renderWithRouter(<ForecastingDashboard />)

      await waitFor(() {
        expect(demandForecastingService.generateDemandForecast).toHaveBeenCalledTimes(1)
      })

      // Re-render with same props
      rerender(<ForecastingDashboard />)

      // Should not call service again
      expect(demandForecastingService.generateDemandForecast).toHaveBeenCalledTimes(1)
    })
  })
})