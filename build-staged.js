/**
 * Staged Build Script (Deprecated)
 * Maintains compatibility by ensuring the canonical App-enterprise.jsx entry is used.
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const stage = process.env.DEPLOYMENT_STAGE || 'enterprise'
const MAX_MEMORY = process.env.NODE_OPTIONS?.includes('max-old-space-size')
  ? process.env.NODE_OPTIONS.match(/max-old-space-size=(\d+)/)[1]
  : '4096'

console.log('=== STAGED BUILD (Canonical) ===')
console.log('Requested stage:', stage)
console.log('Memory Limit:', `${MAX_MEMORY}MB`)
console.log('Multi-stage entrypoints have been consolidated into App-enterprise.jsx')

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
  console.log('Starting Vite build...')
  execSync('pnpm run build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: `--max-old-space-size=${MAX_MEMORY}`,
    },
  })
  console.log('Build completed successfully!')
} catch (error) {
  console.error('Build failed:', error.message)
  process.exit(1)
}
