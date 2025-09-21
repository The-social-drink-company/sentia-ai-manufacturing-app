import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      jsxRuntime: 'automatic'
    }),
    // Bundle analyzer for performance monitoring
    process.env.ANALYZE && visualizer({
      filename: 'dist/performance-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    })
  ].filter(Boolean),
  
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
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    
    // Enhanced terser configuration for better compression
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 3,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true
      },
      mangle: {
        safari10: true,
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false
      }
    },
    
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    assetsInlineLimit: 2048, // Reduced for better caching
    
    rollupOptions: {
      output: {
        // Advanced manual chunking strategy
        manualChunks: (id) => {
          // Core React ecosystem (high priority, frequently used)
          if (id.includes('react') && !id.includes('react-router') && !id.includes('@')) {
            return 'react-core';
          }
          
          // React Router (separate for better caching)
          if (id.includes('react-router')) {
            return 'router';
          }
          
          // Authentication (Clerk)
          if (id.includes('@clerk')) {
            return 'auth';
          }
          
          // Three.js ecosystem (large 3D library - lazy loaded)
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three-3d';
          }
          
          // Chart.js ecosystem (splittable)
          if (id.includes('chart.js') || id.includes('chartjs')) {
            return 'charts-core';
          }
          
          // Recharts (alternative charting)
          if (id.includes('recharts') || id.includes('d3')) {
            return 'recharts';
          }
          
          // UI Components and Icons
          if (id.includes('@heroicons') || id.includes('@headlessui') || id.includes('@radix-ui')) {
            return 'ui-components';
          }
          
          // State management
          if (id.includes('zustand') || id.includes('@tanstack/react-query') || id.includes('jotai')) {
            return 'state-management';
          }
          
          // Animation libraries
          if (id.includes('framer-motion') || id.includes('@react-spring')) {
            return 'animation';
          }
          
          // Data processing and utilities
          if (id.includes('axios') || id.includes('date-fns') || id.includes('lodash')) {
            return 'data-utils';
          }
          
          // Form handling
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('joi')) {
            return 'forms';
          }
          
          // Database and ORM
          if (id.includes('prisma') || id.includes('@prisma/client')) {
            return 'database';
          }
          
          // AI and ML libraries
          if (id.includes('openai') || id.includes('ml-')) {
            return 'ai-ml';
          }
          
          // Enterprise services
          if (id.includes('@microsoft') || id.includes('@azure') || id.includes('@shopify')) {
            return 'enterprise-services';
          }
          
          // Monitoring and observability
          if (id.includes('@sentry') || id.includes('winston') || id.includes('prom-client')) {
            return 'monitoring';
          }
          
          // Small utility packages
          if (id.includes('node_modules')) {
            const module = id.split('node_modules/')[1];
            if (module) {
              const packageName = module.split('/')[0];
              const smallPackages = [
                'classnames', 'clsx', 'uuid', 'nanoid', 'crypto-js',
                'js-cookie', 'copy-to-clipboard', 'debounce'
              ];
              if (smallPackages.some(pkg => packageName.includes(pkg))) {
                return 'vendor-utils';
              }
            }
            // Default vendor chunk
            return 'vendor';
          }
        },
        
        // Optimized asset naming with content hashing
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-[hash:8].js`;
        },
        
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name.split('.').pop();
          if (/css/i.test(ext)) {
            return 'css/[name]-[hash:8][extname]';
          }
          if (/png|jpe?g|svg|gif|webp/i.test(ext)) {
            return 'img/[name]-[hash:8][extname]';
          }
          if (/woff2?|ttf|eot/i.test(ext)) {
            return 'fonts/[name]-[hash:8][extname]';
          }
          return 'assets/[name]-[hash:8][extname]';
        },
        
        entryFileNames: 'js/[name]-[hash:8].js',
        
        // Merge small chunks to reduce HTTP requests
        experimentalMinChunkSize: 20000,
        
        // Optimize chunk boundaries
        maxParallelFileOps: 5
      },
      
      // Enhanced tree-shaking
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      },
      
      // External dependencies (if using CDN)
      external: [],
      
      // Performance optimizations
      maxParallelFileOps: 5,
      makeAbsoluteExternalsRelative: true
    }
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@clerk/clerk-react',
      'zustand',
      '@tanstack/react-query',
      'chart.js',
      'recharts'
    ],
    exclude: [
      '@react-three/fiber',
      '@react-three/drei',
      'three',
      '@react-three/postprocessing'
    ],
    force: true,
    esbuildOptions: {
      format: 'esm',
      target: 'es2020',
      treeShaking: true
    }
  },
  
  define: {
    'global': 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    '__DEV__': JSON.stringify(process.env.NODE_ENV === 'development')
  },
  
  esbuild: {
    target: 'es2020',
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  },
  
  // CSS optimization
  css: {
    devSourcemap: false,
    postcss: {
      plugins: [
        require('autoprefixer'),
        require('tailwindcss')
      ]
    }
  }
});
