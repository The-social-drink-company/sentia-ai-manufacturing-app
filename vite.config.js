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
    chunkSizeWarningLimit: 2000,
    // Memory optimizations for large builds
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // More aggressive splitting to reduce memory usage
            if (id.includes('@clerk')) return 'clerk';
            if (id.includes('react-dom') || id.includes('react')) return 'react';
            if (id.includes('react-router')) return 'react-router';
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
            if (id.includes('socket.io')) return 'socketio';
            return 'vendor';
          }
          // More aggressive app code splitting
          if (id.includes('src/components/AI')) return 'ai-components';
          if (id.includes('src/components/Executive')) return 'executive';
          if (id.includes('src/components/WorkingCapital')) return 'working-capital';
          if (id.includes('src/components/analytics')) return 'analytics';
          if (id.includes('src/components/admin')) return 'admin';
          if (id.includes('src/components/quality')) return 'quality';
          if (id.includes('src/components/inventory')) return 'inventory';
          if (id.includes('src/pages')) return 'pages';
        }
      },
      // Reduce parallel operations to save memory
      maxParallelFileOps: 3,
      // Optimize tree-shaking for memory
      treeshake: {
        preset: 'smallest',
        moduleSideEffects: false
      }
    },
    // Use esbuild for faster builds with less memory
    minify: 'esbuild',
    // Disable source maps to save memory
    sourcemap: false,
    // Don't report compressed size to save memory
    reportCompressedSize: false,
    // CSS code splitting
    cssCodeSplit: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

