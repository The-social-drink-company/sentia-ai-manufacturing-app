import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import PureLandingPage from '@/components/PureLandingPage'

// Lazy load the Clerk app to avoid loading Clerk unless needed
const ClerkApp = lazy(() => import('./App-enterprise'))

const Loader = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Loading application...</p>
    </div>
  </div>
)

const AppRoot = () => (
  <BrowserRouter>
    <Routes>
      {/* Marketing site - NO CLERK */}
      <Route path="/" element={<PureLandingPage />} />
      <Route path="/landing" element={<PureLandingPage />} />

      {/* Application routes - WITH CLERK */}
      <Route
        path="/app/*"
        element={
          <Suspense fallback={<Loader />}>
            <ClerkApp />
          </Suspense>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<PureLandingPage />} />
    </Routes>
  </BrowserRouter>
)

export default AppRoot