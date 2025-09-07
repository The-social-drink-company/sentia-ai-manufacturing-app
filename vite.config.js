import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
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
    port: process.env.PORT || 3002,
    host: true, // Needed for Docker
    strictPort: false, // Allow dynamic port selection
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
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
        // Optimize chunk splitting for better caching
        manualChunks: {
          // Core dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Data fetching
          query: ['@tanstack/react-query'],
          // Authentication - Clerk
          auth: ['@clerk/clerk-react'],
          // Charts and visualization
          charts: ['recharts'],
          // Utilities
          utils: ['date-fns', 'clsx'],
          // Icons
          icons: ['@heroicons/react']
        }
      },
      // Aggressive tree-shaking
      treeshake: {
        preset: 'recommended',
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
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
    exclude: ['@testing-library/react']
  },
  define: {
    // Enable React Query devtools only in development
    __DEV__: process.env.NODE_ENV === 'development'
  }
})