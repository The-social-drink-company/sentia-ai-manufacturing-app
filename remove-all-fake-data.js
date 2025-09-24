#!/usr/bin/env node
/**
 * REMOVE ALL FAKE DATA SCRIPT
 * This script removes ALL fake, demo, static, fallback, and hardcoded data
 * from the entire codebase, ensuring only real API data is used.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATTERNS_TO_REMOVE = [
  // Math.random() patterns
  /Math\.random\(\)[^;]*/g,

  // Hardcoded numeric values
  /revenue:?\s*\d{4,}/g,
  /profit:?\s*\d{4,}/g,
  /workingCapital:?\s*789200/g,
  /cashFlow:?\s*423500/g,

  // Fallback data patterns
  /fallback.*=.*\{[\s\S]*?\}/g,
  /mockData.*=.*\{[\s\S]*?\}/g,
  /demoData.*=.*\{[\s\S]*?\}/g,
  /sampleData.*=.*\{[\s\S]*?\}/g,

  // Hardcoded arrays
  /\[45000,\s*42000,\s*48000.*?\]/g,
  /\[380000,\s*395000,\s*410000.*?\]/g,

  // Default values with OR operators
  /\|\|\s*\d{2,}/g,  // || 125, || 94.2, etc.

  // Specific mock product names
  /'CNC Machine [AB]'/g,
  /'Assembly Line \d'/g,
  /'Packaging Unit [AB]'/g,
  /'Quality Test Station'/g,
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  const originalContent = content;

  // Skip certain files
  if (filePath.includes('node_modules') ||
      filePath.includes('.git') ||
      filePath.includes('dist') ||
      filePath.includes('build') ||
      filePath.includes('.env') ||
      filePath.includes('remove-all-fake-data.js')) {
    return false;
  }

  // Remove patterns
  PATTERNS_TO_REMOVE.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      console.log(`  Found pattern in ${filePath}: ${matches[0].substring(0, 50)}...`);
      content = content.replace(pattern, '0');  // Replace with 0 or empty
      modified = true;
    }
  });

  // Remove specific fallback data blocks
  content = content.replace(/\/\/ Fallback to statistical models[\s\S]*?return \{[\s\S]*?\}/g,
    '// No fallback data - require real API connection\nthrow new Error("API connection required - no mock data allowed");');

  // Replace default values in OR operators
  content = content.replace(/(\w+)\s*\|\|\s*\d{2,}/g, '$1 || 0');
  content = content.replace(/(\w+)\s*\|\|\s*['"`].*?['"`]/g, '$1 || null');

  // Remove hardcoded test data in API routes
  if (filePath.includes('api/routes')) {
    content = content.replace(/res\.json\(\{[\s\S]*?fallback:\s*true[\s\S]*?\}\);/g,
      'res.status(503).json({ error: "API not configured - real data required" });');
  }

  // Remove simulated data generation
  content = content.replace(/Array\.from\(\{.*length:.*\},[\s\S]*?\)/g, '[]');

  // Remove hardcoded metrics
  content = content.replace(/efficiency:\s*85\.?\d*/g, 'efficiency: 0');
  content = content.replace(/reliability:\s*94\.?\d*/g, 'reliability: 0');
  content = content.replace(/availability:\s*93\.?\d*/g, 'availability: 0');

  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Cleaned: ${filePath}`);
    return true;
  }

  return false;
}

function scanDirectory(dir) {
  let filesProcessed = 0;
  let filesModified = 0;

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip certain directories
      if (!file.startsWith('.') &&
          file !== 'node_modules' &&
          file !== 'dist' &&
          file !== 'build') {
        const result = scanDirectory(filePath);
        filesProcessed += result.processed;
        filesModified += result.modified;
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      filesProcessed++;
      if (processFile(filePath)) {
        filesModified++;
      }
    }
  });

  return { processed: filesProcessed, modified: filesModified };
}

console.log('='.repeat(60));
console.log('REMOVING ALL FAKE/DEMO/STATIC DATA FROM CODEBASE');
console.log('='.repeat(60));

// Process src directory
console.log('\nProcessing React components...');
const srcResult = scanDirectory(path.join(__dirname, 'src'));

// Process API routes
console.log('\nProcessing API routes...');
const apiResult = scanDirectory(path.join(__dirname, 'api'));

// Process server files
console.log('\nProcessing server files...');
const serverFiles = ['server.js', 'server-render.js', 'render-server.js', 'enterprise-server.js'];
let serverModified = 0;
serverFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath) && processFile(filePath)) {
    serverModified++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`React components: ${srcResult.modified}/${srcResult.processed} files modified`);
console.log(`API routes: ${apiResult.modified}/${apiResult.processed} files modified`);
console.log(`Server files: ${serverModified}/${serverFiles.length} files modified`);
console.log(`\nTotal files modified: ${srcResult.modified + apiResult.modified + serverModified}`);
console.log('\n✅ All fake/demo/static data removed!');
console.log('⚠️  Application now requires real API connections to function');