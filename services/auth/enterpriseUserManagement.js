import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import EventEmitter from 'events';

/**
 * Enterprise User Management & RBAC System
 * 
 * Comprehensive user lifecycle management with role-based access control,
 * multi-factor authentication, and advanced security features.
 */
export class EnterpriseUserManagement extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      authentication: {
        jwtSecret: config.authentication?.jwtSecret || process.env.JWT_SECRET || 'your-secret-key',
        jwtExpiration: config.authentication?.jwtExpiration || '24h',
        refreshTokenExpiration: config.authentication?.refreshTokenExpiration || '7d',
        passwordMinLength: config.authentication?.passwordMinLength || 8,
        passwordComplexity: config.authentication?.passwordComplexity || true,
        maxLoginAttempts: config.authentication?.maxLoginAttempts || 5,
        lockoutDuration: config.authentication?.lockoutDuration || 900000 // 15 minutes
      },
      mfa: {
        enabled: config.mfa?.enabled || true,
        issuer: config.mfa?.issuer || 'Sentia Manufacturing',
        window: config.mfa?.window || 2,
        required: config.mfa?.required || ['admin', 'manager']
      },
      rbac: {
        enabled: config.rbac?.enabled || true,
        hierarchical: config.rbac?.hierarchical || true,
        inheritance: config.rbac?.inheritance || true,
        caching: config.rbac?.caching || true
      },
      session: {
        timeout: config.session?.timeout || 3600000, // 1 hour
        concurrent: config.session?.concurrent || 3,
        tracking: config.session?.tracking || true
      },
      audit: {
        enabled: config.audit?.enabled || true,
        retention: config.audit?.retention || 365 * 24 * 60 * 60 * 1000, // 1 year
        events: config.audit?.events || ['login', 'logout', 'permission_change', 'role_change', 'password_change']
      }
    };

    // User and role storage
    this.users = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.sessions = new Map();
    this.refreshTokens = new Map();
    
    // Security tracking
    this.loginAttempts = new Map();
    this.lockedAccounts = new Map();
    this.auditLog = [];
    
    // Permission cache
    this.permissionCache = new Map();
    this.roleCache = new Map();
    
    // Statistics
    this.stats = {
      users: { total: 0, active: 0, locked: 0, pending: 0 },
      sessions: { active: 0, total: 0, concurrent: 0 },
      security: { loginAttempts: 0, failedLogins: 0, mfaEnabled: 0 },
      audit: { events: 0, size: 0 }
    };

    this.initializeUserManagement();
  }

  /**
   * Initialize user management system
   */
  initializeUserManagement() {
    // Load default roles and permissions
    this.loadDefaultRoles();
    this.loadDefaultPermissions();
    
    // Start session cleanup
    this.startSessionCleanup();
    
    // Start audit log cleanup
    this.startAuditCleanup();
    
    console.log('👥 Enterprise User Management System initialized');
  }

  /**
   * Create new user account
   */
  async createUser(userData, createdBy = null) {
    try {
      // Validate user data
      this.validateUserData(userData);
      
      // Check if user already exists
      if (this.findUserByEmail(userData.email)) {
        throw new Error('User with this email already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Generate user ID
      const userId = this.generateUserId();
      
      // Create user object
      const user = {
        id: userId,
        email: userData.email.toLowerCase(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'user',
        department: userData.department || null,
        manager: userData.manager || null,
        status: userData.status || 'pending',
        password: hashedPassword,
        mfa: {
          enabled: false,
          secret: null,
          backupCodes: []
        },
        profile: {
          avatar: userData.avatar || null,
          phone: userData.phone || null,
          timezone: userData.timezone || 'UTC',
          language: userData.language || 'en',
          preferences: userData.preferences || {}
        },
        security: {
          lastLogin: null,
          lastPasswordChange: new Date().toISOString(),
          loginAttempts: 0,
          locked: false,
          lockoutUntil: null,
          passwordHistory: [hashedPassword]
        },
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: createdBy,
          updatedAt: new Date().toISOString(),
          updatedBy: createdBy,
          version: 1
        }
      };

      // Store user
      this.users.set(userId, user);
      
      // Update statistics
      this.updateUserStats();
      
      // Log audit event
      this.logAuditEvent('user_created', {
        userId,
        email: user.email,
        role: user.role,
        createdBy
      });
      
      this.emit('userCreated', { user: this.sanitizeUser(user), createdBy });
      
      return { userId, user: this.sanitizeUser(user) };

    } catch (error) {
      console.error('User creation failed:', error);
      this.emit('userCreationError', { userData, error: error.message });
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async authenticateUser(email, password, mfaToken = null, options = {}) {
    try {
      const user = this.findUserByEmail(email);
      
      if (!user) {
        await this.recordFailedLogin(email, 'user_not_found');
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (this.isAccountLocked(user)) {
        throw new Error('Account is temporarily locked due to multiple failed login attempts');
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.password);
      
      if (!passwordValid) {
        await this.recordFailedLogin(email, 'invalid_password');
        throw new Error('Invalid credentials');
      }

      // Check MFA if enabled
      if (user.mfa.enabled) {
        if (!mfaToken) {
          throw new Error('MFA token required');
        }
        
        const mfaValid = this.verifyMFAToken(user, mfaToken);
        if (!mfaValid) {
          await this.recordFailedLogin(email, 'invalid_mfa');
          throw new Error('Invalid MFA token');
        }
      }

      // Check user status
      if (user.status !== 'active') {
        throw new Error(`Account is ${user.status}`);
      }

      // Reset login attempts
      this.resetLoginAttempts(user.id);
      
      // Update last login
      user.security.lastLogin = new Date().toISOString();
      user.metadata.updatedAt = new Date().toISOString();
      
      // Generate tokens
      const tokens = await this.generateTokens(user);
      
      // Create session
      const session = await this.createSession(user, options);
      
      // Update statistics
      this.updateSessionStats();
      
      // Log audit event
      this.logAuditEvent('user_login', {
        userId: user.id,
        email: user.email,
        sessionId: session.id,
        ip: options.ip,
        userAgent: options.userAgent
      });
      
      this.emit('userAuthenticated', { 
        user: this.sanitizeUser(user), 
        session, 
        tokens 
      });
      
      return {
        user: this.sanitizeUser(user),
        tokens,
        session: this.sanitizeSession(session)
      };

    } catch (error) {
      console.error('Authentication failed:', error);
      this.emit('authenticationError', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Enable Multi-Factor Authentication
   */
  async enableMFA(userId, userPassword) {
    try {
      const user = this.users.get(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const passwordValid = await bcrypt.compare(userPassword, user.password);
      if (!passwordValid) {
        throw new Error('Invalid password');
      }

      // Generate MFA secret
      const secret = speakeasy.generateSecret({
        name: `${this.config.mfa.issuer} (${user.email})`,
        issuer: this.config.mfa.issuer,
        length: 32
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Update user MFA settings
      user.mfa = {
        enabled: false, // Will be enabled after verification
        secret: secret.base32,
        backupCodes: backupCodes.map(code => bcrypt.hashSync(code, 10)),
        qrCode: await QRCode.toDataURL(secret.otpauth_url)
      };
      
      user.metadata.updatedAt = new Date().toISOString();
      
      // Log audit event
      this.logAuditEvent('mfa_setup_initiated', {
        userId,
        email: user.email
      });
      
      this.emit('mfaSetupInitiated', { userId, qrCode: user.mfa.qrCode });
      
      return {
        secret: secret.base32,
        qrCode: user.mfa.qrCode,
        backupCodes: backupCodes // Return plain codes for user to save
      };

    } catch (error) {
      console.error('MFA setup failed:', error);
      this.emit('mfaSetupError', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Verify and complete MFA setup
   */
  async verifyMFASetup(userId, token) {
    try {
      const user = this.users.get(userId);
      
      if (!user || !user.mfa.secret) {
        throw new Error('MFA setup not initiated');
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: user.mfa.secret,
        encoding: 'base32',
        token: token,
        window: this.config.mfa.window
      });

      if (!verified) {
        throw new Error('Invalid MFA token');
      }

      // Enable MFA
      user.mfa.enabled = true;
      user.metadata.updatedAt = new Date().toISOString();
      
      // Update statistics
      this.updateSecurityStats();
      
      // Log audit event
      this.logAuditEvent('mfa_enabled', {
        userId,
        email: user.email
      });
      
      this.emit('mfaEnabled', { userId });
      
      return { success: true, message: 'MFA enabled successfully' };

    } catch (error) {
      console.error('MFA verification failed:', error);
      this.emit('mfaVerificationError', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Create user role
   */
  async createRole(roleData, createdBy = null) {
    try {
      const roleId = this.generateRoleId();
      
      const role = {
        id: roleId,
        name: roleData.name,
        displayName: roleData.displayName || roleData.name,
        description: roleData.description || '',
        permissions: roleData.permissions || [],
        inherits: roleData.inherits || [], // Role inheritance
        level: roleData.level || 0, // Hierarchy level
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: createdBy,
          updatedAt: new Date().toISOString(),
          updatedBy: createdBy
        }
      };

      // Validate permissions exist
      this.validateRolePermissions(role.permissions);
      
      // Store role
      this.roles.set(roleId, role);
      
      // Clear permission cache
      this.clearPermissionCache();
      
      // Log audit event
      this.logAuditEvent('role_created', {
        roleId,
        name: role.name,
        permissions: role.permissions,
        createdBy
      });
      
      this.emit('roleCreated', { role, createdBy });
      
      return { roleId, role };

    } catch (error) {
      console.error('Role creation failed:', error);
      this.emit('roleCreationError', { roleData, error: error.message });
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(userId, roleId, assignedBy = null) {
    try {
      const user = this.users.get(userId);
      const role = this.roles.get(roleId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!role) {
        throw new Error('Role not found');
      }

      const previousRole = user.role;
      user.role = roleId;
      user.metadata.updatedAt = new Date().toISOString();
      user.metadata.updatedBy = assignedBy;
      
      // Clear user's permission cache
      this.clearUserPermissionCache(userId);
      
      // Log audit event
      this.logAuditEvent('role_assigned', {
        userId,
        email: user.email,
        previousRole,
        newRole: roleId,
        assignedBy
      });
      
      this.emit('roleAssigned', { userId, roleId, previousRole, assignedBy });
      
      return { success: true, previousRole, newRole: roleId };

    } catch (error) {
      console.error('Role assignment failed:', error);
      this.emit('roleAssignmentError', { userId, roleId, error: error.message });
      throw error;
    }
  }

  /**
   * Check user permission
   */
  async checkPermission(userId, permission, resource = null) {
    try {
      // Check cache first
      const cacheKey = `${userId}:${permission}:${resource || 'global'}`;
      if (this.permissionCache.has(cacheKey)) {
        return this.permissionCache.get(cacheKey);
      }

      const user = this.users.get(userId);
      if (!user) {
        return false;
      }

      // Get user's effective permissions
      const permissions = await this.getUserPermissions(userId);
      
      // Check permission
      let hasPermission = false;
      
      if (resource) {
        // Resource-specific permission
        hasPermission = permissions.some(p => 
          (p.name === permission && (!p.resource || p.resource === resource)) ||
          (p.name === '*' && (!p.resource || p.resource === resource)) ||
          (p.name === permission && p.resource === '*')
        );
      } else {
        // Global permission
        hasPermission = permissions.some(p => 
          p.name === permission || p.name === '*'
        );
      }
      
      // Cache result
      this.permissionCache.set(cacheKey, hasPermission);
      
      return hasPermission;

    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Get user's effective permissions
   */
  async getUserPermissions(userId) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return [];
      }

      // Check cache
      const cacheKey = `permissions:${userId}`;
      if (this.roleCache.has(cacheKey)) {
        return this.roleCache.get(cacheKey);
      }

      const role = this.roles.get(user.role);
      if (!role) {
        return [];
      }

      // Get permissions from role and inherited roles
      const permissions = new Set();
      
      // Add direct permissions
      role.permissions.forEach(permId => {
        const permission = this.permissions.get(permId);
        if (permission) {
          permissions.add(permission);
        }
      });
      
      // Add inherited permissions
      if (this.config.rbac.inheritance && role.inherits) {
        for (const inheritedRoleId of role.inherits) {
          const inheritedRole = this.roles.get(inheritedRoleId);
          if (inheritedRole) {
            inheritedRole.permissions.forEach(permId => {
              const permission = this.permissions.get(permId);
              if (permission) {
                permissions.add(permission);
              }
            });
          }
        }
      }
      
      const permissionArray = Array.from(permissions);
      
      // Cache result
      this.roleCache.set(cacheKey, permissionArray);
      
      return permissionArray;

    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  }

  /**
   * Create user session
   */
  async createSession(user, options = {}) {
    const sessionId = this.generateSessionId();
    
    const session = {
      id: sessionId,
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: options.ip || null,
      userAgent: options.userAgent || null,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.config.session.timeout).toISOString(),
      active: true,
      metadata: {
        loginMethod: options.loginMethod || 'password',
        mfaUsed: user.mfa.enabled,
        deviceFingerprint: options.deviceFingerprint || null
      }
    };

    // Check concurrent session limit
    await this.enforceConcurrentSessionLimit(user.id);
    
    // Store session
    this.sessions.set(sessionId, session);
    
    return session;
  }

  /**
   * Generate JWT tokens
   */
  async generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: await this.getUserPermissions(user.id)
    };

    const accessToken = jwt.sign(payload, this.config.authentication.jwtSecret, {
      expiresIn: this.config.authentication.jwtExpiration,
      issuer: 'sentia-manufacturing',
      audience: 'sentia-app'
    });

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      this.config.authentication.jwtSecret,
      {
        expiresIn: this.config.authentication.refreshTokenExpiration,
        issuer: 'sentia-manufacturing',
        audience: 'sentia-app'
      }
    );

    // Store refresh token
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.parseTimeToMs(this.config.authentication.refreshTokenExpiration)).toISOString()
    });

    return { accessToken, refreshToken };
  }

  /**
   * Validate user data
   */
  validateUserData(userData) {
    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new Error('Valid email is required');
    }
    
    if (!userData.password || userData.password.length < this.config.authentication.passwordMinLength) {
      throw new Error(`Password must be at least ${this.config.authentication.passwordMinLength} characters long`);
    }
    
    if (this.config.authentication.passwordComplexity && !this.isPasswordComplex(userData.password)) {
      throw new Error('Password must contain uppercase, lowercase, number, and special character');
    }
    
    if (!userData.firstName || !userData.lastName) {
      throw new Error('First name and last name are required');
    }
  }

  /**
   * Load default roles
   */
  loadDefaultRoles() {
    const defaultRoles = [
      {
        id: 'admin',
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system access',
        permissions: ['*'],
        level: 100
      },
      {
        id: 'manager',
        name: 'manager',
        displayName: 'Manager',
        description: 'Management access',
        permissions: ['read_all', 'write_reports', 'manage_team', 'view_analytics'],
        level: 50
      },
      {
        id: 'analyst',
        name: 'analyst',
        displayName: 'Business Analyst',
        description: 'Analytics and reporting access',
        permissions: ['read_all', 'write_reports', 'view_analytics'],
        level: 30
      },
      {
        id: 'user',
        name: 'user',
        displayName: 'Standard User',
        description: 'Basic user access',
        permissions: ['read_own', 'update_profile'],
        level: 10
      },
      {
        id: 'viewer',
        name: 'viewer',
        displayName: 'Viewer',
        description: 'Read-only access',
        permissions: ['read_public'],
        level: 5
      }
    ];

    defaultRoles.forEach(role => {
      role.metadata = {
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        updatedAt: new Date().toISOString(),
        updatedBy: 'system'
      };
      this.roles.set(role.id, role);
    });
  }

  /**
   * Load default permissions
   */
  loadDefaultPermissions() {
    const defaultPermissions = [
      // Global permissions
      { id: '*', name: '*', description: 'All permissions', resource: '*' },
      
      // Read permissions
      { id: 'read_all', name: 'read', description: 'Read all data', resource: '*' },
      { id: 'read_own', name: 'read', description: 'Read own data', resource: 'own' },
      { id: 'read_public', name: 'read', description: 'Read public data', resource: 'public' },
      
      // Write permissions
      { id: 'write_all', name: 'write', description: 'Write all data', resource: '*' },
      { id: 'write_own', name: 'write', description: 'Write own data', resource: 'own' },
      { id: 'write_reports', name: 'write', description: 'Create reports', resource: 'reports' },
      
      // Management permissions
      { id: 'manage_users', name: 'manage', description: 'Manage users', resource: 'users' },
      { id: 'manage_team', name: 'manage', description: 'Manage team', resource: 'team' },
      { id: 'manage_roles', name: 'manage', description: 'Manage roles', resource: 'roles' },
      
      // Analytics permissions
      { id: 'view_analytics', name: 'analytics', description: 'View analytics', resource: 'analytics' },
      { id: 'export_data', name: 'export', description: 'Export data', resource: 'data' },
      
      // Profile permissions
      { id: 'update_profile', name: 'update', description: 'Update profile', resource: 'profile' }
    ];

    defaultPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }

  /**
   * Start session cleanup
   */
  startSessionCleanup() {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 300000); // Every 5 minutes
  }

  /**
   * Start audit log cleanup
   */
  startAuditCleanup() {
    setInterval(() => {
      this.cleanupAuditLog();
    }, 3600000); // Every hour
  }

  /**
   * Get service health status
   */
  async getHealth() {
    return {
      status: 'healthy',
      users: this.stats.users,
      sessions: this.stats.sessions,
      security: this.stats.security,
      audit: this.stats.audit,
      cache: {
        permissions: this.permissionCache.size,
        roles: this.roleCache.size
      },
      timestamp: new Date().toISOString()
    };
  }

  // Helper methods (simplified implementations)
  generateUserId() { return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
  generateRoleId() { return `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
  generateSessionId() { return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
  findUserByEmail(email) { return Array.from(this.users.values()).find(u => u.email === email.toLowerCase()); }
  isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
  isPasswordComplex(password) { return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password); }
  sanitizeUser(user) { const { password, mfa, ...sanitized } = user; return { ...sanitized, mfa: { enabled: mfa.enabled } }; }
  sanitizeSession(session) { const { ...sanitized } = session; return sanitized; }
  isAccountLocked(user) { return user.security.locked && user.security.lockoutUntil && new Date() < new Date(user.security.lockoutUntil); }
  verifyMFAToken(user, token) { return speakeasy.totp.verify({ secret: user.mfa.secret, encoding: 'base32', token, window: this.config.mfa.window }); }
  generateBackupCodes() { return Array.from({ length: 10 }, () => Math.random().toString(36).substr(2, 8).toUpperCase()); }
  validateRolePermissions(permissions) { permissions.forEach(p => { if (!this.permissions.has(p)) throw new Error(`Permission ${p} does not exist`); }); }
  parseTimeToMs(timeStr) { const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 }; const match = timeStr.match(/^(\d+)([smhd])$/); return match ? parseInt(match[1]) * units[match[2]] : 86400000; }
  
  async recordFailedLogin(email, reason) {
    const attempts = this.loginAttempts.get(email) || 0;
    this.loginAttempts.set(email, attempts + 1);
    
    if (attempts + 1 >= this.config.authentication.maxLoginAttempts) {
      const user = this.findUserByEmail(email);
      if (user) {
        user.security.locked = true;
        user.security.lockoutUntil = new Date(Date.now() + this.config.authentication.lockoutDuration).toISOString();
        this.logAuditEvent('account_locked', { userId: user.id, email, reason });
      }
    }
    
    this.logAuditEvent('login_failed', { email, reason, attempts: attempts + 1 });
  }
  
  resetLoginAttempts(userId) { const user = this.users.get(userId); if (user) { this.loginAttempts.delete(user.email); user.security.locked = false; user.security.lockoutUntil = null; } }
  
  async enforceConcurrentSessionLimit(userId) {
    const userSessions = Array.from(this.sessions.values()).filter(s => s.userId === userId && s.active);
    if (userSessions.length >= this.config.session.concurrent) {
      const oldestSession = userSessions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
      oldestSession.active = false;
      this.sessions.delete(oldestSession.id);
    }
  }
  
  clearPermissionCache() { this.permissionCache.clear(); }
  clearUserPermissionCache(userId) { for (const key of this.permissionCache.keys()) { if (key.startsWith(`${userId}:`)) this.permissionCache.delete(key); } }
  
  logAuditEvent(event, data) {
    if (!this.config.audit.enabled) return;
    this.auditLog.push({ timestamp: new Date().toISOString(), event, data });
    this.stats.audit.events++;
    this.stats.audit.size = this.auditLog.length;
  }
  
  cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.sessions) {
      if (new Date(session.expiresAt) < now) {
        this.sessions.delete(sessionId);
      }
    }
    this.updateSessionStats();
  }
  
  cleanupAuditLog() {
    const cutoff = Date.now() - this.config.audit.retention;
    this.auditLog = this.auditLog.filter(entry => new Date(entry.timestamp).getTime() > cutoff);
    this.stats.audit.size = this.auditLog.length;
  }
  
  updateUserStats() {
    const users = Array.from(this.users.values());
    this.stats.users = {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      locked: users.filter(u => u.security.locked).length,
      pending: users.filter(u => u.status === 'pending').length
    };
  }
  
  updateSessionStats() {
    const sessions = Array.from(this.sessions.values());
    this.stats.sessions = {
      active: sessions.filter(s => s.active).length,
      total: sessions.length,
      concurrent: Math.max(...Object.values(sessions.reduce((acc, s) => { acc[s.userId] = (acc[s.userId] || 0) + 1; return acc; }, {})), 0)
    };
  }
  
  updateSecurityStats() {
    const users = Array.from(this.users.values());
    this.stats.security = {
      loginAttempts: this.loginAttempts.size,
      failedLogins: Array.from(this.loginAttempts.values()).reduce((sum, attempts) => sum + attempts, 0),
      mfaEnabled: users.filter(u => u.mfa.enabled).length
    };
  }
}

export default EnterpriseUserManagement;

