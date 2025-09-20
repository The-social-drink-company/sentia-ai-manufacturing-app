import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Production-safe Vite configuration
// No optional dependencies that might fail in production

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
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@heroicons/react', 'recharts', 'lucide-react'],
          'state-vendor': ['zustand', '@tanstack/react-query']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@clerk/clerk-react',
      'zustand',
      '@tanstack/react-query'
    ]
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
})