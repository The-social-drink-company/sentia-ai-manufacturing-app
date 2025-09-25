const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixDuplicates(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Find and remove duplicate auth removal comments and declarations
    const lines = content.split('\n');
    const seen = new Set();
    const filteredLines = [];
    let skipNext = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (skipNext > 0) {
        skipNext--;
        continue;
      }

      // Check for duplicate auth removal blocks
      if (line.includes('// Authentication removed')) {
        if (seen.has('auth-removed')) {
          // Skip this and next 3 lines (the duplicate block)
          skipNext = 3;
          continue;
        }
        seen.add('auth-removed');
      }

      // Check for duplicate const declarations
      if (line.includes('const user = { name: "User" }')) {
        if (seen.has('const-user')) {
          continue;
        }
        seen.add('const-user');
      }

      if (line.includes('const isSignedIn = true')) {
        if (seen.has('const-isSignedIn')) {
          continue;
        }
        seen.add('const-isSignedIn');
      }

      if (line.includes('const isLoaded = true')) {
        if (seen.has('const-isLoaded')) {
          continue;
        }
        seen.add('const-isLoaded');
      }

      filteredLines.push(line);
    }

    content = filteredLines.join('\n');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log('Fixed duplicates in:', path.basename(filePath));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error processing', filePath, ':', error.message);
    return false;
  }
}

// Find all JSX and JS files
const patterns = [
  'src/**/*.jsx',
  'src/**/*.js',
];

let totalFixed = 0;

patterns.forEach(pattern => {
  const files = glob.sync(pattern, {
    cwd: __dirname,
    absolute: true
  });

  files.forEach(file => {
    if (fixDuplicates(file)) {
      totalFixed++;
    }
  });
});

console.log(`\nTotal files fixed: ${totalFixed}`);
console.log('Duplicate removal complete!');