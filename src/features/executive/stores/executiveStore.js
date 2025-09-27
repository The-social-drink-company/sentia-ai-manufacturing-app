import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import axios from 'axios';

const useExecutiveStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        metrics: {},
        trends: {
          financial: [],
          operational: []
        },
        alerts: [],
        preferences: {
          layout: 'default',
          kpiSelection: []
        },
        loading: false,
        error: null,
        lastUpdated: null,

        // Actions
        fetchExecutiveMetrics: async () => {
          set({ loading: true, error: null });
          try {
            const response = await axios.get('/api/executive/metrics');
            set({
              metrics: response.data.metrics,
              trends: response.data.trends,
              alerts: response.data.alerts,
              lastUpdated: new Date().toISOString(),
              loading: false
            });
            return response.data;
          } catch (error) {
            set({
              error: error.message,
              loading: false
            });
            throw error;
          }
        },

        updateMetric: (metricUpdate) => {
          set(state => ({
            metrics: {
              ...state.metrics,
              [metricUpdate.id]: metricUpdate
            },
            lastUpdated: new Date().toISOString()
          }));
        },

        addAlert: (alert) => {
          set(state => ({
            alerts: [...state.alerts, {
              ...alert,
              id: Date.now(),
              timestamp: new Date().toISOString()
            }]
          }));
        },

        dismissAlert: (alertId) => {
          set(state => ({
            alerts: state.alerts.filter(a => a.id !== alertId)
          }));
        },

        updatePreferences: (newPreferences) => {
          set(state => ({
            preferences: {
              ...state.preferences,
              ...newPreferences
            }
          }));
        },

        // Calculated values for financial metrics
        calculateCurrentRatio: () => {
          const { metrics } = get();
          if (!metrics.currentAssets || !metrics.currentLiabilities) return null;

          const ratio = metrics.currentAssets.value / metrics.currentLiabilities.value;
          set(state => ({
            metrics: {
              ...state.metrics,
              currentRatio: {
                value: ratio,
                target: 2.0,
                trend: state.metrics.currentRatio?.trend || 0
              }
            }
          }));
          return ratio;
        },

        calculateQuickRatio: () => {
          const { metrics } = get();
          if (!metrics.currentAssets || !metrics.inventory || !metrics.currentLiabilities) return null;

          const ratio = (metrics.currentAssets.value - metrics.inventory.value) / metrics.currentLiabilities.value;
          set(state => ({
            metrics: {
              ...state.metrics,
              quickRatio: {
                value: ratio,
                target: 1.0,
                trend: state.metrics.quickRatio?.trend || 0
              }
            }
          }));
          return ratio;
        },

        calculateCashUnlock: () => {
          const { metrics } = get();
          if (!metrics.daysInventory || !metrics.daysReceivables || !metrics.daysPayables) return null;

          const cashCycle = metrics.daysInventory.value + metrics.daysReceivables.value - metrics.daysPayables.value;
          const dailyRevenue = metrics.revenue?.value / 365;
          const cashUnlock = cashCycle * dailyRevenue;

          set(state => ({
            metrics: {
              ...state.metrics,
              cashUnlock: {
                value: cashUnlock,
                target: 0,
                trend: state.metrics.cashUnlock?.trend || 0
              }
            }
          }));
          return cashUnlock;
        },

        // Mock data generator for development
        generateMockData: () => {
          const mockMetrics = {
            revenue: { value: 12500000, target: 15000000, trend: 8.5 },
            cashFlow: { value: 2800000, target: 3000000, trend: -2.3 },
            currentRatio: { value: 2.1, target: 2.0, trend: 5.2 },
            quickRatio: { value: 1.3, target: 1.0, trend: 3.8 },
            oee: { value: 87, target: 85, trend: 2.1 },
            throughput: { value: 45000, target: 50000, trend: -1.5 },
            marketShare: { value: 23.5, target: 25.0, trend: 1.2 },
            customerSatisfaction: { value: 92, target: 90, trend: 3.4 },
            currentAssets: { value: 5000000, target: 0, trend: 0 },
            currentLiabilities: { value: 2380000, target: 0, trend: 0 },
            inventory: { value: 1200000, target: 0, trend: 0 },
            daysInventory: { value: 45, target: 30, trend: -3.2 },
            daysReceivables: { value: 38, target: 35, trend: -2.1 },
            daysPayables: { value: 52, target: 45, trend: 4.5 }
          };

          const mockAlerts = [
            {
              id: 1,
              severity: 'critical',
              type: 'risk',
              title: 'Cash Flow Below Target',
              description: 'Cash flow is 93% of target. Review receivables collection.'
            },
            {
              id: 2,
              severity: 'warning',
              type: 'opportunity',
              title: 'OEE Above Target',
              description: 'Production efficiency exceeds target by 2%. Consider capacity expansion.'
            },
            {
              id: 3,
              severity: 'info',
              type: 'opportunity',
              title: 'Customer Satisfaction High',
              description: '92% satisfaction rate presents upselling opportunities.'
            }
          ];

          const mockTrends = {
            financial: [
              { month: 'Jan', revenue: 10.2, cashFlow: 2.1, margin: 18.5 },
              { month: 'Feb', revenue: 10.8, cashFlow: 2.3, margin: 19.2 },
              { month: 'Mar', revenue: 11.5, cashFlow: 2.5, margin: 19.8 },
              { month: 'Apr', revenue: 11.9, cashFlow: 2.6, margin: 20.1 },
              { month: 'May', revenue: 12.2, cashFlow: 2.7, margin: 20.5 },
              { month: 'Jun', revenue: 12.5, cashFlow: 2.8, margin: 21.0 }
            ],
            operational: [
              { month: 'Jan', oee: 82, throughput: 43, quality: 96.5 },
              { month: 'Feb', oee: 83, throughput: 44, quality: 96.8 },
              { month: 'Mar', oee: 84, throughput: 44.5, quality: 97.0 },
              { month: 'Apr', oee: 85, throughput: 45, quality: 97.2 },
              { month: 'May', oee: 86, throughput: 45, quality: 97.5 },
              { month: 'Jun', oee: 87, throughput: 45, quality: 97.8 }
            ]
          };

          set({
            metrics: mockMetrics,
            alerts: mockAlerts,
            trends: mockTrends,
            lastUpdated: new Date().toISOString()
          });
        }
      }),
      {
        name: 'executive-dashboard-storage',
        partialize: (state) => ({
          preferences: state.preferences
        })
      }
    ),
    {
      name: 'ExecutiveStore'
    }
  )
);

export { useExecutiveStore };