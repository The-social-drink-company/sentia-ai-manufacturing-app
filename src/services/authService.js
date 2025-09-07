// Authentication service for Vite/React app
// This replaces NextAuth.js which is designed for Next.js apps

class AuthService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
    this.session = null;
    this.listeners = new Set();
  }

  // Subscribe to authentication state changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners of auth state changes
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.session));
  }

  // Get current session from localStorage or memory
  getSession() {
    if (this.session) {
      return this.session;
    }
    
    const stored = localStorage.getItem('auth_session');
    if (stored) {
      try {
        this.session = JSON.parse(stored);
        return this.session;
      } catch (e) {
        localStorage.removeItem('auth_session');
      }
    }
    
    return null;
  }

  // Set session and persist to localStorage
  setSession(session) {
    this.session = session;
    if (session) {
      localStorage.setItem('auth_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('auth_session');
    }
    this.notifyListeners();
  }

  // Sign in with email and password
  async signInWithCredentials(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.user) {
        const session = {
          user: data.user,
          accessToken: data.accessToken,
          provider: 'credentials',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
        
        this.setSession(session);
        return { ok: true, user: data.user };
      } else {
        return { error: data.error || 'Sign in failed' };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Network error during sign in' };
    }
  }

  // Sign in with Microsoft OAuth
  async signInWithMicrosoft() {
    try {
      // Redirect to Microsoft OAuth endpoint
      window.location.href = `${this.baseUrl}/api/auth/microsoft`;
      return { ok: true };
    } catch (error) {
      console.error('Microsoft sign in error:', error);
      return { error: 'Failed to initiate Microsoft sign in' };
    }
  }

  // Sign out
  async signOut() {
    try {
      // Call backend logout endpoint
      await fetch(`${this.baseUrl}/api/auth/signout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
    
    // Clear local session regardless of backend response
    this.setSession(null);
    return { ok: true };
  }

  // Check if user is authenticated
  isAuthenticated() {
    const session = this.getSession();
    if (!session) return false;
    
    // Check if session has expired
    const now = new Date();
    const expires = new Date(session.expires);
    
    if (now >= expires) {
      this.setSession(null);
      return false;
    }
    
    return true;
  }

  // Get current user
  getCurrentUser() {
    const session = this.getSession();
    return session?.user || null;
  }

  // Check if user has specific role
  hasRole(role) {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check if user has specific permission
  hasPermission(permission) {
    const user = this.getCurrentUser();
    const permissions = user?.permissions || [];
    return Array.isArray(permissions) 
      ? permissions.includes(permission)
      : permissions[permission] === true;
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;

// Convenience functions for backwards compatibility with NextAuth.js style
export const signIn = async (provider, options = {}) => {
  if (provider === 'credentials') {
    return await authService.signInWithCredentials(
      options.email, 
      options.password
    );
  } else if (provider === 'microsoft') {
    return await authService.signInWithMicrosoft();
  }
  
  return { error: 'Unknown provider' };
};

export const signOut = () => authService.signOut();

export const getSession = () => authService.getSession();

// useSession hook will be defined in a separate hook file to avoid React import issues
export { authService };