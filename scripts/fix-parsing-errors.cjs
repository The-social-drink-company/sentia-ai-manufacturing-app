#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixArrowFunctionSyntax() {
  console.log('🔧 Fixing _() => syntax errors in JSX files...\n');

  // Find all JSX files with the _() => syntax error
  const pattern = '**/*.jsx';
  const files = glob.sync(pattern, { cwd: process.cwd() });

  let totalFiles = 0;
  let totalReplacements = 0;

  files.forEach(file => {
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix _() => syntax error
    content = content.replace(/_\(\) =>/g, '() =>');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      const replacements = (originalContent.match(/_\(\) =>/g) || []).length;
      totalReplacements += replacements;
      totalFiles++;
      console.log(`✅ Fixed ${replacements} issues in: ${file}`);
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Total fixes applied: ${totalReplacements}`);
}

// Run the fixes
fixArrowFunctionSyntax();