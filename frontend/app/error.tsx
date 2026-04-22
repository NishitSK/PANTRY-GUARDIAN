'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error Boundary]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#F6F1E7] flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full border-4 border-black bg-white p-10 shadow-[12px_12px_0_#000] text-center">
        <h1 className="text-4xl font-black uppercase mb-6 bg-[#FFD2CC] inline-block px-4 border-2 border-black">
          Critical System Error
        </h1>
        
        <div className="bg-black text-white p-6 mb-8 text-left font-mono text-sm overflow-auto max-h-[300px]">
          <p className="text-[#FFD2CC] font-bold mb-2">Message: {error.message || 'No message provided'}</p>
          <p className="text-white/60 mb-4 text-xs">Digest: {error.digest || 'No digest'}</p>
          <hr className="border-white/20 mb-4" />
          <pre className="whitespace-pre-wrap text-[10px]">
            {error.stack || 'Stack trace unavailable in production'}
          </pre>
        </div>

        <p className="text-lg font-bold mb-8 text-black/70">
          The application crashed during server-side rendering.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="border-2 border-black bg-[#FFE66D] px-8 py-3 font-black uppercase tracking-widest hover:translate-x-1 hover:-translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0_#000]"
          >
            Attempt Recovery
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="border-2 border-black bg-white px-8 py-3 font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
          >
            Back to Safety
          </button>
        </div>
        
        <div className="mt-10 pt-6 border-t-2 border-black/10 text-[10px] uppercase font-black tracking-widest text-black/40">
          Pantry Guardian Intelligence Engine • Diagnostic Mode
        </div>
      </div>
    </div>
  )
}
