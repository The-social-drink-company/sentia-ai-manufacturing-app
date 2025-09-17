// Node 18+ has global fetch
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HealthMonitor {
  constructor() {
    this.endpoints = [
      {
        name: 'Production API Health',
        url: 'https://web-production-1f10.up.railway.app/api/health',
        timeout: 10000,
        expectedStatus: 200
      },
      {
        name: 'Dashboard Overview API',
        url: 'https://web-production-1f10.up.railway.app/api/dashboard/overview',
        timeout: 15000,
        expectedStatus: 200
      },
      {
        name: 'Forecasting API',
        url: 'https://web-production-1f10.up.railway.app/api/forecasting/demand',
        timeout: 15000,
        expectedStatus: 200
      },
      {
        name: 'Working Capital API',
        url: 'https://web-production-1f10.up.railway.app/api/working-capital',
        timeout: 10000,
        expectedStatus: 200
      },
      {
        name: 'Frontend Application',
        url: 'https://web-production-1f10.up.railway.app',
        timeout: 10000,
        expectedStatus: 200
      }
    ];
    
    this.logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  async checkEndpoint(endpoint) {
    const startTime = Date.now();
    try {
      const response = await fetch(endpoint.url, {
        timeout: endpoint.timeout,
        headers: {
          'User-Agent': 'Sentia-Health-Monitor/1.0'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === endpoint.expectedStatus;
      
      return {
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        responseTime,
        healthy: isHealthy,
        timestamp: new Date().toISOString(),
        error: null
      };
    } catch (error) {
      return {
        name: endpoint.name,
        url: endpoint.url,
        status: 0,
        responseTime: Date.now() - startTime,
        healthy: false,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async runHealthCheck() {
    console.log('🔍 RUNNING COMPREHENSIVE HEALTH CHECK');
    console.log('=====================================');
    
    const results = await Promise.all(
      this.endpoints.map(endpoint => this.checkEndpoint(endpoint))
    );
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalEndpoints: results.length,
      healthyEndpoints: results.filter(r => r.healthy).length,
      unhealthyEndpoints: results.filter(r => !r.healthy).length,
      averageResponseTime: Math.round(
        results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      ),
      results
    };

    // Log results
    this.logHealthCheck(summary);
    
    // Display results
    this.displayResults(summary);
    
    return summary;
  }

  displayResults(summary) {
    console.log(`\\n📊 HEALTH CHECK SUMMARY`);
    console.log(`============================`);
    console.log(`✅ Healthy: ${summary.healthyEndpoints}/${summary.totalEndpoints}`);
    console.log(`⚠️ Unhealthy: ${summary.unhealthyEndpoints}/${summary.totalEndpoints}`);
    console.log(`⏱️ Average Response Time: ${summary.averageResponseTime}ms`);
    
    console.log(`\\n📋 DETAILED RESULTS:`);
    summary.results.forEach(result => {
      const status = result.healthy ? '✅' : '❌';
      const responseTime = result.responseTime + 'ms';
      console.log(`${status} ${result.name}: ${result.status} (${responseTime})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    const overallHealth = summary.unhealthyEndpoints === 0 ? 'HEALTHY' : 'DEGRADED';
    console.log(`\\n🎯 OVERALL SYSTEM STATUS: ${overallHealth}`);
  }

  logHealthCheck(summary) {
    const logFile = path.join(this.logDir, 'health-monitor.log');
    const logEntry = JSON.stringify(summary, null, 2) + '\\n';
    fs.appendFileSync(logFile, logEntry);
    
    // Keep only last 100 entries to prevent log bloat
    this.trimLogFile(logFile, 100);
  }

  trimLogFile(logFile, maxEntries) {
    try {
      const content = fs.readFileSync(logFile, 'utf8');
      const entries = content.trim().split('\\n\\n');
      if (entries.length > maxEntries) {
        const trimmed = entries.slice(-maxEntries).join('\\n\\n');
        fs.writeFileSync(logFile, trimmed + '\\n');
      }
    } catch (error) {
      // Ignore trimming errors
    }
  }

  async startContinuousMonitoring(intervalMinutes = 5) {
    console.log(`🔄 STARTING CONTINUOUS MONITORING (${intervalMinutes}min intervals)`);
    console.log('=================================');
    
    // Run initial check
    await this.runHealthCheck();
    
    // Set up continuous monitoring
    setInterval(async () => {
      console.log(`\\n⏰ Running scheduled health check...`);
      const summary = await this.runHealthCheck();
      
      // Alert on failures
      if (summary.unhealthyEndpoints > 0) {
        this.sendAlert(summary);
      }
    }, intervalMinutes * 60 * 1000);
  }

  sendAlert(summary) {
    console.log('🚨 ALERT: System health degraded!');
    console.log(`   Unhealthy endpoints: ${summary.unhealthyEndpoints}`);
    
    // Log alert
    const alertFile = path.join(this.logDir, 'alerts.log');
    const alertEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'System health degraded',
      details: summary
    };
    fs.appendFileSync(alertFile, JSON.stringify(alertEntry) + '\\n');
  }

  generateHealthReport() {
    console.log('📊 GENERATING HEALTH REPORT');
    console.log('===========================');
    
    const logFile = path.join(this.logDir, 'health-monitor.log');
    if (!fs.existsSync(logFile)) {
      console.log('❌ No health monitoring data available');
      return;
    }
    
    const content = fs.readFileSync(logFile, 'utf8');
    const entries = content.trim().split('\\n\\n');
    const recent = entries.slice(-20).map(entry => JSON.parse(entry));
    
    const avgResponseTime = Math.round(
      recent.reduce((sum, r) => sum + r.averageResponseTime, 0) / recent.length
    );
    
    const uptimePercent = Math.round(
      (recent.reduce((sum, r) => sum + (r.healthyEndpoints / r.totalEndpoints), 0) / recent.length) * 100
    );
    
    console.log(`📈 LAST 20 CHECKS SUMMARY:`);
    console.log(`   Average Response Time: ${avgResponseTime}ms`);
    console.log(`   System Uptime: ${uptimePercent}%`);
    console.log(`   Total Checks: ${recent.length}`);
    
    return {
      avgResponseTime,
      uptimePercent,
      totalChecks: recent.length,
      recentEntries: recent
    };
  }
}

// CLI usage
if (process.argv[1] === __filename) {
  const monitor = new HealthMonitor();
  const command = process.argv[2] || 'check';
  
  switch (command) {
    case 'check':
      monitor.runHealthCheck();
      break;
    case 'monitor':
      const interval = parseInt(process.argv[3]) || 5;
      monitor.startContinuousMonitoring(interval);
      break;
    case 'report':
      monitor.generateHealthReport();
      break;
    default:
      console.log('Usage: node health-monitor.js [check|monitor|report] [interval_minutes]');
  }
}

export default HealthMonitor;