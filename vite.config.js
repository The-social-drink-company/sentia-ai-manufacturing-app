import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    // Memory optimizations for large builds
    rollupOptions: {
      output: {
        // Ultra-minimal chunking to avoid variable initialization issues
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Only split Clerk (very stable, large, authentication-focused)
            if (id.includes('@clerk')) return 'clerk';
            // Keep recharts with vendor to avoid initialization order issues
            return 'vendor'; // Everything else including recharts in vendor chunk
          }
          // Let Vite handle app code chunking automatically
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
      "@clerk/clerk-react": path.resolve(__dirname, "./src/lib/clerk-mock.js"),
    },
  },
})

