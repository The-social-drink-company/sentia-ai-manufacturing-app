/**
 * API Routes Index
 * Central registration point for all feature API routers
 */

import cashCoverageRoutes from './cash-coverage.js';
import dataPipelineRoutes from './data-pipeline.js';
import financialRoutes from './financial.js';
import inventoryRoutes from './inventory.js';
import maintenanceRoutes from './maintenance.js';
import performanceRoutes from './performance.js';
import productionRoutes from './production.js';
import qualityRoutes from './quality.js';
import shopifyRoutes from './shopify.js';
import strategicPlanningRoutes from './strategic-planning.js';
import supplyChainRoutes from './supply-chain.js';
import userRoutes from './user.js';
import workingCapitalExpertRoutes from './working-capital-expert.js';
import workingCapitalIntelligenceRoutes from './working-capital-intelligence.js';
import { logDebug, logError } from '../../src/utils/logger';

const ROUTE_REGISTRY = [
  { path: '/api/cash-coverage', name: 'Cash Coverage', router: cashCoverageRoutes },
  { path: '/api/data-pipeline', name: 'Data Pipeline', router: dataPipelineRoutes },
  { path: '/api/financial', name: 'Financial', router: financialRoutes },
  { path: '/api/inventory', name: 'Inventory', router: inventoryRoutes },
  { path: '/api/maintenance', name: 'Maintenance', router: maintenanceRoutes },
  { path: '/api/performance', name: 'Performance', router: performanceRoutes },
  { path: '/api/production', name: 'Production', router: productionRoutes },
  { path: '/api/quality', name: 'Quality', router: qualityRoutes },
  { path: '/api/shopify', name: 'Shopify', router: shopifyRoutes },
  { path: '/api/strategic-planning', name: 'Strategic Planning', router: strategicPlanningRoutes },
  { path: '/api/supply-chain', name: 'Supply Chain', router: supplyChainRoutes },
  { path: '/api/users', name: 'User', router: userRoutes },
  { path: '/api/working-capital-expert', name: 'Working Capital Expert', router: workingCapitalExpertRoutes },
  { path: '/api/working-capital-intelligence', name: 'Working Capital Intelligence', router: workingCapitalIntelligenceRoutes }
];

export function setupAPIRoutes(app) {
  logDebug('Registering enterprise API routes...');

  ROUTE_REGISTRY.forEach(({ path, name, router }) => {
    try {
      app.use(path, router);
      logDebug(`[api] ${name} routes mounted at ${path}`);
    } catch (error) {
      logError(`[api] Failed to mount ${name} routes at ${path}: ${error.message}`);
    }
  });

  logDebug('API route registration complete.');
}

export default setupAPIRoutes;


