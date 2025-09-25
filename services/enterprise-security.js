import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import redisCacheService from './redis-cache.js';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


class EnterpriseSecurityService {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.tokenBlacklist = new Set();
    this.rateLimitStore = new Map();
    this.securityEvents = [];
    this.anomalyDetection = {
      enabled: true,
      threshold: 10,
      timeWindow: 300000, // 5 minutes
      suspiciousPatterns: new Map()
    };
    
    this.initializeSecurityPolicies();
    this.startSecurityMonitoring();
  }

  // Encryption and decryption
  encrypt(text, key = null) {
    try {
      const algorithm = 'aes-256-gcm';
      const encryptionKey = key || this.encryptionKey;
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, encryptionKey);
      cipher.setAAD(Buffer.from('enterprise-auth', 'utf8'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      logError('Encryption error:', error);
      throw new Error('Data encryption failed');
    }
  }

  decrypt(encryptedData, key = null) {
    try {
      const algorithm = 'aes-256-gcm';
      const encryptionKey = key || this.encryptionKey;
      const decipher = crypto.createDecipher(algorithm, encryptionKey);
      
      decipher.setAAD(Buffer.from('enterprise-auth', 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logError('Decryption error:', error);
      throw new Error('Data decryption failed');
    }
  }

  // Password hashing and verification
  async hashPassword(password, saltRounds = 12) {
    try {
      // Additional entropy for enterprise-grade security
      const pepper = process.env.PASSWORD_PEPPER || 'default-pepper';
      const pepperedPassword = password + pepper;
      
      return await bcrypt.hash(pepperedPassword, saltRounds);
    } catch (error) {
      logError('Password hashing error:', error);
      throw new Error('Password hashing failed');
    }
  }

  async verifyPassword(password, hash) {
    try {
      const pepper = process.env.PASSWORD_PEPPER || 'default-pepper';
      const pepperedPassword = password + pepper;
      
      return await bcrypt.compare(pepperedPassword, hash);
    } catch (error) {
      logError('Password verification error:', error);
      return false;
    }
  }

  // JWT token management
  generateToken(payload, options = {}) {
    const defaultOptions = {
      expiresIn: '24h',
      issuer: 'sentia-manufacturing',
      audience: 'sentia-users',
      algorithm: 'HS256'
    };

    const tokenOptions = { ...defaultOptions, ...options };
    
    // Add security metadata
    const enhancedPayload = {
      ...payload,
      jti: this.generateUniqueId(), // JWT ID for tracking
      iat: Math.floor(Date.now() / 1000), // Issued at
      security: {
        ipHash: this.hashIP(payload.ip),
        userAgent: this.hashUserAgent(payload.userAgent),
        deviceFingerprint: this.generateDeviceFingerprint(payload)
      }
    };

    try {
      return jwt.sign(enhancedPayload, this.jwtSecret, tokenOptions);
    } catch (error) {
      logError('Token generation error:', error);
      throw new Error('Token generation failed');
    }
  }

  verifyToken(token, options = {}) {
    try {
      const defaultOptions = {
        issuer: 'sentia-manufacturing',
        audience: 'sentia-users',
        algorithms: ['HS256']
      };

      const verifyOptions = { ...defaultOptions, ...options };
      
      // Check if token is blacklisted
      if (this.tokenBlacklist.has(token)) {
        throw new Error('Token has been revoked');
      }

      const decoded = jwt.verify(token, this.jwtSecret, verifyOptions);
      
      // Additional security validations
      this.validateTokenSecurity(decoded, options.requestContext);
      
      return decoded;
    } catch (error) {
      logError('Token verification error:', error);
      throw error;
    }
  }

  async revokeToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.jti) {
        // Add to blacklist
        this.tokenBlacklist.add(token);
        
        // Store in Redis for distributed blacklist
        await redisCacheService.set(
          `blacklisted_token:${decoded.jti}`,
          { token, revokedAt: new Date().toISOString() },
          decoded.exp ? (decoded.exp - Math.floor(Date.now() / 1000)) : 86400
        );
        
        logDebug(`Token revoked: ${decoded.jti}`);
        return true;
      }
      return false;
    } catch (error) {
      logError('Token revocation error:', error);
      return false;
    }
  }

  // API Key management
  generateAPIKey(userId, permissions = [], expirationDays = 365) {
    const keyData = {
      userId,
      permissions,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString(),
      keyId: this.generateUniqueId()
    };

    const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Store key data (would typically be in database)
    this.storeAPIKey(keyHash, keyData);
    
    return { apiKey, keyId: keyData.keyId };
  }

  async validateAPIKey(apiKey) {
    try {
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const keyData = await this.retrieveAPIKey(keyHash);
      
      if (!keyData) {
        throw new Error('Invalid API key');
      }
      
      if (new Date() > new Date(keyData.expiresAt)) {
        throw new Error('API key has expired');
      }
      
      return keyData;
    } catch (error) {
      logError('API key validation error:', error);
      throw error;
    }
  }

  // Multi-factor authentication
  generateTOTPSecret(userId) {
    const secret = crypto.randomBytes(20).toString('base32');
    const qrCodeData = {
      secret,
      userId,
      issuer: 'Sentia Manufacturing',
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    };
    
    // Store secret securely (encrypted)
    const encryptedSecret = this.encrypt(secret);
    this.storeTOTPSecret(userId, encryptedSecret);
    
    return qrCodeData;
  }

  verifyTOTP(userId, token) {
    try {
      const encryptedSecret = this.retrieveTOTPSecret(userId);
      if (!encryptedSecret) {
        throw new Error('TOTP not configured for user');
      }
      
      const secret = this.decrypt(encryptedSecret);
      
      // Implement TOTP verification logic
      const isValid = this.calculateTOTP(secret, token);
      
      if (!isValid) {
        this.logSecurityEvent('INVALID_TOTP_ATTEMPT', { userId, timestamp: new Date() });
      }
      
      return isValid;
    } catch (error) {
      logError('TOTP verification error:', error);
      return false;
    }
  }

  calculateTOTP(secret, providedToken) {
    const time = Math.floor(Date.now() / 30000);
    const buffer = Buffer.allocUnsafe(8);
    
    for (let i = 0; i < 8; i++) {
      buffer[7 - i] = time & 0xff;
      time >> 8;
    }
    
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
    hmac.update(buffer);
    const digest = hmac.digest();
    
    const offset = digest[digest.length - 1] & 0xf;
    const code = (
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff)
    ) % 1000000;
    
    const expectedToken = code.toString().padStart(6, '0');
    return expectedToken === providedToken;
  }

  // Rate limiting
  async checkRateLimit(identifier, windowMs, maxRequests) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get requests from Redis
    const key = `rate_limit:${identifier}`;
    const requests = await redisCacheService.get(key) || [];
    
    // Filter requests within the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: validRequests[0] + windowMs
      };
    }
    
    // Add current request
    validRequests.push(now);
    
    // Store updated requests
    await redisCacheService.set(key, validRequests, Math.ceil(windowMs / 1000));
    
    return {
      allowed: true,
      remainingRequests: maxRequests - validRequests.length,
      resetTime: now + windowMs
    };
  }

  // Anomaly detection
  analyzeRequestPattern(userId, requestData) {
    const pattern = {
      userId,
      ip: requestData.ip,
      userAgent: requestData.userAgent,
      endpoint: requestData.endpoint,
      timestamp: Date.now()
    };
    
    const userPatterns = this.anomalyDetection.suspiciousPatterns.get(userId) || [];
    userPatterns.push(pattern);
    
    // Keep only recent patterns
    const recentPatterns = userPatterns.filter(
      p => (Date.now() - p.timestamp) < this.anomalyDetection.timeWindow
    );
    
    this.anomalyDetection.suspiciousPatterns.set(userId, recentPatterns);
    
    // Detect anomalies
    const anomalies = this.detectAnomalies(userId, recentPatterns);
    
    if (anomalies.length > 0) {
      this.handleSecurityAnomalies(userId, anomalies);
    }
    
    return anomalies;
  }

  detectAnomalies(userId, patterns) {
    const anomalies = [];
    
    // Check for rapid requests from different IPs
    const ips = new Set(patterns.map(p => p.ip));
    if (ips.size > 5 && patterns.length > 20) {
      anomalies.push({
        type: 'MULTIPLE_IP_ADDRESSES',
        severity: 'high',
        description: `User ${userId} accessing from ${ips.size} different IPs`
      });
    }
    
    // Check for unusual user agents
    const userAgents = new Set(patterns.map(p => p.userAgent));
    if (userAgents.size > 3) {
      anomalies.push({
        type: 'MULTIPLE_USER_AGENTS',
        severity: 'medium',
        description: `User ${userId} using ${userAgents.size} different user agents`
      });
    }
    
    // Check for high request frequency
    const requestsPerMinute = patterns.length / (this.anomalyDetection.timeWindow / 60000);
    if (requestsPerMinute > 100) {
      anomalies.push({
        type: 'HIGH_REQUEST_FREQUENCY',
        severity: 'high',
        description: `User ${userId} making ${requestsPerMinute.toFixed(1)} requests per minute`
      });
    }
    
    return anomalies;
  }

  handleSecurityAnomalies(userId, anomalies) {
    anomalies.forEach(anomaly => {
      this.logSecurityEvent('ANOMALY_DETECTED', {
        userId,
        anomaly,
        timestamp: new Date().toISOString()
      });
    });
    
    // Auto-suspend high-severity anomalies
    const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
    if (highSeverityAnomalies.length > 0) {
      this.temporarySuspendUser(userId, 'Security anomalies detected', 3600); // 1 hour
    }
  }

  // Security event logging
  logSecurityEvent(eventType, data) {
    const event = {
      id: this.generateUniqueId(),
      type: eventType,
      timestamp: new Date().toISOString(),
      data: data,
      severity: this.getEventSeverity(eventType)
    };
    
    this.securityEvents.push(event);
    
    // Keep only recent events
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-5000);
    }
    
    // Log to console and store in Redis
    logDebug(`Security Event [${event.severity.toUpperCase()}]: ${eventType}`, data);
    redisCacheService.set(`security_event:${event.id}`, event, 86400); // 24 hours
    
    // Alert on high-severity events
    if (event.severity === 'critical' || event.severity === 'high') {
      this.sendSecurityAlert(event);
    }
  }

  getEventSeverity(eventType) {
    const severityMap = {
      'LOGIN_ATTEMPT': 'low',
      'LOGIN_SUCCESS': 'info',
      'LOGIN_FAILURE': 'medium',
      'PASSWORD_CHANGE': 'medium',
      'TOKEN_REFRESH': 'low',
      'TOKEN_REVOCATION': 'medium',
      'INVALID_TOTP_ATTEMPT': 'medium',
      'ANOMALY_DETECTED': 'high',
      'BRUTE_FORCE_DETECTED': 'critical',
      'SQL_INJECTION_ATTEMPT': 'critical',
      'XSS_ATTEMPT': 'high',
      'UNAUTHORIZED_ACCESS': 'high'
    };
    
    return severityMap[eventType] || 'medium';
  }

  // Security utilities
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateUniqueId() {
    return crypto.randomBytes(16).toString('hex');
  }

  hashIP(ip) {
    return crypto.createHash('sha256').update(ip + 'salt').digest('hex').substring(0, 16);
  }

  hashUserAgent(userAgent) {
    return crypto.createHash('sha256').update(userAgent + 'salt').digest('hex').substring(0, 16);
  }

  generateDeviceFingerprint(data) {
    const fingerprint = [
      data.userAgent || '',
      data.acceptLanguage || '',
      data.screenResolution || '',
      data.timezone || ''
    ].join('|');
    
    return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 32);
  }

  validateTokenSecurity(decoded, requestContext) {
    if (!requestContext) return;
    
    // Validate IP hash
    const currentIPHash = this.hashIP(requestContext.ip);
    if (decoded.security?.ipHash && decoded.security.ipHash !== currentIPHash) {
      this.logSecurityEvent('IP_MISMATCH', {
        userId: decoded.sub,
        expectedIP: decoded.security.ipHash,
        actualIP: currentIPHash
      });
      // Could throw error for strict security, but allowing for now
    }
    
    // Validate user agent
    const currentUAHash = this.hashUserAgent(requestContext.userAgent);
    if (decoded.security?.userAgent && decoded.security.userAgent !== currentUAHash) {
      this.logSecurityEvent('USER_AGENT_MISMATCH', {
        userId: decoded.sub,
        expectedUA: decoded.security.userAgent,
        actualUA: currentUAHash
      });
    }
  }

  // Placeholder methods for storage (would integrate with database)
  async storeAPIKey(keyHash, keyData) {
    await redisCacheService.set(`api_key:${keyHash}`, keyData, 86400 * 365); // 1 year
  }

  async retrieveAPIKey(keyHash) {
    return await redisCacheService.get(`api_key:${keyHash}`);
  }

  storeTOTPSecret(userId, encryptedSecret) {
    // Store in secure database
    redisCacheService.set(`totp_secret:${userId}`, encryptedSecret, 86400 * 365);
  }

  retrieveTOTPSecret(userId) {
    // Retrieve from secure database
    return redisCacheService.get(`totp_secret:${userId}`);
  }

  temporarySuspendUser(userId, reason, durationSeconds) {
    const suspensionData = {
      userId,
      reason,
      suspendedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + durationSeconds * 1000).toISOString()
    };
    
    redisCacheService.set(`user_suspension:${userId}`, suspensionData, durationSeconds);
    
    this.logSecurityEvent('USER_SUSPENDED', suspensionData);
    logWarn(`User ${userId} temporarily suspended: ${reason}`);
  }

  async isUserSuspended(userId) {
    const suspension = await redisCacheService.get(`user_suspension:${userId}`);
    return suspension !== null;
  }

  sendSecurityAlert(event) {
    // Placeholder for alert system integration
    logError(`🚨 SECURITY ALERT: ${event.type} - ${JSON.stringify(event.data)}`);
  }

  initializeSecurityPolicies() {
    this.securityPolicies = {
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAge: 90, // days
        preventReuse: 12 // last N passwords
      },
      sessionPolicy: {
        maxDuration: 24 * 60 * 60, // 24 hours in seconds
        inactivityTimeout: 30 * 60, // 30 minutes in seconds
        maxConcurrentSessions: 3
      },
      rateLimiting: {
        api: { windowMs: 15 * 60 * 1000, max: 1000 },
        auth: { windowMs: 15 * 60 * 1000, max: 100 },
        sensitive: { windowMs: 60 * 60 * 1000, max: 10 }
      }
    };
  }

  startSecurityMonitoring() {
    setInterval(() => {
      this.cleanupExpiredTokens();
      this.analyzeSecurityTrends();
    }, 60000); // Every minute
  }

  cleanupExpiredTokens() {
    // Cleanup logic for expired tokens and sessions
    const now = Date.now() / 1000;
    
    for (const token of this.tokenBlacklist) {
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp && decoded.exp < now) {
          this.tokenBlacklist.delete(token);
        }
      } catch (error) {
        // Invalid token, remove it
        this.tokenBlacklist.delete(token);
      }
    }
  }

  analyzeSecurityTrends() {
    const recentEvents = this.securityEvents.filter(
      event => Date.now() - new Date(event.timestamp).getTime() < 3600000 // Last hour
    );
    
    const eventCounts = {};
    recentEvents.forEach(event => {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
    });
    
    // Detect concerning trends
    if (eventCounts['LOGIN_FAILURE'] > 50) {
      this.logSecurityEvent('BRUTE_FORCE_DETECTED', {
        failedLogins: eventCounts['LOGIN_FAILURE'],
        timeWindow: '1 hour'
      });
    }
  }

  getSecuritySummary() {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000);
    
    const recentEvents = this.securityEvents.filter(
      event => new Date(event.timestamp) > hourAgo
    );
    
    const eventsByType = {};
    const eventsBySeverity = {};
    
    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });
    
    return {
      summary: {
        totalEvents: recentEvents.length,
        activeTokens: this.tokenBlacklist.size,
        suspiciousUsers: this.anomalyDetection.suspiciousPatterns.size,
        timeWindow: '1 hour'
      },
      eventsByType,
      eventsBySeverity,
      securityPolicies: this.securityPolicies,
      timestamp: now.toISOString()
    };
  }
}

const enterpriseSecurityService = new EnterpriseSecurityService();

export default enterpriseSecurityService;