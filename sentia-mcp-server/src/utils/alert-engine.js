/**
 * Advanced Alert Engine
 * 
 * Comprehensive alerting system with configurable thresholds, multiple notification
 * channels, alert escalation policies, correlation, and deduplication for the
 * CapLiquify MCP Server.
 * 
 * Features:
 * - Real-time alert generation with configurable thresholds
 * - Multiple notification channels (email, webhook, Slack)
 * - Alert escalation policies with severity levels
 * - Alert correlation and deduplication
 * - Custom alert rules based on business logic
 * - Alert storm protection
 * - Historical alert analysis
 * - Integration with monitoring and analytics systems
 */

import { EventEmitter } from 'events';
import { createLogger } from './logger.js';
import { monitoring } from './monitoring.js';
import { businessAnalytics } from './business-analytics.js';
import { performanceMonitor } from './performance-monitor.js';

const logger = createLogger();

/**
 * Alert severity levels
 */
export const ALERT_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high', 
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
};

/**
 * Alert categories
 */
export const ALERT_CATEGORY = {
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  BUSINESS: 'business',
  SYSTEM: 'system',
  INTEGRATION: 'integration',
  COST: 'cost',
  USER: 'user'
};

/**
 * Alert states
 */
export const ALERT_STATE = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
  SUPPRESSED: 'suppressed'
};

/**
 * Advanced Alert Engine
 */
export class AlertEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled !== false,
      stormProtection: config.stormProtection !== false,
      maxAlertsPerMinute: config.maxAlertsPerMinute || 10,
      deduplicationWindow: config.deduplicationWindow || 300000, // 5 minutes
      escalationTimeout: config.escalationTimeout || 1800000, // 30 minutes
      alertRetention: config.alertRetention || 30 * 24 * 60 * 60 * 1000, // 30 days
      ...config
    };

    // Alert storage and tracking
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.alertRules = new Map();
    this.suppressionRules = new Map();
    this.escalationPolicies = new Map();
    
    // Alert correlation and deduplication
    this.alertCorrelations = new Map();
    this.recentAlerts = new Map(); // For deduplication
    
    // Storm protection
    this.alertCounts = new Map(); // Per-minute alert counts
    this.suppressedUntil = null;
    
    // Statistics
    this.stats = {
      totalAlerts: 0,
      alertsBySeverity: {},
      alertsByCategory: {},
      avgResolutionTime: 0,
      escalationRate: 0
    };

    this.initialize();
  }

  /**
   * Initialize the alert engine
   */
  async initialize() {
    if (!this.config.enabled) {
      logger.info('Alert engine disabled');
      return;
    }

    try {
      // Setup default alert rules
      this.setupDefaultAlertRules();
      
      // Setup escalation policies
      this.setupDefaultEscalationPolicies();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start background processes
      this.startBackgroundProcesses();

      logger.info('Alert engine initialized successfully', {
        stormProtection: this.config.stormProtection,
        maxAlertsPerMinute: this.config.maxAlertsPerMinute,
        deduplicationWindow: this.config.deduplicationWindow
      });

      this.emit('alert_engine:initialized');
    } catch (error) {
      logger.error('Failed to initialize alert engine', { error });
      throw error;
    }
  }

  /**
   * Setup default alert rules
   */
  setupDefaultAlertRules() {
    // Performance alerts
    this.addAlertRule('high_response_time', {
      category: ALERT_CATEGORY.PERFORMANCE,
      severity: ALERT_SEVERITY.HIGH,
      condition: {
        metric: 'performance.response_time',
        operator: 'gt',
        threshold: 5000,
        duration: 300000 // 5 minutes
      },
      title: 'High Response Time Detected',
      description: 'System response time exceeds 5 seconds for 5+ minutes',
      enabled: true
    });

    this.addAlertRule('memory_usage_critical', {
      category: ALERT_CATEGORY.SYSTEM,
      severity: ALERT_SEVERITY.CRITICAL,
      condition: {
        metric: 'system.memory.usage_percent',
        operator: 'gt',
        threshold: 95,
        duration: 60000 // 1 minute
      },
      title: 'Critical Memory Usage',
      description: 'System memory usage exceeds 95%',
      enabled: true
    });

    // Security alerts
    this.addAlertRule('authentication_failures', {
      category: ALERT_CATEGORY.SECURITY,
      severity: ALERT_SEVERITY.HIGH,
      condition: {
        metric: 'security.auth_failures',
        operator: 'gt',
        threshold: 10,
        duration: 300000 // 5 minutes
      },
      title: 'Multiple Authentication Failures',
      description: 'More than 10 authentication failures in 5 minutes',
      enabled: true
    });

    // Business alerts
    this.addAlertRule('high_api_cost', {
      category: ALERT_CATEGORY.COST,
      severity: ALERT_SEVERITY.MEDIUM,
      condition: {
        metric: 'business.cost.hourly_total',
        operator: 'gt',
        threshold: 10, // $10/hour
        duration: 3600000 // 1 hour
      },
      title: 'High API Costs',
      description: 'Hourly API costs exceed $10',
      enabled: true
    });

    // Integration alerts
    this.addAlertRule('integration_failure_rate', {
      category: ALERT_CATEGORY.INTEGRATION,
      severity: ALERT_SEVERITY.HIGH,
      condition: {
        metric: 'integration.failure_rate',
        operator: 'gt',
        threshold: 0.2, // 20% failure rate
        duration: 600000 // 10 minutes
      },
      title: 'High Integration Failure Rate',
      description: 'Integration failure rate exceeds 20%',
      enabled: true
    });

    logger.info('Default alert rules configured', {
      totalRules: this.alertRules.size
    });
  }

  /**
   * Setup default escalation policies
   */
  setupDefaultEscalationPolicies() {
    // Critical alerts escalation
    this.addEscalationPolicy('critical_escalation', {
      triggerSeverity: ALERT_SEVERITY.CRITICAL,
      steps: [
        { delay: 0, channels: ['webhook', 'email'] },
        { delay: 300000, channels: ['webhook', 'email', 'slack'] }, // 5 minutes
        { delay: 900000, channels: ['webhook', 'email', 'slack', 'sms'] } // 15 minutes
      ],
      maxEscalations: 3
    });

    // High severity escalation
    this.addEscalationPolicy('high_escalation', {
      triggerSeverity: ALERT_SEVERITY.HIGH,
      steps: [
        { delay: 0, channels: ['webhook'] },
        { delay: 600000, channels: ['webhook', 'email'] }, // 10 minutes
        { delay: 1800000, channels: ['webhook', 'email', 'slack'] } // 30 minutes
      ],
      maxEscalations: 2
    });

    // Medium severity escalation
    this.addEscalationPolicy('medium_escalation', {
      triggerSeverity: ALERT_SEVERITY.MEDIUM,
      steps: [
        { delay: 0, channels: ['webhook'] },
        { delay: 3600000, channels: ['webhook', 'email'] } // 1 hour
      ],
      maxEscalations: 1
    });

    logger.info('Default escalation policies configured', {
      totalPolicies: this.escalationPolicies.size
    });
  }

  /**
   * Setup event listeners for monitoring systems
   */
  setupEventListeners() {
    // Listen to monitoring system alerts
    monitoring.on('alert:triggered', (alert) => {
      this.processAlert({
        source: 'monitoring',
        category: ALERT_CATEGORY.SYSTEM,
        ...alert
      });
    });

    // Listen to performance monitor alerts
    performanceMonitor.on('performance:alert', (alert) => {
      this.processAlert({
        source: 'performance_monitor',
        category: ALERT_CATEGORY.PERFORMANCE,
        ...alert
      });
    });

    // Listen to business analytics alerts
    businessAnalytics.on('analytics:high_cost', (alert) => {
      this.processAlert({
        source: 'business_analytics',
        category: ALERT_CATEGORY.COST,
        severity: ALERT_SEVERITY.MEDIUM,
        title: 'High Cost Alert',
        ...alert
      });
    });

    // Listen to security monitoring alerts
    if (global.securityMonitor) {
      global.securityMonitor.on('security:threat_detected', (alert) => {
        this.processAlert({
          source: 'security_monitor',
          category: ALERT_CATEGORY.SECURITY,
          severity: ALERT_SEVERITY.HIGH,
          ...alert
        });
      });
    }
  }

  /**
   * Add a new alert rule
   */
  addAlertRule(ruleId, rule) {
    const alertRule = {
      id: ruleId,
      createdAt: Date.now(),
      evaluationCount: 0,
      lastEvaluation: null,
      lastTriggered: null,
      ...rule
    };

    this.alertRules.set(ruleId, alertRule);
    
    logger.debug('Alert rule added', { ruleId, rule: alertRule });
    return ruleId;
  }

  /**
   * Add an escalation policy
   */
  addEscalationPolicy(policyId, policy) {
    this.escalationPolicies.set(policyId, {
      id: policyId,
      createdAt: Date.now(),
      ...policy
    });

    logger.debug('Escalation policy added', { policyId, policy });
    return policyId;
  }

  /**
   * Process incoming alert
   */
  async processAlert(alertData) {
    if (!this.config.enabled) return;

    try {
      // Check storm protection
      if (this.isStormProtectionActive()) {
        logger.debug('Alert suppressed due to storm protection', { alertData });
        return;
      }

      // Create alert object
      const alert = this.createAlert(alertData);
      
      // Check for deduplication
      if (this.isDuplicateAlert(alert)) {
        logger.debug('Duplicate alert suppressed', { alertId: alert.id });
        return;
      }

      // Check suppression rules
      if (this.isAlertSuppressed(alert)) {
        logger.debug('Alert suppressed by rule', { alertId: alert.id });
        return;
      }

      // Store alert
      this.storeAlert(alert);
      
      // Correlate with existing alerts
      this.correlateAlert(alert);
      
      // Apply escalation policy
      await this.applyEscalationPolicy(alert);
      
      // Update statistics
      this.updateStatistics(alert);
      
      // Emit alert event
      this.emit('alert:created', alert);
      
      logger.info('Alert processed successfully', {
        alertId: alert.id,
        severity: alert.severity,
        category: alert.category,
        title: alert.title
      });

    } catch (error) {
      logger.error('Failed to process alert', { error, alertData });
    }
  }

  /**
   * Create alert object
   */
  createAlert(alertData) {
    const alertId = this.generateAlertId();
    const timestamp = Date.now();

    return {
      id: alertId,
      timestamp,
      state: ALERT_STATE.ACTIVE,
      severity: alertData.severity || ALERT_SEVERITY.MEDIUM,
      category: alertData.category || ALERT_CATEGORY.SYSTEM,
      title: alertData.title || 'Unknown Alert',
      description: alertData.description || '',
      source: alertData.source || 'unknown',
      metadata: alertData.metadata || {},
      correlationKey: this.generateCorrelationKey(alertData),
      escalationLevel: 0,
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      resolvedBy: null,
      notifications: [],
      ...alertData
    };
  }

  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Generate correlation key for grouping related alerts
   */
  generateCorrelationKey(alertData) {
    // Create a key based on source, category, and relevant metadata
    const keyParts = [
      alertData.source || 'unknown',
      alertData.category || 'system',
      alertData.metric || '',
      alertData.component || ''
    ].filter(Boolean);

    return keyParts.join(':');
  }

  /**
   * Check if alert is duplicate
   */
  isDuplicateAlert(alert) {
    const key = alert.correlationKey;
    const now = Date.now();
    
    // Check recent alerts for duplicates
    if (this.recentAlerts.has(key)) {
      const lastAlert = this.recentAlerts.get(key);
      const timeDiff = now - lastAlert.timestamp;
      
      if (timeDiff < this.config.deduplicationWindow) {
        // Update the last seen time
        lastAlert.timestamp = now;
        lastAlert.count = (lastAlert.count || 1) + 1;
        return true;
      }
    }

    // Store this alert for future deduplication
    this.recentAlerts.set(key, {
      timestamp: now,
      count: 1,
      alertId: alert.id
    });

    return false;
  }

  /**
   * Check if alert should be suppressed
   */
  isAlertSuppressed(alert) {
    // Check maintenance windows
    if (this.isMaintenanceWindow()) {
      return true;
    }

    // Check custom suppression rules
    for (const [ruleId, rule] of this.suppressionRules) {
      if (this.matchesSuppressionRule(alert, rule)) {
        logger.debug('Alert suppressed by rule', { alertId: alert.id, ruleId });
        return true;
      }
    }

    return false;
  }

  /**
   * Check if we're in a maintenance window
   */
  isMaintenanceWindow() {
    // This would check against configured maintenance windows
    // For now, return false
    return false;
  }

  /**
   * Check if alert matches suppression rule
   */
  matchesSuppressionRule(alert, rule) {
    if (rule.category && alert.category !== rule.category) return false;
    if (rule.severity && alert.severity !== rule.severity) return false;
    if (rule.source && alert.source !== rule.source) return false;
    
    return true;
  }

  /**
   * Store alert in active alerts and history
   */
  storeAlert(alert) {
    // Add to active alerts
    this.activeAlerts.set(alert.id, alert);
    
    // Add to history
    this.alertHistory.push({
      ...alert,
      storedAt: Date.now()
    });

    // Limit history size
    if (this.alertHistory.length > 10000) {
      this.alertHistory = this.alertHistory.slice(-5000);
    }
  }

  /**
   * Correlate alert with existing alerts
   */
  correlateAlert(alert) {
    const correlationKey = alert.correlationKey;
    
    if (!this.alertCorrelations.has(correlationKey)) {
      this.alertCorrelations.set(correlationKey, {
        key: correlationKey,
        alerts: [],
        firstSeen: alert.timestamp,
        lastSeen: alert.timestamp,
        count: 0
      });
    }

    const correlation = this.alertCorrelations.get(correlationKey);
    correlation.alerts.push(alert.id);
    correlation.lastSeen = alert.timestamp;
    correlation.count++;
    
    // Update alert with correlation info
    alert.correlationId = correlationKey;
    alert.correlatedAlerts = correlation.alerts.length;

    // If this is a correlated alert, consider escalating
    if (correlation.count > 1) {
      this.emit('alert:correlated', { alert, correlation });
    }
  }

  /**
   * Apply escalation policy to alert
   */
  async applyEscalationPolicy(alert) {
    // Find matching escalation policy
    const policy = this.findEscalationPolicy(alert);
    if (!policy) {
      // Default notification for alerts without policy
      await this.sendNotification(alert, ['webhook']);
      return;
    }

    // Apply first escalation step immediately
    const firstStep = policy.steps[0];
    if (firstStep) {
      await this.sendNotification(alert, firstStep.channels);
      alert.escalationLevel = 1;
      alert.lastEscalated = Date.now();
    }

    // Schedule future escalations
    this.scheduleEscalations(alert, policy);
  }

  /**
   * Find escalation policy for alert
   */
  findEscalationPolicy(alert) {
    // Look for policy matching alert severity
    for (const [policyId, policy] of this.escalationPolicies) {
      if (policy.triggerSeverity === alert.severity) {
        return policy;
      }
    }

    // Look for policy matching alert category
    for (const [policyId, policy] of this.escalationPolicies) {
      if (policy.triggerCategory === alert.category) {
        return policy;
      }
    }

    return null;
  }

  /**
   * Schedule future escalations
   */
  scheduleEscalations(alert, policy) {
    policy.steps.slice(1).forEach((step, index) => {
      setTimeout(async () => {
        // Check if alert is still active
        const currentAlert = this.activeAlerts.get(alert.id);
        if (!currentAlert || currentAlert.state !== ALERT_STATE.ACTIVE) {
          return;
        }

        // Check if we've reached max escalations
        if (currentAlert.escalationLevel >= policy.maxEscalations) {
          return;
        }

        // Send escalated notification
        await this.sendNotification(currentAlert, step.channels);
        currentAlert.escalationLevel++;
        currentAlert.lastEscalated = Date.now();
        
        this.emit('alert:escalated', { alert: currentAlert, level: currentAlert.escalationLevel });
        
      }, step.delay);
    });
  }

  /**
   * Send notification through specified channels
   */
  async sendNotification(alert, channels) {
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      alertId: alert.id,
      timestamp: Date.now(),
      channels: channels,
      status: 'pending',
      attempts: 0
    };

    try {
      // Send to each channel
      for (const channel of channels) {
        await this.sendToChannel(alert, channel, notification);
      }

      notification.status = 'sent';
      alert.notifications.push(notification);
      
      this.emit('notification:sent', { alert, notification });
      
    } catch (error) {
      notification.status = 'failed';
      notification.error = error.message;
      alert.notifications.push(notification);
      
      logger.error('Failed to send notification', {
        alertId: alert.id,
        channels,
        error
      });
    }
  }

  /**
   * Send notification to specific channel
   */
  async sendToChannel(alert, channel, notification) {
    switch (channel) {
      case 'webhook':
        await this.sendWebhookNotification(alert, notification);
        break;
      case 'email':
        await this.sendEmailNotification(alert, notification);
        break;
      case 'slack':
        await this.sendSlackNotification(alert, notification);
        break;
      case 'sms':
        await this.sendSMSNotification(alert, notification);
        break;
      default:
        logger.warn('Unknown notification channel', { channel });
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhookNotification(alert, notification) {
    // This would send HTTP POST to configured webhook URL
    // For now, just emit an event
    this.emit('webhook:notification', {
      alert,
      notification,
      payload: {
        alertId: alert.id,
        severity: alert.severity,
        category: alert.category,
        title: alert.title,
        description: alert.description,
        timestamp: alert.timestamp,
        metadata: alert.metadata
      }
    });

    logger.debug('Webhook notification sent', { alertId: alert.id });
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(alert, notification) {
    // This would integrate with email service
    this.emit('email:notification', {
      alert,
      notification,
      to: this.config.emailRecipients || [],
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      body: this.formatEmailBody(alert)
    });

    logger.debug('Email notification sent', { alertId: alert.id });
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification(alert, notification) {
    // This would integrate with Slack API
    this.emit('slack:notification', {
      alert,
      notification,
      channel: this.config.slackChannel || '#alerts',
      message: this.formatSlackMessage(alert)
    });

    logger.debug('Slack notification sent', { alertId: alert.id });
  }

  /**
   * Send SMS notification
   */
  async sendSMSNotification(alert, notification) {
    // This would integrate with SMS service
    this.emit('sms:notification', {
      alert,
      notification,
      to: this.config.smsRecipients || [],
      message: `[${alert.severity.toUpperCase()}] ${alert.title}: ${alert.description}`
    });

    logger.debug('SMS notification sent', { alertId: alert.id });
  }

  /**
   * Format email body
   */
  formatEmailBody(alert) {
    return `
Alert Details:
- ID: ${alert.id}
- Severity: ${alert.severity.toUpperCase()}
- Category: ${alert.category}
- Source: ${alert.source}
- Time: ${new Date(alert.timestamp).toISOString()}

Description:
${alert.description}

Metadata:
${JSON.stringify(alert.metadata, null, 2)}

View in dashboard: ${this.config.dashboardUrl}/alerts/${alert.id}
    `.trim();
  }

  /**
   * Format Slack message
   */
  formatSlackMessage(alert) {
    const emoji = this.getSeverityEmoji(alert.severity);
    return {
      text: `${emoji} Alert: ${alert.title}`,
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          fields: [
            { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
            { title: 'Category', value: alert.category, short: true },
            { title: 'Source', value: alert.source, short: true },
            { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: true }
          ],
          text: alert.description
        }
      ]
    };
  }

  /**
   * Get emoji for severity level
   */
  getSeverityEmoji(severity) {
    const emojis = {
      [ALERT_SEVERITY.CRITICAL]: '🚨',
      [ALERT_SEVERITY.HIGH]: '⚠️',
      [ALERT_SEVERITY.MEDIUM]: '🟡',
      [ALERT_SEVERITY.LOW]: '🔵',
      [ALERT_SEVERITY.INFO]: 'ℹ️'
    };
    return emojis[severity] || '⚪';
  }

  /**
   * Get color for severity level
   */
  getSeverityColor(severity) {
    const colors = {
      [ALERT_SEVERITY.CRITICAL]: 'danger',
      [ALERT_SEVERITY.HIGH]: 'warning',
      [ALERT_SEVERITY.MEDIUM]: 'good',
      [ALERT_SEVERITY.LOW]: '#36a64f',
      [ALERT_SEVERITY.INFO]: '#2196F3'
    };
    return colors[severity] || '#808080';
  }

  /**
   * Check if storm protection is active
   */
  isStormProtectionActive() {
    if (!this.config.stormProtection) return false;
    
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    
    // Count alerts in current minute
    let currentCount = this.alertCounts.get(minute) || 0;
    
    if (currentCount >= this.config.maxAlertsPerMinute) {
      // Suppress alerts for next 5 minutes
      this.suppressedUntil = now + 300000;
      
      logger.warn('Alert storm detected, suppressing alerts', {
        alertsThisMinute: currentCount,
        suppressedUntil: new Date(this.suppressedUntil).toISOString()
      });
      
      return true;
    }

    // Check if we're still in suppression period
    if (this.suppressedUntil && now < this.suppressedUntil) {
      return true;
    }

    // Update alert count
    this.alertCounts.set(minute, currentCount + 1);
    
    // Clean up old counts
    this.cleanupAlertCounts(minute);
    
    return false;
  }

  /**
   * Clean up old alert counts
   */
  cleanupAlertCounts(currentMinute) {
    // Keep only last 10 minutes
    for (const [minute, count] of this.alertCounts) {
      if (minute < currentMinute - 10) {
        this.alertCounts.delete(minute);
      }
    }
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId, acknowledgedBy, notes = '') {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    if (alert.state !== ALERT_STATE.ACTIVE) {
      throw new Error(`Alert ${alertId} is not in active state`);
    }

    alert.state = ALERT_STATE.ACKNOWLEDGED;
    alert.acknowledgedAt = Date.now();
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedNotes = notes;

    this.emit('alert:acknowledged', { alert, acknowledgedBy, notes });
    
    logger.info('Alert acknowledged', {
      alertId,
      acknowledgedBy,
      notes
    });

    return alert;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId, resolvedBy, resolution = '', rootCause = '') {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.state = ALERT_STATE.RESOLVED;
    alert.resolvedAt = Date.now();
    alert.resolvedBy = resolvedBy;
    alert.resolution = resolution;
    alert.rootCause = rootCause;

    // Calculate resolution time
    const resolutionTime = alert.resolvedAt - alert.timestamp;
    alert.resolutionTime = resolutionTime;

    // Remove from active alerts
    this.activeAlerts.delete(alertId);

    this.emit('alert:resolved', { alert, resolvedBy, resolution });
    
    logger.info('Alert resolved', {
      alertId,
      resolvedBy,
      resolutionTime,
      resolution
    });

    return alert;
  }

  /**
   * Update statistics
   */
  updateStatistics(alert) {
    this.stats.totalAlerts++;
    
    // By severity
    if (!this.stats.alertsBySeverity[alert.severity]) {
      this.stats.alertsBySeverity[alert.severity] = 0;
    }
    this.stats.alertsBySeverity[alert.severity]++;
    
    // By category
    if (!this.stats.alertsByCategory[alert.category]) {
      this.stats.alertsByCategory[alert.category] = 0;
    }
    this.stats.alertsByCategory[alert.category]++;
  }

  /**
   * Start background processes
   */
  startBackgroundProcesses() {
    // Clean up old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);

    // Update statistics every 5 minutes
    setInterval(() => {
      this.updatePeriodicStatistics();
    }, 5 * 60 * 1000);

    // Clean up deduplication cache every 10 minutes
    setInterval(() => {
      this.cleanupDeduplicationCache();
    }, 10 * 60 * 1000);
  }

  /**
   * Clean up old alert data
   */
  cleanupOldData() {
    const cutoff = Date.now() - this.config.alertRetention;

    // Clean up alert history
    this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > cutoff);
    
    // Clean up old correlations
    for (const [key, correlation] of this.alertCorrelations) {
      if (correlation.lastSeen < cutoff) {
        this.alertCorrelations.delete(key);
      }
    }

    logger.debug('Alert data cleanup completed', {
      historySize: this.alertHistory.length,
      correlationsSize: this.alertCorrelations.size,
      activeAlertsSize: this.activeAlerts.size
    });
  }

  /**
   * Update periodic statistics
   */
  updatePeriodicStatistics() {
    // Calculate average resolution time
    const resolvedAlerts = this.alertHistory.filter(a => a.state === ALERT_STATE.RESOLVED && a.resolutionTime);
    if (resolvedAlerts.length > 0) {
      this.stats.avgResolutionTime = resolvedAlerts.reduce((sum, a) => sum + a.resolutionTime, 0) / resolvedAlerts.length;
    }

    // Calculate escalation rate
    const escalatedAlerts = this.alertHistory.filter(a => a.escalationLevel > 1);
    this.stats.escalationRate = escalatedAlerts.length / Math.max(this.stats.totalAlerts, 1);

    // Update monitoring metrics
    monitoring.setMetric('alerts.total', this.stats.totalAlerts);
    monitoring.setMetric('alerts.active', this.activeAlerts.size);
    monitoring.setMetric('alerts.avg_resolution_time', this.stats.avgResolutionTime);
    monitoring.setMetric('alerts.escalation_rate', this.stats.escalationRate);
  }

  /**
   * Clean up deduplication cache
   */
  cleanupDeduplicationCache() {
    const cutoff = Date.now() - this.config.deduplicationWindow;
    
    for (const [key, data] of this.recentAlerts) {
      if (data.timestamp < cutoff) {
        this.recentAlerts.delete(key);
      }
    }
  }

  /**
   * Get alert engine status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      activeAlerts: this.activeAlerts.size,
      totalRules: this.alertRules.size,
      totalPolicies: this.escalationPolicies.size,
      stormProtectionActive: this.isStormProtectionActive(),
      statistics: this.stats,
      config: {
        stormProtection: this.config.stormProtection,
        maxAlertsPerMinute: this.config.maxAlertsPerMinute,
        deduplicationWindow: this.config.deduplicationWindow,
        escalationTimeout: this.config.escalationTimeout
      }
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(filters = {}) {
    let alerts = Array.from(this.activeAlerts.values());
    
    // Apply filters
    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }
    if (filters.category) {
      alerts = alerts.filter(a => a.category === filters.category);
    }
    if (filters.source) {
      alerts = alerts.filter(a => a.source === filters.source);
    }
    
    // Sort by timestamp (newest first)
    alerts.sort((a, b) => b.timestamp - a.timestamp);
    
    return alerts;
  }

  /**
   * Get alert history
   */
  getAlertHistory(filters = {}, limit = 100) {
    let alerts = [...this.alertHistory];
    
    // Apply filters
    if (filters.startDate) {
      alerts = alerts.filter(a => a.timestamp >= filters.startDate);
    }
    if (filters.endDate) {
      alerts = alerts.filter(a => a.timestamp <= filters.endDate);
    }
    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }
    if (filters.category) {
      alerts = alerts.filter(a => a.category === filters.category);
    }
    
    // Sort by timestamp (newest first)
    alerts.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit
    return alerts.slice(0, limit);
  }
}

// Create singleton instance
export const alertEngine = new AlertEngine();

// Export utility functions
export const {
  addAlertRule,
  addEscalationPolicy,
  processAlert,
  acknowledgeAlert,
  resolveAlert,
  getActiveAlerts,
  getAlertHistory,
  getStatus
} = alertEngine;