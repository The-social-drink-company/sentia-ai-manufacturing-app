import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directories to process
const directories = [
  path.join(__dirname, '../src'),
  path.join(__dirname, '../api'),
  path.join(__dirname, '../services'),
  path.join(__dirname, '../agents'),
  path.join(__dirname, '../mcp-server')
];

// Files to skip
const skipFiles = [
  'logger.js',
  'structuredLogger.js',
  '.test.js',
  '.spec.js',
  'fix-console-logs.js'
];

function shouldSkipFile(filePath) {
  return skipFiles.some(skip => filePath.includes(skip));
}

function processFile(filePath) {
  if (shouldSkipFile(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if file already imports logger
  const hasLoggerImport = content.includes('from \'../utils/logger\'') ||
                         content.includes('from \'./utils/logger\'') ||
                         content.includes('from \'../../utils/logger\'') ||
                         content.includes('from \'@/utils/logger\'');

  // Replace console.log patterns
  const patterns = [
    {
      pattern: /console\.log\((.*?)\);/g,
      replacement: 'logDebug($1);',
      needsImport: true
    },
    {
      pattern: /console\.error\((.*?)\);/g,
      replacement: 'logError($1);',
      needsImport: true
    },
    {
      pattern: /console\.warn\((.*?)\);/g,
      replacement: 'logWarn($1);',
      needsImport: true
    },
    {
      pattern: /console\.info\((.*?)\);/g,
      replacement: 'logInfo($1);',
      needsImport: true
    }
  ];

  let needsImport = false;
  patterns.forEach(({ pattern, replacement }) => {
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      modified = true;
      needsImport = true;
    }
  });

  // Add import if needed
  if (modified && needsImport && !hasLoggerImport) {
    // Determine relative path to logger
    const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, '../src/utils/logger.js'));
    const importPath = relativePath.replace(/\\/g, '/').replace('.js', '');

    // Add import at the top of the file after existing imports
    const importStatement = `import { logDebug, logInfo, logWarn, logError } from '${importPath}';\n`;

    // Find where to insert the import
    const firstImportIndex = content.search(/^import /m);
    if (firstImportIndex !== -1) {
      // Find the last import statement
      const lines = content.split('\n');
      let lastImportIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      lines.splice(lastImportIndex + 1, 0, importStatement);
      content = lines.join('\n');
    } else {
      // No imports, add at the beginning
      content = importStatement + '\n' + content;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Skipping non-existent directory: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
      processFile(fullPath);
    }
  });
}

// Process all directories
console.log('Starting console.log replacement...');
directories.forEach(dir => {
  console.log(`Processing: ${dir}`);
  processDirectory(dir);
});
console.log('Console.log replacement complete!');