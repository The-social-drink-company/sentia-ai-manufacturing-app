// Filter and view preferences store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { FilterPreferences, FilterPreferencesState } from './types';
import { nanoid } from 'nanoid';

// Default filter preferences
const createDefaultFilters = (): FilterPreferences => ({
  dateRange: {
    start: null,
    end: null,
    preset: null,
  },
  markets: [],
  categories: [],
  status: [],
  sortBy: 'createdAt',
  sortOrder: 'desc',
  pageSize: 25,
  viewMode: 'table',
  groupBy: null,
  savedFilters: [],
});

interface FilterPreferencesStore extends FilterPreferencesState {}

export const useFilterPreferencesStore = create<FilterPreferencesStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        filters: createDefaultFilters(),
        isDirty: false,

        actions: {
          updateFilters: (updates: Partial<FilterPreferences>) => {
            set((state) => {
              state.filters = { ...state.filters, ...updates };
              state.isDirty = true;
            });
          },

          saveFilter: (name: string, filters: Record<string, any>) => {
            set((state) => {
              const savedFilter = {
                id: nanoid(),
                name,
                filters,
                createdAt: new Date(),
              };

              // Remove existing filter with same name
              state.filters.savedFilters = state.filters.savedFilters.filter(
                f => f.name !== name
              );

              // Add new saved filter
              state.filters.savedFilters.push(savedFilter);
              state.isDirty = true;
            });
          },

          loadFilter: (filterId: string) => {
            set((state) => {
              const savedFilter = state.filters.savedFilters.find(f => f.id === filterId);
              
              if (savedFilter) {
                state.filters = {
                  ...state.filters,
                  ...savedFilter.filters,
                };
                state.isDirty = false;
              }
            });
          },

          deleteFilter: (filterId: string) => {
            set((state) => {
              state.filters.savedFilters = state.filters.savedFilters.filter(
                f => f.id !== filterId
              );
              state.isDirty = true;
            });
          },

          clearFilters: () => {
            set((state) => {
              const { savedFilters } = state.filters;
              state.filters = {
                ...createDefaultFilters(),
                savedFilters, // Keep saved filters
              };
              state.isDirty = false;
            });
          },

          resetToDefaults: () => {
            set((state) => {
              state.filters = createDefaultFilters();
              state.isDirty = false;
            });
          },
        },
      })),
      {
        name: 'sentia-filter-preferences',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          filters: state.filters,
        }),
      }
    )
  )
);

// Convenience hooks for specific filter types
export const useDateRangeFilter = () => {
  return useFilterPreferencesStore((state) => ({
    dateRange: state.filters.dateRange,
    setDateRange: (dateRange: FilterPreferences['dateRange']) =>
      state.actions.updateFilters({ dateRange }),
  }));
};

export const useMarketFilter = () => {
  return useFilterPreferencesStore((state) => ({
    markets: state.filters.markets,
    setMarkets: (markets: string[]) =>
      state.actions.updateFilters({ markets }),
    toggleMarket: (marketId: string) => {
      const currentMarkets = state.filters.markets;
      const newMarkets = currentMarkets.includes(marketId)
        ? currentMarkets.filter(id => id !== marketId)
        : [...currentMarkets, marketId];
      state.actions.updateFilters({ markets: newMarkets });
    },
  }));
};

export const useCategoryFilter = () => {
  return useFilterPreferencesStore((state) => ({
    categories: state.filters.categories,
    setCategories: (categories: string[]) =>
      state.actions.updateFilters({ categories }),
    toggleCategory: (categoryId: string) => {
      const currentCategories = state.filters.categories;
      const newCategories = currentCategories.includes(categoryId)
        ? currentCategories.filter(id => id !== categoryId)
        : [...currentCategories, categoryId];
      state.actions.updateFilters({ categories: newCategories });
    },
  }));
};

export const useStatusFilter = () => {
  return useFilterPreferencesStore((state) => ({
    status: state.filters.status,
    setStatus: (status: string[]) =>
      state.actions.updateFilters({ status }),
    toggleStatus: (statusValue: string) => {
      const currentStatus = state.filters.status;
      const newStatus = currentStatus.includes(statusValue)
        ? currentStatus.filter(s => s !== statusValue)
        : [...currentStatus, statusValue];
      state.actions.updateFilters({ status: newStatus });
    },
  }));
};

export const useSortingOptions = () => {
  return useFilterPreferencesStore((state) => ({
    sortBy: state.filters.sortBy,
    sortOrder: state.filters.sortOrder,
    setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') =>
      state.actions.updateFilters({ sortBy, sortOrder }),
  }));
};

export const useViewPreferences = () => {
  return useFilterPreferencesStore((state) => ({
    viewMode: state.filters.viewMode,
    pageSize: state.filters.pageSize,
    groupBy: state.filters.groupBy,
    setViewMode: (viewMode: FilterPreferences['viewMode']) =>
      state.actions.updateFilters({ viewMode }),
    setPageSize: (pageSize: number) =>
      state.actions.updateFilters({ pageSize }),
    setGroupBy: (groupBy: string | null) =>
      state.actions.updateFilters({ groupBy }),
  }));
};

export const useSavedFilters = () => {
  return useFilterPreferencesStore((state) => ({
    savedFilters: state.filters.savedFilters,
    saveFilter: state.actions.saveFilter,
    loadFilter: state.actions.loadFilter,
    deleteFilter: state.actions.deleteFilter,
  }));
};

// Utility functions for filter management
export const getActiveFiltersCount = (): number => {
  const state = useFilterPreferencesStore.getState();
  const { filters } = state;
  
  let count = 0;
  
  if (filters.dateRange.start || filters.dateRange.end || filters.dateRange.preset) {
    count++;
  }
  
  if (filters.markets.length > 0) count++;
  if (filters.categories.length > 0) count++;
  if (filters.status.length > 0) count++;
  if (filters.groupBy) count++;
  
  return count;
};

export const hasActiveFilters = (): boolean => {
  return getActiveFiltersCount() > 0;
};

export const getFilterSummary = (): string => {
  const state = useFilterPreferencesStore.getState();
  const { filters } = state;
  const parts: string[] = [];
  
  if (filters.dateRange.preset) {
    parts.push(`Date: ${filters.dateRange.preset}`);
  } else if (filters.dateRange.start && filters.dateRange.end) {
    parts.push(`Date: ${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`);
  }
  
  if (filters.markets.length > 0) {
    parts.push(`Markets: ${filters.markets.length}`);
  }
  
  if (filters.categories.length > 0) {
    parts.push(`Categories: ${filters.categories.length}`);
  }
  
  if (filters.status.length > 0) {
    parts.push(`Status: ${filters.status.join(', ')}`);
  }
  
  return parts.join(' | ') || 'No active filters';
};

// Filter validation utilities
export const validateFilters = (filters: Partial<FilterPreferences>): string[] => {
  const errors: string[] = [];
  
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    if (start && end && start > end) {
      errors.push('Start date must be before end date');
    }
  }
  
  if (filters.pageSize && (filters.pageSize < 1 || filters.pageSize > 100)) {
    errors.push('Page size must be between 1 and 100');
  }
  
  if (filters.sortOrder && !['asc', 'desc'].includes(filters.sortOrder)) {
    errors.push('Sort order must be asc or desc');
  }
  
  if (filters.viewMode && !['table', 'card', 'list'].includes(filters.viewMode)) {
    errors.push('Invalid view mode');
  }
  
  return errors;
};

// Filter persistence utilities
export const exportFilters = (): string => {
  const state = useFilterPreferencesStore.getState();
  return JSON.stringify({
    filters: state.filters,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  }, null, 2);
};

export const importFilters = (data: string): void => {
  try {
    const parsed = JSON.parse(data);
    
    if (!parsed.version || parsed.version !== '1.0') {
      throw new Error('Unsupported filter version');
    }
    
    const errors = validateFilters(parsed.filters);
    if (errors.length > 0) {
      throw new Error(`Invalid filters: ${errors.join(', ')}`);
    }
    
    const store = useFilterPreferencesStore.getState();
    store.actions.updateFilters(parsed.filters);
  } catch (error) {
    throw new Error(`Failed to import filters: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Query building utilities
export const buildQueryParams = (): URLSearchParams => {
  const state = useFilterPreferencesStore.getState();
  const { filters } = state;
  const params = new URLSearchParams();
  
  if (filters.dateRange.start) {
    params.set('startDate', filters.dateRange.start.toISOString());
  }
  
  if (filters.dateRange.end) {
    params.set('endDate', filters.dateRange.end.toISOString());
  }
  
  if (filters.dateRange.preset) {
    params.set('datePreset', filters.dateRange.preset);
  }
  
  if (filters.markets.length > 0) {
    params.set('markets', filters.markets.join(','));
  }
  
  if (filters.categories.length > 0) {
    params.set('categories', filters.categories.join(','));
  }
  
  if (filters.status.length > 0) {
    params.set('status', filters.status.join(','));
  }
  
  params.set('sortBy', filters.sortBy);
  params.set('sortOrder', filters.sortOrder);
  params.set('pageSize', filters.pageSize.toString());
  
  if (filters.groupBy) {
    params.set('groupBy', filters.groupBy);
  }
  
  return params;
};

export const parseQueryParams = (params: URLSearchParams): Partial<FilterPreferences> => {
  const filters: Partial<FilterPreferences> = {};
  
  const startDate = params.get('startDate');
  const endDate = params.get('endDate');
  const datePreset = params.get('datePreset');
  
  if (startDate || endDate || datePreset) {
    filters.dateRange = {
      start: startDate ? new Date(startDate) : null,
      end: endDate ? new Date(endDate) : null,
      preset: datePreset,
    };
  }
  
  const markets = params.get('markets');
  if (markets) {
    filters.markets = markets.split(',');
  }
  
  const categories = params.get('categories');
  if (categories) {
    filters.categories = categories.split(',');
  }
  
  const status = params.get('status');
  if (status) {
    filters.status = status.split(',');
  }
  
  const sortBy = params.get('sortBy');
  if (sortBy) {
    filters.sortBy = sortBy;
  }
  
  const sortOrder = params.get('sortOrder');
  if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
    filters.sortOrder = sortOrder as 'asc' | 'desc';
  }
  
  const pageSize = params.get('pageSize');
  if (pageSize) {
    const size = parseInt(pageSize, 10);
    if (!isNaN(size) && size > 0 && size <= 100) {
      filters.pageSize = size;
    }
  }
  
  const groupBy = params.get('groupBy');
  if (groupBy) {
    filters.groupBy = groupBy;
  }
  
  return filters;
};