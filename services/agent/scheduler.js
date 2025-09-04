/**
 * Autopilot Scheduler for Agent Runs
 */

import { CronJob } from 'cron';
import { agentOrchestrator } from './orchestrator.js';
import { agentEvaluator } from './evaluator.js';
import { logInfo, logError, logDebug, logWarn } from '../observability/structuredLogger.js';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class AutopilotScheduler {
  constructor() {
    this.schedules = new Map();
    this.running = new Map();
    this.timezone = process.env.AGENT_SCHEDULE_TZ || 'Europe/London';
    this.defaultMode = process.env.AUTOPILOT_DEFAULT_MODE || 'PROPOSE';
    this.debounceMinutes = parseInt(process.env.AUTOPILOT_DEBOUNCE_MINUTES) || 60;
    this.maxConcurrent = parseInt(process.env.AUTOPILOT_MAX_CONCURRENT) || 1;
    this.freezeWindowCron = process.env.FREEZE_WINDOW_CRON_MONTH_END;
    
    this.presets = this.loadPresets();
  }

  /**
   * Load preset configurations
   */
  loadPresets() {
    return {
      'protect-service': {
        name: 'Protect Service Levels',
        goal: 'Protect service with ≤£{budget} WC (90 days)',
        params: { budget: 1000000 },
        toolChain: ['forecast.run', 'stock.optimize', 'wc.project'],
        thresholds: {
          forecastMinAccuracyDelta: 0.03,
          wcMaxBreachMonthsDelta: 0,
          wcMinCashDelta: 0,
          optMinStockoutsAvoided: 0.15
        }
      },
      'fx-shock': {
        name: 'FX Shock Resilience',
        goal: 'FX shock ±5% — resilience check',
        params: { shock: 5 },
        toolChain: ['scenarios.generate', 'wc.exposure'],
        thresholds: {
          wcMaxBreachMonthsDelta: 1,
          wcMinCashDelta: -50000
        }
      },
      'pre-close': {
        name: 'Pre-Close Health Check',
        goal: 'Pre-close health check (T-3 days)',
        params: {},
        toolChain: ['wc.diagnostics', 'forecast.accuracyTrend'],
        thresholds: {
          forecastMinAccuracyDelta: 0.02,
          wcMaxBreachMonthsDelta: 0
        }
      },
      'promo-uplift': {
        name: 'Promotion Uplift Guardrail',
        goal: 'Promotion uplift guardrail check',
        params: {},
        toolChain: ['scenarios.generate', 'stock.optimize'],
        thresholds: {
          optMinStockoutsAvoided: 0.20
        }
      }
    };
  }

  /**
   * Initialize scheduler and load schedules from database
   */
  async initialize() {
    try {
      const schedules = await prisma.agentSchedules.findMany({
        where: { enabled: true }
      });

      for (const schedule of schedules) {
        this.startSchedule(schedule);
      }

      logInfo('Autopilot scheduler initialized', {
        activeSchedules: schedules.length
      });
    } catch (error) {
      logError('Failed to initialize scheduler', error);
    }
  }

  /**
   * Create a new schedule
   */
  async createSchedule(data) {
    const {
      name,
      cron,
      tz = this.timezone,
      mode = this.defaultMode,
      entityId = null,
      region = null,
      presetKey = null,
      freezeWindowCron = null,
      enabled = true
    } = data;

    // Validate cron expression
    if (!this.validateCron(cron)) {
      throw new Error('Invalid cron expression');
    }

    // Clamp mode to PROPOSE in production
    const safeMode = process.env.NODE_ENV === 'production' ? 'PROPOSE' : mode;

    const schedule = await prisma.agentSchedules.create({
      data: {
        id: crypto.randomUUID(),
        name,
        cron,
        tz,
        mode: safeMode,
        entityId,
        region,
        presetKey,
        freezeWindowCron,
        enabled,
        lastRunAt: null
      }
    });

    if (enabled) {
      this.startSchedule(schedule);
    }

    return schedule;
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(id, updates) {
    const schedule = await prisma.agentSchedules.update({
      where: { id },
      data: updates
    });

    // Restart if running
    if (this.schedules.has(id)) {
      this.stopSchedule(id);
      if (schedule.enabled) {
        this.startSchedule(schedule);
      }
    } else if (schedule.enabled) {
      this.startSchedule(schedule);
    }

    return schedule;
  }

  /**
   * Start a schedule
   */
  startSchedule(schedule) {
    if (this.schedules.has(schedule.id)) {
      return; // Already running
    }

    const job = new CronJob(
      schedule.cron,
      async () => {
        await this.executeSchedule(schedule);
      },
      null,
      true,
      schedule.tz
    );

    this.schedules.set(schedule.id, job);
    logInfo('Schedule started', { scheduleId: schedule.id, name: schedule.name });
  }

  /**
   * Stop a schedule
   */
  stopSchedule(id) {
    const job = this.schedules.get(id);
    if (job) {
      job.stop();
      this.schedules.delete(id);
      logInfo('Schedule stopped', { scheduleId: id });
    }
  }

  /**
   * Execute a scheduled run
   */
  async executeSchedule(schedule) {
    const { id, name, mode, entityId, region, presetKey } = schedule;

    // Check debounce
    if (!this.canRun(id)) {
      logDebug('Schedule skipped due to debounce', { scheduleId: id });
      return;
    }

    // Check freeze window
    if (this.isInFreezeWindow(schedule)) {
      logInfo('Schedule skipped due to freeze window', { scheduleId: id });
      return;
    }

    // Check max concurrent
    if (this.running.size >= this.maxConcurrent) {
      logWarn('Schedule skipped due to max concurrent runs', { scheduleId: id });
      return;
    }

    try {
      logInfo('Executing scheduled run', { scheduleId: id, name });

      // Mark as running
      this.running.set(id, new Date());

      // Get preset configuration
      const preset = presetKey ? this.presets[presetKey] : null;
      const goal = preset ? this.processGoal(preset.goal, preset.params) : 'Scheduled health check';

      // Run evaluation first if enabled
      let evalResult = null;
      if (process.env.FEATURE_AGENT_EVAL === 'true' && preset) {
        evalResult = await agentEvaluator.evaluate(goal, {
          preset_key: presetKey,
          dataset_key: `${region || 'UK'}_golden`,
          scope: { entity: entityId, region },
          thresholds_override: preset.thresholds
        });

        // Gate based on evaluation
        if (!evalResult.passed && mode === 'PROPOSE') {
          logWarn('Scheduled run downgraded to DRY_RUN due to evaluation', {
            scheduleId: id,
            scorecard: evalResult.scorecard
          });
        }
      }

      // Execute agent run
      const result = await agentOrchestrator.run(goal, {
        mode: evalResult && !evalResult.passed ? 'DRY_RUN' : mode,
        scope: { entity: entityId, region },
        budgets: preset?.params || {},
        userId: 'AUTOPILOT',
        metadata: {
          scheduleId: id,
          scheduleName: name,
          evalId: evalResult?.evalId
        }
      });

      // Update last run time
      await prisma.agentSchedules.update({
        where: { id },
        data: { lastRunAt: new Date() }
      });

      // Send notifications if configured
      await this.sendNotifications(schedule, result, evalResult);

      logInfo('Scheduled run completed', {
        scheduleId: id,
        runId: result.runId,
        mode: result.mode
      });

    } catch (error) {
      logError('Scheduled run failed', error, { scheduleId: id });
      
      // Check for backoff
      await this.handleFailure(id);
      
    } finally {
      this.running.delete(id);
    }
  }

  /**
   * Run a schedule immediately (manual trigger)
   */
  async runNow(scheduleId) {
    const schedule = await prisma.agentSchedules.findUnique({
      where: { id: scheduleId }
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Force DRY_RUN or PROPOSE only
    const safeSchedule = {
      ...schedule,
      mode: schedule.mode === 'EXECUTE' ? 'PROPOSE' : schedule.mode
    };

    await this.executeSchedule(safeSchedule);
  }

  /**
   * Check if can run based on debounce
   */
  canRun(scheduleId) {
    const lastRun = this.running.get(scheduleId);
    if (!lastRun) return true;

    const debounceMs = this.debounceMinutes * 60 * 1000;
    return Date.now() - lastRun.getTime() > debounceMs;
  }

  /**
   * Check if in freeze window
   */
  isInFreezeWindow(schedule) {
    if (!schedule.freezeWindowCron && !this.freezeWindowCron) {
      return false;
    }

    const freezeCron = schedule.freezeWindowCron || this.freezeWindowCron;
    
    // Simple check for month-end
    if (freezeCron.includes('28-31')) {
      const now = new Date();
      const day = now.getDate();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      
      // Freeze last 3 days of month
      return day >= lastDay - 2;
    }

    return false;
  }

  /**
   * Handle schedule failure with backoff
   */
  async handleFailure(scheduleId) {
    // Get recent failures
    const recentRuns = await prisma.agentRuns.findMany({
      where: {
        metadata: {
          path: ['scheduleId'],
          equals: scheduleId
        },
        status: 'FAILED',
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    // Disable schedule if too many failures
    if (recentRuns.length >= 3) {
      await prisma.agentSchedules.update({
        where: { id: scheduleId },
        data: { enabled: false }
      });
      
      this.stopSchedule(scheduleId);
      
      logError('Schedule disabled due to repeated failures', null, {
        scheduleId,
        failureCount: recentRuns.length
      });
    }
  }

  /**
   * Send notifications for scheduled runs
   */
  async sendNotifications(schedule, result, evalResult) {
    if (!process.env.NOTIFY_SLACK_WEBHOOK && !process.env.NOTIFY_EMAIL_TO) {
      return;
    }

    const message = {
      title: `Autopilot: ${schedule.name}`,
      runId: result.runId,
      mode: result.mode,
      status: result.status,
      scorecard: evalResult?.scorecard,
      predictedDeltas: result.projectedOutcomes,
      approvalRequired: result.mode === 'PROPOSE' && result.requiredApprovals?.length > 0
    };

    // Send to Slack
    if (process.env.NOTIFY_SLACK_WEBHOOK && process.env.SLACK_BOT_TOKEN) {
      await this.sendSlackNotification(message);
    }

    // Send email (implement if needed)
    if (process.env.NOTIFY_EMAIL_TO) {
      await this.sendEmailNotification(message);
    }
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification(message) {
    try {
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: message.title
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Status:* ${message.status}`
            },
            {
              type: 'mrkdwn',
              text: `*Mode:* ${message.mode}`
            }
          ]
        }
      ];

      if (message.approvalRequired) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':warning: *Approval Required*'
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Review & Approve'
            },
            url: `${process.env.APP_URL}/agent/runs/${message.runId}`
          }
        });
      }

      // Send via Slack API
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: process.env.SLACK_CHANNEL || '#general',
          blocks
        })
      });

      if (!response.ok) {
        throw new Error('Slack notification failed');
      }
    } catch (error) {
      logError('Failed to send Slack notification', error);
    }
  }

  /**
   * Send email notification (stub)
   */
  async sendEmailNotification(message) {
    // Implement email sending if needed
    logDebug('Email notification not implemented', { message });
  }

  /**
   * Process goal template with parameters
   */
  processGoal(template, params) {
    let goal = template;
    for (const [key, value] of Object.entries(params)) {
      goal = goal.replace(`{${key}}`, value);
    }
    return goal;
  }

  /**
   * Validate cron expression
   */
  validateCron(cron) {
    try {
      new CronJob(cron, () => {});
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all schedules
   */
  async getSchedules() {
    return prisma.agentSchedules.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get schedule metrics
   */
  async getMetrics() {
    const schedules = await this.getSchedules();
    const activeCount = schedules.filter(s => s.enabled).length;
    const runningCount = this.running.size;

    const recentRuns = await prisma.agentRuns.count({
      where: {
        metadata: {
          path: ['scheduleId'],
          not: null
        },
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    return {
      totalSchedules: schedules.length,
      activeSchedules: activeCount,
      runningNow: runningCount,
      runsLast24h: recentRuns
    };
  }

  /**
   * Shutdown scheduler
   */
  async shutdown() {
    for (const [id, job] of this.schedules.entries()) {
      job.stop();
    }
    this.schedules.clear();
    this.running.clear();
    logInfo('Autopilot scheduler shutdown');
  }
}

// Singleton instance
export const autopilotScheduler = new AutopilotScheduler();

export default {
  AutopilotScheduler,
  autopilotScheduler
};