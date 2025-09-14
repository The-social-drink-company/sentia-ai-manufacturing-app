import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for stress testing
const errorRate = new Rate('stress_errors');
const responseTime = new Trend('stress_response_time');
const concurrentUsers = new Trend('concurrent_users');
const memoryUsage = new Trend('memory_usage');

// Stress test configuration - aggressive load
export const options = {
  stages: [
    // Gradual ramp-up to identify breaking point
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '3m', target: 300 },  // Ramp up to 300 users
    { duration: '3m', target: 500 },  // Ramp up to 500 users
    { duration: '5m', target: 500 },  // Maintain 500 users
    { duration: '2m', target: 750 },  // Push to 750 users
    { duration: '5m', target: 750 },  // Maintain high load
    { duration: '2m', target: 1000 }, // Maximum stress - 1000 users
    { duration: '3m', target: 1000 }, // Maintain maximum load
    { duration: '5m', target: 0 },    // Gradual ramp down
  ],
  
  // More relaxed thresholds for stress testing
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 95% under 10s (degraded but functional)
    http_req_failed: ['rate<0.20'],     // Up to 20% failure rate acceptable
    stress_errors: ['rate<0.25'],       // Up to 25% custom error rate
    
    // Critical endpoints must remain somewhat functional
    'http_req_duration{name:health_check}': ['p(95)<5000'], // Health check under 5s
    'http_req_failed{name:health_check}': ['rate<0.10'],    // Health check 90% success
  },
  
  // Resource limits
  maxRedirects: 0,
  batch: 20, // Process requests in batches
  batchPerHost: 10,
  
  // Disable some features for performance
  discardResponseBodies: false, // Keep for error analysis
  noConnectionReuse: false,
  noVUConnectionReuse: false,
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
let authToken = __ENV.AUTH_TOKEN || '';

export function setup() {
  console.log('🔥 Starting STRESS TEST - Extreme Load Conditions');
  console.log(`Target: ${BASE_URL}`);
  console.log('⚠️  This test will push the system to its limits');
  
  // Quick auth check
  if (!authToken) {
    try {
      const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@sentiaspirits.com',
        password: 'test-password'
      });
      
      if (loginResponse.status === 200) {
        authToken = loginResponse.json().token;
      }
    } catch (e) {
      console.log('⚠️ Auth failed, proceeding without token');
    }
  }
  
  return { authToken };
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': data.authToken ? `Bearer ${data.authToken}` : '',
  };

  // Track concurrent users
  concurrentUsers.add(__VU);

  // Critical path stress test
  group('Critical Path Stress', () => {
    // Health check - must always work
    const healthStart = Date.now();
    const healthResponse = http.get(`${BASE_URL}/api/health`, {
      headers,
      tags: { name: 'health_check' },
      timeout: '10s'
    });
    
    const healthDuration = Date.now() - healthStart;
    
    check(healthResponse, {
      'health check responds': (r) => r.status !== 0,
      'health check not timeout': (r) => healthDuration < 10000,
    }) || errorRate.add(1);
    
    responseTime.add(healthDuration);
  });

  // Database stress test
  group('Database Stress', () => {
    const dbStart = Date.now();
    const productsResponse = http.get(`${BASE_URL}/api/products?limit=100`, {
      headers,
      tags: { name: 'database_stress' },
      timeout: '15s'
    });
    
    const dbDuration = Date.now() - dbStart;
    
    check(productsResponse, {
      'database responds': (r) => r.status !== 0,
      'database not completely broken': (r) => [200, 404, 500, 503].includes(r.status),
    }) || errorRate.add(1);
    
    responseTime.add(dbDuration);
  });

  // API stress test - multiple concurrent requests
  group('API Bombardment', () => {
    const requests = [
      ['GET', `${BASE_URL}/api/dashboard/overview`, null],
      ['GET', `${BASE_URL}/api/products/search?q=test`, null],
      ['GET', `${BASE_URL}/api/analytics/summary`, null],
      ['GET', `${BASE_URL}/api/integrations/health`, null],
    ];
    
    const responses = http.batch(requests.map(([method, url, body]) => ({
      method,
      url,
      body,
      headers,
      tags: { name: 'api_bombardment' },
      timeout: '20s'
    })));
    
    responses.forEach((response, index) => {
      check(response, {
        [`batch request ${index} responds`]: (r) => r.status !== 0,
        [`batch request ${index} not timeout`]: (r) => r.timings.duration < 20000,
      }) || errorRate.add(1);
      
      responseTime.add(response.timings.duration);
    });
  });

  // Memory pressure simulation
  group('Memory Pressure', () => {
    // Request large datasets to stress memory
    const largeDataResponse = http.get(`${BASE_URL}/api/products?limit=1000&include=all`, {
      headers,
      tags: { name: 'memory_pressure' },
      timeout: '30s'
    });
    
    check(largeDataResponse, {
      'large data request responds': (r) => r.status !== 0,
      'large data not completely failed': (r) => ![0, 502, 503, 504].includes(r.status),
    }) || errorRate.add(1);
    
    responseTime.add(largeDataResponse.timings.duration);
    
    // Simulate memory usage (response size)
    if (largeDataResponse.body) {
      memoryUsage.add(largeDataResponse.body.length);
    }
  });

  // Connection stress test
  group('Connection Stress', () => {
    // Rapid-fire requests to stress connection handling
    for (let i = 0; i < 5; i++) {
      const rapidResponse = http.get(`${BASE_URL}/api/health`, {
        headers,
        tags: { name: 'connection_stress' },
        timeout: '5s'
      });
      
      check(rapidResponse, {
        [`rapid request ${i} responds`]: (r) => r.status !== 0,
      }) || errorRate.add(1);
      
      responseTime.add(rapidResponse.timings.duration);
      
      // No sleep between requests - maximum stress
    }
  });

  // Integration stress test
  group('Integration Stress', () => {
    // Test external integrations under stress
    const integrationResponse = http.get(`${BASE_URL}/api/integrations/unleashed/products`, {
      headers,
      tags: { name: 'integration_stress' },
      timeout: '45s' // Longer timeout for external calls
    });
    
    check(integrationResponse, {
      'integration responds': (r) => r.status !== 0,
      'integration handles load': (r) => ![502, 503, 504].includes(r.status),
    }) || errorRate.add(1);
    
    responseTime.add(integrationResponse.timings.duration);
  });

  // Error recovery test
  group('Error Recovery', () => {
    // Intentionally trigger errors to test recovery
    const errorResponse = http.get(`${BASE_URL}/api/nonexistent/endpoint`, {
      headers,
      tags: { name: 'error_recovery' },
      timeout: '10s'
    });
    
    check(errorResponse, {
      'error handled gracefully': (r) => [404, 405].includes(r.status),
      'error response time reasonable': (r) => r.timings.duration < 5000,
    }) || errorRate.add(1);
    
    responseTime.add(errorResponse.timings.duration);
  });

  // Minimal sleep to maximize stress
  sleep(Math.random() * 0.5); // 0-500ms only
}

export function teardown(data) {
  console.log('🔥 STRESS TEST COMPLETED');
  console.log('📊 Analyzing system behavior under extreme load...');
}

export function handleSummary(data) {
  const summary = {
    test_type: 'STRESS_TEST',
    timestamp: new Date().toISOString(),
    test_duration: data.state.testRunDurationMs,
    max_concurrent_users: Math.max(...Object.values(data.metrics.vus?.values || {})),
    
    // Request statistics
    total_requests: data.metrics.http_reqs?.count || 0,
    failed_requests: data.metrics.http_req_failed?.count || 0,
    error_rate: ((data.metrics.http_req_failed?.rate || 0) * 100).toFixed(2) + '%',
    
    // Performance under stress
    response_times: {
      avg: (data.metrics.http_req_duration?.avg || 0).toFixed(2) + 'ms',
      p50: (data.metrics.http_req_duration?.['p(50)'] || 0).toFixed(2) + 'ms',
      p95: (data.metrics.http_req_duration?.['p(95)'] || 0).toFixed(2) + 'ms',
      p99: (data.metrics.http_req_duration?.['p(99)'] || 0).toFixed(2) + 'ms',
      max: (data.metrics.http_req_duration?.max || 0).toFixed(2) + 'ms'
    },
    
    // Throughput under stress
    throughput: {
      avg_rps: (data.metrics.http_reqs?.rate || 0).toFixed(2),
      peak_rps: Math.max(...Object.values(data.metrics.http_reqs?.values || {})).toFixed(2)
    },
    
    // System stress indicators
    stress_indicators: {
      timeouts: data.metrics.http_req_timeout?.count || 0,
      connection_errors: data.metrics.http_req_connecting?.count || 0,
      dns_errors: data.metrics.http_req_looking_up?.count || 0,
      tls_errors: data.metrics.http_req_tls_handshaking?.count || 0
    },
    
    // Breaking point analysis
    breaking_point_analysis: {
      system_survived: (data.metrics.http_req_failed?.rate || 0) < 0.5, // Less than 50% failure
      graceful_degradation: (data.metrics.http_req_duration?.['p(95)'] || 0) < 30000, // P95 under 30s
      health_check_stable: (data.metrics['http_req_failed{name:health_check}']?.rate || 0) < 0.2
    },
    
    // Data transfer under stress
    data_transfer: {
      received_mb: ((data.metrics.data_received?.count || 0) / 1024 / 1024).toFixed(2),
      sent_kb: ((data.metrics.data_sent?.count || 0) / 1024).toFixed(2)
    },
    
    // Recommendations
    recommendations: generateStressRecommendations(data)
  };
  
  return {
    'stress-test-results.json': JSON.stringify(summary, null, 2),
    stdout: `
🔥 STRESS TEST RESULTS
=====================
Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(0)}s
Max Concurrent Users: ${summary.max_concurrent_users}
Total Requests: ${summary.total_requests}
Failed Requests: ${summary.failed_requests}
Error Rate: ${summary.error_rate}

PERFORMANCE UNDER STRESS:
Average Response Time: ${summary.response_times.avg}
95th Percentile: ${summary.response_times.p95}
99th Percentile: ${summary.response_times.p99}
Maximum: ${summary.response_times.max}

THROUGHPUT:
Average RPS: ${summary.throughput.avg_rps}
Peak RPS: ${summary.throughput.peak_rps}

SYSTEM STRESS INDICATORS:
Timeouts: ${summary.stress_indicators.timeouts}
Connection Errors: ${summary.stress_indicators.connection_errors}
DNS Errors: ${summary.stress_indicators.dns_errors}
TLS Errors: ${summary.stress_indicators.tls_errors}

BREAKING POINT ANALYSIS:
System Survived: ${summary.breaking_point_analysis.system_survived ? '✅ YES' : '❌ NO'}
Graceful Degradation: ${summary.breaking_point_analysis.graceful_degradation ? '✅ YES' : '❌ NO'}
Health Check Stable: ${summary.breaking_point_analysis.health_check_stable ? '✅ YES' : '❌ NO'}

DATA TRANSFER:
Received: ${summary.data_transfer.received_mb} MB
Sent: ${summary.data_transfer.sent_kb} KB

RECOMMENDATIONS:
${summary.recommendations.join('\n')}
`
  };
}

function generateStressRecommendations(data) {
  const recommendations = [];
  const errorRate = data.metrics.http_req_failed?.rate || 0;
  const p95ResponseTime = data.metrics.http_req_duration?.['p(95)'] || 0;
  const maxUsers = Math.max(...Object.values(data.metrics.vus?.values || {}));
  
  if (errorRate > 0.1) {
    recommendations.push('• High error rate detected - consider implementing circuit breakers');
  }
  
  if (p95ResponseTime > 5000) {
    recommendations.push('• Slow response times under load - optimize database queries and add caching');
  }
  
  if (maxUsers < 500) {
    recommendations.push('• System struggled with concurrent users - consider horizontal scaling');
  }
  
  if (data.metrics.http_req_timeout?.count > 0) {
    recommendations.push('• Timeouts detected - increase server timeout limits or optimize slow endpoints');
  }
  
  if (data.metrics.http_req_connecting?.count > 100) {
    recommendations.push('• Connection issues detected - review connection pooling and load balancer configuration');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('• System performed well under stress - consider testing with even higher loads');
  }
  
  return recommendations;
}

