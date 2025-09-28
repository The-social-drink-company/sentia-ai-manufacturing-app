import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import LandingPage from '@/components/LandingPage'

const AuthenticatedApp = lazy(() => import('./App-authenticated.jsx'))

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route
        path="/app/*"
        element={
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
            <AuthenticatedApp />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)

export default App
