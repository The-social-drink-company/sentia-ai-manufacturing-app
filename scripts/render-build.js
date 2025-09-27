#!/usr/bin/env node
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('==> Render Build Script Starting...');

// Check if dist folder exists
const distPath = join(rootDir, 'dist');
if (existsSync(distPath)) {
  console.log('==> dist folder already exists, skipping build');
} else {
  console.log('==> dist folder not found, installing build dependencies...');

  try {
    // Install ALL dependencies including devDependencies for build
    console.log('==> Installing all dependencies (including dev)...');
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit', cwd: rootDir });

    // Run the build
    console.log('==> Building React application...');
    execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

    console.log('==> Build completed successfully!');
  } catch (error) {
    console.error('==> Build failed:', error.message);
    process.exit(1);
  }
}

console.log('==> Render build script completed');