/**
 * Centralized Route Configuration
 * Manages all application routes with metadata and access control
 */

export const ROUTES = {
  // Public Routes
  PUBLIC: {
    LANDING: '/',
    LOGIN: '/login',
    SIGNUP: '/signup',
  },

  // Core Dashboard Routes
  DASHBOARD: {
    HOME: '/dashboard',
    BASIC: '/dashboard/basic',
    ENHANCED: '/dashboard/enhanced',
    ENTERPRISE: '/dashboard/enterprise',
    TEST_MONITOR: '/dashboard/test-monitor'
  },

  // Financial Management
  FINANCIAL: {
    HOME: '/financial',
    WORKING_CAPITAL: '/working-capital',
    WORKING_CAPITAL_BASIC: '/working-capital/basic',
    WORKING_CAPITAL_ENHANCED: '/working-capital/enhanced',
    REPORTS: '/financial-reports',
    COST_ANALYSIS: '/cost-analysis',
    WHAT_IF: '/what-if'
  },

  // Operations Management
  OPERATIONS: {
    INVENTORY: '/inventory',
    INVENTORY_BASIC: '/inventory/basic',
    PRODUCTION: '/production',
    PRODUCTION_TRACKING: '/production/tracking',
    PRODUCTION_OPTIMIZATION: '/production/optimization',
    QUALITY: '/quality',
    QUALITY_BASIC: '/quality/basic',
    QUALITY_MANAGEMENT: '/quality/management',
    WORKFLOW: '/operations/workflow'
  },

  // Analytics & Intelligence
  ANALYTICS: {
    HOME: '/analytics',
    AI_ANALYTICS: '/ai-analytics',
    AI_STATUS: '/ai-status',
    AI_INSIGHTS: '/ai-insights',
    PREDICTIVE: '/predictive-analytics',
    FORECASTING: '/forecasting',
    FORECASTING_BASIC: '/forecasting/basic'
  },

  // Maintenance & Monitoring
  MONITORING: {
    REALTIME: '/monitoring',
    MCP: '/mcp-monitor',
    API_STATUS: '/api-status',
    MAINTENANCE: '/maintenance',
    PREDICTIVE_MAINTENANCE: '/maintenance/predictive'
  },

  // Intelligence Systems
  INTELLIGENCE: {
    MANUFACTURING: '/intelligence/manufacturing',
    QUALITY: '/intelligence/quality'
  },

  // Innovation & Advanced Features
  INNOVATION: {
    DIGITAL_TWIN: '/innovation/digital-twin',
    AUTOMATION: '/automation'
  },

  // Compliance & Audit
  COMPLIANCE: {
    GLOBAL: '/compliance/global',
    AUDIT_LOGS: '/audit-logs'
  },

  // Data Management
  DATA: {
    IMPORT: '/data-import',
    TEMPLATES: '/templates'
  },

  // User & Admin
  USER: {
    SETTINGS: '/settings',
    PREFERENCES: '/preferences',
    PROFILE: '/user-profile',
    ONBOARDING: '/onboarding'
  },

  ADMIN: {
    HOME: '/admin',
    OVERVIEW: '/admin/overview',
    USERS: '/admin/users',
    INTEGRATIONS: '/admin/integrations',
    QUALITY: '/admin/quality',
    MAINTENANCE: '/admin/maintenance',
    SETTINGS: '/admin/settings'
  },

  // Mobile & UI
  UI: {
    SHOWCASE: '/ui-showcase',
    MOBILE: '/mobile'
  }
};

// Route Metadata for navigation and access control
export const ROUTE_METADATA = {
  [ROUTES.DASHBOARD.HOME]: {
    title: 'Dashboard',
    description: 'Main manufacturing dashboard',
    icon: 'HomeIcon',
    requiresAuth: true,
    allowGuest: true,
    roles: ['admin', 'manager', 'operator', 'viewer']
  },
  [ROUTES.FINANCIAL.WORKING_CAPITAL]: {
    title: 'Working Capital',
    description: 'Working capital management and analysis',
    icon: 'BanknotesIcon',
    requiresAuth: true,
    allowGuest: true,
    roles: ['admin', 'manager']
  },
  [ROUTES.OPERATIONS.INVENTORY]: {
    title: 'Inventory Management',
    description: 'Track and manage inventory levels',
    icon: 'CubeIcon',
    requiresAuth: true,
    allowGuest: true,
    roles: ['admin', 'manager', 'operator']
  },
  [ROUTES.OPERATIONS.PRODUCTION]: {
    title: 'Production Tracking',
    description: 'Monitor production lines and efficiency',
    icon: 'TruckIcon',
    requiresAuth: true,
    allowGuest: true,
    roles: ['admin', 'manager', 'operator']
  },
  [ROUTES.ANALYTICS.FORECASTING]: {
    title: 'Demand Forecasting',
    description: 'AI-powered demand predictions',
    icon: 'PresentationChartLineIcon',
    requiresAuth: true,
    allowGuest: true,
    roles: ['admin', 'manager']
  },
  [ROUTES.ADMIN.HOME]: {
    title: 'Admin Panel',
    description: 'System administration and user management',
    icon: 'CogIcon',
    requiresAuth: true,
    allowGuest: false,
    roles: ['admin']
  }
};

// Navigation Structure for Sidebar/Menu
export const NAVIGATION_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { route: ROUTES.DASHBOARD.HOME, label: 'Dashboard' }
    ]
  },
  {
    title: 'Financial Management',
    items: [
      { route: ROUTES.FINANCIAL.WORKING_CAPITAL, label: 'Working Capital' },
      { route: ROUTES.FINANCIAL.WHAT_IF, label: 'What-If Analysis' },
      { route: ROUTES.FINANCIAL.REPORTS, label: 'Financial Reports' },
      { route: ROUTES.FINANCIAL.COST_ANALYSIS, label: 'Cost Analysis' }
    ]
  },
  {
    title: 'Operations',
    items: [
      { route: ROUTES.OPERATIONS.INVENTORY, label: 'Inventory' },
      { route: ROUTES.OPERATIONS.PRODUCTION, label: 'Production' },
      { route: ROUTES.OPERATIONS.QUALITY, label: 'Quality Control' },
      { route: ROUTES.OPERATIONS.WORKFLOW, label: 'Workflow Automation' }
    ]
  },
  {
    title: 'Analytics & AI',
    items: [
      { route: ROUTES.ANALYTICS.FORECASTING, label: 'Demand Forecasting' },
      { route: ROUTES.ANALYTICS.AI_INSIGHTS, label: 'AI Insights' },
      { route: ROUTES.ANALYTICS.PREDICTIVE, label: 'Predictive Analytics' },
      { route: ROUTES.ANALYTICS.HOME, label: 'Analytics Dashboard' }
    ]
  },
  {
    title: 'Monitoring',
    items: [
      { route: ROUTES.MONITORING.REALTIME, label: 'Real-Time Monitoring' },
      { route: ROUTES.MONITORING.API_STATUS, label: 'API Status' },
      { route: ROUTES.MONITORING.MAINTENANCE, label: 'Maintenance' }
    ]
  },
  {
    title: 'Data Management',
    items: [
      { route: ROUTES.DATA.IMPORT, label: 'Data Import' },
      { route: ROUTES.DATA.TEMPLATES, label: 'Import Templates' }
    ]
  },
  {
    title: 'Administration',
    items: [
      { route: ROUTES.ADMIN.HOME, label: 'Admin Panel' },
      { route: ROUTES.COMPLIANCE.AUDIT_LOGS, label: 'Audit Logs' },
      { route: ROUTES.USER.SETTINGS, label: 'Settings' }
    ]
  }
];

// Helper Functions
export const isProtectedRoute = (path) => {
  return !Object.values(ROUTES.PUBLIC).includes(path);
};

export const getRouteMetadata = (path) => {
  return ROUTE_METADATA[path] || {
    title: 'Page',
    description: '',
    requiresAuth: true,
    allowGuest: true,
    roles: ['admin', 'manager', 'operator', 'viewer']
  };
};

export const canAccessRoute = (path, userRole) => {
  const metadata = getRouteMetadata(path);
  if (!metadata.requiresAuth || metadata.allowGuest) {
    return true;
  }
  return metadata.roles.includes(userRole);
};

export const getNavigationForRole = (userRole) => {
  return NAVIGATION_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      canAccessRoute(item.route, userRole)
    )
  })).filter(section => section.items.length > 0);
};

export default ROUTES;
