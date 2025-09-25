// Enterprise Security Monitoring and Intrusion Detection System

import { EventEmitter } from 'events';
import AuditService, { AuditEventType, AuditSeverity } from './auditService';

export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AttackType {
  BRUTE_FORCE = 'brute_force',
  SQL_INJECTION = 'sql_injection',
  XSS = 'xss',
  CSRF = 'csrf',
  DDoS = 'ddos',
  CREDENTIAL_STUFFING = 'credential_stuffing',
  SESSION_HIJACKING = 'session_hijacking',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXFILTRATION = 'data_exfiltration',
  MALWARE = 'malware',
  INSIDER_THREAT = 'insider_threat',
  UNKNOWN = 'unknown'
}

export interface SecurityIncident {
  incidentId: string;
  timestamp: Date;
  threatLevel: ThreatLevel;
  attackType: AttackType;
  source: {
    ipAddress?: string;
    userId?: string;
    userAgent?: string;
    location?: string;
  };
  target: {
    resource?: string;
    endpoint?: string;
    dataClassification?: string;
  };
  indicators: string[];
  actions: string[];
  status: 'detected' | 'investigating' | 'mitigated' | 'resolved';
  metadata?: Record<string, any>;
}

export interface SecurityMetrics {
  totalIncidents: number;
  incidentsByLevel: Record<ThreatLevel, number>;
  incidentsByType: Record<AttackType, number>;
  averageResponseTime: number;
  falsePositiveRate: number;
  blockedAttempts: number;
  activeThreats: number;
}

export interface SecurityRule {
  ruleId: string;
  name: string;
  description: string;
  enabled: boolean;
  condition: (event: any) => boolean;
  action: (event: any) => void;
  severity: ThreatLevel;
  attackType: AttackType;
}

export class SecurityMonitoringService extends EventEmitter {
  private static instance: SecurityMonitoringService;
  private incidents: Map<string, SecurityIncident> = new Map();
  private rules: Map<string, SecurityRule> = new Map();
  private blacklist: Set<string> = new Set();
  private whitelist: Set<string> = new Set();
  private suspiciousPatterns: Map<string, number> = new Map();
  private rateLimiters: Map<string, { count: number; resetAt: Date }> = new Map();
  private anomalyBaseline: Map<string, any> = new Map();
  private auditService: typeof AuditService;

  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_FAILED_LOGINS = 5;
  private readonly MAX_REQUESTS_PER_MINUTE = 100;
  private readonly ANOMALY_THRESHOLD = 2.5; // Standard deviations

  private constructor() {
    super();
    this.auditService = AuditService;
    this.initializeRules();
    this.startMonitoring();
  }

  public static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService();
    }
    return SecurityMonitoringService.instance;
  }

  // Initialize security rules
  private initializeRules(): void {
    // Brute force detection
    this.addRule({
      ruleId: 'brute_force_detection',
      name: 'Brute Force Attack Detection',
      description: 'Detects multiple failed login attempts',
      enabled: true,
      condition: (event) => {
        if (event.type !== 'login_failure') return false;
        
        const key = `login_failures:${event.ipAddress}`;
        const failures = this.suspiciousPatterns.get(key) || 0;
        return failures >= this.MAX_FAILED_LOGINS;
      },
      action: (event) => {
        this.createIncident({
          threatLevel: ThreatLevel.HIGH,
          attackType: AttackType.BRUTE_FORCE,
          source: {
            ipAddress: event.ipAddress,
            userAgent: event.userAgent
          },
          indicators: ['Multiple failed login attempts', `${this.MAX_FAILED_LOGINS}+ failures`],
          actions: ['Block IP', 'Require CAPTCHA', 'Alert security team']
        });
        this.blockIP(event.ipAddress);
      },
      severity: ThreatLevel.HIGH,
      attackType: AttackType.BRUTE_FORCE
    });

    // SQL Injection detection
    this.addRule({
      ruleId: 'sql_injection_detection',
      name: 'SQL Injection Detection',
      description: 'Detects potential SQL injection attempts',
      enabled: true,
      condition: (event) => {
        const sqlPatterns = [
          /('|(\-\-)|(;)|(\|\|)|(\/\*)|(\*\/))/gi,
          /(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript)/gi,
          /(\bor\b\s*\d+\s*=\s*\d+)|(\band\b\s*\d+\s*=\s*\d+)/gi
        ];
        
        const input = JSON.stringify(event.data || event.query || '');
        return sqlPatterns.some(pattern => pattern.test(input));
      },
      action: (event) => {
        this.createIncident({
          threatLevel: ThreatLevel.CRITICAL,
          attackType: AttackType.SQL_INJECTION,
          source: {
            ipAddress: event.ipAddress,
            userId: event.userId
          },
          target: {
            endpoint: event.endpoint,
            resource: event.resource
          },
          indicators: ['SQL injection pattern detected', 'Malicious query attempt'],
          actions: ['Block request', 'Log attempt', 'Alert DBA']
        });
      },
      severity: ThreatLevel.CRITICAL,
      attackType: AttackType.SQL_INJECTION
    });

    // XSS detection
    this.addRule({
      ruleId: 'xss_detection',
      name: 'Cross-Site Scripting Detection',
      description: 'Detects potential XSS attacks',
      enabled: true,
      condition: (event) => {
        const xssPatterns = [
          /<script[^>]*>.*?<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /<iframe/gi,
          /<object/gi,
          /<embed/gi
        ];
        
        const input = JSON.stringify(event.data || '');
        return xssPatterns.some(pattern => pattern.test(input));
      },
      action: (event) => {
        this.createIncident({
          threatLevel: ThreatLevel.HIGH,
          attackType: AttackType.XSS,
          source: {
            ipAddress: event.ipAddress,
            userId: event.userId
          },
          indicators: ['XSS pattern detected', 'Script injection attempt'],
          actions: ['Sanitize input', 'Block request', 'Log attempt']
        });
      },
      severity: ThreatLevel.HIGH,
      attackType: AttackType.XSS
    });

    // DDoS detection
    this.addRule({
      ruleId: 'ddos_detection',
      name: 'DDoS Attack Detection',
      description: 'Detects potential DDoS attacks',
      enabled: true,
      condition: (event) => {
        const key = `requests:${event.ipAddress}`;
        const limiter = this.rateLimiters.get(key);
        
        if (!limiter) return false;
        return limiter.count > this.MAX_REQUESTS_PER_MINUTE;
      },
      action: (event) => {
        this.createIncident({
          threatLevel: ThreatLevel.CRITICAL,
          attackType: AttackType.DDoS,
          source: {
            ipAddress: event.ipAddress
          },
          indicators: ['Excessive request rate', `${this.MAX_REQUESTS_PER_MINUTE}+ requests/minute`],
          actions: ['Enable rate limiting', 'Block IP', 'Scale infrastructure']
        });
        this.blockIP(event.ipAddress);
      },
      severity: ThreatLevel.CRITICAL,
      attackType: AttackType.DDoS
    });

    // Data exfiltration detection
    this.addRule({
      ruleId: 'data_exfiltration_detection',
      name: 'Data Exfiltration Detection',
      description: 'Detects unusual data access patterns',
      enabled: true,
      condition: (event) => {
        if (event.type !== 'data_export' && event.type !== 'data_read') return false;
        
        const key = `data_access:${event.userId}`;
        const accessCount = this.suspiciousPatterns.get(key) || 0;
        
        // Check for unusual volume
        return accessCount > 100 || event.dataSize > 100000000; // 100MB
      },
      action: (event) => {
        this.createIncident({
          threatLevel: ThreatLevel.HIGH,
          attackType: AttackType.DATA_EXFILTRATION,
          source: {
            userId: event.userId,
            ipAddress: event.ipAddress
          },
          target: {
            resource: event.resource,
            dataClassification: event.classification
          },
          indicators: ['Unusual data access pattern', 'Large data transfer'],
          actions: ['Suspend user', 'Review access logs', 'Alert data owner']
        });
      },
      severity: ThreatLevel.HIGH,
      attackType: AttackType.DATA_EXFILTRATION
    });

    // Privilege escalation detection
    this.addRule({
      ruleId: 'privilege_escalation_detection',
      name: 'Privilege Escalation Detection',
      description: 'Detects attempts to escalate privileges',
      enabled: true,
      condition: (event) => {
        return event.type === 'permission_change' && 
               event.oldRole !== 'admin' && 
               event.newRole === 'admin' &&
               !event.approved;
      },
      action: (event) => {
        this.createIncident({
          threatLevel: ThreatLevel.CRITICAL,
          attackType: AttackType.PRIVILEGE_ESCALATION,
          source: {
            userId: event.userId,
            ipAddress: event.ipAddress
          },
          indicators: ['Unauthorized privilege escalation', 'Admin access attempt'],
          actions: ['Revert changes', 'Suspend account', 'Investigate']
        });
      },
      severity: ThreatLevel.CRITICAL,
      attackType: AttackType.PRIVILEGE_ESCALATION
    });
  }

  // Start monitoring
  private startMonitoring(): void {
    // Clean up old data periodically
    setInterval(() => {
      this.cleanupOldData();
      this.updateAnomalyBaseline();
    }, 60000); // Every minute

    // Check for anomalies
    setInterval(() => {
      this.detectAnomalies();
    }, 5000); // Every 5 seconds
  }

  // Process security event
  public processEvent(event: any): void {
    // Check whitelist/blacklist
    if (this.isBlacklisted(event.ipAddress)) {
      this.handleBlacklistedAccess(event);
      return;
    }

    if (!this.isWhitelisted(event.ipAddress)) {
      // Apply rate limiting
      this.applyRateLimit(event.ipAddress);
    }

    // Track patterns
    this.trackPattern(event);

    // Check all rules
    for (const rule of this.rules.values()) {
      if (rule.enabled && rule.condition(event)) {
        rule.action(event);
        
        // Log to audit
        this.auditService.logEvent(
          AuditEventType.SECURITY_ALERT,
          'success',
          {
            metadata: {
              ruleId: rule.ruleId,
              ruleName: rule.name,
              event
            }
          }
        );
      }
    }

    // Emit event for real-time monitoring
    this.emit('securityEvent', event);
  }

  // Create security incident
  private createIncident(details: Omit<SecurityIncident, 'incidentId' | 'timestamp' | 'status'>): SecurityIncident {
    const incident: SecurityIncident = {
      incidentId: `inc_${Date.now()}_${crypto.randomUUID().substr(2, 9)}`,
      timestamp: new Date(),
      status: 'detected',
      ...details
    };

    this.incidents.set(incident.incidentId, incident);
    
    // Emit incident for alerting
    this.emit('securityIncident', incident);
    
    // Log to audit
    this.auditService.logEvent(
      AuditEventType.INTRUSION_DETECTED,
      'success',
      {
        metadata: incident
      }
    );

    // Auto-mitigate based on threat level
    if (incident.threatLevel === ThreatLevel.CRITICAL) {
      this.autoMitigate(incident);
    }

    return incident;
  }

  // Auto-mitigate critical threats
  private autoMitigate(incident: SecurityIncident): void {
    console.log(`Auto-mitigating critical threat: ${incident.incidentId}`);
    
    // Take immediate action based on attack type
    switch (incident.attackType) {
      case AttackType.DDoS:
        // Enable DDoS protection
        this.enableDDoSProtection();
        break;
      case AttackType.BRUTE_FORCE:
        // Enable account lockout
        this.enableAccountLockout();
        break;
      case AttackType.DATA_EXFILTRATION:
        // Suspend data access
        this.suspendDataAccess(incident.source.userId);
        break;
    }
    
    incident.status = 'mitigated';
  }

  // Detect anomalies using statistical analysis
  private detectAnomalies(): void {
    // Analyze recent events for anomalies
    const recentEvents = this.auditService.queryEvents({
      startDate: new Date(Date.now() - 300000), // Last 5 minutes
      limit: 1000
    });

    // Group events by type and user
    const eventCounts = new Map<string, number>();
    recentEvents.forEach(event => {
      const key = `${event.eventType}:${event.userId || 'anonymous'}`;
      eventCounts.set(key, (eventCounts.get(key) || 0) + 1);
    });

    // Check against baseline
    eventCounts.forEach((count, key) => {
      const baseline = this.anomalyBaseline.get(key);
      if (!baseline) return;

      const deviation = Math.abs(count - baseline.mean) / baseline.stdDev;
      if (deviation > this.ANOMALY_THRESHOLD) {
        this.handleAnomaly(key, count, baseline);
      }
    });
  }

  // Handle detected anomaly
  private handleAnomaly(key: string, count: number, baseline: any): void {
    const [eventType, userId] = key.split(':');
    
    this.createIncident({
      threatLevel: ThreatLevel.MEDIUM,
      attackType: AttackType.UNKNOWN,
      source: { userId },
      indicators: [
        'Statistical anomaly detected',
        `Event type: ${eventType}`,
        `Count: ${count} (baseline: ${baseline.mean})`
      ],
      actions: ['Investigate', 'Monitor closely']
    });
  }

  // Update anomaly detection baseline
  private updateAnomalyBaseline(): void {
    const events = this.auditService.queryEvents({
      startDate: new Date(Date.now() - 86400000), // Last 24 hours
      limit: 10000
    });

    // Calculate statistics for each event type/user combination
    const eventGroups = new Map<string, number[]>();
    
    // Group events by hour
    const hourlyBuckets = new Map<string, Map<string, number>>();
    
    events.forEach(event => {
      const hour = Math.floor(event.timestamp.getTime() / 3600000);
      const key = `${event.eventType}:${event.userId || 'anonymous'}`;
      
      if (!hourlyBuckets.has(key)) {
        hourlyBuckets.set(key, new Map());
      }
      
      const hourMap = hourlyBuckets.get(key)!;
      hourMap.set(hour.toString(), (hourMap.get(hour.toString()) || 0) + 1);
    });

    // Calculate mean and standard deviation
    hourlyBuckets.forEach((hourMap, key) => {
      const counts = Array.from(hourMap.values());
      if (counts.length < 2) return;
      
      const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
      const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length;
      const stdDev = Math.sqrt(variance);
      
      this.anomalyBaseline.set(key, { mean, stdDev });
    });
  }

  // Track suspicious patterns
  private trackPattern(event: any): void {
    // Track failed logins
    if (event.type === 'login_failure') {
      const key = `login_failures:${event.ipAddress}`;
      this.suspiciousPatterns.set(key, (this.suspiciousPatterns.get(key) || 0) + 1);
    }

    // Track data access
    if (event.type === 'data_export' || event.type === 'data_read') {
      const key = `data_access:${event.userId}`;
      this.suspiciousPatterns.set(key, (this.suspiciousPatterns.get(key) || 0) + 1);
    }
  }

  // Apply rate limiting
  private applyRateLimit(ipAddress: string): boolean {
    const key = `requests:${ipAddress}`;
    const now = new Date();
    const limiter = this.rateLimiters.get(key);

    if (!limiter || now > limiter.resetAt) {
      this.rateLimiters.set(key, {
        count: 1,
        resetAt: new Date(now.getTime() + this.RATE_LIMIT_WINDOW)
      });
      return true;
    }

    limiter.count++;
    return limiter.count <= this.MAX_REQUESTS_PER_MINUTE;
  }

  // Clean up old data
  private cleanupOldData(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);

    // Clean up old incidents
    for (const [id, incident] of this.incidents) {
      if (incident.timestamp < oneHourAgo && incident.status === 'resolved') {
        this.incidents.delete(id);
      }
    }

    // Clean up rate limiters
    for (const [key, limiter] of this.rateLimiters) {
      if (now > limiter.resetAt) {
        this.rateLimiters.delete(key);
      }
    }

    // Reset suspicious patterns periodically
    this.suspiciousPatterns.clear();
  }

  // Utility methods

  public blockIP(ipAddress: string): void {
    this.blacklist.add(ipAddress);
    console.log(`Blocked IP: ${ipAddress}`);
  }

  public unblockIP(ipAddress: string): void {
    this.blacklist.delete(ipAddress);
  }

  public whitelistIP(ipAddress: string): void {
    this.whitelist.add(ipAddress);
  }

  public isBlacklisted(ipAddress: string): boolean {
    return this.blacklist.has(ipAddress);
  }

  public isWhitelisted(ipAddress: string): boolean {
    return this.whitelist.has(ipAddress);
  }

  public addRule(rule: SecurityRule): void {
    this.rules.set(rule.ruleId, rule);
  }

  public removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  public getIncident(incidentId: string): SecurityIncident | undefined {
    return this.incidents.get(incidentId);
  }

  public getActiveIncidents(): SecurityIncident[] {
    return Array.from(this.incidents.values())
      .filter(i => i.status !== 'resolved');
  }

  public updateIncidentStatus(
    incidentId: string,
    status: SecurityIncident['status']
  ): void {
    const incident = this.incidents.get(incidentId);
    if (incident) {
      incident.status = status;
    }
  }

  public getMetrics(): SecurityMetrics {
    const incidents = Array.from(this.incidents.values());
    const incidentsByLevel: Record<ThreatLevel, number> = {
      [ThreatLevel.LOW]: 0,
      [ThreatLevel.MEDIUM]: 0,
      [ThreatLevel.HIGH]: 0,
      [ThreatLevel.CRITICAL]: 0
    };
    const incidentsByType: Partial<Record<AttackType, number>> = {};

    incidents.forEach(incident => {
      incidentsByLevel[incident.threatLevel]++;
      incidentsByType[incident.attackType] = (incidentsByType[incident.attackType] || 0) + 1;
    });

    return {
      totalIncidents: incidents.length,
      incidentsByLevel,
      incidentsByType: incidentsByType as Record<AttackType, number>,
      averageResponseTime: 0, // Would calculate in production
      falsePositiveRate: 0,   // Would track in production
      blockedAttempts: this.blacklist.size,
      activeThreats: this.getActiveIncidents().length
    };
  }

  // Mock methods for demo
  private enableDDoSProtection(): void {
    console.log('DDoS protection enabled');
  }

  private enableAccountLockout(): void {
    console.log('Account lockout enabled');
  }

  private suspendDataAccess(userId?: string): void {
    console.log(`Data access suspended for user: ${userId}`);
  }

  private handleBlacklistedAccess(event: any): void {
    console.log(`Blocked access from blacklisted IP: ${event.ipAddress}`);
  }
}

export default SecurityMonitoringService.getInstance();