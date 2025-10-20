/**
 * Master Admin Custom Hooks
 *
 * Shared API hooks for master admin dashboard components.
 * Provides type-safe access to all master admin endpoints.
 *
 * @module src/pages/master-admin/hooks/useMasterAdmin
 * @epic PHASE-5.1-MASTER-ADMIN-DASHBOARD
 */

import { useAuth } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Metrics {
  tenants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    newThisMonth: number;
    churnedThisMonth: number;
  };
  users: {
    total: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    currency: string;
  };
  churnRate: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
  };
}

export interface TenantDetail extends Tenant {
  users: Array<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    lastLoginAt: string | null;
    createdAt: string;
  }>;
  subscription: {
    id: string;
    tier: string;
    status: string;
    amountCents: number;
    billingCycle: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  } | null;
  auditLogs: Array<{
    id: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata: any;
    createdAt: string;
  }>;
  metrics: {
    product_count: number;
    sales_count: number;
    forecast_count: number;
  };
}

export interface RevenueMetrics {
  byTier: Array<{
    tier: string;
    _sum: { amountCents: number };
    _count: number;
  }>;
  trend: Array<{
    month: string;
    new_subscriptions: number;
    revenue: number;
  }>;
}

export interface SystemHealth {
  database: {
    status: string;
    connectionPool: string;
  };
  errors: {
    lastHour: number;
  };
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  timestamp: string;
}

export interface AuditLog {
  id: string;
  tenantId: string | null;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: any;
  createdAt: string;
}

// ============================================
// API HELPER FUNCTIONS
// ============================================

async function fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch system metrics overview (MRR, ARR, churn, tenant counts)
 */
export function useMasterAdminMetrics() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['masterAdmin', 'metrics', 'overview'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return fetchWithAuth('/api/master-admin/metrics/overview', token);
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Fetch revenue analytics (by tier, 12-month trend)
 */
export function useMasterAdminRevenue() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['masterAdmin', 'metrics', 'revenue'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return fetchWithAuth('/api/master-admin/metrics/revenue', token);
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

/**
 * Fetch system health metrics
 */
export function useMasterAdminSystemHealth() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['masterAdmin', 'metrics', 'system-health'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return fetchWithAuth('/api/master-admin/metrics/system-health', token);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Fetch tenant list with pagination and filters
 */
export function useMasterAdminTenants(params: {
  page?: number;
  limit?: number;
  status?: string;
  tier?: string;
  search?: string;
} = {}) {
  const { getToken } = useAuth();
  const queryParams = new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );

  return useQuery({
    queryKey: ['masterAdmin', 'tenants', params],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return fetchWithAuth(`/api/master-admin/tenants?${queryParams}`, token);
    },
  });
}

/**
 * Fetch detailed tenant information
 */
export function useMasterAdminTenantDetail(tenantId: string | null) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['masterAdmin', 'tenants', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID provided');
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return fetchWithAuth(`/api/master-admin/tenants/${tenantId}`, token);
    },
    enabled: !!tenantId, // Only run if tenantId is provided
  });
}

/**
 * Fetch audit logs with filtering
 */
export function useMasterAdminAuditLogs(params: {
  page?: number;
  limit?: number;
  action?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  const { getToken } = useAuth();
  const queryParams = new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );

  return useQuery({
    queryKey: ['masterAdmin', 'audit-logs', params],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return fetchWithAuth(`/api/master-admin/audit-logs?${queryParams}`, token);
    },
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Suspend a tenant
 */
export function useSuspendTenant() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, reason }: { tenantId: string; reason: string }) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return fetchWithAuth(`/api/master-admin/tenants/${tenantId}/suspend`, token, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      // Invalidate tenant queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['masterAdmin', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['masterAdmin', 'metrics'] });
    },
  });
}

/**
 * Reactivate a tenant
 */
export function useReactivateTenant() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantId: string) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return fetchWithAuth(`/api/master-admin/tenants/${tenantId}/reactivate`, token, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterAdmin', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['masterAdmin', 'metrics'] });
    },
  });
}

/**
 * Update tenant subscription tier/limits
 */
export function useUpdateTenant() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      updates,
    }: {
      tenantId: string;
      updates: {
        subscriptionTier?: string;
        subscriptionStatus?: string;
        features?: any;
        maxUsers?: number;
        maxEntities?: number;
      };
    }) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return fetchWithAuth(`/api/master-admin/tenants/${tenantId}`, token, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterAdmin', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['masterAdmin', 'metrics'] });
    },
  });
}

/**
 * Delete (soft delete) a tenant
 */
export function useDeleteTenant() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, confirm }: { tenantId: string; confirm: string }) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return fetchWithAuth(`/api/master-admin/tenants/${tenantId}`, token, {
        method: 'DELETE',
        body: JSON.stringify({ confirm }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterAdmin', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['masterAdmin', 'metrics'] });
    },
  });
}

/**
 * Generate impersonation token for a user
 */
export function useImpersonateUser() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return fetchWithAuth(`/api/master-admin/impersonate/${userId}`, token, {
        method: 'POST',
      });
    },
  });
}
