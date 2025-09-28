import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  // Determine which environment file to use
  const envFile = mode === 'production' ? '.env.production' : 
                  mode === 'testing' ? '.env.testing' : 
                  '.env.development'
  
  console.log(`[Vite] Loading environment: ${mode} from ${envFile}`)
  console.log(`[Vite] VITE_CLERK_PUBLISHABLE_KEY: ${env.VITE_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET'}`)
  
  return {
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
      // Enhanced chunking strategy for better performance
      rollupOptions: {
        output: {
          // Optimized manual chunking for lazy loading
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Core authentication chunk (always needed)
              if (id.includes('@clerk')) return 'clerk';
              // Charts and visualization (can be lazy loaded)
              if (id.includes('recharts') || id.includes('chart.js') || id.includes('d3')) {
                return 'charts';
              }
              // React ecosystem (frequently used)
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              // Utility libraries (can be shared)
              if (id.includes('date-fns') || id.includes('lodash') || id.includes('axios')) {
                return 'utils';
              }
              // Everything else
              return 'vendor';
            }
            // Application code splitting by feature
            if (id.includes('src/features/executive')) return 'feature-executive';
            if (id.includes('src/features/working-capital')) return 'feature-working-capital';
            if (id.includes('src/features/inventory')) return 'feature-inventory';
            if (id.includes('src/features/production')) return 'feature-production';
            // Let Vite handle other app code
          },
          // Optimize chunk naming
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
        // Performance optimizations
        maxParallelFileOps: 5, // Increased for better build performance
        treeshake: {
          preset: 'smallest',
          moduleSideEffects: false
        }
      },
      // Enhanced minification
      minify: 'esbuild',
      target: 'es2020', // Modern browsers for better optimization
      // Source maps only in development
      sourcemap: process.env.NODE_ENV === 'development',
      reportCompressedSize: false,
      cssCodeSplit: true,
      // Asset inlining threshold
      assetsInlineLimit: 4096 // 4KB
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Define environment variables for the build
    define: {
      __VITE_ENV_FILE__: JSON.stringify(envFile),
      __BUILD_MODE__: JSON.stringify(mode)
    }
  }
})
