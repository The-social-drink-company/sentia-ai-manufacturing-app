import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  const appVersion = pkg.version ?? '0.0.0';
  const buildTime = new Date().toISOString();
  const mcpServer = env.VITE_MCP_SERVER ?? process.env.MCP_SERVER_URL ?? 'https://mcp-server-tkyu.onrender.com';

  const envWithProcessPrefix = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
  );

  const plugins = [react()];

  try {
    const { default: viteImagemin } = await import('vite-plugin-imagemin');
    plugins.push(
      viteImagemin({
        gifsicle: { optimizationLevel: 7, interlaced: false },
        optipng: { optimizationLevel: 7 },
        mozjpeg: { quality: 80 },
        pngquant: { quality: [0.7, 0.85] },
        svgo: {
          plugins: [
            { name: 'removeViewBox', active: false },
            { name: 'cleanupIDs', active: false }
          ]
        }
      })
    );
  } catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') {
      console.warn('[vite-config] Failed to load vite-plugin-imagemin', error);
    }
  }

  try {
    const { default: tailwindcssPurge } = await import('vite-plugin-tailwind-purgecss');
    plugins.push(tailwindcssPurge());
  } catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') {
      console.warn('[vite-config] Failed to load vite-plugin-tailwind-purgecss', error);
    }
  }

  const manualChunks = (id) => {
    if (!id.includes('node_modules')) return undefined;

    if (/node_modules[\\/](react|react-dom)/.test(id)) {
      return 'react';
    }

    if (/node_modules[\\/](framer-motion|@headlessui|@radix-ui|@mui|lucide-react|clsx)/.test(id)) {
      return 'ui';
    }

    if (/node_modules[\\/](chart.js|d3|recharts|echarts)/.test(id)) {
      return 'charts';
    }

    return 'vendor';
  };

  return {
    plugins,
    envPrefix: 'VITE_',
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __BUILD_TIME__: JSON.stringify(buildTime),
      __MCP_SERVER__: JSON.stringify(mcpServer),
      ...envWithProcessPrefix
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@services': path.resolve(__dirname, './src/services')
      }
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      },
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        },
        '/ws': {
          target: 'ws://localhost:5000',
          changeOrigin: true,
          ws: true,
          secure: false
        }
      }
    },
    preview: {
      host: '0.0.0.0',
      port: Number(process.env.PREVIEW_PORT) || 4173,
      strictPort: false,
      proxy: {
        '/api': {
          target: process.env.PREVIEW_API_TARGET || 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        },
        '/ws': {
          target: process.env.PREVIEW_WS_TARGET || 'ws://localhost:5000',
          changeOrigin: true,
          ws: true,
          secure: false
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      esbuildOptions: {
        treeShaking: true
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'production',
      cssCodeSplit: true,
      minify: 'terser',
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        treeshake: 'recommended',
        output: {
          manualChunks,
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name?.split('.').pop() ?? 'asset';
            return `assets/${extType}/[name]-[hash][extname]`;
          }
        }
      }
    },
    css: {
      devSourcemap: mode !== 'production'
    }
  };
});
