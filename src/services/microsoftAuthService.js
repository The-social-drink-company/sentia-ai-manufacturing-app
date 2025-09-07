/**
 * Microsoft OAuth Authentication Service
 * Implements Microsoft OAuth 2.0 for Azure AD authentication
 */

class MicrosoftAuthService {
  constructor() {
    this.clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'your-microsoft-client-id';
    this.redirectUri = `${window.location.origin}/auth/microsoft/callback`;
    this.scopes = [
      'openid',
      'profile', 
      'email',
      'User.Read'
    ];
    this.authority = 'https://login.microsoftonline.com/common';
  }

  /**
   * Generate Microsoft OAuth authorization URL
   */
  getAuthorizationUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      response_mode: 'query',
      state: this.generateState()
    });

    const authUrl = `${this.authority}/oauth2/v2.0/authorize?${params.toString()}`;
    
    // Store state for CSRF protection
    localStorage.setItem('microsoft_oauth_state', params.get('state'));
    
    return authUrl;
  }

  /**
   * Generate random state for CSRF protection
   */
  generateState() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0].toString(16);
  }

  /**
   * Redirect to Microsoft OAuth login
   */
  async redirectToLogin() {
    const authUrl = this.getAuthorizationUrl();
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback and exchange code for token
   */
  async handleCallback(code, state) {
    console.log('🔐 Microsoft OAuth callback received');
    
    // Verify state to prevent CSRF attacks
    const storedState = localStorage.getItem('microsoft_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }
    localStorage.removeItem('microsoft_oauth_state');

    try {
      // Exchange code for access token through our backend
      const response = await fetch('/api/auth/microsoft/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Microsoft OAuth callback failed');
      }

      const data = await response.json();
      
      // Store authentication data
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('session', JSON.stringify({
        token: data.accessToken,
        isAuthenticated: true,
        authMethod: 'microsoft',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));

      return data;
    } catch (error) {
      console.error('Microsoft OAuth error:', error);
      throw error;
    }
  }

  /**
   * Get user profile from Microsoft Graph API
   */
  async getUserProfile(accessToken) {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile from Microsoft');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Microsoft user profile:', error);
      throw error;
    }
  }

  /**
   * Check if Microsoft OAuth is configured
   */
  isConfigured() {
    return this.clientId && this.clientId !== 'your-microsoft-client-id';
  }

  /**
   * Sign out from Microsoft
   */
  async signOut() {
    // Clear local storage
    localStorage.removeItem('user');
    localStorage.removeItem('session');

    // Redirect to Microsoft logout
    const logoutUrl = `${this.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
    window.location.href = logoutUrl;
  }
}

export default new MicrosoftAuthService();