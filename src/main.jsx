import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Simplified initialization without environment validation for now
// This will allow the app to load and we can add validation back incrementally

console.log('🚀 Initializing Sentia Manufacturing Dashboard...');

// Check if root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found');
  document.body.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">Error: Root element not found</div>';
} else {
  console.log('✅ Root element found, mounting React app...');
  
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('✅ React app mounted successfully');
  } catch (error) {
    console.error('❌ Error mounting React app:', error);
    rootElement.innerHTML = `
      <div style="
        padding: 2rem; 
        text-align: center; 
        font-family: system-ui, sans-serif;
        background-color: #fee2e2;
        color: #dc2626;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
      ">
        <h1>Application Error</h1>
        <p>Failed to initialize the React application.</p>
        <p>Error: ${error.message}</p>
        <p>Please refresh the page or contact support.</p>
      </div>
    `;
  }
}
