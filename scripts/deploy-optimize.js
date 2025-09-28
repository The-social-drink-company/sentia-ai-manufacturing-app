#!/usr/bin/env node

/**
 * Deployment Optimization Script
 * This script optimizes the project for deployment by:
 * 1. Cleaning build artifacts
 * 2. Optimizing file sizes
 * 3. Removing unnecessary files
 * 4. Ensuring proper build structure
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename);

console.log('🚀 Starting deployment optimization...');

// Clean up function
function cleanDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`🧹 Cleaning ${dirPath}...`);
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`⚠️  Could not clean ${dirPath}: ${error.message}`);
    }
  }
}

// Remove large files that might cause deployment issues
function removeLargeFiles() {
  console.log('📦 Removing large files that might cause deployment issues...');
  
  const largeFiles = [
    'sentia-netlify-deployment.tar.gz',
    'node_modules/.cache',
    'dist/assets',
    'dist/js',
    'logs',
    'test-results',
    'playwright-report',
    'coverage'
  ];
  
  largeFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`🗑️  Removing ${file}...`);
      cleanDirectory(fullPath);
    }
  });
}

// Optimize package.json for deployment
function optimizePackageJson() {
  console.log('📝 Optimizing package.json for deployment...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Remove dev scripts that aren't needed in production
  const productionScripts = {
    'start': packageJson.scripts.start,
    'build': packageJson.scripts.build,
    'render:build': packageJson.scripts['render:build']
  };
  
  // Keep only essential scripts
  packageJson.scripts = productionScripts;
  
  // Remove devDependencies that aren't needed in production
  delete packageJson.devDependencies;
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Package.json optimized for deployment');
}

// Create optimized build
function createOptimizedBuild() {
  console.log('🔨 Creating optimized build...');
  
  try {
    // Clean dist directory
    cleanDirectory('dist');
    
    // Run build
    console.log('📦 Running build process...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Verify build
    if (fs.existsSync('dist/index.html')) {
      console.log('✅ Build created successfully');
    } else {
      throw new Error('Build failed - no index.html found');
    }
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Main optimization process
async function optimize() {
  try {
    console.log('🎯 Deployment optimization started...');
    
    // Step 1: Remove large files
    removeLargeFiles();
    
    // Step 2: Clean node_modules cache
    console.log('🧹 Cleaning npm cache...');
    try {
      execSync('npm cache clean --force', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  Could not clean npm cache:', error.message);
    }
    
    // Step 3: Create optimized build
    createOptimizedBuild();
    
    // Step 4: Verify deployment readiness
    console.log('🔍 Verifying deployment readiness...');
    
    const requiredFiles = [
      'package.json',
      'server.js',
      'dist/index.html',
      'prisma/schema.prisma'
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
      console.error('❌ Missing required files:', missingFiles);
      process.exit(1);
    }
    
    console.log('✅ All required files present');
    
    // Step 5: Show deployment summary
    console.log('\n📊 Deployment Summary:');
    console.log('====================');
    console.log(`📁 Project size: ${getDirectorySize(process.cwd())} MB`);
    console.log(`📦 Dependencies: ${Object.keys(JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies || {}).length}`);
    console.log(`🔧 Build artifacts: ${fs.existsSync('dist') ? 'Present' : 'Missing'}`);
    console.log(`🗄️  Database schema: ${fs.existsSync('prisma/schema.prisma') ? 'Present' : 'Missing'}`);
    
    console.log('\n🎉 Deployment optimization complete!');
    console.log('Ready for deployment to Render/Railway/Netlify');
    
  } catch (error) {
    console.error('❌ Optimization failed:', error.message);
    process.exit(1);
  }
}

// Helper function to get directory size
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(itemPath);
      files.forEach(file => {
        calculateSize(path.join(itemPath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }
  
  try {
    calculateSize(dirPath);
    return (totalSize / (1024 * 1024)).toFixed(2);
  } catch (error) {
    return 'Unknown';
  }
}

// Run optimization
optimize();
