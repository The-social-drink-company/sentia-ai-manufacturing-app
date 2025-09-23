#!/usr/bin/env node

/**
 * Staged Build Script for Render
 * Builds application in memory-efficient stages
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STAGE = process.env.DEPLOYMENT_STAGE || '1';

console.log('=== STAGED BUILD SCRIPT ===');
console.log('Stage:', STAGE);
console.log('Memory Limit: 4096MB');

// Update main.jsx based on stage
function updateMainForStage(stage) {
  const mainPath = path.join(__dirname, 'src', 'main.jsx');
  let appImport = './App-comprehensive.jsx';

  switch(stage) {
    case '1':
      appImport = './App-stage1.jsx';
      console.log('Building Stage 1: Core Infrastructure');
      break;
    case '2':
      appImport = './App-stage2.jsx';
      console.log('Building Stage 2: Essential Features');
      break;
    case '3':
      appImport = './App-stage3.jsx';
      console.log('Building Stage 3: Analytics & AI');
      break;
    default:
      appImport = './App-comprehensive.jsx';
      console.log('Building Full Enterprise Application');
  }

  const mainContent = fs.readFileSync(mainPath, 'utf8');
  const updated = mainContent.replace(
    /import App from ['"]\.\/App[^'"]*['"]/,
    `import App from '${appImport}'`
  );

  fs.writeFileSync(mainPath, updated);
  console.log('Updated main.jsx to use:', appImport);
}

try {
  // Update main.jsx for the appropriate stage
  updateMainForStage(STAGE);

  // Run the build with high memory limit
  console.log('Starting Vite build...');
  execSync('npm run build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  });

  console.log('Build completed successfully!');

  // Create stage marker
  const stageInfo = {
    stage: STAGE,
    builtAt: new Date().toISOString(),
    success: true
  };
  fs.writeFileSync('dist/stage.json', JSON.stringify(stageInfo, null, 2));

} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}