#!/usr/bin/env node

/**
 * Render Monitor Agent - Status Checker
 * Shows current status of the 24/7 monitoring agent
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  pidFile: path.join(__dirname, 'render-monitor.pid'),
  logFile: path.join(__dirname, 'deployment-monitor.log'),
  statusFile: path.join(__dirname, 'deployment-status.json'),
  errorFile: path.join(__dirname, 'render-monitor-errors.log')
};

console.log('========================================');
console.log(' RENDER MONITOR AGENT - STATUS CHECK');
console.log('========================================');
console.log();

// Check if agent is running
let isRunning = false;
let pid = null;

if (fs.existsSync(CONFIG.pidFile)) {
  pid = fs.readFileSync(CONFIG.pidFile, 'utf8').trim();

  // Check if process is actually running (Windows)
  try {
    const result = execSync(`tasklist /FI "PID eq ${pid}"`, { encoding: 'utf8' });
    isRunning = result.includes('node.exe');
  } catch (error) {
    isRunning = false;
  }
}

// Display running status
if (isRunning) {
  console.log('STATUS: RUNNING');
  console.log(`Process ID: ${pid}`);
} else {
  console.log('STATUS: NOT RUNNING');
  if (pid) {
    console.log(`(Stale PID file found: ${pid})`);
  }
}
console.log();

// Show last log entries
if (fs.existsSync(CONFIG.logFile)) {
  console.log('RECENT LOG ENTRIES:');
  console.log('-------------------');

  const logs = fs.readFileSync(CONFIG.logFile, 'utf8').split('\n');
  const recentLogs = logs.slice(-10).filter(Boolean);

  recentLogs.forEach(log => {
    // Format log output
    if (log.includes('[SUCCESS]')) {
      console.log(log);
    } else if (log.includes('[WARNING]')) {
      console.log(log);
    } else if (log.includes('[ERROR]') || log.includes('[CRITICAL]')) {
      console.log(log);
    } else {
      console.log(log);
    }
  });
  console.log();
}

// Show last deployment status
if (fs.existsSync(CONFIG.statusFile)) {
  console.log('LAST DEPLOYMENT STATUS:');
  console.log('----------------------');

  const statusLines = fs.readFileSync(CONFIG.statusFile, 'utf8').split('\n').filter(Boolean);
  if (statusLines.length > 0) {
    const lastStatus = JSON.parse(statusLines[statusLines.length - 1]);
    console.log(`Timestamp: ${lastStatus.timestamp}`);
    console.log(`Healthy: ${lastStatus.healthy ? 'YES' : 'NO'}`);
    console.log(`Consecutive Failures: ${lastStatus.failures}`);

    if (lastStatus.errors && lastStatus.errors.length > 0) {
      console.log('Errors:');
      lastStatus.errors.forEach(error => {
        console.log(`  - ${error.type}: ${error.description}`);
      });
    }
  }
  console.log();
}

// Show recent errors
if (fs.existsSync(CONFIG.errorFile)) {
  const errorLog = fs.readFileSync(CONFIG.errorFile, 'utf8').split('\n').filter(Boolean);
  if (errorLog.length > 0) {
    console.log('RECENT ERRORS:');
    console.log('-------------');
    const recentErrors = errorLog.slice(-3);
    recentErrors.forEach(error => {
      console.log(error);
    });
    console.log();
  }
}

// Show commands
console.log('AVAILABLE COMMANDS:');
console.log('------------------');
if (isRunning) {
  console.log('npm run render:stop     - Stop the monitoring agent');
  console.log('npm run render:logs     - View live logs');
} else {
  console.log('npm run render:monitor  - Start 24/7 monitoring');
  console.log('npm run render:check    - Run single check');
}

console.log();
console.log('========================================');