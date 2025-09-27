#!/usr/bin/env node

/**
 * Legacy Files Cleanup Script
 * Removes old backup files, archives, and temporary files to clean up the repository
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(__dirname);

// Files and directories to remove
const itemsToClean = [
  // Backup directories (old dated backups)
  'backup_20250916_080022',
  'backup_20250916_080048',

  // Archive directories (old archived code)
  '_archive',
  'legacy',
  'src/legacy',

  // Backup files
  'backup_pre-reset-2025-09-25.zip', // 89MB - largest file
  'package-complex-backup.json',
  'render-backup-development-only.yaml',
  'render-backup-restore.ps1',
  'render-complex-backup.yaml',
  'src/App-tailwind-backup.css',

  // Generated/temporary files
  'generate-placeholders.ps1',

  // Test scaffolding files that may not be needed
  'src/components/auth/AuthScaffold.jsx',
  'tests/unit/components/auth/AuthScaffold.test.jsx'
];

// Keep these files (they may still be needed)
const filesToKeep = [
  'scripts/database-backup.js', // This is an active script, not a backup file
];

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getItemSize(itemPath) {
  try {
    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
      // For directories, calculate total size recursively
      let totalSize = 0;
      function calculateDirSize(dirPath) {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const itemStats = fs.statSync(fullPath);
          if (itemStats.isDirectory()) {
            calculateDirSize(fullPath);
          } else {
            totalSize += itemStats.size;
          }
        }
      }
      calculateDirSize(itemPath);
      return totalSize;
    } else {
      return stats.size;
    }
  } catch (error) {
    return 0;
  }
}

function removeItem(itemPath) {
  try {
    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
      fs.rmSync(itemPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(itemPath);
    }
    return true;
  } catch (error) {
    console.error(`Error removing ${itemPath}:`, error.message);
    return false;
  }
}

function cleanupLegacyFiles() {
  console.log('🧹 Starting legacy files cleanup...\n');

  let totalItemsRemoved = 0;
  let totalSizeFreed = 0;
  const results = [];

  // Check and remove each item
  for (const relativePath of itemsToClean) {
    const fullPath = path.join(rootDir, relativePath);

    // Skip if file should be kept
    if (filesToKeep.includes(relativePath)) {
      console.log(`⏭️  Skipping ${relativePath} (marked to keep)`);
      continue;
    }

    // Check if item exists
    if (!fs.existsSync(fullPath)) {
      console.log(`⏭️  ${relativePath} (not found)`);
      continue;
    }

    // Get size before removal
    const itemSize = getItemSize(fullPath);

    // Remove the item
    if (removeItem(fullPath)) {
      console.log(`✅ Removed ${relativePath} (${formatSize(itemSize)})`);
      totalItemsRemoved++;
      totalSizeFreed += itemSize;
      results.push({ path: relativePath, size: itemSize, removed: true });
    } else {
      console.log(`❌ Failed to remove ${relativePath}`);
      results.push({ path: relativePath, size: itemSize, removed: false });
    }
  }

  console.log('\n📊 Cleanup Summary:');
  console.log(`   Items removed: ${totalItemsRemoved}`);
  console.log(`   Space freed: ${formatSize(totalSizeFreed)}`);

  if (totalSizeFreed > 1024 * 1024) { // More than 1MB
    console.log(`\n🎉 Successfully freed ${formatSize(totalSizeFreed)} of disk space!`);
  }

  return results;
}

// Run the cleanup
console.log('🔍 Legacy Files Cleanup Tool\n');
const results = cleanupLegacyFiles();
console.log('\n✅ Legacy files cleanup complete!');