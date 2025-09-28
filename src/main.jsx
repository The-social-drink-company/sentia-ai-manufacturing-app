/**
 * ENTERPRISE MAIN ENTRY POINT
 *
 * Production-ready entry point with Clerk authentication
 * and enterprise application features. NO MOCK DATA.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import App from './App-fixed.jsx';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

// Initialize the application
const initializeApp = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('Root element not found');
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: red; font-family: system-ui;">
        <h1>Application Error</h1>
        <p>Root element not found. Please check the HTML template.</p>
      </div>
    `;
    return;
  }

  console.log('Initializing Sentia Manufacturing Dashboard (Enterprise)...');
  console.log('Clerk Key:', PUBLISHABLE_KEY?.substring(0, 20) + '...');

  try {
    const root = createRoot(rootElement);

    root.render(
      <StrictMode>
        <ClerkProvider
          publishableKey={PUBLISHABLE_KEY}
          navigate={(to) => window.location.href = to}
          appearance={{
            baseTheme: undefined,
            variables: {
              colorPrimary: '#2563eb',
              colorTextOnPrimaryBackground: '#ffffff',
              colorBackground: '#ffffff',
              colorInputBackground: '#ffffff',
              colorInputText: '#1f2937',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              borderRadius: '0.5rem'
            },
            elements: {
              card: {
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                border: '1px solid #e5e7eb'
              },
              headerTitle: {
                fontSize: '1.5rem',
                fontWeight: '600'
              },
              headerSubtitle: {
                color: '#6b7280'
              }
            }
          }}
        >
          <App />
        </ClerkProvider>
      </StrictMode>
    );

    console.log('Application mounted successfully - Enterprise Mode');
  } catch (error) {
    console.error('Failed to mount application:', error);

    rootElement.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: red; font-family: system-ui;">
        <h1>Application Error</h1>
        <p>Failed to initialize the application: ${error.message}</p>
        <p>Please check the console for more details.</p>
      </div>
    `;
  }
};

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Initialize the app
initializeApp();