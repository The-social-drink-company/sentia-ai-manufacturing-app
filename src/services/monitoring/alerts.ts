// Alerting System with Performance and Business Metric Monitoring
import { EventEmitter } from 'events';

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'suppressed';
type AlertChannel = 'email' | 'sms' | 'slack' | 'webhook' | 'pagerduty';

interface Alert {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  metric: string;
  condition: AlertCondition;
  value: number;
  threshold: number;
  timestamp: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  resolvedAt?: number;
  metadata?: Record<string, any>;
}

interface AlertCondition {
  type: 'threshold' | 'rate' | 'anomaly' | 'pattern';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  duration?: number; // Time in ms the condition must be true
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  window?: number; // Time window in ms for aggregation
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  metric: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  channels: AlertChannel[];
  cooldown?: number; // Time in ms before alert can fire again
  lastFired?: number;
  metadata?: Record<string, any>;
}

interface EscalationPolicy {
  id: string;
  name: string;
  levels: EscalationLevel[];
  repeatInterval?: number;
}

interface EscalationLevel {
  delay: number; // Time in ms before escalation
  channels: AlertChannel[];
  contacts: string[];
}

class AlertingSystem extends EventEmitter {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private metrics: Map<string, number[]> = new Map();
  private escalations: Map<string, EscalationPolicy> = new Map();
  private checkInterval: number = 60000; // 1 minute
  private checkTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeDefaultRules();
    this.startMonitoring();
  }

  private initializeDefaultRules() {
    // Performance alerts
    this.addRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      description: 'Error rate exceeds 5%',
      enabled: true,
      metric: 'error.rate',
      condition: {
        type: 'threshold',
        operator: '>',
        threshold: 0.05,
        duration: 300000, // 5 minutes
        aggregation: 'avg',
        window: 300000
      },
      severity: 'high',
      channels: ['slack', 'email'],
      cooldown: 1800000 // 30 minutes
    });

    this.addRule({
      id: 'slow-response-time',
      name: 'Slow Response Time',
      description: 'API response time exceeds 2 seconds',
      enabled: true,
      metric: 'api.response.time',
      condition: {
        type: 'threshold',
        operator: '>',
        threshold: 2000,
        duration: 180000, // 3 minutes
        aggregation: 'avg',
        window: 300000
      },
      severity: 'medium',
      channels: ['slack'],
      cooldown: 900000 // 15 minutes
    });

    this.addRule({
      id: 'memory-usage-high',
      name: 'High Memory Usage',
      description: 'Memory usage exceeds 90%',
      enabled: true,
      metric: 'system.memory.usage',
      condition: {
        type: 'threshold',
        operator: '>',
        threshold: 0.9,
        duration: 600000, // 10 minutes
        aggregation: 'avg',
        window: 600000
      },
      severity: 'high',
      channels: ['pagerduty', 'slack'],
      cooldown: 1800000
    });

    // Business metric alerts
    this.addRule({
      id: 'low-conversion-rate',
      name: 'Low Conversion Rate',
      description: 'Conversion rate below 2%',
      enabled: true,
      metric: 'business.conversion.rate',
      condition: {
        type: 'threshold',
        operator: '<',
        threshold: 0.02,
        duration: 3600000, // 1 hour
        aggregation: 'avg',
        window: 3600000
      },
      severity: 'medium',
      channels: ['email'],
      cooldown: 7200000 // 2 hours
    });

    this.addRule({
      id: 'revenue-anomaly',
      name: 'Revenue Anomaly',
      description: 'Unusual revenue pattern detected',
      enabled: true,
      metric: 'business.revenue.hourly',
      condition: {
        type: 'anomaly',
        operator: '<',
        threshold: -2, // 2 standard deviations below mean
        aggregation: 'sum',
        window: 3600000
      },
      severity: 'high',
      channels: ['slack', 'email'],
      cooldown: 3600000
    });

    this.addRule({
      id: 'inventory-critical',
      name: 'Critical Inventory Level',
      description: 'Inventory below critical threshold',
      enabled: true,
      metric: 'business.inventory.critical.items',
      condition: {
        type: 'threshold',
        operator: '>',
        threshold: 0,
        duration: 0,
        aggregation: 'count'
      },
      severity: 'critical',
      channels: ['pagerduty', 'sms', 'slack'],
      cooldown: 3600000
    });

    // System health checks
    this.addRule({
      id: 'database-connection-failure',
      name: 'Database Connection Failure',
      description: 'Unable to connect to database',
      enabled: true,
      metric: 'system.database.connected',
      condition: {
        type: 'threshold',
        operator: '==',
        threshold: 0,
        duration: 60000 // 1 minute
      },
      severity: 'critical',
      channels: ['pagerduty', 'sms'],
      cooldown: 300000
    });

    this.addRule({
      id: 'api-availability',
      name: 'API Availability',
      description: 'API availability below 99.5%',
      enabled: true,
      metric: 'system.api.availability',
      condition: {
        type: 'threshold',
        operator: '<',
        threshold: 0.995,
        duration: 300000,
        aggregation: 'avg',
        window: 900000
      },
      severity: 'high',
      channels: ['slack', 'email'],
      cooldown: 1800000
    });
  }

  // Rule Management
  public addRule(rule: AlertRule) {
    this.rules.set(rule.id, rule);
    this.emit('rule:added', rule);
  }

  public updateRule(id: string, updates: Partial<AlertRule>) {
    const rule = this.rules.get(id);
    if (rule) {
      Object.assign(rule, updates);
      this.emit('rule:updated', rule);
    }
  }

  public deleteRule(id: string) {
    const rule = this.rules.get(id);
    if (rule) {
      this.rules.delete(id);
      this.emit('rule:deleted', rule);
    }
  }

  public enableRule(id: string) {
    this.updateRule(id, { enabled: true });
  }

  public disableRule(id: string) {
    this.updateRule(id, { enabled: false });
  }

  // Metric Recording
  public recordMetric(name: string, value: number, timestamp?: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricValues = this.metrics.get(name)!;
    metricValues.push(value);

    // Keep only last hour of data points
    const oneHourAgo = Date.now() - 3600000;
    const recentValues = metricValues.filter((_, index) => {
      const metricTime = timestamp || Date.now();
      return metricTime > oneHourAgo;
    });
    this.metrics.set(name, recentValues);

    // Check rules immediately for this metric
    this.checkRulesForMetric(name, value);
  }

  // Alert Checking
  private startMonitoring() {
    this.checkTimer = setInterval(() => {
      this.checkAllRules();
    }, this.checkInterval);
  }

  private checkAllRules() {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      
      const metricValues = this.metrics.get(rule.metric);
      if (!metricValues || metricValues.length === 0) continue;

      this.evaluateRule(rule, metricValues);
    }
  }

  private checkRulesForMetric(metric: string, value: number) {
    for (const rule of this.rules.values()) {
      if (!rule.enabled || rule.metric !== metric) continue;
      
      const metricValues = this.metrics.get(metric);
      if (!metricValues) continue;

      this.evaluateRule(rule, metricValues);
    }
  }

  private evaluateRule(rule: AlertRule, values: number[]) {
    // Check cooldown
    if (rule.lastFired && Date.now() - rule.lastFired < (rule.cooldown || 0)) {
      return;
    }

    const condition = rule.condition;
    let evalValue: number;

    // Calculate aggregated value if needed
    if (condition.aggregation && condition.window) {
      const windowValues = this.getValuesInWindow(values, condition.window);
      evalValue = this.aggregate(windowValues, condition.aggregation);
    } else {
      evalValue = values[values.length - 1]; // Use latest value
    }

    // Check if condition is met
    const conditionMet = this.evaluateCondition(evalValue, condition);

    if (conditionMet) {
      // Check duration requirement
      if (condition.duration) {
        // Would need to track condition state over time
        // Simplified: fire immediately for now
      }

      this.fireAlert(rule, evalValue);
    } else {
      // Check if we should resolve an existing alert
      const alertKey = `${rule.id}:${rule.metric}`;
      if (this.activeAlerts.has(alertKey)) {
        this.resolveAlert(alertKey);
      }
    }
  }

  private evaluateCondition(value: number, condition: AlertCondition): boolean {
    switch (condition.type) {
      case 'threshold':
        return this.compareValue(value, condition.operator, condition.threshold);
      
      case 'anomaly':
        return this.detectAnomaly(value, condition.threshold);
      
      case 'rate':
        // Calculate rate of change
        return false; // Simplified
      
      case 'pattern':
        // Pattern matching
        return false; // Simplified
      
      default:
        return false;
    }
  }

  private compareValue(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  private detectAnomaly(value: number, threshold: number): boolean {
    // Simplified anomaly detection
    // In production, would use statistical methods
    return Math.abs(value) > Math.abs(threshold);
  }

  private aggregate(values: number[], method: string): number {
    if (values.length === 0) return 0;

    switch (method) {
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return values[values.length - 1];
    }
  }

  private getValuesInWindow(values: number[], window: number): number[] {
    const now = Date.now();
    const startTime = now - window;
    // Simplified: return recent values
    return values.slice(-10);
  }

  // Alert Management
  private fireAlert(rule: AlertRule, value: number) {
    const alertKey = `${rule.id}:${rule.metric}`;
    
    // Check if alert already active
    if (this.activeAlerts.has(alertKey)) {
      return;
    }

    const alert: Alert = {
      id: this.generateId(),
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      status: 'active',
      metric: rule.metric,
      condition: rule.condition,
      value,
      threshold: rule.condition.threshold,
      timestamp: Date.now(),
      metadata: rule.metadata
    };

    this.activeAlerts.set(alertKey, alert);
    rule.lastFired = Date.now();

    // Send notifications
    this.sendNotifications(alert, rule.channels);

    // Start escalation if policy exists
    const escalation = this.escalations.get(rule.severity);
    if (escalation) {
      this.startEscalation(alert, escalation);
    }

    this.emit('alert:fired', alert);
  }

  public acknowledgeAlert(alertId: string, userId: string) {
    for (const alert of this.activeAlerts.values()) {
      if (alert.id === alertId) {
        alert.status = 'acknowledged';
        alert.acknowledgedAt = Date.now();
        alert.acknowledgedBy = userId;
        this.emit('alert:acknowledged', alert);
        break;
      }
    }
  }

  private resolveAlert(alertKey: string) {
    const alert = this.activeAlerts.get(alertKey);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = Date.now();
      this.activeAlerts.delete(alertKey);
      this.emit('alert:resolved', alert);
    }
  }

  // Notification Channels
  private async sendNotifications(alert: Alert, channels: AlertChannel[]) {
    for (const channel of channels) {
      try {
        await this.sendToChannel(alert, channel);
      } catch (error) {
        console.error(`Failed to send alert to ${channel}:`, error);
      }
    }
  }

  private async sendToChannel(alert: Alert, channel: AlertChannel) {
    const message = this.formatAlertMessage(alert);

    switch (channel) {
      case 'email':
        await this.sendEmail(alert, message);
        break;
      case 'sms':
        await this.sendSMS(alert, message);
        break;
      case 'slack':
        await this.sendSlack(alert, message);
        break;
      case 'webhook':
        await this.sendWebhook(alert);
        break;
      case 'pagerduty':
        await this.sendPagerDuty(alert);
        break;
    }
  }

  private formatAlertMessage(alert: Alert): string {
    return `[${alert.severity.toUpperCase()}] ${alert.name}
${alert.description}
Metric: ${alert.metric}
Value: ${alert.value}
Threshold: ${alert.threshold}
Time: ${new Date(alert.timestamp).toISOString()}`;
  }

  private async sendEmail(alert: Alert, message: string) {
    // Email implementation
    await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: this.getEmailRecipients(alert.severity),
        subject: `Alert: ${alert.name}`,
        body: message
      })
    });
  }

  private async sendSMS(alert: Alert, message: string) {
    // SMS implementation
    await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: this.getSMSRecipients(alert.severity),
        message: message.substring(0, 160) // SMS length limit
      })
    });
  }

  private async sendSlack(alert: Alert, message: string) {
    // Slack implementation
    await fetch(import.meta.env.VITE_SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        attachments: [{
          color: this.getSeverityColor(alert.severity),
          fields: [
            { title: 'Metric', value: alert.metric, short: true },
            { title: 'Value', value: alert.value.toString(), short: true },
            { title: 'Threshold', value: alert.threshold.toString(), short: true },
            { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: true }
          ]
        }]
      })
    });
  }

  private async sendWebhook(alert: Alert) {
    // Generic webhook
    await fetch(import.meta.env.VITE_ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    });
  }

  private async sendPagerDuty(alert: Alert) {
    // PagerDuty integration
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token token=${import.meta.env.VITE_PAGERDUTY_TOKEN}`
      },
      body: JSON.stringify({
        routing_key: import.meta.env.VITE_PAGERDUTY_ROUTING_KEY,
        event_action: 'trigger',
        payload: {
          summary: alert.name,
          severity: alert.severity,
          source: 'sentia-dashboard',
          custom_details: alert
        }
      })
    });
  }

  // Escalation
  private startEscalation(alert: Alert, policy: EscalationPolicy) {
    policy.levels.forEach((level, index) => {
      setTimeout(() => {
        if (this.activeAlerts.has(`${alert.id}:${alert.metric}`)) {
          this.sendNotifications(alert, level.channels);
        }
      }, level.delay);
    });
  }

  // Helper methods
  private getEmailRecipients(severity: AlertSeverity): string[] {
    const recipients = ['ops@sentia.com'];
    if (severity === 'critical' || severity === 'high') {
      recipients.push('oncall@sentia.com');
    }
    return recipients;
  }

  private getSMSRecipients(severity: AlertSeverity): string[] {
    if (severity === 'critical') {
      return ['+1234567890']; // On-call phone
    }
    return [];
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical': return '#FF0000';
      case 'high': return '#FF8800';
      case 'medium': return '#FFAA00';
      case 'low': return '#0088FF';
      case 'info': return '#888888';
      default: return '#888888';
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Public API
  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  public getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  public getMetrics(): Map<string, number[]> {
    return this.metrics;
  }

  public destroy() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
  }
}

// Export singleton
let alertingInstance: AlertingSystem | null = null;

export const getAlertingSystem = () => {
  if (!alertingInstance) {
    alertingInstance = new AlertingSystem();
  }
  return alertingInstance;
};

export type { Alert, AlertRule, AlertSeverity, AlertChannel, EscalationPolicy };