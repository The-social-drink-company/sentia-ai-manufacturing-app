/**
 * Enterprise Compliance Automation Engine - Refactored Entry Point
 * This file now serves as a facade for the modular compliance system
 */

import { ComplianceEngine } from './compliance/ComplianceEngine.js';

// Re-export the main engine for backward compatibility
export default ComplianceEngine;
export { ComplianceEngine };

// Export sub-modules for direct access if needed
export { SOC2Validator } from './compliance/standards/soc2.js';
export { GDPRValidator } from './compliance/standards/gdpr.js';
export { ComplianceReporter } from './compliance/reporting/ComplianceReporter.js';
export { EvidenceCollector } from './compliance/evidence/EvidenceCollector.js';
export { ComplianceMonitor } from './compliance/monitoring/ComplianceMonitor.js';

/**
 * Factory function to create a fully configured compliance engine
 */
export function createComplianceEngine(config = {}) {
  const defaultConfig = {
    enabled: true,
    autoRemediation: true,
    continuousMonitoring: true,
    alerting: true,
    standards: {
      soc2: { enabled: true },
      gdpr: { enabled: true }
    },
    reporting: {
      formats: ['json', 'html'],
      outputDir: './reports/compliance'
    },
    monitoring: {
      interval: 3600000, // 1 hour
      alertThreshold: 80
    }
  };

  const mergedConfig = {
    ...defaultConfig,
    ...config,
    standards: { ...defaultConfig.standards, ...config.standards },
    reporting: { ...defaultConfig.reporting, ...config.reporting },
    monitoring: { ...defaultConfig.monitoring, ...config.monitoring }
  };

  return new ComplianceEngine(mergedConfig);
}