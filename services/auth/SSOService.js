import { logInfo, logWarn, logError } from '../logger.js';

/**
 * SSO and JIT (Just-In-Time) Provisioning Service
 * Handles enterprise SSO integration and automated user provisioning
 */
class SSOService {
  constructor(pool, authService) {
    this.pool = pool;
    this.authService = authService;
    
    // SSO configuration
    this.ssoProviders = {
      okta: {
        name: 'Okta',
        enabled: process.env.OKTA_ENABLED === 'true',
        issuer: process.env.OKTA_ISSUER,
        clientId: process.env.OKTA_CLIENT_ID,
        clientSecret: process.env.OKTA_CLIENT_SECRET,
        redirectUri: process.env.OKTA_REDIRECT_URI,
        scopes: ['openid', 'profile', 'email', 'groups']
      },
      azuread: {
        name: 'Azure AD',
        enabled: process.env.AZURE_AD_ENABLED === 'true',
        tenantId: process.env.AZURE_AD_TENANT_ID,
        clientId: process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        authority: process.env.AZURE_AD_AUTHORITY,
        scopes: ['openid', 'profile', 'email', 'User.Read']
      },
      google: {
        name: 'Google Workspace',
        enabled: process.env.GOOGLE_SSO_ENABLED === 'true',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        hostedDomain: process.env.GOOGLE_HOSTED_DOMAIN
      }
    };

    // JIT provisioning configuration
    this.jitConfig = {
      enabled: process.env.JIT_PROVISIONING_ENABLED === 'true',
      defaultRole: process.env.JIT_DEFAULT_ROLE || 'viewer',
      autoApprove: process.env.JIT_AUTO_APPROVE === 'true',
      domainWhitelist: process.env.JIT_DOMAIN_WHITELIST?.split(',') || [],
      attributeMapping: {
        email: 'email',
        firstName: 'given_name',
        lastName: 'family_name',
        displayName: 'name',
        role: 'custom:role',
        department: 'department',
        manager: 'manager'
      }
    };
  }

  /**
   * Get available SSO providers
   * @returns {Array} List of enabled SSO providers
   */
  getAvailableProviders() {
    return Object.entries(this.ssoProviders)
      .filter(([_, config]) => config.enabled)
      .map(([id, config]) => ({
        id,
        name: config.name,
        loginUrl: `/auth/sso/${id}`
      }));
  }

  /**
   * Check if SSO is enabled for any provider
   * @returns {boolean} True if any SSO provider is enabled
   */
  isSSOEnabled() {
    return Object.values(this.ssoProviders).some(provider => provider.enabled);
  }

  /**
   * Check if JIT provisioning is enabled
   * @returns {boolean} True if JIT provisioning is enabled
   */
  isJITEnabled() {
    return this.jitConfig.enabled;
  }

  /**
   * Store SSO provider configuration
   * @param {string} providerId - Provider identifier
   * @param {Object} config - Provider configuration
   * @returns {Promise<boolean>} Success status
   */
  async storeSSOProvider(providerId, config) {
    try {
      const query = `
        INSERT INTO sso_providers (
          id, name, provider_type, configuration, is_enabled, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (id) 
        DO UPDATE SET 
          name = $2,
          configuration = $4,
          is_enabled = $5,
          updated_at = NOW()
      `;
      
      await this.pool.query(query, [
        providerId,
        config.name,
        providerId, // provider_type
        JSON.stringify(config),
        config.enabled
      ]);
      
      logInfo('SSO provider configuration stored', { providerId, name: config.name });
      return true;
    } catch (error) {
      logError('Failed to store SSO provider configuration', error);
      return false;
    }
  }

  /**
   * Get stored SSO provider configuration
   * @param {string} providerId - Provider identifier
   * @returns {Promise<Object>} Provider configuration
   */
  async getSSOProvider(providerId) {
    try {
      const query = 'SELECT * FROM sso_providers WHERE id = $1 AND is_enabled = true';
      const result = await this.pool.query(query, [providerId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const provider = result.rows[0];
      return {
        id: provider.id,
        name: provider.name,
        type: provider.provider_type,
        config: typeof provider.configuration === 'string' 
          ? JSON.parse(provider.configuration) 
          : provider.configuration,
        enabled: provider.is_enabled,
        lastUsed: provider.last_used_at
      };
    } catch (error) {
      logError('Failed to get SSO provider', error);
      return null;
    }
  }

  /**
   * Process SSO authentication callback
   * @param {string} providerId - SSO provider identifier
   * @param {Object} ssoProfile - User profile from SSO provider
   * @param {string} ipAddress - Client IP address
   * @param {string} userAgent - Client user agent
   * @returns {Promise<Object>} Authentication result
   */
  async processSSOCallback(providerId, ssoProfile, ipAddress, userAgent) {
    try {
      // Validate provider
      const provider = await this.getSSOProvider(providerId);
      if (!provider) {
        throw new Error(`SSO provider ${providerId} not found or disabled`);
      }

      // Extract user information from SSO profile
      const userInfo = this.extractUserInfo(ssoProfile);
      
      // Check if user already exists
      let user = await this.findUserByEmail(userInfo.email);
      
      if (user) {
        // Existing user - update profile and authenticate
        await this.updateUserFromSSO(user.clerk_user_id, userInfo, providerId);
        
        await this.authService.auditLog({
          action: 'sso_login_success',
          user_id: user.clerk_user_id,
          details: { 
            provider: providerId,
            email: userInfo.email,
            returning_user: true
          },
          ip_address: ipAddress,
          user_agent: userAgent
        });
        
        return {
          success: true,
          user: user,
          isNewUser: false,
          message: 'SSO authentication successful'
        };
      } else {
        // New user - check JIT provisioning
        if (!this.isJITEnabled()) {
          await this.authService.auditLog({
            action: 'sso_login_denied',
            details: { 
              provider: providerId,
              email: userInfo.email,
              reason: 'jit_disabled'
            },
            ip_address: ipAddress,
            user_agent: userAgent
          });
          
          return {
            success: false,
            error: 'Account does not exist and automatic provisioning is disabled',
            requiresManualProvisioning: true
          };
        }
        
        // Check domain whitelist
        if (!this.isDomainAllowed(userInfo.email)) {
          await this.authService.auditLog({
            action: 'sso_login_denied',
            details: { 
              provider: providerId,
              email: userInfo.email,
              reason: 'domain_not_whitelisted'
            },
            ip_address: ipAddress,
            user_agent: userAgent
          });
          
          return {
            success: false,
            error: 'Email domain is not authorized for automatic provisioning'
          };
        }
        
        // Provision new user
        const newUser = await this.provisionUser(userInfo, providerId, ipAddress, userAgent);
        
        if (newUser) {
          return {
            success: true,
            user: newUser,
            isNewUser: true,
            message: 'Account created and authenticated successfully'
          };
        } else {
          return {
            success: false,
            error: 'Failed to provision new user account'
          };
        }
      }
    } catch (error) {
      logError('SSO callback processing failed', error);
      
      await this.authService.auditLog({
        action: 'sso_login_error',
        details: { 
          provider: providerId,
          error: error.message
        },
        ip_address: ipAddress,
        user_agent: userAgent
      });
      
      return {
        success: false,
        error: 'SSO authentication failed',
        details: error.message
      };
    }
  }

  /**
   * Extract user information from SSO profile
   * @param {Object} ssoProfile - SSO profile data
   * @returns {Object} Standardized user information
   */
  extractUserInfo(ssoProfile) {
    const mapping = this.jitConfig.attributeMapping;
    
    return {
      email: ssoProfile[mapping.email] || ssoProfile.email,
      firstName: ssoProfile[mapping.firstName] || ssoProfile.given_name || ssoProfile.firstName,
      lastName: ssoProfile[mapping.lastName] || ssoProfile.family_name || ssoProfile.lastName,
      displayName: ssoProfile[mapping.displayName] || ssoProfile.name || ssoProfile.displayName,
      role: ssoProfile[mapping.role] || this.jitConfig.defaultRole,
      department: ssoProfile[mapping.department] || ssoProfile.department,
      manager: ssoProfile[mapping.manager] || ssoProfile.manager,
      groups: ssoProfile.groups || [],
      customAttributes: ssoProfile.customAttributes || {}
    };
  }

  /**
   * Find user by email address
   * @param {string} email - User email
   * @returns {Promise<Object>} User record or null
   */
  async findUserByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await this.pool.query(query, [email.toLowerCase()]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logError('Failed to find user by email', error);
      return null;
    }
  }

  /**
   * Update existing user from SSO profile
   * @param {string} userId - User ID
   * @param {Object} userInfo - User information from SSO
   * @param {string} providerId - SSO provider ID
   */
  async updateUserFromSSO(userId, userInfo, providerId) {
    try {
      const query = `
        UPDATE users 
        SET 
          last_sso_login = NOW(),
          sso_provider = $2,
          updated_at = NOW()
        WHERE clerk_user_id = $1
      `;
      
      await this.pool.query(query, [userId, providerId]);
      
      logInfo('User updated from SSO', { userId, provider: providerId });
    } catch (error) {
      logError('Failed to update user from SSO', error);
    }
  }

  /**
   * Provision new user through JIT
   * @param {Object} userInfo - User information
   * @param {string} providerId - SSO provider ID
   * @param {string} ipAddress - Client IP
   * @param {string} userAgent - Client user agent
   * @returns {Promise<Object>} New user record
   */
  async provisionUser(userInfo, providerId, ipAddress, userAgent) {
    try {
      // In a real implementation, this would integrate with Clerk's user creation API
      // For now, create a mock user record
      const userId = require('crypto').randomUUID();
      
      const query = `
        INSERT INTO users (
          clerk_user_id, email, role, 
          first_name, last_name, display_name,
          sso_provider, created_via_jit,
          approved, is_active,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, true, NOW())
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [
        userId,
        userInfo.email.toLowerCase(),
        userInfo.role,
        userInfo.firstName,
        userInfo.lastName,
        userInfo.displayName,
        providerId,
        this.jitConfig.autoApprove
      ]);
      
      const newUser = result.rows[0];
      
      // Audit the JIT provisioning
      await this.authService.auditLog({
        action: 'user_jit_provisioned',
        user_id: userId,
        details: { 
          provider: providerId,
          email: userInfo.email,
          role: userInfo.role,
          auto_approved: this.jitConfig.autoApprove
        },
        ip_address: ipAddress,
        user_agent: userAgent
      });
      
      logInfo('User provisioned via JIT', { 
        userId, 
        email: userInfo.email, 
        provider: providerId 
      });
      
      return newUser;
    } catch (error) {
      logError('Failed to provision user via JIT', error);
      return null;
    }
  }

  /**
   * Check if email domain is allowed for JIT provisioning
   * @param {string} email - Email address to check
   * @returns {boolean} True if domain is allowed
   */
  isDomainAllowed(email) {
    if (this.jitConfig.domainWhitelist.length === 0) {
      return true; // No whitelist means all domains allowed
    }
    
    const domain = email.split('@')[1];
    return this.jitConfig.domainWhitelist.includes(domain);
  }

  /**
   * Get JIT provisioning configuration
   * @returns {Object} JIT configuration (safe for client)
   */
  getJITConfiguration() {
    return {
      enabled: this.jitConfig.enabled,
      defaultRole: this.jitConfig.defaultRole,
      autoApprove: this.jitConfig.autoApprove,
      allowedDomains: this.jitConfig.domainWhitelist
    };
  }

  /**
   * Update JIT provisioning configuration (admin only)
   * @param {Object} config - New JIT configuration
   * @returns {Promise<boolean>} Success status
   */
  async updateJITConfiguration(config) {
    try {
      // Update in-memory configuration
      this.jitConfig = { ...this.jitConfig, ...config };
      
      // Store in database
      const query = `
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('jit_provisioning_config', $1, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = $1, updated_at = NOW()
      `;
      
      await this.pool.query(query, [JSON.stringify(this.jitConfig)]);
      
      logInfo('JIT provisioning configuration updated', config);
      return true;
    } catch (error) {
      logError('Failed to update JIT configuration', error);
      return false;
    }
  }

  /**
   * Get SSO statistics for admin dashboard
   * @returns {Promise<Object>} SSO usage statistics
   */
  async getSSOStatistics() {
    try {
      const queries = [
        // Total SSO logins by provider
        `SELECT 
          details->>'provider' as provider,
          COUNT(*) as login_count
         FROM audit_logs 
         WHERE action = 'sso_login_success'
         AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY details->>'provider'`,
        
        // JIT provisioned users
        `SELECT COUNT(*) as jit_users
         FROM users 
         WHERE created_via_jit = true`,
        
        // Recent SSO activity
        `SELECT 
          action,
          details->>'provider' as provider,
          COUNT(*) as count
         FROM audit_logs 
         WHERE action LIKE 'sso_%'
         AND created_at >= NOW() - INTERVAL '7 days'
         GROUP BY action, details->>'provider'`
      ];
      
      const [providerStats, jitStats, recentActivity] = await Promise.all([
        this.pool.query(queries[0]),
        this.pool.query(queries[1]),
        this.pool.query(queries[2])
      ]);
      
      return {
        providerLogins: providerStats.rows,
        jitProvisionedUsers: jitStats.rows[0]?.jit_users || 0,
        recentActivity: recentActivity.rows
      };
    } catch (error) {
      logError('Failed to get SSO statistics', error);
      return {
        providerLogins: [],
        jitProvisionedUsers: 0,
        recentActivity: []
      };
    }
  }

  /**
   * Health check for SSO service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const enabledProviders = this.getAvailableProviders();
      
      return {
        status: 'healthy',
        ssoEnabled: this.isSSOEnabled(),
        jitEnabled: this.isJITEnabled(),
        enabledProviders: enabledProviders.length,
        providers: enabledProviders.map(p => ({ id: p.id, name: p.name })),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default SSOService;