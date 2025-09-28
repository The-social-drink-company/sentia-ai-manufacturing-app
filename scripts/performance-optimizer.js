#!/usr/bin/env node

/**
 * Performance Optimization Script
 * Analyzes and optimizes application performance
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import zlib from 'zlib';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Optimization configuration
const CONFIG = {
  distPath: path.join(process.cwd(), 'dist'),
  srcPath: path.join(process.cwd(), 'src'),
  thresholds: {
    bundleSize: 500 * 1024, // 500KB
    imageSize: 100 * 1024,  // 100KB
    totalSize: 2 * 1024 * 1024, // 2MB
    unusedCodePercentage: 30,
    duplicateCodePercentage: 10
  },
  optimizations: {
    images: true,
    bundles: true,
    duplicates: true,
    unused: true,
    compression: true,
    caching: true
  }
};

// Logger utility
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Performance analyzer class
class PerformanceAnalyzer {
  constructor() {
    this.results = {
      bundles: [],
      images: [],
      duplicates: [],
      unused: [],
      optimizations: [],
      score: 100
    };
  }

  async analyze() {
    log('\n=== Performance Analysis Starting ===', 'magenta');
    
    // Check if dist directory exists
    if (!fs.existsSync(CONFIG.distPath)) {
      log('Build directory not found. Running build first...', 'yellow');
      execSync('npm run build', { stdio: 'inherit' });
    }
    
    // Analyze bundle sizes
    await this.analyzeBundles();
    
    // Analyze images
    await this.analyzeImages();
    
    // Find duplicate code
    await this.findDuplicates();
    
    // Find unused code
    await this.findUnusedCode();
    
    // Calculate performance score
    this.calculateScore();
    
    return this.results;
  }

  async analyzeBundles() {
    log('\nAnalyzing bundle sizes...', 'cyan');
    
    const jsPath = path.join(CONFIG.distPath, 'js');
    if (!fs.existsSync(jsPath)) {
      log('No JS bundles found', 'yellow');
      return;
    }
    
    const files = fs.readdirSync(jsPath);
    let totalSize = 0;
    
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(jsPath, file);
        const stats = fs.statSync(filePath);
        const size = stats.size;
        totalSize += size;
        
        const bundle = {
          name: file,
          size: size,
          sizeKB: (size / 1024).toFixed(2),
          gzipSize: this.getGzipSize(filePath),
          oversized: size > CONFIG.thresholds.bundleSize
        };
        
        this.results.bundles.push(bundle);
        
        if (bundle.oversized) {
          log(`  WARNING: ${file} is ${bundle.sizeKB}KB (threshold: ${CONFIG.thresholds.bundleSize / 1024}KB)`, 'yellow');
          this.results.score -= 5;
        } else {
          log(`  OK: ${file} - ${bundle.sizeKB}KB`, 'green');
        }
      }
    });
    
    log(`Total bundle size: ${(totalSize / 1024).toFixed(2)}KB`, 'blue');
  }

  async analyzeImages() {
    log('\nAnalyzing images...', 'cyan');
    
    const assetsPath = path.join(CONFIG.distPath, 'assets');
    if (!fs.existsSync(assetsPath)) {
      log('No assets directory found', 'yellow');
      return;
    }
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    const files = this.getAllFiles(assetsPath);
    
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        const stats = fs.statSync(file);
        const size = stats.size;
        
        const image = {
          name: path.basename(file),
          path: path.relative(CONFIG.distPath, file),
          size: size,
          sizeKB: (size / 1024).toFixed(2),
          oversized: size > CONFIG.thresholds.imageSize,
          format: ext
        };
        
        this.results.images.push(image);
        
        if (image.oversized) {
          log(`  WARNING: ${image.name} is ${image.sizeKB}KB (consider optimizing)`, 'yellow');
          this.results.score -= 2;
        }
      }
    });
    
    if (this.results.images.length === 0) {
      log('  No images found', 'gray');
    } else {
      log(`  Found ${this.results.images.length} images`, 'blue');
    }
  }

  async findDuplicates() {
    log('\nSearching for duplicate code...', 'cyan');
    
    const files = this.getAllFiles(CONFIG.srcPath, ['.js', '.jsx', '.ts', '.tsx']);
    const codeBlocks = new Map();
    let duplicateCount = 0;
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const blocks = this.extractCodeBlocks(content);
      
      blocks.forEach(block => {
        const hash = crypto.createHash('md5').update(block).digest('hex');
        
        if (codeBlocks.has(hash)) {
          const existing = codeBlocks.get(hash);
          existing.occurrences.push(file);
          duplicateCount++;
        } else {
          codeBlocks.set(hash, {
            code: block,
            occurrences: [file]
          });
        }
      });
    });
    
    // Filter to only show actual duplicates
    const duplicates = Array.from(codeBlocks.values())
      .filter(block => block.occurrences.length > 1)
      .sort((a, b) => b.occurrences.length - a.occurrences.length)
      .slice(0, 10); // Top 10 duplicates
    
    this.results.duplicates = duplicates;
    
    if (duplicates.length > 0) {
      log(`  Found ${duplicates.length} duplicate code blocks`, 'yellow');
      duplicates.slice(0, 3).forEach(dup => {
        log(`    - Block appears in ${dup.occurrences.length} files`, 'gray');
      });
      this.results.score -= Math.min(duplicates.length * 2, 20);
    } else {
      log('  No significant duplicates found', 'green');
    }
  }

  async findUnusedCode() {
    log('\nSearching for unused code...', 'cyan');
    
    try {
      // Check for unused dependencies
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = Object.keys(packageJson.dependencies || {});
      const devDependencies = Object.keys(packageJson.devDependencies || {});
      
      // Simple check for imports in source files
      const sourceFiles = this.getAllFiles(CONFIG.srcPath, ['.js', '.jsx', '.ts', '.tsx']);
      const importedPackages = new Set();
      
      sourceFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
          const pkg = match[1].split('/')[0].replace('@', '');
          importedPackages.add(pkg);
        }
      });
      
      const unusedDeps = dependencies.filter(dep => !importedPackages.has(dep));
      
      this.results.unused = unusedDeps;
      
      if (unusedDeps.length > 0) {
        log(`  Found ${unusedDeps.length} potentially unused dependencies`, 'yellow');
        unusedDeps.slice(0, 5).forEach(dep => {
          log(`    - ${dep}`, 'gray');
        });
        this.results.score -= Math.min(unusedDeps.length, 10);
      } else {
        log('  No unused dependencies detected', 'green');
      }
    } catch (error) {
      log('  Could not analyze unused code', 'gray');
    }
  }

  calculateScore() {
    // Ensure score doesn't go below 0
    this.results.score = Math.max(0, this.results.score);
    
    // Add bonus points for optimizations
    if (fs.existsSync(path.join(CONFIG.distPath, 'service-worker.js'))) {
      this.results.score += 5;
      this.results.optimizations.push('Service Worker implemented');
    }
    
    if (fs.existsSync(path.join(CONFIG.distPath, 'manifest.json'))) {
      this.results.score += 5;
      this.results.optimizations.push('PWA manifest configured');
    }
    
    // Check for gzip compression
    const hasGzipFiles = this.results.bundles.some(b => b.gzipSize < b.size * 0.4);
    if (hasGzipFiles) {
      this.results.score += 5;
      this.results.optimizations.push('Gzip compression effective');
    }
    
    // Cap score at 100
    this.results.score = Math.min(100, this.results.score);
  }

  getGzipSize(filePath) {
    try {
      const content = fs.readFileSync(filePath);
      const gzipped = zlib.gzipSync(content);
      return gzipped.length;
    } catch (error) {
      return 0;
    }
  }

  getAllFiles(dirPath, extensions = []) {
    const files = [];
    
    function traverse(currentPath) {
      if (!fs.existsSync(currentPath)) return;
      
      const items = fs.readdirSync(currentPath);
      
      items.forEach(item => {
        // Skip node_modules and hidden directories
        if (item.startsWith('.') || item === 'node_modules') return;
        
        const fullPath = path.join(currentPath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          traverse(fullPath);
        } else if (stats.isFile()) {
          if (extensions.length === 0 || extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      });
    }
    
    traverse(dirPath);
    return files;
  }

  extractCodeBlocks(content) {
    const blocks = [];
    const lines = content.split('\n');
    
    // Extract functions and classes as blocks
    for (let i = 0; i < lines.length - 10; i++) {
      const block = lines.slice(i, i + 10).join('\n').trim();
      if (block.length > 100) { // Only consider significant blocks
        blocks.push(block);
      }
    }
    
    return blocks;
  }
}

// Performance optimizer class
class PerformanceOptimizer {
  async optimize(analysis) {
    log('\n=== Starting Optimizations ===', 'magenta');
    
    const optimizations = [];
    
    // Optimize images
    if (CONFIG.optimizations.images && analysis.images.length > 0) {
      optimizations.push(await this.optimizeImages(analysis.images));
    }
    
    // Optimize bundles
    if (CONFIG.optimizations.bundles && analysis.bundles.length > 0) {
      optimizations.push(await this.optimizeBundles(analysis.bundles));
    }
    
    // Remove duplicates
    if (CONFIG.optimizations.duplicates && analysis.duplicates.length > 0) {
      optimizations.push(await this.suggestDuplicateRemoval(analysis.duplicates));
    }
    
    // Remove unused code
    if (CONFIG.optimizations.unused && analysis.unused.length > 0) {
      optimizations.push(await this.suggestUnusedRemoval(analysis.unused));
    }
    
    // Enable compression
    if (CONFIG.optimizations.compression) {
      optimizations.push(await this.enableCompression());
    }
    
    // Configure caching
    if (CONFIG.optimizations.caching) {
      optimizations.push(await this.configureCaching());
    }
    
    return optimizations;
  }

  async optimizeImages(images) {
    log('\nOptimizing images...', 'cyan');
    
    const suggestions = [];
    
    images.forEach(image => {
      if (image.oversized) {
        suggestions.push({
          type: 'image',
          file: image.name,
          current: image.sizeKB + 'KB',
          suggestion: 'Consider using WebP format or compressing with tools like imagemin',
          impact: 'high'
        });
      }
    });
    
    if (suggestions.length > 0) {
      log(`  Generated ${suggestions.length} image optimization suggestions`, 'yellow');
    } else {
      log('  Images are well optimized', 'green');
    }
    
    return { type: 'images', suggestions };
  }

  async optimizeBundles(bundles) {
    log('\nOptimizing bundles...', 'cyan');
    
    const suggestions = [];
    
    bundles.forEach(bundle => {
      if (bundle.oversized) {
        suggestions.push({
          type: 'bundle',
          file: bundle.name,
          current: bundle.sizeKB + 'KB',
          suggestion: 'Consider code splitting or lazy loading',
          impact: 'high'
        });
      }
    });
    
    // Check for vendor bundle optimization
    const vendorBundle = bundles.find(b => b.name.includes('vendor') || b.name.includes('chunk'));
    if (vendorBundle && vendorBundle.size > 200 * 1024) {
      suggestions.push({
        type: 'vendor',
        file: vendorBundle.name,
        current: vendorBundle.sizeKB + 'KB',
        suggestion: 'Split vendor bundle into smaller chunks',
        impact: 'medium'
      });
    }
    
    if (suggestions.length > 0) {
      log(`  Generated ${suggestions.length} bundle optimization suggestions`, 'yellow');
    } else {
      log('  Bundles are well optimized', 'green');
    }
    
    return { type: 'bundles', suggestions };
  }

  async suggestDuplicateRemoval(duplicates) {
    log('\nSuggesting duplicate removal...', 'cyan');
    
    const suggestions = duplicates.slice(0, 5).map(dup => ({
      type: 'duplicate',
      occurrences: dup.occurrences.length,
      files: dup.occurrences.map(f => path.relative(process.cwd(), f)),
      suggestion: 'Extract to shared utility or component',
      impact: 'medium'
    }));
    
    log(`  Generated ${suggestions.length} duplicate removal suggestions`, 'yellow');
    
    return { type: 'duplicates', suggestions };
  }

  async suggestUnusedRemoval(unused) {
    log('\nSuggesting unused code removal...', 'cyan');
    
    const suggestions = unused.map(dep => ({
      type: 'unused',
      package: dep,
      suggestion: `Remove unused dependency: npm uninstall ${dep}`,
      impact: 'low'
    }));
    
    log(`  Generated ${suggestions.length} unused code removal suggestions`, 'yellow');
    
    return { type: 'unused', suggestions };
  }

  async enableCompression() {
    log('\nConfiguring compression...', 'cyan');
    
    const suggestions = [
      {
        type: 'compression',
        suggestion: 'Enable gzip compression in production server',
        config: 'app.use(compression());',
        impact: 'high'
      },
      {
        type: 'compression',
        suggestion: 'Enable Brotli compression for better ratios',
        config: 'Use brotli in nginx or CDN',
        impact: 'medium'
      }
    ];
    
    log('  Compression recommendations generated', 'green');
    
    return { type: 'compression', suggestions };
  }

  async configureCaching() {
    log('\nConfiguring caching...', 'cyan');
    
    const suggestions = [
      {
        type: 'caching',
        suggestion: 'Implement browser caching headers',
        config: 'Cache-Control: max-age=31536000',
        impact: 'high'
      },
      {
        type: 'caching',
        suggestion: 'Use CDN for static assets',
        config: 'CloudFlare, Fastly, or AWS CloudFront',
        impact: 'high'
      },
      {
        type: 'caching',
        suggestion: 'Implement Redis caching for API responses',
        config: 'Redis with 5-minute TTL for frequently accessed data',
        impact: 'medium'
      }
    ];
    
    log('  Caching recommendations generated', 'green');
    
    return { type: 'caching', suggestions };
  }
}

// Report generator
class ReportGenerator {
  generate(analysis, optimizations) {
    log('\n=== Performance Report ===', 'magenta');
    
    // Overall score
    const scoreColor = analysis.score >= 80 ? 'green' : analysis.score >= 60 ? 'yellow' : 'red';
    log(`\nPerformance Score: ${analysis.score}/100`, scoreColor);
    
    // Bundle analysis
    log('\nBundle Analysis:', 'cyan');
    const totalBundleSize = analysis.bundles.reduce((sum, b) => sum + b.size, 0);
    log(`  Total size: ${(totalBundleSize / 1024).toFixed(2)}KB`, 'blue');
    log(`  Number of bundles: ${analysis.bundles.length}`, 'blue');
    log(`  Oversized bundles: ${analysis.bundles.filter(b => b.oversized).length}`, 
        analysis.bundles.some(b => b.oversized) ? 'yellow' : 'green');
    
    // Image analysis
    if (analysis.images.length > 0) {
      log('\nImage Analysis:', 'cyan');
      const totalImageSize = analysis.images.reduce((sum, i) => sum + i.size, 0);
      log(`  Total size: ${(totalImageSize / 1024).toFixed(2)}KB`, 'blue');
      log(`  Number of images: ${analysis.images.length}`, 'blue');
      log(`  Oversized images: ${analysis.images.filter(i => i.oversized).length}`,
          analysis.images.some(i => i.oversized) ? 'yellow' : 'green');
    }
    
    // Duplicate code
    if (analysis.duplicates.length > 0) {
      log('\nDuplicate Code:', 'cyan');
      log(`  Duplicate blocks found: ${analysis.duplicates.length}`, 'yellow');
    }
    
    // Unused dependencies
    if (analysis.unused.length > 0) {
      log('\nUnused Dependencies:', 'cyan');
      log(`  Potentially unused: ${analysis.unused.length}`, 'yellow');
      analysis.unused.slice(0, 5).forEach(dep => {
        log(`    - ${dep}`, 'gray');
      });
    }
    
    // Optimizations applied
    if (analysis.optimizations.length > 0) {
      log('\nOptimizations Detected:', 'cyan');
      analysis.optimizations.forEach(opt => {
        log(`  + ${opt}`, 'green');
      });
    }
    
    // Recommendations
    log('\n=== Recommendations ===', 'magenta');
    
    let recommendationCount = 0;
    optimizations.forEach(category => {
      if (category.suggestions && category.suggestions.length > 0) {
        log(`\n${category.type.charAt(0).toUpperCase() + category.type.slice(1)}:`, 'cyan');
        category.suggestions.slice(0, 3).forEach(suggestion => {
          recommendationCount++;
          const impactColor = suggestion.impact === 'high' ? 'red' : 
                             suggestion.impact === 'medium' ? 'yellow' : 'gray';
          log(`  ${recommendationCount}. ${suggestion.suggestion}`, impactColor);
          if (suggestion.current) {
            log(`     Current: ${suggestion.current}`, 'gray');
          }
          if (suggestion.config) {
            log(`     Config: ${suggestion.config}`, 'gray');
          }
        });
      }
    });
    
    if (recommendationCount === 0) {
      log('\nNo critical optimizations needed!', 'green');
    }
    
    // Save report to file
    this.saveReport(analysis, optimizations);
  }

  saveReport(analysis, optimizations) {
    const reportPath = path.join(process.cwd(), 'performance-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      score: analysis.score,
      analysis,
      optimizations,
      summary: {
        bundleCount: analysis.bundles.length,
        totalBundleSize: analysis.bundles.reduce((sum, b) => sum + b.size, 0),
        imageCount: analysis.images.length,
        duplicateCount: analysis.duplicates.length,
        unusedCount: analysis.unused.length
      }
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\nReport saved to: performance-report.json`, 'green');
  }
}

// Main execution
async function main() {
  log('Performance Optimization Tool', 'magenta');
  log('=============================\n', 'magenta');
  
  const analyzer = new PerformanceAnalyzer();
  const optimizer = new PerformanceOptimizer();
  const reporter = new ReportGenerator();
  
  try {
    // Run analysis
    const analysis = await analyzer.analyze();
    
    // Generate optimizations
    const optimizations = await optimizer.optimize(analysis);
    
    // Generate report
    reporter.generate(analysis, optimizations);
    
    // Exit with appropriate code
    process.exit(analysis.score >= 60 ? 0 : 1);
  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle errors
process.on('uncaughtException', _(error) => {
  log(`\nUnexpected error: ${error.message}`, 'red');
  process.exit(1);
});

// Run main function
main();