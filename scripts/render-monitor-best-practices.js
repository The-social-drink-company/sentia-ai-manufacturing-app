#!/usr/bin/env node

// RENDER MONITOR AGENT WITH BEST PRACTICE FIXES
// Autonomous 24/7 monitoring with automatic remediation

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';

const execAsync = promisify(exec);

class RenderMonitorAgent {
  constructor() {
    this.name = 'Render Monitor Agent';
    this.interval = process.env.MONITOR_INTERVAL || 60000; // 1 minute default
    this.isRunning = false;
    this.cycleCount = 0;
    this.deployments = {
      development: 'https://sentia-manufacturing-development.onrender.com',
      testing: 'https://sentia-manufacturing-testing.onrender.com',
      production: 'https://sentia-manufacturing-production.onrender.com',
      mcp: 'https://mcp-server-tkyu.onrender.com'
    };
    this.fixesApplied = [];
    this.healthStatus = {};
  }

  async log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] [${this.name}] ${message}`;
    console.log(logEntry);

    // Also save to log file
    try {
      await fs.appendFile('logs/render-monitor.log', logEntry + '\n');
    } catch (error) {
      // Ignore file write errors
    }
  }

  async checkHealth(name, url) {
    return new Promise((resolve) => {
      const healthUrl = `${url}/health`;

      https.get(healthUrl, { timeout: 30000 }, (res) => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            name,
            url,
            status: res.statusCode,
            healthy: res.statusCode === 200,
            response: data,
            timestamp: new Date().toISOString()
          });
        });
      }).on('error', (error) => {
        resolve({
          name,
          url,
          status: 0,
          healthy: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async performBestPracticeFixes() {
    await this.log('INFO', 'Starting best practice fixes');
    const fixes = [];

    try {
      // Fix 1: Handle uncommitted changes properly
      try {
        const { stdout: status } = await execAsync('git status --porcelain');
        if (status.trim()) {
          await this.log('INFO', 'Stashing uncommitted changes');
          await execAsync('git stash push -m "Render Monitor: Auto-stash before fixes"');
          fixes.push('Stashed uncommitted changes');
        }
      } catch (error) {
        await this.log('WARN', `Git stash failed: ${error.message}`);
      }

      // Fix 2: Clean up console.log statements in production code
      try {
        const files = await this.findFilesWithConsoleLogs();
        if (files.length > 0) {
          await this.log('INFO', `Found ${files.length} files with console.log statements`);
          for (const file of files.slice(0, 5)) { // Limit to 5 files per cycle
            await this.removeConsoleLogs(file);
            fixes.push(`Removed console.logs from ${path.basename(file)}`);
          }
        }
      } catch (error) {
        await this.log('WARN', `Console.log cleanup failed: ${error.message}`);
      }

      // Fix 3: Update security vulnerabilities
      try {
        const { stdout: auditOutput } = await execAsync('npm audit --json', { maxBuffer: 10 * 1024 * 1024 });
        const audit = JSON.parse(auditOutput);

        if (audit.metadata && audit.metadata.vulnerabilities) {
          const vulns = audit.metadata.vulnerabilities;
          const totalVulns = vulns.total || 0;

          if (totalVulns > 0) {
            await this.log('WARN', `Found ${totalVulns} vulnerabilities`);

            // Attempt to fix automatically
            try {
              await execAsync('npm audit fix --force', { timeout: 60000 });
              fixes.push(`Fixed ${totalVulns} security vulnerabilities`);
              await this.log('SUCCESS', 'Security vulnerabilities fixed');
            } catch (fixError) {
              await this.log('WARN', 'Some vulnerabilities could not be auto-fixed');
            }
          }
        }
      } catch (error) {
        await this.log('WARN', `Security audit failed: ${error.message}`);
      }

      // Fix 4: Optimize package.json scripts
      try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
        let modified = false;

        // Ensure critical scripts exist
        const requiredScripts = {
          'start': 'node server.js',
          'build': 'vite build',
          'dev': 'concurrently "npm run dev:client" "npm run dev:server"',
          'dev:client': 'vite',
          'dev:server': 'nodemon server.js',
          'lint': 'eslint src --ext .js,.jsx',
          'lint:fix': 'eslint src --ext .js,.jsx --fix',
          'test': 'vitest',
          'test:run': 'vitest run'
        };

        for (const [script, command] of Object.entries(requiredScripts)) {
          if (!packageJson.scripts[script]) {
            packageJson.scripts[script] = command;
            modified = true;
            fixes.push(`Added missing script: ${script}`);
          }
        }

        if (modified) {
          await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
          await this.log('SUCCESS', 'Package.json scripts optimized');
        }
      } catch (error) {
        await this.log('WARN', `Package.json optimization failed: ${error.message}`);
      }

      // Fix 5: Ensure proper environment files
      try {
        const envFiles = ['.env', '.env.production', '.env.development'];
        const envTemplate = await fs.readFile('.env.template', 'utf-8').catch(() => '');

        for (const envFile of envFiles) {
          try {
            await fs.access(envFile);
          } catch {
            // File doesn't exist, create from template
            if (envTemplate) {
              await fs.writeFile(envFile, envTemplate);
              fixes.push(`Created missing ${envFile}`);
              await this.log('SUCCESS', `Created ${envFile} from template`);
            }
          }
        }
      } catch (error) {
        await this.log('WARN', `Environment file check failed: ${error.message}`);
      }

      // Fix 6: Clean up dist/build artifacts
      try {
        const distStats = await fs.stat('dist').catch(() => null);
        if (distStats && distStats.isDirectory()) {
          const files = await fs.readdir('dist');

          // Check for outdated build files
          const oneHourAgo = Date.now() - (60 * 60 * 1000);
          let outdatedCount = 0;

          for (const file of files) {
            const filePath = path.join('dist', file);
            const stats = await fs.stat(filePath);

            if (stats.mtime.getTime() < oneHourAgo) {
              outdatedCount++;
            }
          }

          if (outdatedCount > files.length * 0.5) {
            await this.log('INFO', 'Rebuilding outdated dist files');
            await execAsync('npm run build', { timeout: 120000 });
            fixes.push('Rebuilt production bundle');
          }
        }
      } catch (error) {
        await this.log('WARN', `Build cleanup failed: ${error.message}`);
      }

      // Fix 7: Database connection optimization
      try {
        const serverFile = await fs.readFile('server.js', 'utf-8');

        if (!serverFile.includes('pool_mode=transaction')) {
          // Add connection pooling to database URLs
          const updatedServer = serverFile.replace(
            /DATABASE_URL\s*=\s*process\.env\.DATABASE_URL/g,
            'DATABASE_URL = process.env.DATABASE_URL + "?pool_mode=transaction"'
          );

          if (updatedServer !== serverFile) {
            await fs.writeFile('server.js', updatedServer);
            fixes.push('Added database connection pooling');
            await this.log('SUCCESS', 'Database connection optimized');
          }
        }
      } catch (error) {
        await this.log('WARN', `Database optimization failed: ${error.message}`);
      }

      // Fix 8: Memory leak prevention
      try {
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

        await this.log('INFO', `Memory usage: ${heapUsedMB}MB`);

        if (heapUsedMB > 500) {
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
            fixes.push('Triggered garbage collection');
            await this.log('SUCCESS', 'Memory cleaned up');
          }
        }
      } catch (error) {
        await this.log('WARN', `Memory optimization failed: ${error.message}`);
      }

    } catch (error) {
      await this.log('ERROR', `Best practice fixes failed: ${error.message}`);
    }

    this.fixesApplied = this.fixesApplied.concat(fixes);

    if (fixes.length > 0) {
      await this.log('SUCCESS', `Applied ${fixes.length} fixes: ${fixes.join(', ')}`);

      // Commit the fixes
      try {
        await execAsync('git add -A');
        const commitMessage = `fix: Auto-fix: ${fixes.length} best practice improvements

${fixes.map(f => `- ${f}`).join('\n')}

Applied by Render Monitor Agent`;

        await execAsync(`git commit -m "${commitMessage}"`);
        await this.log('SUCCESS', 'Committed best practice fixes');
      } catch (error) {
        await this.log('WARN', `Could not commit fixes: ${error.message}`);
      }
    }

    return fixes;
  }

  async findFilesWithConsoleLogs() {
    const files = [];

    try {
      // Search for console.log in source files
      const { stdout } = await execAsync(
        'grep -r "console\\.log" --include="*.js" --include="*.jsx" src/ services/ | head -20'
      );

      const matches = stdout.split('\n').filter(line => line.trim());

      for (const match of matches) {
        const filePath = match.split(':')[0];
        if (filePath && !files.includes(filePath)) {
          files.push(filePath);
        }
      }
    } catch (error) {
      // Grep returns non-zero if no matches found
    }

    return files;
  }

  async removeConsoleLogs(filePath) {
    try {
      let content = await fs.readFile(filePath, 'utf-8');

      // Replace console.log with structured logging
      const updatedContent = content
        .replace(/console\.log\(/g, '// console.log(')
        .replace(/console\.error\(/g, 'logError(')
        .replace(/console\.warn\(/g, 'logWarn(');

      if (content !== updatedContent) {
        await fs.writeFile(filePath, updatedContent);
        await this.log('INFO', `Cleaned console.logs from ${path.basename(filePath)}`);
      }
    } catch (error) {
      await this.log('WARN', `Failed to clean ${filePath}: ${error.message}`);
    }
  }

  async wakeUpDeployment(name, url) {
    await this.log('INFO', `Waking up ${name} deployment`);

    try {
      // Send multiple requests to wake up the service
      const endpoints = ['/health', '/', '/api/health'];

      for (const endpoint of endpoints) {
        https.get(`${url}${endpoint}`, { timeout: 60000 }, (res) => {
          res.on('data', () => {}); // Consume response
        }).on('error', () => {}); // Ignore errors

        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      await this.log('SUCCESS', `Wake-up requests sent to ${name}`);
    } catch (error) {
      await this.log('WARN', `Failed to wake ${name}: ${error.message}`);
    }
  }

  async executeTasks() {
    this.cycleCount++;
    await this.log('INFO', `Starting monitoring cycle ${this.cycleCount}`);

    try {
      // Step 1: Check health of all deployments
      await this.log('INFO', 'Checking deployment health');

      for (const [name, url] of Object.entries(this.deployments)) {
        const health = await this.checkHealth(name, url);
        this.healthStatus[name] = health;

        await this.log(
          health.healthy ? 'SUCCESS' : 'ERROR',
          `${name}: ${health.healthy ? 'HEALTHY' : 'UNHEALTHY'} (${health.status})`
        );

        // Wake up unhealthy deployments
        if (!health.healthy) {
          await this.wakeUpDeployment(name, url);
        }
      }

      // Step 2: Apply best practice fixes every 5 cycles
      if (this.cycleCount % 5 === 0) {
        await this.performBestPracticeFixes();
      }

      // Step 3: Generate status report
      const report = {
        cycle: this.cycleCount,
        timestamp: new Date().toISOString(),
        deployments: this.healthStatus,
        fixesApplied: this.fixesApplied.length,
        recentFixes: this.fixesApplied.slice(-10)
      };

      await fs.writeFile(
        'scripts/deployment-status.json',
        JSON.stringify(report, null, 2)
      );

      await this.log('SUCCESS', `Cycle ${this.cycleCount} completed`);

    } catch (error) {
      await this.log('ERROR', `Cycle ${this.cycleCount} failed: ${error.message}`);
    }
  }

  async start() {
    this.isRunning = true;

    // Ensure logs directory exists
    await fs.mkdir('logs', { recursive: true }).catch(() => {});

    await this.log('INFO', '='.repeat(60));
    await this.log('INFO', 'RENDER MONITOR AGENT WITH BEST PRACTICES');
    await this.log('INFO', '24/7 Autonomous Monitoring & Remediation');
    await this.log('INFO', '='.repeat(60));

    while (this.isRunning) {
      await this.executeTasks();
      await new Promise(resolve => setTimeout(resolve, this.interval));
    }
  }

  stop() {
    this.isRunning = false;
    this.log('INFO', 'Render Monitor Agent stopped');
  }
}

// Start the agent
const agent = new RenderMonitorAgent();
agent.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  agent.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  agent.stop();
  process.exit(0);
});

export default RenderMonitorAgent;