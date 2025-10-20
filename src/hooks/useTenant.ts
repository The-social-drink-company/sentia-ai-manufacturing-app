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
}

export function useTenant() {
  const { user } = useAuth();

  // For demo/development: return a mock tenant
  // In production, this would fetch tenant data from backend
  const tenant: Tenant | null = user
    ? {
        id: 'demo-tenant',
        name: 'Demo Organization',
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
      }
    : null;

  return {
    tenant,
    isLoading: false,
    error: null,
  };
}
