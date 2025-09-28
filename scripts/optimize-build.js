#!/usr/bin/env node

// Build Optimization Script for Render Deployment
// Analyzes and optimizes bundle sizes before deployment

import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import chalk from 'chalk';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Configuration
const config = {
  maxChunkSize: 500 * 1024, // 500KB
  maxTotalSize: 5 * 1024 * 1024, // 5MB
  criticalChunkSize: 1000 * 1024, // 1MB
  compressionThreshold: 10 * 1024, // 10KB
  bundleAnalyzer: process.env.ANALYZE === 'true'
};

// Utility functions
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getGzipSize = (filePath) => {
  const fileContent = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(fileContent);
  return gzipped.length;
};

const getBrotliSize = (filePath) => {
  const fileContent = fs.readFileSync(filePath);
  const compressed = zlib.brotliCompressSync(fileContent);
  return compressed.length;
};

// Step 1: Clean previous build
console.log(chalk.blue('Step 1: Cleaning previous build...'));
const distPath = path.join(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
  console.log(chalk.green('✓ Previous build cleaned'));
}

// Step 2: Run optimized build
console.log(chalk.blue('\nStep 2: Running optimized build...'));
try {
  execSync('npm run build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      GENERATE_SOURCEMAP: 'false'
    }
  });
  console.log(chalk.green('✓ Build completed successfully'));
} catch (error) {
  console.error(chalk.red('✗ Build failed:', error.message));
  process.exit(1);
}

// Step 3: Analyze bundle sizes
console.log(chalk.blue('\nStep 3: Analyzing bundle sizes...'));
const analyzeBundle = () => {
  const distFiles = [];
  const walkDir = (_dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.css')) {
        const size = stat.size;
        const gzipSize = getGzipSize(filePath);
        const brotliSize = getBrotliSize(filePath);
        distFiles.push({
          path: filePath.replace(rootDir, ''),
          name: file,
          size,
          gzipSize,
          brotliSize,
          type: file.endsWith('.css') ? 'css' : 'js'
        });
      }
    });
  };

  walkDir(distPath);
  return distFiles;
};

const bundles = analyzeBundle();
const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);

// Sort by size
bundles.sort((a, b) => b.size - a.size);

// Step 4: Display results
console.log(chalk.blue('\nBundle Analysis Results:'));
console.log(chalk.gray('─'.repeat(80)));

// Show large chunks warning
const largeChunks = bundles.filter(b => b.size > config.criticalChunkSize);
if (largeChunks.length > 0) {
  console.log(chalk.yellow('\n⚠ Large chunks detected (> 1MB):'));
  largeChunks.forEach(chunk => {
    console.log(chalk.yellow(
      `  ${chunk.name.padEnd(40)} ${formatBytes(chunk.size).padEnd(10)} → ${formatBytes(chunk.gzipSize)} (gzip)`
    ));
  });
}

// Show top 10 largest files
console.log(chalk.cyan('\nTop 10 Largest Files:'));
bundles.slice(0, 10).forEach((bundle, index) => {
  const compression = ((1 - bundle.gzipSize / bundle.size) * 100).toFixed(1);
  console.log(
    `${(index + 1).toString().padStart(2)}. ${bundle.name.padEnd(40)} ` +
    `${formatBytes(bundle.size).padEnd(10)} → ${formatBytes(bundle.gzipSize).padEnd(10)} ` +
    `(${compression}% compression)`
  );
});

// Summary
console.log(chalk.gray('\n─'.repeat(80)));
console.log(chalk.cyan('Summary:'));
console.log(`  Total files: ${bundles.length}`);
console.log(`  Total size: ${formatBytes(totalSize)}`);
console.log(`  Total gzip size: ${formatBytes(totalGzipSize)}`);
console.log(`  Compression ratio: ${((1 - totalGzipSize / totalSize) * 100).toFixed(1)}%`);

// Step 5: Optimization recommendations
console.log(chalk.blue('\n\nOptimization Recommendations:'));

const recommendations = [];

// Check for large chunks
if (largeChunks.length > 0) {
  recommendations.push({
    level: 'warning',
    message: `Found ${largeChunks.length} chunks larger than 1MB. Consider splitting these into smaller chunks.`,
    files: largeChunks.map(c => c.name)
  });
}

// Check for duplicate code
const jsFiles = bundles.filter(b => b.type === 'js');
if (jsFiles.length > 20) {
  recommendations.push({
    level: 'info',
    message: 'Many JavaScript chunks detected. Review manual chunking strategy to reduce duplication.'
  });
}

// Check total size
if (totalSize > config.maxTotalSize) {
  recommendations.push({
    level: 'warning',
    message: `Total bundle size (${formatBytes(totalSize)}) exceeds recommended limit (${formatBytes(config.maxTotalSize)}).`
  });
}

// Check CSS
const cssFiles = bundles.filter(b => b.type === 'css');
const totalCssSize = cssFiles.reduce((sum, b) => sum + b.size, 0);
if (totalCssSize > 500 * 1024) {
  recommendations.push({
    level: 'info',
    message: `CSS bundle is large (${formatBytes(totalCssSize)}). Consider using CSS modules or atomic CSS.`
  });
}

// Display recommendations
if (recommendations.length > 0) {
  recommendations.forEach(rec => {
    const icon = rec.level === 'warning' ? '⚠' : 'ℹ';
    const color = rec.level === 'warning' ? chalk.yellow : chalk.blue;
    console.log(color(`${icon} ${rec.message}`));
    if (rec.files) {
      rec.files.forEach(file => console.log(color(`    - ${file}`)));
    }
  });
} else {
  console.log(chalk.green('✓ No optimization issues detected!'));
}

// Step 6: Generate report file
const reportPath = path.join(rootDir, 'build-report.json');
const report = {
  timestamp: new Date().toISOString(),
  totalSize,
  totalGzipSize,
  fileCount: bundles.length,
  largeChunks: largeChunks.length,
  recommendations,
  files: bundles.slice(0, 20) // Top 20 files
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(chalk.green(`\n✓ Build report saved to: ${reportPath}`));

// Step 7: Run bundle analyzer if requested
if (config.bundleAnalyzer) {
  console.log(chalk.blue('\nRunning bundle analyzer...'));
  try {
    execSync('npx vite-bundle-visualizer', {
      cwd: rootDir,
      stdio: 'inherit'
    });
  } catch (error) {
    console.log(chalk.yellow('Bundle analyzer not available'));
  }
}

// Exit with appropriate code
const hasWarnings = recommendations.some(r => r.level === 'warning');
if (hasWarnings) {
  console.log(chalk.yellow('\n⚠ Build completed with warnings'));
  process.exit(0); // Still exit 0 to not block deployment
} else {
  console.log(chalk.green('\n✅ Build optimization complete!'));
  process.exit(0);
}