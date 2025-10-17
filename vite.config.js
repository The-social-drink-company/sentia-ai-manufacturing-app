import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
// Remove @tailwindcss/vite - using standard postcss setup instead
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sanitizePackageName = id => {
  const normalizedId = id.replace(/\\/g, '/')
  const segments = normalizedId.split('/node_modules/').filter(Boolean)

  if (segments.length === 0) {
    return null
  }

  const packagePath = segments[segments.length - 1]
  const pathParts = packagePath.split('/')

  if (!pathParts[0]) {
    return null
  }

  if (pathParts[0].startsWith('@') && pathParts.length > 1) {
    return `${pathParts[0]}/${pathParts[1]}`
  }

  return pathParts[0]
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDevelopmentMode = process.env.VITE_DEVELOPMENT_MODE === 'true'

  return {
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        mode === 'production' || command === 'build' ? 'production' : 'development'
      ),
      __DEV__: mode !== 'production' && command !== 'build',
      'process.env.VITE_DEVELOPMENT_MODE': JSON.stringify(
        process.env.VITE_DEVELOPMENT_MODE || 'false'
      ),
    },
    root: '.', // Explicitly set root to current directory
    plugins: [
      react({
        jsxRuntime: 'automatic',
        jsxImportSource: 'react',
        babel: {
          plugins: [
            [
              '@babel/plugin-transform-react-jsx',
              {
                runtime: 'automatic',
                development: false,
                importSource: 'react',
              },
            ],
          ],
        },
      }),
      // tailwindcss handled via postcss.config.js
      visualizer({
        filename: 'dist/stats.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist', // Explicitly set output directory
      emptyOutDir: true,
      rollupOptions: {
        // Exclude Clerk from development builds entirely
        external: isDevelopmentMode ? ['@clerk/clerk-react'] : [],
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return
            }

            const packageName = sanitizePackageName(id)
            if (!packageName) {
              return
            }

            // Don't create clerk chunk in development mode since it's excluded
            if (packageName.startsWith('@clerk') && !isDevelopmentMode) {
              return 'clerk'
            }

            if (packageName.startsWith('@clerk')) {
              return 'clerk'
            }

            if (
              packageName.startsWith('recharts') ||
              packageName.startsWith('framer-motion') ||
              packageName.startsWith('embla-carousel')
            ) {
              return 'charts'
            }

            if (packageName.startsWith('@tanstack')) {
              return 'data-layer'
            }

            if (packageName.startsWith('@radix-ui')) {
              return 'radix'
            }

            if (packageName.includes('react-router')) {
              return 'router'
            }

            if (
              packageName.startsWith('@azure') ||
              packageName.startsWith('@microsoft') ||
              packageName === 'amazon-sp-api' ||
              packageName === '@shopify/shopify-api' ||
              packageName === 'xero-node' ||
              packageName === 'aws-sdk' ||
              packageName === 'openai'
            ) {
              return 'integrations'
            }

            if (
              packageName.startsWith('@heroicons') ||
              packageName === '@headlessui/react' ||
              packageName === 'lucide-react'
            ) {
              return 'icons'
            }

            if (packageName === 'zustand') {
              return 'state'
            }

            if (packageName === 'axios') {
              return 'http'
            }

            if (packageName.startsWith('socket.io')) {
              return 'realtime'
            }

            const sanitized = packageName.replace('@', '').replace(/[\/]/g, '-')
            return `pkg-${sanitized}`
          },
        },
      },
    },
  }
})
