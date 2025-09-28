#!/usr/bin/env node

/**
 * Memory Monitoring Script for Render Deployments
 * Tracks memory usage and identifies memory leaks
 */

import fetch from 'node-fetch';
import { writeFileSync, appendFileSync } from 'fs';
import path from 'path';

const ENVIRONMENTS = {
  development: 'https://sentia-manufacturing-development.onrender.com',
  testing: 'https://sentia-manufacturing-testing.onrender.com',
  production: 'https://sentia-manufacturing-production.onrender.com'
};

const CHECKINTERVAL = 60000; // 1 minute
const LOGFILE = path.join(process.cwd(), 'memory-report.log');

class MemoryMonitor {
  constructor() {
    this.history = {};
    this.alerts = [];
  }

  async checkEnvironment(name, url) {
    try {
      const response = await fetch(`${url}/health`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Memory-Monitor/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return this.analyzeMemory(name, data);
    } catch (error) {
      return {
        environment: name,
        status: 'error',
        error: error.message
      };
    }
  }

  analyzeMemory(name, data) {
    const memory = data.memory || {};
    const heapUsed = parseFloat(memory.heapUsedMB) || 0;
    const heapTotal = parseFloat(memory.heapTotalMB) || 0;
    const heapPercent = parseFloat(memory.heapPercent) || 0;
    const rss = parseFloat(memory.rssMB) || 0;

    // Initialize history
    if (!this.history[name]) {
      this.history[name] = [];
    }

    // Add to history
    const entry = {
      timestamp: new Date().toISOString(),
      heapUsed,
      heapTotal,
      heapPercent,
      rss,
      uptime: data.uptime
    };

    this.history[name].push(entry);

    // Keep only last 60 entries (1 hour at 1-minute intervals)
    if (this.history[name].length > 60) {
      this.history[name].shift();
    }

    // Analyze trends
    const analysis = this.analyzeTrends(name);

    return {
      environment: name,
      current: entry,
      analysis,
      alerts: this.checkAlerts(name, entry, analysis)
    };
  }

  analyzeTrends(name) {
    const history = this.history[name];
    if (history.length < 5) {
      return { trend: 'insufficient_data' };
    }

    // Calculate memory growth rate
    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    const recentAvg = recent.reduce((sum, e) => sum + e.heapUsed, 0) / recent.length;
    const olderAvg = older.length > 0
      ? older.reduce((sum, e) => sum + e.heapUsed, 0) / older.length
      : recentAvg;

    const growthRate = ((recentAvg - olderAvg) / olderAvg) * 100;

    // Check for memory leak patterns
    const isIncreasing = recent.every((e, i) =>
      i === 0 || e.heapUsed >= recent[i - 1].heapUsed
    );

    return {
      trend: growthRate > 10 ? 'increasing' : growthRate < -10 ? 'decreasing' : 'stable',
      growthRate: growthRate.toFixed(2),
      averageHeap: recentAvg.toFixed(2),
      possibleLeak: isIncreasing && growthRate > 20
    };
  }

  checkAlerts(name, current, analysis) {
    const alerts = [];

    // High memory usage
    if (current.heapPercent > 80) {
      alerts.push({
        level: 'warning',
        message: `High heap usage: ${current.heapPercent}%`
      });
    }

    if (current.heapPercent > 90) {
      alerts.push({
        level: 'critical',
        message: `Critical heap usage: ${current.heapPercent}%`
      });
    }

    // Memory leak detection
    if (analysis.possibleLeak) {
      alerts.push({
        level: 'warning',
        message: `Possible memory leak detected (${analysis.growthRate}% growth)`
      });
    }

    // High RSS
    if (current.rss > 200) {
      alerts.push({
        level: 'warning',
        message: `High RSS memory: ${current.rss}MB`
      });
    }

    return alerts;
  }

  generateReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        healthy: 0,
        warning: 0,
        critical: 0,
        error: 0
      },
      environments: results
    };

    // Count statuses
    results.forEach(result => {
      if (result.status === 'error') {
        report.summary.error++;
      } else if (result.alerts?.some(a => a.level === 'critical')) {
        report.summary.critical++;
      } else if (result.alerts?.some(a => a.level === 'warning')) {
        report.summary.warning++;
      } else {
        report.summary.healthy++;
      }
    });

    return report;
  }

  saveReport(report) {
    const line = JSON.stringify(report) + '\n';
    appendFileSync(LOG_FILE, line);

    // Also save a human-readable summary
    const summary = `
=================================================
Memory Report - ${report.timestamp}
=================================================
Status: ${report.summary.critical > 0 ? 'CRITICAL' : report.summary.warning > 0 ? 'WARNING' : 'HEALTHY'}

${report.environments.map(env => {
  if (env.status === 'error') {
    return `${env.environment}: ERROR - ${env.error}`;
  }
  return `
${env.environment.toUpperCase()}:
  Heap: ${env.current.heapUsed}MB / ${env.current.heapTotal}MB (${env.current.heapPercent}%)
  RSS: ${env.current.rss}MB
  Trend: ${env.analysis.trend} (${env.analysis.growthRate}% growth)
  ${env.alerts.length > 0 ? 'Alerts: ' + env.alerts.map(a => a.message).join(', ') : ''}`;
}).join('\n')}
=================================================
`;

    console.log(summary);
  }
}

async function monitor() {
  const monitor = new MemoryMonitor();

  console.log('Starting memory monitoring...');
  console.log(`Checking every ${CHECK_INTERVAL / 1000} seconds`);
  console.log(`Logging to: ${LOG_FILE}`);

  async function check() {
    const results = await Promise.all(
      Object.entries(ENVIRONMENTS).map(([name, url]) =>
        monitor.checkEnvironment(name, url)
      )
    );

    const report = monitor.generateReport(results);
    monitor.saveReport(report);

    // Alert on critical issues
    const criticalAlerts = results
      .flatMap(r => r.alerts || [])
      .filter(a => a.level === 'critical');

    if (criticalAlerts.length > 0) {
      console.error('\n🚨 CRITICAL ALERTS:');
      criticalAlerts.forEach(alert => console.error(`  - ${alert.message}`));
    }
  }

  // Initial check
  await check();

  // Set up interval
  setInterval(check, CHECK_INTERVAL);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  monitor().catch(console.error);
}

export { MemoryMonitor };