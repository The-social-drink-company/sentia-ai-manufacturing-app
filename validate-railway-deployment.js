#!/usr/bin/env node

/**
 * Railway Deployment Validation Script
 * Validates all services are running correctly before going live
 */

import { promises as fs } from 'fs';
import path from 'path';

class DeploymentValidator {
  constructor() {
    this.services = {
      mainApp: {
        name: 'Main Application',
        healthUrl: '/api/health',
        port: 5000
      },
      mcpServer: {
        name: 'MCP Server',
        healthUrl: '/health',
        port: 6002
      },
      testAgent: {
        name: 'Autonomous Test Agent',
        healthUrl: '/health', 
        port: 6001
      }
    };
    
    this.environments = {
      development: 'https://sentia-manufacturing-dashboard-development.up.railway.app',
      testing: 'https://sentia-manufacturing-dashboard-testing.up.railway.app',
      production: 'https://sentia-manufacturing-dashboard-production.up.railway.app'
    };
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[VALIDATION-${level}] ${message}`);
  }

  async validateService(serviceName, baseUrl, healthPath) {
    try {
      const response = await fetch(`${baseUrl}${healthPath}`, {
        method: 'GET',
        timeout: 10000
      });

      if (response.ok) {
        const data = await response.json();
        return {
          service: serviceName,
          status: 'healthy',
          url: `${baseUrl}${healthPath}`,
          response: data,
          responseTime: response.headers.get('x-response-time') || 'N/A'
        };
      } else {
        return {
          service: serviceName,
          status: 'unhealthy',
          url: `${baseUrl}${healthPath}`,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        service: serviceName,
        status: 'error',
        url: `${baseUrl}${healthPath}`,
        error: error.message
      };
    }
  }

  async validateLocalServices() {
    this.log('Validating local services...');
    
    const results = [];
    
    // Test MCP server (currently running)
    const mcpResult = await this.validateService(
      'MCP Server (Local)',
      'http://localhost:6002',
      '/health'
    );
    results.push(mcpResult);

    // Test MCP status endpoint
    const mcpStatusResult = await this.validateService(
      'MCP Server Status (Local)',
      'http://localhost:6002',
      '/mcp/status'
    );
    results.push(mcpStatusResult);

    return results;
  }

  async validateRailwayEnvironment(environment) {
    this.log(`Validating ${environment} environment...`);
    
    const baseUrl = this.environments[environment];
    if (!baseUrl) {
      throw new Error(`Unknown environment: ${environment}`);
    }

    const results = [];

    // Validate main application
    const mainAppResult = await this.validateService(
      'Main Application',
      baseUrl,
      '/api/health'
    );
    results.push(mainAppResult);

    // Validate MCP server
    const mcpUrl = baseUrl.replace('sentia-manufacturing-dashboard', 'sentia-mcp-server');
    const mcpResult = await this.validateService(
      'MCP Server',
      mcpUrl,
      '/health'
    );
    results.push(mcpResult);

    // Validate test agent
    const testAgentUrl = baseUrl.replace('sentia-manufacturing-dashboard', 'sentia-test-agent');
    const testAgentResult = await this.validateService(
      'Autonomous Test Agent',
      testAgentUrl,
      '/health'
    );
    results.push(testAgentResult);

    return results;
  }

  async generateReport(results, environment = 'local') {
    const report = {
      environment,
      timestamp: new Date().toISOString(),
      totalServices: results.length,
      healthyServices: results.filter(r => r.status === 'healthy').length,
      unhealthyServices: results.filter(r => r.status !== 'healthy').length,
      overallHealth: results.every(r => r.status === 'healthy') ? 'HEALTHY' : 'ISSUES_DETECTED',
      services: results
    };

    const reportPath = path.join(process.cwd(), 'validation-reports', `${environment}-validation-${Date.now()}.json`);
    
    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      this.log(`Validation report saved: ${reportPath}`);
    } catch (error) {
      this.log(`Failed to save validation report: ${error.message}`, 'ERROR');
    }

    return report;
  }

  async printReport(report) {
    this.log(`\\n=== ${report.environment.toUpperCase()} VALIDATION REPORT ===`);
    this.log(`Timestamp: ${report.timestamp}`);
    this.log(`Overall Health: ${report.overallHealth}`);
    this.log(`Services: ${report.healthyServices}/${report.totalServices} healthy`);
    
    this.log('\\nService Details:');
    report.services.forEach(service => {
      const status = service.status === 'healthy' ? 'PASS' : 'FAIL';
      this.log(`  ${service.service}: ${status} (${service.url})`);
      
      if (service.error) {
        this.log(`    Error: ${service.error}`, 'ERROR');
      }
      
      if (service.responseTime) {
        this.log(`    Response Time: ${service.responseTime}`);
      }
    });
  }

  async run() {
    const environment = process.argv[2] || 'local';
    
    this.log(`Starting deployment validation for ${environment}...`);
    
    try {
      let results;
      
      if (environment === 'local') {
        results = await this.validateLocalServices();
      } else {
        results = await this.validateRailwayEnvironment(environment);
      }
      
      const report = await this.generateReport(results, environment);
      await this.printReport(report);
      
      if (report.overallHealth === 'HEALTHY') {
        this.log('\\nALL SERVICES HEALTHY - DEPLOYMENT VALIDATED SUCCESSFULLY!', 'SUCCESS');
        process.exit(0);
      } else {
        this.log('\\nISSUES DETECTED - DEPLOYMENT NEEDS ATTENTION!', 'WARN');
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'ERROR');
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DeploymentValidator();
  validator.run();
}

export default DeploymentValidator;