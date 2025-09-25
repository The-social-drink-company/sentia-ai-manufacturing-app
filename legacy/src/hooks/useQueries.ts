// Custom React Query hooks with enterprise features

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../lib/queryClient';
import { useNotificationStore } from '../stores/notificationStore';
import { createNotification } from '../stores/notificationStore';
import type { APIResponse, APIError } from '../stores/types';

// API base configuration
const API_BASE_URL = process.env.VITE_API_BASE_URL || '/api';

// Generic fetch function with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData: APIError = await response.json().catch(() => ({
      code: response.status.toString(),
      message: response.statusText,
      timestamp: new Date(),
      requestId: response.headers.get('x-request-id') || 'unknown',
    }));
    
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  const data: APIResponse<T> = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'API request failed');
  }

  return data.data;
}

// User queries
export function useUserProfile(options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: () => fetchApi('/user/profile'),
    staleTime: 10 * 60 * 1000, // 10 minutes
    meta: { persist: true },
    ...options,
  });
}

export function useUserPreferences(options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.user.preferences(),
    queryFn: () => fetchApi('/user/preferences'),
    staleTime: 15 * 60 * 1000, // 15 minutes
    meta: { persist: true },
    ...options,
  });
}

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preferences: Record<string, any>) =>
      fetchApi('/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      }),
    onMutate: async (newPreferences) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.user.preferences() });
      
      // Snapshot previous value
      const previousPreferences = queryClient.getQueryData(queryKeys.user.preferences());
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.user.preferences(), newPreferences);
      
      return { previousPreferences };
    },
    onError: (err, newPreferences, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKeys.user.preferences(), context?.previousPreferences);
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.user.preferences() });
    },
    meta: {
      showSuccessNotification: true,
      successMessage: 'Preferences updated successfully',
    },
  });
}

// Market queries
export function useMarkets(filters?: Record<string, any>, options?: UseQueryOptions<any[], Error>) {
  return useQuery({
    queryKey: queryKeys.markets.list(filters),
    queryFn: () => {
      const params = new URLSearchParams(filters || {});
      return fetchApi(`/markets?${params}`);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    meta: { persist: true },
    ...options,
  });
}

export function useMarketDetail(marketId: string, options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.markets.detail(marketId),
    queryFn: () => fetchApi(`/markets/${marketId}`),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!marketId,
    ...options,
  });
}

export function useMarketPrices(
  marketId: string, 
  interval: string = '1h',
  options?: UseQueryOptions<any, Error>
) {
  return useQuery({
    queryKey: queryKeys.markets.prices(marketId, interval),
    queryFn: () => fetchApi(`/markets/${marketId}/prices?interval=${interval}`),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
    enabled: !!marketId,
    ...options,
  });
}

export function useMarketStatus(marketId: string, options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.markets.status(marketId),
    queryFn: () => fetchApi(`/markets/${marketId}/status`),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    enabled: !!marketId,
    ...options,
  });
}

// Dashboard queries
export function useDashboardLayouts(options?: UseQueryOptions<any[], Error>) {
  return useQuery({
    queryKey: queryKeys.dashboard.layout('list'),
    queryFn: () => fetchApi('/dashboard/layouts'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: { persist: true },
    ...options,
  });
}

export function useDashboardLayout(layoutId: string, options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.dashboard.layout(layoutId),
    queryFn: () => fetchApi(`/dashboard/layouts/${layoutId}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!layoutId,
    meta: { persist: true },
    ...options,
  });
}

export function useWidgetData(
  widgetId: string,
  params?: Record<string, any>,
  options?: UseQueryOptions<any, Error>
) {
  return useQuery({
    queryKey: queryKeys.dashboard.data(widgetId, params),
    queryFn: () => {
      const searchParams = new URLSearchParams(params || {});
      return fetchApi(`/dashboard/widgets/${widgetId}/data?${searchParams}`);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    enabled: !!widgetId,
    ...options,
  });
}

export function useSaveDashboardLayout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (layout: any) =>
      fetchApi('/dashboard/layouts', {
        method: 'POST',
        body: JSON.stringify(layout),
      }),
    onSuccess: () => {
      invalidateQueries.dashboard();
    },
    meta: {
      showSuccessNotification: true,
      successMessage: 'Dashboard layout saved successfully',
    },
  });
}

export function useUpdateDashboardLayout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ layoutId, layout }: { layoutId: string; layout: any }) =>
      fetchApi(`/dashboard/layouts/${layoutId}`, {
        method: 'PUT',
        body: JSON.stringify(layout),
      }),
    onMutate: async ({ layoutId, layout }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.layout(layoutId) });
      
      const previousLayout = queryClient.getQueryData(queryKeys.dashboard.layout(layoutId));
      
      queryClient.setQueryData(queryKeys.dashboard.layout(layoutId), layout);
      
      return { previousLayout };
    },
    onError: (err, { layoutId }, context) => {
      queryClient.setQueryData(queryKeys.dashboard.layout(layoutId), context?.previousLayout);
    },
    onSettled: (data, error, { layoutId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.layout(layoutId) });
    },
    meta: {
      showSuccessNotification: true,
      successMessage: 'Layout updated successfully',
    },
  });
}

// Analytics queries
export function useRevenueAnalytics(
  period: string,
  market?: string,
  options?: UseQueryOptions<any, Error>
) {
  return useQuery({
    queryKey: queryKeys.analytics.revenue(period, market),
    queryFn: () => {
      const params = new URLSearchParams({ period });
      if (market) params.set('market', market);
      return fetchApi(`/analytics/revenue?${params}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function usePerformanceMetrics(
  filters?: Record<string, any>,
  options?: UseQueryOptions<any, Error>
) {
  return useQuery({
    queryKey: queryKeys.analytics.performance(filters),
    queryFn: () => {
      const params = new URLSearchParams(filters || {});
      return fetchApi(`/analytics/performance?${params}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useTrendAnalytics(
  metric: string,
  period: string,
  options?: UseQueryOptions<any, Error>
) {
  return useQuery({
    queryKey: queryKeys.analytics.trends(metric, period),
    queryFn: () => fetchApi(`/analytics/trends/${metric}?period=${period}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!metric,
    ...options,
  });
}

// Infinite queries for large datasets
export function useInfiniteTransactions(
  filters?: Record<string, any>,
  options?: UseInfiniteQueryOptions<any, Error>
) {
  return useInfiniteQuery({
    queryKey: ['transactions', 'infinite', filters],
    queryFn: ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '20',
        ...filters,
      });
      return fetchApi(`/transactions?${params}`);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.meta || lastPage.meta.page >= lastPage.meta.totalPages - 1) {
        return undefined;
      }
      return lastPage.meta.page + 1;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

export function useInfiniteNotifications(
  filters?: Record<string, any>,
  options?: UseInfiniteQueryOptions<any, Error>
) {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '50',
        ...filters,
      });
      return fetchApi(`/notifications?${params}`);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.meta || lastPage.meta.page >= lastPage.meta.totalPages - 1) {
        return undefined;
      }
      return lastPage.meta.page + 1;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
}

// Notification mutations
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      fetchApi(`/notifications/${notificationId}/read`, { method: 'POST' }),
    onMutate: async (notificationId) => {
      // Optimistically update notification lists
      const queryKey = queryKeys.notifications.all;
      
      queryClient.setQueriesData({ queryKey }, (oldData: any) => {
        if (!oldData) return oldData;
        
        if (Array.isArray(oldData)) {
          return oldData.map((notification: any) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          );
        }
        
        // Handle infinite query structure
        if (oldData.pages) {
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((notification: any) =>
                notification.id === notificationId
                  ? { ...notification, read: true }
                  : notification
              ),
            })),
          };
        }
        
        return oldData;
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => fetchApi('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      invalidateQueries.notifications();
    },
    meta: {
      showSuccessNotification: true,
      successMessage: 'All notifications marked as read',
    },
  });
}

// Bulk operations
export function useBulkOperation<T = any>() {
  return useMutation({
    mutationFn: ({ endpoint, items }: { endpoint: string; items: T[] }) =>
      fetchApi(endpoint, {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
    meta: {
      showSuccessNotification: true,
      successMessage: 'Bulk operation completed successfully',
    },
  });
}

// Custom hooks for common patterns
export function useOptimisticMutation<T, U>(
  mutationFn: (variables: T) => Promise<U>,
  queryKey: readonly unknown[],
  updateFn: (oldData: any, variables: T) => any,
  options?: UseMutationOptions<U, Error, T>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (oldData: any) =>
        updateFn(oldData, variables)
      );
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
      options?.onError?.(err, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey });
      options?.onSettled?.(data, error, variables, context);
    },
    ...options,
  });
}

// Background sync hook
export function useBackgroundSync() {
  const queryClient = useQueryClient();
  const { actions: notificationActions } = useNotificationStore();
  
  return {
    syncAll: () => {
      return queryClient.refetchQueries({ type: 'active' });
    },
    
    syncCriticalData: () => {
      return Promise.all([
        queryClient.refetchQueries({ queryKey: queryKeys.user.profile() }),
        queryClient.refetchQueries({ queryKey: queryKeys.notifications.unread() }),
        queryClient.refetchQueries({ 
          queryKey: queryKeys.markets.all,
          predicate: (query) => query.queryKey.includes('status')
        }),
      ]);
    },
    
    enableAutoSync: (interval: number = 5 * 60 * 1000) => {
      const intervalId = setInterval(() => {
        if (navigator.onLine) {
          queryClient.refetchQueries({ 
            predicate: (query) => query.state.isStale 
          });
        }
      }, interval);
      
      return () => clearInterval(intervalId);
    },
  };
}

// Data synchronization status
export function useSyncStatus() {
  const queryClient = useQueryClient();
  
  return {
    isSyncing: queryClient.isFetching() > 0 || queryClient.isMutating() > 0,
    pendingMutations: queryClient.getMutationCache().getAll().length,
    staleQueries: queryClient.getQueryCache().getAll().filter(query => query.isStale()).length,
    lastSync: queryClient.getQueryCache().getAll()
      .reduce((latest, query) => 
        Math.max(latest, query.state.dataUpdatedAt || 0), 0
      ),
  };
}