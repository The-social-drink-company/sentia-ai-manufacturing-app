import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh optimizations
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic'
    }),
    // Bundle analyzer for optimization insights
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  // Critical: Set base path for Railway deployment
  base: '/', // Use absolute paths for proper routing
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/config': path.resolve(__dirname, './src/config')
    }
  },
  server: {
    port: 3001,
    host: true, // Allow external connections
    strictPort: false, // Allow fallback to next available port
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development', // Only in development
    minify: 'terser', // Better minification
    terserOptions: {
      compress: {
        drop_debugger: true,
        drop_console: process.env.NODE_ENV === 'production', // Remove console logs in production
        pure_funcs: ['console.debug', 'console.trace', 'console.info']
      }
    },
    target: 'es2020',
    chunkSizeWarningLimit: 500, // More aggressive bundle size monitoring
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Optimize for smaller inline assets
    rollupOptions: {
      output: {
        // Advanced chunk splitting for optimal caching
        manualChunks: (id) => {
          // Core React libraries - split into smaller chunks
          if (id.includes('react-dom')) {
            return 'react-dom'
          }
          if (id.includes('react') && !id.includes('react-dom')) {
            return 'react'
          }
          // Router and navigation
          if (id.includes('react-router') || id.includes('react-router-dom')) {
            return 'router'
          }
          // Authentication
          if (id.includes('@clerk') || id.includes('clerk')) {
            return 'auth'
          }
          // Data management - split query and state
          if (id.includes('@tanstack/react-query')) {
            return 'react-query'
          }
          if (id.includes('zustand')) {
            return 'zustand'
          }
          // Charts and visualization - split by library
          if (id.includes('recharts/es6')) {
            return 'recharts-core'
          }
          if (id.includes('recharts')) {
            return 'recharts'
          }
          if (id.includes('chart.js')) {
            return 'chartjs'
          }
          if (id.includes('react-chartjs-2')) {
            return 'react-chartjs'
          }
          // UI components - split by library
          if (id.includes('@radix-ui/react-dialog')) {
            return 'radix-dialog'
          }
          if (id.includes('@radix-ui/react-dropdown-menu')) {
            return 'radix-dropdown'
          }
          if (id.includes('@radix-ui')) {
            return 'radix-ui'
          }
          if (id.includes('@headlessui')) {
            return 'headless-ui'
          }
          // Icons - split by library
          if (id.includes('@heroicons/react/24/outline')) {
            return 'heroicons-outline'
          }
          if (id.includes('@heroicons/react/24/solid')) {
            return 'heroicons-solid'
          }
          if (id.includes('@heroicons')) {
            return 'heroicons'
          }
          if (id.includes('lucide-react')) {
            return 'lucide'
          }
          // 3D and animations
          if (id.includes('three')) {
            return 'three'
          }
          if (id.includes('@react-three')) {
            return 'react-three'
          }
          if (id.includes('framer-motion')) {
            return 'framer-motion'
          }
          // Grid layout - separate library
          if (id.includes('react-grid-layout')) {
            return 'grid-layout'
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-fns'
          }
          // Utilities
          if (id.includes('lodash')) {
            return 'lodash'
          }
          if (id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'styling-utils'
          }
          // Form libraries
          if (id.includes('react-hook-form')) {
            return 'react-hook-form'
          }
          // PDF libraries
          if (id.includes('pdfjs')) {
            return 'pdfjs'
          }
          // Large libraries that should be separate
          if (id.includes('axios')) {
            return 'axios'
          }
          if (id.includes('d3')) {
            return 'd3'
          }
          // Polyfills
          if (id.includes('core-js') || id.includes('regenerator')) {
            return 'polyfills'
          }
          // Split remaining vendor code by size
          if (id.includes('node_modules')) {
            // Get package name from path
            const packageMatch = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/)
            if (packageMatch) {
              const packageName = packageMatch[1]
              // Group small packages together, separate large ones
              const largePackages = ['@mui', '@emotion', '@babel', 'typescript', '@types']
              if (largePackages.some(pkg => packageName.includes(pkg))) {
                return `vendor-${packageName.replace(/[@/]/g, '-')}`
              }
            }
            return 'vendor'
          }
        },
        // Optimize asset naming for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            return 'js/[name]-[hash].js'
          }
          return 'js/chunk-[hash].js'
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'js/[name]-[hash].js'
      },
      // Aggressive tree-shaking
      treeshake: {
        preset: 'recommended',
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
        // Remove unused imports
        moduleSideEffects: (id) => {
          return !id.includes('unused')
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'recharts',
      'date-fns'
    ],
    exclude: ['@testing-library/react'],
    force: true // Force rebuild of dependencies - replaces --force flag
  },
  define: {
    // Enable React Query devtools only in development
    __DEV__: process.env.NODE_ENV === 'development'
  }
})