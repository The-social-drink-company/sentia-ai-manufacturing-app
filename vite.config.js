import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split vendor chunks more aggressively to reduce memory usage
            if (id.includes('@clerk')) return 'clerk';
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react')) return 'react';
            if (id.includes('@tanstack')) return 'tanstack';
            if (id.includes('@heroicons')) return 'heroicons';
            if (id.includes('lucide-react')) return 'lucide';
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('d3')) return 'd3';
            if (id.includes('framer-motion')) return 'framer';
            if (id.includes('date-fns')) return 'date-fns';
            if (id.includes('axios')) return 'axios';
            if (id.includes('zustand')) return 'zustand';
            return 'vendor';
          }
          // Split app code into logical chunks
          if (id.includes('src/components/ai')) return 'ai-components';
          if (id.includes('src/components/WorkingCapital')) return 'working-capital';
          if (id.includes('src/components/analytics')) return 'analytics';
          if (id.includes('src/components/admin')) return 'admin';
          if (id.includes('src/pages')) return 'pages';
        }
      },
      // Increase max parallel file operations
      maxParallelFileOps: 10
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      // Reduce memory usage during minification
      maxWorkers: 2
    },
    sourcemap: false
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

