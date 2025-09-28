import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const sourceDir = path.join(projectRoot, 'node_modules', '.prisma');
const targetDir = path.join(projectRoot, '.prisma');

if (!fs.existsSync(sourceDir)) {
  console.warn('[Prisma Sync] Source node_modules/.prisma not found; skipping copy.');
  process.exit(0);
}

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}

fs.cpSync(sourceDir, targetDir, { recursive: true });
console.log('[Prisma Sync] Copied Prisma runtime to ./.prisma');
