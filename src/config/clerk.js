// Clerk Configuration
// Centralized configuration for Clerk authentication

// Get Clerk environment variables with fallbacks
const getClerkConfig = () => {
  // Try multiple sources for environment variables
  const env = import.meta.env || window.import?.meta?.env || window.clerkEnv || {};

  return {
    publishableKey: env.VITE_CLERK_PUBLISHABLE_KEY ||
                    window.VITE_CLERK_PUBLISHABLE_KEY ||
                    'pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk',

    // URLs for Clerk navigation
    signInUrl: env.VITE_CLERK_SIGN_IN_URL || '/sign-in',
    signUpUrl: env.VITE_CLERK_SIGN_UP_URL || '/sign-up',
    afterSignInUrl: env.VITE_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
    afterSignUpUrl: env.VITE_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
    signOutUrl: env.VITE_CLERK_SIGN_OUT_URL || '/',

    // API configuration
    apiUrl: env.VITE_API_BASE_URL || '/api',
    mcpServerUrl: env.VITE_MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com',

    // Appearance customization
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
export const isPublicRoute = (pathname) => {
  return publicRoutes.some(route => {
    if (route.endsWith('/*')) {
      const baseRoute = route.slice(0, -2);
      return pathname.startsWith(baseRoute);
    }
    return pathname === route;
  });
};

// Debug logging for development
if (import.meta.env.DEV || window.location.hostname === 'localhost') {
  console.log('[Clerk Config] Initialized with:', {
    publishableKey: clerkConfig.publishableKey ? 'SET' : 'MISSING',
    signInUrl: clerkConfig.signInUrl,
    afterSignInUrl: clerkConfig.afterSignInUrl,
    apiUrl: clerkConfig.apiUrl
  });
}

export default clerkConfig;