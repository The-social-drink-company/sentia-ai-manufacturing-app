/**
 * Enterprise Security Audit Logger
 * Tracks all security-relevant events for compliance and monitoring
 */

import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

class SecurityAuditLogger {
  constructor() {
    this.logPath = process.env.AUDIT_LOG_PATH || './logs/security';
    this.maxLogSize = 10 * 1024 * 1024; // 10MB
    this.retentionDays = 90;
    this.sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'ssn', 'creditCard'];
  }

  /**
   * Log security event with automatic classification
   */
  async logSecurityEvent(event) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId(),
      type: event.type,
      severity: this.classifySeverity(event),
      actor: this.sanitizeActor(event.actor),
      action: event.action,
      resource: event.resource,
      result: event.result,
      metadata: this.sanitizeMetadata(event.metadata),
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      sessionId: event.sessionId ? this.hashValue(event.sessionId) : null,
      correlationId: event.correlationId
    };

    await this.writeAuditLog(auditEntry);

    // Alert on critical events
    if (auditEntry.severity === 'CRITICAL') {
      await this.sendSecurityAlert(auditEntry);
    }

    return auditEntry.eventId;
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(type, userId, success, metadata = {}) {
    return this.logSecurityEvent({
      type: `AUTH_${type}`,
      actor: { userId },
      action: type.toLowerCase(),
      resource: 'authentication',
      result: success ? 'SUCCESS' : 'FAILURE',
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Log authorization events
   */
  async logAuthzEvent(userId, resource, permission, granted, metadata = {}) {
    return this.logSecurityEvent({
      type: 'AUTHORIZATION',
      actor: { userId },
      action: permission,
      resource,
      result: granted ? 'GRANTED' : 'DENIED',
      metadata
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(userId, dataType, operation, recordIds, metadata = {}) {
    return this.logSecurityEvent({
      type: 'DATA_ACCESS',
      actor: { userId },
      action: operation,
      resource: dataType,
      result: 'SUCCESS',
      metadata: {
        recordCount: recordIds.length,
        recordIds: recordIds.slice(0, 10), // Limit logged IDs
        ...metadata
      }
    });
  }

  /**
   * Log security violations
   */
  async logViolation(type, actor, details, metadata = {}) {
    return this.logSecurityEvent({
      type: `VIOLATION_${type}`,
      actor,
      action: 'violation_detected',
      resource: 'security_policy',
      result: 'VIOLATION',
      metadata: {
        violationType: type,
        details: this.sanitizeMetadata(details),
        ...metadata
      }
    });
  }

  /**
   * Log API rate limit events
   */
  async logRateLimit(userId, endpoint, limit, current) {
    return this.logSecurityEvent({
      type: 'RATE_LIMIT',
      actor: { userId },
      action: 'rate_limit_exceeded',
      resource: endpoint,
      result: 'BLOCKED',
      metadata: {
        limit,
        current,
        exceeded: current - limit
      }
    });
  }

  /**
   * Classify event severity
   */
  classifySeverity(event) {
    const criticalEvents = [
      'VIOLATION_',
      'INTRUSION_',
      'DATA_BREACH',
      'PRIVILEGE_ESCALATION'
    ];

    const highEvents = [
      'AUTH_FAILURE',
      'AUTHORIZATION_DENIED',
      'RATE_LIMIT',
      'SUSPICIOUS_ACTIVITY'
    ];

    const mediumEvents = [
      'CONFIG_CHANGE',
      'USER_MODIFICATION',
      'PERMISSION_CHANGE'
    ];

    if (criticalEvents.some(e => event.type.startsWith(e))) {
      return 'CRITICAL';
    }
    if (highEvents.some(e => event.type.includes(e))) {
      return 'HIGH';
    }
    if (mediumEvents.some(e => event.type.includes(e))) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Sanitize sensitive data from metadata
   */
  sanitizeMetadata(metadata) {
    if (!metadata) return {};

    const sanitized = { ...metadata };

    for (const key in sanitized) {
      // Check if key contains sensitive field names
      if (this.sensitiveFields.some(field =>
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
      }
      // Recursively sanitize nested objects
      else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeMetadata(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize actor information
   */
  sanitizeActor(actor) {
    if (!actor) return { type: 'SYSTEM' };

    return {
      userId: actor.userId,
      role: actor.role,
      type: actor.type || 'USER'
    };
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `SEC-${timestamp}-${random}`;
  }

  /**
   * Hash sensitive values
   */
  hashValue(value) {
    return createHash('sha256').update(value).digest('hex').substring(0, 16);
  }

  /**
   * Write audit log to file
   */
  async writeAuditLog(entry) {
    try {
      await fs.mkdir(this.logPath, { recursive: true });

      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logPath, `audit-${date}.jsonl`);

      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(logFile, logLine, 'utf8');

      // Rotate if needed
      await this.rotateLogsIfNeeded(logFile);
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Fallback to console in case of file system issues
      console.log('AUDIT:', JSON.stringify(entry));
    }
  }

  /**
   * Rotate logs if size exceeded
   */
  async rotateLogsIfNeeded(logFile) {
    try {
      const stats = await fs.stat(logFile);
      if (stats.size > this.maxLogSize) {
        const timestamp = Date.now();
        const rotatedFile = `${logFile}.${timestamp}`;
        await fs.rename(logFile, rotatedFile);
      }
    } catch (error) {
      // File doesn't exist or other error - ignore
    }
  }

  /**
   * Send security alert for critical events
   */
  async sendSecurityAlert(event) {
    // Integration with alerting system
    const alert = {
      severity: event.severity,
      eventId: event.eventId,
      type: event.type,
      timestamp: event.timestamp,
      description: `Critical security event: ${event.type}`,
      action: event.action,
      resource: event.resource
    };

    // Send to monitoring service
    if (process.env.SECURITY_WEBHOOK_URL) {
      try {
        await fetch(process.env.SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      } catch (error) {
        console.error('Failed to send security alert:', error);
      }
    }

    // Log to console for immediate visibility
    console.error('SECURITY ALERT:', alert);
  }

  /**
   * Query audit logs
   */
  async queryLogs(filters = {}, options = {}) {
    const logs = [];
    const { startDate, endDate, type, severity, actor, limit = 1000 } = filters;

    try {
      const files = await fs.readdir(this.logPath);
      const auditFiles = files
        .filter(f => f.startsWith('audit-'))
        .sort()
        .reverse();

      for (const file of auditFiles) {
        const filePath = path.join(this.logPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n');

        for (const line of lines) {
          if (logs.length >= limit) break;

          try {
            const entry = JSON.parse(line);

            // Apply filters
            if (startDate && new Date(entry.timestamp) < new Date(startDate)) continue;
            if (endDate && new Date(entry.timestamp) > new Date(endDate)) continue;
            if (type && !entry.type.includes(type)) continue;
            if (severity && entry.severity !== severity) continue;
            if (actor && entry.actor?.userId !== actor) continue;

            logs.push(entry);
          } catch (e) {
            // Invalid JSON line - skip
          }
        }

        if (logs.length >= limit) break;
      }
    } catch (error) {
      console.error('Failed to query audit logs:', error);
    }

    return logs;
  }

  /**
   * Generate audit report
   */
  async generateReport(startDate, endDate) {
    const logs = await this.queryLogs({ startDate, endDate }, { limit: 100000 });

    const report = {
      period: { startDate, endDate },
      totalEvents: logs.length,
      byType: {},
      bySeverity: {},
      topActors: {},
      violations: [],
      authFailures: []
    };

    for (const log of logs) {
      // Count by type
      report.byType[log.type] = (report.byType[log.type] || 0) + 1;

      // Count by severity
      report.bySeverity[log.severity] = (report.bySeverity[log.severity] || 0) + 1;

      // Count by actor
      const actorId = log.actor?.userId || 'SYSTEM';
      report.topActors[actorId] = (report.topActors[actorId] || 0) + 1;

      // Collect violations
      if (log.type.startsWith('VIOLATION_')) {
        report.violations.push({
          timestamp: log.timestamp,
          type: log.type,
          actor: log.actor,
          metadata: log.metadata
        });
      }

      // Collect auth failures
      if (log.type === 'AUTH_FAILURE') {
        report.authFailures.push({
          timestamp: log.timestamp,
          actor: log.actor,
          metadata: log.metadata
        });
      }
    }

    // Sort top actors
    report.topActors = Object.entries(report.topActors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

    return report;
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    try {
      const files = await fs.readdir(this.logPath);

      for (const file of files) {
        if (!file.startsWith('audit-')) continue;

        const filePath = path.join(this.logPath, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`Deleted old audit log: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }
}

// Export singleton instance
export const auditLogger = new SecurityAuditLogger();

// Export class for testing
export default SecurityAuditLogger;