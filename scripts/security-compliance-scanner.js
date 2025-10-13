#!/usr/bin/env node

/**
 * Security & Compliance Scanner
 * Comprehensive security analysis and compliance checking for enterprise deployment
 */

import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Security Configuration
const SECURITYCONFIG = {
  vulnerabilityThresholds: {
    critical: 0, // No critical vulnerabilities allowed
    high: 2, // Maximum 2 high severity vulnerabilities
    moderate: 5, // Maximum 5 moderate vulnerabilities
    low: 10 // Maximum 10 low vulnerabilities
  },
  compliance: {
    enableCodeScanning: true,
    enableSecretDetection: true,
    enableDependencyCheck: true,
    enableLicenseCheck: true
  },
  secretPatterns: [
    /(['"`])(AKIA[0-9A-Z]{16})\1/g, // AWS Access Key
    /(['"`])[0-9a-zA-Z/+]{40}\1/g, // AWS Secret Key
    /sk_live_[0-9a-zA-Z]{24}/g, // Stripe Live Key
    /sk_test_[0-9a-zA-Z]{24}/g, // Stripe Test Key
    /ghp_[0-9a-zA-Z]{36}/g, // GitHub Personal Access Token
    /glpat-[0-9a-zA-Z_\-]{20}/g, // GitLab Personal Access Token
    /SG.[0-9a-zA-Z_\-]{22}.[0-9a-zA-Z_\-]{43}/g, // SendGrid API Key
    /xoxb-[0-9]{11}-[0-9]{11}-[0-9a-zA-Z]{24}/g, // Slack Bot Token
    /postgres://[^:]+:[^@]+@[^/]+/[^\s]+/g, // PostgreSQL Connection String
    /mongodb(+srv)?://[^:]+:[^@]+@[^/]+/[^\s]+/g // MongoDB Connection String
  ],
  excludePaths: [
    'node_modules',
    'dist',
    'build',
    '.git',
    'logs',
    '*.log',
    '*.lock',
    '*.min.js',
    '*.min.css'
  ]
};

class SecurityComplianceScanner {
  constructor() {
    this.scanId = this.generateScanId();
    this.startTime = Date.now();
    this.logFile = path.join(projectRoot, 'logs', `security-scan-${this.scanId}.log`);
    this.reportFile = path.join(projectRoot, 'logs', `security-report-${this.scanId}.json`);
    
    this.ensureDirectoryExists(path.dirname(this.logFile));
    
    this.report = {
      scanId: this.scanId,
      timestamp: new Date().toISOString(),
      projectPath: projectRoot,
      vulnerabilities: [],
      secrets: [],
      compliance: {},
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        moderateIssues: 0,
        lowIssues: 0,
        complianceScore: 0,
        passed: false
      }
    };
    
    this.log('INFO', `Security Compliance Scanner Started - ID: ${this.scanId}`);
  }

  generateScanId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const random = Math.random().toString(36).substring(2, 6);
    return `sec-${timestamp}-${random}`;
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logEntry);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    
    try {
      fs.appendFileSync(this.logFile, logEntry + (data ? '\n' + JSON.stringify(data, null, 2) : '') + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async executeCommand(command, timeout = 120000) {
    return new Promise(_(resolve, _reject) => {
      this.log('INFO', `Executing: ${command}`);
      
      exec(command, { 
        cwd: projectRoot,
        timeout,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      }, (error, stdout, _stderr) => {
        if (error && error.code !== 1) { // npm audit returns 1 on vulnerabilities
          reject(error);
        } else {
          resolve({ stdout, stderr, code: error?.code || 0 });
        }
      });
    });
  }

  async scanDependencyVulnerabilities() {
    this.log('INFO', 'Scanning dependency vulnerabilities...');
    
    try {
      const result = await this.executeCommand('npm audit --json');
      const auditData = JSON.parse(result.stdout || '{}');
      
      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(_([packageName, _vulnData]) => {
          const vulnerability = {
            type: 'dependency',
            package: packageName,
            severity: vulnData.severity,
            title: vulnData.title,
            url: vulnData.url,
            fixAvailable: !!vulnData.fixAvailable,
            via: vulnData.via
          };
          
          this.report.vulnerabilities.push(vulnerability);
          this.updateSeverityCount(vulnData.severity);
        });
      }
      
      this.log('SUCCESS', `Dependency scan completed - Found ${Object.keys(auditData.vulnerabilities || {}).length} vulnerabilities`);
      this.report.compliance.dependencyCheck = true;
      
    } catch (error) {
      this.log('ERROR', 'Dependency vulnerability scan failed', error);
      this.report.compliance.dependencyCheck = false;
    }
  }

  async scanSecrets() {
    this.log('INFO', 'Scanning for exposed secrets...');
    
    try {
      const files = await this.getFilesToScan();
      let secretsFound = 0;
      
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          SECURITY_CONFIG.secretPatterns.forEach((pattern, index) => {
            const matches = [...content.matchAll(pattern)];
            
            matches.forEach(match => {
              const secret = {
                type: 'secret',
                file,
                pattern: pattern.source,
                line: this.getLineNumber(content, match.index),
                severity: 'critical',
                description: this.getSecretDescription(pattern)
              };
              
              this.report.secrets.push(secret);
              secretsFound++;
            });
          });
          
        } catch (error) {
          this.log('WARN', `Failed to scan file ${file}: ${error.message}`);
        }
      }
      
      this.log('SUCCESS', `Secret scan completed - Found ${secretsFound} potential secrets`);
      this.report.compliance.secretDetection = true;
      
    } catch (error) {
      this.log('ERROR', 'Secret scanning failed', error);
      this.report.compliance.secretDetection = false;
    }
  }

  async getFilesToScan() {
    const files = [];
    
    const scanDirectory = (_dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(projectRoot, fullPath);
        
        // Skip excluded paths
        if (SECURITY_CONFIG.excludePaths.some(exclude => relativePath.includes(exclude))) {
          continue;
        }
        
        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (this.isTextFile(entry.name)) {
          files.push(fullPath);
        }
      }
    };
    
    scanDirectory(projectRoot);
    return files;
  }

  isTextFile(filename) {
    const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.env', '.md', '.yml', '.yaml', '.txt', '.xml', '.html', '.css', '.scss', '.sql'];
    return textExtensions.some(ext => filename.endsWith(ext));
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  getSecretDescription(pattern) {
    const descriptions = {
      'AKIA[0-9A-Z]{16}': 'AWS Access Key ID',
      '[0-9a-zA-Z/+]{40}': 'AWS Secret Access Key',
      'sk_live_[0-9a-zA-Z]{24}': 'Stripe Live API Key',
      'sk_test_[0-9a-zA-Z]{24}': 'Stripe Test API Key',
      'ghp_[0-9a-zA-Z]{36}': 'GitHub Personal Access Token',
      'glpat-[0-9a-zA-Z_\\-]{20}': 'GitLab Personal Access Token',
      'SG\.[0-9a-zA-Z_\\-]{22}\.[0-9a-zA-Z_\\-]{43}': 'SendGrid API Key',
      'xoxb-[0-9]{11}-[0-9]{11}-[0-9a-zA-Z]{24}': 'Slack Bot Token',
      'postgres://': 'PostgreSQL Connection String',
      'mongodb': 'MongoDB Connection String'
    };
    
    for (const [key, description] of Object.entries(descriptions)) {
      if (pattern.source.includes(key)) {
        return description;
      }
    }
    
    return 'Unknown Secret Pattern';
  }

  async scanCodeVulnerabilities() {
    this.log('INFO', 'Scanning code for vulnerabilities...');
    
    try {
      // Use ESLint security plugin for code scanning
      const result = await this.executeCommand('npm run lint -- --format json');
      
      if (result.stdout) {
        const lintResults = JSON.parse(result.stdout);
        
        lintResults.forEach(fileResult => {
          fileResult.messages.forEach(message => {
            if (message.ruleId && message.ruleId.includes('security')) {
              const vulnerability = {
                type: 'code',
                file: fileResult.filePath,
                line: message.line,
                column: message.column,
                severity: this.mapESLintSeverity(message.severity),
                rule: message.ruleId,
                message: message.message
              };
              
              this.report.vulnerabilities.push(vulnerability);
              this.updateSeverityCount(vulnerability.severity);
            }
          });
        });
      }
      
      this.log('SUCCESS', 'Code vulnerability scan completed');
      this.report.compliance.codeScanning = true;
      
    } catch (error) {
      this.log('ERROR', 'Code vulnerability scan failed', error);
      this.report.compliance.codeScanning = false;
    }
  }

  mapESLintSeverity(eslintSeverity) {
    switch (eslintSeverity) {
      case 2: return 'high';
      case 1: return 'moderate';
      default: return 'low';
    }
  }

  async scanLicenseCompliance() {
    this.log('INFO', 'Scanning license compliance...');
    
    try {
      // Check package.json for license information
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const licenseCheck = {
        projectLicense: packageJson.license || 'UNKNOWN',
        dependencyLicenses: [],
        issues: []
      };
      
      // Check for potentially problematic licenses
      const problematicLicenses = ['GPL-3.0', 'AGPL-3.0', 'LGPL-3.0'];
      
      if (problematicLicenses.includes(licenseCheck.projectLicense)) {
        licenseCheck.issues.push({
          type: 'license',
          severity: 'moderate',
          description: `Project uses potentially problematic license: ${licenseCheck.projectLicense}`
        });
      }
      
      this.report.compliance.licenseCheck = licenseCheck;
      this.log('SUCCESS', 'License compliance scan completed');
      
    } catch (error) {
      this.log('ERROR', 'License compliance scan failed', error);
      this.report.compliance.licenseCheck = false;
    }
  }


  updateSeverityCount(severity) {
    switch (severity) {
      case 'critical':
        this.report.summary.criticalIssues++;
        break;
      case 'high':
        this.report.summary.highIssues++;
        break;
      case 'moderate':
        this.report.summary.moderateIssues++;
        break;
      case 'low':
        this.report.summary.lowIssues++;
        break;
    }
    this.report.summary.totalIssues++;
  }

  calculateComplianceScore() {
    const checks = Object.values(this.report.compliance).filter(check => typeof check === 'boolean');
    const passedChecks = checks.filter(check => check === true).length;
    const score = checks.length > 0 ? (passedChecks / checks.length) * 100 : 0;
    
    this.report.summary.complianceScore = Math.round(score);
    
    // Determine if scan passed based on thresholds
    const thresholds = SECURITY_CONFIG.vulnerabilityThresholds;
    const passed = (
      this.report.summary.criticalIssues <= thresholds.critical &&
      this.report.summary.highIssues <= thresholds.high &&
      this.report.summary.moderateIssues <= thresholds.moderate &&
      this.report.summary.lowIssues <= thresholds.low &&
      this.report.secrets.length === 0 // No secrets allowed
    );
    
    this.report.summary.passed = passed;
    
    return score;
  }

  async runFullScan() {
    try {
      this.log('INFO', 'Starting comprehensive security scan...');
      
      // Run all security scans
      await this.scanDependencyVulnerabilities();
      await this.scanSecrets();
      await this.scanCodeVulnerabilities();
      await this.scanLicenseCompliance();
      
      // Calculate compliance score
      const complianceScore = this.calculateComplianceScore();
      const duration = Date.now() - this.startTime;
      
      // Generate summary
      this.log('INFO', `Security scan completed in ${Math.round(duration / 1000)}s`);
      this.log('INFO', `Compliance Score: ${complianceScore}%`);
      this.log('INFO', `Total Issues: ${this.report.summary.totalIssues}`);
      this.log('INFO', `Critical: ${this.report.summary.criticalIssues}, High: ${this.report.summary.highIssues}, Moderate: ${this.report.summary.moderateIssues}, Low: ${this.report.summary.lowIssues}`);
      this.log('INFO', `Secrets Found: ${this.report.secrets.length}`);
      this.log('INFO', `Scan Status: ${this.report.summary.passed ? 'PASSED' : 'FAILED'}`);
      
      // Save report
      this.report.duration = duration;
      this.report.completedAt = new Date().toISOString();
      
      fs.writeFileSync(this.reportFile, JSON.stringify(this.report, null, 2));
      
      this.log('SUCCESS', `Security report saved to: ${this.reportFile}`);
      
      return this.report;
      
    } catch (error) {
      this.log('ERROR', `Security scan failed: ${error.message}`);
      throw error;
    }
  }

  generateSummaryReport() {
    const summary = {
      scanId: this.scanId,
      timestamp: this.report.timestamp,
      complianceScore: this.report.summary.complianceScore,
      passed: this.report.summary.passed,
      issues: {
        total: this.report.summary.totalIssues,
        critical: this.report.summary.criticalIssues,
        high: this.report.summary.highIssues,
        moderate: this.report.summary.moderateIssues,
        low: this.report.summary.lowIssues
      },
      secrets: this.report.secrets.length,
      compliance: this.report.compliance,
      recommendations: this.generateRecommendations()
    };
    
    return summary;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.report.summary.criticalIssues > 0) {
      recommendations.push('Address critical security vulnerabilities immediately');
    }
    
    if (this.report.secrets.length > 0) {
      recommendations.push('Remove exposed secrets and rotate affected credentials');
    }
    
    if (this.report.summary.highIssues > SECURITY_CONFIG.vulnerabilityThresholds.high) {
      recommendations.push('Reduce high-severity vulnerabilities below threshold');
    }
    
    if (this.report.summary.complianceScore < 80) {
      recommendations.push('Improve compliance score by addressing failed checks');
    }
    
    return recommendations;
  }

  // CLI Interface
  static async cli() {
    const args = process.argv.slice(2);
    const command = args[0] || 'scan';

    const scanner = new SecurityComplianceScanner();

    switch (command) {
      case 'scan':
      case 'full':
        try {
          const report = await scanner.runFullScan();
          const summary = scanner.generateSummaryReport();
          
          console.log('\n=== SECURITY SCAN SUMMARY ===');
          console.log(JSON.stringify(summary, null, 2));
          
          if (!report.summary.passed) {
            console.log('\n❌ Security scan FAILED - Issues must be addressed before deployment');
            process.exit(1);
          } else {
            console.log('\n✅ Security scan PASSED - Ready for deployment');
          }
        } catch (error) {
          console.error('Security scan failed:', error.message);
          process.exit(1);
        }
        break;

      case 'summary':
        try {
          // Load latest report
          const reportFiles = fs.readdirSync(path.join(projectRoot, 'logs'))
            .filter(f => f.startsWith('security-report-'))
            .sort()
            .reverse();
            
          if (reportFiles.length > 0) {
            const latestReport = JSON.parse(
              fs.readFileSync(path.join(projectRoot, 'logs', reportFiles[0]), 'utf8')
            );
            scanner.report = latestReport;
            const summary = scanner.generateSummaryReport();
            console.log(JSON.stringify(summary, null, 2));
          } else {
            console.log('No security reports found. Run a scan first.');
          }
        } catch (error) {
          console.error('Failed to generate summary:', error.message);
        }
        break;

      default:
        console.log(`
Security & Compliance Scanner - Sentia Manufacturing Dashboard

Usage:
  node scripts/security-compliance-scanner.js <command>

Commands:
  scan      Run full security scan (default)
  summary   Show summary of latest scan

Examples:
  node scripts/security-compliance-scanner.js scan
  node scripts/security-compliance-scanner.js summary
        `);
        break;
    }
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  SecurityComplianceScanner.cli().catch(console.error);
}

export default SecurityComplianceScanner;