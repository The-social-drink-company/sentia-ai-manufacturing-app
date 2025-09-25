// Enterprise Data Protection Service

import { createCipheriv, createDecipheriv, randomBytes, scrypt, createHash } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Field encryption levels
export enum EncryptionLevel {
  NONE = 'none',
  STANDARD = 'standard',      // AES-256-GCM
  HIGH = 'high',              // AES-256-GCM with key rotation
  MAXIMUM = 'maximum'         // AES-256-GCM with HSM
}

// Data classification
export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  PII = 'pii',                // Personally Identifiable Information
  PHI = 'phi',                // Protected Health Information
  PCI = 'pci'                 // Payment Card Information
}

// Masking patterns
export enum MaskingPattern {
  FULL = 'full',              // Replace all characters
  PARTIAL = 'partial',        // Show first/last few characters
  EMAIL = 'email',            // Mask email address
  PHONE = 'phone',            // Mask phone number
  SSN = 'ssn',                // Mask social security number
  CREDIT_CARD = 'credit_card', // Mask credit card
  CUSTOM = 'custom'           // Custom pattern
}

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  saltLength: number;
  iterations: number;
  rotationInterval: number;   // Days
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  salt: string;
  keyVersion: number;
  algorithm: string;
  timestamp: Date;
}

export interface DataRetentionPolicy {
  classification: DataClassification;
  retentionDays: number;
  archiveAfterDays?: number;
  deleteAfterDays: number;
  requiresApproval: boolean;
  legalHold?: boolean;
}

export class DataProtectionService {
  private static instance: DataProtectionService;
  private encryptionKeys: Map<number, Buffer> = new Map();
  private currentKeyVersion: number = 1;
  private masterKey: Buffer;
  private retentionPolicies: Map<DataClassification, DataRetentionPolicy> = new Map();

  private readonly DEFAULT_CONFIG: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    saltLength: 32,
    iterations: 100000,
    rotationInterval: 90
  };

  private config: EncryptionConfig;

  private constructor() {
    this.config = this.DEFAULT_CONFIG;
    this.initializeMasterKey();
    this.initializeRetentionPolicies();
  }

  public static getInstance(): DataProtectionService {
    if (!DataProtectionService.instance) {
      DataProtectionService.instance = new DataProtectionService();
    }
    return DataProtectionService.instance;
  }

  // Initialize master key (in production, use HSM or KMS)
  private initializeMasterKey(): void {
    // In production, retrieve from secure key management service
    this.masterKey = Buffer.from(
      process.env.MASTER_ENCRYPTION_KEY || 'default-master-key-for-development',
      'utf-8'
    );
  }

  // Initialize retention policies
  private initializeRetentionPolicies(): void {
    this.retentionPolicies.set(DataClassification.PUBLIC, {
      classification: DataClassification.PUBLIC,
      retentionDays: 365,
      deleteAfterDays: 365,
      requiresApproval: false
    });

    this.retentionPolicies.set(DataClassification.INTERNAL, {
      classification: DataClassification.INTERNAL,
      retentionDays: 730,
      archiveAfterDays: 365,
      deleteAfterDays: 730,
      requiresApproval: false
    });

    this.retentionPolicies.set(DataClassification.CONFIDENTIAL, {
      classification: DataClassification.CONFIDENTIAL,
      retentionDays: 1095,
      archiveAfterDays: 365,
      deleteAfterDays: 1095,
      requiresApproval: true
    });

    this.retentionPolicies.set(DataClassification.RESTRICTED, {
      classification: DataClassification.RESTRICTED,
      retentionDays: 2555,
      archiveAfterDays: 730,
      deleteAfterDays: 2555,
      requiresApproval: true,
      legalHold: false
    });

    this.retentionPolicies.set(DataClassification.PII, {
      classification: DataClassification.PII,
      retentionDays: 1095,
      archiveAfterDays: 365,
      deleteAfterDays: 1095,
      requiresApproval: true
    });

    this.retentionPolicies.set(DataClassification.PCI, {
      classification: DataClassification.PCI,
      retentionDays: 365,
      deleteAfterDays: 365,
      requiresApproval: true
    });
  }

  // Encrypt field-level data
  public async encryptField(
    data: string,
    classification: DataClassification = DataClassification.CONFIDENTIAL
  ): Promise<EncryptedData> {
    const salt = randomBytes(this.config.saltLength);
    const key = await this.deriveKey(salt);
    const iv = randomBytes(this.config.ivLength);

    const cipher = createCipheriv(this.config.algorithm, key, iv);
    
    let ciphertext = cipher.update(data, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    
    const tag = (cipher as any).getAuthTag();

    return {
      ciphertext,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex'),
      keyVersion: this.currentKeyVersion,
      algorithm: this.config.algorithm,
      timestamp: new Date()
    };
  }

  // Decrypt field-level data
  public async decryptField(encryptedData: EncryptedData): Promise<string> {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const key = await this.deriveKey(salt, encryptedData.keyVersion);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');

    const decipher = createDecipheriv(encryptedData.algorithm || this.config.algorithm, key, iv);
    (decipher as any).setAuthTag(tag);

    let plaintext = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  }

  // Derive encryption key
  private async deriveKey(salt: Buffer, keyVersion: number = this.currentKeyVersion): Promise<Buffer> {
    if (this.encryptionKeys.has(keyVersion)) {
      return this.encryptionKeys.get(keyVersion)!;
    }

    const key = (await scryptAsync(
      this.masterKey,
      salt,
      this.config.keyLength
    )) as Buffer;

    this.encryptionKeys.set(keyVersion, key);
    return key;
  }

  // Mask sensitive data
  public maskData(data: string, pattern: MaskingPattern, customPattern?: string): string {
    switch (pattern) {
      case MaskingPattern.FULL:
        return '*'.repeat(data.length);

      case MaskingPattern.PARTIAL:
        if (data.length <= 4) return '*'.repeat(data.length);
        return data.substring(0, 2) + '*'.repeat(data.length - 4) + data.substring(data.length - 2);

      case MaskingPattern.EMAIL:
        const emailParts = data.split('@');
        if (emailParts.length !== 2) return this.maskData(data, MaskingPattern.PARTIAL);
        const [localPart, domain] = emailParts;
        const maskedLocal = localPart.substring(0, 2) + '*'.repeat(Math.max(localPart.length - 2, 1));
        return `${maskedLocal}@${domain}`;

      case MaskingPattern.PHONE:
        const cleaned = data.replace(/\D/g, '');
        if (cleaned.length < 10) return '*'.repeat(data.length);
        return `***-***-${cleaned.substring(cleaned.length - 4)}`;

      case MaskingPattern.SSN:
        const ssnCleaned = data.replace(/\D/g, '');
        if (ssnCleaned.length !== 9) return '*'.repeat(data.length);
        return `***-**-${ssnCleaned.substring(5)}`;

      case MaskingPattern.CREDIT_CARD:
        const ccCleaned = data.replace(/\D/g, '');
        if (ccCleaned.length < 12) return '*'.repeat(data.length);
        return '*'.repeat(ccCleaned.length - 4) + ccCleaned.substring(ccCleaned.length - 4);

      case MaskingPattern.CUSTOM:
        if (!customPattern) return this.maskData(data, MaskingPattern.PARTIAL);
        return data.replace(new RegExp(customPattern, 'g'), '*');

      default:
        return this.maskData(data, MaskingPattern.PARTIAL);
    }
  }

  // Tokenize sensitive data
  public tokenizeData(data: string): string {
    const token = randomBytes(16).toString('hex');
    // In production, store mapping in secure token vault
    return `tok_${token}`;
  }

  // Hash data (one-way)
  public hashData(data: string, salt?: string): string {
    const actualSalt = salt || randomBytes(16).toString('hex');
    const hash = createHash('sha256')
      .update(data + actualSalt)
      .digest('hex');
    return `${hash}:${actualSalt}`;
  }

  // Check data retention policy
  public checkRetentionPolicy(
    dataTimestamp: Date,
    classification: DataClassification
  ): {
    shouldArchive: boolean;
    shouldDelete: boolean;
    daysRemaining: number;
  } {
    const policy = this.retentionPolicies.get(classification);
    if (!policy) {
      return { shouldArchive: false, shouldDelete: false, daysRemaining: Infinity };
    }

    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - dataTimestamp.getTime()) / (24 * 60 * 60 * 1000));

    const shouldArchive = policy.archiveAfterDays ? ageInDays >= policy.archiveAfterDays : false;
    const shouldDelete = ageInDays >= policy.deleteAfterDays && !policy.legalHold;
    const daysRemaining = Math.max(0, policy.deleteAfterDays - ageInDays);

    return { shouldArchive, shouldDelete, daysRemaining };
  }

  // Sanitize input data
  public sanitizeInput(input: string, type: 'html' | 'sql' | 'script' | 'general' = 'general'): string {
    let sanitized = input;

    switch (type) {
      case 'html':
        sanitized = sanitized
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
        break;

      case 'sql':
        sanitized = sanitized
          .replace(/'/g, "''")
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\x00/g, '\\0')
          .replace(/\x1a/g, '\\Z');
        break;

      case 'script':
        sanitized = sanitized
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
        break;

      case 'general':
      default:
        // Remove control characters and non-printable characters
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
        break;
    }

    return sanitized;
  }

  // Validate data format
  public validateDataFormat(data: string, format: 'email' | 'phone' | 'ssn' | 'credit_card' | 'uuid'): boolean {
    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^\+?[1-9]\d{1,14}$/,
      ssn: /^\d{3}-?\d{2}-?\d{4}$/,
      credit_card: /^\d{13,19}$/,
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    };

    const pattern = patterns[format];
    if (!pattern) return false;

    const cleanedData = format === 'phone' || format === 'credit_card' 
      ? data.replace(/\D/g, '')
      : data;

    return pattern.test(cleanedData);
  }

  // Get data classification based on content
  public detectDataClassification(data: string): DataClassification {
    // Check for PII patterns
    if (this.validateDataFormat(data, 'ssn')) {
      return DataClassification.PII;
    }

    if (this.validateDataFormat(data, 'credit_card')) {
      return DataClassification.PCI;
    }

    if (this.validateDataFormat(data, 'email') || this.validateDataFormat(data, 'phone')) {
      return DataClassification.PII;
    }

    // Check for sensitive keywords
    const restrictedKeywords = ['password', 'secret', 'token', 'api_key', 'private_key'];
    const confidentialKeywords = ['salary', 'revenue', 'profit', 'loss', 'budget'];
    
    const lowerData = data.toLowerCase();
    
    if (restrictedKeywords.some(keyword => lowerData.includes(keyword))) {
      return DataClassification.RESTRICTED;
    }

    if (confidentialKeywords.some(keyword => lowerData.includes(keyword))) {
      return DataClassification.CONFIDENTIAL;
    }

    return DataClassification.INTERNAL;
  }

  // Rotate encryption keys
  public async rotateEncryptionKeys(): Promise<void> {
    this.currentKeyVersion++;
    this.encryptionKeys.clear();
    
    // In production, would update key management service
    console.log(`Encryption keys rotated to version ${this.currentKeyVersion}`);
  }

  // Export data protection metrics
  public getMetrics(): {
    encryptedFields: number;
    maskedFields: number;
    currentKeyVersion: number;
    retentionPolicies: number;
  } {
    return {
      encryptedFields: 0, // Would track in production
      maskedFields: 0,    // Would track in production
      currentKeyVersion: this.currentKeyVersion,
      retentionPolicies: this.retentionPolicies.size
    };
  }
}

export default DataProtectionService.getInstance();