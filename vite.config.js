import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      jsxRuntime: 'automatic'
    })
  ],
  base: '/',
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
    host: true,
    strictPort: false,
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
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // Use function-based chunking to avoid module resolution issues
        manualChunks: (id) => {
          // Core React
          if (id.includes('react') && !id.includes('react-router')) {
            return 'react-core'
          }
          // Router
          if (id.includes('react-router')) {
            return 'router'
          }
          // Authentication
          if (id.includes('@clerk')) {
            return 'auth'
          }
          // Charts - isolate to prevent initialization errors
          if (id.includes('recharts') || id.includes('d3')) {
            return 'charts'
          }
          // UI Components
          if (id.includes('@heroicons') || id.includes('@headlessui')) {
            return 'ui-components'
          }
          // Animation
          if (id.includes('framer-motion')) {
            return 'animation'
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
              const smallPackages = ['classnames', 'clsx', 'uuid', 'nanoid']
              if (smallPackages.some(pkg => packageName.includes(pkg))) {
                return 'vendor-utils'
              }
            }
            return 'vendor'
          }
        },
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
        entryFileNames: 'js/[name]-[hash:8].js'
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@clerk/clerk-react'
    ],
    force: true
  },
  define: {
    'global': 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  esbuild: {
    target: 'es2020'
  }
})
