#!/usr/bin/env node

/**
 * Code Quality Agent
 * Automatically fixes ESLint errors, formatting issues, and code quality problems
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

class CodeQualityAgent {
  constructor() {
    this.branch = process.env.BRANCH || 'development';
    this.fixesApplied = [];
  }

  async run() {
    console.log(`🔍 Code Quality Agent scanning ${this.branch}...`);
    
    const issues = await this.detectIssues();
    
    if (issues.length > 0) {
      await this.applyFixes(issues);
      return this.generateReport();
    }
    
    return { fixApplied: false };
  }

  async detectIssues() {
    const issues = [];
    
    // Run ESLint
    try {
      const { stdout } = await execAsync('npm run lint -- --format json');
      const lintResults = JSON.parse(stdout);
      
      for (const file of lintResults) {
        if (file.errorCount > 0 || file.warningCount > 0) {
          issues.push({
            type: 'eslint',
            file: file.filePath,
            errors: file.errorCount,
            warnings: file.warningCount,
            fixable: file.fixableErrorCount + file.fixableWarningCount > 0
          });
        }
      }
    } catch (error) {
      // ESLint returns non-zero exit code when issues found
      if (error.stdout) {
        try {
          const lintResults = JSON.parse(error.stdout);
          for (const file of lintResults) {
            if (file.errorCount > 0) {
              issues.push({
                type: 'eslint',
                file: file.filePath,
                errors: file.errorCount,
                fixable: file.fixableErrorCount > 0
              });
            }
          }
        } catch {
          // Fallback to simple detection
          const { stdout } = await execAsync('npm run lint 2>&1 | grep -c "error" || true');
          const errorCount = parseInt(stdout.trim()) || 0;
          if (errorCount > 0) {
            issues.push({
              type: 'eslint',
              count: errorCount,
              fixable: true
            });
          }
        }
      }
    }
    
    // Check for console statements
    try {
      const { stdout } = await execAsync('grep -r "console\\." src/ --include="*.js" --include="*.jsx" -l | head -20');
      const filesWithConsole = stdout.trim().split('\n').filter(Boolean);
      
      for (const file of filesWithConsole) {
        issues.push({
          type: 'console',
          file,
          fixable: true
        });
      }
    } catch {
      // No console statements found
    }
    
    // Check for unused imports
    try {
      const { stdout } = await execAsync('npx eslint-plugin-unused-imports --fix-dry-run src/ 2>/dev/null | grep -c "unused" || true');
      const unusedCount = parseInt(stdout.trim()) || 0;
      if (unusedCount > 0) {
        issues.push({
          type: 'unused-imports',
          count: unusedCount,
          fixable: true
        });
      }
    } catch {
      // No unused imports tool available
    }
    
    return issues;
  }

  async applyFixes(issues) {
    for (const issue of issues) {
      try {
        switch (issue.type) {
          case 'eslint':
            if (issue.fixable) {
              await this.fixESLint(issue);
            }
            break;
            
          case 'console':
            await this.fixConsoleStatements(issue);
            break;
            
          case 'unused-imports':
            await this.fixUnusedImports();
            break;
        }
      } catch (error) {
        console.error(`Failed to fix ${issue.type}: ${error.message}`);
      }
    }
  }

  async fixESLint(issue) {
    try {
      await execAsync('npm run lint:fix');
      this.fixesApplied.push({
        type: 'ESLint auto-fix',
        description: `Fixed ${issue.errors || 0} errors and ${issue.warnings || 0} warnings`,
        files: issue.file ? [issue.file] : []
      });
    } catch (error) {
      // Some errors might not be auto-fixable
      console.warn('Some ESLint errors could not be auto-fixed');
    }
  }

  async fixConsoleStatements(issue) {
    try {
      const content = await fs.readFile(issue.file, 'utf-8');
      
      // Import devLog if not already imported
      let updatedContent = content;
      if (!content.includes('devLog')) {
        const importStatement = "import { devLog } from '../lib/devLog.js';\\n";
        updatedContent = importStatement + updatedContent;
      }
      
      // Replace console statements
      updatedContent = updatedContent
        .replace(/console\.log\(/g, 'devLog.log(')
        .replace(/console\.warn\(/g, 'devLog.warn(')
        .replace(/console\.error\(/g, 'devLog.error(')
        .replace(/console\.info\(/g, 'devLog.log(');
      
      if (updatedContent !== content) {
        await fs.writeFile(issue.file, updatedContent);
        this.fixesApplied.push({
          type: 'Console statement removal',
          description: `Replaced console statements with devLog`,
          files: [issue.file]
        });
      }
    } catch (error) {
      console.error(`Failed to fix console in ${issue.file}: ${error.message}`);
    }
  }

  async fixUnusedImports() {
    try {
      // Use a simple regex-based approach for common cases
      const files = await this.findJSFiles('src');
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\\n');
        const usedIdentifiers = new Set();
        
        // Find all used identifiers
        const codeLines = lines.filter(line => !line.trim().startsWith('import'));
        const codeContent = codeLines.join('\\n');
        
        // Simple identifier extraction
        const identifierRegex = /\\b[a-zA-Z_][a-zA-Z0-9_]*\\b/g;
        let match;
        while ((match = identifierRegex.exec(codeContent)) !== null) {
          usedIdentifiers.add(match[0]);
        }
        
        // Check imports
        const updatedLines = [];
        let modified = false;
        
        for (const line of lines) {
          if (line.trim().startsWith('import')) {
            const importMatch = line.match(/import\\s+(?:{([^}]+)}|([a-zA-Z_][a-zA-Z0-9_]*))\\s+from/);
            if (importMatch) {
              const imports = importMatch[1] ? importMatch[1].split(',').map(i => i.trim()) : [importMatch[2]];
              const usedImports = imports.filter(imp => {
                const name = imp.split(' as ')[0].trim();
                return usedIdentifiers.has(name);
              });
              
              if (usedImports.length === 0) {
                modified = true;
                continue; // Skip this import line
              } else if (usedImports.length < imports.length) {
                // Partial usage - reconstruct import
                const newImport = line.replace(
                  /{[^}]+}/,
                  `{ ${usedImports.join(', ')} }`
                );
                updatedLines.push(newImport);
                modified = true;
                continue;
              }
            }
          }
          updatedLines.push(line);
        }
        
        if (modified) {
          await fs.writeFile(file, updatedLines.join('\\n'));
          this.fixesApplied.push({
            type: 'Unused imports removal',
            description: 'Removed unused imports',
            files: [file]
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fix unused imports: ${error.message}`);
    }
  }

  async findJSFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...await this.findJSFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  generateReport() {
    const confidence = this.calculateConfidence();
    
    return {
      fixApplied: this.fixesApplied.length > 0,
      description: `Applied ${this.fixesApplied.length} code quality fixes`,
      files: [...new Set(this.fixesApplied.flatMap(f => f.files))],
      confidence,
      details: this.fixesApplied
    };
  }

  calculateConfidence() {
    // Higher confidence for automated ESLint fixes
    let totalConfidence = 0;
    let count = 0;
    
    for (const fix of this.fixesApplied) {
      switch (fix.type) {
        case 'ESLint auto-fix':
          totalConfidence += 0.95;
          break;
        case 'Console statement removal':
          totalConfidence += 0.90;
          break;
        case 'Unused imports removal':
          totalConfidence += 0.85;
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
  const agent = new CodeQualityAgent();
  const result = await agent.run();
  
  // Output JSON result for orchestrator
  console.log(JSON.stringify(result));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});