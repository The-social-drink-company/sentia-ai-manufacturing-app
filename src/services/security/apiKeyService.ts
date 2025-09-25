// API Key Management and Rotation Service

import { randomBytes, createHash, createHmac } from 'crypto';

export interface APIKey {
  keyId: string;
  keyHash: string;
  name: string;
  userId: string;
  createdAt: Date;
  lastUsed: Date;
  expiresAt: Date;
  rotateAt: Date;
  permissions: string[];
  rateLimit: number;
  usageCount: number;
  isActive: boolean;
  environment: 'development' | 'staging' | 'production';
  ipWhitelist?: string[];
  metadata: Record<string, any>;
}

export interface APIKeyRotationPolicy {
  autoRotate: boolean;
  rotationInterval: number; // Days
  notifyBeforeExpiry: number; // Days
  maxKeyAge: number; // Days
  requireMFAForRotation: boolean;
}

export interface APIKeyUsage {
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  userAgent: string;
}

export class APIKeyService {
  private static instance: APIKeyService;
  private apiKeys: Map<string, APIKey> = new Map();
  private keyUsage: Map<string, APIKeyUsage[]> = new Map();
  private rotationPolicies: Map<string, APIKeyRotationPolicy> = new Map();
  private rotationSchedule: Map<string, NodeJS.Timeout> = new Map();
  private revokedKeys: Set<string> = new Set();

  private readonly DEFAULT_ROTATION_POLICY: APIKeyRotationPolicy = {
    autoRotate: true,
    rotationInterval: 90, // 90 days
    notifyBeforeExpiry: 7, // 7 days
    maxKeyAge: 365, // 1 year
    requireMFAForRotation: true
  };

  private readonly KEY_PREFIX = 'sk_';
  private readonly KEY_LENGTH = 32;

  private constructor() {
    this.startRotationScheduler();
  }

  public static getInstance(): APIKeyService {
    if (!APIKeyService.instance) {
      APIKeyService.instance = new APIKeyService();
    }
    return APIKeyService.instance;
  }

  // Generate new API key
  public generateAPIKey(
    userId: string,
    name: string,
    permissions: string[],
    environment: 'development' | 'staging' | 'production',
    expiryDays: number = 365,
    rateLimit: number = 1000,
    ipWhitelist?: string[]
  ): { key: string; keyId: string } {
    const keyId = this.generateKeyId();
    const rawKey = this.generateRawKey();
    const fullKey = `${this.KEY_PREFIX}${environment.charAt(0)}_${rawKey}`;
    const keyHash = this.hashAPIKey(fullKey);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);
    const rotateAt = new Date(now.getTime() + this.DEFAULT_ROTATION_POLICY.rotationInterval * 24 * 60 * 60 * 1000);

    const apiKey: APIKey = {
      keyId,
      keyHash,
      name,
      userId,
      createdAt: now,
      lastUsed: now,
      expiresAt,
      rotateAt,
      permissions,
      rateLimit,
      usageCount: 0,
      isActive: true,
      environment,
      ipWhitelist,
      metadata: {}
    };

    this.apiKeys.set(keyId, apiKey);
    this.scheduleRotation(keyId, rotateAt);

    // Log key generation
    this.logKeyEvent(keyId, 'key_generated');

    return { key: fullKey, keyId };
  }

  // Validate API key
  public validateAPIKey(
    key: string,
    ipAddress?: string,
    endpoint?: string
  ): { valid: boolean; keyId?: string; permissions?: string[]; reason?: string } {
    const keyHash = this.hashAPIKey(key);

    // Check if key is revoked
    if (this.revokedKeys.has(keyHash)) {
      return { valid: false, reason: 'API key has been revoked' };
    }

    // Find key by hash
    let foundKey: APIKey | undefined;
    let foundKeyId: string | undefined;

    for (const [keyId, apiKey] of this.apiKeys) {
      if (apiKey.keyHash === keyHash) {
        foundKey = apiKey;
        foundKeyId = keyId;
        break;
      }
    }

    if (!foundKey || !foundKeyId) {
      return { valid: false, reason: 'Invalid API key' };
    }

    if (!foundKey.isActive) {
      return { valid: false, reason: 'API key is inactive' };
    }

    const now = new Date();

    // Check expiration
    if (now > foundKey.expiresAt) {
      this.deactivateKey(foundKeyId, 'expired');
      return { valid: false, reason: 'API key expired' };
    }

    // Check IP whitelist
    if (foundKey.ipWhitelist && ipAddress) {
      if (!foundKey.ipWhitelist.includes(ipAddress)) {
        this.logKeyEvent(foundKeyId, 'ip_rejected', { ipAddress });
        return { valid: false, reason: 'IP address not whitelisted' };
      }
    }

    // Check if rotation is needed
    if (now > foundKey.rotateAt) {
      this.logKeyEvent(foundKeyId, 'rotation_required');
      // In production, would trigger rotation notification
    }

    // Update usage
    foundKey.lastUsed = now;
    foundKey.usageCount++;

    // Log usage
    if (endpoint) {
      this.trackUsage(foundKeyId, endpoint, 'GET', 200, 0, ipAddress || '', '');
    }

    return {
      valid: true,
      keyId: foundKeyId,
      permissions: foundKey.permissions
    };
  }

  // Rotate API key
  public async rotateAPIKey(
    keyId: string,
    requireMFA: boolean = true
  ): Promise<{ newKey: string; newKeyId: string } | null> {
    const oldKey = this.apiKeys.get(keyId);

    if (!oldKey) {
      throw new Error('API key not found');
    }

    // Check MFA requirement
    const policy = this.rotationPolicies.get(oldKey.userId) || this.DEFAULT_ROTATION_POLICY;
    if (policy.requireMFAForRotation && requireMFA) {
      // In production, would verify MFA here
      console.log('MFA verification required for key rotation');
    }

    // Generate new key
    const { key: newKey, keyId: newKeyId } = this.generateAPIKey(
      oldKey.userId,
      `${oldKey.name} (Rotated)`,
      oldKey.permissions,
      oldKey.environment,
      365,
      oldKey.rateLimit,
      oldKey.ipWhitelist
    );

    // Copy metadata
    const newApiKey = this.apiKeys.get(newKeyId);
    if (newApiKey) {
      newApiKey.metadata = { ...oldKey.metadata, rotatedFrom: keyId };
    }

    // Schedule old key for deactivation (grace period)
    setTimeout(() => {
      this.deactivateKey(keyId, 'rotated');
    }, 7 * 24 * 60 * 60 * 1000); // 7 days grace period

    // Log rotation
    this.logKeyEvent(keyId, 'key_rotated', { newKeyId });

    return { newKey, newKeyId };
  }

  // Revoke API key
  public revokeAPIKey(keyId: string, reason: string): void {
    const apiKey = this.apiKeys.get(keyId);

    if (!apiKey) {
      return;
    }

    apiKey.isActive = false;
    this.revokedKeys.add(apiKey.keyHash);

    // Cancel rotation schedule
    const schedule = this.rotationSchedule.get(keyId);
    if (schedule) {
      clearTimeout(schedule);
      this.rotationSchedule.delete(keyId);
    }

    this.logKeyEvent(keyId, 'key_revoked', { reason });
  }

  // Deactivate API key
  private deactivateKey(keyId: string, reason: string): void {
    const apiKey = this.apiKeys.get(keyId);

    if (!apiKey) {
      return;
    }

    apiKey.isActive = false;
    this.logKeyEvent(keyId, 'key_deactivated', { reason });
  }

  // Track API key usage
  public trackUsage(
    keyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    ipAddress: string,
    userAgent: string
  ): void {
    const usage: APIKeyUsage = {
      timestamp: new Date(),
      endpoint,
      method,
      statusCode,
      responseTime,
      ipAddress,
      userAgent
    };

    if (!this.keyUsage.has(keyId)) {
      this.keyUsage.set(keyId, []);
    }

    const usageLog = this.keyUsage.get(keyId)!;
    usageLog.push(usage);

    // Keep only last 1000 entries
    if (usageLog.length > 1000) {
      usageLog.shift();
    }

    // Check rate limit
    this.checkRateLimit(keyId);
  }

  // Check rate limit
  private checkRateLimit(keyId: string): boolean {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) {
      return false;
    }

    const usageLog = this.keyUsage.get(keyId) || [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentUsage = usageLog.filter(u => u.timestamp > oneHourAgo).length;

    if (recentUsage > apiKey.rateLimit) {
      this.logKeyEvent(keyId, 'rate_limit_exceeded', { usage: recentUsage, limit: apiKey.rateLimit });
      return false;
    }

    return true;
  }

  // Get API key statistics
  public getKeyStatistics(keyId: string): {
    totalUsage: number;
    averageResponseTime: number;
    errorRate: number;
    topEndpoints: { endpoint: string; count: number }[];
  } | null {
    const usageLog = this.keyUsage.get(keyId);
    if (!usageLog || usageLog.length === 0) {
      return null;
    }

    const totalUsage = usageLog.length;
    const totalResponseTime = usageLog.reduce((sum, u) => sum + u.responseTime, 0);
    const errors = usageLog.filter(u => u.statusCode >= 400).length;

    // Count endpoint usage
    const endpointCounts = new Map<string, number>();
    usageLog.forEach(u => {
      const count = endpointCounts.get(u.endpoint) || 0;
      endpointCounts.set(u.endpoint, count + 1);
    });

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalUsage,
      averageResponseTime: totalResponseTime / totalUsage,
      errorRate: errors / totalUsage,
      topEndpoints
    };
  }

  // Schedule key rotation
  private scheduleRotation(keyId: string, rotateAt: Date): void {
    const now = new Date();
    const delay = rotateAt.getTime() - now.getTime();

    if (delay <= 0) {
      // Rotation is due
      this.notifyRotationRequired(keyId);
      return;
    }

    const timeout = setTimeout(() => {
      this.notifyRotationRequired(keyId);
    }, delay);

    this.rotationSchedule.set(keyId, timeout);
  }

  // Notify rotation required
  private notifyRotationRequired(keyId: string): void {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) {
      return;
    }

    this.logKeyEvent(keyId, 'rotation_notification_sent');

    // In production, would send notification to user
    console.log(`API key rotation required for: ${apiKey.name}`);
  }

  // Start rotation scheduler
  private startRotationScheduler(): void {
    setInterval(() => {
      const now = new Date();

      for (const [keyId, apiKey] of this.apiKeys) {
        if (!apiKey.isActive) {
          continue;
        }

        // Check for upcoming expiration
        const daysToExpiry = (apiKey.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
        const policy = this.rotationPolicies.get(apiKey.userId) || this.DEFAULT_ROTATION_POLICY;

        if (daysToExpiry <= policy.notifyBeforeExpiry && daysToExpiry > 0) {
          this.logKeyEvent(keyId, 'expiry_warning', { daysToExpiry });
        }

        // Check key age
        const keyAge = (now.getTime() - apiKey.createdAt.getTime()) / (24 * 60 * 60 * 1000);
        if (keyAge > policy.maxKeyAge) {
          this.deactivateKey(keyId, 'max_age_exceeded');
        }
      }
    }, 24 * 60 * 60 * 1000); // Run daily
  }

  // Log key event
  private logKeyEvent(keyId: string, event: string, metadata?: Record<string, any>): void {
    console.log(`[APIKey] ${event}`, { keyId, ...metadata });
    // In production, would store in audit log
  }

  // Helper methods
  private generateKeyId(): string {
    return randomBytes(16).toString('hex');
  }

  private generateRawKey(): string {
    return randomBytes(this.KEY_LENGTH).toString('base64url');
  }

  private hashAPIKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  // Get user's API keys
  public getUserAPIKeys(userId: string): APIKey[] {
    const keys: APIKey[] = [];
    
    for (const apiKey of this.apiKeys.values()) {
      if (apiKey.userId === userId && apiKey.isActive) {
        // Return safe copy without hash
        const { keyHash, ...safeKey } = apiKey;
        keys.push(safeKey as APIKey);
      }
    }

    return keys;
  }

  // Set rotation policy for user
  public setRotationPolicy(userId: string, policy: Partial<APIKeyRotationPolicy>): void {
    const currentPolicy = this.rotationPolicies.get(userId) || this.DEFAULT_ROTATION_POLICY;
    this.rotationPolicies.set(userId, { ...currentPolicy, ...policy });
  }
}

export default APIKeyService.getInstance();