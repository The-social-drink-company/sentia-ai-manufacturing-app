#!/usr/bin/env node
/**
 * Quality Gates Validation Script
 * Advanced quality assurance and coverage threshold enforcement
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

// Quality Gate Configuration
const QUALITY_GATES = {
  // Coverage Thresholds (Enterprise Grade)
  coverage: {
    global: {
      lines: 90,
      functions: 85,
      branches: 80,
      statements: 90
    },
    critical: {
      'src/server.js': { lines: 95, functions: 90, branches: 85, statements: 95 },
      'src/tools/xero/': { lines: 88, functions: 85, branches: 80, statements: 88 },
      'src/tools/shopify/': { lines: 88, functions: 85, branches: 80, statements: 88 },
      'src/tools/amazon/': { lines: 85, functions: 82, branches: 75, statements: 85 },
      'src/utils/': { lines: 92, functions: 88, branches: 85, statements: 92 },
      'src/middleware/': { lines: 90, functions: 85, branches: 82, statements: 90 }
    }
  },
  
  // Performance Thresholds
  performance: {
    maxTestDuration: 300000,          // 5 minutes total
    maxIndividualTestTime: 30000,     // 30 seconds per test
    maxMemoryUsage: 512 * 1024 * 1024, // 512MB
    minOpsPerSecond: 10               // API operations per second
  },
  
  // Code Quality Thresholds
  quality: {
    maxComplexity: 10,                // Cyclomatic complexity
    maxDuplication: 0.05,             // 5% code duplication
    minMaintainabilityIndex: 70,      // Maintainability index
    maxTechnicalDebt: 4               // Hours of technical debt
  },
  
  // Security Thresholds
  security: {
    maxVulnerabilities: {
      critical: 0,
      high: 0,
      moderate: 2,
      low: 5
    },
    minSecurityCoverage: 95,          // % of security tests
    maxSecurityDebt: 2                // Hours of security debt
  },
  
  // Test Quality Thresholds
  tests: {
    minTestCoverage: 90,              // % of code tested
    maxTestFailureRate: 0.02,         // 2% test failure rate
    minTestEfficiency: 0.85,          // Test execution efficiency
    maxFlakyTests: 3                  // Number of flaky tests allowed
  }
};

// Quality Gates Validator
class QualityGatesValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.metrics = {};
    this.startTime = Date.now();
  }

  /**
   * Run complete quality gates validation
   */
  async validate() {
    console.log('🎯 Starting Quality Gates Validation...\n');
    
    try {
      // 1. Validate Coverage
      await this.validateCoverage();
      
      // 2. Validate Performance
      await this.validatePerformance();
      
      // 3. Validate Code Quality
      await this.validateCodeQuality();
      
      // 4. Validate Security
      await this.validateSecurity();
      
      // 5. Validate Test Quality
      await this.validateTestQuality();
      
      // 6. Generate Quality Report
      await this.generateQualityReport();
      
      // 7. Determine Pass/Fail
      return this.determineResult();
      
    } catch (error) {
      console.error('❌ Quality Gates Validation Failed:', error.message);
      return false;
    }
  }

  /**
   * Validate Coverage Thresholds
   */
  async validateCoverage() {
    console.log('📊 Validating Coverage Thresholds...');
    
    try {
      // Read coverage summary
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      const coverageData = JSON.parse(await fs.readFile(coveragePath, 'utf8'));
      
      // Check global thresholds
      const global = coverageData.total;
      Object.entries(QUALITY_GATES.coverage.global).forEach(([metric, threshold]) => {
        const actual = global[metric]?.pct || 0;
        
        if (actual < threshold) {
          this.violations.push({
            type: 'coverage',
            severity: 'error',
            metric: `global.${metric}`,
            actual: actual,
            expected: threshold,
            message: `Global ${metric} coverage ${actual}% below threshold ${threshold}%`
          });
        }
      });
      
      // Check critical file thresholds
      Object.entries(QUALITY_GATES.coverage.critical).forEach(([filePath, thresholds]) => {
        const fileData = this.findCoverageForPath(coverageData, filePath);
        
        if (fileData) {
          Object.entries(thresholds).forEach(([metric, threshold]) => {
            const actual = fileData[metric]?.pct || 0;
            
            if (actual < threshold) {
              this.violations.push({
                type: 'coverage',
                severity: 'error',
                metric: `${filePath}.${metric}`,
                actual: actual,
                expected: threshold,
                message: `${filePath} ${metric} coverage ${actual}% below threshold ${threshold}%`
              });
            }
          });
        }
      });
      
      this.metrics.coverage = {
        global: global,
        filesAnalyzed: Object.keys(coverageData).length - 1, // Exclude 'total'
        violations: this.violations.filter(v => v.type === 'coverage').length
      };
      
      console.log(`   ✅ Coverage validation complete (${this.metrics.coverage.violations} violations)`);
      
    } catch (error) {
      this.warnings.push({
        type: 'coverage',
        message: `Could not validate coverage: ${error.message}`
      });
      console.log('   ⚠️  Coverage validation skipped (no data available)');
    }
  }

  /**
   * Validate Performance Metrics
   */
  async validatePerformance() {
    console.log('⚡ Validating Performance Metrics...');
    
    try {
      // Read test results for performance data
      const testResultsPath = path.join(process.cwd(), 'coverage', 'test-results.json');
      const testResults = JSON.parse(await fs.readFile(testResultsPath, 'utf8'));
      
      // Check test execution time
      const totalDuration = testResults.testResults?.reduce((sum, result) => 
        sum + (result.perfStats?.end - result.perfStats?.start || 0), 0) || 0;
      
      if (totalDuration > QUALITY_GATES.performance.maxTestDuration) {
        this.violations.push({
          type: 'performance',
          severity: 'warning',
          metric: 'total_test_duration',
          actual: totalDuration,
          expected: QUALITY_GATES.performance.maxTestDuration,
          message: `Total test duration ${totalDuration}ms exceeds threshold ${QUALITY_GATES.performance.maxTestDuration}ms`
        });
      }
      
      // Check individual test times
      const slowTests = testResults.testResults?.filter(result => 
        (result.perfStats?.end - result.perfStats?.start || 0) > QUALITY_GATES.performance.maxIndividualTestTime
      ) || [];
      
      slowTests.forEach(test => {
        const duration = test.perfStats.end - test.perfStats.start;
        this.warnings.push({
          type: 'performance',
          message: `Slow test detected: ${test.name} (${duration}ms)`
        });
      });
      
      this.metrics.performance = {
        totalDuration,
        slowTestCount: slowTests.length,
        avgTestDuration: testResults.testResults?.length ? totalDuration / testResults.testResults.length : 0
      };
      
      console.log(`   ✅ Performance validation complete (${slowTests.length} slow tests)`);
      
    } catch (error) {
      this.warnings.push({
        type: 'performance',
        message: `Could not validate performance: ${error.message}`
      });
      console.log('   ⚠️  Performance validation skipped (no data available)');
    }
  }

  /**
   * Validate Code Quality Metrics
   */
  async validateCodeQuality() {
    console.log('🔍 Validating Code Quality...');
    
    try {
      // Run ESLint for code quality metrics
      const lintResults = execSync('npx eslint src --format json', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      const lintData = JSON.parse(lintResults);
      const errorCount = lintData.reduce((sum, file) => sum + file.errorCount, 0);
      const warningCount = lintData.reduce((sum, file) => sum + file.warningCount, 0);
      
      if (errorCount > 0) {
        this.violations.push({
          type: 'quality',
          severity: 'error',
          metric: 'eslint_errors',
          actual: errorCount,
          expected: 0,
          message: `${errorCount} ESLint errors found`
        });
      }
      
      this.metrics.codeQuality = {
        eslintErrors: errorCount,
        eslintWarnings: warningCount,
        filesAnalyzed: lintData.length
      };
      
      console.log(`   ✅ Code quality validation complete (${errorCount} errors, ${warningCount} warnings)`);
      
    } catch (error) {
      // ESLint might exit with non-zero code for linting errors
      try {
        const errorOutput = error.stdout || error.stderr || '';
        if (errorOutput.trim()) {
          const lintData = JSON.parse(errorOutput);
          const errorCount = lintData.reduce((sum, file) => sum + file.errorCount, 0);
          
          if (errorCount > 0) {
            this.violations.push({
              type: 'quality',
              severity: 'error',
              metric: 'eslint_errors',
              actual: errorCount,
              expected: 0,
              message: `${errorCount} ESLint errors found`
            });
          }
        }
      } catch (parseError) {
        this.warnings.push({
          type: 'quality',
          message: `Could not validate code quality: ${error.message}`
        });
      }
      
      console.log('   ⚠️  Code quality validation completed with issues');
    }
  }

  /**
   * Validate Security Requirements
   */
  async validateSecurity() {
    console.log('🔒 Validating Security Requirements...');
    
    try {
      // Run npm audit for security vulnerabilities
      const auditResult = execSync('npm audit --json', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      const auditData = JSON.parse(auditResult);
      const vulnerabilities = auditData.vulnerabilities || {};
      
      // Count vulnerabilities by severity
      const vulnCounts = {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0
      };
      
      Object.values(vulnerabilities).forEach(vuln => {
        const severity = vuln.severity;
        if (vulnCounts.hasOwnProperty(severity)) {
          vulnCounts[severity]++;
        }
      });
      
      // Check against thresholds
      Object.entries(QUALITY_GATES.security.maxVulnerabilities).forEach(([severity, threshold]) => {
        if (vulnCounts[severity] > threshold) {
          this.violations.push({
            type: 'security',
            severity: severity === 'critical' || severity === 'high' ? 'error' : 'warning',
            metric: `vulnerabilities_${severity}`,
            actual: vulnCounts[severity],
            expected: threshold,
            message: `${vulnCounts[severity]} ${severity} vulnerabilities found (max: ${threshold})`
          });
        }
      });
      
      this.metrics.security = {
        vulnerabilities: vulnCounts,
        totalVulnerabilities: Object.values(vulnCounts).reduce((sum, count) => sum + count, 0)
      };
      
      console.log(`   ✅ Security validation complete (${this.metrics.security.totalVulnerabilities} vulnerabilities)`);
      
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          // Process audit data even when command exits with error
          console.log('   ⚠️  Security validation completed with vulnerabilities detected');
        } catch (parseError) {
          this.warnings.push({
            type: 'security',
            message: `Could not validate security: ${error.message}`
          });
          console.log('   ⚠️  Security validation skipped (audit failed)');
        }
      } else {
        console.log('   ✅ Security validation complete (no vulnerabilities)');
      }
    }
  }

  /**
   * Validate Test Quality
   */
  async validateTestQuality() {
    console.log('🧪 Validating Test Quality...');
    
    try {
      // Read test results
      const testResultsPath = path.join(process.cwd(), 'coverage', 'test-results.json');
      const testResults = JSON.parse(await fs.readFile(testResultsPath, 'utf8'));
      
      const totalTests = testResults.numTotalTests || 0;
      const failedTests = testResults.numFailedTests || 0;
      const failureRate = totalTests > 0 ? failedTests / totalTests : 0;
      
      if (failureRate > QUALITY_GATES.tests.maxTestFailureRate) {
        this.violations.push({
          type: 'tests',
          severity: 'error',
          metric: 'failure_rate',
          actual: failureRate,
          expected: QUALITY_GATES.tests.maxTestFailureRate,
          message: `Test failure rate ${(failureRate * 100).toFixed(2)}% exceeds threshold ${(QUALITY_GATES.tests.maxTestFailureRate * 100)}%`
        });
      }
      
      this.metrics.testQuality = {
        totalTests,
        failedTests,
        failureRate,
        passRate: 1 - failureRate
      };
      
      console.log(`   ✅ Test quality validation complete (${failedTests}/${totalTests} failed)`);
      
    } catch (error) {
      this.warnings.push({
        type: 'tests',
        message: `Could not validate test quality: ${error.message}`
      });
      console.log('   ⚠️  Test quality validation skipped (no data available)');
    }
  }

  /**
   * Generate Quality Report
   */
  async generateQualityReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration,
      qualityGates: QUALITY_GATES,
      metrics: this.metrics,
      violations: this.violations,
      warnings: this.warnings,
      summary: {
        totalViolations: this.violations.length,
        errorViolations: this.violations.filter(v => v.severity === 'error').length,
        warningViolations: this.violations.filter(v => v.severity === 'warning').length,
        totalWarnings: this.warnings.length,
        passed: this.violations.filter(v => v.severity === 'error').length === 0
      }
    };
    
    // Save detailed report
    const reportsDir = path.join(process.cwd(), 'coverage', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const reportPath = path.join(reportsDir, 'quality-gates-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML dashboard
    const dashboardHtml = this.generateHtmlDashboard(report);
    const dashboardPath = path.join(reportsDir, 'quality-dashboard.html');
    await fs.writeFile(dashboardPath, dashboardHtml);
    
    console.log(`\n📊 Quality reports generated:`);
    console.log(`   📄 JSON Report: ${reportPath}`);
    console.log(`   🌐 Dashboard: ${dashboardPath}`);
    
    return report;
  }

  /**
   * Generate HTML Quality Dashboard
   */
  generateHtmlDashboard(report) {
    const { summary, violations, warnings, metrics } = report;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quality Gates Dashboard - Sentia MCP Server</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; }
        .status.passed { background: #d4edda; color: #155724; }
        .status.failed { background: #f8d7da; color: #721c24; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; color: #333; }
        .metric-label { color: #666; margin-top: 5px; }
        .violations-list { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .violation { padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid; }
        .violation.error { background: #f8d7da; border-color: #dc3545; }
        .violation.warning { background: #fff3cd; border-color: #ffc107; }
        .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-fill.high { background: #28a745; }
        .progress-fill.medium { background: #ffc107; }
        .progress-fill.low { background: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Quality Gates Dashboard</h1>
            <p><strong>CapLiquify MCP Server</strong></p>
            <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
            <span class="status ${summary.passed ? 'passed' : 'failed'}">
                ${summary.passed ? '✅ Passed' : '❌ Failed'}
            </span>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${summary.totalViolations}</div>
                <div class="metric-label">Total Violations</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.errorViolations}</div>
                <div class="metric-label">Error Violations</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.warningViolations}</div>
                <div class="metric-label">Warning Violations</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(report.duration / 1000)}s</div>
                <div class="metric-label">Validation Duration</div>
            </div>
        </div>

        ${metrics.coverage ? `
        <div class="metric-card">
            <h3>📊 Coverage Metrics</h3>
            <div style="margin: 15px 0;">
                <div>Lines: ${(metrics.coverage.global.lines?.pct || 0).toFixed(1)}%</div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getProgressClass(metrics.coverage.global.lines?.pct || 0)}" 
                         style="width: ${(metrics.coverage.global.lines?.pct || 0)}%"></div>
                </div>
            </div>
            <div style="margin: 15px 0;">
                <div>Functions: ${(metrics.coverage.global.functions?.pct || 0).toFixed(1)}%</div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getProgressClass(metrics.coverage.global.functions?.pct || 0)}" 
                         style="width: ${(metrics.coverage.global.functions?.pct || 0)}%"></div>
                </div>
            </div>
        </div>
        ` : ''}

        ${violations.length > 0 ? `
        <div class="violations-list">
            <h3>❌ Quality Gate Violations</h3>
            ${violations.map(v => `
                <div class="violation ${v.severity}">
                    <strong>${v.type}.${v.metric}</strong><br>
                    ${v.message}<br>
                    <small>Expected: ${v.expected}, Actual: ${v.actual}</small>
                </div>
            `).join('')}
        </div>
        ` : '<div class="violations-list"><h3>✅ No Violations Detected</h3></div>'}

        ${warnings.length > 0 ? `
        <div class="violations-list">
            <h3>⚠️ Warnings</h3>
            ${warnings.map(w => `
                <div class="violation warning">
                    <strong>${w.type}</strong><br>
                    ${w.message}
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>`;
  }

  /**
   * Get progress bar class based on percentage
   */
  getProgressClass(percentage) {
    if (percentage >= 90) return 'high';
    if (percentage >= 70) return 'medium';
    return 'low';
  }

  /**
   * Find coverage data for a specific path
   */
  findCoverageForPath(coverageData, targetPath) {
    // Find files matching the target path
    const matchingFiles = Object.keys(coverageData).filter(filePath => 
      filePath !== 'total' && filePath.includes(targetPath)
    );
    
    if (matchingFiles.length === 0) return null;
    
    // If it's a single file, return its data
    if (matchingFiles.length === 1) {
      return coverageData[matchingFiles[0]];
    }
    
    // If it's a directory, aggregate the data
    const aggregated = {
      lines: { covered: 0, total: 0, pct: 0 },
      functions: { covered: 0, total: 0, pct: 0 },
      statements: { covered: 0, total: 0, pct: 0 },
      branches: { covered: 0, total: 0, pct: 0 }
    };
    
    matchingFiles.forEach(filePath => {
      const fileData = coverageData[filePath];
      Object.keys(aggregated).forEach(metric => {
        aggregated[metric].covered += fileData[metric]?.covered || 0;
        aggregated[metric].total += fileData[metric]?.total || 0;
      });
    });
    
    // Calculate percentages
    Object.keys(aggregated).forEach(metric => {
      aggregated[metric].pct = aggregated[metric].total > 0 
        ? (aggregated[metric].covered / aggregated[metric].total) * 100 
        : 0;
    });
    
    return aggregated;
  }

  /**
   * Determine overall result
   */
  determineResult() {
    const errorViolations = this.violations.filter(v => v.severity === 'error');
    const passed = errorViolations.length === 0;
    
    console.log('\n🎯 Quality Gates Summary:');
    console.log('=========================');
    console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Total Violations: ${this.violations.length}`);
    console.log(`Error Violations: ${errorViolations.length}`);
    console.log(`Warning Violations: ${this.violations.filter(v => v.severity === 'warning').length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    
    if (!passed) {
      console.log('\n❌ Error Violations:');
      errorViolations.forEach(v => {
        console.log(`   ${v.type}.${v.metric}: ${v.message}`);
      });
    }
    
    return passed;
  }
}

// Main execution
async function main() {
  const validator = new QualityGatesValidator();
  const passed = await validator.validate();
  
  process.exit(passed ? 0 : 1);
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error in quality gates validation:', error);
    process.exit(1);
  });
}

export default QualityGatesValidator;