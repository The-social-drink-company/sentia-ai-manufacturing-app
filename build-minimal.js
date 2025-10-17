/**
 * Minimal Build Script for Enterprise Entry Point
 * Uses the canonical App-enterprise.jsx entry to keep builds consistent.
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MAX_MEMORY = process.env.NODE_OPTIONS?.includes('max-old-space-size')
  ? process.env.NODE_OPTIONS.match(/max-old-space-size=(\d+)/)[1]
  : '4096'

console.log('=== MINIMAL BUILD (Canonical) ===')
console.log('Memory Limit:', `${MAX_MEMORY}MB`)

const mainJsxPath = path.join(__dirname, 'src', 'main.jsx')
const canonicalImport = 'import App from "./App-enterprise.jsx"'
const importPattern = /import App from ['\"].+?['\"]/

let mainContent = fs.readFileSync(mainJsxPath, 'utf8')

if (!mainContent.includes(canonicalImport)) {
  const nextContent = mainContent.replace(importPattern, canonicalImport)
  if (nextContent !== mainContent) {
    fs.writeFileSync(mainJsxPath, nextContent)
    console.log('Updated main.jsx to use App-enterprise.jsx')
  } else {
    console.warn('Unable to confirm App import statement; please verify main.jsx manually.')
  }
} else {
  console.log('Main entry already points at App-enterprise.jsx')
}

try {
  console.log('Starting minimal Vite build...')
  execSync('pnpm run build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: `--max-old-space-size=${MAX_MEMORY}`,
    },
  })
  console.log('Minimal build completed successfully!')

  const markerPath = path.join(__dirname, 'dist', '.build-minimal')
  fs.writeFileSync(markerPath, new Date().toISOString())
  console.log('Build marked as minimal')
} catch (error) {
  console.error('Build failed:', error.message)
  process.exit(1)
}
