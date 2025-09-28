/**
 * CLEAN MAIN ENTRY POINT
 * 
 * Simple, reliable entry point that loads the clean App component
 * with Clerk authentication. No complex fallbacks or error masking.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App-clean.jsx';

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

  console.log('🚀 Initializing Sentia Manufacturing Dashboard...');
  
  try {
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
    console.log('✅ Application mounted successfully');
  } catch (error) {
    console.error('❌ Failed to mount application:', error);
    
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
