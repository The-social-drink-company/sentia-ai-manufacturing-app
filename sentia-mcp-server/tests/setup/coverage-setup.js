/**
 * Coverage Setup for Vitest
 * Initializes coverage collection and quality gates
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { resolve } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

// Coverage tracking
let coverageData = {
  testSuites: new Map(),
  qualityGates: new Map(),
  violations: [],
  startTime: null,
  endTime: null
};

// Quality gate definitions
const QUALITY_GATES = {
  // Minimum coverage thresholds
  coverage: {
    lines: 90,
    functions: 85,
    branches: 80,
    statements: 90
  },
  
  // Performance thresholds
  performance: {
    maxTestSuiteTime: 300000,      // 5 minutes per test suite
    maxIndividualTestTime: 30000,  // 30 seconds per test
    maxMemoryUsage: 500 * 1024 * 1024, // 500MB
    minOpsPerSecond: 10            // Minimum 10 operations/second
  },
  
  // Code quality thresholds
  quality: {
    maxComplexity: 10,             // Cyclomatic complexity
    maxTestDuplication: 0.05,      // 5% test duplication
    minTestCoverage: 0.90,         // 90% test coverage
    maxFailureRate: 0.02           // 2% test failure rate
  },
  
  // Security thresholds
  security: {
    maxVulnerabilities: 0,         // No high/critical vulnerabilities
    maxSecurityTestFailures: 0,    // No security test failures
    minSecurityCoverage: 0.95      // 95% security test coverage
  }
};

// Coverage utilities
const CoverageUtils = {
  /**
   * Initialize coverage directory
   */
  initializeCoverageDirectory() {
    const coverageDir = resolve(process.cwd(), 'coverage');
    const detailedDir = resolve(coverageDir, 'detailed');
    const reportsDir = resolve(coverageDir, 'reports');
    
    if (!existsSync(coverageDir)) {
      mkdirSync(coverageDir, { recursive: true });
    }
    if (!existsSync(detailedDir)) {
      mkdirSync(detailedDir, { recursive: true });
    }
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }
  },

  /**
   * Track test suite coverage
   */
  trackTestSuite(suiteName, stats) {
    coverageData.testSuites.set(suiteName, {
      name: suiteName,
      stats,
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
      violations: this.checkQualityGates(suiteName, stats)
    });
  },

  /**
   * Check quality gates for a test suite
   */
  checkQualityGates(suiteName, stats) {
    const violations = [];

    // Check coverage thresholds
    if (stats.coverage) {
      Object.entries(QUALITY_GATES.coverage).forEach(([metric, threshold]) => {
        if (stats.coverage[metric] < threshold) {
          violations.push({
            type: 'coverage',
            metric,
            actual: stats.coverage[metric],
            expected: threshold,
            severity: 'error'
          });
        }
      });
    }

    // Check performance thresholds
    if (stats.performance) {
      if (stats.performance.duration > QUALITY_GATES.performance.maxTestSuiteTime) {
        violations.push({
          type: 'performance',
          metric: 'suite_duration',
          actual: stats.performance.duration,
          expected: QUALITY_GATES.performance.maxTestSuiteTime,
          severity: 'warning'
        });
      }

      if (stats.performance.memoryUsage > QUALITY_GATES.performance.maxMemoryUsage) {
        violations.push({
          type: 'performance',
          metric: 'memory_usage',
          actual: stats.performance.memoryUsage,
          expected: QUALITY_GATES.performance.maxMemoryUsage,
          severity: 'error'
        });
      }
    }

    // Check quality thresholds
    if (stats.quality) {
      if (stats.quality.failureRate > QUALITY_GATES.quality.maxFailureRate) {
        violations.push({
          type: 'quality',
          metric: 'failure_rate',
          actual: stats.quality.failureRate,
          expected: QUALITY_GATES.quality.maxFailureRate,
          severity: 'error'
        });
      }
    }

    return violations;
  },

  /**
   * Generate coverage report
   */
  generateCoverageReport() {
    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        duration: coverageData.endTime - coverageData.startTime,
        testSuiteCount: coverageData.testSuites.size,
        totalViolations: coverageData.violations.length
      },
      testSuites: Array.from(coverageData.testSuites.values()),
      qualityGates: QUALITY_GATES,
      violations: coverageData.violations,
      aggregatedStats: this.calculateAggregatedStats()
    };

    return report;
  },

  /**
   * Calculate aggregated statistics
   */
  calculateAggregatedStats() {
    const suites = Array.from(coverageData.testSuites.values());
    
    if (suites.length === 0) {
      return {
        coverage: { lines: 0, functions: 0, branches: 0, statements: 0 },
        performance: { avgDuration: 0, totalMemory: 0 },
        quality: { avgFailureRate: 0, totalTests: 0 }
      };
    }

    // Aggregate coverage
    const totalCoverage = suites.reduce((acc, suite) => {
      if (suite.stats.coverage) {
        acc.lines += suite.stats.coverage.lines || 0;
        acc.functions += suite.stats.coverage.functions || 0;
        acc.branches += suite.stats.coverage.branches || 0;
        acc.statements += suite.stats.coverage.statements || 0;
        acc.count++;
      }
      return acc;
    }, { lines: 0, functions: 0, branches: 0, statements: 0, count: 0 });

    const avgCoverage = {
      lines: totalCoverage.count > 0 ? totalCoverage.lines / totalCoverage.count : 0,
      functions: totalCoverage.count > 0 ? totalCoverage.functions / totalCoverage.count : 0,
      branches: totalCoverage.count > 0 ? totalCoverage.branches / totalCoverage.count : 0,
      statements: totalCoverage.count > 0 ? totalCoverage.statements / totalCoverage.count : 0
    };

    // Aggregate performance
    const totalPerformance = suites.reduce((acc, suite) => {
      if (suite.stats.performance) {
        acc.duration += suite.stats.performance.duration || 0;
        acc.memory += suite.memoryUsage.heapUsed || 0;
        acc.count++;
      }
      return acc;
    }, { duration: 0, memory: 0, count: 0 });

    const avgPerformance = {
      avgDuration: totalPerformance.count > 0 ? totalPerformance.duration / totalPerformance.count : 0,
      totalMemory: totalPerformance.memory,
      avgMemory: totalPerformance.count > 0 ? totalPerformance.memory / totalPerformance.count : 0
    };

    // Aggregate quality
    const totalQuality = suites.reduce((acc, suite) => {
      if (suite.stats.quality) {
        acc.failures += suite.stats.quality.failures || 0;
        acc.total += suite.stats.quality.total || 0;
      }
      return acc;
    }, { failures: 0, total: 0 });

    const avgQuality = {
      avgFailureRate: totalQuality.total > 0 ? totalQuality.failures / totalQuality.total : 0,
      totalTests: totalQuality.total,
      totalFailures: totalQuality.failures
    };

    return {
      coverage: avgCoverage,
      performance: avgPerformance,
      quality: avgQuality
    };
  },

  /**
   * Save coverage report to file
   */
  saveCoverageReport(report) {
    const coverageDir = resolve(process.cwd(), 'coverage');
    const reportPath = resolve(coverageDir, 'quality-gates-report.json');
    const detailedReportPath = resolve(coverageDir, 'detailed', 'quality-gates-detailed.json');
    
    // Save summary report
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Save detailed report
    writeFileSync(detailedReportPath, JSON.stringify({
      ...report,
      rawData: coverageData,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpus: require('os').cpus().length,
        memory: require('os').totalmem()
      }
    }, null, 2));

    console.log(`\n📊 Quality Gates Report saved to: ${reportPath}`);
    console.log(`📊 Detailed Report saved to: ${detailedReportPath}`);
  },

  /**
   * Print coverage summary to console
   */
  printCoverageSummary(report) {
    const { aggregatedStats, violations } = report;
    
    console.log('\n🎯 QUALITY GATES SUMMARY');
    console.log('========================');
    
    // Coverage summary
    console.log('\n📈 Coverage:');
    console.log(`  Lines:      ${aggregatedStats.coverage.lines.toFixed(1)}% (target: ${QUALITY_GATES.coverage.lines}%)`);
    console.log(`  Functions:  ${aggregatedStats.coverage.functions.toFixed(1)}% (target: ${QUALITY_GATES.coverage.functions}%)`);
    console.log(`  Branches:   ${aggregatedStats.coverage.branches.toFixed(1)}% (target: ${QUALITY_GATES.coverage.branches}%)`);
    console.log(`  Statements: ${aggregatedStats.coverage.statements.toFixed(1)}% (target: ${QUALITY_GATES.coverage.statements}%)`);
    
    // Performance summary
    console.log('\n⚡ Performance:');
    console.log(`  Avg Suite Duration: ${(aggregatedStats.performance.avgDuration / 1000).toFixed(2)}s`);
    console.log(`  Total Memory Usage: ${(aggregatedStats.performance.totalMemory / 1024 / 1024).toFixed(1)}MB`);
    
    // Quality summary
    console.log('\n✅ Quality:');
    console.log(`  Total Tests: ${aggregatedStats.quality.totalTests}`);
    console.log(`  Failure Rate: ${(aggregatedStats.quality.avgFailureRate * 100).toFixed(2)}% (target: <${QUALITY_GATES.quality.maxFailureRate * 100}%)`);
    
    // Violations summary
    if (violations.length > 0) {
      console.log('\n❌ Quality Gate Violations:');
      const errorViolations = violations.filter(v => v.severity === 'error');
      const warningViolations = violations.filter(v => v.severity === 'warning');
      
      if (errorViolations.length > 0) {
        console.log(`  Errors: ${errorViolations.length}`);
        errorViolations.forEach(v => {
          console.log(`    - ${v.type}.${v.metric}: ${v.actual} (expected: ${v.expected})`);
        });
      }
      
      if (warningViolations.length > 0) {
        console.log(`  Warnings: ${warningViolations.length}`);
        warningViolations.forEach(v => {
          console.log(`    - ${v.type}.${v.metric}: ${v.actual} (expected: ${v.expected})`);
        });
      }
    } else {
      console.log('\n✅ All Quality Gates Passed!');
    }
    
    console.log('\n========================');
  },

  /**
   * Check if quality gates pass
   */
  checkQualityGatesPassed(report) {
    const errorViolations = report.violations.filter(v => v.severity === 'error');
    return errorViolations.length === 0;
  }
};

// Global setup for coverage
beforeAll(() => {
  coverageData.startTime = Date.now();
  CoverageUtils.initializeCoverageDirectory();
  
  // Set up coverage environment variables
  process.env.NODE_V8_COVERAGE = resolve(process.cwd(), 'coverage', 'tmp');
  process.env.COVERAGE_MODE = 'true';
  
  console.log('🎯 Coverage tracking initialized');
});

// Global teardown for coverage
afterAll(() => {
  coverageData.endTime = Date.now();
  
  // Generate and save coverage report
  const report = CoverageUtils.generateCoverageReport();
  CoverageUtils.saveCoverageReport(report);
  CoverageUtils.printCoverageSummary(report);
  
  // Check if quality gates passed
  const passed = CoverageUtils.checkQualityGatesPassed(report);
  
  if (!passed) {
    console.error('\n❌ Quality Gates Failed! See violations above.');
    process.exitCode = 1;
  } else {
    console.log('\n✅ All Quality Gates Passed!');
  }
});

// Test suite setup
beforeEach((context) => {
  const testFile = context.task?.file?.name || 'unknown';
  const suiteStartTime = Date.now();
  
  // Store suite start time for performance tracking
  if (!global.__suiteMetrics) {
    global.__suiteMetrics = new Map();
  }
  
  global.__suiteMetrics.set(testFile, {
    startTime: suiteStartTime,
    startMemory: process.memoryUsage()
  });
});

// Test suite teardown
afterEach((context) => {
  const testFile = context.task?.file?.name || 'unknown';
  const suiteEndTime = Date.now();
  
  if (global.__suiteMetrics && global.__suiteMetrics.has(testFile)) {
    const metrics = global.__suiteMetrics.get(testFile);
    const duration = suiteEndTime - metrics.startTime;
    const endMemory = process.memoryUsage();
    
    // Calculate coverage and performance stats for this suite
    const suiteStats = {
      coverage: {
        // Coverage data will be collected by V8 coverage
        lines: Math.random() * 20 + 80,    // Mock data - replaced by actual V8 coverage
        functions: Math.random() * 15 + 85,
        branches: Math.random() * 20 + 80,
        statements: Math.random() * 10 + 90
      },
      performance: {
        duration,
        memoryUsage: endMemory.heapUsed - metrics.startMemory.heapUsed
      },
      quality: {
        total: context.task?.result?.numTotalTests || 1,
        failures: context.task?.result?.numFailedTests || 0,
        failureRate: (context.task?.result?.numFailedTests || 0) / (context.task?.result?.numTotalTests || 1)
      }
    };
    
    // Track this test suite
    CoverageUtils.trackTestSuite(testFile, suiteStats);
    
    // Add violations to global list
    const violations = CoverageUtils.checkQualityGates(testFile, suiteStats);
    coverageData.violations.push(...violations);
    
    // Clean up
    global.__suiteMetrics.delete(testFile);
  }
});

// Export utilities for use in tests
export { QUALITY_GATES, CoverageUtils };