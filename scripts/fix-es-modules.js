#!/usr/bin/env node

/**
 * ES Module Fix Script
 * Automatically converts CommonJS require/module.exports to ES modules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Patterns to fix
const CONVERSIONS = [
  // Convert require to import
  {
    pattern: /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g,
    replacement: 'import $1 from "$2"'
  },
  {
    pattern: /const\s+{([^}]+)}\s*=\s*require\(['"]([^'"]+)['"]\)/g,
    replacement: 'import { $1 } from "$2"'
  },
  {
    pattern: /let\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g,
    replacement: 'import $1 from "$2"'
  },
  {
    pattern: /var\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g,
    replacement: 'import $1 from "$2"'
  },
  // Convert module.exports to export
  {
    pattern: /module\.exports\s*=\s*{/g,
    replacement: 'export {'
  },
  {
    pattern: /module\.exports\s*=\s*(\w+)/g,
    replacement: 'export default $1'
  },
  {
    pattern: /exports\.(\w+)\s*=\s*/g,
    replacement: 'export const $1 = '
  },
  // Add __dirname and __filename for ES modules
  {
    pattern: /__dirname(?!\s*=)/g,
    replacement: '__dirname',
    needsImport: true,
    imports: [
      "import { fileURLToPath } from 'url';",
      "import { dirname } from 'path';",
      "const __filename = fileURLToPath(import.meta.url);",
      "const __dirname = dirname(__filename);"
    ]
  }
];

async function fixFile(filePath) {
  console.log(`Checking: ${path.relative(ROOT_DIR, filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let modified = false;
  let needsImports = [];

  // Apply conversions
  for (const conversion of CONVERSIONS) {
    if (conversion.pattern.test(content)) {
      if (conversion.needsImport && conversion.imports) {
        needsImports.push(...conversion.imports);
      }
      
      content = content.replace(conversion.pattern, conversion.replacement);
      modified = true;
    }
    // Reset regex lastIndex
    conversion.pattern.lastIndex = 0;
  }

  // Add necessary imports at the top
  if (needsImports.length > 0) {
    const uniqueImports = [...new Set(needsImports)];
    const hasFileURLImport = content.includes('fileURLToPath');
    
    if (!hasFileURLImport) {
      const importBlock = uniqueImports.join('\n') + '\n\n';
      content = importBlock + content;
    }
  }

  // Write back if modified
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Fixed ES module issues`);
    return true;
  }
  
  return false;
}

async function main() {
  console.log('='.repeat(60));
  console.log('ES MODULE FIX SCRIPT');
  console.log('='.repeat(60));
  console.log('');

  // Find all JavaScript files
  const patterns = [
    path.join(ROOT_DIR, '*.js'),
    path.join(ROOT_DIR, 'api', '**/*.js'),
    path.join(ROOT_DIR, 'services', '**/*.js'),
    path.join(ROOT_DIR, 'middleware', '**/*.js'),
    path.join(ROOT_DIR, 'scripts', '*.js'),
    path.join(ROOT_DIR, 'config', '**/*.js')
  ];

  const excludePatterns = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.vite/**'
  ];

  let filesFixed = 0;
  let totalFiles = 0;

  for (const pattern of patterns) {
    const files = glob.sync(pattern, {
      ignore: excludePatterns
    });

    for (const file of files) {
      // Skip this script itself
      if (file === __filename) continue;
      
      totalFiles++;
      const fixed = await fixFile(file);
      if (fixed) filesFixed++;
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`SUMMARY: Fixed ${filesFixed} of ${totalFiles} files`);
  console.log('='.repeat(60));

  if (filesFixed > 0) {
    console.log('\nNext steps:');
    console.log('1. Test locally: npm run dev');
    console.log('2. Commit changes: git add -A && git commit -m "fix: Convert to ES modules"');
    console.log('3. Push to deploy: git push origin development');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { fixFile, CONVERSIONS };
