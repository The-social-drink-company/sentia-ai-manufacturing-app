import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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

// Mock fetch globally
global.fetch = vi.fn()

// Helper to create QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
        cacheTime: 0,
      },
    },
  })

// Helper to render with QueryClient
const renderWithQueryClient = (ui, queryClient = createTestQueryClient()) => {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('AlertWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockClear()
  })

  describe('Loading State', () => {
    it('should display loading skeleton while fetching alerts', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {})) // Never resolves

      renderWithQueryClient(<AlertWidget />)

      expect(screen.getByTestId('table-skeleton')).toBeInTheDocument()
      expect(screen.getByTestId('card-title')).toHaveTextContent('Alerts')
    })

    it('should pass correct props to TableSkeleton', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      renderWithQueryClient(<AlertWidget />)

      const skeleton = screen.getByTestId('table-skeleton')
      expect(skeleton).toHaveAttribute('data-rows', '3')
      expect(skeleton).toHaveAttribute('data-columns', '3')
    })
  })

  describe('Error State', () => {
    it('should display error message when fetch fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        expect(screen.getByText('Unable to load system alerts')).toBeInTheDocument()
      })
    })

    it('should display error message when response is not ok', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        expect(screen.getByText('Unable to load system alerts')).toBeInTheDocument()
      })
    })

    it('should still show "Alerts" title in error state', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'))

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        expect(screen.getByTestId('card-title')).toHaveTextContent('Alerts')
      })
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

    it('should display active alerts when available', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlerts,
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        expect(screen.getByText('Critical System Alert')).toBeInTheDocument()
        expect(screen.getByText('Low Inventory Warning')).toBeInTheDocument()
      })
    })

    it('should display alert descriptions', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlerts,
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        expect(screen.getByText('Database connection lost')).toBeInTheDocument()
        expect(screen.getByText('Stock levels below threshold')).toBeInTheDocument()
      })
    })

    it('should display severity badges with correct variants', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlerts,
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge')
        expect(badges[0]).toHaveAttribute('data-variant', 'destructive') // critical
        expect(badges[1]).toHaveAttribute('data-variant', 'secondary') // warning
      })
    })

    it('should display alert metadata (type, category, timestamp)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlerts,
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        expect(screen.getByText(/Type: system/i)).toBeInTheDocument()
        expect(screen.getByText(/Category: infrastructure/i)).toBeInTheDocument()
        expect(screen.getByText(/Type: inventory/i)).toBeInTheDocument()
        expect(screen.getByText(/Category: business/i)).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should display "No active alerts" when no alerts', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        expect(screen.getByText('No active alerts')).toBeInTheDocument()
      })
    })

    it('should display empty state when all alerts are dismissed', async () => {
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

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => dismissedAlerts,
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        expect(screen.getByText('No active alerts')).toBeInTheDocument()
      })
    })

    it('should display empty state when all alerts are inactive', async () => {
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

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => inactiveAlerts,
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        expect(screen.getByText('No active alerts')).toBeInTheDocument()
      })
    })
  })

  describe('Limit Prop', () => {
    it('should respect custom limit prop', async () => {
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

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manyAlerts,
      })

      renderWithQueryClient(<AlertWidget limit={3} />)

      await waitFor(() => {
        const alertElements = screen.getAllByText(/Alert \d/)
        expect(alertElements.length).toBe(3)
      })
    })

    it('should use default limit of 5 when not specified', async () => {
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

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manyAlerts,
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        const alertElements = screen.getAllByText(/Alert \d/)
        expect(alertElements.length).toBe(5)
      })
    })
  })

  describe('Severity Variant Mapping', () => {
    it('should map critical severity to destructive variant', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
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
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        const badge = screen.getByTestId('badge')
        expect(badge).toHaveAttribute('data-variant', 'destructive')
      })
    })

    it('should map high severity to destructive variant', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
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
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        const badge = screen.getByTestId('badge')
        expect(badge).toHaveAttribute('data-variant', 'destructive')
      })
    })

    it('should map medium severity to secondary variant', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
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
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        const badge = screen.getByTestId('badge')
        expect(badge).toHaveAttribute('data-variant', 'secondary')
      })
    })

    it('should map low severity to outline variant', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
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
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        const badge = screen.getByTestId('badge')
        expect(badge).toHaveAttribute('data-variant', 'outline')
      })
    })
  })

  describe('API Integration', () => {
    it('should call fetch with correct URL and options', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      renderWithQueryClient(<AlertWidget />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/system/alerts', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
      })
    })

    it('should include query key with limit parameter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const queryClient = createTestQueryClient()
      renderWithQueryClient(<AlertWidget limit={10} />, queryClient)

      await waitFor(() => {
        const queryCache = queryClient.getQueryCache()
        const queries = queryCache.getAll()
        const alertQuery = queries.find(q => q.queryKey[0] === 'system-alerts')
        expect(alertQuery?.queryKey).toEqual(['system-alerts', 10])
      })
    })
  })
})
