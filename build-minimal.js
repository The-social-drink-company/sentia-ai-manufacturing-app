#!/usr/bin/env node

/**
 * Minimal Build Script - Stage 1 Only
 * Builds only the essential core components
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== MINIMAL BUILD SCRIPT ===');
console.log('Building Stage 1: Core Infrastructure Only');

// First, update main.jsx to use the minimal stage 1 app
const mainPath = path.join(__dirname, 'src', 'main.jsx');
const mainContent = `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App-stage1.jsx'

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}`;

fs.writeFileSync(mainPath, mainContent);
console.log('Updated main.jsx for Stage 1');

// Create a minimal vite config for stage 1
const viteConfigContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    reportCompressedSize: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@tanstack/react-query', '@clerk/clerk-react'],
        }
      },
      maxParallelFileOps: 2,
      treeshake: {
        preset: 'smallest'
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  }
})`;

// Backup existing vite config
if (fs.existsSync('vite.config.js')) {
  fs.renameSync('vite.config.js', 'vite.config.backup.js');
}

// Write minimal config
fs.writeFileSync('vite.config.js', viteConfigContent);
console.log('Created minimal vite config');

try {
  // Run build with controlled memory
  console.log('Starting minimal build...');
  execSync('npx vite build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=3072'
    }
  });

  console.log('Build completed successfully!');

  // Restore original vite config
  if (fs.existsSync('vite.config.backup.js')) {
    fs.unlinkSync('vite.config.js');
    fs.renameSync('vite.config.backup.js', 'vite.config.js');
  }

} catch (error) {
  console.error('Build failed:', error.message);

  // Restore on failure
  if (fs.existsSync('vite.config.backup.js')) {
    if (fs.existsSync('vite.config.js')) {
      fs.unlinkSync('vite.config.js');
    }
    fs.renameSync('vite.config.backup.js', 'vite.config.js');
  }

  process.exit(1);
}