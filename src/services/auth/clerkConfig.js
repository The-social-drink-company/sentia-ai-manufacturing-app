import { devLog } from '../../lib/devLog.js';
/**
 * Clerk Authentication Configuration for Railway Deployments
 * Handles environment-specific settings and fallback scenarios
 */

class ClerkConfig {
  constructor() {
    this.isInitialized = false;
    this.publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    this.environment = this.detectEnvironment();
    this.domains = this.getEnvironmentDomains();
    this.redirectUrls = this.getRedirectUrls();
  }

  /**
   * Detect current environment
   */
  detectEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('production') || hostname === 'sentia-manufacturing.railway.app') {
      return 'production';
    } else if (hostname.includes('test')) {
      return 'test';
    } else if (hostname.includes('dev') || hostname.includes('development')) {
      return 'development';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'local';
    }
    
    return 'development'; // Default fallback
  }

  /**
   * Get environment-specific domains
   */
  getEnvironmentDomains() {
    const domains = {
      production: [
        'sentia-manufacturing.railway.app',
        'sentia-manufacturing-dashboard-production.up.railway.app'
      ],
      test: [
        'test.sentia-manufacturing.railway.app',
        'sentia-manufacturing-dashboard-test.up.railway.app'
      ],
      development: [
        'dev.sentia-manufacturing.railway.app',
        'sentia-manufacturing-dashboard-development.up.railway.app'
      ],
      local: [
        'localhost:3000',
        'localhost:3001',
        'localhost:5173',
        '127.0.0.1:3000',
        '127.0.0.1:3001',
        '127.0.0.1:5173'
      ]
    };
    
    return domains[this.environment] || domains.development;
  }

  /**
   * Get redirect URLs for current environment
   */
  getRedirectUrls() {
    const baseUrl = this.getBaseUrl();
    
    return {
      signIn: `${baseUrl}/sign-in`,
      signUp: `${baseUrl}/sign-up`,
      afterSignIn: `${baseUrl}/dashboard`,
      afterSignUp: `${baseUrl}/dashboard`,
      afterSignOut: baseUrl,
      resetPassword: `${baseUrl}/reset-password`,
      verifyEmail: `${baseUrl}/verify-email`
    };
  }

  /**
   * Get base URL for current environment
   */
  getBaseUrl() {
    if (this.environment === 'local') {
      return window.location.origin;
    }
    
    const protocol = 'https://';
    const primaryDomain = this.domains[0];
    
    return `${protocol}${primaryDomain}`;
  }

  /**
   * Check if Clerk is properly configured
   */
  isConfigured() {
    return !!this.publishableKey;
  }

  /**
   * Get Clerk configuration object
   */
  getConfig() {
    if (!this.isConfigured()) {
      devLog.warn('[ClerkConfig] Clerk publishable key not found');
      return null;
    }
    
    return {
      publishableKey: this.publishableKey,
      appearance: {
        theme: 'auto',
        variables: {
          colorPrimary: '#0ea5e9',
          colorBackground: '#ffffff',
          colorText: '#0f172a',
          colorTextSecondary: '#64748b',
          colorDanger: '#ef4444',
          colorSuccess: '#10b981',
          borderRadius: '0.5rem',
          fontFamily: 'Inter, system-ui, sans-serif'
        },
        elements: {
          card: 'shadow-lg',
          formButtonPrimary: 'bg-primary-600 hover:bg-primary-700',
          footerActionLink: 'text-primary-600 hover:text-primary-700'
        },
        layout: {
          socialButtonsPlacement: 'top',
          socialButtonsVariant: 'iconButton'
        }
      },
      redirectUrl: this.redirectUrls.afterSignIn,
      signInUrl: this.redirectUrls.signIn,
      signUpUrl: this.redirectUrls.signUp,
      afterSignInUrl: this.redirectUrls.afterSignIn,
      afterSignUpUrl: this.redirectUrls.afterSignUp,
      afterSignOutUrl: this.redirectUrls.afterSignOut,
      // Railway-specific settings
      allowedRedirectOrigins: this.domains,
      // Handle session during hydration
      initialState: undefined,
      // Improved error handling
      telemetry: false,
      // Support for custom domains
      isSatellite: false,
      domain: this.getBaseUrl()
    };
  }

  /**
   * Get CORS configuration for API calls
   */
  getCorsConfig() {
    const allowedOrigins = [
      ...this.domains.map(d => `https://${d}`),
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173'
    ];
    
    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          devLog.warn(`[CORS] Blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-clerk-session-id'],
      exposedHeaders: ['x-clerk-session-id'],
      maxAge: 86400 // 24 hours
    };
  }

  /**
   * Validate session token
   */
  async validateSession(sessionId) {
    if (!sessionId) return false;
    
    try {
      // Validate with Clerk backend
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-session-id': sessionId
        },
        credentials: 'include'
      });
      
      return response.ok;
    } catch (error) {
      devLog.error('[ClerkConfig] Session validation failed:', error);
      return false;
    }
  }

  /**
   * Get public routes that don't require authentication
   */
  getPublicRoutes() {
    return [
      '/',
      '/sign-in',
      '/sign-up',
      '/reset-password',
      '/verify-email',
      '/terms',
      '/privacy',
      '/about',
      '/contact',
      '/health',
      '/api/health',
      '/api/health/live',
      '/api/health/ready'
    ];
  }

  /**
   * Check if current route requires authentication
   */
  requiresAuth(pathname) {
    const publicRoutes = this.getPublicRoutes();
    
    // Check exact matches
    if (publicRoutes.includes(pathname)) {
      return false;
    }
    
    // Check pattern matches
    const publicPatterns = [
      /^\/api\/public\//,
      /^\/assets\//,
      /^\/images\//,
      /^\/_next\//,
      /^\/static\//
    ];
    
    for (const pattern of publicPatterns) {
      if (pattern.test(pathname)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Handle authentication errors gracefully
   */
  handleAuthError(error) {
    devLog.error('[ClerkConfig] Authentication error:', error);
    
    // Don't redirect on certain errors
    const nonRedirectErrors = [
      'Network error',
      'Failed to fetch',
      'NetworkError'
    ];
    
    const shouldRedirect = !nonRedirectErrors.some(msg => 
      error.message?.includes(msg)
    );
    
    if (shouldRedirect && this.requiresAuth(window.location.pathname)) {
      // Redirect to sign-in page
      window.location.href = this.redirectUrls.signIn;
    }
    
    return {
      error: true,
      message: error.message || 'Authentication failed',
      code: error.code || 'AUTH_ERROR'
    };
  }

  /**
   * Initialize Clerk with retry logic
   */
  async initialize(retries = 3) {
    if (this.isInitialized) return true;
    
    if (!this.isConfigured()) {
      devLog.warn('[ClerkConfig] Clerk not configured, running in public mode');
      return false;
    }
    
    for (let i = 0; i < retries; i++) {
      try {
        // Wait for Clerk to be available
        if (typeof window.Clerk === 'undefined') {
          await this.waitForClerk();
        }
        
        const config = this.getConfig();
        if (config) {
          await window.Clerk.load(config);
          this.isInitialized = true;
          devLog.log('[ClerkConfig] Clerk initialized successfully');
          return true;
        }
      } catch (error) {
        devLog.error(`[ClerkConfig] Initialization attempt ${i + 1} failed:`, error);
        
        if (i === retries - 1) {
          this.handleAuthError(error);
          return false;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    
    return false;
  }

  /**
   * Wait for Clerk script to load
   */
  async waitForClerk(timeout = 10000) {
    const startTime = Date.now();
    
    while (typeof window.Clerk === 'undefined') {
      if (Date.now() - startTime > timeout) {
        throw new Error('Clerk script failed to load');
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Get middleware configuration for server
   */
  getMiddlewareConfig() {
    return {
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
      apiUrl: 'https://api.clerk.com',
      // Webhook settings
      webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
      // Session settings
      sessionCookieName: '__session',
      sessionCookieOptions: {
        httpOnly: true,
        secure: this.environment !== 'local',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        domain: this.environment === 'local' ? undefined : '.railway.app'
      },
      // JWT settings
      jwtKey: process.env.CLERK_JWT_KEY,
      // Rate limiting
      rateLimiting: {
        enabled: true,
        maxRequests: 100,
        windowMs: 60000 // 1 minute
      }
    };
  }
}

// Export singleton instance
const clerkConfig = new ClerkConfig();

export default clerkConfig;
export { ClerkConfig };