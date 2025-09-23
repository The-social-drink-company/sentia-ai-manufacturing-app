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
        // Ordered chunking strategy to ensure proper dependency loading sequence
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Level 1: Core dependencies (must load first)
            if (id.includes('react') || id.includes('react-dom')) {
              return '1-react-core';
            }
            
            // Level 2: Authentication (depends on React, must load before app)
            if (id.includes('@clerk')) {
              return '2-clerk-auth';
            }
            
            // Level 3: UI and charting libraries (depends on React)
            if (id.includes('recharts') || id.includes('@heroicons') || id.includes('tailwindcss')) {
              return '3-ui-libs';
            }
            
            // Level 4: State management and utilities
            if (id.includes('@tanstack') || id.includes('zustand') || id.includes('react-router')) {
              return '4-state-routing';
            }
            
            // Level 5: Everything else (loads last)
            return '5-vendor-misc';
          }
          
          // App code chunking with dependency awareness
          if (id.includes('src/')) {
            // Core app infrastructure (loads first)
            if (id.includes('App-') || id.includes('main.jsx')) {
              return 'app-core';
            }
            
            // Authentication components (depends on Clerk)
            if (id.includes('auth/') || id.includes('Auth')) {
              return 'app-auth';
            }
            
            // Layout and UI components (depends on auth)
            if (id.includes('layout/') || id.includes('components/ui/')) {
              return 'app-ui';
            }
            
            // Feature pages (loads last)
            if (id.includes('pages/') || id.includes('components/')) {
              return 'app-features';
            }
          }
          
          // Default fallback
          return 'app-misc';
        },
        
        // Ensure chunks load in dependency order using Rollup's chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        
        // Control asset naming for predictable loading
        assetFileNames: 'assets/[name]-[hash].[ext]'
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

