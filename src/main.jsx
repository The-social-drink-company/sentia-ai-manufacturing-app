import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// TEMPORARILY BYPASS CLERK FOR URGENT FIX
const BYPASS_CLERK = true;

if (BYPASS_CLERK) {
  // Direct render without Clerk
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} else {
  // Original Clerk implementation (currently not working)
  import('@clerk/clerk-react').then(({ ClerkProvider }) => {
    const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ'

    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <App />
        </ClerkProvider>
      </StrictMode>,
    )
  })
}
