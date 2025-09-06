import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // Critical: Set base path for Railway deployment
  base: './', // Ensures relative paths work on Railway
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
    port: 3000,
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
    emptyOutDir: true,
    sourcemap: false, // Disable sourcemaps in production for smaller size
    minify: 'terser', // Better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace']
      }
    },
    target: 'es2020',
    chunkSizeWarningLimit: 1000, // Reduced for better bundle analysis
    cssCodeSplit: true,
    assetsInlineLimit: 8192, // Increased for better performance
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Optimized chunking strategy
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts';
            }
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'ui-components';
            }
            if (id.includes('@tanstack') || id.includes('axios')) {
              return 'data-fetching';
            }
            if (id.includes('react-grid-layout') || id.includes('@dnd-kit')) {
              return 'drag-drop';
            }
            if (id.includes('@clerk')) {
              return 'auth';
            }
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils';
            }
            return 'vendor';
          }
          // Separate large page components
          if (id.includes('src/pages/Dashboard')) {
            return 'dashboard';
          }
          if (id.includes('src/pages/WorkingCapital')) {
            return 'working-capital';
          }
          if (id.includes('src/components/widgets')) {
            return 'widgets';
          }
        },
        chunkFileNames: 'js/[name]-[hash:8].js',
        entryFileNames: 'js/[name]-[hash:8].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash:8].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash:8].${ext}`;
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return `css/[name]-[hash:8].${ext}`;
          }
          return `assets/[name]-[hash:8].${ext}`;
        }
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