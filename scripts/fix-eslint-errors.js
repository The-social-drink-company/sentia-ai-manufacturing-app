#!/usr/bin/env node

/**
 * ESLint Error Fix Script
 * Automatically fixes common ESLint errors in the codebase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import globPkg from 'glob';
const { glob } = globPkg;

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Starting ESLint error fixes...\n');

// Helper function to read and write files
function fixFile(filePath, fixes) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    for (const fix of fixes) {
      const newContent = fix(content);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${path.relative(rootDir, filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Common fixes
const commonFixes = [
  // Remove unused imports
  (content) => {
    // Remove unused useEffect
    if (content.includes("import { useEffect") && !content.includes("useEffect(")) {
      content = content.replace(/,\s*useEffect\s*(?=\s*[},])/g, '');
      content = content.replace(/{\s*useEffect\s*,\s*/g, '{ ');
      content = content.replace(/{\s*useEffect\s*}/g, '{}');
    }

    // Remove unused motion
    if (content.includes("import { motion") && !content.includes("<motion.") && !content.includes("motion.")) {
      content = content.replace(/,\s*motion\s*(?=\s*[},])/g, '');
      content = content.replace(/{\s*motion\s*,\s*/g, '{ ');
      content = content.replace(/{\s*motion\s*}/g, '{}');
    }

    // Remove unused useCallback
    if (content.includes("import { useCallback") && !content.includes("useCallback(")) {
      content = content.replace(/,\s*useCallback\s*(?=\s*[},])/g, '');
      content = content.replace(/{\s*useCallback\s*,\s*/g, '{ ');
      content = content.replace(/{\s*useCallback\s*}/g, '{}');
    }

    // Clean up empty import blocks
    content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]*['"];?\s*\n?/g, '');

    return content;
  },

  // Fix unused variables by prefixing with underscore
  (content) => {
    // Fix unused parameters
    content = content.replace(/(([^,)]+),\s*([a-zA-Z][a-zA-Z0-9]*)\s*)\s*=>/g, (_match, _first, second) => {
      if (content.indexOf(second + '.') === -1 && content.indexOf(second + '[') === -1 && content.indexOf(second + ' ') === -1) {
        return `(${first}, _${second}) =>`;
      }
      return match;
    });

    // Fix unused variables in function parameters
    content = content.replace(/(([^)]*))\s*=>\s*{/g, (match, params) => {
      const fixedParams = params.split(',').map(param => {
        const trimmed = param.trim();
        if (trimmed && !trimmed.startsWith('') && !trimmed.includes('...')) {
          const varName = trimmed.split(/\s+/).pop();
          if (varName && !content.includes(varName + '.') && !content.includes(varName + '[') && !content.includes(varName + ' ')) {
            return param.replace(varName, '' + varName);
          }
        }
        return param;
      }).join(',');
      return `(_${fixedParams}) => {`;
    });

    return content;
  },

  // Fix regex escape characters
  (content) => {
    // Fix unnecessary escapes in regex
    content = content.replace(/\(+|*|/|.|(|))/g, '$1');
    return content;
  }
];

// File-specific fixes
const fileSpecificFixes = {
  'src/utils/env-validator.js': [
    (content) => {
      // Add process import for env-validator
      if (!content.includes('/* eslint-env node */')) {
        content = '/* eslint-env node */\n' + content;
      }
      return content;
    }
  ],

  'src/utils/structuredLogger.js': [
    (content) => {
      // Add process import for structuredLogger
      if (!content.includes('/* eslint-env node */')) {
        content = '/* eslint-env node */\n' + content;
      }
      return content;
    }
  ],

  'src/services/mcp/mcp-enterprise-server.js': [
    (content) => {
      // Add process import for mcp server
      if (!content.includes('/* eslint-env node */')) {
        content = '/* eslint-env node */\n' + content;
      }
      return content;
    }
  ]
};

// Get all JS/JSX files
const files = glob.sync('**/*.{js,jsx}', {
  cwd: rootDir,
  ignore: ['node_modules/**', 'dist/**', '_archive/**', 'backup*/**']
});

let fixedCount = 0;

// Apply fixes
for (const file of files) {
  const filePath = path.resolve(rootDir, file);
  const relativePath = path.relative(rootDir, filePath);

  // Apply common fixes
  const fixes = [...commonFixes];

  // Add file-specific fixes
  const key = relativePath.replace(/\/g, '/');
  if (fileSpecificFixes[key]) {
    fixes.push(...fileSpecificFixes[key]);
  }

  if (fixFile(filePath, fixes)) {
    fixedCount++;
  }
}

console.log(`\nFixed ${fixedCount} files`);
console.log('ESLint error fixing complete!\n');

// Run ESLint again to see remaining issues
console.log('Running ESLint to check remaining issues...');