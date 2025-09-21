import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// Temporarily disable visualizer to fix build
// import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh optimizations
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic'
    }),
    // Bundle analyzer disabled to fix build
    // process.env.ANALYZE && visualizer({
    //   filename: 'dist/stats.html',
    //   open: true,
    //   gzipSize: true,
    //   brotliSize: true
    // })
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
    assetsDir: 'js',
    emptyOutDir: true,
    sourcemap: false, // Disable sourcemaps to prevent module issues
    minify: 'terser', // Use terser for better minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    target: 'es2020',
    chunkSizeWarningLimit: 500, // Lower warning limit
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    // CRITICAL FIX: Ensure proper module format
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    },
    rollupOptions: {
      output: {
        // Enhanced manual chunking to reduce bundle sizes
        manualChunks: (id) => {
          // CRITICAL: Bundle React and state management together to prevent loading order issues
          if (id.includes('react') && !id.includes('react-router') && !id.includes('@')) {
            return 'react-core'
          }
          // State management MUST be bundled with React to avoid createContext errors
          if (id.includes('zustand') || id.includes('@tanstack/react-query')) {
            return 'react-core'  // Bundle with React core to ensure proper loading order
          }
          // Router
          if (id.includes('react-router')) {
            return 'router'
          }
          // Authentication
          if (id.includes('@clerk')) {
            return 'auth'
          }
          // UI Components and Icons
          if (id.includes('@heroicons') || id.includes('@headlessui')) {
            return 'ui-components'
          }
          // Charts
          if (id.includes('recharts') || id.includes('d3')) {
            return 'charts'
          }
          // Three.js (large 3D library)
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three-3d'
          }
          // Animation
          if (id.includes('framer-motion')) {
            return 'animation'
          }
          // Data processing
          if (id.includes('axios') || id.includes('date-fns')) {
            return 'data-utils'
          }
          // Forms
          if (id.includes('react-hook-form') || id.includes('zod')) {
            return 'forms'
          }
          // Small utilities
          if (id.includes('node_modules')) {
            const module = id.split('node_modules/')[1]
            if (module) {
              const packageName = module.split('/')[0]
              // Group small packages
              const smallPackages = ['classnames', 'clsx', 'uuid', 'nanoid']
              if (smallPackages.some(pkg => packageName.includes(pkg))) {
                return 'vendor-utils'
              }
            }
            // Default vendor chunk
            return 'vendor'
          }
        },
        // Optimized asset naming
        chunkFileNames: 'js/[name]-[hash:8].js',
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name.split('.').pop()
          if (/css/i.test(ext)) {
            return 'css/[name]-[hash:8][extname]'
          }
          if (/png|jpe?g|svg|gif/i.test(ext)) {
            return 'img/[name]-[hash:8][extname]'
          }
          return 'assets/[name]-[hash:8][extname]'
        },
        entryFileNames: 'js/[name]-[hash:8].js',
        // Merge small chunks
        experimentalMinChunkSize: 10000
      },
      // Enhanced tree-shaking
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: 'no-external'
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@clerk/clerk-react',
      'zustand',
      '@tanstack/react-query'
    ],
    force: true,
    esbuildOptions: {
      format: 'esm',
      target: 'es2020'
    }
  },
  define: {
    'global': 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  esbuild: {
    target: 'es2020'
  }
})