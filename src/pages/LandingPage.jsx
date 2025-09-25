import { Link } from 'react-router-dom'

const LandingPage = ({ onGetStarted }) => {
  const handleGetStarted = () => {
    if (typeof onGetStarted === 'function') {
      onGetStarted()
    }
  }

  return (
    <main className='min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-950 text-slate-50 px-6 text-center'>
      <div className='space-y-4 max-w-2xl'>
        <span className='text-xs uppercase tracking-[0.3em] text-blue-400'>Enterprise Manufacturing Intelligence</span>
        <h1 className='text-4xl font-semibold leading-tight'>Sentia Manufacturing Dashboard</h1>
        <p className='text-sm text-slate-400'>
          Monitor production performance, track working capital, and surface AI-powered insights across your manufacturing operations.
        </p>
      </div>
      <div className='flex flex-wrap items-center justify-center gap-4'>
        {typeof onGetStarted === 'function' ? (
          <button
            type='button'
            onClick={handleGetStarted}
            className='rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400'
          >
            Get Started
          </button>
        ) : (
          <Link className='rounded-md bg-blue-600 px-6 py-2 text-sm font-medium hover:bg-blue-500' to='/signup'>
            Get Started
          </Link>
        )}
        <Link className='rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-50 hover:border-slate-400' to='/login'>
          Sign in
        </Link>
      </div>
    </main>
  )
}

export default LandingPage
