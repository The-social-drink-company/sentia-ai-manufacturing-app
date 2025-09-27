import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { useExecutiveStore } from './executiveStore';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('ExecutiveStore', () => {
  beforeEach(() => {
    // Clear store state
    useExecutiveStore.setState({
      metrics: {},
      trends: { financial: [], operational: [] },
      alerts: [],
      loading: false,
      error: null,
      lastUpdated: null
    });
    vi.clearAllMocks();
  });

  it('initializes with empty _state', () => {
    const state = useExecutiveStore.getState();

    expect(state.metrics).toEqual({});
    expect(state.trends).toEqual({ financial: [], operational: [] });
    expect(state.alerts).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('fetches executive metrics _successfully', async () => {
    const mockResponse = {
      data: {
        metrics: {
          revenue: { value: 12500000, target: 15000000, trend: 8.5 },
          cashFlow: { value: 2800000, target: 3000000, trend: -2.3 }
        },
        trends: {
          financial: [{ month: 'Jan', revenue: 10.2 }],
          operational: [{ month: 'Jan', oee: 82 }]
        },
        alerts: [
          { id: 1, severity: 'critical', title: 'Test Alert' }
        ]
      }
    };

    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const { fetchExecutiveMetrics } = useExecutiveStore.getState();
    await fetchExecutiveMetrics();

    const state = useExecutiveStore.getState();
    expect(state.metrics).toEqual(mockResponse.data.metrics);
    expect(state.trends).toEqual(mockResponse.data.trends);
    expect(state.alerts).toEqual(mockResponse.data.alerts);
    expect(state.loading).toBe(false);
    expect(state.lastUpdated).toBeTruthy();
  });

  it('handles fetch _errors', async () => {
    const errorMessage = 'Network Error';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

    const { fetchExecutiveMetrics } = useExecutiveStore.getState();

    await expect(fetchExecutiveMetrics()).rejects.toThrow(errorMessage);

    const state = useExecutiveStore.getState();
    expect(state.error).toBe(errorMessage);
    expect(state.loading).toBe(false);
  });

  it('updates metric _correctly', () => {
    const { updateMetric } = useExecutiveStore.getState();
    const metricUpdate = {
      id: 'revenue',
      value: 13000000,
      target: 15000000,
      trend: 9.2
    };

    updateMetric(metricUpdate);

    const state = useExecutiveStore.getState();
    expect(state.metrics.revenue).toEqual(metricUpdate);
    expect(state.lastUpdated).toBeTruthy();
  });

  it('adds alert _correctly', () => {
    const { addAlert } = useExecutiveStore.getState();
    const newAlert = {
      severity: 'warning',
      title: 'New Alert',
      description: 'Test description'
    };

    addAlert(newAlert);

    const state = useExecutiveStore.getState();
    expect(state.alerts).toHaveLength(1);
    expect(state.alerts[0]).toMatchObject(newAlert);
    expect(state.alerts[0].id).toBeTruthy();
    expect(state.alerts[0].timestamp).toBeTruthy();
  });

  it('dismisses alert _correctly', () => {
    // First add an alert
    const { addAlert, dismissAlert } = useExecutiveStore.getState();
    addAlert({ severity: 'info', title: 'Test Alert' });

    let state = useExecutiveStore.getState();
    const alertId = state.alerts[0].id;

    // Then dismiss it
    dismissAlert(alertId);

    state = useExecutiveStore.getState();
    expect(state.alerts).toHaveLength(0);
  });

  it('updates preferences _correctly', () => {
    const { updatePreferences } = useExecutiveStore.getState();
    const newPreferences = {
      layout: 'compact',
      kpiSelection: ['revenue', 'cashFlow']
    };

    updatePreferences(newPreferences);

    const state = useExecutiveStore.getState();
    expect(state.preferences.layout).toBe('compact');
    expect(state.preferences.kpiSelection).toEqual(['revenue', 'cashFlow']);
  });

  it('calculates current ratio _correctly', () => {
    const { calculateCurrentRatio } = useExecutiveStore.getState();

    // Set up test data
    useExecutiveStore.setState({
      metrics: {
        currentAssets: { value: 5000000 },
        currentLiabilities: { value: 2500000 }
      }
    });

    const ratio = calculateCurrentRatio();

    expect(ratio).toBe(2.0);
    const state = useExecutiveStore.getState();
    expect(state.metrics.currentRatio.value).toBe(2.0);
    expect(state.metrics.currentRatio.target).toBe(2.0);
  });

  it('calculates quick ratio _correctly', () => {
    const { calculateQuickRatio } = useExecutiveStore.getState();

    // Set up test data
    useExecutiveStore.setState({
      metrics: {
        currentAssets: { value: 5000000 },
        inventory: { value: 1000000 },
        currentLiabilities: { value: 2500000 }
      }
    });

    const ratio = calculateQuickRatio();

    expect(ratio).toBe(1.6);
    const state = useExecutiveStore.getState();
    expect(state.metrics.quickRatio.value).toBe(1.6);
    expect(state.metrics.quickRatio.target).toBe(1.0);
  });

  it('calculates cash unlock _correctly', () => {
    const { calculateCashUnlock } = useExecutiveStore.getState();

    // Set up test data
    useExecutiveStore.setState({
      metrics: {
        daysInventory: { value: 45 },
        daysReceivables: { value: 30 },
        daysPayables: { value: 40 },
        revenue: { value: 36500000 } // $100k per day
      }
    });

    const cashUnlock = calculateCashUnlock();

    // Cash cycle = 45 + 30 - 40 = 35 days
    // Daily revenue = 36500000 / 365 = 100000
    // Cash unlock = 35 * 100000 = 3500000
    expect(cashUnlock).toBe(3500000);
  });

  it('generates mock data _correctly', () => {
    const { generateMockData } = useExecutiveStore.getState();

    generateMockData();

    const state = useExecutiveStore.getState();
    expect(state.metrics.revenue).toBeDefined();
    expect(state.metrics.cashFlow).toBeDefined();
    expect(state.alerts).toHaveLength(3);
    expect(state.trends.financial).toHaveLength(6);
    expect(state.trends.operational).toHaveLength(6);
  });
});