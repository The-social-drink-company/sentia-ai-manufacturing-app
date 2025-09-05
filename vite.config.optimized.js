
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin()
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['recharts'],
          'ui-vendor': ['@heroicons/react'],
          
          // Feature-based chunks
          'dashboard-features': [
            'src/pages/EnhancedDashboard.jsx',
            'src/components/widgets/KPIStrip.jsx',
            'src/components/widgets/MultiChannelSalesWidget.jsx'
          ],
          'manufacturing-features': [
            'src/pages/Dashboard.jsx',
            'src/components/widgets/ProductionMetricsWidget.jsx',
            'src/components/widgets/SmartInventoryWidget.jsx'
          ],
          'financial-features': [
            'src/pages/WorkingCapitalDashboard.jsx',
            'src/components/widgets/WorkingCapitalWidget.jsx',
            'src/components/widgets/CFOKPIStrip.jsx'
          ],
          'admin-features': [
            'src/pages/AdminPortal.jsx',
            'src/pages/AdminPanel.jsx'
          ]
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'recharts',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid'
    ]
  },
  server: {
    fs: {
      strict: true
    }
  }
});
