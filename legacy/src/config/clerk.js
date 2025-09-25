// Clerk Configuration
// Centralized configuration for Clerk authentication

const getClerkConfig = () => {
  const windowRef = typeof window !== 'undefined' ? window : undefined;
  const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  const runtimeEnv = metaEnv || windowRef?.import?.meta?.env || windowRef?.clerkEnv || {};

  const publishableKey =
    runtimeEnv?.VITE_CLERK_PUBLISHABLE_KEY ||
    windowRef?.VITE_CLERK_PUBLISHABLE_KEY ||
    '';

  return {
    publishableKey,
    signInUrl: runtimeEnv?.VITE_CLERK_SIGN_IN_URL || '/sign-in',
    signUpUrl: runtimeEnv?.VITE_CLERK_SIGN_UP_URL || '/sign-up',
    afterSignInUrl: runtimeEnv?.VITE_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
    afterSignUpUrl: runtimeEnv?.VITE_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
    signOutUrl: runtimeEnv?.VITE_CLERK_SIGN_OUT_URL || '/',
    apiUrl: runtimeEnv?.VITE_API_BASE_URL || '/api',
    mcpServerUrl: runtimeEnv?.VITE_MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com',
    appearance: {
      baseTheme: 'light',
      variables: {
        colorPrimary: '#3b82f6',
        colorTextOnPrimaryBackground: '#ffffff',
        colorBackground: '#ffffff',
        colorInputBackground: '#f3f4f6',
        colorInputText: '#1f2937',
        borderRadius: '0.5rem',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      },
      elements: {
        formButtonPrimary: {
          backgroundColor: '#3b82f6',
          '&:hover': {
            backgroundColor: '#2563eb'
          }
        },
        card: {
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          borderRadius: '0.75rem'
        },
        headerTitle: {
          fontSize: '1.5rem',
          fontWeight: '600'
        },
        socialButtonsIconButton: {
          border: '1px solid #e5e7eb',
          '&:hover': {
            backgroundColor: '#f9fafb'
          }
        }
      }
    }
  };
};

export const clerkConfig = getClerkConfig();

// Public routes that don't require authentication
export const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/sign-in/*',
  '/sign-up/*',
  '/health',
  '/api/health',
  '/api/status',
  '/clerk-init.js'
];

// Helper function to check if a route is public
export const isPublicRoute = (pathname) =>
  publicRoutes.some((route) => {
    if (route.endsWith('/*')) {
      const baseRoute = route.slice(0, -2);
      return pathname.startsWith(baseRoute);
    }
    return pathname === route;
  });

if ((typeof import.meta !== 'undefined' && import.meta.env?.DEV) || typeof window !== 'undefined') {
  if (!clerkConfig.publishableKey) {
    console.warn('[Clerk Config] Publishable key is not set. Real Clerk authentication will not initialize.');
  }
}

export default clerkConfig;

