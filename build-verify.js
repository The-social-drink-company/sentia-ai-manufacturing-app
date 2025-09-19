#!/usr/bin/env node

/**
 * BUILD VERIFICATION SCRIPT
 * Verifies that the build completed successfully
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(70));
console.log('BUILD VERIFICATION');
console.log('='.repeat(70));

const checks = {
  distFolder: false,
  indexHtml: false,
  jsFiles: false,
  cssFiles: false
};

// Check dist folder
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  checks.distFolder = true;
  console.log('✅ dist folder exists');

  // Check index.html
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    checks.indexHtml = true;
    const size = fs.statSync(indexPath).size;
    console.log(`✅ index.html exists (${size} bytes)`);
  } else {
    console.log('❌ index.html not found');
  }

  // Check for JS files
  const files = fs.readdirSync(distPath);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  if (jsFiles.length > 0) {
    checks.jsFiles = true;
    console.log(`✅ Found ${jsFiles.length} JavaScript files`);
  } else {
    console.log('❌ No JavaScript files found');
  }

  // Check for CSS files
  const cssFiles = files.filter(f => f.endsWith('.css'));
  if (cssFiles.length > 0) {
    checks.cssFiles = true;
    console.log(`✅ Found ${cssFiles.length} CSS files`);
  } else {
    console.log('⚠️ No CSS files found (may be inlined)');
  }

  // Check assets folder
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    console.log(`✅ Assets folder contains ${assetFiles.length} files`);
  }
} else {
  console.log('❌ dist folder not found');
}

console.log('='.repeat(70));

// Summary
const allChecks = Object.values(checks);
const passed = allChecks.filter(c => c).length;
const total = allChecks.length;

if (passed === total) {
  console.log(`✅ BUILD VERIFICATION PASSED (${passed}/${total} checks)`);
  process.exit(0);
} else if (checks.distFolder && checks.indexHtml) {
  console.log(`⚠️ BUILD PARTIALLY COMPLETE (${passed}/${total} checks)`);
  console.log('Build is usable but may have warnings');
  process.exit(0);
} else {
  console.log(`❌ BUILD VERIFICATION FAILED (${passed}/${total} checks)`);
  console.log('Critical files missing - build may have failed');
  process.exit(1);
}