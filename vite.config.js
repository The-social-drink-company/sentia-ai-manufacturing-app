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
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
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
        // Simplified chunking strategy to avoid initialization errors
        manualChunks: {
          // Core React bundle - keep together to avoid loading order issues
          'react-core': [
            'react',
            'react-dom',
            'react/jsx-runtime'
          ],
          // Router
          'router': [
            'react-router-dom'
          ],
          // Authentication
          'auth': [
            '@clerk/clerk-react'
          ],
          // Charts - separate to isolate potential issues
          'charts': [
            'recharts'
          ],
          // UI Components
          'ui-components': [
            '@heroicons/react',
            '@headlessui/react'
          ],
          // Animation
          'animation': [
            'framer-motion'
          ],
          // Forms
          'forms': [
            'react-hook-form',
            'zod'
          ],
          // Utilities
          'vendor-utils': [
            'classnames',
            'clsx',
            'uuid'
          ]
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
      },
      treeshake: {
        preset: 'recommended'
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
    force: true,
    esbuildOptions: {
      target: 'es2020'
    }
  },
  define: {
    'global': 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  esbuild: {
    target: 'es2020',
    format: 'esm'
  }
})
