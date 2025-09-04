/**
 * Agent Policy Guard
 * Enforces tool allowlists, budgets, clamps, and approval gates
 */

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logError, logWarn, logInfo } from '../observability/structuredLogger.js';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// Default safe numeric clamps
const DEFAULT_CLAMPS = {
  horizonDaysMax: 180,
  orderQtyMax: 100000,
  pctBounds: [-0.5, 0.5],
  wcCapMax: 1000000,
  minCashFloor: 0
};

// Tool parameter schemas for validation
const TOOL_SCHEMAS = {
  'forecast.run': z.object({
    horizon: z.number().min(1).max(180),
    entity: z.string().optional(),
    region: z.string().optional()
  }),
  'stock.optimize': z.object({
    targetServiceLevel: z.number().min(0.5).max(1),
    maxWc: z.number().min(0).optional()
  }),
  'wc.project': z.object({
    months: z.number().min(1).max(24),
    scenario: z.string().optional()
  }),
  'scenarios.generate': z.object({
    type: z.enum(['fx-shock', 'demand-spike', 'supply-disruption']),
    magnitude: z.number().min(-0.5).max(0.5)
  })
};

export class PolicyGuard {
  constructor() {
    this.policyCache = new Map();
    this.cacheTtl = 60000; // 1 minute
    this.stepBudgets = new Map();
  }

  /**
   * Get effective policy for a user/role
   */
  async getEffectivePolicy(userId, userRole) {
    const cacheKey = `${userId}:${userRole}`;
    const cached = this.policyCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.policy;
    }

    try {
      // Fetch policy from database
      const policy = await prisma.agentPolicies.findFirst({
        where: {
          roleScope: userRole,
          active: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!policy) {
        // Return default restrictive policy
        return this.getDefaultPolicy(userRole);
      }

      // Merge with environment overrides
      const effective = this.mergeWithEnv(policy);
      
      // Cache the result
      this.policyCache.set(cacheKey, {
        policy: effective,
        timestamp: Date.now()
      });

      return effective;
    } catch (error) {
      logError('Failed to fetch policy', error);
      return this.getDefaultPolicy(userRole);
    }
  }

  /**
   * Default restrictive policy
   */
  getDefaultPolicy(role) {
    const readOnlyTools = [
      'forecast.accuracy',
      'wc.diagnostics',
      'stock.levels'
    ];

    const managerTools = [
      ...readOnlyTools,
      'forecast.run',
      'stock.optimize',
      'wc.project'
    ];

    const adminTools = [
      ...managerTools,
      'scenarios.generate',
      'wc.exposure'
    ];

    return {
      roleScope: role,
      allowedTools: role === 'admin' ? adminTools : 
                    role === 'manager' ? managerTools : readOnlyTools,
      defaultMode: process.env.AGENT_DEFAULT_MODE || 'DRY_RUN',
      maxSteps: parseInt(process.env.AGENT_MAX_STEPS) || 12,
      wallClockMs: parseInt(process.env.AGENT_WALL_CLOCK_MS) || 180000,
      perToolBudgets: {},
      numericClamps: DEFAULT_CLAMPS,
      requireStepUp: process.env.AGENT_EXECUTE_REQUIRE_STEPUP !== 'false'
    };
  }

  /**
   * Merge policy with environment variables
   */
  mergeWithEnv(policy) {
    const envClamps = process.env.AGENT_SAFE_NUMERIC_CLAMPS;
    const clamps = envClamps ? JSON.parse(envClamps) : policy.numericClampsJson;

    return {
      ...policy,
      defaultMode: process.env.AGENT_DEFAULT_MODE || policy.defaultMode,
      maxSteps: parseInt(process.env.AGENT_MAX_STEPS) || policy.maxSteps,
      wallClockMs: parseInt(process.env.AGENT_WALL_CLOCK_MS) || policy.wallClockMs,
      numericClamps: { ...DEFAULT_CLAMPS, ...clamps },
      requireStepUp: process.env.AGENT_EXECUTE_REQUIRE_STEPUP === 'true' || policy.requireStepUp
    };
  }

  /**
   * Check if tool is allowed
   */
  async checkToolAllowed(toolId, userId, userRole) {
    const policy = await this.getEffectivePolicy(userId, userRole);
    
    if (!policy.allowedTools.includes(toolId)) {
      await this.recordBlocked('disallowed_tool', toolId);
      return {
        allowed: false,
        reason: `Tool '${toolId}' not allowed for role '${userRole}'`
      };
    }

    return { allowed: true };
  }

  /**
   * Validate tool parameters
   */
  async validateToolParams(toolId, params, policy) {
    const schema = TOOL_SCHEMAS[toolId];
    if (!schema) {
      return { valid: true }; // No schema defined, allow
    }

    try {
      const validated = schema.parse(params);
      
      // Apply numeric clamps
      const clamped = this.applyClamps(toolId, validated, policy.numericClamps);
      
      return { valid: true, params: clamped };
    } catch (error) {
      await this.recordBlocked('invalid_params', toolId);
      return {
        valid: false,
        reason: `Invalid parameters: ${error.message}`
      };
    }
  }

  /**
   * Apply numeric clamps to parameters
   */
  applyClamps(toolId, params, clamps) {
    const clamped = { ...params };

    // Apply tool-specific clamps
    switch (toolId) {
      case 'forecast.run':
        if (clamped.horizon > clamps.horizonDaysMax) {
          clamped.horizon = clamps.horizonDaysMax;
        }
        break;
      
      case 'stock.optimize':
        if (clamped.maxWc && clamped.maxWc > clamps.wcCapMax) {
          clamped.maxWc = clamps.wcCapMax;
        }
        break;
      
      case 'scenarios.generate':
        if (clamped.magnitude < clamps.pctBounds[0]) {
          clamped.magnitude = clamps.pctBounds[0];
        }
        if (clamped.magnitude > clamps.pctBounds[1]) {
          clamped.magnitude = clamps.pctBounds[1];
        }
        break;
    }

    return clamped;
  }

  /**
   * Check tool budget
   */
  async checkToolBudget(runId, toolId, policy) {
    const key = `${runId}:${toolId}`;
    const budget = policy.perToolBudgets?.[toolId];
    
    if (!budget) {
      return { allowed: true }; // No budget defined
    }

    const current = this.stepBudgets.get(key) || 0;
    
    if (current >= budget.maxInvocations) {
      await this.recordBlocked('budget_exceeded', toolId);
      return {
        allowed: false,
        reason: `Tool budget exceeded: ${current}/${budget.maxInvocations} invocations`
      };
    }

    // Update counter
    this.stepBudgets.set(key, current + 1);
    
    return { allowed: true };
  }

  /**
   * Validate complete plan
   */
  async validatePlan(plan, scope, mode, userId, userRole) {
    const policy = await this.getEffectivePolicy(userId, userRole);
    const errors = [];
    const warnings = [];
    
    // Check freeze window
    if (this.isInFreezeWindow()) {
      errors.push('System is in freeze window - no changes allowed');
    }

    // Check total steps
    if (plan.steps && plan.steps.length > policy.maxSteps) {
      errors.push(`Plan exceeds maximum steps: ${plan.steps.length}/${policy.maxSteps}`);
    }

    // Validate each step
    if (plan.steps) {
      for (const step of plan.steps) {
        // Check tool allowlist
        const toolCheck = await this.checkToolAllowed(step.tool, userId, userRole);
        if (!toolCheck.allowed) {
          errors.push(`Step ${step.id}: ${toolCheck.reason}`);
        }

        // Validate parameters
        const paramCheck = await this.validateToolParams(step.tool, step.params, policy);
        if (!paramCheck.valid) {
          errors.push(`Step ${step.id}: ${paramCheck.reason}`);
        }

        // Check for mutating operations
        if (this.isMutatingTool(step.tool) && mode === 'DRY_RUN') {
          warnings.push(`Step ${step.id}: Tool '${step.tool}' would mutate data (dry-run mode)`);
        }

        // Require approval for mutating ops in EXECUTE mode
        if (this.isMutatingTool(step.tool) && mode === 'EXECUTE' && !plan.approvalToken) {
          errors.push(`Step ${step.id}: Approval required for mutating operation`);
        }
      }
    }

    // Check scope restrictions
    if (scope?.entity && !this.isEntityAllowed(scope.entity, userRole)) {
      errors.push(`Entity '${scope.entity}' not allowed for role '${userRole}'`);
    }

    // Return validation result
    const isValid = errors.length === 0;
    
    if (!isValid) {
      await this.recordBlocked('plan_validation', { errors, warnings });
    }

    return {
      ok: isValid,
      errors,
      warnings,
      normalizedPlan: isValid ? this.normalizePlan(plan, policy) : null
    };
  }

  /**
   * Check if tool is mutating
   */
  isMutatingTool(toolId) {
    const mutatingTools = [
      'stock.optimize',
      'wc.adjust',
      'scenarios.apply'
    ];
    return mutatingTools.includes(toolId);
  }

  /**
   * Check if in freeze window
   */
  isInFreezeWindow() {
    const freezeCron = process.env.FREEZE_WINDOW_CRON_MONTH_END;
    if (!freezeCron) return false;

    const now = new Date();
    const day = now.getDate();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    // Freeze last 3 days of month
    return day >= lastDay - 2;
  }

  /**
   * Check entity access
   */
  isEntityAllowed(entity, role) {
    // Admins can access all entities
    if (role === 'admin') return true;
    
    // Managers can access their assigned entities
    // TODO: Implement entity assignment check
    return true;
  }

  /**
   * Normalize plan with policy constraints
   */
  normalizePlan(plan, policy) {
    return {
      ...plan,
      maxSteps: Math.min(plan.steps?.length || 0, policy.maxSteps),
      wallClockMs: policy.wallClockMs,
      mode: policy.defaultMode
    };
  }

  /**
   * Verify approval token
   */
  async verifyApproval(runId, stepId, approvalToken) {
    if (!approvalToken) {
      return { valid: false, reason: 'No approval token provided' };
    }

    try {
      const approval = await prisma.agentApprovals.findFirst({
        where: {
          runId,
          stepId,
          stepUpToken: approvalToken,
          decision: 'APPROVED',
          expiresAt: { gt: new Date() }
        }
      });

      if (!approval) {
        return { valid: false, reason: 'Invalid or expired approval token' };
      }

      return { valid: true, approval };
    } catch (error) {
      logError('Failed to verify approval', error);
      return { valid: false, reason: 'Approval verification failed' };
    }
  }

  /**
   * Create step-up token
   */
  async createStepUpToken(userId, duration = 300000) {
    const token = createHash('sha256')
      .update(`${userId}:${Date.now()}:${Math.random()}`)
      .digest('hex');
    
    const expiresAt = new Date(Date.now() + duration);
    
    return { token, expiresAt };
  }

  /**
   * Record blocked action
   */
  async recordBlocked(type, details) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.agentSafetyMetrics.upsert({
        where: { period: today },
        create: {
          period: today,
          blockedPlans: type === 'plan_validation' ? 1 : 0,
          blockedStepsByRule: type.startsWith('blocked_') ? { [type]: 1 } : {},
          exceededBudgets: type === 'budget_exceeded' ? 1 : 0,
          disallowedTools: type === 'disallowed_tool' ? { [details]: 1 } : {}
        },
        update: {
          blockedPlans: type === 'plan_validation' 
            ? { increment: 1 } 
            : undefined,
          exceededBudgets: type === 'budget_exceeded' 
            ? { increment: 1 } 
            : undefined
        }
      });
    } catch (error) {
      logWarn('Failed to record blocked action', { type, error: error.message });
    }
  }

  /**
   * Get safety metrics
   */
  async getSafetyMetrics(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    try {
      const metrics = await prisma.agentSafetyMetrics.findMany({
        where: {
          period: { gte: startDate }
        },
        orderBy: { period: 'desc' }
      });

      // Aggregate totals
      const totals = metrics.reduce((acc, m) => ({
        blockedPlans: acc.blockedPlans + m.blockedPlans,
        exceededBudgets: acc.exceededBudgets + m.exceededBudgets,
        approvalRequests: acc.approvalRequests + m.approvalRequests,
        approvalsGranted: acc.approvalsGranted + m.approvalsGranted,
        approvalsRejected: acc.approvalsRejected + m.approvalsRejected,
        rateLimitHits: acc.rateLimitHits + m.rateLimitHits,
        freezeWindowBlocks: acc.freezeWindowBlocks + m.freezeWindowBlocks
      }), {
        blockedPlans: 0,
        exceededBudgets: 0,
        approvalRequests: 0,
        approvalsGranted: 0,
        approvalsRejected: 0,
        rateLimitHits: 0,
        freezeWindowBlocks: 0
      });

      return {
        period: `${days}d`,
        totals,
        daily: metrics
      };
    } catch (error) {
      logError('Failed to get safety metrics', error);
      return null;
    }
  }

  /**
   * Clear expired data
   */
  async cleanup() {
    // Clear expired approvals
    await prisma.agentApprovals.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    // Clear old step budgets
    for (const [key, _] of this.stepBudgets.entries()) {
      const [runId] = key.split(':');
      // Check if run is still active
      const run = await prisma.agentRuns.findUnique({
        where: { id: runId },
        select: { status: true }
      });
      
      if (!run || run.status === 'COMPLETED' || run.status === 'FAILED') {
        this.stepBudgets.delete(key);
      }
    }
  }
}

// Singleton instance
export const policyGuard = new PolicyGuard();

// Middleware for Express routes
export const policyMiddleware = (requiredMode = null) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role || 'viewer';
      
      // Get effective policy
      const policy = await policyGuard.getEffectivePolicy(userId, userRole);
      
      // Check mode restrictions
      if (requiredMode && requiredMode === 'EXECUTE') {
        if (process.env.AGENT_DENY_EXECUTE_IN_NON_PROD === 'true' && 
            process.env.NODE_ENV !== 'production') {
          return res.status(403).json({
            success: false,
            error: 'EXECUTE mode not allowed in non-production environment'
          });
        }
        
        if (policy.requireStepUp && !req.headers['x-step-up-token']) {
          return res.status(403).json({
            success: false,
            error: 'Step-up authentication required for EXECUTE mode'
          });
        }
      }
      
      // Attach policy to request
      req.agentPolicy = policy;
      next();
    } catch (error) {
      logError('Policy middleware error', error);
      res.status(500).json({
        success: false,
        error: 'Policy validation failed'
      });
    }
  };
};

export default {
  PolicyGuard,
  policyGuard,
  policyMiddleware
};