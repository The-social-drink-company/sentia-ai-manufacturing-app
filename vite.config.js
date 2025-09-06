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
    port: 5173,
    host: true, // Needed for Docker
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
    sourcemap: true, // Enable for debugging production issues
    minify: 'terser', // Better minification
    terserOptions: {
      compress: {
        drop_debugger: true,
        // Keep console.log for production debugging
        pure_funcs: ['console.debug', 'console.trace']
      }
    },
    target: 'es2020',
    chunkSizeWarningLimit: 1000, // Reduced for better bundle analysis
    cssCodeSplit: true,
    assetsInlineLimit: 8192, // Increased for better performance
    rollupOptions: {
      output: {
        manualChunks: undefined // Prevent chunking issues for debugging
      },
      // Tree-shake unused code
      treeshake: {
        preset: 'recommended',
        propertyReadSideEffects: false
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