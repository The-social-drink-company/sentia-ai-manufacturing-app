/**
 * Minimal Build Script for Ultra-Low Memory Environments
 * Builds only the absolute essential components
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEPLOYMENT_STAGE = process.env.DEPLOYMENT_STAGE || '1';

console.log('=== MINIMAL BUILD SCRIPT ===');
console.log(`Building Stage ${DEPLOYMENT_STAGE} for optimized memory usage`);

// Determine which App file to use based on stage
const stageApps = {
  '1': './App-stage1.jsx',
  '2': './App-stage2.jsx',
  '3': './App-stage3.jsx',
  '4': './App-comprehensive.jsx'
};

const appFile = stageApps[DEPLOYMENT_STAGE] || stageApps['1'];

// Update main.jsx to use the appropriate stage App
const mainJsxPath = path.join(__dirname, 'src', 'main.jsx');
let mainContent = fs.readFileSync(mainJsxPath, 'utf8');

// Replace any App import with the selected stage
mainContent = mainContent.replace(
  /import App from ['"]\.\/App.*?['"]/,
  `import App from '${appFile}'`
);

fs.writeFileSync(mainJsxPath, mainContent);
console.log(`Updated main.jsx to use ${appFile}`);

// Run build with optimized settings
try {
  console.log('Starting minimal Vite build...');

  // Set environment for minimal build
  process.env.VITE_MINIMAL_BUILD = 'true';

  execSync('npm run build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: `--max-old-space-size=${process.env.NODE_OPTIONS?.includes('max-old-space-size')
        ? process.env.NODE_OPTIONS.match(/max-old-space-size=(\d+)/)[1]
        : '4096'}`
    }
  });

  console.log('Minimal build completed successfully!');

  // Create build marker
  const markerPath = path.join(__dirname, 'dist', '.build-minimal');
  fs.writeFileSync(markerPath, new Date().toISOString());
  console.log('Build marked as minimal');

} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}