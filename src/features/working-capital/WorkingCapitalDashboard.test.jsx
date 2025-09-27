import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WorkingCapitalDashboard from './WorkingCapitalDashboard';

// Mock hooks and components
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', name: 'Test User', role: 'manager' }
  }))
}));

vi.mock('./hooks/useWorkingCapitalMetrics', () => ({
  useWorkingCapitalMetrics: vi.fn()
}));

vi.mock('./components/MetricCard', () => ({
  default: ({ title, value, format, icon, color }) => (
    <div data-testid={`metric-card-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <h3>{title}</h3>
      <span>{format === 'currency' ? `$${value?.toLocaleString()}` : value}</span>
    </div>
  )
}));

vi.mock('./components/AgingChart', () => ({
  default: ({ title }) => <div data-testid="aging-chart">{title}</div>
}));

vi.mock('./components/CashConversionCycle', () => ({
  default: ({ dso, dio, dpo }) => (
    <div data-testid="cash-conversion-cycle">
      CCC: DSO {dso} + DIO {dio} - DPO {dpo}
    </div>
  )
}));

vi.mock('./components/CashFlowForecast', () => ({
  default: ({ period }) => (
    <div data-testid="cash-flow-forecast">Forecast for {period}</div>
  )
}));

vi.mock('./components/OptimizationRecommendations', () => ({
  default: ({ recommendations }) => (
    <div data-testid="optimization-recommendations">
      {recommendations?.length || 0} recommendations
    </div>
  )
}));

import { useAuth } from '../../hooks/useAuth';
import { useWorkingCapitalMetrics } from './hooks/useWorkingCapitalMetrics';

const mockMetricsData = {
  summary: {
    workingCapital: 1500000,
    workingCapitalChange: 5.2,
    cashConversionCycle: 25,
    cccChange: -2.1,
    currentRatio: 2.1,
    currentRatioChange: 0.1,
    quickRatio: 1.8,
    quickRatioChange: 0.05
  },
  receivables: {
    total: 680000,
    dso: 35,
    overdue: 15000,
    aging: {
      current: 450000,
      days30: 125000,
      days60: 65000,
      days90: 25000,
      days90plus: 15000,
      total: 680000
    }
  },
  payables: {
    total: 543000,
    dpo: 45,
    discountsAvailable: 25000,
    aging: {
      current: 380000,
      days30: 95000,
      days60: 45000,
      days90: 15000,
      days90plus: 8000,
      total: 543000
    }
  },
  inventory: {
    total: 850000,
    dio: 28,
    turnoverRatio: 13.2
  },
  cashFlow: [
    { date: '2025-09-01', inflows: 75000, outflows: 65000, net: 10000 }
  ],
  recommendations: [
    {
      id: 1,
      title: 'Accelerate Collections',
      description: 'Implement early payment discounts',
      impact: 'High',
      potentialSaving: 125000
    }
  ],
  alerts: [
    {
      severity: 'warning',
      title: 'Action Required',
      description: 'DSO above target',
      action: 'Review collection process'
    }
  ]
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('WorkingCapitalDashboard', () {
  const mockRefetch = vi.fn();
  const mockExportData = vi.fn();

  beforeEach(() {
    vi.clearAllMocks();
    useWorkingCapitalMetrics.mockReturnValue({
      data: mockMetricsData,
      loading: false,
      error: null,
      refetch: mockRefetch,
      exportData: mockExportData
    });
  });

  describe('Access _Control', () {
    it('redirects viewer users to _dashboard', () {
      useAuth.mockReturnValue({
        user: { id: '1', name: 'Test User', role: 'viewer' }
      });

      renderWithRouter(<WorkingCapitalDashboard />);

      // The component should render Navigate to redirect
      expect(screen.queryByText('Working Capital Management')).not.toBeInTheDocument();
    });

    it('allows manager users to access the _dashboard', () {
      renderWithRouter(<WorkingCapitalDashboard />);

      expect(screen.getByText('Working Capital Management')).toBeInTheDocument();
    });
  });

  describe('Loading _States', () {
    it('displays loading state when data is being _fetched', () {
      useWorkingCapitalMetrics.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: mockRefetch,
        exportData: mockExportData
      });

      renderWithRouter(<WorkingCapitalDashboard />);

      expect(screen.getByText('Loading working capital metrics...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });
  });

  describe('Error _States', () {
    it('displays error message when data fetch _fails', () {
      const mockError = new Error('Failed to fetch data');
      useWorkingCapitalMetrics.mockReturnValue({
        data: null,
        loading: false,
        error: mockError,
        refetch: mockRefetch,
        exportData: mockExportData
      });

      renderWithRouter(<WorkingCapitalDashboard />);

      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('calls refetch when retry button is _clicked', async () {
      const mockError = new Error('Network error');
      useWorkingCapitalMetrics.mockReturnValue({
        data: null,
        loading: false,
        error: mockError,
        refetch: mockRefetch,
        exportData: mockExportData
      });

      renderWithRouter(<WorkingCapitalDashboard />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dashboard _Content', () {
    it('renders header with correct title and _description', () {
      renderWithRouter(<WorkingCapitalDashboard />);

      expect(screen.getByText('Working Capital Management')).toBeInTheDocument();
      expect(screen.getByText('Optimize cash flow and improve financial efficiency')).toBeInTheDocument();
    });

    it('displays summary metric _cards', () {
      renderWithRouter(<WorkingCapitalDashboard />);

      expect(screen.getByTestId('metric-card-working-capital')).toBeInTheDocument();
      expect(screen.getByTestId('metric-card-cash-conversion-cycle')).toBeInTheDocument();
      expect(screen.getByTestId('metric-card-current-ratio')).toBeInTheDocument();
      expect(screen.getByTestId('metric-card-quick-ratio')).toBeInTheDocument();
    });

    it('displays working capital _components', () {
      renderWithRouter(<WorkingCapitalDashboard />);

      expect(screen.getByText('Accounts Receivable')).toBeInTheDocument();
      expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();

      expect(screen.getByText('$680,000')).toBeInTheDocument(); // AR total
      expect(screen.getByText('$543,000')).toBeInTheDocument(); // AP total
      expect(screen.getByText('$850,000')).toBeInTheDocument(); // Inventory total
    });

    it('displays aging chart and cash conversion _cycle', () {
      renderWithRouter(<WorkingCapitalDashboard />);

      expect(screen.getByTestId('aging-chart')).toBeInTheDocument();
      expect(screen.getByTestId('cash-conversion-cycle')).toBeInTheDocument();
    });

    it('displays cash flow forecast and optimization _recommendations', () {
      renderWithRouter(<WorkingCapitalDashboard />);

      expect(screen.getByTestId('cash-flow-forecast')).toBeInTheDocument();
      expect(screen.getByTestId('optimization-recommendations')).toBeInTheDocument();
    });
  });

  describe('Alerts', () {
    it('displays active alerts when _present', () {
      renderWithRouter(<WorkingCapitalDashboard />);

      expect(screen.getByText('Active Alerts')).toBeInTheDocument();
      expect(screen.getByText('Action Required')).toBeInTheDocument();
      expect(screen.getByText('DSO above target')).toBeInTheDocument();
    });

    it('does not display alerts section when no _alerts', () {
      useWorkingCapitalMetrics.mockReturnValue({
        data: { ...mockMetricsData, alerts: [] },
        loading: false,
        error: null,
        refetch: mockRefetch,
        exportData: mockExportData
      });

      renderWithRouter(<WorkingCapitalDashboard />);

      expect(screen.queryByText('Active Alerts')).not.toBeInTheDocument();
    });
  });

  describe('Controls', () {
    it('renders currency selector with default _USD', () {
      renderWithRouter(<WorkingCapitalDashboard />);

      const currencySelect = screen.getByDisplayValue('USD');
      expect(currencySelect).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'GBP' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'EUR' })).toBeInTheDocument();
    });

    it('renders period selector with default _Current', () {
      renderWithRouter(<WorkingCapitalDashboard />);

      const periodSelect = screen.getByDisplayValue('Current');
      expect(periodSelect).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Month to Date' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Quarter to Date' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Year to Date' })).toBeInTheDocument();
    });

    it('calls refetch when refresh button is _clicked', async () {
      renderWithRouter(<WorkingCapitalDashboard />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Export _Functionality', () {
    it('renders export dropdown with options', () {
      renderWithRouter(<WorkingCapitalDashboard />);

      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      expect(screen.getByText('Export as Excel')).toBeInTheDocument();
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
    });

    it('calls exportData when CSV export is _clicked', async () {
      renderWithRouter(<WorkingCapitalDashboard />);

      const csvExportButton = screen.getByText('Export as CSV');
      fireEvent.click(csvExportButton);

      await waitFor(() {
        expect(mockExportData).toHaveBeenCalledWith('csv');
      });
    });

    it('calls exportData when PDF export is _clicked', async () {
      renderWithRouter(<WorkingCapitalDashboard />);

      const pdfExportButton = screen.getByText('Export as PDF');
      fireEvent.click(pdfExportButton);

      await waitFor(() {
        expect(mockExportData).toHaveBeenCalledWith('pdf');
      });
    });

    it('calls exportData when Excel export is _clicked', async () {
      renderWithRouter(<WorkingCapitalDashboard />);

      const excelExportButton = screen.getByText('Export as Excel');
      fireEvent.click(excelExportButton);

      await waitFor(() {
        expect(mockExportData).toHaveBeenCalledWith('excel');
      });
    });

    it('handles export errors _gracefully', async () {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() {});
      mockExportData.mockRejectedValueOnce(new Error('Export failed'));

      renderWithRouter(<WorkingCapitalDashboard />);

      const csvExportButton = screen.getByText('Export as CSV');
      fireEvent.click(csvExportButton);

      await waitFor(() {
        expect(consoleError).toHaveBeenCalledWith('Export failed:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Responsive _Behavior', () {
    it('renders correctly on different screen _sizes', () {
      renderWithRouter(<WorkingCapitalDashboard />);

      // Test that grid classes are applied correctly
      const gridContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Auto-refresh', () {
    beforeEach(() {
      vi.useFakeTimers();
    });

    afterEach(() {
      vi.useRealTimers();
    });

    it('sets up auto-refresh _interval', () {
      renderWithRouter(<WorkingCapitalDashboard />);

      // Fast forward 15 minutes
      vi.advanceTimersByTime(15 * 60 * 1000);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('clears interval on _unmount', () {
      const { unmount } = renderWithRouter(<WorkingCapitalDashboard />);

      unmount();

      // Fast forward 15 minutes after unmount
      vi.advanceTimersByTime(15 * 60 * 1000);

      // Should not call refetch after unmount
      expect(mockRefetch).not.toHaveBeenCalled();
    });
  });
});