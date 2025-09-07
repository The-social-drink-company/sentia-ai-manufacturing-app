// Enterprise Audit Logging Service

import { randomBytes, createHash } from 'crypto';

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  SESSION_EXPIRED = 'session_expired',
  MFA_SUCCESS = 'mfa_success',
  MFA_FAILURE = 'mfa_failure',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  
  // Authorization events
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  PERMISSION_CHANGED = 'permission_changed',
  ROLE_CHANGED = 'role_changed',
  
  // Data events
  DATA_CREATE = 'data_create',
  DATA_READ = 'data_read',
  DATA_UPDATE = 'data_update',
  DATA_DELETE = 'data_delete',
  DATA_EXPORT = 'data_export',
  DATA_IMPORT = 'data_import',
  DATA_ENCRYPT = 'data_encrypt',
  DATA_DECRYPT = 'data_decrypt',
  
  // System events
  SYSTEM_START = 'system_start',
  SYSTEM_STOP = 'system_stop',
  CONFIG_CHANGE = 'config_change',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored',
  
  // Security events
  SECURITY_ALERT = 'security_alert',
  INTRUSION_DETECTED = 'intrusion_detected',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_REVOKED = 'api_key_revoked',
  
  // Compliance events
  GDPR_REQUEST = 'gdpr_request',
  DATA_RETENTION_APPLIED = 'data_retention_applied',
  CONSENT_GRANTED = 'consent_granted',
  CONSENT_REVOKED = 'consent_revoked',
  AUDIT_EXPORTED = 'audit_exported'
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AuditEvent {
  eventId: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result: 'success' | 'failure';
  reason?: string;
  metadata?: Record<string, any>;
  hash?: string;
  previousHash?: string;
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventTypes?: AuditEventType[];
  severity?: AuditSeverity[];
  resource?: string;
  result?: 'success' | 'failure';
  limit?: number;
  offset?: number;
}

export interface AuditStatistics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  topUsers: { userId: string; count: number }[];
  failureRate: number;
  timeRange: { start: Date; end: Date };
}

export class AuditService {
  private static instance: AuditService;
  private auditLog: AuditEvent[] = [];
  private auditIndex: Map<string, number[]> = new Map();
  private previousHash: string = '';
  private readonly maxLogSize = 100000;
  private readonly archiveThreshold = 90000;
  private isArchiving = false;

  private constructor() {
    this.initializeAuditLog();
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  private initializeAuditLog(): void {
    // In production, load from persistent storage
    this.previousHash = this.generateHash('genesis');
  }

  // Log audit event
  public logEvent(
    eventType: AuditEventType,
    result: 'success' | 'failure',
    details: {
      userId?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      resource?: string;
      action?: string;
      reason?: string;
      metadata?: Record<string, any>;
    } = {}
  ): AuditEvent {
    const severity = this.determineSeverity(eventType, result);
    
    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date(),
      eventType,
      severity,
      result,
      previousHash: this.previousHash,
      ...details
    };

    // Generate hash for tamper detection
    event.hash = this.generateEventHash(event);
    this.previousHash = event.hash;

    // Store event
    this.auditLog.push(event);
    this.updateIndex(event);

    // Check if archiving is needed
    if (this.auditLog.length >= this.archiveThreshold && !this.isArchiving) {
      this.archiveOldEvents();
    }

    // Real-time alerting for critical events
    if (severity === AuditSeverity.CRITICAL) {
      this.sendSecurityAlert(event);
    }

    return event;
  }

  // Query audit events
  public queryEvents(query: AuditQuery): AuditEvent[] {
    let results = [...this.auditLog];

    // Filter by date range
    if (query.startDate) {
      results = results.filter(e => e.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      results = results.filter(e => e.timestamp <= query.endDate!);
    }

    // Filter by user
    if (query.userId) {
      const userIndices = this.auditIndex.get(`user:${query.userId}`) || [];
      results = results.filter((_, index) => userIndices.includes(index));
    }

    // Filter by event types
    if (query.eventTypes && query.eventTypes.length > 0) {
      results = results.filter(e => query.eventTypes!.includes(e.eventType));
    }

    // Filter by severity
    if (query.severity && query.severity.length > 0) {
      results = results.filter(e => query.severity!.includes(e.severity));
    }

    // Filter by resource
    if (query.resource) {
      results = results.filter(e => e.resource === query.resource);
    }

    // Filter by result
    if (query.result) {
      results = results.filter(e => e.result === query.result);
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    results = results.slice(offset, offset + limit);

    return results;
  }

  // Get audit statistics
  public getStatistics(startDate?: Date, endDate?: Date): AuditStatistics {
    const events = this.queryEvents({ startDate, endDate });
    
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const userCounts: Map<string, number> = new Map();
    let failures = 0;

    events.forEach(event => {
      // Count by type
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      
      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      // Count by user
      if (event.userId) {
        userCounts.set(event.userId, (userCounts.get(event.userId) || 0) + 1);
      }
      
      // Count failures
      if (event.result === 'failure') {
        failures++;
      }
    });

    // Get top users
    const topUsers = Array.from(userCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const timeRange = events.length > 0
      ? { start: events[0].timestamp, end: events[events.length - 1].timestamp }
      : { start: new Date(), end: new Date() };

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      topUsers,
      failureRate: events.length > 0 ? failures / events.length : 0,
      timeRange
    };
  }

  // Verify audit log integrity
  public verifyIntegrity(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    let previousHash = this.generateHash('genesis');

    for (let i = 0; i < this.auditLog.length; i++) {
      const event = this.auditLog[i];
      
      // Check hash chain
      if (event.previousHash !== previousHash) {
        errors.push(`Hash chain broken at event ${event.eventId}`);
      }

      // Verify event hash
      const calculatedHash = this.generateEventHash(event);
      if (event.hash !== calculatedHash) {
        errors.push(`Hash mismatch for event ${event.eventId}`);
      }

      previousHash = event.hash!;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Export audit log
  public exportAuditLog(
    format: 'json' | 'csv' | 'syslog',
    query?: AuditQuery
  ): string {
    const events = query ? this.queryEvents(query) : this.auditLog;

    switch (format) {
      case 'json':
        return JSON.stringify(events, null, 2);

      case 'csv':
        return this.exportAsCSV(events);

      case 'syslog':
        return this.exportAsSyslog(events);

      default:
        return JSON.stringify(events);
    }
  }

  // Generate compliance report
  public generateComplianceReport(
    standard: 'SOC2' | 'GDPR' | 'HIPAA' | 'PCI-DSS',
    startDate: Date,
    endDate: Date
  ): Record<string, any> {
    const events = this.queryEvents({ startDate, endDate });
    
    switch (standard) {
      case 'SOC2':
        return this.generateSOC2Report(events);
      case 'GDPR':
        return this.generateGDPRReport(events);
      case 'HIPAA':
        return this.generateHIPAAReport(events);
      case 'PCI-DSS':
        return this.generatePCIDSSReport(events);
      default:
        return {};
    }
  }

  // Private helper methods

  private determineSeverity(eventType: AuditEventType, result: 'success' | 'failure'): AuditSeverity {
    // Critical events
    const criticalEvents = [
      AuditEventType.INTRUSION_DETECTED,
      AuditEventType.DATA_DELETE,
      AuditEventType.SYSTEM_STOP
    ];

    if (criticalEvents.includes(eventType) && result === 'failure') {
      return AuditSeverity.CRITICAL;
    }

    // Error events
    const errorEvents = [
      AuditEventType.LOGIN_FAILURE,
      AuditEventType.ACCESS_DENIED,
      AuditEventType.MFA_FAILURE
    ];

    if (errorEvents.includes(eventType) || result === 'failure') {
      return AuditSeverity.ERROR;
    }

    // Warning events
    const warningEvents = [
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.RATE_LIMIT_EXCEEDED,
      AuditEventType.SESSION_EXPIRED
    ];

    if (warningEvents.includes(eventType)) {
      return AuditSeverity.WARNING;
    }

    return AuditSeverity.INFO;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generateHash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private generateEventHash(event: AuditEvent): string {
    const eventData = JSON.stringify({
      eventId: event.eventId,
      timestamp: event.timestamp,
      eventType: event.eventType,
      userId: event.userId,
      result: event.result,
      previousHash: event.previousHash
    });
    return this.generateHash(eventData);
  }

  private updateIndex(event: AuditEvent): void {
    const index = this.auditLog.length - 1;

    // Index by user
    if (event.userId) {
      const userKey = `user:${event.userId}`;
      if (!this.auditIndex.has(userKey)) {
        this.auditIndex.set(userKey, []);
      }
      this.auditIndex.get(userKey)!.push(index);
    }

    // Index by event type
    const typeKey = `type:${event.eventType}`;
    if (!this.auditIndex.has(typeKey)) {
      this.auditIndex.set(typeKey, []);
    }
    this.auditIndex.get(typeKey)!.push(index);
  }

  private async archiveOldEvents(): Promise<void> {
    this.isArchiving = true;
    
    // In production, move to cold storage
    const archiveSize = Math.floor(this.auditLog.length / 2);
    const eventsToArchive = this.auditLog.splice(0, archiveSize);
    
    console.log(`Archived ${eventsToArchive.length} audit events`);
    
    // Rebuild index
    this.auditIndex.clear();
    this.auditLog.forEach((event, index) => this.updateIndex(event));
    
    this.isArchiving = false;
  }

  private sendSecurityAlert(event: AuditEvent): void {
    // In production, send to security team
    console.error('SECURITY ALERT:', event);
  }

  private exportAsCSV(events: AuditEvent[]): string {
    const headers = ['Event ID', 'Timestamp', 'Type', 'Severity', 'User', 'Result', 'Resource', 'IP Address'];
    const rows = events.map(e => [
      e.eventId,
      e.timestamp.toISOString(),
      e.eventType,
      e.severity,
      e.userId || '',
      e.result,
      e.resource || '',
      e.ipAddress || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private exportAsSyslog(events: AuditEvent[]): string {
    return events.map(e => {
      const priority = this.getSyslogPriority(e.severity);
      const timestamp = e.timestamp.toISOString();
      const hostname = 'sentia-manufacturing';
      const appName = 'audit';
      const message = `${e.eventType} ${e.result} user=${e.userId || 'anonymous'} resource=${e.resource || 'none'}`;
      
      return `<${priority}>${timestamp} ${hostname} ${appName}: ${message}`;
    }).join('\n');
  }

  private getSyslogPriority(severity: AuditSeverity): number {
    const facility = 16; // Local0
    const severityMap = {
      [AuditSeverity.INFO]: 6,
      [AuditSeverity.WARNING]: 4,
      [AuditSeverity.ERROR]: 3,
      [AuditSeverity.CRITICAL]: 2
    };
    return facility * 8 + severityMap[severity];
  }

  private generateSOC2Report(events: AuditEvent[]): Record<string, any> {
    // SOC 2 Type II report structure
    return {
      reportType: 'SOC2 Type II',
      period: {
        start: events[0]?.timestamp || new Date(),
        end: events[events.length - 1]?.timestamp || new Date()
      },
      controls: {
        CC6_1: this.assessLogicalAccessControls(events),
        CC6_2: this.assessUserAccessProvisioning(events),
        CC6_3: this.assessPrivilegedAccess(events),
        CC7_1: this.assessSystemMonitoring(events),
        CC7_2: this.assessAnomalyDetection(events)
      },
      summary: this.getStatistics()
    };
  }

  private generateGDPRReport(events: AuditEvent[]): Record<string, any> {
    const gdprEvents = events.filter(e => 
      e.eventType === AuditEventType.GDPR_REQUEST ||
      e.eventType === AuditEventType.CONSENT_GRANTED ||
      e.eventType === AuditEventType.CONSENT_REVOKED ||
      e.eventType === AuditEventType.DATA_DELETE ||
      e.eventType === AuditEventType.DATA_EXPORT
    );

    return {
      reportType: 'GDPR Compliance',
      dataSubjectRequests: gdprEvents.filter(e => e.eventType === AuditEventType.GDPR_REQUEST).length,
      consentManagement: {
        granted: gdprEvents.filter(e => e.eventType === AuditEventType.CONSENT_GRANTED).length,
        revoked: gdprEvents.filter(e => e.eventType === AuditEventType.CONSENT_REVOKED).length
      },
      dataOperations: {
        exports: gdprEvents.filter(e => e.eventType === AuditEventType.DATA_EXPORT).length,
        deletions: gdprEvents.filter(e => e.eventType === AuditEventType.DATA_DELETE).length
      },
      breaches: events.filter(e => e.eventType === AuditEventType.INTRUSION_DETECTED).length
    };
  }

  private generateHIPAAReport(events: AuditEvent[]): Record<string, any> {
    // HIPAA compliance report
    return {
      reportType: 'HIPAA Compliance',
      accessControls: this.assessAccessControls(events),
      auditControls: {
        totalEvents: events.length,
        integrityValid: this.verifyIntegrity().valid
      },
      transmissionSecurity: this.assessTransmissionSecurity(events)
    };
  }

  private generatePCIDSSReport(events: AuditEvent[]): Record<string, any> {
    // PCI-DSS compliance report
    return {
      reportType: 'PCI-DSS Compliance',
      requirement10: {
        description: 'Track and monitor all access to network resources and cardholder data',
        events: events.filter(e => e.resource?.includes('payment') || e.resource?.includes('card')).length
      },
      requirement8: {
        description: 'Identify and authenticate access to system components',
        authenticationEvents: events.filter(e => 
          e.eventType === AuditEventType.LOGIN_SUCCESS ||
          e.eventType === AuditEventType.LOGIN_FAILURE
        ).length
      }
    };
  }

  // Assessment helper methods
  private assessLogicalAccessControls(events: AuditEvent[]): any {
    const accessEvents = events.filter(e => 
      e.eventType === AuditEventType.ACCESS_GRANTED ||
      e.eventType === AuditEventType.ACCESS_DENIED
    );
    
    return {
      totalAccessAttempts: accessEvents.length,
      deniedAccess: accessEvents.filter(e => e.result === 'failure').length,
      effectiveness: accessEvents.length > 0 
        ? accessEvents.filter(e => e.result === 'success').length / accessEvents.length
        : 0
    };
  }

  private assessUserAccessProvisioning(events: AuditEvent[]): any {
    return {
      roleChanges: events.filter(e => e.eventType === AuditEventType.ROLE_CHANGED).length,
      permissionChanges: events.filter(e => e.eventType === AuditEventType.PERMISSION_CHANGED).length
    };
  }

  private assessPrivilegedAccess(events: AuditEvent[]): any {
    // In production, would filter for admin actions
    return {
      privilegedActions: events.filter(e => e.metadata?.privileged === true).length
    };
  }

  private assessSystemMonitoring(events: AuditEvent[]): any {
    return {
      systemEvents: events.filter(e => 
        e.eventType === AuditEventType.SYSTEM_START ||
        e.eventType === AuditEventType.SYSTEM_STOP
      ).length,
      configChanges: events.filter(e => e.eventType === AuditEventType.CONFIG_CHANGE).length
    };
  }

  private assessAnomalyDetection(events: AuditEvent[]): any {
    return {
      suspiciousActivities: events.filter(e => e.eventType === AuditEventType.SUSPICIOUS_ACTIVITY).length,
      intrusionAttempts: events.filter(e => e.eventType === AuditEventType.INTRUSION_DETECTED).length
    };
  }

  private assessAccessControls(events: AuditEvent[]): any {
    return this.assessLogicalAccessControls(events);
  }

  private assessTransmissionSecurity(events: AuditEvent[]): any {
    return {
      encryptionEvents: events.filter(e => e.eventType === AuditEventType.DATA_ENCRYPT).length,
      decryptionEvents: events.filter(e => e.eventType === AuditEventType.DATA_DECRYPT).length
    };
  }
}

export default AuditService.getInstance();