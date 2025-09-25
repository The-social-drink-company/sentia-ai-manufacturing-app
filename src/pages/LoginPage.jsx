const LoginPage = () => (
  <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
    <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="text-sm text-slate-500">Access manufacturing dashboards, alerts, and analytics.</p>
      </header>
      <form className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" type="email" placeholder="you@sentia.com" required />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" type="password" required />
        </label>
        <button className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500" type="submit">
          Continue
        </button>
      </form>
    </div>
  </main>
)

export default LoginPage