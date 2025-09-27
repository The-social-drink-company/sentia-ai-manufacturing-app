#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixArrowFunctionSyntax() {
  console.log('🔧 Fixing syntax errors in JSX and JS files...\n');

  // Find all JSX and JS files with syntax errors in src directory only
  const patterns = ['src/**/*.jsx', 'src/**/*.js'];
  let allFiles = [];
  patterns.forEach(pattern => {
    allFiles = allFiles.concat(glob.sync(pattern, { cwd: process.cwd() }));
  });

  let totalFiles = 0;
  let totalReplacements = 0;

  allFiles.forEach(file => {
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fileReplacements = 0;

    // Fix various underscore syntax patterns
    const fixes = [
      { pattern: /_\(\) =>/g, replacement: '() =>', name: '_() =>' },
      { pattern: /setInterval\(\(\) \{/g, replacement: 'setInterval(() => {', name: 'setInterval(() {' },
      { pattern: /setTimeout\(\(\) \{/g, replacement: 'setTimeout(() => {', name: 'setTimeout(() {' },
      { pattern: /useEffect\(\(\) \{/g, replacement: 'useEffect(() => {', name: 'useEffect(() {' },
      { pattern: /useCallback\(\(\) \{/g, replacement: 'useCallback(() => {', name: 'useCallback(() {' },
      { pattern: /useMemo\(\(\) \{/g, replacement: 'useMemo(() => {', name: 'useMemo(() {' },
      { pattern: /\b_\(/g, replacement: '(', name: '_(' },
      { pattern: /_\[/g, replacement: '[', name: '_[' },
      { pattern: /_\{/g, replacement: '{', name: '_{' }
    ];

    fixes.forEach(fix => {
      const matches = (content.match(fix.pattern) || []).length;
      if (matches > 0) {
        content = content.replace(fix.pattern, fix.replacement);
        fileReplacements += matches;
        console.log(`  🔧 Fixed ${matches} ${fix.name} patterns in: ${file}`);
      }
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalReplacements += fileReplacements;
      totalFiles++;
      console.log(`✅ Fixed ${fileReplacements} total issues in: ${file}`);
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Total fixes applied: ${totalReplacements}`);
}

// Run the fixes
fixArrowFunctionSyntax();