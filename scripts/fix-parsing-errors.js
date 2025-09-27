#!/usr/bin/env node

/**
 * Fix Parsing Errors Script
 * Fixes common syntax errors introduced by the automated ESLint fix script
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(__dirname);

// Common patterns to fix
const fixes = [
  // Router method calls with underscore prefixes
  {
    pattern: /router\.(get|post|put|patch|delete)\(_['"`]([^'"`]+)['"`],\s*_?\(/g,
    replacement: "router.$1('$2', ("
  },

  // App method calls with underscore prefixes
  {
    pattern: /app\.(get|post|put|patch|delete)\(_['"`]([^'"`]+)['"`],\s*_?\(/g,
    replacement: "app.$1('$2', ("
  },

  // useEffect hooks with underscore
  {
    pattern: /useEffect\(_\(\)\s*=>\s*\{/g,
    replacement: "useEffect(() => {"
  },

  // Arrow functions with underscore parameters
  {
    pattern: /_\(([\w\s,]*)\)\s*=>\s*\{/g,
    replacement: "($1) => {"
  },

  // Async arrow functions with underscore
  {
    pattern: /async\s+_\(([\w\s,]*)\)\s*=>\s*\{/g,
    replacement: "async ($1) => {"
  },

  // Function parameters with leading underscore that should be normal
  {
    pattern: /\(\s*_(\w+)\s*\)\s*=>\s*\{/g,
    replacement: "($1) => {"
  },

  // IIFE with underscore
  {
    pattern: /\(async\s+_\(\)\s*=>\s*\{/g,
    replacement: "(async () => {"
  }
];

// Files to process (focus on files with parsing errors)
const filesToProcess = [
  'src/App-multistage.jsx',
  'src/App.jsx',
  'src/auth/BulletproofAuthProvider.jsx',
  'src/components/AI/AIAnalyticsDashboard.jsx',
  'src/services/database/optimizedClient.js',
  'src/services/logger/enterprise-logger.js',
  'src/services/monitoring/errorTracker.js',
  'src/services/monitoring/healthMonitor.js',
  'src/services/monitoring/healthMonitor.test.js',
  'src/services/monitoring/performanceMonitor.test.js',
  'src/services/monitoring/securityMonitor.js',
  'src/services/monitoring/sentry-config.js',
  'src/services/monitoring/sentry-server.js',
  'src/services/realtime/sseClient.js',
  'src/utils/sentry-test.js',
  'server/middleware/auth.js',
  'server/middleware/upload.js'
];

function fixParsingErrors() {
  let totalFilesProcessed = 0;
  let totalFixesApplied = 0;

  for (const relativePath of filesToProcess) {
    const filePath = path.join(rootDir, relativePath);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${relativePath}`);
      continue;
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let fileFixesApplied = 0;

      // Apply each fix pattern
      for (const fix of fixes) {
        const before = content;
        content = content.replace(fix.pattern, fix.replacement);
        const matches = (before.match(fix.pattern) || []).length;
        if (matches > 0) {
          fileFixesApplied += matches;
          console.log(`🔧 Applied ${matches} fixes of pattern ${fix.pattern.source} in ${relativePath}`);
        }
      }

      if (fileFixesApplied > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed ${fileFixesApplied} parsing errors in ${relativePath}`);
        totalFilesProcessed++;
        totalFixesApplied += fileFixesApplied;
      }

    } catch (error) {
      console.error(`❌ Error processing ${relativePath}:`, error.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${totalFilesProcessed}`);
  console.log(`   Total fixes applied: ${totalFixesApplied}`);
}

// Run the fixes
console.log('🔧 Fixing parsing errors...\n');
fixParsingErrors();
console.log('\n✅ Parsing error fixes complete!');