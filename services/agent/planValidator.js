/**
 * Agent Plan Validator
 * Validates and lints agent execution plans for safety
 */

import { policyGuard } from './policyGuard.js';
import { logWarn } from '../observability/structuredLogger.js';

// Validation rules with plain-English messages
const VALIDATION_RULES = {
  UNKNOWN_TOOL: {
    check: (step, allowedTools) => allowedTools.includes(step.tool),
    message: (step) => `Unknown tool '${step.tool}' - this tool is not recognized by the system`
  },
  
  EMPTY_PARAMS: {
    check: (step) => step.params && Object.keys(step.params).length > 0,
    message: () => 'Tool parameters cannot be empty - please provide required parameters'
  },
  
  HORIZON_CAP: {
    check: (step, _, clamps) => {
      if (step.tool !== 'forecast.run') return true;
      return !step.params?.horizon || step.params.horizon <= clamps.horizonDaysMax;
    },
    message: (step, clamps) => 
      `Forecast horizon exceeds ${clamps.horizonDaysMax} days limit - please reduce the time period`
  },
  
  WC_CAP: {
    check: (step, _, clamps) => {
      if (!step.tool.startsWith('wc.')) return true;
      return !step.params?.maxWc || step.params.maxWc <= clamps.wcCapMax;
    },
    message: (step, clamps) => 
      `Would exceed £${(clamps.wcCapMax/1000).toFixed(0)}k working capital cap - please reduce the amount`
  },
  
  PCT_BOUNDS: {
    check: (step, _, clamps) => {
      if (!step.params?.magnitude && !step.params?.change) return true;
      const val = step.params.magnitude || step.params.change;
      return val >= clamps.pctBounds[0] && val <= clamps.pctBounds[1];
    },
    message: (step, clamps) => 
      `Percentage change must be between ${clamps.pctBounds[0]*100}% and ${clamps.pctBounds[1]*100}%`
  },
  
  MUTATING_WITHOUT_APPROVAL: {
    check: (step, _, __, mode, approvalToken) => {
      const mutatingTools = ['stock.optimize', 'wc.adjust', 'scenarios.apply'];
      if (!mutatingTools.includes(step.tool)) return true;
      if (mode === 'DRY_RUN') return true;
      return mode === 'PROPOSE' || !!approvalToken;
    },
    message: (step) => 
      `Tool '${step.tool}' would modify data - approval required before execution`
  },
  
  ENTITY_SCOPE: {
    check: (step, _, __, ___, ____, scope, userRole) => {
      if (!scope?.entity) return true;
      if (userRole === 'admin') return true;
      // TODO: Check entity assignment for user
      return true;
    },
    message: (step, _, scope) => 
      `Access denied to entity '${scope.entity}' - you don't have permission for this business unit`
  },
  
  FREEZE_WINDOW: {
    check: () => !policyGuard.isInFreezeWindow(),
    message: () => 
      'System is in month-end freeze window - no changes allowed during financial close period'
  },
  
  STEP_SEQUENCE: {
    check: (step, _, __, ___, ____, _____, ______, allSteps) => {
      // Check dependencies are met
      if (!step.dependsOn) return true;
      const stepIndex = allSteps.findIndex(s => s.id === step.id);
      return step.dependsOn.every(depId => 
        allSteps.findIndex(s => s.id === depId) < stepIndex
      );
    },
    message: (step) => 
      `Step dependencies not met - required steps must complete before this action`
  }
};

export class PlanValidator {
  constructor() {
    this.validationCache = new Map();
    this.cacheTtl = 30000; // 30 seconds
  }

  /**
   * Validate a plan
   */
  async validate(plan, options = {}) {
    const {
      scope = {},
      mode = 'DRY_RUN',
      userId = null,
      userRole = 'viewer',
      approvalToken = null
    } = options;

    // Get user policy
    const policy = await policyGuard.getEffectivePolicy(userId, userRole);
    
    const errors = [];
    const warnings = [];
    const context = {
      allowedTools: policy.allowedTools,
      clamps: policy.numericClamps,
      mode,
      approvalToken,
      scope,
      userRole
    };

    // Check plan-level constraints
    if (!plan || !plan.steps || plan.steps.length === 0) {
      errors.push('Plan must contain at least one step');
    }

    if (plan.steps && plan.steps.length > policy.maxSteps) {
      errors.push(
        `Plan contains ${plan.steps.length} steps but maximum allowed is ${policy.maxSteps} - ` +
        `please reduce the number of operations`
      );
    }

    // Validate each step
    if (plan.steps) {
      for (const step of plan.steps) {
        const stepErrors = await this.validateStep(step, context, plan.steps);
        errors.push(...stepErrors.errors);
        warnings.push(...stepErrors.warnings);
      }
    }

    // Check cumulative constraints
    const cumulativeChecks = this.checkCumulativeConstraints(plan, policy);
    errors.push(...cumulativeChecks.errors);
    warnings.push(...cumulativeChecks.warnings);

    // Generate normalized plan if valid
    const isValid = errors.length === 0;
    const normalizedPlan = isValid ? this.normalizePlan(plan, policy) : null;

    // Log validation result
    if (!isValid) {
      logWarn('Plan validation failed', {
        errors,
        warnings,
        planId: plan.id,
        userId
      });
      
      // Record in safety metrics
      await policyGuard.recordBlocked('plan_validation', { 
        errors: errors.length,
        warnings: warnings.length 
      });
    }

    return {
      ok: isValid,
      errors,
      warnings,
      normalizedPlan,
      policy: {
        maxSteps: policy.maxSteps,
        wallClockMs: policy.wallClockMs,
        defaultMode: policy.defaultMode
      }
    };
  }

  /**
   * Validate a single step
   */
  async validateStep(step, context, allSteps) {
    const errors = [];
    const warnings = [];

    // Run each validation rule
    for (const [ruleName, rule] of Object.entries(VALIDATION_RULES)) {
      const passed = rule.check(
        step,
        context.allowedTools,
        context.clamps,
        context.mode,
        context.approvalToken,
        context.scope,
        context.userRole,
        allSteps
      );

      if (!passed) {
        const message = rule.message(step, context.clamps, context.scope);
        
        // Some rules produce warnings in certain modes
        if (ruleName === 'MUTATING_WITHOUT_APPROVAL' && context.mode === 'DRY_RUN') {
          warnings.push(`Step ${step.id}: ${message} (dry-run mode)`);
        } else {
          errors.push(`Step ${step.id}: ${message}`);
        }
      }
    }

    // Validate parameters with schema
    const paramValidation = await policyGuard.validateToolParams(
      step.tool,
      step.params,
      { numericClamps: context.clamps }
    );
    
    if (!paramValidation.valid) {
      errors.push(`Step ${step.id}: ${paramValidation.reason}`);
    }

    return { errors, warnings };
  }

  /**
   * Check cumulative constraints across all steps
   */
  checkCumulativeConstraints(plan, policy) {
    const errors = [];
    const warnings = [];

    // Check total execution time estimate
    const estimatedTime = (plan.steps?.length || 0) * 15000; // 15s per step estimate
    if (estimatedTime > policy.wallClockMs) {
      warnings.push(
        `Estimated execution time (${Math.ceil(estimatedTime/1000)}s) may exceed ` +
        `time limit (${Math.ceil(policy.wallClockMs/1000)}s)`
      );
    }

    // Check for duplicate tools (potential loop)
    const toolCounts = {};
    for (const step of plan.steps || []) {
      toolCounts[step.tool] = (toolCounts[step.tool] || 0) + 1;
    }
    
    for (const [tool, count] of Object.entries(toolCounts)) {
      if (count > 3) {
        warnings.push(
          `Tool '${tool}' used ${count} times - consider consolidating operations`
        );
      }
    }

    // Check for risky combinations
    const hasOptimization = plan.steps?.some(s => s.tool === 'stock.optimize');
    const hasScenario = plan.steps?.some(s => s.tool === 'scenarios.apply');
    if (hasOptimization && hasScenario) {
      warnings.push(
        'Plan combines optimization with scenario application - results may conflict'
      );
    }

    return { errors, warnings };
  }

  /**
   * Normalize and sanitize plan
   */
  normalizePlan(plan, policy) {
    const normalized = {
      ...plan,
      id: plan.id || this.generatePlanId(),
      mode: plan.mode || policy.defaultMode,
      maxSteps: policy.maxSteps,
      wallClockMs: policy.wallClockMs,
      steps: []
    };

    // Normalize each step
    for (const step of plan.steps || []) {
      normalized.steps.push({
        ...step,
        id: step.id || this.generateStepId(),
        retries: Math.min(step.retries || 0, 2),
        timeout: Math.min(step.timeout || 30000, 60000)
      });
    }

    return normalized;
  }

  /**
   * Lint a plan and suggest improvements
   */
  async lint(plan, options = {}) {
    const validation = await this.validate(plan, options);
    const suggestions = [];

    // Suggest fixes for common issues
    if (validation.errors.some(e => e.includes('horizon exceeds'))) {
      suggestions.push('Consider breaking long forecasts into smaller time periods');
    }

    if (validation.errors.some(e => e.includes('working capital cap'))) {
      suggestions.push('Try optimizing in phases with smaller budget increments');
    }

    if (validation.warnings.some(w => w.includes('Tool') && w.includes('used'))) {
      suggestions.push('Combine multiple calls to the same tool into a single batch operation');
    }

    // Check for missing best practices
    const hasForecast = plan.steps?.some(s => s.tool === 'forecast.run');
    const hasOptimization = plan.steps?.some(s => s.tool === 'stock.optimize');
    
    if (hasOptimization && !hasForecast) {
      suggestions.push('Consider running a forecast before optimization for better results');
    }

    return {
      ...validation,
      suggestions
    };
  }

  /**
   * Generate unique plan ID
   */
  generatePlanId() {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique step ID
   */
  generateStepId() {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if plan can be auto-approved
   */
  canAutoApprove(plan, userRole) {
    // Only dry-run and read-only operations can be auto-approved
    if (plan.mode !== 'DRY_RUN') return false;
    
    const readOnlyTools = [
      'forecast.accuracy',
      'wc.diagnostics',
      'stock.levels'
    ];
    
    return plan.steps?.every(step => readOnlyTools.includes(step.tool));
  }

  /**
   * Get example plans for testing
   */
  getExamplePlans() {
    return {
      safe: {
        id: 'example_safe',
        mode: 'DRY_RUN',
        steps: [
          {
            id: 'step1',
            tool: 'forecast.accuracy',
            params: { horizon: 30 }
          },
          {
            id: 'step2',
            tool: 'wc.diagnostics',
            params: {}
          }
        ]
      },
      risky: {
        id: 'example_risky',
        mode: 'EXECUTE',
        steps: [
          {
            id: 'step1',
            tool: 'stock.optimize',
            params: { targetServiceLevel: 0.95, maxWc: 2000000 }
          },
          {
            id: 'step2',
            tool: 'scenarios.apply',
            params: { type: 'fx-shock', magnitude: 0.8 }
          }
        ]
      }
    };
  }
}

// Singleton instance
export const planValidator = new PlanValidator();

export default {
  PlanValidator,
  planValidator,
  VALIDATION_RULES
};