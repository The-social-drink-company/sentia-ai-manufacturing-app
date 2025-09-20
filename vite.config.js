import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh optimizations
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic'
    }),
    // Bundle analyzer for optimization insights
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
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
    minify: 'esbuild', // Use esbuild for faster, more reliable minification
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    // CRITICAL FIX: Ensure proper module format
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    }
,
    rollupOptions: {
      output: {
        // SIMPLIFIED: Basic chunk splitting to prevent module loading issues
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'clerk': ['@clerk/clerk-react'],
          'vendor': ['@tanstack/react-query', 'framer-motion', 'recharts']
        },
        // Simplified asset naming
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'js/[name]-[hash][extname]',
        entryFileNames: 'js/[name]-[hash].js'
      },
      // Simplified tree-shaking
      treeshake: {
        preset: 'smallest'
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