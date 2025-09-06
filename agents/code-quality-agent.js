import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

class CodeQualityAgent {
  constructor() {
    this.changes = [];
  }

  async run(branch) {
    console.log(`Running code quality checks on ${branch}...`);
    this.changes = [];

    try {
      // Run ESLint and auto-fix
      await this.runESLintFixes();
      
      // Remove console.log statements from production code
      await this.removeConsoleLogs();
      
      // Fix import sorting
      await this.fixImportSorting();
      
      // Remove unused imports
      await this.removeUnusedImports();
      
      return {
        success: true,
        changes: this.changes
      };
    } catch (error) {
      console.error('Code quality agent error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runESLintFixes() {
    try {
      const { stdout, stderr } = await execAsync('npm run lint:fix', {
        cwd: path.resolve(process.cwd())
      });
      
      if (stdout.includes('fixed')) {
        this.changes.push('Fixed ESLint issues');
        console.log('✅ ESLint fixes applied');
      }
    } catch (error) {
      // ESLint returns non-zero exit code even when fixes are applied
      if (error.stdout && error.stdout.includes('fixed')) {
        this.changes.push('Fixed ESLint issues');
        console.log('✅ ESLint fixes applied');
      }
    }
  }

  async removeConsoleLogs() {
    try {
      const srcPath = path.join(process.cwd(), 'src');
      const files = await this.getJSFiles(srcPath);
      let filesModified = 0;

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const consoleRegex = /console\.log\([^)]*\);?\n?/g;
        
        if (consoleRegex.test(content)) {
          const newContent = content.replace(consoleRegex, '');
          await fs.writeFile(file, newContent);
          filesModified++;
        }
      }

      if (filesModified > 0) {
        this.changes.push(`Removed console.log statements from ${filesModified} files`);
        console.log(`✅ Removed console.log from ${filesModified} files`);
      }
    } catch (error) {
      console.warn('Warning: Could not remove console.logs:', error.message);
    }
  }

  async fixImportSorting() {
    try {
      const srcPath = path.join(process.cwd(), 'src');
      const files = await this.getJSFiles(srcPath);
      let filesModified = 0;

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\\n');
        
        // Find import block
        const importLines = [];
        let importStart = -1;
        let importEnd = -1;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            if (importStart === -1) importStart = i;
            importLines.push(lines[i]);
            importEnd = i;
          } else if (importStart !== -1 && lines[i].trim() === '') {
            // Continue if empty line within imports
            continue;
          } else if (importStart !== -1) {
            // End of import block
            break;
          }
        }

        if (importLines.length > 1) {
          // Sort imports
          const sortedImports = importLines.sort((a, b) => {
            // React imports first
            if (a.includes('react')) return -1;
            if (b.includes('react')) return 1;
            // Then node_modules
            if (!a.includes('./') && b.includes('./')) return -1;
            if (a.includes('./') && !b.includes('./')) return 1;
            // Then alphabetical
            return a.localeCompare(b);
          });

          // Replace if different
          if (JSON.stringify(importLines) !== JSON.stringify(sortedImports)) {
            lines.splice(importStart, importEnd - importStart + 1, ...sortedImports);
            await fs.writeFile(file, lines.join('\\n'));
            filesModified++;
          }
        }
      }

      if (filesModified > 0) {
        this.changes.push(`Sorted imports in ${filesModified} files`);
        console.log(`✅ Sorted imports in ${filesModified} files`);
      }
    } catch (error) {
      console.warn('Warning: Could not sort imports:', error.message);
    }
  }

  async removeUnusedImports() {
    try {
      const srcPath = path.join(process.cwd(), 'src');
      const files = await this.getJSFiles(srcPath);
      let filesModified = 0;

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\\n');
        const modifiedLines = [];
        let modified = false;

        for (const line of lines) {
          if (line.startsWith('import ')) {
            // Extract imported names
            const importMatch = line.match(/import\\s+(?:{([^}]+)}|([\\w]+))\\s+from/);
            if (importMatch) {
              const imports = importMatch[1] || importMatch[2];
              const importNames = imports.split(',').map(s => s.trim());
              
              // Check if any import is used in the rest of the file
              const restOfFile = lines.join('\\n').replace(line, '');
              const usedImports = importNames.filter(name => {
                const regex = new RegExp(`\\\\b${name}\\\\b`);
                return regex.test(restOfFile);
              });

              if (usedImports.length === 0) {
                // Skip this import line
                modified = true;
                continue;
              } else if (usedImports.length < importNames.length) {
                // Reconstruct import with only used imports
                const newImport = line.replace(
                  /import\\s+(?:{[^}]+}|[\\w]+)\\s+from/,
                  `import { ${usedImports.join(', ')} } from`
                );
                modifiedLines.push(newImport);
                modified = true;
                continue;
              }
            }
          }
          modifiedLines.push(line);
        }

        if (modified) {
          await fs.writeFile(file, modifiedLines.join('\\n'));
          filesModified++;
        }
      }

      if (filesModified > 0) {
        this.changes.push(`Removed unused imports from ${filesModified} files`);
        console.log(`✅ Removed unused imports from ${filesModified} files`);
      }
    } catch (error) {
      console.warn('Warning: Could not remove unused imports:', error.message);
    }
  }

  async getJSFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        files.push(...await this.getJSFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }

    return files;
  }
}

export default new CodeQualityAgent();