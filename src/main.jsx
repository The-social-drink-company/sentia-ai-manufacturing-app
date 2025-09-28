import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App-simple.jsx'

// Get Clerk publishable key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

console.log('[Clerk Init] Starting with key:', PUBLISHABLE_KEY?.substring(0, 20) + '...');

// Validate Clerk key
if (!PUBLISHABLE_KEY) {
  console.error('[Clerk Init] Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
  // Show error in UI
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: red;">
        <h2>Configuration Error</h2>
        <p>Missing VITE_CLERK_PUBLISHABLE_KEY environment variable.</p>
        <p>Please set this in your Render environment variables.</p>
      </div>
    `;
  }
  throw new Error('Missing Clerk Publishable Key');
}

// Initialize React app with Clerk
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

const root = createRoot(rootElement);

console.log('[App Init] Mounting React app with Clerk...');

// Render app with ClerkProvider at the root
root.render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      navigate={(to) => window.location.href = to}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#2563eb',
        },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);

console.log('[App Init] React app mounted successfully');