const fs = require('fs');
const path = require('path');

function fixFileContent(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    const patterns = [
      { from: /_options/g, to: 'options' },
      { from: /_periods/g, to: 'periods' },
      { from: /_oldValue/g, to: 'oldValue' },
      { from: /_newValue/g, to: 'newValue' },
      { from: /_value/g, to: 'value' },
      { from: /_threshold/g, to: 'threshold' },
      { from: /_fileSize/g, to: 'fileSize' },
      { from: /_duration/g, to: 'duration' },
      { from: /_error/g, to: 'error' },
      { from: /async _\(\)/g, to: 'async ()' },
      { from: /= _12/g, to: '= 12' },
      { from: /= _6/g, to: '= 6' },
      { from: /= _24/g, to: '= 24' },
      { from: /= _30/g, to: '= 30' },
      { from: /metrics: _\{/g, to: 'metrics: {' }
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

console.log('Starting remaining syntax error fixes...');
walkDirectory(path.join(__dirname, 'src'));
console.log('Remaining syntax error fixes complete!');
