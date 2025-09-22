import React from 'react';
import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZW5hYmxlZC1jb2NrZXJlbC0yNi5jbGVyay5hY2NvdW50cy5kZXYk';

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const ClerkProvider = ({ children }) => {
  return (
    <BaseClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: 'dark',
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#1e293b',
          colorInputBackground: '#334155',
          colorInputText: '#f1f5f9',
          colorText: '#f1f5f9',
          colorTextSecondary: '#cbd5e1',
          colorSuccess: '#10b981',
          colorDanger: '#ef4444',
          colorWarning: '#f59e0b',
          borderRadius: '0.75rem',
          fontFamily: 'Inter, system-ui, sans-serif'
        },
        elements: {
          formButtonPrimary: {
            backgroundColor: '#3b82f6',
            '&:hover': {
              backgroundColor: '#2563eb'
            }
          },
          card: {
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          },
          headerTitle: {
            color: '#f1f5f9',
            fontSize: '1.5rem',
            fontWeight: '600'
          },
          headerSubtitle: {
            color: '#cbd5e1'
          },
          socialButtonsBlockButton: {
            backgroundColor: 'rgba(51, 65, 85, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(51, 65, 85, 1)'
            }
          },
          formFieldInput: {
            backgroundColor: '#334155',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            '&:focus': {
              borderColor: '#3b82f6',
              boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
            }
          },
          footerActionLink: {
            color: '#3b82f6',
            '&:hover': {
              color: '#2563eb'
            }
          }
        }
      }}
    >
      {children}
    </BaseClerkProvider>
  );
};

export default ClerkProvider;
