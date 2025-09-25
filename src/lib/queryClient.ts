// React Query client configuration with enterprise features

import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { useNotificationStore } from '../stores/notificationStore';
import { createNotification } from '../stores/notificationStore';
import type { APIError } from '../stores/types';

// Storage persister for offline support
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'sentia-query-cache',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});

// IndexedDB persister for large data sets
const indexedDBPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key: string) => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('sentia-cache', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['cache'], 'readonly');
          const store = transaction.objectStore('cache');
          const getRequest = store.get(key);
          
          getRequest.onerror = () => reject(getRequest.error);
          getRequest.onsuccess = () => resolve(getRequest.result?.value || null);
        };
        
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache', { keyPath: 'key' });
          }
        };
      });
    },
    
    setItem: async (key: string, value: string) => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('sentia-cache', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['cache'], 'readwrite');
          const store = transaction.objectStore('cache');
          const putRequest = store.put({ key, value, timestamp: Date.now() });
          
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        };
        
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache', { keyPath: 'key' });
          }
        };
      });
    },
    
    removeItem: async (key: string) => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('sentia-cache', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['cache'], 'readwrite');
          const store = transaction.objectStore('cache');
          const deleteRequest = store.delete(key);
          
          deleteRequest.onerror = () => reject(deleteRequest.error);
          deleteRequest.onsuccess = () => resolve();
        };
      });
    },
  },
  key: 'sentia-large-cache',
});

// Error handler for mutations
const handleMutationError = (error: unknown, variables: unknown, context: unknown) => {
  console.error('Mutation error:', { error, variables, context });
  
  const notificationStore = useNotificationStore.getState();
  
  if (error instanceof Error) {
    notificationStore.actions.addNotification(
      createNotification.error(
        'Operation Failed',
        error.message,
        { category: 'mutation' }
      )
    );
  }
};

// Error handler for queries
const handleQueryError = (error: unknown, query: any) => {
  console.error('Query error:', { error, query: query.queryKey });
  
  // Only show notifications for important query errors
  if (query.meta?.showErrorNotification) {
    const notificationStore = useNotificationStore.getState();
    
    if (error instanceof Error) {
      notificationStore.actions.addNotification(
        createNotification.error(
          'Data Loading Failed',
          error.message,
          { category: 'query' }
        )
      );
    }
  }
};

// Create Query Client with enterprise configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale while revalidate strategy
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Background refetching
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchIntervalInBackground: false,
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry for authentication errors
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Network mode
      networkMode: 'offlineFirst',
      
      // Error handling
      throwOnError: false,
    },
    mutations: {
      // Optimistic updates by default
      networkMode: 'offlineFirst',
      
      // Retry configuration for mutations
      retry: (failureCount, error) => {
        // Don't retry for client errors
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        
        // Retry up to 2 times for server errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
  
  queryCache: new QueryCache({
    onError: handleQueryError,
    onSuccess: (data, query) => {
      // Log successful queries in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Query success:', { queryKey: query.queryKey, data });
      }
    },
  }),
  
  mutationCache: new MutationCache({
    onError: handleMutationError,
    onSuccess: (data, variables, context, mutation) => {
      // Log successful mutations in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Mutation success:', { variables, data });
      }
      
      // Show success notification for important mutations
      if (mutation.meta?.showSuccessNotification) {
        const notificationStore = useNotificationStore.getState();
        notificationStore.actions.addNotification(
          createNotification.success(
            'Operation Successful',
            mutation.meta.successMessage || 'Operation completed successfully',
            { category: 'mutation' }
          )
        );
      }
    },
  }),
});

// Initialize persistence
let persistenceInitialized = false;

export const initializePersistence = async () => {
  if (persistenceInitialized) return;
  
  try {
    // Use IndexedDB for large data persistence
    await persistQueryClient({
      queryClient,
      persister: indexedDBPersister,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      hydrateOptions: {
        defaultOptions: {
          queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
          },
        },
      },
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          // Only persist important queries
          return query.meta?.persist === true || query.queryKey[0] === 'user-preferences';
        },
      },
    });
    
    persistenceInitialized = true;
    console.log('Query persistence initialized with IndexedDB');
  } catch (error) {
    console.warn('IndexedDB persistence failed, falling back to localStorage:', error);
    
    // Fallback to localStorage
    try {
      await persistQueryClient({
        queryClient,
        persister: localStoragePersister,
        maxAge: 1000 * 60 * 60 * 2, // 2 hours (smaller for localStorage)
        hydrateOptions: {
          defaultOptions: {
            queries: {
              gcTime: 1000 * 60 * 60 * 2, // 2 hours
            },
          },
        },
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            return query.meta?.persist === true;
          },
        },
      });
      
      persistenceInitialized = true;
      console.log('Query persistence initialized with localStorage');
    } catch (fallbackError) {
      console.error('Failed to initialize query persistence:', fallbackError);
    }
  }
};

// Query key factories
export const queryKeys = {
  // User queries
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
    permissions: () => [...queryKeys.user.all, 'permissions'] as const,
  },
  
  // Market queries
  markets: {
    all: ['markets'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.markets.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.markets.all, 'detail', id] as const,
    status: (id: string) => [...queryKeys.markets.all, 'status', id] as const,
    prices: (id: string, interval?: string) => [...queryKeys.markets.all, 'prices', id, interval] as const,
  },
  
  // Dashboard queries
  dashboard: {
    all: ['dashboard'] as const,
    layout: (id: string) => [...queryKeys.dashboard.all, 'layout', id] as const,
    widgets: (layoutId: string) => [...queryKeys.dashboard.all, 'widgets', layoutId] as const,
    data: (widgetId: string, params?: Record<string, any>) => 
      [...queryKeys.dashboard.all, 'data', widgetId, params] as const,
  },
  
  // Analytics queries
  analytics: {
    all: ['analytics'] as const,
    revenue: (period: string, market?: string) => 
      [...queryKeys.analytics.all, 'revenue', period, market] as const,
    performance: (filters?: Record<string, any>) => 
      [...queryKeys.analytics.all, 'performance', filters] as const,
    trends: (metric: string, period: string) => 
      [...queryKeys.analytics.all, 'trends', metric, period] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.notifications.all, 'list', filters] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },
} as const;

// Invalidation utilities
export const invalidateQueries = {
  user: () => queryClient.invalidateQueries({ queryKey: queryKeys.user.all }),
  markets: () => queryClient.invalidateQueries({ queryKey: queryKeys.markets.all }),
  dashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
  analytics: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all }),
  notifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  
  all: () => queryClient.invalidateQueries(),
};

// Prefetch utilities
export const prefetchQueries = {
  userProfile: () => queryClient.prefetchQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: () => fetch('/api/user/profile').then(res => res.json()),
    staleTime: 10 * 60 * 1000, // 10 minutes
  }),
  
  marketsList: () => queryClient.prefetchQuery({
    queryKey: queryKeys.markets.list(),
    queryFn: () => fetch('/api/markets').then(res => res.json()),
    staleTime: 30 * 60 * 1000, // 30 minutes
  }),
  
  dashboardData: (widgetIds: string[]) => {
    return Promise.all(
      widgetIds.map(widgetId =>
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.data(widgetId),
          queryFn: () => fetch(`/api/dashboard/widgets/${widgetId}/data`).then(res => res.json()),
          staleTime: 5 * 60 * 1000, // 5 minutes
        })
      )
    );
  },
};

// Cache management utilities
export const cacheUtils = {
  clearAll: () => queryClient.clear(),
  
  clearUserData: () => {
    queryClient.removeQueries({ queryKey: queryKeys.user.all });
  },
  
  clearMarketData: () => {
    queryClient.removeQueries({ queryKey: queryKeys.markets.all });
  },
  
  clearDashboardData: () => {
    queryClient.removeQueries({ queryKey: queryKeys.dashboard.all });
  },
  
  getCache: () => queryClient.getQueryCache(),
  
  getCacheSize: () => {
    const cache = queryClient.getQueryCache();
    return {
      queries: cache.getAll().length,
      size: JSON.stringify(cache.getAll()).length,
    };
  },
  
  removeStaleQueries: () => {
    const cache = queryClient.getQueryCache();
    const staleQueries = cache.getAll().filter(query => query.isStale());
    staleQueries.forEach(query => {
      queryClient.removeQueries({ queryKey: query.queryKey });
    });
    return staleQueries.length;
  },
};

// Network status utilities
export const networkUtils = {
  goOnline: () => {
    queryClient.resumePausedMutations();
    queryClient.refetchQueries({ type: 'active' });
  },
  
  goOffline: () => {
    // Mutations will be paused automatically
    console.log('Network offline - mutations paused');
  },
  
  getOnlineStatus: () => navigator.onLine,
  
  setupNetworkListener: () => {
    const handleOnline = () => networkUtils.goOnline();
    const handleOffline = () => networkUtils.goOffline();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
};

// Initialize network listeners
let networkListenerCleanup: (() => void) | null = null;

export const initializeNetworkHandling = () => {
  if (networkListenerCleanup) return networkListenerCleanup;
  
  networkListenerCleanup = networkUtils.setupNetworkListener();
  return networkListenerCleanup;
};

// Debugging utilities (development only)
export const debugUtils = process.env.NODE_ENV === 'development' ? {
  logQueries: () => {
    const cache = queryClient.getQueryCache();
    console.table(cache.getAll().map(query => ({
      queryKey: JSON.stringify(query.queryKey),
      status: query.state.status,
      dataUpdatedAt: new Date(query.state.dataUpdatedAt).toLocaleTimeString(),
      isStale: query.isStale(),
    })));
  },
  
  logMutations: () => {
    const cache = queryClient.getMutationCache();
    console.table(cache.getAll().map(mutation => ({
      mutationKey: JSON.stringify(mutation.options.mutationKey),
      status: mutation.state.status,
      submittedAt: mutation.state.submittedAt ? 
        new Date(mutation.state.submittedAt).toLocaleTimeString() : 'Never',
    })));
  },
  
  simulateOffline: () => {
    // @ts-ignore - for testing
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    window.dispatchEvent(new Event('offline'));
  },
  
  simulateOnline: () => {
    // @ts-ignore - for testing
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    window.dispatchEvent(new Event('online'));
  },
} : {};

export default queryClient;