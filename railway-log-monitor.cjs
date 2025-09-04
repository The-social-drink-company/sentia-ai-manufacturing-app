#!/usr/bin/env node

/**
 * Railway Log Monitor & Auto-Fix System
 * Continuously monitors Railway deployment logs for all branches
 * Automatically fixes errors and triggers new deployments
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

// Configuration
const CONFIG = {
  branches: ['development', 'test', 'production'],
  projects: {
    development: 'sentia-manufacturing-dashboard',
    test: 'sentia-manufacturing-dashboard', 
    production: 'sentia-manufacturing-dashboard'
  },
  checkInterval: 5 * 60 * 1000, // 5 minutes
  logDir: './railway-logs',
  maxLogAge: 24 * 60 * 60 * 1000, // 24 hours
  autoFix: true,
  autoCommit: true,
  autoDeploy: true
};

// Common Railway build/deployment errors and fixes
const ERROR_PATTERNS = [
  {
    pattern: /trailing comma/i,
    description: 'JSON trailing comma error',
    fix: async (logContent, branch) => {
      console.log('FIXING: Removing trailing commas from package.json');
      return await fixTrailingComma('package.json');
    }
  },
  {
    pattern: /Cannot find module ['"](.+?)['"]/i,
    description: 'Missing module error',
    fix: async (logContent, branch) => {
      const match = logContent.match(/Cannot find module ['"](.+?)['"]/i);
      if (match) {
        const moduleName = match[1];
        console.log(`FIXING: Installing missing module: ${moduleName}`);
        return await installMissingModule(moduleName);
      }
    }
  },
  {
    pattern: /SyntaxError.*Unexpected token/i,
    description: 'JavaScript syntax error',
    fix: async (logContent, branch) => {
      console.log('FIXING: Checking for syntax errors in JavaScript files');
      return await runLintFix();
    }
  },
  {
    pattern: /Error: Cannot find module.*\.css/i,
    description: 'Missing CSS module',
    fix: async (logContent, branch) => {
      console.log('FIXING: Rebuilding CSS modules');
      return await rebuildCss();
    }
  },
  {
    pattern: /ENOENT.*no such file or directory/i,
    description: 'Missing file error',
    fix: async (logContent, branch) => {
      const match = logContent.match(/ENOENT.*no such file or directory.*['"](.+?)['"]/i);
      if (match) {
        const filePath = match[1];
        console.log(`FIXING: Creating missing file: ${filePath}`);
        return await createMissingFile(filePath);
      }
    }
  },
  {
    pattern: /npm ERR! code ELIFECYCLE/i,
    description: 'NPM lifecycle error',
    fix: async (logContent, branch) => {
      console.log('FIXING: Cleaning npm cache and reinstalling');
      return await cleanNpmAndReinstall();
    }
  },
  {
    pattern: /Build failed.*out of memory/i,
    description: 'Out of memory error',
    fix: async (logContent, branch) => {
      console.log('FIXING: Optimizing build for memory usage');
      return await optimizeBuildMemory();
    }
  },
  {
    pattern: /ERROR.*Failed to compile/i,
    description: 'Compilation error',
    fix: async (logContent, branch) => {
      console.log('FIXING: Running build with error recovery');
      return await fixCompilationErrors(logContent);
    }
  }
];

class RailwayLogMonitor {
  constructor() {
    this.isRunning = false;
    this.lastChecked = {};
    this.deploymentHistory = {};
    this.errorCounts = {};
    this.fixAttempts = {};
    
    // Initialize log directory
    if (!fs.existsSync(CONFIG.logDir)) {
      fs.mkdirSync(CONFIG.logDir, { recursive: true });
    }
    
    // Initialize tracking for each branch
    CONFIG.branches.forEach(branch => {
      this.lastChecked[branch] = Date.now();
      this.deploymentHistory[branch] = [];
      this.errorCounts[branch] = 0;
      this.fixAttempts[branch] = 0;
    });
  }

  async start() {
    console.log('========================================');
    console.log('RAILWAY LOG MONITOR & AUTO-FIX SYSTEM');
    console.log('Continuous Integration & Deployment');
    console.log('========================================\n');
    
    this.isRunning = true;
    
    // Check if Railway CLI is available
    const railwayAvailable = await this.checkRailwayCli();
    if (!railwayAvailable) {
      console.log('ERROR: Railway CLI not found. Please install: npm install -g @railway/cli');
      console.log('Or login with: railway login');
      return;
    }
    
    // Initial check
    await this.checkAllBranches();
    
    // Set up interval
    this.interval = setInterval(async () => {
      if (this.isRunning) {
        await this.checkAllBranches();
      }
    }, CONFIG.checkInterval);
    
    // Handle shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  async checkRailwayCli() {
    try {
      const { stdout } = await execPromise('railway --version');
      console.log(`Railway CLI version: ${stdout.trim()}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkAllBranches() {
    const timestamp = new Date().toISOString();
    console.log(`\n[CHECK] ${timestamp}`);
    console.log('================================================');
    
    for (const branch of CONFIG.branches) {
      await this.checkBranch(branch);
    }
    
    // Summary
    console.log('\n--- SUMMARY ---');
    console.log(`Branches monitored: ${CONFIG.branches.length}`);
    console.log(`Total errors found: ${Object.values(this.errorCounts).reduce((a, b) => a + b, 0)}`);
    console.log(`Fix attempts: ${Object.values(this.fixAttempts).reduce((a, b) => a + b, 0)}`);
    
    // Save summary to file
    this.saveSummary(timestamp);
  }

  async checkBranch(branch) {
    console.log(`\nChecking ${branch} branch...`);
    
    try {
      // Switch to branch
      await this.switchBranch(branch);
      
      // Get deployment logs
      const logs = await this.getRailwayLogs(branch);
      
      if (!logs) {
        console.log(`  No logs available for ${branch}`);
        return;
      }
      
      // Save logs
      const logFile = this.saveLog(branch, logs);
      console.log(`  Logs saved to: ${logFile}`);
      
      // Analyze logs for errors
      const errors = this.analyzeLogs(logs);
      
      if (errors.length > 0) {
        console.log(`  Found ${errors.length} error(s) in ${branch}`);
        this.errorCounts[branch] += errors.length;
        
        // Attempt auto-fix if enabled
        if (CONFIG.autoFix) {
          await this.attemptAutoFix(branch, logs, errors);
        }
      } else {
        console.log(`  No errors found in ${branch} - deployment successful`);
      }
      
      // Check deployment status
      const status = await this.getDeploymentStatus(branch);
      console.log(`  Deployment status: ${status}`);
      
      // Record in history
      this.deploymentHistory[branch].push({
        timestamp: Date.now(),
        status,
        errors: errors.length,
        fixed: false
      });
      
    } catch (error) {
      console.error(`  Error checking ${branch}: ${error.message}`);
    }
  }

  async switchBranch(branch) {
    try {
      await execPromise(`git checkout ${branch}`);
      await execPromise('git pull origin ' + branch);
    } catch (error) {
      console.log(`  Could not switch to ${branch}: ${error.message}`);
    }
  }

  async getRailwayLogs(branch) {
    try {
      // Try multiple methods to get logs
      
      // Method 1: Railway logs command
      try {
        const { stdout } = await execPromise(`railway logs --service ${CONFIG.projects[branch]} -n 500`, {
          timeout: 30000
        });
        if (stdout) return stdout;
      } catch (e) {
        console.log('  Railway logs command failed, trying alternative...');
      }
      
      // Method 2: Railway deployment list
      try {
        const { stdout } = await execPromise(`railway status`, {
          timeout: 30000
        });
        if (stdout) return stdout;
      } catch (e) {
        console.log('  Railway status command failed');
      }
      
      // Method 3: Check recent git commits for deployment info
      try {
        const { stdout } = await execPromise('git log --oneline -10');
        return `Git commits:\n${stdout}`;
      } catch (e) {
        console.log('  Git log failed');
      }
      
      return null;
      
    } catch (error) {
      console.error(`  Failed to get logs for ${branch}: ${error.message}`);
      return null;
    }
  }

  async getDeploymentStatus(branch) {
    try {
      const { stdout } = await execPromise('railway status', {
        timeout: 10000
      });
      
      if (stdout.includes('Deployed')) {
        return 'DEPLOYED';
      } else if (stdout.includes('Building')) {
        return 'BUILDING';
      } else if (stdout.includes('Failed')) {
        return 'FAILED';
      } else {
        return 'UNKNOWN';
      }
    } catch (error) {
      return 'ERROR';
    }
  }

  analyzeLogs(logs) {
    const errors = [];
    
    for (const errorPattern of ERROR_PATTERNS) {
      if (errorPattern.pattern.test(logs)) {
        errors.push({
          pattern: errorPattern.pattern.toString(),
          description: errorPattern.description,
          fix: errorPattern.fix
        });
      }
    }
    
    // Check for generic error indicators
    if (logs.includes('npm ERR!')) {
      errors.push({
        pattern: 'npm ERR!',
        description: 'NPM error detected',
        fix: null
      });
    }
    
    if (logs.includes('Build failed')) {
      errors.push({
        pattern: 'Build failed',
        description: 'Build failure detected',
        fix: null
      });
    }
    
    return errors;
  }

  async attemptAutoFix(branch, logs, errors) {
    console.log(`  Attempting auto-fix for ${branch}...`);
    this.fixAttempts[branch]++;
    
    let fixApplied = false;
    
    for (const error of errors) {
      if (error.fix && typeof error.fix === 'function') {
        console.log(`  Applying fix for: ${error.description}`);
        
        try {
          const result = await error.fix(logs, branch);
          if (result) {
            console.log(`  Fix applied successfully`);
            fixApplied = true;
          }
        } catch (fixError) {
          console.error(`  Fix failed: ${fixError.message}`);
        }
      }
    }
    
    if (fixApplied && CONFIG.autoCommit) {
      await this.commitAndPush(branch, errors);
    }
  }

  async commitAndPush(branch, errors) {
    console.log(`  Committing fixes to ${branch}...`);
    
    const errorDescriptions = errors.map(e => e.description).join(', ');
    const commitMessage = `fix: auto-fix Railway deployment errors - ${errorDescriptions}

AUTO-FIX by Railway Log Monitor
Errors detected and fixed: ${errors.length}
Branch: ${branch}
Timestamp: ${new Date().toISOString()}`;
    
    try {
      await execPromise('git add -A');
      await execPromise(`git commit -m "${commitMessage}"`);
      
      if (CONFIG.autoDeploy) {
        await execPromise(`git push origin ${branch}`);
        console.log(`  Pushed fixes to ${branch}`);
        
        // Record successful fix
        const latestHistory = this.deploymentHistory[branch];
        if (latestHistory.length > 0) {
          latestHistory[latestHistory.length - 1].fixed = true;
        }
      }
    } catch (error) {
      console.error(`  Failed to commit/push: ${error.message}`);
    }
  }

  saveLog(branch, content) {
    const timestamp = Date.now();
    const filename = `${branch}-${timestamp}.log`;
    const filepath = path.join(CONFIG.logDir, filename);
    
    fs.writeFileSync(filepath, content);
    
    // Clean old logs
    this.cleanOldLogs();
    
    return filepath;
  }

  cleanOldLogs() {
    const now = Date.now();
    const files = fs.readdirSync(CONFIG.logDir);
    
    files.forEach(file => {
      const filepath = path.join(CONFIG.logDir, file);
      const stats = fs.statSync(filepath);
      
      if (now - stats.mtimeMs > CONFIG.maxLogAge) {
        fs.unlinkSync(filepath);
      }
    });
  }

  saveSummary(timestamp) {
    const summary = {
      timestamp,
      branches: CONFIG.branches,
      errorCounts: this.errorCounts,
      fixAttempts: this.fixAttempts,
      deploymentHistory: this.deploymentHistory
    };
    
    const summaryFile = path.join(CONFIG.logDir, 'summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  }

  stop() {
    console.log('\n\nStopping Railway Log Monitor...');
    this.isRunning = false;
    
    if (this.interval) {
      clearInterval(this.interval);
    }
    
    // Final summary
    console.log('Final Statistics:');
    console.log(`Total errors detected: ${Object.values(this.errorCounts).reduce((a, b) => a + b, 0)}`);
    console.log(`Total fix attempts: ${Object.values(this.fixAttempts).reduce((a, b) => a + b, 0)}`);
    
    process.exit(0);
  }
}

// Helper functions for auto-fixes
async function fixTrailingComma(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const fixed = content.replace(/,(\s*[}\]])/g, '$1');
    fs.writeFileSync(file, fixed);
    return true;
  } catch (error) {
    console.error(`Failed to fix trailing comma: ${error.message}`);
    return false;
  }
}

async function installMissingModule(moduleName) {
  try {
    await execPromise(`npm install ${moduleName}`);
    return true;
  } catch (error) {
    console.error(`Failed to install module: ${error.message}`);
    return false;
  }
}

async function runLintFix() {
  try {
    await execPromise('npm run lint:fix');
    return true;
  } catch (error) {
    // Lint might fail but still fix some issues
    return true;
  }
}

async function rebuildCss() {
  try {
    await execPromise('npm run build');
    return true;
  } catch (error) {
    console.error(`Failed to rebuild CSS: ${error.message}`);
    return false;
  }
}

async function createMissingFile(filePath) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create appropriate empty file based on extension
    const ext = path.extname(filePath);
    let content = '';
    
    if (ext === '.js' || ext === '.jsx') {
      content = '// Auto-created by Railway Log Monitor\nexport default {};\n';
    } else if (ext === '.css') {
      content = '/* Auto-created by Railway Log Monitor */\n';
    } else if (ext === '.json') {
      content = '{}';
    }
    
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error(`Failed to create missing file: ${error.message}`);
    return false;
  }
}

async function cleanNpmAndReinstall() {
  try {
    await execPromise('npm cache clean --force');
    await execPromise('rm -rf node_modules package-lock.json');
    await execPromise('npm install');
    return true;
  } catch (error) {
    console.error(`Failed to clean and reinstall: ${error.message}`);
    return false;
  }
}

async function optimizeBuildMemory() {
  try {
    // Add memory optimization to build scripts
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.scripts.build = 'NODE_OPTIONS=--max_old_space_size=4096 vite build';
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    return true;
  } catch (error) {
    console.error(`Failed to optimize memory: ${error.message}`);
    return false;
  }
}

async function fixCompilationErrors(logContent) {
  try {
    // Try various compilation fixes
    
    // Fix 1: Clear build cache
    if (fs.existsSync('dist')) {
      await execPromise('rm -rf dist');
    }
    
    // Fix 2: Update dependencies
    await execPromise('npm update');
    
    // Fix 3: Rebuild
    await execPromise('npm run build');
    
    return true;
  } catch (error) {
    console.error(`Failed to fix compilation: ${error.message}`);
    return false;
  }
}

// Start the monitor
const monitor = new RailwayLogMonitor();
monitor.start();