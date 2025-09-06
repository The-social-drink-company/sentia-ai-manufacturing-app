import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ScenarioParameter {
  id: string;
  name: string;
  type: 'slider' | 'toggle' | 'input';
  category: 'pricing' | 'marketing' | 'competition' | 'economic' | 'seasonal';
  value: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  impact_factor: number;
  description: string;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  parameters: ScenarioParameter[];
  financial_impact: {
    revenue_change: number;
    margin_change: number;
    volume_change: number;
    total_impact: number;
  };
  confidence_score: number;
  is_favorite: boolean;
}

interface ModelMetrics {
  [modelName: string]: {
    mae: number;
    rmse: number;
    mape: number;
    accuracy: number;
    last_updated: string;
    trend: 'improving' | 'stable' | 'degrading';
  };
}

interface ForecastingState {
  // Scenarios
  currentScenario: Scenario | null;
  savedScenarios: Scenario[];
  
  // Model Performance
  modelMetrics: ModelMetrics;
  
  // UI State
  selectedProducts: string[];
  selectedMarkets: string[];
  timeRange: '1m' | '3m' | '6m' | '12m';
  viewMode: 'single' | 'comparison' | 'overlay';
  showConfidenceIntervals: boolean;
  showSeasonality: boolean;
  
  // AI Settings
  aiModelPreference: 'gpt-4' | 'claude' | 'ensemble';
  streamingEnabled: boolean;
  autoRefresh: boolean;
  
  // Actions
  setCurrentScenario: (scenario: Scenario | null) => void;
  saveScenario: (scenario: Scenario) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  deleteScenario: (id: string) => void;
  duplicateScenario: (id: string) => void;
  
  updateModelMetrics: (metrics: ModelMetrics) => void;
  
  setSelectedProducts: (products: string[]) => void;
  setSelectedMarkets: (markets: string[]) => void;
  setTimeRange: (range: '1m' | '3m' | '6m' | '12m') => void;
  setViewMode: (mode: 'single' | 'comparison' | 'overlay') => void;
  setShowConfidenceIntervals: (show: boolean) => void;
  setShowSeasonality: (show: boolean) => void;
  
  setAIModelPreference: (model: 'gpt-4' | 'claude' | 'ensemble') => void;
  setStreamingEnabled: (enabled: boolean) => void;
  setAutoRefresh: (enabled: boolean) => void;
  
  // Utilities
  getFavoriteScenarios: () => Scenario[];
  getScenariosByType: (category: string) => Scenario[];
  resetToDefaults: () => void;
}

const defaultState = {
  currentScenario: null,
  savedScenarios: [],
  modelMetrics: {},
  selectedProducts: ['sensio-red'],
  selectedMarkets: ['uk', 'us'],
  timeRange: '3m' as const,
  viewMode: 'overlay' as const,
  showConfidenceIntervals: true,
  showSeasonality: true,
  aiModelPreference: 'gpt-4' as const,
  streamingEnabled: true,
  autoRefresh: true,
};

export const useForecastingStore = create<ForecastingState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      // Scenario Actions
      setCurrentScenario: (scenario) =>
        set({ currentScenario: scenario }),

      saveScenario: (scenario) =>
        set((state) => ({
          savedScenarios: [
            ...state.savedScenarios.filter(s => s.id !== scenario.id),
            { ...scenario, updated_at: new Date().toISOString() }
          ]
        })),

      updateScenario: (id, updates) =>
        set((state) => ({
          savedScenarios: state.savedScenarios.map(scenario =>
            scenario.id === id
              ? { ...scenario, ...updates, updated_at: new Date().toISOString() }
              : scenario
          ),
          currentScenario: state.currentScenario?.id === id
            ? { ...state.currentScenario, ...updates, updated_at: new Date().toISOString() }
            : state.currentScenario
        })),

      deleteScenario: (id) =>
        set((state) => ({
          savedScenarios: state.savedScenarios.filter(s => s.id !== id),
          currentScenario: state.currentScenario?.id === id ? null : state.currentScenario
        })),

      duplicateScenario: (id) =>
        set((state) => {
          const original = state.savedScenarios.find(s => s.id === id);
          if (!original) return state;

          const duplicate: Scenario = {
            ...original,
            id: `${original.id}-copy-${Date.now()}`,
            name: `${original.name} (Copy)`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_favorite: false
          };

          return {
            savedScenarios: [...state.savedScenarios, duplicate]
          };
        }),

      // Model Metrics Actions
      updateModelMetrics: (metrics) =>
        set({ modelMetrics: metrics }),

      // UI State Actions
      setSelectedProducts: (products) =>
        set({ selectedProducts: products }),

      setSelectedMarkets: (markets) =>
        set({ selectedMarkets: markets }),

      setTimeRange: (range) =>
        set({ timeRange: range }),

      setViewMode: (mode) =>
        set({ viewMode: mode }),

      setShowConfidenceIntervals: (show) =>
        set({ showConfidenceIntervals: show }),

      setShowSeasonality: (show) =>
        set({ showSeasonality: show }),

      // AI Settings Actions
      setAIModelPreference: (model) =>
        set({ aiModelPreference: model }),

      setStreamingEnabled: (enabled) =>
        set({ streamingEnabled: enabled }),

      setAutoRefresh: (enabled) =>
        set({ autoRefresh: enabled }),

      // Utility Functions
      getFavoriteScenarios: () =>
        get().savedScenarios.filter(scenario => scenario.is_favorite),

      getScenariosByType: (category) =>
        get().savedScenarios.filter(scenario =>
          scenario.parameters.some(param => param.category === category)
        ),

      resetToDefaults: () =>
        set(defaultState)
    }),
    {
      name: 'forecasting-store',
      partialize: (state) => ({
        // Only persist certain parts of the state
        savedScenarios: state.savedScenarios,
        selectedProducts: state.selectedProducts,
        selectedMarkets: state.selectedMarkets,
        timeRange: state.timeRange,
        viewMode: state.viewMode,
        showConfidenceIntervals: state.showConfidenceIntervals,
        showSeasonality: state.showSeasonality,
        aiModelPreference: state.aiModelPreference,
        streamingEnabled: state.streamingEnabled,
        autoRefresh: state.autoRefresh,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useForecastingScenarios = () => {
  const scenarios = useForecastingStore(state => state.savedScenarios);
  const favorites = useForecastingStore(state => state.getFavoriteScenarios());
  const currentScenario = useForecastingStore(state => state.currentScenario);
  
  return { scenarios, favorites, currentScenario };
};

export const useForecastingUI = () => {
  const {
    selectedProducts,
    selectedMarkets,
    timeRange,
    viewMode,
    showConfidenceIntervals,
    showSeasonality,
    setSelectedProducts,
    setSelectedMarkets,
    setTimeRange,
    setViewMode,
    setShowConfidenceIntervals,
    setShowSeasonality,
  } = useForecastingStore();
  
  return {
    selectedProducts,
    selectedMarkets,
    timeRange,
    viewMode,
    showConfidenceIntervals,
    showSeasonality,
    setSelectedProducts,
    setSelectedMarkets,
    setTimeRange,
    setViewMode,
    setShowConfidenceIntervals,
    setShowSeasonality,
  };
};

export const useForecastingAI = () => {
  const {
    aiModelPreference,
    streamingEnabled,
    autoRefresh,
    setAIModelPreference,
    setStreamingEnabled,
    setAutoRefresh,
  } = useForecastingStore();
  
  return {
    aiModelPreference,
    streamingEnabled,
    autoRefresh,
    setAIModelPreference,
    setStreamingEnabled,
    setAutoRefresh,
  };
};

export const useForecastingMetrics = () => {
  const modelMetrics = useForecastingStore(state => state.modelMetrics);
  const updateModelMetrics = useForecastingStore(state => state.updateModelMetrics);
  
  return { modelMetrics, updateModelMetrics };
};