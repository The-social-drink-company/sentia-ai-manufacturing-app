import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

// Clerk publishable key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Validate the key is present and properly formatted
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables')
}

// Validate key format (should start with pk_ and not end with $)
if (!PUBLISHABLE_KEY.startsWith('pk_')) {
  throw new Error('Invalid Clerk publishable key format. Key should start with pk_')
}

if (PUBLISHABLE_KEY.endsWith('$')) {
  console.error('Warning: Clerk publishable key appears to be truncated (ends with $)')
}

console.log('Clerk initialization:', {
  keyPresent: !!PUBLISHABLE_KEY,
  keyPrefix: PUBLISHABLE_KEY.substring(0, 7),
  environment: import.meta.env.MODE
})

// PRODUCTION implementation with proper error handling
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-lg"
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
