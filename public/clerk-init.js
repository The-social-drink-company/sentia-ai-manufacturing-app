// Clerk Environment Initialization
// This file ensures Clerk environment variables are available before the React app loads

(function() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;

  // Initialize environment variables for Clerk
  // These will be injected by the server or use defaults
  const clerkEnv = {
    VITE_CLERK_PUBLISHABLE_KEY: window.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk',
    VITE_MCP_SERVER_URL: window.VITE_MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com',
    VITE_API_BASE_URL: window.VITE_API_BASE_URL || '/api',
    // Clerk routing configuration
    VITE_CLERK_SIGN_IN_URL: '/sign-in',
    VITE_CLERK_SIGN_UP_URL: '/sign-up',
    VITE_CLERK_AFTER_SIGN_IN_URL: '/dashboard',
    VITE_CLERK_AFTER_SIGN_UP_URL: '/dashboard',
    VITE_CLERK_SIGN_OUT_URL: '/'
  };

  // Make environment variables available globally
  window.clerkEnv = clerkEnv;

  // Also set on import.meta.env for Vite compatibility
  if (!window.import) window.import = {};
  if (!window.import.meta) window.import.meta = {};
  if (!window.import.meta.env) window.import.meta.env = {};

  // Copy all Clerk environment variables to import.meta.env
  Object.keys(clerkEnv).forEach(key => {
    window.import.meta.env[key] = clerkEnv[key];
  });

  // Debug logging (only in development)
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('development')) {
    console.log('[Clerk Init] Environment variables initialized:', {
      publishableKey: clerkEnv.VITE_CLERK_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
      signInUrl: clerkEnv.VITE_CLERK_SIGN_IN_URL,
      afterSignInUrl: clerkEnv.VITE_CLERK_AFTER_SIGN_IN_URL
    });
  }
})();