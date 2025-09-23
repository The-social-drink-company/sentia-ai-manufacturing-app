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

console.log('=== MINIMAL BUILD SCRIPT ===');
console.log('Building absolute minimal version for low memory environment');

// Update main.jsx to use minimal App
const mainJsxPath = path.join(__dirname, 'src', 'main.jsx');
let mainContent = fs.readFileSync(mainJsxPath, 'utf8');

// Replace any App import with stage 1
mainContent = mainContent.replace(
  /import App from ['"]\.\/App.*?['"]/,
  `import App from './App-stage1.jsx'`
);

fs.writeFileSync(mainJsxPath, mainContent);
console.log('Updated main.jsx to use minimal App-stage1.jsx');

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