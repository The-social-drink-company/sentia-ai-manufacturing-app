#!/usr/bin/env node
/**
 * Ensure Vite Build Script
 * This script ensures vite is available and runs the build process
 * Designed to work even when vite module resolution fails
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function ensureVite() {
  console.log('Ensuring vite is available...');

  try {
    // Try to require vite to see if it's installed
    await execAsync('npm ls vite', { cwd: projectRoot });
    console.log('Vite is already installed');
  } catch (error) {
    console.log('Vite not found, installing...');
    try {
      await execAsync('npm install vite --save-dev', { cwd: projectRoot });
      console.log('Vite installed successfully');
    } catch (installError) {
      console.error('Failed to install vite:', installError.message);
      process.exit(1);
    }
  }
}

async function runViteBuild() {
  console.log('Running vite build...');

  // Try multiple methods to run vite build
  const commands = [
    'npx vite build',
    './node_modules/.bin/vite build',
    'node node_modules/vite/bin/vite.js build'
  ];

  for (const command of commands) {
    try {
      console.log(`Trying: ${command}`);
      const { stdout, stderr } = await execAsync(command, {
        cwd: projectRoot,
        env: { ...process.env, NODE_ENV: 'production' }
      });

      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('warning')) console.error(stderr);

      console.log('Vite build completed successfully');
      return true;
    } catch (error) {
      console.log(`Command failed: ${command}`);
      console.log(`Error: ${error.message}`);
    }
  }

  throw new Error('All vite build attempts failed');
}

async function runPrismaGenerate() {
  console.log('Running Prisma generate...');
  try {
    const { stdout, stderr } = await execAsync('npx prisma generate', { cwd: projectRoot });
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.error(stderr);
    console.log('Prisma generate completed');
  } catch (error) {
    console.error('Prisma generate failed:', error.message);
    // Don't exit on Prisma generate failure
  }
}

async function runPrismaDbPush() {
  console.log('Running Prisma db push...');
  try {
    const { stdout, stderr } = await execAsync(
      'npx prisma db push --accept-data-loss --skip-generate',
      { cwd: projectRoot }
    );
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.error(stderr);
    console.log('Prisma db push completed');
  } catch (error) {
    console.log('Prisma db push failed (non-critical):', error.message);
    // Don't exit on db push failure as it's non-critical
  }
}

async function main() {
  console.log('Starting Render build process...');

  try {
    // Ensure vite is installed
    await ensureVite();

    // Run vite build
    await runViteBuild();

    // Run Prisma tasks
    await runPrismaGenerate();
    await runPrismaDbPush();

    console.log('Build process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Build process failed:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();