import { useMemo } from 'react';
import {
  DEFAULT_AUTH_STATE,
  useAuthRole as useBulletproofRole,
  useBulletproofAuth,
} from '../auth/BulletproofAuthProvider';

const ROLE_HIERARCHY = {
  master_admin: 5,
  admin: 4,
  manager: 3,
  operator: 2,
  viewer: 1,
};

const RESOURCE_PERMISSIONS = {
  dashboard: ['read'],
  analytics: ['read'],
  forecasting: ['read', 'write'],
  inventory: ['read', 'write'],
  production: ['read', 'write'],
  quality: ['read', 'write'],
  financial: ['read', 'financial'],
  admin: ['admin'],
  settings: ['read', 'settings'],
  monitoring: ['read'],
  data: ['read'],
};

const LOADING_STATE = {
  isLoading: true,
  isAuthenticated: false,
  authMode: 'unavailable',
  user: null,
  role: 'viewer',
  permissions: [],
  features: {},
  hasRole: () => false,
  hasPermission: () => false,
  hasFeature: () => false,
  isRoleAtLeast: () => false,
  getUserDisplayName: () => 'Loading...',
  getUserInitials: () => '...',
  canAccess: () => false,
  isSignedIn: false,
  userEmail: '',
  userName: 'Loading...',
};

const DEFAULT_FEATURES = {
  master_admin: {
    aiAnalytics: true,
    advancedReporting: true,
    customDashboards: true,
    apiAccess: true,
    bulkOperations: true,
    auditLogs: true,
  },
  admin: {
    aiAnalytics: true,
    advancedReporting: true,
    customDashboards: true,
    apiAccess: true,
    bulkOperations: true,
    auditLogs: true,
  },
  manager: {
    aiAnalytics: true,
    advancedReporting: true,
    customDashboards: true,
    apiAccess: false,
    bulkOperations: true,
    auditLogs: false,
  },
  operator: {
    aiAnalytics: false,
    advancedReporting: false,
    customDashboards: true,
    apiAccess: false,
    bulkOperations: false,
    auditLogs: false,
  },
  viewer: {
    aiAnalytics: false,
    advancedReporting: false,
    customDashboards: false,
    apiAccess: false,
    bulkOperations: false,
    auditLogs: false,
  },
};

const DEFAULT_PERMISSIONS = {
  master_admin: ['*'],
  admin: ['*'],
  manager: ['read', 'write', 'delete', 'financial', 'settings', 'manage_team'],
  operator: ['read', 'write', 'update'],
  viewer: ['read'],
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
};

const toFeatureMap = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return {};
};

const pickRole = (roleCandidate) => {
  if (typeof roleCandidate !== 'string') {
    return 'viewer';
  }
  const normalized = roleCandidate.toLowerCase();
  return ROLE_HIERARCHY[normalized] ? normalized : 'viewer';
};

const computeInitials = (name) => {
  if (!name) return 'GU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const selectPermissions = (role, ...options) => {
  for (const option of options) {
    const arrayValue = toArray(option);
    if (arrayValue.length > 0) {
      return arrayValue;
    }
  }
  return DEFAULT_PERMISSIONS[role] ?? DEFAULT_PERMISSIONS.viewer;
};

const selectFeatures = (role, ...options) => (
  Object.assign({}, DEFAULT_FEATURES[role] ?? DEFAULT_FEATURES.viewer, ...options.map(toFeatureMap))
);

const resolveEmail = (auth, mode, fallbackRole) => {
  const user = auth.user;
  if (!user) {
    return mode === 'clerk' ? 'user@sentia.local' : 'guest@sentia.local';
  }
  return (
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses?.[0]?.emailAddress ??
    user.emailAddress ??
    (fallbackRole === 'viewer' ? 'guest@sentia.local' : 'user@sentia.local')
  );
};

const resolveDisplayName = (auth) => {
  const user = auth.user;
  if (!user) return 'Guest User';
  const fallback = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return user.fullName ?? fallback || user.username || 'Sentia User';
};

export const useAuthRole = () => {
  const auth = useBulletproofAuth() ?? DEFAULT_AUTH_STATE;
  const bulletproofRole = useBulletproofRole ? useBulletproofRole() : null;

  return useMemo(() => {
    const authMode = auth.mode ?? 'unavailable';

    if (!auth.isLoaded) {
      return {
        ...LOADING_STATE,
        authMode,
      };
    }

    const effectiveIsSignedIn = authMode === 'clerk' && Boolean(auth.isSignedIn);

    const role = pickRole(
      bulletproofRole?.role ?? auth.user?.publicMetadata?.role ?? 'viewer'
    );

    const permissions = selectPermissions(
      role,
      bulletproofRole?.permissions,
      auth.user?.publicMetadata?.permissions
    );

    const features = selectFeatures(
      role,
      auth.user?.publicMetadata?.features,
      bulletproofRole?.features
    );

    const displayName = resolveDisplayName(auth);
    const userEmail = resolveEmail(auth, authMode, role);

    const hasRole = (roleToCheck) => role === roleToCheck;
    const hasPermission = (permission) =>
      role === 'master_admin' ||
      role === 'admin' ||
      permissions.includes('*') ||
      permissions.includes(permission);
    const hasFeature = (feature) =>
      role === 'master_admin' || role === 'admin' || Boolean(features[feature]);
    const isRoleAtLeast = (minimumRole) =>
      (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 0);
    const canAccess = (resource) => {
      if (role === 'master_admin' || role === 'admin') return true;
      const required = RESOURCE_PERMISSIONS[resource] ?? ['read'];
      return required.some((perm) => hasPermission(perm));
    };

    return {
      isLoading: false,
      isAuthenticated: effectiveIsSignedIn,
      authMode,
      user: auth.user ?? null,
      role,
      permissions,
      features,
      hasRole,
      hasPermission,
      hasFeature,
      isRoleAtLeast,
      getUserDisplayName: () => displayName,
      getUserInitials: () => computeInitials(displayName),
      canAccess,
      isSignedIn: effectiveIsSignedIn,
      userEmail,
      userName: displayName,
    };
  }, [auth, bulletproofRole]);
};

export default useAuthRole;
