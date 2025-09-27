#!/usr/bin/env node

/**
 * Fix Remaining Errors Script
 * Comprehensive fix for all remaining ESLint parsing and variable issues
 */

import fs from 'fs';
import path from 'path';
import pkg from 'glob';
const { glob } = pkg;
import { fileURLToPath } from 'url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(__dirname);

// Comprehensive fix patterns
const fixes = [
  // Router/app method calls with underscore prefixes (more comprehensive)
  {
    pattern: /(\w+\.(get|post|put|patch|delete|use))\(_['"`]([^'"`]+)['"`],\s*(_+)?\(/g,
    replacement: "$1('$3', ("
  },

  // Variable assignment patterns where underscore was added incorrectly
  {
    pattern: /_(\w+)\s*=\s*([^;]+);/g,
    replacement: "$1 = $2;"
  },

  // Fix map/forEach with incorrect underscore parameters
  {
    pattern: /\.map\(\s*_(\w+)\s*=>\s*/g,
    replacement: ".map($1 => "
  },
  {
    pattern: /\.forEach\(\s*_(\w+)\s*=>\s*/g,
    replacement: ".forEach($1 => "
  },
  {
    pattern: /\.filter\(\s*_(\w+)\s*=>\s*/g,
    replacement: ".filter($1 => "
  },

  // Fix variable usage in destructuring and parameters
  {
    pattern: /\(\s*_(\w+),\s*(\w+)\s*\)/g,
    replacement: "($1, $2)"
  },

  // Fix addEventListener calls
  {
    pattern: /addEventListener\(_['"`]([^'"`]+)['"`],/g,
    replacement: "addEventListener('$1',"
  },

  // Fix string literals with underscore prefix
  {
    pattern: /_(['"`])([^'"`]+)\1/g,
    replacement: "$1$2$1"
  },

  // Fix variable references where variable exists but prefixed version is used
  {
    pattern: /(\w+):\s*_(\w+)([,\s\}])/g,
    replacement: "$1: $2$3"
  }
];

// Variable renaming fixes - where _variable is defined but variable is used
const variableRenames = [
  // Common patterns where underscore version should be renamed back
  { from: '_index', to: 'index' },
  { from: '_item', to: 'item' },
  { from: 'path', to: 'path' },
  { from: '_impact', to: 'impact' },
  { from: '_suggestion', to: 'suggestion' },
  { from: '_cb', to: 'cb' },
  { from: '_next', to: 'next' },
  { from: '_req', to: 'req' },
  { from: '_res', to: 'res' }
];

async function findAllFiles() {
  const patterns = [
    'src/**/*.{js,jsx,ts,tsx}',
    'server/**/*.{js,jsx,ts,tsx}',
    'scripts/**/*.{js,jsx,ts,tsx}'
  ];

  const files = [];
  for (const pattern of patterns) {
    try {
      const matches = await new Promise((resolve, reject) => {
        glob(pattern, { cwd: rootDir }, (err, files) => {
          if (err) reject(err);
          else resolve(files);
        });
      });
      files.push(...matches.map(f => path.join(rootDir, f)));
    } catch (error) {
      console.warn(`Warning: Could not process pattern ${pattern}:`, error.message);
    }
  }

  return [...new Set(files)]; // Remove duplicates
}

function fixVariableReferences(content) {
  // Fix situations where _variable is defined but variable is used
  for (const rename of variableRenames) {
    // Pattern: variable is defined but variable is used elsewhere
    const definePattern = new RegExp(`\\b${rename.from}\\b`, 'g');
    const usePattern = new RegExp(`\\b${rename.to}\\b`, 'g');

    // Count occurrences
    const defineCount = (content.match(definePattern) || []).length;
    const useCount = (content.match(usePattern) || []).length;

    // If _variable appears less than variable, rename _variable to variable
    if (defineCount > 0 && useCount > defineCount) {
      content = content.replace(definePattern, rename.to);
    }
  }

  return content;
}

async function fixRemainingErrors() {
  console.log('🔧 Finding all JavaScript/TypeScript files...');
  const files = await findAllFiles();

  let totalFilesProcessed = 0;
  let totalFixesApplied = 0;

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      let fileFixesApplied = 0;

      // Apply pattern fixes
      for (const fix of fixes) {
        const before = content;
        content = content.replace(fix.pattern, fix.replacement);
        const matches = (before.match(fix.pattern) || []).length;
        if (matches > 0) {
          fileFixesApplied += matches;
        }
      }

      // Fix variable references
      const beforeVarFix = content;
      content = fixVariableReferences(content);
      if (beforeVarFix !== content) {
        fileFixesApplied += 1;
      }

      // Write file if changes were made
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        const relativePath = path.relative(rootDir, filePath);
        console.log(`✅ Fixed ${fileFixesApplied} issues in ${relativePath}`);
        totalFilesProcessed++;
        totalFixesApplied += fileFixesApplied;
      }

    } catch (error) {
      const relativePath = path.relative(rootDir, filePath);
      console.error(`❌ Error processing ${relativePath}:`, error.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${totalFilesProcessed}`);
  console.log(`   Total fixes applied: ${totalFixesApplied}`);
}

// Run the fixes
console.log('🔧 Fixing remaining ESLint errors...\n');
fixRemainingErrors()
  .then(() => console.log('\n✅ Remaining error fixes complete!'))
  .catch(console.error);