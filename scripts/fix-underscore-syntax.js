#!/usr/bin/env node

/**
 * Fix underscore-prefixed syntax errors introduced by automated fixes
 */

import fs from 'fs';
import path from 'path';
import pkg from 'glob';
const { glob } = pkg;

const projectDir = process.cwd();

const fixes = [
  // Fix malformed route definitions
  { pattern: /app\.(get|post|put|delete|patch)\(_'/g, replacement: "app.$1('" },

  // Fix malformed event listeners
  { pattern: /\.on\(_'/g, replacement: ".on('" },
  { pattern: /\.addEventListener\(_'/g, replacement: ".addEventListener('" },

  // Fix malformed arrow functions
  { pattern: /_\(\s*([^)]*)\s*\)\s*=>/g, replacement: "($1) =>" },
  { pattern: /_\(\)/g, replacement: "()" },

  // Fix malformed string literals
  { pattern: /_'/g, replacement: "'" },
  { pattern: /_"/g, replacement: '"' }
];

async function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    fixes.forEach(fix => {
      const before = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== before) {
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${path.relative(projectDir, filePath)}`);
      return 1;
    }

    return 0;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('Fixing underscore syntax errors...');

  const files = [
    'server.js',
    'src/main.jsx'
  ];

  let totalFixed = 0;

  for (const file of files) {
    const filePath = path.join(projectDir, file);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      totalFixed += await fixFile(filePath);
    }
  }

  console.log(`\nFixed ${totalFixed} files with underscore syntax errors`);
}

main().catch(console.error);