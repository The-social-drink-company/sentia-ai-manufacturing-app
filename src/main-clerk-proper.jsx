import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App-clerk-proper.jsx'
import { ClerkProvider } from '@clerk/clerk-react'

// Import your Clerk Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file')
}

console.log('🔐 Clerk Configuration:', {
  hasKey: !!PUBLISHABLE_KEY,
  keyPrefix: PUBLISHABLE_KEY?.substring(0, 20) + '...',
  environment: PUBLISHABLE_KEY?.includes('_live_') ? 'production' : 'development'
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "shadow-xl border border-gray-200 dark:border-gray-700",
          headerTitle: "text-2xl font-bold text-gray-900 dark:text-white",
          headerSubtitle: "text-gray-600 dark:text-gray-400",
          socialButtonsBlockButton: "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800",
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors",
          formFieldInput: "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
          footerActionLink: "text-blue-600 hover:text-blue-700 font-medium"
        },
        variables: {
          colorPrimary: "#2563eb",
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          colorInputText: "#1f2937"
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
