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
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-core'
          }
          // Router and navigation
          if (id.includes('react-router') || id.includes('react-router-dom')) {
            return 'router'
          }
          // Authentication
          if (id.includes('@clerk') || id.includes('clerk')) {
            return 'auth'
          }
          // Data management
          if (id.includes('@tanstack/react-query') || id.includes('zustand')) {
            return 'data-management'
          }
          // Charts and visualization
          if (id.includes('recharts') || id.includes('chart.js') || id.includes('react-chartjs-2')) {
            return 'charts'
          }
          // UI components
          if (id.includes('@radix-ui') || id.includes('@headlessui')) {
            return 'ui-components'
          }
          // Icons
          if (id.includes('@heroicons') || id.includes('lucide-react')) {
            return 'icons'
          }
          // 3D and animations
          if (id.includes('three') || id.includes('@react-three') || id.includes('framer-motion')) {
            return 'graphics'
          }
          // AI and ML libraries
          if (id.includes('openai') || id.includes('ml-')) {
            return 'ai-ml'
          }
          // Large external APIs
          if (id.includes('amazon-sp-api') || id.includes('shopify') || id.includes('xero')) {
            return 'external-apis'
          }
          // Utilities
          if (id.includes('lodash') || id.includes('date-fns') || id.includes('clsx')) {
            return 'utilities'
          }
          // Node modules (vendor)
          if (id.includes('node_modules')) {
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