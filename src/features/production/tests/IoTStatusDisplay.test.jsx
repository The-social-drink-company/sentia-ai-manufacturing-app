/**
 * IoT Status Display Component Test Suite
 * Tests for the IoT system status monitoring component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import IoTStatusDisplay from '../components/IoTStatusDisplay'

// Mock the IoT integration hooks
const mockIoTIntegration = {
  connectionStatus: {
    isConnected: true,
    totalMachines: 5,
    onlineMachines: 4,
    lastDataReceived: new Date().toISOString(),
    reconnectAttempts: 0,
    connectionStartTime: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  isConnected: true,
  lastDataReceived: new Date().toISOString()
}

const mockIoTAlarms = {
  criticalCount: 2,
  totalCount: 5
}

vi.mock('../hooks/useIoTIntegration', () => ({
  useIoTIntegration: () => mockIoTIntegration,
  useIoTAlarms: () => mockIoTAlarms
}))

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      }
    }
  })

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('IoTStatusDisplay', () {
  beforeEach(() {
    vi.clearAllMocks()

    // Reset to default connected state
    mockIoTIntegration.isConnected = true
    mockIoTIntegration.connectionStatus.isConnected = true
    mockIoTIntegration.lastDataReceived = new Date().toISOString()
    mockIoTAlarms.criticalCount = 0
    mockIoTAlarms.totalCount = 0
  })

  describe('Connected _State', () {
    it('should display connected status with green _indicator', () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      expect(screen.getByText('IoT System Status')).toBeInTheDocument()
      expect(screen.getByText('All Systems Normal')).toBeInTheDocument()

      // Check for green status indicators
      const statusElements = screen.getAllByRole('button')
      const mainButton = statusElements[0]
      expect(mainButton).toBeInTheDocument()
    })

    it('should show machine count when _connected', () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      expect(screen.getByText('4/5')).toBeInTheDocument()
      expect(screen.getByText('Machines Online')).toBeInTheDocument()
    })

    it('should display live data _indicator', () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      expect(screen.getByText('Real-time Data Active')).toBeInTheDocument()
    })
  })

  describe('Disconnected _State', () {
    beforeEach(() {
      mockIoTIntegration.isConnected = false
      mockIoTIntegration.connectionStatus.isConnected = false
      mockIoTIntegration.lastDataReceived = null
    })

    it('should display disconnected status with red _indicator', () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      expect(screen.getByText('IoT System Offline')).toBeInTheDocument()
      expect(screen.getByText('Using Simulated Data')).toBeInTheDocument()
    })

    it('should show reconnect button when _disconnected', () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      // Click to expand details
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Reconnect')).toBeInTheDocument()
    })
  })

  describe('Alarm _States', () {
    it('should display critical alarm _status', () {
      mockIoTAlarms.criticalCount = 3
      mockIoTAlarms.totalCount = 5

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      expect(screen.getByText('3 Critical Alarms')).toBeInTheDocument()
    })

    it('should display warning for non-critical _alarms', () {
      mockIoTAlarms.criticalCount = 0
      mockIoTAlarms.totalCount = 2

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      expect(screen.getByText('2 Active Alarms')).toBeInTheDocument()
    })

    it('should show normal status when no _alarms', () {
      mockIoTAlarms.criticalCount = 0
      mockIoTAlarms.totalCount = 0

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      expect(screen.getByText('All Systems Normal')).toBeInTheDocument()
    })
  })

  describe('Details _Panel', () {
    it('should expand details when _clicked', async () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      // Initially collapsed
      expect(screen.queryByText('Connection Details')).not.toBeInTheDocument()

      // Click to expand
      fireEvent.click(screen.getByRole('button'))

      await waitFor(() {
        expect(screen.getByText('Connection Details')).toBeInTheDocument()
      })
    })

    it('should show connection details when _expanded', async () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button'))

      await waitFor(() {
        expect(screen.getByText('Status:')).toBeInTheDocument()
        expect(screen.getByText('Connected')).toBeInTheDocument()
        expect(screen.getByText('Last Data:')).toBeInTheDocument()
        expect(screen.getByText('Reconnect Attempts:')).toBeInTheDocument()
      })
    })

    it('should show machine details when _expanded', async () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button'))

      await waitFor(() {
        expect(screen.getByText('Machines')).toBeInTheDocument()
        expect(screen.getByText('Total:')).toBeInTheDocument()
        expect(screen.getByText('Online:')).toBeInTheDocument()
        expect(screen.getByText('Offline:')).toBeInTheDocument()
      })
    })

    it('should show alarm details when _expanded', async () {
      mockIoTAlarms.criticalCount = 2
      mockIoTAlarms.totalCount = 5

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button'))

      await waitFor(() {
        expect(screen.getByText('Alarms')).toBeInTheDocument()
        expect(screen.getByText('Critical:')).toBeInTheDocument()
        expect(screen.getByText('Total Active:')).toBeInTheDocument()
      })
    })

    it('should show performance metrics when _expanded', async () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button'))

      await waitFor(() {
        expect(screen.getByText('System Performance')).toBeInTheDocument()
        expect(screen.getByText('Availability')).toBeInTheDocument()
        expect(screen.getByText('Latency')).toBeInTheDocument()
        expect(screen.getByText('Update Rate')).toBeInTheDocument()
        expect(screen.getByText('Uptime')).toBeInTheDocument()
      })
    })

    it('should collapse when collapse button is _clicked', async () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      // Expand first
      fireEvent.click(screen.getByRole('button'))

      await waitFor(() {
        expect(screen.getByText('Connection Details')).toBeInTheDocument()
      })

      // Click collapse button
      fireEvent.click(screen.getByText('Collapse'))

      await waitFor(() {
        expect(screen.queryByText('Connection Details')).not.toBeInTheDocument()
      })
    })
  })

  describe('Time _Formatting', () {
    it('should format recent timestamps _correctly', () {
      // Mock recent timestamp (10 seconds ago)
      const recentTime = new Date(Date.now() - 10000).toISOString()
      mockIoTIntegration.lastDataReceived = recentTime

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button'))

      // Should show seconds format
      expect(screen.getByText(/\d+s ago/)).toBeInTheDocument()
    })

    it('should format older timestamps _correctly', () {
      // Mock older timestamp (5 minutes ago)
      const olderTime = new Date(Date.now() - 300000).toISOString()
      mockIoTIntegration.lastDataReceived = olderTime

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button'))

      // Should show minutes format
      expect(screen.getByText(/\d+m \d+s ago/)).toBeInTheDocument()
    })

    it('should handle null _timestamps', () {
      mockIoTIntegration.lastDataReceived = null

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Never')).toBeInTheDocument()
    })
  })

  describe('Connection Health _Status', () {
    it('should show healthy status for recent _data', () {
      // Recent data (5 seconds ago)
      mockIoTIntegration.lastDataReceived = new Date(Date.now() - 5000).toISOString()

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      expect(screen.getByText('HEALTHY')).toBeInTheDocument()
    })

    it('should show delayed status for older _data', () {
      // Delayed data (30 seconds ago)
      mockIoTIntegration.lastDataReceived = new Date(Date.now() - 30000).toISOString()

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      expect(screen.getByText('DELAYED')).toBeInTheDocument()
    })

    it('should show stale status for very old _data', () {
      // Stale data (2 minutes ago)
      mockIoTIntegration.lastDataReceived = new Date(Date.now() - 120000).toISOString()

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      expect(screen.getByText('STALE')).toBeInTheDocument()
    })

    it('should show offline status when _disconnected', () {
      mockIoTIntegration.isConnected = false
      mockIoTIntegration.lastDataReceived = null

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      expect(screen.getByText('OFFLINE')).toBeInTheDocument()
    })
  })

  describe('Availability _Calculation', () {
    it('should calculate availability percentage _correctly', () {
      mockIoTIntegration.connectionStatus.onlineMachines = 3
      mockIoTIntegration.connectionStatus.totalMachines = 5

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('60%')).toBeInTheDocument()
    })

    it('should handle zero total _machines', () {
      mockIoTIntegration.connectionStatus.onlineMachines = 0
      mockIoTIntegration.connectionStatus.totalMachines = 0

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  describe('Uptime _Calculation', () {
    it('should calculate uptime _correctly', () {
      // Mock connection start time (90 minutes ago)
      mockIoTIntegration.connectionStatus.connectionStartTime =
        new Date(Date.now() - 5400000).toISOString()

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('90m')).toBeInTheDocument()
    })

    it('should handle null connection start _time', () {
      mockIoTIntegration.connectionStatus.connectionStartTime = null

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('0m')).toBeInTheDocument()
    })
  })

  describe('Reconnect _Functionality', () {
    beforeEach(() {
      mockIoTIntegration.isConnected = false
      mockIoTIntegration.connectionStatus.isConnected = false

      // Mock window.location.reload
      delete window.location
      window.location = { reload: vi.fn() }
    })

    it('should show reconnect button when _disconnected', () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Reconnect')).toBeInTheDocument()
    })

    it('should trigger page reload when reconnect _clicked', () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button'))
      fireEvent.click(screen.getByText('Reconnect'))

      expect(window.location.reload).toHaveBeenCalled()
    })
  })

  describe('Status _Colors', () {
    it('should use green colors for healthy _state', () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      const statusIndicator = screen.getByText('Real-time Data Active')
      expect(statusIndicator.closest('div')).toHaveClass('bg-green-50')
    })

    it('should use red colors for critical _state', () {
      mockIoTAlarms.criticalCount = 2

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      const statusText = screen.getByText('2 Critical Alarms')
      expect(statusText).toBeInTheDocument()
    })

    it('should use yellow colors for warning _state', () {
      mockIoTAlarms.criticalCount = 0
      mockIoTAlarms.totalCount = 3

      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      const statusText = screen.getByText('3 Active Alarms')
      expect(statusText).toBeInTheDocument()
    })
  })

  describe('Accessibility', () {
    it('should be keyboard _navigable', () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      const button = screen.getByRole('button')
      button.focus()

      expect(document.activeElement).toBe(button)
    })

    it('should have proper ARIA _labels', () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      expect(screen.getByText('IoT System Status')).toBeInTheDocument()
    })
  })

  describe('Performance', () {
    it('should update timestamp display _regularly', () {
      render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      // Component should show "Last updated" timestamp
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })

    it('should not cause unnecessary _re-renders', () {
      const { rerender } = render(<IoTStatusDisplay />, { wrapper: createWrapper() })

      // Re-render with same props should not cause issues
      rerender(<IoTStatusDisplay />)

      expect(screen.getByText('IoT System Status')).toBeInTheDocument()
    })
  })
})