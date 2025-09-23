import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App-multistage.jsx'

// Simplified initialization
console.log('Initializing Sentia Manufacturing Dashboard...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found');
  document.body.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">Error: Root element not found</div>';
} else {
  console.log('Root element found, mounting React app...');

  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('React app mounted successfully');
  } catch (error) {
    console.error('Error mounting React app:', error);
    rootElement.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">Error: ' + error.message + '</div>';
  }
}