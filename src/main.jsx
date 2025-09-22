import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './index.css'

// Import publishable key - handle both Vite and Next.js naming conventions
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
                        import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
                        'pk_test_cm9idXN0LXNuYWtlLTUwLmNsZXJrLmFjY291bnRzLmRldiQ'

if (!PUBLISHABLE_KEY) {
  console.error("Missing Clerk Publishable Key - using demo mode")
}

// Ensure React is globally available for bundled modules
if (typeof window !== 'undefined') {
  window.React = React;
  window.ReactDOM = ReactDOM;
}

// Performance monitoring with web-vitals
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals'

// Import development logger
import { devLog } from './lib/devLog.js'

// Log web vitals for performance monitoring
function sendToAnalytics(metric) {
  devLog.info(`Web Vitals ${metric.name}:`, metric.value)
}

// Measure Core Web Vitals with correct exports (FID replaced with INP in web-vitals v5)
try {
  onCLS(sendToAnalytics)
  onINP(sendToAnalytics)  // Interaction to Next Paint (replaces FID)
  onFCP(sendToAnalytics)
  onLCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
} catch (error) {
  devLog.warn('Web vitals measurement not available:', error.message)
}

// Enhanced Loading component for enterprise application
const EnterpriseLoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif'
  }}>
    <div style={{ textAlign: 'center', maxWidth: '400px', padding: '32px' }}>
      <div style={{
        width: '64px',
        height: '64px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 24px'
      }} />
      <h2 style={{
        fontSize: '24px',
        fontWeight: '600',
        color: '#1e293b',
        margin: '0 0 12px 0'
      }}>
        Sentia Manufacturing
      </h2>
      <div style={{
        fontSize: '16px',
        color: '#64748b',
        marginBottom: '16px'
      }}>
        Loading Enterprise Dashboard...
      </div>
      <div style={{
        fontSize: '14px',
        color: '#94a3b8',
        lineHeight: '1.5'
      }}>
        Initializing authentication and enterprise systems
      </div>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

devLog.info('Starting Sentia Manufacturing Dashboard...');
devLog.info('Environment:', import.meta.env.MODE);
devLog.info('Clerk Key Present:', !!PUBLISHABLE_KEY);
devLog.info('Clerk Key Source:', PUBLISHABLE_KEY.includes('cm9idXN0') ? 'New Credentials' : 'Legacy Credentials');

// Add global error handler
window.addEventListener('error', (event) => {
  devLog.error('Global error:', {
    message: event.error?.message,
    stack: event.error?.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  })
})

window.addEventListener('unhandledrejection', (event) => {
  devLog.error('Unhandled promise rejection:', {
    reason: event.reason?.message || event.reason,
    stack: event.reason?.stack,
    promise: event.promise
  })
  
  // Prevent the default behavior (logging to console)
  if (event.reason?.message?.includes('background.bundle.js') || 
      event.reason?.toString?.()?.includes('background.bundle.js')) {
    devLog.warn('Suppressing browser extension error:', event.reason)
    event.preventDefault()
  }
})

// Initialize the application
console.log('🚀 Initializing Sentia Manufacturing Enterprise Dashboard...');
console.log('📍 Environment:', import.meta?.env?.MODE || 'production');
console.log('⚛️ React version:', React.version);
console.log('🔐 Clerk integration:', PUBLISHABLE_KEY ? 'Enabled' : 'Demo mode');
console.log('🔑 Using credentials:', PUBLISHABLE_KEY.includes('cm9idXN0') ? 'New Clerk Setup' : 'Legacy Setup');

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  // Render with Clerk Provider if key is available, otherwise use demo mode
  if (PUBLISHABLE_KEY) {
    root.render(
      <React.StrictMode>
        <ClerkProvider 
          publishableKey={PUBLISHABLE_KEY}
          appearance={{
            baseTheme: undefined,
            variables: {
              colorPrimary: '#3b82f6',
              colorBackground: '#ffffff',
              colorInputBackground: '#f8fafc',
              colorInputText: '#1e293b',
              borderRadius: '8px'
            },
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors',
              card: 'shadow-lg border border-gray-200 rounded-xl',
              headerTitle: 'text-2xl font-bold text-gray-900 mb-2',
              headerSubtitle: 'text-gray-600 mb-6',
              socialButtonsBlockButton: 'border border-gray-300 hover:border-gray-400 transition-colors',
              formFieldInput: 'border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
              footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium'
            }
          }}
        >
          <Suspense fallback={<EnterpriseLoadingFallback />}>
            <App />
          </Suspense>
        </ClerkProvider>
      </React.StrictMode>
    );
  } else {
    // Demo mode without Clerk
    root.render(
      <React.StrictMode>
        <Suspense fallback={<EnterpriseLoadingFallback />}>
          <App />
        </Suspense>
      </React.StrictMode>
    );
  }
  
  console.log('✅ Enterprise Dashboard mounted successfully!');
  
  // Hide the fallback loader if it exists
  setTimeout(() => {
    const fallbackLoader = document.getElementById('fallback-loader');
    if (fallbackLoader) {
      fallbackLoader.style.display = 'none';
    }
  }, 100);
  
} catch (error) {
  console.error('❌ Failed to mount enterprise dashboard:', error);
  
  // Enhanced error fallback for enterprise application
  document.getElementById('root').innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Inter, system-ui, sans-serif; background: #f8fafc;">
      <div style="text-align: center; padding: 48px; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 500px;">
        <div style="width: 64px; height: 64px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
          <svg style="width: 32px; height: 32px; color: #dc2626;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <h1 style="color: #1e293b; margin-bottom: 16px; font-size: 24px; font-weight: 600;">Enterprise Dashboard Error</h1>
        <p style="color: #64748b; margin-bottom: 24px; line-height: 1.6;">
          Failed to initialize the Sentia Manufacturing Enterprise Dashboard. 
          This may be due to a temporary loading issue or missing dependencies.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button onclick="window.location.reload()" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background-color 0.2s;">
            Retry Loading
          </button>
          <button onclick="window.location.href='/dashboard/simple'" style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background-color 0.2s;">
            Load Simple Dashboard
          </button>
        </div>
        <div style="margin-top: 24px; padding: 16px; background: #f1f5f9; border-radius: 8px; text-align: left;">
          <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 14px; font-weight: 600;">Error Details:</h4>
          <code style="color: #dc2626; font-size: 12px; word-break: break-all;">${error.message}</code>
        </div>
      </div>
    </div>
  `;
}

// Add emergency timeout for enterprise application
setTimeout(() => {
  const rootElement = document.getElementById('root')
  if (!rootElement.children.length || rootElement.innerHTML.includes('fallback-loader')) {
    console.warn('Enterprise dashboard failed to render within 15 seconds')
    // Don't redirect immediately for enterprise - give more time for complex loading
  }
}, 15000)

console.log('Enterprise application initialization complete')
devLog.info('Sentia Manufacturing Enterprise Dashboard initialization complete');
