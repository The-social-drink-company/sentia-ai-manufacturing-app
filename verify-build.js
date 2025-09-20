#!/usr/bin/env node

/**
 * Build Verification Script
 * Ensures all required assets are present after build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(60));
console.log('BUILD VERIFICATION SCRIPT');
console.log('='.repeat(60));

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');
const jsPath = path.join(distPath, 'js');

console.log('Checking build artifacts...');
console.log('- dist folder:', fs.existsSync(distPath) ? '✓ EXISTS' : '✗ MISSING');
console.log('- index.html:', fs.existsSync(indexPath) ? '✓ EXISTS' : '✗ MISSING');
console.log('- js folder:', fs.existsSync(jsPath) ? '✓ EXISTS' : '✗ MISSING');

if (fs.existsSync(jsPath)) {
  const jsFiles = fs.readdirSync(jsPath);
  console.log(`- JS files count: ${jsFiles.length}`);
  console.log('- Sample JS files:', jsFiles.slice(0, 3).join(', '));
}

if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const hasClerkKey = indexContent.includes('VITE_CLERK_PUBLISHABLE_KEY');
  console.log('- Clerk key in index.html:', hasClerkKey ? '✓ PRESENT' : '✗ MISSING');
}

console.log('='.repeat(60));

// Exit with error if critical files are missing
if (!fs.existsSync(distPath) || !fs.existsSync(indexPath)) {
  console.error('CRITICAL: Build artifacts missing!');
  process.exit(1);
}

console.log('BUILD VERIFICATION PASSED ✓');
