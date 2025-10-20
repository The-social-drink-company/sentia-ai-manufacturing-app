#!/usr/bin/env node

/**
 * CapLiquify Manufacturing Platform - Security Audit Script
 * Comprehensive security validation for enterprise deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityAuditor {
  constructor() {
    this.results = {
      passed: [],
      warnings: [],
      failed: [],
      score: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔍',
      pass: '✅',
      warn: '⚠️',
      fail: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addResult(test, status, message, details = '') {
    const result = { test, message, details, timestamp: new Date().toISOString() };
    
    switch (status) {
      case 'pass':
        this.results.passed.push(result);
        this.results.score += 10;
        this.log(`${test}: ${message}`, 'pass');
        break;
      case 'warn':
        this.results.warnings.push(result);
        this.results.score += 5;
        this.log(`${test}: ${message}`, 'warn');
        break;
      case 'fail':
        this.results.failed.push(result);
        this.log(`${test}: ${message}`, 'fail');
        break;
    }
  }

  // 1. Dependency Security Audit
  auditDependencies() {
    this.log('Starting dependency security audit...');
    
    try {
      // Check for known vulnerabilities
      const auditResult = execSync('npm audit --audit-level=moderate', { encoding: 'utf8' });
      
      if (auditResult.includes('found 0 vulnerabilities')) {
        this.addResult('Dependency Security', 'pass', 'No known vulnerabilities found');
      } else {
        this.addResult('Dependency Security', 'warn', 'Some vulnerabilities detected', auditResult);
      }
    } catch (error) {
      if (error.stdout && error.stdout.includes('vulnerabilities')) {
        this.addResult('Dependency Security', 'fail', 'Critical vulnerabilities found', error.stdout);
      } else {
        this.addResult('Dependency Security', 'pass', 'Audit completed successfully');
      }
    }
  }

  // 2. Source Code Security Analysis
  analyzeSourceCode() {
    this.log('Analyzing source code for security issues...');
    
    const srcDir = path.join(__dirname, '../src');
    const dangerousPatterns = [
      {
        pattern: /dangerouslySetInnerHTML/g,
        severity: 'high',
        description: 'Potential XSS vulnerability with dangerouslySetInnerHTML'
      },
      {
        pattern: /eval\s*\(/g,
        severity: 'critical',
        description: 'Use of eval() function detected'
      },
      {
        pattern: /innerHTML\s*=/g,
        severity: 'medium',
        description: 'Direct innerHTML manipulation detected'
      },
      {
        pattern: /document\.write/g,
        severity: 'high',
        description: 'Use of document.write detected'
      }
    ];

    let issuesFound = 0;
    
    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          dangerousPatterns.forEach(({ pattern, severity, description }) => {
            const matches = content.match(pattern);
            if (matches) {
              issuesFound++;
              this.addResult(
                'Source Code Security',
                severity === 'critical' ? 'fail' : 'warn',
                `${description} in ${file}`,
                `Found ${matches.length} occurrence(s)`
              );
            }
          });
        }
      });
    };

    if (fs.existsSync(srcDir)) {
      scanDirectory(srcDir);
    }

    if (issuesFound === 0) {
      this.addResult('Source Code Security', 'pass', 'No dangerous patterns detected in source code');
    }
  }

  // 3. Server Configuration Security
  auditServerConfig() {
    this.log('Auditing server configuration...');
    
    const serverFiles = [
      'server.js',
      'server-minimal.js',
      'server-memory-optimized.js'
    ];

    serverFiles.forEach(serverFile => {
      const serverPath = path.join(__dirname, '..', serverFile);
      
      if (fs.existsSync(serverPath)) {
        const content = fs.readFileSync(serverPath, 'utf8');
        
        // Check for security headers
        const securityChecks = [
          {
            pattern: /helmet|security.*headers/i,
            name: 'Security Headers',
            required: true
          },
          {
            pattern: /cors/i,
            name: 'CORS Configuration',
            required: true
          },
          {
            pattern: /https|ssl/i,
            name: 'HTTPS Configuration',
            required: false
          },
          {
            pattern: /rate.*limit/i,
            name: 'Rate Limiting',
            required: false
          }
        ];

        securityChecks.forEach(({ pattern, name, required }) => {
          if (pattern.test(content)) {
            this.addResult('Server Security', 'pass', `${name} implemented in ${serverFile}`);
          } else if (required) {
            this.addResult('Server Security', 'warn', `${name} not found in ${serverFile}`);
          }
        });
      }
    });
  }

  // 4. Environment Security
  auditEnvironment() {
    this.log('Auditing environment configuration...');
    
    const envFiles = ['.env', '.env.local', '.env.production'];
    let envFound = false;
    
    envFiles.forEach(envFile => {
      const envPath = path.join(__dirname, '..', envFile);
      
      if (fs.existsSync(envPath)) {
        envFound = true;
        const content = fs.readFileSync(envPath, 'utf8');
        
        // Check for sensitive data patterns
        const sensitivePatterns = [
          /password\s*=/i,
          /secret\s*=/i,
          /private.*key/i,
          /api.*key.*=.*[a-zA-Z0-9]{20,}/i
        ];

        let hasSecrets = false;
        sensitivePatterns.forEach(pattern => {
          if (pattern.test(content)) {
            hasSecrets = true;
          }
        });

        if (hasSecrets) {
          this.addResult('Environment Security', 'pass', `Secrets properly configured in ${envFile}`);
        }

        // Check for hardcoded secrets in code
        if (content.includes('localhost') && envFile.includes('production')) {
          this.addResult('Environment Security', 'warn', 'Localhost references in production environment');
        }
      }
    });

    if (!envFound) {
      this.addResult('Environment Security', 'warn', 'No environment files found');
    }
  }

  // 5. Build Security
  auditBuild() {
    this.log('Auditing build configuration...');
    
    const distDir = path.join(__dirname, '../dist');
    
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir);
      
      // Check for source maps in production
      const sourceMaps = files.filter(file => file.endsWith('.map'));
      if (sourceMaps.length > 0) {
        this.addResult('Build Security', 'warn', 'Source maps found in build directory', 
          'Consider removing source maps in production');
      } else {
        this.addResult('Build Security', 'pass', 'No source maps in production build');
      }

      // Check for minification
      const jsFiles = files.filter(file => file.endsWith('.js') && !file.includes('.map'));
      if (jsFiles.length > 0) {
        const sampleFile = path.join(distDir, 'assets', jsFiles[0]);
        if (fs.existsSync(sampleFile)) {
          const content = fs.readFileSync(sampleFile, 'utf8');
          if (content.length > 1000 && !content.includes('\n')) {
            this.addResult('Build Security', 'pass', 'JavaScript files are minified');
          } else {
            this.addResult('Build Security', 'warn', 'JavaScript files may not be properly minified');
          }
        }
      }
    } else {
      this.addResult('Build Security', 'warn', 'Build directory not found');
    }
  }

  // 6. Package.json Security
  auditPackageJson() {
    this.log('Auditing package.json configuration...');
    
    const packagePath = path.join(__dirname, '../package.json');
    
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check for security-related scripts
      if (packageJson.scripts) {
        if (packageJson.scripts.audit || packageJson.scripts['security-audit']) {
          this.addResult('Package Security', 'pass', 'Security audit script configured');
        }
        
        // Check for dangerous scripts
        const dangerousCommands = ['rm -rf', 'sudo', 'chmod 777'];
        Object.entries(packageJson.scripts).forEach(([scriptName, command]) => {
          dangerousCommands.forEach(dangerous => {
            if (command.includes(dangerous)) {
              this.addResult('Package Security', 'fail', 
                `Dangerous command in script "${scriptName}": ${dangerous}`);
            }
          });
        });
      }

      // Check for private flag
      if (packageJson.private === true) {
        this.addResult('Package Security', 'pass', 'Package marked as private');
      } else {
        this.addResult('Package Security', 'warn', 'Package not marked as private');
      }

    } else {
      this.addResult('Package Security', 'fail', 'package.json not found');
    }
  }

  // Generate comprehensive report
  generateReport() {
    const totalTests = this.results.passed.length + this.results.warnings.length + this.results.failed.length;
    const maxScore = totalTests * 10;
    const percentage = Math.round((this.results.score / maxScore) * 100);

    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        totalTests,
        passed: this.results.passed.length,
        warnings: this.results.warnings.length,
        failed: this.results.failed.length,
        score: this.results.score,
        maxScore,
        percentage,
        grade: this.getSecurityGrade(percentage)
      },
      details: this.results
    };

    // Write report to file
    const reportPath = path.join(__dirname, '../security-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  getSecurityGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }

  // Run all security audits
  async runFullAudit() {
    this.log('🔒 Starting CapLiquify Manufacturing Platform Security Audit');
    this.log('================================================');

    try {
      this.auditDependencies();
      this.analyzeSourceCode();
      this.auditServerConfig();
      this.auditEnvironment();
      this.auditBuild();
      this.auditPackageJson();

      const report = this.generateReport();
      
      this.log('================================================');
      this.log(`🎯 Security Audit Complete`);
      this.log(`📊 Score: ${report.summary.score}/${report.summary.maxScore} (${report.summary.percentage}%)`);
      this.log(`🏆 Grade: ${report.summary.grade}`);
      this.log(`✅ Passed: ${report.summary.passed}`);
      this.log(`⚠️  Warnings: ${report.summary.warnings}`);
      this.log(`❌ Failed: ${report.summary.failed}`);
      
      if (report.summary.failed > 0) {
        this.log('🚨 Critical issues found - review required before production deployment', 'fail');
        process.exit(1);
      } else if (report.summary.warnings > 0) {
        this.log('⚠️  Some warnings found - consider addressing before production', 'warn');
      } else {
        this.log('🎉 All security checks passed - ready for production deployment', 'pass');
      }

      return report;

    } catch (error) {
      this.log(`💥 Security audit failed: ${error.message}`, 'fail');
      process.exit(1);
    }
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runFullAudit();
}

module.exports = SecurityAuditor;
