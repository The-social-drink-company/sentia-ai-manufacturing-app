/**
 * Feature Flag Middleware - Subscription Tier Enforcement
 *
 * BMAD-MULTITENANT-002 Story 2: Feature Flag Middleware
 *
 * This middleware enforces subscription tier restrictions by blocking
 * access to features that are not available in the tenant's subscription tier.
 *
 * Feature flags are stored in tenant.features (JSONB) and include:
 * - basic_forecasting (all tiers)
 * - ai_forecasting (Professional+)
 * - what_if_analysis (Professional+)
 * - multi_entity (Enterprise only)
 * - api_access (Enterprise only)
 * - white_label (Enterprise only)
 * - priority_support (Professional+)
 * - advanced_reports (Enterprise only)
 * - custom_integrations (Enterprise only)
 *
 * Usage:
 * ```ts
 * // Require AI forecasting feature (Professional+ tier)
 * router.get(
 *   '/api/forecasts/ai',
 *   tenantMiddleware,
 *   requireFeature('ai_forecasting'),
 *   getAIForecastsHandler
 * );
 *
 * // Require multiple features
 * router.post(
 *   '/api/reports/custom',
 *   tenantMiddleware,
 *   requireFeature('advanced_reports'),
 *   requireFeature('api_access'),
 *   createCustomReportHandler
 * );
 * ```
 *
 * Security:
 * - Prevents Starter tier from accessing Professional/Enterprise features
 * - Prevents Professional tier from accessing Enterprise features
 * - Returns 403 with upgrade URL for blocked features
 *
 * @module server/middleware/feature.middleware
 */

import { Request, Response, NextFunction } from 'express';

// ================================
// Feature Flag Types
// ================================

/**
 * All available feature flags in CapLiquify
 *
 * These map directly to keys in tenant.features JSONB column
 */
export type FeatureFlag =
  | 'basic_forecasting'       // All tiers
  | 'ai_forecasting'          // Professional+
  | 'what_if_analysis'        // Professional+
  | 'multi_entity'            // Enterprise only
  | 'api_access'              // Enterprise only
  | 'white_label'             // Enterprise only
  | 'priority_support'        // Professional+
  | 'advanced_reports'        // Enterprise only
  | 'custom_integrations';    // Enterprise only

/**
 * Feature flag descriptions for error messages
 */
const FEATURE_DESCRIPTIONS: Record<FeatureFlag, string> = {
  basic_forecasting: 'Basic Demand Forecasting',
  ai_forecasting: 'AI-Powered Demand Forecasting',
  what_if_analysis: 'What-If Scenario Modeling',
  multi_entity: 'Multi-Entity Management',
  api_access: 'API Access & Integrations',
  white_label: 'White-Label Branding',
  priority_support: 'Priority Customer Support',
  advanced_reports: 'Advanced Custom Reports',
  custom_integrations: 'Custom Integration Development'
};

/**
 * Minimum tier required for each feature
 */
const FEATURE_TIERS: Record<FeatureFlag, string[]> = {
  basic_forecasting: ['starter', 'professional', 'enterprise'],
  ai_forecasting: ['professional', 'enterprise'],
  what_if_analysis: ['professional', 'enterprise'],
  multi_entity: ['enterprise'],
  api_access: ['enterprise'],
  white_label: ['enterprise'],
  priority_support: ['professional', 'enterprise'],
  advanced_reports: ['enterprise'],
  custom_integrations: ['enterprise']
};

// ================================
// Feature Flag Middleware
// ================================

/**
 * Factory function to create feature flag middleware
 *
 * Returns middleware that checks if tenant has access to the specified feature.
 * If not, returns 403 with upgrade information.
 *
 * @param featureName - The feature flag to check
 * @returns Express middleware function
 *
 * @example
 * // Block Starter tier from AI forecasting
 * router.get('/api/forecasts/ai', requireFeature('ai_forecasting'), handler);
 *
 * @example
 * // Block non-Enterprise from multi-entity
 * router.post('/api/entities', requireFeature('multi_entity'), handler);
 */
export function requireFeature(featureName: FeatureFlag) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // ====================================
    // STEP 1: Ensure tenant context exists
    // ====================================
    if (!req.tenant) {
      res.status(401).json({
        success: false,
        error: 'tenant_not_identified',
        message: 'Tenant context not established. Please ensure tenantMiddleware runs before feature middleware.',
        hint: 'Use: router.use(tenantMiddleware) before feature-protected routes'
      });
      return;
    }

    // ====================================
    // STEP 2: Check if feature is enabled
    // ====================================
    const hasFeature = req.tenant.features[featureName];

    if (!hasFeature) {
      // Get minimum tier required for this feature
      const requiredTiers = FEATURE_TIERS[featureName] || [];
      const minTier = requiredTiers.length > 0
        ? requiredTiers[0] === 'enterprise'
          ? 'Enterprise'
          : 'Professional'
        : 'Unknown';

      res.status(403).json({
        success: false,
        error: 'feature_not_available',
        message: `This feature (${FEATURE_DESCRIPTIONS[featureName]}) is not available in your subscription tier.`,
        feature: featureName,
        currentTier: req.tenant.subscriptionTier,
        requiredTier: minTier,
        upgradeUrl: '/billing/upgrade',
        documentation: `/docs/features/${featureName}`
      });
      return;
    }

    // ====================================
    // SUCCESS: Feature is enabled, proceed
    // ====================================
    next();
  };
}

/**
 * Middleware to require ANY of the specified features
 *
 * Useful when a route can be accessed if the user has at least one
 * of several features enabled.
 *
 * @param features - Array of feature flags to check (OR condition)
 * @returns Express middleware function
 *
 * @example
 * // Allow if user has either basic OR ai forecasting
 * router.get(
 *   '/api/forecasts',
 *   requireAnyFeature(['basic_forecasting', 'ai_forecasting']),
 *   getForecastsHandler
 * );
 */
export function requireAnyFeature(features: FeatureFlag[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      res.status(401).json({
        success: false,
        error: 'tenant_not_identified',
        message: 'Tenant context not established.'
      });
      return;
    }

    // Check if tenant has ANY of the required features
    const hasAnyFeature = features.some(feature => req.tenant!.features[feature]);

    if (!hasAnyFeature) {
      const featureNames = features.map(f => FEATURE_DESCRIPTIONS[f]).join(' OR ');

      res.status(403).json({
        success: false,
        error: 'insufficient_features',
        message: `This action requires at least one of: ${featureNames}`,
        requiredFeatures: features,
        currentTier: req.tenant.subscriptionTier,
        upgradeUrl: '/billing/upgrade'
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require ALL of the specified features
 *
 * Useful when a route requires multiple features to be enabled.
 *
 * @param features - Array of feature flags to check (AND condition)
 * @returns Express middleware function
 *
 * @example
 * // Require both API access AND custom integrations
 * router.post(
 *   '/api/integrations/custom',
 *   requireAllFeatures(['api_access', 'custom_integrations']),
 *   createIntegrationHandler
 * );
 */
export function requireAllFeatures(features: FeatureFlag[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      res.status(401).json({
        success: false,
        error: 'tenant_not_identified',
        message: 'Tenant context not established.'
      });
      return;
    }

    // Check if tenant has ALL of the required features
    const missingFeatures = features.filter(feature => !req.tenant!.features[feature]);

    if (missingFeatures.length > 0) {
      const missingNames = missingFeatures.map(f => FEATURE_DESCRIPTIONS[f]).join(', ');

      res.status(403).json({
        success: false,
        error: 'missing_required_features',
        message: `This action requires the following features: ${missingNames}`,
        missingFeatures,
        currentTier: req.tenant.subscriptionTier,
        upgradeUrl: '/billing/upgrade'
      });
      return;
    }

    next();
  };
}

/**
 * Helper function to check feature availability (non-middleware)
 *
 * Use this in route handlers when you want to conditionally enable
 * functionality without blocking the entire request.
 *
 * @param req - Express request object
 * @param featureName - Feature flag to check
 * @returns true if feature is enabled, false otherwise
 *
 * @example
 * // Conditionally include AI forecasts if feature enabled
 * async function getDashboardData(req, res) {
 *   const data = { ... };
 *
 *   if (hasFeature(req, 'ai_forecasting')) {
 *     data.aiForecast = await getAIForecast();
 *   }
 *
 *   res.json(data);
 * }
 */
export function hasFeature(req: Request, featureName: FeatureFlag): boolean {
  return req.tenant?.features[featureName] === true;
}

/**
 * Helper function to get all enabled features for a tenant
 *
 * @param req - Express request object
 * @returns Array of enabled feature names
 *
 * @example
 * // Return list of available features to frontend
 * async function getAvailableFeatures(req, res) {
 *   const enabledFeatures = getEnabledFeatures(req);
 *   res.json({ features: enabledFeatures });
 * }
 */
export function getEnabledFeatures(req: Request): FeatureFlag[] {
  if (!req.tenant) {
    return [];
  }

  return Object.keys(req.tenant.features)
    .filter(feature => req.tenant!.features[feature])
    .map(feature => feature as FeatureFlag);
}

// ================================
// Export
// ================================

export default requireFeature;
