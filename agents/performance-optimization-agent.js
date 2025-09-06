import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

class PerformanceOptimizationAgent {
  constructor() {
    this.changes = [];
  }

  async run(branch) {
    console.log(`Running performance optimizations on ${branch}...`);
    this.changes = [];

    try {
      // Optimize bundle size
      await this.optimizeBundleSize();
      
      // Add lazy loading to routes
      await this.addLazyLoading();
      
      // Optimize images
      await this.optimizeImages();
      
      // Add memoization
      await this.addMemoization();
      
      return {
        success: true,
        changes: this.changes
      };
    } catch (error) {
      console.error('Performance optimization agent error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async optimizeBundleSize() {
    try {
      // Analyze bundle
      const { stdout } = await execAsync('npm run build', {
        cwd: process.cwd()
      });
      
      // Check for large chunks
      if (stdout.includes('chunk') && stdout.includes('kB')) {
        const lines = stdout.split('\\n');
        const largeChunks = lines.filter(line => {
          const match = line.match(/(\\d+)\\s*kB/);
          return match && parseInt(match[1]) > 500;
        });
        
        if (largeChunks.length > 0) {
          console.log(`⚠️ Found ${largeChunks.length} large chunks`);
          // Would implement chunk splitting here
        }
      }
    } catch (error) {
      console.warn('Warning: Could not analyze bundle:', error.message);
    }
  }

  async addLazyLoading() {
    try {
      const routesPath = path.join(process.cwd(), 'src', 'App.jsx');
      
      try {
        const content = await fs.readFile(routesPath, 'utf-8');
        
        // Check if lazy loading is already implemented
        if (!content.includes('React.lazy')) {
          const lines = content.split('\\n');
          const modifiedLines = [];
          let importsModified = false;
          
          // Add React.lazy import if not present
          if (!content.includes('lazy')) {
            for (let i = 0; i < lines.length; i++) {
              modifiedLines.push(lines[i]);
              if (lines[i].includes('import React') && !importsModified) {
                modifiedLines.push('const lazy = React.lazy;');
                importsModified = true;
              }
            }
          } else {
            modifiedLines.push(...lines);
          }
          
          // Convert static imports to lazy imports for pages
          const pageImportRegex = /import (\\w+) from ['"](.+\\/pages\\/.+)['"]/g;
          let newContent = modifiedLines.join('\\n');
          const matches = [...newContent.matchAll(pageImportRegex)];
          
          for (const match of matches) {
            const [fullMatch, componentName, importPath] = match;
            const lazyImport = `const ${componentName} = lazy(() => import('${importPath}'))`;
            newContent = newContent.replace(fullMatch, lazyImport);
          }
          
          if (matches.length > 0) {
            await fs.writeFile(routesPath, newContent);
            this.changes.push(`Added lazy loading to ${matches.length} routes`);
            console.log(`✅ Added lazy loading to ${matches.length} routes`);
          }
        }
      } catch (error) {
        // Routes file might not exist
        console.log('Routes file not found, skipping lazy loading');
      }
    } catch (error) {
      console.warn('Warning: Could not add lazy loading:', error.message);
    }
  }

  async optimizeImages() {
    try {
      const publicPath = path.join(process.cwd(), 'public');
      const images = await this.getImageFiles(publicPath);
      
      // Check for large images
      let largeImages = 0;
      for (const image of images) {
        const stats = await fs.stat(image);
        if (stats.size > 100 * 1024) { // 100KB
          largeImages++;
        }
      }
      
      if (largeImages > 0) {
        console.log(`⚠️ Found ${largeImages} large images that could be optimized`);
        // Would implement image optimization here
      }
    } catch (error) {
      console.warn('Warning: Could not optimize images:', error.message);
    }
  }

  async addMemoization() {
    try {
      const componentsPath = path.join(process.cwd(), 'src', 'components');
      const files = await this.getJSFiles(componentsPath);
      let filesModified = 0;
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Check for components that could benefit from memo
        const componentRegex = /export (default )?function (\\w+)\\s*\\(/g;
        const matches = [...content.matchAll(componentRegex)];
        
        if (matches.length > 0 && !content.includes('React.memo')) {
          // Add React.memo import
          let newContent = content;
          if (!content.includes('memo')) {
            newContent = content.replace(
              /import React/,
              'import React, { memo }'
            );
          }
          
          // Wrap components in memo
          for (const match of matches) {
            const [fullMatch, exportDefault, componentName] = match;
            if (!content.includes(`memo(${componentName})`)) {
              const memoizedExport = exportDefault 
                ? `export default memo(function ${componentName}(`
                : `export const ${componentName} = memo(function ${componentName}(`;
              newContent = newContent.replace(fullMatch, memoizedExport);
              
              // Add closing parenthesis for memo
              const componentEndRegex = new RegExp(`function ${componentName}[^}]+}`, 's');
              newContent = newContent.replace(componentEndRegex, (match) => `${match})`);
            }
          }
          
          if (newContent !== content) {
            await fs.writeFile(file, newContent);
            filesModified++;
          }
        }
      }
      
      if (filesModified > 0) {
        this.changes.push(`Added memoization to ${filesModified} components`);
        console.log(`✅ Added memoization to ${filesModified} components`);
      }
    } catch (error) {
      console.warn('Warning: Could not add memoization:', error.message);
    }
  }

  async getJSFiles(dir) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          files.push(...await this.getJSFiles(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
    
    return files;
  }

  async getImageFiles(dir) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...await this.getImageFiles(fullPath));
        } else if (entry.isFile() && /\\.(png|jpg|jpeg|gif|svg)$/i.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
    
    return files;
  }
}

export default new PerformanceOptimizationAgent();