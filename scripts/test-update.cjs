#!/usr/bin/env node

/**
 * BMAD Auto-Update Agent - Test Script
 *
 * Tests the update agent in dry-run mode without making any actual changes.
 * Useful for validating configuration and testing update detection logic.
 *
 * Usage:
 *   node scripts/test-update.js [--verbose] [--force]
 */

const { BMADUpdateAgent } = require('./bmad-auto-update.cjs');
const path = require('path');
const fs = require('fs-extra');

// Parse arguments
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const FORCE = args.includes('--force');

// Test logger with colorized output
class TestLogger {
  constructor() {
    this.logs = [];
  }

  log(message, level = 'INFO') {
    const colors = {
      INFO: '\x1b[37m',    // White
      SUCCESS: '\x1b[32m', // Green
      WARN: '\x1b[33m',    // Yellow
      ERROR: '\x1b[31m',   // Red
      RESET: '\x1b[0m'
    };

    const color = colors[level] || colors.INFO;
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;

    console.log(`${color}${logEntry}${colors.RESET}`);
    this.logs.push(logEntry);
  }

  info(message) { this.log(message, 'INFO'); }
  warn(message) { this.log(message, 'WARN'); }
  error(message) { this.log(message, 'ERROR'); }
  success(message) { this.log(message, 'SUCCESS'); }

  async save() {
    // No-op for test logger
  }
}

// Test runner
async function runTests() {
  const logger = new TestLogger();

  console.log('\n' + '='.repeat(70));
  console.log('BMAD AUTO-UPDATE AGENT - TEST MODE');
  console.log('='.repeat(70) + '\n');

  logger.info('Starting test run...');
  logger.info(`Mode: DRY-RUN${FORCE ? ' + FORCE' : ''}`);
  logger.info(`Verbose: ${VERBOSE ? 'Yes' : 'No'}`);

  const projectRoot = path.resolve(__dirname, '..');
  const bmadDir = path.join(projectRoot, 'bmad');
  const configPath = path.join(__dirname, 'bmad-update-config.json');

  // Test 1: Check project structure
  logger.info('\nTest 1: Checking project structure...');
  const requiredPaths = [
    { path: bmadDir, type: 'directory', name: 'bmad/' },
    { path: path.join(bmadDir, 'config.yaml'), type: 'file', name: 'bmad/config.yaml' },
    { path: path.join(bmadDir, 'core'), type: 'directory', name: 'bmad/core/' },
    { path: path.join(bmadDir, 'bmm'), type: 'directory', name: 'bmad/bmm/' },
    { path: configPath, type: 'file', name: 'config file' }
  ];

  let allPathsExist = true;
  for (const { path: checkPath, type, name } of requiredPaths) {
    try {
      const exists = await fs.pathExists(checkPath);
      if (!exists) {
        logger.error(`  ✗ Missing ${type}: ${name}`);
        allPathsExist = false;
      } else {
        logger.success(`  ✓ Found ${type}: ${name}`);
      }
    } catch (error) {
      logger.error(`  ✗ Error checking ${name}: ${error.message}`);
      allPathsExist = false;
    }
  }

  if (!allPathsExist) {
    logger.error('\nProject structure validation failed!');
    return false;
  }

  logger.success('\n✓ Test 1 passed: Project structure valid');

  // Test 2: Check configuration
  logger.info('\nTest 2: Checking configuration...');
  try {
    const config = await fs.readJson(configPath);
    const requiredKeys = ['enabled', 'autoCommit', 'updateCheckURL', 'projectFiles'];

    let configValid = true;
    for (const key of requiredKeys) {
      if (config[key] !== undefined) {
        logger.success(`  ✓ Config has '${key}'`);
      } else {
        logger.error(`  ✗ Config missing '${key}'`);
        configValid = false;
      }
    }

    if (!configValid) {
      logger.error('\nConfiguration validation failed!');
      return false;
    }

    if (VERBOSE) {
      logger.info('\n  Configuration details:');
      logger.info(`    Enabled: ${config.enabled}`);
      logger.info(`    Auto-commit: ${config.autoCommit}`);
      logger.info(`    Backup retention: ${config.backupRetention}`);
      logger.info(`    Project dirs: ${config.projectFiles.preserveDirectories.length}`);
    }

    logger.success('\n✓ Test 2 passed: Configuration valid');
  } catch (error) {
    logger.error(`\nConfiguration read failed: ${error.message}`);
    return false;
  }

  // Test 3: Check current BMAD version
  logger.info('\nTest 3: Checking current BMAD version...');
  try {
    const bmadConfigPath = path.join(bmadDir, 'config.yaml');
    const bmadConfig = await fs.readFile(bmadConfigPath, 'utf8');
    const versionMatch = bmadConfig.match(/version:\s*"([^"]+)"/);

    if (versionMatch) {
      logger.success(`  ✓ Current version: ${versionMatch[1]}`);
    } else {
      logger.warn('  ⚠ Could not detect version from config');
    }

    logger.success('\n✓ Test 3 passed: Version detection working');
  } catch (error) {
    logger.error(`\nVersion check failed: ${error.message}`);
    return false;
  }

  // Test 4: Count project files
  logger.info('\nTest 4: Counting project files...');
  try {
    const config = await fs.readJson(configPath);
    const projectDirs = config.projectFiles.preserveDirectories;

    let totalFiles = 0;
    const dirCounts = {};

    for (const dir of projectDirs) {
      const dirPath = path.join(bmadDir, dir);
      if (await fs.pathExists(dirPath)) {
        const files = await fs.readdir(dirPath, { recursive: true });
        const fileCount = files.filter(f => {
          const fullPath = path.join(dirPath, f);
          return fs.statSync(fullPath).isFile();
        }).length;

        dirCounts[dir] = fileCount;
        totalFiles += fileCount;
      }
    }

    logger.info(`  Total project files: ${totalFiles}`);
    if (VERBOSE) {
      for (const [dir, count] of Object.entries(dirCounts)) {
        logger.info(`    ${dir}: ${count} files`);
      }
    }

    logger.success('\n✓ Test 4 passed: Project file counting working');
  } catch (error) {
    logger.error(`\nProject file count failed: ${error.message}`);
    return false;
  }

  // Test 5: Test update check (dry-run)
  logger.info('\nTest 5: Testing update check...');
  logger.info('This will make a GitHub API request...');

  try {
    // Temporarily override process.argv for dry-run
    const originalArgv = process.argv;
    process.argv = [
      process.argv[0],
      path.join(__dirname, 'bmad-auto-update.js'),
      '--dry-run',
      ...(FORCE ? ['--force'] : []),
      '--no-commit'
    ];

    const agent = new BMADUpdateAgent(logger);
    await agent.run();

    process.argv = originalArgv;

    logger.success('\n✓ Test 5 passed: Update agent dry-run completed');
  } catch (error) {
    logger.error(`\nUpdate agent test failed: ${error.message}`);
    if (VERBOSE && error.stack) {
      logger.error(error.stack);
    }
    return false;
  }

  return true;
}

// Main execution
async function main() {
  try {
    const success = await runTests();

    console.log('\n' + '='.repeat(70));
    if (success) {
      console.log('\x1b[32m✓ ALL TESTS PASSED\x1b[0m');
      console.log('\nThe BMAD Auto-Update Agent is configured correctly and ready to use.');
      console.log('\nNext steps:');
      console.log('  1. Review the dry-run output above');
      console.log('  2. Run: powershell -ExecutionPolicy Bypass -File scripts/setup-task-scheduler.ps1');
      console.log('  3. Check scheduled task: Get-ScheduledTask -TaskName "BMAD-Auto-Update-Daily"');
    } else {
      console.log('\x1b[31m✗ TESTS FAILED\x1b[0m');
      console.log('\nPlease fix the errors above before using the auto-update agent.');
    }
    console.log('='.repeat(70) + '\n');

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\x1b[31m\nFatal error during testing:\x1b[0m', error.message);
    if (VERBOSE && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
