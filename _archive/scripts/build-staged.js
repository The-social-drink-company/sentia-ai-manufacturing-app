/**
 * Staged Build Script for Memory-Efficient Deployment
 * Builds the application in stages to avoid memory exhaustion
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEPLOYMENT_STAGE = process.env.DEPLOYMENT_STAGE || '1';
const MAX_MEMORY = process.env.NODE_OPTIONS?.includes('max-old-space-size')
  ? process.env.NODE_OPTIONS.match(/max-old-space-size=(\d+)/)[1]
  : '4096';

console.log('=== STAGED BUILD SCRIPT ===');
console.log('Stage:', DEPLOYMENT_STAGE);
console.log('Memory Limit:', MAX_MEMORY + 'MB');

// Define stages with their corresponding App files
const stages = {
  '1': {
    name: 'Core Infrastructure',
    appFile: './App-stage1.jsx',
    description: 'Building basic application shell with auth and routing'
  },
  '2': {
    name: 'Dashboard & Analytics',
    appFile: './App-stage2.jsx',
    description: 'Adding dashboard and analytics components'
  },
  '3': {
    name: 'Manufacturing Features',
    appFile: './App-stage3.jsx',
    description: 'Adding production, quality, and inventory features'
  },
  '4': {
    name: 'Full Enterprise',
    appFile: './App-comprehensive.jsx',
    description: 'Complete enterprise application with all features'
  }
};

const currentStage = stages[DEPLOYMENT_STAGE] || stages['1'];

console.log(`Building Stage ${DEPLOYMENT_STAGE}: ${currentStage.name}`);
console.log(currentStage.description);

// Update main.jsx to import the correct App file
const mainJsxPath = path.join(__dirname, 'src', 'main.jsx');
let mainContent = fs.readFileSync(mainJsxPath, 'utf8');

// Replace any App import with the staged version
mainContent = mainContent.replace(
  /import App from ['"]\.\/App.*?['"]/,
  `import App from '${currentStage.appFile}'`
);

fs.writeFileSync(mainJsxPath, mainContent);
console.log(`Updated main.jsx to use: ${currentStage.appFile}`);

// Run the actual build
try {
  console.log('Starting Vite build...');
  execSync('npm run build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: `--max-old-space-size=${MAX_MEMORY}`
    }
  });
  console.log(`Stage ${DEPLOYMENT_STAGE} build completed successfully!`);
} catch (error) {
  console.error(`Build failed:`, error.message);
  process.exit(1);
}

// If this is not the final stage, create a marker file
if (DEPLOYMENT_STAGE !== '4') {
  const stageMarkerPath = path.join(__dirname, 'dist', '.build-stage');
  fs.writeFileSync(stageMarkerPath, DEPLOYMENT_STAGE);
  console.log(`Marked build as stage ${DEPLOYMENT_STAGE}`);
}