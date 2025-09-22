/**
 * Compliance Reporting Module
 */

import fs from 'fs/promises';
import path from 'path';

export class ComplianceReporter {
  constructor(config = {}) {
    this.config = {
      outputDir: './reports/compliance',
      formats: ['json', 'html', 'pdf'],
      includeEvidence: true,
      ...config
    };
  }

  async generateReport(results) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const baseFilename = `compliance-report-${timestamp}`;

    const report = {
      generatedAt: new Date(),
      results,
      executive: this.generateExecutiveSummary(results),
      recommendations: this.generateRecommendations(results)
    };

    // Save in multiple formats
    for (const format of this.config.formats) {
      await this.saveReport(report, baseFilename, format);
    }

    return report;
  }

  generateExecutiveSummary(results) {
    return {
      overallStatus: results.overall,
      complianceScore: results.summary?.complianceScore || 0,
      criticalFindings: this.extractCriticalFindings(results),
      keyMetrics: this.calculateKeyMetrics(results)
    };
  }

  extractCriticalFindings(results) {
    const findings = [];

    for (const [standard, result] of Object.entries(results.standards)) {
      if (result.details?.failed) {
        for (const failure of result.details.failed) {
          findings.push({
            standard,
            control: failure.controlId || failure.right,
            severity: 'CRITICAL',
            description: failure.description || 'Compliance control failed'
          });
        }
      }
    }

    return findings;
  }

  calculateKeyMetrics(results) {
    return {
      standardsCovered: Object.keys(results.standards).length,
      passRate: results.summary?.complianceScore || 0,
      failedControls: this.countFailedControls(results),
      evidenceCollected: this.countEvidence(results)
    };
  }

  countFailedControls(results) {
    let count = 0;
    for (const result of Object.values(results.standards)) {
      count += result.details?.failed?.length || 0;
    }
    return count;
  }

  countEvidence(results) {
    let count = 0;
    for (const result of Object.values(results.standards)) {
      if (result.details?.passed) {
        for (const pass of result.details.passed) {
          count += pass.evidence?.length || 0;
        }
      }
    }
    return count;
  }

  generateRecommendations(results) {
    const recommendations = [];

    if (results.overall === 'FAIL') {
      recommendations.push({
        priority: 'HIGH',
        action: 'Address critical compliance failures immediately',
        timeline: '24-48 hours'
      });
    }

    if (results.summary?.complianceScore < 80) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Improve compliance score to meet minimum threshold of 80%',
        timeline: '1 week'
      });
    }

    return recommendations;
  }

  async saveReport(report, filename, format) {
    const filepath = path.join(this.config.outputDir, `${filename}.${format}`);

    // Ensure directory exists
    await fs.mkdir(this.config.outputDir, { recursive: true });

    switch (format) {
      case 'json':
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));
        break;
      case 'html':
        await fs.writeFile(filepath, this.generateHTML(report));
        break;
      case 'pdf':
        // PDF generation would require additional library
        break;
    }

    return filepath;
  }

  generateHTML(report) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Compliance Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .status-pass { color: green; }
    .status-fail { color: red; }
    .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>Compliance Report</h1>
  <div class="summary">
    <h2>Executive Summary</h2>
    <p>Overall Status: <span class="status-${report.results.overall.toLowerCase()}">${report.results.overall}</span></p>
    <p>Compliance Score: ${report.executive.complianceScore}%</p>
    <p>Critical Findings: ${report.executive.criticalFindings.length}</p>
  </div>
  <pre>${JSON.stringify(report, null, 2)}</pre>
</body>
</html>`;
  }
}

export default ComplianceReporter;