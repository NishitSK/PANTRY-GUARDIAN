import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-textMain">
      <div className="border-2 border-black bg-surface p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-center max-w-md w-full">
        <p className="font-ibm-mono text-xs uppercase tracking-[0.2em] mb-4 text-textMuted">Authenticating</p>
        <h1 className="font-anton text-4xl uppercase mb-6">Securing Access</h1>
        <p className="font-ibm-mono text-sm">Please wait while we verify your credentials...</p>
        <div className="mt-8">
          <AuthenticateWithRedirectCallback />
        </div>
      </div>
    </div>
  )
}
