/**
 * Agentic Orchestrator - Planner, Executor, and Reflector
 */

import { toolCatalog } from './toolCatalog.js';
import { logInfo, logError, logDebug, logWarn } from '../observability/structuredLogger.js';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AgentOrchestrator {
  constructor(options = {}) {
    this.maxSteps = parseInt(process.env.AGENT_MAX_STEPS) || 12;
    this.runTimeout = parseInt(process.env.AGENT_RUN_TIMEOUT_MS) || 180000;
    this.toolRetryMax = parseInt(process.env.AGENT_TOOL_RETRY_MAX) || 2;
    this.featureEnabled = process.env.FEATURE_AGENT === 'true';
    this.autopilotEnabled = process.env.FEATURE_AGENT_AUTOPILOT === 'true';
    this.allowlist = (process.env.AGENT_POLICY_ALLOWLIST || '').split(',').filter(Boolean);
    
    this.planner = new Planner(this);
    this.executor = new Executor(this);
    this.reflector = new Reflector(this);
  }

  async run(goal, options = {}) {
    if (!this.featureEnabled) {
      throw new Error('Agent feature is disabled');
    }

    const runId = crypto.randomUUID();
    const mode = options.mode || 'DRY_RUN';
    const scope = options.scope || {};
    const budgets = options.budgets || {};
    const userId = options.userId;

    logInfo('Agent run started', { runId, goal, mode, scope });

    // Create run record
    const run = await prisma.agentRuns.create({
      data: {
        id: runId,
        goal,
        mode,
        scope: JSON.stringify(scope),
        budgets: JSON.stringify(budgets),
        status: 'PLANNING',
        userId,
        startedAt: new Date()
      }
    });

    try {
      // Plan phase
      const plan = await this.planner.createPlan(goal, scope, budgets);
      await this.savePlan(runId, plan);

      if (mode === 'DRY_RUN') {
        // Just return the plan without executing
        const projectedOutcomes = await this.planner.projectOutcomes(plan);
        await prisma.agentRuns.update({
          where: { id: runId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            outcomes: JSON.stringify(projectedOutcomes)
          }
        });
        return { runId, plan, projectedOutcomes, mode: 'DRY_RUN' };
      }

      // Execute phase
      await prisma.agentRuns.update({
        where: { id: runId },
        data: { status: 'EXECUTING' }
      });

      const executionResults = await this.executor.executePlan(runId, plan, mode);

      // Reflect phase
      await prisma.agentRuns.update({
        where: { id: runId },
        data: { status: 'REFLECTING' }
      });

      const reflection = await this.reflector.evaluate(runId, plan, executionResults);
      const lessons = await this.reflector.extractLessons(reflection);
      const nextSteps = await this.reflector.suggestNextSteps(reflection);

      // Complete run
      await prisma.agentRuns.update({
        where: { id: runId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          outcomes: JSON.stringify(executionResults),
          reflection: JSON.stringify(reflection),
          lessons: JSON.stringify(lessons),
          nextSteps: JSON.stringify(nextSteps)
        }
      });

      return {
        runId,
        plan,
        executionResults,
        reflection,
        lessons,
        nextSteps
      };

    } catch (error) {
      logError('Agent run failed', error, { runId });
      
      await prisma.agentRuns.update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          error: error.message,
          completedAt: new Date()
        }
      });

      throw error;
    }
  }

  async savePlan(runId, plan) {
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      await prisma.agentSteps.create({
        data: {
          id: crypto.randomUUID(),
          runId,
          stepNumber: i + 1,
          toolId: step.toolId,
          params: JSON.stringify(step.params),
          dependencies: JSON.stringify(step.dependencies || []),
          expectedOutcome: JSON.stringify(step.expectedOutcome),
          status: 'PENDING'
        }
      });
    }
  }

  async getRunStatus(runId) {
    const run = await prisma.agentRuns.findUnique({
      where: { id: runId },
      include: {
        steps: true,
        invocations: true,
        reflections: true,
        approvals: true
      }
    });

    return run;
  }

  async approveStep(runId, stepId, approverId) {
    const approval = await prisma.approvals.create({
      data: {
        id: crypto.randomUUID(),
        runId,
        stepId,
        approverId,
        approvedAt: new Date(),
        decision: 'APPROVED'
      }
    });

    // Mark step as approved
    await prisma.agentSteps.update({
      where: { id: stepId },
      data: { status: 'APPROVED' }
    });

    return approval;
  }
}

class Planner {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
  }

  async createPlan(goal, scope, budgets) {
    logDebug('Creating plan', { goal, scope, budgets });

    // Parse goal and identify required tools
    const requiredCapabilities = this.analyzeGoal(goal);
    const availableTools = this.filterToolsByPolicy(requiredCapabilities);
    
    // Build execution plan
    const steps = this.buildSteps(goal, availableTools, scope, budgets);
    
    // Optimize and validate plan
    const optimizedPlan = this.optimizePlan(steps);
    this.validatePlan(optimizedPlan, budgets);

    return {
      goal,
      scope,
      budgets,
      steps: optimizedPlan,
      estimatedDuration: this.estimateDuration(optimizedPlan),
      requiredApprovals: this.identifyRequiredApprovals(optimizedPlan)
    };
  }

  analyzeGoal(goal) {
    const capabilities = [];
    
    // Pattern matching for common goals
    if (goal.includes('forecast') || goal.includes('demand')) {
      capabilities.push('forecasting');
    }
    if (goal.includes('stock') || goal.includes('inventory')) {
      capabilities.push('optimization');
    }
    if (goal.includes('working capital') || goal.includes('WC')) {
      capabilities.push('finance');
    }
    if (goal.includes('report') || goal.includes('board')) {
      capabilities.push('reporting');
    }
    if (goal.includes('drift') || goal.includes('accuracy')) {
      capabilities.push('forecasting', 'diagnostics');
    }
    if (goal.includes('FX') || goal.includes('currency')) {
      capabilities.push('finance', 'planning');
    }

    return capabilities;
  }

  filterToolsByPolicy(capabilities) {
    const allTools = toolCatalog.getAllTools();
    const allowlist = this.orchestrator.allowlist;

    return allTools.filter(tool => {
      // Check if tool is in allowlist
      if (allowlist.length > 0 && !allowlist.includes(tool.id)) {
        return false;
      }
      // Check if tool matches required capabilities
      return capabilities.includes(tool.category);
    });
  }

  buildSteps(goal, tools, scope, budgets) {
    const steps = [];
    
    // Example: Build a standard workflow based on goal patterns
    if (goal.includes('Protect service')) {
      // Workflow: Forecast -> Optimize -> WC Project -> Report
      steps.push({
        toolId: 'forecast.run',
        params: {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          method: 'ensemble'
        },
        dependencies: [],
        expectedOutcome: { type: 'forecast', metrics: ['mape', 'coverage'] }
      });

      steps.push({
        toolId: 'stock.optimize',
        params: {
          workingCapitalCap: budgets.workingCapitalCap || 1000000,
          serviceTarget: 0.95
        },
        dependencies: [0],
        expectedOutcome: { type: 'optimization', metrics: ['wc_reduction', 'service_level'] }
      });

      steps.push({
        toolId: 'wc.project',
        params: {
          horizon: 90,
          includeSeasonality: true
        },
        dependencies: [1],
        expectedOutcome: { type: 'projection', metrics: ['peak_wc', 'average_wc'] }
      });
    }

    if (goal.includes('drift watch')) {
      steps.push({
        toolId: 'forecast.diagnostics',
        params: {
          compareActuals: true
        },
        dependencies: [],
        expectedOutcome: { type: 'diagnostics', metrics: ['mape', 'drift_detected'] }
      });

      steps.push({
        toolId: 'forecast.accuracyTrend',
        params: {
          period: 'daily',
          lookback: 30
        },
        dependencies: [0],
        expectedOutcome: { type: 'trend', metrics: ['average_accuracy', 'improving'] }
      });
    }

    if (goal.includes('EU FX shock')) {
      steps.push({
        toolId: 'scenarios.generate',
        params: {
          scenarioType: 'fx_shock',
          parameters: { shock: -0.05, currency: 'EUR' },
          scope: { region: 'EU' }
        },
        dependencies: [],
        expectedOutcome: { type: 'scenario', metrics: ['impact', 'recommendations'] }
      });

      steps.push({
        toolId: 'wc.exposure',
        params: {
          currencies: ['EUR', 'GBP', 'USD'],
          includeHedging: true
        },
        dependencies: [0],
        expectedOutcome: { type: 'exposure', metrics: ['exposure_amount', 'hedged_percentage'] }
      });
    }

    // Add export step if needed
    if (goal.includes('report') || steps.length > 2) {
      steps.push({
        toolId: 'exports.boardPack',
        params: {
          period: 'current',
          includeCommentary: true
        },
        dependencies: steps.map((_, i) => i),
        expectedOutcome: { type: 'report', metrics: ['sections', 'highlights'] }
      });
    }

    return steps;
  }

  optimizePlan(steps) {
    // Remove redundant steps
    const seen = new Set();
    const optimized = [];

    for (const step of steps) {
      const key = `${step.toolId}-${JSON.stringify(step.params)}`;
      if (!seen.has(key)) {
        seen.add(key);
        optimized.push(step);
      }
    }

    // Reorder for optimal execution (topological sort based on dependencies)
    return this.topologicalSort(optimized);
  }

  topologicalSort(steps) {
    const sorted = [];
    const visited = new Set();

    const visit = (index) => {
      if (visited.has(index)) return;
      visited.add(index);

      const step = steps[index];
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          visit(dep);
        }
      }

      sorted.push(step);
    };

    for (let i = 0; i < steps.length; i++) {
      visit(i);
    }

    return sorted;
  }

  validatePlan(plan, budgets) {
    // Check step count
    if (plan.length > this.orchestrator.maxSteps) {
      throw new Error(`Plan exceeds maximum steps (${plan.length} > ${this.orchestrator.maxSteps})`);
    }

    // Check estimated duration
    const estimatedDuration = this.estimateDuration(plan);
    if (estimatedDuration > this.orchestrator.runTimeout) {
      throw new Error(`Plan estimated duration exceeds timeout (${estimatedDuration}ms > ${this.orchestrator.runTimeout}ms)`);
    }

    // Validate dependencies
    for (let i = 0; i < plan.length; i++) {
      const step = plan[i];
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          if (dep >= i) {
            throw new Error(`Invalid dependency: step ${i} depends on future step ${dep}`);
          }
        }
      }
    }
  }

  estimateDuration(plan) {
    // Estimate based on tool types and parallelization
    let totalDuration = 0;
    const executionTimes = {
      forecasting: 5000,
      optimization: 8000,
      finance: 3000,
      reporting: 10000,
      system: 1000,
      data: 2000,
      planning: 4000
    };

    for (const step of plan) {
      const tool = toolCatalog.getTool(step.toolId);
      const duration = executionTimes[tool.category] || 5000;
      totalDuration += duration;
    }

    return totalDuration;
  }

  identifyRequiredApprovals(plan) {
    const approvals = [];

    for (const step of plan) {
      const tool = toolCatalog.getTool(step.toolId);
      if (tool.requiresApproval) {
        approvals.push({
          stepIndex: plan.indexOf(step),
          toolId: step.toolId,
          reason: tool.mutating ? 'Mutating operation' : 'Policy requirement'
        });
      }
    }

    return approvals;
  }

  async projectOutcomes(plan) {
    // Project expected outcomes without execution
    const projections = {
      expectedMetrics: {},
      expectedImpact: {},
      risks: []
    };

    for (const step of plan.steps) {
      const tool = toolCatalog.getTool(step.toolId);
      
      // Project based on tool type
      if (tool.category === 'forecasting') {
        projections.expectedMetrics.forecastAccuracy = 0.92;
        projections.expectedMetrics.coverageImprovement = 0.05;
      }
      if (tool.category === 'optimization') {
        projections.expectedMetrics.wcReduction = 0.15;
        projections.expectedMetrics.serviceLevel = 0.95;
        projections.expectedImpact.workingCapital = -150000;
      }
      if (tool.category === 'finance') {
        projections.expectedMetrics.cccImprovement = 5;
        projections.expectedImpact.cashFlow = 200000;
      }
    }

    return projections;
  }
}

class Executor {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
  }

  async executePlan(runId, plan, mode) {
    const results = [];
    const stepOutputs = {};

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      
      // Check dependencies
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          if (!stepOutputs[dep]) {
            throw new Error(`Dependency ${dep} not satisfied for step ${i}`);
          }
        }
      }

      // Check for approval if required
      if (mode === 'EXECUTE') {
        const tool = toolCatalog.getTool(step.toolId);
        if (tool.requiresApproval) {
          const approved = await this.checkApproval(runId, i);
          if (!approved) {
            logWarn(`Step ${i} requires approval, skipping`, { toolId: step.toolId });
            continue;
          }
        }
      }

      // Execute tool with retry
      const result = await this.executeWithRetry(
        step.toolId,
        step.params,
        { runId, stepNumber: i }
      );

      results.push(result);
      stepOutputs[i] = result.output;

      // Update step status
      await prisma.agentSteps.updateMany({
        where: {
          runId,
          stepNumber: i + 1
        },
        data: {
          status: result.success ? 'COMPLETED' : 'FAILED',
          result: JSON.stringify(result),
          completedAt: new Date()
        }
      });
    }

    return results;
  }

  async executeWithRetry(toolId, params, context) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.orchestrator.toolRetryMax; attempt++) {
      try {
        const result = await toolCatalog.executeTool(toolId, params, {
          ...context,
          baseUrl: process.env.API_BASE_URL || 'http://localhost:5000'
        });

        // Save invocation
        await prisma.toolInvocations.create({
          data: {
            id: result.invocationId,
            runId: context.runId,
            stepId: context.stepNumber.toString(),
            toolId,
            params: JSON.stringify(params),
            result: JSON.stringify(result),
            status: result.success ? 'SUCCESS' : 'FAILED',
            startedAt: new Date(result.timestamp),
            finishedAt: new Date()
          }
        });

        return result;
      } catch (error) {
        lastError = error;
        if (attempt < this.orchestrator.toolRetryMax) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          logDebug(`Retrying tool execution`, { toolId, attempt, delay });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  async checkApproval(runId, stepNumber) {
    const approval = await prisma.approvals.findFirst({
      where: {
        runId,
        stepId: stepNumber.toString(),
        decision: 'APPROVED'
      }
    });

    return !!approval;
  }
}

class Reflector {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
  }

  async evaluate(runId, plan, results) {
    const reflection = {
      runId,
      timestamp: new Date().toISOString(),
      planQuality: this.evaluatePlanQuality(plan, results),
      executionQuality: this.evaluateExecutionQuality(results),
      outcomeQuality: this.evaluateOutcomeQuality(plan, results),
      metrics: this.calculateMetrics(results)
    };

    // Save reflection
    await prisma.reflections.create({
      data: {
        id: crypto.randomUUID(),
        runId,
        content: JSON.stringify(reflection),
        score: reflection.outcomeQuality.score,
        createdAt: new Date()
      }
    });

    return reflection;
  }

  evaluatePlanQuality(plan, results) {
    return {
      stepCount: plan.steps.length,
      efficiency: plan.steps.length <= 5 ? 'HIGH' : plan.steps.length <= 10 ? 'MEDIUM' : 'LOW',
      coverage: this.calculateCoverage(plan),
      redundancy: this.detectRedundancy(plan)
    };
  }

  evaluateExecutionQuality(results) {
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / total;

    return {
      successRate: successful / total,
      avgDuration,
      failures: results.filter(r => !r.success).map(r => ({
        toolId: r.toolId,
        error: r.error
      }))
    };
  }

  evaluateOutcomeQuality(plan, results) {
    const score = this.calculateOutcomeScore(plan, results);
    
    return {
      score,
      rating: score > 0.8 ? 'EXCELLENT' : score > 0.6 ? 'GOOD' : score > 0.4 ? 'FAIR' : 'POOR',
      goalAchieved: score > 0.6
    };
  }

  calculateMetrics(results) {
    const metrics = {
      mapeImprovement: 0,
      wcReduction: 0,
      serviceLevel: 0,
      exposureReduction: 0
    };

    for (const result of results) {
      if (result.success && result.output) {
        if (result.output.accuracy) {
          metrics.mapeImprovement = Math.max(metrics.mapeImprovement, 
            1 - (result.output.accuracy.mape || 1));
        }
        if (result.output.optimizedWC) {
          metrics.wcReduction = (result.output.currentWC - result.output.optimizedWC) / 
            result.output.currentWC;
        }
        if (result.output.serviceLevel) {
          metrics.serviceLevel = result.output.serviceLevel;
        }
      }
    }

    return metrics;
  }

  calculateCoverage(plan) {
    const categories = new Set(plan.steps.map(step => {
      const tool = toolCatalog.getTool(step.toolId);
      return tool.category;
    }));

    return categories.size / 6; // 6 total categories
  }

  detectRedundancy(plan) {
    const toolCounts = {};
    for (const step of plan.steps) {
      toolCounts[step.toolId] = (toolCounts[step.toolId] || 0) + 1;
    }

    const redundant = Object.values(toolCounts).filter(count => count > 1).length;
    return redundant / plan.steps.length;
  }

  calculateOutcomeScore(plan, results) {
    let score = 0;
    let weights = 0;

    // Success rate (40%)
    const successRate = results.filter(r => r.success).length / results.length;
    score += successRate * 0.4;
    weights += 0.4;

    // Goal alignment (30%)
    const goalKeywords = plan.goal.toLowerCase().split(' ');
    let alignmentScore = 0;
    for (const result of results) {
      if (result.output && result.output.recommendations) {
        const matches = result.output.recommendations.filter(rec => 
          goalKeywords.some(keyword => rec.toLowerCase().includes(keyword))
        ).length;
        alignmentScore += matches > 0 ? 1 : 0;
      }
    }
    score += (alignmentScore / results.length) * 0.3;
    weights += 0.3;

    // Metric improvements (30%)
    const metrics = this.calculateMetrics(results);
    const metricScore = (
      (metrics.mapeImprovement > 0 ? 0.25 : 0) +
      (metrics.wcReduction > 0 ? 0.25 : 0) +
      (metrics.serviceLevel > 0.9 ? 0.25 : 0) +
      (metrics.exposureReduction > 0 ? 0.25 : 0)
    );
    score += metricScore * 0.3;
    weights += 0.3;

    return weights > 0 ? score / weights : 0;
  }

  async extractLessons(reflection) {
    const lessons = [];

    // Learn from failures
    if (reflection.executionQuality.failures.length > 0) {
      lessons.push({
        type: 'FAILURE_PATTERN',
        content: `Tools ${reflection.executionQuality.failures.map(f => f.toolId).join(', ')} failed`,
        recommendation: 'Consider alternative tools or adjust parameters'
      });
    }

    // Learn from success patterns
    if (reflection.outcomeQuality.score > 0.8) {
      lessons.push({
        type: 'SUCCESS_PATTERN',
        content: `Plan achieved ${reflection.outcomeQuality.rating} outcome`,
        recommendation: 'Reuse this plan structure for similar goals'
      });
    }

    // Learn from metrics
    if (reflection.metrics.wcReduction > 0.1) {
      lessons.push({
        type: 'OPTIMIZATION',
        content: `Working capital reduced by ${(reflection.metrics.wcReduction * 100).toFixed(1)}%`,
        recommendation: 'Apply similar optimization to other products'
      });
    }

    // Save lessons
    for (const lesson of lessons) {
      await prisma.lessons.create({
        data: {
          id: crypto.randomUUID(),
          runId: reflection.runId,
          type: lesson.type,
          content: lesson.content,
          recommendation: lesson.recommendation,
          createdAt: new Date()
        }
      });
    }

    return lessons;
  }

  async suggestNextSteps(reflection) {
    const suggestions = [];

    // Based on outcome quality
    if (reflection.outcomeQuality.score < 0.6) {
      suggestions.push({
        priority: 'HIGH',
        action: 'Revise plan with additional diagnostic tools',
        reason: 'Current plan did not achieve desired outcome'
      });
    }

    // Based on metrics
    if (reflection.metrics.mapeImprovement < 0.05) {
      suggestions.push({
        priority: 'MEDIUM',
        action: 'Run forecast diagnostics and retrain models',
        reason: 'Forecast accuracy below target'
      });
    }

    if (reflection.metrics.serviceLevel < 0.95) {
      suggestions.push({
        priority: 'HIGH',
        action: 'Increase safety stock for critical items',
        reason: 'Service level below target'
      });
    }

    // Based on failures
    if (reflection.executionQuality.successRate < 0.8) {
      suggestions.push({
        priority: 'MEDIUM',
        action: 'Review integration health and data quality',
        reason: 'Multiple tool execution failures detected'
      });
    }

    return suggestions;
  }
}

// Create singleton instance
export const agentOrchestrator = new AgentOrchestrator();

export default {
  AgentOrchestrator,
  agentOrchestrator
};