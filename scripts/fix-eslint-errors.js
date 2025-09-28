#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';

// Function to check if motion is actually used in the file
async function isMotionUsed(content) {
  return /motion\./.test(content) || /<motion\./.test(content);
}

// Function to check if useEffect is actually used in the file
async function isUseEffectUsed(content) {
  return /useEffect\s*\(/.test(content);
}

// Function to process a single file for specific ESLint errors
async function processFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // Remove unused motion imports if motion is not used
    if (content.includes("import { motion") && !await isMotionUsed(content)) {
      content = content.replace(/import\s*\{\s*motion,?\s*([^}]*)\s*\}\s*from\s*'framer-motion';?/g, (match, remaining) => {
        const cleanRemaining = remaining.trim().replace(/^,\s*|,\s*$/g, '');
        if (cleanRemaining) {
          return `import { ${cleanRemaining} } from 'framer-motion';`;
        } else {
          return '';
        }
      });
      modified = true;
    }

    // Remove unused useEffect imports if useEffect is not used
    if (content.includes("useEffect") && !await isUseEffectUsed(content)) {
      content = content.replace(/import\s*\{\s*([^}]*),?\s*useEffect,?\s*([^}]*)\s*\}\s*from\s*'react';?/g, (match, before, after) => {
        const allParts = [before, after].filter(part => part && part.trim()).join(', ');
        if (allParts.trim()) {
          return `import { ${allParts} } from 'react';`;
        } else {
          return `import React from 'react';`;
        }
      });
      modified = true;
    }

    // Fix unused parameters by adding underscore prefix
    content = content.replace(/\(([^,)]+),\s*(\w+)\)\s*=>/g, (match, param1, param2) => {
      if (param2 === 'index' || param2 === 'itemIndex' || param2.toLowerCase().includes('index')) {
        return `(${param1}, _${param2}) =>`;
      }
      return match;
    });

    // Fix unused parameters in .map callbacks
    content = content.replace(/\.map\(\s*\(([^,)]+),\s*(\w+)\)\s*=>/g, (match, param1, param2) => {
      if (param2 === 'index' || param2 === 'itemIndex' || param2.toLowerCase().includes('index')) {
        return `.map((${param1}, _${param2}) =>`;
      }
      return match;
    });

    // Fix unused setState variables
    content = content.replace(/const\s+\[(\w+),\s+set(\w+)\]\s+=\s+useState\(/g, (match, stateName, setterName) => {
      const setterPattern = new RegExp(`set${setterName}\\s*\\(`, 'g');
      if (!setterPattern.test(content)) {
        return `const [${stateName}] = useState(`;
      }
      return match;
    });

    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
      modified = true;
    }

    return modified;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Find all files to process
async function findFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  const files = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
          files.push(...await findFiles(fullPath, extensions));
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return files;
}

// Main execution
async function main() {
  console.log('Starting ESLint error fixes...');

  const srcFiles = await findFiles('./src');
  console.log(`Found ${srcFiles.length} files to process`);

  let fixedCount = 0;

  for (const file of srcFiles) {
    const wasFixed = await processFile(file);
    if (wasFixed) {
      fixedCount++;
    }
  }

  console.log(`\nCompleted! Fixed ${fixedCount} files out of ${srcFiles.length} total files.`);
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});