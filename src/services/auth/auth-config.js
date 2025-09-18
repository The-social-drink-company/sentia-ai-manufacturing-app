/**
 * CENTRALIZED AUTHENTICATION CONFIGURATION
 *
 * This file manages all Clerk configuration and provides
 * a stable authentication interface that never breaks.
 */

// Clerk configuration with validation
export const clerkConfig = {
  // Get publishable key with validation
  get publishableKey() {
    const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

    // Validate key format
    if (!key) {
      console.warn('[Auth] No Clerk publishable key found, using demo mode');
      return null;
    }

    if (!key.startsWith('pk_test_') && !key.startsWith('pk_live_')) {
      console.error('[Auth] Invalid Clerk key format:', key.substring(0, 15) + '...');
      return null;
    }

    return key;
  },

  // Check if Clerk should be enabled
  get isEnabled() {
    return this.publishableKey !== null && typeof window !== 'undefined';
  },

  // Get the domain from the key
  get domain() {
    const key = this.publishableKey;
    if (!key) return null;

    // Extract domain from key (format: pk_test_[domain].[random].clerk.accounts.dev$)
    try {
      const encoded = key.replace('pk_test_', '').replace('pk_live_', '');
      const decoded = atob(encoded);
      return decoded.split('.')[0];
    } catch {
      return 'unknown';
    }
  },

  // Frontend API URL (if needed)
  get frontendApi() {
    const domain = this.domain;
    if (!domain) return null;
    return `https://${domain}.clerk.accounts.dev`;
  },

  // Sign-in/Sign-up URLs
  signInUrl: '/login',
  signUpUrl: '/signup',
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/dashboard',

  // Appearance configuration
  appearance: {
    elements: {
      rootBox: 'w-full',
      card: 'shadow-lg',
      headerTitle: 'text-2xl font-bold',
      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
      footerActionLink: 'text-blue-600 hover:text-blue-800'
    },
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      colorSuccess: '#16a34a',
      borderRadius: '0.5rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }
};

// Demo/Development mode configuration
export const demoConfig = {
  enabled: !clerkConfig.isEnabled,
  user: {
    id: 'demo_user_' + Date.now(),
    emailAddresses: [{
      emailAddress: 'demo@sentia.com',
      verification: { status: 'verified' }
    }],
    firstName: 'Demo',
    lastName: 'User',
    username: 'demo_user',
    publicMetadata: {
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin'],
      department: 'Manufacturing'
    },
    privateMetadata: {},
    unsafeMetadata: {
      theme: 'light',
      notifications: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  session: {
    id: 'demo_session_' + Date.now(),
    status: 'active',
    expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    abandonAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }
};

// Monitoring configuration
export const monitoringConfig = {
  enabled: true,
  logLevel: import.meta.env.MODE === 'development' ? 'debug' : 'error',
  healthCheckInterval: 60000, // 1 minute
  errorRetryAttempts: 3,
  errorRetryDelay: 1000,

  // Events to monitor
  events: {
    signIn: true,
    signOut: true,
    signUp: true,
    organizationSwitch: true,
    error: true
  }
};

// Export a function to get current auth mode
export function getAuthMode() {
  if (clerkConfig.isEnabled) {
    return 'clerk';
  }
  if (demoConfig.enabled) {
    return 'demo';
  }
  return 'none';
}

// Export auth status checker
export function checkAuthStatus() {
  const mode = getAuthMode();
  const status = {
    mode,
    healthy: true,
    message: '',
    details: {}
  };

  switch (mode) {
    case 'clerk':
      status.message = 'Clerk authentication active';
      status.details = {
        domain: clerkConfig.domain,
        keyPrefix: clerkConfig.publishableKey?.substring(0, 15) + '...'
      };
      break;

    case 'demo':
      status.message = 'Demo mode active (no Clerk key)';
      status.details = {
        user: demoConfig.user.emailAddresses[0].emailAddress
      };
      break;

    default:
      status.healthy = false;
      status.message = 'No authentication configured';
  }

  return status;
}

// Log initial auth configuration
if (import.meta.env.MODE === 'development') {
  console.log('[Auth Configuration]', checkAuthStatus());
}