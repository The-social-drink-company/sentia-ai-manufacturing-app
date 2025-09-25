import Dashboard from './pages/Dashboard.jsx'

const AppSimple = () => (
  <div className='min-h-screen bg-gray-50 text-slate-900'>
    <header className='bg-blue-600 px-4 py-3 text-white'>
      <h1 className='text-2xl font-semibold'>Sentia Manufacturing Dashboard</h1>
      <p className='text-sm text-blue-100'>Local development mode: authentication bypassed</p>
    </header>
    <main className='container mx-auto px-4 py-6'>
      <Dashboard />
    </main>
  </div>
)

export default AppSimple
