import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// Marketing pages (NO Clerk required)
import LandingPage from '@/pages/marketing/LandingPage'
import PricingPage from '@/pages/marketing/PricingPage'
import BlogListPage from '@/pages/marketing/BlogListPage'
import BlogPostPage from '@/pages/marketing/BlogPostPage'
import AboutPage from '@/pages/marketing/AboutPage'
import FeaturesPage from '@/pages/marketing/FeaturesPage'
import TeamPage from '@/pages/marketing/TeamPage'
import ContactPage from '@/pages/marketing/ContactPage'

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
      {/* Marketing site routes - NO CLERK */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Application routes - WITH CLERK */}
      <Route
        path="/app/*"
        element={
          <Suspense fallback={<Loader />}>
            <ClerkApp />
          </Suspense>
        }
      />

      {/* Auth routes - WITH CLERK (handled by ClerkApp) */}
      <Route
        path="/sign-in/*"
        element={
          <Suspense fallback={<Loader />}>
            <ClerkApp />
          </Suspense>
        }
      />
      <Route
        path="/sign-up/*"
        element={
          <Suspense fallback={<Loader />}>
            <ClerkApp />
          </Suspense>
        }
      />
      <Route
        path="/trial/*"
        element={
          <Suspense fallback={<Loader />}>
            <ClerkApp />
          </Suspense>
        }
      />
      <Route
        path="/dashboard/*"
        element={
          <Suspense fallback={<Loader />}>
            <ClerkApp />
          </Suspense>
        }
      />

      {/* Fallback to landing page */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  </BrowserRouter>
)

export default AppRoot

