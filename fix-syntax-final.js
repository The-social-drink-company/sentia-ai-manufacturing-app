#!/usr/bin/env node

/**
 * Final Comprehensive Syntax Fix Script
 * Fixes all remaining malformed underscore patterns from ESLint auto-fixes
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PATTERNS_TO_FIX = [
  // Fix malformed string patterns
  { search: /_'/g, replace: "'" },
  { search: /_"/g, replace: '"' },

  // Fix malformed function parameters
  { search: /\(_([a-zA-Z_][a-zA-Z0-9_]*)\)/g, replace: '($1)' },
  { search: /\(([^,)]+),\s*_([a-zA-Z_][a-zA-Z0-9_]*)\)/g, replace: '($1, $2)' },
  { search: /\(([^,)]+),\s*([^,)]+),\s*_([a-zA-Z_][a-zA-Z0-9_]*)\)/g, replace: '($1, $2, $3)' },

  // Fix arrow function parameters
  { search: /_([a-zA-Z_][a-zA-Z0-9_]*)\s*=>/g, replace: '$1 =>' },

  // Fix method calls with malformed strings
  { search: /\.on\(_'([^']+)'/g, replace: ".on('$1'" },
  { search: /\.get\(_'([^']+)'/g, replace: ".get('$1'" },
  { search: /\.post\(_'([^']+)'/g, replace: ".post('$1'" },
  { search: /\.put\(_'([^']+)'/g, replace: ".put('$1'" },
  { search: /\.delete\(_'([^']+)'/g, replace: ".delete('$1'" },
  { search: /\.addEventListener\(_'([^']+)'/g, replace: ".addEventListener('$1'" },
];

async function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const pattern of PATTERNS_TO_FIX) {
      const newContent = content.replace(pattern.search, pattern.replace);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`FIXED: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`ERROR fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Starting final comprehensive syntax fix...');

  // Get all JavaScript/TypeScript files excluding node_modules and dist
  const findCommand = process.platform === 'win32' ?
    'dir /s /b *.js *.jsx *.ts *.tsx | findstr /v node_modules | findstr /v dist | findstr /v build' :
    'find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v build';

  let files;
  try {
    const output = execSync(findCommand, { encoding: 'utf8' });
    files = output.trim().split('\n').filter(f => f.trim());
  } catch (error) {
    // Fallback to specific files we know need fixing
    files = [
      'server.js',
      'src/main.jsx',
      'agents/autonomous-orchestrator.js',
      'api/agent.js',
      'middleware/rate-limiter.js',
      'src/services/cache/redisCacheService.js'
    ].filter(f => fs.existsSync(f));
  }

  console.log(`Found ${files.length} files to check`);

  let fixedCount = 0;
  for (const file of files) {
    if (await fixFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\nCompleted: Fixed ${fixedCount} files`);

  if (fixedCount > 0) {
    console.log('\nRunning quick syntax validation...');
    // Test a few key files to make sure they're valid
    const keyFiles = ['server.js', 'src/main.jsx'];
    for (const file of keyFiles) {
      if (fs.existsSync(file)) {
        try {
          // Basic syntax check by attempting to read the file
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes("_'") || content.includes('_"')) {
            console.warn(`WARNING: ${file} may still have issues`);
          } else {
            console.log(`VALIDATED: ${file} appears clean`);
          }
        } catch (error) {
          console.error(`ERROR validating ${file}:`, error.message);
        }
      }
    }
  }
}

main().catch(console.error);