import React, { Suspense, lazy, useMemo, useCallback, useEffect } from 'react';
import {
  ClerkProvider,
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  useUser
} from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider, Navigate, Outlet, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import clerkConfig from './config/clerk.js';
import { logInfo, logWarn, logError } from './utils/logger.js';

const DashboardPage = lazy(() => import('./pages/Dashboard.jsx'));
const SettingsPage = lazy(() => import('./pages/Settings.jsx'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1
    }
  }
});

const navLinkClassName = ({ isActive }) =>
  `block rounded px-3 py-2 text-sm transition-colors duration-150 ${
    isActive ? 'bg-slate-900 text-slate-50' : 'text-slate-300 hover:bg-slate-900'
  }`;

const AppSuspenseFallback = () => (
  <div className='flex min-h-screen items-center justify-center bg-slate-950 text-slate-200'>
    <div className='flex flex-col items-center gap-3'>
      <div className='h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
      <p className='text-sm tracking-wide text-slate-400'>Preparing enterprise workspace…</p>
    </div>
  </div>
);

const ClerkLoadingScreen = () => (
  <div className='flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-200'>
    <div className='h-12 w-12 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
    <p className='mt-4 text-xs uppercase tracking-[0.3em] text-blue-400'>Clerk Authenticating</p>
  </div>
);

const RouteErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-slate-950 text-center'>
    <div className='max-w-md space-y-2 rounded-lg border border-red-500/40 bg-red-500/10 px-6 py-5 text-slate-100'>
      <h2 className='text-lg font-semibold text-red-300'>Dashboard rendering failed</h2>
      <p className='text-sm text-red-200'>{error?.message || 'An unexpected error occurred while loading this view.'}</p>
      <button
        type='button'
        onClick={resetErrorBoundary}
        className='mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500'
      >
        Retry section
      </button>
    </div>
  </div>
);

const RouterErrorElement = () => (
  <div className='flex min-h-screen items-center justify-center bg-slate-950 text-slate-200'>
    <div className='max-w-sm space-y-4 text-center'>
      <h2 className='text-xl font-semibold text-red-300'>Navigation Error</h2>
      <p className='text-sm text-slate-400'>We could not resolve the requested route. The dashboard will reload to recover.</p>
      <button
        type='button'
        onClick={() => window.location.assign('/')}
        className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500'
      >
        Reload dashboard
      </button>
    </div>
  </div>
);

const AppShell = () => {
  const { user } = useUser();
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || user?.username || 'Sentia Operator';

  return (
    <div className='flex min-h-screen bg-slate-950 text-slate-50'>
      <aside className='hidden w-64 flex-col border-r border-slate-900 bg-slate-950 px-6 py-8 lg:flex'>
        <h1 className='text-sm font-semibold uppercase tracking-[0.3em] text-slate-400'>Sentia</h1>
        <nav className='mt-10 space-y-2'>
          <NavLink to='/dashboard' className={navLinkClassName} end>
            Operations overview
          </NavLink>
          <NavLink to='/settings' className={navLinkClassName}>
            Settings
          </NavLink>
        </nav>
        <div className='mt-auto flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2'>
          <UserButton afterSignOutUrl='/' appearance={{ baseTheme: 'dark' }} />
          <div className='text-left text-xs text-slate-400'>
            <p className='uppercase tracking-[0.3em] text-slate-500'>Signed in</p>
            <p className='text-slate-200'>{displayName}</p>
          </div>
        </div>
      </aside>
      <main className='flex-1 bg-slate-950'>
        <Suspense fallback={<AppSuspenseFallback />}>
          <ErrorBoundary FallbackComponent={RouteErrorFallback}>
            <Outlet />
          </ErrorBoundary>
        </Suspense>
      </main>
    </div>
  );
};

const routerConfig = [
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouterErrorElement />,
    children: [
      { index: true, element: <Navigate to='/dashboard' replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to='/dashboard' replace /> }
    ]
  }
];

const createAppRouter = () => createBrowserRouter(routerConfig);

const AuthenticatedApp = ({ clerkPublishableKey, clerkOptions = {} }) => {
  const effectiveKey = clerkPublishableKey ?? clerkConfig.publishableKey;

  if (!effectiveKey) {
    throw new Error('Missing Clerk publishable key. Set VITE_CLERK_PUBLISHABLE_KEY to enable authentication.');
  }

  const router = useMemo(() => createAppRouter(), []);

  const handleNavigate = useCallback(
    (to) => {
      router.navigate(to).catch((navigationError) => {
        logError('[AuthenticatedApp] Clerk-driven navigation failed', navigationError);
        window.location.assign(to);
      });
    },
    [router]
  );

  useEffect(() => {
    logInfo('[AuthenticatedApp] Bootstrapping real Clerk dashboard');
    if (!effectiveKey.startsWith('pk_')) {
      logWarn('[AuthenticatedApp] Publishable key format is unexpected and may be invalid');
    }
  }, [effectiveKey]);

  const providerProps = {
    appearance: clerkConfig.appearance,
    signInUrl: clerkConfig.signInUrl,
    signUpUrl: clerkConfig.signUpUrl,
    afterSignInUrl: clerkConfig.afterSignInUrl,
    afterSignUpUrl: clerkConfig.afterSignUpUrl,
    ...clerkOptions,
    publishableKey: effectiveKey,
    navigate: handleNavigate
  };

  return (
    <ClerkProvider {...providerProps}>
      <ClerkLoading>
        <ClerkLoadingScreen />
      </ClerkLoading>
      <ClerkLoaded>
        <SignedIn>
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={<AppSuspenseFallback />}>
              <RouterProvider router={router} />
            </Suspense>
            <Toaster position='top-right' toastOptions={{ duration: 3500 }} />
          </QueryClientProvider>
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn signInUrl={clerkConfig.signInUrl} redirectUrl={clerkConfig.afterSignInUrl || '/dashboard'} />
        </SignedOut>
      </ClerkLoaded>
    </ClerkProvider>
  );
};

export default AuthenticatedApp;
