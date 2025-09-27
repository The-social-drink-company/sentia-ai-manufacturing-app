#!/usr/bin/env node

/**
 * Render Monitor Agent
 * Intelligent deployment monitoring and automatic error fixing for Render
 *
 * Features:
 * - Continuous deployment health monitoring
 * - Automatic error pattern detection
 * - Smart fix generation and application
 * - Git automation for fixes
 * - Real-time deployment verification
 */

import https from 'https';
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename);
const ROOTDIR = path.join(__dirname, '..');

// Configuration for 24/7 Autonomous Operation
const CONFIG = {
  renderUrl: process.env.RENDER_URL || 'https://sentia-manufacturing-development.onrender.com',
  checkInterval: 60000, // 1 minute
  maxRetries: 3,
  autoFix: true, // ENABLED: Automatically apply fixes
  autoDeploy: true, // ENABLED: Automatically deploy fixes
  autonomous: true, // 24/7 autonomous mode
  retryDelay: 5000,
  gitBranch: 'development',
  logFile: path.join(__dirname, 'deployment-monitor.log'),
  pidFile: path.join(__dirname, 'render-monitor.pid'),
  webhookUrl: process.env.WEBHOOK_URL // Optional: for alerts
};

// Error patterns and their fixes
const ERRORPATTERNS = [
  {
    pattern: /require is not defined/i,
    type: 'ES_MODULE_ERROR',
    description: 'CommonJS require in ES module context',
    fixes: [
      {
        file: 'Check all .js files for require() statements',
        action: 'Convert require() to import statements',
        command: 'node scripts/fix-es-modules.js'
      }
    ]
  },
  {
    pattern: /Cannot find module '(.+?)'/i,
    type: 'MISSING_MODULE',
    description: 'Missing npm package',
    fixes: [
      {
        file: 'package.json',
        action: 'Install missing module',
        command: (match) => `npm install ${match[1]} --save`
      }
    ]
  },
  {
    pattern: /ENOENT: no such file or directory.*/dist/i,
    type: 'MISSING_BUILD',
    description: 'Build artifacts missing',
    fixes: [
      {
        file: 'dist folder',
        action: 'Run build process',
        command: 'npm run build'
      }
    ]
  },
  {
    pattern: /PORT is already in use/i,
    type: 'PORT_CONFLICT',
    description: 'Port already occupied',
    fixes: [
      {
        file: 'server.js',
        action: 'Use dynamic port allocation',
        code: 'const PORT = process.env.PORT || 0;'
      }
    ]
  },
  {
    pattern: /DATABASE_URL.*not.*set|Database connection failed/i,
    type: 'DATABASE_ERROR',
    description: 'Database connection issues',
    fixes: [
      {
        file: '.env',
        action: 'Set DATABASE_URL in Render environment',
        manual: true,
        instructions: 'Go to Render Dashboard > Environment > Add DATABASE_URL'
      }
    ]
  },
  {
    pattern: /CLERK.*not.*defined|Missing.*CLERK/i,
    type: 'AUTH_ERROR',
    description: 'Clerk authentication not configured',
    fixes: [
      {
        file: '.env',
        action: 'Set Clerk keys in environment',
        manual: true,
        instructions: 'Add VITE_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY'
      }
    ]
  },
  {
    pattern: /Failed to load PostCSS config/i,
    type: 'POSTCSS_ERROR',
    description: 'PostCSS configuration error',
    fixes: [
      {
        file: 'postcss.config.js',
        action: 'Fix PostCSS configuration',
        command: 'npm install @tailwindcss/postcss --save-dev'
      }
    ]
  },
  {
    pattern: /SyntaxError.*Unexpected token/i,
    type: 'SYNTAX_ERROR',
    description: 'JavaScript syntax error',
    fixes: [
      {
        file: 'Check error location',
        action: 'Fix syntax error',
        command: 'npm run lint:fix'
      }
    ]
  },
  {
    pattern: /Cannot resolve dependency|peer dep missing/i,
    type: 'DEPENDENCY_ERROR',
    description: 'Dependency resolution issues',
    fixes: [
      {
        file: 'package.json',
        action: 'Clean install with legacy peer deps',
        command: 'rm -rf node_modules package-lock.json && npm install --legacy-peer-deps'
      }
    ]
  },
  {
    pattern: /vite.*not found|vite.*is not recognized/i,
    type: 'BUILD_TOOL_ERROR',
    description: 'Vite not installed',
    fixes: [
      {
        file: 'package.json',
        action: 'Install Vite',
        command: 'npm install vite @vitejs/plugin-react --save-dev'
      }
    ]
  }
];

// Render Monitor Agent Class
class RenderMonitorAgent {
  constructor() {
    this.errors = [];
    this.fixes = [];
    this.monitoring = false;
    this.deploymentStatus = 'unknown';
  }

  // Log messages
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    
    // Also write to log file
    fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
  }

  // Check deployment health
  async checkDeployment() {
    this.log('Checking deployment health...');
    
    const endpoints = [
      { path: '/', name: 'Home' },
      { path: '/api/health', name: 'Health' },
      { path: '/api/personnel', name: 'Personnel API' }
    ];

    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.fetchEndpoint(endpoint.path);
        results.push({
          endpoint: endpoint.name,
          status: response.status,
          ok: response.status === 200,
          data: response.data
        });
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          status: 'error',
          ok: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Fetch endpoint
  async fetchEndpoint(path) {
    return new Promise((resolve, _reject) => {
      const url = new URL(path, CONFIG.renderUrl);
      
      https.get(url.toString(), (res) => {
        let data = '';
        
        res.on('data', _(chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      }).on('error', reject);
    });
  }

  // Analyze errors from response
  analyzeErrors(response) {
    const errors = [];
    const content = response.data || '';
    
    // Check for error patterns
    for (const errorPattern of ERROR_PATTERNS) {
      const match = content.match(errorPattern.pattern);
      if (match) {
        errors.push({
          type: errorPattern.type,
          description: errorPattern.description,
          match: match[0],
          fixes: errorPattern.fixes,
          pattern: errorPattern.pattern
        });
      }
    }

    // Check for generic error indicators
    if (response.status >= 500) {
      errors.push({
        type: 'SERVER_ERROR',
        description: `Server error: ${response.status}`,
        fixes: [{
          action: 'Check server logs',
          command: 'node scripts/check-render-deployment.js'
        }]
      });
    }

    return errors;
  }

  // Generate fix script
  async generateFix(error) {
    this.log(`Generating fix for ${error.type}...`);
    
    const fixScript = [];
    
    for (const fix of error.fixes) {
      if (fix.manual) {
        fixScript.push({
          type: 'manual',
          action: fix.action,
          instructions: fix.instructions
        });
      } else if (fix.command) {
        const command = typeof fix.command === 'function' 
          ? fix.command(error.match) 
          : fix.command;
        
        fixScript.push({
          type: 'command',
          action: fix.action,
          command: command
        });
      } else if (fix.code) {
        fixScript.push({
          type: 'code',
          action: fix.action,
          file: fix.file,
          code: fix.code
        });
      }
    }

    return fixScript;
  }

  // Apply fixes
  async applyFixes(fixes) {
    this.log('Applying fixes...');
    
    for (const fix of fixes) {
      try {
        if (fix.type === 'command') {
          this.log(`Executing: ${fix.command}`);
          
          if (CONFIG.autoFix) {
            const result = await execAsync(fix.command, { cwd: ROOT_DIR });
            this.log(`Result: ${result.stdout}`);
          } else {
            this.log(`[DRY RUN] Would execute: ${fix.command}`);
          }
        } else if (fix.type === 'code') {
          this.log(`Would update ${fix.file} with: ${fix.code}`);
        } else if (fix.type === 'manual') {
          this.log(`MANUAL ACTION REQUIRED: ${fix.action}`);
          this.log(`Instructions: ${fix.instructions}`);
        }
      } catch (error) {
        this.log(`Error applying fix: ${error.message}`, 'ERROR');
      }
    }
  }

  // Git operations
  async commitAndPush(message) {
    if (!CONFIG.autoDeploy) {
      this.log('[DRY RUN] Would commit and push changes');
      return;
    }

    try {
      await execAsync('git add -A', { cwd: ROOT_DIR });
      await execAsync(`git commit -m "fix: ${message}\n\nAutomated fix by Render Deployment Agent"`, { cwd: ROOT_DIR });
      await execAsync('git push origin development', { cwd: ROOT_DIR });
      this.log('Changes committed and pushed successfully');
    } catch (error) {
      this.log(`Git operation failed: ${error.message}`, 'ERROR');
    }
  }

  // Main monitoring loop - 24/7 Autonomous Mode
  async startMonitoring() {
    this.monitoring = true;
    this.log('='.repeat(60));
    this.log('RENDER MONITOR AGENT - 24/7 AUTONOMOUS MODE');
    this.log('='.repeat(60));
    this.log(`Target: ${CONFIG.renderUrl}`);
    this.log(`Auto-fix: ENABLED`);
    this.log(`Auto-deploy: ENABLED`);
    this.log(`Autonomous: TRUE`);
    this.log(`Check interval: ${CONFIG.checkInterval / 1000} seconds`);
    this.log(`Started at: ${new Date().toISOString()}`);
    this.log(`Process ID: ${process.pid}`);
    this.log('='.repeat(60));

    // Write PID file for service management
    fs.writeFileSync(CONFIG.pidFile, process.pid.toString());

    let consecutiveFailures = 0;
    let lastHealthStatus = true;

    while (this.monitoring) {
      try {
        // Check deployment
        const results = await this.checkDeployment();

        // Analyze results
        let hasErrors = false;
        const allErrors = [];

        for (const result of results) {
          if (!result.ok) {
            hasErrors = true;
            const errors = this.analyzeErrors(result);
            allErrors.push(...errors);
          }
        }

        // Report status
        if (hasErrors) {
          consecutiveFailures++;
          this.log(`[WARNING] Found ${allErrors.length} errors (failure ${consecutiveFailures}/${CONFIG.maxRetries})`, 'WARNING');

          // Generate and apply fixes
          for (const error of allErrors) {
            this.log(`Error: ${error.type} - ${error.description}`);
            const fixes = await this.generateFix(error);
            await this.applyFixes(fixes);
          }

          // Commit and deploy fixes automatically
          if (CONFIG.autoFix && CONFIG.autoDeploy && allErrors.length > 0) {
            this.log('[AUTO-FIX] Committing and deploying fixes...');
            await this.commitAndPush(`Auto-fix: ${allErrors.length} deployment errors`);
            this.log('[AUTO-FIX] Fixes deployed, waiting for Render to rebuild...');
            await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s for rebuild
          }

          // Alert on critical failures
          if (consecutiveFailures >= CONFIG.maxRetries) {
            this.log('[CRITICAL] Maximum consecutive failures reached!', 'ERROR');
            await this.sendAlert('CRITICAL: Deployment repeatedly failing', { errors: allErrors });
          }
        } else {
          if (consecutiveFailures > 0 || !lastHealthStatus) {
            this.log(`[RECOVERY] Deployment recovered after ${consecutiveFailures} failures`, 'SUCCESS');
            await this.sendAlert('RECOVERY: Deployment is now healthy', { previousFailures: consecutiveFailures });
          }
          consecutiveFailures = 0;
          lastHealthStatus = true;
          this.log('Deployment healthy - all checks passed', 'SUCCESS');
        }

        // Log status for monitoring
        const statusLog = {
          timestamp: new Date().toISOString(),
          healthy: !hasErrors,
          failures: consecutiveFailures,
          errors: allErrors.map(e => ({ type: e.type, description: e.description }))
        };
        fs.appendFileSync(
          path.join(__dirname, 'deployment-status.json'),
          JSON.stringify(statusLog) + '\n'
        );

        // Wait before next check
        if (this.monitoring) {
          this.log(`Next check in ${CONFIG.checkInterval / 1000} seconds...`);
          this.log(''); // Empty line for readability
          await new Promise(resolve => setTimeout(resolve, CONFIG.checkInterval));
        }
      } catch (error) {
        this.log(`Monitor error: ${error.message}`, 'ERROR');
        consecutiveFailures++;
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      }
    }
  }

  // Stop monitoring
  stopMonitoring() {
    this.monitoring = false;
    this.log('='.repeat(60));
    this.log('RENDER MONITOR AGENT SHUTTING DOWN');
    this.log(`Stopped at: ${new Date().toISOString()}`);
    this.log('='.repeat(60));

    // Clean up PID file
    if (fs.existsSync(CONFIG.pidFile)) {
      fs.unlinkSync(CONFIG.pidFile);
    }
  }

  // Send alerts for critical issues
  async sendAlert(message, details) {
    if (CONFIG.webhookUrl) {
      try {
        await fetch(CONFIG.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message, details })
        });
      } catch (error) {
        this.log(`Failed to send alert: ${error.message}`, 'ERROR');
      }
    }
  }
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

const monitor = new RenderMonitorAgent();

if (command === '--once' || !command) {
  // Single check
  monitor.checkDeployment().then(results => {
    console.log('\nDeployment Check Results:');
    console.log(JSON.stringify(results, null, 2));
    
    // Analyze and suggest fixes
    for (const result of results) {
      if (!result.ok) {
        const errors = monitor.analyzeErrors(result);
        if (errors.length > 0) {
          console.log('\nDetected Errors and Fixes:');
          errors.forEach(error => {
            console.log(`\n${error.type}: ${error.description}`);
            console.log('Suggested fixes:');
            error.fixes.forEach(fix => {
              console.log(`  - ${fix.action}`);
              if (fix.command) console.log(`    Command: ${fix.command}`);
              if (fix.instructions) console.log(`    Instructions: ${fix.instructions}`);
            });
          });
        }
      }
    }
  });
} else if (command === '--monitor') {
  // Continuous monitoring
  monitor.startMonitoring();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down monitor...');
    monitor.stopMonitoring();
    process.exit(0);
  });
} else if (command === '--help') {
  console.log(`
Render Monitor Agent - Intelligent Deployment Monitoring

Usage:
  node render-deployment-agent.js [options]

Options:
  --once      Run single check (default)
  --monitor   Start continuous monitoring
  --help      Show this help message

Configuration:
  Edit CONFIG object in script to customize:
  - renderUrl: Your Render deployment URL
  - autoFix: Enable automatic fixes (default: true)
  - autoDeploy: Enable auto git push (default: false)
  - checkInterval: Time between checks in ms

NPM Scripts:
  npm run render:check    - Check deployment status
  npm run render:monitor  - Start continuous monitoring
  npm run render:fix      - Run single fix check
`);
}

// Handle uncaught exceptions to keep running 24/7
process.on('uncaughtException', (error) => {
  console.error('[CRITICAL] Uncaught exception:', error);
  fs.appendFileSync(
    path.join(__dirname, 'render-monitor-errors.log'),
    `${new Date().toISOString()} - Uncaught Exception: ${error.stack}\n`
  );
});

process.on('unhandledRejection', _(reason, _promise) => {
  console.error('[CRITICAL] Unhandled rejection at:', promise, 'reason:', reason);
  fs.appendFileSync(
    path.join(__dirname, 'render-monitor-errors.log'),
    `${new Date().toISOString()} - Unhandled Rejection: ${reason}\n`
  );
});

export default RenderMonitorAgent;
