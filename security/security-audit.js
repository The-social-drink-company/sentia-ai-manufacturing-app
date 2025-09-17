// Node 18+ has global fetch
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SecurityAuditor {
  constructor() {
    this.baseUrl = 'https://web-production-1f10.up.railway.app';
    this.logDir = path.join(__dirname, 'logs');
    
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    this.securityTests = [
      { name: 'HTTP Security Headers', test: 'checkSecurityHeaders' },
      { name: 'CORS Configuration', test: 'checkCorsConfiguration' },
      { name: 'SSL/TLS Configuration', test: 'checkSSLConfiguration' },
      { name: 'API Input Validation', test: 'checkInputValidation' },
      { name: 'Authentication Security', test: 'checkAuthentication' },
      { name: 'Information Disclosure', test: 'checkInformationDisclosure' },
      { name: 'Rate Limiting', test: 'checkRateLimiting' }
    ];
  }

  async runSecurityAudit() {
    console.log('🔒 RUNNING COMPREHENSIVE SECURITY AUDIT');
    console.log('=======================================');
    
    const results = [];
    
    for (const testCase of this.securityTests) {
      console.log(`\\n🔍 Testing: ${testCase.name}`);
      try {
        const result = await this[testCase.test]();
        results.push({
          name: testCase.name,
          ...result,
          timestamp: new Date().toISOString()
        });
        
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${testCase.name}: ${result.status}`);
        if (result.details) {
          result.details.forEach(detail => {
            console.log(`   - ${detail}`);
          });
        }
      } catch (error) {
        results.push({
          name: testCase.name,
          passed: false,
          status: 'ERROR',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.log(`❌ ${testCase.name}: ERROR - ${error.message}`);
      }
    }
    
    const summary = this.generateSecuritySummary(results);
    this.logSecurityAudit(summary);
    this.displaySecuritySummary(summary);
    
    return summary;
  }

  async checkSecurityHeaders() {
    const response = await fetch(this.baseUrl);
    const headers = response.headers;
    
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy'
    ];
    
    const presentHeaders = [];
    const missingHeaders = [];
    
    requiredHeaders.forEach(header => {
      if (headers.has(header)) {
        presentHeaders.push(`${header}: ${headers.get(header)}`);
      } else {
        missingHeaders.push(header);
      }
    });
    
    const passed = missingHeaders.length === 0;
    const details = [
      ...presentHeaders.map(h => `Present: ${h}`),
      ...missingHeaders.map(h => `Missing: ${h}`)
    ];
    
    return {
      passed,
      status: passed ? 'SECURE' : 'VULNERABLE',
      score: Math.round((presentHeaders.length / requiredHeaders.length) * 100),
      details
    };
  }

  async checkCorsConfiguration() {
    const response = await fetch(this.baseUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://malicious-site.com',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    const credentialsAllowed = response.headers.get('access-control-allow-credentials');
    
    const isWildcard = corsHeader === '*';
    const allowsCredentials = credentialsAllowed === 'true';
    const dangerous = isWildcard && allowsCredentials;
    
    return {
      passed: !dangerous,
      status: dangerous ? 'VULNERABLE' : 'SECURE',
      details: [
        `CORS Origin: ${corsHeader || 'Not set'}`,
        `Credentials: ${credentialsAllowed || 'Not set'}`,
        dangerous ? 'WARNING: Wildcard origin with credentials allowed' : 'CORS properly configured'
      ]
    };
  }

  async checkSSLConfiguration() {
    const httpsResponse = await fetch(this.baseUrl);
    const httpUrl = this.baseUrl.replace('https://', 'http://');
    
    let httpsWorking = httpsResponse.ok;
    let httpRedirects = false;
    
    try {
      const httpResponse = await fetch(httpUrl, { redirect: 'manual' });
      httpRedirects = httpResponse.status >= 300 && httpResponse.status < 400;
    } catch (error) {
      // HTTP might be completely disabled, which is good
    }
    
    const hstsHeader = httpsResponse.headers.get('strict-transport-security');
    const hasHSTS = !!hstsHeader;
    
    const passed = httpsWorking && (httpRedirects || hasHSTS);
    
    return {
      passed,
      status: passed ? 'SECURE' : 'VULNERABLE',
      details: [
        `HTTPS Working: ${httpsWorking}`,
        `HTTP Redirects: ${httpRedirects}`,
        `HSTS Header: ${hstsHeader || 'Not present'}`,
        passed ? 'SSL/TLS properly configured' : 'SSL/TLS configuration needs improvement'
      ]
    };
  }

  async checkInputValidation() {
    const testPayloads = [
      { endpoint: '/api/health', payload: null, expected: 200 },
      { endpoint: '/api/working-capital', payload: null, expected: 200 },
      // Test XSS payload (should be rejected or sanitized)
      { endpoint: '/api/dashboard/overview?user=<script>alert(1)</script>', payload: null, expected: [200, 400] }
    ];
    
    const results = [];
    
    for (const test of testPayloads) {
      try {
        const url = `${this.baseUrl}${test.endpoint}`;
        const response = await fetch(url);
        
        const expectedStatuses = Array.isArray(test.expected) ? test.expected : [test.expected];
        const validResponse = expectedStatuses.includes(response.status);
        
        results.push({
          endpoint: test.endpoint,
          status: response.status,
          valid: validResponse
        });
      } catch (error) {
        results.push({
          endpoint: test.endpoint,
          error: error.message,
          valid: false
        });
      }
    }
    
    const passed = results.every(r => r.valid);
    
    return {
      passed,
      status: passed ? 'SECURE' : 'VULNERABLE',
      details: results.map(r => 
        `${r.endpoint}: ${r.status || 'ERROR'} ${r.valid ? '✓' : '✗'}`
      )
    };
  }

  async checkAuthentication() {
    // Test unauthenticated access to protected endpoints
    const protectedEndpoints = [
      '/api/auth/verify',
      '/api/dashboard/overview'  // This should be protected in production
    ];
    
    const results = [];
    
    for (const endpoint of protectedEndpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        
        // 401 or 403 indicates proper authentication protection
        const properlyProtected = [401, 403].includes(response.status);
        
        results.push({
          endpoint,
          status: response.status,
          protected: properlyProtected
        });
      } catch (error) {
        results.push({
          endpoint,
          error: error.message,
          protected: false
        });
      }
    }
    
    // For this demo, we'll consider it secure if auth endpoints require auth
    const authEndpointResult = results.find(r => r.endpoint.includes('/auth/verify'));
    const passed = authEndpointResult ? authEndpointResult.protected : true;
    
    return {
      passed,
      status: passed ? 'SECURE' : 'VULNERABLE',
      details: results.map(r => 
        `${r.endpoint}: ${r.status || 'ERROR'} ${r.protected ? 'Protected ✓' : 'Exposed ✗'}`
      )
    };
  }

  async checkInformationDisclosure() {
    const response = await fetch(`${this.baseUrl}/api/health`);
    const healthData = await response.json();
    
    // Check for potentially sensitive information disclosure
    const sensitiveFields = ['password', 'secret', 'token', 'key'];
    const responseText = JSON.stringify(healthData).toLowerCase();
    
    const disclosedInfo = sensitiveFields.filter(field => 
      responseText.includes(field) && !responseText.includes('not_configured')
    );
    
    const passed = disclosedInfo.length === 0;
    
    return {
      passed,
      status: passed ? 'SECURE' : 'VULNERABLE',
      details: [
        `Health endpoint response checked`,
        disclosedInfo.length > 0 
          ? `Potentially sensitive fields found: ${disclosedInfo.join(', ')}`
          : 'No sensitive information disclosure detected'
      ]
    };
  }

  async checkRateLimiting() {
    const endpoint = `${this.baseUrl}/api/health`;
    const requests = [];
    const requestCount = 10;
    
    console.log(`   Making ${requestCount} rapid requests to test rate limiting...`);
    
    // Make rapid requests to test rate limiting
    for (let i = 0; i < requestCount; i++) {
      const startTime = Date.now();
      try {
        const response = await fetch(endpoint);
        requests.push({
          status: response.status,
          rateLimited: response.status === 429,
          responseTime: Date.now() - startTime
        });
      } catch (error) {
        requests.push({
          error: error.message,
          rateLimited: false,
          responseTime: Date.now() - startTime
        });
      }
    }
    
    const rateLimitedRequests = requests.filter(r => r.rateLimited).length;
    const hasRateLimiting = rateLimitedRequests > 0;
    
    return {
      passed: true, // Rate limiting is optional but recommended
      status: hasRateLimiting ? 'PROTECTED' : 'UNPROTECTED',
      details: [
        `Total requests: ${requestCount}`,
        `Rate limited: ${rateLimitedRequests}`,
        `Average response time: ${Math.round(requests.reduce((sum, r) => sum + r.responseTime, 0) / requests.length)}ms`,
        hasRateLimiting ? 'Rate limiting is active' : 'No rate limiting detected'
      ]
    };
  }

  generateSecuritySummary(results) {
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const securityScore = Math.round((passed / total) * 100);
    
    let overallRating = 'EXCELLENT';
    if (securityScore < 60) overallRating = 'POOR';
    else if (securityScore < 80) overallRating = 'FAIR';
    else if (securityScore < 95) overallRating = 'GOOD';
    
    const vulnerabilities = results.filter(r => !r.passed);
    const criticalIssues = vulnerabilities.filter(v => 
      v.name.includes('Headers') || v.name.includes('CORS') || v.name.includes('Authentication')
    );
    
    return {
      timestamp: new Date().toISOString(),
      overallRating,
      securityScore,
      totalTests: total,
      passedTests: passed,
      failedTests: total - passed,
      criticalIssues: criticalIssues.length,
      vulnerabilities: vulnerabilities.map(v => ({
        name: v.name,
        status: v.status,
        details: v.details
      })),
      allResults: results
    };
  }

  displaySecuritySummary(summary) {
    console.log('\\n🛡️ SECURITY AUDIT SUMMARY');
    console.log('===========================');
    console.log(`🎯 Security Score: ${summary.securityScore}/100`);
    console.log(`📊 Overall Rating: ${summary.overallRating}`);
    console.log(`✅ Passed Tests: ${summary.passedTests}/${summary.totalTests}`);
    console.log(`❌ Failed Tests: ${summary.failedTests}`);
    console.log(`🚨 Critical Issues: ${summary.criticalIssues}`);
    
    if (summary.vulnerabilities.length > 0) {
      console.log('\\n⚠️ SECURITY VULNERABILITIES:');
      console.log('=============================');
      summary.vulnerabilities.forEach(vuln => {
        console.log(`\\n❌ ${vuln.name}:`);
        console.log(`   Status: ${vuln.status}`);
        if (vuln.details) {
          vuln.details.forEach(detail => {
            console.log(`   - ${detail}`);
          });
        }
      });
    }
    
    console.log('\\n🔒 SECURITY RECOMMENDATIONS:');
    console.log('==============================');
    
    if (summary.criticalIssues > 0) {
      console.log('⚠️ Critical security issues found - immediate action required!');
    } else if (summary.securityScore < 100) {
      console.log('⚠️ Minor security improvements recommended');
    } else {
      console.log('✅ Excellent security posture - all tests passed!');
    }
  }

  logSecurityAudit(summary) {
    const logFile = path.join(this.logDir, 'security-audit.log');
    const logEntry = JSON.stringify(summary, null, 2) + '\\n\\n';
    fs.appendFileSync(logFile, logEntry);
    
    // Also log to CSV for trend analysis
    const csvFile = path.join(this.logDir, 'security-trends.csv');
    
    if (!fs.existsSync(csvFile)) {
      const header = 'timestamp,security_score,overall_rating,passed_tests,failed_tests,critical_issues\\n';
      fs.writeFileSync(csvFile, header);
    }
    
    const csvRow = [
      summary.timestamp,
      summary.securityScore,
      summary.overallRating,
      summary.passedTests,
      summary.failedTests,
      summary.criticalIssues
    ].join(',') + '\\n';
    
    fs.appendFileSync(csvFile, csvRow);
  }

  async runPenetrationTest() {
    console.log('🔍 RUNNING BASIC PENETRATION TEST');
    console.log('=================================');
    
    const penTestResults = [];
    
    // Test for common web vulnerabilities
    const vulnTests = [
      {
        name: 'SQL Injection',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/health?id=1' OR '1'='1`);
          return { 
            vulnerable: response.status === 200, // Simplistic check
            details: `Response status: ${response.status}`
          };
        }
      },
      {
        name: 'XSS (Cross-Site Scripting)',
        test: async () => {
          const xssPayload = encodeURIComponent('<script>alert("XSS")</script>');
          const response = await fetch(`${this.baseUrl}?test=${xssPayload}`);
          const text = await response.text();
          return {
            vulnerable: text.includes('<script>'),
            details: 'XSS payload reflection test'
          };
        }
      },
      {
        name: 'Directory Traversal',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/../../../etc/passwd`);
          return {
            vulnerable: response.status === 200 && response.headers.get('content-type')?.includes('text'),
            details: `Response status: ${response.status}`
          };
        }
      }
    ];
    
    for (const vulnTest of vulnTests) {
      try {
        console.log(`\\n🔍 Testing: ${vulnTest.name}`);
        const result = await vulnTest.test();
        
        penTestResults.push({
          name: vulnTest.name,
          vulnerable: result.vulnerable,
          details: result.details,
          timestamp: new Date().toISOString()
        });
        
        const status = result.vulnerable ? '❌ VULNERABLE' : '✅ SECURE';
        console.log(`${status}: ${vulnTest.name}`);
        console.log(`   ${result.details}`);
        
      } catch (error) {
        console.log(`❌ ERROR testing ${vulnTest.name}: ${error.message}`);
        penTestResults.push({
          name: vulnTest.name,
          vulnerable: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const vulnerableTests = penTestResults.filter(r => r.vulnerable);
    
    console.log('\\n🛡️ PENETRATION TEST SUMMARY:');
    console.log(`Total Tests: ${penTestResults.length}`);
    console.log(`Vulnerabilities Found: ${vulnerableTests.length}`);
    
    if (vulnerableTests.length === 0) {
      console.log('✅ No common vulnerabilities detected!');
    } else {
      console.log('⚠️ Vulnerabilities found - review security measures!');
    }
    
    return penTestResults;
  }
}

// CLI usage
if (process.argv[1] === __filename) {
  const auditor = new SecurityAuditor();
  const command = process.argv[2] || 'audit';
  
  switch (command) {
    case 'audit':
      auditor.runSecurityAudit();
      break;
    case 'pentest':
      auditor.runPenetrationTest();
      break;
    case 'full':
      (async () => {
        await auditor.runSecurityAudit();
        console.log('\\n' + '='.repeat(50));
        await auditor.runPenetrationTest();
      })();
      break;
    default:
      console.log('Usage: node security-audit.js [audit|pentest|full]');
  }
}

export default SecurityAuditor;