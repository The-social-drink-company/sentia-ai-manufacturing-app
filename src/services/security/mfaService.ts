// Multi-Factor Authentication Service

import { randomBytes, createHmac } from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export enum MFAMethod {
  TOTP = 'totp',           // Time-based One-Time Password
  SMS = 'sms',             // SMS verification
  EMAIL = 'email',         // Email verification
  PUSH = 'push',           // Push notification
  BIOMETRIC = 'biometric', // Fingerprint/Face ID
  HARDWARE = 'hardware',   // Hardware token (YubiKey)
  BACKUP_CODES = 'backup_codes'
}

export interface MFAConfig {
  enabled: boolean;
  methods: MFAMethod[];
  requiredMethods: number; // Number of methods required
  trustDeviceDuration?: number; // Duration in days
  enforceForRoles?: string[];
  enforceForActions?: string[];
}

export interface MFASetup {
  method: MFAMethod;
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
  phoneNumber?: string;
  email?: string;
}

export interface MFAChallenge {
  challengeId: string;
  method: MFAMethod;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

export interface TrustedDevice {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  trustedAt: Date;
  expiresAt: Date;
  fingerprint: string;
}

export class MFAService {
  private static instance: MFAService;
  private challenges: Map<string, MFAChallenge> = new Map();
  private trustedDevices: Map<string, TrustedDevice[]> = new Map();
  private userSecrets: Map<string, Map<MFAMethod, string>> = new Map();
  private backupCodes: Map<string, Set<string>> = new Map();

  private readonly MAX_ATTEMPTS = 3;
  private readonly CHALLENGE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  private readonly TOTP_WINDOW = 2; // Allow 2 time windows
  private readonly BACKUP_CODE_LENGTH = 8;
  private readonly BACKUP_CODE_COUNT = 10;

  private constructor() {}

  public static getInstance(): MFAService {
    if (!MFAService.instance) {
      MFAService.instance = new MFAService();
    }
    return MFAService.instance;
  }

  // Setup MFA for a user
  public async setupMFA(userId: string, method: MFAMethod): Promise<MFASetup> {
    switch (method) {
      case MFAMethod.TOTP:
        return this.setupTOTP(userId);
      case MFAMethod.SMS:
        return this.setupSMS(userId);
      case MFAMethod.EMAIL:
        return this.setupEmail(userId);
      case MFAMethod.BACKUP_CODES:
        return this.generateBackupCodes(userId);
      case MFAMethod.BIOMETRIC:
        return this.setupBiometric(userId);
      case MFAMethod.HARDWARE:
        return this.setupHardwareToken(userId);
      default:
        throw new Error(`Unsupported MFA method: ${method}`);
    }
  }

  // Setup TOTP (Google Authenticator, Authy, etc.)
  private async setupTOTP(userId: string): Promise<MFASetup> {
    const secret = speakeasy.generateSecret({
      name: `Sentia Manufacturing (${userId})`,
      issuer: 'Sentia',
      length: 32
    });

    // Store secret for user
    if (!this.userSecrets.has(userId)) {
      this.userSecrets.set(userId, new Map());
    }
    this.userSecrets.get(userId)!.set(MFAMethod.TOTP, secret.base32);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      method: MFAMethod.TOTP,
      secret: secret.base32,
      qrCode
    };
  }

  // Setup SMS verification
  private async setupSMS(userId: string, phoneNumber?: string): Promise<MFASetup> {
    // In production, integrate with SMS provider (Twilio, AWS SNS, etc.)
    return {
      method: MFAMethod.SMS,
      phoneNumber: phoneNumber || '+1234567890'
    };
  }

  // Setup Email verification
  private async setupEmail(userId: string, email?: string): Promise<MFASetup> {
    // In production, integrate with email service
    return {
      method: MFAMethod.EMAIL,
      email: email || 'user@example.com'
    };
  }

  // Setup Biometric authentication
  private async setupBiometric(userId: string): Promise<MFASetup> {
    // This would integrate with WebAuthn API
    return {
      method: MFAMethod.BIOMETRIC
    };
  }

  // Setup Hardware token
  private async setupHardwareToken(userId: string): Promise<MFASetup> {
    // This would integrate with WebAuthn API for hardware tokens
    return {
      method: MFAMethod.HARDWARE
    };
  }

  // Generate backup codes
  private async generateBackupCodes(userId: string): Promise<MFASetup> {
    const codes: string[] = [];
    const userCodes = new Set<string>();

    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      const code = this.generateSecureCode(this.BACKUP_CODE_LENGTH);
      codes.push(code);
      userCodes.add(this.hashBackupCode(code));
    }

    this.backupCodes.set(userId, userCodes);

    return {
      method: MFAMethod.BACKUP_CODES,
      backupCodes: codes
    };
  }

  // Create MFA challenge
  public createChallenge(userId: string, method: MFAMethod): MFAChallenge {
    const challengeId = this.generateChallengeId();
    const challenge: MFAChallenge = {
      challengeId,
      method,
      expiresAt: new Date(Date.now() + this.CHALLENGE_EXPIRY),
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS
    };

    this.challenges.set(challengeId, challenge);

    // Send verification code if needed
    switch (method) {
      case MFAMethod.SMS:
        this.sendSMSCode(userId);
        break;
      case MFAMethod.EMAIL:
        this.sendEmailCode(userId);
        break;
      case MFAMethod.PUSH:
        this.sendPushNotification(userId);
        break;
    }

    return challenge;
  }

  // Verify MFA challenge
  public verifyChallenge(challengeId: string, code: string, userId: string): boolean {
    const challenge = this.challenges.get(challengeId);
    
    if (!challenge) {
      throw new Error('Invalid challenge ID');
    }

    if (new Date() > challenge.expiresAt) {
      this.challenges.delete(challengeId);
      throw new Error('Challenge expired');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      this.challenges.delete(challengeId);
      throw new Error('Maximum attempts exceeded');
    }

    challenge.attempts++;

    let isValid = false;

    switch (challenge.method) {
      case MFAMethod.TOTP:
        isValid = this.verifyTOTP(userId, code);
        break;
      case MFAMethod.SMS:
      case MFAMethod.EMAIL:
        isValid = this.verifyCode(userId, code);
        break;
      case MFAMethod.BACKUP_CODES:
        isValid = this.verifyBackupCode(userId, code);
        break;
      default:
        throw new Error(`Unsupported verification method: ${challenge.method}`);
    }

    if (isValid) {
      this.challenges.delete(challengeId);
    }

    return isValid;
  }

  // Verify TOTP code
  private verifyTOTP(userId: string, token: string): boolean {
    const userSecret = this.userSecrets.get(userId)?.get(MFAMethod.TOTP);
    
    if (!userSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: userSecret,
      encoding: 'base32',
      token,
      window: this.TOTP_WINDOW
    });
  }

  // Verify SMS/Email code
  private verifyCode(userId: string, code: string): boolean {
    // In production, verify against stored code
    // For demo, accept any 6-digit code
    return /^\d{6}$/.test(code);
  }

  // Verify backup code
  private verifyBackupCode(userId: string, code: string): boolean {
    const userCodes = this.backupCodes.get(userId);
    
    if (!userCodes) {
      return false;
    }

    const hashedCode = this.hashBackupCode(code);
    
    if (userCodes.has(hashedCode)) {
      userCodes.delete(hashedCode); // Each backup code can only be used once
      return true;
    }

    return false;
  }

  // Trust device
  public trustDevice(
    userId: string,
    deviceId: string,
    deviceName: string,
    deviceType: string,
    durationDays: number = 30
  ): TrustedDevice {
    const trustedDevice: TrustedDevice = {
      deviceId,
      deviceName,
      deviceType,
      trustedAt: new Date(),
      expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      fingerprint: this.generateDeviceFingerprint(deviceId, userId)
    };

    if (!this.trustedDevices.has(userId)) {
      this.trustedDevices.set(userId, []);
    }

    this.trustedDevices.get(userId)!.push(trustedDevice);

    return trustedDevice;
  }

  // Check if device is trusted
  public isDeviceTrusted(userId: string, deviceId: string): boolean {
    const devices = this.trustedDevices.get(userId) || [];
    const device = devices.find(d => d.deviceId === deviceId);

    if (!device) {
      return false;
    }

    if (new Date() > device.expiresAt) {
      // Remove expired device
      this.removeTrustedDevice(userId, deviceId);
      return false;
    }

    return true;
  }

  // Remove trusted device
  public removeTrustedDevice(userId: string, deviceId: string): void {
    const devices = this.trustedDevices.get(userId) || [];
    const filtered = devices.filter(d => d.deviceId !== deviceId);
    this.trustedDevices.set(userId, filtered);
  }

  // Get trusted devices for user
  public getTrustedDevices(userId: string): TrustedDevice[] {
    const devices = this.trustedDevices.get(userId) || [];
    const now = new Date();
    
    // Filter out expired devices
    return devices.filter(d => d.expiresAt > now);
  }

  // Check if MFA is required for action
  public isMFARequired(
    userId: string,
    action: string,
    userRole: string,
    config: MFAConfig
  ): boolean {
    if (!config.enabled) {
      return false;
    }

    // Check if role requires MFA
    if (config.enforceForRoles?.includes(userRole)) {
      return true;
    }

    // Check if action requires MFA
    if (config.enforceForActions?.includes(action)) {
      return true;
    }

    return false;
  }

  // Helper methods
  private generateChallengeId(): string {
    return randomBytes(16).toString('hex');
  }

  private generateSecureCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    const bytes = randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      code += chars[bytes[i] % chars.length];
    }
    
    return code;
  }

  private hashBackupCode(code: string): string {
    return createHmac('sha256', 'backup-code-secret')
      .update(code)
      .digest('hex');
  }

  private generateDeviceFingerprint(deviceId: string, userId: string): string {
    return createHmac('sha256', 'device-fingerprint-secret')
      .update(`${deviceId}-${userId}`)
      .digest('hex');
  }

  // Mock methods for SMS/Email/Push - In production, integrate with real services
  private sendSMSCode(userId: string): void {
    console.log(`Sending SMS code to user ${userId}`);
    // Integrate with Twilio, AWS SNS, etc.
  }

  private sendEmailCode(userId: string): void {
    console.log(`Sending email code to user ${userId}`);
    // Integrate with SendGrid, AWS SES, etc.
  }

  private sendPushNotification(userId: string): void {
    console.log(`Sending push notification to user ${userId}`);
    // Integrate with Firebase, OneSignal, etc.
  }
}

export default MFAService.getInstance();