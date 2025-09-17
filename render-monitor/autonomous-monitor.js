#!/usr/bin/env node

// AUTONOMOUS RENDER MONITOR WITH ANTHROPIC AI
// 24/7 Intelligent Monitoring, Error Detection & Auto-Fix System

import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Initialize Anthropic Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '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',
});

// Configuration
const CONFIG = {
  deployments: {
    development: 'https://sentia-manufacturing-development.onrender.com',
    testing: 'https://sentia-manufacturing-testing.onrender.com',
    production: 'https://sentia-manufacturing-production.onrender.com',
    mcp_server: 'https://mcp-server-tkyu.onrender.com'
  },

  monitoring: {
    checkInterval: 60000,        // Check every minute
    aiAnalysisInterval: 300000,  // AI analysis every 5 minutes
    autoFixInterval: 600000,     // Auto-fix attempt every 10 minutes
  },

  ai: {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4000,
    temperature: 0.3,
    systemPrompt: `You are an expert DevOps engineer monitoring Render deployments.
    Your role is to:
    1. Analyze error logs and health check failures
    2. Identify root causes of 502 errors and service failures
    3. Generate specific fixes for deployment issues
    4. Create code patches to resolve problems
    5. Provide deployment configuration improvements

    Always respond with actionable fixes in JSON format with:
    - issue: Description of the problem
    - severity: critical/high/medium/low
    - fix_type: code/config/deployment/environment
    - solution: Specific fix to apply
    - code_patch: Any code changes needed
    - commands: Shell commands to execute`
  },

  github: {
    repo: 'The-social-drink-company/sentia-manufacturing-dashboard',
    branch: 'production'
  }
};

// Monitoring State
const STATE = {
  startTime: new Date(),
  deployments: {},
  issues: [],
  fixes: [],
  aiInsights: [],
  metrics: {
    checks: 0,
    failures: 0,
    recoveries: 0,
    autoFixes: 0
  }
};

class AutonomousMonitor {
  constructor() {
    this.isRunning = false;
    this.intervals = {};
  }

  async log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    console.log(JSON.stringify(logEntry));

    // Save to log file
    try {
      await fs.appendFile(
        'logs/monitor.log',
        JSON.stringify(logEntry) + '\n'
      );
    } catch (error) {
      // Ignore file errors
    }
  }

  async checkDeploymentHealth(name, url) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      https.get(`${url}/health`, { timeout: 30000 }, (res) => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          const isHealthy = res.statusCode === 200;

          resolve({
            name,
            url,
            healthy: isHealthy,
            statusCode: res.statusCode,
            responseTime,
            response: data,
            timestamp: new Date().toISOString()
          });
        });
      }).on('error', (error) => {
        resolve({
          name,
          url,
          healthy: false,
          statusCode: 0,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async analyzeWithAI(deployment, issues) {
    try {
      const prompt = `
Analyze this Render deployment issue:

Deployment: ${deployment.name}
URL: ${deployment.url}
Status Code: ${deployment.statusCode}
Error: ${deployment.error || 'No response'}
Response Time: ${deployment.responseTime}ms
Recent Issues: ${JSON.stringify(issues.slice(-5))}

Provide a specific fix for this deployment issue.
`;

      const response = await anthropic.messages.create({
        model: CONFIG.ai.model,
        max_tokens: CONFIG.ai.maxTokens,
        temperature: CONFIG.ai.temperature,
        system: CONFIG.ai.systemPrompt,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const aiResponse = response.content[0].text;

      // Parse AI response
      let fix;
      try {
        fix = JSON.parse(aiResponse);
      } catch (e) {
        // If not JSON, create structured response
        fix = {
          issue: 'Deployment failure detected',
          severity: deployment.statusCode === 502 ? 'critical' : 'high',
          fix_type: 'deployment',
          solution: aiResponse,
          commands: []
        };
      }

      await this.log('info', 'AI Analysis Complete', { deployment: deployment.name, fix });

      return fix;

    } catch (error) {
      await this.log('error', 'AI Analysis Failed', {
        deployment: deployment.name,
        error: error.message
      });
      return null;
    }
  }

  async applyAutoFix(deployment, fix) {
    await this.log('info', 'Applying Auto-Fix', {
      deployment: deployment.name,
      fix_type: fix.fix_type
    });

    try {
      switch (fix.fix_type) {
        case 'code':
          if (fix.code_patch) {
            await this.applyCodePatch(fix.code_patch);
          }
          break;

        case 'config':
          if (fix.commands && fix.commands.length > 0) {
            for (const cmd of fix.commands) {
              await execAsync(cmd);
              await this.log('info', 'Executed command', { cmd });
            }
          }
          break;

        case 'deployment':
          await this.triggerRedeployment(deployment.name);
          break;

        case 'environment':
          await this.updateEnvironmentVariables(deployment.name, fix.env_vars);
          break;

        default:
          await this.log('warn', 'Unknown fix type', { fix_type: fix.fix_type });
      }

      STATE.metrics.autoFixes++;
      STATE.fixes.push({
        timestamp: new Date().toISOString(),
        deployment: deployment.name,
        fix,
        status: 'applied'
      });

      await this.log('success', 'Auto-Fix Applied', {
        deployment: deployment.name,
        totalFixes: STATE.metrics.autoFixes
      });

      return true;

    } catch (error) {
      await this.log('error', 'Auto-Fix Failed', {
        deployment: deployment.name,
        error: error.message
      });
      return false;
    }
  }

  async applyCodePatch(patch) {
    // Create temporary patch file
    const patchFile = `temp-patch-${Date.now()}.patch`;
    await fs.writeFile(patchFile, patch);

    try {
      // Apply patch
      await execAsync(`git apply ${patchFile}`);

      // Commit changes
      await execAsync('git add -A');
      await execAsync(`git commit -m "fix: Auto-fix applied by Render Monitor AI

${patch}

Applied by Autonomous Monitor with Claude AI"`);

      // Push to repository
      await execAsync(`git push origin ${CONFIG.github.branch}`);

      await this.log('success', 'Code patch applied and pushed');
    } finally {
      // Clean up patch file
      await fs.unlink(patchFile).catch(() => {});
    }
  }

  async triggerRedeployment(deploymentName) {
    await this.log('info', 'Triggering redeployment', { deployment: deploymentName });

    // Use Render API to trigger redeployment
    // This would require Render API key configuration
    // For now, we'll use git push to trigger auto-deploy

    try {
      // Make a small change to trigger rebuild
      const triggerFile = '.render-trigger';
      await fs.writeFile(triggerFile, new Date().toISOString());

      await execAsync('git add .render-trigger');
      await execAsync(`git commit -m "chore: Trigger rebuild for ${deploymentName}"`);
      await execAsync(`git push origin ${CONFIG.github.branch}`);

      await this.log('success', 'Redeployment triggered');
    } catch (error) {
      await this.log('error', 'Failed to trigger redeployment', { error: error.message });
    }
  }

  async updateEnvironmentVariables(deploymentName, envVars) {
    // This would use Render API to update environment variables
    // For now, log the required changes
    await this.log('info', 'Environment variables need updating', {
      deployment: deploymentName,
      variables: envVars
    });
  }

  async monitoringCycle() {
    STATE.metrics.checks++;

    await this.log('info', '=== Starting Monitoring Cycle ===', {
      cycle: STATE.metrics.checks
    });

    // Check all deployments
    for (const [name, url] of Object.entries(CONFIG.deployments)) {
      const health = await this.checkDeploymentHealth(name, url);

      // Update state
      STATE.deployments[name] = health;

      // Log status
      await this.log(
        health.healthy ? 'success' : 'error',
        `${name}: ${health.healthy ? 'HEALTHY' : 'UNHEALTHY'}`,
        health
      );

      // Track issues
      if (!health.healthy) {
        STATE.metrics.failures++;
        STATE.issues.push({
          timestamp: new Date().toISOString(),
          deployment: name,
          ...health
        });

        // Trigger AI analysis for critical issues
        if (health.statusCode === 502 || health.statusCode === 503) {
          await this.log('warn', 'Critical issue detected, requesting AI analysis', {
            deployment: name
          });

          const fix = await this.analyzeWithAI(health, STATE.issues);

          if (fix) {
            STATE.aiInsights.push({
              timestamp: new Date().toISOString(),
              deployment: name,
              fix
            });

            // Apply auto-fix for critical issues
            if (fix.severity === 'critical') {
              await this.applyAutoFix(health, fix);
            }
          }
        }
      } else if (STATE.deployments[name] && !STATE.deployments[name].healthy) {
        // Recovery detected
        STATE.metrics.recoveries++;
        await this.log('success', 'Service recovered', {
          deployment: name
        });
      }
    }

    // Generate summary
    const summary = {
      healthy: Object.values(STATE.deployments).filter(d => d.healthy).length,
      unhealthy: Object.values(STATE.deployments).filter(d => !d.healthy).length,
      totalChecks: STATE.metrics.checks,
      totalFailures: STATE.metrics.failures,
      totalRecoveries: STATE.metrics.recoveries,
      totalAutoFixes: STATE.metrics.autoFixes,
      uptime: Math.floor((Date.now() - STATE.startTime.getTime()) / 1000)
    };

    await this.log('info', '=== Monitoring Cycle Complete ===', summary);

    // Save state to file
    await this.saveState();
  }

  async saveState() {
    try {
      await fs.writeFile(
        'monitor-state.json',
        JSON.stringify(STATE, null, 2)
      );
    } catch (error) {
      await this.log('error', 'Failed to save state', { error: error.message });
    }
  }

  async periodicAIAnalysis() {
    await this.log('info', '=== AI Analysis Session ===');

    // Analyze trends and patterns
    const recentIssues = STATE.issues.slice(-20);

    if (recentIssues.length > 0) {
      const prompt = `
Analyze these recent deployment issues and provide strategic recommendations:

Issues: ${JSON.stringify(recentIssues)}

Provide:
1. Pattern analysis
2. Root cause identification
3. Long-term fixes
4. Configuration improvements
5. Preventive measures
`;

      try {
        const response = await anthropic.messages.create({
          model: CONFIG.ai.model,
          max_tokens: CONFIG.ai.maxTokens,
          temperature: 0.5,
          system: 'You are a senior DevOps architect analyzing deployment patterns.',
          messages: [{
            role: 'user',
            content: prompt
          }]
        });

        const insights = response.content[0].text;

        await this.log('info', 'AI Strategic Analysis', { insights });

        STATE.aiInsights.push({
          timestamp: new Date().toISOString(),
          type: 'strategic',
          insights
        });

      } catch (error) {
        await this.log('error', 'Strategic analysis failed', { error: error.message });
      }
    }
  }

  async start() {
    this.isRunning = true;

    await this.log('info', '🚀 AUTONOMOUS RENDER MONITOR STARTING');
    await this.log('info', 'Anthropic AI Integration: ENABLED');
    await this.log('info', `Monitoring ${Object.keys(CONFIG.deployments).length} deployments`);

    // Initial check
    await this.monitoringCycle();

    // Set up monitoring intervals
    this.intervals.monitoring = setInterval(
      () => this.monitoringCycle(),
      CONFIG.monitoring.checkInterval
    );

    this.intervals.aiAnalysis = setInterval(
      () => this.periodicAIAnalysis(),
      CONFIG.monitoring.aiAnalysisInterval
    );

    await this.log('info', '✅ Monitor started successfully');
  }

  async stop() {
    this.isRunning = false;

    // Clear intervals
    Object.values(this.intervals).forEach(interval => clearInterval(interval));

    await this.log('info', 'Monitor stopped');
  }
}

// Express server for health checks and API
const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

// Initialize monitor
const monitor = new AutonomousMonitor();

// API endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'autonomous-render-monitor',
    uptime: Math.floor((Date.now() - STATE.startTime.getTime()) / 1000),
    metrics: STATE.metrics,
    timestamp: new Date().toISOString()
  });
});

app.get('/status', (req, res) => {
  res.json({
    deployments: STATE.deployments,
    metrics: STATE.metrics,
    recentIssues: STATE.issues.slice(-10),
    recentFixes: STATE.fixes.slice(-10),
    aiInsights: STATE.aiInsights.slice(-5)
  });
});

app.get('/deployments', (req, res) => {
  res.json(STATE.deployments);
});

app.post('/analyze/:deployment', async (req, res) => {
  const { deployment } = req.params;

  if (!STATE.deployments[deployment]) {
    return res.status(404).json({ error: 'Deployment not found' });
  }

  const fix = await monitor.analyzeWithAI(
    STATE.deployments[deployment],
    STATE.issues
  );

  res.json({ deployment, fix });
});

app.post('/trigger-fix/:deployment', async (req, res) => {
  const { deployment } = req.params;
  const { fix } = req.body;

  if (!STATE.deployments[deployment]) {
    return res.status(404).json({ error: 'Deployment not found' });
  }

  const result = await monitor.applyAutoFix(
    STATE.deployments[deployment],
    fix
  );

  res.json({ deployment, success: result });
});

// Start server and monitor
async function main() {
  // Ensure logs directory exists
  await fs.mkdir('logs', { recursive: true }).catch(() => {});

  // Start monitoring
  await monitor.start();

  // Start Express server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
====================================================
🤖 AUTONOMOUS RENDER MONITOR WITH AI
====================================================
Service: Running on port ${PORT}
AI Model: Claude 3.5 Sonnet
Monitoring: ${Object.keys(CONFIG.deployments).length} deployments
Features:
  - 24/7 Health Monitoring
  - AI-Powered Error Analysis
  - Automatic Fix Generation
  - Self-Healing Deployments
  - Strategic Pattern Analysis

Dashboard: http://localhost:${PORT}/status
Health: http://localhost:${PORT}/health
====================================================
    `);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await monitor.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await monitor.stop();
    process.exit(0);
  });
}

// Start the autonomous monitor
main().catch(error => {
  console.error('Failed to start monitor:', error);
  process.exit(1);
});