#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Enterprise Quality Gate Enforcement
 * 
 * This script enforces quality standards across the codebase including:
 * - Code coverage thresholds
 * - Security vulnerability checks
 * - Code quality metrics
 * - Performance benchmarks
 * - Documentation coverage
 */

class QualityGateEnforcer {
  constructor() {
    this.results = {
      coverage: null,
      security: null,
      quality: null,
      performance: null,
      documentation: null,
      overall: false
    };
    
    this.thresholds = {
      coverage: {
        lines: 85,
        branches: 80,
        functions: 80,
        statements: 85
      },
      security: {
        maxHighVulnerabilities: 0,
        maxMediumVulnerabilities: 5
      },
      quality: {
        minScore: 8.0,
        maxComplexity: 10,
        maxDuplication: 3
      },
      performance: {
        maxBuildTime: 300, // 5 minutes
        maxBundleSize: 5 * 1024 * 1024, // 5MB
        maxResponseTime: 2000 // 2 seconds
      },
      documentation: {
        minCoverage: 80
      }
    };
  }

  async run() {
    console.log('🚀 Starting Enterprise Quality Gate Enforcement...\n');
    
    try {
      await this.checkCodeCoverage();
      await this.checkSecurity();
      await this.checkCodeQuality();
      await this.checkPerformance();
      await this.checkDocumentation();
      
      this.generateReport();
      this.enforceGate();
      
    } catch (error) {
      console.error('❌ Quality gate enforcement failed:', error.message);
      process.exit(1);
    }
  }

  async checkCodeCoverage() {
    console.log('📊 Checking code coverage...');
    
    try {
      // Run tests with coverage
      execSync('npm run test:coverage', { stdio: 'pipe' });
      
      // Read coverage summary
      const coveragePath = './coverage/coverage-summary.json';
      if (!fs.existsSync(coveragePath)) {
        throw new Error('Coverage summary not found');
      }
      
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverage.total;
      
      this.results.coverage = {
        lines: total.lines.pct,
        branches: total.branches.pct,
        functions: total.functions.pct,
        statements: total.statements.pct,
        passed: this.checkCoverageThresholds(total)
      };
      
      console.log(`  Lines: ${total.lines.pct}% (threshold: ${this.thresholds.coverage.lines}%)`);
      console.log(`  Branches: ${total.branches.pct}% (threshold: ${this.thresholds.coverage.branches}%)`);
      console.log(`  Functions: ${total.functions.pct}% (threshold: ${this.thresholds.coverage.functions}%)`);
      console.log(`  Statements: ${total.statements.pct}% (threshold: ${this.thresholds.coverage.statements}%)`);
      
      if (this.results.coverage.passed) {
        console.log('  ✅ Coverage thresholds met\n');
      } else {
        console.log('  ❌ Coverage thresholds not met\n');
      }
      
    } catch (error) {
      console.log('  ❌ Coverage check failed:', error.message);
      this.results.coverage = { passed: false, error: error.message };
    }
  }

  checkCoverageThresholds(coverage) {
    return (
      coverage.lines.pct >= this.thresholds.coverage.lines &&
      coverage.branches.pct >= this.thresholds.coverage.branches &&
      coverage.functions.pct >= this.thresholds.coverage.functions &&
      coverage.statements.pct >= this.thresholds.coverage.statements
    );
  }

  async checkSecurity() {
    console.log('🔒 Checking security vulnerabilities...');
    
    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', { stdio: 'pipe', encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      
      const vulnerabilities = audit.vulnerabilities || {};
      const highCount = Object.values(vulnerabilities).filter(v => v.severity === 'high').length;
      const mediumCount = Object.values(vulnerabilities).filter(v => v.severity === 'moderate').length;
      
      this.results.security = {
        high: highCount,
        medium: mediumCount,
        total: Object.keys(vulnerabilities).length,
        passed: highCount <= this.thresholds.security.maxHighVulnerabilities &&
                mediumCount <= this.thresholds.security.maxMediumVulnerabilities
      };
      
      console.log(`  High vulnerabilities: ${highCount} (max: ${this.thresholds.security.maxHighVulnerabilities})`);
      console.log(`  Medium vulnerabilities: ${mediumCount} (max: ${this.thresholds.security.maxMediumVulnerabilities})`);
      
      if (this.results.security.passed) {
        console.log('  ✅ Security check passed\n');
      } else {
        console.log('  ❌ Security vulnerabilities exceed thresholds\n');
      }
      
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          const vulnerabilities = audit.vulnerabilities || {};
          const highCount = Object.values(vulnerabilities).filter(v => v.severity === 'high').length;
          const mediumCount = Object.values(vulnerabilities).filter(v => v.severity === 'moderate').length;
          
          this.results.security = {
            high: highCount,
            medium: mediumCount,
            total: Object.keys(vulnerabilities).length,
            passed: highCount <= this.thresholds.security.maxHighVulnerabilities &&
                    mediumCount <= this.thresholds.security.maxMediumVulnerabilities
          };
          
          console.log(`  High vulnerabilities: ${highCount} (max: ${this.thresholds.security.maxHighVulnerabilities})`);
          console.log(`  Medium vulnerabilities: ${mediumCount} (max: ${this.thresholds.security.maxMediumVulnerabilities})`);
          
          if (this.results.security.passed) {
            console.log('  ✅ Security check passed\n');
          } else {
            console.log('  ❌ Security vulnerabilities exceed thresholds\n');
          }
        } catch (parseError) {
          console.log('  ❌ Security check failed:', parseError.message);
          this.results.security = { passed: false, error: parseError.message };
        }
      } else {
        console.log('  ❌ Security check failed:', error.message);
        this.results.security = { passed: false, error: error.message };
      }
    }
  }

  async checkCodeQuality() {
    console.log('📝 Checking code quality...');
    
    try {
      // Run ESLint with JSON output
      const lintResult = execSync('npm run lint:report', { stdio: 'pipe' });
      
      // Check if report file exists
      const reportPath = './reports/eslint-report.json';
      if (!fs.existsSync(reportPath)) {
        // Create reports directory if it doesn't exist
        if (!fs.existsSync('./reports')) {
          fs.mkdirSync('./reports', { recursive: true });
        }
        
        // Run lint again to generate report
        execSync('npx eslint . --config eslint.config.enhanced.js --format json --output-file reports/eslint-report.json', { stdio: 'pipe' });
      }
      
      const lintReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      
      const errorCount = lintReport.reduce((sum, file) => sum + file.errorCount, 0);
      const warningCount = lintReport.reduce((sum, file) => sum + file.warningCount, 0);
      
      // Calculate quality score (simplified)
      const totalIssues = errorCount + warningCount;
      const qualityScore = Math.max(0, 10 - (totalIssues / 10));
      
      this.results.quality = {
        errors: errorCount,
        warnings: warningCount,
        score: qualityScore,
        passed: errorCount === 0 && qualityScore >= this.thresholds.quality.minScore
      };
      
      console.log(`  Errors: ${errorCount}`);
      console.log(`  Warnings: ${warningCount}`);
      console.log(`  Quality Score: ${qualityScore.toFixed(1)}/10 (min: ${this.thresholds.quality.minScore})`);
      
      if (this.results.quality.passed) {
        console.log('  ✅ Code quality check passed\n');
      } else {
        console.log('  ❌ Code quality below threshold\n');
      }
      
    } catch (error) {
      console.log('  ❌ Code quality check failed:', error.message);
      this.results.quality = { passed: false, error: error.message };
    }
  }

  async checkPerformance() {
    console.log('⚡ Checking performance metrics...');
    
    try {
      const startTime = Date.now();
      
      // Run build to check build time and bundle size
      execSync('npm run build', { stdio: 'pipe' });
      
      const buildTime = Date.now() - startTime;
      
      // Check bundle size
      let bundleSize = 0;
      if (fs.existsSync('./dist')) {
        const distStats = this.getDirectorySize('./dist');
        bundleSize = distStats;
      }
      
      this.results.performance = {
        buildTime,
        bundleSize,
        passed: buildTime <= this.thresholds.performance.maxBuildTime &&
                bundleSize <= this.thresholds.performance.maxBundleSize
      };
      
      console.log(`  Build time: ${buildTime}ms (max: ${this.thresholds.performance.maxBuildTime}ms)`);
      console.log(`  Bundle size: ${(bundleSize / 1024 / 1024).toFixed(2)}MB (max: ${(this.thresholds.performance.maxBundleSize / 1024 / 1024).toFixed(2)}MB)`);
      
      if (this.results.performance.passed) {
        console.log('  ✅ Performance check passed\n');
      } else {
        console.log('  ❌ Performance metrics exceed thresholds\n');
      }
      
    } catch (error) {
      console.log('  ❌ Performance check failed:', error.message);
      this.results.performance = { passed: false, error: error.message };
    }
  }

  async checkDocumentation() {
    console.log('📚 Checking documentation coverage...');
    
    try {
      // Count documented functions/classes vs total
      const jsFiles = this.findJSFiles('./src');
      let totalFunctions = 0;
      let documentedFunctions = 0;
      
      for (const file of jsFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Simple regex to find functions and their documentation
        const functionMatches = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?(|class\s+\w+)/g) || [];
        const docMatches = content.match(//**[\s\S]*?*//g) || [];
        
        totalFunctions += functionMatches.length;
        documentedFunctions += Math.min(docMatches.length, functionMatches.length);
      }
      
      const docCoverage = totalFunctions > 0 ? (documentedFunctions / totalFunctions) * 100 : 100;
      
      this.results.documentation = {
        total: totalFunctions,
        documented: documentedFunctions,
        coverage: docCoverage,
        passed: docCoverage >= this.thresholds.documentation.minCoverage
      };
      
      console.log(`  Functions documented: ${documentedFunctions}/${totalFunctions}`);
      console.log(`  Documentation coverage: ${docCoverage.toFixed(1)}% (min: ${this.thresholds.documentation.minCoverage}%)`);
      
      if (this.results.documentation.passed) {
        console.log('  ✅ Documentation check passed\n');
      } else {
        console.log('  ❌ Documentation coverage below threshold\n');
      }
      
    } catch (error) {
      console.log('  ❌ Documentation check failed:', error.message);
      this.results.documentation = { passed: false, error: error.message };
    }
  }

  findJSFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.findJSFiles(fullPath));
      } else if (stat.isFile() && /.(js|jsx|ts|tsx)$/.test(item)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  getDirectorySize(dir) {
    let size = 0;
    
    if (!fs.existsSync(dir)) return size;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        size += this.getDirectorySize(fullPath);
      } else {
        size += stat.size;
      }
    }
    
    return size;
  }

  generateReport() {
    console.log('📋 Generating Quality Gate Report...\n');
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      results: this.results,
      thresholds: this.thresholds,
      overall: this.calculateOverallResult()
    };
    
    // Ensure reports directory exists
    if (!fs.existsSync('./reports')) {
      fs.mkdirSync('./reports', { recursive: true });
    }
    
    // Write detailed report
    fs.writeFileSync('./reports/quality-gate-report.json', JSON.stringify(report, null, 2));
    
    // Generate HTML report
    this.generateHTMLReport(report);
    
    console.log('📄 Reports generated:');
    console.log('  - ./reports/quality-gate-report.json');
    console.log('  - ./reports/quality-gate-report.html\n');
  }

  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quality Gate Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .pass { background: #d4edda; border-color: #c3e6cb; }
        .fail { background: #f8d7da; border-color: #f5c6cb; }
        .metric { display: flex; justify-content: space-between; margin: 5px 0; }
        .overall { font-size: 1.2em; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Quality Gate Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Environment: ${report.environment}</p>
        <div class="overall ${report.overall ? 'pass' : 'fail'}">
            Overall Result: ${report.overall ? '✅ PASSED' : '❌ FAILED'}
        </div>
    </div>
    
    <div class="section ${report.results.coverage?.passed ? 'pass' : 'fail'}">
        <h2>Code Coverage</h2>
        ${report.results.coverage ? `
            <div class="metric"><span>Lines:</span><span>${report.results.coverage.lines}%</span></div>
            <div class="metric"><span>Branches:</span><span>${report.results.coverage.branches}%</span></div>
            <div class="metric"><span>Functions:</span><span>${report.results.coverage.functions}%</span></div>
            <div class="metric"><span>Statements:</span><span>${report.results.coverage.statements}%</span></div>
        ` : '<p>Coverage check failed</p>'}
    </div>
    
    <div class="section ${report.results.security?.passed ? 'pass' : 'fail'}">
        <h2>Security</h2>
        ${report.results.security ? `
            <div class="metric"><span>High Vulnerabilities:</span><span>${report.results.security.high}</span></div>
            <div class="metric"><span>Medium Vulnerabilities:</span><span>${report.results.security.medium}</span></div>
            <div class="metric"><span>Total Vulnerabilities:</span><span>${report.results.security.total}</span></div>
        ` : '<p>Security check failed</p>'}
    </div>
    
    <div class="section ${report.results.quality?.passed ? 'pass' : 'fail'}">
        <h2>Code Quality</h2>
        ${report.results.quality ? `
            <div class="metric"><span>Errors:</span><span>${report.results.quality.errors}</span></div>
            <div class="metric"><span>Warnings:</span><span>${report.results.quality.warnings}</span></div>
            <div class="metric"><span>Quality Score:</span><span>${report.results.quality.score?.toFixed(1)}/10</span></div>
        ` : '<p>Quality check failed</p>'}
    </div>
    
    <div class="section ${report.results.performance?.passed ? 'pass' : 'fail'}">
        <h2>Performance</h2>
        ${report.results.performance ? `
            <div class="metric"><span>Build Time:</span><span>${report.results.performance.buildTime}ms</span></div>
            <div class="metric"><span>Bundle Size:</span><span>${(report.results.performance.bundleSize / 1024 / 1024).toFixed(2)}MB</span></div>
        ` : '<p>Performance check failed</p>'}
    </div>
    
    <div class="section ${report.results.documentation?.passed ? 'pass' : 'fail'}">
        <h2>Documentation</h2>
        ${report.results.documentation ? `
            <div class="metric"><span>Functions Documented:</span><span>${report.results.documentation.documented}/${report.results.documentation.total}</span></div>
            <div class="metric"><span>Coverage:</span><span>${report.results.documentation.coverage?.toFixed(1)}%</span></div>
        ` : '<p>Documentation check failed</p>'}
    </div>
</body>
</html>`;
    
    fs.writeFileSync('./reports/quality-gate-report.html', html);
  }

  calculateOverallResult() {
    const checks = [
      this.results.coverage?.passed,
      this.results.security?.passed,
      this.results.quality?.passed,
      this.results.performance?.passed,
      this.results.documentation?.passed
    ];
    
    // All checks must pass for overall success
    this.results.overall = checks.every(check => check === true);
    return this.results.overall;
  }

  enforceGate() {
    console.log('🚪 Enforcing Quality Gate...\n');
    
    if (this.results.overall) {
      console.log('🎉 Quality Gate PASSED! ✅');
      console.log('   All quality standards have been met.');
      console.log('   Deployment can proceed.\n');
      process.exit(0);
    } else {
      console.log('🚫 Quality Gate FAILED! ❌');
      console.log('   Quality standards not met. Please address the following issues:');
      
      if (!this.results.coverage?.passed) {
        console.log('   - Code coverage below threshold');
      }
      if (!this.results.security?.passed) {
        console.log('   - Security vulnerabilities exceed limits');
      }
      if (!this.results.quality?.passed) {
        console.log('   - Code quality below standards');
      }
      if (!this.results.performance?.passed) {
        console.log('   - Performance metrics exceed thresholds');
      }
      if (!this.results.documentation?.passed) {
        console.log('   - Documentation coverage insufficient');
      }
      
      console.log('\n   Deployment blocked until issues are resolved.\n');
      process.exit(1);
    }
  }
}

// Run quality gate if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const enforcer = new QualityGateEnforcer();
  enforcer.run().catch(error => {
    console.error('Quality gate enforcement failed:', error);
    process.exit(1);
  });
}

export default QualityGateEnforcer;

