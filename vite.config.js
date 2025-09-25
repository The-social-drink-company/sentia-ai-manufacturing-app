import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load package.json for version info
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  const enableClerk = env.VITE_ENABLE_CLERK === 'true' || env.VITE_USE_AUTH === 'true';
  const disableClerk = enableClerk ? false : env.VITE_DISABLE_CLERK !== 'false';

  const alias = {
    '@': path.resolve(__dirname, './src'),
    '@components': path.resolve(__dirname, './src/components'),
    '@pages': path.resolve(__dirname, './src/pages'),
    '@hooks': path.resolve(__dirname, './src/hooks'),
    '@utils': path.resolve(__dirname, './src/utils'),
    '@services': path.resolve(__dirname, './src/services'),
    '@stores': path.resolve(__dirname, './src/stores'),
    '@lib': path.resolve(__dirname, './src/lib'),
    '@styles': path.resolve(__dirname, './src/styles'),
    '@assets': path.resolve(__dirname, './src/assets'),
    '@types': path.resolve(__dirname, './src/types'),
    '@context': path.resolve(__dirname, './src/context'),
    '@config': path.resolve(__dirname, './src/config'),
    '@mcp': path.resolve(__dirname, './mcp-server')
  };

  if (disableClerk) {
    alias['@clerk/clerk-react'] = path.resolve(__dirname, './src/lib/clerk-mock.js');
  }

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
        fastRefresh: true
      })
    ],

    // Development server configuration
    server: {
      host: '0.0.0.0', // Allow network access
      port: 3000, // Standard React dev port
      strictPort: false, // Find another port if 3000 is busy
      open: false, // Don't auto-open browser
      cors: true, // Enable CORS for development

      // Proxy configuration for API and WebSocket
      proxy: {
        '/api': {
          target: process.env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path, // Keep /api prefix
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('[Proxy Error]', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('[Proxy Request]', req.method, req.url, '->', proxyReq.path);
            });
          }
        },
        '/ws': {
          target: 'ws://localhost:5000',
          ws: true,
          changeOrigin: true,
          secure: false
        },
        '/socket.io': {
          target: 'http://localhost:5000',
          ws: true,
          changeOrigin: true,
          secure: false
        },
        '/mcp': {
          target: process.env.VITE_MCP_SERVER_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/mcp/, '')
        }
      },

      // HMR configuration
      hmr: {
        overlay: true,
        clientPort: 3000
      },

      // Watch configuration
      watch: {
        usePolling: false, // Use native file system events
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**']
      }
    },

    // Build configuration
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: mode === 'production' ? 'hidden' : true,
      chunkSizeWarningLimit: 2000, // 2MB warning threshold
      reportCompressedSize: mode === 'production',

      // CSS configuration
      cssCodeSplit: true,
      cssMinify: 'lightningcss',

      // Minification settings - DISABLED to fix initialization error
      minify: false, // Temporarily disabled to fix blank screen issue
      // terserOptions: mode === 'production' ? {
      //   compress: {
      //     drop_console: true,
      //     drop_debugger: true,
      //     pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
      //     passes: 2
      //   },
      //   format: {
      //     comments: false
      //   },
      //   mangle: {
      //     safari10: true
      //   }
      // } : undefined,

      // Rollup configuration
      rollupOptions: {
        output: {
          // Asset naming patterns
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name].[hash][extname]`;
            } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name].[hash][extname]`;
            } else if (ext === 'css') {
              return `assets/css/[name].[hash][extname]`;
            }
            return `assets/[name].[hash][extname]`;
          },

          // Manual chunks - SIMPLIFIED to fix initialization error
          // Temporarily using Vite's default chunking to avoid circular dependencies
          manualChunks: undefined,
          // Original manual chunks commented out to fix blank screen issue
          // manualChunks: (id) => {
          //   if (id.includes('node_modules')) {
          //     if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
          //       return 'react-core';
          //     }
          //     if (id.includes('@tanstack/react-query') || id.includes('zustand') ||
          //         id.includes('axios') || id.includes('swr')) {
          //       return 'data-libs'; // This chunk was causing initialization error
          //     }
          //     return 'vendor';
          //   }
          // },

          // Globals for external dependencies (if any)
          globals: {
            // Add any external globals here if needed
          }
        },

        // External dependencies (if using CDN)
        external: [
          // Add external dependencies here if loading from CDN
        ],

        // Tree shaking
        treeshake: {
          preset: 'recommended',
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false
        },

        // Performance optimizations
        maxParallelFileOps: 5,
        preserveEntrySignatures: false
      },

      // Target modern browsers
      target: 'es2020',

      // Module preload configuration
      modulePreload: {
        polyfill: true
      },

      // Asset inlining threshold
      assetsInlineLimit: 4096 // 4KB
    },

    // Module resolution
    resolve: {
      alias,
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    },

    // Global constants
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __MCP_SERVER__: JSON.stringify(env.VITE_MCP_SERVER_URL || 'http://localhost:3001'),
      __DEV__: mode === 'development',
      __PROD__: mode === 'production',
      __TEST__: mode === 'test',
      'process.env.NODE_ENV': JSON.stringify(mode),
      'import.meta.env.VITE_APP_TITLE': JSON.stringify(env.VITE_APP_TITLE || 'Sentia Manufacturing'),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:5000/api'),
      'import.meta.env.VITE_MCP_SERVER_URL': JSON.stringify(env.VITE_MCP_SERVER_URL || 'http://localhost:3001')
    },

    // Dependencies optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'zustand',
        'axios',
        'recharts',
        'framer-motion',
        '@heroicons/react/24/outline',
        '@heroicons/react/24/solid'
      ],
      exclude: [
        '@react-three/fiber',
        '@react-three/drei',
        'three'
      ],
      esbuildOptions: {
        target: 'es2020'
      }
    },

    // Preview server configuration
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: false,
      open: false,
      cors: true,
      headers: {
        'Cache-Control': 'public, max-age=600'
      }
    },

    // CSS configuration
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
        scopeBehaviour: 'local',
        generateScopedName: mode === 'production'
          ? '[hash:base64:8]'
          : '[name]__[local]__[hash:base64:5]'
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      },
      devSourcemap: true,
      postcss: {
        plugins: [
          // PostCSS plugins will be loaded from postcss.config.js
        ]
      }
    },

    // JSON configuration
    json: {
      namedExports: true,
      stringify: false
    },

    // ESBuild configuration - minification disabled to fix initialization error
    esbuild: {
      logLevel: 'info',
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
      legalComments: 'none',
      treeShaking: true,
      minifyIdentifiers: false, // Disabled to fix blank screen
      minifySyntax: false, // Disabled to fix blank screen
      minifyWhitespace: false // Disabled to fix blank screen
    },

    // App type
    appType: 'spa',

    // Logging
    logLevel: mode === 'production' ? 'warn' : 'info',

    // Clear screen on dev server start
    clearScreen: false,

    // Environment directory
    envDir: '.',

    // Public directory
    publicDir: 'public',

    // Cache directory
    cacheDir: 'node_modules/.vite',

    // Assets configuration
    assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr', '**/*.exr']
  };
});