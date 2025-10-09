import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Multiple possible source locations for Prisma client
const possibleSources = [
  path.join(projectRoot, 'node_modules', '.prisma'),
  path.join(projectRoot, 'node_modules', '.pnpm', '@prisma+client@6.16.3_prisma@6.16.3', 'node_modules', '.prisma'),
  path.join(projectRoot, 'node_modules', '.pnpm', '@prisma+client@6.16.2_prisma@6.16.2', 'node_modules', '.prisma'),
  path.join(projectRoot, 'node_modules', '@prisma', 'client', '.prisma')
];

const targetDir = path.join(projectRoot, '.prisma');

// Find the first existing source directory
let sourceDir = null;
for (const source of possibleSources) {
  if (fs.existsSync(source)) {
    sourceDir = source;
    console.log(`[Prisma Sync] Found Prisma client at: ${source}`);
    break;
  }
}

if (!sourceDir) {
  console.warn('[Prisma Sync] No Prisma client found in any expected location');
  console.warn('[Prisma Sync] Checked paths:', possibleSources);
  process.exit(0);
}

// Remove existing target directory if it exists
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  console.log('[Prisma Sync] Removed existing .prisma directory');
}

// Copy Prisma client to target location
try {
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log('[Prisma Sync] Successfully copied Prisma runtime to ./.prisma');
  
  // Verify the copy was successful
  const clientIndexPath = path.join(targetDir, 'client', 'index.js');
  if (fs.existsSync(clientIndexPath)) {
    console.log('[Prisma Sync] Verified Prisma client is accessible');
  } else {
    console.warn('[Prisma Sync] Warning: Could not verify Prisma client accessibility');
  }
} catch (error) {
  console.error('[Prisma Sync] Failed to copy Prisma runtime:', error.message);
  process.exit(1);
}
