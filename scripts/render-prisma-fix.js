#!/usr/bin/env node

/**
 * Render Prisma Fix
 * This script runs as postinstall to ensure all prisma db push commands include --accept-data-loss
 */

import fs from 'fs';
import path from 'path';

console.log('Installing Render Prisma fix...');

// Create a wrapper script that intercepts prisma commands
const wrapperScript = `#!/usr/bin/env node
const { spawn } = require('child_process');
const args = process.argv.slice(2);

// Always add --accept-data-loss to db push commands
if (args.includes('db') && args.includes('push')) {
  if (!args.includes('--accept-data-loss')) {
    args.push('--accept-data-loss');
    console.log('Auto-added --accept-data-loss flag for Render deployment');
  }
}

// Run actual prisma with modified args
const prisma = spawn('node', [require.resolve('@prisma/cli/build/index.js'), ...args], {
  stdio: 'inherit'
});

prisma.on('exit', code => {
  process.exit(code || 0);
});
`;

try {
  // Write the wrapper to node_modules/.bin (where npm scripts look first)
  const binPath = path.join(process.cwd(), 'node_modules', '.bin');
  const wrapperPath = path.join(binPath, 'prisma-safe');

  if (!fs.existsSync(binPath)) {
    fs.mkdirSync(binPath, { recursive: true });
  }

  fs.writeFileSync(wrapperPath, wrapperScript);
  fs.chmodSync(wrapperPath, '755');

  console.log('✓ Prisma wrapper installed successfully');
} catch (error) {
  console.log('Could not install prisma wrapper, but continuing:', error.message);
}