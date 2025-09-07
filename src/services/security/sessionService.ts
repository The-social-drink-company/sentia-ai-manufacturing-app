// Enterprise Session Management Service

import { randomBytes, createHash } from 'crypto';

export interface Session {
  sessionId: string;
  userId: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  location?: string;
  isActive: boolean;
  isSuspicious: boolean;
  riskScore: number;
  metadata: Record<string, any>;
}

export interface SessionConfig {
  maxIdleTime: number;        // Maximum idle time in milliseconds
  maxSessionDuration: number; // Maximum session duration in milliseconds
  maxConcurrentSessions: number;
  requireReauthAfter: number; // Require re-authentication after this duration
  enableFingerprinting: boolean;
  enableGeoLocation: boolean;
  suspiciousActivityThreshold: number;
}

export interface SessionActivity {
  timestamp: Date;
  action: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  riskScore: number;
  metadata?: Record<string, any>;
}

export class SessionService {
  private static instance: SessionService;
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private sessionActivities: Map<string, SessionActivity[]> = new Map();
  private blacklistedTokens: Set<string> = new Set();
  private suspiciousPatterns: Map<string, number> = new Map();

  private readonly DEFAULT_CONFIG: SessionConfig = {
    maxIdleTime: 30 * 60 * 1000,        // 30 minutes
    maxSessionDuration: 8 * 60 * 60 * 1000, // 8 hours
    maxConcurrentSessions: 3,
    requireReauthAfter: 2 * 60 * 60 * 1000, // 2 hours
    enableFingerprinting: true,
    enableGeoLocation: true,
    suspiciousActivityThreshold: 0.7
  };

  private config: SessionConfig;

  private constructor() {
    this.config = this.DEFAULT_CONFIG;
    this.startCleanupInterval();
  }

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  // Create new session
  public createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    deviceId?: string,
    location?: string
  ): Session {
    // Check concurrent sessions
    this.enforceSessionLimits(userId);

    const sessionId = this.generateSessionId();
    const now = new Date();

    const session: Session = {
      sessionId,
      userId,
      createdAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + this.config.maxSessionDuration),
      ipAddress,
      userAgent,
      deviceId,
      location,
      isActive: true,
      isSuspicious: false,
      riskScore: this.calculateInitialRiskScore(ipAddress, userAgent, location),
      metadata: {}
    };

    // Store session
    this.sessions.set(sessionId, session);

    // Track user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);

    // Log session creation
    this.logActivity(sessionId, 'session_created', ipAddress, userAgent, true);

    return session;
  }

  // Validate session
  public validateSession(
    sessionId: string,
    ipAddress?: string,
    userAgent?: string
  ): { valid: boolean; reason?: string; requiresReauth?: boolean } {
    // Check if token is blacklisted
    if (this.blacklistedTokens.has(sessionId)) {
      return { valid: false, reason: 'Session has been revoked' };
    }

    const session = this.sessions.get(sessionId);

    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    if (!session.isActive) {
      return { valid: false, reason: 'Session is inactive' };
    }

    const now = new Date();

    // Check session expiration
    if (now > session.expiresAt) {
      this.terminateSession(sessionId, 'expired');
      return { valid: false, reason: 'Session expired' };
    }

    // Check idle timeout
    const idleTime = now.getTime() - session.lastActivity.getTime();
    if (idleTime > this.config.maxIdleTime) {
      this.terminateSession(sessionId, 'idle_timeout');
      return { valid: false, reason: 'Session idle timeout' };
    }

    // Check for suspicious activity
    if (ipAddress && ipAddress !== session.ipAddress) {
      session.riskScore += 0.3;
      this.logActivity(sessionId, 'ip_change', ipAddress, userAgent || '', true);
    }

    if (userAgent && userAgent !== session.userAgent) {
      session.riskScore += 0.2;
      this.logActivity(sessionId, 'user_agent_change', ipAddress || '', userAgent, true);
    }

    if (session.riskScore > this.config.suspiciousActivityThreshold) {
      session.isSuspicious = true;
      this.handleSuspiciousSession(session);
      return { valid: false, reason: 'Suspicious activity detected' };
    }

    // Check if re-authentication is required
    const sessionAge = now.getTime() - session.createdAt.getTime();
    const requiresReauth = sessionAge > this.config.requireReauthAfter;

    // Update last activity
    session.lastActivity = now;

    return { valid: true, requiresReauth };
  }

  // Refresh session
  public refreshSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);

    if (!session || !session.isActive) {
      return null;
    }

    const now = new Date();
    session.lastActivity = now;
    session.expiresAt = new Date(now.getTime() + this.config.maxSessionDuration);

    this.logActivity(sessionId, 'session_refreshed', session.ipAddress, session.userAgent, true);

    return session;
  }

  // Terminate session
  public terminateSession(sessionId: string, reason: string): void {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return;
    }

    session.isActive = false;
    this.blacklistedTokens.add(sessionId);

    // Remove from user sessions
    const userSessions = this.userSessions.get(session.userId);
    if (userSessions) {
      userSessions.delete(sessionId);
    }

    this.logActivity(
      sessionId,
      `session_terminated_${reason}`,
      session.ipAddress,
      session.userAgent,
      true
    );

    // Clean up after delay
    setTimeout(() => {
      this.sessions.delete(sessionId);
      this.sessionActivities.delete(sessionId);
    }, 60 * 60 * 1000); // Keep for 1 hour for audit
  }

  // Terminate all user sessions
  public terminateUserSessions(userId: string, reason: string): void {
    const sessionIds = this.userSessions.get(userId);

    if (!sessionIds) {
      return;
    }

    sessionIds.forEach(sessionId => {
      this.terminateSession(sessionId, reason);
    });

    this.userSessions.delete(userId);
  }

  // Get active sessions for user
  public getUserSessions(userId: string): Session[] {
    const sessionIds = this.userSessions.get(userId);

    if (!sessionIds) {
      return [];
    }

    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter((session): session is Session => session !== undefined && session.isActive);
  }

  // Get session activity log
  public getSessionActivity(sessionId: string): SessionActivity[] {
    return this.sessionActivities.get(sessionId) || [];
  }

  // Enforce session limits
  private enforceSessionLimits(userId: string): void {
    const userSessions = this.getUserSessions(userId);

    if (userSessions.length >= this.config.maxConcurrentSessions) {
      // Terminate oldest session
      const oldestSession = userSessions.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )[0];

      if (oldestSession) {
        this.terminateSession(oldestSession.sessionId, 'concurrent_limit');
      }
    }
  }

  // Calculate initial risk score
  private calculateInitialRiskScore(
    ipAddress: string,
    userAgent: string,
    location?: string
  ): number {
    let riskScore = 0;

    // Check for VPN/Proxy
    if (this.isVPNOrProxy(ipAddress)) {
      riskScore += 0.3;
    }

    // Check for suspicious user agent
    if (this.isSuspiciousUserAgent(userAgent)) {
      riskScore += 0.2;
    }

    // Check for unusual location
    if (location && this.isUnusualLocation(location)) {
      riskScore += 0.2;
    }

    // Check for rapid session creation
    const recentAttempts = this.suspiciousPatterns.get(ipAddress) || 0;
    if (recentAttempts > 5) {
      riskScore += 0.4;
    }

    return Math.min(riskScore, 1);
  }

  // Handle suspicious session
  private handleSuspiciousSession(session: Session): void {
    // Log security event
    console.warn(`Suspicious session detected: ${session.sessionId}`, {
      userId: session.userId,
      riskScore: session.riskScore,
      ipAddress: session.ipAddress
    });

    // In production, would trigger security alerts
    // Send notification to security team
    // Potentially require additional authentication
  }

  // Log session activity
  private logActivity(
    sessionId: string,
    action: string,
    ipAddress: string,
    userAgent: string,
    success: boolean
  ): void {
    const activity: SessionActivity = {
      timestamp: new Date(),
      action,
      ipAddress,
      userAgent,
      success,
      riskScore: 0
    };

    if (!this.sessionActivities.has(sessionId)) {
      this.sessionActivities.set(sessionId, []);
    }

    this.sessionActivities.get(sessionId)!.push(activity);

    // Track suspicious patterns
    if (!success) {
      const attempts = this.suspiciousPatterns.get(ipAddress) || 0;
      this.suspiciousPatterns.set(ipAddress, attempts + 1);
    }
  }

  // Cleanup expired sessions
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = new Date();

      // Clean up expired sessions
      for (const [sessionId, session] of this.sessions) {
        if (now > session.expiresAt || !session.isActive) {
          this.terminateSession(sessionId, 'cleanup');
        }
      }

      // Clean up blacklisted tokens older than 24 hours
      // In production, this would be stored in Redis with TTL
      this.blacklistedTokens.clear();

      // Reset suspicious patterns
      this.suspiciousPatterns.clear();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  // Helper methods
  private generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }

  private isVPNOrProxy(ipAddress: string): boolean {
    // In production, integrate with IP intelligence service
    // For now, return false
    return false;
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private isUnusualLocation(location: string): boolean {
    // In production, check against user's usual locations
    return false;
  }

  // Update configuration
  public updateConfig(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get session statistics
  public getStatistics(): {
    activeSessions: number;
    totalUsers: number;
    suspiciousSessions: number;
    averageRiskScore: number;
  } {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive);
    const suspiciousSessions = activeSessions.filter(s => s.isSuspicious);
    const totalRiskScore = activeSessions.reduce((sum, s) => sum + s.riskScore, 0);

    return {
      activeSessions: activeSessions.length,
      totalUsers: this.userSessions.size,
      suspiciousSessions: suspiciousSessions.length,
      averageRiskScore: activeSessions.length > 0 ? totalRiskScore / activeSessions.length : 0
    };
  }
}

export default SessionService.getInstance();