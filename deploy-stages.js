#!/usr/bin/env node

/**
 * Multi-Stage Deployment Script for Render
 * Deploys the application in stages to reduce memory pressure
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DEPLOYMENT_STAGE = process.env.DEPLOYMENT_STAGE || '1'
const BUILD_MODE = process.env.BUILD_MODE || 'production'

console.log(`
========================================
MULTI-STAGE DEPLOYMENT SCRIPT
========================================
Stage: ${DEPLOYMENT_STAGE}
Mode: ${BUILD_MODE}
========================================
`)

// Configuration for each stage
const stages = {
  1: {
    name: 'Core Infrastructure',
    appFile: 'App-stage1.jsx',
    excludeComponents: [
      'AI',
      'Executive',
      'WorkingCapital',
      'analytics',
      'admin',
      'quality',
      'inventory',
      'mobile',
      'automation',
    ],
    memoryLimit: 2048,
    description: 'Basic dashboard with authentication',
  },
  2: {
    name: 'Essential Business Features',
    appFile: 'App-stage2.jsx',
    excludeComponents: ['AI', 'Executive', 'admin', 'mobile', 'automation'],
    memoryLimit: 3072,
    description: 'Core + Working Capital + What-If Analysis',
  },
  3: {
    name: 'Analytics & AI',
    appFile: 'App-stage3.jsx',
    excludeComponents: ['Executive', 'mobile', 'automation'],
    memoryLimit: 4096,
    description: 'Core + Business + AI Analytics',
  },
  4: {
    name: 'Full Enterprise',
    appFile: 'App-comprehensive.jsx',
    excludeComponents: [],
    memoryLimit: 4096,
    description: 'Complete enterprise application',
  },
}

const currentStage = stages[DEPLOYMENT_STAGE]

if (!currentStage) {
  console.error(`Invalid deployment stage: ${DEPLOYMENT_STAGE}`)
  process.exit(1)
}

console.log(`Deploying Stage ${DEPLOYMENT_STAGE}: ${currentStage.name}`)
console.log(`Description: ${currentStage.description}`)
console.log(`Memory Limit: ${currentStage.memoryLimit}MB`)

// Step 1: Update main.jsx to use the appropriate stage
function updateMainEntry() {
  console.log('\nStep 1: Updating main.jsx entry point...')

  const mainPath = path.join(__dirname, 'src', 'main.jsx')
  const mainContent = fs.readFileSync(mainPath, 'utf8')

  // Replace the import statement
  const updatedContent = mainContent.replace(
    /import App from ['"]\.\/App-[^'"]+['"]/,
    `import App from './${currentStage.appFile}'`
  )

  fs.writeFileSync(mainPath, updatedContent)
  console.log(`✓ Updated main.jsx to use ${currentStage.appFile}`)
}

// Step 2: Create temporary vite config with stage-specific optimizations
function createStageViteConfig() {
  console.log('\nStep 2: Creating stage-specific vite.config...')

  const excludePattern =
    currentStage.excludeComponents.length > 0
      ? currentStage.excludeComponents.map(comp => `'src/components/${comp}'`).join(', ')
      : ''

  const viteConfig = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // Stage ${DEPLOYMENT_STAGE} optimized chunking
          if (id.includes('node_modules')) {
            if (id.includes('@clerk')) return 'clerk';
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react')) return 'react';
            if (id.includes('@tanstack')) return 'tanstack';
            return 'vendor';
          }
          ${DEPLOYMENT_STAGE >= 2 ? "if (id.includes('WorkingCapital')) return 'working-capital';" : ''}
          ${DEPLOYMENT_STAGE >= 3 ? "if (id.includes('AI')) return 'ai';" : ''}
        }
      },
      ${excludePattern ? `external: [${excludePattern}],` : ''}
      maxParallelFileOps: ${DEPLOYMENT_STAGE <= 2 ? 2 : 3},
      treeshake: {
        preset: 'smallest',
        moduleSideEffects: false
      }
    },

    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: false,
    cssCodeSplit: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
`

  fs.writeFileSync('vite.config.stage.js', viteConfig)
  console.log('✓ Created stage-specific vite config')
}

// Step 3: Run the build with stage-specific memory limit
function runStageBuild() {
  console.log(`\nStep 3: Running build with ${currentStage.memoryLimit}MB memory limit...`)

  try {
    // Backup original vite.config.js
    if (fs.existsSync('vite.config.js')) {
      fs.renameSync('vite.config.js', 'vite.config.backup.js')
    }

    // Use stage config
    fs.renameSync('vite.config.stage.js', 'vite.config.js')

    // Run build
    const buildCommand = `NODE_OPTIONS='--max-old-space-size=${currentStage.memoryLimit}' npm run build`
    console.log(`Executing: ${buildCommand}`)

    execSync(buildCommand, {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        DEPLOYMENT_STAGE: DEPLOYMENT_STAGE,
      },
    })

    console.log('✓ Build completed successfully')

    // Restore original config
    if (fs.existsSync('vite.config.backup.js')) {
      fs.unlinkSync('vite.config.js')
      fs.renameSync('vite.config.backup.js', 'vite.config.js')
    }
  } catch (error) {
    console.error('✗ Build failed:', error.message)

    // Restore original config on failure
    if (fs.existsSync('vite.config.backup.js')) {
      if (fs.existsSync('vite.config.js')) {
        fs.unlinkSync('vite.config.js')
      }
      fs.renameSync('vite.config.backup.js', 'vite.config.js')
    }

    process.exit(1)
  }
}

// Step 4: Create stage marker file
function createStageMarker() {
  console.log('\nStep 4: Creating stage marker...')

  const marker = {
    stage: DEPLOYMENT_STAGE,
    name: currentStage.name,
    timestamp: new Date().toISOString(),
    nextStage:
      parseInt(DEPLOYMENT_STAGE) < 4 ? (parseInt(DEPLOYMENT_STAGE) + 1).toString() : 'complete',
  }

  fs.writeFileSync('dist/deployment-stage.json', JSON.stringify(marker, null, 2))
  console.log('✓ Stage marker created')
}

// Execute deployment steps
async function deploy() {
  try {
    updateMainEntry()
    createStageViteConfig()
    runStageBuild()
    createStageMarker()

    console.log(`
========================================
STAGE ${DEPLOYMENT_STAGE} DEPLOYMENT COMPLETE
========================================
${currentStage.name} has been built successfully.

${
  parseInt(DEPLOYMENT_STAGE) < 4
    ? `Next stage: Stage ${parseInt(DEPLOYMENT_STAGE) + 1} - ${stages[(parseInt(DEPLOYMENT_STAGE) + 1).toString()].name}
To deploy next stage, run:
DEPLOYMENT_STAGE=${parseInt(DEPLOYMENT_STAGE) + 1} node deploy-stages.js`
    : 'All stages complete! Full enterprise application deployed.'
}
========================================
`)
  } catch (error) {
    console.error('Deployment failed:', error)
    process.exit(1)
  }
}

// Run deployment
deploy()
