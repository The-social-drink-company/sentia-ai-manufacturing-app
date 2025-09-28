import { SignIn } from '@clerk/clerk-react'

const ClerkSignIn = () => (
  <div className="flex min-h-screen flex-col bg-slate-950 text-white lg:flex-row">
    <div className="flex flex-1 flex-col justify-center space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-10">
      <p className="text-xs uppercase tracking-[0.4em] text-sky-400">Sentia Manufacturing</p>
      <h1 className="text-4xl font-semibold tracking-tight">Welcome back</h1>
      <p className="max-w-md text-sm text-slate-300">
        Secure access to the manufacturing command centre. Review liquidity, production, and quality metrics with AI-powered guidance.
      </p>
      <ul className="space-y-2 text-sm text-slate-300">
        <li>• Real-time working capital analytics</li>
        <li>• Production and quality alerts in one place</li>
        <li>• AI assistant for scenario planning</li>
      </ul>
    </div>
    <div className="flex flex-1 items-center justify-center bg-slate-900/80 p-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/90 p-6 shadow-2xl">
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" afterSignInUrl="/dashboard" />
      </div>
    </div>
  </div>
)

export default ClerkSignIn
