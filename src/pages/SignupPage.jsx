const SignupPage = () => (
  <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
    <div className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Request access</h1>
        <p className="text-sm text-slate-500">
          Submit your details and our operations team will provision dashboard access.
        </p>
      </header>
      <form className="grid gap-4">
        <label className="text-sm font-medium text-slate-700">
          Full name
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" required />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Work email
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" type="email" required />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Role
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Operations, Finance, Production..." required />
        </label>
        <button className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500" type="submit">
          Submit request
        </button>
      </form>
    </div>
  </main>
)

export default SignupPage