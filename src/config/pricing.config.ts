/**
 * CapLiquify Pricing Configuration
 *
 * Centralized configuration for subscription tiers, features, and limits.
 * Used by feature gating system to control access and display upgrade prompts.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-001 (Pricing Configuration)
 */

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';

export interface TierFeatures {
  // User & Entity Limits
  maxUsers: number | 'unlimited';
  maxEntities: number | 'unlimited';
  maxIntegrations: number | 'unlimited';

  // Forecasting & Analytics
  forecastHorizonMonths: number;
  dataRetentionMonths: number | 'unlimited';

  // API & Performance
  apiCallsPerMonth: number | 'unlimited';

  // Feature Flags
  basicDashboards: boolean;
  inventoryManagement: boolean;
  orderTracking: boolean;
  basicReports: boolean;
  aiForcasting: boolean; // Note: Intentional typo to match existing codebase
  whatIfAnalysis: boolean;
  advancedAnalytics: boolean;
  multiCurrency: boolean;
  customIntegrations: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  dedicatedSupport: boolean;
  slaGuarantees: boolean;
  advancedSecurity: boolean;
  auditLogs: boolean;
  customReports: boolean;
}

export interface PricingTier {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  features: TierFeatures;
}

/**
 * Subscription Tier Definitions
 */
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses getting started',
    monthlyPrice: 149,
    annualPrice: 1490, // ~17% discount
    features: {
      // Limits
      maxUsers: 5,
      maxEntities: 500,
      maxIntegrations: 3,
      forecastHorizonMonths: 3,
      dataRetentionMonths: 6,
      apiCallsPerMonth: 10000,

      // Basic Features (Enabled)
      basicDashboards: true,
      inventoryManagement: true,
      orderTracking: true,
      basicReports: true,

      // Advanced Features (Disabled)
      aiForcasting: false,
      whatIfAnalysis: false,
      advancedAnalytics: false,
      multiCurrency: false,
      customIntegrations: false,
      whiteLabel: false,
      prioritySupport: false,
      dedicatedSupport: false,
      slaGuarantees: false,
      advancedSecurity: false,
      auditLogs: false,
      customReports: false,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses that need advanced analytics',
    monthlyPrice: 295,
    annualPrice: 2950, // ~17% discount
    popular: true,
    features: {
      // Limits
      maxUsers: 25,
      maxEntities: 5000,
      maxIntegrations: 10,
      forecastHorizonMonths: 12,
      dataRetentionMonths: 24,
      apiCallsPerMonth: 50000,

      // All Starter Features
      basicDashboards: true,
      inventoryManagement: true,
      orderTracking: true,
      basicReports: true,

      // Professional Features (Enabled)
      aiForcasting: true,
      whatIfAnalysis: true,
      advancedAnalytics: true,
      multiCurrency: true,
      prioritySupport: true,

      // Enterprise Features (Disabled)
      customIntegrations: false,
      whiteLabel: false,
      dedicatedSupport: false,
      slaGuarantees: false,
      advancedSecurity: false,
      auditLogs: false,
      customReports: false,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations requiring enterprise-grade features',
    monthlyPrice: 595,
    annualPrice: 5950, // ~17% discount
    features: {
      // Limits (Unlimited)
      maxUsers: 100,
      maxEntities: 'unlimited',
      maxIntegrations: 'unlimited',
      forecastHorizonMonths: 24,
      dataRetentionMonths: 'unlimited',
      apiCallsPerMonth: 'unlimited',

      // All Features Enabled
      basicDashboards: true,
      inventoryManagement: true,
      orderTracking: true,
      basicReports: true,
      aiForcasting: true,
      whatIfAnalysis: true,
      advancedAnalytics: true,
      multiCurrency: true,
      customIntegrations: true,
      whiteLabel: true,
      prioritySupport: true,
      dedicatedSupport: true,
      slaGuarantees: true,
      advancedSecurity: true,
      auditLogs: true,
      customReports: true,
    },
  },
];

/**
 * Feature Display Names
 */
export const FEATURE_NAMES: Record<keyof TierFeatures, string> = {
  maxUsers: 'Team Members',
  maxEntities: 'Entities (Products, Orders, etc.)',
  maxIntegrations: 'API Integrations',
  forecastHorizonMonths: 'Forecast Horizon',
  dataRetentionMonths: 'Data Retention',
  apiCallsPerMonth: 'API Calls per Month',
  basicDashboards: 'Basic Dashboards',
  inventoryManagement: 'Inventory Management',
  orderTracking: 'Order Tracking',
  basicReports: 'Basic Reports',
  aiForcasting: 'AI-Powered Forecasting',
  whatIfAnalysis: 'What-If Scenario Analysis',
  advancedAnalytics: 'Advanced Analytics',
  multiCurrency: 'Multi-Currency Support',
  customIntegrations: 'Custom Integrations',
  whiteLabel: 'White-Label Branding',
  prioritySupport: 'Priority Support',
  dedicatedSupport: 'Dedicated Support Manager',
  slaGuarantees: 'SLA Guarantees',
  advancedSecurity: 'Advanced Security Features',
  auditLogs: 'Audit Logs',
  customReports: 'Custom Report Builder',
};

/**
 * Feature Descriptions
 */
export const FEATURE_DESCRIPTIONS: Record<keyof TierFeatures, string> = {
  maxUsers: 'Number of team members who can access your account',
  maxEntities: 'Total number of products, orders, and other entities you can manage',
  maxIntegrations: 'Number of external integrations (Shopify, Xero, Amazon, etc.)',
  forecastHorizonMonths: 'How far into the future you can forecast demand',
  dataRetentionMonths: 'How long your historical data is retained',
  apiCallsPerMonth: 'Number of API calls you can make per month',
  basicDashboards: 'Access to standard dashboard views and KPIs',
  inventoryManagement: 'Track inventory levels, reorder points, and stock alerts',
  orderTracking: 'Monitor orders across all sales channels',
  basicReports: 'Generate standard financial and operational reports',
  aiForcasting: 'AI-powered demand forecasting with seasonal pattern detection',
  whatIfAnalysis: 'Model different scenarios to optimize your business decisions',
  advancedAnalytics: 'Deep dive into metrics with advanced visualization',
  multiCurrency: 'Support for multiple currencies and exchange rates',
  customIntegrations: 'Build custom integrations with our API',
  whiteLabel: 'Remove CapLiquify branding and use your own',
  prioritySupport: 'Get faster response times from our support team',
  dedicatedSupport: 'Dedicated account manager for personalized assistance',
  slaGuarantees: '99.9% uptime SLA with financial guarantees',
  advancedSecurity: 'SSO, 2FA, IP whitelisting, and more',
  auditLogs: 'Complete audit trail of all system activities',
  customReports: 'Build custom reports tailored to your business needs',
};

/**
 * Check if a tenant has access to a specific feature
 */
export function canAccessFeature(
  tier: string | SubscriptionTier,
  feature: keyof TierFeatures
): boolean {
  const normalizedTier = tier.toLowerCase() as SubscriptionTier;
  const tierConfig = PRICING_TIERS.find(t => t.id === normalizedTier);

  if (!tierConfig) {
    console.warn(`Unknown subscription tier: ${tier}`);
    return false;
  }

  const featureValue = tierConfig.features[feature];

  // For boolean features, return the value directly
  if (typeof featureValue === 'boolean') {
    return featureValue;
  }

  // For numeric/string limits, having any value means access is granted
  return true;
}

/**
 * Check if current usage is within tier limits
 */
export function isWithinLimit(
  tier: string | SubscriptionTier,
  limitType: keyof TierFeatures,
  currentUsage: number
): boolean {
  const normalizedTier = tier.toLowerCase() as SubscriptionTier;
  const tierConfig = PRICING_TIERS.find(t => t.id === normalizedTier);

  if (!tierConfig) {
    console.warn(`Unknown subscription tier: ${tier}`);
    return false;
  }

  const limit = tierConfig.features[limitType];

  // Unlimited is always within limit
  if (limit === 'unlimited') {
    return true;
  }

  // For boolean features, they're either on or off
  if (typeof limit === 'boolean') {
    return limit;
  }

  // For numeric limits, check if usage is below limit
  return currentUsage < limit;
}

/**
 * Get the tier that unlocks a specific feature
 */
export function getRequiredTier(feature: keyof TierFeatures): SubscriptionTier | null {
  for (const tier of PRICING_TIERS) {
    const featureValue = tier.features[feature];

    if (typeof featureValue === 'boolean' && featureValue) {
      return tier.id;
    }

    if (typeof featureValue === 'number' || featureValue === 'unlimited') {
      return tier.id;
    }
  }

  return null;
}

/**
 * Get upgrade message for a specific feature
 */
export function getUpgradeMessage(
  currentTier: string | SubscriptionTier,
  feature: keyof TierFeatures
): string {
  const requiredTier = getRequiredTier(feature);

  if (!requiredTier) {
    return 'This feature is not available';
  }

  const requiredTierConfig = PRICING_TIERS.find(t => t.id === requiredTier);
  const featureName = FEATURE_NAMES[feature];

  if (!requiredTierConfig) {
    return `Upgrade to unlock ${featureName}`;
  }

  return `Upgrade to ${requiredTierConfig.name} to unlock ${featureName}`;
}

/**
 * Get the next tier upgrade option
 */
export function getNextTier(currentTier: string | SubscriptionTier): PricingTier | null {
  const normalizedTier = currentTier.toLowerCase() as SubscriptionTier;
  const currentIndex = PRICING_TIERS.findIndex(t => t.id === normalizedTier);

  if (currentIndex === -1 || currentIndex === PRICING_TIERS.length - 1) {
    return null;
  }

  return PRICING_TIERS[currentIndex + 1];
}

/**
 * Get available upgrade tiers (all tiers above current)
 */
export function getUpgradeTiers(currentTier: string | SubscriptionTier): PricingTier[] {
  const normalizedTier = currentTier.toLowerCase() as SubscriptionTier;
  const currentIndex = PRICING_TIERS.findIndex(t => t.id === normalizedTier);

  if (currentIndex === -1) {
    return PRICING_TIERS;
  }

  return PRICING_TIERS.slice(currentIndex + 1);
}

/**
 * Format a feature value for display
 */
export function formatFeatureValue(value: number | string | boolean): string {
  if (value === 'unlimited') {
    return 'Unlimited';
  }

  if (typeof value === 'boolean') {
    return value ? 'Included' : 'Not included';
  }

  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  return String(value);
}

/**
 * Get tier configuration by ID
 */
export function getTierConfig(tier: string | SubscriptionTier): PricingTier | null {
  const normalizedTier = tier.toLowerCase() as SubscriptionTier;
  return PRICING_TIERS.find(t => t.id === normalizedTier) || null;
}
