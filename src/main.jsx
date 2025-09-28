import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './providers/AuthProvider.jsx'
import { logInfo, logError, logDebug } from './utils/logger.js'
import { devLog } from '@/utils/structuredLogger.js'

// Initialize with proper Clerk authentication
devLog.log('Initializing Sentia Manufacturing Dashboard with Clerk Authentication...');

const initializeApp = async () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    logError('Root element not found');
    document.body.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">Error: Root element not found</div>';
    return;
  }

  devLog.log('Root element found, mounting React app with Clerk...');

  try {
    devLog.log('[main.jsx] Creating React root...');
    const root = createRoot(rootElement);

    // Load the simple Clerk implementation
    try {
      devLog.log('[main.jsx] Loading simple Clerk authentication app...');
      const { default: App } = await import('./main-simple-clerk.jsx');

      devLog.log('[main.jsx] Simple Clerk app loaded successfully');
      // The main-simple-clerk.jsx already includes the root render, so we just import it
      devLog.log('[main.jsx] Clerk authentication app mounted successfully');
    } catch (clerkError) {
      logError('[main.jsx] Failed to load Clerk app', clerkError);
      
      // Fallback to basic app without authentication
      const { default: BasicApp } = await import('./App.jsx');
      root.render(
        <StrictMode>
          <BasicApp />
        </StrictMode>
      );
      devLog.log('[main.jsx] Basic app mounted as fallback');
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