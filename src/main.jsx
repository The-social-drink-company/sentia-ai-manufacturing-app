import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './providers/AuthProvider.jsx'
import { logInfo, logError, logDebug } from './utils/logger.js'
import { devLog } from '@/utils/structuredLogger.js'

// Simplified initialization
devLog.log('Initializing Sentia Manufacturing Dashboard...');

// Simple fallback App component
const FallbackApp = () => {
  devLog.log('[FallbackApp] Rendering...');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full text-center">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sentia Manufacturing Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            System Loading...
          </p>
          <a
            href="/dashboard"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

const initializeApp = async () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    logError('Root element not found');
    document.body.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">Error: Root element not found</div>';
    return;
  }

  devLog.log('Root element found, mounting React app...');

  try {
    devLog.log('[main.jsx] Creating React root...');
    const root = createRoot(rootElement);

    // Try to load the comprehensive enterprise app
    try {
      devLog.log('[main.jsx] Attempting to load App-comprehensive...');
      const { default: App } = await import('./App-comprehensive.jsx');

      devLog.log('[main.jsx] App-comprehensive loaded successfully, rendering...');
      root.render(
        <StrictMode>
          <App />
        </StrictMode>
      );
      devLog.log('[main.jsx] Enterprise app mounted successfully with AI features');
    } catch (appError) {
      logError('[main.jsx] Failed to load App-comprehensive', appError);
      devLog.log('[main.jsx] Attempting App-multistage fallback...');

      try {
        const { default: App } = await import('./App-multistage.jsx');
        root.render(
          <StrictMode>
            <App />
          </StrictMode>
        );
        devLog.log('[main.jsx] App-multistage mounted successfully');
      } catch (multistageError) {
        logError('[main.jsx] Failed to load App-multistage', multistageError);
        devLog.log('[main.jsx] Falling back to simple app...');

        root.render(
          <StrictMode>
            <FallbackApp />
          </StrictMode>
        );
        devLog.log('[main.jsx] Fallback app mounted successfully');
      }
    }
  } catch (error) {
    logError('[main.jsx] Critical error mounting React app', error);
    rootElement.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">Critical Error: ' + error.message + '</div>';
  }
};

// Handle Service Worker errors
window.addEventListener('error', (event) => {
  logError('[main.jsx] Global error', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  logError('[main.jsx] Unhandled promise rejection', { reason: event.reason });
  // Don't prevent the default behavior, just log it
});

// Initialize app
initializeApp();