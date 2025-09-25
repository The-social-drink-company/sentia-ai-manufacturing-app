import { ClerkProvider, useAuth, useUser, useClerk, useOrganization } from '@clerk/clerk-react';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CLERK_DOMAIN = import.meta.env.VITE_CLERK_DOMAIN || 'clerk.financeflo.ai';

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('CLERK_PUBLISHABLE_KEY is required. No mock authentication allowed.');
}

if (!CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
  throw new Error('Invalid Clerk publishable key. Must start with pk_.');
}

export const clerkConfig = {
  publishableKey: CLERK_PUBLISHABLE_KEY,
  appearance: {
    elements: {
      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
      card: 'shadow-xl'
    }
  },
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/dashboard'
};

const permissions = {
  ADMIN: ['*'],
  MANAGER: ['dashboard.*', 'reports.*', 'analytics.*', 'production.view'],
  OPERATOR: ['production.*', 'quality.*', 'inventory.*', 'dashboard.view'],
  VIEWER: ['dashboard.view', 'reports.view']
};

export const getUserRole = async (user) => {
  if (!user) {
    throw new Error('User not authenticated');
  }

  const role = user.publicMetadata?.role || 'VIEWER';
  const validRoles = ['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'];

  if (!validRoles.includes(role)) {
    console.error('Invalid role from Clerk:', role);
    return 'VIEWER';
  }

  return role;
};

export const checkPermission = (userRole, requiredPermission) => {
  const userPermissions = permissions[userRole] || [];

  if (userPermissions.includes('*')) return true;

  return userPermissions.some((perm) => {
    if (perm.endsWith('*')) {
      return requiredPermission.startsWith(perm.slice(0, -1));
    }
    return perm === requiredPermission;
  });
};

export const requireAuth = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    throw new Error('Clerk not loaded');
  }

  if (!isSignedIn) {
    throw new Error('Authentication required. No anonymous access allowed.');
  }

  return true;
};

export const getAuthToken = async () => {
  const { getToken } = useAuth();
  const token = await getToken();

  if (!token) {
    throw new Error('Failed to get authentication token. No mock tokens allowed.');
  }

  return token;
};

export const handleAuthError = (error) => {
  console.error('Authentication error:', error);
  window.location.href = '/sign-in';
};

export {
  ClerkProvider,
  useAuth,
  useUser,
  useClerk,
  useOrganization
};

export default {
  ClerkProvider,
  clerkConfig,
  getUserRole,
  checkPermission,
  requireAuth,
  getAuthToken,
  handleAuthError,
  useAuth,
  useUser,
  useClerk,
  useOrganization
};

