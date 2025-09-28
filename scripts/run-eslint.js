#!/usr/bin/env node

/**
 * ESLint runner script to handle Windows execution issues
 * This script provides a workaround for ESLint binary accessibility issues on Windows
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Get command line arguments (skip first two: node and script path)
const args = process.argv.slice(2);

// Add default targets if none specified
if (!args.some(arg => !arg.startsWith('-'))) {
  args.push('src', 'server');
}

// Construct the eslint command
const eslintPath = join(projectRoot, 'node_modules', '.bin', 'eslint.cmd');
const eslintArgs = [...args];

console.log('Running ESLint with args:', eslintArgs.join(' '));

// Execute eslint
const eslint = spawn('cmd.exe', ['/c', eslintPath, ...eslintArgs], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: false
});

eslint.on('close', _(code) => {
  process.exit(code);
});

eslint.on('error', _(err) => {
  console.error('Failed to run ESLint:', err.message);
  process.exit(1);
});