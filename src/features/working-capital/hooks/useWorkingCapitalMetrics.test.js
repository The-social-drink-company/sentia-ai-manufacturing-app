import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWorkingCapitalMetrics } from './useWorkingCapitalMetrics';
import * as workingCapitalService from '../services/workingCapitalService';

// Mock the service
vi.mock('../services/workingCapitalService');

describe('useWorkingCapitalMetrics', () => {
  const mockMetricsData = {
    cashPosition: 1500000,
    cashTrend: 5.2,
    dso: 35,
    dsoTrend: -2.1,
    dpo: 45,
    dpoTrend: 3.5,
    dio: 28,
    cashConversionCycle: 18,
    cccTrend: -4.2,
    arAging: {
      current: 450000,
      '1-30': 125000,
      '31-60': 65000,
      '61-90': 25000,
      '90+': 15000,
      total: 680000
    },
    apAging: {
      current: 380000,
      '1-30': 95000,
      '31-60': 45000,
      '61-90': 15000,
      '90+': 8000,
      total: 543000
    },
    inventory: {
      totalValue: 850000,
      daysOnHand: 28,
      turnoverRatio: 13.2
    },
    cashFlow: [
      { date: '2025-09-01', inflows: 75000, outflows: 65000, net: 10000 },
      { date: '2025-09-02', inflows: 80000, outflows: 70000, net: 10000 }
    ],
    alerts: [
      {
        severity: 'warning',
        message: 'DSO above target',
        action: 'Review collection process'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with loading state', () => {
    vi.mocked(workingCapitalService.fetchWorkingCapitalMetrics).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading
    );

    const { result } = renderHook(() => useWorkingCapitalMetrics());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('fetches and transforms metrics data successfully', async () => {
    vi.mocked(workingCapitalService.fetchWorkingCapitalMetrics).mockResolvedValueOnce(mockMetricsData);

    const { result } = renderHook(() => useWorkingCapitalMetrics('month'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data.summary).toEqual({
      workingCapital: mockMetricsData.cashPosition,
      workingCapitalChange: mockMetricsData.cashTrend,
      cashConversionCycle: mockMetricsData.cashConversionCycle,
      cccChange: mockMetricsData.cccTrend,
      currentRatio: 2.1,
      currentRatioChange: 0.1,
      quickRatio: 1.8,
      quickRatioChange: 0.05
    });

    expect(result.current.data.receivables).toEqual({
      total: mockMetricsData.arAging.total,
      dso: mockMetricsData.dso,
      overdue: mockMetricsData.arAging['90+'],
      aging: {
        current: mockMetricsData.arAging.current,
        days30: mockMetricsData.arAging['1-30'],
        days60: mockMetricsData.arAging['31-60'],
        days90: mockMetricsData.arAging['61-90'],
        days90plus: mockMetricsData.arAging['90+'],
        total: mockMetricsData.arAging.total
      }
    });

    expect(result.current.data.payables).toEqual({
      total: mockMetricsData.apAging.total,
      dpo: mockMetricsData.dpo,
      discountsAvailable: 25000,
      aging: {
        current: mockMetricsData.apAging.current,
        days30: mockMetricsData.apAging['1-30'],
        days60: mockMetricsData.apAging['31-60'],
        days90: mockMetricsData.apAging['61-90'],
        days90plus: mockMetricsData.apAging['90+'],
        total: mockMetricsData.apAging.total
      }
    });

    expect(result.current.data.inventory).toEqual({
      total: mockMetricsData.inventory.totalValue,
      dio: mockMetricsData.inventory.daysOnHand,
      turnoverRatio: mockMetricsData.inventory.turnoverRatio
    });

    expect(result.current.error).toBe(null);
  });

  it('handles fetch errors gracefully', async () => {
    const mockError = new Error('Network error');
    vi.mocked(workingCapitalService.fetchWorkingCapitalMetrics).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useWorkingCapitalMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.data).toBe(null);
  });

  it('transforms alerts correctly', async () => {
    vi.mocked(workingCapitalService.fetchWorkingCapitalMetrics).mockResolvedValueOnce(mockMetricsData);

    const { result } = renderHook(() => useWorkingCapitalMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.alerts).toHaveLength(1);
    expect(result.current.data.alerts[0]).toEqual({
      severity: 'warning',
      title: 'Action Required',
      description: 'DSO above target',
      action: 'Review collection process'
    });
  });

  it('provides refresh functionality', async () => {
    vi.mocked(workingCapitalService.fetchWorkingCapitalMetrics).mockResolvedValueOnce(mockMetricsData);

    const { result } = renderHook(() => useWorkingCapitalMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear the mock and set up for refetch
    vi.clearAllMocks();
    const updatedData = { ...mockMetricsData, cashPosition: 1600000 };
    vi.mocked(workingCapitalService.fetchWorkingCapitalMetrics).mockResolvedValueOnce(updatedData);

    // Trigger refetch
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.data.summary.workingCapital).toBe(1600000);
    });

    expect(workingCapitalService.fetchWorkingCapitalMetrics).toHaveBeenCalledTimes(1);
  });

  it('handles export data functionality', async () => {
    vi.mocked(workingCapitalService.fetchWorkingCapitalMetrics).mockResolvedValueOnce(mockMetricsData);
    vi.mocked(workingCapitalService.exportWorkingCapitalData).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useWorkingCapitalMetrics('month'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.exportData('csv');

    expect(workingCapitalService.exportWorkingCapitalData).toHaveBeenCalledWith('csv', 'month');
  });

  it('handles export errors', async () => {
    vi.mocked(workingCapitalService.fetchWorkingCapitalMetrics).mockResolvedValueOnce(mockMetricsData);
    const exportError = new Error('Export failed');
    vi.mocked(workingCapitalService.exportWorkingCapitalData).mockRejectedValueOnce(exportError);

    const { result } = renderHook(() => useWorkingCapitalMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.exportData('pdf')).rejects.toThrow('Export failed');
  });

  it('updates lastUpdated timestamp on successful fetch', async () => {
    const beforeFetch = new Date();
    vi.mocked(workingCapitalService.fetchWorkingCapitalMetrics).mockResolvedValueOnce(mockMetricsData);

    const { result } = renderHook(() => useWorkingCapitalMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lastUpdated).toBeInstanceOf(Date);
    expect(result.current.lastUpdated.getTime()).toBeGreaterThanOrEqual(beforeFetch.getTime());
  });

  it('works with different period parameters', async () => {
    vi.mocked(workingCapitalService.fetchWorkingCapitalMetrics).mockResolvedValueOnce(mockMetricsData);

    const { result } = renderHook(() => useWorkingCapitalMetrics('quarter'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(workingCapitalService.fetchWorkingCapitalMetrics).toHaveBeenCalledWith('quarter');
  });
});