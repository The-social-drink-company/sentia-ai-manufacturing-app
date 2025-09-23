import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Simplified initialization
console.log('Initializing Sentia Manufacturing Dashboard...');

// Simple fallback App component
const FallbackApp = () => {
  console.log('[FallbackApp] Rendering...');
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
    console.error('Root element not found');
    document.body.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">Error: Root element not found</div>';
    return;
  }

  console.log('Root element found, mounting React app...');

  try {
    console.log('[main.jsx] Creating React root...');
    const root = createRoot(rootElement);
    
    // Try to load the full app
    try {
      console.log('[main.jsx] Attempting to load App-multistage...');
      const { default: App } = await import('./App-multistage.jsx');
      
      console.log('[main.jsx] App-multistage loaded successfully, rendering...');
      root.render(
        <StrictMode>
          <App />
        </StrictMode>
      );
      console.log('[main.jsx] React app mounted successfully');
    } catch (appError) {
      console.error('[main.jsx] Failed to load App-multistage:', appError);
      console.log('[main.jsx] Falling back to simple app...');
      
      root.render(
        <StrictMode>
          <FallbackApp />
        </StrictMode>
      );
      console.log('[main.jsx] Fallback app mounted successfully');
    }
  } catch (error) {
    console.error('[main.jsx] Critical error mounting React app:', error);
    rootElement.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">Critical Error: ' + error.message + '</div>';
  }
};

// Handle Service Worker errors
window.addEventListener('error', (event) => {
  console.error('[main.jsx] Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[main.jsx] Unhandled promise rejection:', event.reason);
  // Don't prevent the default behavior, just log it
});

// Initialize app
initializeApp();