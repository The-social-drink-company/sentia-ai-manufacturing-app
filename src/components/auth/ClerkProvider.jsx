import React from 'react'
import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZXhhbXBsZS1jbGVyay1rZXk'

if (!publishableKey) {
  throw new Error('Missing Publishable Key')
}

export default function ClerkProvider({ children }) {
  return (
    <BaseClerkProvider 
      publishableKey={publishableKey}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#3B82F6',
          colorBackground: '#0F172A',
          colorInputBackground: '#1E293B',
          colorInputText: '#F8FAFC',
        },
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
          card: 'bg-slate-900 border border-slate-700',
          headerTitle: 'text-white',
          headerSubtitle: 'text-slate-400',
          socialButtonsBlockButton: 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700',
          formFieldLabel: 'text-slate-300',
          formFieldInput: 'bg-slate-800 border-slate-600 text-white',
          footerActionLink: 'text-blue-400 hover:text-blue-300',
        }
      }}
    >
      {children}
    </BaseClerkProvider>
  )
}
