#!/usr/bin/env node

/**
 * Performance Optimization Agent
 * Automatically optimizes build size, bundle splitting, and runtime performance
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


const execAsync = promisify(exec);

class PerformanceOptimizationAgent {
  constructor() {
    this.branch = process.env.BRANCH || 'development';
    this.fixesApplied = [];
  }

  async run() {
    logDebug(`⚡ Performance Optimization Agent analyzing ${this.branch}...`);
    
    const issues = await this.detectPerformanceIssues();
    
    if (issues.length > 0) {
      await this.applyOptimizations(issues);
      return this.generateReport();
    }
    
    return { fixApplied: false };
  }

  async detectPerformanceIssues() {
    const issues = [];
    
    // Analyze bundle size
    try {
      const { stdout } = await execAsync('npm run build 2>&1');
      
      // Extract bundle sizes
      const sizeRegex = /(\\d+\.\\d+)\\s*(kB|MB)/g;
      let match;
      const bundles = [];
      
      while ((match = sizeRegex.exec(stdout)) !== null) {
        const size = parseFloat(match[1]);
        const unit = match[2];
        const sizeInKB = unit === 'MB' ? size * 1024 : size;
        
        if (sizeInKB > 500) {
          bundles.push({ size: sizeInKB, unit });
        }
      }
      
      if (bundles.length > 0) {
        issues.push({
          type: 'large-bundles',
          bundles,
          fixable: true
        });
      }
      
      // Check build time
      const timeMatch = stdout.match(/built in (\\d+\.\\d+)s/);
      if (timeMatch) {
        const buildTime = parseFloat(timeMatch[1]);
        if (buildTime > 10) {
          issues.push({
            type: 'slow-build',
            time: buildTime,
            fixable: true
          });
        }
      }
    } catch (error) {
      logError('Build analysis failed:', error.message);
    }
    
    // Check for unoptimized images
    try {
      const { stdout } = await execAsync(
        'find public src -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -size +100k 2>/dev/null | head -10 || true'
      );
      
      const largeImages = stdout.trim().split('\\n').filter(Boolean);
      if (largeImages.length > 0) {
        issues.push({
          type: 'unoptimized-images',
          files: largeImages,
          fixable: true
        });
      }
    } catch {
      // No large images found
    }
    
    // Check for missing lazy loading
    try {
      const { stdout } = await execAsync(
        'grep -r "import.*from" src/ --include="*.jsx" | grep -v "React.lazy" | wc -l'
      );
      
      const nonLazyImports = parseInt(stdout.trim()) || 0;
      if (nonLazyImports > 50) {
        issues.push({
          type: 'missing-lazy-loading',
          count: nonLazyImports,
          fixable: true
        });
      }
    } catch {
      // Unable to check lazy loading
    }
    
    // Check for inefficient re-renders
    try {
      const { stdout } = await execAsync(
        'grep -r "useState\\|useEffect" src/ --include="*.jsx" -c | sort -t: -k2 -rn | head -5'
      );
      
      const complexComponents = stdout.trim().split('\\n').filter(line => {
        const parts = line.split(':');
        return parseInt(parts[1]) > 10;
      });
      
      if (complexComponents.length > 0) {
        issues.push({
          type: 'complex-components',
          files: complexComponents.map(c => c.split(':')[0]),
          fixable: true
        });
      }
    } catch {
      // Unable to check component complexity
    }
    
    return issues;
  }

  async applyOptimizations(issues) {
    for (const issue of issues) {
      try {
        switch (issue.type) {
          case 'large-bundles':
            await this.optimizeBundles(issue);
            break;
            
          case 'slow-build':
            await this.optimizeBuildConfig(issue);
            break;
            
          case 'unoptimized-images':
            await this.optimizeImages(issue);
            break;
            
          case 'missing-lazy-loading':
            await this.addLazyLoading(issue);
            break;
            
          case 'complex-components':
            await this.optimizeComponents(issue);
            break;
        }
      } catch (error) {
        logError(`Failed to optimize ${issue.type}: ${error.message}`);
      }
    }
  }

  async optimizeBundles(issue) {
    try {
      // Update vite.config.js for better code splitting
      const configPath = 'vite.config.js';
      const config = await fs.readFile(configPath, 'utf-8');
      
      if (!config.includes('manualChunks')) {
        const updatedConfig = config.replace(
          'build: {',
          `build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'utils': ['lodash', 'axios', 'date-fns']
        }
      }
    },`
        );
        
        await fs.writeFile(configPath, updatedConfig);
        this.fixesApplied.push({
          type: 'Bundle optimization',
          description: 'Improved code splitting configuration',
          files: [configPath]
        });
      }
    } catch (error) {
      logError('Failed to optimize bundles:', error.message);
    }
  }

  async optimizeBuildConfig(issue) {
    try {
      // Add build optimizations to vite.config.js
      const configPath = 'vite.config.js';
      const config = await fs.readFile(configPath, 'utf-8');
      
      if (!config.includes('minify:')) {
        const updatedConfig = config.replace(
          'build: {',
          `build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,`
        );
        
        await fs.writeFile(configPath, updatedConfig);
        this.fixesApplied.push({
          type: 'Build optimization',
          description: 'Enhanced build configuration for speed',
          files: [configPath]
        });
      }
    } catch (error) {
      logError('Failed to optimize build config:', error.message);
    }
  }

  async optimizeImages(issue) {
    // In production, you would use imagemin or similar
    // For now, we'll add lazy loading attributes
    for (const imagePath of issue.files) {
      try {
        // Find JSX files that reference this image
        const imageName = path.basename(imagePath);
        const { stdout } = await execAsync(
          `grep -r "${imageName}" src/ --include="*.jsx" -l | head -5`
        );
        
        const files = stdout.trim().split('\\n').filter(Boolean);
        
        for (const file of files) {
          const content = await fs.readFile(file, 'utf-8');
          const updated = content.replace(
            /<img([^>]+)src=["']([^"']*${imageName}[^"']*)["']([^>]*)>/g,
            (match, _before, src, after) => {
              if (!match.includes('loading=')) {
                return `<img${before}src="${src}"${after} loading="lazy">`;
              }
              return match;
            }
          );
          
          if (updated !== content) {
            await fs.writeFile(file, updated);
            this.fixesApplied.push({
              type: 'Image optimization',
              description: 'Added lazy loading to images',
              files: [file]
            });
          }
        }
      } catch (error) {
        logError(`Failed to optimize image ${imagePath}: ${error.message}`);
      }
    }
  }

  async addLazyLoading(issue) {
    try {
      // Find route components that can be lazy loaded
      const routeFiles = ['src/App.jsx', 'src/main.jsx'];
      
      for (const file of routeFiles) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          let updated = content;
          
          // Convert static imports to lazy imports for routes
          const importRegex = /import (\w+) from ['"](.+/pages/.+)['"]/g;
          const lazyImports = [];
          
          updated = updated.replace(importRegex, (match, component, path) => {
            lazyImports.push(`const ${component} = React.lazy(() => import('${path}'));`);
            return ''; // Remove original import
          });
          
          if (lazyImports.length > 0) {
            // Add React import if not present
            if (!updated.includes('import React')) {
              updated = "import React from 'react';\\n" + updated;
            }
            
            // Add lazy imports after React import
            updated = updated.replace(
              "import React from 'react';",
              "import React from 'react';\\n" + lazyImports.join('\\n')
            );
            
            // Wrap routes in Suspense
            if (!updated.includes('Suspense')) {
              updated = updated.replace(
                '<Routes>',
                '<React.Suspense fallback={<div>Loading...</div>}>\\n    <Routes>'
              ).replace(
                '</Routes>',
                '</Routes>\\n  </React.Suspense>'
              );
            }
            
            await fs.writeFile(file, updated);
            this.fixesApplied.push({
              type: 'Lazy loading',
              description: 'Added lazy loading for route components',
              files: [file]
            });
          }
        } catch (error) {
          logError(`Failed to add lazy loading to ${file}: ${error.message}`);
        }
      }
    } catch (error) {
      logError('Failed to add lazy loading:', error.message);
    }
  }

  async optimizeComponents(issue) {
    for (const file of issue.files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        let updated = content;
        
        // Add React.memo to functional components
        const componentRegex = /export (default )?function (\w+)\s*(/g;
        
        updated = _updated.replace(componentRegex, (match, exportDefault, name) => {
          if (!content.includes(`React.memo(${name})`)) {
            return `${match}\\n\\nexport ${exportDefault || ''}React.memo(${name})`;
          }
          return match;
        });
        
        // Add useMemo for expensive computations
        if (content.includes('map(') && !content.includes('useMemo')) {
          if (!updated.includes('useMemo')) {
            updated = updated.replace(
              "import { useState",
              "import { useState, useMemo"
            );
            
            if (!updated.includes('import { useState')) {
              updated = updated.replace(
                "from 'react'",
                ", { useMemo } from 'react'"
              );
            }
          }
        }
        
        if (updated !== content) {
          await fs.writeFile(file, updated);
          this.fixesApplied.push({
            type: 'Component optimization',
            description: 'Added React.memo and performance optimizations',
            files: [file]
          });
        }
      } catch (error) {
        logError(`Failed to optimize ${file}: ${error.message}`);
      }
    }
  }

  generateReport() {
    const confidence = this.calculateConfidence();
    
    return {
      fixApplied: this.fixesApplied.length > 0,
      description: `Applied ${this.fixesApplied.length} performance optimizations`,
      files: [...new Set(this.fixesApplied.flatMap(f => f.files))],
      confidence,
      details: this.fixesApplied
    };
  }

  calculateConfidence() {
    let totalConfidence = 0;
    let count = 0;
    
    for (const fix of this.fixesApplied) {
      switch (fix.type) {
        case 'Bundle optimization':
          totalConfidence += 0.90;
          break;
        case 'Build optimization':
          totalConfidence += 0.85;
          break;
        case 'Image optimization':
          totalConfidence += 0.95;
          break;
        case 'Lazy loading':
          totalConfidence += 0.88;
          break;
        case 'Component optimization':
          totalConfidence += 0.82;
          break;
        default:
          totalConfidence += 0.80;
      }
      count++;
    }
    
    return count > 0 ? totalConfidence / count : 0;
  }
}

// Main execution
async function main() {
  const agent = new PerformanceOptimizationAgent();
  const result = await agent.run();
  
  // Output JSON result for orchestrator
  logDebug(JSON.stringify(result));
}

main().catch(error => {
  logError(error);
  process.exit(1);
});