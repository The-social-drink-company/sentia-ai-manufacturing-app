#!/usr/bin/env node
/**
 * Automated Console.log Migration Script
 * Replaces all console.* statements with enterprise logger
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Configuration
const config = {
  // Directories to process
  includeDirs: [
    'src',
    'api',
    'services',
    'middleware',
    'routes',
    'lib',
    'utils',
    'scripts',
    'tests'
  ],
  // Files to process in root
  includeRootFiles: [
    'server.js',
    'server-enterprise-complete.js',
    '*.config.js'
  ],
  // Directories to exclude
  excludeDirs: [
    'node_modules',
    '.pnpm-store',
    'dist',
    'build',
    'assets',
    '_archive',
    '.git',
    'logs'
  ],
  // File extensions to process
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
  // Backup directory
  backupDir: path.join(rootDir, '_backup_console_migration'),
  // Dry run mode (preview changes without applying)
  dryRun: false
};

// Logger import statements for different file types
const loggerImports = {
  server: `import { createLogger } from './src/services/logger/enterprise-logger.js';
const logger = createLogger('Server');`,

  service: `import { createLogger } from '../services/logger/enterprise-logger.js';
const logger = createLogger('Service');`,

  react: `import { devLog } from '@/services/logger/enterprise-logger';`,

  script: `import { createLogger } from '../src/services/logger/enterprise-logger.js';
const logger = createLogger('Script');`,

  test: `import { createLogger } from '../../src/services/logger/enterprise-logger.js';
const logger = createLogger('Test');`
};

// Replacement patterns
const replacements = [
  // console.log variations
  {
    pattern: /console\.log\((.*?)\)/g,
    replacement: (match, args) => {
      // Check if it's a simple string
      if (args.startsWith("'") || args.startsWith('"') || args.startsWith('`')) {
        return `logger.info(${args})`;
      }
      // Multiple arguments or complex expressions
      return `logger.info('Log:', { data: ${args} })`;
    }
  },
  // console.error variations
  {
    pattern: /console\.error\((.*?)\)/g,
    replacement: (match, args) => {
      // Check if it contains 'error' variable
      if (args.includes('error')) {
        return `logger.error('Error occurred', error)`;
      }
      return `logger.error(${args})`;
    }
  },
  // console.warn variations
  {
    pattern: /console\.warn\((.*?)\)/g,
    replacement: (match, args) => `logger.warn(${args})`
  },
  // console.info variations
  {
    pattern: /console\.info\((.*?)\)/g,
    replacement: (match, args) => `logger.info(${args})`
  },
  // console.debug variations
  {
    pattern: /console\.debug\((.*?)\)/g,
    replacement: (match, args) => `logger.debug(${args})`
  },
  // console.trace variations
  {
    pattern: /console\.trace\((.*?)\)/g,
    replacement: (match, args) => `logger.trace(${args})`
  }
];

// React component specific replacements
const reactReplacements = [
  {
    pattern: /console\.log\((.*?)\)/g,
    replacement: (match, args) => `devLog.log(${args})`
  },
  {
    pattern: /console\.error\((.*?)\)/g,
    replacement: (match, args) => `devLog.error(${args})`
  },
  {
    pattern: /console\.warn\((.*?)\)/g,
    replacement: (match, args) => `devLog.warn(${args})`
  }
];

async function getFilesToProcess() {
  const files = [];

  // Get files from included directories
  for (const dir of config.includeDirs) {
    const dirPath = path.join(rootDir, dir);
    try {
      const pattern = `${dirPath}/**/*{${config.extensions.join(',')}}`;
      const dirFiles = await glob(pattern, {
        ignore: config.excludeDirs.map(d => `**/${d}/**`)
      });
      files.push(...dirFiles);
    } catch (err) {
      // Directory might not exist
    }
  }

  // Get root files
  for (const pattern of config.includeRootFiles) {
    const rootFiles = await glob(path.join(rootDir, pattern), {
      ignore: config.excludeDirs
    });
    files.push(...rootFiles);
  }

  return [...new Set(files)]; // Remove duplicates
}

async function backupFile(filePath) {
  const relativePath = path.relative(rootDir, filePath);
  const backupPath = path.join(config.backupDir, relativePath);
  const backupDir = path.dirname(backupPath);

  await fs.mkdir(backupDir, { recursive: true });
  await fs.copyFile(filePath, backupPath);
}

function determineFileType(filePath) {
  const relativePath = path.relative(rootDir, filePath);

  if (relativePath.startsWith('src') && (filePath.endsWith('.jsx') || filePath.endsWith('.tsx'))) {
    return 'react';
  }
  if (relativePath.includes('server') || relativePath === 'server.js') {
    return 'server';
  }
  if (relativePath.startsWith('services') || relativePath.startsWith('api')) {
    return 'service';
  }
  if (relativePath.startsWith('scripts')) {
    return 'script';
  }
  if (relativePath.startsWith('tests') || relativePath.includes('.test.') || relativePath.includes('.spec.')) {
    return 'test';
  }

  return 'service'; // Default
}

function getLoggerImport(fileType, filePath) {
  const depth = path.relative(rootDir, filePath).split(path.sep).length - 1;
  const importPath = '../'.repeat(depth) + 'src/services/logger/enterprise-logger.js';

  if (fileType === 'react') {
    return `import { devLog } from '${importPath.replace(/\\/g, '/')}';`;
  }

  return `import { createLogger } from '${importPath.replace(/\\/g, '/')}';
const logger = createLogger('${path.basename(filePath, path.extname(filePath))}');`;
}

async function processFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const originalContent = content;

    // Check if file has console statements
    if (!content.match(/console\.(log|error|warn|info|debug|trace)/)) {
      return { filePath, status: 'skipped', reason: 'No console statements found' };
    }

    // Determine file type
    const fileType = determineFileType(filePath);
    const isReact = fileType === 'react';

    // Check if logger is already imported
    const hasLoggerImport = content.includes('enterprise-logger') ||
                            content.includes('structuredLogger');

    // Apply replacements
    let changeCount = 0;
    const replacementSet = isReact ? reactReplacements : replacements;

    for (const { pattern, replacement } of replacementSet) {
      const matches = content.match(pattern);
      if (matches) {
        changeCount += matches.length;
        content = content.replace(pattern, replacement);
      }
    }

    // Add logger import if needed and changes were made
    if (changeCount > 0 && !hasLoggerImport) {
      const importStatement = getLoggerImport(fileType, filePath);

      // Find the right place to insert import
      const importMatch = content.match(/(import .* from .*\n)+/);
      if (importMatch) {
        const lastImportIndex = importMatch.index + importMatch[0].length;
        content = content.slice(0, lastImportIndex) +
                 importStatement + '\n\n' +
                 content.slice(lastImportIndex);
      } else {
        // No imports found, add at the beginning
        content = importStatement + '\n\n' + content;
      }
    }

    // Write changes
    if (content !== originalContent) {
      if (!config.dryRun) {
        await backupFile(filePath);
        await fs.writeFile(filePath, content, 'utf8');
      }

      return {
        filePath,
        status: 'modified',
        changes: changeCount,
        fileType
      };
    }

    return { filePath, status: 'unchanged' };

  } catch (error) {
    return { filePath, status: 'error', error: error.message };
  }
}

async function main() {
  console.log('Starting Console.log Migration...\n');
  console.log('Configuration:');
  console.log(`- Dry Run: ${config.dryRun}`);
  console.log(`- Backup Directory: ${config.backupDir}`);
  console.log('\n');

  // Get files to process
  const files = await getFilesToProcess();
  console.log(`Found ${files.length} files to process\n`);

  // Process files
  const results = {
    modified: [],
    unchanged: [],
    skipped: [],
    errors: []
  };

  let processed = 0;
  for (const file of files) {
    const result = await processFile(file);
    processed++;

    if (result.status === 'modified') {
      results.modified.push(result);
      console.log(`✓ Modified: ${path.relative(rootDir, result.filePath)} (${result.changes} changes)`);
    } else if (result.status === 'error') {
      results.errors.push(result);
      console.log(`✗ Error: ${path.relative(rootDir, result.filePath)}: ${result.error}`);
    } else if (result.status === 'skipped') {
      results.skipped.push(result);
    } else {
      results.unchanged.push(result);
    }

    if (processed % 100 === 0) {
      console.log(`Progress: ${processed}/${files.length} files processed`);
    }
  }

  // Print summary
  console.log('\n=== Migration Summary ===');
  console.log(`Total Files Processed: ${files.length}`);
  console.log(`Files Modified: ${results.modified.length}`);
  console.log(`Files Unchanged: ${results.unchanged.length}`);
  console.log(`Files Skipped: ${results.skipped.length}`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.modified.length > 0) {
    const totalChanges = results.modified.reduce((sum, r) => sum + r.changes, 0);
    console.log(`Total Console Statements Replaced: ${totalChanges}`);
  }

  if (config.dryRun) {
    console.log('\n⚠️  This was a DRY RUN - no files were actually modified');
    console.log('Set config.dryRun = false to apply changes');
  } else if (results.modified.length > 0) {
    console.log(`\n✓ Backup created at: ${config.backupDir}`);
    console.log('✓ Migration completed successfully!');
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors occurred in the following files:');
    results.errors.forEach(r => {
      console.log(`  - ${path.relative(rootDir, r.filePath)}: ${r.error}`);
    });
  }
}

// Run the migration
main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});