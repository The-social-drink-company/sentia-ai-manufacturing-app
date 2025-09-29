import React from 'react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import LandingPage from '@/components/LandingPage'
import ComprehensiveDashboard from '@/components/ComprehensiveDashboard'

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SignedOut>
      <LandingPage />
    </SignedOut>
    <SignedIn>
      <ComprehensiveDashboard />
    </SignedIn>
  </QueryClientProvider>
)

export default App
