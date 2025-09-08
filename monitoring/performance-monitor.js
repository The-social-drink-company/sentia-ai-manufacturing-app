import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PerformanceMonitor {
  constructor() {
    this.metricsEndpoints = [
      {
        name: 'API Performance',
        url: 'https://web-production-1f10.up.railway.app/api/health',
        type: 'api'
      },
      {
        name: 'Dashboard Load Time',
        url: 'https://web-production-1f10.up.railway.app',
        type: 'frontend'
      },
      {
        name: 'Working Capital API',
        url: 'https://web-production-1f10.up.railway.app/api/working-capital',
        type: 'api'
      }
    ];
    
    this.logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  async measureEndpointPerformance(endpoint) {
    const measurements = [];
    const iterations = 5;
    
    console.log(`📊 Measuring ${endpoint.name} performance...`);
    
    for (let i = 0; i < iterations; i++) {
      const startTime = process.hrtime.bigint();
      
      try {
        const response = await fetch(endpoint.url, {
          timeout: 30000,
          headers: { 'User-Agent': 'Sentia-Performance-Monitor/1.0' }
        });
        
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        measurements.push({
          responseTime: Math.round(responseTime),
          status: response.status,
          success: response.ok,
          timestamp: new Date().toISOString()
        });
        
        // Small delay between measurements
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000;
        
        measurements.push({
          responseTime: Math.round(responseTime),
          status: 0,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return this.calculatePerformanceMetrics(endpoint, measurements);
  }

  calculatePerformanceMetrics(endpoint, measurements) {
    const successful = measurements.filter(m => m.success);
    const failed = measurements.filter(m => !m.success);
    
    if (successful.length === 0) {
      return {
        name: endpoint.name,
        url: endpoint.url,
        type: endpoint.type,
        totalRequests: measurements.length,
        successRate: 0,
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        status: 'FAILED',
        timestamp: new Date().toISOString()
      };
    }
    
    const responseTimes = successful.map(m => m.responseTime);
    const avgResponseTime = Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    // Calculate 95th percentile
    const sorted = responseTimes.sort((a, b) => a - b);
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    const p95ResponseTime = sorted[p95Index] || avgResponseTime;
    
    const successRate = Math.round((successful.length / measurements.length) * 100);
    
    // Determine performance status
    let status = 'EXCELLENT';
    if (avgResponseTime > 1000) status = 'POOR';
    else if (avgResponseTime > 500) status = 'FAIR';
    else if (avgResponseTime > 200) status = 'GOOD';
    
    return {
      name: endpoint.name,
      url: endpoint.url,
      type: endpoint.type,
      totalRequests: measurements.length,
      successRate,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      status,
      timestamp: new Date().toISOString(),
      rawMeasurements: measurements
    };
  }

  async runPerformanceTest() {
    console.log('🚀 RUNNING COMPREHENSIVE PERFORMANCE TEST');
    console.log('=========================================');
    
    const results = [];
    
    for (const endpoint of this.metricsEndpoints) {
      const metrics = await this.measureEndpointPerformance(endpoint);
      results.push(metrics);
    }
    
    const summary = this.generatePerformanceSummary(results);
    this.logPerformanceResults(summary);
    this.displayPerformanceResults(summary);
    
    return summary;
  }

  generatePerformanceSummary(results) {
    const avgResponseTime = Math.round(
      results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length
    );
    
    const avgSuccessRate = Math.round(
      results.reduce((sum, r) => sum + r.successRate, 0) / results.length
    );
    
    const slowestEndpoint = results.reduce((prev, current) => 
      prev.avgResponseTime > current.avgResponseTime ? prev : current
    );
    
    const fastestEndpoint = results.reduce((prev, current) => 
      prev.avgResponseTime < current.avgResponseTime ? prev : current
    );
    
    // Overall performance rating
    let overallRating = 'EXCELLENT';
    if (avgResponseTime > 1000 || avgSuccessRate < 95) overallRating = 'POOR';
    else if (avgResponseTime > 500 || avgSuccessRate < 98) overallRating = 'FAIR';
    else if (avgResponseTime > 200 || avgSuccessRate < 99) overallRating = 'GOOD';
    
    return {
      timestamp: new Date().toISOString(),
      overallRating,
      avgResponseTime,
      avgSuccessRate,
      totalEndpoints: results.length,
      slowestEndpoint: {
        name: slowestEndpoint.name,
        responseTime: slowestEndpoint.avgResponseTime
      },
      fastestEndpoint: {
        name: fastestEndpoint.name,
        responseTime: fastestEndpoint.avgResponseTime
      },
      results
    };
  }

  displayPerformanceResults(summary) {
    console.log('\\n📈 PERFORMANCE TEST SUMMARY');
    console.log('============================');
    console.log(`🎯 Overall Rating: ${summary.overallRating}`);
    console.log(`⚡ Average Response Time: ${summary.avgResponseTime}ms`);
    console.log(`✅ Average Success Rate: ${summary.avgSuccessRate}%`);
    console.log(`🐌 Slowest: ${summary.slowestEndpoint.name} (${summary.slowestEndpoint.responseTime}ms)`);
    console.log(`🚀 Fastest: ${summary.fastestEndpoint.name} (${summary.fastestEndpoint.responseTime}ms)`);
    
    console.log('\\n📊 DETAILED ENDPOINT METRICS:');
    console.log('==============================');
    
    summary.results.forEach(result => {
      console.log(`\\n${result.name}:`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Success Rate: ${result.successRate}%`);
      console.log(`   Avg Response: ${result.avgResponseTime}ms`);
      console.log(`   Min/Max: ${result.minResponseTime}ms / ${result.maxResponseTime}ms`);
      console.log(`   95th Percentile: ${result.p95ResponseTime}ms`);
    });
    
    // Performance recommendations
    console.log('\\n💡 PERFORMANCE RECOMMENDATIONS:');
    console.log('================================');
    
    const slowEndpoints = summary.results.filter(r => r.avgResponseTime > 500);
    if (slowEndpoints.length > 0) {
      console.log('⚠️ Slow Endpoints Detected:');
      slowEndpoints.forEach(endpoint => {
        console.log(`   - ${endpoint.name}: Consider optimization`);
      });
    }
    
    const lowSuccessRateEndpoints = summary.results.filter(r => r.successRate < 100);
    if (lowSuccessRateEndpoints.length > 0) {
      console.log('⚠️ Reliability Issues:');
      lowSuccessRateEndpoints.forEach(endpoint => {
        console.log(`   - ${endpoint.name}: ${endpoint.successRate}% success rate`);
      });
    }
    
    if (slowEndpoints.length === 0 && lowSuccessRateEndpoints.length === 0) {
      console.log('✅ All endpoints performing within acceptable parameters!');
    }
  }

  logPerformanceResults(summary) {
    const logFile = path.join(this.logDir, 'performance-monitor.log');
    const logEntry = JSON.stringify(summary, null, 2) + '\\n\\n';
    fs.appendFileSync(logFile, logEntry);
    
    // Also create a CSV for trend analysis
    this.logPerformanceCSV(summary);
  }

  logPerformanceCSV(summary) {
    const csvFile = path.join(this.logDir, 'performance-trends.csv');
    
    // Create header if file doesn't exist
    if (!fs.existsSync(csvFile)) {
      const header = 'timestamp,overall_rating,avg_response_time,avg_success_rate,slowest_endpoint,slowest_time,fastest_endpoint,fastest_time\\n';
      fs.writeFileSync(csvFile, header);
    }
    
    const csvRow = [
      summary.timestamp,
      summary.overallRating,
      summary.avgResponseTime,
      summary.avgSuccessRate,
      summary.slowestEndpoint.name,
      summary.slowestEndpoint.responseTime,
      summary.fastestEndpoint.name,
      summary.fastestEndpoint.responseTime
    ].join(',') + '\\n';
    
    fs.appendFileSync(csvFile, csvRow);
  }

  async startPerformanceMonitoring(intervalMinutes = 15) {
    console.log(`🔄 STARTING PERFORMANCE MONITORING (${intervalMinutes}min intervals)`);
    console.log('===========================');
    
    // Run initial test
    await this.runPerformanceTest();
    
    // Schedule recurring tests
    setInterval(async () => {
      console.log('\\n⏰ Running scheduled performance test...');
      await this.runPerformanceTest();
    }, intervalMinutes * 60 * 1000);
  }
}

// CLI usage
if (process.argv[1] === __filename) {
  const monitor = new PerformanceMonitor();
  const command = process.argv[2] || 'test';
  
  switch (command) {
    case 'test':
      monitor.runPerformanceTest();
      break;
    case 'monitor':
      const interval = parseInt(process.argv[3]) || 15;
      monitor.startPerformanceMonitoring(interval);
      break;
    default:
      console.log('Usage: node performance-monitor.js [test|monitor] [interval_minutes]');
  }
}

export default PerformanceMonitor;