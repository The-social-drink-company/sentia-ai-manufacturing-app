import { Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import MockAuthProvider from './providers/MockAuthProvider.jsx'
import Dashboard from './pages/Dashboard.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 0
    }
  }
})

const AppSimple = () => (
  <QueryClientProvider client={queryClient}>
    <MockAuthProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-600 p-4 text-white">
          <h1 className="text-2xl font-bold">Sentia Manufacturing Dashboard</h1>
          <p className="text-sm">Local development mode: mock authentication active</p>
        </header>
        <main className="container mx-auto p-4">
          <Suspense fallback={<div className="py-12 text-center text-slate-500">Loading dashboard...</div>}>
            <Dashboard />
          </Suspense>
        </main>
      </div>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </MockAuthProvider>
  </QueryClientProvider>
)

export default AppSimple