/**
 * Tenant Context Hook
 *
 * Provides tenant/organization information for multi-tenant features.
 * Currently returns mock data for the single-tenant demo.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-007 (Integration)
 */

import { useAuth } from './useAuth';

export interface Tenant {
  id: string;
  name: string;
  subscriptionTier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  subscriptionCycle: 'MONTHLY' | 'ANNUAL';
  currentPeriodEnd?: Date;
  tier: 'starter' | 'professional' | 'enterprise';
  features: Record<string, boolean | number | string>;
  limits: {
    users: number;
    entities: number;
    integrations: number;
  };
  currentUsage?: {
    users: number;
    entities: number;
    integrations: number;
  };
}

export function useTenant() {
  const { user } = useAuth();

  // For demo/development: return a mock tenant
  // In production, this would fetch tenant data from backend
  const tenant: Tenant | null = user
    ? {
        id: 'demo-tenant',
        name: 'Demo Organization',
        subscriptionTier: 'PROFESSIONAL',
        subscriptionCycle: 'MONTHLY',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        tier: 'professional', // Default to professional tier for demo
        features: {
          aiForcasting: true,
          whatIfAnalysis: true,
          advancedAnalytics: true,
          multiCurrency: true,
          prioritySupport: true,
        },
        limits: {
          users: 25,
          entities: 5000,
          integrations: 10,
        },
        currentUsage: {
          users: 18, // 72% of limit (approaching warning threshold)
          entities: 3842, // 77% of limit (approaching warning threshold)
          integrations: 6, // 60% of limit (healthy)
        },
      }
    : null;

  return {
    tenant,
    isLoading: false,
    error: null,
  };
}
