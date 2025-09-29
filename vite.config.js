import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
// Remove @tailwindcss/vite - using standard postcss setup instead
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  define: {
    "process.env.NODE_ENV": JSON.stringify(command === "build" ? "production" : (process.env.NODE_ENV || "development"))
  },
  root: '.', // Explicitly set root to current directory
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      jsxDevelopment: false
    }),
    // tailwindcss handled via postcss.config.js
    visualizer({
      filename: "dist/stats.html",
      template: "treemap",
      gzipSize: true,
      brotliSize: true
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist', // Explicitly set output directory
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@clerk')) {
              return 'clerk';
            }
            if (id.includes('recharts') || id.includes('framer-motion') || id.includes('embla')) {
              return 'charts';
            }
            if (id.includes('@tanstack')) {
              return 'data-layer';
            }
            if (id.includes('@radix-ui')) {
              return 'radix';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
            return 'vendor';
          }
        },
      },
    },
  },
}))
