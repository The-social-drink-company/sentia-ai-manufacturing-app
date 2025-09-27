/**
 * Continuous Compliance Monitoring Module
 */

import EventEmitter from 'events';

export class ComplianceMonitor extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      enabled: true,
      interval: 3600000, // 1 hour default
      alertThreshold: 80, // Alert if compliance score < 80%
      ...config
    };

    this.monitoringInterval = null;
    this.isRunning = false;
    this.metrics = {
      runs: 0,
      lastRun: null,
      failures: 0,
      averageScore: 0
    };
  }

  async start(complianceEngine, interval) {
    if (this.isRunning) {
      return false;
    }

    this.isRunning = true;
    const checkInterval = interval || this.config.interval;

    this.monitoringInterval = setInterval(async _() => {
      await this.runMonitoringCycle(complianceEngine);
    }, checkInterval);

    // Run initial check
    await this.runMonitoringCycle(complianceEngine);

    this.emit('monitor:started', { interval: checkInterval });
    return true;
  }

  async stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isRunning = false;
      this.emit('monitor:stopped');
      return true;
    }
    return false;
  }

  async runMonitoringCycle(complianceEngine) {
    try {
      this.metrics.runs++;
      this.metrics.lastRun = new Date();

      const results = await complianceEngine.runCompliance();

      // Update metrics
      this.updateMetrics(results);

      // Check thresholds
      await this.checkThresholds(results);

      this.emit('monitor:cycle:complete', { results, metrics: this.metrics });
    } catch (error) {
      this.metrics.failures++;
      this.emit('monitor:cycle:error', { error, metrics: this.metrics });
    }
  }

  updateMetrics(results) {
    const score = results.summary?.complianceScore || 0;

    // Calculate running average
    this.metrics.averageScore =
      (this.metrics.averageScore * (this.metrics.runs - 1) + score) /
      this.metrics.runs;

    // Track trends
    if (!this.metrics.scoreHistory) {
      this.metrics.scoreHistory = [];
    }

    this.metrics.scoreHistory.push({
      timestamp: new Date(),
      score,
      status: results.overall
    });

    // Keep only last 100 scores
    if (this.metrics.scoreHistory.length > 100) {
      this.metrics.scoreHistory.shift();
    }
  }

  async checkThresholds(results) {
    const score = results.summary?.complianceScore || 0;

    if (score < this.config.alertThreshold) {
      await this.triggerAlert({
        type: 'LOW_COMPLIANCE_SCORE',
        score,
        threshold: this.config.alertThreshold,
        results
      });
    }

    // Check for critical failures
    const criticalFailures = this.findCriticalFailures(results);
    if (criticalFailures.length > 0) {
      await this.triggerAlert({
        type: 'CRITICAL_FAILURES',
        failures: criticalFailures,
        results
      });
    }
  }

  findCriticalFailures(results) {
    const failures = [];

    for (const [standard, result] of Object.entries(results.standards || {})) {
      if (result.details?.failed) {
        for (const failure of result.details.failed) {
          if (this.isCriticalControl(standard, failure)) {
            failures.push({
              standard,
              control: failure.controlId || failure.right,
              description: failure.description
            });
          }
        }
      }
    }

    return failures;
  }

  isCriticalControl(standard, failure) {
    // Define critical controls per standard
    const criticalControls = {
      soc2: ['cc6', 'cc7', 'cc9'], // Access, Operations, Risk
      gdpr: ['right_to_erasure', 'breach_notification'],
      pci: ['requirement_1', 'requirement_2'], // Firewall, Passwords
      hipaa: ['access_control', 'encryption']
    };

    const standardCritical = criticalControls[standard] || [];
    return standardCritical.includes(failure.controlId || failure.right);
  }

  async triggerAlert(alert) {
    this.emit('monitor:alert', alert);

    // Additional alert handling could be implemented here
    // e.g., send email, webhook, SMS, etc.
  }

  getMetrics() {
    return {
      ...this.metrics,
      isRunning: this.isRunning,
      trend: this.calculateTrend()
    };
  }

  calculateTrend() {
    if (!this.metrics.scoreHistory || this.metrics.scoreHistory.length < 2) {
      return 'STABLE';
    }

    const recent = this.metrics.scoreHistory.slice(-10);
    const oldAvg = recent.slice(0, 5).reduce((sum, h) => sum + h.score, 0) / 5;
    const newAvg = recent.slice(-5).reduce((sum, h) => sum + h.score, 0) / 5;

    if (newAvg > oldAvg + 5) return 'IMPROVING';
    if (newAvg < oldAvg - 5) return 'DECLINING';
    return 'STABLE';
  }

  async generateStatusReport() {
    return {
      status: this.isRunning ? 'ACTIVE' : 'INACTIVE',
      metrics: this.getMetrics(),
      configuration: this.config,
      nextRun: this.calculateNextRun()
    };
  }

  calculateNextRun() {
    if (!this.isRunning || !this.metrics.lastRun) {
      return null;
    }

    return new Date(
      this.metrics.lastRun.getTime() + this.config.interval
    );
  }
}

export default ComplianceMonitor;