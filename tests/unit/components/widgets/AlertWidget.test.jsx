import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AlertWidget from '../../../../src/components/widgets/AlertWidget'

// Mock Card components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>,
  CardContent: ({ children, className }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}))

vi.mock('@/components/ui/skeletons', () => ({
  TableSkeleton: ({ rows, columns }) => (
    <div data-testid="table-skeleton" data-rows={rows} data-columns={columns}>
      Loading...
    </div>
  ),
}))

// Mock TanStack Query
let mockUseQueryReturnValue = {
  data: [],
  isLoading: false,
  error: null,
}

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => mockUseQueryReturnValue),
}))

describe('AlertWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to default state
    mockUseQueryReturnValue = {
      data: [],
      isLoading: false,
      error: null,
    }
  })

  describe('Loading State', () => {
    it('should display loading skeleton while fetching alerts', () => {
      mockUseQueryReturnValue = {
        data: undefined,
        isLoading: true,
        error: null,
      }

      render(<AlertWidget />)

      expect(screen.getByTestId('table-skeleton')).toBeInTheDocument()
      expect(screen.getByTestId('card-title')).toHaveTextContent('Alerts')
    })

    it('should pass correct props to TableSkeleton', () => {
      mockUseQueryReturnValue = {
        data: undefined,
        isLoading: true,
        error: null,
      }

      render(<AlertWidget />)

      const skeleton = screen.getByTestId('table-skeleton')
      expect(skeleton).toHaveAttribute('data-rows', '3')
      expect(skeleton).toHaveAttribute('data-columns', '3')
    })
  })

  describe('Error State', () => {
    it('should display error message when query fails', () => {
      mockUseQueryReturnValue = {
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      }

      render(<AlertWidget />)

      expect(screen.getByText('Unable to load system alerts')).toBeInTheDocument()
    })

    it('should still show "Alerts" title in error state', () => {
      mockUseQueryReturnValue = {
        data: undefined,
        isLoading: false,
        error: new Error('Failed'),
      }

      render(<AlertWidget />)

      expect(screen.getByTestId('card-title')).toHaveTextContent('Alerts')
    })
  })

  describe('Success State - Active Alerts', () => {
    const mockAlerts = [
      {
        id: 'alert-1',
        title: 'Critical System Alert',
        description: 'Database connection lost',
        severity: 'critical',
        type: 'system',
        category: 'infrastructure',
        isActive: true,
        isDismissed: false,
        createdAt: '2025-10-20T12:00:00Z',
      },
      {
        id: 'alert-2',
        title: 'Low Inventory Warning',
        description: 'Stock levels below threshold',
        severity: 'warning',
        type: 'inventory',
        category: 'business',
        isActive: true,
        isDismissed: false,
        createdAt: '2025-10-20T11:30:00Z',
      },
    ]

    it('should display active alerts when available', () => {
      mockUseQueryReturnValue = {
        data: mockAlerts,
        isLoading: false,
        error: null,
      }

      render(<AlertWidget />)

      expect(screen.getByText('Critical System Alert')).toBeInTheDocument()
      expect(screen.getByText('Low Inventory Warning')).toBeInTheDocument()
    })

    it('should display alert descriptions', () => {
      mockUseQueryReturnValue = {
        data: mockAlerts,
        isLoading: false,
        error: null,
      }

      render(<AlertWidget />)

      expect(screen.getByText('Database connection lost')).toBeInTheDocument()
      expect(screen.getByText('Stock levels below threshold')).toBeInTheDocument()
    })

    it('should display severity badges with correct variants', () => {
      mockUseQueryReturnValue = {
        data: mockAlerts,
        isLoading: false,
        error: null,
      }

      render(<AlertWidget />)

      const badges = screen.getAllByTestId('badge')
      expect(badges[0]).toHaveAttribute('data-variant', 'destructive') // critical
      expect(badges[1]).toHaveAttribute('data-variant', 'secondary') // warning
    })

    it('should display alert metadata (type, category)', () => {
      mockUseQueryReturnValue = {
        data: mockAlerts,
        isLoading: false,
        error: null,
      }

      render(<AlertWidget />)

      expect(screen.getByText(/Type: system/i)).toBeInTheDocument()
      expect(screen.getByText(/Category: infrastructure/i)).toBeInTheDocument()
      expect(screen.getByText(/Type: inventory/i)).toBeInTheDocument()
      expect(screen.getByText(/Category: business/i)).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should display "No active alerts" when no alerts', () => {
      mockUseQueryReturnValue = {
        data: [],
        isLoading: false,
        error: null,
      }

      render(<AlertWidget />)

      expect(screen.getByText('No active alerts')).toBeInTheDocument()
    })

    it('should display empty state when all alerts are dismissed', () => {
      const dismissedAlerts = [
        {
          id: 'alert-1',
          title: 'Old Alert',
          severity: 'info',
          type: 'system',
          category: 'test',
          isActive: true,
          isDismissed: true,
          createdAt: '2025-10-19T12:00:00Z',
        },
      ]

      mockUseQueryReturnValue = {
        data: dismissedAlerts,
        isLoading: false,
        error: null,
      }

      render(<AlertWidget />)

      expect(screen.getByText('No active alerts')).toBeInTheDocument()
    })

    it('should display empty state when all alerts are inactive', () => {
      const inactiveAlerts = [
        {
          id: 'alert-1',
          title: 'Old Alert',
          severity: 'info',
          type: 'system',
          category: 'test',
          isActive: false,
          isDismissed: false,
          createdAt: '2025-10-19T12:00:00Z',
        },
      ]

      mockUseQueryReturnValue = {
        data: inactiveAlerts,
        isLoading: false,
        error: null,
      }

      render(<AlertWidget />)

      expect(screen.getByText('No active alerts')).toBeInTheDocument()
    })
  })

  describe('Limit Prop', () => {
    it('should respect custom limit prop', () => {
      const manyAlerts = Array.from({ length: 10 }, (_, i) => ({
        id: `alert-${i}`,
        title: `Alert ${i}`,
        description: `Description ${i}`,
        severity: 'info',
        type: 'system',
        category: 'test',
        isActive: true,
        isDismissed: false,
        createdAt: '2025-10-20T12:00:00Z',
      }))

      mockUseQueryReturnValue = {
        data: manyAlerts,
        isLoading: false,
        error: null,
      }

      render(<AlertWidget limit={3} />)

      const alertElements = screen.getAllByText(/Alert \d/)
      expect(alertElements.length).toBe(3)
    })

    it('should use default limit of 5 when not specified', () => {
      const manyAlerts = Array.from({ length: 10 }, (_, i) => ({
        id: `alert-${i}`,
        title: `Alert ${i}`,
        description: `Description ${i}`,
        severity: 'info',
        type: 'system',
        category: 'test',
        isActive: true,
        isDismissed: false,
        createdAt: '2025-10-20T12:00:00Z',
      }))

      mockUseQueryReturnValue = {
        data: manyAlerts,
        isLoading: false,
        error: null,
      }

      render(<AlertWidget />)

      const alertElements = screen.getAllByText(/Alert \d/)
      expect(alertElements.length).toBe(5)
    })
  })

  describe('Severity Variant Mapping', () => {
    it('should map critical severity to destructive variant', () => {
      mockUseQueryReturnValue = {
        data: [
          {
            id: 'alert-1',
            title: 'Test',
            severity: 'critical',
            type: 'system',
            category: 'test',
            isActive: true,
            isDismissed: false,
            createdAt: '2025-10-20T12:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      }

      render(<AlertWidget />)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'destructive')
    })

    it('should map high severity to destructive variant', () => {
      mockUseQueryReturnValue = {
        data: [
          {
            id: 'alert-1',
            title: 'Test',
            severity: 'high',
            type: 'system',
            category: 'test',
            isActive: true,
            isDismissed: false,
            createdAt: '2025-10-20T12:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      }

      render(<AlertWidget />)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'destructive')
    })

    it('should map medium severity to secondary variant', () => {
      mockUseQueryReturnValue = {
        data: [
          {
            id: 'alert-1',
            title: 'Test',
            severity: 'medium',
            type: 'system',
            category: 'test',
            isActive: true,
            isDismissed: false,
            createdAt: '2025-10-20T12:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      }

      render(<AlertWidget />)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'secondary')
    })

    it('should map low severity to outline variant', () => {
      mockUseQueryReturnValue = {
        data: [
          {
            id: 'alert-1',
            title: 'Test',
            severity: 'low',
            type: 'system',
            category: 'test',
            isActive: true,
            isDismissed: false,
            createdAt: '2025-10-20T12:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      }

      render(<AlertWidget />)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'outline')
    })
  })
})
