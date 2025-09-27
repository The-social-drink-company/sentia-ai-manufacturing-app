const fs = require('fs');
const path = require('path');

function fixFileContent(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    const patterns = [
      { from: /_title/g, to: 'title' },
      { from: /_false/g, to: 'false' },
      { from: /_true/g, to: 'true' },
      { from: /_null/g, to: 'null' },
      { from: /_undefined/g, to: 'undefined' },
      { from: /_index/g, to: 'index' },
      { from: /_reject/g, to: 'reject' },
      { from: /_operation/g, to: 'operation' },
      { from: /_metadata/g, to: 'metadata' },
      { from: /_accuracy/g, to: 'accuracy' },
      { from: /_parameters/g, to: 'parameters' }
    ];

    patterns.forEach(pattern => {
      const newContent = content.replace(pattern.from, pattern.to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed: ' + filePath);
    }

  } catch (error) {
    console.error('Error processing ' + filePath + ':', error.message);
  }
}

function walkDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
        walkDirectory(fullPath);
      }
    } else if (entry.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
      fixFileContent(fullPath);
    }
  }
}

console.log('Starting final syntax error fixes...');
walkDirectory(path.join(__dirname, 'src'));
console.log('Final syntax error fixes complete!');
