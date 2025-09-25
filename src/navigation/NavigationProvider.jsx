import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logInfo, logWarn } from '../services/observability/structuredLogger.js';

const NavigationContext = createContext(null);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Navigation breadcrumb generator
const generateBreadcrumbs = (pathname) => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Dashboard', path: '/dashboard' }];
  
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Skip dashboard as it's already added
    if (segment === 'dashboard') return;
    
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      label,
      path: currentPath,
      isLast: index === pathSegments.length - 1
    });
  });
  
  return breadcrumbs;
};

// Context-aware navigation suggestions
const getNavigationSuggestions = (currentPath, userRole, recentVisits) => {
  const suggestions = [];
  
  // Role-based suggestions
  const roleSuggestions = {
    admin: [
      { label: 'System Settings', path: '/admin/settings', priority: 3 },
      { label: 'User Management', path: '/admin/users', priority: 2 },
      { label: 'API Status', path: '/api-status', priority: 1 }
    ],
    manager: [
      { label: 'Financial Reports', path: '/financial-reports', priority: 3 },
      { label: 'Production Overview', path: '/production', priority: 2 },
      { label: 'Quality Management', path: '/quality', priority: 1 }
    ],
    operator: [
      { label: 'Production Tracking', path: '/production/tracking', priority: 3 },
      { label: 'Quality Control', path: '/quality/basic', priority: 2 },
      { label: 'Inventory Status', path: '/inventory', priority: 1 }
    ]
  };
  
  // Context-aware suggestions based on current location
  const contextSuggestions = {
    '/dashboard': [
      { label: 'Working Capital Analysis', path: '/working-capital', reason: 'financial-overview' },
      { label: 'Production Optimization', path: '/production', reason: 'operational-efficiency' },
      { label: 'Demand Forecasting', path: '/forecasting', reason: 'ai-insights' }
    ],
    '/working-capital': [
      { label: 'Financial Reports', path: '/financial-reports', reason: 'detailed-analysis' },
      { label: 'What-If Analysis', path: '/what-if', reason: 'scenario-planning' },
      { label: 'Cost Analysis', path: '/cost-analysis', reason: 'cost-optimization' }
    ],
    '/production': [
      { label: 'Inventory Management', path: '/inventory', reason: 'supply-chain' },
      { label: 'Quality Control', path: '/quality', reason: 'production-quality' },
      { label: 'Maintenance', path: '/maintenance', reason: 'equipment-health' }
    ],
    '/forecasting': [
      { label: 'AI Analytics', path: '/ai-analytics', reason: 'advanced-insights' },
      { label: 'Inventory Planning', path: '/inventory', reason: 'demand-alignment' },
      { label: 'Production Planning', path: '/production/optimization', reason: 'capacity-planning' }
    ]
  };
  
  // Add role-based suggestions
  if (roleSuggestions[userRole]) {
    suggestions.push(...roleSuggestions[userRole]);
  }
  
  // Add context-aware suggestions
  if (contextSuggestions[currentPath]) {
    suggestions.push(...contextSuggestions[currentPath]);
  }
  
  // Add frequently visited pages (excluding current)
  const frequentSuggestions = recentVisits
    .filter(visit => visit.path !== currentPath)
    .slice(0, 3)
    .map(visit => ({
      label: visit.title,
      path: visit.path,
      reason: 'frequently-visited',
      visitCount: visit.count
    }));
  
  suggestions.push(...frequentSuggestions);
  
  return suggestions.slice(0, 6); // Limit to 6 suggestions
};

// Quick actions based on current context
const getQuickActions = (currentPath, userRole) => {
  const baseActions = [
    { label: 'Export Data', action: 'export', icon: 'download' },
    { label: 'Refresh', action: 'refresh', icon: 'refresh' },
    { label: 'Share', action: 'share', icon: 'share' }
  ];
  
  const contextActions = {
    '/dashboard': [
      { label: 'Customize Layout', action: 'customize-layout', icon: 'layout' },
      { label: 'Add Widget', action: 'add-widget', icon: 'plus' }
    ],
    '/working-capital': [
      { label: 'Generate Report', action: 'generate-report', icon: 'document' },
      { label: 'Run Analysis', action: 'run-analysis', icon: 'chart' }
    ],
    '/production': [
      { label: 'Start Production', action: 'start-production', icon: 'play' },
      { label: 'Schedule Maintenance', action: 'schedule-maintenance', icon: 'calendar' }
    ],
    '/inventory': [
      { label: 'Reorder Stock', action: 'reorder-stock', icon: 'shopping-cart' },
      { label: 'Audit Inventory', action: 'audit-inventory', icon: 'check-circle' }
    ]
  };
  
  const actions = [...baseActions];
  if (contextActions[currentPath]) {
    actions.push(...contextActions[currentPath]);
  }
  
  return actions;
};

export const NavigationProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role: userRole, hasPermission } = useAuthRole();
  
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [recentVisits, setRecentVisits] = useState(() => {
    const saved = localStorage.getItem('sentia-recent-visits');
    return saved ? JSON.parse(saved) : [];
  });
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Update navigation state when location changes
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Update breadcrumbs
    const newBreadcrumbs = generateBreadcrumbs(currentPath);
    setBreadcrumbs(newBreadcrumbs);
    
    // Update navigation history
    setNavigationHistory(prev => {
      const newHistory = [...prev, {
        path: currentPath,
        timestamp: Date.now(),
        title: newBreadcrumbs[newBreadcrumbs.length - 1]?.label || 'Unknown'
      }];
      return newHistory.slice(-50); // Keep last 50 entries
    });
    
    // Update recent visits
    setRecentVisits(prev => {
      const existingIndex = prev.findIndex(visit => visit.path === currentPath);
      let newVisits;
      
      if (existingIndex >= 0) {
        // Update existing visit
        newVisits = [...prev];
        newVisits[existingIndex] = {
          ...newVisits[existingIndex],
          count: newVisits[existingIndex].count + 1,
          lastVisit: Date.now()
        };
      } else {
        // Add new visit
        newVisits = [...prev, {
          path: currentPath,
          title: newBreadcrumbs[newBreadcrumbs.length - 1]?.label || 'Unknown',
          count: 1,
          firstVisit: Date.now(),
          lastVisit: Date.now()
        }];
      }
      
      // Sort by visit count and recency
      newVisits.sort((a, b) => {
        const aScore = a.count * 0.7 + (Date.now() - a.lastVisit) * -0.3;
        const bScore = b.count * 0.7 + (Date.now() - b.lastVisit) * -0.3;
        return bScore - aScore;
      });
      
      const trimmedVisits = newVisits.slice(0, 20); // Keep top 20
      localStorage.setItem('sentia-recent-visits', JSON.stringify(trimmedVisits));
      return trimmedVisits;
    });
    
    // Update context-aware suggestions
    const newSuggestions = getNavigationSuggestions(currentPath, userRole, recentVisits);
    setSuggestions(newSuggestions);
    
    // Update quick actions
    const newQuickActions = getQuickActions(currentPath, userRole);
    setQuickActions(newQuickActions);
    
    logInfo('Navigation context updated', {
      path: currentPath,
      breadcrumbsCount: newBreadcrumbs.length,
      suggestionsCount: newSuggestions.length,
      userRole
    });
  }, [location.pathname, userRole, recentVisits]);
  
  // Smart navigation with permission checking
  const navigateToPath = useCallback((path, options = {}) => {
    const { checkPermissions = true, replace = false } = options;
    
    // Basic permission check (extend based on your permission system)
    if (checkPermissions) {
      const restrictedPaths = {
        '/admin': 'admin.access',
        '/admin/users': 'admin.users',
        '/admin/settings': 'admin.settings'
      };
      
      for (const [restrictedPath, permission] of Object.entries(restrictedPaths)) {
        if (path.startsWith(restrictedPath) && !hasPermission(permission)) {
          logWarn('Navigation blocked due to insufficient permissions', {
            path,
            requiredPermission: permission,
            userRole
          });
          return false;
        }
      }
    }
    
    setIsNavigating(true);
    
    try {
      if (replace) {
        navigate(path, { replace: true });
      } else {
        navigate(path);
      }
      
      logInfo('Navigation successful', { path, replace });
      return true;
    } catch (error) {
      logWarn('Navigation failed', { path, error: error.message });
      return false;
    } finally {
      // Reset navigation state after a brief delay
      setTimeout(() => setIsNavigating(false), 300);
    }
  }, [navigate, hasPermission, userRole]);
  
  // Go back with intelligent fallback
  const goBack = useCallback(() => {
    if (navigationHistory.length > 1) {
      const previousPath = navigationHistory[navigationHistory.length - 2]?.path;
      if (previousPath) {
        navigateToPath(previousPath, { replace: true });
        return;
      }
    }
    
    // Fallback to dashboard if no history
    navigateToPath('/dashboard', { replace: true });
  }, [navigationHistory, navigateToPath]);
  
  // Execute quick action
  const executeQuickAction = useCallback((action) => {
    switch (action) {
      case 'export':
        // Trigger export functionality
        window.dispatchEvent(new CustomEvent('sentia-export-data'));
        break;
      case 'refresh':
        window.location.reload();
        break;
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: document.title,
            url: window.location.href
          });
        } else {
          navigator.clipboard.writeText(window.location.href);
        }
        break;
      case 'customize-layout':
        window.dispatchEvent(new CustomEvent('sentia-customize-layout'));
        break;
      case 'add-widget':
        window.dispatchEvent(new CustomEvent('sentia-add-widget'));
        break;
      default:
        logWarn('Unknown quick action', { action });
    }
    
    logInfo('Quick action executed', { action, currentPath: location.pathname });
  }, [location.pathname]);
  
  const contextValue = {
    // Current navigation state
    currentPath: location.pathname,
    breadcrumbs,
    suggestions,
    quickActions,
    navigationHistory,
    recentVisits,
    isNavigating,
    
    // Navigation methods
    navigateToPath,
    goBack,
    executeQuickAction,
    
    // User context
    userRole,
    hasPermission
  };
  
  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationProvider;