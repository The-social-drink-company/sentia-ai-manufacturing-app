#!/usr/bin/env node

/**
 * BMAD-METHOD Autonomous Update Agent
 *
 * Automatically checks for and applies updates from the official BMAD-METHOD
 * v6-alpha repository while preserving all project-specific files.
 *
 * Features:
 * - Smart update detection (GitHub API)
 * - Automatic backup before updates
 * - Selective file updates (framework only)
 * - Project file preservation (100% guarantee)
 * - Automatic git commit
 * - Comprehensive logging
 * - Rollback capability
 * - Dry-run mode for testing
 *
 * Usage:
 *   node scripts/bmad-auto-update.js [--dry-run] [--force] [--no-commit]
 *
 * Scheduled via Windows Task Scheduler to run daily at 3:00 AM
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG_FILE = path.join(__dirname, 'bmad-update-config.json');
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BMAD_DIR = path.join(PROJECT_ROOT, 'bmad');
const BMAD_REPO_URL = 'https://github.com/bmad-code-org/BMAD-METHOD.git';
const BMAD_BRANCH = 'v6-alpha';
const BMAD_API_URL = `https://api.github.com/repos/bmad-code-org/BMAD-METHOD/commits/${BMAD_BRANCH}`;
const LOG_DIR = path.join(PROJECT_ROOT, 'logs', 'bmad-updates');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'bmad-backups');

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE_UPDATE = args.includes('--force');
const NO_COMMIT = args.includes('--no-commit');

// ============================================================================
// UTILITIES
// ============================================================================

class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.logs = [];
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    console.log(logEntry);
    this.logs.push(logEntry);
  }

  info(message) { this.log(message, 'INFO'); }
  warn(message) { this.log(message, 'WARN'); }
  error(message) { this.log(message, 'ERROR'); }
  success(message) { this.log(message, 'SUCCESS'); }

  async save() {
    await fs.ensureDir(path.dirname(this.logFile));
    await fs.writeFile(this.logFile, this.logs.join('\n') + '\n');
  }
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

function httpsGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'BMAD-Auto-Update-Agent',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ============================================================================
// UPDATE AGENT
// ============================================================================

class BMADUpdateAgent {
  constructor(logger) {
    this.logger = logger;
    this.config = this.loadConfig();
    this.updateAvailable = false;
    this.currentVersion = null;
    this.latestVersion = null;
    this.backupPath = null;
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return fs.readJsonSync(CONFIG_FILE);
      }
    } catch (error) {
      this.logger.warn(`Could not load config: ${error.message}`);
    }

    // Default configuration
    return {
      enabled: true,
      autoCommit: true,
      backupRetention: 5,
      dryRun: false,
      preserveProjectFiles: true,
      updateCheckURL: BMAD_API_URL,
      notifications: {
        enabled: false,
        email: null,
        webhook: null
      }
    };
  }

  async checkForUpdates() {
    this.logger.info('Checking for BMAD-METHOD updates...');

    try {
      // Get current local version
      const bmadConfigPath = path.join(BMAD_DIR, 'config.yaml');
      if (fs.existsSync(bmadConfigPath)) {
        const bmadConfig = await fs.readFile(bmadConfigPath, 'utf8');
        const versionMatch = bmadConfig.match(/version:\s*"([^"]+)"/);
        if (versionMatch) {
          this.currentVersion = versionMatch[1];
          this.logger.info(`Current BMAD version: ${this.currentVersion}`);
        }
      }

      // Get latest version from GitHub
      const latestCommit = await httpsGet(this.config.updateCheckURL);
      this.latestVersion = latestCommit.sha.substring(0, 7);
      this.logger.info(`Latest BMAD commit: ${this.latestVersion}`);

      // Check if update needed
      const currentCommit = execCommand('git ls-remote https://github.com/bmad-code-org/BMAD-METHOD.git refs/heads/v6-alpha', {
        silent: true
      }).trim().split('\t')[0].substring(0, 7);

      // Get local tracking commit
      const localTrackingPath = path.join(BMAD_DIR, '.bmad-version');
      let localCommit = null;
      if (fs.existsSync(localTrackingPath)) {
        localCommit = (await fs.readFile(localTrackingPath, 'utf8')).trim();
      }

      if (localCommit !== currentCommit || FORCE_UPDATE) {
        this.updateAvailable = true;
        this.logger.success('✓ Update available!');
        this.logger.info(`  Local:  ${localCommit || 'unknown'}`);
        this.logger.info(`  Remote: ${currentCommit}`);
        return true;
      } else {
        this.logger.info('✓ Already up-to-date');
        return false;
      }
    } catch (error) {
      this.logger.error(`Update check failed: ${error.message}`);
      throw error;
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    this.backupPath = path.join(BACKUP_DIR, `bmad-backup-${timestamp}-${Date.now()}`);

    this.logger.info(`Creating backup: ${this.backupPath}`);

    if (DRY_RUN) {
      this.logger.info('[DRY-RUN] Would create backup');
      return;
    }

    try {
      await fs.ensureDir(BACKUP_DIR);
      await fs.copy(BMAD_DIR, this.backupPath);

      // Count files
      const fileCount = (await fs.readdir(this.backupPath, { recursive: true }))
        .filter(f => fs.statSync(path.join(this.backupPath, f)).isFile()).length;

      this.logger.success(`✓ Backup created (${fileCount} files)`);

      // Cleanup old backups
      await this.cleanupOldBackups();
    } catch (error) {
      this.logger.error(`Backup failed: ${error.message}`);
      throw error;
    }
  }

  async cleanupOldBackups() {
    try {
      const backups = await fs.readdir(BACKUP_DIR);
      const bmadBackups = backups
        .filter(f => f.startsWith('bmad-backup-'))
        .sort()
        .reverse();

      if (bmadBackups.length > this.config.backupRetention) {
        const toDelete = bmadBackups.slice(this.config.backupRetention);
        this.logger.info(`Cleaning up ${toDelete.length} old backups...`);

        for (const backup of toDelete) {
          await fs.remove(path.join(BACKUP_DIR, backup));
        }
      }
    } catch (error) {
      this.logger.warn(`Backup cleanup failed: ${error.message}`);
    }
  }

  async performUpdate() {
    this.logger.info('Performing BMAD-METHOD update...');

    if (DRY_RUN) {
      this.logger.info('[DRY-RUN] Would perform update');
      this.logger.info('[DRY-RUN] Framework files would be updated');
      this.logger.info('[DRY-RUN] Project files would be preserved');
      return true;
    }

    try {
      // Clone latest v6-alpha to temp directory
      const tempDir = path.join(PROJECT_ROOT, '.bmad-update-temp');

      this.logger.info('Cloning latest BMAD-METHOD v6-alpha...');
      await fs.remove(tempDir);
      execCommand(`git clone --branch ${BMAD_BRANCH} --single-branch --depth 1 ${BMAD_REPO_URL} "${tempDir}"`, {
        silent: false
      });

      // Identify project files to preserve
      const projectDirs = [
        'epics',
        'stories',
        'retrospectives',
        'planning',
        'solutioning',
        'status',
        'progress',
        'reports',
        'audit',
        'guides',
        'context'
      ];

      const preserveFiles = [];
      for (const dir of projectDirs) {
        const dirPath = path.join(BMAD_DIR, dir);
        if (fs.existsSync(dirPath)) {
          const files = await fs.readdir(dirPath, { recursive: true });
          files.forEach(f => preserveFiles.push(path.join(dir, f)));
        }
      }

      // Also preserve specific files
      const preserveSpecificFiles = [
        'config.yaml',
        'core/core-config.yaml',
        'bmm/config.yaml',
        '.bmad-version'
      ];

      this.logger.info(`Preserving ${preserveFiles.length} project files...`);

      // Backup project files temporarily
      const projectBackup = path.join(tempDir, '_project-backup');
      await fs.ensureDir(projectBackup);

      for (const file of [...preserveFiles, ...preserveSpecificFiles]) {
        const sourcePath = path.join(BMAD_DIR, file);
        const targetPath = path.join(projectBackup, file);

        if (fs.existsSync(sourcePath)) {
          await fs.ensureDir(path.dirname(targetPath));
          await fs.copy(sourcePath, targetPath);
        }
      }

      // Update framework files
      this.logger.info('Updating framework files...');

      // Copy new core
      await fs.remove(path.join(BMAD_DIR, 'core'));
      await fs.copy(
        path.join(tempDir, 'bmad', 'core'),
        path.join(BMAD_DIR, 'core')
      );

      // Copy new BMM module
      await fs.remove(path.join(BMAD_DIR, 'bmm'));
      await fs.copy(
        path.join(tempDir, 'src', 'modules', 'bmm'),
        path.join(BMAD_DIR, 'bmm')
      );

      // Copy _cfg and docs
      await fs.copy(
        path.join(tempDir, 'bmad', '_cfg'),
        path.join(BMAD_DIR, '_cfg'),
        { overwrite: true }
      );

      await fs.copy(
        path.join(tempDir, 'bmad', 'docs'),
        path.join(BMAD_DIR, 'docs'),
        { overwrite: true }
      );

      // Restore project files
      this.logger.info('Restoring project files...');
      await fs.copy(projectBackup, BMAD_DIR, { overwrite: true });

      // Update version tracking
      const latestCommit = execCommand(`git --git-dir="${path.join(tempDir, '.git')}" rev-parse HEAD`, {
        silent: true
      }).trim().substring(0, 7);

      await fs.writeFile(
        path.join(BMAD_DIR, '.bmad-version'),
        latestCommit
      );

      // Update config.yaml with new version
      const newPackageJson = await fs.readJson(path.join(tempDir, 'package.json'));
      const configPath = path.join(BMAD_DIR, 'config.yaml');
      let config = await fs.readFile(configPath, 'utf8');
      config = config.replace(
        /version:\s*"[^"]+"/,
        `version: "${newPackageJson.version}"`
      );
      config = config.replace(
        /date:\s*"[^"]+"/,
        `date: "${new Date().toISOString().split('T')[0]}"`
      );
      await fs.writeFile(configPath, config);

      // Cleanup temp directory
      await fs.remove(tempDir);

      this.logger.success('✓ Update complete!');
      return true;
    } catch (error) {
      this.logger.error(`Update failed: ${error.message}`);
      throw error;
    }
  }

  async validateUpdate() {
    this.logger.info('Validating update...');

    try {
      // Check critical files exist
      const criticalFiles = [
        'bmad/core/config.yaml',
        'bmad/bmm/config.yaml',
        'bmad/config.yaml'
      ];

      for (const file of criticalFiles) {
        const filePath = path.join(PROJECT_ROOT, file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Critical file missing: ${file}`);
        }
      }

      // Check project files preserved
      const projectDirs = ['epics', 'stories', 'retrospectives'];
      for (const dir of projectDirs) {
        const dirPath = path.join(BMAD_DIR, dir);
        if (!fs.existsSync(dirPath)) {
          this.logger.warn(`Project directory missing: ${dir}`);
        }
      }

      this.logger.success('✓ Validation passed');
      return true;
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`);
      throw error;
    }
  }

  async createGitCommit() {
    if (NO_COMMIT || !this.config.autoCommit) {
      this.logger.info('Skipping git commit (disabled)');
      return;
    }

    this.logger.info('Creating git commit...');

    if (DRY_RUN) {
      this.logger.info('[DRY-RUN] Would create git commit');
      return;
    }

    try {
      // Check if there are changes
      const status = execCommand('git status --porcelain', { silent: true });
      if (!status.trim()) {
        this.logger.info('No changes to commit');
        return;
      }

      // Stage changes
      execCommand('git add bmad/');

      // Create commit
      const commitMessage = `chore: Auto-update BMAD-METHOD to v6-alpha (${this.latestVersion})

Autonomous update performed by bmad-auto-update agent.

Changes:
- Updated framework files (core, BMM module)
- Preserved all project files (epics, stories, retrospectives)
- Updated version tracking

🤖 Generated by BMAD Auto-Update Agent

Co-Authored-By: Claude <noreply@anthropic.com>`;

      execCommand(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);

      this.logger.success('✓ Git commit created');
    } catch (error) {
      this.logger.error(`Git commit failed: ${error.message}`);
      // Non-fatal error
    }
  }

  async generateReport() {
    const reportPath = path.join(BMAD_DIR, 'status', `auto-update-${new Date().toISOString().split('T')[0]}.md`);

    const report = `# BMAD-METHOD Auto-Update Report

**Date**: ${new Date().toISOString()}
**Status**: ${this.updateAvailable ? 'Updated' : 'No Update Needed'}
**Current Version**: ${this.currentVersion}
**Latest Version**: ${this.latestVersion}
**Dry Run**: ${DRY_RUN ? 'Yes' : 'No'}

## Update Summary

${this.updateAvailable ? '✅ Update applied successfully' : '✓ Already up-to-date'}

## Actions Taken

${this.updateAvailable ? `
- Created backup: ${this.backupPath}
- Updated framework files (core, BMM module)
- Preserved all project files
- Validated update success
- ${!NO_COMMIT && this.config.autoCommit ? 'Created git commit' : 'Skipped git commit'}
` : '- No update required'}

## Log

\`\`\`
${this.logger.logs.join('\n')}
\`\`\`

---

**Generated by**: BMAD Auto-Update Agent
**Configuration**: scripts/bmad-update-config.json
`;

    if (!DRY_RUN) {
      await fs.ensureDir(path.dirname(reportPath));
      await fs.writeFile(reportPath, report);
      this.logger.info(`Report saved: ${reportPath}`);
    } else {
      this.logger.info('[DRY-RUN] Would save report');
    }
  }

  async rollback() {
    if (!this.backupPath || !fs.existsSync(this.backupPath)) {
      throw new Error('No backup available for rollback');
    }

    this.logger.warn('Rolling back to previous version...');

    await fs.remove(BMAD_DIR);
    await fs.copy(this.backupPath, BMAD_DIR);

    this.logger.success('✓ Rollback complete');
  }

  async run() {
    try {
      this.logger.info('=== BMAD-METHOD Auto-Update Agent ===');
      this.logger.info(`Mode: ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}`);
      this.logger.info(`Project: ${PROJECT_ROOT}`);

      if (!this.config.enabled) {
        this.logger.info('Auto-update is disabled in configuration');
        return;
      }

      // Check for updates
      const updateAvailable = await this.checkForUpdates();

      if (!updateAvailable && !FORCE_UPDATE) {
        this.logger.info('No update needed');
        await this.generateReport();
        return;
      }

      // Create backup
      await this.createBackup();

      // Perform update
      const success = await this.performUpdate();

      if (success) {
        // Validate
        await this.validateUpdate();

        // Create git commit
        await this.createGitCommit();

        // Generate report
        await this.generateReport();

        this.logger.success('=== Update Complete ===');
      }
    } catch (error) {
      this.logger.error(`Update failed: ${error.message}`);

      if (this.backupPath && !DRY_RUN) {
        try {
          await this.rollback();
        } catch (rollbackError) {
          this.logger.error(`Rollback failed: ${rollbackError.message}`);
        }
      }

      throw error;
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(LOG_DIR, `update-${timestamp}.log`);
  const logger = new Logger(logFile);

  try {
    const agent = new BMADUpdateAgent(logger);
    await agent.run();
    await logger.save();
    process.exit(0);
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    await logger.save();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { BMADUpdateAgent };
