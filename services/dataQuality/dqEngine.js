/**
 * Data Quality Rules Engine
 * Implements DQ rule types and execution logic
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { logInfo, logWarn, logError } from '../logger.js';

const prisma = new PrismaClient();

// Rule type definitions
const RULE_TYPES = {
  REQUIRED_RATE: 'required_rate',
  FK_HIT_RATE: 'fk_hit_rate',
  RANGE_CHECK: 'range_check',
  FRESHNESS: 'freshness',
  OUTLIER_RATE: 'outlier_rate',
  UNIQUENESS: 'uniqueness',
  COMPLETENESS: 'completeness',
  FORMAT_CHECK: 'format_check',
  BUSINESS_RULE: 'business_rule'
};

// Default SLOs from environment
const DEFAULT_FRESHNESS_SLOS = {
  sales: 24,      // hours
  inventory: 12,   // hours
  arap: 48        // hours
};

export class DQEngine {
  constructor() {
    this.rules = new Map();
    this.freshnessSLOs = this.loadFreshnessSLOs();
    this.failInProd = process.env.DQ_FAIL_IN_PROD === 'true';
  }

  /**
   * Load freshness SLOs from environment
   */
  loadFreshnessSLOs() {
    try {
      const sloConfig = process.env.DQ_FRESHNESS_SLO;
      if (sloConfig) {
        const parsed = JSON.parse(sloConfig);
        return {
          sales: parsed.salesHours || DEFAULT_FRESHNESS_SLOS.sales,
          inventory: parsed.inventoryHours || DEFAULT_FRESHNESS_SLOS.inventory,
          arap: parsed.arapHours || DEFAULT_FRESHNESS_SLOS.arap
        };
      }
    } catch (error) {
      logWarn('Failed to parse DQ_FRESHNESS_SLO, using defaults', error);
    }
    return DEFAULT_FRESHNESS_SLOS;
  }

  /**
   * Execute DQ run for a dataset
   */
  async runDQChecks(dataset, options = {}) {
    const runId = crypto.randomUUID();
    const startTime = new Date();
    
    logInfo('Starting DQ run', { runId, dataset });

    try {
      // Create run record
      const run = await prisma.dQRuns.create({
        data: {
          id: runId,
          dataset,
          startedAt: startTime,
          status: 'RUNNING',
          profileId: options.profileId,
          totalRules: 0,
          passedRules: 0,
          failedRules: 0,
          warnedRules: 0
        }
      });

      // Load active rules for dataset
      const rules = await this.loadRules(dataset);
      const rulesetHash = this.computeRulesetHash(rules);
      
      // Execute each rule
      const findings = [];
      let passedCount = 0;
      let failedCount = 0;
      let warnedCount = 0;

      for (const rule of rules) {
        try {
          const result = await this.executeRule(dataset, rule);
          
          if (result.findings && result.findings.length > 0) {
            for (const finding of result.findings) {
              findings.push({
                runId,
                ruleKey: rule.ruleKey,
                severity: this.adjustSeverityForProd(rule.severity),
                count: finding.count,
                sampleRef: finding.sampleRef,
                impactValueBase: finding.impactValue,
                impactCurrency: finding.impactCurrency || 'GBP',
                notes: finding.notes
              });
            }
            
            if (rule.severity === 'FAIL') {
              failedCount++;
            } else {
              warnedCount++;
            }
          } else {
            passedCount++;
          }
        } catch (error) {
          logError(`Rule execution failed: ${rule.ruleKey}`, error);
          failedCount++;
        }
      }

      // Save findings
      if (findings.length > 0) {
        await prisma.dQFindings.createMany({
          data: findings
        });
      }

      // Update run with results
      await prisma.dQRuns.update({
        where: { id: runId },
        data: {
          finishedAt: new Date(),
          status: 'SUCCESS',
          rulesetHash,
          totalRules: rules.length,
          passedRules: passedCount,
          failedRules: failedCount,
          warnedRules: warnedCount
        }
      });

      // Calculate impact summary
      const impactSummary = await this.calculateImpactSummary(findings);

      logInfo('DQ run completed', {
        runId,
        dataset,
        passed: passedCount,
        failed: failedCount,
        warned: warnedCount,
        impactGBP: impactSummary.totalGBP
      });

      return {
        runId,
        status: 'SUCCESS',
        summary: {
          totalRules: rules.length,
          passed: passedCount,
          failed: failedCount,
          warned: warnedCount
        },
        impact: impactSummary,
        findings: findings.slice(0, 10) // Top 10 findings
      };

    } catch (error) {
      logError('DQ run failed', error);
      
      await prisma.dQRuns.update({
        where: { id: runId },
        data: {
          finishedAt: new Date(),
          status: 'FAILED'
        }
      });

      throw error;
    }
  }

  /**
   * Load active rules for a dataset
   */
  async loadRules(dataset) {
    const rules = await prisma.dQRules.findMany({
      where: {
        dataset,
        active: true
      }
    });

    // Add default rules if none exist
    if (rules.length === 0) {
      rules.push(...this.getDefaultRules(dataset));
    }

    return rules;
  }

  /**
   * Execute a single rule
   */
  async executeRule(dataset, rule) {
    const ruleType = rule.configJson?.type || RULE_TYPES.REQUIRED_RATE;
    const config = rule.configJson || {};

    switch (ruleType) {
      case RULE_TYPES.REQUIRED_RATE:
        return this.checkRequiredRate(dataset, config);
      
      case RULE_TYPES.FRESHNESS:
        return this.checkFreshness(dataset, config);
      
      case RULE_TYPES.RANGE_CHECK:
        return this.checkRange(dataset, config);
      
      case RULE_TYPES.UNIQUENESS:
        return this.checkUniqueness(dataset, config);
      
      case RULE_TYPES.FK_HIT_RATE:
        return this.checkForeignKeyHitRate(dataset, config);
      
      case RULE_TYPES.OUTLIER_RATE:
        return this.checkOutlierRate(dataset, config);
      
      default:
        logWarn(`Unknown rule type: ${ruleType}`);
        return { findings: [] };
    }
  }

  /**
   * Check required field completion rate
   */
  async checkRequiredRate(dataset, config) {
    const findings = [];
    const threshold = config.threshold || 0.95;
    
    // Example: Check sales data completeness
    if (dataset === 'sales') {
      const result = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN amount IS NOT NULL THEN 1 END) as completed
        FROM sales_orders
        WHERE created_at > NOW() - INTERVAL '7 days'
      `;
      
      if (result[0]) {
        const rate = result[0].completed / result[0].total;
        if (rate < threshold) {
          const missing = result[0].total - result[0].completed;
          const avgOrderValue = 1000; // Would calculate from actual data
          
          findings.push({
            count: missing,
            impactValue: missing * avgOrderValue,
            impactCurrency: 'GBP',
            notes: `Required field completion rate: ${(rate * 100).toFixed(1)}% (threshold: ${threshold * 100}%)`
          });
        }
      }
    }
    
    return { findings };
  }

  /**
   * Check data freshness against SLOs
   */
  async checkFreshness(dataset, config) {
    const findings = [];
    const sloHours = this.freshnessSLOs[dataset] || 24;
    
    // Get latest data timestamp
    let query;
    switch (dataset) {
      case 'sales':
        query = prisma.$queryRaw`
          SELECT MAX(created_at) as latest 
          FROM sales_orders
        `;
        break;
      case 'inventory':
        query = prisma.$queryRaw`
          SELECT MAX(updated_at) as latest 
          FROM inventory_levels
        `;
        break;
      case 'arap':
        query = prisma.$queryRaw`
          SELECT MAX(updated_at) as latest 
          FROM financial_transactions
        `;
        break;
      default:
        return { findings };
    }

    const result = await query;
    if (result[0]?.latest) {
      const ageHours = (Date.now() - new Date(result[0].latest)) / (1000 * 60 * 60);
      
      if (ageHours > sloHours) {
        findings.push({
          count: 1,
          notes: `Data is ${ageHours.toFixed(1)} hours old (SLO: ${sloHours} hours)`,
          impactValue: 0 // Freshness doesn't have direct monetary impact
        });
      }
    }
    
    return { findings };
  }

  /**
   * Check value ranges
   */
  async checkRange(dataset, config) {
    const findings = [];
    const field = config.field;
    const min = config.min;
    const max = config.max;
    
    if (!field) return { findings };

    // Example: Check for negative quantities
    if (dataset === 'inventory' && field === 'quantity') {
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) as count, SUM(ABS(quantity)) as total_qty
        FROM inventory_levels
        WHERE quantity < 0
      `;
      
      if (result[0]?.count > 0) {
        findings.push({
          count: result[0].count,
          impactValue: result[0].total_qty * 50, // Avg item value
          impactCurrency: 'GBP',
          notes: `Found ${result[0].count} items with negative quantities`
        });
      }
    }
    
    return { findings };
  }

  /**
   * Check uniqueness constraints
   */
  async checkUniqueness(dataset, config) {
    const findings = [];
    const field = config.field;
    
    if (!field) return { findings };

    // Example: Check for duplicate SKUs
    if (dataset === 'products' && field === 'sku') {
      const result = await prisma.$queryRaw`
        SELECT sku, COUNT(*) as count
        FROM products
        GROUP BY sku
        HAVING COUNT(*) > 1
      `;
      
      if (result.length > 0) {
        findings.push({
          count: result.length,
          sampleRef: result.slice(0, 5).map(r => r.sku).join(', '),
          notes: `Found ${result.length} duplicate SKUs`
        });
      }
    }
    
    return { findings };
  }

  /**
   * Check foreign key relationships
   */
  async checkForeignKeyHitRate(dataset, config) {
    const findings = [];
    const sourceTable = config.sourceTable;
    const targetTable = config.targetTable;
    const sourceField = config.sourceField;
    const targetField = config.targetField;
    const threshold = config.threshold || 0.95;
    
    if (!sourceTable || !targetTable) return { findings };

    // Example: Check sales orders with valid customers
    if (sourceTable === 'sales_orders' && targetTable === 'customers') {
      const result = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total,
          COUNT(c.id) as matched
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        WHERE so.created_at > NOW() - INTERVAL '7 days'
      `;
      
      if (result[0]) {
        const hitRate = result[0].matched / result[0].total;
        if (hitRate < threshold) {
          const orphaned = result[0].total - result[0].matched;
          findings.push({
            count: orphaned,
            notes: `FK hit rate: ${(hitRate * 100).toFixed(1)}% (threshold: ${threshold * 100}%)`
          });
        }
      }
    }
    
    return { findings };
  }

  /**
   * Check for statistical outliers
   */
  async checkOutlierRate(dataset, config) {
    const findings = [];
    const field = config.field;
    const stdDevs = config.stdDevs || 3;
    
    if (!field) return { findings };

    // Example: Check for order amount outliers
    if (dataset === 'sales' && field === 'amount') {
      const result = await prisma.$queryRaw`
        WITH stats AS (
          SELECT 
            AVG(amount) as mean,
            STDDEV(amount) as std_dev
          FROM sales_orders
          WHERE created_at > NOW() - INTERVAL '30 days'
        )
        SELECT COUNT(*) as count, SUM(amount) as total
        FROM sales_orders so, stats
        WHERE so.created_at > NOW() - INTERVAL '7 days'
          AND ABS(so.amount - stats.mean) > stats.std_dev * ${stdDevs}
      `;
      
      if (result[0]?.count > 0) {
        findings.push({
          count: result[0].count,
          impactValue: result[0].total,
          impactCurrency: 'GBP',
          notes: `Found ${result[0].count} outliers (>${stdDevs} std devs)`
        });
      }
    }
    
    return { findings };
  }

  /**
   * Get default rules for a dataset
   */
  getDefaultRules(dataset) {
    const defaults = [];
    
    switch (dataset) {
      case 'sales':
        defaults.push(
          {
            ruleKey: 'sales_freshness',
            severity: 'WARN',
            configJson: { type: RULE_TYPES.FRESHNESS }
          },
          {
            ruleKey: 'sales_required_fields',
            severity: 'FAIL',
            configJson: { type: RULE_TYPES.REQUIRED_RATE, threshold: 0.95 }
          }
        );
        break;
      
      case 'inventory':
        defaults.push(
          {
            ruleKey: 'inventory_freshness',
            severity: 'WARN',
            configJson: { type: RULE_TYPES.FRESHNESS }
          },
          {
            ruleKey: 'negative_quantities',
            severity: 'FAIL',
            configJson: { type: RULE_TYPES.RANGE_CHECK, field: 'quantity', min: 0 }
          }
        );
        break;
      
      case 'products':
        defaults.push(
          {
            ruleKey: 'unique_skus',
            severity: 'FAIL',
            configJson: { type: RULE_TYPES.UNIQUENESS, field: 'sku' }
          }
        );
        break;
    }
    
    return defaults;
  }

  /**
   * Adjust severity for production
   */
  adjustSeverityForProd(severity) {
    // In production, treat FAIL as WARN unless explicitly configured
    if (process.env.NODE_ENV === 'production' && !this.failInProd && severity === 'FAIL') {
      return 'WARN';
    }
    return severity;
  }

  /**
   * Calculate impact summary
   */
  async calculateImpactSummary(findings) {
    const summary = {
      totalGBP: 0,
      totalEUR: 0,
      totalUSD: 0,
      byRule: {}
    };

    for (const finding of findings) {
      if (finding.impactValueBase) {
        const value = parseFloat(finding.impactValueBase);
        
        switch (finding.impactCurrency) {
          case 'GBP':
            summary.totalGBP += value;
            break;
          case 'EUR':
            summary.totalEUR += value;
            break;
          case 'USD':
            summary.totalUSD += value;
            break;
        }
        
        if (!summary.byRule[finding.ruleKey]) {
          summary.byRule[finding.ruleKey] = 0;
        }
        summary.byRule[finding.ruleKey] += value;
      }
    }

    return summary;
  }

  /**
   * Compute hash of ruleset for tracking changes
   */
  computeRulesetHash(rules) {
    const sorted = rules.sort((a, b) => a.ruleKey.localeCompare(b.ruleKey));
    const content = JSON.stringify(sorted.map(r => ({
      key: r.ruleKey,
      severity: r.severity,
      config: r.configJson
    })));
    
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get freshness status for all datasets
   */
  async getFreshnessStatus() {
    const status = {};
    
    for (const [dataset, sloHours] of Object.entries(this.freshnessSLOs)) {
      const result = await this.checkFreshness(dataset, {});
      status[dataset] = {
        sloHours,
        isWithinSLO: result.findings.length === 0,
        findings: result.findings
      };
    }
    
    return status;
  }
}

// Singleton instance
export const dqEngine = new DQEngine();

export default {
  DQEngine,
  dqEngine,
  RULE_TYPES
};